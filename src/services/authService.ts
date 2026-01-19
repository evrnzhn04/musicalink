import { Linking } from 'react-native';
import InAppBrowser from 'react-native-inappbrowser-reborn';
import EncryptedStorage from 'react-native-encrypted-storage';
import { CLIENT_ID, REDIRECT_URI, SPOTIFY_AUTH_URL, SPOTIFY_TOKEN_URL, SCOPES, TOKEN_KEYS } from '../api/spotify';
import { generateRandomString, generateCodeChallenge } from '../utils/pkce';

// Verifier'ı geçici olarak saklamak için
let codeVerifier: string | null = null;

// Spotify login URL'i oluştur ve tarayıcıyı aç
export async function startSpotifyLogin(): Promise<string | null> {
    console.log('CLIENT_ID:', CLIENT_ID);
    console.log('REDIRECT_URI:', REDIRECT_URI);

    codeVerifier = generateRandomString(128);
    const codeChallenge = generateCodeChallenge(codeVerifier);

    if (!CLIENT_ID || !REDIRECT_URI) {
        console.error('Missing Spotify configuration: CLIENT_ID or REDIRECT_URI not set');
        return null;
    }

    const authUrl = `${SPOTIFY_AUTH_URL}?` +
        `client_id=${CLIENT_ID}` +
        `&response_type=code` +
        `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
        `&scope=${encodeURIComponent(SCOPES)}` +
        `&code_challenge=${codeChallenge}` +
        `&code_challenge_method=S256`;

    try {
        if (await InAppBrowser.isAvailable()) {
            const result = await InAppBrowser.openAuth(authUrl, REDIRECT_URI, {
                dismissButtonStyle: 'close',
                showTitle: true,
                enableUrlBarHiding: true,
                enableDefaultShare: false,
            });

            if (result.type === 'success' && result.url) {
                // URL'den code'u çıkar
                const codeMatch = result.url.match(/code=([^&]+)/);
                const code = codeMatch ? codeMatch[1] : null;
                return code;
            }
        }
    } catch (error) {
        console.error('Auth error:', error);
    }

    return null;
}

// Authorization code'u token'larla değiştir
export async function exchangeCodeForTokens(code: string): Promise<{
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
}> {
    if (!codeVerifier) {
        throw new Error('Code verifier not found');
    }

    const response = await fetch(SPOTIFY_TOKEN_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
            grant_type: 'authorization_code',
            code: code,
            redirect_uri: REDIRECT_URI || '',
            client_id: CLIENT_ID || '',
            code_verifier: codeVerifier,
        }).toString(),
    });

    if (!response.ok) {
        throw new Error('Token exchange failed');
    }

    const data = await response.json();

    // Token'ları güvenli depolamaya kaydet
    await EncryptedStorage.setItem(TOKEN_KEYS.ACCESS_TOKEN, data.access_token);
    await EncryptedStorage.setItem(TOKEN_KEYS.REFRESH_TOKEN, data.refresh_token);
    await EncryptedStorage.setItem(
        TOKEN_KEYS.EXPIRES_AT,
        String(Date.now() + data.expires_in * 1000)
    );

    // Verifier'ı temizle
    codeVerifier = null;

    return {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresIn: data.expires_in,
    };
}

// Token'ın geçerli olup olmadığını kontrol et
export async function getValidAccessToken(): Promise<string | null> {
    try {
        const accessToken = await EncryptedStorage.getItem(TOKEN_KEYS.ACCESS_TOKEN);
        const expiresAt = await EncryptedStorage.getItem(TOKEN_KEYS.EXPIRES_AT);

        if (!accessToken || !expiresAt) {
            return null;
        }

        const expiryTime = parseInt(expiresAt, 10);
        const now = Date.now();
        const fiveMinutes = 5 * 60 * 1000;

        // Token 5 dakikadan az kaldıysa yenile
        if (expiryTime - now < fiveMinutes) {
            console.log('Token expiring soon, refreshing...');
            const newTokens = await refreshAccessToken();
            return newTokens?.accessToken || null;
        }

        return accessToken;
    } catch (error) {
        console.error('Get valid token error:', error);
        return null;
    }
}

// Token yenileme fonksiyonu
export async function refreshAccessToken(): Promise<{
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
} | null> {
    try {
        const currentRefreshToken = await EncryptedStorage.getItem(TOKEN_KEYS.REFRESH_TOKEN);

        if (!currentRefreshToken) {
            return null;
        }

        const response = await fetch(SPOTIFY_TOKEN_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                grant_type: 'refresh_token',
                refresh_token: currentRefreshToken,
                client_id: CLIENT_ID || '',
            }).toString(),
        });

        if (!response.ok) {
            return null;
        }

        const data = await response.json();

        // Yeni token'ları kaydet
        await EncryptedStorage.setItem(TOKEN_KEYS.ACCESS_TOKEN, data.access_token);
        if (data.refresh_token) {
            await EncryptedStorage.setItem(TOKEN_KEYS.REFRESH_TOKEN, data.refresh_token);
        }
        await EncryptedStorage.setItem(
            TOKEN_KEYS.EXPIRES_AT,
            String(Date.now() + data.expires_in * 1000)
        );

        return {
            accessToken: data.access_token,
            refreshToken: data.refresh_token || currentRefreshToken,
            expiresIn: data.expires_in,
        };
    } catch (error) {
        console.error('Token refresh error:', error);
        return null;
    }
}

// ==================== SUPABASE AUTH ====================
import { supabase } from '../api/supabase';

/**
 * Spotify ID kullanarak Supabase Auth'a giriş yap veya kayıt ol
 * @param spotifyId - Spotify kullanıcı ID'si
 * @returns Supabase Auth user ID veya null
 */
export async function signInToSupabase(spotifyId: string): Promise<string | null> {
    const email = `${spotifyId}@spotify.musicalink.app`;
    const password = `${spotifyId}_musicalink_secure_2024`;

    try {
        // Önce giriş yapmayı dene
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (signInData.user) {
            console.log('Supabase Auth: Mevcut kullanıcı giriş yaptı');
            return signInData.user.id;
        }

        // Kullanıcı yoksa kayıt ol
        if (signInError?.message.includes('Invalid login credentials')) {
            const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
                email,
                password,
            });

            if (signUpData.user) {
                console.log('Supabase Auth: Yeni kullanıcı oluşturuldu');
                return signUpData.user.id;
            }

            if (signUpError) {
                console.error('Supabase signUp error:', signUpError);
                return null;
            }
        }

        console.error('Supabase signIn error:', signInError);
        return null;
    } catch (error) {
        console.error('Supabase auth error:', error);
        return null;
    }
}

/**
 * Supabase Auth'dan çıkış yap
 */
export async function signOutFromSupabase(): Promise<void> {
    try {
        await supabase.auth.signOut();
        console.log('Supabase Auth: Çıkış yapıldı');
    } catch (error) {
        console.error('Supabase signOut error:', error);
    }
}

/**
 * Mevcut Supabase Auth kullanıcı ID'sini getir
 */
export async function getSupabaseUserId(): Promise<string | null> {
    const { data } = await supabase.auth.getUser();
    return data.user?.id || null;
}
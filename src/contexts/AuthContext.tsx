import { createContext, ReactNode, useContext, useEffect, useState, useRef } from "react";
import { AppState, AppStateStatus } from "react-native";
import { AuthState, SpotifyTokens, UserProfile } from "../types/auth.types";
import { exchangeCodeForTokens, getValidAccessToken, startSpotifyLogin, signInToSupabase, signOutFromSupabase } from '../services/authService';
import EncryptedStorage from "react-native-encrypted-storage";
import { getSpotifyProfile, getTopArtists } from "../services/spotifyService";
import { getProfileBySupabaseId, syncTopArtists } from "../services/profileService";
import { updatePresence } from "../services/presenceService";

interface AuthContextType extends AuthState {
    login: () => Promise<void>;
    logout: () => Promise<void>;
    setUser: (user: UserProfile | null) => void;
    setSpotifyTokens: (tokens: SpotifyTokens | null) => void;
    setHasProfile: (value: boolean) => void;
    supabaseUserId: string | null;
}

const initialState: AuthState = {
    isLoading: true,
    isAuthenticated: false,
    user: null,
    spotifyTokens: null,
    spotifyUser: null,
    hasProfile: false,
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [state, setState] = useState<AuthState>(initialState);
    const [supabaseUserId, setSupabaseUserId] = useState<string | null>(null);

    const login = async () => {
        setState(prev => ({ ...prev, isLoading: true }));
        const code = await startSpotifyLogin();
        if (code) {
            console.log('Authorization code:', code);
            try {
                const tokens = await exchangeCodeForTokens(code);
                console.log('Tokens received:', tokens);
                setSpotifyTokens({
                    accessToken: tokens.accessToken,
                    refreshToken: tokens.refreshToken,
                    expiresAt: Date.now() + tokens.expiresIn * 1000,
                });

                const spotifyProfile = await getSpotifyProfile();

                if (spotifyProfile) {
                    // Supabase Auth'a giriş yap
                    const supabaseId = await signInToSupabase(spotifyProfile.id);
                    setSupabaseUserId(supabaseId);
                    console.log('Supabase User ID:', supabaseId);

                    // Profil kontrolü - artık Supabase Auth ID ile
                    const existingProfile = supabaseId ? await getProfileBySupabaseId(supabaseId) : null;

                    setState(prev => ({
                        ...prev,
                        isAuthenticated: true,
                        isLoading: false,
                        spotifyUser: spotifyProfile,
                        hasProfile: !!existingProfile,
                        user: existingProfile,
                    }));
                } else {
                    setState(prev => ({ ...prev, isLoading: false }));
                }
            } catch (error) {
                console.error('Token exchange error:', error);
                setState(prev => ({ ...prev, isLoading: false }));
            }
        } else {
            setState(prev => ({ ...prev, isLoading: false }));
        }
    };
    const logout = async () => {
        // Kullanıcıyı offline yap
        if (supabaseUserId) {
            await updatePresence(supabaseUserId, false);
        }

        // Supabase Auth'dan çıkış
        await signOutFromSupabase();
        setSupabaseUserId(null);

        setState({
            ...initialState,
            isLoading: false
        });

        await EncryptedStorage.removeItem('spotify_access_token');
        await EncryptedStorage.removeItem('spotify_refresh_token');
        await EncryptedStorage.removeItem('spotify_expires_at');
    };
    const setUser = (user: UserProfile | null) => {
        setState(prev => ({ ...prev, user, isAuthenticated: !!user }));
    }
    const setSpotifyTokens = (spotifyTokens: SpotifyTokens | null) => {
        setState(prev => ({ ...prev, spotifyTokens }));
    };

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const validToken = await getValidAccessToken();

                if (validToken) {
                    // Token'ları set et
                    const refreshToken = await EncryptedStorage.getItem('spotify_refresh_token');
                    const expiresAt = await EncryptedStorage.getItem('spotify_expires_at');

                    setSpotifyTokens({
                        accessToken: validToken,
                        refreshToken: refreshToken || '',
                        expiresAt: parseInt(expiresAt || '0', 10),
                    });

                    // ✅ Spotify profilini çek
                    const spotifyProfile = await getSpotifyProfile();

                    if (spotifyProfile) {
                        // Supabase Auth'a giriş yap
                        const supabaseId = await signInToSupabase(spotifyProfile.id);
                        setSupabaseUserId(supabaseId);

                        // ✅ Supabase profil kontrolü
                        const existingProfile = supabaseId ? await getProfileBySupabaseId(supabaseId) : null;

                        setState(prev => ({
                            ...prev,
                            isAuthenticated: true,
                            isLoading: false,
                            spotifyUser: spotifyProfile,
                            hasProfile: !!existingProfile,
                            user: existingProfile,
                        }));

                        // Top sanatçıları sync et (profil varsa)
                        if (existingProfile) {
                            const topArtists = await getTopArtists(5);
                            if (topArtists.length > 0) {
                                await syncTopArtists(existingProfile.id, topArtists);
                            }
                        }
                    } else {
                        setState(prev => ({ ...prev, isLoading: false }));
                    }
                } else {
                    setState(prev => ({ ...prev, isLoading: false }));
                }
            } catch (error) {
                console.error('Auth check error:', error);
                setState(prev => ({ ...prev, isLoading: false }));
            }
        };
        checkAuth();
    }, []);

    const setHasProfile = (value: boolean) => {
        setState(prev => ({ ...prev, hasProfile: value }));
    };

    // AppState ile online/offline takibi
    const appState = useRef(AppState.currentState);

    useEffect(() => {
        if (!supabaseUserId) return;

        // İlk açılışta online yap
        updatePresence(supabaseUserId, true);

        const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
            if (appState.current.match(/active/) && nextAppState.match(/inactive|background/)) {
                // Uygulama arka plana geçti -> offline
                updatePresence(supabaseUserId, false);
            } else if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
                // Uygulama ön plana geldi -> online
                updatePresence(supabaseUserId, true);
            }
            appState.current = nextAppState;
        });

        return () => {
            subscription.remove();
            // Component unmount olunca offline yap
            updatePresence(supabaseUserId, false);
        };
    }, [supabaseUserId]);

    return (
        <AuthContext.Provider value={{ ...state, login, logout, setUser, setSpotifyTokens, setHasProfile, supabaseUserId }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
}
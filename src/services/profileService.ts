import { supabase } from "../api/supabase";
import { UserProfile } from "../types/auth.types";
import { ProfileSong } from "../types/spotify.types";
import RNFS from 'react-native-fs';
import { decode } from 'base64-arraybuffer';

export async function uploadAvatar(userId: string, localUri: string): Promise<string | null> {
    try {
        // 1. Önce eski avatarları temizle (userId ile başlayan tüm dosyaları sil)
        const { data: listData } = await supabase.storage
            .from('avatars')
            .list('', { search: userId });

        if (listData && listData.length > 0) {
            const filesToRemove = listData.map(x => x.name);
            await supabase.storage
                .from('avatars')
                .remove(filesToRemove);
        }

        // 2. Yeni dosya adı oluştur
        const extension = localUri.split('.').pop()?.toLowerCase() || 'jpg';
        const fileName = `${userId}_${Date.now()}.${extension}`; // Timestamp ekleyerek benzersiz yap
        const contentType = extension === 'png' ? 'image/png' : 'image/jpeg';

        // 3. Dosyayı base64 olarak oku
        const base64Data = await RNFS.readFile(localUri, 'base64');
        const arrayBuffer = decode(base64Data);

        // 4. Supabase Storage upload
        const { error } = await supabase.storage
            .from('avatars')
            .upload(fileName, arrayBuffer, {
                upsert: true,
                contentType: contentType,
            });

        if (error) {
            console.error('Upload Error: ', error);
            return null;
        }

        // 5. Public URL al
        const { data: urlData } = supabase.storage
            .from('avatars')
            .getPublicUrl(fileName);

        // URL'ye timestamp ekle ki cache'e takılmasın
        return `${urlData.publicUrl}?t=${Date.now()}`;
    } catch (error) {
        console.error('Avatar upload error: ', error);
        return null;
    }
}

export async function checkUserNameAvailable(username: string): Promise<boolean> {
    const { data } = await supabase
        .from('profiles')
        .select('username')
        .eq('username', username)
        .single();

    return !data;
}

//Create Profile
export async function createProfile(profile: {
    id: string;
    username: string;
    display_name: string;
    bio: string;
    avatar_url: string | null;
    spotify_id: string;
    email: string;
}): Promise<boolean> {
    const { error } = await supabase
        .from('profiles')
        .insert(profile);

    if (error) {
        console.error('Supabase insert error:', error);  // ← EKLE
    }

    return !error;
}

export async function getProfile(spotifyId: string): Promise<UserProfile | null> {
    const { data } = await supabase.from('profiles').select('*').eq('spotify_id', spotifyId).single();

    return data;
}

// Supabase Auth ID ile profil getir
export async function getProfileBySupabaseId(supabaseUserId: string): Promise<UserProfile | null> {
    const { data } = await supabase.from('profiles').select('*').eq('id', supabaseUserId).single();

    return data;
}

export async function addProfileSong(userId: string, song: ProfileSong): Promise<boolean> {
    const { error } = await supabase.from('profile_songs').insert({
        user_id: userId,
        spotify_track_id: song.spotify_track_id,
        track_name: song.track_name,
        artist_name: song.artist_name,
        album_image_url: song.album_image_url,
        order: song.order
    });

    if (error) {
        console.error('addProfileSong Error:', error);
        return false;
    }
    return true;
}

export async function getProfileSongs(userId: string): Promise<ProfileSong[]> {
    const { data } = await supabase.from('profile_songs').select('*').eq('user_id', userId).order('order', { ascending: true })

    if (!data) {
        console.error('Failed to fetch songs from the database: getProfileSongs error.');
        return []
    }

    return data
}

export async function deleteProfileSong(songId: string): Promise<boolean> {
    const { error } = await supabase.from('profile_songs').delete().eq('spotify_track_id', songId)

    if (error) {
        console.error('Profile song delete error (profileService)', error);
        return false;
    }
    return true;
}

export async function updateProfile(userId: string, updates: Partial<UserProfile>): Promise<boolean> {
    const { error } = await supabase.from('profiles').update(updates).eq('id', userId)

    if (error) {
        console.error('Update profile error (updateProfile service):', error);
        return false;
    }
    return true;
}

export async function getFollowStatus(myId: string, targetId: string): Promise<'none' | 'following'> {
    const { data } = await supabase
        .from('friendships')
        .select('status')
        .eq('requester_id', myId)
        .eq('receiver_id', targetId)
        .single();

    return data ? 'following' : 'none';
}

export async function searchUsers(query: string, currentUserId?: string): Promise<UserProfile[]> {
    if (!query.trim()) return [];

    let queryBuilder = supabase
        .from('profiles')
        .select('*')
        .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`);

    if (currentUserId) {
        queryBuilder = queryBuilder.neq('id', currentUserId);
    }

    const { data, error } = await queryBuilder.limit(20);

    if (error) {
        console.error('Search users error:', error);
        return [];
    }
    return data || [];
}

// Top Artists - Supabase'e kaydet (Edge Function üzerinden)
export async function syncTopArtists(userId: string, artists: { id: string; name: string; imageUrl: string }[]): Promise<boolean> {
    try {
        const Config = require('react-native-config').default;
        const EDGE_FUNCTION_URL = `${Config.SUPABASE_URL}/functions/v1/sync-top-artists`;
        
        const response = await fetch(EDGE_FUNCTION_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                userId,
                artists: artists.map(a => ({
                    spotify_artist_id: a.id,
                    artist_name: a.name,
                    artist_image_url: a.imageUrl,
                }))
            })
        });

        const data = await response.json();
        console.log('Sync top artists result:', data);
        return data.success;
    } catch (error) {
        console.error('syncTopArtists error:', error);
        return false;
    }
}

// Top Artists - Supabase'den getir
export async function getTopArtistsFromDB(userId: string): Promise<{ id: string; name: string; imageUrl: string }[]> {
    const { data, error } = await supabase
        .from('top_artists')
        .select('*')
        .eq('user_id', userId)
        .order('rank', { ascending: true });

    if (error) {
        console.error('getTopArtistsFromDB error:', error);
        return [];
    }

    return (data || []).map(item => ({
        id: item.spotify_artist_id,
        name: item.artist_name,
        imageUrl: item.artist_image_url
    }));
}
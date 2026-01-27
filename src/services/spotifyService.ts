import spotifyApi from "../api/spotifyApi";
import { CurrentTrack, ProfileSong, TopArtist } from "../types/spotify.types";

export async function getSpotifyProfile() {
    try {
        const response = await spotifyApi.get('/me');
        const data = response.data;
        return {
            id: data.id,
            displayName: data.display_name,
            email: data.email,
            avatarUrl: data.images?.[0]?.url || null,
            isPremium: data.product === 'premium',
        }
    } catch (error) {
        //console.log('Error: ', error);
        return null;
    }
}

export async function searchTracks(query: string): Promise<ProfileSong[]> {
    try {
        const response = await spotifyApi.get('/search', {
            params: {
                q: query,
                type: 'track',
                limit: 10
            }
        });
        const data = response.data;
        const item = data.tracks.items;
        return item.map((item: any) => ({
            id: item.id,
            spotify_track_id: item.id,
            track_name: item.name,
            artist_name: item.artists[0].name,
            album_image_url: item.album.images[0]?.url || ''
        }))
    } catch (error) {
        //console.error('Search error: ', error);
        return [];
    }
}

export async function getTopArtists(limit: number = 5): Promise<TopArtist[]> {
    try {
        const response = await spotifyApi.get('/me/top/artists', {
            params: {
                limit: limit,
                time_range: 'medium_term'
            }
        });
        const items = response.data.items;
        return items.map((item: any) => ({
            id: item.id,
            name: item.name,
            imageUrl: item.images[0]?.url || ''
        }));
    } catch (error) {
        //console.error('Top artists error: ', error);
        return [];
    }
}

export async function getCurrentlyPlaying(): Promise<CurrentTrack | null> {
    try {
        const response = await spotifyApi.get('/me/player/currently-playing');
        if (response.status === 204 || !response.data) {
            return null;
        }

        const data = response.data;
        if (!data.item) {
            return null;
        }

        return {
            id: data.item.id,
            name: data.item.name,
            artist: data.item.artists[0].name,
            albumName: data.item.album.name,
            albumImage: data.item.album.images[0]?.url || '',
            isPlaying: data.is_playing,
            progressMs: data.progress_ms,
            durationMs: data.item.duration_ms,
        }
    } catch (error) {
        //console.error('Currently playing error:', error);
        return null;
    }
}

export async function pausePlayback(): Promise<boolean> {
    try {
        await spotifyApi.put('/me/player/pause');
        return true;
    } catch (error) {
        //console.error('Pause error:', error);
        return false;
    }
}

export async function resumePlayback(): Promise<boolean> {
    try {
        await spotifyApi.put('/me/player/play');
        return true;
    } catch (error) {
        //console.error('Resume error:', error);
        return false;
    }
}

export async function skipToNext(): Promise<boolean> {
    try {
        await spotifyApi.post('/me/player/next');
        return true;
    } catch (error) {
        //console.error('Skip next error:', error);
        return false;
    }
}

export async function skipToPrevious(): Promise<boolean> {
    try {
        await spotifyApi.post('/me/player/previous');
        return true;
    } catch (error) {
        //console.error('Skip previous error:', error);
        return false;
    }
}

/**
 * Belirli bir şarkıyı çal
 * @param trackUri - Spotify track URI (spotify:track:xxxxx)
 * @returns 'success' | 'not_premium' | 'no_device' | 'error'
 */
export async function playTrack(trackUri: string): Promise<'success' | 'not_premium' | 'no_device' | 'error'> {
    try {
        await spotifyApi.put('/me/player/play', {
            uris: [trackUri]
        });
        return 'success';
    } catch (error: any) {
        const status = error?.response?.status;
        const reason = error?.response?.data?.error?.reason;
        
        //console.error('Play track error:', status, reason, error?.response?.data);
        
        if (status === 403) {
            // Premium gerekli
            return 'not_premium';
        }
        if (status === 404 || reason === 'NO_ACTIVE_DEVICE') {
            // Aktif cihaz yok
            return 'no_device';
        }
        return 'error';
    }
}
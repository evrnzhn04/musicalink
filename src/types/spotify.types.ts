export interface CurrentTrack {
    id: string;
    name: string;
    artist: string;
    albumName: string;
    albumImage: string;
    isPlaying: boolean;
    progressMs: number;
    durationMs: number;
}

export interface ProfileSong {
    id: string;
    spotify_track_id: string;
    track_name: string;
    artist_name: string;
    album_image_url: string;
    order: number;
}

export interface SpotifyApiError {
    status: number;
    message: string;
}

export interface TopArtist {
    id: string;
    name: string;
    imageUrl: string;
}
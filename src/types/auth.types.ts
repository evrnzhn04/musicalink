export interface SpotifyTokens {
    accessToken: string;
    refreshToken: string;
    expiresAt: number;
}

export interface SpotifyUser {
    id: string;
    displayName: string;
    email: string;
    avatarUrl: string | null;
    isPremium: boolean;
}

export interface UserProfile {
    id: string;
    username: string;
    display_name: string;
    avatar_url: string | null;
    spotify_id: string;
    email: string;
    bio: string | null;
    current_track?: any;
    is_online?: boolean;
    last_seen?: string;
    created_at?: string;
    updated_at?: string;
}

export interface AuthState {
    isLoading: boolean;
    isAuthenticated: boolean;
    user: UserProfile | null;
    spotifyTokens: SpotifyTokens | null;
    spotifyUser: SpotifyUser | null;
    hasProfile: boolean;
}
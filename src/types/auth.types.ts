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
    display_name: string;     // snake_case
    avatar_url: string | null; // snake_case
    spotify_id: string;        // snake_case
    email: string;
    bio: string | null;
    current_track?: any;       // snake_case
    is_online?: boolean;       // snake_case
    last_seen?: string;        // snake_case
    created_at?: string;       // snake_case
    updated_at?: string;       // snake_case
}

export interface AuthState {
    isLoading: boolean;
    isAuthenticated: boolean;
    user: UserProfile | null;
    spotifyTokens: SpotifyTokens | null;
    spotifyUser: SpotifyUser | null;
    hasProfile: boolean;
}
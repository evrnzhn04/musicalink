import Config from "react-native-config";

const CLIENT_ID = Config.SPOTIFY_CLIENT_ID;
const REDIRECT_URI = Config.SPOTIFY_REDIRECT_URI;

const SPOTIFY_AUTH_URL = 'https://accounts.spotify.com/authorize';
const SPOTIFY_TOKEN_URL = 'https://accounts.spotify.com/api/token';
const SPOTIFY_API_URL = 'https://api.spotify.com/v1';

const SCOPES = [
    'user-read-private',
    'user-read-email',
    'user-read-currently-playing',
    'user-read-playback-state',
    'user-top-read',
    'user-modify-playback-state',
].join(' ');

const TOKEN_KEYS = {
    ACCESS_TOKEN: 'spotify_access_token',
    REFRESH_TOKEN: 'spotify_refresh_token',
    EXPIRES_AT: 'spotify_expires_at',
};

export { CLIENT_ID, REDIRECT_URI, SPOTIFY_AUTH_URL, SPOTIFY_TOKEN_URL, SPOTIFY_API_URL, SCOPES, TOKEN_KEYS }
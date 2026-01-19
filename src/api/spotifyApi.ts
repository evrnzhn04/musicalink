import axios from 'axios';
import { getValidAccessToken } from '../services/authService';

const spotifyApi = axios.create({
    baseURL: 'https://api.spotify.com/v1',
});

spotifyApi.interceptors.request.use(
    async (config) => {
        const token = await getValidAccessToken();
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default spotifyApi;
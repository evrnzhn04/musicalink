import { sha256 } from 'js-sha256';
import { encode as btoa } from 'base-64';

// Rastgele string oluştur (code_verifier için)
export function generateRandomString(length: number): string {
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return result;
}

// Base64 URL encode (standart base64'ten farklı)
function base64UrlEncode(buffer: Uint8Array): string {
    let binary = '';
    for (let i = 0; i < buffer.length; i++) {
        binary += String.fromCharCode(buffer[i]);
    }
    return btoa(binary)
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
}

// SHA-256 hash ve base64url encode
export function generateCodeChallenge(verifier: string): string {
    const hash = sha256.array(verifier);
    return base64UrlEncode(new Uint8Array(hash));
}
import jwt from 'jsonwebtoken';

// OAuth configuration from environment variables
const AUTH_SERVER_URL = process.env.AUTH_SERVER_URL || '';
const AUTH_REDIRECT_URI = process.env.AUTH_REDIRECT_URI || '';

export interface TokenResponse {
    access_token: string;
    refresh_token?: string;
    expires_in?: number;
    token_type?: string;
}

export interface UserInfo {
    sub: string;
    email?: string;
    name?: string;
    [key: string]: any;
}

/**
 * Exchange authorization code for access token
 */
export async function exchangeCodeForToken(code: string): Promise<TokenResponse> {
    try {
        const response = await fetch(`${AUTH_SERVER_URL}/oauth/token`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                grant_type: 'authorization_code',
                code: code,
                redirect_uri: AUTH_REDIRECT_URI
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Token exchange failed: ${response.status} - ${errorText}`);
        }

        const tokenData = await response.json();
        return tokenData as TokenResponse;
    } catch (error) {
        console.error('Error exchanging code for token:', error);
        throw error;
    }
}

/**
 * Refresh an access token using a refresh token
 */
export async function refreshAccessToken(refreshToken: string): Promise<TokenResponse> {
    try {
        const response = await fetch(`${AUTH_SERVER_URL}/oauth/token`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                grant_type: 'refresh_token',
                refresh_token: refreshToken
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Token refresh failed: ${response.status} - ${errorText}`);
        }

        const tokenData = await response.json();
        return tokenData as TokenResponse;
    } catch (error) {
        console.error('Error refreshing access token:', error);
        throw error;
    }
}

/**
 * Revoke an access or refresh token
 */
export async function revokeToken(token: string): Promise<void> {
    // Skip if token is empty or undefined

    console.log('Revoking token:', token ? '****' + token.slice(-4) : 'no token provided');
    if (!token || token.trim() === '') {
        return;
    }


    
    try {
        const response = await fetch(`${AUTH_SERVER_URL}/oauth/revoke`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                refresh_token: token
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.warn(`Token revocation warning: ${response.status} - ${errorText}`);
        }
    } catch (error) {
        console.error('Error revoking token:', error);
        // Don't throw - revocation is best effort
    }
}

/**
 * Get user info from access token (JWT decode or API call)
 */
export async function getUserInfo(accessToken: string): Promise<UserInfo> {
    try {
        // First try to decode JWT if it's a JWT token
        const decoded = jwt.decode(accessToken);
        if (decoded && typeof decoded === 'object') {
            return decoded as UserInfo;
        }

        // If not a JWT or decode failed, call userinfo endpoint
        const response = await fetch(`${AUTH_SERVER_URL}/oauth/userinfo`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to get user info: ${response.status} - ${errorText}`);
        }

        const userInfo = await response.json();
        return userInfo as UserInfo;
    } catch (error) {
        console.error('Error getting user info:', error);
        throw error;
    }
}

/**
 * Generate OAuth authorization URL
 */
export function getAuthorizationUrl(state: string, redirectPath?: string): string {
    const params = new URLSearchParams({
        response_type: 'code',
        redirect_uri: AUTH_REDIRECT_URI,
        state: state
    });

    if (redirectPath) {
        params.append('redirect_path', redirectPath);
    }

    return `${AUTH_SERVER_URL}/oauth/authorize?${params.toString()}`;
}

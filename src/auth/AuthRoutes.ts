/// <reference path="../types/session.d.ts" />
import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import {
    exchangeCodeForToken,
    getUserInfo,
    revokeToken,
    getAuthorizationUrl
} from './OAuthConfig';

const router = Router();

/**
 * GET /auth/login
 * Initiates OAuth login flow
 * Query params:
 *   - redirect: Optional URL to redirect to after successful login
 */
router.get('/login', (req, res) => {
    try {
        // Generate a random state parameter for CSRF protection
        const state = crypto.randomBytes(16).toString('hex');
        
        console.log('=== OAuth Login Debug ===');
        console.log('Generated state:', state);
        console.log('Session ID:', req.sessionID);
        console.log('Session before save:', req.session);
        
        // Store state in session for verification
        if (req.session) {
            req.session.oauth_state = state;
            
            // Store the redirect URL if provided
            const redirectUrl = req.query.redirect as string;
            if (redirectUrl) {
                req.session.post_login_redirect = redirectUrl;
            }
            
            console.log('Session after setting state:', req.session);
            
            // Explicitly save the session before redirect
            req.session.save((err) => {
                if (err) {
                    console.error('Error saving session:', err);
                    res.status(500).send('Failed to save session');
                    return;
                }
                
                console.log('Session saved successfully');
                
                // Redirect to OAuth provider
                const authUrl = getAuthorizationUrl(state);
                console.log('Redirecting to auth URL:', authUrl);   
                res.redirect(authUrl);
            });
        } else {
            res.status(500).send('Session not available');
        }
    } catch (error) {
        console.error('Error initiating login:', error);
        res.status(500).send('Failed to initiate login');
    }
});

/**
 * GET /auth/callback
 * OAuth callback endpoint
 * Query params:
 *   - code: Authorization code from OAuth provider
 *   - state: State parameter for CSRF verification
 */
router.get('/callback', async (req, res) => {
    try {
        const { code, state } = req.query;

        console.log('=== OAuth Callback Debug ===');
        console.log('Incoming state:', state);
        console.log('Cookies received:', req.headers.cookie);
        console.log('Session oauth_state:', req.session?.oauth_state);
        console.log('Session ID:', req.sessionID);
        console.log('Session:', req.session);

        // Validate required parameters
        if (!code || typeof code !== 'string') {
            res.status(400).send('Missing authorization code');
            return;
        }

        if (!state || typeof state !== 'string') {
            res.status(400).send('Missing state parameter');
            return;
        }

        // Verify state parameter
        if (!req.session || req.session.oauth_state !== state) {
            console.error('State mismatch! Expected:', req.session?.oauth_state, 'Got:', state);
            res.status(403).send('Invalid state parameter - possible CSRF attack');
            return;
        }

        // Clear the state from session
        delete req.session.oauth_state;

        // Exchange code for tokens
        const tokenResponse = await exchangeCodeForToken(code);

        // Get user info
        const userInfo = await getUserInfo(tokenResponse.access_token);

        // Store tokens and user info in session
        if (req.session) {
            req.session.accessToken = tokenResponse.access_token;
            req.session.refreshToken = tokenResponse.refresh_token;
            req.session.user = {
                id: userInfo.sub,
                email: userInfo.email,
                name: userInfo.name
            };
        }

        // Redirect to the original URL or dashboard
        const redirectUrl = req.session?.post_login_redirect || '/tasks';
        
        // Clear the redirect URL from session
        if (req.session?.post_login_redirect) {
            delete req.session.post_login_redirect;
        }

        res.redirect(redirectUrl);
    } catch (error) {
        console.error('Error in OAuth callback:', error);
        res.status(500).send('Authentication failed');
    }
});

/**
 * GET /auth/logout
 * Logs out the user and clears session
 * Query params:
 *   - redirect: Optional URL to redirect to after logout (default: /)
 */
router.get('/logout', async (req, res) => {
    try {
        // Revoke tokens if they exist
        if (req.session?.accessToken) {
            await revokeToken(req.session.accessToken);
        }

        if (req.session?.refreshToken) {
            await revokeToken(req.session.refreshToken);
        }

        // Get redirect URL before destroying session
        const redirectUrl = (req.query.redirect as string) || '/';

        // Destroy session
        req.session?.destroy((err) => {
            if (err) {
                console.error('Error destroying session:', err);
            }
        });

        res.redirect(redirectUrl);
    } catch (error) {
        console.error('Error during logout:', error);
        res.status(500).send('Logout failed');
    }
});

/**
 * GET /auth/status
 * Returns current authentication status
 */
router.get('/status', (req, res) => {
    if (req.session?.user) {
        res.json({
            authenticated: true,
            user: req.session.user
        });
    } else {
        res.json({
            authenticated: false
        });
    }
});

export default router;

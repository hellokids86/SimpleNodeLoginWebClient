import 'express-session';

declare module 'express-session' {
    interface SessionData {
        oauth_state?: string;
        post_login_redirect?: string;
        accessToken?: string;
        refreshToken?: string;
        user?: {
            id: string;
            email?: string;
            name?: string;
            roles?: string[];
        };
    }
}

/// <reference path="../types/session.d.ts" />
import { Request, Response, NextFunction } from 'express';

/**
 * Middleware to protect routes requiring authentication
 * Redirects to login page if user is not authenticated
 * Preserves the original URL so user can be redirected back after login
 */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
    if (req.session && req.session.accessToken && req.session.user) {
        // User is authenticated, proceed to the route
        next();
    } else {
        // User is not authenticated, save the original URL and redirect to login
        const redirectUrl = req.originalUrl;
        res.redirect(`/auth/login?redirect=${encodeURIComponent(redirectUrl)}`);
    }
}

/**
 * Optional middleware to check if user is authenticated without redirecting
 * Attaches user info to res.locals if authenticated
 */
export function checkAuth(req: Request, res: Response, next: NextFunction): void {
    if (req.session && req.session.user) {
        res.locals.user = req.session.user;
        res.locals.isAuthenticated = true;
    } else {
        res.locals.isAuthenticated = false;
    }
    next();
}

/**
 * Middleware factory to check if user has a specific role
 * Must be used after requireAuth middleware
 * @param role - The role required to access the route (e.g., 'admin', 'editor')
 * @returns Middleware function that checks for the role
 */
export function requireRole(role: string) {
    return (req: Request, res: Response, next: NextFunction): void => {
        if (!req.session || !req.session.user) {
            res.status(401).send('Unauthorized: Not authenticated');
            return;
        }

        const userRoles = req.session.user.roles || [];
        
        if (userRoles.includes(role)) {
            next();
        } else {
            res.status(403).send(`Forbidden: Requires ${role} role`);
        }
    };
}

/**
 * Middleware factory to check if user has any of the specified roles
 * Must be used after requireAuth middleware
 * @param roles - Array of roles, user must have at least one (e.g., ['admin', 'editor'])
 * @returns Middleware function that checks for any of the roles
 */
export function requireAnyRole(roles: string[]) {
    return (req: Request, res: Response, next: NextFunction): void => {
        if (!req.session || !req.session.user) {
            res.status(401).send('Unauthorized: Not authenticated');
            return;
        }

        const userRoles = req.session.user.roles || [];
        const hasRole = roles.some(role => userRoles.includes(role));
        
        if (hasRole) {
            next();
        } else {
            res.status(403).send(`Forbidden: Requires one of: ${roles.join(', ')}`);
        }
    };
}

/**
 * Middleware factory to check if user has all specified roles
 * Must be used after requireAuth middleware
 * @param roles - Array of roles, user must have all of them
 * @returns Middleware function that checks for all roles
 */
export function requireAllRoles(roles: string[]) {
    return (req: Request, res: Response, next: NextFunction): void => {
        if (!req.session || !req.session.user) {
            res.status(401).send('Unauthorized: Not authenticated');
            return;
        }

        const userRoles = req.session.user.roles || [];
        const hasAllRoles = roles.every(role => userRoles.includes(role));
        
        if (hasAllRoles) {
            next();
        } else {
            res.status(403).send(`Forbidden: Requires all roles: ${roles.join(', ')}`);
        }
    };
}

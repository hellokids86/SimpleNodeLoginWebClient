import session from 'express-session';
import SqliteStore from 'better-sqlite3-session-store';
import Database from 'better-sqlite3';
import path from 'path';

// Initialize SQLite database for sessions
// Use DB_PATH env var for Docker persistence, default to project root for local dev
const dbPath = process.env.DB_PATH || path.join(__dirname, '../../sessions.db');
const db = new Database(dbPath);

// Create session store
const SQLiteStore = SqliteStore(session);

// Configure session middleware
export const sessionMiddleware = session({
    store: new SQLiteStore({
        client: db,
        expired: {
            clear: true,
            intervalMs: 900000 // Clean up expired sessions every 15 minutes
        }
    }),
    secret: process.env.SESSION_SECRET || 'default-secret-change-this',
    resave: false,
    saveUninitialized: true, // Changed to true to save session before redirect
    cookie: {
        secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        sameSite: 'lax' // Allow cookie to be sent on redirects
    }
});

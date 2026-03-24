declare module 'better-sqlite3-session-store' {
    import * as session from 'express-session';
    import Database from 'better-sqlite3';

    interface SqliteStoreOptions {
        client: Database.Database;
        expired?: {
            clear?: boolean;
            intervalMs?: number;
        };
    }

    function SqliteStore(session: any): new (options: SqliteStoreOptions) => session.Store;

    export = SqliteStore;
}

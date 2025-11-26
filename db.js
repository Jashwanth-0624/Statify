// db.js: CockroachDB Connection Pool (safe for serverless)
const { Pool } = require('pg');
const dotenv = require('dotenv');
const fs = require('fs');

// Load environment variables from .env file (local dev)
dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;

let pool = null;

if (!DATABASE_URL) {
    console.warn('WARNING: DATABASE_URL is not set. DB queries will return empty results. Set DATABASE_URL in environment for production.');
} else {
    // Create pool only if connection string is present
    try {
        const poolConfig = {
            connectionString: DATABASE_URL
        };

        // In many hosted environments (Render, Vercel, etc.) the SSL root cert
        // is not available at the same filesystem path as a developer machine.
        // To avoid pg attempting to open a non-existent local cert file (ENOENT),
        // allow disabling certificate verification in production by default.
        // This keeps connections working; for stricter security provide the
        // CA via environment variables and remove this bypass.
        if (process.env.NODE_ENV === 'production' || process.env.DISABLE_PG_SSL_VERIFY === 'true') {
            poolConfig.ssl = { rejectUnauthorized: false };
        }

        pool = new Pool(poolConfig);
        console.log('Database pool created. SSL configured:', !!poolConfig.ssl);
    } catch (err) {
        console.error('Failed to create DB pool:', err && err.message ? err.message : err);
        pool = null;
    }

    pool.on('connect', () => {
        console.log('Database connected successfully.');
    });

    pool.on('error', (err) => {
        console.error('Unexpected error on idle database client', err);
    });
}

/**
 * Executes a database query. If no pool is available (no DATABASE_URL),
 * returns an object mimicking pg QueryResult with empty rows.
 * @param {string} text - The SQL query text.
 * @param {any[]} params - The values to parameterize the query with.
 */
async function query(text, params) {
    if (!pool) {
        console.warn('Skipping DB query (no pool):', text);
        return { rows: [] };
    }

    try {
        console.log('EXECUTING QUERY:', text);
        const res = await pool.query(text, params);
        return res;
    } catch (err) {
        console.error('Database Query Error:', err.stack || err.message || err);
        // When running in environments without the expected SSL cert files,
        // pg can raise ENOENT during SSL setup. Instead of crashing the whole
        // function, surface a warning and return empty rows so public pages
        // degrade gracefully. If this hides real DB issues, set
        // DISABLE_PG_SSL_VERIFY=false and configure SSL properly.
        if (err && err.code === 'ENOENT') {
            console.warn('DB SSL certificate file missing; returning empty result for query.');
            return { rows: [] };
        }
        throw err;
    }
}

module.exports = {
    query,
    pool
};
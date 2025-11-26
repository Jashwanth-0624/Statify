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
    pool = new Pool({
        connectionString: DATABASE_URL
        // Add SSL configuration for production Cockroach Cloud connections if needed
    });

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
        throw err;
    }
}

module.exports = {
    query,
    pool
};
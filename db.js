// db.js: CockroachDB Connection Pool

const { Pool } = require('pg');
const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    // Add SSL configuration for production Cockroach Cloud connections
    // Example: ssl: { rejectUnauthorized: true, ca: fs.readFileSync('certs/ca.crt').toString() }
});

/**
 * Executes a database query.
 * @param {string} text - The SQL query text.
 * @param {any[]} params - The values to parameterize the query with.
 * @returns {Promise<import('pg').QueryResult>}
 */
async function query(text, params) {
    try {
        console.log('EXECUTING QUERY:', text);
        // Use parameterized queries to prevent SQL injection
        const res = await pool.query(text, params);
        return res;
    } catch (err) {
        console.error('Database Query Error:', err.stack);
        // Re-throw the error to be handled by the caller (server.js)
        throw new Error('Database operation failed.');
    }
}

// Optional: Log connection success
pool.on('connect', () => {
    console.log('Database connected successfully.');
});

module.exports = {
    query,
    pool // Exporting the pool might be useful for transactions/more advanced usage
};
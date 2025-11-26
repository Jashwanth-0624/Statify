// server.js: Main Express Application

const express = require('express');
const session = require('express-session');
const dotenv = require('dotenv');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const axios = require('axios');

// Load environment variables from .env file
dotenv.config();

// --- Configuration ---
const { query, pool } = require('./db');
const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_USERNAME = process.env.ADMIN_USERNAME;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
// Upload directory handling
// On serverless platforms (Vercel) the project filesystem is read-only.
// Use /tmp for ephemeral writable storage there, or memory storage as a fallback.
const IS_VERCEL = !!process.env.VERCEL;
let UPLOAD_DIR = process.env.UPLOAD_DIR || (IS_VERCEL ? '/tmp/uploads' : 'uploads');

// Resolve to an absolute path for static serving
const uploadDirPath = path.isAbsolute(UPLOAD_DIR) ? UPLOAD_DIR : path.join(__dirname, UPLOAD_DIR);

// --- Multer Setup for Photo Uploads ---
let upload;
try {
    // Try to ensure the upload directory exists and is writable
    if (!fs.existsSync(uploadDirPath)) {
        fs.mkdirSync(uploadDirPath, { recursive: true });
    }

    const storage = multer.diskStorage({
        destination: (req, file, cb) => cb(null, uploadDirPath),
        filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
    });
    upload = multer({ storage: storage });
    console.log('Using disk storage for uploads at', uploadDirPath);
} catch (err) {
    // If we cannot create or write to the directory, fall back to memory storage
    console.warn('Could not use disk storage for uploads, falling back to memory storage:', err.message);
    const storage = multer.memoryStorage();
    upload = multer({ storage: storage });
    // When using memory storage, further steps (like uploading to S3) are recommended for persistence
}

// --- Middleware ---
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(session({
    secret: 'a-very-secret-key-for-statify', // Should be a strong, random key
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 * 24 } // 24 hours
}));

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));
// Serve uploaded photos (use resolved uploadDirPath)
app.use('/uploads', express.static(uploadDirPath));

// Middleware to check for admin authentication
const requireAdmin = (req, res, next) => {
    if (req.session.isAdmin) {
        next();
    } else {
        // Simple redirect to login page for unauthorized access
        res.redirect('/login');
    }
};

// --- Routes ---

// 1. Home Route
// Helper to safely send public files and report errors rather than crashing
function safeSendPublic(res, relativePath) {
    const filePath = path.join(__dirname, 'public', relativePath);
    res.sendFile(filePath, (err) => {
        if (err) {
            console.error('Failed to send file', filePath, err && err.message ? err.message : err);
            // Expose some basic error to the browser so Vercel logs are visible
            res.status(500).send(`<pre>Server error: ${String(err && err.message ? err.message : err)}</pre>`);
        }
    });
}

app.get('/', (req, res) => {
    safeSendPublic(res, 'index.html');
});

// 2. Admin Login/Logout
app.get('/login', (req, res) => {
    // If already logged in, redirect to add player page
    if (req.session.isAdmin) {
        return res.redirect('/add-player');
    }
    safeSendPublic(res, 'login.html');
});

app.post('/login', (req, res) => {
    const { username, password } = req.body;
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
        req.session.isAdmin = true;
        req.session.username = username; // Store username for audit logs
        return res.redirect('/add-player');
    }
    // Simple redirect back to login on failure
    res.redirect('/login?error=1');
});

app.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.status(500).send('Could not log out.');
        }
        res.redirect('/');
    });
});

// 3. Public Pages
app.get('/leaderboards', (req, res) => {
    safeSendPublic(res, 'leaderboards.html');
});

app.get('/matches', (req, res) => {
    safeSendPublic(res, 'matches.html');
});

app.get('/tickets', (req, res) => {
    safeSendPublic(res, 'tickets.html');
});

app.get('/player-profile', (req, res) => {
    safeSendPublic(res, 'player-profile.html');
});

app.get('/add-player', (req, res) => {
    safeSendPublic(res, 'add-player.html');
});

// 4. Admin-Protected Pages
app.get('/schedule-match', requireAdmin, (req, res) => {
    safeSendPublic(res, 'schedule-match.html');
});

app.get('/edit-player', requireAdmin, (req, res) => {
    safeSendPublic(res, 'edit-player.html');
});

// --- API Endpoints ---

// 4. API: Top All-Rounders (Public) - Must be before :stat route
// Calculates all-rounder score based on runs, wickets, average, strike rate
app.get('/api/leaderboards/allrounders', async (req, res) => {
    try {
        const sql = `
            SELECT 
                id, 
                name, 
                team, 
                photo_url,
                runs,
                wickets,
                average,
                strike_rate,
                ROUND(
                    (COALESCE(runs, 0) / NULLIF(MAX(runs) OVER(), 0) * 30 +
                     COALESCE(wickets, 0) / NULLIF(MAX(wickets) OVER(), 0) * 30 +
                     COALESCE(average, 0) / NULLIF(MAX(average) OVER(), 0) * 20 +
                     COALESCE(strike_rate, 0) / NULLIF(MAX(strike_rate) OVER(), 0) * 20)
                , 2) as allrounder_score
            FROM players
            WHERE runs > 0 AND wickets > 0
            ORDER BY allrounder_score DESC, name ASC
            LIMIT 20;
        `;
        const result = await query(sql);
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// API: Get full player by ID (Public)
app.get('/api/players/:id', async (req, res) => {
    const id = req.params.id;
    try {
        // Accept either UUID or fallback to text match (id::text or name).
        // If the provided id looks like a UUID, query by UUID for efficiency.
        const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
        let result;
        const isUuid = uuidRegex.test(id);
        console.log(`Get player request id='${id}', isUUID=${isUuid}`);
        if (isUuid) {
            const sql = `SELECT * FROM players WHERE id = $1 LIMIT 1;`;
            result = await query(sql, [id]);
        } else {
            // Try matching id::text (in case numeric or short IDs were used) or name (case-insensitive)
            const sql = `SELECT * FROM players WHERE id::text = $1 OR lower(name) = lower($1) LIMIT 1;`;
            result = await query(sql, [id]);
        }
        if (result.rows.length === 0) return res.status(404).json({ error: 'Player not found.' });
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Get player error:', err.message);
        res.status(500).json({ error: 'Failed to fetch player.' });
    }
});

// 4a. API: Leaderboards (Public)
app.get('/api/leaderboards/:stat', async (req, res) => {
    const stat = req.params.stat.toLowerCase();
    
    // Whitelist allowed sorting columns to prevent SQL injection
    const allowedStats = ['runs', 'wickets', 'sixes', 'hundreds', 'average', 'strike_rate'];

    if (!allowedStats.includes(stat)) {
        return res.status(400).json({ error: 'Invalid statistic requested for leaderboard.' });
    }

    try {
        const sql = `
            SELECT id, name, team, photo_url, ${stat}
            FROM players
            ORDER BY ${stat} DESC, name ASC
            LIMIT 20;
        `;
        const result = await query(sql);
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 5. API: Add Player (Public)
app.post('/api/players', upload.single('photo'), async (req, res) => {
    const { name, team, photo_url: urlFromForm, runs, wickets, sixes, hundreds, matches, average, strike_rate } = req.body;
    let photo_url = urlFromForm;

    // Check if a file was uploaded
    if (req.file) {
        // Use the path where multer saved the file
        photo_url = `/uploads/${req.file.filename}`;
    }

    if (!name || !team) {
        return res.status(400).json({ error: 'Player name and team are required.' });
    }

    try {
        // Auto-calculate average = runs / matches
        const playerRuns = parseInt(runs || 0);
        const playerMatches = parseInt(matches || 0);
        let calculatedAverage = parseFloat(average || 0);
        
        if (playerMatches > 0 && (!average || average === '' || parseFloat(average) === 0)) {
            calculatedAverage = parseFloat((playerRuns / playerMatches).toFixed(2));
        }

        const sql = `
            INSERT INTO players (name, team, photo_url, runs, wickets, sixes, hundreds, matches, average, strike_rate, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, now(), now())
            RETURNING *;
        `;
        const result = await query(sql, [
            name, 
            team, 
            photo_url,
            playerRuns,
            parseInt(wickets || 0),
            parseInt(sixes || 0),
            parseInt(hundreds || 0),
            playerMatches,
            calculatedAverage,
            parseFloat(strike_rate || 0)
        ]);
        res.json({ message: 'Player added successfully!', player: result.rows[0] });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 6. API: Edit Player Stats (Admin Only)
app.put('/api/players/:id', requireAdmin, upload.single('photo'), async (req, res) => {
    const playerId = req.params.id;
    const { runs, wickets, average, sixes, hundreds, matches, strike_rate } = req.body;
    const adminUsername = req.session.username || 'unknown_admin'; // Get admin username for audit

    try {
        // 1. Fetch current player data for audit
        const getSql = `SELECT runs, wickets, average, sixes, hundreds, matches, strike_rate, photo_url FROM players WHERE id = $1;`;
        const currentResult = await query(getSql, [playerId]);
        if (currentResult.rows.length === 0) {
            return res.status(404).json({ error: 'Player not found.' });
        }
        const oldStats = currentResult.rows[0];

        // 2. Prepare for update and audit (only update provided fields)
        const updateFields = [];
        const updateValues = [];
        let paramIndex = 1; // Start parameter index for the update query

        const newStats = { ...oldStats }; // Initialize new stats with old values

        // Only update stats that were provided in the request body
        const statFields = ['runs', 'wickets', 'sixes', 'hundreds', 'matches', 'strike_rate'];
        statFields.forEach(field => {
            const newValue = req.body[field];
            if (newValue !== undefined && newValue !== '') {
                // Type casting and validation (simple numeric check)
                const numericValue = parseFloat(newValue);
                if (!isNaN(numericValue) && numericValue >= 0) {
                    updateFields.push(`${field} = $${paramIndex++}`);
                    updateValues.push(numericValue);
                    newStats[field] = numericValue; // Update newStats object
                }
            }
        });

        // Auto-calculate average = runs / matches (if runs or matches were updated)
        if ((req.body.runs !== undefined || req.body.matches !== undefined)) {
            const finalRuns = req.body.runs !== undefined ? parseFloat(req.body.runs) : oldStats.runs;
            const finalMatches = req.body.matches !== undefined ? parseFloat(req.body.matches) : oldStats.matches;
            
            if (finalMatches > 0) {
                const calculatedAverage = parseFloat((finalRuns / finalMatches).toFixed(2));
                updateFields.push(`average = $${paramIndex++}`);
                updateValues.push(calculatedAverage);
                newStats.average = calculatedAverage;
            }
        }

        // Handle photo upload if provided
        if (req.file) {
            const photo_url = `/uploads/${req.file.filename}`;
            updateFields.push(`photo_url = $${paramIndex++}`);
            updateValues.push(photo_url);
            newStats.photo_url = photo_url;
        }

        if (updateFields.length === 0) {
            return res.status(400).json({ error: 'No valid stats or photo provided for update.' });
        }

        updateValues.push(playerId); // Add player ID as the last parameter

        // 3. Execute update
        const updateSql = `
            UPDATE players
            SET ${updateFields.join(', ')}, updated_at = now()
            WHERE id = $${paramIndex}
            RETURNING *;
        `;
        const updatedResult = await query(updateSql, updateValues);
        
        // 4. Create Audit Log Entry
        const auditSql = `
            INSERT INTO player_audit (player_id, old_values, new_values, changed_by, changed_at)
            VALUES ($1, $2, $3, $4, now());
        `;
        // CockroachDB/pg uses JSONB literals for $2 and $3
        await query(auditSql, [
            playerId,
            JSON.stringify(oldStats),
            JSON.stringify(newStats),
            adminUsername
        ]);

        res.json({ message: 'Player updated and audited successfully!', player: updatedResult.rows[0] });

    } catch (error) {
        console.error('Player Update Error:', error);
        res.status(500).json({ error: error.message });
    }
});


// 7. API: Schedule Match (Admin Only)
app.post('/api/matches', requireAdmin, async (req, res) => {
    const { team1, team2, venue, start_time } = req.body;
    const createdBy = req.session.username || 'unknown_admin';

    if (!team1 || !team2 || !start_time) {
        return res.status(400).json({ error: 'Team 1, Team 2, and Start Time are required.' });
    }

    try {
        const sql = `
            INSERT INTO matches (team1, team2, venue, start_time, created_by, created_at)
            VALUES ($1, $2, $3, $4, $5, now())
            RETURNING *;
        `;
        const result = await query(sql, [team1, team2, venue, start_time, createdBy]);
        const match = result.rows[0];

        // Create demo tickets for the match: 3 stands with 10 tickets each (for demonstration)
        const stands = ['North Stand', 'East Stand', 'West Stand'];
        for (const s of stands) {
            try {
                await query(`INSERT INTO tickets (match_id, stand, total, available, created_at) VALUES ($1, $2, $3, $3, now())`, [match.id, s, 10]);
            } catch (err) {
                console.error('Ticket creation error:', err.message);
            }
        }

        res.json({ message: 'Match scheduled successfully!', match });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// API: List tickets / matches with availability (Public)
app.get('/api/tickets', async (req, res) => {
    try {
        const sql = `
            SELECT m.id AS match_id, m.team1, m.team2, m.venue, m.start_time,
                   json_agg(json_build_object('ticket_id', t.id, 'stand', t.stand, 'total', t.total, 'available', t.available) ORDER BY t.stand) AS stands
            FROM matches m
            LEFT JOIN tickets t ON t.match_id = m.id
            GROUP BY m.id
            ORDER BY m.start_time ASC;
        `;
        const result = await query(sql);
        res.json(result.rows);
    } catch (err) {
        console.error('Tickets list error:', err.message);
        res.status(500).json({ error: 'Failed to list tickets.' });
    }
});

// Health endpoint for diagnostics
app.get('/health', (req, res) => {
    const dbConnected = !!(require('./db').pool);
    res.json({ ok: true, db: dbConnected ? 'connected' : 'disabled' });
});

// Error-handling middleware (last middleware)
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err && err.stack ? err.stack : err);
    if (res.headersSent) return next(err);
    res.status(500).send('<pre>Internal Server Error</pre>');
});

// API: Book a ticket for a match and stand (with user info)
app.post('/api/tickets/:matchId/book', async (req, res) => {
    const matchId = req.params.matchId;
    const { stand, name, phone } = req.body;

    if (!stand) return res.status(400).json({ error: 'Stand is required.' });
    if (!name || !phone) return res.status(400).json({ error: 'Name and phone number are required.' });

    const client = await pool.connect();
    try {
        console.log(`Booking: matchId=${matchId}, stand=${stand}, name=${name}, phone=${phone}`);
        await client.query('BEGIN');

        // Check if user exists, if not create user with unique user_id
        let userId;
        const userCheckSql = `SELECT id FROM users WHERE phone = $1`;
        const userCheckRes = await client.query(userCheckSql, [phone]);
        
        if (userCheckRes.rows.length > 0) {
            // User exists
            userId = userCheckRes.rows[0].id;
            console.log(`Existing user found: ${userId}`);
        } else {
            // Create new user with unique user_id (format: USER_XXXXX)
            const userIdNum = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
            const uniqueUserId = `USER_${userIdNum}`;
            
            const userInsertSql = `INSERT INTO users (user_id, name, phone, created_at) VALUES ($1, $2, $3, now()) RETURNING id`;
            const userInsertRes = await client.query(userInsertSql, [uniqueUserId, name, phone]);
            userId = userInsertRes.rows[0].id;
            console.log(`New user created: ${userId} with user_id: ${uniqueUserId}`);
        }

        // Find the ticket row for this match/stand and lock it
        const findSql = `SELECT id, available FROM tickets WHERE match_id = $1 AND stand = $2 FOR UPDATE`;
        const findRes = await client.query(findSql, [matchId, stand]);
        if (findRes.rows.length === 0) {
            await client.query('ROLLBACK');
            console.warn(`No ticket found for matchId=${matchId}, stand=${stand}`);
            return res.status(404).json({ error: 'Ticket stand not found for this match.' });
        }

        const ticket = findRes.rows[0];
        const availableCount = parseInt(ticket.available) || 0;
        console.log(`Ticket found: id=${ticket.id}, available=${availableCount}`);

        if (availableCount <= 0) {
            await client.query('ROLLBACK');
            console.warn(`Stand sold out: ${stand}`);
            return res.status(400).json({ error: 'Stand sold out.' });
        }

        // Decrement availability
        const updSql = `UPDATE tickets SET available = available - 1 WHERE id = $1 RETURNING *`;
        const updRes = await client.query(updSql, [ticket.id]);

        // Insert a booking record with user_id
        const bkSql = `INSERT INTO bookings (match_id, ticket_id, stand, user_id, created_at) VALUES ($1, $2, $3, $4, now()) RETURNING *`;
        const bookingRes = await client.query(bkSql, [matchId, ticket.id, stand, userId]);
        const booking = bookingRes.rows[0];

        await client.query('COMMIT');
        console.log(`Booking successful: ${stand} for user ${userId}`);
        res.json({ 
            message: 'Ticket booked successfully!', 
            bookingId: booking.id,
            ticket: updRes.rows[0],
            bookedFor: name,
            phone: phone
        });
    } catch (err) {
        try {
            await client.query('ROLLBACK');
        } catch (rollbackErr) {
            console.error('Rollback error:', rollbackErr.message);
        }
        console.error('Booking error:', err.message, err.stack);
        res.status(500).json({ error: 'Failed to book ticket: ' + err.message });
    } finally {
        client.release();
    }
});

// 8. API: List Matches (Public)
app.get('/api/matches', async (req, res) => {
    try {
        const sql = `SELECT * FROM matches ORDER BY start_time ASC;`;
        const result = await query(sql);
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 9. API: News Proxy (Public)
app.get('/api/news', async (req, res) => {
    const NEWS_API_KEY = process.env.NEWS_API_KEY;
    const NEWS_API_URL = process.env.NEWS_API_URL;

    if (!NEWS_API_KEY || !NEWS_API_URL) {
        console.warn('News API credentials missing in .env');
        return res.status(503).json({ error: 'News service temporarily unavailable (API configuration missing).' });
    }

    // Construct the full URL for the external API
    const fullUrl = `${NEWS_API_URL}&apiKey=${NEWS_API_KEY}`;

    try {
        // Fetch news from the external API (server-side proxy)
        const apiResponse = await axios.get(fullUrl);
        // Only return necessary data to the client
        const articles = apiResponse.data.articles.map(article => ({
            title: article.title,
            description: article.description,
            url: article.url,
            image: article.urlToImage
        }));

        res.json(articles);
    } catch (error) {
        console.error('External News API Error:', error.response ? error.response.data : error.message);
        res.status(500).json({ error: 'Failed to fetch news from external source.' });
    }
});


// --- Server Start ---
// When required as a module (for serverless platforms like Vercel),
// don't start the listener here. Export the Express app instead.
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Server running at http://localhost:${PORT}`);
    });
}

module.exports = app;
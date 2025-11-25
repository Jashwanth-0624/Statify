const { query } = require('./db');
require('dotenv').config();

async function run() {
    try {
        console.log('Creating tickets and bookings tables (if not exists)...');
        const statements = [
            `
            CREATE TABLE IF NOT EXISTS tickets (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
                stand VARCHAR(100) NOT NULL,
                total INT NOT NULL DEFAULT 10,
                available INT NOT NULL DEFAULT 10,
                created_at TIMESTAMPTZ NOT NULL DEFAULT now()
            );
            `,
            `
            CREATE TABLE IF NOT EXISTS bookings (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
                ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
                stand VARCHAR(100) NOT NULL,
                created_at TIMESTAMPTZ NOT NULL DEFAULT now()
            );
            `
        ];

        for (const s of statements) {
            console.log('Executing:', s.trim().split('\n')[0]);
            try {
                await query(s);
                console.log('✓ Success');
            } catch (err) {
                console.error('Error executing statement:', err.message);
            }
        }

        console.log('\nAll ticket migrations applied.');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}

run();

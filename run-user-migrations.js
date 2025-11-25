const { query } = require('./db');
require('dotenv').config();

async function run() {
    try {
        console.log('Running user & booking migrations...');
        
        const statements = [
            // Create users table
            `
            CREATE TABLE IF NOT EXISTS users (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id VARCHAR(50) UNIQUE NOT NULL,
                name VARCHAR(255) NOT NULL,
                phone VARCHAR(20) NOT NULL,
                created_at TIMESTAMPTZ NOT NULL DEFAULT now()
            );
            `,
            // Add user_id column to bookings if it doesn't exist (for existing bookings)
            `
            ALTER TABLE bookings ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE CASCADE;
            `
        ];

        for (const s of statements) {
            const label = s.trim().split('\n')[0];
            console.log(`Executing: ${label}...`);
            try {
                await query(s);
                console.log('✓ Success');
            } catch (err) {
                console.error('Error:', err.message);
            }
        }

        console.log('\n✓ User & booking migrations completed!');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}

run();

const { query } = require('./db');
require('dotenv').config();

async function fixSchema() {
    try {
        console.log('Fixing database schema...');
        
        const statements = [
            // Alter average column
            `ALTER TABLE players ALTER COLUMN average TYPE DECIMAL(10,2);`,
            // Alter strike_rate column
            `ALTER TABLE players ALTER COLUMN strike_rate TYPE DECIMAL(10,2);`
        ];

        for (const statement of statements) {
            console.log(`Executing: ${statement}`);
            try {
                await query(statement);
                console.log('✓ Success');
            } catch (err) {
                console.error('Error:', err.message);
            }
        }

        console.log('✓ Schema fixed!');
        process.exit(0);
    } catch (err) {
        console.error('Fix failed:', err);
        process.exit(1);
    }
}

fixSchema();

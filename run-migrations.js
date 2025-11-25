const fs = require('fs');
const { query } = require('./db');
require('dotenv').config();

async function runMigrations() {
    try {
        console.log('Reading migrations.sql...');
        const migrationSql = fs.readFileSync('migrations.sql', 'utf8');
        
        // Split by semicolon and filter out empty statements
        const statements = migrationSql
            .split(';')
            .map(stmt => stmt.trim())
            .filter(stmt => stmt.length > 0);
        
        console.log(`Found ${statements.length} SQL statements to execute`);
        
        for (const statement of statements) {
            console.log(`\nExecuting: ${statement.substring(0, 80)}...`);
            try {
                await query(statement);
                console.log('✓ Success');
            } catch (err) {
                console.error('✗ Error:', err.message);
                // Continue with next statement even if one fails
            }
        }
        
        console.log('\n✓ Migrations completed!');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}

runMigrations();

const { query } = require('./db');
require('dotenv').config();

async function clearDatabase() {
    try {
        console.log('Clearing all player data from database...');
        
        const statements = [
            // Delete audit logs first (foreign key constraint)
            `DELETE FROM player_audit;`,
            // Delete all players
            `DELETE FROM players;`,
            // Delete all matches
            `DELETE FROM matches;`
        ];

        for (const statement of statements) {
            console.log(`\nExecuting: ${statement}`);
            try {
                const result = await query(statement);
                console.log(`✓ Success - ${result.rowCount} rows affected`);
            } catch (err) {
                console.error('Error:', err.message);
            }
        }

        console.log('\n✓ Database cleared! All players and matches have been deleted.');
        process.exit(0);
    } catch (err) {
        console.error('Clear failed:', err);
        process.exit(1);
    }
}

clearDatabase();

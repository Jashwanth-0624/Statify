const { query } = require('./db');

async function updateTeam() {
    try {
        console.log('Updating Royal Challengers to Royal Challengers Bengaluru...');
        const res = await query(
            'UPDATE players SET team = $1 WHERE team = $2',
            ['Royal Challengers Bengaluru', 'Royal Challengers']
        );
        console.log('✓ Updated ' + res.rowCount + ' player(s) with new team name');
        process.exit(0);
    } catch (err) {
        console.error('Error:', err.message);
        process.exit(1);
    }
}

updateTeam();

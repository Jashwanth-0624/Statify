const { query } = require('./db');
require('dotenv').config();

async function run(){
    try{
        console.log('Inserting demo match...');
        const res = await query(`INSERT INTO matches (team1, team2, venue, start_time, created_by, created_at) VALUES ($1,$2,$3,$4,$5, now()) RETURNING *`, ['Demo Stars','Demo Knights','Demo Stadium', new Date(Date.now() + 3600*1000).toISOString(), 'system']);
        const match = res.rows[0];
        console.log('Match created:', match.id);
        const stands = ['North Stand','East Stand','West Stand'];
        for(const s of stands){
            await query(`INSERT INTO tickets (match_id, stand, total, available, created_at) VALUES ($1,$2,$3,$3, now())`, [match.id, s, 10]);
        }
        console.log('Created tickets for demo match.');
        process.exit(0);
    }catch(err){
        console.error(err);
        process.exit(1);
    }
}
run();

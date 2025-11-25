const { query } = require('./db');
require('dotenv').config();

async function run(){
    try{
        console.log('Inserting demo players...');
        const players = [
            { name: 'Rohit Sharma', team: 'Mumbai Indians', photo_url: '', runs: 4500, wickets: 0, sixes: 220, hundreds: 5, matches: 200, average: 37.5, strike_rate: 129.4 },
            { name: 'Virat Kohli', team: 'Royal Challengers', photo_url: '', runs: 5200, wickets: 0, sixes: 180, hundreds: 6, matches: 220, average: 43.2, strike_rate: 130.1 },
            { name: 'Jasprit Bumrah', team: 'Mumbai Indians', photo_url: '', runs: 50, wickets: 150, sixes: 2, hundreds: 0, matches: 120, average: 1.0, strike_rate: 85.0 },
            { name: 'MS Dhoni', team: 'Chennai Super Kings', photo_url: '', runs: 4000, wickets: 0, sixes: 250, hundreds: 5, matches: 250, average: 35.0, strike_rate: 138.2 },
            { name: 'Hardik Pandya', team: 'Gujarat Titans', photo_url: '', runs: 2100, wickets: 75, sixes: 160, hundreds: 1, matches: 150, average: 27.4, strike_rate: 140.3 }
        ];

        for(const p of players){
            await query(`INSERT INTO players (name, team, photo_url, runs, wickets, sixes, hundreds, matches, average, strike_rate, created_at, updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10, now(), now())`, [
                p.name, p.team, p.photo_url, p.runs, p.wickets, p.sixes, p.hundreds, p.matches, p.average, p.strike_rate
            ]);
        }
        console.log('Demo players inserted.');
        process.exit(0);
    }catch(err){
        console.error(err);
        process.exit(1);
    }
}
run();

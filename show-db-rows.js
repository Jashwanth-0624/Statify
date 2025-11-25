const { query } = require('./db');

async function run(){
  try{
    console.log('Checking DB row counts and samples...');

    const counts = {};

    const playersCount = await query('SELECT COUNT(*)::int AS cnt FROM players;');
    counts.players = playersCount.rows[0].cnt;

    const matchesCount = await query('SELECT COUNT(*)::int AS cnt FROM matches;');
    counts.matches = matchesCount.rows[0].cnt;

    const ticketsCount = await query('SELECT COUNT(*)::int AS cnt FROM tickets;');
    counts.tickets = ticketsCount.rows[0].cnt;

    console.log('Counts:', counts);

    if (counts.players > 0) {
      const p = await query('SELECT id, name, team, runs, wickets, sixes, hundreds, average, strike_rate, photo_url FROM players ORDER BY runs DESC LIMIT 5;');
      console.log('\nTop players:');
      console.table(p.rows);
    } else {
      console.log('\nNo players found.');
    }

    if (counts.matches > 0) {
      const m = await query('SELECT id, team1, team2, venue, start_time FROM matches ORDER BY start_time ASC LIMIT 5;');
      console.log('\nUpcoming matches:');
      console.table(m.rows);
    } else {
      console.log('\nNo matches found.');
    }

    if (counts.tickets > 0) {
      const t = await query("SELECT id, match_id, stand, total, available FROM tickets ORDER BY match_id LIMIT 10;");
      console.log('\nTickets sample:');
      console.table(t.rows);
    } else {
      console.log('\nNo tickets found.');
    }

    process.exit(0);
  }catch(err){
    console.error('Diagnostic script error:', err.message || err);
    process.exit(2);
  }
}

run();

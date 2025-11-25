# STATIFY - Quick Start Guide for New Features

## How to Use the New Features

### 🔐 Admin Login
1. Click "Admin Login" button on any page
2. Enter credentials:
   - **Username**: `admin`
   - **Password**: `supersecretpassword`
3. You'll be redirected to the Add Player page with admin options visible

---

## ✏️ Edit Player Stats (Admin Only)

### Steps:
1. After admin login, click **"✏️ Edit Player"** in the navbar
2. Select a player from the dropdown (shows name and team)
3. The player's current stats will load in the form
4. Update any statistics you want to change
5. Leave fields blank to keep current values unchanged
6. Click **"Update Player Stats"** button
7. Success message will appear when update is complete

### Statistics You Can Edit:
- 🔥 Runs Scored
- 🎳 Wickets Taken
- ⭐ Sixes Hit
- 👑 Hundreds (Centuries)
- 👥 Matches Played
- 📊 Average (Batting/Bowling Average)
- ⚡ Strike Rate

### Example:
```
Virat Kohli currently has:
- 50 Runs
- 0 Wickets
- 10 Sixes
- 1 Hundred
- 5 Matches
- 50.00 Average
- 125.00 Strike Rate

You want to update his runs to 75 and sixes to 12.
Just fill those two fields and leave the rest blank, then click Update.
All changes are automatically tracked in the audit log.
```

---

## 👤 View Player Profile (All Users)

### Steps:
1. Go to **"Leaderboards"** page
2. Select any statistic from dropdown
3. Click on any player in the list
4. View the player's complete profile with:
   - Player photo
   - Name and Team
   - **Matches Played** ✓
   - Runs
   - Wickets
   - Sixes
   - Hundreds
   - **Average** ✓ (with decimal precision)
   - **Strike Rate** ✓ (with decimal precision)

---

## 🌟 Top All-Rounders Leaderboard (All Users)

### What is it?
A special leaderboard that ranks players based on their all-round cricket abilities, combining:
- **Batting Performance** (Runs + Strike Rate)
- **Bowling Performance** (Wickets + Average)

### How the Score Works:
- **Runs**: 30% weight
- **Wickets**: 30% weight  
- **Average**: 20% weight
- **Strike Rate**: 20% weight

Each stat is normalized (compared to the best in the database) and combined into a single score.

### Steps to View:
1. Go to **"Leaderboards"** page
2. Click dropdown and select **"🌟 Top All-Rounders"**
3. View the top 20 balanced players in the system
4. Only players with BOTH runs > 0 AND wickets > 0 appear here

### Example Ranking:
```
🥇 1st: Player A - Score: 85.50
   (Good at both batting and bowling)

🥈 2nd: Player B - Score: 82.30
   (Balanced skillset)

🥉 3rd: Player C - Score: 78.90
   (Decent all-rounder)
```

---

## 📱 Admin Navigation

### When NOT logged in:
- See "Admin Login" button

### When logged in as Admin:
- Navbar shows:
  - 🏠 Home
  - 📊 Leaderboards
  - 🎯 Matches
  - 🎫 Tickets
  - ➕ Add Player
  - 📅 Schedule Match (admin-only)
  - ✏️ Edit Player (admin-only)
- Logout button visible in top-right

---

## 🔄 Audit Trail

Every time an admin updates player stats:
- Old values are saved
- New values are recorded
- Username of the admin is logged
- Timestamp is recorded
- All information is stored in the `player_audit` table

You can view this information by querying the database:
```sql
SELECT * FROM player_audit WHERE player_id = 'player_uuid';
```

---

## 💡 Tips & Tricks

### Edit Multiple Players Quickly:
1. Go to Edit Player page
2. Update one player
3. Use the player dropdown to select the next player
4. Their stats auto-load - make changes and update
5. Repeat!

### Finding Top Performers:
1. Go to Leaderboards
2. Check different categories:
   - Most Runs → Best Batsmen
   - Most Wickets → Best Bowlers
   - Best Average → Most Consistent
   - Best Strike Rate → Most Aggressive
   - Top All-Rounders → Best Balanced Players

### Player Comparison:
1. Open player profiles for multiple players
2. Compare their stats side-by-side
3. Check average and strike rate for consistency metrics

---

## ⚠️ Important Notes

1. **Admin Access Required**:
   - Only logged-in admins can edit player stats
   - Public users can view all stats but cannot edit

2. **Data Validation**:
   - All numbers must be non-negative
   - Leave fields blank to keep current values
   - Matches and other counts should be integers

3. **Real-time Updates**:
   - Changes take effect immediately
   - All leaderboards update automatically
   - Player profiles reflect changes when reloaded

4. **Historical Data**:
   - Audit log tracks all changes
   - Old values are never overwritten
   - Can see complete history of stat changes

---

## 🆘 Troubleshooting

**Issue**: "Edit Player" link not showing
- **Solution**: Make sure you're logged in as admin

**Issue**: Player dropdown is empty
- **Solution**: Make sure players have been added to the system
- **Fix**: Add players using "Add Player" page first

**Issue**: All-Rounders leaderboard shows fewer players
- **Solution**: This is correct! Only players with BOTH runs AND wickets appear
- **Fix**: Add wickets to batting-only players to include them

**Issue**: Stats updated but leaderboard hasn't changed
- **Solution**: Refresh the page (F5 or Ctrl+R) to see updated rankings

---

## 📊 Example Workflow

### Scenario: Update a player after a match

1. Admin logs in → "✏️ Edit Player"
2. Selects "Virat Kohli"
3. Updates stats after match:
   - Runs: 75 + 28 = 103
   - Matches: 5 + 1 = 6
   - Sixes: 12 + 2 = 14
4. Click "Update Player Stats"
5. Player profile now shows new stats
6. Leaderboards automatically reflect changes
7. All-Rounders ranking updates if applicable
8. Audit log records the change with admin name and timestamp

---

## 🎯 Features at a Glance

| Feature | Page | Who Can Access | Purpose |
|---------|------|-----------------|---------|
| Edit Player Stats | /edit-player | Admin Only | Maintain player statistics |
| Player Profile | /player-profile | Everyone | View all player stats |
| Leaderboards | /leaderboards | Everyone | Rankings by different stats |
| Top All-Rounders | /leaderboards | Everyone | Balanced player rankings |
| Schedule Match | /schedule-match | Admin Only | Create new matches |
| Add Player | /add-player | Everyone | Register new players |
| Audit Log | Database | Admin | Track all changes |

---

**Last Updated**: November 25, 2025
**Version**: 1.0

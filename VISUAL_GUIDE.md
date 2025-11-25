# 📱 Visual Guide - Step by Step

## Step 1: Access Edit Player Page

### Path A - From Home Page (Admin):
```
Home Page → [Admin Login Button]
         → Enter: admin / supersecretpassword
         → Add Player Page (Auto-redirect after login)
         → [✏️ Edit Player] link in navbar
```

### Path B - Direct URL (Admin):
```
http://localhost:3000/edit-player
(Will redirect to login if not authenticated)
```

---

## Step 2: Select a Player

**Screen: Edit Player Stats**
```
┌─────────────────────────────────────────┐
│ STATIFY - Edit Player Stats             │
└─────────────────────────────────────────┘

[Select Player Dropdown]
  ├─ -- Select a player --
  ├─ Virat Kohli (Royal Challengers Bengaluru)
  ├─ Rohit Sharma (Mumbai Indians)
  ├─ Sachin Tendulkar (India)
  └─ [More players...]
```

**Click on a player name** → Stats load automatically

---

## Step 3: Update Player Stats

**Screen: Player Stats Form**
```
┌──────────────────────────────────────────┐
│ Player Photo      │ Player Info          │
│ [Photo Image]     │ Name: Virat Kohli    │
│                   │ Team: RCB            │
│                   │ ID: player_uuid      │
└──────────────────────────────────────────┘

[Edit Form]
┌──────────────────────────────────────────┐
│ 🔥 Runs Scored          [500]            │
│ 🎳 Wickets Taken         [0]             │
│ ⭐ Sixes                 [50]             │
│ 👑 Hundreds              [5]              │
│ 👥 Matches Played        [10]             │
│ 📊 Average              [50.00]           │
│ ⚡ Strike Rate          [125.00]          │
│                                          │
│ [UPDATE BUTTON] ✓ Update Player Stats    │
└──────────────────────────────────────────┘
```

**Edit fields you want to change:**
- Change 500 → 575 for Runs
- Change 10 → 11 for Matches
- Change 50 → 52 for Sixes
- Leave others blank to keep unchanged

**Click [UPDATE BUTTON]**

---

## Step 4: Confirmation

**Screen: Success Message**
```
┌──────────────────────────────────────────┐
│ ✓ Player stats updated successfully!     │
│                                          │
│ Updated Fields:                          │
│ • Runs: 500 → 575                        │
│ • Matches: 10 → 11                       │
│ • Sixes: 50 → 52                         │
└──────────────────────────────────────────┘
```

---

## View Updated Profile

### Steps:
1. Go to **Leaderboards**
2. Select any stat (e.g., "Most Runs")
3. Find and click the player you just updated
4. See updated stats on profile page

**Screen: Player Profile**
```
┌────────────────────────────────────────────┐
│ [Player Photo]     Virat Kohli             │
│ 🛡️ Royal Challengers Bengaluru            │
│                                            │
│ 🔥 RUNS: 575           👑 HUNDREDS: 5      │
│ 🎳 WICKETS: 0          ⭐ SIXES: 52        │
│ 📊 AVERAGE: 50.00      👥 MATCHES: 11     │
│ ⚡ STRIKE RATE: 125.00                     │
│                                            │
│ [← Back to Leaderboards]                  │
└────────────────────────────────────────────┘
```

**All new stats visible immediately!**

---

## View All-Rounders Ranking

### Steps:
1. Go to **Leaderboards**
2. Click dropdown selector
3. Select **"🌟 Top All-Rounders"**

**Screen: All-Rounders Leaderboard**
```
┌─────────────────────────────────────────────┐
│ Player Leaderboards                         │
│ [Select Statistic ▼]                        │
│   ├─ Most Runs                              │
│   ├─ Most Wickets                           │
│   ├─ Most Sixes                             │
│   ├─ Most Hundreds                          │
│   ├─ Best Average                           │
│   ├─ Best Strike Rate                       │
│   └─ 🌟 Top All-Rounders ← SELECT THIS     │
└─────────────────────────────────────────────┘

[Results: 🌟 Top All-Rounders]

🥇 #1 Virat Kohli               Score: 85.50
   [Photo] Royal Challengers    [Click →]

🥈 #2 Rohit Sharma              Score: 82.30
   [Photo] Mumbai Indians       [Click →]

🥉 #3 AB DeVilliers             Score: 80.15
   [Photo] Royal Challengers    [Click →]

    #4 David Warner             Score: 77.40
   [Photo] Sunrisers             [Click →]

    #5 MS Dhoni                  Score: 75.20
   [Photo] Chennai Super Kings  [Click →]

[... More All-Rounders ...]
```

**All players ranked by all-rounder abilities!**

---

## Admin Features Overview

### When NOT Logged In:
```
Navbar:
[Home] [Leaderboards] [Matches] [Tickets] [Add Player]
                                           [Admin Login →]
```

### When Logged In as Admin:
```
Navbar:
[Home] [Leaderboards] [Matches] [Tickets] [Add Player] 
[📅 Schedule Match] [✏️ Edit Player]              [⚙️ Logout →]

Admin Badge: ⚙️ Admin
```

---

## Complete Admin Workflow

```
┌─ Admin Login ──┐
│ admin          │
│ supersecretxxx │
└─────┬──────────┘
      ↓
┌─────────────────────────────────┐
│ Add Player Page (Admin View)     │
│ [✏️ Edit Player]                 │
│ [📅 Schedule Match]              │
│ [⚙️ Admin] [Logout]              │
└─────────────────────────────────┘
      ↓
┌─ Edit Player ──────────────┐
│ Select Player → Load Stats  │
│ Update Fields              │
│ Click Update               │
│ Confirmation Message       │
└────────────────────────────┘
      ↓
┌─ Verify Changes ────────────┐
│ Go to Leaderboards          │
│ Click on player             │
│ View updated profile        │
└─────────────────────────────┘
```

---

## Quick Reference Card

### Edit Player Stats
```
Route: /edit-player
Auth: Admin only
Fields: Runs, Wickets, Sixes, Hundreds, Matches, Average, Strike Rate
Audit: Yes (tracked in player_audit table)
```

### View All Stats
```
Route: /player-profile?id=<player_id>
Auth: Public
Shows: All 7 statistics with proper decimals
Navigate: Click player from any leaderboard
```

### All-Rounders Ranking
```
Route: /api/leaderboards/allrounders
Auth: Public
Scoring: 30% runs + 30% wickets + 20% avg + 20% strike_rate
Filters: Only players with runs > 0 AND wickets > 0
Top 20: Ranked by composite score
```

---

## Color Guide

| Color | Meaning |
|-------|---------|
| 🟢 Green | Action/Success |
| 🟡 Yellow | Admin/Warning |
| 🔴 Red | Error/Logout |
| 🟦 Blue | Information |

---

## Icon Guide

| Icon | Meaning |
|------|---------|
| 🔐 | Secure/Admin |
| ✏️ | Edit/Modify |
| 📅 | Schedule |
| 👥 | Users/Matches |
| 🌟 | Special/Top |
| ✓ | Success |
| ⚙️ | Settings/Admin |

---

## Common Tasks

### Task: Update a player's runs after a match
```
1. Admin Login
2. Edit Player → Select Player
3. Change "Runs Scored" field only
4. Click Update
5. Done! Leaderboards reflect change immediately
```

### Task: Find the best all-rounder
```
1. Leaderboards
2. Select "🌟 Top All-Rounders"
3. #1 player is best all-rounder
4. Click to see full profile
```

### Task: Check if a player is balanced
```
1. View player profile
2. Check if both runs > 0 AND wickets > 0
3. Look at average and strike rate
4. Compare with others
5. Check all-rounders leaderboard for ranking
```

---

## Troubleshooting

### "Edit Player link not showing"
→ Make sure you're logged in as admin
→ Login button should change to Logout

### "Player dropdown is empty"
→ No players in system yet
→ Use "Add Player" page to add players first

### "All-Rounders showing fewer players"
→ This is correct! Only shows players with BOTH:
  • runs > 0 (they batted)
  • wickets > 0 (they bowled)

### "Changes not showing"
→ Refresh the page (Ctrl+R or F5)
→ Go back and re-visit the profile

---

**Navigation Tip**: Use browser back/forward buttons to quickly navigate between edit, profile, and leaderboard pages!

---

Last Updated: November 25, 2025

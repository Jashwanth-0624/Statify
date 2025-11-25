-- migrations.sql: CockroachDB Schema for STATIFY App

-- 1. Players Table
-- Note: CockroachDB uses BIGSERIAL for auto-incrementing integers.
CREATE TABLE IF NOT EXISTS players (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    team VARCHAR(100) NOT NULL,
    photo_url VARCHAR(512),
    runs INT NOT NULL DEFAULT 0,
    wickets INT NOT NULL DEFAULT 0,
    average DECIMAL(5, 2) NOT NULL DEFAULT 0.00,
    sixes INT NOT NULL DEFAULT 0,
    hundreds INT NOT NULL DEFAULT 0,
    matches INT NOT NULL DEFAULT 0,
    strike_rate DECIMAL(5, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for efficient leaderboard queries
CREATE INDEX IF NOT EXISTS idx_runs ON players (runs DESC);
CREATE INDEX IF NOT EXISTS idx_wickets ON players (wickets DESC);
CREATE INDEX IF NOT EXISTS idx_sixes ON players (sixes DESC);
CREATE INDEX IF NOT EXISTS idx_hundreds ON players (hundreds DESC);

-- 2. Matches Table
CREATE TABLE IF NOT EXISTS matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team1 VARCHAR(100) NOT NULL,
    team2 VARCHAR(100) NOT NULL,
    venue VARCHAR(255),
    start_time TIMESTAMPTZ NOT NULL,
    created_by VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Player Audit Table
-- Used to track changes to player stats (old and new values)
CREATE TABLE IF NOT EXISTS player_audit (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    old_values JSONB, -- Stores the old stats before update
    new_values JSONB, -- Stores the new stats after update
    changed_by VARCHAR(255) NOT NULL, -- Admin username who made the change
    changed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
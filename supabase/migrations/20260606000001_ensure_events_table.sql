-- Migration: Ensure Events and Timeline Tables
-- Description: Creates events table if missing and ensures correct permissions

-- 1. Create events table if not exists
CREATE TABLE IF NOT EXISTS events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    event_type TEXT CHECK (event_type IN (
        'Wedding', 'Birth', 'Death', 'Graduation', 'Festival', 
        'Reunion', 'Achievement', 'Migration', 'Business', 'Other'
    )) NOT NULL,
    event_date DATE NOT NULL,
    location TEXT,
    description TEXT,
    cultural_significance TEXT,
    added_by TEXT,
    added_date TIMESTAMPTZ DEFAULT NOW(),
    community_id UUID REFERENCES communities(id) ON DELETE SET NULL
);

-- 2. Add community_id if table existed but column was missing
DO $$ 
BEGIN 
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'events') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='events' AND column_name='community_id') THEN
      ALTER TABLE events ADD COLUMN community_id UUID REFERENCES communities(id);
    END IF;
  END IF;
END $$;

-- 3. Enable RLS
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- 4. Explicit GRANTS
GRANT ALL ON TABLE events TO authenticated;
GRANT ALL ON TABLE events TO anon;
GRANT ALL ON TABLE events TO service_role;

-- 5. Policies
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Authenticated users can view events" ON events;
    CREATE POLICY "Authenticated users can view events" ON events FOR SELECT TO authenticated USING (true);
    
    DROP POLICY IF EXISTS "Admins can manage events" ON events FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());
END $$;

-- 6. Ensure indexes
CREATE INDEX IF NOT EXISTS idx_events_date ON events(event_date DESC);
CREATE INDEX IF NOT EXISTS idx_events_type ON events(event_type);
CREATE INDEX IF NOT EXISTS idx_events_community ON events(community_id);

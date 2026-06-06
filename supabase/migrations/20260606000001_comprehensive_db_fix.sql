-- Migration: Comprehensive Table and Permission Repair
-- Description: Ensures all core tables exist, have community_id, and correct permissions

-- 1. Ensure extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Repair 'events' table
CREATE TABLE IF NOT EXISTS events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    event_type TEXT NOT NULL,
    event_date DATE NOT NULL,
    location TEXT,
    description TEXT,
    cultural_significance TEXT,
    added_by TEXT,
    added_date TIMESTAMPTZ DEFAULT NOW(),
    community_id UUID REFERENCES communities(id) ON DELETE SET NULL
);

-- 3. Repair 'stories' table
CREATE TABLE IF NOT EXISTS stories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    story_text TEXT NOT NULL,
    story_type TEXT NOT NULL,
    storyteller TEXT,
    event_date DATE,
    location TEXT,
    themes TEXT[],
    language TEXT DEFAULT 'English',
    audio_url TEXT,
    transcribed BOOLEAN DEFAULT FALSE,
    ai_summary TEXT,
    ai_themes TEXT[],
    ai_sentiment TEXT,
    ai_processed BOOLEAN DEFAULT FALSE,
    added_by TEXT,
    added_date TIMESTAMPTZ DEFAULT NOW(),
    community_id UUID REFERENCES communities(id) ON DELETE SET NULL
);

-- 4. Repair 'media' table
CREATE TABLE IF NOT EXISTS media (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    filename TEXT NOT NULL,
    file_type TEXT NOT NULL,
    r2_key TEXT NOT NULL UNIQUE,
    r2_url TEXT NOT NULL,
    thumbnail_url TEXT,
    original_size_mb DECIMAL(10,2),
    compressed_size_mb DECIMAL(10,2),
    compression_ratio DECIMAL(5,2),
    date_taken DATE,
    location TEXT,
    description TEXT,
    tags TEXT[],
    ai_description TEXT,
    ai_objects TEXT[],
    ai_processed BOOLEAN DEFAULT FALSE,
    uploaded_by TEXT,
    upload_date TIMESTAMPTZ DEFAULT NOW(),
    community_id UUID REFERENCES communities(id) ON DELETE SET NULL
);

-- 5. Helper function to safely add community_id
DO $$ 
DECLARE
    t text;
BEGIN 
    FOR t IN SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' 
    AND table_name IN ('events', 'stories', 'media', 'marriages', 'traditions', 'locations', 'occupations', 'education')
    LOOP
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = t AND column_name = 'community_id') THEN
            EXECUTE format('ALTER TABLE %I ADD COLUMN community_id UUID REFERENCES communities(id) ON DELETE SET NULL', t);
        END IF;
    END LOOP;
END $$;

-- 6. RLS and Permissions
DO $$ 
DECLARE
    t text;
BEGIN 
    FOR t IN SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' 
    AND table_name IN ('events', 'stories', 'media', 'marriages', 'traditions', 'locations', 'occupations', 'education', 'inbox', 'family_members', 'profiles', 'communities')
    LOOP
        -- Enable RLS
        EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
        
        -- Explicit GRANTS
        EXECUTE format('GRANT ALL ON TABLE %I TO authenticated', t);
        EXECUTE format('GRANT ALL ON TABLE %I TO anon', t);
        EXECUTE format('GRANT ALL ON TABLE %I TO service_role', t);
    END LOOP;
END $$;

-- 7. Ensure basic SELECT policies for core tables
DO $$ 
BEGIN
    -- Events
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'events' AND policyname = 'Public select events') THEN
        CREATE POLICY "Public select events" ON events FOR SELECT TO authenticated USING (true);
    END IF;
    
    -- Stories
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'stories' AND policyname = 'Public select stories') THEN
        CREATE POLICY "Public select stories" ON stories FOR SELECT TO authenticated USING (true);
    END IF;
    
    -- Media
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'media' AND policyname = 'Public select media') THEN
        CREATE POLICY "Public select media" ON media FOR SELECT TO authenticated USING (true);
    END IF;
END $$;

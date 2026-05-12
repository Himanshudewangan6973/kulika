-- ========================================================
-- ROOTS OF HERITAGE (KULIKA) - COMPLETE DATABASE RESET
-- ========================================================
-- Purpose: Drop all data and tables, rebuild schema from scratch
-- Version: 2.0 (May 2026)
-- Safe to run multiple times (idempotent)
-- ========================================================

-- ========================================================
-- SECTION 1: DISABLE RLS TEMPORARILY FOR RESET
-- ========================================================

ALTER TABLE IF EXISTS family_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS marriages DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS media DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS media_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS stories DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS story_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS events DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS event_attendees DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS traditions DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS tradition_practitioners DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS occupations DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS member_occupations DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS education DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS locations DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS member_locations DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS inbox DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS change_log DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS disputes DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS admin_users DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS relationships DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS edge_customizations DISABLE ROW LEVEL SECURITY;

-- ========================================================
-- SECTION 2: DROP ALL OBJECTS IN CORRECT ORDER
-- ========================================================

-- Drop views first (no dependencies on them elsewhere)
DROP VIEW IF EXISTS view_statistics CASCADE;
DROP VIEW IF EXISTS view_migration_timeline CASCADE;
DROP VIEW IF EXISTS view_occupation_trends CASCADE;
DROP VIEW IF EXISTS view_members_complete CASCADE;

-- Drop triggers
DROP TRIGGER IF EXISTS update_family_members_modified ON family_members;
DROP TRIGGER IF EXISTS trigger_set_generation ON family_members;

-- Drop functions
DROP FUNCTION IF EXISTS is_admin();
DROP FUNCTION IF EXISTS search_stories_semantic(vector, float, int);
DROP FUNCTION IF EXISTS update_modified_column();
DROP FUNCTION IF EXISTS set_generation();
DROP FUNCTION IF EXISTS calculate_generation(uuid);
DROP FUNCTION IF EXISTS get_ancestors(uuid);
DROP FUNCTION IF EXISTS get_descendants(uuid);
DROP FUNCTION IF EXISTS approve_member_submission(uuid, jsonb);
DROP FUNCTION IF EXISTS approve_data_change(uuid, text);

-- Drop tables (in reverse order of creation due to FK constraints)
DROP TABLE IF EXISTS edge_customizations CASCADE;
DROP TABLE IF EXISTS relationships CASCADE;
DROP TABLE IF EXISTS disputes CASCADE;
DROP TABLE IF EXISTS change_log CASCADE;
DROP TABLE IF EXISTS admin_users CASCADE;
DROP TABLE IF EXISTS member_locations CASCADE;
DROP TABLE IF EXISTS locations CASCADE;
DROP TABLE IF EXISTS member_occupations CASCADE;
DROP TABLE IF EXISTS occupations CASCADE;
DROP TABLE IF EXISTS education CASCADE;
DROP TABLE IF EXISTS tradition_practitioners CASCADE;
DROP TABLE IF EXISTS traditions CASCADE;
DROP TABLE IF EXISTS event_attendees CASCADE;
DROP TABLE IF EXISTS events CASCADE;
DROP TABLE IF EXISTS story_members CASCADE;
DROP TABLE IF EXISTS stories CASCADE;
DROP TABLE IF EXISTS media_members CASCADE;
DROP TABLE IF EXISTS media CASCADE;
DROP TABLE IF EXISTS marriages CASCADE;
DROP TABLE IF EXISTS family_members CASCADE;
DROP TABLE IF EXISTS inbox CASCADE;

-- Drop types/enums
DROP TYPE IF EXISTS relationship_type CASCADE;

-- ========================================================
-- SECTION 3: CREATE EXTENSIONS
-- ========================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "vector"; -- For semantic search

-- ========================================================
-- SECTION 4: CREATE ALL TABLES
-- ========================================================

-- Table: family_members (CORE)
CREATE TABLE family_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name TEXT NOT NULL,
    nickname TEXT,
    gender TEXT CHECK (gender IN ('Male', 'Female', 'Other')),
    date_of_birth DATE,
    date_of_death DATE,
    birth_place TEXT,
    current_location TEXT,
    lineage TEXT CHECK (lineage IN ('Father', 'Mother', 'Both')) NOT NULL,
    status TEXT CHECK (status IN ('Living', 'Deceased')) DEFAULT 'Living',
    generation INTEGER,
    parent1_id UUID REFERENCES family_members(id) ON DELETE SET NULL,
    parent2_id UUID REFERENCES family_members(id) ON DELETE SET NULL,
    bio_summary TEXT,
    profile_photo_url TEXT,
    contact_info JSONB,
    added_by TEXT,
    added_date TIMESTAMPTZ DEFAULT NOW(),
    last_modified TIMESTAMPTZ DEFAULT NOW(),
    search_vector tsvector GENERATED ALWAYS AS (
        to_tsvector('english', 
            coalesce(full_name, '') || ' ' || 
            coalesce(nickname, '') || ' ' || 
            coalesce(bio_summary, '')
        )
    ) STORED,
    CONSTRAINT valid_dates CHECK (
        date_of_birth IS NULL OR 
        date_of_death IS NULL OR 
        date_of_death > date_of_birth
    ),
    CONSTRAINT no_self_parent CHECK (
        id != parent1_id AND id != parent2_id
    )
);

-- Table: marriages
CREATE TABLE marriages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    spouse1_id UUID NOT NULL REFERENCES family_members(id) ON DELETE CASCADE,
    spouse2_id UUID NOT NULL REFERENCES family_members(id) ON DELETE CASCADE,
    marriage_date DATE,
    divorce_date DATE,
    marriage_location TEXT,
    status TEXT CHECK (status IN ('Married', 'Divorced', 'Widowed')) DEFAULT 'Married',
    notes TEXT,
    added_by TEXT,
    added_date TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT different_spouses CHECK (spouse1_id != spouse2_id),
    CONSTRAINT valid_marriage_dates CHECK (
        divorce_date IS NULL OR 
        marriage_date IS NULL OR 
        divorce_date > marriage_date
    ),
    CONSTRAINT unique_marriage UNIQUE (spouse1_id, spouse2_id, marriage_date)
);

-- Table: media
CREATE TABLE media (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    filename TEXT NOT NULL,
    file_type TEXT CHECK (file_type IN ('Photo', 'Video', 'Audio', 'Document')) NOT NULL,
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
    ai_detected_faces JSONB,
    ai_description TEXT,
    ai_objects TEXT[],
    ai_processed BOOLEAN DEFAULT FALSE,
    uploaded_by TEXT,
    upload_date TIMESTAMPTZ DEFAULT NOW(),
    search_vector tsvector GENERATED ALWAYS AS (
        to_tsvector('english', 
            coalesce(filename, '') || ' ' || 
            coalesce(description, '') || ' ' || 
            coalesce(ai_description, '')
        )
    ) STORED
);

-- Table: media_members (Junction)
CREATE TABLE media_members (
    media_id UUID REFERENCES media(id) ON DELETE CASCADE,
    member_id UUID REFERENCES family_members(id) ON DELETE CASCADE,
    face_coordinates JSONB,
    tagged_by TEXT,
    tagged_date TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (media_id, member_id)
);

-- Table: stories
CREATE TABLE stories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    story_text TEXT NOT NULL,
    story_type TEXT CHECK (story_type IN (
        'Life Event', 'Tradition', 'Lesson', 'Hardship', 
        'Achievement', 'Humor', 'Migration', 'Other'
    )) NOT NULL,
    storyteller TEXT,
    event_date DATE,
    location TEXT,
    themes TEXT[],
    language TEXT DEFAULT 'English',
    audio_url TEXT,
    transcribed BOOLEAN DEFAULT FALSE,
    ai_summary TEXT,
    ai_themes TEXT[],
    ai_sentiment TEXT CHECK (ai_sentiment IN ('Positive', 'Negative', 'Neutral', 'Mixed')),
    ai_processed BOOLEAN DEFAULT FALSE,
    added_by TEXT,
    added_date TIMESTAMPTZ DEFAULT NOW(),
    embedding vector(768),
    search_vector tsvector GENERATED ALWAYS AS (
        to_tsvector('english', 
            coalesce(title, '') || ' ' || 
            coalesce(story_text, '') || ' ' || 
            coalesce(ai_summary, '')
        )
    ) STORED,
    CONSTRAINT story_text_min_length CHECK (char_length(story_text) >= 50)
);

-- Table: story_members (Junction)
CREATE TABLE story_members (
    story_id UUID REFERENCES stories(id) ON DELETE CASCADE,
    member_id UUID REFERENCES family_members(id) ON DELETE CASCADE,
    role TEXT CHECK (role IN ('Subject', 'Storyteller', 'Mentioned')) DEFAULT 'Subject',
    PRIMARY KEY (story_id, member_id, role)
);

-- Table: events
CREATE TABLE events (
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
    added_date TIMESTAMPTZ DEFAULT NOW()
);

-- Table: event_attendees (Junction)
CREATE TABLE event_attendees (
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    member_id UUID REFERENCES family_members(id) ON DELETE CASCADE,
    role TEXT CHECK (role IN ('Host', 'Attendee', 'Subject', 'Organizer')) DEFAULT 'Attendee',
    PRIMARY KEY (event_id, member_id)
);

-- Table: traditions
CREATE TABLE traditions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    tradition_type TEXT CHECK (tradition_type IN (
        'Festival', 'Ritual', 'Recipe', 'Custom', 'Language', 'Art', 'Music', 'Other'
    )) NOT NULL,
    description TEXT NOT NULL,
    origin_story TEXT,
    regional_origin TEXT,
    evolution_notes TEXT,
    frequency TEXT CHECK (frequency IN ('Daily', 'Weekly', 'Monthly', 'Yearly', 'Occasional')),
    still_practiced BOOLEAN DEFAULT TRUE,
    added_by TEXT,
    added_date TIMESTAMPTZ DEFAULT NOW()
);

-- Table: tradition_practitioners (Junction)
CREATE TABLE tradition_practitioners (
    tradition_id UUID REFERENCES traditions(id) ON DELETE CASCADE,
    member_id UUID REFERENCES family_members(id) ON DELETE CASCADE,
    time_period TEXT,
    notes TEXT,
    PRIMARY KEY (tradition_id, member_id)
);

-- Table: occupations
CREATE TABLE occupations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    occupation_name TEXT NOT NULL UNIQUE,
    category TEXT CHECK (category IN (
        'Agriculture', 'Business', 'Education', 'Government', 
        'Healthcare', 'Military', 'Arts', 'Technology', 
        'Manufacturing', 'Service', 'Other'
    )),
    notes TEXT,
    created_date TIMESTAMPTZ DEFAULT NOW()
);

-- Table: member_occupations (Junction)
CREATE TABLE member_occupations (
    member_id UUID REFERENCES family_members(id) ON DELETE CASCADE,
    occupation_id UUID REFERENCES occupations(id) ON DELETE CASCADE,
    start_year INTEGER,
    end_year INTEGER,
    job_title TEXT,
    organization TEXT,
    notes TEXT,
    PRIMARY KEY (member_id, occupation_id, start_year),
    CONSTRAINT valid_occupation_years CHECK (
        end_year IS NULL OR start_year IS NULL OR end_year >= start_year
    )
);

-- Table: education
CREATE TABLE education (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    member_id UUID NOT NULL REFERENCES family_members(id) ON DELETE CASCADE,
    degree TEXT NOT NULL,
    education_level TEXT CHECK (education_level IN (
        'Primary', 'High School', 'Diploma', 'Undergraduate', 
        'Graduate', 'Doctorate', 'Professional', 'Other'
    )) NOT NULL,
    institution_name TEXT,
    location TEXT,
    year_completed INTEGER,
    field_of_study TEXT,
    honors TEXT,
    added_date TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT valid_completion_year CHECK (
        year_completed IS NULL OR 
        (year_completed >= 1900 AND year_completed <= EXTRACT(YEAR FROM CURRENT_DATE) + 10)
    )
);

-- Table: locations
CREATE TABLE locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    location_type TEXT CHECK (location_type IN (
        'Birthplace', 'Residence', 'Event Location', 'Ancestral Village', 'Migration Destination'
    )) NOT NULL,
    latitude DECIMAL(9,6),
    longitude DECIMAL(9,6),
    time_period TEXT,
    significance TEXT,
    current_status TEXT CHECK (current_status IN (
        'Family Present', 'Visited Occasionally', 'Lost Contact', 'Sold/Left'
    )),
    added_date TIMESTAMPTZ DEFAULT NOW()
);

-- Table: member_locations (Junction)
CREATE TABLE member_locations (
    member_id UUID REFERENCES family_members(id) ON DELETE CASCADE,
    location_id UUID REFERENCES locations(id) ON DELETE CASCADE,
    relationship TEXT CHECK (relationship IN (
        'Born', 'Lived', 'Migrated From', 'Migrated To', 'Visited', 'Worked'
    )) NOT NULL,
    start_year INTEGER,
    end_year INTEGER,
    notes TEXT,
    PRIMARY KEY (member_id, location_id, relationship)
);

-- Table: inbox (Submission Queue)
CREATE TABLE inbox (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    submission_type TEXT CHECK (submission_type IN (
        'New Member', 'Story', 'Media', 'Event', 'Tradition', 
        'Update Member', 'Other'
    )) NOT NULL,
    status TEXT CHECK (status IN (
        'Pending', 'Approved', 'Rejected', 'Needs Info', 'Duplicate'
    )) DEFAULT 'Pending',
    raw_data JSONB NOT NULL,
    submitter_name TEXT NOT NULL,
    submitter_email TEXT,
    submitter_phone TEXT,
    submission_date TIMESTAMPTZ DEFAULT NOW(),
    reviewed_by TEXT,
    review_date TIMESTAMPTZ,
    review_notes TEXT,
    linked_record_id UUID,
    linked_record_type TEXT,
    temp_file_urls TEXT[]
);

-- Table: change_log (Audit Trail)
CREATE TABLE change_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    table_name TEXT NOT NULL,
    record_id UUID NOT NULL,
    field_name TEXT NOT NULL,
    old_value TEXT,
    new_value TEXT,
    changed_by TEXT NOT NULL,
    changed_at TIMESTAMPTZ DEFAULT NOW(),
    reason TEXT
);

-- Table: disputes (Conflict Resolution)
CREATE TABLE disputes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    record_id UUID NOT NULL,
    record_type TEXT NOT NULL,
    field_name TEXT NOT NULL,
    value_a TEXT,
    source_a TEXT,
    submitted_by_a TEXT,
    value_b TEXT,
    source_b TEXT,
    submitted_by_b TEXT,
    resolution TEXT,
    resolution_rationale TEXT,
    resolved_by TEXT,
    resolved_date TIMESTAMPTZ,
    status TEXT CHECK (status IN ('Open', 'Resolved', 'Needs Verification')) DEFAULT 'Open',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: admin_users
CREATE TABLE admin_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    role TEXT CHECK (role IN ('Super Admin', 'Admin', 'Moderator')) DEFAULT 'Admin',
    added_by TEXT,
    added_date TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================================
-- SECTION 5: CREATE TYPES & ADVANCED RELATIONSHIP TABLES
-- ========================================================

-- Create relationship_type enum
DO $$ BEGIN
    CREATE TYPE relationship_type AS ENUM (
      'parent', 
      'spouse', 
      'sibling', 
      'unknown', 
      'step-parent', 
      'adoptive-parent', 
      'guardian', 
      'foster', 
      'in-law', 
      'custom'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Table: relationships (Advanced relationships support)
CREATE TABLE relationships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_id UUID NOT NULL REFERENCES family_members(id) ON DELETE CASCADE,
    target_id UUID NOT NULL REFERENCES family_members(id) ON DELETE CASCADE,
    type relationship_type NOT NULL DEFAULT 'unknown',
    is_pending BOOLEAN DEFAULT TRUE,
    notes TEXT,
    custom_description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT different_members CHECK (source_id != target_id)
);

-- Table: edge_customizations (Visualization settings)
CREATE TABLE edge_customizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    relationship_id UUID NOT NULL REFERENCES relationships(id) ON DELETE CASCADE UNIQUE,
    bend_points JSONB DEFAULT '[]'::jsonb,
    line_style TEXT CHECK (line_style IN ('straight', 'bezier', 'orthogonal', 'custom')) DEFAULT 'orthogonal',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================================
-- SECTION 6: CREATE ALL INDEXES
-- ========================================================

-- Indexes on family_members
CREATE INDEX idx_family_members_name ON family_members(full_name);
CREATE INDEX idx_family_members_lineage ON family_members(lineage);
CREATE INDEX idx_family_members_generation ON family_members(generation);
CREATE INDEX idx_family_members_status ON family_members(status);
CREATE INDEX idx_family_members_parent1 ON family_members(parent1_id);
CREATE INDEX idx_family_members_parent2 ON family_members(parent2_id);
CREATE INDEX idx_family_members_search ON family_members USING GIN(search_vector);
CREATE INDEX idx_family_members_dob ON family_members(date_of_birth);

-- Indexes on marriages
CREATE INDEX idx_marriages_spouse1 ON marriages(spouse1_id);
CREATE INDEX idx_marriages_spouse2 ON marriages(spouse2_id);
CREATE INDEX idx_marriages_status ON marriages(status);

-- Indexes on media
CREATE INDEX idx_media_file_type ON media(file_type);
CREATE INDEX idx_media_date_taken ON media(date_taken);
CREATE INDEX idx_media_tags ON media USING GIN(tags);
CREATE INDEX idx_media_search ON media USING GIN(search_vector);
CREATE INDEX idx_media_ai_processed ON media(ai_processed);

-- Indexes on media_members
CREATE INDEX idx_media_members_media ON media_members(media_id);
CREATE INDEX idx_media_members_member ON media_members(member_id);

-- Indexes on stories
CREATE INDEX idx_stories_type ON stories(story_type);
CREATE INDEX idx_stories_themes ON stories USING GIN(themes);
CREATE INDEX idx_stories_search ON stories USING GIN(search_vector);
CREATE INDEX idx_stories_event_date ON stories(event_date);
CREATE INDEX idx_stories_transcribed ON stories(transcribed);

-- Indexes on story_members
CREATE INDEX idx_story_members_story ON story_members(story_id);
CREATE INDEX idx_story_members_member ON story_members(member_id);

-- Indexes on events
CREATE INDEX idx_events_date ON events(event_date DESC);
CREATE INDEX idx_events_type ON events(event_type);
CREATE INDEX idx_events_location ON events(location);

-- Indexes on event_attendees
CREATE INDEX idx_event_attendees_event ON event_attendees(event_id);
CREATE INDEX idx_event_attendees_member ON event_attendees(member_id);

-- Indexes on traditions
CREATE INDEX idx_traditions_type ON traditions(tradition_type);
CREATE INDEX idx_traditions_still_practiced ON traditions(still_practiced);

-- Indexes on occupations
CREATE INDEX idx_occupations_category ON occupations(category);

-- Indexes on member_occupations
CREATE INDEX idx_member_occupations_member ON member_occupations(member_id);
CREATE INDEX idx_member_occupations_occupation ON member_occupations(occupation_id);

-- Indexes on education
CREATE INDEX idx_education_member ON education(member_id);
CREATE INDEX idx_education_level ON education(education_level);
CREATE INDEX idx_education_year ON education(year_completed);

-- Indexes on locations
CREATE INDEX idx_locations_type ON locations(location_type);
CREATE INDEX idx_locations_coordinates ON locations(latitude, longitude);

-- Indexes on inbox
CREATE INDEX idx_inbox_status ON inbox(status);
CREATE INDEX idx_inbox_submission_date ON inbox(submission_date DESC);
CREATE INDEX idx_inbox_type ON inbox(submission_type);

-- Indexes on change_log
CREATE INDEX idx_change_log_record ON change_log(table_name, record_id);
CREATE INDEX idx_change_log_date ON change_log(changed_at DESC);
CREATE INDEX idx_change_log_changed_by ON change_log(changed_by);

-- Indexes on disputes
CREATE INDEX idx_disputes_status ON disputes(status);
CREATE INDEX idx_disputes_record ON disputes(record_type, record_id);

-- Indexes on relationships
CREATE UNIQUE INDEX idx_unique_active_relationship ON relationships(source_id, target_id, type) WHERE is_pending = FALSE;
CREATE INDEX idx_relationships_source ON relationships(source_id);
CREATE INDEX idx_relationships_target ON relationships(target_id);
CREATE INDEX idx_relationships_type ON relationships(type);

-- Index on edge_customizations
CREATE INDEX idx_edge_customizations_relationship ON edge_customizations(relationship_id);

-- ========================================================
-- SECTION 7: CREATE VIEWS
-- ========================================================

-- View: Complete Member Info
CREATE VIEW view_members_complete AS
SELECT 
    fm.*,
    (SELECT r2_url FROM media m 
     JOIN media_members mm ON m.id = mm.media_id 
     WHERE mm.member_id = fm.id AND m.file_type = 'Photo' 
     ORDER BY m.date_taken DESC NULLS LAST, m.upload_date DESC LIMIT 1) AS latest_photo_url,
    p1.full_name AS parent1_name,
    p2.full_name AS parent2_name,
    (SELECT COUNT(*) FROM marriages WHERE spouse1_id = fm.id OR spouse2_id = fm.id) AS marriage_count,
    (SELECT COUNT(*) FROM family_members WHERE parent1_id = fm.id OR parent2_id = fm.id) AS children_count,
    (SELECT COUNT(*) FROM media_members WHERE member_id = fm.id) AS media_count,
    (SELECT COUNT(*) FROM story_members WHERE member_id = fm.id) AS story_count
FROM family_members fm
LEFT JOIN family_members p1 ON fm.parent1_id = p1.id
LEFT JOIN family_members p2 ON fm.parent2_id = p2.id;

-- View: Occupation Trends
CREATE VIEW view_occupation_trends AS
SELECT 
    o.occupation_name,
    o.category,
    COUNT(DISTINCT mo.member_id) AS member_count,
    MIN(mo.start_year) AS first_year,
    MAX(mo.end_year) AS last_year,
    ARRAY_AGG(DISTINCT fm.generation ORDER BY fm.generation) AS generations_practiced
FROM occupations o
JOIN member_occupations mo ON o.id = mo.occupation_id
JOIN family_members fm ON mo.member_id = fm.id
GROUP BY o.id, o.occupation_name, o.category
ORDER BY member_count DESC;

-- View: Migration Timeline
CREATE VIEW view_migration_timeline AS
SELECT 
    fm.full_name,
    fm.date_of_birth,
    l.name AS location_name,
    ml.relationship,
    ml.start_year,
    ml.end_year,
    l.latitude,
    l.longitude
FROM member_locations ml
JOIN family_members fm ON ml.member_id = fm.id
JOIN locations l ON ml.location_id = l.id
WHERE ml.relationship IN ('Migrated From', 'Migrated To', 'Born', 'Lived')
ORDER BY fm.generation, fm.date_of_birth, ml.start_year;

-- View: Statistics Dashboard
CREATE VIEW view_statistics AS
SELECT
    (SELECT COUNT(*) FROM family_members) AS total_members,
    (SELECT COUNT(*) FROM family_members WHERE status = 'Living') AS living_members,
    (SELECT COUNT(*) FROM family_members WHERE status = 'Deceased') AS deceased_members,
    (SELECT COUNT(*) FROM media) AS total_media,
    (SELECT COUNT(*) FROM stories) AS total_stories,
    (SELECT COUNT(*) FROM events) AS total_events,
    (SELECT MAX(generation) FROM family_members) AS max_generation,
    (SELECT AVG(EXTRACT(YEAR FROM AGE(date_of_death, date_of_birth))) 
     FROM family_members 
     WHERE status = 'Deceased' AND date_of_birth IS NOT NULL AND date_of_death IS NOT NULL) AS avg_lifespan,
    (SELECT mode() WITHIN GROUP (ORDER BY gender) FROM family_members WHERE gender IS NOT NULL) AS most_common_gender,
    (SELECT COUNT(DISTINCT member_id) FROM education WHERE education_level IN ('Undergraduate', 'Graduate', 'Doctorate')) AS college_educated_count;

-- ========================================================
-- SECTION 8: CREATE FUNCTIONS & STORED PROCEDURES
-- ========================================================

-- Function: get_descendants (Recursive)
CREATE OR REPLACE FUNCTION get_descendants(ancestor_id UUID)
RETURNS TABLE (
    id UUID,
    full_name TEXT,
    generation INTEGER,
    relationship TEXT
) AS $$
WITH RECURSIVE descendants AS (
    SELECT id, full_name, generation, 'Child' AS relationship, 1 AS depth
    FROM family_members
    WHERE parent1_id = ancestor_id OR parent2_id = ancestor_id
    UNION ALL
    SELECT fm.id, fm.full_name, fm.generation,
           CASE WHEN d.depth = 1 THEN 'Grandchild' 
                WHEN d.depth = 2 THEN 'Great-Grandchild'
                ELSE 'Descendant (Gen +' || (d.depth + 1) || ')' END,
           d.depth + 1
    FROM family_members fm
    INNER JOIN descendants d ON (fm.parent1_id = d.id OR fm.parent2_id = d.id)
)
SELECT id, full_name, generation, relationship FROM descendants;
$$ LANGUAGE SQL STABLE;

-- Function: get_ancestors (Recursive)
CREATE OR REPLACE FUNCTION get_ancestors(descendant_id UUID)
RETURNS TABLE (
    id UUID,
    full_name TEXT,
    generation INTEGER,
    relationship TEXT
) AS $$
WITH RECURSIVE ancestors AS (
    SELECT id, full_name, generation, 'Parent' AS relationship, 1 AS depth
    FROM family_members
    WHERE id IN (SELECT parent1_id FROM family_members WHERE id = descendant_id 
                 UNION SELECT parent2_id FROM family_members WHERE id = descendant_id)
    UNION ALL
    SELECT fm.id, fm.full_name, fm.generation,
           CASE WHEN a.depth = 1 THEN 'Grandparent'
                WHEN a.depth = 2 THEN 'Great-Grandparent'
                ELSE 'Ancestor (Gen -' || (a.depth + 1) || ')' END,
           a.depth + 1
    FROM family_members fm
    INNER JOIN ancestors a ON (fm.id = a.parent1_id OR fm.id = a.parent2_id)
)
SELECT id, full_name, generation, relationship FROM ancestors;
$$ LANGUAGE SQL STABLE;

-- Function: calculate_generation
CREATE OR REPLACE FUNCTION calculate_generation(member_id UUID)
RETURNS INTEGER AS $$
DECLARE
    p1_gen INTEGER;
    p2_gen INTEGER;
BEGIN
    SELECT generation INTO p1_gen FROM family_members WHERE id = (SELECT parent1_id FROM family_members WHERE id = member_id);
    SELECT generation INTO p2_gen FROM family_members WHERE id = (SELECT parent2_id FROM family_members WHERE id = member_id);
    RETURN GREATEST(COALESCE(p1_gen, 0), COALESCE(p2_gen, 0)) + 1;
END;
$$ LANGUAGE plpgsql STABLE;

-- Trigger Function: set_generation
CREATE OR REPLACE FUNCTION set_generation()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.generation IS NULL OR OLD.parent1_id != NEW.parent1_id OR OLD.parent2_id != NEW.parent2_id THEN
        NEW.generation := calculate_generation(NEW.id);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_generation
BEFORE INSERT OR UPDATE ON family_members
FOR EACH ROW EXECUTE FUNCTION set_generation();

-- Function: search_stories_semantic
CREATE OR REPLACE FUNCTION search_stories_semantic(
    query_embedding vector(768),
    match_threshold float,
    match_count int
)
RETURNS TABLE (
    id uuid,
    title text,
    story_text text,
    similarity float
) AS $$
BEGIN
    RETURN QUERY
    SELECT stories.id, stories.title, stories.story_text,
           1 - (stories.embedding <=> query_embedding) AS similarity
    FROM stories
    WHERE 1 - (stories.embedding <=> query_embedding) > match_threshold
    ORDER BY stories.embedding <=> query_embedding
    LIMIT match_count;
END;
$$ LANGUAGE plpgsql;

-- Trigger Function: update_modified_column
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_modified = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_family_members_modified
BEFORE UPDATE ON family_members
FOR EACH ROW EXECUTE FUNCTION update_modified_column();

-- Function: approve_member_submission (Transaction-safe)
CREATE OR REPLACE FUNCTION approve_member_submission(
  p_inbox_id UUID,
  p_member_data JSONB
) RETURNS JSONB AS $$
DECLARE
  v_member_id UUID;
  v_error_msg TEXT;
BEGIN
  BEGIN
    INSERT INTO family_members (
      full_name,
      gender,
      date_of_birth,
      birth_place,
      status,
      parent1_id,
      parent2_id,
      lineage,
      nickname,
      profile_photo_url,
      added_by,
      added_date
    ) VALUES (
      p_member_data->>'full_name',
      p_member_data->>'gender',
      (p_member_data->>'date_of_birth')::DATE,
      p_member_data->>'birth_place',
      COALESCE(p_member_data->>'status', 'Living'),
      (p_member_data->>'parent1_id')::UUID,
      (p_member_data->>'parent2_id')::UUID,
      COALESCE(p_member_data->>'lineage', 'Both'),
      p_member_data->>'nickname',
      p_member_data->>'profile_photo_url',
      p_member_data->>'added_by',
      NOW()
    ) RETURNING id INTO v_member_id;

    UPDATE inbox 
    SET status = 'Approved', 
        linked_record_id = v_member_id, 
        linked_record_type = 'family_member',
        review_date = NOW()
    WHERE id = p_inbox_id;

    RETURN jsonb_build_object(
      'success', true,
      'member_id', v_member_id,
      'message', 'Member approved and created'
    );
  EXCEPTION WHEN OTHERS THEN
    GET STACKED DIAGNOSTICS v_error_msg = MESSAGE_TEXT;
    RETURN jsonb_build_object(
      'success', false,
      'error', v_error_msg
    );
  END;
END;
$$ LANGUAGE plpgsql;

-- ========================================================
-- SECTION 9: ENABLE ROW LEVEL SECURITY
-- ========================================================

ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE marriages ENABLE ROW LEVEL SECURITY;
ALTER TABLE media ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_attendees ENABLE ROW LEVEL SECURITY;
ALTER TABLE traditions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tradition_practitioners ENABLE ROW LEVEL SECURITY;
ALTER TABLE occupations ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_occupations ENABLE ROW LEVEL SECURITY;
ALTER TABLE education ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE inbox ENABLE ROW LEVEL SECURITY;
ALTER TABLE change_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE edge_customizations ENABLE ROW LEVEL SECURITY;

-- ========================================================
-- SECTION 10: CREATE SECURITY FUNCTIONS & POLICIES
-- ========================================================

-- Function: Check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (auth.jwt() ->> 'email') IN (SELECT email FROM admin_users);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing policies
DROP POLICY IF EXISTS "Authenticated users can view members" ON family_members;
DROP POLICY IF EXISTS "Only admins can modify members" ON family_members;
DROP POLICY IF EXISTS "Users can create submissions" ON inbox;
DROP POLICY IF EXISTS "Users can view own submissions" ON inbox;
DROP POLICY IF EXISTS "Admins can update submissions" ON inbox;
DROP POLICY IF EXISTS "Admins can delete submissions" ON inbox;
DROP POLICY IF EXISTS "Authenticated users can view media" ON media;
DROP POLICY IF EXISTS "Admins can manage media" ON media;
DROP POLICY IF EXISTS "Authenticated users can view stories" ON stories;
DROP POLICY IF EXISTS "Admins can manage stories" ON stories;
DROP POLICY IF EXISTS "Authenticated users can view events" ON events;
DROP POLICY IF EXISTS "Admins can manage events" ON events;
DROP POLICY IF EXISTS "Authenticated users can view relations" ON marriages;
DROP POLICY IF EXISTS "Admins manage marriages" ON marriages;
DROP POLICY IF EXISTS "Admins can view admin list" ON admin_users;
DROP POLICY IF EXISTS "Only super admins manage admins" ON admin_users;
DROP POLICY IF EXISTS "Admins view change log" ON change_log;
DROP POLICY IF EXISTS "Admins manage disputes" ON disputes;

-- RLS Policies for family_members
CREATE POLICY "Authenticated users can view members"
ON family_members FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Only admins can modify members"
ON family_members FOR ALL
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

-- RLS Policies for inbox
CREATE POLICY "Users can create submissions"
ON inbox FOR INSERT
TO authenticated
WITH CHECK (submitter_email = auth.jwt() ->> 'email' OR is_admin());

CREATE POLICY "Users can view own submissions"
ON inbox FOR SELECT
TO authenticated
USING (submitter_email = auth.jwt() ->> 'email' OR is_admin());

CREATE POLICY "Admins can update submissions"
ON inbox FOR UPDATE
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

CREATE POLICY "Admins can delete submissions"
ON inbox FOR DELETE
TO authenticated
USING (is_admin());

-- RLS Policies for media
CREATE POLICY "Authenticated users can view media" ON media FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage media" ON media FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

-- RLS Policies for stories
CREATE POLICY "Authenticated users can view stories" ON stories FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage stories" ON stories FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

-- RLS Policies for events
CREATE POLICY "Authenticated users can view events" ON events FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage events" ON events FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

-- RLS Policies for marriages
CREATE POLICY "Authenticated users can view relations" ON marriages FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage marriages" ON marriages FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

-- RLS Policies for admin_users
CREATE POLICY "Admins can view admin list" ON admin_users FOR SELECT TO authenticated USING (is_admin());
CREATE POLICY "Only super admins manage admins" ON admin_users FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

-- RLS Policies for change_log
CREATE POLICY "Admins view change log" ON change_log FOR SELECT TO authenticated USING (is_admin());

-- RLS Policies for disputes
CREATE POLICY "Admins manage disputes" ON disputes FOR ALL TO authenticated USING (is_admin());

-- RLS Policies for relationships
CREATE POLICY "Authenticated users can view relationships" ON relationships FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage relationships" ON relationships FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

-- RLS Policies for edge_customizations
CREATE POLICY "Authenticated users can view edge customizations" ON edge_customizations FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage edge customizations" ON edge_customizations FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

-- ========================================================
-- SECTION 11: CLEANUP & COMPLETION
-- ========================================================

-- Refresh statistics for query planner
ANALYZE;

-- Print completion message
SELECT 'Database reset and rebuild complete!' AS status;

-- ========================================================
-- END OF RESET SCRIPT
-- ========================================================

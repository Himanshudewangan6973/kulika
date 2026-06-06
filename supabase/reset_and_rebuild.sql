-- ========================================================
-- ROOTS OF HERITAGE (KULIKA) - DATABASE SYNC VERSION 9.0
-- ========================================================
-- Purpose: Complete database reset and rebuild
-- Version: 9.0 (June 2026) - Permission & Timeline Fixed
-- Author: Gemini CLI
-- ========================================================

-- ========================================================
-- SECTION 1: CLEANUP
-- ========================================================

ALTER TABLE IF EXISTS public.family_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.inbox DISABLE ROW LEVEL SECURITY;

DROP VIEW IF EXISTS public.view_statistics CASCADE;
DROP VIEW IF EXISTS public.view_migration_timeline CASCADE;
DROP VIEW IF EXISTS public.view_occupation_trends CASCADE;
DROP VIEW IF EXISTS public.view_members_complete CASCADE;

DROP TABLE IF EXISTS public.edge_customizations CASCADE;
DROP TABLE IF EXISTS public.relationships CASCADE;
DROP TABLE IF EXISTS public.disputes CASCADE;
DROP TABLE IF EXISTS public.change_log CASCADE;
DROP TABLE IF EXISTS public.admin_users CASCADE;
DROP TABLE IF EXISTS public.member_locations CASCADE;
DROP TABLE IF EXISTS public.locations CASCADE;
DROP TABLE IF EXISTS public.member_occupations CASCADE;
DROP TABLE IF EXISTS public.occupations CASCADE;
DROP TABLE IF EXISTS public.education CASCADE;
DROP TABLE IF EXISTS public.tradition_practitioners CASCADE;
DROP TABLE IF EXISTS public.traditions CASCADE;
DROP TABLE IF EXISTS public.event_attendees CASCADE;
DROP TABLE IF EXISTS public.events CASCADE;
DROP TABLE IF EXISTS public.story_members CASCADE;
DROP TABLE IF EXISTS public.stories CASCADE;
DROP TABLE IF EXISTS public.media_members CASCADE;
DROP TABLE IF EXISTS public.media CASCADE;
DROP TABLE IF EXISTS public.marriages CASCADE;
DROP TABLE IF EXISTS public.family_members CASCADE;
DROP TABLE IF EXISTS public.inbox CASCADE;

DROP FUNCTION IF EXISTS public.is_admin() CASCADE;
DROP FUNCTION IF EXISTS public.search_stories_semantic(vector, float, int) CASCADE;
DROP FUNCTION IF EXISTS public.update_modified_column() CASCADE;
DROP FUNCTION IF EXISTS public.set_generation() CASCADE;
DROP FUNCTION IF EXISTS public.update_ancestor_ids() CASCADE;
DROP FUNCTION IF EXISTS public.calculate_generation(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.get_ancestors(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.get_descendants(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.approve_member_submission(uuid, jsonb) CASCADE;

DROP TYPE IF EXISTS public.relationship_type CASCADE;

-- ========================================================
-- SECTION 2: INFRASTRUCTURE
-- ========================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "vector"; 

CREATE TYPE public.relationship_type AS ENUM ('parent', 'spouse', 'sibling', 'unknown', 'step-parent', 'adoptive-parent', 'guardian', 'foster', 'in-law', 'custom');

-- ========================================================
-- SECTION 3: CORE TABLES
-- ========================================================

CREATE TABLE public.family_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name TEXT NOT NULL,
    given_name TEXT,
    surname TEXT,
    nickname TEXT,
    gender TEXT CHECK (gender IN ('Male', 'Female', 'Other')),
    date_of_birth DATE,
    date_of_death DATE,
    birth_place TEXT,
    current_location TEXT,
    lineage TEXT CHECK (lineage IN ('Father', 'Mother', 'Both')) NOT NULL DEFAULT 'Both',
    status TEXT CHECK (status IN ('Living', 'Deceased')) DEFAULT 'Living',
    is_deceased BOOLEAN GENERATED ALWAYS AS (status = 'Deceased') STORED,
    generation INTEGER,
    ancestor_ids UUID[] DEFAULT '{}', 
    lineage_type_p1 TEXT DEFAULT 'biological',
    lineage_type_p2 TEXT DEFAULT 'biological',
    visibility_scope TEXT DEFAULT 'protected' CHECK (visibility_scope IN ('public', 'protected', 'family', 'branch', 'private', 'admin_only')),
    parent1_id UUID REFERENCES public.family_members(id) ON DELETE SET NULL,
    parent2_id UUID REFERENCES public.family_members(id) ON DELETE SET NULL,
    bio_summary TEXT,
    profile_photo_url TEXT,
    contact_info JSONB,
    added_by TEXT,
    added_date TIMESTAMPTZ DEFAULT NOW(),
    last_modified TIMESTAMPTZ DEFAULT NOW(),
    search_vector tsvector GENERATED ALWAYS AS (
        to_tsvector('english', coalesce(full_name, '') || ' ' || coalesce(nickname, '') || ' ' || coalesce(bio_summary, ''))
    ) STORED
);

CREATE TABLE public.marriages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    spouse1_id UUID NOT NULL REFERENCES public.family_members(id) ON DELETE CASCADE,
    spouse2_id UUID NOT NULL REFERENCES public.family_members(id) ON DELETE CASCADE,
    marriage_date DATE,
    status TEXT CHECK (status IN ('Married', 'Divorced', 'Widowed')) DEFAULT 'Married'
);

CREATE TABLE public.media (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    filename TEXT NOT NULL,
    file_type TEXT NOT NULL,
    r2_key TEXT NOT NULL UNIQUE,
    r2_url TEXT NOT NULL,
    upload_date TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.media_members (
    media_id UUID REFERENCES public.media(id) ON DELETE CASCADE,
    member_id UUID REFERENCES public.family_members(id) ON DELETE CASCADE,
    PRIMARY KEY (media_id, member_id)
);

CREATE TABLE public.stories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    story_text TEXT NOT NULL,
    story_type TEXT NOT NULL,
    event_date DATE,
    added_date TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.story_members (
    story_id UUID REFERENCES public.stories(id) ON DELETE CASCADE,
    member_id UUID REFERENCES public.family_members(id) ON DELETE CASCADE,
    PRIMARY KEY (story_id, member_id)
);

CREATE TABLE public.events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    event_type TEXT NOT NULL,
    event_date DATE NOT NULL,
    location TEXT,
    description TEXT
);

CREATE TABLE public.inbox (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    submission_type TEXT NOT NULL,
    status TEXT DEFAULT 'Pending',
    raw_data JSONB NOT NULL,
    submitter_email TEXT,
    submission_date TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.admin_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL
);

CREATE TABLE public.relationships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_id UUID NOT NULL REFERENCES public.family_members(id) ON DELETE CASCADE,
    target_id UUID NOT NULL REFERENCES public.family_members(id) ON DELETE CASCADE,
    type public.relationship_type NOT NULL DEFAULT 'unknown',
    is_pending BOOLEAN DEFAULT TRUE
);

CREATE TABLE public.edge_customizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    relationship_id UUID NOT NULL REFERENCES public.relationships(id) ON DELETE CASCADE UNIQUE,
    bend_points JSONB DEFAULT '[]'::jsonb,
    line_style TEXT DEFAULT 'orthogonal'
);

-- ========================================================
-- SECTION 4: FUNCTIONS & TRIGGERS
-- ========================================================

CREATE OR REPLACE FUNCTION public.calculate_generation(member_id UUID)
RETURNS INTEGER AS $$
DECLARE
    p1_gen INTEGER;
    p2_gen INTEGER;
BEGIN
    SELECT generation INTO p1_gen FROM public.family_members WHERE id = (SELECT parent1_id FROM public.family_members WHERE id = member_id);
    SELECT generation INTO p2_gen FROM public.family_members WHERE id = (SELECT parent2_id FROM public.family_members WHERE id = member_id);
    RETURN GREATEST(COALESCE(p1_gen, 0), COALESCE(p2_gen, 0)) + 1;
END;
$$ LANGUAGE plpgsql STABLE;

CREATE OR REPLACE FUNCTION public.update_ancestor_ids()
RETURNS TRIGGER AS $$
DECLARE
    p1_ancestors UUID[];
    p2_ancestors UUID[];
BEGIN
    SELECT ancestor_ids INTO p1_ancestors FROM public.family_members WHERE id = NEW.parent1_id;
    SELECT ancestor_ids INTO p2_ancestors FROM public.family_members WHERE id = NEW.parent2_id;
    NEW.ancestor_ids := ARRAY(
        SELECT DISTINCT x FROM unnest(COALESCE(p1_ancestors, '{}'::UUID[]) || COALESCE(p2_ancestors, '{}'::UUID[]) || CASE WHEN NEW.parent1_id IS NOT NULL THEN ARRAY[NEW.parent1_id] ELSE '{}'::UUID[] END || CASE WHEN NEW.parent2_id IS NOT NULL THEN ARRAY[NEW.parent2_id] ELSE '{}'::UUID[] END) AS x
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.set_generation()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.generation IS NULL OR OLD.parent1_id IS DISTINCT FROM NEW.parent1_id OR OLD.parent2_id IS DISTINCT FROM NEW.parent2_id THEN
        NEW.generation := public.calculate_generation(NEW.id);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_generation BEFORE INSERT OR UPDATE ON public.family_members FOR EACH ROW EXECUTE FUNCTION public.set_generation();
CREATE TRIGGER trigger_update_ancestor_ids BEFORE INSERT OR UPDATE ON public.family_members FOR EACH ROW EXECUTE FUNCTION public.update_ancestor_ids();

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (SELECT 1 FROM public.admin_users WHERE email = auth.jwt() ->> 'email');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.approve_member_submission(p_inbox_id UUID, p_member_data JSONB) RETURNS JSONB AS $$
DECLARE
  v_member_id UUID;
  v_error_msg TEXT;
BEGIN
  BEGIN
    INSERT INTO public.family_members (full_name, given_name, surname, gender, date_of_birth, birth_place, status, parent1_id, parent2_id, lineage, nickname, profile_photo_url, visibility_scope, lineage_type_p1, lineage_type_p2, added_by) 
    VALUES (p_member_data->>'full_name', p_member_data->>'given_name', p_member_data->>'surname', p_member_data->>'gender', (p_member_data->>'date_of_birth')::DATE, p_member_data->>'birth_place', COALESCE(p_member_data->>'status', 'Living'), (p_member_data->>'parent1_id')::UUID, (p_member_data->>'parent2_id')::UUID, COALESCE(p_member_data->>'lineage', 'Both'), p_member_data->>'nickname', p_member_data->>'profile_photo_url', COALESCE(p_member_data->>'visibility_scope', 'protected'), COALESCE(p_member_data->>'lineage_type_p1', 'biological'), COALESCE(p_member_data->>'lineage_type_p2', 'biological'), p_member_data->>'added_by') 
    RETURNING id INTO v_member_id;
    UPDATE public.inbox SET status = 'Approved', linked_record_id = v_member_id WHERE id = p_inbox_id;
    RETURN jsonb_build_object('success', true, 'member_id', v_member_id);
  EXCEPTION WHEN OTHERS THEN
    GET STACKED DIAGNOSTICS v_error_msg = MESSAGE_TEXT;
    RETURN jsonb_build_object('success', false, 'error', v_error_msg);
  END;
END;
$$ LANGUAGE plpgsql;

-- ========================================================
-- SECTION 5: VIEWS
-- ========================================================

CREATE VIEW public.view_members_complete AS
SELECT fm.*, (SELECT r2_url FROM public.media m JOIN public.media_members mm ON m.id = mm.media_id WHERE mm.member_id = fm.id AND m.file_type = 'Photo' LIMIT 1) AS latest_photo_url, (SELECT COUNT(*) FROM public.family_members WHERE parent1_id = fm.id OR parent2_id = fm.id) AS children_count, (SELECT COUNT(*) FROM public.media_members WHERE member_id = fm.id) AS media_count, (SELECT COUNT(*) FROM public.story_members WHERE member_id = fm.id) AS stories_count FROM public.family_members fm;

-- ========================================================
-- SECTION 6: PERMISSIONS & RLS
-- ========================================================

ALTER TABLE public.family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inbox ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public Read" ON public.family_members FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "Admin All" ON public.family_members FOR ALL TO authenticated USING (public.is_admin());
CREATE POLICY "User Submission" ON public.inbox FOR INSERT TO authenticated WITH CHECK (TRUE);
CREATE POLICY "Admin Inbox" ON public.inbox FOR ALL TO authenticated USING (public.is_admin());
CREATE POLICY "Public Events" ON public.events FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "Public Media" ON public.media FOR SELECT TO authenticated USING (TRUE);

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO service_role;
GRANT INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- ========================================================
-- SECTION 7: SEED DATA
-- ========================================================

INSERT INTO public.family_members (id, full_name, given_name, surname, gender, date_of_birth, lineage, status, generation)
VALUES 
('00000000-0000-0000-0000-000000000001', 'Harish Chandra Dewangan', 'Harish', 'Dewangan', 'Male', '1940-05-15', 'Father', 'Deceased', 1),
('00000000-0000-0000-0000-000000000002', 'Savitri Dewangan', 'Savitri', 'Dewangan', 'Female', '1945-08-20', 'Mother', 'Deceased', 1),
('00000000-0000-0000-0000-000000000003', 'Rajesh Dewangan', 'Rajesh', 'Dewangan', 'Male', '1965-10-10', 'Father', 'Living', 2),
('00000000-0000-0000-0000-000000000004', 'Suman Dewangan', 'Suman', 'Dewangan', 'Female', '1968-03-12', 'Mother', 'Living', 2);

UPDATE public.family_members SET parent1_id = '00000000-0000-0000-0000-000000000001', parent2_id = '00000000-0000-0000-0000-000000000002' WHERE id = '00000000-0000-0000-0000-000000000003';

INSERT INTO public.relationships (source_id, target_id, type, is_pending)
VALUES 
('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000003', 'parent', FALSE),
('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000003', 'parent', FALSE),
('00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000004', 'spouse', FALSE);

INSERT INTO public.events (name, event_type, event_date, location, description)
VALUES ('Grand Reunion 2024', 'Reunion', '2024-12-25', 'Raipur', 'A massive gathering of the Dewangan clan.');

-- ========================================================
-- SECTION 8: FINALIZE
-- ========================================================

ANALYZE;
NOTIFY pgrst, 'reload schema';
SELECT 'Master Rebuild v9.0 Complete!' AS status;

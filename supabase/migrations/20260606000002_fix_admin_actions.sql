-- Migration: Fix Admin Permissions and Inbox Columns
-- Description: Ensures review_notes exists and family_members is accessible

-- 1. Ensure review_notes exists in inbox
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='inbox' AND column_name='review_notes') THEN
    ALTER TABLE inbox ADD COLUMN review_notes TEXT;
  END IF;
END $$;

-- 2. Repair family_members table permissions
DO $$ 
DECLARE
    t text;
BEGIN 
    FOR t IN SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' 
    AND table_name IN ('family_members', 'family_relationships', 'media', 'stories', 'events', 'inbox')
    LOOP
        -- Enable RLS
        EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
        
        -- Explicit GRANTS
        EXECUTE format('GRANT ALL ON TABLE %I TO authenticated', t);
        EXECUTE format('GRANT ALL ON TABLE %I TO anon', t);
        EXECUTE format('GRANT ALL ON TABLE %I TO service_role', t);
        
        -- Ensure public SELECT if not already there
        EXECUTE format('DROP POLICY IF EXISTS "Public select %I" ON %I', t, t);
        EXECUTE format('CREATE POLICY "Public select %I" ON %I FOR SELECT TO authenticated USING (true)', t, t);
    END LOOP;
END $$;

-- 3. Specific permissions for family_members to allow approvals
GRANT ALL ON TABLE family_members TO authenticated;
GRANT ALL ON TABLE family_members TO service_role;

-- 4. Ensure admin can do anything on family_members
DO $$ BEGIN
    DROP POLICY IF EXISTS "Admins manage family members" ON family_members;
    CREATE POLICY "Admins manage family members" ON family_members FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());
END $$;

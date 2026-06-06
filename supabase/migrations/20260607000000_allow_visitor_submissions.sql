-- Migration: Allow Visitor Submissions
-- Description: Updates RLS policies for the 'inbox' table to allow unauthenticated (visitor) submissions.

-- 1. Drop existing restricted insert policy
DROP POLICY IF EXISTS "Users can create submissions" ON inbox;
DROP POLICY IF EXISTS "User Submission" ON inbox;

-- 2. Create a new policy that allows both authenticated and anonymous users to submit
-- For authenticated users, we still ideally want to verify the email, but for visitors, we accept what's in the payload.
-- Actually, a simpler policy for the inbox is usually best to encourage contributions.
CREATE POLICY "Enable insert for all users" 
ON public.inbox 
FOR INSERT 
TO public
WITH CHECK (true);

-- 3. Ensure anon has permissions to insert and select
GRANT INSERT, SELECT ON TABLE public.inbox TO anon;
GRANT INSERT, SELECT ON TABLE public.inbox TO authenticated;

-- 4. Allow all users (including visitors) to view core content
DO $$ 
DECLARE
    t text;
BEGIN 
    FOR t IN SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' 
    AND table_name IN ('family_members', 'family_relationships', 'media', 'stories', 'events', 'communities')
    LOOP
        -- Allow anon to select
        EXECUTE format('DROP POLICY IF EXISTS "Public select %I" ON %I', t, t);
        EXECUTE format('CREATE POLICY "Public select %I" ON %I FOR SELECT TO public USING (true)', t, t);
        
        -- Ensure grants
        EXECUTE format('GRANT SELECT ON TABLE %I TO anon', t);
        EXECUTE format('GRANT SELECT ON TABLE %I TO authenticated', t);
    END LOOP;
END $$;

-- 5. Grant SELECT on views to visitors
GRANT SELECT ON TABLE public.view_members_complete TO anon;
GRANT SELECT ON TABLE public.view_occupation_trends TO anon;
GRANT SELECT ON TABLE public.view_migration_timeline TO anon;
GRANT SELECT ON TABLE public.view_statistics TO anon;

GRANT SELECT ON TABLE public.view_members_complete TO authenticated;
GRANT SELECT ON TABLE public.view_occupation_trends TO authenticated;
GRANT SELECT ON TABLE public.view_migration_timeline TO authenticated;
GRANT SELECT ON TABLE public.view_statistics TO authenticated;

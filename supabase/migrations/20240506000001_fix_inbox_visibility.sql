-- Migration: Fix Inbox Visibility
-- Allow anyone to see pending submissions so they appear on the tree immediately.

DROP POLICY IF EXISTS "Users can view own submissions" ON inbox;

CREATE POLICY "Anyone can view pending submissions"
ON inbox FOR SELECT
USING (status = 'Pending');

CREATE POLICY "Admins can view all submissions"
ON inbox FOR SELECT
TO authenticated
USING (is_admin());

-- Also ensure public can see members and marriages (usually public in a genealogy site)
DROP POLICY IF EXISTS "Authenticated users can view members" ON family_members;
CREATE POLICY "Public can view members" ON family_members FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can view relations" ON marriages;
CREATE POLICY "Public can view marriages" ON marriages FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can view relationships" ON relationships;
CREATE POLICY "Public can view relationships" ON relationships FOR SELECT USING (true);

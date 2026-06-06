-- Update family_members search_vector to include new name fields
-- Run this in Supabase SQL Editor or as a migration

-- First, drop the existing generated column
ALTER TABLE family_members DROP COLUMN IF EXISTS search_vector;

-- Recreate with new fields
ALTER TABLE family_members
ADD COLUMN search_vector tsvector GENERATED ALWAYS AS (
    to_tsvector('english',
        coalesce(full_name, '') || ' ' ||
        coalesce(given_name, '') || ' ' ||
        coalesce(middle_names, '') || ' ' ||
        coalesce(surname, '') || ' ' ||
        coalesce(preferred_display_name, '') || ' ' ||
        coalesce(native_name, '') || ' ' ||
        coalesce(name_notes, '') || ' ' ||
        coalesce(bio, '')
    )
) STORED;

-- Recreate the index
DROP INDEX IF EXISTS idx_family_members_search;
CREATE INDEX idx_family_members_search ON family_members USING GIN(search_vector);
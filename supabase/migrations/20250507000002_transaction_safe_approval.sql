-- Transaction-safe approval function
-- This function ensures that either both the member creation AND inbox update succeed,
-- or neither happens (rollback)

CREATE OR REPLACE FUNCTION approve_member_submission(
  p_inbox_id UUID,
  p_member_data JSONB
) RETURNS JSONB AS $$
DECLARE
  v_member_id UUID;
  v_error_msg TEXT;
BEGIN
  -- Start transaction
  BEGIN
    -- 1. Create the family member
    INSERT INTO family_members (
      full_name,
      first_name,
      last_name,
      gender,
      date_of_birth,
      birth_place,
      is_deceased,
      date_of_death,
      parent1_id,
      parent2_id,
      lineage,
      nickname,
      profile_photo_url,
      added_by,
      created_at
    ) VALUES (
      p_member_data->>'full_name',
      p_member_data->>'first_name',
      p_member_data->>'last_name',
      p_member_data->>'gender',
      (p_member_data->>'date_of_birth')::DATE,
      p_member_data->>'birth_place',
      COALESCE((p_member_data->>'is_deceased')::BOOLEAN, false),
      (p_member_data->>'date_of_death')::DATE,
      (p_member_data->>'parent1_id')::UUID,
      (p_member_data->>'parent2_id')::UUID,
      p_member_data->>'lineage',
      p_member_data->>'nickname',
      p_member_data->>'profile_photo_url',
      p_member_data->>'added_by',
      NOW()
    ) RETURNING id INTO v_member_id;

    -- 2. If this submission is a tree-relative record, persist simple child/parent links
    IF p_member_data->>'relationship_to_base' = 'parent' AND p_member_data->>'base_member_id' IS NOT NULL THEN
      UPDATE family_members
      SET
        parent1_id = CASE WHEN parent1_id IS NULL THEN v_member_id ELSE parent1_id END,
        parent2_id = CASE
          WHEN parent1_id IS NOT NULL AND parent2_id IS NULL THEN v_member_id
          ELSE parent2_id
        END
      WHERE id = (p_member_data->>'base_member_id')::UUID;
    END IF;

    -- 3. Update inbox status
    UPDATE inbox
    SET 
      status = 'Approved',
      reviewed_by = 'Admin',
      review_date = NOW(),
      linked_record_id = v_member_id,
      linked_record_type = 'family_member'
    WHERE id = p_inbox_id;

    -- 4. Return success
    RETURN jsonb_build_object(
      'success', true,
      'member_id', v_member_id,
      'message', 'Member approval completed successfully'
    );

  EXCEPTION WHEN OTHERS THEN
    -- Catch any error and return it
    GET STACKED DIAGNOSTICS v_error_msg = MESSAGE_TEXT;
    RETURN jsonb_build_object(
      'success', false,
      'error', v_error_msg,
      'message', 'Member approval failed and was rolled back'
    );
  END;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION approve_member_submission(UUID, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION approve_member_submission(UUID, JSONB) TO service_role;

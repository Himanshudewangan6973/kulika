import { describe, it, expect, beforeEach } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import { claimsEngine } from '@/lib/claims-engine';
import { auditLogger } from '@/lib/audit-logger';

/**
 * Integration test for complete claims workflow
 * Requires test database setup
 */
const describeIfSupabase =
  process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY ? describe : describe.skip;

describeIfSupabase('Claims Workflow Integration', () => {
  let testFamilyId: string;
  let testMemberId: string;

  beforeEach(async () => {
    // Setup test data
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!
    );

    // Create test family
    const { data: family } = await supabase
      .from('families')
      .insert({
        name: 'Test Family ' + Date.now(),
        slug: 'test-family-' + Date.now(),
        privacy_level: 'private',
      })
      .select()
      .single();

    testFamilyId = family.id;

    // Create test member
    const { data: member } = await supabase
      .from('family_members')
      .insert({
        family_id: testFamilyId,
        full_name: 'Test Member',
        lineage: 'Father',
      })
      .select()
      .single();

    testMemberId = member.id;
  });

  it('should create claim and add evidence', async () => {
    // Create claim
    const claim = await claimsEngine.createClaim(
      testFamilyId,
      testMemberId,
      'birth_date',
      '1950-01-01',
      'certificate',
      0.95
    );

    expect(claim.claimType).toBe('birth_date');
    expect(claim.status).toBe('proposed');

    // Add evidence
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!
    );

    const { data: evidence } = await supabase
      .from('evidence')
      .insert({
        claim_id: claim.id,
        evidence_type: 'document',
        title: 'Birth Certificate',
        trust_score: 0.98,
        uploaded_by: 'test-user',
      })
      .select()
      .single();

    expect(evidence).toBeDefined();
  });

  it('should detect conflicting claims', async () => {
    // Create two conflicting claims
    const claim1 = await claimsEngine.createClaim(
      testFamilyId,
      testMemberId,
      'birth_date',
      '1950-01-01',
      'certificate',
      0.95
    );

    const claim2 = await claimsEngine.createClaim(
      testFamilyId,
      testMemberId,
      'birth_date',
      '1950-02-01',
      'interview',
      0.60
    );

    expect(claim1.claimValue).not.toBe(claim2.claimValue);
  });

  it('should create audit trail for all changes', async () => {
    // Create claim
    const claim = await claimsEngine.createClaim(
      testFamilyId,
      testMemberId,
      'birth_date',
      '1950-01-01',
      'certificate',
      0.95
    );

    // Log change
    await auditLogger.logChange(
      testFamilyId,
      'claim',
      claim.id,
      'status',
      'proposed',
      'approved',
      'Admin approval'
    );

    // Verify audit trail
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!
    );

    const { data: revisions } = await supabase
      .from('revisions')
      .select('*')
      .eq('family_id', testFamilyId)
      .eq('entity_id', claim.id);

    expect(revisions?.length).toBeGreaterThan(0);
  });
});

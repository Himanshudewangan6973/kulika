/**
 * @file src/components/moderation/ClaimApprovalPanel.tsx
 * @description Panel for administrators to review, approve, or dispute family member claims.
 * Requirement: Integrates the claims state management for centralized moderation actions.
 */

'use client';

import { useState, useEffect } from 'react';
import { useFamilySpaceStore } from '@/store/familySpaceStore';
import { useClaimsStore } from '@/store/claimsStore';
import { createClient } from '@/lib/supabase/client';
import type { Claim } from '@/types/kulika';
import ClaimCard from '@/components/claims/ClaimCard';
import { AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function ClaimApprovalPanel() {
  const { currentSpace, canApproveMembers } = useFamilySpaceStore();
  const { claims, setClaims, updateClaimStatus } = useClaimsStore();
  
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'proposed' | 'disputed'>('proposed');
  const supabase = createClient();
  
  // Use a pseudo-memberId to store global family claims in the store for the admin panel
  const globalClaimsKey = 'GLOBAL_ADMIN';
  const displayClaims = claims[globalClaimsKey] || [];

  useEffect(() => {
    if (!currentSpace || !canApproveMembers) return;

    const fetchClaims = async () => {
      if (!supabase) {
        setLoading(false);
        return;
      }

      let query = supabase
        .from('claims')
        .select('*')
        .eq('family_id', currentSpace.id);

      if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      const { data } = await query.order('claimed_at', { ascending: false });
      setClaims(globalClaimsKey, (data as unknown as Claim[]) || []);
      setLoading(false);
    };

    fetchClaims();
  }, [currentSpace, canApproveMembers, filter, supabase, setClaims]);

  const handleApprove = async (claimId: string) => {
    if (!supabase) return;
    const user = await supabase.auth.getUser();
    await supabase
      .from('claims')
      .update({
        status: 'approved',
        approved_by: user.data.user?.id,
        approved_at: new Date().toISOString(),
      })
      .eq('id', claimId);

    updateClaimStatus(claimId, 'approved');
  };

  const handleDispute = async (claimId: string) => {
    if (!supabase) return;
    await supabase
      .from('claims')
      .update({ status: 'disputed' })
      .eq('id', claimId);

    updateClaimStatus(claimId, 'disputed');
  };

  if (!canApproveMembers) {
    return (
      <div className="bg-rose-50 border border-rose-200 rounded-lg p-4">
        <p className="text-sm text-rose-700">
          ✗ You don&apos;t have permission to approve claims
        </p>
      </div>
    );
  }

  if (loading) {
    return <LoadingSpinner message="Loading claims..." />;
  }

  const stats = {
    proposed: displayClaims.filter((c) => c.status === 'proposed').length,
    approved: displayClaims.filter((c) => c.status === 'approved').length,
    disputed: displayClaims.filter((c) => c.status === 'disputed').length,
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <AlertCircle className="text-amber-600" size={16} />
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Pending</span>
          </div>
          <div className="text-3xl font-black text-amber-700">{stats.proposed}</div>
        </div>

        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle className="text-emerald-600" size={16} />
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Approved</span>
          </div>
          <div className="text-3xl font-black text-emerald-700">{stats.approved}</div>
        </div>

        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <XCircle className="text-rose-600" size={16} />
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Disputed</span>
          </div>
          <div className="text-3xl font-black text-rose-700">{stats.disputed}</div>
        </div>
      </div>

      <div className="flex gap-2 border-b border-slate-100">
        {(['all', 'proposed', 'disputed'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-6 py-3 font-bold text-sm border-b-2 transition-all ${
              filter === f
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {displayClaims.length === 0 ? (
          <p className="text-slate-400 text-sm py-8 text-center italic">No claims found for this status.</p>
        ) : (
          displayClaims.map((claim) => (
            <ClaimCard
              key={claim.id}
              claim={claim as any}
              onApprove={() => handleApprove(claim.id)}
              onDispute={() => handleDispute(claim.id)}
              canApprove={claim.status === 'proposed'}
            />
          ))
        )}
      </div>
    </div>
  );
}

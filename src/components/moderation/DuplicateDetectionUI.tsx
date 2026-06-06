'use client';

import { useEffect, useState } from 'react';
import { useFamilySpaceStore } from '@/store/familySpaceStore';
import { createClient } from '@/lib/supabase/client';
import type { PotentialDuplicate } from '@/types/kulika';
import { AlertTriangle, Check, X } from 'lucide-react';
import ConfidenceIndicator from '@/components/claims/ConfidenceIndicator';

export default function DuplicateDetectionUI() {
  const { currentSpace, canMergeMembers } = useFamilySpaceStore();
  const [duplicates, setDuplicates] = useState<PotentialDuplicate[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    if (!currentSpace) return;

    const fetchDuplicates = async () => {
      if (!supabase) {
        setLoading(false);
        return;
      }
      
      const { data, error } = await supabase
        .from('potential_duplicates')
        .select('*, member_1:member_id_1(*), member_2:member_id_2(*)')
        .eq('family_id', currentSpace.id)
        .eq('status', 'detected')
        .order('similarity_score', { ascending: false });

      if (!error) {
        setDuplicates(data || []);
      }
      setLoading(false);
    };

    fetchDuplicates();
  }, [currentSpace, supabase]);

  const handleMarkFalsePositive = async (id: string) => {
    if (!supabase) return;
    await supabase
      .from('potential_duplicates')
      .update({ status: 'false_positive' })
      .eq('id', id);

    setDuplicates((prev) => prev.filter((d) => d.id !== id));
  };

  const handleConfirmDuplicate = async (id: string) => {
    if (!supabase) return;
    await supabase
      .from('potential_duplicates')
      .update({ status: 'confirmed' })
      .eq('id', id);

    setDuplicates((prev) => prev.filter((d) => d.id !== id));
  };

  if (loading) {
    return <div className="animate-pulse h-20 bg-gray-200 rounded" />;
  }

  if (duplicates.length === 0) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <p className="text-sm text-green-700">✓ No potential duplicates detected</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-4">
        <AlertTriangle className="text-yellow-600" size={20} />
        <h3 className="font-semibold text-lg">
          {duplicates.length} Potential Duplicate{duplicates.length !== 1 ? 's' : ''}
        </h3>
      </div>

      {duplicates.map((duplicate) => (
        <div
          key={duplicate.id}
          className="border rounded-lg p-4 bg-yellow-50 border-yellow-200"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h4 className="font-semibold mb-2">Potential Match</h4>

              <div className="grid grid-cols-2 gap-4 mb-3">
                <div>
                  <p className="font-medium text-sm">{duplicate.member1?.fullName}</p>
                  {duplicate.member1?.dateOfBirth && (
                    <p className="text-xs text-gray-600">
                      {new Date(duplicate.member1.dateOfBirth).getFullYear()}
                    </p>
                  )}
                </div>
                <div>
                  <p className="font-medium text-sm">{duplicate.member2?.fullName}</p>
                  {duplicate.member2?.dateOfBirth && (
                    <p className="text-xs text-gray-600">
                      {new Date(duplicate.member2.dateOfBirth).getFullYear()}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-1 text-xs text-gray-600 mb-3">
                {duplicate.nameMatch && <div>✓ Names match</div>}
                {duplicate.parentMatch && <div>✓ Parents match</div>}
                {duplicate.dateMatch && <div>✓ Birth dates match</div>}
                {duplicate.locationMatch && <div>✓ Locations match</div>}
              </div>

              <div>
                <ConfidenceIndicator
                  score={duplicate.similarityScore}
                  size="lg"
                  showLabel={true}
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              {canMergeMembers() && (
                <>
                  <button
                    onClick={() => handleConfirmDuplicate(duplicate.id)}
                    className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition"
                  >
                    <Check size={16} />
                    Confirm & Merge
                  </button>
                  <button
                    onClick={() => handleMarkFalsePositive(duplicate.id)}
                    className="flex items-center gap-2 px-3 py-2 bg-gray-200 text-gray-700 rounded text-sm hover:bg-gray-300 transition"
                  >
                    <X size={16} />
                    Not a Match
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

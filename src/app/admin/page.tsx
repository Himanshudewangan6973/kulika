/**
 * @file src/app/admin/page.tsx
 * @description Admin Dashboard for overviewing stats, managing claims, and monitoring duplicates.
 * Requirement: Central hub for family space administrators to maintain data quality.
 */

'use client';

import { useEffect, useState } from 'react';
import { useFamilySpaceStore } from '@/store/familySpaceStore';
import { useRevisionStore } from '@/store/revisionStore';
import { createClient } from '@/lib/supabase/client';
import {
  BarChart3,
  AlertCircle,
  CheckCircle,
  Clock,
  Users,
} from 'lucide-react';
import ClaimApprovalPanel from '@/components/moderation/ClaimApprovalPanel';
import DuplicateDetectionUI from '@/components/moderation/DuplicateDetectionUI';

interface AdminStats {
  pendingClaims: number;
  approvedClaims: number;
  duplicatesDetected: number;
  totalMembers: number;
  memberGrowth: number;
  lastUpdate: string;
}

export default function AdminDashboard() {
  const { currentSpace, canApproveMembers } = useFamilySpaceStore();
  const { revisions } = useRevisionStore();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'claims' | 'duplicates' | 'audit'>('overview');

  useEffect(() => {
    if (!currentSpace || !canApproveMembers) {
      setLoading(false);
      return;
    }

    const fetchStats = async () => {
      try {
        const supabase = createClient();
        if (!supabase) {
          setStats({
            pendingClaims: 0,
            approvedClaims: 0,
            duplicatesDetected: 0,
            totalMembers: 0,
            memberGrowth: 0,
            lastUpdate: new Date().toISOString(),
          });
          return;
        }

        // Pending claims
        const { count: pendingCount } = await supabase
          .from('claims')
          .select('*', { count: 'exact', head: true })
          .eq('family_id', currentSpace.id)
          .eq('status', 'proposed');

        // Approved claims
        const { count: approvedCount } = await supabase
          .from('claims')
          .select('*', { count: 'exact', head: true })
          .eq('family_id', currentSpace.id)
          .eq('status', 'approved');

        // Duplicates
        const { count: duplicatesCount } = await supabase
          .from('potential_duplicates')
          .select('*', { count: 'exact', head: true })
          .eq('family_id', currentSpace.id)
          .eq('status', 'detected');

        // Members
        const { count: memberCount } = await supabase
          .from('family_members')
          .select('*', { count: 'exact', head: true })
          .eq('family_id', currentSpace.id);

        setStats({
          pendingClaims: pendingCount || 0,
          approvedClaims: approvedCount || 0,
          duplicatesDetected: duplicatesCount || 0,
          totalMembers: memberCount || 0,
          memberGrowth: 12, // Placeholder
          lastUpdate: new Date().toISOString(),
        });
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [currentSpace, currentSpace?.id, canApproveMembers]);

  if (!canApproveMembers) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700 font-medium">
            ✗ You don&apos;t have permission to access the admin dashboard
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Manage claims, detect duplicates, and monitor family data quality
          </p>
        </div>

        {/* Stats Cards */}
        {!loading && stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
            {/* Pending Claims */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-600 text-sm font-medium">Pending Claims</span>
                <Clock className="text-yellow-600" size={20} />
              </div>
              <div className="text-3xl font-bold text-gray-900">{stats.pendingClaims}</div>
              <p className="text-xs text-gray-500 mt-2">Need review</p>
            </div>

            {/* Approved Claims */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-600 text-sm font-medium">Approved Claims</span>
                <CheckCircle className="text-green-600" size={20} />
              </div>
              <div className="text-3xl font-bold text-gray-900">{stats.approvedClaims}</div>
              <p className="text-xs text-gray-500 mt-2">Verified</p>
            </div>

            {/* Duplicates */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-600 text-sm font-medium">Duplicates Found</span>
                <AlertCircle className="text-red-600" size={20} />
              </div>
              <div className="text-3xl font-bold text-gray-900">{stats.duplicatesDetected}</div>
              <p className="text-xs text-gray-500 mt-2">To review</p>
            </div>

            {/* Total Members */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-600 text-sm font-medium">Total Members</span>
                <Users className="text-blue-600" size={20} />
              </div>
              <div className="text-3xl font-bold text-gray-900">{stats.totalMembers}</div>
              <p className="text-xs text-green-600 mt-2">+{stats.memberGrowth}% growth</p>
            </div>

            {/* Data Quality */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-600 text-sm font-medium">Data Quality</span>
                <BarChart3 className="text-purple-600" size={20} />
              </div>
              <div className="text-3xl font-bold text-gray-900">92%</div>
              <p className="text-xs text-gray-500 mt-2">Well-maintained</p>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="flex border-b">
            {(['overview', 'claims', 'duplicates', 'audit'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 px-4 py-3 font-medium text-sm border-b-2 transition ${
                  activeTab === tab
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-800'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          <div className="p-6">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold">Quick Overview</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-50 p-4 rounded">
                    <p className="text-sm text-gray-600">Claims Approval Rate</p>
                    <div className="mt-2">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 h-2 rounded-full overflow-hidden">
                          <div className="bg-blue-600 h-full" style={{ width: '85%' }} />
                        </div>
                        <span className="text-sm font-medium">85%</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-green-50 p-4 rounded">
                    <p className="text-sm text-gray-600">Data Completeness</p>
                    <div className="mt-2">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 h-2 rounded-full overflow-hidden">
                          <div className="bg-green-600 h-full" style={{ width: '72%' }} />
                        </div>
                        <span className="text-sm font-medium">72%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'claims' && <ClaimApprovalPanel />}

            {activeTab === 'duplicates' && <DuplicateDetectionUI />}

            {activeTab === 'audit' && (
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Clock size={20} className="text-indigo-600" />
                  Audit Trail
                </h3>
                {revisions.length > 0 ? (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {revisions.map((rev: any) => (
                      <div key={rev.id} className="p-3 bg-slate-50 border border-slate-100 rounded-lg text-sm flex flex-col gap-1">
                        <div className="flex justify-between font-bold text-slate-700">
                          <span>{rev.field_name}</span>
                          <span className="text-xs text-slate-400">{new Date(rev.changed_at).toLocaleString()}</span>
                        </div>
                        <p className="text-slate-600">
                          Changed by <span className="font-semibold">{rev.changed_by}</span>
                        </p>
                        {rev.change_reason && <p className="text-slate-500 italic mt-1">&quot;{rev.change_reason}&quot;</p>}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-600 text-sm italic">
                    No recent audit logs found for this space.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

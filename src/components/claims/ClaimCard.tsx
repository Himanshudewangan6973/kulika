'use client';

import { useState } from 'react';
import type { ClaimWithEvidence } from '@/types/kulika';
import { ChevronDown, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import ConfidenceIndicator from './ConfidenceIndicator';
import EvidenceList from '@/components/evidence/EvidenceList';

interface ClaimCardProps {
  claim: ClaimWithEvidence;
  onApprove?: () => void;
  onDispute?: () => void;
  canApprove?: boolean;
}

export default function ClaimCard({
  claim,
  onApprove,
  onDispute,
  canApprove = false,
}: ClaimCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const statusColors = {
    proposed: 'bg-yellow-50 border-yellow-200',
    approved: 'bg-green-50 border-green-200',
    disputed: 'bg-red-50 border-red-200',
    archived: 'bg-gray-50 border-gray-200',
  };

  const statusIcons = {
    proposed: <AlertCircle className="text-yellow-600" size={16} />,
    approved: <CheckCircle className="text-green-600" size={16} />,
    disputed: <AlertCircle className="text-red-600" size={16} />,
    archived: <FileText className="text-gray-600" size={16} />,
  };

  return (
    <div className={`border rounded-lg p-4 ${statusColors[claim.status]}`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1">
          {statusIcons[claim.status]}

          <div className="flex-1">
            <h4 className="font-semibold text-sm">{claim.claimType}</h4>
            <p className="text-gray-700 text-sm mt-1">{claim.claimValue}</p>

            <div className="flex items-center gap-3 mt-2">
              <ConfidenceIndicator score={claim.confidenceScore} />
              <span className="text-xs text-gray-500">
                Source: {claim.sourceType}
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-gray-500 hover:text-gray-700 transition"
        >
          <ChevronDown
            size={16}
            className={`transition ${isExpanded ? 'rotate-180' : ''}`}
          />
        </button>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="mt-4 space-y-4 border-t pt-4">
          {/* Source Details */}
          <div>
            <h5 className="font-medium text-xs text-gray-700 mb-1">Source</h5>
            <p className="text-sm text-gray-600">{claim.sourceDescription}</p>
          </div>

          {/* Evidence */}
          {claim.evidence && claim.evidence.length > 0 && (
            <div>
              <h5 className="font-medium text-xs text-gray-700 mb-2">Evidence</h5>
              <EvidenceList evidence={claim.evidence} />
            </div>
          )}

          {/* Conflicting Claims */}
          {claim.conflictingClaims && claim.conflictingClaims.length > 0 && (
            <div className="bg-white/50 p-3 rounded border border-dashed">
              <h5 className="font-medium text-xs text-gray-700 mb-2">
                Conflicting Claims ({claim.conflictingClaims.length})
              </h5>
              <div className="space-y-2">
                {claim.conflictingClaims.map((c) => (
                  <div key={c.id} className="text-sm text-gray-600 flex items-center justify-between">
                    <span className="font-medium">{c.claimValue}</span>
                    <ConfidenceIndicator score={c.confidenceScore} size="sm" showLabel={false} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Metadata */}
          <div className="text-xs text-gray-500 space-y-1">
            <div>Claimed: {new Date(claim.claimedAt).toLocaleDateString()}</div>
            {claim.approvedAt && (
              <div>Approved: {new Date(claim.approvedAt).toLocaleDateString()}</div>
            )}
          </div>

          {/* Actions */}
          {canApprove && claim.status === 'proposed' && (
            <div className="flex gap-2 pt-2">
              <button
                onClick={onApprove}
                className="flex-1 px-3 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition font-medium"
              >
                Approve
              </button>
              <button
                onClick={onDispute}
                className="flex-1 px-3 py-2 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition font-medium"
              >
                Dispute
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

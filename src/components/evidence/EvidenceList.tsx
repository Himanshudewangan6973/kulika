'use client';

import type { Evidence } from '@/types/kulika';
import { FileText, Image as ImageIcon, Music, Video, Shield, Download, Trash2 } from 'lucide-react';

interface EvidenceListProps {
  evidence: Evidence[];
  onDelete?: (id: string) => void;
  canDelete?: boolean;
}

const evidenceTypeIcons = {
  document: <FileText size={16} />,
  photo: <ImageIcon size={16} />,
  audio: <Music size={16} />,
  video: <Video size={16} />,
  transcript: <FileText size={16} />,
  certificate: <Shield size={16} />,
  other: <FileText size={16} />,
};

export default function EvidenceList({
  evidence,
  onDelete,
  canDelete = false,
}: EvidenceListProps) {
  const getTrustColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600 bg-green-500';
    if (score >= 0.6) return 'text-yellow-600 bg-yellow-500';
    return 'text-red-600 bg-red-500';
  };

  return (
    <div className="space-y-2">
      {evidence.map((item) => (
        <div
          key={item.id}
          className="bg-white p-3 rounded border border-gray-200 hover:border-gray-300 transition"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-start gap-2 flex-1">
              <div className="mt-1 text-gray-600">
                {evidenceTypeIcons[item.evidenceType]}
              </div>

              <div className="flex-1 min-w-0">
                <h5 className="font-medium text-sm text-gray-900 truncate">
                  {item.title || item.evidenceType}
                </h5>
                <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                  <span>Trust: {(item.trustScore * 100).toFixed(0)}%</span>
                  <div
                    className={`w-8 h-1 bg-gray-200 rounded-full overflow-hidden`}
                  >
                    <div
                      className={`h-full ${getTrustColor(item.trustScore).split(' ')[1]} rounded-full`}
                      style={{ width: `${item.trustScore * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {item.fileUrl && (
                <a
                  href={item.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1 text-gray-500 hover:text-blue-600 transition"
                  title="Download"
                >
                  <Download size={16} />
                </a>
              )}

              {canDelete && (
                <button
                  onClick={() => onDelete?.(item.id)}
                  className="p-1 text-gray-500 hover:text-red-600 transition"
                  title="Delete"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          </div>

          {item.description && (
            <p className="text-xs text-gray-600 mt-2">{item.description}</p>
          )}

          <div className="text-xs text-gray-400 mt-2">
            Uploaded {new Date(item.uploadedAt).toLocaleDateString()}
            {item.verifiedBy && ' • Verified'}
          </div>
        </div>
      ))}

      {evidence.length === 0 && (
        <p className="text-sm text-gray-500 py-2">No evidence yet</p>
      )}
    </div>
  );
}

'use client';

import { Info } from 'lucide-react';
import { useState } from 'react';

interface ConfidenceIndicatorProps {
  score: number; // 0.0 to 1.0
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export default function ConfidenceIndicator({
  score,
  size = 'md',
  showLabel = true,
}: ConfidenceIndicatorProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  const getColor = (score: number) => {
    if (score >= 0.8) return 'bg-green-500';
    if (score >= 0.6) return 'bg-yellow-500';
    if (score >= 0.4) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getLabel = (score: number) => {
    if (score >= 0.8) return 'Very High';
    if (score >= 0.6) return 'High';
    if (score >= 0.4) return 'Medium';
    if (score >= 0.2) return 'Low';
    return 'Very Low';
  };

  const sizeClasses = {
    sm: 'h-1.5 w-12',
    md: 'h-2 w-20',
    lg: 'h-3 w-32',
  };

  const percentage = Math.round(score * 100);

  return (
    <div className="relative inline-flex items-center gap-1">
      <div className={`${sizeClasses[size]} bg-gray-200 rounded-full overflow-hidden`}>
        <div
          className={`h-full ${getColor(score)} transition-all duration-300`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      {showLabel && (
        <span className="text-xs font-medium text-gray-700">
          {percentage}%
        </span>
      )}

      <span
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className="text-gray-400 hover:text-gray-600 transition"
        aria-label={`${getLabel(score)} confidence`}
      >
        <Info size={14} />
      </span>

      {showTooltip && (
        <div className="absolute bottom-full left-0 mb-2 bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap z-50">
          {getLabel(score)} Confidence ({percentage}%)
          <div className="text-xs mt-1 opacity-75">
            Based on sources and evidence provided
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import { useTreeStore } from '@/components/tree/store';
import React, { useState, useEffect } from 'react';

export default function MainLayoutWrapper({ children }: { children: React.ReactNode }) {
  const railExpanded = useTreeStore(state => state.railExpanded);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Standard rail is 80px, expanded is 240px
  // Use transition for smooth shifting
  return (
    <div 
      className={`flex-1 w-full pt-14 transition-[padding] duration-300 ease-in-out bg-slate-50 ${
        mounted ? (railExpanded ? 'md:pl-60' : 'md:pl-20') : 'md:pl-20'
      } pb-16 md:pb-0`}
    >
      {children}
    </div>
  );
}

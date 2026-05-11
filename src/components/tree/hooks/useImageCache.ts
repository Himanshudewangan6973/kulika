"use client"

import { useEffect, useRef } from 'react';

// Central cache to prevent duplicate loads
const imageCache = new Map<string, HTMLImageElement>();

export const useImageCache = (urls: (string | null | undefined)[]) => {
  const loadedCount = useRef(0);

  useEffect(() => {
    const validUrls = urls.filter(Boolean) as string[];
    
    validUrls.forEach(url => {
      if (!imageCache.has(url)) {
        const img = new Image();
        img.src = url;
        img.crossOrigin = 'anonymous'; // Prevent canvas tainting
        
        // Optimization: Preload images into memory so Canvas 
        // drawImage() is synchronous and doesn't flicker.
        imageCache.set(url, img);
      }
    });
  }, [urls]);

  return imageCache;
};

export const getCachedImage = (url: string | null | undefined): HTMLImageElement | undefined => {
  if (!url) return undefined;
  return imageCache.get(url);
};

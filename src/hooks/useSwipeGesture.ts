'use client';

import { useEffect, useRef } from 'react';

export function useSwipeGesture(
  onSwipeLeft?: () => void,
  onSwipeRight?: () => void
) {
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);
  
  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      touchStartX.current = e.touches[0].clientX;
    };
    
    const handleTouchEnd = (e: TouchEvent) => {
      touchEndX.current = e.changedTouches[0].clientX;
      handleSwipe();
    };
    
    const handleSwipe = () => {
      const swipeDistance = touchStartX.current - touchEndX.current;
      const minSwipeDistance = 50; // pixels
      
      if (swipeDistance > minSwipeDistance) {
        // Swiped left
        onSwipeLeft?.();
      } else if (swipeDistance < -minSwipeDistance) {
        // Swiped right
        onSwipeRight?.();
      }
    };
    
    document.addEventListener('touchstart', handleTouchStart);
    document.addEventListener('touchend', handleTouchEnd);
    
    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [onSwipeLeft, onSwipeRight]);
}

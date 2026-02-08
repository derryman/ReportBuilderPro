import { useState, useEffect } from 'react';

/**
 * Hook to detect if the user is on a mobile device
 * Returns true if screen width is less than 768px (mobile breakpoint)
 */
export function useMobile(): boolean {
  const [isMobile, setIsMobile] = useState(() => {
    // Check initial viewport width
    if (typeof window !== 'undefined') {
      return window.innerWidth < 768;
    }
    return false;
  });

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return isMobile;
}

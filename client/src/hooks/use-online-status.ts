import { useState, useEffect } from 'react';
import { vibrationWarning } from '@/lib/haptics';

/**
 * Custom hook to monitor and respond to online/offline status
 * @returns Current online status and a method to manually check status
 */
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);

  useEffect(() => {
    // Handle online status changes
    const handleOnline = () => {
      setIsOnline(true);
    };

    // Handle offline status changes with haptic feedback for mobile
    const handleOffline = () => {
      setIsOnline(false);
      vibrationWarning(); // Provide haptic feedback when going offline
    };

    // Add event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Remove event listeners on cleanup
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Manual check function that can be called when needed
  const checkOnlineStatus = (): boolean => {
    const status = navigator.onLine;
    setIsOnline(status);
    return status;
  };

  // Return object includes online property for backward compatibility
  return { isOnline, checkOnlineStatus, online: isOnline };
}

export default useOnlineStatus;
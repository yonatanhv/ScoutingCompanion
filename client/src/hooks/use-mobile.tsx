import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    // Check for mobile devices by user agent
    const checkMobileUserAgent = (): boolean => {
      const userAgent = navigator.userAgent.toLowerCase();
      return /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
    }
    
    // Check for touch capability
    const checkTouchCapability = (): boolean => {
      return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    }
    
    // Check screen size
    const checkScreenSize = (): boolean => {
      return window.innerWidth < MOBILE_BREAKPOINT;
    }
    
    // Combined check
    const checkMobile = () => {
      const isMobileDevice = checkMobileUserAgent() || checkTouchCapability() || checkScreenSize();
      setIsMobile(isMobileDevice);
    }
    
    // Set up media query listener
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => {
      checkMobile();
    }
    
    // Initial check
    checkMobile();
    
    // Add event listeners
    mql.addEventListener("change", onChange)
    window.addEventListener('orientationchange', onChange);
    
    return () => {
      mql.removeEventListener("change", onChange);
      window.removeEventListener('orientationchange', onChange);
    }
  }, [])

  return !!isMobile
}

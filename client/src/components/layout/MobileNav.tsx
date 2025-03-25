import { useLocation } from "wouter";
import { ClipboardCheck, Users, RefreshCw } from "lucide-react";

export default function MobileNav() {
  const [location, navigate] = useLocation();

  // Add haptic feedback if supported on the device
  const triggerHapticFeedback = () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(30); // subtle 30ms vibration
    }
  };

  const handleNavClick = (path: string) => {
    triggerHapticFeedback();
    navigate(path);
  };

  return (
    <nav className="md:hidden bg-card border-t border-border fixed bottom-0 left-0 right-0 z-10 transition-colors duration-300 shadow-lg">
      <div className="flex justify-around">
        <div 
          onClick={() => handleNavClick('/scout')}
          className={`flex-1 py-3 flex flex-col items-center cursor-pointer transition-all duration-200 ${
            location === '/scout' 
              ? 'text-primary font-medium' 
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <div className={`${location === '/scout' ? 'scale-110' : 'scale-100'} transition-transform duration-200`}>
            <ClipboardCheck className="h-5 w-5" />
          </div>
          <span className="text-xs mt-1">Scout</span>
        </div>
        
        <div 
          onClick={() => handleNavClick('/team')}
          className={`flex-1 py-3 flex flex-col items-center cursor-pointer transition-all duration-200 ${
            location === '/team' 
              ? 'text-primary font-medium' 
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <div className={`${location === '/team' ? 'scale-110' : 'scale-100'} transition-transform duration-200`}>
            <Users className="h-5 w-5" />
          </div>
          <span className="text-xs mt-1">Teams</span>
        </div>
        
        <div 
          onClick={() => handleNavClick('/data')}
          className={`flex-1 py-3 flex flex-col items-center cursor-pointer transition-all duration-200 ${
            location === '/data' 
              ? 'text-primary font-medium' 
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <div className={`${location === '/data' ? 'scale-110' : 'scale-100'} transition-transform duration-200`}>
            <RefreshCw className="h-5 w-5" />
          </div>
          <span className="text-xs mt-1">Sync</span>
        </div>
      </div>
    </nav>
  );
}

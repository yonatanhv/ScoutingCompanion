import { useLocation } from "wouter";
import { ClipboardCheck, Users, RefreshCw, BarChart2, Database } from "lucide-react";
import { vibrationSuccess } from "@/lib/haptics";

export default function MobileNav() {
  const [location, navigate] = useLocation();

  // Add haptic feedback if supported on the device
  const triggerHapticFeedback = () => {
    vibrationSuccess(); // Use our haptics utility
  };

  const handleNavClick = (path: string) => {
    triggerHapticFeedback();
    navigate(path);
  };

  return (
    <nav className="md:hidden bg-card border-t border-border fixed bottom-0 left-0 right-0 z-10 transition-colors duration-300 shadow-lg">
      <div className="grid grid-cols-5 w-full">
        <div 
          onClick={() => handleNavClick('/scout')}
          className={`py-3 flex flex-col items-center cursor-pointer transition-all duration-200 ${
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
          className={`py-3 flex flex-col items-center cursor-pointer transition-all duration-200 ${
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
          onClick={() => handleNavClick('/analytics')}
          className={`py-3 flex flex-col items-center cursor-pointer transition-all duration-200 ${
            location === '/analytics' 
              ? 'text-primary font-medium' 
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <div className={`${location === '/analytics' ? 'scale-110' : 'scale-100'} transition-transform duration-200`}>
            <BarChart2 className="h-5 w-5" />
          </div>
          <span className="text-xs mt-1">Stats</span>
        </div>
        
        <div 
          onClick={() => handleNavClick('/data')}
          className={`py-3 flex flex-col items-center cursor-pointer transition-all duration-200 ${
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
        
        <div 
          onClick={() => handleNavClick('/backup')}
          className={`py-3 flex flex-col items-center cursor-pointer transition-all duration-200 ${
            location === '/backup' 
              ? 'text-primary font-medium' 
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <div className={`${location === '/backup' ? 'scale-110' : 'scale-100'} transition-transform duration-200`}>
            <Database className="h-5 w-5" />
          </div>
          <span className="text-xs mt-1">Backup</span>
        </div>
      </div>
    </nav>
  );
}

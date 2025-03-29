import { useState } from "react";
import { useLocation } from "wouter";
import { 
  ClipboardCheck, 
  Users, 
  RefreshCw, 
  BarChart2, 
  Database, 
  Cpu, 
  Sliders, 
  MoreHorizontal,
  X
} from "lucide-react";
import { vibrationSuccess } from "@/lib/haptics";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function MobileNav() {
  const [location, navigate] = useLocation();
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);

  // Add haptic feedback if supported on the device
  const triggerHapticFeedback = () => {
    vibrationSuccess(); // Use our haptics utility
  };

  const handleNavClick = (path: string) => {
    triggerHapticFeedback();
    navigate(path);
    setMoreMenuOpen(false);
  };

  // Primary navigation items
  const primaryNavItems = [
    { path: '/scout', label: 'Scout', icon: <ClipboardCheck className="h-5 w-5" /> },
    { path: '/team', label: 'Teams', icon: <Users className="h-5 w-5" /> },
    { path: '/analytics', label: 'Stats', icon: <BarChart2 className="h-5 w-5" /> },
    { path: '/alliance', label: 'Alliance', icon: <Cpu className="h-5 w-5" /> },
  ];

  // Secondary navigation items (in "More" menu)
  const secondaryNavItems = [
    { path: '/filters', label: 'Filters', icon: <Sliders className="h-5 w-5" /> },
    { path: '/data', label: 'Sync', icon: <RefreshCw className="h-5 w-5" /> },
    { path: '/backup', label: 'Backup', icon: <Database className="h-5 w-5" /> },
  ];

  return (
    <>
      {/* More menu overlay */}
      {moreMenuOpen && (
        <div 
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-10"
          onClick={() => setMoreMenuOpen(false)}
        />
      )}
      
      {/* More menu panel */}
      <div 
        className={cn(
          "fixed bottom-16 right-2 bg-card border border-border rounded-lg shadow-lg z-20 w-48 overflow-hidden transform transition-all duration-200 ease-in-out",
          moreMenuOpen ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0 pointer-events-none"
        )}
      >
        <div className="p-2 border-b border-border flex items-center justify-between">
          <span className="text-sm font-medium">More Options</span>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8" 
            onClick={() => setMoreMenuOpen(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="p-2">
          {secondaryNavItems.map((item) => (
            <div 
              key={item.path}
              onClick={() => handleNavClick(item.path)}
              className={`py-2 px-3 flex items-center space-x-2 cursor-pointer rounded-md ${
                location === item.path 
                  ? 'bg-primary/10 text-primary font-medium' 
                  : 'hover:bg-accent'
              }`}
            >
              {item.icon}
              <span className="text-sm">{item.label}</span>
            </div>
          ))}
        </div>
      </div>
      
      {/* Bottom navigation bar */}
      <nav className="md:hidden bg-card border-t border-border fixed bottom-0 left-0 right-0 z-10 transition-colors duration-300 shadow-lg">
        <div className="grid grid-cols-5 w-full">
          {primaryNavItems.map((item) => (
            <div 
              key={item.path}
              onClick={() => handleNavClick(item.path)}
              className={`py-3 flex flex-col items-center cursor-pointer transition-all duration-200 ${
                location === item.path 
                  ? 'text-primary font-medium' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <div className={`${location === item.path ? 'scale-110' : 'scale-100'} transition-transform duration-200`}>
                {item.icon}
              </div>
              <span className="text-xs mt-1">{item.label}</span>
            </div>
          ))}
          
          {/* More button */}
          <div 
            onClick={() => {
              triggerHapticFeedback();
              setMoreMenuOpen(!moreMenuOpen);
            }}
            className={`py-3 flex flex-col items-center cursor-pointer transition-all duration-200 ${
              secondaryNavItems.some(item => location === item.path)
                ? 'text-primary font-medium' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <div className={`${secondaryNavItems.some(item => location === item.path) ? 'scale-110' : 'scale-100'} transition-transform duration-200`}>
              <MoreHorizontal className="h-5 w-5" />
            </div>
            <span className="text-xs mt-1">More</span>
          </div>
        </div>
      </nav>
    </>
  );
}

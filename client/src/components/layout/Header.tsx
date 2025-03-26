import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Download, Cpu, ClipboardCheck, Users, BarChart2, RefreshCw, Database } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { useOnlineStatus } from "@/hooks/use-online-status";
import { formSubmitVibration } from "@/lib/haptics";

// Interface for the PWA install prompt
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export default function Header() {
  const [, navigate] = useLocation();
  const { isOnline } = useOnlineStatus();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const { toast } = useToast();
  const [isFirstRender, setIsFirstRender] = useState(true);

  // Notify user when online status changes, but not on first render
  useEffect(() => {
    if (isFirstRender) {
      setIsFirstRender(false);
      return;
    }
    
    if (isOnline) {
      toast({
        title: "Connection restored",
        description: "You are now back online.",
        variant: "default",
      });
    } else {
      toast({
        title: "Offline mode",
        description: "App is running in offline mode. Data will be synchronized when connection is restored.",
        variant: "destructive",
      });
    }
  }, [isOnline, toast, isFirstRender]);

  useEffect(() => {
    // Handle PWA install
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent Chrome 76+ from automatically showing the prompt
      e.preventDefault();
      // Stash the event so it can be triggered later
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    
    // Show the install prompt
    deferredPrompt.prompt();
    
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    
    // We've used the prompt, and can't use it again, throw it away
    setDeferredPrompt(null);
    
    if (outcome === 'accepted') {
      toast({
        title: "App installed",
        description: "FRC Scouting app has been installed successfully!",
      });
    }
  };

  // Add haptic feedback if supported on the device
  const triggerHapticFeedback = () => {
    formSubmitVibration(); // Use our haptics utility
  };

  const [location] = useLocation();

  const navItems = [
    { path: '/scout', label: 'Scout', icon: <ClipboardCheck className="h-5 w-5" /> },
    { path: '/team', label: 'Teams', icon: <Users className="h-5 w-5" /> },
    { path: '/analytics', label: 'Analytics', icon: <BarChart2 className="h-5 w-5" /> },
    { path: '/data', label: 'Sync', icon: <RefreshCw className="h-5 w-5" /> },
    { path: '/backup', label: 'Backup', icon: <Database className="h-5 w-5" /> }
  ];

  const handleNavClick = (path: string) => {
    triggerHapticFeedback();
    navigate(path);
  };

  return (
    <header className="bg-primary/95 text-primary-foreground py-3 px-4 shadow-md transition-colors duration-300 backdrop-blur-sm">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <div 
            className="flex items-center space-x-2 haptic-button cursor-pointer" 
            onClick={() => {
              triggerHapticFeedback();
              navigate('/');
            }}
          >
            <Cpu className="h-6 w-6" />
            <div className="flex flex-col">
              <h1 className="text-xl font-bold">GreenBlitz SuperScouting</h1>
              <span className="text-[10px] opacity-70">made by Horev (probably during math class 📚)</span>
            </div>
          </div>
        </div>
        
        {/* Desktop Navigation */}
        <nav className="hidden md:flex space-x-4">
          {navItems.map((item) => (
            <div 
              key={item.path}
              onClick={() => handleNavClick(item.path)}
              className={`flex items-center space-x-1 px-3 py-2 rounded-md cursor-pointer transition-colors duration-200 ${
                location === item.path 
                  ? 'bg-primary-foreground/20 text-primary-foreground' 
                  : 'hover:bg-primary-foreground/10'
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </div>
          ))}
        </nav>
        
        <div className="flex items-center gap-3">
          <div className={`offline-indicator ${isOnline ? 'online' : ''}`}>
            <span className="offline-dot"></span>
            <span>
              {isOnline ? 'Online' : 'Offline'}
            </span>
          </div>
          
          <ThemeToggle />
          
          {deferredPrompt && (
            <Button 
              onClick={handleInstallClick}
              size="sm"
              variant="secondary"
              className="btn-hover-fx text-xs flex items-center gap-1.5 ml-1"
            >
              <Download className="h-3.5 w-3.5" />
              Install App
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}

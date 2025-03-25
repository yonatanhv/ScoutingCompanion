import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Wifi, WifiOff, Download, Cpu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

export default function Header() {
  const [, navigate] = useLocation();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast({
        title: "Connection restored",
        description: "You are now back online.",
        variant: "default",
      });
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      toast({
        title: "Offline mode",
        description: "App is running in offline mode. Data will be synchronized when connection is restored.",
        variant: "destructive",
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Handle PWA install
    window.addEventListener('beforeinstallprompt', (e) => {
      // Prevent Chrome 76+ from automatically showing the prompt
      e.preventDefault();
      // Stash the event so it can be triggered later
      setDeferredPrompt(e);
    });

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('beforeinstallprompt', (e) => {
        setDeferredPrompt(null);
      });
    };
  }, [toast]);

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
    if ('vibrate' in navigator) {
      navigator.vibrate(50); // subtle 50ms vibration
    }
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
            <h1 className="text-xl font-bold">FRC Scouting</h1>
          </div>
        </div>
        
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

import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

export default function Header() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

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

  return (
    <header className="bg-primary text-white p-4 shadow-md">
      <div className="container mx-auto flex justify-between items-center">
        <h1 className="text-2xl font-bold">FRC Scouting</h1>
        <div className="flex gap-2">
          {deferredPrompt && (
            <button 
              onClick={handleInstallClick}
              className="bg-white text-primary px-3 py-1 rounded font-medium text-sm"
            >
              Install App
            </button>
          )}
          <span className={`text-sm ${isOnline ? 'bg-success' : 'bg-error'} px-2 py-1 rounded-full flex items-center`}>
            <i className={`fas ${isOnline ? 'fa-wifi' : 'fa-times'} mr-1`}></i>
            {isOnline ? 'Online' : 'Offline'}
          </span>
        </div>
      </div>
    </header>
  );
}

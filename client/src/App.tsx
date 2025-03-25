import { useState, useEffect } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/hooks/use-toast";
import NavTabs from "@/components/NavTabs";
import ScoutMatch from "@/pages/ScoutMatch";
import ViewTeam from "@/pages/ViewTeam";
import ExportImport from "@/pages/ExportImport";
import NotFound from "@/pages/not-found";
import { initDB } from "@/lib/indexedDB";

function Router() {
  const { toast } = useToast();
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  
  // Handle online/offline status
  useEffect(() => {
    const handleOnlineStatus = () => {
      setIsOffline(!navigator.onLine);
      if (!navigator.onLine) {
        toast({
          title: "You're offline",
          description: "The app will continue to work with locally stored data.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "You're back online",
          description: "All changes made offline have been saved locally.",
        });
      }
    };
    
    window.addEventListener("online", handleOnlineStatus);
    window.addEventListener("offline", handleOnlineStatus);
    
    return () => {
      window.removeEventListener("online", handleOnlineStatus);
      window.removeEventListener("offline", handleOnlineStatus);
    };
  }, [toast]);
  
  // Initialize IndexedDB
  useEffect(() => {
    const init = async () => {
      try {
        await initDB();
      } catch (error) {
        console.error("Failed to initialize database", error);
        toast({
          title: "Database Error",
          description: "Failed to initialize the local database. Some features may not work.",
          variant: "destructive",
        });
      }
    };
    
    init();
  }, [toast]);
  
  // PWA installation
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent Chrome 67+ from automatically showing the prompt
      e.preventDefault();
      // Stash the event so it can be triggered later
      setDeferredPrompt(e);
      // Show the install banner
      setShowInstallBanner(true);
    };
    
    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    
    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);
  
  const handleInstall = async () => {
    if (!deferredPrompt) return;
    
    // Show the install prompt
    deferredPrompt.prompt();
    
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to the install prompt: ${outcome}`);
    
    // We've used the prompt, and can't use it again, throw it away
    setDeferredPrompt(null);
    // Hide the app install banner
    setShowInstallBanner(false);
  };
  
  return (
    <div className="bg-background min-h-screen">
      {/* App Header */}
      <header className="bg-primary text-white p-4 shadow-md">
        <h1 className="text-xl font-bold text-center">FRC Scouting App</h1>
      </header>
      
      {/* Navigation */}
      <NavTabs />
      
      {/* Offline Indicator */}
      {isOffline && (
        <div className="bg-accent text-white px-3 py-1 text-sm fixed top-0 right-0 m-2 rounded-full z-40 flex items-center">
          <span className="material-icons text-sm mr-1">wifi_off</span>
          <span>Offline</span>
        </div>
      )}
      
      {/* Install Banner */}
      {showInstallBanner && (
        <div className="fixed bottom-0 left-0 right-0 bg-primary text-white p-4 shadow-lg z-50">
          <div className="flex justify-between items-center">
            <p className="font-medium">Install this app on your device</p>
            <div>
              <button 
                onClick={handleInstall}
                className="bg-white text-primary px-3 py-1 rounded mr-2"
              >
                Install
              </button>
              <button 
                onClick={() => setShowInstallBanner(false)}
                className="text-white"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Main Content */}
      <main className="container mx-auto p-4 pb-20">
        <Switch>
          <Route path="/" component={ScoutMatch} />
          <Route path="/team" component={ViewTeam} />
          <Route path="/sync" component={ExportImport} />
          <Route component={NotFound} />
        </Switch>
      </main>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;

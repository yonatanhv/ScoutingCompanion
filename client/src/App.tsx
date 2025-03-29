import { useState, useEffect } from "react";
import { Switch, Route, useLocation } from "wouter";
import { initDB } from "@/lib/db";
import Header from "@/components/layout/Header";
import MobileNav from "@/components/layout/MobileNav";
import ScoutMatch from "@/pages/ScoutMatch";
import DataSync from "@/pages/DataSync";
import TeamAnalytics from "@/pages/TeamAnalytics";
import CloudBackup from "@/pages/CloudBackup";
import AllianceBuilder from "@/pages/AllianceBuilder";
import FilterDashboard from "@/pages/FilterDashboard";
import NotFound from "@/pages/not-found";
import { useToast } from "@/hooks/use-toast";
import { BackgroundParticles } from "@/components/ui/background-particles";
import TestDataGenerator from "@/components/dev/TestDataGenerator";
import TutorialWizard from "@/components/ui/tutorial-wizard";
import ErrorRecoveryWizard from "@/components/ui/error-recovery-wizard";
import { useLocalStorage } from "@/hooks/useLocalStorage";

function Router() {
  const [location, setLocation] = useLocation();
  
  // Set default route to "/"
  useEffect(() => {
    if (location === "/") {
      setLocation("/scout");
    }
  }, [location, setLocation]);
  
  return (
    <Switch>
      <Route path="/scout" component={ScoutMatch} />
      <Route path="/data" component={DataSync} />
      <Route path="/analytics" component={TeamAnalytics} />
      <Route path="/alliance" component={AllianceBuilder} />
      <Route path="/filters" component={FilterDashboard} />
      <Route path="/backup" component={CloudBackup} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [dbInitialized, setDbInitialized] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);
  const [tutorialOpen, setTutorialOpen] = useState(false);
  const [errorRecoveryOpen, setErrorRecoveryOpen] = useState(false);
  const [errorType, setErrorType] = useState<"sync" | "database" | "connection" | "unknown">("unknown");
  const [completedTutorial, setCompletedTutorial] = useLocalStorage<boolean>("tutorial_completed", false);
  const { toast } = useToast();
  
  // Initialize IndexedDB
  useEffect(() => {
    const setupDb = async () => {
      try {
        console.log("Initializing team data...");
        await initDB();
        console.log("Team data initialized");
        setDbInitialized(true);
      } catch (error) {
        console.error("Failed to initialize the database:", error);
        setDbError("Failed to initialize the database. Please check browser support for IndexedDB.");
      }
    };
    
    setupDb();
  }, []);
  
  // Check if the tutorial should be shown (first time user) - but only auto-show once
  useEffect(() => {
    if (dbInitialized && !completedTutorial) {
      // Short delay before showing tutorial to let the UI render first
      const timer = setTimeout(() => {
        setTutorialOpen(true);
        // Mark as completed to prevent auto-showing again (user can still access via button)
        setCompletedTutorial(true);
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [dbInitialized, completedTutorial, setCompletedTutorial]);
  
  // Handler for showing the error recovery wizard
  const showErrorRecovery = (type: "sync" | "database" | "connection" | "unknown" = "unknown") => {
    setErrorType(type);
    setErrorRecoveryOpen(true);
  };
  
  // Add keyboard shortcut to show tutorial again (Ctrl+Shift+T)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'T') {
        setTutorialOpen(true);
        
        toast({
          title: "Tutorial Opened",
          description: "You can access this tutorial anytime with Ctrl+Shift+T",
        });
      } else if (e.ctrlKey && e.shiftKey && e.key === 'E') {
        // Debug shortcut for error recovery wizard (Ctrl+Shift+E)
        showErrorRecovery();
        
        toast({
          title: "Error Recovery Wizard",
          description: "Diagnostic tool opened for troubleshooting",
        });
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toast]);
  
  if (dbError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
        <BackgroundParticles />
        <div className="bg-card p-6 rounded-lg shadow-lg max-w-md w-full border border-border relative z-10 slide-in-bottom">
          <h1 className="text-xl font-bold text-destructive mb-4">Database Error</h1>
          <p className="text-foreground">{dbError}</p>
          <p className="mt-4 text-muted-foreground text-sm">
            This app requires IndexedDB support in your browser. Please try using an updated browser.
          </p>
        </div>
      </div>
    );
  }
  
  if (!dbInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
        <BackgroundParticles />
        <div className="text-center z-10 slide-in-bottom">
          <div className="text-primary text-2xl font-bold mb-4 gradient-text">FRC Scouting</div>
          <div className="text-muted-foreground">Initializing database...</div>
          <div className="mt-4 w-10 h-10 border-t-2 border-primary rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Background particles effect */}
      <BackgroundParticles />
      
      <Header />
      <main className="flex-grow container mx-auto p-4 pb-20 md:pb-4 relative z-10 fade-in">
        <Router />
      </main>
      <MobileNav />
      
      {/* Test Data Generator (only accessible with secret key) */}
      <TestDataGenerator />
      
      {/* Tutorial Wizard */}
      <TutorialWizard 
        open={tutorialOpen} 
        onOpenChange={setTutorialOpen} 
      />
      
      {/* Error Recovery Wizard */}
      <ErrorRecoveryWizard 
        open={errorRecoveryOpen} 
        onOpenChange={setErrorRecoveryOpen}
        errorType={errorType}
      />
    </div>
  );
}

export default App;

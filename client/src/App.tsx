import { useState, useEffect } from "react";
import { Switch, Route, useLocation } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { initDB } from "@/lib/db";
import Header from "@/components/layout/Header";
import MobileNav from "@/components/layout/MobileNav";
import ScoutMatch from "@/pages/ScoutMatch";
import ViewTeam from "@/pages/ViewTeam";
import DataSync from "@/pages/DataSync";
import NotFound from "@/pages/not-found";

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
      <Route path="/team" component={ViewTeam} />
      <Route path="/data" component={DataSync} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [dbInitialized, setDbInitialized] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);
  
  // Initialize IndexedDB
  useEffect(() => {
    const setupDb = async () => {
      try {
        await initDB();
        setDbInitialized(true);
      } catch (error) {
        console.error("Failed to initialize the database:", error);
        setDbError("Failed to initialize the database. Please check browser support for IndexedDB.");
      }
    };
    
    setupDb();
  }, []);
  
  if (dbError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
          <h1 className="text-xl font-bold text-red-600 mb-4">Database Error</h1>
          <p className="text-gray-700">{dbError}</p>
          <p className="mt-4 text-gray-600 text-sm">
            This app requires IndexedDB support in your browser. Please try using an updated browser.
          </p>
        </div>
      </div>
    );
  }
  
  if (!dbInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-primary text-xl font-bold mb-4">FRC Scouting</div>
          <div className="text-gray-600">Initializing database...</div>
        </div>
      </div>
    );
  }
  
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen flex flex-col bg-gray-100">
        <Header />
        <main className="flex-grow container mx-auto p-4 pb-20 md:pb-4">
          <Router />
        </main>
        <MobileNav />
        <Toaster />
      </div>
    </QueryClientProvider>
  );
}

export default App;

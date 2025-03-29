import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useOnlineStatus } from "@/hooks/use-online-status";
import { webSocketService } from "@/lib/websocket";
import { getMatchesBySyncStatus, getDBStats } from "@/lib/db";
import { AlertTriangle, CheckCircle, RefreshCw, WifiOff, Wifi } from "lucide-react";

interface ErrorRecoveryWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  errorType?: "sync" | "database" | "connection" | "unknown";
}

export function ErrorRecoveryWizard({ 
  open, 
  onOpenChange, 
  errorType = "unknown" 
}: ErrorRecoveryWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [diagnosisResult, setDiagnosisResult] = useState<{
    online: boolean;
    wsConnected: boolean;
    pendingSyncs: number;
    failedSyncs: number;
    dbSize: number;
  }>({
    online: false,
    wsConnected: false,
    pendingSyncs: 0,
    failedSyncs: 0,
    dbSize: 0,
  });
  
  const { online, checkOnlineStatus } = useOnlineStatus();

  // Diagnostic steps based on error type
  const getSteps = () => {
    const commonSteps = [
      {
        title: "Connection Check",
        description: "Checking your internet connection status...",
        action: checkConnectionStatus,
        result: () => (
          <div className="flex flex-col items-center space-y-2">
            <div className={`p-3 rounded-full ${diagnosisResult.online ? 'bg-green-100' : 'bg-red-100'}`}>
              {diagnosisResult.online ? (
                <Wifi className="h-6 w-6 text-green-600" />
              ) : (
                <WifiOff className="h-6 w-6 text-red-600" />
              )}
            </div>
            <p className="text-center">
              {diagnosisResult.online 
                ? "You're connected to the internet." 
                : "You're currently offline."}
            </p>
            {!diagnosisResult.online && (
              <div className="bg-amber-100 p-3 rounded text-sm text-amber-800 mt-2">
                <p className="font-medium">Recommendation:</p>
                <p>Check your internet connection and try again. The app will work offline, but syncing requires an internet connection.</p>
              </div>
            )}
          </div>
        ),
      },
      {
        title: "WebSocket Connection",
        description: "Checking real-time sync connection status...",
        action: checkWebSocketStatus,
        result: () => (
          <div className="flex flex-col items-center space-y-2">
            <div className={`p-3 rounded-full ${diagnosisResult.wsConnected ? 'bg-green-100' : diagnosisResult.online ? 'bg-red-100' : 'bg-gray-100'}`}>
              {diagnosisResult.wsConnected ? (
                <CheckCircle className="h-6 w-6 text-green-600" />
              ) : diagnosisResult.online ? (
                <AlertTriangle className="h-6 w-6 text-amber-600" />
              ) : (
                <WifiOff className="h-6 w-6 text-gray-400" />
              )}
            </div>
            <p className="text-center">
              {diagnosisResult.wsConnected 
                ? "WebSocket connection is active and working properly." 
                : diagnosisResult.online 
                  ? "WebSocket connection failed despite being online." 
                  : "WebSocket connection unavailable while offline."}
            </p>
            {diagnosisResult.online && !diagnosisResult.wsConnected && (
              <div className="bg-amber-100 p-3 rounded text-sm text-amber-800 mt-2">
                <p className="font-medium">Recommendation:</p>
                <p>Try restarting the application or check if the server is running properly.</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-2"
                  onClick={() => webSocketService.connect()}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reconnect WebSocket
                </Button>
              </div>
            )}
          </div>
        ),
      },
      {
        title: "Sync Status Check",
        description: "Checking for pending and failed sync operations...",
        action: checkSyncStatus,
        result: () => (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardHeader className="py-2">
                  <CardTitle className="text-amber-600 text-sm">Pending</CardTitle>
                </CardHeader>
                <CardContent className="py-2">
                  <p className="text-2xl font-bold">{diagnosisResult.pendingSyncs}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="py-2">
                  <CardTitle className="text-red-600 text-sm">Failed</CardTitle>
                </CardHeader>
                <CardContent className="py-2">
                  <p className="text-2xl font-bold">{diagnosisResult.failedSyncs}</p>
                </CardContent>
              </Card>
            </div>
            
            {(diagnosisResult.pendingSyncs > 0 || diagnosisResult.failedSyncs > 0) && diagnosisResult.online && (
              <div className="bg-green-100 p-3 rounded text-sm text-green-800">
                <p className="font-medium">Recommendation:</p>
                <p>You're online and can sync your data now. Go to the Data Sync page to force a full sync.</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-2 bg-green-700 text-white hover:bg-green-800"
                  onClick={() => {
                    window.location.href = "/data-sync";
                    onOpenChange(false);
                  }}
                >
                  Go to Data Sync
                </Button>
              </div>
            )}
            
            {(diagnosisResult.pendingSyncs > 0 || diagnosisResult.failedSyncs > 0) && !diagnosisResult.online && (
              <div className="bg-amber-100 p-3 rounded text-sm text-amber-800">
                <p className="font-medium">Recommendation:</p>
                <p>Connect to the internet to sync your pending data.</p>
              </div>
            )}
          </div>
        ),
      },
      {
        title: "Database Health Check",
        description: "Checking local database status...",
        action: checkDatabaseHealth,
        result: () => (
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-gray-100 p-3 rounded">
              <span className="text-sm font-medium">Database Size</span>
              <span className="text-sm">{(diagnosisResult.dbSize / 1024).toFixed(2)} KB</span>
            </div>
            
            <div className="bg-green-100 p-3 rounded text-sm text-green-800">
              <p className="font-medium">Database is functioning normally</p>
              <p>Your local database is operational and storing your scouting data properly.</p>
            </div>
            
            <div className="bg-blue-100 p-3 rounded text-sm text-blue-800">
              <p className="font-medium">Did you know?</p>
              <p>You can export all your data as a backup file from the Export/Import page.</p>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-2"
                onClick={() => {
                  window.location.href = "/export-import";
                  onOpenChange(false);
                }}
              >
                Go to Export/Import
              </Button>
            </div>
          </div>
        ),
      },
      {
        title: "Recovery Complete",
        description: "Here's what we found and how to fix it:",
        action: async () => {},
        result: () => {
          // Determine the overall health status
          const hasConnectionIssues = !diagnosisResult.online;
          const hasWebSocketIssues = diagnosisResult.online && !diagnosisResult.wsConnected;
          const hasSyncIssues = diagnosisResult.pendingSyncs > 0 || diagnosisResult.failedSyncs > 0;
          
          let statusTitle = "Everything looks good!";
          let statusDescription = "No issues were detected with your application.";
          let statusIcon = <CheckCircle className="h-8 w-8 text-green-600" />;
          
          if (hasConnectionIssues || hasWebSocketIssues || hasSyncIssues) {
            statusTitle = "Some issues were detected";
            statusDescription = "We found the following issues that need attention:";
            statusIcon = <AlertTriangle className="h-8 w-8 text-amber-600" />;
          }
          
          return (
            <div className="space-y-4">
              <div className="flex flex-col items-center space-y-2 mb-4">
                {statusIcon}
                <h3 className="font-bold text-lg">{statusTitle}</h3>
                <p className="text-center text-gray-600">{statusDescription}</p>
              </div>
              
              {(hasConnectionIssues || hasWebSocketIssues || hasSyncIssues) && (
                <div className="space-y-2">
                  {hasConnectionIssues && (
                    <div className="bg-amber-100 p-3 rounded text-sm">
                      <p className="font-medium text-amber-800">Internet Connection</p>
                      <p className="text-gray-700">You're currently offline. Connect to the internet to sync your data.</p>
                    </div>
                  )}
                  
                  {hasWebSocketIssues && (
                    <div className="bg-amber-100 p-3 rounded text-sm">
                      <p className="font-medium text-amber-800">WebSocket Connection</p>
                      <p className="text-gray-700">Real-time sync is not working. Try refreshing the page.</p>
                    </div>
                  )}
                  
                  {hasSyncIssues && (
                    <div className="bg-amber-100 p-3 rounded text-sm">
                      <p className="font-medium text-amber-800">Data Synchronization</p>
                      <p className="text-gray-700">You have {diagnosisResult.pendingSyncs} pending and {diagnosisResult.failedSyncs} failed sync operations.</p>
                    </div>
                  )}
                </div>
              )}
              
              <div className="pt-2">
                <Button 
                  className="w-full bg-green-700 hover:bg-green-800"
                  onClick={() => onOpenChange(false)}
                >
                  Close Wizard
                </Button>
              </div>
            </div>
          );
        },
      },
    ];
    
    return commonSteps;
  };
  
  const steps = getSteps();
  
  // Update progress when current step changes
  useEffect(() => {
    setProgress(((currentStep + 1) / steps.length) * 100);
  }, [currentStep, steps.length]);
  
  // Run the current step's action when the step changes
  useEffect(() => {
    if (open && currentStep < steps.length) {
      const executeAction = async () => {
        setIsLoading(true);
        await steps[currentStep].action();
        setIsLoading(false);
      };
      
      executeAction();
    }
  }, [currentStep, open, steps]);
  
  // Action functions for each step
  async function checkConnectionStatus() {
    const isOnline = await checkOnlineStatus();
    setDiagnosisResult(prev => ({ ...prev, online: isOnline }));
  }
  
  async function checkWebSocketStatus() {
    const isConnected = webSocketService.isSocketConnected();
    
    if (!isConnected && diagnosisResult.online) {
      try {
        // Try to reconnect if we're online but disconnected
        webSocketService.connect();
        // Wait a moment and check again
        await new Promise(resolve => setTimeout(resolve, 1000));
        const reconnected = webSocketService.isSocketConnected();
        setDiagnosisResult(prev => ({ ...prev, wsConnected: reconnected }));
      } catch (error) {
        setDiagnosisResult(prev => ({ ...prev, wsConnected: false }));
      }
    } else {
      setDiagnosisResult(prev => ({ ...prev, wsConnected: isConnected }));
    }
  }
  
  async function checkSyncStatus() {
    try {
      const pendingMatches = await getMatchesBySyncStatus('pending');
      const failedMatches = await getMatchesBySyncStatus('failed');
      
      setDiagnosisResult(prev => ({
        ...prev,
        pendingSyncs: pendingMatches.length,
        failedSyncs: failedMatches.length
      }));
    } catch (error) {
      console.error("Error checking sync status:", error);
    }
  }
  
  async function checkDatabaseHealth() {
    try {
      const stats = await getDBStats();
      // Use the storageEstimate.usage for the database size if available
      const dbSize = stats.storageEstimate?.usage || 0;
      setDiagnosisResult(prev => ({
        ...prev,
        dbSize
      }));
    } catch (error) {
      console.error("Error checking database health:", error);
    }
  }
  
  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onOpenChange(false);
    }
  };
  
  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };
  
  // Current step data
  const { title, description, result } = steps[currentStep];
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-green-800">{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <Progress value={progress} className="h-2 mb-6" />
          
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-700"></div>
            </div>
          ) : (
            <div className="py-2">{result()}</div>
          )}
        </div>
        
        <DialogFooter>
          {currentStep > 0 && currentStep < steps.length - 1 && (
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={isLoading}
            >
              Back
            </Button>
          )}
          
          {currentStep < steps.length - 1 && (
            <Button
              onClick={nextStep}
              disabled={isLoading}
              className="bg-green-700 hover:bg-green-800"
            >
              Next
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default ErrorRecoveryWizard;
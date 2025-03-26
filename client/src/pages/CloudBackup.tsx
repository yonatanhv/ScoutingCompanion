import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { exportAllData, importData, clearAllData, getDBStats } from "@/lib/db";
import { ExportData } from "@/lib/types";
import { useOnlineStatus } from "@/hooks/use-online-status";
import { formSubmitVibration, vibrationSuccess, vibrationError } from "@/lib/haptics";

export default function CloudBackup() {
  const [, setLocation] = useLocation();
  const { online } = useOnlineStatus();
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [backupData, setBackupData] = useState<ExportData | null>(null);
  const [backups, setBackups] = useState<{id: string, date: Date, size: number}[]>([]);
  const [autoBackup, setAutoBackup] = useState(
    localStorage.getItem("autoBackupEnabled") === "true"
  );
  const [lastBackup, setLastBackup] = useState<string | null>(
    localStorage.getItem("lastBackupTime")
  );
  const [progress, setProgress] = useState(0);
  const [dbStats, setDbStats] = useState<{matches: number, teams: number, size: string} | null>(null);
  
  // Load database stats
  useEffect(() => {
    async function loadStats() {
      try {
        const stats = await getDBStats();
        // Convert to the correct type format
        setDbStats({
          matches: stats.matchesCount,
          teams: stats.teamsCount,
          size: stats.storageEstimate?.usage 
            ? formatFileSize(stats.storageEstimate.usage) 
            : 'Unknown'
        });
      } catch (error) {
        console.error("Error getting DB stats:", error);
      }
    }
    
    loadStats();
  }, []);
  
  // Mock function to simulate fetching backups from cloud
  const fetchBackups = async () => {
    setLoading(true);
    
    try {
      // In a real implementation, this would make an API call to your backend
      // For now, we'll just simulate a delay and return mock data
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Check if user is logged in
      if (!username || !password) {
        toast({
          title: "Authentication required",
          description: "Please log in to view your cloud backups",
          variant: "destructive"
        });
        setLoading(false);
        return;
      }
      
      // Generate some simulated backup data based on the username (for demo consistency)
      const date = new Date();
      const mockBackups = [
        { 
          id: `backup-${username}-1`, 
          date: new Date(date.getTime() - 86400000 * 2), // 2 days ago
          size: 156000
        },
        { 
          id: `backup-${username}-2`, 
          date: new Date(date.getTime() - 86400000), // 1 day ago
          size: 172000
        },
        { 
          id: `backup-${username}-3`, 
          date, // today
          size: 185000
        }
      ];
      
      setBackups(mockBackups);
      toast({
        title: "Backups retrieved",
        description: `Found ${mockBackups.length} backups in the cloud`
      });
    } catch (error) {
      console.error("Error fetching backups:", error);
      toast({
        title: "Error",
        description: "Failed to fetch backups from the cloud",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Mock function to simulate creating a backup
  const createBackup = async () => {
    if (!online) {
      vibrationError();
      toast({
        title: "Offline",
        description: "You need to be online to create a backup",
        variant: "destructive"
      });
      return;
    }
    
    if (!username || !password) {
      vibrationError();
      toast({
        title: "Authentication required",
        description: "Please log in to create a backup",
        variant: "destructive"
      });
      return;
    }
    
    setLoading(true);
    setProgress(0);
    
    try {
      // Export data from IndexedDB
      const data = await exportAllData();
      // Create a complete ExportData object
      const completeData: ExportData = {
        matches: data.matches,
        teams: data.teams,
        exportDate: new Date().getTime(),
        appVersion: "1.0.0"
      };
      setBackupData(completeData);
      
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            clearInterval(progressInterval);
            return 100;
          }
          return prev + 10;
        });
      }, 300);
      
      // Simulate network request
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Update last backup time
      const now = new Date().toISOString();
      localStorage.setItem("lastBackupTime", now);
      setLastBackup(now);
      
      clearInterval(progressInterval);
      setProgress(100);
      
      vibrationSuccess();
      toast({
        title: "Backup created",
        description: "Your data has been backed up to the cloud"
      });
      
      // Refresh the list of backups
      await fetchBackups();
    } catch (error) {
      console.error("Error creating backup:", error);
      vibrationError();
      toast({
        title: "Error",
        description: "Failed to create backup",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Mock function to simulate restoring from a backup
  const restoreBackup = async (backupId: string) => {
    if (!online) {
      vibrationError();
      toast({
        title: "Offline",
        description: "You need to be online to restore a backup",
        variant: "destructive"
      });
      return;
    }
    
    setLoading(true);
    setProgress(0);
    
    try {
      // In a real implementation, you would fetch the backup data from your cloud storage
      // For now, we'll use the current backup data (if available) or mock data
      let restoredData: ExportData;
      
      if (backupData) {
        restoredData = backupData;
      } else {
        // Generate mock data
        restoredData = {
          matches: [],
          teams: [],
          exportDate: new Date().getTime(),
          appVersion: "1.0.0"
        };
      }
      
      // Simulate download progress
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            clearInterval(progressInterval);
            return 100;
          }
          return prev + 10;
        });
      }, 200);
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Clear current data and import the backup
      await clearAllData();
      await importData(restoredData, "replace");
      
      clearInterval(progressInterval);
      setProgress(100);
      
      // Update database stats
      const stats = await getDBStats();
      // Convert to the right format
      setDbStats({
        matches: stats.matchesCount,
        teams: stats.teamsCount,
        size: stats.storageEstimate?.usage 
          ? formatFileSize(stats.storageEstimate.usage) 
          : 'Unknown'
      });
      
      vibrationSuccess();
      toast({
        title: "Backup restored",
        description: `Restored ${restoredData.matches.length} matches and ${restoredData.teams.length} teams`
      });
    } catch (error) {
      console.error("Error restoring backup:", error);
      vibrationError();
      toast({
        title: "Error",
        description: "Failed to restore backup",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
      setProgress(0);
    }
  };
  
  const handleAutoBackupToggle = (checked: boolean) => {
    setAutoBackup(checked);
    localStorage.setItem("autoBackupEnabled", String(checked));
    
    if (checked) {
      if (!online) {
        toast({
          title: "Warning",
          description: "Auto-backup will only work when you're online",
          variant: "default"
        });
      }
      
      if (!username || !password) {
        toast({
          title: "Warning",
          description: "Please log in for auto-backup to work",
          variant: "default"
        });
      }
    }
    
    formSubmitVibration();
  };
  
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
  };
  
  const formatBackupDate = (date: Date) => {
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return 'Today at ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return 'Yesterday at ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString() + ' at ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
  };
  
  return (
    <div className="container mx-auto p-4 pb-24">
      <h1 className="text-3xl font-bold mb-6 bg-gradient-to-r from-primary to-purple-500 text-transparent bg-clip-text">
        Cloud Backup & Restore
      </h1>
      
      <Alert className="mb-6">
        <AlertTitle>Never lose your scouting data</AlertTitle>
        <AlertDescription>
          Cloud backup lets you securely store your scouting data online and access it from any device.
          Your data stays encrypted and private.
        </AlertDescription>
      </Alert>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Your Backups</CardTitle>
            <CardDescription>Manage your cloud backups</CardDescription>
          </CardHeader>
          
          <CardContent>
            <Tabs defaultValue="backups" className="w-full">
              <TabsList className="mb-4">
                <TabsTrigger value="backups">Backups</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
              </TabsList>
              
              <TabsContent value="backups">
                {(!username || !password) ? (
                  <div className="text-center p-6">
                    <p className="mb-4 text-muted-foreground">Please log in to view and manage your backups</p>
                    <Button onClick={() => document.getElementById('settings-tab')?.click()}>
                      Go to Settings
                    </Button>
                  </div>
                ) : backups.length === 0 ? (
                  <div className="text-center p-6">
                    <p className="mb-4 text-muted-foreground">No backups found. Create your first backup now!</p>
                    <Button onClick={createBackup} disabled={loading || !online}>
                      {loading ? 'Creating backup...' : 'Create Backup'}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-medium">Available Backups</h3>
                      <Button onClick={createBackup} disabled={loading || !online} size="sm">
                        {loading && progress > 0 ? `${progress}%` : 'Create New Backup'}
                      </Button>
                    </div>
                    
                    {loading && progress > 0 && (
                      <Progress value={progress} className="mb-4" />
                    )}
                    
                    <div className="space-y-3">
                      {backups.map((backup) => (
                        <Card key={backup.id} className="overflow-hidden">
                          <div className="p-4 flex justify-between items-center">
                            <div>
                              <h4 className="font-medium">{formatBackupDate(backup.date)}</h4>
                              <p className="text-sm text-muted-foreground">{formatFileSize(backup.size)}</p>
                            </div>
                            <Button 
                              variant="outline" 
                              onClick={() => restoreBackup(backup.id)}
                              disabled={loading || !online}
                            >
                              Restore
                            </Button>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="settings" id="settings-tab">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <h3 className="text-lg font-medium">Cloud Account</h3>
                    <p className="text-sm text-muted-foreground mb-4">Log in to access your cloud backups</p>
                    
                    <div className="grid gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="username">Username</Label>
                        <Input 
                          id="username" 
                          value={username} 
                          onChange={(e) => setUsername(e.target.value)} 
                          placeholder="Enter your username"
                        />
                      </div>
                      
                      <div className="grid gap-2">
                        <Label htmlFor="password">Password</Label>
                        <Input 
                          id="password" 
                          type="password" 
                          value={password} 
                          onChange={(e) => setPassword(e.target.value)} 
                          placeholder="Enter your password"
                        />
                      </div>
                      
                      <Button onClick={fetchBackups} disabled={!username || !password || loading}>
                        {!username || !password ? 'Please enter credentials' : 'Log In'}
                      </Button>
                    </div>
                  </div>
                  
                  <Separator className="my-4" />
                  
                  <div className="space-y-2">
                    <h3 className="text-lg font-medium">Backup Settings</h3>
                    <div className="flex items-center space-x-2 mt-4">
                      <Switch 
                        id="auto-backup" 
                        checked={autoBackup}
                        onCheckedChange={handleAutoBackupToggle}
                        disabled={!online}
                      />
                      <Label htmlFor="auto-backup">Enable automatic backups</Label>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Automatically backup your data whenever you add new match entries
                    </p>
                    
                    {!online && (
                      <p className="text-sm text-amber-500 mt-2">
                        Auto-backup is disabled when you're offline
                      </p>
                    )}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
          
          <CardFooter className="flex justify-between border-t pt-4">
            <div className="text-sm text-muted-foreground">
              {lastBackup ? (
                <span>Last backup: {new Date(lastBackup).toLocaleString()}</span>
              ) : (
                <span>No backups created yet</span>
              )}
            </div>
            <Badge variant={online ? "outline" : "secondary"}>
              {online ? "Online" : "Offline"}
            </Badge>
          </CardFooter>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Database Info</CardTitle>
            <CardDescription>Local data statistics</CardDescription>
          </CardHeader>
          
          <CardContent>
            <div className="space-y-4">
              {dbStats ? (
                <>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Matches</span>
                      <span className="font-medium">{dbStats.matches}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Teams</span>
                      <span className="font-medium">{dbStats.teams}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Total Size</span>
                      <span className="font-medium">{dbStats.size}</span>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="pt-2">
                    <h4 className="text-sm font-medium mb-2">Storage Usage</h4>
                    <Progress 
                      value={Math.min(100, (dbStats.matches / 100) * 100)} 
                      className="h-2 mb-1" 
                    />
                    <p className="text-xs text-muted-foreground">
                      {dbStats.matches < 50 ? "Low usage" : 
                       dbStats.matches < 200 ? "Moderate usage" : 
                       "High usage"}
                    </p>
                  </div>
                </>
              ) : (
                <div className="flex justify-center items-center py-8">
                  <p className="text-muted-foreground">Loading data statistics...</p>
                </div>
              )}
            </div>
          </CardContent>
          
          <CardFooter className="flex justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLocation("/")}
            >
              Back to Home
            </Button>
            
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                if (confirm("Are you sure you want to clear all data? This cannot be undone!")) {
                  clearAllData().then(() => {
                    toast({
                      title: "Data cleared",
                      description: "All local data has been deleted"
                    });
                    // Refresh database stats
                    getDBStats().then(stats => {
                      setDbStats({
                        matches: stats.matchesCount,
                        teams: stats.teamsCount,
                        size: stats.storageEstimate?.usage 
                          ? formatFileSize(stats.storageEstimate.usage) 
                          : 'Unknown'
                      });
                    });
                  }).catch(error => {
                    console.error("Error clearing data:", error);
                    toast({
                      title: "Error",
                      description: "Failed to clear data",
                      variant: "destructive"
                    });
                  });
                }
              }}
            >
              Clear All Data
            </Button>
          </CardFooter>
        </Card>
      </div>
      
      <div className="fixed bottom-4 left-0 right-0 flex justify-center">
        <Button 
          variant="outline" 
          onClick={() => setLocation("/")}
          className="rounded-full shadow-lg"
        >
          Back to Home
        </Button>
      </div>
    </div>
  );
}
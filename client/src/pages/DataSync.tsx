import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter 
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { teams } from "@/lib/teamData";
import { exportAllData, importData, getDBStats, clearTeamData, clearAllData, getMatchEntry, updateMatchEntry, getMatchesBySyncStatus } from "@/lib/db";
import { ExportData, MatchEntry } from "@/lib/types";
import { saveAs } from 'file-saver';
import { apiRequest } from "@/lib/queryClient";
import useOnlineStatus from "@/hooks/use-online-status";
import { vibrationSuccess, vibrationError } from "@/lib/haptics";
import { webSocketService } from "@/lib/websocket";

export default function DataSync() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { isOnline } = useOnlineStatus();
  
  // WebSocket connection state
  const [wsConnected, setWsConnected] = useState(false);
  
  // Scout identification
  const [scoutName, setScoutName] = useState<string>(
    localStorage.getItem('scout_name') || ''
  );
  const [showScoutDialog, setShowScoutDialog] = useState(false);
  
  // Export options
  const [exportType, setExportType] = useState("all");
  const [exportTeam, setExportTeam] = useState("");
  const [exportMatchStart, setExportMatchStart] = useState<number | null>(null);
  const [exportMatchEnd, setExportMatchEnd] = useState<number | null>(null);
  
  // Import options
  const [importType, setImportType] = useState<"merge" | "replace">("merge");
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importPreview, setImportPreview] = useState<{
    teams: number;
    entries: number;
    fileName: string;
  } | null>(null);
  
  // DB stats
  const [dbStats, setDbStats] = useState<{
    teamsCount: number;
    matchesCount: number;
    storageUsed: string;
  }>({
    teamsCount: 0,
    matchesCount: 0,
    storageUsed: "0 KB",
  });
  
  // Confirmation dialogs
  const [showClearTeamDialog, setShowClearTeamDialog] = useState(false);
  const [showClearAllDialog, setShowClearAllDialog] = useState(false);
  const [teamToClear, setTeamToClear] = useState("");

  // Last sync timestamp
  const [lastSync, setLastSync] = useState<string | null>(null);
  
  // Server sync state
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStats, setSyncStats] = useState<{
    pendingUploads: number;
    lastSyncTime: string | null;
  }>({
    pendingUploads: 0,
    lastSyncTime: null,
  });

  // Check for matches that need to be synced with the server
  const checkPendingSyncs = async () => {
    try {
      // Get matches by sync status
      const pendingMatches = await getMatchesBySyncStatus('pending');
      const failedMatches = await getMatchesBySyncStatus('failed');
      
      setSyncStats(prev => ({
        ...prev,
        pendingUploads: pendingMatches.length + failedMatches.length
      }));
    } catch (error) {
      console.error("Error checking pending syncs:", error);
    }
  };

  // Handle server sync
  const handleServerSync = async () => {
    if (!isOnline) {
      toast({
        title: "Offline",
        description: "You're currently offline. Please connect to the internet to sync with server.",
        variant: "destructive"
      });
      return;
    }
    
    setIsSyncing(true);
    
    try {
      // Get all match entries
      const data = await exportAllData();
      
      // Get matches that need to be synced - also include failed matches
      const matchesToSync = data.matches.filter(match => 
        !match.syncStatus || match.syncStatus === "pending" || match.syncStatus === "failed"
      );
      
      if (matchesToSync.length === 0) {
        toast({
          title: "Nothing to sync",
          description: "All match data is already synchronized",
        });
        setIsSyncing(false);
        return;
      }
      
      // Sync with server
      interface SyncResponse {
        success: boolean;
        syncedMatches: number;
        errors: string[];
      }
      
      const response = await apiRequest<SyncResponse>({
        endpoint: "/api/sync",
        method: "POST",
        data: {
          matches: matchesToSync
        }
      });
      
      if (response.success) {
        // Update sync status for matches
        for (const match of matchesToSync) {
          if (match.id) {
            // Update match entry sync status
            const matchToUpdate = await getMatchEntry(match.id);
            if (matchToUpdate) {
              // Update match sync status locally
              await updateMatchEntry({
                ...matchToUpdate,
                syncStatus: 'synced',
                syncedAt: Date.now()
              });
              console.log(`Updated sync status for match ${match.id}`);
            }
          }
        }
        
        // Update stats
        await checkPendingSyncs();
        
        // Update server sync time
        const now = Date.now();
        localStorage.setItem('serverSyncTime', now.toString());
        setSyncStats(prev => ({
          ...prev,
          lastSyncTime: formatLastSync(now)
        }));
        
        vibrationSuccess();
        toast({
          title: "Sync successful",
          description: `Synced ${response.syncedMatches} match entries with server`,
        });
      } else {
        throw new Error("Sync failed");
      }
    } catch (error) {
      console.error("Error syncing with server:", error);
      vibrationError();
      toast({
        title: "Sync failed",
        description: "Failed to sync with server. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSyncing(false);
    }
  };

  // Load DB stats on mount and check for pending syncs
  useEffect(() => {
    loadDbStats();
    checkPendingSyncs();
    const storedLastSync = localStorage.getItem('lastSync');
    if (storedLastSync) {
      setLastSync(formatLastSync(parseInt(storedLastSync)));
    }
    
    // Also load server sync status if available
    const serverSyncTime = localStorage.getItem('serverSyncTime');
    if (serverSyncTime) {
      setSyncStats(prev => ({
        ...prev,
        lastSyncTime: formatLastSync(parseInt(serverSyncTime))
      }));
    }
    
    // Connect to WebSocket for real-time updates
    if (isOnline) {
      webSocketService.connect();
    }
  }, [isOnline]);
  
  // Setup WebSocket listeners for sync events
  useEffect(() => {
    // Listen for connection status events
    const connectionStatusListener = webSocketService.addListener('connection_status', (data) => {
      console.log('WebSocket connection status:', data);
      setWsConnected(data.connected);
      
      if (data.connected) {
        // Request any updates we might have missed
        webSocketService.requestSync();
      }
    });
    
    // Listen for sync completed events
    const syncCompletedListener = webSocketService.addListener('sync_completed', (data) => {
      console.log('Received sync_completed event:', data);
      toast({
        title: "Sync Notification",
        description: "Another device has synchronized data with the server",
      });
      // Refresh pending syncs count
      checkPendingSyncs();
      // Update stats
      loadDbStats();
    });
    
    // Listen for new match events
    const matchUpdateListener = webSocketService.addListener('new_match', (data) => {
      console.log('Received new_match event:', data);
      if (data.matchData) {
        const teamName = teams.find(([number]) => number === data.matchData.team)?.[1] || 'Unknown';
        
        toast({
          title: "New Match Data",
          description: `Team ${data.matchData.team} (${teamName}) data received from ${data.matchData.scoutedBy || 'another device'}`,
        });
        
        // Save the received match data to our database
        import('@/lib/db').then(({ addMatchEntry }) => {
          addMatchEntry(data.matchData)
            .then(() => {
              console.log("Successfully saved match data from WebSocket");
              // Update stats after adding the match
              loadDbStats();
              checkPendingSyncs();
            })
            .catch(err => {
              console.error("Error saving WebSocket match data:", err);
            });
        });
      }
    });
    
    // Check initial connection status
    setWsConnected(webSocketService.isSocketConnected());
    
    // Cleanup listeners on unmount
    return () => {
      connectionStatusListener();
      syncCompletedListener();
      matchUpdateListener();
    };
  }, [toast]);

  // Format bytes to human-readable size
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Format timestamp to relative time
  const formatLastSync = (timestamp: number): string => {
    const now = Date.now();
    const diff = now - timestamp;
    
    const minutes = Math.floor(diff / 60000);
    if (minutes < 60) return `${minutes}m ago`;
    
    const hours = Math.floor(diff / 3600000);
    if (hours < 24) return `${hours}h ago`;
    
    const days = Math.floor(diff / 86400000);
    return `${days}d ago`;
  };

  // Load database statistics
  const loadDbStats = async () => {
    try {
      const stats = await getDBStats();
      
      setDbStats({
        teamsCount: stats.teamsCount,
        matchesCount: stats.matchesCount,
        storageUsed: stats.storageEstimate ? formatBytes(stats.storageEstimate.usage) : "Unknown",
      });
    } catch (error) {
      console.error("Error loading DB stats:", error);
    }
  };

  // Handle file selection for import
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) {
      setImportFile(null);
      setImportPreview(null);
      return;
    }
    
    const file = files[0];
    setImportFile(file);
    
    // Read file to generate preview
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const jsonData = JSON.parse(event.target?.result as string) as ExportData;
        
        setImportPreview({
          teams: new Set(jsonData.matches.map(match => match.team)).size,
          entries: jsonData.matches.length,
          fileName: file.name,
        });
      } catch (error) {
        console.error("Error parsing JSON file:", error);
        toast({
          title: "Invalid file",
          description: "The selected file is not a valid JSON export",
          variant: "destructive",
        });
        setImportFile(null);
        setImportPreview(null);
      }
    };
    
    reader.readAsText(file);
  };

  // Handle drag and drop for import
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const files = e.dataTransfer.files;
    if (!files || files.length === 0) return;
    
    const file = files[0];
    if (file.type !== "application/json") {
      toast({
        title: "Invalid file type",
        description: "Please drop a JSON file",
        variant: "destructive",
      });
      return;
    }
    
    // Simulate file input change
    if (fileInputRef.current) {
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);
      fileInputRef.current.files = dataTransfer.files;
      
      // Trigger change handler
      const event = new Event('change', { bubbles: true });
      fileInputRef.current.dispatchEvent(event);
    }
  };

  // Handle export
  const handleExport = async (format: 'json' | 'csv') => {
    try {
      const data = await exportAllData();
      
      // Create export data object
      const exportData: ExportData = {
        matches: data.matches,
        teams: data.teams,
        exportDate: Date.now(),
        appVersion: "1.0.0",
      };
      
      if (format === 'json') {
        // Export as JSON
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        saveAs(blob, `frc_scouting_export_${new Date().toISOString().split('T')[0]}.json`);
      } else {
        // Export as CSV
        let csv = "Team,MatchType,MatchNumber,Alliance,Defense,AvoidingDefense,ScoringAlgae,ScoringCorals,Autonomous,DrivingSkill,Climbing,Overall,Comments\n";
        
        data.matches.forEach(match => {
          csv += `${match.team},${match.matchType},${match.matchNumber},${match.alliance},${match.defense},${match.avoidingDefense},${match.scoringAlgae},${match.scoringCorals},${match.autonomous},${match.drivingSkill},${match.climbing},${match.overall},"${match.comments?.replace(/"/g, '""') || ''}"\n`;
        });
        
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
        saveAs(blob, `frc_scouting_export_${new Date().toISOString().split('T')[0]}.csv`);
      }
      
      // Update last sync time
      const now = Date.now();
      localStorage.setItem('lastSync', now.toString());
      setLastSync(formatLastSync(now));
      
      toast({
        title: "Export successful",
        description: `Data exported as ${format.toUpperCase()}`,
      });
    } catch (error) {
      console.error("Error exporting data:", error);
      toast({
        title: "Export failed",
        description: "Failed to export data. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Handle import
  const handleImport = async () => {
    if (!importFile) {
      toast({
        title: "No file selected",
        description: "Please select a file to import",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const reader = new FileReader();
      
      reader.onload = async (event) => {
        try {
          const jsonData = JSON.parse(event.target?.result as string) as ExportData;
          
          // Import data with selected mode
          await importData({
            matches: jsonData.matches,
            teams: jsonData.teams,
          }, importType);
          
          // Update DB stats
          await loadDbStats();
          
          // Update last sync time
          const now = Date.now();
          localStorage.setItem('lastSync', now.toString());
          setLastSync(formatLastSync(now));
          
          // Reset import state
          setImportFile(null);
          setImportPreview(null);
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
          
          toast({
            title: "Import successful",
            description: `Imported ${jsonData.matches.length} match entries`,
          });
        } catch (error) {
          console.error("Error importing data:", error);
          toast({
            title: "Import failed",
            description: "Failed to import data. The file may be corrupted.",
            variant: "destructive",
          });
        }
      };
      
      reader.readAsText(importFile);
    } catch (error) {
      console.error("Error reading file:", error);
      toast({
        title: "Import failed",
        description: "Failed to read the import file",
        variant: "destructive",
      });
    }
  };

  // Handle clear team data
  const handleClearTeam = async () => {
    if (!teamToClear) {
      toast({
        title: "No team selected",
        description: "Please select a team to clear",
        variant: "destructive",
      });
      return;
    }
    
    try {
      await clearTeamData(teamToClear);
      
      // Update DB stats
      await loadDbStats();
      
      setShowClearTeamDialog(false);
      setTeamToClear("");
      
      toast({
        title: "Data cleared",
        description: `All match data for team ${teamToClear} has been cleared`,
      });
    } catch (error) {
      console.error("Error clearing team data:", error);
      toast({
        title: "Operation failed",
        description: "Failed to clear team data",
        variant: "destructive",
      });
    }
  };

  // Handle clear all data
  const handleClearAll = async () => {
    try {
      await clearAllData();
      
      // Update DB stats
      await loadDbStats();
      
      setShowClearAllDialog(false);
      
      toast({
        title: "Data cleared",
        description: "All scouting data has been cleared",
      });
    } catch (error) {
      console.error("Error clearing all data:", error);
      toast({
        title: "Operation failed",
        description: "Failed to clear all data",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      {/* Desktop navigation tabs (hidden on mobile) */}
      <div className="hidden md:flex mb-6 border-b border-gray-300">
        <a href="/scout" className="tab-btn py-2 px-4 font-medium text-gray-700">
          <i className="fas fa-clipboard-list mr-2"></i>Scout Match
        </a>
        <a href="/team" className="tab-btn py-2 px-4 font-medium text-gray-700">
          <i className="fas fa-users mr-2"></i>View Team
        </a>
        <a href="/data" className="tab-btn active py-2 px-4 font-medium text-primary border-b-2 border-primary">
          <i className="fas fa-sync-alt mr-2"></i>Export / Import
        </a>
      </div>
      
      <Card>
        <CardContent className="p-4 md:p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
            <h2 className="text-xl font-bold">Export & Import Data</h2>
            
            {/* Server sync and scout name buttons */}
            <div className="mt-3 sm:mt-0 flex gap-2">
              <Button 
                variant="outline"
                className="w-auto text-sm"
                onClick={() => setShowScoutDialog(true)}
              >
                {scoutName ? `Scout: ${scoutName}` : 'Set Scout Name'}
              </Button>
              
              <Button 
                className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white font-medium"
                onClick={handleServerSync}
                disabled={isSyncing || !isOnline}
              >
                {isSyncing ? (
                  <>
                    <span className="animate-spin mr-2">⟳</span>
                    Syncing...
                  </>
                ) : (
                  <>
                    <i className="fas fa-cloud-upload-alt mr-2"></i>
                    Sync to Server {syncStats.pendingUploads > 0 && `(${syncStats.pendingUploads})`}
                  </>
                )}
              </Button>
              <div className="text-xs text-gray-500 text-center mt-1">
                {isOnline ? 
                  (syncStats.lastSyncTime ? `Last synced: ${syncStats.lastSyncTime}` : 'Not synced yet') : 
                  'Offline - Connect to sync'
                }
                {isOnline && (
                  <div className="mt-1 flex items-center justify-center gap-1">
                    <span className={`inline-block w-2 h-2 rounded-full ${wsConnected ? 'bg-green-500' : 'bg-red-500'}`}></span>
                    <span>{wsConnected ? 'Real-time connected' : 'Real-time disconnected'}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Export Section */}
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-medium mb-4">Export Data</h3>
              <p className="text-sm text-gray-600 mb-4">
                Export your locally stored scouting data to share with other team members.
              </p>
              
              <RadioGroup value={exportType} onValueChange={setExportType} className="space-y-4">
                <div className="flex items-center gap-3">
                  <RadioGroupItem value="all" id="export-all" />
                  <Label htmlFor="export-all">All Data</Label>
                </div>
                <div className="flex items-center gap-3">
                  <RadioGroupItem value="team" id="export-team" />
                  <Label htmlFor="export-team">Specific Team</Label>
                  <Select 
                    value={exportTeam} 
                    onValueChange={setExportTeam}
                    disabled={exportType !== "team"}
                  >
                    <SelectTrigger className="ml-2 w-40">
                      <SelectValue placeholder="Select Team" />
                    </SelectTrigger>
                    <SelectContent>
                      {teams.map(([teamNumber, teamName]) => (
                        <SelectItem key={teamNumber} value={teamNumber}>
                          {teamNumber} - {teamName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-3">
                  <RadioGroupItem value="matches" id="export-matches" />
                  <Label htmlFor="export-matches">Match Range</Label>
                  <div className="flex gap-2 ml-2">
                    <Input
                      type="number"
                      placeholder="From"
                      className="w-16"
                      value={exportMatchStart || ''}
                      onChange={(e) => setExportMatchStart(e.target.value ? parseInt(e.target.value) : null)}
                      disabled={exportType !== "matches"}
                    />
                    <span>-</span>
                    <Input
                      type="number"
                      placeholder="To"
                      className="w-16"
                      value={exportMatchEnd || ''}
                      onChange={(e) => setExportMatchEnd(e.target.value ? parseInt(e.target.value) : null)}
                      disabled={exportType !== "matches"}
                    />
                  </div>
                </div>
              </RadioGroup>
              
              <div className="mt-6 flex gap-3">
                <Button
                  onClick={() => handleExport('json')}
                  className="bg-primary text-white"
                >
                  <i className="fas fa-file-code mr-2"></i>Export as JSON
                </Button>
                <Button
                  onClick={() => handleExport('csv')}
                  className="bg-primary text-white"
                >
                  <i className="fas fa-file-csv mr-2"></i>Export as CSV
                </Button>
              </div>
            </div>
            
            {/* Import Section */}
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-medium mb-4">Import Data</h3>
              <p className="text-sm text-gray-600 mb-4">
                Import scouting data from other team members to combine datasets.
              </p>
              
              <div 
                className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center mb-4"
                onDragOver={handleDragOver}
                onDrop={handleDrop}
              >
                <div className="mb-3 text-gray-500">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <p className="text-sm text-gray-600 mb-3">Drag and drop JSON file here or</p>
                <label htmlFor="import-file" className="px-4 py-2 bg-primary text-white rounded font-medium text-sm cursor-pointer">
                  Browse Files
                </label>
                <input 
                  type="file" 
                  id="import-file" 
                  ref={fileInputRef}
                  accept=".json" 
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>
              
              <RadioGroup className="space-y-3" value={importType} onValueChange={(value) => setImportType(value as "merge" | "replace")}>
                <div className="flex items-center gap-3">
                  <RadioGroupItem value="merge" id="import-merge" />
                  <Label htmlFor="import-merge">Merge with existing data</Label>
                </div>
                <div className="flex items-center gap-3">
                  <RadioGroupItem value="replace" id="import-replace" />
                  <Label htmlFor="import-replace">Replace existing data</Label>
                </div>
              </RadioGroup>
              
              {importPreview && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium mb-2">Import Preview</h4>
                  <div className="bg-gray-50 p-3 rounded-lg text-sm">
                    <div className="flex justify-between border-b border-gray-200 pb-2 mb-2">
                      <span>Teams:</span>
                      <span>{importPreview.teams} teams</span>
                    </div>
                    <div className="flex justify-between border-b border-gray-200 pb-2 mb-2">
                      <span>Match Entries:</span>
                      <span>{importPreview.entries} entries</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Source:</span>
                      <span className="truncate max-w-[200px]">{importPreview.fileName}</span>
                    </div>
                  </div>
                  
                  <Button 
                    onClick={handleImport}
                    className="mt-4 bg-primary text-white"
                  >
                    <i className="fas fa-check mr-2"></i>Confirm Import
                  </Button>
                </div>
              )}
            </div>
          </div>
          
          {/* Server Sync Section */}
          <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
            <div className="flex flex-wrap justify-between items-center">
              <div>
                <h3 className="font-medium mb-1">Server Synchronization</h3>
                <p className="text-sm text-gray-600">
                  {isOnline ? (
                    "Sync your local data with the server when connected to the internet."
                  ) : (
                    "You're currently offline. Connect to the internet to sync data."
                  )}
                </p>
              </div>
              <div className="mt-3 sm:mt-0">
                <Button
                  onClick={handleServerSync}
                  disabled={!isOnline || isSyncing}
                  className={`relative ${!isOnline ? 'bg-gray-400' : 'bg-indigo-600 hover:bg-indigo-700'} text-white px-5 min-w-[120px]`}
                >
                  {isSyncing ? (
                    <>
                      <span className="animate-pulse">Syncing...</span>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                      </svg>
                      Sync with Server
                    </>
                  )}
                </Button>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="bg-white p-3 rounded-lg shadow-sm">
                <div className="text-sm text-gray-500">Pending Uploads</div>
                <div className="flex items-center">
                  <span className="text-xl font-medium">{syncStats.pendingUploads}</span>
                  {syncStats.pendingUploads > 0 && (
                    <Badge className="ml-2 bg-yellow-500">Needs Sync</Badge>
                  )}
                </div>
              </div>
              <div className="bg-white p-3 rounded-lg shadow-sm">
                <div className="text-sm text-gray-500">Last Server Sync</div>
                <div className="text-xl font-medium">{syncStats.lastSyncTime || "Never"}</div>
              </div>
            </div>
          </div>
          
          {/* Data Statistics */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium mb-3">Data Statistics</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white p-3 rounded-lg shadow-sm">
                <div className="text-sm text-gray-500">Teams Scouted</div>
                <div className="text-xl font-medium">{dbStats.teamsCount}</div>
              </div>
              <div className="bg-white p-3 rounded-lg shadow-sm">
                <div className="text-sm text-gray-500">Total Match Entries</div>
                <div className="text-xl font-medium">{dbStats.matchesCount}</div>
              </div>
              <div className="bg-white p-3 rounded-lg shadow-sm">
                <div className="text-sm text-gray-500">Storage Used</div>
                <div className="text-xl font-medium">{dbStats.storageUsed}</div>
              </div>
              <div className="bg-white p-3 rounded-lg shadow-sm">
                <div className="text-sm text-gray-500">Last Sync</div>
                <div className="text-xl font-medium">{lastSync || "Never"}</div>
              </div>
            </div>
          </div>
          
          {/* Danger Zone */}
          <div className="mt-6 border border-red-500 rounded-lg p-4">
            <h3 className="font-medium text-red-500 mb-3">Danger Zone</h3>
            <p className="text-sm text-gray-600 mb-4">
              These actions will permanently delete data and cannot be undone.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button 
                variant="outline"
                className="border-red-500 text-red-500"
                onClick={() => setShowClearTeamDialog(true)}
              >
                Clear Team Data
              </Button>
              <Button 
                variant="outline"
                className="border-red-500 text-red-500"
                onClick={() => setShowClearAllDialog(true)}
              >
                Clear All Data
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Clear Team Data Dialog */}
      <Dialog open={showClearTeamDialog} onOpenChange={setShowClearTeamDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Clear Team Data</DialogTitle>
            <DialogDescription>
              This will permanently delete all match data for the selected team.
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          <div className="my-4">
            <Label htmlFor="clear-team-select">Select Team</Label>
            <Select 
              value={teamToClear} 
              onValueChange={setTeamToClear}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select Team" />
              </SelectTrigger>
              <SelectContent>
                {teams.map(([teamNumber, teamName]) => (
                  <SelectItem key={teamNumber} value={teamNumber}>
                    {teamNumber} - {teamName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline"
              onClick={() => setShowClearTeamDialog(false)}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={handleClearTeam}
              disabled={!teamToClear}
            >
              Delete Data
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Clear All Data Dialog */}
      <Dialog open={showClearAllDialog} onOpenChange={setShowClearAllDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Clear All Data</DialogTitle>
            <DialogDescription>
              This will permanently delete all scouting data including match entries
              and team statistics. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          <div className="my-4 p-3 bg-red-50 border border-red-100 rounded-md text-red-800 text-sm">
            Warning: You will lose all scouting data that hasn't been exported.
            Consider exporting your data before proceeding.
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline"
              onClick={() => setShowClearAllDialog(false)}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={handleClearAll}
            >
              Delete All Data
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Scout Name Dialog */}
      <Dialog open={showScoutDialog} onOpenChange={setShowScoutDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Set Scout Name</DialogTitle>
            <DialogDescription>
              Enter your name to identify yourself when scouting matches. 
              This helps track who collected data across different devices.
            </DialogDescription>
          </DialogHeader>
          
          <div className="my-4">
            <Label htmlFor="scout-name">Your Name</Label>
            <Input
              id="scout-name"
              placeholder="Enter your name"
              value={scoutName}
              onChange={(e) => setScoutName(e.target.value)}
              className="mt-1"
            />
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline"
              onClick={() => setShowScoutDialog(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={() => {
                if (scoutName.trim()) {
                  // Save scout name to localStorage
                  localStorage.setItem('scout_name', scoutName.trim());
                  
                  // Update WebSocket service with new scout name
                  import('@/lib/websocket').then(({ webSocketService }) => {
                    webSocketService.setScoutName(scoutName.trim());
                    
                    toast({
                      title: "Scout Name Saved",
                      description: `Your scout name is now set to "${scoutName.trim()}"`,
                    });
                    
                    setShowScoutDialog(false);
                  });
                } else {
                  toast({
                    title: "Invalid Name",
                    description: "Please enter a valid name",
                    variant: "destructive"
                  });
                }
              }}
              disabled={!scoutName.trim()}
            >
              Save Name
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

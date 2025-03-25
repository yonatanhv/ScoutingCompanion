import { useState, useRef, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { exportData, importData, clearAllData, getDataStats, updateLastSync } from '@/lib/indexedDB';
import { DataStats, ExportData } from '@/lib/types';
import { saveAs } from 'file-saver';

export default function ExportImport() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [stats, setStats] = useState<DataStats>({
    teamsCount: 0,
    matchesCount: 0,
    dataSize: '0 KB'
  });
  const [importMode, setImportMode] = useState<'merge' | 'replace'>('merge');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const dataStats = await getDataStats();
        setStats(dataStats);
      } catch (error) {
        console.error('Error fetching data stats:', error);
        toast({
          title: 'Error',
          description: 'Failed to load data statistics.',
          variant: 'destructive',
        });
      }
    };
    
    fetchStats();
  }, [toast]);
  
  const formatTimestamp = (timestamp?: number) => {
    if (!timestamp) return 'Never';
    return new Date(timestamp).toLocaleString();
  };
  
  const handleExportJSON = async () => {
    try {
      setIsLoading(true);
      setLoadingMessage('Preparing JSON export...');
      
      const data = await exportData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      saveAs(blob, `frc-scouting-data-${new Date().toISOString().split('T')[0]}.json`);
      
      // Update last sync time
      updateLastSync();
      
      // Refresh stats
      const dataStats = await getDataStats();
      setStats(dataStats);
      
      toast({
        title: 'Success',
        description: 'Data exported successfully!',
      });
    } catch (error) {
      console.error('Error exporting data:', error);
      toast({
        title: 'Export Failed',
        description: 'Failed to export data. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleExportCSV = async () => {
    try {
      setIsLoading(true);
      setLoadingMessage('Preparing CSV export...');
      
      const data = await exportData();
      
      // Convert to CSV
      const headers = [
        'Team Number',
        'Team Name',
        'Tournament Stage',
        'Match Number',
        'Alliance Color',
        'Defense Performance',
        'Defense Notes',
        'Avoiding Defense',
        'Avoiding Defense Notes',
        'Scoring Algae',
        'Scoring Algae Notes',
        'Scoring Corals',
        'Scoring Corals Notes',
        'Autonomous',
        'Autonomous Notes',
        'Driving Skill',
        'Driving Skill Notes',
        'Climbing',
        'Overall Impression',
        'Comments',
        'Timestamp'
      ];
      
      const rows = data.matches.map(match => [
        match.teamNumber,
        match.teamName,
        match.tournamentStage,
        match.matchNumber,
        match.allianceColor,
        match.performanceRatings.defensePerformance.score,
        match.performanceRatings.defensePerformance.notes || '',
        match.performanceRatings.avoidingDefense.score,
        match.performanceRatings.avoidingDefense.notes || '',
        match.performanceRatings.scoringAlgae.score,
        match.performanceRatings.scoringAlgae.notes || '',
        match.performanceRatings.scoringCorals.score,
        match.performanceRatings.scoringCorals.notes || '',
        match.performanceRatings.autonomous.score,
        match.performanceRatings.autonomous.notes || '',
        match.performanceRatings.drivingSkill.score,
        match.performanceRatings.drivingSkill.notes || '',
        match.climbing,
        match.overallImpression,
        match.comments || '',
        new Date(match.timestamp).toISOString()
      ]);
      
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => {
          // Escape commas, quotes, and newlines
          if (typeof cell === 'string' && (cell.includes(',') || cell.includes('"') || cell.includes('\n'))) {
            return `"${cell.replace(/"/g, '""')}"`;
          }
          return cell;
        }).join(','))
      ].join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
      saveAs(blob, `frc-scouting-data-${new Date().toISOString().split('T')[0]}.csv`);
      
      // Update last sync time
      updateLastSync();
      
      // Refresh stats
      const dataStats = await getDataStats();
      setStats(dataStats);
      
      toast({
        title: 'Success',
        description: 'Data exported as CSV successfully!',
      });
    } catch (error) {
      console.error('Error exporting CSV data:', error);
      toast({
        title: 'Export Failed',
        description: 'Failed to export CSV. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const file = e.target.files[0];
    if (!file.name.endsWith('.json')) {
      toast({
        title: 'Invalid File',
        description: 'Please select a JSON file exported from this app.',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      setIsLoading(true);
      setLoadingMessage('Processing import file...');
      
      const fileContent = await file.text();
      const importedData = JSON.parse(fileContent) as ExportData;
      
      // Basic validation
      if (!importedData.version || !Array.isArray(importedData.matches)) {
        throw new Error('Invalid data format');
      }
      
      // Import the data
      const count = await importData(importedData, importMode);
      
      // Update last sync time
      updateLastSync();
      
      // Refresh stats
      const dataStats = await getDataStats();
      setStats(dataStats);
      
      toast({
        title: 'Import Successful',
        description: `Imported ${count} match records from ${file.name}`,
      });
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Error importing data:', error);
      toast({
        title: 'Import Failed',
        description: 'Failed to import data. Please check the file format.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleClearData = async () => {
    try {
      setIsLoading(true);
      setLoadingMessage('Clearing all data...');
      setIsAlertOpen(false);
      
      await clearAllData();
      
      // Refresh stats
      const dataStats = await getDataStats();
      setStats(dataStats);
      
      toast({
        title: 'Data Cleared',
        description: 'All scouting data has been cleared successfully.',
      });
    } catch (error) {
      console.error('Error clearing data:', error);
      toast({
        title: 'Error',
        description: 'Failed to clear data. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <section>
      <div className="bg-white rounded-lg shadow-md p-4 mb-4">
        <h2 className="text-lg font-bold mb-4 text-primary">Export & Import Data</h2>
        
        {/* Data Stats */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-medium">Your Scouting Data</h3>
            <span className="text-sm text-gray-500">Last sync: {formatTimestamp(stats.lastSync)}</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div className="bg-white p-3 rounded shadow-sm">
              <p className="text-3xl font-bold text-primary">{stats.teamsCount}</p>
              <p className="text-sm text-gray-500">Teams Scouted</p>
            </div>
            <div className="bg-white p-3 rounded shadow-sm">
              <p className="text-3xl font-bold text-primary">{stats.matchesCount}</p>
              <p className="text-sm text-gray-500">Matches Recorded</p>
            </div>
            <div className="bg-white p-3 rounded shadow-sm">
              <p className="text-3xl font-bold text-primary">{stats.dataSize}</p>
              <p className="text-sm text-gray-500">Data Size</p>
            </div>
          </div>
        </div>
        
        {/* Export Section */}
        <div className="mb-8">
          <h3 className="font-medium mb-3">Export Data</h3>
          <p className="text-sm text-gray-600 mb-4">Export your scouting data to share with others or create a backup.</p>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <button 
              onClick={handleExportJSON}
              disabled={isLoading || stats.matchesCount === 0}
              className="flex-1 bg-primary hover:bg-blue-700 text-white font-medium py-2 px-4 rounded flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="material-icons mr-2">download</span>
              Export as JSON
            </button>
            <button 
              onClick={handleExportCSV}
              disabled={isLoading || stats.matchesCount === 0}
              className="flex-1 bg-white hover:bg-gray-100 text-gray-800 font-medium py-2 px-4 border border-gray-300 rounded flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="material-icons mr-2">download</span>
              Export as CSV
            </button>
          </div>
        </div>
        
        {/* Import Section */}
        <div>
          <h3 className="font-medium mb-3">Import Data</h3>
          <p className="text-sm text-gray-600 mb-4">Import scouting data from other team members to combine datasets.</p>
          
          <div 
            className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center mb-4"
            onDragOver={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onDrop={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                const files = e.dataTransfer.files;
                if (fileInputRef.current) {
                  fileInputRef.current.files = files;
                  const event = new Event('change', { bubbles: true });
                  fileInputRef.current.dispatchEvent(event);
                }
              }
            }}
          >
            <span className="material-icons text-4xl text-gray-400 mb-2">upload_file</span>
            <p className="text-gray-500 mb-3">Drag and drop a JSON file here</p>
            <p className="text-xs text-gray-400 mb-4">or</p>
            <label className="bg-primary hover:bg-blue-700 text-white font-medium py-2 px-4 rounded cursor-pointer inline-block">
              <input 
                type="file" 
                accept=".json" 
                className="hidden" 
                ref={fileInputRef}
                onChange={handleFileChange}
                disabled={isLoading}
              />
              Browse Files
            </label>
          </div>
          
          {/* Import Options */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium mb-2 text-sm">Import Options</h4>
            <div className="flex flex-col space-y-2">
              <label className="inline-flex items-center">
                <input 
                  type="radio" 
                  name="importMode" 
                  value="merge" 
                  checked={importMode === 'merge'}
                  onChange={() => setImportMode('merge')}
                  className="form-radio text-primary" 
                />
                <span className="ml-2 text-sm">Merge with existing data (avoid duplicates)</span>
              </label>
              <label className="inline-flex items-center">
                <input 
                  type="radio" 
                  name="importMode" 
                  value="replace" 
                  checked={importMode === 'replace'}
                  onChange={() => setImportMode('replace')}
                  className="form-radio text-primary" 
                />
                <span className="ml-2 text-sm">Replace all existing data (caution)</span>
              </label>
            </div>
          </div>
        </div>
      </div>
      
      {/* Data Management */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <h3 className="font-medium mb-3">Data Management</h3>
        
        <div className="space-y-4">
          <div>
            <button 
              onClick={() => setIsAlertOpen(true)}
              disabled={isLoading || stats.matchesCount === 0}
              className="w-full bg-white hover:bg-gray-100 text-gray-800 font-medium py-2 px-4 border border-gray-300 rounded flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="material-icons mr-2 text-red-500">delete</span>
              Clear All Scouting Data
            </button>
          </div>
          
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <span className="material-icons text-yellow-400">info</span>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  This app works completely offline. All data is stored locally on your device using browser storage.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Loading Indicator */}
      {isLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg flex flex-col items-center">
            <div className="w-12 h-12 border-4 border-blue-200 border-t-primary rounded-full animate-spin mb-4"></div>
            <p className="text-gray-700">{loadingMessage}</p>
          </div>
        </div>
      )}
      
      {/* Confirmation Dialog */}
      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete all your scouting data. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleClearData} className="bg-red-600 hover:bg-red-700">
              Yes, Clear All Data
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}

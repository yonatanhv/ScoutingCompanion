import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { MatchEntry, TeamStatistics } from './types';
import { teams } from './teamData';

// Define the database schema
interface ScoutingDB extends DBSchema {
  matches: {
    key: number;
    value: MatchEntry;
    indexes: {
      'by-team': string;
      'by-match-type': string;
      'by-climbing': string;
    };
  };
  teams: {
    key: string;
    value: TeamStatistics;
  };
}

// Database name and version
const DB_NAME = 'frc-scouting-db';
const DB_VERSION = 1;

// Database instance
let db: IDBPDatabase<ScoutingDB>;

// Create default team statistics object
const createDefaultTeamStats = (teamNumber: string, teamName: string): TeamStatistics => ({
  teamNumber,
  teamName,
  matchCount: 0,
  totalMatches: 0,
  matchEntries: [],
  averages: {
    defense: 0,
    avoidingDefense: 0,
    scoringAlgae: 0,
    scoringCorals: 0,
    autonomous: 0,
    drivingSkill: 0,
    overall: 0,
  },
  climbingStats: {
    none: 0,
    low: 0,
    high: 0,
  },
});

// Initialize the database with a safer approach
export async function initDB(): Promise<void> {
  try {
    // Simple database initialization with schema creation only in the upgrade handler
    db = await openDB<ScoutingDB>(DB_NAME, DB_VERSION, {
      upgrade(database) {
        // Create matches store if it doesn't exist
        if (!database.objectStoreNames.contains('matches')) {
          const matchesStore = database.createObjectStore('matches', { 
            keyPath: 'id', 
            autoIncrement: true 
          });
          matchesStore.createIndex('by-team', 'team');
          matchesStore.createIndex('by-match-type', 'matchType');
          matchesStore.createIndex('by-climbing', 'climbing');
        }
        
        // Create teams store if it doesn't exist
        if (!database.objectStoreNames.contains('teams')) {
          database.createObjectStore('teams', { 
            keyPath: 'teamNumber' 
          });
        }
      },
      blocked() {
        console.warn('Database opening blocked. Close other tabs with this app running');
      },
      blocking() {
        console.warn('This connection is blocking a newer version');
        db.close();
      },
      terminated() {
        console.warn('Database connection terminated');
      }
    });

    // After database is open, check if we need to initialize team data
    const teamsCount = await db.count('teams');
    
    if (teamsCount === 0) {
      // No teams exist yet, let's add them
      console.log('Initializing team data...');
      const tx = db.transaction('teams', 'readwrite');
      
      for (const [teamNumber, teamName] of teams) {
        await tx.store.put(createDefaultTeamStats(teamNumber, teamName));
      }
      
      await tx.done;
      console.log('Team data initialized');
    } else {
      console.log(`Database already contains ${teamsCount} teams`);
    }
  } catch (error) {
    console.error('Database initialization error:', error);
    throw new Error(`Failed to initialize database: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// Add a new match entry
export async function addMatchEntry(entry: Omit<MatchEntry, 'id'> | MatchEntry): Promise<number> {
  try {
    // Check if this is an entry from another device (has id)
    if ('id' in entry && entry.id !== undefined) {
      // Check if we already have this entry
      const existingEntry = await getMatchEntry(entry.id);
      
      if (existingEntry) {
        console.log(`Entry with ID ${entry.id} already exists, checking for updates`);
        
        // Determine which entry is newer based on timestamp
        const incomingTimestamp = entry.transmitTime || entry.timestamp || 0;
        const existingTimestamp = existingEntry.transmitTime || existingEntry.timestamp || 0;
        
        // If the incoming entry is newer, update our record
        if (incomingTimestamp > existingTimestamp) {
          console.log(`Incoming entry is newer (${incomingTimestamp} > ${existingTimestamp}), updating`);
          await db.put('matches', {
            ...entry,
            syncStatus: entry.syncStatus || 'synced' // Mark as synced if received from WebSocket
          });
        } else {
          console.log(`Existing entry is newer or same age, keeping our version`);
        }
      } else {
        // Add the new entry with its original ID
        console.log(`Adding entry with provided ID ${entry.id} from other device`);
        await db.put('matches', {
          ...entry,
          syncStatus: entry.syncStatus || 'synced' // Mark as synced if received from WebSocket
        });
      }
      
      await updateTeamStatistics(entry.team);
      return entry.id;
    } else {
      // This is a new local entry
      
      // Add device identifier
      const deviceId = localStorage.getItem('device_id') || 
        `device_${Math.random().toString(36).substring(2, 11)}_${Date.now()}`;
      
      // Store the device ID for future use
      if (!localStorage.getItem('device_id')) {
        localStorage.setItem('device_id', deviceId);
      }
      
      // Add the scout's identifier if available, or use device ID
      const scoutedBy = localStorage.getItem('scout_name') || deviceId.split('_')[0];
      
      // Set initial sync status and metadata
      const entryWithMetadata = {
        ...entry,
        syncStatus: (entry as any).syncStatus || 'pending',
        deviceId,
        scoutedBy,
        transmitTime: Date.now()
      } as MatchEntry;
      
      // Add to local database
      const id = await db.add('matches', entryWithMetadata);
      
      // Update team statistics
      await updateTeamStatistics(entry.team);
      
      // Attempt to sync immediately if online
      if (navigator.onLine) {
        try {
          // Import webSocketService without creating circular dependencies
          const { webSocketService } = await import('./websocket');
          if (webSocketService.isSocketConnected()) {
            const newEntry = await getMatchEntry(id);
            if (newEntry) {
              webSocketService.sendMatchEntry(newEntry);
            }
          }
        } catch (error) {
          console.error('Failed to sync new entry immediately:', error);
        }
      }
      
      return id;
    }
  } catch (error) {
    console.error('Error adding match entry:', error);
    throw error;
  }
}

// Get all match entries for a team
export async function getTeamMatches(teamNumber: string): Promise<MatchEntry[]> {
  return db.getAllFromIndex('matches', 'by-team', teamNumber);
}

// Update an existing match entry
export async function updateMatchEntry(entry: MatchEntry): Promise<void> {
  await db.put('matches', entry);
  await updateTeamStatistics(entry.team);
}

// Get all match entries with specific sync status
export async function getMatchesBySyncStatus(status: 'pending' | 'synced' | 'failed'): Promise<MatchEntry[]> {
  const allMatches = await db.getAll('matches');
  return allMatches.filter(match => match.syncStatus === status);
}

// Get a specific match entry
export async function getMatchEntry(id: number): Promise<MatchEntry | undefined> {
  return db.get('matches', id);
}

// Delete a match entry
export async function deleteMatchEntry(id: number): Promise<void> {
  const entry = await db.get('matches', id);
  if (entry) {
    await db.delete('matches', id);
    await updateTeamStatistics(entry.team);
  }
}

// Get matches filtered by criteria
export async function getFilteredMatches({
  teamNumber,
  matchType,
  matchNumber,
  matchNumberStart,
  matchNumberEnd,
  climbing,
  minOverallScore,
}: {
  teamNumber?: string;
  matchType?: string;
  matchNumber?: number;
  matchNumberStart?: number;
  matchNumberEnd?: number;
  climbing?: string;
  minOverallScore?: number;
}): Promise<MatchEntry[]> {
  let matches: MatchEntry[] = [];
  
  if (teamNumber) {
    matches = await db.getAllFromIndex('matches', 'by-team', teamNumber);
  } else {
    matches = await db.getAll('matches');
  }
  
  return matches.filter(match => {
    // Filter by match type
    if (matchType && match.matchType !== matchType) return false;
    
    // Filter by exact match number if provided
    if (matchNumber !== undefined && match.matchNumber !== matchNumber) return false;
    
    // Filter by match number range if both start and end are provided
    if (matchNumberStart !== undefined && matchNumberEnd !== undefined) {
      // Make sure we include the boundaries
      if (match.matchNumber < matchNumberStart || match.matchNumber > matchNumberEnd) return false;
    } 
    // Filter by minimum match number only
    else if (matchNumberStart !== undefined && match.matchNumber < matchNumberStart) {
      return false;
    } 
    // Filter by maximum match number only
    else if (matchNumberEnd !== undefined && match.matchNumber > matchNumberEnd) {
      return false;
    }
    
    if (climbing && match.climbing !== climbing) return false;
    if (minOverallScore && match.overall < minOverallScore) return false;
    return true;
  });
}

// Get team statistics
export async function getTeamStatistics(teamNumber: string): Promise<TeamStatistics | undefined> {
  return db.get('teams', teamNumber);
}

// Get all teams
export async function getAllTeams(): Promise<TeamStatistics[]> {
  return db.getAll('teams');
}

// Update team statistics
export async function updateTeamStatistics(teamNumber: string): Promise<void> {
  const matches = await getTeamMatches(teamNumber);
  const teamData = await db.get('teams', teamNumber);
  
  if (!teamData) return;
  
  const count = matches.length;
  
  // Initialize accumulators
  const totals = {
    defense: 0,
    avoidingDefense: 0,
    scoringAlgae: 0,
    scoringCorals: 0,
    autonomous: 0,
    drivingSkill: 0,
    overall: 0,
  };
  
  const climbingCounts = {
    none: 0,
    low: 0,
    high: 0,
  };
  
  // Calculate totals
  matches.forEach(match => {
    totals.defense += match.defense;
    totals.avoidingDefense += match.avoidingDefense;
    totals.scoringAlgae += match.scoringAlgae;
    totals.scoringCorals += match.scoringCorals;
    totals.autonomous += match.autonomous;
    totals.drivingSkill += match.drivingSkill;
    totals.overall += match.overall;
    
    climbingCounts[match.climbing as keyof typeof climbingCounts]++;
  });
  
  // Calculate averages
  const averages = count > 0 ? {
    defense: totals.defense / count,
    avoidingDefense: totals.avoidingDefense / count,
    scoringAlgae: totals.scoringAlgae / count,
    scoringCorals: totals.scoringCorals / count,
    autonomous: totals.autonomous / count,
    drivingSkill: totals.drivingSkill / count,
    overall: totals.overall / count,
  } : {
    defense: 0,
    avoidingDefense: 0,
    scoringAlgae: 0,
    scoringCorals: 0,
    autonomous: 0,
    drivingSkill: 0,
    overall: 0,
  };
  
  // Update team statistics
  await db.put('teams', {
    ...teamData,
    matchCount: count,
    averages,
    climbingStats: climbingCounts,
  });
}

// Export all data
export async function exportAllData(): Promise<{
  matches: MatchEntry[];
  teams: TeamStatistics[];
}> {
  const matches = await db.getAll('matches');
  const teams = await db.getAll('teams');
  
  return { matches, teams };
}

// Import data
export async function importData(
  data: { matches: MatchEntry[]; teams: TeamStatistics[] },
  mode: 'merge' | 'replace'
): Promise<number> {
  try {
    // Track the number of imported matches for reporting
    let importedCount = 0;
    
    // Clear existing data if replacing
    if (mode === 'replace') {
      const matchesStore = db.transaction('matches', 'readwrite').objectStore('matches');
      await matchesStore.clear();
      
      const teamsStore = db.transaction('teams', 'readwrite').objectStore('teams');
      await teamsStore.clear();
      
      // Re-initialize team data since we cleared it
      const teamsTx = db.transaction('teams', 'readwrite');
      for (const [teamNumber, teamName] of teams) {
        await teamsTx.store.put(createDefaultTeamStats(teamNumber, teamName));
      }
      await teamsTx.done;
    }
    
    // Import matches with conflict resolution
    const tx = db.transaction('matches', 'readwrite');
    
    for (const match of data.matches) {
      try {
        // Handle merge mode with conflict resolution
        if (mode === 'merge' && match.id) {
          const existing = await tx.store.get(match.id);
          
          if (existing) {
            // Compare timestamps to determine which is newer
            const incomingTimestamp = match.transmitTime || match.timestamp || 0;
            const existingTimestamp = existing.transmitTime || existing.timestamp || 0;
            
            if (incomingTimestamp > existingTimestamp) {
              // The imported entry is newer
              await tx.store.put({
                ...match,
                // Preserve the sync status unless the imported entry is explicitly marked as synced
                syncStatus: match.syncStatus === 'synced' ? 'synced' : existing.syncStatus
              });
              importedCount++;
            }
            // If existing is newer, skip this entry
            continue;
          }
        }
        
        // For new entries or in replace mode
        if (match.id) {
          // Keep original ID for entries that have one
          await tx.store.put({
            ...match,
            // Mark as pending unless explicitly marked as synced
            syncStatus: match.syncStatus === 'synced' ? 'synced' : 'pending'
          });
        } else {
          // Remove ID to allow auto-incrementing for entries without ID
          const { id, ...matchWithoutId } = match as any;
          await tx.store.add({
            ...matchWithoutId,
            syncStatus: 'pending' // New entries need to be synced
          });
        }
        importedCount++;
      } catch (error) {
        console.error(`Error importing match:`, match, error);
        // Continue with other matches even if one fails
      }
    }
    
    await tx.done;
    
    // Update team statistics for all teams
    // Create an array of unique team numbers from both imported data and existing teams
    const uniqueTeams = Array.from(
      new Set<string>([
        ...data.matches.map(m => m.team),
        ...teams.map(t => t[0])
      ])
    );
    
    // Update statistics for each affected team
    for (const teamNumber of uniqueTeams) {
      await updateTeamStatistics(teamNumber);
    }
    
    // If we're online, try to sync pending entries
    if (navigator.onLine) {
      try {
        const pendingMatches = await getMatchesBySyncStatus('pending');
        if (pendingMatches.length > 0) {
          console.log(`Attempting to sync ${pendingMatches.length} pending matches after import`);
          
          // We'll do this in the background, not awaiting
          import('./websocket').then(({ webSocketService }) => {
            if (webSocketService.isSocketConnected()) {
              webSocketService.send('sync_request', { pendingCount: pendingMatches.length });
            }
          }).catch(e => console.error('Failed to request sync after import:', e));
        }
      } catch (e) {
        console.error('Error checking for pending matches after import:', e);
      }
    }
    
    return importedCount;
  } catch (error) {
    console.error('Error importing data:', error);
    throw error;
  }
}

// Get database statistics
export async function getDBStats(): Promise<{
  teamsCount: number;
  matchesCount: number;
  storageEstimate: { usage: number; quota: number } | null;
}> {
  const matches = await db.getAll('matches');
  const teams = await db.getAll('teams');
  const teamsWithData = teams.filter(team => team.matchCount > 0);
  
  let storageEstimate = null;
  if ('storage' in navigator && 'estimate' in navigator.storage) {
    storageEstimate = await navigator.storage.estimate() as { usage: number; quota: number };
  }
  
  return {
    teamsCount: teamsWithData.length,
    matchesCount: matches.length,
    storageEstimate,
  };
}

// Clear all match data for a specific team
export async function clearTeamData(teamNumber: string): Promise<void> {
  const matches = await getTeamMatches(teamNumber);
  
  const tx = db.transaction('matches', 'readwrite');
  for (const match of matches) {
    tx.store.delete(match.id!);
  }
  await tx.done;
  
  await updateTeamStatistics(teamNumber);
}

// Clear all data
export async function clearAllData(): Promise<void> {
  const matchesStore = db.transaction('matches', 'readwrite').objectStore('matches');
  await matchesStore.clear();
  
  // Reset team statistics
  for (const team of teams) {
    await updateTeamStatistics(team[0]);
  }
}

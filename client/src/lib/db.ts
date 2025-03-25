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
export async function addMatchEntry(entry: Omit<MatchEntry, 'id'>): Promise<number> {
  const id = await db.add('matches', entry as MatchEntry);
  await updateTeamStatistics(entry.team);
  return id;
}

// Get all match entries for a team
export async function getTeamMatches(teamNumber: string): Promise<MatchEntry[]> {
  return db.getAllFromIndex('matches', 'by-team', teamNumber);
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
  climbing,
  minOverallScore,
}: {
  teamNumber?: string;
  matchType?: string;
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
    if (matchType && match.matchType !== matchType) return false;
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
): Promise<void> {
  // Clear existing data if replacing
  if (mode === 'replace') {
    const matchesStore = db.transaction('matches', 'readwrite').objectStore('matches');
    await matchesStore.clear();
    
    const teamsStore = db.transaction('teams', 'readwrite').objectStore('teams');
    await teamsStore.clear();
  }
  
  // Import matches
  const tx = db.transaction('matches', 'readwrite');
  for (const match of data.matches) {
    // Check if match already exists when merging
    if (mode === 'merge' && match.id) {
      const existing = await tx.store.get(match.id);
      if (existing) continue;
    }
    
    // Remove ID to allow auto-incrementing
    const { id, ...matchWithoutId } = match;
    tx.store.add(matchWithoutId as MatchEntry);
  }
  await tx.done;
  
  // Update team statistics
  for (const team of teams) {
    await updateTeamStatistics(team[0]);
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

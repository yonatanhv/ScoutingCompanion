import { openDB, IDBPDatabase, DBSchema } from 'idb';
import { MatchData, TeamAverages, TeamDataFilter, ExportData, DataStats } from './types';

// Define the database schema
interface ScoutingDB extends DBSchema {
  matches: {
    key: number;
    value: MatchData;
    indexes: {
      'by-team': string;
      'by-timestamp': number;
    };
  };
}

// Database configuration
const DB_NAME = 'frc-scouting-db';
const DB_VERSION = 1;
let db: IDBPDatabase<ScoutingDB>;

// Initialize the database
export async function initDB(): Promise<void> {
  db = await openDB<ScoutingDB>(DB_NAME, DB_VERSION, {
    upgrade(database) {
      const matchesStore = database.createObjectStore('matches', {
        keyPath: 'id',
        autoIncrement: true,
      });
      
      // Create indexes for quick lookups
      matchesStore.createIndex('by-team', 'teamNumber');
      matchesStore.createIndex('by-timestamp', 'timestamp');
    },
  });
  console.log('IndexedDB initialized successfully');
}

// Match data operations
export async function saveMatch(matchData: Omit<MatchData, 'id'>): Promise<number> {
  if (!db) await initDB();
  const id = await db.add('matches', {
    ...matchData,
    timestamp: Date.now(),
  });
  return id as number;
}

export async function updateMatch(matchData: MatchData): Promise<void> {
  if (!db) await initDB();
  await db.put('matches', matchData);
}

export async function deleteMatch(id: number): Promise<void> {
  if (!db) await initDB();
  await db.delete('matches', id);
}

export async function getAllMatches(): Promise<MatchData[]> {
  if (!db) await initDB();
  return db.getAll('matches');
}

export async function getMatchesByTeam(teamNumber: string): Promise<MatchData[]> {
  if (!db) await initDB();
  const index = db.transaction('matches').store.index('by-team');
  return index.getAll(teamNumber);
}

export async function getFilteredMatches(teamNumber: string, filter: TeamDataFilter): Promise<MatchData[]> {
  if (!db) await initDB();
  
  // Get all matches for the team
  let matches = await getMatchesByTeam(teamNumber);
  
  // Apply filters
  if (filter.tournamentStage && filter.tournamentStage !== 'All') {
    matches = matches.filter(match => match.tournamentStage === filter.tournamentStage);
  }
  
  if (filter.climbing && filter.climbing !== 'All') {
    matches = matches.filter(match => match.climbing === filter.climbing);
  }
  
  if (filter.minOverallScore !== undefined) {
    matches = matches.filter(match => match.overallImpression >= filter.minOverallScore);
  }
  
  return matches;
}

// Team data calculations
export async function calculateTeamAverages(teamNumber: string): Promise<TeamAverages | null> {
  if (!db) await initDB();
  
  const matches = await getMatchesByTeam(teamNumber);
  if (matches.length === 0) return null;
  
  const teamName = matches[0].teamName;
  let totalDefensePerformance = 0;
  let totalAvoidingDefense = 0;
  let totalScoringAlgae = 0;
  let totalScoringCorals = 0;
  let totalAutonomous = 0;
  let totalDrivingSkill = 0;
  let totalOverallImpression = 0;
  const climbingCounts = {
    None: 0,
    Low: 0,
    High: 0
  };
  
  matches.forEach(match => {
    totalDefensePerformance += match.performanceRatings.defensePerformance.score;
    totalAvoidingDefense += match.performanceRatings.avoidingDefense.score;
    totalScoringAlgae += match.performanceRatings.scoringAlgae.score;
    totalScoringCorals += match.performanceRatings.scoringCorals.score;
    totalAutonomous += match.performanceRatings.autonomous.score;
    totalDrivingSkill += match.performanceRatings.drivingSkill.score;
    totalOverallImpression += match.overallImpression;
    climbingCounts[match.climbing]++;
  });
  
  const matchCount = matches.length;
  
  return {
    teamNumber,
    teamName,
    matchCount,
    defensePerformance: Number((totalDefensePerformance / matchCount).toFixed(1)),
    avoidingDefense: Number((totalAvoidingDefense / matchCount).toFixed(1)),
    scoringAlgae: Number((totalScoringAlgae / matchCount).toFixed(1)),
    scoringCorals: Number((totalScoringCorals / matchCount).toFixed(1)),
    autonomous: Number((totalAutonomous / matchCount).toFixed(1)),
    drivingSkill: Number((totalDrivingSkill / matchCount).toFixed(1)),
    overallImpression: Number((totalOverallImpression / matchCount).toFixed(1)),
    climbingCounts
  };
}

// Export and import functionality
export async function exportData(): Promise<ExportData> {
  if (!db) await initDB();
  
  const matches = await getAllMatches();
  
  return {
    version: '1.0',
    exportDate: Date.now(),
    matches
  };
}

export async function importData(data: ExportData, mode: 'merge' | 'replace'): Promise<number> {
  if (!db) await initDB();
  
  if (mode === 'replace') {
    // Clear all existing data
    const tx = db.transaction('matches', 'readwrite');
    await tx.objectStore('matches').clear();
    await tx.done;
  }
  
  // Add all matches from the import
  const tx = db.transaction('matches', 'readwrite');
  const store = tx.objectStore('matches');
  
  // If merging, we need to avoid duplicates
  // This is a simple approach - in a real app you might need more sophisticated merging
  if (mode === 'merge') {
    const existingMatches = await getAllMatches();
    const existingIds = new Set(existingMatches.map(m => m.id));
    
    for (const match of data.matches) {
      // Skip if this ID already exists
      if (match.id && existingIds.has(match.id)) continue;
      
      // Otherwise add the match
      await store.add({
        ...match,
        id: undefined // Let IDB auto-generate new IDs
      });
    }
  } else {
    // For replace mode, just add all the matches
    for (const match of data.matches) {
      await store.add({
        ...match,
        id: undefined // Let IDB auto-generate new IDs
      });
    }
  }
  
  await tx.done;
  
  // Return the number of matches imported
  return data.matches.length;
}

export async function clearAllData(): Promise<void> {
  if (!db) await initDB();
  
  const tx = db.transaction('matches', 'readwrite');
  await tx.objectStore('matches').clear();
  await tx.done;
}

export async function getDataStats(): Promise<DataStats> {
  if (!db) await initDB();
  
  const matches = await getAllMatches();
  
  // Get unique teams
  const teamSet = new Set(matches.map(match => match.teamNumber));
  
  // Calculate approximate data size
  const serializedData = JSON.stringify(matches);
  const dataSize = getDataSizeString(serializedData.length);
  
  return {
    teamsCount: teamSet.size,
    matchesCount: matches.length,
    dataSize,
    lastSync: localStorage.getItem('lastSync') ? parseInt(localStorage.getItem('lastSync')!) : undefined
  };
}

// Helper function to format data size
function getDataSizeString(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// Update last sync time
export function updateLastSync(): void {
  localStorage.setItem('lastSync', Date.now().toString());
}

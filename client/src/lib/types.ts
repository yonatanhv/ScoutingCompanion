// Match entry types
export interface MatchEntry {
  id?: number;
  team: string;
  matchType: string;
  matchNumber: number;
  alliance: string;
  
  // Performance ratings (1-7)
  defense: number;
  defenseComment?: string;
  avoidingDefense: number;
  avoidingDefenseComment?: string;
  scoringAlgae: number;
  scoringAlgaeComment?: string;
  scoringCorals: number;
  scoringCoralsComment?: string;
  autonomous: number;
  autonomousComment?: string;
  drivingSkill: number;
  drivingSkillComment?: string;
  
  // Climbing (none, low, high)
  climbing: string;
  climbingComment?: string;
  
  // Overall impression (1-7)
  overall: number;
  comments?: string;
  
  // Metadata
  timestamp: number;
  
  // Sync status for server synchronization
  syncStatus?: 'pending' | 'synced' | 'failed';
  syncedAt?: number;
  scoutedBy?: string;
}

// Team statistics
export interface TeamStatistics {
  teamNumber: string;
  teamName: string;
  matchCount: number;
  totalMatches?: number;
  matchEntries?: MatchEntry[];
  
  // Average ratings
  averages: {
    defense: number;
    avoidingDefense: number;
    scoringAlgae: number;
    scoringCorals: number;
    autonomous: number;
    drivingSkill: number;
    overall: number;
  };
  
  // Climbing statistics
  climbingStats: {
    none: number;
    low: number;
    high: number;
  };
}

// Export/Import data
export interface ExportData {
  matches: MatchEntry[];
  teams: TeamStatistics[];
  exportDate: number;
  appVersion: string;
}

// Filter criteria
export interface FilterCriteria {
  matchType?: string;
  climbing?: string;
  minOverallScore?: number;
}

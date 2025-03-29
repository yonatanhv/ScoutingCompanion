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
  
  // Cross-device sync metadata
  deviceId?: string;           // Unique identifier for the device that created this entry
  transmitTime?: number;       // Timestamp when the entry was last transmitted
  
  // Sync status for server synchronization
  syncStatus?: 'pending' | 'synced' | 'failed';
  syncedAt?: number;           // Timestamp when the entry was synced with the server
  scoutedBy?: string;          // Name/identifier of the person who scouted this match
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
  matchNumberStart?: number;
  matchNumberEnd?: number;
  tags?: string[];
  minDefense?: number;
  minAvoidingDefense?: number;
  minScoringAlgae?: number;
  minScoringCorals?: number;
  minAutonomous?: number;
  minDrivingSkill?: number;
}

// Team tags
export interface TeamTag {
  id: string; // unique ID for the tag
  name: string; // display name
  color: string; // color code for display
  teamNumber?: string; // Associated team number (used for indexedDB storage)
}

// Alliance details
export interface Alliance {
  teams: string[]; // Array of 3 team numbers
  combinedAverages: {
    defense: number;
    avoidingDefense: number;
    scoringAlgae: number;
    scoringCorals: number;
    autonomous: number;
    drivingSkill: number;
    overall: number;
  };
  climbingBreakdown: {
    none: number;
    low: number;
    high: number;
  };
  strengths: string[];
  weaknesses: string[];
  synergy: number; // 1-10 rating of how well teams complement each other
  performanceVariance: number; // Measure of consistency (lower is better)
  climbSuccessRate: number; // Percentage (0.0-1.0) of successful climbs
  roleCoverage: number; // Percentage (0.0-1.0) of role coverage within the alliance
}

// Filter preset
export interface FilterPreset {
  id: string;
  name: string;
  criteria: FilterCriteria;
}

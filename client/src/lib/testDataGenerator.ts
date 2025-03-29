/**
 * Test Data Generator for FRC Scouting App
 * Generates realistic random scouting data for the REEFSCAPE game
 */

import { type MatchEntry } from '@shared/schema';

// FRC Team number range for random team selection
const MIN_TEAM_NUMBER = 1;
const MAX_TEAM_NUMBER = 9999;

// Match types available
const MATCH_TYPES = ['practice', 'qualification', 'playoff'];

// Alliance options
const ALLIANCES = ['red', 'blue'];

// Climbing options
const CLIMBING_OPTIONS = ['none', 'park', 'shallow', 'deep'];

// Sample team names for a more realistic experience
const SAMPLE_TEAM_NAMES: Record<string, string> = {
  '254': 'Cheesy Poofs',
  '1114': 'Simbotics',
  '118': 'Robonauts',
  '2056': 'OP Robotics',
  '1678': 'Citrus Circuits',
  '1323': 'MadTown Robotics',
  '195': 'CyberKnights',
  '3310': 'Black Hawk Robotics',
  '2767': 'Stryke Force',
  '971': 'Spartan Robotics',
  '33': 'Killer Bees',
  '225': 'TechFire',
  '330': 'Beach Bots',
  '359': 'Hawaiian Kids',
  '2468': 'Team Appreciate',
  '2481': 'Roboteers',
  '2910': 'Jack in the Bot',
  '3538': 'RoboJackets',
  '4481': 'Team Rembrandts',
  '5499': 'The Bay Orangutans'
};

/**
 * Generates a random integer within a range (inclusive)
 */
export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Team database for generating data with real teams
 */
let existingTeams: string[] = [];

/**
 * Set existing teams from the database to use for generation
 */
export function setExistingTeams(teams: string[]) {
  existingTeams = teams;
}

/**
 * Generates a random team number from existing teams or creates a random one
 */
export function randomTeamNumber(): string {
  // If we have existing teams, use those
  if (existingTeams.length > 0) {
    return existingTeams[randomInt(0, existingTeams.length - 1)];
  }
  // Otherwise generate a random one
  return randomInt(MIN_TEAM_NUMBER, MAX_TEAM_NUMBER).toString();
}

/**
 * Returns a predefined team name or a generic one
 */
export function getTeamName(teamNumber: string): string {
  return SAMPLE_TEAM_NAMES[teamNumber] || `Team ${teamNumber}`;
}

/**
 * Generates a random rating between 1-7 with a normal distribution bias
 * Uses the Box-Muller transform to generate more realistic ratings
 * centering around a given mean with a normal distribution
 */
export function randomRating(mean: number = 4, stdDev: number = 1.5): number {
  // Box-Muller transform
  const u1 = Math.random();
  const u2 = Math.random();
  const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
  
  // Scale and shift to get desired mean and standard deviation
  let rating = Math.round(z0 * stdDev + mean);
  
  // Ensure result is within 1-7 range
  rating = Math.max(1, Math.min(7, rating));
  return rating;
}

/**
 * Generates a random comment for a given category and rating
 * Returns undefined for use in the codebase, but the actual type may need to be
 * converted at the interface boundary depending on what the backend expects
 */
export function generateComment(category: string, rating: number): string | null {
  // Only generate comments ~40% of the time
  if (Math.random() > 0.4) return null;
  
  // Rating categories
  const lowRatings = [
    'Needs significant improvement',
    'Struggling with consistency',
    'Below average performance',
    'Not effective in matches'
  ];
  
  const mediumRatings = [
    'Average performance',
    'Some good moments',
    'Improving throughout matches',
    'Consistent but not outstanding'
  ];
  
  const highRatings = [
    'Excellent performance',
    'Very consistent and reliable',
    'Outstanding strategy and execution',
    'One of the best teams in this area'
  ];
  
  // Category-specific phrases
  const categoryPhrases: Record<string, string[]> = {
    defense: [
      'blocks access to REEF',
      'disrupts ALGAE collection',
      'can control center of field',
      'uses wedge design effectively',
      'pins opponents against walls'
    ],
    avoidingDefense: [
      'maneuvers around defenders',
      'uses speed to avoid contact',
      'changes direction quickly',
      'finds gaps in defensive formations',
      'maintains distance from defensive bots'
    ],
    scoringAlgae: [
      'accurate ALGAE shooting',
      'consistent PROCESSOR deposits',
      'effective NET throws',
      'collects ALGAE quickly',
      'can shoot from distance'
    ],
    scoringCorals: [
      'places CORAL on all REEF levels',
      'quick CORAL placement',
      'handles multiple CORAL pieces',
      'careful with CORAL placement rules',
      'strategic about REEF selection'
    ],
    autonomous: [
      'reliable auto routines',
      'scores multiple game pieces',
      'navigates field obstacles',
      'consistent starting position',
      'adaptive pathfinding'
    ],
    drivingSkill: [
      'precise control',
      'smooth movements',
      'aggressive when needed',
      'cautious in traffic',
      'good field awareness'
    ],
    climbing: [
      'quick to position for climbing',
      'reliable CAGE mechanism',
      'can adjust position on BARGE',
      'maintains balance during climb',
      'manages time for endgame'
    ],
    overall: [
      'good team coordination',
      'effective communication',
      'strategic gameplay',
      'adaptable to different alliances',
      'reliable in high-pressure situations'
    ]
  };
  
  // Select appropriate rating pool
  let ratingPool: string[];
  if (rating <= 3) {
    ratingPool = lowRatings;
  } else if (rating <= 5) {
    ratingPool = mediumRatings;
  } else {
    ratingPool = highRatings;
  }
  
  // Get category-specific phrases or use generic ones
  const phrasesPool = categoryPhrases[category] || [
    'performance was notable',
    'showed good strategy',
    'technical skills were evident',
    'game awareness was apparent'
  ];
  
  // Construct comment
  const ratingComment = ratingPool[randomInt(0, ratingPool.length - 1)];
  const phraseComment = phrasesPool[randomInt(0, phrasesPool.length - 1)];
  
  return `${ratingComment}. ${phraseComment}.`;
}

/**
 * Generates a random climbing status
 * Weighted to make deeper climbs less common
 */
export function randomClimbing(): string {
  const rand = Math.random();
  if (rand < 0.3) return 'none';
  if (rand < 0.5) return 'park';
  if (rand < 0.8) return 'shallow';
  return 'deep';
}

/**
 * Generates a match entry with random data
 */
export function generateMatchEntry(userId?: number): Omit<MatchEntry, 'id'> {
  // Generate random performance ratings (with slight team bias for consistency)
  const teamBias = randomInt(-1, 1); // Team bias affects all ratings slightly
  
  // Generate core fields
  const teamNumber = randomTeamNumber();
  const defense = randomRating(4 + teamBias);
  const avoidingDefense = randomRating(4 + teamBias);
  const scoringAlgae = randomRating(4 + teamBias);
  const scoringCorals = randomRating(4 + teamBias);
  const autonomous = randomRating(4 + teamBias);
  const drivingSkill = randomRating(4 + teamBias);
  const climbing = randomClimbing();
  
  // Overall rating is influenced by other ratings
  const overallBase = (
    defense + 
    avoidingDefense + 
    scoringAlgae + 
    scoringCorals + 
    autonomous + 
    drivingSkill
  ) / 6;
  
  // Climbing bonus
  const climbingBonus = 
    climbing === 'deep' ? 1 : 
    climbing === 'shallow' ? 0.5 : 
    climbing === 'park' ? 0.2 : 0;
  
  // Calculate overall with some randomness
  let overall = Math.round(overallBase + climbingBonus + randomInt(-1, 1));
  overall = Math.max(1, Math.min(7, overall));
  
  // Create the match entry with required timestamp
  return {
    team: teamNumber,
    matchType: MATCH_TYPES[randomInt(0, MATCH_TYPES.length - 1)],
    matchNumber: randomInt(1, 100),
    alliance: ALLIANCES[randomInt(0, 1)],
    
    // Ratings
    defense,
    defenseComment: generateComment('defense', defense),
    avoidingDefense,
    avoidingDefenseComment: generateComment('avoidingDefense', avoidingDefense),
    scoringAlgae,
    scoringAlgaeComment: generateComment('scoringAlgae', scoringAlgae),
    scoringCorals,
    scoringCoralsComment: generateComment('scoringCorals', scoringCorals),
    autonomous,
    autonomousComment: generateComment('autonomous', autonomous),
    drivingSkill,
    drivingSkillComment: generateComment('drivingSkill', drivingSkill),
    
    // Climbing
    climbing,
    climbingComment: generateComment('climbing', climbing === 'deep' ? 7 : climbing === 'shallow' ? 5 : climbing === 'park' ? 3 : 1),
    
    // Overall impression
    overall,
    comments: generateComment('overall', overall),
    
    // Required metadata
    timestamp: new Date(Date.now()) as unknown as Date, // Convert epoch timestamp to Date for schema compatibility
    syncStatus: 'pending' as 'pending' | 'synced' | 'failed',
    userId: userId !== undefined ? userId : null,
    
    // Optional scout information
    scoutedBy: "TestGenerator"
  };
}

/**
 * Generates multiple match entries
 */
export function generateMatchEntries(count: number, userId?: number): Array<Omit<MatchEntry, 'id'>> {
  const entries: Array<Omit<MatchEntry, 'id'>> = [];
  
  for (let i = 0; i < count; i++) {
    entries.push(generateMatchEntry(userId));
  }
  
  return entries;
}

/**
 * Generates a set of entries for specific teams to ensure they have data
 */
export function generateEntriesForTeams(teamNumbers: string[], entriesPerTeam: number = 3, userId?: number): Array<Omit<MatchEntry, 'id'>> {
  const entries: Array<Omit<MatchEntry, 'id'>> = [];
  
  for (const teamNumber of teamNumbers) {
    for (let i = 0; i < entriesPerTeam; i++) {
      const entry = generateMatchEntry(userId);
      entry.team = teamNumber;
      entries.push(entry);
    }
  }
  
  return entries;
}

/**
 * Generates a balanced dataset with a mix of random teams and specified teams
 */
export function generateBalancedDataset(count: number, includedTeams: string[] = []): Array<Omit<MatchEntry, 'id'>> {
  // Generate data for specific teams first
  const specificTeamEntries = includedTeams.length > 0 
    ? generateEntriesForTeams(includedTeams, 3)
    : [];
  
  // Fill the rest with random entries
  const remainingCount = Math.max(0, count - specificTeamEntries.length);
  const randomEntries = generateMatchEntries(remainingCount);
  
  return [...specificTeamEntries, ...randomEntries];
}

/**
 * Get the list of sample team numbers and names from our predefined set
 * @returns Array of team number and name pairs
 */
export function getSampleTeams(): Array<{teamNumber: string, teamName: string}> {
  return Object.entries(SAMPLE_TEAM_NAMES).map(([teamNumber, teamName]) => ({
    teamNumber,
    teamName
  }));
}

/**
 * Generate team statistics object with default values
 * @param teamNumber The team number
 * @param teamName The team name
 * @returns A team statistics object with default values
 */
export function generateDefaultTeamStatistics(teamNumber: string, teamName: string) {
  return {
    teamNumber,
    teamName,
    matchCount: 0,
    averages: {
      defense: 0,
      avoidingDefense: 0,
      scoringAlgae: 0,
      scoringCorals: 0,
      autonomous: 0,
      drivingSkill: 0,
      overall: 0
    },
    climbingStats: {
      noData: 0,
      none: 0,
      park: 0,
      shallow: 0,
      deep: 0
    }
  };
}
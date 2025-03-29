/**
 * Test Data Generator
 * This module provides utilities to generate random testing data
 * Only accessible with a secret key for development purposes
 */

import { addMatchEntry } from './db';
import type { MatchEntry } from './types';

// Secret key for accessing test data generation - hardcoded for simplicity
// In a real application, this would be stored securely
const SECRET_KEY = '270773';

// Sample team data
const FRC_TEAMS = [
  { number: '254', name: 'The Cheesy Poofs' },
  { number: '1114', name: 'Simbotics' },
  { number: '118', name: 'Robonauts' },
  { number: '2056', name: 'OP Robotics' },
  { number: '1678', name: 'Citrus Circuits' },
  { number: '33', name: 'Killer Bees' },
  { number: '195', name: 'CyberKnights' },
  { number: '3310', name: 'Black Hawk Robotics' },
  { number: '148', name: 'Robowranglers' },
  { number: '5406', name: 'Celt-X' },
  { number: '971', name: 'Spartan Robotics' },
  { number: '973', name: 'Greybots' },
  { number: '610', name: 'Crescent Coyotes' },
  { number: '1538', name: 'The Holy Cows' },
  { number: '2767', name: 'Stryke Force' },
  { number: '4613', name: 'Barker Redbacks' },
  { number: '5895', name: 'Peddie School Robotics' },
  { number: '7457', name: 'suPURDUEper Robotics' },
  { number: '3707', name: 'Brighton TechnoDogs' },
  { number: '4613', name: 'Barker Redbacks' },
  { number: '1323', name: 'MadTown Robotics' },
  { number: '225', name: 'TechFire' },
  { number: '3539', name: 'Byting Bulldogs' },
  { number: '3132', name: 'Thunder Down Under' },
  { number: '125', name: 'NUTRONs' },
];

/**
 * Generate a random number between min and max (inclusive)
 */
function getRandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Generate a random team from the FRC_TEAMS list
 */
function getRandomTeam() {
  return FRC_TEAMS[Math.floor(Math.random() * FRC_TEAMS.length)];
}

/**
 * Generate a random alliance color
 */
function getRandomAlliance(): 'red' | 'blue' {
  return Math.random() > 0.5 ? 'red' : 'blue';
}

/**
 * Generate a random match type
 */
function getRandomMatchType(): string {
  const types = ['Practice', 'Qualification', 'Quarterfinal', 'Semifinal', 'Final'];
  return types[Math.floor(Math.random() * types.length)];
}

/**
 * Generate a random climbing position
 */
function getRandomClimbing(): string {
  const positions = ['None', 'Park', 'Shallow', 'Deep', 'No Data'];
  return positions[Math.floor(Math.random() * positions.length)];
}

/**
 * Generate a random comment for a specific category
 */
function generateComment(category: string, score: number): string {
  const comments = {
    'coral': [
      'Consistent and efficient in coral placement',
      'Struggle with coral placement accuracy',
      'Fast but sometimes careless with coral',
      'Excellent coral stacking strategy',
      'Prioritizes lower level reef positions',
      'Focuses on high reef scoring',
      'Great vision system for coral identification',
      'Very deliberate and slow coral placement',
      'Excellent coral acquisition',
      'Limited coral storage capacity',
    ],
    'algae': [
      'Rapid algae collection and scoring',
      'Inefficient algae scoring mechanism',
      'Great algae targeting into processor',
      'Struggles with algae acquisition',
      'Strategic with algae timing',
      'Seems to ignore algae opportunities',
      'Excellent endgame algae dump into net',
      'Issues with algae jamming',
      'Balanced focus on both scoring elements',
      'Misses most algae throws',
    ],
    'defense': [
      'Effectively blocks opponent paths',
      'No defensive capability observed',
      'Aggressively pins opponents',
      'Good defense without fouls',
      'Focuses on defense during endgame',
      'Not built for defensive play',
      'Excellent positional defense',
      'Gets too aggressive, causing penalties',
      'Tactical defense but maintains distance',
      'Poor defensive positioning',
    ],
    'driving': [
      'Exceptional driver awareness',
      'Hesitant driving, especially in traffic',
      'Fast and fluid movement across field',
      'Seems to have control issues',
      'Precise and calculated driving',
      'Aggressive but controlled driving',
      'Struggles with field obstacles',
      'Avoids contact even when beneficial',
      'Slow but steady control',
      'Excellent maneuverability in tight spaces',
    ],
    'autonomous': [
      'Reliable autonomous scoring',
      'Inconsistent path execution',
      'Multiple scoring actions in auto',
      'Basic mobility only',
      'Advanced pathing with object detection',
      'Sometimes misses starting configuration',
      'Adapts to alliance partner movements',
      'No autonomous capability observed',
      'Occasionally interferes with partners',
      'Perfect execution of complex routine',
    ],
  };

  const categoryComments = comments[category as keyof typeof comments] || [];
  if (categoryComments.length === 0) return '';

  // Select comment based on score and random factor
  const index = Math.min(
    Math.floor((score / 10) * categoryComments.length + getRandomInt(-1, 1)),
    categoryComments.length - 1
  );
  return categoryComments[Math.max(0, index)];
}

/**
 * Generate climbing-specific comments
 */
function generateClimbingComment(climbing: string): string {
  const comments: Record<string, string[]> = {
    'None': [
      'Did not attempt to climb',
      'Failed climb attempt',
      'Focused on scoring instead of climbing',
      'Climbing mechanism appeared damaged',
      'Ran out of time for climb',
    ],
    'Park': [
      'Quick park for safe points',
      'Last second park',
      'Parked after failed climb attempt',
      'Strategic decision to park only',
      'Parked to avoid defense',
    ],
    'Shallow': [
      'Clean shallow climb',
      'Fast shallow climb',
      'Consistent shallow climber',
      'Attempted deep but settled for shallow',
      'Reliable shallow climbing mechanism',
    ],
    'Deep': [
      'Impressive deep climb',
      'Very fast deep climb capability',
      'Consistent deep climber',
      'Specialized for deep climbing',
      'Stable deep climbing mechanism',
    ],
    'No Data': [
      'Unable to observe climbing attempt',
      'View blocked during endgame',
      'Not present during endgame',
      'Disconnected before endgame',
      'No data captured for climbing',
    ],
  };

  const options = comments[climbing] || comments['No Data'];
  return options[Math.floor(Math.random() * options.length)];
}

/**
 * Generate a random match entry
 */
function generateMatchEntry(): Omit<MatchEntry, 'id'> {
  const team = getRandomTeam();
  const alliance = getRandomAlliance();
  const matchType = getRandomMatchType();
  const climbing = getRandomClimbing();
  
  // Generate random scores (1-7 scale)
  const defense = getRandomInt(1, 7);
  const avoidingDefense = getRandomInt(1, 7);
  const scoringAlgae = getRandomInt(1, 7);
  const scoringCorals = getRandomInt(1, 7);
  const autonomous = getRandomInt(1, 7);
  const drivingSkill = getRandomInt(1, 7);
  const overall = getRandomInt(
    Math.max(1, Math.floor((defense + avoidingDefense + scoringAlgae + scoringCorals + autonomous + drivingSkill) / 6) - 1),
    Math.min(7, Math.ceil((defense + avoidingDefense + scoringAlgae + scoringCorals + autonomous + drivingSkill) / 6) + 1)
  );

  const matchNumber = getRandomInt(1, 100);
  const timestamp = Date.now() - getRandomInt(0, 7 * 24 * 60 * 60 * 1000); // Random time in the last week

  return {
    team: team.number,
    matchType,
    matchNumber,
    alliance,
    
    // Performance ratings
    defense,
    defenseComment: generateComment('defense', defense * 10/7),
    avoidingDefense,
    avoidingDefenseComment: generateComment('defense', avoidingDefense * 10/7),
    scoringAlgae,
    scoringAlgaeComment: generateComment('algae', scoringAlgae * 10/7),
    scoringCorals,
    scoringCoralsComment: generateComment('coral', scoringCorals * 10/7),
    autonomous,
    autonomousComment: generateComment('autonomous', autonomous * 10/7),
    drivingSkill,
    drivingSkillComment: generateComment('driving', drivingSkill * 10/7),
    
    // Climbing
    climbing,
    climbingComment: generateClimbingComment(climbing),
    
    // Overall impression
    overall,
    comments: `Overall: ${overall}/7. ${generateComment('coral', scoringCorals * 10/7)} ${generateComment('algae', scoringAlgae * 10/7)}`,
    
    // Metadata
    timestamp,
    syncStatus: Math.random() > 0.7 ? 'pending' : 'synced',
  };
}

/**
 * Generate and store a specified number of random match entries
 */
export async function generateRandomData(
  key: string,
  count: number = 20
): Promise<{ success: boolean; message: string }> {
  if (!isValidKey(key)) {
    return {
      success: false,
      message: 'Invalid key. Access denied.',
    };
  }

  try {
    const entries: number[] = [];
    const teams = new Set<string>();

    // Generate and store match entries
    for (let i = 0; i < count; i++) {
      const entry = generateMatchEntry();
      const id = await addMatchEntry(entry);
      entries.push(id);
      teams.add(entry.team);
    }

    return {
      success: true,
      message: `Successfully generated ${count} match entries across ${Array.from(teams).length} teams.`,
    };
  } catch (error) {
    console.error('Error generating test data:', error);
    return {
      success: false,
      message: `Failed to generate data: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

/**
 * Check if the provided key is valid
 */
export function isValidKey(key: string): boolean {
  return key === SECRET_KEY;
}
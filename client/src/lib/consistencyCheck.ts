/**
 * Utility functions for checking the consistency of scouting ratings
 */

export type RatingFields = {
  defense?: number;
  avoidingDefense?: number;
  scoringAlgae?: number;
  scoringCorals?: number;
  autonomous?: number;
  drivingSkill?: number;
  overall?: number;
  // Add any other rating fields here
};

export interface ConsistencyWarning {
  message: string;
  severity: 'low' | 'medium' | 'high';
}

/**
 * Check if rating values are logically consistent
 * @param ratings Object containing all rating values
 * @returns Array of consistency warnings, empty if consistent
 */
export function checkRatingConsistency(ratings: RatingFields): ConsistencyWarning[] {
  const warnings: ConsistencyWarning[] = [];
  
  // Skip check if we don't have enough ratings
  const ratingValues = Object.values(ratings).filter(v => v !== undefined);
  if (ratingValues.length < 2) return warnings;
  
  // Get individual ratings (excluding overall)
  const individualRatings = Object.entries(ratings)
    .filter(([key]) => key !== 'overall')
    .map(([_, value]) => value || 0);
    
  const totalIndividualRatings = individualRatings.length;
  
  // Calculate average of individual ratings
  const avgRating = individualRatings.reduce((sum, value) => sum + value, 0) / 
    (individualRatings.length || 1);
  
  // Check 1: Significant difference between average rating and overall rating
  if (ratings.overall !== undefined && totalIndividualRatings >= 3) {
    const difference = Math.abs(avgRating - ratings.overall);
    
    // More than 1.5 points difference between average and overall
    if (difference > 1.5) {
      let severity: 'low' | 'medium' | 'high' = 'medium';
      
      // Adjust severity based on the size of the difference
      if (difference >= 2.5) {
        severity = 'high';
      } else if (difference <= 1.8) {
        severity = 'low';
      }
      
      warnings.push({
        message: `The overall rating (${ratings.overall}) differs from the average of individual ratings (${avgRating.toFixed(1)}) by ${difference.toFixed(1)} points`,
        severity
      });
    }
  }
  
  // Check 2: High variance between categories without justification
  if (individualRatings.length >= 3) {
    const max = Math.max(...individualRatings);
    const min = Math.min(...individualRatings);
    
    if (max - min >= 5) {
      warnings.push({
        message: "There's a large difference between your highest and lowest category ratings (5+ points)",
        severity: 'medium'
      });
    }
  }
  
  return warnings;
}

/**
 * Get an overall consistency score (0-10) based on warnings
 * @param warnings Array of consistency warnings
 * @returns Score between 0-10, higher is more consistent
 */
export function getConsistencyScore(warnings: ConsistencyWarning[]): number {
  if (warnings.length === 0) return 10;
  
  const severityWeights = {
    'low': 1,
    'medium': 2,
    'high': 4
  };
  
  const weightedSum = warnings.reduce((sum, warning) => 
    sum + severityWeights[warning.severity], 0);
  
  // Calculate score: 10 - weighted sum, minimum 0
  return Math.max(0, 10 - weightedSum);
}
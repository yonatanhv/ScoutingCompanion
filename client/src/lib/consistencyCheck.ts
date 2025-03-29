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
  
  // Check 1: High ratings with low overall
  const highIndividualRatings = Object.entries(ratings)
    .filter(([key, value]) => key !== 'overall' && value !== undefined && value >= 6)
    .length;
    
  const totalIndividualRatings = Object.entries(ratings)
    .filter(([key]) => key !== 'overall').length;
  
  // If most ratings are high (≥6) but overall is low (≤2)
  if (highIndividualRatings >= totalIndividualRatings * 0.7 && 
      ratings.overall !== undefined && ratings.overall <= 2) {
    warnings.push({
      message: "Most individual ratings are high but overall rating is very low",
      severity: 'high'
    });
  }
  
  // Check 2: Low ratings with high overall
  const lowIndividualRatings = Object.entries(ratings)
    .filter(([key, value]) => key !== 'overall' && value !== undefined && value <= 2)
    .length;
  
  // If most ratings are low (≤2) but overall is high (≥6)
  if (lowIndividualRatings >= totalIndividualRatings * 0.7 && 
      ratings.overall !== undefined && ratings.overall >= 6) {
    warnings.push({
      message: "Most individual ratings are low but overall rating is very high",
      severity: 'high'
    });
  }
  
  // Check 3: High variance between categories without justification
  const ratingNums = Object.entries(ratings)
    .filter(([key]) => key !== 'overall')
    .map(([_, value]) => value || 0);
  
  if (ratingNums.length >= 3) {
    const max = Math.max(...ratingNums);
    const min = Math.min(...ratingNums);
    
    if (max - min >= 5) {
      warnings.push({
        message: "Rating categories have very high variance (difference of 5+)",
        severity: 'medium'
      });
    }
  }
  
  // Check 4: Climbing level inconsistent with overall rating
  // To be implemented if climbing data available
  
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
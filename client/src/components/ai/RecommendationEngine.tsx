import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TeamStatistics, Alliance, MatchEntry } from '@/lib/types';
import { Loader2, Award, Shield, Zap, ArrowUpCircle, BrainCircuit, MessageSquare } from 'lucide-react';
import { vibrationSuccess } from '@/lib/haptics';
import { getTeamMatches } from '@/lib/db';

type RecommendationEngineProps = {
  teams: TeamStatistics[];
  selectedTeams: string[];
  onRecommendTeam: (teamNumber: string) => void;
  alliance: Alliance | null;
};

type Recommendation = {
  teamNumber: string;
  teamName: string;
  score: number;
  reasons: string[];
  role: 'defense' | 'offense' | 'balanced' | 'climbing' | 'autonomous';
  hasComments?: boolean;
};

export function RecommendationEngine({ 
  teams, 
  selectedTeams, 
  onRecommendTeam,
  alliance
}: RecommendationEngineProps) {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Reset recommendations when selected teams change
    setRecommendations([]);
  }, [selectedTeams]);

  const generateRecommendations = async () => {
    setIsLoading(true);
    vibrationSuccess();
    
    const availableTeams = teams.filter(team => 
      !selectedTeams.includes(team.teamNumber) && team.matchCount > 0
    );

    if (availableTeams.length === 0) {
      setRecommendations([]);
      setIsLoading(false);
      return;
    }

    // Get the current alliance stats if it exists
    const currentAllianceStrengths = alliance ? determineAllianceStrengths(alliance) : {};
    const currentAllianceWeaknesses = alliance ? determineAllianceWeaknesses(alliance) : {};

    // Create a map to hold match comments for each team
    const teamCommentsMap = new Map<string, string[]>();
    
    // Fetch match data with comments for each available team
    for (const team of availableTeams) {
      try {
        const matches = await getTeamMatches(team.teamNumber);
        const relevantComments: string[] = [];
        
        // Extract relevant comments from matches
        matches.forEach(match => {
          // Include the overall match comments if present
          if (match.comments && match.comments.trim()) {
            relevantComments.push(match.comments.trim());
          }
          
          // Add specific category comments based on team's role
          if (team.averages.defense > 5.0 && match.defenseComment) {
            relevantComments.push(match.defenseComment);
          }
          if (team.averages.autonomous > 5.0 && match.autonomousComment) {
            relevantComments.push(match.autonomousComment);
          }
          if (team.averages.scoringCorals > 5.0 && match.scoringCoralsComment) {
            relevantComments.push(match.scoringCoralsComment);
          }
          if (team.averages.scoringAlgae > 5.0 && match.scoringAlgaeComment) {
            relevantComments.push(match.scoringAlgaeComment);
          }
          if (match.climbing === 'deep' && match.climbingComment) {
            relevantComments.push(match.climbingComment);
          }
        });
        
        // Store unique comments for this team
        const uniqueComments = Array.from(new Set(relevantComments))
          .filter(comment => comment.length > 3); // Filter out very short comments
        
        if (uniqueComments.length > 0) {
          teamCommentsMap.set(team.teamNumber, uniqueComments);
        }
      } catch (error) {
        console.error(`Error fetching match data for team ${team.teamNumber}:`, error);
      }
    }

    // Score each team based on how well they complement the existing alliance
    const scoredTeams = await Promise.all(availableTeams.map(async (team) => {
      const role = determineTeamRole(team);
      const baseScore = calculateBaseScore(team);
      
      // Adjust score based on alliance needs
      let adjustedScore = baseScore;
      let reasons: string[] = [];

      // If there's an existing alliance, adjust scores based on needs
      if (alliance && Object.keys(currentAllianceWeaknesses).length > 0) {
        const { adjustedScore: newScore, reasons: scoreReasons } = adjustScoreBasedOnAlliance(
          team, 
          baseScore, 
          currentAllianceStrengths, 
          currentAllianceWeaknesses
        );
        adjustedScore = newScore;
        reasons = scoreReasons;
      } else {
        // Just add basic reasons if no alliance exists yet
        reasons = generateBasicReasons(team, role);
      }
      
      // Add a relevant comment from match data if available
      const teamComments = teamCommentsMap.get(team.teamNumber);
      if (teamComments && teamComments.length > 0) {
        // Select a comment that seems most relevant or insightful
        const selectedComment = teamComments[0]; // Just take the first one for now
        
        // Add as an additional reason if we have space
        if (reasons.length < 3) {
          reasons.push(`Scout note: "${selectedComment}"`);
        }
      }

      return {
        teamNumber: team.teamNumber,
        teamName: team.teamName || `Team ${team.teamNumber}`,
        score: adjustedScore,
        reasons,
        role,
        hasComments: !!teamComments?.length
      };
    }));

    // Sort by score (highest first) and take top 3
    const topRecommendations = scoredTeams
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);

    setRecommendations(topRecommendations);
    setIsLoading(false);
    setIsVisible(true);
  };

  const determineTeamRole = (team: TeamStatistics): 'defense' | 'offense' | 'balanced' | 'climbing' | 'autonomous' => {
    const { averages } = team;
    
    // Determine the primary strength of the team
    if (averages.defense > 5.5) return 'defense';
    if ((averages.scoringCorals + averages.scoringAlgae) / 2 > 5.5) return 'offense';
    if (team.climbingStats.deep > Math.max(team.climbingStats.none, team.climbingStats.park, team.climbingStats.shallow)) return 'climbing';
    if (averages.autonomous > 5.5) return 'autonomous';
    
    return 'balanced';
  };

  const calculateBaseScore = (team: TeamStatistics): number => {
    const { averages, matchCount } = team;
    
    // Base score is weighted average of key metrics
    const baseScore = (
      averages.overall * 0.3 + 
      averages.autonomous * 0.15 + 
      averages.drivingSkill * 0.1 + 
      ((averages.scoringCorals + averages.scoringAlgae) / 2) * 0.25 + 
      averages.defense * 0.1 +
      averages.avoidingDefense * 0.1
    );
    
    // Adjust for data confidence based on match count
    const matchCountFactor = Math.min(matchCount / 5, 1); // Max out at 5 matches
    
    return baseScore * matchCountFactor;
  };

  const determineAllianceStrengths = (alliance: Alliance): Record<string, number> => {
    const { combinedAverages } = alliance;
    const strengths: Record<string, number> = {};
    
    // Consider something a strength if it's over 5.0 (on 7 point scale)
    if (combinedAverages.autonomous > 5.0) strengths.autonomous = combinedAverages.autonomous;
    if (combinedAverages.defense > 5.0) strengths.defense = combinedAverages.defense;
    if (combinedAverages.drivingSkill > 5.0) strengths.drivingSkill = combinedAverages.drivingSkill;
    if (combinedAverages.scoringCorals > 5.0) strengths.scoringCorals = combinedAverages.scoringCorals;
    if (combinedAverages.scoringAlgae > 5.0) strengths.scoringAlgae = combinedAverages.scoringAlgae;
    if (combinedAverages.avoidingDefense > 5.0) strengths.avoidingDefense = combinedAverages.avoidingDefense;
    if (alliance.climbSuccessRate > 0.7) strengths.climbing = alliance.climbSuccessRate * 7; // Convert to same scale
    
    return strengths;
  };

  const determineAllianceWeaknesses = (alliance: Alliance): Record<string, number> => {
    const { combinedAverages } = alliance;
    const weaknesses: Record<string, number> = {};
    
    // Consider something a weakness if it's under 4.0 (on 7 point scale)
    if (combinedAverages.autonomous < 4.0) weaknesses.autonomous = combinedAverages.autonomous;
    if (combinedAverages.defense < 4.0) weaknesses.defense = combinedAverages.defense;
    if (combinedAverages.drivingSkill < 4.0) weaknesses.drivingSkill = combinedAverages.drivingSkill;
    if (combinedAverages.scoringCorals < 4.0) weaknesses.scoringCorals = combinedAverages.scoringCorals;
    if (combinedAverages.scoringAlgae < 4.0) weaknesses.scoringAlgae = combinedAverages.scoringAlgae;
    if (combinedAverages.avoidingDefense < 4.0) weaknesses.avoidingDefense = combinedAverages.avoidingDefense;
    if (alliance.climbSuccessRate < 0.5) weaknesses.climbing = alliance.climbSuccessRate * 7; // Convert to same scale
    
    return weaknesses;
  };

  const adjustScoreBasedOnAlliance = (
    team: TeamStatistics, 
    baseScore: number,
    allianceStrengths: Record<string, number>,
    allianceWeaknesses: Record<string, number>
  ): { adjustedScore: number, reasons: string[] } => {
    let adjustedScore = baseScore;
    const reasons: string[] = [];
    
    // Check if team addresses alliance weaknesses
    Object.entries(allianceWeaknesses).forEach(([weakness, value]) => {
      let teamStrength = 0;
      
      switch(weakness) {
        case 'autonomous':
          teamStrength = team.averages.autonomous;
          if (teamStrength > 5.0) {
            adjustedScore += 1.5;
            reasons.push(`Strong autonomous (${teamStrength.toFixed(1)}/7) addresses alliance weakness`);
          }
          break;
        case 'defense':
          teamStrength = team.averages.defense;
          if (teamStrength > 5.0) {
            adjustedScore += 1.5;
            reasons.push(`Strong defense capability (${teamStrength.toFixed(1)}/7) addresses alliance need`);
          }
          break;
        case 'scoringCorals':
          teamStrength = team.averages.scoringCorals;
          if (teamStrength > 5.0) {
            adjustedScore += 1.3;
            reasons.push(`Effective at scoring corals (${teamStrength.toFixed(1)}/7)`);
          }
          break;
        case 'scoringAlgae':
          teamStrength = team.averages.scoringAlgae;
          if (teamStrength > 5.0) {
            adjustedScore += 1.3;
            reasons.push(`Effective at scoring algae (${teamStrength.toFixed(1)}/7)`);
          }
          break;
        case 'avoidingDefense':
          teamStrength = team.averages.avoidingDefense;
          if (teamStrength > 5.0) {
            adjustedScore += 1.0;
            reasons.push(`Good at avoiding defensive play (${teamStrength.toFixed(1)}/7)`);
          }
          break;
        case 'climbing':
          // Check climbing success based on climbing stats
          const deepRate = team.climbingStats.deep / team.matchCount;
          if (deepRate > 0.6) {
            adjustedScore += 1.8;
            reasons.push(`Reliable deep climbing (${Math.round(deepRate * 100)}% success rate)`);
          }
          break;
      }
    });
    
    // If we don't have any specific recommendations yet, add some generic ones
    if (reasons.length === 0) {
      const role = determineTeamRole(team);
      reasons.push(...generateBasicReasons(team, role));
    }
    
    // Cap the adjusted score at 10
    return { 
      adjustedScore: Math.min(adjustedScore, 10), 
      reasons
    };
  };

  const generateBasicReasons = (team: TeamStatistics, role: string): string[] => {
    const reasons: string[] = [];
    
    // Add basic strength reasons
    if (team.averages.overall > 5.5) {
      reasons.push(`Strong overall performer (${team.averages.overall.toFixed(1)}/7)`);
    }
    
    // Add role-specific reason
    switch(role) {
      case 'defense':
        reasons.push(`Specialized in defensive play (${team.averages.defense.toFixed(1)}/7)`);
        break;
      case 'offense':
        const scoringAvg = (team.averages.scoringCorals + team.averages.scoringAlgae) / 2;
        reasons.push(`Offensive powerhouse (${scoringAvg.toFixed(1)}/7 scoring)`);
        break;
      case 'climbing':
        const deepRate = team.climbingStats.deep / team.matchCount;
        reasons.push(`Reliable deep climber (${Math.round(deepRate * 100)}% success)`);
        break;
      case 'autonomous':
        reasons.push(`Autonomous specialist (${team.averages.autonomous.toFixed(1)}/7)`);
        break;
      case 'balanced':
        reasons.push(`Well-balanced capabilities across all areas`);
        break;
    }
    
    // Add match experience as a reason if they have a lot of matches
    if (team.matchCount > 8) {
      reasons.push(`Extensive match data (${team.matchCount} matches)`);
    }
    
    return reasons.slice(0, 3); // Limit to top 3 reasons
  };

  const getRoleIcon = (role: string) => {
    switch(role) {
      case 'defense': return <Shield className="h-4 w-4 mr-1" />;
      case 'offense': return <Zap className="h-4 w-4 mr-1" />;
      case 'climbing': return <ArrowUpCircle className="h-4 w-4 mr-1" />;
      case 'autonomous': return <BrainCircuit className="h-4 w-4 mr-1" />;
      default: return <Award className="h-4 w-4 mr-1" />;
    }
  };

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold flex items-center">
          <BrainCircuit className="h-5 w-5 mr-2" />
          Alliance Advisor
        </h3>
        <Button 
          onClick={generateRecommendations} 
          variant="outline" 
          size="sm"
          disabled={isLoading || selectedTeams.length >= 3}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Analyzing teams...
            </>
          ) : (
            <>Get Recommendations</>
          )}
        </Button>
      </div>
      
      {isVisible && recommendations.length > 0 && (
        <div className="space-y-3 mt-4">
          <CardDescription>
            Based on your current alliance selection and team performance data, 
            here are the recommended teams that would complement your alliance:
          </CardDescription>
          
          <div className="grid grid-cols-1 gap-3 mt-2">
            {recommendations.map((rec) => (
              <Card key={rec.teamNumber} className="overflow-hidden">
                <CardHeader className="py-3 px-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-base flex items-center">
                        Team {rec.teamNumber}
                        {rec.hasComments && (
                          <MessageSquare className="h-3.5 w-3.5 ml-1.5 text-muted-foreground" />
                        )}
                      </CardTitle>
                      <CardDescription className="text-sm truncate">
                        {rec.teamName}
                      </CardDescription>
                    </div>
                    <Badge className="flex items-center" variant="outline">
                      {getRoleIcon(rec.role)}
                      {rec.role.charAt(0).toUpperCase() + rec.role.slice(1)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="py-2 px-4">
                  <div className="text-xs space-y-1">
                    {rec.reasons.map((reason, i) => (
                      <div key={i} className="flex items-start">
                        <span className="mr-1">•</span>
                        <span>{reason}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
                <CardFooter className="py-2 px-4 flex justify-between items-center bg-muted/30">
                  <div className="text-sm font-medium">
                    Match: {rec.score.toFixed(1)}/10
                  </div>
                  <Button 
                    onClick={() => {
                      onRecommendTeam(rec.teamNumber);
                      vibrationSuccess();
                    }} 
                    size="sm" 
                    variant="default"
                  >
                    Add to Alliance
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      )}
      
      {isVisible && recommendations.length === 0 && !isLoading && (
        <Card className="bg-muted/40">
          <CardContent className="py-6">
            <p className="text-center text-muted-foreground">
              No suitable recommendations found based on available team data.
              Try selecting different teams or add more scouting data.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
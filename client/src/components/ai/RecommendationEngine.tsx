import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Lightbulb, RotateCw, Brain, ChevronRight } from 'lucide-react';
import { TeamStatistics, Alliance } from '@/lib/types';
import { formSubmitVibration } from '@/lib/haptics';

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
};

export function RecommendationEngine({ 
  teams, 
  selectedTeams, 
  onRecommendTeam,
  alliance
}: RecommendationEngineProps) {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [focusArea, setFocusArea] = useState<'balanced' | 'offense' | 'defense' | 'climbing' | 'autonomous'>('balanced');

  useEffect(() => {
    // Clear recommendations when selected teams change
    setRecommendations([]);
  }, [selectedTeams]);

  // Function to determine team's primary role based on their stats
  const determineTeamRole = (team: TeamStatistics): 'defense' | 'offense' | 'balanced' | 'climbing' | 'autonomous' => {
    const { averages } = team;
    
    // Check if team has strong autonomous
    if (averages.autonomous > 5.5) {
      return 'autonomous';
    }
    
    // Check if team is good at climbing (we're looking at the climbing stats)
    const totalClimbs = team.climbingStats.shallow + team.climbingStats.deep;
    const totalAttempts = totalClimbs + team.climbingStats.none + team.climbingStats.park;
    const climbSuccessRate = totalAttempts > 0 ? totalClimbs / totalAttempts : 0;
    
    if (climbSuccessRate > 0.7 && (team.climbingStats.shallow > 1 || team.climbingStats.deep > 1)) {
      return 'climbing';
    }
    
    // Check if team is defensive-focused
    if (averages.defense > 5 && averages.avoidingDefense < 4.5) {
      return 'defense';
    }
    
    // Check if team is offense-focused (scoring)
    if ((averages.scoringAlgae > 5 || averages.scoringCorals > 5) && averages.drivingSkill > 4.5) {
      return 'offense';
    }
    
    // Default to balanced
    return 'balanced';
  };

  // Function to identify gaps in the current alliance
  const identifyAllianceGaps = (currentAlliance: Alliance | null): ('defense' | 'offense' | 'climbing' | 'autonomous')[] => {
    if (!currentAlliance || currentAlliance.teams.length === 0) {
      return ['defense', 'offense', 'climbing', 'autonomous']; // All gaps
    }
    
    const gaps: ('defense' | 'offense' | 'climbing' | 'autonomous')[] = [];
    
    // Check if alliance lacks defense
    if (currentAlliance.combinedAverages.defense < 4.5) {
      gaps.push('defense');
    }
    
    // Check if alliance lacks offense
    const offenseScore = (currentAlliance.combinedAverages.scoringAlgae + currentAlliance.combinedAverages.scoringCorals) / 2;
    if (offenseScore < 4.5) {
      gaps.push('offense');
    }
    
    // Check if alliance lacks climbing capability
    if (currentAlliance.climbSuccessRate < 0.5) {
      gaps.push('climbing');
    }
    
    // Check if alliance lacks autonomous
    if (currentAlliance.combinedAverages.autonomous < 4.5) {
      gaps.push('autonomous');
    }
    
    return gaps;
  };

  // Generate team recommendations
  const generateRecommendations = () => {
    formSubmitVibration();
    setIsGenerating(true);
    
    // Simulate AI thinking time
    setTimeout(() => {
      try {
        // Filter out already selected teams
        const availableTeams = teams.filter(team => !selectedTeams.includes(team.teamNumber));
        
        if (availableTeams.length === 0) {
          setRecommendations([]);
          setIsGenerating(false);
          return;
        }
        
        // Identify gaps in current alliance
        const allianceGaps = identifyAllianceGaps(alliance);
        
        // Calculate recommendation scores for each available team
        const teamRecommendations: Recommendation[] = availableTeams.map(team => {
          const teamRole = determineTeamRole(team);
          const { averages, teamNumber, teamName } = team;
          
          // Base score calculation
          let score = averages.overall * 0.6; // 60% weight on overall performance
          
          // Bonus points for filling alliance gaps
          const reasons: string[] = [];
          
          if (allianceGaps.includes('defense') && teamRole === 'defense') {
            score += 1.5;
            reasons.push('Strengthens alliance defense capabilities');
          }
          
          if (allianceGaps.includes('offense') && teamRole === 'offense') {
            score += 1.5;
            reasons.push('Adds scoring power to the alliance');
          }
          
          if (allianceGaps.includes('climbing') && teamRole === 'climbing') {
            score += 1.5;
            reasons.push('Improves alliance endgame climbing potential');
          }
          
          if (allianceGaps.includes('autonomous') && teamRole === 'autonomous') {
            score += 1.5;
            reasons.push('Enhances alliance autonomous performance');
          }
          
          // Add team-specific insights based on their stats
          if (averages.defense > 5.5) {
            reasons.push('Strong defensive capabilities');
          }
          
          if (averages.avoidingDefense > 5.5) {
            reasons.push('Effective at handling opponent defense');
          }
          
          if (averages.scoringAlgae > 5.5) {
            reasons.push('Excellent at scoring Algae');
          }
          
          if (averages.scoringCorals > 5.5) {
            reasons.push('Excellent at scoring Corals');
          }
          
          if (averages.autonomous > 5.5) {
            reasons.push('Strong autonomous performance');
          }
          
          // Climbing specific reasons
          const climbsDeep = team.climbingStats.deep > 0;
          const climbsShallow = team.climbingStats.shallow > 0;
          
          if (climbsDeep && team.climbingStats.deep > team.matchCount * 0.6) {
            reasons.push('Consistently achieves Deep climbing');
            score += 0.8;
          } else if (climbsShallow && team.climbingStats.shallow > team.matchCount * 0.6) {
            reasons.push('Consistently achieves Shallow climbing');
            score += 0.4;
          }
          
          // Consistency is important
          if (team.matchCount > 5) {
            reasons.push(`Reliable data from ${team.matchCount} matches`);
            score += 0.3;
          }
          
          // If we specifically want to focus on a certain area, prioritize that
          if (teamRole === focusArea) {
            score += 1.0;
            reasons.push(`Aligns with current focus on ${focusArea} capabilities`);
          }
          
          return {
            teamNumber,
            teamName,
            score: parseFloat(score.toFixed(1)),
            reasons: reasons.slice(0, 4), // Limit to top 4 reasons
            role: teamRole
          };
        });
        
        // Sort by score (descending)
        const sortedRecommendations = teamRecommendations
          .sort((a, b) => b.score - a.score)
          .slice(0, 5); // Top 5 recommendations
        
        setRecommendations(sortedRecommendations);
      } catch (error) {
        console.error('Error generating recommendations:', error);
        setRecommendations([]);
      } finally {
        setIsGenerating(false);
      }
    }, 1200); // Simulate processing time
  };

  const getRoleColor = (role: string) => {
    const colors: Record<string, string> = {
      'defense': 'bg-blue-100 text-blue-800 border-blue-300',
      'offense': 'bg-red-100 text-red-800 border-red-300',
      'climbing': 'bg-green-100 text-green-800 border-green-300',
      'autonomous': 'bg-purple-100 text-purple-800 border-purple-300',
      'balanced': 'bg-gray-100 text-gray-800 border-gray-300'
    };
    
    return colors[role] || colors.balanced;
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-lg flex items-center">
              <Brain className="mr-2 h-5 w-5 text-primary" />
              AI Recommendation Engine
            </CardTitle>
            <CardDescription>
              Get contextual team recommendations for your alliance
            </CardDescription>
          </div>
          
          <div className="flex gap-2">
            <select 
              className="border border-border rounded-md px-2 py-1 text-sm bg-background"
              value={focusArea}
              onChange={(e) => setFocusArea(e.target.value as any)}
            >
              <option value="balanced">Balanced</option>
              <option value="offense">Offensive</option>
              <option value="defense">Defensive</option>
              <option value="climbing">Climbing</option>
              <option value="autonomous">Autonomous</option>
            </select>
            
            <Button 
              size="sm" 
              onClick={generateRecommendations}
              disabled={isGenerating}
              className="flex items-center space-x-1"
            >
              {isGenerating ? (
                <RotateCw className="h-4 w-4 animate-spin" />
              ) : (
                <Lightbulb className="h-4 w-4" />
              )}
              <span>Generate</span>
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {isGenerating ? (
          <div className="space-y-3">
            <div className="flex items-center space-x-4">
              <Skeleton className="h-12 w-12 rounded-md" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-[250px]" />
                <Skeleton className="h-4 w-[200px]" />
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Skeleton className="h-12 w-12 rounded-md" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-[250px]" />
                <Skeleton className="h-4 w-[200px]" />
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Skeleton className="h-12 w-12 rounded-md" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-[250px]" />
                <Skeleton className="h-4 w-[200px]" />
              </div>
            </div>
          </div>
        ) : recommendations.length > 0 ? (
          <ScrollArea className="h-[320px] pr-4">
            <div className="space-y-4">
              {recommendations.map((rec) => (
                <div 
                  key={rec.teamNumber} 
                  className="border border-border rounded-lg p-3 hover:bg-accent transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-lg">{rec.teamNumber}</span>
                        <span className="text-md">{rec.teamName}</span>
                        <Badge className={`ml-1 ${getRoleColor(rec.role)}`}>
                          {rec.role.charAt(0).toUpperCase() + rec.role.slice(1)}
                        </Badge>
                      </div>
                      
                      <div className="mt-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1 mb-1">
                          <span className="font-semibold">Match Score:</span>
                          <span className={`font-medium ${rec.score > 7 ? 'text-green-600' : rec.score > 5 ? 'text-amber-600' : 'text-gray-600'}`}>
                            {rec.score}/10
                          </span>
                        </div>
                        
                        <ul className="list-disc pl-5 space-y-0.5">
                          {rec.reasons.map((reason, idx) => (
                            <li key={idx}>{reason}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                    
                    <Button 
                      size="sm" 
                      className="mt-1"
                      onClick={() => {
                        formSubmitVibration();
                        onRecommendTeam(rec.teamNumber);
                      }}
                    >
                      <span className="mr-1">Add</span>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Brain className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">No Recommendations</h3>
            <p className="text-muted-foreground max-w-md">
              Generate team recommendations based on your current alliance composition and gaps.
              {selectedTeams.length > 0 ? 
                ' Our AI will analyze performance data to suggest complementary teams.' : 
                ' Start by selecting a team for your alliance.'}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
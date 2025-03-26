import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import { getTeamStatistics, getTeamMatches, getFilteredMatches } from "@/lib/db";
import { TeamStatistics, MatchEntry } from "@/lib/types";
import { teams, matchTypes, climbingTypes } from "@/lib/teamData";
import { useIsMobile } from "@/hooks/use-mobile";
import { PerformanceTrend } from "../components/PerformanceTrend";
import { StatisticalInsights } from "../components/StatisticalInsights";
import { TeamComparison } from "../components/TeamComparison";
import { webSocketService } from "@/lib/websocket";
import { formSubmitVibration } from "@/lib/haptics";

export default function TeamAnalytics() {
  const [, setLocation] = useLocation();
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [matchFilter, setMatchFilter] = useState<string>("");
  const [climbingFilter, setClimbingFilter] = useState<string>("");
  const [minScoreFilter, setMinScoreFilter] = useState<number | null>(null);
  const [teamStats, setTeamStats] = useState<TeamStatistics | null>(null);
  const [matches, setMatches] = useState<MatchEntry[]>([]);
  const [comparisonTeam, setComparisonTeam] = useState<string | null>(null);
  const [comparisonStats, setComparisonStats] = useState<TeamStatistics | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const isMobile = useIsMobile();

  // Listen for WebSocket messages for real-time updates
  useEffect(() => {
    const handleNewMatch = (data: any) => {
      if (data.matchData && selectedTeam) {
        // If the new match is for the selected team, refresh data
        if (data.matchData.team === selectedTeam) {
          loadTeamData(selectedTeam);
        }
        // If the new match is for the comparison team, refresh comparison data
        if (comparisonTeam && data.matchData.team === comparisonTeam) {
          loadComparisonData(comparisonTeam);
        }
      }
    };

    const unsubscribe = webSocketService.addListener('new_match', handleNewMatch);
    return () => unsubscribe();
  }, [selectedTeam, comparisonTeam]);

  const loadTeamData = async (teamNumber: string) => {
    if (!teamNumber) return;
    
    setLoading(true);
    try {
      // Load team statistics and match data
      const stats = await getTeamStatistics(teamNumber);
      if (!stats) throw new Error("Team statistics not found");
      
      const teamMatches = await getTeamMatches(teamNumber);
      
      // Apply filters if any are selected
      let filteredMatches = teamMatches;
      if (matchFilter || climbingFilter || minScoreFilter) {
        filteredMatches = await getFilteredMatches({
          teamNumber,
          matchType: matchFilter || undefined,
          climbing: climbingFilter || undefined,
          minOverallScore: minScoreFilter || undefined
        });
      }
      
      setTeamStats(stats);
      setMatches(filteredMatches);
    } catch (error) {
      console.error("Error loading team data:", error);
      toast({
        title: "Error",
        description: "Failed to load team data. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadComparisonData = async (teamNumber: string) => {
    if (!teamNumber) return;
    
    try {
      const stats = await getTeamStatistics(teamNumber);
      setComparisonStats(stats || null);
    } catch (error) {
      console.error("Error loading comparison data:", error);
      toast({
        title: "Error",
        description: "Failed to load comparison data. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleTeamSelect = (value: string) => {
    setSelectedTeam(value);
    loadTeamData(value);
  };

  const handleComparisonTeamSelect = (value: string) => {
    setComparisonTeam(value);
    loadComparisonData(value);
  };

  const applyFilters = () => {
    formSubmitVibration();
    if (selectedTeam) {
      loadTeamData(selectedTeam);
    }
  };

  const resetFilters = () => {
    setMatchFilter("");
    setClimbingFilter("");
    setMinScoreFilter(null);
    
    if (selectedTeam) {
      loadTeamData(selectedTeam);
    }
  };

  return (
    <div className="container mx-auto p-4 pb-24">
      <h1 className="text-3xl font-bold mb-6 bg-gradient-to-r from-primary to-purple-500 text-transparent bg-clip-text">
        Advanced Team Analytics
      </h1>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Team Selection</CardTitle>
          <CardDescription>Select a team to analyze performance data</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="w-full md:w-1/2">
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Select Team</label>
                <Select value={selectedTeam || ""} onValueChange={handleTeamSelect}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a team" />
                  </SelectTrigger>
                  <SelectContent>
                    {teams.map(([number, name]) => (
                      <SelectItem key={number} value={number}>
                        {number} - {name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="w-full md:w-1/2">
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Filters</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  <Select value={matchFilter} onValueChange={setMatchFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Match Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Match Types</SelectItem>
                      {matchTypes.map(type => (
                        <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <Select value={climbingFilter} onValueChange={setClimbingFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Climbing" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Climbing</SelectItem>
                      {climbingTypes.map(type => (
                        <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <Input
                    type="number"
                    placeholder="Min Score"
                    value={minScoreFilter || ""}
                    onChange={(e) => setMinScoreFilter(e.target.value ? Number(e.target.value) : null)}
                    min={1}
                    max={7}
                  />
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button onClick={applyFilters} disabled={!selectedTeam || loading}>
                  Apply Filters
                </Button>
                <Button variant="outline" onClick={resetFilters} disabled={!selectedTeam || loading}>
                  Reset
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {selectedTeam && teamStats ? (
        <Tabs defaultValue="insights" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="insights">Statistical Insights</TabsTrigger>
            <TabsTrigger value="trends">Performance Trends</TabsTrigger>
            <TabsTrigger value="comparison">Team Comparison</TabsTrigger>
          </TabsList>
          
          <TabsContent value="insights">
            <StatisticalInsights 
              teamStats={teamStats} 
              matches={matches} 
            />
          </TabsContent>
          
          <TabsContent value="trends">
            <PerformanceTrend 
              matches={matches} 
              teamNumber={selectedTeam} 
            />
          </TabsContent>
          
          <TabsContent value="comparison">
            <Card className="mb-4">
              <CardHeader>
                <CardTitle>Team Comparison</CardTitle>
                <CardDescription>Compare with another team</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4 max-w-md">
                  <Select value={comparisonTeam || ""} onValueChange={handleComparisonTeamSelect}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select comparison team" />
                    </SelectTrigger>
                    <SelectContent>
                      {teams.filter(([number]) => number !== selectedTeam).map(([number, name]) => (
                        <SelectItem key={number} value={number}>
                          {number} - {name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {comparisonTeam && comparisonStats ? (
                  <TeamComparison 
                    teamStats={teamStats} 
                    comparisonStats={comparisonStats} 
                  />
                ) : (
                  <div className="text-center p-4">
                    <p>Select a team to compare with {selectedTeam}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      ) : (
        <div className="text-center p-16">
          <p className="text-xl text-muted-foreground">Select a team to view detailed analytics</p>
        </div>
      )}
      
      <div className="fixed bottom-4 left-0 right-0 flex justify-center">
        <Button 
          variant="outline" 
          onClick={() => setLocation("/")}
          className="rounded-full shadow-lg"
        >
          Back to Home
        </Button>
      </div>
    </div>
  );
}
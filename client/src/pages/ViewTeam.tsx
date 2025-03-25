import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { teams, matchTypes, climbingTypes } from "@/lib/teamData";
import { getTeamStatistics, getFilteredMatches, deleteMatchEntry } from "@/lib/db";
import { MatchEntry, TeamStatistics, FilterCriteria } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  LineController,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Radar, Line } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  LineController,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function ViewTeam() {
  const { toast } = useToast();
  const [selectedTeam, setSelectedTeam] = useState("");
  const [teamData, setTeamData] = useState<TeamStatistics | null>(null);
  const [matchEntries, setMatchEntries] = useState<MatchEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilters] = useState<FilterCriteria>({
    matchType: "",
    climbing: "",
    minOverallScore: 1,
  });
  
  // Selected match for the detail dialog
  const [selectedMatch, setSelectedMatch] = useState<MatchEntry | null>(null);
  const [showMatchDialog, setShowMatchDialog] = useState(false);

  // Load team data when team selection changes
  useEffect(() => {
    if (!selectedTeam) return;
    
    const loadTeamData = async () => {
      setIsLoading(true);
      try {
        const stats = await getTeamStatistics(selectedTeam);
        if (stats) {
          setTeamData(stats);
        }
        
        const matches = await getFilteredMatches({ teamNumber: selectedTeam });
        setMatchEntries(matches);
      } catch (error) {
        console.error("Error loading team data:", error);
        toast({
          title: "Error",
          description: "Failed to load team data",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    loadTeamData();
  }, [selectedTeam, toast]);

  // Apply filters when filter criteria changes
  useEffect(() => {
    if (!selectedTeam) return;
    
    const applyFilters = async () => {
      try {
        const matches = await getFilteredMatches({
          teamNumber: selectedTeam,
          ...filters,
        });
        setMatchEntries(matches);
      } catch (error) {
        console.error("Error applying filters:", error);
        toast({
          title: "Error",
          description: "Failed to apply filters",
          variant: "destructive",
        });
      }
    };
    
    applyFilters();
  }, [filters, selectedTeam, toast]);

  // Show match details
  const showMatchDetails = (match: MatchEntry) => {
    setSelectedMatch(match);
    setShowMatchDialog(true);
  };

  // Delete match entry
  const handleDeleteMatch = async (id: number | undefined) => {
    if (!id) return;
    
    try {
      await deleteMatchEntry(id);
      
      // Refresh data
      const stats = await getTeamStatistics(selectedTeam);
      if (stats) {
        setTeamData(stats);
      }
      
      const matches = await getFilteredMatches({
        teamNumber: selectedTeam,
        ...filters,
      });
      setMatchEntries(matches);
      
      setShowMatchDialog(false);
      
      toast({
        title: "Success",
        description: "Match entry deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting match entry:", error);
      toast({
        title: "Error",
        description: "Failed to delete match entry",
        variant: "destructive",
      });
    }
  };

  // Prepare chart data
  const prepareRadarChartData = () => {
    if (!teamData) return null;
    
    return {
      labels: ['Defense', 'Avoiding Defense', 'Scoring Algae', 'Scoring Corals', 'Autonomous', 'Driving Skill'],
      datasets: [
        {
          label: 'Team Performance',
          data: [
            teamData.averages.defense,
            teamData.averages.avoidingDefense,
            teamData.averages.scoringAlgae,
            teamData.averages.scoringCorals,
            teamData.averages.autonomous,
            teamData.averages.drivingSkill,
          ],
          backgroundColor: 'rgba(26, 35, 126, 0.2)',
          borderColor: 'rgba(26, 35, 126, 1)',
          pointBackgroundColor: 'rgba(26, 35, 126, 1)',
          pointBorderColor: '#fff',
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: 'rgba(26, 35, 126, 1)',
        },
      ],
    };
  };

  const prepareTrendChartData = () => {
    if (!matchEntries || matchEntries.length === 0) return null;
    
    // Sort entries by match number
    const sortedEntries = [...matchEntries].sort((a, b) => a.matchNumber - b.matchNumber);
    
    return {
      labels: sortedEntries.map(entry => `${entry.matchType.substring(0, 1)}${entry.matchNumber}`),
      datasets: [
        {
          label: 'Overall Score',
          data: sortedEntries.map(entry => entry.overall),
          backgroundColor: 'rgba(26, 35, 126, 0.1)',
          borderColor: 'rgba(26, 35, 126, 1)',
          pointBackgroundColor: 'rgba(26, 35, 126, 1)',
          tension: 0.1,
          fill: true,
        },
      ],
    };
  };

  // Format climbing percentage
  const formatClimbingPercentage = (type: string) => {
    if (!teamData || teamData.matchCount === 0) return "0%";
    const count = teamData.climbingStats[type as keyof typeof teamData.climbingStats];
    return `${Math.round((count / teamData.matchCount) * 100)}%`;
  };

  return (
    <>
      {/* Desktop navigation tabs (hidden on mobile) */}
      <div className="hidden md:flex mb-6 border-b border-gray-300">
        <a href="/scout" className="tab-btn py-2 px-4 font-medium text-gray-700">
          <i className="fas fa-clipboard-list mr-2"></i>Scout Match
        </a>
        <a href="/team" className="tab-btn active py-2 px-4 font-medium text-primary border-b-2 border-primary">
          <i className="fas fa-users mr-2"></i>View Team
        </a>
        <a href="/data" className="tab-btn py-2 px-4 font-medium text-gray-700">
          <i className="fas fa-sync-alt mr-2"></i>Export / Import
        </a>
      </div>
      
      <Card>
        <CardContent className="p-4 md:p-6">
          <h2 className="text-xl font-bold mb-4">View Team Data</h2>
          
          {/* Team Selection */}
          <div className="mb-6">
            <Label htmlFor="view-team" className="block mb-1 font-medium">Select Team</Label>
            <Select 
              value={selectedTeam} 
              onValueChange={setSelectedTeam}
            >
              <SelectTrigger className="w-full md:w-1/2">
                <SelectValue placeholder="Select Team" />
              </SelectTrigger>
              <SelectContent>
                {teams.map(([teamNumber, teamName]) => (
                  <SelectItem key={teamNumber} value={teamNumber}>
                    {teamNumber} - {teamName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Team Data Section (shown when team selected) */}
          {selectedTeam && teamData && (
            <div>
              {/* Filters */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium mb-3">Filter Data</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="filter-match" className="block mb-1 text-sm">Match Type</Label>
                    <Select 
                      value={filters.matchType || "all-matches"} 
                      onValueChange={(value) => setFilters(prev => ({ 
                        ...prev, 
                        matchType: value === "all-matches" ? "" : value 
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All Matches" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all-matches">All Matches</SelectItem>
                        {matchTypes.map((matchType) => (
                          <SelectItem key={matchType.value} value={matchType.value}>
                            {matchType.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="filter-climbing" className="block mb-1 text-sm">Climbing</Label>
                    <Select 
                      value={filters.climbing || "all-types"} 
                      onValueChange={(value) => setFilters(prev => ({ 
                        ...prev, 
                        climbing: value === "all-types" ? "" : value 
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All Types" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all-types">All Types</SelectItem>
                        {climbingTypes.map((climbType) => (
                          <SelectItem key={climbType.value} value={climbType.value}>
                            {climbType.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="filter-min-score" className="block mb-1 text-sm">Min Overall Score</Label>
                    <Select 
                      value={filters.minOverallScore?.toString() || "1"} 
                      onValueChange={(value) => setFilters(prev => ({ ...prev, minOverallScore: parseInt(value) }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 4, 5, 6].map((score) => (
                          <SelectItem key={score} value={score.toString()}>
                            {score}+
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              
              {/* Team Performance Summary */}
              <div className="mb-6">
                <h3 className="font-medium mb-3">Performance Summary</h3>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="font-medium">Defense:</div>
                        <div>{teamData.averages.defense.toFixed(1)} / 7</div>
                        <div className="font-medium">Avoiding Defense:</div>
                        <div>{teamData.averages.avoidingDefense.toFixed(1)} / 7</div>
                        <div className="font-medium">Scoring Algae:</div>
                        <div>{teamData.averages.scoringAlgae.toFixed(1)} / 7</div>
                        <div className="font-medium">Scoring Corals:</div>
                        <div>{teamData.averages.scoringCorals.toFixed(1)} / 7</div>
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="font-medium">Autonomous:</div>
                        <div>{teamData.averages.autonomous.toFixed(1)} / 7</div>
                        <div className="font-medium">Driving Skill:</div>
                        <div>{teamData.averages.drivingSkill.toFixed(1)} / 7</div>
                        <div className="font-medium">Climbing:</div>
                        <div>
                          High ({formatClimbingPercentage("high")})
                        </div>
                        <div className="font-medium">Overall:</div>
                        <div>{teamData.averages.overall.toFixed(1)} / 7</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Performance Charts */}
              <div className="mb-6">
                <h3 className="font-medium mb-3">Performance Charts</h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                  <div className="bg-white p-4 rounded-lg shadow-sm">
                    <h4 className="text-sm font-medium mb-2">Average Ratings</h4>
                    <div className="h-64">
                      {prepareRadarChartData() && (
                        <Radar 
                          data={prepareRadarChartData()!} 
                          options={{
                            scales: {
                              r: {
                                angleLines: {
                                  display: true
                                },
                                suggestedMin: 0,
                                suggestedMax: 7
                              }
                            }
                          }}
                        />
                      )}
                    </div>
                  </div>
                  <div className="bg-white p-4 rounded-lg shadow-sm">
                    <h4 className="text-sm font-medium mb-2">Performance Trend</h4>
                    <div className="h-64">
                      {prepareTrendChartData() && (
                        <Line 
                          data={prepareTrendChartData()!}
                          options={{
                            scales: {
                              y: {
                                beginAtZero: true,
                                max: 7
                              }
                            }
                          }}
                        />
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Match History */}
              <div className="mb-6">
                <h3 className="font-medium mb-3">Match History</h3>
                {matchEntries.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full bg-white border border-gray-200">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Match</th>
                          <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Alliance</th>
                          <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Climbing</th>
                          <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Overall</th>
                          <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {matchEntries.map((match) => (
                          <tr key={match.id} className="border-b">
                            <td className="py-2 px-3">
                              {match.matchType.charAt(0).toUpperCase() + match.matchType.slice(1, 3)} {match.matchNumber}
                            </td>
                            <td className="py-2 px-3">
                              <span className={`inline-block w-3 h-3 mr-1 ${match.alliance === 'red' ? 'bg-red-600' : 'bg-blue-600'} rounded-full`}></span>
                              {match.alliance.charAt(0).toUpperCase() + match.alliance.slice(1)}
                            </td>
                            <td className="py-2 px-3">
                              {match.climbing.charAt(0).toUpperCase() + match.climbing.slice(1)}
                            </td>
                            <td className="py-2 px-3">{match.overall}/7</td>
                            <td className="py-2 px-3">
                              <Button 
                                variant="link" 
                                className="text-primary text-sm p-0 h-auto"
                                onClick={() => showMatchDetails(match)}
                              >
                                Details
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-4 bg-gray-50 rounded-lg text-center text-gray-500">
                    No match entries found for this team.
                  </div>
                )}
              </div>
              
              {/* Comments */}
              <div>
                <h3 className="font-medium mb-3">Scout Comments</h3>
                {matchEntries.filter(match => match.comments).length > 0 ? (
                  <div className="space-y-3">
                    {matchEntries
                      .filter(match => match.comments)
                      .map((match) => (
                        <div key={match.id} className="p-3 bg-gray-50 rounded-lg">
                          <div className="text-sm text-gray-500 mb-1">
                            {match.matchType.charAt(0).toUpperCase() + match.matchType.slice(1, 3)} {match.matchNumber} - 
                            {match.alliance === 'red' ? ' Red' : ' Blue'} Alliance
                          </div>
                          <p>{match.comments}</p>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="p-4 bg-gray-50 rounded-lg text-center text-gray-500">
                    No comments found for this team.
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Empty State */}
          {!selectedTeam && (
            <div className="py-8 text-center">
              <div className="mb-4 text-gray-400 flex justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-500 mb-2">No Team Selected</h3>
              <p className="text-sm text-gray-500">Select a team to view their performance data</p>
            </div>
          )}
          
          {/* Loading State */}
          {isLoading && (
            <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10">
              <div className="text-primary">Loading...</div>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Match Details Dialog */}
      <Dialog open={showMatchDialog} onOpenChange={setShowMatchDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Match Details</DialogTitle>
            <DialogDescription>
              {selectedMatch && (
                <span>
                  Team {selectedMatch.team} - {selectedMatch.matchType.charAt(0).toUpperCase() + selectedMatch.matchType.slice(1)} {selectedMatch.matchNumber}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          
          {selectedMatch && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                <div className="font-medium">Defense:</div>
                <div>{selectedMatch.defense}/7</div>
                {selectedMatch.defenseComment && (
                  <div className="col-span-2 text-sm italic">"{selectedMatch.defenseComment}"</div>
                )}
                
                <div className="font-medium">Avoiding Defense:</div>
                <div>{selectedMatch.avoidingDefense}/7</div>
                {selectedMatch.avoidingDefenseComment && (
                  <div className="col-span-2 text-sm italic">"{selectedMatch.avoidingDefenseComment}"</div>
                )}
                
                <div className="font-medium">Scoring Algae:</div>
                <div>{selectedMatch.scoringAlgae}/7</div>
                {selectedMatch.scoringAlgaeComment && (
                  <div className="col-span-2 text-sm italic">"{selectedMatch.scoringAlgaeComment}"</div>
                )}
                
                <div className="font-medium">Scoring Corals:</div>
                <div>{selectedMatch.scoringCorals}/7</div>
                {selectedMatch.scoringCoralsComment && (
                  <div className="col-span-2 text-sm italic">"{selectedMatch.scoringCoralsComment}"</div>
                )}
                
                <div className="font-medium">Autonomous:</div>
                <div>{selectedMatch.autonomous}/7</div>
                {selectedMatch.autonomousComment && (
                  <div className="col-span-2 text-sm italic">"{selectedMatch.autonomousComment}"</div>
                )}
                
                <div className="font-medium">Driving Skill:</div>
                <div>{selectedMatch.drivingSkill}/7</div>
                {selectedMatch.drivingSkillComment && (
                  <div className="col-span-2 text-sm italic">"{selectedMatch.drivingSkillComment}"</div>
                )}
                
                <div className="font-medium">Climbing:</div>
                <div>{selectedMatch.climbing.charAt(0).toUpperCase() + selectedMatch.climbing.slice(1)}</div>
                {selectedMatch.climbingComment && (
                  <div className="col-span-2 text-sm italic">"{selectedMatch.climbingComment}"</div>
                )}
                
                <div className="font-medium">Overall:</div>
                <div>{selectedMatch.overall}/7</div>
                
                {selectedMatch.comments && (
                  <>
                    <div className="font-medium col-span-2 mt-2">Comments:</div>
                    <div className="col-span-2 p-2 bg-gray-50 rounded">{selectedMatch.comments}</div>
                  </>
                )}
              </div>
            </div>
          )}
          
          <DialogFooter className="flex justify-between">
            <Button 
              variant="destructive" 
              onClick={() => selectedMatch?.id && handleDeleteMatch(selectedMatch.id)}
            >
              Delete Entry
            </Button>
            <Button 
              variant="outline"
              onClick={() => setShowMatchDialog(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

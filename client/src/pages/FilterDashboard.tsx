import { useState, useEffect } from "react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import TeamMascotSpinner from "@/components/ui/team-mascot-spinner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BrainCircuit, Filter, MessageSquare } from "lucide-react";
import { getAllTeams } from "@/lib/db";
import { Alliance, TeamStatistics } from "@/lib/types";
import { RecommendationEngine } from "@/components/ai/RecommendationEngine";
import { useToast } from "@/hooks/use-toast";
import { formSubmitVibration } from "@/lib/haptics";

const FilterDashboard = () => {
  const [teams, setTeams] = useState<TeamStatistics[]>([]);
  const [selectedTeams, setSelectedTeams] = useState<string[]>([]);
  const [alliance, setAlliance] = useState<Alliance | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    // Load all teams
    const loadTeams = async () => {
      try {
        setIsLoading(true);
        const allTeams = await getAllTeams();
        setTeams(allTeams.sort((a, b) => a.teamNumber.localeCompare(b.teamNumber)));
        setIsLoading(false);
      } catch (error) {
        console.error("Error loading teams:", error);
        toast({
          title: "Error",
          description: "Failed to load team data",
          variant: "destructive"
        });
        setIsLoading(false);
      }
    };
    
    loadTeams();
  }, [toast]);

  const handleTeamSelect = (teamNumber: string) => {
    formSubmitVibration();
    if (selectedTeams.includes(teamNumber)) {
      // Remove team if already selected
      setSelectedTeams(selectedTeams.filter(team => team !== teamNumber));
    } else {
      // Add team if not already selected (maximum 3)
      if (selectedTeams.length < 3) {
        setSelectedTeams([...selectedTeams, teamNumber]);
      } else {
        toast({
          title: "Maximum Teams Selected",
          description: "You can only select up to 3 teams at once",
          variant: "destructive"
        });
      }
    }
  };

  // Filter teams based on search query
  const filteredTeams = teams.filter(team => 
    team.teamNumber.includes(searchQuery) || 
    (team.teamName && team.teamName.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <div className="text-center">
          <TeamMascotSpinner 
            size="lg"
            variant="primary"
            speed="default"
            label="Loading team data..."
          />
          <div className="text-primary text-2xl font-bold mt-6 gradient-text">
            Loading AI Filter Dashboard
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold gradient-text inline-block">AI Team Advisor</h1>
          <p className="text-muted-foreground">
            Find optimal teams to complement your alliance with AI-powered recommendations
          </p>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BrainCircuit className="h-5 w-5 mr-2" />
              AI Team Recommendations
            </CardTitle>
            <CardDescription>
              Select teams to analyze or get AI recommendations for building your alliance
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="team-search">Search Teams</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    id="team-search"
                    placeholder="Search by team number or name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <Button 
                    variant="outline"
                    size="icon"
                    onClick={() => setSearchQuery("")}
                  >
                    <Filter className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              {selectedTeams.length > 0 && (
                <div>
                  <Label>Selected Teams</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedTeams.map(teamNumber => {
                      const teamData = teams.find(t => t.teamNumber === teamNumber);
                      return (
                        <Badge 
                          key={teamNumber} 
                          variant="secondary"
                          className="px-3 py-1.5 cursor-pointer"
                          onClick={() => handleTeamSelect(teamNumber)}
                        >
                          {teamNumber} {teamData?.teamName ? `- ${teamData.teamName}` : ''}
                          <span className="ml-2 text-xs">×</span>
                        </Badge>
                      );
                    })}
                  </div>
                </div>
              )}
              
              <div className="h-[1px] w-full bg-muted my-4" />
              
              <RecommendationEngine 
                teams={teams}
                selectedTeams={selectedTeams}
                onRecommendTeam={handleTeamSelect}
                alliance={alliance}
              />
              
              <div>
                <Label>Available Teams</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 mt-2 max-h-48 overflow-y-auto p-2 border rounded-md">
                  {filteredTeams.length > 0 ? (
                    filteredTeams.map(team => (
                      <Badge 
                        key={team.teamNumber} 
                        variant={selectedTeams.includes(team.teamNumber) ? "secondary" : "outline"}
                        className="px-2 py-1 cursor-pointer flex items-center justify-between"
                        onClick={() => handleTeamSelect(team.teamNumber)}
                      >
                        <span className="truncate">{team.teamNumber}</span>
                        {team.matchCount > 2 && (
                          <MessageSquare className="h-3 w-3 ml-1 flex-shrink-0" />
                        )}
                      </Badge>
                    ))
                  ) : (
                    <div className="col-span-full text-center text-muted-foreground py-2">
                      No teams match your search criteria
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default FilterDashboard;
import { useState, useEffect } from "react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { TeamMascotSpinner } from "@/components/ui/team-mascot-spinner";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger, 
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  buildAlliance,
  getAllTeams,
  saveAlliancePreset,
  getAllAlliancePresets,
  deleteAlliancePreset
} from "@/lib/db";
import { 
  createAlliancePreset, 
  deleteServerAlliancePreset, 
  fetchAllAlliancePresets 
} from "@/lib/allianceService";
import { Alliance, TeamStatistics } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { Star, StarOff, PlusCircle, Trash2, Save, RotateCw, CheckCircle, XCircle, Filter, Cloud, Database } from "lucide-react";
import { formSubmitVibration } from "@/lib/haptics";
import { useOnlineStatus } from "@/hooks/use-online-status";

const AllianceAdvisor = () => {
  const [teams, setTeams] = useState<TeamStatistics[]>([]);
  const [includedTeams, setIncludedTeams] = useState<string[]>([]);
  const [excludedTeams, setExcludedTeams] = useState<string[]>([]);
  const [selectedTeams, setSelectedTeams] = useState<string[]>([]);
  const [alliances, setAlliances] = useState<Alliance[]>([]);
  const [alliance, setAlliance] = useState<Alliance | null>(null);
  const [alliancePresets, setAlliancePresets] = useState<(Alliance & { id: string; name: string; isFavorite?: boolean })[]>([]);
  const [presetName, setPresetName] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isCalculating, setIsCalculating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [sortCriteria, setSortCriteria] = useState<keyof Alliance["combinedAverages"]>("overall");
  const { toast } = useToast();

  useEffect(() => {
    // Load all teams
    const loadTeams = async () => {
      try {
        setIsLoading(true);
        const allTeams = await getAllTeams();
        setTeams(allTeams.sort((a, b) => a.teamNumber.localeCompare(b.teamNumber)));
        
        // Load alliance presets
        const presets = await getAllAlliancePresets();
        setAlliancePresets(presets);
        
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
  
  // Generate possible alliance combinations
  const generateAlliances = async () => {
    setIsCalculating(true);
    
    try {
      const availableTeams = teams
        .filter(team => !excludedTeams.includes(team.teamNumber))
        .map(team => team.teamNumber);
      
      // Always include the included teams
      const fixedTeams = [...includedTeams];
      
      // How many more teams we need to select
      const remainingTeamsToSelect = 3 - fixedTeams.length;
      
      if (remainingTeamsToSelect <= 0) {
        // We already have a full alliance from the included teams
        const calculatedAlliance = await buildAlliance(fixedTeams.slice(0, 3));
        if (calculatedAlliance) {
          setAlliances([calculatedAlliance]);
          setAlliance(calculatedAlliance);
        }
        setIsCalculating(false);
        return;
      }
      
      // Get the available teams (not included and not excluded)
      const remainingTeams = availableTeams.filter(team => !includedTeams.includes(team));
      
      // Generate all possible combinations of the remaining teams
      const allCombinations: string[][] = [];
      
      // Helper function to generate combinations - using arrow function to avoid issues in strict mode
      const generateCombinations = (arr: string[], size: number, start = 0, current: string[] = []): void => {
        if (current.length === size) {
          allCombinations.push([...current]);
          return;
        }
        
        for (let i = start; i < arr.length; i++) {
          current.push(arr[i]);
          generateCombinations(arr, size, i + 1, current);
          current.pop();
        }
      };
      
      // Generate all possible combinations of remaining teams
      generateCombinations(remainingTeams, remainingTeamsToSelect);
      
      // For each combination, add the fixed teams to create complete alliances
      const allianceCombinations = allCombinations.map(combo => [...fixedTeams, ...combo]);
      
      // Limit to top 20 combinations to avoid overloading
      const alliancesToAnalyze = allianceCombinations.slice(0, 20);
      
      // Calculate alliance statistics for each combination
      const calculatedAlliances: Alliance[] = [];
      
      for (const allianceTeams of alliancesToAnalyze) {
        const allianceData = await buildAlliance(allianceTeams);
        if (allianceData) {
          calculatedAlliances.push(allianceData);
        }
      }
      
      // Sort alliances by the selected criteria
      const sortedAlliances = calculatedAlliances.sort((a, b) => 
        b.combinedAverages[sortCriteria] - a.combinedAverages[sortCriteria]);
      
      setAlliances(sortedAlliances);
      
      // Set the first alliance as the selected one
      if (sortedAlliances.length > 0) {
        setAlliance(sortedAlliances[0]);
        setSelectedTeams(sortedAlliances[0].teams);
      }
      
      toast({
        title: "Alliance Analysis Complete",
        description: `Generated ${sortedAlliances.length} possible alliance combinations.`
      });
      
    } catch (error) {
      console.error("Error generating alliances:", error);
      toast({
        title: "Error",
        description: "Failed to generate alliance combinations",
        variant: "destructive"
      });
    }
    
    setIsCalculating(false);
  };

  const handleIncludeTeam = (teamNumber: string) => {
    formSubmitVibration();
    
    // Remove from excluded if it's there
    if (excludedTeams.includes(teamNumber)) {
      setExcludedTeams(excludedTeams.filter(team => team !== teamNumber));
    }
    
    // Add to included if not already there
    if (!includedTeams.includes(teamNumber)) {
      // Make sure we don't exceed 3 teams
      if (includedTeams.length >= 3) {
        toast({
          title: "Maximum Teams Reached",
          description: "You can only include up to 3 teams. Remove a team first.",
          variant: "destructive"
        });
        return;
      }
      
      setIncludedTeams([...includedTeams, teamNumber]);
    }
  };

  const handleExcludeTeam = (teamNumber: string) => {
    formSubmitVibration();
    
    // Remove from included if it's there
    if (includedTeams.includes(teamNumber)) {
      setIncludedTeams(includedTeams.filter(team => team !== teamNumber));
    }
    
    // Add to excluded if not already there
    if (!excludedTeams.includes(teamNumber)) {
      setExcludedTeams([...excludedTeams, teamNumber]);
    }
  };

  const handleRemoveIncluded = (teamNumber: string) => {
    formSubmitVibration();
    setIncludedTeams(includedTeams.filter(team => team !== teamNumber));
  };

  const handleRemoveExcluded = (teamNumber: string) => {
    formSubmitVibration();
    setExcludedTeams(excludedTeams.filter(team => team !== teamNumber));
  };

  const handleSelectAlliance = (allianceData: Alliance) => {
    formSubmitVibration();
    setAlliance(allianceData);
    setSelectedTeams(allianceData.teams);
  };
  
  // Get online status
  const { isOnline } = useOnlineStatus();
  
  const handleSavePreset = async (isFavorite: boolean = false) => {
    try {
      if (!presetName.trim()) {
        toast({
          title: "Error",
          description: "Please enter a name for this alliance",
          variant: "destructive"
        });
        return;
      }
      
      if (!alliance || alliance.teams.length === 0) {
        toast({
          title: "Error",
          description: "Please select an alliance to save",
          variant: "destructive"
        });
        return;
      }
      
      setIsSaving(true);
      formSubmitVibration();
      
      // Save alliance preset locally
      const localPresetId = await saveAlliancePreset(presetName, alliance.teams, isFavorite);
      
      // If online, also save to server
      if (isOnline) {
        try {
          // Create alliance preset on server
          await createAlliancePreset(presetName, alliance.teams, isFavorite);
          console.log("Alliance preset saved to server");
        } catch (error) {
          console.error("Failed to save alliance preset to server:", error);
          toast({
            title: "Saved Locally Only",
            description: "Alliance saved locally, but could not sync with server",
            variant: "destructive"
          });
        }
      }
      
      // Refresh presets from local storage
      const presets = await getAllAlliancePresets();
      setAlliancePresets(presets);
      
      toast({
        title: "Success",
        description: isOnline 
          ? "Alliance saved successfully and synced with server" 
          : "Alliance saved locally (offline mode)",
      });
      
      // Reset preset name
      setPresetName("");
      setIsSaving(false);
    } catch (error) {
      console.error("Error saving alliance preset:", error);
      toast({
        title: "Error",
        description: "Failed to save alliance preset",
        variant: "destructive"
      });
      setIsSaving(false);
    }
  };

  const handleClearFilters = () => {
    formSubmitVibration();
    setIncludedTeams([]);
    setExcludedTeams([]);
    setAlliances([]);
    setAlliance(null);
    setSelectedTeams([]);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <TeamMascotSpinner size="lg" message="Loading Teams..." />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold gradient-text inline-block">Alliance Selection Advisor</h1>
          <p className="text-muted-foreground">
            Find optimal alliance combinations with include/exclude functionality
          </p>
        </div>
        
        <Tabs defaultValue="criteria" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="criteria">Selection Criteria</TabsTrigger>
            <TabsTrigger value="results">Alliance Results</TabsTrigger>
          </TabsList>
          
          <TabsContent value="criteria" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              {/* Include/Exclude Teams */}
              <Card className="md:col-span-6">
                <CardHeader>
                  <CardTitle>Include/Exclude Teams</CardTitle>
                  <CardDescription>
                    Select teams to include or exclude from alliance recommendations
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Included Teams */}
                    <div>
                      <h3 className="text-sm font-medium mb-2">Must Include Teams</h3>
                      {includedTeams.length > 0 ? (
                        <div className="flex flex-wrap gap-2 mb-2">
                          {includedTeams.map((teamNumber) => {
                            const teamData = teams.find(t => t.teamNumber === teamNumber);
                            return (
                              <Badge key={teamNumber} variant="secondary" className="flex items-center gap-1 px-2 py-1.5">
                                <CheckCircle className="h-3 w-3 text-green-500" />
                                {teamNumber} {teamData?.teamName ? `- ${teamData.teamName}` : ''}
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="h-4 w-4 p-0 ml-1" 
                                  onClick={() => handleRemoveIncluded(teamNumber)}
                                >
                                  <XCircle className="h-3 w-3" />
                                </Button>
                              </Badge>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground mb-2">No teams included yet.</p>
                      )}
                      
                      {/* Excluded Teams */}
                      <h3 className="text-sm font-medium mb-2 mt-4">Must Exclude Teams</h3>
                      {excludedTeams.length > 0 ? (
                        <div className="flex flex-wrap gap-2 mb-2">
                          {excludedTeams.map((teamNumber) => {
                            const teamData = teams.find(t => t.teamNumber === teamNumber);
                            return (
                              <Badge key={teamNumber} variant="outline" className="flex items-center gap-1 px-2 py-1.5">
                                <XCircle className="h-3 w-3 text-red-500" />
                                {teamNumber} {teamData?.teamName ? `- ${teamData.teamName}` : ''}
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="h-4 w-4 p-0 ml-1" 
                                  onClick={() => handleRemoveExcluded(teamNumber)}
                                >
                                  <XCircle className="h-3 w-3" />
                                </Button>
                              </Badge>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground mb-2">No teams excluded yet.</p>
                      )}
                    </div>
                    
                    <Separator />
                    
                    {/* Team Filter Controls */}
                    <div>
                      <h3 className="text-sm font-medium mb-2">Optimization Criteria</h3>
                      <Select 
                        value={sortCriteria} 
                        onValueChange={(value) => setSortCriteria(value as keyof Alliance["combinedAverages"])}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select sort criteria" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="overall">Overall Performance</SelectItem>
                          <SelectItem value="defense">Defense Performance</SelectItem>
                          <SelectItem value="avoidingDefense">Avoiding Defense</SelectItem>
                          <SelectItem value="scoringAlgae">Scoring Algae</SelectItem>
                          <SelectItem value="scoringCorals">Scoring Corals</SelectItem>
                          <SelectItem value="autonomous">Autonomous</SelectItem>
                          <SelectItem value="drivingSkill">Driving Skill</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button 
                    onClick={handleClearFilters}
                    variant="outline"
                  >
                    Clear All Filters
                  </Button>
                  <Button 
                    onClick={generateAlliances}
                    disabled={isCalculating}
                  >
                    {isCalculating ? "Calculating..." : "Generate Recommendations"}
                  </Button>
                </CardFooter>
              </Card>
            
              {/* Available Teams */}
              <Card className="md:col-span-6">
                <CardHeader>
                  <CardTitle>Available Teams</CardTitle>
                  <CardDescription>
                    Select teams to include or exclude from your analysis
                  </CardDescription>
                </CardHeader>
                <CardContent className="max-h-[400px] overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Team</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {teams.map((team) => {
                        const isIncluded = includedTeams.includes(team.teamNumber);
                        const isExcluded = excludedTeams.includes(team.teamNumber);
                        
                        return (
                          <TableRow key={team.teamNumber}>
                            <TableCell className="font-medium">{team.teamNumber}</TableCell>
                            <TableCell>{team.teamName}</TableCell>
                            <TableCell className="text-right space-x-1">
                              <Button
                                variant={isIncluded ? "default" : "outline"}
                                size="sm"
                                className={isIncluded ? "bg-green-600 hover:bg-green-700" : ""}
                                onClick={() => handleIncludeTeam(team.teamNumber)}
                                disabled={isExcluded}
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Include
                              </Button>
                              <Button
                                variant={isExcluded ? "default" : "outline"}
                                size="sm"
                                className={isExcluded ? "bg-red-600 hover:bg-red-700" : ""}
                                onClick={() => handleExcludeTeam(team.teamNumber)}
                                disabled={isIncluded}
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                Exclude
                              </Button>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="results" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              {/* Alliance Recommendations */}
              <Card className="md:col-span-6">
                <CardHeader>
                  <CardTitle>Alliance Recommendations</CardTitle>
                  <CardDescription>
                    Recommended alliances based on your criteria
                  </CardDescription>
                </CardHeader>
                <CardContent className="max-h-[400px] overflow-y-auto">
                  {isCalculating ? (
                    <div className="flex justify-center items-center py-8">
                      <TeamMascotSpinner message="Calculating optimal alliances..." />
                    </div>
                  ) : alliances.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Teams</TableHead>
                          <TableHead>Rating</TableHead>
                          <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {alliances.map((allianceOption, index) => (
                          <TableRow 
                            key={index}
                            className={alliance && JSON.stringify(alliance.teams) === JSON.stringify(allianceOption.teams) ? "bg-muted" : ""}
                          >
                            <TableCell>
                              <div className="flex flex-wrap gap-1">
                                {allianceOption.teams.map((teamNum) => (
                                  <Badge key={teamNum} variant="outline" className="px-1">
                                    {teamNum}
                                  </Badge>
                                ))}
                              </div>
                            </TableCell>
                            <TableCell>
                              {allianceOption.combinedAverages[sortCriteria].toFixed(1)}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleSelectAlliance(allianceOption)}
                              >
                                View
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">No alliances generated yet.</p>
                      <p className="text-sm mt-2">Use the Selection Criteria tab to set your preferences and generate recommendations.</p>
                    </div>
                  )}
                </CardContent>
                {alliances.length > 0 && (
                  <CardFooter>
                    <div className="w-full">
                      <div className="flex items-center mb-2">
                        <Label htmlFor="alliance-name" className="mr-2">Alliance Name:</Label>
                        <Input
                          id="alliance-name"
                          value={presetName}
                          onChange={(e) => setPresetName(e.target.value)}
                          placeholder="Enter a name to save"
                          className="flex-1"
                        />
                      </div>
                      <div className="flex justify-between">
                        <Button
                          variant="outline"
                          onClick={() => handleSavePreset(false)}
                          disabled={isSaving || !presetName.trim() || !alliance}
                        >
                          <Save className="h-4 w-4 mr-2" />
                          Save
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => handleSavePreset(true)}
                          disabled={isSaving || !presetName.trim() || !alliance}
                        >
                          <Star className="h-4 w-4 mr-2" />
                          Save as Favorite
                        </Button>
                      </div>
                    </div>
                  </CardFooter>
                )}
              </Card>
            
              {/* Alliance Analysis */}
              <Card className="md:col-span-6">
                <CardHeader>
                  <CardTitle>Alliance Analysis</CardTitle>
                  <CardDescription>
                    Performance prediction and synergy analysis
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {alliance ? (
                    <div className="space-y-4">
                      {/* Teams in alliance */}
                      <div>
                        <h3 className="text-sm font-medium mb-2">Teams</h3>
                        <div className="flex flex-wrap gap-2">
                          {alliance.teams.map((team, idx) => {
                            const teamData = teams.find(t => t.teamNumber === team);
                            return (
                              <Badge key={idx} variant="outline" className="px-2 py-1">
                                {team} {teamData ? `- ${teamData.teamName}` : ''}
                              </Badge>
                            );
                          })}
                        </div>
                      </div>
                      
                      <Separator />
                      
                      {/* Performance metrics */}
                      <div>
                        <h3 className="text-sm font-medium mb-2">Average Ratings</h3>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-muted-foreground">Defense</p>
                            <div className="flex items-center">
                              <div className="w-full bg-muted rounded-full h-2.5 mr-2">
                                <div 
                                  className="bg-primary h-2.5 rounded-full" 
                                  style={{ width: `${(alliance.combinedAverages.defense / 7) * 100}%` }}
                                ></div>
                              </div>
                              <span className="text-sm font-medium">{alliance.combinedAverages.defense.toFixed(1)}</span>
                            </div>
                          </div>
                          
                          <div>
                            <p className="text-sm text-muted-foreground">Avoiding Defense</p>
                            <div className="flex items-center">
                              <div className="w-full bg-muted rounded-full h-2.5 mr-2">
                                <div 
                                  className="bg-primary h-2.5 rounded-full" 
                                  style={{ width: `${(alliance.combinedAverages.avoidingDefense / 7) * 100}%` }}
                                ></div>
                              </div>
                              <span className="text-sm font-medium">{alliance.combinedAverages.avoidingDefense.toFixed(1)}</span>
                            </div>
                          </div>
                          
                          <div>
                            <p className="text-sm text-muted-foreground">Scoring Algae</p>
                            <div className="flex items-center">
                              <div className="w-full bg-muted rounded-full h-2.5 mr-2">
                                <div 
                                  className="bg-primary h-2.5 rounded-full" 
                                  style={{ width: `${(alliance.combinedAverages.scoringAlgae / 7) * 100}%` }}
                                ></div>
                              </div>
                              <span className="text-sm font-medium">{alliance.combinedAverages.scoringAlgae.toFixed(1)}</span>
                            </div>
                          </div>
                          
                          <div>
                            <p className="text-sm text-muted-foreground">Scoring Corals</p>
                            <div className="flex items-center">
                              <div className="w-full bg-muted rounded-full h-2.5 mr-2">
                                <div 
                                  className="bg-primary h-2.5 rounded-full" 
                                  style={{ width: `${(alliance.combinedAverages.scoringCorals / 7) * 100}%` }}
                                ></div>
                              </div>
                              <span className="text-sm font-medium">{alliance.combinedAverages.scoringCorals.toFixed(1)}</span>
                            </div>
                          </div>
                          
                          <div>
                            <p className="text-sm text-muted-foreground">Autonomous</p>
                            <div className="flex items-center">
                              <div className="w-full bg-muted rounded-full h-2.5 mr-2">
                                <div 
                                  className="bg-primary h-2.5 rounded-full" 
                                  style={{ width: `${(alliance.combinedAverages.autonomous / 7) * 100}%` }}
                                ></div>
                              </div>
                              <span className="text-sm font-medium">{alliance.combinedAverages.autonomous.toFixed(1)}</span>
                            </div>
                          </div>
                          
                          <div>
                            <p className="text-sm text-muted-foreground">Driving Skill</p>
                            <div className="flex items-center">
                              <div className="w-full bg-muted rounded-full h-2.5 mr-2">
                                <div 
                                  className="bg-primary h-2.5 rounded-full" 
                                  style={{ width: `${(alliance.combinedAverages.drivingSkill / 7) * 100}%` }}
                                ></div>
                              </div>
                              <span className="text-sm font-medium">{alliance.combinedAverages.drivingSkill.toFixed(1)}</span>
                            </div>
                          </div>
                          
                          <div>
                            <p className="text-sm text-muted-foreground">Overall</p>
                            <div className="flex items-center">
                              <div className="w-full bg-muted rounded-full h-2.5 mr-2">
                                <div 
                                  className="bg-primary h-2.5 rounded-full" 
                                  style={{ width: `${(alliance.combinedAverages.overall / 7) * 100}%` }}
                                ></div>
                              </div>
                              <span className="text-sm font-medium">{alliance.combinedAverages.overall.toFixed(1)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <Separator />
                      
                      {/* Consistency */}
                      <div>
                        <h3 className="text-sm font-medium mb-2">Consistency Analysis</h3>
                        <div className="grid grid-cols-1 gap-3">
                          <div>
                            <p className="text-sm text-muted-foreground">Performance Consistency</p>
                            <div className="flex items-center">
                              <div className="w-full bg-muted rounded-full h-2.5 mr-2">
                                <div 
                                  className="bg-primary h-2.5 rounded-full" 
                                  style={{ 
                                    // Invert variance to show consistency: higher is better
                                    width: `${Math.max(0, 100 - (alliance.performanceVariance * 25))}%`
                                  }}
                                ></div>
                              </div>
                              <span className="text-sm font-medium">
                                {alliance.performanceVariance < 0.5 ? "High" : 
                                 alliance.performanceVariance < 1.0 ? "Medium" : "Low"}
                              </span>
                            </div>
                          </div>
                          
                          <div>
                            <p className="text-sm text-muted-foreground">Climbing Success Rate</p>
                            <div className="flex items-center">
                              <div className="w-full bg-muted rounded-full h-2.5 mr-2">
                                <div 
                                  className="bg-primary h-2.5 rounded-full" 
                                  style={{ width: `${alliance.climbSuccessRate * 100}%` }}
                                ></div>
                              </div>
                              <span className="text-sm font-medium">{(alliance.climbSuccessRate * 100).toFixed(0)}%</span>
                            </div>
                          </div>
                          
                          <div>
                            <p className="text-sm text-muted-foreground">Role Coverage</p>
                            <div className="flex items-center">
                              <div className="w-full bg-muted rounded-full h-2.5 mr-2">
                                <div 
                                  className="bg-primary h-2.5 rounded-full" 
                                  style={{ width: `${alliance.roleCoverage * 100}%` }}
                                ></div>
                              </div>
                              <span className="text-sm font-medium">{(alliance.roleCoverage * 100).toFixed(0)}%</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8">
                      <p className="text-muted-foreground mb-4">No alliance selected</p>
                      <p className="text-sm text-center max-w-md">
                        Generate alliance recommendations or select teams to see analysis.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AllianceAdvisor;
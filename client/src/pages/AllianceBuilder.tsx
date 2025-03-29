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
import { 
  Star, 
  StarOff, 
  PlusCircle, 
  Trash2, 
  Save, 
  RotateCw, 
  CheckCircle, 
  XCircle, 
  Filter, 
  Cloud, 
  Database, 
  FileText, 
  Download, 
  FileJson, 
  Brain, 
  Loader2 
} from "lucide-react";
import { formSubmitVibration } from "@/lib/haptics";
import { useOnlineStatus } from "@/hooks/use-online-status";
import { PDFDownloadLink } from "@react-pdf/renderer";
import { AllianceReportPDF } from "@/components/pdf/AllianceReportPDF";
import { RecommendationEngine } from "@/components/ai/RecommendationEngine";

const AllianceBuilder = () => {
  const [teams, setTeams] = useState<TeamStatistics[]>([]);
  const [selectedTeams, setSelectedTeams] = useState<string[]>([]);
  const [alliance, setAlliance] = useState<Alliance | null>(null);
  const [alliancePresets, setAlliancePresets] = useState<(Alliance & { id: string; name: string; isFavorite?: boolean })[]>([]);
  const [presetName, setPresetName] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("builder");
  const [isPdfReady, setIsPdfReady] = useState(false);
  
  // For Advisor functionality
  const [includedTeams, setIncludedTeams] = useState<string[]>([]);
  const [excludedTeams, setExcludedTeams] = useState<string[]>([]);
  const [alliances, setAlliances] = useState<Alliance[]>([]);
  const [isCalculating, setIsCalculating] = useState(false);
  const [sortCriteria, setSortCriteria] = useState<keyof Alliance["combinedAverages"]>("overall");
  
  const { toast } = useToast();
  const { isOnline } = useOnlineStatus();

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
  
  // Calculate alliance when selected teams change
  useEffect(() => {
    const calculateAlliance = async () => {
      if (selectedTeams.length === 0) {
        setAlliance(null);
        return;
      }
      
      try {
        const calculatedAlliance = await buildAlliance(selectedTeams);
        setAlliance(calculatedAlliance);
      } catch (error) {
        console.error("Error calculating alliance:", error);
        toast({
          title: "Error",
          description: "Failed to calculate alliance statistics",
          variant: "destructive"
        });
      }
    };
    
    calculateAlliance();
  }, [selectedTeams, toast]);

  const handleTeamSelect = (index: number, teamNumber: string) => {
    formSubmitVibration();
    const newSelectedTeams = [...selectedTeams];
    
    // Add or replace team at specified position
    if (index >= newSelectedTeams.length) {
      // Add new position
      while (newSelectedTeams.length < index) {
        newSelectedTeams.push("");
      }
      newSelectedTeams.push(teamNumber);
    } else {
      // Replace existing position
      newSelectedTeams[index] = teamNumber;
    }
    
    setSelectedTeams(newSelectedTeams);
  };

  const handleRemoveTeam = (index: number) => {
    formSubmitVibration();
    const newSelectedTeams = [...selectedTeams];
    newSelectedTeams.splice(index, 1);
    setSelectedTeams(newSelectedTeams);
  };

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
      
      if (selectedTeams.length === 0) {
        toast({
          title: "Error",
          description: "Please select at least one team for the alliance",
          variant: "destructive"
        });
        return;
      }
      
      setIsSaving(true);
      formSubmitVibration();
      
      // Save alliance preset
      await saveAlliancePreset(presetName, selectedTeams, isFavorite);
      
      // Refresh presets
      const presets = await getAllAlliancePresets();
      setAlliancePresets(presets);
      
      toast({
        title: "Success",
        description: "Alliance saved successfully",
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

  const handleDeletePreset = async (id: string) => {
    try {
      formSubmitVibration();
      await deleteAlliancePreset(id);
      
      // Refresh presets
      const presets = await getAllAlliancePresets();
      setAlliancePresets(presets);
      
      toast({
        title: "Success",
        description: "Alliance deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting alliance preset:", error);
      toast({
        title: "Error",
        description: "Failed to delete alliance preset",
        variant: "destructive"
      });
    }
  };

  const handleLoadPreset = (preset: Alliance & { id: string; name: string }) => {
    formSubmitVibration();
    setSelectedTeams(preset.teams);
    setAlliance(preset);
  };

  const refreshAlliance = async () => {
    formSubmitVibration();
    if (selectedTeams.length === 0) return;
    
    try {
      const calculatedAlliance = await buildAlliance(selectedTeams);
      setAlliance(calculatedAlliance);
      
      toast({
        title: "Alliance Refreshed",
        description: "Alliance statistics have been recalculated"
      });
    } catch (error) {
      console.error("Error refreshing alliance:", error);
      toast({
        title: "Error",
        description: "Failed to refresh alliance",
        variant: "destructive"
      });
    }
  };
  
  // Alliance Advisor Functions
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
  
  const handleClearFilters = () => {
    formSubmitVibration();
    setIncludedTeams([]);
    setExcludedTeams([]);
    setAlliances([]);
    setAlliance(null);
    setSelectedTeams([]);
  };
  
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
            Loading Alliance Builder
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold gradient-text inline-block">Alliance Builder</h1>
          <p className="text-muted-foreground">
            Create custom alliances to analyze team synergy and performance potential
          </p>
        </div>
        
        <Tabs defaultValue="builder" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="builder">Alliance Builder</TabsTrigger>
            <TabsTrigger value="advisor">Alliance Advisor</TabsTrigger>
          </TabsList>
          
          <TabsContent value="builder" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              {/* Team Selection */}
              <Card className="md:col-span-5">
                <CardHeader>
                  <CardTitle>Select Teams</CardTitle>
                  <CardDescription>
                    Add up to 3 teams to your alliance
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Array(3).fill(0).map((_, index) => (
                      <div key={index} className="space-y-2">
                        <Label htmlFor={`team-${index}`}>Team {index + 1}</Label>
                        <div className="flex space-x-2">
                          <Select 
                            value={selectedTeams[index] || ""}
                            onValueChange={(value) => handleTeamSelect(index, value)}
                          >
                            <SelectTrigger id={`team-${index}`}>
                              <SelectValue placeholder="Select a team" />
                            </SelectTrigger>
                            <SelectContent>
                              {teams.map((team) => (
                                <SelectItem key={team.teamNumber} value={team.teamNumber}>
                                  {team.teamNumber} - {team.teamName}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          
                          {selectedTeams[index] && (
                            <Button 
                              variant="outline" 
                              size="icon"
                              onClick={() => handleRemoveTeam(index)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-6 space-y-2">
                    <Label htmlFor="preset-name">Alliance Name</Label>
                    <div className="flex space-x-2">
                      <Input 
                        id="preset-name"
                        value={presetName}
                        onChange={(e) => setPresetName(e.target.value)}
                        placeholder="Enter a name for this alliance"
                      />
                      <Button 
                        onClick={() => handleSavePreset(true)}
                        disabled={!presetName.trim() || selectedTeams.length === 0 || isSaving}
                        variant="default"
                      >
                        {isSaving ? (
                          <>
                            <TeamMascotSpinner variant="secondary" size="sm" className="mr-2" />
                            Saving
                          </>
                        ) : (
                          <>
                            <Star className="h-4 w-4 mr-2" />
                            Save
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                  
                  <Button className="w-full mt-4" onClick={refreshAlliance} disabled={selectedTeams.length === 0}>
                    <RotateCw className="h-4 w-4 mr-2" />
                    Refresh Alliance Stats
                  </Button>
                </CardContent>
              </Card>

              {/* Alliance Stats */}
              <Card className="md:col-span-7">
                <CardHeader>
                  <CardTitle>Alliance Statistics</CardTitle>
                  <CardDescription>
                    Detailed performance metrics for the selected teams
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {alliance ? (
                    <div className="space-y-4">
                      <div className="bg-muted rounded-md p-4">
                        <h3 className="font-medium mb-2">Teams</h3>
                        <div className="flex flex-wrap gap-2">
                          {alliance.teams.map((team) => {
                            const teamData = teams.find(t => t.teamNumber === team);
                            return (
                              <Badge key={team} variant="outline">
                                {team} {teamData?.teamName ? `- ${teamData.teamName}` : ''}
                              </Badge>
                            );
                          })}
                        </div>
                      </div>
                      
                      {/* Combined Averages */}
                      <div>
                        <h3 className="font-medium mb-2">Combined Performance</h3>
                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-2 lg:grid-cols-3">
                          {Object.entries(alliance.combinedAverages).map(([key, value]) => (
                            <div key={key} className="bg-card rounded border p-2">
                              <div className="text-xs text-muted-foreground">
                                {key.charAt(0).toUpperCase() + key.slice(1)}
                              </div>
                              <div className="text-xl font-semibold">{value.toFixed(1)}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      {/* PDF Download */}
                      <div className="bg-muted rounded-md p-4 mt-4">
                        <h3 className="font-medium mb-2">Alliance Report</h3>
                        <div className="flex space-x-2">
                          <Button
                            onClick={() => setIsPdfReady(true)}
                            disabled={isPdfReady}
                          >
                            <FileText className="h-4 w-4 mr-2" />
                            {isPdfReady ? "PDF Ready" : "Prepare PDF"}
                          </Button>
                          
                          {isPdfReady && (
                            <PDFDownloadLink
                              document={<AllianceReportPDF alliance={alliance} teams={teams} />}
                              fileName={`alliance-${alliance.teams.join("-")}.pdf`}
                            >
                              {({ loading }) => (
                                <Button variant="outline" disabled={loading}>
                                  <Download className="h-4 w-4 mr-2" />
                                  Download PDF
                                </Button>
                              )}
                            </PDFDownloadLink>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                          Generate a PDF report with detailed alliance statistics for printing and sharing
                        </p>
                      </div>
                      
                      {/* AI Recommendation */}
                      <div className="bg-card rounded-md border p-4 mt-4">
                        <div className="flex items-center mb-3">
                          <Brain className="h-5 w-5 mr-2 text-primary" />
                          <h3 className="font-medium">Alliance Intelligence</h3>
                        </div>
                        
                        <div className="text-sm">
                          <RecommendationEngine alliance={alliance} />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="text-muted-foreground mb-2">
                        Select teams to see alliance statistics
                      </div>
                      <PlusCircle className="h-8 w-8 mx-auto text-muted-foreground/50" />
                    </div>
                  )}
                </CardContent>
              </Card>
              
              {/* Saved Alliances */}
              {alliancePresets.length > 0 && (
                <Card className="md:col-span-12">
                  <CardHeader>
                    <CardTitle>Saved Alliances</CardTitle>
                    <CardDescription>
                      Load a previously saved alliance
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      {alliancePresets.map((preset) => (
                        <Card key={preset.id} className="overflow-hidden">
                          <CardContent className="p-3">
                            <div className="font-medium mb-1 flex items-center">
                              {preset.name}
                              {preset.isFavorite && <Star className="h-3 w-3 ml-1 text-yellow-500 inline" />}
                            </div>
                            <div className="text-xs text-muted-foreground mb-2">
                              {preset.teams.join(", ")}
                            </div>
                            <div className="flex justify-between">
                              <Button variant="outline" size="sm" onClick={() => handleLoadPreset(preset)}>
                                Load
                              </Button>
                              <Button variant="outline" size="sm" onClick={() => handleDeletePreset(preset.id)}>
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="advisor" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              {/* Configuration Panel */}
              <Card className="md:col-span-5">
                <CardHeader>
                  <CardTitle>Alliance Advisor</CardTitle>
                  <CardDescription>
                    Get AI recommendations for optimal alliance combinations
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Team Filters */}
                    <div>
                      <h3 className="text-sm font-medium mb-2">Team Constraints</h3>
                      
                      {/* Included Teams */}
                      <div className="space-y-2 mb-4">
                        <Label>Required Teams</Label>
                        <div className="flex flex-wrap gap-2">
                          {includedTeams.length > 0 ? (
                            includedTeams.map(team => (
                              <Badge key={team} variant="default" className="px-2 py-1 h-auto">
                                {team}
                                <button 
                                  className="ml-1 text-foreground/80 hover:text-foreground" 
                                  onClick={() => handleRemoveIncluded(team)}
                                >
                                  <XCircle className="h-3 w-3" />
                                </button>
                              </Badge>
                            ))
                          ) : (
                            <div className="text-xs text-muted-foreground">
                              No teams added. Choose teams to include below.
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Excluded Teams */}
                      <div className="space-y-2 mb-4">
                        <Label>Excluded Teams</Label>
                        <div className="flex flex-wrap gap-2">
                          {excludedTeams.length > 0 ? (
                            excludedTeams.map(team => (
                              <Badge key={team} variant="destructive" className="px-2 py-1 h-auto">
                                {team}
                                <button 
                                  className="ml-1 text-foreground/80 hover:text-foreground" 
                                  onClick={() => handleRemoveExcluded(team)}
                                >
                                  <XCircle className="h-3 w-3" />
                                </button>
                              </Badge>
                            ))
                          ) : (
                            <div className="text-xs text-muted-foreground">
                              No teams excluded. Choose teams to exclude below.
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Sorting Criteria */}
                      <div className="space-y-2 mb-4">
                        <Label htmlFor="sort-criteria">Sort Alliances By</Label>
                        <Select 
                          value={sortCriteria} 
                          onValueChange={(value) => setSortCriteria(value as keyof Alliance["combinedAverages"])}
                        >
                          <SelectTrigger id="sort-criteria">
                            <SelectValue placeholder="Select criteria" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="overall">Overall Score</SelectItem>
                            <SelectItem value="coralPlacement">Coral Placement</SelectItem>
                            <SelectItem value="algaeCollection">Algae Collection</SelectItem>
                            <SelectItem value="climbing">Climbing</SelectItem>
                            <SelectItem value="defense">Defense</SelectItem>
                            <SelectItem value="speed">Speed</SelectItem>
                            <SelectItem value="reliability">Reliability</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      {/* Generate Button */}
                      <div className="flex gap-2 mt-6">
                        <Button 
                          className="flex-1"
                          onClick={generateAlliances}
                          disabled={isCalculating}
                          variant="default"
                        >
                          {isCalculating ? (
                            <>
                              <TeamMascotSpinner variant="primary" size="sm" className="mr-2" />
                              Generating
                            </>
                          ) : (
                            <>Generate Alliances</>
                          )}
                        </Button>
                        
                        <Button 
                          onClick={handleClearFilters}
                          variant="outline"
                          disabled={isCalculating || (includedTeams.length === 0 && excludedTeams.length === 0)}
                        >
                          Clear Filters
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Available Teams */}
              <Card className="md:col-span-7">
                <CardHeader>
                  <CardTitle>Available Teams</CardTitle>
                  <CardDescription>
                    Click to include (+) or exclude (-) teams from your alliance
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-[300px] overflow-y-auto">
                    {teams.map((team) => {
                      const isIncluded = includedTeams.includes(team.teamNumber);
                      const isExcluded = excludedTeams.includes(team.teamNumber);
                      
                      return (
                        <div 
                          key={team.teamNumber}
                          className={`border rounded-md p-2 ${
                            isIncluded ? 'border-green-500 bg-green-50 dark:bg-green-900/20' : 
                            isExcluded ? 'border-red-500 bg-red-50 dark:bg-red-900/20' : 
                            'border-border'
                          }`}
                        >
                          <div className="flex justify-between">
                            <div>
                              <div className="font-medium">{team.teamNumber}</div>
                              <div className="text-xs text-muted-foreground truncate">{team.teamName}</div>
                            </div>
                            <div className="flex space-x-1">
                              <Button 
                                size="sm" 
                                variant={isIncluded ? "default" : "outline"}
                                className="h-7 w-7 p-0"
                                onClick={() => handleIncludeTeam(team.teamNumber)}
                                disabled={isExcluded}
                              >
                                <PlusCircle className="h-3.5 w-3.5" />
                              </Button>
                              <Button 
                                size="sm" 
                                variant={isExcluded ? "default" : "outline"}
                                className="h-7 w-7 p-0"
                                onClick={() => handleExcludeTeam(team.teamNumber)}
                                disabled={isIncluded}
                              >
                                <XCircle className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  
                  {/* Show calculated alliances */}
                  {alliances.length > 0 && (
                    <div className="mt-8">
                      <h3 className="text-lg font-semibold mb-2">Generated Alliances</h3>
                      <div className="space-y-3">
                        {alliances.map((allianceData, idx) => (
                          <Card key={idx} className={`overflow-hidden ${
                            allianceData.teams.toString() === (alliance?.teams.toString() || '') ? 
                            'border-primary' : ''
                          }`}>
                            <CardContent className="p-4">
                              <div className="flex justify-between items-start">
                                <div>
                                  <div className="font-medium">Alliance #{idx + 1}</div>
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {allianceData.teams.map((team) => {
                                      const teamData = teams.find(t => t.teamNumber === team);
                                      return (
                                        <Badge key={team} variant="outline" className="text-xs">
                                          {team} {teamData?.teamName ? `- ${teamData.teamName}` : ''}
                                        </Badge>
                                      );
                                    })}
                                  </div>
                                  <div className="text-xs text-muted-foreground mt-2">
                                    {sortCriteria.charAt(0).toUpperCase() + sortCriteria.slice(1)} Score: {allianceData.combinedAverages[sortCriteria].toFixed(1)}/7
                                  </div>
                                </div>
                                <Button 
                                  size="sm" 
                                  onClick={() => handleSelectAlliance(allianceData)}
                                  variant={allianceData.teams.toString() === (alliance?.teams.toString() || '') ? "default" : "outline"}
                                  className="h-8"
                                >
                                  {allianceData.teams.toString() === (alliance?.teams.toString() || '') ? (
                                    <>Selected</>
                                  ) : (
                                    <>Select</>
                                  )}
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
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

export default AllianceBuilder;
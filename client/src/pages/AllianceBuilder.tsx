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
import { Star, StarOff, PlusCircle, Trash2, Save, RotateCw, CheckCircle, XCircle, Filter, Cloud, Database, FileText, Download, FileJson, Brain } from "lucide-react";
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
  const [activeTab, setActiveTab] = useState<string>("builder");
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
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button 
                onClick={refreshAlliance}
                variant="outline"
                disabled={selectedTeams.length === 0}
              >
                <RotateCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </CardFooter>
          </Card>

          {/* Alliance Analysis */}
          <Card className="md:col-span-7">
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
                  
                  {/* Climbing breakdown */}
                  <div>
                    <h3 className="text-sm font-medium mb-2">Climbing Capabilities</h3>
                    <div className="grid grid-cols-5 gap-2">
                      <div className="text-center">
                        <div className="text-2xl font-bold">{alliance.climbingBreakdown.noData || 0}</div>
                        <div className="text-xs text-muted-foreground">No Data</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold">{alliance.climbingBreakdown.none || 0}</div>
                        <div className="text-xs text-muted-foreground">None</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold">{alliance.climbingBreakdown.park || 0}</div>
                        <div className="text-xs text-muted-foreground">Park</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold">{alliance.climbingBreakdown.shallow || 0}</div>
                        <div className="text-xs text-muted-foreground">Shallow</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold">{alliance.climbingBreakdown.deep || 0}</div>
                        <div className="text-xs text-muted-foreground">Deep</div>
                      </div>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  {/* Strengths & Weaknesses */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-sm font-medium mb-2">Strengths</h3>
                      <ul className="list-disc list-inside text-sm space-y-1">
                        {alliance.strengths.map((strength, idx) => (
                          <li key={idx} className="text-green-500 dark:text-green-400">
                            <span className="text-foreground">{strength}</span>
                          </li>
                        ))}
                        {alliance.strengths.length === 0 && (
                          <li className="text-muted-foreground">No notable strengths</li>
                        )}
                      </ul>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium mb-2">Weaknesses</h3>
                      <ul className="list-disc list-inside text-sm space-y-1">
                        {alliance.weaknesses.map((weakness, idx) => (
                          <li key={idx} className="text-red-500 dark:text-red-400">
                            <span className="text-foreground">{weakness}</span>
                          </li>
                        ))}
                        {alliance.weaknesses.length === 0 && (
                          <li className="text-muted-foreground">No notable weaknesses</li>
                        )}
                      </ul>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  {/* Synergy Score */}
                  <div className="text-center">
                    <h3 className="text-sm font-medium mb-2">Alliance Synergy</h3>
                    <div className="relative pt-1">
                      <div className="flex mb-2 items-center justify-between">
                        <div className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-primary bg-primary/10">
                          Score: {alliance.synergy}/10
                        </div>
                      </div>
                      <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-muted">
                        <div 
                          style={{ width: `${(alliance.synergy / 10) * 100}%` }} 
                          className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-primary"
                        />
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {alliance.synergy >= 8 ? "Excellent team synergy!" : 
                       alliance.synergy >= 6 ? "Good team synergy" : 
                       alliance.synergy >= 4 ? "Average team synergy" : 
                       "Low team synergy - consider different team combinations"}
                    </p>
                  </div>
                  
                  {/* Save Alliance */}
                  <div className="pt-4">
                    <div className="flex items-center space-x-4">
                      <Input 
                        placeholder="Alliance name" 
                        value={presetName}
                        onChange={(e) => setPresetName(e.target.value)}
                      />
                      <Button 
                        onClick={() => handleSavePreset(false)}
                        disabled={isSaving || !presetName.trim()}
                      >
                        <Save className="h-4 w-4 mr-2" />
                        Save
                      </Button>
                      <Button 
                        variant="outline"
                        onClick={() => handleSavePreset(true)}
                        disabled={isSaving || !presetName.trim()}
                      >
                        <Star className="h-4 w-4 mr-2" />
                        Favorite
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-64 text-center">
                  <p className="text-muted-foreground">
                    Select teams to see alliance analysis
                  </p>
                </div>
              )}
            </CardContent>
            {alliance && (
              <CardFooter className="flex flex-wrap justify-between gap-2">
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center"
                    onClick={() => {
                      formSubmitVibration();
                      setIsPdfReady(true);
                    }}
                    disabled={!alliance || alliance.teams.length === 0}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Export Report
                  </Button>
                  {isPdfReady && alliance && (
                    <PDFDownloadLink 
                      document={
                        <AllianceReportPDF 
                          alliance={alliance} 
                          teamDetails={teams.filter(t => alliance.teams.includes(t.teamNumber))}
                          presetName={presetName.trim() || "Custom Alliance"}
                        />
                      } 
                      fileName={`alliance-report-${new Date().toISOString().split('T')[0]}.pdf`}
                    >
                      {({ loading, error }) => (
                        <Button
                          size="sm"
                          className="flex items-center"
                          disabled={loading || Boolean(error)}
                          onClick={() => formSubmitVibration()}
                        >
                          {loading ? (
                            <>
                              <div className="mr-2 h-4 w-4">
                                <TeamMascotSpinner size="sm" speed="fast" variant="subtle" />
                              </div>
                              Preparing PDF...
                            </>
                          ) : (
                            <>
                              <Download className="h-4 w-4 mr-2" />
                              Download PDF
                            </>
                          )}
                        </Button>
                      )}
                    </PDFDownloadLink>
                  )}
                </div>
                
                <div className="flex space-x-2">
                  <Input
                    placeholder="Alliance name"
                    value={presetName}
                    onChange={(e) => setPresetName(e.target.value)}
                    className="w-44"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleSavePreset(true)}
                    disabled={isSaving || selectedTeams.length === 0 || !presetName.trim()}
                    title="Save as favorite"
                  >
                    <Star className="h-4 w-4 text-yellow-500" />
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleSavePreset(false)}
                    disabled={isSaving || selectedTeams.length === 0 || !presetName.trim()}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save
                  </Button>
                </div>
              </CardFooter>
            )}
          </Card>
        </div>
        
        {/* AI Recommendation Engine */}
        <div className="mb-6">
          <RecommendationEngine 
            teams={teams}
            selectedTeams={selectedTeams}
            alliance={alliance}
            onRecommendTeam={(teamNumber) => {
              // Find the next available position or update an empty position
              const emptyIndex = selectedTeams.findIndex(team => team === "");
              if (emptyIndex >= 0) {
                handleTeamSelect(emptyIndex, teamNumber);
              } else if (selectedTeams.length < 3) {
                handleTeamSelect(selectedTeams.length, teamNumber);
              } else {
                toast({
                  title: "Alliance Full",
                  description: "Remove a team first to add this recommendation",
                  variant: "destructive"
                });
              }
            }}
          />
        </div>
        
        {/* Saved Alliances */}
        <Card>
          <CardHeader>
            <CardTitle>Saved Alliances</CardTitle>
            <CardDescription>
              Your previously saved alliance configurations
            </CardDescription>
          </CardHeader>
          <CardContent>
            {alliancePresets.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Teams</TableHead>
                    <TableHead>Synergy</TableHead>
                    <TableHead>Overall</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {alliancePresets.map((preset) => (
                    <TableRow key={preset.id}>
                      <TableCell className="font-medium flex items-center">
                        {preset.isFavorite && <Star className="h-4 w-4 mr-2 text-yellow-500" />}
                        {preset.name}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {preset.teams.map((team, idx) => (
                            <Badge key={idx} variant="outline" className="px-1 py-0 text-xs">
                              {team}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          preset.synergy >= 7 
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100" 
                            : preset.synergy >= 5 
                              ? "bg-primary-foreground/20 text-primary" 
                              : "bg-destructive/10 text-destructive"
                        }`}>
                          {preset.synergy}/10
                        </div>
                      </TableCell>
                      <TableCell>
                        {preset.combinedAverages.overall.toFixed(1)}/7
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleLoadPreset(preset)}
                          >
                            Load
                          </Button>
                          
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button 
                                variant="destructive" 
                                size="sm"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Delete Alliance</DialogTitle>
                                <DialogDescription>
                                  Are you sure you want to delete the alliance "{preset.name}"? 
                                  This action cannot be undone.
                                </DialogDescription>
                              </DialogHeader>
                              <DialogFooter className="gap-2 sm:gap-0">
                                <DialogClose asChild>
                                  <Button type="button" variant="secondary">
                                    Cancel
                                  </Button>
                                </DialogClose>
                                <Button 
                                  type="button" 
                                  variant="destructive"
                                  onClick={() => handleDeletePreset(preset.id)}
                                >
                                  Delete
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                <p>No saved alliances yet</p>
                <p className="text-sm">Save an alliance above to see it here</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AllianceBuilder;
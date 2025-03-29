import { useState, useEffect } from 'react';
import { Database, List, BarChart } from 'lucide-react';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import TeamMascotSpinner from "../ui/team-mascot-spinner";
import { generateMatchEntries, setExistingTeams } from "@/lib/testDataGenerator";
import { addMatchEntry, getAllTeams } from "@/lib/db";
import type { MatchEntry } from "../../lib/types";
import type { TeamStatistics } from "@shared/schema";

// Secret key for accessing test data generator (to prevent accidental generation)
const SECRET_KEY = "270773";

/**
 * TestDataGenerator component for generating test data for the app
 * Protected by a secret key to prevent accidental data generation
 */
export default function TestDataGenerator() {
  const [isOpen, setIsOpen] = useState(false);
  const [key, setKey] = useState('');
  const [isKeyValid, setIsKeyValid] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [dataCount, setDataCount] = useState(10);
  const [teamsList, setTeamsList] = useState<{teamNumber: string, teamName: string}[]>([]);
  const [useExistingTeams, setUseExistingTeams] = useState(true);
  const [showDataViewer, setShowDataViewer] = useState(false);
  const [generatedData, setGeneratedData] = useState<MatchEntry[]>([]);
  const { toast } = useToast();
  
  // Fetch existing teams from the database when the component mounts or dialog opens
  useEffect(() => {
    if (isOpen && isKeyValid) {
      fetchTeams();
    }
  }, [isOpen, isKeyValid]);
  
  // Fetch teams from the database
  const fetchTeams = async () => {
    setIsLoading(true);
    try {
      const teams = await getAllTeams();
      // Convert teams to the simpler format we need
      const simplifiedTeams = teams.map(team => ({
        teamNumber: team.teamNumber,
        teamName: team.teamName
      }));
      setTeamsList(simplifiedTeams);
      
      // Set the team numbers in the generator
      const teamNumbers = simplifiedTeams.map(team => team.teamNumber);
      console.log("Team data initialized with", teamNumbers.length, "teams");
      setExistingTeams(teamNumbers);
    } catch (error) {
      console.error("Error fetching teams:", error);
      toast({
        title: "Error",
        description: "Failed to fetch teams. Using random team numbers instead.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Validate the key
  const validateKey = (enteredKey: string) => {
    setKey(enteredKey);
    setIsKeyValid(enteredKey === SECRET_KEY);
  };

  // Converts null to undefined for compatibility with the MatchEntry type
  const adaptMatchEntry = (entry: any): Omit<MatchEntry, 'id'> => {
    // Convert all null comment values to undefined
    const adapted = { ...entry };
    if (adapted.defenseComment === null) adapted.defenseComment = undefined;
    if (adapted.avoidingDefenseComment === null) adapted.avoidingDefenseComment = undefined;
    if (adapted.scoringAlgaeComment === null) adapted.scoringAlgaeComment = undefined;
    if (adapted.scoringCoralsComment === null) adapted.scoringCoralsComment = undefined;
    if (adapted.autonomousComment === null) adapted.autonomousComment = undefined;
    if (adapted.drivingSkillComment === null) adapted.drivingSkillComment = undefined;
    if (adapted.climbingComment === null) adapted.climbingComment = undefined;
    if (adapted.comments === null) adapted.comments = undefined;
    
    return adapted as Omit<MatchEntry, 'id'>;
  };

  // Generate random test data
  const generateData = async () => {
    if (!isKeyValid) return;
    
    setIsGenerating(true);
    try {
      // Make sure we're using the correct team selection method
      if (!useExistingTeams) {
        // Reset to using random team numbers
        setExistingTeams([]);
      } else if (teamsList.length > 0) {
        // Set the existing teams for the generator to use
        setExistingTeams(teamsList.map(team => team.teamNumber));
      }
      
      // Generate random match entries
      const entries = generateMatchEntries(dataCount);
      const adaptedEntries = entries.map(entry => adaptMatchEntry(entry));
      setGeneratedData(adaptedEntries as MatchEntry[]);
      
      // Add each entry to the database
      let successCount = 0;
      for (const entry of adaptedEntries) {
        try {
          await addMatchEntry(entry);
          successCount++;
        } catch (error) {
          console.error("Error adding match entry:", error);
        }
      }
      
      toast({
        title: "Test Data Generated",
        description: `Successfully generated ${successCount} match entries.`,
      });
      
      // Show the data viewer with the generated data
      setShowDataViewer(true);
    } catch (error) {
      console.error("Error generating test data:", error);
      toast({
        title: "Error",
        description: "Failed to generate test data. Check console for details.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Component to view the generated data
  const DataViewer = () => {
    if (generatedData.length === 0) return null;
    
    return (
      <Dialog open={showDataViewer} onOpenChange={setShowDataViewer}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Generated Test Data</DialogTitle>
            <DialogDescription>
              {generatedData.length} entries generated for {new Set(generatedData.map(d => d.team)).size} teams
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted">
                  <tr>
                    <th className="p-2 text-left">Team</th>
                    <th className="p-2 text-left">Match</th>
                    <th className="p-2 text-left">Alliance</th>
                    <th className="p-2 text-left">Defense</th>
                    <th className="p-2 text-left">Algae</th>
                    <th className="p-2 text-left">Corals</th>
                    <th className="p-2 text-left">Climbing</th>
                    <th className="p-2 text-left">Overall</th>
                  </tr>
                </thead>
                <tbody>
                  {generatedData.slice(0, 50).map((entry, idx) => (
                    <tr key={idx} className={idx % 2 === 0 ? 'bg-background' : 'bg-muted/30'}>
                      <td className="p-2">{entry.team}</td>
                      <td className="p-2">{entry.matchType} {entry.matchNumber}</td>
                      <td className="p-2">{entry.alliance}</td>
                      <td className="p-2">{entry.defense}</td>
                      <td className="p-2">{entry.scoringAlgae}</td>
                      <td className="p-2">{entry.scoringCorals}</td>
                      <td className="p-2">{entry.climbing}</td>
                      <td className="p-2">{entry.overall}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
          <DialogFooter>
            <Button onClick={() => setShowDataViewer(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };

  return (
    <>
      {/* Data Viewer Dialog */}
      <DataViewer />
      
      {/* Generator Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="fixed bottom-4 right-4 rounded-full h-10 w-10 shadow-md"
            onClick={() => setIsOpen(true)}
          >
            <Database className="h-4 w-4" />
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Test Data Generator</DialogTitle>
            <DialogDescription>
              Generate random match data for testing purposes.
            </DialogDescription>
          </DialogHeader>

          {!isKeyValid ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="secretKey">Enter Secret Key</Label>
                <Input
                  id="secretKey"
                  type="password"
                  value={key}
                  onChange={(e) => validateKey(e.target.value)}
                  placeholder="Enter access key"
                />
              </div>
              <div className="text-xs text-muted-foreground">
                This tool is for development and testing only. 
                Please enter the secret key to continue.
              </div>
            </div>
          ) : (
            <Tabs defaultValue="basic">
              <TabsList className="grid grid-cols-2">
                <TabsTrigger value="basic">Basic</TabsTrigger>
                <TabsTrigger value="advanced">Advanced</TabsTrigger>
              </TabsList>
              
              <TabsContent value="basic" className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label htmlFor="dataCount">Number of Entries: {dataCount}</Label>
                  </div>
                  <Slider
                    id="dataCount"
                    min={1}
                    max={50}
                    step={1}
                    value={[dataCount]}
                    onValueChange={(value) => setDataCount(value[0])}
                  />
                </div>
                
                <div className="flex items-center space-x-2 py-2">
                  <Switch
                    id="use-existing-teams"
                    checked={useExistingTeams}
                    onCheckedChange={setUseExistingTeams}
                  />
                  <Label htmlFor="use-existing-teams">
                    Use existing teams {isLoading && <TeamMascotSpinner size="sm" className="inline-block ml-1" />}
                  </Label>
                </div>
                
                {useExistingTeams && (
                  <div className="text-xs text-muted-foreground">
                    Using {teamsList.length} teams from the database for data generation.
                  </div>
                )}
                
                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => setIsOpen(false)}
                    disabled={isGenerating}
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={generateData}
                    disabled={isGenerating}
                  >
                    {isGenerating ? (
                      <TeamMascotSpinner size="sm" />
                    ) : (
                      "Generate Data"
                    )}
                  </Button>
                </div>
              </TabsContent>
              
              <TabsContent value="advanced" className="space-y-4">
                <div className="text-sm">
                  The advanced generator creates realistic data following the REEFSCAPE game rules:
                  <ul className="list-disc pl-5 text-xs mt-2 space-y-1 text-muted-foreground">
                    <li>Ratings follow realistic distributions</li>
                    <li>CORAL and ALGAE scoring metrics</li>
                    <li>CAGE climbing levels (None, Park, Shallow, Deep)</li>
                    <li>Team-specific performance consistency</li>
                    <li>Appropriate comments reflecting performance</li>
                  </ul>
                </div>
                
                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => setIsOpen(false)}
                    disabled={isGenerating}
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={generateData}
                    disabled={isGenerating}
                  >
                    {isGenerating ? (
                      <TeamMascotSpinner size="sm" />
                    ) : (
                      "Generate Advanced Data"
                    )}
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
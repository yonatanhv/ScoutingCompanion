import { useState } from 'react';
import { Database } from 'lucide-react';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import TeamMascotSpinner from "../ui/team-mascot-spinner";
import { generateMatchEntries } from "@/lib/testDataGenerator";
import { addMatchEntry } from "@/lib/db";
import type { MatchEntry } from "../../lib/types";

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
  const [dataCount, setDataCount] = useState(10);
  const { toast } = useToast();

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
      // Generate random match entries
      const entries = generateMatchEntries(dataCount);
      
      // Add each entry to the database
      let successCount = 0;
      for (const entry of entries) {
        try {
          // Adapt entry to match expected MatchEntry type (null → undefined for comments)
          await addMatchEntry(adaptMatchEntry(entry));
          successCount++;
        } catch (error) {
          console.error("Error adding match entry:", error);
        }
      }
      
      toast({
        title: "Test Data Generated",
        description: `Successfully generated ${successCount} match entries.`,
      });
    } catch (error) {
      console.error("Error generating test data:", error);
      toast({
        title: "Error",
        description: "Failed to generate test data. Check console for details.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
      setIsOpen(false);
    }
  };

  return (
    <>
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
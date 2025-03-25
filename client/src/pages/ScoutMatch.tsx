import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { RatingInput, CommentArea } from "@/components/ui/rating-input";
import { teams, matchTypes, climbingTypes, ratingCategories } from "@/lib/teamData";
import { addMatchEntry } from "@/lib/db";
import { MatchEntry } from "@/lib/types";

export default function ScoutMatch() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState<Omit<MatchEntry, 'id' | 'timestamp'>>({
    team: "",
    matchType: "qualifications",
    matchNumber: 1,
    alliance: "",
    
    defense: 4,
    defenseComment: "",
    avoidingDefense: 4,
    avoidingDefenseComment: "",
    scoringAlgae: 4,
    scoringAlgaeComment: "",
    scoringCorals: 4,
    scoringCoralsComment: "",
    autonomous: 4,
    autonomousComment: "",
    drivingSkill: 4,
    drivingSkillComment: "",
    
    climbing: "none",
    climbingComment: "",
    
    overall: 4,
    comments: "",
  });

  // Update form data
  const updateFormData = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!formData.team) {
      toast({
        title: "Missing team",
        description: "Please select a team to scout",
        variant: "destructive",
      });
      return;
    }
    
    if (!formData.alliance) {
      toast({
        title: "Missing alliance",
        description: "Please select an alliance color",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // Add timestamp to the entry
      const entry = {
        ...formData,
        timestamp: Date.now(),
      };
      
      // Save to IndexedDB
      await addMatchEntry(entry);
      
      toast({
        title: "Success",
        description: "Match data saved successfully",
      });
      
      // Reset form
      setFormData({
        team: "",
        matchType: "qualifications",
        matchNumber: 1,
        alliance: "",
        
        defense: 4,
        defenseComment: "",
        avoidingDefense: 4,
        avoidingDefenseComment: "",
        scoringAlgae: 4,
        scoringAlgaeComment: "",
        scoringCorals: 4,
        scoringCoralsComment: "",
        autonomous: 4,
        autonomousComment: "",
        drivingSkill: 4,
        drivingSkillComment: "",
        
        climbing: "none",
        climbingComment: "",
        
        overall: 4,
        comments: "",
      });
      
    } catch (error) {
      console.error("Error saving match data:", error);
      toast({
        title: "Error",
        description: "Failed to save match data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle form reset
  const handleReset = () => {
    setFormData({
      team: "",
      matchType: "qualifications",
      matchNumber: 1,
      alliance: "",
      
      defense: 4,
      defenseComment: "",
      avoidingDefense: 4,
      avoidingDefenseComment: "",
      scoringAlgae: 4,
      scoringAlgaeComment: "",
      scoringCorals: 4,
      scoringCoralsComment: "",
      autonomous: 4,
      autonomousComment: "",
      drivingSkill: 4,
      drivingSkillComment: "",
      
      climbing: "none",
      climbingComment: "",
      
      overall: 4,
      comments: "",
    });
  };

  return (
    <>
      {/* Desktop navigation tabs (hidden on mobile) */}
      <div className="hidden md:flex mb-6 border-b border-gray-300">
        <a href="/scout" className="tab-btn active py-2 px-4 font-medium text-primary border-b-2 border-primary">
          <i className="fas fa-clipboard-list mr-2"></i>Scout Match
        </a>
        <a href="/team" className="tab-btn py-2 px-4 font-medium text-gray-700">
          <i className="fas fa-users mr-2"></i>View Team
        </a>
        <a href="/data" className="tab-btn py-2 px-4 font-medium text-gray-700">
          <i className="fas fa-sync-alt mr-2"></i>Export / Import
        </a>
      </div>
      
      <Card>
        <CardContent className="p-4 md:p-6">
          <h2 className="text-xl font-bold mb-4">Scout Match</h2>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Match Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="team" className="block mb-1 font-medium">Team</Label>
                <Select 
                  value={formData.team} 
                  onValueChange={(value) => updateFormData("team", value)}
                >
                  <SelectTrigger>
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
              
              <div>
                <Label htmlFor="match-type" className="block mb-1 font-medium">Tournament Stage</Label>
                <Select 
                  value={formData.matchType} 
                  onValueChange={(value) => updateFormData("matchType", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Match Type" />
                  </SelectTrigger>
                  <SelectContent>
                    {matchTypes.map((matchType) => (
                      <SelectItem key={matchType.value} value={matchType.value}>
                        {matchType.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="match-number" className="block mb-1 font-medium">Match Number</Label>
                <Input
                  id="match-number"
                  type="number"
                  min={1}
                  value={formData.matchNumber}
                  onChange={(e) => updateFormData("matchNumber", parseInt(e.target.value))}
                  required
                />
              </div>
              
              <div>
                <Label className="block mb-1 font-medium">Alliance Color</Label>
                <RadioGroup
                  value={formData.alliance}
                  onValueChange={(value) => updateFormData("alliance", value)}
                  className="flex gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="red" id="red" />
                    <Label htmlFor="red" className="flex items-center">
                      <span className="inline-block w-4 h-4 mr-1 bg-red-600 rounded-full"></span>
                      Red
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="blue" id="blue" />
                    <Label htmlFor="blue" className="flex items-center">
                      <span className="inline-block w-4 h-4 mr-1 bg-blue-600 rounded-full"></span>
                      Blue
                    </Label>
                  </div>
                </RadioGroup>
              </div>
            </div>
            
            {/* Rating Fields */}
            <div className="border-t border-b border-gray-200 py-4">
              <h3 className="font-medium mb-4">Performance Ratings</h3>
              
              {/* Rating Fields */}
              {ratingCategories.map((category) => (
                <RatingInput
                  key={category.id}
                  id={category.id}
                  label={category.label}
                  value={formData[category.id as keyof typeof formData] as number}
                  comment={formData[`${category.id}Comment` as keyof typeof formData] as string}
                  onChange={(value) => updateFormData(category.id, value)}
                  onCommentChange={(comment) => updateFormData(`${category.id}Comment`, comment)}
                />
              ))}
              
              {/* Climbing */}
              <div className="mb-4">
                <Label htmlFor="climbing" className="block mb-1 font-medium">Climbing</Label>
                <Select 
                  value={formData.climbing} 
                  onValueChange={(value) => updateFormData("climbing", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Climbing Type" />
                  </SelectTrigger>
                  <SelectContent>
                    {climbingTypes.map((climbType) => (
                      <SelectItem key={climbType.value} value={climbType.value}>
                        {climbType.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  id="climbing-comment"
                  value={formData.climbingComment}
                  onChange={(e) => updateFormData("climbingComment", e.target.value)}
                  placeholder="Optional comment"
                  className="w-full mt-1 p-2 text-sm"
                />
              </div>
              
              {/* Overall Impression */}
              <RatingInput
                id="overall"
                label="Overall Impression"
                value={formData.overall}
                onChange={(value) => updateFormData("overall", value)}
              />
              
              {/* General Comments */}
              <CommentArea
                id="comments"
                label="Additional Comments"
                value={formData.comments || ""}
                onChange={(value) => updateFormData("comments", value)}
              />
            </div>
            
            {/* Form Actions */}
            <div className="flex justify-end gap-3">
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleReset}
              >
                Reset
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting}
              >
                {isSubmitting ? "Saving..." : "Save Data"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </>
  );
}

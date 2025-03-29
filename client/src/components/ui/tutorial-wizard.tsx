import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { AlertTriangle, HelpCircle, ClipboardCheck, RefreshCw, BarChart2, Users } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// Green Blitz logo component
const GreenBlitzLogo = () => (
  <svg
    width="100"
    height="100"
    viewBox="0 0 2000 2000"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="mx-auto mb-4"
  >
    <path
      d="M1000 0C447.715 0 0 447.715 0 1000C0 1552.28 447.715 2000 1000 2000C1552.28 2000 2000 1552.28 2000 1000C2000 447.715 1552.28 0 1000 0Z"
      fill="#1CB850"
    />
    <path 
      d="M1250 1250H750V750H1250V1250Z"
      fill="#00361E"
    />
    <path
      d="M1000 500L500 750V1250L1000 1500L1500 1250V750L1000 500Z"
      fill="#00361E"
    />
    <path
      d="M1000 900L800 800V1100L1000 1200L1200 1100V800L1000 900Z"
      fill="#FFFFFF"
    />
  </svg>
);

// Tutorial steps
const tutorialSteps = [
  {
    title: "Welcome to FRC Scout!",
    description: "This tutorial will guide you through the basics of using the scouting app. Let's get started!",
    image: (
      <div className="flex flex-col items-center">
        <GreenBlitzLogo />
        <div className="text-green-800 text-xl font-bold mt-2">Green Blitz SuperScouting</div>
      </div>
    ),
  },
  {
    title: "Match Scouting",
    description: "On the Scout Match page, you'll input data about a team's performance in a specific match. Always start by selecting the team number, match number, and alliance color.",
    image: (
      <div className="w-full h-48 bg-gradient-to-r from-green-800 to-green-600 rounded-xl shadow-lg flex flex-col items-center justify-center text-white p-4">
        <ClipboardCheck className="h-10 w-10 mb-2" />
        <div className="text-xl font-bold">Match Scouting Screen</div>
        <div className="text-sm mt-1 opacity-80">Track team performance in each match</div>
      </div>
    ),
  },
  {
    title: "Performance Ratings",
    description: "Rate each team's performance on a scale from 1-7, where 1 is poor and 7 is excellent. Be consistent with your ratings and add comments to explain your reasoning.",
    image: (
      <div className="w-full h-48 rounded-xl shadow overflow-hidden border border-green-200">
        <div className="bg-green-700 text-white p-2 text-center font-bold">Rating Categories</div>
        <div className="grid grid-cols-2 gap-2 p-2 bg-white">
          <div className="bg-green-50 p-2 rounded">
            <div className="font-semibold text-green-800">Defense</div>
            <div className="flex mt-1">
              {[1, 2, 3, 4, 5, 6, 7].map(num => (
                <div key={num} className={`w-5 h-5 rounded-full mx-0.5 flex items-center justify-center text-xs 
                  ${num === 6 ? 'bg-green-600 text-white' : 'bg-gray-200'}`}>
                  {num}
                </div>
              ))}
            </div>
          </div>
          <div className="bg-green-50 p-2 rounded">
            <div className="font-semibold text-green-800">Overall</div>
            <div className="flex mt-1">
              {[1, 2, 3, 4, 5, 6, 7].map(num => (
                <div key={num} className={`w-5 h-5 rounded-full mx-0.5 flex items-center justify-center text-xs 
                  ${num === 2 ? 'bg-green-600 text-white' : 'bg-gray-200'}`}>
                  {num}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    ),
  },
  {
    title: "Consistency Warning System",
    description: "Our consistency warning system will alert you if your ratings don't make logical sense, such as when the average of individual ratings significantly differs from the overall rating.",
    image: (
      <div className="w-full rounded-xl shadow-md overflow-hidden">
        <div className="bg-amber-50 p-4 border-l-4 border-amber-500">
          <div className="flex items-start">
            <AlertTriangle className="h-5 w-5 text-amber-500 mr-2 mt-0.5" />
            <div>
              <p className="font-bold text-amber-800">Consistency Warning</p>
              <p className="text-amber-700 text-sm">The overall rating (2) differs from the average of individual ratings (5.2) by 3.2 points</p>
            </div>
          </div>
          <div className="mt-3 text-xs text-amber-600 bg-white/50 p-2 rounded">
            Check if your overall rating accurately reflects the team's performance across all categories.
          </div>
        </div>
      </div>
    ),
  },
  {
    title: "Data Synchronization",
    description: "Your data is stored locally but will automatically sync with the server when connected to the internet. Check the Data Sync page to see sync status and force a full sync if needed.",
    image: (
      <div className="w-full h-48 bg-gradient-to-br from-green-700 to-green-500 rounded-xl shadow-lg flex flex-col items-center justify-center text-white p-4">
        <RefreshCw className="h-10 w-10 mb-2" />
        <div className="text-xl font-bold">Data Sync</div>
        <div className="mt-2 bg-white/20 rounded-lg px-3 py-1 text-sm">
          <span className="inline-block h-2 w-2 rounded-full bg-green-300 mr-1"></span>
          42 matches synced
        </div>
      </div>
    ),
  },
  {
    title: "Team Analytics",
    description: "View detailed statistics for each team, including match history, performance trends, and comparison with other teams.",
    image: (
      <div className="w-full h-48 bg-gradient-to-r from-green-800 to-green-600 rounded-xl shadow-lg flex flex-col items-center justify-center text-white p-4">
        <BarChart2 className="h-10 w-10 mb-2" />
        <div className="text-xl font-bold">Team Analytics</div>
        <div className="grid grid-cols-2 gap-2 w-full mt-2">
          <div className="bg-white/20 rounded p-1 text-center text-xs">Performance Trends</div>
          <div className="bg-white/20 rounded p-1 text-center text-xs">Match Histories</div>
        </div>
      </div>
    ),
  },
  {
    title: "Alliance Building",
    description: "Use the Alliance Builder to create and evaluate potential alliance selections based on team statistics and complementary capabilities.",
    image: (
      <div className="w-full h-48 bg-gradient-to-r from-green-800 to-green-600 rounded-xl shadow-lg flex flex-col items-center justify-center text-white p-4">
        <Users className="h-10 w-10 mb-2" />
        <div className="text-xl font-bold">Alliance Builder</div>
        <div className="flex space-x-1 mt-2">
          {[2056, 1114, 254].map(team => (
            <div key={team} className="bg-white/30 rounded px-2 py-1 text-sm font-mono">{team}</div>
          ))}
        </div>
      </div>
    ),
  },
  {
    title: "You're Ready to Scout!",
    description: "Remember, the key to good scouting is consistency and attention to detail. You can always access this tutorial again by clicking the help button in the top-right corner.",
    image: (
      <div className="flex flex-col items-center">
        <GreenBlitzLogo />
        <div className="text-green-800 text-xl font-bold mt-2">Happy Scouting!</div>
        <div className="mt-4 flex items-center bg-gray-100 px-3 py-1 rounded-full text-sm">
          <HelpCircle className="h-4 w-4 mr-1 text-green-700" />
          <span>Click the help button anytime</span>
        </div>
      </div>
    ),
  },
];

interface TutorialWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TutorialWizard({ open, onOpenChange }: TutorialWizardProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader className="text-center">
          <DialogTitle className="text-xl font-bold text-green-800">
            {tutorialSteps[0].title}
          </DialogTitle>
        </DialogHeader>
        
        <TutorialContent 
          open={open}
          onOpenChange={onOpenChange}
        />
      </DialogContent>
    </Dialog>
  );
}

/**
 * TutorialButton - A non-invasive button component that opens the tutorial wizard
 * Can be placed anywhere in the UI to provide easy access to the tutorial
 */
export function TutorialButton() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <DialogTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon"
                className="rounded-full h-10 w-10 text-green-700 hover:text-green-800 hover:bg-green-100 transition-all"
              >
                <HelpCircle className="h-5 w-5" />
              </Button>
            </DialogTrigger>
          </TooltipTrigger>
          <TooltipContent>
            <p>Open Tutorial Guide</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      
      <DialogContent className="sm:max-w-lg">
        <DialogHeader className="text-center">
          <DialogTitle className="text-xl font-bold text-green-800">
            {tutorialSteps[0].title}
          </DialogTitle>
        </DialogHeader>

        <TutorialContent 
          open={open}
          onOpenChange={setOpen}
        />
      </DialogContent>
    </Dialog>
  );
}

/**
 * TutorialContent - The inner content of the tutorial dialog
 * Extracted to make it reusable between the button and the auto-show functionality
 */
export function TutorialContent({ open, onOpenChange }: TutorialWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [completedTutorial, setCompletedTutorial] = useLocalStorage<boolean>("tutorial_completed", false);

  // Reset step when opened
  useEffect(() => {
    if (open) {
      setCurrentStep(0);
    }
  }, [open]);

  // Update progress when current step changes
  useEffect(() => {
    setProgress(((currentStep + 1) / tutorialSteps.length) * 100);
  }, [currentStep]);

  const nextStep = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      completeTutorial();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const completeTutorial = () => {
    setCompletedTutorial(true);
    onOpenChange(false);
  };

  const skipTutorial = () => {
    setCompletedTutorial(true);
    onOpenChange(false);
  };

  // Current step data
  const { title, description, image } = tutorialSteps[currentStep];

  return (
    <>
      <div className="py-4">
        <Progress value={progress} className="h-2 mb-6" />
        <div className="mb-6">
          {image}
        </div>
        <DialogDescription className="text-center text-gray-700">
          {description}
        </DialogDescription>
      </div>

      <DialogFooter className="flex flex-col sm:flex-row sm:justify-between gap-2">
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 0}
            className="flex-1"
          >
            Back
          </Button>
          <Button
            onClick={nextStep}
            className="flex-1 bg-green-700 hover:bg-green-800"
          >
            {currentStep === tutorialSteps.length - 1 ? "Finish" : "Next"}
          </Button>
        </div>
        {currentStep < tutorialSteps.length - 1 && (
          <Button variant="ghost" onClick={skipTutorial} className="text-gray-500">
            Skip Tutorial
          </Button>
        )}
      </DialogFooter>
    </>
  );
}

export default TutorialWizard;
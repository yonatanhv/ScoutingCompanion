import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { BackgroundParticles } from "@/components/ui/background-particles";
import { formSubmitVibration } from "@/lib/haptics";

export default function NotFound() {
  const [, navigate] = useLocation();
  
  const handleGoBack = () => {
    formSubmitVibration(); // Haptic feedback
    navigate('/scout');
  };
  
  return (
    <div className="min-h-[80vh] w-full flex items-center justify-center relative">
      <BackgroundParticles />
      <Card className="w-full max-w-md mx-4 shadow-lg border-border slide-in-bottom relative z-10">
        <CardContent className="pt-6 p-6">
          <div className="flex flex-col items-center text-center mb-6">
            <AlertCircle className="h-16 w-16 text-destructive mb-4 float" />
            <h1 className="text-2xl font-bold gradient-text">404 Page Not Found</h1>
          </div>

          <p className="mt-4 text-muted-foreground text-center mb-6">
            The page you're looking for doesn't exist or has been moved.
          </p>
          
          <Button 
            onClick={handleGoBack} 
            className="w-full flex items-center justify-center gap-2 btn-hover-fx"
          >
            <ArrowLeft className="h-4 w-4" />
            Return to Scouting
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

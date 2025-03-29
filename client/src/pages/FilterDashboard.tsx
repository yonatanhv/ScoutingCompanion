import { useState } from "react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RotateCw } from "lucide-react";

const FilterDashboard = () => {
  const [isLoading] = useState(false);

  return (
    <div className="container mx-auto p-4">
      <div className="space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold gradient-text inline-block">Filter Dashboard</h1>
          <p className="text-muted-foreground">
            Coming Soon - Advanced team filtering and leaderboard capabilities
          </p>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Filter Dashboard</CardTitle>
            <CardDescription>
              This feature is under construction
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <RotateCw className="h-16 w-16 text-primary animate-spin-slow" />
            <p className="mt-4 text-center text-muted-foreground">
              The Filter Dashboard feature is currently in development.
              <br />
              It will allow you to create complex filters and generate team leaderboards.
            </p>
            <Button className="mt-6" disabled={isLoading} variant="outline">
              Coming Soon
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default FilterDashboard;
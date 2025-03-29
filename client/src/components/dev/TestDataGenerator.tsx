import { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { 
  Slider 
} from '@/components/ui/slider';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Database } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { TeamMascotSpinner } from '@/components/ui/team-mascot-spinner';
import { generateRandomData, isValidKey } from '@/lib/testDataGenerator';

export function TestDataGenerator() {
  const [open, setOpen] = useState(false);
  const [key, setKey] = useState('');
  const [count, setCount] = useState(20);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showValidationMessage, setShowValidationMessage] = useState(false);
  const { toast } = useToast();

  const handleCountChange = (value: number[]) => {
    setCount(value[0]);
  };

  const handleKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setKey(e.target.value);
    if (showValidationMessage) {
      setShowValidationMessage(false);
    }
  };

  const generateData = async () => {
    if (!isValidKey(key)) {
      setShowValidationMessage(true);
      return;
    }

    setIsGenerating(true);
    try {
      const result = await generateRandomData(key, count);
      
      if (result.success) {
        toast({
          title: 'Test Data Generated',
          description: result.message,
          variant: 'default',
        });
        setOpen(false);
      } else {
        toast({
          title: 'Error',
          description: result.message,
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: `Failed to generate data: ${error instanceof Error ? error.message : String(error)}`,
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant="outline" 
              size="icon" 
              className="fixed bottom-4 right-4 rounded-full shadow-md bg-background hover:bg-primary hover:text-primary-foreground"
              onClick={() => setOpen(true)}
            >
              <Database className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Generate Test Data</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Generate Test Data</DialogTitle>
            <DialogDescription>
              Generate random match entries for testing purposes.
              This requires a secret key to prevent accidental data generation.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-3">
            <div className="grid gap-2">
              <Label htmlFor="key">Secret Key</Label>
              <Input
                id="key"
                type="password"
                placeholder="Enter secret key"
                value={key}
                onChange={handleKeyChange}
                className={showValidationMessage ? 'border-destructive' : ''}
              />
              {showValidationMessage && (
                <p className="text-sm text-destructive">Invalid key. Access denied.</p>
              )}
            </div>
            
            <div className="grid gap-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="count">Number of Entries</Label>
                <span className="text-sm text-muted-foreground">{count}</span>
              </div>
              <Slider
                id="count"
                min={5}
                max={100}
                step={5}
                value={[count]}
                onValueChange={handleCountChange}
              />
            </div>
          </div>
          
          <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-between sm:space-x-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={generateData} disabled={isGenerating} className="relative">
              {isGenerating ? (
                <>
                  <span className="opacity-0">Generate</span>
                  <span className="absolute inset-0 flex items-center justify-center">
                    <TeamMascotSpinner size="sm" />
                  </span>
                </>
              ) : (
                'Generate'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default TestDataGenerator;
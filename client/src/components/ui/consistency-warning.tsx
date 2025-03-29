import { useState, useEffect } from 'react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ExclamationTriangleIcon, InfoCircledIcon } from "@radix-ui/react-icons";
import { 
  RatingFields, 
  ConsistencyWarning, 
  checkRatingConsistency 
} from "@/lib/consistencyCheck";

interface ConsistencyWarningProps {
  ratings: RatingFields;
  className?: string;
}

export default function ConsistencyWarningComponent({ 
  ratings, 
  className = "" 
}: ConsistencyWarningProps) {
  const [warnings, setWarnings] = useState<ConsistencyWarning[]>([]);
  const [expanded, setExpanded] = useState(false);

  // Check consistency whenever ratings change
  useEffect(() => {
    setWarnings(checkRatingConsistency(ratings));
  }, [ratings]);

  // If no warnings, don't render anything
  if (warnings.length === 0) {
    return null;
  }

  // Select icon based on highest severity warning
  const highestSeverity = warnings.reduce((highest, warning) => {
    const severityOrder = { 'low': 1, 'medium': 2, 'high': 3 };
    return severityOrder[warning.severity] > severityOrder[highest] ? warning.severity : highest;
  }, 'low' as 'low' | 'medium' | 'high');

  const getSeverityColor = (severity: 'low' | 'medium' | 'high') => {
    switch (severity) {
      case 'low': return 'text-blue-500 dark:text-blue-400';
      case 'medium': return 'text-amber-500 dark:text-amber-400';
      case 'high': return 'text-red-500 dark:text-red-400';
    }
  };

  const getIcon = (severity: 'low' | 'medium' | 'high') => {
    switch (severity) {
      case 'low': return <InfoCircledIcon className="h-5 w-5" />;
      case 'medium': return <ExclamationTriangleIcon className="h-5 w-5" />;
      case 'high': return <ExclamationTriangleIcon className="h-5 w-5" />;
    }
  };

  const getBorderColor = (severity: 'low' | 'medium' | 'high') => {
    switch (severity) {
      case 'low': return 'border-blue-500 dark:border-blue-400';
      case 'medium': return 'border-amber-500 dark:border-amber-400';
      case 'high': return 'border-red-500 dark:border-red-400';
    }
  };

  return (
    <Alert 
      className={`cursor-pointer ${getBorderColor(highestSeverity)} ${className}`}
      onClick={() => setExpanded(!expanded)}
    >
      <div className={`flex items-center ${getSeverityColor(highestSeverity)}`}>
        {getIcon(highestSeverity)}
        <AlertTitle className="ml-2">
          {highestSeverity === 'high' 
            ? 'Important Rating Inconsistency Detected' 
            : 'Possible Rating Inconsistency'}
        </AlertTitle>
      </div>
      
      {expanded && (
        <AlertDescription className="mt-3 text-sm space-y-2">
          <p className="text-gray-700 dark:text-gray-300">
            The following potential issues were found with your ratings:
          </p>
          
          <ul className="list-disc list-inside space-y-1 pl-2">
            {warnings.map((warning, index) => (
              <li key={index} className={`${getSeverityColor(warning.severity)}`}>
                {warning.message}
              </li>
            ))}
          </ul>
          
          <p className="text-gray-700 dark:text-gray-300 text-xs italic mt-2">
            Click to collapse this message. These warnings won't prevent submission,
            but could indicate rating inconsistencies.
          </p>
        </AlertDescription>
      )}
    </Alert>
  );
}
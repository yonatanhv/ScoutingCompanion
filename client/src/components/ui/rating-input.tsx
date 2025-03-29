import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";

interface RatingInputProps {
  id: string;
  label: string;
  value: number;
  comment?: string;
  onChange: (value: number) => void;
  onCommentChange?: (comment: string) => void;
  min?: number;
  max?: number;
  allowNoData?: boolean;
}

// Define a constant for "No Data" value (use a value outside normal range)
export const NO_DATA_VALUE = -1;

export function RatingInput({
  id,
  label,
  value,
  comment,
  onChange,
  onCommentChange,
  min = 1,
  max = 7,
  allowNoData = true
}: RatingInputProps) {
  const [displayValue, setDisplayValue] = useState(value === NO_DATA_VALUE ? "N/A" : value.toString());
  const [hasNoData, setHasNoData] = useState(value === NO_DATA_VALUE);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseInt(e.target.value);
    setDisplayValue(newValue.toString());
    onChange(newValue);
  };

  const toggleNoData = (checked: boolean) => {
    setHasNoData(checked);
    if (checked) {
      setDisplayValue("N/A");
      onChange(NO_DATA_VALUE);
    } else {
      const defaultValue = Math.floor((min + max) / 2);
      setDisplayValue(defaultValue.toString());
      onChange(defaultValue);
    }
  };

  return (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-1">
        <Label htmlFor={id} className="font-medium">{label}</Label>
        <span className="rating-display inline-block w-12 text-center">{displayValue}</span>
      </div>
      
      {allowNoData && (
        <div className="flex items-center gap-2 mb-2">
          <Checkbox 
            id={`${id}-no-data`} 
            checked={hasNoData}
            onCheckedChange={(checked) => toggleNoData(checked === true)}
          />
          <Label htmlFor={`${id}-no-data`} className="text-xs">No data available</Label>
        </div>
      )}
      
      <div className={`flex items-center gap-2 ${hasNoData ? 'opacity-50' : ''}`}>
        <span className="text-xs">{min}</span>
        <input 
          type="range" 
          id={id} 
          min={min} 
          max={max} 
          value={hasNoData ? min : value} 
          className="flex-grow h-2 rounded-lg appearance-none bg-gray-200 cursor-pointer"
          onChange={handleChange}
          disabled={hasNoData}
        />
        <span className="text-xs">{max}</span>
      </div>
      {onCommentChange && (
        <Input
          id={`${id}-comment`}
          value={comment || ""}
          onChange={(e) => onCommentChange(e.target.value)}
          placeholder="Optional comment"
          className="w-full mt-1 p-2 text-sm"
        />
      )}
    </div>
  );
}

interface CommentAreaProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
}

export function CommentArea({
  id,
  label,
  value,
  onChange,
  rows = 3
}: CommentAreaProps) {
  return (
    <div className="mb-4">
      <Label htmlFor={id} className="block mb-1 font-medium">{label}</Label>
      <Textarea
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        placeholder="Enter any additional observations"
        className="w-full"
      />
    </div>
  );
}

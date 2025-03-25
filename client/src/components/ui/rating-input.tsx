import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface RatingInputProps {
  id: string;
  label: string;
  value: number;
  comment?: string;
  onChange: (value: number) => void;
  onCommentChange?: (comment: string) => void;
  min?: number;
  max?: number;
}

export function RatingInput({
  id,
  label,
  value,
  comment,
  onChange,
  onCommentChange,
  min = 1,
  max = 7
}: RatingInputProps) {
  const [displayValue, setDisplayValue] = useState(value.toString());

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseInt(e.target.value);
    setDisplayValue(newValue.toString());
    onChange(newValue);
  };

  return (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-1">
        <Label htmlFor={id} className="font-medium">{label}</Label>
        <span className="rating-display inline-block w-6 text-center">{displayValue}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs">{min}</span>
        <input 
          type="range" 
          id={id} 
          min={min} 
          max={max} 
          value={value} 
          className="flex-grow h-2 rounded-lg appearance-none bg-gray-200 cursor-pointer"
          onChange={handleChange}
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

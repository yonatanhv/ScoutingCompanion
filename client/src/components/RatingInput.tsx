import { useState, useEffect } from 'react';

interface RatingInputProps {
  name: string;
  label: string;
  value?: number;
  notes?: string;
  onChange: (value: { score: number; notes?: string }) => void;
  required?: boolean;
}

export default function RatingInput({ 
  name, 
  label, 
  value = 4, 
  notes = '', 
  onChange, 
  required = false 
}: RatingInputProps) {
  const [selectedValue, setSelectedValue] = useState<number>(value);
  const [notesText, setNotesText] = useState<string>(notes);
  
  useEffect(() => {
    setSelectedValue(value);
    setNotesText(notes || '');
  }, [value, notes]);
  
  const handleRatingChange = (newValue: number) => {
    setSelectedValue(newValue);
    onChange({ score: newValue, notes: notesText });
  };
  
  const handleNotesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNotesText(e.target.value);
    onChange({ score: selectedValue, notes: e.target.value });
  };
  
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <div className="flex flex-col space-y-2">
        <div className="rating-input flex justify-between bg-gray-100 rounded p-1">
          {[1, 2, 3, 4, 5, 6, 7].map(value => (
            <label 
              key={value}
              className={`flex-1 text-center py-1 cursor-pointer hover:bg-gray-200 rounded ${
                selectedValue === value ? 'bg-primary text-white' : ''
              }`}
              onClick={() => handleRatingChange(value)}
            >
              <input
                type="radio"
                name={name}
                value={value}
                checked={selectedValue === value}
                onChange={() => {}} // Handled by onClick on label
                className="sr-only"
                required={required}
              />
              <span>{value}</span>
            </label>
          ))}
        </div>
        <div className="flex justify-between text-xs text-gray-500">
          <span>Poor</span>
          <span>Excellent</span>
        </div>
        <input
          type="text"
          placeholder="Optional notes"
          value={notesText}
          onChange={handleNotesChange}
          className="w-full p-2 border border-gray-300 rounded mt-1"
        />
      </div>
    </div>
  );
}

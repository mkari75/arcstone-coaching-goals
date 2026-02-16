import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Percent } from 'lucide-react';

interface PercentFieldProps {
  label: string;
  value: number; // 0.01 to 1.0
  onChange: (value: number) => void;
  disabled?: boolean;
  required?: boolean;
  error?: string;
  helpText?: string;
  showSlider?: boolean;
  min?: number;
  max?: number;
  step?: number;
}

export function PercentField({
  label, value, onChange, disabled = false, required = false,
  error, helpText, showSlider = false, min = 1, max = 100, step = 1,
}: PercentFieldProps) {
  const displayValue = Math.round(value * 100);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputVal = e.target.value.replace(/[^0-9.]/g, '');
    const numVal = parseFloat(inputVal) || 0;
    const clamped = Math.max(min, Math.min(max, numVal));
    onChange(clamped / 100);
  };

  const handleSliderChange = (vals: number[]) => {
    onChange(vals[0] / 100);
  };

  return (
    <div className="space-y-1">
      <Label className="text-xs font-medium">
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </Label>
      <div className="relative">
        <Input
          type="text"
          value={displayValue}
          onChange={handleInputChange}
          disabled={disabled}
          className={`pr-9 h-9 ${error ? 'border-destructive' : ''}`}
        />
        <Percent className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      </div>
      {showSlider && (
        <div className="pt-1">
          <Slider
            value={[displayValue]}
            onValueChange={handleSliderChange}
            min={min}
            max={max}
            step={step}
            className="w-full"
            disabled={disabled}
          />
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>{min}%</span>
            <span>{max}%</span>
          </div>
        </div>
      )}
      {helpText && !error && <p className="text-xs text-muted-foreground">{helpText}</p>}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

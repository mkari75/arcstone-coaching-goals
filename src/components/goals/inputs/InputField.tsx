import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface InputFieldProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  required?: boolean;
  error?: string;
  helpText?: string;
  suffix?: string;
  min?: number;
  max?: number;
  step?: number;
  decimals?: number;
}

export function InputField({
  label, value, onChange, disabled = false, required = false,
  error, helpText, suffix, min = 0, max, step = 1, decimals = 0,
}: InputFieldProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let numVal = parseFloat(e.target.value) || 0;
    if (min !== undefined) numVal = Math.max(min, numVal);
    if (max !== undefined) numVal = Math.min(max, numVal);
    onChange(numVal);
  };

  return (
    <div className="space-y-1">
      <Label className="text-xs font-medium">
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </Label>
      <div className="relative">
        <Input
          type="number"
          value={value.toFixed(decimals)}
          onChange={handleChange}
          disabled={disabled}
          step={step}
          min={min}
          max={max}
          className={`h-9 ${suffix ? 'pr-12' : ''} ${error ? 'border-destructive' : ''}`}
        />
        {suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
            {suffix}
          </span>
        )}
      </div>
      {helpText && !error && <p className="text-xs text-muted-foreground">{helpText}</p>}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DollarSign } from 'lucide-react';

interface CurrencyFieldProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  required?: boolean;
  error?: string;
  helpText?: string;
}

export function CurrencyField({
  label, value, onChange, disabled = false, required = false, error, helpText,
}: CurrencyFieldProps) {
  const formatCurrency = (num: number): string =>
    new Intl.NumberFormat('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(num);

  const parseCurrency = (str: string): number => {
    const cleaned = str.replace(/[^0-9]/g, '');
    return cleaned ? parseInt(cleaned, 10) : 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(parseCurrency(e.target.value));
  };

  const displayValue = value > 0 ? formatCurrency(value) : '';

  return (
    <div className="space-y-1">
      <Label className="text-xs font-medium">
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </Label>
      <div className="relative">
        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={displayValue}
          onChange={handleChange}
          disabled={disabled}
          className={`pl-9 h-9 ${error ? 'border-destructive' : ''}`}
          placeholder="0"
        />
      </div>
      {helpText && !error && <p className="text-xs text-muted-foreground">{helpText}</p>}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

import { Label } from '@/components/ui/label';

interface DisplayFieldProps {
  label: string;
  value: string | number;
  suffix?: string;
}

export function DisplayField({ label, value, suffix }: DisplayFieldProps) {
  return (
    <div className="space-y-1">
      <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
      <div className="text-sm font-semibold text-foreground bg-muted/50 rounded-md px-3 py-2">
        {value}{suffix && <span className="text-muted-foreground ml-1">{suffix}</span>}
      </div>
    </div>
  );
}

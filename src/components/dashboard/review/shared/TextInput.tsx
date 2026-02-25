interface TextInputProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  multiline?: boolean;
  rows?: number;
  maxLength?: number;
  className?: string;
}

export function TextInput({
  label,
  value,
  onChange,
  placeholder,
  multiline = false,
  rows = 3,
  maxLength,
  className = '',
}: TextInputProps) {
  const Component = multiline ? 'textarea' : 'input';

  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label className="text-sm font-medium text-muted-foreground">
          {label}
        </label>
      )}
      <Component
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={multiline ? rows : undefined}
        maxLength={maxLength}
        className="w-full px-3 py-2 border rounded-lg bg-surface focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary resize-none transition-all placeholder:text-muted-foreground/50"
      />
      {maxLength && (
        <div className="text-xs text-muted-foreground text-right">
          {value.length} / {maxLength}
        </div>
      )}
    </div>
  );
}

interface RadioOption {
  value: string;
  label: string;
  icon?: string;
}

interface RadioGroupProps {
  options: RadioOption[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function RadioGroup({
  options,
  value,
  onChange,
  className = '',
}: RadioGroupProps) {
  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          className={`
            px-4 py-2 rounded-full border-2 transition-all font-medium text-sm
            ${value === option.value
              ? 'border-primary bg-primary text-primary-foreground shadow-sm'
              : 'border-border bg-surface hover:bg-surface-hover hover:border-primary/50 text-foreground'
            }
          `}
        >
          {option.icon && <span className="mr-1">{option.icon}</span>}
          {option.label}
        </button>
      ))}
    </div>
  );
}

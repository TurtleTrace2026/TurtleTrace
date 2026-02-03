import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface SectionCardProps {
  title: string;
  icon: string;
  children: React.ReactNode;
  defaultExpanded?: boolean;
  badge?: string | number;
  className?: string;
}

export function SectionCard({
  title,
  icon,
  children,
  defaultExpanded = true,
  badge,
  className = '',
}: SectionCardProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div className={`border rounded-lg bg-card ${className}`}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-accent/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-xl">{icon}</span>
          <h3 className="font-semibold">{title}</h3>
          {badge !== undefined && (
            <span className="text-sm text-muted-foreground">({badge})</span>
          )}
        </div>
        {isExpanded ? (
          <ChevronDown className="h-5 w-5 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
        )}
      </button>

      {isExpanded && <div className="px-4 pb-4">{children}</div>}
    </div>
  );
}

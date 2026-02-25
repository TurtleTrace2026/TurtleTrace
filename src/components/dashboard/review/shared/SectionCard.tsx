import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '../../../../lib/utils';

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
    <div className={cn("border rounded-xl bg-card overflow-hidden transition-all", className)}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-surface-hover transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-xl">{icon}</span>
          <h3 className="font-semibold">{title}</h3>
          {badge !== undefined && (
            <span className="text-sm text-muted-foreground bg-muted px-2 py-0.5 rounded-full">({badge})</span>
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

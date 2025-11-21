import { useState, useEffect } from 'react';
import { ChevronDown, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface CollapsibleSectionProps {
  title: string;
  count?: number;
  emoji?: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  storageKey?: string;
  actions?: {
    label: string;
    onClick: () => void;
    variant?: 'default' | 'destructive';
  }[];
  className?: string;
}

export function CollapsibleSection({
  title,
  count,
  emoji,
  children,
  defaultOpen = true,
  storageKey,
  actions,
  className,
}: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(() => {
    if (storageKey) {
      const saved = localStorage.getItem(storageKey);
      return saved ? JSON.parse(saved) : defaultOpen;
    }
    return defaultOpen;
  });

  useEffect(() => {
    if (storageKey) {
      localStorage.setItem(storageKey, JSON.stringify(isOpen));
    }
  }, [isOpen, storageKey]);

  return (
    <div className={cn('space-y-3', className)}>
      {/* Section Header */}
      <div
        className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm py-2 -mx-1 px-1"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center justify-between cursor-pointer group">
          <div className="flex items-center gap-3 flex-1">
            <ChevronDown
              className={cn(
                'w-4 h-4 text-muted-foreground transition-transform',
                !isOpen && '-rotate-90'
              )}
            />
            <div className="flex items-center gap-2 flex-1">
              {emoji && <span className="text-lg">{emoji}</span>}
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {title}
              </h3>
              {count !== undefined && (
                <Badge variant="secondary" className="text-xs font-semibold px-2 py-0.5">
                  {count}
                </Badge>
              )}
            </div>
          </div>

          {actions && actions.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {actions.map((action, i) => (
                  <DropdownMenuItem
                    key={i}
                    onClick={(e) => {
                      e.stopPropagation();
                      action.onClick();
                    }}
                    className={action.variant === 'destructive' ? 'text-destructive' : ''}
                  >
                    {action.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* Section Content */}
      {isOpen && <div className="space-y-2">{children}</div>}
    </div>
  );
}

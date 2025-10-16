import { ReactNode } from 'react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EnhancedEmptyStateProps {
  icon: LucideIcon;
  emoji?: string;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  illustration?: ReactNode;
  className?: string;
  tips?: string[];
}

export function EnhancedEmptyState({
  icon: Icon,
  emoji,
  title,
  description,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  illustration,
  className,
  tips,
}: EnhancedEmptyStateProps) {
  return (
    <Card className={cn('border-dashed', className)}>
      <CardContent className="flex flex-col items-center justify-center p-8 md:p-12 text-center space-y-6">
        {/* Icon/Illustration */}
        <div className="relative">
          {illustration || (
            <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center animate-bounce-in">
              {emoji ? (
                <span className="text-5xl">{emoji}</span>
              ) : (
                <Icon className="w-12 h-12 text-primary" />
              )}
            </div>
          )}
        </div>

        {/* Text Content */}
        <div className="space-y-2 max-w-md">
          <h3 className="text-xl font-semibold text-foreground">{title}</h3>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>

        {/* Tips Section */}
        {tips && tips.length > 0 && (
          <div className="w-full max-w-md space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">💡 Pro Tips:</h4>
            <div className="space-y-2 text-left">
              {tips.map((tip, index) => (
                <div
                  key={index}
                  className="flex items-start gap-2 p-3 bg-accent/50 rounded-lg animate-stagger-fade-in"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <span className="text-primary font-semibold text-sm">{index + 1}.</span>
                  <span className="text-sm text-foreground">{tip}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        {(actionLabel || secondaryActionLabel) && (
          <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm">
            {actionLabel && onAction && (
              <Button onClick={onAction} className="flex-1 animate-slide-in-left">
                {actionLabel}
              </Button>
            )}
            {secondaryActionLabel && onSecondaryAction && (
              <Button
                variant="outline"
                onClick={onSecondaryAction}
                className="flex-1 animate-slide-in-right"
              >
                {secondaryActionLabel}
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

import { ReactNode } from 'react';
import { useSwipeGesture } from '@/hooks/useSwipeGesture';
import { Card } from './ui/card';
import { Check, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SwipeableCardProps {
  children: ReactNode;
  onSwipeRight?: () => void;
  onSwipeLeft?: () => void;
  rightLabel?: string;
  leftLabel?: string;
  className?: string;
  enabled?: boolean;
}

export function SwipeableCard({
  children,
  onSwipeRight,
  onSwipeLeft,
  rightLabel = 'Complete',
  leftLabel = 'Delete',
  className,
  enabled = true,
}: SwipeableCardProps) {
  const { bind, getSwipeStyle, direction, swiping } = useSwipeGesture({
    onSwipeRight,
    onSwipeLeft,
    enabled,
  });

  return (
    <div className="relative overflow-hidden">
      {/* Background indicators */}
      {swiping && direction && (
        <>
          {direction === 'right' && (
            <div className="absolute inset-0 bg-success/20 flex items-center px-4 rounded-lg">
              <Check className="w-6 h-6 text-success" />
              <span className="ml-2 font-medium text-success">{rightLabel}</span>
            </div>
          )}
          {direction === 'left' && (
            <div className="absolute inset-0 bg-destructive/20 flex items-center justify-end px-4 rounded-lg">
              <span className="mr-2 font-medium text-destructive">{leftLabel}</span>
              <Trash2 className="w-6 h-6 text-destructive" />
            </div>
          )}
        </>
      )}

      {/* Swipeable content */}
      <div
        {...bind()}
        style={getSwipeStyle()}
        className={cn('touch-pan-y select-none', className)}
      >
        <Card className="cursor-grab active:cursor-grabbing">
          {children}
        </Card>
      </div>
    </div>
  );
}

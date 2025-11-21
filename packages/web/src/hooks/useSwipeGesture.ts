import { useGesture } from '@use-gesture/react';
import { useState } from 'react';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { isPlatform } from '@/lib/platform';

interface SwipeGestureConfig {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  threshold?: number;
  enabled?: boolean;
}

export function useSwipeGesture({
  onSwipeLeft,
  onSwipeRight,
  threshold = 100,
  enabled = true,
}: SwipeGestureConfig) {
  const [offset, setOffset] = useState(0);
  const [swiping, setSwiping] = useState(false);
  const [direction, setDirection] = useState<'left' | 'right' | null>(null);

  const triggerHaptic = async () => {
    if (isPlatform('capacitor')) {
      try {
        await Haptics.impact({ style: ImpactStyle.Light });
      } catch (e) {
        // Haptics not available
      }
    }
  };

  const bind = useGesture(
    {
      onDrag: ({ offset: [x], last, cancel, active }) => {
        if (!enabled) return;

        if (active) {
          setSwiping(true);
          setOffset(x);

          // Determine direction when threshold is crossed
          if (Math.abs(x) > threshold / 2) {
            const newDirection = x > 0 ? 'right' : 'left';
            if (newDirection !== direction) {
              setDirection(newDirection);
              triggerHaptic();
            }
          } else {
            setDirection(null);
          }
        }

        if (last) {
          setSwiping(false);
          
          // Trigger action if threshold met
          if (Math.abs(x) > threshold) {
            if (x > 0 && onSwipeRight) {
              triggerHaptic();
              onSwipeRight();
            } else if (x < 0 && onSwipeLeft) {
              triggerHaptic();
              onSwipeLeft();
            }
          }

          // Reset
          setOffset(0);
          setDirection(null);
        }
      },
    },
    {
      drag: {
        axis: 'x',
        filterTaps: true,
        rubberband: true,
      },
    }
  );

  const getSwipeStyle = () => {
    if (!swiping || offset === 0) return {};

    return {
      transform: `translateX(${offset}px)`,
      transition: swiping ? 'none' : 'transform 0.3s ease-out',
    };
  };

  const getBackgroundColor = () => {
    if (!direction) return 'transparent';
    
    if (direction === 'right') {
      return 'hsl(var(--success) / 0.1)';
    }
    return 'hsl(var(--destructive) / 0.1)';
  };

  return {
    bind,
    offset,
    swiping,
    direction,
    getSwipeStyle,
    getBackgroundColor,
  };
}

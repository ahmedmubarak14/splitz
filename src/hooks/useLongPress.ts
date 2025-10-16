import { useCallback, useRef } from 'react';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { isPlatform } from '@/lib/platform';

interface LongPressConfig {
  onLongPress: () => void;
  delay?: number;
  enabled?: boolean;
}

export function useLongPress({
  onLongPress,
  delay = 500,
  enabled = true,
}: LongPressConfig) {
  const timerRef = useRef<NodeJS.Timeout>();
  const isLongPressRef = useRef(false);

  const triggerHaptic = async () => {
    if (isPlatform('capacitor')) {
      try {
        await Haptics.impact({ style: ImpactStyle.Heavy });
      } catch (e) {
        // Haptics not available
      }
    }
  };

  const start = useCallback((event: React.TouchEvent | React.MouseEvent) => {
    if (!enabled) return;

    event.preventDefault();
    isLongPressRef.current = false;

    timerRef.current = setTimeout(() => {
      isLongPressRef.current = true;
      triggerHaptic();
      onLongPress();
    }, delay);
  }, [enabled, delay, onLongPress]);

  const clear = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    isLongPressRef.current = false;
  }, []);

  const onClick = useCallback((callback?: () => void) => {
    return (event: React.MouseEvent) => {
      if (!isLongPressRef.current && callback) {
        callback();
      }
    };
  }, []);

  return {
    onMouseDown: start,
    onMouseUp: clear,
    onMouseLeave: clear,
    onTouchStart: start,
    onTouchEnd: clear,
    onClick,
  };
}

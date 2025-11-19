import { useGesture } from '@use-gesture/react';
import { useState } from 'react';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { isPlatform } from '@/lib/platform';

interface PullToRefreshConfig {
  onRefresh: () => Promise<void>;
  threshold?: number;
  enabled?: boolean;
}

export function usePullToRefresh({
  onRefresh,
  threshold = 80,
  enabled = true,
}: PullToRefreshConfig) {
  const [pulling, setPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const triggerHaptic = async () => {
    if (isPlatform('capacitor')) {
      try {
        await Haptics.impact({ style: ImpactStyle.Medium });
      } catch (e) {
        // Haptics not available
      }
    }
  };

  const bind = useGesture(
    {
      onDrag: ({ offset: [, y], last, memo = { triggered: false } }) => {
        if (!enabled || refreshing) return memo;

        const scrollTop = window.scrollY || document.documentElement.scrollTop;
        
        // Only allow pull when at top of page
        if (scrollTop > 0) {
          setPulling(false);
          setPullDistance(0);
          return memo;
        }

        if (y > 0) {
          setPulling(true);
          const distance = Math.min(y, threshold * 1.5);
          setPullDistance(distance);

          // Trigger haptic when threshold crossed
          if (distance >= threshold && !memo.triggered) {
            triggerHaptic();
            memo.triggered = true;
          }
        }

        if (last) {
          setPulling(false);
          
          if (pullDistance >= threshold && !memo.triggered) {
            setRefreshing(true);
            triggerHaptic();
            
            onRefresh().finally(() => {
              setRefreshing(false);
              setPullDistance(0);
            });
          } else {
            setPullDistance(0);
          }
          
          return { triggered: false };
        }

        return memo;
      },
    },
    {
      drag: {
        axis: 'y',
        filterTaps: true,
        rubberband: true,
        from: () => [0, pullDistance],
      },
    }
  );

  const getIndicatorStyle = () => {
    if (!pulling && !refreshing) return { opacity: 0, transform: 'translateY(-100%)' };

    const progress = Math.min(pullDistance / threshold, 1);
    const translateY = pulling ? pullDistance * 0.5 : 0;

    return {
      opacity: progress,
      transform: `translateY(${translateY}px) scale(${progress})`,
      transition: pulling ? 'none' : 'all 0.3s ease-out',
    };
  };

  const getRotation = () => {
    if (refreshing) return 360;
    return (pullDistance / threshold) * 360;
  };

  return {
    bind,
    pulling,
    pullDistance,
    refreshing,
    getIndicatorStyle,
    getRotation,
    isReady: pullDistance >= threshold,
  };
}

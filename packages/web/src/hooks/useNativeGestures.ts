import { useGesture } from '@use-gesture/react';
import { isIOS } from '@/lib/platform';

export const useSwipeBack = (onSwipeBack: () => void) => {
  const bind = useGesture({
    onDrag: ({ movement: [mx], direction: [xDir], cancel }) => {
      if (isIOS && mx > 100 && xDir > 0) {
        onSwipeBack();
        cancel();
      }
    },
  });

  return bind;
};

export const usePullToRefresh = (onRefresh: () => Promise<void>) => {
  const bind = useGesture({
    onDrag: ({ movement: [, my], first, last }) => {
      if (first && my > 0 && window.scrollY === 0) {
        // Start pull-to-refresh animation
      }
      if (last && my > 80) {
        onRefresh();
      }
    },
  });

  return bind;
};

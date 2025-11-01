import { useEffect, useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, X } from 'lucide-react';
import Confetti from 'react-confetti';
import { useWindowSize } from '@/hooks/use-window-size';
import { useTranslation } from 'react-i18next';

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  xp_reward: number;
}

interface AchievementUnlockProps {
  achievement: Achievement | null;
  onClose: () => void;
}

export const AchievementUnlock = ({ achievement, onClose }: AchievementUnlockProps) => {
  const { t } = useTranslation();
  const [show, setShow] = useState(false);
  const { width, height } = useWindowSize();

  useEffect(() => {
    if (achievement) {
      setShow(true);
      const timer = setTimeout(() => {
        setShow(false);
        setTimeout(onClose, 300);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [achievement, onClose]);

  if (!achievement) return null;

  return (
    <AnimatePresence>
      {show && (
        <>
          <Confetti
            width={width}
            height={height}
            recycle={false}
            numberOfPieces={200}
            gravity={0.3}
          />
          
          <motion.div
            initial={{ opacity: 0, y: -100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -100 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4"
          >
            <Card className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border-yellow-500/50 shadow-2xl">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Trophy className="w-6 h-6 text-yellow-500" />
                    <h3 className="text-lg font-bold">{t('gamification.achievement.unlocked')}</h3>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShow(false);
                      setTimeout(onClose, 300);
                    }}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-5xl">{achievement.icon}</div>
                  <div className="flex-1">
                    <h4 className="font-bold text-xl mb-1">{achievement.name}</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      {achievement.description}
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-yellow-500">
                        {t('gamification.achievement.xpReward', { xp: achievement.xp_reward })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

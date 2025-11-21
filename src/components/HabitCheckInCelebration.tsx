import { useEffect, useState } from 'react';
import Confetti from 'react-confetti';
import { useWindowSize } from '@/hooks/use-window-size';
import { Flame } from 'lucide-react';

interface HabitCheckInCelebrationProps {
  show: boolean;
  habitName: string;
  habitIcon: string;
  streakCount: number;
  onComplete: () => void;
}

const getStreakMessage = (streak: number) => {
  if (streak === 7) return { title: "🔥 One Week Strong!", pieces: 500 };
  if (streak === 30) return { title: "💪 One Month Champion!", pieces: 700 };
  if (streak === 100) return { title: "🏆 Century Streak!", pieces: 1000 };
  if (streak === 365) return { title: "🌟 Year-Long Master!", pieces: 1500 };
  return { title: "🎉 Amazing!", pieces: 400 };
};

export function HabitCheckInCelebration({ 
  show, 
  habitName, 
  habitIcon, 
  streakCount,
  onComplete 
}: HabitCheckInCelebrationProps) {
  const { width, height } = useWindowSize();
  const [visible, setVisible] = useState(false);
  const streakMessage = getStreakMessage(streakCount);

  useEffect(() => {
    if (show) {
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
        setTimeout(onComplete, 300);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [show, onComplete]);

  if (!show) return null;

  return (
    <>
      {/* Confetti Animation */}
      <Confetti
        width={width}
        height={height}
        recycle={false}
        numberOfPieces={streakMessage.pieces}
        gravity={0.25}
        colors={[
          'hsl(var(--primary))',
          'hsl(var(--accent))',
          '#FFD700',
          '#FFA500',
          '#FF69B4',
        ]}
        tweenDuration={3000}
      />
      
      {/* Center Animation Overlay */}
      <div 
        className={`fixed inset-0 z-50 flex items-center justify-center pointer-events-none transition-opacity duration-300 ${
          visible ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <div className="animate-scale-in">
          {/* Large Emoji with Bounce */}
          <div className="text-9xl mb-4 animate-bounce text-center">
            {habitIcon}
          </div>
          
          {/* Success Message */}
          <div className="text-center bg-background/95 backdrop-blur-sm rounded-2xl p-6 shadow-2xl border border-border/50">
            <h3 className="text-2xl font-bold mb-2">
              {streakMessage.title}
            </h3>
            <p className="text-lg text-muted-foreground mb-4">
              {habitName} completed
            </p>
            
            {/* Streak Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg">
              <Flame className="w-5 h-5" />
              <span className="font-bold">{streakCount} Day Streak!</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

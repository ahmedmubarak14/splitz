import { useEffect, useState } from 'react';
import Confetti from 'react-confetti';
import { useWindowSize } from '@/hooks/use-window-size';
import { Trees, Clock } from 'lucide-react';

interface FocusSessionCelebrationProps {
  show: boolean;
  totalTrees: number;
  totalFocusMinutes: number;
  sessionDuration: number;
  onComplete: () => void;
}

const getMilestoneMessage = (trees: number) => {
  if (trees === 1) return { title: "🎉 Your First Tree!", pieces: 300 };
  if (trees === 10) return { title: "🌱 Growing Forest!", pieces: 400 };
  if (trees === 25) return { title: "🌳 Tree Master!", pieces: 500 };
  if (trees === 50) return { title: "🌲 Forest Guardian!", pieces: 700 };
  if (trees === 100) return { title: "🏞️ Ecosystem Creator!", pieces: 1000 };
  return { title: "🌳 Tree Planted!", pieces: 350 };
};

export function FocusSessionCelebration({ 
  show, 
  totalTrees,
  totalFocusMinutes,
  sessionDuration,
  onComplete 
}: FocusSessionCelebrationProps) {
  const { width, height } = useWindowSize();
  const [visible, setVisible] = useState(false);
  const milestoneMessage = getMilestoneMessage(totalTrees);

  useEffect(() => {
    if (show) {
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
        setTimeout(onComplete, 300);
      }, 3500);
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
        numberOfPieces={milestoneMessage.pieces}
        gravity={0.25}
        colors={[
          '#10b981',
          '#059669',
          '#047857',
          'hsl(var(--primary))',
          '#FFD700',
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
          {/* Large Tree Emoji with Bounce */}
          <div className="text-9xl mb-4 animate-bounce text-center">
            🌳
          </div>
          
          {/* Success Message */}
          <div className="text-center bg-background/95 backdrop-blur-sm rounded-2xl p-6 shadow-2xl border border-border/50">
            <h3 className="text-2xl font-bold mb-2">
              {milestoneMessage.title}
            </h3>
            <p className="text-lg text-muted-foreground mb-4">
              {sessionDuration} minute focus session completed
            </p>
            
            {/* Stats Badges */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-green-500 to-green-700 text-white shadow-lg">
                <Trees className="w-5 h-5" />
                <span className="font-bold">{totalTrees} {totalTrees === 1 ? 'Tree' : 'Trees'} Planted</span>
              </div>
              
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-500 to-blue-700 text-white shadow-lg">
                <Clock className="w-5 h-5" />
                <span className="font-bold">{totalFocusMinutes} Focus Minutes</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

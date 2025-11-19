import { useEffect, useState } from 'react';
import Confetti from 'react-confetti';
import { useWindowSize } from '@/hooks/use-window-size';
import { Award } from 'lucide-react';
import { toast } from 'sonner';

interface MilestoneCelebrationProps {
  milestone: number; // 25, 50, 75
  challengeName: string;
}

const MilestoneCelebration = ({ milestone, challengeName }: MilestoneCelebrationProps) => {
  const { width, height } = useWindowSize();
  const [show, setShow] = useState(true);

  useEffect(() => {
    // Show confetti for 3 seconds
    const timer = setTimeout(() => setShow(false), 3000);
    
    // Show toast notification
    toast.success(
      <div className="flex items-center gap-2">
        <Award className="w-5 h-5 text-accent" />
        <div>
          <div className="font-bold">Milestone Reached! 🎉</div>
          <div className="text-sm">{milestone}% of {challengeName}</div>
        </div>
      </div>,
      { duration: 4000 }
    );

    return () => clearTimeout(timer);
  }, [milestone, challengeName]);

  if (!show) return null;

  return (
    <Confetti
      width={width}
      height={height}
      recycle={false}
      numberOfPieces={milestone === 75 ? 300 : 200}
      gravity={0.3}
      colors={['hsl(var(--primary))', 'hsl(var(--accent))', 'hsl(var(--secondary))']}
    />
  );
};

export default MilestoneCelebration;

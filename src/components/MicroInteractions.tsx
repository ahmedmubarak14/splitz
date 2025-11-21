import Confetti from 'react-confetti';
import { useWindowSize } from '@/hooks/use-window-size';
import { useEffect, useState } from 'react';
import { Sparkles, Trophy, Target, Flame } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CelebrationProps {
  trigger: boolean;
  type?: 'success' | 'milestone' | 'streak' | 'achievement';
  message?: string;
  onComplete?: () => void;
}

export function Celebration({ trigger, type = 'success', message, onComplete }: CelebrationProps) {
  const { width, height } = useWindowSize();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (trigger) {
      setShow(true);
      const timer = setTimeout(() => {
        setShow(false);
        onComplete?.();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [trigger, onComplete]);

  if (!show) return null;

  const getIcon = () => {
    switch (type) {
      case 'milestone':
        return <Target className="w-12 h-12 text-primary" />;
      case 'streak':
        return <Flame className="w-12 h-12 text-orange-500" />;
      case 'achievement':
        return <Trophy className="w-12 h-12 text-yellow-500" />;
      default:
        return <Sparkles className="w-12 h-12 text-primary" />;
    }
  };

  const getColors = () => {
    switch (type) {
      case 'milestone':
        return ['#3b82f6', '#8b5cf6', '#ec4899'];
      case 'streak':
        return ['#f97316', '#ea580c', '#dc2626'];
      case 'achievement':
        return ['#eab308', '#f59e0b', '#fbbf24'];
      default:
        return ['#3b82f6', '#06b6d4', '#8b5cf6'];
    }
  };

  return (
    <>
      <Confetti
        width={width}
        height={height}
        recycle={false}
        numberOfPieces={200}
        colors={getColors()}
        gravity={0.3}
      />
      <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
        <div className="animate-bounce-in bg-background/95 backdrop-blur-lg p-8 rounded-2xl shadow-2xl border-2 border-primary/20">
          <div className="flex flex-col items-center gap-4">
            <div className="animate-rubber-band">
              {getIcon()}
            </div>
            {message && (
              <p className="text-lg font-semibold text-center animate-fade-in">
                {message}
              </p>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

interface ProgressRingProps {
  progress: number;
  size?: number;
  strokeWidth?: number;
  showPercentage?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export function ProgressRing({
  progress,
  size = 120,
  strokeWidth = 8,
  showPercentage = true,
  className,
  children,
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="hsl(var(--muted))"
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="hsl(var(--primary))"
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-500 ease-out"
          style={{
            filter: 'drop-shadow(0 0 8px hsl(var(--primary) / 0.5))',
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {showPercentage && (
          <span className="text-2xl font-bold">
            {Math.round(progress)}%
          </span>
        )}
        {children}
      </div>
    </div>
  );
}

interface CheckmarkAnimationProps {
  show: boolean;
  size?: number;
}

export function CheckmarkAnimation({ show, size = 64 }: CheckmarkAnimationProps) {
  if (!show) return null;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      className="animate-bounce-in"
    >
      <circle
        cx="32"
        cy="32"
        r="30"
        fill="hsl(var(--success))"
        className="animate-scale-in"
      />
      <path
        d="M20 32 L28 40 L44 24"
        stroke="white"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        className="animate-fade-in"
        style={{ animationDelay: '0.2s' }}
      />
    </svg>
  );
}

interface CounterAnimationProps {
  value: number;
  duration?: number;
  suffix?: string;
  className?: string;
}

export function CounterAnimation({
  value,
  duration = 1000,
  suffix = '',
  className,
}: CounterAnimationProps) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const start = 0;
    const end = value;
    const increment = (end - start) / (duration / 16);
    let current = start;

    const timer = setInterval(() => {
      current += increment;
      if (current >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, 16);

    return () => clearInterval(timer);
  }, [value, duration]);

  return (
    <span className={cn('font-bold tabular-nums', className)}>
      {count}
      {suffix}
    </span>
  );
}

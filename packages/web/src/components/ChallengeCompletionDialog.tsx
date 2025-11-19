import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Trophy, Star, Sparkles, PartyPopper } from 'lucide-react';
import Confetti from 'react-confetti';
import { useWindowSize } from '@/hooks/use-window-size';

interface ChallengeCompletionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  challengeName: string;
}

const ChallengeCompletionDialog = ({ open, onOpenChange, challengeName }: ChallengeCompletionDialogProps) => {
  const { width, height } = useWindowSize();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md border-2 border-primary">
        {open && <Confetti width={width} height={height} recycle={false} numberOfPieces={500} />}
        
        <div className="text-center space-y-6 py-8">
          <div className="relative mx-auto w-32 h-32">
            <div className="absolute inset-0 gradient-primary rounded-full animate-pulse" />
            <div className="absolute inset-2 bg-background rounded-full flex items-center justify-center">
              <Trophy className="w-16 h-16 text-primary" />
            </div>
            <Star className="absolute -top-2 -right-2 w-8 h-8 text-yellow-500 animate-bounce" />
            <Sparkles className="absolute -bottom-2 -left-2 w-8 h-8 text-primary animate-pulse" />
            <PartyPopper className="absolute -top-2 -left-2 w-8 h-8 text-purple-500 animate-bounce" />
          </div>

          <div className="space-y-2">
            <h2 className="text-3xl font-bold gradient-text">Congratulations!</h2>
            <p className="text-lg text-muted-foreground">
              You've completed
            </p>
            <p className="text-xl font-semibold text-foreground">
              {challengeName}
            </p>
          </div>

          <div className="space-y-3 pt-4">
            <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
              <p className="text-sm font-medium text-primary">
                🎉 Achievement Unlocked: Challenge Master!
              </p>
            </div>

            <Button onClick={() => onOpenChange(false)} className="w-full" size="lg">
              Awesome!
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ChallengeCompletionDialog;

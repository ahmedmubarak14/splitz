import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import Confetti from "react-confetti";
import { useWindowSize } from "@/hooks/use-window-size";
import { Trophy, Flame, Target, Star } from "lucide-react";

interface MilestoneModalProps {
  open: boolean;
  onClose: () => void;
  milestone: {
    type: "streak" | "challenge" | "focus" | "habit";
    value: number;
    title: string;
    message: string;
  };
}

const getMilestoneIcon = (type: string) => {
  switch (type) {
    case "streak": return <Flame className="h-16 w-16 text-orange-500" />;
    case "challenge": return <Trophy className="h-16 w-16 text-yellow-500" />;
    case "focus": return <Target className="h-16 w-16 text-purple-500" />;
    case "habit": return <Star className="h-16 w-16 text-blue-500" />;
    default: return <Trophy className="h-16 w-16 text-primary" />;
  }
};

export function MilestoneModal({ open, onClose, milestone }: MilestoneModalProps) {
  const { width, height } = useWindowSize();

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        {open && <Confetti width={width} height={height} recycle={false} numberOfPieces={200} />}
        
        <div className="flex flex-col items-center text-center space-y-6 py-6">
          <div className="animate-bounce">
            {getMilestoneIcon(milestone.type)}
          </div>
          
          <div className="space-y-2">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
              {milestone.title}
            </h2>
            <p className="text-lg text-muted-foreground">
              {milestone.message}
            </p>
          </div>
          
          <div className="flex items-center justify-center gap-2 px-6 py-3 bg-primary/10 rounded-full">
            <span className="text-4xl font-bold text-primary">{milestone.value}</span>
            <span className="text-muted-foreground">
              {milestone.type === "streak" && "day streak"}
              {milestone.type === "challenge" && "% complete"}
              {milestone.type === "focus" && "minutes"}
              {milestone.type === "habit" && "habits"}
            </span>
          </div>
          
          <div className="space-y-2 w-full">
            <Button onClick={onClose} className="w-full">
              Keep Going! 🚀
            </Button>
            <Button variant="outline" onClick={onClose} className="w-full">
              Share Achievement
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

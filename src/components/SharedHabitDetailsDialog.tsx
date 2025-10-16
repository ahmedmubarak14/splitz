import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface SharedHabitDetailsDialogProps {
  habitId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: () => void;
}

export function SharedHabitDetailsDialog({
  habitId,
  open,
  onOpenChange,
  onUpdate,
}: SharedHabitDetailsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Habit Details</DialogTitle>
        </DialogHeader>
        <div className="p-4">
          <p className="text-muted-foreground">Habit ID: {habitId}</p>
          <p className="text-sm mt-2">
            Detailed stats and management coming soon!
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

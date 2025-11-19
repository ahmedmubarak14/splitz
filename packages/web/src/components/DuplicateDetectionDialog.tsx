import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle } from "lucide-react";
import { DuplicateMatch } from "@/lib/duplicateDetection";

interface DuplicateDetectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  duplicates: DuplicateMatch[];
  newSubscriptionName: string;
  onProceed: () => void;
  onCancel: () => void;
}

export const DuplicateDetectionDialog = ({
  open,
  onOpenChange,
  duplicates,
  newSubscriptionName,
  onProceed,
  onCancel,
}: DuplicateDetectionDialogProps) => {
  if (duplicates.length === 0) return null;

  const topDuplicate = duplicates[0];
  const isExactMatch = topDuplicate.similarity === 100;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-warning" />
            <AlertDialogTitle>
              {isExactMatch ? "Duplicate Subscription Detected" : "Similar Subscription Found"}
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription className="space-y-4">
            <p>
              {isExactMatch
                ? `You already have a subscription named "${topDuplicate.subscription.name}".`
                : `We found a similar subscription in your list.`}
            </p>

            <div className="bg-muted p-4 rounded-lg space-y-3">
              <div>
                <p className="text-sm font-medium text-foreground mb-2">Existing Subscription:</p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{topDuplicate.subscription.name}</span>
                    <Badge variant="secondary">
                      {topDuplicate.similarity.toFixed(0)}% match
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {topDuplicate.subscription.amount} {topDuplicate.subscription.currency} / {topDuplicate.subscription.billing_cycle}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Status: {topDuplicate.subscription.status}
                  </div>
                </div>
              </div>

              <div className="border-t pt-3">
                <p className="text-sm font-medium text-foreground mb-2">New Subscription:</p>
                <div className="font-medium">{newSubscriptionName}</div>
              </div>
            </div>

            {duplicates.length > 1 && (
              <div className="text-sm">
                <p className="font-medium mb-2">Other similar subscriptions:</p>
                <ul className="space-y-1">
                  {duplicates.slice(1, 3).map((dup, index) => (
                    <li key={index} className="flex items-center justify-between text-muted-foreground">
                      <span>{dup.subscription.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {dup.similarity.toFixed(0)}% match
                      </Badge>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <p className="text-sm">
              {isExactMatch
                ? "Did you mean to add a different account for the same service, or is this a mistake?"
                : "Is this a new subscription or did you mean to edit the existing one?"}
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onProceed}>
            Add Anyway
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, CheckCircle, Clock } from "lucide-react";
import { differenceInDays, format } from "date-fns";
import { useTranslation } from "react-i18next";
import { formatCurrency } from "@/lib/formatters";
import { EmptyState } from "./EmptyState";

interface TrialTrackerProps {
  subscriptions: any[];
  onEdit: (subscription: any) => void;
}

export const TrialTracker = ({ subscriptions, onEdit }: TrialTrackerProps) => {
  const { t, i18n } = useTranslation();

  const trialSubscriptions = subscriptions.filter(sub => 
    sub.trial_ends_at && new Date(sub.trial_ends_at) > new Date()
  ).sort((a, b) => 
    new Date(a.trial_ends_at).getTime() - new Date(b.trial_ends_at).getTime()
  );

  if (trialSubscriptions.length === 0) {
    return (
      <EmptyState
        icon={CheckCircle}
        title="No Active Trials"
        description="You don't have any active free trials at the moment."
      />
    );
  }

  return (
    <div className="space-y-4">
      {trialSubscriptions.map(sub => {
        const daysLeft = differenceInDays(new Date(sub.trial_ends_at), new Date());
        const urgency = daysLeft <= 1 ? 'critical' : daysLeft <= 3 ? 'warning' : 'normal';

        return (
          <Card key={sub.id} className={urgency === 'critical' ? 'border-destructive' : urgency === 'warning' ? 'border-warning' : ''}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-card border border-border flex items-center justify-center">
                    {sub.logo_url ? (
                      <img src={sub.logo_url} alt={sub.name} className="h-6 w-6 object-contain" />
                    ) : (
                      <Clock className="h-5 w-5 text-primary" />
                    )}
                  </div>
                  <div>
                    <CardTitle className="text-base">{sub.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Trial ends {format(new Date(sub.trial_ends_at), 'MMM d, yyyy')}
                    </p>
                  </div>
                </div>
                <Badge variant={urgency === 'critical' ? 'destructive' : urgency === 'warning' ? 'default' : 'secondary'}>
                  {daysLeft} {daysLeft === 1 ? 'day' : 'days'} left
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Will convert to:</span>
                <span className="font-semibold">{formatCurrency(Number(sub.amount), sub.currency, i18n.language)}/{sub.billing_cycle}</span>
              </div>

              {urgency === 'critical' && (
                <div className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <AlertTriangle className="h-4 w-4 text-destructive mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-destructive">Trial ending soon!</p>
                    <p className="text-muted-foreground">Cancel now to avoid being charged.</p>
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => onEdit(sub)} className="flex-1">
                  Manage Trial
                </Button>
                <Button variant="destructive" size="sm" className="flex-1">
                  Cancel Before Charge
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

import { CreditCard, Calendar, Users } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format, differenceInDays } from "date-fns";

interface SubscriptionCardProps {
  subscription: any;
}

export const SubscriptionCard = ({ subscription }: SubscriptionCardProps) => {
  const daysUntilRenewal = differenceInDays(
    new Date(subscription.next_renewal_date),
    new Date()
  );

  const renewalStatus = daysUntilRenewal < 0 
    ? "overdue" 
    : daysUntilRenewal <= 3 
    ? "due-soon" 
    : "upcoming";

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <CreditCard className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">{subscription.name}</h3>
              <p className="text-sm text-muted-foreground">
                {subscription.category}
              </p>
            </div>
          </div>
          {subscription.is_shared && (
            <Badge variant="secondary">
              <Users className="h-3 w-3 mr-1" />
              Shared
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-2xl font-bold">
            {subscription.currency} {Number(subscription.amount).toFixed(2)}
          </span>
          <Badge variant="outline">{subscription.billing_cycle}</Badge>
        </div>

        <div className="flex items-center gap-2 text-sm">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span className={
            renewalStatus === "overdue" 
              ? "text-destructive font-semibold" 
              : renewalStatus === "due-soon"
              ? "text-yellow-600 font-semibold"
              : "text-muted-foreground"
          }>
            {renewalStatus === "overdue" 
              ? `${Math.abs(daysUntilRenewal)} days overdue`
              : `Renews in ${daysUntilRenewal} days`
            }
          </span>
        </div>

        {subscription.is_shared && subscription.subscription_contributors && (
          <div className="pt-2 border-t">
            <p className="text-xs text-muted-foreground mb-1">
              {subscription.subscription_contributors.length} contributors
            </p>
          </div>
        )}

        <Button variant="outline" className="w-full">
          Mark as Paid
        </Button>
      </CardContent>
    </Card>
  );
};
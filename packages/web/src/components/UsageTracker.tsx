import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Circle, TrendingUp, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { format, differenceInDays } from "date-fns";

interface UsageTrackerProps {
  subscription: any;
  compact?: boolean;
}

export const UsageTracker = ({ subscription, compact = false }: UsageTrackerProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const logUsageMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('subscription_usage_logs')
        .insert({
          subscription_id: subscription.id,
          user_id: user.id,
          used_at: new Date().toISOString(),
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      toast({
        title: "Usage Logged",
        description: `Marked "${subscription.name}" as used today`,
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to log usage: " + error.message,
        variant: "destructive",
      });
    },
  });

  const handleMarkAsUsed = () => {
    setIsLoading(true);
    logUsageMutation.mutate();
    setTimeout(() => setIsLoading(false), 500);
  };

  const getUsageStatus = () => {
    const lastUsed = subscription.last_used_at ? new Date(subscription.last_used_at) : null;
    const frequency = subscription.usage_frequency || 'unknown';

    if (!lastUsed) {
      return {
        status: 'never',
        message: 'Never used',
        variant: 'secondary' as const,
        showWarning: true,
      };
    }

    const daysSinceUsed = differenceInDays(new Date(), lastUsed);

    if (daysSinceUsed === 0) {
      return {
        status: 'today',
        message: 'Used today',
        variant: 'default' as const,
        showWarning: false,
      };
    }

    if (daysSinceUsed === 1) {
      return {
        status: 'recent',
        message: 'Used yesterday',
        variant: 'secondary' as const,
        showWarning: false,
      };
    }

    if (daysSinceUsed <= 7) {
      return {
        status: 'recent',
        message: `Used ${daysSinceUsed} days ago`,
        variant: 'secondary' as const,
        showWarning: false,
      };
    }

    if (daysSinceUsed <= 30) {
      return {
        status: 'moderate',
        message: `Used ${daysSinceUsed} days ago`,
        variant: 'outline' as const,
        showWarning: daysSinceUsed > 21,
      };
    }

    return {
      status: 'unused',
      message: `Not used for ${daysSinceUsed} days`,
      variant: 'destructive' as const,
      showWarning: true,
    };
  };

  const getFrequencyBadge = () => {
    const frequency = subscription.usage_frequency || 'unknown';
    
    const variants: Record<string, { variant: any; icon: any }> = {
      daily: { variant: 'default', icon: TrendingUp },
      weekly: { variant: 'secondary', icon: CheckCircle2 },
      monthly: { variant: 'outline', icon: Circle },
      rarely: { variant: 'destructive', icon: AlertCircle },
      unknown: { variant: 'secondary', icon: Circle },
    };

    const config = variants[frequency] || variants.unknown;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {frequency.charAt(0).toUpperCase() + frequency.slice(1)}
      </Badge>
    );
  };

  const usageStatus = getUsageStatus();

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        {getFrequencyBadge()}
        <Button
          size="sm"
          variant="ghost"
          onClick={handleMarkAsUsed}
          disabled={isLoading || logUsageMutation.isPending}
          className="h-7"
        >
          {usageStatus.status === 'today' ? (
            <CheckCircle2 className="h-4 w-4 text-success" />
          ) : (
            <Circle className="h-4 w-4" />
          )}
          <span className="ml-1 text-xs">{usageStatus.message}</span>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium">Usage Tracking</p>
          <div className="flex items-center gap-2">
            {getFrequencyBadge()}
            <Badge variant={usageStatus.variant}>{usageStatus.message}</Badge>
          </div>
        </div>
        <Button
          size="sm"
          variant={usageStatus.status === 'today' ? 'secondary' : 'default'}
          onClick={handleMarkAsUsed}
          disabled={isLoading || logUsageMutation.isPending}
        >
          {usageStatus.status === 'today' ? (
            <>
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Used Today
            </>
          ) : (
            <>
              <Circle className="h-4 w-4 mr-2" />
              Mark as Used
            </>
          )}
        </Button>
      </div>

      {usageStatus.showWarning && (
        <div className="flex items-start gap-2 p-2 bg-warning/10 border border-warning/20 rounded text-xs">
          <AlertCircle className="h-4 w-4 text-warning mt-0.5" />
          <div>
            <p className="font-medium">Consider canceling this subscription</p>
            <p className="text-muted-foreground">
              You haven't used this service recently. You could save SAR {subscription.amount}/
              {subscription.billing_cycle}.
            </p>
          </div>
        </div>
      )}

      {subscription.last_used_at && (
        <p className="text-xs text-muted-foreground">
          Last used: {format(new Date(subscription.last_used_at), 'MMM d, yyyy')}
        </p>
      )}
    </div>
  );
};
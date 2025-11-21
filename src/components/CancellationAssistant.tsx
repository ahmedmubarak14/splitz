import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  AlertCircle, 
  CheckCircle2, 
  Copy, 
  ExternalLink, 
  Mail,
  Calendar,
  DollarSign
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { differenceInDays, format } from "date-fns";

interface CancellationAssistantProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subscription: any;
}

export const CancellationAssistant = ({
  open,
  onOpenChange,
  subscription,
}: CancellationAssistantProps) => {
  const [cancellationUrl, setCancellationUrl] = useState(subscription?.cancellation_url || "");
  const [cancellationNotes, setCancellationNotes] = useState(subscription?.cancellation_notes || "");
  const [step, setStep] = useState<'info' | 'email' | 'confirm'>('info');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updateCancellationInfoMutation = useMutation({
    mutationFn: async (data: { url: string; notes: string }) => {
      const { error } = await supabase
        .from('subscriptions')
        .update({
          cancellation_url: data.url,
          cancellation_notes: data.notes,
        })
        .eq('id', subscription.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
    },
  });

  const markAsCanceledMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('subscriptions')
        .update({
          status: 'canceled',
          canceled_at: new Date().toISOString(),
        })
        .eq('id', subscription.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      toast({
        title: "Subscription Canceled",
        description: `${subscription.name} has been marked as canceled.`,
      });
      onOpenChange(false);
    },
  });

  const handleSaveInfo = () => {
    updateCancellationInfoMutation.mutate({
      url: cancellationUrl,
      notes: cancellationNotes,
    });
  };

  const generateCancellationEmail = () => {
    const subject = `Request to Cancel ${subscription.name} Subscription`;
    const body = `Dear ${subscription.name} Support Team,

I am writing to request the cancellation of my ${subscription.name} subscription.

Account Details:
- Service: ${subscription.name}
- Current Plan: ${subscription.amount} ${subscription.currency}/${subscription.billing_cycle}
${subscription.trial_ends_at ? `- Trial End Date: ${format(new Date(subscription.trial_ends_at), 'MMM d, yyyy')}\n` : ''}
Please process this cancellation request and confirm once it has been completed. I would appreciate if you could also provide confirmation of my final billing date.

Thank you for your assistance.

Best regards`;

    return { subject, body };
  };

  const copyEmailTemplate = () => {
    const { subject, body } = generateCancellationEmail();
    const fullText = `Subject: ${subject}\n\n${body}`;
    
    navigator.clipboard.writeText(fullText);
    toast({
      title: "Email Template Copied",
      description: "The cancellation email has been copied to your clipboard",
    });
  };

  const sendEmail = () => {
    const { subject, body } = generateCancellationEmail();
    window.location.href = `mailto:support@${subscription.name.toLowerCase().replace(/\s+/g, '')}.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  const calculateSavings = () => {
    if (!subscription.next_renewal_date) return 0;
    
    const daysUntilRenewal = differenceInDays(
      new Date(subscription.next_renewal_date),
      new Date()
    );

    if (daysUntilRenewal <= 0) return 0;

    // Calculate potential savings based on billing cycle
    const cycleMultiplier = subscription.billing_cycle === 'yearly' ? 1 : 
                           subscription.billing_cycle === 'monthly' ? 12 :
                           subscription.billing_cycle === 'quarterly' ? 4 : 52;

    return subscription.amount * cycleMultiplier;
  };

  const savings = calculateSavings();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Cancel {subscription?.name}</DialogTitle>
          <DialogDescription>
            We'll help you through the cancellation process step by step
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Savings Info */}
          {savings > 0 && (
            <div className="bg-success/10 border border-success/20 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <DollarSign className="h-5 w-5 text-success mt-0.5" />
                <div>
                  <p className="font-medium">Potential Annual Savings</p>
                  <p className="text-2xl font-bold text-success">
                    {subscription.currency} {savings.toFixed(2)}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    by canceling this subscription
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Trial Warning */}
          {subscription.trial_ends_at && new Date(subscription.trial_ends_at) > new Date() && (
            <div className="bg-warning/10 border border-warning/20 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-warning mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium">Free Trial Active</p>
                  <p className="text-sm text-muted-foreground">
                    Your trial ends on {format(new Date(subscription.trial_ends_at), 'MMM d, yyyy')}.
                    Cancel before then to avoid being charged {subscription.currency} {subscription.amount}.
                  </p>
                </div>
              </div>
            </div>
          )}

          {step === 'info' && (
            <>
              {/* Cancellation Steps */}
              <div className="space-y-4">
                <h3 className="font-medium">How to Cancel</h3>
                
                {subscription.cancellation_url || cancellationUrl ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-success" />
                      <span className="font-medium">Step 1: Visit Cancellation Page</span>
                    </div>
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => window.open(cancellationUrl || subscription.cancellation_url, '_blank')}
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      {cancellationUrl || subscription.cancellation_url}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label htmlFor="cancelUrl">Cancellation URL (optional)</Label>
                    <Input
                      id="cancelUrl"
                      placeholder="https://service.com/cancel"
                      value={cancellationUrl}
                      onChange={(e) => setCancellationUrl(e.target.value)}
                    />
                  </div>
                )}

                {subscription.cancellation_notes || cancellationNotes ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-success" />
                      <span className="font-medium">Step 2: Follow Instructions</span>
                    </div>
                    <div className="bg-muted p-4 rounded-lg">
                      <p className="text-sm whitespace-pre-wrap">
                        {cancellationNotes || subscription.cancellation_notes}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label htmlFor="notes">Cancellation Instructions (optional)</Label>
                    <Textarea
                      id="notes"
                      placeholder="e.g., Go to Settings > Subscription > Cancel"
                      value={cancellationNotes}
                      onChange={(e) => setCancellationNotes(e.target.value)}
                      rows={3}
                    />
                  </div>
                )}

                {(cancellationUrl !== subscription.cancellation_url || 
                  cancellationNotes !== subscription.cancellation_notes) && (
                  <Button
                    variant="outline"
                    onClick={handleSaveInfo}
                    disabled={updateCancellationInfoMutation.isPending}
                  >
                    Save Cancellation Info
                  </Button>
                )}
              </div>

              {/* Email Option */}
              <div className="pt-4 border-t">
                <h3 className="font-medium mb-3">Need Help?</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  If you can't find the cancellation option, we can help you draft an email to customer support.
                </p>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setStep('email')}
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Generate Cancellation Email
                </Button>
              </div>
            </>
          )}

          {step === 'email' && (
            <div className="space-y-4">
              <div className="bg-muted p-4 rounded-lg space-y-3">
                <div className="space-y-1">
                  <p className="text-sm font-medium">Subject:</p>
                  <p className="text-sm">{generateCancellationEmail().subject}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">Body:</p>
                  <p className="text-sm whitespace-pre-wrap">
                    {generateCancellationEmail().body}
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={copyEmailTemplate} className="flex-1">
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Template
                </Button>
                <Button onClick={sendEmail} className="flex-1">
                  <Mail className="h-4 w-4 mr-2" />
                  Send Email
                </Button>
              </div>

              <Button variant="ghost" onClick={() => setStep('info')}>
                Back to Instructions
              </Button>
            </div>
          )}

          {/* Mark as Canceled */}
          <div className="pt-4 border-t">
            <Button
              variant="destructive"
              className="w-full"
              onClick={() => setStep('confirm')}
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              I've Canceled - Mark as Canceled
            </Button>
          </div>

          {step === 'confirm' && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 space-y-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium">Confirm Cancellation</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Have you successfully canceled your {subscription.name} subscription with the service provider?
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="destructive"
                  onClick={() => markAsCanceledMutation.mutate()}
                  disabled={markAsCanceledMutation.isPending}
                  className="flex-1"
                >
                  Yes, Mark as Canceled
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setStep('info')}
                  className="flex-1"
                >
                  No, Go Back
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
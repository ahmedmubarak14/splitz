import { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useIsRTL } from "@/lib/rtl-utils";
import { formatDate } from "@/lib/formatters";
import { detectDuplicatesEnhanced } from "@/lib/duplicateDetection";
import { DuplicateDetectionDialog } from "./DuplicateDetectionDialog";
import { SubscriptionTemplateSelector } from "./SubscriptionTemplateSelector";
import { InlineContributorManager } from "./InlineContributorManager";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface CreateSubscriptionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CreateSubscriptionDialog = ({ open, onOpenChange }: CreateSubscriptionDialogProps) => {
  const { t, i18n } = useTranslation();
  const isRTL = useIsRTL();
  const queryClient = useQueryClient();
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [isTrial, setIsTrial] = useState(false);
  const [trialStartDate, setTrialStartDate] = useState<Date>(new Date());
  const [trialEndDate, setTrialEndDate] = useState<Date | undefined>();
  const [duplicateMatches, setDuplicateMatches] = useState<any[]>([]);
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    amount: "",
    currency: "SAR",
    billing_cycle: "monthly",
    category: "other",
    is_shared: false,
    next_renewal_date: new Date(),
    logo_url: "",
  });
  
  const [contributorData, setContributorData] = useState<{
    userIds: string[];
    emails: string[];
    splitType: any;
    memberSplits: any[];
  }>({
    userIds: [],
    emails: [],
    splitType: 'equal',
    memberSplits: [],
  });

  // Fetch existing subscriptions for duplicate detection
  const { data: existingSubscriptions = [] } = useQuery({
    queryKey: ['subscriptions'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      
      const { data } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id);
      
      return data || [];
    },
    enabled: open,
  });

  // Check for duplicates when name changes
  useEffect(() => {
    if (formData.name && formData.name.length > 2) {
      const matches = detectDuplicatesEnhanced(formData.name, existingSubscriptions, 70);
      setDuplicateMatches(matches);
    } else {
      setDuplicateMatches([]);
    }
  }, [formData.name, existingSubscriptions]);

  const handleTemplateSelect = useCallback((template: any) => {
    setFormData({
      ...formData,
      name: template.name,
      amount: template.typical_price?.toString() || "",
      currency: template.typical_currency || "SAR",
      category: template.category || "other",
      logo_url: template.logo_url || "",
    });
    setSelectedTemplate(template.id);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check for duplicates before submitting
    if (duplicateMatches.length > 0) {
      setShowDuplicateDialog(true);
      return;
    }

    await createSubscription();
  };

  const createSubscription = async () => {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) {
      toast.error(t('errors.notAuthenticated'));
      return;
    }

    const subscriptionData: any = {
      name: formData.name,
      amount: parseFloat(formData.amount),
      currency: formData.currency,
      billing_cycle: formData.billing_cycle,
      category: formData.category,
      is_shared: formData.is_shared,
      split_type: formData.is_shared ? contributorData.splitType : null,
      next_renewal_date: format(formData.next_renewal_date, "yyyy-MM-dd"),
      user_id: user.id,
      logo_url: formData.logo_url || null,
    };

    // Add trial fields if trial is enabled
    if (isTrial && trialEndDate) {
      subscriptionData.trial_starts_at = format(trialStartDate, "yyyy-MM-dd");
      subscriptionData.trial_ends_at = format(trialEndDate, "yyyy-MM-dd");
    }

    const { data: newSubscription, error } = await supabase
      .from("subscriptions")
      .insert([subscriptionData])
      .select()
      .single();

    if (error) {
      toast.error(t('errors.genericError'));
      return;
    }

    // If shared, add contributors
    if (formData.is_shared && newSubscription && (contributorData.userIds.length > 0 || contributorData.emails.length > 0)) {
      // Add existing users as contributors
      if (contributorData.userIds.length > 0) {
        const contributors = contributorData.memberSplits
          .filter(split => contributorData.userIds.includes(split.user_id))
          .map(split => ({
            subscription_id: newSubscription.id,
            user_id: split.user_id,
            contribution_amount: split.calculated_amount,
            split_value: split.split_value,
          }));
        
        const { error: contribError } = await supabase
          .from('subscription_contributors')
          .insert(contributors);
        
        if (contribError) {
          console.error("Error adding contributors:", contribError);
          toast.error(t("subscriptions.failedToAddContributors"));
        }
      }

      // Create invitations for emails
      if (contributorData.emails.length > 0) {
        for (const email of contributorData.emails) {
          // Find the split amount for this email
          const emailSplit = contributorData.memberSplits.find(s => s.full_name === email || s.name === email);
          
          const inviteCode = Math.random().toString(36).substring(2, 15);
          const { error: inviteError } = await supabase
            .from('invitations')
            .insert({
              invite_code: inviteCode,
              invite_type: 'subscription',
              resource_id: newSubscription.id,
              created_by: user.id,
              expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
              payload: { 
                email, 
                subscription_name: newSubscription.name,
                contribution_amount: emailSplit?.calculated_amount || 0,
              },
            });
          
          if (inviteError) {
            console.error("Error creating invitation:", inviteError);
          }
        }
      }
    }

    toast.success(t('toast.subscriptionCreated'));
    queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
    onOpenChange(false);
    resetForm();
  };

  const resetForm = () => {
    setSelectedTemplate(null);
    setIsTrial(false);
    setTrialStartDate(new Date());
    setTrialEndDate(undefined);
    setDuplicateMatches([]);
    setContributorData({
      userIds: [],
      emails: [],
      splitType: 'equal',
      memberSplits: [],
    });
    setFormData({
      name: "",
      amount: "",
      currency: "SAR",
      billing_cycle: "monthly",
      category: "other",
      is_shared: false,
      next_renewal_date: new Date(),
      logo_url: "",
    });
  };

  return (
    <>
      <DuplicateDetectionDialog
        open={showDuplicateDialog}
        onOpenChange={setShowDuplicateDialog}
        duplicates={duplicateMatches}
        newSubscriptionName={formData.name}
        onProceed={() => {
          setShowDuplicateDialog(false);
          createSubscription();
        }}
        onCancel={() => setShowDuplicateDialog(false)}
      />

      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('subscriptions.addSubscription')}</DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="quick" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="quick">Quick Add</TabsTrigger>
              <TabsTrigger value="custom">Custom</TabsTrigger>
            </TabsList>

            <TabsContent value="quick" className="space-y-4 mt-4">
              <SubscriptionTemplateSelector
                onSelect={handleTemplateSelect}
                selectedTemplate={selectedTemplate}
              />
              
              {selectedTemplate && (
                <form onSubmit={handleSubmit} className="space-y-4 border-t pt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="amount">{t('subscriptions.amount')}</Label>
                      <Input
                        id="amount"
                        type="number"
                        step="0.01"
                        value={formData.amount}
                        onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="currency">{t('subscriptions.currency')}</Label>
                      <Select value={formData.currency} onValueChange={(value) => setFormData({ ...formData, currency: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="SAR">SAR</SelectItem>
                          <SelectItem value="USD">USD</SelectItem>
                          <SelectItem value="EUR">EUR</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="billing_cycle">{t('subscriptions.billingCycle')}</Label>
                    <Select value={formData.billing_cycle} onValueChange={(value) => setFormData({ ...formData, billing_cycle: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="monthly">{t('subscriptions.monthly')}</SelectItem>
                        <SelectItem value="yearly">{t('subscriptions.yearly')}</SelectItem>
                        <SelectItem value="weekly">{t('subscriptions.weekly')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Trial Toggle */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="is_trial">Is this a free trial?</Label>
                      <Switch
                        id="is_trial"
                        checked={isTrial}
                        onCheckedChange={setIsTrial}
                      />
                    </div>
                    
                    {isTrial && (
                      <div className="space-y-3 pt-2">
                        <Alert>
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>
                            Trial will convert to paid on the end date
                          </AlertDescription>
                        </Alert>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Trial Start Date</Label>
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button variant="outline" className="w-full justify-start">
                                  <CalendarIcon className="mr-2 h-4 w-4" />
                                  {format(trialStartDate, "PPP")}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0">
                                <Calendar
                                  mode="single"
                                  selected={trialStartDate}
                                  onSelect={(date) => date && setTrialStartDate(date)}
                                  className="pointer-events-auto"
                                />
                              </PopoverContent>
                            </Popover>
                          </div>

                          <div>
                            <Label>Trial End Date</Label>
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button variant="outline" className="w-full justify-start">
                                  <CalendarIcon className="mr-2 h-4 w-4" />
                                  {trialEndDate ? format(trialEndDate, "PPP") : "Select date"}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0">
                                <Calendar
                                  mode="single"
                                  selected={trialEndDate}
                                  onSelect={setTrialEndDate}
                                  className="pointer-events-auto"
                                  disabled={(date) => date < trialStartDate}
                                />
                              </PopoverContent>
                            </Popover>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <Label>{t('subscriptions.nextRenewalDate')}</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start">
                          <CalendarIcon className={`${isRTL ? 'ml-2' : 'mr-2'} h-4 w-4`} />
                          {formatDate(formData.next_renewal_date, i18n.language, { year: 'numeric', month: 'long', day: 'numeric' })}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={formData.next_renewal_date}
                          onSelect={(date) => date && setFormData({ ...formData, next_renewal_date: date })}
                          className="pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="is_shared">{t('subscriptions.sharedSubscription')}</Label>
                      <Switch
                        id="is_shared"
                        checked={formData.is_shared}
                        onCheckedChange={(checked) => setFormData({ ...formData, is_shared: checked })}
                      />
                    </div>
                  </div>

                  {formData.is_shared && (
                    <InlineContributorManager
                      totalAmount={parseFloat(formData.amount) || 0}
                      currency={formData.currency}
                      onContributorsChange={setContributorData}
                    />
                  )}

                  {duplicateMatches.length > 0 && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        Possible duplicate detected! You already have "{duplicateMatches[0].subscription.name}"
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="flex gap-2">
                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
                      {t('common.cancel')}
                    </Button>
                    <Button type="submit" className="flex-1">{t('subscriptions.create')}</Button>
                  </div>
                </form>
              )}
            </TabsContent>

            <TabsContent value="custom" className="space-y-4 mt-4">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">{t('subscriptions.name')} *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder={t('subscriptions.namePlaceholder')}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="amount_custom">{t('subscriptions.amount')}</Label>
                    <Input
                      id="amount_custom"
                      type="number"
                      step="0.01"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="currency_custom">{t('subscriptions.currency')}</Label>
                    <Select value={formData.currency} onValueChange={(value) => setFormData({ ...formData, currency: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="SAR">SAR</SelectItem>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="EUR">EUR</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="billing_cycle_custom">{t('subscriptions.billingCycle')}</Label>
                  <Select value={formData.billing_cycle} onValueChange={(value) => setFormData({ ...formData, billing_cycle: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">{t('subscriptions.monthly')}</SelectItem>
                      <SelectItem value="yearly">{t('subscriptions.yearly')}</SelectItem>
                      <SelectItem value="weekly">{t('subscriptions.weekly')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="category_custom">{t('subscriptions.category')}</Label>
                  <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="streaming">{t('subscriptions.streaming')}</SelectItem>
                      <SelectItem value="software">{t('subscriptions.software')}</SelectItem>
                      <SelectItem value="fitness">{t('subscriptions.fitness')}</SelectItem>
                      <SelectItem value="education">{t('subscriptions.education')}</SelectItem>
                      <SelectItem value="other">{t('subscriptions.other')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Trial Toggle for Custom */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="is_trial_custom">Is this a free trial?</Label>
                    <Switch
                      id="is_trial_custom"
                      checked={isTrial}
                      onCheckedChange={setIsTrial}
                    />
                  </div>
                  
                  {isTrial && (
                    <div className="space-y-3 pt-2">
                      <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          Trial will convert to paid on the end date
                        </AlertDescription>
                      </Alert>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Trial Start Date</Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button variant="outline" className="w-full justify-start">
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {format(trialStartDate, "PPP")}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                              <Calendar
                                mode="single"
                                selected={trialStartDate}
                                onSelect={(date) => date && setTrialStartDate(date)}
                                className="pointer-events-auto"
                              />
                            </PopoverContent>
                          </Popover>
                        </div>

                        <div>
                          <Label>Trial End Date</Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button variant="outline" className="w-full justify-start">
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {trialEndDate ? format(trialEndDate, "PPP") : "Select date"}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                              <Calendar
                                mode="single"
                                selected={trialEndDate}
                                onSelect={setTrialEndDate}
                                className="pointer-events-auto"
                                disabled={(date) => date < trialStartDate}
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <Label>{t('subscriptions.nextRenewalDate')}</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start">
                        <CalendarIcon className={`${isRTL ? 'ml-2' : 'mr-2'} h-4 w-4`} />
                        {formatDate(formData.next_renewal_date, i18n.language, { year: 'numeric', month: 'long', day: 'numeric' })}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formData.next_renewal_date}
                        onSelect={(date) => date && setFormData({ ...formData, next_renewal_date: date })}
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="is_shared_custom">{t('subscriptions.sharedSubscription')}</Label>
                    <Switch
                      id="is_shared_custom"
                      checked={formData.is_shared}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_shared: checked })}
                    />
                  </div>
                </div>

                {formData.is_shared && (
                  <InlineContributorManager
                    totalAmount={parseFloat(formData.amount) || 0}
                    currency={formData.currency}
                    onContributorsChange={setContributorData}
                  />
                )}

                {duplicateMatches.length > 0 && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Possible duplicate detected! You already have "{duplicateMatches[0].subscription.name}"
                    </AlertDescription>
                  </Alert>
                )}

                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
                    {t('common.cancel')}
                  </Button>
                  <Button type="submit" className="flex-1">{t('subscriptions.create')}</Button>
                </div>
              </form>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </>
  );
};

import { useState } from "react";
import { Plus, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SEO } from "@/components/SEO";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { SubscriptionCard } from "@/components/SubscriptionCard";
import { CreateSubscriptionDialog } from "@/components/CreateSubscriptionDialog";
import { EmptyState } from "@/components/EmptyState";
import { useTranslation } from "react-i18next";
import { useIsRTL, rtlClass } from "@/lib/rtl-utils";
import { formatCurrency } from "@/lib/formatters";

export default function Subscriptions() {
  const { t, i18n } = useTranslation();
  const isRTL = useIsRTL();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedTab, setSelectedTab] = useState("personal");

  const { data: subscriptions, isLoading } = useQuery({
    queryKey: ["subscriptions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subscriptions")
        .select(`
          *,
          subscription_contributors(
            id,
            user_id,
            contribution_amount,
            is_settled,
            paid_at
          )
        `)
        .eq("is_active", true)
        .order("next_renewal_date", { ascending: true });

      if (error) {
        toast.error(t('errors.failedToLoad'));
        throw error;
      }
      return data;
    },
  });

  const personalSubscriptions = subscriptions?.filter(s => !s.is_shared) || [];
  const sharedSubscriptions = subscriptions?.filter(s => s.is_shared) || [];

  const totalMonthly = personalSubscriptions.reduce((sum, sub) => {
    if (sub.billing_cycle === "monthly") return sum + Number(sub.amount);
    if (sub.billing_cycle === "yearly") return sum + Number(sub.amount) / 12;
    if (sub.billing_cycle === "weekly") return sum + Number(sub.amount) * 4;
    return sum;
  }, 0);

  return (
    <>
      <SEO 
        title={`${t('subscriptions.title')} - Splitz`}
        description={t('subscriptions.subtitle')}
      />
      
      <div className={`min-h-screen p-4 md:p-6 space-y-6 ${isRTL ? 'rtl' : 'ltr'}`}>
        {/* Header */}
        <div className={`flex justify-between items-center ${rtlClass(isRTL, 'flex-row-reverse', 'flex-row')}`}>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              {t('subscriptions.title')}
            </h1>
            <p className="text-muted-foreground mt-1">
              {t('subscriptions.subtitle')}
            </p>
          </div>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className={`${isRTL ? 'ml-2' : 'mr-2'} h-4 w-4`} />
            {t('subscriptions.addSubscription')}
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t('subscriptions.monthlyTotal')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(totalMonthly, 'SAR', i18n.language)}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t('subscriptions.activeSubscriptions')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {personalSubscriptions.length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t('subscriptions.sharedSubscriptions')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {sharedSubscriptions.length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Subscriptions List */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="personal">{t('subscriptions.personalSubscriptions')}</TabsTrigger>
            <TabsTrigger value="shared">{t('subscriptions.sharedSubscriptions')}</TabsTrigger>
          </TabsList>

          <TabsContent value="personal" className="space-y-4 mt-6">
            {isLoading ? (
              <div className="text-center py-12">{t('common.loading')}</div>
            ) : personalSubscriptions.length === 0 ? (
              <EmptyState
                icon={CreditCard}
                title={t('subscriptions.noPersonalSubscriptions')}
                description={t('subscriptions.startTracking')}
                actionLabel={t('subscriptions.addFirstSubscription')}
                onAction={() => setCreateDialogOpen(true)}
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {personalSubscriptions.map((subscription) => (
                  <SubscriptionCard key={subscription.id} subscription={subscription} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="shared" className="space-y-4 mt-6">
            {isLoading ? (
              <div className="text-center py-12">{t('common.loading')}</div>
            ) : sharedSubscriptions.length === 0 ? (
              <EmptyState
                icon={CreditCard}
                title={t('subscriptions.noSharedSubscriptions')}
                description={t('subscriptions.splitCosts')}
                actionLabel={t('subscriptions.createSharedSubscription')}
                onAction={() => setCreateDialogOpen(true)}
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sharedSubscriptions.map((subscription) => (
                  <SubscriptionCard key={subscription.id} subscription={subscription} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        <CreateSubscriptionDialog
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
        />
      </div>
    </>
  );
}
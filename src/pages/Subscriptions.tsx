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
import EditSubscriptionDialog from "@/components/EditSubscriptionDialog";
import ManageContributorsDialog from "@/components/ManageContributorsDialog";
import { EmptyState } from "@/components/EmptyState";
import { useTranslation } from "react-i18next";
import { useIsRTL, rtlClass } from "@/lib/rtl-utils";
import { formatCurrency } from "@/lib/formatters";

export default function Subscriptions() {
  const { t, i18n } = useTranslation();
  const isRTL = useIsRTL();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [contributorsDialogOpen, setContributorsDialogOpen] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState<any>(null);
  const [selectedTab, setSelectedTab] = useState("active");

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
        .order("next_renewal_date", { ascending: true });

      if (error) {
        toast.error(t('errors.failedToLoad'));
        throw error;
      }
      return data;
    },
  });

  const activeSubscriptions = subscriptions?.filter(s => s.status === 'active') || [];
  const pausedSubscriptions = subscriptions?.filter(s => s.status === 'paused') || [];
  const canceledSubscriptions = subscriptions?.filter(s => s.status === 'canceled') || [];
  const archivedSubscriptions = subscriptions?.filter(s => s.status === 'archived') || [];

  const totalMonthly = activeSubscriptions.reduce((sum, sub) => {
    if (sub.billing_cycle === "monthly") return sum + Number(sub.amount);
    if (sub.billing_cycle === "yearly") return sum + Number(sub.amount) / 12;
    if (sub.billing_cycle === "weekly") return sum + Number(sub.amount) * 4;
    return sum;
  }, 0);

  const handleEditSubscription = (subscription: any) => {
    setSelectedSubscription(subscription);
    setEditDialogOpen(true);
  };

  const handleManageContributors = (subscription: any) => {
    setSelectedSubscription(subscription);
    setContributorsDialogOpen(true);
  };

  return (
    <>
      <SEO 
        title={`${t('subscriptions.title')} - Splitz`}
        description={t('subscriptions.subtitle')}
      />
      
      <div className={`min-h-screen p-4 md:p-6 space-y-6 pb-24 md:pb-6 ${isRTL ? 'rtl' : 'ltr'}`}>
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden group border border-border/40">
            <div className="absolute top-0 right-0 w-16 h-16 bg-primary/5 rounded-bl-full" />
            <CardHeader className="pb-3">
              <div className="inline-flex p-2 rounded-lg bg-primary/10 mb-2">
                <CreditCard className="h-4 w-4 text-primary" />
              </div>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t('subscriptions.monthlyTotal')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl md:text-3xl font-bold tracking-tight">
                {formatCurrency(totalMonthly, 'SAR', i18n.language)}
              </div>
            </CardContent>
          </Card>
          
          <Card className="shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden group border border-border/40">
            <div className="absolute top-0 right-0 w-16 h-16 bg-success/5 rounded-bl-full" />
            <CardHeader className="pb-3">
              <div className="inline-flex p-2 rounded-lg bg-success/10 mb-2">
                <Plus className="h-4 w-4 text-success" />
              </div>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Active
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl md:text-3xl font-bold text-success tracking-tight">
                {activeSubscriptions.length}
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden group border border-border/40">
            <div className="absolute top-0 right-0 w-16 h-16 bg-warning/5 rounded-bl-full" />
            <CardHeader className="pb-3">
              <div className="inline-flex p-2 rounded-lg bg-warning/10 mb-2">
                <CreditCard className="h-4 w-4 text-warning" />
              </div>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Paused
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl md:text-3xl font-bold text-warning tracking-tight">
                {pausedSubscriptions.length}
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden group border border-border/40">
            <div className="absolute top-0 right-0 w-16 h-16 bg-destructive/5 rounded-full" />
            <CardHeader className="pb-3">
              <div className="inline-flex p-2 rounded-lg bg-destructive/10 mb-2">
                <CreditCard className="h-4 w-4 text-destructive" />
              </div>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Canceled
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl md:text-3xl font-bold text-destructive tracking-tight">
                {canceledSubscriptions.length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Subscriptions List */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="grid w-full max-w-2xl grid-cols-4">
            <TabsTrigger value="active">🟢 Active ({activeSubscriptions.length})</TabsTrigger>
            <TabsTrigger value="paused">⏸️ Paused ({pausedSubscriptions.length})</TabsTrigger>
            <TabsTrigger value="canceled">🔴 Canceled ({canceledSubscriptions.length})</TabsTrigger>
            <TabsTrigger value="archived">📦 Archived ({archivedSubscriptions.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="space-y-4 mt-6">
            {isLoading ? (
              <div className="text-center py-12">{t('common.loading')}</div>
            ) : activeSubscriptions.length === 0 ? (
              <EmptyState
                icon={CreditCard}
                title="No active subscriptions"
                description="Start tracking your subscriptions"
                actionLabel={t('subscriptions.addFirstSubscription')}
                onAction={() => setCreateDialogOpen(true)}
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {activeSubscriptions.map((subscription) => (
                  <SubscriptionCard 
                    key={subscription.id} 
                    subscription={subscription}
                    onEdit={() => handleEditSubscription(subscription)}
                    onManageContributors={() => handleManageContributors(subscription)}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="paused" className="space-y-4 mt-6">
            {pausedSubscriptions.length === 0 ? (
              <EmptyState
                icon={CreditCard}
                title="No paused subscriptions"
                description="Subscriptions you've paused will appear here"
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {pausedSubscriptions.map((subscription) => (
                  <SubscriptionCard 
                    key={subscription.id} 
                    subscription={subscription}
                    onEdit={() => handleEditSubscription(subscription)}
                    onManageContributors={() => handleManageContributors(subscription)}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="canceled" className="space-y-4 mt-6">
            {canceledSubscriptions.length === 0 ? (
              <EmptyState
                icon={CreditCard}
                title="No canceled subscriptions"
                description="Canceled subscriptions will appear here"
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {canceledSubscriptions.map((subscription) => (
                  <SubscriptionCard 
                    key={subscription.id} 
                    subscription={subscription}
                    onEdit={() => handleEditSubscription(subscription)}
                    onManageContributors={() => handleManageContributors(subscription)}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="archived" className="space-y-4 mt-6">
            {archivedSubscriptions.length === 0 ? (
              <EmptyState
                icon={CreditCard}
                title="No archived subscriptions"
                description="Archive old subscriptions for record keeping"
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {archivedSubscriptions.map((subscription) => (
                  <SubscriptionCard 
                    key={subscription.id} 
                    subscription={subscription}
                    onEdit={() => handleEditSubscription(subscription)}
                    onManageContributors={() => handleManageContributors(subscription)}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        <CreateSubscriptionDialog
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
        />

        {selectedSubscription && (
          <>
            <EditSubscriptionDialog
              open={editDialogOpen}
              onOpenChange={setEditDialogOpen}
              subscription={selectedSubscription}
            />

            <ManageContributorsDialog
              open={contributorsDialogOpen}
              onOpenChange={setContributorsDialogOpen}
              subscriptionId={selectedSubscription.id}
              subscriptionName={selectedSubscription.name}
              totalAmount={selectedSubscription.amount}
            />
          </>
        )}
      </div>
    </>
  );
}

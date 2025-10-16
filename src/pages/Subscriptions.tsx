import { useState } from "react";
import { Plus, CreditCard, Pause, XCircle, Archive } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
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
      
      <div className={`min-h-screen bg-gradient-to-b from-muted/30 via-muted/10 to-background p-4 md:p-6 space-y-6 md:space-y-8 pb-24 md:pb-6 ${isRTL ? 'rtl' : 'ltr'}`}>
        {/* Header */}
        <div className={`flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 ${rtlClass(isRTL, 'flex-row-reverse', 'flex-row')}`}>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
              {t('subscriptions.title')}
            </h1>
            <p className="text-sm md:text-base text-muted-foreground mt-1.5">
              {t('subscriptions.subtitle')}
            </p>
          </div>
          <Button 
            onClick={() => setCreateDialogOpen(true)}
            className="w-full sm:w-auto shadow-sm hover:shadow-md active:scale-95 transition-all duration-200"
          >
            <Plus className={`${isRTL ? 'ml-2' : 'mr-2'} h-4 w-4`} />
            {t('subscriptions.addSubscription')}
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          <Card className="shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden group border border-border/40">
            <div className="absolute top-0 right-0 w-20 h-20 bg-primary/10 rounded-bl-full" />
            <CardHeader className="pb-3">
              <div className="inline-flex p-2.5 rounded-xl bg-primary/20 mb-3 group-hover:bg-primary/30 transition-colors">
                <CreditCard className="h-5 w-5 md:h-6 md:w-6 text-primary" />
              </div>
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {t('subscriptions.monthlyTotal')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl md:text-4xl font-bold tracking-tight">
                {formatCurrency(totalMonthly, 'SAR', i18n.language)}
              </div>
            </CardContent>
          </Card>
          
          <Card className="shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden group border border-border/40">
            <div className="absolute top-0 right-0 w-20 h-20 bg-success/10 rounded-bl-full" />
            <CardHeader className="pb-3">
              <div className="inline-flex p-2.5 rounded-xl bg-success/20 mb-3 group-hover:bg-success/30 transition-colors">
                <CreditCard className="h-5 w-5 md:h-6 md:w-6 text-success" />
              </div>
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Active
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl md:text-4xl font-bold text-success tracking-tight">
                {activeSubscriptions.length}
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden group border border-border/40">
            <div className="absolute top-0 right-0 w-20 h-20 bg-warning/10 rounded-bl-full" />
            <CardHeader className="pb-3">
              <div className="inline-flex p-2.5 rounded-xl bg-warning/20 mb-3 group-hover:bg-warning/30 transition-colors">
                <Pause className="h-5 w-5 md:h-6 md:w-6 text-warning" />
              </div>
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Paused
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl md:text-4xl font-bold text-warning tracking-tight">
                {pausedSubscriptions.length}
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden group border border-border/40">
            <div className="absolute top-0 right-0 w-20 h-20 bg-destructive/10 rounded-bl-full" />
            <CardHeader className="pb-3">
              <div className="inline-flex p-2.5 rounded-xl bg-destructive/20 mb-3 group-hover:bg-destructive/30 transition-colors">
                <XCircle className="h-5 w-5 md:h-6 md:w-6 text-destructive" />
              </div>
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Canceled
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl md:text-4xl font-bold text-destructive tracking-tight">
                {canceledSubscriptions.length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Subscriptions List */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="grid w-full max-w-4xl grid-cols-4 bg-muted/50 p-1 rounded-lg border border-border/40">
            <TabsTrigger 
              value="active"
              className="data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all duration-200"
            >
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-success" />
                <span className="hidden sm:inline font-medium">Active</span>
                <Badge variant="secondary" className="ml-1">{activeSubscriptions.length}</Badge>
              </div>
            </TabsTrigger>
            <TabsTrigger 
              value="paused"
              className="data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all duration-200"
            >
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-warning" />
                <span className="hidden sm:inline font-medium">Paused</span>
                <Badge variant="secondary" className="ml-1">{pausedSubscriptions.length}</Badge>
              </div>
            </TabsTrigger>
            <TabsTrigger 
              value="canceled"
              className="data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all duration-200"
            >
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-destructive" />
                <span className="hidden sm:inline font-medium">Canceled</span>
                <Badge variant="secondary" className="ml-1">{canceledSubscriptions.length}</Badge>
              </div>
            </TabsTrigger>
            <TabsTrigger 
              value="archived"
              className="data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all duration-200"
            >
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-muted-foreground" />
                <span className="hidden sm:inline font-medium">Archived</span>
                <Badge variant="secondary" className="ml-1">{archivedSubscriptions.length}</Badge>
              </div>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="space-y-4 mt-6">
            {isLoading ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[1, 2, 3].map(i => (
                    <Card key={i} className="animate-pulse">
                      <CardContent className="p-6 space-y-3">
                        <div className="h-4 bg-muted rounded w-2/3"></div>
                        <div className="h-3 bg-muted rounded w-full"></div>
                        <div className="h-3 bg-muted rounded w-5/6"></div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ) : activeSubscriptions.length === 0 ? (
              <div className="text-center py-16">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-muted/50 mb-6">
                  <CreditCard className="w-10 h-10 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-semibold mb-2">No active subscriptions</h3>
                <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto leading-relaxed">
                  Start tracking your recurring payments and never miss a renewal date again
                </p>
                <Button 
                  onClick={() => setCreateDialogOpen(true)}
                  className="shadow-sm hover:shadow-md"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  {t('subscriptions.addFirstSubscription')}
                </Button>
              </div>
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

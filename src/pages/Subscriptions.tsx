import { useState } from "react";
import { Plus, CreditCard, Pause, XCircle, Archive, Users, Filter, ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SEO } from "@/components/SEO";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { withAuthRecovery } from "@/lib/auth-recovery";
import { SubscriptionCard } from "@/components/SubscriptionCard";
import { CreateSubscriptionDialog } from "@/components/CreateSubscriptionDialog";
import EditSubscriptionDialog from "@/components/EditSubscriptionDialog";
import ManageContributorsDialog from "@/components/ManageContributorsDialog";
import { SubscriptionDetailsDialog } from "@/components/SubscriptionDetailsDialog";
import { SubscriptionAnalyticsDashboard } from "@/components/SubscriptionAnalyticsDashboard";
import { TrialTracker } from "@/components/TrialTracker";
import { RenewalCalendar } from "@/components/RenewalCalendar";
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
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState<any>(null);
  const [selectedTab, setSelectedTab] = useState("overview");
  const [filterCategory, setFilterCategory] = useState("all");
  const [sortBy, setSortBy] = useState("renewal_date");
  const [searchQuery, setSearchQuery] = useState("");

  // Owned subscriptions query
  const { data: subscriptions, isLoading } = useQuery({
    queryKey: ["subscriptions"],
    queryFn: () => withAuthRecovery(async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

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
        .eq('user_id', user.id)
        .order("next_renewal_date", { ascending: true });

      if (error) {
        toast.error(t('errors.failedToLoad'));
        throw error;
      }
      return data;
    }, "Failed to load subscriptions"),
  });

  // Shared subscriptions where user is a contributor
  const { data: sharedSubscriptions, isLoading: isLoadingShared } = useQuery({
    queryKey: ['shared-subscriptions'],
    queryFn: () => withAuthRecovery(async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from('subscription_contributors')
        .select(`
          *,
          subscriptions!inner (
            *,
            subscription_contributors (
              id,
              user_id,
              contribution_amount,
              is_settled,
              paid_at
            )
          )
        `)
        .eq('user_id', user.id);

      if (error) throw error;
      return data?.map(d => d.subscriptions).filter((s: any) => s.user_id !== user.id) || [];
    }, "Failed to load shared subscriptions"),
  });

  const myActiveSubscriptions = subscriptions?.filter(s => s.status === 'active') || [];
  const pausedSubscriptions = subscriptions?.filter(s => s.status === 'paused') || [];
  const canceledSubscriptions = subscriptions?.filter(s => s.status === 'canceled') || [];
  const archivedSubscriptions = subscriptions?.filter(s => s.status === 'archived') || [];
  const sharedWithMe = sharedSubscriptions || [];

  const totalMonthly = myActiveSubscriptions.reduce((sum, sub) => {
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

  const handleViewDetails = (subscription: any) => {
    setSelectedSubscription(subscription);
    setDetailsDialogOpen(true);
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


        {/* Subscriptions List */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="grid w-full grid-cols-4 md:grid-cols-4 bg-muted/50 p-1 rounded-lg border border-border/40">
            <TabsTrigger value="overview">{t('common.overview')}</TabsTrigger>
            <TabsTrigger value="trials">
              {t('subscriptions.trials')}
              {(subscriptions?.filter(s => s.trial_ends_at && new Date(s.trial_ends_at) > new Date()) || []).length > 0 && (
                <Badge variant="destructive" className={rtlClass(isRTL, 'mr-2', 'ml-2')}>
                  {(subscriptions?.filter(s => s.trial_ends_at && new Date(s.trial_ends_at) > new Date()) || []).length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="calendar">{t('common.calendar')}</TabsTrigger>
            <TabsTrigger value="all">{t('common.all')}</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6 mt-6">
            <SubscriptionAnalyticsDashboard 
              subscriptions={[...(subscriptions || []), ...(sharedSubscriptions || [])]}
              currency="SAR"
            />

            {/* My Active Subscriptions */}
            <div>
              <h2 className="text-xl font-semibold mb-4">{t('subscriptions.mySubscriptions')}</h2>
              {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-64 bg-muted animate-pulse rounded-lg" />
                  ))}
                </div>
              ) : myActiveSubscriptions.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {myActiveSubscriptions.slice(0, 6).map((subscription) => (
                    <SubscriptionCard
                      key={subscription.id}
                      subscription={subscription}
                      onEdit={() => handleEditSubscription(subscription)}
                      onManageContributors={() => handleManageContributors(subscription)}
                      onViewDetails={() => handleViewDetails(subscription)}
                    />
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={CreditCard}
                  title={t('subscriptions.noActive')}
                  description={t('subscriptions.startTracking')}
                  actionLabel={t('subscriptions.addSubscription')}
                  onAction={() => setCreateDialogOpen(true)}
                />
              )}
            </div>

            {/* Shared with Me Section */}
            {sharedWithMe.length > 0 && (
              <div className="border-t pt-6">
                <h2 className={`text-xl font-semibold mb-4 flex items-center gap-2 ${rtlClass(isRTL, 'flex-row-reverse', 'flex-row')}`}>
                  <Users className="h-5 w-5 text-info" />
                  {t('subscriptions.sharedWithMe')}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {sharedWithMe.slice(0, 6).map((subscription) => (
                    <SubscriptionCard
                      key={subscription.id}
                      subscription={subscription}
                      onEdit={() => handleEditSubscription(subscription)}
                      onViewDetails={() => handleViewDetails(subscription)}
                    />
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          {/* Trials Tab */}
          <TabsContent value="trials" className="mt-6">
            <TrialTracker 
              subscriptions={[...(subscriptions || []), ...(sharedSubscriptions || [])]}
              onEdit={handleEditSubscription}
            />
          </TabsContent>

          {/* Calendar Tab */}
          <TabsContent value="calendar" className="mt-6">
            <RenewalCalendar 
              subscriptions={[...(subscriptions || []), ...(sharedSubscriptions || [])]}
              onSelectSubscription={handleViewDetails}
            />
          </TabsContent>

          {/* All Tab with Filters */}
          <TabsContent value="all" className="space-y-4 mt-6">
            {/* Filters and Sorting */}
            <div className={`flex flex-col md:flex-row gap-4 ${rtlClass(isRTL, 'md:flex-row-reverse', 'md:flex-row')}`}>
              <div className="flex-1">
                <Input
                  placeholder={t('subscriptions.search')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <Filter className={`w-4 h-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                  <SelectValue placeholder={t('subscriptions.categoryFilter')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('subscriptions.allCategories')}</SelectItem>
                  <SelectItem value="streaming">{t('subscriptions.streaming')}</SelectItem>
                  <SelectItem value="software">{t('subscriptions.software')}</SelectItem>
                  <SelectItem value="gaming">{t('subscriptions.gaming')}</SelectItem>
                  <SelectItem value="cloud">{t('subscriptions.cloud')}</SelectItem>
                  <SelectItem value="fitness">{t('subscriptions.fitness')}</SelectItem>
                  <SelectItem value="other">{t('subscriptions.other')}</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <ArrowUpDown className={`w-4 h-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                  <SelectValue placeholder={t('subscriptions.sortBy')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="renewal_date">{t('subscriptions.nextRenewalDate')}</SelectItem>
                  <SelectItem value="name">{t('subscriptions.name')}</SelectItem>
                  <SelectItem value="amount">{t('subscriptions.amount')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Sub-tabs for different statuses */}
            <Tabs defaultValue="my-active">
              <TabsList className="grid w-full grid-cols-5 bg-muted/50 p-1 rounded-lg border border-border/40">
                <TabsTrigger 
                  value="my-active"
                  className="data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all duration-200"
                >
                  <div className={`flex items-center gap-2 ${rtlClass(isRTL, 'flex-row-reverse', 'flex-row')}`}>
                    <div className="w-2 h-2 rounded-full bg-success" />
                    <span className="hidden sm:inline font-medium">{t('subscriptions.myActive')}</span>
                    <Badge variant="secondary" className={isRTL ? 'mr-1' : 'ml-1'}>{myActiveSubscriptions.length}</Badge>
                  </div>
                </TabsTrigger>
                <TabsTrigger 
                  value="shared"
                  className="data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all duration-200"
                >
                  <div className={`flex items-center gap-2 ${rtlClass(isRTL, 'flex-row-reverse', 'flex-row')}`}>
                    <div className="w-2 h-2 rounded-full bg-info" />
                    <span className="hidden sm:inline font-medium">{t('subscriptions.sharedWithMe')}</span>
                    <Badge variant="secondary" className={isRTL ? 'mr-1' : 'ml-1'}>{sharedWithMe.length}</Badge>
                  </div>
                </TabsTrigger>
                 <TabsTrigger 
                   value="paused"
                   className="data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all duration-200"
                 >
                   <div className={`flex items-center gap-2 ${rtlClass(isRTL, 'flex-row-reverse', 'flex-row')}`}>
                     <div className="w-2 h-2 rounded-full bg-warning" />
                     <span className="hidden sm:inline font-medium">{t('subscriptions.paused')}</span>
                     <Badge variant="secondary" className={isRTL ? 'mr-1' : 'ml-1'}>{pausedSubscriptions.length}</Badge>
                   </div>
                 </TabsTrigger>
                 <TabsTrigger 
                   value="canceled"
                   className="data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all duration-200"
                 >
                   <div className={`flex items-center gap-2 ${rtlClass(isRTL, 'flex-row-reverse', 'flex-row')}`}>
                     <div className="w-2 h-2 rounded-full bg-destructive" />
                     <span className="hidden sm:inline font-medium">{t('subscriptions.canceled')}</span>
                     <Badge variant="secondary" className={isRTL ? 'mr-1' : 'ml-1'}>{canceledSubscriptions.length}</Badge>
                   </div>
                 </TabsTrigger>
                 <TabsTrigger 
                   value="archived"
                   className="data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all duration-200"
                 >
                   <div className={`flex items-center gap-2 ${rtlClass(isRTL, 'flex-row-reverse', 'flex-row')}`}>
                     <div className="w-2 h-2 rounded-full bg-muted-foreground" />
                     <span className="hidden sm:inline font-medium">{t('subscriptions.archived')}</span>
                     <Badge variant="secondary" className={isRTL ? 'mr-1' : 'ml-1'}>{archivedSubscriptions.length}</Badge>
                   </div>
                 </TabsTrigger>
               </TabsList>

          <TabsContent value="my-active" className="space-y-4 mt-6">
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
            ) : myActiveSubscriptions.length === 0 ? (
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
                {myActiveSubscriptions.map((subscription) => (
                  <SubscriptionCard
                    key={subscription.id}
                    subscription={subscription}
                    onEdit={() => handleEditSubscription(subscription)}
                    onManageContributors={() => handleManageContributors(subscription)}
                    onViewDetails={() => handleViewDetails(subscription)}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="shared" className="space-y-4 mt-6">
            {isLoadingShared ? (
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
            ) : sharedWithMe.length === 0 ? (
              <div className="text-center py-16">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-muted/50 mb-6">
                  <Users className="w-10 h-10 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-semibold mb-2">No shared subscriptions</h3>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">
                  You haven't been added to any shared subscriptions yet
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sharedWithMe.map((subscription: any) => (
                  <SubscriptionCard 
                    key={subscription.id} 
                    subscription={subscription}
                    onViewDetails={() => handleViewDetails(subscription)}
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
                    onViewDetails={() => handleViewDetails(subscription)}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="canceled" className="space-y-4 mt-6">
            {canceledSubscriptions.length === 0 ? (
              <EmptyState
                icon={XCircle}
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
                    onViewDetails={() => handleViewDetails(subscription)}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="archived" className="space-y-4 mt-6">
            {archivedSubscriptions.length === 0 ? (
              <EmptyState
                icon={Archive}
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
                    onViewDetails={() => handleViewDetails(subscription)}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
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

            <SubscriptionDetailsDialog
              open={detailsDialogOpen}
              onOpenChange={setDetailsDialogOpen}
              subscriptionId={selectedSubscription.id}
              subscriptionName={selectedSubscription.name}
            />
          </>
        )}
      </div>
    </>
  );
}

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

export default function Subscriptions() {
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
        toast.error("Failed to load subscriptions");
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
        title="Subscriptions - Splitz"
        description="Track and manage your personal and shared subscriptions with renewal reminders"
      />
      
      <div className="min-h-screen p-4 md:p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Subscriptions
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage your recurring payments
            </p>
          </div>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Subscription
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Monthly Total
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                SAR {totalMonthly.toFixed(2)}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Active Subscriptions
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
                Shared Subscriptions
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
            <TabsTrigger value="personal">Personal</TabsTrigger>
            <TabsTrigger value="shared">Shared</TabsTrigger>
          </TabsList>

          <TabsContent value="personal" className="space-y-4 mt-6">
            {isLoading ? (
              <div className="text-center py-12">Loading...</div>
            ) : personalSubscriptions.length === 0 ? (
              <EmptyState
                icon={CreditCard}
                title="No personal subscriptions yet"
                description="Start tracking your recurring payments"
                actionLabel="Add Your First Subscription"
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
              <div className="text-center py-12">Loading...</div>
            ) : sharedSubscriptions.length === 0 ? (
              <EmptyState
                icon={CreditCard}
                title="No shared subscriptions yet"
                description="Split subscription costs with friends"
                actionLabel="Create Shared Subscription"
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
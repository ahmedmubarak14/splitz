import { useState } from "react";
import { Plus, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SEO } from "@/components/SEO";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { TripCard } from "@/components/TripCard";
import { CreateTripDialog } from "@/components/CreateTripDialog";
import { EmptyState } from "@/components/EmptyState";
import { useTranslation } from "react-i18next";
import { useIsRTL, rtlClass } from "@/lib/rtl-utils";

export default function Trips() {
  const { t } = useTranslation();
  const isRTL = useIsRTL();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const { data: trips, isLoading } = useQuery({
    queryKey: ["trips"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("trips")
        .select(`
          *,
          trip_members(count),
          trip_tasks(id, status)
        `)
        .order("start_date", { ascending: true });

      if (error) {
        toast.error(t('errors.failedToLoad'));
        throw error;
      }
      return data;
    },
  });

  return (
    <>
      <SEO 
        title={`${t('trips.title')} - Splitz`}
        description={t('trips.subtitle')}
      />
      
      <div className={`min-h-screen p-4 md:p-6 space-y-6 ${isRTL ? 'rtl' : 'ltr'}`}>
        {/* Header */}
        <div className={`flex justify-between items-center ${rtlClass(isRTL, 'flex-row-reverse', 'flex-row')}`}>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              {t('trips.title')}
            </h1>
            <p className="text-muted-foreground mt-1">
              {t('trips.subtitle')}
            </p>
          </div>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className={`${isRTL ? 'ml-2' : 'mr-2'} h-4 w-4`} />
            {t('trips.planTrip')}
          </Button>
        </div>

        {/* Trips List */}
        {isLoading ? (
          <div className="text-center py-12">{t('common.loading')}</div>
        ) : !trips || trips.length === 0 ? (
          <EmptyState
            icon={MapPin}
            title={t('trips.noTrips')}
            description={t('trips.startPlanning')}
            actionLabel={t('trips.planFirstTrip')}
            onAction={() => setCreateDialogOpen(true)}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {trips.map((trip) => (
              <TripCard key={trip.id} trip={trip} />
            ))}
          </div>
        )}

        <CreateTripDialog
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
        />
      </div>
    </>
  );
}
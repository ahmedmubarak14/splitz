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
import { useIsMobile } from "@/hooks/use-mobile";
import { MobileQuickActionsFAB } from "@/components/MobileQuickActionsFAB";

export default function Trips() {
  const { t } = useTranslation();
  const isRTL = useIsRTL();
  const isMobile = useIsMobile();
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
      
      <div className={`min-h-screen bg-gradient-to-b from-muted/30 via-muted/10 to-background p-4 md:p-6 space-y-6 md:space-y-8 ${isRTL ? 'rtl' : 'ltr'}`}>
        {/* Header */}
        <div className={`flex justify-between items-center ${rtlClass(isRTL, 'flex-row-reverse', 'flex-row')}`}>
          <div>
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight">
              {t('trips.title')}
            </h1>
            <p className="text-sm md:text-base text-muted-foreground mt-1">
              {t('trips.subtitle')}
            </p>
          </div>
          <Button onClick={() => setCreateDialogOpen(true)} className="shadow-sm hover:shadow-md active:scale-95 transition-all duration-200">
            <Plus className={`${isRTL ? 'ml-2' : 'mr-2'} h-4 w-4`} />
            {t('trips.planTrip')}
          </Button>
        </div>

        {/* Trips List */}
        {isLoading ? (
          <div className="min-h-[400px] flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
              <div className="animate-spin rounded-full h-12 w-12 border-3 border-primary border-t-transparent shadow-lg"></div>
              <p className="text-sm text-muted-foreground animate-pulse">{t('common.loading')}</p>
            </div>
          </div>
        ) : !trips || trips.length === 0 ? (
          <EmptyState
            icon={MapPin}
            title={t('trips.noTrips')}
            description={t('trips.startPlanning')}
            actionLabel={t('trips.planFirstTrip')}
            onAction={() => setCreateDialogOpen(true)}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {trips.map((trip) => (
              <TripCard key={trip.id} trip={trip} />
            ))}
          </div>
        )}

        <CreateTripDialog
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
        />

        {/* Mobile FAB */}
        <MobileQuickActionsFAB 
          onAddTrip={() => setCreateDialogOpen(true)}
        />
      </div>
    </>
  );
}
import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SEO } from "@/components/SEO";
import { ArrowLeft, Plus, Calendar, MapPin, Users } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { useIsRTL, rtlClass } from "@/lib/rtl-utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { TripTaskList } from "@/components/TripTaskList";
import { TripMembersList } from "@/components/TripMembersList";
import { CreateTripTaskDialog } from "@/components/CreateTripTaskDialog";
import { InviteTripMemberDialog } from "@/components/InviteTripMemberDialog";
import { EditTripDialog } from "@/components/EditTripDialog";
import { format } from "date-fns";

export default function TripDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const isRTL = useIsRTL();
  const isMobile = useIsMobile();
  const [createTaskOpen, setCreateTaskOpen] = useState(false);
  const [inviteMemberOpen, setInviteMemberOpen] = useState(false);
  const [editTripOpen, setEditTripOpen] = useState(false);

  const { data: trip, isLoading } = useQuery({
    queryKey: ["trip", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("trips")
        .select(`
          *,
          trip_members(count),
          trip_tasks(id, status)
        `)
        .eq("id", id)
        .single();

      if (error) {
        toast.error(t('errors.failedToLoad'));
        throw error;
      }
      return data;
    },
  });

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">{t('common.loading')}</div>;
  }

  if (!trip) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-muted-foreground">{t('trips.notFound')}</p>
        <Button onClick={() => navigate('/trips')}>{t('common.goBack')}</Button>
      </div>
    );
  }

  const todoTasks = trip.trip_tasks?.filter((t: any) => t.status === 'todo').length || 0;
  const totalTasks = trip.trip_tasks?.length || 0;

  return (
    <>
      <SEO 
        title={`${trip.name} - Splitz`}
        description={trip.description || t('trips.subtitle')}
      />
      
      <div className={`min-h-screen p-4 md:p-6 space-y-6 ${isRTL ? 'rtl' : 'ltr'}`}>
        {/* Header */}
        <div className="space-y-4">
          <Button
            variant="ghost"
            onClick={() => navigate('/trips')}
            className={rtlClass(isRTL, 'flex-row-reverse', 'flex-row')}
          >
            <ArrowLeft className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
            {t('common.back')}
          </Button>

          {/* Trip Header */}
          <div className="rounded-lg border bg-card p-6 space-y-4">
            <div className={`flex justify-between items-start ${rtlClass(isRTL, 'flex-row-reverse', 'flex-row')}`}>
              <div className="space-y-2">
                <h1 className="text-3xl font-bold">{trip.name}</h1>
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  <div className={`flex items-center gap-2 ${rtlClass(isRTL, 'flex-row-reverse', 'flex-row')}`}>
                    <MapPin className="h-4 w-4" />
                    <span>{trip.destination || t('trips.noDestination')}</span>
                  </div>
                  <div className={`flex items-center gap-2 ${rtlClass(isRTL, 'flex-row-reverse', 'flex-row')}`}>
                    <Calendar className="h-4 w-4" />
                    <span>
                      {format(new Date(trip.start_date), 'MMM d')} - {format(new Date(trip.end_date), 'MMM d, yyyy')}
                    </span>
                  </div>
                  <div className={`flex items-center gap-2 ${rtlClass(isRTL, 'flex-row-reverse', 'flex-row')}`}>
                    <Users className="h-4 w-4" />
                    <span>{trip.trip_members?.[0]?.count || 0} {t('trips.members')}</span>
                  </div>
                </div>
                {trip.description && (
                  <p className="text-muted-foreground mt-2">{trip.description}</p>
                )}
              </div>
              <Button onClick={() => setEditTripOpen(true)} variant="outline">
                {t('common.edit')}
              </Button>
            </div>

            <div className="flex gap-2 pt-2">
              <div className="text-sm">
                <span className="font-medium">{totalTasks - todoTasks}</span>
                <span className="text-muted-foreground">/{totalTasks} {t('trips.tasksComplete')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Content Tabs */}
        <Tabs defaultValue="tasks" className="w-full">
          <TabsList className="w-full justify-start">
            <TabsTrigger value="tasks">{t('trips.tasks')}</TabsTrigger>
            <TabsTrigger value="members">{t('trips.members')}</TabsTrigger>
          </TabsList>

          <TabsContent value="tasks" className="space-y-4">
            <div className={`flex justify-between items-center ${rtlClass(isRTL, 'flex-row-reverse', 'flex-row')}`}>
              <h2 className="text-xl font-semibold">{t('trips.tasks')}</h2>
              <Button onClick={() => setCreateTaskOpen(true)}>
                <Plus className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                {t('trips.addTask')}
              </Button>
            </div>
            <TripTaskList tripId={id!} />
          </TabsContent>

          <TabsContent value="members" className="space-y-4">
            <div className={`flex justify-between items-center ${rtlClass(isRTL, 'flex-row-reverse', 'flex-row')}`}>
              <h2 className="text-xl font-semibold">{t('trips.members')}</h2>
              <Button onClick={() => setInviteMemberOpen(true)}>
                <Plus className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                {t('trips.inviteMember')}
              </Button>
            </div>
            <TripMembersList tripId={id!} />
          </TabsContent>
        </Tabs>

        {/* Mobile FAB */}
        {isMobile && (
          <Button
            className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg"
            size="icon"
            onClick={() => setCreateTaskOpen(true)}
          >
            <Plus className="h-6 w-6" />
          </Button>
        )}

        <CreateTripTaskDialog
          tripId={id!}
          open={createTaskOpen}
          onOpenChange={setCreateTaskOpen}
        />

        <InviteTripMemberDialog
          tripId={id!}
          open={inviteMemberOpen}
          onOpenChange={setInviteMemberOpen}
        />

        <EditTripDialog
          trip={trip}
          open={editTripOpen}
          onOpenChange={setEditTripOpen}
        />
      </div>
    </>
  );
}

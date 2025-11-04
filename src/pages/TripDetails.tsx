import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SEO } from "@/components/SEO";
import { ArrowLeft, Plus, Calendar, MapPin, Users } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { useIsRTL, rtlClass } from "@/lib/rtl-utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { MobileQuickActionsFAB } from "@/components/MobileQuickActionsFAB";
import { TripTaskList } from "@/components/TripTaskList";
import { TripMembersList } from "@/components/TripMembersList";
import { CreateTripTaskDialog } from "@/components/CreateTripTaskDialog";
import { InviteTripMemberDialog } from "@/components/InviteTripMemberDialog";
import { EditTripDialog } from "@/components/EditTripDialog";
import { TripExpensesList } from "@/components/TripExpensesList";
import { CreateTripExpenseDialog } from "@/components/CreateTripExpenseDialog";
import { TripExpenseSummary } from "@/components/TripExpenseSummary";
import { TripActivityFeed } from "@/components/TripActivityFeed";
import { TripBudgetTracker } from "@/components/TripBudgetTracker";
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
  const [createExpenseOpen, setCreateExpenseOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('tasks');

  const { data: trip, isLoading } = useQuery({
    queryKey: ["trip", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("trips")
        .select(`
          *,
          trip_members(count, user_id, role),
          trip_tasks(id, status)
        `)
        .eq("id", id)
        .single();

      if (error) {
        toast.error(t('errors.failedToLoad'));
        throw error;
      }

      // Fetch avatars for members
      const memberUserIds = data.trip_members?.slice(0, 5).map((m: any) => m.user_id) || [];
      
      let memberAvatars: any[] = [];
      if (memberUserIds.length > 0) {
        const { data: profiles } = await supabase.rpc(
          'get_public_profiles',
          { _user_ids: memberUserIds }
        );
        
        memberAvatars = profiles?.map((p: any) => ({
          id: p.id,
          full_name: p.full_name,
          avatar_url: p.avatar_url
        })) || [];
      }

      return { ...data, member_avatars: memberAvatars };
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
  const inProgressTasks = trip.trip_tasks?.filter((t: any) => t.status === 'in_progress').length || 0;
  const completedTasks = trip.trip_tasks?.filter((t: any) => t.status === 'done').length || 0;
  const totalTasks = trip.trip_tasks?.length || 0;
  const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  const isActive = trip.status === 'active';
  const isCompleted = trip.status === 'completed';
  const isPending = trip.status === 'planning';

  const getStatusColor = () => {
    if (isCompleted) return "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20";
    if (isActive) return "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20";
    return "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20";
  };

  const memberCount = trip.trip_members?.[0]?.count || 0;
  const displayAvatars = (trip as any).member_avatars?.slice(0, 5) || [];
  const remainingMembers = Math.max(0, memberCount - displayAvatars.length);

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
          <div className="rounded-lg border bg-card p-6 space-y-6">
            <div className={`flex justify-between items-start ${rtlClass(isRTL, 'flex-row-reverse', 'flex-row')}`}>
              <div className="space-y-3 flex-1">
                <div className={`flex items-center gap-3 ${rtlClass(isRTL, 'flex-row-reverse', 'flex-row')}`}>
                  <h1 className="text-3xl font-bold">{trip.name}</h1>
                  <Badge variant="outline" className={getStatusColor()}>
                    {isCompleted ? t('trips.completed') : isActive ? t('trips.active') : t('trips.planning')}
                  </Badge>
                </div>

                <div className="flex flex-wrap gap-4 text-sm">
                  <div className={`flex items-center gap-2 text-muted-foreground ${rtlClass(isRTL, 'flex-row-reverse', 'flex-row')}`}>
                    <MapPin className="h-4 w-4" />
                    <span>{trip.destination || t('trips.noDestination')}</span>
                  </div>
                  <div className={`flex items-center gap-2 text-muted-foreground ${rtlClass(isRTL, 'flex-row-reverse', 'flex-row')}`}>
                    <Calendar className="h-4 w-4" />
                    <span>
                      {format(new Date(trip.start_date), 'MMM d')} - {format(new Date(trip.end_date), 'MMM d, yyyy')}
                    </span>
                  </div>
                  
                  {/* Member Avatars */}
                  <div className={`flex items-center gap-2 ${rtlClass(isRTL, 'flex-row-reverse', 'flex-row')}`}>
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <div className={`flex ${isRTL ? 'flex-row-reverse' : 'flex-row'} ${isRTL ? 'space-x-reverse' : ''} -space-x-2`}>
                      {displayAvatars.map((member: any) => (
                        <Avatar key={member.id} className="h-6 w-6 border-2 border-background">
                          <AvatarImage src={member.avatar_url} />
                          <AvatarFallback className="text-xs">
                            {member.full_name?.[0] || 'U'}
                          </AvatarFallback>
                        </Avatar>
                      ))}
                      {remainingMembers > 0 && (
                        <div className="h-6 w-6 rounded-full bg-muted border-2 border-background flex items-center justify-center">
                          <span className="text-[10px] font-medium">+{remainingMembers}</span>
                        </div>
                      )}
                    </div>
                    <span className="text-muted-foreground">{memberCount}</span>
                  </div>
                </div>

                {trip.description && (
                  <p className="text-muted-foreground">{trip.description}</p>
                )}
              </div>
              
              <Button onClick={() => setEditTripOpen(true)} variant="outline">
                {t('common.edit')}
              </Button>
            </div>

            {/* Progress Section */}
            {totalTasks > 0 && (
              <div className="space-y-3 pt-4 border-t">
                <div className={`flex items-center justify-between ${rtlClass(isRTL, 'flex-row-reverse', 'flex-row')}`}>
                  <h3 className="font-semibold">{t('trips.taskProgress')}</h3>
                  <span className="text-sm font-medium">
                    {completedTasks}/{totalTasks} {t('common.completed')} ({Math.round(progress)}%)
                  </span>
                </div>
                <Progress value={progress} className="h-3" />
                <div className={`flex gap-4 text-sm ${rtlClass(isRTL, 'flex-row-reverse', 'flex-row')}`}>
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-muted-foreground/30"></div>
                    <span className="text-muted-foreground">{todoTasks} {t('trips.status.todo')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-blue-500"></div>
                    <span className="text-muted-foreground">{inProgressTasks} {t('trips.status.in_progress')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-green-500"></div>
                    <span className="text-muted-foreground">{completedTasks} {t('trips.status.done')}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} defaultValue="tasks" className="w-full">
          <TabsList className="w-full justify-start">
            <TabsTrigger value="tasks">{t('trips.tasks')}</TabsTrigger>
            <TabsTrigger value="expenses">{t('trips.expenses.title')}</TabsTrigger>
            <TabsTrigger value="budget">{t('trips.budget.title')}</TabsTrigger>
            <TabsTrigger value="members">{t('trips.members')}</TabsTrigger>
            <TabsTrigger value="activity">{t('trips.activity.title')}</TabsTrigger>
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

          <TabsContent value="expenses" className="space-y-4">
            <TripExpenseSummary tripId={id!} />
            <div className={`flex justify-between items-center ${rtlClass(isRTL, 'flex-row-reverse', 'flex-row')}`}>
              <h2 className="text-xl font-semibold">{t('trips.expenses.title')}</h2>
              <Button onClick={() => setCreateExpenseOpen(true)}>
                <Plus className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                {t('trips.expenses.addExpense')}
              </Button>
            </div>
            <TripExpensesList tripId={id!} />
          </TabsContent>

          <TabsContent value="budget" className="space-y-4">
            <TripBudgetTracker tripId={id!} />
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

          <TabsContent value="activity" className="space-y-4">
            <h2 className="text-xl font-semibold">{t('trips.activity.title')}</h2>
            <TripActivityFeed tripId={id!} />
          </TabsContent>
        </Tabs>

        {/* Mobile FAB */}
        {isMobile && activeTab === 'tasks' && (
          <MobileQuickActionsFAB 
            onAddTask={() => setCreateTaskOpen(true)}
          />
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

        <CreateTripExpenseDialog
          tripId={id!}
          open={createExpenseOpen}
          onOpenChange={setCreateExpenseOpen}
        />
      </div>
    </>
  );
}

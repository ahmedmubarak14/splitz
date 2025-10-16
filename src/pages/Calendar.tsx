import { useState, useCallback } from "react";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SEO } from "@/components/SEO";
import { Calendar } from "@/components/ui/calendar";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek, addWeeks, subWeeks, addDays, subDays } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { useIsRTL, rtlClass } from "@/lib/rtl-utils";
import { formatDate } from "@/lib/formatters";

type CalendarEvent = {
  id: string;
  title: string;
  date: Date;
  type: "task" | "habit" | "subscription" | "focus" | "trip" | "challenge";
  color: string;
};

export default function CalendarPage() {
  const { t, i18n } = useTranslation();
  const isRTL = useIsRTL();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [view, setView] = useState<"month" | "week" | "day">("month");

  // Fetch all events
  const { data: events = [], isLoading } = useQuery({
    queryKey: ["calendar-events", format(currentDate, "yyyy-MM")],
    queryFn: async () => {
      const start = startOfMonth(currentDate);
      const end = endOfMonth(currentDate);
      
      const allEvents: CalendarEvent[] = [];

      // Fetch tasks
      const { data: tasks } = await supabase
        .from("focus_tasks")
        .select("id, title, due_date")
        .gte("due_date", format(start, "yyyy-MM-dd"))
        .lte("due_date", format(end, "yyyy-MM-dd"));

      tasks?.forEach(task => {
        if (task.due_date) {
          allEvents.push({
            id: task.id,
            title: task.title,
            date: new Date(task.due_date),
            type: "task",
            color: "bg-blue-500"
          });
        }
      });

      // Fetch habits (check-ins)
      const { data: habits } = await supabase
        .from("habit_check_ins")
        .select("id, habit_id, checked_in_at, habits(name)")
        .gte("checked_in_at", start.toISOString())
        .lte("checked_in_at", end.toISOString());

      habits?.forEach(checkin => {
        allEvents.push({
          id: checkin.id,
          title: (checkin.habits as any)?.name || "Habit",
          date: new Date(checkin.checked_in_at),
          type: "habit",
          color: "bg-green-500"
        });
      });

      // Fetch subscriptions
      const { data: subscriptions } = await supabase
        .from("subscriptions")
        .select("id, name, next_renewal_date")
        .gte("next_renewal_date", format(start, "yyyy-MM-dd"))
        .lte("next_renewal_date", format(end, "yyyy-MM-dd"))
        .eq("is_active", true);

      subscriptions?.forEach(sub => {
        allEvents.push({
          id: sub.id,
          title: sub.name,
          date: new Date(sub.next_renewal_date),
          type: "subscription",
          color: "bg-red-500"
        });
      });

      // Fetch focus sessions
      const { data: sessions } = await supabase
        .from("focus_sessions")
        .select("id, start_time")
        .gte("start_time", start.toISOString())
        .lte("start_time", end.toISOString());

      sessions?.forEach(session => {
        allEvents.push({
          id: session.id,
          title: "Focus Session",
          date: new Date(session.start_time),
          type: "focus",
          color: "bg-purple-500"
        });
      });

      // Fetch trips
      const { data: trips } = await supabase
        .from("trips")
        .select("id, name, start_date, end_date")
        .or(`start_date.gte.${format(start, "yyyy-MM-dd")},end_date.lte.${format(end, "yyyy-MM-dd")}`);

      trips?.forEach(trip => {
        allEvents.push({
          id: trip.id,
          title: trip.name,
          date: new Date(trip.start_date),
          type: "trip",
          color: "bg-orange-500"
        });
      });

      // Fetch challenges
      const { data: challenges } = await supabase
        .from("challenges")
        .select("id, name, start_date, end_date")
        .or(`start_date.gte.${format(start, "yyyy-MM-dd")},end_date.lte.${format(end, "yyyy-MM-dd")}`);

      challenges?.forEach(challenge => {
        allEvents.push({
          id: challenge.id,
          title: challenge.name,
          date: new Date(challenge.start_date),
          type: "challenge",
          color: "bg-yellow-500"
        });
      });

      return allEvents;
    },
  });

  const eventsForDate = useCallback((date: Date) => {
    return events.filter(event => isSameDay(event.date, date));
  }, [events]);

  const getEventTypesForDate = useCallback((date: Date) => {
    const dayEvents = eventsForDate(date);
    const uniqueTypes = new Set(dayEvents.map(e => e.type));
    return Array.from(uniqueTypes).slice(0, 4); // Max 4 dots
  }, [eventsForDate]);

  const eventTypeColors: Record<string, string> = {
    task: 'bg-blue-500',
    habit: 'bg-green-500',
    subscription: 'bg-red-500',
    focus: 'bg-purple-500',
    trip: 'bg-orange-500',
    challenge: 'bg-yellow-500',
  };

  const nextPeriod = () => {
    if (view === 'month') setCurrentDate(addMonths(currentDate, 1));
    else if (view === 'week') setCurrentDate(addWeeks(currentDate, 1));
    else setCurrentDate(addDays(currentDate, 1));
  };

  const prevPeriod = () => {
    if (view === 'month') setCurrentDate(subMonths(currentDate, 1));
    else if (view === 'week') setCurrentDate(subWeeks(currentDate, 1));
    else setCurrentDate(subDays(currentDate, 1));
  };

  const getHeaderDate = () => {
    if (view === 'month') {
      return formatDate(currentDate, i18n.language, { year: 'numeric', month: 'long' });
    } else if (view === 'week') {
      const weekStart = startOfWeek(currentDate);
      const weekEnd = endOfWeek(currentDate);
      return `${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d, yyyy')}`;
    } else {
      return formatDate(currentDate, i18n.language, { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    }
  };

  const WeekView = () => {
    const weekStart = startOfWeek(currentDate);
    const weekEnd = endOfWeek(currentDate);
    const daysInWeek = eachDayOfInterval({ start: weekStart, end: weekEnd });

    return (
      <div className="grid grid-cols-7 gap-2">
        {daysInWeek.map(day => {
          const dayEvents = eventsForDate(day);
          const isToday = isSameDay(day, new Date());
          return (
            <Card key={day.toString()} className={`p-3 ${isToday ? 'border-primary' : ''}`}>
              <div className="text-center mb-2">
                <div className="text-xs text-muted-foreground">
                  {format(day, 'EEE')}
                </div>
                <div className={`text-lg font-semibold ${isToday ? 'text-primary' : ''}`}>
                  {format(day, 'd')}
                </div>
              </div>
              <div className="space-y-1">
                {dayEvents.slice(0, 5).map(event => (
                  <div key={event.id} className="flex items-center gap-1 text-xs">
                    <div className={`w-2 h-2 rounded-full ${event.color} flex-shrink-0`} />
                    <span className="truncate">{event.title}</span>
                  </div>
                ))}
                {dayEvents.length > 5 && (
                  <div className="text-xs text-muted-foreground text-center">
                    +{dayEvents.length - 5} more
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    );
  };

  const DayView = () => {
    const dayEvents = eventsForDate(currentDate);

    return (
      <Card className="p-6">
        <h2 className="text-2xl font-bold mb-4">
          {formatDate(currentDate, i18n.language, { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </h2>
        <div className="space-y-3">
          {dayEvents.length === 0 && (
            <p className="text-muted-foreground text-center py-8">
              {t('calendar.noEvents')}
            </p>
          )}
          {dayEvents.map(event => (
            <div 
              key={event.id} 
              className="flex items-start gap-3 p-3 rounded-lg border hover:bg-accent/50 transition-colors"
            >
              <div className={`w-4 h-4 rounded-full ${event.color} mt-0.5 flex-shrink-0`} />
              <div className="flex-1 min-w-0">
                <div className="font-medium">{event.title}</div>
                <div className="text-sm text-muted-foreground capitalize">
                  {event.type}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    );
  };

  return (
    <>
      <SEO 
        title={`${t('calendar.title')} - Splitz`}
        description={t('calendar.subtitle')}
      />
      
      <div className={`min-h-screen bg-gradient-to-b from-muted/30 via-muted/10 to-background p-4 md:p-6 space-y-6 md:space-y-8 ${isRTL ? 'rtl' : 'ltr'}`}>
        {/* Header */}
        <div className={`flex justify-between items-center ${rtlClass(isRTL, 'flex-row-reverse', 'flex-row')}`}>
          <div>
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight">
              {t('calendar.title')}
            </h1>
            <p className="text-sm md:text-base text-muted-foreground mt-1">
              {t('calendar.subtitle')}
            </p>
          </div>

          <div className={`flex items-center gap-2 ${rtlClass(isRTL, 'flex-row-reverse', 'flex-row')}`}>
            <Button variant="outline" size="icon" onClick={isRTL ? nextPeriod : prevPeriod}>
              {isRTL ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </Button>
            <div className="text-lg font-semibold min-w-[140px] text-center">
              {getHeaderDate()}
            </div>
            <Button variant="outline" size="icon" onClick={isRTL ? prevPeriod : nextPeriod}>
              {isRTL ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* View Toggle */}
        <Tabs value={view} onValueChange={(v) => setView(v as any)}>
          <TabsList>
            <TabsTrigger value="month">{t('calendar.month')}</TabsTrigger>
            <TabsTrigger value="week">{t('calendar.week')}</TabsTrigger>
            <TabsTrigger value="day">{t('calendar.day')}</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Legend */}
        <Card className="p-4 md:p-5 shadow-sm border border-border/40 hover:shadow-md transition-shadow duration-200">
          <h3 className="text-sm font-semibold mb-3 tracking-tight">{t('calendar.eventTypes')}</h3>
          <div className={`flex flex-wrap gap-4 text-sm ${isRTL ? 'flex-row-reverse' : ''}`}>
            <div className={`flex items-center gap-2 ${rtlClass(isRTL, 'flex-row-reverse', 'flex-row')}`}>
              <div className="w-3 h-3 rounded-full bg-blue-500 shadow-sm" />
              <span className="font-medium">{t('calendar.tasks')}</span>
            </div>
            <div className={`flex items-center gap-2 ${rtlClass(isRTL, 'flex-row-reverse', 'flex-row')}`}>
              <div className="w-3 h-3 rounded-full bg-green-500 shadow-sm" />
              <span className="font-medium">{t('calendar.habits')}</span>
            </div>
            <div className={`flex items-center gap-2 ${rtlClass(isRTL, 'flex-row-reverse', 'flex-row')}`}>
              <div className="w-3 h-3 rounded-full bg-red-500 shadow-sm" />
              <span className="font-medium">{t('calendar.subscriptions')}</span>
            </div>
            <div className={`flex items-center gap-2 ${rtlClass(isRTL, 'flex-row-reverse', 'flex-row')}`}>
              <div className="w-3 h-3 rounded-full bg-purple-500 shadow-sm" />
              <span className="font-medium">{t('calendar.focus')}</span>
            </div>
            <div className={`flex items-center gap-2 ${rtlClass(isRTL, 'flex-row-reverse', 'flex-row')}`}>
              <div className="w-3 h-3 rounded-full bg-orange-500 shadow-sm" />
              <span className="font-medium">{t('calendar.trips')}</span>
            </div>
            <div className={`flex items-center gap-2 ${rtlClass(isRTL, 'flex-row-reverse', 'flex-row')}`}>
              <div className="w-3 h-3 rounded-full bg-yellow-500 shadow-sm" />
              <span className="font-medium">{t('calendar.challenges')}</span>
            </div>
          </div>
        </Card>

        {/* Calendar Grid */}
        <div className={`grid grid-cols-1 ${view === 'month' ? 'lg:grid-cols-3' : ''} gap-6`}>
          <Card className={`${view === 'month' ? 'lg:col-span-2' : ''} p-4`}>
            {view === 'month' && (
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                month={currentDate}
                onMonthChange={setCurrentDate}
                className="w-full"
                components={{
                  DayContent: ({ date }) => {
                    const eventTypes = getEventTypesForDate(date);
                    return (
                      <div className="relative w-full h-full flex items-center justify-center">
                        <span className={eventTypes.length > 0 ? 'font-semibold' : ''}>
                          {format(date, 'd')}
                        </span>
                        {eventTypes.length > 0 && (
                          <div className="absolute bottom-0.5 left-1/2 -translate-x-1/2 flex gap-0.5">
                            {eventTypes.map((type) => (
                              <div
                                key={type}
                                className={`w-1 h-1 rounded-full ${eventTypeColors[type]} shadow-sm`}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  }
                }}
              />
            )}

            {view === 'week' && <WeekView />}

            {view === 'day' && <DayView />}
          </Card>

          {/* Selected Date Events - Only show in month view */}
          {view === 'month' && (
            <Card className="p-4">
              <h3 className="font-semibold mb-4">
                {selectedDate ? formatDate(selectedDate, i18n.language, { year: 'numeric', month: 'long', day: 'numeric' }) : t('calendar.selectDate')}
              </h3>
              <div className="space-y-2">
                {selectedDate && eventsForDate(selectedDate).length === 0 && (
                  <p className="text-sm text-muted-foreground">{t('calendar.noEvents')}</p>
                )}
                {selectedDate && eventsForDate(selectedDate).map(event => (
                  <div key={event.id} className={`flex items-center gap-2 p-2 rounded-lg bg-accent/10 ${rtlClass(isRTL, 'flex-row-reverse', 'flex-row')}`}>
                    <div className={`w-3 h-3 rounded-full ${event.color}`} />
                    <span className="text-sm">{event.title}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
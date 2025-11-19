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
import { useIsMobile } from "@/hooks/use-mobile";
import { useSwipeGesture } from "@/hooks/useSwipeGesture";
import { responsiveSpacing, responsiveText, responsiveSize } from "@/lib/responsive-utils";

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
  const isMobile = useIsMobile();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [view, setView] = useState<"month" | "week" | "day">("month");

  const goToToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(new Date());
  };

  const isCurrentDateToday = isSameDay(currentDate, new Date());

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

  const { bind } = useSwipeGesture({
    onSwipeLeft: () => !isRTL ? nextPeriod() : prevPeriod(),
    onSwipeRight: () => !isRTL ? prevPeriod() : nextPeriod(),
    threshold: 50,
    enabled: isMobile,
  });

  const WeekView = () => {
    const weekStart = startOfWeek(currentDate);
    const weekEnd = endOfWeek(currentDate);
    const daysInWeek = eachDayOfInterval({ start: weekStart, end: weekEnd });

    return (
      <div className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-7 ${responsiveSpacing.gridGap}`}>
        {daysInWeek.map(day => {
          const dayEvents = eventsForDate(day);
          const isDayToday = isSameDay(day, new Date());
          const isCurrentMonth = day.getMonth() === currentDate.getMonth();
          
          return (
            <Card 
              key={day.toString()} 
              className={`${responsiveSize.card} hover:shadow-md transition-all duration-200 ${
                isDayToday 
                  ? 'border-primary border-2 bg-primary/5 ring-2 ring-primary/20' 
                  : isCurrentMonth 
                    ? 'border-border' 
                    : 'border-border/50 opacity-60'
              }`}
            >
              <div className="text-center mb-3">
                <div className={`${responsiveText.caption} text-muted-foreground uppercase tracking-wide`}>
                  {format(day, 'EEE')}
                </div>
                <div className={`${responsiveText.sectionTitle} font-bold ${
                  isDayToday ? 'text-primary' : ''
                }`}>
                  {format(day, 'd')}
                </div>
                {isDayToday && (
                  <div className="text-[10px] font-semibold text-primary uppercase tracking-wider mt-0.5">
                    {t('calendar.today')}
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                {dayEvents.length === 0 && (
                  <p className={`${responsiveText.caption} text-muted-foreground text-center py-2`}>
                    {t('calendar.noEvents')}
                  </p>
                )}
                
                {dayEvents.slice(0, 5).map(event => (
                  <div 
                    key={event.id} 
                    className={`flex items-center gap-2 p-2 rounded-md hover:bg-accent/50 transition-colors ${
                      rtlClass(isRTL, 'flex-row-reverse', 'flex-row')
                    }`}
                  >
                    <div className={`w-2.5 h-2.5 rounded-full ${event.color} flex-shrink-0 shadow-sm`} />
                    <span className={`${responsiveText.small} truncate font-medium`}>
                      {event.title}
                    </span>
                  </div>
                ))}
                
                {dayEvents.length > 5 && (
                  <div className={`${responsiveText.caption} text-muted-foreground text-center py-1 font-medium`}>
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
    
    const categorizeEventsByTime = (events: CalendarEvent[]) => {
      return {
        morning: events.filter(e => {
          const hour = e.date.getHours();
          return hour >= 0 && hour < 12;
        }),
        afternoon: events.filter(e => {
          const hour = e.date.getHours();
          return hour >= 12 && hour < 17;
        }),
        evening: events.filter(e => {
          const hour = e.date.getHours();
          return hour >= 17;
        }),
        allDay: events.filter(e => e.date.getHours() === 0)
      };
    };

    const categorizedEvents = categorizeEventsByTime(dayEvents);
    const hasAnyEvents = dayEvents.length > 0;

    const EventSection = ({ title, events }: { title: string; events: CalendarEvent[] }) => {
      if (events.length === 0) return null;
      
      return (
        <div className="space-y-3">
          <h3 className={`${responsiveText.cardTitle} font-semibold text-muted-foreground uppercase tracking-wide`}>
            {title}
          </h3>
          <div className="space-y-2">
            {events.map(event => (
              <div 
                key={event.id} 
                className={`flex items-start gap-3 p-4 rounded-lg border hover:bg-accent/50 transition-all duration-200 hover:shadow-sm ${
                  rtlClass(isRTL, 'flex-row-reverse', 'flex-row')
                }`}
              >
                <div className={`w-4 h-4 rounded-full ${event.color} mt-0.5 flex-shrink-0 shadow-md`} />
                <div className="flex-1 min-w-0">
                  <div className={`${responsiveText.body} font-semibold`}>{event.title}</div>
                  <div className={`${responsiveText.small} text-muted-foreground capitalize mt-1`}>
                    {event.type} • {format(event.date, 'h:mm a')}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    };

    return (
      <Card className={`${responsiveSize.card} min-h-[400px]`}>
        <div className="mb-6">
          <h2 className={`${responsiveText.sectionTitle} font-bold`}>
            {formatDate(currentDate, i18n.language, { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </h2>
          {isSameDay(currentDate, new Date()) && (
            <p className={`${responsiveText.small} text-primary font-semibold mt-1`}>
              {t('calendar.today')}
            </p>
          )}
        </div>

        {!hasAnyEvents && (
          <div className="flex flex-col items-center justify-center py-16">
            <CalendarIcon className="h-16 w-16 text-muted-foreground/30 mb-4" />
            <p className={`${responsiveText.body} text-muted-foreground text-center`}>
              {t('calendar.noEvents')}
            </p>
          </div>
        )}

        {hasAnyEvents && (
          <div className="space-y-6">
            <EventSection title={t('calendar.allDay')} events={categorizedEvents.allDay} />
            <EventSection title={t('calendar.morningEvents')} events={categorizedEvents.morning} />
            <EventSection title={t('calendar.afternoonEvents')} events={categorizedEvents.afternoon} />
            <EventSection title={t('calendar.eveningEvents')} events={categorizedEvents.evening} />
          </div>
        )}
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
        <div className={`flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 ${rtlClass(isRTL, 'flex-row-reverse', 'flex-row')}`}>
          <div>
            <h1 className={`${responsiveText.pageTitle} font-bold tracking-tight`}>
              {t('calendar.title')}
            </h1>
            <p className={`${responsiveText.body} text-muted-foreground mt-1`}>
              {t('calendar.subtitle')}
            </p>
          </div>

          <div className={`flex items-center gap-2 ${rtlClass(isRTL, 'flex-row-reverse', 'flex-row')}`}>
            <Button 
              variant="outline" 
              size="sm"
              onClick={goToToday}
              disabled={isCurrentDateToday}
              className="hidden sm:flex"
            >
              <CalendarIcon className="h-4 w-4 mr-2" />
              {t('calendar.today')}
            </Button>
            
            <Button 
              variant="outline" 
              size="icon"
              onClick={goToToday}
              disabled={isCurrentDateToday}
              className="sm:hidden"
            >
              <CalendarIcon className="h-4 w-4" />
            </Button>
            
            <Button variant="outline" size="icon" onClick={isRTL ? nextPeriod : prevPeriod}>
              {isRTL ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </Button>
            
            <div className={`${responsiveText.cardTitle} font-semibold min-w-[120px] sm:min-w-[180px] text-center`}>
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
        <Card className={`${responsiveSize.card} shadow-sm border border-border/40 hover:shadow-md transition-shadow duration-200`}>
          <h3 className={`${responsiveText.cardTitle} font-semibold mb-4 tracking-tight`}>
            {t('calendar.eventTypes')}
          </h3>
          <div className={`flex flex-wrap gap-4 ${responsiveText.body} ${isRTL ? 'flex-row-reverse' : ''}`}>
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
        <div 
          {...(isMobile ? bind() : {})}
          className={`grid grid-cols-1 ${view === 'month' ? 'lg:grid-cols-3' : ''} ${responsiveSpacing.gridGap} touch-pan-y`}
        >
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
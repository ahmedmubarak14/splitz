import { MapPin, Calendar, Users, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { differenceInDays, format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useIsRTL, rtlClass } from "@/lib/rtl-utils";
import { formatDate } from "@/lib/formatters";

interface TripCardProps {
  trip: any;
}

export const TripCard = ({ trip }: TripCardProps) => {
  const { t, i18n } = useTranslation();
  const isRTL = useIsRTL();
  const navigate = useNavigate();
  const totalTasks = trip.trip_tasks?.length || 0;
  const completedTasks = trip.trip_tasks?.filter((t: any) => t.status === "done").length || 0;
  const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
  
  const daysUntilStart = differenceInDays(new Date(trip.start_date), new Date());
  const isActive = daysUntilStart <= 0 && differenceInDays(new Date(trip.end_date), new Date()) >= 0;
  const isCompleted = trip.status === "completed";

  return (
    <Card 
      className="hover:shadow-lg transition-all cursor-pointer"
      onClick={() => navigate(`/trips/${trip.id}`)}
    >
      <CardHeader className="pb-3">
        <div className={`flex items-start justify-between ${rtlClass(isRTL, 'flex-row-reverse', 'flex-row')}`}>
          <div className={`flex items-center gap-3 ${rtlClass(isRTL, 'flex-row-reverse', 'flex-row')}`}>
            <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-orange-500 to-pink-500 flex items-center justify-center">
              <MapPin className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="font-semibold">{trip.name}</h3>
              {trip.destination && (
                <p className="text-sm text-muted-foreground">{trip.destination}</p>
              )}
            </div>
          </div>
          <Badge variant={isCompleted ? "default" : isActive ? "secondary" : "outline"}>
            {isCompleted ? t('trips.completed') : isActive ? t('trips.active') : t('trips.planning')}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className={`flex items-center gap-4 text-sm text-muted-foreground ${rtlClass(isRTL, 'flex-row-reverse', 'flex-row')}`}>
          <div className={`flex items-center gap-1 ${rtlClass(isRTL, 'flex-row-reverse', 'flex-row')}`}>
            <Calendar className="h-4 w-4" />
            <span>{formatDate(trip.start_date, i18n.language)}</span>
          </div>
          <div className={`flex items-center gap-1 ${rtlClass(isRTL, 'flex-row-reverse', 'flex-row')}`}>
            <Users className="h-4 w-4" />
            <span>{trip.trip_members?.[0]?.count || 0} {t('trips.members')}</span>
          </div>
        </div>

        {totalTasks > 0 && (
          <div className="space-y-2">
            <div className={`flex items-center justify-between text-sm ${rtlClass(isRTL, 'flex-row-reverse', 'flex-row')}`}>
              <span className="text-muted-foreground">{t('trips.tasks')}</span>
              <span className="font-semibold">{completedTasks}/{totalTasks}</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        {!isCompleted && !isActive && daysUntilStart > 0 && (
          <p className="text-sm text-center text-muted-foreground">
            {t('trips.startsIn')} {daysUntilStart} {daysUntilStart === 1 ? t('common.day') : t('common.days')}
          </p>
        )}
      </CardContent>
    </Card>
  );
};
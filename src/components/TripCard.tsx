import { MapPin, Calendar, Users, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { format, differenceInDays } from "date-fns";
import { useNavigate } from "react-router-dom";

interface TripCardProps {
  trip: any;
}

export const TripCard = ({ trip }: TripCardProps) => {
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
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
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
            {isCompleted ? "Completed" : isActive ? "Active" : "Planning"}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            <span>{format(new Date(trip.start_date), "MMM d")}</span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            <span>{trip.trip_members?.[0]?.count || 0} members</span>
          </div>
        </div>

        {totalTasks > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Tasks</span>
              <span className="font-semibold">{completedTasks}/{totalTasks}</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        {!isCompleted && !isActive && daysUntilStart > 0 && (
          <p className="text-sm text-center text-muted-foreground">
            Starts in {daysUntilStart} days
          </p>
        )}
      </CardContent>
    </Card>
  );
};
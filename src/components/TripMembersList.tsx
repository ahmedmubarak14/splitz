import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EmptyState } from "./EmptyState";
import { Users } from "lucide-react";
import { useIsRTL, rtlClass } from "@/lib/rtl-utils";

interface TripMembersListProps {
  tripId: string;
}

export const TripMembersList = ({ tripId }: TripMembersListProps) => {
  const { t } = useTranslation();
  const isRTL = useIsRTL();

  const { data: members, isLoading } = useQuery({
    queryKey: ["trip-members", tripId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("trip_members")
        .select(`
          *,
          profiles:user_id(id, full_name, avatar_url)
        `)
        .eq("trip_id", tripId);

      if (error) {
        toast.error(t('errors.failedToLoad'));
        throw error;
      }
      return data;
    },
  });

  const { data: trip } = useQuery({
    queryKey: ["trip", tripId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("trips")
        .select("created_by")
        .eq("id", tripId)
        .single();

      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return <div className="text-center py-8">{t('common.loading')}</div>;
  }

  if (!members || members.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title={t('trips.noMembers')}
        description={t('trips.noMembersDescription')}
      />
    );
  }

  return (
    <div className="space-y-3">
      {members.map((member: any) => (
        <Card key={member.id} className="p-4">
          <div className={`flex items-center justify-between ${rtlClass(isRTL, 'flex-row-reverse', 'flex-row')}`}>
            <div className={`flex items-center gap-3 ${rtlClass(isRTL, 'flex-row-reverse', 'flex-row')}`}>
              <Avatar className="h-10 w-10">
                <AvatarImage src={member.profiles?.avatar_url} />
                <AvatarFallback>
                  {member.profiles?.full_name?.[0] || 'U'}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{member.profiles?.full_name || 'Unknown User'}</p>
                <p className="text-sm text-muted-foreground capitalize">{member.role}</p>
              </div>
            </div>
            
            {trip?.created_by === member.user_id && (
              <Badge variant="secondary">{t('trips.creator')}</Badge>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
};

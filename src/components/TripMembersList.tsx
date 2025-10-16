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
      // First fetch trip members
      const { data: memberData, error: memberError } = await supabase
        .from("trip_members")
        .select("*")
        .eq("trip_id", tripId);

      if (memberError) {
        toast.error(t('errors.failedToLoad'));
        throw memberError;
      }

      if (!memberData || memberData.length === 0) return [];

      // Then fetch profiles for those users
      const userIds = memberData.map(m => m.user_id);
      const { data: profiles, error: profileError } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url")
        .in("id", userIds);

      if (profileError) {
        console.error("Failed to load profiles:", profileError);
        // Return members without profile data
        return memberData;
      }

      // Merge members with their profiles
      return memberData.map(member => ({
        ...member,
        profiles: profiles?.find(p => p.id === member.user_id) || null
      }));
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
                <p className="font-medium">{member.profiles?.full_name || t('trips.unknownUser')}</p>
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

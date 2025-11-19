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
  members?: { user_id: string; role: string | null }[];
  creatorId?: string;
}

export const TripMembersList = ({ tripId, members: providedMembers, creatorId }: TripMembersListProps) => {
  const { t } = useTranslation();
  const isRTL = useIsRTL();

  // Build members list either from props or fetch from DB
  const { data: members, isLoading, error } = useQuery({
    queryKey: ["trip-members", tripId, providedMembers?.length ?? 'fetch'],
    queryFn: async () => {
      const baseMembers = providedMembers;

      // If members were passed from parent, use them directly
      if (baseMembers && baseMembers.length > 0) {
        const userIds = baseMembers.map((m) => m.user_id);
        try {
          const { data: profiles, error: profileError } = await supabase.rpc(
            'get_public_profiles',
            { _user_ids: userIds }
          );
          if (profileError) throw profileError;

          return baseMembers.map((member) => ({
            ...member,
            profiles: profiles?.find((p: any) => p.id === member.user_id) || null,
            id: `${member.user_id}-${member.role || 'member'}`,
          }));
        } catch (e) {
          console.warn('[TripMembers] RPC failed with provided members:', e);
          return baseMembers.map((member) => ({ ...member, profiles: null, id: `${member.user_id}-${member.role || 'member'}` }));
        }
      }

      // Fallback: fetch trip members (may be restricted by RLS)
      const { data: memberData, error: memberError } = await supabase
        .from("trip_members")
        .select("*")
        .eq("trip_id", tripId);

      if (memberError) {
        console.error('[TripMembers] Failed to fetch members:', memberError);
        toast.error(t('errors.failedToLoad'));
        throw memberError;
      }

      if (!memberData || memberData.length === 0) return [];

      const userIds = memberData.map((m) => m.user_id);
      try {
        const { data: profiles, error: profileError } = await supabase.rpc(
          'get_public_profiles',
          { _user_ids: userIds }
        );
        if (profileError) throw profileError;

        return memberData.map((member) => ({
          ...member,
          profiles: profiles?.find((p: any) => p.id === member.user_id) || null,
        }));
      } catch (rpcError) {
        console.warn('[TripMembers] RPC call failed:', rpcError);
        return memberData.map((member) => ({ ...member, profiles: null }));
      }
    },
  });

  // Log errors for debugging
  if (error) {
    console.error('[TripMembers] Query error:', error);
  }

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
            
            {(creatorId ?? trip?.created_by) === member.user_id && (
              <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                {t('trips.creator')}
              </Badge>
            )}
            {member.role === 'admin' && trip?.created_by !== member.user_id && (
              <Badge variant="outline" className="border-orange-500/20 text-orange-600 dark:text-orange-400">
                {t('trips.admin')}
              </Badge>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
};

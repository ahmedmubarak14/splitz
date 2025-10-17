import { useState, useEffect } from "react";
import { Bell } from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "./ui/sheet";
import { NotificationList } from "./NotificationList";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";

export default function NotificationBell() {
  const { t } = useTranslation();
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    fetchUnreadCount();

    const channel = supabase
      .channel('notifications-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications'
        },
        () => fetchUnreadCount()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchUnreadCount = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { count } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_read', false);

    setUnreadCount(count || 0);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative rounded-lg h-9 w-9">
          <Bell className="h-[18px] w-[18px]" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-4 w-4 flex items-center justify-center p-0 text-[10px]"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{t('notifications.title')}</SheetTitle>
        </SheetHeader>
        <NotificationList onRead={fetchUnreadCount} />
      </SheetContent>
    </Sheet>
  );
}

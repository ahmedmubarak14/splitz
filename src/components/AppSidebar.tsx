import { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, Target, DollarSign, Trophy, User } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from '@/components/ui/sidebar';

const overviewItems = [
  { path: '/dashboard', icon: Home, labelKey: 'nav.dashboard', label: 'Dashboard' },
];

const workspaceItems = [
  { path: '/habits', icon: Target, labelKey: 'nav.habits', label: 'Habits' },
  { path: '/expenses', icon: DollarSign, labelKey: 'nav.expenses', label: 'Expenses' },
  { path: '/challenges', icon: Trophy, labelKey: 'nav.challenges', label: 'Challenges' },
];

const accountItems = [
  { path: '/profile', icon: User, labelKey: 'nav.profile', label: 'Profile' },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const { t } = useTranslation();
  const [profile, setProfile] = useState<{ full_name: string | null; avatar_url: string | null; email: string | null } | null>(null);

  const isCollapsed = state === 'collapsed';

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('full_name, avatar_url, email')
          .eq('id', user.id)
          .single();
        
        if (data) {
          setProfile(data);
        }
      }
    };

    fetchProfile();
  }, []);

  const getInitials = (name: string | null) => {
    if (!name) return 'U';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <Sidebar
      className={`${isCollapsed ? 'w-16' : 'w-[260px]'} bg-card border-r border-border/30 transition-[width] duration-300`}
      collapsible="icon"
    >
      <SidebarContent className="flex flex-col h-full bg-card">
        
        {/* User Section */}
        <div className={`${isCollapsed ? 'px-2 py-4' : 'px-5 py-5'} border-b border-border/30`}>
          {isCollapsed ? (
            <div className="flex justify-center">
              <div className="relative">
                {profile?.avatar_url ? (
                  <img 
                    src={profile.avatar_url} 
                    alt={profile.full_name || 'User'} 
                    className="h-8 w-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-foreground text-background flex items-center justify-center font-semibold text-xs">
                    {getInitials(profile?.full_name || null)}
                  </div>
                )}
                <span className="absolute bottom-0 right-0 h-1.5 w-1.5 rounded-full bg-success ring-2 ring-card" />
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className="relative">
                {profile?.avatar_url ? (
                  <img 
                    src={profile.avatar_url} 
                    alt={profile.full_name || 'User'} 
                    className="h-9 w-9 rounded-full object-cover"
                  />
                ) : (
                  <div className="h-9 w-9 rounded-full bg-foreground text-background flex items-center justify-center font-semibold text-sm">
                    {getInitials(profile?.full_name || null)}
                  </div>
                )}
                <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-success ring-2 ring-card" />
              </div>
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-sm font-semibold truncate">{profile?.full_name || 'User'}</span>
                <span className="text-xs text-muted-foreground truncate">{profile?.email || ''}</span>
              </div>
            </div>
          )}
        </div>

        {/* Main Navigation */}
        <div className="flex-1 overflow-y-auto py-4">
          
          {/* Overview Section */}
          <SidebarGroup>
            {!isCollapsed && (
              <SidebarGroupLabel className="px-5 py-2 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Overview
              </SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu className={`${isCollapsed ? 'px-2' : 'px-3'} space-y-0.5`}>
                {overviewItems.map((item) => {
                  const isActive = location.pathname === item.path;
                  return (
                    <SidebarMenuItem key={item.path}>
                      <SidebarMenuButton asChild>
                        <NavLink
                          to={item.path}
                          className={`flex items-center h-8 rounded-lg transition-all ${
                            isCollapsed ? 'justify-center w-10 mx-auto' : 'gap-3 px-3'
                          } ${
                            isActive
                              ? 'bg-foreground text-background font-medium shadow-sm'
                              : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                          }`}
                        >
                          <item.icon className="h-4 w-4 flex-shrink-0" />
                          {!isCollapsed && <span className="text-sm">{item.labelKey ? t(item.labelKey) : item.label}</span>}
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          {/* Workspace Section */}
          <SidebarGroup className="mt-4">
            {!isCollapsed && (
              <SidebarGroupLabel className="px-5 py-2 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Workspace
              </SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu className={`${isCollapsed ? 'px-2' : 'px-3'} space-y-0.5`}>
                {workspaceItems.map((item) => {
                  const isActive = location.pathname === item.path;
                  return (
                    <SidebarMenuItem key={item.path}>
                      <SidebarMenuButton asChild>
                        <NavLink
                          to={item.path}
                          className={`flex items-center h-8 rounded-lg transition-all ${
                            isCollapsed ? 'justify-center w-10 mx-auto' : 'gap-3 px-3'
                          } ${
                            isActive
                              ? 'bg-foreground text-background font-medium shadow-sm'
                              : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                          }`}
                        >
                          <item.icon className="h-4 w-4 flex-shrink-0" />
                          {!isCollapsed && <span className="text-sm">{item.labelKey ? t(item.labelKey) : item.label}</span>}
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          {/* Account Section */}
          <SidebarGroup className="mt-4">
            {!isCollapsed && (
              <SidebarGroupLabel className="px-5 py-2 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Account & Support
              </SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu className={`${isCollapsed ? 'px-2' : 'px-3'} space-y-0.5`}>
                {accountItems.map((item, idx) => (
                  <SidebarMenuItem key={idx}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.path}
                        className={`flex items-center h-8 rounded-lg transition-all ${
                          isCollapsed ? 'justify-center w-10 mx-auto' : 'gap-3 px-3'
                        } text-muted-foreground hover:bg-muted/60 hover:text-foreground`}
                      >
                        <item.icon className="h-4 w-4 flex-shrink-0" />
                        {!isCollapsed && <span className="text-sm">{item.labelKey ? t(item.labelKey) : item.label}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </div>

      </SidebarContent>
    </Sidebar>
  );
}

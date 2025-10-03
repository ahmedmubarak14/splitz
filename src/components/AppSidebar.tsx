import { NavLink, useLocation } from 'react-router-dom';
import { Home, Target, DollarSign, Trophy, User, Settings, HelpCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from '@/components/ui/sidebar';

const mainNavItems = [
  { path: '/dashboard', icon: Home, labelKey: 'nav.dashboard' },
  { path: '/habits', icon: Target, labelKey: 'nav.habits' },
  { path: '/expenses', icon: DollarSign, labelKey: 'nav.expenses' },
  { path: '/challenges', icon: Trophy, labelKey: 'nav.challenges' },
];

const bottomNavItems = [
  { path: '/profile', icon: User, labelKey: 'nav.profile' },
  { path: '/profile', icon: Settings, label: 'Settings' },
  { path: '/profile', icon: HelpCircle, label: 'Help' },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const { t } = useTranslation();

  const isCollapsed = state === 'collapsed';

  return (
    <Sidebar
      className={`${isCollapsed ? 'w-[72px]' : 'w-[280px]'} bg-background border-r border-border/20 transition-[width] duration-300`}
      collapsible="icon"
    >
      <SidebarContent className="flex flex-col h-full">
        {/* Top section with user avatar */}
        <div className={`${isCollapsed ? 'px-3 py-4' : 'px-5 py-4'} border-b border-border/20`}>
          {isCollapsed ? (
            <div className="flex justify-center">
              <div className="relative">
                <div className="h-10 w-10 rounded-full bg-foreground text-background flex items-center justify-center font-semibold text-sm">
                  L
                </div>
                <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-green-500 ring-2 ring-background" />
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="h-10 w-10 rounded-full bg-foreground text-background flex items-center justify-center font-semibold text-sm">
                  L
                </div>
                <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-green-500 ring-2 ring-background" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs text-muted-foreground">LinkUp</span>
                <span className="text-sm font-semibold truncate">Vendor Portal</span>
              </div>
            </div>
          )}
        </div>

        {/* Main navigation */}
        <SidebarGroup className="flex-1 py-4">
          <SidebarGroupContent>
            {isCollapsed ? (
              <div className="flex flex-col gap-2 px-3">
                {mainNavItems.map((item) => {
                  const isActive = location.pathname === item.path;
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      className={`h-10 w-10 mx-auto rounded-xl flex items-center justify-center transition-all ${
                        isActive
                          ? 'bg-foreground text-background shadow-sm'
                          : 'bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground'
                      }`}
                    >
                      <item.icon className="h-5 w-5" />
                    </NavLink>
                  );
                })}
              </div>
            ) : (
              <div className="px-3 space-y-1">
                <div className="px-2 py-2 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Overview
                </div>
                <SidebarMenu className="space-y-0.5">
                  {mainNavItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    return (
                      <SidebarMenuItem key={item.path}>
                        <SidebarMenuButton asChild>
                          <NavLink
                            to={item.path}
                            className={`flex items-center gap-3 h-10 px-3 rounded-lg transition-all ${
                              isActive
                                ? 'bg-foreground text-background font-medium'
                                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                            }`}
                          >
                            <item.icon className="h-[18px] w-[18px]" />
                            <span className="text-sm">{t(item.labelKey)}</span>
                          </NavLink>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </div>
            )}
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Bottom navigation */}
        <div className={`${isCollapsed ? 'px-3' : 'px-3'} py-4 border-t border-border/20`}>
          {isCollapsed ? (
            <div className="flex flex-col gap-2">
              {bottomNavItems.map((item, idx) => (
                <NavLink
                  key={idx}
                  to={item.path}
                  className="h-10 w-10 mx-auto rounded-xl flex items-center justify-center bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground transition-all"
                >
                  <item.icon className="h-5 w-5" />
                </NavLink>
              ))}
            </div>
          ) : (
            <SidebarMenu className="space-y-0.5">
              {bottomNavItems.map((item, idx) => (
                <SidebarMenuItem key={idx}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.path}
                      className="flex items-center gap-3 h-10 px-3 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-all"
                    >
                      <item.icon className="h-[18px] w-[18px]" />
                      <span className="text-sm">{item.labelKey ? t(item.labelKey as any) : item.label}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          )}
        </div>
      </SidebarContent>
    </Sidebar>
  );
}

import { NavLink, useLocation, Link } from 'react-router-dom';
import { Home, Target, DollarSign, Trophy, User } from 'lucide-react';
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

const navItems = [
  { path: '/dashboard', icon: Home, labelKey: 'nav.dashboard' },
  { path: '/habits', icon: Target, labelKey: 'nav.habits' },
  { path: '/expenses', icon: DollarSign, labelKey: 'nav.expenses' },
  { path: '/challenges', icon: Trophy, labelKey: 'nav.challenges' },
  { path: '/profile', icon: User, labelKey: 'nav.profile' },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const { t } = useTranslation();

  const isCollapsed = state === 'collapsed';

  return (
    <Sidebar
      className={`${isCollapsed ? 'w-16' : 'w-64'} bg-background border-r border-border/10 transition-all duration-300`}
      collapsible="icon"
    >
      <SidebarContent className="py-6">
        <SidebarGroup>
          <div className={`${isCollapsed ? 'px-0 justify-center' : 'px-6'} mb-8`}>
            {isCollapsed ? (
              <div className="flex items-center justify-center">
                <div className="w-10 h-10 rounded-full bg-foreground flex items-center justify-center">
                  <span className="text-background font-bold text-lg">L</span>
                </div>
              </div>
            ) : (
              <Link to="/" className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-foreground flex items-center justify-center">
                  <span className="text-background font-bold text-lg">L</span>
                </div>
                <span className="font-semibold text-xl tracking-tight">LinkUp</span>
              </Link>
            )}
          </div>
          
          <SidebarGroupContent>
            <SidebarMenu className="gap-1 px-3">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.path}
                        end
                        className={`flex items-center gap-3 h-11 px-4 rounded-xl transition-all ${
                          isCollapsed ? 'justify-center' : ''
                        } ${
                          isActive
                            ? 'bg-foreground text-background font-medium'
                            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                        }`}
                      >
                        <item.icon className="h-5 w-5 flex-shrink-0" />
                        {!isCollapsed && <span className="text-sm">{t(item.labelKey)}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}

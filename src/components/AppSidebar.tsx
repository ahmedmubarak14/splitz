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
      className={`${isCollapsed ? 'w-20' : 'w-72'} transition-all duration-300`}
      collapsible="icon"
    >
      <SidebarContent className="py-8">
        <SidebarGroup>
          <div className={`${isCollapsed ? 'px-0 justify-center flex' : 'px-8'} mb-12`}>
            {isCollapsed ? (
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-foreground to-foreground/80 flex items-center justify-center shadow-sm">
                <span className="text-background font-bold text-xl">L</span>
              </div>
            ) : (
              <Link to="/" className="flex items-center gap-3 group">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-foreground to-foreground/80 flex items-center justify-center shadow-sm transition-transform group-hover:scale-105">
                  <span className="text-background font-bold text-xl">L</span>
                </div>
                <span className="font-bold text-2xl tracking-tight">LinkUp</span>
              </Link>
            )}
          </div>
          
          <SidebarGroupContent>
            <SidebarMenu className="gap-2 px-4">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.path}
                        end
                        className={`flex items-center gap-4 h-12 px-4 rounded-2xl transition-all ${
                          isCollapsed ? 'justify-center' : ''
                        } ${
                          isActive
                            ? 'bg-foreground text-background shadow-sm'
                            : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                        }`}
                      >
                        <item.icon className="h-5 w-5 flex-shrink-0" />
                        {!isCollapsed && <span className="text-sm font-medium">{t(item.labelKey)}</span>}
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

import { NavLink, useLocation, Link } from 'react-router-dom';
import { Home, Target, DollarSign, Trophy, User } from 'lucide-react';
import { useTranslation } from 'react-i18next';
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
import logo from '@/assets/logo.png';

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
  const currentPath = location.pathname;

  const isCollapsed = state === 'collapsed';

  return (
    <Sidebar
      className={`${isCollapsed ? 'w-16' : 'w-64'} bg-background border-r border-border/40 transition-all duration-300`}
      collapsible="icon"
    >
      <SidebarContent className="py-4">
        <SidebarGroup>
          <SidebarGroupLabel className={`${isCollapsed ? 'px-0 justify-center' : 'px-4'} py-3 mb-4`}>
            {isCollapsed ? (
              <div className="flex items-center justify-center">
                <div className="w-9 h-9 rounded-lg bg-foreground flex items-center justify-center">
                  <span className="text-background font-bold text-base">L</span>
                </div>
              </div>
            ) : (
              <Link to="/" className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-lg bg-foreground flex items-center justify-center">
                  <span className="text-background font-bold text-base">L</span>
                </div>
                <span className="font-semibold text-base">LinkUp</span>
              </Link>
            )}
          </SidebarGroupLabel>
          
          <SidebarGroupContent>
            <SidebarMenu className="gap-0.5 px-2">
              {navItems.map((item) => (
                <SidebarMenuItem key={item.path}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.path}
                      end
                      className={({ isActive }) =>
                        `flex items-center gap-3 h-10 px-3 rounded-lg transition-all ${
                          isCollapsed ? 'justify-center' : ''
                        } ${
                          isActive
                            ? 'bg-muted text-foreground font-medium'
                            : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                        }`
                      }
                    >
                      <item.icon className="h-5 w-5 flex-shrink-0" />
                      {!isCollapsed && <span className="text-sm">{t(item.labelKey)}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}

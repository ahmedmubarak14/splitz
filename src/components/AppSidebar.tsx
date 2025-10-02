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
      className={`${isCollapsed ? 'w-14' : 'w-64'} border-r shadow-sm transition-all duration-300`}
      collapsible="icon"
    >
      <SidebarContent className="py-6">
        <SidebarGroup>
          <SidebarGroupLabel className="px-4 py-4 mb-2">
            {isCollapsed ? (
              <div className="flex items-center justify-center">
                <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
                  <span className="text-white font-bold text-sm">L</span>
                </div>
              </div>
            ) : (
              <Link to="/" className="flex items-center">
                <img src={logo} alt="LinkUp" className="h-7 w-auto cursor-pointer hover:opacity-80 transition-opacity" />
              </Link>
            )}
          </SidebarGroupLabel>
          
          <SidebarGroupContent>
            <SidebarMenu className="gap-1 px-2">
              {navItems.map((item) => (
                <SidebarMenuItem key={item.path}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.path}
                      end
                      className={({ isActive }) =>
                        isActive
                          ? 'bg-primary/10 text-primary font-semibold rounded-xl h-11 px-3 transition-all shadow-sm'
                          : 'hover:bg-muted rounded-xl h-11 px-3 transition-all text-muted-foreground hover:text-foreground'
                      }
                    >
                      <item.icon className="h-5 w-5" />
                      {!isCollapsed && <span className="text-sm font-medium">{t(item.labelKey)}</span>}
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

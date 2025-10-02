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
      className={isCollapsed ? 'w-14' : 'w-60'}
      collapsible="icon"
    >
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="px-4 py-6">
            {isCollapsed ? null : (
              <Link to="/">
                <img src={logo} alt="LinkUp" className="h-6 w-auto cursor-pointer hover:opacity-80 transition-opacity" />
              </Link>
            )}
          </SidebarGroupLabel>
          
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.path}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.path}
                      end
                      className={({ isActive }) =>
                        isActive
                          ? 'bg-primary/10 text-primary font-semibold rounded-xl'
                          : 'hover:bg-muted/70 rounded-xl'
                      }
                    >
                      <item.icon className="h-5 w-5" />
                      {!isCollapsed && <span>{t(item.labelKey)}</span>}
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

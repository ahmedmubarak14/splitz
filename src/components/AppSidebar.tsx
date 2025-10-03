import { NavLink, useLocation, Link } from 'react-router-dom';
import { Home, Target, DollarSign, Trophy, User, HelpCircle, Settings, Users } from 'lucide-react';
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

const overview = [
  { path: '/dashboard', icon: Home, labelKey: 'nav.dashboard' },
  { path: '/habits', icon: Target, labelKey: 'nav.habits' },
];

const workspace = [
  { path: '/expenses', icon: DollarSign, labelKey: 'nav.expenses' },
  { path: '/challenges', icon: Trophy, labelKey: 'nav.challenges' },
];

const secondary = [
  { path: '/profile', icon: User, labelKey: 'nav.profile' },
  { path: '/profile', icon: Settings, labelKey: 'Settings' },
  { path: '/profile', icon: HelpCircle, labelKey: 'Help' },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const { t } = useTranslation();

  const isCollapsed = state === 'collapsed';

  const isActive = (path: string) => location.pathname === path;
  const pillCls = (active: boolean) =>
    `${active ? 'bg-foreground text-background' : 'bg-muted/40 text-foreground hover:bg-muted'} ` +
    'h-11 w-11 rounded-2xl border border-border/30 flex items-center justify-center transition-colors';
  const itemCls = (active: boolean) =>
    `${active ? 'bg-foreground text-background' : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'} ` +
    'flex items-center gap-3 h-11 px-3 rounded-xl transition-colors`';

  return (
    <Sidebar
      className={`${isCollapsed ? 'w-18' : 'w-80'} bg-background border-r border-border/20 transition-[width] duration-300`}
      collapsible="icon"
    >
      <SidebarContent className="py-4">
        <SidebarGroup>
          <div className={`${isCollapsed ? 'px-0' : 'px-5'} mb-4 flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
            {isCollapsed ? (
              <div className="relative">
                <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-sm font-semibold">S</div>
                <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-green-500 ring-2 ring-background" />
              </div>
            ) : (
              <Link to="/" className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-foreground text-background flex items-center justify-center font-bold">L</div>
                <div className="flex flex-col leading-tight">
                  <span className="text-sm text-muted-foreground">Welcome</span>
                  <span className="text-base font-semibold tracking-tight">LinkUp</span>
                </div>
              </Link>
            )}
          </div>

          {isCollapsed ? (
            <div className="px-2 flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                {[...overview, ...workspace].map((item) => (
                  <NavLink key={item.path} to={item.path} end className={pillCls(isActive(item.path))}>
                    <item.icon className="h-5 w-5" />
                  </NavLink>
                ))}
              </div>
              <div className="flex flex-col gap-2">
                {[Users, User, Settings, HelpCircle].map((Icon, idx) => (
                  <button key={idx} className="h-11 w-11 rounded-2xl bg-muted/30 border border-border/30 flex items-center justify-center text-foreground/80">
                    <Icon className="h-5 w-5" />
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <SidebarGroupContent>
              <div className="px-4 space-y-4">
                <section className="bg-muted/30 border border-border/30 rounded-2xl p-2">
                  <h4 className="px-2 py-2 text-xs font-medium text-muted-foreground">{t('Overview') || 'Overview'}</h4>
                  <SidebarMenu className="gap-1">
                    {overview.map((item) => (
                      <SidebarMenuItem key={item.path}>
                        <SidebarMenuButton asChild>
                          <NavLink to={item.path} end className={itemCls(isActive(item.path))}>
                            <item.icon className="h-5 w-5" />
                            <span className="text-sm font-medium">{t(item.labelKey)}</span>
                          </NavLink>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </section>

                <section className="bg-muted/30 border border-border/30 rounded-2xl p-2">
                  <h4 className="px-2 py-2 text-xs font-medium text-muted-foreground">{t('Workspace') || 'Workspace'}</h4>
                  <SidebarMenu className="gap-1">
                    {workspace.map((item) => (
                      <SidebarMenuItem key={item.path}>
                        <SidebarMenuButton asChild>
                          <NavLink to={item.path} end className={itemCls(isActive(item.path))}>
                            <item.icon className="h-5 w-5" />
                            <span className="text-sm font-medium">{t(item.labelKey)}</span>
                          </NavLink>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </section>

                <section className="space-y-2">
                  {['Network', 'Account & Support'].map((label, idx) => (
                    <button
                      key={idx}
                      className="w-full flex items-center justify-between rounded-xl bg-card text-foreground border border-border/30 h-11 px-3 hover:bg-muted/50 transition-colors"
                    >
                      <span className="text-sm font-medium text-muted-foreground">{label}</span>
                      <span className="text-muted-foreground">▸</span>
                    </button>
                  ))}
                </section>

                <section className="pt-1">
                  <SidebarMenu className="gap-1">
                    {secondary.map((item) => (
                      <SidebarMenuItem key={item.path}>
                        <SidebarMenuButton asChild>
                          <NavLink to={item.path} end className="flex items-center gap-3 h-11 px-3 rounded-xl text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-colors">
                            <item.icon className="h-5 w-5" />
                            <span className="text-sm font-medium">{typeof item.labelKey === 'string' ? t(item.labelKey as any) : 'Profile'}</span>
                          </NavLink>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </section>
              </div>
            </SidebarGroupContent>
          )}
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}

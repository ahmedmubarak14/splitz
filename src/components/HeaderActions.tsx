import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Search, Sun, Moon, LogOut, User, Settings, Globe, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useTheme } from 'next-themes';
import { useTranslation } from 'react-i18next';
import NotificationBell from './NotificationBell';
import { useIsRTL } from '@/lib/rtl-utils';

export function HeaderActions() {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const { t, i18n } = useTranslation();
  const isRTL = useIsRTL();
  const [profile, setProfile] = useState<{ full_name: string | null; avatar_url: string | null } | null>(null);
  const [userEmail, setUserEmail] = useState<string>('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    // Set HTML dir attribute based on language
    document.documentElement.dir = i18n.language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = i18n.language;
  }, [i18n.language]);

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserEmail(user.email || '');
        const { data } = await supabase
          .from('profiles')
          .select('full_name, avatar_url')
          .eq('id', user.id)
          .single();
        
        if (data) {
          setProfile(data);
        }
      }
    };

    fetchProfile();
  }, []);

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error(t('errors.failedToSignOut'));
    } else {
      navigate('/auth');
      toast.success(t('success.signedOut'));
    }
  };

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'ar' : 'en';
    i18n.changeLanguage(newLang);
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const getInitials = (name: string | null) => {
    if (!name) return 'U';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <div className="flex items-center gap-1.5">
      {/* Search */}
      <Sheet open={searchOpen} onOpenChange={setSearchOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="rounded-lg h-9 w-9">
            <Search className="h-[18px] w-[18px]" />
            <span className="sr-only">{t('search.label')}</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="top" className="h-[200px]">
          <SheetHeader>
            <SheetTitle>{t('search.title')}</SheetTitle>
            <SheetDescription>
              {t('search.description')}
            </SheetDescription>
          </SheetHeader>
          <div className="mt-4">
            <Input
              placeholder={t('search.placeholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full"
            />
          </div>
        </SheetContent>
      </Sheet>

      {/* Notifications */}
      <NotificationBell />

      {/* Language Toggle */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="rounded-lg h-9 w-9">
            <Globe className="h-[18px] w-[18px]" />
            <span className="sr-only">{t('header.changeLanguage')}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align={isRTL ? 'start' : 'end'}>
          <DropdownMenuLabel>{t('header.language')}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => i18n.changeLanguage('en')}>
            {i18n.language === 'en' && <Check className={isRTL ? 'ml-2 h-4 w-4' : 'mr-2 h-4 w-4'} />}
            <span className={i18n.language !== 'en' ? (isRTL ? 'mr-6' : 'ml-6') : ''}>English</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => i18n.changeLanguage('ar')}>
            {i18n.language === 'ar' && <Check className={isRTL ? 'ml-2 h-4 w-4' : 'mr-2 h-4 w-4'} />}
            <span className={i18n.language !== 'ar' ? (isRTL ? 'mr-6' : 'ml-6') : ''}>العربية</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Theme Toggle */}
      <Button 
        variant="ghost" 
        size="icon" 
        className="rounded-lg h-9 w-9"
        onClick={toggleTheme}
      >
        {theme === 'dark' ? (
          <Sun className="h-[18px] w-[18px]" />
        ) : (
          <Moon className="h-[18px] w-[18px]" />
        )}
        <span className="sr-only">{t('header.toggleTheme')}</span>
      </Button>

      {/* User Menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className={`h-9 w-9 rounded-full p-0 ${isRTL ? 'mr-1' : 'ml-1'}`}>
            {profile?.avatar_url ? (
              <img 
                src={profile.avatar_url} 
                alt={profile.full_name || 'User'} 
                className="h-8 w-8 rounded-full object-cover"
              />
            ) : (
              <div className="h-8 w-8 rounded-full bg-foreground text-background flex items-center justify-center text-xs font-semibold">
                {getInitials(profile?.full_name || null)}
              </div>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align={isRTL ? 'start' : 'end'} className="w-56">
          <DropdownMenuLabel>
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{profile?.full_name || 'User'}</p>
              <p className="text-xs leading-none text-muted-foreground">{userEmail}</p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => navigate('/profile')}>
            <User className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
            {t('header.profile')}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => navigate('/profile?tab=notifications')}>
            <Settings className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
            {t('header.notificationSettings')}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
            <LogOut className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
            {t('header.signOut')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

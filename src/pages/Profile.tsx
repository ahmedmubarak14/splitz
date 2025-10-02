import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { LogOut, User as UserIcon, Mail, Calendar, Globe, Image as ImageIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Navigation from '@/components/Navigation';
import LanguageToggle from '@/components/LanguageToggle';
import type { Tables, TablesUpdate } from '@/integrations/supabase/types';
import type { User } from '@supabase/supabase-js';

const Profile = () => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Tables<'profiles'> | null>(null);
  const [fullName, setFullName] = useState<string>('');
  const [preferredLanguage, setPreferredLanguage] = useState<string>('en');
  const [saving, setSaving] = useState<boolean>(false);
  const [uploading, setUploading] = useState<boolean>(false);
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  const fetchUser = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate('/auth');
      return;
    }
    setUser(user);

    const { data: profileData, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle<Tables<'profiles'>>();

    if (error) {
      console.warn('Profile fetch error:', error);
    }

    if (profileData) {
      setProfile(profileData);
      setFullName(profileData.full_name ?? '');
      setPreferredLanguage(profileData.preferred_language ?? i18n.language ?? 'en');
    } else {
      const metaName = (user.user_metadata as Record<string, unknown> | null)?.full_name;
      setFullName(typeof metaName === 'string' ? metaName : '');
      setPreferredLanguage(i18n.language ?? 'en');
    }
  }, [i18n.language, navigate]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const saveProfile = async () => {
    if (!user) return;
    try {
      setSaving(true);
      const update: TablesUpdate<'profiles'> = {
        full_name: fullName,
        preferred_language: preferredLanguage,
      };
      const { error } = await supabase
        .from('profiles')
        .update(update)
        .eq('id', user.id);

      if (error) throw error;

      toast.success('Profile updated');
      setProfile((prev) => prev ? { ...prev, ...update } as Tables<'profiles'> : prev);

      if (preferredLanguage && preferredLanguage !== i18n.language) {
        await i18n.changeLanguage(preferredLanguage);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update profile';
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const uploadAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user) return;
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploading(true);
      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}/${crypto.randomUUID()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { cacheControl: '3600', upsert: false });
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl } as TablesUpdate<'profiles'>)
        .eq('id', user.id);
      if (updateError) throw updateError;

      setProfile((prev) => prev ? ({ ...prev, avatar_url: publicUrl }) as Tables<'profiles'> : prev);
      toast.success('Avatar updated');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to upload avatar';
      toast.error(message);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success('Logged out successfully');
    navigate('/auth');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(i18n.language, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background pb-24 md:pb-8">
      <LanguageToggle />
      
      <div className="max-w-4xl mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-2xl gradient-primary flex items-center justify-center shadow-primary animate-pulse-glow">
              <UserIcon className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-5xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                {t('nav.profile')}
              </h1>
              <p className="text-muted-foreground mt-1">
                Manage your account settings
              </p>
            </div>
          </div>
        </div>

        {/* Profile Card */}
        <Card className="shadow-card border-2 card-hover overflow-hidden">
          <div className="h-32 gradient-primary"></div>
          <CardHeader className="-mt-16 relative">
            <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6">
              <div className="w-28 h-28 rounded-3xl overflow-hidden shadow-secondary ring-4 ring-background flex items-center justify-center bg-gradient-to-br from-secondary/60 to-secondary">
                {profile?.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-white text-5xl font-bold">
                    {profile?.full_name?.[0] || user?.email?.[0]?.toUpperCase()}
                  </div>
                )}
              </div>
              <div className="text-center sm:text-left flex-1">
                <CardTitle className="text-3xl font-bold mb-2">
                  {profile?.full_name || fullName || 'User'}
                </CardTitle>
                <p className="text-muted-foreground flex items-center gap-2 justify-center sm:justify-start">
                  <Mail className="w-4 h-4" />
                  {user?.email}
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-5 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 border-2 border-primary/20">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-primary">
                    <Calendar className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-sm font-medium text-muted-foreground">Member Since</span>
                </div>
                <p className="text-lg font-bold">
                  {user?.created_at ? formatDate(user.created_at) : 'N/A'}
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-gradient-to-br from-secondary/10 to-secondary/5 border-2 border-secondary/20">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl gradient-secondary flex items-center justify-center shadow-secondary">
                    <Globe className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-sm font-medium text-muted-foreground">Language</span>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={preferredLanguage}
                    onChange={(e) => setPreferredLanguage(e.target.value)}
                    className="px-3 py-2 rounded-xl border bg-background"
                  >
                    <option value="en">English</option>
                    <option value="ar">العربية</option>
                  </select>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-gradient-to-br from-accent/10 to-accent/5 border-2 border-accent/20">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl gradient-accent flex items-center justify-center">
                    <UserIcon className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-sm font-medium text-muted-foreground">Account Type</span>
                </div>
                <p className="text-lg font-bold">Free Plan</p>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-4 space-y-3">
              <div className="flex items-center gap-3">
                <label className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border cursor-pointer bg-background">
                  <ImageIcon className="w-4 h-4" />
                  <span>{uploading ? 'Uploading…' : 'Upload Avatar'}</span>
                  <input type="file" accept="image/*" onChange={uploadAvatar} className="hidden" />
                </label>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="text-sm font-medium text-muted-foreground mb-2 block">Full Name</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border bg-background"
                    placeholder="Your name"
                  />
                </div>
                <div className="flex items-end">
                  <Button onClick={saveProfile} disabled={saving} className="w-full">
                    {saving ? 'Saving…' : 'Save'}
                  </Button>
                </div>
              </div>
              <Button
                onClick={handleLogout}
                variant="destructive"
                size="lg"
                className="w-full text-base"
              >
                <LogOut className="w-5 h-5 mr-2" />
                Logout
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Additional Info Card */}
        <Card className="shadow-card border-2">
          <CardHeader>
            <CardTitle className="text-xl">About LinkUp</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-muted-foreground">
            <p>
              🎯 Track your habits and build consistent streaks
            </p>
            <p>
              💰 Split expenses fairly with friends and groups
            </p>
            <p>
              🏆 Compete in challenges and climb the leaderboards
            </p>
            <p className="pt-4 text-sm font-medium">
              Version 1.0 • Made with ❤️ for Gen Z
            </p>
          </CardContent>
        </Card>
      </div>

      <Navigation />
    </div>
  );
};

export default Profile;

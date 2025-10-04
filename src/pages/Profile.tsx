import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { LogOut, Mail, Calendar, Globe, Image as ImageIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Navigation from '@/components/Navigation';
import NotificationPreferences from '@/components/NotificationPreferences';
import type { Tables, TablesUpdate } from '@/integrations/supabase/types';
import type { User } from '@supabase/supabase-js';

const Profile = () => {
  const [searchParams] = useSearchParams();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Tables<'profiles'> | null>(null);
  const [fullName, setFullName] = useState<string>('');
  const [preferredLanguage, setPreferredLanguage] = useState<string>('en');
  const [saving, setSaving] = useState<boolean>(false);
  const [uploading, setUploading] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'profile');
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

    if (error) console.warn('Profile fetch error:', error);

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
        .upsert({ id: user.id, ...update }, { onConflict: 'id' });

      if (error) throw error;

      toast.success('Profile updated');
      setProfile((prev) => prev ? { ...prev, ...update } as Tables<'profiles'> : prev);

      if (preferredLanguage && preferredLanguage !== i18n.language) {
        await i18n.changeLanguage(preferredLanguage);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update profile');
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
        .upsert({ id: user.id, avatar_url: publicUrl }, { onConflict: 'id' });
      if (updateError) throw updateError;

      setProfile((prev) => prev ? ({ ...prev, avatar_url: publicUrl }) as Tables<'profiles'> : prev);
      toast.success('Avatar updated');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to upload avatar');
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
    <div className="min-h-screen bg-background pb-24 md:pb-8">
      
      <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-4 md:space-y-6">
        {/* Header */}
        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-semibold text-foreground">
            {t('nav.profile')}
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage your account settings
          </p>
        </div>

        {/* Profile Card */}
        <Card className="border border-border">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-full overflow-hidden bg-accent flex items-center justify-center">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-foreground text-3xl font-semibold">
                    {profile?.full_name?.[0] || user?.email?.[0]?.toUpperCase()}
                  </div>
                )}
              </div>
              <div className="flex-1">
                <CardTitle className="text-xl font-semibold">
                  {profile?.full_name || fullName || 'User'}
                </CardTitle>
                <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                  <Mail className="w-4 h-4" />
                  {user?.email}
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-accent border border-border">
                <div className="flex items-center gap-2 mb-1">
                  <Calendar className="w-4 h-4 text-primary" />
                  <span className="text-xs font-medium text-muted-foreground">Member Since</span>
                </div>
                <p className="text-sm font-semibold">
                  {user?.created_at ? formatDate(user.created_at) : 'N/A'}
                </p>
              </div>

              <div className="p-4 rounded-lg bg-accent border border-border">
                <div className="flex items-center gap-2 mb-2">
                  <Globe className="w-4 h-4 text-primary" />
                  <span className="text-xs font-medium text-muted-foreground">Language</span>
                </div>
                <Select value={preferredLanguage} onValueChange={setPreferredLanguage}>
                  <SelectTrigger className="h-8 text-sm font-semibold border-none bg-transparent p-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="ar">العربية</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Form */}
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium mb-2 block">Profile Picture</Label>
                <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-border cursor-pointer hover:bg-accent transition-colors">
                  <ImageIcon className="w-4 h-4" />
                  <span className="text-sm font-medium">
                    {uploading ? (
                      <span className="flex items-center gap-2">
                        <div className="h-3 w-3 border-2 border-foreground border-t-transparent rounded-full animate-spin" />
                        Uploading...
                      </span>
                    ) : (
                      'Choose Avatar'
                    )}
                  </span>
                  <input type="file" accept="image/*" onChange={uploadAvatar} className="hidden" disabled={uploading} />
                </label>
              </div>
              
              <div>
                <Label className="text-sm font-medium mb-2 block">Full Name</Label>
                <Input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Your name"
                />
              </div>

              <Button onClick={saveProfile} disabled={saving} className="w-full">
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>

              <Button
                onClick={handleLogout}
                variant="destructive"
                className="w-full"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="border border-border">
          <CardHeader>
            <CardTitle className="text-base font-semibold">About LinkUp</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>🎯 Track your habits and build consistent streaks</p>
            <p>💰 Split expenses fairly with friends and groups</p>
            <p>🏆 Compete in challenges and climb the leaderboards</p>
            <p className="pt-3 text-xs font-medium">Version 1.0</p>
          </CardContent>
        </Card>
      </div>

      <Navigation />
    </div>
  );
};

export default Profile;

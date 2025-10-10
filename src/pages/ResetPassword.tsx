import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PasswordInput } from '@/components/PasswordInput';
import { toast } from 'sonner';
import { KeyRound, ArrowLeft } from 'lucide-react';
import splitzLogo from '@/assets/splitz-logo.png';
import { useTranslation } from 'react-i18next';
import * as Sentry from "@sentry/react";

const ResetPassword = () => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isValidSession, setIsValidSession] = useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    // Check if user accessed this page via password reset link
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setIsValidSession(true);
      } else {
        toast.error(t('resetPassword.invalidResetLink'));
        navigate('/auth');
      }
    });
  }, [navigate, t]);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newPassword || !confirmPassword) {
      toast.error(t('resetPassword.fillAllFields'));
      return;
    }

    if (newPassword.length < 6) {
      toast.error(t('resetPassword.passwordMinLength'));
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error(t('resetPassword.passwordsDoNotMatch'));
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      toast.success(t('resetPassword.passwordUpdated'));
      navigate('/dashboard');
    } catch (error: any) {
      toast.error(error.message || 'Failed to reset password');
      
      if (import.meta.env.PROD) {
        Sentry.captureException(error, {
          tags: { feature: 'auth', action: 'reset-password' }
        });
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isValidSession) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="space-y-4">
          <div className="flex justify-center">
            <img src={splitzLogo} alt="Splitz" className="h-12" loading="eager" />
          </div>
          <div className="space-y-2 text-center">
            <CardTitle className="text-2xl font-bold flex items-center justify-center gap-2">
              <KeyRound className="h-6 w-6" />
              {t('resetPassword.title')}
            </CardTitle>
            <CardDescription>
              {t('resetPassword.subtitle')}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('resetPassword.newPassword')}</label>
              <PasswordInput
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder={t('resetPassword.newPasswordPlaceholder')}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">{t('resetPassword.confirmPassword')}</label>
              <PasswordInput
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder={t('resetPassword.confirmPasswordPlaceholder')}
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? t('resetPassword.resetting') : t('resetPassword.resetPasswordBtn')}
            </Button>

            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onClick={() => navigate('/auth')}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t('resetPassword.backToLogin')}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResetPassword;

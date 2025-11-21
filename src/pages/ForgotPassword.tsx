import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import splitzLogo from '@/assets/splitz-logo.png';
import { useTranslation } from 'react-i18next';
import * as Sentry from "@sentry/react";

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleSendResetLink = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      toast.error(t('forgotPassword.enterEmail'));
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      setEmailSent(true);
      toast.success(t('forgotPassword.resetLinkSent'));
    } catch (error: any) {
      toast.error(error.message || 'Failed to send reset link');
      
      if (import.meta.env.PROD) {
        Sentry.captureException(error, {
          tags: { feature: 'auth', action: 'forgot-password' },
          extra: { email }
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="space-y-4">
          <div className="flex justify-center">
            <img 
              src={splitzLogo} 
              alt="Splitz" 
              width={48}
              height={48}
              className="h-12" 
              loading="eager"
              decoding="async"
            />
          </div>
          <div className="space-y-2 text-center">
            <CardTitle className="text-2xl font-bold flex items-center justify-center gap-2">
              <Mail className="h-6 w-6" />
              {t('forgotPassword.title')}
            </CardTitle>
            <CardDescription>
              {emailSent 
                ? t('forgotPassword.successSubtitle')
                : t('forgotPassword.subtitle')
              }
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {emailSent ? (
            <div className="space-y-4">
              <div className="flex flex-col items-center gap-4 py-6">
                <CheckCircle className="h-16 w-16 text-green-500" />
                <p className="text-center text-muted-foreground">
                  {t('forgotPassword.emailSentTo')} <strong>{email}</strong>
                </p>
                <p className="text-sm text-center text-muted-foreground">
                  {t('forgotPassword.checkEmail')}
                </p>
              </div>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => navigate('/auth')}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                {t('forgotPassword.backToLogin')}
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSendResetLink} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">{t('forgotPassword.emailAddress')}</label>
                <Input
                  type="email"
                  placeholder={t('forgotPassword.emailPlaceholder')}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? t('forgotPassword.sending') : t('forgotPassword.sendResetLink')}
              </Button>

              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => navigate('/auth')}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                {t('forgotPassword.backToLogin')}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ForgotPassword;

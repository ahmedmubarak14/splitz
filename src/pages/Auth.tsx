import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import splitzLogo from '@/assets/splitz-logo.png';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { PasswordInput } from '@/components/PasswordInput';
import { toast } from 'sonner';
import { Mail, User, ArrowRight, Sparkles, Shield } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useIsRTL } from '@/lib/rtl-utils';
import { responsiveText, responsiveSpacing } from '@/lib/responsive-utils';

// Google logo SVG component
const GoogleLogo = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation();
  const isRTL = useIsRTL();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate('/dashboard');
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        navigate('/dashboard');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim() || !password.trim()) {
      toast.error(t('errors.fillAllFields'));
      return;
    }

    if (!isLogin && !fullName.trim()) {
      toast.error(t('errors.enterFullName'));
      return;
    }

    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) throw error;
        toast.success(t('success.welcomeBack'));
      } else {
        const { error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: { full_name: fullName.trim() },
            emailRedirectTo: `${window.location.origin}/`,
          },
        });
        if (error) throw error;
        toast.success(t('success.accountCreated'));
      }
    } catch (error: any) {
      const message = error.message?.toLowerCase() || '';
      if (message.includes('invalid login credentials')) {
        toast.error(t('errors.invalidEmail'));
      } else if (message.includes('user already registered')) {
        toast.error(t('errors.emailAlreadyRegistered'));
      } else if (message.includes('email')) {
        toast.error(t('errors.validEmailRequired'));
      } else if (message.includes('password')) {
        toast.error(t('errors.passwordLength'));
      } else {
        toast.error(error.message || t('errors.genericError'));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
      });
      
      if (error) throw error;
      
      // Success toast will be shown after redirect by onAuthStateChange
    } catch (error: any) {
      console.error('Google OAuth error:', error);
      toast.error(error.message || t('errors.googleAuthFailed') || 'Failed to sign in with Google');
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Left Side - Auth Form */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-8 bg-background">
        <div className={`w-full max-w-md ${responsiveSpacing.sectionGap}`}>
          {/* Logo */}
          <Link to="/" className="flex justify-center">
            <img
              src={splitzLogo}
              alt="Splitz"
              className="h-12 md:h-14 w-auto hover:opacity-80 transition-opacity"
            />
          </Link>

          {/* Welcome Text */}
          <div className="text-center space-y-2">
            <h1 className={`${responsiveText.sectionTitle} font-bold text-foreground`}>
              {isLogin ? t('auth.welcomeBack') : t('auth.createAccount')}
            </h1>
            <p className={`${responsiveText.body} text-muted-foreground`}>
              {isLogin 
                ? t('auth.signInSubtitle')
                : t('auth.signUpSubtitle')}
            </p>
          </div>

          {/* Auth Card */}
          <Card className="p-8 shadow-lg border-2">
            {/* Google Sign In Button */}
            <div className="space-y-4 mb-6">
              <Button
                type="button"
                variant="outline"
                onClick={handleGoogleSignIn}
                disabled={googleLoading || loading}
                className="w-full h-12 text-base font-medium border-2 hover:bg-accent/50 transition-colors"
              >
                {googleLoading ? (
                  <span className="flex items-center gap-3">
                    <div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    <span>Connecting...</span>
                  </span>
                ) : (
                  <span className="flex items-center gap-3">
                    <GoogleLogo />
                    <span>Continue with Google</span>
                  </span>
                )}
              </Button>

              <div className="relative">
                <Separator />
                <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-3 text-xs text-muted-foreground">
                  or continue with email
                </span>
              </div>
            </div>

            <form onSubmit={handleAuth} className="space-y-5">
              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="fullName" className={`text-sm font-medium ${isRTL ? 'text-right' : 'text-left'}`}>
                    {t('auth.fullName')}
                  </Label>
                  <div className="relative">
                    <User className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground`} />
                    <Input
                      id="fullName"
                      type="text"
                      placeholder="John Doe"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required={!isLogin}
                      className={`h-12 ${isRTL ? 'pr-10' : 'pl-10'} text-base`}
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className={`text-sm font-medium ${isRTL ? 'text-right' : 'text-left'}`}>
                  {t('auth.email')}
                </Label>
                <div className="relative">
                  <Mail className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground`} />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className={`h-12 ${isRTL ? 'pr-10' : 'pl-10'} text-base`}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className={`text-sm font-medium ${isRTL ? 'text-right' : 'text-left'}`}>
                    {t('auth.password')}
                  </Label>
                  {isLogin && (
                    <Link 
                      to="/forgot-password" 
                      className="text-xs text-primary hover:underline"
                    >
                      {t('forgotPassword.forgotPasswordLink')}
                    </Link>
                  )}
                </div>
                <PasswordInput
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="h-12 text-base"
                />
                {!isLogin && (
                  <p className={`text-xs text-muted-foreground ${isRTL ? 'text-right' : 'text-left'}`}>
                    {t('auth.passwordRequirement')}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 text-base font-semibold group"
                size="lg"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <div className="h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                    {t('auth.loading')}
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    {isLogin ? t('auth.signIn') : t('auth.createAccountBtn')}
                    <ArrowRight className={`h-4 w-4 group-hover:${isRTL ? '-translate-x-1' : 'translate-x-1'} transition-transform ${isRTL ? 'rotate-180' : ''}`} />
                  </span>
                )}
              </Button>
            </form>

            <div className="mt-6">
              <Separator className="my-6" />
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-2">
                  {isLogin ? t('auth.noAccount') : t('auth.haveAccount')}
                </p>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsLogin(!isLogin);
                    setEmail('');
                    setPassword('');
                    setFullName('');
                  }}
                  className="w-full h-11 font-medium"
                >
                  {isLogin ? t('auth.createAccountLink') : t('auth.signInLink')}
                </Button>
              </div>
            </div>
          </Card>

          {/* Security Badge */}
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Shield className="h-4 w-4" />
            <span>{t('auth.securityBadge')}</span>
          </div>
        </div>
      </div>

      {/* Right Side - Feature Showcase (hidden on mobile & tablet) */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-primary/10 via-primary/5 to-background p-12 items-center justify-center relative overflow-hidden">
        {/* Decorative gradients */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,hsl(var(--primary)/0.15),transparent_70%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,hsl(var(--primary)/0.1),transparent_70%)]"></div>
        
        <div className="relative z-10 max-w-lg space-y-8">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <h2 className="text-3xl font-bold text-foreground">
              {t('auth.showcase.title')}
            </h2>
          </div>

          <div className="space-y-6">
            <FeatureItem 
              emoji="🔥"
              title={t('auth.showcase.trackHabits')}
              description={t('auth.showcase.trackHabitsDesc')}
            />
            <FeatureItem 
              emoji="🏆"
              title={t('auth.showcase.joinChallenges')}
              description={t('auth.showcase.joinChallengesDesc')}
            />
            <FeatureItem 
              emoji="💰"
              title={t('auth.showcase.splitExpenses')}
              description={t('auth.showcase.splitExpensesDesc')}
            />
          </div>

          <div className="pt-8 border-t border-border">
            <p className="text-sm text-muted-foreground italic">
              {t('auth.showcase.testimonial')}
            </p>
            <p className="text-sm font-medium text-foreground mt-2">{t('auth.showcase.testimonialAuthor')}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const FeatureItem = ({ emoji, title, description }: { emoji: string; title: string; description: string }) => (
  <div className="flex gap-4 items-start group">
    <div className="text-4xl flex-shrink-0 group-hover:scale-110 transition-transform">
      {emoji}
    </div>
    <div>
      <h3 className="font-semibold text-lg text-foreground mb-1">{title}</h3>
      <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
    </div>
  </div>
);

export default Auth;

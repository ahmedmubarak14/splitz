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

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
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
      toast.error('Please fill in all fields');
      return;
    }

    if (!isLogin && !fullName.trim()) {
      toast.error('Please enter your full name');
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
        toast.success('Welcome back! 🎉');
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
        toast.success('Account created! Welcome to Splitz! 🚀');
      }
    } catch (error: any) {
      const message = error.message?.toLowerCase() || '';
      if (message.includes('invalid login credentials')) {
        toast.error('Invalid email or password');
      } else if (message.includes('user already registered')) {
        toast.error('This email is already registered. Please login instead.');
      } else if (message.includes('email')) {
        toast.error('Please enter a valid email address');
      } else if (message.includes('password')) {
        toast.error('Password must be at least 6 characters');
      } else {
        toast.error(error.message || 'An error occurred');
      }
    } finally {
      setLoading(false);
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
                <Label htmlFor="password" className={`text-sm font-medium ${isRTL ? 'text-right' : 'text-left'}`}>
                  {t('auth.password')}
                </Label>
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

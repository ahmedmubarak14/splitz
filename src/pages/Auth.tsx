import { useState, useEffect, useMemo } from 'react';
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
import { Mail, User, ArrowRight, Sparkles, Shield, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import { usePasswordStrength } from '@/hooks/usePasswordStrength';
import { useTranslation } from 'react-i18next';
import { useIsRTL } from '@/lib/rtl-utils';
import { responsiveText, responsiveSpacing } from '@/lib/responsive-utils';
import * as Sentry from "@sentry/react";

// Debounce utility
const debounce = <T extends (...args: any[]) => any>(func: T, wait: number) => {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [emailOrUsername, setEmailOrUsername] = useState(''); // For login
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState(''); // For signup
  const [loading, setLoading] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [showResendVerification, setShowResendVerification] = useState(false);
  const [resendEmail, setResendEmail] = useState('');
  const navigate = useNavigate();
  const { t } = useTranslation();
  const isRTL = useIsRTL();
  const passwordStrength = usePasswordStrength(password);

  // Debounced username availability checker
  const checkUsernameAvailability = useMemo(
    () =>
      debounce(async (value: string) => {
        if (!value || value.length < 3) {
          setUsernameAvailable(null);
          return;
        }
        
        setCheckingUsername(true);
        const { data, error } = await supabase.rpc('is_username_available', {
          username_to_check: value.toLowerCase()
        });
        
        setCheckingUsername(false);
        setUsernameAvailable(data === true);
      }, 500),
    []
  );

  const handleResendVerification = async () => {
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: resendEmail,
      });
      
      if (error) throw error;
      
      toast.success(t('auth.verificationEmailSent') || 'Verification email sent!', {
        description: t('auth.checkInboxAndSpam') || 'Check your inbox and spam folder.',
      });
    } catch (error: any) {
      toast.error(t('errors.failedToResendEmail') || 'Failed to resend email', {
        description: error.message,
      });
    }
  };

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
    
    if (isLogin && (!emailOrUsername.trim() || !password.trim())) {
      toast.error(t('errors.fillAllFields') || 'Please fill all fields');
      return;
    }

    if (!isLogin && (!email.trim() || !password.trim() || !fullName.trim())) {
      toast.error(t('errors.fillAllFields') || 'Please fill all fields');
      return;
    }

    setLoading(true);

    try {
      if (isLogin) {
        let loginEmail = emailOrUsername.trim();
        
        // Check if input is username (no @ symbol)
        if (!emailOrUsername.includes('@')) {
          // Fetch email from username
          const { data: fetchedEmail, error: usernameError } = await supabase.rpc('get_email_by_username', {
            username_input: emailOrUsername.trim()
          });
          
          if (usernameError || !fetchedEmail) {
            toast.error(t('errors.usernameNotFound') || 'Username not found. Please check and try again.');
            setLoading(false);
            return;
          }
          loginEmail = fetchedEmail;
        }
        
        const { error } = await supabase.auth.signInWithPassword({
          email: loginEmail,
          password,
        });
        
        if (error) throw error;
        toast.success(t('success.welcomeBack') || 'Welcome back!');
      } else {
        // Validate username for signup
        if (!username.trim()) {
          toast.error(t('errors.enterUsername') || 'Please enter a username');
          setLoading(false);
          return;
        }
        
        if (username.length < 3 || username.length > 20) {
          toast.error(t('errors.usernameLength') || 'Username must be 3-20 characters');
          setLoading(false);
          return;
        }
        
        if (!/^[a-z0-9_]+$/.test(username)) {
          toast.error(t('errors.usernameFormat') || 'Username can only contain lowercase letters, numbers, and underscores');
          setLoading(false);
          return;
        }
        
        if (!usernameAvailable) {
          toast.error(t('errors.usernameTaken') || 'This username is already taken');
          setLoading(false);
          return;
        }

        const { error, data } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: { 
              full_name: fullName.trim(),
              username: username.toLowerCase().trim()
            },
            emailRedirectTo: `${window.location.origin}/`,
          },
        });
        
        if (error) throw error;
        
        // Update profile with username (backup in case trigger doesn't handle it)
        if (data.user) {
          await supabase
            .from('profiles')
            .update({ username: username.toLowerCase().trim() })
            .eq('id', data.user.id);
        }

        toast.success(t('success.accountCreated') || 'Account created successfully! 🎉', {
          duration: 8000,
          description: t('success.checkEmailForVerification') || 'Check your email for a verification link. You can log in after verifying.',
        });
      }
    } catch (error: any) {
      const message = error.message?.toLowerCase() || '';
      
      // More specific password error detection
      if (message.includes('password is too weak') || 
          message.includes('insufficient entropy') ||
          message.includes('does not meet security requirements')) {
        toast.error(t('errors.passwordTooWeak') || 'Password is too weak');
      } else if (message.includes('password') && message.includes('least')) {
        toast.error(t('errors.passwordLength') || 'Password is too short');
      } else if (message.includes('invalid login credentials')) {
        toast.error(t('errors.invalidEmail') || 'Invalid credentials');
      } else if (message.includes('user already registered')) {
        toast.error(t('errors.emailAlreadyRegistered') || 'Email already registered');
      } else if (message.includes('email')) {
        toast.error(t('errors.validEmailRequired') || 'Invalid email');
      } else {
        toast.error(error.message || t('errors.genericError') || 'Something went wrong');
      }
      
      if (import.meta.env.PROD) {
        Sentry.captureException(error, {
          tags: { feature: 'auth', action: isLogin ? 'login' : 'signup' },
          extra: { email, isLogin }
        });
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
              width={48}
              height={48}
              loading="eager"
              decoding="async"
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
                <>
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

                  <div className="space-y-2">
                    <Label htmlFor="username" className={`text-sm font-medium ${isRTL ? 'text-right' : 'text-left'}`}>
                      {t('auth.username') || 'Username'}
                    </Label>
                    <div className="relative">
                      <User className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground`} />
                      <Input
                        id="username"
                        type="text"
                        placeholder="johndoe_123"
                        value={username}
                        onChange={(e) => {
                          const value = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '');
                          setUsername(value);
                          checkUsernameAvailability(value);
                        }}
                        required
                        className={`h-12 ${isRTL ? 'pr-10 pl-10' : 'pl-10 pr-10'} text-base`}
                      />
                      {checkingUsername && (
                        <div className={`absolute ${isRTL ? 'left-3' : 'right-3'} top-1/2 -translate-y-1/2`}>
                          <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                        </div>
                      )}
                      {username.length >= 3 && !checkingUsername && (
                        <div className={`absolute ${isRTL ? 'left-3' : 'right-3'} top-1/2 -translate-y-1/2`}>
                          {usernameAvailable ? (
                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                          ) : (
                            <XCircle className="h-5 w-5 text-red-600" />
                          )}
                        </div>
                      )}
                    </div>
                    {username && username.length >= 3 && !checkingUsername && (
                      <p className={`text-xs ${usernameAvailable ? 'text-green-600' : 'text-red-600'}`}>
                        {usernameAvailable ? (t('auth.usernameAvailable') || '✓ Username available') : (t('auth.usernameTaken') || '✗ Username already taken')}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {t('auth.usernameHint') || '3-20 characters: lowercase letters, numbers, and underscores'}
                    </p>
                  </div>
                </>
              )}

              {isLogin ? (
                <div className="space-y-2">
                  <Label htmlFor="emailOrUsername" className={`text-sm font-medium ${isRTL ? 'text-right' : 'text-left'}`}>
                    {t('auth.emailOrUsername') || 'Email or Username'}
                  </Label>
                  <div className="relative">
                    <Mail className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground`} />
                    <Input
                      id="emailOrUsername"
                      type="text"
                      placeholder={t('auth.emailOrUsernamePlaceholder') || 'you@example.com or username'}
                      value={emailOrUsername}
                      onChange={(e) => setEmailOrUsername(e.target.value)}
                      required
                      className={`h-12 ${isRTL ? 'pr-10' : 'pl-10'} text-base`}
                    />
                  </div>
                </div>
              ) : (
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
              )}

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
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (!isLogin && !passwordTouched) {
                      setPasswordTouched(true);
                    }
                  }}
                  placeholder="••••••••"
                  className="h-12 text-base"
                />
                {!isLogin && passwordTouched && (
                  <>
                    <div className="space-y-1.5 mt-2">
                      <PasswordRequirement 
                        met={password.length >= 8} 
                        text={t('auth.passwordLength')}
                        isRTL={isRTL}
                      />
                      <PasswordRequirement 
                        met={/[A-Z]/.test(password) && /[a-z]/.test(password)} 
                        text={t('auth.passwordMixedCase')}
                        isRTL={isRTL}
                      />
                      <PasswordRequirement 
                        met={/[0-9]/.test(password)} 
                        text={t('auth.passwordNumber')}
                        isRTL={isRTL}
                      />
                      <PasswordRequirement 
                        met={/[^A-Za-z0-9]/.test(password)} 
                        text={t('auth.passwordSymbol')}
                        isRTL={isRTL}
                      />
                    </div>

                    {/* Pattern Detection Warning */}
                    {password.length >= 8 && passwordStrength.hasPatterns && (
                      <div className={`mt-3 p-3 rounded-lg border-2 border-amber-500 bg-amber-50 dark:bg-amber-950/20 ${isRTL ? 'text-right' : 'text-left'}`}>
                        <div className={`flex items-start gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                          <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-500 flex-shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <p className="text-xs font-semibold text-amber-900 dark:text-amber-200 mb-1">
                              {t('auth.patternWarningTitle')}
                            </p>
                            {passwordStrength.warning && (
                              <p className="text-xs text-amber-800 dark:text-amber-300 mb-1">
                                ⚠️ {passwordStrength.warning}
                              </p>
                            )}
                            {passwordStrength.suggestions.length > 0 && (
                              <ul className={`text-xs text-amber-700 dark:text-amber-400 space-y-0.5 ${isRTL ? 'pr-4' : 'pl-4'} list-disc`}>
                                {passwordStrength.suggestions.map((suggestion, idx) => (
                                  <li key={idx}>{suggestion}</li>
                                ))}
                              </ul>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    <p className="text-xs text-muted-foreground mt-2">
                      {t('auth.passwordExample')}
                    </p>
                  </>
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

              {/* Resend Verification Link */}
              <div className="mt-4 text-center text-sm">
                <button
                  type="button"
                  onClick={() => setShowResendVerification(!showResendVerification)}
                  className="text-primary hover:underline"
                >
                  {t('auth.didntReceiveEmail') || "Didn't receive verification email?"}
                </button>
              </div>

              {showResendVerification && (
                <div className="mt-4 p-4 border rounded-lg bg-muted/50">
                  <Label htmlFor="resendEmail" className="text-sm font-medium">
                    {t('auth.emailAddress') || 'Email Address'}
                  </Label>
                  <div className="flex gap-2 mt-2">
                    <Input
                      id="resendEmail"
                      type="email"
                      value={resendEmail}
                      onChange={(e) => setResendEmail(e.target.value)}
                      placeholder={t('auth.emailPlaceholder') || 'your@email.com'}
                      className="flex-1"
                    />
                    <Button onClick={handleResendVerification} variant="secondary">
                      {t('auth.resendVerification') || 'Resend'}
                    </Button>
                  </div>
                </div>
              )}
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
                    setEmailOrUsername('');
                    setPassword('');
                    setFullName('');
                    setUsername('');
                    setPasswordTouched(false);
                    setUsernameAvailable(null);
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
              emoji="🎯"
              title={t('auth.showcase.productivity')}
              description={t('auth.showcase.productivityDesc')}
            />
            <FeatureItem 
              emoji="🔥"
              title={t('auth.showcase.habits')}
              description={t('auth.showcase.habitsDesc')}
            />
            <FeatureItem 
              emoji="💰"
              title={t('auth.showcase.financial')}
              description={t('auth.showcase.financialDesc')}
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

const PasswordRequirement = ({ met, text, isRTL }: { met: boolean; text: string; isRTL: boolean }) => (
  <p className={`text-xs flex items-center gap-1.5 ${isRTL ? 'flex-row-reverse' : ''} ${
    met ? 'text-green-600' : 'text-muted-foreground'
  }`}>
    <span className="font-semibold text-sm">{met ? '✓' : '○'}</span>
    <span>{text}</span>
  </p>
);

export default Auth;

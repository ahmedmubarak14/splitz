import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import splitzLogo from '@/assets/splitz-logo.png';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Mail, Lock, User, ArrowRight, Sparkles, Shield } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation();

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
    <div className="min-h-screen flex">
      {/* Left Side - Auth Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md space-y-8">
          {/* Logo */}
          <Link to="/" className="flex justify-center">
            <img
              src={splitzLogo}
              alt="Splitz"
              className="h-14 w-auto hover:opacity-80 transition-opacity"
            />
          </Link>

          {/* Welcome Text */}
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold text-foreground">
              {isLogin ? 'Welcome back' : 'Create your account'}
            </h1>
            <p className="text-muted-foreground">
              {isLogin 
                ? 'Sign in to continue to Splitz' 
                : 'Start tracking habits, challenges & expenses'}
            </p>
          </div>

          {/* Auth Card */}
          <Card className="p-8 shadow-lg border-2">
            <form onSubmit={handleAuth} className="space-y-5">
              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="text-sm font-medium">
                    Full Name
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="fullName"
                      type="text"
                      placeholder="John Doe"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required={!isLogin}
                      className="h-12 pl-10 text-base"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-12 pl-10 text-base"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="h-12 pl-10 text-base"
                  />
                </div>
                {!isLogin && (
                  <p className="text-xs text-muted-foreground">
                    Must be at least 6 characters
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
                    {t('common.loading')}
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    {isLogin ? t('home.login') : t('home.signup')}
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </span>
                )}
              </Button>
            </form>

            <div className="mt-6">
              <Separator className="my-6" />
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-2">
                  {isLogin ? "Don't have an account?" : 'Already have an account?'}
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
                  {isLogin ? 'Create account' : 'Sign in instead'}
                </Button>
              </div>
            </div>
          </Card>

          {/* Security Badge */}
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Shield className="h-4 w-4" />
            <span>Secure authentication powered by Lovable Cloud</span>
          </div>
        </div>
      </div>

      {/* Right Side - Feature Showcase (hidden on mobile) */}
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
              Everything in one place
            </h2>
          </div>

          <div className="space-y-6">
            <FeatureItem 
              emoji="🔥"
              title="Track Habits"
              description="Build consistency with daily habit tracking and streak counting"
            />
            <FeatureItem 
              emoji="🏆"
              title="Join Challenges"
              description="Compete with friends and stay motivated together"
            />
            <FeatureItem 
              emoji="💰"
              title="Split Expenses"
              description="Manage group expenses and settle balances effortlessly"
            />
          </div>

          <div className="pt-8 border-t border-border">
            <p className="text-sm text-muted-foreground italic">
              "Splitz helped me stay accountable and reach my goals faster than ever!"
            </p>
            <p className="text-sm font-medium text-foreground mt-2">— Sarah K.</p>
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

import { useEffect, useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Sparkles, Target, DollarSign, Trophy, Users, Zap, 
  Star, Clock, Shield, TrendingUp, MessageCircle, CheckCircle2,
  Rocket, Menu, X, Calendar, CheckSquare, Grid3x3, CreditCard, Plane
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import LanguageToggle from '@/components/LanguageToggle';
import { supabase } from '@/integrations/supabase/client';
import splitzLogo from '@/assets/splitz-logo.png';
import { formatRelativeTime, formatAmount } from '@/lib/formatters';
import { generateLiveStreaks, generateRecentSplits } from '@/lib/sampleData';
import { prefetchDashboard } from '@/App';

const Index = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const [activeTab, setActiveTab] = useState<'users' | 'friends'>('users');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        prefetchDashboard();
        navigate('/habits');
      }
    });
  }, [navigate]);

  // Manual tab switching only - removed auto-switch for better UX

  const navLinks = [
    { label: t('nav.features'), href: '#features' },
    { label: t('nav.howItWorks'), href: '#how' },
    { label: t('nav.pricing'), href: '#pricing' },
  ];

  // Generate localized sample data
  const liveStreaks = useMemo(() => generateLiveStreaks(i18n.language), [i18n.language]);
  const recentSplits = useMemo(() => generateRecentSplits(i18n.language), [i18n.language]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F6F2E8] via-[#C5C0C9]/20 to-[#C0D6EA]/30">
      {/* Background Blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#C0D6EA]/30 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#DDFF55]/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-[#11425D]/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '4s' }}></div>
      </div>

      {/* Fixed Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/70 backdrop-blur-xl border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-3">
            <img
              src={splitzLogo}
              alt={t('common.logoAlt')}
              className="h-8 w-auto rounded-none cursor-pointer hover:opacity-80 transition-opacity"
            />
          </Link>

          {/* Desktop Nav */}
          <nav className={`hidden md:flex items-center gap-8 ${isRTL ? 'flex-row-reverse' : ''}`}>
            {navLinks.map(link => (
              <a 
                key={link.href}
                href={link.href} 
                className="text-foreground hover:text-primary transition-colors font-medium"
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate('/auth')}
              className="hidden sm:inline-flex"
            >
              {t('nav.login')}
            </Button>
            <Button 
              variant="default" 
              size="sm"
              onClick={() => navigate('/auth')}
              className="hidden sm:inline-flex"
            >
              {t('nav.getStarted')}
            </Button>
            <LanguageToggle />
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X /> : <Menu />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-background/95 backdrop-blur-xl border-t border-border px-6 py-4 space-y-3">
            {navLinks.map(link => (
              <a 
                key={link.href}
                href={link.href} 
                className="block text-foreground hover:text-primary transition-colors font-medium py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </a>
            ))}
            <div className="pt-4 border-t border-border flex gap-3">
              <Button 
                variant="ghost"
                size="sm"
                onClick={() => {
                  setMobileMenuOpen(false);
                  navigate('/auth');
                }}
                className="flex-1"
              >
                {t('nav.login')}
              </Button>
              <Button 
                variant="default"
                size="sm"
                onClick={() => {
                  setMobileMenuOpen(false);
                  navigate('/auth');
                }}
                className="flex-1"
              >
                {t('nav.getStarted')}
              </Button>
            </div>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className={`relative pt-32 pb-16 md:pb-20 px-4 md:px-6 ${isRTL ? 'rtl' : 'ltr'}`}>
        <div className="max-w-5xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 md:px-4 py-2 rounded-full bg-secondary/50 border border-primary/20 mb-6 md:mb-8 animate-fade-in">
            <span className="text-xs md:text-sm font-medium text-primary">{t('hero.badge')}</span>
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-7xl font-extrabold mb-4 md:mb-6 text-primary leading-tight animate-fade-in px-4" style={{ animationDelay: '0.1s' }}>
            {t('hero.title')}
          </h1>

          <p className="text-lg md:text-xl lg:text-2xl text-muted-foreground mb-8 md:mb-10 max-w-2xl mx-auto animate-fade-in px-4" style={{ animationDelay: '0.2s' }}>
            {t('hero.subtitle')}
          </p>

          <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center animate-fade-in px-4" style={{ animationDelay: '0.3s' }}>
            <Button
              onClick={() => navigate('/auth')}
              size="lg"
              variant="default"
              className="h-12 px-8 text-base font-semibold"
            >
              {t('cta.start')} 🚀
            </Button>
            <Button
              onClick={() => document.getElementById('how')?.scrollIntoView({ behavior: 'smooth' })}
              variant="outline"
              size="lg"
              className="h-12 px-8 text-base font-semibold"
            >
              {t('cta.how')}
            </Button>
          </div>
        </div>
      </section>


      {/* Features Grid - Everything You Need */}
      <section id="features" className={`relative px-6 pb-20 ${isRTL ? 'rtl' : 'ltr'}`}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold mb-4 text-primary">
              {t('features.title')}
            </h2>
            <p className="text-xl text-muted-foreground">{t('features.subtitle')}</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Calendar Feature */}
            <Card className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden hover:shadow-md transition-all">
              <div className="px-5 py-4 border-b border-border bg-muted/30">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-blue-600" />
                </div>
              </div>
              <CardContent className="p-5">
                <h3 className="text-lg font-semibold mb-2 text-foreground">{t('features.calendar.title')}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{t('features.calendar.desc')}</p>
              </CardContent>
            </Card>

            {/* Task Management */}
            <Card className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden hover:shadow-md transition-all">
              <div className="px-5 py-4 border-b border-border bg-muted/30">
                <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                  <CheckSquare className="w-5 h-5 text-green-600" />
                </div>
              </div>
              <CardContent className="p-5">
                <h3 className="text-lg font-semibold mb-2 text-foreground">{t('features.tasks.title')}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{t('features.tasks.desc')}</p>
              </CardContent>
            </Card>

            {/* Eisenhower Matrix */}
            <Card className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden hover:shadow-md transition-all">
              <div className="px-5 py-4 border-b border-border bg-muted/30">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center">
                  <Grid3x3 className="w-5 h-5 text-indigo-600" />
                </div>
              </div>
              <CardContent className="p-5">
                <h3 className="text-lg font-semibold mb-2 text-foreground">{t('features.matrix.title')}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{t('features.matrix.desc')}</p>
              </CardContent>
            </Card>

            {/* Habit Streaks */}
            <Card className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden hover:shadow-md transition-all">
              <div className="px-5 py-4 border-b border-border bg-muted/30">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                  <Target className="w-5 h-5 text-amber-600" />
                </div>
              </div>
              <CardContent className="p-5">
                <h3 className="text-lg font-semibold mb-2 text-foreground">{t('features.streaks.title')}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{t('features.streaks.desc')}</p>
              </CardContent>
            </Card>

            {/* Group Challenges */}
            <Card className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden hover:shadow-md transition-all">
              <div className="px-5 py-4 border-b border-border bg-muted/30">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                  <Trophy className="w-5 h-5 text-purple-600" />
                </div>
              </div>
              <CardContent className="p-5">
                <h3 className="text-lg font-semibold mb-2 text-foreground">{t('features.challenges.title')}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{t('features.challenges.desc')}</p>
              </CardContent>
            </Card>

            {/* Focus & Pomodoro */}
            <Card className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden hover:shadow-md transition-all">
              <div className="px-5 py-4 border-b border-border bg-muted/30">
                <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-red-600" />
                </div>
              </div>
              <CardContent className="p-5">
                <h3 className="text-lg font-semibold mb-2 text-foreground">{t('features.focus.title')}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{t('features.focus.desc')}</p>
              </CardContent>
            </Card>

            {/* Expense Splitting */}
            <Card className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden hover:shadow-md transition-all">
              <div className="px-5 py-4 border-b border-border bg-muted/30">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-emerald-600" />
                </div>
              </div>
              <CardContent className="p-5">
                <h3 className="text-lg font-semibold mb-2 text-foreground">{t('features.splitter.title')}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{t('features.splitter.desc')}</p>
              </CardContent>
            </Card>

            {/* Subscription Tracking */}
            <Card className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden hover:shadow-md transition-all">
              <div className="px-5 py-4 border-b border-border bg-muted/30">
                <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-orange-600" />
                </div>
              </div>
              <CardContent className="p-5">
                <h3 className="text-lg font-semibold mb-2 text-foreground">{t('features.subscriptions.title')}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{t('features.subscriptions.desc')}</p>
              </CardContent>
            </Card>

            {/* Trip Planning */}
            <Card className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden hover:shadow-md transition-all">
              <div className="px-5 py-4 border-b border-border bg-muted/30">
                <div className="w-10 h-10 rounded-xl bg-teal-500/10 flex items-center justify-center">
                  <Plane className="w-5 h-5 text-teal-600" />
                </div>
              </div>
              <CardContent className="p-5">
                <h3 className="text-lg font-semibold mb-2 text-foreground">{t('features.trips.title')}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{t('features.trips.desc')}</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works - Feature Workflow */}
      <section id="how" className={`relative px-6 pb-20 ${isRTL ? 'rtl' : 'ltr'}`}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold mb-4 text-primary">
              {t('howItWorks.title')}
            </h2>
            <p className="text-xl text-muted-foreground">{t('howItWorks.subtitle')}</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Step 1: Organize Everything */}
            <Card className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden hover:shadow-md transition-all">
              <div className="px-5 py-6 border-b border-border bg-muted/30 text-center">
                <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-blue-500/10 flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-blue-600" />
                </div>
                <div className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-primary text-primary-foreground font-bold text-sm">
                  1
                </div>
              </div>
              <CardContent className="p-5 text-center">
                <h3 className="text-lg font-semibold mb-2 text-foreground">{t('howItWorks.step1.title')}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{t('howItWorks.step1.desc')}</p>
              </CardContent>
            </Card>

            {/* Step 2: Track Progress */}
            <Card className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden hover:shadow-md transition-all">
              <div className="px-5 py-6 border-b border-border bg-muted/30 text-center">
                <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-purple-500/10 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-purple-600" />
                </div>
                <div className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-primary text-primary-foreground font-bold text-sm">
                  2
                </div>
              </div>
              <CardContent className="p-5 text-center">
                <h3 className="text-lg font-semibold mb-2 text-foreground">{t('howItWorks.step2.title')}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{t('howItWorks.step2.desc')}</p>
              </CardContent>
            </Card>

            {/* Step 3: Collaborate & Achieve */}
            <Card className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden hover:shadow-md transition-all">
              <div className="px-5 py-6 border-b border-border bg-muted/30 text-center">
                <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                  <Users className="w-6 h-6 text-emerald-600" />
                </div>
                <div className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-primary text-primary-foreground font-bold text-sm">
                  3
                </div>
              </div>
              <CardContent className="p-5 text-center">
                <h3 className="text-lg font-semibold mb-2 text-foreground">{t('howItWorks.step3.title')}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{t('howItWorks.step3.desc')}</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className={`relative px-6 pb-20 ${isRTL ? 'rtl' : 'ltr'}`}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold mb-4 text-primary">
              {t('pricing.title')}
            </h2>
            <p className="text-xl text-muted-foreground">{t('pricing.subtitle')}</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            <Card className="rounded-2xl border-2 border-primary/30 bg-card shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-border bg-muted/30 text-center">
                <h3 className="text-2xl font-bold text-foreground mb-1">{t('pricing.free.title')}</h3>
                <div className="text-4xl font-extrabold text-primary">{t('pricing.free.price')}</div>
              </div>
              <CardContent className="p-6">
                <p className="text-center text-sm text-muted-foreground mb-6">{t('pricing.free.desc')}</p>
                <Button 
                  variant="default" 
                  className="w-full h-11 text-sm font-semibold"
                  onClick={() => navigate('/auth')}
                >
                  {t('pricing.free.cta')}
                </Button>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden opacity-60">
              <div className="px-6 py-5 border-b border-border bg-muted/30 text-center">
                <h3 className="text-2xl font-bold text-foreground mb-1">{t('pricing.pro.title')}</h3>
                <div className="text-4xl font-extrabold text-muted-foreground">{t('pricing.pro.price')}</div>
              </div>
              <CardContent className="p-6">
                <p className="text-center text-sm text-muted-foreground mb-6">{t('pricing.pro.desc')}</p>
                <Button 
                  variant="outline" 
                  className="w-full h-11 text-sm font-semibold"
                  disabled
                >
                  {t('pricing.pro.cta')}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Final CTA - Redesigned */}
      <section className={`relative px-6 pb-32 ${isRTL ? 'rtl' : 'ltr'}`}>
        <div className="max-w-5xl mx-auto">
          <Card className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
              <div className={`px-8 py-12 md:p-16 text-center ${isRTL ? 'rtl' : ''}`}>
              <div className="max-w-3xl mx-auto">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <span className="text-sm font-semibold text-primary">{t('final.badge')}</span>
                </div>
                
                <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
                  {t('final.title')}
                </h2>
                
                <p className="text-base md:text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
                  {t('final.subtitle')}
                </p>
                
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button
                    onClick={() => navigate('/auth')}
                    size="lg"
                    className="h-12 px-8 text-base font-semibold"
                  >
                    {t('cta.start')} 🚀
                  </Button>
                  <Button
                    onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                    variant="outline"
                    size="lg"
                    className="h-12 px-8 text-base font-semibold"
                  >
                    {t('cta.learnMore')}
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className={`relative px-6 py-12 border-t border-border bg-background/50 backdrop-blur-sm ${isRTL ? 'rtl' : 'ltr'}`}>
        <div className="max-w-7xl mx-auto text-center">
          <Link to="/" className="flex items-center justify-center gap-3 mb-4">
            <img
              src={splitzLogo}
              alt={t('common.logoAlt')}
              width={32}
              height={32}
              loading="lazy"
              decoding="async"
              className="h-8 w-auto cursor-pointer hover:opacity-80 transition-opacity"
            />
          </Link>
          <p className="text-muted-foreground mb-4">{t('footer.tagline')}</p>
          <p className="text-sm text-muted-foreground">© 2025 Splitz. {t('footer.rights')}</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;

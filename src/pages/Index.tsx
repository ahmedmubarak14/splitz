import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Sparkles, Target, DollarSign, Trophy, Users, Zap, 
  Star, Clock, Shield, TrendingUp, MessageCircle, CheckCircle2,
  Rocket, Menu, X
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import LanguageToggle from '@/components/LanguageToggle';
import { supabase } from '@/integrations/supabase/client';
import logo from '@/assets/logo.png';

const Index = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const [activeTab, setActiveTab] = useState<'users' | 'friends'>('users');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate('/habits');
      }
    });
  }, [navigate]);

  // Auto-switch tabs every 5s
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTab(prev => prev === 'users' ? 'friends' : 'users');
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const navLinks = [
    { label: t('nav.features'), href: '#features' },
    { label: t('nav.howItWorks'), href: '#how' },
    { label: t('nav.pricing'), href: '#pricing' },
  ];

  const liveStreaks = [
    { user: 'Sarah M.', habit: 'Morning Run', streak: 21, lastCheckIn: '2h ago' },
    { user: 'Ahmed K.', habit: 'Reading', streak: 45, lastCheckIn: '5h ago' },
    { user: 'Layla T.', habit: 'Meditation', streak: 12, lastCheckIn: '1h ago' },
    { user: 'Omar S.', habit: 'Hydration', streak: 7, lastCheckIn: '30m ago' },
  ];

  const recentSplits = [
    { group: 'Weekend Trip', total: 450, members: [{ name: 'You', delta: '+SAR 12' }] },
    { group: 'Dinner Party', total: 280, members: [{ name: 'You', delta: '-SAR 15' }] },
    { group: 'Gym Membership', total: 120, members: [{ name: 'You', delta: '+SAR 40' }] },
    { group: 'Coffee Run', total: 65, members: [{ name: 'You', delta: 'Settled' }] },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F6F2E8] via-[#C5C0C9]/20 to-[#C0D6EA]/30">
      {/* Background Blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#C0D6EA]/30 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#DDFF55]/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-[#11425D]/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '4s' }}></div>
      </div>

      {/* Fixed Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/70 backdrop-blur-xl border-b border-gray-200/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <img
              src={logo}
              alt="LinkUp"
              className="h-14 w-auto rounded-none cursor-pointer hover:opacity-80 transition-opacity"
            />
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map(link => (
              <a 
                key={link.href}
                href={link.href} 
                className="text-gray-700 hover:text-violet-700 transition-colors font-medium"
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-3">
            <LanguageToggle />
            <Button 
              variant="ghost" 
              onClick={() => navigate('/auth')}
              className="hidden sm:inline-flex"
            >
              {t('nav.login')}
            </Button>
            <Button 
              variant="gradient" 
              onClick={() => navigate('/auth')}
              className="hidden sm:inline-flex"
            >
              {t('nav.getStarted')}
            </Button>
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
          <div className="md:hidden bg-white/95 backdrop-blur-xl border-t border-gray-200/50 px-6 py-4 space-y-3">
            {navLinks.map(link => (
              <a 
                key={link.href}
                href={link.href} 
                className="block text-gray-700 hover:text-violet-700 transition-colors font-medium py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </a>
            ))}
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6">
        <div className="max-w-5xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/50 border border-primary/20 mb-8 animate-fade-in">
            <span className="text-sm font-medium text-primary">{t('hero.badge')}</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold mb-6 text-primary leading-tight animate-fade-in" style={{ animationDelay: '0.1s' }}>
            {t('hero.title')}
          </h1>

          <p className="text-xl md:text-2xl text-muted-foreground mb-10 max-w-2xl mx-auto animate-fade-in" style={{ animationDelay: '0.2s' }}>
            {t('hero.subtitle')}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <Button
              onClick={() => navigate('/auth')}
              size="lg"
              variant="gradient"
              className="text-lg px-10 py-7 h-auto shadow-xl hover:shadow-2xl"
            >
              {t('cta.start')} 🚀
            </Button>
            <Button
              onClick={() => document.getElementById('how')?.scrollIntoView({ behavior: 'smooth' })}
              variant="outline"
              size="lg"
              className="text-lg px-10 py-7 h-auto border-2"
            >
              {t('cta.how')}
            </Button>
          </div>
        </div>
      </section>

      {/* Toggle Showcase Card */}
      <section className="relative px-6 pb-20">
        <div className="max-w-3xl mx-auto">
          <Card className="rounded-3xl border-2 border-gray-200/50 shadow-2xl overflow-hidden card-hover">
            <div className="p-8">
              {/* Tabs */}
              <div className="flex gap-3 mb-8 relative">
                <button
                  onClick={() => setActiveTab('users')}
                  className={`flex-1 py-4 px-6 rounded-2xl font-semibold transition-all ${
                    activeTab === 'users'
                      ? 'bg-primary text-white shadow-lg'
                      : 'bg-muted text-foreground hover:bg-muted/80'
                  }`}
                >
                  {t('tabs.users')}
                </button>
                <button
                  onClick={() => setActiveTab('friends')}
                  className={`flex-1 py-4 px-6 rounded-2xl font-semibold transition-all ${
                    activeTab === 'friends'
                      ? 'bg-primary text-white shadow-lg'
                      : 'bg-muted text-foreground hover:bg-muted/80'
                  }`}
                >
                  {t('tabs.friends')}
                </button>
                {/* Progress dots */}
                <div className="absolute -top-4 right-0 flex gap-2">
                  <div className={`w-2 h-2 rounded-full transition-colors ${activeTab === 'users' ? 'bg-primary' : 'bg-muted'}`}></div>
                  <div className={`w-2 h-2 rounded-full transition-colors ${activeTab === 'friends' ? 'bg-primary' : 'bg-muted'}`}></div>
                </div>
              </div>

              {/* Content */}
              <div className="space-y-6">
                {activeTab === 'users' ? (
                  <div className="animate-fade-in">
                    <h3 className="text-2xl font-bold mb-4 text-foreground">{t('showcase.users.title')}</h3>
                    <ul className="space-y-3">
                      <li className="flex items-center gap-3 text-lg text-muted-foreground">
                        <CheckCircle2 className="w-6 h-6 text-primary" />
                        {t('showcase.users.feature1')}
                      </li>
                      <li className="flex items-center gap-3 text-lg text-muted-foreground">
                        <CheckCircle2 className="w-6 h-6 text-primary" />
                        {t('showcase.users.feature2')}
                      </li>
                      <li className="flex items-center gap-3 text-lg text-muted-foreground">
                        <CheckCircle2 className="w-6 h-6 text-primary" />
                        {t('showcase.users.feature3')}
                      </li>
                    </ul>
                  </div>
                ) : (
                  <div className="animate-fade-in">
                    <h3 className="text-2xl font-bold mb-4 text-foreground">{t('showcase.friends.title')}</h3>
                    <ul className="space-y-3">
                      <li className="flex items-center gap-3 text-lg text-muted-foreground">
                        <CheckCircle2 className="w-6 h-6 text-primary" />
                        {t('showcase.friends.feature1')}
                      </li>
                      <li className="flex items-center gap-3 text-lg text-muted-foreground">
                        <CheckCircle2 className="w-6 h-6 text-primary" />
                        {t('showcase.friends.feature2')}
                      </li>
                      <li className="flex items-center gap-3 text-lg text-muted-foreground">
                        <CheckCircle2 className="w-6 h-6 text-primary" />
                        {t('showcase.friends.feature3')}
                      </li>
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* Trust Stats */}
      <section className="relative px-6 pb-20">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
          <Card className="rounded-2xl border border-border shadow-md text-center p-6 card-hover">
            <Star className="w-8 h-8 text-accent mx-auto mb-3" />
            <div className="text-3xl font-bold text-foreground">4.9/5</div>
            <div className="text-sm text-muted-foreground">{t('trust.rating')}</div>
          </Card>
          <Card className="rounded-2xl border border-border shadow-md text-center p-6 card-hover">
            <Zap className="w-8 h-8 text-accent mx-auto mb-3" />
            <div className="text-3xl font-bold text-foreground">&lt; 2s</div>
            <div className="text-sm text-muted-foreground">{t('trust.load')}</div>
          </Card>
          <Card className="rounded-2xl border border-border shadow-md text-center p-6 card-hover">
            <TrendingUp className="w-8 h-8 text-success mx-auto mb-3" />
            <div className="text-3xl font-bold text-foreground">99.9%</div>
            <div className="text-sm text-muted-foreground">{t('trust.uptime')}</div>
          </Card>
          <Card className="rounded-2xl border border-border shadow-md text-center p-6 card-hover">
            <Shield className="w-8 h-8 text-primary mx-auto mb-3" />
            <div className="text-3xl font-bold text-foreground">100%</div>
            <div className="text-sm text-muted-foreground">{t('trust.privacy')}</div>
          </Card>
        </div>
      </section>

      {/* Live Cards */}
      <section className="relative px-6 pb-20">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-8">
          {/* Live Streaks */}
          <Card className="rounded-3xl border-2 border-border shadow-xl overflow-hidden">
            <div className="bg-primary p-6">
              <h3 className="text-2xl font-bold text-white flex items-center gap-3">
                <Target className="w-7 h-7" />
                {t('live.streaks')}
              </h3>
            </div>
            <CardContent className="p-6 space-y-4">
              {liveStreaks.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 rounded-2xl bg-muted/50 hover:bg-muted transition-colors">
                  <div className="flex-1">
                    <div className="font-semibold text-foreground">{item.user}</div>
                    <div className="text-sm text-muted-foreground">{item.habit}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-accent">🔥 {item.streak}d</div>
                    <div className="text-xs text-muted-foreground">{item.lastCheckIn}</div>
                  </div>
                </div>
              ))}
              <div className="pt-4 border-t border-border text-sm text-muted-foreground flex items-center gap-2">
                <Clock className="w-4 h-4" />
                {t('live.avgCheckIn')}: 3m
              </div>
            </CardContent>
          </Card>

          {/* Recent Splits */}
          <Card className="rounded-3xl border-2 border-border shadow-xl overflow-hidden">
            <div className="bg-secondary p-6">
              <h3 className="text-2xl font-bold text-foreground flex items-center gap-3">
                <DollarSign className="w-7 h-7" />
                {t('live.splits')}
              </h3>
            </div>
            <CardContent className="p-6 space-y-4">
              {recentSplits.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 rounded-2xl bg-muted/50 hover:bg-muted transition-colors">
                  <div className="flex-1">
                    <div className="font-semibold text-foreground">{item.group}</div>
                    <div className="text-sm text-muted-foreground">SAR {item.total}</div>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    item.members[0].delta.includes('+') 
                      ? 'bg-success/20 text-success' 
                      : item.members[0].delta === 'Settled'
                      ? 'bg-primary/20 text-primary'
                      : 'bg-accent/20 text-accent'
                  }`}>
                    {item.members[0].delta}
                  </div>
                </div>
              ))}
              <div className="pt-4 border-t border-border text-sm text-muted-foreground flex items-center gap-2">
                <Clock className="w-4 h-4" />
                {t('live.avgSettle')}: 24h
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="relative px-6 pb-20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold mb-4 text-primary">
              {t('features.title')}
            </h2>
            <p className="text-xl text-muted-foreground">{t('features.subtitle')}</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="rounded-3xl border-2 border-border shadow-lg card-hover overflow-hidden">
              <div className="h-2 bg-primary"></div>
              <CardContent className="p-8">
                <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mb-6 shadow-lg">
                  <Target className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-3 text-foreground">{t('features.streaks.title')}</h3>
                <p className="text-muted-foreground leading-relaxed">{t('features.streaks.desc')}</p>
              </CardContent>
            </Card>

            <Card className="rounded-3xl border-2 border-border shadow-lg card-hover overflow-hidden">
              <div className="h-2 bg-accent"></div>
              <CardContent className="p-8">
                <div className="w-16 h-16 rounded-2xl bg-accent flex items-center justify-center mb-6 shadow-lg">
                  <Trophy className="w-8 h-8 text-foreground" />
                </div>
                <h3 className="text-2xl font-bold mb-3 text-foreground">{t('features.challenges.title')}</h3>
                <p className="text-muted-foreground leading-relaxed">{t('features.challenges.desc')}</p>
              </CardContent>
            </Card>

            <Card className="rounded-3xl border-2 border-border shadow-lg card-hover overflow-hidden">
              <div className="h-2 bg-secondary"></div>
              <CardContent className="p-8">
                <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center mb-6 shadow-lg">
                  <DollarSign className="w-8 h-8 text-foreground" />
                </div>
                <h3 className="text-2xl font-bold mb-3 text-foreground">{t('features.splitter.title')}</h3>
                <p className="text-muted-foreground leading-relaxed">{t('features.splitter.desc')}</p>
              </CardContent>
            </Card>

            <Card className="rounded-3xl border-2 border-border shadow-lg card-hover overflow-hidden">
              <div className="h-2 bg-success"></div>
              <CardContent className="p-8">
                <div className="w-16 h-16 rounded-2xl bg-success flex items-center justify-center mb-6 shadow-lg">
                  <MessageCircle className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-3 text-foreground">{t('features.reminders.title')}</h3>
                <p className="text-muted-foreground leading-relaxed">{t('features.reminders.desc')}</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how" className="relative px-6 pb-20">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold mb-4 text-primary">
              {t('howItWorks.title')}
            </h2>
            <p className="text-xl text-muted-foreground">{t('howItWorks.subtitle')}</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: Users, title: t('howItWorks.step1.title'), desc: t('howItWorks.step1.desc'), color: 'primary' },
              { icon: Trophy, title: t('howItWorks.step2.title'), desc: t('howItWorks.step2.desc'), color: 'secondary' },
              { icon: Rocket, title: t('howItWorks.step3.title'), desc: t('howItWorks.step3.desc'), color: 'accent' },
            ].map((step, idx) => {
              const Icon = step.icon;
              return (
                <Card key={idx} className="rounded-3xl border-2 border-border shadow-lg text-center p-8 card-hover">
                  <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-muted flex items-center justify-center">
                    <Icon className="w-10 h-10 text-primary" />
                  </div>
                  <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary font-bold mb-4">
                    {idx + 1}
                  </div>
                  <h3 className="text-2xl font-bold mb-3 text-foreground">{step.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{step.desc}</p>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="relative px-6 pb-20">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold mb-4 text-primary">
              {t('pricing.title')}
            </h2>
            <p className="text-xl text-muted-foreground">{t('pricing.subtitle')}</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            <Card className="rounded-3xl border-2 border-primary/50 shadow-xl p-8 card-hover">
              <div className="text-center mb-8">
                <h3 className="text-3xl font-bold mb-2 text-foreground">{t('pricing.free.title')}</h3>
                <div className="text-5xl font-extrabold text-primary mb-2">{t('pricing.free.price')}</div>
                <p className="text-muted-foreground">{t('pricing.free.desc')}</p>
              </div>
              <Button 
                variant="gradient" 
                className="w-full text-lg py-6"
                onClick={() => navigate('/auth')}
              >
                {t('pricing.free.cta')}
              </Button>
            </Card>

            <Card className="rounded-3xl border-2 border-border shadow-xl p-8 opacity-60">
              <div className="text-center mb-8">
                <h3 className="text-3xl font-bold mb-2 text-foreground">{t('pricing.pro.title')}</h3>
                <div className="text-5xl font-extrabold text-muted-foreground mb-2">{t('pricing.pro.price')}</div>
                <p className="text-muted-foreground">{t('pricing.pro.desc')}</p>
              </div>
              <Button 
                variant="outline" 
                className="w-full text-lg py-6"
                disabled
              >
                {t('pricing.pro.cta')}
              </Button>
            </Card>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative px-6 pb-32">
        <div className="max-w-5xl mx-auto">
          <Card className="rounded-[2.5rem] overflow-hidden border-0 shadow-2xl">
            <div className="bg-primary p-16 text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1),transparent_70%)]"></div>
              <div className="relative">
                <div className="inline-flex items-center gap-3 mb-6">
                  <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center animate-bounce-slow">
                    <Sparkles className="w-8 h-8 text-white" />
                  </div>
                </div>
                <h2 className="text-4xl md:text-6xl font-bold text-white mb-6">
                  {t('final.title')}
                </h2>
                <p className="text-white/90 text-xl md:text-2xl mb-10 max-w-2xl mx-auto">
                  {t('final.subtitle')}
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button
                    onClick={() => navigate('/auth')}
                    size="lg"
                    className="text-xl px-14 py-8 bg-white text-primary hover:bg-white/95 shadow-2xl hover:shadow-white/50 h-auto font-bold"
                  >
                    {t('cta.start')} 🚀
                  </Button>
                  <Button
                    onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                    size="lg"
                    className="text-xl px-14 py-8 bg-white/20 text-white hover:bg-white/30 border-2 border-white/50 h-auto font-bold"
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
      <footer className="relative px-6 py-12 border-t border-border bg-background/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <img
              src="/logo.png"
              alt="LinkUp"
              className="h-10 w-auto"
            />
          </div>
          <p className="text-muted-foreground mb-4">{t('footer.tagline')}</p>
          <p className="text-sm text-muted-foreground">© 2025 LinkUp. {t('footer.rights')}</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;

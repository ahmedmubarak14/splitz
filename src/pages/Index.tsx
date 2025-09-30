import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Sparkles, Target, DollarSign, Trophy } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import LanguageToggle from '@/components/LanguageToggle';
import { supabase } from '@/integrations/supabase/client';

const Index = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    // Check if user is already logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate('/habits');
      }
    });
  }, [navigate]);

  const features = [
    {
      icon: Target,
      title: t('habits.title'),
      description: 'Build consistent habits with streak tracking',
      gradient: 'gradient-success',
    },
    {
      icon: DollarSign,
      title: t('expenses.title'),
      description: 'Split expenses fairly with friends',
      gradient: 'gradient-primary',
    },
    {
      icon: Trophy,
      title: t('challenges.title'),
      description: 'Compete and grow together',
      gradient: 'gradient-secondary',
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <LanguageToggle />
      
      {/* Hero Section */}
      <div className="relative overflow-hidden min-h-[80vh] flex items-center">
        <div className="absolute inset-0 gradient-primary opacity-5"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,hsl(260,100%,70%,0.15),transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_50%,hsl(330,100%,70%,0.15),transparent_50%)]"></div>
        
        <div className="relative max-w-6xl mx-auto px-6 py-20 text-center">
          <div className="inline-block mb-8 animate-bounce-slow">
            <div className="w-28 h-28 rounded-[2rem] gradient-primary flex items-center justify-center shadow-primary">
              <Sparkles className="w-14 h-14 text-white animate-pulse" />
            </div>
          </div>
          
          <h1 className="text-6xl md:text-8xl font-extrabold mb-6 bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent animate-gradient bg-[length:200%_200%]">
            {t('home.welcome')}
          </h1>
          
          <p className="text-2xl md:text-3xl text-foreground/80 mb-12 max-w-3xl mx-auto font-medium leading-relaxed">
            {t('home.subtitle')}
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Button
              onClick={() => navigate('/auth')}
              size="lg"
              variant="gradient"
              className="text-xl px-12 py-8 h-auto"
            >
              {t('home.getStarted')} 🚀
            </Button>
            <Button
              onClick={() => navigate('/auth')}
              variant="outline"
              size="lg"
              className="text-xl px-12 py-8 h-auto"
            >
              {t('home.login')}
            </Button>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Everything You Need
          </h2>
          <p className="text-xl text-muted-foreground">
            All your daily essentials in one beautiful app
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card
                key={index}
                className="shadow-card border-2 card-hover overflow-hidden"
              >
                <div className={`h-3 ${feature.gradient}`}></div>
                <CardContent className="pt-8 pb-8 px-8">
                  <div className={`w-20 h-20 rounded-3xl ${feature.gradient} flex items-center justify-center mb-6 shadow-primary animate-pulse-glow`}>
                    <Icon className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-3xl font-bold mb-3">{feature.title}</h3>
                  <p className="text-lg text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* CTA Section */}
      <div className="max-w-5xl mx-auto px-6 py-24 text-center">
        <div className="gradient-primary rounded-[2.5rem] p-16 shadow-primary relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1),transparent_70%)]"></div>
          <div className="relative">
            <div className="inline-flex items-center gap-3 mb-6">
              <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center animate-bounce-slow">
                <Trophy className="w-8 h-8 text-white" />
              </div>
            </div>
            <h2 className="text-5xl md:text-6xl font-bold text-white mb-6">
              Ready to level up? 🎯
            </h2>
            <p className="text-white/90 text-xl md:text-2xl mb-10 max-w-2xl mx-auto leading-relaxed">
              Join thousands of users already crushing their goals
            </p>
            <Button
              onClick={() => navigate('/auth')}
              size="lg"
              className="text-xl px-14 py-8 bg-white text-primary hover:bg-white/95 shadow-2xl hover:shadow-white/50 h-auto font-bold"
            >
              {t('home.getStarted')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;

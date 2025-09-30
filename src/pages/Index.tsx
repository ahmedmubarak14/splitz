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
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 gradient-primary opacity-10 animate-gradient"></div>
        <div className="relative max-w-6xl mx-auto px-6 py-20 text-center">
          <div className="inline-block mb-6 animate-float">
            <div className="w-20 h-20 rounded-3xl gradient-primary flex items-center justify-center shadow-primary">
              <Sparkles className="w-10 h-10 text-white" />
            </div>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent animate-gradient">
            {t('home.welcome')}
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            {t('home.subtitle')}
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={() => navigate('/auth')}
              size="lg"
              className="gradient-primary text-white text-lg px-8 py-6 shadow-primary hover:scale-105 transition-transform"
            >
              {t('home.getStarted')} 🚀
            </Button>
            <Button
              onClick={() => navigate('/auth')}
              variant="outline"
              size="lg"
              className="text-lg px-8 py-6 border-2 hover:border-primary hover:scale-105 transition-transform"
            >
              {t('home.login')}
            </Button>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="grid md:grid-cols-3 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card
                key={index}
                className="shadow-card hover:shadow-primary transition-all hover:scale-105 cursor-pointer"
              >
                <CardContent className="pt-6">
                  <div className={`w-14 h-14 rounded-2xl ${feature.gradient} flex items-center justify-center mb-4 shadow-primary`}>
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* CTA Section */}
      <div className="max-w-4xl mx-auto px-6 py-16 text-center">
        <div className="gradient-primary rounded-3xl p-12 shadow-primary">
          <h2 className="text-4xl font-bold text-white mb-4">
            Ready to level up? 🎯
          </h2>
          <p className="text-white/90 text-lg mb-8">
            Join thousands of users already crushing their goals
          </p>
          <Button
            onClick={() => navigate('/auth')}
            size="lg"
            variant="secondary"
            className="text-lg px-8 py-6 bg-white hover:bg-white/90 hover:scale-105 transition-transform"
          >
            {t('home.getStarted')}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Index;

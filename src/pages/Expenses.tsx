import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { DollarSign, Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Navigation from '@/components/Navigation';
import LanguageToggle from '@/components/LanguageToggle';

const Expenses = () => {
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate('/auth');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-8">
      <LanguageToggle />
      
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              {t('expenses.title')} 💰
            </h1>
            <p className="text-muted-foreground mt-2">
              {t('expenses.groups')}
            </p>
          </div>
          
          <Button className="gradient-secondary text-white shadow-secondary hover:scale-105 transition-transform">
            {t('expenses.createGroup')}
          </Button>
        </div>

        <Card className="shadow-card">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Users className="w-16 h-16 text-muted-foreground mb-4" />
            <p className="text-lg text-muted-foreground">{t('expenses.noGroups')}</p>
          </CardContent>
        </Card>
      </div>

      <Navigation />
    </div>
  );
};

export default Expenses;

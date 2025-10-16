import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useIsRTL } from "@/lib/rtl-utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Home, 
  TrendingUp, 
  DollarSign, 
  Trophy, 
  Focus as FocusIcon,
  ArrowLeft,
  Search,
  Compass
} from "lucide-react";
import splitzLogo from "@/assets/splitz-logo.png";
import * as Sentry from "@sentry/react";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const isRTL = useIsRTL();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
    
    if (import.meta.env.PROD) {
      Sentry.captureMessage('404 Page Not Found', {
        level: 'warning',
        tags: { feature: 'navigation' },
        extra: { attemptedPath: location.pathname }
      });
    }
  }, [location.pathname]);

  const quickActions = [
    {
      icon: Home,
      label: t('dashboard.title'),
      description: 'View your dashboard',
      path: '/dashboard',
      color: 'primary'
    },
    {
      icon: TrendingUp,
      label: t('habits.title'),
      description: 'Track your habits',
      path: '/habits',
      color: 'success'
    },
    {
      icon: DollarSign,
      label: t('expenses.title'),
      description: 'Manage expenses',
      path: '/expenses',
      color: 'secondary'
    },
    {
      icon: Trophy,
      label: t('challenges.title'),
      description: 'Join challenges',
      path: '/challenges',
      color: 'accent'
    },
  ];

  return (
    <div 
      className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center p-4 md:p-8" 
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <div className="max-w-4xl w-full">
        {/* Logo */}
        <div className="flex justify-center mb-8 animate-fade-in">
          <img 
            src={splitzLogo} 
            alt="Splitz"
            width={64}
            height={64}
            loading="eager"
            decoding="async"
            className="h-12 md:h-16 opacity-80 hover:opacity-100 transition-opacity cursor-pointer" 
            onClick={() => navigate('/')}
          />
        </div>

        {/* Main 404 Content */}
        <div className="text-center mb-12 animate-scale-in">
          {/* Large 404 */}
          <div className="relative mb-6">
            <h1 className="text-[120px] md:text-[200px] font-bold text-transparent bg-gradient-to-br from-primary to-secondary bg-clip-text leading-none select-none">
              404
            </h1>
            <div className="absolute inset-0 flex items-center justify-center">
              <Compass className="w-16 h-16 md:w-24 md:h-24 text-primary/20 animate-spin" style={{ animationDuration: '20s' }} />
            </div>
          </div>

          {/* Title & Description */}
          <h2 className="text-2xl md:text-4xl font-bold text-foreground mb-4">
            {t('notFound.title')}
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground mb-2">
            {t('notFound.message')}
          </p>
          <p className="text-sm text-muted-foreground/70 mb-8">
            The page <code className="px-2 py-1 bg-muted rounded text-foreground/80 font-mono text-xs">{location.pathname}</code> doesn't exist
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-12">
            <Button
              onClick={() => navigate(-1)}
              variant="outline"
              size="lg"
              className="gap-2 hover-scale"
            >
              <ArrowLeft className="w-4 h-4" />
              Go Back
            </Button>
            <Button
              onClick={() => navigate('/')}
              size="lg"
              className="gap-2 hover-scale"
            >
              <Home className="w-4 h-4" />
              {t('notFound.returnHome')}
            </Button>
          </div>
        </div>

        {/* Quick Actions Grid */}
        <div className="mb-8">
          <h3 className="text-center text-sm font-medium text-muted-foreground mb-4 uppercase tracking-wider">
            Quick Navigation
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action, index) => (
              <Card 
                key={action.path}
                className="group cursor-pointer hover:shadow-lg transition-all duration-300 hover:-translate-y-1 animate-fade-in border-2 hover:border-primary/20"
                style={{ animationDelay: `${index * 100}ms` }}
                onClick={() => navigate(action.path)}
              >
                <CardContent className="p-6 text-center">
                  <div className="flex justify-center mb-3">
                    <div className="p-3 rounded-full bg-gradient-to-br from-primary/10 to-secondary/10 group-hover:from-primary/20 group-hover:to-secondary/20 transition-all">
                      <action.icon className="w-6 h-6 text-primary group-hover:scale-110 transition-transform" />
                    </div>
                  </div>
                  <h4 className="font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">
                    {action.label}
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    {action.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Footer Help Text */}
        <div className="text-center animate-fade-in" style={{ animationDelay: '600ms' }}>
          <p className="text-sm text-muted-foreground flex items-center justify-center gap-2">
            <Search className="w-4 h-4" />
            Lost? Try using the navigation menu or search above
          </p>
        </div>
      </div>
    </div>
  );
};

export default NotFound;

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, Smartphone, Zap, Wifi, CheckCircle2 } from 'lucide-react';
import { SEO } from '@/components/SEO';
import { useNavigate } from 'react-router-dom';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function InstallPWA() {
  const navigate = useNavigate();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    // Check if iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(iOS);

    // Listen for install prompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setIsInstalled(true);
    }
  };

  const features = [
    {
      icon: <Smartphone className="w-8 h-8 text-primary" />,
      title: 'Native App Experience',
      description: 'Works just like a native app on your phone'
    },
    {
      icon: <Wifi className="w-8 h-8 text-primary" />,
      title: 'Offline Access',
      description: 'Access your data even without internet'
    },
    {
      icon: <Zap className="w-8 h-8 text-primary" />,
      title: 'Lightning Fast',
      description: 'Instant loading with cached content'
    },
    {
      icon: <Download className="w-8 h-8 text-primary" />,
      title: 'No App Store',
      description: 'Install directly from browser, no store needed'
    }
  ];

  return (
    <>
      <SEO 
        title="Install Splitz App"
        description="Install Splitz as a Progressive Web App (PWA) for the best mobile experience. Works offline, loads instantly, and feels like a native app."
      />
      
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-4">
        <div className="max-w-4xl mx-auto py-12 space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <img 
              src="/splitz-logo.png" 
              alt="Splitz Logo" 
              className="w-24 h-24 mx-auto rounded-3xl shadow-2xl"
            />
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
              Install Splitz App
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Get the best experience with our Progressive Web App. Fast, reliable, and works offline.
            </p>
          </div>

          {/* Install Status */}
          {isInstalled ? (
            <Card className="border-2 border-green-500/20 bg-green-500/5">
              <CardContent className="pt-6">
                <div className="flex items-center justify-center gap-3 text-green-600">
                  <CheckCircle2 className="w-8 h-8" />
                  <div>
                    <p className="font-semibold text-lg">App Installed Successfully!</p>
                    <p className="text-sm text-muted-foreground">You can now use Splitz like a native app</p>
                  </div>
                </div>
                <Button 
                  onClick={() => navigate('/dashboard')} 
                  className="w-full mt-4"
                >
                  Go to Dashboard
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Install Instructions</CardTitle>
                <CardDescription>
                  {isIOS 
                    ? "On iOS Safari, tap the Share button and select 'Add to Home Screen'"
                    : "Click the install button below to add Splitz to your device"
                  }
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {!isIOS && deferredPrompt && (
                  <Button 
                    onClick={handleInstallClick}
                    size="lg"
                    className="w-full"
                  >
                    <Download className="w-5 h-5 mr-2" />
                    Install Splitz App
                  </Button>
                )}

                {isIOS && (
                  <div className="space-y-3 text-sm">
                    <p className="font-semibold">Follow these steps:</p>
                    <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                      <li>Tap the <strong>Share</strong> button (square with arrow) in Safari</li>
                      <li>Scroll down and tap <strong>Add to Home Screen</strong></li>
                      <li>Tap <strong>Add</strong> in the top right corner</li>
                      <li>Find the Splitz icon on your home screen</li>
                    </ol>
                  </div>
                )}

                {!isIOS && !deferredPrompt && (
                  <p className="text-sm text-muted-foreground text-center">
                    This app is already installable! Check your browser menu for "Install App" or "Add to Home Screen" option.
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Features Grid */}
          <div className="grid md:grid-cols-2 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="hover-scale">
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-2xl bg-primary/10">
                      {feature.icon}
                    </div>
                    <div>
                      <CardTitle className="text-lg">{feature.title}</CardTitle>
                      <CardDescription className="mt-2">
                        {feature.description}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>

          {/* Benefits */}
          <Card>
            <CardHeader>
              <CardTitle>Why Install?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                <p className="text-sm">Instant loading - No waiting for pages to load</p>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                <p className="text-sm">Works offline - Access your data without internet</p>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                <p className="text-sm">Less data usage - Assets are cached locally</p>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                <p className="text-sm">Home screen icon - Quick access like any other app</p>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                <p className="text-sm">Push notifications - Get timely reminders (coming soon)</p>
              </div>
            </CardContent>
          </Card>

          {/* CTA */}
          <div className="text-center space-y-4">
            <Button 
              variant="outline" 
              onClick={() => navigate('/')}
            >
              Back to Home
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}

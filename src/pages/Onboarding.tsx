import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, Target, Trophy, DollarSign, Brain, ArrowRight, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import splitzLogo from '@/assets/splitz-logo.png';

const features = [
  {
    icon: Target,
    title: 'Track Habits',
    description: 'Build lasting habits with daily check-ins and streak tracking',
    color: 'text-blue-500',
  },
  {
    icon: Trophy,
    title: 'Join Challenges',
    description: 'Compete with friends and achieve your goals together',
    color: 'text-yellow-500',
  },
  {
    icon: DollarSign,
    title: 'Split Expenses',
    description: 'Easily split bills and track who owes what',
    color: 'text-green-500',
  },
  {
    icon: Brain,
    title: 'Focus Sessions',
    description: 'Stay productive with Pomodoro timer and task tracking',
    color: 'text-purple-500',
  },
];

const steps = [
  {
    title: 'Welcome to Splitz!',
    description: 'Your all-in-one platform for habits, challenges, expenses, and productivity',
  },
  {
    title: 'Explore Features',
    description: 'Discover what makes Splitz powerful',
  },
  {
    title: 'Get Started',
    description: 'Ready to begin your journey?',
  },
];

export default function Onboarding() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleSkip = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Mark onboarding as complete
        await supabase
          .from('profiles')
          .update({ onboarding_completed: true })
          .eq('id', user.id);
      }
      navigate('/dashboard');
    } catch (error) {
      console.error('Error completing onboarding:', error);
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Mark onboarding as complete
        await supabase
          .from('profiles')
          .update({ onboarding_completed: true })
          .eq('id', user.id);
        
        toast.success('Welcome to Splitz! 🎉');
      }
      navigate('/dashboard');
    } catch (error) {
      console.error('Error completing onboarding:', error);
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-8">
          <img 
            src={splitzLogo} 
            alt="Splitz" 
            width={48}
            height={48}
            className="h-12 mx-auto mb-4"
            loading="eager"
            decoding="async"
          />
          <div className="flex justify-center gap-2 mb-6">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`h-2 rounded-full transition-all ${
                  index === currentStep
                    ? 'w-8 bg-primary'
                    : index < currentStep
                    ? 'w-2 bg-primary/50'
                    : 'w-2 bg-muted'
                }`}
              />
            ))}
          </div>
        </div>

        <Card className="border-2">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-3xl flex items-center justify-center gap-2">
              {currentStep === 0 && <Sparkles className="w-8 h-8 text-primary" />}
              {steps[currentStep].title}
            </CardTitle>
            <CardDescription className="text-base">
              {steps[currentStep].description}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Step 0: Welcome */}
            {currentStep === 0 && (
              <div className="space-y-6 py-4">
                <p className="text-center text-muted-foreground">
                  Splitz helps you build better habits, achieve goals with friends, manage shared expenses, and stay focused on what matters.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {features.slice(0, 2).map((feature, index) => (
                    <div key={index} className="flex gap-3 p-4 rounded-lg bg-muted/50">
                      <feature.icon className={`w-6 h-6 flex-shrink-0 ${feature.color}`} />
                      <div>
                        <h3 className="font-semibold mb-1">{feature.title}</h3>
                        <p className="text-sm text-muted-foreground">{feature.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Step 1: Features */}
            {currentStep === 1 && (
              <div className="space-y-4 py-4">
                {features.map((feature, index) => (
                  <div key={index} className="flex gap-4 p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
                    <div className={`w-12 h-12 rounded-full bg-muted flex items-center justify-center flex-shrink-0`}>
                      <feature.icon className={`w-6 h-6 ${feature.color}`} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold mb-1">{feature.title}</h3>
                      <p className="text-sm text-muted-foreground">{feature.description}</p>
                    </div>
                    <CheckCircle2 className="w-5 h-5 text-success flex-shrink-0" />
                  </div>
                ))}
              </div>
            )}

            {/* Step 2: Get Started */}
            {currentStep === 2 && (
              <div className="space-y-6 py-4">
                <div className="text-center space-y-4">
                  <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                    <Sparkles className="w-10 h-10 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">You're all set!</h3>
                    <p className="text-muted-foreground">
                      Start by creating your first habit, joining a challenge, or splitting an expense with friends.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <Button
                    variant="outline"
                    className="h-auto py-4 flex-col gap-2"
                    onClick={() => navigate('/habits')}
                  >
                    <Target className="w-6 h-6 text-blue-500" />
                    <span className="font-semibold">Start a Habit</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-auto py-4 flex-col gap-2"
                    onClick={() => navigate('/challenges')}
                  >
                    <Trophy className="w-6 h-6 text-yellow-500" />
                    <span className="font-semibold">Join Challenge</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-auto py-4 flex-col gap-2"
                    onClick={() => navigate('/expenses')}
                  >
                    <DollarSign className="w-6 h-6 text-green-500" />
                    <span className="font-semibold">Split Expense</span>
                  </Button>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between items-center pt-4 border-t">
              <Button
                variant="ghost"
                onClick={handleSkip}
                disabled={loading}
              >
                Skip Tour
              </Button>

              {currentStep < steps.length - 1 ? (
                <Button onClick={handleNext} className="gap-2">
                  Next
                  <ArrowRight className="w-4 h-4" />
                </Button>
              ) : (
                <Button onClick={handleComplete} disabled={loading} className="gap-2">
                  {loading ? 'Loading...' : 'Go to Dashboard'}
                  <ArrowRight className="w-4 h-4" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

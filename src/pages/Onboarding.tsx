import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Target, Trophy, Brain, Users, ArrowRight, Sparkles, Heart, Zap, CheckCircle2, Timer } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import Confetti from 'react-confetti';
import { useWindowSize } from '@/hooks/use-window-size';
import splitzLogo from '@/assets/splitz-logo.png';
import { activityLoggers } from '@/lib/activity-logger';

type Goal = 'habits' | 'focus' | 'challenges' | 'expenses';

export default function Onboarding() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { width, height } = useWindowSize();
  const [currentStep, setCurrentStep] = useState(0); // 0: goal, 1: action, 2: celebration, 3: next
  const [loading, setLoading] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [habitName, setHabitName] = useState('');
  const [showConfetti, setShowConfetti] = useState(false);
  const [createdItemName, setCreatedItemName] = useState('');

  const goals = [
    {
      id: 'habits' as Goal,
      icon: Target,
      title: 'Build Better Habits',
      description: 'Track daily habits and build streaks',
      color: 'hsl(var(--primary))',
      bgColor: 'bg-primary/10',
    },
    {
      id: 'focus' as Goal,
      icon: Brain,
      title: 'Stay Focused & Productive',
      description: 'Use Pomodoro sessions and plant trees',
      color: 'hsl(var(--success))',
      bgColor: 'bg-success/10',
    },
    {
      id: 'challenges' as Goal,
      icon: Trophy,
      title: 'Challenge Myself',
      description: 'Join challenges and compete with friends',
      color: 'hsl(var(--accent))',
      bgColor: 'bg-accent/10',
    },
    {
      id: 'expenses' as Goal,
      icon: Users,
      title: 'Split Expenses with Friends',
      description: 'Track shared expenses and settle debts',
      color: 'hsl(var(--warning))',
      bgColor: 'bg-warning/10',
    },
  ];

  const handleGoalSelect = () => {
    if (selectedGoal) {
      setCurrentStep(1);
    }
  };

  const handleCreateFirstItem = async () => {
    if (!selectedGoal) return;
    
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      switch (selectedGoal) {
        case 'habits':
          if (!habitName.trim()) {
            toast.error('Please enter a habit name');
            setLoading(false);
            return;
          }
          await supabase.from('habits').insert({
            user_id: user.id,
            name: habitName,
            icon: '🎯',
            target_days: 30,
          });
          await activityLoggers.habitCheckIn(habitName, 0);
          setCreatedItemName(habitName);
          break;

        case 'focus':
          // Create a sample focus session entry (1 min demo)
          const sessionEnd = new Date();
          const sessionStart = new Date(sessionEnd.getTime() - 60000);
          await supabase.from('focus_sessions').insert({
            user_id: user.id,
            duration: 1,
            start_time: sessionStart.toISOString(),
            end_time: sessionEnd.toISOString(),
            tree_survived: true,
          });
          await activityLoggers.focusCompleted(1, true);
          setCreatedItemName('Focus Session');
          break;

        case 'challenges':
          // Navigate directly to challenges page where they can join/create
          setCreatedItemName('Challenges');
          break;

        case 'expenses':
          // Create a sample expense group
          const { data: groupData } = await supabase.from('expense_groups').insert({
            name: 'My First Group',
            description: 'Track shared expenses here',
            created_by: user.id,
          }).select().single();
          
          if (groupData) {
            await supabase.from('expense_group_members').insert({
              group_id: groupData.id,
              user_id: user.id,
            });
          }
          setCreatedItemName('My First Group');
          break;
      }

      // Show celebration
      setShowConfetti(true);
      setCurrentStep(2);
      
      setTimeout(() => {
        setShowConfetti(false);
      }, 5000);

    } catch (error) {
      console.error('Error creating first item:', error);
      toast.error('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('profiles')
          .update({ onboarding_completed: true })
          .eq('id', user.id);
      }
      
      // Navigate to the feature they selected
      switch (selectedGoal) {
        case 'habits':
          navigate('/habits');
          break;
        case 'focus':
          navigate('/focus');
          break;
        case 'challenges':
          navigate('/challenges');
          break;
        case 'expenses':
          navigate('/expenses');
          break;
        default:
          navigate('/dashboard');
      }
    } catch (error) {
      console.error('Error completing onboarding:', error);
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('profiles')
          .update({ onboarding_completed: true })
          .eq('id', user.id);
      }
      navigate('/dashboard');
    } catch (error) {
      console.error('Error skipping onboarding:', error);
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const getNextStepSuggestion = () => {
    switch (selectedGoal) {
      case 'habits':
        return { feature: 'Challenges', icon: Trophy, route: '/challenges', description: 'Join challenges to stay motivated' };
      case 'focus':
        return { feature: 'Habits', icon: Target, route: '/habits', description: 'Track your daily habits' };
      case 'challenges':
        return { feature: 'Focus Sessions', icon: Brain, route: '/focus', description: 'Use Pomodoro to stay productive' };
      case 'expenses':
        return { feature: 'Trips', icon: Users, route: '/trips', description: 'Plan trips with friends' };
      default:
        return { feature: 'Dashboard', icon: Sparkles, route: '/dashboard', description: 'View your overview' };
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
      {showConfetti && <Confetti width={width} height={height} recycle={false} numberOfPieces={500} />}
      
      <div className="w-full max-w-2xl">
        <div className="text-center mb-6">
          <img 
            src={splitzLogo} 
            alt="Splitz" 
            width={48}
            height={48}
            className="h-12 mx-auto mb-4"
            loading="eager"
            decoding="async"
          />
          <div className="flex justify-center gap-2">
            {[0, 1, 2].map((index) => (
              <div
                key={index}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  index === currentStep
                    ? 'w-8 bg-primary'
                    : index < currentStep
                    ? 'w-1.5 bg-primary/50'
                    : 'w-1.5 bg-border'
                }`}
              />
            ))}
          </div>
        </div>

        <Card className="glass-card border-2">
          {/* Step 0: Goal Selection */}
          {currentStep === 0 && (
            <>
              <CardHeader className="text-center pb-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-8 h-8 text-primary" />
                </div>
                <CardTitle className="text-2xl md:text-3xl mb-2">
                  What brings you here?
                </CardTitle>
                <p className="text-muted-foreground text-sm md:text-base">
                  Choose your primary goal to get started
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <RadioGroup value={selectedGoal || ''} onValueChange={(val) => setSelectedGoal(val as Goal)}>
                  <div className="space-y-3">
                    {goals.map((goal) => (
                      <Label
                        key={goal.id}
                        htmlFor={goal.id}
                        className={`flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all hover:border-primary/50 ${
                          selectedGoal === goal.id ? 'border-primary bg-primary/5' : 'border-border'
                        }`}
                      >
                        <RadioGroupItem value={goal.id} id={goal.id} className="mt-1" />
                        <div className={`w-12 h-12 rounded-xl ${goal.bgColor} flex items-center justify-center flex-shrink-0`}>
                          <goal.icon className="w-6 h-6" style={{ color: goal.color }} />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold mb-1">{goal.title}</h3>
                          <p className="text-sm text-muted-foreground">{goal.description}</p>
                        </div>
                      </Label>
                    ))}
                  </div>
                </RadioGroup>
                
                <div className="flex justify-between items-center pt-4 border-t">
                  <Button variant="ghost" onClick={handleSkip} disabled={loading}>
                    Skip for now
                  </Button>
                  <Button onClick={handleGoalSelect} disabled={!selectedGoal} className="gap-2">
                    Continue
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </>
          )}

          {/* Step 1: Guided Action */}
          {currentStep === 1 && selectedGoal && (
            <>
              <CardHeader className="text-center pb-4">
                <div className={`w-16 h-16 rounded-xl ${goals.find(g => g.id === selectedGoal)?.bgColor} flex items-center justify-center mx-auto mb-4`}>
                  {(() => {
                    const GoalIcon = goals.find(g => g.id === selectedGoal)?.icon;
                    return GoalIcon ? <GoalIcon className="w-8 h-8" style={{ color: goals.find(g => g.id === selectedGoal)?.color }} /> : null;
                  })()}
                </div>
                <CardTitle className="text-2xl md:text-3xl mb-2">
                  {selectedGoal === 'habits' && "Create Your First Habit"}
                  {selectedGoal === 'focus' && "Try a Quick Focus Session"}
                  {selectedGoal === 'challenges' && "Explore Challenges"}
                  {selectedGoal === 'expenses' && "Create Your First Group"}
                </CardTitle>
                <p className="text-muted-foreground text-sm md:text-base">
                  {selectedGoal === 'habits' && "What habit would you like to build?"}
                  {selectedGoal === 'focus' && "We'll start a 1-minute demo session"}
                  {selectedGoal === 'challenges' && "Ready to join exciting challenges?"}
                  {selectedGoal === 'expenses' && "Create a group to track shared expenses"}
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                {selectedGoal === 'habits' && (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="habit-name" className="text-base font-semibold mb-2 block">
                        Habit Name
                      </Label>
                      <Input
                        id="habit-name"
                        placeholder="e.g., Morning Workout, Read 30 Minutes, Meditate..."
                        value={habitName}
                        onChange={(e) => setHabitName(e.target.value)}
                        className="h-12 text-base"
                        autoFocus
                      />
                    </div>
                    <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Target className="w-4 h-4 text-primary" />
                        <span className="font-medium">30-day challenge</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Zap className="w-4 h-4 text-primary" />
                        <span className="font-medium">Daily check-ins</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Trophy className="w-4 h-4 text-primary" />
                        <span className="font-medium">Track your streaks</span>
                      </div>
                    </div>
                  </div>
                )}

                {selectedGoal === 'focus' && (
                  <div className="space-y-4">
                    <div className="bg-gradient-to-br from-success/10 to-success/5 rounded-xl p-6 text-center border border-success/20">
                      <Timer className="w-12 h-12 text-success mx-auto mb-3" />
                      <h3 className="font-semibold text-lg mb-2">1-Minute Demo Session</h3>
                      <p className="text-sm text-muted-foreground">
                        Experience how focus sessions work and plant your first tree! 🌱
                      </p>
                    </div>
                  </div>
                )}

                {selectedGoal === 'challenges' && (
                  <div className="space-y-4">
                    <div className="bg-gradient-to-br from-accent/10 to-accent/5 rounded-xl p-6 border border-accent/20">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center flex-shrink-0">
                          <Trophy className="w-6 h-6 text-accent" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg mb-1">Join the Fun!</h3>
                          <p className="text-sm text-muted-foreground mb-3">
                            Discover challenges created by the community and start competing
                          </p>
                          <div className="flex flex-wrap gap-2">
                            <span className="px-3 py-1 rounded-full bg-background text-xs font-medium">🏆 Various Durations</span>
                            <span className="px-3 py-1 rounded-full bg-background text-xs font-medium">👥 Social</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {selectedGoal === 'expenses' && (
                  <div className="space-y-4">
                    <div className="bg-gradient-to-br from-warning/10 to-warning/5 rounded-xl p-6 border border-warning/20">
                      <Users className="w-12 h-12 text-warning mx-auto mb-3" />
                      <h3 className="font-semibold text-lg text-center mb-2">My First Group</h3>
                      <p className="text-sm text-muted-foreground text-center">
                        Start tracking shared expenses with friends and family
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex justify-between items-center pt-4 border-t">
                  <Button variant="ghost" onClick={() => setCurrentStep(0)}>
                    Back
                  </Button>
                  <Button onClick={handleCreateFirstItem} disabled={loading || (selectedGoal === 'habits' && !habitName.trim())} className="gap-2">
                    {loading ? 'Creating...' : selectedGoal === 'challenges' ? 'Continue' : 'Create'}
                    <CheckCircle2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </>
          )}

          {/* Step 2: Celebration */}
          {currentStep === 2 && (
            <>
              <CardHeader className="text-center pb-4">
                <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4 animate-scale-in">
                  <CheckCircle2 className="w-10 h-10 text-success" />
                </div>
                <CardTitle className="text-2xl md:text-3xl mb-2">
                  🎉 Amazing! You did it!
                </CardTitle>
                <p className="text-muted-foreground">
                  You've taken your first step towards {selectedGoal === 'habits' && 'building better habits'}
                  {selectedGoal === 'focus' && 'staying focused'}
                  {selectedGoal === 'challenges' && 'challenging yourself'}
                  {selectedGoal === 'expenses' && 'managing expenses'}
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-gradient-to-br from-primary/5 to-accent/5 rounded-xl p-6 border">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Heart className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Your First Achievement</h3>
                      <p className="text-sm text-muted-foreground">{createdItemName}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between py-2 border-t">
                      <span className="text-muted-foreground">Status</span>
                      <span className="font-semibold text-success">✓ Active</span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-t">
                      <span className="text-muted-foreground">Created</span>
                      <span className="font-semibold">Just now</span>
                    </div>
                  </div>
                </div>

                {(() => {
                  const nextStep = getNextStepSuggestion();
                  const NextIcon = nextStep.icon;
                  return (
                    <div>
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-primary" />
                        Try this next
                      </h4>
                      <Button
                        variant="outline"
                        className="w-full h-auto py-4 justify-start"
                        onClick={() => {
                          handleComplete();
                        }}
                      >
                        <div className="flex items-center gap-3 w-full">
                          <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                            <NextIcon className="w-5 h-5 text-primary" />
                          </div>
                          <div className="text-left flex-1">
                            <div className="font-semibold">{nextStep.feature}</div>
                            <div className="text-xs text-muted-foreground">{nextStep.description}</div>
                          </div>
                          <ArrowRight className="w-5 h-5 text-muted-foreground" />
                        </div>
                      </Button>
                    </div>
                  );
                })()}

                <div className="flex justify-center pt-4 border-t">
                  <Button onClick={handleComplete} disabled={loading} size="lg" className="gap-2 w-full">
                    {loading ? 'Loading...' : 'Continue to App'}
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}

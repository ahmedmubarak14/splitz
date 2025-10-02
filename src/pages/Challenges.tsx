import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';
import { Trophy } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Navigation from '@/components/Navigation';
import LanguageToggle from '@/components/LanguageToggle';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import type { Tables, TablesInsert } from '@/integrations/supabase/types';

type ChallengeWithParticipants = Tables<'challenges'> & { challenge_participants: Tables<'challenge_participants'>[] };

const Challenges = () => {
  const [loading, setLoading] = useState(true);
  const [challenges, setChallenges] = useState<ChallengeWithParticipants[]>([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
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
    await fetchChallenges();
    setLoading(false);
  };

  const fetchChallenges = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('challenges')
        .select('id, name, description, start_date, end_date, creator_id, challenge_participants(*)')
        .gte('end_date', today)
        .order('start_date', { ascending: true });
      if (error) throw error;
      setChallenges((data as unknown as ChallengeWithParticipants[]) || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load challenges';
      toast.error(message);
    }
  };

  const createChallenge = async () => {
    if (!name.trim() || !startDate || !endDate) return;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      const payload: TablesInsert<'challenges'> = {
        creator_id: user.id,
        name: name.trim(),
        description: description.trim() || null,
        start_date: startDate,
        end_date: endDate,
      };
      const { error } = await supabase.from('challenges').insert(payload);
      if (error) throw error;
      setCreateOpen(false);
      setName('');
      setDescription('');
      setStartDate('');
      setEndDate('');
      await fetchChallenges();
      toast.success('Challenge created');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create challenge';
      toast.error(message);
    }
  };

  const joinChallenge = async (challengeId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      const payload: TablesInsert<'challenge_participants'> = {
        challenge_id: challengeId,
        user_id: user.id,
      };
      const { error } = await supabase.from('challenge_participants').insert(payload);
      if (error) throw error;
      await fetchChallenges();
      toast.success('Joined challenge');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to join';
      toast.error(message);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-8">
      <LanguageToggle />
      
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-secondary to-accent bg-clip-text text-transparent">
              {t('challenges.title')} 🏆
            </h1>
            <p className="text-muted-foreground mt-2">
              {t('challenges.active')}
            </p>
          </div>
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button className="gradient-secondary text-white shadow-secondary hover:scale-105 transition-transform">
                {t('challenges.createChallenge')}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="text-2xl">{t('challenges.createChallenge')}</DialogTitle>
                <DialogDescription>Create a challenge (name, dates, optional description)</DialogDescription>
              </DialogHeader>
              <div className="space-y-3 pt-2">
                <Input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
                <Input placeholder="Description (optional)" value={description} onChange={(e) => setDescription(e.target.value)} />
                <div className="grid grid-cols-2 gap-2">
                  <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                  <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                </div>
                <Button onClick={createChallenge} className="w-full">Create</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {challenges.length === 0 ? (
          <Card className="shadow-card">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <Trophy className="w-16 h-16 text-muted-foreground mb-4" />
              <p className="text-lg text-muted-foreground">{t('challenges.noChallenges')}</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {challenges.map((c) => (
              <Card key={c.id} className="shadow-card border-2">
                <CardHeader className="flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-xl">{c.name}</CardTitle>
                    {c.description ? (
                      <CardDescription className="mt-1">{c.description}</CardDescription>
                    ) : null}
                    <CardDescription className="mt-1">{c.start_date} → {c.end_date}</CardDescription>
                  </div>
                  <Button variant="outline" onClick={() => joinChallenge(c.id)}>Join</Button>
                </CardHeader>
                <CardContent>
                  {c.challenge_participants?.length ? (
                    <div className="text-sm text-muted-foreground">Participants: {c.challenge_participants.length}</div>
                  ) : (
                    <div className="text-sm text-muted-foreground">No participants yet.</div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Navigation />
    </div>
  );
};

export default Challenges;

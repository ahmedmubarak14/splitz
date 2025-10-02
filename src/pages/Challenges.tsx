import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import type { Tables, TablesInsert } from '@/integrations/supabase/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Trophy, Plus, TrendingUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Navigation from '@/components/Navigation';
import LanguageToggle from '@/components/LanguageToggle';
import ChallengeCard from '@/components/ChallengeCard';
import ChallengeDetailsDialog from '@/components/ChallengeDetailsDialog';
import EditChallengeDialog from '@/components/EditChallengeDialog';

type Challenge = Tables<'challenges'> & {
  participant_count?: number;
  user_progress?: number;
  is_participant?: boolean;
  creator_name?: string;
  participants?: Array<{
    id: string;
    user_id: string;
    progress: number;
    joined_at: string;
    user_email?: string;
  }>;
};

const Challenges = () => {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);
  const [deletingChallenge, setDeletingChallenge] = useState<Challenge | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'joined'>('all');
  const [currentUserId, setCurrentUserId] = useState<string>('');
  
  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    checkAuth();
    fetchChallenges();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate('/auth');
    }
  };

  const fetchChallenges = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      setCurrentUserId(user.id);

      const { data: challengesData, error: challengesError } = await supabase
        .from('challenges')
        .select('*')
        .order('created_at', { ascending: false });

      if (challengesError) throw challengesError;

      const { data: participants } = await supabase
        .from('challenge_participants')
        .select('*');

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name');

      const processedChallenges: Challenge[] = (challengesData || []).map((challenge) => {
        const challengeParticipants = participants?.filter(p => p.challenge_id === challenge.id) || [];
        const isParticipant = challengeParticipants.some(p => p.user_id === user.id);
        const userParticipant = challengeParticipants.find(p => p.user_id === user.id);
        const creator = profiles?.find(p => p.id === challenge.creator_id);

        return {
          ...challenge,
          participant_count: challengeParticipants.length,
          is_participant: isParticipant,
          user_progress: userParticipant?.progress || 0,
          creator_name: creator?.full_name || 'Unknown',
          participants: challengeParticipants.map(p => ({
            ...p,
            user_email: profiles?.find(prof => prof.id === p.user_id)?.full_name || 'Anonymous',
          })),
        };
      });

      setChallenges(processedChallenges);
    } catch (error) {
      console.error('Error fetching challenges:', error);
      toast.error('Failed to load challenges');
    } finally {
      setLoading(false);
    }
  };

  const createChallenge = async () => {
    if (!name.trim() || !startDate || !endDate) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (new Date(endDate) <= new Date(startDate)) {
      toast.error('End date must be after start date');
      return;
    }

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

      toast.success('Challenge created! 🎉');
      setName('');
      setDescription('');
      setStartDate('');
      setEndDate('');
      setDialogOpen(false);
      fetchChallenges();
    } catch (error) {
      console.error('Error creating challenge:', error);
      toast.error('Failed to create challenge');
    }
  };

  const joinChallenge = async (challengeId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase.from('challenge_participants').insert({
        challenge_id: challengeId,
        user_id: user.id,
        progress: 0,
      });

      if (error) {
        if (error.code === '23505') {
          toast.error('Already joined this challenge!');
        } else {
          throw error;
        }
      } else {
        toast.success('Joined challenge! 🎯');
        fetchChallenges();
      }
    } catch (error) {
      console.error('Error joining challenge:', error);
      toast.error('Failed to join challenge');
    }
  };

  const leaveChallenge = async (challengeId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('challenge_participants')
        .delete()
        .eq('challenge_id', challengeId)
        .eq('user_id', user.id);

      if (error) throw error;

      toast.success('Left challenge');
      fetchChallenges();
    } catch (error) {
      console.error('Error leaving challenge:', error);
      toast.error('Failed to leave challenge');
    }
  };

  const updateProgress = async (challengeId: string, newProgress: number) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('challenge_participants')
        .update({ progress: newProgress })
        .eq('challenge_id', challengeId)
        .eq('user_id', user.id);

      if (error) throw error;

      toast.success('Progress updated! 🎯');
      fetchChallenges();
      
      const updated = challenges.find(c => c.id === challengeId);
      if (updated && selectedChallenge?.id === challengeId) {
        setSelectedChallenge({ ...updated, user_progress: newProgress });
      }
    } catch (error) {
      console.error('Error updating progress:', error);
      toast.error('Failed to update progress');
    }
  };

  const viewDetails = (challengeId: string) => {
    const challenge = challenges.find(c => c.id === challengeId);
    if (challenge) {
      setSelectedChallenge(challenge);
      setDetailsDialogOpen(true);
    }
  };

  const openEditDialog = (challenge: Challenge) => {
    setSelectedChallenge(challenge);
    setEditDialogOpen(true);
  };

  const updateChallenge = async (id: string, name: string, description: string, startDate: string, endDate: string) => {
    if (!name.trim() || !startDate || !endDate) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (new Date(endDate) <= new Date(startDate)) {
      toast.error('End date must be after start date');
      return;
    }

    try {
      const { error } = await supabase
        .from('challenges')
        .update({
          name: name.trim(),
          description: description.trim() || null,
          start_date: startDate,
          end_date: endDate,
        })
        .eq('id', id);

      if (error) throw error;

      toast.success('Challenge updated! ✓');
      setEditDialogOpen(false);
      fetchChallenges();
    } catch (error) {
      console.error('Error updating challenge:', error);
      toast.error('Failed to update challenge');
    }
  };

  const openDeleteDialog = (challengeId: string) => {
    const challenge = challenges.find(c => c.id === challengeId);
    if (challenge) {
      setDeletingChallenge(challenge);
      setDeleteDialogOpen(true);
    }
  };

  const deleteChallenge = async () => {
    if (!deletingChallenge) return;

    try {
      const { error } = await supabase
        .from('challenges')
        .delete()
        .eq('id', deletingChallenge.id);

      if (error) throw error;

      toast.success('Challenge deleted');
      setDeleteDialogOpen(false);
      setDeletingChallenge(null);
      fetchChallenges();
    } catch (error) {
      console.error('Error deleting challenge:', error);
      toast.error('Failed to delete challenge');
    }
  };

  const filteredChallenges = activeTab === 'joined' 
    ? challenges.filter(c => c.is_participant)
    : challenges;

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-8">
      <LanguageToggle />
      
      <div className="max-w-6xl mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-foreground flex items-center justify-center shadow-card">
                <Trophy className="w-7 h-7 text-background" />
              </div>
              <div>
                <h1 className="font-display text-5xl md:text-6xl font-extrabold text-foreground">
                  {t('challenges.title')}
                </h1>
                <p className="text-muted-foreground mt-1 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Compete and grow together
                </p>
              </div>
            </div>
          </div>
          
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="lg" className="text-lg bg-foreground text-background hover:bg-foreground/90">
                <Plus className="w-5 h-5 mr-2" />
                {t('challenges.createChallenge')}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="text-2xl">{t('challenges.createChallenge')}</DialogTitle>
                <DialogDescription className="text-base">
                  Create a new challenge and invite friends to compete
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div>
                  <label className="text-sm font-semibold mb-2 block">Challenge Name *</label>
                  <Input
                    placeholder="e.g., 30-Day Fitness Challenge"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="h-12"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold mb-2 block">Description</label>
                  <Textarea
                    placeholder="What's this challenge about?"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-semibold mb-2 block">Start Date *</label>
                    <Input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="h-12"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-semibold mb-2 block">End Date *</label>
                    <Input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="h-12"
                    />
                  </div>
                </div>
                <Button 
                  onClick={createChallenge} 
                  className="w-full h-12 text-base bg-foreground text-background hover:bg-foreground/90"
                >
                  Create Challenge
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'all' | 'joined')} className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="all">All Challenges</TabsTrigger>
            <TabsTrigger value="joined">My Challenges</TabsTrigger>
          </TabsList>
          
          <TabsContent value={activeTab} className="mt-6">
            {loading ? (
              <div className="text-center py-20">
                <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-primary border-t-transparent"></div>
              </div>
            ) : filteredChallenges.length === 0 ? (
              <Card className="shadow-card border-2">
                <CardContent className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-20 h-20 rounded-3xl bg-foreground flex items-center justify-center mb-6 shadow-card">
                <Trophy className="w-10 h-10 text-background" />
              </div>
                  <h3 className="text-2xl font-bold mb-2">
                    {activeTab === 'joined' ? 'No Joined Challenges' : 'No Challenges Yet'}
                  </h3>
                  <p className="text-lg text-muted-foreground max-w-md">
                    {activeTab === 'joined' 
                      ? 'Join a challenge to start competing!'
                      : t('challenges.noChallenges')
                    }
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredChallenges.map((challenge) => (
                  <ChallengeCard
                    key={challenge.id}
                    challenge={challenge}
                    onJoin={joinChallenge}
                    onLeave={leaveChallenge}
                    onViewDetails={viewDetails}
                    onEdit={openEditDialog}
                    onDelete={openDeleteDialog}
                    currentUserId={currentUserId}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <ChallengeDetailsDialog
        challenge={selectedChallenge}
        open={detailsDialogOpen}
        onOpenChange={setDetailsDialogOpen}
        onJoin={joinChallenge}
        onLeave={leaveChallenge}
        onUpdateProgress={updateProgress}
      />

      <EditChallengeDialog
        challenge={selectedChallenge}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSave={updateChallenge}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Challenge</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingChallenge?.name}"? This will also delete all participant data. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={deleteChallenge} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Navigation />
    </div>
  );
};

export default Challenges;

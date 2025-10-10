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
import { Trophy, Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Navigation from '@/components/Navigation';
import ChallengeCard from '@/components/ChallengeCard';
import { EmptyState } from '@/components/EmptyState';
import ChallengeDetailsDialog from '@/components/ChallengeDetailsDialog';
import EditChallengeDialog from '@/components/EditChallengeDialog';
import { InviteDialog } from '@/components/InviteDialog';
import { SkeletonList } from '@/components/ui/skeleton-card';
import ChallengeCompletionDialog from '@/components/ChallengeCompletionDialog';
import MilestoneCelebration from '@/components/MilestoneCelebration';
import { useIsRTL } from '@/lib/rtl-utils';
import { responsiveText, responsiveSpacing, responsiveGrid } from '@/lib/responsive-utils';
import * as Sentry from "@sentry/react";
import { z } from 'zod';
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
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);
  const [deletingChallenge, setDeletingChallenge] = useState<Challenge | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'joined'>('all');
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [completionDialogOpen, setCompletionDialogOpen] = useState(false);
  const [completedChallengeName, setCompletedChallengeName] = useState('');
  const [milestoneDialogOpen, setMilestoneDialogOpen] = useState(false);
  const [currentMilestone, setCurrentMilestone] = useState(0);
  const [milestoneChallengeName, setMilestoneChallengeName] = useState('');
  const [previousProgress, setPreviousProgress] = useState<Record<string, number>>({});
  
  const navigate = useNavigate();
  const { t } = useTranslation();
  const isRTL = useIsRTL();

  useEffect(() => {
    checkAuth();
    fetchChallenges();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) navigate('/auth');
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
      toast.error('Failed to load challenges');
    } finally {
      setLoading(false);
    }
  };

  const createChallenge = async () => {
    const validation = z.object({
      name: z.string().trim().min(1, 'Name is required').max(100, 'Name must be under 100 characters'),
      description: z.string().trim().max(500, 'Description must be under 500 characters').optional(),
      startDate: z.string().min(1, 'Start date is required'),
      endDate: z.string().min(1, 'End date is required'),
    }).refine((data) => new Date(data.endDate) > new Date(data.startDate), {
      message: 'End date must be after start date',
      path: ['endDate'],
    }).safeParse({ name, description, startDate, endDate });

    if (!validation.success) {
      const message = validation.error.errors[0]?.message || 'Invalid input';
      toast.error(message);
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Defensive: send creator_id explicitly as fallback (trigger will override for security)
      const payload: TablesInsert<'challenges'> = {
        creator_id: user.id,
        name: name.trim(),
        description: description.trim() || null,
        start_date: startDate,
        end_date: endDate,
      };

      const { data: created, error } = await supabase.from('challenges').insert(payload).select('id').single();
      
      if (error) {
        if (error.code === '42501') {
          toast.error('Permission denied. Please try logging in again.');
        }
        throw error;
      }

      const { error: participantError } = await supabase
        .from('challenge_participants')
        .insert({
          challenge_id: created.id,
          user_id: user.id,
          progress: 0,
        });
      if (participantError) throw participantError;

      toast.success('Challenge created');
      setName('');
      setDescription('');
      setStartDate('');
      setEndDate('');
      setDialogOpen(false);
      fetchChallenges();
    } catch (error: any) {
      const message = error.code === '42501'
        ? 'Permission denied. Please try logging in again.'
        : error.message || 'Failed to create challenge';
      toast.error(message);
      
      if (import.meta.env.PROD) {
        Sentry.captureException(error, {
          tags: { feature: 'challenges', action: 'create' },
          extra: { challengeName: name, description }
        });
      }
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
          toast.error('Already joined this challenge');
        } else {
          throw error;
        }
      } else {
        toast.success('Joined challenge');
        fetchChallenges();
      }
    } catch (error) {
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
      toast.error('Failed to leave challenge');
    }
  };

  const updateProgress = async (challengeId: string, newProgress: number) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Get previous progress
      const challenge = challenges.find(c => c.id === challengeId);
      const oldProgress = challenge?.user_progress || 0;

      // Check for milestone crossings
      const milestones = [25, 50, 75];
      const crossedMilestone = milestones.find(
        milestone => oldProgress < milestone && newProgress >= milestone
      );

      // Save progress to history
      await supabase
        .from('challenge_progress_history')
        .insert({
          challenge_id: challengeId,
          user_id: user.id,
          progress: newProgress
        });

      const { error } = await supabase
        .from('challenge_participants')
        .update({ progress: newProgress })
        .eq('challenge_id', challengeId)
        .eq('user_id', user.id);

      if (error) throw error;

      // Show milestone celebration
      if (crossedMilestone && challenge) {
        setCurrentMilestone(crossedMilestone);
        setMilestoneChallengeName(challenge.name);
        setMilestoneDialogOpen(true);
      }

      // Check if challenge completed
      if (newProgress >= 100 && challenge) {
        setCompletedChallengeName(challenge.name);
        setCompletionDialogOpen(true);
      }

      toast.success('Progress updated');
      fetchChallenges();
      
      const updated = challenges.find(c => c.id === challengeId);
      if (updated && selectedChallenge?.id === challengeId) {
        setSelectedChallenge({ ...updated, user_progress: newProgress });
      }
    } catch (error) {
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

      toast.success('Challenge updated');
      setEditDialogOpen(false);
      fetchChallenges();
    } catch (error) {
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
      toast.error('Failed to delete challenge');
    }
  };

  const filteredChallenges = activeTab === 'joined' 
    ? challenges.filter(c => c.is_participant)
    : challenges;

  return (
    <div className={`min-h-screen bg-background ${responsiveSpacing.pageContainer} ${responsiveSpacing.mobileNavPadding}`} dir={isRTL ? 'rtl' : 'ltr'}>
      
      <div className={`max-w-7xl mx-auto ${responsiveSpacing.sectionGap}`}>
        {/* Header */}
        <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${isRTL ? 'sm:flex-row-reverse' : ''}`}>
          <div className={`space-y-1 ${isRTL ? 'text-right' : 'text-left'}`}>
            <h1 className={`${responsiveText.pageTitle} font-semibold text-foreground`}>
              {t('challenges.title')}
            </h1>
            <p className={`${responsiveText.small} text-muted-foreground`}>
              {t('challenges.competeAndGrow')}
            </p>
          </div>
          
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                {t('challenges.createChallenge')}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md" dir={isRTL ? 'rtl' : 'ltr'}>
              <DialogHeader>
                <DialogTitle className={isRTL ? 'text-right' : 'text-left'}>{t('challenges.createChallenge')}</DialogTitle>
                <DialogDescription className={isRTL ? 'text-right' : 'text-left'}>
                  {t('challenges.createDescription')}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div>
                  <label className={`text-sm font-medium mb-2 block ${isRTL ? 'text-right' : 'text-left'}`}>{t('challenges.challengeName')}</label>
                  <Input
                    placeholder={t('challenges.challengeNamePlaceholder')}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={isRTL ? 'text-right' : 'text-left'}
                  />
                </div>
                <div>
                  <label className={`text-sm font-medium mb-2 block ${isRTL ? 'text-right' : 'text-left'}`}>{t('challenges.description')}</label>
                  <Textarea
                    placeholder={t('challenges.descriptionPlaceholder')}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    className={isRTL ? 'text-right' : 'text-left'}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={`text-sm font-medium mb-2 block ${isRTL ? 'text-right' : 'text-left'}`}>{t('challenges.startDate')}</label>
                    <Input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className={`text-sm font-medium mb-2 block ${isRTL ? 'text-right' : 'text-left'}`}>{t('challenges.endDate')}</label>
                    <Input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                  </div>
                </div>
                <Button onClick={createChallenge} className="w-full">
                  {t('challenges.createChallenge')}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'all' | 'joined')} className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2 bg-muted p-1">
            <TabsTrigger value="all" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">{t('challenges.allChallenges')}</TabsTrigger>
            <TabsTrigger value="joined" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">{t('challenges.myChallenges')}</TabsTrigger>
          </TabsList>
          
          <TabsContent value={activeTab} className="mt-6">
            {loading ? (
              <SkeletonList count={6} />
            ) : filteredChallenges.length === 0 ? (
              <EmptyState
                icon={Trophy}
                title={activeTab === 'joined' ? t('challenges.noJoinedChallenges') : t('challenges.noChallenges').split('.')[0]}
                description={activeTab === 'joined' ? t('challenges.joinToStart') : t('challenges.noChallenges')}
                actionLabel={activeTab === 'all' ? t('challenges.createChallenge') : undefined}
                onAction={() => setDialogOpen(true)}
              />
            ) : (
              <div className={`grid ${responsiveGrid.cards} ${responsiveSpacing.gridGap}`}>
                {filteredChallenges.map((challenge) => (
                  <ChallengeCard
                    key={challenge.id}
                    challenge={challenge}
                    onJoin={joinChallenge}
                    onLeave={leaveChallenge}
                    onViewDetails={viewDetails}
                    onEdit={openEditDialog}
                    onDelete={openDeleteDialog}
                    onInvite={(c) => {
                      setSelectedChallenge(c);
                      setInviteDialogOpen(true);
                    }}
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
              Are you sure you want to delete "{deletingChallenge?.name}"? This action cannot be undone.
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

      {selectedChallenge && (
        <InviteDialog
          open={inviteDialogOpen}
          onOpenChange={setInviteDialogOpen}
          resourceId={selectedChallenge.id}
          resourceType="challenge"
          resourceName={selectedChallenge.name}
        />
      )}

      <ChallengeCompletionDialog
        open={completionDialogOpen}
        onOpenChange={setCompletionDialogOpen}
        challengeName={completedChallengeName}
      />

      {milestoneDialogOpen && (
        <MilestoneCelebration
          milestone={currentMilestone}
          challengeName={milestoneChallengeName}
        />
      )}

      <Navigation />
    </div>
  );
};

export default Challenges;

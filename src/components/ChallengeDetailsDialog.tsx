import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Trophy, Users, Calendar, Target, TrendingUp, Crown, Share2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { Tables } from '@/integrations/supabase/types';
import { InviteDialog } from './InviteDialog';

type ChallengeParticipant = {
  id: string;
  user_id: string;
  progress: number;
  joined_at: string;
  user_email?: string;
};

type ChallengeWithDetails = Tables<'challenges'> & {
  participants?: ChallengeParticipant[];
  is_participant?: boolean;
  creator_name?: string;
};

interface ChallengeDetailsDialogProps {
  challenge: ChallengeWithDetails | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onJoin?: (id: string) => void;
  onLeave?: (id: string) => void;
  onUpdateProgress?: (challengeId: string, progress: number) => void;
}

const ChallengeDetailsDialog = ({ 
  challenge, 
  open, 
  onOpenChange,
  onJoin,
  onLeave,
  onUpdateProgress
}: ChallengeDetailsDialogProps) => {
  const { t } = useTranslation();
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);

  if (!challenge) return null;

  const isActive = new Date(challenge.end_date) >= new Date();
  const daysLeft = Math.ceil((new Date(challenge.end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  const sortedParticipants = [...(challenge.participants || [])].sort((a, b) => b.progress - a.progress);
  const userParticipant = challenge.participants?.find(p => challenge.is_participant);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-2xl gradient-accent flex items-center justify-center">
              <Trophy className="w-6 h-6 text-foreground" />
            </div>
            <div className="flex-1">
              <DialogTitle className="text-2xl">{challenge.name}</DialogTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={isActive ? "default" : "secondary"}>
                  {isActive ? t('challenges.active') : 'Ended'}
                </Badge>
                {isActive && (
                  <span className="text-sm text-muted-foreground">
                    {daysLeft} days remaining
                  </span>
                )}
              </div>
            </div>
          </div>
          <DialogDescription className="text-base">
            {challenge.description || 'No description provided'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          {/* Challenge Info */}
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                  <Calendar className="w-4 h-4" />
                  Start Date
                </div>
                <div className="font-bold">
                  {new Date(challenge.start_date).toLocaleDateString()}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                  <Calendar className="w-4 h-4" />
                  End Date
                </div>
                <div className="font-bold">
                  {new Date(challenge.end_date).toLocaleDateString()}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                  <Users className="w-4 h-4" />
                  Participants
                </div>
                <div className="font-bold">
                  {challenge.participants?.length || 0}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                  <Target className="w-4 h-4" />
                  Creator
                </div>
                <div className="font-bold text-sm">
                  {challenge.creator_name || 'Unknown'}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* User Progress */}
          {challenge.is_participant && userParticipant && (
            <Card className="border-2 border-primary/20 bg-primary/5">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 font-semibold text-primary">
                    <TrendingUp className="w-5 h-5" />
                    Your Progress
                  </div>
                  <span className="text-2xl font-bold text-primary">
                    {userParticipant.progress}%
                  </span>
                </div>
                <div className="h-3 bg-muted rounded-full overflow-hidden mb-3">
                  <div 
                    className="h-full gradient-primary transition-all duration-500"
                    style={{ width: `${Math.min(userParticipant.progress, 100)}%` }}
                  />
                </div>
                {isActive && (
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      onClick={() => onUpdateProgress?.(challenge.id, Math.min(userParticipant.progress + 10, 100))}
                      variant="default"
                      className="flex-1"
                    >
                      +10% Progress
                    </Button>
                    <Button 
                      size="sm" 
                      onClick={() => onUpdateProgress?.(challenge.id, Math.min(userParticipant.progress + 25, 100))}
                      variant="outline"
                      className="flex-1"
                    >
                      +25% Progress
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Leaderboard */}
          <div>
            <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-accent" />
              {t('challenges.leaderboard')}
            </h3>
            <div className="space-y-2">
              {sortedParticipants.length === 0 ? (
                <Card>
                  <CardContent className="p-6 text-center text-muted-foreground">
                    No participants yet
                  </CardContent>
                </Card>
              ) : (
                sortedParticipants.map((participant, index) => (
                  <Card 
                    key={participant.id}
                    className={index === 0 ? 'border-2 border-accent' : ''}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${
                          index === 0 ? 'gradient-accent text-foreground' :
                          index === 1 ? 'bg-secondary text-secondary-foreground' :
                          index === 2 ? 'bg-muted text-foreground' :
                          'bg-muted/50 text-muted-foreground'
                        }`}>
                          {index === 0 ? <Crown className="w-5 h-5" /> : `#${index + 1}`}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium">
                            {participant.user_email || 'Anonymous'}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Joined {new Date(participant.joined_at).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-primary">
                            {participant.progress}%
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button
              onClick={() => setInviteDialogOpen(true)}
              variant="outline"
              className="flex-1"
            >
              <Share2 className="w-4 h-4 mr-2" />
              Invite Friends
            </Button>
            {challenge.is_participant ? (
              isActive && (
                <Button
                  onClick={() => {
                    onLeave?.(challenge.id);
                    onOpenChange(false);
                  }}
                  variant="outline"
                  className="flex-1"
                >
                  Leave Challenge
                </Button>
              )
            ) : (
              isActive && (
                <Button
                  onClick={() => {
                    onJoin?.(challenge.id);
                    onOpenChange(false);
                  }}
                  variant="default"
                  className="flex-1"
                >
                  {t('challenges.join')}
                </Button>
              )
            )}
            <Button
              onClick={() => onOpenChange(false)}
              variant={challenge.is_participant ? "default" : "outline"}
              className="flex-1"
            >
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
      
      <InviteDialog
        open={inviteDialogOpen}
        onOpenChange={setInviteDialogOpen}
        resourceId={challenge.id}
        resourceType="challenge"
        resourceName={challenge.name}
      />
    </Dialog>
  );
};

export default ChallengeDetailsDialog;

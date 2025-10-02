import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trophy, Users, Calendar, TrendingUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { Tables } from '@/integrations/supabase/types';

type Challenge = Tables<'challenges'> & {
  participant_count?: number;
  user_progress?: number;
  is_participant?: boolean;
  creator_name?: string;
};

interface ChallengeCardProps {
  challenge: Challenge;
  onJoin?: (id: string) => void;
  onLeave?: (id: string) => void;
  onViewDetails?: (id: string) => void;
}

const ChallengeCard = ({ challenge, onJoin, onLeave, onViewDetails }: ChallengeCardProps) => {
  const { t } = useTranslation();

  const isActive = new Date(challenge.end_date) >= new Date();
  const daysLeft = Math.ceil((new Date(challenge.end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));

  return (
    <Card className="shadow-card border-2 hover:border-primary card-hover overflow-hidden">
      <div className={`h-2 ${isActive ? 'gradient-accent' : 'bg-muted'}`}></div>
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-10 h-10 rounded-xl gradient-accent flex items-center justify-center">
                <Trophy className="w-5 h-5 text-foreground" />
              </div>
              <Badge variant={isActive ? "default" : "secondary"}>
                {isActive ? t('challenges.active') : 'Ended'}
              </Badge>
            </div>
            <CardTitle className="text-xl mb-1">{challenge.name}</CardTitle>
            <CardDescription className="line-clamp-2">
              {challenge.description || 'No description provided'}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-xl bg-muted/50">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <Users className="w-3 h-3" />
              Participants
            </div>
            <div className="text-lg font-bold">{challenge.participant_count || 0}</div>
          </div>
          
          <div className="p-3 rounded-xl bg-muted/50">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <Calendar className="w-3 h-3" />
              {isActive ? 'Days Left' : 'Ended'}
            </div>
            <div className="text-lg font-bold">
              {isActive ? `${daysLeft}d` : '—'}
            </div>
          </div>
        </div>

        {/* Progress (if participant) */}
        {challenge.is_participant && (
          <div className="p-3 rounded-xl bg-primary/10 border-2 border-primary/20">
            <div className="flex items-center gap-2 text-sm font-medium text-primary mb-2">
              <TrendingUp className="w-4 h-4" />
              Your Progress
            </div>
            <div className="flex items-center gap-3">
              <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full gradient-primary transition-all duration-500"
                  style={{ width: `${Math.min((challenge.user_progress || 0), 100)}%` }}
                />
              </div>
              <span className="text-sm font-bold">{challenge.user_progress || 0}%</span>
            </div>
          </div>
        )}

        {/* Creator info */}
        <div className="text-xs text-muted-foreground">
          Created by {challenge.creator_name || 'Unknown'}
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          {challenge.is_participant ? (
            <>
              <Button
                onClick={() => onViewDetails?.(challenge.id)}
                className="flex-1"
                variant="gradient"
              >
                View Details
              </Button>
              {isActive && (
                <Button
                  onClick={() => onLeave?.(challenge.id)}
                  variant="outline"
                >
                  Leave
                </Button>
              )}
            </>
          ) : (
            <>
              <Button
                onClick={() => onViewDetails?.(challenge.id)}
                variant="outline"
                className="flex-1"
              >
                Details
              </Button>
              {isActive && (
                <Button
                  onClick={() => onJoin?.(challenge.id)}
                  variant="gradient"
                >
                  {t('challenges.join')}
                </Button>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ChallengeCard;

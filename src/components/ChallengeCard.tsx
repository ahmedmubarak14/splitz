import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Trophy, Users, Calendar, TrendingUp, MoreVertical, Pencil, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { Tables } from '@/integrations/supabase/types';
import { useIsRTL } from '@/lib/rtl-utils';

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
  onEdit?: (challenge: Challenge) => void;
  onDelete?: (id: string) => void;
  onInvite?: (challenge: Challenge) => void;
  currentUserId?: string;
}

const ChallengeCard = ({ challenge, onJoin, onLeave, onViewDetails, onEdit, onDelete, onInvite, currentUserId }: ChallengeCardProps) => {
  const { t } = useTranslation();
  const isRTL = useIsRTL();

  const isActive = new Date(challenge.end_date) >= new Date();
  const daysLeft = Math.ceil((new Date(challenge.end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  const isCreator = challenge.creator_id === currentUserId;

  return (
    <Card className="border border-border hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center">
              <Trophy className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-base font-semibold">{challenge.name}</CardTitle>
              <CardDescription className="text-xs line-clamp-1 mt-1">
                {challenge.description || 'No description'}
              </CardDescription>
            </div>
          </div>
          <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <Badge variant={isActive ? "default" : "secondary"} className="text-xs">
              {isActive ? t('components.challengeCard.active') : t('components.challengeCard.ended')}
            </Badge>
            {isCreator && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align={isRTL ? 'start' : 'end'} className="bg-background">
                  <DropdownMenuItem onClick={() => onEdit?.(challenge)}>
                    <Pencil className={`w-4 h-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                    {t('components.challengeCard.edit')}
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => onDelete?.(challenge.id)}
                    className="text-destructive"
                  >
                    <Trash2 className={`w-4 h-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                    {t('components.challengeCard.delete')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-2">
          <div className="p-3 rounded-lg bg-accent border border-border">
            <div className={`flex items-center gap-2 text-xs text-muted-foreground mb-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <Users className="w-3 h-3" />
              {t('components.challengeCard.participants')}
            </div>
            <div className={`text-base font-semibold ${isRTL ? 'text-right' : 'text-left'}`}>{challenge.participant_count || 0}</div>
          </div>
          
          <div className="p-3 rounded-lg bg-accent border border-border">
            <div className={`flex items-center gap-2 text-xs text-muted-foreground mb-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <Calendar className="w-3 h-3" />
              {isActive ? t('components.challengeCard.daysLeft') : t('components.challengeCard.ended')}
            </div>
            <div className={`text-base font-semibold ${isRTL ? 'text-right' : 'text-left'}`}>
              {isActive ? `${daysLeft}d` : '—'}
            </div>
          </div>
        </div>

        {/* Progress */}
        {challenge.is_participant && (
          <div className="p-3 rounded-lg bg-accent border border-border">
            <div className={`flex items-center gap-2 text-xs font-medium mb-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <TrendingUp className="w-3 h-3 text-primary" />
              {t('components.challengeCard.yourProgress')}
            </div>
            <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                <div 
                  className={`h-full bg-primary transition-all duration-500 ${isRTL ? 'ml-auto' : ''}`}
                  style={{ width: `${Math.min((challenge.user_progress || 0), 100)}%` }}
                />
              </div>
              <span className="text-xs font-semibold">{challenge.user_progress || 0}%</span>
            </div>
          </div>
        )}

        {/* Creator */}
        <div className={`text-xs text-muted-foreground ${isRTL ? 'text-right' : 'text-left'}`}>
          {t('components.challengeCard.createdBy')} {challenge.creator_name || 'Unknown'}
        </div>

        {/* Actions */}
        <div className={`flex gap-2 pt-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
          {challenge.is_participant ? (
            <>
              <Button
                onClick={() => onViewDetails?.(challenge.id)}
                className="flex-1"
                size="sm"
              >
                {t('components.challengeCard.details')}
              </Button>
              {isCreator && (
                <Button
                  onClick={() => onInvite?.(challenge)}
                  variant="outline"
                  size="sm"
                >
                  {t('components.challengeCard.invite')}
                </Button>
              )}
              {isActive && !isCreator && (
                <Button
                  onClick={() => onLeave?.(challenge.id)}
                  variant="outline"
                  size="sm"
                >
                  {t('components.challengeCard.leave')}
                </Button>
              )}
            </>
          ) : (
            <>
              <Button
                onClick={() => onViewDetails?.(challenge.id)}
                variant="outline"
                size="sm"
                className="flex-1"
              >
                {t('components.challengeCard.details')}
              </Button>
              {isActive && (
                <Button
                  onClick={() => onJoin?.(challenge.id)}
                  size="sm"
                >
                  {t('components.challengeCard.join')}
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

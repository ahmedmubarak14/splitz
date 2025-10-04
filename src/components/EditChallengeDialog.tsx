import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import type { Tables } from '@/integrations/supabase/types';
import { useTranslation } from 'react-i18next';

interface EditChallengeDialogProps {
  challenge: Tables<'challenges'> | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (id: string, name: string, description: string, startDate: string, endDate: string) => void;
}

const EditChallengeDialog = ({ challenge, open, onOpenChange, onSave }: EditChallengeDialogProps) => {
  const { t } = useTranslation();
  const [name, setName] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [startDate, setStartDate] = React.useState('');
  const [endDate, setEndDate] = React.useState('');

  React.useEffect(() => {
    if (challenge) {
      setName(challenge.name);
      setDescription(challenge.description || '');
      setStartDate(challenge.start_date);
      setEndDate(challenge.end_date);
    }
  }, [challenge]);

  const handleSave = () => {
    if (challenge) {
      onSave(challenge.id, name, description, startDate, endDate);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl">{t('challenges.editChallenge')}</DialogTitle>
          <DialogDescription className="text-base">
            {t('challenges.updateDetails')}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          <div>
            <Label className="text-sm font-semibold mb-2">{t('challenges.challengeName')} *</Label>
            <Input
              placeholder={t('challenges.challengeNamePlaceholder')}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-12 mt-2"
            />
          </div>
          <div>
            <Label className="text-sm font-semibold mb-2">{t('challenges.description')}</Label>
            <Textarea
              placeholder={t('challenges.descriptionPlaceholder')}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="mt-2"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-semibold mb-2">{t('challenges.startDate')} *</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="h-12 mt-2"
              />
            </div>
            <div>
              <Label className="text-sm font-semibold mb-2">{t('challenges.endDate')} *</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="h-12 mt-2"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={handleSave} 
              className="flex-1 h-12 text-base"
              variant="gradient"
            >
              {t('dialogs.saveChanges')}
            </Button>
            <Button 
              onClick={() => onOpenChange(false)} 
              variant="outline"
              className="h-12"
            >
              {t('common.cancel')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

import * as React from 'react';

export default EditChallengeDialog;

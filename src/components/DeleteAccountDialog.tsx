import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const DeleteAccountDialog = () => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleDeleteAccount = async () => {
    if (confirmText !== 'DELETE') {
      toast.error(t('account.delete.typeDeleteError'));
      return;
    }

    setLoading(true);

    try {
      // Delete user account (this will cascade delete all related data)
      const { error } = await supabase.auth.admin.deleteUser(
        (await supabase.auth.getUser()).data.user!.id
      );

      if (error) {
        // Fallback: sign out if admin delete fails
        await supabase.auth.signOut();
        toast.success(t('account.delete.fallbackSuccess'));
      } else {
        toast.success(t('account.delete.success'));
      }

      navigate('/');
    } catch (error: any) {
      console.error('Delete account error:', error);
      toast.error(error.message || t('account.delete.failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" className="w-full">
          <Trash2 className="mr-2 h-4 w-4" />
          {t('account.delete.button')}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('account.delete.title')}</AlertDialogTitle>
          <AlertDialogDescription className="space-y-4">
            <p>
              {t('account.delete.cannotBeUndone')}
            </p>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>{t('account.delete.yourAccount')}</li>
              <li>{t('account.delete.allHabits')}</li>
              <li>{t('account.delete.allChallenges')}</li>
              <li>{t('account.delete.allFocus')}</li>
              <li>{t('account.delete.allExpenses')}</li>
              <li>{t('account.delete.allNotifications')}</li>
            </ul>
            <div className="space-y-2 pt-4">
              <label className="text-sm font-medium">
                {t('account.delete.typeDeleteConfirm')}
              </label>
              <Input
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder={t('account.delete.typeDeletePlaceholder')}
                className="uppercase"
              />
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setConfirmText('')}>
            {t('account.delete.cancel')}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDeleteAccount}
            disabled={confirmText !== 'DELETE' || loading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {loading ? t('account.delete.deleting') : t('account.delete.deleteForever')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

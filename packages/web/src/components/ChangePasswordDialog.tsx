import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { PasswordInput } from '@/components/PasswordInput';
import { toast } from 'sonner';
import { KeyRound } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const ChangePasswordDialog = () => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error(t('auth.changePassword.fillAllFields'));
      return;
    }

    if (newPassword.length < 6) {
      toast.error(t('auth.changePassword.passwordMinLength'));
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error(t('auth.changePassword.passwordsNoMatch'));
      return;
    }

    setLoading(true);

    try {
      // Re-authenticate with current password
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) throw new Error('No user found');

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      });

      if (signInError) throw new Error(t('auth.changePassword.incorrectPassword'));

      // Update to new password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (updateError) throw updateError;

      toast.success(t('auth.changePassword.success'));
      setOpen(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      console.error('Change password error:', error);
      toast.error(error.message || t('auth.changePassword.failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
          <KeyRound className="mr-2 h-4 w-4" />
          {t('auth.changePassword.button')}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('auth.changePassword.title')}</DialogTitle>
          <DialogDescription>
            {t('auth.changePassword.description')}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleChangePassword} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">{t('auth.changePassword.currentPassword')}</label>
            <PasswordInput
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder={t('auth.changePassword.currentPasswordPlaceholder')}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">{t('auth.changePassword.newPassword')}</label>
            <PasswordInput
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder={t('auth.changePassword.newPasswordPlaceholder')}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">{t('auth.changePassword.confirmNewPassword')}</label>
            <PasswordInput
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder={t('auth.changePassword.confirmPasswordPlaceholder')}
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? t('auth.changePassword.buttonLoading') : t('auth.changePassword.button')}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Share2, Copy, Check } from 'lucide-react';

interface InviteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  resourceId: string;
  resourceType: 'challenge' | 'expense';
  resourceName: string;
}

export const InviteDialog = ({ open, onOpenChange, resourceId, resourceType, resourceName }: InviteDialogProps) => {
  const [inviteLink, setInviteLink] = useState('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  const generateInviteLink = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Generate unique invite code
      const inviteCode = `${resourceType}_${Math.random().toString(36).substring(2, 15)}`;

      // Create invitation
      const { error } = await supabase.from('invitations').insert({
        invite_code: inviteCode,
        invite_type: resourceType,
        resource_id: resourceId,
        created_by: user.id,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
      });

      if (error) throw error;

      // Generate shareable link
      const link = `${window.location.origin}/join/${inviteCode}`;
      setInviteLink(link);
      toast.success('Invite link generated!');
    } catch (error) {
      console.error('Error generating invite:', error);
      toast.error('Failed to generate invite link');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    toast.success('Link copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const shareViaWhatsApp = () => {
    const message = `Join my ${resourceType} "${resourceName}"! Click here: ${inviteLink}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <Share2 className="w-6 h-6 text-primary" />
            Invite Friends
          </DialogTitle>
          <DialogDescription className="text-base">
            Share this {resourceType} with your friends
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-4">
          {!inviteLink ? (
            <Button
              onClick={generateInviteLink}
              disabled={loading}
              className="w-full h-12"
              variant="gradient"
            >
              {loading ? 'Generating...' : 'Generate Invite Link'}
            </Button>
          ) : (
            <>
              <div>
                <Label className="text-sm font-semibold mb-2">Invite Link</Label>
                <div className="flex gap-2 mt-2">
                  <Input
                    value={inviteLink}
                    readOnly
                    className="h-12"
                  />
                  <Button
                    onClick={copyToClipboard}
                    variant="outline"
                    size="icon"
                    className="h-12 w-12"
                  >
                    {copied ? <Check className="w-5 h-5 text-success" /> : <Copy className="w-5 h-5" />}
                  </Button>
                </div>
              </div>

              <Button
                onClick={shareViaWhatsApp}
                className="w-full h-12 bg-[#25D366] hover:bg-[#128C7E] text-white"
              >
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                Share via WhatsApp
              </Button>

              <p className="text-xs text-muted-foreground text-center">
                This link will expire in 7 days
              </p>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

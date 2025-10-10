import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Share2, Copy, Check, Mail, Send } from 'lucide-react';

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
  const [sendingEmail, setSendingEmail] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState('');
  const [inviterName, setInviterName] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', user.id)
          .single();
        
        if (data?.full_name) {
          setInviterName(data.full_name);
        }
      }
    };
    
    if (open) {
      fetchProfile();
    }
  }, [open]);

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

  const sendInviteEmail = async () => {
    if (!recipientEmail.trim()) {
      toast.error('Please enter an email address');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(recipientEmail)) {
      toast.error('Please enter a valid email address');
      return;
    }

    setSendingEmail(true);
    try {
      // Generate invite link if not already generated
      let linkToSend = inviteLink;
      if (!linkToSend) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        const inviteCode = `${resourceType}_${Math.random().toString(36).substring(2, 15)}`;
        
        const { error: inviteError } = await supabase.from('invitations').insert({
          invite_code: inviteCode,
          invite_type: resourceType,
          resource_id: resourceId,
          created_by: user.id,
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        });

        if (inviteError) throw inviteError;
        
        linkToSend = `${window.location.origin}/join/${inviteCode}`;
        setInviteLink(linkToSend);
      }

      // Since email is removed from profiles, we'll just send the invite email
      // Users must join via the invite link

      const { data, error } = await supabase.functions.invoke('send-invite', {
        body: {
          recipientEmail: recipientEmail.trim(),
          inviteLink: linkToSend,
          resourceType,
          resourceName,
          inviterName: inviterName || 'A friend',
        },
      });

      // Log full error response for debugging
      console.log('Edge function response:', { data, error });
      
      // Handle Resend 403/Test-mode gracefully (error can be in either `error` or `data.error`)
      const serverMsg = (data as any)?.error || (error as any)?.message || '';
      if (error || serverMsg) {
        const msg = String(serverMsg);
        console.error('Full error details:', msg);
        
        const isResendBlocked = msg.includes('testing emails') || msg.includes('Resend API error 403') || msg.includes('403') || msg.includes('Domain not found');
        if (isResendBlocked) {
          try {
            await navigator.clipboard.writeText(linkToSend);
          } catch {}
          toast.info('Email sending is disabled. Link copied — send manually or use WhatsApp.');

          const subject = `Join my ${resourceType} on Splitz`;
          const body = `${inviterName || 'A friend'} invited you to the ${resourceType} "${resourceName}". Use this link: ${linkToSend}`;
          const mailto = `mailto:${encodeURIComponent(recipientEmail.trim())}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
          window.open(mailto, '_self');
          setRecipientEmail('');
          return;
        }
        throw new Error(msg || 'Failed to send');
      }

      toast.success(`Invitation sent to ${recipientEmail}!`);
      setRecipientEmail('');
    } catch (error) {
      console.error('Error sending invite email:', error);
      const errMsg = (error as any)?.message?.toString?.() || '';
      const ctx = (error as any)?.context ? JSON.stringify((error as any).context) : '';
      const combined = `${errMsg} ${ctx}`;

      // Secondary safety net
      if (combined.includes('testing emails') || combined.includes('Resend API error 403') || combined.includes('403')) {
        try {
          if (inviteLink) await navigator.clipboard.writeText(inviteLink);
        } catch {}
        toast.info('Email sending is disabled. Link copied — send manually or use WhatsApp.');
        const subject = `Join my ${resourceType} on Splitz`;
        const body = `${inviterName || 'A friend'} invited you to the ${resourceType} "${resourceName}". Use this link: ${inviteLink}`;
        const mailto = `mailto:${encodeURIComponent(recipientEmail.trim())}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        window.open(mailto, '_self');
      } else {
        toast.error('Failed to send invitation email');
      }
    } finally {
      setSendingEmail(false);
    }
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
          <div>
            <Label className="text-sm font-semibold mb-2">Send via Email</Label>
            <div className="flex gap-2 mt-2">
              <div className="relative flex-1">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="friend@example.com"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  className="h-12 pl-10"
                />
              </div>
              <Button
                onClick={sendInviteEmail}
                disabled={sendingEmail}
                className="h-12 px-6"
              >
                {sendingEmail ? (
                  <>Sending...</>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Send
                  </>
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              They'll receive an email with the invitation link. If email sending is unavailable, we’ll copy the link and open your email app.
            </p>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or share link</span>
            </div>
          </div>

          {!inviteLink ? (
            <Button
              onClick={generateInviteLink}
              disabled={loading}
              className="w-full h-12"
              variant="outline"
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
                className="w-full h-12 bg-[#25D366] hover:bg-[#128C7E] text-primary-foreground"
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

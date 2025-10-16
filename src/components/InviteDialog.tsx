import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Share2, Copy, Check, Mail, Send } from 'lucide-react';
import * as Sentry from "@sentry/react";

interface InviteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  resourceId: string;
  resourceType: 'challenge' | 'expense' | 'trip' | 'subscription';
  resourceName: string;
  payload?: Record<string, any>;
}

export const InviteDialog = ({ open, onOpenChange, resourceId, resourceType, resourceName, payload }: InviteDialogProps) => {
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

  const generateInviteLink = async (): Promise<string | null> => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('You must be logged in to create an invite');
        return null;
      }

      const inviteCode = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

      const { error } = await supabase
        .from('invitations')
        .insert({
          invite_code: inviteCode,
          invite_type: resourceType,
          resource_id: resourceId,
          created_by: user.id,
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          payload: payload || {},
        });

      if (error) throw error;

      const link = `${window.location.origin}/join/${inviteCode}`;
      setInviteLink(link);
      toast.success('Invite link generated!');
      return link;
    } catch (error) {
      console.error('Error generating invite link:', error);
      Sentry.captureException(error);
      toast.error('Failed to generate invite link');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    let linkToCopy = inviteLink;
    if (!linkToCopy) {
      const generatedLink = await generateInviteLink();
      if (!generatedLink) return;
      linkToCopy = generatedLink;
    }
    
    try {
      await navigator.clipboard.writeText(linkToCopy);
      setCopied(true);
      toast.success('Link copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
      toast.error('Failed to copy link');
    }
  };

  const sendInviteEmail = async () => {
    if (!recipientEmail || !recipientEmail.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }

    setSendingEmail(true);
    try {
      // Generate link and get the actual value
      let linkToSend = inviteLink;
      if (!linkToSend) {
        const generatedLink = await generateInviteLink();
        if (!generatedLink) {
          toast.error('Failed to generate invite link');
          setSendingEmail(false);
          return;
        }
        linkToSend = generatedLink;
      }

      const { data, error } = await supabase.functions.invoke('send-invite', {
        body: {
          recipientEmail,
          inviteLink: linkToSend,
          resourceName,
          resourceType,
          inviterName: inviterName || 'Someone',
        },
      });

      if (error) {
        console.error('Edge function error:', error);
        
        // Handle specific errors
        if (error.message?.includes('domain')) {
          toast.error('Email domain not verified. Opening email client as fallback...');
        } else if (error.message?.includes('RESEND_API_KEY')) {
          toast.error('Email service not configured. Opening email client as fallback...');
        } else {
          toast.error(`Failed to send email. Opening email client as fallback...`);
        }
        
        // Fallback to mailto
        await navigator.clipboard.writeText(linkToSend);
        
        const emailSubject = `You're invited to join ${resourceName}!`;
        const emailBody = `${inviterName || 'Someone'} has invited you to join ${resourceName}.\n\nClick here to accept: ${linkToSend}`;
        
        window.location.href = `mailto:${recipientEmail}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
        
        toast.success('Link copied to clipboard!');
        setRecipientEmail('');
        return;
      }

      toast.success(`✉️ Invite sent to ${recipientEmail}`);
      setRecipientEmail('');
    } catch (error: any) {
      console.error('Error sending invite:', error);
      Sentry.captureException(error);
      
      // Fallback to mailto
      toast.info('Opening email client as fallback...');
      const link = inviteLink || `${window.location.origin}/join/pending`;
      await navigator.clipboard.writeText(link);
      
      const emailSubject = `You're invited to join ${resourceName}!`;
      const emailBody = `${inviterName || 'Someone'} has invited you to join ${resourceName}.\n\nClick here to accept: ${link}`;
      
      window.location.href = `mailto:${recipientEmail}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
      
      toast.success('Link copied to clipboard!');
      setRecipientEmail('');
    } finally {
      setSendingEmail(false);
    }
  };

  const shareViaWhatsApp = () => {
    if (!inviteLink) {
      toast.error('Please generate an invite link first');
      return;
    }

    const message = `${inviterName || 'Someone'} invited you to join ${resourceName}! Click here to accept: ${inviteLink}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share {resourceName}</DialogTitle>
          <DialogDescription>
            Invite others to join via email or share a link
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Email Invite */}
          <div className="space-y-2">
            <Label htmlFor="email">Send via Email</Label>
            <div className="flex gap-2">
              <Input
                id="email"
                type="email"
                placeholder="friend@example.com"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    sendInviteEmail();
                  }
                }}
              />
              <Button onClick={sendInviteEmail} disabled={sendingEmail}>
                {sendingEmail ? (
                  'Sending...'
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Send
                  </>
                )}
              </Button>
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or</span>
            </div>
          </div>

          {/* Invite Link */}
          <div className="space-y-2">
            <Label htmlFor="link">Invite Link</Label>
            {inviteLink ? (
              <div className="flex gap-2">
                <Input
                  id="link"
                  value={inviteLink}
                  readOnly
                  onClick={(e) => e.currentTarget.select()}
                />
                <Button size="icon" variant="outline" onClick={copyToClipboard}>
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            ) : (
              <Button onClick={generateInviteLink} disabled={loading} className="w-full">
                {loading ? 'Generating...' : 'Generate Invite Link'}
              </Button>
            )}
          </div>

          {/* WhatsApp Share */}
          {inviteLink && (
            <>
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">Or share via</span>
                </div>
              </div>

              <Button onClick={shareViaWhatsApp} variant="outline" className="w-full">
                <Share2 className="w-4 h-4 mr-2" />
                Share via WhatsApp
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

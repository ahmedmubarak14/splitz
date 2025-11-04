import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function AuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Verifying your email...');

  useEffect(() => {
    const handleEmailConfirmation = async () => {
      const token_hash = searchParams.get('token_hash');
      const type = searchParams.get('type');
      const error_code = searchParams.get('error_code');
      const error_description = searchParams.get('error_description');

      // Handle errors from Supabase
      if (error_code) {
        setStatus('error');
        if (error_code === 'otp_expired') {
          setMessage('Verification link expired. Please request a new one.');
        } else if (error_description) {
          setMessage(error_description);
        } else {
          setMessage('Verification failed. Please try again.');
        }
        setTimeout(() => navigate('/auth'), 4000);
        return;
      }

      if (!token_hash || type !== 'signup') {
        setStatus('error');
        setMessage('Invalid or missing confirmation link');
        setTimeout(() => navigate('/auth'), 3000);
        return;
      }

      try {
        const { error } = await supabase.auth.verifyOtp({
          token_hash,
          type: 'signup',
        });

        if (error) {
          if (error.message.includes('expired')) {
            setMessage('Verification link expired. Please sign up again or request a new link.');
          } else if (error.message.includes('already verified')) {
            setMessage('Email already verified! Redirecting to login...');
            setStatus('success');
            setTimeout(() => navigate('/auth'), 2000);
            return;
          } else {
            throw error;
          }
        }

        setStatus('success');
        setMessage('Email verified successfully! Redirecting to dashboard...');
        
        // Redirect to dashboard after 2 seconds
        setTimeout(() => navigate('/dashboard'), 2000);
      } catch (error: any) {
        console.error('Email verification error:', error);
        setStatus('error');
        setMessage(error.message || 'Failed to verify email. Please try signing up again.');
        setTimeout(() => navigate('/auth'), 4000);
      }
    };

    handleEmailConfirmation();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-secondary/5 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center text-2xl">
            Email Verification
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
          {status === 'loading' && (
            <>
              <Loader2 className="h-16 w-16 animate-spin text-primary" />
              <p className="text-center text-muted-foreground">{message}</p>
            </>
          )}
          
          {status === 'success' && (
            <>
              <CheckCircle2 className="h-16 w-16 text-green-600" />
              <p className="text-center text-green-600 font-semibold">{message}</p>
            </>
          )}
          
          {status === 'error' && (
            <>
              <XCircle className="h-16 w-16 text-red-600" />
              <p className="text-center text-red-600">{message}</p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

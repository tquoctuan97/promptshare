import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, CircleCheck as CheckCircle, CircleAlert as AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function ConfirmEmailPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  useEffect(() => {
    const emailFromState = location.state?.email;
    if (emailFromState) {
      setEmail(emailFromState);
    }
  }, [location.state]);

  const handleResendEmail = async () => {
    if (!email) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Email address not found',
      });
      return;
    }

    setIsResending(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
      });

      if (error) throw error;

      setResendSuccess(true);
      toast({
        title: 'Email sent!',
        description: 'Check your inbox for the confirmation link',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to resend email',
      });
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[calc(100vh-4rem)]">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="rounded-full bg-primary/10 p-3">
              <Mail className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl">Check Your Email</CardTitle>
          <CardDescription>
            We've sent a confirmation link to your email address
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            {email && (
              <div className="bg-muted p-4 rounded-lg">
                <p className="text-sm text-center font-medium break-all">{email}</p>
              </div>
            )}

            <div className="space-y-3">
              <div className="flex items-start space-x-3 text-sm">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
                <p>Click the confirmation link in the email to verify your account</p>
              </div>
              <div className="flex items-start space-x-3 text-sm">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
                <p>After confirming, you'll be able to log in and start sharing prompts</p>
              </div>
              <div className="flex items-start space-x-3 text-sm text-muted-foreground">
                <AlertCircle className="h-5 w-5 mt-0.5 shrink-0" />
                <p>Don't forget to check your spam folder if you don't see the email</p>
              </div>
            </div>
          </div>

          <div className="space-y-3 pt-4 border-t">
            <p className="text-sm text-center text-muted-foreground">
              Didn't receive the email?
            </p>
            <Button
              variant="outline"
              className="w-full"
              onClick={handleResendEmail}
              disabled={isResending || resendSuccess}
            >
              {isResending ? 'Sending...' : resendSuccess ? 'Email Sent!' : 'Resend Confirmation Email'}
            </Button>
            <Button
              variant="ghost"
              className="w-full"
              onClick={() => navigate('/auth')}
            >
              Back to Login
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

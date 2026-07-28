import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import { Mail } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { PageHeader } from '@/components/ui/PageHeader';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';

const resetSchema = z.object({
  email: z.string().email('Enter a valid email address'),
});

type ResetValues = z.infer<typeof resetSchema>;

function ForgotPasswordPage() {
  const { sendPasswordReset } = useAuth();
  const { toast } = useToast();

  const form = useForm<ResetValues>({
    resolver: zodResolver(resetSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = async (values: ResetValues) => {
    try {
      await sendPasswordReset(values.email);
      toast({ title: 'Check your inbox', description: 'Password reset instructions were sent to your email.', variant: 'success' });
    } catch {
      toast({ title: 'Reset failed', description: 'Unable to send password reset email.', variant: 'danger' });
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10 dark:bg-slate-950">
      <Card className="w-full max-w-md border border-slate-200 bg-white/95 p-8 shadow-soft dark:border-slate-800 dark:bg-slate-900/95">
        <PageHeader title="Reset password" description="Enter your email and we will send reset instructions." />
        <form className="space-y-5" onSubmit={form.handleSubmit(onSubmit)}>
          <Input label="Email" placeholder="you@example.com" icon={Mail} {...form.register('email')} error={form.formState.errors.email?.message} />
          <div className="flex items-center justify-between gap-4">
            <Link to="/login" className="text-sm text-slate-500 transition hover:text-slate-900 dark:text-slate-400 dark:hover:text-white">
              Back to login
            </Link>
            <Button type="submit">Send reset link</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

export default ForgotPasswordPage;

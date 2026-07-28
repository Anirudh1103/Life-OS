import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { Lock, Mail } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { PageHeader } from '@/components/ui/PageHeader';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';

const loginSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

function LoginPage() {
  const { login, isLoading, user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  useEffect(() => {
    if (user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  const onSubmit = async (values: LoginFormValues) => {
    try {
      await login(values);
      toast({ title: 'Welcome back', description: 'You successfully signed in.', variant: 'success' });
      navigate('/dashboard');
    } catch {
      toast({ title: 'Unable to sign in', description: 'Please check your credentials and try again.', variant: 'danger' });
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10 dark:bg-slate-950">
      <Card className="w-full max-w-md border border-slate-200 bg-white/95 p-8 shadow-soft dark:border-slate-800 dark:bg-slate-900/95">
        <PageHeader title="Welcome back" description="Sign in to access your premium life workspace." />
        <form className="space-y-5" onSubmit={form.handleSubmit(onSubmit)}>
          <Input label="Email" placeholder="you@example.com" type="email" icon={Mail} {...form.register('email')} error={form.formState.errors.email?.message} />
          <PasswordInput label="Password" placeholder="Enter your password" icon={Lock} {...form.register('password')} error={form.formState.errors.password?.message} />
          <div className="flex items-center justify-between gap-4">
            <Link to="/forgot-password" className="text-sm text-slate-500 transition hover:text-slate-900 dark:text-slate-400 dark:hover:text-white">
              Forgot password?
            </Link>
            <Button type="submit" loading={isLoading} className="ml-auto">
              Continue
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

export default LoginPage;

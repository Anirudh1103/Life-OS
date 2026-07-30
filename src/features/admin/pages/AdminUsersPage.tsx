import { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus, RefreshCcw, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Table } from '@/components/ui/Table';
import { Dialog } from '@/components/ui/Dialog';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { useToast } from '@/hooks/useToast';
import { useAuth } from '@/hooks/useAuth';
import { userService } from '@/services/user.service';
import { UserRecord } from '@/types/firestore';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

const createUserSchema = z.object({
  name: z.string().min(2, 'Enter a name'),
  email: z.string().email('Enter a valid email'),
  role: z.enum(['user', 'admin']),
});

type CreateUserForm = z.infer<typeof createUserSchema>;

function AdminUsersPage() {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { sendPasswordReset } = useAuth();
  const { toast } = useToast();

  const form = useForm<CreateUserForm>({
    resolver: zodResolver(createUserSchema),
    defaultValues: { name: '', email: '', role: 'user' },
  });

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const items = await userService.listUsers();
      setUsers(items);
    } catch {
      toast({ title: 'Unable to load users', description: 'Please reload to try again.', variant: 'danger' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchUsers();
  }, [fetchUsers]);

  const onCreate = async (values: CreateUserForm) => {
    try {
      await userService.createUser({
        name: values.name,
        email: values.email,
        role: values.role,
      });
      toast({ title: 'User created', description: 'The new user has been added to the workspace.', variant: 'success' });
      form.reset();
      setDialogOpen(false);
      await fetchUsers();
    } catch {
      toast({ title: 'Create failed', description: 'There was an error creating the user.', variant: 'danger' });
    }
  };

  const onToggleActive = useCallback(
    async (user: UserRecord, isActive: boolean) => {
      try {
        await userService.updateUserStatus(user.uid ?? user.id ?? '', isActive);
        await fetchUsers();
        toast({ title: 'User updated', description: `${user.name} is now ${isActive ? 'active' : 'disabled'}.`, variant: 'success' });
      } catch {
        toast({ title: 'Update failed', description: 'There was an error updating the user.', variant: 'danger' });
      }
    },
    [fetchUsers, toast],
  );

  const onDelete = useCallback(
    async (user: UserRecord) => {
      try {
        await userService.softDeleteUser(user.uid ?? user.id ?? '');
        await fetchUsers();
        toast({ title: 'User removed', description: `${user.name} has been soft deleted.`, variant: 'success' });
      } catch {
        toast({ title: 'Delete failed', description: 'Unable to remove user.', variant: 'danger' });
      }
    },
    [fetchUsers, toast],
  );

  const onResetPassword = useCallback(
    async (user: UserRecord) => {
      try {
        await sendPasswordReset(user.email);
        toast({ title: 'Reset link sent', description: `Password reset email sent to ${user.email}.`, variant: 'success' });
      } catch {
        toast({ title: 'Reset failed', description: 'Unable to send password reset email.', variant: 'danger' });
      }
    },
    [sendPasswordReset, toast],
  );

  const rows = useMemo(
    () =>
      users.map((item) => ({
        id: item.id ?? item.uid ?? item.email,
        cells: [
          item.name,
          item.email,
          item.role,
          item.isActive ? <Badge key="active" variant="success">Active</Badge> : <Badge key="disabled" variant="secondary">Disabled</Badge>,
          <div className="flex flex-wrap gap-2" key="actions">
            <Button size="xs" variant="secondary" onClick={() => onToggleActive(item, !item.isActive)}>
              {item.isActive ? 'Disable' : 'Enable'}
            </Button>
            <Button size="xs" variant="secondary" onClick={() => onResetPassword(item)}>
              Reset PW
            </Button>
            <Button size="xs" variant="danger" onClick={() => onDelete(item)}>
              Delete
            </Button>
          </div>,
        ],
      })),
    [users, onDelete, onToggleActive, onResetPassword],
  );

  return (
    <div className="space-y-6">
      <PageHeader title="Admin users" description="Create user records, control active state, and preview user management workflows." />
      <Card className="flex flex-wrap items-center justify-between gap-4 p-6">
        <div>
          <p className="text-sm text-slate-500">Manage all users in the workspace with a scalable Firestore-backed admin experience.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button variant="secondary" size="sm" icon={RefreshCcw} onClick={fetchUsers}>
            Refresh
          </Button>
          <Button size="sm" icon={Plus} onClick={() => setDialogOpen(true)}>
            Add user
          </Button>
        </div>
      </Card>
      <Card className="p-6">
        <SectionHeader title="Users" description="Users can be enabled, disabled, or soft deleted for future compliance." />
        <Table columns={["Name", "Email", "Role", "Status", "Actions"]} rows={rows} loading={loading} />
      </Card>
      <Dialog title="Create new user" open={dialogOpen} onClose={() => setDialogOpen(false)}>
        <form className="space-y-4" onSubmit={form.handleSubmit(onCreate)}>
          <Input label="Name" placeholder="Jenny Doe" {...form.register('name')} error={form.formState.errors.name?.message} />
          <Input label="Email" placeholder="jenny@example.com" {...form.register('email')} error={form.formState.errors.email?.message} />
          <Select label="Role" {...form.register('role')} options={[{ label: 'User', value: 'user' }, { label: 'Admin', value: 'admin' }]} error={form.formState.errors.role?.message} />
          <div className="flex items-center justify-end gap-3">
            <Button variant="secondary" type="button" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" icon={UserPlus}>
              Create user
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}

export default AdminUsersPage;

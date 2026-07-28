import { useCallback, useEffect, useState } from 'react';
import { RefreshCcw } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Table } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/hooks/useToast';
import { exerciseService } from '@/services/exercise.service';
import { ExerciseRecord } from '@/types/firestore';

function AdminExercisesPage() {
  const [exercises, setExercises] = useState<ExerciseRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchExercises = useCallback(async () => {
    setLoading(true);
    try {
      const items = await exerciseService.listExercises();
      setExercises(items);
    } catch {
      toast({ title: 'Unable to load exercises', description: 'Please try again later.', variant: 'danger' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchExercises();
  }, [fetchExercises]);

  return (
    <div className="space-y-6">
      <PageHeader title="Exercise library" description="A placeholder table that represents the future exercise management module." />
      <Card className="flex flex-wrap items-center justify-between gap-4 p-6">
        <div className="space-y-1">
          <p className="text-sm text-slate-500">Build and review exercise templates, movements, and library assets in future phases.</p>
        </div>
        <Button variant="secondary" size="sm" icon={RefreshCcw} onClick={fetchExercises}>
          Refresh
        </Button>
      </Card>
      <Card className="p-6">
        <SectionHeader title="Exercises" description="This phase provides typed placeholders for exercise library data." />
        <Table
          columns={["Exercise", "Category", "Equipment", "Status"]}
          rows={exercises.map((exercise) => ({
            id: exercise.id,
            cells: [exercise.name, exercise.category, exercise.equipment ?? 'Bodyweight', exercise.active ? 'Active' : 'Inactive'],
          }))}
          loading={loading}
        />
      </Card>
    </div>
  );
}

export default AdminExercisesPage;

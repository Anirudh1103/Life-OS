import { listCollection } from '@/services/firestore.service';
import { ExerciseRecord } from '@/types/firestore';

const collectionName = 'exerciseLibrary';

export const exerciseService = {
  listExercises: async (): Promise<ExerciseRecord[]> => listCollection<ExerciseRecord>(collectionName),
};

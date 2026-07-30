import { createDocument, deleteDocument, listCollection, updateDocument } from '@/services/firestore.service';
import { ExerciseRecord } from '@/types/firestore';
import { FIRESTORE_COLLECTIONS } from '@/utils/constants';

const collectionName = FIRESTORE_COLLECTIONS.EXERCISE_LIBRARY;

/**
 * Service for managing the exercise library collection in Firestore.
 * Supports complete CRUD operations.
 */
export const exerciseService = {
  /**
   * Retrieves a list of all exercises.
   */
  listExercises: async (): Promise<ExerciseRecord[]> => listCollection<ExerciseRecord>(collectionName),

  /**
   * Creates a new exercise in the library.
   * @param exercise The exercise record data to write.
   * @returns The newly created document ID.
   */
  createExercise: async (exercise: Omit<ExerciseRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
    const timestamp = Date.now();
    return createDocument(collectionName, {
      ...exercise,
      createdAt: timestamp,
      updatedAt: timestamp,
    });
  },

  /**
   * Updates an existing exercise record.
   * @param id The document ID of the exercise.
   * @param data The partial data fields to update.
   */
  updateExercise: async (id: string, data: Partial<Omit<ExerciseRecord, 'id' | 'createdAt' | 'updatedAt'>>): Promise<void> => {
    await updateDocument(`${collectionName}/${id}`, {
      ...data,
      updatedAt: Date.now(),
    });
  },

  /**
   * Deletes an exercise from the library.
   * @param id The document ID to delete.
   */
  deleteExercise: async (id: string): Promise<void> => {
    await deleteDocument(`${collectionName}/${id}`);
  },
};


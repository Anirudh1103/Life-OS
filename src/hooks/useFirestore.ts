import { useMemo } from 'react';
import { firestore } from '@/services/firebase';

export function useFirestore() {
  return useMemo(() => ({
    db: firestore,
  }), []);
}

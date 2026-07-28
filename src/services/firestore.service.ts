import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  orderBy,
  updateDoc,
  where,
  DocumentData,
  WhereFilterOp,
} from 'firebase/firestore';
import { firestore } from '@/services/firebase';

export const getCollection = (path: string) => collection(firestore, path);

export const getDocument = async <T>(path: string) => {
  const reference = doc(firestore, path);
  const snapshot = await getDoc(reference);
  return snapshot.exists() ? (snapshot.data() as T) : null;
};

export const listCollection = async <T>(path: string, filter?: { field: string; operator: WhereFilterOp; value: unknown }[]) => {
  const collectionRef = collection(firestore, path);
  let q = query(collectionRef, orderBy('createdAt', 'desc'));

  if (filter && filter.length > 0) {
    q = query(collectionRef, ...filter.map((item) => where(item.field, item.operator, item.value)), orderBy('createdAt', 'desc'));
  }

  const snapshot = await getDocs(q);
  return snapshot.docs.map((docSnapshot) => ({ id: docSnapshot.id, ...(docSnapshot.data() as T) }));
};

export const queryCollection = async <T>(path: string, filters: { field: string; operator: WhereFilterOp; value: unknown }[]) => {
  const collectionRef = collection(firestore, path);
  const q = query(collectionRef, ...filters.map((item) => where(item.field, item.operator, item.value)), orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((docSnapshot) => ({ id: docSnapshot.id, ...(docSnapshot.data() as T) }));
};

export const createDocument = async (path: string, data: DocumentData) => {
  const collectionRef = collection(firestore, path);
  const created = await addDoc(collectionRef, data);
  return created.id;
};

export const updateDocument = async (path: string, data: Partial<DocumentData>) => {
  const reference = doc(firestore, path);
  await updateDoc(reference, data);
};

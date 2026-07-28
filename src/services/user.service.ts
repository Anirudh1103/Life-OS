import { createDocument, getDocument, listCollection, queryCollection, updateDocument } from '@/services/firestore.service';
import { UserRecord } from '@/types/firestore';

const collectionName = 'users';

const resolveUserDocId = async (identifier: string): Promise<string | null> => {
  const byUid = await queryCollection<UserRecord>(collectionName, [
    { field: 'uid', operator: '==', value: identifier },
  ]);
  if (byUid.length > 0) {
    return byUid[0].id ?? null;
  }

  const directDoc = await getDocument<UserRecord>(`${collectionName}/${identifier}`);
  if (directDoc) {
    return identifier;
  }

  return null;
};

export const userService = {
  getUserByUid: async (uid: string, email?: string): Promise<UserRecord | null> => {
    const results = await queryCollection<UserRecord>(collectionName, [
      { field: 'uid', operator: '==', value: uid },
    ]);
    if (results.length > 0) {
      return results[0];
    }

    if (email) {
      const emailResults = await queryCollection<UserRecord>(collectionName, [
        { field: 'email', operator: '==', value: email },
      ]);
      return emailResults[0] ?? null;
    }

    return null;
  },
  listUsers: async (): Promise<UserRecord[]> => {
    return listCollection<UserRecord>(collectionName);
  },
  createUser: async ({ name, email, role }: { name: string; email: string; role: 'admin' | 'user' }) => {
    const timestamp = Date.now();
    await createDocument(collectionName, {
      name,
      email,
      role,
      isActive: true,
      createdAt: timestamp,
      updatedAt: timestamp,
    });
  },
  updateUserStatus: async (identifier: string, isActive: boolean) => {
    const docId = await resolveUserDocId(identifier);
    if (!docId) {
      throw new Error('User document not found');
    }
    await updateDocument(`${collectionName}/${docId}`, {
      isActive,
      updatedAt: Date.now(),
    });
  },
  softDeleteUser: async (identifier: string) => {
    const docId = await resolveUserDocId(identifier);
    if (!docId) {
      throw new Error('User document not found');
    }
    await updateDocument(`${collectionName}/${docId}`, {
      isActive: false,
      deletedAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
};

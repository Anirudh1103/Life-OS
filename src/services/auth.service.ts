import { onAuthStateChanged, sendPasswordResetEmail, signInWithEmailAndPassword, signOut as firebaseSignOut, User as FirebaseUser } from 'firebase/auth';
import { auth } from '@/services/firebase';
import { userService } from '@/services/user.service';
import { AuthUser } from '@/types/firestore';

const mapFirebaseUser = async (user: FirebaseUser): Promise<AuthUser | null> => {
  const profile = await userService.getUserByUid(user.uid, user.email ?? undefined);
  if (!profile) {
    return null;
  }
  return {
    ...profile,
    uid: user.uid,
    email: user.email ?? profile.email,
  };
};

export const authService = {
  login: async ({ email, password }: { email: string; password: string }) => {
    const result = await signInWithEmailAndPassword(auth, email, password);
    return mapFirebaseUser(result.user);
  },
  signOut: async () => {
    await firebaseSignOut(auth);
  },
  sendPasswordReset: async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  },
  onAuthStateChange: (callback: (user: AuthUser | null) => void) => {
    return onAuthStateChanged(auth, async (user) => {
      if (!user) {
        callback(null);
        return;
      }
      const profile = await mapFirebaseUser(user);
      callback(profile);
    });
  },
};

import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { firebaseConfig } from '../src/lib/firebase';

// Firebase is initialized once in src/lib/firebase.ts; this module re-exports it
// so existing `@/lib/firebase` imports keep working.
export { app, auth, db, storage, isFirebaseConfigured } from '../src/lib/firebase';

/**
 * Creates a throw-away second Firebase app so an admin can create a new user
 * account without being signed out of their own session.
 */
export async function withSecondaryAuth<T>(
  run: (secondaryAuth: ReturnType<typeof getAuth>) => Promise<T>
): Promise<T> {
  const secondary = initializeApp(firebaseConfig, `secondary-${Date.now()}`);
  try {
    return await run(getAuth(secondary));
  } finally {
    await deleteApp(secondary);
  }
}

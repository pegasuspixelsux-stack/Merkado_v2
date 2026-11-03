import { getUploadAuthParams } from '@imagekit/next/server';

// Returns short-lived ImageKit upload credentials (token, expire, signature).
// The private key stays on the server. Only signed-in, active staff may call this:
// the caller's Firebase ID token must be valid and have an active `users/{uid}` profile.

const API_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

async function verifyStaff(idToken: string): Promise<boolean> {
  if (!API_KEY || !PROJECT_ID) return false;

  // 1. Is the Firebase ID token valid, and whose is it?
  const lookup = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken }),
    }
  );
  if (!lookup.ok) return false;
  const uid: string | undefined = (await lookup.json()).users?.[0]?.localId;
  if (!uid) return false;

  // 2. Read their profile with their own token, so Firestore security rules apply.
  const profile = await fetch(
    `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/users/${uid}`,
    { headers: { Authorization: `Bearer ${idToken}` } }
  );
  if (!profile.ok) return false;
  const fields = (await profile.json()).fields ?? {};
  return fields.active?.booleanValue !== false && Boolean(fields.role?.stringValue);
}

export async function GET(request: Request) {
  const privateKey = process.env.IMAGEKIT_PRIVATE_KEY;
  const publicKey = process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY;
  if (!privateKey || !publicKey) {
    return Response.json({ error: 'ImageKit is not configured on the server.' }, { status: 500 });
  }

  const idToken = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  if (!idToken || !(await verifyStaff(idToken))) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { token, expire, signature } = getUploadAuthParams({ privateKey, publicKey });

  return Response.json(
    { token, expire, signature, publicKey },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}

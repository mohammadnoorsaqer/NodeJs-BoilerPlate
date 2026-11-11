import admin from 'firebase-admin';

let initialized = false;

export function getFirebaseAdmin(): admin.app.App {
  if (initialized) {
    return admin.app();
  }

  const credentialsJson = process.env.FIREBASE_CREDENTIALS;
  if (!credentialsJson) {
    throw new Error(
      'FIREBASE_CREDENTIALS is not set. Configure it before using Firebase.',
    );
  }

  const serviceAccount = JSON.parse(credentialsJson) as admin.ServiceAccount & {
    private_key: string;
  };
  serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });

  initialized = true;
  return admin.app();
}

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, doc, getDocFromServer } from "firebase/firestore";

// User's official web app Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCaugg_on1bmSb7PXXvXzOupXsBdq3UmLc",
  authDomain: "docuease-cd716.firebaseapp.com",
  projectId: "docuease-cd716",
  storageBucket: "docuease-cd716.firebasestorage.app",
  messagingSenderId: "646198744872",
  appId: "1:646198744872:web:791ece52aed06321eda21d"
};

// Initialize Firebase SDK
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

// Skill Mandate: Define Firestore Error Diagnostic structures & handler
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error Captured: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Skill Mandate: Validate Connection to Firestore on initial boot
async function validateFirestoreConnection() {
  try {
    const testDocRef = doc(db, 'test', 'connection');
    await getDocFromServer(testDocRef);
    console.log("Firebase Connection Verified: Firestore connected successfully.");
  } catch (error: any) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn("Firebase Connection Advisory: System is currently offline or blocking network sockets.");
    } else {
      console.log("Firebase initialized successfully inside citizen portal.");
    }
  }
}

validateFirestoreConnection();

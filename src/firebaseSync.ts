import { doc, getDoc, setDoc, getDocFromServer } from 'firebase/firestore';
import { db, auth } from './driveBackup';
import { Member, KixLog } from './types';

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
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export interface SavedStatePayload {
  members: Member[];
  logs: KixLog[];
  payoutsCompleted: { [month: string]: boolean };
  currentMonth: number;
  appConfig: any;
  updatedAt: string;
}

const STATE_DOC_PATH = 'kix_fundo/state';

// Validate connection on start as per CRITICAL CONSTRAINT
export async function testFirestoreConnection() {
  try {
    await getDocFromServer(doc(db, 'kix_fundo', 'state'));
    console.log("Validação de Conexão com Firestore Efetuada.");
  } catch (error) {
    if (error instanceof Error && error.message.includes('offline')) {
      console.warn("Firestore está operando em cache local/offline.");
    }
  }
}

export async function loadStateFromFirestore(): Promise<SavedStatePayload | null> {
  try {
    const docRef = doc(db, 'kix_fundo', 'state');
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as SavedStatePayload;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, STATE_DOC_PATH);
    return null;
  }
}

export async function saveStateToFirestore(payload: Omit<SavedStatePayload, 'updatedAt'>): Promise<void> {
  try {
    const docRef = doc(db, 'kix_fundo', 'state');
    const fullPayload: SavedStatePayload = {
      ...payload,
      updatedAt: new Date().toISOString()
    };
    await setDoc(docRef, fullPayload);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, STATE_DOC_PATH);
  }
}

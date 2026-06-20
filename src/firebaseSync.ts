import { doc, getDoc, setDoc, getDocFromServer, collection, addDoc, getDocs, deleteDoc, query, orderBy, writeBatch } from 'firebase/firestore';
import { db, auth } from './driveBackup';
import { Member, KixLog, Loan } from './types';

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
  loans?: Loan[];
  payoutsCompleted: { [month: string]: boolean };
  currentMonth: number;
  appConfig: any;
  updatedAt: string;
}

export interface FirestoreBackupPoint {
  id: string;
  name: string;
  type: 'automatic' | 'manual';
  frequency?: 'daily' | 'weekly' | 'manual';
  createdAt: string;
  createdBy: string;
  payload: SavedStatePayload;
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
    const sanitizedPayload = JSON.parse(JSON.stringify(fullPayload));
    await setDoc(docRef, sanitizedPayload);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, STATE_DOC_PATH);
  }
}

// Save a Restore Point to Firestore
export async function saveBackupToFirestore(
  name: string,
  payload: Omit<SavedStatePayload, 'updatedAt'>,
  type: 'automatic' | 'manual',
  frequency?: 'daily' | 'weekly' | 'manual'
): Promise<void> {
  try {
    const fullPayload: SavedStatePayload = {
      ...payload,
      updatedAt: new Date().toISOString()
    };
    const backupPoint: Omit<FirestoreBackupPoint, 'id'> = {
      name,
      type,
      frequency: frequency || 'manual',
      createdAt: new Date().toISOString(),
      createdBy: auth.currentUser?.email || 'Administrador Coletivo',
      payload: fullPayload
    };
    const sanitizedBackup = JSON.parse(JSON.stringify(backupPoint));
    const collectionRef = collection(db, 'kix_fundo_backups');
    await addDoc(collectionRef, sanitizedBackup);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'kix_fundo_backups');
  }
}

// List Restore Points from Firestore
export async function listBackupsFromFirestore(): Promise<FirestoreBackupPoint[]> {
  try {
    const collectionRef = collection(db, 'kix_fundo_backups');
    const q = query(collectionRef, orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    const backups: FirestoreBackupPoint[] = [];
    querySnapshot.forEach((docSnap) => {
      backups.push({
        id: docSnap.id,
        ...(docSnap.data() as Omit<FirestoreBackupPoint, 'id'>)
      });
    });
    return backups;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'kix_fundo_backups');
    return [];
  }
}

// Delete a Restore Point from Firestore
export async function deleteBackupFromFirestore(backupId: string): Promise<void> {
  try {
    const docRef = doc(db, 'kix_fundo_backups', backupId);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `kix_fundo_backups/${backupId}`);
  }
}


import { initializeApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User } from 'firebase/auth';
import { initializeFirestore, memoryLocalCache, setLogLevel } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

// Inicializar aplicativo do Firebase com configurações persistentes
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Silenciar logs internos do SDK do Firestore
try {
  setLogLevel('silent');
} catch (e) {
  // Ignorar erros na configuração silenciosa
}

export const db = initializeFirestore(app, {
  localCache: memoryLocalCache()
}, (firebaseConfig as any).firestoreDatabaseId);

const provider = new GoogleAuthProvider();
// Escopo de menor privilégio para ver, gerenciar e ler ficheiros criados pela própria aplicação
provider.addScope('https://www.googleapis.com/auth/drive.file');

let cachedAccessToken: string | null = null;
let isSigningIn = false;

/**
 * Inicializa e subscreve-se ao listener do estado de autenticação do Firebase.
 * Recupera e gere o token de acesso exclusivo para as solicitações da API Google Drive.
 */
export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else {
        const savedToken = sessionStorage.getItem('gdrive_access_token');
        if (savedToken) {
          cachedAccessToken = savedToken;
          if (onAuthSuccess) onAuthSuccess(user, savedToken);
        } else {
          if (onAuthFailure) onAuthFailure();
        }
      }
    } else {
      cachedAccessToken = null;
      sessionStorage.removeItem('gdrive_access_token');
      if (onAuthFailure) onAuthFailure();
    }
  });
};

/**
 * Dispara pop-up de Login do Google para obter o utilizador e o token de acesso.
 */
export const googleSignIn = async () => {
  if (isSigningIn) return null;
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Falha ao obter token de acesso Google Drive.');
    }
    cachedAccessToken = credential.accessToken;
    sessionStorage.setItem('gdrive_access_token', cachedAccessToken);
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error) {
    console.error('Google Sign-In Error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

/**
 * Executa o encerramento da sessão de backup do Google Drive.
 */
export const logoutGDrive = async () => {
  await auth.signOut();
  cachedAccessToken = null;
  sessionStorage.removeItem('gdrive_access_token');
};

/**
 * Realiza o upload de um ficheiro JSON de backup para o Google Drive do administrador.
 */
export const uploadBackup = async (accessToken: string, backupData: any) => {
  const dateStr = new Date().toLocaleString('pt-AO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).replace(/[\/\s:]/g, '_');

  const fileName = `kix_fundo_backup_${dateStr}.json`;

  const metadata = {
    name: fileName,
    mimeType: 'application/json',
    description: 'Cópia de segurança das finanças do Kix-Fundo - Restaurável via Painel.',
  };

  const boundary = 'kix_fundo_boundary_system';
  const delimiter = `\r\n--${boundary}\r\n`;
  const close_delim = `\r\n--${boundary}--`;

  const multipartRequestBody =
    delimiter +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    JSON.stringify(metadata) +
    delimiter +
    'Content-Type: application/json\r\n\r\n' +
    JSON.stringify(backupData) +
    close_delim;

  const response = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body: multipartRequestBody,
    }
  );

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Falha no upload do backup: ${response.statusText} - ${errText}`);
  }

  return await response.json();
};

/**
 * Lista todos os backups armazenados pelo aplicativo no Google Drive.
 */
export const listBackups = async (accessToken: string) => {
  const qStr = "name contains 'kix_fundo_backup_' and mimeType = 'application/json' and trashed = false";
  const q = encodeURIComponent(qStr);
  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${q}&orderBy=createdTime desc&fields=files(id,name,createdTime,size)&pageSize=50`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Falha ao obter backups: ${response.statusText} - ${errText}`);
  }

  const data = await response.json();
  return data.files || [];
};

/**
 * Descarrega o conteúdo JSON de um backup do Google Drive usando seu fileId.
 */
export const downloadBackupContent = async (accessToken: string, fileId: string) => {
  const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Falha ao carregar conteúdos do backup: ${response.statusText}`);
  }

  return await response.json();
};

/**
 * Apaga um backup do Google Drive.
 */
export const deleteBackupFile = async (accessToken: string, fileId: string) => {
  const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Falha ao apagar backup: ${response.statusText}`);
  }

  return true;
};

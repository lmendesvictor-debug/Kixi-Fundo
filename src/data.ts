import { Member, KixLog } from './types';

export const INITIAL_MEMBERS: Member[] = [
  {
    id: 1,
    name: 'Mendes Victor (Admin)',
    phone: '+244 923 000 000',
    email: 'lmendesvictor@gmail.com',
    avatarColor: 'bg-emerald-600',
    assignedMonth: 1,
    role: 'admin',
    tempPassword: 'Historia100',
    bankIban: 'AO06.0006.0001.0002.0003.0004.5',
    contributions: {},
    benefits: {},
    socialSupportReceived: 0,
  }
];

export const INITIAL_LOGS: KixLog[] = [
  {
    id: 'log-initial',
    timestamp: new Date().toISOString(),
    type: 'cycle_change',
    amount: 0,
    description: 'Fundo de Poupança Kix-Fundo inicializado com sucesso para o ciclo operacional ativo.',
    month: 1,
  }
];

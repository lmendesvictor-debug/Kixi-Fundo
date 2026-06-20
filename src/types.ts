export interface Member {
  id: number;
  name: string;
  phone: string;
  email: string;
  bankIban?: string;
  avatarColor: string;
  avatarImage?: string; // Base64 dataURL for custom uploaded pictures
  role?: 'admin' | 'membro'; // 'admin' or 'membro'
  tempPassword?: string; // temporary password defined by administrator
  assignedMonth: number; // 1 to 6 (the month when they receive the 600,000.00)
  permissions?: {
    accessInicio?: boolean;
    accessDashboard?: boolean;
    accessMembersList?: boolean;
    accessCycles?: boolean;
    accessSocial?: boolean;
    accessAudit?: boolean;
    accessAdminModule?: boolean;
    accessReports?: boolean;
    accessContracts?: boolean;
    actionRegisterPayments?: boolean;
    actionGrantSocialAid?: boolean;
    actionIssueCredits?: boolean;
    actionManageSlides?: boolean;
    actionManageBackups?: boolean;
    actionResetPasswords?: boolean;
  };
  contributions: {
    [month: number]: {
      paid: boolean;
      paidAt?: string;
      receiptFileName?: string;
      receiptFileSize?: string;
      receiptUploadedAt?: string;
      amount?: number;
    };
  };
  benefits: {
    [month: number]: {
      received: boolean;
      amount: number;
      paidAt?: string;
    };
  };
  socialSupportReceived: number;
}

export interface KixLog {
  id: string;
  timestamp: string;
  type: 'contribution' | 'payout' | 'social_aid' | 'cycle_change' | 'password_reset' | 'policy_change' | 'member_management';
  memberName?: string;
  amount: number;
  description: string;
  month: number;
  transactionCode?: string; // codificaçao automatica ex. DEP.01, PAG.01, AJUDA.01 (Imutável)
}

export interface KixState {
  currentMonth: number;
  members: Member[];
  socialFundaIdBalance: number; // Accumulated Interajuda pool
  logs: KixLog[];
}

/**
 * Gera um ID único e intransmissível para cada membro,
 * determinadamente associado ao Nome Completo e Número de Telefone (chaves primárias).
 */
export function getMemberIdCode(name: string, phone: string): string {
  if (!name || !phone) return 'KIX-TEMP-0000';
  
  // Normaliza o nome (remove acentos, coloca em maísculas)
  const cleanName = name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().trim();
  const nameParts = cleanName.split(/\s+/).filter(Boolean);
  
  // Obtém as iniciais (primeiro e último nome se houver)
  let initials = 'KX';
  if (nameParts.length >= 2) {
    initials = (nameParts[0][0] || '') + (nameParts[nameParts.length - 1][0] || '');
  } else if (nameParts.length === 1 && nameParts[0]) {
    initials = nameParts[0].substring(0, 2);
  }
  
  // Extrai apenas dígitos do número de telefone e pega os últimos 4 dígitos
  const cleanPhone = phone.replace(/\D/g, '');
  const phoneSuffix = cleanPhone.length >= 4 
    ? cleanPhone.substring(cleanPhone.length - 4) 
    : cleanPhone.padStart(4, '0');
  
  // Gera um Hash numérico simples e determinístico com base nas chaves primárias (Nome + Telefone)
  let hash = 17;
  const keySource = `${cleanName}::${cleanPhone}`;
  for (let i = 0; i < keySource.length; i++) {
    hash = (hash * 31 + keySource.charCodeAt(i)) & 0xffff;
  }
  const checksum = hash.toString(16).toUpperCase().padStart(4, '0');
  
  return `KIX-${initials.toUpperCase()}-${phoneSuffix}-${checksum}`;
}

/**
 * Retorna o ID de formato simplificado e imutável do acto de cadastro do membro.
 */
export function getMemberDisplayCode(id: number): string {
  if (!id) return 'MEMB.00';
  return `MEMB.${String(id).padStart(2, '0')}`;
}

export interface CarouselSlide {
  id: string;
  image: string;
  title: string;
  description: string;
  tag?: string;
}

export interface LoanPayment {
  month: number; // e.g. Month 1, Month 2
  dueDate: string;
  amount: number; // total monthly installment
  interestPaid: number;
  principalPaid: number;
  paid: boolean;
  paidAt?: string;
}

export interface Loan {
  id: string; // unique contract code L-XXXX
  borrowerName: string;
  borrowerType: 'socio' | 'singular';
  memberId?: number; // linked member ID if borrowerType is 'socio'
  documentId: string; // BI / NIF
  phone: string;
  email: string;
  amountRequested: number;
  interestRate: number; // monthly interest rate (e.g. 6%)
  durationMonths: number; // duration (1 to 12 months)
  guarantees: string; // collateral or physical guarantee
  status: 'active' | 'completed' | 'overdue';
  contractDate: string;
  payments: LoanPayment[];
  representativeName?: string;
  customLegalTerms?: string;
}

export interface AppConfig {
  bankName: string;
  bankIban: string;
  phone: string;
  email: string;
  showFlowChart?: boolean;
  showAllocationChart?: boolean;
  showStatsCards?: boolean;
  chartColorTheme?: 'teal' | 'indigo' | 'coral' | 'amber';
  customDashboardMessage?: string;
  fontFamily?: 'inter' | 'outfit' | 'mono' | 'playfair' | 'space';
  fontSize?: 'compact' | 'normal' | 'medium' | 'large' | 'xlarge';
  primaryColorTheme?: 'emerald' | 'indigo' | 'slate' | 'teal' | 'coral' | 'amber' | 'violet' | 'bordeaux' | 'royal_plum' | 'fire_coral' | 'dark_zinc' | 'solid_navy' | 'sky_frost' | 'ocean_teal';
  adminPrivilegeCanDelete?: boolean;
  adminPrivilegeCanRefund?: boolean;
  adminPrivilegeCanForcePayout?: boolean;
  contractClauseJuros?: string;
  contractClauseMultas?: string;
  contractClauseGarantias?: string;
  contractTemplateWhole?: string;
  contractRepresentativeName?: string;
  autoBackUpGDrive?: boolean;
  autoBackupSchedule?: 'off' | 'daily' | 'weekly';
  lastAutoBackupFirestore?: string;
  lastAutoBackupGDrive?: string;
}

import { Member, KixLog, Loan } from './types';

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

export const INITIAL_LOANS: Loan[] = [
  {
    id: 'L-1001-SIN',
    borrowerName: 'José Cirilo',
    borrowerType: 'singular',
    documentId: '005432109LA041',
    phone: '+244 923 111 222',
    email: 'jose.cirilo@kixfundo.ao',
    amountRequested: 40000,
    interestRate: 6,
    durationMonths: 3,
    installmentsCount: 3,
    guarantees: 'Declaração de Penhor Pessoal e Promissória',
    purpose: 'Crédito de Apoio Pessoal',
    guarantorName: 'Mendes Victor',
    status: 'active',
    contractDate: '01/02/2026',
    representativeName: 'Mendes Victor (Admin)',
    payments: [
      { month: 1, dueDate: '01/03/2026', amount: 15733.33, interestPaid: 2400, principalPaid: 13333.33, paid: false },
      { month: 2, dueDate: '01/04/2026', amount: 15733.33, interestPaid: 2400, principalPaid: 13333.33, paid: false },
      { month: 3, dueDate: '01/05/2026', amount: 15733.34, interestPaid: 2400, principalPaid: 13333.34, paid: false },
    ]
  },
  {
    id: 'L-1002-SIN',
    borrowerName: 'Andrade Bondo',
    borrowerType: 'singular',
    documentId: '006789123LA042',
    phone: '+244 924 222 333',
    email: 'andrade.bondo@kixfundo.ao',
    amountRequested: 50000,
    interestRate: 6,
    durationMonths: 3,
    installmentsCount: 3,
    guarantees: 'Termo de Responsabilidade e Fiança Financeira',
    purpose: 'Fundo de Maneio',
    status: 'active',
    contractDate: '05/02/2026',
    representativeName: 'Mendes Victor (Admin)',
    payments: [
      { month: 1, dueDate: '05/03/2026', amount: 19666.67, interestPaid: 3000, principalPaid: 16666.67, paid: false },
      { month: 2, dueDate: '05/04/2026', amount: 19666.67, interestPaid: 3000, principalPaid: 16666.67, paid: false },
      { month: 3, dueDate: '05/05/2026', amount: 19666.66, interestPaid: 3000, principalPaid: 16666.66, paid: false },
    ]
  },
  {
    id: 'L-1003-SIN',
    borrowerName: 'Lázaro Pombal',
    borrowerType: 'singular',
    documentId: '007891234LA043',
    phone: '+244 925 333 444',
    email: 'lazaro.pombal@kixfundo.ao',
    amountRequested: 10000,
    interestRate: 6,
    durationMonths: 2,
    installmentsCount: 2,
    guarantees: 'Promissória de Pagamento Directo',
    purpose: 'Microcrédito de Emergência',
    status: 'active',
    contractDate: '10/02/2026',
    representativeName: 'Mendes Victor (Admin)',
    payments: [
      { month: 1, dueDate: '10/03/2026', amount: 5600, interestPaid: 600, principalPaid: 5000, paid: false },
      { month: 2, dueDate: '10/04/2026', amount: 5600, interestPaid: 600, principalPaid: 5000, paid: false },
    ]
  },
  {
    id: 'L-1004-SIN',
    borrowerName: 'Gonçalves Luiba',
    borrowerType: 'singular',
    documentId: '008912345LA044',
    phone: '+244 926 444 555',
    email: 'goncalves.luiba@kixfundo.ao',
    amountRequested: 300000,
    interestRate: 6,
    durationMonths: 6,
    installmentsCount: 6,
    guarantees: 'Garantia Real / Registo de Propriedade de Veículo',
    purpose: 'Investimento Comercial',
    status: 'active',
    contractDate: '15/01/2026',
    representativeName: 'Mendes Victor (Admin)',
    payments: [
      { month: 1, dueDate: '15/02/2026', amount: 68000, interestPaid: 18000, principalPaid: 50000, paid: false },
      { month: 2, dueDate: '15/03/2026', amount: 68000, interestPaid: 18000, principalPaid: 50000, paid: false },
      { month: 3, dueDate: '15/04/2026', amount: 68000, interestPaid: 18000, principalPaid: 50000, paid: false },
      { month: 4, dueDate: '15/05/2026', amount: 68000, interestPaid: 18000, principalPaid: 50000, paid: false },
      { month: 5, dueDate: '15/06/2026', amount: 68000, interestPaid: 18000, principalPaid: 50000, paid: false },
      { month: 6, dueDate: '15/07/2026', amount: 68000, interestPaid: 18000, principalPaid: 50000, paid: false },
    ]
  },
  {
    id: 'L-1005-SIN',
    borrowerName: 'Eugénio Pangungo',
    borrowerType: 'singular',
    documentId: '009123456LA045',
    phone: '+244 927 555 666',
    email: 'eugenio.pangungo@kixfundo.ao',
    amountRequested: 100000,
    interestRate: 6,
    durationMonths: 4,
    installmentsCount: 4,
    guarantees: 'Termo de Fiança e Avalista Coletivo',
    purpose: 'Expansão de Negócio',
    status: 'active',
    contractDate: '01/02/2026',
    representativeName: 'Mendes Victor (Admin)',
    payments: [
      { month: 1, dueDate: '01/03/2026', amount: 31000, interestPaid: 6000, principalPaid: 25000, paid: false },
      { month: 2, dueDate: '01/04/2026', amount: 31000, interestPaid: 6000, principalPaid: 25000, paid: false },
      { month: 3, dueDate: '01/05/2026', amount: 31000, interestPaid: 6000, principalPaid: 25000, paid: false },
      { month: 4, dueDate: '01/06/2026', amount: 31000, interestPaid: 6000, principalPaid: 25000, paid: false },
    ]
  },
  {
    id: 'L-1006-SIN',
    borrowerName: 'Suzana Epalanga',
    borrowerType: 'singular',
    documentId: '001234567LA046',
    phone: '+244 928 666 777',
    email: 'suzana.epalanga@kixfundo.ao',
    amountRequested: 100000,
    interestRate: 6,
    durationMonths: 4,
    installmentsCount: 4,
    guarantees: 'Termo de Garantia Complementar de Rendimentos',
    purpose: 'Apoio Pessoal e Familiar',
    status: 'active',
    contractDate: '01/02/2026',
    representativeName: 'Mendes Victor (Admin)',
    payments: [
      { month: 1, dueDate: '01/03/2026', amount: 31000, interestPaid: 6000, principalPaid: 25000, paid: false },
      { month: 2, dueDate: '01/04/2026', amount: 31000, interestPaid: 6000, principalPaid: 25000, paid: false },
      { month: 3, dueDate: '01/05/2026', amount: 31000, interestPaid: 6000, principalPaid: 25000, paid: false },
      { month: 4, dueDate: '01/06/2026', amount: 31000, interestPaid: 6000, principalPaid: 25000, paid: false },
    ]
  }
];

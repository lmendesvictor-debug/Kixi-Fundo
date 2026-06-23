import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Wallet,
  Users,
  Coins,
  ShieldCheck,
  CheckCircle,
  AlertCircle,
  HelpCircle,
  ArrowRight,
  Sparkles,
  Download,
  LogOut,
  HeartHandshake,
  Sun,
  Moon,
  FileText,
  TrendingUp,
  Plus,
  Trash2,
  Edit,
  ChevronLeft,
  ChevronRight,
  Compass,
  BookOpen,
  Cloud,
  CloudOff,
  RefreshCw,
  Search,
  X,
  ChevronDown,
  Calendar,
  Check,
  Menu,
} from 'lucide-react';

import { Member, KixLog, CarouselSlide, getMemberIdCode, Loan, AppConfig } from './types';
import { INITIAL_MEMBERS, INITIAL_LOGS } from './data';
import MetricCards from './components/MetricCards';
import SchedulesGrid from './components/SchedulesGrid';
import MembersTable from './components/MembersTable';
import SocialFundSection from './components/SocialFundSection';
import LedgerLogs from './components/LedgerLogs';
import BankingReport from './components/BankingReport';
import ReceiptsAutomation from './components/ReceiptsAutomation';
import ReportsSection from './components/ReportsSection';
import PaymentsLedger from './components/PaymentsLedger';

import LoginScreen from './components/LoginScreen';
import MemberProfileWorkspace from './components/MemberProfileWorkspace';
import InteractiveCharts from './components/InteractiveCharts';
import UserManagement from './components/UserManagement';
import AdminModule from './components/AdminModule';
import RegulationsModal from './components/RegulationsModal';
import CreditManagement from './components/CreditManagement';
import ContractsTab from './components/ContractsTab';
import IbanQrCodeWidget from './components/IbanQrCodeWidget';

import { 
  testFirestoreConnection, 
  loadStateFromFirestore, 
  saveStateToFirestore 
} from './firebaseSync';
import { doc, onSnapshot, disableNetwork, enableNetwork } from 'firebase/firestore';
import { db } from './driveBackup';

interface AppUser {
  email: string;
  role: 'admin' | 'membro';
  memberId?: number;
  name: string;
}

const DEFAULT_CAROUSEL_SLIDES: CarouselSlide[] = [
  {
    id: 'slide-1',
    image: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&h=600&q=80',
    title: 'Acções de Apoio Social Coletivo',
    description: 'Trabalhando juntos com rigor, integridade e solidariedade recíproca. Canalizando fundos para o desenvolvimento das comunidades cooperadoras.',
    tag: 'DESTAQUE'
  },
  {
    id: 'slide-2',
    image: 'https://images.unsplash.com/photo-1559136555-9303baea8ebd?auto=format&fit=crop&w=1200&h=600&q=80',
    title: 'Assembleia de Sócios Compartidos',
    description: 'Tomada de decisões democrática sobre percentagens de contribuição e aprovação de novos membros beneficiários com segurança fiscal.',
    tag: 'GOVERNANÇA'
  },
  {
    id: 'slide-3',
    image: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1200&h=600&q=80',
    title: 'Rendimento Rotativo Transparente',
    description: 'Prestação trimestral aberta com relatórios em directo e conciliações automáticas de cada provisão de capital recolhido.',
    tag: 'AUDITORIA'
  },
  {
    id: 'slide-4',
    image: 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?auto=format&fit=crop&w=1200&h=600&q=80',
    title: 'Poupança Coletiva & Multiplicação',
    description: 'Gestão patrimonial orientada para dar suporte, rentabilidade e microcrédito rotativo a todos os cooperadores.',
    tag: 'CRESCIMENTO'
  },
  {
    id: 'slide-5',
    image: 'https://images.unsplash.com/photo-1544377193-33dcf4d68fb5?auto=format&fit=crop&w=1200&h=600&q=80',
    title: 'Trajectória de Crescimento',
    description: 'Atingindo metas sólidas de poupança com progresso contínuo e acumulação de fundos de estabilidade.',
    tag: 'PROGRESSO'
  },
  {
    id: 'slide-6',
    image: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=1200&h=600&q=80',
    title: 'Análise de Balanços Trimestrais',
    description: 'Visibilidade total no crescimento patrimonial e nas contas gerais integradas.',
    tag: 'TESOURARIA'
  }
];

export default function App() {
  const [currentUser, setCurrentUser] = useState<AppUser | null>(() => {
    const saved = localStorage.getItem('kix_current_user');
    if (saved) {
      try { return JSON.parse(saved); } catch {}
    }
    return null;
  });
  const [isLoadingDb, setIsLoadingDb] = useState<boolean>(true);
  const [isInitialLoadCompleted, setIsInitialLoadCompleted] = useState<boolean>(false);
  const [dbLoadedSuccessfully, setDbLoadedSuccessfully] = useState<boolean>(false);
  const [currentMonth, setCurrentMonth] = useState<number>(() => {
    return Number(localStorage.getItem('kix_current_month') || '1');
  });
  const [members, _setMembers] = useState<Member[]>(() => {
    const saved = localStorage.getItem('kix_members');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 1) {
          const FICTITIOUS_EMAILS = [
            'sgabriel@gmail.com',
            'delfina.antonio@gmail.com',
            'carlos.silva@gmail.com',
            'ana.vicente@gmail.com'
          ];
          const filtered = parsed.filter(
            (m: any) => !FICTITIOUS_EMAILS.includes((m.email || '').trim().toLowerCase())
          );
          if (filtered.length > 1) {
            return filtered;
          }
        }
      } catch {}
    }
    return INITIAL_MEMBERS;
  });

  const resolveConflict = (
    localUpdatedAt: string | null,
    remoteUpdatedAt: string | null
  ): 'use_local' | 'use_remote' | 'equal' => {
    if (!remoteUpdatedAt) return 'use_local';
    if (!localUpdatedAt) return 'use_remote';

    const localTime = new Date(localUpdatedAt).getTime();
    const remoteTime = new Date(remoteUpdatedAt).getTime();

    if (isNaN(localTime)) return 'use_remote';
    if (isNaN(remoteTime)) return 'use_local';

    if (localTime > remoteTime) {
      console.log(`[Conflict Resolution] Local timestamp (${localUpdatedAt}) is NEWER than remote (${remoteUpdatedAt}). Preserving local changes over stale remote ones.`);
      return 'use_local';
    } else if (remoteTime > localTime) {
      console.log(`[Conflict Resolution] Remote timestamp (${remoteUpdatedAt}) is NEWER than local (${localUpdatedAt}). Standard update is safe.`);
      return 'use_remote';
    }
    return 'equal';
  };

  const reconcileMembers = (prevMembers: Member[], nextMembers: Member[]): Member[] => {
    return nextMembers.map((nextM: Member) => {
      const prevM = prevMembers.find((p) => p.id === nextM.id);
      if (!prevM) return nextM;
      
      const nextContribs = { ...nextM.contributions };
      let loanEarningsBalance = (nextM as any).loanEarningsBalance || 0;
      
      for (let mNum = 1; mNum <= 6; mNum++) {
        const prevPaid = prevM.contributions[mNum]?.paid || false;
        const nextPaid = nextM.contributions[mNum]?.paid || false;
        
        if (!prevPaid && nextPaid) {
          if (loanEarningsBalance > 0) {
            const currentAmount = nextContribs[mNum]?.amount !== undefined 
              ? (nextContribs[mNum] as any).amount 
              : 120000;
              
            nextContribs[mNum] = {
              ...nextContribs[mNum],
              paid: true,
              amount: currentAmount + loanEarningsBalance
            };
            loanEarningsBalance = 0;
          }
        } else if (prevPaid && !nextPaid) {
          const prevAmount = prevM.contributions[mNum]?.amount !== undefined 
            ? (prevM.contributions[mNum] as any).amount 
            : 120000;
            
          const extra = prevAmount - 120000;
          if (extra > 0) {
            loanEarningsBalance += extra;
          }
          if (nextContribs[mNum]) {
            const { amount, ...rest } = nextContribs[mNum] as any;
            nextContribs[mNum] = { ...rest, paid: false };
          }
        }
      }
      
      return {
        ...nextM,
        loanEarningsBalance,
        contributions: nextContribs
      };
    });
  };

  const setMembers = (update: any) => {
    _setMembers((prevMembers) => {
      const nextMembersRaw = typeof update === 'function' ? update(prevMembers) : update;
      return reconcileMembers(prevMembers, nextMembersRaw);
    });
  };
  const [logs, setLogs] = useState<KixLog[]>(() => {
    const saved = localStorage.getItem('kix_logs');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 1) return parsed;
      } catch {}
    }
    return INITIAL_LOGS;
  });
  
  const [loans, setLoans] = useState<Loan[]>(() => {
    const saved = localStorage.getItem('kix_loans');
    const FICTITIOUS_EMAILS = [
      'sgabriel@gmail.com',
      'delfina.antonio@gmail.com',
      'carlos.silva@gmail.com',
      'ana.vicente@gmail.com'
    ];
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.filter(l => !FICTITIOUS_EMAILS.includes((l.email || '').trim().toLowerCase()));
        }
      } catch {}
    }
    return [];
  });

  const unsubscribeRef = useRef<(() => void) | null>(null);

  const [activeTab, setActiveTab] = useState<string>('inicio');
  const [isDbSyncing, setIsDbSyncing] = useState<boolean>(false);
  const isFirestoreQuotaExceededRef = useRef<boolean>(false);
  const [isFirestoreQuotaExceeded, _setIsFirestoreQuotaExceeded] = useState<boolean>(() => {
    const saved = localStorage.getItem('kix_firestore_quota_exceeded');
    if (saved === 'true') {
      const timestamp = localStorage.getItem('kix_firestore_quota_exceeded_time');
      if (timestamp) {
        const diff = Date.now() - Number(timestamp);
        // Reset after 24 hours (daily quota cycle) to try syncing again, otherwise maintain true
        if (diff < 24 * 60 * 60 * 1000) {
          isFirestoreQuotaExceededRef.current = true;
          try {
            disableNetwork(db).catch(() => {});
          } catch (e) {}
          return true;
        }
      } else {
        isFirestoreQuotaExceededRef.current = true;
        try {
          disableNetwork(db).catch(() => {});
        } catch (e) {}
        return true;
      }
    }
    return false;
  });

  const setIsFirestoreQuotaExceeded = (val: boolean) => {
    _setIsFirestoreQuotaExceeded(val);
    isFirestoreQuotaExceededRef.current = val;
    if (val) {
      localStorage.setItem('kix_firestore_quota_exceeded', 'true');
      localStorage.setItem('kix_firestore_quota_exceeded_time', String(Date.now()));
      if (unsubscribeRef.current) {
        console.warn("Unsubscribing from real-time listener due to quota exceeded transition!");
        try {
          unsubscribeRef.current();
          unsubscribeRef.current = null;
        } catch (e) {
          // Ignore
        }
      }
      disableNetwork(db).catch(err => {
        console.warn("Could not disable Firestore network:", err);
      });
    } else {
      localStorage.removeItem('kix_firestore_quota_exceeded');
      localStorage.removeItem('kix_firestore_quota_exceeded_time');
      enableNetwork(db).catch(err => {
        console.warn("Could not enable Firestore network:", err);
      });
    }
  };

  useEffect(() => {
    if (isFirestoreQuotaExceededRef.current) {
      console.warn("Quota limit detected on boot. Disabling Firestore network to prevent background errors...");
      disableNetwork(db).catch(err => {
        console.warn("Could not disable Firestore network on boot:", err);
      });
    }

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const errStr = String(event.reason);
      if (
        errStr.includes('resource-exhausted') || 
        errStr.includes('quota') || 
        errStr.includes('Quota') || 
        errStr.includes('Quota limit exceeded')
      ) {
        console.warn("Intercepted background Firestore quota exhaustion globally:", event.reason);
        // Prevent default browser behavior of raising an uncaught promise rejection error
        event.preventDefault();
        // Immediately activate the local offline cache contingency mode
        setIsFirestoreQuotaExceeded(true);
      }
    };

    const handleError = (event: ErrorEvent) => {
      const errStr = String(event.message || event.error);
      if (
        errStr.includes('resource-exhausted') || 
        errStr.includes('quota') || 
        errStr.includes('Quota') || 
        errStr.includes('Quota limit exceeded')
      ) {
        console.warn("Intercepted background Firestore quota error via error event:", event.message);
        event.preventDefault();
        setIsFirestoreQuotaExceeded(true);
      }
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    window.addEventListener('error', handleError);

    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      window.removeEventListener('error', handleError);
    };
  }, []);

  const [firestorePendingOps, setFirestorePendingOps] = useState<{ id: string; timestamp: string; description: string }[]>(() => {
    const saved = localStorage.getItem('kix_firestore_pending_ops_queue');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return [];
      }
    }
    return [];
  });

  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [menuSearchQuery, setMenuSearchQuery] = useState<string>('');
  const [cyclesSubTab, setCyclesSubTab] = useState<'ledger' | 'planner'>('ledger');
  const [simulatedMemberId, setSimulatedMemberId] = useState<number | null>(null);
  const [exitConfirm, setExitConfirm] = useState<boolean>(false);
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [showRegulations, setShowRegulations] = useState<boolean>(false);
  const [pendingSyncCount, setPendingSyncCount] = useState<number>(() => {
    return Number(localStorage.getItem('kix_pending_sync_count') || '0');
  });
  const [isSyncingPending, setIsSyncingPending] = useState<boolean>(false);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const [carouselSlides, setCarouselSlides] = useState<CarouselSlide[]>(() => {
    const saved = localStorage.getItem('kix_carousel_slides');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const hasSlide5 = parsed.some((s: any) => s.id === 'slide-5');
          const hasSlide6 = parsed.some((s: any) => s.id === 'slide-6');
          if (!hasSlide5 || !hasSlide6) {
            const updated = [...parsed];
            if (!hasSlide5) {
              updated.push({
                id: 'slide-5',
                image: 'https://images.unsplash.com/photo-1544377193-33dcf4d68fb5?auto=format&fit=crop&w=1200&h=600&q=80',
                title: 'Trajectória de Crescimento',
                description: 'Atingindo metas sólidas de poupança com progresso contínuo e acumulação de fundos de estabilidade.',
                tag: 'PROGRESSO'
              });
            }
            if (!hasSlide6) {
              updated.push({
                id: 'slide-6',
                image: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=1200&h=600&q=80',
                title: 'Análise de Balanços Trimestrais',
                description: 'Visibilidade total no crescimento patrimonial e nas contas gerais integradas.',
                tag: 'TESOURARIA'
              });
            }
            return updated;
          }
          return parsed;
        }
      } catch (e) {}
    }
    return DEFAULT_CAROUSEL_SLIDES;
  });

  const [activeSlideIndex, setActiveSlideIndex] = useState<number>(0);

  useEffect(() => {
    localStorage.setItem('kix_carousel_slides', JSON.stringify(carouselSlides));
  }, [carouselSlides]);

  useEffect(() => {
    if (carouselSlides.length <= 1) return;
    const interval = setInterval(() => {
      setActiveSlideIndex((prev) => (prev + 1) % carouselSlides.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [carouselSlides]);

  // Slides editor/management states
  const [editingSlideId, setEditingSlideId] = useState<string | null>(null);
  const [slideFormTitle, setSlideFormTitle] = useState<string>('');
  const [slideFormDesc, setSlideFormDesc] = useState<string>('');
  const [slideFormImg, setSlideFormImg] = useState<string>('');
  const [slideFormTag, setSlideFormTag] = useState<string>('DESTAQUE');
  const [showAddSlideInline, setShowAddSlideInline] = useState<boolean>(false);

  // Encontra o objeto completo do membro logado para ler as permissões dinâmicas atualizadas
  const loggedInMember = currentUser 
    ? (members.find(m => m.id === currentUser.memberId || m.email.trim().toLowerCase() === currentUser.email.trim().toLowerCase()) || members[0])
    : undefined;

  const isAllowed = (tabId: string): boolean => {
    if (!currentUser) return false;
    
    // 1. Super-administrador (lmendesvictor) has sovereign absolute power across all tabs/modules
    const isSuperAdmin = currentUser.email.trim().toLowerCase() === 'lmendesvictor@gmail.com';
    if (isSuperAdmin) return true;

    // Ambos "Minha Área" (membro-dashboard) e "Início" (inicio) não são parametrizáveis e estão sempre disponíveis para todos os utilizadores para servir de painel inicial (Dashboard) obrigatório.
    if (tabId === 'membro-dashboard' || tabId === 'inicio') return true;

    // 2. Custom permissions matrix (if initialized)
    const m = loggedInMember;
    if (m && m.permissions) {
      const getPerm = (permVal: boolean | undefined, roleDefault: boolean) => {
        return permVal !== undefined ? permVal : roleDefault;
      };
      
      const isAdminRole = currentUser.role === 'admin';
      
      if (tabId === 'inicio') return getPerm(m.permissions.accessInicio, true);
      if (tabId === 'members') return getPerm(m.permissions.accessMembersList, isAdminRole);
      if (tabId === 'cycles') return getPerm(m.permissions.accessCycles, true);
      if (tabId === 'reports') return getPerm(m.permissions.accessReports, true);
      if (tabId === 'credit-management') return getPerm(m.permissions.accessContracts, true);
      if (tabId === 'admin-module') return getPerm(m.permissions.accessAdminModule, isAdminRole);
      if (tabId === 'dashboard') return getPerm(m.permissions.accessDashboard, isAdminRole);
    }

    // 3. Fallback defaults (if no custom permissions configured on this account yet)
    if (currentUser.role === 'admin') {
      return ['inicio', 'membro-dashboard', 'members', 'cycles', 'reports', 'dashboard', 'admin-module', 'credit-management'].includes(tabId);
    }
    
    // Lista padrão de fallback para membros comuns sem registo explícito de permissões
    return ['inicio', 'membro-dashboard', 'cycles', 'reports', 'credit-management'].includes(tabId);
  };

  const allNavigationItems = [
    { id: 'inicio', label: 'Início', icon: <Wallet className="w-3.5 h-3.5" /> },
    { id: 'membro-dashboard', label: 'Minha Área', icon: <Users className="w-3.5 h-3.5" /> },
    { id: 'members', label: 'Cadastro', icon: <Users className="w-3.5 h-3.5" /> },
    { id: 'cycles', label: 'Pagamentos', icon: <Coins className="w-3.5 h-3.5" /> },
    { id: 'credit-management', label: 'Créditos', icon: <Coins className="w-3.5 h-3.5" /> },
    { id: 'reports', label: 'Relatórios', icon: <FileText className="w-3.5 h-3.5" /> },
    { id: 'admin-module', label: 'Administração', icon: <ShieldCheck className="w-3.5 h-3.5 text-rose-500 font-bold" /> },
  ];

  const allowedNavigationItems = allNavigationItems.filter(item => isAllowed(item.id));

  const activeTabItem = allowedNavigationItems.find(item => item.id === activeTab);
  const filteredNavigationItems = allowedNavigationItems.filter(item => {
    const label = (item.id === 'membro-dashboard' ? 'Minha Área' : item.label).toLowerCase();
    return label.includes(menuSearchQuery.toLowerCase());
  });

  // Close mobile dropdown menu dynamically when clicking outside
  useEffect(() => {
    if (!isMenuOpen) return;
    const handleOutsideClick = (event: MouseEvent) => {
      const container = document.getElementById('kix-mobile-nav-container');
      if (container && !container.contains(event.target as Node)) {
        setIsMenuOpen(false);
        setMenuSearchQuery('');
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isMenuOpen]);

  // Redireciona para o primeiro link permitido se o separador atual for bloqueado administrativamente
  useEffect(() => {
    if (currentUser) {
      if (!isAllowed(activeTab)) {
        const orderOfPreference = ['inicio', 'membro-dashboard', 'cycles', 'reports', 'members', 'admin-module'];
        const fallback = orderOfPreference.find(tabId => isAllowed(tabId));
        if (fallback) {
          setActiveTab(fallback);
        }
      }
    }
  }, [currentUser, members, activeTab]);

  const [payoutsCompleted, setPayoutsCompleted] = useState<{ [month: number]: boolean }>({
    1: false,
    2: false,
    3: false,
    4: false,
    5: false,
    6: false,
  });

  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('kix_theme');
    return (saved === 'dark' || saved === 'light') ? saved : 'light';
  });

  const [appConfig, setAppConfig] = useState<AppConfig>(() => {
    const saved = localStorage.getItem('kix_app_config');
    const defaults = {
      bankName: 'Banco BIC Angola',
      bankIban: 'AO06 0040 0000 7834 8291 1014 9',
      phone: '925204065',
      email: 'geral@kixfundo.ao',
      showFlowChart: true,
      showAllocationChart: true,
      showStatsCards: true,
      chartColorTheme: 'teal' as 'teal' | 'indigo' | 'coral' | 'amber',
      customDashboardMessage: 'Bem-vindo ao portal oficial do fundo de poupança cooperativa Kix-Fundo! Monitor ambiental operando com segurança total.',
      fontFamily: 'inter' as 'inter' | 'outfit' | 'mono' | 'playfair' | 'space',
      fontSize: 'normal' as 'compact' | 'normal' | 'medium' | 'large' | 'xlarge',
      primaryColorTheme: 'emerald' as 'emerald' | 'indigo' | 'slate' | 'teal' | 'coral' | 'amber' | 'violet' | 'bordeaux' | 'royal_plum' | 'fire_coral' | 'dark_zinc' | 'solid_navy' | 'sky_frost' | 'ocean_teal',
      adminPrivilegeCanDelete: true,
      adminPrivilegeCanRefund: true,
      adminPrivilegeCanForcePayout: false,
      contractClauseJuros: 'O montante principal do empréstimo será reembolsado no prazo improrrogável de {PRAZO_MESES} meses, computados juros ordinários prefixados à taxa de {TAXA_JUROS}% ao mês (revertendo os rendimentos de juro integralmente para o fundo colectivo de interajuda). A amortização far-se-á em {PRAZO_MESES} prestações mensais, sucessivas e indivisíveis no montante exato de {MENSALIDADE} cada uma, vencendo a primeira parcela em {DATA_PRIMEIRA_PARCELA} e as demais em igual dia dos meses subsequentes.',
      contractClauseMultas: 'O atraso no pagamento de qualquer prestação mensal ativará juros de mora acumuláveis de 2% (dois por cento) ao dia sobre o montante da parcela em atraso, contados a partir do dia seguinte ao do vencimento, sem prejuízo da cobrança coerciva do saldo global.',
      contractClauseGarantias: 'Como garantia incondicional de pagamento do principal, juros e sanções aplicáveis, o DEVEDOR oferece na modalidade de penhor mercantil ou custódia fiduciária preventiva os seguintes bens e colaterais: {GARANTIAS}. O devedor declara de livre e espontânea vontade que os bens descritos possuem valor comercial condizente com a dívida e autoriza e outorga expressamente e sem reservas o CREDOR "KIXI-FUNDO" a proceder à apreensão, adjudicação judicial ou venda extrajudicial do bem acima descrito para liquidar o saldo devedor e cobrir os custos operacionais caso o inadimplemento ultrapasse 30 (trinta) dias de atraso.',
      contractTemplateWhole: `CONTRATO DE MÚTUO FINANCEIRO COM JUROS E PENHOR DE GARANTIA

Por este instrumento particular de contrato, de um lado:
CREDOR: KIXI-FUNDO - Associação Cooperativa de Poupança e Interajuda Coletiva, doravante denominado "KIXI-FUNDO", representado neste ato pelo(a) Gestor(a) de Turno / Representante do Fundo logado no sistema: {REPRESENTANTE}.

Do outro lado:
DEVEDOR(A): {BENEFICIARIO}, titular do BI/NIF nº {DOCUMENTO_ID}, residente e domiciliado em Angola, com o contacto telefónico nº {TELEFONE} e e-mail {EMAIL}.

As partes devidamente identificadas e qualificadas resolvem celebrar o presente contrato de mútuo com garantia de penhor de comum acordo, em conformidade com o código civil em vigor em Angola e pelas cláusulas e condições seguintes:

CLÁUSULA PRIMEIRA - DO OBJETO E CAPITAL
O CREDOR concede nesta data ao DEVEDOR uma operação de microcrédito sob a forma de empréstimo (mútuo) do montante principal de {VALOR_EMPRESTIMO}, cujo capital é desembolsado nesta data para aplicação empresarial ou familiar.

CLÁUSULA SEGUNDA - DOS JUROS, AMORTIZAÇÃO E ENCARGOS
{CLAUSULA_JUROS}

CLÁUSULA TERCEIRA - DA GARANTIA REAL (PENHOR FIDUCIÁRIO)
{CLAUSULA_GARANTIAS}

CLÁUSULA QUARTA - DOS RISCOS E MORA JURÍDICA
{CLAUSULA_MULTAS}

CLÁUSULA QUINTA - FORO E ASSINATURAS
Para dirimir quaisquer controvérsias decorrentes da interpretação ou execução deste instrumento de crédito, as partes de comum acordo elegem o foro da Comarca de Luanda, Angola, com renúncia expressa a qualquer outro.

E, por estarem de pleno acordo, as partes celebram e validam eletromagneticamente o presente contrato que passa a reger os direitos mútuos.`,
      autoBackUpGDrive: false,
      autoBackupSchedule: 'off' as 'off' | 'daily' | 'weekly',
      lastAutoBackupFirestore: '',
      lastAutoBackupGDrive: '',
    };
    if (saved) {
      try {
        return { ...defaults, ...JSON.parse(saved) };
      } catch (e) {
        // Safe fallback
      }
    }
    return defaults;
  });

  const stateRef = useRef({
    members,
    logs,
    payoutsCompleted,
    currentMonth,
    appConfig,
    loans
  });

  useEffect(() => {
    stateRef.current = {
      members,
      logs,
      payoutsCompleted,
      currentMonth,
      appConfig,
      loans
    };
  }, [members, logs, payoutsCompleted, currentMonth, appConfig, loans]);

  useEffect(() => {
    localStorage.setItem('kix_app_config', JSON.stringify(appConfig));
    if (isInitialLoadCompleted && !isLoadingDb) {
      if (isFirestoreQuotaExceededRef.current) {
        setIsDbSyncing(false);
      } else {
        setIsDbSyncing(true);
        const generatedTimestamp = new Date().toISOString();
        localStorage.setItem('kix_updated_at', generatedTimestamp);
        
        saveStateToFirestore({
          members,
          logs,
          payoutsCompleted,
          currentMonth,
          appConfig,
          loans,
          updatedAt: generatedTimestamp
        }).then(() => {
          setIsDbSyncing(false);
        }).catch((err) => {
          console.error("Firestore appConfig sync failed: ", err);
          setIsDbSyncing(false);
          const errString = String(err);
          if (errString.includes('resource-exhausted') || errString.includes('quota') || errString.includes('Quota')) {
            setIsFirestoreQuotaExceeded(true);
            localStorage.setItem('kix_firestore_quota_exceeded', 'true');
          }
        });
      }
    }
  }, [appConfig, isInitialLoadCompleted, isLoadingDb, isFirestoreQuotaExceeded]);

  useEffect(() => {
    localStorage.setItem('kix_theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Enforce browser window title strictly to Kixi-Fundo avoiding AI platform prefixes/suffixes
  useEffect(() => {
    document.title = "Kixi-Fundo | Gestão de Finanças Comparticipadas";
  }, []);

  // Motor Scheduler de Backups Automáticos Periódicos
  const runAutoBackupCheck = async (
    currentConfig: AppConfig,
    currentMembers: Member[],
    currentLogs: KixLog[],
    currentLoans: Loan[],
    currentPayouts: { [month: number]: boolean },
    currentMonthNum: number
  ) => {
    const schedule = currentConfig.autoBackupSchedule;
    if (!schedule || schedule === 'off') {
      console.log("[Scheduler] Agendamento de backups automáticos desligado.");
      return;
    }

    const now = Date.now();
    const lastFirestore = currentConfig.lastAutoBackupFirestore ? new Date(currentConfig.lastAutoBackupFirestore).getTime() : 0;
    const interval = schedule === 'daily' ? 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000;

    const firestoreDue = now - lastFirestore >= interval;
    const lastGDrive = currentConfig.lastAutoBackupGDrive ? new Date(currentConfig.lastAutoBackupGDrive).getTime() : 0;
    const googleToken = sessionStorage.getItem('gdrive_access_token');
    const gdriveDue = (currentConfig.autoBackUpGDrive === true && googleToken && (now - lastGDrive >= interval));

    if (firestoreDue || gdriveDue) {
      console.log(`[Scheduler] Executando backups automáticos (${schedule})...`);
      
      const payoutsMap: { [month: string]: boolean } = {};
      Object.entries(currentPayouts).forEach(([k, v]) => {
        payoutsMap[String(k)] = v;
      });

      const payload = {
        members: currentMembers,
        logs: currentLogs,
        loans: currentLoans,
        payoutsCompleted: payoutsMap,
        currentMonth: currentMonthNum,
        appConfig: currentConfig,
        updatedAt: new Date().toISOString()
      };

      let updatedConfig = { ...currentConfig };
      let updatedLogs = [...currentLogs];

      if (firestoreDue && !isFirestoreQuotaExceededRef.current) {
        try {
          const dateStr = new Date().toLocaleDateString('pt-AO');
          const backupName = `Ponto de Restauro Autónomo (${schedule === 'daily' ? 'Diário' : 'Semanal'}) - ${dateStr}`;
          
          const { saveBackupToFirestore } = await import('./firebaseSync');
          await saveBackupToFirestore(backupName, payload, 'automatic', schedule);

          const nowTime = new Date().toISOString();
          const schedulerLog: KixLog = {
            id: `scheduler-fs-${Date.now()}`,
            timestamp: nowTime,
            type: 'policy_change',
            month: currentMonthNum,
            amount: 0,
            description: `[SCHEDULER] Ponto de restauro automático criado com sucesso na Cloud Firestore: "${backupName}"`
          };

          updatedLogs = [schedulerLog, ...updatedLogs];
          updatedConfig.lastAutoBackupFirestore = nowTime;
          console.log(`[Scheduler] Ponto de restauro gravado com sucesso no Firestore.`);
        } catch (err) {
          console.error(`[Scheduler] Erro ao gravar backup agendado no Firestore:`, err);
          const errString = String(err);
          if (errString.includes('resource-exhausted') || errString.includes('quota') || errString.includes('Quota')) {
            setIsFirestoreQuotaExceeded(true);
            localStorage.setItem('kix_firestore_quota_exceeded', 'true');
          }
        }
      }

      if (gdriveDue && googleToken) {
        try {
          const { uploadBackup } = await import('./driveBackup');
          const gdrivePayload = {
            ...payload,
            logs: updatedLogs,
            appConfig: updatedConfig
          };
          await uploadBackup(googleToken, gdrivePayload);
          
          const nowTime = new Date().toISOString();
          updatedConfig.lastAutoBackupGDrive = nowTime;
          console.log(`[Scheduler] Backup automático enviado para o Google Drive.`);
        } catch (err) {
          console.error(`[Scheduler] Erro ao submeter backup agendado no Google Drive:`, err);
        }
      }

      // Gravamos as novas credenciais de data e o log agendado
      await saveState(currentMembers, updatedLogs, currentPayouts, currentMonthNum, currentLoans, updatedConfig);
    } else {
      console.log("[Scheduler] Backups automáticos em dia. Próxima verificação agendada.");
    }
  };

  // Trigger backup upload to drive in the background
  const triggerAutoBackupGDrive = async (newMembers: Member[], newLogs: KixLog[], newPayouts = payoutsCompleted, newMonth = currentMonth) => {
    const token = sessionStorage.getItem('gdrive_access_token');
    if (appConfig.autoBackUpGDrive === true) {
      if (token && isOnline) {
        try {
          const payload = {
            version: 3,
            timestamp: new Date().toISOString(),
            members: newMembers,
            logs: newLogs,
            payoutsCompleted: newPayouts,
            currentMonth: newMonth,
            appConfig,
            carouselSlides
          };
          const { uploadBackup } = await import('./driveBackup');
          await uploadBackup(token, payload);
          console.log("Auto-backup no Google Drive concluído.");
          setPendingSyncCount(0);
          localStorage.setItem('kix_pending_sync_count', '0');
        } catch (err) {
          console.error("Auto-backup Google Drive Error:", err);
          const nextCount = pendingSyncCount + 1;
          setPendingSyncCount(nextCount);
          localStorage.setItem('kix_pending_sync_count', String(nextCount));
        }
      } else {
        const nextCount = pendingSyncCount + 1;
        setPendingSyncCount(nextCount);
        localStorage.setItem('kix_pending_sync_count', String(nextCount));
      }
    }
  };

  const registerSecurityAttempt = (userId: string) => {
    const timestamp = new Date().toISOString();
    const newLog: KixLog = {
      id: `log-security-${Date.now()}`,
      timestamp,
      type: 'policy_change' as const,
      amount: 0,
      description: `ALERTA DE SEGURANÇA: Tentativa de acesso não autorizada. ID do Utilizador: ${userId}. Timestamp: ${timestamp}`,
      month: currentMonth || 1,
      transactionCode: `SEC.${Date.now().toString().substring(7)}`,
    };
    
    setLogs((prev) => {
      const updated = [newLog, ...prev];
      localStorage.setItem('kix_logs', JSON.stringify(updated));
      triggerAutoBackupGDrive(members, updated);
      return updated;
    });
  };

  const navigateToTab = (tabId: string) => {
    if (!currentUser) return;
    const isTabAllowed = isAllowed(tabId);
    if (!isTabAllowed) {
      registerSecurityAttempt(currentUser.email);
      return;
    }
    setActiveTab(tabId);
  };

  // Helper function to sync pending changes manually or automatically
  const handleSyncPendingChanges = async (quiet = true) => {
    const token = sessionStorage.getItem('gdrive_access_token');
    if (!token) {
      if (!quiet) alert('O Google Drive não está conectado. Por favor, conecte a sua conta no "Backup Coletor Google Drive" no painel de Administração para autenticar e sincronizar as suas atualizações pendentes.');
      return;
    }
    if (!isOnline) {
      if (!quiet) alert('Modo Offline: Não é possível sincronizar sem ligação à Internet de momento.');
      return;
    }

    setIsSyncingPending(true);
    try {
      const payload = {
        version: 3,
        timestamp: new Date().toISOString(),
        members,
        logs,
        payoutsCompleted,
        currentMonth,
        appConfig,
        carouselSlides
      };
      const { uploadBackup } = await import('./driveBackup');
      await uploadBackup(token, payload);
      setPendingSyncCount(0);
      localStorage.setItem('kix_pending_sync_count', '0');
      if (!quiet) alert('Sincronização concluída com sucesso absoluto! Todos os dados locais estão salvos e atualizados no seu Google Drive.');
    } catch (err) {
      console.error("Erro na sincronização:", err);
      if (!quiet) alert('Houve um problema de rede ou as credenciais expiraram ao tentar sincronizar com o Google Drive.');
    } finally {
      setIsSyncingPending(false);
    }
  };

  // Automatic retry synchronization when coming back online
  useEffect(() => {
    const token = sessionStorage.getItem('gdrive_access_token');
    if (isOnline && token && appConfig.autoBackUpGDrive === true && pendingSyncCount > 0) {
      console.log("Sinal de rede recuperado! A sincronizar dados acumulados com o Google Drive...");
      handleSyncPendingChanges(true);
    }
  }, [isOnline]);

  // Load and subscribe to real-time sync with Firestore Database
  useEffect(() => {
    let active = true;
    let initialLoadProcessed = false;
    setIsDbSyncing(true);
    setIsLoadingDb(true);

    // Carregar IMEDIATAMENTE preferencialmente do cache local (localStorage) no startup
    const defaultPayouts = {
      1: false, 2: false, 3: false, 4: false, 5: false, 6: false
    };
    const savedMembers = localStorage.getItem('kix_members');
    const savedLogs = localStorage.getItem('kix_logs');
    const savedPayouts = localStorage.getItem('kix_payouts');
    const savedCurrentMonth = localStorage.getItem('kix_current_month');
    const savedLoans = localStorage.getItem('kix_loans');

    const finalMembers = savedMembers ? JSON.parse(savedMembers) : INITIAL_MEMBERS;
    const finalLogs = savedLogs ? JSON.parse(savedLogs) : INITIAL_LOGS;
    const finalPayouts = savedPayouts ? JSON.parse(savedPayouts) : defaultPayouts;
    const finalMonth = savedCurrentMonth ? Number(savedCurrentMonth) : 1;
    const finalLoans = savedLoans ? JSON.parse(savedLoans) : loans;

    setMembers(finalMembers);
    setLogs(finalLogs);
    setPayoutsCompleted(finalPayouts);
    setCurrentMonth(finalMonth);
    setLoans(finalLoans);

    setDbLoadedSuccessfully(true);
    setIsLoadingDb(false);
    setIsDbSyncing(false);
    setIsInitialLoadCompleted(true);

    if (!initialLoadProcessed) {
      initialLoadProcessed = true;
      runAutoBackupCheck(
        appConfig,
        finalMembers,
        finalLogs,
        finalLoans,
        finalPayouts,
        finalMonth
      );
    }

    if (isFirestoreQuotaExceededRef.current) {
      console.warn("Sincronização em tempo real suspensa: Limite de Quota do Firestore Excedido. Mantendo modo local autónomo...");
      return;
    }

    const docRef = doc(db, 'kix_fundo', 'state');
    
    let unsubscribe: (() => void) | null = null;
    let unsubscribedDueToQuota = false;

    const handleQuotaExceeded = () => {
      setIsFirestoreQuotaExceeded(true);
      unsubscribedDueToQuota = true;
      if (unsubscribe) {
        console.warn("Unsubscribing from Firestore real-time snapshot due to quota limit exceeded!");
        try {
          unsubscribe();
        } catch (err) {
          console.error("Error unsubscribing:", err);
        }
      }
      unsubscribeRef.current = null;
    };

    console.log("Inicialização local concluída com sucesso. Sincronização em tempo real do Firestore agendada para daqui a 10 segundos...");

    // Agendar a ligação ao Firestore para daqui a 10 segundos para reduzir leituras/escritas desnecessárias na inicialização
    const syncTimeout = setTimeout(() => {
      if (!active) return;
      if (isFirestoreQuotaExceededRef.current) return;

      setIsDbSyncing(true);
      console.log("Iniciando verificação de ligação e sincronização com o Cloud Firestore...");

      // Verificar conectividade
      testFirestoreConnection().then(() => {
        if (!active) return;

        unsubscribe = onSnapshot(docRef, (docSnap) => {
          if (!active) return;
          setIsDbSyncing(false);

          let resolvedMembers: Member[] = [];
          let resolvedLogs: KixLog[] = [];
          let resolvedLoans: Loan[] = [];
          let resolvedPayouts: { [month: number]: boolean } = {};
          let resolvedMonth = 1;
          let resolvedConfig = appConfig;

          if (docSnap.exists()) {
            console.log("Real-time: Sincronização de dados recebida com sucesso!");
            
            const dbState = docSnap.data();
            const remoteUpdatedAt = dbState.updatedAt || null;
            const localUpdatedAt = localStorage.getItem('kix_updated_at') || null;

            const decision = resolveConflict(localUpdatedAt, remoteUpdatedAt);

            if (decision === 'use_local') {
              console.log("[Conflict Resolution] Local offline changes are newer than remote. Pushing newer state to Firestore to resolve conflict...");
              if (!isFirestoreQuotaExceededRef.current) {
                saveStateToFirestore({
                  members: stateRef.current.members,
                  logs: stateRef.current.logs,
                  payoutsCompleted: stateRef.current.payoutsCompleted,
                  currentMonth: stateRef.current.currentMonth,
                  appConfig: stateRef.current.appConfig,
                  loans: stateRef.current.loans,
                  updatedAt: localUpdatedAt || new Date().toISOString()
                }).catch(e => {
                  console.error("[Conflict Resolution] Failed to push local state:", e);
                });
              }
              return;
            }

            if (dbState.updatedAt) {
              localStorage.setItem('kix_updated_at', dbState.updatedAt);
            }

            let finalMembers = dbState.members || [];
            
            const FICTITIOUS_EMAILS = [
              'sgabriel@gmail.com',
              'delfina.antonio@gmail.com',
              'carlos.silva@gmail.com',
              'ana.vicente@gmail.com'
            ];
            const originalCount = finalMembers.length;
            finalMembers = finalMembers.filter(
              m => !FICTITIOUS_EMAILS.includes((m.email || '').trim().toLowerCase())
            );

            if (finalMembers.length === 0) {
              finalMembers = [...INITIAL_MEMBERS];
            }

            if (finalMembers.length !== originalCount) {
              console.log("Removendo membros fictícios detectados de forma síncrona na nuvem...");
              if (!isFirestoreQuotaExceededRef.current) {
                const cleanTimestamp = new Date().toISOString();
                localStorage.setItem('kix_updated_at', cleanTimestamp);
                saveStateToFirestore({
                  ...dbState,
                  members: finalMembers,
                  updatedAt: cleanTimestamp
                } as any).catch(e => {
                  console.error("Falha ao salvar após remover membros fictícios:", e);
                  const errString = String(e);
                  if (errString.includes('resource-exhausted') || errString.includes('quota') || errString.includes('Quota')) {
                    handleQuotaExceeded();
                  }
                });
              }
            }

            if (JSON.stringify(finalMembers) !== JSON.stringify(stateRef.current.members)) {
              setMembers(finalMembers);
            }
            if (dbState.logs && JSON.stringify(dbState.logs) !== JSON.stringify(stateRef.current.logs)) {
              setLogs(dbState.logs);
            }
            if (dbState.loans && JSON.stringify(dbState.loans) !== JSON.stringify(stateRef.current.loans)) {
              setLoans(dbState.loans);
              localStorage.setItem('kix_loans', JSON.stringify(dbState.loans));
            }
            if (dbState.payoutsCompleted) {
              const parsedPayouts: { [month: number]: boolean } = {};
              Object.entries(dbState.payoutsCompleted).forEach(([k, v]) => {
                parsedPayouts[Number(k)] = !!v;
              });
              if (JSON.stringify(parsedPayouts) !== JSON.stringify(stateRef.current.payoutsCompleted)) {
                setPayoutsCompleted(parsedPayouts);
              }
              resolvedPayouts = parsedPayouts;
            }
            if (dbState.currentMonth) {
              if (dbState.currentMonth !== stateRef.current.currentMonth) {
                setCurrentMonth(dbState.currentMonth);
              }
              resolvedMonth = dbState.currentMonth;
            }
            if (dbState.appConfig) {
              if (JSON.stringify(dbState.appConfig) !== JSON.stringify(stateRef.current.appConfig)) {
                setAppConfig(dbState.appConfig);
              }
              resolvedConfig = dbState.appConfig;
            }

            localStorage.setItem('kix_members', JSON.stringify(finalMembers));
            localStorage.setItem('kix_logs', JSON.stringify(dbState.logs || []));
            localStorage.setItem('kix_payouts', JSON.stringify(dbState.payoutsCompleted || {}));
            localStorage.setItem('kix_current_month', String(dbState.currentMonth || 1));
            localStorage.setItem('kix_app_config', JSON.stringify(dbState.appConfig || {}));
            
            setDbLoadedSuccessfully(true);
            resolvedMembers = finalMembers;
            resolvedLogs = dbState.logs || [];
            resolvedLoans = dbState.loans || [];
          } else {
            console.log("Base de dados vazia na nuvem. Sincronizando com cache local...");
            const defaultPayouts = {
              1: false, 2: false, 3: false, 4: false, 5: false, 6: false
            };
            const savedMembers = localStorage.getItem('kix_members');
            const savedLogs = localStorage.getItem('kix_logs');
            const savedPayouts = localStorage.getItem('kix_payouts');
            const savedCurrentMonth = localStorage.getItem('kix_current_month');
            const savedLoans = localStorage.getItem('kix_loans');

            let finalMembers = savedMembers ? JSON.parse(savedMembers) : INITIAL_MEMBERS;
            const FICTITIOUS_EMAILS = [
              'sgabriel@gmail.com',
              'delfina.antonio@gmail.com',
              'carlos.silva@gmail.com',
              'ana.vicente@gmail.com'
            ];
            finalMembers = finalMembers.filter(
              (m: any) => !FICTITIOUS_EMAILS.includes((m.email || '').trim().toLowerCase())
            );
            if (finalMembers.length === 0) {
              finalMembers = [...INITIAL_MEMBERS];
            }
            const finalLogs = savedLogs ? JSON.parse(savedLogs) : INITIAL_LOGS;
            const finalPayouts = savedPayouts ? JSON.parse(savedPayouts) : defaultPayouts;
            const finalMonth = savedCurrentMonth ? Number(savedCurrentMonth) : 1;
            const finalLoans = savedLoans ? JSON.parse(savedLoans) : loans;

            const hasRealDataLocal = finalMembers.length > 1 || finalLogs.length > 1;

            if (hasRealDataLocal) {
              console.log("Cofre local real detetado. Enviando dados locais para a nuvem...");
              if (!isFirestoreQuotaExceededRef.current) {
                const initTimestamp = new Date().toISOString();
                localStorage.setItem('kix_updated_at', initTimestamp);
                saveStateToFirestore({
                  members: finalMembers,
                  logs: finalLogs,
                  payoutsCompleted: finalPayouts,
                  currentMonth: finalMonth,
                  appConfig: appConfig,
                  loans: finalLoans,
                  updatedAt: initTimestamp
                }).catch(err => {
                  console.error("Falha ao salvar dados de inicialização local na cloud:", err);
                  const errString = String(err);
                  if (errString.includes('resource-exhausted') || errString.includes('quota') || errString.includes('Quota')) {
                    handleQuotaExceeded();
                  }
                });
              }
            }

            setMembers(finalMembers);
            setLogs(finalLogs);
            setPayoutsCompleted(finalPayouts);
            setCurrentMonth(finalMonth);
            setLoans(finalLoans);
            
            setDbLoadedSuccessfully(true);

            resolvedMembers = finalMembers;
            resolvedLogs = finalLogs;
            resolvedLoans = finalLoans;
            resolvedPayouts = finalPayouts;
            resolvedMonth = finalMonth;
            resolvedConfig = appConfig;
          }

          setIsLoadingDb(false);
          setIsInitialLoadCompleted(true);

          if (!initialLoadProcessed) {
            initialLoadProcessed = true;
            runAutoBackupCheck(
              resolvedConfig,
              resolvedMembers,
              resolvedLogs,
              resolvedLoans,
              resolvedPayouts,
              resolvedMonth
            );
          }
        }, (err) => {
          console.warn("Sincronização em tempo real falhou ou operando offline:", err);
          const errString = String(err);
          if (errString.includes('resource-exhausted') || errString.includes('quota') || errString.includes('Quota')) {
            console.warn("Firestore Quota Limit exceeded on delayed mount snapshot!");
            handleQuotaExceeded();
          }
          setIsDbSyncing(false);
        });

        unsubscribeRef.current = unsubscribe;

        if (unsubscribedDueToQuota && unsubscribe) {
          try {
            unsubscribe();
          } catch (err) {}
          unsubscribeRef.current = null;
        }
      }).catch(e => {
        console.warn("Firestore connection check failed after delay:", e);
        const errString = String(e);
        if (errString.includes('resource-exhausted') || errString.includes('quota') || errString.includes('Quota')) {
          console.warn("Firestore Quota Limit Detected on delayed init connection check!");
          handleQuotaExceeded();
        }
        setIsDbSyncing(false);
      });
    }, 10000);

    return () => {
      active = false;
      clearTimeout(syncTimeout);
      if (unsubscribe) {
        try {
          unsubscribe();
        } catch (err) {
          // Safe check
        }
      }
      unsubscribeRef.current = null;
    };
  }, []);

  // Restaurar sessão do usuário após o carregamento inicial
  useEffect(() => {
    const savedUser = localStorage.getItem('kix_current_user');
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        setCurrentUser(parsed);
        setActiveTab('inicio');
      } catch (err) {
         // Safe fail
      }
    }
  }, []);

  // Sync to local storage and Cloud database on changes
  const saveState = async (
    newMembers: Member[],
    newLogs: KixLog[],
    newPayouts = payoutsCompleted,
    newMonth = currentMonth,
    newLoans = loans,
    newAppConfig = appConfig
  ): Promise<void> => {
    const reconciledMembers = reconcileMembers(members, newMembers);
    
    // Update local React states synchronously so the UI and cache match perfectly without asynchronous lags
    _setMembers(reconciledMembers);
    setLogs(newLogs);
    setPayoutsCompleted(newPayouts);
    setCurrentMonth(newMonth);
    setLoans(newLoans);
    setAppConfig(newAppConfig);

    const generatedTimestamp = new Date().toISOString();
    localStorage.setItem('kix_updated_at', generatedTimestamp);

    localStorage.setItem('kix_members', JSON.stringify(reconciledMembers));
    localStorage.setItem('kix_logs', JSON.stringify(newLogs));
    localStorage.setItem('kix_payouts', JSON.stringify(newPayouts));
    localStorage.setItem('kix_current_month', String(newMonth));
    localStorage.setItem('kix_loans', JSON.stringify(newLoans));
    localStorage.setItem('kix_app_config', JSON.stringify(newAppConfig));

    let firestorePromise = Promise.resolve();

    if (isInitialLoadCompleted) {
      if (isFirestoreQuotaExceededRef.current) {
        console.warn("Sincronização com Cloud suspensa temporariamente devido ao limite de quota atingido. Registando na fila local offline...");
        setIsDbSyncing(false);

        // Detect and record exact differences
        const changesTextArr: string[] = [];

        if (newMonth !== currentMonth) {
          changesTextArr.push(`Ciclo atual alterado: de Mês ${currentMonth} para Mês ${newMonth}`);
        }

        if (reconciledMembers.length !== members.length) {
          changesTextArr.push(`Lista de Sócio-Membros atualizada: ${reconciledMembers.length > members.length ? 'Sócio adicionado' : 'Sócio removido'}`);
        } else {
          reconciledMembers.forEach(m => {
            const oldM = members.find(old => old.id === m.id);
            if (oldM) {
              const oldContr = oldM.contributions || {};
              const newContr = m.contributions || {};
              for (let mIdx = 1; mIdx <= 6; mIdx++) {
                if (oldContr[mIdx]?.paid !== newContr[mIdx]?.paid) {
                  changesTextArr.push(`Membro "${m.name}": Quota do Mês ${mIdx} marcada como ${newContr[mIdx]?.paid ? 'PAGA' : 'PENDENTE'}`);
                }
              }
            }
          });
        }

        if (newLoans.length !== loans.length) {
          changesTextArr.push(`Lista de Empréstimos atualizada: de ${loans.length} para ${newLoans.length} registos ativos`);
        }

        for (let mKey = 1; mKey <= 6; mKey++) {
          if (newPayouts[mKey] !== payoutsCompleted[mKey]) {
            changesTextArr.push(`Benefício de Contemplação do Mês ${mKey} marcado como ${newPayouts[mKey] ? 'LIQUIDADO' : 'AGUARDANDO'}`);
          }
        }

        if (changesTextArr.length === 0) {
          changesTextArr.push("Utilização geral ou atualização de configurações locais.");
        }

        const savedQueue = localStorage.getItem('kix_firestore_pending_ops_queue');
        const currentQueue = savedQueue ? JSON.parse(savedQueue) : [];
        const nextOps = [...currentQueue];
        changesTextArr.forEach(txt => {
          nextOps.push({
            id: `op-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            timestamp: new Date().toISOString(),
            description: txt
          });
        });

        setFirestorePendingOps(nextOps);
        localStorage.setItem('kix_firestore_pending_ops_queue', JSON.stringify(nextOps));
      } else {
        // Save directly to Firestore cloud database to ensure persistence on all other browsers and machines
        setIsDbSyncing(true);
        firestorePromise = saveStateToFirestore({
          members: reconciledMembers,
          logs: newLogs,
          payoutsCompleted: newPayouts,
          currentMonth: newMonth,
          appConfig: newAppConfig,
          loans: newLoans,
          updatedAt: generatedTimestamp
        }).then(() => {
          setIsDbSyncing(false);
          setIsFirestoreQuotaExceeded(false);
          localStorage.removeItem('kix_firestore_quota_exceeded');
        }).catch((err) => {
          console.error("Firestore database write sync failed:", err);
          setIsDbSyncing(false);
          const errString = String(err);
          if (errString.includes('resource-exhausted') || errString.includes('quota') || errString.includes('Quota')) {
            console.warn("Firestore Quota Limit Exceeded on saveState write!");
            setIsFirestoreQuotaExceeded(true);
            localStorage.setItem('kix_firestore_quota_exceeded', 'true');

            // Set initial detection record
            const initOp = {
              id: `op-${Date.now()}`,
              timestamp: new Date().toISOString(),
              description: "Limite de quota da Firestore atingido. Sistema de contingência offline acionado com fila persistente ativa."
            };
            setFirestorePendingOps(prev => {
              const u = [...prev, initOp];
              localStorage.setItem('kix_firestore_pending_ops_queue', JSON.stringify(u));
              return u;
            });
          }
          // Do not rethrow the error, allowing the application to utilize the offline fallback state seamlessly
        });
      }
    } else {
      console.warn("Sincronização com Cloud suspensa para evitar sobrescrever a base de dados principal durante a inicialização.");
    }

    // Backup offline local automático redundante
    try {
      const redundantPayload = {
        version: 3,
        timestamp: new Date().toISOString(),
        members: reconciledMembers,
        logs: newLogs,
        payoutsCompleted: newPayouts,
        currentMonth: newMonth,
        appConfig: newAppConfig,
        carouselSlides
      };
      localStorage.setItem('kix_redundant_autobackup', JSON.stringify(redundantPayload));
    } catch (e) {
      console.error("Incapaz de guardar backup redundante local:", e);
    }

    // Auto-backup para Google Drive se o token e configuração estiverem ativos
    triggerAutoBackupGDrive(reconciledMembers, newLogs, newPayouts, newMonth);

    // Wait for Firestore promise to resolve to ensure data integrity before proceeding
    await firestorePromise;
  };

  const handleResetData = () => {
    if (window.confirm('Tem certeza que deseja restaurar os dados da plataforma para o estado inicial? Todos os registros manuais serão apagados.')) {
      setMembers(INITIAL_MEMBERS);
      setLogs(INITIAL_LOGS);
      const defaultPayouts = {
        1: false,
        2: false,
        3: false,
        4: false,
        5: false,
        6: false,
      };
      setPayoutsCompleted(defaultPayouts);
      setCurrentMonth(1);
      setActiveTab('dashboard');
      const defaultAppConfig = {
        bankName: 'Banco BIC Angola',
        bankIban: 'AO06 0040 0000 7834 8291 1014 9',
        phone: '925204065',
        email: 'geral.kurkita.ao',
        showFlowChart: true,
        showAllocationChart: true,
        showStatsCards: true,
        chartColorTheme: 'teal' as 'teal' | 'indigo' | 'coral' | 'amber',
        customDashboardMessage: 'Bem-vindo ao portal oficial do fundo de poupança cooperativa Kix-Fundo! Monitor ambiental operando com segurança total.'
      };
      setAppConfig(defaultAppConfig);
      saveState(INITIAL_MEMBERS, INITIAL_LOGS, defaultPayouts, 1);
      localStorage.setItem('kix_app_config', JSON.stringify(defaultAppConfig));
    }
  };

  const handleResetPassword = (email: string, newPass: string): boolean => {
    const targetEmail = email.trim().toLowerCase();
    const nowTime = new Date().toISOString();

    // Check if it's admin
    const isAdmin = targetEmail === 'admin@kixfundo.ao' || targetEmail === 'admin' || targetEmail === 'lmendesvictor@gmail.com';
    if (isAdmin) {
      localStorage.setItem('kix_admin_password_custom', newPass);
      
      const newLog: KixLog = {
        id: `pw-${Date.now()}`,
        timestamp: nowTime,
        type: 'password_reset',
        month: currentMonth,
        amount: 0,
        description: `Credenciais de Administrador Principal redefinidas com sucesso via e-mail.`
      };
      
      const updatedLogs = [newLog, ...logs];
      setLogs(updatedLogs);
      saveState(members, updatedLogs);
      return true;
    }

    const memberIdx = members.findIndex(m => m.email.toLowerCase() === targetEmail || m.name.toLowerCase().includes(targetEmail));
    if (memberIdx !== -1) {
      const updatedMembers = [...members];
      updatedMembers[memberIdx] = {
        ...updatedMembers[memberIdx],
        tempPassword: newPass
      };
      setMembers(updatedMembers);
      
      const newLog: KixLog = {
        id: `pw-${Date.now()}`,
        timestamp: nowTime,
        type: 'password_reset',
        month: currentMonth,
        amount: 0,
        memberName: updatedMembers[memberIdx].name,
        description: `A palavra-passe do membro ${updatedMembers[memberIdx].name} foi restabelecida e atualizada pelo próprio.`
      };
      
      const updatedLogs = [newLog, ...logs];
      setLogs(updatedLogs);
      saveState(updatedMembers, updatedLogs);
      return true;
    }
    return false;
  };

  // Switch month focus
  const handleSelectCycle = (monthNum: number) => {
    setCurrentMonth(monthNum);
    
    // Log change
    const newLog: KixLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      type: 'cycle_change',
      amount: 0,
      description: `Administrador mudou o foco de visualização e gestão para o Mês ${monthNum}.`,
      month: monthNum,
    };
    
    const updatedLogs = [newLog, ...logs];
    setLogs(updatedLogs);
    saveState(members, updatedLogs, payoutsCompleted, monthNum);
  };

  // Update members and month schedules
  const handleUpdateMembersFromSchedules = (updatedMembers: Member[], changedMonth: number) => {
    setMembers(updatedMembers);
    
    const newLog: KixLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      type: 'member_management',
      amount: 0,
      description: `ADMINISTRADOR reorganizou os beneficiários de faturamento do Mês ${changedMonth}.`,
      month: changedMonth,
    };
    
    const updatedLogs = [newLog, ...logs];
    setLogs(updatedLogs);
    saveState(updatedMembers, updatedLogs, payoutsCompleted, currentMonth);
  };

  // Toggle contribution status of a member for the current active month
  const handleToggleContribution = (memberId: number) => {
    const isSuperAdmin = currentUser?.email.trim().toLowerCase() === 'lmendesvictor@gmail.com';
    if (!isSuperAdmin && loggedInMember?.permissions?.actionRegisterPayments === false) {
      alert('Acesso Negado: Não possui privilégios de gestor para registar ou alterar pagamentos de quotas de cooperantes.');
      return;
    }

    const isPayoutDone = payoutsCompleted[currentMonth];
    
    if (isPayoutDone) {
      alert(`As contribuições para o Mês ${currentMonth} já foram encerradas e os benefícios foram pagos. Não é possível alterar as parcelas.`);
      return;
    }

    const targetedMember = members.find((m) => m.id === memberId);
    if (!targetedMember) return;

    const hadPaid = targetedMember.contributions[currentMonth]?.paid;
    if (hadPaid && appConfig.adminPrivilegeCanRefund === false) {
      alert('Acesso Negado: O estorno ou cancelamento de cotas recolhidas está desativado nas políticas de privilégio do administrador do sistema. Ative esta permissão na Administração Estratégica para o permitir.');
      return;
    }

    const updatedMembers = members.map((m) => {
      if (m.id === memberId) {
        const hasPaid = m.contributions[currentMonth]?.paid;
        return {
          ...m,
          contributions: {
            ...m.contributions,
            [currentMonth]: {
              paid: !hasPaid,
              paidAt: !hasPaid ? new Date().toISOString() : undefined,
            },
          },
        };
      }
      return m;
    });

    const logDescription = hadPaid
      ? `Contribuição cancellada para ${targetedMember.name} no Mês ${currentMonth}. (Estorno de 120.000,00 KZs: 100.000,00 KZs estornados da arrecadação e 20.000,00 KZs retiráveis do Fundo de Interajuda).`
      : `Contribuição recolhida com sucesso de ${targetedMember.name} para o Mês ${currentMonth}. (Distribuição: 100.000,00 KZs para benefícios e 20.000,00 KZs retidos automaticamente para o Fundo de Interajuda).`;

    const newLog: KixLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      type: 'contribution',
      memberName: targetedMember.name,
      amount: 120000,
      description: logDescription,
      month: currentMonth,
    };

    const updatedLogs = [newLog, ...logs];
    setMembers(updatedMembers);
    setLogs(updatedLogs);
    saveState(updatedMembers, updatedLogs);
  };

  // Payout Execution logic
  const handleExecutePayout = () => {
    const isPayoutDone = payoutsCompleted[currentMonth];
    if (isPayoutDone) {
      alert('Os pagamentos de benefícios para este ciclo mensal já foram liquidados!');
      return;
    }

    // Check if the current monthly collection is 100% completed
    const currentMonthPaidCount = members.filter((m) => m.contributions[currentMonth]?.paid).length;
    const canForcePayout = appConfig.adminPrivilegeCanForcePayout === true;
    if (currentMonthPaidCount < 12 && !canForcePayout) {
      alert('Ação Interrompida: Não foi arrecadada a totalidade das contribuições do mês. Todos os 12 membros devem registrar contribuição paga para perfazer os 1.440.000,00 KZs necessários para amparar os 2 beneficiários. (Nota: Para forçar este pagamento sem todas as cotas, mude as permissões de privilégio do administrador na área de Administração Estratégica).');
      return;
    }

    const beneficiaries = members.filter((m) => m.assignedMonth === currentMonth);
    const beneficiaryNames = beneficiaries.map((b) => b.name).join(' e ');

    // Highlight and make visual state updates
    const updatedMembers = members.map((m) => {
      if (m.assignedMonth === currentMonth) {
        return {
          ...m,
          benefits: {
            ...m.benefits,
            [currentMonth]: {
              received: true,
              amount: 600000,
              paidAt: new Date().toISOString(),
            },
          },
        };
      }
      return m;
    });

    const updatedPayouts = {
      ...payoutsCompleted,
      [currentMonth]: true,
    };

    const newLog: KixLog = {
      id: `payout-${Date.now()}`,
      timestamp: new Date().toISOString(),
      type: 'payout',
      amount: 1200000,
      description: `DESEMBOLSO EFETUADO: Benefício de 1.200.000,00 KZs aprovado e pago aos 2 contemplados do Ciclo ${currentMonth}: ${beneficiaryNames} (600.000,00 KZs cada um). Encerramento de contas efetuado.`,
      month: currentMonth,
    };

    const updatedLogs = [newLog, ...logs];
    setMembers(updatedMembers);
    setPayoutsCompleted(updatedPayouts);
    setLogs(updatedLogs);
    saveState(updatedMembers, updatedLogs, updatedPayouts);
  };

  // Social Aid grant
  const handleRequestAid = (memberId: number, amount: number, description: string) => {
    const isSuperAdmin = currentUser?.email.trim().toLowerCase() === 'lmendesvictor@gmail.com';
    if (!isSuperAdmin && loggedInMember?.permissions?.actionGrantSocialAid === false) {
      alert('Acesso Negado: Não possui privilégios de gestor para conceder apoios financeiros de Interajuda Coletiva.');
      return;
    }

    const targetMember = members.find((m) => m.id === memberId);
    if (!targetMember) return;

    const updatedMembers = members.map((m) => {
      if (m.id === memberId) {
        return {
          ...m,
          socialSupportReceived: m.socialSupportReceived + amount,
        };
      }
      return m;
    });

    const newLog: KixLog = {
      id: `aid-${Date.now()}`,
      timestamp: new Date().toISOString(),
      type: 'social_aid',
      memberName: targetMember.name,
      amount: amount,
      description: `AUXÍLIO SOCIAL APROVADO: Concedido o montante de ${new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(amount).replace('AOA', 'KZs')} para o membro ${targetMember.name}. Finalidade: ${description}.`,
      month: currentMonth,
    };

    const updatedLogs = [newLog, ...logs];
    setMembers(updatedMembers);
    setLogs(updatedLogs);
    saveState(updatedMembers, updatedLogs);
  };

  // Credit loan event handlers
  const handleAddLoan = async (newLoan: Loan): Promise<void> => {
    const isSuperAdmin = currentUser?.email.trim().toLowerCase() === 'lmendesvictor@gmail.com';
    if (!isSuperAdmin && loggedInMember?.permissions?.actionIssueCredits === false) {
      alert('Acesso Negado: Não possui privilégios de gestor para emitir ou celebrar contratos de microcréditos.');
      return;
    }

    const updatedLoans = [...loans, newLoan];
    setLoans(updatedLoans);

    const newLog: KixLog = {
      id: `loan-${Date.now()}`,
      timestamp: new Date().toISOString(),
      type: 'policy_change',
      amount: newLoan.amountRequested,
      memberName: newLoan.borrowerName,
      description: `CRÉDITO ADERIDO: Sócio/Cliente ${newLoan.borrowerName} celebrou contrato de crédito nº ${newLoan.id}. Montante: ${formatCurrency(newLoan.amountRequested)} com taxa de juro de ${newLoan.interestRate}%. Garantia: ${newLoan.guarantees}.`,
      month: currentMonth,
    };

    const updatedLogs = [newLog, ...logs];
    setLogs(updatedLogs);
    await saveState(members, updatedLogs, payoutsCompleted, currentMonth, updatedLoans);
  };

  const handlePayInstallment = (loanId: string, paymentMonth: number) => {
    const isSuperAdmin = currentUser?.email.trim().toLowerCase() === 'lmendesvictor@gmail.com';
    if (!isSuperAdmin && loggedInMember?.permissions?.actionIssueCredits === false) {
      alert('Acesso Negado: Não possui privilégios de gestor para processar amortizações de créditos.');
      return;
    }

    const targetLoan = loans.find(l => l.id === loanId);
    if (!targetLoan) return;

    const updatedLoans = loans.map((loan) => {
      if (loan.id === loanId) {
        const updatedPayments = loan.payments.map((p) => {
          if (p.month === paymentMonth) {
            const hasPaid = p.paid;
            return {
              ...p,
              paid: !hasPaid,
              paidAt: !hasPaid ? new Date().toISOString() : undefined,
            };
          }
          return p;
        });

        const allPaid = updatedPayments.every(p => p.paid);
        const status = allPaid ? 'completed' : 'active';

        return {
          ...loan,
          status,
          payments: updatedPayments,
        };
      }
      return loan;
    }) as Loan[];

    const payment = targetLoan.payments.find(p => p.month === paymentMonth);
    const wasPaid = payment ? payment.paid : false;

    // RULE: Automatically distribute reimbursed principal + earned interest back to members' contributions
    const isAdding = !wasPaid;
    const amountToDistribute = payment ? (payment.principalPaid + payment.interestPaid) : 0;
    const share = amountToDistribute / (members.length || 1);

    const updatedMembers = members.map((m) => {
      const contributions = { ...m.contributions };
      const paidMonths = Object.keys(contributions)
        .map(Number)
        .filter(mNum => contributions[mNum]?.paid)
        .sort((a, b) => a - b);
        
      let loanEarningsBalance = (m as any).loanEarningsBalance || 0;
      
      if (isAdding) {
        if (paidMonths.length > 0) {
          // Add share to the first paid contribution
          const targetMonth = paidMonths[0];
          const currentAmount = contributions[targetMonth].amount !== undefined 
            ? (contributions[targetMonth] as any).amount 
            : 120000;
          
          contributions[targetMonth] = {
            ...contributions[targetMonth],
            amount: currentAmount + share
          };
        } else {
          // Accrue to balance
          loanEarningsBalance += share;
        }
      } else {
        // Subtract or reduce back
        if (paidMonths.length > 0) {
          let remainingToSubtract = share;
          for (const mNum of paidMonths) {
            const currentAmount = contributions[mNum].amount !== undefined 
              ? (contributions[mNum] as any).amount 
              : 120000;
              
            const subtractable = currentAmount - 120000;
            if (subtractable >= remainingToSubtract) {
              contributions[mNum] = {
                ...contributions[mNum],
                amount: currentAmount - remainingToSubtract
              };
              remainingToSubtract = 0;
              break;
            } else {
              contributions[mNum] = {
                ...contributions[mNum],
                amount: 120000
              };
              remainingToSubtract -= subtractable;
            }
          }
          if (remainingToSubtract > 0) {
            loanEarningsBalance = Math.max(0, loanEarningsBalance - remainingToSubtract);
          }
        } else {
          loanEarningsBalance = Math.max(0, loanEarningsBalance - share);
        }
      }
      
      return {
        ...m,
        loanEarningsBalance,
        contributions
      };
    });

    const newLog: KixLog = {
      id: `pay-${Date.now()}`,
      timestamp: new Date().toISOString(),
      type: 'contribution',
      memberName: targetLoan.borrowerName,
      amount: payment ? payment.amount : 0,
      month: currentMonth,
      description: !wasPaid
        ? `AMORTIZAÇÃO EFECTUADA: Prestação nº ${paymentMonth} recebida de ${targetLoan.borrowerName} (${targetLoan.borrowerType === 'socio' ? 'sócio' : 'singular'}). Montante Total de ${formatCurrency(payment ? payment.amount : 0)} redistribuído automaticamente aos cooperantes (+${formatCurrency(share)} cada).`
        : `AMORTIZAÇÃO ANULADA: Pagamento da prestação nº ${paymentMonth} de ${targetLoan.borrowerName} cancelado e redistribuição estornada.`,
    };

    const updatedLogs = [newLog, ...logs];
    setLoans(updatedLoans);
    setMembers(updatedMembers);
    setLogs(updatedLogs);
    saveState(updatedMembers, updatedLogs, payoutsCompleted, currentMonth, updatedLoans);
  };

  // Core Math Calculations
  // Total overall contributions made
  const totalPaidContributionsCount = members.reduce((acc, m) => {
    const paidInMember = Object.keys(m.contributions).filter((monthKey) => {
      const contr = m.contributions[Number(monthKey)];
      return contr && (contr.paid === true || String(contr.paid).toLowerCase() === 'true');
    }).length;
    return acc + paidInMember;
  }, 0);

  // Dynamic sum of all paid contributions (handles custom amount per contribution if any)
  const totalQuotasCollected = members.reduce((acc, m) => {
    return acc + Object.keys(m.contributions).reduce((monthAcc, monthKey) => {
      const contr = m.contributions[Number(monthKey)];
      const isPaid = contr && (contr.paid === true || String(contr.paid).toLowerCase() === 'true');
      if (isPaid) {
        const amountVal = (contr as any).amount;
        let val = 120000;
        if (typeof amountVal === 'number') {
          val = amountVal;
        } else if (amountVal) {
          val = parseFloat(String(amountVal).replace(/[^0-9.]/g, '')) || 120000;
        }
        return monthAcc + val;
      }
      return monthAcc;
    }, 0);
  }, 0);

  // Fundo de Interajuda logic:
  // Each paid contribution deposits 20,000.00 automatically
  const totalSocialRetained = totalPaidContributionsCount * 20000;
  // Total Social support disbursed
  const totalSocialDisbursed = logs
    .filter((log) => log.type === 'social_aid')
    .reduce((acc, log) => acc + log.amount, 0);

  const socialBalance = totalSocialRetained - totalSocialDisbursed;

  // Global Financial Distribution calculations
  const totalBeneficiaryDestined = totalQuotasCollected - totalSocialRetained;
  const totalBeneficiaryPaid = Object.values(payoutsCompleted).filter((v) => v === true).length * 1200000;
  const totalBeneficiaryPending = totalBeneficiaryDestined - totalBeneficiaryPaid;

  // Current month collectors
  const currentMonthPaidCount = members.filter((m) => {
    const contr = m.contributions[currentMonth];
    return contr && (contr.paid === true || String(contr.paid).toLowerCase() === 'true');
  }).length;
  const currentMonthCollected = members.reduce((sum, m) => {
    const contr = m.contributions[currentMonth];
    const isPaid = contr && (contr.paid === true || String(contr.paid).toLowerCase() === 'true');
    if (isPaid) {
      const amountVal = (contr as any).amount;
      let val = 120000;
      if (typeof amountVal === 'number') {
        val = amountVal;
      } else if (amountVal) {
        val = parseFloat(String(amountVal).replace(/[^0-9.]/g, '')) || 120000;
      }
      return sum + val;
    }
    return sum;
  }, 0);
  const currentMonthBeneficiaries = members.filter((m) => m.assignedMonth === currentMonth);
  const isCurrentMonthPayoutDone = payoutsCompleted[currentMonth];

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-AO', {
      style: 'currency',
      currency: 'AOA',
      minimumFractionDigits: 2,
    })
      .format(val)
      .replace('AOA', 'KZs');
  };

  const getBeneficiariesList = () => {
    return currentMonthBeneficiaries.map((b) => ({
      name: b.name,
      isPaid: b.contributions[currentMonth]?.paid || false,
    }));
  };

  const handleExportData = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify({ members, logs, payoutsCompleted, currentMonth, appConfig, carouselSlides, timestamp: new Date().toISOString() }, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `kix_fundo_auditoria_ciclo_${currentMonth}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleRestoreBackupState = (backup: any): boolean => {
    if (!backup || !backup.members || !backup.logs) {
      alert("Ficheiro de backup inválido ou corrompido.");
      return false;
    }

    const restoredPayouts = backup.payoutsCompleted || payoutsCompleted;
    const restoredMonth = backup.currentMonth || currentMonth;
    const restoredLoans = backup.loans || loans;
    const restoredConfig = backup.appConfig ? { ...appConfig, ...backup.appConfig } : appConfig;

    if (backup.carouselSlides) {
      setCarouselSlides(backup.carouselSlides);
      localStorage.setItem('kix_carousel_slides', JSON.stringify(backup.carouselSlides));
    }

    // Log this action
    const newLog: KixLog = {
      id: `restore-${Date.now()}`,
      timestamp: new Date().toISOString(),
      type: 'policy_change',
      amount: 0,
      description: `RESTAURAÇÃO DO SISTEMA: O sistema e os dados históricos foram totalmente restaurados a partir de um backup restaurável de ${new Date(backup.timestamp || Date.now()).toLocaleString('pt-PT')}.`,
      month: restoredMonth,
    };

    const updatedLogs = [newLog, ...backup.logs];

    // Save and queue to Firestore
    saveState(backup.members, updatedLogs, restoredPayouts, restoredMonth, restoredLoans, restoredConfig);

    return true;
  };

  // Dynamic font and theme style overrides based on Admin personalized parameters
  const fontFamilySetting = appConfig.fontFamily || 'inter';
  const fontSizeSetting = appConfig.fontSize || 'normal';
  const primaryColorSetting = appConfig.primaryColorTheme || 'emerald';

  let fontCSS = '';
  if (fontFamilySetting === 'outfit') {
    fontCSS = `--font-sans: 'Outfit', sans-serif !important; --font-display: 'Outfit', sans-serif !important;`;
  } else if (fontFamilySetting === 'mono') {
    fontCSS = `--font-sans: 'JetBrains Mono', monospace !important; --font-display: 'JetBrains Mono', monospace !important;`;
  } else if (fontFamilySetting === 'playfair') {
    fontCSS = `--font-sans: 'Playfair Display', Georgia, serif !important; --font-display: 'Playfair Display', Georgia, serif !important;`;
  } else if (fontFamilySetting === 'space') {
    fontCSS = `--font-sans: 'Space Grotesk', sans-serif !important; --font-display: 'Space Grotesk', sans-serif !important;`;
  } else {
    fontCSS = `--font-sans: 'Inter', sans-serif !important; --font-display: 'Outfit', 'Inter', sans-serif !important;`;
  }

  let fontSizeCSS = '';
  if (fontSizeSetting === 'compact') {
    fontSizeCSS = `:root, html { font-size: 14px !important; }`;
  } else if (fontSizeSetting === 'normal') {
    fontSizeCSS = `:root, html { font-size: 16px !important; }`;
  } else if (fontSizeSetting === 'medium') {
    fontSizeCSS = `:root, html { font-size: 18px !important; }`;
  } else if (fontSizeSetting === 'large') {
    fontSizeCSS = `:root, html { font-size: 20px !important; }`;
  } else if (fontSizeSetting === 'xlarge') {
    fontSizeCSS = `:root, html { font-size: 22px !important; }`;
  }

  const colorsMap = {
    emerald: {
      50: '#ecfdf5', 100: '#d1fae5', 200: '#a7f3d0', 300: '#6ee7b7', 400: '#34d399',
      500: '#10b981', 600: '#059669', 700: '#047857', 800: '#065f46', 900: '#064e3b', 950: '#022c22'
    },
    indigo: {
      50: '#eef2ff', 100: '#e0e7ff', 200: '#c7d2fe', 300: '#a5b4fc', 400: '#818cf8',
      500: '#6366f1', 600: '#4f46e5', 700: '#4338ca', 800: '#3730a3', 900: '#312e81', 950: '#1e1b4b'
    },
    teal: {
      50: '#f0fdfa', 100: '#ccfbf1', 200: '#99f6e4', 300: '#5eead4', 400: '#2dd4bf',
      500: '#14b8a6', 600: '#0d9488', 700: '#0f766e', 800: '#115e59', 900: '#134e4a', 950: '#042f2e'
    },
    coral: {
      50: '#fff7ed', 100: '#ffedd5', 200: '#fed7aa', 300: '#fdba74', 400: '#fb923c',
      500: '#f97316', 600: '#ea580c', 700: '#c2410c', 800: '#9a3412', 900: '#7c2d12', 950: '#431407'
    },
    amber: {
      50: '#fffbeb', 100: '#fef3c7', 200: '#fde68a', 300: '#fcd34d', 400: '#fbbf24',
      500: '#f59e0b', 600: '#d97706', 700: '#b45309', 800: '#92400e', 900: '#78350f', 950: '#451a03'
    },
    violet: {
      50: '#f5f3ff', 100: '#ede9fe', 200: '#ddd6fe', 300: '#c4b5fd', 400: '#a78bfa',
      500: '#8b5cf6', 600: '#7c3aed', 700: '#6d28d9', 800: '#5b21b6', 900: '#4c1d95', 950: '#2e1065'
    },
    slate: {
      50: '#f8fafc', 100: '#f1f5f9', 200: '#e2e8f0', 300: '#cbd5e1', 400: '#94a3b8',
      500: '#64748b', 600: '#475569', 700: '#334155', 800: '#1e293b', 900: '#0f172a', 950: '#020617'
    },
    bordeaux: {
      50: '#fdf2f2', 100: '#fbd5d7', 200: '#f7abaf', 300: '#f0757d', 400: '#e04652',
      500: '#77181e', 600: '#651016', 700: '#52080e', 800: '#41040a', 900: '#310106', 950: '#1c0003'
    },
    royal_plum: {
      50: '#faf5ff', 100: '#f3e8ff', 200: '#e4ccff', 300: '#caa0ff', 400: '#a462f6',
      500: '#2a044a', 600: '#23023e', 700: '#1b0132', 800: '#140026', 900: '#0d001a', 950: '#07000f'
    },
    fire_coral: {
      50: '#fff5f2', 100: '#ffe5df', 200: '#ffccbf', 300: '#ffaa95', 400: '#ff7f64',
      500: '#e84b2c', 600: '#cb381b', 700: '#ab270d', 800: '#8c1b05', 900: '#6e1001', 950: '#4a0700'
    },
    dark_zinc: {
      50: '#fafafa', 100: '#f4f4f5', 200: '#e4e4e7', 300: '#d4d4d8', 400: '#a1a1aa',
      500: '#2f2e30', 600: '#242325', 700: '#1b1a1c', 800: '#121213', 900: '#0a090a', 950: '#050505'
    },
    solid_navy: {
      50: '#f0f5fa', 100: '#d9e6f5', 200: '#b5cfe6', 300: '#86add1', 400: '#5285b8',
      500: '#092b5a', 600: '#072147', 700: '#051937', 800: '#041126', 900: '#020b1a', 950: '#01050f'
    },
    sky_frost: {
      50: '#f0f9ff', 100: '#e0f2fe', 200: '#bae6fd', 300: '#abe4ff', 400: '#38bdf8',
      500: '#0ea5e9', 600: '#0284c7', 700: '#0369a1', 800: '#075985', 900: '#0c4a6e', 950: '#082f49'
    },
    ocean_teal: {
      50: '#f0fdfa', 100: '#ccfbf1', 200: '#99f6e4', 300: '#5eead4', 400: '#2dd4bf',
      500: '#09738a', 600: '#045e72', 700: '#024a5b', 800: '#013744', 900: '#002732', 950: '#001720'
    }
  };

  const selectedPalette = colorsMap[primaryColorSetting as keyof typeof colorsMap] || colorsMap.emerald;

  const colorOverridesCSS = `
    :root {
      --color-emerald-50: ${selectedPalette[50]} !important;
      --color-emerald-100: ${selectedPalette[100]} !important;
      --color-emerald-200: ${selectedPalette[200]} !important;
      --color-emerald-300: ${selectedPalette[300]} !important;
      --color-emerald-400: ${selectedPalette[400]} !important;
      --color-emerald-500: ${selectedPalette[500]} !important;
      --color-emerald-600: ${selectedPalette[600]} !important;
      --color-emerald-700: ${selectedPalette[700]} !important;
      --color-emerald-800: ${selectedPalette[800]} !important;
      --color-emerald-900: ${selectedPalette[900]} !important;
      --color-emerald-950: ${selectedPalette[950]} !important;

      --color-teal-50: ${selectedPalette[50]} !important;
      --color-teal-100: ${selectedPalette[100]} !important;
      --color-teal-200: ${selectedPalette[200]} !important;
      --color-teal-300: ${selectedPalette[300]} !important;
      --color-teal-400: ${selectedPalette[400]} !important;
      --color-teal-500: ${selectedPalette[500]} !important;
      --color-teal-600: ${selectedPalette[600]} !important;
      --color-teal-700: ${selectedPalette[700]} !important;
      --color-teal-800: ${selectedPalette[800]} !important;
      --color-teal-900: ${selectedPalette[900]} !important;
      --color-teal-950: ${selectedPalette[950]} !important;
    }
  `;

  const appStylesElement = (
    <style>{`
      :root {
        ${fontCSS}
      }
      ${fontSizeCSS}
      ${colorOverridesCSS}
    `}</style>
  );

  if (isLoadingDb) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-slate-950 text-white font-sans p-6 relative">
        <div 
          className="absolute inset-0 bg-cover bg-center select-none pointer-events-none opacity-5" 
          style={{ backgroundImage: `url('https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?auto=format&fit=crop&q=80&w=2000')` }} 
        />
        {appStylesElement}
        <div className="relative text-center max-w-md w-full p-8 border border-slate-800 bg-slate-900/80 rounded-2xl backdrop-blur-md shadow-2xl flex flex-col items-center gap-6">
          <div className="w-16 h-16 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin" />
          <div className="flex flex-col gap-2">
            <h1 className="text-xl font-bold tracking-tight text-white">Kixi-Fundo</h1>
            <p className="text-sm text-slate-400">A obter informação da Base de Dados Cloud...</p>
          </div>
          <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
            <div className="bg-emerald-500 h-full w-2/3 animate-pulse rounded-full" />
          </div>
          <p className="text-[10px] text-slate-500 font-mono tracking-wider uppercase">Operando fora do browser para segurança de depósitos</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <>
        {appStylesElement}
        <LoginScreen
          members={members}
          onLogin={(user) => {
            setCurrentUser(user);
            localStorage.setItem('kix_current_user', JSON.stringify(user));
            setActiveTab('inicio');
          }}
          userEmail="lmendesvictor@gmail.com"
          onResetPassword={handleResetPassword}
        />
      </>
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-250 flex flex-col w-full font-sans antialiased relative ${
      theme === 'dark' ? 'bg-[#111827] text-slate-100' : 'bg-slate-50 text-slate-800'
    }`}>
      {/* Universal Financial Growth Watermark Background */}
      <div 
        className="pointer-events-none fixed inset-0 z-0 bg-cover bg-center bg-no-repeat transition-opacity duration-300 select-none"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?auto=format&fit=crop&q=80&w=2000')`,
          opacity: theme === 'dark' ? 0.045 : 0.08,
          mixBlendMode: (theme === 'dark' ? 'overlay' : 'multiply') as any
        }}
      />
      {appStylesElement}
      
      {/* Dynamic Top Navbar styled exactly to replicate the uploaded user blueprint */}
      <nav className="w-full bg-[#0284c7] border-b border-sky-600 shadow-md sticky top-0 z-40 select-none">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20 gap-4">
            {/* Left side brand details with Stacked coin emblem */}
            <div className="flex items-center gap-2.5 cursor-pointer hover:scale-[1.02] active:scale-95 transition-all duration-300 shrink-0" onClick={() => setActiveTab('inicio')}>
              <div className="w-9 h-9 sm:w-10 sm:h-10 bg-amber-400 text-[#0284c7] rounded-full flex items-center justify-center font-black text-lg sm:text-xl shadow-md border-2 border-white leading-none">
                $
              </div>
              <div>
                <span className="text-base sm:text-lg font-black text-white leading-none tracking-tight font-display block">
                  Kixi-Fundo
                </span>
                <span className="text-[7.5px] sm:text-[8px] font-bold text-sky-100/90 tracking-wider font-sans leading-none mt-1 uppercase block">
                  Gestão de Finanças
                </span>
              </div>
            </div>

            {/* Desktop Navigation Row (hidden on mobile, flex on desktop) */}
            <div className="hidden md:flex items-center gap-1 px-1 py-1 overflow-x-auto scrollbar-none whitespace-nowrap lg:overflow-visible flex-1 justify-center max-w-4xl">
              {allowedNavigationItems.map((item) => {
                const isActive = activeTab === item.id;
                
                return (
                  <button
                    key={item.id}
                    onClick={() => navigateToTab(item.id)}
                    className={`px-2.5 sm:px-3 py-1.8 rounded-xl text-xs font-bold transition-all duration-300 flex items-center gap-1 cursor-pointer hover:scale-105 active:scale-95 shrink-0 ${
                      isActive
                        ? 'bg-white text-sky-700 shadow-md font-black border border-white'
                        : 'text-white hover:bg-white/12 hover:text-white'
                    }`}
                  >
                    <span className="shrink-0">{item.icon}</span>
                    <span>{item.id === 'membro-dashboard' ? 'Minha Área' : item.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Mobile Actions and Controls Row (visible only on mobile) */}
            <div className="flex md:hidden items-center gap-2 shrink-0">
              {/* Moon / Sun minimal theme selector for quick access on mobile */}
              <button
                onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
                title={theme === 'light' ? 'Mudar para Escuro' : 'Mudar para Claro'}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/15 text-white transition-all cursor-pointer flex items-center justify-center shrink-0 w-8.5 h-8.5 border border-white/10"
              >
                {theme === 'light' ? (
                  <Moon className="w-4 h-4 text-white" />
                ) : (
                  <Sun className="w-4 h-4 text-amber-300 animate-pulse" />
                )}
              </button>

              {/* Mobile Navigation Dropdown Trigger Box */}
              <div className="relative" id="kix-mobile-nav-container">
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="flex items-center justify-between bg-white/10 hover:bg-white/15 text-white active:scale-95 transition-all duration-200 rounded-xl px-3 py-2 text-[11.5px] font-extrabold border border-white/10 cursor-pointer shadow-inner gap-1.5 h-8.5"
                  id="kix-mobile-toggle-btn"
                >
                  <div className="flex items-center gap-1.5 overflow-hidden max-w-[84px] truncate">
                    {activeTabItem ? (
                      <>
                        <span className="shrink-0 text-amber-300">{activeTabItem.icon}</span>
                        <span className="truncate">{activeTabItem.id === 'membro-dashboard' ? 'Minha Área' : activeTabItem.label}</span>
                      </>
                    ) : (
                      <span>Menu</span>
                    )}
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 shrink-0 opacity-80" />
                </button>

                {/* Mobile searchable menu panel (properly right-aligned to fit smart screens perfectly without overflow) */}
                {isMenuOpen && (
                  <div 
                    className="absolute right-0 top-full mt-2 w-64 rounded-2xl p-4 shadow-2xl border backdrop-blur-md z-50 flex flex-col gap-3 bg-white dark:bg-slate-900 border-slate-205 dark:border-slate-800 text-slate-800 dark:text-slate-100 animate-in fade-in slide-in-from-top-2 duration-150"
                    id="kix-mobile-nav-dropdown"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="relative">
                      <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Pesquisar menu..."
                        value={menuSearchQuery}
                        onChange={(e) => setMenuSearchQuery(e.target.value)}
                        className="w-full pl-8 pr-7 py-1 text-xs rounded-xl border border-slate-250 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 focus:outline-none focus:ring-1.5 focus:ring-sky-500 text-slate-950 dark:text-slate-50 placeholder:text-slate-405 font-sans"
                        id="kix-menu-search-input"
                        autoFocus
                      />
                      {menuSearchQuery && (
                        <button
                          onClick={() => setMenuSearchQuery('')}
                          className="absolute right-2 top-1.5 text-slate-450 hover:text-slate-600 cursor-pointer"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>

                    <div className="max-h-52 overflow-y-auto space-y-1 mt-1 pr-0.5">
                      {filteredNavigationItems.length === 0 ? (
                        <div className="text-center text-[11px] text-slate-500 py-4 font-sans">Menu não encontrado</div>
                      ) : (
                        filteredNavigationItems.map((item) => {
                          const isActive = activeTab === item.id;
                          return (
                            <button
                              key={item.id}
                              onClick={() => {
                                navigateToTab(item.id);
                                setIsMenuOpen(false);
                                setMenuSearchQuery('');
                              }}
                              className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all duration-200 cursor-pointer ${
                                isActive
                                  ? 'bg-sky-500/10 text-sky-700 dark:text-sky-400 border border-sky-500/10'
                                  : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'
                              }`}
                              id={`kix-mobile-nav-item-${item.id}`}
                            >
                              <span className={`${isActive ? 'text-sky-600 dark:text-sky-450' : 'text-slate-400 dark:text-slate-500'}`}>{item.icon}</span>
                              <span>{item.id === 'membro-dashboard' ? 'Minha Área' : item.label}</span>
                            </button>
                          );
                        })
                      )}
                    </div>

                    {/* Mobile Only: Status Metrics and Controls panel */}
                    <div className="border-t border-slate-100 dark:border-slate-800/80 pt-3 mt-1.5 space-y-3">
                      {/* Connection row */}
                      <div className="flex items-center justify-between gap-1.5 flex-wrap">
                        <div 
                          className={`flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[8.5px] font-black leading-none ${
                            isOnline 
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' 
                              : 'bg-amber-500/10 text-amber-500'
                          }`}
                          title={isOnline ? 'Online' : 'Offline'}
                        >
                          <div className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-amber-400 animate-pulse'}`} />
                          <span>{isOnline ? 'CONEXÃO EXCELENTE' : 'SINAL OFFLINE'}</span>
                        </div>

                        <div 
                          className={`flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[8.5px] font-black leading-none ${
                            isDbSyncing 
                              ? 'bg-emerald-500/15 text-emerald-500' 
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                          }`}
                        >
                          <Cloud className={`w-3 h-3 ${isDbSyncing ? 'animate-spin' : ''}`} />
                          <span>DATABASE GLOBAL</span>
                        </div>
                      </div>

                      {/* Pending Backup synchronizer bar inside Menu */}
                      {appConfig.autoBackUpGDrive === true && pendingSyncCount > 0 && (
                        <button
                          onClick={() => {
                            handleSyncPendingChanges(false);
                            setIsMenuOpen(false);
                          }}
                          disabled={isSyncingPending}
                          className="w-full flex items-center justify-between p-2 rounded-xl text-[10px] font-bold bg-amber-500/10 hover:bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-550/20 active:scale-95 transition-all cursor-pointer"
                        >
                          <div className="flex items-center gap-1.5">
                            {isSyncingPending ? (
                              <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-500" />
                            ) : (
                              <CloudOff className="w-3.5 h-3.5 shrink-0" />
                            )}
                            <span>Sincronizar Pendentes</span>
                          </div>
                          <span className="font-mono bg-amber-500/20 px-1.5 py-0.2 rounded-md font-black">{pendingSyncCount}</span>
                        </button>
                      )}

                      {/* Regulations modal trigger */}
                      <button
                        onClick={() => {
                          setShowRegulations(true);
                          setIsMenuOpen(false);
                        }}
                        className="w-full bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 border-2 border-dashed border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 font-extrabold text-[10.5px] tracking-wider py-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 shrink-0"
                      >
                        <BookOpen className="w-4 h-4 text-emerald-500" />
                        <span>NORMATIVOS DO KIX</span>
                      </button>

                      {/* Logout button */}
                      <button
                        onClick={() => {
                          localStorage.removeItem('kix_current_user');
                          setCurrentUser(null);
                        }}
                        className="w-full bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-[10.5px] uppercase tracking-wider py-2.5 rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sair da Conta (Logout)</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
            {/* Desktop Only status instruments - hidden on mobile, compact on desktop */}
            <div className="hidden md:flex items-center gap-1.5 sm:gap-2.5 shrink-0">

              {/* Cloud DB Sync Status Badge */}
              <div 
                className={`flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[8px] font-black leading-none ${
                  isDbSyncing 
                    ? 'bg-emerald-500/10 text-emerald-400 animate-pulse' 
                    : 'bg-emerald-500/5 text-emerald-500/60'
                }`}
                title={isDbSyncing ? 'A sincronizar dados com o servidor...' : 'Dados Sincronizados na Cloud'}
              >
                <Cloud className={`w-3 h-3 ${isDbSyncing ? 'animate-spin' : ''}`} />
                <span className="hidden md:inline">{isDbSyncing ? 'A SINCRONIZAR' : 'G-CLOUD ACTIVA'}</span>
              </div>

              {/* Connection Status Badge (Compact dot) */}
              <div 
                className={`flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[8px] font-black leading-none ${
                  isOnline 
                    ? 'bg-[#10B981]/15 text-[#D1FAE5]' 
                    : 'bg-amber-500/15 text-amber-300'
                }`}
                title={isOnline ? 'ONLINE' : 'OFFLINE'}
              >
                <div className={`w-1 h-1 rounded-full ${isOnline ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'}`} />
                <span className="hidden md:inline">{isOnline ? 'ONLINE' : 'OFFLINE'}</span>
              </div>

              {/* Pending Sync Counter Badge */}
              {appConfig.autoBackUpGDrive === true && (
                <button
                  onClick={() => handleSyncPendingChanges(false)}
                  disabled={isSyncingPending}
                  title={
                    pendingSyncCount > 0 
                      ? `${pendingSyncCount} alteração(ões) pendente(s) de envio para o Google Drive. Clique para sincronizar agora.`
                      : 'Todos os dados locais estão totalmente sincronizados com o Google Drive.'
                  }
                  className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[9px] font-extrabold shadow-xs transition-all cursor-pointer border select-none ${
                    pendingSyncCount > 0
                      ? isOnline 
                        ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-600 dark:text-amber-400 border-amber-500/30'
                        : 'bg-rose-500/10 hover:bg-rose-500/15 text-rose-550 dark:text-rose-400 border-rose-500/20'
                      : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                  }`}
                >
                  {isSyncingPending ? (
                    <RefreshCw className="w-3 h-3 animate-spin text-amber-500" />
                  ) : pendingSyncCount > 0 ? (
                    <CloudOff className="w-3 h-3 shrink-0" />
                  ) : (
                    <Cloud className="w-3 h-3 shrink-0 text-emerald-500" />
                  )}
                  <span className="hidden sm:inline ml-0.5">
                    {isSyncingPending 
                      ? 'A Sincronizar...' 
                      : pendingSyncCount > 0 
                        ? `Pendentes (${pendingSyncCount})` 
                        : 'Sincronizado'}
                  </span>
                  {pendingSyncCount > 0 && <span className="sm:hidden font-mono">({pendingSyncCount})</span>}
                </button>
              )}

              {/* Normativos do Kix-Fundo Button */}
              <button
                onClick={() => setShowRegulations(true)}
                title="Ver Normativos do Kix-Fundo"
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-[10px] uppercase tracking-wider px-2 py-1.5 sm:py-1 rounded-lg shadow-sm transition-all cursor-pointer flex items-center gap-1 shrink-0 select-none"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">NORMATIVOS</span>
              </button>

              {/* Moon / Sun theme selector */}
              <button
                onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
                title={theme === 'light' ? 'Mudar para Escuro' : 'Mudar para Claro'}
                className="p-1.5 rounded-full hover:bg-white/10 text-white transition-all cursor-pointer flex items-center justify-center shrink-0"
              >
                {theme === 'light' ? (
                  <Moon className="w-3.5 h-3.5 text-white" />
                ) : (
                  <Sun className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
                )}
              </button>

              {/* Red exit Logout button */}
              <button
                onClick={() => {
                  localStorage.removeItem('kix_current_user');
                  setCurrentUser(null);
                }}
                className="bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-[10px] uppercase tracking-wider px-2 py-1 rounded-lg shadow-sm transition-all cursor-pointer flex items-center gap-1 shrink-0 select-none"
              >
                <LogOut className="w-3 h-3" />
                <span className="hidden sm:inline">SAIR</span>
              </button>
            </div>

          </div>
        </div>
      </nav>

      {/* Main Container Area */}
      <div className="flex-1 flex flex-col overflow-hidden min-h-screen">

        {/* Highly visible Cloud Quota Limit banner with soft spring animation */}
        <AnimatePresence>
          {isFirestoreQuotaExceeded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="bg-amber-500 text-slate-950 text-[11px] font-semibold px-4 py-3 flex items-center justify-center gap-2 shadow-md text-center shrink-0 z-45 select-none overflow-hidden border-b border-amber-600"
            >
              <div className="flex items-center gap-3 justify-between max-w-5xl mx-auto w-full flex-wrap">
                <div className="flex items-center gap-2 text-left flex-1 min-w-[280px]">
                  <span className="flex items-center justify-center p-1 rounded-full bg-slate-900/10 text-slate-900 shrink-0">
                    <CloudOff className="w-4 h-4" />
                  </span>
                  <span>
                    <strong>Limite Cloud Excedido (Modo de Sincronização Local Ativo):</strong> A quota gratuita de gravação na nuvem foi atingida temporariamente. Pode continuar a trabalhar normalmente: <strong>todas as suas alterações estão guardadas de forma 100% segura no seu dispositivo</strong> e serão enviadas para a nuvem automaticamente amanhã!
                  </span>
                </div>
                
                {/* Download Backup Button for instant peace of mind */}
                <button
                  onClick={() => {
                    const backupPayload = {
                      version: 3,
                      timestamp: new Date().toISOString(),
                      members,
                      logs,
                      payoutsCompleted,
                      currentMonth,
                      loans,
                      appConfig
                    };
                    const blob = new Blob([JSON.stringify(backupPayload, null, 2)], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `kixi-fundo-segurança-${new Date().toISOString().slice(0, 10)}.json`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                  }}
                  className="px-3 py-1 bg-slate-950 text-white rounded-lg text-[10px] font-extrabold uppercase tracking-wider hover:bg-slate-800 transition-all cursor-pointer active:scale-95 flex items-center gap-1.5 shrink-0"
                >
                  <Download className="w-3 h-3" />
                  Baixar Cópia de Segurança
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Highly visible offline mode banner with soft spring animation */}
        <AnimatePresence>
          {!isOnline && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="bg-rose-600 dark:bg-rose-700 text-white text-[11px] font-semibold px-4 py-3 flex items-center justify-center gap-2 shadow-md text-center shrink-0 z-40 select-none overflow-hidden border-b border-rose-700 dark:border-rose-800"
            >
              <div className="flex items-center gap-2 justify-center flex-wrap max-w-5xl mx-auto">
                <span className="flex items-center justify-center p-1 rounded-full bg-white/20 animate-pulse text-white">
                  <AlertCircle className="w-4 h-4" />
                </span>
                <span>
                  <strong>Aviso de Rede (Modo Offline Ativo):</strong> O seu dispositivo está sem ligação à Internet. Pode inserir pagamentos, verificar extratos e simular ciclos — todas as alterações serão salvas com segurança na memória local do navegador, e sincronizadas com a nuvem do Google Drive assim que restabelecer a rede.
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Sidebar Tab Filter Switch Content panel */}
        <main className="flex-1 p-4 sm:p-6 pb-36 space-y-8 overflow-y-auto">
          
          <AnimatePresence mode="wait">
            {activeTab === 'inicio' && (
              <motion.div
                key="inicio"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-8 max-w-7xl mx-auto"
              >
                {/* Welcome Message & Financial Governance Header */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between pb-2 border-b border-slate-100 dark:border-slate-800/80 gap-4">
                  <div>
                    <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                      <span>🏛️</span> Kix-Fundo • Governação Financeira
                    </h1>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Monitorização em tempo real das cotizações, poupanças e fluxos acumulados do Fundo Social Cooperativo.
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-50 dark:bg-sky-950/30 border border-sky-100 dark:border-sky-900/30 rounded-xl text-sky-700 dark:text-sky-300 text-xs font-bold leading-none w-fit">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    Portal Transparente • Ciclo Ativo
                  </div>
                </div>

                {/* Custom Admin Announcement Message Banner */}
                {appConfig.customDashboardMessage && (
                  <div className={`p-4 rounded-2xl border flex items-start gap-4 relative overflow-hidden transition-all shadow-sm backdrop-blur-md ${
                    theme === 'dark' 
                      ? 'bg-slate-900/40 border-slate-800/60 text-slate-200' 
                      : 'bg-white/45 border-slate-200/50 text-slate-800'
                  }`}>
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500 shrink-0 text-sm">
                      📢
                    </span>
                    <div className="flex-1 space-y-0.5">
                      <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                        Comunicado do Administrador
                      </h4>
                      <p className="text-xs font-semibold leading-relaxed">
                        {appConfig.customDashboardMessage}
                      </p>
                    </div>
                  </div>
                )}

                {/* Metric Cards Banner */}
                <MetricCards
                  currentMonth={currentMonth}
                  socialBalance={socialBalance}
                  currentPaidCount={currentMonthPaidCount}
                  currentCollected={currentMonthCollected}
                  totalMembersCount={12}
                  beneficiaries={getBeneficiariesList()}
                  isPayoutDone={isCurrentMonthPayoutDone}
                  totalQuotasCollected={totalQuotasCollected}
                  totalSocialRetained={totalSocialRetained}
                  totalSocialDisbursed={totalSocialDisbursed}
                  totalBeneficiaryDestined={totalBeneficiaryDestined}
                  totalBeneficiaryPaid={totalBeneficiaryPaid}
                  totalBeneficiaryPending={totalBeneficiaryPending}
                  payoutsCompleted={payoutsCompleted}
                  members={members}
                />

                {/* Coordenadas Bancárias & Código QR de Depósito Directo */}
                <IbanQrCodeWidget 
                  bankIban={appConfig.bankIban}
                  bankName={appConfig.bankName || 'Banco BIC Angola'}
                  accountOwner="KIXI-FUNDO"
                  theme={theme}
                />

                {/* Subtitle / Quote Section */}
                <div className="pt-6 border-t border-slate-100 dark:border-slate-800/80 text-center max-w-3xl mx-auto py-2">
                  <span className="text-2xl">🤝</span>
                  <p className="text-xs text-sky-600 dark:text-sky-400 font-extrabold uppercase tracking-widest mt-1">Gestão de Investimentos Rotativos</p>
                  <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                    "O Kixi-Fundo promove o fortalecimento socioeconómico sustentado de todos os nossos membros, gerando inclusão, poupança de interajuda e progresso coletivo."
                  </p>
                </div>

                {/* Bento Grid: 4 Secções (Missão, Visão, Valores, Objectivo) de Finanças Comparticipadas - MAGNIFICADAS */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
                  {/* Missão Card */}
                  <motion.div
                    whileHover={{ y: -8, scale: 1.02 }}
                    className="bg-white/45 dark:bg-slate-900/40 backdrop-blur-md rounded-[2.5rem] border border-slate-200/55 dark:border-slate-800/60 p-10 md:p-12 shadow-lg flex flex-col justify-between space-y-8 relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:border-sky-350 dark:hover:border-sky-850"
                  >
                    <div className="absolute top-0 right-0 w-44 h-44 bg-sky-500/5 rounded-bl-full pointer-events-none" />
                    <div className="space-y-6 relative z-10">
                      {/* Target round icon */}
                      <div className="w-20 h-20 bg-sky-50 dark:bg-sky-950/40 text-sky-600 rounded-3xl flex items-center justify-center shadow-md">
                        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <circle cx="12" cy="12" r="10" strokeWidth="2" stroke="currentColor" />
                          <circle cx="12" cy="12" r="6" strokeWidth="2" stroke="currentColor" />
                          <circle cx="12" cy="12" r="2" strokeWidth="3" fill="currentColor" stroke="currentColor" />
                        </svg>
                      </div>
                      
                      <h3 className="text-2xl font-black font-sans text-slate-900 dark:text-white tracking-tight">
                        Missão
                      </h3>
                      <p className="text-[13px] sm:text-sm md:text-[15px] leading-relaxed text-slate-600 dark:text-slate-100 font-semibold font-sans">
                        Promover a poupança cooperativa, o autofinanciamento e a ajuda mútua, gerindo os recursos com rigor, transparência e responsabilidade coletiva.
                      </p>
                    </div>
                  </motion.div>

                  {/* Visão Card */}
                  <motion.div
                    whileHover={{ y: -8, scale: 1.02 }}
                    className="bg-white/45 dark:bg-slate-900/40 backdrop-blur-md rounded-[2.5rem] border border-slate-200/55 dark:border-slate-800/60 p-10 md:p-12 shadow-lg flex flex-col justify-between space-y-8 relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:border-purple-350 dark:hover:border-purple-850"
                  >
                    <div className="absolute top-0 right-0 w-44 h-44 bg-purple-500/5 rounded-bl-full pointer-events-none" />
                    <div className="space-y-6 relative z-10">
                      {/* Eye round icon */}
                      <div className="w-20 h-20 bg-purple-50 dark:bg-purple-950/40 text-purple-600 rounded-3xl flex items-center justify-center shadow-md">
                        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </div>
                      
                      <h3 className="text-2xl font-black font-sans text-slate-900 dark:text-white tracking-tight">
                        Visão
                      </h3>
                      <p className="text-[13px] sm:text-sm md:text-[15px] leading-relaxed text-slate-600 dark:text-slate-100 font-semibold font-sans">
                        Ser a maior e mais confiável plataforma de consórcios rotativos, reconhecida pela excelência em gestão e impacto positivo nas famílias cooperadoras.
                      </p>
                    </div>
                  </motion.div>

                  {/* Valores Card */}
                  <motion.div
                    whileHover={{ y: -8, scale: 1.02 }}
                    className="bg-white/45 dark:bg-slate-900/40 backdrop-blur-md rounded-[2.5rem] border border-slate-200/55 dark:border-slate-800/60 p-10 md:p-12 shadow-lg flex flex-col justify-between space-y-8 relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:border-amber-300 dark:hover:border-amber-850"
                  >
                    <div className="absolute top-0 right-0 w-44 h-44 bg-amber-500/5 rounded-bl-full pointer-events-none" />
                    <div className="space-y-6 relative z-10">
                      {/* Heart round icon for values */}
                      <div className="w-20 h-20 bg-amber-50 dark:bg-amber-950/40 text-amber-600 rounded-3xl flex items-center justify-center shadow-md font-black text-3xl select-none">
                        ♥
                      </div>
                      
                      <h3 className="text-2xl font-black font-sans text-slate-900 dark:text-white tracking-tight">
                        Valores
                      </h3>
                      <p className="text-[13px] sm:text-sm md:text-[15px] leading-relaxed text-slate-600 dark:text-slate-100 font-semibold font-sans">
                        Transparência absoluta, solidariedade recíproca, integridade absoluta de conduta, rigor financeiro e igualdade de oportunidade para todos os sócios.
                      </p>
                    </div>
                  </motion.div>

                  {/* Objectivo Card */}
                  <motion.div
                    whileHover={{ y: -8, scale: 1.02 }}
                    className="bg-white/45 dark:bg-slate-900/40 backdrop-blur-md rounded-[2.5rem] border border-slate-200/55 dark:border-slate-800/60 p-10 md:p-12 shadow-lg flex flex-col justify-between space-y-8 relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:border-emerald-350 dark:hover:border-emerald-850"
                  >
                    <div className="absolute top-0 right-0 w-44 h-44 bg-emerald-500/5 rounded-bl-full pointer-events-none" />
                    <div className="space-y-6 relative z-10">
                      {/* Compass round icon */}
                      <div className="w-20 h-20 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 rounded-3xl flex items-center justify-center shadow-md">
                        <Compass className="w-10 h-10" />
                      </div>
                      
                      <h3 className="text-2xl font-black font-sans text-slate-900 dark:text-white tracking-tight">
                        Objectivo
                      </h3>
                      <p className="text-[13px] sm:text-sm md:text-[15px] leading-relaxed text-slate-600 dark:text-slate-100 font-semibold font-sans">
                        Garantir a angariação rotativa mensal de capitais e promover o fomento de micro-poupanças estruturadas com redistribuição em apoio imediato.
                      </p>
                    </div>
                  </motion.div>
                </div>
              </motion.div>
            )}

            {/* MEMBER WORKSPACE REDIRECTION VIEW */}
            {activeTab === 'membro-dashboard' && (() => {
              const currentMemberToRender = (currentUser?.role === 'admin' && simulatedMemberId)
                ? (members.find(m => m.id === simulatedMemberId) || loggedInMember)
                : loggedInMember;
              return (
                <motion.div
                  key="membro-dashboard"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-6 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8"
                >
                  {currentUser?.role === 'admin' && (
                    <div className="mb-6 p-5 bg-amber-500/10 dark:bg-amber-500/5 border border-amber-550/25 dark:border-amber-500/15 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <span className="text-xl p-2 bg-amber-500/20 text-amber-500 rounded-xl">🕵️‍♂️</span>
                        <div>
                          <h4 className="text-xs font-bold text-amber-900 dark:text-amber-450 uppercase tracking-wider leading-none mb-1.5 font-display">
                            Simulador do Coordenador: Visualização Autónoma do Membro
                          </h4>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-xl leading-relaxed font-medium">
                            Selecione qualquer membro ativo do consórcio para inspecionar exatamente a sua perspetiva, dados pessoais, quotas pagas/pendentes e as informações que ele visualiza.
                          </p>
                        </div>
                      </div>
                      <select
                        value={simulatedMemberId || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          setSimulatedMemberId(val ? Number(val) : null);
                        }}
                        className="w-full md:w-auto bg-white dark:bg-slate-800 border border-slate-205 dark:border-slate-700 px-3 py-2 rounded-xl text-xs font-bold focus:outline-none text-slate-900 dark:text-white cursor-pointer"
                      >
                        <option value="">Foco: Meu Perfil ({loggedInMember?.name})</option>
                        {members.map(m => (
                          <option key={m.id} value={m.id}>
                            Membro: {m.name} ({getMemberIdCode(m.name, m.phone).substring(4, 9)})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  {currentMemberToRender ? (
                    <MemberProfileWorkspace
                      member={currentMemberToRender}
                      currentMonth={currentMonth}
                      members={members}
                      onToggleContribution={handleToggleContribution}
                      logs={logs}
                      setMembers={setMembers}
                      setLogs={setLogs}
                      saveState={saveState}
                      loans={loans}
                    />
                  ) : (
                    <div className="p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-center">
                      <p className="text-slate-500 dark:text-slate-400 text-xs font-medium">Membro não localizado para o utilizador atual.</p>
                    </div>
                  )}
                </motion.div>
              );
            })()}

            {activeTab === 'members' && members.length > 0 && (
              <motion.div
                key="members"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8"
              >
                <MembersTable
                  currentMonth={currentMonth}
                  members={members}
                  onToggleContribution={handleToggleContribution}
                  beneficiariesIds={currentMonthBeneficiaries.map((b) => b.id)}
                  setMembers={setMembers}
                  saveState={saveState}
                  logs={logs}
                  setLogs={setLogs}
                  theme={theme}
                  currentUser={currentUser}
                  onRegisterSecurityAttempt={registerSecurityAttempt}
                />
              </motion.div>
            )}

            {activeTab === 'cycles' && (
              <motion.div
                key="cycles"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6 max-w-7xl mx-auto"
              >
                {/* Subtab Toggle */}
                <div className="flex border-b border-slate-100 dark:border-slate-800/80 pb-px mb-2">
                  <button
                    onClick={() => setCyclesSubTab('ledger')}
                    className={`px-5 py-3 text-xs font-black uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
                      cyclesSubTab === 'ledger'
                        ? 'border-sky-500 text-sky-600 dark:text-sky-400'
                        : 'border-transparent text-slate-400 hover:text-slate-650 dark:hover:text-slate-200'
                    }`}
                  >
                    Tabela de Pagamentos (Imagem 1)
                  </button>
                  <button
                    onClick={() => setCyclesSubTab('planner')}
                    className={`px-5 py-3 text-xs font-black uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
                      cyclesSubTab === 'planner'
                        ? 'border-sky-500 text-sky-600 dark:text-sky-400'
                        : 'border-transparent text-slate-400 hover:text-slate-650 dark:hover:text-slate-200'
                    }`}
                  >
                    Plano de Rotação (Ciclos)
                  </button>
                </div>

                {cyclesSubTab === 'ledger' ? (
                  <PaymentsLedger
                    currentMonth={currentMonth}
                    members={members}
                    setMembers={setMembers}
                    logs={logs}
                    setLogs={setLogs}
                    saveState={saveState}
                    formatCurrency={formatCurrency}
                  />
                ) : (
                  <div className="space-y-6">
                    {currentUser.role === 'admin' && (
                      /* Dynamic Warning and Action Center for active month benefits control */
                      <div className={`p-5 rounded-2xl border transition-colors ${
                        theme === 'dark' ? 'bg-[#1e293b]/50 border-slate-700' : 'bg-white border-slate-200'
                      }`}>
                        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-6">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Coins className="w-4 h-4 text-emerald-500" />
                              <h3 className={`font-display font-bold text-xs uppercase tracking-wide ${
                                theme === 'dark' ? 'text-white' : 'text-slate-800'
                              }`}>
                                Controle de Liquidação de Benefícios — Mês {currentMonth}
                              </h3>
                            </div>

                            {isCurrentMonthPayoutDone ? (
                              <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-3.5 flex items-start gap-3">
                                <CheckCircle className="w-4.5 h-4.5 text-emerald-600 shrink-0 mt-0.5" />
                                <div>
                                  <h4 className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Ciclo Concluído & Liquidado</h4>
                                  <p className="text-[11px] text-emerald-700 mt-0.5 leading-relaxed">
                                    O pagamento total de <strong>1.200.000,00 KZs</strong> já foi repassado com sucesso aos beneficiários correspondentes do ciclo. A parcela retida de <strong>240.000,00 KZs</strong> já está definitivamente computada na poupança social de interajuda.
                                  </p>
                                </div>
                              </div>
                            ) : currentMonthPaidCount === 12 ? (
                              <div className="bg-[#10B981]/10 border border-[#10B981]/30 rounded-lg p-3.5 flex items-start gap-3">
                                <ShieldCheck className="w-4.5 h-4.5 text-emerald-600 shrink-0 mt-0.5" />
                                <div>
                                  <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Arrecadação Concluída (100%)</h4>
                                  <p className="text-[11px] text-emerald-300 mt-0.5 leading-relaxed">
                                    Perfeito! Todos os 12 membros contribuíram com a cota mensal de 120.000,00 KZs. O capital de <strong>1.200.000,00 KZs</strong> está totalmente pronto para desembolso aos beneficiários deste ciclo.
                                  </p>
                                </div>
                              </div>
                            ) : (
                              <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3.5 flex items-start gap-3">
                                <AlertCircle className="w-4.5 h-4.5 text-amber-500 shrink-0 mt-0.5" />
                                <div>
                                  <h4 className="text-xs font-bold text-amber-500 uppercase tracking-wider">Arrecadação Parcial Incompleta</h4>
                                  <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                                    Registrados <strong>{currentMonthPaidCount} de 12</strong> pagamentos ({formatCurrency(currentMonthCollected)}). Faltam arrecadar {12 - currentMonthPaidCount} cotas (<strong>{formatCurrency(1440000 - currentMonthCollected)}</strong>) para liberar a liquidação dos benefícios aos contemplados do mês.
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="flex flex-col justify-center min-w-[220px]">
                            <button
                              disabled={currentMonthPaidCount < 12 || isCurrentMonthPayoutDone}
                              onClick={handleExecutePayout}
                              className={`w-full py-3 px-4 rounded-lg text-xs font-bold uppercase tracking-wider text-center transition-all ${
                                isCurrentMonthPayoutDone
                                  ? (theme === 'dark' ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed' : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed')
                                  : currentMonthPaidCount < 12
                                  ? (theme === 'dark' ? 'bg-amber-500/5 text-amber-500 border border-amber-500/10 cursor-not-allowed' : 'bg-amber-50 text-amber-500 border border-amber-200 cursor-not-allowed')
                                  : 'bg-[#10B981] hover:bg-[#059669] text-white shadow-sm cursor-pointer'
                              }`}
                            >
                              {isCurrentMonthPayoutDone
                                ? 'Benefício já Liquidado'
                                : currentMonthPaidCount < 12
                                ? 'Pagamento Bloqueado'
                                : 'Confirmar Repasse (1.200.000,00)'}
                            </button>
                            <span className="text-[10px] text-slate-400 text-center mt-1.5 font-medium">
                              {currentMonthPaidCount < 12 && !isCurrentMonthPayoutDone
                                ? 'Requer contribuição total de todos os 12 membros.'
                                : 'Transfere 600.000,00 KZs a cada beneficiário.'}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    <SchedulesGrid
                      currentMonth={currentMonth}
                      members={members}
                      onSelectCycle={handleSelectCycle}
                      payoutDoneMap={payoutsCompleted}
                      isAdmin={currentUser.role === 'admin'}
                      onUpdateMembers={handleUpdateMembersFromSchedules}
                    />
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'social' && members.length > 0 && (
              <motion.div
                key="social"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8"
              >
                <SocialFundSection
                  members={members}
                  socialBalance={socialBalance}
                  currentMonth={currentMonth}
                  onRequestAid={handleRequestAid}
                  isAdmin={currentUser.role === 'admin'}
                />
              </motion.div>
            )}

            {activeTab === 'admin-module' && (
              <motion.div
                key="admin-module"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8"
              >
                <AdminModule
                  currentMonth={currentMonth}
                  members={members}
                  setMembers={setMembers}
                  logs={logs}
                  setLogs={setLogs}
                  saveState={saveState}
                  currentUser={currentUser}
                  payoutsCompleted={payoutsCompleted}
                  formatCurrency={formatCurrency}
                  handleToggleContribution={handleToggleContribution}
                  theme={theme}
                  appConfig={appConfig}
                  setAppConfig={setAppConfig}
                  carouselSlides={carouselSlides}
                  setCarouselSlides={setCarouselSlides}
                  onRestoreBackup={handleRestoreBackupState}
                  onRegisterSecurityAttempt={registerSecurityAttempt}
                />
              </motion.div>
            )}

            {activeTab === 'credit-management' && (
              <motion.div
                key="credit-management"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pb-10"
              >
                <CreditManagement
                  loans={loans}
                  members={members}
                  onAddLoan={handleAddLoan}
                  onPayInstallment={handlePayInstallment}
                  currentUser={currentUser}
                  currentMonth={currentMonth}
                  appConfig={appConfig}
                  setAppConfig={setAppConfig}
                  saveState={saveState}
                  logs={logs}
                />
              </motion.div>
            )}

            {activeTab === 'reports' && (
              <motion.div
                key="reports"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8"
              >
                <ReportsSection
                  currentMonth={currentMonth}
                  members={members}
                  logs={logs}
                  payoutsCompleted={payoutsCompleted}
                  formatCurrency={formatCurrency}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Render Ledger logs in mini variant on default dashboard too for real audit trail */}
          {activeTab === 'dashboard' && (
            <div className="hidden" />
          )}

        </main>

        {/* Minimal Footer displaying dynamic Kix app information */}
        <footer className={`fixed bottom-0 left-0 right-0 z-40 border-t py-2.5 text-xs transition-colors backdrop-blur-md ${
          theme === 'dark' ? 'bg-[#151c2c]/95 border-slate-800 text-slate-400' : 'bg-white/95 border-slate-200 text-slate-600'
        } shadow-[0_-4px_12px_rgba(0,0,0,0.06)]`}>
          <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-3">
            
            {/* Left Column: Essential copyright and info */}
            <div className="flex flex-col items-center md:items-start text-center md:text-left gap-0.5">
              <p className="font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5 leading-none text-[10px]">
                <span>🛡️</span> Todos os direitos reservados a kurkita software e desenvolvimento copyright @2026
              </p>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-3 gap-y-1 text-[10px] text-slate-500 dark:text-slate-400 font-bold mt-1">
                <span>📧 <strong className="font-bold text-slate-700 dark:text-slate-300">E-mail:</strong> <a href="mailto:geral.kurkita.ao" className="hover:text-amber-500 hover:underline transition">geral.kurkita.ao</a></span>
                <span className="hidden sm:inline">•</span>
                <span>📞 <strong className="font-bold text-slate-700 dark:text-slate-300">Telefone:</strong> <a href="tel:925204065" className="hover:text-amber-500 hover:underline transition">925204065</a></span>
                <span className="hidden sm:inline">•</span>
                <span>🌐 <strong className="font-bold text-slate-700 dark:text-slate-300">Website:</strong> <a href="http://www.kurkita.ao" target="_blank" rel="noopener noreferrer" className="hover:text-amber-500 hover:underline transition">www.kurkita.ao</a></span>
              </div>
            </div>

            {/* Right Column: Original shortcuts and deposit actions simplified */}
            <div className="flex flex-wrap items-center justify-center md:justify-end gap-2.5 shrink-0">
              <div 
                onClick={() => {
                  navigator.clipboard.writeText(appConfig.bankIban);
                  alert(`IBAN Copiado com Sucesso!\n\nCoordenadas da Plataforma para Depósito (Kixi-Fundo):\nIBAN: ${appConfig.bankIban}\nBanco: Banco BIC Angola\n\nGuarde este IBAN para efetuar as transferências das suas quotas.`);
                }}
                className="flex items-center gap-1.5 bg-red-500/10 dark:bg-rose-950/20 border border-red-500/30 text-slate-700 dark:text-red-200 px-2.5 py-1 rounded-lg cursor-pointer hover:bg-red-500/15 active:scale-95 transition-all text-[10px] font-black"
                title="Clique aqui para COPIAR o IBAN Coletivo de Depósito!"
              >
                <span>🏦</span>
                <span>IBAN: <span className="font-mono">{appConfig.bankIban}</span></span>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setShowRegulations(true)} className="hover:text-emerald-500 dark:hover:text-emerald-400 border border-slate-205 dark:border-slate-800 text-[10px] font-bold px-2 py-1 rounded-md bg-slate-50 dark:bg-slate-800/40 hover:bg-slate-100 transition-colors cursor-pointer">Normativos do Kix</button>
              </div>
            </div>
            
          </div>
        </footer>

      </div>

      {/* Mobile Sticky Bottom Navigation Dock */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-[#0284c7] border-t border-sky-600 shadow-xl z-50 px-2 pb-5 pt-2 text-white">
        <div className="flex items-center justify-around max-w-lg mx-auto">
          {allowedNavigationItems.slice(0, 4).map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  navigateToTab(item.id);
                  setIsMenuOpen(false);
                }}
                className={`flex flex-col items-center justify-center p-1 rounded-xl transition-all ${
                  isActive ? 'scale-105 font-bold text-amber-300' : 'text-slate-100 opacity-80'
                }`}
              >
                <div className={`p-1.5 rounded-full ${isActive ? 'bg-amber-400 text-sky-700 shadow' : 'bg-transparent text-white'}`}>
                  {item.icon}
                </div>
                <span className="text-[10px] font-black mt-1">
                  {item.id === 'membro-dashboard' ? 'Área' : item.label}
                </span>
              </button>
            );
          })}
          {allowedNavigationItems.length > 4 && (
            <button
              onClick={() => {
                setIsMenuOpen(!isMenuOpen);
                window.scrollTo({ top: 0, behavior: 'smooth' });
                const searchEl = document.getElementById('kix-menu-search-input');
                if (searchEl) searchEl.focus();
              }}
              className={`flex flex-col items-center justify-center p-1 rounded-xl transition-all ${
                isMenuOpen ? 'scale-105 font-bold text-amber-300' : 'text-slate-100 opacity-80'
              }`}
            >
              <div className={`p-1.5 rounded-full ${isMenuOpen ? 'bg-amber-400 text-sky-700 shadow' : 'bg-transparent text-white'}`}>
                <Menu className="w-3.5 h-3.5" />
              </div>
              <span className="text-[10px] font-black mt-1">Mais</span>
            </button>
          )}
        </div>
      </div>

      <RegulationsModal isOpen={showRegulations} onClose={() => setShowRegulations(false)} />
    </div>
  );
}

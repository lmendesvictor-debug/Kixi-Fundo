import { useState, useEffect } from 'react';
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
} from 'lucide-react';

import { Member, KixLog, CarouselSlide, getMemberIdCode } from './types';
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

import { 
  testFirestoreConnection, 
  loadStateFromFirestore, 
  saveStateToFirestore 
} from './firebaseSync';

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
  const [isLoadingDb, setIsLoadingDb] = useState<boolean>(() => {
    const saved = localStorage.getItem('kix_members');
    return !saved; // If cached database exists, bypass blocking loading screen completely
  });
  const [currentMonth, setCurrentMonth] = useState<number>(() => {
    return Number(localStorage.getItem('kix_current_month') || '1');
  });
  const [members, setMembers] = useState<Member[]>(() => {
    const saved = localStorage.getItem('kix_members');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch {}
    }
    return INITIAL_MEMBERS;
  });
  const [logs, setLogs] = useState<KixLog[]>(() => {
    const saved = localStorage.getItem('kix_logs');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch {}
    }
    return INITIAL_LOGS;
  });
  const [activeTab, setActiveTab] = useState<string>('inicio');
  const [isDbSyncing, setIsDbSyncing] = useState<boolean>(false);
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
    
    // Role-based defaults: admin always has access to administrative pages
    if (currentUser.role === 'admin') {
      return ['inicio', 'membro-dashboard', 'members', 'cycles', 'reports', 'dashboard', 'admin-module'].includes(tabId);
    }

    // Início, Pagamentos, Relatórios are open for all authorized profiles to guarantee top navbar transparency
    if (tabId === 'inicio') return true;
    if (tabId === 'reports') return true;
    if (tabId === 'cycles') return true;

    const m = loggedInMember;
    if (m && m.permissions) {
      if (tabId === 'dashboard') return !!m.permissions.accessDashboard;
      if (tabId === 'membro-dashboard') return currentUser.role !== 'admin' || !!m.permissions.accessDashboard;
      if (tabId === 'members') return !!m.permissions.accessMembersList;
      if (tabId === 'admin-module') return !!m.permissions.accessAdminModule;
    }

    return ['inicio', 'membro-dashboard', 'cycles', 'reports'].includes(tabId);
  };

  const allNavigationItems = [
    { id: 'inicio', label: 'Início', icon: <Wallet className="w-3.5 h-3.5" /> },
    { id: 'membro-dashboard', label: 'Minha Área', icon: <Users className="w-3.5 h-3.5" /> },
    { id: 'members', label: 'Cadastro', icon: <Users className="w-3.5 h-3.5" /> },
    { id: 'cycles', label: 'Pagamentos', icon: <Coins className="w-3.5 h-3.5" /> },
    { id: 'reports', label: 'Relatórios', icon: <FileText className="w-3.5 h-3.5" /> },
    { id: 'admin-module', label: 'Administração', icon: <ShieldCheck className="w-3.5 h-3.5" /> },
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

  interface AppConfig {
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
  }

  const [appConfig, setAppConfig] = useState<AppConfig>(() => {
    const saved = localStorage.getItem('kix_app_config');
    const defaults = {
      bankName: 'Banco BIC Angola',
      bankIban: 'AO06 0040 0000 7834 8291 1014 9',
      phone: '925204065',
      email: 'geral.kurkita.ao',
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

  useEffect(() => {
    localStorage.setItem('kix_app_config', JSON.stringify(appConfig));
    if (!isLoadingDb) {
      setIsDbSyncing(true);
      saveStateToFirestore({
        members,
        logs,
        payoutsCompleted,
        currentMonth,
        appConfig
      }).then(() => {
        setIsDbSyncing(false);
      }).catch((err) => {
        console.error("Firestore appConfig sync failed: ", err);
        setIsDbSyncing(false);
      });
    }
  }, [appConfig]);

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

  // Load from Firestore Database on mount (operando fora do browser)
  useEffect(() => {
    let active = true;
    const fetchDB = async () => {
      setIsDbSyncing(true);
      try {
        const dbState = await loadStateFromFirestore();
        if (dbState && active) {
          console.log("Dados carregados da Base de Dados Cloud com Sucesso!");
          if (dbState.members) setMembers(dbState.members);
          if (dbState.logs) setLogs(dbState.logs);
          if (dbState.payoutsCompleted) {
            const parsedPayouts: { [month: number]: boolean } = {};
            Object.entries(dbState.payoutsCompleted).forEach(([k, v]) => {
              parsedPayouts[Number(k)] = v;
            });
            setPayoutsCompleted(parsedPayouts);
          }
          if (dbState.currentMonth) setCurrentMonth(dbState.currentMonth);
          if (dbState.appConfig) setAppConfig(dbState.appConfig);

          // Local redundancy caching
          localStorage.setItem('kix_members', JSON.stringify(dbState.members));
          localStorage.setItem('kix_logs', JSON.stringify(dbState.logs));
          localStorage.setItem('kix_payouts', JSON.stringify(dbState.payoutsCompleted));
          localStorage.setItem('kix_current_month', String(dbState.currentMonth));
          localStorage.setItem('kix_app_config', JSON.stringify(dbState.appConfig));
        } else if (active) {
          console.log("Base de dados vazia. Sincronizando com cache...");
          const defaultPayouts = {
            1: false,
            2: false,
            3: false,
            4: false,
            5: false,
            6: false,
          };
          const savedMembers = localStorage.getItem('kix_members');
          const savedLogs = localStorage.getItem('kix_logs');
          const savedPayouts = localStorage.getItem('kix_payouts');
          const savedCurrentMonth = localStorage.getItem('kix_current_month');

          const finalMembers = savedMembers ? JSON.parse(savedMembers) : INITIAL_MEMBERS;
          const finalLogs = savedLogs ? JSON.parse(savedLogs) : INITIAL_LOGS;
          const finalPayouts = savedPayouts ? JSON.parse(savedPayouts) : defaultPayouts;
          const finalMonth = savedCurrentMonth ? Number(savedCurrentMonth) : 1;

          await saveStateToFirestore({
            members: finalMembers,
            logs: finalLogs,
            payoutsCompleted: finalPayouts,
            currentMonth: finalMonth,
            appConfig: appConfig
          });
          
          setMembers(finalMembers);
          setLogs(finalLogs);
          setPayoutsCompleted(finalPayouts);
          setCurrentMonth(finalMonth);
        }
      } catch (err) {
        console.warn("Leitura em segundo plano da Cloud falhou (operando offline):", err);
        // Fallback is already initialized synchronously in useState so user has 0 interruption!
      } finally {
        if (active) {
          setIsLoadingDb(false);
          setIsDbSyncing(false);
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
        }
      }
    };

    fetchDB();
    return () => { active = false; };
  }, []);

  // Sync to local storage and Cloud database on changes
  const saveState = (newMembers: Member[], newLogs: KixLog[], newPayouts = payoutsCompleted, newMonth = currentMonth) => {
    localStorage.setItem('kix_members', JSON.stringify(newMembers));
    localStorage.setItem('kix_logs', JSON.stringify(newLogs));
    localStorage.setItem('kix_payouts', JSON.stringify(newPayouts));
    localStorage.setItem('kix_current_month', String(newMonth));

    // Save to Firestore Cloud database to run app outside of standard isolated browser
    setIsDbSyncing(true);
    saveStateToFirestore({
      members: newMembers,
      logs: newLogs,
      payoutsCompleted: newPayouts,
      currentMonth: newMonth,
      appConfig: appConfig
    }).then(() => {
      setIsDbSyncing(false);
    }).catch((err) => {
      console.error("Firestore database write sync failed:", err);
      setIsDbSyncing(false);
    });

    // Backup offline local automático redundante
    try {
      const redundantPayload = {
        version: 3,
        timestamp: new Date().toISOString(),
        members: newMembers,
        logs: newLogs,
        payoutsCompleted: newPayouts,
        currentMonth: newMonth,
        appConfig,
        carouselSlides
      };
      localStorage.setItem('kix_redundant_autobackup', JSON.stringify(redundantPayload));
    } catch (e) {
      console.error("Incapaz de guardar backup redundante local:", e);
    }

    // Auto-backup para Google Drive se o token e configuração estiverem ativos
    triggerAutoBackupGDrive(newMembers, newLogs, newPayouts, newMonth);
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

  // Toggle contribution status of a member for the current active month
  const handleToggleContribution = (memberId: number) => {
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

  // Core Math Calculations
  // Total overall contributions made
  const totalPaidContributionsCount = members.reduce((acc, m) => {
    const paidInMember = Object.keys(m.contributions).filter(
      (monthKey) => m.contributions[Number(monthKey)]?.paid
    ).length;
    return acc + paidInMember;
  }, 0);

  // Fundo de Interajuda logic:
  // Each paid contribution deposits 20,000.00 automatically
  const totalSocialRetained = totalPaidContributionsCount * 20000;
  // Total Social support disbursed
  const totalSocialDisbursed = logs
    .filter((log) => log.type === 'social_aid')
    .reduce((acc, log) => acc + log.amount, 0);

  const socialBalance = totalSocialRetained - totalSocialDisbursed;

  // Current month collectors
  const currentMonthPaidCount = members.filter((m) => m.contributions[currentMonth]?.paid).length;
  const currentMonthCollected = currentMonthPaidCount * 120000;
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

    // Set state
    setMembers(backup.members);
    setLogs(backup.logs);
    if (backup.payoutsCompleted) {
      setPayoutsCompleted(backup.payoutsCompleted);
    }
    if (backup.currentMonth) {
      setCurrentMonth(backup.currentMonth);
    }
    if (backup.appConfig) {
      setAppConfig({ ...appConfig, ...backup.appConfig });
      localStorage.setItem('kix_app_config', JSON.stringify({ ...appConfig, ...backup.appConfig }));
    }
    if (backup.carouselSlides) {
      setCarouselSlides(backup.carouselSlides);
      localStorage.setItem('kix_carousel_slides', JSON.stringify(backup.carouselSlides));
    }

    // Persist to local storage
    localStorage.setItem('kix_members', JSON.stringify(backup.members));
    localStorage.setItem('kix_logs', JSON.stringify(backup.logs));
    if (backup.payoutsCompleted) {
      localStorage.setItem('kix_payouts', JSON.stringify(backup.payoutsCompleted));
    }
    if (backup.currentMonth) {
      localStorage.setItem('kix_current_month', String(backup.currentMonth));
    }

    // Log this action
    const newLog: KixLog = {
      id: `restore-${Date.now()}`,
      timestamp: new Date().toISOString(),
      type: 'policy_change',
      amount: 0,
      description: `RESTAURAÇÃO DO SISTEMA: O sistema e os dados históricos foram totalmente restaurados a partir de um backup restaurável de ${new Date(backup.timestamp || Date.now()).toLocaleString('pt-PT')}.`,
      month: backup.currentMonth || currentMonth,
    };

    const updatedLogs = [newLog, ...backup.logs];
    setLogs(updatedLogs);
    localStorage.setItem('kix_logs', JSON.stringify(updatedLogs));
    
    // Update redundant cache
    try {
      localStorage.setItem('kix_redundant_autobackup', JSON.stringify({
        ...backup,
        logs: updatedLogs,
        timestamp: new Date().toISOString()
      }));
    } catch(e) {}

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
                    onClick={() => setActiveTab(item.id)}
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

            {/* Mobile Navigation Dropdown Box (flex on mobile, hidden on desktop) */}
            <div className="flex md:hidden flex-1 justify-center max-w-[200px] relative" id="kix-mobile-nav-container">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="flex items-center justify-between w-full bg-white/10 hover:bg-white/15 text-white active:scale-95 transition-all duration-200 rounded-xl px-2.5 py-1.5 text-[11px] font-bold border border-white/10 cursor-pointer shadow-inner gap-1"
                id="kix-mobile-toggle-btn"
              >
                <div className="flex items-center gap-1.5 overflow-hidden truncate">
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

              {/* Mobile searchable menu panel */}
              {isMenuOpen && (
                <div 
                  className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 w-56 rounded-2xl p-3 shadow-2xl border backdrop-blur-md z-50 flex flex-col gap-2 bg-white dark:bg-slate-900 border-slate-250 dark:border-slate-800 text-slate-800 dark:text-slate-100"
                  id="kix-mobile-nav-dropdown"
                >
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Pesquisar menu..."
                      value={menuSearchQuery}
                      onChange={(e) => setMenuSearchQuery(e.target.value)}
                      className="w-full pl-8 pr-7 py-1 text-xs rounded-xl border border-slate-250 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 focus:outline-none focus:ring-1.5 focus:ring-sky-500 text-slate-950 dark:text-slate-50 placeholder:text-slate-400 font-sans"
                      id="kix-menu-search-input"
                      autoFocus
                    />
                    {menuSearchQuery && (
                      <button
                        onClick={() => setMenuSearchQuery('')}
                        className="absolute right-2 top-1.5 text-slate-400 hover:text-slate-600 cursor-pointer"
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
                              setActiveTab(item.id);
                              setIsMenuOpen(false);
                              setMenuSearchQuery('');
                            }}
                            className={`w-full text-left px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all duration-200 cursor-pointer ${
                              isActive
                                ? 'bg-sky-500/10 text-sky-700 dark:text-sky-450 border border-sky-500/10'
                                : 'hover:bg-slate-55 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'
                            }`}
                            id={`kix-mobile-nav-item-${item.id}`}
                          >
                            <span className={`${isActive ? 'text-sky-600 dark:text-sky-400' : 'text-slate-450 dark:text-slate-550'}`}>{item.icon}</span>
                            <span>{item.id === 'membro-dashboard' ? 'Minha Área' : item.label}</span>
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Right side status instruments - extremely compact */}
            <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">

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

              {/* Moon / Sun minimal theme selector */}
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
        <main className="flex-1 p-6 pb-36 space-y-8 overflow-y-auto">
          
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
                  <div className={`p-4 rounded-2xl border flex items-start gap-4 relative overflow-hidden transition-all shadow-sm ${
                    theme === 'dark' 
                      ? 'bg-slate-900/60 border-slate-800 text-slate-200' 
                      : 'bg-white border-slate-200 text-slate-800'
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
                  totalMembersCount={12}
                  beneficiaries={getBeneficiariesList()}
                  isPayoutDone={isCurrentMonthPayoutDone}
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
                    className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 p-10 md:p-12 shadow-lg flex flex-col justify-between space-y-8 relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:border-sky-350 dark:hover:border-sky-850"
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
                    className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 p-10 md:p-12 shadow-lg flex flex-col justify-between space-y-8 relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:border-purple-350 dark:hover:border-purple-850"
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
                    className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 p-10 md:p-12 shadow-lg flex flex-col justify-between space-y-8 relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:border-amber-300 dark:hover:border-amber-850"
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
                    className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 p-10 md:p-12 shadow-lg flex flex-col justify-between space-y-8 relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:border-emerald-350 dark:hover:border-emerald-850"
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
                />
              </motion.div>
            )}

            {activeTab === 'reports' && (
              <motion.div
                key="reports"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
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

      <RegulationsModal isOpen={showRegulations} onClose={() => setShowRegulations(false)} />
    </div>
  );
}

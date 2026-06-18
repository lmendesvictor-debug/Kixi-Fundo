import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Users, 
  Receipt, 
  Landmark, 
  ShieldAlert, 
  Sparkles, 
  Plus, 
  Edit, 
  Trash2, 
  ShieldCheck, 
  Search, 
  Calendar, 
  Filter, 
  RotateCcw,
  Cloud,
  CloudUpload,
  CloudDownload,
  Database,
  RefreshCw,
  AlertCircle,
  FileJson,
  LogIn,
  LogOut,
  CheckCircle,
} from 'lucide-react';
import UserManagement from './UserManagement';
import ReceiptsAutomation from './ReceiptsAutomation';
import BankingReport from './BankingReport';
import PrivilegesManagement from './PrivilegesManagement';

interface AdminModuleProps {
  currentMonth: number;
  members: any[];
  setMembers: React.Dispatch<React.SetStateAction<any[]>>;
  logs: any[];
  setLogs: React.Dispatch<React.SetStateAction<any[]>>;
  saveState: (m: any[], l: any[]) => void;
  currentUser: any;
  payoutsCompleted: Record<string, boolean>;
  formatCurrency: (amount: number) => string;
  handleToggleContribution: (memberId: number) => void;
  theme: 'light' | 'dark';
  appConfig: any;
  setAppConfig: React.Dispatch<React.SetStateAction<any>>;
  carouselSlides?: any[];
  setCarouselSlides?: React.Dispatch<React.SetStateAction<any[]>>;
  onRestoreBackup: (backup: any) => boolean;
}

export default function AdminModule({
  currentMonth,
  members,
  setMembers,
  logs,
  setLogs,
  saveState,
  currentUser,
  payoutsCompleted,
  formatCurrency,
  handleToggleContribution,
  theme,
  appConfig,
  setAppConfig,
  carouselSlides,
  setCarouselSlides,
  onRestoreBackup,
}: AdminModuleProps) {
  const [activeSubTab, setActiveSubTab] = useState<'users' | 'receipts' | 'banking' | 'carousel' | 'audit' | 'backup' | 'privileges'>('users');

  const loggedInMember = currentUser 
    ? members.find(m => m.id === currentUser.memberId || m.email?.trim().toLowerCase() === currentUser.email?.trim().toLowerCase())
    : null;
  const isSuperAdmin = currentUser?.email?.trim().toLowerCase() === 'lmendesvictor@gmail.com';
  const canManageSlides = isSuperAdmin || loggedInMember?.permissions?.actionManageSlides !== false;
  const canManageBackups = isSuperAdmin || loggedInMember?.permissions?.actionManageBackups !== false;

  const [showCarouselForm, setShowCarouselForm] = useState(false);
  const [editingSlideId, setEditingSlideId] = useState<string | null>(null);
  const [slideFormTitle, setSlideFormTitle] = useState('');
  const [slideFormDesc, setSlideFormDesc] = useState('');
  const [slideFormImg, setSlideFormImg] = useState('');
  const [slideFormTag, setSlideFormTag] = useState('DESTAQUE');

  // Filters for Audit Log Tab
  const [auditSearch, setAuditSearch] = useState('');
  const [auditTypeFilter, setAuditTypeFilter] = useState<string>('all');
  const [auditStartDate, setAuditStartDate] = useState('');
  const [auditEndDate, setAuditEndDate] = useState('');

  // Estados críticos de Google Drive Backup e Recuperação offline
  const [googleUser, setGoogleUser] = useState<any>(null);
  const [googleToken, setGoogleToken] = useState<string | null>(sessionStorage.getItem('gdrive_access_token'));
  const [isAuthInitializing, setIsAuthInitializing] = useState(true);
  const [isGDriveLoading, setIsGDriveLoading] = useState(false);
  const [driveBackups, setDriveBackups] = useState<any[]>([]);
  const [backupActionLoading, setBackupActionLoading] = useState<string | null>(null);

  React.useEffect(() => {
    let unsubscribe: (() => void) | null = null;
    let isMounted = true;

    import('../driveBackup').then((mod) => {
      if (!isMounted) return;
      unsubscribe = mod.initAuth(
        (user, token) => {
          setGoogleUser(user);
          setGoogleToken(token);
          setIsAuthInitializing(false);
          fetchGoogleBackups(token);
        },
        () => {
          setGoogleUser(null);
          setGoogleToken(null);
          setIsAuthInitializing(false);
        }
      );
    }).catch(err => {
      console.error("Failed to load driveBackup dynamically:", err);
      if (isMounted) {
        setIsAuthInitializing(false);
      }
    });

    return () => {
      isMounted = false;
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const fetchGoogleBackups = async (token: string) => {
    setIsGDriveLoading(true);
    try {
      const mod = await import('../driveBackup');
      const list = await mod.listBackups(token);
      setDriveBackups(list);
    } catch (e) {
      console.error("Erro ao procurar backups", e);
    } finally {
      setIsGDriveLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      const mod = await import('../driveBackup');
      const res = await mod.googleSignIn();
      if (res) {
        setGoogleUser(res.user);
        setGoogleToken(res.accessToken);
        fetchGoogleBackups(res.accessToken);
      }
    } catch (err: any) {
      alert(`Falha ao conectar com Conta Google: ${err.message || err}`);
    }
  };

  const handleGoogleLogOut = async () => {
    try {
      const mod = await import('../driveBackup');
      await mod.logoutGDrive();
    } catch (error) {
      console.error("GDrive Logout error:", error);
    }
    setGoogleUser(null);
    setGoogleToken(null);
    setDriveBackups([]);
  };

  const handleCreateGDriveBackup = async () => {
    if (!canManageBackups) {
      alert('Acesso Negado: Não possui privilégios de gestor para criar cópias de segurança.');
      return;
    }
    if (!googleToken) return;
    setBackupActionLoading('create');
    try {
      const payload = {
        version: 3,
        timestamp: new Date().toISOString(),
        members,
        logs,
        payoutsCompleted,
        currentMonth,
        appConfig,
        carouselSlides,
      };
      const mod = await import('../driveBackup');
      await mod.uploadBackup(googleToken, payload);
      alert('Cópia de segurança criada e gravada com sucesso no seu Google Drive!');
      await fetchGoogleBackups(googleToken);
    } catch (err: any) {
      alert(`Erro ao criar backup: ${err.message || err}`);
    } finally {
      setBackupActionLoading(null);
    }
  };

  const handleRestoreGDriveBackup = async (fileId: string, fileName: string) => {
    if (!canManageBackups) {
      alert('Acesso Negado: Não possui privilégios de gestor para restaurar cópias de segurança.');
      return;
    }
    if (!googleToken) return;
    if (window.confirm(`Tem a certeza ABSOLUTA que deseja restaurar a cópia de segurança "${fileName}"? \n\nAtenção: Esta acção irá substituir e reescrever todos os dados do dispositivo actuel.`)) {
      setBackupActionLoading(`restore_${fileId}`);
      try {
        const mod = await import('../driveBackup');
        const backupData = await mod.downloadBackupContent(googleToken, fileId);
        const ok = onRestoreBackup(backupData);
        if (ok) {
          alert('Dados do Kix-Fundo restaurados com sucesso absoluto!');
        }
      } catch (err: any) {
        alert(`Erro ao restaurar backup: ${err.message || err}`);
      } finally {
        setBackupActionLoading(null);
      }
    }
  };

  const handleDeleteGDriveBackup = async (fileId: string, fileName: string) => {
    if (!canManageBackups) {
      alert('Acesso Negado: Não possui privilégios de gestor para eliminar backups do seu Google Drive.');
      return;
    }
    if (!googleToken) return;
    if (window.confirm(`Tem a certeza que deseja eliminar PERMANENTEMENTE o backup "${fileName}" do seu Google Drive?`)) {
      setBackupActionLoading(`delete_${fileId}`);
      try {
        const mod = await import('../driveBackup');
        await mod.deleteBackupFile(googleToken, fileId);
        alert('Cópia eliminada com sucesso do Google Drive.');
        await fetchGoogleBackups(googleToken);
      } catch (err: any) {
        alert(`Erro ao apagar backup: ${err.message || err}`);
      } finally {
        setBackupActionLoading(null);
      }
    }
  };

  const handleJSONFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!canManageBackups) {
      alert('Acesso Negado: Não possui privilégios de gestor para importar ficheiros de segurança.');
      e.target.value = '';
      return;
    }
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (window.confirm('Tem a certeza que deseja restaurar as finanças com base no ficheiro JSON selecionado?')) {
          const ok = onRestoreBackup(parsed);
          if (ok) {
            alert('Finanças restauradas com sucesso a partir do ficheiro selecionado!');
          }
        }
      } catch (err) {
        alert('Ficheiro inválido ou dados corrompidos.');
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset input selection
  };

  const handleRestoreRedundantBackupLocal = () => {
    if (!canManageBackups) {
      alert('Acesso Negado: Não possui privilégios de gestor para restaurar backups a partir do cofre redundante local.');
      return;
    }
    const redundant = localStorage.getItem('kix_redundant_autobackup');
    if (!redundant) {
      alert("Nenhum backup automático offline enquadrado em cache!");
      return;
    }
    try {
      const parsed = JSON.parse(redundant);
      if (window.confirm(`Deseja restaurar a cópia de redundância automática local (Salva em: ${new Date(parsed.timestamp).toLocaleString('pt-PT')})?`)) {
        const ok = onRestoreBackup(parsed);
        if (ok) {
          alert('Cópia redundante offline restaurada com sucesso!');
        }
      }
    } catch (e) {
      alert("Ficheiro corrompido.");
    }
  };

  const handleExportDataDirectly = () => {
    const payload = { 
      members, 
      logs, 
      payoutsCompleted, 
      currentMonth, 
      appConfig, 
      carouselSlides, 
      timestamp: new Date().toISOString() 
    };
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(payload, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `kix_fundo_backup_completo_${new Date().toLocaleDateString('pt-AO')}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const subTabs = [
    {
      id: 'users' as const,
      label: 'Tabela Utilizadores & Membros',
      icon: <Users className="w-4 h-4 shrink-0 transition-colors" />,
      description: 'Gestão de contas, atribuições, IBANs privados e acessos ao portal.',
    },
    {
      id: 'privileges' as const,
      label: 'Outorga de Privilégios (Gestores)',
      icon: <ShieldAlert className="w-4 h-4 text-rose-500 shrink-0 transition-colors" />,
      description: 'Configure acessos de telas e acções críticas permitidas ao grupo de gestores.',
    },
    {
      id: 'receipts' as const,
      label: 'Automação de Recibos (Kix-Drive)',
      icon: <Receipt className="w-4 h-4 shrink-0 transition-colors" />,
      description: 'Upload de comprovativos PDF/imagem, leitura OCR e validação de cotas.',
    },
    {
      id: 'banking' as const,
      label: 'Relatórios Bancários & Auditoria',
      icon: <Landmark className="w-4 h-4 shrink-0 transition-colors" />,
      description: 'Conciliação matemática do caixa, extratos consolidados e balancetes.',
    },
    {
      id: 'carousel' as const,
      label: 'Comunicação & Slides',
      icon: <Sparkles className="w-4 h-4 shrink-0 transition-colors" />,
      description: 'Gerir as mensagens e imagens rotativas difundidas no topo do portal do fundo.',
    },
    {
      id: 'backup' as const,
      label: 'Backup Coletor Google Drive',
      icon: <Cloud className="w-4 h-4 shrink-0 text-emerald-500 transition-colors" />,
      description: 'Guarda os dados de membros em segurança no Google Drive e redundâncias.',
    },
    {
      id: 'audit' as const,
      label: 'Histórico de Auditoria Global',
      icon: <ShieldCheck className="w-4 h-4 shrink-0 text-amber-500 transition-colors" />,
      description: 'Visualização cronológica de diretivas críticas, acessos, políticas e palavras-passe.',
    },
  ];

  return (
    <div className={`p-1 space-y-6 ${theme === 'dark' ? 'text-white' : 'text-slate-900 font-medium'}`}>
      
      {/* Header of administration module */}
      <div className={`p-6 rounded-2xl border ${
        theme === 'dark' 
          ? 'bg-slate-900/80 border-slate-800' 
          : 'bg-white border-slate-200'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black font-display tracking-tight flex items-center gap-2">
              ⚙️ MÓDULO DE ADMINISTRAÇÃO COLETIVA
            </h1>
            <p className={`text-xs mt-1 max-w-2xl ${
              theme === 'dark' ? 'text-slate-300' : 'text-slate-800 font-bold'
            }`}>
              Painel centralizado de governança. Monitorize utilizadores registados, valide comprovativos 
              carregados por cooperantes, administre banners e audite os relatórios bancários automáticos com integridade matemática.
            </p>
          </div>
          <div className="flex items-center gap-2 bg-red-600/10 border border-red-500/20 px-3.5 py-2 rounded-xl">
            <ShieldAlert className="w-4 h-4 text-red-600 shrink-0" />
            <span className="text-[10px] font-black uppercase text-red-600 tracking-wider">
              ACESSO RESTRITO (ADMINISTRADOR)
            </span>
          </div>
        </div>

        {/* High-contrast sub-tab toggles */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-2 mt-6">
          {subTabs.map((tab) => {
            const isActive = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id)}
                className={`text-left p-3.5 rounded-xl border-2 transition-all flex flex-col gap-1.5 cursor-pointer ${
                  isActive
                    ? theme === 'dark'
                      ? 'bg-sky-950/40 border-sky-500 text-sky-200 shadow-lg ring-1 ring-sky-500/25'
                      : 'bg-sky-50 border-sky-500 text-sky-950 shadow-md ring-1 ring-sky-200/50'
                    : theme === 'dark'
                      ? 'bg-slate-950 border-slate-900 text-slate-400 hover:text-white hover:border-slate-805'
                      : 'bg-slate-50 border-slate-200 text-slate-800 hover:bg-slate-100 hover:border-slate-300 font-bold'
                }`}
              >
                <div className="flex items-center gap-2 font-bold font-display text-xs">
                  <div className={isActive ? (theme === 'dark' ? 'text-sky-400' : 'text-sky-600') : ''}>
                    {tab.icon}
                  </div>
                  <span className="tracking-tight">{tab.label}</span>
                </div>
                <p className={`text-[9px] leading-relaxed select-none ${
                  isActive 
                    ? theme === 'dark' ? 'text-sky-300/90' : 'text-sky-800/90 font-medium' 
                    : theme === 'dark' ? 'text-slate-500' : 'text-slate-650'
                }`}>
                  {tab.description}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected sub-tab Workspace area with animation */}
      <div className="mt-4">
        {activeSubTab === 'users' && (
          <motion.div
            key="admin_users"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <UserManagement
              members={members}
              setMembers={setMembers}
              saveState={saveState}
              logs={logs}
              setLogs={setLogs}
              currentUserEmail={currentUser?.email || ''}
              theme={theme}
              appConfig={appConfig}
              setAppConfig={setAppConfig}
            />
          </motion.div>
        )}

        {activeSubTab === 'privileges' && (
          <motion.div
            key="admin_privileges"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <PrivilegesManagement
              members={members}
              setMembers={setMembers}
              saveState={saveState}
              logs={logs}
              setLogs={setLogs}
              currentUserEmail={currentUser?.email || ''}
              theme={theme}
            />
          </motion.div>
        )}

        {activeSubTab === 'receipts' && (
          <motion.div
            key="admin_receipts"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <ReceiptsAutomation
              currentMonth={currentMonth}
              members={members}
              onToggleContribution={handleToggleContribution}
              logs={logs}
              setMembers={setMembers}
              setLogs={setLogs}
              saveState={saveState}
              currentUser={currentUser}
            />
          </motion.div>
        )}

        {activeSubTab === 'banking' && (
          <motion.div
            key="admin_banking"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <BankingReport
              currentMonth={currentMonth}
              members={members}
              logs={logs}
              payoutsCompleted={payoutsCompleted}
              formatCurrency={formatCurrency}
            />
          </motion.div>
        )}

        {activeSubTab === 'carousel' && carouselSlides && setCarouselSlides && (
          <motion.div
            key="admin_carousel"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className={`p-6 rounded-2xl border ${
              theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
            } space-y-6 shadow-sm`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800/60 pb-4">
              <div>
                <h3 className="text-base font-bold font-display flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-500" />
                  Gestão de Comunicações & Destaques de Slides
                </h3>
                <p className="text-xs text-slate-500">
                  Defina fotos emblemáticas das ações do fundo e as principais mensagens exibidas e rotacionadas no carrossel superior do Kixi-Fundo.
                </p>
              </div>
              <div>
                {!showCarouselForm && (
                  <button
                    onClick={() => {
                      if (!canManageSlides) {
                        alert('Acesso Negado: Não possui privilégios de gestor para gerir ou criar slides e destaques de comunicação.');
                        return;
                      }
                      setSlideFormTitle('');
                      setSlideFormDesc('');
                      setSlideFormImg('https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=1200&h=600&q=80');
                      setSlideFormTag('DESTAQUE');
                      setEditingSlideId(null);
                      setShowCarouselForm(true);
                    }}
                    className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-sm"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Novo Destaque</span>
                  </button>
                )}
              </div>
            </div>

            {/* Inline slide editor form */}
            {showCarouselForm && (
              <div className="bg-slate-50 dark:bg-slate-950 p-5 rounded-2xl border border-slate-150 dark:border-slate-800 space-y-4">
                <h4 className="text-xs font-black uppercase tracking-wider text-sky-600">
                  {editingSlideId ? '✏️ Editar Destaque Ativo' : '➕ Adicionar Novo Destaque'}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase">Mensagem Principal (Título do Destaque)</label>
                    <input
                      type="text"
                      value={slideFormTitle}
                      onChange={(e) => setSlideFormTitle(e.target.value)}
                      placeholder="Ex: Novo Ciclo de Angariações"
                      className="w-full text-xs p-3 rounded-lg border border-slate-250 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-[#0284c7] text-slate-800 dark:text-slate-100"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase">Categoria / Tag Curta</label>
                    <input
                      type="text"
                      value={slideFormTag}
                      onChange={(e) => setSlideFormTag(e.target.value)}
                      placeholder="Ex: SOLIDARIEDADE, GOVERNANÇA, DESTAQUE"
                      className="w-full text-xs p-3 rounded-lg border border-slate-250 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-[#0284c7] text-slate-800 dark:text-slate-100"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase">Mensagem Detalhada (Descrição)</label>
                  <textarea
                    value={slideFormDesc}
                    onChange={(e) => setSlideFormDesc(e.target.value)}
                    placeholder="Descreva a ação do fundo e os detalhes transparentes do impacto social..."
                    rows={2}
                    className="w-full text-xs p-3 rounded-lg border border-slate-250 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-[#0284c7] resize-none text-slate-800 dark:text-slate-100"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase block">Origem da Imagem (Link URL ou use um modelo abaixo)</label>
                  <input
                    type="text"
                    value={slideFormImg}
                    onChange={(e) => setSlideFormImg(e.target.value)}
                    placeholder="Ex: https://images.unsplash.com/photo-..."
                    className="w-full text-xs p-3 rounded-lg border border-slate-250 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-[#0284c7] text-slate-800 dark:text-slate-100"
                  />
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[9px] text-slate-400 font-bold uppercase mr-1">Escolher Imagem rápida:</span>
                    <button
                      type="button"
                      onClick={() => setSlideFormImg('https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=1200&h=600&q=80')}
                      className="text-[9px] font-semibold px-2 py-1 bg-amber-55 text-amber-900 border border-amber-300 rounded hover:bg-amber-100 transition-all cursor-pointer dark:bg-amber-950/20 dark:text-amber-300"
                    >
                      🌱 Ambiente & Coletivo
                    </button>
                    <button
                      type="button"
                      onClick={() => setSlideFormImg('https://images.unsplash.com/photo-1591365555554-1df720c7ccce?auto=format&fit=crop&w=1200&h=600&q=80')}
                      className="text-[9px] font-semibold px-2 py-1 bg-sky-55 text-sky-900 border border-sky-300 rounded hover:bg-sky-100 transition-all cursor-pointer dark:bg-sky-950/20 dark:text-sky-300"
                    >
                      💵 Sucesso & Finanças
                    </button>
                    <button
                      type="button"
                      onClick={() => setSlideFormImg('https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1200&h=600&q=80')}
                      className="text-[9px] font-semibold px-2 py-1 bg-emerald-55 text-emerald-900 border border-emerald-300 rounded hover:bg-emerald-100 transition-all cursor-pointer dark:bg-emerald-950/20 dark:text-emerald-300"
                    >
                      📊 Auditoria & Tabelas
                    </button>
                    <button
                      type="button"
                      onClick={() => setSlideFormImg('https://images.unsplash.com/photo-1559136555-9303baea8ebd?auto=format&fit=crop&w=1200&h=600&q=80')}
                      className="text-[9px] font-semibold px-2 py-1 bg-purple-55 text-purple-900 border border-purple-300 rounded hover:bg-purple-100 transition-all cursor-pointer dark:bg-purple-950/20 dark:text-purple-300"
                    >
                      🤝 Reunião Cooperadora
                    </button>
                    <button
                      type="button"
                      onClick={() => setSlideFormImg('https://images.unsplash.com/photo-1544377193-33dcf4d68fb5?auto=format&fit=crop&w=1200&h=600&q=80')}
                      className="text-[9px] font-semibold px-2 py-1 bg-teal-55 text-teal-900 border border-teal-300 rounded hover:bg-teal-100 transition-all cursor-pointer dark:bg-teal-950/20 dark:text-teal-300"
                    >
                      📈 Trajectória de Crescimento
                    </button>
                    <button
                      type="button"
                      onClick={() => setSlideFormImg('https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=1200&h=600&q=80')}
                      className="text-[9px] font-semibold px-2 py-1 bg-rose-55 text-rose-900 border border-rose-300 rounded hover:bg-rose-100 transition-all cursor-pointer dark:bg-rose-950/20 dark:text-rose-300"
                    >
                      💰 Balanços e Moedas
                    </button>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCarouselForm(false);
                      setEditingSlideId(null);
                    }}
                    className="px-3 py-1.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (!slideFormTitle.trim() || !slideFormDesc.trim()) {
                        alert('Por favor, defina a mensagem principal (título) e difusão (descrição).');
                        return;
                      }
                      if (editingSlideId) {
                        setCarouselSlides((prev) =>
                          prev.map((s) =>
                            s.id === editingSlideId
                              ? { ...s, title: slideFormTitle.trim(), description: slideFormDesc.trim(), image: slideFormImg, tag: slideFormTag.trim() }
                              : s
                          )
                        );
                        setEditingSlideId(null);
                      } else {
                        const newSlide = {
                          id: `slide-${Date.now()}`,
                          title: slideFormTitle.trim(),
                          description: slideFormDesc.trim(),
                          image: slideFormImg,
                          tag: slideFormTag.trim()
                        };
                        setCarouselSlides((prev) => [...prev, newSlide]);
                      }
                      setShowCarouselForm(false);
                    }}
                    className="px-4 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-black transition-all cursor-pointer shadow-sm"
                  >
                    Guardar Destaque
                  </button>
                </div>
              </div>
            )}

            {/* List of current slides with MUCH larger images as top cover headers */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {carouselSlides.map((slide) => (
                <div
                  key={slide.id}
                  className="border border-slate-150 dark:border-slate-800 rounded-2xl flex flex-col justify-between bg-slate-50 dark:bg-slate-900/35 relative overflow-hidden shadow-xs hover:shadow-md transition-all group"
                >
                  {/* Aspect-video spacious preview image */}
                  <div className="relative h-44 w-full overflow-hidden bg-slate-100 dark:bg-slate-950 border-b border-slate-150 dark:border-slate-800">
                    <img
                      src={slide.image}
                      alt={slide.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute top-3 left-3">
                      <span className="text-[9px] font-black text-slate-900 bg-amber-400 px-2.5 py-1 rounded-md uppercase tracking-wider shadow-sm">
                        {slide.tag || 'DESTAQUE'}
                      </span>
                    </div>
                  </div>

                  <div className="p-4 space-y-2 flex-grow">
                    <h5 className="text-sm font-extrabold text-slate-900 dark:text-white leading-snug">
                      {slide.title}
                    </h5>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                      {slide.description}
                    </p>
                  </div>

                  <div className="p-4 pt-2 border-t border-slate-150 dark:border-slate-800 flex items-center justify-between bg-slate-100/50 dark:bg-slate-950/20">
                    <span className="text-[9px] font-black text-sky-600 dark:text-sky-450">Ativo no Carrossel</span>
                    <div className="flex gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          if (!canManageSlides) {
                            alert('Acesso Negado: Não possui privilégios de gestor para gerir ou editar slides e destaques de comunicação.');
                            return;
                          }
                          setEditingSlideId(slide.id);
                          setSlideFormTitle(slide.title);
                          setSlideFormDesc(slide.description);
                          setSlideFormImg(slide.image);
                          setSlideFormTag(slide.tag || 'DESTAQUE');
                          setShowCarouselForm(true);
                        }}
                        className="p-1.5 text-sky-600 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-slate-800 rounded-lg cursor-pointer transition-colors"
                        title="Editar"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (!canManageSlides) {
                            alert('Acesso Negado: Não possui privilégios de gestor para remover slides e destaques de comunicação.');
                            return;
                          }
                          if (carouselSlides.length <= 1) {
                            alert('É necessário manter pelo menos um slide activo no carrossel.');
                            return;
                          }
                          if (window.confirm('Tem certeza que deseja eliminar este destaque do carrossel?')) {
                            setCarouselSlides((prev) => prev.filter((s) => s.id !== slide.id));
                          }
                        }}
                        className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg cursor-pointer transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {activeSubTab === 'backup' && (
          <motion.div
            key="admin_backup"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className={`p-6 rounded-2xl border ${
              theme === 'dark'
                ? 'bg-slate-900/80 border-slate-800 text-white'
                : 'bg-white border-slate-200 text-slate-950 font-medium'
            }`}
          >
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h2 className="text-xl font-black font-display tracking-tight flex items-center gap-2">
                  💾 CÓPIAS DE SEGURANÇA E INTEGRIDADE ADMINISTRATIVAS
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Proteja e sincronize os ativos financeiros dos membros através do Google Drive e cópias de contingência automatizadas offline.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleExportDataDirectly}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl text-xs font-bold transition-all text-slate-800 dark:text-slate-100 cursor-pointer"
                >
                  <FileJson className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                  Descarregar JSON Manual
                </button>
              </div>
            </div>

            {/* Grid Container */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-6">
              
              {/* Left Column - Configurations and Local contingency */}
              <div className="lg:col-span-5 space-y-6">
                
                {/* Google Drive Connection Block */}
                <div className={`p-5 rounded-2xl border ${
                  theme === 'dark' ? 'bg-slate-950 border-slate-850' : 'bg-slate-50 border-slate-100'
                }`}>
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2 mb-4">
                    <Cloud className="w-4 h-4 text-emerald-500" />
                    Ligação ao Google Drive Coletor
                  </h3>

                  {isAuthInitializing ? (
                    <div className="flex items-center gap-3 py-4 text-xs text-slate-400">
                      <RefreshCw className="w-4 h-4 animate-spin text-emerald-500" />
                      <span>A verificar estado de credenciamento...</span>
                    </div>
                  ) : !googleToken ? (
                    <div className="space-y-4">
                      <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start gap-3">
                        <AlertCircle className="w-4.5 h-4.5 text-amber-500 shrink-0 mt-0.5" />
                        <div className="text-xs leading-relaxed text-slate-650 dark:text-slate-350">
                          <strong className="text-slate-800 dark:text-slate-100">Ligação Pendente:</strong> Ligue uma conta Google autorizada para ativar backups na nuvem.
                        </div>
                      </div>
                      <button
                        onClick={handleGoogleSignIn}
                        className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
                      >
                        <LogIn className="w-4 h-4 text-white" />
                        Autenticar com Google Drive
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-start gap-3">
                        <CheckCircle className="w-4.5 h-4.5 text-emerald-500 shrink-0 mt-0.5" />
                        <div>
                          <div className="text-xs font-bold text-slate-800 dark:text-slate-100">Ligação Estabelecida</div>
                          <div className="text-[10px] text-slate-500 mt-0.5 font-mono break-all">{googleUser?.email || "Conta conectada"}</div>
                        </div>
                      </div>

                      {/* Backup Now Action inside connected box */}
                      <button
                        disabled={backupActionLoading === 'create'}
                        onClick={handleCreateGDriveBackup}
                        className="w-full flex items-center justify-center gap-2.5 py-2.5 px-4 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm disabled:opacity-50 cursor-pointer"
                      >
                        {backupActionLoading === 'create' ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <CloudUpload className="w-4 h-4" />
                        )}
                        Criar Cópia de Segurança Agora
                      </button>

                      {/* Auto Backup Toggle Option */}
                      <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
                        <div>
                          <div className="text-xs font-bold text-slate-800 dark:text-slate-100">Backup Automático Periódico</div>
                          <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed max-w-[200px]">
                            Grava silenciosamente para o drive ao alterar contribuições ou membros.
                          </p>
                        </div>
                        <input
                          type="checkbox"
                          checked={appConfig.autoBackUpGDrive === true}
                          onChange={(e) => {
                            const active = e.target.checked;
                            const updatedConfig = { ...appConfig, autoBackUpGDrive: active };
                            setAppConfig(updatedConfig);
                            localStorage.setItem('kix_app_config', JSON.stringify(updatedConfig));
                          }}
                          className="w-4 h-4 rounded text-emerald-600 border-slate-350 bg-white cursor-pointer accent-emerald-500"
                        />
                      </div>

                      <button
                        onClick={handleGoogleLogOut}
                        className="w-full flex items-center justify-center gap-2 py-2 px-4 border border-red-500/20 hover:bg-red-500/10 text-red-500 rounded-xl text-xs font-bold transition-all mt-2 cursor-pointer"
                      >
                        <LogOut className="w-4 h-4" />
                        Desconectar Conta Google
                      </button>
                    </div>
                  )}
                </div>

                {/* Local emergency contingency block */}
                <div className={`p-5 rounded-2xl border ${
                  theme === 'dark' ? 'bg-slate-950 border-slate-850' : 'bg-slate-50 border-slate-100'
                }`}>
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2 mb-3">
                    <Database className="w-4 h-4 text-sky-500" />
                    Cofre de Emergência Redundante Local
                  </h3>
                  <div className="text-xs text-slate-650 dark:text-slate-350 leading-relaxed mb-4">
                    O sistema mantém uma cópia consolidada de todos os registros históricos num sector exclusivo do <code className="p-0.5 bg-slate-200 dark:bg-slate-800 font-mono text-[11px] rounded">localStorage</code> regional. Esta cópia é restaurável se as chaves individuais de tabela forem limpas acidentalmente.
                  </div>

                  <div className="flex gap-2.5">
                    <button
                      onClick={handleRestoreRedundantBackupLocal}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-100 transition-all shadow-sm cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      Restaurar Cofre Local
                    </button>
                  </div>
                </div>

                {/* JSON file drop/input import utility */}
                <div className={`p-5 rounded-2xl border ${
                  theme === 'dark' ? 'bg-slate-950 border-slate-850' : 'bg-slate-50 border-slate-100'
                }`}>
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2 mb-3">
                    <FileJson className="w-4 h-4 text-purple-500" />
                    Importação Manual por Ficheiro (.json)
                  </h3>
                  <div className="text-xs text-slate-650 dark:text-slate-350 leading-relaxed mb-4">
                    Selecione um ficheiro de backup descarregado anteriormente para reestabelecer o balanço financeiro e as tabelas e logs completos.
                  </div>

                  <label className="w-full flex flex-col items-center justify-center gap-2 p-5 border-2 border-dashed border-slate-300 dark:border-slate-800 rounded-xl hover:border-purple-500 group cursor-pointer transition-all">
                    <CloudUpload className="w-6 h-6 text-slate-400 group-hover:text-purple-500 transition-all" />
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Escolha um ficheiro de backup</span>
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleJSONFileImport}
                      className="hidden"
                    />
                  </label>
                </div>

              </div>

              {/* Right Column - Historial from Google Drive cloud */}
              <div className="lg:col-span-7 flex flex-col">
                <div className={`flex-1 p-5 rounded-2xl border ${
                  theme === 'dark' ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-100'
                }`}>
                  <div className="flex items-center justify-between gap-4 mb-4 pb-3 border-b border-slate-200 dark:border-slate-800">
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
                      <CloudDownload className="w-4 h-4 text-[#10B981]" />
                      Cópias de Segurança Ativas no Google Drive
                    </h3>
                    {googleToken && (
                      <button
                        onClick={() => fetchGoogleBackups(googleToken)}
                        disabled={isGDriveLoading}
                        className="p-1 px-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg text-xs font-bold flex items-center gap-1 text-slate-500 dark:text-slate-400 cursor-pointer"
                        title="Recarregar Lista"
                      >
                        <RefreshCw className={`w-3 h-3 ${isGDriveLoading ? 'animate-spin' : ''}`} />
                        Sincronizar
                      </button>
                    )}
                  </div>

                  {!googleToken ? (
                    <div className="h-full flex flex-col items-center justify-center py-16 text-center">
                      <Cloud className="w-12 h-12 text-slate-300 dark:text-slate-800 mb-3" />
                      <p className="text-xs font-bold text-slate-405 dark:text-slate-400">Google Drive Não Conectado</p>
                      <p className="text-[10px] text-slate-400 dark:text-slate-600 max-w-xs mt-1">
                        Autentique a sua conta no painel esquerdo para listar, descarregar ou reestabelecer cópias do cofre em tempo real do drive.
                      </p>
                    </div>
                  ) : isGDriveLoading && driveBackups.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center py-16 text-center">
                      <RefreshCw className="w-8 h-8 text-emerald-500 animate-spin mb-3" />
                      <p className="text-xs font-bold text-slate-500 dark:text-slate-400">A obter listagem do Google Drive...</p>
                    </div>
                  ) : driveBackups.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center py-16 text-center">
                      <Database className="w-10 h-10 text-slate-300 dark:text-slate-800 mb-3" />
                      <p className="text-xs font-bold text-slate-500 dark:text-slate-400">Nenhum backup detetado</p>
                      <p className="text-[10px] text-slate-400 dark:text-slate-600 max-w-xs mt-1">
                        Clique em "Criar Cópia de Segurança Agora" para arquivar sua primeira versão de segurança cloud.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[500px] overflow-y-auto">
                      {driveBackups.map((bk) => {
                        const dateFormatted = new Date(bk.createdTime).toLocaleString('pt-PT', {
                          year: 'numeric', month: 'short', day: 'numeric',
                          hour: '2-digit', minute: '2-digit'
                        });
                        const sizeKb = (parseInt(bk.size || '0') / 1024).toFixed(1);
                        const isActionActive = backupActionLoading?.includes(bk.id);

                        return (
                          <div
                            key={bk.id}
                            className="p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-xl flex items-center justify-between gap-3 hover:shadow-sm hover:border-slate-300 dark:hover:border-slate-750 transition-all"
                          >
                            <div className="min-w-0">
                              <div className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5 leading-none">
                                <span className="p-1 bg-emerald-500/10 text-emerald-500 rounded text-[9px] uppercase tracking-wider font-extrabold">Cloud</span>
                                <span className="truncate">{bk.name}</span>
                              </div>
                              <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-2 flex items-center gap-1.5 font-medium">
                                <span>Criado:</span>
                                <strong className="font-semibold text-slate-600 dark:text-slate-300">{dateFormatted}</strong>
                                <span className="text-slate-200 dark:text-slate-800">|</span>
                                <span>Tamanho:</span>
                                <strong className="font-semibold text-slate-600 dark:text-slate-300">{sizeKb} KB</strong>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              {/* Restore Button */}
                              <button
                                disabled={isActionActive}
                                onClick={() => handleRestoreGDriveBackup(bk.id, bk.name)}
                                className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-extrabold uppercase tracking-wide flex items-center gap-1 transition-all disabled:opacity-50 cursor-pointer"
                              >
                                {backupActionLoading === `restore_${bk.id}` ? (
                                  <RefreshCw className="w-3 h-3 animate-spin" />
                                ) : (
                                  <CloudDownload className="w-3 h-3" />
                                )}
                                Restaurar
                              </button>

                              {/* Delete button */}
                              <button
                                disabled={isActionActive}
                                onClick={() => handleDeleteGDriveBackup(bk.id, bk.name)}
                                className="p-1.5 border border-red-500/20 hover:bg-red-500/10 text-red-500 rounded-lg transition-all disabled:opacity-50 cursor-pointer"
                                title="Eliminar Permanente"
                              >
                                {backupActionLoading === `delete_${bk.id}` ? (
                                  <RefreshCw className="w-3 h-3 animate-spin" />
                                ) : (
                                  <Trash2 className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

            </div>
          </motion.div>
        )}

        {activeSubTab === 'audit' && (
          <motion.div
            key="admin_audit"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className={`p-6 rounded-2xl border ${
              theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
            } space-y-6 shadow-sm`}
          >
            {/* Tab Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-105 dark:border-slate-800/60 pb-4">
              <div>
                <h3 className="text-base font-bold font-display flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-sky-600" />
                  Histórico de Auditoria Global do Sistema
                </h3>
                <p className="text-xs text-slate-500">
                  Transparência de administração. Monitore todas as mudanças de ciclo, alterações de políticas de segurança, novos membros e redefinições de palavras-passe.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setAuditSearch('');
                    setAuditTypeFilter('all');
                    setAuditStartDate('');
                    setAuditEndDate('');
                  }}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                  title="Restabelecer Filtros"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Limpar Filtros</span>
                </button>
              </div>
            </div>

            {/* Smart Analytics Cards inside Audit Log */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Card 1 */}
              <div className={`p-4 rounded-xl border ${
                theme === 'dark' ? 'bg-slate-950/40 border-slate-800' : 'bg-slate-50 border-slate-150'
              }`}>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Total Registos</span>
                <span className="text-xl font-black mt-1 block text-sky-600 dark:text-sky-450">{logs.length}</span>
              </div>
              {/* Card 2 */}
              <div className={`p-4 rounded-xl border ${
                theme === 'dark' ? 'bg-slate-950/40 border-slate-800' : 'bg-slate-50 border-slate-150'
              }`}>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Redefinições de Senha</span>
                <span className="text-xl font-black mt-1 block text-amber-500">{logs.filter(l => l.type === 'password_reset').length}</span>
              </div>
              {/* Card 3 */}
              <div className={`p-4 rounded-xl border ${
                theme === 'dark' ? 'bg-slate-950/40 border-slate-800' : 'bg-slate-50 border-slate-150'
              }`}>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Alterações de Políticas</span>
                <span className="text-xl font-black mt-1 block text-purple-500">{logs.filter(l => l.type === 'policy_change').length}</span>
              </div>
              {/* Card 4 */}
              <div className={`p-4 rounded-xl border ${
                theme === 'dark' ? 'bg-slate-950/40 border-slate-800' : 'bg-slate-50 border-slate-150'
              }`}>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Foco de Ciclos</span>
                <span className="text-xl font-black mt-1 block text-emerald-500">{logs.filter(l => l.type === 'cycle_change').length}</span>
              </div>
            </div>

            {/* Search and Filter Inputs Box */}
            <div className={`p-4 rounded-xl border ${
              theme === 'dark' ? 'bg-slate-950 border-slate-850' : 'bg-slate-50/50 border-slate-150'
            } flex flex-col lg:flex-row gap-4 items-end`}>
              
              {/* Text Search */}
              <div className="w-full lg:w-1/3 space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase flex items-center gap-1">
                  <Search className="w-3 h-3 text-slate-400" />
                  Procurar por Palavra-Chave
                </label>
                <input
                  type="text"
                  value={auditSearch}
                  onChange={(e) => setAuditSearch(e.target.value)}
                  placeholder="Pesquisar por descrição, membro..."
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-250 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-[#0284c7] text-slate-800 dark:text-slate-100"
                />
              </div>

              {/* Action Type Filter */}
              <div className="w-full lg:w-1/4 space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase flex items-center gap-1">
                  <Filter className="w-3 h-3 text-slate-400" />
                  Tipo de Ação Crítica
                </label>
                <select
                  value={auditTypeFilter}
                  onChange={(e) => setAuditTypeFilter(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-250 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-[#0284c7] text-slate-800 dark:text-slate-100"
                >
                  <option value="all">Todas as Ações Críticas</option>
                  <option value="password_reset">🔑 Redefinições de Senha</option>
                  <option value="policy_change">🛡️ Alterações de Políticas</option>
                  <option value="cycle_change">📅 Mudanças de Ciclo / Foco</option>
                  <option value="member_management">👥 Gestão de Membros / Contas</option>
                  <option value="contribution">💰 Recebimentos / Cotas</option>
                  <option value="payout font-sans">🔄 Pagamento de Benefício (Kix)</option>
                  <option value="social_aid font-sans">🤝 Apoios Fundo Coletivo</option>
                </select>
              </div>

              {/* Start Date */}
              <div className="w-full lg:w-1/5 space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-slate-400" />
                  De Data
                </label>
                <input
                  type="date"
                  value={auditStartDate}
                  onChange={(e) => setAuditStartDate(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-250 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-[#0284c7] text-slate-800 dark:text-slate-100"
                />
              </div>

              {/* End Date */}
              <div className="w-full lg:w-1/5 space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-slate-400" />
                  Até Data
                </label>
                <input
                  type="date"
                  value={auditEndDate}
                  onChange={(e) => setAuditEndDate(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-[#0284c7] text-slate-800 dark:text-slate-100"
                />
              </div>

            </div>

            {/* List Feed */}
            <div className="space-y-3">
              {(() => {
                const filteredAuditLogs = logs.filter((log) => {
                  // Type filter
                  if (auditTypeFilter !== 'all') {
                    if (log.type !== auditTypeFilter) return false;
                  }

                  // Search text
                  if (auditSearch.trim()) {
                    const query = auditSearch.toLowerCase();
                    const descMatch = log.description?.toLowerCase().includes(query);
                    const nameMatch = log.memberName?.toLowerCase().includes(query);
                    const typeMatch = log.type?.toLowerCase().includes(query);
                    if (!descMatch && !nameMatch && !typeMatch) return false;
                  }

                  // Date start filter
                  if (auditStartDate) {
                    const logTime = new Date(log.timestamp).getTime();
                    const startTime = new Date(auditStartDate).getTime();
                    if (logTime < startTime) return false;
                  }

                  // Date end filter
                  if (auditEndDate) {
                    const logTime = new Date(log.timestamp).getTime();
                    const endOfDayStr = auditEndDate.includes('T') ? auditEndDate : `${auditEndDate}T23:59:59.999Z`;
                    const endTime = new Date(endOfDayStr).getTime();
                    if (logTime > endTime) return false;
                  }

                  return true;
                });

                if (filteredAuditLogs.length === 0) {
                  return (
                    <div className="p-12 text-center rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800" id="empty-audit-logs">
                      <ShieldCheck className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
                      <p className="text-xs font-bold text-slate-500 dark:text-slate-400">Nenhum registo de auditoria cruza com os filtros definidos.</p>
                      <p className="text-[10px] text-slate-400 mt-1">Inscreva novos termos ou limpe o formulário para expandir os resultados.</p>
                    </div>
                  );
                }

                return (
                  <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800" id="audit-logs-table-wrapper">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 dark:bg-slate-950 font-bold text-slate-500 uppercase tracking-wider text-[10px] border-b border-slate-200 dark:border-slate-800">
                        <tr>
                          <th className="py-3 px-4">Data e Hora</th>
                          <th className="py-3 px-4">Categoria</th>
                          <th className="py-3 px-4 animate-fade-in">Descrição da Ação Crítica</th>
                          <th className="py-3 px-4 text-center">Referência</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                        {filteredAuditLogs.map((log) => {
                          let badgeBg = 'bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-300';
                          let icon = '🛡️';

                          switch (log.type) {
                            case 'password_reset':
                              badgeBg = 'bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-300 border border-red-200/50';
                              icon = '🔑';
                              break;
                            case 'policy_change':
                              badgeBg = 'bg-purple-50 text-purple-700 dark:bg-purple-950/20 dark:text-purple-300 border border-purple-200/50';
                              icon = '🛡️';
                              break;
                            case 'cycle_change':
                              badgeBg = 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-300 border border-emerald-200/50';
                              icon = '📅';
                              break;
                            case 'member_management':
                              badgeBg = 'bg-sky-50 text-sky-700 dark:bg-sky-950/20 dark:text-sky-300 border border-sky-200/50';
                              icon = '👥';
                              break;
                            case 'contribution':
                              badgeBg = 'bg-slate-50 text-slate-705 dark:bg-slate-950/40 dark:text-slate-400';
                              icon = '💰';
                              break;
                            case 'payout':
                              badgeBg = 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/20 dark:text-indigo-300';
                              icon = '🔄';
                              break;
                            case 'social_aid':
                              badgeBg = 'bg-amber-50 text-amber-805 dark:bg-amber-950/20 dark:text-amber-305 border border-amber-200/50';
                              icon = '🤝';
                              break;
                          }

                          return (
                            <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/40 transition-colors">
                              {/* Date Time */}
                              <td className="py-3 px-4 font-mono text-[11px] whitespace-nowrap text-slate-500 dark:text-slate-400">
                                {new Date(log.timestamp).toLocaleString('pt-PT', {
                                  year: 'numeric',
                                  month: '2-digit',
                                  day: '2-digit',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  second: '2-digit',
                                })}
                              </td>

                              {/* Category Badge */}
                              <td className="py-3 px-4 whitespace-nowrap">
                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 w-fit ${badgeBg}`}>
                                  <span>{icon}</span>
                                  <span>
                                    {log.type === 'password_reset' && 'Senha'}
                                    {log.type === 'policy_change' && 'Política'}
                                    {log.type === 'cycle_change' && 'Ciclo'}
                                    {log.type === 'member_management' && 'Membro'}
                                    {log.type === 'contribution' && 'Cota'}
                                    {log.type === 'payout' && 'Benefício'}
                                    {log.type === 'social_aid' && 'Apoio Social'}
                                  </span>
                                </span>
                              </td>

                              {/* Description */}
                              <td className="py-3 px-4 text-[11.5px] font-semibold">
                                <div className="text-slate-800 dark:text-slate-100 leading-relaxed max-w-xl">
                                  {log.description}
                                </div>
                                {log.memberName && (
                                  <div className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider">
                                    Membro citado: <span className="font-bold">{log.memberName}</span>
                                  </div>
                                )}
                              </td>

                              {/* Month reference */}
                              <td className="py-3 px-4 text-center whitespace-nowrap">
                                <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded font-mono text-[10px] font-black uppercase text-slate-500 dark:text-slate-300">
                                  Mês {log.month < 10 ? `0${log.month}` : log.month}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                );
              })()}
            </div>
          </motion.div>
        )}
      </div>

    </div>
  );
}

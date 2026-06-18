import React, { useState } from 'react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  Users, 
  Lock, 
  Unlock, 
  Save, 
  Check, 
  Info,
  Coins, 
  FileText, 
  Sliders, 
  Database,
  LayoutDashboard,
  Wallet,
  Settings,
  Activity
} from 'lucide-react';
import { Member, getMemberIdCode } from '../types';

interface PrivilegesManagementProps {
  members: Member[];
  setMembers: React.Dispatch<React.SetStateAction<Member[]>>;
  saveState: (m: Member[], l: any[]) => void;
  logs: any[];
  setLogs: React.Dispatch<React.SetStateAction<any[]>>;
  currentUserEmail: string;
  theme: 'light' | 'dark';
}

export default function PrivilegesManagement({
  members,
  setMembers,
  saveState,
  logs,
  setLogs,
  currentUserEmail,
  theme
}: PrivilegesManagementProps) {
  const isSuperAdmin = currentUserEmail.trim().toLowerCase() === 'lmendesvictor@gmail.com';
  
  // List all users with administrator / gestor profile (role === 'admin' OR with admin permissions)
  const gestores = members.filter(m => m.role === 'admin');

  // Selected gestor id
  const [selectedGestorId, setSelectedGestorId] = useState<number | null>(
    gestores.length > 0 ? gestores[0].id : null
  );

  const selectedGestor = members.find(m => m.id === selectedGestorId);

  // Form State for Permissions
  const [permsState, setPermsState] = useState({
    // Modules Access
    accessInicio: true,
    accessDashboard: true,
    accessMembersList: true,
    accessCycles: true,
    accessSocial: true,
    accessAudit: true,
    accessAdminModule: true,
    accessReports: true,
    accessContracts: true,

    // Sensitive Actions
    actionRegisterPayments: true,
    actionGrantSocialAid: true,
    actionIssueCredits: true,
    actionManageSlides: true,
    actionManageBackups: true,
    actionResetPasswords: true,
  });

  // Track if we need to sync state when selection changes
  const [lastSelectedId, setLastSelectedId] = useState<number | null>(null);

  if (selectedGestor && selectedGestor.id !== lastSelectedId) {
    const p = selectedGestor.permissions || {};
    setPermsState({
      accessInicio: p.accessInicio !== false,
      accessDashboard: p.accessDashboard !== false,
      accessMembersList: p.accessMembersList !== false,
      accessCycles: p.accessCycles !== false,
      accessSocial: p.accessSocial !== false,
      accessAudit: p.accessAudit !== false,
      accessAdminModule: p.accessAdminModule !== false,
      accessReports: p.accessReports !== false,
      accessContracts: p.accessContracts !== false,

      actionRegisterPayments: p.actionRegisterPayments !== false,
      actionGrantSocialAid: p.actionGrantSocialAid !== false,
      actionIssueCredits: p.actionIssueCredits !== false,
      actionManageSlides: p.actionManageSlides !== false,
      actionManageBackups: p.actionManageBackups !== false,
      actionResetPasswords: p.actionResetPasswords !== false,
    });
    setLastSelectedId(selectedGestor.id);
  }

  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const handleTogglePerm = (key: keyof typeof permsState) => {
    if (!isSuperAdmin) return; // Only super-admin can toggle permissions
    if (selectedGestor?.email.trim().toLowerCase() === 'lmendesvictor@gmail.com') {
      // Super admin permissions are permanently enabled
      return;
    }
    setPermsState(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSavePrivileges = () => {
    if (!isSuperAdmin) {
      alert('Apenas o Super-Administrador (lmendesvictor) possui competência para governar os privilégios.');
      return;
    }
    if (!selectedGestor) return;

    if (selectedGestor.email.trim().toLowerCase() === 'lmendesvictor@gmail.com') {
      alert('As credenciais do Super-Administrador são soberanas e imutáveis por desenho regulamentar.');
      return;
    }

    setSaving(true);
    setSuccessMsg('');

    // Prepare updated permissions
    const updatedPermissions = {
      accessInicio: permsState.accessInicio,
      accessDashboard: permsState.accessDashboard,
      accessMembersList: permsState.accessMembersList,
      accessCycles: permsState.accessCycles,
      accessSocial: permsState.accessSocial,
      accessAudit: permsState.accessAudit,
      accessAdminModule: permsState.accessAdminModule,
      accessReports: permsState.accessReports,
      accessContracts: permsState.accessContracts,

      actionRegisterPayments: permsState.actionRegisterPayments,
      actionGrantSocialAid: permsState.actionGrantSocialAid,
      actionIssueCredits: permsState.actionIssueCredits,
      actionManageSlides: permsState.actionManageSlides,
      actionManageBackups: permsState.actionManageBackups,
      actionResetPasswords: permsState.actionResetPasswords,
    };

    const updatedMembers = members.map(m => {
      if (m.id === selectedGestor.id) {
        return {
          ...m,
          permissions: updatedPermissions
        };
      }
      return m;
    });

    // Create Audit Log
    const newLog = {
      id: `privs-${Date.now()}`,
      timestamp: new Date().toISOString(),
      type: 'policy_change' as const,
      memberName: selectedGestor.name,
      amount: 0,
      description: `OUTORGA DE PRIVILÉGIOS: O Super-Administrador lmendesvictor actualizou a matriz de privilégios e permissões operacionais do gestor ${selectedGestor.name} (${selectedGestor.email}).`,
      month: 1
    };

    const updatedLogs = [newLog, ...logs];

    setTimeout(() => {
      setMembers(updatedMembers);
      setLogs(updatedLogs);
      saveState(updatedMembers, updatedLogs);
      setSaving(false);
      setSuccessMsg(`Os privilégios regulatórios do gestor "${selectedGestor.name}" foram consolidados e gravados!`);
      setTimeout(() => setSuccessMsg(''), 5000);
    }, 600);
  };

  return (
    <div className={`p-6 rounded-2xl border ${
      theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
    } space-y-6 shadow-sm`} id="privileges-management-wrapper">
      
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800/60 pb-4">
        <div>
          <h3 className="text-base font-bold font-display flex items-center gap-2 text-rose-500">
            <ShieldAlert className="w-5 h-5 text-rose-500" />
            Outorga de Privilégios & Gestão de Permissões (Gestores)
          </h3>
          <p className="text-xs text-slate-500">
            Governação do Consórcio. Configure minuciosamente quais os ecrãs do portal e quais acções críticas operacionais os administradores auxiliares ('gestores') têm legitimidade de aceder.
          </p>
        </div>
        <div id="superadmin-badge-container">
          {isSuperAdmin ? (
            <span className="px-3 py-1 bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20 text-[10px] font-extrabold uppercase tracking-widest rounded-xl flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              Soberano: Super-Administrador Ativo
            </span>
          ) : (
            <span className="px-3 py-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-[10px] font-extrabold uppercase tracking-widest rounded-xl flex items-center gap-1">
              <Lock className="w-3.5 h-3.5" />
              Apenas Leitura: Administrador Comum
            </span>
          )}
        </div>
      </div>

      {!isSuperAdmin && (
        <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start gap-3 class-caution text-xs text-amber-600 dark:text-amber-400 font-bold">
          <Info className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <div>
            ⚠️ <strong>Prerrogativa Restrita:</strong> Apenas o Super-Administrador <strong>lmendesvictor@gmail.com</strong> possui privilégios de governança para conceder ou limitar ações de outros gestores do sistema. O seu acesso foi reduzido ao modo de visualização.
          </div>
        </div>
      )}

      {/* Main Workspace split */}
      {gestores.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
          <Users className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
          <h5 className="text-sm font-bold text-slate-500">Nenhum administrador adicional detetado.</h5>
          <p className="text-xs text-slate-400 mt-1">Crie utilizadores com perfil gestor (admin) no subtab 'Utilizadores' para gerir seus privilégios.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column: Select Gestor */}
          <div className="lg:col-span-4 space-y-4">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">
              👤 Seleccione o Administrador / Gestor do Fundo ({gestores.length})
            </label>
            <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
              {gestores.map(g => {
                const isSelected = selectedGestorId === g.id;
                const isSovereign = g.email.trim().toLowerCase() === 'lmendesvictor@gmail.com';
                return (
                  <button
                    key={g.id}
                    onClick={() => setSelectedGestorId(g.id)}
                    className={`w-full text-left p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      isSelected
                        ? theme === 'dark'
                          ? 'bg-rose-950/20 border-rose-500 text-rose-200 shadow-sm'
                          : 'bg-rose-50 border-rose-400 text-rose-950 font-bold shadow-xs'
                        : theme === 'dark'
                          ? 'bg-slate-950 border-slate-850 hover:bg-slate-900 text-slate-300'
                          : 'bg-slate-50 border-slate-205 hover:bg-slate-100 text-slate-800 font-bold'
                    }`}
                  >
                    <div className="min-w-0">
                      <span className="font-extrabold text-xs block truncate">{g.name}</span>
                      <span className="text-[10px] text-slate-400 block truncate leading-tight mt-0.5">{g.email}</span>
                      <span className="text-[9px] font-mono text-slate-500 block leading-tight mt-1">ID: #0{g.id}</span>
                    </div>
                    <div>
                      {isSovereign ? (
                        <span className="px-1.5 py-0.5 bg-amber-500/10 text-amber-500 border border-amber-500/20 text-[8px] font-extrabold rounded uppercase shrink-0">
                          Soberano
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 bg-slate-500/15 text-slate-500 dark:text-slate-400 rounded text-[9px] font-bold uppercase shrink-0">
                          Gestor
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className={`p-4 rounded-xl border space-y-2 text-[11px] ${
              theme === 'dark' ? 'bg-slate-950/40 border-slate-800/80 text-slate-300' : 'bg-slate-100/50 border-slate-200 text-slate-800 font-medium'
            }`}>
              <div className="flex items-center gap-1.5 font-bold text-slate-500 dark:text-slate-400">
                <Info className="w-3.5 h-3.5 text-sky-500" />
                <span>Como designar novos Gestores?</span>
              </div>
              <p className="leading-relaxed">
                As funções principais de privilégios de acesso são configuráveis na ficha cadastral de cada cooperante. Navegue até o separador <strong>'Tabela Utilizadores'</strong> acima, edite o membro pretendido e mude o seu <strong>'Nível de Privilégio'</strong> de Membro para Administrador. O seu nome surgirá automaticamente aqui no cofre.
              </p>
            </div>
          </div>

          {/* Right Column: Manage Privileges Map */}
          {selectedGestor && (
            <div className="lg:col-span-8 space-y-6">
              
              {/* Profile Card of Selected Target */}
              <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 ${
                theme === 'dark' ? 'bg-slate-950/40 border-slate-850' : 'bg-slate-50/70 border-slate-150'
              }`}>
                <div>
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Gestor Selecionado para Outorga de Alçada</span>
                  <h4 className="text-sm font-black text-rose-500 dark:text-rose-450 mt-0.5">{selectedGestor.name}</h4>
                  <p className="text-xs text-slate-500 font-mono mt-1">{selectedGestor.email} • {selectedGestor.phone}</p>
                </div>
                {selectedGestor.email.trim().toLowerCase() === 'lmendesvictor@gmail.com' ? (
                  <div className="p-2 bg-amber-500/10 border border-amber-500/20 text-[10px] rounded-xl text-amber-500 font-bold max-w-xs block leading-relaxed leading-snug">
                    👑 <strong>Super-Administrador:</strong> As permissões desta conta são irrestritas e inalteráveis. O Kixi-Fundo exige sempre a presença de um supervisor soberano absoluto.
                  </div>
                ) : (
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Checksum Regulatória</span>
                    <span className="font-mono text-[9px] text-rose-500 font-extrabold bg-rose-500/5 px-2 py-0.5 rounded border border-rose-500/20 uppercase tracking-widest">{getMemberIdCode(selectedGestor.name, selectedGestor.phone)}</span>
                  </div>
                )}
              </div>

              {/* Matrix List of Modules vs Actions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* 1. MODULES (access...) */}
                <div className="space-y-3.5">
                  <div className="flex items-center gap-1.5 text-xs font-black uppercase text-slate-400 tracking-wider">
                    <Database className="w-4 h-4 text-sky-500" />
                    <span>1. Módulos & Ecrãs do Portal (Visualização)</span>
                  </div>
                  
                  <div className="space-y-2.5">
                    {[
                      { key: 'accessInicio' as const, label: 'Início', desc: 'Boas-vindas do consórcio rotativo de cotas.' },
                      { key: 'accessDashboard' as const, label: 'Painel Geral & Gráficos', desc: 'Acesso aos gráficos e percentuais de arrecadação financeira.' },
                      { key: 'accessMembersList' as const, label: 'Lista de Membros (Cadastro)', desc: 'Tabela geral de cadastro de cooperantes e IBANs públicos.' },
                      { key: 'accessCycles' as const, label: 'Quadro de Pagamentos e Ciclos', desc: 'Tela de registo de cotas, pagamentos Kix e recolha de meses.' },
                      { key: 'accessSocial' as const, label: 'Fundo Social de Interajuda', desc: 'Permite ecrã de auxílios e resgates médicos em lote.' },
                      { key: 'accessAudit' as const, label: 'Auditoria de Transações (Ledger)', desc: 'Livro-Razão digital com as actas matemáticas cifradas.' },
                      { key: 'accessReports' as const, label: 'Relatórios & Balancete BIC', desc: 'Tela de reconciliação de conciliações e extratos directos.' },
                      { key: 'accessContracts' as const, label: 'Microcréditos & Empréstimos', desc: 'Acesso às amortizações e taxas de juro de empréstimos.' },
                      { key: 'accessAdminModule' as const, label: 'Ecrã de Administração Estratégica', desc: 'Direito de abrir o Módulo de Administração (esta secção).' },
                    ].map(item => {
                      const value = selectedGestor.email.trim().toLowerCase() === 'lmendesvictor@gmail.com' ? true : permsState[item.key];
                      const disabled = !isSuperAdmin || selectedGestor.email.trim().toLowerCase() === 'lmendesvictor@gmail.com';
                      return (
                        <div 
                          key={item.key}
                          onClick={() => !disabled && handleTogglePerm(item.key)}
                          className={`p-3 rounded-xl border text-xs cursor-pointer select-none transition-all flex items-start gap-3 justify-between ${
                            value 
                              ? theme === 'dark' 
                                ? 'bg-sky-950/20 border-sky-500/40 hover:bg-sky-950/30 text-sky-205'
                                : 'bg-sky-50/50 border-sky-200 hover:bg-sky-50 text-slate-800'
                              : theme === 'dark'
                                ? 'bg-slate-950/20 border-slate-850 hover:bg-slate-900/30 text-slate-500'
                                : 'bg-slate-50/20 border-slate-200 hover:bg-slate-50 text-slate-400 font-bold'
                          } ${disabled ? 'opacity-80' : ''}`}
                        >
                          <div className="space-y-1 pr-4">
                            <span className="font-extrabold block leading-tight">{item.label}</span>
                            <span className={`text-[10px] block leading-snug ${value ? 'text-slate-405 dark:text-sky-300' : 'text-slate-400'}`}>{item.desc}</span>
                          </div>
                          
                          <div className="pt-0.5 shrink-0">
                            <div className={`w-5 h-5 rounded-md flex items-center justify-center transition-all border ${
                              value 
                                ? 'bg-sky-600 border-sky-500 text-white' 
                                : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-805 text-transparent'
                            }`}>
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 2. SENSITIVE ACTIONS (action...) */}
                <div className="space-y-3.5">
                  <div className="flex items-center gap-1.5 text-xs font-black uppercase text-slate-400 tracking-wider">
                    <Sliders className="w-4 h-4 text-rose-500" />
                    <span>2. Operações & Ações Administrativas</span>
                  </div>

                  <div className="space-y-2.5">
                    {[
                      { key: 'actionRegisterPayments' as const, label: 'Registar Recebimentos / Quotas', desc: 'Permissão para registar, cobrar e estornar quotas de membros.' },
                      { key: 'actionGrantSocialAid' as const, label: 'Conceder Apoio Social / Interajuda', desc: 'Aprovar e conceder auxílios imediatos do Fundo de Segurança.' },
                      { key: 'actionIssueCredits' as const, label: 'Emitir Novos Créditos & Amortizações', desc: 'Formalizar créditos reembolsáveis e baixar parcelas.' },
                      { key: 'actionManageSlides' as const, label: 'Gerir Slides e Comunicação Inicial', desc: 'Editar ou criar destaques na fita superior do mural.' },
                      { key: 'actionManageBackups' as const, label: 'Diretivas de Backups e Cofre local', desc: 'Criar ou restaurar backups do Google-Drive e JSONs.' },
                      { key: 'actionResetPasswords' as const, label: 'Redefinir Palavras-passe (Senhas)', desc: 'Efetuar a troca manual e auditoria de senhas provisórias.' },
                    ].map(item => {
                      const value = selectedGestor.email.trim().toLowerCase() === 'lmendesvictor@gmail.com' ? true : permsState[item.key];
                      const disabled = !isSuperAdmin || selectedGestor.email.trim().toLowerCase() === 'lmendesvictor@gmail.com';
                      return (
                        <div 
                          key={item.key}
                          onClick={() => !disabled && handleTogglePerm(item.key)}
                          className={`p-3 rounded-xl border text-xs cursor-pointer select-none transition-all flex items-start gap-3 justify-between ${
                            value 
                              ? theme === 'dark' 
                                ? 'bg-rose-950/20 border-rose-500/40 hover:bg-rose-950/30 text-rose-250'
                                : 'bg-rose-50/50 border-rose-200 hover:bg-rose-50 text-slate-800'
                              : theme === 'dark'
                                ? 'bg-slate-950/20 border-slate-850 hover:bg-slate-900/30 text-slate-500'
                                : 'bg-slate-50/20 border-slate-200 hover:bg-slate-100 text-slate-400 font-bold'
                          } ${disabled ? 'opacity-80' : ''}`}
                        >
                          <div className="space-y-1 pr-4">
                            <span className="font-extrabold block leading-tight">{item.label}</span>
                            <span className={`text-[10px] block leading-snug ${value ? 'text-slate-405 dark:text-rose-300' : 'text-slate-400'}`}>{item.desc}</span>
                          </div>
                          
                          <div className="pt-0.5 shrink-0">
                            <div className={`w-5 h-5 rounded-md flex items-center justify-center transition-all border ${
                              value 
                                ? 'bg-rose-600 border-rose-500 text-white' 
                                : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-805 text-transparent'
                            }`}>
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>

              {/* Success, Saving and Triggers row */}
              <div className="pt-4 border-t border-slate-150 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-xs font-semibold">
                  {successMsg && (
                    <span className="text-teal-600 dark:text-teal-400 font-bold flex items-center gap-1.5 animate-pulse">
                      <Check className="w-4 h-4 shrink-0 bg-teal-500/15 p-0.5 rounded-full" />
                      {successMsg}
                    </span>
                  )}
                </div>
                
                <button
                  onClick={handleSavePrivileges}
                  disabled={saving || !isSuperAdmin || selectedGestor.email.trim().toLowerCase() === 'lmendesvictor@gmail.com'}
                  className={`w-full sm:w-auto px-6 py-3 rounded-xl text-xs font-extrabold tracking-wide uppercase flex items-center justify-center gap-2 cursor-pointer transition-all ${
                    !isSuperAdmin || selectedGestor.email.trim().toLowerCase() === 'lmendesvictor@gmail.com'
                      ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-650 cursor-not-allowed border border-transparent'
                      : 'bg-rose-600 hover:bg-rose-500 text-white shadow-md active:scale-95'
                  }`}
                >
                  {saving ? (
                    <Activity className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  <span>Gravar Alterações de Privilégio</span>
                </button>
              </div>

            </div>
          )}

        </div>
      )}

    </div>
  );
}

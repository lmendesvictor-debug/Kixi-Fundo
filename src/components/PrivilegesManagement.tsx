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
import { Member, getMemberIdCode, RolePermissions, ModulePermissionLevel } from '../types';

interface PrivilegesManagementProps {
  members: Member[];
  setMembers: React.Dispatch<React.SetStateAction<Member[]>>;
  saveState: (m: Member[], l: any[], payouts?: any, month?: any, loans?: any, config?: any) => void;
  logs: any[];
  setLogs: React.Dispatch<React.SetStateAction<any[]>>;
  currentUserEmail: string;
  theme: 'light' | 'dark';
  appConfig: any;
  setAppConfig: React.Dispatch<React.SetStateAction<any>>;
}

const defaultRolePermissions: RolePermissions = {
  membro: {
    members: 'none',
    cycles: 'read',
    social: 'read',
    contracts: 'read',
    audit: 'read',
    reports: 'read',
    admin: 'none',
    dashboard: 'none',
  },
  admin: {
    members: 'delete',
    cycles: 'delete',
    social: 'delete',
    contracts: 'delete',
    audit: 'delete',
    reports: 'delete',
    admin: 'delete',
    dashboard: 'delete',
  },
};

export default function PrivilegesManagement({
  members,
  setMembers,
  saveState,
  logs,
  setLogs,
  currentUserEmail,
  theme,
  appConfig,
  setAppConfig
}: PrivilegesManagementProps) {
  const isSuperAdmin = currentUserEmail.trim().toLowerCase() === 'lmendesvictor@gmail.com';
  
  const [mgmtTab, setMgmtTab] = useState<'individual' | 'global'>('individual');

  const [globalPerms, setGlobalPerms] = useState<RolePermissions>(() => {
    return appConfig?.rolePermissions || defaultRolePermissions;
  });

  // Filters for individual members list
  const [memberSearch, setMemberSearch] = useState('');
  const [memberRoleFilter, setMemberRoleFilter] = useState<'all' | 'admin' | 'membro'>('all');

  // List ALL members so the super-admin can govern ANY user's permissions
  const filteredList = members.filter(m => {
    const matchesSearch = m.name.toLowerCase().includes(memberSearch.toLowerCase()) || 
                          m.email.toLowerCase().includes(memberSearch.toLowerCase()) ||
                          m.phone.includes(memberSearch);
    const matchesRole = memberRoleFilter === 'all' || m.role === memberRoleFilter;
    return matchesSearch && matchesRole;
  });

  // Selected member ID
  const [selectedGestorId, setSelectedGestorId] = useState<number | null>(
    members.length > 0 ? members[0].id : null
  );

  const selectedGestor = members.find(m => m.id === selectedGestorId);

  // Form State for legacy/sensitive boolean actions
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

  // Form State for granular individual module levels
  const [individualModulePerms, setIndividualModulePerms] = useState<{
    inicio: ModulePermissionLevel;
    dashboard: ModulePermissionLevel;
    members: ModulePermissionLevel;
    cycles: ModulePermissionLevel;
    social: ModulePermissionLevel;
    contracts: ModulePermissionLevel;
    reports: ModulePermissionLevel;
    audit: ModulePermissionLevel;
    admin: ModulePermissionLevel;
  }>({
    inicio: 'read',
    dashboard: 'none',
    members: 'none',
    cycles: 'read',
    social: 'read',
    contracts: 'read',
    reports: 'read',
    audit: 'read',
    admin: 'none',
  });

  // Track if we need to sync state when selection changes
  const [lastSelectedId, setLastSelectedId] = useState<number | null>(null);

  if (selectedGestor && selectedGestor.id !== lastSelectedId) {
    const p = selectedGestor.permissions || {};
    const mp = p.modulePermissions || {};
    const isMemberRole = selectedGestor.role === 'membro';

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

    setIndividualModulePerms({
      inicio: mp.inicio || (p.accessInicio === false ? 'none' : 'read'),
      dashboard: mp.dashboard || (p.accessDashboard === false ? 'none' : (isMemberRole ? 'none' : 'delete')),
      members: mp.members || (p.accessMembersList === false ? 'none' : (isMemberRole ? 'none' : 'delete')),
      cycles: mp.cycles || (p.accessCycles === false ? 'none' : (isMemberRole ? 'read' : 'delete')),
      social: mp.social || (p.accessSocial === false ? 'none' : (isMemberRole ? 'read' : 'delete')),
      contracts: mp.contracts || (p.accessContracts === false ? 'none' : (isMemberRole ? 'read' : 'delete')),
      reports: mp.reports || (p.accessReports === false ? 'none' : (isMemberRole ? 'read' : 'delete')),
      audit: mp.audit || (p.accessAudit === false ? 'none' : (isMemberRole ? 'read' : 'delete')),
      admin: mp.admin || (p.accessAdminModule === false ? 'none' : (isMemberRole ? 'none' : 'delete')),
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

    // Prepare updated permissions with both legacy booleans and the new modulePermissions map
    const updatedPermissions = {
      ...selectedGestor.permissions,
      accessInicio: individualModulePerms.inicio !== 'none',
      accessDashboard: individualModulePerms.dashboard !== 'none',
      accessMembersList: individualModulePerms.members !== 'none',
      accessCycles: individualModulePerms.cycles !== 'none',
      accessSocial: individualModulePerms.social !== 'none',
      accessAudit: individualModulePerms.audit !== 'none',
      accessAdminModule: individualModulePerms.admin !== 'none',
      accessReports: individualModulePerms.reports !== 'none',
      accessContracts: individualModulePerms.contracts !== 'none',

      actionRegisterPayments: permsState.actionRegisterPayments,
      actionGrantSocialAid: permsState.actionGrantSocialAid,
      actionIssueCredits: permsState.actionIssueCredits,
      actionManageSlides: permsState.actionManageSlides,
      actionManageBackups: permsState.actionManageBackups,
      actionResetPasswords: permsState.actionResetPasswords,

      modulePermissions: individualModulePerms,
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
      description: `OUTORGA DE PRIVILÉGIOS GRANULARES: O Super-Administrador lmendesvictor actualizou as permissões de acesso aos módulos e acções críticas do utilizador ${selectedGestor.name} (${selectedGestor.email}).`,
      month: 1
    };

    const updatedLogs = [newLog, ...logs];

    setTimeout(() => {
      setMembers(updatedMembers);
      setLogs(updatedLogs);
      saveState(updatedMembers, updatedLogs);
      setSaving(false);
      setSuccessMsg(`Os privilégios regulatórios do utilizador "${selectedGestor.name}" foram consolidados e gravados!`);
      setTimeout(() => setSuccessMsg(''), 5000);
    }, 600);
  };

  const handleSaveGlobalPermissions = () => {
    if (!isSuperAdmin) {
      alert('Apenas o Super-Administrador (lmendesvictor) possui competência para governar as regras de acesso globais.');
      return;
    }
    setSaving(true);
    setSuccessMsg('');

    const updatedConfig = {
      ...appConfig,
      rolePermissions: globalPerms,
    };

    // Create Audit Log
    const newLog = {
      id: `rbac-${Date.now()}`,
      timestamp: new Date().toISOString(),
      type: 'policy_change' as const,
      memberName: 'Super-Administrador',
      amount: 0,
      description: `REGRAS DE ACESSO GLOBAIS ATUALIZADAS (RBAC): O Super-Administrador lmendesvictor actualizou as regras de acessos globais para membros e administradores de forma a alinhar a sincronicidade dos acessos.`,
      month: 1
    };

    const updatedLogs = [newLog, ...logs];

    setTimeout(() => {
      setAppConfig(updatedConfig);
      setLogs(updatedLogs);
      saveState(members, updatedLogs, null, null, null, updatedConfig);
      setSaving(false);
      setSuccessMsg('As regras de acessos globais (RBAC) foram consolidadas e gravadas com sucesso!');
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
            Outorga de Privilégios & Gestão de Permissões Granulares
          </h3>
          <p className="text-xs text-slate-500">
            Governação do Consórcio. Configure as regras de permissões de visualização, leitura, escrita e exclusão nos diferentes módulos de forma granular.
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

      {/* Subtab Toggle Buttons */}
      <div className="flex border-b border-slate-100 dark:border-slate-800 pb-px mb-4">
        <button
          onClick={() => setMgmtTab('individual')}
          className={`px-5 py-3 text-xs font-black uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
            mgmtTab === 'individual'
              ? 'border-rose-500 text-rose-600 dark:text-rose-400 font-bold'
              : 'border-transparent text-slate-400 hover:text-slate-650 dark:hover:text-slate-200'
          }`}
        >
          🔑 Privilégios Individuais (Membros e Gestores)
        </button>
        <button
          onClick={() => setMgmtTab('global')}
          className={`px-5 py-3 text-xs font-black uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
            mgmtTab === 'global'
              ? 'border-rose-500 text-rose-600 dark:text-rose-400 font-bold'
              : 'border-transparent text-slate-400 hover:text-slate-650 dark:hover:text-slate-200'
          }`}
        >
          🌍 Regras Globais de Acesso (RBAC por Função)
        </button>
      </div>

      {mgmtTab === 'individual' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column: Select Member */}
          <div className="lg:col-span-4 space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">
                👤 Filtrar e Selecionar Membro / Perfil
              </label>
              
              {/* Search Bar */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Pesquisar por nome ou e-mail..."
                  value={memberSearch}
                  onChange={(e) => setMemberSearch(e.target.value)}
                  className={`w-full text-xs pl-8 pr-4 py-2 rounded-xl border ${
                    theme === 'dark' 
                      ? 'bg-slate-950 border-slate-800 text-white placeholder-slate-500 focus:border-rose-500' 
                      : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-rose-400'
                  } outline-none transition-all`}
                />
                <span className="absolute left-3 top-2 text-slate-400">🔍</span>
              </div>

              {/* Role filter buttons */}
              <div className="grid grid-cols-3 gap-1 p-0.5 bg-slate-100 dark:bg-slate-950 border border-slate-150 dark:border-slate-800 rounded-xl">
                {(['all', 'admin', 'membro'] as const).map((r) => (
                  <button
                    key={r}
                    onClick={() => setMemberRoleFilter(r)}
                    className={`py-1 text-[9px] font-bold uppercase rounded-lg transition-all ${
                      memberRoleFilter === r
                        ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-350'
                    }`}
                  >
                    {r === 'all' ? 'Todos' : r === 'admin' ? 'Gestores' : 'Sócios'}
                  </button>
                ))}
              </div>
            </div>

            {/* Scrollable Members List */}
            <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
              {filteredList.map(g => {
                const isSelected = selectedGestorId === g.id;
                const isSovereign = g.email.trim().toLowerCase() === 'lmendesvictor@gmail.com';
                const hasCustomPerms = !!g.permissions?.modulePermissions;
                return (
                  <button
                    key={g.id}
                    onClick={() => setSelectedGestorId(g.id)}
                    className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      isSelected
                        ? theme === 'dark'
                          ? 'bg-rose-950/20 border-rose-500 text-rose-200 shadow-sm'
                          : 'bg-rose-50 border-rose-400 text-rose-950 font-bold shadow-xs'
                        : theme === 'dark'
                          ? 'bg-slate-950 border-slate-850 hover:bg-slate-900 text-slate-300'
                          : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-850'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-extrabold text-xs truncate block">{g.name}</span>
                        {hasCustomPerms && (
                          <span className="w-1.5 h-1.5 bg-teal-500 rounded-full inline-block animate-pulse" title="Permissões personalizadas ativas" />
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 block truncate leading-tight mt-0.5">{g.email}</span>
                      <span className="text-[9px] font-mono text-slate-500 block leading-tight mt-0.5">ID: #0{g.id}</span>
                    </div>
                    <div className="shrink-0 flex flex-col items-end gap-1">
                      {isSovereign ? (
                        <span className="px-1.5 py-0.5 bg-amber-500/10 text-amber-500 border border-amber-500/20 text-[8px] font-extrabold rounded uppercase shrink-0">
                          Soberano
                        </span>
                      ) : g.role === 'admin' ? (
                        <span className="px-1.5 py-0.5 bg-rose-500/10 text-rose-500 border border-rose-500/20 text-[8px] font-extrabold rounded uppercase shrink-0">
                          Gestor
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20 text-[8px] font-extrabold rounded uppercase shrink-0">
                          Sócio
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}

              {filteredList.length === 0 && (
                <div className="text-center py-8 text-slate-400 text-xs">
                  Nenhum membro localizado com estes filtros.
                </div>
              )}
            </div>

            <div className={`p-4 rounded-xl border space-y-2 text-[11px] ${
              theme === 'dark' ? 'bg-slate-950/40 border-slate-800/80 text-slate-300' : 'bg-slate-100/50 border-slate-200 text-slate-805 font-medium'
            }`}>
              <div className="flex items-center gap-1.5 font-bold text-slate-500 dark:text-slate-400">
                <Info className="w-3.5 h-3.5 text-sky-500" />
                <span>Sobre as Alçadas Individuais</span>
              </div>
              <p className="leading-relaxed">
                Aqui o <strong>Super-Administrador</strong> pode definir permissões sob medida para cada sócio ou gestor. Quando as permissões individuais de um membro são gravadas, elas sobrepõem as regras gerais de acessos por função (RBAC).
              </p>
            </div>
          </div>

          {/* Right Column: Manage Privileges Map */}
          {selectedGestor ? (
            <div className="lg:col-span-8 space-y-6">
              
              {/* Profile Card of Selected Target */}
              <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 ${
                theme === 'dark' ? 'bg-slate-950/40 border-slate-850' : 'bg-slate-50/70 border-slate-150'
              }`}>
                <div>
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Membro Selecionado para Outorga de Alçada</span>
                  <h4 className="text-sm font-black text-rose-500 dark:text-rose-450 mt-0.5">{selectedGestor.name}</h4>
                  <p className="text-xs text-slate-500 font-mono mt-1">{selectedGestor.email} • {selectedGestor.phone} • Perfil: <strong className="uppercase">{selectedGestor.role || 'membro'}</strong></p>
                </div>
                {selectedGestor.email.trim().toLowerCase() === 'lmendesvictor@gmail.com' ? (
                  <div className="p-2 bg-amber-500/10 border border-amber-500/20 text-[10px] rounded-xl text-amber-500 font-bold max-w-xs block leading-relaxed">
                    👑 <strong>Super-Administrador:</strong> As permissões desta conta são irrestritas e inalteráveis. O Kixi-Fundo exige sempre a presença de um supervisor soberano absoluto.
                  </div>
                ) : (
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Checksum Regulatória</span>
                    <span className="font-mono text-[9px] text-rose-500 font-extrabold bg-rose-500/5 px-2 py-0.5 rounded border border-rose-500/20 uppercase tracking-widest">{getMemberIdCode(selectedGestor.name, selectedGestor.phone)}</span>
                  </div>
                )}
              </div>

              {/* Granular Module Access Levels */}
              <div className="space-y-4">
                <div className="flex items-center gap-1.5 text-xs font-black uppercase text-slate-400 tracking-wider">
                  <Database className="w-4 h-4 text-sky-500" />
                  <span>1. Regulação de Acesso Granular por Módulo</span>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  {[
                    { key: 'inicio' as const, label: 'Módulo Início', desc: 'Boas-vindas e painel introdutório do consórcio rotativo.' },
                    { key: 'dashboard' as const, label: 'Módulo Painel & Estatísticas', desc: 'Acesso aos gráficos gerais de rotação, resumos de caixa e visões consolidadas.' },
                    { key: 'members' as const, label: 'Módulo Cadastro de Sócios', desc: 'Lista completa de sócios, perfis individuais e históricos de quotas.' },
                    { key: 'cycles' as const, label: 'Módulo Ciclos & Pagamentos', desc: 'Registo e consulta das cotas mensais de 120.000,00 KZs e rotações.' },
                    { key: 'social' as const, label: 'Módulo Fundo Social', desc: 'Solicitação e aprovação de auxílios e resgates socioassistenciais.' },
                    { key: 'contracts' as const, label: 'Módulo Créditos & Contratos', desc: 'Simulador de empréstimos, assinaturas de contratos e controle de amortizações.' },
                    { key: 'reports' as const, label: 'Módulo Relatórios de Gestão', desc: 'Visualização e exportação de balancetes operacionais (PDF/XLSX).' },
                    { key: 'audit' as const, label: 'Módulo Livro de Auditoria', desc: 'Kix Logs com registo auditável e imutável de transações financeiras.' },
                    { key: 'admin' as const, label: 'Módulo de Administração', desc: 'Acesso às configurações de rede, backups, imagens e chaves.' },
                  ].map((module) => {
                    const currentLevel = selectedGestor.email.trim().toLowerCase() === 'lmendesvictor@gmail.com' 
                      ? 'delete' 
                      : (individualModulePerms[module.key] || 'none');
                    const disabled = !isSuperAdmin || selectedGestor.email.trim().toLowerCase() === 'lmendesvictor@gmail.com';
                    
                    return (
                      <div 
                        key={module.key}
                        className={`p-4 rounded-xl border ${
                          theme === 'dark' ? 'bg-slate-950/60 border-slate-800' : 'bg-white border-slate-200'
                        } flex flex-col md:flex-row md:items-center justify-between gap-4`}
                      >
                        <div className="space-y-0.5 max-w-md">
                          <span className="font-extrabold text-xs text-slate-800 dark:text-white block">
                            {module.label}
                          </span>
                          <span className="text-[10px] text-slate-400 block leading-snug">
                            {module.desc}
                          </span>
                        </div>

                        <div className="inline-flex rounded-xl p-0.5 bg-slate-100 dark:bg-slate-900 border border-slate-150 dark:border-slate-800 self-start md:self-auto shrink-0">
                          {(['none', 'read', 'write', 'delete'] as const).map((lvl) => {
                            const isLvlSelected = currentLevel === lvl;
                            const levelLabels = {
                              none: 'Sem Acesso',
                              read: 'Leitura',
                              write: 'Escrita',
                              delete: 'Exclusão'
                            };

                            const getLevelColor = () => {
                              if (!isLvlSelected) return 'text-slate-405 hover:text-slate-700 dark:hover:text-slate-250 cursor-pointer';
                              if (lvl === 'none') return 'bg-rose-500 text-white';
                              if (lvl === 'read') return 'bg-sky-500 text-white';
                              if (lvl === 'write') return 'bg-emerald-500 text-white';
                              return 'bg-violet-600 text-white';
                            };

                            return (
                              <button
                                key={lvl}
                                type="button"
                                disabled={disabled}
                                onClick={() => {
                                  setIndividualModulePerms((prev) => ({
                                    ...prev,
                                    [module.key]: lvl
                                  }));
                                }}
                                className={`px-2.5 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all ${getLevelColor()} ${
                                  disabled ? 'cursor-not-allowed opacity-50' : ''
                                }`}
                              >
                                {levelLabels[lvl]}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Sensitive Actions (only relevant if they have write/delete permissions) */}
              {selectedGestor.role === 'admin' && (
                <div className="space-y-3.5 pt-2">
                  <div className="flex items-center gap-1.5 text-xs font-black uppercase text-slate-400 tracking-wider">
                    <Sliders className="w-4 h-4 text-rose-500" />
                    <span>2. Operações & Ações Administrativas Adicionais</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
                                : 'bg-rose-50/50 border-rose-200 hover:bg-rose-50 text-slate-805'
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
              )}

              {/* Saving Button & Feedback */}
              <div className="pt-4 border-t border-slate-150 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-xs font-semibold font-sans">
                  {successMsg && (
                    <span className="text-teal-600 dark:text-teal-400 font-bold flex items-center gap-1.5 animate-pulse">
                      <Check className="w-4 h-4 shrink-0 bg-teal-500/15 p-0.5 rounded-full" />
                      {successMsg}
                    </span>
                  )}
                </div>
                
                <button
                  type="button"
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
          ) : (
            <div className="lg:col-span-8 text-center py-12 text-slate-400 text-sm">
              Nenhum membro selecionado.
            </div>
          )}

        </div>
      ) : (
        /* Render Global RBAC panel */
        <div className="space-y-6">
          <div className="bg-slate-50 dark:bg-slate-950/20 border border-slate-150 dark:border-slate-800/60 p-5 rounded-2xl">
            <h4 className="text-sm font-extrabold text-slate-800 dark:text-white uppercase tracking-wider mb-2 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-rose-500" />
              Governação das Regras Globais de Acesso (RBAC)
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Defina o comportamento predefinido para cada nível de perfil. Sócios e Administradores herdarão estes níveis globalmente nos respectivos módulos. 
              Ao alterar um módulo para <strong>"Apenas Leitura"</strong>, os utilizadores desse perfil poderão ver todos os relatórios e ecrãs correspondentes, mas todos os botões de registo, alteração e eliminação de dados serão bloqueados de forma intransigente.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { key: 'dashboard' as const, label: 'Painel Geral & Estatísticas (Dashboard)', desc: 'Ecrã inicial com gráficos de rotação, resumos de caixa e visões consolidadas do fundo.' },
              { key: 'members' as const, label: 'Membros & Cooperadores (Ficha de Sócios)', desc: 'Lista completa de sócios, visualização de perfis individuais e históricos de quotas.' },
              { key: 'cycles' as const, label: 'Ciclos & Pagamento de Quotas (Mural e Caixa)', desc: 'Tabela de quotas de 120.000,00 Kz e plano de rotação com repasse de benefícios.' },
              { key: 'social' as const, label: 'Fundo Social de Interajuda (Apoios Sociais)', desc: 'Visualização da poupança social total e solicitação de auxílios socioassistenciais.' },
              { key: 'contracts' as const, label: 'Créditos & Contratos Reembolsáveis', desc: 'Simulação de empréstimos, assinatura de termos jurídicos, taxas de juro e baixa de parcelas.' },
              { key: 'reports' as const, label: 'Relatórios de Gestão (Exportar PDF & XLSX)', desc: 'Directórios de relatórios operacionais consolidados e formulários configurados para impressão.' },
              { key: 'audit' as const, label: 'Livro de Auditoria & Trut Logs (Segurança)', desc: 'Livro razão Kix Logs com registo imutável de todas as acções financeiras efetuadas.' },
              { key: 'admin' as const, label: 'Módulo de Administração & Backups', desc: 'Acesso a backups na nuvem, logs de auditoria técnica e definições avançadas.' },
            ].map((module) => {
              return (
                <div key={module.key} className={`p-5 rounded-2xl border ${theme === 'dark' ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200'} space-y-4 shadow-xs`}>
                  <div className="space-y-1">
                    <h5 className="text-sm font-extrabold text-slate-800 dark:text-white leading-tight">
                      {module.label}
                    </h5>
                    <p className="text-[11px] text-slate-450 dark:text-slate-400 leading-relaxed">
                      {module.desc}
                    </p>
                  </div>

                  <div className="space-y-3.5 pt-2 border-t border-slate-100 dark:border-slate-800/60">
                    {/* SÓCIO (MEMBRO) CONFIG */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                      <span className="text-[11px] font-bold text-slate-650 dark:text-slate-350 flex items-center gap-1.5 shrink-0">
                        👤 Membro Sócio:
                      </span>
                      <div className="inline-flex rounded-lg p-0.5 bg-slate-100 dark:bg-slate-950 border border-slate-150 dark:border-slate-855/60 self-start sm:self-auto">
                        {(['none', 'read', 'write', 'delete'] as const).map((level) => {
                          const isSelected = globalPerms.membro[module.key] === level;
                          const labels = { none: 'Sem Acesso', read: 'Leitura', write: 'Escrita', delete: 'Exclusão' };
                          return (
                            <button
                              key={level}
                              type="button"
                              disabled={!isSuperAdmin}
                              onClick={() => {
                                setGlobalPerms((prev) => ({
                                  ...prev,
                                  membro: { ...prev.membro, [module.key]: level },
                                }));
                              }}
                              className={`px-2.5 py-1.5 rounded-md text-[9px] font-extrabold uppercase tracking-wide transition-all ${
                                isSelected
                                  ? level === 'none'
                                    ? 'bg-rose-500 text-white'
                                    : level === 'read'
                                    ? 'bg-sky-500 text-white'
                                    : level === 'write'
                                    ? 'bg-emerald-500 text-white'
                                    : 'bg-violet-600 text-white'
                                  : 'text-slate-405 hover:text-slate-700 dark:hover:text-slate-250 cursor-pointer'
                              }`}
                            >
                              {labels[level]}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* ADMIN (GESTOR) CONFIG */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                      <span className="text-[11px] font-bold text-slate-650 dark:text-slate-350 flex items-center gap-1.5 shrink-0">
                        🛡️ Admin Gestor:
                      </span>
                      <div className="inline-flex rounded-lg p-0.5 bg-slate-100 dark:bg-slate-950 border border-slate-150 dark:border-slate-855/60 self-start sm:self-auto">
                        {(['none', 'read', 'write', 'delete'] as const).map((level) => {
                          const isSelected = globalPerms.admin[module.key] === level;
                          const labels = { none: 'Sem Acesso', read: 'Leitura', write: 'Escrita', delete: 'Exclusão' };
                          return (
                            <button
                              key={level}
                              type="button"
                              disabled={!isSuperAdmin}
                              onClick={() => {
                                setGlobalPerms((prev) => ({
                                  ...prev,
                                  admin: { ...prev.admin, [module.key]: level },
                                }));
                              }}
                              className={`px-2.5 py-1.5 rounded-md text-[10px] font-extrabold uppercase tracking-wide transition-all ${
                                isSelected
                                  ? level === 'none'
                                    ? 'bg-rose-500 text-white'
                                    : level === 'read'
                                    ? 'bg-sky-500 text-white'
                                    : level === 'write'
                                    ? 'bg-emerald-500 text-white'
                                    : 'bg-violet-600 text-white'
                                  : 'text-slate-405 hover:text-slate-700 dark:hover:text-slate-250 cursor-pointer'
                              }`}
                            >
                              {labels[level]}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Success message and Save Button for Global Perms */}
          <div className="pt-4 border-t border-slate-150 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs font-semibold font-sans">
              {successMsg && (
                <span className="text-teal-600 dark:text-teal-400 font-bold flex items-center gap-1.5 animate-pulse">
                  <Check className="w-4 h-4 shrink-0 bg-teal-500/15 p-0.5 rounded-full" />
                  {successMsg}
                </span>
              )}
            </div>
            
            <button
              type="button"
              onClick={handleSaveGlobalPermissions}
              disabled={saving || !isSuperAdmin}
              className={`w-full sm:w-auto px-6 py-3 rounded-xl text-xs font-extrabold tracking-wide uppercase flex items-center justify-center gap-2 cursor-pointer transition-all ${
                !isSuperAdmin
                  ? 'bg-slate-200 dark:bg-slate-850 text-slate-400 dark:text-slate-650 cursor-not-allowed border border-transparent'
                  : 'bg-rose-600 hover:bg-rose-500 text-white shadow-md active:scale-95'
              }`}
            >
              {saving ? (
                <Activity className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>Gravar Regras Globais de Acesso (RBAC)</span>
            </button>
          </div>
        </div>
      )}

    </div>
  );
}

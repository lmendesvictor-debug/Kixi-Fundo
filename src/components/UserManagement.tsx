import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  UserPlus, 
  Trash2, 
  Edit, 
  Key, 
  Shield, 
  Eye, 
  EyeOff, 
  Mail, 
  Phone, 
  Calendar, 
  Search, 
  Lock, 
  Check, 
  UserCheck, 
  Database,
  Info
} from 'lucide-react';
import { Member, getMemberIdCode, getMemberDisplayCode } from '../types';

interface UserManagementProps {
  members: Member[];
  setMembers: React.Dispatch<React.SetStateAction<Member[]>>;
  saveState: (newMembers: Member[], newLogs: any[]) => any;
  logs: any[];
  setLogs: React.Dispatch<React.SetStateAction<any[]>>;
  currentUserEmail: string;
  theme?: string;
  appConfig: any;
  setAppConfig: React.Dispatch<React.SetStateAction<any>>;
}

export default function UserManagement({
  members,
  setMembers,
  saveState,
  logs,
  setLogs,
  currentUserEmail,
  theme = 'light',
  appConfig,
  setAppConfig
}: UserManagementProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<'users' | 'configurations'>('users');

  // Form Fields
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    bankIban: '',
    assignedMonth: '3',
    role: 'membro' as 'admin' | 'membro',
    tempPassword: 'membro123',
    allowFinancialReports: true,
    allowAuditingLogs: true,
    allowSupportRequest: true,
    allowReceiptSubmission: true,
    accessInicio: true,
    accessDashboard: true,
    accessMembersList: true,
    accessCycles: true,
    accessSocial: true,
    accessAudit: true,
    accessAdminModule: true,
    accessReports: true,
    accessContracts: true,
  });

  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingConfig, setIsSavingConfig] = useState(false);

  // Local state for app settings editable by admin
  const [appBankIban, setAppBankIban] = useState(appConfig.bankIban);
  const [appPhone, setAppPhone] = useState(appConfig.phone);
  const [appEmail, setAppEmail] = useState(appConfig.email);
  const [showFlowChart, setShowFlowChart] = useState(appConfig.showFlowChart !== false);
  const [showAllocationChart, setShowAllocationChart] = useState(appConfig.showAllocationChart !== false);
  const [showStatsCards, setShowStatsCards] = useState(appConfig.showStatsCards !== false);
  const [chartColorTheme, setChartColorTheme] = useState<'teal' | 'indigo' | 'coral' | 'amber'>(appConfig.chartColorTheme || 'teal');
  const [customMsg, setCustomMsg] = useState(appConfig.customDashboardMessage || '');
  const [fontFamily, setFontFamily] = useState<'inter' | 'outfit' | 'mono' | 'playfair' | 'space'>(appConfig.fontFamily || 'inter');
  const [fontSize, setFontSize] = useState<'compact' | 'normal' | 'medium' | 'large' | 'xlarge'>(appConfig.fontSize || 'normal');
  const [primaryColorTheme, setPrimaryColorTheme] = useState<'emerald' | 'indigo' | 'slate' | 'teal' | 'coral' | 'amber' | 'violet' | 'bordeaux' | 'royal_plum' | 'fire_coral' | 'dark_zinc' | 'solid_navy' | 'sky_frost' | 'ocean_teal'>(appConfig.primaryColorTheme || 'emerald');
  const [adminPrivilegeCanDelete, setAdminPrivilegeCanDelete] = useState<boolean>(appConfig.adminPrivilegeCanDelete !== false);
  const [adminPrivilegeCanRefund, setAdminPrivilegeCanRefund] = useState<boolean>(appConfig.adminPrivilegeCanRefund !== false);
  const [adminPrivilegeCanForcePayout, setAdminPrivilegeCanForcePayout] = useState<boolean>(appConfig.adminPrivilegeCanForcePayout === true);
  const [contractClauseJuros, setContractClauseJuros] = useState(appConfig.contractClauseJuros || '');
  const [contractClauseMultas, setContractClauseMultas] = useState(appConfig.contractClauseMultas || '');
  const [contractClauseGarantias, setContractClauseGarantias] = useState(appConfig.contractClauseGarantias || '');
  const [contractTemplateWhole, setContractTemplateWhole] = useState(appConfig.contractTemplateWhole || '');
  const [appConfigSuccess, setAppConfigSuccess] = useState('');

  const handleSaveAppConfig = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedConfig = {
      bankName: 'Banco BIC Angola',
      bankIban: appBankIban.trim(),
      phone: appPhone.trim(),
      email: appEmail.trim(),
      showFlowChart,
      showAllocationChart,
      showStatsCards,
      chartColorTheme,
      customDashboardMessage: customMsg.trim(),
      fontFamily,
      fontSize,
      primaryColorTheme,
      adminPrivilegeCanDelete,
      adminPrivilegeCanRefund,
      adminPrivilegeCanForcePayout,
      contractClauseJuros: contractClauseJuros.trim(),
      contractClauseMultas: contractClauseMultas.trim(),
      contractClauseGarantias: contractClauseGarantias.trim(),
      contractTemplateWhole: contractTemplateWhole.trim()
    };
    setAppConfig(updatedConfig);

    // Create policy change audit log
    const newLog = {
      id: `policy-updated-${Date.now()}`,
      timestamp: new Date().toISOString(),
      type: 'policy_change' as const,
      amount: 0,
      description: `ALTERAÇÃO DE POLÍTICA: Atualização das diretrizes e permissões globais. Exclusão de contas: ${adminPrivilegeCanDelete ? 'ATIVADA' : 'DESATIVADA'}, Reembolsos automáticos: ${adminPrivilegeCanRefund ? 'ATIVADO' : 'DESATIVADO'}, Forçamento de Pagamentos: ${adminPrivilegeCanForcePayout ? 'ATIVADO' : 'DESATIVADO'}.`,
      month: 3
    };

    const updatedLogs = [newLog, ...logs];
    setLogs(updatedLogs);

    setIsSavingConfig(true);
    saveState(members, updatedLogs).then(() => {
      setIsSavingConfig(false);
      setAppConfigSuccess('Parâmetros estratégicos, tipografia, escala visual e privilégios regulatórios salvos com sucesso!');
      setTimeout(() => {
        setAppConfigSuccess('');
      }, 4000);
    }).catch((err: any) => {
      setIsSavingConfig(false);
      alert("Falha ao gravar configurações: " + err);
    });
  };

  // Search matches
  const filteredMembers = members.filter((m) => {
    const matchesSearch = 
      m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.phone.includes(searchTerm);
    const matchesRole = roleFilter === 'all' ? true : m.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const openAddFlow = () => {
    setEditingMember(null);
    setFormData({
      name: '',
      email: '',
      phone: '',
      bankIban: '',
      assignedMonth: '3',
      role: 'membro',
      tempPassword: 'membro123',
      allowFinancialReports: true,
      allowAuditingLogs: true,
      allowSupportRequest: true,
      allowReceiptSubmission: true,
      accessInicio: true,
      accessDashboard: false,
      accessMembersList: false,
      accessCycles: true,
      accessSocial: true,
      accessAudit: true,
      accessAdminModule: false,
      accessReports: true,
      accessContracts: true,
    });
    setErrorMsg('');
    setShowAddModal(true);
  };

  const openEditFlow = (member: Member) => {
    const perms = member.permissions || {};
    setEditingMember(member);
    setFormData({
      name: member.name,
      email: member.email,
      phone: member.phone,
      bankIban: member.bankIban || '',
      assignedMonth: String(member.assignedMonth),
      role: member.role || 'membro',
      tempPassword: member.tempPassword || 'membro123',
      allowFinancialReports: perms.accessReports !== false,
      allowAuditingLogs: perms.accessAudit !== false,
      allowSupportRequest: perms.accessSocial !== false,
      allowReceiptSubmission: true,
      accessInicio: perms.accessInicio !== false,
      accessDashboard: perms.accessDashboard !== false,
      accessMembersList: perms.accessMembersList !== false,
      accessCycles: perms.accessCycles !== false,
      accessSocial: perms.accessSocial !== false,
      accessAudit: perms.accessAudit !== false,
      accessAdminModule: perms.accessAdminModule !== false,
      accessReports: perms.accessReports !== false,
      accessContracts: perms.accessContracts !== false,
    });
    setErrorMsg('');
    setShowAddModal(true);
  };

  const handleDeleteUser = (id: number, email: string) => {
    if (appConfig.adminPrivilegeCanDelete === false) {
      alert('Acesso Negado: A exclusão de contas de cooperantes está desativada de acordo com as políticas regulatórias de privilégios de administrador do sistema. Ative esta política para prosseguir.');
      return;
    }

    if (email.toLowerCase() === currentUserEmail.toLowerCase()) {
      alert('Erro: Não pode eliminar a sua própria conta enquanto estiver autenticado.');
      return;
    }

    if (window.confirm(`Tem a certeza que deseja eliminar DEFINITIVAMENTE o utilizador "${members.find(m => m.id === id)?.name}"?`)) {
      const updated = members.filter((m) => m.id !== id);
      setMembers(updated);
      
      const newLog = {
        id: `user-deleted-${Date.now()}`,
        timestamp: new Date().toISOString(),
        type: 'member_management' as any,
        amount: 0,
        description: `UTILIZADOR ELIMINADO: O administrador eliminou definitivamente a conta de utilizador com e-mail ${email}.`,
        month: 3
      };
      
      const updatedLogs = [newLog, ...logs];
      setLogs(updatedLogs);
      saveState(updated, updatedLogs);
      
      setSuccessMsg('Utilizador eliminado com sucesso!');
      setTimeout(() => setSuccessMsg(''), 3000);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const targetEmail = formData.email.trim().toLowerCase();
    
    // Check password reset permission
    const isResettingPassword = editingMember && editingMember.tempPassword !== formData.tempPassword;
    const isSuperAdmin = currentUserEmail.trim().toLowerCase() === 'lmendesvictor@gmail.com';
    const loggedInMember = members.find(m => m.email.trim().toLowerCase() === currentUserEmail.trim().toLowerCase());
    
    if (isResettingPassword && !isSuperAdmin && loggedInMember?.permissions?.actionResetPasswords === false) {
      setErrorMsg('Acesso Negado: Não possui privilégios de gestor para redefinir palavras-passe de cooperantes.');
      return;
    }

    if (!formData.name || !targetEmail) {
      setErrorMsg('Por favor, preencha o Nome e o E-mail de Utilizador.');
      return;
    }

    // Verify duplicate emails when adding a new one
    if (!editingMember) {
      const emailExists = members.some(m => m.email.toLowerCase() === targetEmail);
      if (emailExists) {
        setErrorMsg('Erro: Este e-mail já está associado a outro utilizador deste consórcio.');
        return;
      }
    } else {
      const emailExists = members.some(m => m.email.toLowerCase() === targetEmail && m.id !== editingMember.id);
      if (emailExists) {
        setErrorMsg('Erro: Este e-mail já está associado a outro utilizador deste consórcio.');
        return;
      }
    }

    let updatedMembers: Member[] = [];
    let logDesc = '';

    if (editingMember) {
      // EDIT MODE
      updatedMembers = members.map((m) => {
        if (m.id === editingMember.id) {
          return {
            ...m,
            name: formData.name,
            email: targetEmail,
            phone: formData.phone,
            bankIban: formData.bankIban.trim(),
            role: formData.role,
            assignedMonth: Number(formData.assignedMonth),
            tempPassword: formData.tempPassword,
            permissions: {
              accessInicio: formData.accessInicio,
              accessDashboard: formData.accessDashboard,
              accessMembersList: formData.accessMembersList,
              accessCycles: formData.accessCycles,
              accessSocial: formData.accessSocial,
              accessAudit: formData.accessAudit,
              accessAdminModule: formData.accessAdminModule,
              accessReports: formData.accessReports,
              accessContracts: formData.accessContracts,
            }
          };
        }
        return m;
      });
      logDesc = `UTILIZADOR CONFIGURADO: O administrador editou e atualizou os dados do utilizador ${formData.name}. Nível de privilégio decretado: ${formData.role === 'admin' ? 'Administrador' : 'Membro com visualização regulada'}.`;
    } else {
      // ADD MODE
      const newId = members.length > 0 ? Math.max(...members.map(m => m.id)) + 1 : 1;
      const avatarColors = ['bg-emerald-600', 'bg-teal-600', 'bg-indigo-600', 'bg-sky-600', 'bg-amber-600', 'bg-purple-600', 'bg-pink-600'];
      const chosenColor = avatarColors[newId % avatarColors.length];

      const newMember: Member = {
        id: newId,
        name: formData.name,
        email: targetEmail,
        phone: formData.phone || '+244 900 000 000',
        bankIban: formData.bankIban.trim(),
        avatarColor: chosenColor,
        assignedMonth: Number(formData.assignedMonth),
        role: formData.role,
        tempPassword: formData.tempPassword,
        permissions: {
          accessInicio: formData.accessInicio,
          accessDashboard: formData.accessDashboard,
          accessMembersList: formData.accessMembersList,
          accessCycles: formData.accessCycles,
          accessSocial: formData.accessSocial,
          accessAudit: formData.accessAudit,
          accessAdminModule: formData.accessAdminModule,
          accessReports: formData.accessReports,
          accessContracts: formData.accessContracts,
        },
        contributions: {
          1: { paid: false },
          2: { paid: false },
          3: { paid: false },
          4: { paid: false },
          5: { paid: false },
          6: { paid: false }
        },
        benefits: {},
        socialSupportReceived: 0
      };

      updatedMembers = [...members, newMember];
      logDesc = `UTILIZADOR CRIADO: O administrador criou uma nova credencial para ${formData.name} (${targetEmail}). Senha provisória definida no módulo de segurança.`;
    }

    setMembers(updatedMembers);
    
    const isPasswordChanged = editingMember && editingMember.tempPassword !== formData.tempPassword;
    const newLog = {
      id: `user-mutated-${Date.now()}`,
      timestamp: new Date().toISOString(),
      type: (isPasswordChanged ? 'password_reset' : 'member_management') as any,
      amount: 0,
      description: isPasswordChanged 
        ? `REDEFINIÇÃO DE PALAVRA-PASSE: O administrador redefiniu a palavra-passe provisória de ${formData.name} para "${formData.tempPassword}".`
        : logDesc,
      month: Number(formData.assignedMonth) || 3
    };

    const updatedLogs = [newLog, ...logs];
    setLogs(updatedLogs);
    
    setIsSaving(true);
    saveState(updatedMembers, updatedLogs).then(() => {
      setIsSaving(false);
      setShowAddModal(false);
      setSuccessMsg(editingMember ? 'Dados do utilizador atualizados!' : 'Novo utilizador adicionado com sucesso!');
      setTimeout(() => setSuccessMsg(''), 3000);
    }).catch((err: any) => {
      setIsSaving(false);
      setErrorMsg("Falha ao salvar dados de utilizador: " + err);
    });
  };

  return (
    <div className={`space-y-6 ${theme === 'dark' ? 'text-slate-100' : 'text-slate-800'}`}>
      
      {/* Module Title Banner */}
      <div className={`p-6 rounded-2xl border transition-colors ${
        theme === 'dark' ? 'bg-[#151c2c] border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className={`text-xl font-bold font-display flex items-center gap-2 ${
              theme === 'dark' ? 'text-white' : 'text-slate-800'
            }`}>
              <Users className="w-5 h-5 text-teal-500" />
              Gestão de Utilizadores e Parâmetros
            </h2>
            <p className="text-xs text-slate-400">
              Gerencie credenciais institucionais, gerencie privilégios regulatórios, configure coordinates do fundo e estabeleça permissões refinadas.
            </p>
          </div>
          
          {activeSubTab === 'users' && (
            <button
              onClick={openAddFlow}
              className="flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl shadow-md shadow-teal-500/10 transition-all cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              Novo Utilizador
            </button>
          )}
        </div>

        {/* Nesting Sub-tabs inside banner for absolute structural elegance */}
        <div className="flex border-t border-slate-200/50 dark:border-slate-800/40 mt-5 pt-4 gap-4 sm:gap-6">
          <button
            type="button"
            onClick={() => setActiveSubTab('users')}
            className={`pb-1 text-xs font-black uppercase tracking-wider transition-all border-b-2 cursor-pointer ${
              activeSubTab === 'users'
                ? 'text-teal-500 border-teal-500 font-black'
                : 'text-slate-450 dark:text-slate-400 border-transparent hover:text-teal-400/80'
            }`}
          >
            👥 Contas de Utilizadores ({members.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('configurations')}
            className={`pb-1 text-xs font-black uppercase tracking-wider transition-all border-b-2 cursor-pointer ${
              activeSubTab === 'configurations'
                ? 'text-emerald-500 border-emerald-500 font-black'
                : 'text-slate-450 dark:text-slate-400 border-transparent hover:text-emerald-450/80'
            }`}
          >
            ⚙️ Parametria Estratégica do Consórcio
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs flex items-center gap-2 animate-pulse">
          <Check className="w-4 h-4" />
          <span>{successMsg}</span>
        </div>
      )}

      {activeSubTab === 'users' && (
        <>
          {/* FILTER AND SEARCH CONTROLS */}
          <div className={`p-4 rounded-xl border flex flex-col sm:flex-row gap-4 justify-between transition-colors ${
        theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
      }`}>
        {/* Search Searchbar */}
        <div className="relative flex-1 max-w-md">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            placeholder="Pesquisar por nome, email ou telefone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full text-xs pl-10 pr-4 py-2.5 rounded-xl border focus:outline-none focus:ring-1 focus:ring-teal-500 transition-all ${
              theme === 'dark'
                ? 'bg-slate-950 border-slate-800 text-slate-100 placeholder-slate-500'
                : 'bg-slate-50 border-slate-250 placeholder-slate-400'
            }`}
          />
        </div>

        {/* Roles Filter Selector */}
        <div className="flex items-center gap-2.5">
          <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Filtrar:</span>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className={`text-xs p-2.5 rounded-xl border focus:outline-none focus:ring-1 focus:ring-teal-500 ${
              theme === 'dark'
                ? 'bg-slate-950 border-slate-800 text-slate-200'
                : 'bg-white border-slate-250 text-slate-700'
            }`}
          >
            <option value="all">Todos os Níveis</option>
            <option value="admin">Administradores</option>
            <option value="membro">Membros de Consórcio</option>
          </select>
        </div>
      </div>

      {/* MAIN USERS DATABASE TABLE */}
      <div className={`border rounded-2xl overflow-hidden transition-colors ${
        theme === 'dark' ? 'bg-[#151c2c] border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className={`border-b text-[10.5px] font-bold uppercase tracking-wider ${
                theme === 'dark' ? 'bg-slate-900/60 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-100 text-slate-500'
              }`}>
                <th className="py-4 px-5">Utilizador</th>
                <th className="py-4 px-5">Privilégio</th>
                <th className="py-4 px-5">Mês Alocado</th>
                <th className="py-4 px-5">Senha Corrente</th>
                <th className="py-4 px-5">Níveis de Informação</th>
                <th className="py-4 px-5 text-right">Ações de Gestão</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {filteredMembers.map((m) => {
                const isAdmin = m.role === 'admin';
                return (
                  <tr 
                    key={m.id}
                    className={`text-slate-700 h-16 dark:text-slate-300 transition-colors ${
                      theme === 'dark' ? 'hover:bg-slate-900/40' : 'hover:bg-slate-50/50'
                    }`}
                  >
                    {/* User credentials */}
                    <td className="py-3 px-5">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl ${m.avatarColor || 'bg-teal-500'} flex items-center justify-center font-bold text-white text-xs shadow-sm`}>
                          {m.name ? m.name[0] : 'U'}
                        </div>
                        <div>
                          <span className={`text-xs font-bold block leading-tight ${theme === 'dark' ? 'text-white' : 'text-slate-850'}`}>
                            {m.name}
                          </span>
                          <div className="flex flex-col gap-1 mt-1">
                            <span className="text-[10px] text-slate-400 font-mono block leading-none">
                              {m.email}
                            </span>
                            <div className="flex items-center gap-1">
                              <span className="text-[9px] font-mono font-extrabold leading-none bg-sky-500/10 text-sky-600 dark:text-sky-450 border border-sky-500/20 px-1 py-0.5 rounded uppercase select-all" title="ID de Cadastro">
                                ID: {getMemberDisplayCode(m.id)}
                              </span>
                              <span className="text-[8px] font-mono font-normal leading-none text-slate-400 dark:text-slate-500 uppercase select-all" title="Complemento Hash">
                                HASH: {getMemberIdCode(m.name, m.phone)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Permission status badge */}
                    <td className="py-3 px-5">
                      {isAdmin ? (
                        <span className="text-[9px] font-bold bg-amber-500/15 border border-amber-500/30 text-amber-500 dark:text-amber-400 px-2 py-1 rounded-md uppercase tracking-wider flex items-center gap-1 w-fit">
                          <Shield className="w-3 h-3 text-amber-500" />
                          Administrador
                        </span>
                      ) : (
                        <span className="text-[9px] font-bold bg-emerald-500/10 border border-emerald-500/25 text-emerald-600 dark:text-emerald-400 px-2 py-1 rounded-md uppercase tracking-wider flex items-center gap-1 w-fit">
                          <UserCheck className="w-3 h-3 text-emerald-500" />
                          Membro
                        </span>
                      )}
                    </td>

                    {/* Assigned cycle */}
                    <td className="py-3 px-5 font-mono text-xs font-bold">
                      Mês 0{m.assignedMonth}
                    </td>

                    {/* Current credential key */}
                    <td className="py-3 px-5">
                      <div className="flex items-center gap-1 font-mono text-xs font-semibold max-w-[130px] truncate bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded px-2 py-1 w-fit">
                        <Lock className="w-3 h-3 text-slate-400" />
                        <span>{m.tempPassword || 'membro123'}</span>
                      </div>
                    </td>

                    {/* Conceded Access Levels */}
                    <td className="py-3 px-5">
                      <div className="flex flex-wrap gap-1 max-w-[240px]">
                        <span className="text-[9px] font-medium bg-slate-150 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-1.5 py-0.5 rounded">
                          Info: {isAdmin ? 'Total' : 'Restrito'}
                        </span>
                        <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded ${
                          isAdmin || m.id % 2 === 0
                            ? 'bg-blue-500/10 text-blue-500'
                            : 'bg-rose-500/5 text-rose-400 line-through'
                        }`}>
                          Livro Audit
                        </span>
                        <span className="text-[9px] font-medium bg-teal-550/10 text-teal-500 px-1.5 py-0.5 rounded">
                          Upload Recibo
                        </span>
                      </div>
                    </td>

                    {/* Actions dropdown */}
                    <td className="py-3 px-5 text-right">
                      <div className="flex items-center justify-end gap-2.5">
                        <button
                          onClick={() => openEditFlow(m)}
                          className={`p-1.5 rounded-lg border transition-all text-xs flex items-center justify-center cursor-pointer ${
                            theme === 'dark'
                              ? 'bg-slate-900 border-slate-800 hover:bg-slate-800 text-teal-400'
                              : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-600'
                          }`}
                          title="Editar Utilizador"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(m.id, m.email)}
                          className={`p-1.5 rounded-lg border transition-all text-xs flex items-center justify-center cursor-pointer ${
                            theme === 'dark'
                              ? 'bg-slate-900 border-slate-800 hover:bg-red-950/40 text-rose-500 border-rose-950/50'
                              : 'bg-white border-slate-200 hover:bg-rose-50 text-rose-600'
                          }`}
                          title="Eliminar Utilizador"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredMembers.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-400 text-xs">
                    Nenhum utilizador encontrado para os filtros ativos.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
        </>
      )}

      {/* CARD CONFIGURAÇÕES GLOBAIS DA PLATAFORMA (EDITÁVEL PELO ADMINISTRADOR) */}
      {activeSubTab === 'configurations' && (
        <div className={`p-6 rounded-2xl border transition-colors ${
          theme === 'dark' ? 'bg-[#1e293b]/40 border-slate-800' : 'bg-white border-slate-200'
        }`}>
        <div className="flex items-center gap-2 mb-4 border-b pb-3 border-dashed border-slate-200 dark:border-slate-800">
          <Database className="w-4 h-4 text-emerald-500" />
          <div className="flex-1">
            <h3 className={`font-display font-black text-xs uppercase tracking-wider ${
              theme === 'dark' ? 'text-white' : 'text-slate-800'
            }`}>
              Administração Estratégica do Consórcio (Configurações Gerais & Painel Visual)
            </h3>
            <p className="text-[10px] text-slate-400 mt-0.5">
              Esta configuração permite ao Administrador gerir as coordenadas bancárias de recepção global, os contatos operacionais e personalizar a visualização de gráficos e comunicados do painel principal para todos os membros.
            </p>
          </div>
        </div>

        {appConfigSuccess && (
          <div className="mb-4 bg-emerald-500/10 border border-emerald-500/25 text-emerald-600 dark:text-emerald-400 text-[11px] p-3 rounded-lg flex items-center gap-2 font-semibold">
            <Check className="w-4 h-4 shrink-0" />
            {appConfigSuccess}
          </div>
        )}

        <form onSubmit={handleSaveAppConfig} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-slate-500 dark:text-slate-400 font-bold mb-1 uppercase tracking-wider text-[9px]">
                IBAN de Depósito da Plataforma
              </label>
              <input
                type="text"
                required
                placeholder="Ex: AO06 0040 ..."
                value={appBankIban}
                onChange={(e) => setAppBankIban(e.target.value)}
                className={`w-full text-xs p-2.5 rounded-lg border focus:outline-none focus:border-emerald-500 font-mono uppercase ${
                  theme === 'dark' ? 'bg-slate-950 border-slate-800 text-white animate-pulse-once' : 'bg-slate-50 border-slate-200 text-slate-700'
                }`}
              />
            </div>
            
            <div>
              <label className="block text-slate-500 dark:text-slate-400 font-bold mb-1 uppercase tracking-wider text-[9px]">
                Telefone Oficial do Fundo (Contacto)
              </label>
              <input
                type="text"
                required
                placeholder="Ex: +244 923 000 000"
                value={appPhone}
                onChange={(e) => setAppPhone(e.target.value)}
                className={`w-full text-xs p-2.5 rounded-lg border focus:outline-none focus:border-emerald-500 font-mono ${
                  theme === 'dark' ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-700'
                }`}
              />
            </div>

            <div>
              <label className="block text-slate-500 dark:text-slate-400 font-bold mb-1 uppercase tracking-wider text-[9px]">
                E-mail de Apoio (Suporte do Fundo)
              </label>
              <input
                type="email"
                required
                placeholder="Ex: suporte@kixfundo.ao"
                value={appEmail}
                onChange={(e) => setAppEmail(e.target.value)}
                className={`w-full text-xs p-2.5 rounded-lg border focus:outline-none focus:border-emerald-500 ${
                  theme === 'dark' ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-700'
                }`}
              />
            </div>
          </div>

          <div className="border-t border-dashed border-slate-200 dark:border-slate-800 pt-4 grid grid-cols-1 md:grid-cols-12 gap-5">
            <div className="md:col-span-6">
              <label className="block text-slate-500 dark:text-slate-400 font-semibold mb-1 uppercase tracking-wider text-[9px]">
                📣 Comunicado de Destaque no Painel Cooperativo
              </label>
              <textarea
                rows={2}
                value={customMsg}
                onChange={(e) => setCustomMsg(e.target.value)}
                placeholder="Escreva uma instrução ou mensagem de destaque para todos os membros cooperantes..."
                className={`w-full text-xs p-2.5 rounded-xl border focus:outline-none focus:border-emerald-500 ${
                  theme === 'dark' ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-700'
                }`}
              />
            </div>

            <div className="md:col-span-3">
              <label className="block text-slate-500 dark:text-slate-400 font-semibold mb-1.5 uppercase tracking-wider text-[9px]">
                Selecção dos Gráficos Ativos
              </label>
              <div className="space-y-2 mt-1">
                <label className="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-300 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={showFlowChart}
                    onChange={(e) => setShowFlowChart(e.target.checked)}
                    className="rounded border-slate-300 dark:border-slate-800 text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                  />
                  <span>Evolução Fluxo (Barras)</span>
                </label>
                <label className="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-300 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={showAllocationChart}
                    onChange={(e) => setShowAllocationChart(e.target.checked)}
                    className="rounded border-slate-300 dark:border-slate-800 text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                  />
                  <span>Alocação Caixa (Donut)</span>
                </label>
              </div>
            </div>

            <div className="md:col-span-3">
              <label className="block text-slate-500 dark:text-slate-400 font-semibold mb-1 uppercase tracking-wider text-[9px]">
                🎨 Cores nos Gráficos
              </label>
              <select
                value={chartColorTheme}
                onChange={(e) => setChartColorTheme(e.target.value as any)}
                className={`w-full text-xs p-2.5 rounded-xl border focus:outline-none focus:border-emerald-500 ${
                  theme === 'dark' ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-700'
                }`}
              >
                <option value="teal">Esmeralda / Menta (Teal)</option>
                <option value="indigo">Azul Monárquico (Indigo)</option>
                <option value="coral">Coral Tropical (Coral)</option>
                <option value="amber">Warm Amber / Safira (Amber)</option>
              </select>
            </div>
          </div>

          {/* SECÇÃO EXTRA: PARAMETRIA VISUAL E TIPOGRÁFICA */}
          <div className="border-t border-dashed border-slate-200 dark:border-slate-800 pt-4">
            <h3 className="text-slate-500 dark:text-slate-400 font-bold mb-3 uppercase tracking-wider text-[10px]">
              🎨 Customização de Tipografia, Escala e Temas Visuais (Layout do Portal)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-slate-500 dark:text-slate-400 font-semibold mb-1 uppercase tracking-wider text-[9px]">
                  Tipo de Letra (Font Family)
                </label>
                <select
                  value={fontFamily}
                  onChange={(e) => setFontFamily(e.target.value as any)}
                  className={`w-full text-xs p-2.5 rounded-xl border focus:outline-none focus:border-emerald-500 ${
                    theme === 'dark' ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-700'
                  }`}
                >
                  <option value="inter">Inter (Moderno & Neutro)</option>
                  <option value="outfit">Outfit (Geométrico & Elegante)</option>
                  <option value="mono">JetBrains Mono (Técnico / Dados)</option>
                  <option value="playfair">Playfair Display (Serifado Editorial)</option>
                  <option value="space">Space Grotesk (Neo-Grotesco Ativo)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-500 dark:text-slate-400 font-semibold mb-1 uppercase tracking-wider text-[9px]">
                  Tamanho Global das Letras (Escala Geral)
                </label>
                <select
                  value={fontSize}
                  onChange={(e) => setFontSize(e.target.value as any)}
                  className={`w-full text-xs p-2.5 rounded-xl border focus:outline-none focus:border-emerald-500 ${
                    theme === 'dark' ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-700'
                  }`}
                >
                  <option value="compact">Compacto (14px)</option>
                  <option value="normal">Normal do Sistema (16px)</option>
                  <option value="medium">Médio / Visível (18px)</option>
                  <option value="large">Grande (20px)</option>
                  <option value="xlarge">Extra Grande / Acessibilidade (22px)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-500 dark:text-slate-400 font-semibold mb-1 uppercase tracking-wider text-[9px]">
                  Paleta de Cores de Destaque (Accent/Primary Theme)
                </label>
                <select
                  value={primaryColorTheme}
                  onChange={(e) => setPrimaryColorTheme(e.target.value as any)}
                  className={`w-full text-xs p-2.5 rounded-xl border focus:outline-none focus:border-emerald-500 ${
                    theme === 'dark' ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-700'
                  }`}
                >
                  <option value="emerald">Esmeralda Original (Emerald-Green)</option>
                  <option value="indigo">Azul Imperial (Cobalt Indigo)</option>
                  <option value="teal">Verde Marinho / Turquesa (Teal-Menta)</option>
                  <option value="coral">Laranja Tangerina / Coral (Vibrante)</option>
                  <option value="amber">Warm Amber / Safira Dourada (Amber)</option>
                  <option value="violet">Roxo Púrpura (Violet-Royale)</option>
                  <option value="slate">Cinza Industrial (Slate Carbon)</option>
                  <option value="bordeaux">Bourdeaux Clássico (Vinho Tinto #77181e)</option>
                  <option value="royal_plum">Royale Plum (Ameixa Velvet #2a044a)</option>
                  <option value="fire_coral">Fire Coral (Laranja Fogo #e84b2c)</option>
                  <option value="dark_zinc">Cimento Grafite (Dark Zinc #2f2e30)</option>
                  <option value="solid_navy">Azul Marinho Sólido (Navy #092b5a)</option>
                  <option value="sky_frost">Azul de Gelo Glacial (Sky Frost #abe4ff)</option>
                  <option value="ocean_teal">Teal do Oceano Profundo (#09738a)</option>
                </select>
              </div>
            </div>
          </div>

          {/* SECÇÃO EXTRA: PRIVILÉGIOS REGULATÓRIOS DO ADMINISTRADOR */}
          <div className="border-t border-dashed border-slate-200 dark:border-slate-800 pt-4">
            <h3 className="text-slate-500 dark:text-slate-400 font-bold mb-3 uppercase tracking-wider text-[10px]">
              🔒 Privilégios Regulatórios & Segurança do Administrador
            </h3>
            <div className="bg-slate-50 dark:bg-slate-950/40 p-4 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
              <p className="text-[10px] text-slate-600 dark:text-slate-400 mb-3 italic leading-relaxed">
                Determine as restrições e políticas autoritativas da sua sessão como administrador para mitigar cliques acidentais e erros regulatórios durante o ciclo de poupança.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <label className="flex items-start gap-2 text-xs text-slate-500 dark:text-slate-300 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={adminPrivilegeCanDelete}
                    onChange={(e) => setAdminPrivilegeCanDelete(e.target.checked)}
                    className="rounded border-slate-300 dark:border-slate-800 text-emerald-600 focus:ring-emerald-500 w-4 h-4 mt-0.5"
                  />
                  <div>
                    <span className="font-semibold block text-slate-700 dark:text-slate-200">Excluir Cooperantes</span>
                    <span className="text-[9px] text-slate-600 dark:text-slate-400 block mt-0.5">Permite ou impede que administradores eliminem permanentemente a conta de um membro da cooperativa.</span>
                  </div>
                </label>

                <label className="flex items-start gap-2 text-xs text-slate-500 dark:text-slate-300 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={adminPrivilegeCanRefund}
                    onChange={(e) => setAdminPrivilegeCanRefund(e.target.checked)}
                    className="rounded border-slate-300 dark:border-slate-800 text-emerald-600 focus:ring-emerald-500 w-4 h-4 mt-0.5"
                  />
                  <div>
                    <span className="font-semibold block text-slate-700 dark:text-slate-200">Estorno de Quotas</span>
                    <span className="text-[9px] text-slate-600 dark:text-slate-400 block mt-0.5">Autoriza ou bloqueia o cancelamento ou estorno de pagamentos efetuados pelo painel.</span>
                  </div>
                </label>

                <label className="flex items-start gap-2 text-xs text-slate-500 dark:text-slate-300 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={adminPrivilegeCanForcePayout}
                    onChange={(e) => setAdminPrivilegeCanForcePayout(e.target.checked)}
                    className="rounded border-slate-300 dark:border-slate-800 text-emerald-600 focus:ring-emerald-500 w-4 h-4 mt-0.5"
                  />
                  <div>
                    <span className="font-semibold block text-slate-700 dark:text-slate-200">Forçar Contemplação</span>
                    <span className="text-[9px] text-slate-600 dark:text-slate-400 block mt-0.5">Permite executar a liquidação de 1.200.000,00 KZs mesmo se faltarem cotas de contribuição mensal pendentes.</span>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* SECÇÃO EXTRA: PARAMETRIA E TEMPLATES DE CONTRATO JURÍDICO (COOPNET-STANDARDS) */}
          <div className="border-t border-dashed border-slate-200 dark:border-slate-800 pt-4">
            <h3 className="text-slate-500 dark:text-slate-400 font-bold mb-1 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
              📜 Gestão Regulatória e Configuração do Template de Contrato
            </h3>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 mb-4 leading-relaxed leading-normal">
              Configure as cláusulas gerais do contrato para faturamento de juros ordinários, moratórios de atraso (multas) e termos de recepção de garantias colaterais. O sistema gerará dinamicamente os novos contratos usando as definições oficiais de políticas vigentes parametrizadas abaixo.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-2 text-left">
              <div className="space-y-4">
                <div>
                  <label className="block text-slate-505 dark:text-slate-350 font-bold mb-1 uppercase tracking-wider text-[9px] flex items-center gap-1">
                    💸 Cláusula de Juros (Cláusula Segunda)
                  </label>
                  <textarea
                    rows={4}
                    value={contractClauseJuros}
                    onChange={(e) => setContractClauseJuros(e.target.value)}
                    placeholder="Texto regulatório para cálculo e amortização de juro cooperativo..."
                    className={`w-full text-xs p-2.5 rounded-xl border focus:outline-none focus:border-emerald-500 leading-normal ${
                      theme === 'dark' ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-100 border-slate-200 text-slate-750'
                    }`}
                  />
                  <span className="text-[8px] text-slate-405 dark:text-slate-505 block mt-1">Macros válidas: <code className="font-mono">{`{PRAZO_MESES}, {TAXA_JUROS}, {MENSALIDADE}, {DATA_PRIMEIRA_PARCELA}`}</code></span>
                </div>

                <div>
                  <label className="block text-slate-550 dark:text-slate-350 font-bold mb-1 uppercase tracking-wider text-[9px]">
                    ⚠️ Cláusula de Multas e Mora (Cláusula Quarta)
                  </label>
                  <textarea
                    rows={3}
                    value={contractClauseMultas}
                    onChange={(e) => setContractClauseMultas(e.target.value)}
                    placeholder="Regulamentação jurídica sobre atrasos de parcelas e juros moratórios diários..."
                    className={`w-full text-xs p-2.5 rounded-xl border focus:outline-none focus:border-emerald-500 leading-normal ${
                      theme === 'dark' ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-100 border-slate-200 text-slate-750'
                    }`}
                  />
                  <span className="text-[8px] text-slate-405 dark:text-slate-505 block mt-1">Texto oficial de penalidade em caso de insolvência ou atrasos.</span>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-slate-550 dark:text-slate-350 font-bold mb-1 uppercase tracking-wider text-[9px]">
                    🔐 Cláusula de Garantias de Penhor (Cláusula Terceira)
                  </label>
                  <textarea
                    rows={4}
                    value={contractClauseGarantias}
                    onChange={(e) => setContractClauseGarantias(e.target.value)}
                    placeholder="Disposições regulatórias, penhor e direito de adjudicação de bens colaterais de penhor..."
                    className={`w-full text-xs p-2.5 rounded-xl border focus:outline-none focus:border-emerald-500 leading-normal ${
                      theme === 'dark' ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-100 border-slate-200 text-slate-750'
                    }`}
                  />
                  <span className="text-[8px] text-slate-405 dark:text-slate-505 block mt-1">Macros válidas: <code className="font-mono">{`{GARANTIAS}`}</code></span>
                </div>

                <div>
                  <label className="block text-slate-550 dark:text-slate-350 font-bold mb-1 uppercase tracking-wider text-[9px]">
                    📊 Layout Estrutural Inteiro do Contrato (Minuta Geral)
                  </label>
                  <textarea
                    rows={3}
                    value={contractTemplateWhole}
                    onChange={(e) => setContractTemplateWhole(e.target.value)}
                    placeholder="Minuta completa contendo os cabeçalhos e as demais cláusulas..."
                    className={`w-full text-xs p-2.5 rounded-xl border focus:outline-none focus:border-emerald-500 leading-normal font-mono text-[10px] ${
                      theme === 'dark' ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-100 border-slate-200 text-slate-755'
                    }`}
                  />
                  <span className="text-[8px] text-slate-405 dark:text-slate-505 block mt-1">Espaços reservados: <code className="font-mono">{`{CLAUSULA_JUROS}, {CLAUSULA_GARANTIAS}, {CLAUSULA_MULTAS}`}</code>, além de macros como <code className="font-mono">{`{REPRESENTANTE}, {BENEFICIARIO}, {DOCUMENTO_ID}, {TELEFONE}, {EMAIL}, {VALOR_EMPRESTIMO}`}</code></span>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-dashed border-slate-200 dark:border-slate-800 pt-4 flex justify-end">
            <button
              type="submit"
              disabled={isSavingConfig}
              className={`px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-500/15 cursor-pointer transition-all active:scale-98 flex items-center gap-2 ${isSavingConfig ? 'opacity-80 cursor-not-allowed' : ''}`}
            >
              {isSavingConfig ? (
                <>
                  <div className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  <span>A Gravar Parâmetros...</span>
                </>
              ) : (
                <span>Gravar Parâmetros Estratégicos & Privilégios do Administrador</span>
              )}
            </button>
          </div>
        </form>
      </div>
      )}

      {/* CREATE & EDIT OVERLAY MODAL */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`border rounded-2xl shadow-xl max-w-lg w-full overflow-hidden flex flex-col ${
                theme === 'dark' ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-150 text-slate-700'
              }`}
            >
              {/* Header */}
              <div className={`p-5 border-b flex items-center justify-between ${
                theme === 'dark' ? 'border-slate-800' : 'border-slate-100'
              }`}>
                <span className={`font-black uppercase text-xs tracking-wider flex items-center gap-1.5 ${
                  theme === 'dark' ? 'text-white' : 'text-slate-800'
                }`}>
                  <UserCheck className="w-4 h-4 text-teal-500" />
                  {editingMember ? 'Editar Painel de Utilizador' : 'Adicionar Novo Utilizador'}
                </span>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="text-slate-400 hover:text-slate-600 font-bold"
                >
                  ✕
                </button>
              </div>

              {/* Form Content body */}
              <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto max-h-[75vh]">
                
                {errorMsg && (
                  <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-lg text-xs">
                    {errorMsg}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Name */}
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Nome do Utilizador *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Manuel dos Santos"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className={`w-full text-xs p-2.5 rounded-lg border focus:outline-none focus:border-teal-500 ${
                        theme === 'dark' 
                          ? 'bg-slate-950 border-slate-800 text-white' 
                          : 'bg-slate-50 border-slate-200'
                      }`}
                    />
                  </div>

                  {/* Email */}
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Email Institucional *
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="Ex: manuel@kixfundo.ao"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className={`w-full text-xs p-2.5 rounded-lg border focus:outline-none focus:border-teal-500 ${
                        theme === 'dark' 
                          ? 'bg-slate-950 border-slate-800 text-white' 
                          : 'bg-slate-50 border-slate-200'
                      }`}
                    />
                  </div>

                  {/* Phone */}
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Telefone (Contacto)
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: +244 923 000 000"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className={`w-full text-xs p-2.5 rounded-lg border focus:outline-none focus:border-teal-500 ${
                        theme === 'dark' 
                          ? 'bg-slate-950 border-slate-800 text-white' 
                          : 'bg-slate-50 border-slate-200'
                      }`}
                    />
                  </div>

                  {/* Temp Password */}
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Senha de Acesso (Segurança)
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Senha provisória"
                      value={formData.tempPassword}
                      onChange={(e) => setFormData({ ...formData, tempPassword: e.target.value })}
                      className={`w-full text-xs p-2.5 rounded-lg border focus:outline-none focus:border-teal-500 font-mono ${
                        theme === 'dark' 
                          ? 'bg-slate-950 border-slate-800 text-white' 
                          : 'bg-slate-50 border-slate-200'
                      }`}
                    />
                  </div>
                </div>

                {/* Coordenadas Bancárias (IBAN) */}
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                    <span>Coordenadas Bancárias (IBAN)</span>
                    <span className="text-[9px] text-slate-400 font-normal normal-case">Para recebimento de contemplações</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: AO06 0040 0000 1234 5678 1011 2"
                    value={formData.bankIban}
                    onChange={(e) => setFormData({ ...formData, bankIban: e.target.value })}
                    className={`w-full text-xs p-2.5 rounded-lg border focus:outline-none focus:border-teal-500 font-mono uppercase ${
                      theme === 'dark' 
                        ? 'bg-slate-950 border-slate-800 text-white' 
                        : 'bg-slate-50 border-slate-200'
                    }`}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Nível de Acesso Principal (Role) */}
                  <div className="space-y-1 flex flex-col justify-start">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Nível de Privilégio
                    </label>
                    <select
                      disabled={currentUserEmail.trim().toLowerCase() !== 'lmendesvictor@gmail.com'}
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value as 'admin' | 'membro' })}
                      className={`w-full text-xs p-2.5 rounded-lg border focus:outline-none focus:border-teal-500 disabled:opacity-70 disabled:cursor-not-allowed ${
                        theme === 'dark' 
                          ? 'bg-slate-950 border-slate-800 text-white' 
                          : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <option value="membro">Membro (Visualização Restrita)</option>
                      <option value="admin">Administrador (Controle de Operações)</option>
                    </select>
                  </div>

                  {/* Allocated Month */}
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Mês de Contemplação Programada
                    </label>
                    <select
                      value={formData.assignedMonth}
                      onChange={(e) => setFormData({ ...formData, assignedMonth: e.target.value })}
                      className={`w-full text-xs p-2.5 rounded-lg border focus:outline-none focus:border-teal-500 ${
                        theme === 'dark' 
                          ? 'bg-slate-950 border-slate-800 text-white' 
                          : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <option value="1">Mês 01 (Março)</option>
                      <option value="2">Mês 02 (Abril)</option>
                      <option value="3">Mês 03 (Maio)</option>
                      <option value="4">Mês 04 (Junho)</option>
                      <option value="5">Mês 05 (Julho)</option>
                      <option value="6">Mês 06 (Agosto)</option>
                    </select>
                  </div>
                </div>

                {/* DETAILED INFORMATION ACCESS LEVELS - "CONCEDER NIVEIS DE ACESSO AS INFORMACOES" */}
                {(() => {
                  const isSuperAdmin = currentUserEmail.trim().toLowerCase() === 'lmendesvictor@gmail.com';
                  return (
                    <div className={`p-4 rounded-xl border space-y-3.5 ${
                      theme === 'dark' ? 'bg-slate-950/45 border-slate-800/80' : 'bg-slate-50 border-slate-150'
                    }`}>
                      <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400">
                        <Lock className="w-3.5 h-3.5" />
                        <span>🔑 Controlo de Outorga de Acessos aos Módulos</span>
                      </div>

                      {!isSuperAdmin && (
                        <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[10px] text-amber-600 dark:text-amber-400 font-medium leading-relaxed">
                          ⚠️ <strong>Apenas Leitura:</strong> Só o Super-Administrador <strong>lmendesvictor</strong> possui prerrogativas regulatórias para conceder ou modificar permissões de acesso ao sistema.
                        </div>
                      )}
                      
                      <div className="grid grid-cols-1 gap-2 pt-1 text-xs">
                        {/* accessInicio */}
                        <label className={`flex items-start gap-2.5 ${isSuperAdmin ? 'cursor-pointer' : 'cursor-not-allowed opacity-75'}`}>
                          <input
                            type="checkbox"
                            disabled={!isSuperAdmin}
                            checked={formData.accessInicio}
                            onChange={(e) => setFormData({ ...formData, accessInicio: e.target.checked })}
                            className="rounded border-slate-350 text-teal-600 focus:ring-teal-500 mt-0.5"
                          />
                          <div>
                            <span className="font-bold text-slate-700 dark:text-slate-200 block">Acesso ao Módulo 'Início'</span>
                            <span className="text-[10px] text-slate-400">Permite ver as boas-vindas do consórcio rotativo.</span>
                          </div>
                        </label>

                        {/* accessDashboard */}
                        <label className={`flex items-start gap-2.5 ${isSuperAdmin ? 'cursor-pointer' : 'cursor-not-allowed opacity-75'}`}>
                          <input
                            type="checkbox"
                            disabled={!isSuperAdmin}
                            checked={formData.accessDashboard}
                            onChange={(e) => setFormData({ ...formData, accessDashboard: e.target.checked })}
                            className="rounded border-slate-350 text-teal-600 focus:ring-teal-500 mt-0.5"
                          />
                          <div>
                            <span className="font-bold text-slate-700 dark:text-slate-200 block">Painel Geral & Gráficos (Dashboard)</span>
                            <span className="text-[10px] text-slate-400">Dá acesso aos gráficos de distribuição financeira e conciliação de saldos fiscais.</span>
                          </div>
                        </label>

                        {/* accessMembersList */}
                        <label className={`flex items-start gap-2.5 ${isSuperAdmin ? 'cursor-pointer' : 'cursor-not-allowed opacity-75'}`}>
                          <input
                            type="checkbox"
                            disabled={!isSuperAdmin}
                            checked={formData.accessMembersList}
                            onChange={(e) => setFormData({ ...formData, accessMembersList: e.target.checked })}
                            className="rounded border-slate-350 text-teal-600 focus:ring-teal-500 mt-0.5"
                          />
                          <div>
                            <span className="font-bold text-slate-700 dark:text-slate-200 block">Lista de Cadastro (Cooperados)</span>
                            <span className="text-[10px] text-slate-400">Habilita visualização da tabela de membros ativos para quotas.</span>
                          </div>
                        </label>

                        {/* accessCycles */}
                        <label className={`flex items-start gap-2.5 ${isSuperAdmin ? 'cursor-pointer' : 'cursor-not-allowed opacity-75'}`}>
                          <input
                            type="checkbox"
                            disabled={!isSuperAdmin}
                            checked={formData.accessCycles}
                            onChange={(e) => setFormData({ ...formData, accessCycles: e.target.checked })}
                            className="rounded border-slate-350 text-teal-600 focus:ring-teal-500 mt-0.5"
                          />
                          <div>
                            <span className="font-bold text-slate-700 dark:text-slate-200 block">Quadro de Pagamentos e Ciclos</span>
                            <span className="text-[10px] text-slate-400">Permite registar e auditar lançamentos de saídas/ajustes mensais.</span>
                          </div>
                        </label>

                        {/* accessSocial */}
                        <label className={`flex items-start gap-2.5 ${isSuperAdmin ? 'cursor-pointer' : 'cursor-not-allowed opacity-75'}`}>
                          <input
                            type="checkbox"
                            disabled={!isSuperAdmin}
                            checked={formData.accessSocial}
                            onChange={(e) => setFormData({ ...formData, accessSocial: e.target.checked })}
                            className="rounded border-slate-350 text-teal-600 focus:ring-teal-500 mt-0.5"
                          />
                          <div>
                            <span className="font-bold text-slate-700 dark:text-slate-200 block">Fundo de Interajuda Coletiva</span>
                            <span className="text-[10px] text-slate-400">Permite amparar urgências sociais de saúde ou amparo solidário.</span>
                          </div>
                        </label>

                        {/* accessAudit */}
                        <label className={`flex items-start gap-2.5 ${isSuperAdmin ? 'cursor-pointer' : 'cursor-not-allowed opacity-75'}`}>
                          <input
                            type="checkbox"
                            disabled={!isSuperAdmin}
                            checked={formData.accessAudit}
                            onChange={(e) => setFormData({ ...formData, accessAudit: e.target.checked })}
                            className="rounded border-slate-350 text-teal-600 focus:ring-teal-500 mt-0.5"
                          />
                          <div>
                            <span className="font-bold text-slate-700 dark:text-slate-200 block">Balancetes e Livro de Registos (Ledger)</span>
                            <span className="text-[10px] text-slate-400">Exibe os fluxos com identificações de actas imutáveis (DEP, AJUDA, PAG, CRED).</span>
                          </div>
                        </label>

                        {/* accessReports */}
                        <label className={`flex items-start gap-2.5 ${isSuperAdmin ? 'cursor-pointer' : 'cursor-not-allowed opacity-75'}`}>
                          <input
                            type="checkbox"
                            disabled={!isSuperAdmin}
                            checked={formData.accessReports}
                            onChange={(e) => setFormData({ ...formData, accessReports: e.target.checked })}
                            className="rounded border-slate-350 text-teal-600 focus:ring-teal-500 mt-0.5"
                          />
                          <div>
                            <span className="font-bold text-slate-700 dark:text-slate-200 block">Mapeamento de Balancete Bancário BIC</span>
                            <span className="text-[10px] text-slate-400">Acesso às conciliações oficiais e PDF de extratos do cooperante.</span>
                          </div>
                        </label>

                        {/* accessContracts */}
                        <label className={`flex items-start gap-2.5 ${isSuperAdmin ? 'cursor-pointer' : 'cursor-not-allowed opacity-75'}`}>
                          <input
                            type="checkbox"
                            disabled={!isSuperAdmin}
                            checked={formData.accessContracts}
                            onChange={(e) => setFormData({ ...formData, accessContracts: e.target.checked })}
                            className="rounded border-slate-350 text-teal-600 focus:ring-teal-500 mt-0.5"
                          />
                          <div>
                            <span className="font-bold text-slate-700 dark:text-slate-200 block">Amortização & Contratos de Microcréditos</span>
                            <span className="text-[10px] text-slate-400">Ver e registar novos créditos emitidos com amortizações automáticas (CRED).</span>
                          </div>
                        </label>

                        {/* accessAdminModule */}
                        <label className={`flex items-start gap-2.5 ${isSuperAdmin ? 'cursor-pointer' : 'cursor-not-allowed opacity-75'}`}>
                          <input
                            type="checkbox"
                            disabled={!isSuperAdmin}
                            checked={formData.accessAdminModule}
                            onChange={(e) => setFormData({ ...formData, accessAdminModule: e.target.checked })}
                            className="rounded border-slate-350 text-teal-600 focus:ring-teal-500 mt-0.5"
                          />
                          <div>
                            <span className="font-bold text-slate-700 dark:text-slate-200 block">Gestão Estratégica e Configurações (Admin)</span>
                            <span className="text-[10px] text-slate-400">Parâmetros operacionais globais, comunicados e regras de quotas.</span>
                          </div>
                        </label>
                      </div>
                    </div>
                  );
                })()}

                 {/* Footer buttons */}
                <div className={`flex justify-end gap-3 pt-3 border-t ${
                  theme === 'dark' ? 'border-slate-800' : 'border-slate-100'
                }`}>
                  <button
                    type="button"
                    disabled={isSaving}
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-300 rounded-xl text-xs hover:bg-slate-200 font-bold cursor-pointer disabled:opacity-55 disabled:cursor-not-allowed"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-4.5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-md shadow-teal-500/10 cursor-pointer flex items-center gap-1.5 disabled:opacity-80 disabled:cursor-not-allowed"
                  >
                    {isSaving ? (
                      <>
                        <div className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                        <span>A gravar...</span>
                      </>
                    ) : (
                      <span>{editingMember ? 'Gravar Alterações' : 'Criar Utilizador'}</span>
                    )}
                  </button>
                </div>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

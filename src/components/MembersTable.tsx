import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  UserPlus, 
  Trash2, 
  Edit3, 
  UserCheck, 
  ShieldCheck, 
  Mail, 
  Phone, 
  Info, 
  Upload, 
  Camera, 
  Check, 
  AlertCircle,
  X,
  Eye
} from 'lucide-react';
import { Member, getMemberIdCode, getMemberDisplayCode } from '../types';

interface MembersTableProps {
  currentMonth: number;
  members: Member[];
  onToggleContribution: (memberId: number) => void;
  beneficiariesIds: number[];
  setMembers: React.Dispatch<React.SetStateAction<Member[]>>;
  saveState: (newMembers: Member[], newLogs: any[]) => any;
  logs: any[];
  setLogs: React.Dispatch<React.SetStateAction<any[]>>;
  theme?: string;
  currentUser?: any;
  onSimulateMember?: (memberId: number) => void;
}

const AVATAR_COLORS = [
  'bg-emerald-600',
  'bg-teal-600',
  'bg-indigo-600',
  'bg-sky-600',
  'bg-amber-600',
  'bg-rose-600',
  'bg-purple-600',
  'bg-blue-600',
  'bg-cyan-600',
  'bg-orange-600',
  'bg-pink-600',
  'bg-violet-600',
];

export default function MembersTable({
  currentMonth,
  members,
  onToggleContribution,
  beneficiariesIds,
  setMembers,
  saveState,
  logs,
  setLogs,
  theme = 'light',
  currentUser,
  onSimulateMember,
}: MembersTableProps) {
  const [isAdminMode, setIsAdminMode] = useState<boolean>(currentUser?.role === 'admin');
  const [showFormModal, setShowFormModal] = useState<boolean>(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);

  React.useEffect(() => {
    setIsAdminMode(currentUser?.role === 'admin');
  }, [currentUser]);

  // Search & Filters State
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'membro'>('all');
  const [paymentFilter, setPaymentFilter] = useState<'all' | 'paid' | 'pending'>('all');
  const [monthFilter, setMonthFilter] = useState<string>('all');

  // Form State
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('+244 ');
  const [email, setEmail] = useState('');
  const [bankIban, setBankIban] = useState('');
  const [role, setRole] = useState<'admin' | 'membro'>('membro');
  const [tempPassword, setTempPassword] = useState('membro123');
  const [assignedMonth, setAssignedMonth] = useState<number>(3);
  const [currentMonthState, setCurrentMonthState] = useState<'pending' | 'paid'>('pending');
  const [avatarImage, setAvatarImage] = useState<string>('');
  const [avatarColor, setAvatarColor] = useState('bg-emerald-600');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Safe non-blocking custom dialog states for iframe sandbox execution
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: number; name: string } | null>(null);
  const [alertModal, setAlertModal] = useState<{ title: string; message: string; type: 'error' | 'warning' } | null>(null);

  // Permission toggles state
  const [permInicio, setPermInicio] = useState(true);
  const [permDashboard, setPermDashboard] = useState(false);
  const [permMembersList, setPermMembersList] = useState(false);
  const [permCycles, setPermCycles] = useState(true);
  const [permSocial, setPermSocial] = useState(true);
  const [permAudit, setPermAudit] = useState(false);
  const [permAdminModule, setPermAdminModule] = useState(false);
  const [permReports, setPermReports] = useState(true);
  const [permContracts, setPermContracts] = useState(true);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeAdminUploadId, setActiveAdminUploadId] = useState<number | null>(null);
  const adminFileInputRef = useRef<HTMLInputElement>(null);

  const handleAdminClickUpload = (memberId: number) => {
    setActiveAdminUploadId(memberId);
    setTimeout(() => {
      adminFileInputRef.current?.click();
    }, 55);
  };

  const handleAdminFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || activeAdminUploadId === null) return;
    const file = e.target.files[0];
    if (file.size > 5 * 1024 * 1024) {
      alert("Tamanho limite de comprovativo excedido (máximo 5MB).");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        const fileBase64 = reader.result;
        
        // Salvar no LocalStorage com chave padrão
        localStorage.setItem(`kix_receipt_data_${activeAdminUploadId}_${currentMonth}`, fileBase64);

        // Atualizar estado de membros para marcar pago e recolher metadados
        setMembers((prevMembers) => {
          const updated = prevMembers.map((m) => {
            if (m.id === activeAdminUploadId) {
              const currentContributions = { ...m.contributions };
              currentContributions[currentMonth] = {
                paid: true,
                paidAt: new Date().toISOString(),
                receiptFileName: file.name,
                receiptFileSize: `${(file.size / 1024).toFixed(0)} KB`,
                receiptUploadedAt: new Date().toISOString()
              };
              
              // Registar no repositório de comprovativos kix_comprovativos
              const comprovativosRaw = localStorage.getItem('kix_comprovativos');
              let comprovativos = [];
              try {
                if (comprovativosRaw) comprovativos = JSON.parse(comprovativosRaw);
              } catch (e) {}
              
              comprovativos = comprovativos.filter(
                (item: any) => !(item.memberId === m.id && item.month === currentMonth)
              );
              
              comprovativos.push({
                id: `manual_admin_${m.id}_${currentMonth}_${Date.now()}`,
                memberId: m.id,
                memberName: m.name,
                month: currentMonth,
                amount: 120000,
                fileName: file.name,
                fileSize: `${(file.size / 1024).toFixed(0)} KB`,
                uploadedAt: new Date().toISOString(),
                fileDataUrl: fileBase64,
                source: 'Upload Administrador'
              });
              
              localStorage.setItem('kix_comprovativos', JSON.stringify(comprovativos));

              return {
                ...m,
                contributions: currentContributions
              };
            }
            return m;
          });

          // Adicionar log ao livro razão Kix Logs
          const targetMember = updated.find(m => m.id === activeAdminUploadId);
          if (targetMember) {
            const newLog = {
              id: `log_admin_upload_${Date.now()}`,
              timestamp: new Date().toISOString(),
              type: 'contribution',
              memberName: targetMember.name,
              amount: 120000,
              description: `Administrador carregou comprovativo "${file.name}" para Mês 0${currentMonth} (${targetMember.name})`,
              month: currentMonth
            };
            const updatedLogs = [newLog, ...logs];
            setLogs(updatedLogs);
            saveState(updated, updatedLogs);
          }
          return updated;
        });

        alert(`Comprovativo anexado com sucesso para o membro no Mês 0${currentMonth}!`);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  // Format currencies
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-AO', {
      style: 'currency',
      currency: 'AOA',
      minimumFractionDigits: 2,
    })
      .format(val)
      .replace('AOA', 'KZs');
  };

  // Helper to count paid months for a member
  const countPaidMonths = (m: Member) => {
    return Object.keys(m.contributions).filter(
      (monthKey) => m.contributions[Number(monthKey)]?.paid
    ).length;
  };

  const filteredMembers = members.filter((m) => {
    // Excluir administradores da tabela de cadastro principal de quotas
    if (m.role === 'admin') return false;

    const matchesSearch = 
      m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.phone.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      getMemberIdCode(m.name, m.phone).toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchesRole = roleFilter === 'all' ? true : m.role === roleFilter;
    
    const hasPaidCurrent = m.contributions[currentMonth]?.paid;
    const matchesPayment = 
      paymentFilter === 'all' 
        ? true 
        : paymentFilter === 'paid' 
          ? hasPaidCurrent 
          : !hasPaidCurrent;
          
    const matchesMonth = monthFilter === 'all' ? true : m.assignedMonth === Number(monthFilter);

    return matchesSearch && matchesRole && matchesPayment && matchesMonth;
  });

  // Trigger file upload and read as Base64 dataUrl
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 2 * 1024 * 1024) {
        alert('Tamanho limite de imagem excedido! Por favor escolha um ficheiro menor de 2MB.');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setAvatarImage(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRoleChange = (newRole: 'admin' | 'membro') => {
    setRole(newRole);
    if (newRole === 'admin') {
      setPermInicio(true);
      setPermDashboard(true);
      setPermMembersList(true);
      setPermCycles(true);
      setPermSocial(true);
      setPermAudit(true);
      setPermAdminModule(true);
      setPermReports(true);
      setPermContracts(true);
    } else {
      setPermInicio(true);
      setPermDashboard(false);
      setPermMembersList(false);
      setPermCycles(true);
      setPermSocial(true);
      setPermAudit(false);
      setPermAdminModule(false);
      setPermReports(true);
      setPermContracts(true);
    }
  };

  // Clear or open the form modal
  const handleOpenCreateForm = () => {
    setEditingMember(null);
    setName('');
    setPhone('+244 ');
    setEmail('');
    setBankIban('');
    setRole('membro');
    setTempPassword('membro123');
    setAssignedMonth(currentMonth || 3);
    setCurrentMonthState('pending');
    setAvatarImage('');
    setAvatarColor(AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)]);
    setPermInicio(true);
    setPermDashboard(false);
    setPermMembersList(false);
    setPermCycles(true);
    setPermSocial(true);
    setPermAudit(false);
    setPermAdminModule(false);
    setPermReports(true);
    setPermContracts(true);
    setErrorMsg('');
    setShowFormModal(true);
  };

  const handleOpenEditForm = (m: Member) => {
    const isSuperAdmin = currentUser?.email?.trim()?.toLowerCase() === 'lmendesvictor@gmail.com';
    const isEditingSuperAdmin = m.email.trim().toLowerCase() === 'lmendesvictor@gmail.com';

    if (isEditingSuperAdmin && !isSuperAdmin) {
      setAlertModal({
        title: 'Acesso Proibido',
        message: 'Por questões estritas de governança, integridade de segurança e controle de master dev, a conta de super administrador (lmendesvictor@gmail.com) é inalterável e as suas credenciais de segurança não podem ser lidas ou editadas por outros administradores promovidos.',
        type: 'error'
      });
      return;
    }

    setEditingMember(m);
    setName(m.name);
    setPhone(m.phone.startsWith('+244') ? m.phone : `+244 ${m.phone}`);
    setEmail(m.email);
    setBankIban(m.bankIban || '');
    setRole(m.role || 'membro');
    setTempPassword(isSuperAdmin ? (m.tempPassword || 'membro123') : '••••••');
    setAssignedMonth(m.assignedMonth);
    setCurrentMonthState(m.contributions[currentMonth]?.paid ? 'paid' : 'pending');
    setAvatarImage(m.avatarImage || '');
    setAvatarColor(m.avatarColor);
    setPermInicio(m.permissions?.accessInicio ?? true);
    setPermDashboard(m.permissions?.accessDashboard ?? (m.role === 'admin'));
    setPermMembersList(m.permissions?.accessMembersList ?? (m.role === 'admin'));
    setPermCycles(m.permissions?.accessCycles ?? true);
    setPermSocial(m.permissions?.accessSocial ?? true);
    setPermAudit(m.permissions?.accessAudit ?? (m.role === 'admin'));
    setPermAdminModule(m.permissions?.accessAdminModule ?? (m.role === 'admin'));
    setPermReports(m.permissions?.accessReports ?? true);
    setPermContracts(m.permissions?.accessContracts ?? true);
    setErrorMsg('');
    setShowFormModal(true);
  };

  // Submit create or edit form
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    // Validations
    if (!name.trim()) {
      setErrorMsg('Por favor introduza o nome completo do membro.');
      return;
    }

    const cleanedPhone = phone.trim();
    if (!cleanedPhone || cleanedPhone === '+244' || cleanedPhone.length < 9) {
      setErrorMsg('Por favor introduza um número de telefone válido com indicativo de Angola (+244...).');
      return;
    }

    if (!email.includes('@')) {
      setErrorMsg('Introduza um endereço de correio eletrónico (E-mail) válido.');
      return;
    }

    let updatedMembers = [...members];
    const isSuperAdmin = currentUser?.email?.trim()?.toLowerCase() === 'lmendesvictor@gmail.com';

    if (editingMember) {
      // Edit existing member
      updatedMembers = members.map((m) => {
        if (m.id === editingMember.id) {
          return {
            ...m,
            name: name.trim(),
            phone: cleanedPhone,
            email: email.trim().toLowerCase(),
            role,
            tempPassword: (!isSuperAdmin && tempPassword === '••••••') ? (m.tempPassword || 'membro123') : tempPassword,
            assignedMonth,
            avatarColor,
            avatarImage,
            bankIban: bankIban.trim(),
            permissions: {
              accessInicio: permInicio,
              accessDashboard: permDashboard,
              accessMembersList: permMembersList,
              accessCycles: permCycles,
              accessSocial: permSocial,
              accessAudit: permAudit,
              accessAdminModule: permAdminModule,
              accessReports: permReports,
              accessContracts: permContracts,
            },
            contributions: {
              ...m.contributions,
              [currentMonth]: {
                paid: currentMonthState === 'paid',
                paidAt: currentMonthState === 'paid' && !m.contributions[currentMonth]?.paid ? new Date().toISOString() : m.contributions[currentMonth]?.paidAt,
              },
            },
          };
        }
        return m;
      });

      // Audit Log
      const isPasswordChanged = editingMember && tempPassword !== '••••••' && editingMember.tempPassword !== tempPassword;
      const logPassValue = (!isSuperAdmin && tempPassword === '••••••') ? '••••••' : tempPassword;
      const newLog = {
        id: `edit-${Date.now()}`,
        timestamp: new Date().toISOString(),
        type: (isPasswordChanged ? 'password_reset' : 'member_management') as any,
        amount: 0,
        description: isPasswordChanged 
          ? `REDEFINIÇÃO DE PALAVRA-PASSE: O administrador redefiniu a palavra-passe provisória de ${name} para "${logPassValue}".`
          : `ADMINISTRADOR: Perfil de utilizador de ${name} atualizado (Nível: ${role === 'admin' ? 'Administrador' : 'Membro'}).`,
        month: currentMonth,
      };

      const updatedLogs = [newLog, ...logs];
      setMembers(updatedMembers);
      setLogs(updatedLogs);
      
      setIsSaving(true);
      try {
        await saveState(updatedMembers, updatedLogs);
        setShowFormModal(false);
      } catch (err: any) {
        setErrorMsg('Falha ao gravar alterações do integrador: ' + err);
      } finally {
        setIsSaving(false);
      }
    } else {
      // Create new member
      // Note: Consórcio rotativo features exactly 12 members. Let's warn but allow creation for extreme flexibility
      const newId = members.length > 0 ? Math.max(...members.map((m) => m.id)) + 1 : 1;
      
      const newMember: Member = {
        id: newId,
        name: name.trim(),
        phone: cleanedPhone,
        email: email.trim().toLowerCase(),
        role,
        tempPassword,
        avatarColor,
        avatarImage,
        assignedMonth,
        bankIban: bankIban.trim(),
        permissions: {
          accessInicio: permInicio,
          accessDashboard: permDashboard,
          accessMembersList: permMembersList,
          accessCycles: permCycles,
          accessSocial: permSocial,
          accessAudit: permAudit,
          accessAdminModule: permAdminModule,
          accessReports: permReports,
          accessContracts: permContracts,
        },
        contributions: {
          1: { paid: false },
          2: { paid: false },
          3: { paid: currentMonthState === 'paid', paidAt: currentMonthState === 'paid' ? new Date().toISOString() : undefined },
          4: { paid: false },
          5: { paid: false },
          6: { paid: false },
        },
        benefits: {},
        socialSupportReceived: 0,
      };

      updatedMembers = [...members, newMember];

      const newLog = {
        id: `create-${Date.now()}`,
        timestamp: new Date().toISOString(),
        type: 'member_management' as any,
        amount: 120000,
        description: `ADMINISTRADOR: Registrado novo membro no Kix_Fundo: "${name}" com telefone ${cleanedPhone}. Quota designada para Mês ${assignedMonth}.`,
        month: currentMonth,
      };

      const updatedLogs = [newLog, ...logs];
      setMembers(updatedMembers);
      setLogs(updatedLogs);
      
      setIsSaving(true);
      try {
        await saveState(updatedMembers, updatedLogs);
        setShowFormModal(false);
      } catch (err: any) {
        setErrorMsg('Falha ao registar novo membro: ' + err);
      } finally {
        setIsSaving(false);
      }
    }
  };

  // Delete member helper
  const handleDeleteMember = (memberId: number, name: string) => {
    // Prevent self-deletion if they try to delete their own member profile from the table
    if (currentUser?.email && members.find(m => m.id === memberId)?.email?.toLowerCase() === currentUser.email.toLowerCase()) {
      setAlertModal({
        title: 'Operação Inválida',
        message: 'Erro: Não pode remover a sua própria conta ou perfil de membro enquanto estiver autenticado no sistema.',
        type: 'error'
      });
      return;
    }
    setDeleteConfirm({ id: memberId, name });
  };

  const confirmDeleteMember = async () => {
    if (!deleteConfirm) return;
    const { id: memberId, name } = deleteConfirm;
    const updatedMembers = members.filter((m) => m.id !== memberId);
    
    const newLog = {
      id: `delete-${Date.now()}`,
      timestamp: new Date().toISOString(),
      type: 'member_management' as any,
      amount: 0,
      description: `ADMINISTRADOR: Removido o membro "${name}" do consórcio rotativo.`,
      month: currentMonth,
    };

    const updatedLogs = [newLog, ...logs];
    setMembers(updatedMembers);
    setLogs(updatedLogs);
    setDeleteConfirm(null);
    
    try {
      await saveState(updatedMembers, updatedLogs);
    } catch (err) {
      setAlertModal({
        title: 'Erro de Gravação',
        message: "Erro ao remover membro da base de dados: " + err,
        type: 'error'
      });
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-colors" id="members-table-container">
      
      {/* Table Header Section */}
      <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold font-display text-slate-800 dark:text-white">
              Cadastro de Membros e Perfis
            </h2>
            <span className="text-xs bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-200 font-bold px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-700">
              Foco Mês {currentMonth}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Visualização de cargos, agendas e estados de tesouraria de cada membro ativo.
          </p>
        </div>

        {/* Action button panel - Only show admin options if logged-in user is actually admin */}
        {currentUser?.role === 'admin' && (
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setIsAdminMode(!isAdminMode)}
              className={`text-xs font-bold px-3 py-2 rounded-lg border transition-all cursor-pointer ${
                isAdminMode 
                  ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 border-transparent shadow-sm' 
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-705 hover:bg-slate-50 dark:hover:bg-slate-700'
              }`}
            >
              {isAdminMode ? 'Desativar Controle Admin' : 'Ativar Controle Admin'}
            </button>

            {isAdminMode && (
              <button
                onClick={handleOpenCreateForm}
                className="bg-[#10B981] hover:bg-[#059669] text-white text-xs font-bold px-3 py-2 rounded-lg shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                Adicionar Membro
              </button>
            )}
          </div>
        )}
      </div>

      {/* Busca Rápida de Sócios (Por Nome ou ID) */}
      <div className="px-5 py-4.5 bg-gradient-to-r from-emerald-500/5 via-indigo-500/5 to-transparent border-b border-slate-200 dark:border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex-1 max-w-2xl relative">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-455 dark:text-slate-400">
            <span className="text-sm">🔍</span>
          </span>
          <input
            type="text"
            placeholder="Busca Rápida de Sócios: Digite o Nome do Sócio ou ID (ex: KIX-01)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-10 py-2.5 bg-white dark:bg-slate-800 border-2 border-indigo-100/80 dark:border-slate-700 hover:border-indigo-200 dark:hover:border-slate-650 focus:border-indigo-500 dark:focus:border-indigo-500 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-400 focus:outline-none shadow-sm font-semibold transition-all focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-950/40"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <div className="text-[11px] text-slate-550 dark:text-slate-400 font-bold flex items-center gap-2 bg-white dark:bg-slate-800 px-3 py-2 rounded-xl border border-slate-200/80 dark:border-slate-700/60 shadow-sm shrink-0 self-start md:self-auto">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span>Sócios Localizados: <strong className="text-slate-900 dark:text-white font-extrabold">{filteredMembers.length}</strong></span>
        </div>
      </div>

      {/* Interactive Filters Bar */}
      <div className="bg-slate-50/50 dark:bg-slate-950/40 p-4 border-b border-slate-200 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-3 animate-fadeIn">
        {/* Level Filter */}
        <div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as any)}
            className="w-full px-2.5 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="all">Nível: Todos os Cargos</option>
            <option value="admin">Administrador</option>
            <option value="membro">Membro Comum</option>
          </select>
        </div>

        {/* Quota Filter */}
        <div>
          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value as any)}
            className="w-full px-2.5 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="all">Quotas Mês {currentMonth}: Todas</option>
            <option value="paid">🟢 Comprovativo Validado</option>
            <option value="pending">🔴 Falta Pagar</option>
          </select>
        </div>

        {/* Month assigned Filter */}
        <div>
          <select
            value={monthFilter}
            onChange={(e) => setMonthFilter(e.target.value)}
            className="w-full px-2.5 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="all">Mês Contemplação: Todos</option>
            <option value="1">Mês 01 (Março)</option>
            <option value="2">Mês 02 (Abril)</option>
            <option value="3">Mês 03 (Maio)</option>
            <option value="4">Mês 04 (Junho)</option>
            <option value="5">Mês 05 (Julho)</option>
            <option value="6">Mês 06 (Agosto)</option>
          </select>
        </div>
      </div>

      {/* Info Warning */}
      <div className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 px-5 py-3 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
        <span className="flex items-center gap-1.5 leading-relaxed font-sans font-medium text-[11px] text-slate-650 dark:text-slate-300">
          <Info className="w-4 h-4 text-blue-500 shrink-0" />
          Cada membro possui cota fixa mensal de <strong>120.000,00 KZs</strong>. Reter <strong>20.000,00 KZs</strong> para o fundo social em todas as transasções.
        </span>
        <span className="text-[11px] font-mono text-slate-600 dark:text-slate-300">
          Consórcio: {members.length} / 12 Fixos
        </span>
      </div>

      {/* Primary Table Visual Markup */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 dark:bg-slate-950/20 border-b border-slate-100 dark:border-slate-800 text-slate-400 dark:text-slate-300 uppercase text-[9px] tracking-widest font-black">
              <th className="py-4 px-5">Foto / Nome Completo</th>
              <th className="py-4 px-5">Contacto Internacional</th>
              <th className="py-4 px-5">Agenda de Benefício</th>
              <th className="py-4 px-5">Quotas Pagas (Poupança)</th>
              <th className="py-4 px-5 text-center">Estado Mês {currentMonth}</th>
              <th className="py-4 px-5 text-right">Ação / Controles</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
            {filteredMembers.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-12 text-slate-450 dark:text-slate-550 font-medium">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <span className="text-base">🔍</span>
                    <span className="italic text-xs">Nenhum membro localizado com os filtros ou pesquisa indicados.</span>
                    {searchTerm && (
                      <button
                        onClick={() => setSearchTerm('')}
                        className="mt-1 text-xs text-indigo-500 hover:text-indigo-600 dark:text-indigo-400 dark:hover:text-indigo-300 font-bold hover:underline cursor-pointer bg-indigo-50 dark:bg-indigo-950/35 px-2.5 py-1 rounded-md border border-indigo-100 dark:border-indigo-900/30 animate-fadeIn"
                      >
                        Limpar Busca Rápida
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              filteredMembers.map((m) => {
                const hasPaidCurrentMonth = m.contributions[currentMonth]?.paid;
                const isCurrentMonthBeneficiary = beneficiariesIds.includes(m.id);
                const paidMonthsCount = countPaidMonths(m);
                const individualSocialInvestment = paidMonthsCount * 20000;

                return (
                  <tr
                    key={m.id}
                    className={`border-b border-slate-100 dark:border-slate-800/80 hover:bg-slate-55/35 dark:hover:bg-slate-800/25 transition-colors ${
                      isCurrentMonthBeneficiary ? 'bg-indigo-500/5 dark:bg-indigo-950/5' : ''
                    }`}
                  >
                    
                    {/* Visual identification with picture conforming to Image 5 */}
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-3.5 text-left">
                        {m.avatarImage ? (
                          <img
                            src={m.avatarImage}
                            alt={m.name}
                            referrerPolicy="no-referrer"
                            className="w-12 h-12 rounded-2xl object-cover bg-slate-100 dark:bg-slate-820 border-2 border-slate-200/50 dark:border-slate-800 shadow-xs shrink-0"
                          />
                        ) : (
                          <div
                            className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm text-white shrink-0 shadow-xs ${m.avatarColor}`}
                          >
                            {m.name
                              .split(' ')
                              .map((n) => n[0])
                              .slice(0, 2)
                              .join('')}
                          </div>
                        )}
                        
                        <div className="min-w-0 space-y-0.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-extrabold text-slate-900 dark:text-white text-[13.5px] tracking-tight block">
                              {m.name}
                            </span>
                            {m.role === 'admin' && (
                              <span className="text-[8.5px] font-black text-amber-850 dark:text-amber-300 bg-amber-500/15 dark:bg-amber-950/60 px-2 py-0.5 rounded-md uppercase tracking-wider border border-amber-500/20">
                                Direção
                              </span>
                            )}
                            {isCurrentMonthBeneficiary && (
                              <span className="text-[8.5px] font-black text-indigo-700 dark:text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded-md uppercase tracking-wider border border-indigo-500/15">
                                Beneficiário
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-medium truncate">
                            {m.email}
                          </span>
                          <div className="flex flex-wrap gap-2 pt-1 items-center">
                            <span className="text-[9px] font-mono font-extrabold leading-none bg-sky-500/10 text-sky-700 dark:text-sky-400 border border-sky-500/15 px-1.5 py-0.5 rounded" title="Código de Cadastro Cooperativo (Imutável)">
                              ID: {getMemberDisplayCode(m.id)}
                            </span>
                            {m.bankIban && (
                              <span className="text-[9px] text-[#0d5c3a] dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/15 font-mono px-2 py-0.5 rounded-md font-bold tracking-tight select-all">
                                🏦 IBAN: {m.bankIban}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* International formatted phone styled dynamically */}
                    <td className="py-4 px-5 font-mono font-bold text-[12px] text-slate-700 dark:text-slate-350">
                      <div className="flex items-center gap-1.5 justify-start text-left">
                        <span className="filter grayscale opacity-70">📞</span>
                        <span className="tracking-widest">{m.phone}</span>
                      </div>
                    </td>

                    {/* Benefit Month Target */}
                    <td className="py-4 px-5 text-left">
                      <div className="flex flex-col gap-1.5 items-start">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-black text-slate-900 dark:text-white font-mono">
                            📅 Mês 0{m.assignedMonth}
                          </span>
                        </div>
                        {m.assignedMonth < currentMonth ? (
                          <span className="inline-flex items-center gap-0.5 text-[9px] text-emerald-700 bg-emerald-500/10 font-black tracking-wider uppercase px-2 py-0.5 rounded border border-emerald-500/20">
                            ✓ Liquidado
                          </span>
                        ) : m.assignedMonth === currentMonth ? (
                          <span className="inline-flex items-center gap-0.5 text-[9px] text-rose-700 bg-rose-500/15 font-black tracking-wider uppercase px-2 py-0.5 rounded border border-rose-500/25 animate-pulse">
                            ★ Ativo
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-0.5 text-[9px] text-slate-500 bg-slate-500/10 font-extrabold tracking-wider uppercase px-2 py-0.5 rounded border border-slate-500/10">
                            ⏱ Agendado
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Quota counter and social balance displaying perfect status circles */}
                    <td className="py-4 px-5 text-left">
                      <div className="flex flex-col items-start justify-center">
                        <span className="font-extrabold font-mono text-[13.5px] text-emerald-700 dark:text-emerald-400">
                          {formatCurrency(individualSocialInvestment)}
                        </span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold mt-0.5">
                          Poupança: {paidMonthsCount}/6 cotas pagas
                        </span>
                        
                        {/* Perfect Circles 1 to 6 - Conforming directly with Image 5 */}
                        <div className="flex gap-1.5 mt-2">
                          {[1, 2, 3, 4, 5, 6].map((mIdx) => {
                            const isPaid = m.contributions[mIdx]?.paid;
                            return (
                              <span 
                                key={mIdx} 
                                className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black tracking-tight border shadow-xs transition-all ${
                                  isPaid 
                                    ? 'bg-[#0b5a3e] text-white border-[#0d5c3a]' 
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border-slate-200/60 dark:border-slate-700'
                                }`}
                                title={`Mês 0${mIdx}: ${isPaid ? 'Pago' : 'Pendente'}`}
                              >
                                {mIdx}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    </td>

                    {/* Current Month State with Pink/Red pills conforming to Image 5 */}
                    <td className="py-4 px-5">
                      <div className="flex flex-col items-center justify-center gap-2">
                        {hasPaidCurrentMonth ? (
                          <>
                            <span className="inline-flex items-center gap-1.5 px-3.5 py-1 text-[9.5px] font-black bg-emerald-500/10 text-emerald-600 dark:text-emerald-450 rounded-full border border-emerald-500/20 uppercase tracking-widest leading-none shadow-xs">
                              🟢 Pago
                            </span>
                            {(() => {
                              const receiptBase64 = localStorage.getItem(`kix_receipt_data_${m.id}_${currentMonth}`);
                              const rName = m.contributions[currentMonth]?.receiptFileName || `comprovativo_m0${currentMonth}_${m.id}.pdf`;
                              if (receiptBase64) {
                                return (
                                  <a
                                    href={receiptBase64}
                                    download={rName}
                                    title="Descarregar comprovativo recebido"
                                    className="text-[9px] text-[#4F46E5] hover:text-[#3730A3] dark:text-[#818CF8] font-black uppercase tracking-wider flex items-center justify-center gap-1 bg-indigo-500/5 hover:bg-indigo-500/10 border border-indigo-500/15 px-2 py-1 rounded-lg transition-all mt-0.5"
                                  >
                                    📁 Baixar Recibo
                                  </a>
                                );
                              } else {
                                return (
                                  <button
                                    type="button"
                                    onClick={() => handleAdminClickUpload(m.id)}
                                    className="text-[9px] text-slate-500 hover:text-indigo-650 font-bold underline flex items-center gap-0.5 mt-0.5 cursor-pointer"
                                    title="Anexar um comprovativo em falta"
                                  >
                                    📎 Anexar Recibo
                                  </button>
                                );
                              }
                            })()}
                          </>
                        ) : (
                          <>
                            <span className="inline-flex items-center gap-1.5 px-3.5 py-1 text-[9.5px] font-black bg-rose-100 text-rose-750 dark:bg-rose-950/40 dark:text-rose-400 rounded-full border border-rose-200 uppercase tracking-widest leading-none shadow-xs">
                              🔴 Pendente
                            </span>
                            <button
                              type="button"
                              onClick={() => handleAdminClickUpload(m.id)}
                              className="text-[9px] text-indigo-700 hover:text-indigo-850 dark:text-indigo-300 font-extrabold uppercase tracking-wide flex items-center gap-1 mt-1 bg-indigo-55/15 dark:bg-indigo-950/20 border border-indigo-200/50 dark:border-indigo-900 px-2 py-1.5 rounded-lg hover:bg-indigo-100/60 cursor-pointer"
                              title="Pagar e carregar comprovativo"
                            >
                              📎 Pagar c/ Recibo
                            </button>
                          </>
                        )}
                      </div>
                    </td>

                    {/* Actions column based on Admin levels with rounded squares */}
                    <td className="py-4 px-5 text-right">
                      <div className="flex items-center justify-end gap-2 flex-wrap">
                        {/* Simulation trigger */}
                        {onSimulateMember && (
                          <button
                            type="button"
                            onClick={() => onSimulateMember(m.id)}
                            className="px-2.5 py-1.5 text-amber-700 hover:text-white hover:bg-amber-600 active:scale-95 bg-amber-500/10 rounded-xl border border-amber-500/25 transition-all flex items-center gap-1.5 text-[10px] font-black cursor-pointer shadow-xs"
                            title="Simular e Visualizar Área do Membro"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span className="hidden xl:inline uppercase tracking-wider">Simular</span>
                          </button>
                        )}

                        {/* Always available Quick Payment status flip for admin */}
                        {currentUser?.role === 'admin' && (
                          <button
                            type="button"
                            onClick={() => onToggleContribution(m.id)}
                            className={`px-3 py-1.5 rounded-xl text-[10.5px] font-extrabold transition-all cursor-pointer border shadow-xs ${
                              hasPaidCurrentMonth
                                ? 'border-rose-200 text-rose-700 bg-rose-50 hover:bg-rose-600 hover:text-white'
                                : 'border-[#10b981]/30 text-emerald-800 bg-[#10b981]/10 hover:bg-emerald-600 hover:text-white'
                            }`}
                          >
                            {hasPaidCurrentMonth ? 'Desfazer' : 'Confirmar'}
                          </button>
                        )}

                        {/* Core edit action */}
                        {currentUser?.role === 'admin' && (
                          <button
                            type="button"
                            onClick={() => handleOpenEditForm(m)}
                            className="p-2 text-indigo-750 bg-indigo-50 hover:text-white hover:bg-indigo-600 rounded-xl border border-indigo-200 transition-all cursor-pointer shadow-xs"
                            title="Editar Perfil"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                        )}

                        {/* Core delete action */}
                        {currentUser?.role === 'admin' && (
                          <button
                            type="button"
                            onClick={() => handleDeleteMember(m.id, m.name)}
                            className="p-2 text-rose-750 bg-rose-50 hover:text-white hover:bg-rose-600 rounded-xl border border-rose-200 transition-all cursor-pointer shadow-xs"
                            title="Remover Membro"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}

                        {/* Fallback for regular members viewing the list */}
                        {currentUser?.role !== 'admin' && (
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium italic">
                            Apenas Visualização
                          </span>
                        )}
                      </div>
                    </td>

                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Form Modal for creation & update of members (includes image uploads) */}
      <AnimatePresence>
        {showFormModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden text-slate-700 flex flex-col md:flex-row max-h-[92vh]"
            >
              
              {/* Left Column - Large Member Photo & ID Preview Card */}
              <div className="bg-slate-950 text-white p-8 md:w-80 shrink-0 flex flex-col items-center justify-center text-center border-b md:border-b-0 md:border-r border-slate-800 relative overflow-hidden select-none">
                <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/5 rounded-bl-full pointer-events-none -z-10" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-550/5 rounded-tr-full pointer-events-none -z-10" />

                <div className="mb-6">
                  <h3 className="text-xs font-black tracking-widest text-[#10B981] uppercase block mb-1">
                    Ficha de Membro
                  </h3>
                  <p className="text-[10px] text-slate-400">
                    Visualização Avançada do Perfil
                  </p>
                </div>

                {/* Highly visual large photogragh preview */}
                <div className="relative group mb-6">
                  {avatarImage ? (
                    <img
                      src={avatarImage}
                      alt="Preview"
                      referrerPolicy="no-referrer"
                      className="w-40 h-40 items-center justify-center rounded-2xl object-cover border-4 border-slate-800 shadow-md group-hover:border-emerald-500 transition-all duration-300"
                    />
                  ) : (
                    <div className={`w-40 h-40 rounded-2xl flex items-center justify-center font-black text-white text-5xl shadow-md border-4 border-slate-800 group-hover:border-emerald-500 transition-all duration-300 ${avatarColor}`}>
                      {name ? name.split(' ').map((n)=>n[0]).slice(0, 2).join('') : '?'}
                    </div>
                  )}
                  
                  {/* Floating edit photo button */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-2 right-2 bg-[#10B981] hover:bg-[#059669] text-slate-950 p-2.5 rounded-xl border-2 border-slate-950 transition-all shadow-lg hover:scale-105 active:scale-95"
                    title="Mudar Imagem"
                  >
                    <Camera className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-3 w-full">
                  <div>
                    <h4 className="font-bold text-sm text-slate-100 truncate max-w-[240px] mx-auto">
                      {name || 'Nome do Membro'}
                    </h4>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[9px] font-black bg-emerald-500/10 text-emerald-400 rounded-full border border-emerald-500/20 uppercase tracking-widest mt-1">
                      {role === 'admin' ? '🛡️ Administrador' : '👤 Membro Coletor'}
                    </span>
                  </div>

                  {/* Deterministic ID box */}
                  <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 text-left">
                    <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">ID de Membro Kixi</p>
                    <p className="font-mono text-[10px] font-extrabold text-emerald-400 truncate mt-0.5">
                      {getMemberIdCode(name || 'TEMPORARIO', phone || '900000000')}
                    </p>
                  </div>

                  <p className="text-[10px] text-slate-500">
                    Suporta imagens .png ou .jpeg abaixo de 2MB.
                  </p>
                  
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-xs bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[#10B981] hover:text-[#059669] font-bold px-4 py-1.5 rounded-lg transition"
                  >
                    Carregar Imagem Local
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                    accept="image/*"
                    className="hidden"
                  />
                </div>
              </div>

              {/* Right Column - Comprehensive Form & Permission Controls */}
              <form onSubmit={handleSubmitForm} className="flex-1 flex flex-col min-w-0 max-h-[92vh]">
                
                {/* Header inside Form for closing */}
                <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between shrink-0 md:bg-white md:text-slate-900 md:border-b md:border-slate-100">
                  <div>
                    <h3 className="text-sm font-black tracking-wide uppercase">
                      {editingMember ? 'Preencher Perfil & Direitos' : 'Credenciar Novo Integrante'}
                    </h3>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Controle administrativo centralizado para quotas, IBAN e privilégios.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowFormModal(false)}
                    className="text-slate-400 hover:text-slate-900 transition p-1.5"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Form Inputs Container - Scrollable */}
                <div className="flex-1 p-6 space-y-5 overflow-y-auto text-xs">
                  
                  {/* GROUP 1: DADOS PESSOAIS */}
                  <div className="space-y-3">
                    <h5 className="text-[10px] font-black uppercase text-[#4F46E5] tracking-widest border-b border-indigo-50/60 pb-1 flex items-center gap-1.5">
                      <span>01. Informações Pessoais de Contacto</span>
                    </h5>
                    
                    <div>
                      <label className="block text-slate-500 font-semibold mb-1 uppercase tracking-wider text-[10px]">
                        Nome Completo do Integrante
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="ex: António José Manuel"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:border-indigo-500 font-medium"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div>
                        <label className="block text-slate-500 font-semibold mb-1 uppercase tracking-wider text-[10px]">
                          Telemóvel Internacional
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="+244 9..."
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-mono font-medium focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-500 font-semibold mb-1 uppercase tracking-wider text-[10px]">
                          Endereço de E-mail
                        </label>
                        <input
                          type="email"
                          required
                          placeholder="membro@kixfundo.ao"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-medium focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* GROUP 2: FINANCEIRO E QUOTAS */}
                  <div className="space-y-3 pt-1">
                    <h5 className="text-[10px] font-black uppercase text-[#10B981] tracking-widest border-b border-emerald-50 pb-1 flex items-center gap-1.5">
                      <span>02. Parâmetros Financeiros & Quotas</span>
                    </h5>

                    <div>
                      <label className="block text-slate-500 font-semibold mb-1 uppercase tracking-wider text-[10px] flex items-center justify-between">
                        <span>Coordenadas Bancárias Internacionais (IBAN)</span>
                        <span className="text-[9px] text-slate-400 capitalize">Contingente para fundação e resgates</span>
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: AO06 0040 0000 1234 5678 1011 2"
                        value={bankIban}
                        onChange={(e) => setBankIban(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-mono text-[11px] focus:outline-none focus:border-emerald-500 uppercase font-medium"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div>
                        <label className="block text-slate-500 font-semibold mb-1 uppercase tracking-wider text-[10px]">
                          Mês Contemplado de Benefício (1 a 6)
                        </label>
                        <select
                          value={assignedMonth}
                          onChange={(e) => setAssignedMonth(Number(e.target.value))}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:outline-none font-medium"
                        >
                          {[1, 2, 3, 4, 5, 6].map((num) => (
                            <option key={num} value={num}>
                              Mês 0{num} (Prémio de 600.000,00 KZs)
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-slate-500 font-semibold mb-1 uppercase tracking-wider text-[10px]">
                          Estado da Quota do Mês Atual (M{currentMonth})
                        </label>
                        <select
                          value={currentMonthState}
                          onChange={(e) => setCurrentMonthState(e.target.value as 'pending' | 'paid')}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:outline-none font-medium"
                        >
                          <option value="pending">PENDENTE (Por liquidar)</option>
                          <option value="paid">PAGO (120.000,00 KZs com recibo)</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* GROUP 3: GESTÃO DE ACESSOS E ATRIBUIÇÃO DE PERMISSÕES */}
                  <div className="space-y-3 pt-1 border-t border-slate-100">
                    <h5 className="text-[10px] font-black uppercase text-[#F59E0B] tracking-widest pb-1 flex items-center justify-between">
                      <span>03. Gestão de Contas & Atribuição de Permissões</span>
                      <span className="text-[9px] bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full font-bold">RBAC Ativo</span>
                    </h5>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div>
                        <label className="block text-slate-500 font-semibold mb-1 uppercase tracking-wider text-[10px]">
                          Nível Global de Acesso (Perfil)
                        </label>
                        <select
                          value={role}
                          onChange={(e) => handleRoleChange(e.target.value as 'admin' | 'membro')}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:outline-none text-slate-900 font-extrabold"
                        >
                          <option value="membro">Membro Comum (Privado)</option>
                          <option value="admin">Administrador (Controle Total)</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-slate-500 font-semibold mb-1 uppercase tracking-wider text-[10px] flex items-center justify-between">
                          <span>Senha Provisória de Acesso</span>
                          {currentUser?.email?.trim()?.toLowerCase() !== 'lmendesvictor@gmail.com' && (
                            <span className="text-[8.5px] text-amber-600 font-extrabold select-none">Filtro de Segurança</span>
                          )}
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="membro123"
                          value={tempPassword}
                          onChange={(e) => setTempPassword(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:outline-none font-mono font-medium text-xs"
                        />
                        {currentUser?.email?.trim()?.toLowerCase() !== 'lmendesvictor@gmail.com' && (
                          <p className="text-[9.5px] text-slate-400 mt-1 leading-normal italic">
                            As senhas ativas só são visíveis ao Super Administrador (lmendesvictor@gmail.com). Digite uma nova palavra-passe caso queira redefinir o acesso cooperativo.
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Checkboxes de permissões de módulos */}
                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-3 mt-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">
                          🛠️ Permissões de Acesso por Módulo (Membro Comum)
                        </span>
                        {role === 'admin' && (
                          <span className="text-[8px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-bold">Administrador tem acesso irrestrito</span>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {/* Tab Início */}
                        <label className="flex items-start gap-2.5 p-2 bg-white rounded-lg border border-slate-100 hover:border-indigo-100 transition cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={role === 'admin' ? true : permInicio}
                            disabled={role === 'admin'}
                            onChange={(e) => setPermInicio(e.target.checked)}
                            className="mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                          />
                          <div>
                            <p className="font-bold text-slate-800 text-[10.5px]">Módulo Início</p>
                            <p className="text-[9px] text-[#2563EB] font-medium leading-tight">Painel inicial geral e boas-vindas do fundo.</p>
                          </div>
                        </label>

                        {/* Tab Minha Área (Excepted) */}
                        <div className="flex items-start gap-2.5 p-2 bg-slate-100/50 rounded-lg border border-slate-200 select-none">
                          <input
                            type="checkbox"
                            checked={true}
                            disabled={true}
                            className="mt-0.5 rounded border-slate-300 text-slate-400"
                          />
                          <div>
                            <p className="font-bold text-slate-650 text-[10.5px]">Minha Área</p>
                            <span className="inline-block text-[8px] font-black text-[#10B981] bg-emerald-50 px-1.5 py-0.5 rounded uppercase mt-0.5">Acesso Permanente</span>
                          </div>
                        </div>

                        {/* Tab Cadastro */}
                        <label className="flex items-start gap-2.5 p-2 bg-white rounded-lg border border-slate-100 hover:border-indigo-100 transition cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={role === 'admin' ? true : permMembersList}
                            disabled={role === 'admin'}
                            onChange={(e) => setPermMembersList(e.target.checked)}
                            className="mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                          />
                          <div>
                            <p className="font-bold text-slate-800 text-[10.5px]">Módulo Cadastro</p>
                            <p className="text-[9px] text-[#2563EB] font-medium leading-tight">Visualizar e gerir perfis da lista de membros.</p>
                          </div>
                        </label>

                        {/* Tab Pagamentos */}
                        <label className="flex items-start gap-2.5 p-2 bg-white rounded-lg border border-slate-100 hover:border-indigo-100 transition cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={role === 'admin' ? true : permCycles}
                            disabled={role === 'admin'}
                            onChange={(e) => setPermCycles(e.target.checked)}
                            className="mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                          />
                          <div>
                            <p className="font-bold text-slate-800 text-[10.5px]">Módulo Pagamentos</p>
                            <p className="text-[9px] text-[#2563EB] font-medium leading-tight">Preencher e liquidar quotas e ver sorteios.</p>
                          </div>
                        </label>

                        {/* Tab Relatórios */}
                        <label className="flex items-start gap-2.5 p-2 bg-white rounded-lg border border-slate-100 hover:border-indigo-100 transition cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={role === 'admin' ? true : permReports}
                            disabled={role === 'admin'}
                            onChange={(e) => setPermReports(e.target.checked)}
                            className="mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                          />
                          <div>
                            <p className="font-bold text-slate-800 text-[10.5px]">Módulo Relatórios</p>
                            <p className="text-[9px] text-[#2563EB] font-medium leading-tight">Relatórios financeiros, balanços e extractos.</p>
                          </div>
                        </label>

                        {/* Tab Contratos */}
                        <label className="flex items-start gap-2.5 p-2 bg-white rounded-lg border border-slate-100 hover:border-indigo-100 transition cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={role === 'admin' ? true : permContracts}
                            disabled={role === 'admin'}
                            onChange={(e) => setPermContracts(e.target.checked)}
                            className="mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                          />
                          <div>
                            <p className="font-bold text-slate-800 text-[10.5px]">Módulo Contratos</p>
                            <p className="text-[9px] text-[#2563EB] font-medium leading-tight">Consultar e imprimir minutas e contratos vigentes.</p>
                          </div>
                        </label>

                        {/* Tab Administração */}
                        <label className="flex items-start gap-2.5 p-2 bg-white rounded-lg border border-slate-100 hover:border-indigo-100 transition cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={role === 'admin' ? true : permAdminModule}
                            disabled={role === 'admin'}
                            onChange={(e) => setPermAdminModule(e.target.checked)}
                            className="mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                          />
                          <div>
                            <p className="font-bold text-slate-800 text-[10.5px]">Módulo Administração</p>
                            <p className="text-[9px] text-[#2563EB] font-medium leading-tight">Acesso ao menu de configurações globais.</p>
                          </div>
                        </label>

                        {/* Tab Créditos (Restricted in Dev for non-admin) */}
                        <div className="flex items-start gap-2.5 p-2 bg-slate-100/50 rounded-lg border border-slate-200 select-none">
                          <input
                            type="checkbox"
                            checked={role === 'admin'}
                            disabled={true}
                            className="mt-0.5 rounded border-slate-300 text-slate-400"
                          />
                          <div>
                            <p className="font-bold text-slate-500 text-[10.5px]">Módulo Créditos</p>
                            <span className="inline-block text-[8px] font-black text-rose-500 bg-rose-50 px-1.5 py-0.5 rounded uppercase mt-0.5 font-sans">Só Admin (Em Desenv.)</span>
                          </div>
                        </div>

                        {/* Tab Outros (Painel Visual) */}
                        <label className="flex items-start gap-2.5 p-2 bg-white rounded-lg border border-slate-100 hover:border-indigo-100 transition cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={role === 'admin' ? true : permDashboard}
                            disabled={role === 'admin'}
                            onChange={(e) => setPermDashboard(e.target.checked)}
                            className="mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                          />
                          <div>
                            <p className="font-bold text-slate-800 text-[10.5px]">Painel Visual de Gráficos</p>
                            <p className="text-[9px] text-[#2563EB] font-medium leading-tight">Visualização analítica de fluxos e alocação.</p>
                          </div>
                        </label>
                      </div>
                    </div>


                  </div>

                  {/* Error messages */}
                  {errorMsg && (
                    <div className="p-3 bg-rose-50 text-rose-700 border border-rose-100 rounded-lg flex items-center gap-2 shrink-0">
                      <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                      <span>{errorMsg}</span>
                    </div>
                  )}
                </div>

                {/* Footer Buttons drawer */}
                <div className="p-5 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-3 shrink-0">
                  <button
                    type="button"
                    disabled={isSaving}
                    onClick={() => setShowFormModal(false)}
                    className="px-5 py-2.5 text-slate-500 border border-slate-200 bg-white rounded-lg hover:bg-slate-50 hover:text-slate-700 font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Mudar de Ideia
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-5 py-2.5 bg-slate-900 border border-slate-800 text-white font-black rounded-lg hover:bg-slate-800 transition shadow-sm flex items-center gap-1.5 disabled:opacity-85 disabled:cursor-not-allowed"
                  >
                    {isSaving ? (
                      <>
                        <div className="w-4 h-4 rounded-full border-2 border-slate-300 border-t-transparent animate-spin" />
                        <span>A gravar na nuvem...</span>
                      </>
                    ) : (
                      <span>Guardar Informações</span>
                    )}
                  </button>
                </div>

              </form>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <input
        type="file"
        ref={adminFileInputRef}
        onChange={handleAdminFileChange}
        accept="application/pdf,image/*"
        className="hidden"
      />

      {/* Custom Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto bg-slate-950/60 backdrop-blur-xs font-sans">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className={`relative w-full max-w-md p-6 overflow-hidden rounded-2xl shadow-2xl border transition-all ${
                theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className="p-3 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 rounded-xl shrink-0">
                  <Trash2 className="w-5.5 h-5.5 animate-bounce" />
                </div>
                <div className="space-y-1.5 flex-1">
                  <h3 className={`text-sm font-extrabold uppercase tracking-wide ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
                    Excluir Integrador / Membro?
                  </h3>
                  <p className={`text-xs leading-relaxed ${theme === 'dark' ? 'text-slate-300' : 'text-slate-500'}`}>
                    Tem a certeza de que deseja eliminar PERMANENTEMENTE o membro <strong className="font-extrabold text-rose-500">{deleteConfirm.name}</strong> do Kix Fundo? Esta ação removerá o seu perfil de todos os relatórios e é definitiva.
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-end gap-3.5 mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setDeleteConfirm(null)}
                  className="px-4.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-705 text-slate-500 dark:text-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={confirmDeleteMember}
                  className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-mono font-bold shadow-lg shadow-red-500/15 transition-all cursor-pointer"
                >
                  EXCLUIR DEFINITIVO
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Custom Alert/Error Modal */}
      <AnimatePresence>
        {alertModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto bg-slate-950/65 backdrop-blur-xs font-sans">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className={`relative w-full max-w-md p-6 overflow-hidden rounded-2xl shadow-2xl border transition-all ${
                theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-xl shrink-0 ${
                  alertModal.type === 'error' ? 'bg-red-50 dark:bg-red-950/30 text-red-500' :
                  'bg-amber-50 dark:bg-amber-950/30 text-amber-500'
                }`}>
                  <AlertCircle className="w-5.5 h-5.5" />
                </div>
                <div className="space-y-1.5 flex-1">
                  <h3 className={`text-sm font-extrabold uppercase tracking-wide ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
                    {alertModal.title}
                  </h3>
                  <p className={`text-xs leading-relaxed ${theme === 'dark' ? 'text-slate-300' : 'text-slate-500'}`}>
                    {alertModal.message}
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-end gap-3.5 mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setAlertModal(null)}
                  className="px-5 py-2 bg-slate-900 dark:bg-slate-850 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer"
                >
                  Confirmar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

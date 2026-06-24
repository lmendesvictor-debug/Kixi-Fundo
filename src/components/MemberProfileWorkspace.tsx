import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User, 
  UploadCloud, 
  CheckCircle, 
  Clock, 
  Coins, 
  ArrowRight, 
  HeartHandshake, 
  ShieldCheck, 
  FileText, 
  FileCheck, 
  ExternalLink,
  ChevronRight,
  Sparkles,
  Award,
  KeyRound,
  Download,
  Calculator,
  Bell,
  AlertTriangle
} from 'lucide-react';
import { Member, KixLog, getMemberIdCode, getMemberDisplayCode, Loan } from '../types';
import { saveReceiptToFirestore } from '../firebaseSync';

interface MemberProfileWorkspaceProps {
  member: Member;
  currentMonth: number;
  members: Member[];
  onToggleContribution: (memberId: number) => void;
  logs: KixLog[];
  setMembers: React.Dispatch<React.SetStateAction<Member[]>>;
  setLogs: React.Dispatch<React.SetStateAction<KixLog[]>>;
  saveState: (newMembers: Member[], newLogs: KixLog[]) => void;
  loans?: Loan[];
}

export default function MemberProfileWorkspace({
  member,
  currentMonth,
  members,
  onToggleContribution,
  logs,
  setMembers,
  setLogs,
  saveState,
  loans = [],
}: MemberProfileWorkspaceProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [successInfo, setSuccessInfo] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showReplacementForm, setShowReplacementForm] = useState(false);

  // Unpaid months selection for uploading comprovativo
  const [targetPaymentMonth, setTargetPaymentMonth] = useState<number>(() => {
    const unpaidMonths = [1, 2, 3, 4, 5, 6].filter((mNum) => !member.contributions[mNum]?.paid);
    if (unpaidMonths.includes(currentMonth)) return currentMonth;
    return unpaidMonths.length > 0 ? unpaidMonths[0] : currentMonth;
  });

  React.useEffect(() => {
    setShowReplacementForm(false);
  }, [targetPaymentMonth]);

  // New Password state fields for Member self-redefinition
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordStatus, setPasswordStatus] = useState({ success: '', error: '' });

  // Simulator Calculator State
  const [calcMonthly, setCalcMonthly] = useState<number>(120000);
  const [calcMonths, setCalcMonths] = useState<number>(6);
  const [calcFundoPct, setCalcFundoPct] = useState<number>(16.67);

  const handlePasswordChangeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordStatus({ success: '', error: '' });

    if (!newPassword || newPassword.length < 4) {
      setPasswordStatus({ success: '', error: 'A nova palavra-passe deve conter pelo menos 4 caracteres.' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordStatus({ success: '', error: 'As palavras-passe introduzidas não correspondem.' });
      return;
    }

    const updatedMembers = members.map((m) => {
      if (m.id === member.id) {
        return {
          ...m,
          tempPassword: newPassword,
        };
      }
      return m;
    });

    const newLog: KixLog = {
      id: `membro-pwd-${Date.now()}`,
      timestamp: new Date().toISOString(),
      type: 'cycle_change',
      amount: 0,
      description: `SEGURANÇA ATUALIZADA: O membro de consórcio ${member.name} efetuou a redefinição autónoma da sua própria palavra-passe de acesso.`,
      month: currentMonth,
    };

    const updatedLogs = [newLog, ...logs];
    setMembers(updatedMembers);
    setLogs(updatedLogs);
    saveState(updatedMembers, updatedLogs);

    setNewPassword('');
    setConfirmPassword('');
    setPasswordStatus({ success: 'Palavra-passe de utilizador redefinida com sucesso!', error: '' });
  };

  // Math totals for this specific member
  const paidMonths = Object.keys(member.contributions).filter(
    (monthKey) => member.contributions[Number(monthKey)]?.paid
  ).map(Number);
  
  const totalPaidAmount = Object.keys(member.contributions).reduce((sum, monthKey) => {
    const contr = member.contributions[Number(monthKey)];
    if (contr?.paid) {
      return sum + ((contr as any).amount !== undefined ? (contr as any).amount : 120000);
    }
    return sum;
  }, 0);
  const individualSocialRetained = paidMonths.length * 20000;
  const individualRotationDeposited = totalPaidAmount - individualSocialRetained;

  const isCurrentMonthPaid = member.contributions[currentMonth]?.paid;
  const isTargetMonthPaid = member.contributions[targetPaymentMonth]?.paid;

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-AO', {
      style: 'currency',
      currency: 'AOA',
      minimumFractionDigits: 2,
    })
      .format(val)
      .replace('AOA', 'KZs');
  };

  // 1. Safe date parsing function for PT-AO dates (dd/mm/yyyy)
  const parsePtDate = (dateStr: string): Date | null => {
    try {
      const cleanStr = dateStr.split(' ')[0]; // remove any "(Prorrogado)" or tags
      const parts = cleanStr.split('/');
      if (parts.length === 3) {
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const year = parseInt(parts[2], 10);
        return new Date(year, month, day);
      }
    } catch (e) {
      console.error("Error parsing date:", dateStr, e);
    }
    return null;
  };

  // 2. Identify current date (using mock/current year 2026 based on state context)
  const today = new Date("2026-06-18T00:00:00"); 
  const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  // 3. Compile all alert objects
  interface PaymentAlert {
    id: string;
    type: 'quota' | 'prestacao';
    monthNum?: number;
    loanId?: string;
    title: string;
    description: string;
    dueDateStr: string;
    amount: number;
    diffDays: number;
    urgency: 'high' | 'medium' | 'info';
  }

  const alertsList: PaymentAlert[] = [];

  // Generate Quota Alerts
  [1, 2, 3, 4, 5, 6].forEach((mNum) => {
    const hasPaid = member.contributions[mNum]?.paid;
    if (!hasPaid) {
      const dueDateStr = `15/${String(5 + mNum).padStart(2, '0')}/2026`;
      const dateObj = parsePtDate(dueDateStr);
      if (dateObj) {
        const diffTime = dateObj.getTime() - todayMidnight.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        let urgency: 'high' | 'medium' | 'info' = 'info';
        if (diffDays < 0) urgency = 'high';
        else if (diffDays <= 30) urgency = 'medium';

        // Add to alert list if overdue or upcoming (due soon under 30 days)
        if (diffDays < 0 || diffDays <= 30) {
          alertsList.push({
            id: `quota-${mNum}`,
            type: 'quota',
            monthNum: mNum,
            title: `Quota de Poupança - Mês 0${mNum}`,
            description: diffDays < 0 
              ? `A sua contribuição social para o Mês 0${mNum} está vencida há ${Math.abs(diffDays)} ${Math.abs(diffDays) === 1 ? 'dia' : 'dias'}.` 
              : `A quota regulamentar do Mês 0${mNum} vencerá em ${diffDays} ${diffDays === 1 ? 'dia' : 'dias'}.`,
            dueDateStr,
            amount: 120000,
            diffDays,
            urgency,
          });
        }
      }
    }
  });

  // Generate Credit / Loan Payment Alerts
  const myActiveLoans = (loans || []).filter((l) => {
    const isOwner = (l.memberId === member.id) || 
                    (l.borrowerName && l.borrowerName.toLowerCase().trim() === member.name.toLowerCase().trim()) ||
                    (l.documentId && member.email && l.email.toLowerCase().trim() === member.email.toLowerCase().trim());
    return isOwner && (l.status === 'active' || l.status === 'overdue');
  });

  myActiveLoans.forEach((loan) => {
    loan.payments.forEach((p) => {
      if (!p.paid) {
        const dateObj = parsePtDate(p.dueDate);
        if (dateObj) {
          const diffTime = dateObj.getTime() - todayMidnight.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

          let urgency: 'high' | 'medium' | 'info' = 'info';
          if (diffDays < 0) urgency = 'high';
          else if (diffDays <= 30) urgency = 'medium';

          if (diffDays < 0 || diffDays <= 30) {
            alertsList.push({
              id: `loan-${loan.id}-${p.month}`,
              type: 'prestacao',
              loanId: loan.id,
              monthNum: p.month,
              title: `Amortização de Crédito - Contrato ${loan.id} (Parcela ${p.month})`,
              description: diffDays < 0
                ? `A respectiva prestação (Capital + Juros) está vencida há ${Math.abs(diffDays)} ${Math.abs(diffDays) === 1 ? 'dia' : 'dias'}.`
                : `A parcela contratual nº ${p.month} vencerá em ${diffDays} ${diffDays === 1 ? 'dia' : 'dias'}.`,
              dueDateStr: p.dueDate,
              amount: p.amount,
              diffDays,
              urgency,
            });
          }
        }
      }
    });
  });

  // Sort alerts: most overdue first, then closest to due date
  alertsList.sort((a, b) => a.diffDays - b.diffDays);

  // Drag and drop handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type === "application/pdf" || file.type.startsWith("image/")) {
        setSelectedFile(file);
      } else {
        alert("Por favor anexe apenas arquivos PDF ou imagens de comprovativos.");
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const readAsDataURL = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (e) => reject(e);
      reader.readAsDataURL(file);
    });
  };

  const handleManualUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    setIsUploading(true);
    setSuccessInfo('');

    const fileName = selectedFile.name;
    const fileSize = `${(selectedFile.size / 1024).toFixed(0)} KB`;
    const timestamp = new Date().toISOString();

    try {
      // 1. Convert to Base64 and store in LocalStorage keyed by the contribution ID: memberId_month
      const base64Data = await readAsDataURL(selectedFile);
      const storageKey = `kix_receipt_data_${member.id}_${targetPaymentMonth}`;
      localStorage.setItem(storageKey, base64Data);

      // 2. Set member target month contribution to paid, attaching receipt metadata
      const updatedMembers = members.map((m) => {
        if (m.id === member.id) {
          return {
            ...m,
            contributions: {
              ...m.contributions,
              [targetPaymentMonth]: {
                paid: true,
                paidAt: timestamp,
                receiptFileName: fileName,
                receiptFileSize: fileSize,
                receiptUploadedAt: timestamp,
              },
            },
          };
        }
        return m;
      });

      // 3. Write compliance audit log
      const newLog: KixLog = {
        id: `membro-upload-${Date.now()}`,
        timestamp: timestamp,
        type: 'contribution',
        memberName: member.name,
        amount: 120000,
        description: `Membro ${member.name} realizou o UPLOAD MANUAL de comprovativo ("${fileName}") para o Mês ${targetPaymentMonth}. Ficheiro físico de ${fileSize} guardado localmente e associado à quota do Mês ${targetPaymentMonth}.`,
        month: targetPaymentMonth,
      };

      const updatedLogs = [newLog, ...logs];

      // 4. Sync to central receipts repository (kix_comprovativos) for admin visibility
      const savedReceiptsString = localStorage.getItem('kix_comprovativos');
      let currentReceipts: any[] = [];
      if (savedReceiptsString) {
        try {
          currentReceipts = JSON.parse(savedReceiptsString);
        } catch (err) {
          console.error(err);
        }
      }

      // Remove existing item for this same member & month if any
      currentReceipts = currentReceipts.filter(
        (r) => !(r.detectedMemberId === member.id && r.targetMonth === targetPaymentMonth)
      );

      const newReceiptItem = {
        id: `rec-usr-${Date.now()}`,
        senderPhone: member.phone,
        fileName: fileName,
        fileSize: fileSize,
        timestamp: timestamp,
        detectedMemberName: member.name,
        detectedMemberId: member.id,
        status: 'matched_paid',
        targetMonth: targetPaymentMonth,
        uploadedBy: member.name,
        fileDataUrl: base64Data,
      };

      currentReceipts = [newReceiptItem, ...currentReceipts];
      localStorage.setItem('kix_comprovativos', JSON.stringify(currentReceipts));

      saveReceiptToFirestore(newReceiptItem).catch(e => console.error("Erro ao salvar comprovativo na Firestore:", e));

      // 5. Update parent states and trigger re-saves
      setMembers(updatedMembers);
      setLogs(updatedLogs);
      saveState(updatedMembers, updatedLogs);

      setIsUploading(false);
      setSelectedFile(null);
      setSuccessInfo(`Comprovativo "${fileName}" anexado e verificado! Sua quota do Mês ${targetPaymentMonth} foi atualizada com sucesso para "Pago" e salva no sistema local.`);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      console.error('Erro no upload de comprovativo:', err);
      setIsUploading(false);
      alert('Erro ao carregar o comprovativo. Por favor tente novamente com um ficheiro menor.');
    }
  };

  return (
    <div className="space-y-8" id="member-workspace-panel">
      
      {/* Dynamic Personalized Header Card - Inspired by Image 2 */}
      <div className="bg-[#050e0f] text-slate-100 rounded-3xl border border-slate-800/80 p-8 relative overflow-hidden shadow-xl" id="member-card-credential-profile">
        {/* Subtle background glow */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/5 rounded-bl-full pointer-events-none -z-5" />
        
        {/* Centered Top Badge */}
        <div className="flex justify-center md:justify-start mb-6">
          <span className="px-3 py-1 rounded-full border border-emerald-500/30 bg-emerald-950/60 text-[9px] font-black text-emerald-400 uppercase tracking-widest">
            Membro do Consórcio
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start relative z-10 text-left">
          
          {/* LEFT: Avatar / Profile Photo Container */}
          <div className="lg:col-span-3 flex flex-col items-center justify-center relative shrink-0">
            <div className="relative">
              {member.avatarImage ? (
                <img
                  src={member.avatarImage}
                  alt={member.name}
                  referrerPolicy="no-referrer"
                  className="w-24 h-24 rounded-3xl object-cover bg-slate-900 border-2 border-emerald-500/40"
                />
              ) : (
                <div
                  className="w-24 h-24 rounded-3xl flex items-center justify-center font-black text-white text-3xl bg-gradient-to-tr from-[#e11d48] to-[#db2777] border-2 border-slate-800 shadow-lg"
                >
                  {member.name
                    .split(' ')
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join('')}
                </div>
              )}
              {/* Shield lock icon badge overlay on bottom right, conforming to Image 2 */}
              <div className="absolute -bottom-2 -right-2 bg-[#022c22] text-[#10B981] p-2 rounded-2xl border-2 border-[#050e0f] shadow-md">
                <svg className="w-5 h-5 fill-none stroke-current" viewBox="0 0 24 24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  <rect x="9" y="11" width="6" height="5" rx="1" ry="1" />
                  <path d="M10 11V9a2 2 0 1 1 4 0v2" />
                </svg>
              </div>
            </div>
          </div>

          {/* MIDDLE LEFT: Name and Identifier Checklist */}
          <div className="lg:col-span-5 space-y-4">
            <div>
              <h2 className="text-xl md:text-2xl font-black text-white tracking-tight">{member.name}</h2>
            </div>

            {/* Identificação de Membro Box */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                <span>Identificação de Membro</span>
                <div className="h-[2px] bg-gradient-to-r from-emerald-500/40 to-transparent flex-1" />
              </div>

              <div className="space-y-1.5 text-xs text-slate-350">
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 font-medium">ID de Membro:</span>
                  <span className="font-mono text-[10.5px] font-black text-[#10b981] bg-[#10b981]/10 border border-[#10b981]/20 px-2 py-0.5 rounded uppercase">
                    {getMemberDisplayCode(member.id)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">Soma de verificação:</span>{' '}
                  <span className="font-mono font-bold text-white select-all">
                    {getMemberIdCode(member.name, member.phone)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">Seq:</span>{' '}
                  <span className="font-mono font-black text-white">#0 {member.id}</span>
                </div>
              </div>
            </div>
          </div>

          {/* MIDDLE RIGHT: Agendamento de Contemplações card */}
          <div className="lg:col-span-4 space-y-6 flex flex-col justify-between h-full">
            
            {/* Outline Card for Scheduling */}
            <div className="border border-slate-800 bg-[#0d1e1f]/30 rounded-2xl p-4 space-y-3.5">
              <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                <span>Agendamento para Contemplação</span>
                <div className="h-[2px] bg-gradient-to-r from-emerald-500/40 to-transparent flex-1" />
              </div>

              <div className="flex gap-2.5 items-start">
                <div className="p-1.5 bg-emerald-950/50 rounded-lg text-emerald-400 shrink-0 mt-0.5">
                  <svg className="w-5 h-5 text-[#10B981]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                    <polyline points="8 14 10 16 14 12" />
                  </svg>
                </div>
                <div className="text-left">
                  {member.assignedMonth > 0 ? (
                    <>
                      <p className="text-xs font-black text-white uppercase tracking-wide">
                        Agendado para: <span className="text-emerald-455 italic">Mês 0{member.assignedMonth}</span>
                      </p>
                      <p className="text-[10px] text-slate-500 italic mt-0.5">
                        [mês planeado no consórcio]*
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-xs font-black text-slate-400 uppercase tracking-wide">
                        Agendado para: <span className="text-rose-455 italic">*Não mês*</span>
                      </p>
                      <p className="text-[10px] text-slate-500 italic mt-0.5">
                        [mês not scheduled]*
                      </p>
                    </>
                  )}
                </div>
              </div>
            </div>

          </div>

        </div>

        {/* Divider separator */}
        <div className="h-[1px] bg-slate-800/80 my-6" />

        {/* BOTTOM SECTION OF THE CARD: Contact and IBAN coordinates */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start relative z-10 text-left">
          {/* Dados de contato */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">
              <span>Dados de Contato</span>
              <div className="h-[2px] bg-gradient-to-r from-emerald-500/40 to-transparent flex-1" />
            </div>
            <div className="space-y-1.5 text-xs">
              <p className="text-slate-350">
                <span className="text-slate-455 font-medium">Telefone:</span>{' '}
                <span className="font-mono text-white tracking-wider font-semibold">{member.phone}</span>
              </p>
              <p className="text-slate-350">
                <span className="text-slate-455 font-medium">E-mail:</span>{' '}
                <a href={`mailto:${member.email}`} className="font-mono text-teal-400 hover:text-teal-300 underline select-all">
                  {member.email}
                </a>
              </p>
            </div>
          </div>

          {/* IBAN Coordinates container */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">
              <span>Coordenadas para Recebimento (IBAN)</span>
              <div className="h-[2px] bg-gradient-to-r from-emerald-500/40 to-transparent flex-1" />
            </div>

            {/* Clickable dark copy block */}
            <div 
              onClick={() => {
                if (member.bankIban) {
                  navigator.clipboard.writeText(member.bankIban);
                  const btn = document.getElementById('iban-copy-indicator');
                  if (btn) {
                    btn.innerText = 'Copiado!';
                    setTimeout(() => { btn.innerText = 'Copiar'; }, 2000);
                  }
                }
              }}
              title="Clique para copiar o IBAN cooperativo"
              className="flex items-center justify-between bg-[#041a1a]/80 border border-emerald-950/40 hover:bg-[#072424] px-4 py-2.5 rounded-xl cursor-pointer transition-colors group"
            >
              <span className="font-mono text-sm font-extrabold text-[#10B981] tracking-widest select-all">
                {member.bankIban || 'NÃO CONFIGURADO'}
              </span>
              <div className="flex items-center gap-1 text-[10px] uppercase font-black text-slate-500 group-hover:text-emerald-400 transition-colors shrink-0 pl-2">
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                  <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
                </svg>
                <span id="iban-copy-indicator">Copiar</span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Grid line cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Metric 1 */}
        <div className="bg-white dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800/80 p-5 shadow-sm space-y-1">
          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-550 uppercase tracking-wider block">
            Suas Contribuições Totais
          </span>
          <p className="text-2xl font-black font-mono text-slate-800 dark:text-white">{formatCurrency(totalPaidAmount)}</p>
          <span className="text-[10px] text-slate-550 dark:text-slate-455 block">
            {paidMonths.length} parcelas mensais liquidadas
          </span>
        </div>

        {/* Metric 2 */}
        <div className="bg-white dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800/80 p-5 shadow-sm space-y-1">
          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-555 uppercase tracking-wider block">
            Retido p/ Poupança Interajuda
          </span>
          <p className="text-2xl font-black font-mono text-emerald-700 dark:text-emerald-400">{formatCurrency(individualSocialRetained)}</p>
          <span className="text-[10px] text-slate-500 dark:text-slate-455 block">
            Sua contribuição individual ao fundo social
          </span>
        </div>

        {/* Metric 3 */}
        <div className="bg-white dark:bg-slate-900/60 rounded-xl border border-slate-250 dark:border-slate-800/80 p-5 bg-gradient-to-br from-indigo-50/20 to-sky-50/20 dark:from-indigo-950/5 dark:to-sky-950/5 shadow-sm space-y-1">
          <span className="text-[10px] font-bold text-indigo-700 dark:text-indigo-400 uppercase tracking-wider block">
            Seu Status de Rotação
          </span>
          {member.assignedMonth < currentMonth ? (
            <div>
              <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">LIQUIDADO</p>
              <span className="text-[10px] text-slate-555 dark:text-slate-400">600.000,00 KZs recebidos no Mês {member.assignedMonth}</span>
            </div>
          ) : member.assignedMonth === currentMonth ? (
            <div className="animate-pulse">
              <p className="text-2xl font-black text-emerald-500">ROTAÇÃO ATIVA</p>
              <span className="text-[10px] text-slate-555 dark:text-slate-400">Benefício disponível para repasse do Mês {currentMonth}</span>
            </div>
          ) : (
            <div>
              <p className="text-2xl font-black text-slate-400 dark:text-slate-550">AGENDADO</p>
              <span className="text-[10px] text-slate-555 dark:text-slate-400">Programado p/ receber no Mês {member.assignedMonth}</span>
            </div>
          )}
        </div>

      </div>

      {/* 🔔 SISTEMA DE ALERTA VISUAL DE ASSIDUIDADE (QUOTAS E EMPRÉSTIMOS) */}
      <div className="bg-white dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800/80 p-5 shadow-sm space-y-4 text-left">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 rounded-lg">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-sans font-extrabold text-[#1e293b] dark:text-white text-xs uppercase tracking-wider text-left">
                Notificações de Compromissos Fiduciários
              </h3>
              <p className="text-[10px] text-slate-400 font-sans text-left">
                Monitorização contínua de prazos para proteção de score de crédito cooperativo.
              </p>
            </div>
          </div>
          {alertsList.length > 0 && (
            <span className="text-[9px] font-black uppercase text-white bg-amber-500 hover:bg-amber-600 px-2.5 py-1 rounded-full select-none">
              {alertsList.filter(a => a.urgency === 'high').length} Crítico(s)
            </span>
          )}
        </div>

        {alertsList.length === 0 ? (
          <div className="flex items-center gap-3 bg-emerald-50/30 dark:bg-[#04211a]/20 border border-emerald-150/40 dark:border-[#04211a]/40 p-4 rounded-xl text-left">
            <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <strong className="text-emerald-800 dark:text-emerald-450 font-extrabold block text-[11px] uppercase tracking-wide">Tudo em Conformidade!</strong>
              <span className="text-[10px] text-slate-400 block mt-0.5 leading-relaxed font-sans">
                Parabéns, {member.name}! O seu mapa de assiduidade de quotas de poupança interajuda e prestações de crédito amortizante encontra-se a 100% regularitário e sem pendências até à presente data.
              </span>
            </div>
          </div>
        ) : (
          <div className="space-y-2.5">
            {alertsList.map((alert) => {
              const isOverdue = alert.diffDays < 0;
              const isQuota = alert.type === 'quota';

              return (
                <div 
                  key={alert.id}
                  className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 rounded-xl border transition-all text-left ${
                    alert.urgency === 'high'
                      ? 'bg-rose-50/35 dark:bg-rose-950/10 border-rose-200/40 text-rose-800 dark:text-rose-400'
                      : 'bg-amber-50/35 dark:bg-amber-950/10 border-amber-200/40 text-amber-800 dark:text-amber-400'
                  }`}
                >
                  <div className="flex items-start gap-2.5 min-w-0">
                    <div className={`p-2 rounded-lg shrink-0 mt-0.5 ${
                      alert.urgency === 'high'
                        ? 'bg-rose-100/60 dark:bg-rose-950/40 text-rose-600'
                        : 'bg-amber-100/60 dark:bg-amber-950/40 text-amber-600'
                    }`}>
                      <AlertTriangle className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                        <span className="text-[11px] font-black uppercase tracking-wide text-slate-800 dark:text-white block">
                          {alert.title}
                        </span>
                        <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded font-mono ${
                          alert.urgency === 'high'
                            ? 'bg-rose-100 dark:bg-rose-900/30 text-rose-700'
                            : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700'
                        }`}>
                          {isOverdue 
                            ? `Vencido há ${Math.abs(alert.diffDays)} ${Math.abs(alert.diffDays) === 1 ? 'dia' : 'dias'}` 
                            : `Vence em ${alert.diffDays} ${alert.diffDays === 1 ? 'dia' : 'dias'}`
                          }
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-1 leading-relaxed max-w-3xl font-sans">
                        {alert.description} 
                        {isQuota ? ' Regularizar carregando o respetivo comprovativo abaixo.' : ' Por favor, proceda à amortização e pagamento junto da gerência cooperativa.'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 w-full sm:w-auto justify-end border-t sm:border-t-0 border-slate-100 pt-2.5 sm:pt-0">
                    <div className="text-right">
                      <span className="text-[9px] text-slate-400 block uppercase font-bold">Valor Total</span>
                      <strong className="text-xs font-mono font-black text-slate-805 dark:text-white">
                        {formatCurrency(alert.amount)}
                      </strong>
                    </div>
                    {isQuota && (
                      <button
                        type="button"
                        onClick={() => {
                          if (alert.monthNum) {
                            setTargetPaymentMonth(alert.monthNum);
                            const element = document.getElementById('manual-pdf-upload') || document.getElementById('member-workspace-panel');
                            if (element) {
                              element.scrollIntoView({ behavior: 'smooth' });
                            }
                          }
                        }}
                        className={`px-3 py-1.5 text-[10px] font-bold uppercase rounded-lg transition-all focus:ring-2 cursor-pointer ${
                          alert.urgency === 'high'
                            ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-sm focus:ring-rose-500/35'
                            : 'bg-amber-600 hover:bg-amber-750 text-white shadow-sm focus:ring-amber-500/35'
                        }`}
                      >
                        Pagar Agora
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Body Core Workspace columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Quotas status table calendar */}
        <div className="lg:col-span-6 bg-white dark:bg-slate-900/40 rounded-xl border border-slate-200 dark:border-slate-800/60 p-5 shadow-sm space-y-5">
          <div>
            <h3 className="font-display font-medium text-slate-800 dark:text-white text-sm tracking-wide uppercase">
              Seu Calendário Pessoal de Quotas (6 Meses)
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Clique em qualquer mês para selecionar e enviar o comprovativo correspondente. Suas parcelas são de 120.000,00 KZs.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 pt-2">
            {[1, 2, 3, 4, 5, 6].map((mNum) => {
              const hasPaid = member.contributions[mNum]?.paid;
              const isCurrent = mNum === currentMonth;
              const isSelectedForPayment = mNum === targetPaymentMonth;

              return (
                <div 
                  key={mNum}
                  onClick={() => setTargetPaymentMonth(mNum)}
                  className={`border rounded-xl p-3.5 space-y-2 text-center transition-all cursor-pointer ${
                    isSelectedForPayment
                      ? 'border-emerald-500 bg-emerald-50/10 dark:bg-emerald-950/10 shadow-sm ring-2 ring-emerald-500/30'
                      : isCurrent 
                      ? 'border-emerald-300 bg-emerald-50/10 dark:bg-emerald-950/10 shadow-sm ring-1 ring-emerald-300/40' 
                      : 'border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 hover:bg-slate-50/80 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 block uppercase tracking-wider">
                    Mês 0{mNum} {isCurrent && '(Corrente)'}
                  </span>
                  
                  <p className="text-[11px] font-mono font-bold text-slate-700 dark:text-slate-200">120.000,00 Kz</p>

                  <div className="pt-1 flex justify-center">
                    {hasPaid ? (
                      <span className="text-[9px] font-bold bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-100 dark:border-emerald-900/30 flex items-center gap-1">
                        <CheckCircle className="w-3 h-3 text-emerald-500" />
                        PAGO
                      </span>
                    ) : (
                      <span className="text-[9px] font-bold bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400 px-2 py-0.5 rounded-full border border-rose-100 dark:border-rose-900/30 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-rose-500" />
                        PENDENTE
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Upload form for manual PDF/Vouchers */}
        <div className="lg:col-span-6 bg-white dark:bg-slate-900/40 rounded-xl border border-slate-200 dark:border-slate-800/60 p-5 shadow-sm space-y-4">
          <div>
            <h3 className="font-display font-medium text-emerald-600 dark:text-emerald-450 text-sm tracking-wide uppercase flex items-center gap-2">
              <UploadCloud className="w-4 h-4 text-emerald-500" />
              Enviar Comprovativo do Mês 0{targetPaymentMonth}
            </h3>
            <p className="text-xs text-slate-400 mt-1 font-sans">
              Ao anexar seu recibo de 120.000,00 KZs (PDF de banco, BFA, BAI, etc.), o sistema guardará o comprovativo localmente de forma segura.
            </p>
          </div>

          {isTargetMonthPaid && !showReplacementForm ? (
            <div className="space-y-4">
              <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 rounded-xl p-5 text-center space-y-3">
                <ShieldCheck className="w-10 h-10 text-emerald-600 dark:text-emerald-455 mx-auto animate-bounce" />
                <div>
                  <h4 className="text-xs font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-widest text-center">
                    Quota do Mês 0{targetPaymentMonth} Liquidada!
                  </h4>
                  <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-1 leading-relaxed max-w-sm mx-auto font-sans">
                    Sua contribuição correspondente de 120.000,00 KZs para este mês já se encontra quitada no sistema e devidamente registrada. Caso precise, pode escolher outro mês ao lado para carregar novos pagamentos.
                  </p>
                </div>
              </div>

              {/* Local Receipt Details and download access */}
              {(() => {
                const localBase64 = localStorage.getItem(`kix_receipt_data_${member.id}_${targetPaymentMonth}`);
                const localName = member.contributions[targetPaymentMonth]?.receiptFileName || `comprovativo_mes_0${targetPaymentMonth}.pdf`;
                const localSize = member.contributions[targetPaymentMonth]?.receiptFileSize || "N/A";
                const localUploadedAt = member.contributions[targetPaymentMonth]?.receiptUploadedAt;

                if (localBase64) {
                  return (
                    <div className="bg-slate-50 dark:bg-slate-900 border border-slate-205 rounded-xl p-4 space-y-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <FileText className="w-5 h-5 text-indigo-600 shrink-0" />
                          <div className="min-w-0">
                            <span className="text-xs font-bold text-slate-800 dark:text-white block truncate max-w-[220px]" title={localName}>
                              {localName}
                            </span>
                            <span className="text-[10px] text-slate-400 block font-semibold font-mono">
                              Tamanho: {localSize} {localUploadedAt && `| ${new Date(localUploadedAt).toLocaleDateString()}`}
                            </span>
                          </div>
                        </div>
                        <a 
                          href={localBase64}
                          download={localName}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition text-[10px] uppercase shadow-sm cursor-pointer shrink-0"
                        >
                          <Download className="w-3.5 h-3.5" /> Descarregar
                        </a>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowReplacementForm(true)}
                        className="w-full text-center py-2 border border-dashed border-slate-300 hover:border-slate-400 rounded-lg text-slate-600 hover:text-slate-800 text-[11px] font-bold transition-all cursor-pointer"
                      >
                        🔄 Substituir Comprovativo Arquivado Localmente
                      </button>
                    </div>
                  );
                } else {
                  return (
                    <div className="bg-slate-50 dark:bg-slate-900 border border-slate-205 rounded-xl p-4 text-center space-y-2.5">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        📁 Ficheiro no Servidor:
                      </p>
                      <span className="text-xs text-slate-500 font-sans leading-relaxed block max-w-md mx-auto">
                        Nenhum comprovativo físico foi arquivado localmente neste navegador para este mês específico. Se desejar, pode registar uma cópia do recibo eletrónico agora.
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowReplacementForm(true)}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold uppercase rounded-lg transition-all shadow-sm cursor-pointer"
                      >
                        Anexar Comprovativo Local
                      </button>
                    </div>
                  );
                }
              })()}
            </div>
          ) : (
            <form onSubmit={handleManualUploadSubmit} className="space-y-4">
              
              {/* Drag Area */}
              <div
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all ${
                  dragActive 
                    ? 'border-emerald-500 bg-emerald-50/10' 
                    : 'border-slate-105 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-300'
                }`}
              >
                <UploadCloud className="w-8 h-8 text-indigo-650 mx-auto mb-2 animate-pulse" />
                <span className="font-bold text-slate-600 block text-xs">
                  {selectedFile ? selectedFile.name : `Clique para selecionar ou arraste o comprovativo do Mês 0${targetPaymentMonth}`}
                </span>
                <span className="text-[10px] text-slate-400 block mt-1 font-medium">
                  PDF ou Imagem menor de 5MB. O arquivo será guardado localmente de forma segura.
                </span>
              </div>

              <input
                target-id="manual-pdf-upload"
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="application/pdf,image/*"
                className="hidden"
              />

              {selectedFile && (
                <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  <span className="text-xs text-slate-600 truncate max-w-xs font-mono">
                    📄 {selectedFile.name} ({(selectedFile.size / 1024).toFixed(0)} KB)
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedFile(null)}
                    className="text-rose-500 font-bold hover:underline text-xs"
                  >
                    Remover
                  </button>
                </div>
              )}

              <div className="flex gap-2">
                {isTargetMonthPaid && (
                  <button
                    type="button"
                    onClick={() => setShowReplacementForm(false)}
                    className="py-3 px-4 rounded-lg font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 uppercase tracking-wider text-xs transition-all cursor-pointer"
                  >
                    Voltar
                  </button>
                )}
                <button
                  type="submit"
                  disabled={!selectedFile || isUploading}
                  className={`flex-1 py-3 px-4 rounded-lg font-bold text-white uppercase tracking-wider text-xs transition-all flex items-center justify-center gap-2 ${
                    isUploading 
                      ? 'bg-slate-700 cursor-wait' 
                      : !selectedFile 
                      ? 'bg-slate-200 text-slate-400 border border-slate-300 cursor-not-allowed'
                      : 'bg-[#4F46E5] hover:bg-[#4338CA] shadow-sm cursor-pointer'
                  }`}
                >
                  {isUploading ? `Enviando comprovativo...` : `Enviar Comprovativo do Mês 0${targetPaymentMonth}`}
                </button>
              </div>

            </form>
          )}

          <AnimatePresence>
            {successInfo && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="bg-emerald-50 text-emerald-800 border border-emerald-100 p-3.5 rounded-lg flex items-start gap-2 text-xs leading-normal"
              >
                <CheckCircle className="w-5 h-5 shrink-0 text-emerald-600" />
                <span>{successInfo}</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>

      {/* Seção Inferior: Simulador de Poupança & Segurança da Conta */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Simulador de Acumulação e Impacto Social */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900/40 rounded-xl border border-slate-200 dark:border-slate-800/60 p-6 shadow-sm space-y-6">
          <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100 dark:border-slate-800">
            <div className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-slate-950/40 text-emerald-600 flex items-center justify-center shadow-inner">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-sans font-bold text-slate-800 dark:text-white text-sm uppercase tracking-wide">
                Simulador de Poupança & Apoio Social
              </h3>
              <p className="text-[11px] text-slate-400 font-sans">
                Estime o acúmulo da sua poupança de rotação e reservas de interajuda comunitária.
              </p>
            </div>
          </div>

          <div className="space-y-4 font-sans">
            {/* Control 1: Contribuição Mensal */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-500 uppercase tracking-wide text-[10px]">Contribuição Mensal Total</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                  {formatCurrency(calcMonthly)}
                </span>
              </div>
              <input
                type="range"
                min="10000"
                max="500000"
                step="10000"
                value={calcMonthly}
                onChange={(e) => setCalcMonthly(Number(e.target.value))}
                className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setCalcMonthly(60000)}
                  className={`text-[9px] font-bold px-2 py-1 rounded border transition-colors cursor-pointer ${
                    calcMonthly === 60000 
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm' 
                      : 'bg-white dark:bg-slate-900/60 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  60.000 Kz (Meia Quota)
                </button>
                <button
                  type="button"
                  onClick={() => setCalcMonthly(120000)}
                  className={`text-[9px] font-bold px-2 py-1 rounded border transition-colors cursor-pointer ${
                    calcMonthly === 120000 
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm' 
                      : 'bg-white dark:bg-slate-900/60 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  120.000 Kz (Padrão)
                </button>
                <button
                  type="button"
                  onClick={() => setCalcMonthly(240000)}
                  className={`text-[9px] font-bold px-2 py-1 rounded border transition-colors cursor-pointer ${
                    calcMonthly === 240000 
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm' 
                      : 'bg-white dark:bg-slate-900/60 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  240.000 Kz (Quota Dupla)
                </button>
              </div>
            </div>

            {/* Control 2: Período em Meses */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-500 uppercase tracking-wide text-[10px]">Duração da Contribuição (Período)</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-250 dark:border-slate-800">
                  {calcMonths} {calcMonths === 1 ? 'Mês' : 'Meses'}
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="24"
                step="1"
                value={calcMonths}
                onChange={(e) => setCalcMonths(Number(e.target.value))}
                className="w-full h-2 bg-slate-100 dark:bg-slate-850 rounded-lg appearance-none cursor-pointer accent-emerald-600"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setCalcMonths(6)}
                  className={`text-[9px] font-bold px-2.5 py-1 rounded border transition-colors cursor-pointer ${
                    calcMonths === 6 
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm' 
                      : 'bg-white dark:bg-slate-900/60 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  6 Meses (Ciclo)
                </button>
                <button
                  type="button"
                  onClick={() => setCalcMonths(12)}
                  className={`text-[9px] font-bold px-2.5 py-1 rounded border transition-colors cursor-pointer ${
                    calcMonths === 12 
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm' 
                      : 'bg-white dark:bg-slate-900/60 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  12 Meses (1 Ano)
                </button>
                <button
                  type="button"
                  onClick={() => setCalcMonths(24)}
                  className={`text-[9px] font-bold px-2.5 py-1 rounded border transition-colors cursor-pointer ${
                    calcMonths === 24 
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm' 
                      : 'bg-white dark:bg-slate-900/60 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  24 Meses (2 Anos)
                </button>
              </div>
            </div>

            {/* Control 3: Percentagem Fundo de Proteção Interajuda */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-500 uppercase tracking-wide text-[10px]">Percentagem destinada ao Fundo de Interajuda</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-250 dark:border-slate-800">
                  {calcFundoPct.toFixed(2)}%
                </span>
              </div>
              <input
                type="range"
                min="5"
                max="30"
                step="0.5"
                value={calcFundoPct}
                onChange={(e) => setCalcFundoPct(Number(e.target.value))}
                className="w-full h-2 bg-slate-100 dark:bg-slate-850 rounded-lg appearance-none cursor-pointer accent-emerald-600"
              />
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>Min: 5%</span>
                <button
                  type="button"
                  onClick={() => setCalcFundoPct(16.67)}
                  className="text-[9.5px] font-extrabold px-3 py-1 rounded-full text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/25 border border-emerald-200 dark:border-emerald-800/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors cursor-pointer"
                >
                  Restaurar Padrão Kixi-Fundo (16.67%)
                </button>
                <span>Max: 30%</span>
              </div>
            </div>

            {/* Visual breakdown ratio progress bar */}
            <div className="pt-2">
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1.5">Distribuição Proporcional</span>
              <div className="w-full h-5 rounded-full overflow-hidden flex shadow-inner border border-slate-150 dark:border-slate-800">
                <div 
                  style={{ width: `${100 - calcFundoPct}%` }}
                  className="bg-emerald-600 flex items-center justify-center text-white text-[9px] font-black"
                  title="Fundo de Rotação"
                >
                  {calcFundoPct < 85 && `${(100 - calcFundoPct).toFixed(0)}% Rotação`}
                </div>
                <div 
                  style={{ width: `${calcFundoPct}%` }}
                  className="bg-amber-500 flex items-center justify-center text-slate-950 text-[9px] font-black"
                  title="Fundo de Interajuda"
                >
                  {calcFundoPct > 10 && `${calcFundoPct.toFixed(0)}% Social`}
                </div>
              </div>
            </div>

            {/* Numerical Results Block */}
            <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-xl border border-slate-150 dark:border-slate-800/60 grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
              <div className="space-y-1">
                <span className="text-[10px] text-slate-450 dark:text-slate-500 font-bold uppercase tracking-wider block">Total Bruto Estimado</span>
                <p className="text-sm font-extrabold text-slate-800 dark:text-white font-mono">
                  {formatCurrency(calcMonthly * calcMonths)}
                </p>
                <span className="text-[9px] text-slate-550 dark:text-slate-450 block">Acumulação total ao fim de {calcMonths} meses.</span>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] text-emerald-600 dark:text-emerald-450 font-bold uppercase tracking-wider block">Acumulação em Rotação (Consórcio)</span>
                <p className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
                  {formatCurrency((calcMonthly * calcMonths) * (1 - calcFundoPct / 100))}
                </p>
                <span className="text-[9px] text-slate-550 dark:text-slate-450 block">Fundo poupado e redistribuído em sorteios rotativos.</span>
              </div>

              <div className="space-y-1 border-t border-slate-150 dark:border-slate-800/80 pt-2.5">
                <span className="text-[10px] text-amber-600 dark:text-amber-500 font-bold uppercase tracking-wider block">Retenção Fundo Social (Interajuda)</span>
                <p className="text-sm font-extrabold text-amber-600 dark:text-amber-400 font-mono">
                  {formatCurrency((calcMonthly * calcMonths) * (calcFundoPct / 100))}
                </p>
                <span className="text-[9px] text-slate-550 dark:text-slate-450 block">Previsão acumulada para apoio de emergência coletivo.</span>
              </div>

              <div className="space-y-1 border-t border-slate-150 dark:border-slate-800/80 pt-2.5">
                <span className="text-[10px] text-emerald-650 dark:text-emerald-450 font-bold uppercase tracking-wider block flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                  Apoio Emergencial Elegível
                </span>
                <p className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
                  {formatCurrency((calcMonthly * calcMonths) * (calcFundoPct / 100) * 3)}
                </p>
                <span className="text-[9px] text-slate-550 dark:text-slate-455 block">Até 3x o acumulado social em caso de infortúnio coberto.</span>
              </div>
            </div>

            {/* Informational Box */}
            <div className="bg-emerald-50/40 dark:bg-slate-900/40 border border-emerald-100 dark:border-emerald-950/60 rounded-xl p-3 flex gap-2.5 items-start mt-2">
              <HeartHandshake className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <p className="text-[10px] leading-relaxed text-emerald-950 dark:text-emerald-200 font-medium font-sans">
                <strong>Força do Modelo de Ajuda Mútua:</strong> Ao contrário dos bancos comerciais onde as taxas de serviço enriquecem a instituição, no <strong>Kixi-Fundo</strong> o fundo social de interajuda fica sob custódia da própria comunidade. Ele garante amparo real contra sinistros, saúde e perdas, retornando em benefícios de resiliência mútua incomparáveis.
              </p>
            </div>
          </div>
        </div>

        {/* Redefinição de Palavra-passe de Segurança */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900/40 rounded-xl border border-slate-200 dark:border-slate-800/60 p-6 shadow-sm flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-slate-950/40 text-emerald-600 flex items-center justify-center shadow-inner">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-sans font-bold text-slate-800 dark:text-white text-sm uppercase tracking-wide">
                  Segurança da Conta
                </h3>
                <p className="text-[11px] text-slate-400 font-sans">
                  Redefina a sua palavra-passe de acesso ao painel.
                </p>
              </div>
            </div>
            
            <p className="text-[11px] text-slate-400 leading-relaxed font-sans mt-1">
              Mantenha o seu acesso cooperativo perfeitamente guardado. Ao atualizar a sua palabra-passe de segurança autónoma, apenas os seus dispositivos com sessão activa ou autorizados terão acesso imediato.
            </p>

            <form onSubmit={handlePasswordChangeSubmit} className="space-y-4 pt-1 font-sans">
              <div className="space-y-3.5">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Nova Palavra-passe
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Introduza a nova palavra-passe"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full text-xs p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white focus:outline-none focus:border-emerald-500 font-sans"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Confirmar Palavra-passe
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Repita a palavra-passe"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full text-xs p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white focus:outline-none focus:border-emerald-500 font-sans"
                  />
                </div>
              </div>

              {passwordStatus.success && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-350 border border-emerald-100 dark:border-emerald-900/35 rounded-lg text-xs font-semibold">
                  {passwordStatus.success}
                </div>
              )}

              {passwordStatus.error && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/20 text-rose-800 dark:text-rose-350 border border-rose-100 dark:border-rose-900/35 rounded-lg text-xs font-semibold">
                  {passwordStatus.error}
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-emerald-500/10 cursor-pointer uppercase tracking-widest"
              >
                Atualizar Palavra-passe
              </button>
            </form>
          </div>
        </div>

      </div>

    </div>
  );
}

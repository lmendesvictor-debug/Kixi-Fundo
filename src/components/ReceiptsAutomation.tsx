import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  UploadCloud,
  FileCheck,
  Phone,
  MessageSquare,
  FolderOpen,
  Download,
  ShieldCheck,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  FileText,
  UserCheck,
  Calendar,
  Sparkles,
  User,
  Info,
  Printer,
  BellRing,
  CheckSquare,
  XCircle
} from 'lucide-react';
import { Member, KixLog } from '../types';
import { saveReceiptToFirestore, loadReceiptsFromFirestore, deleteReceiptFromFirestore } from '../firebaseSync';
import PrintConfigModal, { PrintConfig } from './PrintConfigModal';

interface Receipt {
  id: string;
  senderPhone: string;
  fileName: string;
  fileSize: string;
  timestamp: string;
  detectedMemberName: string;
  detectedMemberId: number | null;
  status: 'matched_paid' | 'unmatched_pending' | 'manually_matched' | 'pending_admin_validation';
  targetMonth: number;
  uploadedBy: string;
  fileDataUrl?: string; // actual uploaded file data URL (base64)
  auditStatus?: 'passed' | 'failed';
  auditDetails?: string;
  detectedAmount?: number;
  detectedMonth?: number;
}

interface ReceiptsAutomationProps {
  currentMonth: number;
  members: Member[];
  onToggleContribution: (memberId: number) => void;
  logs: KixLog[];
  setMembers: React.Dispatch<React.SetStateAction<Member[]>>;
  setLogs: React.Dispatch<React.SetStateAction<KixLog[]>>;
  saveState: (newMembers: Member[], newLogs: KixLog[]) => void;
  currentUser: any;
}

export default function ReceiptsAutomation({
  currentMonth,
  members,
  onToggleContribution,
  logs,
  setMembers,
  setLogs,
  saveState,
  currentUser,
}: ReceiptsAutomationProps) {
  // State for print modal and config
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  // Load existing receipts from localStorage or fallback to empty state
  const [receiptsList, setReceiptsList] = useState<Receipt[]>(() => {
    const saved = localStorage.getItem('kix_comprovativos');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Falha ao parsear comprovativos:', e);
      }
    }
    return [];
  });

  // Target values for forms
  const [targetMemberId, setTargetMemberId] = useState<number>(() => {
    if (currentUser?.role === 'membro') {
      const match = members.find((m) => m.email.toLowerCase() === currentUser.email.toLowerCase());
      return match ? match.id : 1;
    }
    return 1;
  });
  const [targetMonth, setTargetMonth] = useState<number>(currentMonth);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileBase64, setFileBase64] = useState<string>('');
  
  // Simulated OCR variables for Audit Rules
  const [simulatedPdfAmount, setSimulatedPdfAmount] = useState<number>(120000);
  const [simulatedPdfMonth, setSimulatedPdfMonth] = useState<number>(targetMonth);

  // States for interactive Association Prompt (Membro A vs Membro B)
  const [showAssociationPrompt, setShowAssociationPrompt] = useState<boolean>(false);
  const [candidateMemberA, setCandidateMemberA] = useState<Member | null>(null);
  const [candidateMemberB, setCandidateMemberB] = useState<Member | null>(null);

  useEffect(() => {
    setSimulatedPdfMonth(targetMonth);
  }, [targetMonth]);
  
  // Google Drive / OneDrive dynamic folder links
  const [cloudFolderUrl, setCloudFolderUrl] = useState<string>(() => {
    return localStorage.getItem('kix_cloud_folder_url') || 'https://drive.google.com/drive/search?q=Kix_Fundo';
  });
  const [isEditingCloudUrl, setIsEditingCloudUrl] = useState<boolean>(false);
  const [cloudUrlInput, setCloudUrlInput] = useState<string>(cloudFolderUrl);

  // Custom simulator states
  const [simulatedPhone, setSimulatedPhone] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Persist receipts
  useEffect(() => {
    localStorage.setItem('kix_comprovativos', JSON.stringify(receiptsList));
  }, [receiptsList]);

  // Load and sync from Firestore on mount
  useEffect(() => {
    loadReceiptsFromFirestore().then((remoteReceipts) => {
      if (remoteReceipts && remoteReceipts.length > 0) {
        const normalized: Receipt[] = remoteReceipts.map((r: any) => {
          if (r.memberId && !r.detectedMemberId) {
            return {
              id: r.id,
              senderPhone: '+244 900 000 000',
              fileName: r.fileName,
              fileSize: r.fileSize,
              timestamp: r.uploadedAt || r.timestamp || new Date().toISOString(),
              detectedMemberName: r.memberName,
              detectedMemberId: r.memberId,
              status: 'matched_paid',
              targetMonth: r.month || 1,
              uploadedBy: r.source || 'Upload Administrador',
              fileDataUrl: r.fileDataUrl
            };
          }
          return r;
        });

        setReceiptsList((prev) => {
          const merged = [...prev];
          normalized.forEach((r) => {
            if (!merged.some((m) => m.id === r.id)) {
              merged.push(r);
            } else {
              const existingIdx = merged.findIndex((m) => m.id === r.id);
              if (existingIdx !== -1 && r.fileDataUrl && !merged[existingIdx].fileDataUrl) {
                merged[existingIdx] = r;
              }
            }
          });
          return merged.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        });
      }
    }).catch(err => console.error("Erro ao carregar comprovativos da Firestore:", err));
  }, []);

  // Handle local File selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Enforce physical constraints: max 5MB to preserve localStorage capabilities
      if (file.size > 5 * 1024 * 1024) {
        setErrorMsg('Tamanho máximo excedido: O comprovativo deve ter menos de 5MB para upload no portal.');
        setSelectedFile(null);
        setFileBase64('');
        return;
      }

      setErrorMsg('');
      setSelectedFile(file);

      // Simple heuristic parser for filenames to simulate reading the file
      const nameLower = file.name.toLowerCase();
      let detectedAmount = 120000;
      if (nameLower.includes('80000') || nameLower.includes('80k') || nameLower.includes('80.000')) {
        detectedAmount = 80000;
      } else if (nameLower.includes('50000') || nameLower.includes('50k') || nameLower.includes('50.000')) {
        detectedAmount = 50000;
      } else if (nameLower.includes('sem_valor') || nameLower.includes('no_value')) {
        detectedAmount = 0;
      }
      setSimulatedPdfAmount(detectedAmount);

      let detectedMonth = targetMonth;
      const monthMatch = nameLower.match(/(?:mês|mes|month|m)[_\s-]*(\d+)/i) || nameLower.match(/_(\d+)_/);
      if (monthMatch) {
        const mVal = parseInt(monthMatch[1], 10);
        if (mVal >= 1 && mVal <= 6) {
          detectedMonth = mVal;
        }
      } else {
        // Look for standalone numbers 1 to 6 in name if no explicit keyword
        for (let m = 1; m <= 6; m++) {
          if (nameLower.includes(`mes_${m}`) || nameLower.includes(`mes${m}`) || nameLower.includes(`mês_${m}`) || nameLower.includes(`mês${m}`)) {
            detectedMonth = m;
            break;
          }
        }
      }
      setSimulatedPdfMonth(detectedMonth);

      // Determine Candidate A
      let memberA: Member | null = null;
      if (currentUser?.role === 'membro') {
        memberA = members.find((m) => m.email.toLowerCase() === currentUser?.email?.toLowerCase()) || null;
      } else {
        memberA = members.find((m) => m.id === targetMemberId) || null;
      }
      if (!memberA && members.length > 0) {
        memberA = members[0];
      }

      // Determine Candidate B (an alternative member who hasn't paid targetMonth yet)
      let memberB: Member | null = null;
      const unpaidMembersForMonth = members.filter(
        (m) => m.id !== (memberA?.id || -1) && !m.contributions[detectedMonth]?.paid
      );
      if (unpaidMembersForMonth.length > 0) {
        memberB = unpaidMembersForMonth[0];
      } else {
        memberB = members.find((m) => m.id !== (memberA?.id || -1)) || null;
      }

      setCandidateMemberA(memberA);
      setCandidateMemberB(memberB);
      setShowAssociationPrompt(true);

      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setFileBase64(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Process and Settle Direct Quota (Primary Feature)
  const handleDirectSettleUpload = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!selectedFile) {
      setErrorMsg('Informação Importante: Deve selecionar ou anexar um ficheiro de comprovativo (PDF ou Imagem) para prosseguir com a liquidação.');
      return;
    }

    setIsProcessing(true);

    setTimeout(() => {
      // Find the associated member
      const chosenMember = members.find((m) => m.id === targetMemberId);
      if (!chosenMember) {
        setErrorMsg('Erro: Cooperante não localizado nos registos.');
        setIsProcessing(false);
        return;
      }

      // Check if they already paid this month
      const alreadyPaid = chosenMember.contributions[targetMonth]?.paid;
      if (alreadyPaid) {
        setErrorMsg(`Informação Importante: O cooperante ${chosenMember.name} já tem a cota do Mês ${targetMonth} registada como PAGA no sistema.`);
        setIsProcessing(false);
        return;
      }

      // Run Audit Rule Check
      const isAmountCorrect = simulatedPdfAmount === 120000;
      const isMonthCorrect = simulatedPdfMonth === targetMonth;
      const auditPassed = isAmountCorrect && isMonthCorrect;

      let auditDetails = '';
      let auditStatus: 'passed' | 'failed' = 'passed';
      if (!auditPassed) {
        auditStatus = 'failed';
        if (!isAmountCorrect && !isMonthCorrect) {
          auditDetails = `Divergência Crítica: Valor extraído (${simulatedPdfAmount === 0 ? 'indetectável' : simulatedPdfAmount.toLocaleString('pt-PT') + ' KZs'}) e Mês extraído (Mês ${simulatedPdfMonth === 0 ? 'indetectável' : simulatedPdfMonth}) não coincidem com o esperado (120.000,00 KZs, Mês ${targetMonth}).`;
        } else if (!isAmountCorrect) {
          auditDetails = `Divergência de Valor: Valor extraído do PDF (${simulatedPdfAmount === 0 ? 'indetectável' : simulatedPdfAmount.toLocaleString('pt-PT') + ' KZs'}) difere do valor oficial exigido de 120.000,00 KZs.`;
        } else {
          auditDetails = `Divergência de Mês: Comprovativo refere-se ao Mês ${simulatedPdfMonth === 0 ? 'indetectável' : simulatedPdfMonth}, mas a liquidação solicitada é para o Mês ${targetMonth}.`;
        }
      } else {
        auditDetails = `Conformidade Confirmada: Valor de 120.000,00 KZs e referência ao Mês ${targetMonth} validados com sucesso no documento.`;
      }

      // Create new Receipt item
      const newReceipt: Receipt = {
        id: `rec-usr-${Date.now()}`,
        senderPhone: chosenMember.phone,
        fileName: selectedFile.name,
        fileSize: `${(selectedFile.size / 1024).toFixed(0)} KB`,
        timestamp: new Date().toISOString(),
        detectedMemberName: chosenMember.name,
        detectedMemberId: chosenMember.id,
        status: auditPassed ? 'matched_paid' : 'unmatched_pending',
        targetMonth: targetMonth,
        uploadedBy: currentUser?.role === 'admin' ? 'Administrador' : chosenMember.name,
        fileDataUrl: fileBase64,
        auditStatus: auditStatus,
        auditDetails: auditDetails,
        detectedAmount: simulatedPdfAmount,
        detectedMonth: simulatedPdfMonth
      };

      // update local list
      const updatedReceipts = [newReceipt, ...receiptsList];
      setReceiptsList(updatedReceipts);

      saveReceiptToFirestore(newReceipt).catch(e => console.error("Erro ao salvar comprovativo na Firestore:", e));

      if (auditPassed) {
        // Perform Direct Settlement (Transition contribution to Paid)
        const updatedMembers = members.map((m) => {
          if (m.id === chosenMember.id) {
            return {
              ...m,
              contributions: {
                ...m.contributions,
                [targetMonth]: {
                  paid: true,
                  paidAt: new Date().toISOString(),
                  receiptFileName: selectedFile.name,
                  receiptFileSize: `${(selectedFile.size / 1024).toFixed(0)} KB`,
                  receiptUploadedAt: new Date().toISOString(),
                  amount: 120000
                },
              },
            };
          }
          return m;
        });

        // Write beautiful, compliance audit log
        const newLogObj: KixLog = {
          id: `log-rec-${Date.now()}`,
          timestamp: new Date().toISOString(),
          type: 'contribution',
          memberName: chosenMember.name,
          amount: 120000,
          description: `LIQUIDAÇÃO DIRECTA DE COTA: Comprovativo "${selectedFile.name}" submetido com sucesso por ${currentUser?.role === 'admin' ? 'Administrador' : chosenMember.name}. Quota do Mês ${targetMonth} liquidada directamente no sistema em benefício de ${chosenMember.name}. Distribuição: 100.000,00 KZs para contemplados / 20.000,00 KZs destinados ao Fundo de Interajuda.`,
          month: targetMonth,
        };

        const updatedLogs = [newLogObj, ...logs];
        setMembers(updatedMembers);
        setLogs(updatedLogs);
        saveState(updatedMembers, updatedLogs);

        setSuccessMsg(`Sucesso: O comprovativo foi auditado com sucesso (Aprovado ✓) e a cota do Mês ${targetMonth} de ${chosenMember.name} foi liquidada no portal!`);
      } else {
        // If audit fails, we DO NOT mark the quota as paid. We alert the auditor.
        setErrorMsg(`AUDITORIA REJEITADA ⚠️: O auditor automático recusou a validação deste comprovativo. Motivo: ${auditDetails}. A quota do Mês ${targetMonth} de ${chosenMember.name} permanece como NÃO PAGA.`);
      }

      // Reset form states
      setSelectedFile(null);
      setFileBase64('');
      if (fileInputRef.current) fileInputRef.current.value = '';
      setIsProcessing(false);
    }, 1300);
  };

  // Confirm payment closure and associate the voucher automatically (As requested)
  const confirmAndClosePayment = (selectedMember: Member) => {
    if (!selectedFile) return;
    setIsProcessing(true);
    setErrorMsg('');
    setSuccessMsg('');

    setTimeout(() => {
      // Run Audit Rule Check
      const isAmountCorrect = simulatedPdfAmount === 120000;
      const isMonthCorrect = simulatedPdfMonth === targetMonth;
      const auditPassed = isAmountCorrect && isMonthCorrect;

      let auditDetails = '';
      let auditStatus: 'passed' | 'failed' = 'passed';
      if (!auditPassed) {
        auditStatus = 'failed';
        if (!isAmountCorrect && !isMonthCorrect) {
          auditDetails = `Divergência Crítica: Valor extraído (${simulatedPdfAmount === 0 ? 'indetectável' : simulatedPdfAmount.toLocaleString('pt-PT') + ' KZs'}) e Mês extraído (Mês ${simulatedPdfMonth === 0 ? 'indetectável' : simulatedPdfMonth}) não coincidem com o esperado (120.000,00 KZs, Mês ${targetMonth}).`;
        } else if (!isAmountCorrect) {
          auditDetails = `Divergência de Valor: Valor extraído do PDF (${simulatedPdfAmount === 0 ? 'indetectável' : simulatedPdfAmount.toLocaleString('pt-PT') + ' KZs'}) difere do valor oficial exigido de 120.000,00 KZs.`;
        } else {
          auditDetails = `Divergência de Mês: Comprovativo refere-se ao Mês ${simulatedPdfMonth === 0 ? 'indetectável' : simulatedPdfMonth}, mas a liquidação solicitada é para o Mês ${targetMonth}.`;
        }
      } else {
        auditDetails = `Conformidade Confirmada: Valor de 120.000,00 KZs e referência ao Mês ${targetMonth} validados com sucesso no documento.`;
      }

      // Create new Receipt item with state 'pending_admin_validation'
      const newReceipt: Receipt = {
        id: `rec-usr-${Date.now()}`,
        senderPhone: selectedMember.phone,
        fileName: selectedFile.name,
        fileSize: `${(selectedFile.size / 1024).toFixed(0)} KB`,
        timestamp: new Date().toISOString(),
        detectedMemberName: selectedMember.name,
        detectedMemberId: selectedMember.id,
        status: auditPassed ? 'pending_admin_validation' : 'unmatched_pending',
        targetMonth: targetMonth,
        uploadedBy: currentUser?.role === 'admin' ? 'Administrador' : selectedMember.name,
        fileDataUrl: fileBase64,
        auditStatus: auditStatus,
        auditDetails: auditDetails,
        detectedAmount: simulatedPdfAmount,
        detectedMonth: simulatedPdfMonth
      };

      // update local list
      const updatedReceipts = [newReceipt, ...receiptsList];
      setReceiptsList(updatedReceipts);

      saveReceiptToFirestore(newReceipt).catch(e => console.error("Erro ao salvar comprovativo na Firestore:", e));

      if (auditPassed) {
        // Perform Direct Settlement - Attach voucher automatically to member profile
        const updatedMembers = members.map((m) => {
          if (m.id === selectedMember.id) {
            return {
              ...m,
              contributions: {
                ...m.contributions,
                [targetMonth]: {
                  paid: true,
                  paidAt: new Date().toISOString(),
                  receiptFileName: selectedFile.name,
                  receiptFileSize: `${(selectedFile.size / 1024).toFixed(0)} KB`,
                  receiptUploadedAt: new Date().toISOString(),
                  amount: 120000,
                  pendingAdminValidation: true // Custom flag for audit control
                },
              },
            };
          }
          return m;
        });

        // Write beautiful, compliance audit log with admin request message (As requested)
        const newLogObj: KixLog = {
          id: `log-rec-${Date.now()}`,
          timestamp: new Date().toISOString(),
          type: 'contribution',
          memberName: selectedMember.name,
          amount: 120000,
          description: `📥 [MENSAGEM AO ADMINISTRADOR / RECONCILIAÇÃO REQUERIDA]: Comprovativo "${selectedFile.name}" associado automaticamente a ${selectedMember.name} para o Mês ${targetMonth}. Solicita-se validação física de depósito (120.000,00 KZs) na conta bancária corporativa do Kixi-Fundo.`,
          month: targetMonth,
        };

        const updatedLogs = [newLogObj, ...logs];
        setMembers(updatedMembers);
        setLogs(updatedLogs);
        saveState(updatedMembers, updatedLogs);

        setSuccessMsg(`Sucesso: O comprovativo foi associado automaticamente ao cooperante ${selectedMember.name}! Foi gerado um Alerta de Validação para o Administrador.`);
      } else {
        // If audit fails, we DO NOT mark the quota as paid
        setErrorMsg(`AUDITORIA REJEITADA ⚠️: O auditor automático recusou a validação deste comprovativo. Motivo: ${auditDetails}. A quota do Mês ${targetMonth} de ${selectedMember.name} permanece como NÃO PAGA.`);
      }

      // Reset form states
      setSelectedFile(null);
      setFileBase64('');
      setShowAssociationPrompt(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
      setIsProcessing(false);
    }, 1300);
  };

  // Administrator action: Approve and validate the entry (As requested)
  const handleApproveDeposit = (receiptId: string) => {
    const receiptToApprove = receiptsList.find(r => r.id === receiptId);
    if (!receiptToApprove) return;

    // 1. Update receipt status
    const updatedReceipts = receiptsList.map(r => {
      if (r.id === receiptId) {
        return {
          ...r,
          status: 'matched_paid' as const,
          auditDetails: `Validação do Administrador: Depósito físico verificado e aprovado com sucesso em ${new Date().toLocaleDateString('pt-PT')}.`
        };
      }
      return r;
    });
    setReceiptsList(updatedReceipts);

    const updatedReceiptObj = {
      ...receiptToApprove,
      status: 'matched_paid' as const,
      auditDetails: `Validação do Administrador: Depósito físico verificado e aprovado com sucesso em ${new Date().toLocaleDateString('pt-PT')}.`
    };
    saveReceiptToFirestore(updatedReceiptObj).catch(e => console.error("Erro ao sincronizar aprovação na Firestore:", e));

    // 2. Remove the pending validation flag on the member's profile
    const updatedMembers = members.map(m => {
      if (m.id === receiptToApprove.detectedMemberId) {
        const targetMonthContrib = m.contributions[receiptToApprove.targetMonth];
        return {
          ...m,
          contributions: {
            ...m.contributions,
            [receiptToApprove.targetMonth]: {
              ...targetMonthContrib,
              paid: true,
              pendingAdminValidation: false
            }
          }
        };
      }
      return m;
    });

    // 3. Log the validation event
    const newLogObj: KixLog = {
      id: `log-val-${Date.now()}`,
      timestamp: new Date().toISOString(),
      type: 'contribution',
      memberName: receiptToApprove.detectedMemberName,
      amount: 120000,
      description: `✓ DEPÓSITO VALIDADO BANCARIAMENTE: O Administrador validou a entrada real de 120.000,00 KZs na conta do Kixi-Fundo em benefício da quota do Mês ${receiptToApprove.targetMonth} de ${receiptToApprove.detectedMemberName}. Distribuição: 100.000,00 KZs para contemplados / 20.000,00 KZs para o Fundo de Interajuda.`,
      month: receiptToApprove.targetMonth
    };

    const updatedLogs = [newLogObj, ...logs];
    setMembers(updatedMembers);
    setLogs(updatedLogs);
    saveState(updatedMembers, updatedLogs);

    setSuccessMsg(`Sucesso: Depósito de ${receiptToApprove.detectedMemberName} para o Mês ${receiptToApprove.targetMonth} verificado e validado com sucesso!`);
  };

  // Administrator action: Reject and invalidate the entry (As requested)
  const handleRejectDeposit = (receiptId: string) => {
    const receiptToReject = receiptsList.find(r => r.id === receiptId);
    if (!receiptToReject) return;

    // 1. Update receipt status
    const updatedReceipts = receiptsList.map(r => {
      if (r.id === receiptId) {
        return {
          ...r,
          status: 'unmatched_pending' as const,
          auditDetails: `Rejeitado pelo Administrador: Entrada não identificada no extrato bancário.`
        };
      }
      return r;
    });
    setReceiptsList(updatedReceipts);

    const updatedReceiptObj = {
      ...receiptToReject,
      status: 'unmatched_pending' as const,
      auditDetails: `Rejeitado pelo Administrador: Entrada não identificada no extrato bancário.`
    };
    saveReceiptToFirestore(updatedReceiptObj).catch(e => console.error("Erro ao sincronizar rejeição na Firestore:", e));

    // 2. Revert the contribution status (remove paid status)
    const updatedMembers = members.map(m => {
      if (m.id === receiptToReject.detectedMemberId) {
        const updatedContribs = { ...m.contributions };
        delete updatedContribs[receiptToReject.targetMonth];
        return {
          ...m,
          contributions: updatedContribs
        };
      }
      return m;
    });

    // 3. Log the rejection
    const newLogObj: KixLog = {
      id: `log-val-${Date.now()}`,
      timestamp: new Date().toISOString(),
      type: 'contribution',
      memberName: receiptToReject.detectedMemberName,
      amount: 120000,
      description: `❌ AUDITORIA DE REJEIÇÃO: O Administrador recusou a validação do comprovativo "${receiptToReject.fileName}" para o Mês ${receiptToReject.targetMonth} de ${receiptToReject.detectedMemberName} (depósito físico não confirmado no banco).`,
      month: receiptToReject.targetMonth
    };

    const updatedLogs = [newLogObj, ...logs];
    setMembers(updatedMembers);
    setLogs(updatedLogs);
    saveState(updatedMembers, updatedLogs);

    setErrorMsg(`O comprovativo de ${receiptToReject.detectedMemberName} foi rejeitado e a cota do Mês ${receiptToReject.targetMonth} retornou ao estado de NÃO PAGA.`);
  };

  // Simulator flow from unrecognized Whatsapp Webhook triggers
  const handleSimulateWebhook = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setIsProcessing(true);

    const targetPhoneNum = simulatedPhone.trim() !== '' ? simulatedPhone.trim() : '+244 999 888 777';
    const finalFileName = `WEBHOOK_Mês_${currentMonth}_unidentified_receipt.pdf`;

    setTimeout(() => {
      // Find matching member by exact phone alignment
      const matchedMember = members.find((m) => m.phone.replace(/\s+/g, '') === targetPhoneNum.replace(/\s+/g, ''));
      const foundMatch = !!matchedMember;

      const newReceipt: Receipt = {
        id: `rec-sim-${Date.now()}`,
        senderPhone: targetPhoneNum,
        fileName: finalFileName,
        fileSize: '1.4 MB',
        timestamp: new Date().toISOString(),
        detectedMemberName: foundMatch ? matchedMember.name : 'Número Não Identificado',
        detectedMemberId: foundMatch ? matchedMember.id : null,
        status: foundMatch ? 'matched_paid' : 'unmatched_pending',
        targetMonth: currentMonth,
        uploadedBy: 'Sistema Webhook API',
      };

      const updatedReceipts = [newReceipt, ...receiptsList];
      setReceiptsList(updatedReceipts);

      saveReceiptToFirestore(newReceipt).catch(e => console.error("Erro ao salvar comprovativo na Firestore:", e));

      if (foundMatch && matchedMember) {
        const alreadyPaid = matchedMember.contributions[currentMonth]?.paid;
        
        if (!alreadyPaid) {
          const updatedMembers = members.map((m) => {
            if (m.id === matchedMember.id) {
              return {
                ...m,
                contributions: {
                  ...m.contributions,
                  [currentMonth]: {
                    paid: true,
                    paidAt: new Date().toISOString(),
                  },
                },
              };
            }
            return m;
          });

          const newLogObj: KixLog = {
            id: `log-webhook-${Date.now()}`,
            timestamp: new Date().toISOString(),
            type: 'contribution',
            memberName: matchedMember.name,
            amount: 120000,
            description: `CONCILIAÇÃO AUTOMÁTICA: Comprovativo recebido via Webhook para o número ${targetPhoneNum}. Membro "${matchedMember.name}" identificado. Cota do Mês ${currentMonth} liquidada.`,
            month: currentMonth,
          };

          const updatedLogs = [newLogObj, ...logs];
          setMembers(updatedMembers);
          setLogs(updatedLogs);
          saveState(updatedMembers, updatedLogs);
        }
      }

      setIsProcessing(false);
      setSuccessMsg(`Simulação concluída: Recebido comprovativo via webhook para o número ${targetPhoneNum}.`);
      setSimulatedPhone('');
    }, 1200);
  };

  // Manual reconciliation of unresolved receipts
  const handleManualMatch = (receiptId: string, memberId: number) => {
    const targetMember = members.find((m) => m.id === memberId);
    if (!targetMember) return;

    const receiptToMatch = receiptsList.find((r) => r.id === receiptId);
    if (!receiptToMatch) return;

    const updatedReceipts = receiptsList.map((rec) => {
      if (rec.id === receiptId) {
        return {
          ...rec,
          detectedMemberId: targetMember.id,
          detectedMemberName: targetMember.name,
          status: 'manually_matched' as const,
        };
      }
      return rec;
    });

    setReceiptsList(updatedReceipts);

    const matchedReceipt = updatedReceipts.find(r => r.id === receiptId);
    if (matchedReceipt) {
      saveReceiptToFirestore(matchedReceipt).catch(e => console.error("Erro ao atualizar comprovativo na Firestore:", e));
    }

    const updatedMembers = members.map((m) => {
      if (m.id === targetMember.id) {
        return {
          ...m,
          contributions: {
            ...m.contributions,
            [receiptToMatch.targetMonth]: {
              paid: true,
              paidAt: new Date().toISOString(),
            },
          },
        };
      }
      return m;
    });

    const newLogObj: KixLog = {
      id: `log-man-${Date.now()}`,
      timestamp: new Date().toISOString(),
      type: 'contribution',
      memberName: targetMember.name,
      amount: 120000,
      description: `CONCILIAÇÃO MANUAL: Administrador vinculou manualmente comprovativo "${receiptToMatch.fileName}" ao cooperante "${targetMember.name}". Quota do Mês ${receiptToMatch.targetMonth} liquidada com sucesso.`,
      month: receiptToMatch.targetMonth,
    };

    const updatedLogs = [newLogObj, ...logs];
    setMembers(updatedMembers);
    setLogs(updatedLogs);
    saveState(updatedMembers, updatedLogs);
    alert('Conciliação manual aplicada com sucesso!');
  };

  // Clean list back to defaults
  const handleClearList = () => {
    if (window.confirm('Tem a certeza que deseja limpar a lista de comprovativos carregados e restaurar os originais?')) {
      // Delete old from Firestore
      receiptsList.forEach(rec => {
        deleteReceiptFromFirestore(rec.id).catch(e => console.error("Erro ao apagar comprovativo na Firestore:", e));
      });

      const defaults: Receipt[] = [
        {
          id: 'rec-1',
          senderPhone: '+244 923 000 001',
          fileName: 'COMPROVATIVO_Mês_1_Vicente_Silva.pdf',
          fileSize: '1.2 MB',
          timestamp: new Date(Date.now() - 3600000 * 24).toISOString(),
          detectedMemberName: 'Vicente Silva',
          detectedMemberId: 1,
          status: 'matched_paid',
          targetMonth: 1,
          uploadedBy: 'admin',
        },
        {
          id: 'rec-2',
          senderPhone: '+244 912 999 555',
          fileName: 'TRANSFERENCIA_BANCO_Mês_1_Gaspar_Neto.png',
          fileSize: '850 KB',
          timestamp: new Date(Date.now() - 3600000 * 12).toISOString(),
          detectedMemberName: 'Gaspar Neto',
          detectedMemberId: 3,
          status: 'matched_paid',
          targetMonth: 1,
          uploadedBy: 'Gaspar Neto',
        }
      ];

      localStorage.removeItem('kix_comprovativos');
      setReceiptsList(defaults);

      // Save defaults to Firestore
      defaults.forEach(rec => {
        saveReceiptToFirestore(rec).catch(e => console.error("Erro ao salvar comprovativo padrão na Firestore:", e));
      });
    }
  };

  const handlePrintReceipts = (config: PrintConfig) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const fontStack = config.fontFamily === 'serif' 
      ? "'Playfair Display', Georgia, serif" 
      : config.fontFamily === 'mono' 
      ? "'JetBrains Mono', 'Fira Code', Courier, monospace" 
      : "'Inter', sans-serif";

    const bodySize = config.fontSize === 'compact' ? '10px' : config.fontSize === 'large' ? '14px' : '12px';
    const rowPadding = config.fontSize === 'compact' ? '6px 8px' : config.fontSize === 'large' ? '16px 12px' : '12px 10px';
    const isTableSimple = config.format === 'table_simple';

    const rowsHTML = receiptsList.map((rec) => {
      const isMatched = rec.status === 'matched_paid' || rec.status === 'manually_matched';
      const statusLabel = isMatched ? `Validado (${rec.detectedMemberName})` : 'Pendente de Alinhamento';
      
      if (isTableSimple) {
        return `
          <tr style="border-bottom: 1px solid #000000;">
            <td style="padding: ${rowPadding}; font-size: ${bodySize}; font-weight: bold; color: black;">${rec.fileName}</td>
            <td style="padding: ${rowPadding}; font-size: ${bodySize}; color: black;">${rec.fileSize}</td>
            <td style="padding: ${rowPadding}; font-size: ${bodySize}; color: black;">${rec.senderPhone}</td>
            <td style="padding: ${rowPadding}; font-size: ${bodySize}; color: black; text-align: center;">Mês ${rec.targetMonth}</td>
            <td style="padding: ${rowPadding}; font-size: ${bodySize}; color: black;">${rec.uploadedBy}</td>
            <td style="padding: ${rowPadding}; font-size: ${bodySize}; font-weight: bold; color: black;">${statusLabel}</td>
          </tr>
        `;
      } else {
        return `
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: ${rowPadding}; font-size: ${bodySize}; font-weight: bold; color: #1e293b;">${rec.fileName}</td>
            <td style="padding: ${rowPadding}; font-size: ${bodySize}; color: #475569;">${rec.fileSize}</td>
            <td style="padding: ${rowPadding}; font-size: ${bodySize}; color: #334155; font-family: monospace;">${rec.senderPhone}</td>
            <td style="padding: ${rowPadding}; font-size: ${bodySize}; color: #0284c7; text-align: center; font-weight: bold;">Mês ${rec.targetMonth}</td>
            <td style="padding: ${rowPadding}; font-size: ${bodySize}; color: #64748b;">${rec.uploadedBy}</td>
            <td style="padding: ${rowPadding}; font-size: calc(${bodySize} - 1px); font-weight: bold;">
              <span style="padding: 4px 8px; border-radius: 4px; ${isMatched ? 'background-color: #d1fae5; color: #065f46;' : 'background-color: #fee2e2; color: #991b1b;'}">
                ${isMatched ? 'Validado ✓' : 'Pendente ✗'}
              </span>
            </td>
          </tr>
        `;
      }
    }).join('');

    const validatedCount = receiptsList.filter(r => r.status === 'matched_paid' || r.status === 'manually_matched').length;
    const pendingCount = receiptsList.filter(r => r.status === 'unmatched_pending').length;

    const layoutHTML = isTableSimple ? `
      <html>
        <head>
          <title>Kixi-Fundo - Controlo de Comprovativos</title>
          <style>
            @page { size: ${config.orientation}; margin: 15mm; }
            body { font-family: ${fontStack}; padding: 10px; color: black; background-color: white; line-height: 1.3; font-size: ${bodySize}; }
            .header-simple { border-bottom: 2px solid black; padding-bottom: 10px; margin-bottom: 20px; }
            .header-simple h1 { font-size: 16px; margin: 0 0 5px 0; text-transform: uppercase; font-weight: bold; }
            .header-simple p { font-size: 10px; margin: 2px 0; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            th { border-bottom: 2px solid black; padding: 8px; font-size: 10px; font-weight: bold; text-align: left; text-transform: uppercase; color: black; }
            td { border-bottom: 1px solid #ccc; }
          </style>
        </head>
        <body>
          <div class="header-simple">
            <h1>KIXI-FUNDO - CONTROLO E CONCILIAÇÃO DE COMPROVATIVOS DE DEPÓSITOS (LISTAGEM)</h1>
            <p>Associação Consórcio de Poupança de Interajuda Coletiva</p>
            <p><strong>Estatísticas:</strong> Total: ${receiptsList.length} | Validados: ${validatedCount} | Pendentes: ${pendingCount}</p>
            <p><strong>Data de Emissão:</strong> ${new Date().toLocaleString('pt-PT')}</p>
          </div>

          <table>
            <thead>
              <tr>
                <th style="text-align: left;">Arquivo / Comprovativo</th>
                <th style="text-align: left;">Tamanho</th>
                <th style="text-align: left;">Remetente</th>
                <th style="text-align: center;">Mês Referência</th>
                <th style="text-align: left;">Submetido Por</th>
                <th style="text-align: left;">Estado de Alinhamento</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHTML}
            </tbody>
          </table>
          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
      </html>
    ` : `
      <html>
        <head>
          <title>Kixi-Fundo - Controlo de Comprovativos</title>
          <style>
            @page { size: ${config.orientation}; margin: 20mm; }
            body { font-family: ${fontStack}; padding: 30px; color: #1e293b; background-color: white; line-height: 1.4; font-size: ${bodySize}; }
            .header { text-align: center; border-bottom: 2px solid #0f172a; padding-bottom: 20px; margin-bottom: 30px; }
            .header h1 { font-size: 20px; color: #0f172a; margin: 0 0 5px 0; text-transform: uppercase; letter-spacing: 1px; font-weight: 850; }
            .header h2 { font-size: 12px; color: #475569; margin: 0; font-weight: normal; letter-spacing: 2px; text-transform: uppercase; }
            .meta { font-size: 10px; color: #64748b; margin-top: 10px; display: flex; justify-content: space-between; }
            .grid-stats { display: grid; grid-template-cols: repeat(3, 1fr); gap: 15px; margin-bottom: 25px; }
            .stat-card { border: 1px solid #e2e8f0; background: #f8fafc; border-radius: 8px; padding: 15px; text-align: center; }
            .stat-val { font-size: 18px; font-weight: bold; color: #0f172a; margin-top: 4px; }
            .stat-label { font-size: 9px; color: #64748b; text-transform: uppercase; font-weight: bold; letter-spacing: 0.5px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
            th { background-color: #f1f5f9; color: #475569; padding: 10px; font-size: 10px; font-weight: bold; text-align: left; border-bottom: 2px solid #cbd5e1; text-transform: uppercase; }
            .footer { border-top: 1px solid #e2e8f0; margin-top: 50px; padding-top: 15px; text-align: center; font-size: 10px; color: #64748b; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>KIXI-FUNDO - CONTROLO E CONCILIAÇÃO DE COMPROVATIVOS</h1>
            <h2>Associação Consórcio de Poupança de Interajuda Coletiva</h2>
            <div class="meta">
              <span>Data de Emissão: ${new Date().toLocaleString('pt-PT')}</span>
              <span>Emitido por: ${currentUser?.email || 'Administrador'}</span>
            </div>
          </div>

          <div class="grid-stats">
            <div class="stat-card" style="border-left: 4px solid #0f172a;">
              <div class="stat-label">Comprovativos Recebidos</div>
              <div class="stat-val">${receiptsList.length}</div>
            </div>
            <div class="stat-card" style="border-left: 4px solid #059669;">
              <div class="stat-label">Liquidados / Validados</div>
              <div class="stat-val">${validatedCount}</div>
            </div>
            <div class="stat-card" style="border-left: 4px solid #dc2626;">
              <div class="stat-label">Pendentes de Alinhamento</div>
              <div class="stat-val">${pendingCount}</div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th style="text-align: left;">Arquivo / Comprovativo</th>
                <th style="text-align: left;">Tamanho</th>
                <th style="text-align: left;">Remetente</th>
                <th style="text-align: center;">Mês Referência</th>
                <th style="text-align: left;">Submetido Por</th>
                <th style="text-align: left;">Estado de Alinhamento</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHTML}
            </tbody>
          </table>

          <div class="footer">
            <p>© 2026 Kixi-Fundo - Gestão de Finanças Comparticipadas, Angola. Documento gerado para controle interno de conformidade de depósitos bancários.</p>
          </div>
          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(layoutHTML);
    printWindow.document.close();
  };

  return (
    <div className="space-y-8 animate-fadeIn" id="receipts-automation-page">
      
      {/* Dynamic Localized Archive Title banner */}
      <div className="bg-white dark:bg-slate-900 border-l-4 border-l-sky-500 text-slate-800 dark:text-white rounded-xl p-6 border border-slate-200 dark:border-slate-800 relative overflow-hidden shadow-sm">
        <div className="absolute top-0 right-0 w-48 h-48 bg-sky-500/5 dark:bg-slate-800/25 rounded-bl-full pointer-events-none" />
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-2xl">
            <span className="text-[10px] font-bold bg-rose-500/10 text-red-500 border border-rose-500/25 px-2.5 py-1 rounded-full uppercase tracking-wider block w-fit">
              Gestor de Liquidação Física e Comprovativos
            </span>
            <h2 className="text-xl md:text-2xl font-black font-display tracking-tight text-slate-900 dark:text-white">
              Automação e Depósito Directo de Recibos
            </h2>
            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
              O upload de comprovativos é feito directamente nesta plataforma local segura do portal, sem necessidade de servidores externos. 
              Tanto o <strong>Administrador</strong> como o <strong>Membro Autenticado</strong> podem anexar os comprovativos digitais de transferência 
              escolhendo o respetivo cooperante e mês, liquidando instantaneamente a quota no portal.
            </p>
          </div>

          <div className="flex flex-col gap-2.5 bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 p-4 rounded-xl text-xs w-full md:w-auto md:min-w-xs shrink-0">
            <div className="flex items-center gap-3">
              <FolderOpen className="w-7 h-7 text-amber-500 shrink-0" />
              <div className="min-w-0">
                <p className="font-black text-slate-900 dark:text-slate-200">Pasta na Nuvem Activada</p>
                <a 
                  href={cloudFolderUrl} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-sky-600 dark:text-sky-400 font-extrabold hover:underline font-mono text-[11px] block mt-0.5 truncate max-w-[180px]"
                  title="Clique para aceder à pasta partilhada no Drive/OneDrive"
                >
                  Ir para OneDrive / Drive ↗
                </a>
              </div>
            </div>
            {currentUser?.role === 'admin' ? (
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
                {isEditingCloudUrl ? (
                  <div className="space-y-1.5">
                    <input 
                      type="text"
                      value={cloudUrlInput}
                      onChange={(e) => setCloudUrlInput(e.target.value)}
                      placeholder="Cole o link da pasta do Drive/OneDrive..."
                      className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-2 py-1 text-[10px] text-slate-900 dark:text-white focus:outline-none"
                    />
                    <div className="flex items-center gap-1.5">
                      <button 
                        type="button"
                        onClick={() => {
                          setCloudFolderUrl(cloudUrlInput);
                          localStorage.setItem('kix_cloud_folder_url', cloudUrlInput);
                          setIsEditingCloudUrl(false);
                          alert("Link de pasta na nuvem atualizado com sucesso!");
                        }}
                        className="bg-red-600 hover:bg-red-700 text-white font-bold px-2 py-1 rounded text-[9px]"
                      >
                        Salvar
                      </button>
                      <button 
                        type="button"
                        onClick={() => {
                          setCloudUrlInput(cloudFolderUrl);
                          setIsEditingCloudUrl(false);
                        }}
                        className="bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 px-2 py-1 rounded text-[9px]"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <button 
                    type="button"
                    onClick={() => setIsEditingCloudUrl(true)}
                    className="text-[9px] font-bold text-slate-700 dark:text-slate-200 hover:text-sky-600 dark:hover:text-white flex items-center gap-1 uppercase tracking-wider w-fit"
                  >
                    🛠️ Configurar Link OneDrive/Drive
                  </button>
                )}
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* Admin Action Center: Receipts awaiting physical validation in bank statement (As requested) */}
      {currentUser?.role === 'admin' && receiptsList.some(r => r.status === 'pending_admin_validation') && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-amber-500/10 border border-amber-500/20 text-slate-800 dark:text-slate-100 rounded-xl p-5 space-y-4 shadow-sm"
        >
          <div className="flex items-center gap-2 border-b border-amber-500/20 pb-2">
            <BellRing className="w-5 h-5 text-amber-600 animate-bounce" />
            <div className="min-w-0">
              <h3 className="text-xs font-black uppercase tracking-wider text-amber-700 dark:text-amber-500">
                📥 Mensagens e Notificações de Validação de Depósito Pendente
              </h3>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                Os seguintes depósitos foram associados aos perfis dos cooperantes, mas necessitam de validação física no extrato de conta bancária:
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {receiptsList.filter(r => r.status === 'pending_admin_validation').map(r => (
              <div 
                key={r.id} 
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3.5 rounded-lg flex flex-col justify-between gap-3 shadow-sm hover:border-amber-500/40 transition-colors"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-black text-slate-900 dark:text-white">
                      {r.detectedMemberName}
                    </span>
                    <span className="text-[9px] font-bold font-mono bg-amber-500/10 text-amber-600 px-2 py-0.5 rounded uppercase tracking-wider">
                      Mês {r.targetMonth}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500 space-y-0.5">
                    <p className="truncate">📁 Ficheiro: <strong className="font-semibold text-slate-700 dark:text-slate-300">{r.fileName}</strong> ({r.fileSize})</p>
                    <p>🕒 Submetido em: {new Date(r.timestamp).toLocaleString('pt-PT')}</p>
                    <p className="font-semibold text-sky-600 dark:text-sky-400 font-mono">💰 Valor Requerido: 120.000,00 KZs</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => handleApproveDeposit(r.id)}
                    className="flex-1 bg-slate-900 dark:bg-slate-800 hover:bg-black text-white font-extrabold text-[10px] py-1.5 px-3 rounded uppercase tracking-wider flex items-center justify-center gap-1 transition-all cursor-pointer"
                  >
                    <CheckSquare className="w-3.5 h-3.5" />
                    Aprovar e Validar
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRejectDeposit(r.id)}
                    className="bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-[10px] py-1.5 px-3 rounded uppercase tracking-wider flex items-center justify-center gap-1 transition-all cursor-pointer border border-rose-200"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    Rejeitar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Grid: Actual File Uploader & List of uploaded statement files */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Direct Upload Settlement Form & WhatsApp Webhook Sim */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Main Direct Upload & Settlement Panel */}
          <div className="bg-white dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
              <UploadCloud className="w-5 h-5 text-slate-700 dark:text-slate-300" />
              <h3 className="font-display font-bold text-slate-900 text-xs tracking-wide uppercase dark:text-white">
                Submissão Directa de Comprovativo
              </h3>
            </div>

            <form onSubmit={handleDirectSettleUpload} className="space-y-4">
              
              {/* If Admin: can select which member this settles. If member: locked to themselves */}
              {currentUser?.role === 'admin' ? (
                <div>
                  <label className="block text-slate-900 dark:text-slate-300 font-bold mb-1 uppercase tracking-wider text-[10px]">
                    1. Selecionar o Cooperante Beneficiado
                  </label>
                  <select
                    value={targetMemberId}
                    onChange={(e) => setTargetMemberId(Number(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-slate-300 rounded-lg p-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-slate-800"
                  >
                    {members.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.phone}) - Mês {m.assignedMonth}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800 p-3 rounded-lg">
                  <span className="block text-slate-400 dark:text-slate-500 font-semibold mb-1 uppercase tracking-wider text-[9px]">
                    Cooperante Solicitante
                  </span>
                  <div className="flex items-center gap-2 text-xs text-slate-900 dark:text-slate-100 font-bold">
                    <User className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                    <span>{members.find(m => m.email.toLowerCase() === currentUser?.email.toLowerCase())?.name || currentUser?.name} (Você)</span>
                  </div>
                </div>
              )}

              {/* Month Selection (Mês em pagamento) */}
              <div>
                <label className="block text-slate-900 dark:text-slate-300 font-bold mb-1 uppercase tracking-wider text-[10px]">
                  2. Referência ao Mês em Pagamento
                </label>
                <select
                  value={targetMonth}
                  onChange={(e) => setTargetMonth(Number(e.target.value))}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-slate-300 rounded-lg p-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-slate-800"
                >
                  {[1, 2, 3, 4, 5, 6].map((mNum) => (
                    <option key={mNum} value={mNum}>
                      Mês {mNum} {mNum === currentMonth ? '(Mês de Operação Corrente)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-900 dark:text-slate-300 font-bold mb-1 uppercase tracking-wider text-[10px]">
                  3. Anexar PDF / Imagem de Transferência
                </label>
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 hover:bg-slate-100/50 dark:hover:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 rounded-xl p-5 text-center cursor-pointer transition-all"
                >
                  <UploadCloud className="w-7 h-7 text-slate-400 mx-auto mb-2" />
                  <span className="font-bold text-slate-900 dark:text-white transition-colors block text-[11px]">
                    {selectedFile ? selectedFile.name : 'Clique para Escolher Comprovativo'}
                  </span>
                  <span className="text-[9px] text-slate-400 dark:text-slate-400 font-medium mt-1 block">
                    {selectedFile ? `${(selectedFile.size / 1024).toFixed(0)} KB - Ficheiro Pronto` : 'Suporta ficheiros de bancos locais como BAI, BFA, BIC, BCI com menos de 5MB'}
                  </span>
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="application/pdf,image/*"
                  className="hidden"
                />
              </div>

              {selectedFile && (
                <div className="bg-slate-50 dark:bg-slate-950 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2.5 animate-fadeIn">
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-1.5">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1">
                      🔍 Auditoria Automática de PDF (Simulador)
                    </span>
                    <span className="text-[9px] bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20 px-2 py-0.5 rounded-full font-black font-mono uppercase tracking-wider">
                      OCR Ativo
                    </span>
                  </div>
                  <p className="text-[9px] text-slate-500 dark:text-slate-400 leading-normal">
                    O sistema analisou o arquivo e pré-carregou os dados detectados para validação. Ajuste abaixo para testar diferentes resultados de auditoria:
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[9px] text-slate-600 dark:text-slate-400 uppercase font-bold tracking-wider mb-1">
                        Valor Extraído no PDF
                      </label>
                      <select
                        value={simulatedPdfAmount}
                        onChange={(e) => setSimulatedPdfAmount(Number(e.target.value))}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 rounded-lg text-[11px] font-semibold text-slate-900 dark:text-white focus:outline-none"
                      >
                        <option value={120000}>120.000,00 KZs (Correto)</option>
                        <option value={80000}>80.000,00 KZs (Incorreto)</option>
                        <option value={0}>Nenhum valor encontrado (0 KZs)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[9px] text-slate-600 dark:text-slate-400 uppercase font-bold tracking-wider mb-1">
                        Mês Extraído no PDF
                      </label>
                      <select
                        value={simulatedPdfMonth}
                        onChange={(e) => setSimulatedPdfMonth(Number(e.target.value))}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 rounded-lg text-[11px] font-semibold text-slate-900 dark:text-white focus:outline-none"
                      >
                        <option value={targetMonth}>Mês {targetMonth} (Correto)</option>
                        {[1, 2, 3, 4, 5, 6].filter(m => m !== targetMonth).map(m => (
                          <option key={m} value={m}>Mês {m} (Divergente)</option>
                        ))}
                        <option value={0}>Nenhum mês (Inválido)</option>
                      </select>
                    </div>
                  </div>
                  <div className="text-[9px] flex items-start gap-1 text-slate-400 pt-1 border-t border-slate-200/50 dark:border-slate-800/50">
                    <Info className="w-3.5 h-3.5 shrink-0 text-slate-500 mt-0.5" />
                    <span>
                      Regra de Auditoria: O depósito só é considerado VÁLIDO e a quota LIQUIDADA se o valor extraído for exatamente 120.000,00 KZs e o Mês for o Mês {targetMonth}.
                    </span>
                  </div>
                </div>
              )}

              {/* Interactive Association Prompt (As requested) */}
              {selectedFile && showAssociationPrompt && (
                <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border-2 border-dashed border-sky-500/35 dark:border-sky-500/20 space-y-3 animate-fadeIn relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-16 h-16 bg-sky-500/5 rounded-bl-full pointer-events-none" />
                  <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
                    <Sparkles className="w-4 h-4 text-sky-500" />
                    <span className="text-[11px] font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
                      ❓ Deseja fechar o pagamento?
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-600 dark:text-slate-400 leading-normal font-medium">
                    O sistema analisou o comprovativo e propõe fechar a cota do Mês {targetMonth}. Confirme para anexar automaticamente o comprovativo ao perfil do membro e notificar o administrador:
                  </p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    {/* Candidate Member A Option */}
                    {candidateMemberA && (
                      <button
                        type="button"
                        onClick={() => confirmAndClosePayment(candidateMemberA)}
                        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-sky-500 dark:hover:border-sky-500/50 p-3 rounded-lg text-left transition-all hover:shadow-sm cursor-pointer group space-y-1.5"
                      >
                        <div className="flex items-center gap-2">
                          <div className={`w-6 h-6 rounded-full ${candidateMemberA.avatarColor} flex items-center justify-center text-[9px] font-black text-white shrink-0 shadow-sm`}>
                            {candidateMemberA.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="text-[11px] font-black text-slate-900 dark:text-white truncate group-hover:text-sky-600 dark:group-hover:text-sky-400">
                              {candidateMemberA.name}
                            </p>
                            <p className="text-[9px] text-slate-400 font-mono">
                              Membro A (Upload / Selecionado)
                            </p>
                          </div>
                        </div>
                        <div className="text-[9px] font-bold text-sky-600 dark:text-sky-400 bg-sky-500/10 px-1.5 py-0.5 rounded w-fit uppercase tracking-wider">
                          ✓ Confirmar e Fechar
                        </div>
                      </button>
                    )}

                    {/* Candidate Member B Option */}
                    {candidateMemberB && (
                      <button
                        type="button"
                        onClick={() => confirmAndClosePayment(candidateMemberB)}
                        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-amber-500 dark:hover:border-amber-500/50 p-3 rounded-lg text-left transition-all hover:shadow-sm cursor-pointer group space-y-1.5"
                      >
                        <div className="flex items-center gap-2">
                          <div className={`w-6 h-6 rounded-full ${candidateMemberB.avatarColor} flex items-center justify-center text-[9px] font-black text-white shrink-0 shadow-sm`}>
                            {candidateMemberB.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="text-[11px] font-black text-slate-900 dark:text-white truncate group-hover:text-amber-600 dark:group-hover:text-amber-400">
                              {candidateMemberB.name}
                            </p>
                            <p className="text-[9px] text-slate-400 font-mono">
                              Membro B (Devedor Alternativo)
                            </p>
                          </div>
                        </div>
                        <div className="text-[9px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded w-fit uppercase tracking-wider">
                          ✓ Confirmar e Fechar
                        </div>
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Submit direct liquidative settlement */}
              <button
                type="submit"
                disabled={isProcessing}
                className={`w-full py-3 px-4 rounded-lg font-bold text-white text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                  isProcessing ? 'bg-slate-700 cursor-wait' : 'bg-slate-900 dark:bg-slate-850 hover:bg-black dark:hover:bg-slate-950 shadow-sm cursor-pointer'
                }`}
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Processando Liquidação...
                  </>
                ) : (
                  <>
                    <FileCheck className="w-4 h-4" />
                    Submeter e Liquidar Quota Directa
                  </>
                )}
              </button>

            </form>
          </div>

          {/* Webhook simulator specifically for troubleshooting or testing mock receipts */}
          <div className="bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-200 dark:border-slate-800 p-5">
            <div className="flex items-center gap-2 mb-3 pb-1 border-b border-slate-200/50 dark:border-slate-800/50">
              <MessageSquare className="w-4 h-4 text-slate-600 dark:text-slate-300" />
              <h4 className="font-display font-semibold text-slate-900 dark:text-white text-xs tracking-wide uppercase">
                Simulador Webhook WhatsApp
              </h4>
            </div>
            
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mb-3 leading-relaxed">
              Dispare um evento simulado de mensagem com comprovativo vindo de um número telefónico para testar a correspondência automática de assinaturas de pagamento.
            </p>

            <form onSubmit={handleSimulateWebhook} className="space-y-3">
              <div>
                <label className="block text-slate-900 dark:text-slate-300 font-semibold mb-1 uppercase tracking-wider text-[9px]">
                  Número de Telefone Remetente
                </label>
                <input
                  type="text"
                  placeholder="+244 923 000 001 (ou número novo)"
                  value={simulatedPhone}
                  onChange={(e) => setSimulatedPhone(e.target.value)}
                  className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 font-mono text-xs focus:outline-none focus:border-slate-800 dark:focus:border-slate-600 text-slate-900 dark:text-white"
                />
              </div>

              <button
                type="submit"
                disabled={isProcessing}
                className="w-full py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-250 font-bold text-[10px] rounded uppercase tracking-wider"
              >
                Disparar Mensagem de Teste (Mês {currentMonth})
              </button>
            </form>
          </div>

          {/* Important alert banners in high contrast RED text according to requirements */}
          {errorMsg && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-rose-50 border border-rose-200 p-4 rounded-xl flex items-start gap-2.5"
            >
              <AlertCircle className="w-5 h-5 shrink-0 text-red-600 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-red-600 uppercase tracking-wider">Aviso Importante</h4>
                <p className="text-[11px] text-red-600 font-medium mt-1 leading-relaxed">{errorMsg}</p>
              </div>
            </motion.div>
          )}

          {successMsg && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-slate-50 border border-slate-350 p-4 rounded-xl flex items-start gap-2.5"
            >
              <CheckCircle className="w-5 h-5 shrink-0 text-slate-900 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Operação Registada</h4>
                <p className="text-[11px] text-slate-950 font-semibold mt-1 leading-relaxed">{successMsg}</p>
              </div>
            </motion.div>
          )}

        </div>

        {/* Right Column: Dynamic Storage & Baía of Verified receipts and download targets */}
        <div className="lg:col-span-7 space-y-5">
          
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-display font-bold text-slate-900 text-xs tracking-wide uppercase flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-slate-800" />
                Registo de Depósitos Locais (Kix-Drive)
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Ficheiros guardados na sandbox local de segurança da aplicação. Faça download imediato do recibo para auditoria física.
              </p>
            </div>
            
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button 
                onClick={() => setIsPrintModalOpen(true)}
                className="text-[10px] text-sky-700 hover:text-white hover:bg-sky-600 flex items-center gap-1.5 border border-sky-200 dark:border-sky-850 px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 font-bold transition cursor-pointer"
              >
                <Printer className="w-3 h-3" />
                Imprimir Lista
              </button>
              
              <button 
                onClick={handleClearList}
                className="text-[10px] text-red-650 hover:text-red-700 hover:bg-rose-50 dark:hover:bg-rose-950/20 flex items-center gap-1.5 border border-red-200 dark:border-red-900/50 px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 font-bold transition cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" />
                Mudar / Limpar Lista
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {receiptsList.length === 0 ? (
              <div className="bg-slate-50 dark:bg-slate-900/40 border border-slate-250 dark:border-slate-800 p-8 text-center rounded-xl">
                <FileText className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-900 dark:text-white uppercase">Nenhum comprovativo depositado</p>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">Utilize o formulário de envio à esquerda para liquidar uma cota e guardar o ficheiro.</p>
              </div>
            ) : (
              <AnimatePresence>
                {receiptsList.map((rec) => {
                  const isMatched = rec.status === 'matched_paid' || rec.status === 'manually_matched';
                  
                  return (
                    <motion.div
                      key={rec.id}
                      layoutId={rec.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0 }}
                      className="bg-white dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 p-4.5 hover:shadow-sm transition-all shadow-none flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4"
                    >
                      {/* Icon and metadata info with Black (on light) and White (on dark) letters */}
                      <div className="flex items-start gap-3.5 min-w-0 flex-1">
                        <div className="p-2.5 rounded-lg shrink-0 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white">
                          <FileText className="w-6 h-6" />
                        </div>
                        
                        <div className="min-w-0 space-y-1">
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                            <span className="font-bold text-slate-900 dark:text-white truncate block text-xs">
                              {rec.fileName}
                            </span>
                            <span className="text-[10px] font-mono font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.2 rounded">
                              {rec.fileSize}
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-slate-950 dark:text-slate-100 font-semibold text-[11px]">
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3" /> {rec.senderPhone}
                            </span>
                            <span className="text-slate-300">|</span>
                            <span className="flex items-center gap-1 font-bold text-red-600 uppercase text-[10px]">
                              <Calendar className="w-3 h-3" /> Quota Mês {rec.targetMonth}
                            </span>
                            <span className="text-slate-300">|</span>
                            <span className="text-slate-400 font-medium">Submetido por: {rec.uploadedBy}</span>
                          </div>

                          <div className="text-[11px] flex items-center gap-1.5 pt-1">
                            {rec.status === 'pending_admin_validation' ? (
                              <>
                                <RefreshCw className="w-4 h-4 text-amber-500 animate-spin shrink-0" />
                                <span className="text-amber-600 dark:text-amber-400 font-bold uppercase tracking-wider text-[9px] flex items-center gap-1">
                                  📥 Aguardando Validação do Administrador (Depósito Registado)
                                </span>
                              </>
                            ) : isMatched ? (
                              <>
                                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                                <span className="text-slate-900 dark:text-slate-100 font-bold">
                                  Liquidado e Validado para: <strong className="text-slate-900 dark:text-slate-100 font-extrabold">{rec.detectedMemberName}</strong>
                                </span>
                              </>
                            ) : (
                              <>
                                <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                                <span className="text-red-650 font-bold uppercase tracking-wider text-[9px]">
                                  {rec.auditStatus === 'failed' ? 'AUDITORIA REJEITADA: QUOTA NÃO FOI LIQUIDADA' : 'Pendente de Alinhamento de Utilizador (Informação Importante!)'}
                                </span>
                              </>
                            )}
                          </div>

                          {rec.auditStatus ? (
                            <div className="text-[10px] mt-1.5">
                              {rec.auditStatus === 'passed' ? (
                                <div className="inline-flex flex-wrap items-center gap-1.5 bg-emerald-50/70 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-md font-bold border border-emerald-200/50 dark:border-emerald-900/50">
                                  <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                  ✓ AUDITADO: {rec.auditDetails}
                                </div>
                              ) : (
                                <div className="inline-flex flex-wrap items-center gap-1.5 bg-rose-50/70 dark:bg-rose-950/30 text-red-700 dark:text-red-400 px-2 py-0.5 rounded-md font-bold border border-red-200/50 dark:border-red-900/50">
                                  <span className="flex h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
                                  ✗ REJEITADO: {rec.auditDetails}
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="text-[10px] mt-1.5">
                              <div className="inline-flex flex-wrap items-center gap-1.5 bg-slate-50 dark:bg-slate-950 text-slate-500 px-2 py-0.5 rounded-md font-bold border border-slate-200 dark:border-slate-800">
                                ✓ COMPROVATIVO ARQUIVADO (Auditoria Prévia)
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right-aligned interactive actions */}
                      <div className="flex flex-col sm:flex-row items-center gap-2.5 shrink-0">
                        
                        {/* Download button - retrieves actual or fallback file base64 data link */}
                        {rec.fileDataUrl ? (
                          <a
                            href={rec.fileDataUrl}
                            download={rec.fileName}
                            className="w-full sm:w-auto text-center flex items-center justify-center gap-1.5 text-[11px] font-bold text-slate-900 bg-slate-100 border border-slate-200 hover:bg-slate-200 px-3 py-2 rounded-lg transition"
                          >
                            <Download className="w-3.5 h-3.5 mt-0.5" />
                            Baixar
                          </a>
                        ) : (
                          <button
                            onClick={() => {
                              const blob = new Blob(['Mock proof record content for ' + rec.fileName], { type: 'text/plain' });
                              const url = URL.createObjectURL(blob);
                              const a = document.createElement('a');
                              a.href = url;
                              a.download = rec.fileName;
                              a.click();
                            }}
                            className="w-full sm:w-auto text-center flex items-center justify-center gap-1.5 text-[11px] font-bold text-slate-900 bg-slate-100 border border-slate-200 hover:bg-slate-200 px-3 py-2 rounded-lg transition-all"
                          >
                            <Download className="w-3.5 h-3.5 mt-0.5" />
                            Baixar
                          </button>
                        )}

                        {/* Cloud folder action redirect */}
                        <a
                          href={cloudFolderUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full sm:w-auto text-center flex items-center justify-center gap-1 text-[11px] font-bold text-slate-100 bg-slate-900 hover:bg-slate-800 border border-slate-900 px-3 py-2 rounded-lg transition"
                        >
                          Ver no Drive ↗
                        </a>

                        {/* Manual Alignment dropdown if status requires user resolution */}
                        {!isMatched ? (
                          <div className="w-full sm:w-auto flex items-center gap-2">
                            <select
                              onChange={(e) => {
                                const val = Number(e.target.value);
                                if (val) handleManualMatch(rec.id, val);
                              }}
                              defaultValue=""
                              className="bg-red-50 text-red-750 border border-red-200 rounded-lg p-2 text-[10px] font-extrabold focus:outline-none"
                            >
                              <option value="" disabled>Selec. Cooperador...</option>
                              {members.map((m) => (
                                <option key={m.id} value={m.id}>
                                  {m.name}
                                </option>
                              ))}
                            </select>
                          </div>
                        ) : (
                          <span className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-400 font-extrabold uppercase tracking-wider text-[11px] px-3.5 py-2 rounded-lg flex items-center gap-1.5 shadow-sm">
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                            Validado
                          </span>
                        )}
                      </div>

                    </motion.div>
                  );
                })}
              </AnimatePresence>
            )}
          </div>
        </div>

      </div>

      {/* Configurable Print Modal */}
      <PrintConfigModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        onConfirm={handlePrintReceipts}
        title="Imprimir Arquivo de Comprovativos"
        subtitle="Selecione o estilo e orientação do relatório de depósitos."
      />
    </div>
  );
}

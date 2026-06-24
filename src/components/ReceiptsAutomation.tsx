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
  Info
} from 'lucide-react';
import { Member, KixLog } from '../types';
import { saveReceiptToFirestore, loadReceiptsFromFirestore, deleteReceiptFromFirestore } from '../firebaseSync';

interface Receipt {
  id: string;
  senderPhone: string;
  fileName: string;
  fileSize: string;
  timestamp: string;
  detectedMemberName: string;
  detectedMemberId: number | null;
  status: 'matched_paid' | 'unmatched_pending' | 'manually_matched';
  targetMonth: number;
  uploadedBy: string;
  fileDataUrl?: string; // actual uploaded file data URL (base64)
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

      // Create new Receipt item
      const newReceipt: Receipt = {
        id: `rec-usr-${Date.now()}`,
        senderPhone: chosenMember.phone,
        fileName: selectedFile.name,
        fileSize: `${(selectedFile.size / 1024).toFixed(0)} KB`,
        timestamp: new Date().toISOString(),
        detectedMemberName: chosenMember.name,
        detectedMemberId: chosenMember.id,
        status: 'matched_paid',
        targetMonth: targetMonth,
        uploadedBy: currentUser?.role === 'admin' ? 'Administrador' : chosenMember.name,
        fileDataUrl: fileBase64, // local storage storage
      };

      // update local list
      const updatedReceipts = [newReceipt, ...receiptsList];
      setReceiptsList(updatedReceipts);

      saveReceiptToFirestore(newReceipt).catch(e => console.error("Erro ao salvar comprovativo na Firestore:", e));

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

      // Reset form states
      setSelectedFile(null);
      setFileBase64('');
      if (fileInputRef.current) fileInputRef.current.value = '';
      setIsProcessing(false);
      setSuccessMsg(`Sucesso: O comprovativo foi processado de forma segura e a cota do Mês ${targetMonth} de ${chosenMember.name} está liquidada no portal!`);
    }, 1300);
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
            
            <button 
              onClick={handleClearList}
              className="text-[10px] text-red-650 hover:text-red-700 hover:bg-rose-50 dark:hover:bg-rose-950/20 flex items-center gap-1.5 border border-red-200 dark:border-red-900/50 px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 font-bold transition"
            >
              <RefreshCw className="w-3 h-3" />
              Mudar / Limpar Lista
            </button>
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
                            {isMatched ? (
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
                                  Pendente de Alinhamento de Utilizador (Informação Importante!)
                                </span>
                              </>
                            )}
                          </div>
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

    </div>
  );
}

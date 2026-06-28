import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  HeartHandshake, 
  CalendarClock, 
  ShieldCheck, 
  Landmark, 
  CheckSquare, 
  AlertTriangle, 
  Send,
  Coins,
  Sparkles,
  Info,
  GitFork,
  ArrowRightLeft,
  DollarSign,
  Edit2,
  Trash2,
  X,
  Check
} from 'lucide-react';
import { Member, KixLog } from '../types';

interface SocialFundSectionProps {
  members: Member[];
  socialBalance: number;
  currentMonth: number;
  onRequestAid: (memberId: number, amount: number, description: string) => void;
  onEditAid?: (logId: string, newAmount: number, newDescription: string) => void;
  onDeleteAid?: (logId: string) => void;
  logs?: KixLog[];
  isAdmin?: boolean;
}

export default function SocialFundSection({
  members,
  socialBalance,
  currentMonth,
  onRequestAid,
  onEditAid,
  onDeleteAid,
  logs = [],
  isAdmin = false,
}: SocialFundSectionProps) {
  const [selectedMemberId, setSelectedMemberId] = useState<number>(members[0]?.id || 1);
  const [amount, setAmount] = useState<string>('50000');
  const [description, setDescription] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');

  // States for correcting/editing errors
  const [editingLogId, setEditingLogId] = useState<string | null>(null);
  const [deletingLogId, setDeletingLogId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState<string>('');
  const [editDescription, setEditDescription] = useState<string>('');

  // States for Cabimentação (Earmarking/Earmarking simulation)
  const [simulatedAmount, setSimulatedAmount] = useState<string>('120000');
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [simResult, setSimResult] = useState<{
    total: number;
    contemplation: number;
    social: number;
  } | null>(null);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-AO', {
      style: 'currency',
      currency: 'AOA',
      minimumFractionDigits: 2,
    })
      .format(val)
      .replace('AOA', 'KZs');
  };

  const handleSimulate = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSimulating(true);
    const val = parseFloat(simulatedAmount) || 120000;
    
    setTimeout(() => {
      const socialPart = val * (20000 / 120000);
      const contemplationPart = val - socialPart;
      setSimResult({
        total: val,
        contemplation: contemplationPart,
        social: socialPart
      });
      setIsSimulating(false);
    }, 600);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      setErrorMsg('Por favor, informe um valor de auxílio válido e maior que zero.');
      return;
    }

    if (numericAmount > socialBalance) {
      setErrorMsg(`Saldo insuficiente no Fundo de Apoio Social. O saldo máximo disponível é de ${formatCurrency(socialBalance)}.`);
      return;
    }

    if (description.trim().length === 0) {
      setErrorMsg('É obrigatório preencher a justificativa / descrição do apoio social.');
      return;
    }

    // Call state handler
    onRequestAid(selectedMemberId, numericAmount, description);

    const m = members.find((x) => x.id === selectedMemberId);
    setSuccessMsg(`Auxílio de ${formatCurrency(numericAmount)} aprovado com sucesso para ${m?.name}!`);
    setDescription('');
    setAmount('50000');

    setTimeout(() => {
      setSuccessMsg('');
    }, 4000);
  };

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Overview & Rules of the Social Fund */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900/60 rounded-2xl border border-slate-100 dark:border-slate-800/80 p-6 shadow-custom flex flex-col justify-between">
          <div>
            <h2 className="text-lg font-bold font-display text-slate-800 dark:text-white flex items-center gap-2 mb-4">
              <Landmark className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              Estrutura do Fundo de Interajuda & Apoio Social
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
              Em conformidade com as regras operacionais do <strong>Kix Fundo</strong>, cada membro deixa uma quota residual obrigatória de <strong>20.000,00 KZs</strong> retida mensalmente.
              Esta quantia é depositada diretamente em uma conta de poupança bancária coletiva de interajuda, gerando uma reserva líquida dedicada exclusivamente ao amparo assistencial de emergência dos membros.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-2">
              <div className="border border-emerald-50 dark:border-emerald-900/30 bg-emerald-50/20 dark:bg-emerald-950/10 rounded-xl p-4">
                <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-300 uppercase block tracking-wider mb-1">
                  Retenção Mensal Coletiva
                </span>
                <span className="text-sm text-slate-500 dark:text-slate-400 font-display">
                  12 membros × 20.000,00 KZs
                </span>
                <span className="text-lg font-bold font-mono text-emerald-700 dark:text-emerald-400 block mt-1">
                  240.000,00 KZs / mês
                </span>
              </div>

              <div className="border border-indigo-50 dark:border-indigo-900/30 bg-indigo-50/20 dark:bg-indigo-950/10 rounded-xl p-4">
                <span className="text-xs font-semibold text-indigo-800 dark:text-indigo-300 uppercase block tracking-wider mb-1">
                  Finalidade Estatutária
                </span>
                <p className="text-xs text-indigo-900 dark:text-indigo-200 leading-snug">
                  Ajuda de custo hospitalar, despesas escolares urgentes, subsídios de emergência doméstica e suporte funeral.
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-4">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400 font-display mb-2">Histórico de Apoios Recentes (Soma por Membro)</h3>
                {members.filter((m) => m.socialSupportReceived > 0).length === 0 ? (
                  <p className="text-xs text-slate-400 dark:text-slate-500 italic">Nenhum auxílio social pago até o momento.</p>
                ) : (
                  <div className="space-y-2">
                    {members
                      .filter((m) => m.socialSupportReceived > 0)
                      .map((m) => (
                        <div key={m.id} className="flex items-center justify-between text-xs bg-slate-50/50 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-850/60 px-3 py-2 rounded-lg">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-550" />
                            <span className="font-semibold text-slate-700 dark:text-slate-300">{m.name}</span>
                          </div>
                          <span className="text-slate-500 dark:text-slate-400">Total Recebido: <strong className="font-mono text-emerald-800 dark:text-emerald-400">{formatCurrency(m.socialSupportReceived)}</strong></span>
                        </div>
                      ))}
                  </div>
                )}
              </div>

              <div className="border-t border-slate-100 dark:border-slate-800/80 pt-4 space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400 font-display flex items-center gap-1.5 justify-between">
                  <span>Registos de Apoio Individuais</span>
                  {isAdmin && (
                    <span className="text-[9px] bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold px-2 py-0.5 rounded tracking-wide">
                      Administrador (Pode Editar/Eliminar)
                    </span>
                  )}
                </h3>

                {!logs || logs.filter((log) => log.type === 'social_aid').length === 0 ? (
                  <p className="text-xs text-slate-400 dark:text-slate-500 italic">Nenhum auxílio individual registado até o momento.</p>
                ) : (
                  <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                    {logs
                      .filter((log) => log.type === 'social_aid')
                      .map((log) => {
                        const isEditing = editingLogId === log.id;
                        const isDeleting = deletingLogId === log.id;
                        return (
                          <div key={log.id} className="bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800/80 p-3 rounded-lg space-y-2">
                            {isEditing ? (
                              <div className="space-y-2.5">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">A Corrigir Apoio de {log.memberName}</span>
                                  <span className="text-[9px] text-slate-400 font-mono">ID: {log.id}</span>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                  <div className="sm:col-span-1">
                                    <label className="text-[9px] font-bold text-slate-400 uppercase block mb-0.5">Montante</label>
                                    <input
                                      type="number"
                                      value={editAmount}
                                      onChange={(e) => setEditAmount(e.target.value)}
                                      className="w-full text-xs font-mono font-bold border border-slate-200 dark:border-slate-800 rounded px-2 py-1 bg-white dark:bg-slate-950 text-slate-800 dark:text-white"
                                    />
                                  </div>
                                  <div className="sm:col-span-2">
                                    <label className="text-[9px] font-bold text-slate-400 uppercase block mb-0.5">Descrição</label>
                                    <input
                                      type="text"
                                      value={editDescription}
                                      onChange={(e) => setEditDescription(e.target.value)}
                                      className="w-full text-xs border border-slate-200 dark:border-slate-800 rounded px-2 py-1 bg-white dark:bg-slate-950 text-slate-800 dark:text-white"
                                    />
                                  </div>
                                </div>
                                <div className="flex items-center gap-1.5 justify-end">
                                  <button
                                    type="button"
                                    onClick={() => setEditingLogId(null)}
                                    className="px-2 py-1 bg-slate-150 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 rounded text-[10px] font-bold transition-all"
                                  >
                                    Cancelar
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const numAmt = parseFloat(editAmount);
                                      if (isNaN(numAmt) || numAmt <= 0) {
                                        alert('Insira um valor válido maior que zero.');
                                        return;
                                      }
                                      const diff = numAmt - log.amount;
                                      if (diff > socialBalance) {
                                        alert(`Saldo social insuficiente para esta alteração. Saldo máximo adicional disponível: ${formatCurrency(socialBalance)}.`);
                                        return;
                                      }
                                      onEditAid?.(log.id, numAmt, editDescription);
                                      setEditingLogId(null);
                                    }}
                                    className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] font-bold transition-all flex items-center gap-1"
                                  >
                                    <Check className="w-3 h-3" />
                                    Guardar
                                  </button>
                                </div>
                              </div>
                            ) : isDeleting ? (
                              <div className="space-y-2 py-1 bg-rose-500/5 dark:bg-rose-500/10 p-1.5 rounded-lg">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-bold text-rose-700 dark:text-rose-400">Deseja eliminar este registo de auxílio?</span>
                                </div>
                                <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-normal">
                                  O apoio de <strong className="font-mono text-rose-600 dark:text-rose-450">{formatCurrency(log.amount)}</strong> para <strong>{log.memberName}</strong> será removido e o montante correspondente será devolvido ao fundo social.
                                </p>
                                <div className="flex items-center gap-1.5 justify-end mt-1.5">
                                  <button
                                    type="button"
                                    onClick={() => setDeletingLogId(null)}
                                    className="px-2 py-1 bg-slate-200/60 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 rounded text-[10px] font-bold transition-all cursor-pointer"
                                  >
                                    Cancelar
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      onDeleteAid?.(log.id);
                                      setDeletingLogId(null);
                                    }}
                                    className="px-2 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                    Sim, Eliminar
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-start justify-between gap-3 text-xs">
                                <div className="space-y-0.5">
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-bold text-slate-800 dark:text-slate-200">{log.memberName}</span>
                                    <span className="text-[9px] text-slate-400 dark:text-slate-500 font-mono">
                                      {new Date(log.timestamp).toLocaleDateString('pt-AO')}
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-slate-500 dark:text-slate-450 leading-relaxed italic">
                                    "{log.description.includes('Finalidade:') ? log.description.split('Finalidade:')[1].trim().replace(/\.$/, '') : log.description}"
                                  </p>
                                </div>
                                <div className="text-right shrink-0 flex flex-col items-end">
                                  <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(log.amount)}</span>
                                  {isAdmin && (
                                    <div className="flex items-center gap-1 mt-1">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setEditingLogId(log.id);
                                          setEditAmount(String(log.amount));
                                          let cleanDesc = log.description;
                                          if (log.description.includes('Finalidade:')) {
                                            cleanDesc = log.description.split('Finalidade:')[1].trim().replace(/\.$/, '');
                                          }
                                          setEditDescription(cleanDesc);
                                        }}
                                        title="Editar Registo"
                                        className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 text-amber-600 dark:text-amber-400 rounded transition-all cursor-pointer"
                                      >
                                        <Edit2 className="w-3 h-3" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setDeletingLogId(log.id);
                                        }}
                                        title="Eliminar Registo"
                                        className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 text-rose-600 dark:text-rose-400 rounded transition-all cursor-pointer"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="border-t border-slate-100 dark:border-slate-800 mt-6 pt-4 flex items-center justify-between bg-slate-50/70 dark:bg-slate-950/40 -mx-6 -mb-6 p-6 rounded-b-2xl">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 rounded-lg">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-slate-400 dark:text-slate-400 font-medium">Poupança Social Total</p>
                <p className="text-sm font-bold text-slate-800 dark:text-white font-mono">{formatCurrency(socialBalance)}</p>
              </div>
            </div>
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-300 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-2.5 py-1 rounded-lg">
              Conta Poupança Activa
            </span>
          </div>
        </div>

        {/* Inline Form to request social assist to a member or state restriction */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900/60 rounded-2xl border border-slate-100 dark:border-slate-800/80 p-6 shadow-custom flex flex-col justify-between">
          <div>
            <div>
              <h2 className="text-lg font-bold font-display text-slate-800 dark:text-white flex items-center gap-2 mb-2">
                <HeartHandshake className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                Registo de Ajuda
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                Formulário para o registo e liberação imediata de verbas socioassistenciais a membros ativos a partir do Fundo de Interajuda.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase block mb-1">
                  Beneficiário
                </label>
                <select
                  value={selectedMemberId}
                  onChange={(e) => setSelectedMemberId(Number(e.target.value))}
                  className="w-full text-sm border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 bg-white dark:bg-slate-950 text-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} (ID: #{m.id})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase block mb-1">
                  Montante (KZs)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="1000"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Ex: 50000"
                    className="w-full text-sm border border-slate-200 dark:border-slate-800 rounded-xl pl-3 pr-16 py-2.5 bg-white dark:bg-slate-950 text-slate-700 dark:text-white font-mono font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                  <span className="absolute right-3 top-2.5 text-xs text-slate-400 dark:text-slate-400 font-bold font-mono">
                    KZs
                  </span>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase block mb-1">
                  Descrição
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Descreva o motivo de apoio (ex: despesas de saúde urgente, subsídio doméstico, etc.)."
                  className="w-full text-sm border border-slate-200 dark:border-slate-800 rounded-xl p-3 bg-white dark:bg-slate-950 text-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              {/* Informational Notice about no interest / refund */}
              <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-3 flex gap-2.5 items-start">
                <Info className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <div className="text-[11px] text-slate-600 dark:text-slate-300 leading-normal">
                  <strong className="text-amber-600 dark:text-amber-400">Atenção:</strong> A cedência de apoios aos sócios não possui taxas de juro ou qualquer obrigatoriedade de reembolso.
                </div>
              </div>

              {/* Alert messages */}
              <AnimatePresence mode="wait">
                {errorMsg && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/35 text-amber-700 dark:text-amber-400 text-xs p-3 rounded-lg flex items-start gap-2 overflow-hidden"
                  >
                    <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                    <span>{errorMsg}</span>
                  </motion.div>
                )}

                {successMsg && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/35 text-emerald-700 dark:text-emerald-400 text-xs p-3 rounded-lg flex items-start gap-2 overflow-hidden"
                  >
                    <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    <span>{successMsg}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 dark:hover:shadow-lg text-white text-xs font-bold uppercase tracking-wider py-3 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                <Send className="w-4 h-4" />
                Submeter Registo de Ajuda
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Regras e Execução de Cabimentação de Fundo */}
      <div className="bg-white dark:bg-slate-900/60 rounded-2xl border border-slate-100 dark:border-slate-800/80 p-6 shadow-custom">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800/60 pb-5 mb-5">
          <div>
            <h3 className="text-lg font-black font-display text-slate-900 dark:text-white flex items-center gap-2.5">
              <GitFork className="w-5 h-5 text-amber-500" />
              Regras e Execução de Cabimentação de Fundo
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Compreenda as diretivas de cabimentação automatizada que gerem o fluxo de poupança coletiva e suporte social.
            </p>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-black uppercase tracking-wider rounded-lg border border-amber-500/20 w-fit">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
            </span>
            Auditoria Ativa
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Infographics */}
          <div className="lg:col-span-7 space-y-5">
            <div className="bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800/80 rounded-xl p-5 space-y-4">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-slate-400">Fluxo de Distribuição de Cotizações (Por Membro)</h4>
              
              <div className="space-y-4">
                {/* Total box */}
                <div className="flex items-center justify-between p-3.5 bg-gradient-to-r from-sky-900 to-indigo-900 text-white rounded-xl shadow-inner border border-sky-800/30">
                  <div className="flex items-center gap-2.5">
                    <Coins className="w-5 h-5 text-amber-400 shrink-0" />
                    <div>
                      <p className="text-[10px] uppercase font-bold tracking-widest text-sky-200">Quota Mensal Individual</p>
                      <p className="text-sm font-semibold text-slate-100">Depósito Obrigatório do Cooperante</p>
                    </div>
                  </div>
                  <span className="text-lg font-black font-mono">120.000,00 KZs</span>
                </div>

                {/* Arrow indicator */}
                <div className="flex justify-center my-1 text-slate-300 dark:text-slate-700">
                  <ArrowRightLeft className="w-5 h-5 rotate-90" />
                </div>

                {/* Earmarked outcomes */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-150 dark:border-slate-800/60 shadow-xs space-y-2 relative overflow-hidden group">
                    <div className="absolute top-0 left-0 h-1 w-full bg-indigo-500" />
                    <span className="text-[9px] font-black uppercase tracking-wider text-indigo-500 block">Fundo de Contemplação (83.3%)</span>
                    <span className="text-lg font-bold font-mono text-slate-800 dark:text-white block">100.000,00 KZs</span>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                      Destinado integralmente ao pote mensal de contemplação para os dois beneficiários sorteados/escala.
                    </p>
                  </div>

                  <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-150 dark:border-slate-800/60 shadow-xs space-y-2 relative overflow-hidden group">
                    <div className="absolute top-0 left-0 h-1 w-full bg-emerald-500" />
                    <span className="text-[9px] font-black uppercase tracking-wider text-emerald-500 block">Fundo de Interajuda (16.7%)</span>
                    <span className="text-lg font-bold font-mono text-emerald-600 dark:text-emerald-400 block">20.000,00 KZs</span>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                      Cabimentados automaticamente para a Poupança Social de Interajuda, gerando liquidez para amparos e apoios de urgência.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4 flex gap-3">
              <Info className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h5 className="text-xs font-bold text-amber-800 dark:text-amber-400 uppercase tracking-wide">Como é executada a regra de Cabimentação?</h5>
                <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                  Não é necessário executar esta regra de forma manual a cada depósito! O sistema Kix-Fundo possui um motor estatutário integrado. Sempre que um cooperante realiza o upload de um comprovativo ou o Administrador valida fisicamente uma quota de <strong>120.000,00 KZs</strong>, a divisão estatutária é computada em tempo real na base de dados, atualizando instantaneamente o saldo disponível do Fundo Social.
                </p>
              </div>
            </div>
          </div>

          {/* Earmarking Simulator Sandbox */}
          <div className="lg:col-span-5 bg-slate-50 dark:bg-slate-950/30 border border-slate-100 dark:border-slate-800/60 rounded-xl p-5 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 rounded-lg">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">Simulador de Cabimentação</h4>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500">Teste o impacto de quotas arrecadadas na divisão do Fundo.</p>
                </div>
              </div>

              <form onSubmit={handleSimulate} className="space-y-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase block mb-1">
                    Insira o Montante de Quota(s) Coletada(s)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="1000"
                      value={simulatedAmount}
                      onChange={(e) => setSimulatedAmount(e.target.value)}
                      className="w-full text-xs font-semibold font-mono border border-slate-200 dark:border-slate-800 rounded-lg pl-3 pr-16 py-2 bg-white dark:bg-slate-950 text-slate-800 dark:text-white"
                      placeholder="120000"
                    />
                    <span className="absolute right-3 top-2 text-[10px] font-bold font-mono text-slate-400">
                      KZs
                    </span>
                  </div>
                  <span className="text-[9px] text-slate-400 dark:text-slate-500 mt-1 block leading-normal">
                    Ex: 120.000,00 KZs (1 quota), 240.000,00 KZs (2 quotas) ou 1.440.000,00 KZs (total mensal).
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={isSimulating}
                  className="w-full bg-slate-900 dark:bg-slate-800 hover:bg-slate-850 dark:hover:bg-slate-700 text-white font-extrabold text-[10px] uppercase tracking-wider py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60"
                >
                  {isSimulating ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent animate-spin rounded-full" />
                      <span>A Executar Partilha...</span>
                    </>
                  ) : (
                    <>
                      <ArrowRightLeft className="w-3.5 h-3.5 text-amber-400" />
                      <span>Simular Regra de Cabimentação</span>
                    </>
                  )}
                </button>
              </form>

              {/* Simulation Result */}
              <AnimatePresence mode="wait">
                {simResult && !isSimulating && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-xl p-4 shadow-sm space-y-3 mt-2"
                  >
                    <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-50 dark:border-slate-800/50">
                      <span className="font-bold text-slate-600 dark:text-slate-400">Montante Processado:</span>
                      <span className="font-mono font-bold text-slate-900 dark:text-white">{formatCurrency(simResult.total)}</span>
                    </div>

                    <div className="space-y-2.5">
                      {/* Contemplation Row */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] font-bold text-indigo-500">
                          <span>Cabimentado p/ Contemplações:</span>
                          <span className="font-mono">{formatCurrency(simResult.contemplation)} (83.33%)</span>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-slate-850 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-indigo-500 h-full rounded-full" style={{ width: '83.33%' }} />
                        </div>
                      </div>

                      {/* Social Row */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] font-bold text-emerald-500">
                          <span>Cabimentado p/ Fundo de Interajuda:</span>
                          <span className="font-mono">{formatCurrency(simResult.social)} (16.67%)</span>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-slate-850 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-emerald-500 h-full rounded-full" style={{ width: '16.67%' }} />
                        </div>
                      </div>
                    </div>

                    <div className="text-[9px] bg-slate-50 dark:bg-slate-950/40 text-slate-500 dark:text-slate-400 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800/40 text-center leading-normal">
                      ✅ <strong>Sucesso:</strong> Auditoria operacional de conformidade concluída. O montante de <strong>{formatCurrency(simResult.social)}</strong> seria creditado de forma definitiva no Fundo Social de Interajuda.
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="text-[9.5px] text-slate-400 dark:text-slate-500 mt-4 italic text-center leading-normal">
              Sistema em conformidade com as diretivas de Auditoria e Partilha Cooperativa.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { HeartHandshake, CalendarClock, ShieldCheck, Landmark, CheckSquare, AlertTriangle, Send } from 'lucide-react';
import { Member } from '../types';

interface SocialFundSectionProps {
  members: Member[];
  socialBalance: number;
  currentMonth: number;
  onRequestAid: (memberId: number, amount: number, description: string) => void;
  isAdmin?: boolean;
}

export default function SocialFundSection({
  members,
  socialBalance,
  currentMonth,
  onRequestAid,
  isAdmin = false,
}: SocialFundSectionProps) {
  const [selectedMemberId, setSelectedMemberId] = useState<number>(members[0]?.id || 1);
  const [amount, setAmount] = useState<string>('50000');
  const [description, setDescription] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-AO', {
      style: 'currency',
      currency: 'AOA',
      minimumFractionDigits: 2,
    })
      .format(val)
      .replace('AOA', 'KZs');
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

          <div className="mt-5 space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400 font-display">Histórico de Apoios Recentes</h3>
            {members.filter((m) => m.socialSupportReceived > 0).length === 0 ? (
              <p className="text-xs text-slate-400 dark:text-slate-500 italic">Nenhum auxílio social pago até o momento.</p>
            ) : (
              <div className="space-y-2">
                {members
                  .filter((m) => m.socialSupportReceived > 0)
                  .map((m) => (
                    <div key={m.id} className="flex items-center justify-between text-xs bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800/80 px-3 py-2 rounded-lg">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        <span className="font-semibold text-slate-700 dark:text-slate-300">{m.name}</span>
                      </div>
                      <span className="text-slate-500 dark:text-slate-400">Total Recebido: <strong className="font-mono text-emerald-800 dark:text-emerald-400">{formatCurrency(m.socialSupportReceived)}</strong></span>
                    </div>
                  ))}
              </div>
            )}
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
        {isAdmin ? (
          <>
            <div>
              <h2 className="text-lg font-bold font-display text-slate-800 dark:text-white flex items-center gap-2 mb-2">
                <HeartHandshake className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                Conceder Auxílio de Interajuda
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-5">
                Formulário para liberação imediata de verbas socioassistenciais a membros ativos, sujeita à auditoria estatutária.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase block mb-1">
                  Selecione o Membro Solicitante
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
                  Valor do Auxílio (KZs)
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
                  Justificativa / Motivo de Apoio
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ex: Auxílio financeiro hospitalar emergencial concedido para custeio de medicamentos urgentes de cardiologia."
                  className="w-full text-sm border border-slate-200 dark:border-slate-800 rounded-xl p-3 bg-white dark:bg-slate-950 text-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
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
                Liberar Auxílio Social
              </button>
            </form>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center text-center py-12 px-4 space-y-4 my-auto">
            <div className="p-3.5 bg-amber-50 dark:bg-amber-950/20 text-amber-500 dark:text-amber-450 rounded-full border border-amber-100 dark:border-amber-900/30">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <h3 className="font-bold text-slate-800 dark:text-white text-sm font-display uppercase tracking-wider">Acesso Exclusivo a Administradores</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs leading-relaxed">
              O regulamento do <strong>Kixi - Fundo</strong> determina que a liberação e concessão de verbas do Fundo de Apoio Social e Interajuda é de responsabilidade de gestão exclusiva da comissão administrativa.
            </p>
            <div className="p-3 bg-sky-50 dark:bg-sky-950/20 text-sky-800 dark:text-sky-300 text-xs rounded-xl border border-sky-100 dark:border-sky-900/30 font-semibold mt-2">
              Se necessita de auxílio urgente, por favor contacte a comissão administradora do seu círculo.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

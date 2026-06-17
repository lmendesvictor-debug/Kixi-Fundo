import { useState } from 'react';
import { motion } from 'motion/react';
import { 
  HeartHandshake, 
  Coins, 
  Award, 
  Wallet, 
  Landmark, 
  CheckCircle, 
  Clock, 
  Shield, 
  AlertCircle 
} from 'lucide-react';

interface MetricCardsProps {
  currentMonth: number;
  socialBalance: number;
  currentPaidCount: number;
  totalMembersCount: number;
  beneficiaries: { name: string; isPaid: boolean }[];
  isPayoutDone: boolean;
  totalQuotasCollected: number;
  totalSocialRetained: number;
  totalSocialDisbursed: number;
  totalBeneficiaryDestined: number;
  totalBeneficiaryPaid: number;
  totalBeneficiaryPending: number;
  payoutsCompleted: { [month: number]: boolean };
}

export default function MetricCards({
  currentMonth,
  socialBalance,
  currentPaidCount,
  totalMembersCount,
  beneficiaries,
  isPayoutDone,
  totalQuotasCollected,
  totalSocialRetained,
  totalSocialDisbursed,
  totalBeneficiaryDestined,
  totalBeneficiaryPaid,
  totalBeneficiaryPending,
  payoutsCompleted,
}: MetricCardsProps) {
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'pending'>('all');
  const currentCollected = currentPaidCount * 120000;
  const targetArrecadacao = totalMembersCount * 120000; // 1,440,000.00
  const progressPercent = (currentCollected / targetArrecadacao) * 100;

  // Filter beneficiaries based on selected filter
  const filteredBeneficiaries = beneficiaries.filter((b) => {
    const isPaidOrLiberado = isPayoutDone || b.isPaid;
    if (statusFilter === 'paid') return isPaidOrLiberado;
    if (statusFilter === 'pending') return !isPaidOrLiberado;
    return true;
  });

  // Format currencies with KZ or KZs format
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-AO', {
      style: 'currency',
      currency: 'AOA',
      minimumFractionDigits: 2,
    })
      .format(val)
      .replace('AOA', 'KZs');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* LEFT: 4 GRID METRICS (Spans 9 columns on lg) */}
      <div className="lg:col-span-8 xl:col-span-9 grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* CARD 1: Património Coletivo Arrecadado (Tesouraria Geral) */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          whileHover={{ scale: 1.015 }}
          id="card-patrimonio-global"
          className="bg-white dark:bg-[#151c2c]/85 border-slate-200 dark:border-slate-800 rounded-2xl border border-l-4 border-l-emerald-500 p-5 shadow-sm flex flex-col justify-between relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-bl-full pointer-events-none" />
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-100/50 dark:bg-emerald-950/30 px-2.5 py-1 rounded-md">
                Tesouraria Geral
              </span>
              <div className="p-1.5 bg-emerald-50 dark:bg-emerald-950/20 rounded text-emerald-600 dark:text-emerald-400">
                <Wallet className="w-5 h-5" />
              </div>
            </div>
            <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider font-display">
              Património Coletivo Arrecadado
            </h3>
            <p className="text-2xl lg:text-3xl font-extrabold font-mono text-slate-950 dark:text-white tracking-tight mt-1.5">
              {formatCurrency(totalQuotasCollected)}
            </p>
            <p className="text-[10.5px] text-slate-400 mt-1 font-semibold">
              Rica soma acumulada de todas as cotizações pagas no sistema
            </p>
          </div>
          <div className="border-t border-slate-100 dark:border-slate-800/80 mt-4 pt-3 flex flex-col gap-1.5 text-[11px]">
            <div className="flex justify-between items-center text-slate-500">
              <span>Fundo Social (Interajuda):</span>
              <span className="font-bold text-slate-800 dark:text-slate-200 font-mono">
                {formatCurrency(totalSocialRetained)}
              </span>
            </div>
            <div className="flex justify-between items-center text-slate-500">
              <span>Fundo de Rotação (Ciclos):</span>
              <span className="font-bold text-slate-800 dark:text-slate-200 font-mono font-black text-sky-650 dark:text-sky-350">
                {formatCurrency(totalBeneficiaryDestined)}
              </span>
            </div>
          </div>
        </motion.div>

        {/* CARD 2: Fundo de Rotação (Ciclo de Pagamentos) */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.05 }}
          whileHover={{ scale: 1.015 }}
          id="card-fundo-rotacao"
          className="bg-white dark:bg-[#151c2c]/85 border-slate-200 dark:border-slate-800 rounded-2xl border border-l-4 border-l-sky-500 p-5 shadow-sm flex flex-col justify-between relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-sky-500/5 rounded-bl-full pointer-events-none" />
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-black uppercase tracking-wider text-sky-600 dark:text-sky-400 bg-sky-100/50 dark:bg-sky-950/30 px-2.5 py-1 rounded-md">
                Fluxo de Rotação
              </span>
              <div className="p-1.5 bg-sky-50 dark:bg-sky-950/20 rounded text-sky-600 dark:text-sky-400">
                <Landmark className="w-5 h-5" />
              </div>
            </div>
            <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider font-display">
              Destinado a Beneficiários
            </h3>
            <p className="text-2xl lg:text-3xl font-extrabold font-mono text-slate-950 dark:text-white tracking-tight mt-1.5">
              {formatCurrency(totalBeneficiaryDestined)}
            </p>
            <p className="text-[10.5px] text-slate-400 mt-1 font-semibold">
              Quotas coletadas para as rodadas rotativas de contemplaçoes
            </p>
          </div>
          <div className="border-t border-slate-100 dark:border-slate-800/80 mt-4 pt-3 flex flex-col gap-1.5 text-[11px]">
            <div className="flex justify-between items-center text-slate-500">
              <span className="flex items-center gap-1">
                <CheckCircle className="w-3 h-3 text-emerald-500" /> Distribuído / Pago:
              </span>
              <span className="font-bold text-emerald-650 dark:text-emerald-450 font-mono">
                {formatCurrency(totalBeneficiaryPaid)}
              </span>
            </div>
            <div className="flex justify-between items-center text-slate-500 relative group">
              <span className="flex items-center gap-1 cursor-help underline decoration-dotted">
                <Clock className="w-3 h-3 text-amber-500" /> Retido / Pendente de Liberação:
              </span>
              <span className="font-bold text-amber-650 dark:text-amber-450 font-mono flex items-center gap-1">
                {formatCurrency(totalBeneficiaryPending)}
                {totalBeneficiaryPending > 0 && (
                  <span className="inline-block w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                )}
              </span>
            </div>
          </div>
        </motion.div>

        {/* CARD 3: Fundo Reserva (Apoio Social de Interajuda) */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          whileHover={{ scale: 1.015 }}
          id="card-fundo-social"
          className="bg-white dark:bg-[#151c2c]/85 border-slate-200 dark:border-slate-800 rounded-2xl border border-l-4 border-l-slate-700 p-5 shadow-sm flex flex-col justify-between relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-slate-500/5 rounded-bl-full pointer-events-none" />
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-400 bg-slate-100/50 dark:bg-slate-950/30 px-2.5 py-1 rounded-md">
                Social e Emergências
              </span>
              <div className="p-1.5 bg-slate-100 dark:bg-slate-900 rounded text-slate-900 dark:text-slate-150">
                <HeartHandshake className="w-5 h-5" />
              </div>
            </div>
            <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider font-display">
              Fundo Social Acumulado
            </h3>
            <p className="text-2xl lg:text-3xl font-extrabold font-mono text-slate-950 dark:text-white tracking-tight mt-1.5">
              {formatCurrency(socialBalance)}
            </p>
            <p className="text-[10.5px] text-slate-400 mt-1 font-semibold">
              Reserva de segurança para resgate assistencial e saúde
            </p>
          </div>
          <div className="border-t border-slate-100 dark:border-slate-800/80 mt-4 pt-3 flex flex-col gap-1.5 text-[11px]">
            <div className="flex justify-between items-center text-slate-500">
              <span>Total Social Retido:</span>
              <span className="font-bold text-slate-800 dark:text-slate-200 font-mono">
                {formatCurrency(totalSocialRetained)}
              </span>
            </div>
            <div className="flex justify-between items-center text-slate-500">
              <span>Apoios Concedidos (Saídas):</span>
              <span className="font-bold text-rose-500 font-mono">
                -{formatCurrency(totalSocialDisbursed)}
              </span>
            </div>
          </div>
        </motion.div>

        {/* CARD 4: Progresso da Arrecadação Mensal */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.15 }}
          whileHover={{ scale: 1.015 }}
          id="card-arrecadacao-mensal"
          className="bg-white dark:bg-[#151c2c]/85 border-slate-200 dark:border-slate-800 rounded-2xl border border-l-4 border-l-blue-500 p-5 shadow-sm flex flex-col justify-between relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-bl-full pointer-events-none" />
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-black uppercase tracking-wider text-blue-605 dark:text-blue-400 bg-blue-100/50 dark:bg-blue-950/30 px-2.5 py-1 rounded-md">
                Ciclo Corrente: {currentMonth} / 6
              </span>
              <div className="p-1.5 bg-blue-50 dark:bg-blue-950/20 rounded text-blue-600 dark:text-blue-400">
                <Coins className="w-5 h-5" />
              </div>
            </div>
            <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider font-display">
              Mensal Arrecadado (Mês actual)
            </h3>
            <p className="text-2xl lg:text-3xl font-extrabold font-mono text-slate-950 dark:text-white tracking-tight mt-1.5">
              {formatCurrency(currentCollected)}
            </p>
          </div>

          <div className="mt-4">
            <div className="flex items-center justify-between text-[11px] mb-1">
              <span className="text-slate-400 font-semibold">Progresso ({currentPaidCount}/12 membros)</span>
              <span className="font-bold text-slate-700 dark:text-slate-200 font-mono">{formatCurrency(targetArrecadacao)}</span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden flex items-center">
              <div
                className="bg-blue-500 h-full rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </motion.div>

      </div>

      {/* RIGHT: COMPACT CONTEMPLADOS OF THE MONTH (Spans 3 columns on lg) */}
      <div className="lg:col-span-4 xl:col-span-3">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          id="card-beneficiarios-mes"
          className="bg-white dark:bg-[#151c2c]/85 border-slate-200 dark:border-slate-800 rounded-2xl border-2 p-5 shadow-md flex flex-col justify-between h-full relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-20 h-20 bg-amber-500/5 rounded-bl-full pointer-events-none" />
          <div>
            <div className="flex items-center justify-between mb-3.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-805 dark:text-amber-400 bg-amber-100/50 dark:bg-amber-950/30 px-2.5 py-1 rounded-md">
                Contemplações Mês {currentMonth}
              </span>
              <div className="p-1.5 bg-amber-50 dark:bg-amber-950/20 rounded text-amber-600 dark:text-amber-400">
                <Award className="w-5 h-5" />
              </div>
            </div>
            
            <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-350 uppercase tracking-wider font-display mb-2">
              Membros Contemplados no Ciclo
            </h3>

            {/* Tiny Filter Segmented Control */}
            <div className="flex border border-slate-150 dark:border-slate-800/80 rounded-lg p-0.5 mb-2.5 bg-slate-50/50 dark:bg-slate-900/40">
              <button
                onClick={() => setStatusFilter('all')}
                className={`flex-1 text-[9px] py-1 px-1 font-extrabold rounded-md transition-all cursor-pointer text-center ${
                  statusFilter === 'all'
                    ? 'bg-amber-500 text-slate-950 shadow-xs'
                    : 'text-slate-450 hover:text-slate-700 dark:hover:text-slate-200'
                }`}
              >
                Todos ({beneficiaries.length})
              </button>
              <button
                onClick={() => setStatusFilter('paid')}
                className={`flex-1 text-[9px] py-1 px-1 font-extrabold rounded-md transition-all cursor-pointer text-center ${
                  statusFilter === 'paid'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-450 hover:text-slate-700 dark:hover:text-slate-200'
                }`}
              >
                Pagos ({beneficiaries.filter(b => isPayoutDone || b.isPaid).length})
              </button>
              <button
                onClick={() => setStatusFilter('pending')}
                className={`flex-1 text-[9px] py-1 px-1 font-extrabold rounded-md transition-all cursor-pointer text-center ${
                  statusFilter === 'pending'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'text-slate-450 hover:text-slate-700 dark:hover:text-slate-200'
                }`}
              >
                Pendente ({beneficiaries.filter(b => !isPayoutDone && !b.isPaid).length})
              </button>
            </div>

            {/* Scrollable Compact List Block */}
            <div className="space-y-2 max-h-[160px] lg:max-h-[220px] overflow-y-auto pr-1">
              {filteredBeneficiaries.length === 0 ? (
                <div className="text-center py-6 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none">
                  Sem registros
                </div>
              ) : (
                filteredBeneficiaries.map((b, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs bg-slate-50/70 dark:bg-slate-900/60 px-2.5 py-1.5 rounded-xl border border-slate-100 dark:border-slate-800/80 hover:border-slate-205 dark:hover:border-slate-750 transition-colors">
                    <span className="font-bold text-slate-800 dark:text-slate-250 truncate max-w-[130px]">{b.name}</span>
                    {isPayoutDone ? (
                      <span className="text-[9px] font-black text-emerald-800 bg-emerald-100/50 dark:bg-emerald-950/45 dark:text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-200/50 dark:border-emerald-900/35 shrink-0">
                        Pago (600k)
                      </span>
                    ) : b.isPaid ? (
                      <span className="text-[9px] font-black text-blue-700 bg-blue-100/50 dark:bg-blue-950/45 dark:text-blue-400 px-2 py-0.5 rounded-full border border-blue-200/50 dark:border-blue-900/35 shrink-0">
                        Liberado
                      </span>
                    ) : (
                      <span className="text-[9px] font-black text-amber-700 bg-amber-100/50 dark:bg-amber-950/45 dark:text-amber-400 px-2 py-0.5 rounded-full border border-amber-200/50 dark:border-amber-900/35 shrink-0 animate-pulse">
                        Aguardando
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 text-[10.5px] text-slate-400 font-semibold flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 text-sky-400 shrink-0" />
            <span>Beneficiários recebem 600.000,00 KZs cada por ciclo.</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

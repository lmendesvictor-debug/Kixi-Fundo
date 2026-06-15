import { useState } from 'react';
import { motion } from 'motion/react';
import { HeartHandshake, Coins, Award, HelpCircle, CheckCircle, Clock } from 'lucide-react';

interface MetricCardsProps {
  currentMonth: number;
  socialBalance: number;
  currentPaidCount: number;
  totalMembersCount: number;
  beneficiaries: { name: string; isPaid: boolean }[];
  isPayoutDone: boolean;
}

export default function MetricCards({
  currentMonth,
  socialBalance,
  currentPaidCount,
  totalMembersCount,
  beneficiaries,
  isPayoutDone,
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
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* CARD 1: Fundo de Interajuda */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        whileHover={{ scale: 1.01 }}
        id="card-fundo-social"
        className="bg-white dark:bg-[#151c2c]/85 border-slate-200 dark:border-slate-800 rounded-xl border border-l-4 border-l-slate-700 p-5 shadow-sm flex flex-col justify-between relative overflow-hidden"
      >
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-900 dark:text-slate-100">
              Poupança Social Coletiva
            </span>
            <div className="p-1.5 bg-slate-100 dark:bg-slate-900 rounded text-slate-900 dark:text-slate-100">
              <HeartHandshake className="w-5 h-5" />
            </div>
          </div>
          <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-300 uppercase tracking-wider font-display">
            Fundo de Interajuda Acumulado
          </h3>
          <p className="text-2xl lg:text-3xl font-extrabold font-mono text-slate-900 dark:text-slate-100 tracking-tight mt-1">
            {formatCurrency(socialBalance)}
          </p>
          <div className="text-[11px] text-slate-900 dark:text-slate-100 font-bold mt-1">
            ↑ {formatCurrency(currentPaidCount * 20000)} este mês
          </div>
        </div>
        <div className="border-t border-slate-100 dark:border-slate-800 mt-4 pt-3 flex items-center justify-between text-[11px] text-slate-400">
          <span>Retenções de 20.000,00 por cota</span>
          <span className="font-bold text-slate-900 dark:text-slate-100">Disponível</span>
        </div>
      </motion.div>

      {/* CARD 2: Progresso da Arrecadação Mensal */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.05 }}
        whileHover={{ scale: 1.01 }}
        id="card-arrecadacao-mensal"
        className="bg-white dark:bg-[#151c2c]/85 border-slate-200 dark:border-slate-800 rounded-xl border border-l-4 border-l-blue-500 p-5 shadow-sm flex flex-col justify-between relative overflow-hidden"
      >
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-blue-800 dark:text-blue-400">
              Ciclo {currentMonth} / 6
            </span>
            <div className="p-1.5 bg-blue-50 dark:bg-blue-950/20 rounded text-blue-600 dark:text-blue-400">
              <Coins className="w-5 h-5" />
            </div>
          </div>
          <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-300 uppercase tracking-wider font-display">
            Arrecadação Mensal Corrente
          </h3>
          <p className="text-2xl lg:text-3xl font-extrabold font-mono text-slate-900 dark:text-slate-100 tracking-tight mt-1">
            {formatCurrency(currentCollected)}
          </p>
        </div>

        <div className="mt-2.5">
          <div className="flex items-center justify-between text-[11px] mb-1">
            <span className="text-slate-400">Progresso ({currentPaidCount}/12 membros)</span>
            <span className="font-bold text-slate-700 dark:text-slate-200">{formatCurrency(targetArrecadacao)}</span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden flex items-center">
            <div
              className="bg-blue-500 h-full rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </motion.div>

      {/* CARD 3: Beneficiários do Mês */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        whileHover={{ scale: 1.01 }}
        id="card-beneficiarios-mes"
        className="bg-white dark:bg-[#151c2c]/85 border-slate-200 dark:border-slate-800 rounded-xl border border-l-4 border-l-amber-500 p-5 shadow-sm flex flex-col justify-between relative overflow-hidden"
      >
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-800 dark:text-amber-400">
              Ganhos do Mês {currentMonth}
            </span>
            <div className="p-1.5 bg-amber-50 dark:bg-amber-950/20 rounded text-amber-600 dark:text-amber-400">
              <Award className="w-5 h-5" />
            </div>
          </div>
          
          <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-300 uppercase tracking-wider font-display mb-2">
            Membros Contemplados no Ciclo
          </h3>

          {/* Tiny Filter Segmented Control */}
          <div className="flex border border-slate-100 dark:border-slate-800/80 rounded-lg p-0.5 mb-2.5 bg-slate-50/50 dark:bg-slate-900/40">
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
          <div className="space-y-1.5 max-h-[125px] overflow-y-auto pr-1">
            {filteredBeneficiaries.length === 0 ? (
              <div className="text-center py-6 text-[10px] font-bold text-slate-400 dark:text-slate-550 uppercase tracking-widest leading-none">
                Sem registros
              </div>
            ) : (
              filteredBeneficiaries.map((b, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs bg-slate-50/70 dark:bg-slate-900/60 px-2 py-1 rounded-lg border border-slate-100 dark:border-slate-800/60 hover:border-slate-200 dark:hover:border-slate-705 transition-colors">
                  <span className="font-bold text-slate-700 dark:text-slate-300 truncate max-w-[130px]">{b.name}</span>
                  {isPayoutDone ? (
                    <span className="text-[9px] font-extrabold text-emerald-800 bg-emerald-100/50 dark:bg-emerald-950/45 dark:text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-200/50 dark:border-emerald-900/35 shrink-0">
                      Pago (600k)
                    </span>
                  ) : b.isPaid ? (
                    <span className="text-[9px] font-extrabold text-blue-700 bg-blue-100/50 dark:bg-blue-950/45 dark:text-blue-400 px-2 py-0.5 rounded-full border border-blue-200/50 dark:border-blue-900/35 shrink-0">
                      Liberado
                    </span>
                  ) : (
                    <span className="text-[9px] font-extrabold text-amber-700 bg-amber-100/50 dark:bg-amber-950/45 dark:text-amber-400 px-2 py-0.5 rounded-full border border-amber-200/50 dark:border-amber-900/35 shrink-0 animate-pulse">
                      Aguardando
                    </span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

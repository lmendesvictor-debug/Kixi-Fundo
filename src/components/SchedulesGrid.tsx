import { motion } from 'motion/react';
import { Calendar, Check, CircleDot, ArrowRight, UserCheck } from 'lucide-react';
import { Member } from '../types';

interface SchedulesGridProps {
  currentMonth: number;
  members: Member[];
  onSelectCycle: (monthNum: number) => void;
  payoutDoneMap: { [month: number]: boolean };
  isAdmin?: boolean;
}

export default function SchedulesGrid({
  currentMonth,
  members,
  onSelectCycle,
  payoutDoneMap,
  isAdmin = false,
}: SchedulesGridProps) {
  // Group members by their assignedMonth (1 to 6)
  const months = Array.from({ length: 6 }, (_, i) => i + 1);

  const getBeneficiariesForMonth = (mNum: number) => {
    return members.filter((m) => m.assignedMonth === mNum);
  };

  const getMonthName = (mNum: number) => {
    const monthNames = [
      'Mês 1 (Ciclo Inicial)',
      'Mês 2 (Ciclo Secundário)',
      'Mês 3 (Ciclo Corrente)',
      'Mês 4 (Ciclo Médio)',
      'Mês 5 (Ciclo Avançado)',
      'Mês 6 (Ciclo Encerramento)',
    ];
    return monthNames[mNum - 1];
  };

  return (
    <div className="bg-white dark:bg-slate-900/60 rounded-2xl border border-slate-100 dark:border-slate-800/80 p-6 shadow-custom">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-lg font-bold font-display text-slate-800 dark:text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-teal-600 dark:text-teal-400" />
            Plano de Escalonamento e Rotação (Ciclo de 6 Meses)
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {isAdmin 
              ? 'Cada ciclo mensal contempla exatamente 2 membros com 600.000,00 KZs cada. Clique em qualquer ciclo para simular e alterar o foco de gestão.'
              : 'Cada ciclo mensal contempla exatamente 2 membros com 600.000,00 KZs cada. Calendário oficial do fundo cooperativo.'}
          </p>
        </div>
        <div className="text-xs font-semibold bg-teal-50 dark:bg-teal-950/20 text-teal-700 dark:text-teal-300 px-3 py-1.5 rounded-lg border border-teal-100 dark:border-teal-900/30 flex items-center gap-2">
          <CircleDot className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 animate-pulse" />
          <span>Foco Ativo: Mês {currentMonth}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {months.map((mNum) => {
          const isSelected = currentMonth === mNum;
          const isPast = mNum < currentMonth;
          const isFuture = mNum > currentMonth;
          const beneficiaries = getBeneficiariesForMonth(mNum);
          const isPayoutDone = payoutDoneMap[mNum];

          return (
            <motion.div
              key={mNum}
              whileHover={isAdmin ? { y: -2 } : undefined}
              onClick={isAdmin ? () => onSelectCycle(mNum) : undefined}
              className={`${isAdmin ? 'cursor-pointer' : 'cursor-default'} rounded-xl border p-4.5 transition-all flex flex-col justify-between ${
                isSelected
                  ? 'bg-gradient-to-br from-emerald-50/70 to-teal-50/70 dark:from-emerald-950/20 dark:to-teal-950/20 border-teal-500 shadow-md ring-2 ring-teal-500/20'
                  : isPast
                  ? 'bg-slate-50/70 dark:bg-slate-950/30 border-slate-200 dark:border-slate-800 opacity-80'
                  : 'bg-white dark:bg-slate-900/40 border-slate-100 dark:border-slate-800 hover:border-slate-350 dark:hover:border-slate-700'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3.5">
                  <span className="font-display font-bold text-sm text-slate-800 dark:text-white">
                    {getMonthName(mNum)}
                  </span>

                  {isPayoutDone ? (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-slate-900 dark:text-slate-100 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200/50 dark:border-emerald-800/30">
                      <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" /> Pago
                    </span>
                  ) : isSelected ? (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-slate-900 dark:text-slate-100 bg-teal-50 dark:bg-teal-950/40 px-2.5 py-0.5 rounded-full border border-teal-200 dark:border-teal-800 animate-pulse">
                      Ativo
                    </span>
                  ) : isPast ? (
                    <span className="text-[10px] font-bold text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-950/40 border border-red-200 dark:border-red-900/30 rounded-full px-2 py-0.5 animate-pulse">
                      Pendente Payout
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                      Futuro
                    </span>
                  )}
                </div>

                <div className="space-y-2 mt-2">
                  <span className="text-[11px] text-slate-400 dark:text-slate-400 block font-medium">Beneficiários do Ciclo:</span>
                  {beneficiaries.map((b) => (
                    <div
                      key={b.id}
                      className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium border ${
                        isSelected
                          ? 'bg-white/90 dark:bg-slate-900/70 border-teal-100 dark:border-teal-900/30 text-teal-900 dark:text-teal-200'
                          : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <UserCheck className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0" />
                      <span className="truncate flex-1">{b.name}</span>
                      <span className="text-[10px] font-mono font-semibold text-slate-500 dark:text-slate-400">#0{b.id}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4.5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
                <div className="flex flex-col">
                  <span className="text-slate-400 dark:text-slate-400 font-medium font-sans">Retorno Total</span>
                  <span className="font-mono font-bold text-slate-700 dark:text-slate-300">1.200.000,00 KZs</span>
                </div>
                <div className="flex flex-col text-right">
                  <span className="text-slate-400 dark:text-slate-400 font-medium font-sans">Fundo de Apoio (+20k)</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-slate-100">240.000,00 KZs</span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

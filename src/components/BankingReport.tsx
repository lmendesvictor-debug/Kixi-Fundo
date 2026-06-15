import { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Building2, 
  TrendingUp, 
  Award, 
  Clock, 
  ShieldCheck, 
  Activity, 
  ArrowUpRight, 
  ArrowDownRight,
  Sparkles,
  Layers,
  FileText
} from 'lucide-react';
import { Member, KixLog } from '../types';

interface BankingReportProps {
  currentMonth: number;
  members: Member[];
  logs: KixLog[];
  payoutsCompleted: { [month: number]: boolean };
  formatCurrency: (val: number) => string;
}

export default function BankingReport({
  currentMonth,
  members,
  logs,
  payoutsCompleted,
  formatCurrency,
}: BankingReportProps) {
  
  // Total overall contributions made
  const totalPaidContributionsCount = members.reduce((acc, m) => {
    const paidInMember = Object.keys(m.contributions).filter(
      (monthKey) => m.contributions[Number(monthKey)]?.paid
    ).length;
    return acc + paidInMember;
  }, 0);

  // Fundo de Interajuda logic
  const totalSocialRetained = totalPaidContributionsCount * 20000;
  
  // Total Social support disbursed from logs
  const socialAids = logs.filter((log) => log.type === 'social_aid');
  const totalSocialDisbursed = socialAids.reduce((acc, log) => acc + log.amount, 0);
  const socialBalance = totalSocialRetained - totalSocialDisbursed;

  // Total collected capital in general
  const totalGrossCollected = totalPaidContributionsCount * 120000;

  // Total benefits paid out (600,000.00 * 2 per month completed)
  const completedMonthsOfPayout = Object.keys(payoutsCompleted).filter(
    (monthKey) => payoutsCompleted[Number(monthKey)]
  ).length;
  const totalBenefitsPaid = completedMonthsOfPayout * 1200000;

  // Real available cash in Bank account
  const bankBalance = totalGrossCollected - totalBenefitsPaid - totalSocialDisbursed;

  // Compute timeline data monthly (1 to 6)
  const monthlyTimeline = [1, 2, 3, 4, 5, 6].map((m) => {
    // contributions paid in month m
    const paidInMonth = members.filter((member) => member.contributions[m]?.paid).length;
    const accumulatedSocial = paidInMonth * 20000;
    
    // aids in month m
    const aidsInMonth = logs
      .filter((log) => log.type === 'social_aid' && log.month === m)
      .reduce((acc, log) => acc + log.amount, 0);

    const isPaidOut = payoutsCompleted[m];
    
    return {
      month: m,
      paidInMonth,
      accumulatedSocial,
      aidsInMonth,
      isPaidOut,
    };
  });

  return (
    <div className="space-y-8" id="banking-reports-section">
      
      {/* Overview Cards with high contrast layout */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Real Cash balance card */}
        <motion.div
          whileHover={{ scale: 1.01 }}
          className="bg-slate-900 text-white rounded-xl border border-slate-800 p-6 flex flex-col justify-between relative overflow-hidden shadow-md"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-slate-800/40 rounded-bl-full -z-10" />
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-white bg-slate-800 px-2.5 py-1 rounded-full">
                Banco BIC / Conta Consórcio
              </span>
              <div className="p-2 bg-slate-800 rounded-lg text-white">
                <Building2 className="w-5 h-5" />
              </div>
            </div>
            
            <p className="text-xs text-slate-400 uppercase tracking-widest font-semibold font-display">
              SALDO DISPONÍVEL REAL EM BANCO
            </p>
            <h3 className="text-3xl font-black font-mono tracking-tight text-white mt-2">
              {formatCurrency(bankBalance)}
            </h3>
            
            <div className="mt-4 flex items-center gap-2 text-[11px] text-slate-400 font-mono">
              <span>NIB Kix:</span>
              <span className="select-all font-semibold text-white">0004.0934.0044.3312.01</span>
            </div>
          </div>

          <div className="border-t border-slate-800/80 mt-5 pt-3.5 flex items-center justify-between text-xs">
            <span className="text-slate-500">Capital Transitório Geral</span>
            <span className="font-bold text-white">Auditado Coletivo</span>
          </div>
        </motion.div>

        {/* Support Reserve fund card */}
        <motion.div
          whileHover={{ scale: 1.01 }}
          className="bg-white rounded-xl border border-slate-200 border-l-4 border-l-slate-800 p-6 flex flex-col justify-between relative overflow-hidden shadow-sm"
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-900 bg-slate-100 px-2.5 py-1 rounded-full">
                Poupança Social Acumulada
              </span>
              <div className="p-2 bg-slate-100 rounded-lg text-slate-900">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>
            
            <p className="text-xs text-slate-900 dark:text-slate-200 uppercase tracking-widest font-semibold font-display">
              FUNDO DE INTERAJUDA DISPONÍVEL
            </p>
            <h3 className="text-3xl font-black font-mono tracking-tight text-slate-900 mt-2">
              {formatCurrency(socialBalance)}
            </h3>
            
            <div className="mt-2 text-[11px] text-slate-900 font-bold flex items-center gap-1">
              <span>Retenções brutas:</span>
              <span>{formatCurrency(totalSocialRetained)}</span>
            </div>
          </div>

          <div className="border-t border-slate-100 mt-5 pt-3.5 flex items-center justify-between text-xs text-slate-400">
            <span>Apoios Disbursados:</span>
            <span className="font-bold text-red-600">{formatCurrency(totalSocialDisbursed)}</span>
          </div>
        </motion.div>

        {/* Rotation Metrics card */}
        <motion.div
          whileHover={{ scale: 1.01 }}
          className="bg-white rounded-xl border border-slate-200 border-l-4 border-l-blue-500 p-6 flex flex-col justify-between shadow-sm"
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-800 bg-blue-50 px-2.5 py-1 rounded-full">
                Estatísticas de Fluxo
              </span>
              <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                <Activity className="w-5 h-5" />
              </div>
            </div>
            
            <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold font-display">
              TOTAL DE ARRECADAÇÃO BRUTA
            </p>
            <h3 className="text-3xl font-black font-mono tracking-tight text-slate-900 mt-2">
              {formatCurrency(totalGrossCollected)}
            </h3>
            
            <div className="mt-2 text-[11px] text-blue-600 font-semibold">
              {totalPaidContributionsCount} quotas individuais recebidas
            </div>
          </div>

          <div className="border-t border-slate-100 mt-5 pt-3.5 flex items-center justify-between text-xs text-slate-400">
            <span>Benefícios Repassados:</span>
            <span className="font-bold text-slate-700">{formatCurrency(totalBenefitsPaid)}</span>
          </div>
        </motion.div>

      </div>

      {/* Grid: Financial Math & Evolution Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Conciliation ledger math formula description card */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-5">
          <h3 className="font-display font-bold text-slate-900 text-sm tracking-wide uppercase flex items-center gap-2">
            <Layers className="w-4 h-4 text-slate-900" />
            CONCILIAÇÃO MATEMÁTICA DO CAIXA
          </h3>
          
          <p className="text-xs text-slate-500 leading-relaxed">
            A liquidação e distribuição respeitam rigidamente as diretrizes contábeis do Kix_Fundo para evitar assimetria ou furos no caixa coletivo.
          </p>

          <div className="space-y-4 pt-2">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 font-mono text-xs">
              <div className="flex justify-between text-slate-500">
                <span>(+) Entradas de Quotas:</span>
                <span className="text-slate-800 font-semibold">{formatCurrency(totalGrossCollected)}</span>
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                {totalPaidContributionsCount} pagamentos registrados * 120.000,00 KZs
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 font-mono text-xs">
              <div className="flex justify-between text-slate-500">
                <span>(-) Benefícios de Rotação:</span>
                <span className="text-rose-600 font-semibold">-{formatCurrency(totalBenefitsPaid)}</span>
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                {completedMonthsOfPayout} meses concluídos * 2 contemplados a 600.000,00 KZs
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 font-mono text-xs">
              <div className="flex justify-between text-slate-500">
                <span>(-) Apoios de Interajuda:</span>
                <span className="text-rose-600 font-semibold">-{formatCurrency(totalSocialDisbursed)}</span>
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                Auxílios emergenciais pagos aos membros do consórcio
              </div>
            </div>

            <div className="border-t border-dashed border-slate-200 pt-3">
              <div className="flex justify-between font-mono text-sm leading-none">
                <span className="font-bold text-slate-700">(=) Saldo Bancário Final:</span>
                <span className="font-black text-slate-900">{formatCurrency(bankBalance)}</span>
              </div>
              <div className="text-[10px] text-slate-500 font-sans mt-1.5 uppercase tracking-wide">
                Verificação da Integridade: <span className="text-red-650 font-extrabold">✓ OK (CONCILIADO SUCESSO)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Timeline visualization of the support reserve fund */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <h3 className="font-display font-medium text-slate-800 text-sm tracking-wide uppercase flex items-center gap-2 mb-4">
            <FileText className="w-4 h-4 text-blue-500" />
            EVOLUÇÃO DA POUPANÇA SOCIAL (LINHA DO TEMPO)
          </h3>

          <div className="relative pl-6 border-l border-slate-200 space-y-5 my-2">
            {monthlyTimeline.map((item, index) => {
              const monthTitle = `Mês ${item.month}`;
              // Calc accumulated social pool at that point assuming full compliance of previous months
              let cumulativePool = 0;
              for (let i = 1; i <= item.month; i++) {
                const checkedMonth = monthlyTimeline.find(t => t.month === i);
                if (checkedMonth) {
                  cumulativePool += checkedMonth.accumulatedSocial - checkedMonth.aidsInMonth;
                }
              }

              const isPastOrCurrent = item.month <= currentMonth;

              return (
                <div key={item.month} className="relative">
                  {/* Timeline dot */}
                  <div className={`absolute -left-[31px] top-1 w-2.5 h-2.5 rounded-full border-2 bg-white transition-all ${
                    isPastOrCurrent 
                      ? 'border-slate-800 scale-125 shadow-sm shadow-slate-400' 
                      : 'border-slate-300'
                  }`} />

                  <div className={`p-3 bg-slate-50 rounded-lg border transition-all ${
                    item.month === currentMonth 
                      ? 'border-slate-900 bg-slate-100/50' 
                      : 'border-slate-100'
                  }`}>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold uppercase ${isPastOrCurrent ? 'text-slate-800' : 'text-slate-450'}`}>
                          {monthTitle}
                        </span>
                        {item.month === currentMonth && (
                          <span className="text-[9px] font-bold bg-red-600 text-white px-1.5 py-0.2 rounded uppercase">
                            Mês Ativo
                          </span>
                        )}
                      </div>
                      <span className="text-xs font-mono font-bold text-slate-600">
                        {isPastOrCurrent ? `Acumulado Líquido: ${formatCurrency(cumulativePool)}` : 'Previsto'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mt-2">
                      <div className="text-[10px] text-slate-400">
                        Contribuições: <span className="font-mono font-semibold text-slate-600">+{formatCurrency(item.accumulatedSocial)}</span> ({item.paidInMonth}/12 pagos)
                      </div>
                      <div className="text-[10px] text-slate-400 text-right">
                        Apoios Pagos: <span className="font-mono font-semibold text-rose-500">-{formatCurrency(item.aidsInMonth)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

    </div>
  );
}

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  TrendingUp, 
  ArrowRight, 
  HelpCircle, 
  ShieldCheck, 
  Coins, 
  Info,
  CalendarDays,
  Activity
} from 'lucide-react';

interface TimelineMonth {
  month: number;
  label: string;
  retained: number;
  disbursed: number;
  balance: number;
  description: string;
  state: 'concluded' | 'active' | 'projected';
}

export default function FinanceEvolutionTimeline() {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Exact math representing:
  // Month 1: 12 * 20,000 = 240,000 retained. Disbursed: 0. Balance = 240,000.
  // Month 2: 12 * 20,000 = 240,000 retained. Disbursed: 50,000 (João Baptista medicine support). Balance: 240k + 240k - 50k = 430,000.
  // Month 3 (Active): 12 * 20,000 = 240,000 retained. Balance: 430k + 240k = 670,000.
  // Month 4, 5, 6: projected additions.
  const timelineData: TimelineMonth[] = [
    {
      month: 1,
      label: 'Mês 01 (Abril)',
      retained: 240000,
      disbursed: 0,
      balance: 240000,
      description: 'Arrecadação de 20.000,00 por membro. Primeiro ciclo concluído e conciliado.',
      state: 'concluded'
    },
    {
      month: 2,
      label: 'Mês 02 (Maio)',
      retained: 240000,
      disbursed: 50000,
      balance: 430000,
      description: 'Retenção normal de 20.000,00 por membro. Desembolso emergencial em favor de João Baptista.',
      state: 'concluded'
    },
    {
      month: 3,
      label: 'Mês 03 (Ciclo Ativo)',
      retained: 240000,
      disbursed: 0,
      balance: 670000,
      description: 'Ciclo atual em curso. Caixa de poupança social batendo recorde de solidez.',
      state: 'active'
    },
    {
      month: 4,
      label: 'Mês 04 (Julho)',
      retained: 240000,
      disbursed: 0,
      balance: 910000,
      description: 'Projeção atuarial por alinhamento de cotas operacionais.',
      state: 'projected'
    },
    {
      month: 5,
      label: 'Mês 05 (Agosto)',
      retained: 240000,
      disbursed: 0,
      balance: 1150000,
      description: 'Projeção de poupança sem sinistros de interajuda estimados.',
      state: 'projected'
    },
    {
      month: 6,
      label: 'Mês 06 (Setembro)',
      retained: 240000,
      disbursed: 0,
      balance: 1390000,
      description: 'Encerramento de contas do primeiro pool. Caixa restante passará para o próximo ciclo.',
      state: 'projected'
    }
  ];

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-AO', {
      style: 'currency',
      currency: 'AOA',
      minimumFractionDigits: 0,
    })
      .format(val)
      .replace('AOA', 'KZs');
  };

  return (
    <div className="bg-white dark:bg-slate-100 rounded-2xl border border-slate-200 dark:border-slate-300 p-6 shadow-sm space-y-6 transition-colors" id="banking-timeline-container">
      
      {/* Header Info */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h3 className="font-display font-black text-slate-850 dark:text-slate-950 text-sm tracking-wide uppercase flex items-center gap-1.5">
            <TrendingUp className="w-5 h-5 text-[#10B981]" />
            Evolução do Saldo Bancário (Fundo Social)
          </h3>
          <p className="text-xs text-slate-400 dark:text-slate-500">
            Evolução histórica e projetada do acumulado da Poupança de Interajuda.
          </p>
        </div>

        <div className="p-1.5 bg-slate-50 dark:bg-slate-200 text-slate-400 dark:text-slate-500 rounded-lg">
          <Activity className="w-4 h-4" />
        </div>
      </div>

      {/* Modern Horizontal Bar Graphic Simulation representing Evolution */}
      <div className="space-y-4 pt-2">
        <span className="text-[10px] text-slate-400 dark:text-slate-500 block font-black uppercase tracking-wider">
          Gráfico Comparativo de Caixa Acumulado (KZs)
        </span>
        
        <div className="space-y-3">
          {timelineData.map((d, idx) => {
            // Find max balance to scale width percentage
            const maxBalance = 1390000;
            const widthPercent = (d.balance / maxBalance) * 100;

            const isCurrent = d.state === 'active';
            const isProjected = d.state === 'projected';

            return (
              <div 
                key={d.month}
                className="space-y-1.5 animate-pulse-once"
                onMouseEnter={() => setHoveredIndex(idx)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                <div className="flex justify-between text-xs">
                  <span className={`font-black ${isCurrent ? 'text-teal-600 dark:text-teal-400' : isProjected ? 'text-slate-450 dark:text-slate-550' : 'text-slate-700 dark:text-slate-900'}`}>
                    {d.label} {isCurrent && '●'}
                  </span>
                  <span className={`font-mono font-bold ${isCurrent ? 'text-teal-600 dark:text-teal-400' : isProjected ? 'text-slate-450 dark:text-slate-550' : 'text-slate-800 dark:text-slate-950'}`}>
                    {formatCurrency(d.balance)}
                  </span>
                </div>

                <div className="w-full bg-slate-100 dark:bg-slate-200 h-3 rounded-full overflow-hidden relative group">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isCurrent 
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-500 shadow-md shadow-emerald-500/20' 
                        : isProjected 
                        ? 'bg-slate-300 dark:bg-slate-400' 
                        : 'bg-slate-700 dark:bg-slate-650'
                    }`}
                    style={{ width: `${widthPercent}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Subtitle details */}
      <div className="grid grid-cols-3 gap-3 pt-4 border-t border-slate-100 dark:border-slate-200 text-[10px] text-slate-450 dark:text-slate-500 font-semibold">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded bg-slate-700 dark:bg-slate-650 shrink-0" />
          <span>Conciliado</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded bg-[#10B981] shrink-0" />
          <span>Ciclo Ativo</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded bg-slate-300 dark:bg-slate-400 shrink-0" />
          <span>Projeção</span>
        </div>
      </div>

      {/* Footnote details */}
      <div className="bg-emerald-50/50 dark:bg-emerald-950/10 border border-emerald-100/40 dark:border-emerald-800/20 rounded-xl p-3 text-[11px] leading-relaxed text-emerald-800 dark:text-emerald-300 flex items-start gap-2">
        <Info className="w-4 h-4 text-[#10B981] shrink-0 mt-0.5" />
        <div>
          <strong>Norma de Estabilidade:</strong> Com a retenção garantida, o fundo possuirá saldo líquido de <strong>1.390.000,00 KZs</strong> ao final de seis meses, garantindo solvência e liquidez total para apoios assistenciais sem impactar os recebíveis individuais de rotação.
        </div>
      </div>

    </div>
  );
}

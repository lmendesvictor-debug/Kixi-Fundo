import { useState } from 'react';
import { motion } from 'motion/react';
import { 
  HeartHandshake, 
  Coins, 
  Award, 
  Wallet, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  RefreshCw,
  Trophy,
  Heart
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

interface MetricCardsProps {
  currentMonth: number;
  socialBalance: number;
  currentPaidCount: number;
  currentCollected?: number;
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
  currentCollected: customCollected,
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
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  
  const currentCollected = customCollected !== undefined ? customCollected : currentPaidCount * 120000;
  const targetArrecadacao = totalMembersCount * 120000; // 1,440,000.00
  const progressPercent = Math.min((currentCollected / targetArrecadacao) * 100, 100);

  // Filter beneficiaries based on selected filter
  const filteredBeneficiaries = beneficiaries.filter((b) => {
    const isPaidOrLiberado = isPayoutDone || b.isPaid;
    if (statusFilter === 'paid') return isPaidOrLiberado;
    if (statusFilter === 'pending') return !isPaidOrLiberado;
    return true;
  });

  const paidCount = beneficiaries.filter(b => isPayoutDone || b.isPaid).length;
  const pendingCount = beneficiaries.filter(b => !isPayoutDone && !b.isPaid).length;

  // Format currency output precisely like "X.XXX.XXX,XX Kz"
  const formatCurrency = (val: number) => {
    const rawFormatted = new Intl.NumberFormat('pt-AO', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(val);
    return `${rawFormatted} Kz`;
  };

  // Math calculated for Pie charts
  const rotationPrice = totalBeneficiaryDestined > 0 ? totalBeneficiaryDestined : 3600000;
  const socialPrice = totalSocialRetained > 0 ? totalSocialRetained : 720000;
  const combinedTotal = rotationPrice + socialPrice;

  const rotationPercent = combinedTotal > 0 ? ((rotationPrice / combinedTotal) * 100).toFixed(1) : '83.3';
  const socialPercent = combinedTotal > 0 ? ((socialPrice / combinedTotal) * 100).toFixed(1) : '16.7';

  const pieData = [
    { name: 'Fluxo de Rotação', value: rotationPrice, color: '#0d5c3a', percent: rotationPercent },
    { name: 'Fundo Social', value: socialPrice, color: '#1351a5', percent: socialPercent }
  ];

  const isHovered = hoveredIndex !== null;
  const currentDisplayLabel = isHovered ? pieData[hoveredIndex!].name : 'Composição do Patrimônio Coletivo';
  const currentDisplayValue = isHovered ? pieData[hoveredIndex!].value : combinedTotal;
  const currentDisplayColor = isHovered ? pieData[hoveredIndex!].color : undefined;
  const currentDisplayPercent = isHovered ? pieData[hoveredIndex!].percent : undefined;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-1 select-none font-sans text-slate-800 dark:text-slate-100" id="dashboard-widgets-panel">
      
      {/* 1. COMPOSIÇÃO DO PATRIMÓNIO COLETIVO */}
      <div className="bg-slate-50 dark:bg-slate-900/40 rounded-3xl border border-slate-200/70 dark:border-slate-800 p-6 flex flex-col justify-between shadow-xs">
        <div>
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <span className="w-8 h-8 rounded-full bg-[#0d5c3a] text-white flex items-center justify-center font-black text-sm relative">
              1
            </span>
            <h2 className="text-[13.5px] font-black tracking-tight text-slate-900 dark:text-white uppercase">
              Composição do Patrimônio Coletivo ({formatCurrency(combinedTotal)})
            </h2>
          </div>

          {/* Pie Chart and inside metrics */}
          <div className="flex flex-col items-center justify-center py-4 relative">
            <div className="w-[270px] h-[270px] flex items-center justify-center relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={88}
                    outerRadius={118}
                    paddingAngle={3}
                    dataKey="value"
                    startAngle={90}
                    endAngle={450}
                    onMouseEnter={(_: any, index: number) => setHoveredIndex(index)}
                    onMouseLeave={() => setHoveredIndex(null)}
                  >
                    {pieData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.color} 
                        stroke={hoveredIndex === index ? entry.color : "transparent"}
                        strokeWidth={hoveredIndex === index ? 4 : 0}
                        style={{
                          transform: hoveredIndex === index ? 'scale(1.03)' : 'scale(1)',
                          transformOrigin: '50% 50%',
                          transition: 'all 0.2s ease-in-out',
                          cursor: 'pointer'
                        }}
                      />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              {/* Inner Center Content labels */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-5 pointer-events-none transition-all duration-200">
                <span 
                  className="text-[9.5px] font-black uppercase tracking-wider leading-tight max-w-[145px] transition-colors duration-200 text-slate-400 dark:text-slate-500"
                  style={{ color: currentDisplayColor ? currentDisplayColor : undefined }}
                >
                  {currentDisplayLabel}
                </span>
                <span 
                  className="text-[13px] font-bold mt-2 font-mono whitespace-nowrap transition-colors duration-200 text-slate-900 dark:text-white"
                  style={{ color: currentDisplayColor ? currentDisplayColor : undefined }}
                >
                  {formatCurrency(currentDisplayValue)}
                </span>
                {currentDisplayPercent && (
                  <span 
                    className="text-[10px] font-extrabold mt-2 px-2.5 py-0.5 rounded-full text-white font-sans scale-95 transition-all duration-200"
                    style={{ backgroundColor: currentDisplayColor }}
                  >
                    {currentDisplayPercent}% do fundo
                  </span>
                )}
              </div>
            </div>

            {/* Custom Interactive Legend */}
            <div className="mt-8 flex flex-col sm:flex-row items-center gap-x-6 gap-y-2 text-xs font-semibold">
              <div 
                className={`flex items-center gap-2 cursor-pointer transition-all duration-200 ${hoveredIndex === 0 ? 'scale-105 font-black text-slate-900 dark:text-white' : hoveredIndex !== null ? 'opacity-40' : ''}`}
                onMouseEnter={() => setHoveredIndex(0)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                <span className="w-3.5 h-3.5 rounded-xs bg-[#0d5c3a] shrink-0" />
                <span className="text-slate-600 dark:text-slate-350 text-[11px] transition-colors duration-200">
                  Fluxo de Rotação ({rotationPercent}% - {formatCurrency(rotationPrice)})
                </span>
              </div>
              <div 
                className={`flex items-center gap-2 cursor-pointer transition-all duration-200 ${hoveredIndex === 1 ? 'scale-105 font-black text-slate-900 dark:text-white' : hoveredIndex !== null ? 'opacity-40' : ''}`}
                onMouseEnter={() => setHoveredIndex(1)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                <span className="w-3.5 h-3.5 rounded-xs bg-[#1351a5] shrink-0" />
                <span className="text-slate-600 dark:text-slate-350 text-[11px] transition-colors duration-200">
                  Fundo Social ({socialPercent}% - {formatCurrency(socialPrice)})
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. PROGRESSO DO CICLO ATUAL */}
      <div className="bg-slate-50 dark:bg-slate-900/40 rounded-3xl border border-slate-200/70 dark:border-slate-800 p-6 flex flex-col justify-between shadow-xs">
        <div>
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-full bg-[#0d5c3a] text-white flex items-center justify-center font-black text-sm">
                3
              </span>
              <h2 className="text-[13.5px] font-black tracking-tight text-slate-900 dark:text-white uppercase">
                Progresso do Ciclo Atual (4/6)
              </h2>
            </div>
            <button className="p-1 px-1.5 text-sky-600 hover:text-sky-700 bg-sky-100/50 dark:bg-sky-950/20 rounded-md shrink-0 cursor-pointer">
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          {/* Current collected status labels */}
          <div className="text-center py-5 space-y-1">
            <p className="text-[10px] font-black tracking-wider text-slate-500 uppercase">
              Mensal Arrecadado
            </p>
            <p className="text-xl font-black font-mono text-slate-950 dark:text-white">
              ({formatCurrency(currentCollected)})
            </p>
          </div>

          {/* Slider visual element conforming perfectly to Image 1 */}
          <div className="py-6 px-2">
            <div className="flex justify-between items-center text-[10.5px] font-black text-slate-400 dark:text-slate-550 mb-1">
              <span>0,00 Kz</span>
              <span className="font-mono text-slate-600 dark:text-white">{formatCurrency(targetArrecadacao)}</span>
            </div>
            
            {/* Custom Track */}
            <div className="relative w-full bg-slate-200/80 dark:bg-slate-800 h-3.5 rounded-full overflow-hidden mb-5">
              {/* Dynamic filled bar */}
              <div 
                className="bg-[#0b5a3e] h-full rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progressPercent}%` }}
              />
              
              {/* Ticks on progress bar */}
              <span className="absolute left-1/3 top-0 bottom-0 w-[1px] bg-slate-300 dark:bg-slate-700 pointer-events-none" />
              <span className="absolute left-2/3 top-0 bottom-0 w-[1px] bg-slate-300 dark:bg-slate-700 pointer-events-none" />
            </div>

            {/* Pointer / Triage Indicator below track */}
            <div className="relative h-4 mb-2">
              <div 
                className="absolute flex flex-col items-center -translate-x-1/2 transition-all duration-500"
                style={{ left: `${progressPercent}%` }}
              >
                <span className="text-[10px] text-[#0d5c3a] leading-none">▲</span>
              </div>
            </div>

            {/* Custom status indicators */}
            <div className="flex items-center justify-center gap-5 text-xs text-slate-500 dark:text-slate-400 mt-2">
              <div className="flex items-center gap-2 font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-[#0b5a3e]" />
                <span>Membros Pagos</span>
              </div>
              <div className="flex items-center gap-2 font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-[#c2c6d1]" />
                <span>Meta</span>
              </div>
            </div>

            <div className="text-center mt-3 text-[11px] font-bold text-slate-400 dark:text-slate-500">
              Progresso: ({currentPaidCount}/12 membros)
            </div>
          </div>
        </div>
      </div>

      {/* 2. STATUS DO FUNDO SOCIAL */}
      <div className="bg-slate-50 dark:bg-slate-900/40 rounded-3xl border border-slate-200/70 dark:border-slate-800 p-6 flex flex-col justify-between shadow-xs">
        <div>
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-full bg-[#0d5c3a] text-white flex items-center justify-center font-black text-sm">
                2
              </span>
              <h2 className="text-[13.5px] font-black tracking-tight text-slate-900 dark:text-white uppercase">
                Status do Fundo Social ({formatCurrency(socialPrice)})
              </h2>
            </div>
            <div className="p-1.5 bg-rose-50 dark:bg-rose-950/20 text-rose-500 rounded-md shrink-0">
              <Heart className="w-4 h-4 fill-current" />
            </div>
          </div>

          {/* Social Progress and Status Indicators */}
          <div className="py-4 space-y-6 text-xs">
            {/* Bar 1: Retido/Segurança */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center font-bold text-slate-650 dark:text-slate-300">
                <span>Retido/Segurança</span>
                <span className="font-mono text-slate-900 dark:text-white">{formatCurrency(socialBalance)}</span>
              </div>
              <div className="w-full bg-slate-200/80 dark:bg-slate-800 h-6 rounded-full overflow-hidden">
                <div 
                  className="bg-[#0b5a3e] h-full rounded-full transition-all duration-300"
                  style={{ width: '100%' }}
                />
              </div>
            </div>

            {/* Bar 2: Apoios Concedidos */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center font-bold text-slate-650 dark:text-slate-350">
                <span>Apoios Concedidos</span>
                <span className="font-mono text-slate-900 dark:text-white">{formatCurrency(totalSocialDisbursed)}</span>
              </div>
              <div className="w-full bg-slate-200/80 dark:bg-slate-800 h-6 rounded-full overflow-hidden flex items-center justify-between px-4 text-[10px] text-slate-500 dark:text-slate-400 font-bold">
                <div 
                  className="bg-slate-300 dark:bg-slate-700 h-full rounded-full transition-all duration-300" 
                  style={{ width: totalSocialDisbursed > 0 ? '100%' : '0%' }}
                />
                <span>0,00 Kz</span>
              </div>
            </div>

            {/* Footer Status Message */}
            <div className="text-[11px] font-bold text-slate-450 dark:text-slate-500 pt-3 text-left">
              {totalSocialDisbursed === 0 ? 'Fundo Integral, sem desembolsos' : 'Ocorreram desembolsos de apoio no ciclo.'}
            </div>
          </div>
        </div>
      </div>

      {/* 4. STATUS DE CONTEMPLAÇÕES */}
      <div className="bg-slate-50 dark:bg-slate-900/40 rounded-3xl border border-slate-200/70 dark:border-slate-800 p-6 flex flex-col justify-between shadow-xs">
        <div>
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-full bg-[#0d5c3a] text-white flex items-center justify-center font-black text-sm">
                4
              </span>
              <h2 className="text-[13.5px] font-black tracking-tight text-slate-900 dark:text-white uppercase">
                Status de Contemplações - Mês {currentMonth}
              </h2>
            </div>
            <div className="p-1.5 bg-amber-50 dark:bg-amber-950/20 text-amber-500 rounded-lg shrink-0">
              <Trophy className="w-5 h-5" />
            </div>
          </div>

          {/* Tabs perfectly aligned to Image 1: Orange Tab style */}
          <div className="flex bg-slate-200/60 dark:bg-slate-900/60 rounded-xl p-1 mb-5">
            <button
              onClick={() => setStatusFilter('all')}
              className={`flex-1 text-[11px] py-1.5 font-extrabold rounded-lg transition-all cursor-pointer text-center ${
                statusFilter === 'all'
                  ? 'bg-[#f59e0b] text-white shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-750'
              }`}
            >
              Todas ({beneficiaries.length})
            </button>
            <button
              onClick={() => setStatusFilter('paid')}
              className={`flex-1 text-[11px] py-1.5 font-extrabold rounded-lg transition-all cursor-pointer text-center ${
                statusFilter === 'paid'
                  ? 'bg-[#f59e0b] text-white shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-750'
              }`}
            >
              Pagas ({paidCount})
            </button>
            <button
              onClick={() => setStatusFilter('pending')}
              className={`flex-1 text-[11px] py-1.5 font-extrabold rounded-lg transition-all cursor-pointer text-center ${
                statusFilter === 'pending'
                  ? 'bg-[#f59e0b] text-white shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-750'
              }`}
            >
              Pendentes ({pendingCount})
            </button>
          </div>

          {/* List items with orange AGUARDANDO badges */}
          <div className="space-y-3 max-h-[190px] overflow-y-auto pr-1">
            {filteredBeneficiaries.length === 0 ? (
              <div className="text-center py-8 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                Sem registros
              </div>
            ) : (
              filteredBeneficiaries.map((b, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs bg-white dark:bg-slate-950/40 px-4 py-3.5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
                  <span className="font-extrabold text-slate-800 dark:text-slate-200">
                    {b.name} - {isPayoutDone ? 'LIQUIDADO' : b.isPaid ? 'LIBERADO' : 'AGUARDANDO'}
                  </span>
                  {isPayoutDone ? (
                    <span className="text-[9.5px] font-black text-emerald-700 bg-emerald-100 rounded-full py-1 px-3 uppercase tracking-wider">
                      Pago
                    </span>
                  ) : b.isPaid ? (
                    <span className="text-[9.5px] font-black text-sky-700 bg-sky-100 rounded-full py-1 px-3 uppercase tracking-wider">
                      Liberado
                    </span>
                  ) : (
                    <span className="text-[9.5px] font-black text-[#ea580c] bg-[#ffedd5] rounded-full py-1 px-3 uppercase tracking-wider border border-[#fed7aa]/60 animate-pulse">
                      Aguardando
                    </span>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Summary bottom banner matching Image 1 exactly */}
          <div className="mt-5 p-4 bg-white dark:bg-slate-950/40 rounded-2xl border border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="text-left space-y-1">
              <span className="block font-black text-slate-900 dark:text-white text-[10.5px] uppercase tracking-wider">
                Beneficiários do Ciclo:
              </span>
              <span className="block text-slate-500 dark:text-slate-400 font-medium">
                {pendingCount} Membros pendentes de pagamento.
              </span>
            </div>
            <div className="text-right shrink-0">
              <span className="text-[12.5px] font-black text-slate-900 dark:text-white">
                Valor total de <strong>{formatCurrency(600000 * pendingCount)}</strong> a pagar.
              </span>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}

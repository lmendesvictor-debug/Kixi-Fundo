import { useState, useEffect } from 'react';
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
  Heart,
  Search,
  Calendar,
  Check
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { Member } from '../types';

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
  members?: Member[];
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
  members,
}: MetricCardsProps) {
  // Determine default value / last paid cycle (where payoutsCompleted is true)
  const getLastPaidCycle = () => {
    return [6, 5, 4, 3, 2, 1].find(num => payoutsCompleted[num] === true) || currentMonth || 1;
  };

  const [selectedCycle, setSelectedCycle] = useState<number>(getLastPaidCycle);
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'pending' | 'beneficiaries'>('paid');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Sync selectedCycle to the last paid cycle when payoutsCompleted or currentMonth changes
  useEffect(() => {
    setSelectedCycle(getLastPaidCycle());
  }, [payoutsCompleted, currentMonth]);
  
  const currentCollected = customCollected !== undefined ? customCollected : currentPaidCount * 120000;
  const targetArrecadacao = totalMembersCount * 120000; // 1,440,000.00
  const progressPercent = Math.min((currentCollected / targetArrecadacao) * 100, 100);

  // fallback in case members list is empty or under development
  const membersList = members || [];

  // 1. Quotas (monthly contribution stats of all members for the selectedMonth)
  const allContributorsForCycle = membersList.map(m => {
    const contr = m.contributions[selectedCycle];
    return {
      id: m.id,
      name: m.name,
      paid: contr?.paid || false,
      amount: contr?.amount !== undefined ? contr.amount : 120000,
      paidAt: contr?.paidAt,
      isBeneficiary: m.assignedMonth === selectedCycle
    };
  });

  // Filter these contributors based on Search Query
  const searchedContributors = allContributorsForCycle.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const paidContributors = searchedContributors.filter(c => c.paid);
  const pendingContributors = searchedContributors.filter(c => !c.paid);

  // Beneficiaries of the selected cycle
  const cycleBeneficiaries = membersList.filter(m => m.assignedMonth === selectedCycle);
  const isPayoutDoneForCycle = payoutsCompleted[selectedCycle] === true;

  // Searched beneficiaries
  const searchedBeneficiaries = cycleBeneficiaries.filter(b => 
    b.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Counts for the active indicators (all contributors, paid contributors, pending contributors, beneficiaries)
  const totalContributorsCount = allContributorsForCycle.length;
  const paidContributorsCount = allContributorsForCycle.filter(c => c.paid).length;
  const pendingContributorsCount = allContributorsForCycle.filter(c => !c.paid).length;
  const cycleBeneficiariesCount = cycleBeneficiaries.length;

  // Bottom values matching prompt: "informar a baixo os valores pagos. E informar os valores de membros pendentes"
  const totalValoresPagosCycle = allContributorsForCycle
    .filter(c => c.paid)
    .reduce((sum, c) => sum + c.amount, 0);

  const totalValoresPendentesCycle = allContributorsForCycle
    .filter(c => !c.paid)
    .reduce((sum, c) => sum + 120000, 0);

  // Filter list based on sub-tab choice - Only present paid contributors for the selected cycle
  const displayedItems = (() => {
    if (statusFilter === 'all' || statusFilter === 'paid') return paidContributors;
    if (statusFilter === 'pending') return []; // We only present paid members as requested
    // beneficiaries tab returns mapped elements mimicking the format
    return searchedBeneficiaries.map(b => ({
      id: b.id,
      name: b.name,
      paid: isPayoutDoneForCycle || (b.contributions[selectedCycle]?.paid && false), // handled specifically below
      amount: 600000,
      paidAt: undefined,
      isBeneficiary: true
    }));
  })();

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
                {selectedCycle === currentMonth ? "Progresso do Ciclo Corrente" : "Progresso do Ciclo Selecionado"} ({selectedCycle}/6)
              </h2>
            </div>
            <button 
              onClick={() => {
                setSelectedCycle(currentMonth);
                setStatusFilter('paid');
              }}
              className="p-1 px-1.5 text-sky-600 hover:text-sky-700 bg-sky-100/50 dark:bg-sky-950/20 rounded-md shrink-0 cursor-pointer hover:scale-105 active:scale-95 transition-all"
              title="Restaurar para o Mês Ativo"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          {/* Current collected status labels */}
          <div className="text-center py-5 space-y-1">
            <p className="text-[10px] font-black tracking-wider text-slate-500 uppercase">
              Mensal Arrecadado (Cota)
            </p>
            <p className="text-xl font-black font-mono text-slate-950 dark:text-white">
              ({formatCurrency(allContributorsForCycle.reduce((sum, c) => c.paid ? sum + c.amount : sum, 0))})
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
                style={{ width: `${Math.min((allContributorsForCycle.reduce((sum, c) => c.paid ? sum + c.amount : sum, 0) / targetArrecadacao) * 100, 100)}%` }}
              />
              
              {/* Ticks on progress bar */}
              <span className="absolute left-1/3 top-0 bottom-0 w-[1px] bg-slate-300 dark:bg-slate-700 pointer-events-none" />
              <span className="absolute left-2/3 top-0 bottom-0 w-[1px] bg-slate-300 dark:bg-slate-700 pointer-events-none" />
            </div>

            {/* Pointer / Triage Indicator below track */}
            <div className="relative h-4 mb-2">
              <div 
                className="absolute flex flex-col items-center -translate-x-1/2 transition-all duration-500"
                style={{ left: `${Math.min((allContributorsForCycle.reduce((sum, c) => c.paid ? sum + c.amount : sum, 0) / targetArrecadacao) * 100, 100)}%` }}
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
              Progresso: ({allContributorsForCycle.filter(c => c.paid).length}/12 membros)
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
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-full bg-[#0d5c3a] text-white flex items-center justify-center font-black text-sm">
                4
              </span>
              <h2 className="text-[13.5px] font-black tracking-tight text-slate-900 dark:text-white uppercase">
                Status de Contemplações - Ciclo {selectedCycle}
              </h2>
            </div>
            <div className="p-1.5 bg-amber-50 dark:bg-amber-950/20 text-amber-500 rounded-lg shrink-0">
              <Trophy className="w-5 h-5" />
            </div>
          </div>

          {/* Dynamic Cycle / Month Switcher Selector Row */}
          <div className="grid grid-cols-6 gap-1.5 mb-4 bg-slate-100 dark:bg-slate-950/40 p-1 rounded-xl border border-slate-200/30 dark:border-slate-800/40">
            {[1, 2, 3, 4, 5, 6].map((num) => {
              const isActive = num === selectedCycle;
              const isCurrent = num === currentMonth;
              const isComp = payoutsCompleted[num] === true;
              return (
                <button
                  key={num}
                  onClick={() => {
                    setSelectedCycle(num);
                    setStatusFilter('paid');
                  }}
                  className={`py-2 px-1 rounded-lg text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-0.5 ${
                    isActive
                      ? 'bg-[#0d5c3a] text-white shadow-xs font-black scale-102'
                      : 'hover:bg-slate-200 dark:hover:bg-slate-800/60 text-slate-655 dark:text-slate-400 font-bold bg-transparent'
                  }`}
                >
                  <span className="text-[10px] tracking-tight leading-3">Mês {num}</span>
                  <span className="text-[7.5px] scale-90 whitespace-nowrap opacity-90 font-mono">
                    {isComp ? (
                      <span className="text-emerald-500 dark:text-emerald-400 font-extrabold flex items-center gap-0.5">✓ Pago</span>
                    ) : isCurrent ? (
                      <span className="text-amber-500 font-extrabold">Ativo</span>
                    ) : (
                      <span className="text-slate-400 font-medium">Agend.</span>
                    )}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search box within cycle */}
          <div className="relative mb-4">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Pesquisar cooperante no Ciclo..."
              className="w-full text-xs pl-9 pr-4 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-950/30 focus:border-[#0d5c3a] dark:focus:border-[#0d5c3a] focus:ring-0 transition-colors uppercase placeholder:normal-case placeholder:text-slate-450 text-slate-800 dark:text-white"
            />
          </div>

          {/* Sub-Tabs: Quotas and Beneficiaries filtered dynamically */}
          <div className="flex bg-slate-200/60 dark:bg-slate-900/60 rounded-xl p-1 mb-4 gap-1 overflow-x-auto">
            <button
              onClick={() => setStatusFilter('paid')}
              className={`flex-1 min-w-[70px] text-[10.5px] py-1.5 font-extrabold rounded-lg transition-all cursor-pointer text-center ${
                statusFilter === 'paid'
                  ? 'bg-[#0d5c3a] text-white shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-750'
              }`}
            >
              Membros Pagos ({paidContributorsCount})
            </button>
            <button
              onClick={() => setStatusFilter('beneficiaries')}
              className={`flex-1 min-w-[95px] text-[10.5px] py-1.5 font-extrabold rounded-lg transition-all cursor-pointer text-center ${
                statusFilter === 'beneficiaries'
                  ? 'bg-[#0d5c3a] text-white shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-750'
              }`}
            >
              Beneficiários ({cycleBeneficiariesCount})
            </button>
          </div>

          {/* Main Display List */}
          <div className="space-y-2.5 max-h-[180px] overflow-y-auto pr-1">
            {displayedItems.length === 0 ? (
              <div className="text-center py-8 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                Nenhum registro encontrado
              </div>
            ) : (
              displayedItems.map((item, idx) => {
                // If displaying contributors
                if (statusFilter !== 'beneficiaries') {
                  return (
                    <div key={item.id || idx} className="flex items-center justify-between text-xs bg-white dark:bg-slate-950/40 px-4 py-3 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
                      <div className="flex flex-col text-left">
                        <span className="font-extrabold text-slate-800 dark:text-slate-200">
                          {item.name}
                        </span>
                        <span className="text-[10px] font-semibold text-slate-450 dark:text-slate-500">
                          {item.paid ? `Cota regularizada: ${formatCurrency(item.amount)}` : `Quota de rotação em falta: ${formatCurrency(item.amount)}`}
                        </span>
                      </div>
                      <div>
                        {item.paid ? (
                          <span className="text-[9.5px] font-black text-emerald-700 bg-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-400 rounded-full py-1 px-3 uppercase tracking-wider">
                            Pago
                          </span>
                        ) : (
                          <span className="text-[9.5px] font-black text-[#ea580c] bg-[#ffedd5] dark:bg-amber-950/20 dark:text-amber-500 rounded-full py-1 px-2.5 uppercase tracking-wider border border-[#fed7aa]/30 animate-pulse">
                            Aguardando
                          </span>
                        )}
                      </div>
                    </div>
                  );
                } else {
                  // If displaying beneficiaries
                  const isPaid = isPayoutDoneForCycle;
                  return (
                    <div key={item.id || idx} className="flex items-center justify-between text-xs bg-white dark:bg-slate-950/40 px-4 py-3 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xs hover:border-emerald-500/20 dark:hover:border-emerald-500/10 transition-colors">
                      <div className="flex flex-col text-left">
                        <span className="font-extrabold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                          🎁 {item.name}
                        </span>
                        <span className="text-[10px] font-bold text-[#0d5c3a] dark:text-emerald-400">
                          Recebe Provento Rotativo: {formatCurrency(600000)}
                        </span>
                      </div>
                      <div>
                        {isPaid ? (
                          <span className="text-[9.5px] font-black text-emerald-700 bg-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-400 rounded-full py-1 px-3 uppercase tracking-wider">
                            Liquidado
                          </span>
                        ) : (
                          <span className="text-[9.5px] font-black text-[#ea580c] bg-[#ffedd5] dark:bg-amber-950/20 dark:text-amber-500 rounded-full py-1 px-2.5 uppercase tracking-wider border border-[#fed7aa]/30 animate-pulse">
                            Aguardando
                          </span>
                        )}
                      </div>
                    </div>
                  );
                }
              })
            )}
          </div>

          {/* Highly detailed financial audit and summary cards at the bottom */}
          <div className="mt-4 p-3 py-3.5 bg-gradient-to-r from-slate-100/70 to-slate-200/40 dark:from-slate-900/60 dark:to-slate-950/40 rounded-2xl border border-slate-200/40 dark:border-slate-800/80 space-y-2.5 text-[11px]">
            <div className="flex justify-between items-center text-slate-800 dark:text-slate-200 border-b border-slate-200/50 dark:border-slate-850 pb-1.5">
              <span className="font-extrabold text-[#0d5c3a] dark:text-emerald-400 uppercase tracking-wider text-[10px]">
                Beneficiários do Ciclo:
              </span>
              <span className="font-extrabold text-slate-900 dark:text-white uppercase tracking-wider text-[10px]">
                {cycleBeneficiaries.length === 0 ? 'Sem Alocação' : `${cycleBeneficiaries.length} Membros`}
              </span>
            </div>
            
            {/* Beneficiaries named */}
            {cycleBeneficiaries.length > 0 ? (
              <div className="text-left font-bold text-slate-655 dark:text-slate-350 leading-relaxed -mt-1">
                {cycleBeneficiaries.map((b, idx) => (
                  <span key={b.id} className="inline-block mr-2">
                    {idx + 1}. {b.name} <span className="text-[8px] font-black text-slate-400 dark:text-slate-500">({isPayoutDoneForCycle ? 'LIQUIDADO' : 'PENDENTE'})</span>{idx < cycleBeneficiaries.length - 1 ? ' •' : ''}
                  </span>
                ))}
              </div>
            ) : (
              <div className="text-left text-slate-400 dark:text-slate-600 font-medium">
                Nenhum cooperante contemplado para recebimento neste ciclo.
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 pt-1 text-left border-t border-slate-200/40 dark:border-slate-800/60">
              <div>
                <span className="block font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest text-[8.5px]"> Valores Arrecadados</span>
                <span className="font-mono font-black text-slate-900 dark:text-white text-xs block mt-0.5">
                  {formatCurrency(totalValoresPagosCycle)}
                </span>
                <span className="text-[9px] text-slate-455 block leading-tight">
                  ({paidContributorsCount} de 12 cotas regularizadas)
                </span>
              </div>
              <div className="border-l border-slate-200/50 dark:border-slate-850 pl-4">
                <span className="block font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest text-[8.5px]">Valores Pendentes</span>
                <span className="font-mono font-black text-[#ea580c] dark:text-amber-500 text-xs block mt-0.5">
                  {formatCurrency(totalValoresPendentesCycle)}
                </span>
                <span className="text-[9px] text-slate-455 block leading-tight">
                  ({pendingContributorsCount} cooperantes em atraso)
                </span>
              </div>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}

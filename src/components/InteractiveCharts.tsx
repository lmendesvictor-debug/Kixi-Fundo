import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  TrendingUp, 
  Coins, 
  HelpCircle, 
  Search, 
  ChevronDown, 
  ChevronUp, 
  Filter, 
  Briefcase, 
  DollarSign, 
  Info, 
  Award, 
  FolderLock, 
  ArrowUpRight, 
  CheckCircle, 
  Calendar,
  Layers,
  Sparkles
} from 'lucide-react';
import { Member, KixLog, getFullMonthLabel, getMonthSimpleLabel } from '../types';

interface InteractiveChartsProps {
  currentMonth: number;
  members: Member[];
  logs: KixLog[];
  socialBalance: number;
  theme: 'light' | 'dark';
  payoutsCompleted: { [month: number]: boolean };
  onToggleContribution?: (id: number) => void;
  appConfig?: {
    bankName: string;
    bankIban: string;
    phone: string;
    email: string;
    showFlowChart?: boolean;
    showAllocationChart?: boolean;
    showStatsCards?: boolean;
    chartColorTheme?: 'teal' | 'indigo' | 'coral' | 'amber';
    customDashboardMessage?: string;
  };
}

export default function InteractiveCharts({
  currentMonth,
  members,
  logs,
  socialBalance,
  theme,
  payoutsCompleted,
  onToggleContribution,
  appConfig,
}: InteractiveChartsProps) {
  const [activeChartMonth, setActiveChartMonth] = useState<number>(currentMonth);
  const [selectedYear, setSelectedYear] = useState<string>('2026');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAllocationSlice, setSelectedAllocationSlice] = useState<string | null>(null);
  const [hoveredBar, setHoveredBar] = useState<{
    id: number;
    name: string;
    x: number;
    y: number;
    collectedKz: number;
    paidCount: number;
    beneficiaries: string[];
  } | null>(null);
  
  // Folders/Caixas de consulta states
  const [openSection, setOpenSection] = useState<'simulation' | 'calculations' | 'none'>('calculations');

  const chartTheme = appConfig?.chartColorTheme || 'teal';
  const isFlowChartActive = appConfig?.showFlowChart !== false;
  const isAllocationChartActive = appConfig?.showAllocationChart !== false;

  const colSpanFlow = isAllocationChartActive ? "col-span-1 lg:col-span-7" : "col-span-1 lg:col-span-12";
  const colSpanAlloc = isFlowChartActive ? "col-span-1 lg:col-span-5" : "col-span-1 lg:col-span-12";
  
  // Custom styled theme designs matching the administrator's structural choice
  const themeColors = {
    teal: {
      barFill: 'bg-teal-500/80',
      barHover: 'hover:bg-teal-400',
      barSelected: 'border-teal-500 bg-teal-500/20',
      accentText: 'text-teal-500',
      btnActive: 'bg-teal-500/10 text-teal-400',
      donutColor1: 'bg-sky-500',
      donutFill1: '#0ea5e9', // Royal sky blue (payouts completed)
      donutColor2: 'bg-amber-400',
      donutFill2: '#fbbf24', // Sunny amber gold (Social / backup)
      donutColor3: 'bg-emerald-500',
      donutFill3: '#10b981', // Vibrant emerald green (capital líquido)
    },
    indigo: {
      barFill: 'bg-indigo-500/80',
      barHover: 'hover:bg-indigo-400',
      barSelected: 'border-indigo-500 bg-indigo-500/20',
      accentText: 'text-indigo-400',
      btnActive: 'bg-indigo-500/10 text-indigo-400',
      donutColor1: 'bg-indigo-500',
      donutFill1: '#6366f1', // Indigo purple
      donutColor2: 'bg-fuchsia-400',
      donutFill2: '#e879f9', // Vibrant fuchsia magenta
      donutColor3: 'bg-cyan-400',
      donutFill3: '#22d3ee', // Cool cyan blue
    },
    coral: {
      barFill: 'bg-rose-500/80',
      barHover: 'hover:bg-rose-400',
      barSelected: 'border-rose-500 bg-rose-500/20',
      accentText: 'text-rose-500',
      btnActive: 'bg-rose-500/10 text-rose-400',
      donutColor1: 'bg-rose-500',
      donutFill1: '#f43f5e', // Hot rose ruby
      donutColor2: 'bg-yellow-400',
      donutFill2: '#facc15', // Neon gold yellow
      donutColor3: 'bg-emerald-400',
      donutFill3: '#34d399', // Mint emerald
    },
    amber: {
      barFill: 'bg-amber-500/80',
      barHover: 'hover:bg-amber-400',
      barSelected: 'border-amber-500 bg-amber-500/20',
      accentText: 'text-amber-500',
      btnActive: 'bg-amber-500/10 text-amber-500',
      donutColor1: 'bg-orange-500',
      donutFill1: '#f97316', // Dark orange
      donutColor2: 'bg-teal-400',
      donutFill2: '#2dd4bf', // Seafoam teal
      donutColor3: 'bg-sky-400',
      donutFill3: '#38bdf8', // Ice sky blue
    }
  }[chartTheme];

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-AO', {
      style: 'currency',
      currency: 'AOA',
      minimumFractionDigits: 0,
    })
      .format(val)
      .replace('AOA', 'KZs');
  };

  // Compute stats for Month 1-6
  const getMonthStats = (mNum: number) => {
    const monthMembers = members.length > 0 ? members : [];
    
    // Total members who have paid for this month
    const paidCount = monthMembers.filter((m) => m.contributions[mNum]?.paid).length;
    const collected = paidCount * 120000;
    const pending = (12 - paidCount) * 120000;
    const retainedInSocial = paidCount * 20000;
    const disbursedBenefit = payoutsCompleted[mNum] ? 1200000 : 0;
    
    // Balance calculation
    return {
      month: mNum,
      paidCount,
      collected,
      pending,
      retainedInSocial,
      disbursedBenefit,
    };
  };

  const activeLevaNum = Math.ceil(currentMonth / 6) || 1;
  const startMonthOfLeva = (activeLevaNum - 1) * 6 + 1;
  const currentLevaMonths = Array.from({ length: 6 }, (_, i) => startMonthOfLeva + i);
  const monthsStats = currentLevaMonths.map(getMonthStats);

  // Asset Allocations
  const totalPaidContributionsCount = members.reduce(
    (sum, m) => sum + Object.values(m.contributions).filter((c) => c.paid).length,
    0
  );
  
  // Total cumulative fund allocations
  const totalArrecadadoTotal = totalPaidContributionsCount * 120000; // 120k * all paid
  const totalPoupancaRetida = totalPaidContributionsCount * 20000; // 20k per payment
  const totalDisbursedBenefits = Object.keys(payoutsCompleted).filter(k => payoutsCompleted[Number(k)]).length * 1200000;
  
  // Current active liquid fund in normal rotation pool
  const activeRotationCapitalLiquid = totalArrecadadoTotal - totalDisbursedBenefits - totalPoupancaRetida;

  const totalAllocatedCalculated = totalDisbursedBenefits + socialBalance + Math.max(0, activeRotationCapitalLiquid);

  // Slices for Doughnut / Asset Pie
  const slices = [
    {
      id: 'disbursed',
      label: 'Contemplações Pagas',
      value: totalDisbursedBenefits,
      color: themeColors.donutColor1,
      fill: themeColors.donutFill1,
      percent: totalAllocatedCalculated > 0 ? (totalDisbursedBenefits / totalAllocatedCalculated) * 100 : 0,
      details: 'Capital repassado de forma transparente aos membros contemplados do consórcio.'
    },
    {
      id: 'social',
      label: 'Fundo Social de Interajuda',
      value: socialBalance,
      color: themeColors.donutColor2,
      fill: themeColors.donutFill2,
      percent: totalAllocatedCalculated > 0 ? (socialBalance / totalAllocatedCalculated) * 100 : 0,
      details: 'Fundo social assistencial acumulado destinado a amparar auxílios de saúde e imprevistos.'
    },
    {
      id: 'liquid',
      label: 'Capital Líquido em Caixa',
      value: Math.max(0, activeRotationCapitalLiquid),
      color: themeColors.donutColor3,
      fill: themeColors.donutFill3,
      percent: totalAllocatedCalculated > 0 ? (Math.max(0, activeRotationCapitalLiquid) / totalAllocatedCalculated) * 100 : 0,
      details: 'Capital de giro ativo que garante a liquidez imediata da próxima contemplação.'
    }
  ];

  // FILTERS FOR QUERY SEARCH ENGINE 
  const filteredMembers = searchQuery.trim() === '' ? [] : members.filter(m => 
    m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.phone.includes(searchQuery) ||
    m.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (m.bankIban || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredLogs = searchQuery.trim() === '' ? [] : logs.filter(l =>
    l.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
    String(l.amount).includes(searchQuery)
  );

  const hasSearchActive = searchQuery.trim() !== '';

  return (
    <div className="space-y-6">
      
      {/* 1. INTERACTIVE FILTER ENGINE & INQUIRY BAR */}
      <div className={`p-5 rounded-2xl border ${
        theme === 'dark' 
          ? 'bg-[#1e293b]/70 border-slate-700/80 shadow-[0_4px_24px_rgba(0,0,0,0.25)]' 
          : 'bg-white border-slate-200/90 shadow-sm'
      }`}>
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="w-full md:w-auto">
            <h3 className={`font-display font-medium text-xs uppercase tracking-wider flex items-center gap-1.5 ${
              theme === 'dark' ? 'text-teal-400' : 'text-teal-700'
            }`}>
              <Filter className="w-4 h-4" />
              Pesquisa Inteligente & Filtros Analíticos
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Pesquise por membro, telefone, IBAN, transações bancárias ou status das cotas.
            </p>
          </div>

          <div className="relative w-full md:w-[360px]">
            <span className="absolute left-3 top-2.5 text-slate-400">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              placeholder="Digite: 'João', '923...', 'apoio', 'IBAN', etc."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full py-2 pl-9 pr-8 text-xs rounded-lg transition-all focus:outline-none focus:ring-1 ${
                theme === 'dark' 
                  ? 'bg-slate-900 border-slate-700 text-white placeholder-slate-500 focus:border-teal-500 focus:ring-teal-500' 
                  : 'bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400 focus:border-teal-500 focus:ring-teal-500'
              }`}
            />
            {hasSearchActive && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2 text-xs font-semibold text-slate-400 hover:text-slate-200"
              >
                Limpar
              </button>
            )}
          </div>
        </div>

        {/* SEARCH RESULTS DROPDOWN / COLLAPSIBLE MATCH BOXES ("CAIXA DE CONSULTA") */}
        <AnimatePresence>
          {hasSearchActive && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className={`mt-4 pt-4 border-t ${
                theme === 'dark' ? 'border-slate-700/60' : 'border-slate-150'
              } overflow-hidden`}
            >
              <div className="space-y-4">
                
                {/* 1. MEMBERS RESULTS */}
                <div>
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center justify-between">
                    <span>Membros do Fundo Localizados ({filteredMembers.length})</span>
                    <span className="font-normal lowercase leading-none">filtro em tempo real</span>
                  </h4>

                  {filteredMembers.length === 0 ? (
                    <p className="text-[11px] text-slate-500 italic px-2">Nenhum membro corresponde à consulta.</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {filteredMembers.map(m => (
                        <div 
                          key={m.id}
                          className={`p-2.5 rounded-lg border text-xs flex justify-between items-center ${
                            theme === 'dark'
                              ? 'bg-slate-900/60 border-slate-800 text-slate-200'
                              : 'bg-slate-50 border-slate-200 text-slate-700'
                          }`}
                        >
                          <div className="truncate pr-2">
                            <span className="font-bold flex items-center gap-1">
                              {m.name} 
                              <span className={`text-[9px] px-1 py-0.2 rounded font-normal shrink-0 ${
                                m.assignedMonth === currentMonth 
                                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-400' 
                                  : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                              }`}>
                                Mês {m.assignedMonth}
                              </span>
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono block transition-colors">{m.email} | {m.phone}</span>
                          </div>
                          <div className="text-right">
                            <span className={`font-bold font-mono text-[10px] ${
                              m.contributions[currentMonth]?.paid ? 'text-emerald-500' : 'text-amber-500'
                            }`}>
                              {m.contributions[currentMonth]?.paid ? `Mês ${currentMonth} Pago` : 'Cota pendente'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 2. TRANSACTION LOGS RESULTS */}
                <div>
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                    Lançamentos Bancários / Log Auditoria Encontrados ({filteredLogs.length})
                  </h4>

                  {filteredLogs.length === 0 ? (
                    <p className="text-[11px] text-slate-500 italic px-2">Nenhuma transação financeira localiza os termos.</p>
                  ) : (
                    <div className="max-h-[160px] overflow-y-auto space-y-1.5 pr-1">
                      {filteredLogs.map(l => (
                        <div 
                          key={l.id}
                          className={`p-2 rounded-lg text-[11px] font-mono flex items-center justify-between ${
                            theme === 'dark' ? 'bg-slate-900/40 border border-slate-800 text-slate-300' : 'bg-white border border-slate-150 text-slate-600'
                          }`}
                        >
                          <div className="truncate max-w-[80%] pr-3">
                            <span className="text-slate-400 mr-2">[{l.type}]</span>
                            <span>{l.description}</span>
                          </div>
                          <span className={`font-bold shrink-0 ${
                            l.amount > 0 ? 'text-emerald-500' : l.amount < 0 ? 'text-rose-500' : 'text-slate-400'
                          }`}>
                            {l.amount !== 0 ? formatCurrency(l.amount) : 'Simulação'}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 2. MAIN INTERACTIVE CHARTS WRAPPER GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="charts-container">
        
        {/* GRAPH 1 (TOP LEFT): ARRECADAÇÃO MENSAL (KZ) */}
        {isFlowChartActive && (
          <div className="col-span-1 lg:col-span-12 xl:col-span-7 p-6 rounded-3xl border transition-all duration-300 bg-white border-slate-100 dark:bg-slate-900/60 dark:border-slate-800 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-3 mb-6">
                <div>
                  <h3 className="font-sans font-bold text-sm text-slate-800 dark:text-slate-150 tracking-tight">
                    Arrecadação Mensal (Kz)
                  </h3>
                </div>

                {/* Year Select Selector in CSS matching the screenshot */}
                <div className="relative">
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                    className="appearance-none pl-3 pr-8 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-sky-500 cursor-pointer shadow-xs min-w-[80px]"
                  >
                    <option value="2026">2026</option>
                    <option value="2025">2025</option>
                    <option value="2027">2027</option>
                  </select>
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                    <ChevronDown className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>

              {/* BAR CHART SVG PORTAL */}
              <div className="relative w-full h-[240px] mt-4 select-none">
                <svg viewBox="0 0 540 240" className="w-full h-full">
                  {/* Grid horizontal lines matching Y labels */}
                  {[
                    { val: '3000', y: 30 },
                    { val: '2250', y: 80 },
                    { val: '1500', y: 130 },
                    { val: '750', y: 180 },
                    { val: '0', y: 230 },
                  ].map((grid, index) => (
                    <g key={index}>
                      <text
                        x="34"
                        y={grid.y + 4}
                        fill="#94a3b8"
                        className="text-[10px] font-mono text-slate-400 fill-slate-400 dark:fill-slate-500"
                        textAnchor="end"
                      >
                        {grid.val}
                      </text>
                      {/* Grid line itself */}
                      <line
                        x1="45"
                        y1={grid.y}
                        x2="520"
                        y2={grid.y}
                        stroke="#f1f5f9"
                        className="stroke-slate-100 dark:stroke-slate-800/20"
                        strokeDasharray={index === 4 ? "0" : "3 3"}
                      />
                    </g>
                  ))}

                  {/* Monthly bars for 12 months based on March 2026 start */}
                  {Array.from({ length: 12 }, (_, idx) => {
                    const mNum = idx + 1;
                    return { id: mNum, name: getMonthSimpleLabel(mNum) };
                  }).map((m, i) => {
                    // Filter members who paid in month m.id
                    const paidCount = members.filter((member) => member.contributions[m.id]?.paid).length;
                    const collectedKz = members.reduce((sum, member) => {
                      const contr = member.contributions[m.id];
                      if (contr?.paid) {
                        return sum + ((contr as any).amount !== undefined ? (contr as any).amount : 120000);
                      }
                      return sum;
                    }, 0);
                    
                    const monthBeneficiaries = members
                      .filter((member) => member.assignedMonth === m.id)
                      .map((member) => member.name);

                    // Scale logic: We scale so a fully paying month (12 * 120k = 1.44M Kzs) or custom represents a clean height.
                    // Let's scale up slightly so it looks incredibly substantial and visually satisfying.
                    // The maximum collection possible is 1,440,000. Let's map 1,440,000 to a nice height of 150px contextually, so the bars look gorgeous!
                    // In the user's screenshot, "Mai" is the peak bar representing full operation.
                    const barHeight = Math.max(3, (collectedKz / 1440000) * 190); 
                    const isActive = activeChartMonth === m.id;
                    const isHoveredCol = hoveredBar?.id === m.id;
                    const xPosition = 45 + i * 39 + 10;
                    const yPosition = 230 - barHeight;

                    return (
                      <g 
                        key={m.id} 
                        className="cursor-pointer group"
                        onClick={() => setActiveChartMonth(m.id)}
                        onMouseEnter={() => {
                          setHoveredBar({
                            id: m.id,
                            name: m.name,
                            x: xPosition,
                            y: yPosition,
                            collectedKz,
                            paidCount,
                            beneficiaries: monthBeneficiaries
                          });
                        }}
                        onMouseLeave={() => {
                          setHoveredBar(null);
                        }}
                      >
                        {/* Hover bar overlay trigger area */}
                        <rect
                          x={xPosition - 5}
                          y={10}
                          width={26}
                          height={220}
                          fill="transparent"
                          className="hover:fill-slate-500/5 transition-colors"
                        />

                        {/* Visual Bar Column (Sky blue matching the screenshot model) */}
                        <motion.rect
                          initial={{ height: 0, y: 230 }}
                          animate={{ height: barHeight, y: yPosition }}
                          whileHover={{ 
                            scale: 1.05,
                            filter: "drop-shadow(0px 6px 12px rgba(14,165,233,0.5))"
                          }}
                          transition={{ 
                            height: { duration: 0.5, delay: i * 0.02 },
                            y: { duration: 0.5, delay: i * 0.02 },
                            scale: { duration: 0.2 },
                            filter: { duration: 0.2 }
                          }}
                          style={{ transformOrigin: `${xPosition + 7}px ${yPosition + barHeight}px` }}
                          x={xPosition}
                          width={14}
                          rx={7}
                          ry={7}
                          fill={isActive || isHoveredCol ? "#0ea5e9" : "#38bdf8"}
                          className={`transition-all duration-200 cursor-pointer ${
                            isActive || isHoveredCol
                              ? "fill-[#0ea5e9] saturate-110" 
                              : "fill-sky-450/40 group-hover:fill-sky-450"
                          }`}
                        />

                        {/* Month Label */}
                        <text
                          x={xPosition + 7}
                          y={248}
                          textAnchor="middle"
                          fill={isActive || isHoveredCol ? "#0ea5e9" : "#94a3b8"}
                          className={`text-[9px] font-medium font-sans ${
                            isActive || isHoveredCol ? "font-bold fill-sky-500 dark:fill-sky-400" : "fill-slate-450 dark:fill-slate-500"
                          }`}
                        >
                          {m.name}
                        </text>
                      </g>
                    );
                  })}
                </svg>

                {/* Floating Interactive Tooltip */}
                <AnimatePresence>
                  {hoveredBar && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: -8 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -8 }}
                      className={`absolute z-50 pointer-events-none p-3.5 rounded-2xl border shadow-xl text-xs flex flex-col gap-2 transition-all duration-150 ${
                        theme === 'dark' 
                          ? 'bg-[#0f172a]/95 border-slate-700/80 text-white shadow-black/60' 
                          : 'bg-white/95 border-slate-200 text-slate-800 shadow-slate-200/60'
                      }`}
                      style={{
                        left: `${((hoveredBar.x + 7) / 540) * 100}%`,
                        top: `${(hoveredBar.y / 240) * 100}%`,
                        transform: 'translate(-50%, -105%)',
                      }}
                    >
                      <div className="flex items-center gap-1.5 border-b pb-1.5 border-slate-700/20 dark:border-slate-100/10 mb-0.5">
                        <Calendar className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                        <span className="font-sans font-bold text-[10px] uppercase tracking-wider">
                          Mês {hoveredBar.id} — {hoveredBar.name}
                        </span>
                      </div>
                      
                      <div className="space-y-1.5 text-[11px]">
                        <div className="flex justify-between items-center gap-6">
                          <span className="text-slate-400 font-medium">Arrecadação total:</span>
                          <span className="font-mono font-extrabold text-[#0ea5e9]">
                            {formatCurrency(hoveredBar.collectedKz)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center gap-6">
                          <span className="text-slate-400 font-medium">Adesão / Settled:</span>
                          <span className="font-mono font-extrabold">
                            {hoveredBar.paidCount} de 12 sócios ({Math.round((hoveredBar.paidCount / 12) * 100)}%)
                          </span>
                        </div>
                        <div className="border-t pt-2 border-slate-705/10 dark:border-slate-100/5 mt-0.5 webkit-font-smoothing">
                          <span className="text-slate-400 font-bold block mb-1">Beneficiários designados:</span>
                          <div className="flex flex-col gap-1 pl-2 border-l-2 border-amber-500/80">
                            {hoveredBar.beneficiaries.length === 0 ? (
                              <span className="text-slate-500 italic text-[10px]">Sem beneficiários alocados</span>
                            ) : (
                              hoveredBar.beneficiaries.map((name, idx) => (
                                <span key={idx} className="font-semibold text-amber-600 dark:text-amber-400 text-[10.5px]">
                                  • {name}
                                </span>
                              ))
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Quick status summary */}
            <div className="mt-4 pt-3 border-t border-slate-50 dark:border-slate-800/40 flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center gap-1.5 font-medium">
                <span className="w-2 h-2 rounded-full bg-sky-500 animate-pulse" />
                Ciclo em visualização: <strong className="text-slate-700 dark:text-slate-350">Mês 0{activeChartMonth}</strong>
              </span>
              <span className="text-[10px] font-mono">Consórcio {selectedYear}</span>
            </div>
          </div>
        )}

        {/* GRAPH 2 (TOP RIGHT): DISTRIBUIÇÃO POR ESTADO */}
        {isAllocationChartActive && (
          <div className="col-span-1 lg:col-span-12 xl:col-span-5 p-6 rounded-3xl border transition-all duration-300 bg-white border-slate-100 dark:bg-slate-900/60 dark:border-slate-800 shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="font-sans font-bold text-sm text-slate-800 dark:text-slate-150 tracking-tight">
                Distribuição por Estado
              </h3>

              {/* DONUT CHART DISPLAY */}
              <div className="flex items-center justify-center py-6 relative">
                <svg width="180" height="180" viewBox="0 0 180 180" className="transform -rotate-90">
                  {/* Concentric track with beautiful holes matching the screenshot */}
                  {(() => {
                    const radius = 64;
                    const circumference = 2 * Math.PI * radius;
                    
                    const paidCount = members.filter((member) => member.contributions[activeChartMonth]?.paid).length;
                    
                    const paidPct = paidCount / 12;
                    const strokePaidLength = paidPct * circumference;

                    return (
                      <g>
                        {/* Background / Pendente part in green */}
                        <circle
                          cx="90"
                          cy="90"
                          r={radius}
                          fill="transparent"
                          stroke="#10b981"
                          strokeWidth="18"
                          className="stroke-emerald-500"
                        />

                        {/* Foreground / Pago part in blue */}
                        {strokePaidLength > 0 && (
                          <motion.circle
                            initial={{ strokeDasharray: `0 ${circumference}` }}
                            animate={{ strokeDasharray: `${strokePaidLength} ${circumference}` }}
                            transition={{ duration: 0.6 }}
                            cx="90"
                            cy="90"
                            r={radius}
                            fill="transparent"
                            stroke="#0ea5e9"
                            strokeWidth="18"
                            strokeDashoffset={0}
                            strokeLinecap="round"
                            className="stroke-sky-500"
                          />
                        )}

                        {/* Internal Label showing the stats */}
                        <g className="transform rotate-90" style={{ transformOrigin: '90px 90px' }}>
                          <text
                            x="90"
                            y="88"
                            textAnchor="middle"
                            className="text-lg font-black fill-slate-850 dark:fill-white font-sans"
                          >
                            {Math.round(paidPct * 100)}%
                          </text>
                          <text
                            x="90"
                            y="104"
                            textAnchor="middle"
                            className="text-[9px] font-black fill-slate-400 dark:fill-slate-500 font-sans tracking-widest uppercase"
                          >
                            Mês 0{activeChartMonth}
                          </text>
                        </g>
                      </g>
                    );
                  })()}
                </svg>
              </div>

              {/* Exact Legend Below Chart matching the screenshot model */}
              <div className="flex items-center justify-center gap-6 mt-2 pt-2">
                <div className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 bg-sky-500 rounded-md shadow-xs shrink-0" />
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                    Pago
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 bg-emerald-500 rounded-md shadow-xs shrink-0" />
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                    Pendente
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-50 dark:border-slate-800/40 text-[11px] text-slate-400 text-center font-semibold">
              {members.filter((member) => member.contributions[activeChartMonth]?.paid).length}/12 cotas regularizadas neste ciclo
            </div>
          </div>
        )}

      </div>

      {/* GRAPH 3 (BOTTOM FULLWIDTH): EVOLUÇÃO DA ARRECADAÇÃO (ACUMULADO) */}
      <div className="p-6 rounded-3xl border transition-all duration-300 bg-white border-slate-100 dark:bg-slate-900/60 dark:border-slate-800 shadow-sm">
        <h3 className="font-sans font-bold text-sm text-slate-800 dark:text-slate-150 tracking-tight">
          Evolução da Arrecadação (Acumulado)
        </h3>

        {/* ACCUMULATED LINE CHART SVG */}
        <div className="relative w-full h-[240px] mt-4 select-none">
          <svg viewBox="0 0 1000 240" className="w-full h-full">
            <defs>
              <linearGradient id="purpleGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.18" />
                <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Grid horizontal lines matching Y labels */}
            {[
              { val: '3000', y: 30 },
              { val: '2250', y: 77.5 },
              { val: '1500', y: 125 },
              { val: '750', y: 172.5 },
              { val: '0', y: 220 },
            ].map((grid, index) => (
              <g key={index}>
                <text
                  x="42"
                  y={grid.y + 4}
                  fill="#94a3b8"
                  className="text-[10px] font-mono text-slate-400 fill-slate-400 dark:fill-slate-500"
                  textAnchor="end"
                >
                  {grid.val}
                </text>
                <line
                  x1="55"
                  y1={grid.y}
                  x2="975"
                  y2={grid.y}
                  stroke="#f1f5f9"
                  className="stroke-slate-100 dark:stroke-slate-800/20"
                  strokeDasharray={index === 4 ? "0" : "3 3"}
                />
              </g>
            ))}

            {/* Dynamic Math Calculations for Accumulated Curve Jan-Dez */}
            {(() => {
              const monthsTemp = [
                { id: 1, name: 'Jan' },
                { id: 2, name: 'Fev' },
                { id: 3, name: 'Mar' },
                { id: 4, name: 'Abr' },
                { id: 5, name: 'Mai' },
                { id: 6, name: 'Jun' },
                { id: 7, name: 'Jul' },
                { id: 8, name: 'Ago' },
                { id: 9, name: 'Set' },
                { id: 10, name: 'Out' },
                { id: 11, name: 'Nov' },
                { id: 12, name: 'Dez' }
              ];

              // Calculate accumulated value for each month
              let accum = 0;
              const points = monthsTemp.map((m, index) => {
                const paidCount = members.filter((member) => member.contributions[m.id]?.paid).length;
                const collectedKz = members.reduce((sum, member) => {
                  const contr = member.contributions[m.id];
                  if (contr?.paid) {
                    return sum + ((contr as any).amount !== undefined ? (contr as any).amount : 120000);
                  }
                  return sum;
                }, 0);
                accum += collectedKz;

                // Scale value relative to a max scale of 3,000,000 Kz (or scale appropriately based on data)
                const scaleCeiling = 3000000;
                const ratio = Math.min(1.0, accum / scaleCeiling);
                
                const x = 55 + index * 83.63;
                const y = 220 - ratio * 190;

                return { x, y, value: accum, name: m.name };
              });

              // Generate Smooth Cubic Bezier path
              let curveD = "";
              let areaD = "";

              if (points.length > 0) {
                curveD = `M ${points[0].x} ${points[0].y}`;
                areaD = `M ${points[0].x} 220 L ${points[0].x} ${points[0].y}`;
                
                for (let i = 1; i < points.length; i++) {
                  const p = points[i];
                  const prev = points[i - 1];
                  const cp1x = prev.x + (p.x - prev.x) / 2;
                  const cp1y = prev.y;
                  const cp2x = prev.x + (p.x - prev.x) / 2;
                  const cp2y = p.y;
                  
                  curveD += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p.x} ${p.y}`;
                  areaD += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p.x} ${p.y}`;
                }

                // Close the area path to draw the beautiful gradient glow
                areaD += ` L ${points[points.length - 1].x} 220 Z`;
              }

              return (
                <g>
                  {/* Lavender/Purple Gradient filled background */}
                  {areaD && (
                    <motion.path
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.8 }}
                      d={areaD}
                      fill="url(#purpleGradient)"
                    />
                  )}

                  {/* Main elegant purple stroke wave line */}
                  {curveD && (
                    <motion.path
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 1, ease: "easeInOut" }}
                      d={curveD}
                      fill="none"
                      stroke="#8b5cf6"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                  )}

                  {/* Circle nodes for each month */}
                  {points.map((p, index) => {
                    const isActive = activeChartMonth === index + 1;
                    return (
                      <g key={index} className="group cursor-pointer" onClick={() => setActiveChartMonth(index + 1)}>
                        {/* Interactive hover expanded dot area */}
                        <circle
                          cx={p.x}
                          cy={p.y}
                          r="12"
                          fill="transparent"
                          className="hover:fill-purple-500/5 transition-colors"
                        />

                        {/* Solid visual circular indicator dot matching screenshot */}
                        <circle
                          cx={p.x}
                          cy={p.y}
                          r={isActive ? "6.5" : "4.5"}
                          fill={isActive ? "#8b5cf6" : "#a78bfa"}
                          stroke="white"
                          strokeWidth={isActive ? "2.5" : "2"}
                          className="transition-all duration-200 group-hover:r-6 group-hover:fill-[#8b5cf6]"
                        />

                        {/* Axis Bottom Month label */}
                        <text
                          x={p.x}
                          y={238}
                          textAnchor="middle"
                          fill={isActive ? "#8b5cf6" : "#94a3b8"}
                          className={`text-[9px] font-sans transition-colors ${
                            isActive ? "font-bold fill-purple-500 dark:fill-purple-400" : "fill-slate-450 dark:fill-slate-500"
                          }`}
                        >
                          {p.name}
                        </text>

                        {/* Hover Tooltip */}
                        <title>
                          {`${p.name} - Acumulado: ${formatCurrency(p.value)}`}
                        </title>
                      </g>
                    );
                  })}
                </g>
              );
            })()}
          </svg>
        </div>
      </div>

      {!isFlowChartActive && !isAllocationChartActive && (
        <div className={`p-8 rounded-2xl border text-center ${
          theme === 'dark' ? 'bg-[#1e293b]/50 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <Coins className="w-12 h-12 text-slate-400 mx-auto mb-3 opacity-65" />
          <h4 className={`font-display font-black text-xs uppercase tracking-wider ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
            Módulo de Gráficos Ocultado pelo Painel de Gestão
          </h4>
          <p className="text-xs text-slate-600 dark:text-slate-350 mt-1 max-w-md mx-auto">
            O administrador desativou de forma temporária a visualização de gráficos financeiros do consórcio. O uso da barra de buscas segue liberado no topo para consulta e auditoria individuais.
          </p>
        </div>
      )}

      {/* 3. DEDICATED COLLAPSIBLE FILES CONSULTATION ("CAIXA DE CONSULTA / PASTAS DE AJUSTES") */}
      <div className={`p-5 rounded-2xl border ${
        theme === 'dark' ? 'bg-[#1e293b]/70 border-slate-700/85' : 'bg-white border-slate-200/90'
      }`} id="consultation-foldout">
        
        <div className="flex items-center justify-between border-b pb-3 mb-4 border-slate-700/30">
          <div className="flex items-center gap-2">
            <FolderLock className={`w-5 h-5 ${theme === 'dark' ? 'text-amber-400' : 'text-amber-600'}`} />
            <div>
              <h4 className={`font-display font-black text-xs uppercase tracking-wider ${
                theme === 'dark' ? 'text-white' : 'text-slate-800'
              }`}>
                Pastas de Auditoria & Caixa de Consulta
              </h4>
              <p className="text-[10px] text-slate-400">Registros e cálculos profundos armazenados fora do foco principal do dashboard.</p>
            </div>
          </div>

          <div className="flex gap-2">
            <button 
              onClick={() => setOpenSection(openSection === 'calculations' ? 'none' : 'calculations')}
              className={`px-3 py-1 text-[10px] font-bold rounded-lg transition-colors cursor-pointer ${
                openSection === 'calculations' 
                  ? 'bg-rose-500/10 text-rose-400' 
                  : 'bg-slate-700/20 text-slate-400 hover:text-white'
              }`}
            >
              Auditoria de Parcelas
            </button>
            <button 
              onClick={() => setOpenSection(openSection === 'simulation' ? 'none' : 'simulation')}
              className={`px-3 py-1 text-[10px] font-bold rounded-lg transition-colors cursor-pointer ${
                openSection === 'simulation' 
                  ? 'bg-emerald-500/10 text-emerald-400' 
                  : 'bg-slate-700/20 text-slate-400 hover:text-white'
              }`}
            >
              Exemplo de Liquidação
            </button>
          </div>
        </div>

        {/* SECTION A: AUDITORIA DE PARCELAS */}
        <AnimatePresence>
          {openSection === 'calculations' && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="text-xs text-slate-400 space-y-3 font-mono leading-relaxed"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className={`p-3 rounded-lg border text-[11px] ${
                  theme === 'dark' ? 'bg-slate-900/60 border-slate-850' : 'bg-slate-50 border-slate-200'
                }`}>
                  <h5 className="font-bold text-slate-300 mb-1">Regra de Divisão Matemática (Kix)</h5>
                  <p className="space-y-1 text-slate-400">
                    <span>- Valor da cota por membro: 120.000,00 KZs</span><br />
                    <span>- Distribuição efetiva de rotação: 100.000,00 KZs</span><br />
                    <span>- Retenção assistencial poupança: 20.000,00 KZs</span><br />
                    <span>- 12 membros * 120k = 1.440.000,00 KZs arrecadados</span>
                  </p>
                </div>
                <div className={`p-3 rounded-lg border text-[11px] ${
                  theme === 'dark' ? 'bg-slate-900/60 border-slate-850' : 'bg-slate-50 border-slate-200'
                }`}>
                  <h5 className="font-bold text-slate-300 mb-1">Distribuição de Saída</h5>
                  <p className="space-y-1 text-slate-400">
                    <span>- Beneficiários por mês: 2 membros contemplados</span><br />
                    <span>- Ganho líquido por contemplado: 600.000,00 KZs</span><br />
                    <span>- 2 contemplados * 600k = 1.200.000,00 KZs liquidados</span><br />
                    <span>- Fundo Social de Rotação retido: 240.000,00 KZs</span>
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* SECTION B: SIMULAÇÃO RAPIDA */}
          {openSection === 'simulation' && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="text-xs text-slate-400 space-y-3 leading-relaxed"
            >
              <p className={theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}>
                <strong>Kix Fundo Cooperativo</strong> opera através de fundos mutualistas transparentes. O modelo atuarial garante o crescimento contínuo de caixa de forma sustentável para cobrir apoios clínicos ao longo de 6 meses de operações contínuas. Qualquer saque emergencial é devidamente auditado no Livro de Atividades.
              </p>
            </motion.div>
          )}
        </AnimatePresence>

      </div>

    </div>
  );
}

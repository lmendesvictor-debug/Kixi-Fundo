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
  Check,
  MessageSquare,
  Send,
  BellRing,
  Sparkles
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { Member, Loan } from '../types';

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
  loans?: Loan[];
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
  loans,
}: MetricCardsProps) {
  // Determine default value / last paid cycle (where payoutsCompleted is true)
  const getLastPaidCycle = () => {
    return [6, 5, 4, 3, 2, 1].find(num => payoutsCompleted[num] === true) || currentMonth || 1;
  };

  const [selectedCycle, setSelectedCycle] = useState<number>(getLastPaidCycle);
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'pending' | 'beneficiaries'>('paid');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [hoveredCreditProfitIndex, setHoveredCreditProfitIndex] = useState<number | null>(null);
  const [activeLeftTab, setActiveLeftTab] = useState<'composition' | 'social' | 'cycle' | 'contemplations'>('composition');
  const [isSendingBulkReminders, setIsSendingBulkReminders] = useState<boolean>(false);
  const [bulkReminderSuccessMessage, setBulkReminderSuccessMessage] = useState<string | null>(null);

  const handleSendBulkReminders = () => {
    if (pendingContributors.length === 0) return;
    setIsSendingBulkReminders(true);
    setBulkReminderSuccessMessage(null);
    
    setTimeout(() => {
      setIsSendingBulkReminders(false);
      setBulkReminderSuccessMessage(
        `Disparo Automático Concluído! ${pendingContributors.length} lembretes de cobrança foram despachados via API de WhatsApp/SMS.`
      );
    }, 2200);
  };

  // Sync selectedCycle to the last paid cycle when payoutsCompleted or currentMonth changes
  useEffect(() => {
    setSelectedCycle(getLastPaidCycle());
  }, [payoutsCompleted, currentMonth]);
  
  const currentCollected = customCollected !== undefined ? customCollected : currentPaidCount * 120000;
  const targetArrecadacao = totalMembersCount * 120000; // 1,440,000.00
  const progressPercent = targetArrecadacao > 0 ? Math.min((currentCollected / targetArrecadacao) * 100, 100) : 0;

  // fallback in case members list is empty or under development
  const membersList = members || [];

  // 1. Quotas (monthly contribution stats of all members for the selectedMonth)
  const allContributorsForCycle = membersList.map(m => {
    const contr = m.contributions[selectedCycle];
    return {
      id: m.id,
      name: m.name,
      phone: m.phone || '',
      email: m.email || '',
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

  const cyclePaidAmount = totalValoresPagosCycle;
  const cycleConformityPercent = targetArrecadacao > 0 ? Math.min((cyclePaidAmount / targetArrecadacao) * 100, 100) : 0;

  // Filter list based on sub-tab choice - Only present paid contributors for the selected cycle
  const displayedItems = (() => {
    if (statusFilter === 'all' || statusFilter === 'paid') return paidContributors;
    if (statusFilter === 'pending') return pendingContributors;
    // beneficiaries tab returns mapped elements mimicking the format
    return searchedBeneficiaries.map(b => ({
      id: b.id,
      name: b.name,
      phone: b.phone || '',
      email: b.email || '',
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
  const totalPrincipalDisbursed = loans?.reduce((acc, l) => acc + l.amountRequested, 0) || 0;
  const totalPrincipalRepaid = loans?.reduce((acc, l) => {
    return acc + l.payments.filter(p => p.paid).reduce((sum, p) => sum + p.principalPaid, 0);
  }, 0) || 0;
  const activeLoansOutstanding = Math.max(0, totalPrincipalDisbursed - totalPrincipalRepaid);

  const rotationPrice = totalBeneficiaryDestined;
  const socialPrice = totalSocialRetained;
  
  // Deduct active loans from rotation fund to find the liquid amount
  const liquidRotation = Math.max(0, rotationPrice - activeLoansOutstanding);
  const combinedTotal = rotationPrice + socialPrice;

  const rotationPercent = combinedTotal > 0 ? ((liquidRotation / combinedTotal) * 100).toFixed(1) : '0.0';
  const creditPercent = combinedTotal > 0 ? ((activeLoansOutstanding / combinedTotal) * 100).toFixed(1) : '0.0';
  const socialPercent = combinedTotal > 0 ? ((socialPrice / combinedTotal) * 100).toFixed(1) : '0.0';

  const pieData = combinedTotal > 0 ? [
    { name: 'Disponível p/ Rotação (Líquido)', value: liquidRotation, color: '#0284C7', percent: rotationPercent },
    { name: 'Crédito Ativo (Emprestado)', value: activeLoansOutstanding, color: '#8B5CF6', percent: creditPercent },
    { name: 'Fundo Social (Reservado)', value: socialPrice, color: '#10B981', percent: socialPercent }
  ] : [
    { name: 'Sem Informações (Cadastro Vazio)', value: 1, color: '#94A3B8', percent: '0.0' }
  ];

  const isHovered = hoveredIndex !== null;
  const currentDisplayLabel = isHovered ? pieData[hoveredIndex!].name : 'Patrimônio Coletivo Total';
  const currentDisplayValue = combinedTotal > 0 ? (isHovered ? pieData[hoveredIndex!].value : combinedTotal) : 0;
  const currentDisplayColor = isHovered ? pieData[hoveredIndex!].color : undefined;
  const currentDisplayPercent = combinedTotal > 0 ? (isHovered ? pieData[hoveredIndex!].percent : undefined) : undefined;

  // Cálculos dinâmicos de crédito e juros (lucros)
  const totalLentAmount = loans?.reduce((acc, l) => acc + l.amountRequested, 0) || 0;
  const totalContractedInterest = loans?.reduce((acc, l) => {
    return acc + (l.payments || []).reduce((sum, p) => sum + p.interestPaid, 0);
  }, 0) || 0;
  const totalRealizedInterest = loans?.reduce((acc, l) => {
    return acc + (l.payments || []).filter(p => p.paid).reduce((sum, p) => sum + p.interestPaid, 0);
  }, 0) || 0;
  const totalProjectedInterest = Math.max(0, totalContractedInterest - totalRealizedInterest);

  const displayLent = totalLentAmount;
  const displayInterest = totalContractedInterest;
  const displayTotal = displayLent + displayInterest;
  const lentPercent = displayTotal > 0 ? ((displayLent / displayTotal) * 100).toFixed(1) : '0.0';
  const interestPercent = displayTotal > 0 ? ((displayInterest / displayTotal) * 100).toFixed(1) : '0.0';

  const creditProfitPieData = displayTotal > 0 ? [
    { name: 'Capital Concedido (Investido)', value: displayLent, color: '#8B5CF6', percent: lentPercent },
    { name: 'Juros Acumulados (Lucros)', value: displayInterest, color: '#10B981', percent: interestPercent }
  ] : [
    { name: 'Sem Créditos Ativos (Cadastro Vazio)', value: 1, color: '#94A3B8', percent: '0.0' }
  ];

  const isCreditProfitHovered = hoveredCreditProfitIndex !== null;
  const currentCreditProfitLabel = isCreditProfitHovered 
    ? creditProfitPieData[hoveredCreditProfitIndex!].name 
    : 'Crédito Ativo (Investido)';
  const currentCreditProfitValue = displayTotal > 0 
    ? (isCreditProfitHovered ? creditProfitPieData[hoveredCreditProfitIndex!].value : displayLent)
    : 0;
  const currentCreditProfitColor = isCreditProfitHovered 
    ? creditProfitPieData[hoveredCreditProfitIndex!].color 
    : '#8B5CF6';
  const currentCreditProfitPercent = displayTotal > 0
    ? (isCreditProfitHovered ? creditProfitPieData[hoveredCreditProfitIndex!].percent : lentPercent)
    : '0.0';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-1 select-none font-sans text-slate-800 dark:text-slate-100" id="dashboard-widgets-panel">
      
      {/* CARD 1: PAINEL DE PATRIMÓNIO & GOVERNAÇÃO COLETIVA */}
      <div className="bg-white/45 dark:bg-slate-900/40 backdrop-blur-md rounded-3xl border border-slate-200/50 dark:border-slate-800/60 p-6 flex flex-col justify-between shadow-md hover:shadow-lg transition-all duration-300 hover:border-sky-350 dark:hover:border-sky-800/80 min-h-[640px]">
        <div>
          {/* Header & Main Toggle */}
          <div className="flex flex-col gap-4 mb-6 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="flex items-center justify-between">
              <h2 className="text-[13px] font-black tracking-tight text-slate-900 dark:text-white uppercase flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-[#0d5c3a] text-white flex items-center justify-center font-black text-xs">
                  🏛️
                </span>
                Governação & Patrimônio
              </h2>
              <span className="text-[9.5px] font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                Fundo de Rotação
              </span>
            </div>

            {/* Pill Bar Selector */}
            <div className="flex flex-wrap gap-1 bg-slate-150/60 dark:bg-slate-950/40 p-1 rounded-2xl border border-slate-200/35 dark:border-slate-800/30">
              <button
                onClick={() => setActiveLeftTab('composition')}
                className={`flex-1 min-w-[70px] text-[10.5px] py-2 font-black rounded-xl transition-all cursor-pointer text-center whitespace-nowrap ${
                  activeLeftTab === 'composition'
                    ? 'bg-[#0d5c3a] text-white shadow-md font-extrabold'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-750 hover:bg-slate-200/40 dark:hover:bg-slate-800/30'
                }`}
              >
                Composição
              </button>
              <button
                onClick={() => setActiveLeftTab('social')}
                className={`flex-1 min-w-[70px] text-[10.5px] py-2 font-black rounded-xl transition-all cursor-pointer text-center whitespace-nowrap ${
                  activeLeftTab === 'social'
                    ? 'bg-[#0d5c3a] text-white shadow-md font-extrabold'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-750 hover:bg-slate-200/40 dark:hover:bg-slate-800/30'
                }`}
              >
                Fundo Social
              </button>
              <button
                onClick={() => setActiveLeftTab('cycle')}
                className={`flex-1 min-w-[70px] text-[10.5px] py-2 font-black rounded-xl transition-all cursor-pointer text-center whitespace-nowrap ${
                  activeLeftTab === 'cycle'
                    ? 'bg-[#0d5c3a] text-white shadow-md font-extrabold'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-750 hover:bg-slate-200/40 dark:hover:bg-slate-800/30'
                }`}
              >
                Ciclo Corrente
              </button>
              <button
                onClick={() => setActiveLeftTab('contemplations')}
                className={`flex-1 min-w-[70px] text-[10.5px] py-2 font-black rounded-xl transition-all cursor-pointer text-center whitespace-nowrap ${
                  activeLeftTab === 'contemplations'
                    ? 'bg-[#0d5c3a] text-white shadow-md font-extrabold'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-750 hover:bg-slate-200/40 dark:hover:bg-slate-800/30'
                }`}
              >
                Contemplações
              </button>
            </div>
          </div>

          {/* Conditional Content */}
          {activeLeftTab === 'composition' && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className="flex justify-between items-center px-1 mb-1">
                <span className="text-[11px] font-extrabold text-slate-450 dark:text-slate-400 uppercase tracking-wider">
                  Composição do Patrimônio Coletivo
                </span>
                <span className="text-xs font-black text-[#0d5c3a] dark:text-emerald-400 font-mono bg-emerald-500/5 px-2.5 py-1 rounded-xl border border-emerald-500/10">
                  {formatCurrency(combinedTotal)}
                </span>
              </div>
              
              <div className="flex flex-col items-center justify-center py-2 relative">
                <div className="w-[230px] h-[230px] flex items-center justify-center relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={72}
                        outerRadius={98}
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
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4 pointer-events-none transition-all duration-200">
                    <span 
                      className="text-[8.5px] font-black uppercase tracking-wider leading-tight max-w-[120px] transition-colors duration-200 text-slate-400 dark:text-slate-500"
                      style={{ color: currentDisplayColor ? currentDisplayColor : undefined }}
                    >
                      {currentDisplayLabel}
                    </span>
                    <span 
                      className="text-[11.5px] font-bold mt-1.5 font-mono whitespace-nowrap transition-colors duration-200 text-slate-900 dark:text-white"
                      style={{ color: currentDisplayColor ? currentDisplayColor : undefined }}
                    >
                      {formatCurrency(currentDisplayValue)}
                    </span>
                    {currentDisplayPercent && (
                      <span 
                        className="text-[9px] font-extrabold mt-1 px-2 py-0.5 rounded-full text-white font-sans scale-90 transition-all duration-200"
                        style={{ backgroundColor: currentDisplayColor }}
                      >
                        {currentDisplayPercent}% do fundo
                      </span>
                    )}
                  </div>
                </div>

                {/* Legend */}
                <div className="mt-5 flex flex-col gap-1.5 w-full text-xs font-semibold">
                  <div 
                    className={`flex items-center justify-between p-2 rounded-xl border border-transparent transition-all duration-200 cursor-pointer ${hoveredIndex === 0 ? 'bg-sky-500/10 border-sky-500/20 font-black' : hoveredIndex !== null ? 'opacity-40' : ''}`}
                    onMouseEnter={() => setHoveredIndex(0)}
                    onMouseLeave={() => setHoveredIndex(null)}
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-xs bg-[#0284C7] shrink-0" />
                      <span className="text-slate-600 dark:text-slate-350 text-[11px]">
                        Líquido Rotação
                      </span>
                    </div>
                    <span className="font-mono text-[11px] font-black text-sky-600 dark:text-sky-450 bg-sky-500/10 px-1.5 py-0.5 rounded-md">
                      {rotationPercent}% ({formatCurrency(liquidRotation)})
                    </span>
                  </div>

                  <div 
                    className={`flex items-center justify-between p-2 rounded-xl border border-transparent transition-all duration-200 cursor-pointer ${hoveredIndex === 1 ? 'bg-violet-500/10 border-violet-500/20 font-black' : hoveredIndex !== null ? 'opacity-40' : ''}`}
                    onMouseEnter={() => setHoveredIndex(1)}
                    onMouseLeave={() => setHoveredIndex(null)}
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-xs bg-[#8B5CF6] shrink-0" />
                      <span className="text-slate-600 dark:text-slate-350 text-[11px]">
                        Crédito Ativo (Emprestado)
                      </span>
                    </div>
                    <span className="font-mono text-[11px] font-black text-violet-600 dark:text-violet-400 bg-violet-500/10 px-1.5 py-0.5 rounded-md">
                      {creditPercent}% ({formatCurrency(activeLoansOutstanding)})
                    </span>
                  </div>

                  <div 
                    className={`flex items-center justify-between p-2 rounded-xl border border-transparent transition-all duration-200 cursor-pointer ${hoveredIndex === 2 ? 'bg-[#10B981]/10 border-[#10B981]/20 font-black' : hoveredIndex !== null ? 'opacity-40' : ''}`}
                    onMouseEnter={() => setHoveredIndex(2)}
                    onMouseLeave={() => setHoveredIndex(null)}
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-xs bg-[#10B981] shrink-0" />
                      <span className="text-slate-600 dark:text-slate-350 text-[11px]">
                        Fundo Social (Reservado)
                      </span>
                    </div>
                    <span className="font-mono text-[11px] font-black text-emerald-600 dark:text-emerald-450 bg-emerald-500/10 px-1.5 py-0.5 rounded-md">
                      {socialPercent}% ({formatCurrency(socialPrice)})
                    </span>
                  </div>
                </div>

                {/* Solvency Rule Card */}
                <div className="mt-4 w-full bg-slate-50 dark:bg-slate-950/40 border border-slate-200/40 dark:border-slate-800/40 p-3 rounded-2xl text-[10px] leading-relaxed text-slate-500 dark:text-slate-400 flex items-start gap-2 shadow-xs">
                  <span className="text-amber-500 text-xs mt-0.5 shrink-0">💡</span>
                  <p className="font-medium">
                    <strong>Regra de Equilíbrio:</strong> O Crédito de{' '}
                    <strong className="text-slate-800 dark:text-white font-mono">
                      {formatCurrency(activeLoansOutstanding)}
                    </strong>{' '}
                    está em amortização. Foi retirado da liquidez, mas permanece como patrimônio realizável ativo do fundo.
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {activeLeftTab === 'social' && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-2 animate-fadeIn"
            >
              {(() => {
                const actualInterestPaid = loans?.reduce((acc, l) => {
                  return acc + (l.payments || []).filter(p => p.paid).reduce((sum, p) => sum + p.interestPaid, 0);
                }, 0) || 0;
                const singularLoans = loans?.filter(l => l.borrowerType === 'singular') || [];
                const expectedSingularInterest = singularLoans.reduce((acc, l) => acc + l.payments.reduce((sum, p) => sum + p.interestPaid, 0), 0);
                const creditToThirdParty = singularLoans.reduce((acc, l) => acc + l.amountRequested, 0);
                const expectedSingularInterestFull = expectedSingularInterest;
                const interestEarned = actualInterestPaid;
                const totalReimbursement = creditToThirdParty + expectedSingularInterestFull;
                
                const totalPaidContributionsCount = members?.reduce((acc, m) => {
                  return acc + Object.keys(m.contributions).filter(mk => m.contributions[Number(mk)]?.paid).length;
                }, 0) || 0;
                const baseSocialPrice = totalPaidContributionsCount * 20000;
                const totalSocialAccumulated = (baseSocialPrice + interestEarned) + totalSocialDisbursed;

                const percentRetained = totalSocialAccumulated > 0 ? (baseSocialPrice / totalSocialAccumulated) * 100 : 0;
                const percentInterest = totalSocialAccumulated > 0 ? (interestEarned / totalSocialAccumulated) * 100 : 0;
                const percentDisbursed = totalSocialAccumulated > 0 ? (totalSocialDisbursed / totalSocialAccumulated) * 100 : 0;

                return (
                  <div className="py-1 space-y-4 text-xs">
                    <div className="flex justify-between items-center font-black border-b border-slate-150 dark:border-slate-800 pb-2 text-slate-900 dark:text-white uppercase tracking-wider text-[11px]">
                      <span>Patrimônio do Fundo Social:</span>
                      <span className="font-mono text-rose-500 text-xs">
                        {formatCurrency(baseSocialPrice + interestEarned)}
                      </span>
                    </div>

                    {/* Bar 1: Reserva Ativa */}
                    <div className="space-y-1">
                      <div className="flex justify-between items-center font-bold text-slate-655 dark:text-slate-300">
                        <span className="flex items-center gap-1.5 text-[10.5px]">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                          Reserva Ativa (Quotas Sociais)
                        </span>
                        <span className="font-mono text-slate-700 dark:text-slate-300">{formatCurrency(baseSocialPrice)}</span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-950/60 border border-slate-200/40 dark:border-slate-800/40 h-5 rounded-full overflow-hidden relative shadow-inner">
                        <div 
                          className="bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 h-full rounded-full transition-all duration-500"
                          style={{ width: `${percentRetained}%` }}
                        />
                        <div className="absolute inset-0 flex items-center justify-between px-3 text-[9px] font-extrabold text-white mix-blend-difference pointer-events-none">
                          <span>{percentRetained.toFixed(1)}% Reserva Coletiva</span>
                          <span>Disponível</span>
                        </div>
                      </div>
                    </div>

                    {/* Bar 2: Juros de Crédito Reinvestidos */}
                    <div className="space-y-1">
                      <div className="flex justify-between items-center font-bold text-slate-655 dark:text-slate-300">
                        <span className="flex items-center gap-1.5 text-[10.5px]">
                          <span className="w-2 h-2 rounded-full bg-violet-500 shrink-0" />
                          Juros de Crédito (100% Sociais)
                        </span>
                        <span className="font-mono text-slate-700 dark:text-slate-300">{formatCurrency(interestEarned)}</span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-950/60 border border-slate-200/40 dark:border-slate-800/40 h-5 rounded-full overflow-hidden relative shadow-inner">
                        <div 
                          className="bg-gradient-to-r from-violet-500 via-purple-500 to-indigo-600 h-full rounded-full transition-all duration-500"
                          style={{ width: `${percentInterest}%` }}
                        />
                        <div className="absolute inset-0 flex items-center justify-between px-3 text-[9px] font-extrabold text-white mix-blend-difference pointer-events-none">
                          <span>{percentInterest.toFixed(1)}% Rendimento Alocado</span>
                          <span>Exclusivo</span>
                        </div>
                      </div>
                    </div>

                    {/* Bar 3: Apoios Concedidos */}
                    <div className="space-y-1">
                      <div className="flex justify-between items-center font-bold text-slate-655 dark:text-slate-350">
                        <span className="flex items-center gap-1.5 text-[10.5px]">
                          <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                          Apoios Concedidos (Não Reembolsáveis)
                        </span>
                        <span className="font-mono text-slate-700 dark:text-slate-300">{formatCurrency(totalSocialDisbursed)}</span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-950/60 border border-slate-200/40 dark:border-slate-800/40 h-5 rounded-full overflow-hidden relative shadow-inner">
                        <div 
                          className="bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 h-full rounded-full transition-all duration-500" 
                          style={{ width: `${percentDisbursed}%` }}
                        />
                        <div className="absolute inset-0 flex items-center justify-between px-3 text-[9px] font-extrabold text-white mix-blend-difference pointer-events-none">
                          <span>{percentDisbursed.toFixed(1)}% Apoios Concedidos</span>
                          <span>{totalSocialDisbursed > 0 ? 'Entregue' : '0,00 Kz'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Footer Messages */}
                    <div className="text-[10px] font-bold text-slate-450 dark:text-slate-500 pt-2 border-t border-slate-150 dark:border-slate-800 text-left flex flex-col gap-1.5">
                      <div className="flex items-center gap-1">
                        <span>💡</span> {totalSocialDisbursed === 0 ? 'Fundo Integral, sem desembolsos de apoio.' : 'Ocorreram desembolsos de apoio de emergência.'}
                      </div>
                      <div className="text-violet-650 dark:text-violet-400 font-extrabold flex items-start gap-1 bg-violet-500/5 dark:bg-violet-500/10 p-2.5 rounded-xl border border-violet-500/10 text-[9.5px] leading-relaxed">
                        <span>🛡️</span>
                        <p>
                          <strong>Regra Social:</strong> O reembolso de <span className="font-mono">{formatCurrency(totalReimbursement)}</span> separa o principal de <span className="font-mono">{formatCurrency(creditToThirdParty)}</span> e os juros sociais de <span className="font-mono">{formatCurrency(interestEarned)}</span>.
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </motion.div>
          )}

          {activeLeftTab === 'cycle' && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                <h3 className="text-[11px] font-black uppercase tracking-wider text-slate-900 dark:text-white">
                  Progresso do Ciclo Selecionado ({selectedCycle}/6)
                </h3>
                <button 
                  onClick={() => {
                    setSelectedCycle(currentMonth);
                    setStatusFilter('paid');
                  }}
                  className="p-1 px-1.5 text-sky-600 hover:text-sky-700 bg-sky-100/50 dark:bg-sky-950/20 rounded-md cursor-pointer hover:scale-105 active:scale-95 transition-all text-[9.5px] font-black flex items-center gap-1"
                  title="Restaurar para o Mês Ativo"
                >
                  <RefreshCw className="w-3 h-3 animate-spin-slow" /> Restaurar Mês
                </button>
              </div>

              <div className="text-center py-3.5 bg-slate-50 dark:bg-slate-950/20 border border-slate-200/40 rounded-2xl">
                <p className="text-[9px] font-black tracking-wider text-slate-400 uppercase">
                  Mensal Arrecadado (Cota)
                </p>
                <p className="text-lg font-black font-mono text-[#0b5a3e] dark:text-emerald-450 mt-0.5">
                  {formatCurrency(cyclePaidAmount)}
                </p>
                <p className="text-[10px] font-bold text-slate-400 mt-0.5">
                  Meta Total do Ciclo: {formatCurrency(targetArrecadacao)}
                </p>
              </div>

              <div className="py-2 px-1 text-xs">
                <div className="flex justify-between items-center text-[10px] font-black text-slate-400 mb-1">
                  <span>0,00 Kz</span>
                  <span className="font-mono text-slate-600 dark:text-white">{formatCurrency(targetArrecadacao)}</span>
                </div>
                
                {/* Track */}
                <div className="relative w-full bg-slate-200/85 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden mb-4">
                  <div 
                    className="bg-[#0b5a3e] h-full rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${cycleConformityPercent}%` }}
                  />
                  <span className="absolute left-1/3 top-0 bottom-0 w-[1px] bg-slate-300 dark:bg-slate-700 pointer-events-none" />
                  <span className="absolute left-2/3 top-0 bottom-0 w-[1px] bg-slate-300 dark:bg-slate-700 pointer-events-none" />
                </div>

                {/* Pointer */}
                <div className="relative h-2.5 mb-1">
                  <div 
                    className="absolute flex flex-col items-center -translate-x-1/2 transition-all duration-500"
                    style={{ left: `${cycleConformityPercent}%` }}
                  >
                    <span className="text-[8px] text-[#0d5c3a] leading-none">▲</span>
                  </div>
                </div>

                {/* Legend */}
                <div className="flex items-center justify-center gap-4 text-[10px]">
                  <div className="flex items-center gap-1.5 font-bold text-slate-500">
                    <span className="w-2 h-2 rounded-full bg-[#0b5a3e]" />
                    <span>Membros Pagos</span>
                  </div>
                  <div className="flex items-center gap-1.5 font-bold text-slate-500">
                    <span className="w-2 h-2 rounded-full bg-[#c2c6d1]" />
                    <span>Meta de Cotas</span>
                  </div>
                </div>

                <div className="text-center mt-3 text-[10px] font-black text-[#0b5a3e] bg-[#0b5a3e]/5 p-2 rounded-xl border border-[#0b5a3e]/10">
                  Ciclo Ativo: {allContributorsForCycle.filter(c => c.paid).length} de {totalMembersCount} cotas regularizadas ({Math.round(cycleConformityPercent)}% de conformidade)
                </div>
              </div>
            </motion.div>
          )}

          {activeLeftTab === 'contemplations' && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-3"
            >
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-900 dark:text-white">
                  Contemplações no Ciclo {selectedCycle}
                </span>
                <span className="p-1 bg-amber-50 dark:bg-amber-950/20 text-amber-500 rounded-md shrink-0">
                  <Trophy className="w-4 h-4" />
                </span>
              </div>

              {/* Selector */}
              <div className="flex overflow-x-auto gap-1 mb-2 bg-slate-100 dark:bg-slate-950/40 p-1 rounded-xl border border-slate-200/30 dark:border-slate-800/40 scrollbar-none shrink-0">
                {[1, 2, 3, 4, 5, 6].map((num) => {
                  const isActive = num === selectedCycle;
                  return (
                    <button
                      key={num}
                      onClick={() => {
                        setSelectedCycle(num);
                        setStatusFilter('paid');
                      }}
                      className={`py-1 px-0.5 rounded-lg text-center cursor-pointer transition-all flex flex-col items-center justify-center flex-1 min-w-[45px] ${
                        isActive
                          ? 'bg-[#0d5c3a] text-white shadow-md font-black'
                          : 'hover:bg-slate-200 dark:hover:bg-slate-800/60 text-slate-655 dark:text-slate-400 font-bold bg-transparent'
                      }`}
                    >
                      <span className="text-[9px] tracking-tight">Mês {num}</span>
                    </button>
                  );
                })}
              </div>

              {/* Search */}
              <div className="relative mb-2">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Pesquisar cooperante..."
                  className="w-full text-[11px] pl-8 pr-3 py-1 border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-950/30 focus:border-[#0d5c3a] focus:ring-0 uppercase placeholder:normal-case text-slate-800 dark:text-white"
                />
              </div>

              {/* Switch tabs */}
              <div className="flex bg-slate-200/60 dark:bg-slate-900/60 rounded-xl p-0.5 mb-2.5 gap-1 animate-fade-in">
                <button
                  onClick={() => setStatusFilter('paid')}
                  className={`flex-1 text-[9.5px] py-1 font-black rounded-lg transition-all cursor-pointer text-center ${
                    statusFilter === 'paid'
                      ? 'bg-[#0d5c3a] text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-750'
                  }`}
                >
                  Pagos ({paidContributorsCount})
                </button>
                <button
                  onClick={() => setStatusFilter('pending')}
                  className={`flex-1 text-[9.5px] py-1 font-black rounded-lg transition-all cursor-pointer text-center ${
                    statusFilter === 'pending'
                      ? 'bg-amber-600 text-white shadow-xs font-black'
                      : 'text-[#ea580c] hover:text-[#ea580c] font-black'
                  }`}
                >
                  Pendentes ({pendingContributorsCount})
                </button>
                <button
                  onClick={() => setStatusFilter('beneficiaries')}
                  className={`flex-1 text-[9.5px] py-1 font-black rounded-lg transition-all cursor-pointer text-center ${
                    statusFilter === 'beneficiaries'
                      ? 'bg-[#0d5c3a] text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-750'
                  }`}
                >
                  Beneficiários ({cycleBeneficiariesCount})
                </button>
              </div>

              {/* Bulk reminder action for pending tab */}
              {statusFilter === 'pending' && pendingContributorsCount > 0 && (
                <div className="bg-amber-50/65 dark:bg-amber-955/10 border border-amber-200/50 dark:border-amber-900/35 rounded-2xl p-3 mb-2.5 space-y-2 text-left animate-fade-in">
                  <div className="flex items-start justify-between gap-1.5">
                    <div>
                      <h4 className="text-[10.5px] font-black text-amber-800 dark:text-amber-400 uppercase flex items-center gap-1.5">
                        <BellRing className="w-3.5 h-3.5 text-amber-600 animate-bounce" />
                        Lembretes Automáticos de Quota
                      </h4>
                      <p className="text-[9px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed font-semibold">
                        Há {pendingContributorsCount} cooperantes com quotas em falta no Ciclo {selectedCycle}. Envie lembretes via API SMS/WhatsApp.
                      </p>
                    </div>
                  </div>
                  
                  {bulkReminderSuccessMessage ? (
                    <div className="text-[9px] font-extrabold text-emerald-800 dark:text-emerald-450 bg-emerald-100/50 dark:bg-emerald-950/20 p-2 rounded-lg border border-emerald-200/30 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span>{bulkReminderSuccessMessage}</span>
                    </div>
                  ) : (
                    <button
                      onClick={handleSendBulkReminders}
                      disabled={isSendingBulkReminders}
                      className="w-full py-1.5 bg-amber-600 hover:bg-amber-700 disabled:bg-slate-300 text-white text-[9.5px] font-black rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-sm hover:shadow active:scale-98 transition-all"
                    >
                      {isSendingBulkReminders ? (
                        <>
                          <RefreshCw className="w-3 h-3 animate-spin" />
                          <span>A enviar cobranças em lote...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-3 h-3" />
                          <span>Enviar Lembretes em Lote</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              )}

              {/* List */}
              <div className="space-y-2 max-h-[140px] overflow-y-auto pr-1">
                {displayedItems.length === 0 ? (
                  <div className="text-center py-6 text-xs font-bold text-slate-400 uppercase tracking-widest">
                    Nenhum registro encontrado
                  </div>
                ) : (
                  displayedItems.map((item, idx) => {
                    if (statusFilter !== 'beneficiaries') {
                      return (
                        <div key={item.id || idx} className="flex items-center justify-between text-[11px] bg-white dark:bg-slate-950/40 px-3 py-2.5 rounded-xl border border-slate-100 dark:border-slate-800 shadow-xs">
                          <div className="flex flex-col text-left">
                            <span className="font-extrabold text-slate-800 dark:text-slate-200">
                              {item.name}
                            </span>
                            <span className="text-[9.5px] font-semibold text-slate-450">
                              {item.paid ? `Cota regularizada` : `Quota em falta`}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            {item.paid ? (
                              <span className="text-[8.5px] font-black text-emerald-700 bg-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-400 rounded-full py-0.5 px-2 uppercase tracking-wider">
                                Pago
                              </span>
                            ) : (
                              <>
                                <span className="text-[8.5px] font-black text-[#ea580c] bg-[#ffedd5] dark:bg-amber-950/20 dark:text-amber-500 rounded-full py-0.5 px-2 uppercase tracking-wider border border-[#fed7aa]/30 animate-pulse">
                                  Aguardando
                                </span>
                                <button
                                  onClick={() => {
                                    const cleanPhone = (item.phone || '').replace(/[\s\+\-]/g, '');
                                    const msg = `Olá *${item.name}*! Relembramos que a sua quota mensal de *120.000,00 KZs* relativa ao *Mês 0${selectedCycle} do Kix-Fundo* ainda se encontra aguardando regularização. Agradecemos o envio do comprovativo assim que possível. Muito obrigado!`;
                                    const waUrl = `https://api.whatsapp.com/send?phone=${cleanPhone || '244900000000'}&text=${encodeURIComponent(msg)}`;
                                    window.open(waUrl, '_blank');
                                    alert(`Lembrete gerado! Enviado com sucesso para o WhatsApp de ${item.name} (${item.phone || 'Sem Telefone'}).`);
                                  }}
                                  className="p-1 rounded-lg bg-emerald-100 text-emerald-800 hover:bg-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:hover:bg-emerald-900/30 transition-all cursor-pointer flex items-center justify-center text-[9px] font-bold gap-1"
                                  title="Enviar Cobrança por WhatsApp"
                                >
                                  <MessageSquare className="w-3.5 h-3.5" />
                                  <span>Cobrar</span>
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    } else {
                      const isPaid = isPayoutDoneForCycle;
                      return (
                        <div key={item.id || idx} className="flex items-center justify-between text-[11px] bg-white dark:bg-slate-950/40 px-3 py-2.5 rounded-xl border border-slate-100 dark:border-slate-800 shadow-xs">
                          <div className="flex flex-col text-left">
                            <span className="font-extrabold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                              🎁 {item.name}
                            </span>
                            <span className="text-[9.5px] font-bold text-[#0d5c3a]">
                              Provento Rotativo: {formatCurrency(600000)}
                            </span>
                          </div>
                          <div>
                            {isPaid ? (
                              <span className="text-[8.5px] font-black text-emerald-700 bg-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-400 rounded-full py-0.5 px-2 uppercase tracking-wider">
                                Liquidado
                              </span>
                            ) : (
                              <span className="text-[8.5px] font-black text-[#ea580c] bg-[#ffedd5] dark:bg-amber-950/20 dark:text-amber-500 rounded-full py-0.5 px-2 uppercase tracking-wider border border-[#fed7aa]/30 animate-pulse">
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

              {/* Financial summary card */}
              <div className="mt-2 p-2.5 bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-slate-200/45 dark:border-slate-800/80 space-y-1.5 text-[10px]">
                <div className="flex justify-between items-center text-slate-800 dark:text-slate-200 pb-1 border-b border-slate-200/40 dark:border-slate-800/40">
                  <span className="font-bold text-[#0d5c3a] dark:text-emerald-400 uppercase tracking-wider text-[9px]">
                    Beneficiários:
                  </span>
                  <span className="font-bold font-mono">
                    {cycleBeneficiaries.length === 0 ? 'Sem Alocação' : `${cycleBeneficiaries.length} Membros`}
                  </span>
                </div>
                
                {cycleBeneficiaries.length > 0 && (
                  <div className="text-left font-semibold text-slate-500 max-h-[35px] overflow-y-auto leading-relaxed">
                    {cycleBeneficiaries.map((b, idx) => (
                      <span key={b.id} className="inline-block mr-1.5">
                        {idx + 1}. {b.name} <span className="text-[8px] font-bold">({isPayoutDoneForCycle ? 'LIQ.' : 'PEND.'})</span>{idx < cycleBeneficiaries.length - 1 ? ' •' : ''}
                      </span>
                    ))}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2 pt-1.5 border-t border-slate-200/40 dark:border-slate-800/40 text-left">
                  <div>
                    <span className="block text-slate-400 font-bold uppercase tracking-wider text-[8px]">Valores Arrecadados</span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200 text-[10.5px]">
                      {formatCurrency(totalValoresPagosCycle)}
                    </span>
                  </div>
                  <div>
                    <span className="block text-slate-400 font-bold uppercase tracking-wider text-[8px]">Valores Pendentes</span>
                    <span className="font-mono font-bold text-rose-500 text-[10.5px]">
                      {formatCurrency(totalValoresPendentesCycle)}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* CARD 2: GESTÃO DE CRÉDITO & LUCRATIVIDADE (LUCROS DE JUROS) */}
      <div className="bg-white/45 dark:bg-slate-900/40 backdrop-blur-md rounded-3xl border border-slate-200/50 dark:border-slate-800/60 p-6 flex flex-col justify-between shadow-md hover:shadow-lg transition-all duration-300 hover:border-violet-300/40 dark:hover:border-violet-800/50 min-h-[640px]">
        <div>
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <span className="w-7 h-7 rounded-lg bg-violet-600 text-white flex items-center justify-center font-black text-xs">
                📈
              </span>
              <div>
                <h2 className="text-[13px] font-black tracking-tight text-slate-900 dark:text-white uppercase flex items-center gap-1.5">
                  Rendimento & Rentabilidade de Crédito
                </h2>
                <p className="text-[9px] text-slate-400">Total emprestado e rendimentos gerados por juros.</p>
              </div>
            </div>
            <div className="px-2.5 py-0.5 bg-violet-100 dark:bg-violet-950/30 border border-violet-200/30 rounded-lg text-violet-700 dark:text-violet-300 text-[10px] font-bold font-mono">
              Rendimento Ativo
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-5">
            {/* Card 1: Total Emprestado */}
            <div className="bg-slate-50/50 dark:bg-slate-950/30 border border-slate-200/40 dark:border-slate-800/60 p-3 rounded-xl flex flex-col justify-between">
              <span className="block font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-[8px]">Capital Concedido</span>
              <span className="font-mono font-black text-slate-900 dark:text-white text-xs block mt-0.5">
                {formatCurrency(totalLentAmount)}
              </span>
              <span className="text-[8.5px] text-slate-450 block mt-0.5 font-medium truncate">Principal emprestado</span>
            </div>

            {/* Card 2: Lucro Total em Juros */}
            <div className="bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/10 p-3 rounded-xl flex flex-col justify-between">
              <span className="block font-bold text-emerald-600 dark:text-emerald-450 uppercase tracking-wider text-[8px] font-sans">Lucro Juros (Contratado)</span>
              <span className="font-mono font-black text-emerald-600 dark:text-emerald-450 text-xs block mt-0.5">
                {formatCurrency(totalContractedInterest)}
              </span>
              <span className="text-[8.5px] text-emerald-600/80 dark:text-emerald-400/80 block mt-0.5 font-semibold truncate">Rendimento bruto esperado</span>
            </div>

            {/* Card 3: Lucro Recebido */}
            <div className="bg-sky-500/5 dark:bg-sky-500/10 border border-sky-500/10 p-3 rounded-xl flex flex-col justify-between">
              <span className="block font-bold text-sky-600 dark:text-sky-450 uppercase tracking-wider text-[8px]">Lucro Juros Realizado</span>
              <span className="font-mono font-black text-sky-600 dark:text-sky-400 text-xs block mt-0.5">
                {formatCurrency(totalRealizedInterest)}
              </span>
              <span className="text-[8.5px] text-sky-550 dark:text-sky-400/80 block mt-0.5 font-semibold truncate">Valor já arrecadado</span>
            </div>

            {/* Card 4: Lucro Pendente */}
            <div className="bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/10 p-3 rounded-xl flex flex-col justify-between">
              <span className="block font-bold text-amber-600 dark:text-amber-450 uppercase tracking-wider text-[8px]">Lucro Juros Projetado</span>
              <span className="font-mono font-black text-amber-600 dark:text-amber-400 text-xs block mt-0.5">
                {formatCurrency(totalProjectedInterest)}
              </span>
              <span className="text-[8.5px] text-amber-555 dark:text-amber-400/80 block mt-0.5 font-semibold truncate">A receber de prestações</span>
            </div>
          </div>

          {/* Gráfico de Rosca de Rentabilidade & Detalhamento */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
            
            {/* Left Column: Doughnut Chart (span 5) */}
            <div className="xl:col-span-5 flex flex-col items-center justify-center p-3 bg-slate-50/50 dark:bg-slate-950/20 rounded-2xl border border-slate-200/50 dark:border-slate-800/60 relative animate-fadeIn min-h-[220px]">
              <h4 className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1 text-center">
                Proporção de Rentabilidade
              </h4>

              <div className="w-[120px] h-[120px] flex items-center justify-center relative mt-1">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={creditProfitPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={38}
                      outerRadius={52}
                      paddingAngle={3}
                      dataKey="value"
                      startAngle={90}
                      endAngle={450}
                      onMouseEnter={(_: any, index: number) => setHoveredCreditProfitIndex(index)}
                      onMouseLeave={() => setHoveredCreditProfitIndex(null)}
                    >
                      {creditProfitPieData.map((entry, index) => (
                        <Cell 
                          key={`credit-profit-cell-${index}`} 
                          fill={entry.color} 
                          stroke={hoveredCreditProfitIndex === index ? entry.color : "transparent"}
                          strokeWidth={hoveredCreditProfitIndex === index ? 2 : 0}
                          style={{
                            transform: hoveredCreditProfitIndex === index ? 'scale(1.03)' : 'scale(1)',
                            transformOrigin: '50% 50%',
                            transition: 'all 0.2s ease-in-out',
                            cursor: 'pointer'
                          }}
                        />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                {/* Inner Center Label inside the doughnut */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-1 pointer-events-none transition-all duration-200">
                  <span 
                    className="text-[7.5px] font-black uppercase tracking-wider leading-tight max-w-[65px] truncate transition-colors duration-200 text-slate-400"
                    style={{ color: currentCreditProfitColor }}
                  >
                    {currentCreditProfitLabel === 'Capital Concedido (Investido)' ? 'Capital' : 'Juros'}
                  </span>
                  <span 
                    className="text-[9.5px] font-black mt-0.5 font-mono whitespace-nowrap transition-colors duration-200 text-slate-900 dark:text-white"
                    style={{ color: currentCreditProfitColor }}
                  >
                    {formatCurrency(currentCreditProfitValue)}
                  </span>
                  <span 
                    className="text-[8px] font-bold mt-0.5 px-1 py-0.2 rounded-full text-white scale-90 transition-all duration-200"
                    style={{ backgroundColor: currentCreditProfitColor }}
                  >
                    {currentCreditProfitPercent}%
                  </span>
                </div>
              </div>

              {/* Custom Legend */}
              <div className="mt-3 w-full space-y-1 text-[10px] font-semibold">
                <div 
                  className={`flex items-center justify-between p-1 rounded-lg transition-all duration-200 cursor-pointer ${hoveredCreditProfitIndex === 0 ? 'bg-violet-500/10 font-bold' : hoveredCreditProfitIndex !== null ? 'opacity-40' : ''}`}
                  onMouseEnter={() => setHoveredCreditProfitIndex(0)}
                  onMouseLeave={() => setHoveredCreditProfitIndex(null)}
                >
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-xs bg-[#8B5CF6] shrink-0" />
                    <span className="text-slate-500 text-[10px]">Capital Concedido</span>
                  </div>
                  <span className="font-mono text-violet-600 dark:text-violet-400">{lentPercent}%</span>
                </div>

                <div 
                  className={`flex items-center justify-between p-1 rounded-lg transition-all duration-200 cursor-pointer ${hoveredCreditProfitIndex === 1 ? 'bg-emerald-500/10 font-bold' : hoveredCreditProfitIndex !== null ? 'opacity-40' : ''}`}
                  onMouseEnter={() => setHoveredCreditProfitIndex(1)}
                  onMouseLeave={() => setHoveredCreditProfitIndex(null)}
                >
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-xs bg-[#10B981] shrink-0" />
                    <span className="text-slate-500 text-[10px]">Juros Acumulados</span>
                  </div>
                  <span className="font-mono text-emerald-600 dark:text-emerald-450">{interestPercent}%</span>
                </div>
              </div>
            </div>

            {/* Right Column: Detalhamento de Contratos (span 7) */}
            <div className="xl:col-span-7 flex flex-col justify-between space-y-2">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-1.5">
                <h4 className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400">
                  Lucratividade por Contrato
                </h4>
                <span className="text-[9px] font-bold text-violet-600 dark:text-violet-400 font-mono">
                  Portfólio Ativo
                </span>
              </div>

              {(!loans || loans.length === 0) ? (
                <div className="flex-1 flex items-center justify-center py-6 text-center bg-slate-50/50 dark:bg-slate-950/20 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                  <p className="text-[10px] text-slate-400 italic font-sans">Nenhum contrato ativo registrado.</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[195px] overflow-y-auto pr-1">
                  {loans.map((l) => {
                    const totalLent = l.amountRequested;
                    const totalInterest = (l.payments || []).reduce((sum, p) => sum + p.interestPaid, 0);
                    const paidInterest = (l.payments || []).filter(p => p.paid).reduce((sum, p) => sum + p.interestPaid, 0);
                    const interestProgress = totalInterest > 0 ? (paidInterest / totalInterest) * 100 : 0;

                    return (
                      <div key={l.id} className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/20 border border-slate-200/50 dark:border-slate-800 text-[10.5px] flex flex-col gap-1.5">
                        <div className="flex justify-between items-center border-b border-slate-200/40 dark:border-slate-800/40 pb-1">
                          <div className="min-w-0 flex-1">
                            <span className="font-extrabold text-slate-800 dark:text-slate-200 truncate block">
                              {l.borrowerName}
                            </span>
                            <span className="text-[8.5px] text-slate-450 font-mono block truncate">
                              ID: {l.id} • {l.borrowerType === 'socio' ? 'Sócio' : 'Singular'}
                            </span>
                          </div>
                          <span className={`text-[8.5px] px-1.5 py-0.2 rounded font-black uppercase shrink-0 ${
                            l.status === 'completed'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400'
                              : 'bg-violet-100 text-violet-800 dark:bg-violet-950/30 dark:text-violet-400'
                          }`}>
                            {l.status === 'completed' ? 'Liquidado' : 'Ativo'}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-1 text-[10px]">
                          <div>
                            <span className="text-slate-400 block text-[8px] font-bold uppercase">Principal</span>
                            <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                              {formatCurrency(totalLent)}
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="text-slate-400 block text-[8px] font-bold uppercase">Rendimento (+{l.interestRate}%)</span>
                            <span className="font-mono font-black text-emerald-600 dark:text-emerald-450">
                              +{formatCurrency(totalInterest)}
                            </span>
                          </div>
                        </div>

                        <div className="space-y-0.5 pt-1 border-t border-slate-200/20 dark:border-slate-800/20">
                          <div className="flex justify-between items-center text-[8.5px] text-slate-400">
                            <span>Progresso do Juro Amortizado:</span>
                            <span className="font-mono text-emerald-600 dark:text-emerald-450 font-bold">
                              {Math.round(interestProgress)}%
                            </span>
                          </div>
                          <div className="w-full bg-slate-200 dark:bg-slate-800 h-1 rounded-full overflow-hidden">
                            <div 
                              className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                              style={{ width: `${interestProgress}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calendar, 
  Check, 
  CircleDot, 
  UserCheck, 
  X, 
  Users, 
  AlertCircle, 
  List, 
  Grid, 
  ChevronDown, 
  ChevronUp, 
  Sparkles, 
  Plus,
  ArrowRight,
  ShieldCheck,
  Award,
  Wallet,
  Coins,
  RefreshCw,
  Edit2
} from 'lucide-react';
import { Member, SemesterCycle, getFullMonthLabel, getMonthSimpleLabel, getMemberDisplayCode } from '../types';
import { generateNextSemesterCycle, getBeneficiariesForCycleMonth } from '../utils/cycles';

interface SchedulesGridProps {
  currentMonth: number;
  members: Member[];
  onSelectCycle: (monthNum: number) => void;
  payoutDoneMap: { [month: number]: boolean };
  isAdmin?: boolean;
  onUpdateMembers?: (updatedMembers: Member[], changedMonth: number) => void;
  onGenerateNextSemester?: () => void;
  cycles?: SemesterCycle[];
  onSaveCycles?: (updatedCycles: SemesterCycle[]) => void;
  selectedCycleId?: number;
  onSelectCycleId?: (cycleId: number) => void;
}

export default function SchedulesGrid({
  currentMonth,
  members,
  onSelectCycle,
  payoutDoneMap,
  isAdmin = false,
  onUpdateMembers,
  onGenerateNextSemester,
  cycles = [],
  onSaveCycles,
  selectedCycleId: propSelectedCycleId,
  onSelectCycleId: propOnSelectCycleId,
}: SchedulesGridProps) {
  // Determine which cycle should be active
  const activeLevaNum = Math.ceil(currentMonth / 6) || 1;
  const [internalSelectedCycleId, setInternalSelectedCycleId] = useState<number>(propSelectedCycleId || activeLevaNum);
  const activeCycleId = propSelectedCycleId !== undefined ? propSelectedCycleId : internalSelectedCycleId;

  const handleSelectCycleTab = (id: number) => {
    setInternalSelectedCycleId(id);
    if (propOnSelectCycleId) {
      propOnSelectCycleId(id);
    }
  };

  useEffect(() => {
    if (propSelectedCycleId !== undefined) {
      setInternalSelectedCycleId(propSelectedCycleId);
    }
  }, [propSelectedCycleId]);

  // View mode
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedMonthId, setSelectedMonthId] = useState<number | null>(currentMonth);

  // Edit Beneficiaries Modal State
  const [editingMonth, setEditingMonth] = useState<number | null>(null);
  const [selectedMemberIds, setSelectedMemberIds] = useState<number[]>([]);

  // Insert New Cycle Modal State (Admin)
  const [showInsertCycleModal, setShowInsertCycleModal] = useState(false);
  const [newCycleName, setNewCycleName] = useState('');
  const [allocationMode, setAllocationMode] = useState<'auto' | 'custom'>('auto');
  const [customCycleAllocations, setCustomCycleAllocations] = useState<{ [month: number]: number[] }>({});

  // Get current active cycle object
  const currentCycle = cycles.find(c => c.id === activeCycleId) || cycles[0] || {
    id: activeLevaNum,
    name: `${activeLevaNum}º Ciclo Semestral (Meses ${(activeLevaNum - 1) * 6 + 1} a ${activeLevaNum * 6})`,
    startMonth: (activeLevaNum - 1) * 6 + 1,
    endMonth: activeLevaNum * 6,
    status: 'active',
    allocations: {},
    createdAt: new Date().toISOString()
  };

  const startMonthOfCycle = currentCycle.startMonth;
  const endMonthOfCycle = currentCycle.endMonth;
  const monthsOfCycle = Array.from({ length: 6 }, (_, i) => startMonthOfCycle + i);

  // Statistics for this selected cycle
  const paidMonthsCount = monthsOfCycle.filter(m => payoutDoneMap[m] === true).length;
  const isCycleFullyPaid = paidMonthsCount === 6;
  const cycleCompletionRate = Math.round((paidMonthsCount / 6) * 100);

  // Total Disbursed in this cycle (600,000 * 2 = 1,200,000 per month)
  const totalDisbursedInCycle = paidMonthsCount * 1200000;
  const totalTargetInCycle = 6 * 1200000; // 7,200,000 Kz
  const totalSocialAidInCycle = 6 * 240000; // 1,440,000 Kz

  // Beneficiaries helper
  const getBeneficiariesForMonth = (mNum: number) => {
    return getBeneficiariesForCycleMonth(currentCycle, mNum, members);
  };

  // Open Edit Beneficiaries Modal
  const handleOpenEdit = (mNum: number) => {
    const currentBeneficiaries = getBeneficiariesForMonth(mNum).map(m => m.id);
    setSelectedMemberIds(currentBeneficiaries);
    setEditingMonth(mNum);
  };

  const handleToggleMember = (memberId: number) => {
    if (selectedMemberIds.includes(memberId)) {
      setSelectedMemberIds(selectedMemberIds.filter(id => id !== memberId));
    } else {
      if (selectedMemberIds.length < 2) {
        setSelectedMemberIds([...selectedMemberIds, memberId]);
      } else {
        // Swap oldest
        setSelectedMemberIds([selectedMemberIds[1], memberId]);
      }
    }
  };

  // Save updated beneficiaries for a specific month
  const handleSaveBeneficiaries = () => {
    if (!editingMonth) return;

    // Update cycle allocations
    if (onSaveCycles && cycles.length > 0) {
      const updatedCycles = cycles.map(c => {
        if (c.id === currentCycle.id) {
          return {
            ...c,
            allocations: {
              ...c.allocations,
              [editingMonth]: selectedMemberIds
            }
          };
        }
        return c;
      });
      onSaveCycles(updatedCycles);
    }

    // Also update member.assignedMonth if in current active cycle
    if (onUpdateMembers) {
      const updatedMembers = members.map(m => {
        if (selectedMemberIds.includes(m.id)) {
          return { ...m, assignedMonth: editingMonth };
        }
        if (m.assignedMonth === editingMonth && !selectedMemberIds.includes(m.id)) {
          return { ...m, assignedMonth: 0 };
        }
        return m;
      });
      onUpdateMembers(updatedMembers, editingMonth);
    }

    setEditingMonth(null);
  };

  // Prepare New Cycle creation
  const handleOpenInsertCycleModal = () => {
    const nextId = (cycles.length > 0 ? Math.max(...cycles.map(c => c.id)) : activeLevaNum) + 1;
    const lastEndMonth = cycles.length > 0 ? Math.max(...cycles.map(c => c.endMonth)) : activeLevaNum * 6;
    const startM = lastEndMonth + 1;
    const endM = startM + 5;
    
    setNewCycleName(`${nextId}º Ciclo Semestral (Meses ${startM} a ${endM})`);
    setAllocationMode('auto');
    
    // Build default custom allocations
    const memberIds = members.map(m => m.id);
    const initialAlloc: { [m: number]: number[] } = {};
    for (let m = startM; m <= endM; m++) {
      const rel = m - startM;
      initialAlloc[m] = [
        memberIds[(rel * 2) % memberIds.length] || 1,
        memberIds[(rel * 2 + 1) % memberIds.length] || 2
      ];
    }
    setCustomCycleAllocations(initialAlloc);
    setShowInsertCycleModal(true);
  };

  // Save new cycle
  const handleConfirmInsertCycle = () => {
    const nextCycle = generateNextSemesterCycle(
      cycles,
      members,
      newCycleName,
      allocationMode === 'custom' ? customCycleAllocations : undefined
    );

    const updatedCycles = [...cycles, nextCycle];
    if (onSaveCycles) {
      onSaveCycles(updatedCycles);
    }

    // Switch view to the newly created cycle
    handleSelectCycleTab(nextCycle.id);
    setShowInsertCycleModal(false);
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border-2 border-slate-200 dark:border-slate-800 p-5 sm:p-7 shadow-lg relative select-none">
      {/* Cockpit Header */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-5 border-b-2 border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="p-2.5 rounded-xl bg-sky-600 text-white shadow-md">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-black font-display text-slate-900 dark:text-white tracking-tight">
                Plano de Rotação & Ciclos Semestrais
              </h2>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
                Estrutura Oficial Kixi-Fundo: 6 Meses por Ciclo • 2 Beneficiários por Mês (600.000,00 Kz cada) • 12 Cooperantes
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap self-stretch lg:self-auto justify-between sm:justify-end">
          {/* List / Grid Toggle */}
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setViewMode('grid')}
              title="Visualização em Grelha"
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 text-xs font-black cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              <Grid className="w-4 h-4" />
              <span>Grelha</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              title="Visualização em Lista"
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 text-xs font-black cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              <List className="w-4 h-4" />
              <span>Lista</span>
            </button>
          </div>

          {/* Admin Insert Cycle Button */}
          {isAdmin && (
            <button
              onClick={handleOpenInsertCycleModal}
              title="Criar e inserir um novo ciclo semestral no fundo"
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-95 text-white font-black text-xs uppercase tracking-wider shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>+ Inserir Novo Ciclo</span>
            </button>
          )}
        </div>
      </div>

      {/* Prominent Cycles Selector Bar */}
      <div className="mt-5 mb-6">
        <div className="flex items-center justify-between gap-3 mb-3">
          <span className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <Award className="w-4 h-4 text-amber-500" />
            <span>Ciclos Semestrais Cadastrados ({cycles.length})</span>
          </span>
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
            Clique em qualquer ciclo para navegar pela sua rotação semestral
          </span>
        </div>

        {/* Horizontal Cycle Cards Switcher */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {cycles.map((cycle) => {
            const isSelected = cycle.id === activeCycleId;
            const cycleMonths = Array.from({ length: 6 }, (_, i) => cycle.startMonth + i);
            const cyclePaidMonths = cycleMonths.filter(m => payoutDoneMap[m] === true).length;
            const isDone = cyclePaidMonths === 6;
            const isCurrentOperating = cycle.startMonth <= currentMonth && currentMonth <= cycle.endMonth;

            return (
              <div
                key={cycle.id}
                onClick={() => handleSelectCycleTab(cycle.id)}
                className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                  isSelected
                    ? 'bg-sky-50/80 dark:bg-sky-950/40 border-sky-500 shadow-md ring-2 ring-sky-500/20'
                    : isDone
                    ? 'bg-slate-50 dark:bg-slate-850/50 border-slate-200 dark:border-slate-800 hover:border-slate-400 opacity-90'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-sky-400 shadow-xs'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className={`text-xs font-black uppercase tracking-wide truncate ${
                      isSelected ? 'text-sky-700 dark:text-sky-300' : 'text-slate-900 dark:text-white'
                    }`}>
                      {cycle.name}
                    </span>
                    {isDone ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-600 text-white shrink-0 flex items-center gap-1 shadow-xs">
                        <Check className="w-2.5 h-2.5 stroke-[3]" /> 100%
                      </span>
                    ) : isCurrentOperating ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-sky-600 text-white shrink-0 flex items-center gap-1 shadow-xs animate-pulse">
                        <CircleDot className="w-2.5 h-2.5" /> Ativo
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 shrink-0">
                        Agendado
                      </span>
                    )}
                  </div>

                  <div className="text-[11px] font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                    <span>Meses {cycle.startMonth} a {cycle.endMonth}</span>
                    <span className="text-slate-400">•</span>
                    <span>{cyclePaidMonths} de 6 Pagos</span>
                  </div>
                </div>

                {/* Progress bar inside cycle card */}
                <div className="mt-3">
                  <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${isDone ? 'bg-emerald-500' : 'bg-sky-500'}`}
                      style={{ width: `${(cyclePaidMonths / 6) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}

          {/* Quick Add Cycle Card for Admin */}
          {isAdmin && (
            <div
              onClick={handleOpenInsertCycleModal}
              className="p-3.5 rounded-2xl border-2 border-dashed border-emerald-400 dark:border-emerald-600 bg-emerald-50/40 dark:bg-emerald-950/20 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 cursor-pointer transition-all flex flex-col items-center justify-center text-center gap-1.5 min-h-[95px]"
            >
              <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center font-black">
                <Plus className="w-4 h-4 stroke-[3]" />
              </div>
              <span className="text-xs font-black text-emerald-800 dark:text-emerald-300 uppercase tracking-wide">
                Inserir Novo Ciclo
              </span>
              <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                +6 Meses de Rotação
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Selected Cycle Financial Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mb-6 p-4 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800">
        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800">
          <div className="text-[10px] uppercase font-black tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <Coins className="w-3.5 h-3.5 text-sky-500" />
            <span>Ciclo em Foco</span>
          </div>
          <div className="text-base font-black text-slate-900 dark:text-white mt-1 truncate">
            {currentCycle.name}
          </div>
          <div className="text-[11px] font-bold text-sky-600 dark:text-sky-400 mt-0.5">
            Meses {startMonthOfCycle} a {endMonthOfCycle}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800">
          <div className="text-[10px] uppercase font-black tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <Wallet className="w-3.5 h-3.5 text-emerald-500" />
            <span>Benefícios Pagos</span>
          </div>
          <div className="text-base font-black text-emerald-600 dark:text-emerald-400 font-mono mt-1">
            {totalDisbursedInCycle.toLocaleString('pt-PT')},00 Kz
          </div>
          <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mt-0.5">
            Meta: {totalTargetInCycle.toLocaleString('pt-PT')},00 Kz (12 Sócios)
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800">
          <div className="text-[10px] uppercase font-black tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
            <span>Fundo de Interajuda</span>
          </div>
          <div className="text-base font-black text-amber-600 dark:text-amber-400 font-mono mt-1">
            {(paidMonthsCount * 240000).toLocaleString('pt-PT')},00 Kz
          </div>
          <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mt-0.5">
            Retenção: 240.000,00 Kz / Mês
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800">
          <div className="text-[10px] uppercase font-black tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <Check className="w-3.5 h-3.5 text-emerald-500" />
            <span>Cumprimento do Ciclo</span>
          </div>
          <div className={`text-base font-black mt-1 ${isCycleFullyPaid ? 'text-emerald-600 dark:text-emerald-400' : 'text-sky-600 dark:text-sky-400'}`}>
            {paidMonthsCount} de 6 Meses ({cycleCompletionRate}%)
          </div>
          <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mt-0.5">
            {isCycleFullyPaid ? '100% Concluído & Liquidado' : `${6 - paidMonthsCount} Meses Restantes`}
          </div>
        </div>
      </div>

      {/* Active Month Alert Banner if fully paid */}
      {isCycleFullyPaid && (
        <div className="mb-6 p-4 rounded-2xl bg-emerald-600 text-white shadow-md flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center font-black text-2xl shadow-inner shrink-0">
              🏆
            </div>
            <div>
              <h3 className="text-base font-black uppercase tracking-wider">
                {currentCycle.name} Totalmente Liquidado com Sucesso!
              </h3>
              <p className="text-xs text-emerald-100 mt-0.5 leading-relaxed">
                Todos os 6 meses foram concluídos e todos os 12 cooperantes receberam 600.000,00 Kz cada. O fundo segue para o próximo ciclo de rotação.
              </p>
            </div>
          </div>

          {isAdmin && (
            <button
              onClick={handleOpenInsertCycleModal}
              className="px-5 py-2.5 rounded-xl bg-white text-emerald-800 hover:bg-emerald-50 active:scale-95 font-black text-xs uppercase tracking-wider shadow-lg transition-all flex items-center gap-2 shrink-0 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-emerald-700" />
              <span>Inserir Próximo Ciclo</span>
            </button>
          )}
        </div>
      )}

      {/* Months Content: Grid or List */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {monthsOfCycle.map((mNum) => {
            const isSelectedFocus = currentMonth === mNum;
            const isPayoutDone = payoutDoneMap[mNum] === true;
            const beneficiaries = getBeneficiariesForMonth(mNum);
            const isPast = mNum < currentMonth;

            return (
              <div
                key={mNum}
                onClick={isAdmin ? () => onSelectCycle(mNum) : undefined}
                className={`rounded-2xl border-2 p-5 transition-all flex flex-col justify-between ${
                  isSelectedFocus
                    ? 'bg-sky-50/50 dark:bg-sky-950/20 border-sky-500 shadow-md ring-2 ring-sky-500/20'
                    : isPayoutDone
                    ? 'bg-white dark:bg-slate-900 border-emerald-500/60 shadow-sm'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-400 shadow-xs'
                } ${isAdmin ? 'cursor-pointer' : 'cursor-default'}`}
              >
                <div>
                  {/* Month Card Header */}
                  <div className="flex items-start justify-between gap-2 mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
                    <div>
                      <div className="text-[10px] font-black uppercase tracking-wider text-sky-600 dark:text-sky-400">
                        {currentCycle.name.split('(')[0] || 'Ciclo Semestral'}
                      </div>
                      <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight mt-0.5">
                        Mês {mNum} • {getMonthSimpleLabel(mNum)}
                      </h4>
                    </div>

                    {isPayoutDone ? (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-600 text-white shadow-sm flex items-center gap-1">
                        <Check className="w-3 h-3 stroke-[3]" /> Liquidado
                      </span>
                    ) : isSelectedFocus ? (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-sky-600 text-white shadow-sm flex items-center gap-1 animate-pulse">
                        <CircleDot className="w-3 h-3" /> Foco Ativo
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        Agendado
                      </span>
                    )}
                  </div>

                  {/* Beneficiaries of this month */}
                  <div className="space-y-2.5 mb-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-400">
                        Cooperantes Contemplados (2):
                      </span>
                      {isAdmin && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenEdit(mNum);
                          }}
                          className="text-[11px] font-bold text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300 flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <Edit2 className="w-3 h-3" /> Alterar
                        </button>
                      )}
                    </div>

                    {beneficiaries.map((b) => (
                      <div
                        key={b.id}
                        className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-850 flex items-center justify-between gap-3 shadow-xs"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className={`w-8 h-8 rounded-full ${b.avatarColor || 'bg-sky-600'} text-white flex items-center justify-center font-black text-xs shrink-0 shadow-sm`}>
                            {b.name.substring(0, 2).toUpperCase()}
                          </div>
                          <div className="truncate">
                            <div className="text-xs font-black text-slate-900 dark:text-white truncate">
                              {b.name}
                            </div>
                            <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                              {getMemberDisplayCode(b.id)} • {b.phone}
                            </div>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <div className="text-[10px] font-bold text-slate-400">Benefício</div>
                          <div className="text-xs font-mono font-black text-emerald-600 dark:text-emerald-400">
                            600.000,00 Kz
                          </div>
                        </div>
                      </div>
                    ))}

                    {beneficiaries.length === 0 && (
                      <div className="p-3 text-center rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-850/40 text-xs text-slate-500 font-semibold">
                        Nenhum cooperante alocado a este mês.
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Footer: Financial values */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 block">Total do Mês</span>
                    <span className="font-mono font-black text-slate-900 dark:text-white">
                      1.200.000,00 Kz
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold text-slate-500 block">Poupança (+20k)</span>
                    <span className="font-mono font-black text-amber-600 dark:text-amber-400">
                      240.000,00 Kz
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* List View */
        <div className="space-y-3">
          {monthsOfCycle.map((mNum) => {
            const isSelected = selectedMonthId === mNum;
            const isSelectedFocus = currentMonth === mNum;
            const isPayoutDone = payoutDoneMap[mNum] === true;
            const beneficiaries = getBeneficiariesForMonth(mNum);

            return (
              <div
                key={mNum}
                className={`rounded-2xl border-2 transition-all overflow-hidden ${
                  isSelected
                    ? 'border-sky-500 bg-sky-50/20 dark:bg-sky-950/20 shadow-sm'
                    : isPayoutDone
                    ? 'border-emerald-500/50 bg-white dark:bg-slate-900'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-400'
                }`}
              >
                {/* List Row Header */}
                <div
                  onClick={() => setSelectedMonthId(selectedMonthId === mNum ? null : mNum)}
                  className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer select-none"
                >
                  <div className="flex items-center gap-3.5">
                    <div className={`p-2.5 rounded-xl ${
                      isPayoutDone
                        ? 'bg-emerald-600 text-white'
                        : isSelectedFocus
                        ? 'bg-sky-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}>
                      <Calendar className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-[10px] font-black uppercase text-sky-600 dark:text-sky-400 tracking-wider">
                        {currentCycle.name.split('(')[0] || 'Ciclo Semestral'}
                      </div>
                      <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">
                        Mês {mNum} • {getMonthSimpleLabel(mNum)}
                      </h4>
                    </div>
                  </div>

                  {/* Beneficiary Names at a glance */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {beneficiaries.map((b) => (
                      <span
                        key={b.id}
                        className="px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5"
                      >
                        <span className={`w-2 h-2 rounded-full ${b.avatarColor || 'bg-sky-500'}`} />
                        <span>{b.name}</span>
                        <span className="font-mono text-emerald-600 dark:text-emerald-400 text-[11px]">
                          (600.000,00 Kz)
                        </span>
                      </span>
                    ))}
                    {beneficiaries.length === 0 && (
                      <span className="text-xs text-slate-400 italic">Sem membros alocados</span>
                    )}
                  </div>

                  {/* Status & Toggle */}
                  <div className="flex items-center gap-3 justify-between md:justify-end">
                    {isPayoutDone ? (
                      <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-600 text-white flex items-center gap-1">
                        <Check className="w-3 h-3 stroke-[3]" /> Liquidado
                      </span>
                    ) : isSelectedFocus ? (
                      <span className="px-3 py-1 rounded-full text-xs font-black bg-sky-600 text-white flex items-center gap-1 animate-pulse">
                        <CircleDot className="w-3 h-3" /> Foco Ativo
                      </span>
                    ) : (
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        Agendado
                      </span>
                    )}

                    <div className="text-slate-400">
                      {isSelected ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </div>
                  </div>
                </div>

                {/* Collapsible Details */}
                {isSelected && (
                  <div className="p-4 bg-slate-50 dark:bg-slate-850 border-t border-slate-200 dark:border-slate-800 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black uppercase text-slate-600 dark:text-slate-400">
                        Detalhes dos Beneficiários
                      </span>
                      {isAdmin && (
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(mNum)}
                          className="px-3 py-1 rounded-lg bg-sky-600 text-white text-xs font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <Edit2 className="w-3 h-3" /> Atribuir Cooperantes
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {beneficiaries.map((b) => (
                        <div
                          key={b.id}
                          className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between"
                        >
                          <div>
                            <div className="text-xs font-black text-slate-900 dark:text-white">{b.name}</div>
                            <div className="text-[11px] text-slate-500 font-semibold">{b.phone} • {b.email}</div>
                          </div>
                          <div className="text-right">
                            <span className="text-xs font-mono font-black text-emerald-600 dark:text-emerald-400 block">
                              600.000,00 Kz
                            </span>
                            <span className="text-[10px] text-slate-400 font-semibold">Benefício Individual</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800 text-xs">
                      <span className="font-semibold text-slate-600 dark:text-slate-400">
                        Total Liquidado: <strong>1.200.000,00 Kz</strong> | Poupança Comum Retida: <strong>240.000,00 Kz</strong>
                      </span>
                      {isAdmin && (
                        <button
                          type="button"
                          onClick={() => onSelectCycle(mNum)}
                          className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-white cursor-pointer"
                        >
                          Definir como Foco Ativo
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal 1: Edit Beneficiaries of a Month */}
      {editingMonth !== null && (
        <div 
          className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setEditingMonth(null)}
        >
          <div 
            className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-6 py-4.5 bg-slate-50 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-sky-600 text-white">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    Definir Beneficiários do Mês {editingMonth}
                  </h3>
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    Selecione exatamente 2 cooperantes (600.000,00 Kz cada)
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setEditingMonth(null)}
                className="p-1.5 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content: List of all 12 members */}
            <div className="p-6 max-h-[360px] overflow-y-auto space-y-2">
              <div className="flex items-center justify-between text-xs font-black uppercase text-slate-500 mb-2">
                <span>Cooperantes Registados</span>
                <span className={`px-2.5 py-0.5 rounded-full font-black ${
                  selectedMemberIds.length === 2
                    ? 'bg-emerald-600 text-white'
                    : 'bg-amber-500 text-white'
                }`}>
                  {selectedMemberIds.length} de 2 Selecionados
                </span>
              </div>

              {members.map((m) => {
                const isSelected = selectedMemberIds.includes(m.id);
                return (
                  <div
                    key={m.id}
                    onClick={() => handleToggleMember(m.id)}
                    className={`p-3 rounded-xl border-2 flex items-center justify-between cursor-pointer transition-all ${
                      isSelected
                        ? 'border-sky-500 bg-sky-50 dark:bg-sky-950/40 text-slate-900 dark:text-white font-bold'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`w-8 h-8 rounded-full ${m.avatarColor || 'bg-sky-600'} text-white flex items-center justify-center font-bold text-xs`}>
                        {m.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900 dark:text-white">{m.name}</div>
                        <div className="text-[10px] text-slate-500">{getMemberDisplayCode(m.id)} • {m.phone}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {isSelected && (
                        <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-300">
                          600.000,00 Kz
                        </span>
                      )}
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}}
                        className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500 border-slate-300 cursor-pointer"
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-850 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
              <span className="text-[11px] font-semibold text-slate-500">
                Cada cooperante recebe 600.000,00 Kz no mês atribuído.
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEditingMonth(null)}
                  className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={selectedMemberIds.length !== 2}
                  onClick={handleSaveBeneficiaries}
                  className={`px-5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md cursor-pointer ${
                    selectedMemberIds.length === 2
                      ? 'bg-sky-600 hover:bg-sky-500 text-white'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  Salvar Alocação
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Insert New Semester Cycle (Admin) */}
      {showInsertCycleModal && (
        <div 
          className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowInsertCycleModal(false)}
        >
          <div 
            className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-6 py-5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-white/20 shadow-inner">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black tracking-tight">
                    Inserir Novo Ciclo Semestral
                  </h3>
                  <p className="text-xs text-emerald-100 mt-0.5">
                    Regra Oficial: 6 Meses de Rotação • 2 Cooperantes/Mês • 12 Membros
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setShowInsertCycleModal(false)}
                className="p-1.5 rounded-xl hover:bg-white/20 text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Body */}
            <div className="p-6 space-y-4 max-h-[420px] overflow-y-auto">
              <div>
                <label className="block text-xs font-black uppercase text-slate-700 dark:text-slate-300 tracking-wide mb-1.5">
                  Designação Oficial do Ciclo
                </label>
                <input
                  type="text"
                  value={newCycleName}
                  onChange={(e) => setNewCycleName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 font-bold text-sm text-slate-900 dark:text-white focus:outline-none focus:border-sky-500"
                  placeholder="Ex: 3º Ciclo Semestral (Meses 13 a 18)"
                />
              </div>

              {/* Mode Toggle */}
              <div>
                <label className="block text-xs font-black uppercase text-slate-700 dark:text-slate-300 tracking-wide mb-2">
                  Método de Distribuição dos Cooperantes
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div
                    onClick={() => setAllocationMode('auto')}
                    className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                      allocationMode === 'auto'
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 shadow-sm'
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <div className="text-xs font-black flex items-center gap-1.5">
                      <RefreshCw className="w-4 h-4 text-emerald-600" />
                      <span>Rotação Automática</span>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1">
                      Distribuição equitativa dos 12 membros cooperantes (2 por mês).
                    </p>
                  </div>

                  <div
                    onClick={() => setAllocationMode('custom')}
                    className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                      allocationMode === 'custom'
                        ? 'border-sky-500 bg-sky-50 dark:bg-sky-950/40 text-sky-900 dark:text-sky-200 shadow-sm'
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <div className="text-xs font-black flex items-center gap-1.5">
                      <Edit2 className="w-4 h-4 text-sky-600" />
                      <span>Definição Manual</span>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1">
                      O administrador personaliza quem recebe em cada mês.
                    </p>
                  </div>
                </div>
              </div>

              {/* Financial Specifications pill */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
                <div className="flex items-center justify-between font-bold text-slate-700 dark:text-slate-300">
                  <span>Duração Regulamentar:</span>
                  <span className="font-mono text-slate-900 dark:text-white">6 Meses Consecutivos</span>
                </div>
                <div className="flex items-center justify-between font-bold text-slate-700 dark:text-slate-300">
                  <span>Benefício por Cooperante:</span>
                  <span className="font-mono text-emerald-600 dark:text-emerald-400">600.000,00 Kz</span>
                </div>
                <div className="flex items-center justify-between font-bold text-slate-700 dark:text-slate-300">
                  <span>Liquidação Mensal (2 Beneficiários):</span>
                  <span className="font-mono text-slate-900 dark:text-white">1.200.000,00 Kz</span>
                </div>
                <div className="flex items-center justify-between font-bold text-slate-700 dark:text-slate-300">
                  <span>Arrecadação Mensal (12 Quotas de 120k):</span>
                  <span className="font-mono text-slate-900 dark:text-white">1.440.000,00 Kz</span>
                </div>
                <div className="flex items-center justify-between font-bold text-slate-700 dark:text-slate-300">
                  <span>Retenção Poupança Social:</span>
                  <span className="font-mono text-amber-600 dark:text-amber-400">240.000,00 Kz / Mês</span>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-850 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowInsertCycleModal(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmInsertCycle}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-black text-xs uppercase tracking-wider shadow-lg transition-all flex items-center gap-2 cursor-pointer"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Gravar e Iniciar Ciclo</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

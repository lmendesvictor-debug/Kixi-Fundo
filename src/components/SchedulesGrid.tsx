import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Calendar, Check, CircleDot, ArrowRight, UserCheck, X, Users, AlertCircle } from 'lucide-react';
import { Member, getFullMonthLabel } from '../types';

interface SchedulesGridProps {
  currentMonth: number;
  members: Member[];
  onSelectCycle: (monthNum: number) => void;
  payoutDoneMap: { [month: number]: boolean };
  isAdmin?: boolean;
  onUpdateMembers?: (updatedMembers: Member[], changedMonth: number) => void;
}

export default function SchedulesGrid({
  currentMonth,
  members,
  onSelectCycle,
  payoutDoneMap,
  isAdmin = false,
  onUpdateMembers,
}: SchedulesGridProps) {
  const [editingMonth, setEditingMonth] = useState<number | null>(null);
  const [selectedMemberIds, setSelectedMemberIds] = useState<number[]>([]);

  const initialLeva = Math.ceil(currentMonth / 6) || 1;
  const [selectedLeva, setSelectedLeva] = useState<number>(initialLeva);

  useEffect(() => {
    const currentLevaNum = Math.ceil(currentMonth / 6) || 1;
    setSelectedLeva(currentLevaNum);
  }, [currentMonth]);

  // Group members by their assignedMonth (current leva's 6 months)
  const startMonthOfLeva = (selectedLeva - 1) * 6 + 1;
  const months = Array.from({ length: 6 }, (_, i) => startMonthOfLeva + i);

  const getBeneficiariesForMonth = (mNum: number) => {
    return members.filter((m) => m.assignedMonth === mNum);
  };

  const getMonthName = (mNum: number) => {
    return getFullMonthLabel(mNum);
  };

  // Open modal pre-filling existing assigned members
  const handleOpenEdit = (mNum: number) => {
    const currentBeneficiaries = members.filter(m => m.assignedMonth === mNum).map(m => m.id);
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
        // Queue/swap behavior (keeps selection to 2 by dropping oldest)
        setSelectedMemberIds([selectedMemberIds[1], memberId]);
      }
    }
  };

  const handleSaveBeneficiaries = () => {
    if (!editingMonth || !onUpdateMembers) return;
    
    // Create new array with updated month assignments
    const updatedMembers = members.map(m => {
      // If the member is newly selected for this month
      if (selectedMemberIds.includes(m.id)) {
        return { ...m, assignedMonth: editingMonth };
      }
      // If the member was previously in this month but is no longer selected
      if (m.assignedMonth === editingMonth && !selectedMemberIds.includes(m.id)) {
        // Set to 0 or null (unassigned) - they will need to be reassigned elsewhere
        return { ...m, assignedMonth: 0 };
      }
      return m;
    });

    onUpdateMembers(updatedMembers, editingMonth);
    setEditingMonth(null);
  };

  return (
    <div className="bg-white dark:bg-slate-900/60 rounded-2xl border border-slate-100 dark:border-slate-800/80 p-6 shadow-custom">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-5">
        <div>
          <h2 className="text-lg font-bold font-display text-slate-800 dark:text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-teal-600 dark:text-teal-400" />
            Plano de Escalonamento e Rotação (Ciclos de 6 Meses)
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

      {/* Leva / Batch Switcher Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-100 dark:border-slate-800/60">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSelectedLeva(prev => Math.max(1, prev - 1))}
            disabled={selectedLeva === 1}
            className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-850 disabled:opacity-40 disabled:hover:bg-transparent text-slate-700 dark:text-slate-300 text-xs font-black transition-all cursor-pointer disabled:cursor-not-allowed"
          >
            ← Leva Anterior
          </button>
          <span className="text-xs font-black bg-teal-500/10 text-teal-700 dark:text-teal-350 px-3 py-1.5 rounded-lg border border-teal-500/10">
            Leva {selectedLeva} de 6 Ciclos
          </span>
          <button
            onClick={() => setSelectedLeva(prev => prev + 1)}
            className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-700 dark:text-slate-300 text-xs font-black transition-all cursor-pointer"
          >
            Próxima Leva →
          </button>
        </div>
        
        <span className="text-[11px] text-slate-400 font-semibold italic">
          Cada leva compreende 6 meses de distribuição rotativa, começando em Março de 2026.
        </span>
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
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-slate-400 dark:text-slate-400 block font-medium">Beneficiários do Ciclo:</span>
                    {isAdmin && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenEdit(mNum);
                        }}
                        className="text-[10.5px] font-bold text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <UserCheck className="w-3 h-3" /> Alterar
                      </button>
                    )}
                  </div>
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
                  {beneficiaries.length === 0 && (
                    <div className="text-[11px] text-slate-400 dark:text-slate-500 italic py-2 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-lg">
                      Nenhum beneficiário alocado.
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4.5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
                <div className="flex flex-col">
                  <span className="text-slate-400 dark:text-slate-400 font-medium font-sans">Retorno Total</span>
                  <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{beneficiaries.length * 600000 === 0 ? "0,00" : (beneficiaries.length * 600000).toLocaleString('pt-PT') + ",00"} KZs</span>
                </div>
                <div className="flex flex-col text-right">
                  <span className="text-slate-400 dark:text-slate-400 font-medium font-sans">Fundo de Apoio (+20k)</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-slate-100">{beneficiaries.length * 20000 * 6 === 0 ? "240.000,00 KZs" : (beneficiaries.length * 20000 * 6).toLocaleString('pt-PT') + ",00 KZs"}</span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Edit Beneficiaries Modal */}
      {editingMonth !== null && (
        <div 
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setEditingMonth(null)}
        >
          <div 
            className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between bg-slate-50 dark:bg-slate-900/40">
              <div className="flex items-center gap-2.5">
                <Users className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                <div>
                  <h3 className="text-base font-bold text-slate-800 dark:text-white font-display">
                    Atribuir Ciclo de Pagamento
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Definir beneficiários para o <strong>{getMonthName(editingMonth)}</strong>
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setEditingMonth(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 max-h-[350px] overflow-y-auto space-y-3">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400 px-1">
                <span>Membros Disponíveis</span>
                <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${selectedMemberIds.length === 2 ? 'bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 border border-teal-200/55' : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700'}`}>
                  {selectedMemberIds.length} de 2 Selecionados
                </span>
              </div>

              <div className="space-y-2">
                {members.map((m) => {
                  const isChecked = selectedMemberIds.includes(m.id);
                  const isCurrentAssigned = m.assignedMonth === editingMonth;
                  
                  return (
                    <div
                      key={m.id}
                      onClick={() => handleToggleMember(m.id)}
                      className={`flex items-center justify-between p-3 rounded-xl border text-xs font-medium cursor-pointer transition-all ${
                        isChecked
                          ? 'bg-teal-50/50 dark:bg-teal-950/10 border-teal-500 dark:border-teal-500/70 text-slate-800 dark:text-slate-150'
                          : 'bg-white dark:bg-slate-900/10 border-slate-150 dark:border-slate-800 hover:border-slate-350 dark:hover:border-slate-700 text-slate-700 dark:text-slate-350'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className={`w-2.5 h-2.5 rounded-full ${m.avatarColor || 'bg-teal-600'} shrink-0`} />
                        <span className="font-semibold">{m.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {isCurrentAssigned ? (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-100/60 dark:bg-teal-950/60 text-teal-850 dark:text-teal-300 font-bold border border-teal-200/40">
                            Já neste ciclo
                          </span>
                        ) : m.assignedMonth ? (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-bold">
                            Alocado ao Mês {m.assignedMonth}
                          </span>
                        ) : (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 font-bold">
                            Sem ciclo definido
                          </span>
                        )}
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}} // Handled by div onClick
                          className="rounded text-teal-600 focus:ring-teal-500 border-slate-300 w-4 h-4 cursor-pointer"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/40 gap-3">
              <div className="flex items-center gap-1.5 text-[10px] text-amber-600 dark:text-amber-400 max-w-[55%] leading-tight">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>Reorganizar membros atualizará imediatamente o livro de faturamento.</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEditingMonth(null)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={selectedMemberIds.length !== 2}
                  onClick={handleSaveBeneficiaries}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm cursor-pointer ${
                    selectedMemberIds.length === 2
                      ? 'bg-teal-600 hover:bg-teal-700 text-white shrink-0'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed shrink-0'
                  }`}
                >
                  Confirmar Ciclo
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

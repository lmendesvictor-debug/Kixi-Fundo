import { Member, SemesterCycle, getFullMonthLabel } from '../types';

/**
 * Cria os ciclos iniciais padrão (1º e 2º Semestres) garantindo que
 * o utilizador visualize imediatamente tanto o ciclo ativo quanto o novo ciclo seguinte.
 */
export function buildDefaultInitialCycles(
  members: Member[],
  payoutsCompleted: { [month: number]: boolean } = {}
): SemesterCycle[] {
  const memberIds = members.map(m => m.id);
  const fallbackIds = memberIds.length >= 12 ? memberIds : Array.from({ length: 12 }, (_, i) => i + 1);

  // 1º Ciclo Semestral (Meses 1 a 6)
  const cycle1Allocations: { [month: number]: number[] } = {};
  for (let m = 1; m <= 6; m++) {
    const assigned = members.filter(mem => mem.assignedMonth === m).map(mem => mem.id);
    if (assigned.length === 2) {
      cycle1Allocations[m] = assigned;
    } else {
      // Distribuição padrão de pares
      const idx1 = (m - 1) * 2;
      const idx2 = idx1 + 1;
      cycle1Allocations[m] = [fallbackIds[idx1 % fallbackIds.length], fallbackIds[idx2 % fallbackIds.length]];
    }
  }

  const isCycle1Complete = [1, 2, 3, 4, 5, 6].every(m => payoutsCompleted[m] === true);

  const cycle1: SemesterCycle = {
    id: 1,
    name: '1º Ciclo Semestral (Meses 1 a 6)',
    startMonth: 1,
    endMonth: 6,
    status: isCycle1Complete ? 'completed' : 'active',
    allocations: cycle1Allocations,
    createdAt: '2026-03-01T00:00:00.000Z',
    notes: 'Ciclo Semestral Inaugural do Kixi-Fundo (Março a Agosto de 2026).'
  };

  // 2º Ciclo Semestral (Meses 7 a 12) - Gerado automaticamente com rotação equitativa
  const cycle2Allocations: { [month: number]: number[] } = {};
  // Rotação equilibrada: inverte a ordem para equidade financeira
  const rotatedIds = [...fallbackIds].reverse();
  for (let m = 7; m <= 12; m++) {
    const rel = m - 7;
    const idx1 = rel * 2;
    const idx2 = idx1 + 1;
    cycle2Allocations[m] = [rotatedIds[idx1 % rotatedIds.length], rotatedIds[idx2 % rotatedIds.length]];
  }

  const isCycle2Complete = [7, 8, 9, 10, 11, 12].every(m => payoutsCompleted[m] === true);

  const cycle2: SemesterCycle = {
    id: 2,
    name: '2º Ciclo Semestral (Meses 7 a 12)',
    startMonth: 7,
    endMonth: 12,
    status: isCycle2Complete ? 'completed' : (isCycle1Complete ? 'active' : 'upcoming'),
    allocations: cycle2Allocations,
    createdAt: '2026-09-01T00:00:00.000Z',
    notes: 'Segundo Ciclo Semestral do Kixi-Fundo (Setembro de 2026 a Fevereiro de 2027).'
  };

  return [cycle1, cycle2];
}

/**
 * Gera o próximo ciclo semestral de 6 meses de acordo com as regras do Kixi-Fundo:
 * 6 meses de rotação, 2 cooperantes por mês contemplados com 600.000,00 Kz cada.
 */
export function generateNextSemesterCycle(
  existingCycles: SemesterCycle[],
  members: Member[],
  customName?: string,
  customAllocations?: { [month: number]: number[] },
  customNotes?: string
): SemesterCycle {
  const nextId = (existingCycles.length > 0 ? Math.max(...existingCycles.map(c => c.id)) : 0) + 1;
  const lastCycle = existingCycles[existingCycles.length - 1];
  const startMonth = lastCycle ? lastCycle.endMonth + 1 : (nextId - 1) * 6 + 1;
  const endMonth = startMonth + 5;

  const memberIds = members.map(m => m.id);
  const fallbackIds = memberIds.length >= 12 ? memberIds : Array.from({ length: 12 }, (_, i) => i + 1);

  let allocations: { [month: number]: number[] } = {};

  if (customAllocations && Object.keys(customAllocations).length === 6) {
    allocations = customAllocations;
  } else {
    // Rotação automática inteligente baseada no ciclo anterior (deslocamento circular para rotatividade justa)
    const shift = (nextId * 2) % fallbackIds.length;
    const rotated = [...fallbackIds.slice(shift), ...fallbackIds.slice(0, shift)];
    for (let m = startMonth; m <= endMonth; m++) {
      const rel = m - startMonth;
      const idx1 = (rel * 2) % rotated.length;
      const idx2 = (rel * 2 + 1) % rotated.length;
      allocations[m] = [rotated[idx1], rotated[idx2]];
    }
  }

  const generatedCycle: SemesterCycle = {
    id: nextId,
    name: customName || `${nextId}º Ciclo Semestral (Meses ${startMonth} a ${endMonth})`,
    startMonth,
    endMonth,
    status: 'upcoming',
    allocations,
    createdAt: new Date().toISOString(),
    notes: customNotes || `Ciclo Semestral ${nextId} criado conforme regras da rotação cooperativa.`
  };

  return generatedCycle;
}

export function getBeneficiariesForCycleMonth(
  cycle: SemesterCycle | undefined,
  monthNum: number,
  allMembers: Member[]
): Member[] {
  if (cycle && cycle.allocations && cycle.allocations[monthNum]) {
    const ids = cycle.allocations[monthNum];
    return ids.map(id => allMembers.find(m => m.id === id)).filter((m): m is Member => !!m);
  }
  // Fallback para assignedMonth dos membros
  return allMembers.filter(m => m.assignedMonth === monthNum);
}

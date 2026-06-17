import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Filter, 
  Plus, 
  Trash2, 
  Edit, 
  ChevronDown, 
  Download, 
  User, 
  Calendar, 
  Check, 
  Clock, 
  Search, 
  Printer, 
  FileSpreadsheet, 
  RefreshCw 
} from 'lucide-react';
import { Member, KixLog } from '../types';

interface PaymentsLedgerProps {
  currentMonth: number;
  members: Member[];
  setMembers: React.Dispatch<React.SetStateAction<Member[]>>;
  logs: KixLog[];
  setLogs: React.Dispatch<React.SetStateAction<KixLog[]>>;
  saveState: (newMembers: Member[], newLogs: KixLog[]) => any;
  formatCurrency: (amount: number) => string;
}

export default function PaymentsLedger({
  currentMonth,
  members,
  setMembers,
  logs,
  setLogs,
  saveState,
  formatCurrency,
}: PaymentsLedgerProps) {
  // Filters State
  const [filterMonth, setFilterMonth] = useState<string>(() => {
    const monthNamesPortuguese = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    const index = (currentMonth - 1 + 2) % 12;
    return monthNamesPortuguese[index] || 'all';
  });
  const [filterYear, setFilterYear] = useState<string>('2026');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Dropdown States
  const [showExportDropdown, setShowExportDropdown] = useState<boolean>(false);

  // Modal State
  const [showRegisterModal, setShowRegisterModal] = useState<boolean>(false);
  const [editingRecord, setEditingRecord] = useState<{
    memberId: number;
    monthNum: number;
    amount: number;
    paidDate: string;
    isPaid: boolean;
  } | null>(null);

  // Form Fields State
  const [formMemberId, setFormMemberId] = useState<number>(members[0]?.id || 1);
  const [formMonth, setFormMonth] = useState<number>(currentMonth);
  const [formDate, setFormDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [formAmount, setFormAmount] = useState<number>(120000); // Standard quota Kz
  const [formStatus, setFormStatus] = useState<'pago' | 'pendente'>('pago');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  const monthNamesPortuguese = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const getMonthName = (monthNum: number) => {
    // 1 to 6 represent months, we can map with +2 offset to start in March
    const index = (monthNum - 1 + 2) % 12;
    return monthNamesPortuguese[index];
  };

  // Extract all payment/non-payment entries from member contributions
  interface PaymentRow {
    id: string; // memberId-monthNum
    memberId: number;
    memberName: string;
    memberEmail: string;
    memberPhone: string;
    avatarColor: string;
    monthNum: number;
    monthName: string;
    year: string;
    paidDate?: string;
    amount: number;
    isPaid: boolean;
  }

  const allPaymentRows: PaymentRow[] = [];
  members.forEach((member) => {
    // We cover a 6-month cycle as standard, but we can generate entries for all 6 months
    for (let m = 1; m <= 6; m++) {
      const contrib = member.contributions[m];
      const isPaid = contrib?.paid || false;
      const paidDate = contrib?.paidAt ? contrib.paidAt.split('T')[0] : undefined;
      
      // Store custom amounts in of the metadata, or standard if not specified
      // For visual customization to support e.g. 3.000,00 Kz shown in screenshot, we'll allow custom amounts
      // we fallback to 120000
      // We can also check if we have a saved billing value in receipts storage or standard
      const amountValue = (contrib as any)?.amount || 120000;

      allPaymentRows.push({
        id: `${member.id}-${m}`,
        memberId: member.id,
        memberName: member.name,
        memberEmail: member.email,
        memberPhone: member.phone,
        avatarColor: member.avatarColor,
        monthNum: m,
        monthName: getMonthName(m),
        year: '2026', // fixed or dynamic
        paidDate,
        amount: amountValue,
        isPaid,
      });
    }
  });

  // Apply filters
  const filteredRows = allPaymentRows.filter((row) => {
    const matchesMonth = filterMonth === 'all' ? true : row.monthName.toLowerCase() === filterMonth.toLowerCase();
    const matchesYear = filterYear === 'all' ? true : row.year === filterYear;
    const matchesStatus = filterStatus === 'all' 
      ? true 
      : filterStatus === 'pago' ? row.isPaid : !row.isPaid;
    const matchesSearch = searchQuery.trim() === '' 
      ? true 
      : row.memberName.toLowerCase().includes(searchQuery.toLowerCase()) || 
        row.memberPhone.includes(searchQuery) || 
        row.memberEmail.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesMonth && matchesYear && matchesStatus && matchesSearch;
  });

  // Sum total collected for the active rows
  const totalArrecadado = filteredRows
    .filter((r) => r.isPaid)
    .reduce((sum, r) => sum + r.amount, 0);

  const handleClearFilters = () => {
    setFilterMonth(getMonthName(currentMonth));
    setFilterYear('2026');
    setFilterStatus('all');
    setSearchQuery('');
  };

  // Open modal/form for a brand new payment
  const openNewPaymentModal = () => {
    setEditingRecord(null);
    setFormMemberId(members[0]?.id || 1);
    setFormMonth(currentMonth);
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormAmount(120000);
    setFormStatus('pago');
    setShowRegisterModal(true);
  };

  // Open modal/form for editing an existing payment
  const openEditModal = (row: PaymentRow) => {
    setEditingRecord({
      memberId: row.memberId,
      monthNum: row.monthNum,
      amount: row.amount,
      paidDate: row.paidDate || new Date().toISOString().split('T')[0],
      isPaid: row.isPaid
    });
    setFormMemberId(row.memberId);
    setFormMonth(row.monthNum);
    setFormDate(row.paidDate || new Date().toISOString().split('T')[0]);
    setFormAmount(row.amount);
    setFormStatus(row.isPaid ? 'pago' : 'pendente');
    setShowRegisterModal(true);
  };

  const handleDeletePayment = async (row: PaymentRow) => {
    if (window.confirm(`Tem a certeza que deseja ELIMINAR/ANULAR o pagamento de ${row.memberName} para o mês de ${row.monthName}?`)) {
      const updatedMembers = members.map((m) => {
        if (m.id === row.memberId) {
          return {
            ...m,
            contributions: {
              ...m.contributions,
              [row.monthNum]: {
                paid: false,
                paidAt: undefined,
              }
            }
          };
        }
        return m;
      });

      const newLog: KixLog = {
        id: `pay-deleted-${Date.now()}`,
        timestamp: new Date().toISOString(),
        type: 'cycle_change',
        amount: 0,
        description: `PAGAMENTO ANULADO: O registo de quota paga pelo cooperador ${row.memberName} no mês de ${row.monthName} foi cancelado/apagado administrativamente.`,
        month: row.monthNum,
      };

      const updatedLogs = [newLog, ...logs];
      setMembers(updatedMembers);
      setLogs(updatedLogs);
      
      try {
        await saveState(updatedMembers, updatedLogs);
      } catch (err) {
        alert("Erro ao remover pagamento: " + err);
      }
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const selectedMember = members.find((m) => m.id === formMemberId);
    if (!selectedMember) return;

    const isPaid = formStatus === 'pago';

    const updatedMembers = members.map((m) => {
      if (m.id === formMemberId) {
        return {
          ...m,
          contributions: {
            ...m.contributions,
            [formMonth]: {
              ...m.contributions[formMonth],
              paid: isPaid,
              paidAt: isPaid ? new Date(formDate).toISOString() : undefined,
              // Save custom amount
              amount: formAmount,
            } as any
          }
        };
      }
      return m;
    });

    const isEditing = editingRecord !== null;
    const logDesc = isEditing
      ? `REGISTO DE QUOTA ALTERADO: Alterado pagamento de ${selectedMember.name} para o mês de ${getMonthName(formMonth)}. Status: ${formStatus.toUpperCase()}, Valor: ${formatCurrency(formAmount)}.`
      : `PAGAMENTO REGISTADO MANUALMENTE: Lançamento efetuado para o cooperador ${selectedMember.name} no mês de ${getMonthName(formMonth)} com o valor de ${formatCurrency(formAmount)}. Status: ${formStatus.toUpperCase()}.`;

    const newLog: KixLog = {
      id: `pay-register-${Date.now()}`,
      timestamp: new Date().toISOString(),
      type: 'contribution',
      memberName: selectedMember.name,
      amount: isPaid ? formAmount : 0,
      description: logDesc,
      month: formMonth,
    };

    const updatedLogs = [newLog, ...logs];
    setMembers(updatedMembers);
    setLogs(updatedLogs);

    setIsSaving(true);
    setErrorMsg('');
    try {
      await saveState(updatedMembers, updatedLogs);
      setShowRegisterModal(false);
      setEditingRecord(null);
    } catch (err: any) {
      setErrorMsg('Falha ao gravar pagamento na nuvem: ' + err);
    } finally {
      setIsSaving(false);
    }
  };

  // Exports
  const handleExportCSV = () => {
    let csvContent = '\uFEFF'; // BOM
    csvContent += 'Membro;Mês Referência;Data Pagamento;Valor (Kz);Estado\r\n';
    
    filteredRows.forEach((r) => {
      const formattedDate = r.paidDate ? new Date(r.paidDate).toLocaleDateString('pt-PT') : 'N/D';
      const formattedValue = r.amount.toLocaleString('pt-AO', { minimumFractionDigits: 2 });
      csvContent += `${r.memberName};${r.monthName} 2026;${formattedDate};${formattedValue};${r.isPaid ? 'Pago' : 'Pendente'}\r\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `KixiFundo_Lista_Pagamentos_Quotas_${getMonthName(currentMonth)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShowExportDropdown(false);
  };

  const handlePrintPDF = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const rowsHTML = filteredRows.map(r => `
      <tr style="border-bottom: 1px solid #e2e8f0;">
        <td style="padding: 12px 8px; font-size: 11px; font-weight: bold;">${r.memberName}</td>
        <td style="padding: 12px 8px; font-size: 11px;">${r.monthName} 2026</td>
        <td style="padding: 12px 8px; font-size: 11px;">${r.paidDate ? new Date(r.paidDate).toLocaleDateString('pt-PT') : '—'}</td>
        <td style="padding: 12px 8px; font-size: 11px; font-weight: bold; font-family: monospace;">${r.amount.toLocaleString('pt-AO', { minimumFractionDigits: 2 })} Kz</td>
        <td style="padding: 12px 8px; font-size: 10px; font-weight: bold;">
          <span style="padding: 4px 8px; border-radius: 4px; ${r.isPaid ? 'background-color: #d1fae5; color: #065f46;' : 'background-color: #fef3c7; color: #92400e;'}">
            ${r.isPaid ? 'Pago' : 'Pendente'}
          </span>
        </td>
      </tr>
    `).join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>Kixi-Fundo - Registo de Pagamento de Quotas</title>
          <style>
            body { font-family: 'Helvetica Neue', Arial, sans-serif; padding: 40px; color: #1e293b; background-color: white; line-height: 1.4; }
            .header { text-align: center; border-bottom: 2px solid #0284c7; padding-bottom: 20px; margin-bottom: 30px; }
            .header h1 { font-size: 20px; color: #0284c7; margin: 0 0 5px 0; text-transform: uppercase; letter-spacing: 1px; }
            .header h2 { font-size: 12px; color: #475569; margin: 0; font-weight: normal; letter-spacing: 2px; text-transform: uppercase; }
            .meta { font-size: 10px; color: #64748b; margin-top: 10px; display: flex; justify-content: space-between; }
            .info-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px; margin-bottom: 25px; font-size: 12px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
            th { background-color: #f1f5f9; color: #475569; padding: 10px; font-size: 10px; font-weight: bold; text-align: left; border-bottom: 2px solid #cbd5e1; text-transform: uppercase; }
            .footer { border-top: 1px solid #e2e8f0; margin-top: 50px; padding-top: 15px; text-align: center; font-size: 10px; color: #64748b; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>KIXI-FUNDO - GESTÃO DE FINANÇAS COMPARTICIPADAS</h1>
            <h2>Associação Consórcio de Poupança de Interajuda Coletiva</h2>
            <div class="meta">
              <span>Data de Emissão: ${new Date().toLocaleString('pt-PT')}</span>
              <span>Filtro Ativo: Mês de Ref. ${filterMonth === 'all' ? 'Todos' : filterMonth} | Estado: ${filterStatus.toUpperCase()}</span>
            </div>
          </div>

          <div class="info-box">
            <strong>Relatório de Quotas Arrecadadas</strong><br/>
            Este relatório consolida a arrecadação de quotas mensais de apoio para as finalidades rotacionais de apoio aos membros cooperadores.<br/>
            <strong>Total Arrecadado no Período Selecionado:</strong> <span style="font-family: monospace; font-size: 14px; font-weight: bold; color: #059669;">${totalArrecadado.toLocaleString('pt-AO', { minimumFractionDigits: 2 })} Kz</span>
          </div>

          <table>
            <thead>
              <tr>
                <th>Membro</th>
                <th>Mês de Ref.</th>
                <th>Data Pagamento</th>
                <th>Valor Cooperado</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHTML}
            </tbody>
          </table>

          <div class="footer">
            <p>© 2026 Kixi-Fundo - Gestão de Finanças Comparticipadas, Angola. Documento gerado eletronicamente para fins de auditoria interna.</p>
          </div>
          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
    setShowExportDropdown(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col xl:flex-row gap-6 items-start">
        
        {/* SIDEBAR CARD - FILTERS (LEFT) */}
        <div id="payments-filters" className="w-full xl:w-[280px] shrink-0 bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-850 rounded-2xl p-5 shadow-sm space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <Filter className="w-4 h-4 text-sky-600" />
            <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider">
              Filtros
            </h3>
          </div>

          <div className="space-y-4">
            {/* Search Input Filter */}
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                Procurar Membro
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Nome, e-mail..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8.5 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-sky-500 text-slate-800 dark:text-white"
                />
              </div>
            </div>

            {/* Month Reference Filter */}
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                Mês de Referência
              </label>
              <select
                value={filterMonth}
                onChange={(e) => setFilterMonth(e.target.value)}
                className="w-full p-2.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-800 dark:text-white font-medium"
              >
                <option value="all">Todos os Meses</option>
                <option value="Janeiro">Janeiro</option>
                <option value="Fevereiro">Fevereiro</option>
                <option value="Março">Março</option>
                <option value="Abril">Abril</option>
                <option value="Maio">Maio</option>
                <option value="Junho">Junho</option>
                <option value="Julho">Julho (Projetado)</option>
                <option value="Agosto">Agosto (Projetado)</option>
                <option value="Setembro">Setembro (Projetado)</option>
                <option value="Outubro">Outubro (Projetado)</option>
                <option value="Novembro">Novembro (Projetado)</option>
                <option value="Dezembro">Dezembro (Projetado)</option>
              </select>
            </div>

            {/* Year Filter */}
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                Ano de Referência
              </label>
              <select
                value={filterYear}
                onChange={(e) => setFilterYear(e.target.value)}
                className="w-full p-2.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-800 dark:text-white font-medium"
              >
                <option value="2026">2026</option>
                <option value="2027">2027</option>
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                Estado do Pagamento
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full p-2.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-800 dark:text-white font-medium"
              >
                <option value="all">Todos os Estados</option>
                <option value="pago">Pago</option>
                <option value="pendente">Pendente</option>
              </select>
            </div>

            {/* Clear Filters Button */}
            <button
              onClick={handleClearFilters}
              className="w-full py-2.5 px-3 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-300 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Limpar filtros
            </button>
          </div>
        </div>

        {/* CONTRIBUTIONS LIST / TABLE WORKSPACE (RIGHT) */}
        <div className="flex-1 w-full bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-850 rounded-2xl shadow-sm overflow-hidden flex flex-col justify-between">
          
          {/* Section Upper Bar */}
          <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            
            <div className="space-y-1">
              <h2 className="text-xl font-black font-display text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                <Calendar className="w-5.5 h-5.5 text-sky-600" />
                Pagamentos de Quotas
              </h2>
              <p className="text-xs text-slate-500">
                Registo de pagamentos em Kz • Mês de referência
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              
              {/* Highlight total collected label */}
              <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-150 dark:border-emerald-900/40 rounded-xl px-4 py-2 text-right">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block leading-none">
                  Total Arrecadado
                </span>
                <span className="text-sm font-extrabold font-mono text-emerald-600 dark:text-emerald-400 mt-1 block leading-none">
                  {totalArrecadado.toLocaleString('pt-AO', { minimumFractionDigits: 2 })} Kz
                </span>
              </div>

              {/* Action buttons */}
              <button
                onClick={openNewPaymentModal}
                className="bg-[#0284c7] hover:bg-sky-600 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-md shadow-sky-500/10 transition-all flex items-center gap-1.5 cursor-pointer active:scale-98"
              >
                <Plus className="w-4 h-4" />
                + Registar Pagamento
              </button>

              {/* Export Button with Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowExportDropdown(!showExportDropdown)}
                  className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-850 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs px-4 py-2.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  Exportar Relatório
                  <ChevronDown className="w-3 h-3" />
                </button>
                
                <AnimatePresence>
                  {showExportDropdown && (
                    <motion.div
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 5 }}
                      className="absolute right-0 mt-2 w-44 bg-white dark:bg-slate-950 border border-slate-150 dark:border-slate-800 rounded-xl shadow-xl z-20 overflow-hidden"
                    >
                      <button
                        onClick={handlePrintPDF}
                        className="w-full text-left px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-900 text-xs text-slate-700 dark:text-slate-300 flex items-center gap-2 font-medium cursor-pointer"
                      >
                        <Printer className="w-3.5 h-3.5 text-[#0284c7]" />
                        Imprimir / PDF
                      </button>
                      <button
                        onClick={handleExportCSV}
                        className="w-full text-left px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-900 text-xs text-slate-700 dark:text-slate-300 flex items-center gap-2 font-medium cursor-pointer"
                      >
                        <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                        Planilha Excel (.xlsx)
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

            </div>

          </div>

          {/* TABLE LOG IMPLEMENTATION */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse select-none">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-950/40 border-b border-slate-100 dark:border-slate-800 text-[10.5px] font-black uppercase tracking-wider text-slate-400">
                  <th className="py-4 px-6">Membro</th>
                  <th className="py-4 px-5">Mês Ref.</th>
                  <th className="py-4 px-5">Data Pagamento</th>
                  <th className="py-4 px-5">Valor (Kz)</th>
                  <th className="py-4 px-5">Status</th>
                  <th className="py-4 px-6 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                {filteredRows.map((row) => (
                  <tr 
                    key={row.id} 
                    className="hover:bg-slate-50/50 dark:hover:bg-slate-950/10 text-slate-700 dark:text-slate-300 text-xs font-semibold h-16"
                  >
                    
                    {/* Column 1: Member card */}
                    <td className="py-3 px-6">
                      <div className="flex items-center gap-3">
                        <div className={`w-8.5 h-8.5 rounded-xl ${row.avatarColor} flex items-center justify-center text-white font-bold text-xs`}>
                          {row.memberName[0]}
                        </div>
                        <div>
                          <span className="font-bold text-slate-850 dark:text-white block leading-tight">
                            {row.memberName}
                          </span>
                          <span className="text-[10px] text-slate-450 font-mono mt-0.5 block leading-none">
                            {row.memberPhone}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Column 2: Reference month */}
                    <td className="py-3 px-5">
                      <span className="font-semibold text-slate-600 dark:text-slate-300">
                        {row.monthName} 2026
                      </span>
                    </td>

                    {/* Column 3: Payment Date */}
                    <td className="py-3 px-5 font-mono text-slate-500">
                      {row.paidDate ? (
                        new Date(row.paidDate).toLocaleDateString('pt-PT')
                      ) : (
                        <span className="text-slate-430 italic font-semibold">—</span>
                      )}
                    </td>

                    {/* Column 4: Amount */}
                    <td className="py-3 px-5 font-mono font-bold text-slate-900 dark:text-white">
                      {row.amount.toLocaleString('pt-AO', { minimumFractionDigits: 2 })} Kz
                    </td>

                    {/* Column 5: Status Button Badge */}
                    <td className="py-3 px-5">
                      {row.isPaid ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase text-emerald-700 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950/20 px-2.5 py-1 rounded-full border border-emerald-100 dark:border-emerald-950/40">
                          <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                          Pago
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase text-amber-700 bg-amber-50 dark:text-amber-400 dark:bg-amber-950/20 px-2.5 py-1 rounded-full border border-amber-100 dark:border-amber-950/40 animate-pulse-once">
                          <Clock className="w-3 h-3 text-amber-650" />
                          Pendente
                        </span>
                      )}
                    </td>

                    {/* Column 6: Actions */}
                    <td className="py-3 px-6 text-right">
                      <div className="flex items-center justify-end gap-2 text-slate-500">
                        <button
                          onClick={() => openEditModal(row)}
                          className="p-1.5 rounded-lg border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-950 transition-colors cursor-pointer"
                          title="Editar Pagamento"
                        >
                          <Edit className="w-3.5 h-3.5 text-slate-400 hover:text-sky-600" />
                        </button>
                        <button
                          onClick={() => handleDeletePayment(row)}
                          className="p-1.5 rounded-lg border border-slate-100 dark:border-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors cursor-pointer"
                          title="Eliminar Registros"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-slate-400 hover:text-rose-500" />
                        </button>
                      </div>
                    </td>

                  </tr>
                ))}

                {filteredRows.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-10 text-slate-400">
                      Nenhum registo de quota localizado para os filtros selecionados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

        </div>

      </div>

      {/* FORM REGISTRATION/EDITING MODAL OVERLAY */}
      <AnimatePresence>
        {showRegisterModal && (
          <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-md w-full overflow-hidden flex flex-col"
            >
              <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950/25">
                <span className="font-black text-xs uppercase tracking-wider text-slate-800 dark:text-white flex items-center gap-1.5">
                  <Calendar className="w-4.5 h-4.5 text-sky-600" />
                  {editingRecord ? 'Editar Parcela de Quota' : 'Novo Lançamento Pagamento'}
                </span>
                <button
                  type="button"
                  onClick={() => setShowRegisterModal(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-white font-black text-sm cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleFormSubmit} className="p-6 space-y-4">
                
                {/* Field: Member Selection */}
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                    Selecione o Membro Cooperador *
                  </label>
                  <select
                    disabled={editingRecord !== null}
                    value={formMemberId}
                    onChange={(e) => setFormMemberId(Number(e.target.value))}
                    className="w-full p-2.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-lg text-slate-800 dark:text-white focus:outline-none focus:border-sky-500 font-semibold"
                  >
                    {members.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.phone})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Field: Month Selection */}
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                    Mês de Referência *
                  </label>
                  <select
                    disabled={editingRecord !== null}
                    value={formMonth}
                    onChange={(e) => setFormMonth(Number(e.target.value))}
                    className="w-full p-2.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-lg text-slate-800 dark:text-white focus:outline-none focus:border-sky-500 font-semibold"
                  >
                    {[1, 2, 3, 4, 5, 6].map((m) => (
                      <option key={m} value={m}>
                        Mês {m} - {getMonthName(m)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Field: Payment Date */}
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                    Data do Pagamento / Depósito *
                  </label>
                  <input
                    type="date"
                    required
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full p-2.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-lg text-slate-800 dark:text-white focus:outline-none focus:border-sky-500 font-semibold font-mono"
                  />
                </div>

                {/* Field: Value in Kz */}
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 flex justify-between">
                    <span>Valor Cooperante (Kz) *</span>
                    <span className="text-[9px] text-slate-400 font-normal">Padrão da associação</span>
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={formAmount}
                    onChange={(e) => setFormAmount(Number(e.target.value))}
                    className="w-full p-2.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-lg text-slate-800 dark:text-white focus:outline-none focus:border-sky-500 font-bold font-mono"
                  />
                  <div className="flex gap-2.5 mt-1.5">
                    <button
                      type="button"
                      onClick={() => setFormAmount(120000)}
                      className="text-[9px] font-black bg-emerald-50 hover:bg-emerald-100 text-emerald-700 px-2 py-1 rounded"
                    >
                      120.000 Kz (Padrão)
                    </button>
                  </div>
                </div>

                {/* Field: Status Selection */}
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                    Estado do Lançamento
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setFormStatus('pago')}
                      className={`p-2.5 rounded-lg border text-xs font-bold text-center transition-all cursor-pointer ${
                        formStatus === 'pago'
                          ? 'bg-emerald-50 border-emerald-400 text-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-400'
                          : 'bg-slate-50 border-slate-200 text-slate-500 dark:bg-slate-900 dark:border-slate-800'
                      }`}
                    >
                      ✔ PAGO
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormStatus('pendente')}
                      className={`p-2.5 rounded-lg border text-xs font-bold text-center transition-all cursor-pointer ${
                        formStatus === 'pendente'
                          ? 'bg-amber-50 border-amber-400 text-amber-850 dark:bg-amber-950/20 dark:text-amber-400'
                          : 'bg-slate-50 border-slate-200 text-slate-500 dark:bg-slate-900 dark:border-slate-800'
                      }`}
                    >
                      ⚙ PENDENTE
                    </button>
                  </div>
                </div>

                {errorMsg && (
                  <p className="text-rose-500 dark:text-rose-400 text-[11px] font-bold py-1 text-center shrink-0">
                    ⚠ {errorMsg}
                  </p>
                )}

                {/* Submit button */}
                <div className="pt-2 flex gap-3">
                  <button
                    type="button"
                    disabled={isSaving}
                    onClick={() => setShowRegisterModal(false)}
                    className="flex-1 py-3 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="flex-1 py-3 bg-[#0284c7] hover:bg-sky-600 text-white rounded-xl text-xs font-bold shadow-md transition-colors cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-85 disabled:cursor-not-allowed"
                  >
                    {isSaving ? (
                      <>
                        <div className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                        <span>A gravar...</span>
                      </>
                    ) : (
                      <span>Confirmar</span>
                    )}
                  </button>
                </div>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

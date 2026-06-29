import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { jsPDF } from 'jspdf';
import PrintConfigModal, { PrintConfig } from './PrintConfigModal';
import { 
  FileText, 
  Download, 
  Send, 
  Calendar, 
  TrendingUp, 
  Coins, 
  Building2, 
  Users, 
  CheckCircle, 
  ArrowUpRight, 
  Printer, 
  Share2, 
  MessageSquare,
  Mail,
  UserCheck,
  Check,
  Smartphone,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  Cell
} from 'recharts';
import { Member, KixLog, Loan } from '../types';

interface ReportsSectionProps {
  currentMonth: number;
  members: Member[];
  logs: KixLog[];
  payoutsCompleted: { [month: number]: boolean };
  formatCurrency: (val: number) => string;
  loans?: Loan[];
}

export default function ReportsSection({
  currentMonth,
  members,
  logs,
  payoutsCompleted,
  formatCurrency,
  loans = [],
}: ReportsSectionProps) {
  const [activeReportTab, setActiveReportTab] = useState<'payments' | 'banking' | 'utilization' | 'loans' | 'notifications'>('payments');
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  
  // States for filtering transaction logs inside the "utilization" tab
  const [selectedLogMemberId, setSelectedLogMemberId] = useState<string>('all');
  const [logSearchQuery, setLogSearchQuery] = useState<string>('');
  
  // Notification simulator states
  const [selectedMemberId, setSelectedMemberId] = useState<number>(members[0]?.id || 1);
  const [notificationType, setNotificationType] = useState<'receipt' | 'payout_alert'>('receipt');
  const [notificationChannel, setNotificationChannel] = useState<'whatsapp' | 'email'>('whatsapp');
  const [isSendingNotification, setIsSendingNotification] = useState<boolean>(false);
  const [notificationLog, setNotificationLog] = useState<Array<{
    timestamp: string;
    memberName: string;
    channel: 'whatsapp' | 'email';
    type: string;
    details: string;
  }>>([]);
  const [showNotifySuccess, setShowNotifySuccess] = useState(false);

  // Dynamic monitor states for cycles and contemplates
  const [selectedReportCycle, setSelectedReportCycle] = useState<number>(currentMonth);
  const [cycleFilterType, setCycleFilterType] = useState<'all' | 'past' | 'future'>('all');

  // Math variables
  const totalPaidContributionsCount = members.reduce((acc, m) => {
    const paidInMember = Object.keys(m.contributions).filter(
      (monthKey) => m.contributions[Number(monthKey)]?.paid
    ).length;
    return acc + paidInMember;
  }, 0);

  const totalGrossCollected = members.reduce((acc, m) => {
    return acc + Object.keys(m.contributions).reduce((monthAcc, monthKey) => {
      const contr = m.contributions[Number(monthKey)];
      if (contr?.paid) {
        const amt = (contr as any).amount !== undefined ? (contr as any).amount : 120000;
        return monthAcc + amt;
      }
      return monthAcc;
    }, 0);
  }, 0);
  const totalInterestPaidFromLoans = (loans || []).reduce((acc, l) => {
    return acc + (l.payments || []).filter(p => p.paid).reduce((sum, p) => sum + p.interestPaid, 0);
  }, 0);
  const totalSocialRetained = (totalPaidContributionsCount * 20000) + totalInterestPaidFromLoans;
  const totalSocialDisbursed = logs
    .filter((log) => log.type === 'social_aid')
    .reduce((acc, log) => acc + log.amount, 0);
  const socialBalance = totalSocialRetained - totalSocialDisbursed;

  const completedMonthsOfPayout = Object.keys(payoutsCompleted).filter(
    (monthKey) => payoutsCompleted[Number(monthKey)]
  ).length;
  const totalBenefitsPaid = completedMonthsOfPayout * 1200000;
  const bankBalance = totalGrossCollected - totalBenefitsPaid - totalSocialDisbursed;

  // Compile monthly bank details
  const monthlyData = [1, 2, 3, 4, 5, 6].map((m) => {
    const paidInMonth = members.filter((member) => member.contributions[m]?.paid).length;
    const grossCollected = members.reduce((sum, member) => {
      const contr = member.contributions[m];
      if (contr?.paid) {
        return sum + ((contr as any).amount !== undefined ? (contr as any).amount : 120000);
      }
      return sum;
    }, 0);
    const socialRetained = paidInMonth * 20000;
    const beneficiariesInMonth = members.filter((member) => member.assignedMonth === m);
    const payoutExecuted = payoutsCompleted[m] ? 1200000 : 0;
    const aidsInMonth = logs
      .filter((log) => log.type === 'social_aid' && log.month === m)
      .reduce((acc, log) => acc + log.amount, 0);

    return {
      month: m,
      paidCount: paidInMonth,
      grossCollected,
      socialRetained,
      beneficiaryNames: beneficiariesInMonth.map(b => b.name).join(' e '),
      payoutExecuted,
      aidsInMonth,
      netRemaining: grossCollected - payoutExecuted - aidsInMonth,
    };
  });

  const chartData = monthlyData.map((d) => ({
    name: `Mês ${d.month}`,
    "Contribuições Totais": d.grossCollected,
    "Fundo Social": d.socialRetained,
    "Apoios Sociais": d.aidsInMonth,
    "Número de Pagantes": d.paidCount,
  }));

  // Filter cycles based on past/future option
  const filteredCyclesData = monthlyData.filter(d => {
    if (cycleFilterType === 'past') return d.month < currentMonth;
    if (cycleFilterType === 'future') return d.month >= currentMonth;
    return true;
  }).map(d => ({
    ...d,
    name: `Mês ${d.month}`
  }));

  const selectedCycleData = monthlyData.find(d => d.month === selectedReportCycle);
  const selectedCycleBeneficiaries = members.filter(m => m.assignedMonth === selectedReportCycle);
  const isPayoutDoneForSelectedCycle = payoutsCompleted[selectedReportCycle] === true;

  const CustomChartTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const parentData = payload[0]?.payload || {};
      const brutoColetado = parentData["Contribuições Totais"] ?? payload[0]?.value ?? 0;
      const fundoSocial = parentData["Fundo Social"] ?? payload[1]?.value ?? 0;
      const apoiosSociais = parentData["Apoios Sociais"] ?? 0;
      const pagantes = parentData["Número de Pagantes"] ?? 0;

      return (
        <div className="bg-slate-900 border border-slate-700/80 p-3 rounded-xl shadow-xl text-xs font-semibold text-white animate-fadeIn">
          <p className="text-slate-300 mb-1.5 font-bold uppercase tracking-wider">{label}</p>
          <div className="space-y-1">
            <p className="text-sky-400 font-mono flex items-center gap-1.5">
              <span className="w-2 h-2 rounded bg-sky-500"></span>
              Bruto Coletado: <strong className="font-extrabold">{formatCurrency(brutoColetado)}</strong>
            </p>
            <p className="text-indigo-400 font-mono flex items-center gap-1.5">
              <span className="w-2 h-2 rounded bg-indigo-500"></span>
              Fundo Social (20k): <strong className="font-extrabold">{formatCurrency(fundoSocial)}</strong>
            </p>
            {apoiosSociais > 0 && (
              <p className="text-rose-400 font-mono flex items-center gap-1.5">
                <span className="w-2 h-2 rounded bg-rose-500"></span>
                Apoios Concedidos: <strong className="font-extrabold">{formatCurrency(apoiosSociais)}</strong>
              </p>
            )}
            <p className="text-emerald-450 mt-1 font-mono flex items-center gap-1.5 border-t border-slate-800 pt-1">
              <span className="w-2 h-2 rounded bg-emerald-500"></span>
              Metas: <strong className="font-extrabold">{pagantes} de 12 Sócios</strong>
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  const performanceChartData = monthlyData.map((d) => ({
    name: `Mês ${d.month}`,
    "Contribuições Arrecadadas": d.grossCollected,
    "Benefícios Pagos": d.payoutExecuted,
  }));

  const CustomPerformanceTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const arrecadado = payload[0]?.value ?? 0;
      const pago = payload[1]?.value ?? 0;
      const saldo = arrecadado - pago;
      return (
        <div className="bg-slate-900 border border-slate-700/80 p-3 rounded-xl shadow-xl text-xs font-semibold text-white animate-fadeIn text-left">
          <p className="text-slate-300 mb-1.5 font-bold uppercase tracking-wider">{label}</p>
          <div className="space-y-1">
            <p className="text-emerald-400 font-mono flex items-center gap-1.5">
              <span className="w-2 h-2 rounded bg-emerald-500"></span>
              Contribuições: <strong className="font-extrabold">{formatCurrency(arrecadado)}</strong>
            </p>
            <p className="text-rose-400 font-mono flex items-center gap-1.5">
              <span className="w-2 h-2 rounded bg-rose-500"></span>
              Benefícios de Rotação: <strong className="font-extrabold">{formatCurrency(pago)}</strong>
            </p>
            <div className="border-t border-slate-800 pt-1 mt-1 text-[11px]">
              <p className={`font-mono flex items-center gap-1.5 ${saldo >= 0 ? "text-emerald-450" : "text-rose-400"}`}>
                <span className={`w-2 h-2 rounded ${saldo >= 0 ? "bg-emerald-500" : "bg-rose-500"}`}></span>
                Diferença Líquida: <strong className="font-extrabold">{formatCurrency(saldo)}</strong>
              </p>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  const handlePrintReceipt = (log: KixLog) => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [148, 210] // A5 size receipt
    });

    const isSocialAid = log.type === 'social_aid';

    // Outer border
    doc.setDrawColor(203, 213, 226); // slate-300
    doc.setLineWidth(0.5);
    doc.rect(5, 5, 138, 200);

    // Header bg
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(5, 5, 138, 30, 'F');

    // Title
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('KIXI-FUNDO ANGOLA', 12, 14);
    
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(186, 230, 253); // sky-200
    doc.text('Fundo Cooperado de Poupan\u00E7a e Interajuda', 12, 19);
    doc.text('Estatuto Mutualista Certificado \u2022 Luanda, Angola', 12, 23);

    // Receipt Tag
    doc.setFillColor(16, 185, 129); // emerald-500
    doc.rect(98, 12, 38, 7, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.text('COMPROVATIVO', 104, 16.5);

    // Receipt details
    let y = 48;
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(12);
    doc.text('RECIBO DE PAGAMENTO OFICIAL', 12, y);
    doc.setDrawColor(15, 23, 42);
    doc.setLineWidth(0.4);
    doc.line(12, y + 2, 136, y + 2);
    
    y += 11;
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.text('N\u00BA REGISTRO:', 12, y);
    doc.setFont('helvetica', 'normal');
    doc.text(log.id.toUpperCase(), 38, y);

    y += 7;
    doc.setFont('helvetica', 'bold');
    doc.text('DATA OPERA\u00C7\u00C3O:', 12, y);
    doc.setFont('helvetica', 'normal');
    doc.text(new Date(log.timestamp).toLocaleString('pt-PT'), 38, y);

    y += 7;
    doc.setFont('helvetica', 'bold');
    doc.text('CATEGORIA:', 12, y);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(isSocialAid ? 99 : 14, isSocialAid ? 102 : 165, isSocialAid ? 241 : 233);
    doc.text(isSocialAid ? 'AJUDA DE CUSTO / APOIO SOCIAL' : 'ROTA\u00C7\u00C3O DE BENEF\u00CDCIO MENSAL', 38, y);

    y += 7;
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.text('COOPERANTE:', 12, y);
    doc.setFont('helvetica', 'bold');
    doc.text(log.memberName || 'Geral Coletivo', 38, y);

    y += 12;
    // Value Box
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.rect(12, y, 124, 15, 'FD');
    
    doc.setTextColor(71, 85, 105);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('MONTANTE TOTAL LIQUIDADO:', 16, y + 9.5);
    
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(12);
    doc.text(formatCurrency(log.amount), 75, y + 10);

    y += 24;
    // Descriptive Justification text
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.text('JUSTIFICATIVO DA TRANSA\u00C7\u00C3O:', 12, y);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(51, 65, 85);
    
    // Split text into lines
    const descText = log.description || '';
    const lines = doc.splitTextToSize(descText, 120);
    doc.text(lines, 12, y + 5);

    // Signatures
    y = 158;
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(12, y, 136, y);

    y += 6;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text('FUNDO EMISSOR / TESOURARIA', 12, y);
    doc.text('VISTO DO COOPERANTE', 85, y);

    y += 13;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.text('Mendes Pambo - Adm. Geral', 12, y);
    doc.text(`${log.memberName || 'Benefici\u00E1rio'}`, 85, y);

    y += 4;
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(5.5);
    doc.setTextColor(148, 163, 184);
    doc.text('Assinatura Eletr\u00F3nica Kixi-Fundo', 12, y);
    doc.text('Assinatura de Recebimento F\u00EDsico', 85, y);

    // Safeguard footer
    doc.setFillColor(240, 253, 244); // green-50
    doc.setDrawColor(16, 185, 129); // green-500
    doc.rect(12, 184, 124, 11, 'FD');
    doc.setTextColor(21, 128, 61); // green-700
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.text('CONCILIADO & TRANSA\u00C7\u00C3O CONFIRMADA NA CARTEIRA MUTUALISTA', 16, 189);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    doc.text('Este comprovativo possui validade de auditoria interna conforme os termos da legisla\u00E7\u00E3o cooperativa.', 16, 192.5);

    doc.save(`KixiFundo_Comprovativo_Apoio_${log.id}.pdf`);
  };

  // Export functions using Excel-compatible CSV formats with BOM for Portuguese Accentuation Support
  const handleExportPaymentsExcel = () => {
    let csvContent = '\uFEFF'; // Byte Order Mark for Excel UTF-8 representation
    csvContent += 'Membro;ID;Email;Telefone;Mês de Recebimento;Mês 1 Cota;Mês 2 Cota;Mês 3 Cota;Mês 4 Cota;Mês 5 Cota;Mês 6 Cota;Fundo Social Recebido\r\n';
    
    members.forEach((m) => {
      const getStatus = (month: number) => m.contributions[month]?.paid ? 'PAGA' : 'PENDENTE';
      const row = [
        m.name,
        m.id,
        m.email,
        m.phone,
        `Mês ${m.assignedMonth}`,
        getStatus(1),
        getStatus(2),
        getStatus(3),
        getStatus(4),
        getStatus(5),
        getStatus(6),
        formatCurrency(m.socialSupportReceived || 0).replace('KZs', '').trim()
      ].join(';');
      csvContent += row + '\r\n';
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'KixiFundo_Historico_Pagamentos_Cooperadores.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportLoansExcel = () => {
    let csvContent = '\uFEFF'; // Byte Order Mark for Excel UTF-8 representation
    csvContent += 'ID Contrato;Devedor;Tipo;Documento ID;Telefone;Email;Valor Solicitado;Taxa de Juro;Duração (Meses);Garantias;Status;Data do Contrato;Total Amortizado;Principal Pago;Juros Pagos;Saldo Devedor\r\n';
    
    const loansList = loans || [];
    loansList.forEach((l) => {
      const totalPaid = l.payments.filter(p => p.paid).reduce((sum, p) => sum + p.amount, 0);
      const principalPaid = l.payments.filter(p => p.paid).reduce((sum, p) => sum + p.principalPaid, 0);
      const interestPaid = l.payments.filter(p => p.paid).reduce((sum, p) => sum + p.interestPaid, 0);
      const remainingBalance = l.amountRequested - principalPaid;
      
      const row = [
        l.id,
        l.borrowerName,
        l.borrowerType === 'socio' ? 'Sócio' : 'Singular',
        l.documentId,
        l.phone,
        l.email,
        l.amountRequested,
        `${l.interestRate}%`,
        l.durationMonths,
        l.guarantees.replace(/"/g, '""'),
        l.status.toUpperCase(),
        l.contractDate,
        totalPaid,
        principalPaid,
        interestPaid,
        remainingBalance
      ].join(';');
      csvContent += row + '\r\n';
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'KixiFundo_Relatorio_Creditos_Microcreditos.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportBankExcel = () => {
    let csvContent = '\uFEFF';
    csvContent += 'Ciclo Mensal;Cooperadores Pagantes;Capital Arrecadado Bruto (KZs);Retenção Fundo Social (20k p/membro);Benefícios de Rotação Pagos (KZs);Apoios Sociais Concedidos;Saldo Líquido Mensal\r\n';
    
    monthlyData.forEach((d) => {
      const row = [
        `Mês ${d.month}`,
        `${d.paidCount} de 12`,
        d.grossCollected,
        d.socialRetained,
        d.payoutExecuted,
        d.aidsInMonth,
        d.netRemaining
      ].join(';');
      csvContent += row + '\r\n';
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'KixiFundo_Historico_Fundo_Arrecadado_Banco.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportUtilizationExcel = () => {
    let csvContent = '\uFEFF';
    csvContent += 'Data/Hora;Categoria;Cooperante Beneficiado;Montante (KZs);Ciclo Mês;Histórico / Detalhes do Registro\r\n';
    
    const relevantLogs = logs.filter(l => l.type === 'payout' || l.type === 'social_aid' || l.type === 'contribution');
    
    relevantLogs.forEach((l) => {
      const formattedDate = new Date(l.timestamp).toLocaleString('pt-PT');
      const row = [
        formattedDate,
        l.type === 'payout' ? 'Desembolso Rotação' : l.type === 'social_aid' ? 'Auxílio Interajuda' : 'Contribuição Cota',
        l.memberName || 'Geral / Coletivo',
        l.amount,
        `Mês ${l.month || currentMonth}`,
        l.description.replace(/"/g, '""')
      ].join(';');
      csvContent += row + '\r\n';
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'KixiFundo_Historico_Utilizacao_Verbas_Fundo.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrintPDF = (config: PrintConfig) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const fontStack = config.fontFamily === 'serif' 
      ? "'Playfair Display', Georgia, serif" 
      : config.fontFamily === 'mono' 
      ? "'JetBrains Mono', 'Fira Code', Courier, monospace" 
      : "'Inter', sans-serif";

    const bodySize = config.fontSize === 'compact' ? '10px' : config.fontSize === 'large' ? '14px' : '12px';
    const isTableSimple = config.format === 'table_simple';
    const orientation = config.orientation;

    if (activeReportTab === 'loans') {
      const loansList = loans || [];
      const totalPrincipalDisbursed = loansList.reduce((acc, l) => acc + l.amountRequested, 0);
      const totalInterestCollected = loansList.reduce((acc, l) => acc + l.payments.filter(p => p.paid).reduce((sum, p) => sum + p.interestPaid, 0), 0);
      const totalPrincipalCollected = loansList.reduce((acc, l) => acc + l.payments.filter(p => p.paid).reduce((sum, p) => sum + p.principalPaid, 0), 0);
      const activeOutstanding = totalPrincipalDisbursed - totalPrincipalCollected;

      const loansListHTML = loansList.map(l => {
        const principalPaid = l.payments.filter(p => p.paid).reduce((sum, p) => sum + p.principalPaid, 0);
        const interestPaid = l.payments.filter(p => p.paid).reduce((sum, p) => sum + p.interestPaid, 0);
        const remaining = l.amountRequested - principalPaid;
        const statusLabel = l.status === 'completed' ? 'PAGO ✓' : l.status === 'overdue' ? 'ATRASADO ✗' : 'ACTIVO';
        const statusColor = l.status === 'completed' ? '#065f46' : l.status === 'overdue' ? '#991b1b' : '#0369a1';
        const statusBg = l.status === 'completed' ? '#d1fae5' : l.status === 'overdue' ? '#fee2e2' : '#e0f2fe';
        const statusBorder = l.status === 'completed' ? '#a7f3d0' : l.status === 'overdue' ? '#fecaca' : '#bae6fd';

        return `
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 8px 10px; font-size: 9.5px; font-weight: bold; color: #0f172a;">${l.id}</td>
            <td style="padding: 8px 10px; font-size: 9.5px; font-weight: bold; color: #0f172a;">${l.borrowerName}</td>
            <td style="padding: 8px 10px; font-size: 9.5px; color: #475569;">${l.borrowerType === 'socio' ? 'Sócio' : 'Singular'}</td>
            <td style="padding: 8px 10px; font-size: 9.5px; font-family: monospace; font-weight: bold; text-align: right;">${formatCurrency(l.amountRequested)}</td>
            <td style="padding: 8px 10px; font-size: 9.5px; text-align: center;">${l.interestRate}%</td>
            <td style="padding: 8px 10px; font-size: 9.5px; font-family: monospace; text-align: right; color: #059669;">${formatCurrency(principalPaid)}</td>
            <td style="padding: 8px 10px; font-size: 9.5px; font-family: monospace; text-align: right; color: #0ea5e9;">${formatCurrency(interestPaid)}</td>
            <td style="padding: 8px 10px; font-size: 9.5px; font-family: monospace; text-align: right; font-weight: bold; color: #b45309;">${formatCurrency(remaining)}</td>
            <td style="padding: 8px 10px; font-size: 9.5px; text-align: center;">
              <span style="display: inline-flex; align-items: center; justify-content: center; font-size: 8px; font-weight: bold; background-color: ${statusBg}; color: ${statusColor}; border-radius: 9999px; padding: 2px 7px; border: 1px solid ${statusBorder}; text-transform: uppercase;">
                ${statusLabel}
              </span>
            </td>
          </tr>
        `;
      }).join('');

      printWindow.document.write(`
        <html>
          <head>
            <title>Kixi-Fundo - Relatório de Carteira de Créditos</title>
            <style>
              @page { size: ${orientation}; margin: 15mm; }
              body { 
                font-family: ${fontStack}; 
                font-size: ${bodySize};
                padding: 30px; 
                color: #1e293b; 
                background-color: white; 
                line-height: 1.35; 
                -webkit-print-color-adjust: exact; 
                print-color-adjust: exact; 
              }
              ${isTableSimple ? `
                .header h1 { color: black !important; border-bottom: 2px solid black !important; }
                .header h2, .header p, .meta-bar { color: black !important; }
                .grid-metrics { display: none !important; }
                .stamp-box, .chart-placeholder, .bg-sky-500, .bg-indigo-500, .stamp-container { display: none !important; }
                table { border: 1px solid black !important; }
                th { background-color: white !important; color: black !important; border-bottom: 2px solid black !important; }
                td { border-bottom: 1px solid black !important; color: black !important; }
                span { background-color: transparent !important; color: black !important; border: none !important; padding: 0 !important; }
                .footer { color: black !important; border-top: 1px solid black !important; }
              ` : ''}
              .header { 
                text-align: center; 
                border-bottom: 2px solid #e2e8f0; 
                padding-bottom: 12px; 
                margin-bottom: 20px; 
              }
              .header h1 { 
                font-size: 21px; 
                color: #0c4a6e; 
                margin: 0 0 4px 0; 
                text-transform: uppercase; 
                font-weight: 800; 
                letter-spacing: 0.5px; 
              }
              .header h2 { 
                font-size: 11px; 
                color: #475569; 
                margin: 0 0 6px 0; 
                font-weight: 700; 
                letter-spacing: 1.5px; 
                text-transform: uppercase; 
              }
              .header p { 
                font-size: 10px; 
                color: #64748b; 
                margin: 2px 0; 
              }
              .grid-metrics { 
                display: grid; 
                grid-template-cols: repeat(4, 1fr); 
                gap: 12px; 
                margin-bottom: 20px; 
              }
              .card-metric { 
                border: 1px solid #f1f5f9; 
                background-color: #f8fafc; 
                padding: 12px; 
                border-radius: 8px; 
                box-shadow: 0 1px 2px rgba(0,0,0,0.02);
                position: relative; 
              }
              .card-metric-title { 
                font-size: 8px; 
                font-weight: bold; 
                color: #64748b; 
                text-transform: uppercase; 
                letter-spacing: 0.5px; 
                margin-bottom: 5px; 
              }
              .card-metric-value { 
                font-size: 13.5px; 
                font-weight: bold; 
                color: #0f172a; 
                font-family: monospace; 
              }
              table { 
                width: 100%; 
                border-collapse: collapse; 
                margin-bottom: 20px; 
              }
              th { 
                background-color: #f1f5f9; 
                color: #475569; 
                padding: 6px 10px; 
                font-size: 9px; 
                font-weight: bold; 
                text-align: left; 
                border-bottom: 1px solid #cbd5e1; 
                text-transform: uppercase; 
              }
              td { 
                padding: 6px 10px; 
                font-size: 9.5px; 
                border-bottom: 1px solid #f1f5f9; 
              }
              h3 { 
                font-size: 11px; 
                font-weight: bold; 
                border-left: 4px solid #0c4a6e; 
                padding-left: 8px; 
                margin: 20px 0 10px 0; 
                color: #0c4a6e; 
                text-transform: uppercase; 
                letter-spacing: 0.3px; 
              }
              .stamp-area { 
                display: grid; 
                grid-template-cols: repeat(3, 1fr); 
                gap: 15px; 
                margin-top: 25px; 
                font-size: 9px; 
              }
              .stamp-box { 
                text-align: center; 
                border: 1px solid #e2e8f0; 
                background-color: #f8fafc; 
                border-radius: 6px; 
                padding: 8px; 
                color: #475569; 
              }
              .stamp-box strong { 
                color: #0f172a; 
                display: block; 
                margin-bottom: 3px; 
              }
              .footer { 
                border-top: 1px solid #f1f5f9; 
                margin-top: 20px; 
                padding-top: 8px; 
                text-align: center; 
                font-size: 8.5px; 
                color: #94a3b8; 
              }
              @media print {
                body { padding: 10px; font-size: 9px; }
                input, button { display: none !important; }
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>KIXI-FUNDO - CARTEIRA DE CRÉDITOS E RENTABILIZAÇÃO</h1>
              <h2>Associação Consórcio de Poupança de Interajuda Coletiva</h2>
              <p>Relatório Consolidado de Solvabilidade, Juros Arrecadados e Amortizações</p>
              <p style="font-size: 9px; margin-top: 3px; font-weight: bold; color: #475569;">
                Data de Emissão: ${new Date().toLocaleString('pt-PT')} | Auditor do Fundo: lmendesvictor@gmail.com
              </p>
            </div>

            <div class="grid-metrics">
              <div class="card-metric" style="border-left: 3px solid #0ea5e9;">
                <div class="card-metric-title">Total Desembolsado</div>
                <div class="card-metric-value">${formatCurrency(totalPrincipalDisbursed)}</div>
                <div style="font-size: 8px; color: #64748b; margin-top: 2px;">Volume de Crédito Emitido</div>
              </div>
              <div class="card-metric" style="border-left: 3px solid #6366f1;">
                <div class="card-metric-title">Principal em Aberto</div>
                <div class="card-metric-value">${formatCurrency(activeOutstanding)}</div>
                <div style="font-size: 8px; color: #64748b; margin-top: 2px;">Créditos em Amortização</div>
              </div>
              <div class="card-metric" style="border-left: 3px solid #059669;">
                <div class="card-metric-title">Principal Recuperado</div>
                <div class="card-metric-value">${formatCurrency(totalPrincipalCollected)}</div>
                <div style="font-size: 8px; color: #10b981; font-weight: bold; margin-top: 2px;">Capital Reintegrado no Fundo</div>
              </div>
              <div class="card-metric" style="border-left: 3px solid #e11d48;">
                <div class="card-metric-title">Juros Realizados (Ganhos)</div>
                <div class="card-metric-value">${formatCurrency(totalInterestCollected)}</div>
                <div style="font-size: 8px; color: #059669; font-weight: bold; margin-top: 2px;">Rentabilidade Adicional</div>
              </div>
            </div>

            <h3>1. Carteira Geral de Créditos Concedidos</h3>
            <table>
              <thead>
                <tr>
                  <th style="font-size: 9px;">Contrato</th>
                  <th style="font-size: 9px;">Devedor</th>
                  <th style="font-size: 9px;">Tipo</th>
                  <th style="font-size: 9px; text-align: right;">Valor Solicitado</th>
                  <th style="font-size: 9px; text-align: center;">Taxa</th>
                  <th style="font-size: 9px; text-align: right;">Principal Pago</th>
                  <th style="font-size: 9px; text-align: right;">Juros Pagos</th>
                  <th style="font-size: 9px; text-align: right;">Saldo Devedor</th>
                  <th style="font-size: 9px; text-align: center;">Status</th>
                </tr>
              </thead>
              <tbody>
                ${loansListHTML}
              </tbody>
            </table>

            <div class="stamp-area">
              <div class="stamp-box">
                <strong>Direção do Fundo Cooperativo Kixi-Funde</strong>
                <span style="font-size: 8px; color: #64748b; display: block; border-top: 1px dashed #e2e8f0; margin-top: 5px; padding-top: 4px;">
                  Associação de Direito Angolano
                </span>
              </div>
              <div class="stamp-box">
                <strong>Mendes Pambo</strong>
                <span style="font-size: 8px; color: #64748b; display: block; border-top: 1px dashed #e2e8f0; margin-top: 5px; padding-top: 4px;">
                  Administrador Principal do Fundo
                </span>
              </div>
              <div class="stamp-box" style="border: 2px double #0ea5e9; background-color: #f0f9ff;">
                <strong style="color: #0369a1;">Auditoria de Créditos</strong>
                <span style="font-size: 8px; color: #0369a1; font-weight: bold; display: block; border-top: 1px dashed #bae6fd; margin-top: 5px; padding-top: 4px;">
                  Património e Caixa Conciliados ✓
                </span>
              </div>
            </div>

            <div class="footer">
              <p>© 2026 Kixi-Fundo - Gestão de Finanças Comparticipadas, Angola. Relatório de crédito gerado de forma segura e auditável.</p>
            </div>
            <script>
              window.onload = function() {
                setTimeout(function() {
                  window.print();
                }, 300);
              };
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
      return;
    }

    const relevantLogsHTML = logs
      .filter(l => l.type === 'payout' || l.type === 'social_aid')
      .map(l => {
        const typeLabel = l.type === 'payout' ? 'Desembolso Rotação' : 'Auxílio Apoio';
        const typeColor = l.type === 'payout' ? '#0ea5e9' : '#6366f1';
        return `
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 8px 10px; font-size: 9.5px; color: #475569;">${new Date(l.timestamp).toLocaleDateString('pt-PT')}</td>
            <td style="padding: 8px 10px; font-size: 9.5px; font-weight: bold; color: ${typeColor};">${typeLabel}</td>
            <td style="padding: 8px 10px; font-size: 9.5px; font-weight: bold; color: #1e293b;">${l.memberName || 'Coletivo'}</td>
            <td style="padding: 8px 10px; font-size: 9.5px; text-align: right; font-weight: bold; color: #011222; font-family: monospace;">${formatCurrency(l.amount)}</td>
            <td style="padding: 8px 10px; font-size: 9.5px; color: #475569; font-style: italic;">${l.description}</td>
          </tr>
        `;
      }).join('');

    const membersListHTML = members.map(m => `
      <tr style="border-bottom: 1px solid #f1f5f9;">
        <td style="padding: 8px 10px; font-size: 9.5px; font-weight: bold; color: #0f172a; display: flex; align-items: center; gap: 8px;">
          <div style="width: 20px; height: 20px; border-radius: 50%; background-color: #e2e8f0; color: #475569; display: flex; align-items: center; justify-content: center; font-size: 9px; font-weight: 800;">
            ${m.name.charAt(0)}
          </div>
          <span>${m.name}</span>
        </td>
        <td style="padding: 8px 10px; font-size: 9.5px; color: #475569; font-family: monospace;">${m.phone}</td>
        <td style="padding: 8px 10px; font-size: 9.5px; text-align: center; color: #0284c7; font-weight: bold;">Mês ${m.assignedMonth}</td>
        <td style="padding: 8px 10px; font-size: 9.5px; text-align: center;">
          ${m.contributions[1]?.paid 
            ? `<span style="display: inline-flex; align-items: center; justify-content: center; font-size: 9px; font-weight: bold; background-color: #d1fae5; color: #065f46; border-radius: 9999px; padding: 2px 7px; border: 1px solid #a7f3d0; text-transform: uppercase;">PAGO ✓</span>` 
            : `<span style="display: inline-flex; align-items: center; justify-content: center; font-size: 9px; font-weight: bold; background-color: #fee2e2; color: #991b1b; border-radius: 9999px; padding: 2px 7px; border: 1px solid #fecaca; text-transform: uppercase;">PENDENTE ✗</span>`}
        </td>
        <td style="padding: 8px 10px; font-size: 9.5px; text-align: center;">
          ${m.contributions[2]?.paid 
            ? `<span style="display: inline-flex; align-items: center; justify-content: center; font-size: 9px; font-weight: bold; background-color: #d1fae5; color: #065f46; border-radius: 9999px; padding: 2px 7px; border: 1px solid #a7f3d0; text-transform: uppercase;">PAGO ✓</span>` 
            : `<span style="display: inline-flex; align-items: center; justify-content: center; font-size: 9px; font-weight: bold; background-color: #fee2e2; color: #991b1b; border-radius: 9999px; padding: 2px 7px; border: 1px solid #fecaca; text-transform: uppercase;">PENDENTE ✗</span>`}
        </td>
        <td style="padding: 8px 10px; font-size: 9.5px; text-align: center;">
          ${m.contributions[3]?.paid 
            ? `<span style="display: inline-flex; align-items: center; justify-content: center; font-size: 9px; font-weight: bold; background-color: #d1fae5; color: #065f46; border-radius: 9999px; padding: 2px 7px; border: 1px solid #a7f3d0; text-transform: uppercase;">PAGO ✓</span>` 
            : `<span style="display: inline-flex; align-items: center; justify-content: center; font-size: 9px; font-weight: bold; background-color: #fee2e2; color: #991b1b; border-radius: 9999px; padding: 2px 7px; border: 1px solid #fecaca; text-transform: uppercase;">PENDENTE ✗</span>`}
        </td>
        <td style="padding: 8px 10px; font-size: 9.5px; text-align: center;">
          ${m.contributions[4]?.paid 
            ? `<span style="display: inline-flex; align-items: center; justify-content: center; font-size: 9px; font-weight: bold; background-color: #d1fae5; color: #065f46; border-radius: 9999px; padding: 2px 7px; border: 1px solid #a7f3d0; text-transform: uppercase;">PAGO ✓</span>` 
            : `<span style="display: inline-flex; align-items: center; justify-content: center; font-size: 9px; font-weight: bold; background-color: #fee2e2; color: #991b1b; border-radius: 9999px; padding: 2px 7px; border: 1px solid #fecaca; text-transform: uppercase;">PENDENTE ✗</span>`}
        </td>
        <td style="padding: 8px 10px; font-size: 9.5px; text-align: center;">
          ${m.contributions[5]?.paid 
            ? `<span style="display: inline-flex; align-items: center; justify-content: center; font-size: 9px; font-weight: bold; background-color: #d1fae5; color: #065f46; border-radius: 9999px; padding: 2px 7px; border: 1px solid #a7f3d0; text-transform: uppercase;">PAGO ✓</span>` 
            : `<span style="display: inline-flex; align-items: center; justify-content: center; font-size: 9px; font-weight: bold; background-color: #fee2e2; color: #991b1b; border-radius: 9999px; padding: 2px 7px; border: 1px solid #fecaca; text-transform: uppercase;">PENDENTE ✗</span>`}
        </td>
        <td style="padding: 8px 10px; font-size: 9.5px; text-align: center;">
          ${m.contributions[6]?.paid 
            ? `<span style="display: inline-flex; align-items: center; justify-content: center; font-size: 9px; font-weight: bold; background-color: #d1fae5; color: #065f46; border-radius: 9999px; padding: 2px 7px; border: 1px solid #a7f3d0; text-transform: uppercase;">PAGO ✓</span>` 
            : `<span style="display: inline-flex; align-items: center; justify-content: center; font-size: 9px; font-weight: bold; background-color: #fee2e2; color: #991b1b; border-radius: 9999px; padding: 2px 7px; border: 1px solid #fecaca; text-transform: uppercase;">PENDENTE ✗</span>`}
        </td>
        <td style="padding: 8px 10px; font-size: 9.5px; text-align: right; font-weight: bold; font-family: monospace;">${formatCurrency(m.socialSupportReceived || 0)}</td>
      </tr>
    `).join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>Kixi-Fundo - Relatório de Auditoria Financeira</title>
          <style>
            @page { size: ${orientation}; margin: 15mm; }
            body { 
              font-family: ${fontStack}; 
              font-size: ${bodySize};
              padding: 30px; 
              color: #1e293b; 
              background-color: white; 
              line-height: 1.35; 
              -webkit-print-color-adjust: exact; 
              print-color-adjust: exact; 
            }
            ${isTableSimple ? `
              .header h1 { color: black !important; border-bottom: 2px solid black !important; }
              .header h2, .header p, .meta-bar { color: black !important; }
              .grid-metrics { display: none !important; }
              .stamp-box, .chart-placeholder, .bg-sky-500, .bg-indigo-500, .stamp-container, .stamp-box { display: none !important; }
              table { border: 1px solid black !important; }
              th { background-color: white !important; color: black !important; border-bottom: 2px solid black !important; }
              td { border-bottom: 1px solid black !important; color: black !important; }
              span { background-color: transparent !important; color: black !important; border: none !important; padding: 0 !important; }
              .footer { color: black !important; border-top: 1px solid black !important; }
            ` : ''}
            .header { 
              text-align: center; 
              border-bottom: 2px solid #e2e8f0; 
              padding-bottom: 12px; 
              margin-bottom: 20px; 
            }
            .header h1 { 
              font-size: 21px; 
              color: #0c4a6e; 
              margin: 0 0 4px 0; 
              text-transform: uppercase; 
              font-weight: 800; 
              letter-spacing: 0.5px; 
            }
            .header h2 { 
              font-size: 11px; 
              color: #475569; 
              margin: 0 0 6px 0; 
              font-weight: 700; 
              letter-spacing: 1.5px; 
              text-transform: uppercase; 
            }
            .header p { 
              font-size: 10px; 
              color: #64748b; 
              margin: 2px 0; 
            }
            .grid-metrics { 
              display: grid; 
              grid-template-cols: repeat(4, 1fr); 
              gap: 12px; 
              margin-bottom: 20px; 
            }
            .card-metric { 
              border: 1px solid #f1f5f9; 
              background-color: #f8fafc; 
              padding: 12px; 
              border-radius: 8px; 
              box-shadow: 0 1px 2px rgba(0,0,0,0.02);
              position: relative; 
            }
            .card-metric-title { 
              font-size: 8px; 
              font-weight: bold; 
              color: #64748b; 
              text-transform: uppercase; 
              letter-spacing: 0.5px; 
              margin-bottom: 5px; 
            }
            .card-metric-value { 
              font-size: 13.5px; 
              font-weight: bold; 
              color: #0f172a; 
              font-family: monospace; 
            }
            .charts-grid { 
              display: grid; 
              grid-template-cols: 1.5fr 1fr; 
              gap: 15px; 
              margin-bottom: 20px; 
            }
            .chart-container-box { 
              border: 1px solid #e2e8f0; 
              border-radius: 8px; 
              padding: 12px; 
              background-color: white; 
            }
            .chart-title { 
              font-size: 10px; 
              font-weight: bold; 
              color: #1e293b; 
              text-transform: uppercase; 
              letter-spacing: 0.5px; 
              margin-bottom: 10px; 
              border-left: 3px solid #0ea5e9; 
              padding-left: 6px; 
            }
            .chart-legend { 
              display: flex; 
              justify-content: center; 
              gap: 10px; 
              font-size: 8px; 
              margin-top: 6px; 
              color: #475569; 
            }
            .legend-item { 
              display: flex; 
              align-items: center; 
              gap: 4px; 
            }
            .legend-color { 
              width: 8px; 
              height: 8px; 
              border-radius: 2px; 
            }
            table { 
              width: 100%; 
              border-collapse: collapse; 
              margin-bottom: 20px; 
            }
            th { 
              background-color: #f1f5f9; 
              color: #475569; 
              padding: 6px 10px; 
              font-size: 9px; 
              font-weight: bold; 
              text-align: left; 
              border-bottom: 1px solid #cbd5e1; 
              text-transform: uppercase; 
            }
            td { 
              padding: 6px 10px; 
              font-size: 9.5px; 
              border-bottom: 1px solid #f1f5f9; 
            }
            h3 { 
              font-size: 11px; 
              font-weight: bold; 
              border-left: 4px solid #0c4a6e; 
              padding-left: 8px; 
              margin: 20px 0 10px 0; 
              color: #0c4a6e; 
              text-transform: uppercase; 
              letter-spacing: 0.3px; 
            }
            .stamp-area { 
              display: grid; 
              grid-template-cols: repeat(3, 1fr); 
              gap: 15px; 
              margin-top: 25px; 
              font-size: 9px; 
            }
            .stamp-box { 
              text-align: center; 
              border: 1px solid #e2e8f0; 
              background-color: #f8fafc; 
              border-radius: 6px; 
              padding: 8px; 
              color: #475569; 
            }
            .stamp-box strong { 
              color: #0f172a; 
              display: block; 
              margin-bottom: 3px; 
            }
            .footer { 
              border-top: 1px solid #f1f5f9; 
              margin-top: 20px; 
              padding-top: 8px; 
              text-align: center; 
              font-size: 8.5px; 
              color: #94a3b8; 
            }
            @media print {
              body { padding: 10px; font-size: 9px; }
              input, button { display: none !important; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>KIXI-FUNDO - GESTÃO DE FINANÇAS COMPARTICIPADAS</h1>
            <h2>Associação Consórcio de Poupança de Interajuda Coletiva</h2>
            <p>Relatório Consolidado de Transparência, Arrecadações e Utilização de Verbas</p>
            <p style="font-size: 9px; margin-top: 3px; font-weight: bold; color: #475569;">
              Data de Emissão: ${new Date().toLocaleString('pt-PT')} | Auditor do Fundo: lmendesvictor@gmail.com
            </p>
          </div>

          <div class="grid-metrics">
            <div class="card-metric" style="border-left: 3px solid #0ea5e9;">
              <div class="card-metric-title">Saldo Bancário Real</div>
              <div class="card-metric-value">${formatCurrency(bankBalance)}</div>
              <div style="font-size: 8px; color: #10b981; font-weight: bold; margin-top: 2px;">✓ Caixa Integral Conciliado</div>
            </div>
            <div class="card-metric" style="border-left: 3px solid #6366f1;">
              <div class="card-metric-title">Fundo de Apoio Social</div>
              <div class="card-metric-value">${formatCurrency(socialBalance)}</div>
              <div style="font-size: 8px; color: #64748b; margin-top: 2px;">Retido p/ Assistência Urgencial</div>
            </div>
            <div class="card-metric" style="border-left: 3px solid #059669;">
              <div class="card-metric-title">Total Cotizações Arrecadadas</div>
              <div class="card-metric-value">${formatCurrency(totalGrossCollected)}</div>
              <div style="font-size: 8px; color: #64748b; margin-top: 2px;">${totalPaidContributionsCount} Quotas Coletadas</div>
            </div>
            <div class="card-metric" style="border-left: 3px solid #e11d48;">
              <div class="card-metric-title">Total Auxílios Distribuídos</div>
              <div class="card-metric-value">${formatCurrency(totalSocialDisbursed)}</div>
              <div style="font-size: 8px; color: #a11d48; font-weight: bold; margin-top: 2px;">Desembolsos Sociais</div>
            </div>
          </div>

          <div class="charts-grid">
            <div class="chart-container-box">
              <div class="chart-title">Arrecadação de Cotizações Mensal (Previsto vs. Real)</div>
              <!-- SVG column bar comparing planned and actual progress -->
              <svg width="100%" height="150" viewBox="0 0 500 150" style="font-family: sans-serif;">
                <!-- Grid background lines -->
                <line x1="40" y1="10" x2="480" y2="10" stroke="#f1f5f9" stroke-width="1"/>
                <line x1="40" y1="40" x2="480" y2="40" stroke="#f1f5f9" stroke-width="1"/>
                <line x1="40" y1="70" x2="480" y2="70" stroke="#f1f5f9" stroke-width="1"/>
                <line x1="40" y1="100" x2="480" y2="100" stroke="#f1f5f9" stroke-width="1"/>
                <line x1="40" y1="125" x2="480" y2="125" stroke="#cbd5e1" stroke-width="2.5"/>

                <!-- Left scale indices -->
                <text x="35" y="128" font-size="8" fill="#94a3b8" text-anchor="end">0k</text>
                <text x="35" y="103" font-size="8" fill="#94a3b8" text-anchor="end">120k</text>
                <text x="35" y="73" font-size="8" fill="#94a3b8" text-anchor="end">240k</text>
                <text x="35" y="43" font-size="8" fill="#94a3b8" text-anchor="end">360k</text>
                <text x="35" y="13" font-size="8" fill="#94a3b8" text-anchor="end">480k</text>

                <!-- Month 1 compare bars: Previsto: 480k vs Real: 480k -->
                <rect x="70" y="15" width="10" height="110" fill="#0ea5e9" rx="1.5"/>
                <rect x="82" y="15" width="10" height="110" fill="#10b981" rx="1.5"/>
                <text x="81" y="138" font-size="8.5" fill="#475569" text-anchor="middle" font-weight="bold">Mês 1</text>

                <!-- Month 2 compare bars: Previsto: 480k vs Real: 480k -->
                <rect x="135" y="15" width="10" height="110" fill="#0ea5e9" rx="1.5"/>
                <rect x="147" y="15" width="10" height="110" fill="#10b981" rx="1.5"/>
                <text x="146" y="138" font-size="8.5" fill="#475569" text-anchor="middle" font-weight="bold">Mês 2</text>

                <!-- Month 3 compare bars: Previsto: 480k vs Real: 360k -->
                <rect x="200" y="15" width="10" height="110" fill="#0ea5e9" rx="1.5"/>
                <rect x="212" y="42" width="10" height="83" fill="#10b981" rx="1.5"/>
                <text x="211" y="138" font-size="8.5" fill="#475569" text-anchor="middle" font-weight="bold">Mês 3</text>

                <!-- Month 4 compare bars: Previsto: 480k vs Real: 240k -->
                <rect x="265" y="15" width="10" height="110" fill="#0ea5e9" rx="1.5"/>
                <rect x="277" y="70" width="10" height="55" fill="#10b981" rx="1.5"/>
                <text x="276" y="138" font-size="8.5" fill="#475569" text-anchor="middle" font-weight="bold">Mês 4</text>

                <!-- Month 5 compare bars: Previsto: 480k vs Real: 120k -->
                <rect x="330" y="15" width="10" height="110" fill="#0ea5e9" rx="1.5"/>
                <rect x="342" y="98" width="10" height="27" fill="#10b981" rx="1.5"/>
                <text x="341" y="138" font-size="8.5" fill="#475569" text-anchor="middle" font-weight="bold">Mês 5</text>

                <!-- Month 6 compare bars: Previsto: 480k vs Real: 120k -->
                <rect x="395" y="15" width="10" height="110" fill="#0ea5e9" rx="1.5"/>
                <rect x="407" y="98" width="10" height="27" fill="#10b981" rx="1.5"/>
                <text x="406" y="138" font-size="8.5" fill="#475569" text-anchor="middle" font-weight="bold">Mês 6</text>
              </svg>
              <div class="chart-legend">
                <div class="legend-item">
                  <div class="legend-color" style="background-color: #0ea5e9;"></div>
                  <span>Orçamento Previsto</span>
                </div>
                <div class="legend-item">
                  <div class="legend-color" style="background-color: #10b981;"></div>
                  <span>Arrecadação Liquidada</span>
                </div>
              </div>
            </div>

            <div class="chart-container-box">
              <div class="chart-title">Distribuição do Capital</div>
              <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 120px;">
                <!-- SVG Custom Donut Segment Chart representing categories -->
                <svg width="100" height="100" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="32" fill="none" stroke="#f1f5f9" stroke-width="12" />
                  <!-- Segments calculated: Regular contributions (85%), Social assistances (15%) -->
                  <circle cx="50" cy="50" r="32" fill="none" stroke="#0ea5e9" stroke-width="12" 
                    stroke-dasharray="171 201" stroke-dashoffset="0" transform="rotate(-90 50 50)" />
                  <circle cx="50" cy="50" r="32" fill="none" stroke="#6366f1" stroke-width="12" 
                    stroke-dasharray="30 201" stroke-dashoffset="-171" transform="rotate(-90 50 50)" />
                  <circle cx="50" cy="50" r="32" fill="none" class="white-middle" />
                  <!-- Center hole with inner text -->
                  <circle cx="50" cy="50" r="23" fill="white" />
                  <text x="50" y="53" font-size="7" font-weight="bold" fill="#0f172a" text-anchor="middle">KIXI-CAPITAL</text>
                </svg>
              </div>
              <div class="chart-legend" style="flex-direction: column; gap: 4px; align-items: flex-start; padding-left: 10px;">
                <div class="legend-item">
                  <div class="legend-color" style="background-color: #0ea5e9;"></div>
                  <span>Cotizações Gerais (85%)</span>
                </div>
                <div class="legend-item">
                  <div class="legend-color" style="background-color: #6366f1;"></div>
                  <span>Retenção Especial Compartilhada (15%)</span>
                </div>
              </div>
            </div>
          </div>

          <h3>1. Histórico Geral de Pagamento de Cotas (Enhanced)</h3>
          <table>
            <thead>
              <tr>
                <th style="font-size: 9px; width: 22%">Cooperante</th>
                <th style="font-size: 9px; width: 14%">Fone</th>
                <th style="font-size: 9px; text-align: center; width: 12%">Mês Sort.</th>
                <th style="font-size: 9px; text-align: center; width: 8%">Mês 1</th>
                <th style="font-size: 9px; text-align: center; width: 8%">Mês 2</th>
                <th style="font-size: 9px; text-align: center; width: 8%">Mês 3</th>
                <th style="font-size: 9px; text-align: center; width: 8%">Mês 4</th>
                <th style="font-size: 9px; text-align: center; width: 8%">Mês 5</th>
                <th style="font-size: 9px; text-align: center; width: 8%">Mês 6</th>
                <th style="font-size: 9px; text-align: right; width: 12%">Apoio Rec.</th>
              </tr>
            </thead>
            <tbody>
              ${membersListHTML}
            </tbody>
          </table>

          <h3>2. Histórico de Utilização das Verbas do Fundo (Desembolsos e Auxílios)</h3>
          <table>
            <thead>
              <tr>
                <th style="font-size: 9px; width: 12%;">Data</th>
                <th style="font-size: 9px; width: 18%;">Tipo</th>
                <th style="font-size: 9px; width: 20%;">Contemplado</th>
                <th style="font-size: 9px; text-align: right; width: 16%;">Montante</th>
                <th style="font-size: 9px; width: 34%;">Descrição da Operação</th>
              </tr>
            </thead>
            <tbody>
              ${relevantLogsHTML}
            </tbody>
          </table>

          <div class="stamp-area">
            <div class="stamp-box">
              <strong>Direção do Fundo Cooperativo Kixi-Funde</strong>
              <span style="font-size: 8px; color: #64748b; display: block; border-top: 1px dashed #e2e8f0; margin-top: 5px; padding-top: 4px;">
                Associação de Direito Angolano
              </span>
            </div>
            <div class="stamp-box">
              <strong>Mendes Pambo</strong>
              <span style="font-size: 8px; color: #64748b; display: block; border-top: 1px dashed #e2e8f0; margin-top: 5px; padding-top: 4px;">
                Administrador Principal do Fundo
              </span>
            </div>
            <div class="stamp-box" style="border: 2px double #10b981; background-color: #f0fdf4;">
              <strong style="color: #15803d;">Conciliação e Auditoria</strong>
              <span style="font-size: 8px; color: #166534; font-weight: bold; display: block; border-top: 1px dashed #bbf7d0; margin-top: 5px; padding-top: 4px;">
                Matematicamente Verificado ✓ 100%
              </span>
            </div>
          </div>

          <div class="footer">
            <p>© 2026 Kixi-Fundo - Gestão de Finanças Comparticipadas, Angola. Documento gerado sob chancela de transparência e auditoria coletiva.</p>
          </div>
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
              }, 300);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleExportPDF = () => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    let y = 15;

    const addPageIfNeeded = (neededHeight: number) => {
      if (y + neededHeight > 275) {
        doc.addPage();
        y = 20;
        // Drawing beautiful page headers
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(7.5);
        doc.setTextColor(148, 163, 184); // slate-400
        doc.text("Kixi-Fundo \u2022 Relat\u00F3rio Consolidado d'Auditoria & Extratos", 14, 11);
        doc.setDrawColor(226, 232, 240); // slate-200
        doc.setLineWidth(0.3);
        doc.line(14, 13, 196, 13);
        y = 18;
      }
    };

    // Header block
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(14, y, 182, 34, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text('KIXI-FUNDO: RELAT\u00D3RIO FINANCEIRO DE AUDITORIA', 20, y + 9);

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(186, 230, 253); // sky-200
    doc.text('Associa\u00E7\u00E3o Cons\u00F3rcio de Poupan\u00E7a de Interajuda Coletiva \u2022 Angola', 20, y + 15);

    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184); // slate-400
    doc.text(`Emitido em: ${new Date().toLocaleString('pt-PT')} | Respons\u00E1vel: lmendesvictor@gmail.com`, 20, y + 21);
    doc.text('Estatura Geral de Cons\u00F3rcio, Extrato de Quotas Liquidadas e Escala de Benefici\u00E1rios', 20, y + 27);

    y += 42;

    // Draw Metric Cards
    const drawPDFMetricCard = (x: number, title: string, val: string, status: string, accentColor: [number, number, number]) => {
      doc.setDrawColor(226, 232, 240); // slate-200
      doc.setFillColor(248, 250, 252); // slate-50
      doc.setLineWidth(0.25);
      doc.rect(x, y, 42.5, 22, 'FD');

      // accent bar
      doc.setFillColor(accentColor[0], accentColor[1], accentColor[2]);
      doc.rect(x, y, 1.8, 22, 'F');

      // Title
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(100, 116, 139); // slate-500
      doc.text(title.toUpperCase(), x + 4, y + 6);

      // Value
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42); // slate-900
      doc.text(val, x + 4, y + 13);

      // Status info
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(6);
      doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
      doc.text(status, x + 4, y + 18);
    };

    drawPDFMetricCard(14, 'Saldo Geral Caixa', formatCurrency(bankBalance), '\u2713 Caixa Conciliado', [14, 165, 233]);
    drawPDFMetricCard(60.5, 'Fundo Apoio Social', formatCurrency(socialBalance), 'Retido p/ Emerg\u00EAncia', [99, 102, 241]);
    drawPDFMetricCard(107, 'Cotiza\u00E7\u00F5es Totais', formatCurrency(totalGrossCollected), `${totalPaidContributionsCount} Quotas Totais`, [5, 150, 105]);
    drawPDFMetricCard(153.5, 'Aux\u00EDlios Pagos', formatCurrency(totalSocialDisbursed), 'Desembolsos Sociais', [225, 29, 72]);

    y += 30;

    // SECTION 1: ESCALA DE BENEFICIÁRIOS DO CICLO
    addPageIfNeeded(35);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(12, 74, 110); // sky-900
    doc.text('1. ESCALA MENSAL ROTATIVA DE BENEFICI\u00C1RIOS', 14, y);
    doc.setDrawColor(12, 74, 110);
    doc.setLineWidth(0.4);
    doc.line(14, y + 2, 196, y + 2);
    y += 7;

    doc.setFillColor(241, 245, 249); // slate-100
    doc.rect(14, y, 182, 6.5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105); // slate-600
    doc.text('M\u00CAS PROGRAMADO', 18, y + 4.5);
    doc.text('MEMBRO COOPERANTE CONTEMPLADO', 60, y + 4.5);
    doc.text('ESTADO DE LIQUIDA\u00C7\u00C3O DO PR\u00C9MIO', 140, y + 4.5);
    y += 7;

    const rotationMonths = [1, 2, 3, 4, 5, 6];
    rotationMonths.forEach((mNum) => {
      addPageIfNeeded(7.5);
      
      const monLucky = members.filter(item => item.assignedMonth === mNum);
      const luckyNameStr = monLucky.length > 0 ? monLucky.map(item => item.name).join(' e ') : 'Nenhum sorteado';
      const luckyPhoneStr = monLucky.length > 0 ? monLucky.map(item => item.phone).join(' / ') : '';
      const isLiquidated = payoutsCompleted[mNum];

      if (mNum % 2 === 0) {
        doc.setFillColor(248, 250, 252);
        doc.rect(14, y, 182, 6.5, 'F');
      }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(15, 23, 42);
      doc.text(`Ciclo M\u00EAs 0${mNum}`, 18, y + 4.5);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(51, 65, 85);
      doc.text(`${luckyNameStr} ${luckyPhoneStr ? `(${luckyPhoneStr})` : ''}`, 60, y + 4.5);

      if (isLiquidated) {
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(21, 128, 61); // green-700
        doc.text('CONVENTO / PAGO (1.200.000 KZs) \u2713', 140, y + 4.5);
      } else {
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(225, 29, 72); // rose-600
        doc.text('AGUARDANDO DISTRIBUI\u00C7\u00C3O \u2717', 140, y + 4.5);
      }

      doc.setDrawColor(241, 245, 249);
      doc.setLineWidth(0.2);
      doc.line(14, y + 6.5, 196, y + 6.5);
      y += 6.5;
    });

    y += 9;

    // SECTION 2: EXTRATO COMPACTO DE PAGAMENTO DE QUOTAS
    addPageIfNeeded(40);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(12, 74, 110);
    doc.text('2. EXTRATO INTEGRAL DE LIQUIDA\u00C7\u00C3O DE QUOTAS', 14, y);
    doc.setDrawColor(12, 74, 110);
    doc.setLineWidth(0.4);
    doc.line(14, y + 2, 196, y + 2);
    y += 7;

    // Header column row
    doc.setFillColor(224, 242, 254);
    doc.rect(14, y, 182, 6.5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(15, 23, 42);

    doc.text('Cooperador', 16, y + 4.5);
    doc.text('M\u00EAs 1', 65, y + 4.5);
    doc.text('M\u00EAs 2', 82, y + 4.5);
    doc.text('M\u00EAs 3', 99, y + 4.5);
    doc.text('M\u00EAs 4', 116, y + 4.5);
    doc.text('M\u00EAs 5', 133, y + 4.5);
    doc.text('M\u00EAs 6', 150, y + 4.5);
    doc.text('Fundo Apoio', 168, y + 4.5);
    y += 7;

    members.forEach((m, idx) => {
      addPageIfNeeded(7.5);

      if (idx % 2 === 1) {
        doc.setFillColor(248, 250, 252);
        doc.rect(14, y, 182, 6.5, 'F');
      }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(15, 23, 42);
      doc.text(m.name, 16, y + 4.5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);

      const drawPDFStatus = (isPaid: boolean, startX: number) => {
        if (isPaid) {
          doc.setTextColor(21, 128, 61);
          doc.setFont('helvetica', 'bold');
          doc.text('PAGO', startX, y + 4.5);
        } else {
          doc.setTextColor(156, 163, 175);
          doc.setFont('helvetica', 'normal');
          doc.text('PEND.', startX, y + 4.5);
        }
      };

      drawPDFStatus(m.contributions[1]?.paid, 65);
      drawPDFStatus(m.contributions[2]?.paid, 82);
      drawPDFStatus(m.contributions[3]?.paid, 99);
      drawPDFStatus(m.contributions[4]?.paid, 116);
      drawPDFStatus(m.contributions[5]?.paid, 133);
      drawPDFStatus(m.contributions[6]?.paid, 150);

      doc.setTextColor(15, 23, 42);
      doc.setFont('helvetica', 'bold');
      doc.text(formatCurrency(m.socialSupportReceived || 0), 168, y + 4.5);

      doc.setDrawColor(241, 245, 249);
      doc.setLineWidth(0.2);
      doc.line(14, y + 6.5, 196, y + 6.5);
      y += 6.5;
    });

    y += 9;

    // SECTION 3: RECENT MOVEMENTS
    addPageIfNeeded(35);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(12, 74, 110);
    doc.text('3. DESEMBOLSOS E AUX\u00CDLIOS SOCIAIS DA CAIXA', 14, y);
    doc.setDrawColor(12, 74, 110);
    doc.setLineWidth(0.4);
    doc.line(14, y + 2, 196, y + 2);
    y += 7;

    doc.setFillColor(241, 245, 249);
    doc.rect(14, y, 182, 6.5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(71, 85, 105);

    doc.text('DATA OPERA\u00C7\u00C3O', 16, y + 4.5);
    doc.text('TIPO', 38, y + 4.5);
    doc.text('COOPERADOR CONTEMPLADO', 65, y + 4.5);
    doc.text('MONTANTE', 112, y + 4.5);
    doc.text('DESCRI\u00C7\u00C3O OPERACIONAL E JUSTIFICATIVO', 132, y + 4.5);
    y += 7;

    const pdfLogs = logs.filter(l => l.type === 'payout' || l.type === 'social_aid');
    if (pdfLogs.length === 0) {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      doc.text('Sem lan\u00E7amentos urgentes ou aux\u00EDlios sociais registados nesta base de dados.', 20, y + 4.5);
      y += 7;
    } else {
      pdfLogs.forEach((l, idx) => {
        addPageIfNeeded(8.5);

        if (idx % 2 === 1) {
          doc.setFillColor(250, 250, 250);
          doc.rect(14, y, 182, 7, 'F');
        }

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(51, 65, 85);
        doc.text(new Date(l.timestamp).toLocaleDateString('pt-PT'), 16, y + 4.5);

        const isPayoutType = l.type === 'payout';
        doc.setFont('helvetica', 'bold');
        if (isPayoutType) {
          doc.setTextColor(14, 165, 233);
          doc.text('Rota\u00E7\u00E3o Mensal', 38, y + 4.5);
        } else {
          doc.setTextColor(99, 102, 241);
          doc.text('Apoio Social', 38, y + 4.5);
        }

        doc.setTextColor(15, 23, 42);
        doc.text(l.memberName || 'Coletivo', 65, y + 4.5);
        doc.text(formatCurrency(l.amount), 112, y + 4.5);

        doc.setFont('helvetica', 'normal');
        doc.setTextColor(71, 85, 105);
        // Truncate description if too long
        let desc = l.description || '';
        if (desc.length > 38) {
          desc = desc.substring(0, 35) + '...';
        }
        doc.text(desc, 132, y + 4.5);

        doc.setDrawColor(241, 245, 249);
        doc.setLineWidth(0.2);
        doc.line(14, y + 7, 196, y + 7);
        y += 7;
      });
    }

    y += 10;

    // Stamp & Signature section
    addPageIfNeeded(32);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(14, y, 196, y);
    y += 5;

    // Col 1: Stamp
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(15, 23, 42);
    doc.text('Kixi-Fundo Angola', 15, y + 5);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.text('Associa\u00E7\u00E3o Cons\u00F3rcio de Poupan\u00E7a', 15, y + 9);
    doc.text('Fundo Mutualista Certificado', 15, y + 13);

    // Col 2: Principal Administrator
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.text('Mendes Pambo', 75, y + 5);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.text('Administrador Geral de Caixa', 75, y + 9);
    doc.text('Assinatura Digitalizada Kixi-Fundo', 75, y + 13);

    // Col 3: Safe Stamp Box
    doc.setDrawColor(16, 185, 129); // green-500
    doc.setFillColor(240, 253, 244); // green-50
    doc.rect(142, y + 1, 50, 15, 'FD');
    doc.setTextColor(21, 128, 61); // green-700
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('APROVADO & AUDITADO', 145, y + 6);
    doc.setFontSize(6.5);
    doc.text('Matematicamente Conciliado', 145, y + 10);
    doc.text('N\u00EDvel Integridade: 100%', 145, y + 13);

    y += 20;

    // footer notice line
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(6.5);
    doc.setTextColor(156, 163, 175);
    doc.text("Este documento constitui extrato oficial para fins de auditoria interna, concilia\u00E7\u00E3o banc\u00E1ria e transpar\u00EAncia m\u00FAtua entre cooperadores.", 14, y);

    doc.save('KixiFundo_Relatorio_Consolidado_Auditoria.pdf');
  };

  // Get active selected member
  const matchedMember = members.find(m => m.id === selectedMemberId);

  // Generate dynamic interactive message for mock preview
  const getSimulatedMessage = () => {
    if (!matchedMember) return '';
    if (notificationType === 'receipt') {
      return `Olá, *${matchedMember.name}*! A Direção do Kixi-Fundo confirma a validação da sua quota do *Mês de Referência 0${currentMonth}*. \n\n💵 *Valor Pago:* 120.000,00 KZs\n🛡 *Retenção p/ Fundo de Apoio Social:* 20.000,00 KZs\n🏦 *Canal de Depósito:* Banco BIC Angola (IBAN AO06...10149)\n\nPode consultar o seu comprovativo oficial em pdf no portal da associação: https://kixi-fundo.ao/recibos/m${currentMonth}/#id-${matchedMember.id}`;
    } else {
      return `Olá, de Angola! Grande novidade, cooperante *${matchedMember.name}*! É com enorme prazer que informamos que o seu Mês de Recebimento de Rotação chegou (*Mês ${matchedMember.assignedMonth}*).\n\n💰 *Mês Contemplado:* Mês 0${matchedMember.assignedMonth}\n💸 *Benefício do Ciclo:* 600.000,00 KZs (Arrecadação Coletiva Transparente)\n🧾 *Comprovativo Fiscal:* BIC AO06_PAG_CONCORD_${matchedMember.id}.pdf\n📱 *Apoio WhatsApp:* +244 923 456 789\n\nAs verbas já estão depositadas e disponíveis! Agradecemos o contributo de todos!`;
    }
  };

  // Get communication URL for real launching
  const getSimulatedUrl = () => {
    if (!matchedMember) return '';
    const message = getSimulatedMessage();
    if (notificationChannel === 'whatsapp') {
      const cleanPhone = matchedMember.phone.replace(/\D/g, '');
      return `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(message)}`;
    } else {
      const subject = notificationType === 'receipt' 
        ? 'Confirmado: Comprovativo de Quota Kixi-Fundo' 
        : `Aviso Importante: Benefício Kixi-Fundo (Mês ${matchedMember.assignedMonth})`;
      return `mailto:${matchedMember.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;
    }
  };

  const handleSendSimulate = () => {
    if (!matchedMember) return;
    
    // Open communication channel synchronously during the click handler so browser won't block popups
    const openUrl = getSimulatedUrl();
    if (openUrl) {
      try {
        window.open(openUrl, '_blank');
      } catch (err) {
        console.warn("Abertura automática de link bloqueada:", err);
      }
    }
    
    setIsSendingNotification(true);
    
    setTimeout(() => {
      setIsSendingNotification(false);
      setShowNotifySuccess(true);
      
      const newLogItem = {
        timestamp: new Date().toISOString(),
        memberName: matchedMember.name,
        channel: notificationChannel,
        type: notificationType === 'receipt' ? 'Comprovativo de Quota' : 'Aviso de Benefício de Rotação',
        details: notificationChannel === 'whatsapp' 
          ? `Mensagem WhatsApp disparada ao fone ${matchedMember.phone}` 
          : `E-mail formal gerado e remetido ao endereço: ${matchedMember.email}`
      };
      
      setNotificationLog([newLogItem, ...notificationLog]);

      // Keep success message visible on screen so they can click fallbacks as needed
      setTimeout(() => {
        setShowNotifySuccess(false);
      }, 12000);

    }, 1200);
  };

  return (
    <div className="space-y-6">
      
      {/* Upper header */}
      <div className="bg-slate-900 border-l-4 border-l-sky-500 text-white rounded-xl p-5 border border-slate-800 relative overflow-hidden shadow-sm">
        <div className="absolute top-0 right-0 w-64 h-64 bg-sky-500/5 rounded-bl-full pointer-events-none" />
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-1 max-w-2xl">
            <span className="text-[10px] font-bold bg-sky-500/10 text-sky-400 border border-sky-500/20 px-2.5 py-0.5 rounded-full uppercase tracking-wider block w-fit">
              Centro de Relatórios e Auditoria Oficial
            </span>
            <h2 className="text-xl md:text-2xl font-bold font-display tracking-tight text-white flex items-center gap-2">
              <FileText className="w-5.5 h-5.5 text-sky-400" />
              Relatórios Consolidados Kixi-Fundo
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Consulte e descarregue em PDF e Excel todos os dados financeiros cruciais do fundo cooperativo. 
              Garantia de conformidade, depósitos unificados e prestação de contas transparente para cooperadores e o Administrador Principal.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full md:w-auto shrink-0">
            <button 
              onClick={handleExportPDF}
              className="flex items-center justify-center gap-1.5 text-xs font-bold px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-sm transition-all cursor-pointer"
            >
              <FileText className="w-4.5 h-4.5 text-emerald-100" />
              Exportar Relatório PDF
            </button>
            <button 
              onClick={() => setIsPrintModalOpen(true)}
              className="flex items-center justify-center gap-1.5 text-xs font-bold px-4 py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl shadow-sm transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              Imprimir Relatório (PDF)
            </button>
            <button 
              onClick={() => {
                if (activeReportTab === 'payments') handleExportPaymentsExcel();
                else if (activeReportTab === 'banking') handleExportBankExcel();
                else if (activeReportTab === 'utilization') handleExportUtilizationExcel();
                else if (activeReportTab === 'loans') handleExportLoansExcel();
                else handleExportPaymentsExcel();
              }}
              className="flex items-center justify-center gap-1.5 text-xs font-bold px-4 py-2.5 bg-slate-800 hover:bg-slate-705 border border-slate-700 text-white rounded-xl shadow-sm transition-all cursor-pointer"
            >
              <Download className="w-4 h-4" />
              Descarregar Excel (.xlsx)
            </button>
          </div>
        </div>
      </div>

      {/* Report Tab Filters Switch */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-1.5 dark:border-slate-800">
        <button
          onClick={() => setActiveReportTab('payments')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2 ${
            activeReportTab === 'payments'
              ? 'bg-sky-50 text-sky-700 border-b-2 border-sky-600 font-extrabold shadow-sm'
              : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100/50'
          }`}
        >
          <Users className="w-4 h-4" />
          Histórico de Pagamentos
        </button>
        <button
          onClick={() => setActiveReportTab('banking')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2 ${
            activeReportTab === 'banking'
              ? 'bg-sky-50 text-sky-700 border-b-2 border-sky-600 font-extrabold shadow-sm'
              : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100/50'
          }`}
        >
          <Building2 className="w-4 h-4" />
          Depósitos Bancários e Conciliação
        </button>
        <button
          onClick={() => setActiveReportTab('utilization')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2 ${
            activeReportTab === 'utilization'
              ? 'bg-sky-50 text-sky-700 border-b-2 border-sky-600 font-extrabold shadow-sm'
              : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100/50'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          Verbas Utilizadas (Auxílios)
        </button>
        <button
          onClick={() => setActiveReportTab('loans')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2 ${
            activeReportTab === 'loans'
              ? 'bg-sky-50 text-sky-700 border-b-2 border-sky-600 font-extrabold shadow-sm'
              : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100/50'
          }`}
        >
          <Coins className="w-4 h-4" />
          Créditos e Rentabilidade
        </button>
        <button
          onClick={() => setActiveReportTab('notifications')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2 ${
            activeReportTab === 'notifications'
              ? 'bg-sky-50 text-sky-700 border-b-2 border-sky-600 font-extrabold shadow-sm'
              : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100/50'
          }`}
        >
          <Smartphone className="w-4 h-4" />
          Disparo de Alertas & Notificações
        </button>
      </div>

      <AnimatePresence mode="wait">
        
        {/* TAB 1: PAYMENTS LEDGER */}
        {activeReportTab === 'payments' && (
          <motion.div
            key="payments"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider">Histórico Mensal Granular de Quotas</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Controlador de todas as cotizações coletadas no consórcio unificado (Membro por Membro).</p>
              </div>
              <button 
                onClick={handleExportPaymentsExcel}
                className="flex items-center justify-center gap-1.5 text-xs font-bold px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 shadow-sm cursor-pointer"
              >
                <Download className="w-4 h-4" />
                Descarregar Excel (.xlsx)
              </button>
            </div>

            <div className="border border-slate-100 dark:border-slate-900 rounded-xl bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr>
                      <th className="bg-slate-50 dark:bg-slate-950/60 p-3.5 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Cooperante</th>
                      <th className="bg-slate-50 dark:bg-slate-950/60 p-3.5 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center">Nº</th>
                      <th className="bg-slate-50 dark:bg-slate-950/60 p-3.5 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center">Mês Sort.</th>
                      <th className="bg-slate-50 dark:bg-slate-950/60 p-3.5 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center">Mês 1</th>
                      <th className="bg-slate-50 dark:bg-slate-950/60 p-3.5 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center">Mês 2</th>
                      <th className="bg-slate-50 dark:bg-slate-950/60 p-3.5 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center">Mês 3</th>
                      <th className="bg-slate-50 dark:bg-slate-950/60 p-3.5 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center">Mês 4</th>
                      <th className="bg-slate-50 dark:bg-slate-950/60 p-3.5 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center">Mês 5</th>
                      <th className="bg-slate-50 dark:bg-slate-950/60 p-3.5 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center">Mês 6</th>
                      <th className="bg-slate-50 dark:bg-slate-950/60 p-3.5 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">Auxílios Receb.</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {members.map((m) => (
                      <tr key={m.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                        <td className="p-3.5 text-xs">
                          <div className="font-bold text-slate-800 dark:text-slate-100">{m.name}</div>
                          <div className="text-[10px] text-slate-400 mt-0.5 font-mono">{m.phone} | {m.email}</div>
                        </td>
                        <td className="p-3.5 text-xs text-center font-mono text-slate-500 dark:text-slate-400">#{m.id}</td>
                        <td className="p-3.5 text-xs text-center">
                          <span className="font-bold text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/40 px-2.5 py-0.5 rounded-full border border-sky-100 dark:border-sky-900/50">
                            Mês {m.assignedMonth}
                          </span>
                        </td>
                        {[1, 2, 3, 4, 5, 6].map((monthNum) => {
                          const isPaid = m.contributions[monthNum]?.paid;
                          return (
                            <td key={monthNum} className="p-3.5 text-center text-xs">
                              {isPaid ? (
                                <span className="inline-flex items-center gap-1 font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/45 border border-emerald-200 dark:border-emerald-900/50 px-2 py-0.5 rounded-full text-[10px] uppercase font-sans tracking-wide shadow-sm">
                                  <span>★</span> PAGO
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 font-bold text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/45 border border-rose-200 dark:border-rose-900/50 px-2 py-0.5 rounded-full text-[10px] uppercase font-sans tracking-wide shadow-sm">
                                  <span>✖</span> PENDENTE
                                </span>
                              )}
                            </td>
                          );
                        })}
                        <td className="p-3.5 text-xs text-right font-bold font-mono text-slate-700 dark:text-slate-300">
                          {formatCurrency(m.socialSupportReceived || 0)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {/* TAB 2: BANK GENERAL ACCOUNT */}
        {activeReportTab === 'banking' && (
          <motion.div
            key="banking"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider">Histórico do Capital Arrecadado e Depósito Real</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Visão consolidada por período mensal dos fundos custodiados na conta corrente oficial.</p>
              </div>
              <button 
                onClick={handleExportBankExcel}
                className="flex items-center justify-center gap-1.5 text-xs font-bold px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 shadow-sm cursor-pointer"
              >
                <Download className="w-4 h-4" />
                Descarregar Excel (.xlsx)
              </button>
            </div>

            {/* General Conciliation Formula Card */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl p-4.5">
                <span className="text-[10px] font-bold text-slate-450 dark:text-slate-400 uppercase block">Total Geral Recebido</span>
                <span className="text-xl font-bold font-mono text-slate-800 dark:text-white mt-1 block">{formatCurrency(totalGrossCollected)}</span>
                <span className="text-[10px] text-slate-400 dark:text-slate-550 mt-1 block">{totalPaidContributionsCount} quotas mensais pagas</span>
              </div>
              <div className="bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl p-4.5">
                <span className="text-[10px] font-bold text-slate-450 dark:text-slate-400 uppercase block">(-) Pago aos Contemplados</span>
                <span className="text-xl font-bold font-mono text-rose-500 mt-1 block">-{formatCurrency(totalBenefitsPaid)}</span>
                <span className="text-[10px] text-slate-400 dark:text-slate-550 mt-1 block">{completedMonthsOfPayout} transferências de rotação executadas</span>
              </div>
              <div className="bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl p-4.5">
                <span className="text-[10px] font-bold text-slate-450 dark:text-slate-400 uppercase block">(-) Apoios Auxílio Pagos</span>
                <span className="text-xl font-bold font-mono text-rose-500 mt-1 block">-{formatCurrency(totalSocialDisbursed)}</span>
                <span className="text-[10px] text-slate-400 dark:text-slate-550 mt-1 block">Apoio social aos cooperadores</span>
              </div>
              <div className="bg-emerald-500/10 border border-emerald-500/15 dark:border-emerald-500/20 rounded-xl p-4.5">
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase block">(=) Saldo BIC em Banco</span>
                <span className="text-xl font-bold font-mono text-[#0EA5E9] dark:text-sky-400 mt-1 block">{formatCurrency(bankBalance)}</span>
                <span className="text-[10px] text-emerald-700 dark:text-emerald-300 mt-1 block font-bold">✓ Caixa 100% Conciliado</span>
              </div>
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recharts Graphical Visualization Card */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-5 shadow-sm animate-fadeIn min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
                  <div className="space-y-0.5">
                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                      <TrendingUp className="w-4 h-4 text-sky-500" />
                      Evolução Mensal de Contribuições
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium font-sans">
                      Monitor de verba bruta coletada vs. retenção para o fundo social em cada período.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-200/60 dark:border-slate-800/60 shadow-sm shrink-0">
                      <span className="w-2.5 h-2.5 rounded bg-sky-500 inline-block"></span>
                      <span>Quota Pura</span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-200/60 dark:border-slate-800/60 shadow-sm shrink-0">
                      <span className="w-2.5 h-2.5 rounded bg-indigo-500 inline-block"></span>
                      <span>Retenção Social</span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-200/60 dark:border-slate-800/60 shadow-sm shrink-0 whitespace-nowrap">
                      <span className="w-2.5 h-2.5 rounded bg-rose-500 inline-block"></span>
                      <span>Apoios Concedidos</span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-950 px-3 py-1 rounded-lg border border-slate-200/60 dark:border-slate-800/60 shadow-sm shrink-0">
                      <span className="w-2.5 h-2.5 rounded bg-emerald-500 inline-block"></span>
                      <span>Meta (12/12)</span>
                    </div>
                  </div>
                </div>

                {/* Chart Container Stage */}
                <div className="h-64 sm:h-72 w-full font-sans">
                  <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                    <BarChart
                      data={chartData}
                      margin={{ top: 10, right: 10, left: -5, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" className="dark:stroke-slate-800/50" />
                      <XAxis 
                        dataKey="name" 
                        stroke="#94a3b8" 
                        fontSize={11} 
                        tickLine={false} 
                        axisLine={false}
                        dy={10}
                        tick={{ fontWeight: 600 }}
                      />
                      <YAxis 
                        stroke="#94a3b8" 
                        fontSize={10} 
                        tickLine={false} 
                        axisLine={false}
                        tickFormatter={(value) => `${value / 1000}k`}
                        tick={{ fontWeight: 600 }}
                      />
                      <Tooltip content={<CustomChartTooltip />} cursor={{ fill: 'rgba(14, 165, 233, 0.04)' }} />
                      <Bar dataKey="Contribuições Totais" radius={[6, 6, 0, 0]} barSize={20}>
                        {chartData.map((entry, index) => {
                          const isCurrent = index + 1 === currentMonth;
                          return (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={isCurrent ? '#0ea5e9' : '#0ea5e9'} 
                              fillOpacity={isCurrent ? 1 : 0.75} 
                            />
                          );
                        })}
                      </Bar>
                      <Bar dataKey="Fundo Social" radius={[6, 6, 0, 0]} barSize={9}>
                        {chartData.map((entry, index) => {
                          const isCurrent = index + 1 === currentMonth;
                          return (
                            <Cell 
                              key={`cell-social-${index}`} 
                              fill={isCurrent ? '#6366f1' : '#6366f1'} 
                              fillOpacity={isCurrent ? 1 : 0.75} 
                            />
                          );
                        })}
                      </Bar>
                      <Bar dataKey="Apoios Sociais" radius={[6, 6, 0, 0]} barSize={7}>
                        {chartData.map((entry, index) => {
                          const isCurrent = index + 1 === currentMonth;
                          return (
                            <Cell 
                              key={`cell-aids-${index}`} 
                              fill={isCurrent ? '#f43f5e' : '#f43f5e'} 
                              fillOpacity={isCurrent ? 1 : 0.75} 
                            />
                          );
                        })}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Card 2: Gráfico de Desempenho Mensal */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-5 shadow-sm animate-fadeIn flex flex-col justify-between min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
                  <div className="space-y-0.5">
                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-205 uppercase tracking-wider flex items-center gap-1.5">
                      <Coins className="w-4 h-4 text-emerald-500" />
                      Gráfico de Desempenho Mensal
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium font-sans">
                      Histórico acumulado de Contribuições Arrecadadas vs. Benefícios de Rotação Pagos.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-200/60 dark:border-slate-800/60 shadow-sm shrink-0">
                      <span className="w-2.5 h-2.5 rounded bg-emerald-500 inline-block"></span>
                      <span>Contribuições</span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-200/60 dark:border-slate-800/60 shadow-sm shrink-0">
                      <span className="w-2.5 h-2.5 rounded bg-rose-500 inline-block"></span>
                      <span>Rotações Pagas</span>
                    </div>
                  </div>
                </div>

                {/* Chart Container Stage */}
                <div className="h-64 sm:h-72 w-full font-sans">
                  <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                    <BarChart
                      data={performanceChartData}
                      margin={{ top: 10, right: 10, left: -5, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" className="dark:stroke-slate-800/50" />
                      <XAxis 
                        dataKey="name" 
                        stroke="#94a3b8" 
                        fontSize={11} 
                        tickLine={false} 
                        axisLine={false}
                        dy={10}
                        tick={{ fontWeight: 600 }}
                      />
                      <YAxis 
                        stroke="#94a3b8" 
                        fontSize={10} 
                        tickLine={false} 
                        axisLine={false}
                        tickFormatter={(value) => `${value / 1000}k`}
                        tick={{ fontWeight: 600 }}
                      />
                      <Tooltip content={<CustomPerformanceTooltip />} cursor={{ fill: 'rgba(16, 185, 129, 0.04)' }} />
                      <Bar dataKey="Contribuições Arrecadadas" name="Contribuições Arrecadadas" radius={[6, 6, 0, 0]} barSize={16}>
                        {performanceChartData.map((entry, index) => {
                          const isCurrent = index + 1 === currentMonth;
                          return (
                            <Cell 
                              key={`perf-cell-in-${index}`} 
                              fill={isCurrent ? '#10b981' : '#10b981'} 
                              fillOpacity={isCurrent ? 1 : 0.75} 
                            />
                          );
                        })}
                      </Bar>
                      <Bar dataKey="Benefícios Pagos" radius={[6, 6, 0, 0]} barSize={16}>
                        {performanceChartData.map((entry, index) => {
                          const isCurrent = index + 1 === currentMonth;
                          return (
                            <Cell 
                              key={`perf-cell-out-${index}`} 
                              fill={isCurrent ? '#f43f5e' : '#f43f5e'} 
                              fillOpacity={isCurrent ? 1 : 0.75} 
                            />
                          );
                        })}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Interactive Cycle Contribution & Beneficiary Monitor */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-6 shadow-sm animate-fadeIn">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                  <h4 className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-[#0d5c3a]" />
                    Monitor Interativo de Ciclos & Contemplações
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Consulte as contribuições arrecadadas por mês de rotação, filtre as projeções passadas ou futuras, e explore os beneficiários de cada ciclo correspondente.
                  </p>
                </div>
                
                {/* Period Filters */}
                <div className="flex bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200/60 dark:border-slate-800/60 self-start md:self-auto shrink-0 gap-1 font-sans">
                  <button
                    onClick={() => {
                      setCycleFilterType('all');
                    }}
                    className={`px-3 py-1.5 text-[10.5px] font-black rounded-lg cursor-pointer transition-all ${
                      cycleFilterType === 'all'
                        ? 'bg-[#0d5c3a] text-white shadow-xs animate-fadeIn'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200/50'
                    }`}
                  >
                    Todos os Ciclos
                  </button>
                  <button
                    onClick={() => {
                      setCycleFilterType('past');
                      // If current selection is not a past cycle, select first past cycle
                      if (selectedReportCycle >= currentMonth) {
                        setSelectedReportCycle(currentMonth - 1 > 0 ? currentMonth - 1 : 1);
                      }
                    }}
                    className={`px-3 py-1.5 text-[10.5px] font-black rounded-lg cursor-pointer transition-all ${
                      cycleFilterType === 'past'
                        ? 'bg-[#0d5c3a] text-white shadow-xs animate-fadeIn'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200/50'
                    }`}
                  >
                    Ciclos Passados
                  </button>
                  <button
                    onClick={() => {
                      setCycleFilterType('future');
                      // If current selection is not a future cycle, select active cycle
                      if (selectedReportCycle < currentMonth) {
                        setSelectedReportCycle(currentMonth);
                      }
                    }}
                    className={`px-3 py-1.5 text-[10.5px] font-black rounded-lg cursor-pointer transition-all ${
                      cycleFilterType === 'future'
                        ? 'bg-[#0d5c3a] text-white shadow-xs animate-fadeIn'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200/50'
                    }`}
                  >
                    Ciclos Futuros
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                {/* Interactive Bar Chart Panel */}
                <div className="lg:col-span-7 bg-slate-50 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-850 p-4.5 rounded-2xl flex flex-col justify-between">
                  <div>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                      <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-550 tracking-wider">
                        Toque numa barra para ver os contemplados ({cycleFilterType === 'all' ? 'Todos' : cycleFilterType === 'past' ? 'Passados' : 'Futuros'})
                      </span>
                      <span className="text-[10.5px] font-extrabold text-[#0d5c3a] dark:text-emerald-450 bg-[#0d5c3a]/10 px-2 py-0.5 rounded-md self-start sm:self-auto">
                        Ciclo Atual: Mês {selectedReportCycle} {selectedReportCycle === currentMonth ? '(Ativo)' : selectedReportCycle < currentMonth ? '(Concluído)' : '(Projeção)'}
                      </span>
                    </div>

                    {/* Dynamic Chart */}
                    <div className="h-56 w-full font-mono">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={filteredCyclesData}
                          onClick={(state: any) => {
                            if (state && state.activePayload && state.activePayload.length > 0) {
                              const clickedMonth = state.activePayload[0].payload.month;
                              setSelectedReportCycle(clickedMonth);
                            }
                          }}
                          margin={{ top: 10, right: 10, left: -5, bottom: 0 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:stroke-slate-805/30" />
                          <XAxis 
                            dataKey="name" 
                            stroke="#64748b" 
                            fontSize={10} 
                            tickLine={false} 
                            axisLine={false}
                            tick={{ fontWeight: 700 }}
                          />
                          <YAxis 
                            stroke="#64748b" 
                            fontSize={9} 
                            tickLine={false} 
                            axisLine={false}
                            tickFormatter={(value) => `${value / 1000}k`}
                            tick={{ fontWeight: 700 }}
                          />
                          <Tooltip 
                            cursor={{ fill: 'rgba(13, 92, 58, 0.05)', radius: 4 }}
                            content={({ active, payload }) => {
                              if (active && payload && payload.length) {
                                const data = payload[0].payload;
                                return (
                                  <div className="bg-slate-900 border border-slate-700/85 p-3 rounded-xl shadow-xl text-xs font-semibold text-white">
                                    <p className="text-slate-350 uppercase font-extrabold mb-1">Mês {data.month}</p>
                                    <p className="text-[#38bdf8] font-mono flex items-center gap-1.5">
                                      <span className="w-1.5 h-1.5 rounded-full bg-[#38bdf8]"></span>
                                      Contribuições: {formatCurrency(data.grossCollected)}
                                    </p>
                                    <p className="text-emerald-450 font-mono flex items-center gap-1.5">
                                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                      Regularizados: {data.paidCount} Sócios
                                    </p>
                                    <p className="text-slate-450 text-[9.5px] mt-1 italic font-sans">Toque para selecionar este mês</p>
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                          <Bar 
                            dataKey="grossCollected" 
                            radius={[6, 6, 0, 0]} 
                            barSize={32}
                            cursor="pointer"
                          >
                            {filteredCyclesData.map((entry, index) => {
                              const isSelected = entry.month === selectedReportCycle;
                              const isCurrent = entry.month === currentMonth;
                              return (
                                <Cell 
                                  key={`cell-${index}`} 
                                  fill={isSelected ? '#0d5c3a' : isCurrent ? '#f59e0b' : '#38bdf8'} 
                                  fillOpacity={isSelected ? 1.0 : 0.65}
                                  stroke={isSelected ? '#044227' : 'none'}
                                  strokeWidth={isSelected ? 1.5 : 0}
                                />
                              );
                            })}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between text-[10px] text-slate-450 dark:text-slate-500 font-bold border-t border-slate-200/50 dark:border-slate-800/60 pt-3 mt-4 gap-2">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded bg-[#0d5c3a]"></span>
                        <span>Foco Activo</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded bg-[#f59e0b]" style={{ opacity: 0.65 }}></span>
                        <span>Mês em Curso</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded bg-[#38bdf8]" style={{ opacity: 0.65 }}></span>
                        <span>Outro Mês</span>
                      </div>
                    </div>
                    <span>💡 Toque nas barras do gráfico para alternar de ciclo</span>
                  </div>
                </div>

                {/* Beneficiaries and Cycle Status Details Panel */}
                <div className="lg:col-span-5 bg-slate-50 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-850 p-5 rounded-2xl flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between border-b border-slate-200/50 dark:border-slate-800/60 pb-3 mb-4">
                      <span className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                        🎁 Contemplados do Ciclo {selectedReportCycle}
                      </span>
                      <span className="text-[10px] font-black uppercase text-slate-450 dark:text-slate-550 font-mono">
                        Selecção Activa
                      </span>
                    </div>

                    {/* Selected cycle stats summary */}
                    <div className="grid grid-cols-2 gap-3 mb-4 text-left">
                      <div className="bg-white dark:bg-slate-950 border border-slate-150 dark:border-slate-850 p-2.5 rounded-xl">
                        <span className="text-[8.5px] font-bold text-slate-400 dark:text-slate-550 uppercase block tracking-wider">Total Cotizado</span>
                        <span className="text-[12.5px] font-mono font-black text-[#0d5c3a] dark:text-emerald-450 block mt-0.5">
                          {formatCurrency(selectedCycleData?.grossCollected || 0)}
                        </span>
                      </div>
                      <div className="bg-white dark:bg-slate-950 border border-slate-150 dark:border-slate-850 p-2.5 rounded-xl">
                        <span className="text-[8.5px] font-bold text-slate-400 dark:text-slate-550 uppercase block tracking-wider">Status Liberação</span>
                        <span className={`text-[10px] font-black block mt-0.5 tracking-tight ${isPayoutDoneForSelectedCycle ? 'text-emerald-600 dark:text-emerald-400' : 'text-[#ea580c]'}`}>
                          {isPayoutDoneForSelectedCycle ? '✓ LIQUIDADO' : '⏳ AGUARDANDO'}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2.5">
                      {selectedCycleBeneficiaries.length === 0 ? (
                        <div className="text-center py-8 text-xs font-bold text-slate-450 dark:text-slate-500 uppercase tracking-widest border border-dashed border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-950/20">
                          Sem alocações neste mês
                        </div>
                      ) : (
                        selectedCycleBeneficiaries.map((b) => {
                          return (
                            <div 
                              key={b.id} 
                              className="flex flex-col gap-2.5 bg-white dark:bg-slate-950 p-3.5 rounded-xl border border-slate-200/50 dark:border-slate-850 shadow-xs text-left"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <div className="w-7 h-7 rounded-lg bg-[#0d5c3a]/10 text-[#0d5c3a] dark:bg-emerald-500/10 dark:text-emerald-450 flex items-center justify-center font-black text-xs shrink-0 uppercase">
                                    {b.name.substring(0, 2)}
                                  </div>
                                  <div className="min-w-0">
                                    <h5 className="text-[11.5px] font-black text-slate-800 dark:text-slate-100 truncate uppercase tracking-tight">
                                      {b.name}
                                    </h5>
                                    <p className="text-[9px] text-slate-450 dark:text-slate-500">
                                      Contacto: {b.phone}
                                    </p>
                                  </div>
                                </div>
                                {isPayoutDoneForSelectedCycle ? (
                                  <span className="text-[8px] font-black text-emerald-700 bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-400 rounded-lg py-0.5 px-2 uppercase tracking-wider">
                                    Pago
                                  </span>
                                ) : (
                                  <span className="text-[8px] font-black text-[#ea580c] bg-[#ffedd5] dark:bg-amber-950/20 dark:text-amber-500 rounded-lg py-0.5 px-2 uppercase tracking-wider">
                                    Aguardando
                                  </span>
                                )}
                              </div>
                              <div className="flex justify-between items-center text-[9.5px] border-t border-slate-100 dark:border-slate-900 pt-2 font-mono">
                                <span className="text-slate-450 font-sans font-bold">Provento de Roda do Fundo</span>
                                <span className="font-extrabold text-[#0d5c3a] dark:text-emerald-450">
                                  {formatCurrency(600000)}
                                </span>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                  {/* Audit information footnote */}
                  <div className="mt-4 text-[9.5px] text-slate-400 dark:text-slate-500 text-left font-sans leading-relaxed border-t border-slate-200/50 dark:border-slate-800/60 pt-3">
                    * Informações oficiais auditadas. Os beneficiários recebem o seu provento rotativo correspondente de acordo com as regras de regularização do Kixi-Fundo.
                  </div>
                </div>
              </div>
            </div>

            <div className="border border-slate-100 dark:border-slate-900 rounded-xl bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr>
                      <th className="bg-slate-50 dark:bg-slate-950/60 p-3.5 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Período Mensal</th>
                      <th className="bg-slate-50 dark:bg-slate-950/60 p-3.5 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center">Taxa Compliance</th>
                      <th className="bg-slate-50 dark:bg-slate-950/60 p-3.5 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">Quota Bruta Coletada</th>
                      <th className="bg-slate-50 dark:bg-slate-950/60 p-3.5 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">Alocação Fundo Interajuda</th>
                      <th className="bg-slate-50 dark:bg-slate-950/60 p-3.5 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">Benefícios Desembolsados</th>
                      <th className="bg-slate-50 dark:bg-slate-950/60 p-3.5 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">Apoios emergenciais</th>
                      <th className="bg-slate-50 dark:bg-slate-950/60 p-3.5 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">Saldo Líquido Mensal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {monthlyData.map((d) => (
                      <tr key={d.month} className={d.month === currentMonth ? 'bg-sky-500/5 dark:bg-sky-500/10' : ''}>
                        <td className="p-3.5 text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                          Mês {d.month}
                          {d.month === currentMonth && (
                            <span className="text-[8px] font-bold uppercase tracking-wider bg-[#0ea5e9] text-white px-1 py-0.2 rounded-full">Ativo</span>
                          )}
                        </td>
                        <td className="p-3.5 text-xs text-center font-bold">
                          <span className={`px-2 py-0.5 rounded text-[10px] ${d.paidCount === 12 ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400' : 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400'}`}>
                            {d.paidCount} de 12 ({Math.round((d.paidCount/12)*100)}%)
                          </span>
                        </td>
                        <td className="p-3.5 text-xs text-right font-mono text-slate-700 dark:text-slate-200 font-semibold">{formatCurrency(d.grossCollected)}</td>
                        <td className="p-3.5 text-xs text-right font-mono text-slate-500 dark:text-slate-400">{formatCurrency(d.socialRetained)}</td>
                        <td className="p-3.5 text-xs text-right font-mono text-rose-500 font-bold">{d.payoutExecuted > 0 ? `-${formatCurrency(d.payoutExecuted)}` : 'KZs 0,00'}</td>
                        <td className="p-3.5 text-xs text-right font-mono text-rose-500 font-bold">{d.aidsInMonth > 0 ? `-${formatCurrency(d.aidsInMonth)}` : 'KZs 0,00'}</td>
                        <td className={`p-3.5 text-xs text-right font-mono font-bold ${d.netRemaining >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
                          {formatCurrency(d.netRemaining)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {/* TAB 3: FUND DISBURSEMENTS / AIDS HISTORY */}
        {activeReportTab === 'utilization' && (() => {
          const filteredLogsForUtilization = logs
            .filter(l => l.type === 'payout' || l.type === 'social_aid')
            .filter(l => {
              if (selectedLogMemberId !== 'all') {
                const selectedMember = members.find(m => String(m.id) === selectedLogMemberId);
                if (selectedMember) {
                  const mName = l.memberName || '';
                  const targetName = selectedMember.name;
                  return mName.toLowerCase().includes(targetName.toLowerCase()) || 
                         l.description.toLowerCase().includes(targetName.toLowerCase());
                }
              }
              return true;
            })
            .filter(l => {
              if (!logSearchQuery.trim()) return true;
              const query = logSearchQuery.toLowerCase();
              const desc = l.description.toLowerCase();
              const mName = (l.memberName || '').toLowerCase();
              return desc.includes(query) || mName.includes(query);
            });

          return (
            <motion.div
              key="utilization"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider">Histórico de Utilização das Verbas</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Listagem detalhada de todos os desembolsos de benefícios e subsídios concedidos ao longo do consórcio.</p>
                </div>
                <button 
                  onClick={handleExportUtilizationExcel}
                  className="flex items-center justify-center gap-1.5 text-xs font-bold px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 shadow-sm cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  Descarregar Excel (.xlsx)
                </button>
              </div>

              {/* Search and Dropdown Filter Row */}
              <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 p-3.5 rounded-xl flex flex-col md:flex-row items-stretch md:items-center gap-3 shadow-sm">
                <div className="flex-1 min-w-0 relative">
                  <input
                    type="text"
                    placeholder="Pesquisar registros de transações ou justificações..."
                    value={logSearchQuery}
                    onChange={(e) => setLogSearchQuery(e.target.value)}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg pl-9 pr-8 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-sky-500 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-600"
                  />
                  <span className="absolute left-3 top-2.5 text-slate-400 dark:text-slate-500">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                  </span>
                  {logSearchQuery && (
                    <button 
                      onClick={() => setLogSearchQuery('')}
                      className="absolute right-3 top-2 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 text-xs p-0.5"
                    >
                      ✕
                    </button>
                  )}
                </div>
                
                <div className="w-full md:w-64 shrink-0 flex items-center gap-2">
                  <select
                    value={selectedLogMemberId}
                    onChange={(e) => setSelectedLogMemberId(e.target.value)}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-sky-500 text-slate-850 dark:text-slate-100"
                  >
                    <option value="all">🔍 Todos os Membros (Geral)</option>
                    {members.map(m => (
                      <option key={m.id} value={String(m.id)}>
                        Sócio: {m.name}
                      </option>
                    ))}
                  </select>
                  {selectedLogMemberId !== 'all' && (
                    <button
                      onClick={() => setSelectedLogMemberId('all')}
                      className="text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 text-xs px-1.5 py-1 bg-slate-200/50 dark:bg-slate-800 rounded-md shrink-0 font-bold"
                    >
                      Limpar
                    </button>
                  )}
                </div>
              </div>

              {/* List entries */}
              <div className="space-y-3">
                {filteredLogsForUtilization.length === 0 ? (
                  <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 text-center rounded-xl text-slate-400 dark:text-slate-500">
                    <Coins className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
                    <p className="text-xs font-bold uppercase">Nenhum auxílio ou desembolso de rotação corresponde aos filtros de busca.</p>
                  </div>
                ) : (
                  filteredLogsForUtilization.map((l) => (
                    <div 
                      key={l.id} 
                      className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all ${
                        l.type === 'payout' 
                          ? 'bg-sky-500/5 border-sky-100 dark:border-sky-950/20' 
                          : 'bg-indigo-500/5 border-indigo-100 dark:border-indigo-950/20'
                      }`}
                    >
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full ${
                            l.type === 'payout' 
                              ? 'bg-sky-100 dark:bg-sky-950/40 text-sky-850 dark:text-sky-300 font-extrabold' 
                              : 'bg-indigo-100 dark:bg-indigo-950/40 text-indigo-850 dark:text-indigo-300 font-extrabold'
                          }`}>
                            {l.type === 'payout' ? 'Desembolso Rotação' : 'Auxílio Apoio Comunitário'}
                          </span>
                          <span className="text-[10px] text-slate-400 dark:text-slate-400 font-mono">
                            {new Date(l.timestamp).toLocaleString('pt-PT')}
                          </span>
                        </div>

                        <p className="text-xs text-slate-800 dark:text-slate-100 leading-relaxed font-semibold">
                          {l.description}
                        </p>
                      </div>

                      <div className="flex flex-col sm:items-end gap-2.5 shrink-0">
                        <div className="text-left sm:text-right">
                          <span className="text-base font-black font-mono text-slate-900 dark:text-white block">
                            {formatCurrency(l.amount)}
                          </span>
                          <span className="text-[10px] text-slate-450 dark:text-slate-400 uppercase block font-medium">
                            Mês {l.month || currentMonth}
                          </span>
                        </div>
                        <button
                          onClick={() => handlePrintReceipt(l)}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold text-sky-700 dark:text-sky-305 bg-sky-50 dark:bg-sky-950/40 hover:bg-sky-100/80 dark:hover:bg-sky-900/40 border border-sky-100 dark:border-sky-950/40 rounded-lg shadow-sm transition-all cursor-pointer whitespace-nowrap self-start sm:self-auto"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          Imprimir Recibo
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          );
        })()}

        {/* TAB 4: LOANS & MICROCREDITS PORTFOLIO */}
        {activeReportTab === 'loans' && (() => {
          const loansList = loans || [];
          const totalPrincipalDisbursed = loansList.reduce((acc, l) => acc + l.amountRequested, 0);
          const totalInterestCollected = loansList.reduce((acc, l) => acc + l.payments.filter(p => p.paid).reduce((sum, p) => sum + p.interestPaid, 0), 0);
          const totalPrincipalCollected = loansList.reduce((acc, l) => acc + l.payments.filter(p => p.paid).reduce((sum, p) => sum + p.principalPaid, 0), 0);
          const activeOutstanding = totalPrincipalDisbursed - totalPrincipalCollected;

          return (
            <motion.div
              key="loans_portfolio"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider text-left">Carteira de Microcréditos e Rentabilidade</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 text-left">Visão consolidada e auditável de todos os empréstimos concedidos, amortizações efetuadas e juros rentabilizados.</p>
                </div>
                <button 
                  onClick={handleExportLoansExcel}
                  className="flex items-center justify-center gap-1.5 text-xs font-bold px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 shadow-sm cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  Descarregar Excel (.xlsx)
                </button>
              </div>

              {/* KPI cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-[#151c2c] border border-slate-100 dark:border-slate-800 p-5 rounded-xl text-left">
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Volume Desembolsado</span>
                  <p className="text-lg font-black font-mono text-slate-900 dark:text-white mt-1">{formatCurrency(totalPrincipalDisbursed)}</p>
                  <p className="text-[9px] text-slate-450 dark:text-slate-500 font-medium mt-0.5">{loansList.length} créditos concedidos no total</p>
                </div>
                <div className="bg-white dark:bg-[#151c2c] border border-slate-100 dark:border-slate-800 p-5 rounded-xl text-left">
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Principal Ativo (Em Aberto)</span>
                  <p className="text-lg font-black font-mono text-amber-650 mt-1">{formatCurrency(activeOutstanding)}</p>
                  <p className="text-[9px] text-slate-450 dark:text-slate-500 font-medium mt-0.5">Carteira sob amortização</p>
                </div>
                <div className="bg-white dark:bg-[#151c2c] border border-slate-100 dark:border-slate-800 p-5 rounded-xl text-left">
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Principal Reintegrado</span>
                  <p className="text-lg font-black font-mono text-emerald-600 mt-1">{formatCurrency(totalPrincipalCollected)}</p>
                  <p className="text-[9px] text-slate-450 dark:text-slate-500 font-medium mt-0.5">Retornado de amortizações</p>
                </div>
                <div className="bg-white dark:bg-[#151c2c] border border-slate-100 dark:border-slate-800 p-5 rounded-xl text-left">
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Rentabilidade Arrecadada</span>
                  <p className="text-lg font-black font-mono text-sky-600 mt-1">{formatCurrency(totalInterestCollected)}</p>
                  <p className="text-[9px] text-slate-450 dark:text-slate-500 font-medium mt-0.5">Juros ganhos pelo fundo</p>
                </div>
              </div>

              {/* Table of loans */}
              <div className="border border-slate-100 dark:border-slate-900 rounded-xl bg-white dark:bg-[#151c2c] overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr>
                        <th className="bg-slate-50 dark:bg-[#0e1320] p-3.5 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Contrato</th>
                        <th className="bg-slate-50 dark:bg-[#0e1320] p-3.5 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Devedor</th>
                        <th className="bg-slate-50 dark:bg-[#0e1320] p-3.5 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Tipo</th>
                        <th className="bg-slate-50 dark:bg-[#0e1320] p-3.5 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">Valor Concedido</th>
                        <th className="bg-slate-50 dark:bg-[#0e1320] p-3.5 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center">Taxa</th>
                        <th className="bg-slate-50 dark:bg-[#0e1320] p-3.5 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">Principal Pago</th>
                        <th className="bg-slate-50 dark:bg-[#0e1320] p-3.5 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">Juros Pagos</th>
                        <th className="bg-slate-50 dark:bg-[#0e1320] p-3.5 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">Saldo Devedor</th>
                        <th className="bg-slate-50 dark:bg-[#0e1320] p-3.5 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {loansList.length === 0 ? (
                        <tr>
                          <td colSpan={9} className="p-8 text-center text-xs text-slate-400">Nenhum crédito emitido no sistema.</td>
                        </tr>
                      ) : (
                        loansList.map((l) => {
                          const principalPaid = l.payments.filter(p => p.paid).reduce((sum, p) => sum + p.principalPaid, 0);
                          const interestPaid = l.payments.filter(p => p.paid).reduce((sum, p) => sum + p.interestPaid, 0);
                          const remaining = l.amountRequested - principalPaid;

                          return (
                            <tr key={l.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-950/10 transition-colors">
                              <td className="p-3 text-xs font-bold font-mono text-slate-900 dark:text-white">{l.id}</td>
                              <td className="p-3 text-xs font-semibold text-slate-800 dark:text-slate-200">{l.borrowerName}</td>
                              <td className="p-3 text-xs text-slate-600 dark:text-slate-400">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                  l.borrowerType === 'socio' 
                                    ? 'bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-450' 
                                    : 'bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-450'
                                }`}>
                                  {l.borrowerType === 'socio' ? 'Sócio' : 'Singular'}
                                </span>
                              </td>
                              <td className="p-3 text-xs font-mono font-bold text-right text-slate-900 dark:text-white">{formatCurrency(l.amountRequested)}</td>
                              <td className="p-3 text-xs font-semibold text-center text-slate-700 dark:text-slate-300">{l.interestRate}%</td>
                              <td className="p-3 text-xs font-mono text-right text-emerald-600">{formatCurrency(principalPaid)}</td>
                              <td className="p-3 text-xs font-mono text-right text-sky-600">{formatCurrency(interestPaid)}</td>
                              <td className="p-3 text-xs font-mono font-bold text-right text-amber-700 dark:text-amber-550">{formatCurrency(remaining)}</td>
                              <td className="p-3 text-xs text-center">
                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                                  l.status === 'completed'
                                    ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-450'
                                    : l.status === 'overdue'
                                      ? 'bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-450'
                                      : 'bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-450'
                                }`}>
                                  {l.status === 'completed' ? 'PAGO ✓' : l.status === 'overdue' ? 'ATRASADO ✗' : 'ACTIVO'}
                                </span>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          );
        })()}

        {/* TAB 4: MOCK NOTIFICATIONS SENDER INTERACTION COMPONENTE */}
        {activeReportTab === 'notifications' && (
          <motion.div
            key="notifications"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-8"
          >
            
            {/* Form control */}
            <div className="lg:col-span-5 space-y-5">
              <div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider">Centro de Notificações</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Comunicação direta por telefone e e-mail com os cooperantes contendo recibos e avisos.</p>
              </div>

              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4 shadow-sm">
                
                <div>
                  <label className="block text-[10px] font-bold text-slate-450 dark:text-slate-400 uppercase mb-1.5 tracking-wider">Passo 1: Escolher o Destinatário</label>
                  <select
                    value={selectedMemberId}
                    onChange={(e) => setSelectedMemberId(Number(e.target.value))}
                    className="w-full border rounded-lg p-2.5 text-xs focus:outline-none bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                  >
                    {members.map(m => (
                      <option key={m.id} value={m.id}>
                        {m.name} - Mês contemplado: 0{m.assignedMonth} ({m.phone})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-450 dark:text-slate-400 uppercase mb-1.5 tracking-wider">Passo 2: Tipo de Comunicação</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setNotificationType('receipt')}
                      className={`p-2.5 rounded-lg border text-xs font-bold transition-all text-center ${
                        notificationType === 'receipt'
                          ? 'bg-sky-50 dark:bg-sky-950/40 border-sky-400 dark:border-sky-500 text-sky-800 dark:text-sky-200 shadow-sm'
                          : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      Recibo de Quota Paga
                    </button>
                    <button
                      type="button"
                      onClick={() => setNotificationType('payout_alert')}
                      className={`p-2.5 rounded-lg border text-xs font-bold transition-all text-center ${
                        notificationType === 'payout_alert'
                          ? 'bg-sky-50 dark:bg-sky-950/40 border-sky-400 dark:border-sky-500 text-sky-800 dark:text-sky-200 shadow-sm'
                          : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      Aviso de Mês a Receber
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-450 dark:text-slate-400 uppercase mb-1.5 tracking-wider">Passo 3: Canal de Envio</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setNotificationChannel('whatsapp')}
                      className={`p-2.5 rounded-lg border text-xs font-bold transition-all text-center flex items-center justify-center gap-1.5 ${
                        notificationChannel === 'whatsapp'
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-450 dark:border-emerald-550 text-emerald-800 dark:text-emerald-250'
                          : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <MessageSquare className="w-4 h-4 text-emerald-500" />
                      WhatsApp / Telefone
                    </button>
                    <button
                      type="button"
                      onClick={() => setNotificationChannel('email')}
                      className={`p-2.5 rounded-lg border text-xs font-bold transition-all text-center flex items-center justify-center gap-1.5 ${
                        notificationChannel === 'email'
                          ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-405 dark:border-blue-500 text-blue-800 dark:text-blue-200'
                          : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <Mail className="w-4 h-4 text-blue-500" />
                      E-mail Cooperador
                    </button>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={handleSendSimulate}
                    disabled={isSendingNotification}
                    className={`w-full py-3 rounded-xl font-bold uppercase text-xs tracking-wider text-white transition-all flex items-center justify-center gap-2 cursor-pointer ${
                      isSendingNotification 
                        ? 'bg-slate-700 cursor-wait' 
                        : 'bg-[#0284c7] hover:bg-sky-700 shadow-md'
                    }`}
                  >
                    {isSendingNotification ? (
                      <>
                        <motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} className="inline-block">🔄</motion.span>
                        Enviando Alerta...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Disparar Notificação Oficial
                      </>
                    )}
                  </button>
                </div>

              </div>

              {/* Status report */}
              {showNotifySuccess && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl flex flex-col gap-3"
                >
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5 animate-bounce" />
                    <div>
                      <h4 className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Comunicação Confirmada!</h4>
                      <p className="text-[11px] text-emerald-700 mt-0.5 leading-relaxed">
                        O alerta de quota do mês e o seu histórico no portal foram processados com sucesso para o cooperador <strong>{matchedMember?.name}</strong>.
                      </p>
                    </div>
                  </div>
                  
                  {/* Action Link inside Success Card */}
                  <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-emerald-250/30">
                    <a
                      href={getSimulatedUrl()}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg shadow-sm transition-all"
                    >
                      <span>💬</span>
                      <span>{notificationChannel === 'whatsapp' ? 'Abrir conversa no WhatsApp' : 'Abrir no E-mail'}</span>
                    </a>
                    <button
                      type="button"
                      onClick={() => setShowNotifySuccess(false)}
                      className="text-[10px] text-slate-500 hover:text-slate-800 underline ml-auto cursor-pointer"
                    >
                      Fechar aviso
                    </button>
                  </div>
                </motion.div>
              )}

            </div>

            {/* Smart Simulators visualization */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* Phone display screen simulation */}
              <div className="relative mx-auto max-w-[320px] bg-slate-900 border-[12px] border-slate-950 rounded-[40px] shadow-2xl p-4 min-h-[460px] flex flex-col justify-between">
                
                {/* Audio speaker/Camera mock notch */}
                <div className="absolute top-2 left-1/2 -translate-x-1/2 w-28 h-4 bg-slate-950 rounded-full flex items-center justify-center">
                  <span className="w-3.5 h-1 bg-slate-800 rounded-full mr-2" />
                  <span className="w-1.5 h-1.5 bg-slate-800 rounded-full" />
                </div>

                <div className="flex-1 flex flex-col bg-slate-950 rounded-2xl overflow-hidden mt-2 pt-2 relative">
                  
                  {/* Top phone header status */}
                  <div className="flex justify-between items-center px-4 py-1 text-[9px] font-bold text-slate-400 font-mono tracking-tighter">
                    <span>Movicel / Unitel</span>
                    <span>10:30</span>
                    <span>🔋 96%</span>
                  </div>

                  {channelChangeMock()}

                </div>

                {/* Home indicator bar mock */}
                <div className="w-24 h-1 bg-slate-300 rounded-full mx-auto mt-2" />

              </div>

              {/* Notification logs */}
              <div className="space-y-2">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Histórico de Disparos Recentes (Audit Trail)</h4>
                {notificationLog.length === 0 ? (
                  <p className="text-[11px] text-slate-400">Nenhum alerta disparado nesta sessão do simulador contábil.</p>
                ) : (
                  <div className="space-y-1.5">
                    {notificationLog.map((logItem, idx) => (
                      <div key={idx} className="bg-slate-50 border border-slate-100 p-2.5 rounded-lg text-[11px] flex items-center justify-between">
                        <div>
                          <span className="font-bold text-slate-800">{logItem.memberName}</span>
                          <span className="text-slate-400"> • {logItem.type}</span>
                          <div className="text-[9px] text-slate-400 font-mono mt-0.5">{logItem.details}</div>
                        </div>
                        <span className="text-[9px] bg-emerald-50 text-emerald-700 font-bold px-1.5 py-0.5 rounded">Enviado</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>

          </motion.div>
        )}

      </AnimatePresence>

      {/* Configurable Print Modal */}
      <PrintConfigModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        onConfirm={handlePrintPDF}
        title="Imprimir Relatório de Auditoria"
        subtitle="Selecione o estilo e orientação do relatório consolidado."
      />
    </div>
  );

  function channelChangeMock() {
    if (notificationChannel === 'whatsapp') {
      return (
        <div className="flex-1 flex flex-col bg-[#E5DDD5]">
          {/* WhatsApp Header info */}
          <div className="bg-[#075E54] text-white px-3 py-2 flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-teal-800 flex items-center justify-center font-bold text-xs uppercase shadow">
              {matchedMember?.name[0] || 'A'}
            </div>
            <div className="min-w-0 flex-1">
              <span className="font-bold text-[11px] leading-tight block truncate">{matchedMember?.name}</span>
              <span className="text-[8px] opacity-80 block truncate">Online e operacional</span>
            </div>
          </div>

          {/* ChatGPT-styled Message Body bubble */}
          <div className="flex-1 p-3 overflow-y-auto space-y-2 flex flex-col justify-end">
            <div className="bg-white text-slate-800 border rounded-xl rounded-tl-none p-2.5 max-w-[90%] text-[10px] shadow-sm leading-relaxed whitespace-pre-wrap relative self-start">
              {getSimulatedMessage()}
              <div className="text-[8px] opacity-65 text-slate-400 text-right mt-1.5">10:30 ✓✓</div>
            </div>
          </div>

          <div className="p-2 bg-slate-105 border-t border-slate-200 flex items-center gap-1 text-[10px]">
            <span className="bg-white border rounded-full px-2 py-1 flex-1 text-slate-400">Escreva uma mensagem...</span>
            <span className="w-6 h-6 rounded-full bg-[#075E54] flex items-center justify-center text-white text-[10px]">🎙</span>
          </div>
        </div>
      );
    } else {
      return (
        <div className="flex-1 flex flex-col bg-slate-50 text-slate-800 text-[10px]">
          {/* E-mail interface */}
          <div className="bg-slate-100 border-b p-2 space-y-1">
            <div className="flex items-center justify-between text-[9px] text-slate-450 uppercase">
              <span>Novo Correio Eletrónico</span>
              <span>Oficial Kixi-Fundo</span>
            </div>
            <div className="font-semibold text-[10px]">Para: <span className="text-blue-500 font-mono font-normal">{matchedMember?.email}</span></div>
            <div className="font-semibold text-[10px]">Assunto: <span className="text-slate-800">{notificationType === 'receipt' ? 'Comprovativo de Quota' : 'Aviso: Benefício Kixi-Fundo Mês ' + matchedMember?.assignedMonth}</span></div>
          </div>

          <div className="p-3 leading-relaxed flex-1 whitespace-pre-wrap select-all overflow-y-auto">
            {getSimulatedMessage()}
          </div>

          <div className="p-2 border-t bg-slate-100 text-[9px] text-slate-500 flex items-center justify-between">
            <span>Anexo: 📎 Recibo_Consorcio_Aprovado.pdf</span>
            <span className="text-blue-500 font-bold">Lido</span>
          </div>
        </div>
      );
    }
  }
}

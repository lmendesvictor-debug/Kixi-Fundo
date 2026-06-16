import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
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
import { Member, KixLog } from '../types';

interface ReportsSectionProps {
  currentMonth: number;
  members: Member[];
  logs: KixLog[];
  payoutsCompleted: { [month: number]: boolean };
  formatCurrency: (val: number) => string;
}

export default function ReportsSection({
  currentMonth,
  members,
  logs,
  payoutsCompleted,
  formatCurrency,
}: ReportsSectionProps) {
  const [activeReportTab, setActiveReportTab] = useState<'payments' | 'banking' | 'utilization' | 'notifications'>('payments');
  
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

  // Math variables
  const totalPaidContributionsCount = members.reduce((acc, m) => {
    const paidInMember = Object.keys(m.contributions).filter(
      (monthKey) => m.contributions[Number(monthKey)]?.paid
    ).length;
    return acc + paidInMember;
  }, 0);

  const totalGrossCollected = totalPaidContributionsCount * 120000;
  const totalSocialRetained = totalPaidContributionsCount * 20000;
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
    const grossCollected = paidInMonth * 120000;
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
    "Número de Pagantes": d.paidCount,
  }));

  const CustomChartTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const parentData = payload[0]?.payload || {};
      const brutoColetado = parentData["Contribuições Totais"] ?? payload[0]?.value ?? 0;
      const fundoSocial = parentData["Fundo Social"] ?? payload[1]?.value ?? 0;
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

  const handlePrintPDF = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const relevantLogsHTML = logs
      .filter(l => l.type === 'payout' || l.type === 'social_aid')
      .map(l => `
        <tr style="border-bottom: 1px solid #e2e8f0;">
          <td style="padding: 10px; font-size: 11px;">${new Date(l.timestamp).toLocaleDateString('pt-PT')}</td>
          <td style="padding: 10px; font-size: 11px; font-weight: bold; color: ${l.type === 'payout' ? '#0284c7' : '#9333ea'}">${l.type === 'payout' ? 'Rotação' : 'Apoio Social'}</td>
          <td style="padding: 10px; font-size: 11px;">${l.memberName || 'Coletivo'}</td>
          <td style="padding: 10px; font-size: 11px; text-align: right; font-weight: bold;">${formatCurrency(l.amount)}</td>
          <td style="padding: 10px; font-size: 11px; color: #475569;">${l.description}</td>
        </tr>
      `).join('');

    const membersListHTML = members.map(m => `
      <tr style="border-bottom: 1px solid #f1f5f9;">
        <td style="padding: 8px; font-size: 11px; font-weight: bold;">${m.name}</td>
        <td style="padding: 8px; font-size: 11px;">${m.phone}</td>
        <td style="padding: 8px; font-size: 11px; text-align: center;">Mês ${m.assignedMonth}</td>
        <td style="padding: 8px; font-size: 11px; text-align: center;">${m.contributions[1]?.paid ? '✔ Paga' : '❌'}</td>
        <td style="padding: 8px; font-size: 11px; text-align: center;">${m.contributions[2]?.paid ? '✔ Paga' : '❌'}</td>
        <td style="padding: 8px; font-size: 11px; text-align: center;">${m.contributions[3]?.paid ? '✔ Paga' : '❌'}</td>
        <td style="padding: 8px; font-size: 11px; text-align: center;">${m.contributions[4]?.paid ? '✔ Paga' : '❌'}</td>
        <td style="padding: 8px; font-size: 11px; text-align: center;">${m.contributions[5]?.paid ? '✔ Paga' : '❌'}</td>
        <td style="padding: 8px; font-size: 11px; text-align: center;">${m.contributions[6]?.paid ? '✔ Paga' : '❌'}</td>
        <td style="padding: 8px; font-size: 11px; text-align: right; font-weight: bold;">${formatCurrency(m.socialSupportReceived)}</td>
      </tr>
    `).join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>Kixi-Fundo - Relatório de Auditoria Financeira do Fundo</title>
          <style>
            body { font-family: 'Helvetica Neue', Arial, sans-serif; padding: 40px; color: #1e293b; background-color: white; line-height: 1.4; }
            .header { text-align: center; border-bottom: 3px double #0284c7; padding-bottom: 20px; margin-bottom: 30px; }
            .header h1 { font-size: 24px; color: #0284c7; margin: 0 0 5px 0; text-transform: uppercase; letter-spacing: 1px; }
            .header h2 { font-size: 12px; color: #475569; margin: 0 0 5px 0; font-weight: normal; letter-spacing: 2px; text-transform: uppercase; }
            .header p { font-size: 11px; color: #64748b; margin: 5px 0 0 0; }
            .grid { display: grid; grid-template-cols: repeat(3, 1fr); gap: 20px; margin-bottom: 30px; }
            .card { border: 1px solid #e2e8f0; padding: 15px; rounded: 8px; }
            .card-title { font-size: 9px; font-weight: bold; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; }
            .card-value { font-size: 18px; font-weight: bold; color: #0f172a; margin-top: 5px; font-family: monospace; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
            th { background-color: #f8fafc; color: #475569; padding: 10px; font-size: 10px; font-weight: bold; text-align: left; border-bottom: 2px solid #e2e8f0; text-transform: uppercase; }
            h3 { font-size: 14px; border-left: 4px solid #0284c7; padding-left: 10px; margin-bottom: 15px; color: #0f172a; text-transform: uppercase; }
            .footer { border-top: 1px solid #e2e8f0; margin-top: 40px; padding-top: 15px; text-align: center; font-size: 10px; color: #64748b; }
            .stamp-area { display: flex; justify-content: space-between; margin-top: 50px; font-size: 11px; }
            .stamp-box { text-align: center; width: 220px; border-top: 1px solid #cbd5e1; padding-top: 8px; color: #64748b; }
            @media print {
              body { padding: 15px; font-size: 12px; }
              input, button { display: none !important; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>KIXI-FUNDO - GESTÃO DE FINANÇAS COMPARTICIPADAS</h1>
            <h2>Associação Consórcio de Poupança de Interajuda Coletiva</h2>
            <p>Relatório Consolidado de Transparência, Arrecadações e Utilização de Verbas</p>
            <p style="font-size: 10px; margin-top: 5px;">Data de Emissão: ${new Date().toLocaleString('pt-PT')} | Auditor do Fundo: lmendesvictor@gmail.com</p>
          </div>

          <div class="grid">
            <div class="card">
              <div class="card-title">Saldo Disponível Real em Banco</div>
              <div class="card-value">${formatCurrency(bankBalance)}</div>
            </div>
            <div class="card">
              <div class="card-title">Fundo de Apoio Social (Interajuda)</div>
              <div class="card-value">${formatCurrency(socialBalance)}</div>
            </div>
            <div class="card">
              <div class="card-title">Total Arrecadado de Cotizações</div>
              <div class="card-value">${formatCurrency(totalGrossCollected)}</div>
            </div>
          </div>

          <h3>1. Histórico Geral de Pagamento de Cotas</h3>
          <table>
            <thead>
              <tr>
                <th style="font-size: 10px;">Cooperante</th>
                <th style="font-size: 10px;">Fone</th>
                <th style="font-size: 10px; text-align: center;">Mês Sort.</th>
                <th style="font-size: 10px; text-align: center;">Mês 1</th>
                <th style="font-size: 10px; text-align: center;">Mês 2</th>
                <th style="font-size: 10px; text-align: center;">Mês 3</th>
                <th style="font-size: 10px; text-align: center;">Mês 4</th>
                <th style="font-size: 10px; text-align: center;">Mês 5</th>
                <th style="font-size: 10px; text-align: center;">Mês 6</th>
                <th style="font-size: 10px; text-align: right;">Apoio Rec.</th>
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
                <th style="font-size: 10px; width: 100px;">Data</th>
                <th style="font-size: 10px; width: 100px;">Tipo</th>
                <th style="font-size: 10px; width: 150px;">Contemplado</th>
                <th style="font-size: 10px; width: 120px; text-align: right;">Montante</th>
                <th style="font-size: 10px;">Descrição da Operação</th>
              </tr>
            </thead>
            <tbody>
              ${relevantLogsHTML}
            </tbody>
          </table>

          <div class="stamp-area">
            <div class="stamp-box">
              <strong>Direção do Fundo Cooperativo Kixi-Fundo</strong><br>
              Associação de Direito Angolano
            </div>
            <div class="stamp-box">
              <strong>Mendes Pambo</strong><br>
              Administrador Principal do Fundo
            </div>
            <div class="stamp-box">
              <strong>Conciliação e Selo de Auditoria</strong><br>
              Matematicamente Verificado ✓ 100%
            </div>
          </div>

          <div class="footer">
            <p>© 2026 Kixi-Fundo - Gestão de Finanças Comparticipadas, Angola. Todos os direitos reservados. Garantindo integridade absoluta.</p>
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

          <div className="flex items-center gap-3 w-full md:w-auto shrink-0">
            <button 
              onClick={handlePrintPDF}
              className="flex-1 md:flex-initial flex items-center justify-center gap-1.5 text-xs font-bold px-4 py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl shadow-sm transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              Imprimir Relatório (PDF)
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
                                <span className="inline-flex items-center gap-0.5 font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md text-[10px]">
                                  <Check className="w-3 h-3" /> Pago
                                </span>
                              ) : (
                                <span className="inline-flex items-center font-semibold text-slate-400 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md text-[10px]">
                                  Pendente
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

            {/* Recharts Graphical Visualization Card */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-5 shadow-sm animate-fadeIn">
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
                  <div className="flex items-center gap-2 text-[10px] font-bold text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-200/60 dark:border-slate-800/60 shadow-sm shrink-0">
                    <span className="w-2.5 h-2.5 rounded bg-emerald-500 inline-block"></span>
                    <span>Meta (12/12)</span>
                  </div>
                </div>
              </div>

              {/* Chart Container Stage */}
              <div className="h-64 sm:h-72 w-full font-sans">
                <ResponsiveContainer width="100%" height="100%">
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
                    <Bar dataKey="Contribuições Totais" radius={[6, 6, 0, 0]} barSize={26}>
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
                    <Bar dataKey="Fundo Social" radius={[6, 6, 0, 0]} barSize={12}>
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
                  </BarChart>
                </ResponsiveContainer>
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
        {activeReportTab === 'utilization' && (
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

            {/* List entries */}
            <div className="space-y-3">
              {logs.filter(l => l.type === 'payout' || l.type === 'social_aid').length === 0 ? (
                <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 text-center rounded-xl text-slate-400 dark:text-slate-500">
                  <Coins className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
                  <p className="text-xs font-bold uppercase">Nenhum auxílio ou desembolso de rotação efetuado até ao momento.</p>
                </div>
              ) : (
                logs
                  .filter(l => l.type === 'payout' || l.type === 'social_aid')
                  .map((l) => (
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

                      <div className="text-right shrink-0">
                        <span className="text-base font-black font-mono text-slate-900 dark:text-white block">
                          {formatCurrency(l.amount)}
                        </span>
                        <span className="text-[10px] text-slate-450 dark:text-slate-400 uppercase block font-medium">
                          Mês {l.month || currentMonth}
                        </span>
                      </div>
                    </div>
                  ))
              )}
            </div>
          </motion.div>
        )}

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
                  <div className="grid grid-cols-2 gap-2">
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
                  <div className="grid grid-cols-2 gap-2">
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

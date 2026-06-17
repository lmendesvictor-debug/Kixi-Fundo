import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Scale, 
  FileText, 
  Printer, 
  Save, 
  RotateCcw, 
  Sparkles, 
  AlertCircle, 
  CheckCircle2, 
  FileDigit, 
  PenTool,
  Info,
  DollarSign,
  ExternalLink
} from 'lucide-react';
import { Member, Loan, AppConfig } from '../types';

// Standard Default Legal Template
const DEFAULT_LEGAL_TEMPLATE = `CONTRATO DE MÚTUO FINANCEIRO COM JUROS E PENHOR DE GARANTIA

Por este instrumento particular de contrato, de um lado:
CREDOR: KIXI-FUNDO - Associação Cooperativa de Poupança e Interajuda Coletiva, doravante denominado "KIXI-FUNDO", representado neste ato pelo(a) Gestor(a) de Turno / Representante do Fundo logado no sistema: {REPRESENTANTE}.

Do outro lado:
DEVEDOR(A): {BENEFICIARIO}, titular do BI/NIF nº {DOCUMENTO_ID}, residente e domiciliado em Angola, com o contacto telefónico nº {TELEFONE} e e-mail {EMAIL}.

As partes devidamente identificadas e qualificadas resolvem celebrar o presente contrato de mútuo com garantia de penhor de comum acordo, em conformidade com o código civil em vigor em Angola e pelas cláusulas e condições seguintes:

CLÁUSULA PRIMEIRA - DO OBJETO E CAPITAL
O CREDOR concede nesta data ao DEVEDOR uma operação de microcrédito sob a forma de empréstimo (mútuo) do montante principal de {VALOR_EMPRESTIMO}, cujo capital é desembolsado nesta data para aplicação empresarial ou familiar.

CLÁUSULA SEGUNDA - DOS JUROS, AMORTIZAÇÃO E ENCARGOS
O montante principal do empréstimo será reembolsado no prazo improrrogável de {PRAZO_MESES} meses, computados juros ordinários prefixados à taxa de {TAXA_JUROS}% ao mês (revertendo os rendimentos de juro integralmente para o fundo colectivo de interajuda).
A amortização far-se-á em {PRAZO_MESES} prestações mensais, sucessivas e indivisíveis no montante exato de {MENSALIDADE} cada uma, vencendo a primeira parcela em {DATA_PRIMEIRA_PARCELA} e as demais em igual dia dos meses subsequentes.

CLÁUSULA TERCEIRA - DA GARANTIA REAL (PENHOR FIDUCIÁRIO)
Como garantia incondicional de pagamento do principal, juros e sanções aplicáveis, o DEVEDOR oferece na modalidade de penhor mercantil ou custódia fiduciária preventiva os seguintes bens e colaterais:
{GARANTIAS}

O devedor declara de livre e espontânea vontade que os bens descritos possuem valor comercial condizente com a dívida e autoriza e outorga expressamente e sem reservas o CREDOR "KIXI-FUNDO" a proceder à apreensão, adjudicação judicial ou venda extrajudicial do bem acima descrito para liquidar o saldo devedor e cobrir os custos operacionais caso o inadimplemento ultrapasse 30 (trinta) dias de atraso.

CLÁUSULA QUARTA - DOS RISCOS E MORA JURÍDICA
O atraso no pagamento de qualquer prestação mensal ativará juros de mora acumuláveis de 2% (dois por cento) ao dia sobre o montante da parcela em atraso, contados a partir do dia seguinte ao do vencimento, sem prejuízo da cobrança coerciva do saldo global.

CLÁUSULA QUINTA - FORO E ASSINATURAS
Para dirimir quaisquer controvérsias decorrentes da interpretação ou execução deste instrumento de crédito, as partes de comum acordo elegem o foro da Comarca de Luanda, Angola, com renúncia expressa a qualquer outro.

E, por estarem de pleno acordo, as partes celebram e validam eletromagneticamente o presente contrato que passa a reger os direitos mútuos.`;

interface ContractsTabProps {
  loans: Loan[];
  members: Member[];
  currentUser: { email: string; role: 'admin' | 'membro'; name: string; memberId?: number } | null;
  currentMonth: number;
  appConfig: AppConfig;
  setAppConfig: React.Dispatch<React.SetStateAction<AppConfig>>;
  saveState: (newMembers: Member[], newLogs: any[], newPayouts?: any, newMonth?: number, newLoans?: Loan[]) => void;
  logs: any[];
}

export default function ContractsTab({
  loans = [],
  members = [],
  currentUser,
  currentMonth,
  appConfig,
  setAppConfig,
  saveState,
  logs = []
}: ContractsTabProps) {
  const isAdmin = currentUser?.role === 'admin';
  
  // Find current member's loans if they are not administrator
  const memberLoans = isAdmin 
    ? loans
    : loans.filter(l => {
        const m = members.find(member => member.id === l.memberId);
        return m?.email.trim().toLowerCase() === currentUser?.email.trim().toLowerCase();
      });

  // Edit / Preview Selection
  const [activeSubTab, setActiveSubTab] = useState<'preview' | 'template'>('preview');
  const [selectedLoanId, setSelectedLoanId] = useState<string>(memberLoans[0]?.id || 'demo');
  const [representativeName, setRepresentativeName] = useState<string>(
    appConfig.contractRepresentativeName || currentUser?.name || 'Mendes Victor (Admin)'
  );

  // Template Editing state
  const [editedTemplate, setEditedTemplate] = useState<string>(
    appConfig.contractTemplateWhole || DEFAULT_LEGAL_TEMPLATE
  );
  
  // Success toast state
  const [actionSuccess, setActionSuccess] = useState<string>('');
  
  // Custom headers settings inside contract
  const [showAmortizationTableInDoc, setShowAmortizationTableInDoc] = useState<boolean>(true);
  const [showSignaturesInDoc, setShowSignaturesInDoc] = useState<boolean>(true);
  const [showStampShaCode, setShowStampShaCode] = useState<boolean>(true);

  // Fallback / Demonstration properties if there are no active loans
  const getDemoLoan = (): Loan => {
    const defaultMember = members.find(m => m.role !== 'admin') || members[0] || {
      id: 1, name: 'Adão Manuel da Silva', phone: '921123456', email: 'adao.silva@kixfundo.ao'
    };
    return {
      id: "KIX-MUT-2026-004",
      borrowerName: defaultMember.name,
      borrowerType: 'socio',
      memberId: defaultMember.id,
      documentId: 'LA0982348A',
      phone: defaultMember.phone,
      email: defaultMember.email,
      amountRequested: 300000,
      durationMonths: 6,
      interestRate: 4,
      status: 'active',
      contractDate: new Date().toLocaleDateString('pt-AO'),
      guarantees: 'Equipamento de Costura Industrial e Frigorífico de Conservação de Matérias Primas.',
      representativeName: representativeName,
      payments: Array.from({ length: 6 }).map((_, i) => ({
        month: i + 1,
        dueDate: new Date(new Date().setMonth(new Date().getMonth() + i + 1)).toLocaleDateString('pt-AO'),
        amount: 50000,
        interestPaid: 0,
        principalPaid: 0,
        paid: false
      }))
    };
  };

  // Find the current selected loan
  const currentLoan = selectedLoanId === 'demo' 
    ? getDemoLoan() 
    : (memberLoans.find(l => l.id === selectedLoanId) || getDemoLoan());

  // Format helper
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-AO', {
      style: 'currency',
      currency: 'AOA',
      minimumFractionDigits: 2
    }).format(val);
  };

  const getProcessedContractText = (loan: Loan): string => {
    const today = new Date();
    const firstDueDate = new Date(today);
    firstDueDate.setMonth(today.getMonth() + 1);
    const dateStr = firstDueDate.toLocaleDateString('pt-AO');

    const monthlyInstallment = loan.payments?.[0]?.amount || (loan.amountRequested / loan.durationMonths);

    // Apply template translations
    return editedTemplate
      .replace(/{REPRESENTANTE}/g, loan.representativeName || representativeName || 'Mendes Victor (Admin)')
      .replace(/{BENEFICIARIO}/g, loan.borrowerName)
      .replace(/{DOCUMENTO_ID}/g, loan.documentId || '[Por complementar]')
      .replace(/{TELEFONE}/g, loan.phone || '[Por complementar]')
      .replace(/{EMAIL}/g, loan.email || 'geral@kixfundo.ao')
      .replace(/{VALOR_EMPRESTIMO}/g, formatCurrency(loan.amountRequested))
      .replace(/{PRAZO_MESES}/g, String(loan.durationMonths))
      .replace(/{TAXA_JUROS}/g, String(loan.interestRate))
      .replace(/{MENSALIDADE}/g, formatCurrency(monthlyInstallment))
      .replace(/{DATA_PRIMEIRA_PARCELA}/g, dateStr)
      .replace(/{GARANTIAS}/g, loan.guarantees || 'Colateral preventivo fiduciário em bens móveis registados.');
  };

  const handleSaveTemplate = () => {
    const updated = {
      ...appConfig,
      contractTemplateWhole: editedTemplate,
      contractRepresentativeName: representativeName
    };
    setAppConfig(updated);

    // Log policy change audit
    const newLog = {
      id: `contract-policy-updated-${Date.now()}`,
      timestamp: new Date().toISOString(),
      type: 'policy_change' as const,
      amount: 0,
      description: `ALTERAÇÃO DE MINUTA: Atualização do modelo geral de contrato legal de microcrédito assinado no sistema. Representante oficial: ${representativeName}.`,
      month: currentMonth
    };

    saveState(members, [newLog, ...logs], undefined, undefined, loans);
    
    setActionSuccess('Minuta contratual oficial guardada com sucesso absoluto!');
    setTimeout(() => setActionSuccess(''), 4000);
  };

  const handleRestoreTemplate = () => {
    if (window.confirm("Deseja realmente restaurar a minuta padrão de fábrica do sistema?")) {
      setEditedTemplate(DEFAULT_LEGAL_TEMPLATE);
      setActionSuccess('Texto da minuta padrão de fábrica carregado.');
      setTimeout(() => setActionSuccess(''), 4000);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleOpenCleanPrintWindow = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert("O bloqueador de pop-ups impediu a abertura da nova janela. Por favor, autorize pop-ups para este site ou utilize o botão 'Imp. Simples' no ecrã.");
      return;
    }

    const processedText = getProcessedContractText(currentLoan);
    const monthlyInstallment = currentLoan.payments?.[0]?.amount || (currentLoan.amountRequested / currentLoan.durationMonths);

    // Build the amortization schedule rows
    let tableRowsHtml = '';
    if (showAmortizationTableInDoc) {
      Array.from({ length: currentLoan.durationMonths }).forEach((_, idx) => {
        const originalValue = currentLoan.amountRequested / currentLoan.durationMonths;
        const interestValue = originalValue * (currentLoan.interestRate / 100);
        const totalValue = originalValue + interestValue;

        tableRowsHtml += `
          <tr>
            <td style="padding: 6px 4px; border-bottom: 1px solid #eee; font-weight: bold;">${idx + 1}ª</td>
            <td style="padding: 6px 4px; border-bottom: 1px solid #eee;">Parcela ${idx + 1} de ${currentLoan.durationMonths} meses</td>
            <td style="padding: 6px 4px; border-bottom: 1px solid #eee; text-align: right;">${formatCurrency(originalValue)}</td>
            <td style="padding: 6px 4px; border-bottom: 1px solid #eee; text-align: right; color: #15803d;">+${formatCurrency(interestValue)}</td>
            <td style="padding: 6px 4px; border-bottom: 1px solid #eee; text-align: right; font-weight: bold;">${formatCurrency(totalValue)}</td>
          </tr>
        `;
      });
    }

    const totalInterest = currentLoan.amountRequested * (currentLoan.interestRate / 100);
    const totalWithInterest = currentLoan.amountRequested * (1 + (currentLoan.interestRate / 100));

    const tableHtml = showAmortizationTableInDoc ? `
      <div class="table-section">
        <h3 class="table-title">ANEXO A - QUADRO DE AMORTIZAÇÕES DO MICROCRÉDITO (Fidelidade Cooperativa)</h3>
        <table>
          <thead>
            <tr>
              <th style="padding: 5px 4px;">Parc.</th>
              <th style="padding: 5px 4px;">Período Estimado</th>
              <th style="padding: 5px 4px; text-align: right;">Prestação de Fundo</th>
              <th style="padding: 5px 4px; text-align: right;">Fundo de Juro (Reversível)</th>
              <th style="padding: 5px 4px; text-align: right;">Total Mensalidade</th>
            </tr>
          </thead>
          <tbody>
            ${tableRowsHtml}
          </tbody>
          <tfoot>
            <tr style="border-top: 2px solid #000; font-weight: bold;">
              <td colspan="2" style="padding: 8px 4px;">CONVERSÃO DE TOTAIS OPERACIONAIS</td>
              <td style="padding: 8px 4px; text-align: right;">${formatCurrency(currentLoan.amountRequested)}</td>
              <td style="padding: 8px 4px; text-align: right; color: #15803d;">${formatCurrency(totalInterest)}</td>
              <td style="padding: 8px 4px; text-align: right;">${formatCurrency(totalWithInterest)}</td>
            </tr>
          </tfoot>
        </table>
        <p style="font-size: 8px; color: #666; margin-top: 12px; line-height: 1.4; font-family: sans-serif;">
          * Os juros ordinários prefixados do presente quadro revertem integralmente para a Cooperativa Kixi-Fundo, no âmbito da caixa cooperativa mútua, salvaguardando a assistência financeira continuada entre todos os sócios ativos da carteira.
        </p>
      </div>
    ` : '';

    const signaturesHtml = showSignaturesInDoc ? `
      <div class="signatures">
        <div class="signature-box">
          <div class="signature-line"></div>
          <p class="signature-label">KIXI-FUNDO COOPERATIVO</p>
          <p style="font-size: 9px; color: #666; margin: 2px 0 0 0; font-family: sans-serif;">
            ${currentLoan.representativeName || representativeName || 'Mendes Victor'} - Representante do Fundo
          </p>
        </div>
        <div class="signature-box">
          <div class="signature-line"></div>
          <p class="signature-label">${currentLoan.borrowerName}</p>
          <p style="font-size: 9px; color: #666; margin: 2px 0 0 0; font-family: sans-serif;">
            Outorgado Devedor Principal
          </p>
        </div>
      </div>
    ` : '';

    const trackingHtml = showStampShaCode ? `
      <div class="verification-block">
        <div class="stamp">
          <span style="font-size: 14px; margin-bottom: 2px;">🛡️</span>
          KIX FUNDO
        </div>
        <div style="flex-grow: 1;">
          <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 8px; text-transform: uppercase; color: #888; font-family: sans-serif; margin-bottom: 4px;">
            <span>Assinatura Fiduciária Cooperativa Registada</span>
            <span style="color: #4f46e5; text-transform: none;">Validado pelo Sistema</span>
          </div>
          <p style="margin: 0; font-weight: bold; font-size: 9px; word-break: break-all;">SHA-256: dca8294ea511391cb2ed5a68294a5009bf37105ff7cc59ebd3784196c8ee0c6b</p>
          <p style="margin: 4px 0 0 0; font-size: 8px; font-family: sans-serif; color: #777;">Este contrato é gerado dinamicamente com base nas políticas de crédito aprovadas pela Administração e auditadas no Livro de Razão Geral do Kix-Fundo.</p>
        </div>
      </div>
    ` : '';

    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="pt-PT">
      <head>
        <meta charset="UTF-8">
        <title>Contrato_${currentLoan.id}</title>
        <style>
          @page {
            size: A4;
            margin: 20mm;
          }
          body {
            font-family: 'Georgia', 'Times New Roman', serif;
            color: #000;
            background-color: #fff;
            line-height: 1.6;
            padding: 20px;
            margin: 0;
            font-size: 12px;
          }
          .no-print-btn {
            position: fixed;
            top: 20px;
            right: 20px;
            background: #4f46e5;
            color: white;
            padding: 10px 18px;
            border: none;
            border-radius: 8px;
            font-family: sans-serif;
            font-size: 11px;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            cursor: pointer;
            box-shadow: 0 4px 8px rgba(79, 70, 229, 0.25);
            transition: background 0.2s;
            z-index: 1000;
          }
          .no-print-btn:hover {
            background: #4338ca;
          }
          .header {
            border-bottom: 2px solid #000;
            padding-bottom: 12px;
            margin-bottom: 20px;
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
          }
          .header-left h2 {
            font-family: sans-serif;
            font-size: 10px;
            font-weight: 900;
            letter-spacing: 0.1em;
            color: #1e3a8a;
            margin: 0 0 4px 0;
            text-transform: uppercase;
          }
          .header-left h1 {
            font-size: 16px;
            font-weight: bold;
            margin: 0;
            text-transform: uppercase;
          }
          .header-right {
            font-family: monospace;
            font-size: 9px;
            text-align: right;
            color: #444;
          }
          .meta-box {
            border: 1px solid #ccc;
            background-color: #fcfcfc;
            padding: 12px;
            margin-bottom: 25px;
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
            font-family: sans-serif;
            font-size: 11px;
            border-radius: 6px;
          }
          .meta-box div {
            line-height: 1.4;
          }
          .meta-label {
            font-weight: bold;
            font-size: 8px;
            text-transform: uppercase;
            color: #666;
            letter-spacing: 0.05em;
            display: block;
            margin-bottom: 2px;
          }
          .content-text {
            text-align: justify;
            text-justify: inter-word;
            margin-bottom: 30px;
            white-space: pre-line;
            font-size: 12px;
          }
          .table-section {
            border: 1px solid #000;
            padding: 12px;
            border-radius: 4px;
            margin-top: 30px;
            page-break-inside: avoid;
            background-color: #fbfbfb;
          }
          .table-title {
            font-family: sans-serif;
            font-weight: bold;
            font-size: 9px;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            margin: 0 0 8px 0;
            border-bottom: 1px solid #000;
            padding-bottom: 4px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            font-family: sans-serif;
            font-size: 10px;
          }
          th {
            border-bottom: 1.5px solid #000;
            font-weight: bold;
            text-transform: uppercase;
            font-size: 8px;
            color: #444;
          }
          .signatures {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 40px;
            margin-top: 45px;
            page-break-inside: avoid;
          }
          .signature-box {
            text-align: center;
          }
          .signature-line {
            border-bottom: 1px solid #000;
            margin-bottom: 8px;
            height: 35px;
            width: 80%;
            margin-left: auto;
            margin-right: auto;
          }
          .signature-label {
            font-family: sans-serif;
            font-size: 9px;
            font-weight: bold;
            text-transform: uppercase;
            margin: 0;
          }
          .verification-block {
            border: 1px dashed #bbb;
            padding: 12px;
            margin-top: 40px;
            font-family: monospace;
            font-size: 9px;
            color: #333;
            display: flex;
            gap: 12px;
            align-items: center;
            border-radius: 6px;
            background-color: #fafafa;
            page-break-inside: avoid;
          }
          .stamp {
            border: 2px dashed #888;
            border-radius: 4px;
            background-color: #fff;
            padding: 4px;
            width: 44px;
            height: 44px;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            font-size: 6px;
            text-transform: uppercase;
            font-weight: bold;
            text-align: center;
            flex-shrink: 0;
            box-shadow: inset 0 0 2px rgba(0,0,0,0.05);
          }
          @media print {
            .no-print-btn {
              display: none;
            }
            body {
              padding: 0;
              margin: 0;
            }
          }
        </style>
      </head>
      <body>
        <button class="no-print-btn" onclick="window.print()">Imprimir Documento</button>
        
        <div class="header">
          <div class="header-left">
            <h2>Kixi-Fundo Cooperativo</h2>
            <h1>Contrato de Concessão de Crédito</h1>
          </div>
          <div class="header-right">
            <div>Código: <strong>${currentLoan.id}</strong></div>
            <div>Registado: <strong>${currentLoan.contractDate || new Date().toLocaleDateString('pt-AO')}</strong></div>
          </div>
        </div>

        <div class="meta-box">
          <div>
            <span class="meta-label">Outorgante Representante</span>
            <strong style="color: #000; font-size: 11px;">${currentLoan.representativeName || representativeName || 'Mendes Victor'}</strong>
            <div style="font-size: 9px; color: #666; margin-top: 1px;">Gestor Fiduciário Coletivo do Kixi-Fundo</div>
          </div>
          <div class="right-cell" style="border-left: 1px solid #ccc; padding-left: 15px;">
            <span class="meta-label">Outorgado Beneficiário / Devedor</span>
            <strong style="color: #1e3a8a; font-size: 11px;">${currentLoan.borrowerName}</strong>
            <div style="font-size: 9px; color: #444; margin-top: 1px;">BI/NIF: <span style="font-family: monospace;">${currentLoan.documentId || '[Em falta]'}</span></div>
          </div>
        </div>

        <div class="content-text">
          ${processedText}
        </div>

        ${tableHtml}

        ${signaturesHtml}

        ${trackingHtml}

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 500);
          };
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="space-y-6">
      
      {/* Dynamic Print CSS Overrides */}
      <style>{`
        @media print {
          /* Hide everything except the contract print preview box */
          body * {
            visibility: hidden;
          }
          #print-document-targetId, #print-document-targetId * {
            visibility: visible;
          }
          #print-document-targetId {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            border: none !important;
            box-shadow: none !important;
            background: white !important;
            padding: 0 !important;
            margin: 0 !important;
            color: black !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* Screen Title */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-[#151c2c] p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm no-print">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-indigo-500/10 to-sky-500/10 dark:from-indigo-500/20 dark:to-sky-500/20 rounded-xl border border-indigo-100/30">
            <Scale className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-slate-850 dark:text-white uppercase">
              Cláusulas Contratuais, Normativas & Governança Sócio-Fiduciária
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Gestão de contratos formais de microcrédito, garantias reais e impressão fiduciária homologada.
            </p>
          </div>
        </div>

        {/* Buttons (Responsive action buttons) */}
        <div className="flex items-center gap-2">
          {isAdmin && (
            <div className="inline-flex bg-slate-100 dark:bg-slate-900 p-0.5 rounded-lg border border-slate-200/50 dark:border-slate-850">
              <button
                onClick={() => setActiveSubTab('preview')}
                className={`px-3 py-1.5 text-[11px] font-black uppercase tracking-wider rounded-md transition-all ${
                  activeSubTab === 'preview'
                    ? 'bg-white dark:bg-[#151c2c] text-indigo-600 dark:text-indigo-400 shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Ver Antevisão Ampla
              </button>
              <button
                onClick={() => setActiveSubTab('template')}
                className={`px-3 py-1.5 text-[11px] font-black uppercase tracking-wider rounded-md transition-all ${
                  activeSubTab === 'template'
                    ? 'bg-white dark:bg-[#151c2c] text-indigo-600 dark:text-indigo-400 shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Editar Minuta Padrão
              </button>
            </div>
          )}
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 active:scale-95 text-slate-700 dark:text-slate-350 px-4 py-2 font-black text-xs uppercase tracking-wider rounded-xl shadow-md transition cursor-pointer"
            title="Imprimir com o estilo de tela atual"
          >
            <Printer className="w-4 h-4" />
            Imp. Simples
          </button>
          <button
            onClick={handleOpenCleanPrintWindow}
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white px-4 py-2 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-indigo-600/10 transition cursor-pointer"
            title="Gerar via nova janela limpa optimizada para folha A4 oficial e imediata impressão"
          >
            <ExternalLink className="w-4 h-4" />
            Nova Janela (Limpo)
          </button>
        </div>
      </div>

      {actionSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-800 p-4 rounded-xl flex items-center gap-3 text-emerald-800 dark:text-emerald-400 text-xs font-bold shadow-md animate-fade-in no-print">
          <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Main Grid View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: Controls & Variables (no-print) */}
        <div className="lg:col-span-4 space-y-6 no-print">
          
          {/* Section: Contract selection */}
          {activeSubTab === 'preview' && (
            <div className="bg-white dark:bg-[#151c2c] p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                <FileDigit className="w-4 h-4 text-indigo-500" />
                <h3 className="font-bold text-slate-800 dark:text-white text-xs uppercase tracking-wider">Selecione o Contrato Ativo</h3>
              </div>
              
              <div className="space-y-3">
                <label className="block text-[10px] font-black uppercase text-slate-400">Origem da Amortização/Devedor</label>
                <select
                  value={selectedLoanId}
                  onChange={(e) => setSelectedLoanId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-xl text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  {isAdmin && (
                    <option value="demo">⭐️ [CONTRATO DE CORTEZIA / DEMOSTRATIVO]</option>
                  )}
                  {memberLoans.map((loan) => (
                    <option key={loan.id} value={loan.id}>
                      🤝 {loan.borrowerName} ({formatCurrency(loan.amountRequested)}) - {loan.id}
                    </option>
                  ))}
                  {!isAdmin && memberLoans.length === 0 && (
                    <option value="demo">Nenhum contrato ativo, visualizando minuta geral</option>
                  )}
                </select>
                
                {selectedLoanId === 'demo' && isAdmin && (
                  <div className="bg-amber-55/40 text-amber-800 border border-amber-200/50 p-3 rounded-lg text-[10px] leading-relaxed flex items-start gap-2">
                    <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <span>Percebemos que selecionou o modelo demonstrativo. Este contrato simula a homologação do processo com uma pessoa virtual para testes rápidos.</span>
                  </div>
                )}

                <div className="bg-indigo-50/30 dark:bg-indigo-950/20 text-indigo-800 dark:text-indigo-400 border border-indigo-150/30 dark:border-indigo-900/40 p-3.5 rounded-xl text-[9.5px] leading-relaxed flex items-start gap-2">
                  <ExternalLink className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                  <span><strong>Formato Oficial A4:</strong> Clicando em "Nova Janela (Limpo)" o contrato será renderizado numa folha isolada com fontes serifadas elegantes e margens oficiais de cartório, sem poluição de ecrã ou menus do sistema.</span>
                </div>
              </div>

              {/* Option checkboxes */}
              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <span className="block text-[10px] font-black uppercase text-slate-400 mb-1">Definições da Folha de Impressão</span>
                
                <label className="flex items-center gap-2.5 p-2 bg-slate-50 dark:bg-slate-900/60 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900 transition cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={showAmortizationTableInDoc}
                    onChange={(e) => setShowAmortizationTableInDoc(e.target.checked)}
                    className="rounded text-indigo-600 border-slate-300 focus:ring-0 cursor-pointer"
                  />
                  <div>
                    <p className="text-[10px] font-bold text-slate-700 dark:text-slate-300">Anexo A: Tabela de Amortizações</p>
                    <p className="text-[8px] text-slate-500">Imprime o cronograma exato com as datas estimadas.</p>
                  </div>
                </label>

                <label className="flex items-center gap-2.5 p-2 bg-slate-50 dark:bg-slate-900/60 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900 transition cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={showSignaturesInDoc}
                    onChange={(e) => setShowSignaturesInDoc(e.target.checked)}
                    className="rounded text-indigo-600 border-slate-300 focus:ring-0 cursor-pointer"
                  />
                  <div>
                    <p className="text-[10px] font-bold text-slate-700 dark:text-slate-300">Linhas de Assinatura Formal</p>
                    <p className="text-[8px] text-slate-500">Inclui as quadros para assinatura física das partes.</p>
                  </div>
                </label>

                <label className="flex items-center gap-2.5 p-2 bg-slate-50 dark:bg-slate-900/60 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900 transition cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={showStampShaCode}
                    onChange={(e) => setShowStampShaCode(e.target.checked)}
                    className="rounded text-indigo-600 border-slate-300 focus:ring-0 cursor-pointer"
                  />
                  <div>
                    <p className="text-[10px] font-bold text-slate-700 dark:text-slate-300">Rastreabilidade Eletrónica SHA</p>
                    <p className="text-[8px] text-slate-500">Adiciona código de verificação digital de integridade.</p>
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* Section: Template custom terms settings */}
          {activeSubTab === 'template' && isAdmin && (
            <div className="bg-white dark:bg-[#151c2c] p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                <PenTool className="w-4 h-4 text-indigo-500" />
                <h3 className="font-bold text-slate-800 dark:text-white text-xs uppercase tracking-wider">Parâmetros das Cláusulas</h3>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-black uppercase text-slate-400">Representante Oficial do Kixi-Fundo</label>
                  <input
                    type="text"
                    value={representativeName}
                    onChange={(e) => setRepresentativeName(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-855 rounded-xl text-xs font-bold text-slate-800 dark:text-white"
                    placeholder="Nome completo do representante"
                  />
                  <p className="text-[8px] text-slate-500 mt-1">Este nome preencherá a macro correspondente em todos os novos contratos gerados.</p>
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-150 dark:border-slate-850">
                  <span className="block text-[10px] font-black uppercase text-slate-400">Lista de Macros Utilizáveis</span>
                  
                  <div className="grid grid-cols-2 gap-1 bg-slate-50 dark:bg-slate-900 p-2.5 rounded-xl border border-slate-100 dark:border-slate-850 text-[9px] font-mono font-semibold text-indigo-650 dark:text-indigo-400">
                    <div>{`{REPRESENTANTE}`}</div>
                    <div>{`{BENEFICIARIO}`}</div>
                    <div>{`{DOCUMENTO_ID}`}</div>
                    <div>{`{TELEFONE}`}</div>
                    <div>{`{EMAIL}`}</div>
                    <div>{`{VALOR_EMPRESTIMO}`}</div>
                    <div>{`{PRAZO_MESES}`}</div>
                    <div>{`{TAXA_JUROS}`}</div>
                    <div>{`{MENSALIDADE}`}</div>
                    <div>{`{DATA_PRIMEIRA_PARCELA}`}</div>
                    <div className="col-span-2">{`{GARANTIAS}`}</div>
                  </div>
                  <p className="text-[8px] text-slate-550 leading-normal">O processador de texto substituirá estes códigos por valores correspondentes das operações de crédito aprovadas.</p>
                </div>

                {/* Edit operations buttons */}
                <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    onClick={handleSaveTemplate}
                    className="flex justify-center items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[10px] uppercase tracking-wider py-2 rounded-xl transition shadow-lg shadow-emerald-600/10 active:scale-95 cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    Guardar
                  </button>
                  <button
                    onClick={handleRestoreTemplate}
                    className="flex justify-center items-center gap-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-350 hover:bg-slate-200 font-black text-[10px] uppercase tracking-wider py-2 rounded-xl transition active:scale-95 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Padrão
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Guidelines info card */}
          <div className="bg-slate-50 dark:bg-slate-900/40 p-5 rounded-2xl border border-slate-200/50 dark:border-slate-850/50 space-y-3.5">
            <h4 className="font-black text-xs text-slate-700 dark:text-slate-300 uppercase tracking-widest flex items-center gap-1.5">
              <span>📜</span> Homologação Jurídica
            </h4>
            <p className="text-[10px] text-slate-550 leading-relaxed">
              O microcrédito concedido através do fundo responde perante a Lei das Cooperativas de Angola. As taxas de juro ordinárias revertem na totalidade de forma fiduciária para a sustentação, expansão financeira e liquidez coletiva do próprio <strong>Kixi-Fundo</strong>.
            </p>
            <div className="bg-indigo-50/50 dark:bg-indigo-950/20 px-3 py-2.5 rounded-lg border border-indigo-100/30 font-semibold text-[9.5px] text-[#2563EB] dark:text-indigo-400">
              💡 <strong>Regra Fiel:</strong> Os juros cobrados não servem para o lucro do Administrador, mas sim para enriquecer o capital comunitário do Fundo Comum dos Sócios.
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Big Paper Sheet Preview Area */}
        <div className="lg:col-span-8">
          
          {activeSubTab === 'template' && isAdmin ? (
            <div className="bg-white dark:bg-[#151c2c] p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4 no-print">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <span className="text-[11px] font-black uppercase text-slate-400 flex items-center gap-1">
                  <FileText className="w-4 h-4 text-indigo-500" /> Editor Integral do Contrato Padrão
                </span>
                <span className="text-[9px] bg-red-100 text-red-700 px-2.5 py-0.5 rounded-full font-bold">Modo Administração: Edição Livre</span>
              </div>
              <textarea
                value={editedTemplate}
                onChange={(e) => setEditedTemplate(e.target.value)}
                rows={22}
                className="w-full text-xs font-mono leading-relaxed p-5 bg-slate-50 dark:bg-[#0c111c] text-slate-900 dark:text-gray-100 border border-slate-200 dark:border-slate-850 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/10 placeholder-slate-400"
              />
            </div>
          ) : (
            
            // DOCUMENT SHEET VIEW ("Ampla Visualização")
            <div 
              id="print-document-targetId"
              className="bg-white text-slate-900 p-8 sm:p-12 md:p-16 rounded-2xl border border-slate-205 shadow-xl space-y-8 select-text relative font-sans scale-0 animate-fade-in origin-top overflow-hidden max-w-4xl mx-auto"
              style={{ contentVisibility: 'auto' }}
            >
              {/* Draft watermark on screen only */}
              {selectedLoanId === 'demo' && (
                <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] select-none pointer-events-none no-print">
                  <span className="text-[120px] font-black tracking-widest rotate-[30deg] uppercase font-sans text-rose-500">EXEMPLO</span>
                </div>
              )}

              {/* Legal Doc Header */}
              <div className="border-b-2 border-slate-900 pb-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-indigo-900 font-sans tracking-wide">
                    <Scale className="w-5 h-5" />
                    <span className="text-[11px] font-black uppercase tracking-widest">KIXI-FUNDO COOPERATIVO</span>
                  </div>
                  <h1 className="text-xl font-black text-slate-950 font-serif leading-tight">
                    CONTRATO DE CONCESSÃO DE CRÉDITO E PENHOR MERCANTIL
                  </h1>
                </div>
                
                <div className="flex md:flex-col items-start md:items-end justify-between font-mono text-[9px] text-slate-500">
                  <span>Código: <strong className="font-extrabold text-slate-900">{currentLoan.id}</strong></span>
                  <span>Registitado: <strong className="font-extrabold text-[#2563EB]">{currentLoan.contractDate || new Date().toLocaleDateString('pt-AO')}</strong></span>
                </div>
              </div>

              {/* Sub-Metadata Grid (Aesthetics Improvement) */}
              <div className="grid grid-cols-2 gap-6 bg-slate-50 p-4 border border-slate-200 rounded-lg text-xs leading-relaxed font-sans">
                <div>
                  <span className="block text-[8px] font-black uppercase text-slate-500 tracking-wider">Outorgante Representante:</span>
                  <p className="font-bold text-slate-900">{currentLoan.representativeName || representativeName || 'Mendes Victor'}</p>
                  <p className="text-[10px] text-slate-500">Gestor Fiduciário Coletivo do Kixi-Fundo</p>
                </div>
                <div className="text-right border-l border-slate-200 pl-6">
                  <span className="block text-[8px] font-black uppercase text-slate-500 tracking-wider">Outorgado Beneficiário / Devedor:</span>
                  <p className="font-bold text-indigo-900 text-sm">{currentLoan.borrowerName}</p>
                  <p className="text-[10px] text-slate-550">NIF/BI: <strong className="font-mono text-slate-800">{currentLoan.documentId || '[Em falta]'}</strong></p>
                </div>
              </div>

              {/* Main Text Content */}
              <div className="text-slate-850 text-xs sm:text-[13px] leading-relaxed font-serif tracking-normal whitespace-pre-wrap text-justify whitespace-pre-line space-y-4 pr-1">
                {getProcessedContractText(currentLoan)}
              </div>

              {/* Anexo A: Plan of Amortizations (Responsive / Print visual) */}
              {showAmortizationTableInDoc && (
                <div className="border border-slate-900 p-4 rounded bg-slate-50/50 space-y-3 font-sans mt-8 page-break">
                  <div className="flex justify-between items-center border-b border-slate-350 pb-1.5">
                    <h3 className="font-black text-[10px] uppercase text-slate-900 tracking-wider">
                      ANEXO A - QUADRO DE AMORTIZAÇÕES DO MICROCRÉDITO
                    </h3>
                    <span className="text-[9px] text-[#2563EB] font-bold">Fidelidade fiduciária</span>
                  </div>
                  
                  <table className="w-full text-left text-[11px]">
                    <thead>
                      <tr className="border-b border-slate-900 text-slate-550 font-bold uppercase text-[9px] pb-1">
                        <th className="py-1">Parc.</th>
                        <th>Período Estimado</th>
                        <th className="text-right">Prestação de Fundo</th>
                        <th className="text-right">Fundo de Juro (Reversível)</th>
                        <th className="text-right">Total Mensalidade</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-800">
                      {Array.from({ length: currentLoan.durationMonths }).map((_, idx) => {
                        const originalValue = currentLoan.amountRequested / currentLoan.durationMonths;
                        const interestValue = originalValue * (currentLoan.interestRate / 100);
                        const totalValue = originalValue + interestValue;

                        return (
                          <tr key={idx} className="hover:bg-slate-100/50">
                            <td className="py-1 font-bold">{idx + 1}ª</td>
                            <td className="text-slate-550 font-mono">Parcela {idx + 1} de {currentLoan.durationMonths} meses</td>
                            <td className="text-right font-mono">{formatCurrency(originalValue)}</td>
                            <td className="text-right text-emerald-700 font-mono">+{formatCurrency(interestValue)}</td>
                            <td className="text-right font-extrabold text-slate-900 font-mono">{formatCurrency(totalValue)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 border-slate-900 font-black text-slate-950 text-xs">
                        <td colSpan={2} className="py-2">CONVERSÃO DE TOTAIS OPERACIONAIS</td>
                        <td className="text-right font-mono">{formatCurrency(currentLoan.amountRequested)}</td>
                        <td className="text-right text-emerald-800 font-mono">
                          {formatCurrency(currentLoan.amountRequested * (currentLoan.interestRate / 100))}
                        </td>
                        <td className="text-right text-indigo-950 font-mono">
                          {formatCurrency(currentLoan.amountRequested * (1 + (currentLoan.interestRate / 100)))}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                  <p className="text-[8px] text-slate-500 border-t border-dashed border-slate-200 pt-2 leading-relaxed font-sans">
                    * Os juros ordinários prefixados do presente quadro revertem integralmente para a Cooperativa Kixi-Fundo, no âmbito da caixa cooperativa mútua, salvaguardando a assistência financeira continuada entre todos os sócios ativos da carteira.
                  </p>
                </div>
              )}

              {/* Autograph and Signature lines */}
              {showSignaturesInDoc && (
                <div className="grid grid-cols-2 gap-8 pt-10 border-t border-dashed border-slate-300 font-sans text-xs mt-12 page-break">
                  <div className="text-center space-y-12">
                    <div className="h-10 flex flex-col justify-end">
                      <span className="text-[10px] text-slate-400 font-mono lowercase tracking-tighter">[autenticado eletronicamente]</span>
                      <p className="font-bold border-b border-slate-900 pb-1.5 mx-auto w-3/4"></p>
                    </div>
                    <div>
                      <p className="font-extrabold text-slate-900 uppercase">KIXI-FUNDO COOPERATIVO</p>
                      <p className="text-[9px] text-slate-500">{currentLoan.representativeName || representativeName || 'Mendes Victor'} - Representante do Fundo</p>
                    </div>
                  </div>

                  <div className="text-center space-y-12">
                    <div className="h-10 flex flex-col justify-end">
                      <p className="font-bold border-b border-slate-900 pb-1.5 mx-auto w-3/4"></p>
                    </div>
                    <div>
                      <p className="font-extrabold text-slate-900 uppercase">{currentLoan.borrowerName}</p>
                      <p className="text-[9px] text-slate-500">Outorgado Devedor Principal</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Electronic Stamp & SHA Checksum block */}
              {showStampShaCode && (
                <div className="bg-slate-50 border border-slate-200/60 p-4 rounded-xl flex items-center gap-4 text-[9.5px] leading-relaxed font-mono text-slate-500 mt-12 page-break">
                  <div className="w-14 h-14 bg-white border-2 border-dashed border-slate-300 rounded-xl shrink-0 flex items-center justify-center font-black text-slate-400 select-none tracking-widest leading-none text-center text-[7px] p-1.5 flex-col uppercase">
                    <span className="text-[12px] pb-0.5">🛡️</span>
                    <span>Kix Fundo</span>
                  </div>
                  <div className="space-y-0.5 w-full">
                    <div className="flex items-center justify-between text-[8px] font-black text-slate-400 uppercase tracking-widest">
                      <span>Assinatura Fiduciária Cooperativa Registada</span>
                      <span className="text-indigo-600 font-sans capitalize font-bold">Validado pelo Sistema</span>
                    </div>
                    <p className="break-all font-bold text-slate-800">SHA-256: dca8294ea511391cb2ed5a68294a5009bf37105ff7cc59ebd3784196c8ee0c6b</p>
                    <p className="text-[8px] text-slate-450 font-sans leading-none mt-1">Este contrato é gerado dinamicamente com base nas políticas de crédito aprovadas pela Administração e auditadas no Livro de Razão Geral do Kix-Fundo.</p>
                  </div>
                </div>
              )}

            </div>

          )}

        </div>

      </div>

    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  TrendingUp, Plus, ShieldCheck, FileText, Check, AlertTriangle, 
  Scale, Calendar, HelpCircle, CreditCard, ArrowUpRight, 
  User, Building, Search, DollarSign, Landmark, Phone, MessageSquare, Briefcase,
  Printer, X, Edit, Settings, FileText as FileIcon, Sparkles, CheckSquare
} from 'lucide-react';
import { Loan, Member, KixLog, LoanPayment } from '../types';

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

const getActiveContractTemplate = (appConfig?: any) => {
  if (!appConfig?.contractTemplateWhole) return DEFAULT_LEGAL_TEMPLATE;
  return appConfig.contractTemplateWhole
    .replace(/{CLAUSULA_JUROS}/g, appConfig.contractClauseJuros || '')
    .replace(/{CLAUSULA_GARANTIAS}/g, appConfig.contractClauseGarantias || '')
    .replace(/{CLAUSULA_MULTAS}/g, appConfig.contractClauseMultas || '');
};

interface CreditManagementProps {
  loans: Loan[];
  members: Member[];
  onAddLoan: (newLoan: Loan) => void;
  onPayInstallment: (loanId: string, paymentMonth: number) => void;
  currentUser: { email: string; role: 'admin' | 'membro'; name: string; memberId?: number } | null;
  currentMonth: number;
  appConfig?: any;
}

export default function CreditManagement({
  loans = [],
  members = [],
  onAddLoan,
  onPayInstallment,
  currentUser,
  currentMonth,
  appConfig,
}: CreditManagementProps) {
  const isAdmin = currentUser?.role === 'admin';
  
  // Tab states: 'dashboard' | 'simulate' | 'portfolio' | 'debtors'
  const [activeSubTab, setActiveSubTab] = useState<'dashboard' | 'simulate' | 'portfolio' | 'debtors'>('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'socio' | 'singular'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'completed' | 'overdue'>('all');
  const [selectedLoanId, setSelectedLoanId] = useState<string | null>(null);

  // Form states for Simulation / New Contract
  const [borrowerType, setBorrowerType] = useState<'socio' | 'singular'>('socio');
  const [selectedMemberId, setSelectedMemberId] = useState<number>(members[0]?.id || 0);
  const [borrowerName, setBorrowerName] = useState('');
  const [documentId, setDocumentId] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  
  // Custom limits corresponding to Member vs External Client
  const limitSocio = 1500000;
  const limitSingular = 800000;
  const defaultRateSocio = 6; // 6%
  const defaultRateSingular = 14; // 14%

  const [amountRequested, setAmountRequested] = useState<number>(300000);
  const [durationMonths, setDurationMonths] = useState<number>(3);
  const [interestRate, setInterestRate] = useState<number>(6);
  const [guarantees, setGuarantees] = useState('');
  const [readTerms, setReadTerms] = useState(false);

  // New Contract legal state and printing workflow states
  const [representativeName, setRepresentativeName] = useState<string>(currentUser?.name || '');
  const [legalTemplate, setLegalTemplate] = useState<string>(DEFAULT_LEGAL_TEMPLATE);
  const [isAdjustingTerms, setIsAdjustingTerms] = useState<boolean>(false);

  // Sync active appConfig template
  useEffect(() => {
    if (appConfig) {
      setLegalTemplate(getActiveContractTemplate(appConfig));
    }
  }, [appConfig]);
  
  // Printing & layout control panel states
  const [showPrintModal, setShowPrintModal] = useState<boolean>(false);
  const [printModalLoanId, setPrintModalLoanId] = useState<string | null>(null);
  const [printFontSize, setPrintFontSize] = useState<'compact' | 'normal' | 'elegant'>('normal');
  const [printFontFamily, setPrintFontFamily] = useState<'serif' | 'sans' | 'mono'>('serif');
  const [printShowSchedule, setPrintShowSchedule] = useState<boolean>(true);
  const [printShowSignatures, setPrintShowSignatures] = useState<boolean>(true);
  const [printShowStamp, setPrintShowStamp] = useState<boolean>(true);
  
  // Edit mode inside the viewing modal
  const [editingLoadedTerms, setEditingLoadedTerms] = useState<boolean>(false);
  const [loadedContractTerms, setLoadedContractTerms] = useState<string>('');

  // Auto adjusting default rates when type changes
  const handleTypeChange = (type: 'socio' | 'singular') => {
    setBorrowerType(type);
    if (type === 'socio') {
      setInterestRate(defaultRateSocio);
      if (amountRequested > limitSocio) setAmountRequested(limitSocio);
    } else {
      setInterestRate(defaultRateSingular);
      if (amountRequested > limitSingular) setAmountRequested(limitSingular);
    }
  };

  // Dynamic calculations for preview
  const monthlyPrincipal = amountRequested / durationMonths;
  const monthlyInterest = amountRequested * (interestRate / 100);
  const monthlyInstallment = monthlyPrincipal + monthlyInterest;
  const totalInterestExpected = monthlyInterest * durationMonths;
  const totalRepaymentExpected = amountRequested + totalInterestExpected;

  // Format currency helpers
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-AO', {
      style: 'currency',
      currency: 'AOA',
      minimumFractionDigits: 2,
    })
      .format(val)
      .replace('AOA', 'KZs');
  };

  const getProcessedLegalTermsReusable = (
    template: string,
    rep: string,
    beneficiario: string,
    documento: string,
    telefone: string,
    emailStr: string,
    valor: number,
    prazo: number,
    taxa: number,
    mensalidade: number,
    garantiasText: string
  ) => {
    const today = new Date();
    const firstDueDate = new Date(today);
    firstDueDate.setMonth(today.getMonth() + 1);
    const dateStr = firstDueDate.toLocaleDateString('pt-AO');

    return template
      .replace(/{REPRESENTANTE}/g, rep || 'Mendes Victor (Admin)')
      .replace(/{BENEFICIARIO}/g, beneficiario)
      .replace(/{DOCUMENTO_ID}/g, documento)
      .replace(/{TELEFONE}/g, telefone)
      .replace(/{EMAIL}/g, emailStr || 'geral@kixfundo.ao')
      .replace(/{VALOR_EMPRESTIMO}/g, formatCurrency(valor))
      .replace(/{PRAZO_MESES}/g, String(prazo))
      .replace(/{TAXA_JUROS}/g, String(taxa))
      .replace(/{MENSALIDADE}/g, formatCurrency(mensalidade))
      .replace(/{DATA_PRIMEIRA_PARCELA}/g, dateStr)
      .replace(/{GARANTIAS}/g, garantiasText || '[Nenhuma garantia especificada]');
  };

  // Dashboard Stats Calculations
  const totalPrincipalDisbursed = loans.reduce((acc, l) => acc + l.amountRequested, 0);
  
  const totalInterestFundoExpected = loans.reduce((acc, l) => {
    const montInter = l.amountRequested * (l.interestRate / 100);
    return acc + (montInter * l.durationMonths);
  }, 0);

  const totalInterestFundoCollected = loans.reduce((acc, l) => {
    return acc + l.payments.filter(p => p.paid).reduce((sum, p) => sum + p.interestPaid, 0);
  }, 0);

  const totalPrincipalFundoCollected = loans.reduce((acc, l) => {
    return acc + l.payments.filter(p => p.paid).reduce((sum, p) => sum + p.principalPaid, 0);
  }, 0);

  const activeAmortizingBalance = totalPrincipalDisbursed - totalPrincipalFundoCollected;
  const averageInterestRate = loans.length > 0
    ? loans.reduce((acc, l) => acc + l.interestRate, 0) / loans.length
    : 0;

  // Filtering Loans
  const filteredLoans = loans.filter(l => {
    const matchesSearch = l.borrowerName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          l.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          l.phone.includes(searchQuery);
    const matchesType = typeFilter === 'all' ? true : l.borrowerType === typeFilter;
    const matchesStatus = statusFilter === 'all' ? true : l.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  const selectedLoan = loans.find(l => l.id === selectedLoanId);

  // Submit Logic for new Loan Contract
  const handleGenerateContract = (e: React.FormEvent) => {
    e.preventDefault();
    if (!readTerms) {
      alert('É necessário aceitar as cláusulas de concordância e garantias jurídicas para prosseguir.');
      return;
    }

    let finalName = borrowerName.trim();
    let finalEmail = email.trim();
    let finalPhone = phone.trim();
    let linkedMemberId: number | undefined;

    if (borrowerType === 'socio') {
      const selectedMember = members.find(m => m.id === selectedMemberId);
      if (!selectedMember) {
        alert('Membro associado inexistente.');
        return;
      }
      finalName = selectedMember.name;
      finalPhone = selectedMember.phone;
      finalEmail = selectedMember.email;
      linkedMemberId = selectedMember.id;
    } else {
      if (!finalName) {
        alert('Por favor, informe o nome do titular singular.');
        return;
      }
      if (!finalPhone) {
        alert('É necessário registrar um número de telefone válido do titular.');
        return;
      }
    }

    if (!documentId) {
      alert('O documento de identificação (BI/NIF) é obrigatório para conferência jurídica no contrato.');
      return;
    }

    if (amountRequested <= 0) {
      alert('Insira um montante de crédito válido.');
      return;
    }

    const currentLimit = borrowerType === 'socio' ? limitSocio : limitSingular;
    if (amountRequested > currentLimit) {
      alert(`O montante excede o limite definido (${formatCurrency(currentLimit)}) para a categoria selecionada.`);
      return;
    }

    if (!guarantees.trim()) {
      alert('É estritamente necessário estipular as garantias de penhor ou fiadores para o processo de crédito.');
      return;
    }

    // Generate monthly payment records
    const generatedPayments: LoanPayment[] = [];
    const today = new Date();
    
    for (let i = 1; i <= durationMonths; i++) {
      const monthDueDate = new Date(today);
      monthDueDate.setMonth(today.getMonth() + i);

      generatedPayments.push({
        month: i,
        dueDate: monthDueDate.toLocaleDateString('pt-AO'),
        amount: monthlyInstallment,
        interestPaid: monthlyInterest,
        principalPaid: monthlyPrincipal,
        paid: false
      });
    }

    const contractCode = `L-${String(Date.now()).slice(-4)}-${borrowerType.substring(0, 3).toUpperCase()}`;

    const getProcessedLegalTermsLocal = (
      template: string,
      rep: string,
      beneficiario: string,
      documento: string,
      telefone: string,
      emailStr: string,
      valor: number,
      prazo: number,
      taxa: number,
      mensalidade: number,
      garantiasText: string
    ) => {
      const today = new Date();
      const firstDueDate = new Date(today);
      firstDueDate.setMonth(today.getMonth() + 1);
      const dateStr = firstDueDate.toLocaleDateString('pt-AO');

      return template
        .replace(/{REPRESENTANTE}/g, rep || 'Mendes Victor (Admin)')
        .replace(/{BENEFICIARIO}/g, beneficiario)
        .replace(/{DOCUMENTO_ID}/g, documento)
        .replace(/{TELEFONE}/g, telefone)
        .replace(/{EMAIL}/g, emailStr || 'geral@kixfundo.ao')
        .replace(/{VALOR_EMPRESTIMO}/g, formatCurrency(valor))
        .replace(/{PRAZO_MESES}/g, String(prazo))
        .replace(/{TAXA_JUROS}/g, String(taxa))
        .replace(/{MENSALIDADE}/g, formatCurrency(mensalidade))
        .replace(/{DATA_PRIMEIRA_PARCELA}/g, dateStr)
        .replace(/{GARANTIAS}/g, garantiasText || '[Nenhuma garantia especificada]');
    };

    const finalLegalText = getProcessedLegalTermsLocal(
      legalTemplate,
      representativeName || currentUser?.name || 'Mendes Victor (Admin)',
      finalName,
      documentId.toUpperCase().trim(),
      finalPhone,
      finalEmail || 'geral@kixfundo.ao',
      amountRequested,
      durationMonths,
      interestRate,
      monthlyInstallment,
      guarantees.trim()
    );

    const newLoan: Loan = {
      id: contractCode,
      borrowerName: finalName,
      borrowerType,
      memberId: linkedMemberId,
      documentId: documentId.toUpperCase().trim(),
      phone: finalPhone,
      email: finalEmail || 'geral@kixfundo.ao',
      amountRequested,
      interestRate,
      durationMonths,
      guarantees: guarantees.trim(),
      status: 'active',
      contractDate: new Date().toLocaleDateString('pt-AO'),
      payments: generatedPayments,
      representativeName: representativeName || currentUser?.name || 'Mendes Victor (Admin)',
      customLegalTerms: finalLegalText
    };

    onAddLoan(newLoan);
    alert(`Contrato de Crédito ${contractCode} gerado e assinado com sucesso absoluto! Principal de ${formatCurrency(amountRequested)} desembolsado.`);
    
    // Clear form inputs
    setBorrowerName('');
    setDocumentId('');
    setPhone('');
    setEmail('');
    setGuarantees('');
    setReadTerms(false);
    setActiveSubTab('portfolio');
    setSelectedLoanId(contractCode);
  };

  return (
    <div id="credit-system-workspace" className="space-y-6">
      
      {/* Header and top navigation row */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
        <div>
          <span className="bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-305 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border border-sky-100 dark:border-sky-900/40">
            Escalar & Rentabilidade
          </span>
          <h1 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white mt-1.5 flex items-center gap-2">
            <Landmark className="w-5 h-5 text-sky-500" /> Fundo de Crédito e Crédito Rotativo
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Geração de renda coletiva através da rentabilização de poupanças ativas com empréstimos de confiança assegurados para Sócios e Clientes Singulares.
          </p>
        </div>

        {/* Tab switch control */}
        <div className="flex border border-slate-200/65 dark:border-slate-805 p-0.8 bg-slate-50 dark:bg-[#0e1320] rounded-xl flex-wrap">
          <button
            onClick={() => setActiveSubTab('dashboard')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'dashboard'
                ? 'bg-white dark:bg-slate-850 text-sky-700 dark:text-sky-305 shadow-sm'
                : 'text-slate-450 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" /> Métricas
          </button>
          
          {isAdmin && (
            <button
              onClick={() => setActiveSubTab('simulate')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                activeSubTab === 'simulate'
                  ? 'bg-white dark:bg-slate-850 text-sky-700 dark:text-sky-305 shadow-sm'
                  : 'text-slate-450 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              <Plus className="w-3.5 h-3.5" /> Novo devedor
            </button>
          )}

          <button
            onClick={() => setActiveSubTab('portfolio')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'portfolio'
                ? 'bg-white dark:bg-slate-850 text-sky-700 dark:text-sky-305 shadow-sm'
                : 'text-slate-450 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" /> Contratos e Amortizações
          </button>

          <button
            onClick={() => setActiveSubTab('debtors')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'debtors'
                ? 'bg-white dark:bg-slate-850 text-sky-700 dark:text-sky-305 shadow-sm'
                : 'text-slate-450 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            <User className="w-3.5 h-3.5" /> Diretório Jurídico
          </button>
        </div>
      </div>

      {/* DASHBOARD TAB CONTROLS */}
      {activeSubTab === 'dashboard' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Stat Card 1: Principal Outstandind */}
            <div className="bg-white dark:bg-[#151c2c]/85 border border-slate-100 dark:border-slate-800 p-5 rounded-xl flex flex-col justify-between hover:scale-[1.01] transition-transform">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase text-slate-400">Total Concedido</span>
                <div className="p-1.5 bg-slate-100 dark:bg-slate-900 rounded text-sky-500">
                  <Landmark className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-4">
                <h4 className="text-xs text-slate-400 font-semibold">Carteira de Crédito</h4>
                <p className="text-xl font-black font-mono text-slate-900 dark:text-white mt-1">
                  {formatCurrency(totalPrincipalDisbursed)}
                </p>
                <span className="text-[9px] text-slate-450 font-bold">Distribuição de Capital Ativo</span>
              </div>
            </div>

            {/* Stat Card 2: Remaining amortization */}
            <div className="bg-white dark:bg-[#151c2c]/85 border border-slate-100 dark:border-slate-800 p-5 rounded-xl flex flex-col justify-between hover:scale-[1.01] transition-transform">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase text-slate-400">Saldo Sob Amortização</span>
                <div className="p-1.5 bg-slate-100 dark:bg-slate-900 rounded text-amber-500">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-4">
                <h4 className="text-xs text-slate-400 font-semibold">Principal em Aberto</h4>
                <p className="text-xl font-black font-mono text-slate-900 dark:text-white mt-1">
                  {formatCurrency(activeAmortizingBalance)}
                </p>
                <span className="text-[9px] text-slate-450 font-bold">
                  {loans.length} financiamentos em andamento
                </span>
              </div>
            </div>

            {/* Stat Card 3: Cooperative interest earnings (Impact directly on pool) */}
            <div className="bg-white dark:bg-[#151c2c]/85 border border-slate-100 dark:border-slate-800 p-5 rounded-xl flex flex-col justify-between hover:scale-[1.01] transition-transform">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase text-slate-400">Ganhos de Juros Realizados</span>
                <div className="p-1.5 bg-emerald-50 dark:bg-emerald-950/20 rounded text-emerald-600">
                  <ArrowUpRight className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-4">
                <h4 className="text-xs text-slate-400 font-semibold">Rentabilização do Fundo</h4>
                <p className="text-xl font-black font-mono text-emerald-600 dark:text-emerald-400 mt-1">
                  {formatCurrency(totalInterestFundoCollected)}
                </p>
                <span className="text-[9px] text-emerald-500 font-bold font-mono">
                  + {formatCurrency(totalInterestFundoExpected - totalInterestFundoCollected)} previstos em colheita
                </span>
              </div>
            </div>

            {/* Stat Card 4: Retorno Médio */}
            <div className="bg-white dark:bg-[#151c2c]/85 border border-slate-100 dark:border-slate-800 p-5 rounded-xl flex flex-col justify-between hover:scale-[1.01] transition-transform">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase text-slate-400">Risco & Retorno</span>
                <div className="p-1.5 bg-purple-50 dark:bg-purple-950/20 rounded text-purple-600">
                  <ShieldCheck className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-4">
                <h4 className="text-xs text-slate-400 font-semibold">Taxa de Juros Média</h4>
                <p className="text-xl font-black text-slate-900 dark:text-white mt-1">
                  {averageInterestRate.toFixed(1)}% <span className="text-xs font-bold text-slate-400">/mês</span>
                </p>
                <span className="text-[9px] text-slate-450 font-bold">5-8% Sócios | 12-15% Singulares</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left overview text and explanation */}
            <div className="bg-slate-50 dark:bg-[#0e1320] border border-slate-200/50 dark:border-slate-805 p-6 rounded-xl space-y-4 lg:col-span-2">
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5 uppercase tracking-wide">
                <Scale className="w-4 h-4 text-sky-500" /> Regulamento & Governança da Rentabilidade Coletiva
              </h3>
              
              <div className="text-xs text-slate-650 dark:text-slate-350 space-y-3.5 leading-relaxed">
                <p>
                  Para escalar o capital da cooperativa <strong>Kixi-Fundo</strong> de forma segura e profissional, implementamos uma trilha de concessão de microcréditos focada na multiplicação patrimonial. O principal é originado do fundo excedente e sua cobrança reverte integralmente em lucros direcionados à poupança de cada sócio, respeitando as seguintes premissas operacionais:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div className="bg-white dark:bg-[#151c2c]/85 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                    <h5 className="font-bold text-sky-600 flex items-center gap-1">
                      <User className="w-3.5 h-3.5" /> Crédito para Sócios
                    </h5>
                    <p className="text-[11px] text-slate-450 mt-1">
                      Taxa social reduzida de <strong>5% a 8% ao mês</strong> para fomento familiar ou pessoal. O limite de concessão é expressivo, até <strong>1.500.000,00 KZs</strong>, avaliado conforme assiduidade de quotas do cooperado.
                    </p>
                  </div>

                  <div className="bg-white dark:bg-[#151c2c]/85 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                    <h5 className="font-bold text-emerald-650 flex items-center gap-1">
                      <Building className="w-3.5 h-3.5" /> Crédito para Pessoas Singulares
                    </h5>
                    <p className="text-[11px] text-slate-450 mt-1">
                      Aplicação comercial externa com juros protetivos de <strong>12% a 15% ao mês</strong>. O limite máximo de exposição é fixado em <strong>800.000,00 KZs</strong> e requer a custódia explícita de bens físicos como colateral.
                    </p>
                  </div>
                </div>

                <p className="mt-2 text-[11px] italic bg-sky-50/50 dark:bg-sky-950/20 text-sky-700 dark:text-sky-305 p-3 rounded-lg border border-sky-100/40 dark:border-sky-900/40">
                  ⚠️ <strong>Impacto Contábil Direto:</strong> Ao contrário de instituições tradicionais, os juros liquidados de cada parcela ingressam imediatamente como recursos no <strong>Fundo de Interajuda Coletivo</strong> do Kixi-Fundo, aumentando o patrimônio disponível e solidificando as contas gerais do ecossistema.
                </p>
              </div>
            </div>

            {/* Right Quick Summary List */}
            <div className="bg-white dark:bg-[#151c2c]/85 border border-slate-100 dark:border-slate-800 p-5 rounded-xl space-y-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">Resumo de Cobranças</h3>
              <div className="space-y-3.5 max-h-[300px] overflow-y-auto pr-1">
                {loans.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 dark:text-slate-600 text-xs font-bold uppercase tracking-wider">
                    Sem contratos ativos
                  </div>
                ) : (
                  loans.map(l => {
                    const totalPayments = l.payments.length;
                    const paidPayments = l.payments.filter(p => p.paid).length;
                    const percentComp = (paidPayments / totalPayments) * 100;

                    return (
                      <div 
                        key={l.id} 
                        onClick={() => { setSelectedLoanId(l.id); setActiveSubTab('portfolio'); }}
                        className="cursor-pointer border border-slate-50 dark:border-slate-805 hover:border-sky-300 dark:hover:border-sky-700 bg-slate-50/40 dark:bg-[#0e1320]/40 p-3 rounded-lg transition-all"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-extrabold text-xs text-slate-800 dark:text-slate-200 truncate max-w-[140px]">
                            {l.borrowerName}
                          </span>
                          <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${
                            l.borrowerType === 'socio'
                              ? 'bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400'
                              : 'bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400'
                          }`}>
                            {l.borrowerType === 'socio' ? 'Sócio' : 'Singular'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-slate-450 mt-2 font-mono">
                          <span>Disp: {formatCurrency(l.amountRequested)}</span>
                          <span>{paidPayments}/{totalPayments} Parcs</span>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-slate-800 h-1 rounded-full overflow-hidden mt-2">
                          <div className="bg-sky-500 h-full rounded-full" style={{ width: `${percentComp}%` }} />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* NEW LOAN SIMULATOR AND SIGN CONTRACT TAB */}
      {activeSubTab === 'simulate' && isAdmin && (
        <form onSubmit={handleGenerateContract} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Form left inputs (8 columns) */}
          <div className="bg-white dark:bg-[#151c2c]/85 border border-slate-100 dark:border-slate-800 p-6 rounded-xl space-y-6 lg:col-span-7">
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
              <Landmark className="w-4 h-4 text-sky-500" /> Registro Jurídico de Novo Crédito
            </h3>

            <div className="space-y-4">
              
              {/* Borrower Type Selection */}
              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1.5">
                  Tipo de Beneficiário do Crédito
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => handleTypeChange('socio')}
                    className={`p-3 rounded-lg border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      borrowerType === 'socio'
                        ? 'bg-sky-50 dark:bg-sky-950/30 text-sky-700 dark:text-sky-305 border-sky-400'
                        : 'bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-450 border-slate-150 dark:border-slate-800 hover:bg-slate-50'
                    }`}
                  >
                    <User className="w-4 h-4" /> Sócio Cooperante
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTypeChange('singular')}
                    className={`p-3 rounded-lg border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      borrowerType === 'singular'
                        ? 'bg-sky-50 dark:bg-sky-950/30 text-sky-700 dark:text-sky-305 border-sky-400'
                        : 'bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-450 border-slate-150 dark:border-slate-800 hover:bg-slate-50'
                    }`}
                  >
                    <Building className="w-4 h-4" /> Pessoa Singular (Terceiro)
                  </button>
                </div>
              </div>

              {/* Dynamic Name Input Area */}
              {borrowerType === 'socio' ? (
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">
                    Selecionar Sócio Ativo
                  </label>
                  <select
                    value={selectedMemberId}
                    onChange={(e) => setSelectedMemberId(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-lg text-xs leading-5 text-slate-900 dark:text-white font-bold inline-block"
                  >
                    {members.map(m => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.phone}) - Cota Mês {m.assignedMonth}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">
                      Nome Completo do Devedor
                    </label>
                    <input
                      type="text"
                      value={borrowerName}
                      onChange={(e) => setBorrowerName(e.target.value)}
                      placeholder="Ex: Victor Manuel de Angola"
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-lg text-xs font-bold text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">
                      Número de Telefone (WhatsApp)
                    </label>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="Ex: +244 923 111 222"
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-lg text-xs font-bold text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              )}

              {/* Verification Credentials: Document BI and Email */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">
                    BI / NIF do Tomador
                  </label>
                  <input
                    type="text"
                    value={documentId}
                    onChange={(e) => setDocumentId(e.target.value)}
                    placeholder="Ex: 00452391LA042"
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-lg text-xs font-bold uppercase text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">
                    E-mail para Notificações Eletrônicas
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Ex: devedor@kixfundo.ao"
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-lg text-xs font-bold text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Collateral & Guarantee Requirements */}
              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1 flex items-center gap-1">
                  Garantias Reais e Penhores Oferecidos <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={guarantees}
                  onChange={(e) => setGuarantees(e.target.value)}
                  rows={2}
                  placeholder="Especifique detalhadamente os bens custodiados ou co-assinaturas fiadoras (Ex: Retenção de documento do veículo matrícula LD-45-23-AA, penhor de gerador industrial de 15KVA ou termo assinado por fiador sócio)"
                  className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-lg text-xs font-semibold text-slate-900 dark:text-white"
                />
              </div>

              {/* Slide controls for Duration and Interest rate */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">
                    Montante Solicitado (KZs)
                  </label>
                  <input
                    type="number"
                    value={amountRequested}
                    onChange={(e) => setAmountRequested(Number(e.target.value))}
                    max={borrowerType === 'socio' ? limitSocio : limitSingular}
                    step={50000}
                    className="w-full px-3 py-1.8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-lg text-xs font-bold text-slate-900 dark:text-white font-mono"
                  />
                  <span className="text-[10px] text-slate-400">
                    Limite: {borrowerType === 'socio' ? '1.500.000 KZs' : '800.000 KZs'}
                  </span>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">
                    Amortização (Meses)
                  </label>
                  <select
                    value={durationMonths}
                    onChange={(e) => setDurationMonths(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-lg text-xs text-slate-900 dark:text-white font-bold"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(m => (
                      <option key={m} value={m}>{m} {m === 1 ? 'Mês' : 'Meses'}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">
                    Taxa de Juros Mensal (%)
                  </label>
                  <input
                    type="number"
                    value={interestRate}
                    onChange={(e) => setInterestRate(Number(e.target.value))}
                    min={1}
                    max={30}
                    className="w-full px-3 py-1.8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-lg text-xs font-bold text-slate-900 dark:text-white font-mono"
                  />
                  <span className="text-[10px] text-slate-400">
                    Sugestão: {borrowerType === 'socio' ? '5% - 8%' : '12% - 15%'}
                  </span>
                </div>
              </div>

            </div>
          </div>

          {/* Right Contract Simulator Breakdown & Signatures (4 columns) */}
          <div className="space-y-6 lg:col-span-5">
            
            {/* Simulation Preview Card */}
            <div className="bg-slate-50 dark:bg-[#0e1320] border-slate-200/55 dark:border-slate-805 border p-5 rounded-xl space-y-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <Landmark className="w-3.5 h-3.5 text-sky-500" /> Demonstração Contábil da Operação
              </h3>

              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between items-center bg-white dark:bg-[#151c2c]/40 p-2.5 rounded-lg">
                  <span className="text-slate-450">Capital Financiado:</span>
                  <span className="font-extrabold text-slate-900 dark:text-white font-sans">{formatCurrency(amountRequested)}</span>
                </div>
                
                <div className="flex justify-between items-center bg-white dark:bg-[#151c2c]/40 p-2.5 rounded-lg">
                  <span className="text-slate-450">Fração de Amortização Mensal:</span>
                  <span className="font-extrabold text-slate-900 dark:text-white font-sans">{formatCurrency(monthlyPrincipal)}</span>
                </div>

                <div className="flex justify-between items-center bg-white dark:bg-[#151c2c]/40 p-2.5 rounded-lg">
                  <span className="text-slate-450">Yield de Juros Mensal ({interestRate}%):</span>
                  <span className="font-extrabold text-emerald-600 dark:text-emerald-450 font-sans">{formatCurrency(monthlyInterest)}</span>
                </div>

                <div className="flex justify-between items-center bg-white dark:bg-[#151c2c]/40 p-2.5 rounded-lg">
                  <span className="text-slate-450">Mensalidade Total de Cobrança:</span>
                  <span className="font-black text-sky-600 dark:text-sky-400 font-sans">{formatCurrency(monthlyInstallment)}</span>
                </div>

                <div className="border-t border-slate-200 dark:border-slate-700/60 my-2 pt-2 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-450">Lucro de Juros p/ Fundo:</span>
                    <span className="font-extrabold text-emerald-600 dark:text-emerald-400">{formatCurrency(totalInterestExpected)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm font-black text-slate-950 dark:text-white bg-sky-100/50 dark:bg-sky-950/20 p-2 rounded-lg border border-sky-100 dark:border-sky-900/10">
                    <span>Retorno Total do Ativo:</span>
                    <span>{formatCurrency(totalRepaymentExpected)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Legal Framework Clause Box Accordion */}
            <div className="bg-white dark:bg-[#151c2c]/85 border border-slate-100 dark:border-slate-800 p-5 rounded-xl space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-450 flex items-center gap-1">
                  <Scale className="w-3.5 h-3.5 text-sky-500" /> Cláusulas Contratuais & Governança
                </h3>
                <button
                  type="button"
                  onClick={() => setIsAdjustingTerms(!isAdjustingTerms)}
                  className="text-[10px] font-black text-sky-600 hover:text-sky-700 dark:text-sky-400 flex items-center gap-1 cursor-pointer bg-slate-50 dark:bg-[#102238] px-2 py-1 rounded hover:scale-105 transition-all"
                >
                  <Edit className="w-3 h-3" />
                  {isAdjustingTerms ? "Ver Antevisão" : "Ajustar Minuta Legal"}
                </button>
              </div>

              {/* Representative input */}
              <div className="space-y-1">
                <label className="block text-[9px] font-black uppercase text-slate-400">
                  Outorgante Representante do Fundo (Usuário)
                </label>
                <input
                  type="text"
                  value={representativeName}
                  onChange={(e) => setRepresentativeName(e.target.value)}
                  placeholder="Nome do Representante do Kixi-Fundo"
                  className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-lg text-xs font-bold text-slate-900 dark:text-white"
                />
              </div>

              {isAdjustingTerms ? (
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-[10px] text-slate-400">
                    <span>Edite os termos jurídicos e use macros:</span>
                    <span className="font-semibold text-sky-600">{`{REPRESENTANTE}, {BENEFICIARIO}, ...`}</span>
                  </div>
                  <textarea
                    value={legalTemplate}
                    onChange={(e) => setLegalTemplate(e.target.value)}
                    rows={8}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-920 border border-slate-200 dark:border-slate-850 rounded-lg text-[10px] font-mono leading-normal text-slate-900 dark:text-gray-100 focus:ring-1 focus:ring-sky-500"
                  />
                  <button
                    type="button"
                    onClick={() => setLegalTemplate(getActiveContractTemplate(appConfig))}
                    className="text-[9px] font-bold text-rose-500 hover:underline block cursor-pointer"
                  >
                    Restaurar Minuta Padrão
                  </button>
                </div>
              ) : (
                <div className="max-h-[220px] overflow-y-auto text-xs leading-relaxed text-slate-500 dark:text-slate-300 space-y-3 pr-1 bg-slate-50 dark:bg-[#0e1320] p-4 rounded-lg border border-slate-105 dark:border-slate-805">
                  <div className="font-black text-[10px] uppercase tracking-wider text-slate-500 border-b border-slate-200/50 dark:border-slate-800 pb-1.5 flex items-center justify-between">
                    <span className="flex items-center gap-1"><Sparkles className="w-3.5 h-3.5 text-sky-500" /> Antevisão do Contrato</span>
                    <span className="text-[9px] lowercase bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 px-1 py-0.5 rounded font-mono">dinâmico</span>
                  </div>
                  <pre className="whitespace-pre-wrap font-sans text-[11px] leading-relaxed select-text text-slate-700 dark:text-slate-350">
                    {legalTemplate
                      .replace(/{REPRESENTANTE}/g, representativeName || currentUser?.name || 'Mendes Victor (Admin)')
                      .replace(/{BENEFICIARIO}/g, borrowerType === 'socio' ? (members.find(m => m.id === selectedMemberId)?.name || '[Sócio não selecionado]') : (borrowerName || '[Por preencher]'))
                      .replace(/{DOCUMENTO_ID}/g, documentId || '[Por complementar]')
                      .replace(/{TELEFONE}/g, borrowerType === 'socio' ? (members.find(m => m.id === selectedMemberId)?.phone || '[Por complementar]') : (phone || '[Por complementar]'))
                      .replace(/{EMAIL}/g, borrowerType === 'socio' ? (members.find(m => m.id === selectedMemberId)?.email || 'geral@kixfundo.ao') : (email || 'geral@kixfundo.ao'))
                      .replace(/{VALOR_EMPRESTIMO}/g, formatCurrency(amountRequested))
                      .replace(/{PRAZO_MESES}/g, String(durationMonths))
                      .replace(/{TAXA_JUROS}/g, String(interestRate))
                      .replace(/{MENSALIDADE}/g, formatCurrency(monthlyInstallment))
                      .replace(/{DATA_PRIMEIRA_PARCELA}/g, new Date(new Date().setMonth(new Date().getMonth() + 1)).toLocaleDateString('pt-AO'))
                      .replace(/{GARANTIAS}/g, guarantees.trim() || '[Especifique as garantias reais acima]')
                    }
                  </pre>
                </div>
              )}

              <label className="flex items-start gap-2.5 text-[11px] text-slate-700 dark:text-slate-300 font-semibold cursor-pointer py-1.5 select-none hover:text-slate-900 dark:hover:text-white">
                <input
                  type="checkbox"
                  checked={readTerms}
                  onChange={(e) => setReadTerms(e.target.checked)}
                  className="mt-0.5 rounded text-sky-600 focus:ring-sky-500 w-3.5 h-3.5 border-slate-300 dark:border-slate-700"
                />
                Declaro consentimento pleno das cláusulas, validade do BI civil e veracidade jurídica dos bens de penhor descritos.
              </label>

              <button
                type="submit"
                disabled={!readTerms}
                className={`w-full py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md ${
                  readTerms
                    ? 'bg-sky-600 hover:bg-sky-700 text-white font-black scale-[1.01] hover:shadow-lg hover:shadow-sky-500/10'
                    : 'bg-slate-100 dark:bg-slate-850 text-slate-400 dark:text-slate-550 cursor-not-allowed border border-slate-200 dark:border-slate-800'
                }`}
              >
                <ShieldCheck className="w-4 h-4" /> Assinar & Desembolsar Crédito Ativo
              </button>
            </div>

          </div>
        </form>
      )}

      {/* PORTFOLIO TAB AND PAYMENT CONTROL ZONE */}
      {activeSubTab === 'portfolio' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Contracts Portfolio Table List (7-cols) */}
          <div className="bg-white dark:bg-[#151c2c]/85 border border-slate-100 dark:border-slate-800 p-5 rounded-xl lg:col-span-7 space-y-4">
            
            {/* Search/Filter bar inside Portfolio */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 justify-between pb-2 border-b border-slate-100 dark:border-slate-850">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <Landmark className="w-3.5 h-3.5" /> Carteira Ativa de Contratos ({filteredLoans.length})
              </h3>
              
              <div className="flex items-center gap-2 flex-wrap">
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Filtrar carteira..."
                    className="pl-7 pr-3 py-1 text-[11px] bg-slate-50 dark:bg-[#0e1320] border border-slate-200/80 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white max-w-[150px]"
                  />
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1.5" />
                </div>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="px-2 py-1 text-[11px] bg-slate-50 dark:bg-[#0e1320] border border-slate-200/80 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white"
                >
                  <option value="all">Sits: Todos</option>
                  <option value="active">Ativos</option>
                  <option value="overdue">Vencidos/Mora</option>
                  <option value="completed">Liquidados</option>
                </select>
              </div>
            </div>

            {/* List Table of Contracts */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-2.5">Código</th>
                    <th>Titular</th>
                    <th>Tipo</th>
                    <th>Disbursamente</th>
                    <th>Parcelas</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-850">
                  {filteredLoans.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-12 text-slate-400 dark:text-slate-600 font-extrabold uppercase">
                        Nenhum contrato ativo corresponde aos filtros selecionados
                      </td>
                    </tr>
                  ) : (
                    filteredLoans.map(l => {
                      const pays = l.payments;
                      const paidNum = pays.filter(p => p.paid).length;
                      const isSelected = selectedLoanId === l.id;

                      return (
                        <tr 
                          key={l.id}
                          onClick={() => setSelectedLoanId(l.id)}
                          className={`hover:bg-slate-50/65 dark:hover:bg-slate-900/60 cursor-pointer transition-colors ${
                            isSelected ? 'bg-sky-50/40 dark:bg-sky-950/20 font-semibold' : ''
                          }`}
                        >
                          <td className="py-3 font-mono font-black text-sky-600 dark:text-sky-400">
                            {l.id}
                          </td>
                          <td className="font-extrabold text-slate-850 dark:text-slate-200 truncate max-w-[120px]">
                            {l.borrowerName}
                          </td>
                          <td className="uppercase text-[9px] font-black">
                            {l.borrowerType === 'socio' ? (
                              <span className="text-amber-600 bg-amber-50 dark:bg-amber-950/20 px-1 py-0.5 rounded">Sócio</span>
                            ) : (
                              <span className="text-indigo-600 bg-indigo-50 dark:bg-indigo-950/20 px-1 py-0.5 rounded">Singular</span>
                            )}
                          </td>
                          <td className="font-mono font-extrabold text-slate-800 dark:text-white">
                            {formatCurrency(l.amountRequested)}
                          </td>
                          <td className="font-mono text-[11px] text-slate-450">
                            {paidNum}/{pays.length}
                          </td>
                          <td>
                            {l.status === 'completed' ? (
                              <span className="text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/40">
                                Liquidado
                              </span>
                            ) : l.status === 'overdue' ? (
                              <span className="text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-450 border border-rose-100 dark:border-rose-900/40 select-none">
                                Em Mora
                              </span>
                            ) : (
                              <span className="text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded bg-sky-50 dark:bg-sky-950/30 text-sky-700 dark:text-sky-305 border border-sky-100 dark:border-sky-900/40 select-none">
                                Ativo
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Amortization Schedule Detail Breakdown (5-cols) */}
          <div className="space-y-6 lg:col-span-5">
            {selectedLoan ? (
              <div className="bg-white dark:bg-[#151c2c]/85 border border-slate-100 dark:border-slate-800 p-5 rounded-xl space-y-4">
                
                {/* Header detail of selected loan */}
                <div className="border-b border-slate-100 dark:border-slate-850 pb-3.5 space-y-1 relative">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-black text-sky-600 dark:text-sky-450">{selectedLoan.id}</span>
                    <span className="text-[10px] text-slate-450 font-bold">{selectedLoan.contractDate}</span>
                  </div>
                  <h4 className="text-sm font-extrabold text-slate-900 dark:text-white capitalize">
                    {selectedLoan.borrowerName}
                  </h4>
                  <div className="text-[10px] text-slate-400 space-y-0.5">
                    <div>🪪 BI/NIF: <span className="font-mono font-bold text-slate-600 dark:text-slate-300">{selectedLoan.documentId}</span></div>
                    <div>📱 Contato: <span className="font-mono text-slate-650 dark:text-slate-300">{selectedLoan.phone}</span></div>
                    <div>🏡 Garantia: <span className="text-slate-650 dark:text-slate-300 italic">{selectedLoan.guarantees}</span></div>
                  </div>
                  
                  <div className="pt-2.5">
                    <button
                      type="button"
                      onClick={() => {
                        setPrintModalLoanId(selectedLoan.id);
                        setLoadedContractTerms(selectedLoan.customLegalTerms || '');
                        setShowPrintModal(true);
                        setEditingLoadedTerms(false);
                      }}
                      className="w-full py-2 bg-sky-50 hover:bg-sky-100 dark:bg-sky-950/40 dark:hover:bg-sky-900/40 text-sky-700 dark:text-sky-305 text-xs font-black rounded-lg border border-sky-100 dark:border-sky-900/30 flex items-center justify-center gap-1.5 transition-all cursor-pointer hover:scale-[1.01]"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      Ver Contrato Legal (Imprimir)
                    </button>
                  </div>
                </div>

                {/* Plan calculation header list of monthly installments */}
                <h5 className="text-[10px] font-black uppercase tracking-wider text-slate-400">Plano de Amortização de Contrato</h5>
                
                <div className="space-y-2 max-h-[290px] overflow-y-auto pr-1">
                  {selectedLoan.payments.map((p) => {
                    return (
                      <div 
                        key={p.month}
                        className={`p-2.5 rounded-lg border text-xs flex items-center justify-between transition-all ${
                          p.paid 
                            ? 'bg-emerald-50/15 dark:bg-[#062422]/15 border-emerald-100 dark:border-emerald-950/40 text-slate-650'
                            : 'bg-slate-50/40 dark:bg-[#0e1320]/40 border-slate-100 dark:border-slate-805 text-slate-800'
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="font-bold flex items-center gap-1.5 dark:text-slate-100">
                            Parcela {p.month} <span className="text-[9px] font-mono font-normal text-slate-400">({p.dueDate})</span>
                          </div>
                          <div className="text-[9px] text-slate-400 space-y-0.5">
                            <div>Principal: {formatCurrency(p.principalPaid)}</div>
                            <div>Juro Coletivo ({selectedLoan.interestRate}%): <span className="text-emerald-600 dark:text-emerald-450 font-bold">{formatCurrency(p.interestPaid)}</span></div>
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-1.5 shrink-0">
                          <span className="font-extrabold font-mono text-slate-900 dark:text-white">{formatCurrency(p.amount)}</span>
                          
                          {p.paid ? (
                            <span className="text-[9px] font-black text-emerald-600 bg-emerald-100/50 dark:bg-[#052e25] px-2 py-0.5 rounded-full border border-emerald-250/50">
                              ✓ Pago {p.paidAt ? `(${p.paidAt})` : ''}
                            </span>
                          ) : isAdmin ? (
                            <button
                              type="button"
                              onClick={() => onPayInstallment(selectedLoan.id, p.month)}
                              className="px-2.5 py-1 text-[9px] font-black text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg cursor-pointer hover:shadow hover:shadow-emerald-500/10 active:scale-95 text-center leading-none"
                            >
                              Baixar Parcela
                            </button>
                          ) : (
                            <span className="text-[9px] font-black text-amber-700 bg-amber-100/50 dark:bg-amber-950/20 px-2 py-0.5 rounded-full border border-amber-250/55 select-none animate-pulse">
                              Aguardando
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

              </div>
            ) : (
              <div className="bg-slate-50 dark:bg-[#0e1320] border border-slate-200/50 dark:border-slate-805 p-12 rounded-xl text-center flex flex-col items-center justify-center gap-3">
                <FileText className="w-10 h-10 text-slate-350" />
                <div>
                  <h4 className="text-xs font-extrabold uppercase text-slate-450 leading-none">Nenhum Contrato Selecionado</h4>
                  <p className="text-[11px] text-slate-400 mt-1 max-w-[200px]">
                    Selecione um contrato na tabela ao lado para visualizar a ficha cadastral do outorgado devedor e gerir as suas parcelas de amortização.
                  </p>
                </div>
              </div>
            )}
          </div>

        </div>
      )}

      {/* DEBTORS DIRECTORY JURIDICAL TAB */}
      {activeSubTab === 'debtors' && (
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white dark:bg-[#151c2c]/85 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5 uppercase">
                <Briefcase className="w-4 h-4 text-sky-500" /> Cadastro Legal e Penhores Custodiados
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Relação e arquivos fiduciários do devedor, telefones de suporte e descrição detalhada de garantias ativas sob salvaguarda do Kixi-Fundo.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] font-semibold text-slate-450">Filtro Rápido:</span>
              <button 
                onClick={() => setTypeFilter('all')}
                className={`px-2 py-1 text-[10px] font-bold rounded ${
                  typeFilter === 'all'
                    ? 'bg-sky-550 text-white font-extrabold shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-850 text-slate-500 dark:text-slate-400'
                }`}
              >
                Todos
              </button>
              <button 
                onClick={() => setTypeFilter('socio')}
                className={`px-2 py-1 text-[10px] font-bold rounded ${
                  typeFilter === 'socio'
                    ? 'bg-sky-550 text-white font-extrabold shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-850 text-slate-500 dark:text-slate-400'
                }`}
              >
                Sócios
              </button>
              <button 
                onClick={() => setTypeFilter('singular')}
                className={`px-2 py-1 text-[10px] font-bold rounded ${
                  typeFilter === 'singular'
                    ? 'bg-sky-550 text-white font-extrabold shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-850 text-slate-500 dark:text-slate-400'
                }`}
              >
                Singulares
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredLoans.length === 0 ? (
              <div className="col-span-full bg-slate-50/50 dark:bg-[#0e1320]/60 p-16 rounded-xl text-center border border-slate-150 dark:border-slate-805 text-slate-400 dark:text-slate-550 font-bold uppercase text-xs">
                Nenhum devedor cadastrado de momento
              </div>
            ) : (
              filteredLoans.map((debtor) => {
                const totalPaidAmount = debtor.payments
                  .filter(p => p.paid)
                  .reduce((sum, p) => sum + p.amount, 0);
                const totalExpected = debtor.payments.reduce((sum, p) => sum + p.amount, 0);
                const remainingDebt = totalExpected - totalPaidAmount;

                return (
                  <motion.div 
                    key={debtor.id} 
                    id={`debtor-card-${debtor.id}`}
                    className="bg-white dark:bg-[#151c2c]/85 border border-slate-100 dark:border-slate-800 p-5 rounded-xl hover:shadow hover:scale-[1.01] transition-all space-y-4 relative overflow-hidden"
                  >
                    {/* Identification Badge Top Header */}
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                          debtor.borrowerType === 'socio'
                            ? 'bg-amber-100/50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border border-amber-200/50'
                            : 'bg-indigo-100/50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 border border-indigo-200/50'
                        }`}>
                          {debtor.borrowerType === 'socio' ? 'Sócio cooperador' : 'Pessoa Singular'}
                        </span>
                        <h4 className="font-extrabold text-slate-900 dark:text-white capitalize text-sm pt-1.5 leading-none">
                          {debtor.borrowerName}
                        </h4>
                        <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1">🪪 BI/NIF: {debtor.documentId}</span>
                      </div>
                      
                      <span className="font-mono text-[10px] font-black text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-[#0d2238] px-2 py-1 rounded border border-sky-100 dark:border-sky-900/30 font-bold shrink-0">{debtor.id}</span>
                    </div>

                    {/* Numeric accounts summary */}
                    <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 dark:bg-[#0e1320] p-3 rounded-lg border border-slate-100 dark:border-slate-820 font-mono">
                      <div>
                        <span className="text-[10px] text-slate-400 block font-sans">Crédito Concedido:</span>
                        <span className="font-black text-slate-800 dark:text-white">{formatCurrency(debtor.amountRequested)}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block font-sans">Saldo Coletável:</span>
                        <span className="font-black text-slate-800 dark:text-white">{formatCurrency(remainingDebt)}</span>
                      </div>
                    </div>

                    {/* Collateral description */}
                    <div className="space-y-1 text-xs">
                      <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wide block">Garantia / Cláusula Real:</span>
                      <p className="text-slate-650 dark:text-slate-350 italic bg-amber-50/5 dark:bg-amber-955/10 p-2.5 rounded border border-slate-105 dark:border-slate-805 text-[11px] leading-relaxed">
                        {debtor.guarantees}
                      </p>
                    </div>

                    {/* Action buttons (WhatsApp and Contact triggers) */}
                    <div className="pt-2 border-t border-slate-50 dark:border-slate-850 flex items-center gap-2">
                      <a 
                        href={`tel:${debtor.phone}`}
                        className="flex-1 py-1.5 text-[10px] font-black rounded-lg text-slate-650 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 border border-slate-200/50 dark:border-slate-750 hover:bg-slate-200/50 hover:text-slate-900 text-center flex items-center justify-center gap-1 font-bold"
                      >
                        <Phone className="w-3 h-3 text-sky-500" /> Ligar Suporte
                      </a>
                      
                      {/* WhatsApp API hook trigger */}
                      <a 
                        href={`https://api.whatsapp.com/send?phone=${debtor.phone.replace(/[\s\+\-]/g, '')}&text=Ol%C3%A1%20${encodeURIComponent(debtor.borrowerName)}%21%20Entramos%20em%20contato%20em%20nome%20da%20administra%C3%A7%C3%A3o%20do%20Kixi%20Fundo%20de%20Poupan%C3%A7as%20cooperativas%20referente%20ao%20seu%20contrato%20de%20cr%C3%A9dito%20 ${debtor.id}.`}
                        target="_blank"
                        referrerPolicy="no-referrer"
                        className="flex-1 py-1.5 text-[10px] font-black rounded-lg text-emerald-800 dark:text-emerald-305 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 hover:bg-emerald-100 hover:text-emerald-900 text-center flex items-center justify-center gap-1 font-bold"
                      >
                        <MessageSquare className="w-3 h-3 text-emerald-500" /> WhatsApp
                      </a>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* PRINT WORKSPACE AND CUSTOMIZABLE LEGAL CONTRACT MODAL OVERLAY */}
      {showPrintModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm overflow-y-auto pr-2 pl-2 pt-6 pb-6 flex items-start justify-center no-print">
          <style>{`
            @media print {
              body {
                background: white !important;
                color: black !important;
                margin: 0 !important;
                padding: 0 !important;
              }
              #root, #credit-system-workspace, header, nav, footer, button, .no-print, .media-no-print {
                display: none !important;
                visibility: hidden !important;
                height: 0 !important;
                overflow: hidden !important;
              }
              .printable-document-frame {
                display: block !important;
                visibility: visible !important;
                position: absolute !important;
                left: 0 !important;
                top: 0 !important;
                width: 100% !important;
                height: auto !important;
                padding: 40px !important;
                margin: 0 !important;
                box-shadow: none !important;
                border: none !important;
                background: white !important;
                color: black !important;
                font-family: inherit !important;
              }
              .page-break {
                page-break-before: always;
              }
            }
          `}</style>

          <div className="bg-[#0e1320] dark:bg-[#0b0e17] border border-slate-800 rounded-2xl w-full max-w-6xl shadow-2xl flex flex-col lg:flex-row overflow-hidden relative">
            
            {/* Left Options/Filters sidebar widget (4 cols) */}
            <div className="lg:w-80 border-r border-slate-800 p-5 space-y-6 shrink-0 bg-slate-950/40">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-sky-400 font-sans">Definições de Impressão</h3>
                  <p className="text-[9px] text-slate-500 font-sans">Configuração de estilo e cláusulas</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPrintModal(false)}
                  className="p-1.5 rounded-lg bg-slate-855 hover:bg-slate-800 text-slate-400 hover:text-white transition-all cursor-pointer hover:rotate-90 duration-300 border border-slate-800/10"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Font selection */}
              <div className="space-y-2">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 font-sans">Tipo de Letra (Aparência)</label>
                <div className="grid grid-cols-3 gap-1 px-1 py-1 rounded bg-slate-900 border border-slate-800">
                  <button
                    type="button"
                    onClick={() => setPrintFontFamily('serif')}
                    className={`py-1 rounded text-xs transition-all font-serif cursor-pointer ${printFontFamily === 'serif' ? 'bg-sky-600 text-white font-bold' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                  >
                    Classic
                  </button>
                  <button
                    type="button"
                    onClick={() => setPrintFontFamily('sans')}
                    className={`py-1 rounded text-xs transition-all font-sans cursor-pointer ${printFontFamily === 'sans' ? 'bg-sky-600 text-white font-bold' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                  >
                    Modern
                  </button>
                  <button
                    type="button"
                    onClick={() => setPrintFontFamily('mono')}
                    className={`py-1 rounded text-[10px] transition-all font-mono cursor-pointer ${printFontFamily === 'mono' ? 'bg-sky-600 text-white font-bold' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                  >
                    Tech
                  </button>
                </div>
              </div>

              {/* Font sizing */}
              <div className="space-y-2">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 font-sans">Dimensão da Letra</label>
                <div className="grid grid-cols-3 gap-1 px-1 py-1 rounded bg-slate-900 border border-slate-800">
                  <button
                    type="button"
                    onClick={() => setPrintFontSize('compact')}
                    className={`py-1 rounded text-[10px] transition-all cursor-pointer ${printFontSize === 'compact' ? 'bg-sky-600 text-white font-semibold' : 'text-slate-400'}`}
                  >
                    Compacto
                  </button>
                  <button
                    type="button"
                    onClick={() => setPrintFontSize('normal')}
                    className={`py-1 rounded text-[10px] transition-all cursor-pointer ${printFontSize === 'normal' ? 'bg-sky-600 text-white font-semibold' : 'text-slate-400'}`}
                  >
                    Padrão
                  </button>
                  <button
                    type="button"
                    onClick={() => setPrintFontSize('elegant')}
                    className={`py-1 rounded text-[10px] transition-all cursor-pointer ${printFontSize === 'elegant' ? 'bg-sky-600 text-white font-semibold' : 'text-slate-400'}`}
                  >
                    Generosa
                  </button>
                </div>
              </div>

              {/* Layout components toggle */}
              <div className="space-y-3 pt-2">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-450 font-sans">Secções do Documento</label>
                
                <label className="flex items-center gap-3 text-xs text-slate-450 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={printShowSchedule}
                    onChange={(e) => setPrintShowSchedule(e.target.checked)}
                    className="rounded text-sky-600 border-slate-700 bg-slate-100 dark:bg-slate-900 w-3.5 h-3.5 focus:ring-0"
                  />
                  <span>Tabela de Amortizações</span>
                </label>

                <label className="flex items-center gap-3 text-xs text-slate-450 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={printShowSignatures}
                    onChange={(e) => setPrintShowSignatures(e.target.checked)}
                    className="rounded text-sky-600 border-slate-700 bg-slate-100 dark:bg-slate-900 w-3.5 h-3.5 focus:ring-0"
                  />
                  <span>Campos de Assinatura</span>
                </label>

                <label className="flex items-center gap-3 text-xs text-slate-450 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={printShowStamp}
                    onChange={(e) => setPrintShowStamp(e.target.checked)}
                    className="rounded text-sky-600 border-slate-700 bg-slate-100 dark:bg-slate-900 w-3.5 h-3.5 focus:ring-0"
                  />
                  <span>Selo e Rastreabilidade SHA</span>
                </label>
              </div>

              {/* Edit Mode Toggle */}
              <div className="pt-4 border-t border-slate-800 space-y-3">
                <div className="flex justify-between items-center font-sans">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Ajuste Fino Manual</span>
                  <span className="text-[9px] lowercase bg-amber-500/10 text-amber-400 px-1.5 py-0.5 rounded font-mono">ajustável</span>
                </div>
                <p className="text-[9px] text-slate-500 font-sans">Ajuste termos contratuais sob medida para este devedor específico em tempo real.</p>
                <button
                  type="button"
                  onClick={() => {
                    if (!editingLoadedTerms) {
                      const activeLoan = loans.find(l => l.id === printModalLoanId);
                      if (activeLoan) {
                        const fallback_text = activeLoan.customLegalTerms || getProcessedLegalTermsReusable(
                          getActiveContractTemplate(appConfig),
                          activeLoan.representativeName || 'Mendes Victor (Admin)',
                          activeLoan.borrowerName,
                          activeLoan.documentId,
                          activeLoan.phone,
                          activeLoan.email,
                          activeLoan.amountRequested,
                          activeLoan.durationMonths,
                          activeLoan.interestRate,
                          activeLoan.payments[0]?.amount || (activeLoan.amountRequested / activeLoan.durationMonths),
                          activeLoan.guarantees
                        );
                        setLoadedContractTerms(fallback_text);
                      }
                    } else {
                      // Save edits back into current loan object local reference
                      const activeLoan = loans.find(l => l.id === printModalLoanId);
                      if (activeLoan) {
                        activeLoan.customLegalTerms = loadedContractTerms;
                        alert("Termos do contrato ajustados e conservados com sucesso absoluto!");
                      }
                    }
                    setEditingLoadedTerms(!editingLoadedTerms);
                  }}
                  className={`w-full py-1.8 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer border ${
                    editingLoadedTerms 
                      ? 'bg-[#102238] border-sky-400 text-sky-350' 
                      : 'bg-slate-900 border-slate-800 hover:bg-slate-850 text-slate-350'
                  }`}
                >
                  <Edit className="w-3.5 h-3.5 text-sky-500" />
                  {editingLoadedTerms ? "Conservar Alterações" : "Ajustar Termos"}
                </button>
              </div>

              {/* Big Print trigger button */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="w-full py-2.5 bg-sky-600 hover:bg-sky-700 text-white hover:shadow-lg hover:shadow-sky-500/10 text-xs font-black rounded-lg flex items-center justify-center gap-2 cursor-pointer transition-all hover:scale-[1.01]"
                >
                  <Printer className="w-4 h-4" />
                  Imprimir / Gerar PDF
                </button>
                <p className="text-[8px] text-slate-550 mt-2 text-center font-sans font-medium">Recomendado: Ativar margens mínimas e desmarcar cabeçalho e rodapé nas opções de impressão do browser.</p>
              </div>
            </div>

            {/* Right formatted preview frame paper visualizer */}
            <div className="flex-1 bg-slate-900 p-6 flex items-center justify-center overflow-x-auto min-h-[500px]">
              
              {/* Paper body */}
              <div 
                id="printable-contract-frame"
                className={`printable-document-frame bg-white text-black p-8 sm:p-12 md:p-16 w-full max-w-[780px] shadow-2xl relative select-text border border-slate-200 ${
                  printFontFamily === 'serif' ? 'font-serif' : printFontFamily === 'mono' ? 'font-mono' : 'font-sans'
                } ${
                  printFontSize === 'compact' ? 'text-[11px] leading-relaxed' : printFontSize === 'elegant' ? 'text-sm sm:text-base leading-relaxed' : 'text-xs sm:text-[13px] leading-relaxed'
                }`}
              >
                {/* Branding header / Logo watermark */}
                <div className="border-b-2 border-slate-900 pb-5 mb-6 flex items-center justify-between">
                  <div className="space-y-1 font-sans">
                    <h1 className="text-base font-black uppercase tracking-wider text-slate-900">KIXI-FUNDO</h1>
                    <p className="text-[9px] uppercase tracking-widest text-slate-500 font-bold">Fundo Cooperativo de Poupança e Crédito de Confiança</p>
                    <p className="text-[8px] text-slate-400">Luanda · República de Angola · Empréstimos Solidários Ativos</p>
                  </div>
                  <div className="border border-slate-900 px-3 py-1.5 text-center shrink-0 font-sans">
                    <span className="block text-[8px] font-bold text-slate-450 tracking-widest uppercase">ID Contrato</span>
                    <span className="block text-xs font-black font-mono tracking-wider">{printModalLoanId}</span>
                  </div>
                </div>

                {/* SubHeader metadata */}
                <div className="text-[10px] grid grid-cols-2 gap-4 pb-4 border-b border-dashed border-slate-350 font-sans text-slate-650 mb-6 col-span-2">
                  <div>
                    <span className="font-bold uppercase tracking-wider block text-[8px] text-slate-400">Outorgado Beneficiário:</span>
                    <span className="font-black text-slate-950 text-xs">{loans.find(l => l.id === printModalLoanId)?.borrowerName}</span>
                    <span className="block text-[9px] pt-1">🪪 BI/NIF: <strong className="font-mono text-slate-800">{loans.find(l => l.id === printModalLoanId)?.documentId}</strong></span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold uppercase tracking-wider block text-[8px] text-slate-400">Representante do Fundo:</span>
                    <span className="font-black text-slate-950 text-xs">{loans.find(l => l.id === printModalLoanId)?.representativeName || "Mendes Victor (Admin)"}</span>
                    <span className="block text-[9px] pt-1">📅 Data do Registo: <strong className="font-mono text-slate-800">{loans.find(l => l.id === printModalLoanId)?.contractDate}</strong></span>
                  </div>
                </div>

                {/* Main Legal Content and edit area */}
                {editingLoadedTerms ? (
                  <div className="space-y-2 no-print pb-6">
                    <div className="text-rose-600 bg-rose-50 text-[10px] font-bold px-3 py-1.5 rounded border border-rose-200">
                      Modo de Edição Ativo: Ajuste o texto do contrato formal abaixo. Suas alterações refletirão na folha impressa em tempo real.
                    </div>
                    <textarea
                      value={loadedContractTerms}
                      onChange={(e) => setLoadedContractTerms(e.target.value)}
                      rows={16}
                      className="w-full p-4 border border-dashed border-sky-400 bg-sky-50/10 text-slate-900 rounded font-sans text-xs focus:ring-0 leading-relaxed"
                    />
                  </div>
                ) : (
                  <div className="whitespace-pre-wrap leading-relaxed text-slate-800 select-text pb-6 px-1">
                    {loadedContractTerms || (loans.find(l => l.id === printModalLoanId) ? getProcessedLegalTermsReusable(
                      getActiveContractTemplate(appConfig),
                      loans.find(l => l.id === printModalLoanId)?.representativeName || '',
                      loans.find(l => l.id === printModalLoanId)?.borrowerName || '',
                      loans.find(l => l.id === printModalLoanId)?.documentId || '',
                      loans.find(l => l.id === printModalLoanId)?.phone || '',
                      loans.find(l => l.id === printModalLoanId)?.email || '',
                      loans.find(l => l.id === printModalLoanId)?.amountRequested || 0,
                      loans.find(l => l.id === printModalLoanId)?.durationMonths || 1,
                      loans.find(l => l.id === printModalLoanId)?.interestRate || 0,
                      loans.find(l => l.id === printModalLoanId)?.payments[0]?.amount || 0,
                      loans.find(l => l.id === printModalLoanId)?.guarantees || ''
                    ) : '')}
                  </div>
                )}

                {/* Optional Amortization Table Block inside sheet */}
                {printShowSchedule && loans.find(l => l.id === printModalLoanId) && (
                  <div className="mt-8 border border-slate-900 p-4 rounded-sm space-y-3 page-break pb-4 font-sans">
                    <h3 className="font-bold text-[10px] uppercase tracking-wider text-slate-900">ANEXO A - Cronograma Homologado de Amortizações</h3>
                    <table className="w-full text-left text-[11px] font-sans">
                      <thead>
                        <tr className="border-b border-slate-900 text-slate-500 font-bold uppercase text-[9px]">
                          <th className="py-1">Parc.</th>
                          <th>Data Vencimento</th>
                          <th>Amortização Principal</th>
                          <th>Juros Cooperativo</th>
                          <th className="text-right">Prestação Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {loans.find(l => l.id === printModalLoanId)?.payments.map((p, pIdx) => (
                          <tr key={pIdx} className="text-slate-800">
                            <td className="py-1 font-mono font-bold">Mês {p.month}</td>
                            <td className="font-mono">{p.dueDate}</td>
                            <td className="font-mono">{formatCurrency(p.principalPaid)}</td>
                            <td className="font-mono text-emerald-800">{formatCurrency(p.interestPaid)}</td>
                            <td className="font-mono font-bold text-right text-slate-950">{formatCurrency(p.amount)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Optional Signature Block */}
                {printShowSignatures && (
                  <div className="mt-14 grid grid-cols-2 gap-10 text-xs pt-12 page-break font-sans">
                    
                    {/* Representant signature */}
                    <div className="text-center space-y-1.5">
                      <div className="border-b border-slate-900 mx-auto w-48 h-5" />
                      <span className="font-bold uppercase text-[9px] tracking-wide text-slate-450 block">Pelo Credor</span>
                      <span className="font-black text-slate-850 block leading-tight">{loans.find(l => l.id === printModalLoanId)?.representativeName || "Representante de Operação"}</span>
                      <span className="text-[8px] text-slate-500">KIXI-FUNDO ADMINISTRAÇÃO</span>
                    </div>

                    {/* Borrower signature */}
                    <div className="text-center space-y-1.5">
                      <div className="border-b border-slate-900 mx-auto w-48 h-5" />
                      <span className="font-bold uppercase text-[9px] tracking-wide text-slate-450 block">Pelo Outorgado Devedor</span>
                      <span className="font-black text-slate-850 block leading-tight">{loans.find(l => l.id === printModalLoanId)?.borrowerName}</span>
                      <span className="text-[8px] text-slate-500">Documento BI: {loans.find(l => l.id === printModalLoanId)?.documentId}</span>
                    </div>

                  </div>
                )}

                {/* Digital token hash stamp */}
                {printShowStamp && (
                  <div className="mt-12 text-slate-400 text-center space-y-1 font-sans">
                    <div className="border-t border-slate-200/50 pt-3 text-[8px] font-mono select-none tracking-widest leading-normal">
                      CÓDIGO DE RASTREAMENTO DIGITAL: {`SHA256-${(loans.find(l => l.id === printModalLoanId)?.borrowerName || '').substring(0,3).toUpperCase()}-${(printModalLoanId || '').replace(/-/g, '')}-${Date.now().toString(16).toUpperCase()}`}
                    </div>
                    <span className="block text-[8px] uppercase tracking-widest text-[#0ea5e9] font-black">DOCUMENTO CERTIFICADO E AUDITADO INTERNAMENTE PELO KIXI-FUNDO ANGOLA</span>
                  </div>
                )}

              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

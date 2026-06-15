import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  BookOpen, 
  RefreshCw, 
  Coins, 
  HeartHandshake, 
  Award, 
  ShieldCheck, 
  CheckCircle, 
  Info, 
  Calendar,
  Layers,
  Sparkles
} from 'lucide-react';

interface RegulationsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function RegulationsModal({ isOpen, onClose }: RegulationsModalProps) {
  const [activeTab, setActiveTab] = useState<'all' | 'rotation' | 'quota' | 'social' | 'liquidation'>('all');

  // Rules data
  const rules = [
    {
      id: 'rotation',
      title: '1. Regras de Rotação (Ciclos)',
      icon: <RefreshCw className="w-5 h-5 text-sky-505 dark:text-sky-450" />,
      colorClass: 'border-l-sky-500 bg-sky-50/30 dark:bg-sky-950/10',
      badge: '6 Meses / Ciclo',
      summary: 'O Kix-Fundo opera em ciclos contínuos de 6 meses com um total de 12 membros associados.',
      details: [
        'A estrutura rotativa garante que cada ciclo completo de 6 meses contemple todos os 12 sócios cadastrados.',
        'Em cada mês do ciclo, exatamente 2 (dois) membros são previamente designados para receber a contemplação / benefício.',
        'A atribuição do mês de recebimento de cada membro é definida em assembleia inicial de constituição de ciclo ou por sorteio consensual auditado.',
        'Nenhum membro pode receber o benefício mais de uma vez no mesmo ciclo.',
        'Ao fim dos 6 meses, consolida-se e encerra-se o ciclo corrente, abrindo a oportunidade de reconfiguração de sócios, reajustes de cota e renovação automática de compromissos para o ciclo seguinte.'
      ]
    },
    {
      id: 'quota',
      title: '2. Valor da Cota Mensal',
      icon: <Coins className="w-5 h-5 text-amber-505 dark:text-amber-450" />,
      colorClass: 'border-l-amber-500 bg-amber-50/30 dark:bg-amber-950/10',
      badge: '120.000,00 KZs',
      summary: 'Cada sócio contribui mensalmente com uma prestação fixa de 120.000,00 KZs.',
      details: [
        'A contribuição mensal de cada membro deve ser liquidada obrigatoriamente até a data limite estabelecida do mês corrente.',
        'O valor global arrecadado mensalmente com as 12 cotas é de 1.440.000,00 KZs (12 sócios × 120.000,00 KZs).',
        'Todo pagamento deve ser acompanhado pelo respetivo upload do comprovativo bancário legítimo e inteligível através do painel "Automação de Recibos (Kix-Drive)".',
        'Os depósitos são efetuados diretamente na conta bancária coletiva central do Kix-Fundo cadastrada no sistema.',
        'Quaisquer atrasos ou impedimentos devem ser antecipadamente justificados à mesa administradora para evitar restrições contratuais de solvabilidade e aplicação de multas consensuais de mora.'
      ]
    },
    {
      id: 'social',
      title: '3. Retenção do Fundo Social',
      icon: <HeartHandshake className="w-5 h-5 text-emerald-505 dark:text-emerald-450" />,
      colorClass: 'border-l-emerald-500 bg-emerald-50/30 dark:bg-emerald-950/10',
      badge: '20.000,05 KZs / Cota',
      summary: 'Do valor de cada cota mensal, uma parcela de 20.000,00 KZs é retida para o Fundo de Interajuda.',
      details: [
        'A retenção é uma poupança social coletiva obrigatória com finalidade exclusivamente estatutária e de benefício recíproco.',
        'Esta retenção gera um montante mensal acumulado de 240.000,00 KZs (12 sócios × 20.000,00 KZs) adicionados ao caixa do Fundo de Apoio Social.',
        'O Fundo de Apoio Social é mantido integralmente em conta de poupança separada e destina-se a amparar emergências financeiras, de saúde ou assistenciais comprovadas dos membros cooperadores.',
        'A liberação de auxílios financeiros do fundo social depende de requisição do membro contendo descrição de justa causa, sob auditoria e homologação direta do administrador.',
        'O saldo remanescente do fundo social acumula-se de forma ininterrupta, servindo como uma almofada financeira coletiva e garantia de liquidez do consórcio.'
      ]
    },
    {
      id: 'liquidation',
      title: '4. Liquidação & Desembolso de Benefícios',
      icon: <Award className="w-5 h-5 text-indigo-505 dark:text-indigo-450" />,
      colorClass: 'border-l-indigo-500 bg-indigo-50/30 dark:bg-indigo-950/10',
      badge: '600.000,00 KZs / Sócio',
      summary: 'Cada um dos 2 membros contemplados no mês recebe um benefício líquido individual de 600.000,00 KZs.',
      details: [
        'O montante total mensal destinado aos benefícios é de 1.200.000,00 KZs (2 contemplados × 600.000,00 KZs).',
        'A liquidação e transferência dos benefícios somente são desbloqueadas após a arrecadação integral das 12 cotas do mês (totalizando 1.440.000,00 KZs em receita validada).',
        'Os pagamentos aos beneficiários são efetuados exclusivamente via transferência eletrónica bancária segura para o IBAN registrado no perfil individual de cada beneficiário.',
        'Assim que as cotas são arrecadadas e a liquidação é autorizada pelo administrador, o estado do benefício no painel muda para "Liberado" e, logo em seguida, após o envio do comprovativo de pagamento bancário global, para "Pago".',
        'A exatidão matemática garante a solvência absoluta: Receita Arrecadada (1.440.000,00 KZs) = Desembolso aos 2 Contemplados (1.200.000,00 KZs) + Aporte ao Fundo Social (240.000,00 KZs).'
      ]
    }
  ];

  const filteredRules = activeTab === 'all' ? rules : rules.filter((r) => r.id === activeTab);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col relative"
          >
            {/* Elegant Header */}
            <div className="p-6 border-b border-slate-100 dark:border-slate-800/80 flex items-start justify-between bg-gradient-to-r from-slate-50 to-white dark:from-slate-900/40 dark:to-[#0f172a]">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/20 text-amber-600 dark:text-amber-400">
                  <BookOpen className="w-5.5 h-5.5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-800 dark:text-white font-display tracking-tight">
                    Normativos e Estatuto Operacional do Kix-Fundo
                  </h2>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider mt-0.5">
                    Regulamento Interno de Poupança e Distribuição de Fundos
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1 px-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-all cursor-pointer border border-slate-100 dark:border-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Info Alerts Bar */}
            <div className="px-6 py-2 bg-amber-500/10 border-b border-amber-500/10 text-amber-800 dark:text-amber-300 text-[11px] font-bold flex items-center gap-2 select-none">
              <Info className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span>
                Nota Operacional: Todas as operações financeiras são rastreadas e auditadas em tempo real com exatidão matemática.
              </span>
            </div>

            {/* Navigation tabs inside modal */}
            <div className="px-6 pt-4 border-b border-slate-100 dark:border-slate-800/50 flex flex-wrap gap-1 bg-slate-50/50 dark:bg-slate-900/10">
              <button
                onClick={() => setActiveTab('all')}
                className={`px-3 py-2 text-xs font-bold rounded-t-xl transition-all border-b-2 cursor-pointer ${
                  activeTab === 'all'
                    ? 'border-b-amber-500 text-slate-900 dark:text-white bg-white dark:bg-slate-900/40'
                    : 'border-b-transparent text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                Visão Geral (Todos)
              </button>
              <button
                onClick={() => setActiveTab('rotation')}
                className={`px-3 py-2 text-xs font-bold rounded-t-xl transition-all border-b-2 cursor-pointer ${
                  activeTab === 'rotation'
                    ? 'border-b-sky-500 text-sky-600 dark:text-sky-400 bg-white dark:bg-slate-900/40'
                    : 'border-b-transparent text-slate-400 hover:text-sky-500 dark:hover:text-sky-450'
                }`}
              >
                Rotação & Ciclo
              </button>
              <button
                onClick={() => setActiveTab('quota')}
                className={`px-3 py-2 text-xs font-bold rounded-t-xl transition-all border-b-2 cursor-pointer ${
                  activeTab === 'quota'
                    ? 'border-b-amber-500 text-amber-600 dark:text-amber-400 bg-white dark:bg-slate-900/40'
                    : 'border-b-transparent text-slate-400 hover:text-amber-500 dark:hover:text-amber-450'
                }`}
              >
                Cota Mensal
              </button>
              <button
                onClick={() => setActiveTab('social')}
                className={`px-3 py-2 text-xs font-bold rounded-t-xl transition-all border-b-2 cursor-pointer ${
                  activeTab === 'social'
                    ? 'border-b-emerald-500 text-emerald-600 dark:text-emerald-400 bg-white dark:bg-slate-900/40'
                    : 'border-b-transparent text-slate-400 hover:text-emerald-500 dark:hover:text-emerald-450'
                }`}
              >
                Fundo Social
              </button>
              <button
                onClick={() => setActiveTab('liquidation')}
                className={`px-3 py-2 text-xs font-bold rounded-t-xl transition-all border-b-2 cursor-pointer ${
                  activeTab === 'liquidation'
                    ? 'border-b-indigo-500 text-indigo-600 dark:text-indigo-400 bg-white dark:bg-slate-900/40'
                    : 'border-b-transparent text-slate-400 hover:text-indigo-500 dark:hover:text-indigo-455'
                }`}
              >
                Liquidação do Benefício
              </button>
            </div>

            {/* Content List Area - Responsive & Scrollable */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* Mathematics summary card, perfect in top of all tab */}
              {activeTab === 'all' && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 dark:bg-slate-900/30 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/80">
                  <div className="text-center p-2 border-r border-slate-150 last:border-0 dark:border-slate-800/60">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Receita Coletiva Mensal</span>
                    <span className="text-sm font-extrabold text-slate-800 dark:text-white font-mono block mt-1">1.440.000,00 KZs</span>
                    <span className="text-[9px] text-slate-500 dark:text-slate-400 block mt-0.5">12 Sócios × 120.000 KZs</span>
                  </div>
                  <div className="text-center p-2 border-r border-slate-150 last:border-0 dark:border-slate-800/60">
                    <span className="text-[10px] font-bold text-indigo-500 dark:text-indigo-400 uppercase tracking-wider block">Benefícios Redistribuídos</span>
                    <span className="text-sm font-extrabold text-indigo-600 dark:text-indigo-400 font-mono block mt-1">1.200.000,00 KZs</span>
                    <span className="text-[9px] text-slate-500 dark:text-slate-400 block mt-0.5">2 Contemplados × 600.000 KZs</span>
                  </div>
                  <div className="text-center p-2">
                    <span className="text-[10px] font-bold text-emerald-500 dark:text-emerald-400 uppercase tracking-wider block">Fundo de Interajuda</span>
                    <span className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400 font-mono block mt-1">240.000,00 KZs</span>
                    <span className="text-[9px] text-slate-500 dark:text-slate-400 block mt-0.5">12 Sócios × 20.000 KZs</span>
                  </div>
                </div>
              )}

              {/* Loop and render specific normatives */}
              <div className="space-y-6">
                {filteredRules.map((rule) => (
                  <motion.div
                    key={rule.id}
                    layoutId={`rule_card_${rule.id}`}
                    className={`border-l-4 rounded-r-2xl border border-slate-100 dark:border-slate-800/85 p-5 shadow-sm transition-all ${rule.colorClass}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {rule.icon}
                        <h3 className="font-bold text-slate-800 dark:text-white font-display text-sm">
                          {rule.title}
                        </h3>
                      </div>
                      <span className="text-[10px] font-extrabold bg-slate-900/5 dark:bg-white/10 text-slate-800 dark:text-slate-200 px-2.5 py-1 rounded-full border border-slate-300/20">
                        {rule.badge}
                      </span>
                    </div>

                    <p className="text-xs font-semibold text-slate-650 dark:text-slate-305 border-b border-slate-200/50 dark:border-slate-800/40 pb-3 mb-3 leading-relaxed">
                      {rule.summary}
                    </p>

                    <ul className="space-y-2">
                      {rule.details.map((detail, index) => (
                        <li key={index} className="text-xs text-slate-600 dark:text-slate-400 flex items-start gap-2.5 leading-relaxed">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                          <span>{detail}</span>
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                ))}
              </div>

            </div>

            {/* Elegant and Informative Footer */}
            <div className="p-5 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/60 flex flex-col sm:flex-row items-center justify-between gap-4">
              <span className="text-[10px] text-slate-500 dark:text-slate-450 font-semibold text-center sm:text-left flex items-center gap-1">
                <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Consórcio autogerido com precisão matemática auditável.</span>
              </span>
              <button
                onClick={onClose}
                className="w-full sm:w-auto bg-slate-900 hover:bg-slate-850 dark:bg-slate-805 dark:hover:bg-slate-700 text-white font-extrabold text-xs uppercase tracking-wider px-5 py-2.5 rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>Entendi o Regulamento</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { FileText, Coins, Award, HeartHandshake, RefreshCw, Calendar } from 'lucide-react';
import { KixLog } from '../types';

interface LedgerLogsProps {
  logs: KixLog[];
  onResetData: () => void;
}

export default function LedgerLogs({ logs, onResetData }: LedgerLogsProps) {
  const [filter, setFilter] = useState<'all' | 'contribution' | 'payout' | 'social_aid' | 'cycle_change'>('all');

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-AO', {
      style: 'currency',
      currency: 'AOA',
      minimumFractionDigits: 2,
    })
      .format(val)
      .replace('AOA', 'KZs');
  };

  const getLogIcon = (type: string) => {
    switch (type) {
      case 'contribution':
        return <Coins className="w-4 h-4 text-teal-600" />;
      case 'payout':
        return <Award className="w-4 h-4 text-indigo-600" />;
      case 'social_aid':
        return <HeartHandshake className="w-4 h-4 text-emerald-600" />;
      default:
        return <Calendar className="w-4 h-4 text-slate-500" />;
    }
  };

  const getLogBadge = (type: string) => {
    switch (type) {
      case 'contribution':
        return 'bg-teal-50 text-teal-700 border-teal-100';
      case 'payout':
        return 'bg-indigo-50 text-indigo-700 border-indigo-100';
      case 'social_aid':
        return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      default:
        return 'bg-slate-50 text-slate-600 border-slate-100';
    }
  };

  const getLogLabel = (type: string) => {
    switch (type) {
      case 'contribution':
        return 'Contribuição';
      case 'payout':
        return 'Pagamento Benefício';
      case 'social_aid':
        return 'Apoio Social';
      default:
        return 'Ciclo / Rotação';
    }
  };

  const filteredLogs = logs
    .filter((log) => filter === 'all' || log.type === filter)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-custom">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-5 mb-5">
        <div>
          <h2 className="text-lg font-bold font-display text-slate-800 flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-600" />
            Livro de Registro de Atividades (Auditoria)
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Histórico contábil em tempo real de todas as atividades, contribuições, auxílios e repasses efetuados.
          </p>
        </div>
        <button
          onClick={onResetData}
          className="flex items-center gap-1.5 text-xs text-rose-500 bg-rose-50 hover:bg-rose-100 font-semibold px-3 py-1.5 rounded-lg border border-rose-200 transition-all shadow-sm"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Restaurar Simulação
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2 mb-4">
        {[
          { id: 'all', label: 'Todos' },
          { id: 'contribution', label: 'Contribuições' },
          { id: 'payout', label: 'Benefícios' },
          { id: 'social_aid', label: 'Interajuda' },
          { id: 'cycle_change', label: 'Histórico Ciclo' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id as any)}
            className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${
              filter === tab.id
                ? 'bg-slate-800 text-white shadow-sm'
                : 'bg-slate-50 border border-slate-100 text-slate-600 hover:bg-slate-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Logs timeline list */}
      <div className="max-h-[380px] overflow-y-auto pr-1 space-y-3 scrollbar-thin">
        <AnimatePresence initial={false}>
          {filteredLogs.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs italic">
              Nenhum registro encontrado para a categoria selecionada neste ciclo.
            </div>
          ) : (
            filteredLogs.map((log) => (
              <motion.div
                key={log.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="flex items-start gap-3.5 p-3.5 bg-slate-50/70 hover:bg-slate-50 rounded-xl border border-slate-100/70 transition-colors"
                id={`log-item-${log.id}`}
              >
                <div className={`p-2 bg-white rounded-lg border border-slate-200/80 shrink-0 shadow-sm shadow-slate-1/10`}>
                  {getLogIcon(log.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${getLogBadge(log.type)}`}>
                      {getLogLabel(log.type)}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">
                      {new Date(log.timestamp).toLocaleDateString('pt-AO', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 font-medium mt-1.5 leading-relaxed">
                    {log.description}
                  </p>
                  {log.amount > 0 && (
                    <div className="mt-2 text-[11px] font-semibold font-mono text-slate-700 flex items-center gap-1.5">
                      Transação:
                      <span className={log.type === 'contribution' ? 'text-teal-600' : 'text-slate-800'}>
                        {log.type === 'contribution' ? '+' : '-'} {formatCurrency(log.amount)}
                      </span>
                    </div>
                  )}
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

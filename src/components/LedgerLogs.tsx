import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { FileText, Coins, Award, HeartHandshake, RefreshCw, Calendar, Search, X, Filter } from 'lucide-react';
import { KixLog } from '../types';

interface LedgerLogsProps {
  logs: KixLog[];
  onResetData: () => void;
}

export default function LedgerLogs({ logs, onResetData }: LedgerLogsProps) {
  const [filter, setFilter] = useState<'all' | 'contribution' | 'payout' | 'social_aid' | 'cycle_change'>('all');
  const [searchQuery, setSearchQuery] = useState('');

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
        return <Coins className="w-4 h-4 text-teal-600 dark:text-teal-400" />;
      case 'payout':
        return <Award className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />;
      case 'social_aid':
        return <HeartHandshake className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
      default:
        return <Calendar className="w-4 h-4 text-slate-500 dark:text-slate-400" />;
    }
  };

  const getLogBadge = (type: string) => {
    switch (type) {
      case 'contribution':
        return 'bg-teal-50 dark:bg-teal-950/30 text-teal-700 dark:text-teal-400 border-teal-100 dark:border-teal-900/30';
      case 'payout':
        return 'bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-400 border-indigo-100 dark:border-indigo-900/30';
      case 'social_aid':
        return 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/30';
      default:
        return 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-350 border-slate-100 dark:border-slate-750';
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

  // 1. Filter by category
  const categoryFiltered = logs.filter((log) => filter === 'all' || log.type === filter);

  // 2. Filter by search query (member name matching in description)
  const filteredLogs = categoryFiltered
    .filter((log) => {
      if (!searchQuery.trim()) return true;
      return log.description.toLowerCase().includes(searchQuery.toLowerCase());
    })
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  // Dynamic filter counts based on current search query to reflect matches!
  const getFilterCount = (type: 'all' | 'contribution' | 'payout' | 'social_aid' | 'cycle_change') => {
    return logs.filter((log) => {
      const matchType = type === 'all' || log.type === type;
      const matchSearch = !searchQuery.trim() || log.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchType && matchSearch;
    }).length;
  };

  return (
    <div className="bg-white dark:bg-[#131926]/90 rounded-2xl border border-slate-100 dark:border-slate-800/80 p-6 shadow-custom">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800/60 pb-5 mb-5">
        <div>
          <h2 className="text-lg font-bold font-display text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            Livro de Registro de Atividades (Auditoria)
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Histórico contábil em tempo real de todas as atividades, contribuições, auxílios e repasses efetuados.
          </p>
        </div>
        <button
          onClick={onResetData}
          className="flex items-center gap-1.5 text-xs text-rose-500 dark:text-rose-450 bg-rose-50 dark:bg-rose-950/20 hover:bg-rose-105 hover:dark:bg-rose-950/35 font-semibold px-3 py-1.5 rounded-lg border border-rose-200 dark:border-rose-900/35 transition-all shadow-sm cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Restaurar Simulação
        </button>
      </div>

      {/* FILTER & SERCH COntrols */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-5">
        {/* Search input (Spans 5 cols on md) */}
        <div className="md:col-span-5 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-slate-400 dark:text-slate-500" />
          </div>
          <input
            type="text"
            placeholder="Pesquisar por nome do membro..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-9 pr-8 py-1.5 text-xs rounded-lg border border-slate-205 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Filter tabs (Spans 7 cols on md) */}
        <div className="md:col-span-7 flex flex-wrap gap-1.5 items-center justify-start md:justify-end">
          <div className="text-[10px] uppercase font-black tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1 mr-1">
            <Filter className="w-3 h-3" /> Filtrar:
          </div>
          {[
            { id: 'all', label: 'Todos' },
            { id: 'contribution', label: 'Contribuições' },
            { id: 'payout', label: 'Benefícios' },
            { id: 'social_aid', label: 'Interajuda' },
            { id: 'cycle_change', label: 'Ciclo' },
          ].map((tab) => {
            const count = getFilterCount(tab.id as any);
            const isSelected = filter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id as any)}
                className={`text-[11px] px-2.5 py-1 rounded-lg font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  isSelected
                    ? 'bg-indigo-605 text-white dark:bg-indigo-600 shadow-sm'
                    : 'bg-slate-50/70 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-800/60 text-slate-600 dark:text-slate-400 hover:bg-slate-100 hover:dark:bg-slate-905'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold ${
                  isSelected 
                    ? 'bg-indigo-800/50 text-indigo-100' 
                    : 'bg-slate-200/60 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Logs timeline list */}
      <div className="max-h-[380px] overflow-y-auto pr-1 space-y-3 scrollbar-thin">
        <AnimatePresence initial={false}>
          {filteredLogs.length === 0 ? (
            <div className="py-12 text-center rounded-xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/20 dark:bg-slate-900/10 flex flex-col items-center justify-center p-6">
              <Search className="w-8 h-8 text-slate-300 dark:text-slate-605 mb-2" />
              <div className="text-xs font-bold text-slate-500 dark:text-slate-450 uppercase tracking-wider">
                Sem correspondências estruturadas
              </div>
              <p className="text-[11px] text-slate-405 dark:text-slate-500 mt-1 max-w-sm">
                Não fomos capazes de localizar transações ou eventos registrados para "{searchQuery}" com o filtro selecionado.
              </p>
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setFilter('all');
                  }}
                  className="mt-3 text-[10px] font-black uppercase text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                >
                  Limpar Pesquisa e Filtros
                </button>
              )}
            </div>
          ) : (
            filteredLogs.map((log) => (
              <motion.div
                key={log.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="flex items-start gap-3.5 p-3.5 bg-slate-50/70 hover:bg-slate-50 dark:bg-[#111623]/40 dark:hover:bg-[#111623]/80 rounded-xl border border-slate-100/70 dark:border-slate-800/40 transition-colors"
                id={`log-item-${log.id}`}
              >
                <div className={`p-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-200/80 dark:border-slate-800 shrink-0 shadow-sm shadow-slate-1/10`}>
                  {getLogIcon(log.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${getLogBadge(log.type)}`}>
                      {getLogLabel(log.type)}
                    </span>
                    {log.transactionCode && (
                      <span className="text-[9px] font-mono font-extrabold uppercase tracking-wider px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 border border-slate-205 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded">
                        REF: {log.transactionCode}
                      </span>
                    )}
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                      {new Date(log.timestamp).toLocaleDateString('pt-AO', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <p className="text-xs text-slate-650 dark:text-slate-300 font-medium mt-1.5 leading-relaxed">
                    {log.description}
                  </p>
                  {log.amount > 0 && (
                    <div className="mt-2 text-[11px] font-semibold font-mono text-slate-705 dark:text-slate-350 flex items-center gap-1.5">
                      Transação:
                      <span className={log.type === 'contribution' ? 'text-teal-605 dark:text-teal-400' : 'text-slate-800 dark:text-slate-200'}>
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

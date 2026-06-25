import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Printer, 
  FileText, 
  AlignLeft, 
  X, 
  Eye,
  Settings,
  Type,
  Layout,
  Maximize2
} from 'lucide-react';

export interface PrintConfig {
  format: 'pdf_full' | 'table_simple';
  orientation: 'portrait' | 'landscape';
  fontSize: 'compact' | 'normal' | 'large';
  fontFamily: 'sans' | 'serif' | 'mono';
}

interface PrintConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (config: PrintConfig) => void;
  title?: string;
  subtitle?: string;
}

export default function PrintConfigModal({
  isOpen,
  onClose,
  onConfirm,
  title = "Configurar Impressão e Exportação",
  subtitle = "Selecione o estilo do relatório antes de abrir a janela de impressão nativa.",
}: PrintConfigModalProps) {
  const [format, setFormat] = useState<'pdf_full' | 'table_simple'>('pdf_full');
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [fontSize, setFontSize] = useState<'compact' | 'normal' | 'large'>('normal');
  const [fontFamily, setFontFamily] = useState<'sans' | 'serif' | 'mono'>('sans');

  if (!isOpen) return null;

  const handlePrint = () => {
    onConfirm({
      format,
      orientation,
      fontSize,
      fontFamily
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-4xl w-full overflow-hidden flex flex-col md:flex-row h-auto max-h-[90vh]"
        >
          {/* LEFT: Configuration Settings */}
          <div className="flex-1 p-6 md:p-8 space-y-6 overflow-y-auto max-h-[45vh] md:max-h-[85vh]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 rounded-xl">
                  <Settings className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight">
                    {title}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {subtitle}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <hr className="border-slate-100 dark:border-slate-800" />

            {/* Option 1: Format Selector */}
            <div className="space-y-2.5">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Formato / Layout de Saída
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFormat('pdf_full')}
                  className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex gap-3 ${
                    format === 'pdf_full'
                      ? 'bg-sky-50 border-sky-400 dark:bg-sky-950/20 dark:border-sky-800 text-sky-900 dark:text-sky-300 ring-2 ring-sky-100 dark:ring-0'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 dark:bg-slate-950 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-900'
                  }`}
                >
                  <div className="p-2 bg-white dark:bg-slate-900 rounded-lg shrink-0 border border-slate-200 dark:border-slate-800 shadow-sm">
                    <FileText className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                  </div>
                  <div>
                    <span className="font-bold text-xs block">Relatório PDF Completo</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5 leading-tight">
                      Inclui cabeçalhos coloridos, logótipos, cartões de métricas, gráficos e espaço de assinaturas.
                    </span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setFormat('table_simple')}
                  className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex gap-3 ${
                    format === 'table_simple'
                      ? 'bg-slate-900 border-slate-850 dark:bg-white dark:border-slate-100 text-white dark:text-slate-900 ring-2 ring-slate-200 dark:ring-0'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 dark:bg-slate-950 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-900'
                  }`}
                >
                  <div className="p-2 bg-white dark:bg-slate-900 rounded-lg shrink-0 border border-slate-200 dark:border-slate-800 shadow-sm">
                    <AlignLeft className="w-4 h-4 text-slate-800 dark:text-slate-300" />
                  </div>
                  <div>
                    <span className="font-bold text-xs block">Tabela Simples (Listagem)</span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 block mt-0.5 leading-tight">
                      Modelo limpo e minimalista em preto e branco. Sem cores desnecessárias ou gráficos, otimizado para poupar tinta.
                    </span>
                  </div>
                </button>
              </div>
            </div>

            {/* Option 2: Orientation Selector */}
            <div className="space-y-2.5">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Orientação da Página
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setOrientation('portrait')}
                  className={`py-3 px-4 rounded-xl border font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    orientation === 'portrait'
                      ? 'bg-sky-600 text-white border-sky-600 shadow-sm'
                      : 'bg-slate-50 border-slate-200 text-slate-700 dark:bg-slate-950 dark:border-slate-800 dark:text-slate-400'
                  }`}
                >
                  <Layout className="w-3.5 h-3.5 rotate-90" />
                  Vertical (Retrato)
                </button>
                <button
                  type="button"
                  onClick={() => setOrientation('landscape')}
                  className={`py-3 px-4 rounded-xl border font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    orientation === 'landscape'
                      ? 'bg-sky-600 text-white border-sky-600 shadow-sm'
                      : 'bg-slate-50 border-slate-200 text-slate-700 dark:bg-slate-950 dark:border-slate-800 dark:text-slate-400'
                  }`}
                >
                  <Layout className="w-3.5 h-3.5" />
                  Horizontal (Paisagem)
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Option 3: Font Family */}
              <div className="space-y-2.5">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Estilo da Fonte
                </label>
                <select
                  value={fontFamily}
                  onChange={(e) => setFontFamily(e.target.value as any)}
                  className="w-full p-2.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-800 dark:text-white font-medium focus:outline-none focus:ring-1 focus:ring-sky-500"
                >
                  <option value="sans">Inter (Moderno Sans-serif)</option>
                  <option value="serif">Playfair (Corporativo/Serif)</option>
                  <option value="mono">JetBrains Mono (Dados/Técnico)</option>
                </select>
              </div>

              {/* Option 4: Font Size */}
              <div className="space-y-2.5">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Tamanho do Texto
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {['compact', 'normal', 'large'].map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => setFontSize(size as any)}
                      className={`py-2 px-2.5 rounded-lg border font-bold text-[10px] uppercase transition-all cursor-pointer ${
                        fontSize === size
                          ? 'bg-sky-50 border-sky-400 text-sky-700 dark:bg-sky-950/20 dark:border-sky-800 dark:text-sky-400'
                          : 'bg-slate-50 border-slate-200 text-slate-500 dark:bg-slate-950 dark:border-slate-800 dark:text-slate-450'
                      }`}
                    >
                      {size === 'compact' ? 'Compacto' : size === 'normal' ? 'Normal' : 'Grande'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-4 flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handlePrint}
                className="flex-1 py-3 bg-[#0284c7] hover:bg-sky-600 text-white rounded-xl text-xs font-bold shadow-md shadow-sky-500/10 transition-colors cursor-pointer flex items-center justify-center gap-1.5 active:scale-98"
              >
                <Printer className="w-4 h-4" />
                <span>Gerar e Imprimir</span>
              </button>
            </div>
          </div>

          {/* RIGHT: Dynamic Live Preview Sheet */}
          <div className="hidden md:flex w-[320px] bg-slate-50 dark:bg-slate-950 border-l border-slate-200 dark:border-slate-800 p-6 flex-col justify-between items-center overflow-hidden select-none">
            <div className="w-full flex items-center justify-between text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-4">
              <span className="flex items-center gap-1">
                <Eye className="w-3.5 h-3.5 text-sky-500" />
                Visualização Prévia
              </span>
              <span>1 Página</span>
            </div>

            {/* Miniature Document Card */}
            <div 
              className={`w-full max-w-[220px] bg-white border border-slate-250 dark:border-slate-800 shadow-lg rounded p-4 aspect-[1/1.41] relative transition-all duration-300 flex flex-col justify-between ${
                orientation === 'landscape' ? 'rotate-90 origin-center scale-90 translate-y-3' : ''
              } ${
                fontFamily === 'serif' ? 'font-serif' : fontFamily === 'mono' ? 'font-mono' : 'font-sans'
              }`}
            >
              {/* Content representation */}
              <div className="space-y-3 w-full">
                {/* Visual Report header block simulation */}
                {format === 'pdf_full' ? (
                  <div className="p-1.5 bg-slate-900 text-[6px] text-white rounded flex flex-col items-center leading-tight">
                    <span className="font-extrabold uppercase scale-90 tracking-widest text-[5px]">Kixi-Fundo Consórcio</span>
                    <span className="text-[3px] text-slate-400">Relatório Consolidado d'Auditoria</span>
                  </div>
                ) : (
                  <div className="border-b border-slate-800 pb-1 flex flex-col items-start leading-none space-y-0.5">
                    <span className="text-[6px] font-black uppercase text-slate-900">Kixi-Fundo</span>
                    <span className="text-[4px] text-slate-500">Listagem de Dados de Auditoria</span>
                  </div>
                )}

                {/* Subtitle dummy line */}
                <div className="space-y-1">
                  <div className="h-1 bg-slate-200 dark:bg-slate-800 rounded w-2/3" />
                  <div className="h-0.8 bg-slate-100 dark:bg-slate-800 rounded w-1/2" />
                </div>

                {/* Metric cards simulation */}
                {format === 'pdf_full' && (
                  <div className="grid grid-cols-2 gap-1">
                    <div className="p-1 bg-slate-50 border border-slate-150 rounded leading-none text-[4px]">
                      <span className="text-slate-400 block font-bold text-[3px]">CAIXA</span>
                      <strong className="text-slate-800">4.890.000 Kz</strong>
                    </div>
                    <div className="p-1 bg-slate-50 border border-slate-150 rounded leading-none text-[4px]">
                      <span className="text-slate-400 block font-bold text-[3px]">APOIO</span>
                      <strong className="text-slate-800">840.000 Kz</strong>
                    </div>
                  </div>
                )}

                {/* Simulated Table */}
                <div className="space-y-1 pt-1">
                  <div className="flex border-b border-slate-200 pb-0.5 text-[4px] font-bold text-slate-400">
                    <span className="flex-1">Membro</span>
                    <span className="w-8 text-right">Quota</span>
                  </div>
                  {[1, 2, 3].map((idx) => (
                    <div key={idx} className="flex text-[3.5px] text-slate-600 leading-none py-0.2">
                      <span className="flex-1 truncate">Membro Cooperador #{idx}</span>
                      <span className="w-8 text-right font-mono font-semibold">120.000 Kz</span>
                    </div>
                  ))}
                </div>

                {/* Signature and Stamps simulated */}
                {format === 'pdf_full' && (
                  <div className="grid grid-cols-2 gap-1.5 pt-2">
                    <div className="border-t border-dashed border-slate-200 pt-1 text-center text-[3px] text-slate-400">
                      Administrador
                    </div>
                    <div className="border border-sky-200 bg-sky-50/40 rounded p-0.5 text-center text-[3px] text-sky-600 font-extrabold font-mono">
                      AUTENTICADO
                    </div>
                  </div>
                )}
              </div>

              {/* Mini Footer */}
              <div className="border-t border-slate-100 pt-1 flex justify-between items-center text-[3px] text-slate-400">
                <span>© 2026 Kixi-Fundo</span>
                <span>Pág. 1/1</span>
              </div>
            </div>

            <p className="text-[10px] text-center text-slate-450 leading-normal px-2">
              Selecione as opções de layout e observe como o desenho será renderizado na janela do navegador.
            </p>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

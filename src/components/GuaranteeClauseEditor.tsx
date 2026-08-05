import React, { useState, useEffect } from 'react';
import { PledgedAsset } from '../types';
import { 
  ShieldCheck, 
  Plus, 
  Trash2, 
  Edit3, 
  Car, 
  Home, 
  Wrench, 
  Gem, 
  FileCheck, 
  Users, 
  Package, 
  Sparkles, 
  Layers, 
  Check, 
  RotateCcw,
  Sliders,
  AlertCircle
} from 'lucide-react';

export interface GuaranteeClauseEditorProps {
  value: string;
  assets?: PledgedAsset[];
  customClause?: string;
  onChange: (guaranteeText: string, assets: PledgedAsset[], customClause: string) => void;
  className?: string;
  compact?: boolean;
}

const ASSET_TYPE_CONFIG = {
  veiculo: {
    label: 'Veículo Automóvel',
    icon: Car,
    color: 'text-sky-500 bg-sky-50 dark:bg-sky-950/40 border-sky-200 dark:border-sky-800',
    docPlaceholder: 'Matrícula LD-XX-XX-XX / Livrete Nº XXXXX',
    defaultCustody: 'Retenção do Livrete / Documento Original no Kixi-Fundo'
  },
  imovel: {
    label: 'Imóvel / Terreno',
    icon: Home,
    color: 'text-amber-500 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800',
    docPlaceholder: 'Certidão de Registo Predial Nº / Matriz Nº',
    defaultCustody: 'Certidão e Matriz com Cláusula Hipotecária Fiduciária'
  },
  equipamento: {
    label: 'Equipamento / Maquinaria',
    icon: Wrench,
    color: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800',
    docPlaceholder: 'Nº de Série / Nota Fiscal Nº',
    defaultCustody: 'Posse Provisória como Fiel Depositário'
  },
  promissoria_fiador: {
    label: 'Fiança Solidária / Promissória',
    icon: Users,
    color: 'text-purple-500 bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800',
    docPlaceholder: 'Nº BI do Fiador / Termo de Avalista Nº',
    defaultCustody: 'Assinatura em Termo de Fiança Coletiva Kixi-Fundo'
  },
  joias_metais: {
    label: 'Joias / Metais Preciosos',
    icon: Gem,
    color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800',
    docPlaceholder: 'Certificado de Autenticidade / Peso em gramas',
    defaultCustody: 'Custódia Física Directa no Cofre Forte da Cooperativa'
  },
  deposito_titulo: {
    label: 'Depósito / Retenção de Rendimento',
    icon: FileCheck,
    color: 'text-blue-500 bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800',
    docPlaceholder: 'N.º da Conta / Comprovativo de Rendimentos',
    defaultCustody: 'Retenção Automática sobre Quotas ou Dividendos Sociais'
  },
  outro: {
    label: 'Outro Bem / Penhor Genérico',
    icon: Package,
    color: 'text-slate-500 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800',
    docPlaceholder: 'Identificador / Documento de Suporte',
    defaultCustody: 'Fiel Depositário com Declaração Registada'
  }
};

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('pt-AO', {
    style: 'currency',
    currency: 'AOA',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(val || 0);
};

export const generateGuaranteeClauseText = (assets: PledgedAsset[], customTextOverride?: string): string => {
  if (customTextOverride && customTextOverride.trim().length > 0) {
    return customTextOverride.trim();
  }

  if (!assets || assets.length === 0) {
    return 'Penhor mercantil fiduciário preventiva sobre bens móveis declarados, sujeitos a vistoria e retenção documental nos termos das normas internas do Kixi-Fundo.';
  }

  const itemsFormatted = assets.map((asset, index) => {
    const config = ASSET_TYPE_CONFIG[asset.type] || ASSET_TYPE_CONFIG.outro;
    const parts = [
      `${index + 1}) [${config.label.toUpperCase()}] ${asset.title}`
    ];
    
    if (asset.serialOrDocNumber) {
      parts.push(`Registo/Doc: ${asset.serialOrDocNumber}`);
    }
    if (asset.estimatedValue && asset.estimatedValue > 0) {
      parts.push(`Avaliação: ${formatCurrency(asset.estimatedValue)}`);
    }
    if (asset.condition) {
      parts.push(`Estado: ${asset.condition}`);
    }
    if (asset.custodyLocation) {
      parts.push(`Custódia/Regime: ${asset.custodyLocation}`);
    }
    if (asset.description) {
      parts.push(`Obs: ${asset.description}`);
    }

    return parts.join(' | ');
  }).join('\n');

  const totalValue = assets.reduce((sum, a) => sum + (a.estimatedValue || 0), 0);

  let text = `Como garantia real, incondicional e fiduciária do cumprimento integral do capital, juros e sanções contratadas, o DEVEDOR constitui em favor do CREDOR KIXI-FUNDO penhor mercantil e reserva fiduciária sobre os seguintes bens custodiados:\n\n${itemsFormatted}`;

  if (totalValue > 0) {
    text += `\n\nAvaliação Total Estimada dos Bens oferecidos em Penhor: ${formatCurrency(totalValue)}.`;
  }

  text += `\n\nO DEVEDOR declara expressamente a veracidade dos documentos dos bens e nomeia-se Fiel Depositário dos itens sob sua posse temporária, comprometendo-se a manter a integridade dos bens e autorizando o KIXI-FUNDO à execução imediata ou adjudicação judicial em caso de inadimplemento superior a 30 (trinta) dias.`;

  return text;
};

export const GuaranteeClauseEditor: React.FC<GuaranteeClauseEditorProps> = ({
  value,
  assets = [],
  customClause = '',
  onChange,
  className = '',
  compact = false
}) => {
  const [activeTab, setActiveTab] = useState<'dynamic' | 'custom' | 'preview'>('dynamic');
  const [pledgedAssets, setPledgedAssets] = useState<PledgedAsset[]>(assets);
  const [manualClauseText, setManualClauseText] = useState<string>(customClause || value || '');
  const [isManualOverride, setIsManualOverride] = useState<boolean>(Boolean(customClause && customClause.trim().length > 0));

  // Sync state if props change externally
  useEffect(() => {
    if (assets && assets.length > 0) {
      setPledgedAssets(assets);
    } else if (!assets || assets.length === 0) {
      // If initial value has content but no assets, we initialize one asset from value or keep empty
      if (value && !pledgedAssets.length && !isManualOverride) {
        setManualClauseText(value);
      }
    }
  }, [assets, value]);

  const updateParent = (updatedAssets: PledgedAsset[], overrideText?: string, isOverride: boolean = isManualOverride) => {
    const customText = isOverride ? (overrideText ?? manualClauseText) : '';
    const compiled = generateGuaranteeClauseText(updatedAssets, customText);
    onChange(compiled, updatedAssets, customText);
  };

  const handleAddAsset = (type: PledgedAsset['type'] = 'veiculo') => {
    const config = ASSET_TYPE_CONFIG[type];
    const newAsset: PledgedAsset = {
      id: `asset-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      type,
      title: type === 'veiculo' ? 'Viatura Ligeira / Utilitário' : type === 'imovel' ? 'Terreno / Imóvel Residencial' : type === 'equipamento' ? 'Equipamento de Trabalho / Gerador' : type === 'promissoria_fiador' ? 'Fiança Solidária de Sócio Co-Assinante' : type === 'joias_metais' ? 'Lote de Joias / Ouro' : type === 'deposito_titulo' ? 'Retenção sobre Quotas / Depósito' : 'Bens Móveis Diversos',
      serialOrDocNumber: '',
      estimatedValue: 0,
      condition: 'Bom Estado',
      custodyLocation: config.defaultCustody,
      description: ''
    };
    const updated = [...pledgedAssets, newAsset];
    setPledgedAssets(updated);
    updateParent(updated, undefined, isManualOverride);
  };

  const handleRemoveAsset = (id: string) => {
    const updated = pledgedAssets.filter(a => a.id !== id);
    setPledgedAssets(updated);
    updateParent(updated, undefined, isManualOverride);
  };

  const handleAssetChange = (id: string, field: keyof PledgedAsset, val: any) => {
    const updated = pledgedAssets.map(a => {
      if (a.id === id) {
        const item = { ...a, [field]: val };
        if (field === 'type' && ASSET_TYPE_CONFIG[val as PledgedAsset['type']]) {
          item.custodyLocation = ASSET_TYPE_CONFIG[val as PledgedAsset['type']].defaultCustody;
        }
        return item;
      }
      return a;
    });
    setPledgedAssets(updated);
    updateParent(updated, undefined, isManualOverride);
  };

  const handleManualTextChange = (text: string) => {
    setManualClauseText(text);
    setIsManualOverride(true);
    updateParent(pledgedAssets, text, true);
  };

  const handleResetToDynamic = () => {
    setIsManualOverride(false);
    const compiled = generateGuaranteeClauseText(pledgedAssets, '');
    setManualClauseText(compiled);
    updateParent(pledgedAssets, '', false);
  };

  const handleApplyPreset = (presetKey: 'veiculo' | 'fiador' | 'maquinaria' | 'imovel') => {
    let presetAssets: PledgedAsset[] = [];
    if (presetKey === 'veiculo') {
      presetAssets = [{
        id: `asset-${Date.now()}-1`,
        type: 'veiculo',
        title: 'Viatura Toyota / Hyundai / Kia',
        serialOrDocNumber: 'Matrícula LD-00-00-XX / Livrete Original',
        estimatedValue: 1200000,
        condition: 'Bom Estado',
        custodyLocation: 'Retenção do Livrete / Documento Original no Kixi-Fundo'
      }];
    } else if (presetKey === 'fiador') {
      presetAssets = [{
        id: `asset-${Date.now()}-2`,
        type: 'promissoria_fiador',
        title: 'Termo de Fiança Solidária de Sócio Cooperante',
        serialOrDocNumber: 'Sócio Co-Assinante Co-responsável',
        estimatedValue: 500000,
        condition: 'Membro no Ativo',
        custodyLocation: 'Assinatura em Termo de Fiança Coletiva Kixi-Fundo'
      }];
    } else if (presetKey === 'maquinaria') {
      presetAssets = [{
        id: `asset-${Date.now()}-3`,
        type: 'equipamento',
        title: 'Gerador Industrial / Frigorífico / Máquina de Costura',
        serialOrDocNumber: 'Equipamento de Produção',
        estimatedValue: 450000,
        condition: 'Operacional',
        custodyLocation: 'Posse Provisória como Fiel Depositário'
      }];
    } else if (presetKey === 'imovel') {
      presetAssets = [{
        id: `asset-${Date.now()}-4`,
        type: 'imovel',
        title: 'Documento de Propriedade / Terreno Residencial',
        serialOrDocNumber: 'Matriz Predial / Declaração de Posse',
        estimatedValue: 2500000,
        condition: 'Excelente',
        custodyLocation: 'Certidão e Matriz com Cláusula Hipotecária Fiduciária'
      }];
    }

    setPledgedAssets(presetAssets);
    setIsManualOverride(false);
    const compiled = generateGuaranteeClauseText(presetAssets, '');
    setManualClauseText(compiled);
    updateParent(presetAssets, '', false);
  };

  const currentPreviewText = isManualOverride 
    ? manualClauseText 
    : generateGuaranteeClauseText(pledgedAssets, '');

  return (
    <div className={`bg-white dark:bg-[#121824] border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs overflow-hidden ${className}`}>
      
      {/* Header Bar with Tabs */}
      <div className="bg-slate-50 dark:bg-[#182030] px-3.5 py-2.5 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-sky-500/10 dark:bg-sky-500/20 text-sky-600 dark:text-sky-400 rounded-lg">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-white flex items-center gap-1.5">
              Cláusula de Garantia & Penhor
              {isManualOverride && (
                <span className="text-[9px] lowercase bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800 px-1.5 py-0.2 rounded font-mono">
                  editado manualmente
                </span>
              )}
            </span>
            <p className="text-[10px] text-slate-400">
              Personalize bens de penhor, fiadores ou adapte a minuta contratual legal.
            </p>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-1 bg-white dark:bg-[#0d121c] p-1 rounded-lg border border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={() => setActiveTab('dynamic')}
            className={`px-2.5 py-1 rounded text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer ${
              activeTab === 'dynamic'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Sliders className="w-3 h-3" />
            Campos Dinâmicos ({pledgedAssets.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('custom')}
            className={`px-2.5 py-1 rounded text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer ${
              activeTab === 'custom'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Edit3 className="w-3 h-3" />
            Edição Direta do Texto
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('preview')}
            className={`px-2.5 py-1 rounded text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer ${
              activeTab === 'preview'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Sparkles className="w-3 h-3" />
            Antevisão Cláusula
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="p-3.5 space-y-3">

        {/* TAB 1: DYNAMIC FIELDS EDITOR */}
        {activeTab === 'dynamic' && (
          <div className="space-y-3">
            
            {/* Quick Presets Toolbar */}
            <div className="bg-slate-50/80 dark:bg-slate-900/50 p-2.5 rounded-lg border border-slate-200/60 dark:border-slate-800 space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <Layers className="w-3 h-3 text-sky-500" /> Modelos Rápidos de Penhor / Garantia:
              </span>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => handleApplyPreset('veiculo')}
                  className="px-2 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-[10px] font-bold text-slate-700 dark:text-slate-200 hover:border-sky-500 hover:text-sky-600 dark:hover:text-sky-400 transition-all flex items-center gap-1 cursor-pointer shadow-2xs"
                >
                  <Car className="w-3 h-3 text-sky-500" />
                  🚗 Veículo Automóvel
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('fiador')}
                  className="px-2 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-[10px] font-bold text-slate-700 dark:text-slate-200 hover:border-purple-500 hover:text-purple-600 dark:hover:text-purple-400 transition-all flex items-center gap-1 cursor-pointer shadow-2xs"
                >
                  <Users className="w-3 h-3 text-purple-500" />
                  👥 Fiança de Sócio
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('maquinaria')}
                  className="px-2 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-[10px] font-bold text-slate-700 dark:text-slate-200 hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all flex items-center gap-1 cursor-pointer shadow-2xs"
                >
                  <Wrench className="w-3 h-3 text-indigo-500" />
                  🧰 Equipamento/Maquinaria
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('imovel')}
                  className="px-2 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-[10px] font-bold text-slate-700 dark:text-slate-200 hover:border-amber-500 hover:text-amber-600 dark:hover:text-amber-400 transition-all flex items-center gap-1 cursor-pointer shadow-2xs"
                >
                  <Home className="w-3 h-3 text-amber-500" />
                  🏠 Bem Imóvel / Terreno
                </button>
              </div>
            </div>

            {/* Assets List */}
            {pledgedAssets.length === 0 ? (
              <div className="text-center py-6 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-900/20">
                <ShieldCheck className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-700 mb-2" />
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
                  Nenhum bem de penhor adicionado ainda.
                </p>
                <p className="text-[11px] text-slate-400 max-w-sm mx-auto mt-1 mb-3">
                  Adicione veículos, equipamentos, fiadores ou bens imóveis para gerar automaticamente a Cláusula de Garantia no contrato.
                </p>
                <button
                  type="button"
                  onClick={() => handleAddAsset('veiculo')}
                  className="px-3.5 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-bold inline-flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Adicionar Primeiro Bem de Penhor
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {pledgedAssets.map((asset, index) => {
                  const config = ASSET_TYPE_CONFIG[asset.type] || ASSET_TYPE_CONFIG.outro;
                  const IconComp = config.icon;

                  return (
                    <div 
                      key={asset.id}
                      className="p-3 bg-slate-50/60 dark:bg-[#151c2a] border border-slate-200/80 dark:border-slate-800 rounded-xl space-y-2.5 relative group"
                    >
                      {/* Asset Header */}
                      <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-slate-800 pb-2">
                        <div className="flex items-center gap-2">
                          <span className={`p-1.5 rounded-lg border text-xs font-bold flex items-center gap-1 ${config.color}`}>
                            <IconComp className="w-3.5 h-3.5" />
                            Item #{index + 1}
                          </span>

                          <select
                            value={asset.type}
                            onChange={(e) => handleAssetChange(asset.id, 'type', e.target.value as PledgedAsset['type'])}
                            className="text-xs font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-slate-900 dark:text-white focus:ring-1 focus:ring-sky-500"
                          >
                            <option value="veiculo">🚗 Veículo Automóvel</option>
                            <option value="imovel">🏠 Imóvel / Terreno</option>
                            <option value="equipamento">🧰 Equipamento / Maquinaria</option>
                            <option value="promissoria_fiador">👥 Fiança Solidária de Sócio</option>
                            <option value="joias_metais">💍 Joias / Metais Preciosos</option>
                            <option value="deposito_titulo">📄 Retenção / Depósito</option>
                            <option value="outro">📦 Outro Bem / Penhor</option>
                          </select>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveAsset(asset.id)}
                          className="p-1 text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-colors cursor-pointer rounded hover:bg-red-50 dark:hover:bg-red-950/30"
                          title="Remover bem da lista"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Asset Dynamic Grid Fields */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
                        
                        {/* Title / Name */}
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-0.5">
                            Denominação do Bem <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={asset.title}
                            onChange={(e) => handleAssetChange(asset.id, 'title', e.target.value)}
                            placeholder="Ex: Viatura Toyota Hilux 2.5 D-4D"
                            className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-750 rounded-lg text-xs font-semibold text-slate-900 dark:text-white focus:ring-1 focus:ring-sky-500"
                          />
                        </div>

                        {/* Document / Serial Number */}
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-0.5">
                            Matrícula / Nº Registro / Livrete
                          </label>
                          <input
                            type="text"
                            value={asset.serialOrDocNumber || ''}
                            onChange={(e) => handleAssetChange(asset.id, 'serialOrDocNumber', e.target.value)}
                            placeholder={config.docPlaceholder}
                            className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-750 rounded-lg text-xs font-mono text-slate-900 dark:text-white focus:ring-1 focus:ring-sky-500"
                          />
                        </div>

                        {/* Estimated Value */}
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-0.5">
                            Valor Estimado de Avaliação (KZs)
                          </label>
                          <input
                            type="number"
                            value={asset.estimatedValue || ''}
                            onChange={(e) => handleAssetChange(asset.id, 'estimatedValue', Number(e.target.value))}
                            placeholder="Ex: 1500000"
                            className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-750 rounded-lg text-xs font-bold font-mono text-emerald-600 dark:text-emerald-400 focus:ring-1 focus:ring-sky-500"
                          />
                        </div>

                        {/* Condition */}
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-0.5">
                            Estado de Conservação
                          </label>
                          <select
                            value={asset.condition || 'Bom Estado'}
                            onChange={(e) => handleAssetChange(asset.id, 'condition', e.target.value)}
                            className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-750 rounded-lg text-xs font-medium text-slate-900 dark:text-white focus:ring-1 focus:ring-sky-500"
                          >
                            <option value="Novo de Fábrica">Novo de Fábrica</option>
                            <option value="Excelente Estado">Excelente Estado</option>
                            <option value="Bom Estado">Bom Estado</option>
                            <option value="Usado Funcional">Usado Funcional</option>
                            <option value="Com Marcas de Uso">Com Marcas de Uso</option>
                          </select>
                        </div>

                        {/* Custody Location / Condition */}
                        <div className="md:col-span-2">
                          <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-0.5">
                            Regime de Custódia / Fiel Depositário
                          </label>
                          <input
                            type="text"
                            value={asset.custodyLocation || ''}
                            onChange={(e) => handleAssetChange(asset.id, 'custodyLocation', e.target.value)}
                            placeholder="Ex: Retenção do documento original no Kixi-Fundo com posse temporária"
                            className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-750 rounded-lg text-xs text-slate-900 dark:text-white focus:ring-1 focus:ring-sky-500"
                          />
                        </div>

                      </div>
                    </div>
                  );
                })}

                {/* Bottom Add Asset Button */}
                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    onClick={() => handleAddAsset('veiculo')}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-800 dark:text-slate-200 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 text-sky-500" /> Adicionar Mais Um Bem de Penhor
                  </button>

                  {isManualOverride && (
                    <button
                      type="button"
                      onClick={handleResetToDynamic}
                      className="text-[10px] font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3" /> Restaurar Cláusula Gerada pelos Campos
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: MANUAL TEXT DIRECT EDIT */}
        {activeTab === 'custom' && (
          <div className="space-y-2.5">
            <div className="flex justify-between items-center text-[10px] text-slate-400">
              <span className="flex items-center gap-1 font-bold text-slate-600 dark:text-slate-300">
                <Edit3 className="w-3.5 h-3.5 text-sky-500" /> Edição Livre da Minuta da Cláusula de Garantia:
              </span>
              {isManualOverride ? (
                <button
                  type="button"
                  onClick={handleResetToDynamic}
                  className="text-amber-600 dark:text-amber-400 hover:underline font-bold flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" /> Voltar ao Gerador Automático
                </button>
              ) : (
                <span className="text-slate-400">
                  (Escrever aqui ativará a personalização manual direta)
                </span>
              )}
            </div>

            <textarea
              value={manualClauseText}
              onChange={(e) => handleManualTextChange(e.target.value)}
              rows={compact ? 5 : 8}
              placeholder="Digite ou cole aqui os termos personalizados da Cláusula de Garantia..."
              className="w-full p-3 bg-slate-50 dark:bg-[#0d121c] border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-mono leading-relaxed text-slate-900 dark:text-gray-100 focus:ring-1 focus:ring-sky-500"
            />

            <div className="p-2 bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-900/40 rounded-lg text-[10px] text-amber-700 dark:text-amber-300 flex items-start gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
              <p>
                <strong>Nota do Sistema:</strong> Ao editar o texto livremente nesta caixa, as alterações manuais serão diretamente incorporadas na <strong>CLÁUSULA TERCEIRA (DA GARANTIA REAL)</strong> do contrato de crédito a ser impresso e assinado.
              </p>
            </div>
          </div>
        )}

        {/* TAB 3: LIVE CONTRACT CLAUSE PREVIEW */}
        {activeTab === 'preview' && (
          <div className="space-y-2">
            <div className="flex justify-between items-center text-[10px] text-slate-400 border-b border-slate-200 dark:border-slate-800 pb-1.5">
              <span className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-sky-500" /> Antevisão do Texto Final da Cláusula TERCEIRA:
              </span>
              <span className="font-mono text-[9px] text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.2 rounded border border-emerald-200/50">
                pronto para contrato
              </span>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-[#0e1320] border border-slate-200/80 dark:border-slate-800 rounded-lg max-h-[220px] overflow-y-auto">
              <pre className="whitespace-pre-wrap font-sans text-xs leading-relaxed text-slate-800 dark:text-slate-200 select-text">
                {currentPreviewText}
              </pre>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default GuaranteeClauseEditor;

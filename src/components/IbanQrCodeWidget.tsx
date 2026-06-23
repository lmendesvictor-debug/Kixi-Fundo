import { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import QRCode from 'qrcode';
import { 
  QrCode, 
  Copy, 
  Check, 
  Download, 
  Share2, 
  Info, 
  Smartphone,
  CheckCircle2,
  HelpCircle,
  TrendingUp,
  Printer
} from 'lucide-react';

interface IbanQrCodeWidgetProps {
  bankIban: string;
  bankName?: string;
  accountOwner?: string;
  theme?: string;
}

export default function IbanQrCodeWidget({
  bankIban = 'AO06 0040 0000 7834 8291 1014 9',
  bankName = 'Banco BIC Angola',
  accountOwner = 'KIXI-FUNDO',
  theme = 'light'
}: IbanQrCodeWidgetProps) {
  const [copied, setCopied] = useState(false);
  const [copiedText, setCopiedText] = useState(false);
  const [qrFormat, setQrFormat] = useState<'raw' | 'formatted'>('raw');
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Clean the IBAN for raw copy or scanning
  const cleanIban = bankIban.replace(/\s+/g, '');

  // Determine the payload to encode in the QR Code
  const getQrPayload = () => {
    if (qrFormat === 'raw') {
      return cleanIban;
    }
    return `BANCO: ${bankName}\nCONTANTE: ${accountOwner}\nIBAN: ${bankIban}`;
  };

  // Generate QR Code onto canvas
  useEffect(() => {
    if (canvasRef.current) {
      const payload = getQrPayload();
      const qrColorDark = theme === 'dark' ? '#f8fafc' : '#0f172a'; // slate-50 (dark) vs slate-900 (light)
      const qrColorLight = theme === 'dark' ? '#0f172a' : '#ffffff'; // slate-900 (dark) vs white (light)

      QRCode.toCanvas(
        canvasRef.current,
        payload,
        {
          width: 200,
          margin: 1,
          color: {
            dark: qrColorDark,
            light: qrColorLight
          },
          errorCorrectionLevel: 'H'
        },
        (error) => {
          if (error) {
            console.error('Error generating QR Code', error);
          }
        }
      );
    }
  }, [bankIban, bankName, accountOwner, qrFormat, theme]);

  const handleCopyIban = () => {
    navigator.clipboard.writeText(bankIban);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyPayload = () => {
    const fullDetails = `Banco: ${bankName}\nTitular: ${accountOwner}\nIBAN: ${bankIban}`;
    navigator.clipboard.writeText(fullDetails);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  const handleDownloadQr = () => {
    if (canvasRef.current) {
      const url = canvasRef.current.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `kixi-fundo-iban-qrcode-${qrFormat}.png`;
      link.href = url;
      link.click();
    }
  };

  const handlePrint = () => {
    if (!canvasRef.current) return;
    const qrDataUrl = canvasRef.current.toDataURL('image/png');

    const printContainer = document.createElement('div');
    printContainer.id = 'print-container';

    const style = document.createElement('style');
    style.innerHTML = `
      @media print {
        body > * {
          display: none !important;
        }
        #print-container {
          display: block !important;
          position: absolute;
          left: 0;
          top: 0;
          width: 100%;
          background: white !important;
          color: black !important;
          padding: 2cm !important;
          box-sizing: border-box;
        }
      }
    `;
    document.head.appendChild(style);

    printContainer.innerHTML = `
      <div style="font-family: system-ui, -apple-system, sans-serif; text-align: center; max-width: 800px; margin: 0 auto; color: #000; padding: 20px;">
        <div style="border-top: 8px solid #dc2626; margin-bottom: 30px;"></div>
        
        <p style="text-transform: uppercase; letter-spacing: 0.15em; font-size: 13px; font-weight: 850; color: #4b5563; margin-bottom: 5px;">KIXI-FUNDO • ASSOCIAÇÃO COOPERATIVA</p>
        <h1 style="font-size: 32px; font-weight: 900; letter-spacing: -0.03em; margin: 0 0 10px 0; color: #000;">COORDENADAS DE DEPÓSITO</h1>
        <p style="font-size: 14px; text-transform: uppercase; font-weight: 600; color: #dc2626; letter-spacing: 0.05em; margin: 0 0 45px 0;">INSTRUÇÃO OFICIAL DE PAGAMENTO DE QUOTAS</p>

        <div style="border: 2px dashed #000; padding: 35px; border-radius: 20px; display: inline-block; margin-bottom: 45px; background-color: #fafafa; box-sizing: border-box;">
          <p style="margin: 0 0 20px 0; font-size: 12px; font-weight: bold; color: #374151; text-transform: uppercase; letter-spacing: 0.1em;">ESCANEIE ESTE CÓDIGO QR NO SEU APLICATIVO BANCÁRIO</p>
          <img src="${qrDataUrl}" style="width: 250px; height: 250px; margin: 0 auto; display: block; border: 1px solid #e5e7eb; padding: 15px; background: white; border-radius: 12px;" />
          <p style="margin: 20px 0 0 0; font-size: 11px; color: #6b7280; font-style: italic; max-width: 320px; line-height: 1.4; margin-left: auto; margin-right: auto;">Suporta os principais aplicativos nacionais (Multicaixa Express, BAI Directo, BFA App, BIC Net, etc.).</p>
        </div>

        <div style="text-align: left; max-width: 600px; margin: 0 auto 40px auto; border: 1px solid #e5e7eb; border-radius: 16px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
          <div style="background-color: #0f172a; color: white; padding: 15px 20px; font-weight: bold; font-size: 13px; letter-spacing: 0.05em; text-transform: uppercase; font-family: system-ui;">FAVOR EFECTUAR DEPÓSITO PARA:</div>
          <div style="padding: 24px; background-color: white;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr style="border-bottom: 1px solid #e5e7eb;">
                <td style="padding: 14px 0; font-size: 12px; color: #6b7280; text-transform: uppercase; font-weight: bold; width: 35%;">Banco Beneficiário:</td>
                <td style="padding: 14px 0; font-size: 15px; font-weight: 800; color: #111827;">${bankName}</td>
              </tr>
              <tr style="border-bottom: 1px solid #e5e7eb;">
                <td style="padding: 14px 0; font-size: 12px; color: #6b7280; text-transform: uppercase; font-weight: bold;">Titular da Conta:</td>
                <td style="padding: 14px 0; font-size: 15px; font-weight: 800; color: #111827;">${accountOwner}</td>
              </tr>
              <tr>
                <td style="padding: 14px 0; font-size: 12px; color: #6b7280; text-transform: uppercase; font-weight: bold;">IBAN de Depósito:</td>
                <td style="padding: 14px 0; font-size: 18px; font-weight: 900; color: #dc2626; font-family: monospace; letter-spacing: 1px;">${bankIban}</td>
              </tr>
            </table>
          </div>
        </div>

        <div style="text-align: left; max-width: 600px; margin: 0 auto 45px auto; padding: 22px; border-left: 5px solid #0f172a; background-color: #f8fafc; border-radius: 0 16px 16px 0;">
          <h4 style="margin: 0 0 12px 0; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 800; color: #01050a;">📌 INSTRUÇÕES GERAIS DE CONFORMIDADE:</h4>
          <ol style="margin: 0; padding-left: 20px; font-size: 12px; color: #374151; line-height: 1.6; font-weight: 600;">
            <li style="margin-bottom: 6px;">Efectue a transferência bancária do montante exacto da sua cota mensal.</li>
            <li style="margin-bottom: 6px;">Valide sempre a titularidade em nome de <strong>${accountOwner}</strong> antes de confirmar o pagamento.</li>
            <li>Guarde e digitalize o talão de depósito para submeter directamente no portal e obter a validação digital.</li>
          </ol>
        </div>

        <div style="border-top: 1px solid #e5e7eb; padding-top: 30px; margin-top: 50px; display: flex; justify-content: space-between; align-items: center; color: #6b7280; font-size: 11px; font-weight: 500;">
          <div>Gerado automaticamente pelo Portal Kixi-Fundo em: ${new Date().toLocaleDateString('pt-AO')}</div>
          <div style="border: 1px solid #0f172a; padding: 6px 18px; border-radius: 8px; text-transform: uppercase; letter-spacing: 0.1em; font-weight: bold; font-size: 10px; color: #0f172a;">CONSELHO DE AUDITORIA</div>
        </div>
      </div>
    `;

    document.body.appendChild(printContainer);
    window.print();

    setTimeout(() => {
      if (document.body.contains(printContainer)) {
        document.body.removeChild(printContainer);
      }
      if (document.head.contains(style)) {
        document.head.removeChild(style);
      }
    }, 1000);
  };

  return (
    <div id="iban-qr-widget" className={`p-6 sm:p-8 rounded-[2rem] border transition-all duration-300 shadow-md backdrop-blur-md ${
      theme === 'dark' 
        ? 'bg-[#151c2c]/50 border-slate-800/60 text-slate-100' 
        : 'bg-white/45 border-slate-200/50 text-slate-800'
    }`}>
      
      {/* Widget Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-red-500/10 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 rounded-2xl">
            <QrCode className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h3 className="text-lg font-black tracking-tight">QR Code IBAN de Depósito</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Escaneie ou copie os dados oficiais para transferências das suas quotas
            </p>
          </div>
        </div>

        {/* Format Selector Tab */}
        <div className="flex bg-slate-100 dark:bg-slate-900/60 p-1 rounded-xl self-start sm:self-center">
          <button 
            type="button"
            onClick={() => setQrFormat('raw')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              qrFormat === 'raw' 
                ? 'bg-white dark:bg-slate-800 text-slate-950 dark:text-white shadow-sm' 
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Apenas IBAN
          </button>
          <button 
            type="button"
            onClick={() => setQrFormat('formatted')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              qrFormat === 'formatted' 
                ? 'bg-white dark:bg-slate-800 text-slate-950 dark:text-white shadow-sm' 
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Ficha Completa
          </button>
        </div>
      </div>

      {/* Main Layout containing QR and Text information */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center mt-6">
        
        {/* Left Side: Dynamic QR Code Presentation */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center p-6 rounded-2xl bg-slate-50/50 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-850">
          <div className="relative p-3 bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-md">
            {/* Corner styling accents for QR scanner viewport view */}
            <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-red-500 rounded-tl-lg" />
            <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-red-500 rounded-tr-lg" />
            <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-red-500 rounded-bl-lg" />
            <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-red-500 rounded-br-lg" />
            
            <canvas ref={canvasRef} className="rounded-lg max-w-[180px] max-h-[180px]" />
          </div>
          
          <div className="flex flex-wrap gap-2 mt-4 justify-center">
            <button
              onClick={handleDownloadQr}
              type="button"
              className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-[11px] font-extrabold rounded-xl flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer border border-slate-200/50 dark:border-slate-700/50"
              title="Descarregar imagem do código QR"
            >
              <Download className="w-3.5 h-3.5" />
              Download
            </button>
            <button
              type="button"
              onClick={handleCopyIban}
              className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-[11px] font-extrabold rounded-xl flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer shadow-sm shadow-red-500/25"
              title="Copiar IBAN Coletivo"
            >
              <Copy className="w-3.5 h-3.5" />
              {copied ? 'Copiado!' : 'Copiar IBAN'}
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white text-[11px] font-extrabold rounded-xl flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer shadow-sm shadow-sky-500/25"
              title="Imprimir folha de afixação oficial"
            >
              <Printer className="w-3.5 h-3.5" />
              Imprimir
            </button>
          </div>

          <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-3 text-center leading-relaxed">
            {qrFormat === 'raw' 
              ? '💡 Código optimizado para os leitores de IBAN dos aplicativos de Mobile Banking.' 
              : '📋 Código completo contendo dados do Banco, Titular e IBAN.'}
          </p>
        </div>

        {/* Right Side: Banking details sheet & Scan guidelines */}
        <div className="lg:col-span-7 space-y-6">
          <div className="space-y-4">
            <h4 className="text-stone-400 dark:text-slate-400 font-extrabold uppercase tracking-widest text-[10px]">
              Ficha de Coordenadas Bancárias
            </h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Bank Name Field */}
              <div className="p-4 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-100 dark:border-slate-850">
                <span className="text-[10px] text-slate-400 dark:text-slate-500 block uppercase font-bold">Banco do Consórcio</span>
                <span className="text-sm font-extrabold text-slate-800 dark:text-slate-200 mt-1 block">{bankName}</span>
              </div>

              {/* Account Owner Field */}
              <div className="p-4 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-100 dark:border-slate-850">
                <span className="text-[10px] text-slate-400 dark:text-slate-550 block uppercase font-bold">Titular da Conta Coletiva</span>
                <span className="text-sm font-extrabold text-slate-850 dark:text-slate-200 mt-1 block">{accountOwner}</span>
              </div>
            </div>

            {/* Interactive IBAN Box */}
            <div className="p-4 bg-red-500/5 dark:bg-rose-950/20 rounded-xl border border-red-500/20">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-400 dark:text-rose-300 font-bold uppercase">IBAN Internacional Oficial</span>
                <span className="flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-extrabold uppercase">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Conta Ativa e Auditada
                </span>
              </div>
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mt-2 gap-3">
                <div className="font-mono text-base font-black text-rose-700 dark:text-red-300 tracking-wider">
                  {bankIban}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleCopyIban}
                    type="button"
                    className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-350 rounded-lg transition-colors cursor-pointer"
                    title="Copiar IBAN rápido"
                  >
                    {copied ? <Check className="w-5 h-5 text-emerald-500" /> : <Copy className="w-5 h-5" />}
                  </button>
                  <button
                    onClick={handleCopyPayload}
                    type="button"
                    className="px-2 py-1 text-[11px] font-bold text-slate-500 dark:text-slate-350 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
                    title="Copiar todos os dados para transferência"
                  >
                    {copiedText ? 'Copiado!' : 'Copiar Texto'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Transfer Scanning Steps */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 space-y-3">
            <h5 className="text-xs font-extrabold text-sky-600 dark:text-sky-400 flex items-center gap-1.5 uppercase tracking-wider">
              <Smartphone className="w-4 h-4" />
              Como efectuar o depósito por QR Code?
            </h5>
            
            <ol className="text-xs font-semibold space-y-2 text-slate-500 dark:text-slate-300">
              <li className="flex gap-2">
                <span className="flex items-center justify-center w-5 h-5 bg-sky-100 dark:bg-sky-955 text-sky-700 dark:text-sky-300 font-black rounded-md text-[10px] shrink-0">1</span>
                <span>Abra o aplicativo da sua instituição bancária no telemóvel (multicaixa express, BAI Directo, BFA App, BIC Net, etc.).</span>
              </li>
              <li className="flex gap-2">
                <span className="flex items-center justify-center w-5 h-5 bg-sky-100 dark:bg-sky-955 text-sky-700 dark:text-sky-300 font-black rounded-md text-[10px] shrink-0">2</span>
                <span>Aceda à secção de <strong>Transferências</strong> e escolha a opção de ler QR Code ou ler IBAN por câmara.</span>
              </li>
              <li className="flex gap-2">
                <span className="flex items-center justify-center w-5 h-5 bg-sky-100 dark:bg-sky-955 text-sky-700 dark:text-sky-300 font-black rounded-md text-[10px] shrink-0">3</span>
                <span>Aponte a câmara do telemóvel para o QR Code à esquerda. O IBAN será detectado e preenchido instantaneamente.</span>
              </li>
              <li className="flex gap-2">
                <span className="flex items-center justify-center w-5 h-5 bg-sky-100 dark:bg-sky-955 text-sky-700 dark:text-sky-300 font-black rounded-md text-[10px] shrink-0">4</span>
                <span>Confirme o titular <strong>KIXI-FUNDO</strong>, insira o montante da sua quota (ex: 120.000,00 KZs) e finalize o seu depósito seguro.</span>
              </li>
            </ol>
          </div>

        </div>

      </div>

    </div>
  );
}

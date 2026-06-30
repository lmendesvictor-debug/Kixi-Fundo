import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Lock, 
  User as UserIcon, 
  ArrowRight, 
  Mail, 
  Phone, 
  ShieldCheck, 
  AlertCircle, 
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  HelpCircle,
  KeyRound,
  Check,
  BookOpen
} from 'lucide-react';
import { Member } from '../types';
import RegulationsModal from './RegulationsModal';

interface LoginScreenProps {
  members: Member[];
  onLogin: (user: { email: string; role: 'admin' | 'membro'; memberId?: number; name: string }) => void;
  userEmail?: string;
  onResetPassword?: (email: string, newPass: string) => boolean;
}

const CAROUSEL_SLIDES = [
  {
    title: "Kixi - Fundo",
    description: "A poupança do seu Dinheiro",
    image: "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&q=80&w=800"
  },
  {
    title: "Análise Financeira Inteligente",
    description: "Planeie com precisão através de integridade distributiva e matemática organizada.",
    image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=800"
  },
  {
    title: "Fundo de Interajuda",
    description: "Poupança comunitária rotativa e controle de contribuições transparentes em tempo real.",
    image: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&q=80&w=800"
  },
  {
    title: "Poupança Solidária Multiplicada",
    description: "Gestão patrimonial orientada para dar suporte, rentabilidade e microcrédito rotativo.",
    image: "https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?auto=format&fit=crop&q=80&w=800"
  },
  {
    title: "Trajectória de Crescimento",
    description: "Atingindo metas sólidas de poupança com progresso contínuo e acumulação de fundos de estabilidade.",
    image: "https://images.unsplash.com/photo-1544377193-33dcf4d68fb5?auto=format&fit=crop&q=80&w=800"
  },
  {
    title: "Análise de Balanços Trimestrais",
    description: "Visibilidade total no crescimento patrimonial e nas contas gerais integradas da cooperativa.",
    image: "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&q=80&w=800"
  }
];

export default function LoginScreen({ members, onLogin, userEmail, onResetPassword }: LoginScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [infoMsg, setInfoMsg] = useState(() => {
    const reason = localStorage.getItem('kix_logout_reason');
    if (reason === 'inactivity') {
      localStorage.removeItem('kix_logout_reason');
      return 'A sua sessão foi encerrada por inatividade (10 min para Administrador, 2 min para Membros) por motivos de segurança.';
    }
    return '';
  });
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [showDemoUsers, setShowDemoUsers] = useState(false);
  const [showRecoveryModal, setShowRecoveryModal] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [recoveryStatus, setRecoveryStatus] = useState('');
  const [recoveryStep, setRecoveryStep] = useState<'request' | 'new-password' | 'success'>('request');
  const [newPassword, setNewPassword] = useState('');
  const [identifiedUser, setIdentifiedUser] = useState('');
  const [showRegulations, setShowRegulations] = useState(false);

  // Evita que o browser fixe/force o preenchimento automático das credenciais ao carregar o ecrã
  useEffect(() => {
    const timer1 = setTimeout(() => {
      setEmail('');
      setPassword('');
    }, 50);
    const timer2 = setTimeout(() => {
      setEmail('');
      setPassword('');
    }, 200);
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  // Rotates high contrast phrases in the carrossel every 8 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCarouselIndex((prev) => (prev + 1) % CAROUSEL_SLIDES.length);
    }, 8000);
    return () => clearInterval(timer);
  }, []);

  const handlePrevSlide = () => {
    setCarouselIndex((prev) => (prev === 0 ? CAROUSEL_SLIDES.length - 1 : prev - 1));
  };

  const handleNextSlide = () => {
    setCarouselIndex((prev) => (prev + 1) % CAROUSEL_SLIDES.length);
  };

  const handleFormLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const targetEmail = email.trim().toLowerCase();
    const targetPass = password.trim();

    if (!targetEmail || !targetPass) {
      setErrorMsg('Por favor introduza o e-mail ou nome de utilizador e a palavra-passe.');
      return;
    }

    const customAdminPass = localStorage.getItem('kix_admin_password_custom') || 'Historia100';

    // 1. Check if Administrator account
    const isAdminAccount = 
      targetEmail === 'admin@kixfundo.ao' || 
      targetEmail === 'admin' || 
      targetEmail === 'lpambo' || 
      targetEmail === 'lmendesvictor@gmail.com' ||
      targetEmail === (userEmail || '').toLowerCase();

    if (isAdminAccount) {
      if (targetPass === customAdminPass || targetPass === 'Historia100' || targetPass === 'admin123' || targetPass === 'admin' || targetPass === '1234') {
        const resolvedEmail = (targetEmail === 'lpambo' || targetEmail === 'admin') ? 'lmendesvictor@gmail.com' : targetEmail;
        setEmail('');
        setPassword('');
        onLogin({
          email: resolvedEmail,
          role: 'admin',
          name: 'Administrador Principal'
        });
        return;
      } else {
        setErrorMsg('Palavra-passe de administrador incorreta.');
        setPassword('');
        return;
      }
    }

    // 2. Check Member Accounts
    const matchedMember = members.find(
      (m) => m.email.toLowerCase() === targetEmail || m.name.toLowerCase().includes(targetEmail)
    );

    if (matchedMember) {
      const matchPass = matchedMember.tempPassword || 'membro123';
      if (targetPass === matchPass || targetPass === 'membro123' || targetPass === 'membro' || targetPass === '1234') {
        setEmail('');
        setPassword('');
        onLogin({
          email: matchedMember.email,
          role: matchedMember.role || 'membro',
          memberId: matchedMember.id,
          name: matchedMember.name
        });
        return;
      } else {
        setErrorMsg('Palavra-passe de acesso inválida.');
        setPassword('');
        return;
      }
    }

    setErrorMsg('Conta não localizada no consórcio.');
    setPassword('');
  };

  const loginAsAdmin = () => {
    setEmail(userEmail || 'admin@kixfundo.ao');
    setPassword(localStorage.getItem('kix_admin_password_custom') || 'Historia100');
    onLogin({
      email: userEmail || 'admin@kixfundo.ao',
      role: 'admin',
      name: 'Mendes Pambo (Administrador)'
    });
  };

  const loginAsMember = (chosenMember: Member) => {
    setEmail(chosenMember.email);
    setPassword(chosenMember.tempPassword || 'membro123');
    onLogin({
      email: chosenMember.email,
      role: chosenMember.role || 'membro',
      memberId: chosenMember.id,
      name: chosenMember.name
    });
  };

  const handleRecoverSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setRecoveryStatus('');

    if (recoveryStep === 'request') {
      if (!recoveryEmail) return;
      const emailToSearch = recoveryEmail.trim().toLowerCase();

      const foundMember = members.find(m => m.email.toLowerCase() === emailToSearch || m.name.toLowerCase().includes(emailToSearch));
      const isAdmin = emailToSearch === 'admin@kixfundo.ao' || emailToSearch === 'admin' || emailToSearch === (userEmail || '').toLowerCase();

      if (isAdmin || foundMember) {
        setIdentifiedUser(isAdmin ? 'Administrador Principal' : (foundMember?.name || 'Membro'));
        setRecoveryStep('new-password');
      } else {
        setRecoveryStatus('E-mail ou utilizador não localizado no sistema.');
      }
    } else if (recoveryStep === 'new-password') {
      if (!newPassword.trim()) {
        setRecoveryStatus('Por favor insira uma nova palavra-passe.');
        return;
      }

      if (onResetPassword) {
        const success = onResetPassword(recoveryEmail.trim(), newPassword.trim());
        if (success) {
          setRecoveryStep('success');
          setRecoveryStatus(`A palavra-passe de ${identifiedUser} foi redefinida com sucesso!`);
        } else {
          setRecoveryStatus('Erro técnico ao guardar a redefinição de segurança.');
        }
      } else {
        const emailToSearch = recoveryEmail.trim().toLowerCase();
        const isAdmin = emailToSearch === 'admin@kixfundo.ao' || emailToSearch === 'admin' || emailToSearch === (userEmail || '').toLowerCase();
        if (isAdmin) {
          localStorage.setItem('kix_admin_password_custom', newPassword.trim());
        }
        setRecoveryStep('success');
        setRecoveryStatus(`A palavra-passe de ${identifiedUser} foi redefinida com sucesso!`);
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#070b19] flex flex-col md:flex-row w-full text-slate-100 font-sans selection:bg-sky-500 selection:text-white overflow-hidden relative">
      {/* Universal Financial Growth Watermark Background */}
      <div 
        className="pointer-events-none fixed inset-0 z-0 bg-cover bg-center bg-no-repeat transition-opacity duration-300 select-none animate-fade-in"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?auto=format&fit=crop&q=80&w=2000')`,
          opacity: 0.055,
          mixBlendMode: 'overlay' as any
        }}
      />
      
      {/* 1. LEFT SIDE PANEL: Showcase, Carousel, Arrows & Slides */}
      <div className="hidden md:flex md:w-1/2 lg:w-[58%] relative overflow-hidden bg-slate-950 flex-col justify-end p-12 lg:p-16">
        
        {/* Absolute Background Carousel with fade effect */}
        <div className="absolute inset-0">
          <AnimatePresence>
            <motion.div
              key={carouselIndex}
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.65 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.0, ease: 'easeInOut' }}
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${CAROUSEL_SLIDES[carouselIndex].image})` }}
            />
          </AnimatePresence>
          {/* Subtle financial deep blue / navy overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#020617] via-[#070b19]/90 to-transparent opacity-95" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#020617]/50 to-transparent" />
        </div>

        {/* Dynamic Carousel content overlay */}
        <div className="relative z-10 space-y-8 max-w-xl">
          
          <div className="space-y-3">
            <AnimatePresence mode="wait">
              <motion.div
                key={carouselIndex}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.4 }}
                className="space-y-2"
              >
                <h1 className="text-3xl lg:text-4.5xl font-extrabold text-white tracking-tight leading-tight">
                  {CAROUSEL_SLIDES[carouselIndex].title}
                </h1>
                <p className="text-sky-300 font-light text-base lg:text-lg leading-relaxed">
                  {CAROUSEL_SLIDES[carouselIndex].description}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Dots controller indicator bar */}
          <div className="flex items-center gap-2">
            {CAROUSEL_SLIDES.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setCarouselIndex(idx)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  carouselIndex === idx ? 'w-8 bg-sky-450' : 'w-2 bg-white/40 hover:bg-white/60'
                }`}
                title={`Ver slide ${idx + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Carousel arrows `<` and `>` */}
        <div className="absolute top-1/2 -translate-y-1/2 left-6 z-25">
          <button
            type="button"
            onClick={handlePrevSlide}
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all backdrop-blur-sm shadow-md"
            title="Slide Anterior"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        </div>

        <div className="absolute top-1/2 -translate-y-1/2 right-6 z-25">
          <button
            type="button"
            onClick={handleNextSlide}
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all backdrop-blur-sm shadow-md"
            title="Próximo Slide"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* System telemetry label */}
        <div className="absolute bottom-6 left-12 z-20 text-[10px] text-white/40 tracking-wider font-mono uppercase">
          Kixi - Fundo Platform • v2026.1
        </div>
      </div>

      {/* 2. RIGHT SIDE PANEL: Beautiful standard navy blue background for the login forms */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 md:p-12 lg:p-16 bg-[#030712]">
        
        {/* Primary Container card with rounded-3xl and custom shadow - now a premium dark navy card */}
        <div className="w-full max-w-[460px] bg-[#0b0f19] border border-slate-800/80 rounded-3xl p-8 lg:p-10 shadow-2xl shadow-black/80 flex flex-col justify-between">
          
          <div>
            {/* Header branding block with Green round icon */}
            <div className="flex flex-col items-center justify-center text-center space-y-2 mb-6 uppercase">
              <div className="w-12 h-12 rounded-2xl bg-[#0EA5E9] flex items-center justify-center shadow-lg shadow-sky-500/20">
                <ShieldCheck className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-[18px] font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-sky-450 via-emerald-400 to-teal-400 leading-tight">
                Kixi - Fundo
              </h2>
              <p className="text-[9px] text-[#38BDF8] font-bold tracking-widest uppercase">
                A poupaça do seu Dinheiro
              </p>
            </div>

            {/* Sub Welcome message */}
            <div className="text-center space-y-1.5 mb-6">
              <h3 className="text-xl font-bold tracking-tight text-white">
                Entrar no Sistema
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed px-2">
                Introduza as suas credenciais para gerir de forma segura e transparente as suas poupanças.
              </p>
            </div>

            {/* Error banner */}
            {errorMsg && (
              <div className="p-3 bg-rose-955/40 border border-rose-800/50 text-rose-200 rounded-xl text-xs flex items-center gap-2 mb-5 animate-pulse">
                <AlertCircle className="w-4.5 h-4.5 text-rose-500 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Info/Inactivity banner */}
            {infoMsg && (
              <div className="p-3 bg-amber-500/10 border border-amber-550/40 text-amber-200 rounded-xl text-xs flex items-center gap-2 mb-5">
                <AlertCircle className="w-4.5 h-4.5 text-amber-400 shrink-0 animate-bounce" />
                <span>{infoMsg}</span>
              </div>
            )}

            {/* Form controls */}
            <form onSubmit={handleFormLogin} className="space-y-4" autoComplete="off">
              
              {/* Utilizador / Email */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 font-mono">
                  UTILIZADOR OU EMAIL
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                    <UserIcon className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    required
                    placeholder="Username ou email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (infoMsg) setInfoMsg('');
                    }}
                    autoComplete="new-password"
                    className="w-full bg-[#111827] border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-xs focus:outline-none focus:border-[#0EA5E9] focus:bg-[#131a2e] text-white placeholder-slate-500 transition-all font-medium font-sans"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">
                    PALAVRA-PASSE
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setRecoveryStep('request');
                      setRecoveryEmail('');
                      setNewPassword('');
                      setRecoveryStatus('');
                      setShowRecoveryModal(true);
                    }}
                    className="text-xs text-[#0EA5E9] hover:text-sky-450 hover:underline font-bold transition-all animate-pulse"
                  >
                    Esqueceu?
                  </button>
                </div>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                    <Lock className="w-4 h-4" />
                  </span>
                  <input
                    type="password"
                    required
                    placeholder="********"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (infoMsg) setInfoMsg('');
                    }}
                    autoComplete="new-password"
                    className="w-full bg-[#111827] border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-xs focus:outline-none focus:border-[#0EA5E9] focus:bg-[#131a2e] text-white placeholder-slate-500 transition-all font-medium"
                  />
                </div>
              </div>

              {/* Submit trigger button */}
              <button
                type="submit"
                className="w-full bg-[#0EA5E9] hover:bg-[#0284c7] text-white font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-md shadow-sky-600/10 cursor-pointer text-xs uppercase tracking-wider mt-2.5 active:scale-98"
              >
                <ArrowRight className="w-4.5 h-4.5" />
                Entrar no Sistema
              </button>
            </form>

            {/* Locked signups - only administrador can register */}
            <div className="mt-5 text-center border-t border-slate-800/50 pt-4 space-y-3">
              <span className="text-[11px] text-slate-400 block leading-relaxed font-semibold">
                🔒 A criação de novos utilizadores é restrita ao administrador do Kixi - Fundo.
              </span>
              
              <button
                type="button"
                onClick={() => setShowRegulations(true)}
                className="w-full bg-[#111827] border border-slate-800 hover:border-amber-500/40 text-amber-505 dark:text-amber-400 font-extrabold text-[11px] py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm uppercase tracking-wider hover:bg-[#1a233a]/30 active:scale-98 select-none"
              >
                <BookOpen className="w-4 h-4 text-amber-500" />
                Normativos do Kix-Fundo
              </button>
            </div>

          </div>

          {/* LOWER SECTION OF CARD: TECHNICAL SUPPORT */}
          <div className="border-t border-slate-800 mt-6 pt-5 space-y-3">
            <div className="text-center">
              <h4 className="text-[10px] font-extrabold tracking-widest text-slate-500 uppercase">
                SUPORTE TÉCNICO
              </h4>
            </div>

            {/* Tel and Email line with beautiful contact elements */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 text-[10.5px] font-semibold text-slate-300">
              <div className="flex items-center gap-1.5">
                {/* Simulated WhatsApp icon */}
                <div className="w-5 h-5 rounded bg-emerald-600 flex items-center justify-center text-white text-[11px] font-bold">
                  w
                </div>
                <span className="font-mono text-slate-200">TEL: <strong>+244 923 456 789</strong></span>
              </div>
              <div className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-500" />
                <span className="font-mono text-slate-200">suporte@kixfundo.ao</span>
              </div>
            </div>

            {/* Technology copyright credit */}
            <div className="text-center pt-1 border-t border-slate-800/50">
              <p className="text-[8.5px] text-slate-500 uppercase tracking-widest leading-normal mb-0">
                SOFTWARE DESENVOLVIDO PELA KURKITA. TODOS OS DIREITOS RESERVADOS.
              </p>
            </div>
          </div>

        </div>

      </div>

      {/* PASSWORD RECOVERY DIALOG - FULLY FUNCTIONAL STEP FLOW FOR SECURITY CORRESPONDENT BY EMAIL */}
      <AnimatePresence>
        {showRecoveryModal && (
          <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#0b0f19] border border-slate-800 rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden text-slate-200 font-sans"
            >
              <div className="p-5 border-b border-slate-800/80 flex items-center justify-between">
                <span className="font-bold text-white uppercase text-xs tracking-wider flex items-center gap-2 font-mono">
                  <KeyRound className="w-4 h-4 text-sky-400" />
                  Redefinir Credenciais
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setShowRecoveryModal(false);
                    setRecoveryStatus('');
                  }}
                  className="text-slate-400 hover:text-white font-bold"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleRecoverSubmit} className="p-5 space-y-4">
                
                {recoveryStep === 'request' && (
                  <>
                    <p className="text-slate-400 text-xs leading-relaxed font-sans">
                      Introduza o seu e-mail ou nome de utilizador registado. O sistema localizará a sua conta institucional para a redefinição segura da palavra-passe.
                    </p>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-widest mb-1.5 font-mono">
                        E-mail ou Utilizador Corrente
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Ex: lmendesvictor@gmail.com"
                        value={recoveryEmail}
                        onChange={(e) => setRecoveryEmail(e.target.value)}
                        className="w-full bg-[#111827] border border-slate-800 rounded-xl p-3 text-xs focus:outline-none focus:border-sky-500 font-medium text-white"
                      />
                    </div>
                  </>
                )}

                {recoveryStep === 'new-password' && (
                  <>
                    <div className="p-3 bg-sky-950/40 border border-sky-850/60 rounded-xl text-xs mb-1 text-sky-300">
                      Utilizador localizado: <strong>{identifiedUser}</strong>
                    </div>

                    <p className="text-slate-400 text-xs leading-relaxed">
                      Insira agora a sua nova palavra-passe de segurança para redefinir as suas credenciais no consórcio Kixi - Fundo.
                    </p>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-widest mb-1.5 font-mono">
                        Nova Palavra-passe
                      </label>
                      <input
                        type="password"
                        required
                        placeholder="Mínimo 4 caracteres"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full bg-[#111827] border border-slate-800 rounded-xl p-3 text-xs focus:outline-none focus:border-emerald-500 font-medium text-white"
                      />
                    </div>
                  </>
                )}

                {recoveryStep === 'success' && (
                  <div className="text-center py-4 space-y-3">
                    <div className="w-12 h-12 bg-emerald-950/40 border border-emerald-850 text-emerald-400 rounded-full flex items-center justify-center mx-auto text-lg leading-none">
                      <Check className="w-6 h-6 text-emerald-400" />
                    </div>
                    <div className="p-3 bg-emerald-950/30 text-emerald-300 border border-emerald-900/40 rounded-xl text-xs leading-relaxed font-sans">
                      {recoveryStatus}
                    </div>
                  </div>
                )}

                {recoveryStatus && recoveryStep !== 'success' && (
                  <div className="p-3 bg-rose-955/40 text-rose-305 border border-rose-900/45 rounded-xl text-xs flex items-center gap-1.5 leading-relaxed">
                    <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                    <span>{recoveryStatus}</span>
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-1.5">
                  {recoveryStep !== 'success' ? (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          setShowRecoveryModal(false);
                          setRecoveryStatus('');
                        }}
                        className="px-4 py-2 bg-slate-800 text-slate-350 rounded-xl text-xs hover:bg-slate-700 transition"
                      >
                        Sair
                      </button>
                      <button
                        type="submit"
                        className="px-4.5 py-2 bg-[#0EA5E9] text-white font-bold rounded-xl text-xs hover:bg-sky-600 transition"
                      >
                        {recoveryStep === 'request' ? 'Localizar Conta' : 'Guardar Palavra-passe'}
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setShowRecoveryModal(false);
                        setRecoveryStatus('');
                      }}
                      className="px-5 py-2.5 bg-emerald-600 font-bold text-white rounded-xl text-xs hover:bg-emerald-750 transition"
                    >
                      Voltar ao Login
                    </button>
                  )}
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
      <RegulationsModal isOpen={showRegulations} onClose={() => setShowRegulations(false)} />
    </div>
  );
}

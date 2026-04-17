import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Zap, Swords, Crosshair } from "lucide-react";

const HERO_BG = "https://static.prod-images.emergentagent.com/jobs/3b1c9518-5d7f-4467-adb8-43830b406907/images/db91c3fc26d526268a90cb6d9562063f0f0163a107c5a462c66d4840eca5874e.png";

const TICKERS = [
  "Sinal AMBER-LINE detetado sobre KARNAK-7. Não responder.",
  "O DESFEITO ganhou mais um nome. Ainda não é o teu.",
  "Um contrato chegou de manhã. Foi assinado por ti. Datado de ontem.",
  "O INVERNO VERMELHO regressa em 47 dias. Guarda provisões.",
  "NOVE-FERIDAS avistado no Bairro da Lanterna. Sem corpo recuperado.",
  "A galáxia não está a morrer. Está a ser reescrita.",
  "Interferência GOLD-LINE em todas as cinturas orbitais. Óticas tingidas recomendadas.",
  "O CURA SEM NOME aceita confissões. Ninguém está a voltar.",
  "Diretiva 44-C: qualquer exilado que ouça o próprio nome em sonhos deve reportar.",
  "Recorde de ondas na Arena quebrado outra vez. E tu nem estavas lá.",
];

export default function Landing() {
  const [tickerIdx, setTickerIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTickerIdx((i) => (i + 1) % TICKERS.length), 4500);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="min-h-screen relative overflow-hidden" data-testid="landing-page">
      <div className="absolute inset-0 opacity-40" style={{ backgroundImage: `url(${HERO_BG})`, backgroundSize: "cover", backgroundPosition: "center" }} />
      <div className="absolute inset-0 bg-gradient-to-b from-[#050505]/40 via-[#050505]/80 to-[#050505]" />
      <div className="absolute inset-0 scanlines" />

      <div className="relative z-20 border-b border-[rgba(209,17,36,0.25)] bg-[rgba(5,5,5,0.6)] backdrop-blur-sm" data-testid="landing-ticker">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-12 py-2 flex items-center gap-3 overflow-hidden">
          <span className="text-[0.55rem] tracking-[0.4em] text-[#D11124] font-bold shrink-0 flicker">◆ FEED AO VIVO</span>
          <span className="text-[0.6rem] sm:text-xs tracking-[0.1em] text-[#F4F0EB]/85 font-mono truncate" key={tickerIdx}>
            ▸ {TICKERS[tickerIdx]}
          </span>
        </div>
      </div>

      <nav className="relative z-10 px-4 sm:px-12 py-4 sm:py-6 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0" data-testid="landing-brand">
          <span className="text-[#D11124] text-2xl sm:text-3xl font-black shrink-0">◈</span>
          <div className="min-w-0">
            <p className="font-display text-xs sm:text-base font-black tracking-[0.2em] sm:tracking-[0.25em] text-[#F4F0EB] truncate">
              AETHER<span className="text-[#D11124]">//</span>EXILE
            </p>
            <p className="hidden sm:block text-[0.55rem] tracking-[0.35em] text-[#8A8A8A] uppercase">
              Protocolo de Combate por Turnos
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Link to="/auth" className="btn-ghost !px-3 sm:!px-5 !py-2 !text-[0.6rem] sm:!text-xs" data-testid="landing-login-btn">
            Entrar
          </Link>
          <Link to="/auth?mode=register" className="btn-brutal !px-3 sm:!px-5 !py-2 !text-[0.6rem] sm:!text-xs" data-testid="landing-signup-btn">
            Alistar <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </nav>

      <main className="relative z-10 max-w-[1400px] mx-auto px-4 sm:px-12 pt-8 sm:pt-24 pb-12 sm:pb-24">
        <div className="grid lg:grid-cols-12 gap-6 sm:gap-10 items-start">
          <div className="lg:col-span-8 glitch-in">
            <p className="text-[0.6rem] sm:text-[0.7rem] tracking-[0.4em] sm:tracking-[0.5em] text-[#D11124] font-bold mb-4 sm:mb-6 uppercase">
              ◆ Transmissão 001 // Restrita
            </p>
            <h1 className="font-display text-4xl sm:text-6xl lg:text-8xl font-black uppercase leading-[0.9] tracking-tighter text-[#F4F0EB]">
              Os últimos
              <br />
              <span className="grad-text-red">reinos</span>
              <br />
              <span className="text-[#F5A623]">ardem devagar.</span>
            </h1>
            <p className="mt-6 sm:mt-10 max-w-2xl text-xs sm:text-base leading-relaxed text-[#8A8A8A]">
              <span className="text-[#F4F0EB]">AETHER//EXILE</span> é um RPG por turnos ambientado nas ruínas de três futuros falhados — um colapso cyberpunk que nunca acabou, um império espacial que apodreceu em órbita, e um pós-apocalipse que ainda se escreve. És o último mercenário com sinal e pulso. Escolhe o teu exílio. Ataca primeiro. Ataca por último.
            </p>
            <div className="mt-8 sm:mt-12 flex flex-wrap items-center gap-3 sm:gap-4">
              <Link to="/auth?mode=register" className="btn-brutal text-xs sm:text-sm" data-testid="hero-cta-primary">
                Começar Exílio <ArrowRight className="w-4 h-4" />
              </Link>
              <Link to="/auth" className="btn-ghost text-xs sm:text-sm" data-testid="hero-cta-secondary">
                Retomar Sinal
              </Link>
            </div>
          </div>

          <div className="lg:col-span-4 glitch-in delay-2">
            <div className="panel p-4 sm:p-6 hud-corners relative">
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <p className="text-[0.55rem] sm:text-[0.6rem] tracking-[0.3em] text-[#F5A623] font-bold">◆ DOSSIÊ</p>
                <span className="text-[0.5rem] sm:text-[0.55rem] tracking-[0.3em] text-[#D11124] flicker">● AO VIVO</span>
              </div>
              <dl className="space-y-3 sm:space-y-4 font-mono text-xs">
                <div className="flex justify-between border-b border-[rgba(244,240,235,0.08)] pb-2 sm:pb-3">
                  <dt className="text-[#8A8A8A] tracking-[0.15em] uppercase">Sistema</dt>
                  <dd className="text-[#F4F0EB]">Por Turnos</dd>
                </div>
                <div className="flex justify-between border-b border-[rgba(244,240,235,0.08)] pb-2 sm:pb-3">
                  <dt className="text-[#8A8A8A] tracking-[0.15em] uppercase">Classes</dt>
                  <dd className="text-[#F5A623]">03 Disciplinas</dd>
                </div>
                <div className="flex justify-between border-b border-[rgba(244,240,235,0.08)] pb-2 sm:pb-3">
                  <dt className="text-[#8A8A8A] tracking-[0.15em] uppercase">Missões</dt>
                  <dd className="text-[#F4F0EB]">08 / Campanha</dd>
                </div>
                <div className="flex justify-between border-b border-[rgba(244,240,235,0.08)] pb-2 sm:pb-3">
                  <dt className="text-[#8A8A8A] tracking-[0.15em] uppercase">Hostis</dt>
                  <dd className="text-[#D11124]">08 Variantes</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-[#8A8A8A] tracking-[0.15em] uppercase">Save</dt>
                  <dd className="text-[#F4F0EB]">Sincronizado</dd>
                </div>
              </dl>
            </div>
            <p className="mt-3 sm:mt-4 text-[0.55rem] tracking-[0.25em] text-[#8A8A8A] text-right uppercase">
              <span className="blink">◆</span> Sinal verificado
            </p>
          </div>
        </div>

        <section className="mt-12 sm:mt-24 lg:mt-32 grid md:grid-cols-3 gap-3 sm:gap-6">
          {[
            { icon: Swords, label: "TÁTICO", title: "Guerra Por Turnos", copy: "Atacar. Perícia. Defender. Item. Cada escolha custa. Cada escudo decai. Cada inimigo lembra-se." },
            { icon: Zap, label: "DISCIPLINAS", title: "Três Formas De Tirar Uma Vida", copy: "REVENANT. NULL-SEER. HOLLOW-BLADE. Ferro. Mente. Faca. Escolhe o silêncio que queres deixar." },
            { icon: Crosshair, label: "CAMPANHA", title: "Oito Nomes Para Desescrever", copy: "Do Evangelho de Ferrugem ao Desfeito — oito missões, uma descida lenta. A última é tua." },
          ].map((f, i) => (
            <div key={f.label} className={`panel p-4 sm:p-8 hud-corners glitch-in delay-${i + 1}`} data-testid={`feature-card-${i}`}>
              <f.icon className="w-5 h-5 sm:w-6 sm:h-6 text-[#D11124] mb-3 sm:mb-6" />
              <p className="text-[0.55rem] tracking-[0.4em] text-[#F5A623] font-bold mb-2">{f.label}</p>
              <h3 className="font-display text-lg sm:text-2xl font-black uppercase tracking-tight text-[#F4F0EB] mb-2 sm:mb-4">{f.title}</h3>
              <p className="text-[0.7rem] sm:text-xs leading-relaxed text-[#8A8A8A]">{f.copy}</p>
            </div>
          ))}
        </section>

        <section className="mt-12 sm:mt-24 relative panel-amber panel p-5 sm:p-12 overflow-hidden">
          <div className="absolute top-0 right-0 w-px h-full bg-gradient-to-b from-transparent via-[#F5A623]/50 to-transparent" />
          <p className="text-[0.55rem] sm:text-[0.6rem] tracking-[0.4em] text-[#F5A623] mb-3 sm:mb-4">◆ EXCERTO — FRAGMENTO DE CÓDEX 17</p>
          <p className="font-display text-lg sm:text-3xl lg:text-4xl leading-snug text-[#F4F0EB] max-w-4xl">
            "Dizem que a galáxia já <span className="grad-text-amber">respirou</span>. Foi antes
            da <span className="text-[#D11124]">Linha Zero</span>. Antes dos reinos se ajoelharem. Antes de pores
            a máscara."
          </p>
          <p className="mt-4 sm:mt-6 text-[0.6rem] sm:text-xs tracking-[0.25em] text-[#8A8A8A] uppercase">— Feiticeira Âmbar // Última Transmissão</p>
        </section>
      </main>

      <footer className="relative z-10 border-t border-[rgba(209,17,36,0.2)] mt-6 sm:mt-12">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-12 py-4 sm:py-6 flex flex-wrap justify-between items-center gap-2 text-[0.55rem] sm:text-[0.6rem] tracking-[0.3em] text-[#8A8A8A] uppercase">
          <span>◈ AETHER//EXILE — © Protocolo Occult Cyber-Brutalism</span>
          <span className="text-[#D11124] flicker">SINAL ESTÁVEL</span>
        </div>
      </footer>
    </div>
  );
}

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Zap, Swords, Crosshair } from "lucide-react";

const HERO_BG = "https://static.prod-images.emergentagent.com/jobs/3b1c9518-5d7f-4467-adb8-43830b406907/images/db91c3fc26d526268a90cb6d9562063f0f0163a107c5a462c66d4840eca5874e.png";

const TICKERS = [
  "AMBER LINE signal detected over KARNAK-7. Do not respond.",
  "THE UNMADE has gained another name. It is not yours. Yet.",
  "A contract arrived this morning. It was signed by you. Dated yesterday.",
  "THE RED WINTER returns in 47 days. Stock caches accordingly.",
  "NINE-WOUNDS has been spotted at the Lantern Ward. No body recovered.",
  "The galaxy is not dying. It is being written over.",
  "GOLD-LINE interference across orbital belts. Tinted optics advised.",
  "THE NAMELESS CURATE is accepting confessions. Nobody is returning.",
  "Directive 44-C: any exile who hears their own name in dreams must report.",
  "Arena wave record broken again. You were not even there.",
];

export default function Landing() {
  const [tickerIdx, setTickerIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTickerIdx((i) => (i + 1) % TICKERS.length), 4500);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="min-h-screen relative overflow-hidden" data-testid="landing-page">
      {/* Background */}
      <div
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage: `url(${HERO_BG})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-[#050505]/40 via-[#050505]/80 to-[#050505]" />
      <div className="absolute inset-0 scanlines" />

      {/* Ticker bar */}
      <div className="relative z-20 border-b border-[rgba(209,17,36,0.25)] bg-[rgba(5,5,5,0.6)] backdrop-blur-sm" data-testid="landing-ticker">
        <div className="max-w-[1400px] mx-auto px-6 sm:px-12 py-2 flex items-center gap-3 overflow-hidden">
          <span className="text-[0.55rem] tracking-[0.4em] text-[#D11124] font-bold shrink-0 flicker">◆ LIVE FEED</span>
          <span className="text-[0.6rem] sm:text-xs tracking-[0.1em] text-[#F4F0EB]/85 font-mono truncate" key={tickerIdx}>
            ▸ {TICKERS[tickerIdx]}
          </span>
        </div>
      </div>

      {/* Top nav */}
      <nav className="relative z-10 px-6 sm:px-12 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3" data-testid="landing-brand">
          <span className="text-[#D11124] text-3xl font-black">◈</span>
          <div>
            <p className="font-display text-base font-black tracking-[0.25em] text-[#F4F0EB]">
              AETHER<span className="text-[#D11124]">//</span>EXILE
            </p>
            <p className="text-[0.55rem] tracking-[0.35em] text-[#8A8A8A] uppercase">
              Turn-Based Combat Protocol
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/auth" className="btn-ghost" data-testid="landing-login-btn">
            Log In
          </Link>
          <Link to="/auth?mode=register" className="btn-brutal" data-testid="landing-signup-btn">
            Enlist <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <main className="relative z-10 max-w-[1400px] mx-auto px-6 sm:px-12 pt-12 sm:pt-24 pb-24">
        <div className="grid lg:grid-cols-12 gap-10 items-start">
          <div className="lg:col-span-8 glitch-in">
            <p className="text-[0.7rem] tracking-[0.5em] text-[#D11124] font-bold mb-6 uppercase">
              ◆ Transmission 001 // Restricted
            </p>
            <h1 className="font-display text-5xl sm:text-6xl lg:text-8xl font-black uppercase leading-[0.9] tracking-tighter text-[#F4F0EB]">
              The last
              <br />
              <span className="grad-text-red">kingdoms</span>
              <br />
              <span className="text-[#F5A623]">burn slow.</span>
            </h1>
            <p className="mt-10 max-w-2xl text-sm sm:text-base leading-relaxed text-[#8A8A8A]">
              <span className="text-[#F4F0EB]">AETHER//EXILE</span> is a turn-based RPG set in the ruins of three failed futures — a cyberpunk collapse that never ended, a space empire that rotted in orbit, and a post-apocalypse that is still writing itself. You are the last contractor with a signal and a pulse. Choose your exile. Strike first. Strike last.
            </p>

            <div className="mt-12 flex flex-wrap items-center gap-4">
              <Link to="/auth?mode=register" className="btn-brutal text-sm" data-testid="hero-cta-primary">
                Begin Exile <ArrowRight className="w-4 h-4" />
              </Link>
              <Link to="/auth" className="btn-ghost text-sm" data-testid="hero-cta-secondary">
                Resume Signal
              </Link>
            </div>
          </div>

          {/* Right stat panel */}
          <div className="lg:col-span-4 glitch-in delay-2">
            <div className="panel p-6 hud-corners relative">
              <div className="flex items-center justify-between mb-6">
                <p className="text-[0.6rem] tracking-[0.3em] text-[#F5A623] font-bold">◆ DOSSIER</p>
                <span className="text-[0.55rem] tracking-[0.3em] text-[#D11124] flicker">● LIVE</span>
              </div>
              <dl className="space-y-4 font-mono text-xs">
                <div className="flex justify-between border-b border-[rgba(244,240,235,0.08)] pb-3">
                  <dt className="text-[#8A8A8A] tracking-[0.15em] uppercase">System</dt>
                  <dd className="text-[#F4F0EB]">Turn-Based</dd>
                </div>
                <div className="flex justify-between border-b border-[rgba(244,240,235,0.08)] pb-3">
                  <dt className="text-[#8A8A8A] tracking-[0.15em] uppercase">Classes</dt>
                  <dd className="text-[#F5A623]">03 Disciplines</dd>
                </div>
                <div className="flex justify-between border-b border-[rgba(244,240,235,0.08)] pb-3">
                  <dt className="text-[#8A8A8A] tracking-[0.15em] uppercase">Missions</dt>
                  <dd className="text-[#F4F0EB]">08 / Campaign</dd>
                </div>
                <div className="flex justify-between border-b border-[rgba(244,240,235,0.08)] pb-3">
                  <dt className="text-[#8A8A8A] tracking-[0.15em] uppercase">Hostiles</dt>
                  <dd className="text-[#D11124]">08 Variants</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-[#8A8A8A] tracking-[0.15em] uppercase">Save</dt>
                  <dd className="text-[#F4F0EB]">Cloud-Linked</dd>
                </div>
              </dl>
            </div>
            <p className="mt-4 text-[0.6rem] tracking-[0.25em] text-[#8A8A8A] text-right uppercase">
              <span className="blink">◆</span> Signal verified
            </p>
          </div>
        </div>

        {/* Feature row */}
        <section className="mt-24 sm:mt-32 grid md:grid-cols-3 gap-6">
          {[
            { icon: Swords, label: "TACTICAL", title: "Turn-Based Warfare", copy: "Attack. Skill. Defend. Item. Every choice costs. Every shield decays. Every enemy remembers." },
            { icon: Zap, label: "DISCIPLINES", title: "Three Ways To End A Life", copy: "REVENANT. NULL-SEER. HOLLOW-BLADE. Iron. Mind. Knife. Pick the silence you want to leave behind." },
            { icon: Crosshair, label: "CAMPAIGN", title: "Eight Names To Unwrite", copy: "From the Rust Gospel to the Unmade — eight missions, one slow descent. The last one is yours." },
          ].map((f, i) => (
            <div
              key={f.label}
              className={`panel p-6 sm:p-8 hud-corners glitch-in delay-${i + 1}`}
              data-testid={`feature-card-${i}`}
            >
              <f.icon className="w-6 h-6 text-[#D11124] mb-6" />
              <p className="text-[0.55rem] tracking-[0.4em] text-[#F5A623] font-bold mb-2">{f.label}</p>
              <h3 className="font-display text-xl sm:text-2xl font-black uppercase tracking-tight text-[#F4F0EB] mb-4">
                {f.title}
              </h3>
              <p className="text-xs leading-relaxed text-[#8A8A8A]">{f.copy}</p>
            </div>
          ))}
        </section>

        {/* Lore strip */}
        <section className="mt-24 relative panel-amber panel p-8 sm:p-12 overflow-hidden">
          <div className="absolute top-0 right-0 w-px h-full bg-gradient-to-b from-transparent via-[#F5A623]/50 to-transparent" />
          <p className="text-[0.6rem] tracking-[0.4em] text-[#F5A623] mb-4">◆ EXCERPT — CODEX FRAGMENT 17</p>
          <p className="font-display text-2xl sm:text-3xl lg:text-4xl leading-snug text-[#F4F0EB] max-w-4xl">
            "They say the galaxy used to <span className="grad-text-amber">breathe</span>. That was before
            the <span className="text-[#D11124]">Zero-Line</span>. Before the kingdoms knelt. Before you
            put on the mask."
          </p>
          <p className="mt-6 text-xs tracking-[0.25em] text-[#8A8A8A] uppercase">— Amber Witch // Final Broadcast</p>
        </section>
      </main>

      <footer className="relative z-10 border-t border-[rgba(209,17,36,0.2)] mt-12">
        <div className="max-w-[1400px] mx-auto px-6 sm:px-12 py-6 flex justify-between items-center text-[0.6rem] tracking-[0.3em] text-[#8A8A8A] uppercase">
          <span>◈ AETHER//EXILE — © Occult Cyber-Brutalism Protocol</span>
          <span className="text-[#D11124] flicker">SIGNAL STABLE</span>
        </div>
      </footer>
    </div>
  );
}

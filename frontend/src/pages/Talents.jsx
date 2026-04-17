import { useEffect, useState } from "react";
import { api, formatApiError } from "@/lib/api";
import HUD from "@/components/HUD";
import { Lock, Zap, Sparkles, Shield, Sword, CheckCircle2 } from "lucide-react";

const BRANCH_META = {
  IRON:  { color: "#F4F0EB", accent: "#D11124", icon: Shield, tagline: "The wall refuses." },
  VOID:  { color: "#F5A623", accent: "#F5A623", icon: Sparkles, tagline: "Where the zero-line sings." },
  BLOOD: { color: "#D11124", accent: "#D11124", icon: Sword, tagline: "What the knife remembers." },
};

export default function Talents() {
  const [character, setCharacter] = useState(null);
  const [tree, setTree] = useState([]);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const load = async () => {
    try {
      const [c, meta] = await Promise.all([api.get("/game/character"), api.get("/game/meta")]);
      setCharacter(c.data);
      setTree(meta.data.talents);
    } catch (e) { setErr(formatApiError(e.response?.data?.detail)); }
  };

  useEffect(() => { load(); }, []);

  const allocate = async (tid) => {
    setBusy(true); setErr("");
    try {
      const { data } = await api.post("/game/talents/allocate", { talent_id: tid });
      setCharacter(data);
    } catch (e) { setErr(formatApiError(e.response?.data?.detail)); }
    finally { setBusy(false); }
  };

  if (!character || !tree.length) return <div className="min-h-screen flex items-center justify-center"><p className="font-display text-2xl grad-text-amber flicker">LOADING NEURAL ARRAY</p></div>;

  const owned = new Set(character.talents_owned || []);
  const canTake = (t) => !owned.has(t.id) && character.talent_points > 0 && (!t.prereq || owned.has(t.prereq));
  const branches = ["IRON", "VOID", "BLOOD"];

  return (
    <div className="min-h-screen" data-testid="talents-page">
      <HUD character={character} />
      <main className="max-w-[1400px] mx-auto px-4 sm:px-8 py-8">
        <div className="mb-10 glitch-in flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div>
            <p className="text-[0.6rem] tracking-[0.5em] text-[#D11124] font-bold mb-3">◆ NEURAL INVESTMENT</p>
            <h1 className="font-display text-4xl sm:text-5xl font-black uppercase tracking-tighter text-[#F4F0EB]">
              Invest in the <span className="grad-text-red">shape</span>
              <br />
              <span className="grad-text-amber">you become.</span>
            </h1>
            <p className="mt-4 max-w-2xl text-sm text-[#8A8A8A] leading-relaxed">
              Every level grants one TALENT POINT. Each node rewires your operative. Choose carefully — the galaxy has no refund counter.
            </p>
          </div>
          <div className="panel p-5 hud-corners min-w-[240px] text-center">
            <p className="text-[0.55rem] tracking-[0.4em] text-[#F5A623] font-bold">AVAILABLE POINTS</p>
            <p className="font-display text-6xl font-black grad-text-amber mt-1" data-testid="talent-points-count">
              {character.talent_points || 0}
            </p>
            <p className="text-[0.6rem] tracking-[0.2em] text-[#8A8A8A] mt-1">INVEST OR HOARD</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {branches.map((branch, bi) => {
            const nodes = tree.filter((t) => t.branch === branch).sort((a, b) => a.tier - b.tier);
            const meta = BRANCH_META[branch];
            const Icon = meta.icon;
            return (
              <div key={branch} className={`panel hud-corners p-6 glitch-in delay-${bi + 1}`} data-testid={`branch-${branch.toLowerCase()}`}>
                <div className="flex items-center justify-between mb-2 pb-4 border-b border-[rgba(244,240,235,0.1)]">
                  <div className="flex items-center gap-3">
                    <Icon className="w-5 h-5" style={{ color: meta.accent }} />
                    <div>
                      <p className="text-[0.55rem] tracking-[0.4em] font-bold" style={{ color: meta.accent }}>BRANCH // {branch}</p>
                      <p className="text-[0.65rem] tracking-[0.15em] text-[#8A8A8A] italic uppercase">{meta.tagline}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 mt-4 relative">
                  {/* Connector line */}
                  <div className="absolute left-4 top-8 bottom-8 w-px bg-gradient-to-b from-transparent via-[rgba(244,240,235,0.15)] to-transparent" />
                  {nodes.map((t, i) => {
                    const isOwned = owned.has(t.id);
                    const takeable = canTake(t);
                    const locked = !isOwned && !takeable;
                    return (
                      <div key={t.id} className="relative pl-10">
                        <div
                          className="absolute left-2 top-3 w-5 h-5 border flex items-center justify-center z-10"
                          style={{
                            background: isOwned ? meta.accent : "#0A0A0A",
                            borderColor: isOwned ? meta.accent : locked ? "#333" : meta.accent,
                          }}
                        >
                          {isOwned ? <CheckCircle2 className="w-3 h-3 text-[#050505]" /> :
                            locked ? <Lock className="w-2.5 h-2.5 text-[#555]" /> :
                            <span className="text-[0.55rem] font-black" style={{ color: meta.accent }}>{t.tier}</span>
                          }
                        </div>
                        <button
                          onClick={() => canTake(t) && allocate(t.id)}
                          disabled={busy || !canTake(t)}
                          className={`w-full text-left p-3 border transition-all
                            ${isOwned ? "border-[rgba(245,166,35,0.4)] bg-[rgba(245,166,35,0.04)]" :
                              takeable ? "border-[rgba(244,240,235,0.15)] hover:border-[#F5A623] hover:bg-[rgba(245,166,35,0.05)] cursor-pointer" :
                              "border-[rgba(244,240,235,0.05)] opacity-40 cursor-not-allowed"}`}
                          data-testid={`talent-${t.id}`}
                        >
                          <div className="flex justify-between items-start">
                            <p className="font-display text-xs sm:text-sm font-black uppercase tracking-tight text-[#F4F0EB]">{t.name}</p>
                            <span className="text-[0.55rem] tracking-[0.2em] font-mono" style={{ color: meta.accent }}>T{t.tier}</span>
                          </div>
                          <p className="text-[0.7rem] text-[#8A8A8A] mt-1">{t.desc}</p>
                          {isOwned && <p className="text-[0.55rem] tracking-[0.3em] text-[#F5A623] font-bold mt-2">◆ ACQUIRED</p>}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {err && <p className="mt-6 text-xs text-[#D11124]" data-testid="talents-error">{err}</p>}
      </main>
    </div>
  );
}

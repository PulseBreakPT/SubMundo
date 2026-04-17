import { useEffect, useState } from "react";
import { api, formatApiError } from "@/lib/api";
import HUD from "@/components/HUD";
import { ShoppingBag, Hammer, Users, Calendar, Coins, Check } from "lucide-react";

const TABS = [
  { id: "market", label: "MERCADO", icon: ShoppingBag },
  { id: "craft",  label: "ARTESANATO", icon: Hammer },
  { id: "factions", label: "FACÇÕES", icon: Users },
  { id: "daily", label: "DIÁRIAS", icon: Calendar },
];

export default function Station() {
  const [tab, setTab] = useState("market");
  const [character, setCharacter] = useState(null);
  const [market, setMarket] = useState([]);
  const [crafting, setCrafting] = useState({ recipes: [], materials: {} });
  const [factions, setFactions] = useState([]);
  const [daily, setDaily] = useState({ tasks: [] });
  const [log, setLog] = useState([]);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const load = async () => {
    try {
      const [c, m, cr, f, d] = await Promise.all([
        api.get("/game/character"), api.get("/game/market"),
        api.get("/game/crafting"), api.get("/game/factions"), api.get("/game/daily"),
      ]);
      setCharacter(c.data); setMarket(m.data); setCrafting(cr.data);
      setFactions(f.data); setDaily(d.data);
    } catch (e) { setErr(formatApiError(e.response?.data?.detail)); }
  };
  useEffect(() => { load(); }, []);

  const call = async (fn) => {
    setBusy(true); setErr("");
    try { const res = await fn(); if (res?.data?.lines) setLog((l) => [...res.data.lines, ...l].slice(0, 30)); if (res?.data?.character) setCharacter(res.data.character); }
    catch (e) { setErr(formatApiError(e.response?.data?.detail)); }
    finally { setBusy(false); }
  };

  if (!character) return <div className="min-h-screen flex items-center justify-center"><p className="font-display text-2xl grad-text-amber flicker">A CALIBRAR ESTAÇÃO</p></div>;

  return (
    <div className="min-h-screen" data-testid="station-page">
      <HUD character={character} />
      <main className="max-w-[1400px] mx-auto px-3 sm:px-8 py-4 sm:py-8">
        <div className="mb-5 sm:mb-10 glitch-in">
          <p className="text-[0.55rem] sm:text-[0.6rem] tracking-[0.4em] sm:tracking-[0.5em] text-[#E31230] font-bold mb-2 sm:mb-3">◆ ESTAÇÃO DE OPERAÇÕES</p>
          <h1 className="font-display text-2xl sm:text-5xl font-black uppercase tracking-tighter text-[#F4F0EB] leading-[1]">
            Negocia. Forja. <span className="grad-text-red">Jura.</span>
          </h1>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-1 sm:gap-2 mb-4 sm:mb-6 border-b border-[rgba(227,18,48,0.25)]" data-testid="station-tabs">
          {TABS.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)} data-testid={`tab-${t.id}`}
              className={`flex items-center gap-2 px-3 sm:px-5 py-2 sm:py-3 font-display text-[0.65rem] sm:text-xs font-black uppercase tracking-[0.2em] transition-all ${
                tab === t.id ? "text-[#FF1E3C] border-b-2 border-[#FF1E3C] -mb-px" : "text-[#8A8A8A] hover:text-[#F4F0EB]"
              }`}>
              <t.icon className="w-3 h-3 sm:w-4 sm:h-4" /> {t.label}
            </button>
          ))}
        </div>

        <div className="grid lg:grid-cols-12 gap-3 sm:gap-6">
          <div className="lg:col-span-9">
            {tab === "market" && (
              <div className="space-y-2" data-testid="market-panel">
                {market.map((g) => (
                  <div key={g.id} className="panel hud-corners p-3 sm:p-5 flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-display text-sm sm:text-base font-black uppercase text-[#F4F0EB]">{g.name}</p>
                      <p className="text-[0.65rem] text-[#8A8A8A] mt-0.5">{g.desc}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-mono text-sm text-[#F5A623] font-bold">{g.cost} CR</p>
                      <button onClick={() => call(() => api.post("/game/market/buy", { good_id: g.id }))}
                        disabled={busy || character.credits < g.cost}
                        className="btn-brutal !text-[0.6rem] !py-1.5 !px-3 mt-2" data-testid={`buy-${g.id}`}>
                        COMPRAR
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {tab === "craft" && (
              <div className="space-y-2" data-testid="craft-panel">
                {crafting.recipes.map((r) => {
                  const canMats = Object.entries(r.cost_materials).every(([mid, q]) => (character.materials?.[mid] || 0) >= q);
                  const canCr = character.credits >= r.cost_credits;
                  return (
                    <div key={r.id} className="panel hud-corners p-3 sm:p-5">
                      <div className="flex items-center justify-between gap-3 mb-2">
                        <p className="font-display text-sm font-black uppercase text-[#F4F0EB]">{r.name}</p>
                        <p className="font-mono text-xs text-[#F5A623]">{r.cost_credits} CR</p>
                      </div>
                      <div className="flex flex-wrap gap-1.5 text-[0.6rem] font-mono mb-3">
                        {Object.entries(r.cost_materials).map(([mid, q]) => {
                          const have = character.materials?.[mid] || 0;
                          const ok = have >= q;
                          return (
                            <span key={mid} className={`px-1.5 py-0.5 border ${ok ? "border-[#FF1E3C]/50 text-[#F4F0EB]" : "border-[#555] text-[#666]"}`}>
                              {crafting.materials[mid]?.name || mid} {have}/{q}
                            </span>
                          );
                        })}
                      </div>
                      <button onClick={() => call(() => api.post("/game/craft", { recipe_id: r.id }))}
                        disabled={busy || !canMats || !canCr} className="btn-brutal w-full !text-[0.65rem] !py-2" data-testid={`craft-${r.id}`}>
                        FABRICAR
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {tab === "factions" && (
              <div className="space-y-2" data-testid="factions-panel">
                {factions.map((f) => {
                  const pct = Math.max(0, Math.min(100, ((f.rep + 50) / 350) * 100));
                  return (
                    <div key={f.id} className="panel hud-corners p-3 sm:p-5">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl" style={{ color: f.color }}>{f.sigil}</span>
                          <div>
                            <p className="font-display text-sm font-black uppercase text-[#F4F0EB]">{f.name}</p>
                            <p className="text-[0.6rem] tracking-[0.3em] font-bold" style={{ color: f.color }}>{f.rank}</p>
                          </div>
                        </div>
                        <p className="font-mono text-sm text-[#F5A623]">{f.rep}</p>
                      </div>
                      <div className="bar-track" style={{ borderColor: f.color + "66" }}>
                        <div className="bar-fill-energy" style={{ width: `${pct}%`, background: f.color }} />
                      </div>
                      <p className="text-[0.65rem] text-[#8A8A8A] mt-2 italic">{f.desc}</p>
                    </div>
                  );
                })}
              </div>
            )}

            {tab === "daily" && (
              <div className="space-y-2" data-testid="daily-panel">
                <p className="text-[0.55rem] tracking-[0.3em] text-[#8A8A8A] mb-3">CICLO // {daily.today}</p>
                {daily.tasks.map((t) => (
                  <div key={t.id} className="panel hud-corners p-3 sm:p-5">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-display text-sm font-black uppercase text-[#F4F0EB]">{t.name}</p>
                      <p className="font-mono text-xs text-[#F5A623]">{t.current}/{t.target}</p>
                    </div>
                    <p className="text-[0.65rem] text-[#8A8A8A] mb-3">{t.desc}</p>
                    <div className="bar-track mb-3">
                      <div className="bar-fill-hp" style={{ width: `${Math.min(100, (t.current / t.target) * 100)}%` }} />
                    </div>
                    <button onClick={() => call(async () => { const r = await api.post("/game/daily/claim", { task_id: t.id }); const fresh = await api.get("/game/daily"); setDaily(fresh.data); return r; })}
                      disabled={busy || !t.done || t.claimed} className="btn-brutal w-full !text-[0.65rem] !py-2" data-testid={`claim-${t.id}`}>
                      {t.claimed ? <><Check className="w-3 h-3" /> RECLAMADA</> : t.done ? "RECLAMAR" : "INCOMPLETA"}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right: Credits + Log */}
          <div className="lg:col-span-3 space-y-3">
            <div className="panel hud-corners p-3 sm:p-5" data-testid="wallet">
              <p className="text-[0.55rem] tracking-[0.3em] text-[#F5A623] font-bold mb-2">◆ CARTEIRA</p>
              <div className="flex items-center gap-2">
                <Coins className="w-4 h-4 text-[#F5A623]" />
                <p className="font-display text-3xl font-black grad-text-amber">{character.credits || 0}</p>
              </div>
              <p className="text-[0.55rem] tracking-[0.3em] text-[#8A8A8A] mt-3">MATERIAIS</p>
              <div className="mt-2 space-y-1 text-[0.65rem] font-mono">
                {Object.entries(character.materials || {}).length === 0 && <p className="text-[#555]">— vazio —</p>}
                {Object.entries(character.materials || {}).map(([mid, q]) => (
                  <div key={mid} className="flex justify-between" data-testid={`mat-${mid}`}>
                    <span className="text-[#8A8A8A]">{crafting.materials[mid]?.name || mid}</span>
                    <span className="text-[#F4F0EB]">×{q}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="panel p-3 sm:p-4" data-testid="station-log">
              <p className="text-[0.55rem] tracking-[0.3em] text-[#F5A623] font-bold mb-2">◆ REGISTO</p>
              <div className="h-48 overflow-y-auto font-mono text-xs space-y-1">
                {log.length === 0 && <p className="text-[#555] italic">Nada registado ainda.</p>}
                {log.map((l, i) => <p key={i} className="text-[#F4F0EB]/85">{l}</p>)}
              </div>
            </div>
            {err && <p className="text-xs text-[#E31230]" data-testid="station-error">{err}</p>}
          </div>
        </div>
      </main>
    </div>
  );
}

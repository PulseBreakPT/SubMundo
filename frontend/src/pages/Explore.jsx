import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, formatApiError } from "@/lib/api";
import HUD from "@/components/HUD";
import { Compass, Lock, Swords, ArrowRight } from "lucide-react";

export default function Explore() {
  const nav = useNavigate();
  const [character, setCharacter] = useState(null);
  const [zones, setZones] = useState([]);
  const [active, setActive] = useState(null); // { zone, event, stamina }
  const [log, setLog] = useState([]);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const load = async () => {
    try {
      const [c, z] = await Promise.all([api.get("/game/character"), api.get("/game/zones")]);
      setCharacter(c.data); setZones(z.data);
    } catch (e) { setErr(formatApiError(e.response?.data?.detail)); }
  };
  useEffect(() => { load(); }, []);

  const enter = async (zone) => {
    setBusy(true); setErr(""); setActive(null);
    try {
      const { data } = await api.post("/game/zone/event", { zone_id: zone.id });
      setActive(data);
      setLog((l) => [`▸ ENTRASTE // ${zone.name} — STAMINA ${data.stamina}`, ...l].slice(0, 25));
    } catch (e) { setErr(formatApiError(e.response?.data?.detail)); }
    finally { setBusy(false); }
  };

  const choose = async (idx) => {
    if (!active) return;
    setBusy(true); setErr("");
    try {
      const { data } = await api.post("/game/zone/resolve", { zone_id: active.zone.id, event_id: active.event.id, choice_index: idx });
      if (data.combat) {
        // TODO: proper combat-from-zone. For now, log it.
        setLog((l) => [`▸ EVENTO DE COMBATE (pendente)`, ...l]);
      } else {
        setCharacter(data.character);
        setLog((l) => [...(data.lines || []), ...l].slice(0, 25));
      }
      setActive(null);
    } catch (e) { setErr(formatApiError(e.response?.data?.detail)); }
    finally { setBusy(false); }
  };

  if (!character) return <div className="min-h-screen flex items-center justify-center"><p className="font-display text-2xl grad-text-amber flicker">A CARREGAR CARTA DE ZONAS</p></div>;

  const staminaPct = Math.max(0, ((character.stamina || 0) / (character.max_stamina || 100)) * 100);

  return (
    <div className="min-h-screen" data-testid="explore-page">
      <HUD character={character} />
      <main className="max-w-[1400px] mx-auto px-3 sm:px-8 py-4 sm:py-8">
        <div className="mb-5 sm:mb-10 glitch-in">
          <p className="text-[0.55rem] sm:text-[0.6rem] tracking-[0.4em] sm:tracking-[0.5em] text-[#E31230] font-bold mb-2 sm:mb-3">◆ CAMPO ABERTO</p>
          <h1 className="font-display text-2xl sm:text-5xl font-black uppercase tracking-tighter text-[#F4F0EB] leading-[1]">
            Caminha até <span className="grad-text-red">alguém te ler</span>.
          </h1>
          <div className="mt-4 sm:mt-6 max-w-md">
            <div className="flex justify-between mb-1">
              <span className="text-[0.55rem] tracking-[0.25em] text-[#F5A623] font-bold">STAMINA</span>
              <span className="text-xs font-mono text-[#F4F0EB]" data-testid="stamina-text">{character.stamina}/{character.max_stamina || 100}</span>
            </div>
            <div className="bar-track"><div className="bar-fill-energy" style={{ width: `${staminaPct}%` }} /></div>
          </div>
        </div>

        <div className="grid lg:grid-cols-12 gap-3 sm:gap-6">
          <div className="lg:col-span-8 space-y-2">
            {zones.map((z, i) => (
              <button key={z.id} disabled={busy || z.locked || (character.stamina < z.stamina_cost)}
                onClick={() => enter(z)} data-testid={`zone-${z.id}`}
                className={`panel hud-corners p-4 sm:p-6 w-full text-left transition-all glitch-in delay-${i + 1}
                  ${z.locked ? "opacity-40 cursor-not-allowed" : "hover:!border-[#FF1E3C]"}`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    {z.locked ? <Lock className="w-4 h-4 text-[#8A8A8A]" /> : <Compass className="w-4 h-4" style={{ color: z.color }} />}
                    <p className="font-display text-sm sm:text-lg font-black uppercase text-[#F4F0EB]">{z.name}</p>
                  </div>
                  <p className="text-[0.6rem] font-mono text-[#F5A623]">-{z.stamina_cost} STAMINA</p>
                </div>
                <p className="text-[0.7rem] text-[#8A8A8A] italic">{z.desc}</p>
                <p className="text-[0.55rem] tracking-[0.3em] text-[#8A8A8A] mt-2">
                  NÍV {z.min_level} // TIER {z.tier}
                </p>
              </button>
            ))}
          </div>

          <div className="lg:col-span-4 space-y-3">
            <div className="panel hud-corners p-4 sm:p-5" data-testid="event-panel">
              <p className="text-[0.55rem] tracking-[0.3em] text-[#F5A623] font-bold mb-3">◆ EVENTO ATUAL</p>
              {!active && <p className="text-xs text-[#8A8A8A] italic">Seleciona uma zona para começar.</p>}
              {active && (
                <div className="space-y-4">
                  <p className="text-[0.55rem] tracking-[0.3em] text-[#E31230]">{active.zone.name}</p>
                  <p className="text-sm text-[#F4F0EB] leading-relaxed">{active.event.text}</p>
                  {active.event.combat && (
                    <button onClick={() => choose(0)} disabled={busy} className="btn-brutal w-full" data-testid="event-combat">
                      <Swords className="w-4 h-4" /> ENFRENTAR
                    </button>
                  )}
                  {active.event.choices && active.event.choices.map((c, i) => (
                    <button key={i} onClick={() => choose(i)} disabled={busy}
                      className="w-full text-left p-3 border border-[rgba(244,240,235,0.15)] hover:border-[#FF1E3C] hover:bg-[rgba(227,18,48,0.06)] transition"
                      data-testid={`event-choice-${i}`}>
                      <p className="font-display text-[0.7rem] font-black uppercase tracking-wide text-[#F4F0EB]">{c.label}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="panel p-3 sm:p-4" data-testid="explore-log">
              <p className="text-[0.55rem] tracking-[0.3em] text-[#F5A623] font-bold mb-2">◆ REGISTO</p>
              <div className="h-40 overflow-y-auto font-mono text-xs space-y-1">
                {log.length === 0 && <p className="text-[#555] italic">Sem atividade.</p>}
                {log.map((l, i) => <p key={i} className="text-[#F4F0EB]/85">{l}</p>)}
              </div>
            </div>
            <button onClick={() => nav("/hub")} className="btn-ghost w-full" data-testid="back-hub">← VOLTAR AO HUB</button>
            {err && <p className="text-xs text-[#E31230]" data-testid="explore-error">{err}</p>}
          </div>
        </div>
      </main>
    </div>
  );
}

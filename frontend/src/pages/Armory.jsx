import { useEffect, useState } from "react";
import { api, formatApiError } from "@/lib/api";
import HUD from "@/components/HUD";
import { Sword, Shield, Gem, X, Check } from "lucide-react";

const SLOT_META = {
  weapon: { icon: Sword, name: "ARMA",  color: "#E31230" },
  armor:  { icon: Shield, name: "ARMADURA",   color: "#F4F0EB" },
  relic:  { icon: Gem,    name: "RELÍQUIA",   color: "#F5A623" },
};

const STAT_LABEL = {
  attack: "ATQ",
  defense: "DEF",
  max_hp: "VIDA",
  max_energy: "EN",
  crit_pct: "CRIT %",
  heal_bonus_pct: "CURA %",
  element_dmg_pct: "ELEM %",
};

export default function Armory() {
  const [character, setCharacter] = useState(null);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const load = async () => {
    try {
      const { data } = await api.get("/game/character");
      setCharacter(data);
    } catch (e) { setErr(formatApiError(e.response?.data?.detail)); }
  };

  useEffect(() => { load(); }, []);

  const equip = async (itemId) => {
    setBusy(true); setErr("");
    try {
      const { data } = await api.post("/game/equipment/equip", { item_id: itemId });
      setCharacter(data);
    } catch (e) { setErr(formatApiError(e.response?.data?.detail)); }
    finally { setBusy(false); }
  };

  const unequip = async (slot) => {
    setBusy(true); setErr("");
    try {
      const { data } = await api.post("/game/equipment/unequip", { slot });
      setCharacter(data);
    } catch (e) { setErr(formatApiError(e.response?.data?.detail)); }
    finally { setBusy(false); }
  };

  if (!character) return <div className="min-h-screen flex items-center justify-center"><p className="font-display text-2xl grad-text-amber flicker">A CALIBRAR ARSENAL</p></div>;

  const stash = character.equipment_stash || [];
  const equipped = character.equipped || { weapon: null, armor: null, relic: null };

  const renderStats = (stats) => Object.entries(stats).map(([k, v]) => (
    <span key={k} className="text-[0.6rem] tracking-[0.2em] text-[#F5A623] font-mono">
      +{v}{k.endsWith("_pct") ? "%" : ""} {STAT_LABEL[k] || k.toUpperCase()}
    </span>
  ));

  return (
    <div className="min-h-screen" data-testid="armory-page">
      <HUD character={character} />
      <main className="max-w-[1400px] mx-auto px-3 sm:px-8 py-4 sm:py-8">
        <div className="mb-6 sm:mb-10 glitch-in">
          <p className="text-[0.55rem] sm:text-[0.6rem] tracking-[0.4em] sm:tracking-[0.5em] text-[#E31230] font-bold mb-2 sm:mb-3">◆ ARSENAL // MANIFESTO DE SALVAGEM</p>
          <h1 className="font-display text-2xl sm:text-5xl font-black uppercase tracking-tighter text-[#F4F0EB] leading-[1]">
            Cada nome que tiras
            <br />
            <span className="grad-text-amber">deixa algo para trás.</span>
          </h1>
        </div>

        {/* Equipped slots */}
        <div className="grid md:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-10">
          {["weapon", "armor", "relic"].map((slot, i) => {
            const sm = SLOT_META[slot];
            const Icon = sm.icon;
            const itemId = equipped[slot];
            const item = stash.find((e) => e.item_id === itemId);
            return (
              <div key={slot} className={`panel hud-corners p-4 glitch-in delay-${i + 1}`} data-testid={`equipped-${slot}`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4" style={{ color: sm.color }} />
                    <p className="text-[0.55rem] tracking-[0.4em] font-bold" style={{ color: sm.color }}>SLOT {sm.name}</p>
                  </div>
                  {item && (
                    <button onClick={() => unequip(slot)} disabled={busy} className="text-[#8A8A8A] hover:text-[#E31230]" data-testid={`unequip-${slot}`}>
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
                {item ? (
                  <>
                    <p className="font-display text-lg font-black uppercase tracking-tight text-[#F4F0EB]">{item.name}</p>
                    <p className="text-[0.55rem] tracking-[0.3em] text-[#8A8A8A] mt-1">NÍV {item.tier}</p>
                    <div className="mt-4 flex flex-wrap gap-3">{renderStats(item.stats)}</div>
                  </>
                ) : (
                  <div className="py-4 relative" style={{
                    backgroundImage: "repeating-linear-gradient(45deg, rgba(244,240,235,0.03) 0, rgba(244,240,235,0.03) 8px, transparent 8px, transparent 16px)"
                  }}>
                    <p className="font-display text-sm font-black uppercase tracking-tight text-[#8A8A8A] italic">— Slot Vazio —</p>
                    <p className="text-[0.55rem] tracking-[0.3em] text-[#8A8A8A]/60 mt-2 uppercase">Equipa do stash abaixo</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Stash */}
        <div className="panel hud-corners p-4 sm:p-6">
          <p className="text-[0.55rem] tracking-[0.4em] text-[#F5A623] font-bold mb-4">◆ STASH // {stash.length} ITEMS</p>
          {stash.length === 0 && <p className="text-xs text-[#8A8A8A]">SEM ITEMS — COMPLETA MISSÕES PARA RECUPERAR EQUIPAMENTO</p>}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3" data-testid="stash-grid">
            {stash.map((it) => {
              const sm = SLOT_META[it.slot];
              const Icon = sm.icon;
              const isEquipped = equipped[it.slot] === it.item_id;
              return (
                <div
                  key={it.item_id}
                  className={`border p-4 transition ${isEquipped ? "border-[#F5A623] bg-[rgba(245,166,35,0.05)]" : "border-[rgba(244,240,235,0.1)] hover:border-[#F5A623]/50"}`}
                  data-testid={`stash-item-${it.item_id}`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <Icon className="w-4 h-4" style={{ color: sm.color }} />
                    <span className="text-[0.55rem] tracking-[0.2em] font-mono" style={{ color: sm.color }}>T{it.tier}</span>
                  </div>
                  <p className="font-display text-sm font-black uppercase tracking-tight text-[#F4F0EB]">{it.name}</p>
                  <p className="text-[0.55rem] tracking-[0.3em] text-[#8A8A8A] uppercase mt-1">{it.slot}</p>
                  <div className="mt-3 flex flex-wrap gap-2">{renderStats(it.stats)}</div>
                  <button
                    onClick={() => equip(it.item_id)}
                    disabled={busy || isEquipped}
                    className={`mt-4 w-full flex items-center justify-center gap-2 ${isEquipped ? "btn-ghost" : "btn-brutal"} text-[0.6rem]`}
                    data-testid={`equip-${it.item_id}`}
                  >
                    {isEquipped ? <><Check className="w-3 h-3" /> EQUIPADO</> : "EQUIPAR"}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {err && <p className="mt-4 text-xs text-[#E31230]" data-testid="armory-error">{err}</p>}
      </main>
    </div>
  );
}

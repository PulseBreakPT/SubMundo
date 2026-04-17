import { useEffect, useState } from "react";
import { api, formatApiError } from "@/lib/api";
import HUD from "@/components/HUD";
import { Heart, Zap, Sword, Shield, Trophy, Package } from "lucide-react";

export default function Codex() {
  const [character, setCharacter] = useState(null);
  const [classData, setClassData] = useState(null);
  const [items, setItems] = useState({});
  const [missions, setMissions] = useState([]);
  const [err, setErr] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const [c, classes, itms, ms] = await Promise.all([
          api.get("/game/character"),
          api.get("/game/classes"),
          api.get("/game/items"),
          api.get("/game/missions"),
        ]);
        setCharacter(c.data);
        setClassData(classes.data.find((x) => x.id === c.data.class_id));
        setItems(itms.data);
        setMissions(ms.data);
      } catch (e) {
        setErr(formatApiError(e.response?.data?.detail));
      }
    })();
  }, []);

  if (!character || !classData) {
    return <div className="min-h-screen flex items-center justify-center"><p className="font-display text-2xl grad-text-amber flicker">LOADING CODEX</p></div>;
  }

  const completed = missions.filter((m) => m.completed).length;
  const xpPct = Math.min(100, (character.xp / character.xp_next) * 100);

  return (
    <div className="min-h-screen" data-testid="codex-page">
      <HUD character={character} />
      <main className="max-w-[1400px] mx-auto px-4 sm:px-8 py-8">
        <div className="mb-10 glitch-in">
          <p className="text-[0.6rem] tracking-[0.5em] text-[#D11124] font-bold mb-3">◆ CODEX // OPERATIVE DOSSIER</p>
          <h1 className="font-display text-4xl sm:text-5xl font-black uppercase tracking-tighter text-[#F4F0EB]">
            <span className="grad-text-amber">{character.callsign}</span>
          </h1>
          <p className="text-xs tracking-[0.3em] text-[#8A8A8A] uppercase mt-2">
            {classData.name} // {classData.codename} // LVL {character.level}
          </p>
        </div>

        <div className="grid lg:grid-cols-12 gap-6">
          {/* Stats */}
          <div className="lg:col-span-4 panel hud-corners p-6 glitch-in">
            <p className="text-[0.55rem] tracking-[0.4em] text-[#F5A623] font-bold mb-4">◆ VITALS</p>
            <div className="space-y-5">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-[0.55rem] tracking-[0.3em] text-[#D11124] font-bold flex items-center gap-2"><Heart className="w-3 h-3" />HP</span>
                  <span className="font-mono text-[#F4F0EB]">{character.hp}/{character.max_hp}</span>
                </div>
                <div className="bar-track"><div className="bar-fill-hp" style={{ width: `${(character.hp / character.max_hp) * 100}%` }} /><div className="bar-segments" /></div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-[0.55rem] tracking-[0.3em] text-[#F5A623] font-bold flex items-center gap-2"><Zap className="w-3 h-3" />CHARGE</span>
                  <span className="font-mono text-[#F4F0EB]">{character.energy}/{character.max_energy}</span>
                </div>
                <div className="bar-track"><div className="bar-fill-energy" style={{ width: `${(character.energy / character.max_energy) * 100}%` }} /><div className="bar-segments" /></div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-[0.55rem] tracking-[0.3em] text-[#F4F0EB] font-bold">XP</span>
                  <span className="font-mono text-[#F4F0EB]">{character.xp}/{character.xp_next}</span>
                </div>
                <div className="bar-track-xp"><div className="bar-fill-xp" style={{ width: `${xpPct}%` }} /></div>
              </div>
            </div>

            <div className="mt-8 grid grid-cols-2 gap-3">
              <div className="border border-[rgba(244,240,235,0.1)] p-3 text-center">
                <Sword className="w-4 h-4 text-[#F4F0EB] mx-auto mb-1" />
                <p className="text-[0.55rem] tracking-[0.3em] text-[#8A8A8A]">ATK</p>
                <p className="font-display text-xl font-black text-[#F4F0EB]">{character.attack}</p>
              </div>
              <div className="border border-[rgba(244,240,235,0.1)] p-3 text-center">
                <Shield className="w-4 h-4 text-[#F4F0EB] mx-auto mb-1" />
                <p className="text-[0.55rem] tracking-[0.3em] text-[#8A8A8A]">DEF</p>
                <p className="font-display text-xl font-black text-[#F4F0EB]">{character.defense}</p>
              </div>
            </div>
          </div>

          {/* Skills */}
          <div className="lg:col-span-8 panel hud-corners p-6 glitch-in delay-1">
            <p className="text-[0.55rem] tracking-[0.4em] text-[#F5A623] font-bold mb-4">◆ SKILL ARRAY // {classData.name}</p>
            <div className="grid sm:grid-cols-2 gap-3">
              {classData.skills.map((s) => (
                <div key={s.id} className="border border-[rgba(209,17,36,0.25)] p-4 hover:border-[#F5A623]/50 transition">
                  <div className="flex justify-between items-start">
                    <p className="font-display text-sm font-black uppercase tracking-tight text-[#F4F0EB]">{s.name}</p>
                    <span className="text-[0.55rem] tracking-[0.2em] text-[#F5A623] font-mono">{s.cost}EN</span>
                  </div>
                  <p className="text-[0.65rem] uppercase tracking-[0.2em] mt-1" style={{ color: classData.accent }}>{s.type.toUpperCase()} // PWR {s.power}</p>
                  <p className="text-[0.7rem] text-[#8A8A8A] mt-2">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Inventory */}
          <div className="lg:col-span-6 panel hud-corners p-6 glitch-in delay-2">
            <p className="text-[0.55rem] tracking-[0.4em] text-[#F5A623] font-bold mb-4 flex items-center gap-2">
              <Package className="w-3 h-3" /> INVENTORY
            </p>
            {character.inventory?.length === 0 && <p className="text-xs text-[#8A8A8A]">NO ITEMS LOGGED</p>}
            <div className="space-y-2" data-testid="inventory-list">
              {character.inventory.map((entry) => {
                const it = items[entry.item_id];
                if (!it) return null;
                return (
                  <div key={entry.item_id} className="border border-[rgba(244,240,235,0.1)] p-3 flex justify-between items-center">
                    <div>
                      <p className="font-display text-sm font-black uppercase text-[#F4F0EB]">{it.name}</p>
                      <p className="text-[0.65rem] text-[#8A8A8A]">{it.desc}</p>
                    </div>
                    <span className="font-display text-xl font-black text-[#F5A623]">×{entry.qty}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Progress */}
          <div className="lg:col-span-6 panel hud-corners p-6 glitch-in delay-3">
            <p className="text-[0.55rem] tracking-[0.4em] text-[#F5A623] font-bold mb-4 flex items-center gap-2">
              <Trophy className="w-3 h-3" /> CAMPAIGN LEDGER
            </p>
            <div className="flex items-baseline gap-3 mb-4">
              <p className="font-display text-5xl font-black grad-text-amber">{completed}</p>
              <p className="text-[0.6rem] tracking-[0.3em] text-[#8A8A8A] uppercase">of {missions.length} names<br />unwritten</p>
            </div>
            <div className="space-y-1.5">
              {missions.map((m) => (
                <div key={m.id} className="flex items-center justify-between text-xs py-1 border-b border-[rgba(244,240,235,0.05)]">
                  <span className={`font-mono ${m.completed ? "text-[#F5A623]" : m.locked ? "text-[#8A8A8A]/50" : "text-[#F4F0EB]"}`}>
                    {String(m.index).padStart(2, "0")} // {m.name}
                  </span>
                  <span className="text-[0.55rem] tracking-[0.2em] text-[#8A8A8A]">
                    {m.completed ? "DONE" : m.locked ? `LVL ${m.min_level}` : "READY"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {err && <p className="mt-4 text-xs text-[#D11124]">{err}</p>}
      </main>
    </div>
  );
}

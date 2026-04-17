import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api, formatApiError } from "@/lib/api";
import HUD from "@/components/HUD";
import { Lock, CheckCircle2, ArrowRight, Skull, Moon, Star, Package2, BookOpen } from "lucide-react";

const WORLD_BG = "https://static.prod-images.emergentagent.com/jobs/3b1c9518-5d7f-4467-adb8-43830b406907/images/ca4cf90dd20cc4c5be9bbcc335e43ab34440f29e65983082fb4f70b15bf75521.png";

export default function Hub() {
  const nav = useNavigate();
  const [character, setCharacter] = useState(null);
  const [missions, setMissions] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [resting, setResting] = useState(false);

  const load = async () => {
    try {
      const [c, m] = await Promise.all([api.get("/game/character"), api.get("/game/missions")]);
      setCharacter(c.data);
      setMissions(m.data);
      const next = m.data.find((mm) => !mm.completed && !mm.locked) || m.data[0];
      setSelected(next);
    } catch (e) {
      setErr(formatApiError(e.response?.data?.detail));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const rest = async () => {
    setResting(true);
    try {
      const { data } = await api.post("/game/character/rest");
      setCharacter(data);
    } catch (e) {
      setErr(formatApiError(e.response?.data?.detail));
    } finally {
      setResting(false);
    }
  };

  const deploy = async () => {
    if (!selected || selected.locked) return;
    try {
      await api.post("/game/combat/start", { mission_id: selected.id });
      nav(`/combat/${selected.id}`);
    } catch (e) {
      setErr(formatApiError(e.response?.data?.detail));
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><p className="font-display text-2xl grad-text-amber flicker">LOADING STAR-CHART</p></div>;

  const tierColor = (t) => t >= 4 ? "#D11124" : t >= 3 ? "#F5A623" : "#F4F0EB";

  return (
    <div className="min-h-screen" data-testid="hub-page">
      <HUD character={character} />

      <main className="max-w-[1400px] mx-auto px-4 sm:px-8 py-8 relative">
        <div className="mb-10 glitch-in flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <p className="text-[0.6rem] tracking-[0.5em] text-[#D11124] font-bold mb-3">
              ◆ STAR-CHART // ACTIVE EXILE
            </p>
            <h1 className="font-display text-3xl sm:text-5xl font-black uppercase tracking-tighter text-[#F4F0EB]">
              Eight names.
              <br />
              <span className="grad-text-red">Choose one</span> to unwrite.
            </h1>
          </div>
          <button onClick={rest} disabled={resting || (character.hp === character.max_hp && character.energy === character.max_energy)} className="btn-ghost" data-testid="rest-btn">
            <Moon className="w-4 h-4" />
            {resting ? "RESTING…" : "REST & RECOVER"}
          </button>
        </div>

        {/* Quick-nav system cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-8">
          <Link to="/talents" className="panel p-4 hover:!border-[#F5A623]/60 transition group relative" data-testid="quick-talents">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[0.55rem] tracking-[0.4em] text-[#F5A623] font-bold">◆ NEURAL</p>
                <p className="font-display text-sm font-black uppercase tracking-tight text-[#F4F0EB] mt-1">Talent Grid</p>
                <p className="text-[0.6rem] text-[#8A8A8A] mt-1">{character.talent_points || 0} POINT{character.talent_points !== 1 ? "S" : ""} AVAILABLE</p>
              </div>
              <Star className="w-5 h-5 text-[#F5A623] group-hover:scale-110 transition" />
              {character.talent_points > 0 && (
                <span className="absolute top-2 right-2 w-2 h-2 bg-[#F5A623] rounded-full pulse-alert" />
              )}
            </div>
          </Link>
          <Link to="/armory" className="panel p-4 hover:!border-[#F5A623]/60 transition group" data-testid="quick-armory">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[0.55rem] tracking-[0.4em] text-[#D11124] font-bold">◆ SALVAGE</p>
                <p className="font-display text-sm font-black uppercase tracking-tight text-[#F4F0EB] mt-1">Armory</p>
                <p className="text-[0.6rem] text-[#8A8A8A] mt-1">{(character.equipment_stash || []).length} ITEM{(character.equipment_stash||[]).length!==1?"S":""}</p>
              </div>
              <Package2 className="w-5 h-5 text-[#D11124] group-hover:scale-110 transition" />
            </div>
          </Link>
          <Link to="/lore" className="panel p-4 hover:!border-[#F5A623]/60 transition group" data-testid="quick-lore">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[0.55rem] tracking-[0.4em] text-[#F4F0EB] font-bold">◆ INFINITE</p>
                <p className="font-display text-sm font-black uppercase tracking-tight text-[#F4F0EB] mt-1">Codex / Lore</p>
                <p className="text-[0.6rem] text-[#8A8A8A] mt-1">{character.lore_unlocked || 3} FRAGMENTS</p>
              </div>
              <BookOpen className="w-5 h-5 text-[#F4F0EB] group-hover:scale-110 transition" />
            </div>
          </Link>
        </div>

        <div className="grid lg:grid-cols-12 gap-6">
          {/* Mission list */}
          <div className="lg:col-span-5 space-y-2">
            {missions.map((m, i) => (
              <button
                key={m.id}
                onClick={() => setSelected(m)}
                disabled={m.locked}
                className={`w-full text-left p-4 panel transition-all relative glitch-in
                  ${selected?.id === m.id ? "!border-[#F5A623] bg-[rgba(245,166,35,0.05)]" : ""}
                  ${m.locked ? "opacity-40 cursor-not-allowed" : "hover:!border-[rgba(245,166,35,0.4)]"}`}
                style={{ animationDelay: `${i * 60}ms` }}
                data-testid={`mission-row-${m.id}`}
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 text-center">
                    <p className="text-[0.6rem] tracking-[0.25em] text-[#8A8A8A]">MSN</p>
                    <p className="font-display text-2xl font-black" style={{ color: tierColor(m.tier) }}>
                      {String(m.index).padStart(2, "0")}
                    </p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-display text-sm font-black uppercase tracking-tight text-[#F4F0EB] truncate">{m.name}</p>
                    <p className="text-[0.65rem] tracking-[0.15em] text-[#8A8A8A] mt-0.5 uppercase truncate">{m.location}</p>
                    <div className="mt-2 flex gap-3 text-[0.55rem] tracking-[0.2em] text-[#8A8A8A]">
                      <span>TIER <strong className="font-mono" style={{ color: tierColor(m.tier) }}>{m.tier}</strong></span>
                      <span>LVL <strong className="text-[#F4F0EB] font-mono">{m.min_level}+</strong></span>
                      <span>REW <strong className="text-[#F5A623] font-mono">{m.xp_reward}XP</strong></span>
                    </div>
                  </div>
                  <div className="shrink-0">
                    {m.locked && <Lock className="w-4 h-4 text-[#8A8A8A]" />}
                    {m.completed && <CheckCircle2 className="w-4 h-4 text-[#F5A623]" />}
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Selected mission detail */}
          {selected && (
            <div className="lg:col-span-7 relative glitch-in delay-2">
              <div
                className="absolute inset-0 opacity-20"
                style={{ backgroundImage: `url(${WORLD_BG})`, backgroundSize: "cover", backgroundPosition: "center" }}
              />
              <div className="absolute inset-0 bg-gradient-to-br from-[#050505]/85 to-[#050505]/95" />
              <div className="relative panel panel-amber hud-corners p-6 sm:p-10" data-testid="mission-detail">
                <p className="text-[0.6rem] tracking-[0.4em] font-bold mb-3" style={{ color: tierColor(selected.tier) }}>
                  ◆ BRIEFING // MSN-{String(selected.index).padStart(2, "0")} // TIER {selected.tier}
                </p>
                <h2 className="font-display text-3xl sm:text-4xl font-black uppercase tracking-tighter text-[#F4F0EB] mb-2">
                  {selected.name}
                </h2>
                <p className="text-xs tracking-[0.2em] text-[#8A8A8A] uppercase mb-8">{selected.location}</p>

                <p className="text-sm leading-relaxed text-[#F4F0EB]/90 border-l-2 border-[#D11124] pl-4 italic">
                  "{selected.briefing}"
                </p>

                <div className="mt-8">
                  <p className="text-[0.6rem] tracking-[0.4em] text-[#D11124] font-bold mb-4">◆ HOSTILE MANIFEST</p>
                  <div className="flex flex-wrap gap-3">
                    {selected.enemies_detail.map((e) => (
                      <div key={e.id} className="border border-[rgba(209,17,36,0.3)] px-4 py-3 flex items-center gap-3">
                        <Skull className="w-4 h-4 text-[#D11124]" />
                        <div>
                          <p className="font-display text-sm font-black uppercase text-[#F4F0EB]">{e.name}</p>
                          <p className="text-[0.6rem] tracking-[0.2em] text-[#8A8A8A]">HP {e.hp} // ATK {e.attack}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-10 flex flex-wrap items-center justify-between gap-4 pt-6 border-t border-[rgba(244,240,235,0.1)]">
                  <div className="flex gap-6 text-xs">
                    <div>
                      <p className="text-[0.55rem] tracking-[0.3em] text-[#8A8A8A]">XP REWARD</p>
                      <p className="font-display text-xl font-black text-[#F5A623]">+{selected.xp_reward}</p>
                    </div>
                    <div>
                      <p className="text-[0.55rem] tracking-[0.3em] text-[#8A8A8A]">CREDITS</p>
                      <p className="font-display text-xl font-black text-[#F4F0EB]">+{selected.credit_reward}</p>
                    </div>
                  </div>

                  <button
                    onClick={deploy}
                    disabled={selected.locked}
                    className="btn-brutal"
                    data-testid="deploy-mission-btn"
                  >
                    {selected.locked
                      ? `LOCKED // LVL ${selected.min_level}`
                      : selected.completed
                      ? "REDEPLOY"
                      : "DEPLOY"}
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

                {err && <p className="mt-4 text-xs text-[#D11124]" data-testid="hub-error">{err}</p>}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

import { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api, formatApiError } from "@/lib/api";
import HUD from "@/components/HUD";
import { Sword, Shield, Sparkles, Package, Trophy, Skull, ArrowRight, X, Eye, Zap } from "lucide-react";

const COMBAT_BG = "https://static.prod-images.emergentagent.com/jobs/3b1c9518-5d7f-4467-adb8-43830b406907/images/b124b26f41f06a69f7b3cf45a8b09de14ad44e1504627a8f1cb7e229483be2ec.png";

const STATUS_VIZ = {
  bleed:  { sigil: "✚", color: "#E31230", label: "HEMORRAGIA" },
  burn:   { sigil: "✸", color: "#F5A623", label: "QUEIMADURA" },
  shock:  { sigil: "⟁", color: "#F4F0EB", label: "CHOQUE" },
  marked: { sigil: "⊕", color: "#E31230", label: "MARCADO" },
  frozen: { sigil: "❄", color: "#F4F0EB", label: "CONGELADO" },
};

const ELEMENT_COLOR = {
  kinetic: "#F4F0EB", void: "#E31230", psi: "#F5A623", amber: "#F5A623", rust: "#A80D1D",
};
const ELEMENT_LABEL = {
  kinetic: "CINÉTICO", void: "VAZIO", psi: "PSI", amber: "ÂMBAR", rust: "FERRUGEM",
};
const WEAKNESS_MAP = {
  kinetic: ["rust"], void: ["amber"], psi: ["kinetic"], amber: ["void"], rust: ["psi"],
};
const StatusBadge = ({ s }) => {
  const v = STATUS_VIZ[s.id] || { sigil: "●", color: "#8A8A8A", label: s.id.toUpperCase() };
  return (
    <span
      className="inline-flex items-center gap-1 px-1.5 py-0.5 border text-[0.55rem] tracking-[0.15em] font-mono font-bold"
      style={{ color: v.color, borderColor: v.color + "77" }}
      title={`${v.label} — ${s.dur}t`}
    >
      <span>{v.sigil}</span>
      <span>{v.label}</span>
      {s.stacks && s.stacks > 1 && <span className="opacity-70">×{s.stacks}</span>}
      <span className="opacity-70">{s.dur}t</span>
    </span>
  );
};

export default function Combat() {
  const { missionId } = useParams();
  const nav = useNavigate();
  const [session, setSession] = useState(null);
  const [character, setCharacter] = useState(null);
  const [mission, setMission] = useState(null);
  const [classData, setClassData] = useState(null);
  const [panel, setPanel] = useState(null); // "skill" | "item" | null
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [items, setItems] = useState({});
  const logRef = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        const [cur, ch, classes, itms] = await Promise.all([
          api.get("/game/combat/current"),
          api.get("/game/character"),
          api.get("/game/classes"),
          api.get("/game/items"),
        ]);
        setCharacter(ch.data);
        setItems(itms.data);
        setClassData(classes.data.find((c) => c.id === ch.data.class_id));
        if (cur.data) {
          setSession(cur.data);
          const ms = await api.get("/game/missions");
          setMission(ms.data.find((m) => m.id === cur.data.mission_id));
        } else {
          const start = await api.post("/game/combat/start", { mission_id: missionId });
          setSession(start.data.session);
          setCharacter(start.data.character);
          setMission(start.data.mission);
        }
      } catch (e) {
        setErr(formatApiError(e.response?.data?.detail));
      }
    })();
  }, [missionId]);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [session?.log?.length]);

  const doAction = async (payload) => {
    if (busy || !session || session.status !== "active") return;
    setBusy(true);
    setErr("");
    try {
      const { data } = await api.post("/game/combat/action", payload);
      setSession(data.session);
      setCharacter(data.character);
      setPanel(null);
    } catch (e) {
      setErr(formatApiError(e.response?.data?.detail));
    } finally {
      setBusy(false);
    }
  };

  if (!session || !character || !classData) {
    return <div className="min-h-screen flex items-center justify-center"><p className="font-display text-2xl grad-text-amber flicker">A ATIVAR LIGAÇÃO DE COMBATE</p></div>;
  }

  const activeEnemy = session.enemies.find((e) => e.alive);
  const status = session.status;
  const shieldPct = Math.min(100, (session.player_shield / character.max_hp) * 100);

  return (
    <div className="min-h-screen relative overflow-hidden" data-testid="combat-page">
      <div
        className="absolute inset-0 opacity-35"
        style={{ backgroundImage: `url(${COMBAT_BG})`, backgroundSize: "cover", backgroundPosition: "center" }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-[#050505]/60 via-[#050505]/90 to-[#050505]" />
      <div className="absolute inset-0 scanlines" />

      <div className="relative z-10">
        <HUD character={character} />

        <main className="max-w-[1400px] mx-auto px-3 sm:px-8 py-3 sm:py-8">
          {/* Mission header */}
          <div className="flex items-center justify-between flex-wrap gap-2 sm:gap-3 mb-4 sm:mb-6">
            <div className="min-w-0">
              <p className="text-[0.5rem] sm:text-[0.55rem] tracking-[0.3em] sm:tracking-[0.4em] text-[#E31230] font-bold">◆ EM COMBATE</p>
              <h2 className="font-display text-base sm:text-2xl font-black uppercase tracking-tight text-[#F4F0EB] truncate">
                {mission?.name}
              </h2>
            </div>
            <div className="text-right shrink-0">
              <p className="text-[0.5rem] sm:text-[0.55rem] tracking-[0.35em] text-[#8A8A8A]">RONDA</p>
              <p className="font-display text-xl sm:text-2xl font-black grad-text-amber">{String(session.turn).padStart(2, "0")}</p>
            </div>
          </div>

          <div className="grid lg:grid-cols-12 gap-3 sm:gap-6">
            {/* LEFT: Player card */}
            <div className="lg:col-span-4 panel hud-corners p-4 sm:p-5">
              <p className="text-[0.55rem] tracking-[0.4em] font-bold mb-2" style={{ color: classData.accent }}>
                ◆ OPERATIVO
              </p>
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-display text-xl font-black uppercase tracking-tight text-[#F4F0EB]">
                    {character.callsign}
                  </h3>
                  <p className="text-[0.65rem] tracking-[0.2em] text-[#8A8A8A] uppercase">
                    {classData.name} // NÍV {character.level}
                  </p>
                </div>
                <span className="text-4xl" style={{ color: classData.accent }}>{classData.sigil}</span>
              </div>

              {/* HP */}
              <div className="mt-6">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-[0.55rem] tracking-[0.3em] text-[#E31230] font-bold">VIDA</span>
                  <span className="font-mono text-[#F4F0EB]" data-testid="combat-player-hp">{character.hp}/{character.max_hp}</span>
                </div>
                <div className="bar-track">
                  <div className="bar-fill-hp" style={{ width: `${(character.hp / character.max_hp) * 100}%` }} />
                  <div className="bar-segments" />
                </div>
              </div>
              {/* Energy */}
              <div className="mt-3">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-[0.55rem] tracking-[0.3em] text-[#F5A623] font-bold">EN</span>
                  <span className="font-mono text-[#F4F0EB]" data-testid="combat-player-energy">{character.energy}/{character.max_energy}</span>
                </div>
                <div className="bar-track">
                  <div className="bar-fill-energy" style={{ width: `${(character.energy / character.max_energy) * 100}%` }} />
                  <div className="bar-segments" />
                </div>
              </div>
              {/* Shield */}
              {session.player_shield > 0 && (
                <div className="mt-3" data-testid="combat-player-shield">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-[0.55rem] tracking-[0.3em] text-[#F4F0EB] font-bold">ESCUDO</span>
                    <span className="font-mono text-[#F4F0EB]">+{session.player_shield}</span>
                  </div>
                  <div className="bar-track !h-[8px]">
                    <div className="bar-fill-shield" style={{ width: `${shieldPct}%` }} />
                  </div>
                </div>
              )}

              <div className="mt-6 grid grid-cols-2 gap-2 text-[0.6rem] tracking-[0.2em]">
                <div className="border border-[rgba(244,240,235,0.08)] p-2 text-center">
                  <p className="text-[#8A8A8A]">ATQ</p>
                  <p className="font-display text-lg font-black text-[#F4F0EB]">{character.attack}</p>
                </div>
                <div className="border border-[rgba(244,240,235,0.08)] p-2 text-center">
                  <p className="text-[#8A8A8A]">DEF</p>
                  <p className="font-display text-lg font-black text-[#F4F0EB]">{character.defense}</p>
                </div>
              </div>

              {/* Player statuses */}
              {session.player_statuses?.length > 0 && (
                <div className="mt-4" data-testid="player-statuses">
                  <p className="text-[0.55rem] tracking-[0.3em] text-[#F5A623] font-bold mb-2">◆ AFLIÇÕES</p>
                  <div className="flex flex-wrap gap-1.5">
                    {session.player_statuses.map((s, i) => <StatusBadge key={i} s={s} />)}
                  </div>
                </div>
              )}

              {/* Element affinity */}
              <div className="mt-4 pt-4 border-t border-[rgba(244,240,235,0.08)]">
                <p className="text-[0.55rem] tracking-[0.3em] text-[#8A8A8A] font-bold mb-1">AFINIDADE</p>
                <span
                  className="inline-block px-2 py-1 text-[0.6rem] tracking-[0.2em] font-mono font-bold uppercase border"
                  style={{ color: ELEMENT_COLOR[classData.element], borderColor: ELEMENT_COLOR[classData.element] + "77" }}
                >
                  {ELEMENT_LABEL[classData.element] || classData.element} // FORTE VS {(WEAKNESS_MAP[classData.element] || []).map(e => ELEMENT_LABEL[e] || e).join(", ") || "—"}
                </span>
              </div>
            </div>

            {/* CENTER: Enemies + Log */}
            <div className="lg:col-span-5 space-y-3 sm:space-y-6">
              <div className="space-y-3">
                {session.enemies.map((e, i) => (
                  <div
                    key={i}
                    className={`panel p-3 sm:p-5 transition-all ${e.alive ? "!border-[#E31230]" : "opacity-40 grayscale"} ${e === activeEnemy ? "pulse-alert" : ""}`}
                    data-testid={`combat-enemy-${i}`}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-3">
                        <Skull className="w-5 h-5 text-[#E31230]" />
                        <div>
                          <p className="font-display text-lg font-black uppercase text-[#F4F0EB]">
                            {e.name}
                          </p>
                          <p className="text-[0.55rem] tracking-[0.3em] text-[#8A8A8A]">
                            ATQ {e.attack} // DEF {e.defense}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-3xl text-[#E31230]">{e.sigil || "⌖"}</span>
                        {e.element && (
                          <span
                            className="px-1.5 py-0.5 text-[0.5rem] tracking-[0.2em] font-mono font-bold uppercase border"
                            style={{ color: ELEMENT_COLOR[e.element], borderColor: ELEMENT_COLOR[e.element] + "77" }}
                          >
                            {ELEMENT_LABEL[e.element] || e.element}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="bar-track">
                      <div className="bar-fill-hp" style={{ width: e.alive ? `${(e.hp / e.max_hp) * 100}%` : "0%" }} />
                      <div className="bar-segments" />
                    </div>
                    <div className="mt-1 flex items-center justify-between">
                      <div className="flex flex-wrap gap-1">
                        {(e.statuses || []).map((s, si) => <StatusBadge key={si} s={s} />)}
                      </div>
                      <p className="text-[0.6rem] tracking-[0.25em] text-[#8A8A8A] font-mono" data-testid={`combat-enemy-${i}-hp`}>
                        {e.hp}/{e.max_hp} {!e.alive && "// NEUTRALIZADO"}
                      </p>
                    </div>
                    {/* Intent telegraph */}
                    {e.alive && e.next_intent && (
                      <div className="mt-3 pt-3 border-t border-[rgba(209,17,36,0.2)] flex items-start gap-2" data-testid={`combat-enemy-${i}-intent`}>
                        <Eye className="w-3 h-3 text-[#F5A623] mt-0.5 shrink-0" />
                        <div className="flex-1">
                          <p className="text-[0.55rem] tracking-[0.3em] text-[#F5A623] font-bold">
                            PRÓX // {e.next_intent.name}
                          </p>
                          <p className="text-[0.65rem] text-[#8A8A8A] italic">
                            {e.next_intent.telegraph}
                            {e.next_intent.kind === "damage" && (
                              <span className="ml-1 text-[#E31230] font-mono not-italic">~{e.next_intent.power} {ELEMENT_LABEL[e.next_intent.element] || e.next_intent.element?.toUpperCase()}</span>
                            )}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Battle log */}
              <div className="panel p-4">
                <p className="text-[0.55rem] tracking-[0.4em] text-[#F5A623] font-bold mb-3">◆ REGISTO</p>
                <div ref={logRef} className="h-40 overflow-y-auto font-mono text-xs space-y-1 pr-2" data-testid="combat-log">
                  {session.log.map((line, i) => (
                    <p key={i} className="text-[#F4F0EB]/85 leading-relaxed">{line}</p>
                  ))}
                </div>
              </div>
            </div>

            {/* RIGHT: Actions */}
            <div className="lg:col-span-3 panel hud-corners p-4 sm:p-5 relative">
              <p className="text-[0.55rem] tracking-[0.4em] text-[#E31230] font-bold mb-4">◆ COMANDO</p>

              {status === "active" && !panel && (
                <div className="space-y-2" data-testid="action-panel">
                  <button onClick={() => doAction({ action: "attack" })} disabled={busy} className="btn-brutal w-full justify-start" data-testid="action-attack">
                    <Sword className="w-4 h-4" /> ATACAR
                  </button>
                  <button onClick={() => setPanel("skill")} disabled={busy} className="btn-ghost w-full justify-start flex items-center gap-2" data-testid="action-skill">
                    <Sparkles className="w-4 h-4" /> PERÍCIA
                  </button>
                  <button onClick={() => doAction({ action: "defend" })} disabled={busy} className="btn-ghost w-full justify-start flex items-center gap-2" data-testid="action-defend">
                    <Shield className="w-4 h-4" /> DEFENDER
                  </button>
                  <button onClick={() => setPanel("item")} disabled={busy || !character.inventory?.length} className="btn-ghost w-full justify-start flex items-center gap-2" data-testid="action-item">
                    <Package className="w-4 h-4" /> ITEM
                  </button>
                </div>
              )}

              {status === "active" && panel === "skill" && (
                <div className="space-y-2" data-testid="skill-panel">
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-[0.55rem] tracking-[0.3em] text-[#F5A623] font-bold">ESCOLHE PERÍCIA</p>
                    <button onClick={() => setPanel(null)} className="text-[#8A8A8A] hover:text-[#E31230]" data-testid="close-skill-panel"><X className="w-4 h-4" /></button>
                  </div>
                  {classData.skills.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => doAction({ action: "skill", skill_id: s.id })}
                      disabled={busy || character.energy < s.cost}
                      className="w-full text-left p-3 border border-[rgba(244,240,235,0.12)] hover:border-[#F5A623] disabled:opacity-30 transition"
                      data-testid={`skill-${s.id}`}
                    >
                      <div className="flex justify-between items-start">
                        <p className="font-display text-xs font-black uppercase tracking-tight text-[#F4F0EB]">{s.name}</p>
                        <span className="text-[0.55rem] tracking-[0.2em] text-[#F5A623] font-mono">{s.cost}EN</span>
                      </div>
                      <p className="text-[0.6rem] text-[#8A8A8A] mt-1">{s.desc}</p>
                    </button>
                  ))}
                </div>
              )}

              {status === "active" && panel === "item" && (
                <div className="space-y-2" data-testid="item-panel">
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-[0.55rem] tracking-[0.3em] text-[#F5A623] font-bold">ESCOLHE ITEM</p>
                    <button onClick={() => setPanel(null)} className="text-[#8A8A8A] hover:text-[#E31230]" data-testid="close-item-panel"><X className="w-4 h-4" /></button>
                  </div>
                  {character.inventory.length === 0 && (
                    <p className="text-xs text-[#8A8A8A]">INVENTÁRIO VAZIO</p>
                  )}
                  {character.inventory.map((entry) => {
                    const it = items[entry.item_id];
                    if (!it) return null;
                    return (
                      <button
                        key={entry.item_id}
                        onClick={() => doAction({ action: "item", item_id: entry.item_id })}
                        disabled={busy || entry.qty <= 0}
                        className="w-full text-left p-3 border border-[rgba(244,240,235,0.12)] hover:border-[#F5A623] disabled:opacity-30 transition"
                        data-testid={`item-${entry.item_id}`}
                      >
                        <div className="flex justify-between items-start">
                          <p className="font-display text-xs font-black uppercase tracking-tight text-[#F4F0EB]">{it.name}</p>
                          <span className="text-[0.55rem] tracking-[0.2em] text-[#F5A623] font-mono">×{entry.qty}</span>
                        </div>
                        <p className="text-[0.6rem] text-[#8A8A8A] mt-1">{it.desc}</p>
                      </button>
                    );
                  })}
                </div>
              )}

              {status === "victory" && (
                <div className="space-y-4" data-testid="victory-panel">
                  <Trophy className="w-10 h-10 text-[#F5A623]" />
                  <p className="font-display text-3xl font-black uppercase grad-text-amber">VITÓRIA</p>
                  <p className="text-xs text-[#8A8A8A] leading-relaxed italic">"{mission?.epilogue}"</p>
                  <button onClick={() => nav("/hub")} className="btn-brutal w-full" data-testid="return-hub-btn">
                    VOLTAR AO HUB <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}

              {status === "defeat" && (
                <div className="space-y-4" data-testid="defeat-panel">
                  <Skull className="w-10 h-10 text-[#E31230]" />
                  <p className="font-display text-3xl font-black uppercase grad-text-red">DERROTA</p>
                  <p className="text-xs text-[#8A8A8A] leading-relaxed">A estática levou-te. Descansa, recompõe-te. A galáxia ainda espera.</p>
                  <button
                    onClick={async () => { await api.post("/game/character/rest"); nav("/hub"); }}
                    className="btn-brutal w-full" data-testid="retry-hub-btn"
                  >
                    DESCANSAR E VOLTAR <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}

              {err && <p className="mt-4 text-xs text-[#E31230]" data-testid="combat-error">{err}</p>}

              {/* Tactical readout — fills empty space below commands */}
              {status === "active" && activeEnemy && (
                <div className="mt-6 pt-5 border-t border-[rgba(244,240,235,0.08)]" data-testid="tactical-readout">
                  <p className="text-[0.55rem] tracking-[0.4em] text-[#F5A623] font-bold mb-3">◆ LEITURA TÁTICA</p>
                  <dl className="space-y-2 text-[0.65rem] font-mono">
                    <div className="flex justify-between items-center">
                      <dt className="text-[#8A8A8A] tracking-[0.2em] uppercase">Alvo</dt>
                      <dd className="text-[#F4F0EB]">{activeEnemy.name}</dd>
                    </div>
                    <div className="flex justify-between items-center">
                      <dt className="text-[#8A8A8A] tracking-[0.2em] uppercase">Elemento</dt>
                      <dd style={{ color: ELEMENT_COLOR[activeEnemy.element] }}>
                        {ELEMENT_LABEL[activeEnemy.element] || activeEnemy.element?.toUpperCase()}
                      </dd>
                    </div>
                    <div className="flex justify-between items-center">
                      <dt className="text-[#8A8A8A] tracking-[0.2em] uppercase">Tua Afinidade</dt>
                      <dd
                        className={(WEAKNESS_MAP[classData.element] || []).includes(activeEnemy.element) ? "text-[#F5A623] font-bold" : "text-[#F4F0EB]"}
                      >
                        {(WEAKNESS_MAP[classData.element] || []).includes(activeEnemy.element) ? "◈ FRACO → +30%" : "◇ NEUTRO"}
                      </dd>
                    </div>
                    <div className="flex justify-between items-center">
                      <dt className="text-[#8A8A8A] tracking-[0.2em] uppercase">Fraco a</dt>
                      <dd style={{ color: ELEMENT_COLOR[Object.keys(WEAKNESS_MAP).find(k => (WEAKNESS_MAP[k] || []).includes(activeEnemy.element)) || "kinetic"] }}>
                        {ELEMENT_LABEL[Object.keys(WEAKNESS_MAP).find(k => (WEAKNESS_MAP[k] || []).includes(activeEnemy.element))] || "—"}
                      </dd>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-[rgba(244,240,235,0.05)]">
                      <dt className="text-[#8A8A8A] tracking-[0.2em] uppercase">Ronda</dt>
                      <dd className="text-[#F5A623] font-bold">{String(session.turn).padStart(2, "0")}</dd>
                    </div>
                    {character.hp <= character.max_hp * 0.4 && (
                      <div className="mt-3 p-2 border border-[#E31230]/50 bg-[rgba(209,17,36,0.08)]">
                        <p className="text-[0.55rem] tracking-[0.3em] text-[#E31230] font-bold">◆ AVISO — VIDA BAIXA</p>
                        <p className="text-[0.65rem] text-[#8A8A8A] mt-1">Considera ITEM ou perícia de cura.</p>
                      </div>
                    )}
                  </dl>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

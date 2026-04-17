import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, formatApiError } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import HUD from "@/components/HUD";
import { ArrowRight, Heart, Zap, Sword, Shield } from "lucide-react";

export default function CharacterForge() {
  const { user, loadMe } = useAuth();
  const nav = useNavigate();
  const [classes, setClasses] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get("/game/classes");
        setClasses(data);
        setSelected(data[0]);
      } catch (e) {
        setErr(formatApiError(e.response?.data?.detail));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const confirm = async () => {
    if (!selected) return;
    setSubmitting(true);
    setErr("");
    try {
      await api.post("/game/character", { class_id: selected.id });
      await loadMe();
      nav("/hub");
    } catch (e) {
      setErr(formatApiError(e.response?.data?.detail));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="font-display text-2xl grad-text-amber flicker">A FORJAR DISCIPLINA</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen" data-testid="character-forge-page">
      <HUD minimal />
      <main className="max-w-[1400px] mx-auto px-4 sm:px-8 py-10 sm:py-16">
        <div className="glitch-in mb-12">
          <p className="text-[0.6rem] tracking-[0.5em] text-[#E31230] font-bold mb-4">
            ◆ PROTOCOLO DE INICIAÇÃO — {user?.callsign?.toUpperCase()}
          </p>
          <h1 className="font-display text-4xl sm:text-6xl font-black uppercase tracking-tighter text-[#F4F0EB] leading-[0.95]">
            Escolhe o silêncio
            <br />
            <span className="grad-text-amber">que deixas para trás.</span>
          </h1>
          <p className="mt-6 max-w-2xl text-sm text-[#8A8A8A] leading-relaxed">
            Três disciplinas sobreviveram ao colapso. Cada uma acaba vidas numa linguagem diferente. Escolhe a tua. É permanente — a galáxia não perdoa segundas versões.
          </p>
        </div>

        <div className="grid lg:grid-cols-12 gap-6">
          {/* Class list */}
          <div className="lg:col-span-4 space-y-3">
            {classes.map((c, i) => (
              <button
                key={c.id}
                onClick={() => setSelected(c)}
                className={`w-full text-left p-5 panel transition-all hud-corners group glitch-in delay-${i + 1}
                  ${selected?.id === c.id
                    ? "!border-[#F5A623] bg-[rgba(245,166,35,0.06)]"
                    : "hover:!border-[rgba(245,166,35,0.4)]"}`}
                data-testid={`class-card-${c.id}`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[0.55rem] tracking-[0.35em] font-bold" style={{ color: c.accent }}>
                      {c.role}
                    </p>
                    <h3 className="font-display text-xl sm:text-2xl font-black uppercase tracking-tight text-[#F4F0EB] mt-1">
                      {c.name}
                    </h3>
                    <p className="text-[0.65rem] tracking-[0.2em] text-[#8A8A8A] mt-1 uppercase">{c.codename}</p>
                  </div>
                  <span className="text-3xl" style={{ color: c.accent }}>{c.sigil}</span>
                </div>
                <div className="mt-4 flex gap-4 text-[0.6rem] tracking-[0.15em] text-[#8A8A8A]">
                  <span>VIDA <strong className="text-[#F4F0EB] font-mono">{c.base_hp}</strong></span>
                  <span>EN <strong className="text-[#F4F0EB] font-mono">{c.base_energy}</strong></span>
                  <span>ATQ <strong className="text-[#F4F0EB] font-mono">{c.base_attack}</strong></span>
                  <span>DEF <strong className="text-[#F4F0EB] font-mono">{c.base_defense}</strong></span>
                </div>
              </button>
            ))}
          </div>

          {/* Detail panel */}
          {selected && (
            <div className="lg:col-span-8 panel hud-corners p-6 sm:p-10 glitch-in delay-2" data-testid="class-detail">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[0.6rem] tracking-[0.4em] font-bold mb-2" style={{ color: selected.accent }}>
                    ◆ DOSSIÊ // {selected.role}
                  </p>
                  <h2 className="font-display text-4xl sm:text-5xl font-black uppercase tracking-tighter text-[#F4F0EB]">
                    {selected.name}
                  </h2>
                  <p className="text-sm text-[#8A8A8A] mt-2 tracking-wide">{selected.codename}</p>
                </div>
                <span className="text-6xl sm:text-8xl leading-none" style={{ color: selected.accent }}>
                  {selected.sigil}
                </span>
              </div>

              <p className="mt-8 text-sm leading-relaxed text-[#F4F0EB]/90 italic border-l-2 pl-4" style={{ borderColor: selected.accent }}>
                "{selected.lore}"
              </p>

              {/* Stats */}
              <div className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { icon: Heart, label: "VIDA", val: selected.base_hp, color: "#E31230" },
                  { icon: Zap, label: "CARGA", val: selected.base_energy, color: "#F5A623" },
                  { icon: Sword, label: "GOLPE", val: selected.base_attack, color: "#F4F0EB" },
                  { icon: Shield, label: "GUARDA", val: selected.base_defense, color: "#8A8A8A" },
                ].map((s) => (
                  <div key={s.label} className="border border-[rgba(244,240,235,0.1)] p-4">
                    <s.icon className="w-4 h-4 mb-2" style={{ color: s.color }} />
                    <p className="text-[0.55rem] tracking-[0.3em] text-[#8A8A8A] font-bold">{s.label}</p>
                    <p className="font-display text-2xl font-black text-[#F4F0EB] mt-1">{s.val}</p>
                  </div>
                ))}
              </div>

              {/* Skills */}
              <div className="mt-10">
                <p className="text-[0.6rem] tracking-[0.4em] text-[#F5A623] font-bold mb-4">◆ ARSENAL DE PERÍCIAS</p>
                <div className="grid sm:grid-cols-2 gap-3">
                  {selected.skills.map((s) => (
                    <div key={s.id} className="border border-[rgba(209,17,36,0.2)] p-4 hover:border-[#F5A623]/50 transition" data-testid={`skill-preview-${s.id}`}>
                      <div className="flex justify-between items-start">
                        <p className="font-display text-sm font-black uppercase tracking-tight text-[#F4F0EB]">{s.name}</p>
                        <span className="text-[0.55rem] tracking-[0.2em] text-[#F5A623] font-mono">{s.cost} EN</span>
                      </div>
                      <p className="text-[0.7rem] text-[#8A8A8A] mt-1">{s.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              {err && (
                <p className="mt-6 text-xs text-[#E31230]" data-testid="forge-error">{err}</p>
              )}

              <div className="mt-10 flex justify-end">
                <button
                  onClick={confirm}
                  disabled={submitting}
                  className="btn-brutal"
                  data-testid="confirm-class-btn"
                >
                  {submitting ? "A SELAR…" : "SELAR ESTE EXÍLIO"} <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

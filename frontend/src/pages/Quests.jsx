import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, formatApiError } from "@/lib/api";
import HUD from "@/components/HUD";
import { Scroll, Lock, CheckCircle2, Play } from "lucide-react";

export default function Quests() {
  const nav = useNavigate();
  const [character, setCharacter] = useState(null);
  const [quests, setQuests] = useState([]);
  const [active, setActive] = useState(null); // full quest object
  const [log, setLog] = useState([]);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const load = async () => {
    try {
      const [c, q] = await Promise.all([api.get("/game/character"), api.get("/game/quests")]);
      setCharacter(c.data); setQuests(q.data);
    } catch (e) { setErr(formatApiError(e.response?.data?.detail)); }
  };
  useEffect(() => { load(); }, []);

  const startQuest = async (q) => {
    setBusy(true); setErr("");
    try {
      await api.post("/game/quest/start", { quest_id: q.id });
      await load();
      // refresh active quest with current_dialog
      const { data } = await api.get("/game/quests");
      const fresh = data.find((x) => x.id === q.id);
      setActive(fresh);
    } catch (e) { setErr(formatApiError(e.response?.data?.detail)); }
    finally { setBusy(false); }
  };

  const openQuest = (q) => setActive(q);

  const chooseDialog = async (dialogId, choiceIdx) => {
    if (!active) return;
    setBusy(true); setErr("");
    try {
      const { data } = await api.post("/game/quest/choose", {
        quest_id: active.id, dialog_id: dialogId, choice_index: choiceIdx,
      });
      if (data.lines) setLog((l) => [...data.lines, ...l].slice(0, 25));
      if (data.character) setCharacter(data.character);
      if (data.ended) {
        await load();
        setActive(null);
      } else if (data.next_dialog) {
        const fresh = await api.get("/game/quests");
        setQuests(fresh.data);
        const upd = fresh.data.find((x) => x.id === active.id);
        setActive(upd);
      }
    } catch (e) { setErr(formatApiError(e.response?.data?.detail)); }
    finally { setBusy(false); }
  };

  if (!character) return <div className="min-h-screen flex items-center justify-center"><p className="font-display text-2xl grad-text-amber flicker">A CARREGAR JURAMENTOS</p></div>;

  const currentDialog = active?.dialogs?.find((d) => d.id === active.current_dialog);

  return (
    <div className="min-h-screen" data-testid="quests-page">
      <HUD character={character} />
      <main className="max-w-[1400px] mx-auto px-3 sm:px-8 py-4 sm:py-8">
        <div className="mb-5 sm:mb-10 glitch-in">
          <p className="text-[0.55rem] sm:text-[0.6rem] tracking-[0.4em] sm:tracking-[0.5em] text-[#E31230] font-bold mb-2 sm:mb-3">◆ CONTRATOS ABERTOS</p>
          <h1 className="font-display text-2xl sm:text-5xl font-black uppercase tracking-tighter text-[#F4F0EB] leading-[1]">
            Promete. <span className="grad-text-red">Cumpre.</span> <span className="text-[#F4F0EB]/50">Ou não.</span>
          </h1>
        </div>

        <div className="grid lg:grid-cols-12 gap-3 sm:gap-6">
          <div className="lg:col-span-5 space-y-2">
            {quests.map((q, i) => (
              <button key={q.id} onClick={() => q.state !== "locked" && openQuest(q)}
                className={`panel hud-corners p-4 w-full text-left transition-all glitch-in delay-${i + 1}
                  ${q.state === "locked" ? "opacity-40 cursor-not-allowed" : ""}
                  ${active?.id === q.id ? "!border-[#FF1E3C]" : "hover:!border-[#FF1E3C]/50"}`}
                data-testid={`quest-${q.id}`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {q.state === "locked" && <Lock className="w-4 h-4 text-[#8A8A8A]" />}
                    {q.state === "completed" && <CheckCircle2 className="w-4 h-4 text-[#F5A623]" />}
                    {q.state === "active" && <Play className="w-4 h-4 text-[#FF1E3C] flicker" />}
                    {q.state === "available" && <Scroll className="w-4 h-4 text-[#F4F0EB]" />}
                    <p className="font-display text-sm font-black uppercase text-[#F4F0EB]">{q.name}</p>
                  </div>
                  <span className="text-[0.55rem] tracking-[0.3em] font-bold" style={{
                    color: q.state === "active" ? "#FF1E3C" : q.state === "completed" ? "#F5A623" : q.state === "available" ? "#F4F0EB" : "#555",
                  }}>{q.state.toUpperCase()}</span>
                </div>
                <p className="text-[0.65rem] text-[#8A8A8A] italic">{q.brief}</p>
                <p className="text-[0.55rem] tracking-[0.3em] text-[#F5A623] mt-2">
                  + {q.xp_reward} XP // + {q.credit_reward} CR
                </p>
              </button>
            ))}
          </div>

          <div className="lg:col-span-7 space-y-3">
            {!active && (
              <div className="panel hud-corners p-6 text-center" data-testid="no-quest">
                <p className="font-display text-sm text-[#8A8A8A] uppercase tracking-[0.3em]">Seleciona um contrato à esquerda</p>
              </div>
            )}
            {active && (
              <div className="panel hud-corners p-4 sm:p-6" data-testid={`active-${active.id}`}>
                <p className="text-[0.55rem] tracking-[0.3em] text-[#E31230] font-bold">{active.giver}</p>
                <h2 className="font-display text-xl sm:text-3xl font-black uppercase text-[#F4F0EB] mt-1">{active.name}</h2>
                <p className="text-xs text-[#8A8A8A] mt-2 italic">{active.brief}</p>

                {active.state === "available" && (
                  <button onClick={() => startQuest(active)} disabled={busy} className="btn-brutal w-full mt-6" data-testid="quest-start">
                    ACEITAR CONTRATO
                  </button>
                )}

                {active.state === "active" && currentDialog && (
                  <div className="mt-6 space-y-4">
                    <div className="p-4 border-l-2 border-[#F5A623] bg-[rgba(245,166,35,0.04)]">
                      <p className="text-sm text-[#F4F0EB] leading-relaxed italic">"{currentDialog.text}"</p>
                    </div>
                    {currentDialog.end ? (
                      <button onClick={() => chooseDialog(currentDialog.id, 0)} disabled={busy} className="btn-brutal w-full" data-testid="dialog-close">
                        CONFIRMAR
                      </button>
                    ) : (
                      (currentDialog.choices || []).map((c, i) => (
                        <button key={i} onClick={() => chooseDialog(currentDialog.id, i)} disabled={busy}
                          className="w-full text-left p-3 border border-[rgba(244,240,235,0.15)] hover:border-[#FF1E3C] hover:bg-[rgba(227,18,48,0.06)] transition"
                          data-testid={`dialog-choice-${i}`}>
                          <p className="font-display text-[0.7rem] font-black uppercase tracking-wide text-[#F4F0EB]">{c.label}</p>
                        </button>
                      ))
                    )}
                  </div>
                )}

                {active.state === "completed" && (
                  <p className="mt-6 text-sm text-[#F5A623] tracking-[0.2em] font-bold">◆ CONTRATO CUMPRIDO</p>
                )}
              </div>
            )}

            <div className="panel p-3 sm:p-4" data-testid="quests-log">
              <p className="text-[0.55rem] tracking-[0.3em] text-[#F5A623] font-bold mb-2">◆ REGISTO</p>
              <div className="h-32 overflow-y-auto font-mono text-xs space-y-1">
                {log.length === 0 && <p className="text-[#555] italic">Sem movimento.</p>}
                {log.map((l, i) => <p key={i} className="text-[#F4F0EB]/85">{l}</p>)}
              </div>
            </div>

            <button onClick={() => nav("/hub")} className="btn-ghost w-full" data-testid="quests-back-hub">← VOLTAR AO HUB</button>
            {err && <p className="text-xs text-[#E31230]" data-testid="quests-error">{err}</p>}
          </div>
        </div>
      </main>
    </div>
  );
}

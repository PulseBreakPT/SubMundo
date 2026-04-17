import { useEffect, useState, useRef, useCallback } from "react";
import { api, formatApiError } from "@/lib/api";
import HUD from "@/components/HUD";
import { BookOpen, Pickaxe, Infinity as InfinityIcon } from "lucide-react";

const TAG_COLOR = {
  exile: "#E31230", collapse: "#F5A623", rust: "#A80D1D", amber: "#F5A623",
  "zero-line": "#F4F0EB", directorate: "#F4F0EB", witch: "#F5A623",
  prince: "#E31230", static: "#F4F0EB", naming: "#E31230",
};

export default function Lore() {
  const [character, setCharacter] = useState(null);
  const [fragments, setFragments] = useState([]);
  const [offset, setOffset] = useState(0);
  const [unlocked, setUnlocked] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [digging, setDigging] = useState(false);
  const [err, setErr] = useState("");
  const sentinelRef = useRef(null);

  const loadPage = useCallback(async (from = 0) => {
    if (loading) return;
    setLoading(true); setErr("");
    try {
      const { data } = await api.get(`/game/lore?offset=${from}&limit=6`);
      setFragments((prev) => from === 0 ? data.items : [...prev, ...data.items]);
      setOffset(from + data.items.length);
      setUnlocked(data.unlocked);
      setHasMore(data.has_more);
    } catch (e) { setErr(formatApiError(e.response?.data?.detail)); }
    finally { setLoading(false); }
  }, [loading]);

  const loadChar = async () => {
    try {
      const { data } = await api.get("/game/character");
      setCharacter(data);
    } catch (_) {}
  };

  useEffect(() => { loadChar(); loadPage(0); }, []);

  // Infinite scroll
  useEffect(() => {
    if (!sentinelRef.current) return;
    const obs = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore && !loading) loadPage(offset);
    }, { threshold: 0.1 });
    obs.observe(sentinelRef.current);
    return () => obs.disconnect();
  }, [offset, hasMore, loading, loadPage]);

  const excavate = async () => {
    setDigging(true); setErr("");
    try {
      const { data } = await api.post("/game/lore/excavate");
      setFragments((prev) => [...prev, data.fragment]);
      setUnlocked(data.unlocked);
      setHasMore(false);
      // refresh character for credits
      loadChar();
    } catch (e) { setErr(formatApiError(e.response?.data?.detail)); }
    finally { setDigging(false); }
  };

  return (
    <div className="min-h-screen" data-testid="lore-page">
      <HUD character={character} />
      <main className="max-w-[1200px] mx-auto px-3 sm:px-8 py-4 sm:py-8">
        <div className="mb-6 sm:mb-10 glitch-in flex flex-col md:flex-row md:items-end md:justify-between gap-4 sm:gap-6">
          <div>
            <p className="text-[0.55rem] sm:text-[0.6rem] tracking-[0.4em] sm:tracking-[0.5em] text-[#E31230] font-bold mb-2 sm:mb-3 flex items-center gap-2">
              <InfinityIcon className="w-3 h-3" /> CÓDEX INFINITO
            </p>
            <h1 className="font-display text-2xl sm:text-5xl font-black uppercase tracking-tighter text-[#F4F0EB] leading-[1]">
              Cada nome deixa
              <br />
              <span className="grad-text-amber">um rasto de papel.</span>
            </h1>
            <p className="mt-3 sm:mt-4 max-w-2xl text-xs sm:text-sm text-[#8A8A8A] leading-relaxed">
              A galáxia escreve mais depressa do que alguém consegue ler. {unlocked.toLocaleString()} entradas catalogadas.
            </p>
          </div>

          <div className="panel p-4 sm:p-5 hud-corners w-full md:min-w-[280px] md:w-auto">
            <p className="text-[0.55rem] tracking-[0.4em] text-[#F5A623] font-bold">◆ ESCAVAÇÃO</p>
            <p className="text-[0.6rem] sm:text-[0.65rem] text-[#8A8A8A] mt-1 mb-2 sm:mb-3">Gasta 20 CR. Desenterra um novo fragmento. Para sempre.</p>
            <button onClick={excavate} disabled={digging || !character || (character?.credits || 0) < 20} className="btn-brutal w-full" data-testid="excavate-btn">
              <Pickaxe className="w-4 h-4" />
              {digging ? "A ESCAVAR…" : "ESCAVAR (20 CR)"}
            </button>
          </div>
        </div>

        {/* Feed */}
        <div className="space-y-3 sm:space-y-4">
          {fragments.map((f, i) => (
            <article
              key={f.id}
              className={`panel p-4 sm:p-6 hud-corners glitch-in relative overflow-hidden`}
              style={{ animationDelay: `${(i % 6) * 80}ms` }}
              data-testid={`lore-${f.id}`}
            >
              <div className="absolute top-0 left-0 w-1 h-full" style={{ background: i % 3 === 0 ? "#E31230" : i % 3 === 1 ? "#F5A623" : "#F4F0EB" }} />
              <div className="flex items-start justify-between gap-4 mb-3 pl-2">
                <div>
                  <p className="text-[0.55rem] tracking-[0.4em] text-[#F5A623] font-bold">◆ {f.kind} // {f.id}</p>
                  <h3 className="font-display text-xl sm:text-2xl font-black uppercase tracking-tight text-[#F4F0EB] mt-1">{f.subject}</h3>
                  <p className="text-[0.65rem] tracking-[0.2em] text-[#8A8A8A] uppercase">{f.place} // {f.era}</p>
                </div>
                <BookOpen className="w-4 h-4 text-[#E31230] shrink-0" />
              </div>
              <p className="text-sm leading-relaxed text-[#F4F0EB]/90 italic border-l-2 border-[#E31230] pl-4 pr-2 py-1 ml-2">
                "{f.body}"
              </p>
              <div className="mt-4 flex flex-wrap gap-2 pl-2">
                {f.tags.map((t) => (
                  <span
                    key={t}
                    className="text-[0.55rem] tracking-[0.3em] font-bold px-2 py-1 border uppercase"
                    style={{ color: TAG_COLOR[t] || "#8A8A8A", borderColor: (TAG_COLOR[t] || "#8A8A8A") + "55" }}
                  >
                    #{t}
                  </span>
                ))}
              </div>
            </article>
          ))}

          <div ref={sentinelRef} className="h-10 flex items-center justify-center">
            {loading && <p className="text-[0.6rem] tracking-[0.3em] text-[#F5A623] flicker">A ESCAVAR MAIS FUNDO…</p>}
            {!hasMore && !loading && (
              <p className="text-[0.6rem] tracking-[0.3em] text-[#8A8A8A] text-center">
                ◆ FIM DA ESTÁTICA CONHECIDA — ESCAVA PARA ENCONTRAR MAIS
              </p>
            )}
          </div>
        </div>

        {err && <p className="mt-4 text-xs text-[#E31230]" data-testid="lore-error">{err}</p>}
      </main>
    </div>
  );
}

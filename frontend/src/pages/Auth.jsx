import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { ArrowRight, AlertTriangle } from "lucide-react";

export default function Auth() {
  const { login, register, user } = useAuth();
  const [params] = useSearchParams();
  const nav = useNavigate();
  const [mode, setMode] = useState(params.get("mode") === "register" ? "register" : "login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [callsign, setCallsign] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (user && user !== false) {
      nav(user.has_character ? "/hub" : "/forge");
    }
  }, [user, nav]);

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    setLoading(true);
    try {
      if (mode === "register") {
        const u = await register(email, password, callsign);
        nav(u.has_character ? "/hub" : "/forge");
      } else {
        const u = await login(email, password);
        nav(u.has_character ? "/hub" : "/forge");
      }
    } catch (e) {
      setErr(e.message || "Transmission failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center px-3 sm:px-4 py-8 sm:py-12" data-testid="auth-page">
      {/* Background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,#D1112422,transparent_60%),radial-gradient(ellipse_at_bottom,#F5A62322,transparent_60%)]" />
      <div className="absolute inset-0 scanlines" />
      <div className="absolute top-6 left-6 z-10">
        <Link to="/" className="flex items-center gap-3 group" data-testid="auth-home-link">
          <span className="text-[#D11124] text-2xl font-black group-hover:text-[#F5A623] transition">◈</span>
          <p className="font-display text-xs font-black tracking-[0.3em] text-[#F4F0EB]">
            AETHER<span className="text-[#D11124]">//</span>EXILE
          </p>
        </Link>
      </div>

      <div className="relative z-10 w-full max-w-md glitch-in">
        <div className="panel panel-amber hud-corners p-5 sm:p-10">
          <p className="text-[0.6rem] tracking-[0.5em] text-[#F5A623] font-bold mb-4">
            ◆ CANAL SEGURO — {mode === "register" ? "NOVO EXILADO" : "RETOMAR SINAL"}
          </p>
          <h1 className="font-display text-3xl sm:text-4xl font-black uppercase tracking-tight text-[#F4F0EB] mb-2">
            {mode === "register" ? "Assina o teu " : "Volta ao teu "}
            <span className="grad-text-red">{mode === "register" ? "nome" : "exílio"}</span>
          </h1>
          <p className="text-xs text-[#8A8A8A] mb-8 leading-relaxed">
            {mode === "register"
              ? "O Directorate exige uma identidade. Escolhe bem — sobrevive ao colapso."
              : "Introduz a tua cifra. A galáxia ainda se lembra de ti."}
          </p>

          <form onSubmit={submit} className="space-y-2">
            {mode === "register" && (
              <div className="border border-[rgba(244,240,235,0.1)] focus-within:border-[#F5A623]">
                <label className="block px-4 pt-3 text-[0.55rem] tracking-[0.3em] text-[#D11124] font-bold">
                  ALCUNHA
                </label>
                <input
                  type="text"
                  value={callsign}
                  onChange={(e) => setCallsign(e.target.value)}
                  required
                  minLength={2}
                  maxLength={24}
                  className="input-brutal !border-none"
                  placeholder="Inserir identificador"
                  data-testid="auth-callsign-input"
                />
              </div>
            )}
            <div className="border border-[rgba(244,240,235,0.1)] focus-within:border-[#F5A623]">
              <label className="block px-4 pt-3 text-[0.55rem] tracking-[0.3em] text-[#D11124] font-bold">
                EMAIL DE TRANSMISSÃO
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="input-brutal !border-none"
                placeholder="ancora@frequencia"
                data-testid="auth-email-input"
              />
            </div>
            <div className="border border-[rgba(244,240,235,0.1)] focus-within:border-[#F5A623]">
              <label className="block px-4 pt-3 text-[0.55rem] tracking-[0.3em] text-[#D11124] font-bold">
                CHAVE CIFRA
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="input-brutal !border-none"
                placeholder="••••••••"
                data-testid="auth-password-input"
              />
            </div>

            {err && (
              <div
                className="mt-4 p-3 border border-[#D11124] bg-[rgba(209,17,36,0.08)] flex items-start gap-2 text-xs text-[#F4F0EB]"
                data-testid="auth-error"
              >
                <AlertTriangle className="w-4 h-4 text-[#D11124] shrink-0 mt-0.5" />
                <span>{err}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-brutal w-full mt-6"
              data-testid="auth-submit-btn"
            >
              {loading ? "A LIGAR…" : mode === "register" ? "ALISTAR" : "AUTENTICAR"}
              <ArrowRight className="w-3 h-3" />
            </button>
          </form>

          <div className="mt-8 divider-slash">{mode === "register" ? "EXILADO EXISTENTE" : "NOVO NO PROTOCOLO"}</div>

          <button
            onClick={() => { setMode(mode === "register" ? "login" : "register"); setErr(""); }}
            className="btn-ghost w-full mt-4"
            data-testid="auth-switch-btn"
          >
            {mode === "register" ? "Voltar ao Exílio" : "Assinar o Teu Nome"}
          </button>
        </div>
        <p className="mt-4 text-center text-[0.55rem] tracking-[0.3em] text-[#8A8A8A] uppercase">
          ◆ O teu progresso fica selado a este sinal
        </p>
      </div>
    </div>
  );
}

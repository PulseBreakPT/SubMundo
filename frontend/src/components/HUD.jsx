import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { LogOut, Swords, User2, Map, Home, Star, Package2, BookOpen } from "lucide-react";

export default function HUD({ character, minimal = false }) {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();

  const handleLogout = async () => {
    await logout();
    nav("/");
  };

  const hpPct = character ? Math.max(0, (character.hp / character.max_hp) * 100) : 0;
  const enPct = character ? Math.max(0, (character.energy / character.max_energy) * 100) : 0;
  const xpPct = character ? Math.max(0, (character.xp / character.xp_next) * 100) : 0;

  const navItem = (to, Icon, testId, title, badge) => {
    const active = loc.pathname.startsWith(to);
    return (
      <Link
        to={to}
        className={`relative p-2 transition-colors ${active ? "bg-[rgba(245,166,35,0.12)] text-[#F5A623]" : "text-[#8A8A8A] hover:bg-[rgba(245,166,35,0.08)] hover:text-[#F5A623]"}`}
        data-testid={testId}
        title={title}
      >
        <Icon className="w-4 h-4" />
        {active && <span className="absolute left-1/2 -translate-x-1/2 bottom-0 w-6 h-[2px] bg-[#F5A623]" />}
        {badge}
      </Link>
    );
  };

  return (
    <header
      className="sticky top-0 z-40 border-b border-[rgba(209,17,36,0.25)] bg-[#050505]/90 backdrop-blur-xl"
      data-testid="game-hud"
    >
      <div className="max-w-[1400px] mx-auto px-3 sm:px-8 py-2.5 sm:py-3 flex items-center gap-3 sm:gap-6">
        <Link to="/hub" className="flex items-center gap-2 sm:gap-3 group shrink-0" data-testid="hud-logo">
          <span className="text-[#D11124] text-xl sm:text-2xl font-black">◈</span>
          <div className="min-w-0">
            <p className="font-display text-[0.65rem] sm:text-base font-black tracking-[0.18em] sm:tracking-[0.2em] text-[#F4F0EB] group-hover:text-[#F5A623] transition-colors">
              AETHER<span className="text-[#D11124]">//</span>EXILE
            </p>
            <p className="hidden sm:block text-[0.55rem] tracking-[0.3em] text-[#8A8A8A] uppercase">
              Protocolo de Exílio v7.13
            </p>
          </div>
        </Link>

        {character && !minimal && (
          <div className="hidden md:flex flex-1 items-center gap-8">
            <div className="flex-1 max-w-sm">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[0.55rem] tracking-[0.25em] text-[#D11124] font-bold">VIDA</span>
                <span className="text-xs font-mono text-[#F4F0EB]" data-testid="hud-hp-text">
                  {character.hp}/{character.max_hp}
                </span>
              </div>
              <div className="bar-track" data-testid="hud-hp-bar">
                <div className="bar-fill-hp" style={{ width: `${hpPct}%` }} />
                <div className="bar-segments" />
              </div>
            </div>
            <div className="flex-1 max-w-sm">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[0.55rem] tracking-[0.25em] text-[#F5A623] font-bold">CARGA</span>
                <span className="text-xs font-mono text-[#F4F0EB]" data-testid="hud-energy-text">
                  {character.energy}/{character.max_energy}
                </span>
              </div>
              <div className="bar-track" data-testid="hud-energy-bar">
                <div className="bar-fill-energy" style={{ width: `${enPct}%` }} />
                <div className="bar-segments" />
              </div>
            </div>
          </div>
        )}

        {character && !minimal && (
          <div className="hidden lg:flex items-center gap-6 pr-2 border-r border-[rgba(244,240,235,0.1)]">
            <div className="text-right">
              <p className="text-[0.55rem] tracking-[0.3em] text-[#8A8A8A]">NÍV</p>
              <p className="font-display text-2xl font-black text-[#F5A623]" data-testid="hud-level">{character.level}</p>
            </div>
            <div className="w-20">
                <p className="text-[0.55rem] tracking-[0.3em] text-[#8A8A8A] mb-1">XP</p>
                <div className="bar-track-xp">
                  <div className="bar-fill-xp" style={{ width: `${xpPct}%` }} />
                </div>
              </div>
            <div className="text-right">
              <p className="text-[0.55rem] tracking-[0.3em] text-[#8A8A8A]">CR</p>
              <p className="font-mono text-sm font-bold text-[#F4F0EB]" data-testid="hud-credits">{character.credits || 0}</p>
            </div>
          </div>
        )}

        <nav className="flex items-center gap-0.5 sm:gap-1 ml-auto">
          {!minimal && (
            <>
              {navItem("/hub", Map, "nav-hub", "Hub")}
              {navItem("/talents", Star, "nav-talents", "Talents",
                character?.talent_points > 0
                  ? <span className="absolute top-0.5 right-0.5 w-2 h-2 bg-[#F5A623] rounded-full pulse-alert" />
                  : null)}
              {navItem("/armory", Package2, "nav-armory", "Armory")}
              {navItem("/lore", BookOpen, "nav-lore", "Lore")}
              {navItem("/codex", User2, "nav-codex", "Codex")}
            </>
          )}
          <div className="hidden sm:block text-right px-3 border-l border-[rgba(244,240,235,0.1)] ml-2">
            <p className="text-[0.55rem] tracking-[0.3em] text-[#8A8A8A]">ALCUNHA</p>
            <p className="font-mono text-xs text-[#F4F0EB]" data-testid="hud-callsign">{user?.callsign || "—"}</p>
          </div>
          <button
            onClick={handleLogout}
            className="p-2 hover:bg-[rgba(209,17,36,0.15)] text-[#8A8A8A] hover:text-[#D11124] transition-colors"
            data-testid="logout-btn"
            title="Desconectar"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </nav>
      </div>
    </header>
  );
}

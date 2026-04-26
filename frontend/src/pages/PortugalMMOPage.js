import { useMemo, useState } from 'react';
import { Car, Flame, ShieldAlert, Skull, Sword, Target, Wallet } from 'lucide-react';

const PORTUGAL_ZONES = [
  {
    id: 'porto',
    nome: 'Porto Noturno',
    regiao: 'Norte',
    risco: 2,
    recompensa: 140,
    descricao: 'Docas, contrabando e corridas ilegais junto ao Douro.'
  },
  {
    id: 'coimbra',
    nome: 'Coimbra Subterrânea',
    regiao: 'Centro',
    risco: 3,
    recompensa: 190,
    descricao: 'Hackers académicos e missões de infiltração universitária.'
  },
  {
    id: 'lisboa',
    nome: 'Lisboa Criminal District',
    regiao: 'Lisboa',
    risco: 4,
    recompensa: 260,
    descricao: 'Capital das facções, assaltos de alto nível e mercado negro VIP.'
  },
  {
    id: 'setubal',
    nome: 'Setúbal Dock Wars',
    regiao: 'Setúbal',
    risco: 3,
    recompensa: 180,
    descricao: 'Guerra de contentores, escoltas e extração de carga valiosa.'
  },
  {
    id: 'algarve',
    nome: 'Algarve Neon Coast',
    regiao: 'Sul',
    risco: 5,
    recompensa: 320,
    descricao: 'Casinos ilegais, corrupção e golpes milionários em resorts.'
  }
];

const ACTIONS = [
  {
    id: 'assalto',
    nome: 'Assalto Rápido',
    heat: 18,
    xp: 85,
    bonus: 1,
    icon: Target
  },
  {
    id: 'guerra',
    nome: 'Guerra de Território',
    heat: 25,
    xp: 120,
    bonus: 1.35,
    icon: Sword
  },
  {
    id: 'contrabando',
    nome: 'Rota de Contrabando',
    heat: 14,
    xp: 70,
    bonus: 1.1,
    icon: Car
  }
];

const getRank = (xp) => {
  if (xp >= 1200) return 'Lenda do Submundo';
  if (xp >= 750) return 'Chefe de Facção';
  if (xp >= 350) return 'Operador de Rua';
  return 'Recruta';
};

export default function PortugalMMOPage() {
  const [zoneId, setZoneId] = useState(PORTUGAL_ZONES[2].id);
  const [actionId, setActionId] = useState(ACTIONS[0].id);
  const [player, setPlayer] = useState({
    nome: 'Jogador PT',
    vida: 100,
    heat: 12,
    cash: 500,
    xp: 0,
    energia: 100,
    historico: ['Conectado ao servidor nacional.']
  });

  const zonaAtual = useMemo(
    () => PORTUGAL_ZONES.find((zone) => zone.id === zoneId) || PORTUGAL_ZONES[0],
    [zoneId]
  );

  const acaoAtual = useMemo(
    () => ACTIONS.find((action) => action.id === actionId) || ACTIONS[0],
    [actionId]
  );

  const jogarTurno = () => {
    setPlayer((atual) => {
      if (atual.energia < 20 || atual.vida <= 0) {
        return {
          ...atual,
          historico: [
            'Sem energia suficiente. Descansa para continuar.',
            ...atual.historico
          ].slice(0, 6)
        };
      }

      const riscoBase = zonaAtual.risco * 0.16 + acaoAtual.heat * 0.01;
      const sucesso = Math.random() > riscoBase;
      const ganho = Math.round(zonaAtual.recompensa * acaoAtual.bonus);
      const dano = Math.round(zonaAtual.risco * 6 + acaoAtual.heat * 0.35);

      if (sucesso) {
        return {
          ...atual,
          cash: atual.cash + ganho,
          xp: atual.xp + acaoAtual.xp,
          heat: Math.min(100, atual.heat + acaoAtual.heat),
          energia: Math.max(0, atual.energia - 20),
          historico: [
            `✅ ${acaoAtual.nome} em ${zonaAtual.nome}: +€${ganho} | +${acaoAtual.xp} XP`,
            ...atual.historico
          ].slice(0, 6)
        };
      }

      return {
        ...atual,
        vida: Math.max(0, atual.vida - dano),
        heat: Math.min(100, atual.heat + acaoAtual.heat + 8),
        energia: Math.max(0, atual.energia - 20),
        historico: [
          `❌ Operação falhou em ${zonaAtual.nome}: -${dano} HP | polícia ativa`,
          ...atual.historico
        ].slice(0, 6)
      };
    });
  };

  const descansar = () => {
    setPlayer((atual) => ({
      ...atual,
      vida: Math.min(100, atual.vida + 20),
      energia: Math.min(100, atual.energia + 35),
      heat: Math.max(0, atual.heat - 10),
      historico: ['🛌 Descansaste num esconderijo seguro.', ...atual.historico].slice(0, 6)
    }));
  };

  return (
    <main className="min-h-screen bg-background text-text-primary px-4 py-8 md:px-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <header className="border border-primary/40 bg-surface p-6">
          <p className="text-xs uppercase tracking-[0.25em] text-secondary mb-2">Portugal Text MMO RPG</p>
          <h1 className="text-3xl md:text-5xl font-bold text-primary">SubMundo: Mapa de Portugal</h1>
          <p className="text-text-secondary mt-3 max-w-3xl">
            Estilo urbano inspirado em crime sandbox: escolhe uma zona, executa ações e evolui o teu personagem em tempo real.
          </p>
        </header>

        <section className="grid lg:grid-cols-3 gap-4">
          <article className="border border-border bg-surface p-4 space-y-3">
            <h2 className="text-lg text-secondary">Operador</h2>
            <p className="font-semibold">{player.nome}</p>
            <p className="text-sm text-gold">Rank: {getRank(player.xp)}</p>
            <div className="space-y-2 text-sm">
              <p className="flex justify-between"><span>Vida</span><span>{player.vida}%</span></p>
              <p className="flex justify-between"><span>Energia</span><span>{player.energia}%</span></p>
              <p className="flex justify-between"><span>Heat</span><span>{player.heat}%</span></p>
              <p className="flex justify-between"><span>XP</span><span>{player.xp}</span></p>
              <p className="flex justify-between text-success"><span>Dinheiro</span><span>€{player.cash}</span></p>
            </div>
          </article>

          <article className="border border-border bg-surface p-4 lg:col-span-2">
            <h2 className="text-lg text-secondary mb-3">Mapa Tático de Portugal</h2>
            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
              {PORTUGAL_ZONES.map((zone) => (
                <button
                  key={zone.id}
                  type="button"
                  onClick={() => setZoneId(zone.id)}
                  className={`text-left border p-3 transition ${
                    zone.id === zoneId ? 'border-primary bg-primary/10' : 'border-border hover:border-secondary/60'
                  }`}
                >
                  <p className="font-semibold">{zone.nome}</p>
                  <p className="text-xs text-text-secondary">{zone.regiao}</p>
                  <p className="text-xs mt-2">Risco: {zone.risco}/5 • Recompensa base: €{zone.recompensa}</p>
                </button>
              ))}
            </div>
            <p className="text-sm text-text-secondary mt-4">{zonaAtual.descricao}</p>
          </article>
        </section>

        <section className="grid lg:grid-cols-2 gap-4">
          <article className="border border-border bg-surface p-4 space-y-4">
            <h2 className="text-lg text-secondary">Ação MMO</h2>
            <div className="space-y-2">
              {ACTIONS.map((action) => {
                const Icon = action.icon;
                return (
                  <button
                    type="button"
                    key={action.id}
                    onClick={() => setActionId(action.id)}
                    className={`w-full border p-3 flex items-center justify-between ${
                      action.id === actionId ? 'border-secondary bg-secondary/10' : 'border-border'
                    }`}
                  >
                    <span className="flex items-center gap-2"><Icon size={16} /> {action.nome}</span>
                    <span className="text-xs">+{action.xp} XP</span>
                  </button>
                );
              })}
            </div>

            <div className="flex flex-wrap gap-3 pt-2">
              <button type="button" onClick={jogarTurno} className="border border-primary bg-primary/20 px-4 py-2">
                Executar Turno
              </button>
              <button type="button" onClick={descansar} className="border border-success/80 bg-success/10 px-4 py-2">
                Descansar
              </button>
            </div>
          </article>

          <article className="border border-border bg-surface p-4">
            <h2 className="text-lg text-secondary mb-3">Feed de Operações</h2>
            <ul className="space-y-2 text-sm">
              {player.historico.map((item) => (
                <li key={item} className="border border-border bg-background/50 p-2">{item}</li>
              ))}
            </ul>
          </article>
        </section>

        <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="border border-border bg-surface p-3 text-center">
            <Flame className="mx-auto mb-2 text-error" size={18} />
            <p className="text-xs text-text-secondary">Alerta Policial</p>
            <p className="font-semibold">{player.heat >= 60 ? 'Crítico' : 'Controlado'}</p>
          </div>
          <div className="border border-border bg-surface p-3 text-center">
            <Wallet className="mx-auto mb-2 text-success" size={18} />
            <p className="text-xs text-text-secondary">Carteira</p>
            <p className="font-semibold">€{player.cash}</p>
          </div>
          <div className="border border-border bg-surface p-3 text-center">
            <ShieldAlert className="mx-auto mb-2 text-warning" size={18} />
            <p className="text-xs text-text-secondary">Sobrevivência</p>
            <p className="font-semibold">{player.vida}%</p>
          </div>
          <div className="border border-border bg-surface p-3 text-center">
            <Skull className="mx-auto mb-2 text-primary" size={18} />
            <p className="text-xs text-text-secondary">Status</p>
            <p className="font-semibold">{player.vida === 0 ? 'Derrotado' : 'Em jogo'}</p>
          </div>
        </section>
      </div>
    </main>
  );
}

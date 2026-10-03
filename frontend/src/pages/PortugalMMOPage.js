import { useMemo, useState } from 'react';
import {
  Brain,
  Briefcase,
  Car,
  Flame,
  ShieldAlert,
  Skull,
  Sword,
  Target,
  TrendingUp,
  Wallet
} from 'lucide-react';

const ZONAS = [
  { id: 'porto', nome: 'Porto Noturno', riscoBase: 2, recompensaBase: 140 },
  { id: 'coimbra', nome: 'Coimbra Subterrânea', riscoBase: 3, recompensaBase: 185 },
  { id: 'lisboa', nome: 'Lisboa Criminal District', riscoBase: 4, recompensaBase: 250 },
  { id: 'setubal', nome: 'Setúbal Dock Wars', riscoBase: 3, recompensaBase: 200 },
  { id: 'algarve', nome: 'Algarve Neon Coast', riscoBase: 5, recompensaBase: 320 }
];

const TIPOS_MISSAO = [
  { id: 'assalto', nome: 'Assalto Tático', icon: Target, bonus: 1, stress: 1 },
  { id: 'territorio', nome: 'Guerra Territorial', icon: Sword, bonus: 1.3, stress: 1.3 },
  { id: 'contrabando', nome: 'Rota de Contrabando', icon: Car, bonus: 1.15, stress: 0.9 },
  { id: 'corporativo', nome: 'Golpe Corporativo', icon: Briefcase, bonus: 1.45, stress: 1.2 }
];

const TITULOS = [
  'Recruta de Rua',
  'Operador Urbano',
  'Capitão da Facção',
  'Arquitecto do Crime',
  'Lenda Rockstar do Submundo'
];

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const getTitulo = (nivel) => {
  if (nivel >= 30) return TITULOS[4];
  if (nivel >= 20) return TITULOS[3];
  if (nivel >= 12) return TITULOS[2];
  if (nivel >= 6) return TITULOS[1];
  return TITULOS[0];
};

const getThreatTier = (heatGlobal) => {
  if (heatGlobal >= 85) return 'LOCKDOWN';
  if (heatGlobal >= 60) return 'CAÇA TOTAL';
  if (heatGlobal >= 35) return 'VIGILÂNCIA';
  return 'DISCRETO';
};

const criarMissao = (zona, nivel, turno, influencia, pressaoPolicial) => {
  const tipo = TIPOS_MISSAO[Math.floor(Math.random() * TIPOS_MISSAO.length)];
  const escala = 1 + nivel * 0.08 + turno * 0.012;
  const risco = clamp(
    Math.round((zona.riscoBase + influencia * 0.22 + pressaoPolicial * 0.18) * escala * 0.5),
    1,
    12
  );

  const payout = Math.round(
    zona.recompensaBase * tipo.bonus * (1 + nivel * 0.06 + turno * 0.016 + influencia * 0.02)
  );

  const xp = Math.round(75 + risco * 22 + nivel * 9 + influencia * 4);

  return {
    id: `${zona.id}-${tipo.id}-${Date.now()}-${Math.floor(Math.random() * 9999)}`,
    zonaId: zona.id,
    zonaNome: zona.nome,
    tipo: tipo.id,
    nome: tipo.nome,
    icon: tipo.icon,
    risco,
    payout,
    xp,
    stress: tipo.stress,
    calor: clamp(Math.round(8 + risco * 3.8 * tipo.stress + pressaoPolicial * 3), 12, 56)
  };
};

const gerarPacoteInfinito = (nivel, turno, controlo, pressaoPolicial) => {
  const contratos = [];
  for (let i = 0; i < 5; i += 1) {
    const zona = ZONAS[Math.floor(Math.random() * ZONAS.length)];
    contratos.push(criarMissao(zona, nivel, turno, controlo[zona.id] || 0, pressaoPolicial));
  }
  return contratos;
};

const scoreContrato = (contrato, estado) => {
  const sobrevivencia = estado.vida * 0.18 + estado.energia * 0.2;
  const riscoPenalidade = contrato.risco * 16 + estado.heat * 0.8 + estado.pressaoPolicial * 10;
  const retorno = contrato.payout * 0.42 + contrato.xp * 0.36;
  const alvoTerritorial = (estado.controlo[contrato.zonaId] || 0) * 4;
  return Math.round(retorno + sobrevivencia + alvoTerritorial - riscoPenalidade);
};

export default function PortugalMMOPage() {
  const [estado, setEstado] = useState(() => {
    const baseControlo = Object.fromEntries(ZONAS.map((z) => [z.id, 0]));
    return {
      nome: 'GhostPT',
      nivel: 1,
      xp: 0,
      vida: 100,
      energia: 100,
      heat: 8,
      pressaoPolicial: 0,
      cash: 500,
      turno: 1,
      qiCriminoso: 100,
      contratos: gerarPacoteInfinito(1, 1, baseControlo, 0),
      controlo: baseControlo,
      feed: ['Servidor iniciado. IA criminal ativa.']
    };
  });

  const titulo = useMemo(() => getTitulo(estado.nivel), [estado.nivel]);
  const threatTier = useMemo(() => getThreatTier(estado.heat), [estado.heat]);

  const contratosComScore = useMemo(
    () => estado.contratos.map((c) => ({ ...c, score: scoreContrato(c, estado) })),
    [estado]
  );

  const melhorContrato = useMemo(() => {
    if (!contratosComScore.length) return null;
    return [...contratosComScore].sort((a, b) => b.score - a.score)[0];
  }, [contratosComScore]);

  const subirNivelSePreciso = (xpTotal, nivelAtual) => {
    let nivelNovo = nivelAtual;
    let threshold = nivelNovo * 220;
    while (xpTotal >= threshold) {
      nivelNovo += 1;
      threshold = nivelNovo * 220;
    }
    return nivelNovo;
  };

  const diretorIA = (draft) => {
    const hotspot = ZONAS[Math.floor(Math.random() * ZONAS.length)].id;
    const pressaoAjustada = clamp(draft.pressaoPolicial + (draft.heat >= 60 ? 0.2 : -0.1), 0, 5);

    return {
      ...draft,
      pressaoPolicial: Number(pressaoAjustada.toFixed(1)),
      controlo: {
        ...draft.controlo,
        [hotspot]: clamp((draft.controlo[hotspot] || 0) - (draft.heat >= 70 ? 1 : 0), -12, 50)
      }
    };
  };

  const regenerarContratos = (draft) => {
    if (draft.contratos.length >= 3) return draft;
    return {
      ...draft,
      contratos: [
        ...draft.contratos,
        ...gerarPacoteInfinito(draft.nivel, draft.turno, draft.controlo, draft.pressaoPolicial)
      ]
    };
  };

  const executarContrato = (contratoId) => {
    setEstado((atual) => {
      const contrato = atual.contratos.find((c) => c.id === contratoId);
      if (!contrato) return atual;

      if (atual.vida <= 0) {
        return {
          ...atual,
          feed: ['☠️ Estás caído. Descansa para voltar.', ...atual.feed].slice(0, 9)
        };
      }

      if (atual.energia < 14) {
        return {
          ...atual,
          feed: ['⚠️ Energia insuficiente. Faz descanso tático.', ...atual.feed].slice(0, 9)
        };
      }

      const inteligenciaBonus = atual.qiCriminoso * 0.0018;
      const poderJogador = atual.nivel * 0.034 + atual.energia * 0.0022 + inteligenciaBonus;
      const dificuldade =
        contrato.risco * 0.061 + atual.heat * 0.0032 + atual.pressaoPolicial * 0.08 + contrato.stress * 0.02;

      const chanceSucesso = clamp(0.78 + poderJogador - dificuldade, 0.18, 0.93);
      const sucesso = Math.random() <= chanceSucesso;

      if (sucesso) {
        const xpNovo = atual.xp + contrato.xp;
        const nivelNovo = subirNivelSePreciso(xpNovo, atual.nivel);
        const bonusNivel = nivelNovo > atual.nivel ? 1 + (nivelNovo - atual.nivel) * 0.14 : 1;
        const bonusQI = 1 + atual.qiCriminoso * 0.0007;
        const ganhoFinal = Math.round(contrato.payout * bonusNivel * bonusQI);

        let draft = {
          ...atual,
          xp: xpNovo,
          nivel: nivelNovo,
          cash: atual.cash + ganhoFinal,
          qiCriminoso: clamp(atual.qiCriminoso + 2, 90, 220),
          vida: clamp(atual.vida - Math.round(contrato.risco * 1.4), 0, 100),
          energia: clamp(atual.energia - 14, 0, 100),
          heat: clamp(atual.heat + contrato.calor, 0, 100),
          turno: atual.turno + 1,
          contratos: atual.contratos.filter((c) => c.id !== contratoId),
          controlo: {
            ...atual.controlo,
            [contrato.zonaId]: clamp((atual.controlo[contrato.zonaId] || 0) + 2, -12, 50)
          },
          feed: [
            `✅ ${contrato.nome} em ${contrato.zonaNome}: +€${ganhoFinal} | +${contrato.xp} XP`,
            nivelNovo > atual.nivel ? `🏆 Nível ${nivelNovo} desbloqueado!` : null,
            ...atual.feed
          ].filter(Boolean).slice(0, 9)
        };

        draft = diretorIA(draft);
        return regenerarContratos(draft);
      }

      const dano = Math.round(10 + contrato.risco * 3.2 + atual.heat * 0.06 + atual.pressaoPolicial * 2);
      let draftFalha = {
        ...atual,
        qiCriminoso: clamp(atual.qiCriminoso - 1, 90, 220),
        vida: clamp(atual.vida - dano, 0, 100),
        energia: clamp(atual.energia - 14, 0, 100),
        heat: clamp(atual.heat + contrato.calor + 9, 0, 100),
        turno: atual.turno + 1,
        contratos: atual.contratos.filter((c) => c.id !== contratoId),
        controlo: {
          ...atual.controlo,
          [contrato.zonaId]: clamp((atual.controlo[contrato.zonaId] || 0) - 2, -12, 50)
        },
        feed: [`❌ Falha em ${contrato.zonaNome}: -${dano} HP`, ...atual.feed].slice(0, 9)
      };

      draftFalha = diretorIA(draftFalha);
      return regenerarContratos(draftFalha);
    });
  };

  const autoPlanner = () => {
    if (!melhorContrato) return;
    executarContrato(melhorContrato.id);
  };

  const descansar = () => {
    setEstado((atual) => {
      const cura = 20 + Math.round(atual.nivel * 0.9);
      return {
        ...atual,
        vida: clamp(atual.vida + cura, 0, 100),
        energia: clamp(atual.energia + 38, 0, 100),
        heat: clamp(atual.heat - 16, 0, 100),
        qiCriminoso: clamp(atual.qiCriminoso + 1, 90, 220),
        turno: atual.turno + 1,
        feed: ['🛌 Descanso inteligente: recuperaste recursos e baixaste rastreio.', ...atual.feed].slice(0, 9)
      };
    });
  };

  return (
    <main className="min-h-screen bg-background text-text-primary px-4 py-8 md:px-8">
      <div className="max-w-6xl mx-auto space-y-5">
        <header className="border border-primary/40 bg-surface p-5">
          <p className="text-xs uppercase tracking-[0.22em] text-secondary">Portugal Infinite Text MMO</p>
          <h1 className="text-3xl md:text-5xl text-primary font-bold">SubMundo Neural Loop</h1>
          <p className="text-text-secondary mt-2">Mais QI, mais estratégia: IA diretora, score tático e auto-planner.</p>
        </header>

        <section className="grid md:grid-cols-6 gap-3">
          <div className="border border-border bg-surface p-3 md:col-span-2">
            <p className="text-sm text-secondary">Operador</p>
            <p className="font-semibold">{estado.nome}</p>
            <p className="text-gold text-sm">{titulo}</p>
            <p className="text-xs text-text-secondary mt-1">Turno #{estado.turno}</p>
          </div>
          <div className="border border-border bg-surface p-3 text-center">
            <TrendingUp className="mx-auto mb-1 text-secondary" size={16} />
            <p className="text-xs text-text-secondary">Nível</p>
            <p className="font-bold">{estado.nivel}</p>
          </div>
          <div className="border border-border bg-surface p-3 text-center">
            <Wallet className="mx-auto mb-1 text-success" size={16} />
            <p className="text-xs text-text-secondary">Caixa</p>
            <p className="font-bold">€{estado.cash}</p>
          </div>
          <div className="border border-border bg-surface p-3 text-center">
            <Flame className="mx-auto mb-1 text-error" size={16} />
            <p className="text-xs text-text-secondary">Heat</p>
            <p className="font-bold">{estado.heat}%</p>
          </div>
          <div className="border border-border bg-surface p-3 text-center">
            <Brain className="mx-auto mb-1 text-warning" size={16} />
            <p className="text-xs text-text-secondary">QI</p>
            <p className="font-bold">{estado.qiCriminoso}</p>
          </div>
        </section>

        <section className="grid lg:grid-cols-3 gap-4">
          <article className="border border-border bg-surface p-4 lg:col-span-2">
            <div className="flex items-center justify-between mb-3 gap-2">
              <h2 className="text-secondary">Contratos com score de IA</h2>
              <button type="button" onClick={autoPlanner} className="border border-secondary/70 bg-secondary/10 px-3 py-1 text-xs">
                Executar Melhor (Auto-Plan)
              </button>
            </div>
            <div className="space-y-2">
              {contratosComScore.slice(0, 6).map((contrato) => {
                const Icon = contrato.icon;
                const isBest = melhorContrato?.id === contrato.id;
                return (
                  <button
                    key={contrato.id}
                    type="button"
                    onClick={() => executarContrato(contrato.id)}
                    className={`w-full border p-3 text-left ${isBest ? 'border-secondary bg-secondary/10' : 'border-border bg-background/40'}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="flex items-center gap-2 font-semibold"><Icon size={15} /> {contrato.nome}</span>
                      <span className="text-xs">Score IA: {contrato.score}</span>
                    </div>
                    <p className="text-xs text-text-secondary mt-1">{contrato.zonaNome}</p>
                    <p className="text-xs mt-1">Risco {contrato.risco}/12 • €{contrato.payout} • +{contrato.xp} XP</p>
                  </button>
                );
              })}
            </div>
            <div className="flex flex-wrap gap-2 mt-4">
              <button type="button" onClick={descansar} className="border border-success/80 bg-success/10 px-4 py-2">
                Descansar
              </button>
            </div>
          </article>

          <article className="border border-border bg-surface p-4">
            <h2 className="text-secondary mb-2">Diretor de Mundo</h2>
            <p className="text-sm flex justify-between"><span>Ameaça atual</span><span>{threatTier}</span></p>
            <p className="text-sm flex justify-between"><span>Pressão policial</span><span>{estado.pressaoPolicial}/5</span></p>
            <p className="text-sm flex justify-between"><span>Vida</span><span>{estado.vida}%</span></p>
            <p className="text-sm flex justify-between"><span>Energia</span><span>{estado.energia}%</span></p>
            <p className="text-sm flex justify-between"><span>XP</span><span>{estado.xp}</span></p>

            <h3 className="text-secondary mt-4 mb-2">Influência por zona</h3>
            <div className="space-y-1 text-sm">
              {ZONAS.map((z) => (
                <p key={z.id} className="flex justify-between">
                  <span>{z.nome}</span>
                  <span>{estado.controlo[z.id]}</span>
                </p>
              ))}
            </div>
          </article>
        </section>

        <section className="grid lg:grid-cols-2 gap-4">
          <article className="border border-border bg-surface p-4">
            <h2 className="text-secondary mb-2">Feed do Submundo</h2>
            <ul className="space-y-2 text-sm">
              {estado.feed.map((item) => (
                <li key={item} className="border border-border bg-background/50 p-2">{item}</li>
              ))}
            </ul>
          </article>

          <article className="border border-border bg-surface p-4">
            <h2 className="text-secondary mb-2">Lógica extra de QI</h2>
            <div className="space-y-3 text-sm">
              <div className="border border-border p-2 flex items-center gap-2">
                <Brain size={15} className="text-warning" />
                QI altera tua chance de sucesso e ganho financeiro.
              </div>
              <div className="border border-border p-2 flex items-center gap-2">
                <ShieldAlert size={15} className="text-warning" />
                IA diretora ajusta pressão policial e hotspot dinâmico a cada turno.
              </div>
              <div className="border border-border p-2 flex items-center gap-2">
                <Skull size={15} className="text-primary" />
                Falhas reduzem influência; sucessos criam domínio territorial inteligente.
              </div>
            </div>
          </article>
        </section>
      </div>
    </main>
  );
}

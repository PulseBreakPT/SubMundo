# AETHER//EXILE — Product Requirements Document

## Declaração original do problema
"Cria um jogo RPG futurista com uma personalidade única nunca antes vista, cores preto, branco e vermelho e gold âmbar, gradientes."

## Idioma
Todo o conteúdo visível (UI, lore, logs, mensagens de erro, dados do jogo) é **Português de Portugal (PT-PT)**.

## Temática & Design
- Estilo "Occult Cyber-Brutalism": turn-based RPG cyberpunk / pós-apocalipse / sci-fi
- Paleta: **Preto `#050505` + Branco `#F4F0EB` + Vermelho DOMINANTE `#E31230/#FF1E3C/#7A0A15` + Âmbar `#F5A623` como acento**
- Atualmente tema está **vermelho-dominante**: HUD corners, bordas de painel, hovers, HP bar e gradientes `grad-text-amber` foram reconvertidos para espectro vermelho. Âmbar fica reservado a barras de energia/XP e pontos de talento.
- Tipografia: Unbounded (display) + JetBrains Mono
- Efeitos: scanlines, grain, glitch-in, flicker, HUD corners com glow vermelho

## Stack
- Backend: FastAPI + MongoDB (Motor) + JWT/bcrypt
- Frontend: React + Tailwind + Shadcn UI + Lucide React
- Autenticação interna (email/password + callsign), sem 3rd party

## Conteúdo (estático, definido em `/app/backend/game_data.py`)
- **3 classes** (REVENANT / NULL-SEER / HOLLOW-BLADE) com 4 skills + ultimate
- **4 origens** de personagem com bónus stat
- **18 missões** de campanha progressiva (tier 1→5, nível 1→12)
- **18 inimigos** com rotações e enrage patterns, incluindo chefes finais
- **21 habilidades** de inimigo com telegraphs únicos
- **5 status effects** (Hemorragia, Queimadura, Choque, Marcado, Congelado)
- **8 terrenos** de missão com modificadores mecânicos (chuva âmbar, inverno vermelho, nove olhos, pulso áurico…)
- **15 talentos** em 3 ramos (FERRO / VAZIO / SANGUE)
- **4 facções** com sistema de reputação (0→300)
- **Equipamento aleatório** (arma/armadura/relíquia) por tier 1-5
- **Lore procedural** (nomes, lugares, verbos, artefactos, profecias → fragmentos únicos)
- **Mercado + Artesanato** com 5 materiais
- **5 zonas** de exploração com eventos ramificados
- **3 missões secundárias** com dialogs ramificados
- **Tarefas diárias + 19 conquistas**
- **Arena + sistema de ascensão** (em expansão)

## Módulos UI (páginas)
- Landing (hero + ticker + feature cards)
- Auth (login/register)
- CharacterForge (seleção de classe)
- Hub (missões + atalhos)
- Combat (turn-based com intent telegraphs, status effects, elemental weakness)
- Talents (árvore de 3 ramos)
- Armory (equipment stash + equip/unequip)
- Lore (fragmentos procedurais)
- Codex (perfil + histórico)

## Changelog (Feb 2026 — continuidade)
- ✅ Tradução PT-PT completa e verificada
- ✅ Tema vermelho-dominante implementado
- ✅ Sessões de combate legacy na DB purgadas
- ✅ Smoke test passou (Landing, Hub, Talents, Combat)
- ✅ Expansão de conteúdo: **+10 inimigos** (IRMÃO FERAL → O PRIMEIRO NOME, tiers 1-5), **+10 missões** (m9-m18, nível 2-12), **+8 habilidades de inimigo** (AMARRAR, SUSSURRO, CHUVA DE BRASA, HINO, GOLPE DE NOME, QUEBRA DE JURAMENTO, VEREDICTO FRIO, GOLPE GÉMEO), **+3 terrenos** (Inverno Vermelho, Nove Olhos, Pulso Áurico)

## Roadmap (P1 — próximas tarefas)
- Decidir sobre `/app/backend/game_ext.py` (integrar as expansões ou remover)
- Expansão RPG profunda: sobrevivência/stamina, facções ativas, quests secundárias com UI, crafting UI, mercado dinâmico, arena com ondas, ascensões/prestígio
- Persistência robusta de save/load (já em Mongo, falta stress test)

## Roadmap (P2 — backlog)
- Leaderboards sazonais
- AI narrador dinâmico (via Emergent LLM key)
- Storage para avatares custom (object storage)
- Animações de combate mais ricas

## Arquitetura
```
/app/
├── backend/
│   ├── server.py        # API + auth + combat logic (PT-PT error details)
│   ├── game_data.py     # Conteúdo estático TODO em PT-PT
│   └── game_ext.py      # Órfão (aborted expansion) — decidir
└── frontend/src/
    ├── pages/           # 9 páginas, todas em PT-PT
    ├── components/HUD.jsx  # Nav + bars (tooltips PT)
    ├── context/AuthContext.jsx
    └── index.css        # Tema vermelho-dominante
```

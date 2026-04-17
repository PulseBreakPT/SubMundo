# AETHER//EXILE — Product Requirements Document

## Original Problem Statement
"Cria um jogo RPG futuristico com uma personalidade única nunca antes vista, cores preto branco e vermelho e gold âmbar, gradientes"

Iteration 2: "Gostei, adiciona lógica, QI, investimento e lore Infinito ao design e a todo os sistemas do jogo."

## Concept
Turn-based RPG — "Occult Cyber-Brutalism" aesthetic. Fusion world of cyberpunk + space sci-fi + post-apocalyptic. Pre-written narrative across 8 missions. Signature palette: #050505 bg, #D11124 red, #F5A623 gold amber, #F4F0EB bone, with strong gradients. Fonts: Unbounded (display) + JetBrains Mono (body).

## Architecture
- **Backend**: FastAPI + MongoDB + JWT httpOnly cookies
- **Frontend**: React 19 + React Router 7 + Tailwind + custom CSS
- **Auth**: custom email/password (bcrypt, brute-force lockout)

## Core Systems (Implemented 2026-04-17)
1. **Auth** — register/login/logout/me with httpOnly cookies (samesite=none).
2. **Character forge** — 3 classes (Revenant/Null-Seer/Hollow-Blade), each with element, stats, 4 skills.
3. **Hub** — world-map UI showing 8 missions with tier/level gating, rest action.
4. **Combat** — turn-based with attack/skill/defend/item, HP/Energy/Shield bars.
5. **Codex** — operative dossier, inventory, campaign progress.

## Deep Systems (added 2026-04-17 — iteration 2)
### LÓGICA (logic & depth)
- **Status effects**: bleed (stack ×3), burn (HP+ATK debuff), shock (30% skip), marked (+25% dmg taken), frozen (ATK halved).
- **Elemental system**: kinetic/void/psi/amber/rust with rock-paper-scissors weakness (+30% dmg).
- **Skill elements**: each skill rolls with a specific element + optional applied status.

### QI (strategic AI)
- **Enemy intent telegraph**: next ability visible on enemy card one turn ahead.
- **Ability rotations**: every enemy cycles a handcrafted move set (strike/rupture/void_howl/scream/knit/brace/unmake/…).
- **Reactive math**: shock skip, burn ATK debuff, frozen multiplier — AI punishes passive play.

### INVESTIMENTO (build depth)
- **Talent tree**: 3 branches (IRON/VOID/BLOOD) × 5 tiers = 15 nodes, prereq cascade. 1 point per level.
- **Equipment**: 3 slots (weapon/armor/relic). Procedurally rolled drops on mission victory (tier scales with mission; first-clear bonus). Full equip/unequip API with live stat recompute.
- **Bonus stacking**: talents + equipment contribute crit%, element dmg%, lifesteal%, reflect%, wounded dmg%, heal bonus%, energy regen.

### LORE INFINITO (infinite codex)
- **Procedural generator** (server-side, deterministic per user) — 10+ templates × dozens of names/places/artifacts/events = effectively unlimited fragments.
- **Infinite scroll** on /lore page.
- **Excavation**: spend 20 credits to unlock 1 more fragment permanently. Free unlocks on mission victory (1 normal, +2 bonus on first-clear).

## Routes
- `/`               — Landing
- `/auth`           — Login/Register
- `/forge`          — Class selection (first-time)
- `/hub`            — Mission select + quick-nav to new systems
- `/combat/:id`     — Combat arena
- `/talents`        — Neural investment tree
- `/armory`         — Equipment slots + stash
- `/lore`           — Infinite codex
- `/codex`          — Operative dossier

## Backend Endpoints (summary)
- /api/auth/{register,login,logout,me}
- /api/game/{classes,missions,items,meta,character,character/rest,character/reset}
- /api/game/talents/allocate
- /api/game/equipment/{equip,unequip}
- /api/game/lore (GET paginated), /api/game/lore/excavate (POST)
- /api/game/combat/{start,action,current}

## Backlog (P1)
- Skill trees specific to each class (passives unlocked per class)
- Infinite Arena mode (endless scaling encounters)
- Consumable purchase shop (spend credits)
- Boss phase transitions / multi-stage encounters
- Sound design + music

## Backlog (P2)
- Multiplayer PvP turn-based
- Lore fragment bookmarking/tagging
- Daily rotating challenge mission
- NPC relationship system

## Next Action Items
- (Optional) Add class-specific passive tree
- (Optional) Add Arena endless mode
- (Optional) Credit shop for consumables
EOF

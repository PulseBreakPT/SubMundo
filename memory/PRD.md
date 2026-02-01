# SUBMUNDO - PRD (Product Requirements Document)

## Problem Statement
Criar um site-jogo totalmente funcional, inspirado em GTA Online, 100% text-based, com foco em crime, economia, gangues, progressão e decisões com consequências reais. O jogo deve funcionar perfeitamente em computador, tablet e smartphone.

## User Choices
- **Autenticação:** JWT (email/password)
- **Atualizações:** Polling simples (15s)
- **Escopo:** MVP completo com todos os sistemas básicos
- **Idioma:** Português (PT-PT)
- **Tema:** Preto e Vermelho (Cyberpunk Noir)

## Architecture

### Backend (FastAPI + MongoDB)
- `/api/auth/*` - Autenticação JWT
- `/api/player/*` - Stats do jogador, recompensas diárias
- `/api/missions/*` - Sistema de missões
- `/api/neighborhoods` - Bairros da cidade
- `/api/gangs/*` - Sistema de gangues
- `/api/economy/*` - Lavagem de dinheiro
- `/api/actions/*` - Ações rápidas
- `/api/rankings/*` - Rankings globais

### Frontend (React + Tailwind)
- `AuthContext` - Gestão de autenticação
- `GameContext` - Estado do jogo e polling
- Páginas: Login, Home, Map, Missions, Gang, Profile
- Responsivo: Sidebar (desktop) / Bottom Nav (mobile)

## What's Been Implemented (02/02/2026)

### Core Systems ✅
- [x] Sistema de autenticação JWT
- [x] Dashboard principal com stats do jogador
- [x] Sistema de missões (8 tipos diferentes)
- [x] Sistema de bairros (6 bairros com stats únicos)
- [x] Sistema de gangues (criar, juntar, sair)
- [x] Sistema de heat policial
- [x] Sistema económico (dinheiro limpo/sujo)
- [x] Lavagem de dinheiro com risco
- [x] Ações rápidas (roubo, hustle, eventos)
- [x] Recompensa diária
- [x] Rankings globais
- [x] Perfil com estatísticas e histórico

### UI/UX ✅
- [x] Design Cyberpunk Noir (preto/vermelho)
- [x] Fontes: Chakra Petch, JetBrains Mono, Rajdhani
- [x] Interface responsiva mobile/desktop
- [x] Sidebar para desktop
- [x] Bottom navigation para mobile
- [x] Efeitos scanline e noise overlay

## Prioritized Backlog

### P0 (MVP Done)
- ✅ Autenticação
- ✅ Missões básicas
- ✅ Economia
- ✅ Gangues
- ✅ Bairros

### P1 (Next Phase)
- [ ] Sistema PVP assíncrono
- [ ] Guerras de gangues por territórios
- [ ] Sistema de veículos
- [ ] Sistema de propriedades
- [ ] Eventos globais/regionais
- [ ] NPCs com memória

### P2 (Future)
- [ ] Sistema de crafting
- [ ] Mercado entre jogadores
- [ ] Sistema de temporadas
- [ ] Sistema de conquistas detalhado
- [ ] Sistema de skills evolutivo
- [ ] Ciclo dia/noite
- [ ] Clima dinâmico

## Next Action Items
1. Implementar sistema PVP (ataques assíncronos)
2. Adicionar guerras de gangues por territórios
3. Implementar sistema de veículos text-based
4. Adicionar eventos globais da cidade
5. Melhorar sistema de conquistas

# SUBMUNDO - PRD (Product Requirements Document)

## Problem Statement
Criar um site-jogo totalmente funcional, inspirado em GTA Online, 100% text-based, com foco em crime, economia, gangues, progressão e decisões com consequências reais. O jogo deve funcionar perfeitamente em computador, tablet e smartphone.

## User Choices
- **Autenticação:** JWT (email/password)
- **Atualizações:** Polling simples (15s)
- **Escopo:** MVP completo + Novas features
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
- `/api/vehicles/*` - Sistema de veículos (NEW)
- `/api/wars/*` - Guerras de gangues (NEW)
- `/api/events/*` - Eventos da cidade (NEW)

### Frontend (React + Tailwind)
- `AuthContext` - Gestão de autenticação
- `GameContext` - Estado do jogo e polling
- Páginas: Login, Home, Map, Missions, Gang, Profile, Vehicles (NEW), Events (NEW)
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

### NEW: Sistema de Veículos ✅
- [x] Catálogo com 8 veículos (bicicleta a desportivo exótico)
- [x] Atributos: velocidade, furtividade, capacidade
- [x] Garagem pessoal
- [x] Comprar, ativar, reparar e vender veículos
- [x] Condição do veículo afeta performance
- [x] Custos de manutenção

### NEW: Guerras de Gangues ✅
- [x] Líderes podem iniciar guerras por territórios
- [x] Custo baseado no valor económico do bairro
- [x] Sistema de poder (membros × reputação)
- [x] Duração de 5 minutos com timer
- [x] Resolução com cálculo de sucesso
- [x] Conquista/defesa de territórios
- [x] Depósito no cofre da gangue

### NEW: Eventos da Cidade ✅
- [x] 8 tipos de eventos (Operação Policial, Festival, Apagão, etc.)
- [x] Efeitos: multiplicador heat, multiplicador recompensa, modificador risco
- [x] Máximo de 2 eventos simultâneos
- [x] Countdown com expiração automática
- [x] Efeitos combinados visíveis
- [x] Banner na Home quando eventos ativos

### UI/UX ✅
- [x] Design Cyberpunk Noir (preto/vermelho)
- [x] Fontes: Chakra Petch, JetBrains Mono, Rajdhani
- [x] Interface responsiva mobile/desktop
- [x] Sidebar para desktop (7 itens)
- [x] Bottom navigation para mobile
- [x] Efeitos scanline e noise overlay

## Prioritized Backlog

### P0 (Done)
- ✅ Autenticação
- ✅ Missões básicas
- ✅ Economia
- ✅ Gangues
- ✅ Bairros
- ✅ Veículos
- ✅ Guerras de Gangues
- ✅ Eventos da Cidade

### P1 (Next Phase)
- [ ] Sistema PVP assíncrono (ataques jogador vs jogador)
- [ ] NPCs com memória e relações
- [ ] Sistema de propriedades (casas, armazéns)
- [ ] Sistema de crafting de itens ilegais
- [ ] Mercado entre jogadores

### P2 (Future)
- [ ] Sistema de temporadas com rankings
- [ ] Sistema de conquistas detalhado
- [ ] Sistema de skills evolutivo
- [ ] Ciclo dia/noite
- [ ] Clima dinâmico
- [ ] História episódica

## Next Action Items
1. Implementar sistema PVP (ataques assíncronos)
2. Adicionar NPCs com memória
3. Sistema de propriedades compráveis
4. Mercado negro entre jogadores
5. Sistema de crafting

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
- `/api/vehicles/*` - Sistema de veículos
- `/api/wars/*` - Guerras de gangues
- `/api/events/*` - Eventos da cidade
- `/api/properties/*` - Sistema de propriedades
- `/api/businesses/*` - Sistema de negócios/crafting
- `/api/market/*` - Mercado Negro

### Frontend (React + Tailwind)
- `AuthContext` - Gestão de autenticação
- `GameContext` - Estado do jogo e polling
- Páginas: Landing, Login, Dashboard, Map, Missions, Gang, Profile, Vehicles, Events, Properties, Business, Market, News, FAQ, Terms, Privacy
- Responsivo: Sidebar (desktop) / Bottom Nav (mobile)

## What's Been Implemented

### Landing Page ✅ (Dezembro 2025)
- [x] **Navbar** - Menu fixo com navegação smooth scroll e botões login/registo
- [x] **Hero Section** - Banner principal com título, estatísticas e CTAs
- [x] **Features Section** - 6 características principais do jogo com ícones
- [x] **Screenshots Section** - Galeria com navegação de imagens
- [x] **Trailer Section** - Secção de vídeo com overlay de play
- [x] **Testimonials Section** - 4 reviews de jogadores com ratings
- [x] **FAQ Section** - 8 perguntas frequentes com accordion
- [x] **Newsletter Section** - Formulário de subscrição de email
- [x] **CTA Final** - Chamada para ação antes do footer
- [x] **Footer** - Links organizados, redes sociais e informações legais

### Core Systems ✅
- [x] Sistema de autenticação JWT
- [x] Dashboard principal com stats do jogador
- [x] Sistema de missões (8 tipos diferentes)
- [x] Sistema de bairros (10 bairros com stats únicos)
- [x] Sistema de gangues (criar, juntar, sair)
- [x] Sistema de heat policial
- [x] Sistema económico (dinheiro limpo/sujo)
- [x] Lavagem de dinheiro com risco
- [x] Ações rápidas (roubo, hustle, eventos)
- [x] Recompensa diária
- [x] Rankings globais
- [x] Perfil com estatísticas e histórico

### Sistema de Veículos ✅
- [x] Catálogo com 12 veículos
- [x] Atributos: velocidade, furtividade, capacidade
- [x] Garagem pessoal
- [x] Comprar, ativar, reparar e vender veículos
- [x] Condição do veículo afeta performance

### Guerras de Gangues ✅
- [x] Líderes podem iniciar guerras por territórios
- [x] Sistema de poder (membros × reputação)
- [x] Duração de 5 minutos com timer
- [x] Conquista/defesa de territórios

### Eventos da Cidade ✅
- [x] 12 tipos de eventos
- [x] Efeitos: multiplicador heat, multiplicador recompensa
- [x] Máximo de 2 eventos simultâneos

### Sistema de Propriedades ✅
- [x] 6 tipos de propriedades (Apartamento, Casa, Armazém, Fábrica, Mansão, Bunker)
- [x] Propriedades em bairros específicos
- [x] Rendimento passivo por hora
- [x] Sistema de condição e manutenção
- [x] Compra com preço baseado no valor económico do bairro
- [x] Coleta de rendimentos
- [x] Venda de propriedades

### Sistema de Negócios/Crafting ✅
- [x] 6 tipos de estabelecimentos em bairros específicos:
  - Laboratório (Favela) → Drogas sintéticas
  - Oficina Clandestina (Porto) → Armas modificadas
  - Falsificador (Centro) → Documentos falsos
  - Garage Tunning (Subúrbio) → Upgrades de veículos
  - Destilaria (Noite) → Bebidas ilegais
  - Centro de Hacking (Comercial) → Malware e dados
- [x] 18 receitas de crafting
- [x] Sistema de tempo de produção com skill bonus
- [x] Coleta de itens fabricados
- [x] Heat risk na produção

### Mercado Negro ✅
- [x] Mercado central para todos os jogadores
- [x] Venda de itens fabricados e de inventário
- [x] Taxa de 5% nas transações
- [x] Compra de itens de outros jogadores
- [x] Cancelamento de listagens
- [x] Estatísticas de mercado

### Páginas Informativas ✅
- [x] **Novidades** - Notícias e atualizações do jogo
- [x] **FAQ** - Perguntas frequentes organizadas por categoria
- [x] **Política de Privacidade** - RGPD compliant
- [x] **Termos e Condições** - Regras de conduta, penalizações, etc.
- [x] Endpoints públicos para news, faq e stats

### UI/UX ✅
- [x] Design Cyberpunk Noir (preto/vermelho)
- [x] Fontes: Chakra Petch, JetBrains Mono, Rajdhani
- [x] Interface responsiva mobile/desktop
- [x] Sidebar para desktop (11 itens + links legais)
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
- ✅ Sistema de Propriedades
- ✅ Sistema de Negócios/Crafting
- ✅ Mercado Negro
- ✅ Landing Page completa

### P1 (Next Phase)
- [ ] Sistema PVP assíncrono (ataques jogador vs jogador)
- [ ] NPCs com memória e relações
- [ ] Sistema de temporadas com rankings
- [ ] Sistema de conquistas detalhado
- [ ] Screenshots reais para a galeria da landing page
- [ ] Integração de vídeo real no trailer

### P2 (Future)
- [ ] Sistema de skills evolutivo
- [ ] Ciclo dia/noite
- [ ] Clima dinâmico
- [ ] História episódica

## Files Reference

### Landing Page
- `/app/frontend/src/pages/HomePage.js` - Landing page completa com todas as secções

### Frontend Pages
- `/app/frontend/src/pages/LoginPage.js` - Autenticação
- `/app/frontend/src/pages/NewsPage.js` - Novidades
- `/app/frontend/src/pages/FAQPage.js` - Perguntas frequentes
- `/app/frontend/src/pages/TermsPage.js` - Termos e condições
- `/app/frontend/src/pages/PrivacyPage.js` - Política de privacidade

### Core Components
- `/app/frontend/src/components/UI.js` - Componentes de UI reutilizáveis
- `/app/frontend/src/components/ProgressBar.js` - Barras de progresso e cards
- `/app/frontend/src/contexts/AuthContext.js` - Gestão de autenticação
- `/app/frontend/src/contexts/GameContext.js` - Estado do jogo

### Backend
- `/app/backend/server.py` - Servidor principal FastAPI
- `/app/backend/game_engine.py` - Lógica do jogo

## Next Action Items
1. Adicionar screenshots reais à galeria da landing page
2. Integrar vídeo de trailer real
3. Implementar sistema PVP (ataques assíncronos)
4. Adicionar NPCs com memória

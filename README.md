# SUBMUNDO - Jogo de Crime Organizado

> *"No submundo, a única lei é a sobrevivência."*

## 📖 Sobre o Jogo

SUBMUNDO é um RPG de crime organizado baseado em browser, ambientado em Lisboa. Os jogadores assumem o papel de criminosos que procuram subir na hierarquia do submundo, construindo impérios, formando gangues, e dominando territórios.

## 🛠️ Stack Tecnológica

- **Frontend:** React 18 + Tailwind CSS
- **Backend:** FastAPI (Python)
- **Base de Dados:** MongoDB
- **Autenticação:** JWT

---

## 🎮 Features Implementadas

### ✅ Features Completas (Com UI Funcional)

| Sistema | Página | Descrição |
|---------|--------|-----------|
| **Autenticação** | Login/Registo | Sistema completo de auth com JWT |
| **Dashboard** | HomePage | Stats, energia, dinheiro, ações rápidas, análise de nível, status policial, dicas |
| **Missões** | MissionsPage | Missões legais e criminais com timer |
| **Gangues** | GangPage | Criar/gerir gangue, membros, territórios, análise de guerras |
| **Veículos** | VehiclesPage | Comprar/vender veículos |
| **Propriedades** | PropertiesPage | Comprar propriedades, rendimentos |
| **Negócios** | BusinessPage | Negócios ilegais, crafting |
| **Mapa** | MapPage | Bairros com lore detalhada |
| **Mercado** | MarketPage | Mercado negro com preços dinâmicos |
| **Eventos** | EventsPage | Eventos da cidade, previsões, impacto |
| **Contactos** | ContactsPage | **NOVO** - NPCs, relacionamentos, interações |
| **Perfil** | ProfilePage | Skills, achievements, lavagem |
| **Clima/Tempo** | Header | Sistema dinâmico baseado na hora real |
| **Notoriedade** | ProfilePage | Ranks e benefícios |
| **Status Policial** | ProfilePage | Heat, alertas, unidades |
| **Heists** | MissionsPage | Assaltos complexos com múltiplas fases |
| **Missões Especiais** | MissionsPage | Missões geradas proceduralmente |
| **Lore de Bairros** | MapPage | Modal com história detalhada |

---

## 🆕 Novas Features (Última Actualização)

### 1. Sistema de Relacionamentos com NPCs ✅
**Página:** `ContactsPage.js`

**Funcionalidades:**
- Lista de todos os contactos/NPCs com níveis de relacionamento visual
- 7 níveis: Inimigo → Hostil → Desconfiado → Neutro → Amigável → Aliado → De Confiança
- Interações disponíveis: Dar Presente, Negociar, Pedir Favor, Partilhar Info
- Efeitos de relacionamento: modificadores de preço, qualidade de informação, chance de ajuda
- Histórico de interações por NPC
- Secção de rivais conhecidos com informações de ameaça

**Endpoints:**
- `GET /api/npcs/contacts` - Lista contactos com relacionamentos
- `GET /api/npcs/{id}/relationship` - Detalhes de relacionamento
- `POST /api/npcs/{id}/interact` - Interagir com NPC

---

### 2. Sistema de Economia Dinâmica ✅
**Integrado em:** `MarketPage.js`

**Funcionalidades:**
- Preços flutuantes por categoria (drogas, armas, documentos, etc.)
- Indicadores de tendência (subindo/descendo/estável)
- Visualização de oferta vs procura
- Preços afectados por eventos da cidade
- Mini-gráficos de supply/demand

**Endpoints:**
- `GET /api/economy/market-prices` - Preços dinâmicos actuais
- `GET /api/economy/price-history/{category}` - Histórico 24h
- `POST /api/economy/simulate-fluctuation` - Simular flutuação

---

### 3. Sistema de Territórios Avançado ✅
**Integrado em:** `GangPage.js` (tab Territórios)

**Funcionalidades:**
- Análise completa de poder da gangue
- Previsão de resultado de guerras (% de vitória)
- Comparação de poder militar antes de atacar
- Estimativa de perdas em caso de guerra
- Recomendações (Atacar/Evitar) baseadas em análise
- Visualização de todos os territórios com status

**Endpoints:**
- `GET /api/territories/analysis` - Análise completa com previsões
- `GET /api/territories/{id}/power` - Análise de território específico

---

### 4. Sistema de Eventos Dinâmicos ✅
**Integrado em:** `EventsPage.js`

**Funcionalidades:**
- 4 tabs: Ativos, Previsões, Impacto, Condições
- Eventos reactivos baseados no estado do jogo
- Previsões de eventos futuros com probabilidades
- Impacto personalizado no jogador (modificadores)
- Conselhos baseados em eventos activos
- Estatísticas da cidade em tempo real

**Endpoints:**
- `GET /api/events/dynamic` - Eventos potenciais baseados em condições
- `GET /api/events/impact` - Impacto dos eventos no jogador
- `GET /api/events/predictions` - Previsões de eventos futuros

---

### 5. Integração de gameLogic.js ✅
**Integrado em:** `HomePage.js`

**Sistemas agora activos:**
- `LevelSystem` - Títulos de nível, bónus por nível
- `HeatSystem` - Status de perigo, conselhos de heat
- `getTipsAndStrategies` - Dicas estratégicas na homepage

---

### 6. Integração de lore.js ✅
**Integrado em:** Múltiplas páginas

**Dados agora activos:**
- `QUOTES` - Citações de sabedoria na homepage e eventos
- `IMPORTANT_NPCS` - Informações de contactos e rivais
- `GANGS_LORE` - Regras de guerra na GangPage
- `EVENTS_LORE` - Dicas de eventos na EventsPage
- `getRandomWisdomQuote()` - Citações aleatórias

---

## 💰 Sistema Económico (Rebalanceado)

### Filosofia do Rebalanceamento
A economia foi completamente revista para proporcionar uma progressão mais desafiante e gratificante.

### Valores Económicos

#### Recompensas de Missões
| Missão | Antes | Depois | Mudança |
|--------|-------|--------|---------|
| Roubo de Carteira | €50-150 | €20-80 | -50% |
| Assalto a Loja | €500-2000 | €250-800 | -60% |
| Hacking Bancário | €800-3000 | €400-1200 | -60% |
| Assalto a Banco | €5000-20000 | €2000-8000 | -60% |
| Trabalho Honesto | €100-250 | €40-120 | -55% |

#### Veículos
| Veículo | Antes | Depois | Mudança |
|---------|-------|--------|---------|
| Bicicleta | €500 | €800 | +60% |
| Scooter | €2000 | €5000 | +150% |
| Carro Usado | €5000 | €15000 | +200% |
| Mota Desportiva | €15000 | €35000 | +133% |
| Sedan Luxo | €30000 | €75000 | +150% |
| SUV Blindado | €50000 | €120000 | +140% |
| Desportivo Exótico | €100000 | €250000 | +150% |
| Supercar | €200000 | €500000 | +150% |

#### Propriedades
| Propriedade | Preço Antes | Preço Depois | Rendimento/h |
|-------------|-------------|--------------|--------------|
| Apartamento | €5000 | €15000 | €25 (era €50) |
| Casa | €15000 | €40000 | €60 (era €120) |
| Armazém | €25000 | €65000 | €100 (era €200) |
| Fábrica | €50000 | €120000 | €200 (era €400) |
| Mansão | €100000 | €250000 | €400 (era €800) |
| Bunker | €75000 | €180000 | €250 (era €500) |

#### Negócios
| Negócio | Antes | Depois |
|---------|-------|--------|
| Laboratório | €30000 | €75000 |
| Oficina | €40000 | €95000 |
| Falsificador | €35000 | €85000 |
| Garage | €45000 | €110000 |
| Destilaria | €25000 | €60000 |
| Centro Hacking | €50000 | €125000 |

#### Sistema Económico Geral
| Parâmetro | Antes | Depois |
|-----------|-------|--------|
| Dinheiro inicial | €1000 | €250 |
| Daily reward | €100-500 | €30-150 |
| Taxa mercado | 5% | 10% |
| Taxa lavagem | 20-40% | 30-50% |
| Margem crafting | ~200% | ~50-70% |

---

## 🔌 API Endpoints

### Autenticação
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/api/auth/register` | Registar novo jogador |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Dados do jogador actual |

### Jogo Principal
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/game-state` | Estado completo com modificadores |
| GET | `/api/weather` | Clima e tempo actuais |
| GET | `/api/notoriety` | Notoriedade do jogador |
| GET | `/api/police-status` | Status policial |

### NPCs e Relacionamentos (NOVO)
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/npcs/contacts` | Lista de contactos com relacionamentos |
| GET | `/api/npcs/{id}/relationship` | Detalhes de relacionamento |
| POST | `/api/npcs/{id}/interact` | Interagir com NPC |

### Economia Dinâmica (NOVO)
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/economy/market-prices` | Preços dinâmicos do mercado |
| GET | `/api/economy/price-history/{cat}` | Histórico de preços |
| POST | `/api/economy/simulate-fluctuation` | Simular flutuação |

### Territórios Avançados (NOVO)
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/territories/analysis` | Análise completa de territórios |
| GET | `/api/territories/{id}/power` | Poder de território específico |

### Eventos Dinâmicos (NOVO)
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/events/dynamic` | Eventos baseados em condições |
| GET | `/api/events/impact` | Impacto no jogador |
| GET | `/api/events/predictions` | Previsões de eventos |

### Missões
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/missions` | Missões activas |
| POST | `/api/missions/start` | Iniciar missão |
| POST | `/api/missions/{id}/complete` | Completar missão |
| GET | `/api/procedural-missions` | Missões geradas |

### Heists
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/heists` | Lista de heists |
| POST | `/api/heists/{id}/start` | Iniciar heist |
| POST | `/api/heists/session/{id}/phase` | Executar fase |

### Lore
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/lore/neighborhoods/{id}` | Lore de bairro |

### Outros
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/neighborhoods` | Lista de bairros |
| GET | `/api/vehicles/catalog` | Veículos disponíveis |
| GET | `/api/events` | Eventos activos |
| GET | `/api/faq` | Perguntas frequentes |
| GET | `/api/news` | Novidades |

---

## 📂 Estrutura do Projecto

```
/app
├── backend/
│   ├── server.py           # API principal (~4200 linhas)
│   ├── game_engine.py      # Lógica avançada (~1400 linhas)
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── components/     # Componentes reutilizáveis
│   │   ├── contexts/       # AuthContext, GameContext
│   │   ├── data/
│   │   │   └── lore.js     # Dados de lore (~1370 linhas) ✅ INTEGRADO
│   │   ├── hooks/          # Custom hooks
│   │   ├── pages/          # Páginas da aplicação
│   │   │   ├── ContactsPage.js  # NOVO - NPCs e relacionamentos
│   │   │   ├── EventsPage.js    # ACTUALIZADO - 4 tabs
│   │   │   ├── GangPage.js      # ACTUALIZADO - Análise territórios
│   │   │   ├── HomePage.js      # ACTUALIZADO - gameLogic integrado
│   │   │   └── MarketPage.js    # ACTUALIZADO - Preços dinâmicos
│   │   └── utils/
│   │       └── gameLogic.js # Lógica frontend (~890 linhas) ✅ INTEGRADO
│   └── package.json
│
└── README.md               # Esta documentação
```

---

## 🚀 Como Correr

### Backend
```bash
cd /app/backend
pip install -r requirements.txt
sudo supervisorctl restart backend
```

### Frontend
```bash
cd /app/frontend
yarn install
sudo supervisorctl restart frontend
```

### Verificar Status
```bash
sudo supervisorctl status
```

---

## 📊 Estatísticas do Código

| Componente | Linhas | Status |
|------------|--------|--------|
| Backend (server.py) | ~4200 | ✅ Actualizado |
| Game Engine (game_engine.py) | ~1415 | ✅ Integrado |
| Game Logic (gameLogic.js) | ~890 | ✅ Integrado |
| Lore Data (lore.js) | ~1373 | ✅ Integrado |
| **Total de Código** | **~7878** | |

---

## 🎯 Roadmap de Desenvolvimento

### Fase 1 - Core ✅
- [x] Sistema de autenticação
- [x] Dashboard e stats
- [x] Missões básicas
- [x] Sistema de gangues
- [x] Veículos e propriedades

### Fase 2 - Avançado ✅
- [x] Sistema de clima/tempo
- [x] Sistema de notoriedade
- [x] Status policial
- [x] Heists com múltiplas fases
- [x] Missões procedurais
- [x] Lore de bairros

### Fase 3 - Sistemas Avançados ✅
- [x] Sistema de relacionamentos com NPCs
- [x] Economia dinâmica com preços flutuantes
- [x] Controlo territorial avançado
- [x] Eventos dinâmicos reactivos
- [x] Integração completa de gameLogic.js
- [x] Integração completa de lore.js
- [x] Rebalanceamento económico

### Fase 4 - Futuras Melhorias 🔄
- [ ] Sistema de PvP directo
- [ ] Leilões no mercado negro
- [ ] Missões cooperativas
- [ ] Sistema de reputação entre jogadores
- [ ] Eventos sazonais

---

## 📝 Notas de Desenvolvimento

- Todos os sistemas de backend estão funcionais e testados
- A economia foi rebalanceada para progressão mais desafiante
- gameLogic.js e lore.js estão agora integrados nas páginas relevantes
- O sistema de relacionamentos permite interacções significativas com NPCs
- Previsões de guerras ajudam na tomada de decisões estratégicas

---

*Última actualização: Julho 2025*

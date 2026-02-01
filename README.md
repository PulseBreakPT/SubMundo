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
| **Dashboard** | HomePage | Stats, energia, dinheiro, ações rápidas |
| **Missões** | MissionsPage | Missões legais e criminais com timer |
| **Gangues** | GangPage | Criar/gerir gangue, membros, territórios |
| **Veículos** | VehiclesPage | Comprar/vender veículos |
| **Propriedades** | PropertiesPage | Comprar propriedades, rendimentos |
| **Negócios** | BusinessPage | Negócios ilegais, crafting |
| **Mapa** | MapPage | Bairros com lore detalhada |
| **Mercado** | MarketPage | Mercado negro entre jogadores |
| **Eventos** | EventsPage | Eventos da cidade |
| **Perfil** | ProfilePage | Skills, achievements, lavagem |
| **Clima/Tempo** | Header | Sistema dinâmico baseado na hora real |
| **Notoriedade** | ProfilePage | Ranks e benefícios |
| **Status Policial** | ProfilePage | Heat, alertas, unidades |
| **Heists** | MissionsPage | Assaltos complexos com múltiplas fases |
| **Missões Especiais** | MissionsPage | Missões geradas proceduralmente |
| **Lore de Bairros** | MapPage | Modal com história detalhada |

---

## ⚠️ Features Pendentes (Backend Pronto, Falta UI)

### 1. Sistema de Relacionamentos com NPCs
**Arquivo:** `backend/game_engine.py` → `RelationshipSystem`

**O que existe:**
- Níveis de relacionamento (Enemy → Trusted)
- Cálculo de efeitos por nível (preços, traição, qualidade de info)
- Sistema de mudança de relacionamento por ações

**O que falta no Frontend:**
- Página de Contactos/NPCs
- Lista de NPCs conhecidos com níveis de confiança
- Interações disponíveis por NPC
- Histórico de transações

---

### 2. Sistema de Economia Dinâmica
**Arquivo:** `backend/game_engine.py` → `DynamicEconomySystem`

**O que existe:**
- Cálculo de preços baseado em oferta/procura
- Simulação de flutuações de mercado
- Taxa de inflação do jogo
- Modificadores por bairro e eventos

**O que falta no Frontend:**
- Preços flutuantes no Mercado
- Indicador de tendência de preços (subindo/descendo)
- Gráfico de histórico de preços
- Alertas de boas oportunidades

---

### 3. Sistema de Controlo Territorial Avançado
**Arquivo:** `backend/game_engine.py` → `TerritoryControlSystem`

**O que existe:**
- Cálculo de rendimento de territórios
- Cálculo de poder militar de gangues
- Simulação de resultado de guerras
- Bónus de defesa territorial

**O que falta no Frontend:**
- Previsão de resultado de guerras antes de declarar
- Visualização de poder militar da gangue
- Comparação de forças com gangue alvo
- Estimativa de perdas em caso de guerra

---

### 4. Sistema de Eventos Dinâmicos
**Arquivo:** `backend/game_engine.py` → `DynamicEventSystem`

**O que existe:**
- Triggers baseados no estado do jogo
- Eventos condicionais (crime alto → crackdown)
- Cálculo de impacto de eventos por jogador
- Sistema de probabilidades

**O que falta no Frontend:**
- Eventos que aparecem baseados em condições reais
- Notificações de eventos a começar
- Previsão de eventos futuros
- Conselhos baseados em eventos activos

---

## 📁 Arquivos de Lógica Não Utilizados

### `frontend/src/utils/gameLogic.js` (867 linhas)
**Status:** ❌ Não importado em nenhuma página

**Sistemas disponíveis:**
```javascript
- GAME_CONSTANTS      // Constantes do jogo
- LevelSystem         // Cálculos de XP, níveis, títulos
- HeatSystem          // Níveis de perigo, modificadores
- EconomySystem       // Formatação, lavagem, rendimentos
- MissionSystem       // Cálculo de sucesso, recomendações
- VehicleSystem       // Stats, reparação, adequação
- GangSystem          // Poder, guerras, contribuições
- TimeSystem          // Formatação, countdown
- NotificationSystem  // Mensagens dinâmicas
- Validators          // Validação de inputs
```

**Como usar:**
```javascript
import { LevelSystem, HeatSystem } from '../utils/gameLogic';

// Exemplo: Calcular título do nível
const title = LevelSystem.getLevelTitle(player.level);

// Exemplo: Obter conselhos de heat
const advice = HeatSystem.getHeatAdvice(player.heat_individual);
```

---

### `frontend/src/data/lore.js` (1373 linhas)
**Status:** ❌ Não importado em nenhuma página

**Dados disponíveis:**
```javascript
- GAME_LORE           // História principal, timeline
- NEIGHBORHOODS_LORE  // Lore detalhada de bairros
- GANGS_LORE          // Informações de gangues
- VEHICLES_LORE       // História dos veículos
- MISSIONS_LORE       // Sistema de missões
- ECONOMY_LORE        // Sistema económico
- EVENTS_LORE         // Tipos de eventos
- PROGRESSION_LORE    // Níveis e progressão
- TIPS_AND_STRATEGIES // Dicas para jogadores
- IMPORTANT_NPCS      // Contactos e rivais
- QUOTES              // Citações para loading
- GLOSSARY            // Termos do submundo
```

**Como usar:**
```javascript
import { QUOTES, GLOSSARY, getRandomLoadingQuote } from '../data/lore';

// Exemplo: Citação aleatória
const quote = getRandomLoadingQuote();

// Exemplo: Obter termo do glossário
const term = GLOSSARY.terms.find(t => t.term === 'Heat');
```

---

## 📋 Lore Pendente de Integração

| Dados | Onde Mostrar | Descrição |
|-------|--------------|-----------|
| `GAME_LORE` | Página "Sobre" ou Intro | História principal do jogo |
| `GANGS_LORE` | GangPage | Info detalhada de gangues existentes |
| `VEHICLES_LORE` | VehiclesPage | História e contexto de cada veículo |
| `TIPS_AND_STRATEGIES` | HomePage ou FAQ | Dicas para iniciantes e avançados |
| `IMPORTANT_NPCS` | Nova página "Contactos" | Lista de NPCs com serviços |
| `QUOTES` | Loading screens | Citações temáticas |
| `GLOSSARY` | FAQ ou página dedicada | Definições de termos do jogo |

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
| GET | `/api/vehicles` | Veículos disponíveis |
| GET | `/api/events` | Eventos activos |
| GET | `/api/faq` | Perguntas frequentes |
| GET | `/api/news` | Novidades |

---

## 📂 Estrutura do Projecto

```
/app
├── backend/
│   ├── server.py           # API principal (~3800 linhas)
│   ├── game_engine.py      # Lógica avançada (~1400 linhas)
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── components/     # Componentes reutilizáveis
│   │   ├── contexts/       # AuthContext, GameContext
│   │   ├── data/
│   │   │   └── lore.js     # Dados de lore (~1370 linhas)
│   │   ├── hooks/          # Custom hooks
│   │   ├── pages/          # Páginas da aplicação
│   │   └── utils/
│   │       └── gameLogic.js # Lógica frontend (~870 linhas)
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

| Componente | Linhas |
|------------|--------|
| Backend (server.py) | ~3800 |
| Game Engine (game_engine.py) | ~1415 |
| Game Logic (gameLogic.js) | ~867 |
| Lore Data (lore.js) | ~1373 |
| **Total de Lógica Adicional** | **~3655** |

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

### Fase 3 - Pendente 🔄
- [ ] Sistema de relacionamentos com NPCs
- [ ] Economia dinâmica com preços flutuantes
- [ ] Controlo territorial avançado
- [ ] Eventos dinâmicos reactivos
- [ ] Integração completa de gameLogic.js
- [ ] Integração completa de lore.js

---

## 📝 Notas de Desenvolvimento

- Os ficheiros `gameLogic.js` e `lore.js` contêm lógica e dados prontos a usar
- Basta importar nas páginas relevantes para activar as features
- O backend já tem os sistemas implementados, falta criar os endpoints específicos para alguns
- A arquitectura está preparada para expansão modular

---

*Última actualização: Fevereiro 2026*

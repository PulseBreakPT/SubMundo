/**
 * SUBMUNDO - Advanced Game Logic System
 * =====================================
 * Sistema avançado de lógica de jogo para o frontend.
 * Inclui cálculos, formatação, helpers e lógica de UI.
 */

// ============================================================================
// CONSTANTES DO JOGO
// ============================================================================

export const GAME_CONSTANTS = {
  // Níveis
  MAX_LEVEL: 100,
  XP_BASE: 100,
  XP_MULTIPLIER: 1.15,
  
  // Energia
  ENERGY_REGEN_RATE: 1, // por minuto
  MAX_ENERGY: 100,
  
  // Heat
  HEAT_DECAY_RATE: 1, // por 5 minutos
  MAX_HEAT: 100,
  CRITICAL_HEAT: 80,
  
  // Dinheiro
  LAUNDER_FEE_MIN: 0.20,
  LAUNDER_FEE_MAX: 0.40,
  MARKET_FEE: 0.05,
  
  // Missões
  MISSION_COOLDOWN_BASE: 30, // segundos
  
  // Propriedades
  PROPERTY_MAINTENANCE_INTERVAL: 24, // horas
  PROPERTY_INCOME_INTERVAL: 1, // hora
  
  // Gangues
  MIN_GANG_MEMBERS_FOR_WAR: 3,
  WAR_DURATION_MINUTES: 5,
  TERRITORY_CONTROL_BONUS: 1.2,
};

// ============================================================================
// SISTEMA DE NÍVEIS E EXPERIÊNCIA
// ============================================================================

export const LevelSystem = {
  /**
   * Calcula XP necessário para um nível específico
   */
  calculateXPForLevel(level) {
    return Math.floor(
      GAME_CONSTANTS.XP_BASE * 
      Math.pow(GAME_CONSTANTS.XP_MULTIPLIER, level - 1)
    );
  },

  /**
   * Calcula nível baseado no XP total
   */
  calculateLevelFromXP(totalXP) {
    let level = 1;
    let xpRequired = GAME_CONSTANTS.XP_BASE;
    let xpAccumulated = 0;

    while (xpAccumulated + xpRequired <= totalXP && level < GAME_CONSTANTS.MAX_LEVEL) {
      xpAccumulated += xpRequired;
      level++;
      xpRequired = this.calculateXPForLevel(level);
    }

    return {
      level,
      currentXP: totalXP - xpAccumulated,
      xpForNextLevel: xpRequired,
      progress: ((totalXP - xpAccumulated) / xpRequired) * 100
    };
  },

  /**
   * Calcula bónus de nível para várias mecânicas
   */
  getLevelBonuses(level) {
    return {
      missionSuccessBonus: Math.min(20, level * 0.5),
      rewardBonus: 1 + (level * 0.02),
      energyRegenBonus: Math.floor(level / 10),
      maxEnergyBonus: Math.floor(level / 5) * 5,
      reputationMultiplier: 1 + (level * 0.01),
      skillPointsPerLevel: 1 + Math.floor(level / 10)
    };
  },

  /**
   * Retorna título/rank baseado no nível
   */
  getLevelTitle(level) {
    const titles = [
      { min: 1, max: 4, title: "Novato", color: "text-text-secondary" },
      { min: 5, max: 9, title: "Soldado de Rua", color: "text-text-primary" },
      { min: 10, max: 14, title: "Operador", color: "text-success" },
      { min: 15, max: 19, title: "Veterano", color: "text-warning" },
      { min: 20, max: 29, title: "Capo", color: "text-primary" },
      { min: 30, max: 39, title: "Tenente", color: "text-purple-400" },
      { min: 40, max: 49, title: "Chefe", color: "text-gold" },
      { min: 50, max: 74, title: "Padrinho", color: "text-red-500" },
      { min: 75, max: 99, title: "Lenda", color: "text-cyan-400" },
      { min: 100, max: 100, title: "Rei do Submundo", color: "text-gradient" }
    ];

    const tier = titles.find(t => level >= t.min && level <= t.max);
    return tier || titles[0];
  }
};

// ============================================================================
// SISTEMA DE HEAT (CALOR POLICIAL)
// ============================================================================

export const HeatSystem = {
  /**
   * Calcula nível de perigo baseado no heat
   */
  getDangerLevel(heat) {
    if (heat >= 80) return { level: "critical", label: "CRÍTICO", color: "error", pulse: true };
    if (heat >= 60) return { level: "high", label: "ALTO", color: "error", pulse: false };
    if (heat >= 40) return { level: "medium", label: "MÉDIO", color: "warning", pulse: false };
    if (heat >= 20) return { level: "low", label: "BAIXO", color: "primary", pulse: false };
    return { level: "safe", label: "SEGURO", color: "success", pulse: false };
  },

  /**
   * Calcula modificadores de heat para missões
   */
  getHeatModifiers(heat) {
    const dangerLevel = this.getDangerLevel(heat);
    
    return {
      missionRiskIncrease: Math.floor(heat / 10),
      rewardPenalty: heat >= 60 ? 0.1 * Math.floor((heat - 50) / 10) : 0,
      escapeChanceReduction: heat >= 40 ? Math.floor((heat - 30) / 10) * 5 : 0,
      policeAttentionChance: Math.min(heat, 80),
      launderRiskIncrease: Math.floor(heat / 20) * 5,
      ...dangerLevel
    };
  },

  /**
   * Calcula tempo para heat baixar naturalmente
   */
  calculateHeatDecayTime(currentHeat, targetHeat = 0) {
    const heatDifference = currentHeat - targetHeat;
    const decayMinutes = (heatDifference / GAME_CONSTANTS.HEAT_DECAY_RATE) * 5;
    
    return {
      minutes: Math.ceil(decayMinutes),
      formatted: formatTimeRemaining(decayMinutes * 60)
    };
  },

  /**
   * Retorna dicas baseadas no nível de heat
   */
  getHeatAdvice(heat) {
    if (heat >= 80) {
      return [
        "Evita QUALQUER actividade criminosa",
        "Considera pagar um suborno se tiveres contacto corrupto",
        "Trabalhos legais são a única opção segura",
        "Muda de bairro se possível"
      ];
    }
    if (heat >= 60) {
      return [
        "Apenas missões de baixo risco",
        "Evita bairros com alta presença policial",
        "Considera fazer trabalhos legais",
        "Mantém-te discreto"
      ];
    }
    if (heat >= 40) {
      return [
        "Missões de risco médio são possíveis",
        "Evita assaltos a bancos ou sequestros",
        "Usa veículos com boa furtividade"
      ];
    }
    return [
      "Campo livre para operações",
      "Boa altura para missões lucrativas",
      "Aproveita enquanto o heat está baixo"
    ];
  }
};

// ============================================================================
// SISTEMA DE ECONOMIA
// ============================================================================

export const EconomySystem = {
  /**
   * Formata valor monetário
   */
  formatMoney(value, compact = false) {
    if (compact) {
      if (value >= 1000000) return `€${(value / 1000000).toFixed(1)}M`;
      if (value >= 1000) return `€${(value / 1000).toFixed(1)}k`;
      return `€${value.toFixed(0)}`;
    }
    return `€${value.toLocaleString('pt-PT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  },

  /**
   * Calcula taxa de lavagem baseada no jogador
   */
  calculateLaunderFee(playerStats, amount) {
    const baseMin = GAME_CONSTANTS.LAUNDER_FEE_MIN;
    const baseMax = GAME_CONSTANTS.LAUNDER_FEE_MAX;
    
    // Skill de negociação reduz taxa
    const negotiationSkill = playerStats.skills?.negotiation?.level || 0;
    const skillReduction = negotiationSkill * 0.015; // 1.5% por nível
    
    // Ter propriedades comerciais reduz taxa
    const hasBusinesses = (playerStats.businesses?.length || 0) > 0;
    const businessReduction = hasBusinesses ? 0.05 : 0;
    
    const minFee = Math.max(0.10, baseMin - skillReduction - businessReduction);
    const maxFee = Math.max(minFee + 0.05, baseMax - skillReduction - businessReduction);
    
    // Taxa varia entre min e max
    const actualFee = minFee + (Math.random() * (maxFee - minFee));
    
    return {
      feePercent: actualFee * 100,
      feeAmount: amount * actualFee,
      cleanAmount: amount * (1 - actualFee),
      riskPercent: playerStats.heat_individual || 0
    };
  },

  /**
   * Calcula rendimento de propriedade
   */
  calculatePropertyIncome(property, playerStats) {
    const baseIncome = property.income_per_hour || 0;
    
    // Condição afeta rendimento
    const conditionModifier = (property.condition || 100) / 100;
    
    // Bónus de nível do bairro
    const neighborhoodBonus = (property.neighborhood_value || 50) / 100;
    
    // Bónus de skill de negociação
    const negotiationBonus = 1 + ((playerStats.skills?.negotiation?.level || 0) * 0.02);
    
    const hourlyIncome = baseIncome * conditionModifier * neighborhoodBonus * negotiationBonus;
    
    return {
      hourly: hourlyIncome,
      daily: hourlyIncome * 24,
      weekly: hourlyIncome * 24 * 7,
      monthly: hourlyIncome * 24 * 30,
      conditionPenalty: (1 - conditionModifier) * 100
    };
  },

  /**
   * Calcula custo de manutenção
   */
  calculateMaintenanceCost(items) {
    let totalDaily = 0;
    
    items.forEach(item => {
      if (item.type === 'property') {
        totalDaily += item.maintenance_cost || 0;
      } else if (item.type === 'vehicle') {
        totalDaily += (item.maintenance_cost || 0) * 0.1; // Por uso estimado
      } else if (item.type === 'business') {
        totalDaily += item.maintenance_cost || 0;
      }
    });
    
    return {
      daily: totalDaily,
      weekly: totalDaily * 7,
      monthly: totalDaily * 30
    };
  }
};

// ============================================================================
// SISTEMA DE MISSÕES
// ============================================================================

export const MissionSystem = {
  /**
   * Calcula chance de sucesso de uma missão
   */
  calculateSuccessChance(mission, playerStats, vehicle, activeItems = []) {
    let baseChance = 70;
    
    // Ajuste por risco da missão
    baseChance -= mission.risk * 5;
    
    // Bónus de nível
    baseChance += playerStats.level * 2;
    
    // Penalidade de heat
    baseChance -= Math.floor(playerStats.heat_individual / 10);
    
    // Bónus de skill relevante
    if (mission.skill_bonus) {
      const skillLevel = playerStats.skills?.[mission.skill_bonus]?.level || 0;
      baseChance += skillLevel * 3;
    }
    
    // Bónus de veículo
    if (vehicle) {
      if (mission.category === 'escape' || mission.skill_bonus === 'driving') {
        baseChance += vehicle.speed * 2;
      }
      if (mission.category === 'stealth') {
        baseChance += vehicle.stealth * 2;
      }
    }
    
    // Bónus de itens activos
    activeItems.forEach(item => {
      if (item.effect?.stealth_bonus) baseChance += item.effect.stealth_bonus;
      if (item.effect?.lockpicking_bonus && mission.skill_bonus === 'lockpicking') {
        baseChance += item.effect.lockpicking_bonus * 3;
      }
    });
    
    return Math.max(10, Math.min(95, baseChance));
  },

  /**
   * Estima recompensa de uma missão
   */
  estimateReward(mission, playerStats, activeEvents = []) {
    const { reward_min, reward_max } = mission;
    
    // Multiplicador base
    let multiplier = 1.0;
    
    // Bónus de negociação
    const negotiationLevel = playerStats.skills?.negotiation?.level || 0;
    multiplier += negotiationLevel * 0.05;
    
    // Multiplicador de eventos
    activeEvents.forEach(event => {
      if (event.effects?.reward_multiplier) {
        multiplier *= event.effects.reward_multiplier;
      }
    });
    
    return {
      min: Math.floor(reward_min * multiplier),
      max: Math.floor(reward_max * multiplier),
      average: Math.floor(((reward_min + reward_max) / 2) * multiplier),
      multiplier
    };
  },

  /**
   * Calcula eficiência de energia para uma missão
   */
  calculateEnergyEfficiency(mission, estimatedReward) {
    const avgReward = estimatedReward.average;
    const energyCost = mission.energy_cost;
    
    const rewardPerEnergy = avgReward / energyCost;
    
    let rating;
    if (rewardPerEnergy >= 50) rating = { stars: 5, label: "Excelente" };
    else if (rewardPerEnergy >= 30) rating = { stars: 4, label: "Bom" };
    else if (rewardPerEnergy >= 20) rating = { stars: 3, label: "Normal" };
    else if (rewardPerEnergy >= 10) rating = { stars: 2, label: "Fraco" };
    else rating = { stars: 1, label: "Mau" };
    
    return {
      rewardPerEnergy,
      ...rating
    };
  },

  /**
   * Retorna missões recomendadas baseado no estado do jogador
   */
  getRecommendedMissions(allMissions, playerStats) {
    const heat = playerStats.heat_individual || 0;
    const energy = playerStats.energy || 0;
    const level = playerStats.level || 1;
    
    return allMissions
      .filter(m => m.energy_cost <= energy)
      .map(mission => {
        let score = 0;
        
        // Penaliza se heat alto e missão arriscada
        if (heat > 50 && mission.risk > 5) score -= 50;
        if (heat > 70 && mission.category === 'crime') score -= 100;
        
        // Bónus para missões com skill que o jogador tem
        if (mission.skill_bonus) {
          const skillLevel = playerStats.skills?.[mission.skill_bonus]?.level || 0;
          score += skillLevel * 10;
        }
        
        // Bónus para missões apropriadas ao nível
        const levelDiff = Math.abs(level - (mission.recommended_level || 1));
        score -= levelDiff * 5;
        
        // Eficiência de energia
        const avgReward = (mission.reward_min + mission.reward_max) / 2;
        score += (avgReward / mission.energy_cost) * 2;
        
        return { ...mission, recommendationScore: score };
      })
      .sort((a, b) => b.recommendationScore - a.recommendationScore);
  }
};

// ============================================================================
// SISTEMA DE VEÍCULOS
// ============================================================================

export const VehicleSystem = {
  /**
   * Calcula stats efetivos de um veículo
   */
  calculateEffectiveStats(vehicle) {
    const conditionModifier = (vehicle.condition || 100) / 100;
    
    return {
      effectiveSpeed: Math.floor(vehicle.speed * conditionModifier),
      effectiveStealth: Math.floor(vehicle.stealth * conditionModifier),
      effectiveCapacity: vehicle.capacity, // Capacidade não afetada por condição
      conditionPenalty: Math.floor((1 - conditionModifier) * 100)
    };
  },

  /**
   * Calcula custo de reparação
   */
  calculateRepairCost(vehicle) {
    const damagePercent = 100 - (vehicle.condition || 100);
    const baseCost = vehicle.maintenance_cost || 100;
    
    return Math.floor(baseCost * (damagePercent / 10));
  },

  /**
   * Calcula valor de revenda
   */
  calculateResellValue(vehicle) {
    const basePrice = vehicle.price || 0;
    const conditionModifier = (vehicle.condition || 100) / 100;
    
    // 50% do preço base, ajustado pela condição
    return Math.floor(basePrice * 0.5 * conditionModifier);
  },

  /**
   * Retorna classe do veículo para styling
   */
  getVehicleClass(category) {
    const classes = {
      basic: { color: "text-text-secondary", bg: "bg-surface-highlight" },
      standard: { color: "text-text-primary", bg: "bg-surface" },
      sport: { color: "text-warning", bg: "bg-warning/10" },
      luxury: { color: "text-gold", bg: "bg-gold/10" },
      armored: { color: "text-error", bg: "bg-error/10" },
      utility: { color: "text-success", bg: "bg-success/10" },
      exotic: { color: "text-purple-400", bg: "bg-purple-400/10" },
      custom: { color: "text-primary", bg: "bg-primary/10" }
    };
    
    return classes[category] || classes.standard;
  },

  /**
   * Verifica se veículo é adequado para uma missão
   */
  isVehicleSuitableForMission(vehicle, mission) {
    const requirements = {
      high_speed: 7,
      high_stealth: 6,
      high_capacity: 10
    };
    
    const issues = [];
    
    if (mission.requires_speed && vehicle.speed < requirements.high_speed) {
      issues.push(`Velocidade insuficiente (${vehicle.speed}/${requirements.high_speed})`);
    }
    
    if (mission.requires_stealth && vehicle.stealth < requirements.high_stealth) {
      issues.push(`Furtividade insuficiente (${vehicle.stealth}/${requirements.high_stealth})`);
    }
    
    if (mission.cargo_amount && vehicle.capacity < mission.cargo_amount) {
      issues.push(`Capacidade insuficiente (${vehicle.capacity}/${mission.cargo_amount})`);
    }
    
    return {
      suitable: issues.length === 0,
      issues
    };
  }
};

// ============================================================================
// SISTEMA DE GANGUES
// ============================================================================

export const GangSystem = {
  /**
   * Calcula poder total de uma gangue
   */
  calculateGangPower(gang, members = []) {
    let power = 0;
    
    // Poder base por membro
    members.forEach(member => {
      power += 10; // Base
      power += (member.level || 1) * 2;
      power += (member.reputation || 0) / 10;
      
      // Skills de combate
      const combatSkill = member.skills?.combat?.level || 0;
      const intimidationSkill = member.skills?.intimidation?.level || 0;
      power += combatSkill * 3;
      power += intimidationSkill * 2;
    });
    
    // Bónus de tesouro
    power += Math.min(100, (gang.treasury || 0) / 1000);
    
    // Bónus de territórios
    power += (gang.territories?.length || 0) * 20;
    
    // Bónus de reputação da gangue
    power += (gang.reputation || 0) / 5;
    
    return Math.floor(power);
  },

  /**
   * Calcula custo para declarar guerra
   */
  calculateWarCost(targetTerritory, attackerGang) {
    const territoryValue = targetTerritory.economic_value || 50;
    const baseCost = territoryValue * 100;
    
    // Desconto se tiver muitos territórios
    const territoryDiscount = Math.min(0.3, (attackerGang.territories?.length || 0) * 0.05);
    
    return Math.floor(baseCost * (1 - territoryDiscount));
  },

  /**
   * Simula resultado de guerra (previsão)
   */
  predictWarOutcome(attackerPower, defenderPower) {
    // Defensor tem bónus de 20%
    const adjustedDefender = defenderPower * GAME_CONSTANTS.TERRITORY_CONTROL_BONUS;
    
    const totalPower = attackerPower + adjustedDefender;
    const attackerChance = (attackerPower / totalPower) * 100;
    
    let prediction;
    if (attackerChance >= 70) prediction = { label: "Vitória Provável", color: "success" };
    else if (attackerChance >= 50) prediction = { label: "Equilibrado", color: "warning" };
    else if (attackerChance >= 30) prediction = { label: "Arriscado", color: "error" };
    else prediction = { label: "Muito Arriscado", color: "error" };
    
    return {
      attackerChance: Math.round(attackerChance),
      defenderChance: Math.round(100 - attackerChance),
      ...prediction
    };
  },

  /**
   * Calcula contribuição mínima sugerida para tesouro
   */
  calculateSuggestedContribution(member, gang) {
    const memberWealth = (member.clean_money || 0) + (member.dirty_money || 0);
    const gangTreasury = gang.treasury || 0;
    const memberCount = gang.members_count || 1;
    
    // Sugestão: 5% da riqueza ou quota justa para objectivo
    const percentageContribution = memberWealth * 0.05;
    const fairShare = gangTreasury / memberCount;
    
    return Math.max(100, Math.min(percentageContribution, fairShare));
  }
};

// ============================================================================
// SISTEMA DE TEMPO
// ============================================================================

export const TimeSystem = {
  /**
   * Calcula tempo restante para um evento
   */
  getTimeRemaining(endTime) {
    const now = new Date();
    const end = new Date(endTime);
    const diff = end - now;
    
    if (diff <= 0) {
      return { expired: true, formatted: "Expirado" };
    }
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
    let formatted;
    if (hours > 0) {
      formatted = `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      formatted = `${minutes}m ${seconds}s`;
    } else {
      formatted = `${seconds}s`;
    }
    
    return {
      expired: false,
      hours,
      minutes,
      seconds,
      totalSeconds: Math.floor(diff / 1000),
      formatted
    };
  },

  /**
   * Formata data para exibição
   */
  formatDate(date, format = 'short') {
    const d = new Date(date);
    
    if (format === 'short') {
      return d.toLocaleDateString('pt-PT');
    }
    
    if (format === 'long') {
      return d.toLocaleDateString('pt-PT', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }
    
    if (format === 'relative') {
      const now = new Date();
      const diff = now - d;
      
      if (diff < 60000) return 'Agora mesmo';
      if (diff < 3600000) return `${Math.floor(diff / 60000)}m atrás`;
      if (diff < 86400000) return `${Math.floor(diff / 3600000)}h atrás`;
      if (diff < 604800000) return `${Math.floor(diff / 86400000)}d atrás`;
      
      return d.toLocaleDateString('pt-PT');
    }
    
    return d.toISOString();
  },

  /**
   * Calcula período do dia (para lore)
   */
  getTimeOfDay() {
    const hour = new Date().getHours();
    
    if (hour >= 5 && hour < 7) return { period: "dawn", label: "Madrugada", icon: "sunrise" };
    if (hour >= 7 && hour < 12) return { period: "morning", label: "Manhã", icon: "sun" };
    if (hour >= 12 && hour < 17) return { period: "afternoon", label: "Tarde", icon: "sun" };
    if (hour >= 17 && hour < 20) return { period: "evening", label: "Entardecer", icon: "sunset" };
    if (hour >= 20 && hour < 24) return { period: "night", label: "Noite", icon: "moon" };
    return { period: "late_night", label: "Alta Noite", icon: "moon" };
  }
};

// ============================================================================
// SISTEMA DE NOTIFICAÇÕES
// ============================================================================

export const NotificationSystem = {
  /**
   * Gera mensagem de notificação para eventos do jogo
   */
  generateMessage(type, data) {
    const templates = {
      mission_complete: {
        success: `Missão concluída! Ganhaste €${data.reward}`,
        failure: `Missão falhou. ${data.reason || 'Tenta novamente.'}`
      },
      level_up: `Parabéns! Subiste para o nível ${data.level}!`,
      achievement: `Conquista desbloqueada: ${data.name}`,
      gang_war_started: `A tua gangue declarou guerra por ${data.territory}!`,
      gang_war_won: `Vitória! Conquistaste ${data.territory}!`,
      gang_war_lost: `Derrota. Perdeste a batalha por ${data.territory}.`,
      property_income: `Recebeste €${data.amount} das tuas propriedades.`,
      heat_warning: `Atenção! O teu heat está em ${data.heat}%!`,
      energy_full: `Energia totalmente restaurada!`,
      daily_reward: `Recompensa diária disponível!`,
      market_sale: `Vendeste ${data.item} por €${data.price}!`,
      crafting_complete: `Produção concluída: ${data.item}`,
      event_started: `Evento iniciado: ${data.name}`,
      event_ended: `Evento terminado: ${data.name}`
    };
    
    const template = templates[type];
    
    if (typeof template === 'string') {
      return template;
    }
    
    if (typeof template === 'object') {
      return template[data.success ? 'success' : 'failure'] || template.success;
    }
    
    return 'Notificação do jogo';
  },

  /**
   * Determina prioridade de notificação
   */
  getPriority(type) {
    const priorities = {
      heat_warning: 'high',
      gang_war_started: 'high',
      level_up: 'high',
      achievement: 'medium',
      mission_complete: 'medium',
      daily_reward: 'medium',
      property_income: 'low',
      energy_full: 'low',
      market_sale: 'low',
      crafting_complete: 'low'
    };
    
    return priorities[type] || 'low';
  }
};

// ============================================================================
// UTILIDADES DE FORMATAÇÃO
// ============================================================================

export const formatTimeRemaining = (totalSeconds) => {
  if (totalSeconds <= 0) return 'Pronto';
  
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
};

export const formatNumber = (num, decimals = 0) => {
  return num.toLocaleString('pt-PT', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
};

export const formatPercent = (value, decimals = 0) => {
  return `${value.toFixed(decimals)}%`;
};

export const truncateText = (text, maxLength) => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
};

// ============================================================================
// UTILIDADES DE CÁLCULO
// ============================================================================

export const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

export const lerp = (start, end, t) => start + (end - start) * t;

export const randomBetween = (min, max) => Math.random() * (max - min) + min;

export const randomInt = (min, max) => Math.floor(randomBetween(min, max + 1));

export const weightedRandom = (options) => {
  const totalWeight = options.reduce((sum, opt) => sum + opt.weight, 0);
  let random = Math.random() * totalWeight;
  
  for (const option of options) {
    random -= option.weight;
    if (random <= 0) return option.value;
  }
  
  return options[options.length - 1].value;
};

// ============================================================================
// VALIDAÇÕES
// ============================================================================

export const Validators = {
  isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  },

  isValidUsername(username) {
    return /^[a-zA-Z0-9_]{3,20}$/.test(username);
  },

  isValidPassword(password) {
    return password.length >= 6;
  },

  isValidGangTag(tag) {
    return /^[A-Z0-9]{2,4}$/.test(tag);
  },

  isValidGangName(name) {
    return name.length >= 3 && name.length <= 30;
  },

  isPositiveNumber(value) {
    return typeof value === 'number' && value > 0 && !isNaN(value);
  }
};

// ============================================================================
// EXPORTS DEFAULT
// ============================================================================

export default {
  GAME_CONSTANTS,
  LevelSystem,
  HeatSystem,
  EconomySystem,
  MissionSystem,
  VehicleSystem,
  GangSystem,
  TimeSystem,
  NotificationSystem,
  Validators,
  formatTimeRemaining,
  formatNumber,
  formatPercent,
  truncateText,
  clamp,
  lerp,
  randomBetween,
  randomInt,
  weightedRandom
};

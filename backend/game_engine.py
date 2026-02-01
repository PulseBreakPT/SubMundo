"""
SUBMUNDO - Advanced Game Engine
================================
Sistema avançado de lógica do jogo com mecânicas complexas,
inteligência artificial, sistemas dinâmicos e mais.

Este módulo estende as funcionalidades base do jogo com:
- Sistema de clima dinâmico
- AI para NPCs
- Sistema de relacionamentos
- Economia dinâmica
- Sistema de heists complexos
- Missões procedurais
- Sistema de territórios avançado
- Sistema de fama e notoriedade
- Sistema de ciclo dia/noite
- Sistema de inteligência policial
"""

import random
import math
from datetime import datetime, timezone, timedelta
from typing import Dict, List, Optional, Tuple, Any
from enum import Enum
import uuid

# ============================================================================
# ENUMS E CONSTANTES AVANÇADAS
# ============================================================================

class TimeOfDay(Enum):
    DAWN = "dawn"           # 5:00 - 7:00
    MORNING = "morning"     # 7:00 - 12:00
    AFTERNOON = "afternoon" # 12:00 - 17:00
    EVENING = "evening"     # 17:00 - 20:00
    NIGHT = "night"         # 20:00 - 24:00
    LATE_NIGHT = "late_night" # 0:00 - 5:00

class WeatherType(Enum):
    CLEAR = "clear"
    CLOUDY = "cloudy"
    RAIN = "rain"
    STORM = "storm"
    FOG = "fog"
    HEAT = "heat"

class RelationshipLevel(Enum):
    ENEMY = -3
    HOSTILE = -2
    UNFRIENDLY = -1
    NEUTRAL = 0
    FRIENDLY = 1
    ALLIED = 2
    TRUSTED = 3

class NotorietyRank(Enum):
    UNKNOWN = "unknown"
    STREET_RAT = "street_rat"
    SMALL_TIME = "small_time"
    RISING_STAR = "rising_star"
    MADE_MAN = "made_man"
    SHOT_CALLER = "shot_caller"
    CRIME_LORD = "crime_lord"
    KINGPIN = "kingpin"

class PoliceAlertLevel(Enum):
    NONE = 0
    PATROL = 1
    SEARCH = 2
    PURSUIT = 3
    LOCKDOWN = 4
    MANHUNT = 5

# ============================================================================
# SISTEMA DE TEMPO E CLIMA
# ============================================================================

class TimeWeatherSystem:
    """Sistema de gestão de tempo e clima do jogo"""
    
    WEATHER_EFFECTS = {
        WeatherType.CLEAR: {
            "visibility": 1.0,
            "stealth_modifier": 0,
            "pursuit_modifier": 0,
            "mood": "positive"
        },
        WeatherType.CLOUDY: {
            "visibility": 0.9,
            "stealth_modifier": 1,
            "pursuit_modifier": 0,
            "mood": "neutral"
        },
        WeatherType.RAIN: {
            "visibility": 0.7,
            "stealth_modifier": 3,
            "pursuit_modifier": -1,
            "mood": "negative"
        },
        WeatherType.STORM: {
            "visibility": 0.4,
            "stealth_modifier": 5,
            "pursuit_modifier": -3,
            "mood": "dangerous"
        },
        WeatherType.FOG: {
            "visibility": 0.3,
            "stealth_modifier": 7,
            "pursuit_modifier": -2,
            "mood": "mysterious"
        },
        WeatherType.HEAT: {
            "visibility": 0.95,
            "stealth_modifier": -1,
            "pursuit_modifier": -1,
            "mood": "tense"
        }
    }
    
    TIME_MODIFIERS = {
        TimeOfDay.DAWN: {
            "police_activity": 0.3,
            "civilian_activity": 0.2,
            "crime_opportunity": 0.7,
            "stealth_bonus": 3
        },
        TimeOfDay.MORNING: {
            "police_activity": 0.7,
            "civilian_activity": 0.8,
            "crime_opportunity": 0.4,
            "stealth_bonus": -2
        },
        TimeOfDay.AFTERNOON: {
            "police_activity": 0.8,
            "civilian_activity": 1.0,
            "crime_opportunity": 0.5,
            "stealth_bonus": -3
        },
        TimeOfDay.EVENING: {
            "police_activity": 0.6,
            "civilian_activity": 0.7,
            "crime_opportunity": 0.6,
            "stealth_bonus": 1
        },
        TimeOfDay.NIGHT: {
            "police_activity": 0.4,
            "civilian_activity": 0.3,
            "crime_opportunity": 0.8,
            "stealth_bonus": 4
        },
        TimeOfDay.LATE_NIGHT: {
            "police_activity": 0.2,
            "civilian_activity": 0.1,
            "crime_opportunity": 0.9,
            "stealth_bonus": 6
        }
    }
    
    @staticmethod
    def get_current_time_of_day() -> TimeOfDay:
        """Determina o período do dia atual baseado na hora real"""
        hour = datetime.now().hour
        if 5 <= hour < 7:
            return TimeOfDay.DAWN
        elif 7 <= hour < 12:
            return TimeOfDay.MORNING
        elif 12 <= hour < 17:
            return TimeOfDay.AFTERNOON
        elif 17 <= hour < 20:
            return TimeOfDay.EVENING
        elif 20 <= hour < 24:
            return TimeOfDay.NIGHT
        else:
            return TimeOfDay.LATE_NIGHT
    
    @staticmethod
    def generate_weather(previous_weather: Optional[WeatherType] = None) -> WeatherType:
        """Gera clima com base em probabilidades e clima anterior"""
        weights = {
            WeatherType.CLEAR: 40,
            WeatherType.CLOUDY: 25,
            WeatherType.RAIN: 15,
            WeatherType.STORM: 5,
            WeatherType.FOG: 10,
            WeatherType.HEAT: 5
        }
        
        # Ajusta probabilidades baseado no clima anterior
        if previous_weather:
            if previous_weather == WeatherType.STORM:
                weights[WeatherType.RAIN] += 20
                weights[WeatherType.STORM] -= 3
            elif previous_weather == WeatherType.RAIN:
                weights[WeatherType.CLEAR] += 10
                weights[WeatherType.STORM] += 5
            elif previous_weather == WeatherType.CLEAR:
                weights[WeatherType.CLOUDY] += 10
        
        weather_list = list(weights.keys())
        weight_list = list(weights.values())
        return random.choices(weather_list, weights=weight_list)[0]
    
    @staticmethod
    def calculate_combined_modifiers(time: TimeOfDay, weather: WeatherType) -> Dict[str, float]:
        """Calcula modificadores combinados de tempo e clima"""
        time_mods = TimeWeatherSystem.TIME_MODIFIERS[time]
        weather_mods = TimeWeatherSystem.WEATHER_EFFECTS[weather]
        
        return {
            "stealth_total": time_mods["stealth_bonus"] + weather_mods["stealth_modifier"],
            "visibility": weather_mods["visibility"],
            "police_multiplier": time_mods["police_activity"],
            "crime_opportunity": time_mods["crime_opportunity"],
            "pursuit_modifier": weather_mods["pursuit_modifier"]
        }

# ============================================================================
# SISTEMA DE INTELIGÊNCIA POLICIAL
# ============================================================================

class PoliceAISystem:
    """Sistema de AI para comportamento policial"""
    
    PATROL_PATTERNS = {
        "centro": {"frequency": "high", "response_time": 2, "units": 5},
        "porto": {"frequency": "medium", "response_time": 4, "units": 3},
        "favela": {"frequency": "low", "response_time": 8, "units": 2},
        "suburbio": {"frequency": "medium", "response_time": 5, "units": 3},
        "comercial": {"frequency": "high", "response_time": 3, "units": 4},
        "noite": {"frequency": "low", "response_time": 6, "units": 2},
        "industrial": {"frequency": "very_low", "response_time": 10, "units": 1},
        "universidade": {"frequency": "medium", "response_time": 4, "units": 3},
        "praia": {"frequency": "medium", "response_time": 5, "units": 2},
        "elite": {"frequency": "very_high", "response_time": 1, "units": 6}
    }
    
    @staticmethod
    def calculate_alert_level(
        player_heat: int,
        neighborhood_heat: int,
        crime_type: str,
        time_of_day: TimeOfDay
    ) -> PoliceAlertLevel:
        """Calcula o nível de alerta policial baseado em múltiplos fatores"""
        
        crime_severity = {
            "roubo_pequeno": 1,
            "roubo_carro": 2,
            "assalto_loja": 3,
            "contrabando": 2,
            "hacker": 2,
            "cobranca": 1,
            "arrombamento": 2,
            "fraude": 2,
            "extorsao": 3,
            "corrida_ilegal": 2,
            "trafego_armas": 4,
            "sequestro_rapido": 4,
            "assalto_banco": 5
        }
        
        severity = crime_severity.get(crime_type, 1)
        time_modifier = TimeWeatherSystem.TIME_MODIFIERS[time_of_day]["police_activity"]
        
        # Cálculo do score de alerta
        alert_score = (
            severity * 2 +
            (player_heat / 20) +
            (neighborhood_heat / 25) * time_modifier
        )
        
        if alert_score < 3:
            return PoliceAlertLevel.NONE
        elif alert_score < 5:
            return PoliceAlertLevel.PATROL
        elif alert_score < 8:
            return PoliceAlertLevel.SEARCH
        elif alert_score < 12:
            return PoliceAlertLevel.PURSUIT
        elif alert_score < 16:
            return PoliceAlertLevel.LOCKDOWN
        else:
            return PoliceAlertLevel.MANHUNT
    
    @staticmethod
    def calculate_escape_chance(
        player_stats: Dict,
        vehicle: Optional[Dict],
        alert_level: PoliceAlertLevel,
        neighborhood: str,
        weather: WeatherType
    ) -> float:
        """Calcula a chance de escapar de uma perseguição policial"""
        
        base_chance = 50  # 50% base
        
        # Bónus do veículo
        if vehicle:
            base_chance += vehicle.get("speed", 0) * 3
            base_chance += vehicle.get("stealth", 0) * 2
        else:
            base_chance -= 20  # Sem veículo = muito difícil
        
        # Bónus de skills
        driving_skill = player_stats.get("skills", {}).get("driving", {}).get("level", 0)
        stealth_skill = player_stats.get("skills", {}).get("stealth", {}).get("level", 0)
        base_chance += driving_skill * 2 + stealth_skill * 1.5
        
        # Modificadores de clima
        weather_effects = TimeWeatherSystem.WEATHER_EFFECTS[weather]
        base_chance -= weather_effects["pursuit_modifier"] * 5
        
        # Modificador de nível de alerta
        alert_penalty = {
            PoliceAlertLevel.NONE: 0,
            PoliceAlertLevel.PATROL: 5,
            PoliceAlertLevel.SEARCH: 15,
            PoliceAlertLevel.PURSUIT: 25,
            PoliceAlertLevel.LOCKDOWN: 40,
            PoliceAlertLevel.MANHUNT: 60
        }
        base_chance -= alert_penalty[alert_level]
        
        # Modificador de bairro
        patrol = PoliceAISystem.PATROL_PATTERNS.get(neighborhood, {})
        response_penalty = 10 - patrol.get("response_time", 5)
        base_chance -= response_penalty * 2
        
        return max(5, min(95, base_chance))
    
    @staticmethod
    def generate_police_response(
        alert_level: PoliceAlertLevel,
        neighborhood: str
    ) -> Dict[str, Any]:
        """Gera resposta policial detalhada"""
        
        patrol = PoliceAISystem.PATROL_PATTERNS.get(neighborhood, {})
        
        responses = {
            PoliceAlertLevel.NONE: {
                "description": "Sem resposta policial",
                "units_deployed": 0,
                "helicopter": False,
                "roadblocks": 0,
                "search_intensity": 0
            },
            PoliceAlertLevel.PATROL: {
                "description": "Patrulha de rotina investigando",
                "units_deployed": 1,
                "helicopter": False,
                "roadblocks": 0,
                "search_intensity": 20
            },
            PoliceAlertLevel.SEARCH: {
                "description": "Busca ativa na área",
                "units_deployed": 2,
                "helicopter": False,
                "roadblocks": 1,
                "search_intensity": 50
            },
            PoliceAlertLevel.PURSUIT: {
                "description": "Perseguição em andamento!",
                "units_deployed": patrol.get("units", 3),
                "helicopter": random.random() > 0.7,
                "roadblocks": 2,
                "search_intensity": 75
            },
            PoliceAlertLevel.LOCKDOWN: {
                "description": "Bairro em lockdown!",
                "units_deployed": patrol.get("units", 3) * 2,
                "helicopter": True,
                "roadblocks": 4,
                "search_intensity": 90
            },
            PoliceAlertLevel.MANHUNT: {
                "description": "MANHUNT! Cidade em alerta máximo!",
                "units_deployed": 10,
                "helicopter": True,
                "roadblocks": 8,
                "search_intensity": 100
            }
        }
        
        return responses[alert_level]

# ============================================================================
# SISTEMA DE RELACIONAMENTOS E NPCs
# ============================================================================

class RelationshipSystem:
    """Sistema avançado de relacionamentos entre jogadores e NPCs"""
    
    @staticmethod
    def calculate_relationship_level(points: int) -> RelationshipLevel:
        """Converte pontos em nível de relacionamento"""
        if points <= -75:
            return RelationshipLevel.ENEMY
        elif points <= -50:
            return RelationshipLevel.HOSTILE
        elif points <= -25:
            return RelationshipLevel.UNFRIENDLY
        elif points <= 25:
            return RelationshipLevel.NEUTRAL
        elif points <= 50:
            return RelationshipLevel.FRIENDLY
        elif points <= 75:
            return RelationshipLevel.ALLIED
        else:
            return RelationshipLevel.TRUSTED
    
    @staticmethod
    def get_interaction_effects(relationship: RelationshipLevel) -> Dict[str, Any]:
        """Retorna os efeitos baseados no nível de relacionamento"""
        effects = {
            RelationshipLevel.ENEMY: {
                "price_modifier": 2.0,
                "can_trade": False,
                "will_betray": True,
                "info_quality": "false",
                "help_chance": 0
            },
            RelationshipLevel.HOSTILE: {
                "price_modifier": 1.5,
                "can_trade": False,
                "will_betray": True,
                "info_quality": "poor",
                "help_chance": 0
            },
            RelationshipLevel.UNFRIENDLY: {
                "price_modifier": 1.25,
                "can_trade": True,
                "will_betray": False,
                "info_quality": "unreliable",
                "help_chance": 10
            },
            RelationshipLevel.NEUTRAL: {
                "price_modifier": 1.0,
                "can_trade": True,
                "will_betray": False,
                "info_quality": "normal",
                "help_chance": 25
            },
            RelationshipLevel.FRIENDLY: {
                "price_modifier": 0.9,
                "can_trade": True,
                "will_betray": False,
                "info_quality": "good",
                "help_chance": 50
            },
            RelationshipLevel.ALLIED: {
                "price_modifier": 0.8,
                "can_trade": True,
                "will_betray": False,
                "info_quality": "excellent",
                "help_chance": 75
            },
            RelationshipLevel.TRUSTED: {
                "price_modifier": 0.7,
                "can_trade": True,
                "will_betray": False,
                "info_quality": "insider",
                "help_chance": 95
            }
        }
        return effects[relationship]
    
    @staticmethod
    def calculate_relationship_change(
        current_points: int,
        action: str,
        success: bool,
        modifier: float = 1.0
    ) -> int:
        """Calcula mudança de pontos de relacionamento"""
        
        action_values = {
            "completed_job": 10,
            "failed_job": -5,
            "betrayed": -50,
            "saved_life": 30,
            "gift": 5,
            "insult": -10,
            "helped_enemy": -20,
            "shared_info": 8,
            "paid_debt": 15,
            "missed_payment": -15,
            "defended_honor": 20,
            "stole_from": -30,
            "regular_business": 2
        }
        
        base_change = action_values.get(action, 0)
        if not success and base_change > 0:
            base_change = -abs(base_change) // 2
        
        change = int(base_change * modifier)
        new_points = max(-100, min(100, current_points + change))
        
        return new_points

# ============================================================================
# SISTEMA DE NOTORIEDADE
# ============================================================================

class NotorietySystem:
    """Sistema de fama e notoriedade no submundo"""
    
    RANK_THRESHOLDS = {
        NotorietyRank.UNKNOWN: 0,
        NotorietyRank.STREET_RAT: 100,
        NotorietyRank.SMALL_TIME: 500,
        NotorietyRank.RISING_STAR: 1500,
        NotorietyRank.MADE_MAN: 4000,
        NotorietyRank.SHOT_CALLER: 10000,
        NotorietyRank.CRIME_LORD: 25000,
        NotorietyRank.KINGPIN: 50000
    }
    
    RANK_BENEFITS = {
        NotorietyRank.UNKNOWN: {
            "respect_modifier": 0,
            "price_discount": 0,
            "recruitment_bonus": 0,
            "special_missions": False,
            "media_attention": 0
        },
        NotorietyRank.STREET_RAT: {
            "respect_modifier": 1,
            "price_discount": 2,
            "recruitment_bonus": 5,
            "special_missions": False,
            "media_attention": 0
        },
        NotorietyRank.SMALL_TIME: {
            "respect_modifier": 3,
            "price_discount": 5,
            "recruitment_bonus": 10,
            "special_missions": False,
            "media_attention": 5
        },
        NotorietyRank.RISING_STAR: {
            "respect_modifier": 5,
            "price_discount": 8,
            "recruitment_bonus": 15,
            "special_missions": True,
            "media_attention": 15
        },
        NotorietyRank.MADE_MAN: {
            "respect_modifier": 10,
            "price_discount": 12,
            "recruitment_bonus": 25,
            "special_missions": True,
            "media_attention": 30
        },
        NotorietyRank.SHOT_CALLER: {
            "respect_modifier": 15,
            "price_discount": 15,
            "recruitment_bonus": 40,
            "special_missions": True,
            "media_attention": 50
        },
        NotorietyRank.CRIME_LORD: {
            "respect_modifier": 25,
            "price_discount": 20,
            "recruitment_bonus": 60,
            "special_missions": True,
            "media_attention": 75
        },
        NotorietyRank.KINGPIN: {
            "respect_modifier": 50,
            "price_discount": 25,
            "recruitment_bonus": 100,
            "special_missions": True,
            "media_attention": 100
        }
    }
    
    @staticmethod
    def calculate_notoriety_points(player_stats: Dict) -> int:
        """Calcula pontos totais de notoriedade"""
        points = 0
        
        # Pontos por nível
        points += player_stats.get("level", 1) * 50
        
        # Pontos por reputação
        points += player_stats.get("reputation", 0) * 10
        
        # Pontos por missões
        points += player_stats.get("successful_missions", 0) * 20
        
        # Pontos por ganhos totais
        earnings = player_stats.get("total_earnings", 0)
        points += int(math.log10(max(1, earnings)) * 100)
        
        # Pontos por territórios
        territories = player_stats.get("territories_controlled", 0)
        points += territories * 500
        
        # Pontos por guerras ganhas
        points += player_stats.get("wars_won", 0) * 200
        
        # Penalidade por prisões
        points -= player_stats.get("times_arrested", 0) * 50
        
        return max(0, points)
    
    @staticmethod
    def get_rank(points: int) -> NotorietyRank:
        """Determina o rank baseado nos pontos"""
        current_rank = NotorietyRank.UNKNOWN
        for rank, threshold in NotorietySystem.RANK_THRESHOLDS.items():
            if points >= threshold:
                current_rank = rank
        return current_rank
    
    @staticmethod
    def get_rank_benefits(rank: NotorietyRank) -> Dict[str, Any]:
        """Retorna benefícios do rank atual"""
        return NotorietySystem.RANK_BENEFITS[rank]

# ============================================================================
# SISTEMA DE HEISTS COMPLEXOS
# ============================================================================

class HeistSystem:
    """Sistema de assaltos complexos com múltiplas fases"""
    
    HEIST_TEMPLATES = [
        {
            "id": "bank_downtown",
            "name": "Banco do Centro",
            "description": "O banco principal da cidade. Segurança máxima.",
            "difficulty": 10,
            "phases": [
                {"name": "Reconhecimento", "duration": 300, "skill": "stealth", "required_items": ["police_scanner"]},
                {"name": "Infiltração", "duration": 180, "skill": "hacking", "required_items": ["hacking_usb"]},
                {"name": "Acesso ao Cofre", "duration": 240, "skill": "lockpicking", "required_items": ["lockpick_pro"]},
                {"name": "Extração", "duration": 120, "skill": "driving", "required_items": []},
            ],
            "base_reward": 100000,
            "max_reward": 500000,
            "heat_impact": 80,
            "crew_required": 3,
            "cooldown_hours": 72
        },
        {
            "id": "jewelry_store",
            "name": "Joalharia de Luxo",
            "description": "Joias de milhões num único local.",
            "difficulty": 7,
            "phases": [
                {"name": "Vigilância", "duration": 180, "skill": "stealth", "required_items": []},
                {"name": "Neutralização de Alarmes", "duration": 120, "skill": "hacking", "required_items": ["hacking_usb"]},
                {"name": "Recolha", "duration": 90, "skill": None, "required_items": []},
                {"name": "Fuga", "duration": 60, "skill": "driving", "required_items": []},
            ],
            "base_reward": 30000,
            "max_reward": 150000,
            "heat_impact": 50,
            "crew_required": 2,
            "cooldown_hours": 48
        },
        {
            "id": "casino_heist",
            "name": "Casino Royal",
            "description": "Fortuna em fichas e dinheiro vivo.",
            "difficulty": 9,
            "phases": [
                {"name": "Trabalho Interno", "duration": 240, "skill": "negotiation", "required_items": ["fake_id"]},
                {"name": "Acesso às Câmaras", "duration": 180, "skill": "hacking", "required_items": ["emp_device"]},
                {"name": "Cofre Principal", "duration": 300, "skill": "lockpicking", "required_items": ["lockpick_pro"]},
                {"name": "Dispersão", "duration": 150, "skill": "stealth", "required_items": ["smoke_bomb"]},
            ],
            "base_reward": 80000,
            "max_reward": 400000,
            "heat_impact": 70,
            "crew_required": 4,
            "cooldown_hours": 96
        },
        {
            "id": "armored_truck",
            "name": "Carro Blindado",
            "description": "Intercepção de transporte de valores.",
            "difficulty": 8,
            "phases": [
                {"name": "Rastreamento", "duration": 120, "skill": "driving", "required_items": ["gps_jammer"]},
                {"name": "Emboscada", "duration": 60, "skill": "combat", "required_items": []},
                {"name": "Arrombamento", "duration": 90, "skill": "lockpicking", "required_items": ["lockpick_basic"]},
                {"name": "Escape", "duration": 180, "skill": "driving", "required_items": []},
            ],
            "base_reward": 50000,
            "max_reward": 200000,
            "heat_impact": 60,
            "crew_required": 3,
            "cooldown_hours": 36
        },
        {
            "id": "art_museum",
            "name": "Museu de Arte",
            "description": "Obras de arte inestimáveis.",
            "difficulty": 8,
            "phases": [
                {"name": "Estudo do Layout", "duration": 200, "skill": "stealth", "required_items": []},
                {"name": "Bypass de Sensores", "duration": 180, "skill": "hacking", "required_items": ["emp_device"]},
                {"name": "Extração das Peças", "duration": 240, "skill": None, "required_items": []},
                {"name": "Transporte Seguro", "duration": 120, "skill": "driving", "required_items": []},
            ],
            "base_reward": 60000,
            "max_reward": 300000,
            "heat_impact": 45,
            "crew_required": 2,
            "cooldown_hours": 60
        }
    ]
    
    @staticmethod
    def calculate_phase_success(
        player_skills: Dict,
        required_skill: Optional[str],
        has_required_items: bool,
        crew_bonus: int = 0
    ) -> Tuple[bool, float]:
        """Calcula sucesso de uma fase do heist"""
        
        base_chance = 60
        
        # Bónus de skill
        if required_skill:
            skill_level = player_skills.get(required_skill, {}).get("level", 0)
            base_chance += skill_level * 4
        
        # Penalidade por falta de items
        if not has_required_items:
            base_chance -= 20
        
        # Bónus de crew
        base_chance += crew_bonus * 3
        
        # Variação aleatória
        roll = random.randint(1, 100)
        success = roll <= base_chance
        
        # Cálculo de eficiência (afeta reward)
        efficiency = min(100, base_chance + random.randint(-10, 10)) / 100
        
        return success, efficiency
    
    @staticmethod
    def calculate_heist_reward(
        template: Dict,
        phase_efficiencies: List[float],
        crew_cut: float = 0.3
    ) -> Dict[str, float]:
        """Calcula recompensa final do heist"""
        
        average_efficiency = sum(phase_efficiencies) / len(phase_efficiencies)
        
        base = template["base_reward"]
        maximum = template["max_reward"]
        
        raw_reward = base + (maximum - base) * average_efficiency
        
        # Desconto para crew
        player_cut = raw_reward * (1 - crew_cut)
        crew_total = raw_reward * crew_cut
        
        return {
            "total_reward": raw_reward,
            "player_cut": player_cut,
            "crew_cut": crew_total,
            "efficiency": average_efficiency * 100
        }

# ============================================================================
# SISTEMA DE ECONOMIA DINÂMICA
# ============================================================================

class DynamicEconomySystem:
    """Sistema de economia que flutua baseado em eventos e ações"""
    
    BASE_PRICES = {
        "drugs": 100,
        "weapons": 500,
        "vehicles": 10000,
        "properties": 50000,
        "documents": 200,
        "electronics": 300
    }
    
    @staticmethod
    def calculate_market_price(
        category: str,
        base_price: float,
        supply: int,
        demand: int,
        neighborhood_modifier: float = 1.0,
        event_modifier: float = 1.0,
        reputation_discount: float = 0
    ) -> float:
        """Calcula preço de mercado dinâmico"""
        
        # Fórmula de oferta e procura
        if supply > 0:
            supply_demand_ratio = demand / supply
        else:
            supply_demand_ratio = 2.0  # Escassez = preços altos
        
        # Modificador base (entre 0.5 e 2.0)
        ratio_modifier = max(0.5, min(2.0, supply_demand_ratio))
        
        # Cálculo final
        final_price = (
            base_price * 
            ratio_modifier * 
            neighborhood_modifier * 
            event_modifier * 
            (1 - reputation_discount / 100)
        )
        
        return round(final_price, 2)
    
    @staticmethod
    def simulate_market_fluctuation(
        current_supply: int,
        current_demand: int,
        market_events: List[str]
    ) -> Tuple[int, int]:
        """Simula flutuações de mercado"""
        
        # Variação base aleatória
        supply_change = random.randint(-10, 10)
        demand_change = random.randint(-10, 10)
        
        # Modificadores por eventos
        event_effects = {
            "police_crackdown": {"supply": -20, "demand": -10},
            "festival": {"supply": 5, "demand": 30},
            "blackout": {"supply": -10, "demand": 20},
            "economic_boom": {"supply": 10, "demand": 25},
            "gang_war": {"supply": -15, "demand": 40},
            "new_supplier": {"supply": 30, "demand": 0},
            "bust": {"supply": -40, "demand": 5}
        }
        
        for event in market_events:
            effects = event_effects.get(event, {"supply": 0, "demand": 0})
            supply_change += effects["supply"]
            demand_change += effects["demand"]
        
        new_supply = max(10, current_supply + supply_change)
        new_demand = max(10, current_demand + demand_change)
        
        return new_supply, new_demand
    
    @staticmethod
    def calculate_inflation_rate(
        total_money_in_circulation: float,
        total_players: int,
        days_since_launch: int
    ) -> float:
        """Calcula taxa de inflação do jogo"""
        
        # Dinheiro médio por jogador
        avg_money = total_money_in_circulation / max(1, total_players)
        
        # Inflação base esperada
        expected_avg = 10000 + (days_since_launch * 500)
        
        # Taxa de inflação (1.0 = normal, > 1.0 = inflação)
        inflation = avg_money / expected_avg
        
        return round(inflation, 3)

# ============================================================================
# SISTEMA DE MISSÕES PROCEDURAIS
# ============================================================================

class ProceduralMissionGenerator:
    """Gerador de missões procedurais únicas"""
    
    MISSION_TEMPLATES = {
        "theft": {
            "name_templates": [
                "Roubo no {location}",
                "Operação {codename}",
                "O Golpe do {target}",
            ],
            "objectives": ["steal", "escape", "deliver"],
            "locations": ["banco", "museu", "loja de luxo", "escritório", "armazém"],
            "targets": ["diamante", "quadro", "documentos", "dinheiro", "equipamento"],
            "base_difficulty": 5
        },
        "delivery": {
            "name_templates": [
                "Entrega para {client}",
                "Pacote Especial",
                "Corrida Contra o Tempo",
            ],
            "objectives": ["pickup", "deliver", "avoid_police"],
            "clients": ["O Químico", "Don Carvalho", "A Condessa", "Viktor"],
            "cargo_types": ["substâncias", "armas", "documentos", "dinheiro"],
            "base_difficulty": 3
        },
        "assassination": {
            "name_templates": [
                "Contrato: {target}",
                "Eliminação Silenciosa",
                "O Último Serviço",
            ],
            "objectives": ["locate", "eliminate", "cleanup"],
            "targets": ["informante", "rival", "político corrupto", "testemunha"],
            "base_difficulty": 8
        },
        "protection": {
            "name_templates": [
                "Proteção VIP",
                "Escolta de {vip}",
                "Guarda-costas",
            ],
            "objectives": ["meet_client", "protect", "deliver_safely"],
            "vips": ["empresário", "celebridade", "político", "testemunha protegida"],
            "base_difficulty": 4
        },
        "sabotage": {
            "name_templates": [
                "Sabotagem em {location}",
                "Operação Destruição",
                "O Incêndio",
            ],
            "objectives": ["infiltrate", "plant_device", "escape"],
            "locations": ["fábrica rival", "armazém de drogas", "escritório", "veículo"],
            "base_difficulty": 6
        }
    }
    
    MODIFIERS = {
        "time_limit": {"name": "Contra-relógio", "difficulty_add": 2, "reward_mult": 1.5},
        "stealth": {"name": "Sem testemunhas", "difficulty_add": 3, "reward_mult": 1.8},
        "no_casualties": {"name": "Zero mortes", "difficulty_add": 1, "reward_mult": 1.2},
        "solo": {"name": "Trabalho solo", "difficulty_add": 2, "reward_mult": 2.0},
        "daylight": {"name": "À luz do dia", "difficulty_add": 3, "reward_mult": 1.7},
        "police_presence": {"name": "Zona quente", "difficulty_add": 2, "reward_mult": 1.4},
    }
    
    @staticmethod
    def generate_mission(
        player_level: int,
        preferred_type: Optional[str] = None,
        neighborhood: Optional[str] = None
    ) -> Dict[str, Any]:
        """Gera uma missão procedural única"""
        
        # Seleciona tipo de missão
        if preferred_type and preferred_type in ProceduralMissionGenerator.MISSION_TEMPLATES:
            mission_type = preferred_type
        else:
            mission_type = random.choice(list(ProceduralMissionGenerator.MISSION_TEMPLATES.keys()))
        
        template = ProceduralMissionGenerator.MISSION_TEMPLATES[mission_type]
        
        # Gera nome
        name_template = random.choice(template["name_templates"])
        
        # Preenche variáveis do nome
        if "{location}" in name_template:
            name = name_template.format(location=random.choice(template.get("locations", ["local"])))
        elif "{target}" in name_template:
            name = name_template.format(target=random.choice(template.get("targets", ["alvo"])))
        elif "{client}" in name_template:
            name = name_template.format(client=random.choice(template.get("clients", ["cliente"])))
        elif "{vip}" in name_template:
            name = name_template.format(vip=random.choice(template.get("vips", ["VIP"])))
        elif "{codename}" in name_template:
            codenames = ["Águia Negra", "Sombra", "Tempestade", "Fénix", "Cobra"]
            name = name_template.format(codename=random.choice(codenames))
        else:
            name = name_template
        
        # Dificuldade baseada no nível do jogador
        base_diff = template["base_difficulty"]
        level_scaling = min(3, player_level // 10)
        difficulty = base_diff + level_scaling + random.randint(-1, 2)
        difficulty = max(1, min(10, difficulty))
        
        # Adiciona modificadores aleatórios
        num_modifiers = random.randint(0, 2)
        selected_modifiers = random.sample(
            list(ProceduralMissionGenerator.MODIFIERS.keys()), 
            min(num_modifiers, len(ProceduralMissionGenerator.MODIFIERS))
        )
        
        reward_multiplier = 1.0
        for mod_key in selected_modifiers:
            mod = ProceduralMissionGenerator.MODIFIERS[mod_key]
            difficulty += mod["difficulty_add"]
            reward_multiplier *= mod["reward_mult"]
        
        difficulty = min(10, difficulty)
        
        # Calcula recompensas
        base_reward = 500 + (player_level * 100) + (difficulty * 200)
        max_reward = base_reward * reward_multiplier * random.uniform(1.5, 2.5)
        
        # Gera ID único
        mission_id = str(uuid.uuid4())[:8]
        
        return {
            "id": f"proc_{mission_id}",
            "name": name,
            "type": mission_type,
            "description": f"Missão gerada automaticamente: {name}",
            "difficulty": difficulty,
            "objectives": template["objectives"],
            "modifiers": selected_modifiers,
            "reward_min": int(base_reward),
            "reward_max": int(max_reward),
            "heat_impact": difficulty * 5 + random.randint(0, 10),
            "reputation_impact": max(1, difficulty),
            "energy_cost": 15 + (difficulty * 3),
            "duration_seconds": 60 + (difficulty * 30),
            "neighborhood": neighborhood,
            "expires_at": datetime.now(timezone.utc) + timedelta(hours=random.randint(6, 24)),
            "procedural": True
        }
    
    @staticmethod
    def generate_daily_missions(player_level: int, count: int = 3) -> List[Dict[str, Any]]:
        """Gera missões diárias para o jogador"""
        missions = []
        used_types = []
        
        for _ in range(count):
            available_types = [
                t for t in ProceduralMissionGenerator.MISSION_TEMPLATES.keys() 
                if t not in used_types
            ]
            
            if not available_types:
                available_types = list(ProceduralMissionGenerator.MISSION_TEMPLATES.keys())
            
            mission_type = random.choice(available_types)
            used_types.append(mission_type)
            
            mission = ProceduralMissionGenerator.generate_mission(player_level, mission_type)
            mission["daily"] = True
            mission["bonus_reward"] = int(mission["reward_max"] * 0.2)  # 20% bónus
            
            missions.append(mission)
        
        return missions

# ============================================================================
# SISTEMA DE TERRITÓRIOS AVANÇADO
# ============================================================================

class TerritoryControlSystem:
    """Sistema avançado de controlo territorial"""
    
    @staticmethod
    def calculate_territory_income(
        territory: Dict,
        controlling_gang: Dict,
        control_duration_hours: int
    ) -> Dict[str, float]:
        """Calcula rendimento de um território"""
        
        base_income = territory.get("economic_value", 50) * 10
        
        # Bónus por tempo de controlo (estabilidade)
        stability_bonus = min(50, control_duration_hours // 24)  # +1% por dia, max 50%
        
        # Modificador por tipo de actividades
        activity_modifiers = {
            "drug_trade": 1.5,
            "protection": 1.2,
            "gambling": 1.4,
            "smuggling": 1.3,
            "legitimate": 0.8
        }
        
        gang_focus = controlling_gang.get("primary_activity", "protection")
        activity_mult = activity_modifiers.get(gang_focus, 1.0)
        
        # Cálculo de risco
        heat_penalty = territory.get("heat_level", 0) / 100  # 0-1
        
        final_income = base_income * activity_mult * (1 + stability_bonus / 100) * (1 - heat_penalty * 0.3)
        
        return {
            "base_income": base_income,
            "stability_bonus": stability_bonus,
            "activity_modifier": activity_mult,
            "heat_penalty": heat_penalty * 30,
            "final_income": round(final_income, 2)
        }
    
    @staticmethod
    def calculate_war_power(
        gang: Dict,
        members: List[Dict],
        territory_bonus: float = 0
    ) -> float:
        """Calcula poder militar de uma gangue para guerras"""
        
        power = 0
        
        # Poder base por membro
        for member in members:
            member_power = 10  # Base
            member_power += member.get("level", 1) * 2
            member_power += member.get("reputation", 0) / 10
            
            # Bónus de skills de combate
            skills = member.get("skills", {})
            combat_skill = skills.get("combat", {}).get("level", 0)
            intimidation_skill = skills.get("intimidation", {}).get("level", 0)
            
            member_power += combat_skill * 3
            member_power += intimidation_skill * 2
            
            power += member_power
        
        # Bónus de tesouro (recursos)
        treasury = gang.get("treasury", 0)
        power += min(100, treasury / 1000)  # Max +100 de tesouro
        
        # Bónus de território
        power += territory_bonus
        
        # Bónus de reputação da gangue
        gang_rep = gang.get("reputation", 0)
        power += gang_rep / 5
        
        return round(power, 2)
    
    @staticmethod
    def simulate_war_outcome(
        attacker_power: float,
        defender_power: float,
        territory_defense_bonus: float = 1.2
    ) -> Dict[str, Any]:
        """Simula o resultado de uma guerra territorial"""
        
        # Defensor tem bónus natural
        adjusted_defender = defender_power * territory_defense_bonus
        
        total_power = attacker_power + adjusted_defender
        
        # Calcula probabilidades
        attacker_chance = (attacker_power / total_power) * 100
        defender_chance = 100 - attacker_chance
        
        # Adiciona variação aleatória
        roll = random.uniform(0, 100)
        attacker_wins = roll < attacker_chance
        
        # Calcula perdas
        if attacker_wins:
            attacker_losses = random.uniform(0.1, 0.3)  # 10-30% perdas
            defender_losses = random.uniform(0.4, 0.6)  # 40-60% perdas
        else:
            attacker_losses = random.uniform(0.4, 0.7)  # 40-70% perdas
            defender_losses = random.uniform(0.1, 0.3)  # 10-30% perdas
        
        return {
            "attacker_wins": attacker_wins,
            "attacker_power": attacker_power,
            "defender_power": adjusted_defender,
            "attacker_chance": round(attacker_chance, 1),
            "defender_chance": round(defender_chance, 1),
            "attacker_losses_percent": round(attacker_losses * 100, 1),
            "defender_losses_percent": round(defender_losses * 100, 1),
            "roll": round(roll, 1)
        }

# ============================================================================
# SISTEMA DE EVENTOS DINÂMICOS
# ============================================================================

class DynamicEventSystem:
    """Sistema de eventos que reagem ao estado do jogo"""
    
    EVENT_TRIGGERS = {
        "high_crime_rate": {
            "condition": lambda stats: stats.get("total_crimes_24h", 0) > 100,
            "events": ["police_crackdown", "martial_law"],
            "probability": 0.7
        },
        "gang_war_active": {
            "condition": lambda stats: stats.get("active_wars", 0) > 2,
            "events": ["gang_truce_offer", "weapons_shortage", "media_attention"],
            "probability": 0.5
        },
        "economic_depression": {
            "condition": lambda stats: stats.get("avg_player_money", 0) < 5000,
            "events": ["economic_stimulus", "black_market_boom"],
            "probability": 0.6
        },
        "low_activity": {
            "condition": lambda stats: stats.get("active_players_1h", 0) < 10,
            "events": ["special_event", "bonus_weekend"],
            "probability": 0.4
        },
        "holiday": {
            "condition": lambda stats: stats.get("is_holiday", False),
            "events": ["festival", "celebration", "fireworks"],
            "probability": 0.9
        }
    }
    
    @staticmethod
    def check_and_trigger_events(game_stats: Dict) -> List[Dict[str, Any]]:
        """Verifica condições e dispara eventos apropriados"""
        
        triggered_events = []
        
        for trigger_name, trigger_config in DynamicEventSystem.EVENT_TRIGGERS.items():
            if trigger_config["condition"](game_stats):
                if random.random() < trigger_config["probability"]:
                    event_type = random.choice(trigger_config["events"])
                    
                    event = {
                        "id": str(uuid.uuid4()),
                        "type": event_type,
                        "trigger": trigger_name,
                        "triggered_at": datetime.now(timezone.utc),
                        "duration_minutes": random.randint(30, 120),
                        "affects_all_players": True
                    }
                    
                    triggered_events.append(event)
        
        return triggered_events
    
    @staticmethod
    def calculate_event_impact(
        event_type: str,
        player_stats: Dict,
        current_location: str
    ) -> Dict[str, Any]:
        """Calcula impacto de um evento num jogador específico"""
        
        impacts = {
            "police_crackdown": {
                "heat_modifier": 1.5,
                "reward_modifier": 0.8,
                "mission_availability": 0.6,
                "advice": "Mantém-te discreto ou faz trabalhos legais"
            },
            "festival": {
                "heat_modifier": 0.7,
                "reward_modifier": 1.3,
                "mission_availability": 1.2,
                "advice": "Ótima altura para furtos e pickpocket"
            },
            "blackout": {
                "heat_modifier": 0.5,
                "reward_modifier": 1.5,
                "mission_availability": 1.5,
                "advice": "A escuridão é tua amiga"
            },
            "economic_stimulus": {
                "heat_modifier": 1.0,
                "reward_modifier": 1.8,
                "mission_availability": 1.0,
                "advice": "Dinheiro está a circular - aproveita"
            },
            "gang_truce_offer": {
                "heat_modifier": 0.9,
                "reward_modifier": 1.0,
                "mission_availability": 1.0,
                "war_disabled": True,
                "advice": "Paz temporária - expande sem conflito"
            }
        }
        
        return impacts.get(event_type, {
            "heat_modifier": 1.0,
            "reward_modifier": 1.0,
            "mission_availability": 1.0,
            "advice": "Continua como normal"
        })

# ============================================================================
# FUNÇÕES UTILITÁRIAS EXPORTADAS
# ============================================================================

def get_game_state_modifiers(
    player_stats: Dict,
    current_neighborhood: str,
    active_events: List[Dict]
) -> Dict[str, Any]:
    """Retorna todos os modificadores ativos para o estado atual"""
    
    # Tempo e clima
    time_of_day = TimeWeatherSystem.get_current_time_of_day()
    weather = TimeWeatherSystem.generate_weather()
    time_weather_mods = TimeWeatherSystem.calculate_combined_modifiers(time_of_day, weather)
    
    # Notoriedade
    notoriety_points = NotorietySystem.calculate_notoriety_points(player_stats)
    notoriety_rank = NotorietySystem.get_rank(notoriety_points)
    rank_benefits = NotorietySystem.get_rank_benefits(notoriety_rank)
    
    # Eventos
    event_mods = {
        "heat_modifier": 1.0,
        "reward_modifier": 1.0
    }
    for event in active_events:
        impact = DynamicEventSystem.calculate_event_impact(
            event.get("type", ""),
            player_stats,
            current_neighborhood
        )
        event_mods["heat_modifier"] *= impact.get("heat_modifier", 1.0)
        event_mods["reward_modifier"] *= impact.get("reward_modifier", 1.0)
    
    return {
        "time_of_day": time_of_day.value,
        "weather": weather.value,
        "time_weather": time_weather_mods,
        "notoriety": {
            "points": notoriety_points,
            "rank": notoriety_rank.value,
            "benefits": rank_benefits
        },
        "events": event_mods,
        "combined_stealth_bonus": (
            time_weather_mods["stealth_total"] +
            rank_benefits.get("respect_modifier", 0)
        ),
        "combined_reward_modifier": (
            event_mods["reward_modifier"] *
            (1 + rank_benefits.get("price_discount", 0) / 100)
        )
    }

def calculate_mission_difficulty_adjusted(
    base_difficulty: int,
    player_stats: Dict,
    modifiers: Dict
) -> Dict[str, Any]:
    """Calcula dificuldade ajustada de uma missão"""
    
    adjusted_diff = base_difficulty
    
    # Modificadores de tempo/clima
    time_mods = modifiers.get("time_weather", {})
    adjusted_diff -= time_mods.get("stealth_total", 0) // 2
    
    # Modificador de skill
    skills = player_stats.get("skills", {})
    relevant_skills = ["stealth", "combat", "hacking", "driving"]
    avg_skill = sum(
        skills.get(s, {}).get("level", 0) 
        for s in relevant_skills
    ) / len(relevant_skills)
    adjusted_diff -= avg_skill // 2
    
    # Modificador de nível
    player_level = player_stats.get("level", 1)
    adjusted_diff -= player_level // 5
    
    # Modificador de notoriedade (pode ajudar ou prejudicar)
    notoriety = modifiers.get("notoriety", {})
    if notoriety.get("rank") in ["crime_lord", "kingpin"]:
        adjusted_diff -= 2  # Experiência ajuda
    
    adjusted_diff = max(1, min(10, adjusted_diff))
    
    # Calcula chances
    success_chance = max(10, min(95, 70 - (adjusted_diff * 5) + player_level * 2))
    
    return {
        "original_difficulty": base_difficulty,
        "adjusted_difficulty": adjusted_diff,
        "success_chance": success_chance,
        "factors": {
            "time_weather": time_mods.get("stealth_total", 0),
            "skills": avg_skill,
            "level": player_level,
            "notoriety": notoriety.get("rank", "unknown")
        }
    }

# ============================================================================
# EXPORTS
# ============================================================================

__all__ = [
    # Enums
    "TimeOfDay",
    "WeatherType",
    "RelationshipLevel",
    "NotorietyRank",
    "PoliceAlertLevel",
    
    # Sistemas
    "TimeWeatherSystem",
    "PoliceAISystem",
    "RelationshipSystem",
    "NotorietySystem",
    "HeistSystem",
    "DynamicEconomySystem",
    "ProceduralMissionGenerator",
    "TerritoryControlSystem",
    "DynamicEventSystem",
    
    # Funções utilitárias
    "get_game_state_modifiers",
    "calculate_mission_difficulty_adjusted"
]

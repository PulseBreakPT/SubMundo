"""
SUBMUNDO - Sistemas Avançados de Jogo
Sistema de Achievements, Rankings, Eventos, Economia Dinâmica
"""

from datetime import datetime, timezone, timedelta
from typing import Dict, List, Any, Optional, Tuple
import random
import math

# ==================== SISTEMA DE ACHIEVEMENTS ====================

ACHIEVEMENTS = {
    # Dinheiro
    "first_money": {
        "id": "first_money",
        "name": "Primeiro Euro",
        "description": "Ganha o teu primeiro euro",
        "category": "money",
        "requirement": {"type": "money_total", "value": 1},
        "reward": {"xp": 10, "reputation": 5},
        "icon": "💶"
    },
    "money_1k": {
        "id": "money_1k",
        "name": "Mil Euros",
        "description": "Acumula €1,000",
        "category": "money",
        "requirement": {"type": "money_total", "value": 1000},
        "reward": {"xp": 50, "reputation": 10},
        "icon": "💰"
    },
    "money_10k": {
        "id": "money_10k",
        "name": "Dez Mil",
        "description": "Acumula €10,000",
        "category": "money",
        "requirement": {"type": "money_total", "value": 10000},
        "reward": {"xp": 100, "reputation": 25},
        "icon": "💎"
    },
    "money_100k": {
        "id": "money_100k",
        "name": "Cem Mil",
        "description": "Acumula €100,000",
        "category": "money",
        "requirement": {"type": "money_total", "value": 100000},
        "reward": {"xp": 250, "reputation": 50},
        "icon": "👑"
    },
    "money_1m": {
        "id": "money_1m",
        "name": "Milionário",
        "description": "Acumula €1,000,000",
        "category": "money",
        "requirement": {"type": "money_total", "value": 1000000},
        "reward": {"xp": 1000, "reputation": 200},
        "icon": "🏆"
    },
    
    # Crimes
    "first_crime": {
        "id": "first_crime",
        "name": "Primeiro Crime",
        "description": "Comete o teu primeiro crime",
        "category": "crime",
        "requirement": {"type": "crimes_count", "value": 1},
        "reward": {"xp": 10},
        "icon": "🔫"
    },
    "crimes_10": {
        "id": "crimes_10",
        "name": "Criminoso Novato",
        "description": "Comete 10 crimes",
        "category": "crime",
        "requirement": {"type": "crimes_count", "value": 10},
        "reward": {"xp": 50, "reputation": 10},
        "icon": "⚔️"
    },
    "crimes_50": {
        "id": "crimes_50",
        "name": "Criminoso Experiente",
        "description": "Comete 50 crimes",
        "category": "crime",
        "requirement": {"type": "crimes_count", "value": 50},
        "reward": {"xp": 150, "reputation": 30},
        "icon": "💀"
    },
    "crimes_100": {
        "id": "crimes_100",
        "name": "Criminoso Profissional",
        "description": "Comete 100 crimes",
        "category": "crime",
        "requirement": {"type": "crimes_count", "value": 100},
        "reward": {"xp": 300, "reputation": 60},
        "icon": "☠️"
    },
    
    # Nível
    "level_5": {
        "id": "level_5",
        "name": "Nível 5",
        "description": "Alcança nível 5",
        "category": "level",
        "requirement": {"type": "level", "value": 5},
        "reward": {"clean_money": 1000},
        "icon": "⭐"
    },
    "level_10": {
        "id": "level_10",
        "name": "Nível 10",
        "description": "Alcança nível 10",
        "category": "level",
        "requirement": {"type": "level", "value": 10},
        "reward": {"clean_money": 5000},
        "icon": "🌟"
    },
    "level_25": {
        "id": "level_25",
        "name": "Nível 25",
        "description": "Alcança nível 25",
        "category": "level",
        "requirement": {"type": "level", "value": 25},
        "reward": {"clean_money": 20000},
        "icon": "✨"
    },
    "level_50": {
        "id": "level_50",
        "name": "Nível 50",
        "description": "Alcança nível 50",
        "category": "level",
        "requirement": {"type": "level", "value": 50},
        "reward": {"clean_money": 100000},
        "icon": "💫"
    },
    
    # Propriedades
    "first_property": {
        "id": "first_property",
        "name": "Proprietário",
        "description": "Compra a tua primeira propriedade",
        "category": "property",
        "requirement": {"type": "properties_count", "value": 1},
        "reward": {"xp": 50, "reputation": 15},
        "icon": "🏠"
    },
    "properties_5": {
        "id": "properties_5",
        "name": "Investidor",
        "description": "Possui 5 propriedades",
        "category": "property",
        "requirement": {"type": "properties_count", "value": 5},
        "reward": {"xp": 200, "reputation": 40},
        "icon": "🏘️"
    },
    
    # Gangue
    "join_gang": {
        "id": "join_gang",
        "name": "Membro de Gangue",
        "description": "Junta-te a uma gangue",
        "category": "gang",
        "requirement": {"type": "gang_joined", "value": 1},
        "reward": {"xp": 100, "reputation": 30},
        "icon": "👥"
    },
    "create_gang": {
        "id": "create_gang",
        "name": "Líder de Gangue",
        "description": "Cria a tua própria gangue",
        "category": "gang",
        "requirement": {"type": "gang_created", "value": 1},
        "reward": {"xp": 300, "reputation": 100},
        "icon": "👑"
    },
}

def check_achievements(player_data: dict) -> List[Dict]:
    """Verifica quais achievements foram desbloqueados"""
    unlocked = []
    current_achievements = player_data.get("achievements", [])
    
    # Calcular valores necessários
    total_money = player_data.get("clean_money", 0) + player_data.get("bank_balance", 0)
    crimes_count = player_data.get("crimes_committed", 0)
    level = calculate_level(player_data.get("experience", 0))
    properties_count = player_data.get("properties_count", 0)
    
    for ach_id, ach_data in ACHIEVEMENTS.items():
        if ach_id in current_achievements:
            continue
            
        req = ach_data["requirement"]
        unlocked_now = False
        
        if req["type"] == "money_total" and total_money >= req["value"]:
            unlocked_now = True
        elif req["type"] == "crimes_count" and crimes_count >= req["value"]:
            unlocked_now = True
        elif req["type"] == "level" and level >= req["value"]:
            unlocked_now = True
        elif req["type"] == "properties_count" and properties_count >= req["value"]:
            unlocked_now = True
        elif req["type"] == "gang_joined" and player_data.get("gang_id"):
            unlocked_now = True
        elif req["type"] == "gang_created" and player_data.get("gang_created", False):
            unlocked_now = True
            
        if unlocked_now:
            unlocked.append(ach_data)
    
    return unlocked

def calculate_level(experience: int) -> int:
    """Calcula nível baseado na experiência"""
    level = 1
    xp_needed = 100
    current_xp = experience
    
    while current_xp >= xp_needed and level < 100:
        current_xp -= xp_needed
        level += 1
        xp_needed = int(xp_needed * 1.15)
    
    return level

# ==================== SISTEMA DE RANKINGS ====================

async def calculate_rankings(db) -> Dict[str, List]:
    """Calcula rankings de jogadores"""
    
    # Top por dinheiro total
    pipeline_money = [
        {
            "$project": {
                "user_id": 1,
                "total_money": {"$add": ["$clean_money", "$bank_balance"]},
                "experience": 1
            }
        },
        {"$sort": {"total_money": -1}},
        {"$limit": 100}
    ]
    
    # Top por experiência
    pipeline_xp = [
        {"$sort": {"experience": -1}},
        {"$limit": 100},
        {
            "$project": {
                "user_id": 1,
                "experience": 1
            }
        }
    ]
    
    # Top por reputação
    pipeline_rep = [
        {"$sort": {"reputation": -1}},
        {"$limit": 100},
        {
            "$project": {
                "user_id": 1,
                "reputation": 1
            }
        }
    ]
    
    # Top por crimes
    pipeline_crimes = [
        {"$sort": {"crimes_committed": -1}},
        {"$limit": 100},
        {
            "$project": {
                "user_id": 1,
                "crimes_committed": 1
            }
        }
    ]
    
    money_ranking = await db.players.aggregate(pipeline_money).to_list(100)
    xp_ranking = await db.players.aggregate(pipeline_xp).to_list(100)
    rep_ranking = await db.players.aggregate(pipeline_rep).to_list(100)
    crimes_ranking = await db.players.aggregate(pipeline_crimes).to_list(100)
    
    # Buscar usernames
    user_ids = set()
    for ranking in [money_ranking, xp_ranking, rep_ranking, crimes_ranking]:
        user_ids.update([p["user_id"] for p in ranking])
    
    users = await db.users.find({"user_id": {"$in": list(user_ids)}}).to_list(1000)
    user_map = {u["user_id"]: u.get("username", "Jogador") for u in users}
    
    # Adicionar usernames
    for player in money_ranking:
        player["username"] = user_map.get(player["user_id"], "Jogador")
    for player in xp_ranking:
        player["username"] = user_map.get(player["user_id"], "Jogador")
    for player in rep_ranking:
        player["username"] = user_map.get(player["user_id"], "Jogador")
    for player in crimes_ranking:
        player["username"] = user_map.get(player["user_id"], "Jogador")
    
    return {
        "money": money_ranking[:10],
        "experience": xp_ranking[:10],
        "reputation": rep_ranking[:10],
        "crimes": crimes_ranking[:10]
    }

# ==================== SISTEMA DE EVENTOS ALEATÓRIOS ====================

RANDOM_EVENTS = [
    {
        "id": "police_raid",
        "name": "Rusga Policial",
        "description": "A polícia fez uma rusga! Perdeste algum dinheiro sujo.",
        "type": "negative",
        "probability": 0.05,
        "effects": {
            "dirty_money_multiplier": 0.7,
            "heat": 10
        }
    },
    {
        "id": "lucky_find",
        "name": "Achado Sortudo",
        "description": "Encontraste uma mala com dinheiro!",
        "type": "positive",
        "probability": 0.03,
        "effects": {
            "clean_money": lambda level: 100 * level,
            "reputation": 5
        }
    },
    {
        "id": "informant_tip",
        "name": "Dica de Informante",
        "description": "Um informante deu-te uma dica valiosa sobre um trabalho.",
        "type": "positive",
        "probability": 0.08,
        "effects": {
            "xp": lambda level: 50 * level,
            "reputation": 10
        }
    },
    {
        "id": "heat_reduction",
        "name": "Heat Reduzido",
        "description": "A polícia está focada noutros casos. O teu heat diminuiu.",
        "type": "positive",
        "probability": 0.1,
        "effects": {
            "heat": -20
        }
    },
    {
        "id": "rival_attack",
        "name": "Ataque Rival",
        "description": "Um rival atacou-te! Perdeste dinheiro e reputação.",
        "type": "negative",
        "probability": 0.04,
        "effects": {
            "clean_money_multiplier": 0.9,
            "reputation": -15
        }
    },
    {
        "id": "market_crash",
        "name": "Crash do Mercado",
        "description": "O mercado negro entrou em colapso temporário.",
        "type": "negative",
        "probability": 0.02,
        "effects": {
            "market_cooldown": 3600
        }
    },
    {
        "id": "gang_bonus",
        "name": "Bónus de Gangue",
        "description": "A tua gangue teve um bom mês. Recebeste um bónus!",
        "type": "positive",
        "probability": 0.06,
        "effects": {
            "clean_money": lambda level: 200 * level,
            "reputation": 20
        }
    },
]

def trigger_random_event(player_data: dict) -> Optional[Dict]:
    """Verifica e dispara evento aleatório"""
    last_event = player_data.get("last_random_event")
    
    # Eventos só podem acontecer a cada 1 hora
    if last_event:
        if isinstance(last_event, str):
            last_event = datetime.fromisoformat(last_event.replace('Z', '+00:00'))
        elapsed = (datetime.now(timezone.utc) - last_event).total_seconds()
        if elapsed < 3600:
            return None
    
    # Tentar disparar evento
    for event in RANDOM_EVENTS:
        if random.random() < event["probability"]:
            return event
    
    return None

def apply_event_effects(player_data: dict, event: Dict, level: int) -> Tuple[dict, str]:
    """Aplica efeitos de um evento"""
    effects = event["effects"]
    changes = []
    
    for effect_key, effect_value in effects.items():
        if effect_key == "dirty_money_multiplier":
            old_value = player_data.get("dirty_money", 0)
            new_value = int(old_value * effect_value)
            player_data["dirty_money"] = max(0, new_value)
            changes.append(f"Dinheiro sujo: €{old_value} → €{new_value}")
            
        elif effect_key == "clean_money_multiplier":
            old_value = player_data.get("clean_money", 0)
            new_value = int(old_value * effect_value)
            player_data["clean_money"] = max(0, new_value)
            changes.append(f"Dinheiro limpo: €{old_value} → €{new_value}")
            
        elif effect_key == "clean_money":
            amount = effect_value(level) if callable(effect_value) else effect_value
            player_data["clean_money"] = player_data.get("clean_money", 0) + amount
            changes.append(f"+€{amount} dinheiro limpo")
            
        elif effect_key == "xp":
            amount = effect_value(level) if callable(effect_value) else effect_value
            player_data["experience"] = player_data.get("experience", 0) + amount
            changes.append(f"+{amount} XP")
            
        elif effect_key == "heat":
            old_heat = player_data.get("heat", 0)
            new_heat = max(0, min(100, old_heat + effect_value))
            player_data["heat"] = new_heat
            changes.append(f"Heat: {old_heat} → {new_heat}")
            
        elif effect_key == "reputation":
            old_rep = player_data.get("reputation", 0)
            new_rep = max(0, old_rep + effect_value)
            player_data["reputation"] = new_rep
            changes.append(f"Reputação: {old_rep} → {new_rep}")
    
    player_data["last_random_event"] = datetime.now(timezone.utc)
    
    return player_data, " | ".join(changes)

# ==================== SISTEMA DE ANÁLISE E ESTATÍSTICAS ====================

def calculate_player_statistics(player_data: dict) -> Dict:
    """Calcula estatísticas detalhadas do jogador"""
    
    # Dados básicos
    experience = player_data.get("experience", 0)
    level = calculate_level(experience)
    clean_money = player_data.get("clean_money", 0)
    dirty_money = player_data.get("dirty_money", 0)
    bank_balance = player_data.get("bank_balance", 0)
    total_wealth = clean_money + bank_balance
    
    # Crimes
    crimes_committed = player_data.get("crimes_committed", 0)
    crimes_success = player_data.get("crimes_success", 0)
    crimes_failed = player_data.get("crimes_failed", 0)
    success_rate = (crimes_success / crimes_committed * 100) if crimes_committed > 0 else 0
    
    # Reputação e Heat
    reputation = player_data.get("reputation", 0)
    heat = player_data.get("heat", 0)
    
    # Tempo de jogo
    created_at = player_data.get("created_at", datetime.now(timezone.utc))
    if isinstance(created_at, str):
        created_at = datetime.fromisoformat(created_at.replace('Z', '+00:00'))
    play_time_days = (datetime.now(timezone.utc) - created_at).days
    
    # Eficiência
    money_per_crime = (clean_money + dirty_money) / crimes_committed if crimes_committed > 0 else 0
    xp_per_day = experience / max(play_time_days, 1)
    money_per_day = total_wealth / max(play_time_days, 1)
    
    # Rankings estimados
    rank_score = (level * 100) + (reputation * 2) + (total_wealth / 1000)
    
    # Categorização do jogador
    player_type = categorize_player(player_data, level)
    
    return {
        "basic": {
            "level": level,
            "experience": experience,
            "total_wealth": total_wealth,
            "reputation": reputation,
            "heat": heat
        },
        "crimes": {
            "total": crimes_committed,
            "success": crimes_success,
            "failed": crimes_failed,
            "success_rate": round(success_rate, 2)
        },
        "efficiency": {
            "money_per_crime": round(money_per_crime, 2),
            "xp_per_day": round(xp_per_day, 2),
            "money_per_day": round(money_per_day, 2)
        },
        "play_time": {
            "days": play_time_days,
            "total_hours": play_time_days * 24
        },
        "rank_score": round(rank_score, 2),
        "player_type": player_type
    }

def categorize_player(player_data: dict, level: int) -> Dict:
    """Categoriza o tipo de jogador baseado em comportamento"""
    
    crimes = player_data.get("crimes_committed", 0)
    properties = player_data.get("properties_count", 0)
    businesses = player_data.get("businesses_count", 0)
    gang_id = player_data.get("gang_id")
    reputation = player_data.get("reputation", 0)
    
    # Determinar tipo dominante
    if crimes > 100 and reputation > 500:
        primary_type = "Criminoso Hardcore"
        description = "Focado em crimes e reputação nas ruas"
    elif properties > 5 or businesses > 3:
        primary_type = "Empresário Criminal"
        description = "Investe em propriedades e negócios legítimos"
    elif gang_id and reputation > 300:
        primary_type = "Gangster Leal"
        description = "Dedicado à vida de gangue"
    elif level > 30:
        primary_type = "Veterano"
        description = "Jogador experiente e equilibrado"
    else:
        primary_type = "Iniciante"
        description = "Ainda explorando o submundo"
    
    return {
        "type": primary_type,
        "description": description
    }

# ==================== ECONOMIA DINÂMICA ====================

def calculate_market_prices(base_prices: Dict, global_data: Dict) -> Dict:
    """Calcula preços dinâmicos baseados em economia global"""
    
    total_players = global_data.get("total_players", 100)
    avg_level = global_data.get("avg_level", 10)
    market_activity = global_data.get("market_activity", 50)
    
    # Fator de inflação baseado em atividade
    inflation_factor = 1 + (market_activity / 100) * 0.3
    
    # Fator de nível médio
    level_factor = 1 + (avg_level / 100) * 0.5
    
    # Aplicar fatores
    adjusted_prices = {}
    for item, base_price in base_prices.items():
        # Adicionar variação aleatória (-10% a +15%)
        random_var = random.uniform(0.9, 1.15)
        
        final_price = int(base_price * inflation_factor * level_factor * random_var)
        adjusted_prices[item] = {
            "base_price": base_price,
            "current_price": final_price,
            "change_percent": round(((final_price / base_price) - 1) * 100, 1)
        }
    
    return adjusted_prices

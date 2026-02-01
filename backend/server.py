from fastapi import FastAPI, APIRouter, HTTPException, Depends, status, Query
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import bcrypt
from jose import jwt, JWTError
import random
import math

# Import Advanced Game Engine
from game_engine import (
    TimeWeatherSystem, PoliceAISystem, RelationshipSystem,
    NotorietySystem, HeistSystem, DynamicEconomySystem,
    ProceduralMissionGenerator, TerritoryControlSystem,
    DynamicEventSystem, TimeOfDay, WeatherType, NotorietyRank,
    PoliceAlertLevel, get_game_state_modifiers,
    calculate_mission_difficulty_adjusted
)

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

SECRET_KEY = os.environ.get('JWT_SECRET', 'submundo-secret-key-change-in-production')
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7

security = HTTPBearer()

app = FastAPI(title="SUBMUNDO API - Extended Edition")
api_router = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ============= EXTENDED MODELS =============

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    username: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"

class LaunderRequest(BaseModel):
    amount: float

class MissionCreate(BaseModel):
    type: str
    neighborhood_id: str

class GangCreate(BaseModel):
    name: str
    tag: str

class QuickActionRequest(BaseModel):
    action_type: str
    neighborhood_id: Optional[str] = None

class MessageCreate(BaseModel):
    recipient_id: str
    content: str

class TradeCreate(BaseModel):
    item_id: str
    price: float
    quantity: int = 1

class SkillUpgradeRequest(BaseModel):
    skill_id: str

class ContractCreate(BaseModel):
    target_player_id: str
    reward: float

class PropertyPurchase(BaseModel):
    property_type: str
    neighborhood_id: str
    custom_name: Optional[str] = None

class BusinessPurchase(BaseModel):
    business_type: str
    custom_name: Optional[str] = None

class CraftingRequest(BaseModel):
    recipe_id: str
    quantity: int = 1

class MarketListing(BaseModel):
    item_type: str  # "crafted" or "inventory"
    item_id: str
    price: float
    quantity: int = 1

class MarketPurchase(BaseModel):
    listing_id: str
    quantity: int = 1

# ============= GAME CONSTANTS =============

SKILLS_CONFIG = {
    "stealth": {"name": "Furtividade", "description": "Reduz chance de ser detectado", "max_level": 10, "base_cost": 500},
    "combat": {"name": "Combate", "description": "Aumenta dano em confrontos", "max_level": 10, "base_cost": 500},
    "hacking": {"name": "Hacking", "description": "Melhora missões digitais", "max_level": 10, "base_cost": 750},
    "driving": {"name": "Condução", "description": "Melhora fugas e perseguições", "max_level": 10, "base_cost": 500},
    "negotiation": {"name": "Negociação", "description": "Melhores preços e recompensas", "max_level": 10, "base_cost": 600},
    "leadership": {"name": "Liderança", "description": "Bónus para gangue", "max_level": 10, "base_cost": 800},
    "intimidation": {"name": "Intimidação", "description": "Mais eficaz em cobranças", "max_level": 10, "base_cost": 550},
    "lockpicking": {"name": "Arrombamento", "description": "Abre portas e cofres", "max_level": 10, "base_cost": 450},
}

ITEMS_CATALOG = [
    {"id": "lockpick_basic", "name": "Kit Gazua Básico", "type": "tool", "price": 250, "effect": {"lockpicking_bonus": 1}, "consumable": False},
    {"id": "lockpick_pro", "name": "Kit Gazua Pro", "type": "tool", "price": 1200, "effect": {"lockpicking_bonus": 3}, "consumable": False},
    {"id": "mask_basic", "name": "Máscara Simples", "type": "disguise", "price": 150, "effect": {"stealth_bonus": 1}, "consumable": False},
    {"id": "mask_pro", "name": "Máscara Profissional", "type": "disguise", "price": 800, "effect": {"stealth_bonus": 3, "heat_reduction": 5}, "consumable": False},
    {"id": "fake_id", "name": "Identificação Falsa", "type": "document", "price": 2500, "effect": {"heat_reduction": 10}, "consumable": True},
    {"id": "burner_phone", "name": "Telefone Descartável", "type": "tool", "price": 500, "effect": {"untraceable": True}, "consumable": True},
    {"id": "body_armor", "name": "Colete Balístico", "type": "armor", "price": 5000, "effect": {"damage_reduction": 30}, "consumable": False},
    {"id": "first_aid", "name": "Kit Primeiros Socorros", "type": "medical", "price": 350, "effect": {"heal": 30}, "consumable": True},
    {"id": "adrenaline", "name": "Injeção Adrenalina", "type": "medical", "price": 1200, "effect": {"energy_boost": 50}, "consumable": True},
    {"id": "hacking_usb", "name": "USB Hacking", "type": "tool", "price": 1800, "effect": {"hacking_bonus": 2}, "consumable": True},
    {"id": "silencer", "name": "Silenciador", "type": "weapon_mod", "price": 3500, "effect": {"stealth_bonus": 5}, "consumable": False},
    {"id": "night_vision", "name": "Óculos Visão Noturna", "type": "gear", "price": 7500, "effect": {"night_bonus": 50}, "consumable": False},
    {"id": "gps_jammer", "name": "Bloqueador GPS", "type": "tool", "price": 6000, "effect": {"untraceable": True, "duration": 3600}, "consumable": True},
    {"id": "smoke_bomb", "name": "Bomba de Fumo", "type": "tactical", "price": 750, "effect": {"escape_bonus": 30}, "consumable": True},
    {"id": "emp_device", "name": "Dispositivo EMP", "type": "tactical", "price": 12000, "effect": {"disable_electronics": True}, "consumable": True},
    {"id": "bribe_money", "name": "Envelope de Suborno", "type": "special", "price": 2500, "effect": {"reduce_heat": 20}, "consumable": True},
    {"id": "counterfeit_cash", "name": "Notas Falsas", "type": "special", "price": 800, "effect": {"dirty_money": 1000}, "consumable": True},
    {"id": "police_scanner", "name": "Scanner Policial", "type": "tool", "price": 3000, "effect": {"police_warning": True}, "consumable": False},
    {"id": "drug_stash_small", "name": "Pequeno Stash", "type": "contraband", "price": 3500, "effect": {"resell_value": 5000}, "consumable": True},
    {"id": "drug_stash_large", "name": "Grande Stash", "type": "contraband", "price": 18000, "effect": {"resell_value": 25000}, "consumable": True},
]

ACHIEVEMENTS_CONFIG = [
    {"id": "first_blood", "name": "Primeiro Sangue", "description": "Completa a tua primeira missão", "requirement": {"missions_completed": 1}, "reward": {"clean_money": 100, "experience": 50}},
    {"id": "veteran", "name": "Veterano", "description": "Completa 50 missões", "requirement": {"missions_completed": 50}, "reward": {"clean_money": 5000, "experience": 500}},
    {"id": "crime_lord", "name": "Senhor do Crime", "description": "Completa 200 missões", "requirement": {"missions_completed": 200}, "reward": {"clean_money": 25000, "experience": 2000}},
    {"id": "millionaire", "name": "Milionário", "description": "Acumula €1.000.000 em ganhos totais", "requirement": {"total_earnings": 1000000}, "reward": {"reputation": 100, "experience": 1000}},
    {"id": "gang_founder", "name": "Fundador", "description": "Cria uma gangue", "requirement": {"gang_created": True}, "reward": {"clean_money": 1000, "reputation": 25}},
    {"id": "territory_king", "name": "Rei do Território", "description": "Controla 3 territórios", "requirement": {"territories_controlled": 3}, "reward": {"clean_money": 10000, "reputation": 50}},
    {"id": "war_hero", "name": "Herói de Guerra", "description": "Vence 10 guerras", "requirement": {"wars_won": 10}, "reward": {"clean_money": 15000, "reputation": 100}},
    {"id": "ghost", "name": "Fantasma", "description": "Completa 20 missões sem ser detectado", "requirement": {"stealth_missions": 20}, "reward": {"experience": 500}},
    {"id": "speedster", "name": "Velocista", "description": "Possui 5 veículos", "requirement": {"vehicles_owned": 5}, "reward": {"clean_money": 5000}},
    {"id": "collector", "name": "Colecionador", "description": "Possui 20 itens diferentes", "requirement": {"unique_items": 20}, "reward": {"clean_money": 3000}},
    {"id": "survivor", "name": "Sobrevivente", "description": "Escapa 10 vezes da polícia", "requirement": {"police_escapes": 10}, "reward": {"experience": 300}},
    {"id": "businessman", "name": "Empresário", "description": "Lava €100.000", "requirement": {"money_laundered": 100000}, "reward": {"clean_money": 10000}},
    {"id": "social_butterfly", "name": "Borboleta Social", "description": "Faz 10 aliados", "requirement": {"allies": 10}, "reward": {"reputation": 30}},
    {"id": "feared", "name": "Temido", "description": "Atinge 100 de reputação", "requirement": {"reputation": 100}, "reward": {"clean_money": 5000}},
    {"id": "level_10", "name": "Nível 10", "description": "Atinge o nível 10", "requirement": {"level": 10}, "reward": {"clean_money": 2000}},
    {"id": "level_25", "name": "Nível 25", "description": "Atinge o nível 25", "requirement": {"level": 25}, "reward": {"clean_money": 10000}},
    {"id": "level_50", "name": "Lenda", "description": "Atinge o nível 50", "requirement": {"level": 50}, "reward": {"clean_money": 50000, "reputation": 200}},
    {"id": "skill_master", "name": "Mestre", "description": "Maximiza uma skill", "requirement": {"max_skill": True}, "reward": {"experience": 1000}},
    {"id": "daily_grind", "name": "Rotina Diária", "description": "Reclama 30 recompensas diárias", "requirement": {"daily_rewards": 30}, "reward": {"clean_money": 5000}},
    {"id": "high_roller", "name": "Grande Apostador", "description": "Gasta €500.000 em compras", "requirement": {"total_spent": 500000}, "reward": {"reputation": 50}},
]

NPCS_CONFIG = [
    {"id": "tony_loans", "name": "Tony 'O Agiota'", "role": "Agiota", "location": "centro", "description": "Empresta dinheiro a juros altos. Não falha um pagamento.", "services": ["loan", "debt_collection"], "relationship_effects": {"positive": "lower_interest", "negative": "higher_interest"}},
    {"id": "maria_info", "name": "Maria 'Olhos'", "role": "Informante", "location": "favela", "description": "Sabe tudo o que se passa na cidade. Informação tem preço.", "services": ["intel", "tips"], "relationship_effects": {"positive": "free_tips", "negative": "false_info"}},
    {"id": "carlos_fence", "name": "Carlos 'O Cerca'", "role": "Recetador", "location": "porto", "description": "Compra e vende mercadoria roubada. Discreto.", "services": ["fence", "special_items"], "relationship_effects": {"positive": "better_prices", "negative": "worse_prices"}},
    {"id": "dr_patch", "name": "Dr. Patch", "role": "Médico Clandestino", "location": "suburbio", "description": "Trata ferimentos sem perguntas. Caro mas eficaz.", "services": ["healing", "surgery"], "relationship_effects": {"positive": "discount", "negative": "refused_service"}},
    {"id": "snake_dealer", "name": "Snake", "role": "Traficante", "location": "noite", "description": "Fornece substâncias para revenda. Conexões perigosas.", "services": ["drugs", "contacts"], "relationship_effects": {"positive": "bulk_discount", "negative": "bad_product"}},
    {"id": "officer_santos", "name": "Agente Santos", "role": "Polícia Corrupto", "location": "centro", "description": "Por um preço, olha para o outro lado.", "services": ["reduce_heat", "warnings"], "relationship_effects": {"positive": "immunity", "negative": "targeted"}},
    {"id": "hacker_zero", "name": "Zero", "role": "Hacker", "location": "comercial", "description": "Especialista em sistemas digitais. Trabalha nas sombras.", "services": ["hacking", "data"], "relationship_effects": {"positive": "free_hacks", "negative": "exposed"}},
    {"id": "arms_dealer", "name": "Viktor 'O Armeiro'", "role": "Traficante de Armas", "location": "porto", "description": "Fornece equipamento tático. Sem perguntas.", "services": ["weapons", "gear"], "relationship_effects": {"positive": "exclusive_items", "negative": "no_service"}},
    {"id": "racing_king", "name": "Rei das Corridas", "role": "Organizador", "location": "suburbio", "description": "Organiza corridas ilegais. Prémios altos.", "services": ["races", "vehicle_mods"], "relationship_effects": {"positive": "race_invites", "negative": "banned"}},
    {"id": "boss_carvalho", "name": "Chefe Carvalho", "role": "Crime Boss", "location": "centro", "description": "Controla grande parte do crime organizado. Respeitado e temido.", "services": ["contracts", "protection"], "relationship_effects": {"positive": "contracts", "negative": "hit"}},
]

# ============= PROPERTY & BUSINESS SYSTEM =============

PROPERTY_TYPES = [
    {"id": "apartamento", "name": "Apartamento", "description": "Espaço compacto no centro urbano.", "base_price": 15000, "income_per_hour": 25, "maintenance_cost": 50, "capacity": 1, "allowed_neighborhoods": ["centro", "comercial", "universidade"]},
    {"id": "casa", "name": "Casa", "description": "Residência confortável com espaço extra.", "base_price": 40000, "income_per_hour": 60, "maintenance_cost": 120, "capacity": 2, "allowed_neighborhoods": ["suburbio", "praia", "elite"]},
    {"id": "armazem", "name": "Armazém", "description": "Espaço amplo para guardar mercadoria.", "base_price": 65000, "income_per_hour": 100, "maintenance_cost": 180, "capacity": 10, "allowed_neighborhoods": ["porto", "industrial", "comercial"]},
    {"id": "fabrica", "name": "Fábrica Clandestina", "description": "Instalação secreta para operações ilegais.", "base_price": 120000, "income_per_hour": 200, "maintenance_cost": 350, "capacity": 5, "allowed_neighborhoods": ["industrial", "porto", "favela"]},
    {"id": "mansao", "name": "Mansão", "description": "Propriedade de luxo com todas as comodidades.", "base_price": 250000, "income_per_hour": 400, "maintenance_cost": 700, "capacity": 8, "allowed_neighborhoods": ["elite", "praia"]},
    {"id": "bunker", "name": "Bunker Subterrâneo", "description": "Refúgio secreto e fortificado.", "base_price": 180000, "income_per_hour": 250, "maintenance_cost": 450, "capacity": 15, "allowed_neighborhoods": ["industrial", "suburbio"]},
]

BUSINESS_TYPES = [
    {
        "id": "laboratorio",
        "name": "Laboratório",
        "description": "Produz substâncias sintéticas de alta qualidade.",
        "neighborhood": "favela",
        "price": 75000,
        "maintenance_cost": 1200,
        "icon": "flask",
        "products": ["droga_sintetica", "medicamento_ilegal", "estimulante"]
    },
    {
        "id": "oficina",
        "name": "Oficina Clandestina",
        "description": "Modifica e fabrica armas fora do radar.",
        "neighborhood": "porto",
        "price": 95000,
        "maintenance_cost": 1400,
        "icon": "wrench",
        "products": ["arma_modificada", "silenciador_custom", "colete_reforçado"]
    },
    {
        "id": "falsificador",
        "name": "Falsificador",
        "description": "Especialista em documentos e identidades falsas.",
        "neighborhood": "centro",
        "price": 85000,
        "maintenance_cost": 1100,
        "icon": "file-text",
        "products": ["documento_falso", "passaporte_falso", "carta_conducao_falsa"]
    },
    {
        "id": "garage",
        "name": "Garage Tunning",
        "description": "Personaliza e melhora veículos para fugas.",
        "neighborhood": "suburbio",
        "price": 110000,
        "maintenance_cost": 1300,
        "icon": "car",
        "products": ["turbo_kit", "blindagem_leve", "kit_fuga"]
    },
    {
        "id": "destilaria",
        "name": "Destilaria Ilegal",
        "description": "Produz bebidas contrabandeadas de alta qualidade.",
        "neighborhood": "noite",
        "price": 60000,
        "maintenance_cost": 900,
        "icon": "wine",
        "products": ["whisky_premium", "vodka_artesanal", "licor_raro"]
    },
    {
        "id": "centro_hacking",
        "name": "Centro de Hacking",
        "description": "Operações digitais e cibercrimes.",
        "neighborhood": "comercial",
        "price": 125000,
        "maintenance_cost": 1600,
        "icon": "terminal",
        "products": ["malware_custom", "dados_roubados", "crypto_mixer"]
    },
]

CRAFTING_RECIPES = [
    # Laboratório (Favela) - Margem ~50-70% em vez de 200%+
    {"id": "droga_sintetica", "name": "Droga Sintética", "description": "Substância potente para revenda.", "business_type": "laboratorio", "cost": 800, "time_minutes": 45, "sell_value": 1200, "quantity": 5, "skill_bonus": "hacking", "heat_risk": 20},
    {"id": "medicamento_ilegal", "name": "Medicamento Ilegal", "description": "Fármacos sem receita.", "business_type": "laboratorio", "cost": 500, "time_minutes": 30, "sell_value": 750, "quantity": 10, "skill_bonus": None, "heat_risk": 8},
    {"id": "estimulante", "name": "Estimulante Extremo", "description": "Boost de energia temporário.", "business_type": "laboratorio", "cost": 1200, "time_minutes": 60, "sell_value": 1900, "quantity": 3, "skill_bonus": "hacking", "heat_risk": 25},
    
    # Oficina Clandestina (Porto) - Margem ~60%
    {"id": "arma_modificada", "name": "Arma Modificada", "description": "Arma com performance melhorada.", "business_type": "oficina", "cost": 2500, "time_minutes": 90, "sell_value": 4000, "quantity": 1, "skill_bonus": "combat", "heat_risk": 30},
    {"id": "silenciador_custom", "name": "Silenciador Custom", "description": "Silenciador de alta qualidade.", "business_type": "oficina", "cost": 1200, "time_minutes": 45, "sell_value": 1900, "quantity": 2, "skill_bonus": "stealth", "heat_risk": 15},
    {"id": "colete_reforcado", "name": "Colete Reforçado", "description": "Proteção balística melhorada.", "business_type": "oficina", "cost": 3200, "time_minutes": 120, "sell_value": 5000, "quantity": 1, "skill_bonus": "combat", "heat_risk": 20},
    
    # Falsificador (Centro) - Margem ~60%
    {"id": "documento_falso", "name": "Documento Falso", "description": "ID falsa de alta qualidade.", "business_type": "falsificador", "cost": 700, "time_minutes": 35, "sell_value": 1100, "quantity": 3, "skill_bonus": "negotiation", "heat_risk": 12},
    {"id": "passaporte_falso", "name": "Passaporte Falso", "description": "Passaporte internacional falso.", "business_type": "falsificador", "cost": 1800, "time_minutes": 90, "sell_value": 2800, "quantity": 1, "skill_bonus": "negotiation", "heat_risk": 25},
    {"id": "carta_conducao_falsa", "name": "Carta de Condução Falsa", "description": "Habilitação falsificada.", "business_type": "falsificador", "cost": 500, "time_minutes": 25, "sell_value": 800, "quantity": 5, "skill_bonus": None, "heat_risk": 8},
    
    # Garage Tunning (Subúrbio) - Margem ~50%
    {"id": "turbo_kit", "name": "Kit Turbo", "description": "Aumenta velocidade do veículo.", "business_type": "garage", "cost": 4000, "time_minutes": 180, "sell_value": 6000, "quantity": 1, "skill_bonus": "driving", "heat_risk": 8},
    {"id": "blindagem_leve", "name": "Blindagem Leve", "description": "Proteção básica para veículo.", "business_type": "garage", "cost": 5000, "time_minutes": 210, "sell_value": 7500, "quantity": 1, "skill_bonus": "driving", "heat_risk": 12},
    {"id": "kit_fuga", "name": "Kit de Fuga", "description": "Equipamento para fugas rápidas.", "business_type": "garage", "cost": 2800, "time_minutes": 90, "sell_value": 4200, "quantity": 1, "skill_bonus": "stealth", "heat_risk": 5},
    
    # Destilaria (Noite) - Margem ~50%
    {"id": "whisky_premium", "name": "Whisky Premium", "description": "Bebida de alta qualidade.", "business_type": "destilaria", "cost": 1000, "time_minutes": 60, "sell_value": 1500, "quantity": 6, "skill_bonus": "negotiation", "heat_risk": 5},
    {"id": "vodka_artesanal", "name": "Vodka Artesanal", "description": "Destilado puro.", "business_type": "destilaria", "cost": 700, "time_minutes": 45, "sell_value": 1050, "quantity": 8, "skill_bonus": None, "heat_risk": 3},
    {"id": "licor_raro", "name": "Licor Raro", "description": "Bebida exclusiva e cara.", "business_type": "destilaria", "cost": 1600, "time_minutes": 120, "sell_value": 2500, "quantity": 3, "skill_bonus": "negotiation", "heat_risk": 8},
    
    # Centro de Hacking (Comercial) - Margem ~60-70%
    {"id": "malware_custom", "name": "Malware Custom", "description": "Software malicioso personalizado.", "business_type": "centro_hacking", "cost": 3200, "time_minutes": 90, "sell_value": 5200, "quantity": 1, "skill_bonus": "hacking", "heat_risk": 35},
    {"id": "dados_roubados", "name": "Dados Roubados", "description": "Informação sensível de empresas.", "business_type": "centro_hacking", "cost": 2500, "time_minutes": 60, "sell_value": 4000, "quantity": 1, "skill_bonus": "hacking", "heat_risk": 30},
    {"id": "crypto_mixer", "name": "Crypto Mixer", "description": "Serviço de lavagem de criptomoedas.", "business_type": "centro_hacking", "cost": 5000, "time_minutes": 45, "sell_value": 8000, "quantity": 1, "skill_bonus": "hacking", "heat_risk": 20},
]

# Market fee percentage - aumentado para 10%
MARKET_FEE = 0.10  # 10%

CONTRACTS_CONFIG = [
    {"id": "assassination", "name": "Assassinato", "description": "Eliminar um alvo específico", "base_reward": 5000, "risk": 9, "heat_impact": 60, "reputation_impact": 20, "duration_hours": 48},
    {"id": "kidnapping", "name": "Rapto", "description": "Sequestrar e manter refém", "base_reward": 7000, "risk": 8, "heat_impact": 50, "reputation_impact": 15, "duration_hours": 72},
    {"id": "sabotage", "name": "Sabotagem", "description": "Destruir propriedade rival", "base_reward": 2500, "risk": 6, "heat_impact": 35, "reputation_impact": 10, "duration_hours": 24},
    {"id": "intimidation", "name": "Intimidação", "description": "Assustar um alvo", "base_reward": 1000, "risk": 4, "heat_impact": 15, "reputation_impact": 5, "duration_hours": 12},
    {"id": "theft_special", "name": "Roubo Especial", "description": "Roubar item específico", "base_reward": 4000, "risk": 7, "heat_impact": 40, "reputation_impact": 12, "duration_hours": 36},
    {"id": "escort", "name": "Escolta", "description": "Proteger alguém durante viagem", "base_reward": 1500, "risk": 5, "heat_impact": 8, "reputation_impact": 8, "duration_hours": 16},
    {"id": "delivery", "name": "Entrega Especial", "description": "Transportar mercadoria sensível", "base_reward": 2000, "risk": 5, "heat_impact": 20, "reputation_impact": 6, "duration_hours": 8},
    {"id": "info_extraction", "name": "Extração de Info", "description": "Obter informação por qualquer meio", "base_reward": 3000, "risk": 6, "heat_impact": 25, "reputation_impact": 10, "duration_hours": 24},
]

VEHICLE_CATALOG = [
    {"id": "bicicleta", "name": "Bicicleta", "description": "Transporte básico e silencioso.", "price": 800, "speed": 2, "stealth": 8, "capacity": 1, "maintenance_cost": 20, "category": "basic"},
    {"id": "scooter", "name": "Scooter", "description": "Mobilidade urbana económica.", "price": 5000, "speed": 4, "stealth": 6, "capacity": 1, "maintenance_cost": 100, "category": "basic"},
    {"id": "carro_usado", "name": "Carro Usado", "description": "Veículo discreto para o dia-a-dia.", "price": 15000, "speed": 5, "stealth": 5, "capacity": 4, "maintenance_cost": 250, "category": "standard"},
    {"id": "mota_desportiva", "name": "Mota Desportiva", "description": "Rápida e perfeita para fugas.", "price": 35000, "speed": 9, "stealth": 4, "capacity": 1, "maintenance_cost": 450, "category": "sport"},
    {"id": "sedan_luxo", "name": "Sedan de Luxo", "description": "Conforto e estilo para negócios.", "price": 75000, "speed": 7, "stealth": 3, "capacity": 4, "maintenance_cost": 800, "category": "luxury"},
    {"id": "suv_blindado", "name": "SUV Blindado", "description": "Proteção máxima para situações perigosas.", "price": 120000, "speed": 5, "stealth": 2, "capacity": 6, "maintenance_cost": 1200, "category": "armored"},
    {"id": "carrinha_carga", "name": "Carrinha de Carga", "description": "Ideal para transportar mercadoria.", "price": 45000, "speed": 4, "stealth": 5, "capacity": 20, "maintenance_cost": 600, "category": "utility"},
    {"id": "desportivo", "name": "Desportivo Exótico", "description": "O sonho de qualquer criminoso.", "price": 250000, "speed": 10, "stealth": 1, "capacity": 2, "maintenance_cost": 2500, "category": "exotic"},
    {"id": "mota_chopper", "name": "Chopper Customizada", "description": "Estilo e presença.", "price": 55000, "speed": 7, "stealth": 3, "capacity": 2, "maintenance_cost": 700, "category": "custom"},
    {"id": "muscle_car", "name": "Muscle Car", "description": "Potência americana clássica.", "price": 90000, "speed": 8, "stealth": 2, "capacity": 4, "maintenance_cost": 1000, "category": "sport"},
    {"id": "van_stealth", "name": "Van Operações", "description": "Equipada para operações especiais.", "price": 85000, "speed": 5, "stealth": 7, "capacity": 8, "maintenance_cost": 900, "category": "utility"},
    {"id": "supercar", "name": "Supercar", "description": "Velocidade pura, sem compromissos.", "price": 500000, "speed": 10, "stealth": 1, "capacity": 2, "maintenance_cost": 5000, "category": "exotic"},
]

EVENT_TEMPLATES = [
    {"id": "police_crackdown", "name": "Operação Policial", "description": "A polícia está em força nas ruas. Cuidado redobrado!", "duration_minutes": 30, "effects": {"heat_multiplier": 2.0, "reward_multiplier": 0.8, "risk_modifier": 2}, "icon": "shield-alert"},
    {"id": "festival", "name": "Festival da Cidade", "description": "Multidões distraídas, oportunidades abundantes!", "duration_minutes": 60, "effects": {"heat_multiplier": 0.7, "reward_multiplier": 1.5, "risk_modifier": -1}, "icon": "party-popper"},
    {"id": "blackout", "name": "Apagão Geral", "description": "A cidade está às escuras. Caos total!", "duration_minutes": 20, "effects": {"heat_multiplier": 0.5, "reward_multiplier": 2.0, "risk_modifier": 0}, "icon": "zap-off"},
    {"id": "gang_truce", "name": "Trégua entre Gangues", "description": "As gangues declararam paz temporária.", "duration_minutes": 45, "effects": {"heat_multiplier": 0.8, "reward_multiplier": 1.0, "risk_modifier": -2, "wars_disabled": True}, "icon": "handshake"},
    {"id": "economic_boom", "name": "Boom Económico", "description": "Dinheiro a circular! Negócios em alta!", "duration_minutes": 40, "effects": {"heat_multiplier": 1.0, "reward_multiplier": 1.8, "risk_modifier": 0}, "icon": "trending-up"},
    {"id": "heat_wave", "name": "Onda de Calor", "description": "Calor extremo. Menos polícia nas ruas.", "duration_minutes": 50, "effects": {"heat_multiplier": 0.6, "reward_multiplier": 1.0, "risk_modifier": -1}, "icon": "thermometer"},
    {"id": "vip_visit", "name": "Visita VIP", "description": "Uma celebridade na cidade. Segurança reforçada!", "duration_minutes": 25, "effects": {"heat_multiplier": 1.5, "reward_multiplier": 2.0, "risk_modifier": 3}, "icon": "star"},
    {"id": "underground_market", "name": "Mercado Negro Especial", "description": "Vendedores clandestinos com ofertas únicas!", "duration_minutes": 35, "effects": {"heat_multiplier": 1.2, "reward_multiplier": 1.5, "risk_modifier": 1}, "icon": "shopping-bag"},
    {"id": "riot", "name": "Motim Urbano", "description": "Caos nas ruas! Polícia ocupada!", "duration_minutes": 25, "effects": {"heat_multiplier": 0.4, "reward_multiplier": 1.3, "risk_modifier": -2}, "icon": "flame"},
    {"id": "election_day", "name": "Dia de Eleições", "description": "Políticos distraídos, oportunidades únicas.", "duration_minutes": 60, "effects": {"heat_multiplier": 0.9, "reward_multiplier": 1.4, "risk_modifier": 0}, "icon": "vote"},
    {"id": "storm", "name": "Tempestade Severa", "description": "Mau tempo dificulta operações.", "duration_minutes": 30, "effects": {"heat_multiplier": 0.7, "reward_multiplier": 0.9, "risk_modifier": 1}, "icon": "cloud-rain"},
    {"id": "sports_final", "name": "Final Desportiva", "description": "Cidade focada no jogo. Distrações garantidas!", "duration_minutes": 90, "effects": {"heat_multiplier": 0.6, "reward_multiplier": 1.6, "risk_modifier": -1}, "icon": "trophy"},
]

MISSION_TEMPLATES = [
    {"type": "roubo_pequeno", "name": "Roubo de Carteira", "description": "Roubar a carteira de um transeunte distraído.", "risk": 2, "duration_seconds": 45, "reward_min": 20, "reward_max": 80, "heat_impact": 8, "reputation_impact": 1, "energy_cost": 12, "category": "crime", "skill_bonus": "stealth"},
    {"type": "roubo_carro", "name": "Roubo de Carro", "description": "Roubar um veículo estacionado.", "risk": 4, "duration_seconds": 90, "reward_min": 100, "reward_max": 400, "heat_impact": 20, "reputation_impact": 3, "energy_cost": 25, "category": "crime", "skill_bonus": "lockpicking"},
    {"type": "assalto_loja", "name": "Assalto a Loja", "description": "Assaltar uma loja comercial.", "risk": 6, "duration_seconds": 120, "reward_min": 250, "reward_max": 800, "heat_impact": 35, "reputation_impact": 5, "energy_cost": 35, "category": "crime", "skill_bonus": "intimidation"},
    {"type": "contrabando", "name": "Entrega de Contrabando", "description": "Transportar mercadoria ilegal.", "risk": 5, "duration_seconds": 180, "reward_min": 150, "reward_max": 500, "heat_impact": 15, "reputation_impact": 4, "energy_cost": 30, "category": "crime", "skill_bonus": "driving"},
    {"type": "emprego_legal", "name": "Trabalho Honesto", "description": "Fazer um trabalho temporário legal.", "risk": 0, "duration_seconds": 300, "reward_min": 40, "reward_max": 120, "heat_impact": -8, "reputation_impact": 0, "energy_cost": 25, "category": "legal", "skill_bonus": None},
    {"type": "hacker", "name": "Hacking Bancário", "description": "Invadir sistemas de um banco local.", "risk": 7, "duration_seconds": 240, "reward_min": 400, "reward_max": 1200, "heat_impact": 30, "reputation_impact": 6, "energy_cost": 40, "category": "crime", "skill_bonus": "hacking"},
    {"type": "cobranca", "name": "Cobrança de Dívidas", "description": "Cobrar dívidas para um agiota local.", "risk": 4, "duration_seconds": 90, "reward_min": 100, "reward_max": 350, "heat_impact": 12, "reputation_impact": 2, "energy_cost": 20, "category": "crime", "skill_bonus": "intimidation"},
    {"type": "vigilante", "name": "Vigilante Noturno", "description": "Vigiar um armazém à noite.", "risk": 1, "duration_seconds": 360, "reward_min": 60, "reward_max": 150, "heat_impact": -5, "reputation_impact": 1, "energy_cost": 20, "category": "legal", "skill_bonus": None},
    {"type": "arrombamento", "name": "Arrombamento Residencial", "description": "Invadir uma casa e roubar objetos de valor.", "risk": 5, "duration_seconds": 150, "reward_min": 200, "reward_max": 700, "heat_impact": 25, "reputation_impact": 4, "energy_cost": 30, "category": "crime", "skill_bonus": "lockpicking"},
    {"type": "fraude", "name": "Fraude de Identidade", "description": "Usar documentos falsos para obter dinheiro.", "risk": 4, "duration_seconds": 180, "reward_min": 200, "reward_max": 600, "heat_impact": 18, "reputation_impact": 3, "energy_cost": 25, "category": "crime", "skill_bonus": "negotiation"},
    {"type": "extorsao", "name": "Extorsão", "description": "Chantagear um empresário local.", "risk": 6, "duration_seconds": 150, "reward_min": 300, "reward_max": 900, "heat_impact": 30, "reputation_impact": 6, "energy_cost": 35, "category": "crime", "skill_bonus": "intimidation"},
    {"type": "corrida_ilegal", "name": "Corrida Ilegal", "description": "Participar numa corrida de rua.", "risk": 5, "duration_seconds": 240, "reward_min": 400, "reward_max": 1500, "heat_impact": 20, "reputation_impact": 5, "energy_cost": 40, "category": "crime", "skill_bonus": "driving"},
    {"type": "trafego_armas", "name": "Tráfico de Armas", "description": "Transportar armas para um comprador.", "risk": 8, "duration_seconds": 240, "reward_min": 600, "reward_max": 1800, "heat_impact": 45, "reputation_impact": 8, "energy_cost": 50, "category": "crime", "skill_bonus": "driving"},
    {"type": "sequestro_rapido", "name": "Sequestro Relâmpago", "description": "Raptar alguém por resgate rápido.", "risk": 8, "duration_seconds": 300, "reward_min": 800, "reward_max": 2500, "heat_impact": 55, "reputation_impact": 10, "energy_cost": 55, "category": "crime", "skill_bonus": "combat"},
    {"type": "assalto_banco", "name": "Assalto a Banco", "description": "O grande golpe. Alto risco, alta recompensa.", "risk": 10, "duration_seconds": 420, "reward_min": 2000, "reward_max": 8000, "heat_impact": 80, "reputation_impact": 20, "energy_cost": 70, "category": "crime", "skill_bonus": "combat"},
    {"type": "entrega_pizza", "name": "Entrega de Pizza", "description": "Trabalho honesto como entregador.", "risk": 0, "duration_seconds": 120, "reward_min": 15, "reward_max": 40, "heat_impact": -3, "reputation_impact": 0, "energy_cost": 15, "category": "legal", "skill_bonus": "driving"},
    {"type": "seguranca", "name": "Segurança Privada", "description": "Trabalhar como segurança num evento.", "risk": 1, "duration_seconds": 420, "reward_min": 80, "reward_max": 200, "heat_impact": -8, "reputation_impact": 1, "energy_cost": 30, "category": "legal", "skill_bonus": "combat"},
    {"type": "informante", "name": "Venda de Informação", "description": "Vender informações sobre rivais.", "risk": 3, "duration_seconds": 60, "reward_min": 100, "reward_max": 350, "heat_impact": 8, "reputation_impact": 2, "energy_cost": 15, "category": "crime", "skill_bonus": "negotiation"},
]

NEIGHBORHOODS_CONFIG = [
    {"id": "centro", "name": "Centro", "description": "O coração financeiro da cidade. Muitos negócios legais e ilegais. Segurança moderada.", "economic_value": 80, "heat_level": 30, "control_status": "neutro", "controlling_gang": None, "active_events": [], "population": "alta", "police_presence": "alta"},
    {"id": "porto", "name": "Porto Industrial", "description": "Zona portuária com armazéns e contrabando. Ideal para importações ilegais.", "economic_value": 70, "heat_level": 20, "control_status": "neutro", "controlling_gang": None, "active_events": [], "population": "baixa", "police_presence": "média"},
    {"id": "favela", "name": "Favela Norte", "description": "Bairro pobre mas com muita atividade criminosa. Território disputado.", "economic_value": 40, "heat_level": 50, "control_status": "neutro", "controlling_gang": None, "active_events": [], "population": "alta", "police_presence": "baixa"},
    {"id": "suburbio", "name": "Subúrbio Sul", "description": "Zona residencial tranquila com oportunidades ocultas. Casas ricas.", "economic_value": 50, "heat_level": 10, "control_status": "neutro", "controlling_gang": None, "active_events": [], "population": "média", "police_presence": "média"},
    {"id": "comercial", "name": "Zona Comercial", "description": "Lojas, restaurantes e turistas desatentos. Bom para pequenos furtos.", "economic_value": 65, "heat_level": 25, "control_status": "neutro", "controlling_gang": None, "active_events": [], "population": "muito alta", "police_presence": "alta"},
    {"id": "noite", "name": "Distrito da Noite", "description": "Bares, clubes e negócios obscuros. A noite nunca para.", "economic_value": 75, "heat_level": 40, "control_status": "neutro", "controlling_gang": None, "active_events": [], "population": "alta", "police_presence": "baixa"},
    {"id": "industrial", "name": "Zona Industrial", "description": "Fábricas abandonadas e armazéns. Perfeito para esconderijos.", "economic_value": 45, "heat_level": 15, "control_status": "neutro", "controlling_gang": None, "active_events": [], "population": "muito baixa", "police_presence": "muito baixa"},
    {"id": "universidade", "name": "Bairro Universitário", "description": "Estudantes e festas. Mercado de drogas leves.", "economic_value": 55, "heat_level": 20, "control_status": "neutro", "controlling_gang": None, "active_events": [], "population": "alta", "police_presence": "média"},
    {"id": "praia", "name": "Zona da Praia", "description": "Turistas e dinheiro fácil. Vigilância sazonal.", "economic_value": 60, "heat_level": 25, "control_status": "neutro", "controlling_gang": None, "active_events": [], "population": "variável", "police_presence": "média"},
    {"id": "elite", "name": "Bairro Elite", "description": "Mansões e fortunas. Segurança privada forte.", "economic_value": 95, "heat_level": 35, "control_status": "neutro", "controlling_gang": None, "active_events": [], "population": "baixa", "police_presence": "muito alta"},
]

# ============= AUTH HELPERS =============

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Token inválido")
        user = await db.players.find_one({"id": user_id}, {"_id": 0, "password": 0})
        if user is None:
            raise HTTPException(status_code=401, detail="Utilizador não encontrado")
        return user
    except JWTError:
        raise HTTPException(status_code=401, detail="Token inválido ou expirado")

# ============= GAME HELPERS =============

def calculate_skill_bonus(player_skills: dict, skill_name: str) -> int:
    if not skill_name or not player_skills:
        return 0
    return player_skills.get(skill_name, {}).get("level", 0) * 3

def calculate_vehicle_bonus(vehicle: dict) -> dict:
    if not vehicle:
        return {"speed_bonus": 0, "stealth_bonus": 0}
    return {
        "speed_bonus": vehicle.get("speed", 0) * 2,
        "stealth_bonus": vehicle.get("stealth", 0) * 2
    }

def calculate_item_bonuses(items: list) -> dict:
    bonuses = {"stealth_bonus": 0, "combat_bonus": 0, "hacking_bonus": 0, "lockpicking_bonus": 0}
    for item in items:
        effects = item.get("effect", {})
        for key in bonuses:
            if key in effects:
                bonuses[key] += effects[key]
    return bonuses

def calculate_mission_success(risk: int, player_level: int, heat: int, skill_bonus: int = 0, vehicle_bonus: int = 0, item_bonus: int = 0) -> bool:
    base_chance = 70 - (risk * 5) + (player_level * 2) - (heat // 10) + skill_bonus + vehicle_bonus + item_bonus
    return random.randint(1, 100) <= max(10, min(95, base_chance))

def calculate_reward(reward_min: float, reward_max: float, success: bool, multiplier: float = 1.0, negotiation_skill: int = 0) -> float:
    if not success:
        return 0
    base = random.uniform(reward_min, reward_max)
    skill_bonus = 1 + (negotiation_skill * 0.05)
    return round(base * multiplier * skill_bonus, 2)

async def update_player_stats(player_id: str, updates: dict):
    await db.players.update_one({"id": player_id}, {"$set": updates})

async def add_player_history(player_id: str, action: str, details: dict):
    history_entry = {
        "id": str(uuid.uuid4()),
        "player_id": player_id,
        "action": action,
        "details": details,
        "timestamp": datetime.now(timezone.utc)
    }
    await db.player_history.insert_one(history_entry)

async def check_and_award_achievements(player_id: str) -> list:
    player = await db.players.find_one({"id": player_id})
    if not player:
        return []
    
    awarded = []
    player_achievements = player.get("achievements", [])
    
    for achievement in ACHIEVEMENTS_CONFIG:
        if achievement["id"] in player_achievements:
            continue
        
        req = achievement["requirement"]
        met = True
        
        if "missions_completed" in req and player.get("total_missions", 0) < req["missions_completed"]:
            met = False
        if "total_earnings" in req and player.get("total_earnings", 0) < req["total_earnings"]:
            met = False
        if "level" in req and player.get("level", 1) < req["level"]:
            met = False
        if "reputation" in req and player.get("reputation", 0) < req["reputation"]:
            met = False
        
        if met:
            reward = achievement["reward"]
            update_ops = {"$addToSet": {"achievements": achievement["id"]}}
            inc_ops = {}
            
            if "clean_money" in reward:
                inc_ops["clean_money"] = reward["clean_money"]
            if "experience" in reward:
                inc_ops["experience"] = reward["experience"]
            if "reputation" in reward:
                inc_ops["reputation"] = reward["reputation"]
            
            if inc_ops:
                update_ops["$inc"] = inc_ops
            
            await db.players.update_one({"id": player_id}, update_ops)
            awarded.append(achievement)
            
            await add_player_history(player_id, "achievement_unlocked", {
                "achievement_id": achievement["id"],
                "name": achievement["name"],
                "reward": reward
            })
    
    return awarded

async def get_active_event_effects() -> dict:
    events = await db.city_events.find({"status": "active"}, {"_id": 0}).to_list(10)
    
    combined = {
        "heat_multiplier": 1.0,
        "reward_multiplier": 1.0,
        "risk_modifier": 0,
        "wars_disabled": False
    }
    
    for event in events:
        effects = event.get("effects", {})
        combined["heat_multiplier"] *= effects.get("heat_multiplier", 1.0)
        combined["reward_multiplier"] *= effects.get("reward_multiplier", 1.0)
        combined["risk_modifier"] += effects.get("risk_modifier", 0)
        if effects.get("wars_disabled"):
            combined["wars_disabled"] = True
    
    return combined

# ============= INIT DATA =============

async def init_game_data():
    # Initialize neighborhoods
    existing_nh = await db.neighborhoods.count_documents({})
    if existing_nh == 0:
        await db.neighborhoods.insert_many(NEIGHBORHOODS_CONFIG)
        logger.info("Bairros inicializados")
    
    # Initialize mission templates
    existing_mt = await db.mission_templates.count_documents({})
    if existing_mt == 0:
        await db.mission_templates.insert_many(MISSION_TEMPLATES)
        logger.info("Templates de missões inicializados")

# ============= AUTH ENDPOINTS =============

@api_router.post("/auth/register", response_model=TokenResponse)
async def register(user: UserCreate):
    existing = await db.players.find_one({"$or": [{"email": user.email}, {"username": user.username}]})
    if existing:
        raise HTTPException(status_code=400, detail="Email ou nome de utilizador já existe")
    
    player_id = str(uuid.uuid4())
    
    # Initialize skills
    initial_skills = {skill_id: {"level": 0, "experience": 0} for skill_id in SKILLS_CONFIG}
    
    player = {
        "id": player_id,
        "email": user.email,
        "username": user.username,
        "password": hash_password(user.password),
        "avatar": "default",
        "clean_money": 1000.0,
        "dirty_money": 0.0,
        "bank_balance": 0.0,
        "reputation": 0,
        "reputation_max": 100,
        "heat_individual": 0,
        "heat_global": 0,
        "level": 1,
        "experience": 0,
        "experience_max": 100,
        "energy": 100,
        "energy_max": 100,
        "health": 100,
        "health_max": 100,
        "gang_id": None,
        "main_neighborhood": "centro",
        "skills": initial_skills,
        "achievements": [],
        "allies": [],
        "enemies": [],
        "npc_relations": {},
        "created_at": datetime.now(timezone.utc),
        "last_daily_reward": None,
        "last_energy_regen": datetime.now(timezone.utc),
        "total_missions": 0,
        "successful_missions": 0,
        "failed_missions": 0,
        "total_earnings": 0.0,
        "total_spent": 0.0,
        "times_arrested": 0,
        "police_escapes": 0,
        "money_laundered": 0.0,
        "wars_won": 0,
        "daily_rewards_claimed": 0,
        "tutorial_completed": False,
        "settings": {
            "notifications": True,
            "sound": True,
            "language": "pt-PT"
        }
    }
    
    await db.players.insert_one(player)
    await add_player_history(player_id, "register", {"message": "Conta criada"})
    
    token = create_access_token({"sub": player_id})
    return TokenResponse(access_token=token)

@api_router.post("/auth/login", response_model=TokenResponse)
async def login(user: UserLogin):
    player = await db.players.find_one({"email": user.email})
    if not player or not verify_password(user.password, player["password"]):
        raise HTTPException(status_code=401, detail="Credenciais inválidas")
    
    # Regenerate energy based on time passed
    last_regen = player.get("last_energy_regen")
    if last_regen:
        if isinstance(last_regen, str):
            last_regen = datetime.fromisoformat(last_regen.replace('Z', '+00:00'))
        elif last_regen.tzinfo is None:
            last_regen = last_regen.replace(tzinfo=timezone.utc)
        
        time_diff = (datetime.now(timezone.utc) - last_regen).total_seconds()
        energy_regen = int(time_diff // 60)  # 1 energy per minute
        
        if energy_regen > 0:
            current_energy = min(player.get("energy_max", 100), player.get("energy", 0) + energy_regen)
            await db.players.update_one(
                {"id": player["id"]},
                {"$set": {"energy": current_energy, "last_energy_regen": datetime.now(timezone.utc)}}
            )
    
    token = create_access_token({"sub": player["id"]})
    return TokenResponse(access_token=token)

@api_router.get("/auth/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    return current_user

# ============= PLAYER ENDPOINTS =============

@api_router.get("/player/stats")
async def get_player_stats(current_user: dict = Depends(get_current_user)):
    player = await db.players.find_one({"id": current_user["id"]}, {"_id": 0, "password": 0})
    
    # Check for new achievements
    new_achievements = await check_and_award_achievements(current_user["id"])
    
    return {
        **player,
        "new_achievements": [a["name"] for a in new_achievements] if new_achievements else []
    }

@api_router.post("/player/daily-reward")
async def claim_daily_reward(current_user: dict = Depends(get_current_user)):
    player = await db.players.find_one({"id": current_user["id"]})
    
    now = datetime.now(timezone.utc)
    last_reward = player.get("last_daily_reward")
    
    if last_reward:
        if isinstance(last_reward, str):
            last_reward = datetime.fromisoformat(last_reward.replace('Z', '+00:00'))
        elif last_reward.tzinfo is None:
            last_reward = last_reward.replace(tzinfo=timezone.utc)
        
        time_diff = now - last_reward
        if time_diff.total_seconds() < 86400:
            next_available = last_reward + timedelta(days=1)
            return {
                "success": False,
                "message": "Já reclamaste a recompensa diária. Volta amanhã!",
                "next_reward_available": next_available.isoformat()
            }
    
    # Streak bonus
    streak = player.get("daily_streak", 0) + 1
    streak_multiplier = min(1.5, 1 + (streak * 0.05))  # Reduzido: max 1.5x em vez de 2x
    
    base_reward = round(random.uniform(30, 150), 2)  # Reduzido: €30-150 em vez de €100-500
    reward_amount = round(base_reward * streak_multiplier, 2)
    
    # Bonus items on certain streaks
    bonus_item = None
    if streak == 7:
        bonus_item = "first_aid"
    elif streak == 14:
        bonus_item = "adrenaline"
    elif streak == 30:
        bonus_item = "body_armor"
    
    update_ops = {
        "$inc": {
            "clean_money": reward_amount,
            "total_earnings": reward_amount,
            "daily_rewards_claimed": 1
        },
        "$set": {
            "last_daily_reward": now,
            "daily_streak": streak
        }
    }
    
    await db.players.update_one({"id": current_user["id"]}, update_ops)
    
    if bonus_item:
        item_data = next((i for i in ITEMS_CATALOG if i["id"] == bonus_item), None)
        if item_data:
            await db.player_inventory.insert_one({
                "id": str(uuid.uuid4()),
                "player_id": current_user["id"],
                "item_id": bonus_item,
                "item_data": item_data,
                "quantity": 1,
                "acquired_at": now
            })
    
    await add_player_history(current_user["id"], "daily_reward", {
        "amount": reward_amount,
        "streak": streak,
        "bonus_item": bonus_item
    })
    
    next_available = now + timedelta(days=1)
    return {
        "success": True,
        "message": f"Recebeste €{reward_amount:.2f}! Streak: {streak} dias",
        "reward_amount": reward_amount,
        "streak": streak,
        "bonus_item": bonus_item,
        "next_reward_available": next_available.isoformat()
    }

@api_router.get("/player/history")
async def get_player_history(current_user: dict = Depends(get_current_user), limit: int = 20):
    history = await db.player_history.find(
        {"player_id": current_user["id"]},
        {"_id": 0}
    ).sort("timestamp", -1).limit(limit).to_list(limit)
    return {"history": history}

@api_router.get("/player/skills")
async def get_player_skills(current_user: dict = Depends(get_current_user)):
    player = await db.players.find_one({"id": current_user["id"]})
    skills = player.get("skills", {})
    
    skills_data = []
    for skill_id, config in SKILLS_CONFIG.items():
        player_skill = skills.get(skill_id, {"level": 0, "experience": 0})
        upgrade_cost = config["base_cost"] * (player_skill["level"] + 1)
        
        skills_data.append({
            "id": skill_id,
            "name": config["name"],
            "description": config["description"],
            "level": player_skill["level"],
            "max_level": config["max_level"],
            "experience": player_skill.get("experience", 0),
            "upgrade_cost": upgrade_cost,
            "can_upgrade": player_skill["level"] < config["max_level"]
        })
    
    return {"skills": skills_data}

@api_router.post("/player/skills/upgrade")
async def upgrade_skill(request: SkillUpgradeRequest, current_user: dict = Depends(get_current_user)):
    skill_id = request.skill_id
    
    if skill_id not in SKILLS_CONFIG:
        raise HTTPException(status_code=404, detail="Skill não encontrada")
    
    player = await db.players.find_one({"id": current_user["id"]})
    skills = player.get("skills", {})
    current_skill = skills.get(skill_id, {"level": 0, "experience": 0})
    
    config = SKILLS_CONFIG[skill_id]
    
    if current_skill["level"] >= config["max_level"]:
        raise HTTPException(status_code=400, detail="Skill já no nível máximo")
    
    upgrade_cost = config["base_cost"] * (current_skill["level"] + 1)
    
    if player.get("clean_money", 0) < upgrade_cost:
        raise HTTPException(status_code=400, detail="Dinheiro insuficiente")
    
    new_level = current_skill["level"] + 1
    
    await db.players.update_one(
        {"id": current_user["id"]},
        {
            "$inc": {"clean_money": -upgrade_cost, "total_spent": upgrade_cost},
            "$set": {f"skills.{skill_id}.level": new_level}
        }
    )
    
    await add_player_history(current_user["id"], "skill_upgraded", {
        "skill": config["name"],
        "new_level": new_level,
        "cost": upgrade_cost
    })
    
    # Check for skill master achievement
    if new_level == config["max_level"]:
        await check_and_award_achievements(current_user["id"])
    
    return {
        "success": True,
        "message": f"{config['name']} melhorada para nível {new_level}!",
        "new_level": new_level,
        "cost": upgrade_cost
    }

@api_router.get("/player/inventory")
async def get_player_inventory(current_user: dict = Depends(get_current_user)):
    inventory = await db.player_inventory.find(
        {"player_id": current_user["id"]},
        {"_id": 0}
    ).to_list(100)
    return {"inventory": inventory}

@api_router.post("/player/inventory/use/{item_instance_id}")
async def use_item(item_instance_id: str, current_user: dict = Depends(get_current_user)):
    item = await db.player_inventory.find_one({
        "id": item_instance_id,
        "player_id": current_user["id"]
    })
    
    if not item:
        raise HTTPException(status_code=404, detail="Item não encontrado")
    
    item_data = item.get("item_data", {})
    effects = item_data.get("effect", {})
    
    update_ops = {}
    messages = []
    
    if "heal" in effects:
        update_ops["$inc"] = update_ops.get("$inc", {})
        update_ops["$inc"]["health"] = effects["heal"]
        messages.append(f"Recuperaste {effects['heal']} de saúde")
    
    if "energy_boost" in effects:
        update_ops["$inc"] = update_ops.get("$inc", {})
        update_ops["$inc"]["energy"] = effects["energy_boost"]
        messages.append(f"Ganhaste {effects['energy_boost']} de energia")
    
    if "reduce_heat" in effects:
        player = await db.players.find_one({"id": current_user["id"]})
        new_heat = max(0, player.get("heat_individual", 0) - effects["reduce_heat"])
        update_ops["$set"] = update_ops.get("$set", {})
        update_ops["$set"]["heat_individual"] = new_heat
        messages.append(f"Heat reduzido em {effects['reduce_heat']}")
    
    if "dirty_money" in effects:
        update_ops["$inc"] = update_ops.get("$inc", {})
        update_ops["$inc"]["dirty_money"] = effects["dirty_money"]
        messages.append(f"Ganhaste €{effects['dirty_money']} sujos")
    
    if update_ops:
        await db.players.update_one({"id": current_user["id"]}, update_ops)
    
    # Remove consumable item
    if item_data.get("consumable", True):
        if item.get("quantity", 1) <= 1:
            await db.player_inventory.delete_one({"id": item_instance_id})
        else:
            await db.player_inventory.update_one(
                {"id": item_instance_id},
                {"$inc": {"quantity": -1}}
            )
    
    await add_player_history(current_user["id"], "item_used", {
        "item": item_data.get("name"),
        "effects": effects
    })
    
    return {
        "success": True,
        "message": " | ".join(messages) if messages else "Item usado",
        "effects": effects
    }

@api_router.get("/player/achievements")
async def get_player_achievements(current_user: dict = Depends(get_current_user)):
    player = await db.players.find_one({"id": current_user["id"]})
    unlocked = player.get("achievements", [])
    
    achievements_data = []
    for achievement in ACHIEVEMENTS_CONFIG:
        achievements_data.append({
            **achievement,
            "unlocked": achievement["id"] in unlocked
        })
    
    return {
        "achievements": achievements_data,
        "unlocked_count": len(unlocked),
        "total_count": len(ACHIEVEMENTS_CONFIG)
    }

# ============= NEIGHBORHOODS ENDPOINTS =============

@api_router.get("/neighborhoods")
async def get_neighborhoods(current_user: dict = Depends(get_current_user)):
    await init_game_data()
    neighborhoods = await db.neighborhoods.find({}, {"_id": 0}).to_list(100)
    
    for n in neighborhoods:
        missions_count = await db.mission_templates.count_documents({})
        n["available_missions"] = missions_count
    
    return neighborhoods

@api_router.get("/neighborhoods/{neighborhood_id}")
async def get_neighborhood(neighborhood_id: str, current_user: dict = Depends(get_current_user)):
    neighborhood = await db.neighborhoods.find_one({"id": neighborhood_id}, {"_id": 0})
    if not neighborhood:
        raise HTTPException(status_code=404, detail="Bairro não encontrado")
    
    missions_count = await db.mission_templates.count_documents({})
    neighborhood["available_missions"] = missions_count
    
    # Get NPCs in this neighborhood
    npcs = [n for n in NPCS_CONFIG if n["location"] == neighborhood_id]
    neighborhood["npcs"] = npcs
    
    return neighborhood

# ============= MISSIONS ENDPOINTS =============

@api_router.get("/missions/templates")
async def get_mission_templates(current_user: dict = Depends(get_current_user)):
    await init_game_data()
    templates = await db.mission_templates.find({}, {"_id": 0}).to_list(100)
    return {"templates": templates}

@api_router.get("/missions/active")
async def get_active_missions(current_user: dict = Depends(get_current_user)):
    missions = await db.missions.find(
        {"player_id": current_user["id"], "status": "active"},
        {"_id": 0}
    ).to_list(10)
    return missions

@api_router.post("/missions/start")
async def start_mission(mission: MissionCreate, current_user: dict = Depends(get_current_user)):
    active = await db.missions.find_one({"player_id": current_user["id"], "status": "active"})
    if active:
        raise HTTPException(status_code=400, detail="Já tens uma missão em andamento")
    
    template = await db.mission_templates.find_one({"type": mission.type})
    if not template:
        raise HTTPException(status_code=404, detail="Tipo de missão não encontrado")
    
    player = await db.players.find_one({"id": current_user["id"]})
    if player["energy"] < template["energy_cost"]:
        raise HTTPException(status_code=400, detail="Energia insuficiente")
    
    # Get event effects
    event_effects = await get_active_event_effects()
    
    await db.players.update_one(
        {"id": current_user["id"]},
        {"$inc": {"energy": -template["energy_cost"]}}
    )
    
    mission_id = str(uuid.uuid4())
    new_mission = {
        "id": mission_id,
        "player_id": current_user["id"],
        "type": mission.type,
        "name": template["name"],
        "description": template["description"],
        "neighborhood_id": mission.neighborhood_id,
        "risk": template["risk"] + event_effects["risk_modifier"],
        "duration_seconds": template["duration_seconds"],
        "reward_min": template["reward_min"],
        "reward_max": template["reward_max"],
        "reward_multiplier": event_effects["reward_multiplier"],
        "heat_impact": int(template["heat_impact"] * event_effects["heat_multiplier"]),
        "reputation_impact": template["reputation_impact"],
        "energy_cost": template["energy_cost"],
        "skill_bonus": template.get("skill_bonus"),
        "status": "active",
        "started_at": datetime.now(timezone.utc),
        "completed_at": None,
        "result": None
    }
    
    await db.missions.insert_one(new_mission)
    
    # Remove MongoDB _id before returning
    new_mission.pop("_id", None)
    new_mission["started_at"] = new_mission["started_at"].isoformat()
    return new_mission

@api_router.post("/missions/{mission_id}/complete")
async def complete_mission(mission_id: str, current_user: dict = Depends(get_current_user)):
    mission = await db.missions.find_one({"id": mission_id, "player_id": current_user["id"]})
    if not mission:
        raise HTTPException(status_code=404, detail="Missão não encontrada")
    
    if mission["status"] != "active":
        raise HTTPException(status_code=400, detail="Missão não está ativa")
    
    started_at = mission["started_at"]
    if isinstance(started_at, str):
        started_at = datetime.fromisoformat(started_at.replace('Z', '+00:00'))
    elif started_at.tzinfo is None:
        started_at = started_at.replace(tzinfo=timezone.utc)
    
    now = datetime.now(timezone.utc)
    elapsed = (now - started_at).total_seconds()
    
    if elapsed < mission["duration_seconds"]:
        remaining = mission["duration_seconds"] - elapsed
        raise HTTPException(status_code=400, detail=f"Missão ainda em progresso. Faltam {int(remaining)} segundos.")
    
    player = await db.players.find_one({"id": current_user["id"]})
    
    # Calculate bonuses
    skill_bonus = calculate_skill_bonus(player.get("skills", {}), mission.get("skill_bonus"))
    
    active_vehicle = await db.player_vehicles.find_one({
        "player_id": current_user["id"],
        "is_active": True
    })
    vehicle_bonuses = calculate_vehicle_bonus(active_vehicle)
    
    inventory = await db.player_inventory.find({"player_id": current_user["id"]}).to_list(100)
    item_bonuses = calculate_item_bonuses([i.get("item_data", {}) for i in inventory])
    
    success = calculate_mission_success(
        mission["risk"],
        player["level"],
        player["heat_individual"],
        skill_bonus,
        vehicle_bonuses.get("stealth_bonus", 0),
        item_bonuses.get("stealth_bonus", 0)
    )
    
    negotiation_skill = player.get("skills", {}).get("negotiation", {}).get("level", 0)
    reward = calculate_reward(
        mission["reward_min"],
        mission["reward_max"],
        success,
        mission.get("reward_multiplier", 1.0),
        negotiation_skill
    )
    
    result = "success" if success else "failed"
    await db.missions.update_one(
        {"id": mission_id},
        {"$set": {"status": "completed", "completed_at": now, "result": result}}
    )
    
    # Update player stats
    update_fields = {
        "$inc": {
            "total_missions": 1,
            "successful_missions": 1 if success else 0,
            "failed_missions": 0 if success else 1,
            "heat_individual": mission["heat_impact"] if success else mission["heat_impact"] * 2,
            "reputation": mission["reputation_impact"] if success else 0,
            "experience": (mission["risk"] * 10) if success else (mission["risk"] * 3),
        }
    }
    
    if success:
        template = await db.mission_templates.find_one({"type": mission["type"]})
        if template and template.get("category") == "legal":
            update_fields["$inc"]["clean_money"] = reward
        else:
            update_fields["$inc"]["dirty_money"] = reward
        update_fields["$inc"]["total_earnings"] = reward
        
        # Give skill experience
        skill_bonus_type = mission.get("skill_bonus")
        if skill_bonus_type:
            skill_exp_gain = mission["risk"] * 5
            await db.players.update_one(
                {"id": current_user["id"]},
                {"$inc": {f"skills.{skill_bonus_type}.experience": skill_exp_gain}}
            )
    else:
        if random.randint(1, 100) <= player["heat_individual"]:
            update_fields["$inc"]["times_arrested"] = 1
            update_fields["$inc"]["clean_money"] = -min(player["clean_money"], 500)
        else:
            update_fields["$inc"]["police_escapes"] = 1
    
    await db.players.update_one({"id": current_user["id"]}, update_fields)
    
    # Check for level up
    updated_player = await db.players.find_one({"id": current_user["id"]})
    level_up = False
    if updated_player["experience"] >= updated_player["experience_max"]:
        new_level = updated_player["level"] + 1
        new_exp_max = updated_player["experience_max"] + 50
        new_energy_max = updated_player["energy_max"] + 5
        await db.players.update_one(
            {"id": current_user["id"]},
            {"$set": {
                "level": new_level,
                "experience": 0,
                "experience_max": new_exp_max,
                "energy_max": new_energy_max,
                "energy": new_energy_max
            }}
        )
        level_up = True
    
    # Damage vehicle slightly
    if active_vehicle and mission["risk"] >= 5:
        damage = random.randint(5, 15)
        new_condition = max(0, active_vehicle.get("condition", 100) - damage)
        await db.player_vehicles.update_one(
            {"id": active_vehicle["id"]},
            {"$set": {"condition": new_condition}}
        )
    
    await add_player_history(current_user["id"], "mission_complete", {
        "mission_type": mission["type"],
        "result": result,
        "reward": reward if success else 0
    })
    
    # Check achievements
    new_achievements = await check_and_award_achievements(current_user["id"])
    
    return {
        "success": True,
        "result": result,
        "reward": reward if success else 0,
        "level_up": level_up,
        "new_achievements": [a["name"] for a in new_achievements] if new_achievements else []
    }

@api_router.get("/missions/history")
async def get_mission_history(current_user: dict = Depends(get_current_user), limit: int = 10):
    missions = await db.missions.find(
        {"player_id": current_user["id"], "status": "completed"},
        {"_id": 0}
    ).sort("completed_at", -1).limit(limit).to_list(limit)
    return {"missions": missions}

# ============= QUICK ACTIONS =============

@api_router.post("/actions/quick")
async def quick_action(action: QuickActionRequest, current_user: dict = Depends(get_current_user)):
    player = await db.players.find_one({"id": current_user["id"]})
    
    actions_config = {
        "roubo_rapido": {"energy_cost": 8, "risk": 3, "reward_range": (10, 50), "heat": 5, "reputation": 1, "skill": "stealth"},
        "hustle_rua": {"energy_cost": 12, "risk": 4, "reward_range": (25, 100), "heat": 8, "reputation": 2, "skill": "negotiation"},
        "evento_aleatorio": {"energy_cost": 5, "risk": 2, "reward_range": (5, 150), "heat": 2, "reputation": 1, "skill": None},
    }
    
    if action.action_type not in actions_config:
        raise HTTPException(status_code=400, detail="Ação inválida")
    
    config = actions_config[action.action_type]
    
    if player["energy"] < config["energy_cost"]:
        raise HTTPException(status_code=400, detail="Energia insuficiente")
    
    event_effects = await get_active_event_effects()
    skill_bonus = calculate_skill_bonus(player.get("skills", {}), config["skill"])
    
    success = calculate_mission_success(
        config["risk"] + event_effects["risk_modifier"],
        player["level"],
        player["heat_individual"],
        skill_bonus
    )
    
    if success:
        base_reward = random.uniform(*config["reward_range"])
        reward = round(base_reward * event_effects["reward_multiplier"], 2)
        message = f"Sucesso! Ganhaste €{reward:.2f}"
        reward_type = "dirty_money"
        heat_change = int(config["heat"] * event_effects["heat_multiplier"])
        rep_change = config["reputation"]
    else:
        reward = 0
        message = "Falhou! Tenta novamente mais tarde."
        reward_type = None
        heat_change = int(config["heat"] * 2 * event_effects["heat_multiplier"])
        rep_change = 0
    
    update_fields = {
        "$inc": {
            "energy": -config["energy_cost"],
            "heat_individual": heat_change,
            "reputation": rep_change,
        }
    }
    
    if success:
        update_fields["$inc"]["dirty_money"] = reward
        update_fields["$inc"]["total_earnings"] = reward
    
    await db.players.update_one({"id": current_user["id"]}, update_fields)
    
    await add_player_history(current_user["id"], f"quick_action_{action.action_type}", {
        "success": success,
        "reward": reward if success else 0
    })
    
    return {
        "success": success,
        "message": message,
        "reward": reward if success else None,
        "reward_type": reward_type,
        "heat_change": heat_change,
        "reputation_change": rep_change,
        "energy_cost": config["energy_cost"]
    }

# ============= GANGS =============

@api_router.get("/gangs")
async def get_gangs(current_user: dict = Depends(get_current_user)):
    gangs = await db.gangs.find({}, {"_id": 0}).to_list(100)
    result = []
    for g in gangs:
        members_count = await db.players.count_documents({"gang_id": g["id"]})
        g["members_count"] = members_count
        result.append(g)
    return result

@api_router.post("/gangs/create")
async def create_gang(gang: GangCreate, current_user: dict = Depends(get_current_user)):
    if current_user.get("gang_id"):
        raise HTTPException(status_code=400, detail="Já pertences a uma gangue")
    
    existing = await db.gangs.find_one({"$or": [{"name": gang.name}, {"tag": gang.tag}]})
    if existing:
        raise HTTPException(status_code=400, detail="Nome ou tag já existe")
    
    gang_id = str(uuid.uuid4())
    new_gang = {
        "id": gang_id,
        "name": gang.name,
        "tag": gang.tag,
        "leader_id": current_user["id"],
        "leader_name": current_user["username"],
        "officers": [],
        "members_count": 1,
        "treasury": 0.0,
        "reputation": 0,
        "territories": [],
        "allies": [],
        "enemies": [],
        "wars_won": 0,
        "wars_lost": 0,
        "total_earnings": 0.0,
        "created_at": datetime.now(timezone.utc),
        "settings": {
            "open_recruitment": True,
            "min_level": 1,
            "min_reputation": 0
        }
    }
    
    await db.gangs.insert_one(new_gang)
    await db.players.update_one({"id": current_user["id"]}, {"$set": {"gang_id": gang_id}})
    
    await add_player_history(current_user["id"], "gang_created", {"gang_name": gang.name})
    
    # Remove MongoDB _id before returning
    new_gang.pop("_id", None)
    new_gang["created_at"] = new_gang["created_at"].isoformat()
    return new_gang

@api_router.post("/gangs/{gang_id}/join")
async def join_gang(gang_id: str, current_user: dict = Depends(get_current_user)):
    if current_user.get("gang_id"):
        raise HTTPException(status_code=400, detail="Já pertences a uma gangue")
    
    gang = await db.gangs.find_one({"id": gang_id})
    if not gang:
        raise HTTPException(status_code=404, detail="Gangue não encontrada")
    
    settings = gang.get("settings", {})
    if not settings.get("open_recruitment", True):
        raise HTTPException(status_code=400, detail="Recrutamento fechado")
    
    if current_user.get("level", 1) < settings.get("min_level", 1):
        raise HTTPException(status_code=400, detail=f"Nível mínimo: {settings.get('min_level')}")
    
    if current_user.get("reputation", 0) < settings.get("min_reputation", 0):
        raise HTTPException(status_code=400, detail=f"Reputação mínima: {settings.get('min_reputation')}")
    
    await db.players.update_one({"id": current_user["id"]}, {"$set": {"gang_id": gang_id}})
    
    await add_player_history(current_user["id"], "gang_joined", {"gang_name": gang["name"]})
    
    return {"success": True, "message": f"Juntaste-te à {gang['name']}!"}

@api_router.post("/gangs/leave")
async def leave_gang(current_user: dict = Depends(get_current_user)):
    if not current_user.get("gang_id"):
        raise HTTPException(status_code=400, detail="Não pertences a nenhuma gangue")
    
    gang = await db.gangs.find_one({"id": current_user["gang_id"]})
    
    if gang and gang["leader_id"] == current_user["id"]:
        members = await db.players.find(
            {"gang_id": gang["id"], "id": {"$ne": current_user["id"]}}
        ).to_list(1)
        
        if members:
            new_leader = members[0]
            await db.gangs.update_one(
                {"id": gang["id"]},
                {"$set": {"leader_id": new_leader["id"], "leader_name": new_leader["username"]}}
            )
        else:
            await db.gangs.delete_one({"id": gang["id"]})
    
    await db.players.update_one({"id": current_user["id"]}, {"$set": {"gang_id": None}})
    
    await add_player_history(current_user["id"], "gang_left", {"gang_name": gang["name"] if gang else "Unknown"})
    
    return {"success": True, "message": "Saíste da gangue."}

@api_router.get("/gangs/my")
async def get_my_gang(current_user: dict = Depends(get_current_user)):
    if not current_user.get("gang_id"):
        return {"gang": None}
    
    gang = await db.gangs.find_one({"id": current_user["gang_id"]}, {"_id": 0})
    if not gang:
        return {"gang": None}
    
    members = await db.players.find(
        {"gang_id": gang["id"]},
        {"_id": 0, "password": 0}
    ).to_list(100)
    
    gang["members"] = members
    gang["members_count"] = len(members)
    
    return {"gang": gang}

@api_router.post("/gangs/treasury/deposit")
async def deposit_to_treasury(amount: float = Query(...), current_user: dict = Depends(get_current_user)):
    if not current_user.get("gang_id"):
        raise HTTPException(status_code=400, detail="Não pertences a nenhuma gangue")
    
    if amount <= 0:
        raise HTTPException(status_code=400, detail="Montante inválido")
    
    player = await db.players.find_one({"id": current_user["id"]})
    if player["clean_money"] < amount:
        raise HTTPException(status_code=400, detail="Dinheiro insuficiente")
    
    await db.players.update_one(
        {"id": current_user["id"]},
        {"$inc": {"clean_money": -amount}}
    )
    
    await db.gangs.update_one(
        {"id": current_user["gang_id"]},
        {"$inc": {"treasury": amount, "total_earnings": amount}}
    )
    
    await add_player_history(current_user["id"], "treasury_deposit", {"amount": amount})
    
    return {"success": True, "message": f"Depositaste €{amount:.2f} no cofre da gangue!"}

# ============= GANG WARS =============

@api_router.get("/wars/active")
async def get_active_wars(current_user: dict = Depends(get_current_user)):
    wars = await db.gang_wars.find({"status": "active"}, {"_id": 0}).to_list(50)
    return {"wars": wars}

@api_router.get("/wars/my")
async def get_my_gang_wars(current_user: dict = Depends(get_current_user)):
    if not current_user.get("gang_id"):
        return {"wars": []}
    
    wars = await db.gang_wars.find(
        {"$or": [
            {"attacker_gang_id": current_user["gang_id"]},
            {"defender_gang_id": current_user["gang_id"]}
        ]},
        {"_id": 0}
    ).sort("started_at", -1).to_list(20)
    
    return {"wars": wars}

@api_router.post("/wars/attack/{neighborhood_id}")
async def start_territory_war(neighborhood_id: str, current_user: dict = Depends(get_current_user)):
    if not current_user.get("gang_id"):
        raise HTTPException(status_code=400, detail="Precisas de pertencer a uma gangue")
    
    event_effects = await get_active_event_effects()
    if event_effects.get("wars_disabled"):
        raise HTTPException(status_code=400, detail="Guerras temporariamente desativadas devido a evento ativo")
    
    gang = await db.gangs.find_one({"id": current_user["gang_id"]})
    if not gang:
        raise HTTPException(status_code=404, detail="Gangue não encontrada")
    
    if gang["leader_id"] != current_user["id"] and current_user["id"] not in gang.get("officers", []):
        raise HTTPException(status_code=403, detail="Apenas líderes e oficiais podem iniciar guerras")
    
    neighborhood = await db.neighborhoods.find_one({"id": neighborhood_id})
    if not neighborhood:
        raise HTTPException(status_code=404, detail="Bairro não encontrado")
    
    if neighborhood.get("controlling_gang") == current_user["gang_id"]:
        raise HTTPException(status_code=400, detail="Já controlas este território")
    
    existing_war = await db.gang_wars.find_one({
        "neighborhood_id": neighborhood_id,
        "status": "active"
    })
    if existing_war:
        raise HTTPException(status_code=400, detail="Já existe uma guerra por este território")
    
    war_cost = neighborhood["economic_value"] * 100
    
    if gang["treasury"] < war_cost:
        raise HTTPException(status_code=400, detail=f"Cofre da gangue insuficiente. Precisa: €{war_cost}")
    
    await db.gangs.update_one(
        {"id": current_user["gang_id"]},
        {"$inc": {"treasury": -war_cost}}
    )
    
    defender_gang = None
    defender_gang_name = "Neutro"
    if neighborhood.get("controlling_gang"):
        defender_gang = await db.gangs.find_one({"id": neighborhood["controlling_gang"]})
        if defender_gang:
            defender_gang_name = defender_gang["name"]
    
    war_id = str(uuid.uuid4())
    war_duration = 300
    
    attacker_members = await db.players.find({"gang_id": current_user["gang_id"]}).to_list(100)
    attacker_power = len(attacker_members) * (sum(m.get("reputation", 0) for m in attacker_members) / max(len(attacker_members), 1) + 10)
    
    defender_power = 50
    if defender_gang:
        defender_members = await db.players.find({"gang_id": defender_gang["id"]}).to_list(100)
        defender_power = len(defender_members) * (sum(m.get("reputation", 0) for m in defender_members) / max(len(defender_members), 1) + 10)
    
    now = datetime.now(timezone.utc)
    new_war = {
        "id": war_id,
        "neighborhood_id": neighborhood_id,
        "neighborhood_name": neighborhood["name"],
        "attacker_gang_id": current_user["gang_id"],
        "attacker_gang_name": gang["name"],
        "attacker_power": attacker_power,
        "defender_gang_id": neighborhood.get("controlling_gang"),
        "defender_gang_name": defender_gang_name,
        "defender_power": defender_power,
        "war_cost": war_cost,
        "status": "active",
        "started_at": now,
        "ends_at": now + timedelta(seconds=war_duration),
        "result": None
    }
    
    await db.gang_wars.insert_one(new_war)
    
    # Remove MongoDB _id before returning
    new_war.pop("_id", None)
    
    await db.neighborhoods.update_one(
        {"id": neighborhood_id},
        {"$inc": {"heat_level": 20}}
    )
    
    await add_player_history(current_user["id"], "war_started", {
        "neighborhood": neighborhood["name"],
        "cost": war_cost
    })
    
    new_war["started_at"] = new_war["started_at"].isoformat()
    new_war["ends_at"] = new_war["ends_at"].isoformat()
    
    return {
        "success": True,
        "message": f"Guerra iniciada por {neighborhood['name']}!",
        "war": new_war
    }

@api_router.post("/wars/{war_id}/resolve")
async def resolve_war(war_id: str, current_user: dict = Depends(get_current_user)):
    war = await db.gang_wars.find_one({"id": war_id})
    if not war:
        raise HTTPException(status_code=404, detail="Guerra não encontrada")
    
    if war["status"] != "active":
        raise HTTPException(status_code=400, detail="Guerra já foi resolvida")
    
    ends_at = war["ends_at"]
    if isinstance(ends_at, str):
        ends_at = datetime.fromisoformat(ends_at.replace('Z', '+00:00'))
    elif ends_at.tzinfo is None:
        ends_at = ends_at.replace(tzinfo=timezone.utc)
    
    now = datetime.now(timezone.utc)
    if now < ends_at:
        remaining = (ends_at - now).total_seconds()
        raise HTTPException(status_code=400, detail=f"Guerra ainda em progresso. Faltam {int(remaining)} segundos.")
    
    attacker_roll = random.randint(1, 100) + war["attacker_power"]
    defender_roll = random.randint(1, 100) + war["defender_power"]
    
    attacker_wins = attacker_roll > defender_roll
    
    if attacker_wins:
        await db.neighborhoods.update_one(
            {"id": war["neighborhood_id"]},
            {
                "$set": {
                    "controlling_gang": war["attacker_gang_id"],
                    "control_status": "controlado"
                }
            }
        )
        
        await db.gangs.update_one(
            {"id": war["attacker_gang_id"]},
            {
                "$addToSet": {"territories": war["neighborhood_id"]},
                "$inc": {"reputation": 50, "wars_won": 1}
            }
        )
        
        if war["defender_gang_id"]:
            await db.gangs.update_one(
                {"id": war["defender_gang_id"]},
                {
                    "$pull": {"territories": war["neighborhood_id"]},
                    "$inc": {"reputation": -25, "wars_lost": 1}
                }
            )
        
        # Award bonus to attackers
        attacker_members = await db.players.find({"gang_id": war["attacker_gang_id"]}).to_list(100)
        for member in attacker_members:
            await db.players.update_one(
                {"id": member["id"]},
                {"$inc": {"wars_won": 1, "reputation": 5, "experience": 50}}
            )
        
        result = "attacker_victory"
        message = f"{war['attacker_gang_name']} conquistou {war['neighborhood_name']}!"
    else:
        if war["defender_gang_id"]:
            await db.gangs.update_one(
                {"id": war["defender_gang_id"]},
                {"$inc": {"reputation": 25, "wars_won": 1}}
            )
        
        await db.gangs.update_one(
            {"id": war["attacker_gang_id"]},
            {"$inc": {"reputation": -10, "wars_lost": 1}}
        )
        
        result = "defender_victory"
        message = f"{war['defender_gang_name']} defendeu {war['neighborhood_name']}!"
    
    await db.gang_wars.update_one(
        {"id": war_id},
        {"$set": {"status": "completed", "result": result}}
    )
    
    return {"success": True, "message": message, "result": result}

# ============= VEHICLES =============

@api_router.get("/vehicles/catalog")
async def get_vehicle_catalog(current_user: dict = Depends(get_current_user)):
    return {"vehicles": VEHICLE_CATALOG}

@api_router.get("/vehicles/my")
async def get_my_vehicles(current_user: dict = Depends(get_current_user)):
    vehicles = await db.player_vehicles.find(
        {"player_id": current_user["id"]},
        {"_id": 0}
    ).to_list(50)
    return {"vehicles": vehicles}

@api_router.post("/vehicles/buy/{vehicle_id}")
async def buy_vehicle(vehicle_id: str, current_user: dict = Depends(get_current_user)):
    vehicle_template = next((v for v in VEHICLE_CATALOG if v["id"] == vehicle_id), None)
    if not vehicle_template:
        raise HTTPException(status_code=404, detail="Veículo não encontrado")
    
    player = await db.players.find_one({"id": current_user["id"]})
    
    if player["clean_money"] < vehicle_template["price"]:
        raise HTTPException(status_code=400, detail="Dinheiro limpo insuficiente")
    
    existing = await db.player_vehicles.find_one({
        "player_id": current_user["id"],
        "vehicle_id": vehicle_id
    })
    if existing:
        raise HTTPException(status_code=400, detail="Já tens este veículo")
    
    await db.players.update_one(
        {"id": current_user["id"]},
        {"$inc": {"clean_money": -vehicle_template["price"], "total_spent": vehicle_template["price"]}}
    )
    
    now = datetime.now(timezone.utc)
    new_vehicle = {
        "id": str(uuid.uuid4()),
        "player_id": current_user["id"],
        "vehicle_id": vehicle_id,
        "name": vehicle_template["name"],
        "speed": vehicle_template["speed"],
        "stealth": vehicle_template["stealth"],
        "capacity": vehicle_template["capacity"],
        "maintenance_cost": vehicle_template["maintenance_cost"],
        "condition": 100,
        "is_active": False,
        "purchased_at": now
    }
    
    await db.player_vehicles.insert_one(new_vehicle)
    
    await add_player_history(current_user["id"], "vehicle_purchased", {
        "vehicle": vehicle_template["name"],
        "price": vehicle_template["price"]
    })
    
    # Remove MongoDB _id before returning
    new_vehicle.pop("_id", None)
    new_vehicle["purchased_at"] = new_vehicle["purchased_at"].isoformat()
    
    return {"success": True, "message": f"Compraste {vehicle_template['name']}!", "vehicle": new_vehicle}

@api_router.post("/vehicles/{vehicle_instance_id}/activate")
async def activate_vehicle(vehicle_instance_id: str, current_user: dict = Depends(get_current_user)):
    vehicle = await db.player_vehicles.find_one({
        "id": vehicle_instance_id,
        "player_id": current_user["id"]
    })
    
    if not vehicle:
        raise HTTPException(status_code=404, detail="Veículo não encontrado")
    
    await db.player_vehicles.update_many(
        {"player_id": current_user["id"]},
        {"$set": {"is_active": False}}
    )
    
    await db.player_vehicles.update_one(
        {"id": vehicle_instance_id},
        {"$set": {"is_active": True}}
    )
    
    return {"success": True, "message": f"{vehicle['name']} está agora ativo!"}

@api_router.post("/vehicles/{vehicle_instance_id}/repair")
async def repair_vehicle(vehicle_instance_id: str, current_user: dict = Depends(get_current_user)):
    vehicle = await db.player_vehicles.find_one({
        "id": vehicle_instance_id,
        "player_id": current_user["id"]
    })
    
    if not vehicle:
        raise HTTPException(status_code=404, detail="Veículo não encontrado")
    
    if vehicle["condition"] >= 100:
        raise HTTPException(status_code=400, detail="Veículo já está em perfeitas condições")
    
    repair_cost = int((100 - vehicle["condition"]) * vehicle["maintenance_cost"] / 100)
    
    player = await db.players.find_one({"id": current_user["id"]})
    if player["clean_money"] < repair_cost:
        raise HTTPException(status_code=400, detail="Dinheiro insuficiente para reparação")
    
    await db.players.update_one(
        {"id": current_user["id"]},
        {"$inc": {"clean_money": -repair_cost, "total_spent": repair_cost}}
    )
    
    await db.player_vehicles.update_one(
        {"id": vehicle_instance_id},
        {"$set": {"condition": 100}}
    )
    
    return {"success": True, "message": f"Veículo reparado por €{repair_cost}!", "cost": repair_cost}

@api_router.post("/vehicles/{vehicle_instance_id}/sell")
async def sell_vehicle(vehicle_instance_id: str, current_user: dict = Depends(get_current_user)):
    vehicle = await db.player_vehicles.find_one({
        "id": vehicle_instance_id,
        "player_id": current_user["id"]
    })
    
    if not vehicle:
        raise HTTPException(status_code=404, detail="Veículo não encontrado")
    
    vehicle_template = next((v for v in VEHICLE_CATALOG if v["id"] == vehicle["vehicle_id"]), None)
    if not vehicle_template:
        raise HTTPException(status_code=500, detail="Erro ao encontrar dados do veículo")
    
    sell_price = int(vehicle_template["price"] * 0.5 * (vehicle["condition"] / 100))
    
    await db.players.update_one(
        {"id": current_user["id"]},
        {"$inc": {"clean_money": sell_price}}
    )
    
    await db.player_vehicles.delete_one({"id": vehicle_instance_id})
    
    await add_player_history(current_user["id"], "vehicle_sold", {
        "vehicle": vehicle["name"],
        "price": sell_price
    })
    
    return {"success": True, "message": f"Vendeste {vehicle['name']} por €{sell_price}!", "amount": sell_price}

# ============= CITY EVENTS =============

@api_router.get("/events/active")
async def get_active_events(current_user: dict = Depends(get_current_user)):
    now = datetime.now(timezone.utc)
    
    await db.city_events.delete_many({"ends_at": {"$lt": now}})
    
    events = await db.city_events.find({"status": "active"}, {"_id": 0}).to_list(20)
    
    return {"events": events}

@api_router.post("/events/trigger")
async def trigger_random_event(current_user: dict = Depends(get_current_user)):
    active_count = await db.city_events.count_documents({"status": "active"})
    if active_count >= 2:
        raise HTTPException(status_code=400, detail="Já existem eventos ativos suficientes")
    
    template = random.choice(EVENT_TEMPLATES)
    
    existing = await db.city_events.find_one({
        "event_id": template["id"],
        "status": "active"
    })
    if existing:
        raise HTTPException(status_code=400, detail="Este evento já está ativo")
    
    now = datetime.now(timezone.utc)
    event = {
        "id": str(uuid.uuid4()),
        "event_id": template["id"],
        "name": template["name"],
        "description": template["description"],
        "effects": template["effects"],
        "icon": template["icon"],
        "status": "active",
        "started_at": now,
        "ends_at": now + timedelta(minutes=template["duration_minutes"])
    }
    
    await db.city_events.insert_one(event)
    
    # Remove MongoDB _id before returning
    event.pop("_id", None)
    event["started_at"] = event["started_at"].isoformat()
    event["ends_at"] = event["ends_at"].isoformat()
    
    return {"success": True, "message": f"Evento '{template['name']}' iniciado!", "event": event}

@api_router.get("/events/effects")
async def get_current_effects(current_user: dict = Depends(get_current_user)):
    effects = await get_active_event_effects()
    
    events = await db.city_events.find({"status": "active"}, {"_id": 0}).to_list(10)
    effects["active_events"] = [{
        "name": e["name"],
        "icon": e["icon"],
        "ends_at": e["ends_at"]
    } for e in events]
    
    return effects

# ============= ECONOMY =============

@api_router.post("/economy/launder")
async def launder_money(request: LaunderRequest, current_user: dict = Depends(get_current_user)):
    amount = request.amount
    player = await db.players.find_one({"id": current_user["id"]})
    
    if amount <= 0:
        raise HTTPException(status_code=400, detail="Montante inválido")
    
    if player["dirty_money"] < amount:
        raise HTTPException(status_code=400, detail="Dinheiro sujo insuficiente")
    
    negotiation_skill = player.get("skills", {}).get("negotiation", {}).get("level", 0)
    fee_reduction = negotiation_skill * 0.015  # Reduzido de 0.02
    
    # Taxa aumentada: 30-50% em vez de 20-40%
    fee_percentage = max(0.15, random.uniform(0.30, 0.50) - fee_reduction)
    clean_amount = amount * (1 - fee_percentage)
    
    # Chance de ser apanhado aumentada
    catch_chance = min(80, player["heat_individual"] + 15 - (negotiation_skill * 2))
    if random.randint(1, 100) <= catch_chance:
        # Perda parcial em vez de total, mas com mais heat
        loss_amount = amount * random.uniform(0.5, 0.8)
        await db.players.update_one(
            {"id": current_user["id"]},
            {"$inc": {"dirty_money": -loss_amount, "heat_individual": 30}}
        )
        await add_player_history(current_user["id"], "launder_failed", {"amount": loss_amount})
        return {"success": False, "message": f"Foste apanhado! Perdeste €{loss_amount:.2f} e ganhaste heat."}
    
    await db.players.update_one(
        {"id": current_user["id"]},
        {"$inc": {"dirty_money": -amount, "clean_money": clean_amount, "money_laundered": amount}}
    )
    
    await add_player_history(current_user["id"], "launder_success", {
        "dirty_amount": amount,
        "clean_amount": clean_amount
    })
    
    await check_and_award_achievements(current_user["id"])
    
    return {
        "success": True,
        "message": f"Lavaste €{amount:.2f} e recebeste €{clean_amount:.2f} limpos (taxa {fee_percentage*100:.0f}%).",
        "clean_amount": clean_amount,
        "fee": amount - clean_amount,
        "fee_percentage": fee_percentage
    }

@api_router.post("/economy/bank/deposit")
async def bank_deposit(amount: float = Query(...), current_user: dict = Depends(get_current_user)):
    if amount <= 0:
        raise HTTPException(status_code=400, detail="Montante inválido")
    
    player = await db.players.find_one({"id": current_user["id"]})
    if player["clean_money"] < amount:
        raise HTTPException(status_code=400, detail="Dinheiro insuficiente")
    
    await db.players.update_one(
        {"id": current_user["id"]},
        {"$inc": {"clean_money": -amount, "bank_balance": amount}}
    )
    
    await add_player_history(current_user["id"], "bank_deposit", {"amount": amount})
    
    return {"success": True, "message": f"Depositaste €{amount:.2f} no banco."}

@api_router.post("/economy/bank/withdraw")
async def bank_withdraw(amount: float = Query(...), current_user: dict = Depends(get_current_user)):
    if amount <= 0:
        raise HTTPException(status_code=400, detail="Montante inválido")
    
    player = await db.players.find_one({"id": current_user["id"]})
    if player.get("bank_balance", 0) < amount:
        raise HTTPException(status_code=400, detail="Saldo bancário insuficiente")
    
    await db.players.update_one(
        {"id": current_user["id"]},
        {"$inc": {"clean_money": amount, "bank_balance": -amount}}
    )
    
    await add_player_history(current_user["id"], "bank_withdraw", {"amount": amount})
    
    return {"success": True, "message": f"Levantaste €{amount:.2f} do banco."}

@api_router.get("/economy/transactions")
async def get_transactions(current_user: dict = Depends(get_current_user), limit: int = 20):
    transactions = await db.transactions.find(
        {"player_id": current_user["id"]},
        {"_id": 0}
    ).sort("timestamp", -1).limit(limit).to_list(limit)
    return {"transactions": transactions}

# ============= SHOP =============

@api_router.get("/shop/items")
async def get_shop_items(current_user: dict = Depends(get_current_user)):
    return {"items": ITEMS_CATALOG}

@api_router.post("/shop/buy/{item_id}")
async def buy_item(item_id: str, quantity: int = 1, current_user: dict = Depends(get_current_user)):
    item = next((i for i in ITEMS_CATALOG if i["id"] == item_id), None)
    if not item:
        raise HTTPException(status_code=404, detail="Item não encontrado")
    
    total_cost = item["price"] * quantity
    
    player = await db.players.find_one({"id": current_user["id"]})
    if player["clean_money"] < total_cost:
        raise HTTPException(status_code=400, detail="Dinheiro insuficiente")
    
    await db.players.update_one(
        {"id": current_user["id"]},
        {"$inc": {"clean_money": -total_cost, "total_spent": total_cost}}
    )
    
    existing = await db.player_inventory.find_one({
        "player_id": current_user["id"],
        "item_id": item_id
    })
    
    if existing:
        await db.player_inventory.update_one(
            {"id": existing["id"]},
            {"$inc": {"quantity": quantity}}
        )
    else:
        await db.player_inventory.insert_one({
            "id": str(uuid.uuid4()),
            "player_id": current_user["id"],
            "item_id": item_id,
            "item_data": item,
            "quantity": quantity,
            "acquired_at": datetime.now(timezone.utc)
        })
    
    await add_player_history(current_user["id"], "item_purchased", {
        "item": item["name"],
        "quantity": quantity,
        "cost": total_cost
    })
    
    return {"success": True, "message": f"Compraste {quantity}x {item['name']}!", "cost": total_cost}

# ============= NPCS =============

@api_router.get("/npcs")
async def get_npcs(current_user: dict = Depends(get_current_user)):
    player = await db.players.find_one({"id": current_user["id"]})
    npc_relations = player.get("npc_relations", {})
    
    npcs_data = []
    for npc in NPCS_CONFIG:
        relation = npc_relations.get(npc["id"], 0)
        npcs_data.append({
            **npc,
            "relationship": relation,
            "relationship_label": "Hostil" if relation < -20 else "Desconfiado" if relation < 0 else "Neutro" if relation < 20 else "Amigável" if relation < 50 else "Aliado"
        })
    
    return {"npcs": npcs_data}

# ============= SISTEMA DE RELACIONAMENTOS COM NPCs =============

@api_router.get("/npcs/contacts")
async def get_npc_contacts(current_user: dict = Depends(get_current_user)):
    """Lista todos os NPCs com níveis de relacionamento do jogador"""
    player_id = current_user["id"]
    
    # Buscar relacionamentos existentes
    relationships = await db.npc_relationships.find(
        {"player_id": player_id},
        {"_id": 0}
    ).to_list(100)
    
    relationships_map = {r["npc_id"]: r for r in relationships}
    
    contacts = []
    for npc in NPCS_CONFIG:
        relation = relationships_map.get(npc["id"], {
            "npc_id": npc["id"],
            "player_id": player_id,
            "points": 0,
            "level": "neutral",
            "interactions": 0,
            "last_interaction": None
        })
        
        # Calcular nível de relacionamento
        points = relation.get("points", 0)
        if points <= -75:
            level = "enemy"
            level_name = "Inimigo"
            level_color = "error"
        elif points <= -50:
            level = "hostile"
            level_name = "Hostil"
            level_color = "error"
        elif points <= -25:
            level = "unfriendly"
            level_name = "Desconfiado"
            level_color = "warning"
        elif points <= 25:
            level = "neutral"
            level_name = "Neutro"
            level_color = "secondary"
        elif points <= 50:
            level = "friendly"
            level_name = "Amigável"
            level_color = "success"
        elif points <= 75:
            level = "allied"
            level_name = "Aliado"
            level_color = "primary"
        else:
            level = "trusted"
            level_name = "De Confiança"
            level_color = "gold"
        
        # Calcular efeitos do relacionamento
        effects = RelationshipSystem.get_interaction_effects(
            RelationshipSystem.calculate_relationship_level(points)
        )
        
        # Determinar interações disponíveis
        available_interactions = []
        if effects["can_trade"]:
            available_interactions.append({"id": "trade", "name": "Negociar", "cost": 0})
        if level in ["friendly", "allied", "trusted"]:
            available_interactions.append({"id": "gift", "name": "Dar Presente", "cost": 500})
            available_interactions.append({"id": "request_favor", "name": "Pedir Favor", "cost": 0})
        if level in ["allied", "trusted"]:
            available_interactions.append({"id": "share_info", "name": "Partilhar Informação", "cost": 0})
        
        contacts.append({
            **npc,
            "relationship": {
                "points": points,
                "level": level,
                "level_name": level_name,
                "level_color": level_color,
                "interactions_count": relation.get("interactions", 0),
                "last_interaction": relation.get("last_interaction"),
                "effects": {
                    "price_modifier": effects["price_modifier"],
                    "can_trade": effects["can_trade"],
                    "will_betray": effects["will_betray"],
                    "info_quality": effects["info_quality"],
                    "help_chance": effects["help_chance"]
                }
            },
            "available_interactions": available_interactions
        })
    
    return {"contacts": contacts}

@api_router.get("/npcs/{npc_id}/relationship")
async def get_npc_relationship_detail(npc_id: str, current_user: dict = Depends(get_current_user)):
    """Detalhes completos do relacionamento com um NPC"""
    npc = next((n for n in NPCS_CONFIG if n["id"] == npc_id), None)
    if not npc:
        raise HTTPException(status_code=404, detail="NPC não encontrado")
    
    relation = await db.npc_relationships.find_one({
        "player_id": current_user["id"],
        "npc_id": npc_id
    })
    
    if not relation:
        relation = {"points": 0, "interactions": 0, "history": []}
    
    # Buscar histórico de interações
    history = await db.npc_interactions.find({
        "player_id": current_user["id"],
        "npc_id": npc_id
    }, {"_id": 0}).sort("timestamp", -1).limit(20).to_list(20)
    
    points = relation.get("points", 0)
    level = RelationshipSystem.calculate_relationship_level(points)
    effects = RelationshipSystem.get_interaction_effects(level)
    
    return {
        "npc": npc,
        "relationship": {
            "points": points,
            "level": level.name.lower(),
            "effects": {
                "price_modifier": effects["price_modifier"],
                "can_trade": effects["can_trade"],
                "info_quality": effects["info_quality"],
                "help_chance": effects["help_chance"]
            }
        },
        "history": history,
        "total_interactions": relation.get("interactions", 0)
    }

@api_router.post("/npcs/{npc_id}/interact")
async def interact_with_npc(
    npc_id: str, 
    action: str = Query(..., description="Tipo de interação: gift, trade, request_favor, share_info"),
    current_user: dict = Depends(get_current_user)
):
    """Interagir com um NPC"""
    npc = next((n for n in NPCS_CONFIG if n["id"] == npc_id), None)
    if not npc:
        raise HTTPException(status_code=404, detail="NPC não encontrado")
    
    player = await db.players.find_one({"id": current_user["id"]})
    
    # Buscar ou criar relacionamento
    relation = await db.npc_relationships.find_one({
        "player_id": current_user["id"],
        "npc_id": npc_id
    })
    
    current_points = relation.get("points", 0) if relation else 0
    now = datetime.now(timezone.utc)
    
    # Processar interação baseada no tipo
    action_results = {
        "gift": {"points_change": 10, "cost": 500, "success_msg": "O presente foi bem recebido!"},
        "trade": {"points_change": 2, "cost": 0, "success_msg": "Negócio concluído."},
        "request_favor": {"points_change": -5, "cost": 0, "success_msg": "Favor concedido."},
        "share_info": {"points_change": 8, "cost": 0, "success_msg": "Informação partilhada com sucesso."},
        "insult": {"points_change": -15, "cost": 0, "success_msg": "Relação danificada."},
        "betray": {"points_change": -50, "cost": 0, "success_msg": "Relação destruída."}
    }
    
    if action not in action_results:
        raise HTTPException(status_code=400, detail="Ação inválida")
    
    result = action_results[action]
    
    # Verificar custo
    if result["cost"] > 0 and player["clean_money"] < result["cost"]:
        raise HTTPException(status_code=400, detail="Dinheiro insuficiente")
    
    # Aplicar custo
    if result["cost"] > 0:
        await db.players.update_one(
            {"id": current_user["id"]},
            {"$inc": {"clean_money": -result["cost"]}}
        )
    
    # Calcular novos pontos
    new_points = RelationshipSystem.calculate_relationship_change(
        current_points, action, True, 1.0
    )
    
    # Actualizar relacionamento
    await db.npc_relationships.update_one(
        {"player_id": current_user["id"], "npc_id": npc_id},
        {
            "$set": {
                "points": new_points,
                "level": RelationshipSystem.calculate_relationship_level(new_points).name.lower(),
                "last_interaction": now
            },
            "$inc": {"interactions": 1}
        },
        upsert=True
    )
    
    # Registar interação
    await db.npc_interactions.insert_one({
        "id": str(uuid.uuid4()),
        "player_id": current_user["id"],
        "npc_id": npc_id,
        "action": action,
        "points_before": current_points,
        "points_after": new_points,
        "timestamp": now
    })
    
    return {
        "success": True,
        "message": result["success_msg"],
        "points_change": new_points - current_points,
        "new_points": new_points,
        "new_level": RelationshipSystem.calculate_relationship_level(new_points).name.lower()
    }

@api_router.get("/npcs/{npc_id}")
async def get_npc(npc_id: str, current_user: dict = Depends(get_current_user)):
    npc = next((n for n in NPCS_CONFIG if n["id"] == npc_id), None)
    if not npc:
        raise HTTPException(status_code=404, detail="NPC não encontrado")
    
    player = await db.players.find_one({"id": current_user["id"]})
    relation = player.get("npc_relations", {}).get(npc_id, 0)
    
    return {
        **npc,
        "relationship": relation
    }

# ============= CONTRACTS =============

@api_router.get("/contracts/available")
async def get_available_contracts(current_user: dict = Depends(get_current_user)):
    player = await db.players.find_one({"id": current_user["id"]})
    
    available = []
    for contract in CONTRACTS_CONFIG:
        if player.get("level", 1) >= contract["risk"]:
            reward_multiplier = 1 + (player.get("reputation", 0) / 100)
            available.append({
                **contract,
                "adjusted_reward": int(contract["base_reward"] * reward_multiplier)
            })
    
    return {"contracts": available}

# ============= RANKINGS =============

@api_router.get("/rankings/global")
async def get_global_rankings(limit: int = 20):
    players = await db.players.find(
        {},
        {"_id": 0, "password": 0, "email": 0}
    ).sort("reputation", -1).limit(limit).to_list(limit)
    
    rankings = []
    for i, p in enumerate(players, 1):
        rankings.append({
            "rank": i,
            "username": p["username"],
            "level": p["level"],
            "reputation": p["reputation"],
            "gang_id": p.get("gang_id"),
            "total_missions": p.get("total_missions", 0),
            "total_earnings": p.get("total_earnings", 0)
        })
    
    return {"rankings": rankings}

@api_router.get("/rankings/gangs")
async def get_gang_rankings(limit: int = 10):
    gangs = await db.gangs.find({}, {"_id": 0}).sort("reputation", -1).limit(limit).to_list(limit)
    
    rankings = []
    for i, g in enumerate(gangs, 1):
        members_count = await db.players.count_documents({"gang_id": g["id"]})
        rankings.append({
            "rank": i,
            "name": g["name"],
            "tag": g["tag"],
            "reputation": g["reputation"],
            "members_count": members_count,
            "territories": len(g.get("territories", [])),
            "wars_won": g.get("wars_won", 0),
            "treasury": g.get("treasury", 0)
        })
    
    return {"rankings": rankings}

@api_router.get("/rankings/richest")
async def get_richest_players(limit: int = 20):
    players = await db.players.find(
        {},
        {"_id": 0, "password": 0, "email": 0}
    ).sort("total_earnings", -1).limit(limit).to_list(limit)
    
    rankings = []
    for i, p in enumerate(players, 1):
        rankings.append({
            "rank": i,
            "username": p["username"],
            "total_earnings": p.get("total_earnings", 0),
            "clean_money": p.get("clean_money", 0),
            "level": p["level"]
        })
    
    return {"rankings": rankings}

# ============= PROPERTIES SYSTEM =============

@api_router.get("/properties/types")
async def get_property_types(current_user: dict = Depends(get_current_user)):
    """Get all available property types"""
    return {"property_types": PROPERTY_TYPES}

@api_router.get("/properties/my")
async def get_my_properties(current_user: dict = Depends(get_current_user)):
    """Get all properties owned by the player"""
    properties = await db.player_properties.find(
        {"player_id": current_user["id"]},
        {"_id": 0}
    ).to_list(100)
    
    # Calculate pending income for each property
    now = datetime.now(timezone.utc)
    for prop in properties:
        last_collect = prop.get("last_income_collected")
        if last_collect:
            if isinstance(last_collect, str):
                last_collect = datetime.fromisoformat(last_collect.replace('Z', '+00:00'))
            elif last_collect.tzinfo is None:
                last_collect = last_collect.replace(tzinfo=timezone.utc)
            
            hours_passed = (now - last_collect).total_seconds() / 3600
            prop_type = next((p for p in PROPERTY_TYPES if p["id"] == prop["property_type"]), None)
            if prop_type:
                prop["pending_income"] = round(hours_passed * prop_type["income_per_hour"], 2)
        else:
            prop["pending_income"] = 0
    
    return {"properties": properties}

@api_router.get("/properties/available/{neighborhood_id}")
async def get_available_properties(neighborhood_id: str, current_user: dict = Depends(get_current_user)):
    """Get properties available for purchase in a neighborhood"""
    neighborhood = await db.neighborhoods.find_one({"id": neighborhood_id})
    if not neighborhood:
        raise HTTPException(status_code=404, detail="Bairro não encontrado")
    
    available = []
    for prop_type in PROPERTY_TYPES:
        if neighborhood_id in prop_type["allowed_neighborhoods"]:
            # Calculate price based on neighborhood economic value
            price_multiplier = 1 + (neighborhood["economic_value"] / 100)
            adjusted_price = int(prop_type["base_price"] * price_multiplier)
            
            available.append({
                **prop_type,
                "adjusted_price": adjusted_price,
                "neighborhood_name": neighborhood["name"]
            })
    
    return {"properties": available, "neighborhood": neighborhood["name"]}

@api_router.post("/properties/buy")
async def buy_property(purchase: PropertyPurchase, current_user: dict = Depends(get_current_user)):
    """Purchase a property"""
    property_type = next((p for p in PROPERTY_TYPES if p["id"] == purchase.property_type), None)
    if not property_type:
        raise HTTPException(status_code=404, detail="Tipo de propriedade não encontrado")
    
    if purchase.neighborhood_id not in property_type["allowed_neighborhoods"]:
        raise HTTPException(status_code=400, detail="Este tipo de propriedade não está disponível neste bairro")
    
    neighborhood = await db.neighborhoods.find_one({"id": purchase.neighborhood_id})
    if not neighborhood:
        raise HTTPException(status_code=404, detail="Bairro não encontrado")
    
    # Calculate price
    price_multiplier = 1 + (neighborhood["economic_value"] / 100)
    final_price = int(property_type["base_price"] * price_multiplier)
    
    player = await db.players.find_one({"id": current_user["id"]})
    if player["clean_money"] < final_price:
        raise HTTPException(status_code=400, detail="Dinheiro limpo insuficiente")
    
    # Deduct money
    await db.players.update_one(
        {"id": current_user["id"]},
        {"$inc": {"clean_money": -final_price, "total_spent": final_price}}
    )
    
    # Create property
    now = datetime.now(timezone.utc)
    new_property = {
        "id": str(uuid.uuid4()),
        "player_id": current_user["id"],
        "property_type": purchase.property_type,
        "neighborhood_id": purchase.neighborhood_id,
        "neighborhood_name": neighborhood["name"],
        "custom_name": purchase.custom_name or f"{property_type['name']} em {neighborhood['name']}",
        "purchase_price": final_price,
        "income_per_hour": property_type["income_per_hour"],
        "maintenance_cost": property_type["maintenance_cost"],
        "capacity": property_type["capacity"],
        "condition": 100,
        "purchased_at": now,
        "last_income_collected": now,
        "last_maintenance_paid": now
    }
    
    await db.player_properties.insert_one(new_property)
    
    await add_player_history(current_user["id"], "property_purchased", {
        "property": property_type["name"],
        "neighborhood": neighborhood["name"],
        "price": final_price
    })
    
    new_property.pop("_id", None)
    new_property["purchased_at"] = new_property["purchased_at"].isoformat()
    new_property["last_income_collected"] = new_property["last_income_collected"].isoformat()
    new_property["last_maintenance_paid"] = new_property["last_maintenance_paid"].isoformat()
    
    return {"success": True, "message": f"Compraste {property_type['name']} em {neighborhood['name']}!", "property": new_property}

@api_router.post("/properties/{property_id}/collect")
async def collect_property_income(property_id: str, current_user: dict = Depends(get_current_user)):
    """Collect accumulated income from a property"""
    prop = await db.player_properties.find_one({
        "id": property_id,
        "player_id": current_user["id"]
    })
    
    if not prop:
        raise HTTPException(status_code=404, detail="Propriedade não encontrada")
    
    now = datetime.now(timezone.utc)
    last_collect = prop.get("last_income_collected", prop["purchased_at"])
    
    if isinstance(last_collect, str):
        last_collect = datetime.fromisoformat(last_collect.replace('Z', '+00:00'))
    elif last_collect.tzinfo is None:
        last_collect = last_collect.replace(tzinfo=timezone.utc)
    
    hours_passed = (now - last_collect).total_seconds() / 3600
    
    if hours_passed < 1:
        raise HTTPException(status_code=400, detail="Precisas esperar pelo menos 1 hora para coletar rendimento")
    
    # Calculate income based on condition
    condition_multiplier = prop.get("condition", 100) / 100
    income = round(hours_passed * prop["income_per_hour"] * condition_multiplier, 2)
    
    # Degrade condition slightly
    condition_loss = min(5, int(hours_passed * 0.5))
    new_condition = max(0, prop.get("condition", 100) - condition_loss)
    
    await db.player_properties.update_one(
        {"id": property_id},
        {"$set": {"last_income_collected": now, "condition": new_condition}}
    )
    
    await db.players.update_one(
        {"id": current_user["id"]},
        {"$inc": {"clean_money": income, "total_earnings": income}}
    )
    
    await add_player_history(current_user["id"], "property_income", {
        "property": prop["custom_name"],
        "income": income,
        "hours": round(hours_passed, 1)
    })
    
    return {
        "success": True,
        "message": f"Coletaste €{income:.2f} de {prop['custom_name']}!",
        "income": income,
        "hours_collected": round(hours_passed, 1),
        "new_condition": new_condition
    }

@api_router.post("/properties/{property_id}/maintain")
async def maintain_property(property_id: str, current_user: dict = Depends(get_current_user)):
    """Pay maintenance to restore property condition"""
    prop = await db.player_properties.find_one({
        "id": property_id,
        "player_id": current_user["id"]
    })
    
    if not prop:
        raise HTTPException(status_code=404, detail="Propriedade não encontrada")
    
    if prop.get("condition", 100) >= 100:
        raise HTTPException(status_code=400, detail="Propriedade já está em perfeitas condições")
    
    repair_percentage = 100 - prop.get("condition", 100)
    maintenance_cost = int((repair_percentage / 100) * prop["maintenance_cost"] * 10)
    
    player = await db.players.find_one({"id": current_user["id"]})
    if player["clean_money"] < maintenance_cost:
        raise HTTPException(status_code=400, detail="Dinheiro insuficiente para manutenção")
    
    await db.players.update_one(
        {"id": current_user["id"]},
        {"$inc": {"clean_money": -maintenance_cost, "total_spent": maintenance_cost}}
    )
    
    await db.player_properties.update_one(
        {"id": property_id},
        {"$set": {"condition": 100, "last_maintenance_paid": datetime.now(timezone.utc)}}
    )
    
    return {
        "success": True,
        "message": f"Manutenção paga! €{maintenance_cost} gastos.",
        "cost": maintenance_cost
    }

@api_router.post("/properties/{property_id}/sell")
async def sell_property(property_id: str, current_user: dict = Depends(get_current_user)):
    """Sell a property"""
    prop = await db.player_properties.find_one({
        "id": property_id,
        "player_id": current_user["id"]
    })
    
    if not prop:
        raise HTTPException(status_code=404, detail="Propriedade não encontrada")
    
    # Sell for 50% of purchase price × condition
    sell_price = int(prop["purchase_price"] * 0.5 * (prop.get("condition", 100) / 100))
    
    await db.players.update_one(
        {"id": current_user["id"]},
        {"$inc": {"clean_money": sell_price}}
    )
    
    await db.player_properties.delete_one({"id": property_id})
    
    await add_player_history(current_user["id"], "property_sold", {
        "property": prop["custom_name"],
        "price": sell_price
    })
    
    return {"success": True, "message": f"Vendeste a propriedade por €{sell_price}!", "amount": sell_price}

# ============= BUSINESS/CRAFTING SYSTEM =============

@api_router.get("/businesses/types")
async def get_business_types(current_user: dict = Depends(get_current_user)):
    """Get all available business types with their neighborhoods"""
    businesses_with_neighborhoods = []
    for business in BUSINESS_TYPES:
        neighborhood = await db.neighborhoods.find_one({"id": business["neighborhood"]})
        businesses_with_neighborhoods.append({
            **business,
            "neighborhood_name": neighborhood["name"] if neighborhood else business["neighborhood"]
        })
    return {"business_types": businesses_with_neighborhoods}

@api_router.get("/businesses/my")
async def get_my_businesses(current_user: dict = Depends(get_current_user)):
    """Get all businesses owned by the player"""
    businesses = await db.player_businesses.find(
        {"player_id": current_user["id"]},
        {"_id": 0}
    ).to_list(50)
    
    # Check for active productions
    now = datetime.now(timezone.utc)
    for business in businesses:
        active_prod = await db.crafting_queue.find_one({
            "business_id": business["id"],
            "status": "in_progress"
        }, {"_id": 0})
        
        if active_prod:
            ends_at = active_prod.get("ends_at")
            if isinstance(ends_at, str):
                ends_at = datetime.fromisoformat(ends_at.replace('Z', '+00:00'))
            elif ends_at.tzinfo is None:
                ends_at = ends_at.replace(tzinfo=timezone.utc)
            
            if now >= ends_at:
                active_prod["status"] = "ready"
            else:
                remaining = (ends_at - now).total_seconds()
                active_prod["remaining_seconds"] = int(remaining)
            
            business["active_production"] = active_prod
        else:
            business["active_production"] = None
    
    return {"businesses": businesses}

@api_router.get("/businesses/recipes/{business_id}")
async def get_business_recipes(business_id: str, current_user: dict = Depends(get_current_user)):
    """Get available recipes for a specific business"""
    business = await db.player_businesses.find_one({
        "id": business_id,
        "player_id": current_user["id"]
    })
    
    if not business:
        raise HTTPException(status_code=404, detail="Negócio não encontrado")
    
    recipes = [r for r in CRAFTING_RECIPES if r["business_type"] == business["business_type"]]
    
    # Add player skill bonus info
    player = await db.players.find_one({"id": current_user["id"]})
    for recipe in recipes:
        skill = recipe.get("skill_bonus")
        if skill:
            skill_level = player.get("skills", {}).get(skill, {}).get("level", 0)
            recipe["time_reduction"] = skill_level * 5  # 5% per skill level
            recipe["adjusted_time"] = int(recipe["time_minutes"] * (1 - skill_level * 0.05))
        else:
            recipe["time_reduction"] = 0
            recipe["adjusted_time"] = recipe["time_minutes"]
    
    return {"recipes": recipes, "business_name": business["custom_name"]}

@api_router.post("/businesses/buy")
async def buy_business(purchase: BusinessPurchase, current_user: dict = Depends(get_current_user)):
    """Purchase a business"""
    business_type = next((b for b in BUSINESS_TYPES if b["id"] == purchase.business_type), None)
    if not business_type:
        raise HTTPException(status_code=404, detail="Tipo de negócio não encontrado")
    
    # Check if player already has this type of business
    existing = await db.player_businesses.find_one({
        "player_id": current_user["id"],
        "business_type": purchase.business_type
    })
    if existing:
        raise HTTPException(status_code=400, detail="Já tens este tipo de negócio")
    
    neighborhood = await db.neighborhoods.find_one({"id": business_type["neighborhood"]})
    
    player = await db.players.find_one({"id": current_user["id"]})
    if player["clean_money"] < business_type["price"]:
        raise HTTPException(status_code=400, detail="Dinheiro limpo insuficiente")
    
    # Deduct money
    await db.players.update_one(
        {"id": current_user["id"]},
        {"$inc": {"clean_money": -business_type["price"], "total_spent": business_type["price"]}}
    )
    
    now = datetime.now(timezone.utc)
    new_business = {
        "id": str(uuid.uuid4()),
        "player_id": current_user["id"],
        "business_type": purchase.business_type,
        "neighborhood_id": business_type["neighborhood"],
        "neighborhood_name": neighborhood["name"] if neighborhood else business_type["neighborhood"],
        "custom_name": purchase.custom_name or business_type["name"],
        "purchase_price": business_type["price"],
        "maintenance_cost": business_type["maintenance_cost"],
        "icon": business_type["icon"],
        "products": business_type["products"],
        "level": 1,
        "total_produced": 0,
        "purchased_at": now,
        "last_maintenance_paid": now
    }
    
    await db.player_businesses.insert_one(new_business)
    
    await add_player_history(current_user["id"], "business_purchased", {
        "business": business_type["name"],
        "neighborhood": neighborhood["name"] if neighborhood else business_type["neighborhood"],
        "price": business_type["price"]
    })
    
    new_business.pop("_id", None)
    new_business["purchased_at"] = new_business["purchased_at"].isoformat()
    new_business["last_maintenance_paid"] = new_business["last_maintenance_paid"].isoformat()
    
    return {"success": True, "message": f"Compraste {business_type['name']}!", "business": new_business}

@api_router.post("/businesses/{business_id}/craft")
async def start_crafting(business_id: str, request: CraftingRequest, current_user: dict = Depends(get_current_user)):
    """Start crafting a product"""
    business = await db.player_businesses.find_one({
        "id": business_id,
        "player_id": current_user["id"]
    })
    
    if not business:
        raise HTTPException(status_code=404, detail="Negócio não encontrado")
    
    # Check for active production
    active = await db.crafting_queue.find_one({
        "business_id": business_id,
        "status": "in_progress"
    })
    if active:
        raise HTTPException(status_code=400, detail="Já existe uma produção em andamento neste negócio")
    
    recipe = next((r for r in CRAFTING_RECIPES if r["id"] == request.recipe_id), None)
    if not recipe:
        raise HTTPException(status_code=404, detail="Receita não encontrada")
    
    if recipe["business_type"] != business["business_type"]:
        raise HTTPException(status_code=400, detail="Esta receita não pode ser feita neste negócio")
    
    total_cost = recipe["cost"] * request.quantity
    
    player = await db.players.find_one({"id": current_user["id"]})
    if player["clean_money"] < total_cost:
        raise HTTPException(status_code=400, detail="Dinheiro insuficiente para materiais")
    
    # Calculate time with skill bonus
    skill = recipe.get("skill_bonus")
    time_multiplier = 1.0
    if skill:
        skill_level = player.get("skills", {}).get(skill, {}).get("level", 0)
        time_multiplier = 1 - (skill_level * 0.05)  # 5% reduction per level
    
    total_time_minutes = int(recipe["time_minutes"] * request.quantity * time_multiplier)
    
    # Deduct cost
    await db.players.update_one(
        {"id": current_user["id"]},
        {"$inc": {"clean_money": -total_cost, "total_spent": total_cost}}
    )
    
    now = datetime.now(timezone.utc)
    crafting_job = {
        "id": str(uuid.uuid4()),
        "business_id": business_id,
        "player_id": current_user["id"],
        "recipe_id": request.recipe_id,
        "recipe_name": recipe["name"],
        "quantity": request.quantity,
        "total_output": recipe["quantity"] * request.quantity,
        "cost": total_cost,
        "sell_value": recipe["sell_value"] * request.quantity,
        "heat_risk": recipe["heat_risk"],
        "status": "in_progress",
        "started_at": now,
        "ends_at": now + timedelta(minutes=total_time_minutes)
    }
    
    await db.crafting_queue.insert_one(crafting_job)
    
    crafting_job.pop("_id", None)
    crafting_job["started_at"] = crafting_job["started_at"].isoformat()
    crafting_job["ends_at"] = crafting_job["ends_at"].isoformat()
    
    return {
        "success": True,
        "message": f"Produção de {recipe['name']} iniciada!",
        "job": crafting_job,
        "duration_minutes": total_time_minutes
    }

@api_router.post("/businesses/{business_id}/collect")
async def collect_crafting(business_id: str, current_user: dict = Depends(get_current_user)):
    """Collect finished crafted products"""
    business = await db.player_businesses.find_one({
        "id": business_id,
        "player_id": current_user["id"]
    })
    
    if not business:
        raise HTTPException(status_code=404, detail="Negócio não encontrado")
    
    job = await db.crafting_queue.find_one({
        "business_id": business_id,
        "status": "in_progress"
    })
    
    if not job:
        raise HTTPException(status_code=400, detail="Não há produção para coletar")
    
    ends_at = job["ends_at"]
    if isinstance(ends_at, str):
        ends_at = datetime.fromisoformat(ends_at.replace('Z', '+00:00'))
    elif ends_at.tzinfo is None:
        ends_at = ends_at.replace(tzinfo=timezone.utc)
    
    now = datetime.now(timezone.utc)
    if now < ends_at:
        remaining = (ends_at - now).total_seconds()
        raise HTTPException(status_code=400, detail=f"Produção ainda em andamento. Faltam {int(remaining // 60)} minutos.")
    
    # Add to player's crafted items storage
    crafted_item = {
        "id": str(uuid.uuid4()),
        "player_id": current_user["id"],
        "recipe_id": job["recipe_id"],
        "name": job["recipe_name"],
        "quantity": job["total_output"],
        "sell_value_each": job["sell_value"] / job["quantity"],
        "crafted_at": now,
        "business_id": business_id
    }
    
    await db.player_crafted_items.insert_one(crafted_item)
    
    # Update job status
    await db.crafting_queue.update_one(
        {"id": job["id"]},
        {"$set": {"status": "completed", "collected_at": now}}
    )
    
    # Update business stats
    await db.player_businesses.update_one(
        {"id": business_id},
        {"$inc": {"total_produced": job["total_output"]}}
    )
    
    # Apply heat risk
    if random.randint(1, 100) <= job["heat_risk"]:
        await db.players.update_one(
            {"id": current_user["id"]},
            {"$inc": {"heat_individual": job["heat_risk"]}}
        )
    
    await add_player_history(current_user["id"], "crafting_collected", {
        "product": job["recipe_name"],
        "quantity": job["total_output"]
    })
    
    crafted_item.pop("_id", None)
    crafted_item["crafted_at"] = crafted_item["crafted_at"].isoformat()
    
    return {
        "success": True,
        "message": f"Coletaste {job['total_output']}x {job['recipe_name']}!",
        "crafted_item": crafted_item
    }

@api_router.get("/businesses/crafted-items")
async def get_crafted_items(current_user: dict = Depends(get_current_user)):
    """Get all crafted items in storage"""
    items = await db.player_crafted_items.find(
        {"player_id": current_user["id"]},
        {"_id": 0}
    ).to_list(100)
    
    return {"items": items}

@api_router.post("/businesses/{business_id}/sell")
async def sell_business(business_id: str, current_user: dict = Depends(get_current_user)):
    """Sell a business"""
    business = await db.player_businesses.find_one({
        "id": business_id,
        "player_id": current_user["id"]
    })
    
    if not business:
        raise HTTPException(status_code=404, detail="Negócio não encontrado")
    
    # Check for active production
    active = await db.crafting_queue.find_one({
        "business_id": business_id,
        "status": "in_progress"
    })
    if active:
        raise HTTPException(status_code=400, detail="Não podes vender um negócio com produção em andamento")
    
    sell_price = int(business["purchase_price"] * 0.6)  # 60% return
    
    await db.players.update_one(
        {"id": current_user["id"]},
        {"$inc": {"clean_money": sell_price}}
    )
    
    await db.player_businesses.delete_one({"id": business_id})
    
    await add_player_history(current_user["id"], "business_sold", {
        "business": business["custom_name"],
        "price": sell_price
    })
    
    return {"success": True, "message": f"Vendeste o negócio por €{sell_price}!", "amount": sell_price}

# ============= MARKET SYSTEM =============

@api_router.get("/market/listings")
async def get_market_listings(
    current_user: dict = Depends(get_current_user),
    category: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None
):
    """Get all active market listings"""
    query = {"status": "active"}
    
    if category:
        query["category"] = category
    if min_price is not None:
        query["price_per_unit"] = {"$gte": min_price}
    if max_price is not None:
        if "price_per_unit" in query:
            query["price_per_unit"]["$lte"] = max_price
        else:
            query["price_per_unit"] = {"$lte": max_price}
    
    listings = await db.market_listings.find(query, {"_id": 0}).sort("created_at", -1).to_list(100)
    
    # Get seller usernames
    for listing in listings:
        if listing["seller_id"] == current_user["id"]:
            listing["is_own"] = True
            listing["seller_name"] = "Tu"
        else:
            seller = await db.players.find_one({"id": listing["seller_id"]}, {"username": 1})
            listing["is_own"] = False
            listing["seller_name"] = seller["username"] if seller else "Desconhecido"
    
    return {"listings": listings}

@api_router.get("/market/my-listings")
async def get_my_listings(current_user: dict = Depends(get_current_user)):
    """Get player's own market listings"""
    listings = await db.market_listings.find(
        {"seller_id": current_user["id"]},
        {"_id": 0}
    ).sort("created_at", -1).to_list(50)
    
    return {"listings": listings}

@api_router.post("/market/list")
async def create_listing(listing: MarketListing, current_user: dict = Depends(get_current_user)):
    """Create a new market listing"""
    if listing.price <= 0:
        raise HTTPException(status_code=400, detail="Preço inválido")
    
    if listing.quantity <= 0:
        raise HTTPException(status_code=400, detail="Quantidade inválida")
    
    item_name = ""
    category = ""
    
    if listing.item_type == "crafted":
        # Check crafted items
        crafted = await db.player_crafted_items.find_one({
            "id": listing.item_id,
            "player_id": current_user["id"]
        })
        
        if not crafted:
            raise HTTPException(status_code=404, detail="Item fabricado não encontrado")
        
        if crafted["quantity"] < listing.quantity:
            raise HTTPException(status_code=400, detail="Quantidade insuficiente")
        
        item_name = crafted["name"]
        category = "crafted"
        
        # Reduce quantity or remove
        if crafted["quantity"] == listing.quantity:
            await db.player_crafted_items.delete_one({"id": listing.item_id})
        else:
            await db.player_crafted_items.update_one(
                {"id": listing.item_id},
                {"$inc": {"quantity": -listing.quantity}}
            )
    
    elif listing.item_type == "inventory":
        # Check inventory items
        inv_item = await db.player_inventory.find_one({
            "id": listing.item_id,
            "player_id": current_user["id"]
        })
        
        if not inv_item:
            raise HTTPException(status_code=404, detail="Item não encontrado no inventário")
        
        if inv_item.get("quantity", 1) < listing.quantity:
            raise HTTPException(status_code=400, detail="Quantidade insuficiente")
        
        item_name = inv_item["item_data"]["name"]
        category = inv_item["item_data"].get("type", "misc")
        
        # Reduce quantity or remove
        if inv_item.get("quantity", 1) == listing.quantity:
            await db.player_inventory.delete_one({"id": listing.item_id})
        else:
            await db.player_inventory.update_one(
                {"id": listing.item_id},
                {"$inc": {"quantity": -listing.quantity}}
            )
    else:
        raise HTTPException(status_code=400, detail="Tipo de item inválido")
    
    now = datetime.now(timezone.utc)
    new_listing = {
        "id": str(uuid.uuid4()),
        "seller_id": current_user["id"],
        "item_type": listing.item_type,
        "original_item_id": listing.item_id,
        "item_name": item_name,
        "category": category,
        "quantity": listing.quantity,
        "price_per_unit": listing.price,
        "total_price": listing.price * listing.quantity,
        "status": "active",
        "created_at": now,
        "expires_at": now + timedelta(days=7)
    }
    
    await db.market_listings.insert_one(new_listing)
    
    await add_player_history(current_user["id"], "market_listed", {
        "item": item_name,
        "quantity": listing.quantity,
        "price": listing.price * listing.quantity
    })
    
    new_listing.pop("_id", None)
    new_listing["created_at"] = new_listing["created_at"].isoformat()
    new_listing["expires_at"] = new_listing["expires_at"].isoformat()
    
    return {"success": True, "message": f"Listado {listing.quantity}x {item_name} por €{listing.price * listing.quantity:.2f}", "listing": new_listing}

@api_router.post("/market/buy")
async def buy_from_market(purchase: MarketPurchase, current_user: dict = Depends(get_current_user)):
    """Purchase an item from the market"""
    listing = await db.market_listings.find_one({
        "id": purchase.listing_id,
        "status": "active"
    })
    
    if not listing:
        raise HTTPException(status_code=404, detail="Listagem não encontrada ou expirada")
    
    if listing["seller_id"] == current_user["id"]:
        raise HTTPException(status_code=400, detail="Não podes comprar os teus próprios itens")
    
    if purchase.quantity > listing["quantity"]:
        raise HTTPException(status_code=400, detail="Quantidade solicitada maior que disponível")
    
    total_cost = listing["price_per_unit"] * purchase.quantity
    fee = total_cost * MARKET_FEE
    
    player = await db.players.find_one({"id": current_user["id"]})
    if player["clean_money"] < total_cost:
        raise HTTPException(status_code=400, detail="Dinheiro limpo insuficiente")
    
    # Deduct money from buyer
    await db.players.update_one(
        {"id": current_user["id"]},
        {"$inc": {"clean_money": -total_cost, "total_spent": total_cost}}
    )
    
    # Give money to seller (minus fee)
    seller_amount = total_cost - fee
    await db.players.update_one(
        {"id": listing["seller_id"]},
        {"$inc": {"clean_money": seller_amount, "total_earnings": seller_amount}}
    )
    
    # Add item to buyer's inventory
    if listing["item_type"] == "crafted":
        existing = await db.player_crafted_items.find_one({
            "player_id": current_user["id"],
            "name": listing["item_name"]
        })
        
        if existing:
            await db.player_crafted_items.update_one(
                {"id": existing["id"]},
                {"$inc": {"quantity": purchase.quantity}}
            )
        else:
            await db.player_crafted_items.insert_one({
                "id": str(uuid.uuid4()),
                "player_id": current_user["id"],
                "recipe_id": listing.get("original_item_id", "unknown"),
                "name": listing["item_name"],
                "quantity": purchase.quantity,
                "sell_value_each": listing["price_per_unit"],
                "crafted_at": datetime.now(timezone.utc),
                "purchased_from_market": True
            })
    else:
        # For inventory items, we need to find the original item data
        existing = await db.player_inventory.find_one({
            "player_id": current_user["id"],
            "item_data.name": listing["item_name"]
        })
        
        if existing:
            await db.player_inventory.update_one(
                {"id": existing["id"]},
                {"$inc": {"quantity": purchase.quantity}}
            )
        else:
            # Find item in catalog
            item_data = next((i for i in ITEMS_CATALOG if i["name"] == listing["item_name"]), None)
            if item_data:
                await db.player_inventory.insert_one({
                    "id": str(uuid.uuid4()),
                    "player_id": current_user["id"],
                    "item_id": item_data["id"],
                    "item_data": item_data,
                    "quantity": purchase.quantity,
                    "acquired_at": datetime.now(timezone.utc)
                })
    
    # Update or remove listing
    if purchase.quantity == listing["quantity"]:
        await db.market_listings.update_one(
            {"id": purchase.listing_id},
            {"$set": {"status": "sold", "sold_at": datetime.now(timezone.utc)}}
        )
    else:
        await db.market_listings.update_one(
            {"id": purchase.listing_id},
            {
                "$inc": {"quantity": -purchase.quantity},
                "$set": {"total_price": (listing["quantity"] - purchase.quantity) * listing["price_per_unit"]}
            }
        )
    
    # Record transaction
    await db.transactions.insert_one({
        "id": str(uuid.uuid4()),
        "type": "market_purchase",
        "buyer_id": current_user["id"],
        "seller_id": listing["seller_id"],
        "item_name": listing["item_name"],
        "quantity": purchase.quantity,
        "total_price": total_cost,
        "fee": fee,
        "timestamp": datetime.now(timezone.utc)
    })
    
    await add_player_history(current_user["id"], "market_purchased", {
        "item": listing["item_name"],
        "quantity": purchase.quantity,
        "price": total_cost
    })
    
    return {
        "success": True,
        "message": f"Compraste {purchase.quantity}x {listing['item_name']} por €{total_cost:.2f}!",
        "fee": fee,
        "total_paid": total_cost
    }

@api_router.post("/market/{listing_id}/cancel")
async def cancel_listing(listing_id: str, current_user: dict = Depends(get_current_user)):
    """Cancel a market listing and return items"""
    listing = await db.market_listings.find_one({
        "id": listing_id,
        "seller_id": current_user["id"],
        "status": "active"
    })
    
    if not listing:
        raise HTTPException(status_code=404, detail="Listagem não encontrada ou não é tua")
    
    # Return items to player
    if listing["item_type"] == "crafted":
        existing = await db.player_crafted_items.find_one({
            "player_id": current_user["id"],
            "name": listing["item_name"]
        })
        
        if existing:
            await db.player_crafted_items.update_one(
                {"id": existing["id"]},
                {"$inc": {"quantity": listing["quantity"]}}
            )
        else:
            await db.player_crafted_items.insert_one({
                "id": str(uuid.uuid4()),
                "player_id": current_user["id"],
                "recipe_id": listing.get("original_item_id", "unknown"),
                "name": listing["item_name"],
                "quantity": listing["quantity"],
                "sell_value_each": listing["price_per_unit"],
                "crafted_at": datetime.now(timezone.utc)
            })
    else:
        existing = await db.player_inventory.find_one({
            "player_id": current_user["id"],
            "item_data.name": listing["item_name"]
        })
        
        if existing:
            await db.player_inventory.update_one(
                {"id": existing["id"]},
                {"$inc": {"quantity": listing["quantity"]}}
            )
        else:
            item_data = next((i for i in ITEMS_CATALOG if i["name"] == listing["item_name"]), None)
            if item_data:
                await db.player_inventory.insert_one({
                    "id": str(uuid.uuid4()),
                    "player_id": current_user["id"],
                    "item_id": item_data["id"],
                    "item_data": item_data,
                    "quantity": listing["quantity"],
                    "acquired_at": datetime.now(timezone.utc)
                })
    
    await db.market_listings.update_one(
        {"id": listing_id},
        {"$set": {"status": "cancelled", "cancelled_at": datetime.now(timezone.utc)}}
    )
    
    return {"success": True, "message": f"Listagem cancelada. {listing['quantity']}x {listing['item_name']} devolvidos."}

@api_router.get("/market/stats")
async def get_market_stats(current_user: dict = Depends(get_current_user)):
    """Get market statistics"""
    total_listings = await db.market_listings.count_documents({"status": "active"})
    
    # Get sales in last 24 hours
    yesterday = datetime.now(timezone.utc) - timedelta(days=1)
    recent_sales = await db.market_listings.count_documents({
        "status": "sold",
        "sold_at": {"$gte": yesterday}
    })
    
    # Get total volume
    pipeline = [
        {"$match": {"status": "sold"}},
        {"$group": {"_id": None, "total": {"$sum": "$total_price"}}}
    ]
    volume_result = await db.market_listings.aggregate(pipeline).to_list(1)
    total_volume = volume_result[0]["total"] if volume_result else 0
    
    # Get popular categories
    category_pipeline = [
        {"$match": {"status": "active"}},
        {"$group": {"_id": "$category", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": 5}
    ]
    categories = await db.market_listings.aggregate(category_pipeline).to_list(5)
    
    return {
        "total_active_listings": total_listings,
        "sales_last_24h": recent_sales,
        "total_volume": total_volume,
        "popular_categories": categories,
        "market_fee": f"{MARKET_FEE * 100}%"
    }

# ============= NEWS & ANNOUNCEMENTS =============

NEWS_DATA = [
    {
        "id": "news_001",
        "title": "Sistema de Propriedades Lançado!",
        "summary": "Agora podes comprar apartamentos, casas, armazéns e muito mais!",
        "content": "O novo sistema de propriedades chegou ao SUBMUNDO! Compra propriedades em diferentes bairros da cidade e gera rendimento passivo. Cada tipo de propriedade tem características únicas e está disponível em bairros específicos. Mantém as tuas propriedades em boas condições para maximizar os lucros!",
        "category": "feature",
        "icon": "building",
        "date": "2026-02-01",
        "is_new": True,
        "version": "1.2.0"
    },
    {
        "id": "news_002",
        "title": "Negócios Ilegais Disponíveis",
        "summary": "Compra estabelecimentos e fabrica produtos para vender.",
        "content": "Expande o teu império criminal com os novos negócios! Laboratórios, oficinas clandestinas, falsificadores e muito mais. Cada negócio permite fabricar produtos únicos que podes usar ou vender no Mercado Negro. As tuas skills afetam o tempo de produção!",
        "category": "feature",
        "icon": "factory",
        "date": "2026-02-01",
        "is_new": True,
        "version": "1.2.0"
    },
    {
        "id": "news_003",
        "title": "Mercado Negro Aberto",
        "summary": "Compra e vende com outros jogadores no mercado central.",
        "content": "O Mercado Negro está oficialmente aberto! Vende os teus produtos fabricados e itens do inventário a outros jogadores. Taxa de apenas 5% por transação. Acompanha as estatísticas do mercado e descobre os itens mais procurados!",
        "category": "feature",
        "icon": "store",
        "date": "2026-02-01",
        "is_new": True,
        "version": "1.2.0"
    },
    {
        "id": "news_004",
        "title": "Guerras de Gangues Melhoradas",
        "summary": "Sistema de guerras por territórios completamente renovado.",
        "content": "As guerras de gangues foram aprimoradas! Agora com sistema de poder baseado em membros e reputação, custos estratégicos e recompensas maiores. Conquista territórios para a tua gangue e domina a cidade!",
        "category": "update",
        "icon": "swords",
        "date": "2026-01-28",
        "is_new": False,
        "version": "1.1.0"
    },
    {
        "id": "news_005",
        "title": "Eventos da Cidade",
        "summary": "Eventos aleatórios que afetam toda a cidade.",
        "content": "Fica atento aos eventos da cidade! Festivais, apagões, operações policiais e muito mais podem afetar os teus planos. Alguns eventos são oportunidades de ouro, outros requerem cautela extra.",
        "category": "update",
        "icon": "radio",
        "date": "2026-01-25",
        "is_new": False,
        "version": "1.1.0"
    },
    {
        "id": "news_006",
        "title": "Sistema de Veículos",
        "summary": "12 veículos disponíveis para compra e personalização.",
        "content": "Desde bicicletas silenciosas até supercars exóticos. Cada veículo oferece bónus únicos de velocidade, furtividade e capacidade de carga. Mantém os teus veículos em boas condições para máxima performance!",
        "category": "feature",
        "icon": "car",
        "date": "2026-01-20",
        "is_new": False,
        "version": "1.0.0"
    },
    {
        "id": "news_007",
        "title": "Bem-vindo ao SUBMUNDO",
        "summary": "O jogo de crime text-based inspirado em GTA Online.",
        "content": "SUBMUNDO é um jogo de crime totalmente text-based onde as tuas decisões têm consequências reais. Completa missões, junta-te a gangues, controla territórios e constrói o teu império criminoso. Cada escolha molda o teu destino nas ruas da cidade.",
        "category": "announcement",
        "icon": "megaphone",
        "date": "2026-01-15",
        "is_new": False,
        "version": "1.0.0"
    },
]

FAQ_DATA = [
    {
        "id": "faq_001",
        "category": "geral",
        "question": "O que é o SUBMUNDO?",
        "answer": "SUBMUNDO é um jogo de crime text-based inspirado em GTA Online. Assumes o papel de um criminoso a tentar subir na hierarquia do submundo. Completa missões, gere negócios ilegais, junta-te a gangues e compete com outros jogadores pela dominância da cidade."
    },
    {
        "id": "faq_002",
        "category": "geral",
        "question": "O jogo é gratuito?",
        "answer": "Sim, SUBMUNDO é totalmente gratuito. Não há compras dentro do jogo nem vantagens pagas. Todos os jogadores têm as mesmas oportunidades de sucesso."
    },
    {
        "id": "faq_003",
        "category": "economia",
        "question": "Qual a diferença entre dinheiro limpo e sujo?",
        "answer": "Dinheiro sujo é obtido através de atividades criminosas e não pode ser usado para compras legais. Precisas de o lavar através do sistema de lavagem de dinheiro para o converter em dinheiro limpo, mas há uma taxa e risco de ser apanhado."
    },
    {
        "id": "faq_004",
        "category": "economia",
        "question": "Como funciona a lavagem de dinheiro?",
        "answer": "Podes lavar dinheiro sujo através da opção no menu de economia. Há uma taxa que varia entre 20-40% (reduzida pela skill de Negociação) e um risco de ser apanhado baseado no teu heat. Se fores apanhado, perdes todo o dinheiro da transação."
    },
    {
        "id": "faq_005",
        "category": "economia",
        "question": "O que é o Heat?",
        "answer": "Heat representa a atenção policial sobre ti. Quanto mais crimes cometes, maior o heat. Heat alto aumenta a chance de ser apanhado em missões e lavagem de dinheiro. Reduz o heat fazendo trabalhos legais ou esperando."
    },
    {
        "id": "faq_006",
        "category": "propriedades",
        "question": "Como funcionam as propriedades?",
        "answer": "Propriedades geram rendimento passivo por hora. Cada tipo está disponível em bairros específicos e o preço varia com o valor económico do bairro. A condição da propriedade afeta o rendimento - mantém a manutenção em dia!"
    },
    {
        "id": "faq_007",
        "category": "propriedades",
        "question": "Quantas propriedades posso ter?",
        "answer": "Não há limite! Podes comprar quantas propriedades quiseres, desde que tenhas dinheiro limpo suficiente. Quanto mais propriedades, maior o rendimento passivo."
    },
    {
        "id": "faq_008",
        "category": "negocios",
        "question": "Como funciona o sistema de negócios?",
        "answer": "Compra um estabelecimento (laboratório, oficina, etc.) no seu bairro específico. Depois podes fabricar produtos usando receitas, que consomem dinheiro e tempo. Os produtos fabricados podem ser usados ou vendidos no Mercado Negro."
    },
    {
        "id": "faq_009",
        "category": "negocios",
        "question": "Posso ter vários negócios?",
        "answer": "Podes ter um negócio de cada tipo (máximo 6). Cada negócio só pode produzir um item de cada vez, por isso mais negócios significa mais produção simultânea."
    },
    {
        "id": "faq_010",
        "category": "mercado",
        "question": "Como funciona o Mercado Negro?",
        "answer": "O Mercado Negro é onde jogadores vendem itens entre si. Podes listar itens fabricados ou do inventário por um preço à tua escolha. Há uma taxa de 5% em cada venda. Outros jogadores podem comprar as tuas listagens."
    },
    {
        "id": "faq_011",
        "category": "mercado",
        "question": "Posso cancelar uma listagem?",
        "answer": "Sim! Podes cancelar qualquer listagem ativa a qualquer momento. Os itens são devolvidos ao teu inventário/stock sem custos."
    },
    {
        "id": "faq_012",
        "category": "gangues",
        "question": "Como crio ou junto-me a uma gangue?",
        "answer": "Na página de Gangues podes criar a tua própria gangue (se ainda não pertences a nenhuma) ou juntar-te a uma existente. Criar gangue custa dinheiro, juntar-se depende das regras definidas pelo líder."
    },
    {
        "id": "faq_013",
        "category": "gangues",
        "question": "O que são guerras de gangues?",
        "answer": "Guerras de gangues permitem conquistar territórios de outros ou de zonas neutras. Apenas líderes e oficiais podem iniciar guerras. O resultado depende do poder combinado dos membros de cada gangue."
    },
    {
        "id": "faq_014",
        "category": "missoes",
        "question": "Como funcionam as missões?",
        "answer": "Missões consomem energia e têm diferentes níveis de risco e recompensa. O sucesso depende do teu nível, skills, veículo ativo e heat atual. Missões legais dão dinheiro limpo, missões ilegais dão dinheiro sujo."
    },
    {
        "id": "faq_015",
        "category": "missoes",
        "question": "Como recupero energia?",
        "answer": "A energia regenera automaticamente ao longo do tempo (1 ponto por minuto). Também podes usar itens como Adrenalina para recuperar energia instantaneamente."
    },
    {
        "id": "faq_016",
        "category": "conta",
        "question": "Como mudo a minha password?",
        "answer": "Atualmente não há opção de mudança de password no jogo. Se precisares de ajuda com a tua conta, contacta o suporte."
    },
    {
        "id": "faq_017",
        "category": "conta",
        "question": "Posso apagar a minha conta?",
        "answer": "Para apagar a tua conta e todos os dados associados, contacta o suporte através dos canais oficiais. A eliminação é permanente e irreversível."
    },
]

@api_router.get("/news")
async def get_news(limit: int = 10, category: Optional[str] = None):
    """Get game news and announcements - public endpoint"""
    news = NEWS_DATA.copy()
    
    if category:
        news = [n for n in news if n["category"] == category]
    
    # Sort by date descending
    news.sort(key=lambda x: x["date"], reverse=True)
    
    return {"news": news[:limit], "total": len(NEWS_DATA)}

@api_router.get("/news/{news_id}")
async def get_news_item(news_id: str):
    """Get a specific news item - public endpoint"""
    news_item = next((n for n in NEWS_DATA if n["id"] == news_id), None)
    if not news_item:
        raise HTTPException(status_code=404, detail="Notícia não encontrada")
    return news_item

@api_router.get("/faq")
async def get_faq(category: Optional[str] = None):
    """Get frequently asked questions - public endpoint"""
    faqs = FAQ_DATA.copy()
    
    if category:
        faqs = [f for f in faqs if f["category"] == category]
    
    # Group by category
    categories = {}
    for faq in faqs:
        cat = faq["category"]
        if cat not in categories:
            categories[cat] = []
        categories[cat].append(faq)
    
    return {"faqs": faqs, "by_category": categories, "total": len(FAQ_DATA)}

@api_router.get("/info/stats")
async def get_game_stats():
    """Get public game statistics"""
    total_players = await db.players.count_documents({})
    total_gangs = await db.gangs.count_documents({})
    total_missions = await db.missions.count_documents({"status": "completed"})
    total_properties = await db.player_properties.count_documents({})
    total_businesses = await db.player_businesses.count_documents({})
    
    # Get top gang
    top_gang = await db.gangs.find_one({}, {"_id": 0, "name": 1, "reputation": 1}, sort=[("reputation", -1)])
    
    return {
        "total_players": total_players,
        "total_gangs": total_gangs,
        "total_missions_completed": total_missions,
        "total_properties_owned": total_properties,
        "total_businesses_owned": total_businesses,
        "top_gang": top_gang
    }

# ============= GAME STATE =============

@api_router.get("/game/state")
async def get_game_state(current_user: dict = Depends(get_current_user)):
    player = await db.players.find_one({"id": current_user["id"]}, {"_id": 0, "password": 0})
    active_mission = await db.missions.find_one(
        {"player_id": current_user["id"], "status": "active"},
        {"_id": 0}
    )
    
    gang = None
    if player.get("gang_id"):
        gang = await db.gangs.find_one({"id": player["gang_id"]}, {"_id": 0})
    
    neighborhoods = await db.neighborhoods.find({}, {"_id": 0}).to_list(100)
    global_heat = sum(n.get("heat_level", 0) for n in neighborhoods) // max(len(neighborhoods), 1)
    
    return {
        "player": player,
        "active_mission": active_mission,
        "gang": gang,
        "global_heat": global_heat,
        "server_time": datetime.now(timezone.utc).isoformat()
    }

@api_router.get("/game/full-state")
async def get_full_game_state(current_user: dict = Depends(get_current_user)):
    player = await db.players.find_one({"id": current_user["id"]}, {"_id": 0, "password": 0})
    
    active_mission = await db.missions.find_one(
        {"player_id": current_user["id"], "status": "active"},
        {"_id": 0}
    )
    
    gang = None
    gang_wars = []
    if player.get("gang_id"):
        gang = await db.gangs.find_one({"id": player["gang_id"]}, {"_id": 0})
        gang_wars = await db.gang_wars.find(
            {"$or": [
                {"attacker_gang_id": player["gang_id"]},
                {"defender_gang_id": player["gang_id"]}
            ], "status": "active"},
            {"_id": 0}
        ).to_list(10)
    
    vehicles = await db.player_vehicles.find(
        {"player_id": current_user["id"]},
        {"_id": 0}
    ).to_list(20)
    
    active_vehicle = next((v for v in vehicles if v.get("is_active")), None)
    
    events = await db.city_events.find({"status": "active"}, {"_id": 0}).to_list(10)
    
    neighborhoods = await db.neighborhoods.find({}, {"_id": 0}).to_list(100)
    global_heat = sum(n.get("heat_level", 0) for n in neighborhoods) // max(len(neighborhoods), 1)
    
    inventory_count = await db.player_inventory.count_documents({"player_id": current_user["id"]})
    
    new_achievements = await check_and_award_achievements(current_user["id"])
    
    return {
        "player": player,
        "active_mission": active_mission,
        "gang": gang,
        "gang_wars": gang_wars,
        "vehicles": vehicles,
        "active_vehicle": active_vehicle,
        "active_events": events,
        "global_heat": global_heat,
        "inventory_count": inventory_count,
        "new_achievements": [a["name"] for a in new_achievements] if new_achievements else [],
        "server_time": datetime.now(timezone.utc).isoformat()
    }

# ============= STARTUP =============

@app.on_event("startup")
async def startup_event():
    await init_game_data()
    logger.info("SUBMUNDO API Extended iniciada com sucesso!")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

# ============= ADVANCED GAME ENGINE ENDPOINTS =============

@api_router.get("/game-state")
async def get_game_state(current_user: dict = Depends(get_current_user)):
    """Retorna o estado completo do jogo com todos os modificadores activos"""
    
    # Buscar eventos activos
    active_events = await db.city_events.find({"status": "active"}, {"_id": 0}).to_list(10)
    
    # Calcular modificadores
    modifiers = get_game_state_modifiers(
        current_user,
        current_user.get("main_neighborhood", "centro"),
        active_events
    )
    
    return {
        "time_of_day": modifiers["time_of_day"],
        "weather": modifiers["weather"],
        "time_weather_effects": modifiers["time_weather"],
        "notoriety": modifiers["notoriety"],
        "event_modifiers": modifiers["events"],
        "combined_stealth_bonus": modifiers["combined_stealth_bonus"],
        "combined_reward_modifier": modifiers["combined_reward_modifier"],
        "active_events": active_events,
        "server_time": datetime.now(timezone.utc).isoformat()
    }

@api_router.get("/weather")
async def get_current_weather():
    """Retorna clima e período do dia actuais"""
    time_of_day = TimeWeatherSystem.get_current_time_of_day()
    weather = TimeWeatherSystem.generate_weather()
    modifiers = TimeWeatherSystem.calculate_combined_modifiers(time_of_day, weather)
    
    time_labels = {
        "dawn": "Madrugada",
        "morning": "Manhã", 
        "afternoon": "Tarde",
        "evening": "Entardecer",
        "night": "Noite",
        "late_night": "Alta Noite"
    }
    
    weather_labels = {
        "clear": "Céu Limpo",
        "cloudy": "Nublado",
        "rain": "Chuva",
        "storm": "Tempestade",
        "fog": "Nevoeiro",
        "heat": "Onda de Calor"
    }
    
    weather_icons = {
        "clear": "sun",
        "cloudy": "cloud",
        "rain": "cloud-rain",
        "storm": "cloud-lightning",
        "fog": "cloud-fog",
        "heat": "thermometer"
    }
    
    time_icons = {
        "dawn": "sunrise",
        "morning": "sun",
        "afternoon": "sun",
        "evening": "sunset",
        "night": "moon",
        "late_night": "moon-stars"
    }
    
    return {
        "time_of_day": {
            "id": time_of_day.value,
            "label": time_labels.get(time_of_day.value, "Desconhecido"),
            "icon": time_icons.get(time_of_day.value, "clock")
        },
        "weather": {
            "id": weather.value,
            "label": weather_labels.get(weather.value, "Desconhecido"),
            "icon": weather_icons.get(weather.value, "cloud")
        },
        "effects": {
            "stealth_bonus": modifiers["stealth_total"],
            "visibility": int(modifiers["visibility"] * 100),
            "police_activity": int(modifiers["police_multiplier"] * 100),
            "crime_opportunity": int(modifiers.get("crime_opportunity", 0.5) * 100)
        }
    }

@api_router.get("/notoriety")
async def get_player_notoriety(current_user: dict = Depends(get_current_user)):
    """Retorna informação de notoriedade do jogador"""
    points = NotorietySystem.calculate_notoriety_points(current_user)
    rank = NotorietySystem.get_rank(points)
    benefits = NotorietySystem.get_rank_benefits(rank)
    
    # Próximo rank
    rank_thresholds = {
        "unknown": 0,
        "street_rat": 100,
        "small_time": 500,
        "rising_star": 1500,
        "made_man": 4000,
        "shot_caller": 10000,
        "crime_lord": 25000,
        "kingpin": 50000
    }
    
    rank_names = {
        "unknown": "Desconhecido",
        "street_rat": "Rato de Rua",
        "small_time": "Pequeno Criminoso",
        "rising_star": "Estrela em Ascensão",
        "made_man": "Homem Feito",
        "shot_caller": "Mandachuva",
        "crime_lord": "Senhor do Crime",
        "kingpin": "Rei do Submundo"
    }
    
    current_threshold = rank_thresholds.get(rank.value, 0)
    next_rank = None
    next_threshold = None
    progress = 100
    
    ranks_list = list(rank_thresholds.keys())
    current_index = ranks_list.index(rank.value) if rank.value in ranks_list else 0
    
    if current_index < len(ranks_list) - 1:
        next_rank = ranks_list[current_index + 1]
        next_threshold = rank_thresholds[next_rank]
        progress = ((points - current_threshold) / (next_threshold - current_threshold)) * 100
    
    return {
        "points": points,
        "rank": {
            "id": rank.value,
            "name": rank_names.get(rank.value, rank.value),
            "threshold": current_threshold
        },
        "next_rank": {
            "id": next_rank,
            "name": rank_names.get(next_rank, "Máximo"),
            "threshold": next_threshold,
            "progress": min(100, max(0, progress))
        } if next_rank else None,
        "benefits": {
            "price_discount": benefits["price_discount"],
            "recruitment_bonus": benefits["recruitment_bonus"],
            "respect_modifier": benefits["respect_modifier"],
            "special_missions": benefits["special_missions"],
            "media_attention": benefits["media_attention"]
        }
    }

@api_router.get("/heists")
async def get_available_heists(current_user: dict = Depends(get_current_user)):
    """Retorna heists disponíveis para o jogador"""
    player_level = current_user.get("level", 1)
    
    heists = []
    for heist in HeistSystem.HEIST_TEMPLATES:
        # Verificar cooldown
        last_heist = await db.heist_history.find_one({
            "player_id": current_user["id"],
            "heist_id": heist["id"],
            "completed_at": {"$gte": datetime.now(timezone.utc) - timedelta(hours=heist["cooldown_hours"])}
        })
        
        on_cooldown = last_heist is not None
        cooldown_ends = None
        if last_heist:
            cooldown_ends = (last_heist["completed_at"] + timedelta(hours=heist["cooldown_hours"])).isoformat()
        
        # Calcular se jogador pode fazer
        can_attempt = player_level >= heist["difficulty"] and not on_cooldown
        
        heists.append({
            "id": heist["id"],
            "name": heist["name"],
            "description": heist["description"],
            "difficulty": heist["difficulty"],
            "phases": len(heist["phases"]),
            "phase_details": heist["phases"],
            "crew_required": heist["crew_required"],
            "base_reward": heist["base_reward"],
            "max_reward": heist["max_reward"],
            "heat_impact": heist["heat_impact"],
            "cooldown_hours": heist["cooldown_hours"],
            "on_cooldown": on_cooldown,
            "cooldown_ends": cooldown_ends,
            "can_attempt": can_attempt,
            "level_required": heist["difficulty"]
        })
    
    return heists

@api_router.post("/heists/{heist_id}/start")
async def start_heist(heist_id: str, current_user: dict = Depends(get_current_user)):
    """Inicia um heist"""
    # Encontrar o heist
    heist = next((h for h in HeistSystem.HEIST_TEMPLATES if h["id"] == heist_id), None)
    if not heist:
        raise HTTPException(status_code=404, detail="Heist não encontrado")
    
    # Verificar nível
    if current_user.get("level", 1) < heist["difficulty"]:
        raise HTTPException(status_code=400, detail="Nível insuficiente")
    
    # Verificar cooldown
    last_heist = await db.heist_history.find_one({
        "player_id": current_user["id"],
        "heist_id": heist_id,
        "completed_at": {"$gte": datetime.now(timezone.utc) - timedelta(hours=heist["cooldown_hours"])}
    })
    if last_heist:
        raise HTTPException(status_code=400, detail="Heist em cooldown")
    
    # Criar sessão de heist
    heist_session = {
        "id": str(uuid.uuid4()),
        "player_id": current_user["id"],
        "heist_id": heist_id,
        "started_at": datetime.now(timezone.utc),
        "current_phase": 0,
        "phase_results": [],
        "status": "in_progress"
    }
    
    await db.heist_sessions.insert_one(heist_session)
    
    return {
        "session_id": heist_session["id"],
        "heist": heist["name"],
        "total_phases": len(heist["phases"]),
        "current_phase": 0,
        "next_phase": heist["phases"][0]
    }

@api_router.post("/heists/session/{session_id}/phase")
async def complete_heist_phase(session_id: str, current_user: dict = Depends(get_current_user)):
    """Completa uma fase do heist"""
    session = await db.heist_sessions.find_one({"id": session_id, "player_id": current_user["id"]})
    if not session:
        raise HTTPException(status_code=404, detail="Sessão não encontrada")
    
    if session["status"] != "in_progress":
        raise HTTPException(status_code=400, detail="Heist já terminado")
    
    heist = next((h for h in HeistSystem.HEIST_TEMPLATES if h["id"] == session["heist_id"]), None)
    current_phase_idx = session["current_phase"]
    
    if current_phase_idx >= len(heist["phases"]):
        raise HTTPException(status_code=400, detail="Todas as fases completadas")
    
    phase = heist["phases"][current_phase_idx]
    
    # Calcular sucesso
    player_skills = current_user.get("skills", {})
    success, efficiency = HeistSystem.calculate_phase_success(
        player_skills,
        phase.get("skill"),
        True,  # Simplificado - assumir que tem items
        0
    )
    
    phase_result = {
        "phase": current_phase_idx,
        "name": phase["name"],
        "success": success,
        "efficiency": efficiency
    }
    
    # Atualizar sessão
    new_phase_idx = current_phase_idx + 1
    session["phase_results"].append(phase_result)
    
    if not success:
        # Falhou - heist termina
        await db.heist_sessions.update_one(
            {"id": session_id},
            {"$set": {"status": "failed", "phase_results": session["phase_results"]}}
        )
        
        # Aumentar heat
        await db.players.update_one(
            {"id": current_user["id"]},
            {"$inc": {"heat_individual": heist["heat_impact"] // 2}}
        )
        
        return {
            "success": False,
            "phase": phase["name"],
            "message": f"Falha na fase '{phase['name']}'! O heist foi abortado.",
            "heat_gained": heist["heat_impact"] // 2,
            "heist_complete": True,
            "heist_success": False
        }
    
    if new_phase_idx >= len(heist["phases"]):
        # Heist completo com sucesso!
        efficiencies = [r["efficiency"] for r in session["phase_results"]]
        reward_data = HeistSystem.calculate_heist_reward(heist, efficiencies, 0)
        
        await db.heist_sessions.update_one(
            {"id": session_id},
            {"$set": {"status": "completed", "phase_results": session["phase_results"]}}
        )
        
        # Registrar no histórico
        await db.heist_history.insert_one({
            "player_id": current_user["id"],
            "heist_id": heist["id"],
            "completed_at": datetime.now(timezone.utc),
            "reward": reward_data["total_reward"],
            "efficiency": reward_data["efficiency"]
        })
        
        # Dar recompensa e heat
        await db.players.update_one(
            {"id": current_user["id"]},
            {
                "$inc": {
                    "dirty_money": reward_data["total_reward"],
                    "heat_individual": heist["heat_impact"],
                    "reputation": heist["difficulty"] * 2,
                    "experience": heist["difficulty"] * 50,
                    "total_earnings": reward_data["total_reward"]
                }
            }
        )
        
        return {
            "success": True,
            "phase": phase["name"],
            "message": f"HEIST COMPLETO! '{heist['name']}' foi um sucesso!",
            "reward": reward_data["total_reward"],
            "efficiency": round(reward_data["efficiency"], 1),
            "heat_gained": heist["heat_impact"],
            "reputation_gained": heist["difficulty"] * 2,
            "heist_complete": True,
            "heist_success": True
        }
    
    # Próxima fase
    await db.heist_sessions.update_one(
        {"id": session_id},
        {"$set": {"current_phase": new_phase_idx, "phase_results": session["phase_results"]}}
    )
    
    return {
        "success": True,
        "phase": phase["name"],
        "efficiency": round(efficiency * 100, 1),
        "message": f"Fase '{phase['name']}' completada!",
        "heist_complete": False,
        "next_phase": heist["phases"][new_phase_idx]
    }

@api_router.get("/procedural-missions")
async def get_procedural_missions(current_user: dict = Depends(get_current_user)):
    """Gera missões procedurais únicas para o jogador"""
    player_level = current_user.get("level", 1)
    
    # Gerar 5 missões procedurais
    missions = []
    for _ in range(5):
        mission = ProceduralMissionGenerator.generate_mission(player_level)
        
        # Calcular dificuldade ajustada
        active_events = await db.city_events.find({"status": "active"}, {"_id": 0}).to_list(10)
        modifiers = get_game_state_modifiers(current_user, current_user.get("main_neighborhood", "centro"), active_events)
        
        difficulty_info = calculate_mission_difficulty_adjusted(
            mission["difficulty"],
            current_user,
            modifiers
        )
        
        mission["adjusted_difficulty"] = difficulty_info["adjusted_difficulty"]
        mission["success_chance"] = difficulty_info["success_chance"]
        missions.append(mission)
    
    return missions

@api_router.get("/police-status")
async def get_police_status(current_user: dict = Depends(get_current_user)):
    """Retorna status policial actual"""
    neighborhood = current_user.get("main_neighborhood", "centro")
    player_heat = current_user.get("heat_individual", 0)
    
    # Buscar heat do bairro
    nh = await db.neighborhoods.find_one({"id": neighborhood})
    neighborhood_heat = nh.get("heat_level", 20) if nh else 20
    
    time_of_day = TimeWeatherSystem.get_current_time_of_day()
    
    alert_level = PoliceAISystem.calculate_alert_level(
        player_heat,
        neighborhood_heat,
        "idle",
        time_of_day
    )
    
    response = PoliceAISystem.generate_police_response(alert_level, neighborhood)
    patrol = PoliceAISystem.PATROL_PATTERNS.get(neighborhood, {})
    
    alert_names = {
        0: "Nenhum",
        1: "Patrulha",
        2: "Busca",
        3: "Perseguição",
        4: "Lockdown",
        5: "Caça ao Homem"
    }
    
    return {
        "alert_level": {
            "value": alert_level.value,
            "name": alert_names.get(alert_level.value, "Desconhecido")
        },
        "response": response,
        "neighborhood_info": {
            "id": neighborhood,
            "patrol_frequency": patrol.get("frequency", "medium"),
            "response_time": patrol.get("response_time", 5),
            "units_available": patrol.get("units", 3)
        },
        "player_heat": player_heat,
        "neighborhood_heat": neighborhood_heat,
        "advice": "Mantém-te discreto" if alert_level.value > 2 else "Operações seguras"
    }

@api_router.get("/lore/neighborhoods/{neighborhood_id}")
async def get_neighborhood_lore(neighborhood_id: str):
    """Retorna lore detalhada de um bairro"""
    lore_data = {
        "centro": {
            "name": "Centro",
            "fullName": "Baixa-Chiado / Centro Histórico",
            "nickname": "O Coração Podre",
            "description": "O centro de Lisboa é onde tudo começou e onde tudo termina. As ruas calcetadas escondem séculos de história - e décadas de crime.",
            "history": "Antes da crise, o Centro era território neutro. Hoje, múltiplas facções mantêm uma paz instável.",
            "dangers": ["Alta presença policial", "Múltiplas gangues", "Câmaras de vigilância"],
            "opportunities": ["Carteirismo de turistas", "Proteção de lojas", "Lavagem através de estabelecimentos"],
            "landmarks": [
                {"name": "Rossio", "description": "Praça central, território neutro"},
                {"name": "Rua Augusta", "description": "Artéria comercial, ideal para carteirismo"},
                {"name": "Café A Brasileira", "description": "Ponto de encontro para negociações"}
            ],
            "controllingFactions": "Território disputado - várias facções menores"
        },
        "porto": {
            "name": "Porto Industrial",
            "fullName": "Zona Portuária / Docas",
            "nickname": "O Armazém",
            "description": "A zona portuária onde o contrabando flui como água. Armazéns abandonados escondem operações de milhões.",
            "history": "Sempre foi ponto de entrada para mercadoria ilegal. A polícia raramente se aventura aqui à noite.",
            "dangers": ["Gangues de estivadores", "Contrabandistas armados", "Pouca iluminação"],
            "opportunities": ["Contrabando marítimo", "Armazenamento seguro", "Importação de armas"],
            "landmarks": [
                {"name": "Doca Seca", "description": "Ponto de descarga nocturna"},
                {"name": "Armazém 7", "description": "Leilões clandestinos"},
                {"name": "Grua Velha", "description": "Ponto de vigia"}
            ],
            "controllingFactions": "Sindicato dos Estivadores"
        },
        "favela": {
            "name": "Favela Norte",
            "fullName": "Bairros Degradados / Zona Norte",
            "nickname": "O Labirinto",
            "description": "Ruas estreitas e becos sem saída. Quem não conhece, perde-se. Quem conhece, controla.",
            "history": "Nasceu da pobreza e cresceu com o crime. Aqui a lei é feita por quem tem mais armas.",
            "dangers": ["Violência constante", "Tiroteios frequentes", "Gangues juvenis"],
            "opportunities": ["Laboratórios clandestinos", "Recrutamento barato", "Esconderijos"],
            "landmarks": [
                {"name": "Beco do Rato", "description": "Ponto de venda de drogas"},
                {"name": "Praça Velha", "description": "Território dos Corvos"},
                {"name": "Igreja Abandonada", "description": "Refúgio seguro"}
            ],
            "controllingFactions": "Os Corvos"
        },
        "noite": {
            "name": "Distrito da Noite",
            "fullName": "Cais do Sodré / Santos",
            "nickname": "A Zona",
            "description": "Onde Lisboa vem pecar. Discotecas, bares, e negócios que só funcionam depois da meia-noite.",
            "history": "Sempre foi zona de boémia. Com a crise, tornou-se centro de tráfico de luxo.",
            "dangers": ["Competição nocturna", "Clientes imprevisíveis", "Overdoses"],
            "opportunities": ["Venda de drogas premium", "Festas privadas", "Contactos de elite"],
            "landmarks": [
                {"name": "Pink Street", "description": "Centro da vida nocturna"},
                {"name": "Club Noir", "description": "VIPs e negócios obscuros"},
                {"name": "Doca de Santo Amaro", "description": "Iates e dinheiro sujo"}
            ],
            "controllingFactions": "Sindicato da Noite"
        },
        "elite": {
            "name": "Bairro Elite",
            "fullName": "Restelo / Belém",
            "nickname": "O Museu",
            "description": "Mansões, embaixadas, e fortunas antigas. Crime aqui usa fato e gravata.",
            "history": "Sempre foi reduto dos poderosos. Hoje, abriga a elite criminal que controla a cidade nas sombras.",
            "dangers": ["Segurança privada", "Investigações federais", "Alvos de alto perfil"],
            "opportunities": ["Fraude de elite", "Roubo de arte", "Chantagem"],
            "landmarks": [
                {"name": "Torre de Belém", "description": "Marco histórico e vigia"},
                {"name": "Palácio das Sombras", "description": "Reuniões secretas"},
                {"name": "Clube dos Industriais", "description": "Onde se fazem negócios"}
            ],
            "controllingFactions": "A Fundação"
        }
    }
    
    if neighborhood_id not in lore_data:
        # Retornar dados genéricos
        nh = await db.neighborhoods.find_one({"id": neighborhood_id})
        if not nh:
            raise HTTPException(status_code=404, detail="Bairro não encontrado")
        
        return {
            "name": nh.get("name", neighborhood_id),
            "description": nh.get("description", "Informação não disponível"),
            "dangers": ["Desconhecidos"],
            "opportunities": ["Por descobrir"],
            "landmarks": []
        }
    
    return lore_data[neighborhood_id]

# ============= ECONOMIA DINÂMICA =============

@api_router.get("/economy/market-prices")
async def get_dynamic_market_prices(current_user: dict = Depends(get_current_user)):
    """Retorna preços de mercado dinâmicos baseados em oferta/procura"""
    
    # Buscar dados de mercado ou criar defaults
    market_data = await db.market_economy.find_one({"id": "global_market"})
    
    if not market_data:
        # Inicializar dados de mercado
        market_data = {
            "id": "global_market",
            "last_update": datetime.now(timezone.utc),
            "categories": {
                "drugs": {"supply": 50, "demand": 60, "base_price": 100},
                "weapons": {"supply": 30, "demand": 40, "base_price": 500},
                "documents": {"supply": 40, "demand": 50, "base_price": 200},
                "electronics": {"supply": 60, "demand": 55, "base_price": 300},
                "vehicles_parts": {"supply": 35, "demand": 45, "base_price": 400},
                "contraband": {"supply": 25, "demand": 70, "base_price": 800}
            }
        }
        await db.market_economy.insert_one(market_data)
    
    # Buscar eventos activos que afectam preços
    active_events = await db.city_events.find({"status": "active"}, {"_id": 0}).to_list(10)
    
    event_modifier = 1.0
    for event in active_events:
        if event.get("type") == "police_crackdown":
            event_modifier *= 1.3  # Preços sobem com crackdown
        elif event.get("type") == "festival":
            event_modifier *= 0.9  # Preços baixam em festivais
        elif event.get("type") == "economic_boom":
            event_modifier *= 1.2
    
    # Calcular preços actuais
    prices = []
    for category, data in market_data.get("categories", {}).items():
        supply = data.get("supply", 50)
        demand = data.get("demand", 50)
        base = data.get("base_price", 100)
        
        # Calcular preço dinâmico
        price = DynamicEconomySystem.calculate_market_price(
            category, base, supply, demand, 1.0, event_modifier, 0
        )
        
        # Determinar tendência
        ratio = demand / max(1, supply)
        if ratio > 1.2:
            trend = "up"
            trend_icon = "trending-up"
        elif ratio < 0.8:
            trend = "down"
            trend_icon = "trending-down"
        else:
            trend = "stable"
            trend_icon = "minus"
        
        prices.append({
            "category": category,
            "category_name": {
                "drugs": "Drogas",
                "weapons": "Armas",
                "documents": "Documentos",
                "electronics": "Electrónicos",
                "vehicles_parts": "Peças de Veículos",
                "contraband": "Contrabando"
            }.get(category, category),
            "base_price": base,
            "current_price": round(price, 2),
            "price_change_percent": round((price - base) / base * 100, 1),
            "supply": supply,
            "demand": demand,
            "trend": trend,
            "trend_icon": trend_icon,
            "event_modifier": round(event_modifier, 2)
        })
    
    return {
        "prices": prices,
        "last_update": market_data.get("last_update"),
        "active_events_count": len(active_events),
        "global_modifier": round(event_modifier, 2)
    }

@api_router.get("/economy/price-history/{category}")
async def get_price_history(category: str, current_user: dict = Depends(get_current_user)):
    """Retorna histórico de preços de uma categoria"""
    
    # Buscar histórico ou gerar dados simulados
    history = await db.price_history.find(
        {"category": category},
        {"_id": 0}
    ).sort("timestamp", -1).limit(24).to_list(24)
    
    if not history:
        # Gerar histórico simulado para últimas 24 horas
        now = datetime.now(timezone.utc)
        base_prices = {
            "drugs": 100, "weapons": 500, "documents": 200,
            "electronics": 300, "vehicles_parts": 400, "contraband": 800
        }
        base = base_prices.get(category, 100)
        
        history = []
        for i in range(24):
            timestamp = now - timedelta(hours=23-i)
            variation = random.uniform(0.8, 1.3)
            price = base * variation
            history.append({
                "category": category,
                "price": round(price, 2),
                "timestamp": timestamp.isoformat(),
                "hour": timestamp.hour
            })
    
    return {
        "category": category,
        "history": history,
        "period": "24h"
    }

@api_router.post("/economy/simulate-fluctuation")
async def simulate_market_fluctuation(current_user: dict = Depends(get_current_user)):
    """Simula flutuação de mercado (chamado periodicamente)"""
    
    market_data = await db.market_economy.find_one({"id": "global_market"})
    if not market_data:
        return {"message": "Mercado não inicializado"}
    
    # Buscar eventos activos
    active_events = await db.city_events.find({"status": "active"}, {"_id": 0}).to_list(10)
    event_types = [e.get("type", "") for e in active_events]
    
    # Simular flutuação para cada categoria
    updated_categories = {}
    for category, data in market_data.get("categories", {}).items():
        new_supply, new_demand = DynamicEconomySystem.simulate_market_fluctuation(
            data.get("supply", 50),
            data.get("demand", 50),
            event_types
        )
        updated_categories[category] = {
            **data,
            "supply": new_supply,
            "demand": new_demand
        }
    
    # Actualizar mercado
    await db.market_economy.update_one(
        {"id": "global_market"},
        {
            "$set": {
                "categories": updated_categories,
                "last_update": datetime.now(timezone.utc)
            }
        }
    )
    
    return {"success": True, "message": "Mercado actualizado"}

# ============= SISTEMA DE TERRITÓRIOS AVANÇADO =============

@api_router.get("/territories/analysis")
async def get_territory_analysis(current_user: dict = Depends(get_current_user)):
    """Análise completa de territórios para guerras"""
    player = await db.players.find_one({"id": current_user["id"]})
    
    if not player.get("gang_id"):
        raise HTTPException(status_code=400, detail="Precisas de estar numa gangue")
    
    gang = await db.gangs.find_one({"id": player["gang_id"]})
    if not gang:
        raise HTTPException(status_code=404, detail="Gangue não encontrada")
    
    # Buscar membros da gangue
    members = await db.players.find({"gang_id": gang["id"]}, {"_id": 0}).to_list(50)
    
    # Calcular poder da nossa gangue
    our_power = TerritoryControlSystem.calculate_war_power(gang, members, len(gang.get("territories", [])) * 10)
    
    # Buscar todos os bairros
    neighborhoods = await db.neighborhoods.find({}, {"_id": 0}).to_list(20)
    
    territories_analysis = []
    for nh in neighborhoods:
        controller_id = nh.get("controlled_by")
        
        if controller_id == gang["id"]:
            status = "controlled"
            can_attack = False
            war_prediction = None
        elif controller_id:
            # Buscar gangue controladora
            controller = await db.gangs.find_one({"id": controller_id})
            if controller:
                controller_members = await db.players.find({"gang_id": controller_id}, {"_id": 0}).to_list(50)
                defender_power = TerritoryControlSystem.calculate_war_power(
                    controller, controller_members, 10  # Bónus defesa
                )
                
                # Simular resultado
                prediction = TerritoryControlSystem.simulate_war_outcome(our_power, defender_power)
                
                war_prediction = {
                    "attacker_chance": prediction["attacker_chance"],
                    "defender_chance": prediction["defender_chance"],
                    "our_power": our_power,
                    "enemy_power": defender_power,
                    "estimated_losses": prediction["attacker_losses_percent"],
                    "recommendation": "Atacar" if prediction["attacker_chance"] > 50 else "Evitar"
                }
                status = "enemy_controlled"
                can_attack = True
            else:
                status = "neutral"
                can_attack = True
                war_prediction = {"attacker_chance": 80, "recommendation": "Fácil conquista"}
        else:
            status = "neutral"
            can_attack = True
            war_prediction = {"attacker_chance": 90, "recommendation": "Território livre"}
        
        # Calcular rendimento potencial
        income_analysis = TerritoryControlSystem.calculate_territory_income(
            {"economic_value": nh.get("economic_value", 50), "heat_level": nh.get("heat_level", 20)},
            gang,
            0
        )
        
        territories_analysis.append({
            "id": nh["id"],
            "name": nh["name"],
            "economic_value": nh.get("economic_value", 50),
            "status": status,
            "controller": nh.get("controlled_by_name"),
            "can_attack": can_attack,
            "war_prediction": war_prediction,
            "potential_income": income_analysis["final_income"],
            "heat_level": nh.get("heat_level", 20)
        })
    
    return {
        "our_gang": {
            "name": gang["name"],
            "power": our_power,
            "members_count": len(members),
            "territories_count": len(gang.get("territories", []))
        },
        "territories": territories_analysis
    }

@api_router.get("/territories/{territory_id}/power")
async def get_territory_power_analysis(territory_id: str, current_user: dict = Depends(get_current_user)):
    """Análise detalhada de poder de um território específico"""
    
    neighborhood = await db.neighborhoods.find_one({"id": territory_id})
    if not neighborhood:
        raise HTTPException(status_code=404, detail="Território não encontrado")
    
    player = await db.players.find_one({"id": current_user["id"]})
    if not player.get("gang_id"):
        raise HTTPException(status_code=400, detail="Precisas de estar numa gangue")
    
    our_gang = await db.gangs.find_one({"id": player["gang_id"]})
    our_members = await db.players.find({"gang_id": our_gang["id"]}, {"_id": 0}).to_list(50)
    our_power = TerritoryControlSystem.calculate_war_power(our_gang, our_members, len(our_gang.get("territories", [])) * 10)
    
    controller_id = neighborhood.get("controlled_by")
    enemy_analysis = None
    
    if controller_id and controller_id != our_gang["id"]:
        enemy_gang = await db.gangs.find_one({"id": controller_id})
        if enemy_gang:
            enemy_members = await db.players.find({"gang_id": controller_id}, {"_id": 0}).to_list(50)
            enemy_power = TerritoryControlSystem.calculate_war_power(enemy_gang, enemy_members, 10)
            
            prediction = TerritoryControlSystem.simulate_war_outcome(our_power, enemy_power)
            
            enemy_analysis = {
                "gang_name": enemy_gang["name"],
                "power": enemy_power,
                "members_count": len(enemy_members),
                "defense_bonus": 20,
                "our_win_chance": prediction["attacker_chance"],
                "our_estimated_losses": prediction["attacker_losses_percent"],
                "enemy_estimated_losses": prediction["defender_losses_percent"]
            }
    
    return {
        "territory": {
            "id": neighborhood["id"],
            "name": neighborhood["name"],
            "economic_value": neighborhood.get("economic_value", 50),
            "heat_level": neighborhood.get("heat_level", 20)
        },
        "our_power": our_power,
        "enemy": enemy_analysis,
        "recommendation": "Atacar" if (enemy_analysis and enemy_analysis["our_win_chance"] > 50) or not enemy_analysis else "Evitar"
    }

# ============= EVENTOS DINÂMICOS REACTIVOS =============

@api_router.get("/events/dynamic")
async def get_dynamic_events(current_user: dict = Depends(get_current_user)):
    """Retorna eventos dinâmicos baseados no estado do jogo"""
    
    # Calcular estatísticas do jogo
    total_crimes_24h = await db.player_history.count_documents({
        "action": {"$in": ["mission_completed", "crime_completed"]},
        "timestamp": {"$gte": datetime.now(timezone.utc) - timedelta(hours=24)}
    })
    
    active_wars = await db.gang_wars.count_documents({"status": "active"})
    
    # Média de dinheiro dos jogadores
    pipeline = [
        {"$group": {"_id": None, "avg_money": {"$avg": {"$add": ["$clean_money", "$dirty_money"]}}}}
    ]
    result = await db.players.aggregate(pipeline).to_list(1)
    avg_money = result[0]["avg_money"] if result else 10000
    
    active_players = await db.players.count_documents({
        "last_active": {"$gte": datetime.now(timezone.utc) - timedelta(hours=1)}
    })
    
    game_stats = {
        "total_crimes_24h": total_crimes_24h,
        "active_wars": active_wars,
        "avg_player_money": avg_money,
        "active_players_1h": active_players,
        "is_holiday": False  # Pode ser configurado
    }
    
    # Verificar triggers de eventos
    potential_events = []
    
    if total_crimes_24h > 50:
        potential_events.append({
            "type": "police_crackdown",
            "name": "Operação Policial",
            "description": "A polícia está a intensificar patrulhas devido à alta actividade criminal.",
            "probability": 70,
            "effects": {"heat_modifier": 1.5, "reward_modifier": 0.8}
        })
    
    if active_wars > 1:
        potential_events.append({
            "type": "gang_war_tension",
            "name": "Tensão entre Gangues",
            "description": "Múltiplas guerras activas aumentam a violência nas ruas.",
            "probability": 60,
            "effects": {"danger_modifier": 1.3, "weapons_demand": 1.5}
        })
    
    if avg_money < 5000:
        potential_events.append({
            "type": "economic_crisis",
            "name": "Crise Económica",
            "description": "Dinheiro escasso está a criar oportunidades no mercado negro.",
            "probability": 50,
            "effects": {"market_bonus": 1.2, "desperation": 1.4}
        })
    
    # Eventos sempre possíveis
    potential_events.extend([
        {
            "type": "festival",
            "name": "Festival de Rua",
            "description": "Evento popular atrai multidões - ideal para pickpockets.",
            "probability": 20,
            "effects": {"pickpocket_bonus": 1.5, "police_distraction": 0.7}
        },
        {
            "type": "blackout",
            "name": "Apagão",
            "description": "Falha de energia em partes da cidade.",
            "probability": 10,
            "effects": {"stealth_bonus": 2.0, "alarm_systems": 0}
        }
    ])
    
    return {
        "game_stats": game_stats,
        "potential_events": potential_events,
        "current_conditions": {
            "crime_level": "alto" if total_crimes_24h > 50 else "médio" if total_crimes_24h > 20 else "baixo",
            "war_status": "activo" if active_wars > 0 else "pacífico",
            "economy": "em crise" if avg_money < 5000 else "estável" if avg_money < 20000 else "próspera"
        }
    }

@api_router.get("/events/impact")
async def get_event_impact(current_user: dict = Depends(get_current_user)):
    """Calcula impacto dos eventos actuais no jogador"""
    
    # Buscar eventos activos
    active_events = await db.city_events.find({"status": "active"}, {"_id": 0}).to_list(10)
    
    player_location = current_user.get("main_neighborhood", "centro")
    
    combined_impact = {
        "heat_modifier": 1.0,
        "reward_modifier": 1.0,
        "stealth_modifier": 1.0,
        "danger_modifier": 1.0,
        "advice": []
    }
    
    for event in active_events:
        impact = DynamicEventSystem.calculate_event_impact(
            event.get("type", ""),
            current_user,
            player_location
        )
        
        combined_impact["heat_modifier"] *= impact.get("heat_modifier", 1.0)
        combined_impact["reward_modifier"] *= impact.get("reward_modifier", 1.0)
        
        if impact.get("advice"):
            combined_impact["advice"].append({
                "event": event.get("name", event.get("type")),
                "tip": impact["advice"]
            })
    
    # Adicionar conselhos gerais baseados nos modificadores
    if combined_impact["heat_modifier"] > 1.2:
        combined_impact["advice"].append({
            "event": "Condições Gerais",
            "tip": "Heat aumentado - considera trabalhos legais ou muda de bairro"
        })
    
    if combined_impact["reward_modifier"] > 1.2:
        combined_impact["advice"].append({
            "event": "Oportunidade",
            "tip": "Recompensas aumentadas - bom momento para missões"
        })
    
    return {
        "active_events": active_events,
        "combined_impact": {
            "heat_modifier": round(combined_impact["heat_modifier"], 2),
            "reward_modifier": round(combined_impact["reward_modifier"], 2),
            "stealth_modifier": round(combined_impact["stealth_modifier"], 2),
            "danger_modifier": round(combined_impact["danger_modifier"], 2)
        },
        "advice": combined_impact["advice"]
    }

@api_router.get("/events/predictions")
async def get_event_predictions(current_user: dict = Depends(get_current_user)):
    """Previsões de eventos futuros baseados no estado actual"""
    
    # Buscar dados para prever
    recent_events = await db.city_events.find(
        {},
        {"_id": 0}
    ).sort("started_at", -1).limit(10).to_list(10)
    
    # Estatísticas recentes
    crimes_last_hour = await db.player_history.count_documents({
        "action": "mission_completed",
        "timestamp": {"$gte": datetime.now(timezone.utc) - timedelta(hours=1)}
    })
    
    predictions = []
    
    # Previsão: Operação policial se crimes altos
    if crimes_last_hour > 10:
        predictions.append({
            "event_type": "police_crackdown",
            "name": "Operação Policial",
            "probability": min(90, 30 + crimes_last_hour * 5),
            "estimated_time": "Próximas 2-4 horas",
            "impact": "Heat aumentado, missões mais arriscadas",
            "preparation": "Conclui missões activas, guarda dinheiro"
        })
    
    # Previsão: Festival (baseado em hora do dia)
    hour = datetime.now().hour
    if 18 <= hour <= 22:
        predictions.append({
            "event_type": "festival",
            "name": "Evento Nocturno",
            "probability": 40,
            "estimated_time": "Próximas 1-3 horas",
            "impact": "Mais oportunidades de furto",
            "preparation": "Prepara itens de stealth"
        })
    
    # Previsão: Apagão (aleatório)
    predictions.append({
        "event_type": "blackout",
        "name": "Apagão",
        "probability": 15,
        "estimated_time": "Imprevisível",
        "impact": "Stealth muito melhorado",
        "preparation": "Mantém missões de assalto prontas"
    })
    
    # Previsão baseada em guerras
    active_wars = await db.gang_wars.count_documents({"status": "active"})
    if active_wars > 0:
        predictions.append({
            "event_type": "gang_truce",
            "name": "Trégua de Gangues",
            "probability": 20 + active_wars * 10,
            "estimated_time": "Depende das guerras",
            "impact": "Paz temporária, sem guerras",
            "preparation": "Expande territórios durante a trégua"
        })
    
    return {
        "predictions": predictions,
        "analysis_based_on": {
            "recent_crimes": crimes_last_hour,
            "active_wars": active_wars,
            "time_of_day": hour
        }
    }

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

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
    {"id": "lockpick_basic", "name": "Kit Gazua Básico", "type": "tool", "price": 100, "effect": {"lockpicking_bonus": 1}, "consumable": False},
    {"id": "lockpick_pro", "name": "Kit Gazua Pro", "type": "tool", "price": 500, "effect": {"lockpicking_bonus": 3}, "consumable": False},
    {"id": "mask_basic", "name": "Máscara Simples", "type": "disguise", "price": 50, "effect": {"stealth_bonus": 1}, "consumable": False},
    {"id": "mask_pro", "name": "Máscara Profissional", "type": "disguise", "price": 300, "effect": {"stealth_bonus": 3, "heat_reduction": 5}, "consumable": False},
    {"id": "fake_id", "name": "Identificação Falsa", "type": "document", "price": 1000, "effect": {"heat_reduction": 10}, "consumable": True},
    {"id": "burner_phone", "name": "Telefone Descartável", "type": "tool", "price": 200, "effect": {"untraceable": True}, "consumable": True},
    {"id": "body_armor", "name": "Colete Balístico", "type": "armor", "price": 2000, "effect": {"damage_reduction": 30}, "consumable": False},
    {"id": "first_aid", "name": "Kit Primeiros Socorros", "type": "medical", "price": 150, "effect": {"heal": 30}, "consumable": True},
    {"id": "adrenaline", "name": "Injeção Adrenalina", "type": "medical", "price": 500, "effect": {"energy_boost": 50}, "consumable": True},
    {"id": "hacking_usb", "name": "USB Hacking", "type": "tool", "price": 800, "effect": {"hacking_bonus": 2}, "consumable": True},
    {"id": "silencer", "name": "Silenciador", "type": "weapon_mod", "price": 1500, "effect": {"stealth_bonus": 5}, "consumable": False},
    {"id": "night_vision", "name": "Óculos Visão Noturna", "type": "gear", "price": 3000, "effect": {"night_bonus": 50}, "consumable": False},
    {"id": "gps_jammer", "name": "Bloqueador GPS", "type": "tool", "price": 2500, "effect": {"untraceable": True, "duration": 3600}, "consumable": True},
    {"id": "smoke_bomb", "name": "Bomba de Fumo", "type": "tactical", "price": 300, "effect": {"escape_bonus": 30}, "consumable": True},
    {"id": "emp_device", "name": "Dispositivo EMP", "type": "tactical", "price": 5000, "effect": {"disable_electronics": True}, "consumable": True},
    {"id": "bribe_money", "name": "Envelope de Suborno", "type": "special", "price": 1000, "effect": {"reduce_heat": 20}, "consumable": True},
    {"id": "counterfeit_cash", "name": "Notas Falsas", "type": "special", "price": 500, "effect": {"dirty_money": 1000}, "consumable": True},
    {"id": "police_scanner", "name": "Scanner Policial", "type": "tool", "price": 1200, "effect": {"police_warning": True}, "consumable": False},
    {"id": "drug_stash_small", "name": "Pequeno Stash", "type": "contraband", "price": 2000, "effect": {"resell_value": 4000}, "consumable": True},
    {"id": "drug_stash_large", "name": "Grande Stash", "type": "contraband", "price": 10000, "effect": {"resell_value": 25000}, "consumable": True},
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
    {"id": "apartamento", "name": "Apartamento", "description": "Espaço compacto no centro urbano.", "base_price": 5000, "income_per_hour": 50, "maintenance_cost": 20, "capacity": 1, "allowed_neighborhoods": ["centro", "comercial", "universidade"]},
    {"id": "casa", "name": "Casa", "description": "Residência confortável com espaço extra.", "base_price": 15000, "income_per_hour": 120, "maintenance_cost": 50, "capacity": 2, "allowed_neighborhoods": ["suburbio", "praia", "elite"]},
    {"id": "armazem", "name": "Armazém", "description": "Espaço amplo para guardar mercadoria.", "base_price": 25000, "income_per_hour": 200, "maintenance_cost": 80, "capacity": 10, "allowed_neighborhoods": ["porto", "industrial", "comercial"]},
    {"id": "fabrica", "name": "Fábrica Clandestina", "description": "Instalação secreta para operações ilegais.", "base_price": 50000, "income_per_hour": 400, "maintenance_cost": 150, "capacity": 5, "allowed_neighborhoods": ["industrial", "porto", "favela"]},
    {"id": "mansao", "name": "Mansão", "description": "Propriedade de luxo com todas as comodidades.", "base_price": 100000, "income_per_hour": 800, "maintenance_cost": 300, "capacity": 8, "allowed_neighborhoods": ["elite", "praia"]},
    {"id": "bunker", "name": "Bunker Subterrâneo", "description": "Refúgio secreto e fortificado.", "base_price": 75000, "income_per_hour": 500, "maintenance_cost": 200, "capacity": 15, "allowed_neighborhoods": ["industrial", "suburbio"]},
]

BUSINESS_TYPES = [
    {
        "id": "laboratorio",
        "name": "Laboratório",
        "description": "Produz substâncias sintéticas de alta qualidade.",
        "neighborhood": "favela",
        "price": 30000,
        "maintenance_cost": 500,
        "icon": "flask",
        "products": ["droga_sintetica", "medicamento_ilegal", "estimulante"]
    },
    {
        "id": "oficina",
        "name": "Oficina Clandestina",
        "description": "Modifica e fabrica armas fora do radar.",
        "neighborhood": "porto",
        "price": 40000,
        "maintenance_cost": 600,
        "icon": "wrench",
        "products": ["arma_modificada", "silenciador_custom", "colete_reforçado"]
    },
    {
        "id": "falsificador",
        "name": "Falsificador",
        "description": "Especialista em documentos e identidades falsas.",
        "neighborhood": "centro",
        "price": 35000,
        "maintenance_cost": 450,
        "icon": "file-text",
        "products": ["documento_falso", "passaporte_falso", "carta_conducao_falsa"]
    },
    {
        "id": "garage",
        "name": "Garage Tunning",
        "description": "Personaliza e melhora veículos para fugas.",
        "neighborhood": "suburbio",
        "price": 45000,
        "maintenance_cost": 550,
        "icon": "car",
        "products": ["turbo_kit", "blindagem_leve", "kit_fuga"]
    },
    {
        "id": "destilaria",
        "name": "Destilaria Ilegal",
        "description": "Produz bebidas contrabandeadas de alta qualidade.",
        "neighborhood": "noite",
        "price": 25000,
        "maintenance_cost": 350,
        "icon": "wine",
        "products": ["whisky_premium", "vodka_artesanal", "licor_raro"]
    },
    {
        "id": "centro_hacking",
        "name": "Centro de Hacking",
        "description": "Operações digitais e cibercrimes.",
        "neighborhood": "comercial",
        "price": 50000,
        "maintenance_cost": 700,
        "icon": "terminal",
        "products": ["malware_custom", "dados_roubados", "crypto_mixer"]
    },
]

CRAFTING_RECIPES = [
    # Laboratório (Favela)
    {"id": "droga_sintetica", "name": "Droga Sintética", "description": "Substância potente para revenda.", "business_type": "laboratorio", "cost": 500, "time_minutes": 30, "sell_value": 1500, "quantity": 5, "skill_bonus": "hacking", "heat_risk": 15},
    {"id": "medicamento_ilegal", "name": "Medicamento Ilegal", "description": "Fármacos sem receita.", "business_type": "laboratorio", "cost": 300, "time_minutes": 20, "sell_value": 800, "quantity": 10, "skill_bonus": None, "heat_risk": 5},
    {"id": "estimulante", "name": "Estimulante Extremo", "description": "Boost de energia temporário.", "business_type": "laboratorio", "cost": 800, "time_minutes": 45, "sell_value": 2500, "quantity": 3, "skill_bonus": "hacking", "heat_risk": 20},
    
    # Oficina Clandestina (Porto)
    {"id": "arma_modificada", "name": "Arma Modificada", "description": "Arma com performance melhorada.", "business_type": "oficina", "cost": 1500, "time_minutes": 60, "sell_value": 4000, "quantity": 1, "skill_bonus": "combat", "heat_risk": 25},
    {"id": "silenciador_custom", "name": "Silenciador Custom", "description": "Silenciador de alta qualidade.", "business_type": "oficina", "cost": 800, "time_minutes": 30, "sell_value": 2000, "quantity": 2, "skill_bonus": "stealth", "heat_risk": 10},
    {"id": "colete_reforcado", "name": "Colete Reforçado", "description": "Proteção balística melhorada.", "business_type": "oficina", "cost": 2000, "time_minutes": 90, "sell_value": 5000, "quantity": 1, "skill_bonus": "combat", "heat_risk": 15},
    
    # Falsificador (Centro)
    {"id": "documento_falso", "name": "Documento Falso", "description": "ID falsa de alta qualidade.", "business_type": "falsificador", "cost": 400, "time_minutes": 25, "sell_value": 1200, "quantity": 3, "skill_bonus": "negotiation", "heat_risk": 8},
    {"id": "passaporte_falso", "name": "Passaporte Falso", "description": "Passaporte internacional falso.", "business_type": "falsificador", "cost": 1000, "time_minutes": 60, "sell_value": 3000, "quantity": 1, "skill_bonus": "negotiation", "heat_risk": 20},
    {"id": "carta_conducao_falsa", "name": "Carta de Condução Falsa", "description": "Habilitação falsificada.", "business_type": "falsificador", "cost": 300, "time_minutes": 15, "sell_value": 800, "quantity": 5, "skill_bonus": None, "heat_risk": 5},
    
    # Garage Tunning (Subúrbio)
    {"id": "turbo_kit", "name": "Kit Turbo", "description": "Aumenta velocidade do veículo.", "business_type": "garage", "cost": 2500, "time_minutes": 120, "sell_value": 6000, "quantity": 1, "skill_bonus": "driving", "heat_risk": 5},
    {"id": "blindagem_leve", "name": "Blindagem Leve", "description": "Proteção básica para veículo.", "business_type": "garage", "cost": 3000, "time_minutes": 150, "sell_value": 7500, "quantity": 1, "skill_bonus": "driving", "heat_risk": 8},
    {"id": "kit_fuga", "name": "Kit de Fuga", "description": "Equipamento para fugas rápidas.", "business_type": "garage", "cost": 1500, "time_minutes": 60, "sell_value": 4000, "quantity": 1, "skill_bonus": "stealth", "heat_risk": 3},
    
    # Destilaria (Noite)
    {"id": "whisky_premium", "name": "Whisky Premium", "description": "Bebida de alta qualidade.", "business_type": "destilaria", "cost": 600, "time_minutes": 45, "sell_value": 1800, "quantity": 6, "skill_bonus": "negotiation", "heat_risk": 3},
    {"id": "vodka_artesanal", "name": "Vodka Artesanal", "description": "Destilado puro.", "business_type": "destilaria", "cost": 400, "time_minutes": 30, "sell_value": 1200, "quantity": 8, "skill_bonus": None, "heat_risk": 2},
    {"id": "licor_raro", "name": "Licor Raro", "description": "Bebida exclusiva e cara.", "business_type": "destilaria", "cost": 1000, "time_minutes": 90, "sell_value": 3500, "quantity": 3, "skill_bonus": "negotiation", "heat_risk": 5},
    
    # Centro de Hacking (Comercial)
    {"id": "malware_custom", "name": "Malware Custom", "description": "Software malicioso personalizado.", "business_type": "centro_hacking", "cost": 2000, "time_minutes": 60, "sell_value": 5500, "quantity": 1, "skill_bonus": "hacking", "heat_risk": 30},
    {"id": "dados_roubados", "name": "Dados Roubados", "description": "Informação sensível de empresas.", "business_type": "centro_hacking", "cost": 1500, "time_minutes": 45, "sell_value": 4000, "quantity": 1, "skill_bonus": "hacking", "heat_risk": 25},
    {"id": "crypto_mixer", "name": "Crypto Mixer", "description": "Serviço de lavagem de criptomoedas.", "business_type": "centro_hacking", "cost": 3000, "time_minutes": 30, "sell_value": 8000, "quantity": 1, "skill_bonus": "hacking", "heat_risk": 15},
]

# Market fee percentage
MARKET_FEE = 0.05  # 5%

CONTRACTS_CONFIG = [
    {"id": "assassination", "name": "Assassinato", "description": "Eliminar um alvo específico", "base_reward": 10000, "risk": 9, "heat_impact": 50, "reputation_impact": 20, "duration_hours": 24},
    {"id": "kidnapping", "name": "Rapto", "description": "Sequestrar e manter refém", "base_reward": 15000, "risk": 8, "heat_impact": 40, "reputation_impact": 15, "duration_hours": 48},
    {"id": "sabotage", "name": "Sabotagem", "description": "Destruir propriedade rival", "base_reward": 5000, "risk": 6, "heat_impact": 25, "reputation_impact": 10, "duration_hours": 12},
    {"id": "intimidation", "name": "Intimidação", "description": "Assustar um alvo", "base_reward": 2000, "risk": 4, "heat_impact": 10, "reputation_impact": 5, "duration_hours": 6},
    {"id": "theft_special", "name": "Roubo Especial", "description": "Roubar item específico", "base_reward": 8000, "risk": 7, "heat_impact": 30, "reputation_impact": 12, "duration_hours": 18},
    {"id": "escort", "name": "Escolta", "description": "Proteger alguém durante viagem", "base_reward": 3000, "risk": 5, "heat_impact": 5, "reputation_impact": 8, "duration_hours": 8},
    {"id": "delivery", "name": "Entrega Especial", "description": "Transportar mercadoria sensível", "base_reward": 4000, "risk": 5, "heat_impact": 15, "reputation_impact": 6, "duration_hours": 4},
    {"id": "info_extraction", "name": "Extração de Info", "description": "Obter informação por qualquer meio", "base_reward": 6000, "risk": 6, "heat_impact": 20, "reputation_impact": 10, "duration_hours": 12},
]

VEHICLE_CATALOG = [
    {"id": "bicicleta", "name": "Bicicleta", "description": "Transporte básico e silencioso.", "price": 500, "speed": 2, "stealth": 8, "capacity": 1, "maintenance_cost": 10, "category": "basic"},
    {"id": "scooter", "name": "Scooter", "description": "Mobilidade urbana económica.", "price": 2000, "speed": 4, "stealth": 6, "capacity": 1, "maintenance_cost": 50, "category": "basic"},
    {"id": "carro_usado", "name": "Carro Usado", "description": "Veículo discreto para o dia-a-dia.", "price": 5000, "speed": 5, "stealth": 5, "capacity": 4, "maintenance_cost": 100, "category": "standard"},
    {"id": "mota_desportiva", "name": "Mota Desportiva", "description": "Rápida e perfeita para fugas.", "price": 15000, "speed": 9, "stealth": 4, "capacity": 1, "maintenance_cost": 200, "category": "sport"},
    {"id": "sedan_luxo", "name": "Sedan de Luxo", "description": "Conforto e estilo para negócios.", "price": 30000, "speed": 7, "stealth": 3, "capacity": 4, "maintenance_cost": 400, "category": "luxury"},
    {"id": "suv_blindado", "name": "SUV Blindado", "description": "Proteção máxima para situações perigosas.", "price": 50000, "speed": 5, "stealth": 2, "capacity": 6, "maintenance_cost": 600, "category": "armored"},
    {"id": "carrinha_carga", "name": "Carrinha de Carga", "description": "Ideal para transportar mercadoria.", "price": 20000, "speed": 4, "stealth": 5, "capacity": 20, "maintenance_cost": 300, "category": "utility"},
    {"id": "desportivo", "name": "Desportivo Exótico", "description": "O sonho de qualquer criminoso.", "price": 100000, "speed": 10, "stealth": 1, "capacity": 2, "maintenance_cost": 1000, "category": "exotic"},
    {"id": "mota_chopper", "name": "Chopper Customizada", "description": "Estilo e presença.", "price": 25000, "speed": 7, "stealth": 3, "capacity": 2, "maintenance_cost": 350, "category": "custom"},
    {"id": "muscle_car", "name": "Muscle Car", "description": "Potência americana clássica.", "price": 40000, "speed": 8, "stealth": 2, "capacity": 4, "maintenance_cost": 500, "category": "sport"},
    {"id": "van_stealth", "name": "Van Operações", "description": "Equipada para operações especiais.", "price": 35000, "speed": 5, "stealth": 7, "capacity": 8, "maintenance_cost": 450, "category": "utility"},
    {"id": "supercar", "name": "Supercar", "description": "Velocidade pura, sem compromissos.", "price": 200000, "speed": 10, "stealth": 1, "capacity": 2, "maintenance_cost": 2000, "category": "exotic"},
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
    {"type": "roubo_pequeno", "name": "Roubo de Carteira", "description": "Roubar a carteira de um transeunte distraído.", "risk": 2, "duration_seconds": 30, "reward_min": 50, "reward_max": 150, "heat_impact": 5, "reputation_impact": 1, "energy_cost": 10, "category": "crime", "skill_bonus": "stealth"},
    {"type": "roubo_carro", "name": "Roubo de Carro", "description": "Roubar um veículo estacionado.", "risk": 4, "duration_seconds": 60, "reward_min": 200, "reward_max": 800, "heat_impact": 15, "reputation_impact": 3, "energy_cost": 20, "category": "crime", "skill_bonus": "lockpicking"},
    {"type": "assalto_loja", "name": "Assalto a Loja", "description": "Assaltar uma loja comercial.", "risk": 6, "duration_seconds": 90, "reward_min": 500, "reward_max": 2000, "heat_impact": 25, "reputation_impact": 5, "energy_cost": 30, "category": "crime", "skill_bonus": "intimidation"},
    {"type": "contrabando", "name": "Entrega de Contrabando", "description": "Transportar mercadoria ilegal.", "risk": 5, "duration_seconds": 120, "reward_min": 300, "reward_max": 1000, "heat_impact": 10, "reputation_impact": 4, "energy_cost": 25, "category": "crime", "skill_bonus": "driving"},
    {"type": "emprego_legal", "name": "Trabalho Honesto", "description": "Fazer um trabalho temporário legal.", "risk": 0, "duration_seconds": 180, "reward_min": 100, "reward_max": 250, "heat_impact": -5, "reputation_impact": 0, "energy_cost": 20, "category": "legal", "skill_bonus": None},
    {"type": "hacker", "name": "Hacking Bancário", "description": "Invadir sistemas de um banco local.", "risk": 7, "duration_seconds": 150, "reward_min": 800, "reward_max": 3000, "heat_impact": 20, "reputation_impact": 6, "energy_cost": 35, "category": "crime", "skill_bonus": "hacking"},
    {"type": "cobranca", "name": "Cobrança de Dívidas", "description": "Cobrar dívidas para um agiota local.", "risk": 4, "duration_seconds": 60, "reward_min": 200, "reward_max": 600, "heat_impact": 8, "reputation_impact": 2, "energy_cost": 15, "category": "crime", "skill_bonus": "intimidation"},
    {"type": "vigilante", "name": "Vigilante Noturno", "description": "Vigiar um armazém à noite.", "risk": 1, "duration_seconds": 240, "reward_min": 150, "reward_max": 300, "heat_impact": -3, "reputation_impact": 1, "energy_cost": 15, "category": "legal", "skill_bonus": None},
    {"type": "arrombamento", "name": "Arrombamento Residencial", "description": "Invadir uma casa e roubar objetos de valor.", "risk": 5, "duration_seconds": 90, "reward_min": 400, "reward_max": 1500, "heat_impact": 18, "reputation_impact": 4, "energy_cost": 25, "category": "crime", "skill_bonus": "lockpicking"},
    {"type": "fraude", "name": "Fraude de Identidade", "description": "Usar documentos falsos para obter dinheiro.", "risk": 4, "duration_seconds": 120, "reward_min": 500, "reward_max": 1200, "heat_impact": 12, "reputation_impact": 3, "energy_cost": 20, "category": "crime", "skill_bonus": "negotiation"},
    {"type": "extorsao", "name": "Extorsão", "description": "Chantagear um empresário local.", "risk": 6, "duration_seconds": 100, "reward_min": 600, "reward_max": 2000, "heat_impact": 22, "reputation_impact": 6, "energy_cost": 30, "category": "crime", "skill_bonus": "intimidation"},
    {"type": "corrida_ilegal", "name": "Corrida Ilegal", "description": "Participar numa corrida de rua.", "risk": 5, "duration_seconds": 180, "reward_min": 1000, "reward_max": 5000, "heat_impact": 15, "reputation_impact": 5, "energy_cost": 35, "category": "crime", "skill_bonus": "driving"},
    {"type": "trafego_armas", "name": "Tráfico de Armas", "description": "Transportar armas para um comprador.", "risk": 8, "duration_seconds": 150, "reward_min": 1500, "reward_max": 4000, "heat_impact": 35, "reputation_impact": 8, "energy_cost": 40, "category": "crime", "skill_bonus": "driving"},
    {"type": "sequestro_rapido", "name": "Sequestro Relâmpago", "description": "Raptar alguém por resgate rápido.", "risk": 8, "duration_seconds": 200, "reward_min": 2000, "reward_max": 6000, "heat_impact": 40, "reputation_impact": 10, "energy_cost": 45, "category": "crime", "skill_bonus": "combat"},
    {"type": "assalto_banco", "name": "Assalto a Banco", "description": "O grande golpe. Alto risco, alta recompensa.", "risk": 10, "duration_seconds": 300, "reward_min": 5000, "reward_max": 20000, "heat_impact": 60, "reputation_impact": 20, "energy_cost": 60, "category": "crime", "skill_bonus": "combat"},
    {"type": "entrega_pizza", "name": "Entrega de Pizza", "description": "Trabalho honesto como entregador.", "risk": 0, "duration_seconds": 60, "reward_min": 30, "reward_max": 80, "heat_impact": -2, "reputation_impact": 0, "energy_cost": 10, "category": "legal", "skill_bonus": "driving"},
    {"type": "seguranca", "name": "Segurança Privada", "description": "Trabalhar como segurança num evento.", "risk": 1, "duration_seconds": 300, "reward_min": 200, "reward_max": 400, "heat_impact": -5, "reputation_impact": 1, "energy_cost": 25, "category": "legal", "skill_bonus": "combat"},
    {"type": "informante", "name": "Venda de Informação", "description": "Vender informações sobre rivais.", "risk": 3, "duration_seconds": 45, "reward_min": 300, "reward_max": 800, "heat_impact": 5, "reputation_impact": 2, "energy_cost": 10, "category": "crime", "skill_bonus": "negotiation"},
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
    streak_multiplier = min(2.0, 1 + (streak * 0.1))
    
    base_reward = round(random.uniform(100, 500), 2)
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
        "roubo_rapido": {"energy_cost": 5, "risk": 2, "reward_range": (20, 100), "heat": 3, "reputation": 1, "skill": "stealth"},
        "hustle_rua": {"energy_cost": 8, "risk": 3, "reward_range": (50, 200), "heat": 5, "reputation": 2, "skill": "negotiation"},
        "evento_aleatorio": {"energy_cost": 3, "risk": 1, "reward_range": (10, 500), "heat": 0, "reputation": 1, "skill": None},
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
    fee_reduction = negotiation_skill * 0.02
    
    fee_percentage = max(0.1, random.uniform(0.2, 0.4) - fee_reduction)
    clean_amount = amount * (1 - fee_percentage)
    
    catch_chance = player["heat_individual"] - (negotiation_skill * 2)
    if random.randint(1, 100) <= catch_chance:
        await db.players.update_one(
            {"id": current_user["id"]},
            {"$inc": {"dirty_money": -amount, "heat_individual": 20}}
        )
        await add_player_history(current_user["id"], "launder_failed", {"amount": amount})
        return {"success": False, "message": "Foste apanhado! Perdeste o dinheiro."}
    
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
        "message": f"Lavaste €{amount:.2f} e recebeste €{clean_amount:.2f} limpos.",
        "clean_amount": clean_amount,
        "fee": amount - clean_amount
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

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

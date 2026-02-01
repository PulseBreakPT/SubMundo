from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
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

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Settings
SECRET_KEY = os.environ.get('JWT_SECRET', 'submundo-secret-key-change-in-production')
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days

security = HTTPBearer()

app = FastAPI(title="SUBMUNDO API")
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ============= MODELS =============

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

class PlayerStats(BaseModel):
    id: str
    username: str
    email: str
    avatar: str = "default"
    clean_money: float = 1000.0
    dirty_money: float = 0.0
    reputation: int = 0
    reputation_max: int = 100
    heat_individual: int = 0
    heat_global: int = 0
    level: int = 1
    experience: int = 0
    experience_max: int = 100
    energy: int = 100
    energy_max: int = 100
    gang_id: Optional[str] = None
    main_neighborhood: str = "centro"
    created_at: datetime
    last_daily_reward: Optional[datetime] = None
    total_missions: int = 0
    successful_missions: int = 0
    failed_missions: int = 0
    total_earnings: float = 0.0
    times_arrested: int = 0

class MissionCreate(BaseModel):
    type: str
    neighborhood_id: str

class MissionResponse(BaseModel):
    id: str
    type: str
    name: str
    description: str
    neighborhood_id: str
    risk: int
    duration_seconds: int
    reward_min: float
    reward_max: float
    heat_impact: int
    reputation_impact: int
    energy_cost: int
    status: str
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    result: Optional[str] = None

class NeighborhoodResponse(BaseModel):
    id: str
    name: str
    description: str
    economic_value: int
    heat_level: int
    control_status: str
    controlling_gang: Optional[str] = None
    active_events: List[str] = []
    available_missions: int = 0

class GangCreate(BaseModel):
    name: str
    tag: str

class GangResponse(BaseModel):
    id: str
    name: str
    tag: str
    leader_id: str
    leader_name: str
    members_count: int
    treasury: float = 0.0
    reputation: int = 0
    territories: List[str] = []
    created_at: datetime

class QuickActionRequest(BaseModel):
    action_type: str
    neighborhood_id: Optional[str] = None

class QuickActionResponse(BaseModel):
    success: bool
    message: str
    reward: Optional[float] = None
    reward_type: Optional[str] = None
    heat_change: int = 0
    reputation_change: int = 0
    energy_cost: int = 0

class DailyRewardResponse(BaseModel):
    success: bool
    message: str
    reward_amount: float = 0.0
    next_reward_available: Optional[datetime] = None

class TransactionCreate(BaseModel):
    type: str
    amount: float
    money_type: str = "clean"

class TransactionResponse(BaseModel):
    id: str
    type: str
    amount: float
    money_type: str
    timestamp: datetime
    description: str

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

def calculate_mission_success(risk: int, player_level: int, heat: int) -> bool:
    base_chance = 70 - (risk * 5) + (player_level * 2) - (heat // 10)
    return random.randint(1, 100) <= max(10, min(95, base_chance))

def calculate_reward(reward_min: float, reward_max: float, success: bool) -> float:
    if not success:
        return 0
    return round(random.uniform(reward_min, reward_max), 2)

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

# ============= INIT DATA =============

async def init_neighborhoods():
    existing = await db.neighborhoods.count_documents({})
    if existing == 0:
        neighborhoods = [
            {"id": "centro", "name": "Centro", "description": "O coração financeiro da cidade. Muitos negócios legais e ilegais.", "economic_value": 80, "heat_level": 30, "control_status": "neutro", "controlling_gang": None, "active_events": []},
            {"id": "porto", "name": "Porto Industrial", "description": "Zona portuária com armazéns e contrabando.", "economic_value": 70, "heat_level": 20, "control_status": "neutro", "controlling_gang": None, "active_events": []},
            {"id": "favela", "name": "Favela Norte", "description": "Bairro pobre mas com muita atividade criminosa.", "economic_value": 40, "heat_level": 50, "control_status": "neutro", "controlling_gang": None, "active_events": []},
            {"id": "suburbio", "name": "Subúrbio Sul", "description": "Zona residencial tranquila com oportunidades ocultas.", "economic_value": 50, "heat_level": 10, "control_status": "neutro", "controlling_gang": None, "active_events": []},
            {"id": "comercial", "name": "Zona Comercial", "description": "Lojas, restaurantes e turistas desatentos.", "economic_value": 65, "heat_level": 25, "control_status": "neutro", "controlling_gang": None, "active_events": []},
            {"id": "noite", "name": "Distrito da Noite", "description": "Bares, clubes e negócios obscuros.", "economic_value": 75, "heat_level": 40, "control_status": "neutro", "controlling_gang": None, "active_events": []},
        ]
        await db.neighborhoods.insert_many(neighborhoods)
        logger.info("Bairros inicializados")

async def init_mission_templates():
    existing = await db.mission_templates.count_documents({})
    if existing == 0:
        templates = [
            {"type": "roubo_pequeno", "name": "Roubo de Carteira", "description": "Roubar a carteira de um transeunte distraído.", "risk": 2, "duration_seconds": 30, "reward_min": 50, "reward_max": 150, "heat_impact": 5, "reputation_impact": 1, "energy_cost": 10, "category": "crime"},
            {"type": "roubo_carro", "name": "Roubo de Carro", "description": "Roubar um veículo estacionado.", "risk": 4, "duration_seconds": 60, "reward_min": 200, "reward_max": 800, "heat_impact": 15, "reputation_impact": 3, "energy_cost": 20, "category": "crime"},
            {"type": "assalto_loja", "name": "Assalto a Loja", "description": "Assaltar uma loja comercial.", "risk": 6, "duration_seconds": 90, "reward_min": 500, "reward_max": 2000, "heat_impact": 25, "reputation_impact": 5, "energy_cost": 30, "category": "crime"},
            {"type": "contrabando", "name": "Entrega de Contrabando", "description": "Transportar mercadoria ilegal.", "risk": 5, "duration_seconds": 120, "reward_min": 300, "reward_max": 1000, "heat_impact": 10, "reputation_impact": 4, "energy_cost": 25, "category": "crime"},
            {"type": "emprego_legal", "name": "Trabalho Honesto", "description": "Fazer um trabalho temporário legal.", "risk": 0, "duration_seconds": 180, "reward_min": 100, "reward_max": 250, "heat_impact": -5, "reputation_impact": 0, "energy_cost": 20, "category": "legal"},
            {"type": "hacker", "name": "Hacking Bancário", "description": "Invadir sistemas de um banco local.", "risk": 7, "duration_seconds": 150, "reward_min": 800, "reward_max": 3000, "heat_impact": 20, "reputation_impact": 6, "energy_cost": 35, "category": "crime"},
            {"type": "cobranca", "name": "Cobrança de Dívidas", "description": "Cobrar dívidas para um agiota local.", "risk": 4, "duration_seconds": 60, "reward_min": 200, "reward_max": 600, "heat_impact": 8, "reputation_impact": 2, "energy_cost": 15, "category": "crime"},
            {"type": "vigilante", "name": "Vigilante Noturno", "description": "Vigiar um armazém à noite.", "risk": 1, "duration_seconds": 240, "reward_min": 150, "reward_max": 300, "heat_impact": -3, "reputation_impact": 1, "energy_cost": 15, "category": "legal"},
        ]
        await db.mission_templates.insert_many(templates)
        logger.info("Templates de missões inicializados")

# ============= AUTH ENDPOINTS =============

@api_router.post("/auth/register", response_model=TokenResponse)
async def register(user: UserCreate):
    existing = await db.players.find_one({"$or": [{"email": user.email}, {"username": user.username}]})
    if existing:
        raise HTTPException(status_code=400, detail="Email ou nome de utilizador já existe")
    
    player_id = str(uuid.uuid4())
    player = {
        "id": player_id,
        "email": user.email,
        "username": user.username,
        "password": hash_password(user.password),
        "avatar": "default",
        "clean_money": 1000.0,
        "dirty_money": 0.0,
        "reputation": 0,
        "reputation_max": 100,
        "heat_individual": 0,
        "heat_global": 0,
        "level": 1,
        "experience": 0,
        "experience_max": 100,
        "energy": 100,
        "energy_max": 100,
        "gang_id": None,
        "main_neighborhood": "centro",
        "created_at": datetime.now(timezone.utc),
        "last_daily_reward": None,
        "total_missions": 0,
        "successful_missions": 0,
        "failed_missions": 0,
        "total_earnings": 0.0,
        "times_arrested": 0
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
    
    token = create_access_token({"sub": player["id"]})
    return TokenResponse(access_token=token)

@api_router.get("/auth/me", response_model=PlayerStats)
async def get_me(current_user: dict = Depends(get_current_user)):
    return PlayerStats(**current_user)

# ============= PLAYER ENDPOINTS =============

@api_router.get("/player/stats", response_model=PlayerStats)
async def get_player_stats(current_user: dict = Depends(get_current_user)):
    # Update energy based on time passed
    player = await db.players.find_one({"id": current_user["id"]}, {"_id": 0, "password": 0})
    return PlayerStats(**player)

@api_router.post("/player/daily-reward", response_model=DailyRewardResponse)
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
            return DailyRewardResponse(
                success=False,
                message="Já reclamaste a recompensa diária. Volta amanhã!",
                next_reward_available=next_available
            )
    
    reward_amount = round(random.uniform(100, 500), 2)
    
    await db.players.update_one(
        {"id": current_user["id"]},
        {
            "$inc": {"clean_money": reward_amount, "total_earnings": reward_amount},
            "$set": {"last_daily_reward": now}
        }
    )
    
    await add_player_history(current_user["id"], "daily_reward", {"amount": reward_amount})
    
    next_available = now + timedelta(days=1)
    return DailyRewardResponse(
        success=True,
        message=f"Recebeste €{reward_amount:.2f} como recompensa diária!",
        reward_amount=reward_amount,
        next_reward_available=next_available
    )

@api_router.get("/player/history")
async def get_player_history(current_user: dict = Depends(get_current_user), limit: int = 20):
    history = await db.player_history.find(
        {"player_id": current_user["id"]},
        {"_id": 0}
    ).sort("timestamp", -1).limit(limit).to_list(limit)
    return {"history": history}

# ============= NEIGHBORHOODS ENDPOINTS =============

@api_router.get("/neighborhoods", response_model=List[NeighborhoodResponse])
async def get_neighborhoods(current_user: dict = Depends(get_current_user)):
    await init_neighborhoods()
    neighborhoods = await db.neighborhoods.find({}, {"_id": 0}).to_list(100)
    
    result = []
    for n in neighborhoods:
        missions_count = await db.mission_templates.count_documents({})
        n["available_missions"] = missions_count
        result.append(NeighborhoodResponse(**n))
    
    return result

@api_router.get("/neighborhoods/{neighborhood_id}", response_model=NeighborhoodResponse)
async def get_neighborhood(neighborhood_id: str, current_user: dict = Depends(get_current_user)):
    neighborhood = await db.neighborhoods.find_one({"id": neighborhood_id}, {"_id": 0})
    if not neighborhood:
        raise HTTPException(status_code=404, detail="Bairro não encontrado")
    
    missions_count = await db.mission_templates.count_documents({})
    neighborhood["available_missions"] = missions_count
    return NeighborhoodResponse(**neighborhood)

# ============= MISSIONS ENDPOINTS =============

@api_router.get("/missions/templates")
async def get_mission_templates(current_user: dict = Depends(get_current_user)):
    await init_mission_templates()
    templates = await db.mission_templates.find({}, {"_id": 0}).to_list(100)
    return {"templates": templates}

@api_router.get("/missions/active", response_model=List[MissionResponse])
async def get_active_missions(current_user: dict = Depends(get_current_user)):
    missions = await db.missions.find(
        {"player_id": current_user["id"], "status": "active"},
        {"_id": 0}
    ).to_list(10)
    return [MissionResponse(**m) for m in missions]

@api_router.post("/missions/start", response_model=MissionResponse)
async def start_mission(mission: MissionCreate, current_user: dict = Depends(get_current_user)):
    # Check for active missions
    active = await db.missions.find_one({"player_id": current_user["id"], "status": "active"})
    if active:
        raise HTTPException(status_code=400, detail="Já tens uma missão em andamento")
    
    # Get template
    template = await db.mission_templates.find_one({"type": mission.type})
    if not template:
        raise HTTPException(status_code=404, detail="Tipo de missão não encontrado")
    
    # Check energy
    player = await db.players.find_one({"id": current_user["id"]})
    if player["energy"] < template["energy_cost"]:
        raise HTTPException(status_code=400, detail="Energia insuficiente")
    
    # Deduct energy
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
        "risk": template["risk"],
        "duration_seconds": template["duration_seconds"],
        "reward_min": template["reward_min"],
        "reward_max": template["reward_max"],
        "heat_impact": template["heat_impact"],
        "reputation_impact": template["reputation_impact"],
        "energy_cost": template["energy_cost"],
        "status": "active",
        "started_at": datetime.now(timezone.utc),
        "completed_at": None,
        "result": None
    }
    
    await db.missions.insert_one(new_mission)
    return MissionResponse(**new_mission)

@api_router.post("/missions/{mission_id}/complete", response_model=MissionResponse)
async def complete_mission(mission_id: str, current_user: dict = Depends(get_current_user)):
    mission = await db.missions.find_one({"id": mission_id, "player_id": current_user["id"]})
    if not mission:
        raise HTTPException(status_code=404, detail="Missão não encontrada")
    
    if mission["status"] != "active":
        raise HTTPException(status_code=400, detail="Missão não está ativa")
    
    # Check if enough time has passed
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
    
    # Calculate success
    player = await db.players.find_one({"id": current_user["id"]})
    success = calculate_mission_success(mission["risk"], player["level"], player["heat_individual"])
    reward = calculate_reward(mission["reward_min"], mission["reward_max"], success)
    
    # Update mission
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
        # Determine money type based on mission category
        template = await db.mission_templates.find_one({"type": mission["type"]})
        if template and template.get("category") == "legal":
            update_fields["$inc"]["clean_money"] = reward
        else:
            update_fields["$inc"]["dirty_money"] = reward
        update_fields["$inc"]["total_earnings"] = reward
    else:
        # Failed mission - chance of arrest
        if random.randint(1, 100) <= player["heat_individual"]:
            update_fields["$inc"]["times_arrested"] = 1
            update_fields["$inc"]["clean_money"] = -min(player["clean_money"], 500)
    
    await db.players.update_one({"id": current_user["id"]}, update_fields)
    
    # Check for level up
    updated_player = await db.players.find_one({"id": current_user["id"]})
    if updated_player["experience"] >= updated_player["experience_max"]:
        new_level = updated_player["level"] + 1
        new_exp_max = updated_player["experience_max"] + 50
        await db.players.update_one(
            {"id": current_user["id"]},
            {"$set": {"level": new_level, "experience": 0, "experience_max": new_exp_max}}
        )
    
    # Add to history
    await add_player_history(current_user["id"], "mission_complete", {
        "mission_type": mission["type"],
        "result": result,
        "reward": reward if success else 0
    })
    
    updated_mission = await db.missions.find_one({"id": mission_id}, {"_id": 0})
    return MissionResponse(**updated_mission)

@api_router.get("/missions/history")
async def get_mission_history(current_user: dict = Depends(get_current_user), limit: int = 10):
    missions = await db.missions.find(
        {"player_id": current_user["id"], "status": "completed"},
        {"_id": 0}
    ).sort("completed_at", -1).limit(limit).to_list(limit)
    return {"missions": missions}

# ============= QUICK ACTIONS =============

@api_router.post("/actions/quick", response_model=QuickActionResponse)
async def quick_action(action: QuickActionRequest, current_user: dict = Depends(get_current_user)):
    player = await db.players.find_one({"id": current_user["id"]})
    
    actions_config = {
        "roubo_rapido": {"energy_cost": 5, "risk": 2, "reward_range": (20, 100), "heat": 3, "reputation": 1},
        "hustle_rua": {"energy_cost": 8, "risk": 3, "reward_range": (50, 200), "heat": 5, "reputation": 2},
        "evento_aleatorio": {"energy_cost": 3, "risk": 1, "reward_range": (10, 500), "heat": 0, "reputation": 1},
    }
    
    if action.action_type not in actions_config:
        raise HTTPException(status_code=400, detail="Ação inválida")
    
    config = actions_config[action.action_type]
    
    if player["energy"] < config["energy_cost"]:
        raise HTTPException(status_code=400, detail="Energia insuficiente")
    
    # Calculate success
    success = calculate_mission_success(config["risk"], player["level"], player["heat_individual"])
    
    if success:
        reward = round(random.uniform(*config["reward_range"]), 2)
        message = f"Sucesso! Ganhaste €{reward:.2f}"
        reward_type = "dirty_money"
        heat_change = config["heat"]
        rep_change = config["reputation"]
    else:
        reward = 0
        message = "Falhou! Tenta novamente mais tarde."
        reward_type = None
        heat_change = config["heat"] * 2
        rep_change = 0
    
    # Update player
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
    
    return QuickActionResponse(
        success=success,
        message=message,
        reward=reward if success else None,
        reward_type=reward_type,
        heat_change=heat_change,
        reputation_change=rep_change,
        energy_cost=config["energy_cost"]
    )

# ============= GANGS =============

@api_router.get("/gangs", response_model=List[GangResponse])
async def get_gangs(current_user: dict = Depends(get_current_user)):
    gangs = await db.gangs.find({}, {"_id": 0}).to_list(100)
    result = []
    for g in gangs:
        members_count = await db.players.count_documents({"gang_id": g["id"]})
        g["members_count"] = members_count
        result.append(GangResponse(**g))
    return result

@api_router.post("/gangs/create", response_model=GangResponse)
async def create_gang(gang: GangCreate, current_user: dict = Depends(get_current_user)):
    # Check if player already in a gang
    if current_user.get("gang_id"):
        raise HTTPException(status_code=400, detail="Já pertences a uma gangue")
    
    # Check if name or tag exists
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
        "members_count": 1,
        "treasury": 0.0,
        "reputation": 0,
        "territories": [],
        "created_at": datetime.now(timezone.utc)
    }
    
    await db.gangs.insert_one(new_gang)
    await db.players.update_one({"id": current_user["id"]}, {"$set": {"gang_id": gang_id}})
    
    await add_player_history(current_user["id"], "gang_created", {"gang_name": gang.name})
    
    return GangResponse(**new_gang)

@api_router.post("/gangs/{gang_id}/join")
async def join_gang(gang_id: str, current_user: dict = Depends(get_current_user)):
    if current_user.get("gang_id"):
        raise HTTPException(status_code=400, detail="Já pertences a uma gangue")
    
    gang = await db.gangs.find_one({"id": gang_id})
    if not gang:
        raise HTTPException(status_code=404, detail="Gangue não encontrada")
    
    await db.players.update_one({"id": current_user["id"]}, {"$set": {"gang_id": gang_id}})
    
    await add_player_history(current_user["id"], "gang_joined", {"gang_name": gang["name"]})
    
    return {"success": True, "message": f"Juntaste-te à {gang['name']}!"}

@api_router.post("/gangs/leave")
async def leave_gang(current_user: dict = Depends(get_current_user)):
    if not current_user.get("gang_id"):
        raise HTTPException(status_code=400, detail="Não pertences a nenhuma gangue")
    
    gang = await db.gangs.find_one({"id": current_user["gang_id"]})
    
    # Check if leader
    if gang and gang["leader_id"] == current_user["id"]:
        # Find new leader or delete gang
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

# ============= ECONOMY =============

class LaunderRequest(BaseModel):
    amount: float

@api_router.post("/economy/launder")
async def launder_money(request: LaunderRequest, current_user: dict = Depends(get_current_user)):
    amount = request.amount
    player = await db.players.find_one({"id": current_user["id"]})
    
    if amount <= 0:
        raise HTTPException(status_code=400, detail="Montante inválido")
    
    if player["dirty_money"] < amount:
        raise HTTPException(status_code=400, detail="Dinheiro sujo insuficiente")
    
    # Laundering has a fee (20-40%) and risk
    fee_percentage = random.uniform(0.2, 0.4)
    clean_amount = amount * (1 - fee_percentage)
    
    # Risk of being caught
    if random.randint(1, 100) <= player["heat_individual"]:
        # Caught! Lose money and increase heat
        await db.players.update_one(
            {"id": current_user["id"]},
            {"$inc": {"dirty_money": -amount, "heat_individual": 20}}
        )
        await add_player_history(current_user["id"], "launder_failed", {"amount": amount})
        return {"success": False, "message": "Foste apanhado! Perdeste o dinheiro."}
    
    await db.players.update_one(
        {"id": current_user["id"]},
        {"$inc": {"dirty_money": -amount, "clean_money": clean_amount}}
    )
    
    await add_player_history(current_user["id"], "launder_success", {
        "dirty_amount": amount,
        "clean_amount": clean_amount
    })
    
    return {
        "success": True,
        "message": f"Lavaste €{amount:.2f} e recebeste €{clean_amount:.2f} limpos.",
        "clean_amount": clean_amount,
        "fee": amount - clean_amount
    }

@api_router.get("/economy/transactions")
async def get_transactions(current_user: dict = Depends(get_current_user), limit: int = 20):
    transactions = await db.transactions.find(
        {"player_id": current_user["id"]},
        {"_id": 0}
    ).sort("timestamp", -1).limit(limit).to_list(limit)
    return {"transactions": transactions}

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
            "gang_id": p.get("gang_id")
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
            "territories": len(g.get("territories", []))
        })
    
    return {"rankings": rankings}

# ============= VEHICLES SYSTEM =============

VEHICLE_CATALOG = [
    {"id": "bicicleta", "name": "Bicicleta", "description": "Transporte básico e silencioso.", "price": 500, "speed": 2, "stealth": 8, "capacity": 1, "maintenance_cost": 10, "category": "basic"},
    {"id": "scooter", "name": "Scooter", "description": "Mobilidade urbana económica.", "price": 2000, "speed": 4, "stealth": 6, "capacity": 1, "maintenance_cost": 50, "category": "basic"},
    {"id": "carro_usado", "name": "Carro Usado", "description": "Veículo discreto para o dia-a-dia.", "price": 5000, "speed": 5, "stealth": 5, "capacity": 4, "maintenance_cost": 100, "category": "standard"},
    {"id": "mota_desportiva", "name": "Mota Desportiva", "description": "Rápida e perfeita para fugas.", "price": 15000, "speed": 9, "stealth": 4, "capacity": 1, "maintenance_cost": 200, "category": "sport"},
    {"id": "sedan_luxo", "name": "Sedan de Luxo", "description": "Conforto e estilo para negócios.", "price": 30000, "speed": 7, "stealth": 3, "capacity": 4, "maintenance_cost": 400, "category": "luxury"},
    {"id": "suv_blindado", "name": "SUV Blindado", "description": "Proteção máxima para situações perigosas.", "price": 50000, "speed": 5, "stealth": 2, "capacity": 6, "maintenance_cost": 600, "category": "armored"},
    {"id": "carrinha_carga", "name": "Carrinha de Carga", "description": "Ideal para transportar mercadoria.", "price": 20000, "speed": 4, "stealth": 5, "capacity": 20, "maintenance_cost": 300, "category": "utility"},
    {"id": "desportivo", "name": "Desportivo Exótico", "description": "O sonho de qualquer criminoso.", "price": 100000, "speed": 10, "stealth": 1, "capacity": 2, "maintenance_cost": 1000, "category": "exotic"},
]

@api_router.get("/vehicles/catalog")
async def get_vehicle_catalog(current_user: dict = Depends(get_current_user)):
    """Get all available vehicles to buy"""
    return {"vehicles": VEHICLE_CATALOG}

@api_router.get("/vehicles/my")
async def get_my_vehicles(current_user: dict = Depends(get_current_user)):
    """Get player's owned vehicles"""
    vehicles = await db.player_vehicles.find(
        {"player_id": current_user["id"]},
        {"_id": 0}
    ).to_list(50)
    return {"vehicles": vehicles}

@api_router.post("/vehicles/buy/{vehicle_id}")
async def buy_vehicle(vehicle_id: str, current_user: dict = Depends(get_current_user)):
    """Buy a vehicle"""
    # Find vehicle in catalog
    vehicle_template = next((v for v in VEHICLE_CATALOG if v["id"] == vehicle_id), None)
    if not vehicle_template:
        raise HTTPException(status_code=404, detail="Veículo não encontrado")
    
    player = await db.players.find_one({"id": current_user["id"]})
    
    # Check money
    if player["clean_money"] < vehicle_template["price"]:
        raise HTTPException(status_code=400, detail="Dinheiro limpo insuficiente")
    
    # Check if already owns this vehicle
    existing = await db.player_vehicles.find_one({
        "player_id": current_user["id"],
        "vehicle_id": vehicle_id
    })
    if existing:
        raise HTTPException(status_code=400, detail="Já tens este veículo")
    
    # Deduct money
    await db.players.update_one(
        {"id": current_user["id"]},
        {"$inc": {"clean_money": -vehicle_template["price"]}}
    )
    
    # Add vehicle
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
        "purchased_at": datetime.now(timezone.utc)
    }
    
    await db.player_vehicles.insert_one(new_vehicle)
    
    await add_player_history(current_user["id"], "vehicle_purchased", {
        "vehicle": vehicle_template["name"],
        "price": vehicle_template["price"]
    })
    
    # Convert datetime for JSON response
    new_vehicle["purchased_at"] = new_vehicle["purchased_at"].isoformat()
    
    return {"success": True, "message": f"Compraste {vehicle_template['name']}!", "vehicle": new_vehicle}

@api_router.post("/vehicles/{vehicle_instance_id}/activate")
async def activate_vehicle(vehicle_instance_id: str, current_user: dict = Depends(get_current_user)):
    """Set a vehicle as active"""
    vehicle = await db.player_vehicles.find_one({
        "id": vehicle_instance_id,
        "player_id": current_user["id"]
    })
    
    if not vehicle:
        raise HTTPException(status_code=404, detail="Veículo não encontrado")
    
    # Deactivate all vehicles
    await db.player_vehicles.update_many(
        {"player_id": current_user["id"]},
        {"$set": {"is_active": False}}
    )
    
    # Activate this one
    await db.player_vehicles.update_one(
        {"id": vehicle_instance_id},
        {"$set": {"is_active": True}}
    )
    
    return {"success": True, "message": f"{vehicle['name']} está agora ativo!"}

@api_router.post("/vehicles/{vehicle_instance_id}/repair")
async def repair_vehicle(vehicle_instance_id: str, current_user: dict = Depends(get_current_user)):
    """Repair a vehicle"""
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
        {"$inc": {"clean_money": -repair_cost}}
    )
    
    await db.player_vehicles.update_one(
        {"id": vehicle_instance_id},
        {"$set": {"condition": 100}}
    )
    
    return {"success": True, "message": f"Veículo reparado por €{repair_cost}!", "cost": repair_cost}

@api_router.post("/vehicles/{vehicle_instance_id}/sell")
async def sell_vehicle(vehicle_instance_id: str, current_user: dict = Depends(get_current_user)):
    """Sell a vehicle"""
    vehicle = await db.player_vehicles.find_one({
        "id": vehicle_instance_id,
        "player_id": current_user["id"]
    })
    
    if not vehicle:
        raise HTTPException(status_code=404, detail="Veículo não encontrado")
    
    # Find original price
    vehicle_template = next((v for v in VEHICLE_CATALOG if v["id"] == vehicle["vehicle_id"]), None)
    if not vehicle_template:
        raise HTTPException(status_code=500, detail="Erro ao encontrar dados do veículo")
    
    # Sell for 50% of original price * condition
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

# ============= GANG WARS SYSTEM =============

@api_router.get("/wars/active")
async def get_active_wars(current_user: dict = Depends(get_current_user)):
    """Get all active gang wars"""
    wars = await db.gang_wars.find(
        {"status": "active"},
        {"_id": 0}
    ).to_list(50)
    return {"wars": wars}

@api_router.get("/wars/my")
async def get_my_gang_wars(current_user: dict = Depends(get_current_user)):
    """Get wars involving player's gang"""
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
    """Start a war to capture a neighborhood"""
    if not current_user.get("gang_id"):
        raise HTTPException(status_code=400, detail="Precisas de pertencer a uma gangue")
    
    # Check if leader
    gang = await db.gangs.find_one({"id": current_user["gang_id"]})
    if not gang:
        raise HTTPException(status_code=404, detail="Gangue não encontrada")
    
    if gang["leader_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Apenas o líder pode iniciar guerras")
    
    # Check neighborhood
    neighborhood = await db.neighborhoods.find_one({"id": neighborhood_id})
    if not neighborhood:
        raise HTTPException(status_code=404, detail="Bairro não encontrado")
    
    # Check if already owned
    if neighborhood.get("controlling_gang") == current_user["gang_id"]:
        raise HTTPException(status_code=400, detail="Já controlas este território")
    
    # Check for existing war
    existing_war = await db.gang_wars.find_one({
        "neighborhood_id": neighborhood_id,
        "status": "active"
    })
    if existing_war:
        raise HTTPException(status_code=400, detail="Já existe uma guerra por este território")
    
    # War cost based on neighborhood value
    war_cost = neighborhood["economic_value"] * 100
    
    if gang["treasury"] < war_cost:
        raise HTTPException(status_code=400, detail=f"Cofre da gangue insuficiente. Precisa: €{war_cost}")
    
    # Deduct from treasury
    await db.gangs.update_one(
        {"id": current_user["gang_id"]},
        {"$inc": {"treasury": -war_cost}}
    )
    
    # Get defender gang info
    defender_gang = None
    defender_gang_name = "Neutro"
    if neighborhood.get("controlling_gang"):
        defender_gang = await db.gangs.find_one({"id": neighborhood["controlling_gang"]})
        if defender_gang:
            defender_gang_name = defender_gang["name"]
    
    # Create war
    war_id = str(uuid.uuid4())
    war_duration = 300  # 5 minutes
    
    # Calculate power (members * avg reputation)
    attacker_members = await db.players.find({"gang_id": current_user["gang_id"]}).to_list(100)
    attacker_power = len(attacker_members) * (sum(m.get("reputation", 0) for m in attacker_members) / max(len(attacker_members), 1) + 10)
    
    defender_power = 50  # Base neutral defense
    if defender_gang:
        defender_members = await db.players.find({"gang_id": defender_gang["id"]}).to_list(100)
        defender_power = len(defender_members) * (sum(m.get("reputation", 0) for m in defender_members) / max(len(defender_members), 1) + 10)
    
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
        "started_at": datetime.now(timezone.utc),
        "ends_at": datetime.now(timezone.utc) + timedelta(seconds=war_duration),
        "result": None
    }
    
    await db.gang_wars.insert_one(new_war)
    
    # Increase neighborhood heat
    await db.neighborhoods.update_one(
        {"id": neighborhood_id},
        {"$inc": {"heat_level": 20}}
    )
    
    await add_player_history(current_user["id"], "war_started", {
        "neighborhood": neighborhood["name"],
        "cost": war_cost
    })
    
    # Convert datetime for JSON response
    new_war["started_at"] = new_war["started_at"].isoformat()
    new_war["ends_at"] = new_war["ends_at"].isoformat()
    
    return {
        "success": True,
        "message": f"Guerra iniciada por {neighborhood['name']}!",
        "war": new_war
    }

@api_router.post("/wars/{war_id}/resolve")
async def resolve_war(war_id: str, current_user: dict = Depends(get_current_user)):
    """Resolve a war after time has passed"""
    war = await db.gang_wars.find_one({"id": war_id})
    if not war:
        raise HTTPException(status_code=404, detail="Guerra não encontrada")
    
    if war["status"] != "active":
        raise HTTPException(status_code=400, detail="Guerra já foi resolvida")
    
    # Check if time has passed
    ends_at = war["ends_at"]
    if isinstance(ends_at, str):
        ends_at = datetime.fromisoformat(ends_at.replace('Z', '+00:00'))
    elif ends_at.tzinfo is None:
        ends_at = ends_at.replace(tzinfo=timezone.utc)
    
    now = datetime.now(timezone.utc)
    if now < ends_at:
        remaining = (ends_at - now).total_seconds()
        raise HTTPException(status_code=400, detail=f"Guerra ainda em progresso. Faltam {int(remaining)} segundos.")
    
    # Calculate result
    attacker_roll = random.randint(1, 100) + war["attacker_power"]
    defender_roll = random.randint(1, 100) + war["defender_power"]
    
    attacker_wins = attacker_roll > defender_roll
    
    if attacker_wins:
        # Attacker wins - transfer territory
        await db.neighborhoods.update_one(
            {"id": war["neighborhood_id"]},
            {
                "$set": {
                    "controlling_gang": war["attacker_gang_id"],
                    "control_status": "controlado"
                }
            }
        )
        
        # Update gang territories
        await db.gangs.update_one(
            {"id": war["attacker_gang_id"]},
            {
                "$addToSet": {"territories": war["neighborhood_id"]},
                "$inc": {"reputation": 50}
            }
        )
        
        # Remove from defender
        if war["defender_gang_id"]:
            await db.gangs.update_one(
                {"id": war["defender_gang_id"]},
                {
                    "$pull": {"territories": war["neighborhood_id"]},
                    "$inc": {"reputation": -25}
                }
            )
        
        result = "attacker_victory"
        message = f"{war['attacker_gang_name']} conquistou {war['neighborhood_name']}!"
    else:
        # Defender wins
        if war["defender_gang_id"]:
            await db.gangs.update_one(
                {"id": war["defender_gang_id"]},
                {"$inc": {"reputation": 25}}
            )
        
        await db.gangs.update_one(
            {"id": war["attacker_gang_id"]},
            {"$inc": {"reputation": -10}}
        )
        
        result = "defender_victory"
        message = f"{war['defender_gang_name']} defendeu {war['neighborhood_name']}!"
    
    # Update war record
    await db.gang_wars.update_one(
        {"id": war_id},
        {"$set": {"status": "completed", "result": result}}
    )
    
    return {"success": True, "message": message, "result": result}

@api_router.post("/gangs/treasury/deposit")
async def deposit_to_treasury(amount: float, current_user: dict = Depends(get_current_user)):
    """Deposit money to gang treasury"""
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
        {"$inc": {"treasury": amount}}
    )
    
    await add_player_history(current_user["id"], "treasury_deposit", {"amount": amount})
    
    return {"success": True, "message": f"Depositaste €{amount:.2f} no cofre da gangue!"}

# ============= CITY EVENTS SYSTEM =============

EVENT_TEMPLATES = [
    {
        "id": "police_crackdown",
        "name": "Operação Policial",
        "description": "A polícia está em força nas ruas. Cuidado redobrado!",
        "duration_minutes": 30,
        "effects": {"heat_multiplier": 2.0, "reward_multiplier": 0.8, "risk_modifier": 2},
        "icon": "shield-alert"
    },
    {
        "id": "festival",
        "name": "Festival da Cidade",
        "description": "Multidões distraídas, oportunidades abundantes!",
        "duration_minutes": 60,
        "effects": {"heat_multiplier": 0.7, "reward_multiplier": 1.5, "risk_modifier": -1},
        "icon": "party-popper"
    },
    {
        "id": "blackout",
        "name": "Apagão Geral",
        "description": "A cidade está às escuras. Caos total!",
        "duration_minutes": 20,
        "effects": {"heat_multiplier": 0.5, "reward_multiplier": 2.0, "risk_modifier": 0},
        "icon": "zap-off"
    },
    {
        "id": "gang_truce",
        "name": "Trégua entre Gangues",
        "description": "As gangues declararam paz temporária.",
        "duration_minutes": 45,
        "effects": {"heat_multiplier": 0.8, "reward_multiplier": 1.0, "risk_modifier": -2, "wars_disabled": True},
        "icon": "handshake"
    },
    {
        "id": "economic_boom",
        "name": "Boom Económico",
        "description": "Dinheiro a circular! Negócios em alta!",
        "duration_minutes": 40,
        "effects": {"heat_multiplier": 1.0, "reward_multiplier": 1.8, "risk_modifier": 0},
        "icon": "trending-up"
    },
    {
        "id": "heat_wave",
        "name": "Onda de Calor",
        "description": "Calor extremo. Menos polícia nas ruas.",
        "duration_minutes": 50,
        "effects": {"heat_multiplier": 0.6, "reward_multiplier": 1.0, "risk_modifier": -1},
        "icon": "thermometer"
    },
    {
        "id": "vip_visit",
        "name": "Visita VIP",
        "description": "Uma celebridade na cidade. Segurança reforçada!",
        "duration_minutes": 25,
        "effects": {"heat_multiplier": 1.5, "reward_multiplier": 2.0, "risk_modifier": 3},
        "icon": "star"
    },
    {
        "id": "underground_market",
        "name": "Mercado Negro Especial",
        "description": "Vendedores clandestinos com ofertas únicas!",
        "duration_minutes": 35,
        "effects": {"heat_multiplier": 1.2, "reward_multiplier": 1.5, "risk_modifier": 1},
        "icon": "shopping-bag"
    },
]

@api_router.get("/events/active")
async def get_active_events(current_user: dict = Depends(get_current_user)):
    """Get all active city events"""
    now = datetime.now(timezone.utc)
    
    # Clean up expired events
    await db.city_events.delete_many({
        "ends_at": {"$lt": now}
    })
    
    events = await db.city_events.find(
        {"status": "active"},
        {"_id": 0}
    ).to_list(20)
    
    return {"events": events}

@api_router.post("/events/trigger")
async def trigger_random_event(current_user: dict = Depends(get_current_user)):
    """Trigger a random city event (admin/testing)"""
    # Check for existing active events (max 2)
    active_count = await db.city_events.count_documents({"status": "active"})
    if active_count >= 2:
        raise HTTPException(status_code=400, detail="Já existem eventos ativos suficientes")
    
    # Pick random event
    template = random.choice(EVENT_TEMPLATES)
    
    # Check if this event type is already active
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
    
    return {"success": True, "message": f"Evento '{template['name']}' iniciado!", "event": event}

@api_router.get("/events/effects")
async def get_current_effects(current_user: dict = Depends(get_current_user)):
    """Get combined effects of all active events"""
    events = await db.city_events.find(
        {"status": "active"},
        {"_id": 0}
    ).to_list(10)
    
    # Combine effects
    combined = {
        "heat_multiplier": 1.0,
        "reward_multiplier": 1.0,
        "risk_modifier": 0,
        "wars_disabled": False,
        "active_events": []
    }
    
    for event in events:
        effects = event.get("effects", {})
        combined["heat_multiplier"] *= effects.get("heat_multiplier", 1.0)
        combined["reward_multiplier"] *= effects.get("reward_multiplier", 1.0)
        combined["risk_modifier"] += effects.get("risk_modifier", 0)
        if effects.get("wars_disabled"):
            combined["wars_disabled"] = True
        combined["active_events"].append({
            "name": event["name"],
            "icon": event["icon"],
            "ends_at": event["ends_at"]
        })
    
    return combined

# Update game state to include new features
@api_router.get("/game/full-state")
async def get_full_game_state(current_user: dict = Depends(get_current_user)):
    """Get complete game state including new features"""
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
    
    events = await db.city_events.find(
        {"status": "active"},
        {"_id": 0}
    ).to_list(10)
    
    neighborhoods = await db.neighborhoods.find({}, {"_id": 0}).to_list(100)
    global_heat = sum(n.get("heat_level", 0) for n in neighborhoods) // max(len(neighborhoods), 1)
    
    return {
        "player": player,
        "active_mission": active_mission,
        "gang": gang,
        "gang_wars": gang_wars,
        "vehicles": vehicles,
        "active_vehicle": active_vehicle,
        "active_events": events,
        "global_heat": global_heat,
        "server_time": datetime.now(timezone.utc).isoformat()
    }

# ============= STARTUP =============

@app.on_event("startup")
async def startup_event():
    await init_neighborhoods()
    await init_mission_templates()
    logger.info("SUBMUNDO API iniciada")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

# Include router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

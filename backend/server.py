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

@api_router.post("/economy/launder")
async def launder_money(amount: float, current_user: dict = Depends(get_current_user)):
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

# ============= GAME STATE =============

@api_router.get("/game/state")
async def get_game_state(current_user: dict = Depends(get_current_user)):
    """Get full game state for polling"""
    player = await db.players.find_one({"id": current_user["id"]}, {"_id": 0, "password": 0})
    active_mission = await db.missions.find_one(
        {"player_id": current_user["id"], "status": "active"},
        {"_id": 0}
    )
    
    # Get player's gang
    gang = None
    if player.get("gang_id"):
        gang = await db.gangs.find_one({"id": player["gang_id"]}, {"_id": 0})
    
    # Get global heat (average of all neighborhoods)
    neighborhoods = await db.neighborhoods.find({}, {"_id": 0}).to_list(100)
    global_heat = sum(n.get("heat_level", 0) for n in neighborhoods) // max(len(neighborhoods), 1)
    
    return {
        "player": player,
        "active_mission": active_mission,
        "gang": gang,
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

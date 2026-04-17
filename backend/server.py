from dotenv import load_dotenv
load_dotenv()

import os
import logging
import random
import bcrypt
import jwt
from datetime import datetime, timezone, timedelta
from typing import Optional, List
from pathlib import Path

from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Depends
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, EmailStr, Field
from bson import ObjectId

from game_data import (
    CLASSES, ENEMIES, MISSIONS, ITEMS, STARTER_INVENTORY,
    ABILITIES, STATUS, WEAKNESS, ELEMENT_COLOR, ELEMENT_SIGIL,
    TALENTS, get_talent,
    roll_equipment, generate_lore_fragment,
    xp_for_level, get_class, get_enemy, get_mission,
    ZONES, get_zone, QUESTS, get_quest, get_dialog,
    CRAFTING_RECIPES, get_recipe, MATERIALS, MARKET_GOODS,
    FACTIONS, rank_for, DAILY_TASKS, ACHIEVEMENTS,
)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

JWT_ALGORITHM = "HS256"
JWT_SECRET = os.environ["JWT_SECRET"]
ACCESS_EXPIRE_MIN = 60 * 24
REFRESH_EXPIRE_DAYS = 30
FAILED_ATTEMPT_LIMIT = 5
LOCKOUT_MINUTES = 15

app = FastAPI(title="AETHER//EXILE API")
api = APIRouter(prefix="/api")


# ============== AUTH HELPERS ==============
def hash_password(pw: str) -> str:
    return bcrypt.hashpw(pw.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

def verify_password(pw: str, hashed: str) -> bool:
    try: return bcrypt.checkpw(pw.encode("utf-8"), hashed.encode("utf-8"))
    except Exception: return False

def create_access_token(user_id: str, email: str) -> str:
    payload = {"sub": user_id, "email": email, "type": "access",
               "exp": datetime.now(timezone.utc) + timedelta(minutes=ACCESS_EXPIRE_MIN)}
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def create_refresh_token(user_id: str) -> str:
    payload = {"sub": user_id, "type": "refresh",
               "exp": datetime.now(timezone.utc) + timedelta(days=REFRESH_EXPIRE_DAYS)}
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def set_auth_cookies(response: Response, access: str, refresh: str):
    response.set_cookie("access_token", access, httponly=True, secure=True, samesite="none", max_age=ACCESS_EXPIRE_MIN*60, path="/")
    response.set_cookie("refresh_token", refresh, httponly=True, secure=True, samesite="none", max_age=REFRESH_EXPIRE_DAYS*86400, path="/")

def clear_auth_cookies(response: Response):
    response.delete_cookie("access_token", path="/")
    response.delete_cookie("refresh_token", path="/")

async def get_current_user(request: Request) -> dict:
    token = request.cookies.get("access_token")
    if not token:
        auth = request.headers.get("Authorization", "")
        if auth.startswith("Bearer "): token = auth[7:]
    if not token: raise HTTPException(status_code=401, detail="Não autenticado")
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "access": raise HTTPException(status_code=401, detail="Tipo de token inválido")
        user = await db.users.find_one({"_id": ObjectId(payload["sub"])})
        if not user: raise HTTPException(status_code=401, detail="Utilizador não encontrado")
        user["id"] = str(user["_id"]); user.pop("_id", None); user.pop("password_hash", None)
        return user
    except jwt.ExpiredSignatureError: raise HTTPException(status_code=401, detail="Token expirado")
    except jwt.InvalidTokenError: raise HTTPException(status_code=401, detail="Token inválido")


# ============== MODELS ==============
class RegisterIn(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)
    callsign: str = Field(min_length=2, max_length=24)

class LoginIn(BaseModel):
    email: EmailStr
    password: str

class CharacterCreateIn(BaseModel):
    class_id: str

class CombatActionIn(BaseModel):
    action: str
    skill_id: Optional[str] = None
    item_id: Optional[str] = None

class MissionStartIn(BaseModel):
    mission_id: str

class TalentAllocateIn(BaseModel):
    talent_id: str

class EquipIn(BaseModel):
    item_id: str

class UnequipIn(BaseModel):
    slot: str


# ============== AUTH ROUTES ==============
@api.post("/auth/register")
async def register(body: RegisterIn, response: Response):
    email = body.email.lower().strip()
    if await db.users.find_one({"email": email}):
        raise HTTPException(status_code=400, detail="Email já registado")
    doc = {"email": email, "password_hash": hash_password(body.password), "callsign": body.callsign.strip(),
           "role": "player", "created_at": datetime.now(timezone.utc).isoformat()}
    res = await db.users.insert_one(doc)
    uid = str(res.inserted_id)
    set_auth_cookies(response, create_access_token(uid, email), create_refresh_token(uid))
    return {"id": uid, "email": email, "callsign": body.callsign, "role": "player", "has_character": False}

@api.post("/auth/login")
async def login(body: LoginIn, request: Request, response: Response):
    email = body.email.lower().strip()
    ip = request.client.host if request.client else "unknown"
    key = f"{ip}:{email}"
    lock = await db.login_attempts.find_one({"identifier": key})
    if lock and lock.get("locked_until"):
        locked_until = datetime.fromisoformat(lock["locked_until"])
        if locked_until > datetime.now(timezone.utc):
            raise HTTPException(status_code=429, detail="Demasiadas tentativas. Tenta novamente mais tarde.")
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(body.password, user["password_hash"]):
        attempts = (lock.get("count", 0) if lock else 0) + 1
        update = {"identifier": key, "count": attempts, "last_attempt": datetime.now(timezone.utc).isoformat()}
        if attempts >= FAILED_ATTEMPT_LIMIT:
            update["locked_until"] = (datetime.now(timezone.utc) + timedelta(minutes=LOCKOUT_MINUTES)).isoformat()
        await db.login_attempts.update_one({"identifier": key}, {"$set": update}, upsert=True)
        raise HTTPException(status_code=401, detail="Credenciais inválidas")
    await db.login_attempts.delete_one({"identifier": key})
    uid = str(user["_id"])
    set_auth_cookies(response, create_access_token(uid, email), create_refresh_token(uid))
    char = await db.characters.find_one({"user_id": uid}, {"_id": 0})
    return {"id": uid, "email": email, "callsign": user.get("callsign"), "role": user.get("role", "player"), "has_character": char is not None}

@api.post("/auth/logout")
async def logout(response: Response):
    clear_auth_cookies(response)
    return {"ok": True}

@api.get("/auth/me")
async def me(user: dict = Depends(get_current_user)):
    char = await db.characters.find_one({"user_id": user["id"]}, {"_id": 0})
    return {"id": user["id"], "email": user["email"], "callsign": user.get("callsign"),
            "role": user.get("role", "player"), "has_character": char is not None}


# ============== CHARACTER ==============
def build_character(user_id: str, callsign: str, class_id: str) -> dict:
    cls = get_class(class_id)
    if not cls: raise HTTPException(status_code=400, detail="Classe desconhecida")
    return {
        "user_id": user_id, "callsign": callsign, "class_id": class_id,
        "level": 1, "xp": 0, "xp_next": xp_for_level(1),
        "credits": 50,
        "hp": cls["base_hp"], "max_hp": cls["base_hp"],
        "energy": cls["base_energy"], "max_energy": cls["base_energy"],
        "attack": cls["base_attack"], "defense": cls["base_defense"],
        "inventory": list(STARTER_INVENTORY),
        "completed_missions": [],
        "talent_points": 1,
        "talents_owned": [],
        "equipped": {"weapon": None, "armor": None, "relic": None},
        "equipment_stash": [],
        "lore_unlocked": 3,
        # Phase 1 expansion fields
        "stamina": 100, "max_stamina": 100,
        "materials": {},  # material_id -> qty
        "faction_rep": {"directorate": 0, "exiles": 0, "gold_line": 0, "reavers": 0},
        "daily_progress": {},  # dl_combat -> count
        "daily_date": "",
        "daily_claimed": [],
        "quests_active": [],
        "quests_completed": [],
        "quest_dialog": {},  # quest_id -> current dialog id
        "arena_best_wave": 0,
        "zone_events_completed": 0,
        "crafts_done": 0,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }


def recompute_effective(char: dict) -> dict:
    """Recompute derived stats from base + talents + equipped gear. Keeps HP/energy ratio."""
    cls = get_class(char["class_id"])
    # Base (level scaling already baked into max_hp/max_energy/attack/defense via apply_level_ups)
    base_max_hp = cls["base_hp"] + (char["level"] - 1) * (20 + cls["base_hp"] // 20)
    base_max_en = cls["base_energy"] + (char["level"] - 1) * (10 + cls["base_energy"] // 20)
    base_atk    = cls["base_attack"]  + (char["level"] - 1) * 3
    base_def    = cls["base_defense"] + (char["level"] - 1) * 2

    bonus = {"max_hp": 0, "max_energy": 0, "attack": 0, "defense": 0,
             "crit_pct": 0, "reflect_pct": 0, "energy_regen": 0,
             "element_dmg_pct": 0, "lifesteal_pct": 0, "wounded_dmg_pct": 0,
             "heal_bonus_pct": 0, "bleed_bonus": 0}

    for tid in char.get("talents_owned", []):
        t = get_talent(tid)
        if not t: continue
        for k, v in t["effect"].items():
            bonus[k] = bonus.get(k, 0) + v

    equipped = char.get("equipped", {})
    for slot, item_id in equipped.items():
        if not item_id: continue
        eq = next((e for e in char.get("equipment_stash", []) if e["item_id"] == item_id), None)
        if not eq: continue
        for k, v in eq.get("stats", {}).items():
            bonus[k] = bonus.get(k, 0) + v

    old_max_hp = char.get("max_hp", base_max_hp)
    old_max_en = char.get("max_energy", base_max_en)

    new_max_hp = base_max_hp + bonus["max_hp"]
    new_max_en = base_max_en + bonus["max_energy"]

    # Preserve HP/energy ratios on recompute
    hp_ratio = char.get("hp", old_max_hp) / old_max_hp if old_max_hp > 0 else 1
    en_ratio = char.get("energy", old_max_en) / old_max_en if old_max_en > 0 else 1

    char["max_hp"]     = new_max_hp
    char["max_energy"] = new_max_en
    char["hp"]         = max(1, min(new_max_hp, int(new_max_hp * hp_ratio)))
    char["energy"]     = max(0, min(new_max_en, int(new_max_en * en_ratio)))
    char["attack"]     = base_atk + bonus["attack"]
    char["defense"]    = base_def + bonus["defense"]
    char["bonus"]      = bonus  # exposed for combat math + UI
    return char


@api.post("/game/character")
async def create_character(body: CharacterCreateIn, user: dict = Depends(get_current_user)):
    if await db.characters.find_one({"user_id": user["id"]}):
        raise HTTPException(status_code=400, detail="Personagem já existe")
    char = build_character(user["id"], user.get("callsign", "DESCONHECIDO"), body.class_id)
    char = recompute_effective(char)
    await db.characters.insert_one(dict(char))
    char.pop("_id", None)
    return char

def _ensure_phase1_fields(char: dict) -> dict:
    """Backfill new character fields for pre-existing characters."""
    defaults = {
        "stamina": 100, "max_stamina": 100,
        "materials": {}, "faction_rep": {"directorate": 0, "exiles": 0, "gold_line": 0, "reavers": 0},
        "daily_progress": {}, "daily_date": "", "daily_claimed": [],
        "quests_active": [], "quests_completed": [], "quest_dialog": {},
        "arena_best_wave": 0, "zone_events_completed": 0, "crafts_done": 0,
    }
    for k, v in defaults.items():
        if k not in char or char[k] is None:
            char[k] = v
    # Ensure all 4 factions exist in rep
    for fid in ["directorate", "exiles", "gold_line", "reavers"]:
        char["faction_rep"].setdefault(fid, 0)
    return char


@api.get("/game/character")
async def get_character(user: dict = Depends(get_current_user)):
    char = await db.characters.find_one({"user_id": user["id"]}, {"_id": 0})
    if not char: raise HTTPException(status_code=404, detail="Sem personagem")
    char = _ensure_phase1_fields(char)
    char = recompute_effective(char)
    return char

@api.post("/game/character/rest")
async def rest(user: dict = Depends(get_current_user)):
    char = await db.characters.find_one({"user_id": user["id"]})
    if not char: raise HTTPException(status_code=404, detail="Sem personagem")
    char = _ensure_phase1_fields(char)
    char = recompute_effective(char)
    char["hp"] = char["max_hp"]; char["energy"] = char["max_energy"]; char["stamina"] = char.get("max_stamina", 100)
    await db.characters.update_one({"user_id": user["id"]}, {"$set": {"hp": char["hp"], "energy": char["energy"], "stamina": char["stamina"]}})
    char.pop("_id", None); char.pop("bonus", None)
    return await get_character(user)

@api.post("/game/character/reset")
async def reset_character(user: dict = Depends(get_current_user)):
    await db.characters.delete_one({"user_id": user["id"]})
    await db.combat_sessions.delete_many({"user_id": user["id"]})
    return {"ok": True}


# ============== STATIC DATA ==============
@api.get("/game/classes")
async def list_classes(): return list(CLASSES.values())

@api.get("/game/missions")
async def list_missions(user: dict = Depends(get_current_user)):
    char = await db.characters.find_one({"user_id": user["id"]}, {"_id": 0})
    completed = set(char.get("completed_missions", [])) if char else set()
    level = char.get("level", 1) if char else 1
    out = []
    for m in MISSIONS:
        out.append({**m, "completed": m["id"] in completed, "locked": level < m["min_level"],
                    "enemies_detail": [ENEMIES[e] for e in m["enemies"]]})
    return out

@api.get("/game/items")
async def list_items(): return ITEMS

@api.get("/game/meta")
async def meta():
    """Static meta data used across UI: statuses, element colors/sigils, talent tree, weakness matrix."""
    return {"status": STATUS, "element_color": ELEMENT_COLOR, "element_sigil": ELEMENT_SIGIL,
            "weakness": WEAKNESS, "talents": TALENTS, "abilities": ABILITIES}


# ============== TALENT ENDPOINTS ==============
@api.post("/game/talents/allocate")
async def allocate_talent(body: TalentAllocateIn, user: dict = Depends(get_current_user)):
    char = await db.characters.find_one({"user_id": user["id"]}, {"_id": 0})
    if not char: raise HTTPException(status_code=404, detail="Sem personagem")
    talent = get_talent(body.talent_id)
    if not talent: raise HTTPException(status_code=400, detail="Talento desconhecido")
    owned = char.get("talents_owned", [])
    if body.talent_id in owned: raise HTTPException(status_code=400, detail="Já desbloqueado")
    if talent.get("prereq") and talent["prereq"] not in owned:
        raise HTTPException(status_code=400, detail=f"Requer nível anterior: {talent['prereq']}")
    if char.get("talent_points", 0) <= 0:
        raise HTTPException(status_code=400, detail="Sem pontos de talento disponíveis")

    owned.append(body.talent_id)
    char["talents_owned"] = owned
    char["talent_points"] = char.get("talent_points", 0) - 1
    char = recompute_effective(char)
    await db.characters.update_one({"user_id": user["id"]}, {"$set": {
        "talents_owned": char["talents_owned"], "talent_points": char["talent_points"],
        "max_hp": char["max_hp"], "max_energy": char["max_energy"],
        "hp": char["hp"], "energy": char["energy"],
        "attack": char["attack"], "defense": char["defense"],
    }})
    char.pop("bonus", None)
    return char


# ============== EQUIPMENT ENDPOINTS ==============
@api.post("/game/equipment/equip")
async def equip(body: EquipIn, user: dict = Depends(get_current_user)):
    char = await db.characters.find_one({"user_id": user["id"]}, {"_id": 0})
    if not char: raise HTTPException(status_code=404, detail="Sem personagem")
    eq = next((e for e in char.get("equipment_stash", []) if e["item_id"] == body.item_id), None)
    if not eq: raise HTTPException(status_code=400, detail="Item não está no stash")
    char.setdefault("equipped", {"weapon": None, "armor": None, "relic": None})
    char["equipped"][eq["slot"]] = eq["item_id"]
    char = recompute_effective(char)
    await db.characters.update_one({"user_id": user["id"]}, {"$set": {
        "equipped": char["equipped"], "max_hp": char["max_hp"], "max_energy": char["max_energy"],
        "hp": char["hp"], "energy": char["energy"],
        "attack": char["attack"], "defense": char["defense"],
    }})
    char.pop("bonus", None)
    return char

@api.post("/game/equipment/unequip")
async def unequip(body: UnequipIn, user: dict = Depends(get_current_user)):
    char = await db.characters.find_one({"user_id": user["id"]}, {"_id": 0})
    if not char: raise HTTPException(status_code=404, detail="Sem personagem")
    char.setdefault("equipped", {"weapon": None, "armor": None, "relic": None})
    if body.slot not in char["equipped"]:
        raise HTTPException(status_code=400, detail="Slot inválido")
    char["equipped"][body.slot] = None
    char = recompute_effective(char)
    await db.characters.update_one({"user_id": user["id"]}, {"$set": {
        "equipped": char["equipped"], "max_hp": char["max_hp"], "max_energy": char["max_energy"],
        "hp": char["hp"], "energy": char["energy"],
        "attack": char["attack"], "defense": char["defense"],
    }})
    char.pop("bonus", None)
    return char


# ============== LORE (INFINITE) ==============
@api.get("/game/lore")
async def lore(offset: int = 0, limit: int = 12, user: dict = Depends(get_current_user)):
    """Returns a paginated infinite stream of procedurally-generated lore fragments,
    capped to what the player has 'excavated' (lore_unlocked). Player unlocks more by playing."""
    char = await db.characters.find_one({"user_id": user["id"]}, {"_id": 0})
    unlocked = char.get("lore_unlocked", 3) if char else 3
    limit = max(1, min(24, limit))
    offset = max(0, offset)
    total_available = max(unlocked, 3)
    end = min(offset + limit, total_available)
    items = [generate_lore_fragment(i, user["id"]) for i in range(offset, end)]
    return {"items": items, "offset": offset, "limit": limit, "unlocked": total_available,
            "has_more": end < total_available, "infinite": True}

@api.post("/game/lore/excavate")
async def excavate_lore(user: dict = Depends(get_current_user)):
    """Spend 20 credits to dig up a new lore fragment."""
    char = await db.characters.find_one({"user_id": user["id"]})
    if not char: raise HTTPException(status_code=404, detail="Sem personagem")
    COST = 20
    if char.get("credits", 0) < COST:
        raise HTTPException(status_code=400, detail="Créditos insuficientes (20 necessários)")
    new_unlocked = char.get("lore_unlocked", 3) + 1
    new_credits = char["credits"] - COST
    await db.characters.update_one({"user_id": user["id"]}, {"$set": {
        "lore_unlocked": new_unlocked, "credits": new_credits
    }})
    fragment = generate_lore_fragment(new_unlocked - 1, user["id"])
    return {"fragment": fragment, "unlocked": new_unlocked, "credits": new_credits}


# ============== COMBAT ==============
def apply_level_ups(char: dict) -> dict:
    leveled = False
    while char["xp"] >= char["xp_next"]:
        char["xp"] -= char["xp_next"]
        char["level"] += 1
        char["talent_points"] = char.get("talent_points", 0) + 1
        char["xp_next"] = xp_for_level(char["level"])
        leveled = True
    if leveled:
        char = recompute_effective(char)
        char["hp"] = char["max_hp"]; char["energy"] = char["max_energy"]
    return char


def roll_crit(crit_pct_bonus: int = 0, base: float = 0.12) -> bool:
    return random.random() < (base + crit_pct_bonus / 100.0)

def calc_damage_v2(power: int, attacker_atk: int, defender_def: int,
                   attacker_element: str, defender_element: str,
                   crit_pct_bonus: int = 0, elem_dmg_pct: int = 0,
                   wounded_dmg_pct: int = 0, wounded: bool = False,
                   marked: bool = False) -> tuple[int, bool, bool]:
    """Returns (damage, crit, elemental_weakness_hit)."""
    roll = random.randint(-3, 4)
    raw = power + attacker_atk // 3 + roll
    mitigated = max(1, raw - defender_def // 2)
    # Elemental weakness
    weak_hit = False
    if defender_element in WEAKNESS.get(attacker_element, []):
        mitigated = int(mitigated * 1.30)
        weak_hit = True
    # Element damage bonus (talents/gear)
    if elem_dmg_pct:
        mitigated = int(mitigated * (1 + elem_dmg_pct / 100.0))
    # Wounded bonus
    if wounded and wounded_dmg_pct:
        mitigated = int(mitigated * (1 + wounded_dmg_pct / 100.0))
    # Marked bonus
    if marked:
        mitigated = int(mitigated * 1.25)
    # Crit
    crit = roll_crit(crit_pct_bonus)
    if crit:
        mitigated = int(mitigated * 1.75)
    return mitigated, crit, weak_hit


def pick_intent(enemy_state: dict) -> dict:
    """Resolve the enemy's next ability from its rotation by turn counter."""
    enemy = ENEMIES[enemy_state["id"]]
    rot = enemy["rotation"]
    idx = enemy_state.get("rotation_idx", 0) % len(rot)
    ability_id = rot[idx]
    return {"ability_id": ability_id, **ABILITIES[ability_id]}


def first_alive(enemies: list) -> Optional[int]:
    for i, e in enumerate(enemies):
        if e["alive"]: return i
    return None


def tick_status_on(target: dict, max_hp_key: str = "max_hp") -> list[str]:
    """Aplica os efeitos de estado durante uma ronda. Devolve linhas de log. Muta o alvo."""
    lines = []
    statuses = target.get("statuses", [])
    new_statuses = []
    for s in statuses:
        sid = s["id"]
        if sid == "bleed":
            dmg = max(1, int(target[max_hp_key] * 0.08 * s.get("stacks", 1)))
            target["hp"] = max(0, target["hp"] - dmg)
            lines.append(f"▸ HEMORRAGIA → {target.get('name', 'TU')} perde {dmg}")
        elif sid == "burn":
            dmg = max(1, int(target[max_hp_key] * 0.06))
            target["hp"] = max(0, target["hp"] - dmg)
            lines.append(f"▸ QUEIMADURA → {target.get('name', 'TU')} perde {dmg}")
        s["dur"] -= 1
        if s["dur"] > 0:
            new_statuses.append(s)
    target["statuses"] = new_statuses
    return lines


def add_status(target: dict, sid: str, dur: int = 3, stacks: int = 1):
    target.setdefault("statuses", [])
    existing = next((s for s in target["statuses"] if s["id"] == sid), None)
    if existing:
        existing["dur"] = max(existing["dur"], dur)
        if sid == "bleed":
            existing["stacks"] = min(3, existing.get("stacks", 1) + stacks)
    else:
        entry = {"id": sid, "dur": dur}
        if sid == "bleed":
            entry["stacks"] = stacks
        target["statuses"].append(entry)


def has_status(target: dict, sid: str) -> bool:
    return any(s["id"] == sid for s in target.get("statuses", []))


@api.post("/game/combat/start")
async def combat_start(body: MissionStartIn, user: dict = Depends(get_current_user)):
    mission = get_mission(body.mission_id)
    if not mission: raise HTTPException(status_code=404, detail="Missão não encontrada")
    char = await db.characters.find_one({"user_id": user["id"]})
    if not char: raise HTTPException(status_code=404, detail="Sem personagem")
    char = recompute_effective(char)
    if char["level"] < mission["min_level"]:
        raise HTTPException(status_code=400, detail=f"Requer nível {mission['min_level']}")
    if char["hp"] <= 0:
        raise HTTPException(status_code=400, detail="Estás caído. Descansa primeiro.")

    enemies_state = []
    for eid in mission["enemies"]:
        e = ENEMIES[eid]
        enemies_state.append({
            "id": eid, "name": e["name"], "sigil": e["sigil"], "element": e["element"],
            "hp": e["hp"], "max_hp": e["hp"],
            "attack": e["attack"], "defense": e["defense"], "xp": e["xp"], "alive": True,
            "statuses": [], "rotation_idx": 0,
        })

    session = {
        "user_id": user["id"], "mission_id": mission["id"],
        "enemies": enemies_state, "player_shield": 0, "player_statuses": [],
        "turn": 1,
        "log": [f"▸ TRANSMISSÃO ABERTA — {mission['name']}", f"▸ {mission['briefing']}"],
        "status": "active", "mode": "campaign",
        "started_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.combat_sessions.delete_many({"user_id": user["id"]})
    await db.combat_sessions.insert_one(dict(session))
    session.pop("_id", None)
    char["player_statuses"] = []
    char.pop("_id", None); char.pop("bonus", None)
    return {"session": session, "character": char, "mission": mission}


@api.post("/game/combat/action")
async def combat_action(body: CombatActionIn, user: dict = Depends(get_current_user)):
    session = await db.combat_sessions.find_one({"user_id": user["id"], "status": "active"})
    if not session: raise HTTPException(status_code=400, detail="Sem combate ativo")
    char = await db.characters.find_one({"user_id": user["id"]})
    if not char: raise HTTPException(status_code=404, detail="Sem personagem")
    char = recompute_effective(char)
    bonus = char["bonus"]

    log = session["log"]
    enemies = session["enemies"]
    shield = session.get("player_shield", 0)
    player_statuses = session.get("player_statuses", [])

    # === STATUS TICK: PLAYER ===
    player_proxy = {"hp": char["hp"], "max_hp": char["max_hp"], "name": "TU", "statuses": player_statuses}
    log.extend(tick_status_on(player_proxy))
    char["hp"] = player_proxy["hp"]
    player_statuses = player_proxy["statuses"]

    if char["hp"] <= 0:
        session["status"] = "defeat"
        log.append("▸ DERROTA — sangrou-se na estática")
        session["player_statuses"] = player_statuses
        await _persist(user["id"], char, session, log, shield, enemies)
        char.pop("_id", None); char.pop("bonus", None)
        session.pop("_id", None)
        return {"session": session, "character": char}

    target_idx = first_alive(enemies)
    if target_idx is None: raise HTTPException(status_code=400, detail="Sem inimigos restantes")

    cls = get_class(char["class_id"])
    player_element = cls["element"]

    # === PLAYER ACTION ===
    wounded = char["hp"] <= char["max_hp"] * 0.4
    crit_bonus = bonus.get("crit_pct", 0)
    elem_bonus = bonus.get("element_dmg_pct", 0)
    wound_bonus = bonus.get("wounded_dmg_pct", 0)
    lifesteal = bonus.get("lifesteal_pct", 0)
    heal_bonus = bonus.get("heal_bonus_pct", 0)

    def deal_dmg(target, power, attacker_elem, status_id=None, status_dur=3, elem_override=None):
        target_elem = target.get("element", "kinetic")
        dmg, crit, weak = calc_damage_v2(
            power, char["attack"], target["defense"], elem_override or attacker_elem, target_elem,
            crit_bonus, elem_bonus, wound_bonus, wounded,
            marked=has_status(target, "marked")
        )
        target["hp"] = max(0, target["hp"] - dmg)
        tag = ""
        if crit: tag += " CRIT"
        if weak: tag += " WEAK"
        log.append(f"▸ ACERTASTE {target['name']} — {dmg}{tag}")
        if status_id:
            add_status(target, status_id, status_dur, stacks=1 + bonus.get("bleed_bonus", 0) if status_id == "bleed" else 1)
            log.append(f"▸ {target['name']} AFLITO // {STATUS[status_id]['name']}")
        if lifesteal:
            heal = max(1, int(dmg * lifesteal / 100))
            char["hp"] = min(char["max_hp"], char["hp"] + heal)
            log.append(f"▸ ROUBO-VIDA +{heal}")
        return dmg

    if body.action == "attack":
        deal_dmg(enemies[target_idx], 18, player_element)

    elif body.action == "defend":
        gained = 20 + char["defense"]
        shield += gained
        log.append(f"▸ FIRMASTE-TE — +{gained} ESCUDO")

    elif body.action == "skill":
        skill = next((s for s in cls["skills"] if s["id"] == body.skill_id), None)
        if not skill: raise HTTPException(status_code=400, detail="Perícia desconhecida")
        if char["energy"] < skill["cost"]: raise HTTPException(status_code=400, detail="Energia insuficiente")
        char["energy"] -= skill["cost"]
        if skill["type"] == "damage":
            deal_dmg(enemies[target_idx], skill["power"], player_element, status_id=skill.get("status"), elem_override=skill["element"])
        elif skill["type"] == "shield":
            gained = skill["power"]
            shield += gained
            log.append(f"▸ {skill['name']} — +{gained} ESCUDO")
        elif skill["type"] == "heal":
            heal_amt = int(skill["power"] * (1 + heal_bonus / 100))
            healed = min(heal_amt, char["max_hp"] - char["hp"])
            char["hp"] += healed
            log.append(f"▸ {skill['name']} — +{healed} VIDA RESTAURADA")

    elif body.action == "item":
        inv = char.get("inventory", [])
        entry = next((i for i in inv if i["item_id"] == body.item_id and i["qty"] > 0), None)
        if not entry: raise HTTPException(status_code=400, detail="Item indisponível")
        item = ITEMS.get(body.item_id)
        if not item: raise HTTPException(status_code=400, detail="Item desconhecido")
        entry["qty"] -= 1
        if item["type"] == "heal":
            healed = min(item["power"], char["max_hp"] - char["hp"])
            char["hp"] += healed
            log.append(f"▸ {item['name']} USADO — +{healed} VIDA")
        elif item["type"] == "energy":
            restored = min(item["power"], char["max_energy"] - char["energy"])
            char["energy"] += restored
            log.append(f"▸ {item['name']} USADO — +{restored} EN")
        elif item["type"] == "damage":
            dmg, crit, weak = calc_damage_v2(item["power"], char["attack"], enemies[target_idx]["defense"],
                                             "kinetic", enemies[target_idx].get("element", "kinetic"),
                                             crit_bonus, elem_bonus, wound_bonus, wounded,
                                             marked=has_status(enemies[target_idx], "marked"))
            enemies[target_idx]["hp"] = max(0, enemies[target_idx]["hp"] - dmg)
            log.append(f"▸ {item['name']} DETONADO — {dmg}{' FRACO' if weak else ''}{' CRIT' if crit else ''}")
        elif item["type"] == "cleanse":
            if player_statuses:
                log.append(f"▸ {item['name']} USADO — estados purgados")
            player_statuses = []
        char["inventory"] = [i for i in inv if i["qty"] > 0]
    else:
        raise HTTPException(status_code=400, detail="Ação desconhecida")

    # Resolve enemy deaths
    for e in enemies:
        if e["alive"] and e["hp"] <= 0:
            e["alive"] = False
            log.append(f"▸ {e['name']} CAI")

    victory = all(not e["alive"] for e in enemies)

    if victory:
        session["status"] = "victory"
        # Daily task: combat win
        char = _ensure_phase1_fields(char)
        _reset_daily_if_needed(char)
        char["daily_progress"]["dl_combat"] = char["daily_progress"].get("dl_combat", 0) + 1
        total_xp = sum(e["xp"] for e in enemies)
        mission = get_mission(session["mission_id"])
        xp_reward = mission["xp_reward"] if mission else 0
        credit_reward = mission["credit_reward"] if mission else 0
        char["xp"] += total_xp + xp_reward
        char["credits"] = char.get("credits", 0) + credit_reward
        first_clear = False
        if mission and mission["id"] not in char.get("completed_missions", []):
            char.setdefault("completed_missions", []).append(mission["id"])
            first_clear = True
        # Always roll an equipment drop (tier = mission tier, first clear grants better)
        drop_tier = mission["tier"] if mission else 1
        if first_clear:
            drop_tier = min(5, drop_tier + 1)
        seed = f"{user['id']}:{mission['id']}:{session['turn']}:{random.randint(0,999999)}"
        eq = roll_equipment(drop_tier, seed=seed)
        char.setdefault("equipment_stash", []).append(eq)
        log.append(f"▸ SALVADO ADQUIRIDO // {eq['name']} [N{eq['tier']} {eq['slot'].upper()}]")
        # Unlock lore fragments
        unlocks = 1 + (2 if first_clear else 0)
        char["lore_unlocked"] = char.get("lore_unlocked", 3) + unlocks
        log.append(f"▸ LORE DESBLOQUEADO — {unlocks} FRAGMENTO{'S' if unlocks != 1 else ''}")
        apply_level_ups(char)
        log.append(f"▸ VITÓRIA — +{total_xp + xp_reward} XP / +{credit_reward} CR")
        if mission: log.append(f"▸ {mission['epilogue']}")
    else:
        # === ENEMY TURN ===
        for i, e in enumerate(enemies):
            if not e["alive"]: continue
            # status tick on enemy
            proxy = {"hp": e["hp"], "max_hp": e["max_hp"], "name": e["name"], "statuses": e.get("statuses", []), "defense": e["defense"]}
            log.extend(tick_status_on(proxy))
            e["hp"] = proxy["hp"]
            e["statuses"] = proxy["statuses"]
            if e["hp"] <= 0:
                e["alive"] = False
                log.append(f"▸ {e['name']} CAI")
                continue
            # shock skip
            if has_status(e, "shock") and random.random() < 0.3:
                log.append(f"▸ {e['name']} // CHOCADO — salta ação")
                e["rotation_idx"] = (e.get("rotation_idx", 0) + 1) % len(ENEMIES[e["id"]]["rotation"])
                continue
            intent = pick_intent(e)
            atk_mult = 0.5 if has_status(e, "frozen") else 1.0
            # ATK debuff from BURN
            effective_atk = e["attack"] - (2 if has_status(e, "burn") else 0)
            if intent["kind"] == "damage":
                # player defender element: treat as class element
                dmg, crit, weak = calc_damage_v2(
                    intent["power"], int(effective_atk * atk_mult), char["defense"],
                    intent["element"], get_class(char["class_id"])["element"],
                    0, 0, 0, False,
                    marked=has_status(player_proxy, "marked")
                )
                absorbed = min(shield, dmg)
                shield -= absorbed
                remaining = dmg - absorbed
                char["hp"] = max(0, char["hp"] - remaining)
                tag = ""
                if crit: tag += " CRIT"
                if weak: tag += " WEAK"
                if absorbed > 0:
                    log.append(f"▸ {e['name']} // {intent['name']} — {dmg}{tag} (escudo {absorbed})")
                else:
                    log.append(f"▸ {e['name']} // {intent['name']} — {dmg}{tag}")
                # Reflect
                if bonus.get("reflect_pct", 0) and dmg > 0:
                    ref = max(1, int(dmg * bonus["reflect_pct"] / 100))
                    e["hp"] = max(0, e["hp"] - ref)
                    log.append(f"▸ REPREENSÃO → {e['name']} recebe {ref}")
                    if e["hp"] <= 0:
                        e["alive"] = False
                        log.append(f"▸ {e['name']} CAI")
                # Apply status
                if intent.get("status") and remaining > 0:
                    pproxy = {"statuses": player_statuses}
                    add_status(pproxy, intent["status"], 3)
                    player_statuses = pproxy["statuses"]
                    log.append(f"▸ FOSTE AFLITO // {STATUS[intent['status']]['name']}")
            elif intent["kind"] == "heal":
                heal = min(intent["power"], e["max_hp"] - e["hp"])
                e["hp"] += heal
                log.append(f"▸ {e['name']} // {intent['name']} — +{heal} VIDA")
            elif intent["kind"] == "shield":
                # enemy temporarily buffs defense — simulate with one-turn flag
                e["defense"] = min(e["defense"] + intent["power"] // 3, e["defense"] + 10)
                log.append(f"▸ {e['name']} // {intent['name']} — defesa sobe")

            e["rotation_idx"] = (e.get("rotation_idx", 0) + 1) % len(ENEMIES[e["id"]]["rotation"])
            if char["hp"] <= 0: break

        shield = max(0, int(shield * 0.65))
        if char["hp"] <= 0:
            session["status"] = "defeat"
            log.append("▸ DERROTA — cais na estática")

    # Energy regen (talent)
    if bonus.get("energy_regen", 0) and session["status"] == "active":
        char["energy"] = min(char["max_energy"], char["energy"] + bonus["energy_regen"])

    session["player_shield"] = shield
    session["player_statuses"] = player_statuses
    session["enemies"] = enemies
    session["log"] = log[-30:]
    session["turn"] = session.get("turn", 1) + 1

    # Precompute next intents for UI telegraph
    for e in enemies:
        if e["alive"]:
            e["next_intent"] = pick_intent(e)
        else:
            e["next_intent"] = None

    await _persist(user["id"], char, session, session["log"], shield, enemies)

    if session["status"] in ("victory", "defeat"):
        await db.combat_sessions.update_one(
            {"user_id": user["id"], "mission_id": session["mission_id"], "status": {"$in": ["victory", "defeat"]}},
            {"$set": {"status": "archived"}}
        )

    char.pop("_id", None); char.pop("bonus", None)
    session.pop("_id", None)
    return {"session": session, "character": char}


async def _persist(user_id, char, session, log, shield, enemies):
    await db.combat_sessions.update_one(
        {"user_id": user_id, "status": {"$ne": "archived"}},
        {"$set": {
            "enemies": enemies, "player_shield": shield,
            "player_statuses": session.get("player_statuses", []),
            "log": log, "turn": session["turn"], "status": session["status"]
        }}
    )
    await db.characters.update_one(
        {"user_id": user_id},
        {"$set": {
            "hp": char["hp"], "energy": char["energy"], "xp": char["xp"], "xp_next": char["xp_next"],
            "level": char["level"], "max_hp": char["max_hp"], "max_energy": char["max_energy"],
            "attack": char["attack"], "defense": char["defense"], "credits": char.get("credits", 0),
            "inventory": char.get("inventory", []),
            "completed_missions": char.get("completed_missions", []),
            "talent_points": char.get("talent_points", 0),
            "talents_owned": char.get("talents_owned", []),
            "equipment_stash": char.get("equipment_stash", []),
            "equipped": char.get("equipped", {"weapon": None, "armor": None, "relic": None}),
            "lore_unlocked": char.get("lore_unlocked", 3),
        }}
    )


@api.get("/game/combat/current")
async def current_combat(user: dict = Depends(get_current_user)):
    session = await db.combat_sessions.find_one({"user_id": user["id"], "status": "active"}, {"_id": 0})
    if session:
        # Attach next intent for each alive enemy
        for e in session.get("enemies", []):
            if e.get("alive"):
                e["next_intent"] = pick_intent(e)
            else:
                e["next_intent"] = None
    return session


# ========================================================================
# ============== PHASE 1 EXPANSION: World, Quests, Economy ===============
# ========================================================================

def _apply_rewards(char: dict, rewards: dict) -> list[str]:
    """Apply a generic reward dict (credits/xp/lore/materials/faction_delta/hp_cost/equipment) and return log lines."""
    lines = []
    if "credits" in rewards:
        char["credits"] = max(0, char.get("credits", 0) + rewards["credits"])
        lines.append(f"▸ {'+' if rewards['credits'] >= 0 else ''}{rewards['credits']} CR")
    if "xp" in rewards:
        char["xp"] = char.get("xp", 0) + rewards["xp"]
        lines.append(f"▸ +{rewards['xp']} XP")
    if "lore" in rewards:
        char["lore_unlocked"] = char.get("lore_unlocked", 0) + rewards["lore"]
        lines.append(f"▸ +{rewards['lore']} FRAGMENTO(S) DE LORE")
    if "materials" in rewards:
        mats = char.setdefault("materials", {})
        for mid, qty in rewards["materials"].items():
            mats[mid] = mats.get(mid, 0) + qty
            lines.append(f"▸ +{qty} {MATERIALS[mid]['name']}")
    if "faction_delta" in rewards:
        rep = char.setdefault("faction_rep", {})
        for fid, delta in rewards["faction_delta"].items():
            rep[fid] = rep.get(fid, 0) + delta
            sign = "+" if delta >= 0 else ""
            lines.append(f"▸ {FACTIONS[fid]['name']} {sign}{delta}")
    if "hp_cost" in rewards:
        char["hp"] = max(1, char["hp"] - rewards["hp_cost"])
        lines.append(f"▸ -{rewards['hp_cost']} VIDA")
    if "equipment" in rewards:
        eq_spec = rewards["equipment"]
        eq = roll_equipment(eq_spec.get("tier", 1), seed=f"zone:{random.randint(0,99999)}", slot=eq_spec.get("slot"))
        char.setdefault("equipment_stash", []).append(eq)
        lines.append(f"▸ EQUIPAMENTO SALVADO // {eq['name']}")
    return lines


def _today_str() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%d")


def _reset_daily_if_needed(char: dict):
    today = _today_str()
    if char.get("daily_date") != today:
        char["daily_date"] = today
        char["daily_progress"] = {}
        char["daily_claimed"] = []


def _strip_char(char: dict) -> dict:
    char.pop("_id", None)
    char.pop("bonus", None)
    return char


# ============== ZONES / EXPLORATION ==============
@api.get("/game/zones")
async def list_zones(user: dict = Depends(get_current_user)):
    char = await db.characters.find_one({"user_id": user["id"]}, {"_id": 0})
    level = char.get("level", 1) if char else 1
    out = []
    for z in ZONES:
        out.append({**z, "locked": level < z["min_level"]})
    return out


class ZoneEnterIn(BaseModel):
    zone_id: str


@api.post("/game/zone/event")
async def zone_event(body: ZoneEnterIn, user: dict = Depends(get_current_user)):
    """Pick a random event from the zone. Consume stamina. Return event or auto-combat link."""
    zone = get_zone(body.zone_id)
    if not zone: raise HTTPException(status_code=404, detail="Zona desconhecida")
    char = await db.characters.find_one({"user_id": user["id"]}, {"_id": 0})
    if not char: raise HTTPException(status_code=404, detail="Sem personagem")
    char = _ensure_phase1_fields(char)
    if char["level"] < zone["min_level"]:
        raise HTTPException(status_code=400, detail=f"Requer nível {zone['min_level']}")
    if char["stamina"] < zone["stamina_cost"]:
        raise HTTPException(status_code=400, detail="Stamina insuficiente. Descansa primeiro.")
    char["stamina"] -= zone["stamina_cost"]
    event = random.choice(zone["events"])
    await db.characters.update_one({"user_id": user["id"]}, {"$set": {"stamina": char["stamina"]}})
    return {"zone": {"id": zone["id"], "name": zone["name"]}, "event": event, "stamina": char["stamina"]}


class ZoneChoiceIn(BaseModel):
    zone_id: str
    event_id: str
    choice_index: int


@api.post("/game/zone/resolve")
async def zone_resolve(body: ZoneChoiceIn, user: dict = Depends(get_current_user)):
    zone = get_zone(body.zone_id)
    if not zone: raise HTTPException(status_code=404, detail="Zona desconhecida")
    event = next((e for e in zone["events"] if e["id"] == body.event_id), None)
    if not event: raise HTTPException(status_code=404, detail="Evento desconhecido")
    char = await db.characters.find_one({"user_id": user["id"]}, {"_id": 0})
    if not char: raise HTTPException(status_code=404, detail="Sem personagem")
    char = _ensure_phase1_fields(char)
    lines = []
    if "combat" in event:
        lines.append("▸ COMBATE IMINENTE — usa /combat/start-encounter")
        await db.characters.update_one({"user_id": user["id"]}, {"$set": char})
        return {"lines": lines, "combat": event["combat"], "character": _strip_char(char)}
    choices = event.get("choices", [])
    if body.choice_index < 0 or body.choice_index >= len(choices):
        raise HTTPException(status_code=400, detail="Escolha inválida")
    outcome = choices[body.choice_index].get("outcome", {})
    lines = _apply_rewards(char, outcome)
    char["zone_events_completed"] = char.get("zone_events_completed", 0) + 1
    # Daily task progress
    char.setdefault("daily_progress", {})
    _reset_daily_if_needed(char)
    char["daily_progress"]["dl_explore"] = char["daily_progress"].get("dl_explore", 0) + 1
    apply_level_ups(char)
    await db.characters.update_one({"user_id": user["id"]}, {"$set": char})
    char = recompute_effective(char)
    return {"lines": lines, "character": _strip_char(char)}


# ============== QUESTS ==============
@api.get("/game/quests")
async def list_quests(user: dict = Depends(get_current_user)):
    char = await db.characters.find_one({"user_id": user["id"]}, {"_id": 0})
    if not char: raise HTTPException(status_code=404, detail="Sem personagem")
    char = _ensure_phase1_fields(char)
    completed = set(char.get("completed_missions", []))
    out = []
    for q in QUESTS:
        available = q["required_mission"] in completed
        state = "locked"
        if q["id"] in char.get("quests_completed", []):
            state = "completed"
        elif q["id"] in char.get("quests_active", []):
            state = "active"
        elif available:
            state = "available"
        cur_dialog = char.get("quest_dialog", {}).get(q["id"], q["dialogs"][0]["id"] if q["dialogs"] else None)
        out.append({**q, "state": state, "current_dialog": cur_dialog})
    return out


class QuestStartIn(BaseModel):
    quest_id: str


@api.post("/game/quest/start")
async def quest_start(body: QuestStartIn, user: dict = Depends(get_current_user)):
    q = get_quest(body.quest_id)
    if not q: raise HTTPException(status_code=404, detail="Quest desconhecida")
    char = await db.characters.find_one({"user_id": user["id"]}, {"_id": 0})
    if not char: raise HTTPException(status_code=404, detail="Sem personagem")
    char = _ensure_phase1_fields(char)
    if q["required_mission"] not in char.get("completed_missions", []):
        raise HTTPException(status_code=400, detail="Tens de completar a missão pré-requisito primeiro")
    if body.quest_id in char.get("quests_completed", []):
        raise HTTPException(status_code=400, detail="Quest já completa")
    if body.quest_id not in char.get("quests_active", []):
        char.setdefault("quests_active", []).append(body.quest_id)
    char.setdefault("quest_dialog", {})[body.quest_id] = q["dialogs"][0]["id"]
    await db.characters.update_one({"user_id": user["id"]}, {"$set": char})
    return {"ok": True, "current_dialog": q["dialogs"][0]["id"]}


class QuestChoiceIn(BaseModel):
    quest_id: str
    dialog_id: str
    choice_index: int


@api.post("/game/quest/choose")
async def quest_choose(body: QuestChoiceIn, user: dict = Depends(get_current_user)):
    q = get_quest(body.quest_id)
    if not q: raise HTTPException(status_code=404, detail="Quest desconhecida")
    d = get_dialog(q, body.dialog_id)
    if not d: raise HTTPException(status_code=404, detail="Diálogo desconhecido")
    char = await db.characters.find_one({"user_id": user["id"]}, {"_id": 0})
    if not char: raise HTTPException(status_code=404, detail="Sem personagem")
    char = _ensure_phase1_fields(char)
    lines = []
    # Leaf dialog: apply outcome + end quest
    if d.get("end"):
        lines = _apply_rewards(char, d.get("outcome", {}))
        char.setdefault("xp", 0)
        char["xp"] += q.get("xp_reward", 0)
        char["credits"] = char.get("credits", 0) + q.get("credit_reward", 0)
        for fid, delta in q.get("faction_reward", {}).items():
            char.setdefault("faction_rep", {})[fid] = char["faction_rep"].get(fid, 0) + delta
        lines.append(f"▸ QUEST COMPLETA — +{q.get('xp_reward',0)} XP / +{q.get('credit_reward',0)} CR")
        char.setdefault("quests_completed", []).append(q["id"])
        if q["id"] in char.get("quests_active", []):
            char["quests_active"].remove(q["id"])
        char.get("quest_dialog", {}).pop(q["id"], None)
        apply_level_ups(char)
        await db.characters.update_one({"user_id": user["id"]}, {"$set": char})
        char = recompute_effective(char)
        return {"lines": lines, "character": _strip_char(char), "ended": True}
    # Branch: apply outcome + move to next
    choices = d.get("choices", [])
    if body.choice_index < 0 or body.choice_index >= len(choices):
        raise HTTPException(status_code=400, detail="Escolha inválida")
    choice = choices[body.choice_index]
    if choice.get("outcome"):
        lines = _apply_rewards(char, choice["outcome"])
    next_id = choice.get("next")
    if next_id:
        char.setdefault("quest_dialog", {})[q["id"]] = next_id
    await db.characters.update_one({"user_id": user["id"]}, {"$set": char})
    char = recompute_effective(char)
    return {"lines": lines, "character": _strip_char(char), "next_dialog": next_id, "ended": False}


# ============== MARKET ==============
@api.get("/game/market")
async def list_market():
    return MARKET_GOODS


class MarketBuyIn(BaseModel):
    good_id: str


@api.post("/game/market/buy")
async def market_buy(body: MarketBuyIn, user: dict = Depends(get_current_user)):
    good = next((g for g in MARKET_GOODS if g["id"] == body.good_id), None)
    if not good: raise HTTPException(status_code=404, detail="Bem desconhecido")
    char = await db.characters.find_one({"user_id": user["id"]}, {"_id": 0})
    if not char: raise HTTPException(status_code=404, detail="Sem personagem")
    char = _ensure_phase1_fields(char)
    # Dynamic pricing: +/-10% based on faction reputation with reavers (market faction proxy)
    rep = char.get("faction_rep", {}).get("reavers", 0)
    discount = max(-10, min(15, rep // 20))  # -10% to +15% based on rep
    cost = max(1, int(good["cost"] * (100 - discount) / 100))
    if char["credits"] < cost: raise HTTPException(status_code=400, detail="Créditos insuficientes")
    char["credits"] -= cost
    lines = [f"▸ COMPROU {good['name']} — -{cost} CR"]
    if good["kind"] == "consumable":
        inv = char.setdefault("inventory", [])
        entry = next((i for i in inv if i["item_id"] == good["id"]), None)
        if entry: entry["qty"] += 1
        else: inv.append({"item_id": good["id"], "qty": 1})
    elif good["kind"] == "cache":
        eq = roll_equipment(good.get("tier", 2), seed=f"cache:{random.randint(0,99999)}")
        char.setdefault("equipment_stash", []).append(eq)
        lines.append(f"▸ CACHE ABRIU // {eq['name']}")
    await db.characters.update_one({"user_id": user["id"]}, {"$set": char})
    char = recompute_effective(char)
    return {"lines": lines, "character": _strip_char(char), "actual_cost": cost}


# ============== CRAFTING ==============
@api.get("/game/crafting")
async def list_crafting(): return {"recipes": CRAFTING_RECIPES, "materials": MATERIALS}


class CraftIn(BaseModel):
    recipe_id: str


@api.post("/game/craft")
async def craft(body: CraftIn, user: dict = Depends(get_current_user)):
    r = get_recipe(body.recipe_id)
    if not r: raise HTTPException(status_code=404, detail="Receita desconhecida")
    char = await db.characters.find_one({"user_id": user["id"]}, {"_id": 0})
    if not char: raise HTTPException(status_code=404, detail="Sem personagem")
    char = _ensure_phase1_fields(char)
    mats = char.setdefault("materials", {})
    for mid, qty in r["cost_materials"].items():
        if mats.get(mid, 0) < qty:
            raise HTTPException(status_code=400, detail=f"Faltam materiais: {MATERIALS[mid]['name']}")
    if char["credits"] < r["cost_credits"]:
        raise HTTPException(status_code=400, detail="Créditos insuficientes")
    for mid, qty in r["cost_materials"].items():
        mats[mid] -= qty
    char["credits"] -= r["cost_credits"]
    lines = [f"▸ FABRICADO {r['name']} — -{r['cost_credits']} CR"]
    prod = r["produces"]
    if "item_id" in prod:
        inv = char.setdefault("inventory", [])
        entry = next((i for i in inv if i["item_id"] == prod["item_id"]), None)
        if entry: entry["qty"] += prod.get("qty", 1)
        else: inv.append({"item_id": prod["item_id"], "qty": prod.get("qty", 1)})
    elif prod.get("kind") == "equipment":
        eq = roll_equipment(prod["tier"], seed=f"craft:{random.randint(0,99999)}")
        char.setdefault("equipment_stash", []).append(eq)
        lines.append(f"▸ EQUIPAMENTO // {eq['name']}")
    char["crafts_done"] = char.get("crafts_done", 0) + 1
    await db.characters.update_one({"user_id": user["id"]}, {"$set": char})
    char = recompute_effective(char)
    return {"lines": lines, "character": _strip_char(char)}


# ============== FACTIONS ==============
@api.get("/game/factions")
async def list_factions(user: dict = Depends(get_current_user)):
    char = await db.characters.find_one({"user_id": user["id"]}, {"_id": 0})
    if not char: raise HTTPException(status_code=404, detail="Sem personagem")
    char = _ensure_phase1_fields(char)
    rep = char.get("faction_rep", {})
    out = []
    for fid, f in FACTIONS.items():
        r = rep.get(fid, 0)
        out.append({**f, "rep": r, "rank": rank_for(r)})
    return out


# ============== DAILY ==============
@api.get("/game/daily")
async def get_daily(user: dict = Depends(get_current_user)):
    char = await db.characters.find_one({"user_id": user["id"]}, {"_id": 0})
    if not char: raise HTTPException(status_code=404, detail="Sem personagem")
    char = _ensure_phase1_fields(char)
    _reset_daily_if_needed(char)
    await db.characters.update_one({"user_id": user["id"]}, {"$set": {
        "daily_date": char["daily_date"], "daily_progress": char["daily_progress"], "daily_claimed": char["daily_claimed"]
    }})
    progress = char["daily_progress"]
    claimed = char["daily_claimed"]
    return {"tasks": [{**t, "current": progress.get(t["id"], 0), "claimed": t["id"] in claimed,
                       "done": progress.get(t["id"], 0) >= t["target"]} for t in DAILY_TASKS],
            "today": char["daily_date"]}


class DailyClaimIn(BaseModel):
    task_id: str


@api.post("/game/daily/claim")
async def daily_claim(body: DailyClaimIn, user: dict = Depends(get_current_user)):
    task = next((t for t in DAILY_TASKS if t["id"] == body.task_id), None)
    if not task: raise HTTPException(status_code=404, detail="Tarefa desconhecida")
    char = await db.characters.find_one({"user_id": user["id"]}, {"_id": 0})
    if not char: raise HTTPException(status_code=404, detail="Sem personagem")
    char = _ensure_phase1_fields(char)
    _reset_daily_if_needed(char)
    if body.task_id in char.get("daily_claimed", []):
        raise HTTPException(status_code=400, detail="Já reclamada")
    if char.get("daily_progress", {}).get(body.task_id, 0) < task["target"]:
        raise HTTPException(status_code=400, detail="Tarefa não concluída")
    lines = _apply_rewards(char, task["reward"])
    char.setdefault("daily_claimed", []).append(body.task_id)
    await db.characters.update_one({"user_id": user["id"]}, {"$set": char})
    char = recompute_effective(char)
    return {"lines": lines, "character": _strip_char(char)}


# ============== ARENA ==============
@api.post("/game/arena/start")
async def arena_start(user: dict = Depends(get_current_user)):
    """Starts an endless arena run. Session stored like combat but with wave counter."""
    char = await db.characters.find_one({"user_id": user["id"]}, {"_id": 0})
    if not char: raise HTTPException(status_code=404, detail="Sem personagem")
    char = _ensure_phase1_fields(char)
    if char["hp"] <= 0:
        raise HTTPException(status_code=400, detail="Estás caído. Descansa primeiro.")
    # Clear any previous arena session
    await db.combat_sessions.delete_many({"user_id": user["id"], "mode": "arena"})
    # Wave 1: one tier 1 enemy
    enemies = _arena_enemies_for_wave(1)
    session = {
        "user_id": user["id"], "mission_id": "arena", "mode": "arena",
        "turn": 1, "wave": 1, "enemies": enemies, "log": ["▸ ARENA — ONDA 01"],
        "player_statuses": [], "shield": 0, "status": "active",
        "terrain": None,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.combat_sessions.insert_one(dict(session))
    for e in session["enemies"]:
        e["next_intent"] = pick_intent(e)
    session.pop("_id", None)
    char = recompute_effective(char)
    return {"session": session, "character": _strip_char(char)}


def _arena_enemies_for_wave(wave: int) -> list:
    """Scale difficulty with wave number. Every 5 waves: boss tier."""
    pool_t1 = ["husk_drone", "rust_cultist", "feral_sibling"]
    pool_t2 = ["void_hound", "chrome_reaver", "gold_scribe"]
    pool_t3 = ["amber_witch", "null_prince", "vault_warden", "psi_suffragan", "chrome_matron"]
    pool_t4 = ["hollow_titan", "rust_juggernaut", "amber_choirmaster", "void_anchorite"]
    pool_t5 = ["the_unmade", "martyr_twin", "the_first_name"]
    if wave % 10 == 0:
        ids = [random.choice(pool_t5)]
    elif wave % 5 == 0:
        ids = [random.choice(pool_t4), random.choice(pool_t3)] if wave >= 15 else [random.choice(pool_t4)]
    elif wave >= 12:
        ids = [random.choice(pool_t3), random.choice(pool_t2)]
    elif wave >= 7:
        ids = [random.choice(pool_t2), random.choice(pool_t1)]
    elif wave >= 3:
        ids = [random.choice(pool_t2)]
    else:
        ids = [random.choice(pool_t1)]
    scale = 1 + max(0, (wave - 1) * 0.08)
    enemies = []
    for eid in ids:
        base = ENEMIES[eid]
        e = dict(base)
        e["hp"] = int(base["hp"] * scale)
        e["max_hp"] = e["hp"]
        e["attack"] = int(base["attack"] * (1 + (wave - 1) * 0.05))
        e["alive"] = True
        e["rotation_idx"] = 0
        e["statuses"] = []
        enemies.append(e)
    return enemies


@api.post("/game/arena/advance")
async def arena_advance(user: dict = Depends(get_current_user)):
    """Called after a wave is won: spawn next wave, give loot."""
    session = await db.combat_sessions.find_one({"user_id": user["id"], "mode": "arena"})
    if not session: raise HTTPException(status_code=404, detail="Sem arena ativa")
    char = await db.characters.find_one({"user_id": user["id"]}, {"_id": 0})
    char = _ensure_phase1_fields(char)
    wave = session.get("wave", 1)
    # Victory rewards
    cr_reward = 50 + wave * 20
    xp_reward = 20 + wave * 10
    char["credits"] = char.get("credits", 0) + cr_reward
    char["xp"] = char.get("xp", 0) + xp_reward
    # Best wave tracking
    if wave > char.get("arena_best_wave", 0):
        char["arena_best_wave"] = wave
    apply_level_ups(char)
    # Next wave
    wave += 1
    session["wave"] = wave
    session["turn"] = 1
    session["enemies"] = _arena_enemies_for_wave(wave)
    session["shield"] = 0
    session["player_statuses"] = []
    session["status"] = "active"
    session["log"] = session.get("log", []) + [f"▸ ONDA {wave:02d} — +{cr_reward} CR / +{xp_reward} XP"]
    # Every 3 waves: equipment drop
    if wave % 3 == 0:
        tier = min(5, 1 + wave // 5)
        eq = roll_equipment(tier, seed=f"arena:{wave}")
        char.setdefault("equipment_stash", []).append(eq)
        session["log"].append(f"▸ SALVADO // {eq['name']}")
    await db.combat_sessions.replace_one({"user_id": user["id"], "mode": "arena"}, session)
    await db.characters.update_one({"user_id": user["id"]}, {"$set": char})
    for e in session["enemies"]:
        e["next_intent"] = pick_intent(e)
    session.pop("_id", None)
    char = recompute_effective(char)
    return {"session": session, "character": _strip_char(char)}


@api.post("/game/arena/flee")
async def arena_flee(user: dict = Depends(get_current_user)):
    await db.combat_sessions.delete_many({"user_id": user["id"], "mode": "arena"})
    return {"ok": True}


# ============== STARTUP ==============
@app.on_event("startup")
async def on_start():
    try:
        await db.users.create_index("email", unique=True)
        await db.login_attempts.create_index("identifier")
        await db.characters.create_index("user_id", unique=True)
        await db.combat_sessions.create_index("user_id")
        logger.info("Indexes ready. AETHER//EXILE online.")
    except Exception as e:
        logger.warning(f"Index setup error: {e}")

@app.on_event("shutdown")
async def on_stop():
    client.close()

@api.get("/")
async def root(): return {"name": "AETHER//EXILE", "status": "online"}


frontend_url = os.environ.get("FRONTEND_URL", "http://localhost:3000")
origins = [frontend_url, "http://localhost:3000"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api)

from dotenv import load_dotenv
load_dotenv()

import os
import logging
import secrets
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
    xp_for_level, get_class, get_enemy, get_mission
)

# ============== CONFIG ==============
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

JWT_ALGORITHM = "HS256"
JWT_SECRET = os.environ["JWT_SECRET"]
ACCESS_EXPIRE_MIN = 60 * 24  # 1 day for game sessions
REFRESH_EXPIRE_DAYS = 30
FAILED_ATTEMPT_LIMIT = 5
LOCKOUT_MINUTES = 15

app = FastAPI(title="AETHER//EXILE API")
api = APIRouter(prefix="/api")


# ============== AUTH HELPERS ==============
def hash_password(pw: str) -> str:
    return bcrypt.hashpw(pw.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(pw: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(pw.encode("utf-8"), hashed.encode("utf-8"))
    except Exception:
        return False


def create_access_token(user_id: str, email: str) -> str:
    payload = {
        "sub": user_id, "email": email, "type": "access",
        "exp": datetime.now(timezone.utc) + timedelta(minutes=ACCESS_EXPIRE_MIN),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def create_refresh_token(user_id: str) -> str:
    payload = {
        "sub": user_id, "type": "refresh",
        "exp": datetime.now(timezone.utc) + timedelta(days=REFRESH_EXPIRE_DAYS),
    }
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
        if auth.startswith("Bearer "):
            token = auth[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Invalid token type")
        user = await db.users.find_one({"_id": ObjectId(payload["sub"])})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        user["id"] = str(user["_id"])
        user.pop("_id", None)
        user.pop("password_hash", None)
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")


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
    action: str  # "attack" | "skill" | "defend" | "item"
    skill_id: Optional[str] = None
    item_id: Optional[str] = None


class MissionStartIn(BaseModel):
    mission_id: str


# ============== AUTH ROUTES ==============
@api.post("/auth/register")
async def register(body: RegisterIn, response: Response):
    email = body.email.lower().strip()
    existing = await db.users.find_one({"email": email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    doc = {
        "email": email,
        "password_hash": hash_password(body.password),
        "callsign": body.callsign.strip(),
        "role": "player",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    res = await db.users.insert_one(doc)
    uid = str(res.inserted_id)
    set_auth_cookies(response, create_access_token(uid, email), create_refresh_token(uid))
    return {"id": uid, "email": email, "callsign": body.callsign, "role": "player", "has_character": False}


@api.post("/auth/login")
async def login(body: LoginIn, request: Request, response: Response):
    email = body.email.lower().strip()
    ip = request.client.host if request.client else "unknown"
    key = f"{ip}:{email}"

    # brute force check
    lock = await db.login_attempts.find_one({"identifier": key})
    if lock and lock.get("locked_until"):
        locked_until = datetime.fromisoformat(lock["locked_until"])
        if locked_until > datetime.now(timezone.utc):
            raise HTTPException(status_code=429, detail="Too many attempts. Try again later.")

    user = await db.users.find_one({"email": email})
    if not user or not verify_password(body.password, user["password_hash"]):
        attempts = (lock.get("count", 0) if lock else 0) + 1
        update = {"identifier": key, "count": attempts, "last_attempt": datetime.now(timezone.utc).isoformat()}
        if attempts >= FAILED_ATTEMPT_LIMIT:
            update["locked_until"] = (datetime.now(timezone.utc) + timedelta(minutes=LOCKOUT_MINUTES)).isoformat()
        await db.login_attempts.update_one({"identifier": key}, {"$set": update}, upsert=True)
        raise HTTPException(status_code=401, detail="Invalid credentials")

    await db.login_attempts.delete_one({"identifier": key})
    uid = str(user["_id"])
    set_auth_cookies(response, create_access_token(uid, email), create_refresh_token(uid))
    char = await db.characters.find_one({"user_id": uid}, {"_id": 0})
    return {
        "id": uid, "email": email, "callsign": user.get("callsign"),
        "role": user.get("role", "player"), "has_character": char is not None,
    }


@api.post("/auth/logout")
async def logout(response: Response):
    clear_auth_cookies(response)
    return {"ok": True}


@api.get("/auth/me")
async def me(user: dict = Depends(get_current_user)):
    char = await db.characters.find_one({"user_id": user["id"]}, {"_id": 0})
    return {
        "id": user["id"], "email": user["email"], "callsign": user.get("callsign"),
        "role": user.get("role", "player"), "has_character": char is not None,
    }


# ============== GAME: CHARACTER ==============
def build_character(user_id: str, callsign: str, class_id: str) -> dict:
    cls = get_class(class_id)
    if not cls:
        raise HTTPException(status_code=400, detail="Unknown class")
    return {
        "user_id": user_id,
        "callsign": callsign,
        "class_id": class_id,
        "level": 1,
        "xp": 0,
        "xp_next": xp_for_level(1),
        "credits": 50,
        "hp": cls["base_hp"],
        "max_hp": cls["base_hp"],
        "energy": cls["base_energy"],
        "max_energy": cls["base_energy"],
        "attack": cls["base_attack"],
        "defense": cls["base_defense"],
        "inventory": list(STARTER_INVENTORY),
        "completed_missions": [],
        "created_at": datetime.now(timezone.utc).isoformat(),
    }


@api.post("/game/character")
async def create_character(body: CharacterCreateIn, user: dict = Depends(get_current_user)):
    existing = await db.characters.find_one({"user_id": user["id"]})
    if existing:
        raise HTTPException(status_code=400, detail="Character already exists")
    char = build_character(user["id"], user.get("callsign", "UNKNOWN"), body.class_id)
    await db.characters.insert_one(dict(char))
    char.pop("_id", None)
    return char


@api.get("/game/character")
async def get_character(user: dict = Depends(get_current_user)):
    char = await db.characters.find_one({"user_id": user["id"]}, {"_id": 0})
    if not char:
        raise HTTPException(status_code=404, detail="No character")
    return char


@api.post("/game/character/reset")
async def reset_character(user: dict = Depends(get_current_user)):
    await db.characters.delete_one({"user_id": user["id"]})
    await db.combat_sessions.delete_many({"user_id": user["id"]})
    return {"ok": True}


@api.post("/game/character/rest")
async def rest(user: dict = Depends(get_current_user)):
    char = await db.characters.find_one({"user_id": user["id"]})
    if not char:
        raise HTTPException(status_code=404, detail="No character")
    await db.characters.update_one(
        {"user_id": user["id"]},
        {"$set": {"hp": char["max_hp"], "energy": char["max_energy"]}}
    )
    char["hp"] = char["max_hp"]
    char["energy"] = char["max_energy"]
    char.pop("_id", None)
    return char


# ============== GAME: STATIC DATA ==============
@api.get("/game/classes")
async def list_classes():
    return list(CLASSES.values())


@api.get("/game/missions")
async def list_missions(user: dict = Depends(get_current_user)):
    char = await db.characters.find_one({"user_id": user["id"]}, {"_id": 0})
    completed = set(char.get("completed_missions", [])) if char else set()
    level = char.get("level", 1) if char else 1
    out = []
    for m in MISSIONS:
        out.append({
            **m,
            "completed": m["id"] in completed,
            "locked": level < m["min_level"],
            "enemies_detail": [ENEMIES[e] for e in m["enemies"]],
        })
    return out


@api.get("/game/items")
async def list_items():
    return ITEMS


# ============== GAME: COMBAT ==============
def apply_level_ups(char: dict) -> dict:
    while char["xp"] >= char["xp_next"]:
        char["xp"] -= char["xp_next"]
        char["level"] += 1
        cls = get_class(char["class_id"])
        gain_hp = 20 + cls["base_hp"] // 20
        gain_energy = 10 + cls["base_energy"] // 20
        char["max_hp"] += gain_hp
        char["max_energy"] += gain_energy
        char["hp"] = char["max_hp"]
        char["energy"] = char["max_energy"]
        char["attack"] += 3
        char["defense"] += 2
        char["xp_next"] = xp_for_level(char["level"])
    return char


@api.post("/game/combat/start")
async def combat_start(body: MissionStartIn, user: dict = Depends(get_current_user)):
    mission = get_mission(body.mission_id)
    if not mission:
        raise HTTPException(status_code=404, detail="Mission not found")
    char = await db.characters.find_one({"user_id": user["id"]})
    if not char:
        raise HTTPException(status_code=404, detail="No character")
    if char["level"] < mission["min_level"]:
        raise HTTPException(status_code=400, detail=f"Requires level {mission['min_level']}")
    if char["hp"] <= 0:
        raise HTTPException(status_code=400, detail="You are down. Rest first.")

    enemies_state = []
    for eid in mission["enemies"]:
        e = ENEMIES[eid]
        enemies_state.append({
            "id": eid, "name": e["name"], "sigil": e["sigil"],
            "hp": e["hp"], "max_hp": e["hp"],
            "attack": e["attack"], "defense": e["defense"], "xp": e["xp"], "alive": True,
        })

    session = {
        "user_id": user["id"],
        "mission_id": mission["id"],
        "enemies": enemies_state,
        "player_shield": 0,
        "turn": 1,
        "log": [f"▸ TRANSMISSION OPEN — {mission['name']}", f"▸ {mission['briefing']}"],
        "status": "active",
        "started_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.combat_sessions.delete_many({"user_id": user["id"]})
    await db.combat_sessions.insert_one(dict(session))
    session.pop("_id", None)
    char.pop("_id", None)
    return {"session": session, "character": char, "mission": mission}


def calc_damage(base: int, attack: int, defense: int, crit_chance: float = 0.12) -> tuple[int, bool]:
    roll = random.randint(-3, 4)
    raw = base + attack // 3 + roll
    mitigated = max(1, raw - defense // 2)
    crit = random.random() < crit_chance
    if crit:
        mitigated = int(mitigated * 1.75)
    return mitigated, crit


def first_alive(enemies: list) -> Optional[int]:
    for i, e in enumerate(enemies):
        if e["alive"]:
            return i
    return None


@api.post("/game/combat/action")
async def combat_action(body: CombatActionIn, user: dict = Depends(get_current_user)):
    session = await db.combat_sessions.find_one({"user_id": user["id"], "status": "active"})
    if not session:
        raise HTTPException(status_code=400, detail="No active combat")
    char = await db.characters.find_one({"user_id": user["id"]})
    if not char:
        raise HTTPException(status_code=404, detail="No character")

    log = session["log"]
    enemies = session["enemies"]
    shield = session.get("player_shield", 0)
    target_idx = first_alive(enemies)
    if target_idx is None:
        raise HTTPException(status_code=400, detail="No enemies left")

    # PLAYER ACTION
    if body.action == "attack":
        dmg, crit = calc_damage(18, char["attack"], enemies[target_idx]["defense"], 0.15)
        enemies[target_idx]["hp"] = max(0, enemies[target_idx]["hp"] - dmg)
        log.append(f"▸ YOU STRIKE {enemies[target_idx]['name']} — {dmg}{' CRIT' if crit else ''}")

    elif body.action == "defend":
        gained = 20 + char["defense"]
        shield += gained
        log.append(f"▸ YOU BRACE — +{gained} SHIELD")

    elif body.action == "skill":
        cls = get_class(char["class_id"])
        skill = next((s for s in cls["skills"] if s["id"] == body.skill_id), None)
        if not skill:
            raise HTTPException(status_code=400, detail="Unknown skill")
        if char["energy"] < skill["cost"]:
            raise HTTPException(status_code=400, detail="Not enough energy")
        char["energy"] -= skill["cost"]
        if skill["type"] == "damage":
            dmg, crit = calc_damage(skill["power"], char["attack"], enemies[target_idx]["defense"], 0.2)
            enemies[target_idx]["hp"] = max(0, enemies[target_idx]["hp"] - dmg)
            log.append(f"▸ {skill['name']} → {enemies[target_idx]['name']} — {dmg}{' CRIT' if crit else ''}")
        elif skill["type"] == "shield":
            shield += skill["power"]
            log.append(f"▸ {skill['name']} — +{skill['power']} SHIELD")
        elif skill["type"] == "heal":
            healed = min(skill["power"], char["max_hp"] - char["hp"])
            char["hp"] += healed
            log.append(f"▸ {skill['name']} — +{healed} HP RESTORED")

    elif body.action == "item":
        inv = char.get("inventory", [])
        entry = next((i for i in inv if i["item_id"] == body.item_id and i["qty"] > 0), None)
        if not entry:
            raise HTTPException(status_code=400, detail="Item not available")
        item = ITEMS.get(body.item_id)
        if not item:
            raise HTTPException(status_code=400, detail="Unknown item")
        entry["qty"] -= 1
        if item["type"] == "heal":
            healed = min(item["power"], char["max_hp"] - char["hp"])
            char["hp"] += healed
            log.append(f"▸ {item['name']} USED — +{healed} HP")
        elif item["type"] == "energy":
            restored = min(item["power"], char["max_energy"] - char["energy"])
            char["energy"] += restored
            log.append(f"▸ {item['name']} USED — +{restored} ENERGY")
        elif item["type"] == "damage":
            enemies[target_idx]["hp"] = max(0, enemies[target_idx]["hp"] - item["power"])
            log.append(f"▸ {item['name']} DETONATED — {item['power']} DMG")
        # clean up empty stacks
        char["inventory"] = [i for i in inv if i["qty"] > 0]
    else:
        raise HTTPException(status_code=400, detail="Unknown action")

    # Resolve deaths
    for e in enemies:
        if e["alive"] and e["hp"] <= 0:
            e["alive"] = False
            log.append(f"▸ {e['name']} FALLS")

    # Check win
    if all(not e["alive"] for e in enemies):
        session["status"] = "victory"
        total_xp = sum(e["xp"] for e in enemies)
        mission = get_mission(session["mission_id"])
        xp_reward = mission["xp_reward"] if mission else 0
        credit_reward = mission["credit_reward"] if mission else 0
        char["xp"] += total_xp + xp_reward
        char["credits"] = char.get("credits", 0) + credit_reward
        if mission and mission["id"] not in char.get("completed_missions", []):
            char.setdefault("completed_missions", []).append(mission["id"])
        apply_level_ups(char)
        log.append(f"▸ VICTORY — +{total_xp + xp_reward} XP / +{credit_reward} CR")
        if mission:
            log.append(f"▸ {mission['epilogue']}")
    else:
        # ENEMY TURN
        for i, e in enumerate(enemies):
            if not e["alive"]:
                continue
            dmg, crit = calc_damage(14, e["attack"], char["defense"], 0.10)
            absorbed = min(shield, dmg)
            shield -= absorbed
            remaining = dmg - absorbed
            char["hp"] = max(0, char["hp"] - remaining)
            if absorbed > 0:
                log.append(f"▸ {e['name']} HITS — {dmg}{' CRIT' if crit else ''} (shield absorbs {absorbed})")
            else:
                log.append(f"▸ {e['name']} HITS — {dmg}{' CRIT' if crit else ''}")
            if char["hp"] <= 0:
                break

        # decay shield slightly
        shield = max(0, int(shield * 0.6))

        if char["hp"] <= 0:
            session["status"] = "defeat"
            log.append("▸ DEFEAT — you fall into the static")

    session["player_shield"] = shield
    session["enemies"] = enemies
    session["log"] = log[-25:]
    session["turn"] = session.get("turn", 1) + 1

    # persist
    await db.combat_sessions.update_one(
        {"user_id": user["id"], "status": {"$ne": "archived"}},
        {"$set": {
            "enemies": enemies, "player_shield": shield,
            "log": session["log"], "turn": session["turn"], "status": session["status"],
        }}
    )
    await db.characters.update_one(
        {"user_id": user["id"]},
        {"$set": {
            "hp": char["hp"], "energy": char["energy"], "xp": char["xp"], "xp_next": char["xp_next"],
            "level": char["level"], "max_hp": char["max_hp"], "max_energy": char["max_energy"],
            "attack": char["attack"], "defense": char["defense"], "credits": char.get("credits", 0),
            "inventory": char.get("inventory", []), "completed_missions": char.get("completed_missions", []),
        }}
    )

    if session["status"] in ("victory", "defeat"):
        await db.combat_sessions.update_one(
            {"user_id": user["id"], "mission_id": session["mission_id"]},
            {"$set": {"status": "archived"}}
        )

    char.pop("_id", None)
    session.pop("_id", None)
    return {"session": session, "character": char}


@api.get("/game/combat/current")
async def current_combat(user: dict = Depends(get_current_user)):
    session = await db.combat_sessions.find_one({"user_id": user["id"], "status": "active"}, {"_id": 0})
    return session


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
async def root():
    return {"name": "AETHER//EXILE", "status": "online"}


# CORS — need explicit origins for cookies
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

"""
AETHER//EXILE — additional systems data (v3 expansion).
Imports everything from game_data.py and adds: survival, sanity, traits, weather, companions,
sanctum upgrades, dispatch missions, professions, lore tomes, dynamic prices.
"""
import random
from game_data import *  # noqa: F401,F403

# ============== SURVIVAL ==============
SURVIVAL_MAX = 100
SURVIVAL_STATS = ["hunger", "thirst", "fatigue"]  # 100 = full, 0 = starving
SURVIVAL_DECAY_PER_ACTION = 6  # decay per mission/explore action
SURVIVAL_WARNING_THRESHOLD = 30

# Food/drink items auto-generated
CONSUMABLE_EXTENSIONS = {
    "ration": {"id":"ration","name":"COMBAT RATION","type":"hunger","power":60,"desc":"Restores 60 HUNGER. Tastes like regret."},
    "water": {"id":"water","name":"FILTERED WATER","type":"thirst","power":70,"desc":"Restores 70 THIRST."},
    "bunk":  {"id":"bunk","name":"BUNK CHIP","type":"fatigue","power":80,"desc":"Restores 80 FATIGUE. Use anywhere."},
}

# ============== SANITY & MORALE ==============
SANITY_MAX = 100
MORALE_MAX = 100

# ============== ALIGNMENT ==============
# Single axis: -100 (RUIN) ... +100 (HONOR). Affects ending text + some shopkeeper/quest reactions.
ALIGNMENT_LABELS = [(-100, "THE UNWRITTEN"), (-60, "APOSTATE"), (-20, "BLACK-TIER"),
                    (20, "FREE EXILE"), (60, "SWORN BLADE"), (100, "AMBER-CROWNED")]

def alignment_label(a: int) -> str:
    name = "FREE EXILE"
    for th, lbl in ALIGNMENT_LABELS:
        if a >= th: name = lbl
    return name

# ============== TRAITS ==============
# Permanent perks earned from specific actions (not level-ups).
TRAITS = {
    "burnt":        {"name":"BURNT ONCE","desc":"+15% BURN resistance. Earned from surviving 5 burns.","trigger":"burns_survived","threshold":5},
    "unflinching":  {"name":"UNFLINCHING","desc":"+5 DEF. Survive a fight below 10% HP.","trigger":"low_hp_wins","threshold":1},
    "ghost":        {"name":"GHOST","desc":"+5% DODGE. Flee 3 fights.","trigger":"flees","threshold":3},
    "reader":       {"name":"THE READER","desc":"+5% CRIT. Read 20 lore fragments.","trigger":"lore_unlocked","threshold":20},
    "wolf":         {"name":"THE WOLF","desc":"+3 ATK. Kill 30 hostiles.","trigger":"kills","threshold":30},
    "weathered":    {"name":"WEATHERED","desc":"-30% FATIGUE decay. Explore in 3 different weathers.","trigger":"weathers_seen","threshold":3},
    "gold_touched": {"name":"GOLD-TOUCHED","desc":"+10% CR from all sources. Give 500 CR to the Gold-Line.","trigger":"gold_donated","threshold":500},
    "spoken_name":  {"name":"SPOKEN NAME","desc":"+15% dmg vs bosses. Reach THE UNMADE.","trigger":"boss_unmade","threshold":1},
}

def trait_stat_bonus(owned_traits: list) -> dict:
    """Convert owned traits into derived bonus dict."""
    b = {"attack":0,"defense":0,"crit_pct":0,"element_dmg_pct":0,"wounded_dmg_pct":0}
    if "unflinching" in owned_traits: b["defense"] += 5
    if "reader" in owned_traits: b["crit_pct"] += 5
    if "wolf" in owned_traits: b["attack"] += 3
    if "ghost" in owned_traits: b["crit_pct"] += 0  # dodge handled separately
    if "spoken_name" in owned_traits: b["wounded_dmg_pct"] += 15
    return b

# ============== WEATHER ==============
WEATHER = {
    "clear":     {"id":"clear","name":"CLEAR SKY","desc":"The galaxy holds its breath. No effects.","color":"#F4F0EB"},
    "rain":      {"id":"rain","name":"ACID RAIN","desc":"-5% accuracy, +5% fatigue drain.","color":"#F5A623","miss_chance":5},
    "amber_storm":{"id":"amber_storm","name":"AMBER STORM","desc":"+10% elemental damage, visibility cut.","color":"#F5A623","element_dmg":10},
    "frost":     {"id":"frost","name":"FROST FRONT","desc":"-15% stamina/explore, +5% def.","color":"#F4F0EB","defense_bonus":5},
    "heat":      {"id":"heat","name":"RED HEAT","desc":"+8 thirst decay, +10% crit.","color":"#D11124","crit_boost":10},
}
def pick_weather(seed: str) -> dict:
    r = random.Random(seed)
    return r.choice(list(WEATHER.values()))

# ============== BOUNTY ==============
# Directorate records crimes. Threshold escalates hostile random encounters.
BOUNTY_THRESHOLDS = [(0,"CLEAN"),(20,"WANTED"),(60,"HUNTED"),(120,"UNDER CONTRACT"),(250,"PUBLIC ENEMY")]
def bounty_label(b:int)->str:
    lbl = "CLEAN"
    for th, l in BOUNTY_THRESHOLDS:
        if b >= th: lbl = l
    return lbl

# ============== COMPANIONS ==============
COMPANIONS = {
    "veyra":   {"id":"veyra","name":"VEYRA","role":"GOLD-LINE ORACLE","element":"amber","cost":800,"hp":80,"atk":14,"assist_pct":12,"dispatch_bonus":1.3,"desc":"Broken prophet. Her whispers lengthen reach."},
    "ezhen":   {"id":"ezhen","name":"EZHEN","role":"DESERTER GUN","element":"kinetic","cost":1200,"hp":140,"atk":22,"assist_pct":18,"dispatch_bonus":1.5,"desc":"Directorate turncoat. Knows where every bunker sleeps."},
    "silk":    {"id":"silk","name":"SILK-BLACK","role":"RED-MARKET PHANTOM","element":"rust","cost":1800,"hp":100,"atk":28,"assist_pct":22,"dispatch_bonus":1.7,"desc":"Three names, no face. Every knife she owns has spoken."},
    "arch5":   {"id":"arch5","name":"ARCH-5","role":"NULL-SEER WARDEN","element":"void","cost":2400,"hp":120,"atk":24,"assist_pct":20,"dispatch_bonus":2.0,"desc":"Excommunicated from the Amber Line. Her silence is a weapon."},
}
def get_companion(cid): return COMPANIONS.get(cid)

# ============== SANCTUM (Player home) ==============
SANCTUM_UPGRADES = {
    "bunk":        {"id":"bunk","name":"REINFORCED BUNK","desc":"Rest recovers all survival stats.","cost":400,"effect":{"rest_full":True}},
    "forge":       {"id":"forge","name":"CRAFTING FORGE","desc":"Crafting costs -20%.","cost":700,"effect":{"craft_discount_pct":20}},
    "archive":     {"id":"archive","name":"CODEX ARCHIVE","desc":"Excavation costs -30%.","cost":900,"effect":{"excavate_discount_pct":30}},
    "wardroom":    {"id":"wardroom","name":"WARDROOM","desc":"+1 companion dispatch slot.","cost":1200,"effect":{"dispatch_slots":1}},
    "relic_shrine":{"id":"relic_shrine","name":"RELIC SHRINE","desc":"+10% CR and XP rewards.","cost":1800,"effect":{"reward_multiplier":1.1}},
    "void_altar":  {"id":"void_altar","name":"VOID ALTAR","desc":"+5% all stats (ascension-like).","cost":3000,"effect":{"stat_multiplier":1.05}},
}

# ============== DISPATCH MISSIONS ==============
DISPATCH_JOBS = [
    {"id":"dj_scrap","name":"SCRAP RUN","desc":"Scour the scarlands for salvage.","duration_sec":600,"reward":{"credits":150,"materials":{"scrap_rust":2}}},
    {"id":"dj_amber","name":"AMBER HARVEST","desc":"Harvest gold-shards from the observatory.","duration_sec":1200,"reward":{"credits":260,"materials":{"gold_shard":3}}},
    {"id":"dj_cache","name":"CACHE HUNT","desc":"Chase rumors of a sealed cache.","duration_sec":1800,"reward":{"credits":420,"materials":{"psi_core":2,"void_glass":1}}},
    {"id":"dj_bounty","name":"BOUNTY CONTRACT","desc":"A contract sits unclaimed.","duration_sec":2400,"reward":{"credits":600,"equipment_tier":3}},
    {"id":"dj_long","name":"DEEP PROSPECT","desc":"Long push into the Zero-Line.","duration_sec":3600,"reward":{"credits":950,"equipment_tier":4,"lore":3}},
]
def get_dispatch(did):
    for d in DISPATCH_JOBS:
        if d["id"] == did: return d
    return None

# ============== PROFESSIONS ==============
PROFESSIONS = {
    "scrapper": {"id":"scrapper","name":"SCRAPPER","desc":"Mastery of salvage. +5% CR per 5 levels.","trigger":"salvage"},
    "reader":   {"id":"reader","name":"READER","desc":"Mastery of codex. -5% excavation per 5 levels.","trigger":"lore"},
    "trader":   {"id":"trader","name":"TRADER","desc":"Mastery of market. -2% prices per 5 levels.","trigger":"market_buys"},
}

# ============== LORE TOMES ==============
LORE_TOMES = [
    {"id":"tome_1","name":"BOOK OF SIGNALS","min_fragments":5,"desc":"Collected transmissions from the outer orbital belts."},
    {"id":"tome_2","name":"OF THE HOLLOW KINGS","min_fragments":15,"desc":"Six kings. Six last words. Five are lies."},
    {"id":"tome_3","name":"AMBER LINE PROPHECIES","min_fragments":30,"desc":"Oracles written before their subjects were born."},
    {"id":"tome_4","name":"THE EXILE REGISTRY","min_fragments":50,"desc":"Names that refused to disappear."},
    {"id":"tome_5","name":"BEYOND THE ZERO-LINE","min_fragments":80,"desc":"Fragments nobody should have written. Someone did."},
]

# ============== DYNAMIC PRICES ==============
# Each day a per-user seed shifts market item prices ±20%.
def price_mod_for(user_id: str, day_index: int, item_id: str) -> float:
    r = random.Random(f"{user_id}:{day_index}:{item_id}")
    return round(0.8 + r.random() * 0.4, 2)  # 0.8 ... 1.2

# ============== COMBAT POSITIONING ==============
STANCES = {
    "front": {"id":"front","name":"FRONT","desc":"+15% DMG dealt, +15% DMG taken.","atk_mult":1.15,"def_mult":0.85},
    "steady":{"id":"steady","name":"STEADY","desc":"Balanced stance. No modifiers.","atk_mult":1.0,"def_mult":1.0},
    "back":  {"id":"back","name":"BACK","desc":"-15% DMG dealt, +25% DMG reduced.","atk_mult":0.85,"def_mult":1.25},
}

# ============== MULTIPLE ENDINGS ==============
# Driven by alignment when /m8 cleared.
ENDINGS = {
    "amber":   {"align_min": 60,  "name":"AMBER ENDING", "text":"The galaxy remembered you. The choir sings your name. You die old and named."},
    "neutral": {"align_min": -60, "name":"NAMELESS ENDING","text":"You walk out of the Zero-Line alone. Nobody writes it down. You write it yourself."},
    "ruin":    {"align_min": -999,"name":"UNWRITTEN ENDING","text":"You take the last name. You keep it. Somewhere, a child is born with it on their tongue."},
}
def resolve_ending(align: int) -> dict:
    if align >= 60: return ENDINGS["amber"]
    if align >= -60: return ENDINGS["neutral"]
    return ENDINGS["ruin"]

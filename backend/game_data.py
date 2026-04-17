"""
AETHER//EXILE — complete static content.
Classes, origins, zones, quests, crafting, factions, daily, arena, market.
"""
import random

# ============== ELEMENTS ==============
WEAKNESS = {"kinetic": ["rust"], "void": ["amber"], "psi": ["kinetic"], "amber": ["void"], "rust": ["psi"]}
ELEMENT_COLOR = {"kinetic": "#F4F0EB", "void": "#D11124", "psi": "#F5A623", "amber": "#F5A623", "rust": "#A80D1D"}
ELEMENT_SIGIL = {"kinetic": "◈", "void": "◎", "psi": "⌬", "amber": "✦", "rust": "⌖"}

# ============== STATUS ==============
STATUS = {
    "bleed":  {"name": "BLEED",  "desc": "Loses 8% max HP/turn. Stacks x3.", "color": "#D11124", "sigil": "✚"},
    "burn":   {"name": "BURN",   "desc": "Loses 6% max HP/turn, -2 ATK.",    "color": "#F5A623", "sigil": "✸"},
    "shock":  {"name": "SHOCK",  "desc": "Skips next action 30%.",           "color": "#F4F0EB", "sigil": "⟁"},
    "marked": {"name": "MARKED", "desc": "Takes +25% damage.",                "color": "#D11124", "sigil": "⊕"},
    "frozen": {"name": "FROZEN", "desc": "ATK halved next turn.",             "color": "#F4F0EB", "sigil": "❄"},
}

# ============== CLASSES ==============
CLASSES = {
    "revenant": {
        "id": "revenant", "name": "REVENANT", "codename": "Iron-Bound Wraith",
        "lore": "Once soldiers of the fallen Sol Directorate. Their flesh rebuilt in salvaged chrome and static prayer.",
        "role": "VANGUARD", "element": "kinetic",
        "base_hp": 140, "base_energy": 60, "base_attack": 18, "base_defense": 12,
        "sigil": "◇", "accent": "#D11124",
        "skills": [
            {"id":"rev_1","name":"SIEGE STRIKE","cost":15,"type":"damage","power":28,"element":"kinetic","status":None,   "desc":"Gauntlet-driven overpressure blow."},
            {"id":"rev_2","name":"IRON VIGIL","cost":20,"type":"shield","power":40,"element":"kinetic","status":None,    "desc":"Lock stance. Absorb incoming damage."},
            {"id":"rev_3","name":"EXECUTIONER","cost":35,"type":"damage","power":55,"element":"rust","status":"bleed",   "desc":"Cleaver finisher. Applies BLEED."},
            {"id":"rev_4","name":"BLOOD RITE","cost":25,"type":"heal","power":35,"element":"kinetic","status":None,       "desc":"Drain the auric reserve."},
        ],
        "ultimate": {"id":"rev_ult","name":"SIEGE // END","element":"kinetic","power":90,"status":"marked","hits":1,
                     "desc":"90 KINETIC damage to all enemies. MARKS survivors."},
    },
    "null_seer": {
        "id": "null_seer", "name": "NULL-SEER", "codename": "Voidsong Oracle",
        "lore": "Heretic psionics who traded their eyes for visions of the Zero-Line.",
        "role": "CASTER", "element": "psi",
        "base_hp": 95, "base_energy": 120, "base_attack": 12, "base_defense": 8,
        "sigil": "⌬", "accent": "#F5A623",
        "skills": [
            {"id":"nul_1","name":"AMBER LANCE","cost":15,"type":"damage","power":26,"element":"amber","status":"burn",   "desc":"Psionic beam. Applies BURN."},
            {"id":"nul_2","name":"VOID COLLAPSE","cost":40,"type":"damage","power":60,"element":"void","status":"shock", "desc":"Folds the air. Chance to SHOCK."},
            {"id":"nul_3","name":"ENTROPY VEIL","cost":25,"type":"shield","power":35,"element":"void","status":None,      "desc":"Probability-static shield."},
            {"id":"nul_4","name":"PULSE MEND","cost":20,"type":"heal","power":40,"element":"psi","status":None,           "desc":"Reverse cellular decay."},
        ],
        "ultimate": {"id":"nul_ult","name":"ZERO // ANNIHILATION","element":"void","power":110,"status":"marked","hits":1,
                     "desc":"110 VOID damage to all enemies. MARKS survivors."},
    },
    "hollow_blade": {
        "id": "hollow_blade", "name": "HOLLOW-BLADE", "codename": "Red-Market Phantom",
        "lore": "Orphans of the neon wreckage. Their knives carry the names of those who wronged them.",
        "role": "STRIKER", "element": "rust",
        "base_hp": 110, "base_energy": 90, "base_attack": 22, "base_defense": 6,
        "sigil": "✕", "accent": "#F4F0EB",
        "skills": [
            {"id":"hol_1","name":"SHIV FLURRY","cost":15,"type":"damage","power":32,"element":"kinetic","status":"bleed", "desc":"Three-blade strike."},
            {"id":"hol_2","name":"VANISH","cost":25,"type":"shield","power":30,"element":"void","status":None,             "desc":"Phase-shift."},
            {"id":"hol_3","name":"MARK OF DEBT","cost":30,"type":"damage","power":48,"element":"rust","status":"marked",  "desc":"Brand the target."},
            {"id":"hol_4","name":"STIM SPIKE","cost":20,"type":"heal","power":30,"element":"kinetic","status":None,        "desc":"Combat stimulant."},
        ],
        "ultimate": {"id":"hol_ult","name":"NAMES UNWRITTEN","element":"rust","power":50,"status":"bleed","hits":3,
                     "desc":"Three strikes. 50 RUST damage each. Each applies BLEED."},
    },
}

# ============== ORIGINS (character backstory) ==============
ORIGINS = [
    {"id":"origin_directorate","name":"DIRECTORATE DESERTER","desc":"You were one of theirs. You burned the ledger before you left.",
     "lore":"The Sol Directorate owed you nothing. You took it anyway.","bonus":{"attack":2,"defense":2}},
    {"id":"origin_orphan","name":"NINTH WARD ORPHAN","desc":"Raised under neon. You learned which silences meant food and which meant knives.",
     "lore":"The Ninth Ward forgets nothing, including you.","bonus":{"agi":1,"str":1,"crit_pct":3}},
    {"id":"origin_seer","name":"EXCOMMUNICATE SEER","desc":"The Amber Line sang to you once. You have not heard it since. You are listening.",
     "lore":"Gold-Line prophets cast you out. You kept the ears.","bonus":{"int":2,"max_energy":20}},
    {"id":"origin_merc","name":"FREELANCE EXILE","desc":"No flag, no god, no roster. Signed contracts in blood and forgot the names.",
     "lore":"The galaxy owes you three times what you asked for.","bonus":{"max_hp":25,"vit":1}},
]

# ============== TERRAINS ==============
TERRAINS = {
    "amber_rain":{"id":"amber_rain","name":"AMBER RAIN","desc":"Golden static. +3 EN regen/turn. Amber skills +20% power.","color":"#F5A623","player_energy_regen":3,"element_boost":{"amber":20}},
    "rust_seas": {"id":"rust_seas","name":"RUST SEAS","desc":"Iron oxide weeps underfoot. BLEED ticks double.","color":"#A80D1D","bleed_multiplier":2},
    "void_fog":  {"id":"void_fog","name":"VOID FOG","desc":"15% chance any attack misses.","color":"#D11124","miss_chance":15},
    "cold_orbit":{"id":"cold_orbit","name":"COLD ORBIT","desc":"All damage -10%. FROZEN lasts longer.","color":"#F4F0EB","damage_reduction":10,"frozen_extend":True},
    "gold_line": {"id":"gold_line","name":"GOLD-LINE SIGNAL","desc":"CRIT +10% for all.","color":"#F5A623","crit_boost":10},
}
MISSION_TERRAINS = {"m3":"void_fog","m4":"rust_seas","m5":"gold_line","m6":"cold_orbit","m7":"amber_rain","m8":"void_fog"}

# ============== ABILITIES ==============
ABILITIES = {
    "strike":       {"name":"STRIKE","kind":"damage","power":14,"element":"kinetic","status":None,"telegraph":"Winds up a heavy swing."},
    "rupture":      {"name":"RUPTURE","kind":"damage","power":20,"element":"rust","status":"bleed","telegraph":"Readies a razored hook."},
    "scream":       {"name":"PSI SCREAM","kind":"damage","power":16,"element":"psi","status":"shock","telegraph":"Hums at the zero-line."},
    "ember_lance":  {"name":"EMBER LANCE","kind":"damage","power":18,"element":"amber","status":"burn","telegraph":"Kindles a golden spear."},
    "void_howl":    {"name":"VOID HOWL","kind":"damage","power":22,"element":"void","status":"marked","telegraph":"Mouth opens into silence."},
    "knit":         {"name":"KNIT","kind":"heal","power":22,"element":"kinetic","status":None,"telegraph":"Reweaving tissue."},
    "brace":        {"name":"BRACE","kind":"shield","power":18,"element":"kinetic","status":None,"telegraph":"Anchors its stance."},
    "freeze_pulse": {"name":"FREEZE PULSE","kind":"damage","power":12,"element":"psi","status":"frozen","telegraph":"Temperature drops."},
    "unmake":       {"name":"UNMAKE","kind":"damage","power":32,"element":"void","status":"marked","telegraph":"A word that is not a word."},
    "flurry":       {"name":"FLURRY","kind":"damage","power":28,"element":"kinetic","status":"bleed","telegraph":"Three blades. Three breaths. Yours."},
    "doom_choir":   {"name":"DOOM CHOIR","kind":"damage","power":34,"element":"amber","status":"burn","telegraph":"The choir begins."},
    "sovereign":    {"name":"SOVEREIGN WORD","kind":"damage","power":42,"element":"void","status":"marked","telegraph":"The name of every one who has fallen."},
    "last_breath":  {"name":"LAST BREATH","kind":"damage","power":48,"element":"rust","status":"bleed","telegraph":"If it dies, so do you."},
}

# ============== ENEMIES ==============
def _e(id, name, tier, hp, atk, dfn, xp, sigil, element, rotation, enrage_rotation, desc):
    return {"id":id,"name":name,"tier":tier,"hp":hp,"attack":atk,"defense":dfn,"xp":xp,"sigil":sigil,"element":element,
            "rotation":rotation,"enrage_rotation":enrage_rotation,"desc":desc}
ENEMIES = {
    "husk_drone":    _e("husk_drone","HUSK DRONE",1,70,12,4,40,"◢","rust",["strike","strike","brace"],None,"Abandoned security unit."),
    "rust_cultist":  _e("rust_cultist","RUST CULTIST",1,85,14,6,55,"†","rust",["strike","rupture","strike"],None,"Worships the radiation."),
    "void_hound":    _e("void_hound","VOID HOUND",2,110,18,5,75,"⌖","void",["rupture","void_howl","strike"],None,"Was a dog. Now hunger."),
    "chrome_reaver": _e("chrome_reaver","CHROME REAVER",2,130,20,10,95,"⚔","kinetic",["strike","brace","rupture","strike"],None,"Razor-plated marauder."),
    "amber_witch":   _e("amber_witch","AMBER WITCH",3,150,24,8,130,"⌬","amber",["ember_lance","scream","knit","ember_lance"],["doom_choir","ember_lance","ember_lance","scream"],"Her shadow bleeds gold."),
    "null_prince":   _e("null_prince","NULL PRINCE",3,190,26,12,170,"♛","void",["void_howl","brace","unmake","strike"],["sovereign","unmake","void_howl","unmake"],"Three hearts. All wrong."),
    "hollow_titan":  _e("hollow_titan","HOLLOW TITAN",4,260,30,16,240,"▲","kinetic",["strike","rupture","brace","strike","knit"],["flurry","rupture","flurry","last_breath"],"Walking cathedral."),
    "the_unmade":    _e("the_unmade","THE UNMADE",5,380,38,20,450,"∞","void",["unmake","void_howl","freeze_pulse","unmake","scream"],["sovereign","unmake","sovereign","last_breath","void_howl"],"It ate its own name."),
}

# ============== MISSIONS ==============
MISSIONS = [
    {"id":"m1","index":1,"name":"SIGNAL // KARNAK-7","location":"Abandoned Orbital Station — Sector KARNAK-7","tier":1,"min_level":1,"xp_reward":60,"credit_reward":120,"enemies":["husk_drone"],
     "briefing":"A distress pulse crawls out of KARNAK-7 on a frequency that died forty years ago.","epilogue":"The drone's core whispered coordinates. Not to a place. To a name. Your name."},
    {"id":"m2","index":2,"name":"THE RUST GOSPEL","location":"Surface Ruin — Old Cascadia","tier":1,"min_level":1,"xp_reward":85,"credit_reward":180,"enemies":["rust_cultist"],
     "briefing":"A cult has nested in a pre-collapse hospital.","epilogue":"In his robes, a photograph. Your face, circled in red."},
    {"id":"m3","index":3,"name":"HUNGER IN THE WIRES","location":"Derelict Freight Line — Exhaust Delta","tier":2,"min_level":2,"xp_reward":120,"credit_reward":260,"enemies":["void_hound","husk_drone"],
     "briefing":"Something is killing the scavenger crews.","epilogue":"Its eyes were full of stars. Something watching through the dog."},
    {"id":"m4","index":4,"name":"THE CHROME MARKET","location":"Low-Orbit Bazaar — Black Tier","tier":2,"min_level":3,"xp_reward":160,"credit_reward":340,"enemies":["chrome_reaver","rust_cultist"],
     "briefing":"The Reaver Queen runs the black tier. She sells names.","epilogue":"The name was written on the inside of her helmet. Your handwriting."},
    {"id":"m5","index":5,"name":"GOLD-LINE FREQUENCY","location":"The Amber Observatory — Ruin Belt 3","tier":3,"min_level":4,"xp_reward":220,"credit_reward":480,"enemies":["amber_witch","void_hound"],
     "briefing":"The Amber Witch has been broadcasting for seven years.","epilogue":"Her last word was a date. Three days from now."},
    {"id":"m6","index":6,"name":"THE PRINCE OF NOTHING","location":"Throne Wreck — Old Imperial Fleet","tier":3,"min_level":5,"xp_reward":300,"credit_reward":650,"enemies":["null_prince","chrome_reaver"],
     "briefing":"He rules a kingdom of corpses.","epilogue":"He said: I will see you soon."},
    {"id":"m7","index":7,"name":"CATHEDRAL OF RUST","location":"The Great Forge — Southern Scarlands","tier":4,"min_level":7,"xp_reward":420,"credit_reward":900,"enemies":["hollow_titan","amber_witch"],
     "briefing":"The Titan wakes with the red sun.","epilogue":"You stood on its shoulder and saw the horizon curve."},
    {"id":"m8","index":8,"name":"THE UNMADE","location":"Beyond the Zero-Line","tier":5,"min_level":9,"xp_reward":650,"credit_reward":1500,"enemies":["the_unmade"],
     "briefing":"The last name. The one that called you.","epilogue":"The galaxy breathes again. You do not know if it is grateful."},
]

# ============== ITEMS (consumables) ==============
ITEMS = {
    "med_patch":   {"id":"med_patch","name":"AUR-PATCH","type":"heal","power":50,"desc":"Restores 50 HP."},
    "energy_cell": {"id":"energy_cell","name":"PSI-CELL","type":"energy","power":40,"desc":"Restores 40 Energy."},
    "grenade":     {"id":"grenade","name":"FRAG CORE","type":"damage","power":45,"desc":"45 KINETIC damage."},
    "purify":      {"id":"purify","name":"PURIFIER","type":"cleanse","power":0,"desc":"Strips all status effects."},
    "overdrive":   {"id":"overdrive","name":"OVERDRIVE","type":"buff","power":0,"desc":"Fills 1 RESONANCE tick."},
    "stim_kit":    {"id":"stim_kit","name":"STIM KIT","type":"stamina","power":50,"desc":"Restores 50 STAMINA."},
}
STARTER_INVENTORY = [
    {"item_id":"med_patch","qty":3},{"item_id":"energy_cell","qty":2},
    {"item_id":"grenade","qty":1},{"item_id":"purify","qty":1},{"item_id":"stim_kit","qty":2},
]

# ============== TALENTS ==============
TALENTS = [
    {"id":"iron_1","branch":"IRON","tier":1,"name":"PLATED CHASSIS","desc":"+15 MAX HP","effect":{"max_hp":15},"prereq":None},
    {"id":"iron_2","branch":"IRON","tier":2,"name":"DEAD-ZONE BRACE","desc":"+4 DEF","effect":{"defense":4},"prereq":"iron_1"},
    {"id":"iron_3","branch":"IRON","tier":3,"name":"BONE CIRCUIT","desc":"+30 MAX HP, +2 DEF","effect":{"max_hp":30,"defense":2},"prereq":"iron_2"},
    {"id":"iron_4","branch":"IRON","tier":4,"name":"REBUKE PROTOCOL","desc":"Reflect 10% damage","effect":{"reflect_pct":10},"prereq":"iron_3"},
    {"id":"iron_5","branch":"IRON","tier":5,"name":"UNKILLABLE","desc":"+60 MAX HP, +20% Heal","effect":{"max_hp":60,"heal_bonus_pct":20},"prereq":"iron_4"},
    {"id":"void_1","branch":"VOID","tier":1,"name":"AMBER CONDUIT","desc":"+15 MAX EN","effect":{"max_energy":15},"prereq":None},
    {"id":"void_2","branch":"VOID","tier":2,"name":"ZERO-LINE FOCUS","desc":"+8% CRIT","effect":{"crit_pct":8},"prereq":"void_1"},
    {"id":"void_3","branch":"VOID","tier":3,"name":"RESONANCE LOOP","desc":"Regen 5 EN/turn","effect":{"energy_regen":5},"prereq":"void_2"},
    {"id":"void_4","branch":"VOID","tier":4,"name":"SHATTER SIGIL","desc":"+15% elemental dmg","effect":{"element_dmg_pct":15},"prereq":"void_3"},
    {"id":"void_5","branch":"VOID","tier":5,"name":"COLLAPSED STAR","desc":"+25 MAX EN, +10% CRIT","effect":{"max_energy":25,"crit_pct":10},"prereq":"void_4"},
    {"id":"blood_1","branch":"BLOOD","tier":1,"name":"RED EDGE","desc":"+3 ATK","effect":{"attack":3},"prereq":None},
    {"id":"blood_2","branch":"BLOOD","tier":2,"name":"HUNGRY STEEL","desc":"Heal 8% dmg dealt","effect":{"lifesteal_pct":8},"prereq":"blood_1"},
    {"id":"blood_3","branch":"BLOOD","tier":3,"name":"MARTYR STANCE","desc":"+25% dmg when below 40% HP","effect":{"wounded_dmg_pct":25},"prereq":"blood_2"},
    {"id":"blood_4","branch":"BLOOD","tier":4,"name":"CARRION RITE","desc":"+15 ATK, bleed stacks +1","effect":{"attack":15,"bleed_bonus":1},"prereq":"blood_3"},
    {"id":"blood_5","branch":"BLOOD","tier":5,"name":"APEX PREDATOR","desc":"+10 ATK, +15% lifesteal","effect":{"attack":10,"lifesteal_pct":15},"prereq":"blood_4"},
]
def get_talent(tid):
    for t in TALENTS:
        if t["id"] == tid: return t
    return None

# ============== STATS ==============
STAT_KEYS = ["str","agi","int","vit"]
STAT_META = {
    "str":{"name":"STR","full":"STRENGTH","desc":"+2 ATK per point","color":"#D11124"},
    "agi":{"name":"AGI","full":"AGILITY","desc":"+0.8% CRIT, +1 DEF per 2","color":"#F4F0EB"},
    "int":{"name":"INT","full":"INTELLECT","desc":"+2 MAX EN, +1% ELEM DMG per 3","color":"#F5A623"},
    "vit":{"name":"VIT","full":"VITALITY","desc":"+8 MAX HP, +1 DEF per 3","color":"#D11124"},
}
def stat_bonuses(stats: dict) -> dict:
    s = stats or {}
    STR, AGI, INT, VIT = s.get("str",0), s.get("agi",0), s.get("int",0), s.get("vit",0)
    return {"attack":STR*2,"crit_pct":round(AGI*0.8),"defense":AGI//2+VIT//3,
            "max_energy":INT*2,"element_dmg_pct":INT//3,"max_hp":VIT*8}

# ============== EQUIPMENT ==============
EQ_PREFIX = ["Carbon","Ashen","Blessed","Ruined","Amber","Void","Scarred","Ninefold","Cracked","Sovereign","Hollow","Gilded","Cursed","Pale","Widow's","Glass"]
EQ_WEAPONS = ["Blade","Lance","Gauntlet","Needle","Hook","Shard","Cipher","Echo","Scar","Edict","Knife"]
EQ_ARMORS = ["Mantle","Hide","Weave","Shell","Veil","Plate","Carapace","Harness","Shroud","Robe","Thornmail"]
EQ_RELICS = ["Heart","Tooth","Eye","Ring","Tether","Coin","Coil","Mask","Chain","Orb","Ossuary","Auric"]

def roll_equipment(tier, seed="", slot=None):
    rng = random.Random(seed) if seed else random
    if slot is None: slot = rng.choice(["weapon","armor","relic"])
    pool = {"weapon":EQ_WEAPONS,"armor":EQ_ARMORS,"relic":EQ_RELICS}[slot]
    base = f"{rng.choice(EQ_PREFIX)} {rng.choice(pool)}"
    t = max(1,min(5,tier))
    stats = {}
    if slot == "weapon":
        stats["attack"] = 3*t + rng.randint(0,t)
        if rng.random() < 0.45: stats["crit_pct"] = 2*t
        if rng.random() < 0.25: stats["lifesteal_pct"] = t
    elif slot == "armor":
        stats["defense"] = 2*t + rng.randint(0,t)
        stats["max_hp"] = 10*t
        if rng.random() < 0.30: stats["reflect_pct"] = 2*t
    else:
        if rng.random() < 0.5: stats["max_energy"] = 8*t
        else: stats["heal_bonus_pct"] = 3*t
        if rng.random() < 0.35: stats["element_dmg_pct"] = 4*t
        if rng.random() < 0.20: stats["energy_regen"] = max(1, t//2)
    return {"item_id":f"eq_{slot}_{t}_{rng.randint(100000,999999)}","slot":slot,"name":base.upper(),"tier":t,"stats":stats}

def reroll_equipment_stat(eq):
    stats = dict(eq["stats"])
    if not stats: return eq
    key = random.choice(list(stats.keys()))
    t = eq["tier"]
    recipes = {"attack":(3*t,t),"defense":(2*t,t),"max_hp":(8*t,4*t),"max_energy":(6*t,4*t),
               "crit_pct":(2*t,2),"heal_bonus_pct":(3*t,2),"element_dmg_pct":(4*t,3),
               "lifesteal_pct":(t,2),"reflect_pct":(2*t,2),"energy_regen":(max(1,t//2),1)}
    base, rng = recipes.get(key, (stats[key], 1))
    stats[key] = max(1, base + random.randint(-1, rng))
    return {**eq, "stats": stats}

# ============== MARKET ==============
MARKET_GOODS = [
    {"id":"med_patch","kind":"consumable","cost":40,"name":"AUR-PATCH","desc":"Restores 50 HP."},
    {"id":"energy_cell","kind":"consumable","cost":50,"name":"PSI-CELL","desc":"Restores 40 Energy."},
    {"id":"grenade","kind":"consumable","cost":90,"name":"FRAG CORE","desc":"45 KINETIC damage."},
    {"id":"purify","kind":"consumable","cost":80,"name":"PURIFIER","desc":"Strips all status."},
    {"id":"overdrive","kind":"consumable","cost":120,"name":"OVERDRIVE","desc":"Fills 1 RESONANCE tick."},
    {"id":"stim_kit","kind":"consumable","cost":60,"name":"STIM KIT","desc":"Restores 50 STAMINA."},
    {"id":"cache_basic","kind":"cache","cost":250,"name":"BASIC CACHE","desc":"Tier 2 equipment.","tier":2},
    {"id":"cache_prime","kind":"cache","cost":650,"name":"PRIME CACHE","desc":"Tier 3 equipment.","tier":3},
    {"id":"cache_apex","kind":"cache","cost":1600,"name":"APEX CACHE","desc":"Tier 4 equipment.","tier":4},
    {"id":"cache_void","kind":"cache","cost":3500,"name":"VOID CACHE","desc":"Tier 5 equipment.","tier":5},
]

# ============== CRAFTING ==============
MATERIALS = {
    "scrap_rust":{"id":"scrap_rust","name":"RUST SCRAP","desc":"Salvaged corroded metal.","color":"#A80D1D"},
    "gold_shard":{"id":"gold_shard","name":"GOLD SHARD","desc":"Fragment of amber-line crystal.","color":"#F5A623"},
    "void_glass":{"id":"void_glass","name":"VOID GLASS","desc":"Glass that reflects nothing.","color":"#D11124"},
    "bone_fiber":{"id":"bone_fiber","name":"BONE FIBER","desc":"Spun marrow-cable.","color":"#F4F0EB"},
    "psi_core":  {"id":"psi_core","name":"PSI CORE","desc":"Humming quartz heart.","color":"#F5A623"},
}
CRAFTING_RECIPES = [
    {"id":"r_patch","name":"AUR-PATCH (x3)","produces":{"item_id":"med_patch","qty":3},"cost_materials":{"bone_fiber":2},"cost_credits":30},
    {"id":"r_cell","name":"PSI-CELL (x2)","produces":{"item_id":"energy_cell","qty":2},"cost_materials":{"psi_core":1},"cost_credits":40},
    {"id":"r_grenade","name":"FRAG CORE","produces":{"item_id":"grenade","qty":1},"cost_materials":{"scrap_rust":2,"void_glass":1},"cost_credits":50},
    {"id":"r_purify","name":"PURIFIER","produces":{"item_id":"purify","qty":1},"cost_materials":{"gold_shard":1,"bone_fiber":1},"cost_credits":60},
    {"id":"r_overdrive","name":"OVERDRIVE","produces":{"item_id":"overdrive","qty":1},"cost_materials":{"psi_core":1,"gold_shard":1},"cost_credits":100},
    {"id":"r_cache_basic","name":"BASIC CACHE","produces":{"kind":"equipment","tier":2},"cost_materials":{"scrap_rust":3,"bone_fiber":2},"cost_credits":150},
    {"id":"r_cache_prime","name":"PRIME CACHE","produces":{"kind":"equipment","tier":3},"cost_materials":{"scrap_rust":4,"gold_shard":3,"psi_core":1},"cost_credits":400},
    {"id":"r_cache_apex","name":"APEX CACHE","produces":{"kind":"equipment","tier":4},"cost_materials":{"gold_shard":4,"void_glass":3,"psi_core":2},"cost_credits":900},
]
def get_recipe(rid):
    for r in CRAFTING_RECIPES:
        if r["id"] == rid: return r
    return None

# ============== ZONES (Exploration) ==============
ZONES = [
    {"id":"z_scarlands","name":"THE SCARLANDS","tier":1,"min_level":1,"stamina_cost":10,"color":"#A80D1D",
     "desc":"A red horizon that does not move. The dust remembers everyone who walked here.",
     "events":[
        {"id":"sc_1","text":"You find a dead contractor. Their dossier is unopened.","choices":[
           {"label":"READ THE DOSSIER","outcome":{"lore":1,"credits":30}},
           {"label":"TAKE THE JACKET","outcome":{"credits":60}},
           {"label":"BURN IT ALL","outcome":{"faction_delta":{"directorate":-5,"exiles":10},"xp":20}},
        ]},
        {"id":"sc_2","text":"A child singing in a language that is not language. They ask your name.","choices":[
           {"label":"LIE","outcome":{"faction_delta":{"exiles":-5},"materials":{"bone_fiber":2}}},
           {"label":"TELL THEM THE TRUTH","outcome":{"faction_delta":{"gold_line":10},"lore":2}},
           {"label":"WALK AWAY","outcome":{"xp":10}},
        ]},
        {"id":"sc_3","text":"Combat — A rust cultist ambushes you from a ditch.","combat":{"enemies":["rust_cultist"]}},
        {"id":"sc_4","text":"You find a cache buried under a rusting signpost.","choices":[
           {"label":"DIG IT UP","outcome":{"credits":120,"materials":{"scrap_rust":3}}},
           {"label":"LEAVE IT","outcome":{"xp":15,"faction_delta":{"gold_line":3}}},
        ]},
     ]},
    {"id":"z_observatory","name":"AMBER OBSERVATORY","tier":2,"min_level":3,"stamina_cost":15,"color":"#F5A623",
     "desc":"Domes that catch golden rain. The telescopes point at something that is not a star.",
     "events":[
        {"id":"ob_1","text":"A seer offers to read your future. She is already weeping.","choices":[
           {"label":"LET HER READ","outcome":{"lore":3,"faction_delta":{"gold_line":8}}},
           {"label":"REFUSE","outcome":{"credits":50}},
           {"label":"ASK WHAT SHE SAW","outcome":{"lore":2,"xp":40,"faction_delta":{"gold_line":4}}},
        ]},
        {"id":"ob_2","text":"Combat — A void hound has followed you into the dome.","combat":{"enemies":["void_hound"]}},
        {"id":"ob_3","text":"Crystalline amber grows from the wall. You can harvest it.","choices":[
           {"label":"HARVEST CAREFULLY","outcome":{"materials":{"gold_shard":4}}},
           {"label":"SMASH AND RUN","outcome":{"materials":{"gold_shard":6},"hp_cost":20}},
        ]},
     ]},
    {"id":"z_bazaar","name":"NINTH BAZAAR","tier":2,"min_level":3,"stamina_cost":15,"color":"#F4F0EB",
     "desc":"A market built in the bones of a freighter. Everything is for sale except mercy.",
     "events":[
        {"id":"bz_1","text":"A Reaver offers you a deal — 200 CR for a locked box.","choices":[
           {"label":"PAY","outcome":{"credits":-200,"materials":{"scrap_rust":2,"psi_core":1,"gold_shard":1}}},
           {"label":"WALK","outcome":{}},
           {"label":"THREATEN","outcome":{"faction_delta":{"reavers":-15,"exiles":5},"materials":{"scrap_rust":1}}},
        ]},
        {"id":"bz_2","text":"Combat — A Chrome Reaver takes offense to your presence.","combat":{"enemies":["chrome_reaver"]}},
        {"id":"bz_3","text":"An old contractor recognises you. She mutters a name. Yours.","choices":[
           {"label":"ASK HER HOW","outcome":{"lore":3,"xp":30}},
           {"label":"IGNORE HER","outcome":{"faction_delta":{"exiles":-3}}},
        ]},
     ]},
    {"id":"z_throne","name":"THRONE WRECK","tier":3,"min_level":5,"stamina_cost":20,"color":"#D11124",
     "desc":"The drifting husk of an imperial flagship. The crew is still inside. Most of them are still polite.",
     "events":[
        {"id":"tw_1","text":"An honor guard blocks the corridor. They ask for the passphrase.","choices":[
           {"label":"SPEAK: IRON","outcome":{"xp":60,"faction_delta":{"directorate":10}}},
           {"label":"SPEAK: EXILE","outcome":{"xp":40,"faction_delta":{"exiles":10,"directorate":-5}}},
           {"label":"DRAW","outcome":{"combat":{"enemies":["chrome_reaver","chrome_reaver"]}}},
        ]},
        {"id":"tw_2","text":"Combat — A Null Prince's herald challenges you.","combat":{"enemies":["chrome_reaver","rust_cultist"]}},
        {"id":"tw_3","text":"You find a cache sealed with the Amber Seal.","choices":[
           {"label":"CRACK THE SEAL","outcome":{"credits":300,"materials":{"void_glass":2,"psi_core":2}}},
           {"label":"LEAVE IT","outcome":{"faction_delta":{"gold_line":6}}},
        ]},
     ]},
    {"id":"z_zero","name":"BEYOND THE ZERO-LINE","tier":4,"min_level":8,"stamina_cost":30,"color":"#D11124",
     "desc":"Nothing should be here. You are. Something takes note.",
     "events":[
        {"id":"zr_1","text":"Combat — An Amber Witch drifts through a broken bulkhead.","combat":{"enemies":["amber_witch"]}},
        {"id":"zr_2","text":"A voice asks if you have found the name yet.","choices":[
           {"label":"SAY: ALMOST","outcome":{"lore":5,"xp":80}},
           {"label":"SAY NOTHING","outcome":{"xp":100,"faction_delta":{"exiles":10}}},
           {"label":"ASK WHOSE VOICE","outcome":{"lore":8}},
        ]},
        {"id":"zr_3","text":"A relic lies on a bench. It hums when you approach.","choices":[
           {"label":"TAKE IT","outcome":{"equipment":{"tier":4,"slot":"relic"}}},
           {"label":"LEAVE IT","outcome":{"xp":40,"faction_delta":{"gold_line":10}}},
        ]},
     ]},
]
def get_zone(zid):
    for z in ZONES:
        if z["id"] == zid: return z
    return None

# ============== QUESTS ==============
QUESTS = [
    {"id":"q_signal","name":"ECHOES OF KARNAK","giver":"The Signal","brief":"The signal repeats your name. Find out why.",
     "required_mission":"m1","xp_reward":150,"credit_reward":300,"faction_reward":{"exiles":20},
     "dialogs":[
       {"id":"d1","text":"The signal has looped for forty years. It never repeats the same name. Until yours.",
        "choices":[
          {"label":"I'LL ANSWER IT","next":"d2","outcome":{}},
          {"label":"IT ISN'T MY NAME","next":"d3","outcome":{}},
        ]},
       {"id":"d2","text":"Then go. And take this — you will need to breathe when the signal returns.","outcome":{"materials":{"psi_core":2,"gold_shard":1}},"end":True},
       {"id":"d3","text":"Names are what we outlive. Go anyway. You know it is yours.","outcome":{"lore":3,"xp":50},"end":True},
     ]},
    {"id":"q_witch","name":"THE AMBER PROMISE","giver":"Lutrei, Broken Oracle","brief":"Lutrei left her last words in three pieces. Collect them.",
     "required_mission":"m5","xp_reward":260,"credit_reward":500,"faction_reward":{"gold_line":25},
     "dialogs":[
       {"id":"d1","text":"She left me the first piece. I cannot carry the last. Will you?",
        "choices":[
          {"label":"I WILL","next":"d2","outcome":{}},
          {"label":"WHAT IS IN IT FOR ME","next":"d3","outcome":{}},
          {"label":"NO","next":"d4","outcome":{"faction_delta":{"gold_line":-10}}},
        ]},
       {"id":"d2","text":"Then take this sigil. The Amber Line will not hide from you.","outcome":{"materials":{"gold_shard":3}},"end":True},
       {"id":"d3","text":"Everything. Your name, clean. Your fate, rewritten. That is the price and the gift.","outcome":{"xp":80,"credits":100},"end":True},
       {"id":"d4","text":"Then it stays unread. As all prophecies do, eventually.","outcome":{"lore":1},"end":True},
     ]},
    {"id":"q_prince","name":"KING OF CORPSES","giver":"Ezhen, Deserter","brief":"End the Null Prince's reign before he remembers yours.",
     "required_mission":"m6","xp_reward":500,"credit_reward":1200,"faction_reward":{"exiles":30,"directorate":15},
     "dialogs":[
       {"id":"d1","text":"He has three hearts. One for every oath he broke. Cut them in reverse order.",
        "choices":[
          {"label":"WHY REVERSE","next":"d2","outcome":{}},
          {"label":"DONE","next":"d3","outcome":{}},
        ]},
       {"id":"d2","text":"Because oaths remember themselves backwards. The first one you cut is the one he meant last.","outcome":{"lore":4},"end":True},
       {"id":"d3","text":"Then go. Do not dream of him tonight.","outcome":{"materials":{"void_glass":3}},"end":True},
     ]},
]
def get_quest(qid):
    for q in QUESTS:
        if q["id"] == qid: return q
    return None
def get_dialog(quest, did):
    for d in quest["dialogs"]:
        if d["id"] == did: return d
    return None

# ============== FACTIONS ==============
FACTIONS = {
    "directorate":{"id":"directorate","name":"SOL DIRECTORATE","color":"#F4F0EB","sigil":"◇","desc":"The fallen military of a galaxy that refused to die. They pay best. They forgive least."},
    "exiles":     {"id":"exiles","name":"THE EXILES","color":"#D11124","sigil":"✕","desc":"Contractors, orphans, black-tier merchants. Honor is negotiable. Memory is not."},
    "gold_line":  {"id":"gold_line","name":"GOLD-LINE CHOIR","color":"#F5A623","sigil":"⌬","desc":"Heretic prophets of the amber broadcast. They see futures that do not want to exist."},
    "reavers":    {"id":"reavers","name":"CHROME REAVERS","color":"#A80D1D","sigil":"⚔","desc":"Razor-tier raiders of the orbital shelves. They sell everything, including your name."},
}
FACTION_RANKS = [(0,"HOSTILE"),(-50,"HATED"),(25,"NEUTRAL"),(75,"RESPECTED"),(150,"HONORED"),(300,"REVERED")]
def rank_for(rep):
    name = "NEUTRAL"
    for threshold, label in sorted(FACTION_RANKS, key=lambda x: x[0]):
        if rep >= threshold: name = label
    if rep < 0: name = "HATED" if rep > -50 else "HOSTILE"
    return name

# ============== DAILY TASKS ==============
DAILY_TASKS = [
    {"id":"dl_combat","name":"3 SUCCESSFUL ENGAGEMENTS","desc":"Win 3 combats today.","target":3,"reward":{"credits":200,"materials":{"scrap_rust":3}}},
    {"id":"dl_crit","name":"5 CRITICAL STRIKES","desc":"Deal 5 crits today.","target":5,"reward":{"credits":120,"materials":{"psi_core":1}}},
    {"id":"dl_explore","name":"EXPLORE 2 ZONES","desc":"Complete 2 zone events.","target":2,"reward":{"credits":150,"materials":{"gold_shard":2}}},
]

# ============== ACHIEVEMENTS ==============
ACHIEVEMENTS = [
    {"id":"first_blood","name":"FIRST BLOOD","desc":"Neutralize your first hostile.","trigger":"kills","threshold":1,"reward_cr":20},
    {"id":"crit_tenfold","name":"OF PRECISION","desc":"Deal 10 critical strikes.","trigger":"crits","threshold":10,"reward_cr":50},
    {"id":"bleed_runner","name":"BLEED RUNNER","desc":"Apply BLEED 20 times.","trigger":"bleeds","threshold":20,"reward_cr":80},
    {"id":"ult_rev","name":"THE WALL COMES","desc":"Unleash REVENANT ultimate.","trigger":"ult_rev","threshold":1,"reward_cr":100},
    {"id":"ult_nul","name":"ZERO-WORD SPOKEN","desc":"Unleash NULL-SEER ultimate.","trigger":"ult_nul","threshold":1,"reward_cr":100},
    {"id":"ult_hol","name":"NAMES UNWRITTEN","desc":"Unleash HOLLOW-BLADE ultimate.","trigger":"ult_hol","threshold":1,"reward_cr":100},
    {"id":"talent_iron","name":"UNKILLABLE","desc":"Max IRON talent branch.","trigger":"iron_maxed","threshold":1,"reward_cr":200},
    {"id":"talent_void","name":"COLLAPSED STAR","desc":"Max VOID talent branch.","trigger":"void_maxed","threshold":1,"reward_cr":200},
    {"id":"talent_blood","name":"APEX","desc":"Max BLOOD talent branch.","trigger":"blood_maxed","threshold":1,"reward_cr":200},
    {"id":"collector","name":"THE COLLECTOR","desc":"Hold 10 pieces of equipment.","trigger":"equip_count","threshold":10,"reward_cr":150},
    {"id":"lore_reader","name":"INFINITE READER","desc":"Unlock 30 lore fragments.","trigger":"lore_unlocked","threshold":30,"reward_cr":150},
    {"id":"arena_10","name":"PIT FIGHTER","desc":"Reach arena wave 10.","trigger":"arena_wave","threshold":10,"reward_cr":250},
    {"id":"arena_25","name":"ARENA MONARCH","desc":"Reach arena wave 25.","trigger":"arena_wave","threshold":25,"reward_cr":600},
    {"id":"ascendant","name":"ASCENDANT","desc":"Ascend once.","trigger":"ascension","threshold":1,"reward_cr":400},
    {"id":"unmade","name":"UNMAKER","desc":"Defeat THE UNMADE.","trigger":"boss_unmade","threshold":1,"reward_cr":800},
    {"id":"campaign","name":"GALAXY-BREATHER","desc":"Clear all 8 missions.","trigger":"missions_done","threshold":8,"reward_cr":500},
    {"id":"crafter","name":"THE MAKER","desc":"Craft 5 items.","trigger":"crafts","threshold":5,"reward_cr":120},
    {"id":"explorer","name":"CARTOGRAPHER","desc":"Complete 15 zone events.","trigger":"zone_events","threshold":15,"reward_cr":250},
    {"id":"faction_honored","name":"HONORED","desc":"Reach HONORED with any faction.","trigger":"faction_honored","threshold":1,"reward_cr":350},
]

# ============== LORE ==============
LORE_NAMES = ["Karnak","Veyra","The Ash-Hand","Sol-9","Orr","Idris","The Lantern","Nhor","Virel","Astet","Mother Red","The Cipher","Ezhen","Kovac","The Hollow King","Tessa","Mercy","Silk-Black","The Pale Senator","Arch-5","Lutrei","The Nameless Curate","Ovid","Nine-Wounds","The Iron Priest","Vex","Seven-Coins","Ash-Of-Names"]
LORE_PLACES = ["The Zero-Line","Old Cascadia","KARNAK-7","the Amber Observatory","the Ninth Bazaar","the Throne Wreck","the Rust Cathedral","the Exhaust Delta","Scarlight","the Seventh Orbital","the Folded Sea","the Drowned Foundry","the Iron Kingdom","the Outer Coil","the Lantern Ward","the Black Tier","the Void Cradle"]
LORE_VERBS = ["knelt to","betrayed","outlived","ate","forgave","unmade","married","buried","mirrored","warned","silenced","translated","erased","counted","remembered","fed","inherited","renamed"]
LORE_ARTIFACTS = ["the Amber Key","a folded prayer","seven red coins","the Mask of Ovid","a broken sigil","the First Voice","a chromed child","the List of Names","one tooth","the Paper Crown","the Nine-Wound Rosary"]
LORE_EVENTS = ["the Collapse","the Long Static","the Night the Stars Stopped","the Third Silence","the Gold War","the Red Winter of 2117","the Unmaking","the Loud Plague","the Zero Event","the Orbital Inquisition"]
LORE_PROPHECIES = [
    "There will be a last contractor. They will wear the name of {name}. They will not return from {place}.",
    "When {name} answers the signal, {place} will remember its true shape.",
    "The galaxy will breathe once more, but only after {event}, and only if {name} kneels first.",
    "{artifact} will pass through three pairs of hands before it finds the one that broke it.",
    "In the year the Amber Line sings, {name} will speak {name2}'s name aloud, and both will die.",
]
LORE_TYPES = ["CODEX","TESTAMENT","FIELD LOG","TRANSMISSION","EPITAPH","ORDINANCE","DREAM-RECORD","PROPHECY","CONFESSION","CITATION","LETTER"]

def _rng(seed: str) -> random.Random:
    return random.Random(seed)

def generate_lore_fragment(idx, user_id):
    r = _rng(f"{user_id}:{idx}")
    kind = r.choice(LORE_TYPES)
    frag_id = f"LF-{idx:05d}"
    name = r.choice(LORE_NAMES)
    name2 = r.choice([n for n in LORE_NAMES if n != name])
    place = r.choice(LORE_PLACES)
    verb = r.choice(LORE_VERBS)
    artifact = r.choice(LORE_ARTIFACTS)
    event = r.choice(LORE_EVENTS)
    templates = [
        f"{name} {verb} {name2} at {place}.",
        f"{kind} of {name}, recovered from {place}: \"I have seen what lives under {event}.\"",
        f"Fragment {frag_id}: Subject {name}. Status: {r.choice(['missing','erased','buried','translated'])}. Note: {r.choice(['the handwriting is yours','the date is tomorrow','the name is illegible'])}.",
        f"They found {artifact} in the hand of {name} after {event}. It was still warm.",
        f"Ordinance {r.randint(100,999)}: mention of {name} at {place} is capital. Signed, {r.choice(LORE_NAMES)}.",
        r.choice(LORE_PROPHECIES).format(name=name,name2=name2,place=place,artifact=artifact,event=event),
        f"On the {r.randint(1,28)}th of {event}, {name} {verb} {artifact} and {place} turned gold. Nobody wrote it down.",
        f"Epitaph at {place}: HERE LIES {name.upper()}. THEY DID NOT ANSWER.",
        f"Letter from {name}: \"I stood at {place} and could not remember why I hated you. Forgive me, then forget me.\"",
    ]
    return {"idx":idx,"id":frag_id,"kind":kind,"title":f"{kind} — {name}","body":r.choice(templates),
            "subject":name,"place":place,"era":event,
            "tags":r.sample(["exile","collapse","rust","amber","zero-line","directorate","witch","prince","static"], k=3)}

LANDING_TICKERS = [
    "AMBER LINE signal detected over KARNAK-7. Do not respond.",
    "THE UNMADE has gained another name. It is not yours. Yet.",
    "A contract arrived this morning. It was signed by you, dated yesterday.",
    "THE RED WINTER returns in 47 days. Stock caches accordingly.",
    "NINE-WOUNDS has been spotted at the Lantern Ward. No body recovered.",
    "The galaxy is not dying. It is being written over.",
    "GOLD-LINE interference across orbital belts. Operatives advised to bring tinted optics.",
    "THE NAMELESS CURATE is accepting confessions. Nobody is returning.",
    "Directive 44-C: any exile who hears their own name in dreams is to report immediately.",
    "Arena wave record broken again. You were not even there.",
]

# ============== UTILS ==============
def xp_for_level(level): return 100 + (level-1) * 80
def get_class(cid): return CLASSES.get(cid)
def get_origin(oid):
    for o in ORIGINS:
        if o["id"] == oid: return o
    return None
def get_enemy(eid): return ENEMIES.get(eid)
def get_mission(mid):
    for m in MISSIONS:
        if m["id"] == mid: return m
    return None
def get_terrain(tid): return TERRAINS.get(tid) if tid else None
def mission_terrain(mid): return get_terrain(MISSION_TERRAINS.get(mid))

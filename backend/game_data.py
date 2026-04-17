"""
AETHER//EXILE — extended static data: classes, enemies, missions, status effects,
elements, talents, equipment, and procedural lore templates.
"""
import random

# ============== ELEMENTS ==============
# Weakness matrix. Attacker element -> list of defender elements that take +30% damage.
WEAKNESS = {
    "kinetic": ["rust"],
    "void":    ["amber"],
    "psi":     ["kinetic"],
    "amber":   ["void"],
    "rust":    ["psi"],
}

ELEMENT_COLOR = {
    "kinetic": "#F4F0EB",
    "void":    "#D11124",
    "psi":     "#F5A623",
    "amber":   "#F5A623",
    "rust":    "#A80D1D",
}

ELEMENT_SIGIL = {
    "kinetic": "◈",
    "void":    "◎",
    "psi":     "⌬",
    "amber":   "✦",
    "rust":    "⌖",
}

# ============== STATUS EFFECTS ==============
# Each effect: duration (turns), per-turn damage (pct of max_hp), or flag
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
        "id": "revenant",
        "name": "REVENANT",
        "codename": "Iron-Bound Wraith",
        "lore": "Once soldiers of the fallen Sol Directorate. Their flesh rebuilt in salvaged chrome and static prayer. They march when all others kneel.",
        "role": "VANGUARD",
        "element": "kinetic",
        "base_hp": 140,
        "base_energy": 60,
        "base_attack": 18,
        "base_defense": 12,
        "sigil": "◇",
        "accent": "#D11124",
        "skills": [
            {"id": "rev_1", "name": "SIEGE STRIKE", "cost": 15, "type": "damage", "power": 28, "element": "kinetic", "status": None,      "desc": "Gauntlet-driven overpressure blow."},
            {"id": "rev_2", "name": "IRON VIGIL",   "cost": 20, "type": "shield", "power": 40, "element": "kinetic", "status": None,      "desc": "Lock stance. Absorb incoming damage."},
            {"id": "rev_3", "name": "EXECUTIONER",  "cost": 35, "type": "damage", "power": 55, "element": "rust",    "status": "bleed",   "desc": "High-cost cleaver finisher. Applies BLEED."},
            {"id": "rev_4", "name": "BLOOD RITE",   "cost": 25, "type": "heal",   "power": 35, "element": "kinetic", "status": None,      "desc": "Drain the auric reserve to knit wounds."},
        ],
    },
    "null_seer": {
        "id": "null_seer",
        "name": "NULL-SEER",
        "codename": "Voidsong Oracle",
        "lore": "Heretic psionics who traded their eyes for visions of the Zero-Line. They whisper at dead frequencies and reality obeys. For a time.",
        "role": "CASTER",
        "element": "psi",
        "base_hp": 95,
        "base_energy": 120,
        "base_attack": 12,
        "base_defense": 8,
        "sigil": "⌬",
        "accent": "#F5A623",
        "skills": [
            {"id": "nul_1", "name": "AMBER LANCE",   "cost": 15, "type": "damage", "power": 26, "element": "amber",   "status": "burn",   "desc": "Focused psionic beam. Applies BURN."},
            {"id": "nul_2", "name": "VOID COLLAPSE", "cost": 40, "type": "damage", "power": 60, "element": "void",    "status": "shock",  "desc": "Fold the air around the target. Chance to SHOCK."},
            {"id": "nul_3", "name": "ENTROPY VEIL",  "cost": 25, "type": "shield", "power": 35, "element": "void",    "status": None,     "desc": "Wrap the self in probability-static."},
            {"id": "nul_4", "name": "PULSE MEND",    "cost": 20, "type": "heal",   "power": 40, "element": "psi",     "status": None,     "desc": "Reverse local cellular decay."},
        ],
    },
    "hollow_blade": {
        "id": "hollow_blade",
        "name": "HOLLOW-BLADE",
        "codename": "Red-Market Phantom",
        "lore": "Orphans of the neon wreckage. They move between heartbeats, their knives carry the names of those who wronged them.",
        "role": "STRIKER",
        "element": "rust",
        "base_hp": 110,
        "base_energy": 90,
        "base_attack": 22,
        "base_defense": 6,
        "sigil": "✕",
        "accent": "#F4F0EB",
        "skills": [
            {"id": "hol_1", "name": "SHIV FLURRY",   "cost": 15, "type": "damage", "power": 32, "element": "kinetic", "status": "bleed",  "desc": "Three-blade rapid strike. Applies BLEED."},
            {"id": "hol_2", "name": "VANISH",        "cost": 25, "type": "shield", "power": 30, "element": "void",    "status": None,     "desc": "Phase-shift. Partial damage absorption."},
            {"id": "hol_3", "name": "MARK OF DEBT",  "cost": 30, "type": "damage", "power": 48, "element": "rust",    "status": "marked", "desc": "Brand the target. Marks them for heavier blows."},
            {"id": "hol_4", "name": "STIM SPIKE",    "cost": 20, "type": "heal",   "power": 30, "element": "kinetic", "status": None,     "desc": "Combat stimulant. Brutal recovery."},
        ],
    },
}

# ============== ENEMY ABILITIES ==============
# Reusable ability pool. Each enemy cycles through a rotation.
ABILITIES = {
    "strike":       {"name": "STRIKE",       "kind": "damage", "power": 14, "element": "kinetic", "status": None,      "telegraph": "Winds up a heavy swing."},
    "rupture":      {"name": "RUPTURE",      "kind": "damage", "power": 20, "element": "rust",    "status": "bleed",   "telegraph": "Readies a razored hook."},
    "scream":       {"name": "PSI SCREAM",   "kind": "damage", "power": 16, "element": "psi",     "status": "shock",   "telegraph": "Hums at the zero-line."},
    "ember_lance":  {"name": "EMBER LANCE",  "kind": "damage", "power": 18, "element": "amber",   "status": "burn",    "telegraph": "Kindles a golden spear."},
    "void_howl":    {"name": "VOID HOWL",    "kind": "damage", "power": 22, "element": "void",    "status": "marked",  "telegraph": "Mouth opens into silence."},
    "knit":         {"name": "KNIT",         "kind": "heal",   "power": 22, "element": "kinetic", "status": None,      "telegraph": "Leaks coolant. Reweaving tissue."},
    "brace":        {"name": "BRACE",        "kind": "shield", "power": 18, "element": "kinetic", "status": None,      "telegraph": "Anchors its stance."},
    "freeze_pulse": {"name": "FREEZE PULSE", "kind": "damage", "power": 12, "element": "psi",     "status": "frozen",  "telegraph": "Temperature drops."},
    "unmake":       {"name": "UNMAKE",       "kind": "damage", "power": 32, "element": "void",    "status": "marked",  "telegraph": "A word that is not a word."},
}

# ============== ENEMIES ==============
def _e(id, name, tier, hp, atk, dfn, xp, sigil, element, weaknesses_from, rotation, desc):
    return {"id": id, "name": name, "tier": tier, "hp": hp, "attack": atk, "defense": dfn, "xp": xp,
            "sigil": sigil, "element": element, "rotation": rotation, "desc": desc}

ENEMIES = {
    "husk_drone":    _e("husk_drone",    "HUSK DRONE",    1,  70, 12,  4,  40, "◢", "rust",    [],         ["strike", "strike", "brace"],                                "Abandoned security unit, still running its final kill-loop."),
    "rust_cultist":  _e("rust_cultist",  "RUST CULTIST",  1,  85, 14,  6,  55, "†", "rust",    [],         ["strike", "rupture", "strike"],                              "Worships the radiation. Sings through cracked teeth."),
    "void_hound":    _e("void_hound",    "VOID HOUND",    2, 110, 18,  5,  75, "⌖", "void",    [],         ["rupture", "void_howl", "strike"],                           "Something that used to be a dog. Now it is only hunger shaped like a dog."),
    "chrome_reaver": _e("chrome_reaver", "CHROME REAVER", 2, 130, 20, 10,  95, "⚔", "kinetic", [],         ["strike", "brace", "rupture", "strike"],                     "Razor-plated marauder of the dead orbital belts."),
    "amber_witch":   _e("amber_witch",   "AMBER WITCH",   3, 150, 24,  8, 130, "⌬", "amber",   [],         ["ember_lance", "scream", "knit", "ember_lance"],             "She speaks in frequencies older than sound. Her shadow bleeds gold."),
    "null_prince":   _e("null_prince",   "NULL PRINCE",   3, 190, 26, 12, 170, "♛", "void",    [],         ["void_howl", "brace", "unmake", "strike"],                   "Warlord of the forgotten dynasties. Three hearts. All of them wrong."),
    "hollow_titan":  _e("hollow_titan",  "HOLLOW TITAN",  4, 260, 30, 16, 240, "▲", "kinetic", [],         ["strike", "rupture", "brace", "strike", "knit"],             "A walking cathedral of rust and ancient war."),
    "the_unmade":    _e("the_unmade",    "THE UNMADE",    5, 380, 38, 20, 450, "∞", "void",    [],         ["unmake", "void_howl", "freeze_pulse", "unmake", "scream"],  "It has no name. It had one. It ate it. Kneel or die standing."),
}

# ============== MISSIONS ==============
MISSIONS = [
    {"id":"m1","index":1,"name":"SIGNAL // KARNAK-7","location":"Abandoned Orbital Station — Sector KARNAK-7","tier":1,"min_level":1,"xp_reward":60,"credit_reward":120,"enemies":["husk_drone"],
     "briefing":"A distress pulse crawls out of KARNAK-7 on a frequency that died forty years ago. The Directorate wants it silenced. You were the cheapest bidder.",
     "epilogue":"The drone's core still whispered coordinates. Not to a place. To a name. Your name."},
    {"id":"m2","index":2,"name":"THE RUST GOSPEL","location":"Surface Ruin — Old Cascadia","tier":1,"min_level":1,"xp_reward":85,"credit_reward":180,"enemies":["rust_cultist"],
     "briefing":"A cult has nested in the bones of a pre-collapse hospital. They say the radiation speaks. You say: not for much longer.",
     "epilogue":"In his robes, a photograph. Your face. Circled in red ink. He was expecting you."},
    {"id":"m3","index":3,"name":"HUNGER IN THE WIRES","location":"Derelict Freight Line — Exhaust Delta","tier":2,"min_level":2,"xp_reward":120,"credit_reward":260,"enemies":["void_hound","husk_drone"],
     "briefing":"Something is killing the scavenger crews. Something that used to be a dog. Track the cold signal. End the hunt.",
     "epilogue":"Its eyes were full of stars. Not yours. Not ours. Something watching through the dog."},
    {"id":"m4","index":4,"name":"THE CHROME MARKET","location":"Low-Orbit Bazaar — Black Tier","tier":2,"min_level":3,"xp_reward":160,"credit_reward":340,"enemies":["chrome_reaver","rust_cultist"],
     "briefing":"The Reaver Queen runs the black tier. She sells names. One of them is yours. She will not sell it to you. You will take it.",
     "epilogue":"The name was written on the inside of her helmet. You recognise the handwriting. It is yours."},
    {"id":"m5","index":5,"name":"GOLD-LINE FREQUENCY","location":"The Amber Observatory — Ruin Belt 3","tier":3,"min_level":4,"xp_reward":220,"credit_reward":480,"enemies":["amber_witch","void_hound"],
     "briefing":"The Amber Witch has been broadcasting for seven years. Nobody answers. Nobody can. Today you will answer in the only language she respects.",
     "epilogue":"Her last word was not a word. It was a date. Three days from now. You feel it behind your eyes already."},
    {"id":"m6","index":6,"name":"THE PRINCE OF NOTHING","location":"Throne Wreck — Old Imperial Fleet","tier":3,"min_level":5,"xp_reward":300,"credit_reward":650,"enemies":["null_prince","chrome_reaver"],
     "briefing":"He rules a kingdom of corpses. He calls it loyalty. You will call it ashes.",
     "epilogue":"He laughed when he fell. Said: I will see you soon. You did not like the way he said it."},
    {"id":"m7","index":7,"name":"CATHEDRAL OF RUST","location":"The Great Forge — Southern Scarlands","tier":4,"min_level":7,"xp_reward":420,"credit_reward":900,"enemies":["hollow_titan","amber_witch"],
     "briefing":"The Titan wakes when the red sun rises. It is rising now. Do not pray. Prayer is what woke it last time.",
     "epilogue":"You stood on its shoulder and saw the horizon curve. You saw what was waiting there. You did not tell anyone."},
    {"id":"m8","index":8,"name":"THE UNMADE","location":"Beyond the Zero-Line","tier":5,"min_level":9,"xp_reward":650,"credit_reward":1500,"enemies":["the_unmade"],
     "briefing":"The last mission. The final name. The one that called you, that circled your face in red, that wrote itself inside a helmet. It has been waiting. It is tired of waiting.",
     "epilogue":"You are still here. That, in itself, is the answer. The galaxy breathes again. You do not know if it is grateful."},
]

# ============== ITEMS (consumables) ==============
ITEMS = {
    "med_patch":   {"id":"med_patch",   "name":"AUR-PATCH",   "type":"heal",   "power":50, "desc":"Auto-knit dermal strip. Restores 50 HP."},
    "energy_cell": {"id":"energy_cell", "name":"PSI-CELL",    "type":"energy", "power":40, "desc":"Charged quartz battery. Restores 40 Energy."},
    "grenade":     {"id":"grenade",     "name":"FRAG CORE",   "type":"damage", "power":45, "desc":"Salvaged ordnance. Hits target for 45 KINETIC."},
    "purify":      {"id":"purify",      "name":"PURIFIER",    "type":"cleanse","power":0,  "desc":"Strips all status effects from self."},
}

STARTER_INVENTORY = [
    {"item_id": "med_patch", "qty": 3},
    {"item_id": "energy_cell", "qty": 2},
    {"item_id": "grenade", "qty": 1},
    {"item_id": "purify", "qty": 1},
]

# ============== TALENT TREE ==============
# Three branches: IRON (tank), VOID (caster), BLOOD (striker). Each has 5 tiers.
# Cost is 1 point per tier. Requires prev tier in same branch.
TALENTS = [
    # IRON branch — survivability / defense
    {"id":"iron_1","branch":"IRON","tier":1,"name":"PLATED CHASSIS",  "desc":"+15 MAX HP",            "effect":{"max_hp": 15},                "prereq": None},
    {"id":"iron_2","branch":"IRON","tier":2,"name":"DEAD-ZONE BRACE", "desc":"+4 DEF",                "effect":{"defense": 4},                 "prereq":"iron_1"},
    {"id":"iron_3","branch":"IRON","tier":3,"name":"BONE CIRCUIT",    "desc":"+30 MAX HP, +2 DEF",    "effect":{"max_hp": 30, "defense": 2},   "prereq":"iron_2"},
    {"id":"iron_4","branch":"IRON","tier":4,"name":"REBUKE PROTOCOL", "desc":"Reflect 10% damage",    "effect":{"reflect_pct": 10},            "prereq":"iron_3"},
    {"id":"iron_5","branch":"IRON","tier":5,"name":"UNKILLABLE",      "desc":"+60 MAX HP, +20% Heal", "effect":{"max_hp": 60, "heal_bonus_pct": 20}, "prereq":"iron_4"},
    # VOID branch — energy / crit
    {"id":"void_1","branch":"VOID","tier":1,"name":"AMBER CONDUIT",    "desc":"+15 MAX EN",                "effect":{"max_energy": 15},       "prereq":None},
    {"id":"void_2","branch":"VOID","tier":2,"name":"ZERO-LINE FOCUS",  "desc":"+8% CRIT",                  "effect":{"crit_pct": 8},          "prereq":"void_1"},
    {"id":"void_3","branch":"VOID","tier":3,"name":"RESONANCE LOOP",   "desc":"Regen 5 EN/turn",           "effect":{"energy_regen": 5},      "prereq":"void_2"},
    {"id":"void_4","branch":"VOID","tier":4,"name":"SHATTER SIGIL",    "desc":"+15% elemental dmg",         "effect":{"element_dmg_pct": 15}, "prereq":"void_3"},
    {"id":"void_5","branch":"VOID","tier":5,"name":"COLLAPSED STAR",   "desc":"+25 MAX EN, +10% CRIT",     "effect":{"max_energy": 25, "crit_pct": 10}, "prereq":"void_4"},
    # BLOOD branch — attack / lifesteal
    {"id":"blood_1","branch":"BLOOD","tier":1,"name":"RED EDGE",       "desc":"+3 ATK",                         "effect":{"attack": 3},            "prereq":None},
    {"id":"blood_2","branch":"BLOOD","tier":2,"name":"HUNGRY STEEL",   "desc":"Heal 8% dmg dealt",              "effect":{"lifesteal_pct": 8},     "prereq":"blood_1"},
    {"id":"blood_3","branch":"BLOOD","tier":3,"name":"MARTYR STANCE",  "desc":"+25% dmg when below 40% HP",     "effect":{"wounded_dmg_pct": 25},  "prereq":"blood_2"},
    {"id":"blood_4","branch":"BLOOD","tier":4,"name":"CARRION RITE",   "desc":"+15 ATK, bleed stacks +1",       "effect":{"attack": 15, "bleed_bonus": 1}, "prereq":"blood_3"},
    {"id":"blood_5","branch":"BLOOD","tier":5,"name":"APEX PREDATOR",  "desc":"+10 ATK, +15% lifesteal",        "effect":{"attack": 10, "lifesteal_pct": 15}, "prereq":"blood_4"},
]

def get_talent(tid):
    for t in TALENTS:
        if t["id"] == tid: return t
    return None

# ============== EQUIPMENT ==============
# Slots: weapon, armor, relic. Tiers 1-5 with scaling mods.
EQUIPMENT_PREFIXES = ["Carbon", "Ashen", "Blessed", "Ruined", "Amber", "Void", "Scarred", "Ninefold", "Cracked", "Sovereign"]
EQUIPMENT_WEAPONS  = ["Blade", "Lance", "Gauntlet", "Needle", "Hook", "Shard", "Cipher", "Echo", "Scar", "Sign"]
EQUIPMENT_ARMORS   = ["Mantle", "Hide", "Weave", "Shell", "Veil", "Plate", "Carapace", "Harness", "Shroud", "Robe"]
EQUIPMENT_RELICS   = ["Heart", "Tooth", "Eye", "Ring", "Tether", "Coin", "Coil", "Mask", "Chain", "Orb"]

def roll_equipment(tier: int, seed: str = "") -> dict:
    rng = random.Random(seed) if seed else random
    slot = rng.choice(["weapon", "armor", "relic"])
    pool = {"weapon": EQUIPMENT_WEAPONS, "armor": EQUIPMENT_ARMORS, "relic": EQUIPMENT_RELICS}[slot]
    base_name = f"{rng.choice(EQUIPMENT_PREFIXES)} {rng.choice(pool)}"
    t = max(1, min(5, tier))
    stats = {}
    if slot == "weapon":
        stats["attack"] = 3 * t + rng.randint(0, t)
        if rng.random() < 0.35: stats["crit_pct"] = 2 * t
    elif slot == "armor":
        stats["defense"] = 2 * t + rng.randint(0, t)
        stats["max_hp"]  = 10 * t
    else:  # relic
        if rng.random() < 0.5:
            stats["max_energy"] = 8 * t
        else:
            stats["heal_bonus_pct"] = 3 * t
        if rng.random() < 0.3: stats["element_dmg_pct"] = 4 * t
    item_id = f"eq_{slot}_{t}_{rng.randint(100000, 999999)}"
    return {"item_id": item_id, "slot": slot, "name": base_name.upper(), "tier": t, "stats": stats}

# ============== LORE ENGINE ==============
LORE_NAMES = ["Karnak", "Veyra", "The Ash-Hand", "Sol-9", "Orr", "Idris", "The Lantern", "Nhor", "Virel", "Astet",
              "Mother Red", "The Cipher", "Ezhen", "Kovac", "The Hollow King", "Tessa", "Mercy", "Silk-Black",
              "The Pale Senator", "Arch-5", "Lutrei", "The Nameless Curate", "Ovid", "Nine-Wounds"]
LORE_PLACES = ["The Zero-Line", "Old Cascadia", "KARNAK-7", "the Amber Observatory", "the Ninth Bazaar", "the Throne Wreck",
               "the Rust Cathedral", "the Exhaust Delta", "Scarlight", "the Seventh Orbital", "the Folded Sea",
               "the Drowned Foundry", "the Iron Kingdom", "the Outer Coil", "the Lantern Ward"]
LORE_VERBS  = ["knelt to", "betrayed", "outlived", "ate", "forgave", "unmade", "married", "buried", "mirrored",
               "warned", "silenced", "translated", "erased", "counted", "remembered", "fed"]
LORE_ARTIFACTS = ["the Amber Key", "a folded prayer", "seven red coins", "the Mask of Ovid", "a broken sigil",
                  "the First Voice", "a chromed child", "the List of Names", "one tooth", "the Paper Crown"]
LORE_EVENTS = ["the Collapse", "the Long Static", "the Night the Stars Stopped", "the Third Silence",
               "the Gold War", "the Red Winter of 2117", "the Unmaking", "the Loud Plague", "the Zero Event"]
LORE_PROPHECIES = [
    "There will be a last contractor. They will wear the name of {name}. They will not return from {place}.",
    "When {name} answers the signal, {place} will remember its true shape and be unmade.",
    "The galaxy will breathe once more, but only after {event}, and only if {name} kneels first.",
    "{artifact} will pass through three pairs of hands before it finds the one that broke it.",
    "In the year the Amber Line sings, {name} will speak {name2}'s name aloud, and both will die.",
]

LORE_TYPES = ["CODEX", "TESTAMENT", "FIELD LOG", "TRANSMISSION", "EPITAPH", "ORDINANCE", "DREAM-RECORD", "PROPHECY", "CONFESSION", "CITATION"]

def _rng(seed: str) -> random.Random:
    return random.Random(seed)

def generate_lore_fragment(idx: int, user_id: str) -> dict:
    """Deterministic lore fragment from a seeded RNG — feels infinite, is reproducible per user."""
    r = _rng(f"{user_id}:{idx}")
    kind = r.choice(LORE_TYPES)
    frag_id = f"LF-{idx:05d}"
    name = r.choice(LORE_NAMES)
    name2 = r.choice([n for n in LORE_NAMES if n != name])
    place = r.choice(LORE_PLACES)
    verb  = r.choice(LORE_VERBS)
    artifact = r.choice(LORE_ARTIFACTS)
    event = r.choice(LORE_EVENTS)

    templates = [
        f"{name} {verb} {name2} at {place}, and there were no witnesses, only witnesses.",
        f"The {kind.lower()} of {name}, recovered from {place}: \"I have seen what lives under {event}. It is patient. It is counting.\"",
        f"Fragment {frag_id} // context: {event}. Subject: {name}. Status: {r.choice(['missing', 'erased', 'buried', 'returned', 'translated'])}. Notes: {r.choice(['the handwriting is yours', 'the date is tomorrow', 'the name is illegible', 'the voice is singing', 'the signal repeats'])}.",
        f"They found {artifact} in the hand of {name} after {event}. It was still warm. It is warm now.",
        f"Ordinance {r.randint(100,999)}-{r.choice(['A','B','C','D'])}: Any mention of {name} in or around {place} is a capital offence. Signed, {r.choice(LORE_NAMES)}.",
        f"Dream-record, {name}: \"I dreamt of {place}. You were there. You were already dead. You were laughing.\"",
        r.choice(LORE_PROPHECIES).format(name=name, name2=name2, place=place, artifact=artifact, event=event),
        f"On the {r.randint(1,28)}th night of {event}, {name} {verb} {artifact} and the air above {place} turned gold for nine seconds. Nobody wrote it down. Except this.",
        f"Epitaph carved on the gates of {place}: HERE LIES {name.upper()}. THEY DID NOT ANSWER.",
        f"Last transmission of {name} before the {r.choice(['signal', 'line', 'orbit', 'prayer'])} collapsed: \"tell the {r.choice(['exile','contractor','heir','witness','child'])} the name is still alive. tell them to run.\"",
    ]
    body = r.choice(templates)
    tags = r.sample(["exile", "collapse", "rust", "amber", "zero-line", "directorate", "witch", "prince", "static", "naming"], k=3)
    return {
        "idx": idx,
        "id": frag_id,
        "kind": kind,
        "title": f"{kind} — {name}",
        "body": body,
        "subject": name,
        "place": place,
        "era": event,
        "tags": tags,
    }


# ============== UTILS ==============
def xp_for_level(level: int) -> int:
    return 100 + (level - 1) * 80

def get_class(class_id: str):   return CLASSES.get(class_id)
def get_enemy(enemy_id: str):   return ENEMIES.get(enemy_id)
def get_mission(mission_id: str):
    for m in MISSIONS:
        if m["id"] == mission_id: return m
    return None

"""
AETHER//EXILE — Static game data.
A post-apocalyptic cyber-space RPG where the last of humanity drift through the bones of dead stars.
"""

# ============== CLASSES ==============
CLASSES = {
    "revenant": {
        "id": "revenant",
        "name": "REVENANT",
        "codename": "Iron-Bound Wraith",
        "lore": "Once soldiers of the fallen Sol Directorate. Their flesh rebuilt in salvaged chrome and static prayer. They march when all others kneel.",
        "role": "VANGUARD",
        "base_hp": 140,
        "base_energy": 60,
        "base_attack": 18,
        "base_defense": 12,
        "sigil": "◇",
        "accent": "#D11124",
        "skills": [
            {"id": "rev_1", "name": "SIEGE STRIKE", "cost": 15, "type": "damage", "power": 28, "desc": "Gauntlet-driven overpressure blow."},
            {"id": "rev_2", "name": "IRON VIGIL", "cost": 20, "type": "shield", "power": 40, "desc": "Lock stance. Absorb incoming damage."},
            {"id": "rev_3", "name": "EXECUTIONER", "cost": 35, "type": "damage", "power": 55, "desc": "High-cost cleaver finisher. Crit-heavy."},
            {"id": "rev_4", "name": "BLOOD RITE", "cost": 25, "type": "heal", "power": 35, "desc": "Drain the auric reserve to knit wounds."},
        ],
    },
    "null_seer": {
        "id": "null_seer",
        "name": "NULL-SEER",
        "codename": "Voidsong Oracle",
        "lore": "Heretic psionics who traded their eyes for visions of the Zero-Line. They whisper at dead frequencies and reality obeys. For a time.",
        "role": "CASTER",
        "base_hp": 95,
        "base_energy": 120,
        "base_attack": 12,
        "base_defense": 8,
        "sigil": "⌬",
        "accent": "#F5A623",
        "skills": [
            {"id": "nul_1", "name": "AMBER LANCE", "cost": 15, "type": "damage", "power": 26, "desc": "Focused psionic beam along the gold-line."},
            {"id": "nul_2", "name": "VOID COLLAPSE", "cost": 40, "type": "damage", "power": 60, "desc": "Fold the air around the target. Devastating."},
            {"id": "nul_3", "name": "ENTROPY VEIL", "cost": 25, "type": "shield", "power": 35, "desc": "Wrap the self in probability-static."},
            {"id": "nul_4", "name": "PULSE MEND", "cost": 20, "type": "heal", "power": 40, "desc": "Reverse local cellular decay."},
        ],
    },
    "hollow_blade": {
        "id": "hollow_blade",
        "name": "HOLLOW-BLADE",
        "codename": "Red-Market Phantom",
        "lore": "Orphans of the neon wreckage. They move between heartbeats, their knives carry the names of those who wronged them.",
        "role": "STRIKER",
        "base_hp": 110,
        "base_energy": 90,
        "base_attack": 22,
        "base_defense": 6,
        "sigil": "✕",
        "accent": "#F4F0EB",
        "skills": [
            {"id": "hol_1", "name": "SHIV FLURRY", "cost": 15, "type": "damage", "power": 32, "desc": "Three-blade rapid strike. Bleeds crit."},
            {"id": "hol_2", "name": "VANISH", "cost": 25, "type": "shield", "power": 30, "desc": "Phase-shift. Next blow misses."},
            {"id": "hol_3", "name": "MARK OF DEBT", "cost": 30, "type": "damage", "power": 48, "desc": "Brand the target. Strike and punish."},
            {"id": "hol_4", "name": "STIM SPIKE", "cost": 20, "type": "heal", "power": 30, "desc": "Combat stimulant. Brutal recovery."},
        ],
    },
}

# ============== ENEMIES ==============
ENEMIES = {
    "husk_drone": {"id": "husk_drone", "name": "HUSK DRONE", "tier": 1, "hp": 70, "attack": 12, "defense": 4, "xp": 40, "sigil": "◢", "desc": "Abandoned security unit, still running its final kill-loop."},
    "rust_cultist": {"id": "rust_cultist", "name": "RUST CULTIST", "tier": 1, "hp": 85, "attack": 14, "defense": 6, "xp": 55, "sigil": "†", "desc": "Worships the radiation. Sings through cracked teeth."},
    "void_hound": {"id": "void_hound", "name": "VOID HOUND", "tier": 2, "hp": 110, "attack": 18, "defense": 5, "xp": 75, "sigil": "⌖", "desc": "Something that used to be a dog. Now it is only hunger shaped like a dog."},
    "chrome_reaver": {"id": "chrome_reaver", "name": "CHROME REAVER", "tier": 2, "hp": 130, "attack": 20, "defense": 10, "xp": 95, "sigil": "⚔", "desc": "Razor-plated marauder of the dead orbital belts."},
    "amber_witch": {"id": "amber_witch", "name": "AMBER WITCH", "tier": 3, "hp": 150, "attack": 24, "defense": 8, "xp": 130, "sigil": "⌬", "desc": "She speaks in frequencies older than sound. Her shadow bleeds gold."},
    "null_prince": {"id": "null_prince", "name": "NULL PRINCE", "tier": 3, "hp": 190, "attack": 26, "defense": 12, "xp": 170, "sigil": "♛", "desc": "Warlord of the forgotten dynasties. Three hearts. All of them wrong."},
    "hollow_titan": {"id": "hollow_titan", "name": "HOLLOW TITAN", "tier": 4, "hp": 260, "attack": 30, "defense": 16, "xp": 240, "sigil": "▲", "desc": "A walking cathedral of rust and ancient war."},
    "the_unmade": {"id": "the_unmade", "name": "THE UNMADE", "tier": 5, "hp": 380, "attack": 38, "defense": 20, "xp": 450, "sigil": "∞", "desc": "It has no name. It had one. It ate it. Kneel or die standing."},
}

# ============== MISSIONS ==============
MISSIONS = [
    {
        "id": "m1",
        "index": 1,
        "name": "SIGNAL // KARNAK-7",
        "location": "Abandoned Orbital Station — Sector KARNAK-7",
        "tier": 1,
        "min_level": 1,
        "xp_reward": 60,
        "credit_reward": 120,
        "enemies": ["husk_drone"],
        "briefing": "A distress pulse crawls out of KARNAK-7 on a frequency that died forty years ago. The Directorate wants it silenced. You were the cheapest bidder.",
        "epilogue": "The drone's core still whispered coordinates. Not to a place. To a name. Your name.",
    },
    {
        "id": "m2",
        "index": 2,
        "name": "THE RUST GOSPEL",
        "location": "Surface Ruin — Old Cascadia",
        "tier": 1,
        "min_level": 1,
        "xp_reward": 85,
        "credit_reward": 180,
        "enemies": ["rust_cultist"],
        "briefing": "A cult has nested in the bones of a pre-collapse hospital. They say the radiation speaks. You say: not for much longer.",
        "epilogue": "In his robes, a photograph. Your face. Circled in red ink. He was expecting you.",
    },
    {
        "id": "m3",
        "index": 3,
        "name": "HUNGER IN THE WIRES",
        "location": "Derelict Freight Line — Exhaust Delta",
        "tier": 2,
        "min_level": 2,
        "xp_reward": 120,
        "credit_reward": 260,
        "enemies": ["void_hound", "husk_drone"],
        "briefing": "Something is killing the scavenger crews. Something that used to be a dog. Track the cold signal. End the hunt.",
        "epilogue": "Its eyes were full of stars. Not yours. Not ours. Something watching through the dog.",
    },
    {
        "id": "m4",
        "index": 4,
        "name": "THE CHROME MARKET",
        "location": "Low-Orbit Bazaar — Black Tier",
        "tier": 2,
        "min_level": 3,
        "xp_reward": 160,
        "credit_reward": 340,
        "enemies": ["chrome_reaver", "rust_cultist"],
        "briefing": "The Reaver Queen runs the black tier. She sells names. One of them is yours. She will not sell it to you. You will take it.",
        "epilogue": "The name was written on the inside of her helmet. You recognise the handwriting. It is yours.",
    },
    {
        "id": "m5",
        "index": 5,
        "name": "GOLD-LINE FREQUENCY",
        "location": "The Amber Observatory — Ruin Belt 3",
        "tier": 3,
        "min_level": 4,
        "xp_reward": 220,
        "credit_reward": 480,
        "enemies": ["amber_witch", "void_hound"],
        "briefing": "The Amber Witch has been broadcasting for seven years. Nobody answers. Nobody can. Today you will answer in the only language she respects.",
        "epilogue": "Her last word was not a word. It was a date. Three days from now. You feel it behind your eyes already.",
    },
    {
        "id": "m6",
        "index": 6,
        "name": "THE PRINCE OF NOTHING",
        "location": "Throne Wreck — Old Imperial Fleet",
        "tier": 3,
        "min_level": 5,
        "xp_reward": 300,
        "credit_reward": 650,
        "enemies": ["null_prince", "chrome_reaver"],
        "briefing": "He rules a kingdom of corpses. He calls it loyalty. You will call it ashes.",
        "epilogue": "He laughed when he fell. Said: I will see you soon. You did not like the way he said it.",
    },
    {
        "id": "m7",
        "index": 7,
        "name": "CATHEDRAL OF RUST",
        "location": "The Great Forge — Southern Scarlands",
        "tier": 4,
        "min_level": 7,
        "xp_reward": 420,
        "credit_reward": 900,
        "enemies": ["hollow_titan", "amber_witch"],
        "briefing": "The Titan wakes when the red sun rises. It is rising now. Do not pray. Prayer is what woke it last time.",
        "epilogue": "You stood on its shoulder and saw the horizon curve. You saw what was waiting there. You did not tell anyone.",
    },
    {
        "id": "m8",
        "index": 8,
        "name": "THE UNMADE",
        "location": "Beyond the Zero-Line",
        "tier": 5,
        "min_level": 9,
        "xp_reward": 650,
        "credit_reward": 1500,
        "enemies": ["the_unmade"],
        "briefing": "The last mission. The final name. The one that called you, that circled your face in red, that wrote itself inside a helmet. It has been waiting. It is tired of waiting.",
        "epilogue": "You are still here. That, in itself, is the answer. The galaxy breathes again. You do not know if it is grateful.",
    },
]

# ============== ITEMS ==============
ITEMS = {
    "med_patch": {"id": "med_patch", "name": "AUR-PATCH", "type": "heal", "power": 50, "desc": "Auto-knit dermal strip. Restores 50 HP."},
    "energy_cell": {"id": "energy_cell", "name": "PSI-CELL", "type": "energy", "power": 40, "desc": "Charged quartz battery. Restores 40 Energy."},
    "grenade": {"id": "grenade", "name": "FRAG CORE", "type": "damage", "power": 45, "desc": "Salvaged ordnance. Hits target for 45."},
}

STARTER_INVENTORY = [
    {"item_id": "med_patch", "qty": 3},
    {"item_id": "energy_cell", "qty": 2},
    {"item_id": "grenade", "qty": 1},
]


def xp_for_level(level: int) -> int:
    """XP required to reach the next level."""
    return 100 + (level - 1) * 80


def get_class(class_id: str):
    return CLASSES.get(class_id)


def get_enemy(enemy_id: str):
    return ENEMIES.get(enemy_id)


def get_mission(mission_id: str):
    for m in MISSIONS:
        if m["id"] == mission_id:
            return m
    return None

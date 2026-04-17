"""
AETHER//EXILE — conteúdo estático completo (PT-PT).
Classes, origens, zonas, missões, artesanato, facções, diário, arena, mercado.
"""
import random

# ============== ELEMENTOS ==============
WEAKNESS = {"kinetic": ["rust"], "void": ["amber"], "psi": ["kinetic"], "amber": ["void"], "rust": ["psi"]}
ELEMENT_COLOR = {"kinetic": "#F4F0EB", "void": "#E31230", "psi": "#F5A623", "amber": "#F5A623", "rust": "#A80D1D"}
ELEMENT_SIGIL = {"kinetic": "◈", "void": "◎", "psi": "⌬", "amber": "✦", "rust": "⌖"}
ELEMENT_LABEL = {"kinetic": "CINÉTICO", "void": "VAZIO", "psi": "PSI", "amber": "ÂMBAR", "rust": "FERRUGEM"}

# ============== ESTADO ==============
STATUS = {
    "bleed":  {"name": "HEMORRAGIA",  "desc": "Perde 8% da vida máx/ronda. Acumula até x3.", "color": "#E31230", "sigil": "✚"},
    "burn":   {"name": "QUEIMADURA",   "desc": "Perde 6% da vida máx/ronda, -2 ATQ.",    "color": "#F5A623", "sigil": "✸"},
    "shock":  {"name": "CHOQUE",  "desc": "30% de hipótese de falhar a próxima ação.",           "color": "#F4F0EB", "sigil": "⟁"},
    "marked": {"name": "MARCADO", "desc": "Recebe +25% de dano.",                "color": "#E31230", "sigil": "⊕"},
    "frozen": {"name": "CONGELADO", "desc": "ATQ reduzido a metade na próxima ronda.",             "color": "#F4F0EB", "sigil": "❄"},
}

# ============== CLASSES ==============
CLASSES = {
    "revenant": {
        "id": "revenant", "name": "REVENANT", "codename": "Espectro Acorrentado",
        "lore": "Outrora soldados do caído Directorate Sol. A carne deles reconstruída em crómio salvado e oração estática.",
        "role": "VANGUARDA", "element": "kinetic",
        "base_hp": 140, "base_energy": 60, "base_attack": 18, "base_defense": 12,
        "sigil": "◇", "accent": "#E31230",
        "skills": [
            {"id":"rev_1","name":"GOLPE DE CERCO","cost":15,"type":"damage","power":28,"element":"kinetic","status":None,   "desc":"Ataque de sobrecarga com manopla."},
            {"id":"rev_2","name":"VIGÍLIA DE FERRO","cost":20,"type":"shield","power":40,"element":"kinetic","status":None,    "desc":"Trava a postura. Absorve dano."},
            {"id":"rev_3","name":"CARRASCO","cost":35,"type":"damage","power":55,"element":"rust","status":"bleed",   "desc":"Finalizador de cutelo. Aplica HEMORRAGIA."},
            {"id":"rev_4","name":"RITO DE SANGUE","cost":25,"type":"heal","power":35,"element":"kinetic","status":None,       "desc":"Drena a reserva áurica."},
        ],
        "ultimate": {"id":"rev_ult","name":"CERCO // FIM","element":"kinetic","power":90,"status":"marked","hits":1,
                     "desc":"90 de dano CINÉTICO a todos os inimigos. MARCA sobreviventes."},
    },
    "null_seer": {
        "id": "null_seer", "name": "NULL-SEER", "codename": "Oráculo da Canção do Vazio",
        "lore": "Psiónicos hereges que trocaram os olhos por visões da Linha Zero.",
        "role": "CONJURADOR", "element": "psi",
        "base_hp": 95, "base_energy": 120, "base_attack": 12, "base_defense": 8,
        "sigil": "⌬", "accent": "#F5A623",
        "skills": [
            {"id":"nul_1","name":"LANÇA DE ÂMBAR","cost":15,"type":"damage","power":26,"element":"amber","status":"burn",   "desc":"Feixe psiónico. Aplica QUEIMADURA."},
            {"id":"nul_2","name":"COLAPSO DO VAZIO","cost":40,"type":"damage","power":60,"element":"void","status":"shock", "desc":"Dobra o ar. Hipótese de CHOQUE."},
            {"id":"nul_3","name":"VÉU DE ENTROPIA","cost":25,"type":"shield","power":35,"element":"void","status":None,      "desc":"Escudo de estática de probabilidade."},
            {"id":"nul_4","name":"REGENERAR","cost":20,"type":"heal","power":40,"element":"psi","status":None,           "desc":"Reverte decaimento celular."},
        ],
        "ultimate": {"id":"nul_ult","name":"ZERO // ANIQUILAÇÃO","element":"void","power":110,"status":"marked","hits":1,
                     "desc":"110 de dano VAZIO a todos. MARCA sobreviventes."},
    },
    "hollow_blade": {
        "id": "hollow_blade", "name": "HOLLOW-BLADE", "codename": "Fantasma do Mercado Vermelho",
        "lore": "Órfãos dos destroços neon. As suas facas carregam os nomes de quem lhes fez mal.",
        "role": "ASSASSINO", "element": "rust",
        "base_hp": 110, "base_energy": 90, "base_attack": 22, "base_defense": 6,
        "sigil": "✕", "accent": "#F4F0EB",
        "skills": [
            {"id":"hol_1","name":"RAJADA DE FACAS","cost":15,"type":"damage","power":32,"element":"kinetic","status":"bleed", "desc":"Três ataques rápidos."},
            {"id":"hol_2","name":"DESVANECER","cost":25,"type":"shield","power":30,"element":"void","status":None,             "desc":"Mudança de fase."},
            {"id":"hol_3","name":"MARCA DA DÍVIDA","cost":30,"type":"damage","power":48,"element":"rust","status":"marked",  "desc":"Marca o alvo."},
            {"id":"hol_4","name":"ESTIMULANTE","cost":20,"type":"heal","power":30,"element":"kinetic","status":None,        "desc":"Estimulante de combate."},
        ],
        "ultimate": {"id":"hol_ult","name":"NOMES DESESCRITOS","element":"rust","power":50,"status":"bleed","hits":3,
                     "desc":"Três golpes. 50 de dano FERRUGEM cada. Cada um aplica HEMORRAGIA."},
    },
}

# ============== ORIGENS (história inicial) ==============
ORIGINS = [
    {"id":"origin_directorate","name":"DESERTOR DO DIRECTORATE","desc":"Foste um deles. Queimaste o livro-razão antes de partires.",
     "lore":"O Directorate Sol não te devia nada. Levaste na mesma.","bonus":{"attack":2,"defense":2}},
    {"id":"origin_orphan","name":"ÓRFÃO DO BAIRRO NONO","desc":"Criado sob néon. Aprendeste que silêncios significam comida e quais significam facas.",
     "lore":"O Bairro Nono não esquece nada, incluindo tu.","bonus":{"agi":1,"str":1,"crit_pct":3}},
    {"id":"origin_seer","name":"VIDENTE EXCOMUNGADO","desc":"A Linha Âmbar cantou-te uma vez. Já não a ouves. Estás à escuta.",
     "lore":"Os profetas da Linha Dourada expulsaram-te. Ficaste com os ouvidos.","bonus":{"int":2,"max_energy":20}},
    {"id":"origin_merc","name":"EXILADO FREELANCE","desc":"Sem bandeira, sem deus, sem quadro. Assinaste contratos a sangue e esqueceste os nomes.",
     "lore":"A galáxia deve-te o triplo do que pediste.","bonus":{"max_hp":25,"vit":1}},
]

# ============== TERRENOS ==============
TERRAINS = {
    "amber_rain":{"id":"amber_rain","name":"CHUVA ÂMBAR","desc":"Estática dourada. +3 regen EN/ronda. Perícias ÂMBAR +20% potência.","color":"#F5A623","player_energy_regen":3,"element_boost":{"amber":20}},
    "rust_seas": {"id":"rust_seas","name":"MARES DE FERRUGEM","desc":"Óxido de ferro chora sob os pés. HEMORRAGIA duplica.","color":"#A80D1D","bleed_multiplier":2},
    "void_fog":  {"id":"void_fog","name":"NÉVOA DO VAZIO","desc":"15% de hipótese de qualquer ataque falhar.","color":"#E31230","miss_chance":15},
    "cold_orbit":{"id":"cold_orbit","name":"ÓRBITA FRIA","desc":"Todo o dano -10%. CONGELADO dura mais.","color":"#F4F0EB","damage_reduction":10,"frozen_extend":True},
    "gold_line": {"id":"gold_line","name":"SINAL LINHA DOURADA","desc":"CRIT +10% para todos.","color":"#F5A623","crit_boost":10},
}
MISSION_TERRAINS = {"m3":"void_fog","m4":"rust_seas","m5":"gold_line","m6":"cold_orbit","m7":"amber_rain","m8":"void_fog"}

# ============== HABILIDADES (inimigos) ==============
ABILITIES = {
    "strike":       {"name":"GOLPE","kind":"damage","power":14,"element":"kinetic","status":None,"telegraph":"Prepara um balanço pesado."},
    "rupture":      {"name":"RUPTURA","kind":"damage","power":20,"element":"rust","status":"bleed","telegraph":"Prepara um gancho afiado."},
    "scream":       {"name":"GRITO PSI","kind":"damage","power":16,"element":"psi","status":"shock","telegraph":"Vibra na linha zero."},
    "ember_lance":  {"name":"LANÇA DE BRASA","kind":"damage","power":18,"element":"amber","status":"burn","telegraph":"Acende uma lança dourada."},
    "void_howl":    {"name":"UIVO DO VAZIO","kind":"damage","power":22,"element":"void","status":"marked","telegraph":"A boca abre-se em silêncio."},
    "knit":         {"name":"TECER","kind":"heal","power":22,"element":"kinetic","status":None,"telegraph":"A entrelaçar tecido."},
    "brace":        {"name":"FIRMAR","kind":"shield","power":18,"element":"kinetic","status":None,"telegraph":"Fixa a postura."},
    "freeze_pulse": {"name":"PULSO GELADO","kind":"damage","power":12,"element":"psi","status":"frozen","telegraph":"A temperatura cai."},
    "unmake":       {"name":"DESFAZER","kind":"damage","power":32,"element":"void","status":"marked","telegraph":"Uma palavra que não é palavra."},
    "flurry":       {"name":"RAJADA","kind":"damage","power":28,"element":"kinetic","status":"bleed","telegraph":"Três lâminas. Três respirações. As tuas."},
    "doom_choir":   {"name":"CORO DO FIM","kind":"damage","power":34,"element":"amber","status":"burn","telegraph":"O coro começa."},
    "sovereign":    {"name":"PALAVRA SOBERANA","kind":"damage","power":42,"element":"void","status":"marked","telegraph":"O nome de cada um que caiu."},
    "last_breath":  {"name":"ÚLTIMO FÔLEGO","kind":"damage","power":48,"element":"rust","status":"bleed","telegraph":"Se ele morre, tu também."},
}

# ============== INIMIGOS ==============
def _e(id, name, tier, hp, atk, dfn, xp, sigil, element, rotation, enrage_rotation, desc):
    return {"id":id,"name":name,"tier":tier,"hp":hp,"attack":atk,"defense":dfn,"xp":xp,"sigil":sigil,"element":element,
            "rotation":rotation,"enrage_rotation":enrage_rotation,"desc":desc}
ENEMIES = {
    "husk_drone":    _e("husk_drone","DRONE VAZIO",1,70,12,4,40,"◢","rust",["strike","strike","brace"],None,"Unidade de segurança abandonada."),
    "rust_cultist":  _e("rust_cultist","CULTISTA DA FERRUGEM",1,85,14,6,55,"†","rust",["strike","rupture","strike"],None,"Adora a radiação."),
    "void_hound":    _e("void_hound","SABUJO DO VAZIO",2,110,18,5,75,"⌖","void",["rupture","void_howl","strike"],None,"Era um cão. Agora é fome."),
    "chrome_reaver": _e("chrome_reaver","PIRATA CRÓMIO",2,130,20,10,95,"⚔","kinetic",["strike","brace","rupture","strike"],None,"Saqueador de lâminas afiadas."),
    "amber_witch":   _e("amber_witch","FEITICEIRA ÂMBAR",3,150,24,8,130,"⌬","amber",["ember_lance","scream","knit","ember_lance"],["doom_choir","ember_lance","ember_lance","scream"],"A sombra dela sangra ouro."),
    "null_prince":   _e("null_prince","PRÍNCIPE NULO",3,190,26,12,170,"♛","void",["void_howl","brace","unmake","strike"],["sovereign","unmake","void_howl","unmake"],"Três corações. Todos errados."),
    "hollow_titan":  _e("hollow_titan","TITÃ OCO",4,260,30,16,240,"▲","kinetic",["strike","rupture","brace","strike","knit"],["flurry","rupture","flurry","last_breath"],"Catedral ambulante."),
    "the_unmade":    _e("the_unmade","O DESFEITO",5,380,38,20,450,"∞","void",["unmake","void_howl","freeze_pulse","unmake","scream"],["sovereign","unmake","sovereign","last_breath","void_howl"],"Comeu o próprio nome."),
}

# ============== MISSÕES ==============
MISSIONS = [
    {"id":"m1","index":1,"name":"SINAL // KARNAK-7","location":"Estação Orbital Abandonada — Setor KARNAK-7","tier":1,"min_level":1,"xp_reward":60,"credit_reward":120,"enemies":["husk_drone"],
     "briefing":"Um pulso de emergência sai de KARNAK-7 numa frequência que morreu há quarenta anos.","epilogue":"O núcleo do drone ainda sussurrava coordenadas. Não para um lugar. Para um nome. O teu nome."},
    {"id":"m2","index":2,"name":"O EVANGELHO DA FERRUGEM","location":"Ruína de Superfície — Velha Cascádia","tier":1,"min_level":1,"xp_reward":85,"credit_reward":180,"enemies":["rust_cultist"],
     "briefing":"Um culto instalou-se num hospital pré-colapso.","epilogue":"Nas vestes dele, uma fotografia. A tua cara, rodeada a vermelho."},
    {"id":"m3","index":3,"name":"FOME NOS CABOS","location":"Linha de Carga Derelicta — Delta de Exaustão","tier":2,"min_level":2,"xp_reward":120,"credit_reward":260,"enemies":["void_hound","husk_drone"],
     "briefing":"Algo anda a matar as tripulações de catadores.","epilogue":"Os olhos estavam cheios de estrelas. Algo a observar através do cão."},
    {"id":"m4","index":4,"name":"O MERCADO CRÓMIO","location":"Bazar Baixa-Órbita — Nível Negro","tier":2,"min_level":3,"xp_reward":160,"credit_reward":340,"enemies":["chrome_reaver","rust_cultist"],
     "briefing":"A Rainha dos Piratas controla o nível negro. Vende nomes.","epilogue":"O nome estava escrito dentro do capacete dela. Letra tua."},
    {"id":"m5","index":5,"name":"FREQUÊNCIA LINHA DOURADA","location":"O Observatório Âmbar — Cinturão de Ruínas 3","tier":3,"min_level":4,"xp_reward":220,"credit_reward":480,"enemies":["amber_witch","void_hound"],
     "briefing":"A Feiticeira Âmbar tem transmitido há sete anos.","epilogue":"A última palavra dela foi uma data. Daqui a três dias."},
    {"id":"m6","index":6,"name":"O PRÍNCIPE DO NADA","location":"Trono Destroçado — Antiga Frota Imperial","tier":3,"min_level":5,"xp_reward":300,"credit_reward":650,"enemies":["null_prince","chrome_reaver"],
     "briefing":"Ele reina sobre um reino de cadáveres.","epilogue":"Ele disse: Vejo-te em breve."},
    {"id":"m7","index":7,"name":"CATEDRAL DE FERRUGEM","location":"A Grande Forja — Terras Cicatriz do Sul","tier":4,"min_level":7,"xp_reward":420,"credit_reward":900,"enemies":["hollow_titan","amber_witch"],
     "briefing":"O Titã desperta com o sol vermelho.","epilogue":"Subiste ao ombro dele e viste o horizonte curvar."},
    {"id":"m8","index":8,"name":"O DESFEITO","location":"Para Além da Linha Zero","tier":5,"min_level":9,"xp_reward":650,"credit_reward":1500,"enemies":["the_unmade"],
     "briefing":"O último nome. O que te chamou.","epilogue":"A galáxia respira novamente. Não sabes se está grata."},
]

# ============== ITENS (consumíveis) ==============
ITEMS = {
    "med_patch":   {"id":"med_patch","name":"KIT MÉDICO","type":"heal","power":50,"desc":"Restaura 50 de VIDA."},
    "energy_cell": {"id":"energy_cell","name":"CÉLULA PSI","type":"energy","power":40,"desc":"Restaura 40 de EN."},
    "grenade":     {"id":"grenade","name":"GRANADA","type":"damage","power":45,"desc":"45 de dano CINÉTICO."},
    "purify":      {"id":"purify","name":"PURIFICADOR","type":"cleanse","power":0,"desc":"Remove todos os efeitos de estado."},
    "overdrive":   {"id":"overdrive","name":"OVERDRIVE","type":"buff","power":0,"desc":"Enche 1 carga de RESSONÂNCIA."},
    "stim_kit":    {"id":"stim_kit","name":"ESTIMULANTE","type":"stamina","power":50,"desc":"Restaura 50 de STAMINA."},
}
STARTER_INVENTORY = [
    {"item_id":"med_patch","qty":3},{"item_id":"energy_cell","qty":2},
    {"item_id":"grenade","qty":1},{"item_id":"purify","qty":1},{"item_id":"stim_kit","qty":2},
]

# ============== TALENTOS ==============
TALENTS = [
    {"id":"iron_1","branch":"IRON","tier":1,"name":"CHASSIS BLINDADO","desc":"+15 VIDA MÁX","effect":{"max_hp":15},"prereq":None},
    {"id":"iron_2","branch":"IRON","tier":2,"name":"SUPORTE ZONA-MORTA","desc":"+4 DEF","effect":{"defense":4},"prereq":"iron_1"},
    {"id":"iron_3","branch":"IRON","tier":3,"name":"CIRCUITO ÓSSEO","desc":"+30 VIDA MÁX, +2 DEF","effect":{"max_hp":30,"defense":2},"prereq":"iron_2"},
    {"id":"iron_4","branch":"IRON","tier":4,"name":"PROTOCOLO REPREENSÃO","desc":"Reflete 10% do dano","effect":{"reflect_pct":10},"prereq":"iron_3"},
    {"id":"iron_5","branch":"IRON","tier":5,"name":"INEXTINGUÍVEL","desc":"+60 VIDA MÁX, +20% Cura","effect":{"max_hp":60,"heal_bonus_pct":20},"prereq":"iron_4"},
    {"id":"void_1","branch":"VOID","tier":1,"name":"CONDUTA ÂMBAR","desc":"+15 EN MÁX","effect":{"max_energy":15},"prereq":None},
    {"id":"void_2","branch":"VOID","tier":2,"name":"FOCO LINHA-ZERO","desc":"+8% CRIT","effect":{"crit_pct":8},"prereq":"void_1"},
    {"id":"void_3","branch":"VOID","tier":3,"name":"CICLO DE RESSONÂNCIA","desc":"Regen 5 EN/ronda","effect":{"energy_regen":5},"prereq":"void_2"},
    {"id":"void_4","branch":"VOID","tier":4,"name":"SIGILO DE FRACTURA","desc":"+15% dano elemental","effect":{"element_dmg_pct":15},"prereq":"void_3"},
    {"id":"void_5","branch":"VOID","tier":5,"name":"ESTRELA COLAPSADA","desc":"+25 EN MÁX, +10% CRIT","effect":{"max_energy":25,"crit_pct":10},"prereq":"void_4"},
    {"id":"blood_1","branch":"BLOOD","tier":1,"name":"LÂMINA VERMELHA","desc":"+3 ATQ","effect":{"attack":3},"prereq":None},
    {"id":"blood_2","branch":"BLOOD","tier":2,"name":"AÇO FAMINTO","desc":"Cura 8% do dano causado","effect":{"lifesteal_pct":8},"prereq":"blood_1"},
    {"id":"blood_3","branch":"BLOOD","tier":3,"name":"POSTURA DE MÁRTIR","desc":"+25% dano abaixo de 40% VIDA","effect":{"wounded_dmg_pct":25},"prereq":"blood_2"},
    {"id":"blood_4","branch":"BLOOD","tier":4,"name":"RITO CARNIÇA","desc":"+15 ATQ, acumulação HEMORRAGIA +1","effect":{"attack":15,"bleed_bonus":1},"prereq":"blood_3"},
    {"id":"blood_5","branch":"BLOOD","tier":5,"name":"PREDADOR SUPREMO","desc":"+10 ATQ, +15% roubo de vida","effect":{"attack":10,"lifesteal_pct":15},"prereq":"blood_4"},
]
BRANCH_LABEL = {"IRON": "FERRO", "VOID": "VAZIO", "BLOOD": "SANGUE"}
def get_talent(tid):
    for t in TALENTS:
        if t["id"] == tid: return t
    return None

# ============== ATRIBUTOS ==============
STAT_KEYS = ["str","agi","int","vit"]
STAT_META = {
    "str":{"name":"FOR","full":"FORÇA","desc":"+2 ATQ por ponto","color":"#E31230"},
    "agi":{"name":"AGI","full":"AGILIDADE","desc":"+0.8% CRIT, +1 DEF a cada 2","color":"#F4F0EB"},
    "int":{"name":"INT","full":"INTELECTO","desc":"+2 EN MÁX, +1% DANO ELEM a cada 3","color":"#F5A623"},
    "vit":{"name":"VIT","full":"VITALIDADE","desc":"+8 VIDA MÁX, +1 DEF a cada 3","color":"#E31230"},
}
def stat_bonuses(stats: dict) -> dict:
    s = stats or {}
    STR, AGI, INT, VIT = s.get("str",0), s.get("agi",0), s.get("int",0), s.get("vit",0)
    return {"attack":STR*2,"crit_pct":round(AGI*0.8),"defense":AGI//2+VIT//3,
            "max_energy":INT*2,"element_dmg_pct":INT//3,"max_hp":VIT*8}

# ============== EQUIPAMENTO ==============
EQ_PREFIX = ["Carbono","Cinza","Bendito","Arruinado","Âmbar","Vazio","Cicatrizado","Nóno","Rachado","Soberano","Oco","Dourado","Maldito","Pálido","da Viúva","Vidro"]
EQ_WEAPONS = ["Lâmina","Lança","Manopla","Agulha","Gancho","Estilhaço","Cifra","Eco","Cicatriz","Édito","Faca"]
EQ_ARMORS = ["Manto","Pele","Trama","Casco","Véu","Placa","Carapaça","Arnês","Sudário","Toga","Cota de Espinhos"]
EQ_RELICS = ["Coração","Dente","Olho","Anel","Amarra","Moeda","Bobina","Máscara","Corrente","Orbe","Ossário","Áurico"]

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

# ============== MERCADO ==============
MARKET_GOODS = [
    {"id":"med_patch","kind":"consumable","cost":40,"name":"AUR-PATCH","desc":"Restaura 50 de VIDA."},
    {"id":"energy_cell","kind":"consumable","cost":50,"name":"CÉLULA PSI","desc":"Restaura 40 de Energia."},
    {"id":"grenade","kind":"consumable","cost":90,"name":"NÚCLEO DE FRAGMENTAÇÃO","desc":"45 de dano CINÉTICO."},
    {"id":"purify","kind":"consumable","cost":80,"name":"PURIFICADOR","desc":"Remove todos os estados."},
    {"id":"overdrive","kind":"consumable","cost":120,"name":"OVERDRIVE","desc":"Enche 1 carga de RESSONÂNCIA."},
    {"id":"stim_kit","kind":"consumable","cost":60,"name":"ESTIMULANTE","desc":"Restaura 50 de STAMINA."},
    {"id":"cache_basic","kind":"cache","cost":250,"name":"BAÚ BÁSICO","desc":"Equipamento de Nível 2.","tier":2},
    {"id":"cache_prime","kind":"cache","cost":650,"name":"BAÚ PRIMÁRIO","desc":"Equipamento de Nível 3.","tier":3},
    {"id":"cache_apex","kind":"cache","cost":1600,"name":"BAÚ APEX","desc":"Equipamento de Nível 4.","tier":4},
    {"id":"cache_void","kind":"cache","cost":3500,"name":"BAÚ DO VAZIO","desc":"Equipamento de Nível 5.","tier":5},
]

# ============== ARTESANATO ==============
MATERIALS = {
    "scrap_rust":{"id":"scrap_rust","name":"SUCATA DE FERRUGEM","desc":"Metal corroído recuperado.","color":"#A80D1D"},
    "gold_shard":{"id":"gold_shard","name":"ESTILHAÇO DOURADO","desc":"Fragmento de cristal linha-âmbar.","color":"#F5A623"},
    "void_glass":{"id":"void_glass","name":"VIDRO DO VAZIO","desc":"Vidro que nada reflete.","color":"#E31230"},
    "bone_fiber":{"id":"bone_fiber","name":"FIBRA ÓSSEA","desc":"Cabo de medula fiada.","color":"#F4F0EB"},
    "psi_core":  {"id":"psi_core","name":"NÚCLEO PSI","desc":"Coração de quartzo pulsante.","color":"#F5A623"},
}
CRAFTING_RECIPES = [
    {"id":"r_patch","name":"AUR-PATCH (x3)","produces":{"item_id":"med_patch","qty":3},"cost_materials":{"bone_fiber":2},"cost_credits":30},
    {"id":"r_cell","name":"CÉLULA PSI (x2)","produces":{"item_id":"energy_cell","qty":2},"cost_materials":{"psi_core":1},"cost_credits":40},
    {"id":"r_grenade","name":"NÚCLEO DE FRAGMENTAÇÃO","produces":{"item_id":"grenade","qty":1},"cost_materials":{"scrap_rust":2,"void_glass":1},"cost_credits":50},
    {"id":"r_purify","name":"PURIFICADOR","produces":{"item_id":"purify","qty":1},"cost_materials":{"gold_shard":1,"bone_fiber":1},"cost_credits":60},
    {"id":"r_overdrive","name":"OVERDRIVE","produces":{"item_id":"overdrive","qty":1},"cost_materials":{"psi_core":1,"gold_shard":1},"cost_credits":100},
    {"id":"r_cache_basic","name":"BAÚ BÁSICO","produces":{"kind":"equipment","tier":2},"cost_materials":{"scrap_rust":3,"bone_fiber":2},"cost_credits":150},
    {"id":"r_cache_prime","name":"BAÚ PRIMÁRIO","produces":{"kind":"equipment","tier":3},"cost_materials":{"scrap_rust":4,"gold_shard":3,"psi_core":1},"cost_credits":400},
    {"id":"r_cache_apex","name":"BAÚ APEX","produces":{"kind":"equipment","tier":4},"cost_materials":{"gold_shard":4,"void_glass":3,"psi_core":2},"cost_credits":900},
]
def get_recipe(rid):
    for r in CRAFTING_RECIPES:
        if r["id"] == rid: return r
    return None

# ============== ZONAS (Exploração) ==============
ZONES = [
    {"id":"z_scarlands","name":"AS TERRAS CICATRIZ","tier":1,"min_level":1,"stamina_cost":10,"color":"#A80D1D",
     "desc":"Um horizonte vermelho que não se move. O pó lembra-se de todos os que passaram por aqui.",
     "events":[
        {"id":"sc_1","text":"Encontras um contratado morto. O dossiê dele está fechado.","choices":[
           {"label":"LER O DOSSIÊ","outcome":{"lore":1,"credits":30}},
           {"label":"LEVAR O CASACO","outcome":{"credits":60}},
           {"label":"QUEIMAR TUDO","outcome":{"faction_delta":{"directorate":-5,"exiles":10},"xp":20}},
        ]},
        {"id":"sc_2","text":"Uma criança a cantar numa língua que não é língua. Pergunta o teu nome.","choices":[
           {"label":"MENTIR","outcome":{"faction_delta":{"exiles":-5},"materials":{"bone_fiber":2}}},
           {"label":"DIZER A VERDADE","outcome":{"faction_delta":{"gold_line":10},"lore":2}},
           {"label":"IR EMBORA","outcome":{"xp":10}},
        ]},
        {"id":"sc_3","text":"Combate — Um cultista da ferrugem embosca-te de uma vala.","combat":{"enemies":["rust_cultist"]}},
        {"id":"sc_4","text":"Encontras um baú enterrado sob um poste enferrujado.","choices":[
           {"label":"DESENTERRAR","outcome":{"credits":120,"materials":{"scrap_rust":3}}},
           {"label":"DEIXAR","outcome":{"xp":15,"faction_delta":{"gold_line":3}}},
        ]},
     ]},
    {"id":"z_observatory","name":"OBSERVATÓRIO ÂMBAR","tier":2,"min_level":3,"stamina_cost":15,"color":"#F5A623",
     "desc":"Cúpulas que apanham chuva dourada. Os telescópios apontam para algo que não é estrela.",
     "events":[
        {"id":"ob_1","text":"Uma vidente oferece-se para ler o teu futuro. Já está a chorar.","choices":[
           {"label":"DEIXÁ-LA LER","outcome":{"lore":3,"faction_delta":{"gold_line":8}}},
           {"label":"RECUSAR","outcome":{"credits":50}},
           {"label":"PERGUNTAR O QUE VIU","outcome":{"lore":2,"xp":40,"faction_delta":{"gold_line":4}}},
        ]},
        {"id":"ob_2","text":"Combate — Um sabujo do vazio seguiu-te até à cúpula.","combat":{"enemies":["void_hound"]}},
        {"id":"ob_3","text":"Âmbar cristalino cresce da parede. Podes colhê-lo.","choices":[
           {"label":"COLHER COM CUIDADO","outcome":{"materials":{"gold_shard":4}}},
           {"label":"PARTIR E FUGIR","outcome":{"materials":{"gold_shard":6},"hp_cost":20}},
        ]},
     ]},
    {"id":"z_bazaar","name":"BAZAR NONO","tier":2,"min_level":3,"stamina_cost":15,"color":"#F4F0EB",
     "desc":"Um mercado construído nos ossos de um cargueiro. Tudo está à venda exceto clemência.",
     "events":[
        {"id":"bz_1","text":"Um Pirata oferece-te um negócio — 200 CR por uma caixa trancada.","choices":[
           {"label":"PAGAR","outcome":{"credits":-200,"materials":{"scrap_rust":2,"psi_core":1,"gold_shard":1}}},
           {"label":"IR EMBORA","outcome":{}},
           {"label":"AMEAÇAR","outcome":{"faction_delta":{"reavers":-15,"exiles":5},"materials":{"scrap_rust":1}}},
        ]},
        {"id":"bz_2","text":"Combate — Um Pirata Crómio ofende-se com a tua presença.","combat":{"enemies":["chrome_reaver"]}},
        {"id":"bz_3","text":"Uma velha contratada reconhece-te. Murmura um nome. O teu.","choices":[
           {"label":"PERGUNTAR COMO","outcome":{"lore":3,"xp":30}},
           {"label":"IGNORAR","outcome":{"faction_delta":{"exiles":-3}}},
        ]},
     ]},
    {"id":"z_throne","name":"DESTROÇOS DO TRONO","tier":3,"min_level":5,"stamina_cost":20,"color":"#E31230",
     "desc":"O casco à deriva de uma nave-almirante imperial. A tripulação ainda está lá dentro. A maioria ainda é educada.",
     "events":[
        {"id":"tw_1","text":"Uma guarda de honra bloqueia o corredor. Pedem a palavra-passe.","choices":[
           {"label":"DIZER: FERRO","outcome":{"xp":60,"faction_delta":{"directorate":10}}},
           {"label":"DIZER: EXÍLIO","outcome":{"xp":40,"faction_delta":{"exiles":10,"directorate":-5}}},
           {"label":"SACAR DA ARMA","outcome":{"combat":{"enemies":["chrome_reaver","chrome_reaver"]}}},
        ]},
        {"id":"tw_2","text":"Combate — Um arauto do Príncipe Nulo desafia-te.","combat":{"enemies":["chrome_reaver","rust_cultist"]}},
        {"id":"tw_3","text":"Encontras um baú selado com o Selo Âmbar.","choices":[
           {"label":"FORÇAR O SELO","outcome":{"credits":300,"materials":{"void_glass":2,"psi_core":2}}},
           {"label":"DEIXAR","outcome":{"faction_delta":{"gold_line":6}}},
        ]},
     ]},
    {"id":"z_zero","name":"PARA ALÉM DA LINHA ZERO","tier":4,"min_level":8,"stamina_cost":30,"color":"#E31230",
     "desc":"Nada devia estar aqui. Tu estás. Algo toma nota.",
     "events":[
        {"id":"zr_1","text":"Combate — Uma Feiticeira Âmbar atravessa uma antepara partida.","combat":{"enemies":["amber_witch"]}},
        {"id":"zr_2","text":"Uma voz pergunta se já encontraste o nome.","choices":[
           {"label":"DIZER: QUASE","outcome":{"lore":5,"xp":80}},
           {"label":"NÃO DIZER NADA","outcome":{"xp":100,"faction_delta":{"exiles":10}}},
           {"label":"PERGUNTAR DE QUEM É A VOZ","outcome":{"lore":8}},
        ]},
        {"id":"zr_3","text":"Uma relíquia jaz num banco. Zumbe quando te aproximas.","choices":[
           {"label":"LEVAR","outcome":{"equipment":{"tier":4,"slot":"relic"}}},
           {"label":"DEIXAR","outcome":{"xp":40,"faction_delta":{"gold_line":10}}},
        ]},
     ]},
]
def get_zone(zid):
    for z in ZONES:
        if z["id"] == zid: return z
    return None

# ============== MISSÕES SECUNDÁRIAS ==============
QUESTS = [
    {"id":"q_signal","name":"ECOS DE KARNAK","giver":"O Sinal","brief":"O sinal repete o teu nome. Descobre porquê.",
     "required_mission":"m1","xp_reward":150,"credit_reward":300,"faction_reward":{"exiles":20},
     "dialogs":[
       {"id":"d1","text":"O sinal anda em loop há quarenta anos. Nunca repete o mesmo nome. Até ao teu.",
        "choices":[
          {"label":"VOU RESPONDER","next":"d2","outcome":{}},
          {"label":"NÃO É O MEU NOME","next":"d3","outcome":{}},
        ]},
       {"id":"d2","text":"Então vai. E leva isto — vais precisar de respirar quando o sinal voltar.","outcome":{"materials":{"psi_core":2,"gold_shard":1}},"end":True},
       {"id":"d3","text":"Nomes são o que sobrevivemos. Vai na mesma. Sabes que é o teu.","outcome":{"lore":3,"xp":50},"end":True},
     ]},
    {"id":"q_witch","name":"A PROMESSA ÂMBAR","giver":"Lutrei, Oráculo Partida","brief":"Lutrei deixou as últimas palavras em três pedaços. Recolhe-os.",
     "required_mission":"m5","xp_reward":260,"credit_reward":500,"faction_reward":{"gold_line":25},
     "dialogs":[
       {"id":"d1","text":"Ela deixou-me o primeiro pedaço. Não consigo carregar o último. Carregas tu?",
        "choices":[
          {"label":"CARREGO","next":"d2","outcome":{}},
          {"label":"O QUE GANHO COM ISSO","next":"d3","outcome":{}},
          {"label":"NÃO","next":"d4","outcome":{"faction_delta":{"gold_line":-10}}},
        ]},
       {"id":"d2","text":"Então leva este sigilo. A Linha Âmbar não se esconderá de ti.","outcome":{"materials":{"gold_shard":3}},"end":True},
       {"id":"d3","text":"Tudo. O teu nome, limpo. O teu destino, reescrito. É o preço e é o presente.","outcome":{"xp":80,"credits":100},"end":True},
       {"id":"d4","text":"Então fica por ler. Como todas as profecias, eventualmente.","outcome":{"lore":1},"end":True},
     ]},
    {"id":"q_prince","name":"REI DOS CADÁVERES","giver":"Ezhen, Desertor","brief":"Acaba com o reinado do Príncipe Nulo antes que ele se lembre do teu.",
     "required_mission":"m6","xp_reward":500,"credit_reward":1200,"faction_reward":{"exiles":30,"directorate":15},
     "dialogs":[
       {"id":"d1","text":"Ele tem três corações. Um por cada juramento que quebrou. Corta-os em ordem inversa.",
        "choices":[
          {"label":"PORQUÊ INVERSA","next":"d2","outcome":{}},
          {"label":"FEITO","next":"d3","outcome":{}},
        ]},
       {"id":"d2","text":"Porque juramentos lembram-se de trás para a frente. O primeiro que cortares é o que ele quis dizer por último.","outcome":{"lore":4},"end":True},
       {"id":"d3","text":"Então vai. Não sonhes com ele esta noite.","outcome":{"materials":{"void_glass":3}},"end":True},
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

# ============== FACÇÕES ==============
FACTIONS = {
    "directorate":{"id":"directorate","name":"DIRECTORATE SOL","color":"#F4F0EB","sigil":"◇","desc":"O exército caído de uma galáxia que recusou morrer. Pagam melhor. Perdoam menos."},
    "exiles":     {"id":"exiles","name":"OS EXILADOS","color":"#E31230","sigil":"✕","desc":"Contratados, órfãos, mercadores de nível negro. A honra é negociável. A memória não."},
    "gold_line":  {"id":"gold_line","name":"CORO LINHA DOURADA","color":"#F5A623","sigil":"⌬","desc":"Profetas hereges da transmissão âmbar. Veem futuros que não querem existir."},
    "reavers":    {"id":"reavers","name":"PIRATAS CRÓMIO","color":"#A80D1D","sigil":"⚔","desc":"Assaltantes afiados das prateleiras orbitais. Vendem tudo, incluindo o teu nome."},
}
FACTION_RANKS = [(0,"HOSTIL"),(-50,"ODIADO"),(25,"NEUTRO"),(75,"RESPEITADO"),(150,"HONRADO"),(300,"VENERADO")]
def rank_for(rep):
    name = "NEUTRO"
    for threshold, label in sorted(FACTION_RANKS, key=lambda x: x[0]):
        if rep >= threshold: name = label
    if rep < 0: name = "ODIADO" if rep > -50 else "HOSTIL"
    return name

# ============== TAREFAS DIÁRIAS ==============
DAILY_TASKS = [
    {"id":"dl_combat","name":"3 COMBATES BEM-SUCEDIDOS","desc":"Vence 3 combates hoje.","target":3,"reward":{"credits":200,"materials":{"scrap_rust":3}}},
    {"id":"dl_crit","name":"5 GOLPES CRÍTICOS","desc":"Causa 5 críticos hoje.","target":5,"reward":{"credits":120,"materials":{"psi_core":1}}},
    {"id":"dl_explore","name":"EXPLORAR 2 ZONAS","desc":"Completa 2 eventos de zona.","target":2,"reward":{"credits":150,"materials":{"gold_shard":2}}},
]

# ============== CONQUISTAS ==============
ACHIEVEMENTS = [
    {"id":"first_blood","name":"PRIMEIRO SANGUE","desc":"Neutraliza o teu primeiro hostil.","trigger":"kills","threshold":1,"reward_cr":20},
    {"id":"crit_tenfold","name":"DE PRECISÃO","desc":"Causa 10 golpes críticos.","trigger":"crits","threshold":10,"reward_cr":50},
    {"id":"bleed_runner","name":"CORREDOR DE SANGUE","desc":"Aplica HEMORRAGIA 20 vezes.","trigger":"bleeds","threshold":20,"reward_cr":80},
    {"id":"ult_rev","name":"O MURO CHEGA","desc":"Desata o ultimate do REVENANT.","trigger":"ult_rev","threshold":1,"reward_cr":100},
    {"id":"ult_nul","name":"PALAVRA-ZERO PROFERIDA","desc":"Desata o ultimate do NULL-SEER.","trigger":"ult_nul","threshold":1,"reward_cr":100},
    {"id":"ult_hol","name":"NOMES DESESCRITOS","desc":"Desata o ultimate do HOLLOW-BLADE.","trigger":"ult_hol","threshold":1,"reward_cr":100},
    {"id":"talent_iron","name":"INEXTINGUÍVEL","desc":"Maximiza o ramo FERRO.","trigger":"iron_maxed","threshold":1,"reward_cr":200},
    {"id":"talent_void","name":"ESTRELA COLAPSADA","desc":"Maximiza o ramo VAZIO.","trigger":"void_maxed","threshold":1,"reward_cr":200},
    {"id":"talent_blood","name":"APEX","desc":"Maximiza o ramo SANGUE.","trigger":"blood_maxed","threshold":1,"reward_cr":200},
    {"id":"collector","name":"O COLECIONADOR","desc":"Mantém 10 peças de equipamento.","trigger":"equip_count","threshold":10,"reward_cr":150},
    {"id":"lore_reader","name":"LEITOR INFINITO","desc":"Desbloqueia 30 fragmentos de lore.","trigger":"lore_unlocked","threshold":30,"reward_cr":150},
    {"id":"arena_10","name":"GLADIADOR","desc":"Chega à onda 10 da arena.","trigger":"arena_wave","threshold":10,"reward_cr":250},
    {"id":"arena_25","name":"MONARCA DA ARENA","desc":"Chega à onda 25 da arena.","trigger":"arena_wave","threshold":25,"reward_cr":600},
    {"id":"ascendant","name":"ASCENDENTE","desc":"Ascende uma vez.","trigger":"ascension","threshold":1,"reward_cr":400},
    {"id":"unmade","name":"DESFAZEDOR","desc":"Derrota O DESFEITO.","trigger":"boss_unmade","threshold":1,"reward_cr":800},
    {"id":"campaign","name":"RESPIRO-GALÁXIA","desc":"Conclui todas as 8 missões.","trigger":"missions_done","threshold":8,"reward_cr":500},
    {"id":"crafter","name":"O ARTÍFICE","desc":"Fabrica 5 itens.","trigger":"crafts","threshold":5,"reward_cr":120},
    {"id":"explorer","name":"CARTÓGRAFO","desc":"Completa 15 eventos de zona.","trigger":"zone_events","threshold":15,"reward_cr":250},
    {"id":"faction_honored","name":"HONRADO","desc":"Atinge HONRADO com qualquer facção.","trigger":"faction_honored","threshold":1,"reward_cr":350},
]

# ============== LORE ==============
LORE_NAMES = ["Karnak","Veyra","A Mão-Cinza","Sol-9","Orr","Idris","A Lanterna","Nhor","Virel","Astet","Mãe Vermelha","A Cifra","Ezhen","Kovac","O Rei Oco","Tessa","Mercê","Seda-Preta","O Senador Pálido","Arco-5","Lutrei","O Cura Sem Nome","Ovid","Nove-Feridas","O Sacerdote de Ferro","Vex","Sete-Moedas","Cinza-de-Nomes"]
LORE_PLACES = ["a Linha Zero","a Velha Cascádia","KARNAK-7","o Observatório Âmbar","o Bazar Nono","os Destroços do Trono","a Catedral da Ferrugem","o Delta de Exaustão","Luz-Cicatriz","a Sétima Órbita","o Mar Dobrado","a Fundição Afogada","o Reino de Ferro","a Bobina Exterior","o Bairro da Lanterna","o Nível Negro","o Berço do Vazio"]
LORE_VERBS = ["ajoelhou-se perante","traiu","sobreviveu a","comeu","perdoou","desfez","casou com","enterrou","espelhou","avisou","silenciou","traduziu","apagou","contou","recordou","alimentou","herdou","renomeou"]
LORE_ARTIFACTS = ["a Chave Âmbar","uma oração dobrada","sete moedas vermelhas","a Máscara de Ovid","um sigilo partido","a Primeira Voz","uma criança cromada","a Lista de Nomes","um dente","a Coroa de Papel","o Rosário das Nove Feridas"]
LORE_EVENTS = ["o Colapso","a Longa Estática","a Noite em que as Estrelas Pararam","o Terceiro Silêncio","a Guerra Dourada","o Inverno Vermelho de 2117","o Desfazer","a Peste Ruidosa","o Evento Zero","a Inquisição Orbital"]
LORE_PROPHECIES = [
    "Haverá um último contratado. Usará o nome de {name}. Não voltará de {place}.",
    "Quando {name} responder ao sinal, {place} lembrar-se-á da sua verdadeira forma.",
    "A galáxia respirará de novo, mas só depois de {event}, e só se {name} se ajoelhar primeiro.",
    "{artifact} passará por três pares de mãos antes de encontrar aquele que a partiu.",
    "No ano em que a Linha Âmbar cantar, {name} dirá o nome de {name2} em voz alta, e ambos morrerão.",
]
LORE_TYPES = ["CÓDEX","TESTAMENTO","REGISTO DE CAMPO","TRANSMISSÃO","EPITÁFIO","ORDENANÇA","REGISTO DE SONHO","PROFECIA","CONFISSÃO","CITAÇÃO","CARTA"]

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
        f"{name} {verb} {name2} em {place}.",
        f"{kind} de {name}, recuperado de {place}: \"Vi o que vive sob {event}.\"",
        f"Fragmento {frag_id}: Sujeito {name}. Estado: {r.choice(['desaparecido','apagado','enterrado','traduzido'])}. Nota: {r.choice(['a letra é tua','a data é amanhã','o nome é ilegível'])}.",
        f"Encontraram {artifact} na mão de {name} após {event}. Ainda estava quente.",
        f"Ordenança {r.randint(100,999)}: mencionar {name} em {place} é crime capital. Assinado, {r.choice(LORE_NAMES)}.",
        r.choice(LORE_PROPHECIES).format(name=name,name2=name2,place=place,artifact=artifact,event=event),
        f"No {r.randint(1,28)}º dia de {event}, {name} {verb} {artifact} e {place} tornou-se dourado. Ninguém o escreveu.",
        f"Epitáfio em {place}: AQUI JAZ {name.upper()}. NÃO RESPONDEU.",
        f"Carta de {name}: \"Estive em {place} e não consegui lembrar-me porque te odiava. Perdoa-me, depois esquece-me.\"",
    ]
    return {"idx":idx,"id":frag_id,"kind":kind,"title":f"{kind} — {name}","body":r.choice(templates),
            "subject":name,"place":place,"era":event,
            "tags":r.sample(["exílio","colapso","ferrugem","âmbar","linha-zero","directorate","feiticeira","príncipe","estática"], k=3)}

LANDING_TICKERS = [
    "Sinal LINHA ÂMBAR detetado sobre KARNAK-7. Não respondas.",
    "O DESFEITO ganhou mais um nome. Não é o teu. Ainda.",
    "Chegou um contrato esta manhã. Foi assinado por ti, datado de ontem.",
    "O INVERNO VERMELHO regressa em 47 dias. Abastece-te.",
    "NOVE-FERIDAS avistado no Bairro da Lanterna. Sem corpo recuperado.",
    "A galáxia não está a morrer. Está a ser reescrita.",
    "Interferência LINHA DOURADA nos cinturões orbitais. Operativos aconselhados a trazer óticas tingidas.",
    "O CURA SEM NOME está a aceitar confissões. Ninguém está a regressar.",
    "Diretiva 44-C: qualquer exilado que ouça o próprio nome em sonhos deve reportar imediatamente.",
    "Recorde de onda na arena batido novamente. Nem sequer estavas lá.",
]

# ============== UTILITÁRIOS ==============
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

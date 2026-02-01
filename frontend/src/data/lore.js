/**
 * SUBMUNDO - Sistema de Lore e Informações do Jogo
 * ================================================
 * Este arquivo contém toda a história, lore, informações detalhadas
 * sobre bairros, gangues, veículos, personagens, missões e muito mais.
 * 
 * Criado para enriquecer a experiência do jogador no universo SUBMUNDO.
 */

// ============================================================================
// HISTÓRIA PRINCIPAL DO JOGO
// ============================================================================

export const GAME_LORE = {
  // Introdução ao universo
  introduction: {
    title: "Bem-vindo ao SUBMUNDO",
    subtitle: "Onde as sombras reinam e a lei é apenas uma sugestão",
    mainStory: `
      Lisboa, 2026. A cidade das sete colinas esconde um segredo nas suas entranhas.
      Por baixo das ruas históricas, do fado melancólico e dos pastéis de Belém,
      existe uma rede criminal que movimenta milhões todos os dias.

      Tu és mais um que chegou às ruas sem nada. Talvez fugisses de algo,
      talvez procurasses algo. Não importa. O que importa é que agora
      estás aqui, e aqui só existem duas escolhas: subir ou ser esmagado.

      O SUBMUNDO não perdoa fracos. Cada esquina tem um tubarão à espera,
      cada sorriso esconde uma faca, cada promessa pode ser a tua sentença.
      Mas para quem sabe jogar... ah, para quem sabe jogar, esta cidade
      é um paraíso de oportunidades.

      Construi o teu império. Faz as tuas escolhas. E lembra-te:
      no SUBMUNDO, a única lei é a sobrevivência.
    `,
    timeline: [
      { year: "2020", event: "A Grande Crise económica atinge Lisboa, criando vácuo de poder" },
      { year: "2021", event: "Surgem as primeiras gangues organizadas modernas" },
      { year: "2022", event: "Guerra dos Três Reis - conflito sangrento pela Baixa" },
      { year: "2023", event: "Pacto de Alfama estabelece zonas neutras" },
      { year: "2024", event: "Polícia cria Divisão Anti-Crime Organizado (DACO)" },
      { year: "2025", event: "Mercado Negro digital revoluciona o crime" },
      { year: "2026", event: "Tu chegas à cidade..." },
    ],
  },

  // O mundo e contexto
  worldContext: {
    economy: `
      A economia portuguesa colapsou em 2020 após uma série de crises.
      O desemprego atingiu 30%, os bancos fecharam portas, e o estado
      perdeu o controlo de vastas áreas urbanas. Foi neste caos que
      o crime organizado floresceu como nunca.

      Hoje, estima-se que 40% da economia lisboeta seja "paralela".
      O dinheiro circula em duas formas: o "limpo", que podes usar
      em qualquer lado, e o "sujo", que precisa ser lavado antes
      de ser útil. A taxa de lavagem varia entre 20% e 40%, dependendo
      das tuas conexões e do risco que estás disposto a correr.
    `,
    police: `
      A polícia lisboeta está dividida. Metade está comprada, a outra
      metade está desesperada. A Divisão Anti-Crime Organizado (DACO)
      foi criada para combater as gangues, mas opera com recursos
      limitados e moral baixa.

      O "Heat" - ou calor policial - é a medida de quanto atenção
      atrais. Quanto mais crimes cometes, mais os olhos se viram
      para ti. Heat alto significa buscas frequentes, perseguições,
      e risco de prisão. Heat baixo significa liberdade para operar.

      Alguns bairros têm mais presença policial que outros. O Centro
      e Santos são vigiados de perto. Mouraria e Alfama... bem,
      ali a polícia entra só com apoio reforçado.
    `,
    culture: `
      O fado ainda toca nas tascas de Alfama, mas agora compete com
      o bass pesado do trap que ecoa dos carros blindados. A cultura
      do SUBMUNDO é uma mistura de tradição e brutalidade moderna.

      Respeito é tudo. Um homem sem respeito é um homem morto a caminhar.
      A reputação constrói-se lentamente, mas destrói-se num instante.
      Uma palavra mal dita, uma dívida não paga, um território invadido
      - qualquer coisa pode iniciar uma guerra.

      As gangues têm os seus códigos. Algumas são honoráveis, outras
      são selvagens. Conhecer a diferença pode salvar a tua vida.
    `,
  },
};

// ============================================================================
// INFORMAÇÕES DETALHADAS DOS BAIRROS
// ============================================================================

export const NEIGHBORHOODS_LORE = {
  centro: {
    name: "Centro",
    fullName: "Baixa-Chiado / Centro Histórico",
    nickname: "O Coração Podre",
    description: `
      O centro de Lisboa é onde tudo começou e onde tudo termina.
      As ruas calcetadas escondem séculos de história - e décadas de crime.
      Aqui, turistas desprevenidos cruzam-se com batedores de carteira experientes,
      restaurantes de luxo lavam dinheiro, e os melhores negócios são feitos
      nos cafés à luz do dia.
    `,
    history: `
      Antes da crise, o Centro era território neutro - demasiado vigiado
      para qualquer gangue reclamar. Mas quando a polícia perdeu recursos,
      as fronteiras começaram a ser testadas. Hoje, múltiplas facções
      mantêm uma paz instável, cada uma controlando um quarteirão diferente.

      O Rossio é considerado solo sagrado - guerras ali trazem atenção
      demais. Mas à volta... à volta é guerra constante.
    `,
    economicInfo: `
      Valor Económico: ALTO (70-80)
      O centro gera milhões diariamente. Turismo, comércio, lavagem de dinheiro
      através de restaurantes e lojas - as oportunidades são infinitas.
      Mas a competição é feroz e a polícia está sempre à espreita.
    `,
    dangers: [
      "Alta presença policial - operações frequentes",
      "Múltiplas gangues a operar - conflitos territoriais",
      "Turistas podem ser testemunhas indesejadas",
      "Câmaras de vigilância em cada esquina",
    ],
    opportunities: [
      "Carteirismo de turistas - baixo risco, recompensa variável",
      "Proteção de lojas - rendimento estável",
      "Lavagem através de estabelecimentos legítimos",
      "Venda de mercadoria roubada a turistas",
    ],
    landmarks: [
      { name: "Rossio", description: "Praça central, território neutro por tradição" },
      { name: "Rua Augusta", description: "Artéria comercial, ideal para carteirismo" },
      { name: "Elevador de Santa Justa", description: "Ponto de vigilância estratégico" },
      { name: "Café A Brasileira", description: "Ponto de encontro para negociações" },
    ],
    controllingFactions: "Território disputado - várias facções menores",
    soundtrack: "Fado misturado com o burburinho constante de turistas",
  },

  alfama: {
    name: "Alfama",
    fullName: "Alfama / Castelo",
    nickname: "O Labirinto",
    description: `
      Alfama é um labirinto de becos estreitos e escadas sem fim.
      O bairro mais antigo de Lisboa é também o mais impenetrável.
      Quem não conhece as ruas perde-se em minutos. Quem conhece
      pode desaparecer para sempre.
    `,
    history: `
      Alfama sobreviveu ao terramoto de 1755 e sobreviveu à polícia
      desde então. O bairro sempre foi refúgio de fugitivos, desde
      piratas mouros até traficantes modernos. As suas ruas labirínticas
      são uma fortaleza natural.

      A gangue "Filhos de Alfama" domina aqui há três gerações.
      São tradicionais, respeitam códigos antigos, e protegem os seus.
      Entrar no seu território sem permissão é suicídio.
    `,
    economicInfo: `
      Valor Económico: MÉDIO (50-60)
      Alfama não é rica, mas é segura - para quem pertence. O bairro
      funciona como porto seguro, esconderijo, e base de operações.
      O rendimento vem de proteção, contrabando, e turismo menos legal.
    `,
    dangers: [
      "Gangue local extremamente territorial",
      "Ruas confusas - fácil ficar encurralado",
      "Códigos de honra rígidos - ofensas são mortais",
      "Presença policial quase nula - sem lei, sem proteção",
    ],
    opportunities: [
      "Esconderijos seguros para fugitivos",
      "Contrabando através do rio Tejo",
      "Proteção garantida por taxa",
      "Acesso a informadores locais",
    ],
    landmarks: [
      { name: "Castelo de São Jorge", description: "Miradouro e ponto de vigia" },
      { name: "Feira da Ladra", description: "Mercado de segunda mão e mercadoria roubada" },
      { name: "Sé de Lisboa", description: "Território sagrado - crimes proibidos" },
      { name: "Miradouro de Santa Luzia", description: "Ponto de encontro tradicional" },
    ],
    controllingFactions: "Filhos de Alfama - gangue tradicional com 30+ anos",
    soundtrack: "Fado autêntico ecoando de cada janela, guitarra portuguesa",
  },

  mouraria: {
    name: "Mouraria",
    fullName: "Mouraria / Martim Moniz",
    nickname: "O Caldeirão",
    description: `
      Mouraria é onde o mundo se encontra. Chineses, indianos, africanos,
      brasileiros - todos têm o seu canto neste bairro caótico.
      É o centro do mercado negro, onde podes encontrar qualquer coisa
      se souberes onde procurar e quem pagar.
    `,
    history: `
      O bairro dos mouros nunca perdeu o seu espírito multicultural.
      Depois da crise, tornou-se o epicentro do comércio paralelo.
      Máfias de diferentes origens dividiram o território em fatias
      étnicas, mas os negócios atravessam todas as fronteiras.

      Ninguém realmente "controla" Mouraria. Há uma paz pragmática
      baseada em lucro mútuo. Todos ganham, todos calam.
    `,
    economicInfo: `
      Valor Económico: ALTO (65-75)
      O mercado paralelo movimenta fortunas. Contrafação, contrabando,
      drogas sintéticas, armas leves - tudo passa por aqui.
      É o supermercado do crime organizado.
    `,
    dangers: [
      "Múltiplas máfias étnicas - política complexa",
      "Produtos falsos podem ser armadilhas",
      "Informadores em todo lado - segredos não existem",
      "Violência étnica pode explodir sem aviso",
    ],
    opportunities: [
      "Acesso ao maior mercado negro da cidade",
      "Contrafação de qualidade - documentos, dinheiro",
      "Fornecedores de qualquer produto imaginável",
      "Rede de contactos internacionais",
    ],
    landmarks: [
      { name: "Martim Moniz", description: "Praça central do comércio paralelo" },
      { name: "Centro Comercial Mouraria", description: "Fachada legal para negócios ilegais" },
      { name: "Escadinhas da Saúde", description: "Ponto de troca de mercadoria" },
      { name: "Largo do Intendente", description: "Território renovado mas ainda perigoso" },
    ],
    controllingFactions: "Coligação multicultural - Tríade, Máfia Russa, Cartéis Africanos",
    soundtrack: "Música do mundo - hip-hop africano, pop chinês, funk brasileiro",
  },

  santos: {
    name: "Santos",
    fullName: "Santos / Cais do Sodré",
    nickname: "A Zona",
    description: `
      Santos é onde Lisboa vem pecar. Discotecas, bares, clubes privados -
      a noite nunca acaba neste bairro ribeirinho. É também território
      de tráfico de alto nível, prostituição de luxo, e festas que
      custam mais do que um carro.
    `,
    history: `
      O Cais do Sodré sempre foi zona de marinheiros e boémios.
      A legalização de certas substâncias na década de 2000 atraiu
      turismo de festa, e com ele veio dinheiro. Muito dinheiro.

      Hoje, as discotecas são fachadas para operações de milhões.
      Os VIPs que entram pelos bastidores movimentam mais dinheiro
      numa noite do que a maioria vê numa vida.
    `,
    economicInfo: `
      Valor Económico: MUITO ALTO (75-85)
      O dinheiro flui como álcool. Drogas recreativas, jogos ilegais,
      lavagem através de estabelecimentos noturnos - Santos é mina de ouro
      para quem sabe explorar a noite.
    `,
    dangers: [
      "Competição feroz pelo controlo da noite",
      "Clientes de alto perfil - problemas são amplificados",
      "Polícia corrupta mas imprevisível",
      "Overdoses e problemas de saúde frequentes",
    ],
    opportunities: [
      "Tráfico de substâncias recreativas premium",
      "Proteção de estabelecimentos noturnos",
      "Acesso a elites - políticos, empresários, celebridades",
      "Lavagem de dinheiro através de eventos",
    ],
    landmarks: [
      { name: "Cais do Sodré", description: "Estação e ponto de entrada" },
      { name: "Pink Street", description: "Rua icónica de festas e negócios" },
      { name: "Doca de Santo Amaro", description: "Bares de luxo e iates" },
      { name: "LX Factory", description: "Espaço criativo e mercado alternativo" },
    ],
    controllingFactions: "Sindicato da Noite - empresários e criminosos unidos",
    soundtrack: "House, techno, e o som de garrafas a estilhaçar às 4 da manhã",
  },

  belem: {
    name: "Belém",
    fullName: "Belém / Ajuda",
    nickname: "O Museu",
    description: `
      Belém é Lisboa para os turistas de cartilha. Monumentos, museus,
      e filas intermináveis para pastéis de nata. Mas por baixo da fachada
      histórica, opera uma rede sofisticada de crime de colarinho branco.
    `,
    history: `
      O bairro dos descobrimentos sempre atraiu dinheiro institucional.
      Quando a corrupção se tornou epidémica, Belém tornou-se o centro
      de desvios de fundos, fraude de seguros, e tráfico de arte.

      Os criminosos daqui usam fato e gravata. Os seus crimes são
      cometidos em escritórios, não em becos. É um mundo diferente.
    `,
    economicInfo: `
      Valor Económico: ELITE (80-90)
      Crime de colarinho branco gera fortunas silenciosas. Fraude,
      corrupção, desvios - os montantes são astronómicos, mas os
      riscos são igualmente altos.
    `,
    dangers: [
      "Crime sofisticado requer competências especializadas",
      "Alvos de alto perfil - falhas são catastróficas",
      "Segurança privada de elite",
      "Investigações federais frequentes",
    ],
    opportunities: [
      "Fraude de seguros - navios, arte, jóias",
      "Acesso a leilões privados de arte roubada",
      "Contactos governamentais e diplomáticos",
      "Lavagem através de fundações culturais",
    ],
    landmarks: [
      { name: "Torre de Belém", description: "Marco histórico e ponto de vigilância" },
      { name: "Mosteiro dos Jerónimos", description: "Território sagrado" },
      { name: "CCB", description: "Centro Cultural - eventos de elite" },
      { name: "Pastéis de Belém", description: "Ponto de encontro discreto" },
    ],
    controllingFactions: "A Fundação - rede de empresários e políticos corruptos",
    soundtrack: "Silêncio respeitoso, pontuado por flashs de turistas",
  },

  bairroAlto: {
    name: "Bairro Alto",
    fullName: "Bairro Alto / Príncipe Real",
    nickname: "O Palco",
    description: `
      Bairro Alto é um teatro permanente onde todos representam um papel.
      De dia, ruas desertas e lojas alternativas. De noite, caos absoluto
      com milhares a percorrer as ruas entre bares minúsculos.
    `,
    history: `
      O bairro boémio sempre foi território de artistas e marginais.
      A gentrificação trouxe dinheiro, mas não expulsou o crime -
      apenas o tornou mais criativo. Aqui, os dealers vendem arte
      e os artistas vendem drogas.

      A fronteira entre legal e ilegal é tão fina como as paredes
      dos prédios centenários.
    `,
    economicInfo: `
      Valor Económico: MÉDIO-ALTO (60-70)
      O rendimento vem do turismo nocturno, venda de substâncias,
      e uma economia criativa que não distingue entre génio e crime.
    `,
    dangers: [
      "Multidões tornam operações difíceis de esconder",
      "Polícia regular nas noites de fim-de-semana",
      "Clientes imprevisíveis - turistas e locais",
      "Competição intensa por pontos de venda",
    ],
    opportunities: [
      "Venda a retalho de substâncias recreativas",
      "Contrabando de arte e antiguidades",
      "Acesso a rede artística underground",
      "Festas privadas de alta sociedade",
    ],
    landmarks: [
      { name: "Miradouro de São Pedro de Alcântara", description: "Vista panorâmica e ponto de vigia" },
      { name: "Elevador da Glória", description: "Entrada principal ao bairro" },
      { name: "Jardim Botânico", description: "Zona de encontros discretos" },
      { name: "Teatro da Trindade", description: "Eventos culturais e contactos" },
    ],
    controllingFactions: "Coletivo Artístico - rede descentralizada de artistas-criminosos",
    soundtrack: "Mistura eclética - do fado ao indie, do jazz ao hip-hop",
  },
};

// ============================================================================
// GANGUES E FACÇÕES
// ============================================================================

export const GANGS_LORE = {
  systemInfo: {
    overview: `
      O crime organizado em Lisboa opera através de gangues - organizações
      com hierarquias, códigos, e territórios definidos. Pertencer a uma
      gangue oferece proteção, recursos, e acesso a oportunidades exclusivas.
      Mas exige lealdade absoluta.
    `,
    hierarchy: [
      { rank: "Líder", description: "Fundador ou eleito - controlo total, responsabilidade total" },
      { rank: "Oficial", description: "Tenente do líder - executa ordens, gere operações" },
      { rank: "Veterano", description: "Membro experiente - respeito ganho, missões especiais" },
      { rank: "Soldado", description: "Membro regular - trabalho pesado, provas constantes" },
      { rank: "Associado", description: "Novo membro - período de teste, confiança limitada" },
    ],
    codes: [
      { code: "Lealdade", meaning: "A gangue vem primeiro. Traição é punida com morte." },
      { code: "Silêncio", meaning: "Nunca fales à polícia. Nunca. Sobre nada. Nunca." },
      { code: "Território", meaning: "O que é nosso é sagrado. Defende-o com sangue." },
      { code: "Respeito", meaning: "Trata os teus como família. Inimigos com frieza." },
      { code: "Negócio", meaning: "Dívidas pagam-se. Promessas cumprem-se." },
    ],
    warfare: {
      description: `
        Guerras entre gangues são caras e sangrentas. Só são declaradas
        quando diplomacia falha e o território justifica o custo.
        A guerra tem regras - civis são poupados, negócios continuam,
        e há sempre possibilidade de trégua.
      `,
      rules: [
        "Guerras devem ser declaradas oficialmente",
        "Civis e famílias são intocáveis",
        "Territórios neutros são respeitados",
        "Rendição honrosa é aceite",
        "Acordos de paz são sagrados",
      ],
    },
  },

  majorGangs: [
    {
      name: "Filhos de Alfama",
      tag: "FDA",
      founded: 1995,
      origin: "Alfama",
      ideology: "Tradição, família, território",
      description: `
        A gangue mais antiga e respeitada de Lisboa. Fundada por famílias
        de Alfama que se uniram para proteger o bairro de invasores.
        Seguem códigos antigos e tratam membros como família real.
      `,
      specialties: ["Proteção territorial", "Contrabando marítimo", "Informação"],
      allies: ["Nenhuma - preferem independência"],
      enemies: ["Quem ameace Alfama"],
      reputation: "Temidos mas respeitados. Honra acima de tudo.",
    },
    {
      name: "Sindicato da Noite",
      tag: "SDN",
      founded: 2015,
      origin: "Santos / Cais do Sodré",
      ideology: "Lucro, influência, prazer",
      description: `
        União de empresários da noite que perceberam que crime organizado
        é mais rentável que negócio legal. Controlam discotecas, tráfico
        de drogas recreativas, e uma rede de prostituição de luxo.
      `,
      specialties: ["Tráfico de drogas premium", "Lavagem de dinheiro", "Extorsão elegante"],
      allies: ["Fornecedores internacionais", "Políticos corruptos"],
      enemies: ["Concorrência nocturna", "Moralistas"],
      reputation: "Ricos, influentes, sem escrúpulos visíveis.",
    },
    {
      name: "Os Corvos",
      tag: "CRV",
      founded: 2018,
      origin: "Mouraria",
      ideology: "Oportunismo, adaptação, sobrevivência",
      description: `
        Gangue jovem e agressiva que surgiu das ruas de Mouraria.
        Recrutam imigrantes e marginalizados, oferecendo pertença
        a quem a sociedade rejeitou. São imprevisíveis e violentos.
      `,
      specialties: ["Roubo", "Assaltos", "Recrutamento"],
      allies: ["Gangues de imigrantes", "Traficantes de rua"],
      enemies: ["Estabelecidos", "Polícia"],
      reputation: "Perigosos, desesperados, nada a perder.",
    },
    {
      name: "A Fundação",
      tag: "FND",
      founded: 2010,
      origin: "Belém",
      ideology: "Poder, discrição, controlo",
      description: `
        Rede de criminosos de colarinho branco que opera nas sombras
        do poder. Empresários, políticos, juízes - todos com algo
        a esconder e muito a ganhar com cooperação mútua.
      `,
      specialties: ["Corrupção", "Fraude", "Manipulação legal"],
      allies: ["Sistema judicial", "Sistema político"],
      enemies: ["Investigadores honestos", "Jornalistas"],
      reputation: "Invisíveis mas omnipresentes. Verdadeiros donos da cidade.",
    },
  ],

  gangCreation: {
    requirements: `
      Criar uma gangue requer coragem, recursos, e visão. Não basta ter
      dinheiro - é preciso ter algo que una pessoas. Uma causa, um território,
      uma promessa de algo melhor.
    `,
    costs: [
      { item: "Taxa de fundação", cost: 5000, description: "Investimento inicial para estabelecimento" },
      { item: "Território inicial", cost: "Variável", description: "Depende do bairro escolhido" },
      { item: "Primeiros recrutas", cost: "Tempo", description: "Construir confiança leva meses" },
    ],
    tips: [
      "Escolhe uma identidade forte - nome, tag, cores, código",
      "Começa com território pequeno mas defensável",
      "Recruta lentamente - qualidade sobre quantidade",
      "Estabelece regras desde o início",
      "Faz aliados antes de fazer inimigos",
    ],
  },
};

// ============================================================================
// SISTEMA DE VEÍCULOS
// ============================================================================

export const VEHICLES_LORE = {
  systemOverview: {
    description: `
      No SUBMUNDO, o teu veículo é mais que transporte - é a tua assinatura,
      a tua fuga, e muitas vezes a diferença entre liberdade e prisão.
      Cada veículo tem características que afetam as tuas operações.
    `,
    stats: [
      { name: "Velocidade", description: "Rapidez de fuga e perseguição. Crucial para missões de alto risco." },
      { name: "Furtividade", description: "Capacidade de passar despercebido. Importante para operações discretas." },
      { name: "Capacidade", description: "Quanto podes transportar. Essencial para contrabando e entregas." },
      { name: "Condição", description: "Estado do veículo. Afeta todas as outras estatísticas." },
    ],
    maintenance: `
      Veículos degradam com uso. Cada missão, cada fuga, cada quilómetro
      desgasta o teu transporte. Manutenção regular é essencial - um carro
      que avaria no meio de uma fuga é uma sentença de prisão.
    `,
  },

  vehicleClasses: [
    {
      class: "Basic",
      description: "Transporte fundamental para iniciantes. Barato, discreto, limitado.",
      examples: ["Bicicleta", "Scooter"],
      pros: ["Barato", "Fácil de esconder", "Manutenção mínima"],
      cons: ["Lento", "Sem capacidade de carga", "Vulnerável"],
    },
    {
      class: "Standard",
      description: "Veículos equilibrados para operações quotidianas.",
      examples: ["Carro Usado", "Sedan"],
      pros: ["Versátil", "Capacidade razoável", "Não chama atenção"],
      cons: ["Performance média", "Custo de manutenção"],
    },
    {
      class: "Sport",
      description: "Velocidade e performance para fugas de alto risco.",
      examples: ["Mota Desportiva", "Desportivo"],
      pros: ["Velocidade máxima", "Adrenalina", "Status"],
      cons: ["Caro", "Chama atenção", "Pouca capacidade"],
    },
    {
      class: "Luxury",
      description: "Veículos de prestígio para criminosos estabelecidos.",
      examples: ["Sedan de Luxo", "SUV Blindado"],
      pros: ["Proteção", "Conforto", "Impressiona alvos"],
      cons: ["Muito caro", "Manutenção cara", "Marca presença"],
    },
    {
      class: "Utility",
      description: "Veículos práticos para operações de carga.",
      examples: ["Carrinha de Carga", "Van"],
      pros: ["Capacidade máxima", "Discreto", "Versátil"],
      cons: ["Lento", "Sem luxo", "Fuga difícil"],
    },
  ],

  vehicleDetails: {
    bicicleta: {
      name: "Bicicleta",
      fullDescription: `
        A escolha dos que começam do zero. Uma bicicleta pode parecer humilde,
        mas nas ruas estreitas de Alfama ou nos becos de Mouraria, nada
        é mais rápido para desaparecer. Silenciosa, anónima, praticamente
        invisível.
      `,
      history: "Usada por mensageiros de drogas desde os anos 80.",
      bestUse: "Entregas rápidas em zonas congestionadas, fugas por becos.",
      weakness: "Inútil para cargas pesadas ou fugas longas.",
    },
    scooter: {
      name: "Scooter",
      fullDescription: `
        O upgrade natural da bicicleta. Uma scooter dá-te mobilidade e
        alguma capacidade de carga sem chamar atenção. É o veículo padrão
        dos mensageiros do mercado negro.
      `,
      history: "Popularizada pelos dealers de Mouraria nos anos 2000.",
      bestUse: "Entregas urbanas, vigilância, fugas rápidas.",
      weakness: "Sem proteção, limitada em velocidade máxima.",
    },
    mota_desportiva: {
      name: "Mota Desportiva",
      fullDescription: `
        Pura velocidade sobre duas rodas. Uma mota desportiva é para quem
        precisa de fugir rápido e não se importa de ser visto. É impossível
        apanhar - se souberes conduzir.
      `,
      history: "Símbolo dos motoristas de fuga profissionais.",
      bestUse: "Fugas de perseguições, operações de alto risco.",
      weakness: "Zero capacidade, chama atenção, perigosa.",
    },
    carro_usado: {
      name: "Carro Usado",
      fullDescription: `
        O cavalo de trabalho do crime quotidiano. Um carro usado não impressiona
        ninguém, mas leva-te onde precisas, carrega o que precisas, e ninguém
        olha duas vezes.
      `,
      history: "O primeiro veículo de 90% dos criminosos de Lisboa.",
      bestUse: "Operações quotidianas, transporte de mercadoria média.",
      weakness: "Performance limitada, pode avariar.",
    },
    sedan_luxo: {
      name: "Sedan de Luxo",
      fullDescription: `
        Quando precisas de impressionar. Um sedan de luxo abre portas que
        o dinheiro sozinho não consegue. Clientes de alto perfil esperam
        ser tratados com classe.
      `,
      history: "Preferido por chefes de gangue e empresários sujos.",
      bestUse: "Reuniões de negócios, transporte de VIPs, impressionar.",
      weakness: "Manutenção cara, marca presença.",
    },
    desportivo: {
      name: "Desportivo",
      fullDescription: `
        O sonho de todo criminoso. Um desportivo é pura declaração de sucesso.
        Velocidade, luxo, e a mensagem clara de que chegaste ao topo.
        Ou que estás a caminho.
      `,
      history: "Símbolo de status no submundo desde sempre.",
      bestUse: "Fugas de alta velocidade, impressionar, prazer.",
      weakness: "Extremamente caro, impossível de esconder.",
    },
    suv_blindado: {
      name: "SUV Blindado",
      fullDescription: `
        Para quem tem inimigos. Um SUV blindado é fortaleza sobre rodas.
        Proteção contra balas, capacidade de carga, e presença intimidante.
        É o veículo de quem já foi alvo - e sobreviveu.
      `,
      history: "Adoptado após a guerra de gangues de 2022.",
      bestUse: "Proteção de VIPs, transporte de alto valor, intimidação.",
      weakness: "Lento, caro, grita 'criminoso'.",
    },
    carrinha_carga: {
      name: "Carrinha de Carga",
      fullDescription: `
        O veículo mais subestimado. Uma carrinha branca é invisível -
        há milhares iguais. Mas dentro pode haver qualquer coisa:
        mercadoria, pessoas, equipamento. É a ferramenta perfeita.
      `,
      history: "Usada em 70% das operações de contrabando na cidade.",
      bestUse: "Contrabando, transporte de cargas pesadas, esconder.",
      weakness: "Sem velocidade de fuga, interior desconfortável.",
    },
  },
};

// ============================================================================
// SISTEMA DE MISSÕES
// ============================================================================

export const MISSIONS_LORE = {
  systemOverview: {
    description: `
      Missões são a espinha dorsal da vida criminal. Desde pequenos furtos
      até operações elaboradas, cada missão é uma oportunidade de ganhar
      dinheiro, reputação, e experiência. Mas cada missão também tem riscos.
    `,
    factors: [
      { name: "Duração", description: "Quanto tempo a missão demora. Mais tempo = mais exposição." },
      { name: "Energia", description: "Esforço necessário. Missões difíceis esgotam-te rapidamente." },
      { name: "Risco", description: "Probabilidade de falha ou captura. Depende de muitos fatores." },
      { name: "Recompensa", description: "Pagamento em caso de sucesso. Geralmente proporcional ao risco." },
      { name: "Heat", description: "Atenção policial gerada. Crimes violentos geram mais calor." },
    ],
    successFactors: `
      O sucesso de uma missão depende de vários fatores: o teu nível,
      as tuas skills, o veículo que usas, o heat atual do bairro,
      e eventos ativos na cidade. Planeia com cuidado.
    `,
  },

  missionTypes: {
    legal: {
      description: `
        Nem todo dinheiro precisa ser sujo. Trabalhos legais pagam menos
        mas não geram heat. São ideais para recuperar quando o calor
        policial está alto demais.
      `,
      examples: [
        {
          name: "Entregas",
          description: "Transporta encomendas pela cidade. Legal, simples, seguro.",
          tips: "Boa opção para ganhar dinheiro enquanto esperas o heat baixar.",
        },
        {
          name: "Segurança",
          description: "Guarda estabelecimentos ou eventos. Tedioso mas estável.",
          tips: "Podes fazer contactos úteis enquanto trabalhas.",
        },
        {
          name: "Trabalho Manual",
          description: "Construção, limpezas, mudanças. Dignidade não paga contas.",
          tips: "Última opção quando precisas de dinheiro limpo.",
        },
      ],
    },
    crime: {
      description: `
        O caminho rápido para riqueza - ou para a prisão. Crimes pagam bem
        mas geram heat e dinheiro sujo. O risco é real, as consequências
        são permanentes.
      `,
      categories: [
        {
          category: "Furtos",
          description: "Roubos sem violência - carteiras, lojas, carros.",
          heat: "Baixo a médio",
          examples: ["Carteirismo", "Roubo de lojas", "Roubo de veículos"],
        },
        {
          category: "Assaltos",
          description: "Crimes com força ou ameaça. Risco elevado.",
          heat: "Alto",
          examples: ["Assalto a pessoas", "Roubo com arma", "Sequestro"],
        },
        {
          category: "Tráfico",
          description: "Movimento de mercadorias ilegais.",
          heat: "Variável",
          examples: ["Entrega de drogas", "Contrabando", "Armas"],
        },
        {
          category: "Fraude",
          description: "Crimes intelectuais - enganos e manipulação.",
          heat: "Baixo a médio",
          examples: ["Burla", "Falsificação", "Lavagem"],
        },
      ],
    },
  },

  missionTips: [
    "Verifica sempre o teu heat antes de aceitar missões",
    "Missões em bairros de alto heat são mais arriscadas",
    "Veículos melhores aumentam chances de sucesso",
    "Eventos da cidade podem afetar dificuldade",
    "Gangues podem oferecer missões exclusivas",
    "Falhar missões prejudica a tua reputação",
    "Diversifica entre legal e ilegal para equilibrar heat",
  ],
};

// ============================================================================
// SISTEMA ECONÓMICO
// ============================================================================

export const ECONOMY_LORE = {
  moneyTypes: {
    cleanMoney: {
      name: "Dinheiro Limpo",
      symbol: "€",
      color: "success",
      description: `
        Dinheiro que podes usar livremente. Seja de trabalhos legais
        ou de dinheiro lavado, o dinheiro limpo não levanta suspeitas.
        Usa-o para compras, propriedades, e investimentos.
      `,
      sources: [
        "Trabalhos legais",
        "Lavagem de dinheiro",
        "Venda de propriedades",
        "Recompensas diárias",
      ],
      uses: [
        "Compra de veículos",
        "Compra de propriedades",
        "Compra de negócios",
        "Contribuição para gangues",
      ],
    },
    dirtyMoney: {
      name: "Dinheiro Sujo",
      symbol: "€",
      color: "warning",
      description: `
        Dinheiro ganho através do crime. Não podes usá-lo directamente -
        tentar usar dinheiro sujo levanta alertas imediatos. Precisas
        de o lavar primeiro, o que tem custos e riscos.
      `,
      sources: [
        "Missões criminais",
        "Roubos",
        "Tráfico",
        "Extorsão",
      ],
      limitations: [
        "Não pode ser usado em compras legais",
        "Não pode ser depositado em bancos",
        "Precisa ser lavado (taxa 20-40%)",
        "Risco de apreensão",
      ],
    },
  },

  laundering: {
    description: `
      Lavagem de dinheiro é o processo de converter dinheiro sujo em limpo.
      É arriscado, caro, mas essencial. Sem lavagem, o dinheiro que ganhas
      no crime não serve para nada.
    `,
    methods: [
      {
        name: "Básico",
        fee: "30-40%",
        risk: "Baseado no teu heat",
        description: "Através de contactos de rua. Arriscado e caro.",
      },
      {
        name: "Estabelecimentos",
        fee: "20-30%",
        risk: "Baixo",
        description: "Através de negócios próprios. Requer propriedade.",
      },
      {
        name: "Offshore",
        fee: "15-25%",
        risk: "Médio",
        description: "Através de contas no estrangeiro. Requer contactos.",
      },
    ],
    tips: [
      "Lava quantias pequenas quando o heat está alto",
      "Ter propriedades reduz taxas de lavagem",
      "Skill de Negociação afeta as taxas",
      "Ser apanhado resulta em perda total do montante",
    ],
  },

  properties: {
    overview: `
      Propriedades são investimentos que geram rendimento passivo.
      Desde apartamentos modestos até armazéns industriais, cada tipo
      tem as suas características e oportunidades.
    `,
    types: [
      {
        type: "Residencial",
        examples: ["Apartamento", "Casa", "Moradia"],
        income: "Estável, baixo",
        maintenance: "Baixa",
        uses: "Rendimento passivo, esconderijo",
      },
      {
        type: "Comercial",
        examples: ["Loja", "Restaurante", "Bar"],
        income: "Variável, médio",
        maintenance: "Média",
        uses: "Rendimento, lavagem de dinheiro",
      },
      {
        type: "Industrial",
        examples: ["Armazém", "Garagem", "Fábrica"],
        income: "Baixo ou nulo",
        maintenance: "Alta",
        uses: "Armazenamento, produção",
      },
    ],
  },

  businesses: {
    overview: `
      Negócios são operações activas que produzem bens ou serviços ilegais.
      Ao contrário de propriedades passivas, negócios requerem gestão
      activa mas geram lucros muito superiores.
    `,
    types: [
      {
        type: "Laboratório",
        produces: "Drogas sintéticas",
        requirements: "Conhecimento químico",
        risks: "Explosões, rusgas",
      },
      {
        type: "Oficina Clandestina",
        produces: "Peças roubadas, modificações",
        requirements: "Skill mecânica",
        risks: "Inspecções, concorrência",
      },
      {
        type: "Falsificador",
        produces: "Documentos, dinheiro falso",
        requirements: "Precisão, equipamento",
        risks: "Investigações federais",
      },
      {
        type: "Destilaria",
        produces: "Álcool ilegal",
        requirements: "Receitas, equipamento",
        risks: "Fiscalização, incêndios",
      },
      {
        type: "Grow House",
        produces: "Cannabis",
        requirements: "Botânica, paciência",
        risks: "Cheiro, consumo eléctrico",
      },
      {
        type: "Bunker de Armas",
        produces: "Armas modificadas",
        requirements: "Armamento, contactos",
        risks: "Extremo - prisão garantida se apanhado",
      },
    ],
  },
};

// ============================================================================
// SISTEMA DE EVENTOS
// ============================================================================

export const EVENTS_LORE = {
  overview: {
    description: `
      A cidade está viva. Eventos acontecem constantemente - festivais,
      apagões, operações policiais, crises - e cada um muda as regras
      do jogo temporariamente. Um criminoso inteligente adapta-se.
    `,
    impact: `
      Eventos podem ser oportunidades ou desastres. Um festival aumenta
      recompensas mas também vigilância. Um apagão permite operações
      no escuro mas também atrai predadores. Lê os sinais da cidade.
    `,
  },

  eventTypes: [
    {
      type: "Operação Policial",
      icon: "shield-alert",
      description: "A polícia intensifica patrulhas e operações.",
      effects: { heat: "+50%", risk: "+2", reward: "Normal" },
      strategy: "Evita crimes, faz trabalhos legais, espera passar.",
    },
    {
      type: "Festival",
      icon: "party-popper",
      description: "Evento cultural traz multidões e oportunidades.",
      effects: { heat: "-20%", risk: "-1", reward: "+25%" },
      strategy: "Aproveita para carteirismo e vendas.",
    },
    {
      type: "Apagão",
      icon: "zap-off",
      description: "Falha eléctrica mergulha bairros em escuridão.",
      effects: { heat: "-40%", risk: "Normal", reward: "+50%" },
      strategy: "Ideal para assaltos e roubos de oportunidade.",
    },
    {
      type: "Trégua de Gangues",
      icon: "handshake",
      description: "As principais gangues acordam paz temporária.",
      effects: { wars: "disabled", risk: "-1", reward: "Normal" },
      strategy: "Usa o período para expandir sem conflitos.",
    },
    {
      type: "Boom Económico",
      icon: "trending-up",
      description: "Dinheiro flui na cidade - legalmente ou não.",
      effects: { reward: "+50%", risk: "Normal", heat: "Normal" },
      strategy: "Maximiza operações lucrativas.",
    },
    {
      type: "Onda de Calor",
      icon: "thermometer",
      description: "Calor extremo aumenta tensões e violência.",
      effects: { heat: "+30%", risk: "+1", reward: "+10%" },
      strategy: "Operações rápidas, evita confrontos.",
    },
    {
      type: "Visita VIP",
      icon: "star",
      description: "Figura importante visita - segurança reforçada.",
      effects: { heat: "+100%", reward: "+100%", risk: "+3" },
      strategy: "Alto risco, alta recompensa. Só para experientes.",
    },
    {
      type: "Saldos Negros",
      icon: "shopping-bag",
      description: "O mercado negro oferece descontos especiais.",
      effects: { prices: "-30%", risk: "Normal", reward: "Normal" },
      strategy: "Compra equipamento e veículos.",
    },
  ],
};

// ============================================================================
// SISTEMA DE PERFIL E PROGRESSÃO
// ============================================================================

export const PROGRESSION_LORE = {
  levels: {
    description: `
      O teu nível reflecte a tua experiência no submundo. Cada nível
      desbloqueia novas oportunidades, missões mais lucrativas, e
      respeito dos outros jogadores.
    `,
    milestones: [
      { level: 1, title: "Novato", description: "Acabaste de chegar. Ninguém te conhece, ninguém te respeita." },
      { level: 5, title: "Soldado de Rua", description: "Já fizeste o suficiente para seres notado. Continua." },
      { level: 10, title: "Operador", description: "Tens reputação. Gangues começam a notar-te." },
      { level: 15, title: "Veterano", description: "Sobreviveste tempo suficiente para seres respeitado." },
      { level: 20, title: "Capo", description: "És um jogador sério. As pessoas temem-te." },
      { level: 25, title: "Chefe", description: "Comandas operações. Outros trabalham para ti." },
      { level: 30, title: "Padrinho", description: "Lenda viva. A cidade sussurra o teu nome." },
    ],
  },

  reputation: {
    description: `
      Reputação é a moeda social do submundo. Quanto mais reputação tens,
      mais portas se abrem. Ganha-se lentamente, perde-se rapidamente.
    `,
    effects: [
      "Acesso a missões exclusivas",
      "Melhores preços no mercado negro",
      "Respeito de gangues",
      "Mais recrutas para a tua gangue",
      "Intimidação de inimigos",
    ],
    how_to_gain: [
      "Completar missões com sucesso",
      "Ganhar guerras de gangues",
      "Conquistar territórios",
      "Ajudar membros da gangue",
      "Eventos especiais",
    ],
    how_to_lose: [
      "Falhar missões",
      "Ser preso",
      "Trair a gangue",
      "Perder guerras",
      "Fugir de confrontos",
    ],
  },

  heat: {
    description: `
      Heat é a atenção policial sobre ti. Quanto mais crimes cometes,
      mais a polícia te procura. Heat alto significa vida difícil.
    `,
    levels: [
      { range: "0-20%", status: "Frio", description: "Seguro. A polícia não sabe que existes." },
      { range: "21-40%", status: "Morno", description: "Cauteloso. Podem estar a vigiar-te." },
      { range: "41-60%", status: "Quente", description: "Alerta. Rusgas são prováveis." },
      { range: "61-80%", status: "Ardente", description: "Perigoso. Evita operações arriscadas." },
      { range: "81-100%", status: "Crítico", description: "Caçado. Qualquer movimento pode ser o último." },
    ],
    reduction: [
      "Fazer trabalhos legais",
      "Esperar (redução natural)",
      "Pagar subornos (se tiveres contactos)",
      "Mudar de bairro (temporário)",
    ],
  },
};

// ============================================================================
// DICAS E ESTRATÉGIAS
// ============================================================================

export const TIPS_AND_STRATEGIES = {
  beginnerTips: [
    { tip: "Começa devagar", detail: "Não te atires a missões de alto risco logo no início." },
    { tip: "Gere o teu heat", detail: "Alterna entre trabalhos legais e ilegais." },
    { tip: "Junta-te a uma gangue", detail: "Proteção e recursos valem mais que independência." },
    { tip: "Investe em veículos", detail: "Um bom veículo pode salvar a tua vida." },
    { tip: "Conhece os bairros", detail: "Cada zona tem regras e oportunidades diferentes." },
    { tip: "Poupa dinheiro", detail: "Propriedades geram rendimento passivo." },
    { tip: "Faz amigos", detail: "Contactos são mais valiosos que dinheiro." },
  ],

  advancedStrategies: [
    { 
      strategy: "Diversificação Criminal",
      detail: "Não dependas de uma única fonte de rendimento. Mistura missões, propriedades, e negócios.",
    },
    { 
      strategy: "Gestão de Heat por Bairro",
      detail: "Quando o heat está alto num bairro, opera noutro. Distribui a atenção.",
    },
    { 
      strategy: "Timing de Eventos",
      detail: "Planeia grandes operações durante eventos favoráveis como festivais ou apagões.",
    },
    { 
      strategy: "Expansão Territorial Calculada",
      detail: "Guerras são caras. Só ataca territórios que compensem o investimento.",
    },
    { 
      strategy: "Rede de Lavagem",
      detail: "Ter múltiplos negócios reduz taxas de lavagem e risco.",
    },
  ],

  commonMistakes: [
    { mistake: "Ignorar o heat", consequence: "Prisão frequente, perda de dinheiro e reputação." },
    { mistake: "Guerras impulsivas", consequence: "Recursos drenados, inimigos criados." },
    { mistake: "Negligenciar manutenção", consequence: "Veículos e propriedades degradam, perdas." },
    { mistake: "Solo contra gangues", consequence: "Sem apoio, és alvo fácil." },
    { mistake: "Dinheiro sujo acumulado", consequence: "Risco de apreensão, inutilizável." },
  ],
};

// ============================================================================
// PERSONAGENS NPC IMPORTANTES
// ============================================================================

export const IMPORTANT_NPCS = {
  contacts: [
    {
      name: "Zé Careca",
      role: "Informador",
      location: "Alfama",
      description: "Conhece todos os segredos de Alfama. Caro, mas vale cada cêntimo.",
      services: ["Informação sobre gangues", "Localizações de alvos", "Avisos de operações policiais"],
    },
    {
      name: "Dona Carminda",
      role: "Receptadora",
      location: "Mouraria",
      description: "A velha senhora que compra tudo, sem perguntas. Paga bem por qualidade.",
      services: ["Compra de mercadoria roubada", "Documentos falsos", "Esconderijos"],
    },
    {
      name: "Miguel 'O Químico'",
      role: "Fornecedor",
      location: "Bairro Alto",
      description: "Ex-farmacêutico que agora fornece substâncias menos legais.",
      services: ["Drogas a granel", "Receitas de produção", "Equipamento de laboratório"],
    },
    {
      name: "Inspector Ferreira",
      role: "Polícia Corrupto",
      location: "Centro",
      description: "Cinquenta anos de serviço e uma pensão miserável fazem maravilhas.",
      services: ["Avisos de rusgas", "Desaparecimento de provas", "Redução de heat"],
    },
    {
      name: "Rafaela 'A Advogada'",
      role: "Representação Legal",
      location: "Belém",
      description: "Defende criminosos porque paga melhor. Nunca perdeu um caso importante.",
      services: ["Defesa legal", "Redução de sentenças", "Contactos no sistema"],
    },
  ],

  rivals: [
    {
      name: "Bruno 'O Açougueiro'",
      gang: "Os Corvos",
      description: "Violento, impulsivo, e completamente louco. Evita confrontos directos.",
      threat: "ALTO",
    },
    {
      name: "Dmitri Volkov",
      gang: "Máfia Russa",
      description: "Frio, calculista, profissional. Não é inimigo que queiras ter.",
      threat: "EXTREMO",
    },
    {
      name: "Sofia Chen",
      gang: "Tríade",
      description: "Subestimá-la foi o último erro de muitos. Inteligência letal.",
      threat: "ALTO",
    },
  ],
};

// ============================================================================
// CITAÇÕES E FRASES DO SUBMUNDO
// ============================================================================

export const QUOTES = {
  loading: [
    "A cidade nunca dorme, e os seus demónios também não...",
    "No submundo, todos os caminhos levam ao mesmo lugar...",
    "Confiança é uma moeda que se gasta rapidamente...",
    "As sombras guardam segredos de quem sabe procurar...",
    "Lisboa tem sete colinas e mil maneiras de cair...",
    "O fado canta a saudade, o submundo canta a ambição...",
    "Cada rua conta uma história. Algumas acabam mal...",
    "O dinheiro fala, mas no submundo, grita...",
  ],
  success: [
    "Mais um dia, mais um euro sujo.",
    "O crime compensa, se souberes o que fazes.",
    "A sorte favorece os audazes.",
    "Quem arrisca, petisca.",
    "Bem feito é melhor que bem dito.",
  ],
  failure: [
    "Nem sempre se ganha...",
    "Às vezes o destino tem outros planos.",
    "Aprender com os erros faz parte do jogo.",
    "Levanta-te, sacode a poeira, continua.",
    "A queda é só o começo da subida.",
  ],
  wisdom: [
    "Amigos próximos, inimigos mais perto ainda.",
    "O silêncio é mais valioso que o ouro.",
    "Quem muito fala, pouco vive.",
    "A paciência é a arma dos vencedores.",
    "Três podem guardar um segredo, se dois estiverem mortos.",
    "Não mostres as cartas antes do fim do jogo.",
    "A vingança é um prato que se serve frio.",
  ],
};

// ============================================================================
// GLOSSÁRIO DO SUBMUNDO
// ============================================================================

export const GLOSSARY = {
  terms: [
    { term: "Heat", definition: "Nível de atenção policial. Quanto mais alto, mais perigoso." },
    { term: "Dinheiro Sujo", definition: "Dinheiro ganho ilegalmente que precisa ser lavado." },
    { term: "Dinheiro Limpo", definition: "Dinheiro legítimo ou já lavado, utilizável livremente." },
    { term: "Lavagem", definition: "Processo de converter dinheiro sujo em limpo." },
    { term: "Território", definition: "Zona controlada por uma gangue." },
    { term: "Guerra", definition: "Conflito aberto entre gangues por território." },
    { term: "Cofre", definition: "Tesouro colectivo de uma gangue." },
    { term: "Reputação", definition: "Medida do teu respeito no submundo." },
    { term: "Contacto", definition: "Pessoa que oferece serviços ou informações." },
    { term: "Rusga", definition: "Operação policial de busca e captura." },
    { term: "Mercado Negro", definition: "Sistema de comércio entre jogadores." },
    { term: "Crafting", definition: "Produção de bens ilegais em negócios." },
    { term: "Evento", definition: "Acontecimento temporário que afecta a cidade." },
    { term: "Fuga", definition: "Escape de uma situação perigosa." },
    { term: "Informador", definition: "Pessoa que vende informações valiosas." },
  ],
};

// ============================================================================
// EXPORTAÇÃO DE FUNÇÕES UTILITÁRIAS
// ============================================================================

/**
 * Obtém uma citação aleatória para ecrãs de loading
 */
export const getRandomLoadingQuote = () => {
  return QUOTES.loading[Math.floor(Math.random() * QUOTES.loading.length)];
};

/**
 * Obtém uma citação de sucesso aleatória
 */
export const getRandomSuccessQuote = () => {
  return QUOTES.success[Math.floor(Math.random() * QUOTES.success.length)];
};

/**
 * Obtém uma citação de falha aleatória
 */
export const getRandomFailureQuote = () => {
  return QUOTES.failure[Math.floor(Math.random() * QUOTES.failure.length)];
};

/**
 * Obtém uma citação de sabedoria aleatória
 */
export const getRandomWisdomQuote = () => {
  return QUOTES.wisdom[Math.floor(Math.random() * QUOTES.wisdom.length)];
};

/**
 * Obtém informação de lore de um bairro pelo ID
 */
export const getNeighborhoodLore = (neighborhoodId) => {
  return NEIGHBORHOODS_LORE[neighborhoodId] || null;
};

/**
 * Obtém detalhes de lore de um veículo pelo ID
 */
export const getVehicleLore = (vehicleId) => {
  return VEHICLES_LORE.vehicleDetails[vehicleId] || null;
};

/**
 * Obtém informação de uma gangue pelo nome ou tag
 */
export const getGangInfo = (nameOrTag) => {
  return GANGS_LORE.majorGangs.find(
    g => g.name.toLowerCase() === nameOrTag.toLowerCase() || 
         g.tag.toLowerCase() === nameOrTag.toLowerCase()
  ) || null;
};

/**
 * Obtém um termo do glossário
 */
export const getGlossaryTerm = (term) => {
  return GLOSSARY.terms.find(
    t => t.term.toLowerCase() === term.toLowerCase()
  ) || null;
};

/**
 * Obtém dicas para iniciantes
 */
export const getBeginnerTips = () => {
  return TIPS_AND_STRATEGIES.beginnerTips;
};

/**
 * Obtém estratégias avançadas
 */
export const getAdvancedStrategies = () => {
  return TIPS_AND_STRATEGIES.advancedStrategies;
};

/**
 * Obtém informação de um NPC pelo nome
 */
export const getNPCInfo = (name) => {
  const contact = IMPORTANT_NPCS.contacts.find(
    c => c.name.toLowerCase().includes(name.toLowerCase())
  );
  if (contact) return { ...contact, type: 'contact' };
  
  const rival = IMPORTANT_NPCS.rivals.find(
    r => r.name.toLowerCase().includes(name.toLowerCase())
  );
  if (rival) return { ...rival, type: 'rival' };
  
  return null;
};

/**
 * Exportação padrão com todos os dados
 */
export default {
  GAME_LORE,
  NEIGHBORHOODS_LORE,
  GANGS_LORE,
  VEHICLES_LORE,
  MISSIONS_LORE,
  ECONOMY_LORE,
  EVENTS_LORE,
  PROGRESSION_LORE,
  TIPS_AND_STRATEGIES,
  IMPORTANT_NPCS,
  QUOTES,
  GLOSSARY,
  // Utility functions
  getRandomLoadingQuote,
  getRandomSuccessQuote,
  getRandomFailureQuote,
  getRandomWisdomQuote,
  getNeighborhoodLore,
  getVehicleLore,
  getGangInfo,
  getGlossaryTerm,
  getBeginnerTips,
  getAdvancedStrategies,
  getNPCInfo,
};

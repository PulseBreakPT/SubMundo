import { useState, useEffect, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Card, ProgressBar } from '../components/ProgressBar';
import { Button, Badge, Modal, Tooltip, FadeIn, Alert, Toggle, Checkbox, Accordion, CopyButton } from '../components/UI';
import { 
  ScrollText, Check, X, AlertTriangle, Gavel, UserX, Shield, Scale, FileWarning, Ban,
  ChevronDown, ChevronUp, ChevronRight, Search, Eye, EyeOff, Download, Printer,
  Calendar, Clock, ExternalLink, Mail, Phone, Globe, MessageSquare,
  Info, HelpCircle, Bookmark, Share2, FileText, Book, List, Hash,
  Users, Target, DollarSign, Building, Factory, Car, Swords, Flame,
  Lock, Unlock, Award, Crown, Star, Zap, Gift, Trophy,
  AlertCircle, CheckCircle, XCircle, Minus, Plus, ArrowUp, ArrowDown,
  Skull, Radio, MapPin, Activity, TrendingUp, Settings, Bell
} from 'lucide-react';
import clsx from 'clsx';

// ============================================================================
// CONSTANTES
// ============================================================================

const TERMS_VERSION = '2.1.0';
const LAST_UPDATE = '1 de Julho de 2025';
const EFFECTIVE_DATE = '15 de Julho de 2025';

const TABLE_OF_CONTENTS = [
  { id: 'acceptance', label: 'Aceitação dos Termos', icon: Check },
  { id: 'eligibility', label: 'Elegibilidade', icon: UserX },
  { id: 'conduct', label: 'Regras de Conduta', icon: Shield },
  { id: 'intellectual', label: 'Propriedade Intelectual', icon: Scale },
  { id: 'penalties', label: 'Penalizações', icon: Ban },
  { id: 'liability', label: 'Limitação de Responsabilidade', icon: FileWarning },
  { id: 'content', label: 'Conteúdo do Jogo', icon: AlertTriangle },
  { id: 'virtual', label: 'Bens Virtuais', icon: DollarSign },
  { id: 'modifications', label: 'Modificações', icon: Settings },
  { id: 'termination', label: 'Rescisão', icon: XCircle },
  { id: 'legal', label: 'Disposições Legais', icon: Gavel }
];

const QUICK_SUMMARY = [
  { text: 'Joga de forma justa e respeita outros jogadores', icon: Check, color: 'success' },
  { text: 'Não uses cheats, bots ou exploits', icon: Check, color: 'success' },
  { text: 'O conteúdo é fictício - para maiores de 16 anos', icon: Check, color: 'success' },
  { text: 'Podemos banir contas que violem as regras', icon: Check, color: 'success' },
  { text: 'O jogo é gratuito e sem valor monetário real', icon: Check, color: 'success' },
  { text: 'Respeitamos a tua privacidade e dados', icon: Check, color: 'success' }
];

const PROHIBITED_ACTIONS = [
  { text: 'Usar cheats, bots ou scripts automatizados', severity: 'high' },
  { text: 'Explorar bugs para vantagem injusta', severity: 'high' },
  { text: 'Assediar, ameaçar ou insultar outros jogadores', severity: 'high' },
  { text: 'Partilhar ou vender contas', severity: 'medium' },
  { text: 'Tentar hackear ou comprometer o sistema', severity: 'critical' },
  { text: 'Fazer-se passar por staff ou outros jogadores', severity: 'medium' },
  { text: 'Publicar conteúdo ofensivo ou ilegal', severity: 'high' },
  { text: 'Criar múltiplas contas para obter vantagens', severity: 'medium' },
  { text: 'Manipular a economia do jogo de forma fraudulenta', severity: 'high' },
  { text: 'Divulgar informações privadas de outros jogadores', severity: 'critical' }
];

const PENALTY_TIERS = [
  {
    level: 'Leve',
    color: 'warning',
    examples: ['Spam', 'Linguagem imprópria', 'Comportamento menor'],
    penalties: ['Aviso formal', 'Silência temporário (1-24h)', 'Restrição de chat']
  },
  {
    level: 'Moderada',
    color: 'error',
    examples: ['Exploits menores', 'Assédio leve', 'Violação de regras repetida'],
    penalties: ['Suspensão temporária (1-7 dias)', 'Reset de progresso parcial', 'Perda de privilégios']
  },
  {
    level: 'Grave',
    color: 'purple',
    examples: ['Uso de cheats', 'Assédio grave', 'Fraude'],
    penalties: ['Suspensão longa (7-30 dias)', 'Reset de progresso total', 'Banimento de funcionalidades']
  },
  {
    level: 'Crítica',
    color: 'default',
    examples: ['Hacking', 'Ameaças reais', 'Atividade ilegal'],
    penalties: ['Banimento permanente', 'Possível ação legal', 'Denúncia às autoridades']
  }
];

const SECTIONS = [
  {
    id: 'acceptance',
    icon: Check,
    title: 'Aceitação dos Termos',
    content: `Ao criares uma conta e utilizares o SUBMUNDO, aceitas estes Termos e Condições na sua totalidade. Se não concordares com algum ponto, não deves utilizar o serviço.

Estes termos constituem um acordo legal entre ti ("Jogador") e a equipa SUBMUNDO ("Nós"). O jogo é fornecido "tal como está" para fins de entretenimento.

**Acordo Vinculativo**
Ao clicar em "Criar Conta" ou "Aceitar", confirmas que:
• Leste e compreendes estes termos
• Tens capacidade legal para aceitar este acordo
• Concordas em cumprir todas as regras e políticas
• Aceitas receber comunicações relacionadas com o jogo

**Atualizações dos Termos**
Reservamo-nos o direito de atualizar estes termos a qualquer momento. Alterações significativas serão comunicadas com 30 dias de antecedência através de:
• Notificação no jogo
• Email (se fornecido)
• Anúncio na página de novidades

A continuação do uso após alterações implica aceitação dos novos termos.`
  },
  {
    id: 'eligibility',
    icon: UserX,
    title: 'Elegibilidade',
    content: `Para jogar SUBMUNDO deves cumprir os seguintes requisitos:

**Idade Mínima**
• Deves ter pelo menos **16 anos de idade**
• Se tens entre 16 e 18 anos, deves ter autorização de um tutor legal
• Encarregados de educação são responsáveis pela atividade de menores

**Requisitos de Conta**
• Fornecer informações verdadeiras no registo
• Usar um endereço de email válido e acessível
• Criar apenas uma conta por pessoa
• Não usar nomes de utilizador ofensivos ou enganosos

**Restrições**
• Não podes jogar se estiveres banido de versões anteriores
• Não podes jogar se o jogo for ilegal na tua jurisdição
• Não podes jogar usando VPN para contornar restrições geográficas

**Verificação**
Reservamo-nos o direito de solicitar verificação de idade ou identidade em casos suspeitos. O não cumprimento pode resultar em suspensão da conta.`
  },
  {
    id: 'conduct',
    icon: Shield,
    title: 'Regras de Conduta',
    content: `Ao jogar SUBMUNDO, comprometes-te a seguir as seguintes regras:

**Comportamento Permitido**
• Jogar de forma justa e honesta dentro das mecânicas do jogo
• Interagir respeitosamente com outros jogadores
• Reportar bugs e comportamentos suspeitos
• Competir de forma saudável pelo topo dos rankings
• Participar em eventos e atividades da comunidade
• Ajudar novos jogadores a aprender o jogo

**Comportamento Proibido**
• Usar cheats, bots, scripts automatizados ou software de terceiros
• Explorar bugs ou glitches para obter vantagem injusta
• Assediar, ameaçar, intimidar ou insultar outros jogadores
• Partilhar, vender ou comprar contas
• Tentar hackear, atacar ou comprometer os nossos sistemas
• Fazer-se passar por membros da equipa ou outros jogadores
• Publicar conteúdo ilegal, ofensivo ou sexualmente explícito
• Fazer spam ou publicidade não autorizada
• Manipular a economia do jogo de forma fraudulenta
• Criar múltiplas contas para obter vantagens injustas

**Comunicação**
• Respeita a diversidade cultural e de opiniões
• Evita linguagem vulgar, racista ou discriminatória
• Não partilhes informações pessoais tuas ou de outros
• Reporta comportamentos inadequados através dos canais oficiais`
  },
  {
    id: 'intellectual',
    icon: Scale,
    title: 'Propriedade Intelectual',
    content: `Todo o conteúdo do SUBMUNDO é propriedade exclusiva da nossa equipa:

**Elementos Protegidos**
• Código fonte, arquitetura e design técnico
• Gráficos, ícones, ilustrações e elementos visuais
• Textos, diálogos, histórias e lore do jogo
• Nome, logótipo e marca SUBMUNDO
• Mecânicas de jogo, sistemas e fórmulas
• Sons, músicas e efeitos sonoros
• Bases de dados e estruturas de dados

**Restrições**
É expressamente proibido:
• Copiar, modificar ou distribuir qualquer conteúdo
• Fazer engenharia reversa do código
• Criar obras derivadas sem autorização escrita
• Usar a marca SUBMUNDO para fins comerciais
• Extrair dados ou conteúdo de forma automatizada

**Licença de Uso**
Ao jogar, recebes uma licença limitada, não-exclusiva e revogável para:
• Aceder e jogar SUBMUNDO para uso pessoal
• Fazer screenshots para uso não comercial
• Criar conteúdo de vídeo com créditos apropriados

Os teus dados de jogo são licenciados para teu uso pessoal dentro do jogo, mas permanecemos proprietários da infraestrutura.`
  },
  {
    id: 'penalties',
    icon: Ban,
    title: 'Penalizações',
    content: `Violações das regras resultam em penalizações proporcionais à gravidade:

**Infrações Leves**
Exemplos: Spam, linguagem imprópria ocasional, desrespeito menor
Penalidades:
• Aviso formal
• Silênciamento temporário (1-24 horas)
• Restrição de funcionalidades de chat

**Infrações Moderadas**
Exemplos: Exploits menores, assédio repetido, violações reincidentes
Penalidades:
• Suspensão temporária (1-7 dias)
• Reset parcial de progresso
• Perda de privilégios especiais

**Infrações Graves**
Exemplos: Uso de cheats, assédio grave, fraude, multicon
ítas abusivas
Penalidades:
• Suspensão prolongada (7-30 dias)
• Reset total de progresso
• Banimento de funcionalidades específicas

**Infrações Críticas**
Exemplos: Hacking, ameaças reais, atividade criminosa, violação de dados
Penalidades:
• Banimento permanente
• Possível ação legal
• Denúncia às autoridades competentes

**Processo de Apelo**
Podes apelar de penalizações através do email suporte@submundo.game. Apelos são analisados em até 7 dias úteis. Decisões de banimento permanente são finais exceto em casos de erro comprovado.`
  },
  {
    id: 'liability',
    icon: FileWarning,
    title: 'Limitação de Responsabilidade',
    content: `O SUBMUNDO é fornecido para entretenimento "tal como está":

**Isenções de Garantia**
• Não garantimos disponibilidade contínua ou ininterrupta do serviço
• Não garantimos ausência de erros, bugs ou falhas técnicas
• Não somos responsáveis por perdas de dados devido a falhas
• Não garantimos compatibilidade com todos os dispositivos

**Limitações**
• O progresso no jogo não tem valor monetário real
• Podemos modificar, suspender ou descontinuar funcionalidades
• Não somos responsáveis por interações negativas entre jogadores
• Não somos responsáveis por conteúdo gerado por utilizadores

**Assunção de Risco**
Ao jogar, aceitas que:
• Jogas por tua conta e risco
• És responsável pela segurança da tua conta
• Não temos obrigação de compensar perdas virtuais
• Decisões de moderação são à nossa discrição

**Indemnização**
Concordas em indemnizar-nos contra reclamações, danos ou custos resultantes de:
• Violação destes termos por ti
• Uso indevido da tua conta
• Conteúdo que publiques no jogo`
  },
  {
    id: 'content',
    icon: AlertTriangle,
    title: 'Conteúdo do Jogo',
    content: `SUBMUNDO contém temas para maiores de 16 anos:

**Natureza do Conteúdo**
• Referências a atividades criminosas fictícias
• Violência simulada (baseada em texto)
• Economia virtual com elementos de risco
• Competição intensa entre jogadores
• Temas adultos como gangues e territórios

**Aviso Importante**
Todo o conteúdo é **100% fictício** e serve apenas para entretenimento. O jogo:
• Não representa a realidade do crime organizado
• Não promove nem encoraja comportamentos ilegais reais
• Não glorifica violência ou atividades criminosas
• É uma simulação estratégica, não um manual de crime

**Bem-Estar**
Recomendamos:
• Jogar com moderação e fazer pausas regulares
• Não gastar tempo excessivo no jogo
• Procurar ajuda se sentires que o jogo afeta o teu bem-estar
• Contactar suporte se encontrares conteúdo perturbador

**Classificação Etária**
PEGI 16 - Contém referências a crime e violência leve. Não recomendado para menores de 16 anos.`
  },
  {
    id: 'virtual',
    icon: DollarSign,
    title: 'Bens Virtuais',
    content: `Políticas relativas a moeda e bens virtuais:

**Moeda do Jogo**
• Toda a moeda no SUBMUNDO é virtual e não tem valor real
• Não é possível converter moeda virtual em dinheiro real
• Moeda virtual não pode ser transferida, vendida ou trocada fora do jogo
• Reservamo-nos o direito de ajustar balanços para equilíbrio do jogo

**Itens e Propriedades**
• Todos os itens, veículos, propriedades e negócios são virtuais
• Não tens propriedade real sobre bens virtuais
• Bens podem ser removidos por violações ou por equilíbrio
• Em caso de encerramento, bens virtuais serão perdidos

**Compras no Jogo** (se aplicável no futuro)
• Compras são finais e não reembolsáveis
• Menores precisam de autorização para compras
• Promoções e descontos são a nosso critério

**Economia do Jogo**
• Podemos alterar preços, recompensas e balanços
• Manipulação económica é proibida e penalizada
• Não compensamos perdas por flutuações de mercado`
  },
  {
    id: 'modifications',
    icon: Settings,
    title: 'Modificações do Serviço',
    content: `Reservamo-nos direitos sobre o serviço:

**Alterações**
Podemos a qualquer momento:
• Atualizar, modificar ou remover funcionalidades
• Alterar mecânicas de jogo para equilíbrio
• Adicionar novos conteúdos e sistemas
• Corrigir bugs e problemas técnicos
• Alterar interface e design visual

**Manutenção**
• Manutenções programadas serão anunciadas com antecedência
• Manutenções de emergência podem ocorrer sem aviso
• Não compensamos por indisponibilidade durante manutenção

**Descontinuação**
• Podemos descontinuar o serviço com 60 dias de aviso
• Em caso de descontinuação, dados podem ser exportados
• Não temos obrigação de manter o serviço indefinidamente

**Eventos e Conteúdo Sazonal**
• Eventos têm duração limitada e podem não regressar
• Recompensas de eventos são exclusivas do período
• Não garantimos repetição de eventos passados`
  },
  {
    id: 'termination',
    icon: XCircle,
    title: 'Rescisão',
    content: `Condições para término da relação:

**Rescisão pelo Jogador**
Podes terminar a tua conta a qualquer momento:
• Através das definições de conta
• Contactando o suporte por email
• A eliminação é processada em até 30 dias
• Alguns dados podem ser retidos por obrigação legal

**Rescisão por Nós**
Podemos terminar ou suspender a tua conta:
• Por violação destes termos
• Por inatividade prolongada (mais de 2 anos)
• Por atividade suspeita ou fraudulenta
• Por ordem judicial ou legal

**Efeitos da Rescisão**
Após rescisão:
• Perdes acesso à conta e todos os dados de jogo
• Bens virtuais são permanentemente perdidos
• Não tens direito a reembolsos ou compensações
• Podes criar nova conta (exceto se banido)

**Sobrevivência**
Após rescisão, mantêm-se válidas:
• Cláusulas de propriedade intelectual
• Limitações de responsabilidade
• Obrigações de confidencialidade`
  },
  {
    id: 'legal',
    icon: Gavel,
    title: 'Disposições Legais',
    content: `Termos legais adicionais:

**Lei Aplicável**
Estes termos são regidos pela lei portuguesa. Em caso de conflito com leis locais do jogador, aplica-se a lei mais favorável ao consumidor.

**Jurisdição**
Os tribunais de Lisboa, Portugal, têm jurisdição exclusiva para resolução de disputas, exceto quando proibido por lei local.

**Resolução de Conflitos**
• Encorajamos resolução amiável de disputas
• Contacta primeiro o suporte antes de ações legais
• Podes recorrer a centros de arbitragem de consumo

**Severabilidade**
Se alguma cláusula for considerada inválida ou inexequível, as restantes mantêm-se em pleno vigor.

**Totalidade**
Este documento, juntamente com a Política de Privacidade, constitui o acordo completo entre as partes.

**Não Renúncia**
A não aplicação de qualquer direito não constitui renúncia ao mesmo.

**Contactos Legais**
• Questões gerais: suporte@submundo.game
• Questões legais: legal@submundo.game
• Privacidade: privacidade@submundo.game`
  }
];

// ============================================================================
// COMPONENTE: Table of Contents
// ============================================================================

const TableOfContents = ({ sections, activeSection, onSelect }) => (
  <Card title="Índice" icon={List} className="sticky top-4">
    <div className="space-y-1">
      {TABLE_OF_CONTENTS.map((item, i) => {
        const Icon = item.icon;
        const isActive = activeSection === item.id;
        
        return (
          <button
            key={item.id}
            onClick={() => onSelect(item.id)}
            className={clsx(
              'w-full px-3 py-2 text-left text-sm flex items-center gap-2 transition-all',
              isActive 
                ? 'bg-primary/10 text-primary border-l-2 border-primary' 
                : 'text-text-secondary hover:text-text-primary hover:bg-surface-highlight'
            )}
          >
            <span className="text-xs text-text-secondary w-5">{i + 1}.</span>
            <Icon size={14} />
            <span className="truncate">{item.label}</span>
          </button>
        );
      })}
    </div>
  </Card>
);

// ============================================================================
// COMPONENTE: Section Component
// ============================================================================

const TermsSection = ({ section, index, isExpanded, onToggle }) => {
  const Icon = section.icon;

  return (
    <div 
      id={section.id}
      className="bg-surface border border-border overflow-hidden scroll-mt-20"
    >
      <button
        onClick={onToggle}
        className="w-full p-4 bg-surface-highlight border-b border-border flex items-center gap-3 hover:bg-surface-highlight/80 transition-colors"
      >
        <div className="w-10 h-10 flex items-center justify-center bg-primary/10 text-primary">
          <Icon size={20} />
        </div>
        <div className="flex-1 text-left">
          <h2 className="font-heading text-lg text-text-primary">
            {index + 1}. {section.title}
          </h2>
        </div>
        {isExpanded ? (
          <ChevronUp size={20} className="text-primary" />
        ) : (
          <ChevronDown size={20} className="text-text-secondary" />
        )}
      </button>
      
      {isExpanded && (
        <FadeIn>
          <div className="p-4">
            <div className="text-text-secondary leading-relaxed whitespace-pre-line prose-custom">
              {section.content.split('**').map((part, i) => 
                i % 2 === 1 ? <strong key={i} className="text-text-primary">{part}</strong> : part
              )}
            </div>
          </div>
        </FadeIn>
      )}
    </div>
  );
};

// ============================================================================
// COMPONENTE: Quick Summary Card
// ============================================================================

const QuickSummaryCard = () => (
  <Card title="Resumo Rápido" icon={Zap}>
    <ul className="space-y-2">
      {QUICK_SUMMARY.map((item, i) => (
        <li key={i} className="flex items-center gap-2">
          <item.icon size={16} className={`text-${item.color}`} />
          <span className="text-text-secondary text-sm">{item.text}</span>
        </li>
      ))}
    </ul>
  </Card>
);

// ============================================================================
// COMPONENTE: Prohibited Actions Card
// ============================================================================

const ProhibitedActionsCard = () => (
  <Card title="Ações Proibidas" icon={Ban} collapsible>
    <ul className="space-y-2">
      {PROHIBITED_ACTIONS.map((item, i) => (
        <li key={i} className="flex items-start gap-2">
          <X size={14} className={clsx(
            'mt-0.5 flex-shrink-0',
            item.severity === 'critical' && 'text-error',
            item.severity === 'high' && 'text-warning',
            item.severity === 'medium' && 'text-text-secondary'
          )} />
          <span className="text-text-secondary text-sm">{item.text}</span>
        </li>
      ))}
    </ul>
  </Card>
);

// ============================================================================
// COMPONENTE: Penalty Tiers Card
// ============================================================================

const PenaltyTiersCard = () => (
  <Card title="Níveis de Penalização" icon={AlertTriangle} collapsible>
    <div className="space-y-4">
      {PENALTY_TIERS.map((tier, i) => (
        <div key={i} className={`p-3 bg-${tier.color}/5 border border-${tier.color}/30`}>
          <h4 className={`font-heading text-sm text-${tier.color} mb-2`}>{tier.level}</h4>
          <p className="text-xs text-text-secondary mb-2">
            Ex: {tier.examples.join(', ')}
          </p>
          <ul className="space-y-1">
            {tier.penalties.map((penalty, j) => (
              <li key={j} className="text-xs text-text-secondary flex items-center gap-1">
                <ChevronRight size={10} />
                {penalty}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  </Card>
);

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function TermsPage() {
  const [expandedSections, setExpandedSections] = useState(() => {
    // Expandir todas por defeito
    return SECTIONS.reduce((acc, s) => ({ ...acc, [s.id]: true }), {});
  });
  const [activeSection, setActiveSection] = useState('acceptance');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const sectionRefs = useRef({});

  // Track scroll position for active section
  useEffect(() => {
    const handleScroll = () => {
      for (const section of SECTIONS) {
        const el = document.getElementById(section.id);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= 100 && rect.bottom > 100) {
            setActiveSection(section.id);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleSection = (id) => {
    setExpandedSections(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setExpandedSections(prev => ({ ...prev, [id]: true }));
    }
  };

  const expandAll = () => {
    setExpandedSections(SECTIONS.reduce((acc, s) => ({ ...acc, [s.id]: true }), {}));
  };

  const collapseAll = () => {
    setExpandedSections({});
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 pb-20 md:pb-6" data-testid="terms-page">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-heading text-2xl text-primary flex items-center gap-2">
            <ScrollText size={28} /> Termos e Condições
          </h1>
          <p className="text-text-secondary text-sm flex items-center gap-2">
            <Calendar size={14} />
            Última atualização: {LAST_UPDATE}
            <Badge variant="primary" size="xs">v{TERMS_VERSION}</Badge>
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Tooltip content="Imprimir">
            <button
              onClick={handlePrint}
              className="p-2 border border-border hover:border-primary/50 transition-colors"
            >
              <Printer size={18} className="text-text-secondary" />
            </button>
          </Tooltip>
          <Tooltip content="Expandir todos">
            <button
              onClick={expandAll}
              className="p-2 border border-border hover:border-primary/50 transition-colors"
            >
              <Plus size={18} className="text-text-secondary" />
            </button>
          </Tooltip>
          <Tooltip content="Colapsar todos">
            <button
              onClick={collapseAll}
              className="p-2 border border-border hover:border-primary/50 transition-colors"
            >
              <Minus size={18} className="text-text-secondary" />
            </button>
          </Tooltip>
        </div>
      </div>

      {/* Warning Banner */}
      <Alert variant="warning" icon={AlertTriangle}>
        <strong>Leitura Importante</strong> - Ao jogar SUBMUNDO, aceitas automaticamente estes termos. 
        Recomendamos a leitura completa antes de continuar a jogar.
      </Alert>

      {/* Main Content */}
      <div className="grid lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="hidden lg:block space-y-6">
          <TableOfContents 
            sections={SECTIONS}
            activeSection={activeSection}
            onSelect={scrollToSection}
          />
          <QuickSummaryCard />
        </div>
        
        {/* Content */}
        <div className="lg:col-span-3 space-y-4">
          {/* Effective Date Notice */}
          <div className="bg-primary/10 border border-primary/30 p-4 flex items-start gap-3">
            <Info size={20} className="text-primary flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-primary font-heading">Data de Entrada em Vigor</p>
              <p className="text-text-secondary text-sm">
                Estes termos entram em vigor a {EFFECTIVE_DATE}. A continuação do uso 
                após esta data constitui aceitação automática.
              </p>
            </div>
          </div>

          {/* Sections */}
          {SECTIONS.map((section, i) => (
            <FadeIn key={section.id} delay={i * 50}>
              <TermsSection
                section={section}
                index={i}
                isExpanded={expandedSections[section.id]}
                onToggle={() => toggleSection(section.id)}
              />
            </FadeIn>
          ))}

          {/* Accept Footer */}
          <Card className="text-center">
            <ScrollText size={32} className="mx-auto text-text-secondary mb-3" />
            <p className="text-text-primary font-heading mb-2">Ao continuar a jogar, aceitas estes termos.</p>
            <p className="text-text-secondary text-sm mb-4">
              Dúvidas? Contacta-nos: suporte@submundo.game
            </p>
            <div className="flex justify-center gap-3">
              <Link to="/privacidade">
                <Button variant="secondary" icon={Shield}>
                  Ver Privacidade
                </Button>
              </Link>
              <Link to="/faq">
                <Button variant="secondary" icon={HelpCircle}>
                  FAQ
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>

      {/* Mobile Sidebar Cards */}
      <div className="lg:hidden space-y-6">
        <QuickSummaryCard />
        <ProhibitedActionsCard />
        <PenaltyTiersCard />
      </div>
    </div>
  );
}

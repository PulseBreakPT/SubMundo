import { useState, useEffect, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Card, ProgressBar } from '../components/ProgressBar';
import { Button, Badge, Modal, Tooltip, FadeIn, Alert, Toggle, Checkbox, Accordion, CopyButton, Tabs } from '../components/UI';
import { 
  Shield, Eye, Database, Lock, UserCheck, Mail, Clock, AlertTriangle, FileText,
  ChevronDown, ChevronUp, ChevronRight, Search, Download, Printer,
  Calendar, ExternalLink, Globe, MessageSquare, Phone,
  Info, HelpCircle, Bookmark, Share2, Book, List, Hash,
  Check, X, Settings, Bell, Key, Trash2, RefreshCw,
  User, Users, Target, DollarSign, Building, Factory, Car,
  Unlock, Award, Crown, Star, Zap, Gift, Trophy, Activity,
  Server, Cpu, HardDrive, Wifi, Cookie, Fingerprint, MapPin,
  Plus, Minus, ArrowUp, ArrowDown, AlertCircle, CheckCircle, XCircle,
  ScrollText
} from 'lucide-react';
import clsx from 'clsx';

// ============================================================================
// CONSTANTES
// ============================================================================

const PRIVACY_VERSION = '2.0.0';
const LAST_UPDATE = '1 de Julho de 2025';
const DPO_EMAIL = 'privacidade@submundo.game';

const TABLE_OF_CONTENTS = [
  { id: 'collection', label: 'Dados que Recolhemos', icon: Database },
  { id: 'usage', label: 'Como Usamos os Dados', icon: Eye },
  { id: 'security', label: 'Segurança dos Dados', icon: Lock },
  { id: 'rights', label: 'Os Teus Direitos', icon: UserCheck },
  { id: 'retention', label: 'Retenção de Dados', icon: Clock },
  { id: 'cookies', label: 'Cookies e Tecnologias', icon: Cookie },
  { id: 'sharing', label: 'Partilha de Dados', icon: Users },
  { id: 'international', label: 'Transferências Internacionais', icon: Globe },
  { id: 'minors', label: 'Menores de Idade', icon: User },
  { id: 'changes', label: 'Alterações à Política', icon: RefreshCw },
  { id: 'contact', label: 'Contacto', icon: Mail }
];

const DATA_CATEGORIES = [
  {
    category: 'Dados de Conta',
    icon: User,
    color: 'primary',
    items: [
      { data: 'Email', purpose: 'Autenticação e comunicação', retention: 'Até eliminação da conta' },
      { data: 'Nome de utilizador', purpose: 'Identificação no jogo', retention: 'Até eliminação da conta' },
      { data: 'Password (hash)', purpose: 'Autenticação segura', retention: 'Até eliminação da conta' },
      { data: 'Data de registo', purpose: 'Gestão de conta', retention: 'Até eliminação da conta' }
    ]
  },
  {
    category: 'Dados de Jogo',
    icon: Activity,
    color: 'success',
    items: [
      { data: 'Progresso e nível', purpose: 'Funcionamento do jogo', retention: 'Até eliminação da conta' },
      { data: 'Estatísticas e conquistas', purpose: 'Rankings e funcionalidades', retention: 'Até eliminação da conta' },
      { data: 'Transações no jogo', purpose: 'Histórico e auditoria', retention: '2 anos' },
      { data: 'Interações com outros', purpose: 'Funcionalidades sociais', retention: 'Até eliminação da conta' }
    ]
  },
  {
    category: 'Dados Técnicos',
    icon: Cpu,
    color: 'warning',
    items: [
      { data: 'Endereço IP', purpose: 'Segurança e anti-fraude', retention: '90 dias' },
      { data: 'Tipo de dispositivo', purpose: 'Otimização de experiência', retention: 'Sessão' },
      { data: 'Browser e versão', purpose: 'Compatibilidade', retention: 'Sessão' },
      { data: 'Logs de acesso', purpose: 'Segurança e diagnóstico', retention: '90 dias' }
    ]
  }
];

const USER_RIGHTS = [
  {
    right: 'Acesso',
    icon: Eye,
    description: 'Podes solicitar uma cópia de todos os teus dados pessoais',
    howTo: 'Envia email para privacidade@submundo.game com o assunto "Pedido de Acesso"'
  },
  {
    right: 'Retificação',
    icon: Settings,
    description: 'Podes corrigir dados pessoais incorretos ou incompletos',
    howTo: 'Altera nas definições da conta ou contacta o suporte'
  },
  {
    right: 'Eliminação',
    icon: Trash2,
    description: 'Podes pedir a eliminação da tua conta e dados pessoais',
    howTo: 'Usa a opção "Eliminar Conta" nas definições ou contacta o suporte'
  },
  {
    right: 'Portabilidade',
    icon: Download,
    description: 'Podes exportar os teus dados num formato legível por máquina',
    howTo: 'Solicita exportação via email para privacidade@submundo.game'
  },
  {
    right: 'Oposição',
    icon: XCircle,
    description: 'Podes opor-te a certos tratamentos dos teus dados',
    howTo: 'Contacta privacidade@submundo.game especificando o tratamento'
  },
  {
    right: 'Restrição',
    icon: Lock,
    description: 'Podes pedir limitação do tratamento em certas circunstâncias',
    howTo: 'Contacta privacidade@submundo.game com a justificação'
  }
];

const SECURITY_MEASURES = [
  { measure: 'Encriptação bcrypt', description: 'Passwords são encriptadas com hash unidirecional', icon: Key },
  { measure: 'Tokens JWT', description: 'Autenticação segura com tokens temporários', icon: Lock },
  { measure: 'HTTPS/TLS', description: 'Toda a comunicação é encriptada em trânsito', icon: Shield },
  { measure: 'Backups regulares', description: 'Dados guardados com redundância', icon: HardDrive },
  { measure: 'Acesso limitado', description: 'Apenas pessoal autorizado acede aos sistemas', icon: UserCheck },
  { measure: 'Monitorização 24/7', description: 'Sistemas monitorizados para deteção de ameaças', icon: Activity },
  { measure: 'Auditoria regular', description: 'Revisões periódicas de segurança', icon: Search },
  { measure: 'Política de incidentes', description: 'Procedimentos definidos para violações', icon: AlertTriangle }
];

const COOKIE_TYPES = [
  {
    type: 'Essenciais',
    required: true,
    description: 'Necessários para o funcionamento básico do jogo',
    examples: ['Token de sessão', 'Preferências de idioma'],
    duration: 'Sessão ou 30 dias'
  },
  {
    type: 'Funcionais',
    required: false,
    description: 'Melhoram a experiência do utilizador',
    examples: ['Preferências de interface', 'Configurações guardadas'],
    duration: '1 ano'
  },
  {
    type: 'Analíticos',
    required: false,
    description: 'Ajudam-nos a entender como o jogo é usado',
    examples: ['Páginas visitadas', 'Tempo de sessão'],
    duration: '2 anos'
  }
];

const SECTIONS = [
  {
    id: 'collection',
    icon: Database,
    title: 'Dados que Recolhemos',
    content: `Ao utilizares o SUBMUNDO, recolhemos os seguintes tipos de dados:

**Dados de Conta**
• **Email**: Para autenticação, recuperação de conta e comunicações importantes
• **Nome de utilizador**: Para te identificar no jogo e nas interações
• **Password**: Armazenada de forma encriptada (nunca em texto plano)

**Dados de Jogo**
• **Progresso**: Nível, experiência, estatísticas, conquistas
• **Bens virtuais**: Propriedades, negócios, veículos, dinheiro virtual
• **Transações**: Histórico de compras e vendas no jogo
• **Interações sociais**: Membros de gangue, mensagens (se aplicável)

**Dados Técnicos**
• **Informações de sessão**: Login, logout, última atividade
• **Dados de dispositivo**: Tipo, sistema operativo, browser
• **Endereço IP**: Para segurança e prevenção de fraude

**Dados que NÃO Recolhemos**
• Informações financeiras reais (cartões, contas bancárias)
• Localização precisa (GPS)
• Dados biométricos
• Histórico de navegação fora do jogo`
  },
  {
    id: 'usage',
    icon: Eye,
    title: 'Como Usamos os Dados',
    content: `Os teus dados são utilizados exclusivamente para:

**Funcionamento do Jogo**
• Guardar e sincronizar o teu progresso
• Processar ações e transações no jogo
• Calcular e apresentar rankings
• Gerir funcionalidades sociais (gangues, chat)

**Segurança**
• Prevenir fraudes e comportamentos abusivos
• Detetar e bloquear cheats e bots
• Proteger contra acessos não autorizados
• Verificar a integridade das contas

**Melhorias**
• Analisar padrões de uso (de forma agregada e anónima)
• Identificar bugs e problemas técnicos
• Desenvolver novas funcionalidades
• Otimizar performance e experiência

**Comunicação**
• Enviar notificações importantes sobre o serviço
• Responder a pedidos de suporte
• Informar sobre atualizações e eventos (se autorizares)

**O que NUNCA fazemos**
• Vender os teus dados a terceiros
• Usar dados para publicidade direcionada externa
• Partilhar informações com empresas de marketing
• Criar perfis para vender a anúnciantes`
  },
  {
    id: 'security',
    icon: Lock,
    title: 'Segurança dos Dados',
    content: `Implementamos medidas robustas de segurança:

**Encriptação**
• Passwords encriptadas com bcrypt (hash unidirecional)
• Comunicação protegida com HTTPS/TLS 1.3
• Dados sensíveis encriptados em repouso (AES-256)

**Autenticação**
• Tokens JWT com expiração automática
• Proteção contra ataques de força bruta
• Sessões invalidadas após períodos de inatividade

**Infraestrutura**
• Servidores com firewalls e proteção DDoS
• Backups regulares com redundância geográfica
• Monitorização 24/7 de sistemas
• Ambiente de produção isolado

**Acesso**
• Acesso a dados limitado a pessoal autorizado
• Princípio do menor privilégio
• Logs de acesso para auditoria
• Formação regular da equipa em segurança

**Incidentes**
Em caso de violação de segurança:
• Notificaremos a autoridade de proteção de dados em 72h
• Informaremos os utilizadores afetados
• Tomaremos medidas para minimizar o impacto`
  },
  {
    id: 'rights',
    icon: UserCheck,
    title: 'Os Teus Direitos',
    content: `Tens os seguintes direitos sobre os teus dados pessoais:

**Direito de Acesso**
Podes solicitar uma cópia completa dos teus dados pessoais. Responderemos em até 30 dias.

**Direito de Retificação**
Podes corrigir dados incorretos ou incompletos através das definições da conta ou contactando o suporte.

**Direito de Eliminação ("Direito ao Esquecimento")**
Podes pedir a eliminação da tua conta e dados pessoais. A eliminação é processada em até 30 dias.

**Direito de Portabilidade**
Podes exportar os teus dados num formato legível por máquina (JSON).

**Direito de Oposição**
Podes opor-te a certos tratamentos de dados, especialmente para marketing.

**Direito de Restrição**
Podes pedir limitação do tratamento enquanto uma disputa está a ser analisada.

**Como Exercer os Teus Direitos**
• Email: privacidade@submundo.game
• Tempo de resposta: até 30 dias úteis
• Podes precisar de verificar a tua identidade

**Reclamações**
Se não ficares satisfeito, podes contactar a autoridade de proteção de dados do teu país (em Portugal: CNPD).`
  },
  {
    id: 'retention',
    icon: Clock,
    title: 'Retenção de Dados',
    content: `Os teus dados são retidos de acordo com as seguintes políticas:

**Conta Ativa**
• Dados de conta e jogo: mantidos enquanto a conta existir
• Atualizações regulares baseadas na tua atividade

**Conta Inativa**
• Contas sem atividade há mais de 2 anos podem ser arquivadas
• Receberás aviso prévio antes do arquivamento
• Podes reativar a conta fazendo login

**Após Eliminação**
• Dados pessoais removidos em até 30 dias
• Backups purgados em até 90 dias
• Dados agregados e anonimizados podem ser mantidos

**Obrigações Legais**
• Alguns dados podem ser retidos por obrigação legal
• Logs de segurança mantidos por 90 dias
• Dados para disputas legais até resolução

**Períodos Específicos**
• Logs de acesso: 90 dias
• Logs de transações: 2 anos
• Comunicações de suporte: 1 ano
• Dados de moderação: 2 anos`
  },
  {
    id: 'cookies',
    icon: Cookie,
    title: 'Cookies e Tecnologias',
    content: `Utilizamos tecnologias de armazenamento local:

**LocalStorage**
• Token de sessão para autenticação
• Preferências de interface
• Cache de dados para performance

**Cookies Essenciais**
• Necessários para o funcionamento básico
• Não podem ser desativados
• Duração: sessão ou 30 dias

**Cookies Funcionais (Opcionais)**
• Guardam preferências de utilização
• Podes desativar nas definições
• Duração: 1 ano

**O que NÃO usamos**
• Cookies de terceiros para tracking
• Pixels de rastreamento
• Fingerprinting de dispositivos
• Cookies de publicidade

**Como Gerir**
• Podes limpar os dados do browser a qualquer momento
• Terás de fazer login novamente
• Algumas funcionalidades podem ser afetadas`
  },
  {
    id: 'sharing',
    icon: Users,
    title: 'Partilha de Dados',
    content: `Informações sobre partilha de dados com terceiros:

**Princípio Geral**
Não vendemos nem partilhamos os teus dados pessoais com terceiros para fins comerciais.

**Partilha Limitada**
Podemos partilhar dados apenas nas seguintes situações:

• **Prestadores de serviços**: Parceiros técnicos que nos ajudam a operar o jogo (hospedagem, email). Têm obrigações contratuais de privacidade.

• **Obrigações legais**: Quando exigido por lei, ordem judicial ou autoridade competente.

• **Proteção de direitos**: Para proteger os nossos direitos, propriedade ou segurança.

• **Com o teu consentimento**: Qualquer outra partilha requer a tua autorização explícita.

**Dados Públicos no Jogo**
Por natureza do jogo, alguns dados são visíveis a outros jogadores:
• Nome de utilizador
• Nível e reputação
• Gangue (se aplicável)
• Posição em rankings

Não partilhamos email ou dados privados.`
  },
  {
    id: 'international',
    icon: Globe,
    title: 'Transferências Internacionais',
    content: `Informações sobre transferência de dados:

**Localização dos Dados**
• Dados armazenados em servidores na União Europeia
• Backups mantidos dentro do Espaço Económico Europeu

**Transferências**
Quando necessário transferir dados para fora da UE:
• Apenas para países com adequada proteção de dados
• Ou com cláusulas contratuais padrão da UE
• Ou com o teu consentimento explícito

**Garantias**
• Todos os parceiros têm obrigações contratuais de privacidade
• Verificamos regularmente a conformidade dos parceiros
• Minimizamos transferências internacionais sempre que possível`
  },
  {
    id: 'minors',
    icon: User,
    title: 'Menores de Idade',
    content: `Políticas relativas a menores de idade:

**Idade Mínima**
• O jogo destina-se a maiores de 16 anos
• Não recolhemos intencionalmente dados de menores de 16

**Responsabilidade Parental**
• Encarregados de educação devem supervisionar a atividade de menores
• São responsáveis por autorizar o uso do jogo

**Descoberta de Dados de Menores**
Se descobrirmos que recolhemos dados de um menor de 16 anos:
• Eliminaremos os dados imediatamente
• Encerraremos a conta
• Notificaremos o encarregado de educação se possível

**Reporte**
Se acreditas que temos dados de um menor de 16 anos, contacta-nos imediatamente em privacidade@submundo.game`
  },
  {
    id: 'changes',
    icon: RefreshCw,
    title: 'Alterações à Política',
    content: `Informações sobre atualizações a esta política:

**Direito de Atualização**
Reservamo-nos o direito de atualizar esta política para:
• Refletir mudanças nos nossos serviços
• Cumprir novas obrigações legais
• Melhorar as práticas de privacidade

**Notificação de Alterações**
Alterações significativas serão comunicadas:
• Notificação no jogo
• Email (para alterações materiais)
• Aviso na página de novidades
• Período de aviso prévio de 30 dias

**Aceitação**
• A continuação do uso após alterações implica aceitação
• Se não concordares, deves deixar de usar o serviço
• Podes eliminar a tua conta a qualquer momento

**Histórico**
Mantemos um histórico de versões desta política. Podes solicitar versões anteriores contactando-nos.`
  },
  {
    id: 'contact',
    icon: Mail,
    title: 'Contacto',
    content: `Para questões sobre privacidade:

**Encarregado de Proteção de Dados (DPO)**
• Email: privacidade@submundo.game
• Tempo de resposta: até 30 dias úteis

**Suporte Geral**
• Email: suporte@submundo.game
• Para questões gerais sobre a conta ou jogo

**Questões Legais**
• Email: legal@submundo.game
• Para notícias legais ou formais

**Autoridade de Controlo**
Se não ficares satisfeito com a nossa resposta, podes contactar a autoridade de proteção de dados:
• Portugal: CNPD (www.cnpd.pt)
• Outros países: Autoridade local competente

**Feedback**
Agradecemos feedback sobre como podemos melhorar as nossas práticas de privacidade. Envia sugestões para privacidade@submundo.game com o assunto "Sugestão de Privacidade".`
  }
];

// ============================================================================
// COMPONENTE: Table of Contents
// ============================================================================

const TableOfContents = ({ activeSection, onSelect }) => (
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
            <Icon size={14} />
            <span className="truncate">{item.label}</span>
          </button>
        );
      })}
    </div>
  </Card>
);

// ============================================================================
// COMPONENTE: Data Category Card
// ============================================================================

const DataCategoryCard = ({ category }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const Icon = category.icon;

  return (
    <div className="bg-surface border border-border overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`w-full p-4 flex items-center gap-3 hover:bg-surface-highlight transition-colors bg-${category.color}/5`}
      >
        <div className={`w-10 h-10 flex items-center justify-center bg-${category.color}/10 border border-${category.color}/30`}>
          <Icon size={20} className={`text-${category.color}`} />
        </div>
        <div className="flex-1 text-left">
          <h4 className="font-heading text-text-primary">{category.category}</h4>
          <p className="text-xs text-text-secondary">{category.items.length} tipos de dados</p>
        </div>
        {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
      </button>
      
      {isExpanded && (
        <FadeIn>
          <div className="p-4 border-t border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-text-secondary">
                  <th className="pb-2">Dado</th>
                  <th className="pb-2">Finalidade</th>
                  <th className="pb-2">Retenção</th>
                </tr>
              </thead>
              <tbody>
                {category.items.map((item, i) => (
                  <tr key={i} className="border-t border-border">
                    <td className="py-2 text-text-primary">{item.data}</td>
                    <td className="py-2 text-text-secondary">{item.purpose}</td>
                    <td className="py-2 text-text-secondary">{item.retention}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </FadeIn>
      )}
    </div>
  );
};

// ============================================================================
// COMPONENTE: User Rights Card
// ============================================================================

const UserRightsCard = () => (
  <Card title="Os Teus Direitos" icon={UserCheck}>
    <div className="space-y-3">
      {USER_RIGHTS.map((right, i) => {
        const Icon = right.icon;
        return (
          <div key={i} className="p-3 bg-surface-highlight border border-border">
            <div className="flex items-center gap-2 mb-1">
              <Icon size={16} className="text-primary" />
              <h4 className="font-heading text-sm text-text-primary">{right.right}</h4>
            </div>
            <p className="text-xs text-text-secondary">{right.description}</p>
          </div>
        );
      })}
    </div>
  </Card>
);

// ============================================================================
// COMPONENTE: Security Measures Card
// ============================================================================

const SecurityMeasuresCard = () => (
  <Card title="Medidas de Segurança" icon={Shield} collapsible>
    <div className="grid grid-cols-2 gap-2">
      {SECURITY_MEASURES.map((measure, i) => {
        const Icon = measure.icon;
        return (
          <div key={i} className="p-2 bg-surface-highlight border border-border">
            <Icon size={14} className="text-success mb-1" />
            <p className="text-xs text-text-primary font-heading">{measure.measure}</p>
          </div>
        );
      })}
    </div>
  </Card>
);

// ============================================================================
// COMPONENTE: Section Component
// ============================================================================

const PrivacySection = ({ section, isExpanded, onToggle }) => {
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
        <h2 className="font-heading text-lg text-text-primary flex-1 text-left">
          {section.title}
        </h2>
        {isExpanded ? (
          <ChevronUp size={20} className="text-primary" />
        ) : (
          <ChevronDown size={20} className="text-text-secondary" />
        )}
      </button>
      
      {isExpanded && (
        <FadeIn>
          <div className="p-4">
            <div className="text-text-secondary leading-relaxed whitespace-pre-line">
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
// MAIN COMPONENT
// ============================================================================

export default function PrivacyPage() {
  const [expandedSections, setExpandedSections] = useState(() => {
    return SECTIONS.reduce((acc, s) => ({ ...acc, [s.id]: true }), {});
  });
  const [activeSection, setActiveSection] = useState('collection');

  // Track scroll
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

  return (
    <div className="space-y-6 pb-20 md:pb-6" data-testid="privacy-page">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-heading text-2xl text-primary flex items-center gap-2">
            <Shield size={28} /> Política de Privacidade
          </h1>
          <p className="text-text-secondary text-sm flex items-center gap-2">
            <Calendar size={14} />
            Última atualização: {LAST_UPDATE}
            <Badge variant="primary" size="xs">v{PRIVACY_VERSION}</Badge>
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Tooltip content="Imprimir">
            <button
              onClick={() => window.print()}
              className="p-2 border border-border hover:border-primary/50 transition-colors"
            >
              <Printer size={18} className="text-text-secondary" />
            </button>
          </Tooltip>
          <Tooltip content="Expandir todos">
            <button onClick={expandAll} className="p-2 border border-border hover:border-primary/50">
              <Plus size={18} className="text-text-secondary" />
            </button>
          </Tooltip>
          <Tooltip content="Colapsar todos">
            <button onClick={collapseAll} className="p-2 border border-border hover:border-primary/50">
              <Minus size={18} className="text-text-secondary" />
            </button>
          </Tooltip>
        </div>
      </div>

      {/* Introduction */}
      <Card>
        <p className="text-text-primary leading-relaxed">
          No SUBMUNDO, levamos a tua privacidade a sério. Esta política explica como recolhemos, 
          usamos e protegemos os teus dados pessoais. Ao utilizares o jogo, concordas com as 
          práticas descritas neste documento.
        </p>
        <p className="text-text-secondary text-sm mt-4 flex items-center gap-2">
          <Shield size={14} className="text-success" />
          Em conformidade com o RGPD e outras leis de privacidade aplicáveis.
        </p>
      </Card>

      {/* Main Content */}
      <div className="grid lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="hidden lg:block space-y-6">
          <TableOfContents 
            activeSection={activeSection}
            onSelect={scrollToSection}
          />
          <SecurityMeasuresCard />
        </div>
        
        {/* Content */}
        <div className="lg:col-span-3 space-y-4">
          {/* Data Categories Overview */}
          <Card title="Resumo de Dados Recolhidos" icon={Database}>
            <div className="space-y-3">
              {DATA_CATEGORIES.map((cat, i) => (
                <DataCategoryCard key={i} category={cat} />
              ))}
            </div>
          </Card>

          {/* Sections */}
          {SECTIONS.map((section) => (
            <FadeIn key={section.id}>
              <PrivacySection
                section={section}
                isExpanded={expandedSections[section.id]}
                onToggle={() => toggleSection(section.id)}
              />
            </FadeIn>
          ))}

          {/* Footer */}
          <Card className="text-center">
            <FileText size={32} className="mx-auto text-text-secondary mb-3" />
            <p className="text-text-secondary text-sm">
              Reservamo-nos o direito de atualizar esta política. Alterações significativas serão 
              comunicadas através do jogo. A continuação do uso após alterações implica aceitação.
            </p>
            <div className="flex justify-center gap-3 mt-4">
              <Link to="/termos">
                <Button variant="secondary" icon={ScrollText}>
                  Ver Termos
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

      {/* Mobile Cards */}
      <div className="lg:hidden space-y-6">
        <UserRightsCard />
        <SecurityMeasuresCard />
      </div>
    </div>
  );
}

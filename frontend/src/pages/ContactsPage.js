import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useGame } from '../contexts/GameContext';
import { Card, ProgressBar } from '../components/ProgressBar';
import { Button, Badge, Modal, Input, Alert } from '../components/UI';
import { 
  Users, Heart, Handshake, AlertTriangle, Gift, 
  MessageSquare, Info, ChevronRight, Star, Shield,
  Skull, DollarSign, Eye, Phone, MapPin, Clock,
  Search, Filter, Grid, List, SortAsc, SortDesc,
  ChevronDown, ChevronUp, ChevronLeft, MoreHorizontal,
  Settings, RefreshCw, Download, Share2, Copy, ExternalLink,
  HelpCircle, CheckCircle, XCircle, Loader2, Edit, Save,
  X, Check, ArrowLeft, ArrowRight, Maximize, Minimize,
  Move, Grip, Menu, Layers, Box, Package, Target, Award,
  Crown, Trophy, Medal, Zap, Sparkles, Activity, BarChart2,
  PieChart, TrendingUp, TrendingDown, Percent, Calculator,
  Calendar, Bell, User, UserPlus, UserMinus, UserCheck, UserX,
  Coins, Wallet, CreditCard, Banknote, PiggyBank,
  Receipt, FileText, Folder, File, FilePlus, Camera, Image,
  Globe, Navigation, Compass, Map as MapIcon, Flag, Pin, Bookmark,
  ShieldCheck, ShieldAlert, ShieldOff, Fingerprint, Database,
  Cloud, Wifi, Signal, Power, Battery, Lock, Unlock, Key,
  Sun, Moon, CloudRain, Thermometer, Wind, Flame, Droplet,
  Volume2, VolumeX, Mic, Video, Mail, Send, Inbox,
  LayoutGrid, Hash, AtSign, Link, Slash, Play, Pause, Square,
  Circle, Triangle, Hexagon, Diamond, ThumbsUp, ThumbsDown,
  Smile, Frown, Meh, Coffee, Briefcase, Building, Home,
  Car, Plane, Ship, Train, Bus, Bike, Footprints, 
  Headphones, Music, Radio, Tv, Monitor, Smartphone, Watch,
  Glasses, Umbrella, Shirt, ShoppingBag, ShoppingCart, Store,
  Truck, Package as PackageIcon, Box as BoxIcon, Archive
} from 'lucide-react';
import { IMPORTANT_NPCS, QUOTES, getRandomWisdomQuote } from '../data/lore';
import clsx from 'clsx';

const API_BASE = process.env.REACT_APP_BACKEND_URL;

// ==================== CONSTANTES E CONFIGURAÇÕES ====================

const CONTACT_CONFIG = {
  maxFavorites: 10,
  relationshipDecayPerDay: 0.5,
  giftCooldownHours: 24,
  maxInteractionsPerDay: 10,
  refreshInterval: 30000,
};

const RELATIONSHIP_LEVELS = {
  ENEMY: { id: 'enemy', label: 'Inimigo', minPoints: -100, maxPoints: -70, color: 'error', icon: Skull },
  HOSTILE: { id: 'hostile', label: 'Hostil', minPoints: -69, maxPoints: -40, color: 'error', icon: AlertTriangle },
  UNFRIENDLY: { id: 'unfriendly', label: 'Desconfiado', minPoints: -39, maxPoints: -10, color: 'warning', icon: Frown },
  NEUTRAL: { id: 'neutral', label: 'Neutro', minPoints: -9, maxPoints: 10, color: 'secondary', icon: Meh },
  FRIENDLY: { id: 'friendly', label: 'Amigável', minPoints: 11, maxPoints: 40, color: 'success', icon: Smile },
  ALLIED: { id: 'allied', label: 'Aliado', minPoints: 41, maxPoints: 70, color: 'primary', icon: Handshake },
  TRUSTED: { id: 'trusted', label: 'Confiança Total', minPoints: 71, maxPoints: 100, color: 'gold', icon: Heart },
};

const NPC_ROLES = {
  agiota: { label: 'Agiota', icon: DollarSign, color: 'gold', description: 'Empresta dinheiro com juros' },
  informante: { label: 'Informante', icon: Eye, color: 'primary', description: 'Fornece informações valiosas' },
  recetador: { label: 'Recetador', icon: Gift, color: 'success', description: 'Compra e vende itens roubados' },
  'médico clandestino': { label: 'Médico', icon: Shield, color: 'error', description: 'Cura ferimentos sem perguntas' },
  traficante: { label: 'Traficante', icon: Package, color: 'warning', description: 'Vende substâncias ilegais' },
  'polícia corrupto': { label: 'Polícia Corrupto', icon: ShieldAlert, color: 'error', description: 'Pode fazer desaparecer heat' },
  hacker: { label: 'Hacker', icon: Monitor, color: 'primary', description: 'Especialista em tecnologia' },
  mecânico: { label: 'Mecânico', icon: Car, color: 'warning', description: 'Repara e modifica veículos' },
  advogado: { label: 'Advogado', icon: Briefcase, color: 'secondary', description: 'Ajuda com problemas legais' },
  'dono de bar': { label: 'Dono de Bar', icon: Coffee, color: 'warning', description: 'Conhece toda a gente' },
  contrabandista: { label: 'Contrabandista', icon: Ship, color: 'primary', description: 'Importa itens raros' },
  falsificador: { label: 'Falsificador', icon: FileText, color: 'secondary', description: 'Cria documentos falsos' },
};

const INTERACTION_TYPES = {
  gift: { 
    id: 'gift', 
    label: 'Dar Presente', 
    icon: Gift, 
    color: 'gold',
    description: 'Oferece um presente para melhorar a relação',
    pointsGain: { min: 5, max: 15 },
  },
  trade: { 
    id: 'trade', 
    label: 'Negociar', 
    icon: DollarSign, 
    color: 'success',
    description: 'Inicia uma transação comercial',
    pointsGain: { min: 1, max: 5 },
  },
  request_favor: { 
    id: 'request_favor', 
    label: 'Pedir Favor', 
    icon: Handshake, 
    color: 'primary',
    description: 'Solicita ajuda especial',
    pointsGain: { min: -5, max: 10 },
  },
  share_info: { 
    id: 'share_info', 
    label: 'Partilhar Informação', 
    icon: MessageSquare, 
    color: 'secondary',
    description: 'Troca informações valiosas',
    pointsGain: { min: 2, max: 8 },
  },
  threaten: { 
    id: 'threaten', 
    label: 'Ameaçar', 
    icon: Skull, 
    color: 'error',
    description: 'Usa intimidação para conseguir o que quer',
    pointsGain: { min: -20, max: -5 },
  },
  bribe: { 
    id: 'bribe', 
    label: 'Subornar', 
    icon: Banknote, 
    color: 'warning',
    description: 'Oferece dinheiro em troca de favores',
    pointsGain: { min: 3, max: 12 },
  },
};

const GIFT_OPTIONS = [
  { id: 'flowers', name: 'Flores', cost: 50, points: 3, icon: '🌹' },
  { id: 'wine', name: 'Vinho Fino', cost: 150, points: 5, icon: '🍷' },
  { id: 'watch', name: 'Relógio', cost: 500, points: 10, icon: '⌚' },
  { id: 'jewelry', name: 'Jóias', cost: 1000, points: 15, icon: '💎' },
  { id: 'car', name: 'Carro Clássico', cost: 5000, points: 25, icon: '🚗' },
  { id: 'yacht', name: 'Dia no Iate', cost: 10000, points: 40, icon: '🛥️' },
];

const CONTACT_TIPS = [
  'Manter boas relações com NPCs desbloqueia preços melhores e serviços exclusivos.',
  'Cuidado com as ameaças - podem destruir relações permanentemente.',
  'Oferece presentes regularmente para manter a relação positiva.',
  'Informantes de confiança revelam missões secretas.',
  'Polícias corruptos podem ser úteis, mas são caros.',
  'Cada NPC tem preferências diferentes - aprende o que cada um gosta.',
];

// ==================== HOOKS PERSONALIZADOS ====================

function useLocalStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      return initialValue;
    }
  });

  const setValue = (value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(error);
    }
  };

  return [storedValue, setValue];
}

function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}

// ==================== COMPONENTES AUXILIARES ====================

const Tooltip = ({ children, content, position = 'top' }) => {
  const [isVisible, setIsVisible] = useState(false);
  
  const positions = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };
  
  return (
    <div className="relative inline-block" onMouseEnter={() => setIsVisible(true)} onMouseLeave={() => setIsVisible(false)}>
      {children}
      {isVisible && (
        <div className={clsx(
          'absolute z-50 px-2 py-1 text-xs bg-surface border border-border rounded shadow-lg whitespace-nowrap',
          positions[position]
        )}>
          {content}
        </div>
      )}
    </div>
  );
};

const Skeleton = ({ className = '', variant = 'rectangular' }) => {
  const variants = {
    rectangular: 'rounded',
    circular: 'rounded-full',
    text: 'rounded h-4',
  };
  
  return (
    <div className={clsx('animate-pulse bg-surface-highlight', variants[variant], className)} />
  );
};

const EmptyState = ({ icon: Icon, title, description, action, actionLabel }) => (
  <div className="text-center py-8">
    <div className="w-16 h-16 mx-auto mb-4 bg-surface-highlight border border-border rounded-full flex items-center justify-center">
      <Icon size={32} className="text-text-secondary" />
    </div>
    <h3 className="font-heading text-lg text-text-primary mb-2">{title}</h3>
    <p className="text-text-secondary text-sm mb-4 max-w-md mx-auto">{description}</p>
    {action && <Button variant="primary" onClick={action}>{actionLabel}</Button>}
  </div>
);

const CircularProgress = ({ value, max, size = 60, strokeWidth = 4, color = 'primary' }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const progress = Math.min(Math.max((value + 100) / 200, 0), 1);
  const offset = circumference - progress * circumference;
  
  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="currentColor" strokeWidth={strokeWidth} className="text-border" />
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" className={`text-${color} transition-all duration-500`} />
    </svg>
  );
};

const RelationshipBar = ({ points, level, showLabel = true }) => {
  const levelConfig = Object.values(RELATIONSHIP_LEVELS).find(l => l.id === level) || RELATIONSHIP_LEVELS.NEUTRAL;
  const progressPercent = Math.max(0, Math.min(100, (points + 100) / 2));
  
  return (
    <div className="space-y-1">
      {showLabel && (
        <div className="flex justify-between text-xs">
          <span className={`text-${levelConfig.color}`}>{levelConfig.label}</span>
          <span className="text-text-secondary">{points > 0 ? '+' : ''}{points} pts</span>
        </div>
      )}
      <div className="h-2 bg-background rounded-full overflow-hidden">
        <div 
          className={`h-full bg-${levelConfig.color} transition-all duration-500`}
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    </div>
  );
};

const TipsCarousel = ({ tips }) => {
  const [currentTip, setCurrentTip] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setCurrentTip(prev => (prev + 1) % tips.length), 8000);
    return () => clearInterval(interval);
  }, [tips.length]);

  return (
    <div className="flex items-start gap-3 p-3 bg-primary/10 border border-primary/30 rounded">
      <Info size={18} className="text-primary flex-shrink-0 mt-0.5" />
      <div className="flex-1">
        <p className="text-xs text-primary uppercase mb-1">Dica</p>
        <p className="text-sm text-text-secondary">{tips[currentTip]}</p>
      </div>
      <div className="flex gap-1">
        {tips.slice(0, 5).map((_, i) => (
          <button key={i} onClick={() => setCurrentTip(i)} className={clsx('w-1.5 h-1.5 rounded-full transition-all', currentTip === i ? 'bg-primary' : 'bg-primary/30')} />
        ))}
      </div>
    </div>
  );
};

const StatCard = ({ icon: Icon, label, value, color = 'primary', subtext }) => (
  <div className="bg-surface border border-border rounded-lg p-3 md:p-4">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-text-secondary text-xs uppercase mb-1">{label}</p>
        <p className={`text-xl md:text-2xl font-mono text-${color}`}>{value}</p>
        {subtext && <p className="text-xs text-text-secondary mt-1">{subtext}</p>}
      </div>
      <Icon size={28} className={`text-${color} opacity-50`} />
    </div>
  </div>
);

// ==================== COMPONENTES DE CONTACTO ====================

const getRelationshipIcon = (level) => {
  const config = Object.values(RELATIONSHIP_LEVELS).find(l => l.id === level);
  return config?.icon || Users;
};

const getRelationshipColor = (level) => {
  const config = Object.values(RELATIONSHIP_LEVELS).find(l => l.id === level);
  return config?.color || 'secondary';
};

const getRoleConfig = (role) => {
  return NPC_ROLES[role?.toLowerCase()] || { label: role, icon: Users, color: 'secondary', description: '' };
};

const ContactCard = ({ contact, onClick, isFavorite, onToggleFavorite }) => {
  const [isHovered, setIsHovered] = useState(false);
  const RelIcon = getRelationshipIcon(contact.relationship?.level);
  const relColor = getRelationshipColor(contact.relationship?.level);
  const roleConfig = getRoleConfig(contact.role);
  const RoleIcon = roleConfig.icon;

  return (
    <div
      className={clsx(
        'bg-surface border rounded-lg overflow-hidden cursor-pointer transition-all group',
        isHovered ? 'border-primary shadow-lg transform scale-[1.02]' : 'border-border hover:border-primary/50'
      )}
      onClick={() => onClick(contact)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Header */}
      <div className={`p-4 border-b border-border bg-${relColor}/5`}>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 bg-${relColor}/20 border border-${relColor} rounded-full flex items-center justify-center`}>
              <RelIcon size={20} className={`text-${relColor}`} />
            </div>
            <div>
              <h3 className="font-heading text-text-primary group-hover:text-primary transition-colors">
                {contact.name}
              </h3>
              <div className="flex items-center gap-1 text-text-secondary text-sm">
                <RoleIcon size={12} className={`text-${roleConfig.color}`} />
                <span>{roleConfig.label}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => { e.stopPropagation(); onToggleFavorite?.(contact.id); }}
              className="p-1.5 hover:bg-surface-highlight rounded transition-all"
            >
              <Star size={14} className={clsx(isFavorite ? 'text-gold fill-gold' : 'text-text-secondary')} />
            </button>
            <ChevronRight size={18} className="text-text-secondary group-hover:text-primary transition-colors" />
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="p-4 space-y-3">
        <p className="text-sm text-text-secondary line-clamp-2">{contact.description}</p>

        {/* Relationship Bar */}
        <RelationshipBar 
          points={contact.relationship?.points || 0}
          level={contact.relationship?.level}
        />

        {/* Location */}
        <div className="flex items-center gap-2 text-xs text-text-secondary">
          <MapPin size={12} />
          <span className="capitalize">{contact.location}</span>
        </div>

        {/* Effects Preview */}
        {contact.relationship?.effects && (
          <div className="flex gap-2 flex-wrap">
            {contact.relationship.effects.can_trade && (
              <Badge variant="success" size="sm">Pode negociar</Badge>
            )}
            {contact.relationship.effects.price_modifier < 1 && (
              <Badge variant="gold" size="sm">
                -{Math.round((1 - contact.relationship.effects.price_modifier) * 100)}% preços
              </Badge>
            )}
            {contact.relationship.effects.will_betray && (
              <Badge variant="error" size="sm">Perigoso</Badge>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const ContactListItem = ({ contact, onClick, isFavorite, onToggleFavorite }) => {
  const RelIcon = getRelationshipIcon(contact.relationship?.level);
  const relColor = getRelationshipColor(contact.relationship?.level);
  const roleConfig = getRoleConfig(contact.role);
  const RoleIcon = roleConfig.icon;

  return (
    <div
      className="bg-surface border border-border rounded-lg p-4 cursor-pointer hover:border-primary/50 transition-all flex items-center gap-4"
      onClick={() => onClick(contact)}
    >
      <div className={`w-12 h-12 bg-${relColor}/20 border border-${relColor} rounded-full flex items-center justify-center flex-shrink-0`}>
        <RelIcon size={20} className={`text-${relColor}`} />
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="font-heading text-text-primary">{contact.name}</h3>
          <Badge variant={roleConfig.color} size="xs">{roleConfig.label}</Badge>
        </div>
        <p className="text-sm text-text-secondary truncate">{contact.description}</p>
        <div className="flex items-center gap-4 mt-1 text-xs text-text-secondary">
          <span className="flex items-center gap-1">
            <MapPin size={10} /> {contact.location}
          </span>
          <span className={`text-${relColor}`}>
            {contact.relationship?.points > 0 ? '+' : ''}{contact.relationship?.points || 0} pts
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={(e) => { e.stopPropagation(); onToggleFavorite?.(contact.id); }}
          className="p-2 hover:bg-surface-highlight rounded transition-all"
        >
          <Star size={16} className={clsx(isFavorite ? 'text-gold fill-gold' : 'text-text-secondary')} />
        </button>
        <ChevronRight size={20} className="text-text-secondary" />
      </div>
    </div>
  );
};

const RivalCard = ({ rival }) => (
  <div className="bg-error/10 border border-error/30 p-4 rounded-lg">
    <div className="flex items-center gap-3 mb-2">
      <div className="w-10 h-10 bg-error/20 rounded-full flex items-center justify-center">
        <Skull className="text-error" size={20} />
      </div>
      <div>
        <h4 className="font-heading text-text-primary">{rival.name}</h4>
        <p className="text-xs text-error">{rival.gang}</p>
      </div>
    </div>
    <p className="text-sm text-text-secondary mb-2">{rival.description}</p>
    <div className="flex items-center justify-between">
      <Badge variant="error">Ameaça: {rival.threat}</Badge>
      <span className="text-xs text-text-secondary">{rival.territory}</span>
    </div>
  </div>
);

// ==================== COMPONENTES DE FILTRAGEM ====================

const FilterBar = ({ filter, onFilterChange, search, onSearchChange, roleFilter, onRoleFilterChange }) => {
  const filters = [
    { id: 'all', label: 'Todos' },
    { id: 'friendly', label: 'Amigáveis' },
    { id: 'neutral', label: 'Neutros' },
    { id: 'hostile', label: 'Hostis' },
    { id: 'favorites', label: 'Favoritos' },
  ];

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
          <input
            type="text"
            placeholder="Pesquisar contactos..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-surface border border-border rounded text-sm text-text-primary focus:border-primary transition-all"
          />
        </div>
        <div className="flex gap-1 overflow-x-auto">
          {filters.map(f => (
            <button
              key={f.id}
              onClick={() => onFilterChange(f.id)}
              className={clsx(
                'px-3 py-2 text-xs rounded whitespace-nowrap transition-all',
                filter === f.id
                  ? 'bg-primary text-background'
                  : 'bg-surface-highlight text-text-secondary hover:text-text-primary'
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Role Filter */}
      <div className="flex gap-1 overflow-x-auto pb-1">
        <button
          onClick={() => onRoleFilterChange('all')}
          className={clsx(
            'px-2 py-1 text-xs rounded whitespace-nowrap transition-all flex items-center gap-1',
            roleFilter === 'all'
              ? 'bg-secondary text-background'
              : 'bg-surface border border-border text-text-secondary hover:text-text-primary'
          )}
        >
          <Users size={10} /> Todas Funções
        </button>
        {Object.entries(NPC_ROLES).slice(0, 6).map(([key, config]) => {
          const Icon = config.icon;
          return (
            <button
              key={key}
              onClick={() => onRoleFilterChange(key)}
              className={clsx(
                'px-2 py-1 text-xs rounded whitespace-nowrap transition-all flex items-center gap-1',
                roleFilter === key
                  ? `bg-${config.color} text-background`
                  : 'bg-surface border border-border text-text-secondary hover:text-text-primary'
              )}
            >
              <Icon size={10} /> {config.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};

const ViewToggle = ({ view, onViewChange }) => (
  <div className="flex gap-1 bg-surface-highlight rounded p-1">
    <button
      onClick={() => onViewChange('grid')}
      className={clsx('p-2 rounded transition-all', view === 'grid' ? 'bg-primary text-background' : 'text-text-secondary hover:text-text-primary')}
    >
      <Grid size={14} />
    </button>
    <button
      onClick={() => onViewChange('list')}
      className={clsx('p-2 rounded transition-all', view === 'list' ? 'bg-primary text-background' : 'text-text-secondary hover:text-text-primary')}
    >
      <List size={14} />
    </button>
  </div>
);

const SortDropdown = ({ sort, onSortChange }) => {
  const [isOpen, setIsOpen] = useState(false);

  const sortLabels = {
    name: 'Nome',
    relationship: 'Relação',
    role: 'Função',
    location: 'Localização',
    recent: 'Recente',
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-surface border border-border rounded text-sm text-text-secondary hover:text-text-primary hover:border-primary transition-all"
      >
        <SortAsc size={14} />
        <span>{sortLabels[sort]}</span>
        <ChevronDown size={14} />
      </button>
      
      {isOpen && (
        <div className="absolute top-full right-0 mt-1 bg-surface border border-border rounded shadow-lg z-10 min-w-[150px]">
          {Object.entries(sortLabels).map(([key, label]) => (
            <button
              key={key}
              onClick={() => { onSortChange(key); setIsOpen(false); }}
              className={clsx(
                'w-full px-3 py-2 text-sm text-left transition-all',
                sort === key
                  ? 'bg-primary/20 text-primary'
                  : 'text-text-secondary hover:bg-surface-highlight hover:text-text-primary'
              )}
            >
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// ==================== MODAIS ====================

const ContactDetailModal = ({ isOpen, onClose, contact, onInteraction, loading }) => {
  const [activeTab, setActiveTab] = useState('info');
  const [selectedGift, setSelectedGift] = useState(null);
  
  if (!isOpen || !contact) return null;

  const RelIcon = getRelationshipIcon(contact.relationship?.level);
  const relColor = getRelationshipColor(contact.relationship?.level);
  const roleConfig = getRoleConfig(contact.role);
  const loreInfo = IMPORTANT_NPCS.contacts?.find(
    c => c.name?.toLowerCase().includes(contact.name?.split(' ')[0]?.toLowerCase())
  );

  const tabs = [
    { id: 'info', label: 'Informações', icon: Info },
    { id: 'interact', label: 'Interagir', icon: MessageSquare },
    { id: 'services', label: 'Serviços', icon: Briefcase },
    { id: 'history', label: 'Histórico', icon: Clock },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={contact.name} size="lg">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start gap-4 p-4 bg-surface-highlight rounded border border-border">
          <div className={`w-16 h-16 bg-${relColor}/20 border border-${relColor} rounded-full flex items-center justify-center flex-shrink-0`}>
            <RelIcon size={28} className={`text-${relColor}`} />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-text-secondary">{roleConfig.label}</span>
              <span className="text-text-secondary">•</span>
              <span className="text-text-secondary capitalize">{contact.location}</span>
            </div>
            <p className="text-text-secondary text-sm">{contact.description}</p>
            <div className="mt-2">
              <RelationshipBar 
                points={contact.relationship?.points || 0}
                level={contact.relationship?.level}
              />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-border overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={clsx(
                'flex items-center gap-1.5 px-4 py-2 text-sm transition-all whitespace-nowrap',
                activeTab === tab.id
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-text-secondary hover:text-text-primary'
              )}
            >
              <tab.icon size={14} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'info' && (
          <div className="space-y-4">
            {/* Relationship Details */}
            <div className="bg-surface-highlight p-4 rounded-lg">
              <h4 className="font-ui text-sm uppercase text-text-secondary mb-3">Detalhes da Relação</h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-text-secondary">Modificador de Preços:</span>
                  <span className={contact.relationship?.effects?.price_modifier < 1 ? 'text-success' : contact.relationship?.effects?.price_modifier > 1 ? 'text-error' : 'text-text-primary'}>
                    {Math.round((contact.relationship?.effects?.price_modifier || 1) * 100)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Qualidade Info:</span>
                  <span className="text-text-primary capitalize">{contact.relationship?.effects?.info_quality || 'básica'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Chance de Ajuda:</span>
                  <span className="text-text-primary">{contact.relationship?.effects?.help_chance || 0}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Interações:</span>
                  <span className="text-text-primary">{contact.relationship?.interactions_count || 0}</span>
                </div>
              </div>
            </div>

            {/* Lore Info */}
            {loreInfo && (
              <div className="bg-primary/10 border border-primary/30 p-4 rounded-lg">
                <h4 className="font-ui text-sm uppercase text-primary mb-2">Intel Secreta</h4>
                <p className="text-sm text-text-secondary">{loreInfo.description}</p>
                {loreInfo.services && (
                  <div className="mt-2">
                    <span className="text-xs text-text-secondary">Serviços conhecidos: </span>
                    <span className="text-xs text-text-primary">{loreInfo.services.join(', ')}</span>
                  </div>
                )}
              </div>
            )}

            {/* Role Description */}
            <div className="p-3 bg-surface rounded border border-border">
              <div className="flex items-center gap-2 mb-2">
                <roleConfig.icon size={16} className={`text-${roleConfig.color}`} />
                <span className="font-heading text-text-primary">{roleConfig.label}</span>
              </div>
              <p className="text-sm text-text-secondary">{roleConfig.description}</p>
            </div>
          </div>
        )}

        {activeTab === 'interact' && (
          <div className="space-y-4">
            {/* Available Interactions */}
            <div className="grid grid-cols-2 gap-3">
              {Object.values(INTERACTION_TYPES).map(interaction => {
                const Icon = interaction.icon;
                const isAvailable = !interaction.id.includes('threaten') || (contact.relationship?.points || 0) > -50;
                
                return (
                  <button
                    key={interaction.id}
                    onClick={() => isAvailable && onInteraction(contact.id, interaction.id)}
                    disabled={loading || !isAvailable}
                    className={clsx(
                      'p-4 rounded border text-left transition-all',
                      isAvailable
                        ? `border-${interaction.color}/30 hover:border-${interaction.color} bg-${interaction.color}/5`
                        : 'border-border opacity-50 cursor-not-allowed'
                    )}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Icon size={18} className={`text-${interaction.color}`} />
                      <span className="font-heading text-text-primary text-sm">{interaction.label}</span>
                    </div>
                    <p className="text-xs text-text-secondary">{interaction.description}</p>
                    <Badge variant={interaction.color} size="xs" className="mt-2">
                      {interaction.pointsGain.min > 0 ? '+' : ''}{interaction.pointsGain.min} a {interaction.pointsGain.max > 0 ? '+' : ''}{interaction.pointsGain.max} pts
                    </Badge>
                  </button>
                );
              })}
            </div>

            {/* Gift Section */}
            <div className="border-t border-border pt-4">
              <h4 className="font-heading text-text-primary mb-3 flex items-center gap-2">
                <Gift size={16} className="text-gold" /> Presentes
              </h4>
              <div className="grid grid-cols-3 gap-2">
                {GIFT_OPTIONS.map(gift => (
                  <button
                    key={gift.id}
                    onClick={() => setSelectedGift(gift)}
                    className={clsx(
                      'p-3 rounded border text-center transition-all',
                      selectedGift?.id === gift.id
                        ? 'border-gold bg-gold/10'
                        : 'border-border hover:border-gold/50'
                    )}
                  >
                    <span className="text-2xl">{gift.icon}</span>
                    <p className="text-xs text-text-primary mt-1">{gift.name}</p>
                    <p className="text-xs text-gold font-mono">€{gift.cost}</p>
                    <Badge variant="success" size="xs" className="mt-1">+{gift.points} pts</Badge>
                  </button>
                ))}
              </div>
              {selectedGift && (
                <Button
                  variant="gold"
                  fullWidth
                  className="mt-3"
                  onClick={() => { onInteraction(contact.id, 'gift', selectedGift); setSelectedGift(null); }}
                  loading={loading}
                  icon={Gift}
                >
                  Oferecer {selectedGift.name} (€{selectedGift.cost})
                </Button>
              )}
            </div>
          </div>
        )}

        {activeTab === 'services' && (
          <div className="space-y-3">
            {contact.services?.length > 0 ? (
              contact.services.map((service, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-surface-highlight border border-border rounded">
                  <div className="flex items-center gap-3">
                    <Briefcase size={16} className="text-primary" />
                    <span className="text-text-primary">{service}</span>
                  </div>
                  <Button variant="primary" size="sm">Usar</Button>
                </div>
              ))
            ) : (
              <EmptyState
                icon={Briefcase}
                title="Sem Serviços"
                description="Melhora a relação para desbloquear serviços."
              />
            )}
          </div>
        )}

        {activeTab === 'history' && (
          <EmptyState
            icon={Clock}
            title="Sem Histórico"
            description="O histórico de interações aparecerá aqui."
          />
        )}
      </div>
    </Modal>
  );
};

const InteractionResultModal = ({ isOpen, onClose, result }) => {
  if (!isOpen || !result) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Resultado da Interação" size="sm">
      <div className="text-center space-y-4">
        <div className={clsx(
          'w-20 h-20 mx-auto rounded-full flex items-center justify-center',
          result.success ? 'bg-success/20' : 'bg-error/20'
        )}>
          {result.success ? (
            <CheckCircle size={40} className="text-success" />
          ) : (
            <XCircle size={40} className="text-error" />
          )}
        </div>
        
        <div>
          <p className="font-heading text-lg text-text-primary mb-2">
            {result.success ? 'Sucesso!' : 'Falhou!'}
          </p>
          <p className="text-text-secondary">{result.message}</p>
        </div>

        {result.points_change && (
          <Badge variant={result.points_change > 0 ? 'success' : 'error'} size="lg">
            {result.points_change > 0 ? '+' : ''}{result.points_change} pontos de relação
          </Badge>
        )}

        <Button variant="primary" fullWidth onClick={onClose}>
          Continuar
        </Button>
      </div>
    </Modal>
  );
};

// ==================== COMPONENTE PRINCIPAL ====================

export default function ContactsPage() {
  const { token } = useAuth();
  const { refreshStats } = useGame();
  
  // Estados principais
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [notification, setNotification] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Estados de UI
  const [viewMode, setViewMode] = useLocalStorage('contacts_view', 'grid');
  const [sortBy, setSortBy] = useLocalStorage('contacts_sort', 'relationship');
  const [filter, setFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [favorites, setFavorites] = useLocalStorage('contact_favorites', []);
  const [wisdomQuote] = useState(getRandomWisdomQuote());
  const debouncedSearch = useDebounce(searchTerm, 300);
  
  // Estados de modais
  const [selectedContact, setSelectedContact] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);
  const [interactionResult, setInteractionResult] = useState(null);

  // Fetch data
  const fetchContacts = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/api/npcs/contacts`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setContacts(data.contacts || []);
      }
    } catch (error) {
      console.error('Error fetching contacts:', error);
      showNotif('Erro ao carregar contactos', 'error');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  // Handlers
  const showNotif = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchContacts();
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const handleInteraction = async (npcId, action, giftData = null) => {
    setActionLoading(true);
    try {
      const url = giftData 
        ? `${API_BASE}/api/npcs/${npcId}/gift`
        : `${API_BASE}/api/npcs/${npcId}/interact?action=${action}`;
      
      const options = {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      };

      if (giftData) {
        options.headers['Content-Type'] = 'application/json';
        options.body = JSON.stringify({ gift_id: giftData.id, cost: giftData.cost });
      }

      const response = await fetch(url, options);
      
      if (response.ok) {
        const result = await response.json();
        setInteractionResult({
          success: true,
          message: result.message || 'Interação bem sucedida!',
          points_change: result.points_change
        });
        setShowResultModal(true);
        await fetchContacts();
        if (refreshStats) refreshStats();
      } else {
        const error = await response.json();
        setInteractionResult({
          success: false,
          message: error.detail || 'A interação falhou.'
        });
        setShowResultModal(true);
      }
    } catch (error) {
      console.error('Error interacting with NPC:', error);
      showNotif('Erro de conexão', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleViewContact = (contact) => {
    setSelectedContact(contact);
    setShowDetailModal(true);
  };

  const handleToggleFavorite = (contactId) => {
    setFavorites(prev => 
      prev.includes(contactId)
        ? prev.filter(id => id !== contactId)
        : prev.length < CONTACT_CONFIG.maxFavorites
          ? [...prev, contactId]
          : prev
    );
  };

  // Computed values
  const filteredContacts = useMemo(() => {
    return contacts
      .filter(c => {
        // Search filter
        const matchesSearch = !debouncedSearch || 
          c.name?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
          c.role?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
          c.location?.toLowerCase().includes(debouncedSearch.toLowerCase());
        
        // Status filter
        let matchesFilter = true;
        if (filter === 'friendly') {
          matchesFilter = ['friendly', 'allied', 'trusted'].includes(c.relationship?.level);
        } else if (filter === 'neutral') {
          matchesFilter = c.relationship?.level === 'neutral';
        } else if (filter === 'hostile') {
          matchesFilter = ['enemy', 'hostile', 'unfriendly'].includes(c.relationship?.level);
        } else if (filter === 'favorites') {
          matchesFilter = favorites.includes(c.id);
        }

        // Role filter
        const matchesRole = roleFilter === 'all' || c.role?.toLowerCase() === roleFilter;
        
        return matchesSearch && matchesFilter && matchesRole;
      })
      .sort((a, b) => {
        switch (sortBy) {
          case 'relationship': return (b.relationship?.points || 0) - (a.relationship?.points || 0);
          case 'role': return (a.role || '').localeCompare(b.role || '');
          case 'location': return (a.location || '').localeCompare(b.location || '');
          default: return (a.name || '').localeCompare(b.name || '');
        }
      });
  }, [contacts, debouncedSearch, filter, roleFilter, sortBy, favorites]);

  const stats = useMemo(() => ({
    totalContacts: contacts.length,
    friendlyCount: contacts.filter(c => ['friendly', 'allied', 'trusted'].includes(c.relationship?.level)).length,
    neutralCount: contacts.filter(c => c.relationship?.level === 'neutral').length,
    hostileCount: contacts.filter(c => ['enemy', 'hostile', 'unfriendly'].includes(c.relationship?.level)).length,
    favoritesCount: favorites.length,
  }), [contacts, favorites]);

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-text-secondary italic">"{wisdomQuote}"</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-20 md:pb-6 animate-fade-in" data-testid="contacts-page">
      {/* Notification */}
      {notification && (
        <Alert variant={notification.type}>
          {notification.message}
        </Alert>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-xl md:text-2xl text-text-primary flex items-center gap-3">
            <Users className="text-primary" />
            Contactos
          </h1>
          <p className="text-text-secondary text-sm mt-1">Gere as tuas relações no submundo</p>
        </div>
        <div className="flex items-center gap-2">
          <Tooltip content="Atualizar">
            <button
              onClick={handleRefresh}
              className="p-2 bg-surface border border-border hover:border-primary rounded transition-all"
              disabled={isRefreshing}
            >
              <RefreshCw size={18} className={clsx('text-text-secondary', isRefreshing && 'animate-spin')} />
            </button>
          </Tooltip>
        </div>
      </div>

      {/* Wisdom Quote */}
      <div className="bg-surface/50 border border-surface-highlight p-3 rounded-lg">
        <p className="text-text-secondary italic text-sm">"{wisdomQuote}"</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <StatCard icon={Users} label="Total" value={stats.totalContacts} color="primary" />
        <StatCard icon={Smile} label="Amigáveis" value={stats.friendlyCount} color="success" />
        <StatCard icon={Meh} label="Neutros" value={stats.neutralCount} color="secondary" />
        <StatCard icon={Skull} label="Hostis" value={stats.hostileCount} color="error" />
        <StatCard icon={Star} label="Favoritos" value={stats.favoritesCount} color="gold" subtext={`/ ${CONTACT_CONFIG.maxFavorites}`} />
      </div>

      {/* Tips */}
      <TipsCarousel tips={CONTACT_TIPS} />

      {/* Relationship Legend */}
      <Card title="Níveis de Relacionamento" icon={Heart}>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2 text-xs">
          {Object.values(RELATIONSHIP_LEVELS).map(level => {
            const Icon = level.icon;
            return (
              <div key={level.id} className="flex items-center gap-2 p-2 bg-surface-highlight rounded">
                <Icon className={`text-${level.color}`} size={16} />
                <span className="text-text-primary">{level.label}</span>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-3 items-start md:items-center justify-between">
        <FilterBar
          filter={filter}
          onFilterChange={setFilter}
          search={searchTerm}
          onSearchChange={setSearchTerm}
          roleFilter={roleFilter}
          onRoleFilterChange={setRoleFilter}
        />
        <div className="flex gap-2">
          <SortDropdown sort={sortBy} onSortChange={setSortBy} />
          <ViewToggle view={viewMode} onViewChange={setViewMode} />
        </div>
      </div>

      {/* Contacts Grid/List */}
      {filteredContacts.length === 0 ? (
        <Card>
          <EmptyState
            icon={Users}
            title={contacts.length === 0 ? 'Sem Contactos' : 'Nenhum Resultado'}
            description={
              contacts.length === 0
                ? 'Os teus contactos do submundo aparecerão aqui.'
                : 'Nenhum contacto encontrado com esses filtros.'
            }
          />
        </Card>
      ) : (
        <>
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredContacts.map(contact => (
                <ContactCard
                  key={contact.id}
                  contact={contact}
                  onClick={handleViewContact}
                  isFavorite={favorites.includes(contact.id)}
                  onToggleFavorite={handleToggleFavorite}
                />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredContacts.map(contact => (
                <ContactListItem
                  key={contact.id}
                  contact={contact}
                  onClick={handleViewContact}
                  isFavorite={favorites.includes(contact.id)}
                  onToggleFavorite={handleToggleFavorite}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* Results Count */}
      {contacts.length > 0 && (
        <div className="text-center text-xs text-text-secondary">
          A mostrar {filteredContacts.length} de {contacts.length} contactos
        </div>
      )}

      {/* Known Rivals Section */}
      {IMPORTANT_NPCS.rivals && IMPORTANT_NPCS.rivals.length > 0 && (
        <Card title="Rivais Conhecidos" icon={Skull}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {IMPORTANT_NPCS.rivals.map((rival, idx) => (
              <RivalCard key={idx} rival={rival} />
            ))}
          </div>
        </Card>
      )}

      {/* Modals */}
      <ContactDetailModal
        isOpen={showDetailModal}
        onClose={() => { setShowDetailModal(false); setSelectedContact(null); }}
        contact={selectedContact}
        onInteraction={handleInteraction}
        loading={actionLoading}
      />

      <InteractionResultModal
        isOpen={showResultModal}
        onClose={() => { setShowResultModal(false); setInteractionResult(null); }}
        result={interactionResult}
      />
    </div>
  );
}

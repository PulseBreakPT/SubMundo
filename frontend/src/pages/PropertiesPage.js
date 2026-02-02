import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useGame } from '../contexts/GameContext';
import { Card, ProgressBar } from '../components/ProgressBar';
import { Button, Badge, Modal, Input, Alert } from '../components/UI';
import { 
  Building, Factory, Home, Warehouse, Castle, Shield, Plus, DollarSign, 
  Wrench, TrendingUp, Clock, MapPin, ChevronDown, ChevronUp, Trash2,
  Search, Filter, Grid, List, SortAsc, SortDesc, Eye, EyeOff,
  Star, Heart, Lock, Unlock, Key, Settings, RefreshCw, Download,
  Share2, Copy, ExternalLink, Info, HelpCircle, AlertTriangle,
  CheckCircle, XCircle, Loader2, MoreHorizontal, MoreVertical,
  Edit, Save, X, Check, ArrowLeft, ArrowRight, ChevronLeft, ChevronRight,
  Maximize, Minimize, Move, Grip, Menu, Layers, Box, Package,
  Target, Award, Crown, Trophy, Medal, Gift, Zap, Sparkles,
  Activity, BarChart2, PieChart, TrendingDown, Percent, Calculator,
  Calendar, Bell, MessageSquare, Users, User, UserPlus, UserMinus,
  Coins, Wallet, CreditCard, Banknote, PiggyBank, CircleDollarSign,
  Receipt, FileText, Folder, File, FilePlus, FileCheck, FileX,
  Camera, Image, ImagePlus, Palette, Brush, Pen, Pencil,
  Globe, Navigation, Compass, Map as MapIcon, Flag, Pin, Bookmark,
  ShieldCheck, ShieldAlert, ShieldOff, Fingerprint, Database, Server,
  Cloud, Wifi, Signal, Power, Battery, Cpu, HardDrive,
  Sun, Moon, CloudRain, Thermometer, Wind, Flame, Droplet,
  Volume2, VolumeX, Mic, Video, Phone, Mail, Send,
  LayoutGrid, ListOrdered, Hash, AtSign, Link, Slash,
  Play, Pause, Square, Circle, Triangle, Hexagon, Diamond,
  Heart as HeartIcon, ThumbsUp, ThumbsDown, Smile, Frown, Meh
} from 'lucide-react';
import clsx from 'clsx';

const API_URL = process.env.REACT_APP_BACKEND_URL;

// ==================== CONSTANTES E CONFIGURAÇÕES ====================

const PROPERTY_CONFIG = {
  maxPropertiesPerPlayer: 20,
  maintenanceWarningThreshold: 30,
  conditionDecayPerHour: 0.5,
  repairCostMultiplier: 10,
  sellValueMultiplier: 0.7,
  upgradeMultiplier: 1.5,
  viewModes: ['grid', 'list', 'compact'],
  sortOptions: ['name', 'value', 'condition', 'capacity', 'recent'],
  filterOptions: ['all', 'residential', 'commercial', 'industrial', 'luxury'],
};

const PROPERTY_CATEGORIES = {
  RESIDENTIAL: {
    id: 'residential',
    label: 'Residencial',
    description: 'Propriedades para habitação',
    color: 'success',
    icon: Home,
  },
  COMMERCIAL: {
    id: 'commercial',
    label: 'Comercial',
    description: 'Propriedades para negócios',
    color: 'primary',
    icon: Building,
  },
  INDUSTRIAL: {
    id: 'industrial',
    label: 'Industrial',
    description: 'Armazéns e fábricas',
    color: 'warning',
    icon: Factory,
  },
  LUXURY: {
    id: 'luxury',
    label: 'Luxo',
    description: 'Propriedades de alto valor',
    color: 'gold',
    icon: Castle,
  },
};

const PROPERTY_TYPES_EXTENDED = {
  apartamento: {
    name: 'Apartamento',
    category: 'residential',
    icon: Home,
    color: 'success',
    description: 'Habitação urbana compacta',
    features: ['Segurança 24h', 'Garagem', 'Portaria'],
    baseCapacity: 10,
    baseMaintenance: 100,
  },
  casa: {
    name: 'Casa',
    category: 'residential',
    icon: Home,
    color: 'success',
    description: 'Moradia familiar tradicional',
    features: ['Jardim', 'Garagem', 'Privacidade'],
    baseCapacity: 20,
    baseMaintenance: 200,
  },
  armazem: {
    name: 'Armazém',
    category: 'industrial',
    icon: Warehouse,
    color: 'warning',
    description: 'Espaço de armazenamento industrial',
    features: ['Grande capacidade', 'Acesso 24h', 'Carga/Descarga'],
    baseCapacity: 100,
    baseMaintenance: 300,
  },
  fabrica: {
    name: 'Fábrica',
    category: 'industrial',
    icon: Factory,
    color: 'warning',
    description: 'Instalação de produção',
    features: ['Maquinaria', 'Energia industrial', 'Escritórios'],
    baseCapacity: 150,
    baseMaintenance: 500,
  },
  mansao: {
    name: 'Mansão',
    category: 'luxury',
    icon: Castle,
    color: 'gold',
    description: 'Propriedade de luxo exclusiva',
    features: ['Piscina', 'Heliporto', 'Bunker secreto', 'Staff'],
    baseCapacity: 50,
    baseMaintenance: 1000,
  },
  bunker: {
    name: 'Bunker',
    category: 'luxury',
    icon: Shield,
    color: 'error',
    description: 'Refúgio subterrâneo fortificado',
    features: ['Blindagem', 'Autossuficiente', 'Invisível'],
    baseCapacity: 30,
    baseMaintenance: 800,
  },
  loja: {
    name: 'Loja',
    category: 'commercial',
    icon: Building,
    color: 'primary',
    description: 'Espaço comercial de retalho',
    features: ['Montra', 'Armazém', 'Localização central'],
    baseCapacity: 25,
    baseMaintenance: 250,
  },
  escritorio: {
    name: 'Escritório',
    category: 'commercial',
    icon: Building,
    color: 'primary',
    description: 'Espaço corporativo profissional',
    features: ['Salas de reunião', 'Recepção', 'Parking'],
    baseCapacity: 15,
    baseMaintenance: 350,
  },
};

const UPGRADE_OPTIONS = [
  { id: 'security', name: 'Sistema de Segurança', description: 'Alarmes e câmaras avançadas', cost: 5000, bonus: '+10% proteção' },
  { id: 'capacity', name: 'Expansão de Capacidade', description: 'Aumenta o espaço útil', cost: 10000, bonus: '+25% capacidade' },
  { id: 'luxury', name: 'Acabamentos de Luxo', description: 'Materiais premium', cost: 15000, bonus: '+50% valor de revenda' },
  { id: 'tech', name: 'Automação Inteligente', description: 'Sistema domótico avançado', cost: 8000, bonus: '-20% manutenção' },
  { id: 'energy', name: 'Energia Solar', description: 'Painéis solares e bateria', cost: 12000, bonus: '-30% custos operacionais' },
  { id: 'bunker', name: 'Sala Segura', description: 'Divisão blindada secreta', cost: 20000, bonus: 'Proteção total' },
];

const PROPERTY_TIPS = [
  'Propriedades com baixa condição têm custos de manutenção mais elevados.',
  'Investir em upgrades aumenta o valor de revenda.',
  'Propriedades em bairros de alto valor económico custam mais, mas também valem mais.',
  'Mantém a condição acima de 50% para evitar penalidades.',
  'Bunkers oferecem a melhor proteção contra raids.',
  'Propriedades de luxo dão bónus de reputação.',
];

// ==================== HOOKS PERSONALIZADOS ====================

function useLocalStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(error);
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
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

function useAnimatedNumber(value, duration = 800) {
  const [displayValue, setDisplayValue] = useState(value);
  const previousValue = useRef(value);

  useEffect(() => {
    const startValue = previousValue.current;
    const endValue = value;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      
      const currentValue = startValue + (endValue - startValue) * easeProgress;
      setDisplayValue(Math.round(currentValue));

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    animate();
    previousValue.current = value;
  }, [value, duration]);

  return displayValue;
}

// ==================== COMPONENTES AUXILIARES ====================

const AnimatedCounter = ({ value, prefix = '', suffix = '', className = '' }) => {
  const animatedValue = useAnimatedNumber(value);
  return (
    <span className={className}>
      {prefix}{animatedValue.toLocaleString('pt-PT')}{suffix}
    </span>
  );
};

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
    <div className={clsx(
      'animate-pulse bg-surface-highlight',
      variants[variant],
      className
    )} />
  );
};

const EmptyState = ({ icon: Icon, title, description, action, actionLabel }) => (
  <div className="text-center py-8">
    <div className="w-16 h-16 mx-auto mb-4 bg-surface-highlight border border-border rounded-full flex items-center justify-center">
      <Icon size={32} className="text-text-secondary" />
    </div>
    <h3 className="font-heading text-lg text-text-primary mb-2">{title}</h3>
    <p className="text-text-secondary text-sm mb-4 max-w-md mx-auto">{description}</p>
    {action && (
      <Button variant="primary" onClick={action}>
        {actionLabel}
      </Button>
    )}
  </div>
);

const CircularProgress = ({ value, max, size = 60, strokeWidth = 4, color = 'primary' }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const progress = Math.min(value / max, 1);
  const offset = circumference - progress * circumference;
  
  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        className="text-border"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        className={`text-${color} transition-all duration-500`}
      />
    </svg>
  );
};

const MiniChart = ({ data, color = 'primary', height = 40 }) => {
  if (!data || data.length === 0) return null;
  
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  
  return (
    <div className="flex items-end gap-0.5" style={{ height }}>
      {data.map((value, i) => {
        const barHeight = ((value - min) / range) * 100;
        return (
          <div
            key={i}
            className={clsx('w-1 rounded-t transition-all', `bg-${color}`)}
            style={{ height: `${Math.max(10, barHeight)}%`, opacity: 0.3 + (i / data.length) * 0.7 }}
          />
        );
      })}
    </div>
  );
};

const ConditionIndicator = ({ condition }) => {
  const getConditionColor = (cond) => {
    if (cond >= 80) return 'success';
    if (cond >= 50) return 'warning';
    if (cond >= 30) return 'error';
    return 'error';
  };

  const getConditionLabel = (cond) => {
    if (cond >= 80) return 'Excelente';
    if (cond >= 50) return 'Bom';
    if (cond >= 30) return 'Razoável';
    return 'Crítico';
  };

  const color = getConditionColor(condition);
  const label = getConditionLabel(condition);

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1">
        <div className="flex justify-between text-xs mb-1">
          <span className="text-text-secondary">Condição</span>
          <span className={`text-${color}`}>{condition}%</span>
        </div>
        <div className="h-2 bg-background rounded-full overflow-hidden">
          <div 
            className={`h-full bg-${color} transition-all duration-500`}
            style={{ width: `${condition}%` }}
          />
        </div>
      </div>
      <Badge variant={color} size="xs">{label}</Badge>
    </div>
  );
};

const PropertyIcon = ({ type, size = 24, className = '' }) => {
  const config = PROPERTY_TYPES_EXTENDED[type] || { icon: Building, color: 'secondary' };
  const Icon = config.icon;
  return <Icon size={size} className={clsx(`text-${config.color}`, className)} />;
};

const StatCard = ({ icon: Icon, label, value, color = 'primary', trend, trendValue, onClick }) => (
  <div 
    className={clsx(
      'bg-surface border border-border rounded-lg p-3 md:p-4 cursor-pointer hover:border-primary/50 transition-all group',
      onClick && 'cursor-pointer'
    )}
    onClick={onClick}
  >
    <div className="flex items-center justify-between">
      <div>
        <p className="text-text-secondary text-xs uppercase mb-1">{label}</p>
        <p className={`text-xl md:text-2xl font-mono text-${color}`}>{value}</p>
        {trend && (
          <div className={clsx('flex items-center gap-1 text-xs mt-1', trend === 'up' ? 'text-success' : 'text-error')}>
            {trend === 'up' ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            <span>{trendValue}</span>
          </div>
        )}
      </div>
      <Icon size={28} className={`text-${color} opacity-50 group-hover:opacity-100 transition-opacity`} />
    </div>
  </div>
);

const TipsCarousel = ({ tips }) => {
  const [currentTip, setCurrentTip] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTip(prev => (prev + 1) % tips.length);
    }, 8000);
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
          <button
            key={i}
            onClick={() => setCurrentTip(i)}
            className={clsx(
              'w-1.5 h-1.5 rounded-full transition-all',
              currentTip === i ? 'bg-primary' : 'bg-primary/30'
            )}
          />
        ))}
      </div>
    </div>
  );
};

// ==================== COMPONENTES DE PROPRIEDADE ====================

const PropertyCardGrid = ({ property, onMaintain, onSell, onUpgrade, onView, loading, isFavorite, onToggleFavorite }) => {
  const [isHovered, setIsHovered] = useState(false);
  const typeConfig = PROPERTY_TYPES_EXTENDED[property.property_type] || {};
  const Icon = typeConfig.icon || Building;
  const categoryConfig = PROPERTY_CATEGORIES[typeConfig.category?.toUpperCase()] || PROPERTY_CATEGORIES.COMMERCIAL;

  const needsMaintenance = property.condition < PROPERTY_CONFIG.maintenanceWarningThreshold;

  return (
    <div 
      className={clsx(
        'bg-surface border rounded-lg overflow-hidden transition-all group',
        needsMaintenance ? 'border-error/50' : 'border-border',
        isHovered && 'border-primary shadow-lg transform scale-[1.02]'
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Header with Image/Icon */}
      <div className={`relative h-32 bg-gradient-to-br from-${categoryConfig.color}/20 to-transparent`}>
        <div className="absolute inset-0 flex items-center justify-center">
          <Icon size={48} className={`text-${categoryConfig.color} opacity-30`} />
        </div>
        
        {/* Badges */}
        <div className="absolute top-2 left-2 flex gap-1">
          <Badge variant={categoryConfig.color} size="xs">
            {categoryConfig.label}
          </Badge>
          {needsMaintenance && (
            <Badge variant="error" size="xs" className="animate-pulse">
              <AlertTriangle size={10} className="mr-1" />
              Manutenção
            </Badge>
          )}
        </div>

        {/* Favorite Button */}
        <button
          onClick={(e) => { e.stopPropagation(); onToggleFavorite?.(property.id); }}
          className="absolute top-2 right-2 p-1.5 bg-background/80 rounded-full hover:bg-background transition-all"
        >
          <Heart size={14} className={clsx(isFavorite ? 'text-error fill-error' : 'text-text-secondary')} />
        </button>

        {/* Quick Actions Overlay */}
        {isHovered && (
          <div className="absolute bottom-2 left-2 right-2 flex gap-1">
            <button
              onClick={(e) => { e.stopPropagation(); onView?.(property); }}
              className="flex-1 py-1 bg-primary/90 text-background text-xs rounded flex items-center justify-center gap-1"
            >
              <Eye size={12} /> Ver
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onUpgrade?.(property); }}
              className="flex-1 py-1 bg-gold/90 text-background text-xs rounded flex items-center justify-center gap-1"
            >
              <TrendingUp size={12} /> Upgrade
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-3">
        <div className="flex items-start justify-between mb-2">
          <div>
            <h3 className="font-heading text-text-primary text-sm line-clamp-1">{property.custom_name}</h3>
            <p className="text-xs text-text-secondary flex items-center gap-1">
              <MapPin size={10} /> {property.neighborhood_name}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm font-mono text-primary">€{property.purchase_price?.toLocaleString()}</p>
            <p className="text-xs text-text-secondary">valor</p>
          </div>
        </div>

        {/* Condition */}
        <ConditionIndicator condition={property.condition} />

        {/* Stats */}
        <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
          <div className="p-2 bg-background rounded">
            <span className="text-text-secondary">Capacidade</span>
            <p className="font-mono text-text-primary">{property.capacity}</p>
          </div>
          <div className="p-2 bg-background rounded">
            <span className="text-text-secondary">Manutenção</span>
            <p className="font-mono text-warning">€{property.maintenance_cost}/mês</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 mt-3">
          <button
            onClick={(e) => { e.stopPropagation(); onMaintain(property.id); }}
            disabled={loading || property.condition >= 100}
            className={clsx(
              'flex-1 py-2 px-3 text-xs font-ui rounded flex items-center justify-center gap-1 disabled:opacity-50 transition-all',
              property.condition < 50 
                ? 'bg-warning text-background hover:bg-warning/80' 
                : 'bg-surface-highlight border border-border text-text-secondary hover:text-text-primary hover:border-primary'
            )}
          >
            <Wrench size={12} /> Reparar
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onSell(property.id); }}
            disabled={loading}
            className="py-2 px-3 bg-error/20 hover:bg-error/30 border border-error/50 rounded text-error text-xs font-ui flex items-center justify-center gap-1 disabled:opacity-50 transition-all"
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>
    </div>
  );
};

const PropertyCardList = ({ property, onMaintain, onSell, onUpgrade, onView, loading }) => {
  const [expanded, setExpanded] = useState(false);
  const typeConfig = PROPERTY_TYPES_EXTENDED[property.property_type] || {};
  const Icon = typeConfig.icon || Building;

  return (
    <div className="bg-surface border border-border rounded-lg overflow-hidden hover:border-primary/50 transition-all">
      <div 
        className="p-4 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-lg bg-${typeConfig.color}/10 flex items-center justify-center text-${typeConfig.color}`}>
              <Icon size={24} />
            </div>
            <div>
              <h3 className="font-heading text-text-primary">{property.custom_name}</h3>
              <p className="text-sm text-text-secondary flex items-center gap-1">
                <MapPin size={12} /> {property.neighborhood_name}
              </p>
            </div>
          </div>
          <div className="text-right flex items-center gap-4">
            <div>
              <p className="text-lg font-mono text-primary">€{property.purchase_price?.toLocaleString()}</p>
              <p className="text-xs text-text-secondary">Condição: {property.condition}%</p>
            </div>
            {expanded ? <ChevronUp size={20} className="text-text-secondary" /> : <ChevronDown size={20} className="text-text-secondary" />}
          </div>
        </div>
        
        {/* Inline Progress Bar */}
        <div className="mt-3">
          <ConditionIndicator condition={property.condition} />
        </div>
      </div>
      
      {expanded && (
        <div className="border-t border-border p-4 space-y-4">
          {/* Details */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-3 bg-background rounded">
              <span className="text-text-secondary text-xs">Capacidade</span>
              <p className="font-mono text-text-primary text-lg">{property.capacity}</p>
            </div>
            <div className="p-3 bg-background rounded">
              <span className="text-text-secondary text-xs">Manutenção</span>
              <p className="font-mono text-warning text-lg">€{property.maintenance_cost}/mês</p>
            </div>
            <div className="p-3 bg-background rounded">
              <span className="text-text-secondary text-xs">Valor de Venda</span>
              <p className="font-mono text-success text-lg">
                €{Math.round(property.purchase_price * PROPERTY_CONFIG.sellValueMultiplier).toLocaleString()}
              </p>
            </div>
            <div className="p-3 bg-background rounded">
              <span className="text-text-secondary text-xs">Tipo</span>
              <p className="font-mono text-primary text-lg">{typeConfig.name || property.property_type}</p>
            </div>
          </div>

          {/* Features */}
          {typeConfig.features && (
            <div>
              <p className="text-xs text-text-secondary uppercase mb-2">Características</p>
              <div className="flex flex-wrap gap-2">
                {typeConfig.features.map((feature, i) => (
                  <Badge key={i} variant="secondary" size="sm">{feature}</Badge>
                ))}
              </div>
            </div>
          )}
          
          {/* Actions */}
          <div className="flex gap-2">
            <Button
              variant="secondary"
              onClick={(e) => { e.stopPropagation(); onView?.(property); }}
              icon={Eye}
              className="flex-1"
            >
              Detalhes
            </Button>
            <Button
              variant="warning"
              onClick={(e) => { e.stopPropagation(); onMaintain(property.id); }}
              disabled={loading || property.condition >= 100}
              icon={Wrench}
              className="flex-1"
            >
              Reparar
            </Button>
            <Button
              variant="gold"
              onClick={(e) => { e.stopPropagation(); onUpgrade?.(property); }}
              icon={TrendingUp}
              className="flex-1"
            >
              Upgrade
            </Button>
            <Button
              variant="error"
              onClick={(e) => { e.stopPropagation(); onSell(property.id); }}
              disabled={loading}
              icon={Trash2}
            >
              Vender
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

// ==================== COMPONENTES DE FILTRAGEM ====================

const ViewToggle = ({ view, onViewChange }) => (
  <div className="flex gap-1 bg-surface-highlight rounded p-1">
    {PROPERTY_CONFIG.viewModes.map(mode => {
      const Icon = mode === 'grid' ? Grid : mode === 'list' ? List : LayoutGrid;
      return (
        <button
          key={mode}
          onClick={() => onViewChange(mode)}
          className={clsx(
            'p-2 rounded transition-all',
            view === mode
              ? 'bg-primary text-background'
              : 'text-text-secondary hover:text-text-primary'
          )}
        >
          <Icon size={14} />
        </button>
      );
    })}
  </div>
);

const SortDropdown = ({ sort, onSortChange }) => {
  const [isOpen, setIsOpen] = useState(false);

  const sortLabels = {
    name: 'Nome',
    value: 'Valor',
    condition: 'Condição',
    capacity: 'Capacidade',
    recent: 'Mais Recente',
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
        <div className="absolute top-full left-0 mt-1 bg-surface border border-border rounded shadow-lg z-10 min-w-[150px]">
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

const FilterBar = ({ filter, onFilterChange, search, onSearchChange }) => (
  <div className="flex flex-col sm:flex-row gap-2">
    <div className="relative flex-1">
      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
      <input
        type="text"
        placeholder="Pesquisar propriedades..."
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        className="w-full pl-9 pr-3 py-2 bg-surface border border-border rounded text-sm text-text-primary focus:border-primary transition-all"
      />
    </div>
    <div className="flex gap-1 overflow-x-auto">
      {PROPERTY_CONFIG.filterOptions.map(option => (
        <button
          key={option}
          onClick={() => onFilterChange(option)}
          className={clsx(
            'px-3 py-2 text-xs rounded whitespace-nowrap transition-all capitalize',
            filter === option
              ? 'bg-primary text-background'
              : 'bg-surface-highlight text-text-secondary hover:text-text-primary'
          )}
        >
          {option === 'all' ? 'Todas' : option}
        </button>
      ))}
    </div>
  </div>
);

// ==================== MODAIS ====================

const BuyPropertyModal = ({ isOpen, onClose, neighborhoods, propertyTypes, onBuy, loading, playerCash }) => {
  const [selectedNeighborhood, setSelectedNeighborhood] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [customName, setCustomName] = useState('');
  const [availableTypes, setAvailableTypes] = useState([]);
  const [step, setStep] = useState(1);
  
  useEffect(() => {
    if (selectedNeighborhood) {
      const filtered = propertyTypes.filter(p => 
        p.allowed_neighborhoods.includes(selectedNeighborhood)
      );
      setAvailableTypes(filtered);
      setSelectedType('');
    }
  }, [selectedNeighborhood, propertyTypes]);

  const resetForm = () => {
    setSelectedNeighborhood('');
    setSelectedType('');
    setCustomName('');
    setStep(1);
  };
  
  if (!isOpen) return null;
  
  const selectedProp = propertyTypes.find(p => p.id === selectedType);
  const neighborhood = neighborhoods.find(n => n.id === selectedNeighborhood);
  const adjustedPrice = selectedProp && neighborhood 
    ? Math.round(selectedProp.base_price * (1 + neighborhood.economic_value / 100))
    : 0;
  const canAfford = playerCash >= adjustedPrice;
  
  return (
    <Modal isOpen={isOpen} onClose={() => { onClose(); resetForm(); }} title="Comprar Propriedade" size="lg">
      <div className="space-y-4">
        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-4 mb-4">
          {[1, 2, 3].map(s => (
            <div key={s} className="flex items-center gap-2">
              <div className={clsx(
                'w-8 h-8 rounded-full flex items-center justify-center text-sm font-heading',
                step >= s 
                  ? 'bg-primary text-background' 
                  : 'bg-surface-highlight text-text-secondary'
              )}>
                {s}
              </div>
              {s < 3 && <div className={clsx('w-8 h-0.5', step > s ? 'bg-primary' : 'bg-border')} />}
            </div>
          ))}
        </div>

        {/* Step 1: Select Neighborhood */}
        {step === 1 && (
          <div className="space-y-4">
            <p className="text-sm text-text-secondary text-center">Seleciona o bairro onde queres comprar</p>
            
            <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
              {neighborhoods.map(n => (
                <button
                  key={n.id}
                  onClick={() => { setSelectedNeighborhood(n.id); setStep(2); }}
                  className={clsx(
                    'p-3 border rounded text-left transition-all',
                    selectedNeighborhood === n.id
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-primary/50'
                  )}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <MapPin size={14} className="text-primary" />
                    <span className="font-heading text-text-primary text-sm">{n.name}</span>
                  </div>
                  <div className="flex justify-between text-xs text-text-secondary">
                    <span>Valor: {n.economic_value}</span>
                    <span>Heat: {n.heat_level}%</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Select Property Type */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <button onClick={() => setStep(1)} className="text-sm text-primary flex items-center gap-1">
                <ArrowLeft size={14} /> Voltar
              </button>
              <Badge variant="secondary">{neighborhood?.name}</Badge>
            </div>

            <p className="text-sm text-text-secondary text-center">Seleciona o tipo de propriedade</p>
            
            {availableTypes.length > 0 ? (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {availableTypes.map(prop => {
                  const typeConfig = PROPERTY_TYPES_EXTENDED[prop.id] || {};
                  const price = Math.round(prop.base_price * (1 + neighborhood.economic_value / 100));
                  const affordable = playerCash >= price;
                  
                  return (
                    <button
                      key={prop.id}
                      onClick={() => { if (affordable) { setSelectedType(prop.id); setStep(3); }}}
                      disabled={!affordable}
                      className={clsx(
                        'w-full p-3 border rounded text-left transition-all',
                        selectedType === prop.id 
                          ? 'border-primary bg-primary/10' 
                          : affordable
                            ? 'border-border hover:border-primary/50'
                            : 'border-border opacity-50 cursor-not-allowed'
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <PropertyIcon type={prop.id} size={24} />
                        <div className="flex-1">
                          <p className="font-heading text-text-primary">{prop.name}</p>
                          <p className="text-xs text-text-secondary">{typeConfig.description || prop.description}</p>
                        </div>
                        <div className="text-right">
                          <p className={clsx('font-mono', affordable ? 'text-primary' : 'text-error')}>
                            €{price.toLocaleString()}
                          </p>
                          <p className="text-xs text-text-secondary">Cap: {prop.capacity || typeConfig.baseCapacity}</p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <Alert variant="warning">
                Nenhum tipo de propriedade disponível neste bairro.
              </Alert>
            )}
          </div>
        )}

        {/* Step 3: Customize and Confirm */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <button onClick={() => setStep(2)} className="text-sm text-primary flex items-center gap-1">
                <ArrowLeft size={14} /> Voltar
              </button>
              <div className="flex gap-2">
                <Badge variant="secondary">{neighborhood?.name}</Badge>
                <Badge variant="primary">{selectedProp?.name}</Badge>
              </div>
            </div>

            {/* Summary Card */}
            <div className="bg-surface-highlight p-4 rounded border border-border">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 bg-primary/20 rounded flex items-center justify-center">
                  <PropertyIcon type={selectedType} size={32} />
                </div>
                <div>
                  <h3 className="font-heading text-lg text-text-primary">{selectedProp?.name}</h3>
                  <p className="text-sm text-text-secondary">{neighborhood?.name}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-text-secondary">Preço</span>
                  <p className={clsx('font-mono', canAfford ? 'text-success' : 'text-error')}>
                    €{adjustedPrice.toLocaleString()}
                  </p>
                </div>
                <div>
                  <span className="text-text-secondary">Capacidade</span>
                  <p className="font-mono text-text-primary">{selectedProp?.capacity}</p>
                </div>
                <div>
                  <span className="text-text-secondary">Manutenção</span>
                  <p className="font-mono text-warning">€{selectedProp?.maintenance_cost || 100}/mês</p>
                </div>
                <div>
                  <span className="text-text-secondary">Disponível</span>
                  <p className="font-mono text-primary">€{playerCash.toLocaleString()}</p>
                </div>
              </div>
            </div>

            {/* Custom Name */}
            <Input
              label="Nome Personalizado (opcional)"
              type="text"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder={`${selectedProp?.name} em ${neighborhood?.name}`}
              maxLength={50}
            />

            {!canAfford && (
              <Alert variant="error">
                Não tens dinheiro suficiente para esta compra.
              </Alert>
            )}
          </div>
        )}
        
        {/* Actions */}
        <div className="flex gap-2 pt-2 border-t border-border">
          <Button variant="secondary" onClick={() => { onClose(); resetForm(); }} className="flex-1">
            Cancelar
          </Button>
          {step === 3 && (
            <Button
              variant="primary"
              onClick={() => { onBuy(selectedType, selectedNeighborhood, customName); resetForm(); }}
              disabled={!selectedType || loading || !canAfford}
              loading={loading}
              className="flex-1"
              icon={Building}
            >
              Comprar €{adjustedPrice.toLocaleString()}
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
};

const PropertyDetailModal = ({ isOpen, onClose, property, onMaintain, onSell, onUpgrade, loading }) => {
  const [activeTab, setActiveTab] = useState('info');
  
  if (!isOpen || !property) return null;

  const typeConfig = PROPERTY_TYPES_EXTENDED[property.property_type] || {};
  const sellValue = Math.round(property.purchase_price * PROPERTY_CONFIG.sellValueMultiplier);
  const repairCost = Math.round((100 - property.condition) * PROPERTY_CONFIG.repairCostMultiplier);

  const tabs = [
    { id: 'info', label: 'Informações', icon: Info },
    { id: 'upgrades', label: 'Upgrades', icon: TrendingUp },
    { id: 'history', label: 'Histórico', icon: Clock },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={property.custom_name} size="lg">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center gap-4 p-4 bg-surface-highlight rounded border border-border">
          <div className={`w-16 h-16 rounded-lg bg-${typeConfig.color}/20 flex items-center justify-center`}>
            <PropertyIcon type={property.property_type} size={32} />
          </div>
          <div className="flex-1">
            <h3 className="font-heading text-lg text-text-primary">{property.custom_name}</h3>
            <p className="text-sm text-text-secondary flex items-center gap-1">
              <MapPin size={12} /> {property.neighborhood_name}
            </p>
            <div className="flex gap-2 mt-1">
              <Badge variant={typeConfig.color || 'secondary'}>{typeConfig.name || property.property_type}</Badge>
              <Badge variant="gold">€{property.purchase_price?.toLocaleString()}</Badge>
            </div>
          </div>
          <div className="text-right">
            <ConditionIndicator condition={property.condition} />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-border">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={clsx(
                'flex items-center gap-1.5 px-4 py-2 text-sm transition-all',
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
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="p-3 bg-background rounded text-center">
                <p className="text-2xl font-mono text-primary">{property.capacity}</p>
                <p className="text-xs text-text-secondary">Capacidade</p>
              </div>
              <div className="p-3 bg-background rounded text-center">
                <p className="text-2xl font-mono text-warning">€{property.maintenance_cost}</p>
                <p className="text-xs text-text-secondary">Manutenção/mês</p>
              </div>
              <div className="p-3 bg-background rounded text-center">
                <p className="text-2xl font-mono text-success">€{sellValue.toLocaleString()}</p>
                <p className="text-xs text-text-secondary">Valor de Venda</p>
              </div>
              <div className="p-3 bg-background rounded text-center">
                <p className="text-2xl font-mono text-error">€{repairCost}</p>
                <p className="text-xs text-text-secondary">Custo Reparação</p>
              </div>
            </div>

            {typeConfig.features && (
              <div>
                <p className="text-xs text-text-secondary uppercase mb-2">Características</p>
                <div className="flex flex-wrap gap-2">
                  {typeConfig.features.map((feature, i) => (
                    <Badge key={i} variant="secondary">{feature}</Badge>
                  ))}
                </div>
              </div>
            )}

            {typeConfig.description && (
              <div className="p-3 bg-primary/10 border border-primary/30 rounded">
                <p className="text-sm text-text-secondary">{typeConfig.description}</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'upgrades' && (
          <div className="space-y-3">
            {UPGRADE_OPTIONS.map(upgrade => (
              <div key={upgrade.id} className="flex items-center justify-between p-3 bg-surface-highlight border border-border rounded hover:border-primary/50 transition-all">
                <div className="flex-1">
                  <p className="font-heading text-text-primary text-sm">{upgrade.name}</p>
                  <p className="text-xs text-text-secondary">{upgrade.description}</p>
                  <Badge variant="success" size="xs" className="mt-1">{upgrade.bonus}</Badge>
                </div>
                <Button
                  variant="gold"
                  size="sm"
                  onClick={() => onUpgrade?.(property.id, upgrade.id)}
                >
                  €{upgrade.cost.toLocaleString()}
                </Button>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'history' && (
          <EmptyState
            icon={Clock}
            title="Sem Histórico"
            description="O histórico de ações desta propriedade aparecerá aqui."
          />
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2 border-t border-border">
          <Button
            variant="warning"
            onClick={() => onMaintain(property.id)}
            disabled={loading || property.condition >= 100}
            icon={Wrench}
            className="flex-1"
          >
            Reparar (€{repairCost})
          </Button>
          <Button
            variant="error"
            onClick={() => onSell(property.id)}
            disabled={loading}
            icon={Trash2}
            className="flex-1"
          >
            Vender (€{sellValue.toLocaleString()})
          </Button>
        </div>
      </div>
    </Modal>
  );
};

const ConfirmSellModal = ({ isOpen, onClose, property, onConfirm, loading }) => {
  if (!isOpen || !property) return null;

  const sellValue = Math.round(property.purchase_price * PROPERTY_CONFIG.sellValueMultiplier);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Confirmar Venda" size="sm">
      <div className="space-y-4">
        <Alert variant="warning">
          <div className="flex items-start gap-2">
            <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" />
            <p className="text-xs">Esta ação é irreversível. A propriedade será vendida permanentemente.</p>
          </div>
        </Alert>

        <div className="bg-surface-highlight p-4 rounded border border-border text-center">
          <PropertyIcon type={property.property_type} size={32} className="mx-auto mb-2" />
          <h3 className="font-heading text-text-primary">{property.custom_name}</h3>
          <p className="text-sm text-text-secondary">{property.neighborhood_name}</p>
          <div className="mt-3 p-3 bg-background rounded">
            <p className="text-xs text-text-secondary">Valor de Venda</p>
            <p className="text-2xl font-mono text-success">€{sellValue.toLocaleString()}</p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="secondary" onClick={onClose} className="flex-1">
            Cancelar
          </Button>
          <Button
            variant="error"
            onClick={() => onConfirm(property.id)}
            loading={loading}
            className="flex-1"
            icon={Trash2}
          >
            Confirmar Venda
          </Button>
        </div>
      </div>
    </Modal>
  );
};

// ==================== COMPONENTE PRINCIPAL ====================

export default function PropertiesPage() {
  const { token } = useAuth();
  const { refreshStats } = useGame();
  
  // Estados principais
  const [properties, setProperties] = useState([]);
  const [propertyTypes, setPropertyTypes] = useState([]);
  const [neighborhoods, setNeighborhoods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [notification, setNotification] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [playerCash, setPlayerCash] = useState(0);
  
  // Estados de UI
  const [viewMode, setViewMode] = useLocalStorage('properties_view', 'grid');
  const [sortBy, setSortBy] = useLocalStorage('properties_sort', 'name');
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [favorites, setFavorites] = useLocalStorage('property_favorites', []);
  const debouncedSearch = useDebounce(searchTerm, 300);
  
  // Estados de modais
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showSellModal, setShowSellModal] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState(null);
  
  // Fetch data
  const fetchData = useCallback(async () => {
    try {
      const [propsRes, typesRes, neighborhoodsRes, userRes] = await Promise.all([
        fetch(`${API_URL}/api/properties/my`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`${API_URL}/api/properties/types`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`${API_URL}/api/neighborhoods`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`${API_URL}/api/users/me`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);
      
      if (propsRes.ok) {
        const data = await propsRes.json();
        setProperties(data.properties || []);
      }
      if (typesRes.ok) {
        const data = await typesRes.json();
        setPropertyTypes(data.property_types || []);
      }
      if (neighborhoodsRes.ok) {
        const data = await neighborhoodsRes.json();
        setNeighborhoods(data || []);
      }
      if (userRes.ok) {
        const data = await userRes.json();
        setPlayerCash(data.player_state?.cash || data.clean_money || 0);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      showNotif('Erro ao carregar dados', 'error');
    } finally {
      setLoading(false);
    }
  }, [token]);
  
  useEffect(() => {
    fetchData();
  }, [fetchData]);
  
  // Handlers
  const showNotif = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchData();
    setTimeout(() => setIsRefreshing(false), 1000);
  };
  
  const handleBuyProperty = async (propertyType, neighborhoodId, customName) => {
    setActionLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/properties/buy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          property_type: propertyType,
          neighborhood_id: neighborhoodId,
          custom_name: customName || null
        })
      });
      
      const data = await res.json();
      if (res.ok) {
        showNotif(data.message || 'Propriedade comprada com sucesso!');
        setShowBuyModal(false);
        await fetchData();
        if (refreshStats) refreshStats();
      } else {
        showNotif(data.detail || 'Erro ao comprar', 'error');
      }
    } catch (error) {
      showNotif('Erro de conexão', 'error');
    } finally {
      setActionLoading(false);
    }
  };
  
  const handleMaintain = async (propertyId) => {
    setActionLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/properties/${propertyId}/maintain`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const data = await res.json();
      if (res.ok) {
        showNotif(data.message || 'Manutenção realizada!');
        await fetchData();
        if (refreshStats) refreshStats();
      } else {
        showNotif(data.detail || 'Erro ao fazer manutenção', 'error');
      }
    } catch (error) {
      showNotif('Erro de conexão', 'error');
    } finally {
      setActionLoading(false);
    }
  };
  
  const handleSell = async (propertyId) => {
    const property = properties.find(p => p.id === propertyId);
    if (property) {
      setSelectedProperty(property);
      setShowSellModal(true);
    }
  };

  const confirmSell = async (propertyId) => {
    setActionLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/properties/${propertyId}/sell`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const data = await res.json();
      if (res.ok) {
        showNotif(data.message || 'Propriedade vendida!');
        setShowSellModal(false);
        setSelectedProperty(null);
        await fetchData();
        if (refreshStats) refreshStats();
      } else {
        showNotif(data.detail || 'Erro ao vender', 'error');
      }
    } catch (error) {
      showNotif('Erro de conexão', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleViewProperty = (property) => {
    setSelectedProperty(property);
    setShowDetailModal(true);
  };

  const handleToggleFavorite = (propertyId) => {
    setFavorites(prev => 
      prev.includes(propertyId)
        ? prev.filter(id => id !== propertyId)
        : [...prev, propertyId]
    );
  };

  // Computed values
  const filteredProperties = useMemo(() => {
    return properties
      .filter(p => {
        const matchesSearch = !debouncedSearch || 
          p.custom_name?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
          p.neighborhood_name?.toLowerCase().includes(debouncedSearch.toLowerCase());
        
        const matchesFilter = filter === 'all' || 
          PROPERTY_TYPES_EXTENDED[p.property_type]?.category === filter;
        
        return matchesSearch && matchesFilter;
      })
      .sort((a, b) => {
        switch (sortBy) {
          case 'value': return b.purchase_price - a.purchase_price;
          case 'condition': return b.condition - a.condition;
          case 'capacity': return b.capacity - a.capacity;
          case 'recent': return new Date(b.purchased_at) - new Date(a.purchased_at);
          default: return a.custom_name?.localeCompare(b.custom_name);
        }
      });
  }, [properties, debouncedSearch, filter, sortBy]);

  const stats = useMemo(() => ({
    totalProperties: properties.length,
    totalCapacity: properties.reduce((sum, p) => sum + (p.capacity || 0), 0),
    totalValue: properties.reduce((sum, p) => sum + (p.purchase_price || 0), 0),
    avgCondition: properties.length > 0 
      ? Math.round(properties.reduce((sum, p) => sum + p.condition, 0) / properties.length)
      : 0,
    needsMaintenance: properties.filter(p => p.condition < PROPERTY_CONFIG.maintenanceWarningThreshold).length,
  }), [properties]);

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-border border-t-primary rounded-full animate-spin mx-auto mb-4" />
          <p className="text-text-secondary">A carregar propriedades...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-4 pb-20 md:pb-6" data-testid="properties-page">
      {/* Notification */}
      {notification && (
        <Alert variant={notification.type}>
          {notification.message}
        </Alert>
      )}
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-xl md:text-2xl text-primary flex items-center gap-2">
            <Building size={24} /> Propriedades
          </h1>
          <p className="text-text-secondary text-sm">
            {stats.totalProperties} / {PROPERTY_CONFIG.maxPropertiesPerPlayer} propriedades
          </p>
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
          <Button
            variant="primary"
            onClick={() => setShowBuyModal(true)}
            icon={Plus}
            disabled={stats.totalProperties >= PROPERTY_CONFIG.maxPropertiesPerPlayer}
          >
            Comprar
          </Button>
        </div>
      </div>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <StatCard
          icon={Building}
          label="Propriedades"
          value={stats.totalProperties}
          color="primary"
        />
        <StatCard
          icon={Package}
          label="Capacidade Total"
          value={stats.totalCapacity}
          color="warning"
        />
        <StatCard
          icon={Coins}
          label="Valor Total"
          value={`€${stats.totalValue.toLocaleString()}`}
          color="gold"
        />
        <StatCard
          icon={Wrench}
          label="Condição Média"
          value={`${stats.avgCondition}%`}
          color={stats.avgCondition >= 50 ? 'success' : 'error'}
        />
        <StatCard
          icon={AlertTriangle}
          label="Precisam Reparação"
          value={stats.needsMaintenance}
          color={stats.needsMaintenance > 0 ? 'error' : 'success'}
        />
      </div>

      {/* Tips */}
      <TipsCarousel tips={PROPERTY_TIPS} />

      {/* Filter Bar */}
      <div className="flex flex-col md:flex-row gap-3 items-start md:items-center justify-between">
        <FilterBar
          filter={filter}
          onFilterChange={setFilter}
          search={searchTerm}
          onSearchChange={setSearchTerm}
        />
        <div className="flex gap-2">
          <SortDropdown sort={sortBy} onSortChange={setSortBy} />
          <ViewToggle view={viewMode} onViewChange={setViewMode} />
        </div>
      </div>
      
      {/* Properties List */}
      {filteredProperties.length === 0 ? (
        <Card>
          <EmptyState
            icon={Building}
            title={properties.length === 0 ? 'Sem Propriedades' : 'Nenhum Resultado'}
            description={
              properties.length === 0
                ? 'Compra a tua primeira propriedade para expandir o teu império.'
                : 'Nenhuma propriedade encontrada com esses filtros.'
            }
            action={properties.length === 0 ? () => setShowBuyModal(true) : undefined}
            actionLabel="Comprar Propriedade"
          />
        </Card>
      ) : (
        <>
          {viewMode === 'grid' ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProperties.map(property => (
                <PropertyCardGrid
                  key={property.id}
                  property={property}
                  onMaintain={handleMaintain}
                  onSell={handleSell}
                  onUpgrade={() => handleViewProperty(property)}
                  onView={handleViewProperty}
                  loading={actionLoading}
                  isFavorite={favorites.includes(property.id)}
                  onToggleFavorite={handleToggleFavorite}
                />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredProperties.map(property => (
                <PropertyCardList
                  key={property.id}
                  property={property}
                  onMaintain={handleMaintain}
                  onSell={handleSell}
                  onUpgrade={() => handleViewProperty(property)}
                  onView={handleViewProperty}
                  loading={actionLoading}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* Results Count */}
      {properties.length > 0 && (
        <div className="text-center text-xs text-text-secondary">
          A mostrar {filteredProperties.length} de {properties.length} propriedades
        </div>
      )}
      
      {/* Modals */}
      <BuyPropertyModal
        isOpen={showBuyModal}
        onClose={() => setShowBuyModal(false)}
        neighborhoods={neighborhoods}
        propertyTypes={propertyTypes}
        onBuy={handleBuyProperty}
        loading={actionLoading}
        playerCash={playerCash}
      />

      <PropertyDetailModal
        isOpen={showDetailModal}
        onClose={() => { setShowDetailModal(false); setSelectedProperty(null); }}
        property={selectedProperty}
        onMaintain={handleMaintain}
        onSell={handleSell}
        loading={actionLoading}
      />

      <ConfirmSellModal
        isOpen={showSellModal}
        onClose={() => { setShowSellModal(false); setSelectedProperty(null); }}
        property={selectedProperty}
        onConfirm={confirmSell}
        loading={actionLoading}
      />
    </div>
  );
}

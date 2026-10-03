import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useGame } from '../contexts/GameContext';
import { useAuth } from '../contexts/AuthContext';
import { Card, ProgressBar } from '../components/ProgressBar';
import { Button, Badge, Modal, Alert, Input } from '../components/UI';
import { EVENTS_LORE, getRandomWisdomQuote } from '../data/lore';
import { 
  Radio, ShieldAlert, PartyPopper, ZapOff, Handshake,
  TrendingUp, TrendingDown, Thermometer, Star, ShoppingBag, Clock, 
  AlertTriangle, Percent, Eye, Lightbulb, Activity, Target,
  Calendar, Bell, BellRing, BellOff, RefreshCw, Info, HelpCircle,
  ChevronDown, ChevronUp, ChevronRight, ChevronLeft, MoreHorizontal,
  Search, Filter, Grid, List, SortAsc, SortDesc, Download, Share2,
  Copy, ExternalLink, Settings, Bookmark, BookmarkCheck, Flag,
  Check, X, Plus, Minus, Loader2, CheckCircle, XCircle, AlertCircle,
  Flame, Snowflake, Cloud, CloudRain, Sun, Moon, Zap, ZapIcon,
  Users, User, UserPlus, UserMinus, UserCheck, UserX, Skull,
  DollarSign, Coins, Wallet, CreditCard, Banknote, PiggyBank,
  Building, Home, Factory, Warehouse, Store, MapPin, Map,
  Car, Truck, Plane, Ship, Train, Bike, Footprints, Navigation,
  Shield, ShieldCheck, ShieldOff, Lock, Unlock, Key, Fingerprint,
  Heart, HeartOff, ThumbsUp, ThumbsDown, Smile, Frown, Meh,
  Gift, Award, Crown, Trophy, Medal, Sparkles, Gem, Diamond,
  MessageSquare, MessageCircle, Mail, Send, Inbox, Archive,
  Camera, Image, Video, Music, Headphones, Volume2, VolumeX,
  Monitor, Smartphone, Tablet, Cpu, HardDrive, Server, Database,
  Wifi, WifiOff, Signal, Power, Battery, Bluetooth, Radio as RadioIcon,
  Timer, Hourglass, AlarmClock, Play, Pause, Square as Stop, FastForward, Rewind,
  BarChart2, PieChart, LineChart, TrendingUpIcon, Calculator,
  FileText, Folder, File, FilePlus, FileCheck, FileX, Files,
  Briefcase, Package, Box, Layers, Grid3X3, LayoutGrid
} from 'lucide-react';
import clsx from 'clsx';

// ==================== CONSTANTES E CONFIGURAÇÕES ====================

const EVENT_CONFIG = {
  refreshInterval: 10000,
  maxActiveEvents: 10,
  maxUpcomingEvents: 20,
  maxHistoryEvents: 50,
  notificationDuration: 5000,
};

const EVENT_ICONS = {
  'shield-alert': ShieldAlert,
  'party-popper': PartyPopper,
  'zap-off': ZapOff,
  'handshake': Handshake,
  'trending-up': TrendingUp,
  'thermometer': Thermometer,
  'star': Star,
  'shopping-bag': ShoppingBag,
  'flame': Flame,
  'snowflake': Snowflake,
  'cloud': Cloud,
  'zap': Zap,
  'users': Users,
  'skull': Skull,
  'coins': DollarSign,
  'building': Building,
  'car': Car,
  'shield': Shield,
  'gift': Gift,
  'trophy': Trophy,
};

const EVENT_CATEGORIES = {
  POLICE: { id: 'police', label: 'Polícia', icon: ShieldAlert, color: 'error', description: 'Operações policiais na cidade' },
  ECONOMY: { id: 'economy', label: 'Economia', icon: TrendingUp, color: 'success', description: 'Alterações no mercado' },
  GANG: { id: 'gang', label: 'Gangues', icon: Users, color: 'warning', description: 'Atividade de gangues rivais' },
  WEATHER: { id: 'weather', label: 'Clima', icon: Cloud, color: 'primary', description: 'Condições meteorológicas' },
  SPECIAL: { id: 'special', label: 'Especial', icon: Star, color: 'gold', description: 'Eventos únicos e raros' },
  SOCIAL: { id: 'social', label: 'Social', icon: PartyPopper, color: 'secondary', description: 'Eventos da comunidade' },
};

const EVENT_SEVERITY = {
  LOW: { id: 'low', label: 'Baixa', color: 'success', priority: 1 },
  MEDIUM: { id: 'medium', label: 'Média', color: 'warning', priority: 2 },
  HIGH: { id: 'high', label: 'Alta', color: 'error', priority: 3 },
  CRITICAL: { id: 'critical', label: 'Crítica', color: 'error', priority: 4, pulse: true },
};

const WEATHER_CONDITIONS = [
  { id: 'clear', name: 'Limpo', icon: Sun, effect: 'Sem efeitos especiais', modifier: 1.0 },
  { id: 'rain', name: 'Chuva', icon: CloudRain, effect: 'Menos patrulhas policiais', modifier: 0.9 },
  { id: 'storm', name: 'Tempestade', icon: Zap, effect: 'Crimes mais fáceis de escapar', modifier: 0.8 },
  { id: 'fog', name: 'Nevoeiro', icon: Cloud, effect: 'Stealth melhorado', modifier: 0.85 },
  { id: 'heat', name: 'Calor Extremo', icon: Flame, effect: 'Tensões aumentadas', modifier: 1.1 },
];

const EVENT_TIPS = [
  'Eventos podem afetar drasticamente os preços do mercado negro.',
  'Durante operações policiais, evita crimes de alto risco.',
  'Guerras de gangues criam oportunidades de lucro.',
  'Aproveita festivais para fazer networking.',
  'O mau tempo pode ser vantajoso para operações secretas.',
  'Fica atento às previsões para planear melhor.',
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

function useCountdown(targetDate) {
  const [timeLeft, setTimeLeft] = useState({ minutes: 0, seconds: 0, total: 0 });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const end = new Date(targetDate).getTime();
      const now = Date.now();
      const diff = end - now;
      
      if (diff <= 0) return { minutes: 0, seconds: 0, total: 0 };
      
      return {
        minutes: Math.floor(diff / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
        total: diff,
      };
    };

    setTimeLeft(calculateTimeLeft());
    const timer = setInterval(() => setTimeLeft(calculateTimeLeft()), 1000);
    return () => clearInterval(timer);
  }, [targetDate]);

  return timeLeft;
}

function useInterval(callback, delay) {
  const savedCallback = useRef();

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    function tick() {
      savedCallback.current();
    }
    if (delay !== null) {
      const id = setInterval(tick, delay);
      return () => clearInterval(id);
    }
  }, [delay]);
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
        <div className={clsx('absolute z-50 px-2 py-1 text-xs bg-surface border border-border rounded shadow-lg whitespace-nowrap', positions[position])}>
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
  
  return <div className={clsx('animate-pulse bg-surface-highlight', variants[variant], className)} />;
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
  const progress = Math.min(value / max, 1);
  const offset = circumference - progress * circumference;
  
  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="currentColor" strokeWidth={strokeWidth} className="text-border" />
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" className={`text-${color} transition-all duration-500`} />
    </svg>
  );
};

const PulsingDot = ({ color = 'primary', size = 'md' }) => {
  const sizes = { sm: 'w-2 h-2', md: 'w-3 h-3', lg: 'w-4 h-4' };
  
  return (
    <span className="relative flex">
      <span className={clsx('animate-ping absolute inline-flex rounded-full opacity-75', sizes[size], `bg-${color}`)} />
      <span className={clsx('relative inline-flex rounded-full', sizes[size], `bg-${color}`)} />
    </span>
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

const StatCard = ({ icon: Icon, label, value, color = 'primary', subtext, trend }) => (
  <div className="bg-surface border border-border rounded-lg p-3 md:p-4 hover:border-primary/30 transition-all">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-text-secondary text-xs uppercase mb-1">{label}</p>
        <div className="flex items-baseline gap-2">
          <p className={`text-xl md:text-2xl font-mono text-${color}`}>{value}</p>
          {trend && (
            <span className={clsx('flex items-center text-xs', trend > 0 ? 'text-success' : 'text-error')}>
              {trend > 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              {Math.abs(trend)}%
            </span>
          )}
        </div>
        {subtext && <p className="text-xs text-text-secondary mt-1">{subtext}</p>}
      </div>
      <Icon size={28} className={`text-${color} opacity-50`} />
    </div>
  </div>
);

const CountdownTimer = ({ targetDate, label, color = 'primary' }) => {
  const timeLeft = useCountdown(targetDate);
  
  if (timeLeft.total <= 0) {
    return <Badge variant="error">Expirado</Badge>;
  }

  return (
    <div className="flex items-center gap-2">
      <Clock size={14} className={`text-${color}`} />
      <span className={`font-mono text-${color}`}>
        {String(timeLeft.minutes).padStart(2, '0')}:{String(timeLeft.seconds).padStart(2, '0')}
      </span>
      {label && <span className="text-text-secondary text-xs">{label}</span>}
    </div>
  );
};

// ==================== COMPONENTES DE EVENTO ====================

const EventCard = ({ event, isExpanded, onToggle, onBookmark, isBookmarked }) => {
  const [showDetails, setShowDetails] = useState(false);
  const IconComponent = EVENT_ICONS[event.icon] || Radio;
  const category = EVENT_CATEGORIES[event.category?.toUpperCase()] || EVENT_CATEGORIES.SPECIAL;
  const severity = EVENT_SEVERITY[event.severity?.toUpperCase()] || EVENT_SEVERITY.LOW;
  const timeLeft = useCountdown(event.ends_at);
  
  const getEffectColor = (value, isMultiplier = true) => {
    if (isMultiplier) {
      if (value > 1) return 'success';
      if (value < 1) return 'error';
    } else {
      if (value > 0) return 'success';
      if (value < 0) return 'error';
    }
    return 'secondary';
  };

  const formatModifier = (value) => {
    const percent = Math.round((value - 1) * 100);
    if (percent > 0) return `+${percent}%`;
    return `${percent}%`;
  };

  return (
    <div className={clsx(
      'bg-surface border rounded-lg overflow-hidden transition-all',
      severity.id === 'critical' ? 'border-error animate-pulse' : 'border-border',
      'hover:shadow-lg'
    )}>
      {/* Header */}
      <div 
        className={clsx('p-4 cursor-pointer', `bg-${category.color}/5`)}
        onClick={onToggle}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={clsx(
              'w-12 h-12 rounded-lg flex items-center justify-center',
              `bg-${category.color}/20 border border-${category.color}/30`
            )}>
              <IconComponent size={24} className={`text-${category.color}`} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-heading text-text-primary">{event.name}</h3>
                {severity.pulse && <PulsingDot color={severity.color} size="sm" />}
              </div>
              <div className="flex items-center gap-2 text-sm text-text-secondary mt-0.5">
                <Badge variant={category.color} size="xs">{category.label}</Badge>
                <Badge variant={severity.color} size="xs">{severity.label}</Badge>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => { e.stopPropagation(); onBookmark?.(event.id); }}
              className="p-1.5 hover:bg-surface-highlight rounded transition-all"
            >
              {isBookmarked ? (
                <BookmarkCheck size={16} className="text-gold" />
              ) : (
                <Bookmark size={16} className="text-text-secondary" />
              )}
            </button>
            <CountdownTimer targetDate={event.ends_at} />
            {isExpanded ? <ChevronUp size={20} className="text-text-secondary" /> : <ChevronDown size={20} className="text-text-secondary" />}
          </div>
        </div>
        
        {/* Description */}
        <p className="text-text-secondary text-sm mt-2 line-clamp-2">{event.description}</p>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="border-t border-border p-4 space-y-4">
          {/* Effects */}
          {event.effects && (
            <div className="space-y-2">
              <h4 className="text-xs text-text-secondary uppercase font-ui">Efeitos Ativos</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {event.effects.crime_success && event.effects.crime_success !== 1 && (
                  <div className={clsx('p-2 rounded border', `border-${getEffectColor(event.effects.crime_success)}/30 bg-${getEffectColor(event.effects.crime_success)}/5`)}>
                    <p className="text-xs text-text-secondary">Sucesso Crime</p>
                    <p className={`font-mono text-${getEffectColor(event.effects.crime_success)}`}>
                      {formatModifier(event.effects.crime_success)}
                    </p>
                  </div>
                )}
                {event.effects.police_activity && event.effects.police_activity !== 1 && (
                  <div className={clsx('p-2 rounded border', `border-${getEffectColor(event.effects.police_activity, false)}/30 bg-${getEffectColor(event.effects.police_activity, false)}/5`)}>
                    <p className="text-xs text-text-secondary">Polícia</p>
                    <p className={`font-mono text-${getEffectColor(event.effects.police_activity, false)}`}>
                      {formatModifier(event.effects.police_activity)}
                    </p>
                  </div>
                )}
                {event.effects.market_prices && event.effects.market_prices !== 1 && (
                  <div className={clsx('p-2 rounded border', `border-${getEffectColor(event.effects.market_prices)}/30 bg-${getEffectColor(event.effects.market_prices)}/5`)}>
                    <p className="text-xs text-text-secondary">Preços</p>
                    <p className={`font-mono text-${getEffectColor(event.effects.market_prices)}`}>
                      {formatModifier(event.effects.market_prices)}
                    </p>
                  </div>
                )}
                {event.effects.reputation_gain && event.effects.reputation_gain !== 1 && (
                  <div className={clsx('p-2 rounded border', `border-${getEffectColor(event.effects.reputation_gain)}/30 bg-${getEffectColor(event.effects.reputation_gain)}/5`)}>
                    <p className="text-xs text-text-secondary">Reputação</p>
                    <p className={`font-mono text-${getEffectColor(event.effects.reputation_gain)}`}>
                      {formatModifier(event.effects.reputation_gain)}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Time Progress */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-text-secondary">Tempo Restante</span>
              <span className="text-text-primary">
                {timeLeft.total > 0 ? `${timeLeft.minutes}:${String(timeLeft.seconds).padStart(2, '0')}` : 'Expirado'}
              </span>
            </div>
            <div className="h-2 bg-background rounded-full overflow-hidden">
              <div 
                className={clsx('h-full transition-all', `bg-${timeLeft.total > 60000 ? category.color : 'error'}`)}
                style={{ width: `${Math.max(0, (timeLeft.total / (event.duration || 300000)) * 100)}%` }}
              />
            </div>
          </div>

          {/* Affected Areas */}
          {event.affected_areas && event.affected_areas.length > 0 && (
            <div>
              <h4 className="text-xs text-text-secondary uppercase font-ui mb-2">Áreas Afetadas</h4>
              <div className="flex flex-wrap gap-2">
                {event.affected_areas.map((area, idx) => (
                  <Badge key={idx} variant="secondary" size="sm">
                    <MapPin size={10} className="mr-1" /> {area}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Lore Description */}
          {EVENTS_LORE[event.id] && (
            <div className="p-3 bg-primary/10 border border-primary/30 rounded">
              <p className="text-sm text-text-secondary italic">{EVENTS_LORE[event.id]}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const EventListItem = ({ event, onClick, isBookmarked }) => {
  const IconComponent = EVENT_ICONS[event.icon] || Radio;
  const category = EVENT_CATEGORIES[event.category?.toUpperCase()] || EVENT_CATEGORIES.SPECIAL;
  const severity = EVENT_SEVERITY[event.severity?.toUpperCase()] || EVENT_SEVERITY.LOW;

  return (
    <div 
      className="flex items-center gap-4 p-3 bg-surface border border-border rounded hover:border-primary/30 cursor-pointer transition-all"
      onClick={() => onClick(event)}
    >
      <div className={clsx('w-10 h-10 rounded flex items-center justify-center', `bg-${category.color}/20`)}>
        <IconComponent size={18} className={`text-${category.color}`} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h4 className="font-heading text-text-primary text-sm truncate">{event.name}</h4>
          {severity.pulse && <PulsingDot color={severity.color} size="sm" />}
        </div>
        <p className="text-xs text-text-secondary truncate">{event.description}</p>
      </div>
      <div className="flex items-center gap-2">
        {isBookmarked && <Bookmark size={14} className="text-gold" />}
        <Badge variant={severity.color} size="xs">{severity.label}</Badge>
        <CountdownTimer targetDate={event.ends_at} />
        <ChevronRight size={16} className="text-text-secondary" />
      </div>
    </div>
  );
};

const UpcomingEventCard = ({ prediction }) => (
  <div className="p-3 bg-surface border border-border rounded hover:border-primary/30 transition-all">
    <div className="flex items-center justify-between mb-2">
      <div className="flex items-center gap-2">
        <Lightbulb size={14} className="text-warning" />
        <span className="text-text-primary text-sm font-heading">{prediction.event_type}</span>
      </div>
      <Badge variant="warning" size="xs">{prediction.probability}% chance</Badge>
    </div>
    <p className="text-xs text-text-secondary">{prediction.hint}</p>
    <div className="flex items-center gap-2 mt-2 text-xs">
      <Clock size={10} className="text-text-secondary" />
      <span className="text-text-secondary">Previsão: {prediction.estimated_time || 'Em breve'}</span>
    </div>
  </div>
);

const WeatherWidget = ({ weather }) => {
  const condition = WEATHER_CONDITIONS.find(w => w.id === weather?.current) || WEATHER_CONDITIONS[0];
  const WeatherIcon = condition.icon;

  return (
    <Card title="Clima Atual" icon={Cloud}>
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 bg-primary/10 border border-primary/30 rounded-lg flex items-center justify-center">
          <WeatherIcon size={32} className="text-primary" />
        </div>
        <div>
          <h4 className="font-heading text-text-primary text-lg">{condition.name}</h4>
          <p className="text-sm text-text-secondary">{condition.effect}</p>
          <Badge variant="secondary" size="xs" className="mt-1">
            Modificador: {Math.round(condition.modifier * 100)}%
          </Badge>
        </div>
      </div>
      
      {/* Weather Forecast */}
      <div className="mt-4 pt-4 border-t border-border">
        <h5 className="text-xs text-text-secondary uppercase mb-2">Previsão (próximas horas)</h5>
        <div className="flex gap-3">
          {WEATHER_CONDITIONS.slice(0, 4).map((w, idx) => {
            const Icon = w.icon;
            return (
              <div key={idx} className="text-center">
                <Icon size={16} className="mx-auto text-text-secondary" />
                <p className="text-xs text-text-secondary mt-1">{idx + 1}h</p>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
};

const EffectsSummaryCard = ({ effects }) => {
  if (!effects?.active_modifiers) return null;

  const modifiers = effects.active_modifiers;
  
  const getModifierDisplay = (value) => {
    const percent = Math.round((value - 1) * 100);
    const isPositive = percent > 0;
    return {
      text: `${isPositive ? '+' : ''}${percent}%`,
      color: isPositive ? 'success' : percent < 0 ? 'error' : 'secondary',
    };
  };

  const effectsList = [
    { key: 'crime_success', label: 'Sucesso em Crimes', icon: Target },
    { key: 'police_activity', label: 'Atividade Policial', icon: ShieldAlert },
    { key: 'market_prices', label: 'Preços do Mercado', icon: ShoppingBag },
    { key: 'reputation_gain', label: 'Ganho de Reputação', icon: Star },
    { key: 'xp_gain', label: 'Ganho de XP', icon: Zap },
    { key: 'heat_gain', label: 'Acumulação de Heat', icon: Flame },
  ].filter(e => modifiers[e.key] && modifiers[e.key] !== 1);

  if (effectsList.length === 0) {
    return (
      <Card title="Efeitos Ativos" icon={Activity}>
        <div className="text-center py-4">
          <Meh size={24} className="mx-auto text-text-secondary mb-2" />
          <p className="text-text-secondary text-sm">Sem modificadores ativos</p>
        </div>
      </Card>
    );
  }

  return (
    <Card title="Efeitos Ativos" icon={Activity}>
      <div className="space-y-2">
        {effectsList.map(({ key, label, icon: Icon }) => {
          const mod = getModifierDisplay(modifiers[key]);
          return (
            <div key={key} className="flex items-center justify-between p-2 bg-surface-highlight rounded">
              <div className="flex items-center gap-2">
                <Icon size={14} className={`text-${mod.color}`} />
                <span className="text-sm text-text-primary">{label}</span>
              </div>
              <Badge variant={mod.color}>{mod.text}</Badge>
            </div>
          );
        })}
      </div>
      
      <p className="text-xs text-text-secondary mt-3">
        {effects.active_events_count || 0} evento(s) a contribuir para estes modificadores
      </p>
    </Card>
  );
};

const ImpactAnalysisCard = ({ impact }) => {
  if (!impact) return null;

  return (
    <Card title="Análise de Impacto" icon={BarChart2}>
      <div className="space-y-4">
        {/* Overall Impact */}
        <div className="text-center p-4 bg-surface-highlight rounded-lg">
          <p className="text-xs text-text-secondary uppercase mb-1">Impacto Global</p>
          <p className={clsx(
            'text-3xl font-mono',
            impact.overall > 1 ? 'text-success' : impact.overall < 1 ? 'text-error' : 'text-secondary'
          )}>
            {impact.overall > 1 ? '+' : ''}{Math.round((impact.overall - 1) * 100)}%
          </p>
        </div>

        {/* Category Breakdown */}
        <div className="space-y-2">
          <h5 className="text-xs text-text-secondary uppercase">Por Categoria</h5>
          {Object.entries(impact.by_category || {}).map(([category, value]) => {
            const cat = EVENT_CATEGORIES[category.toUpperCase()];
            const Icon = cat?.icon || Activity;
            const percent = Math.round((value - 1) * 100);
            
            return (
              <div key={category} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Icon size={14} className={`text-${cat?.color || 'secondary'}`} />
                  <span className="text-text-primary capitalize">{cat?.label || category}</span>
                </div>
                <span className={clsx('font-mono', percent > 0 ? 'text-success' : percent < 0 ? 'text-error' : 'text-text-secondary')}>
                  {percent > 0 ? '+' : ''}{percent}%
                </span>
              </div>
            );
          })}
        </div>

        {/* Recommendations */}
        {impact.recommendations && impact.recommendations.length > 0 && (
          <div className="pt-3 border-t border-border">
            <h5 className="text-xs text-text-secondary uppercase mb-2">Recomendações</h5>
            <ul className="space-y-1">
              {impact.recommendations.map((rec, idx) => (
                <li key={idx} className="text-xs text-text-secondary flex items-start gap-2">
                  <CheckCircle size={12} className="text-success mt-0.5 flex-shrink-0" />
                  {rec}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </Card>
  );
};

const EventHistoryItem = ({ event }) => {
  const IconComponent = EVENT_ICONS[event.icon] || Radio;
  const category = EVENT_CATEGORIES[event.category?.toUpperCase()] || EVENT_CATEGORIES.SPECIAL;

  return (
    <div className="flex items-center gap-3 py-2 border-b border-border last:border-b-0">
      <div className={clsx('w-8 h-8 rounded flex items-center justify-center', `bg-${category.color}/10`)}>
        <IconComponent size={14} className={`text-${category.color} opacity-50`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-text-primary truncate">{event.name}</p>
        <p className="text-xs text-text-secondary">{new Date(event.ended_at).toLocaleString('pt-PT')}</p>
      </div>
      <Badge variant="secondary" size="xs">Terminado</Badge>
    </div>
  );
};

// ==================== COMPONENTES DE FILTRAGEM ====================

const FilterBar = ({ filter, onFilterChange, search, onSearchChange }) => {
  const filters = [
    { id: 'all', label: 'Todos' },
    { id: 'active', label: 'Ativos' },
    { id: 'upcoming', label: 'Próximos' },
    { id: 'bookmarked', label: 'Guardados' },
  ];

  return (
    <div className="flex flex-col sm:flex-row gap-2">
      <div className="relative flex-1">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
        <input
          type="text"
          placeholder="Pesquisar eventos..."
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
              filter === f.id ? 'bg-primary text-background' : 'bg-surface-highlight text-text-secondary hover:text-text-primary'
            )}
          >
            {f.label}
          </button>
        ))}
      </div>
    </div>
  );
};

const CategoryFilter = ({ selected, onSelect }) => (
  <div className="flex gap-1 overflow-x-auto pb-1">
    <button
      onClick={() => onSelect('all')}
      className={clsx(
        'px-2 py-1 text-xs rounded whitespace-nowrap transition-all flex items-center gap-1',
        selected === 'all' ? 'bg-secondary text-background' : 'bg-surface border border-border text-text-secondary hover:text-text-primary'
      )}
    >
      <Grid size={10} /> Todas
    </button>
    {Object.values(EVENT_CATEGORIES).map(cat => {
      const Icon = cat.icon;
      return (
        <button
          key={cat.id}
          onClick={() => onSelect(cat.id)}
          className={clsx(
            'px-2 py-1 text-xs rounded whitespace-nowrap transition-all flex items-center gap-1',
            selected === cat.id ? `bg-${cat.color} text-background` : 'bg-surface border border-border text-text-secondary hover:text-text-primary'
          )}
        >
          <Icon size={10} /> {cat.label}
        </button>
      );
    })}
  </div>
);

const ViewToggle = ({ view, onViewChange }) => (
  <div className="flex gap-1 bg-surface-highlight rounded p-1">
    <button onClick={() => onViewChange('grid')} className={clsx('p-2 rounded transition-all', view === 'grid' ? 'bg-primary text-background' : 'text-text-secondary hover:text-text-primary')}>
      <Grid size={14} />
    </button>
    <button onClick={() => onViewChange('list')} className={clsx('p-2 rounded transition-all', view === 'list' ? 'bg-primary text-background' : 'text-text-secondary hover:text-text-primary')}>
      <List size={14} />
    </button>
  </div>
);

// ==================== MODAIS ====================

const EventDetailModal = ({ isOpen, onClose, event }) => {
  if (!isOpen || !event) return null;

  const IconComponent = EVENT_ICONS[event.icon] || Radio;
  const category = EVENT_CATEGORIES[event.category?.toUpperCase()] || EVENT_CATEGORIES.SPECIAL;
  const severity = EVENT_SEVERITY[event.severity?.toUpperCase()] || EVENT_SEVERITY.LOW;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={event.name} size="lg">
      <div className="space-y-4">
        {/* Header */}
        <div className={clsx('flex items-center gap-4 p-4 rounded-lg', `bg-${category.color}/10 border border-${category.color}/30`)}>
          <div className={clsx('w-16 h-16 rounded-lg flex items-center justify-center', `bg-${category.color}/20`)}>
            <IconComponent size={32} className={`text-${category.color}`} />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge variant={category.color}>{category.label}</Badge>
              <Badge variant={severity.color}>{severity.label}</Badge>
            </div>
            <p className="text-text-secondary">{event.description}</p>
          </div>
        </div>

        {/* Time Remaining */}
        <div className="bg-surface-highlight p-4 rounded-lg text-center">
          <p className="text-xs text-text-secondary uppercase mb-2">Tempo Restante</p>
          <CountdownTimer targetDate={event.ends_at} color={category.color} />
        </div>

        {/* Effects Grid */}
        {event.effects && (
          <div>
            <h4 className="text-xs text-text-secondary uppercase mb-2">Efeitos</h4>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(event.effects).filter(([_, v]) => v !== 1).map(([key, value]) => {
                const percent = Math.round((value - 1) * 100);
                const isPositive = percent > 0;
                return (
                  <div key={key} className={clsx('p-3 rounded border', isPositive ? 'bg-success/5 border-success/30' : 'bg-error/5 border-error/30')}>
                    <p className="text-xs text-text-secondary capitalize">{key.replace(/_/g, ' ')}</p>
                    <p className={clsx('font-mono text-lg', isPositive ? 'text-success' : 'text-error')}>
                      {isPositive ? '+' : ''}{percent}%
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Affected Areas */}
        {event.affected_areas && event.affected_areas.length > 0 && (
          <div>
            <h4 className="text-xs text-text-secondary uppercase mb-2">Áreas Afetadas</h4>
            <div className="flex flex-wrap gap-2">
              {event.affected_areas.map((area, idx) => (
                <Badge key={idx} variant="secondary">
                  <MapPin size={10} className="mr-1" /> {area}
                </Badge>
              ))}
            </div>
          </div>
        )}

        <Button variant="secondary" fullWidth onClick={onClose}>
          Fechar
        </Button>
      </div>
    </Modal>
  );
};

const NotificationSettingsModal = ({ isOpen, onClose, settings, onSave }) => {
  const [localSettings, setLocalSettings] = useState(settings);

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Notificações de Eventos" size="sm">
      <div className="space-y-4">
        {[
          { key: 'critical', label: 'Eventos Críticos', description: 'Alertas de alta prioridade' },
          { key: 'police', label: 'Operações Policiais', description: 'Quando a polícia entra em ação' },
          { key: 'economy', label: 'Alterações de Mercado', description: 'Mudanças nos preços' },
          { key: 'gang', label: 'Atividade de Gangues', description: 'Movimentos de rivais' },
        ].map(item => (
          <div key={item.key} className="flex items-center justify-between p-3 bg-surface-highlight rounded">
            <div>
              <p className="text-sm text-text-primary">{item.label}</p>
              <p className="text-xs text-text-secondary">{item.description}</p>
            </div>
            <button
              onClick={() => setLocalSettings(s => ({ ...s, [item.key]: !s[item.key] }))}
              className={clsx('w-12 h-6 rounded-full transition-all relative', localSettings[item.key] ? 'bg-primary' : 'bg-border')}
            >
              <div className={clsx('w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all', localSettings[item.key] ? 'left-6' : 'left-0.5')} />
            </button>
          </div>
        ))}
        
        <div className="flex gap-2">
          <Button variant="secondary" onClick={onClose} className="flex-1">Cancelar</Button>
          <Button variant="primary" onClick={() => { onSave(localSettings); onClose(); }} className="flex-1">Guardar</Button>
        </div>
      </div>
    </Modal>
  );
};

// ==================== COMPONENTE PRINCIPAL ====================

export default function EventsPage() {
  const { cityEvents, actionLoading, triggerEvent } = useGame();
  const { api } = useAuth();
  
  // Estados principais
  const [effects, setEffects] = useState(null);
  const [dynamicEvents, setDynamicEvents] = useState(null);
  const [predictions, setPredictions] = useState(null);
  const [impact, setImpact] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [notification, setNotification] = useState(null);
  
  // Estados de UI
  const [activeTab, setActiveTab] = useState('active');
  const [viewMode, setViewMode] = useLocalStorage('events_view', 'grid');
  const [filter, setFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedEventId, setExpandedEventId] = useState(null);
  const [bookmarkedEvents, setBookmarkedEvents] = useLocalStorage('bookmarked_events', []);
  const [wisdomQuote] = useState(getRandomWisdomQuote());
  
  // Estados de modais
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showNotificationSettings, setShowNotificationSettings] = useState(false);
  const [notificationSettings, setNotificationSettings] = useLocalStorage('event_notifications', {
    critical: true, police: true, economy: false, gang: true
  });

  // Fetch data
  const fetchEffects = useCallback(async () => {
    try {
      const response = await api().get('/events/effects');
      setEffects(response.data);
    } catch (err) {
      console.error('Erro ao buscar efeitos:', err);
    }
  }, [api]);

  const fetchDynamicEvents = useCallback(async () => {
    try {
      const response = await api().get('/events/dynamic');
      setDynamicEvents(response.data);
    } catch (err) {
      console.error('Erro ao buscar eventos dinâmicos:', err);
    }
  }, [api]);

  const fetchPredictions = useCallback(async () => {
    try {
      const response = await api().get('/events/predictions');
      setPredictions(response.data);
    } catch (err) {
      console.error('Erro ao buscar previsões:', err);
    }
  }, [api]);

  const fetchImpact = useCallback(async () => {
    try {
      const response = await api().get('/events/impact');
      setImpact(response.data);
    } catch (err) {
      console.error('Erro ao buscar impacto:', err);
    }
  }, [api]);

  const fetchAllData = useCallback(async () => {
    await Promise.all([fetchEffects(), fetchDynamicEvents(), fetchPredictions(), fetchImpact()]);
    setLoading(false);
  }, [fetchEffects, fetchDynamicEvents, fetchPredictions, fetchImpact]);

  useEffect(() => {
    fetchAllData();
    const interval = setInterval(() => {
      fetchEffects();
      fetchDynamicEvents();
    }, EVENT_CONFIG.refreshInterval);
    return () => clearInterval(interval);
  }, [fetchAllData, fetchEffects, fetchDynamicEvents]);

  // Handlers
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchAllData();
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const handleBookmark = (eventId) => {
    setBookmarkedEvents(prev => 
      prev.includes(eventId) ? prev.filter(id => id !== eventId) : [...prev, eventId]
    );
  };

  const handleViewEvent = (event) => {
    setSelectedEvent(event);
    setShowDetailModal(true);
  };

  // Computed values
  const allEvents = useMemo(() => {
    const events = [...(cityEvents || []), ...(dynamicEvents?.events || [])];
    return events.filter((event, idx, self) => 
      idx === self.findIndex(e => e.id === event.id)
    );
  }, [cityEvents, dynamicEvents]);

  const filteredEvents = useMemo(() => {
    return allEvents.filter(event => {
      // Search filter
      const matchesSearch = !searchTerm || 
        event.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.description?.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Category filter
      const matchesCategory = categoryFilter === 'all' || event.category === categoryFilter;
      
      // Status filter
      let matchesFilter = true;
      if (filter === 'active') {
        matchesFilter = new Date(event.ends_at) > new Date();
      } else if (filter === 'bookmarked') {
        matchesFilter = bookmarkedEvents.includes(event.id);
      }
      
      return matchesSearch && matchesCategory && matchesFilter;
    });
  }, [allEvents, searchTerm, categoryFilter, filter, bookmarkedEvents]);

  const stats = useMemo(() => ({
    total: allEvents.length,
    active: allEvents.filter(e => new Date(e.ends_at) > new Date()).length,
    critical: allEvents.filter(e => e.severity === 'critical').length,
    bookmarked: bookmarkedEvents.length,
  }), [allEvents, bookmarkedEvents]);

  const tabs = [
    { id: 'active', label: 'Eventos Ativos', icon: Radio },
    { id: 'effects', label: 'Efeitos', icon: Activity },
    { id: 'predictions', label: 'Previsões', icon: Lightbulb },
    { id: 'history', label: 'Histórico', icon: Clock },
  ];

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
    <div className="space-y-4 pb-20 md:pb-6" data-testid="events-page">
      {/* Notification */}
      {notification && <Alert variant={notification.type}>{notification.message}</Alert>}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-xl md:text-2xl text-text-primary flex items-center gap-3">
            <Radio className="text-primary" />
            Eventos da Cidade
          </h1>
          <p className="text-text-secondary text-sm mt-1">Monitoriza o que acontece no submundo</p>
        </div>
        <div className="flex items-center gap-2">
          <Tooltip content="Notificações">
            <button
              onClick={() => setShowNotificationSettings(true)}
              className="p-2 bg-surface border border-border hover:border-primary rounded transition-all"
            >
              <Bell size={18} className="text-text-secondary" />
            </button>
          </Tooltip>
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

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard icon={Radio} label="Total" value={stats.total} color="primary" />
        <StatCard icon={Activity} label="Ativos" value={stats.active} color="success" />
        <StatCard icon={AlertTriangle} label="Críticos" value={stats.critical} color="error" />
        <StatCard icon={Bookmark} label="Guardados" value={stats.bookmarked} color="gold" />
      </div>

      {/* Tips */}
      <TipsCarousel tips={EVENT_TIPS} />

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={clsx(
              'flex items-center gap-1.5 px-4 py-2 text-sm transition-all whitespace-nowrap',
              activeTab === tab.id ? 'text-primary border-b-2 border-primary' : 'text-text-secondary hover:text-text-primary'
            )}
          >
            <tab.icon size={14} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'active' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-3 items-start md:items-center justify-between">
            <FilterBar filter={filter} onFilterChange={setFilter} search={searchTerm} onSearchChange={setSearchTerm} />
            <ViewToggle view={viewMode} onViewChange={setViewMode} />
          </div>
          <CategoryFilter selected={categoryFilter} onSelect={setCategoryFilter} />

          {/* Events */}
          {filteredEvents.length === 0 ? (
            <Card>
              <EmptyState
                icon={Radio}
                title="Sem Eventos"
                description="Não há eventos ativos de momento. A cidade está calma... por agora."
              />
            </Card>
          ) : viewMode === 'grid' ? (
            <div className="space-y-4">
              {filteredEvents.map(event => (
                <EventCard
                  key={event.id}
                  event={event}
                  isExpanded={expandedEventId === event.id}
                  onToggle={() => setExpandedEventId(expandedEventId === event.id ? null : event.id)}
                  isBookmarked={bookmarkedEvents.includes(event.id)}
                  onBookmark={handleBookmark}
                />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredEvents.map(event => (
                <EventListItem
                  key={event.id}
                  event={event}
                  onClick={handleViewEvent}
                  isBookmarked={bookmarkedEvents.includes(event.id)}
                />
              ))}
            </div>
          )}

          <div className="text-center text-xs text-text-secondary">
            A mostrar {filteredEvents.length} de {allEvents.length} eventos
          </div>
        </div>
      )}

      {activeTab === 'effects' && (
        <div className="grid lg:grid-cols-2 gap-4">
          <EffectsSummaryCard effects={effects} />
          <WeatherWidget weather={dynamicEvents?.weather} />
          <ImpactAnalysisCard impact={impact} />
        </div>
      )}

      {activeTab === 'predictions' && (
        <div className="space-y-4">
          <Card title="Previsões" icon={Lightbulb}>
            {predictions?.upcoming && predictions.upcoming.length > 0 ? (
              <div className="grid md:grid-cols-2 gap-3">
                {predictions.upcoming.map((pred, idx) => (
                  <UpcomingEventCard key={idx} prediction={pred} />
                ))}
              </div>
            ) : (
              <EmptyState
                icon={Lightbulb}
                title="Sem Previsões"
                description="Não há previsões de eventos por agora."
              />
            )}
          </Card>
        </div>
      )}

      {activeTab === 'history' && (
        <Card title="Histórico de Eventos" icon={Clock}>
          {allEvents.filter(e => new Date(e.ends_at) <= new Date()).length > 0 ? (
            <div className="space-y-1 max-h-96 overflow-y-auto">
              {allEvents.filter(e => new Date(e.ends_at) <= new Date()).slice(0, 20).map(event => (
                <EventHistoryItem key={event.id} event={event} />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Clock}
              title="Sem Histórico"
              description="O histórico de eventos aparecerá aqui."
            />
          )}
        </Card>
      )}

      {/* Modals */}
      <EventDetailModal
        isOpen={showDetailModal}
        onClose={() => { setShowDetailModal(false); setSelectedEvent(null); }}
        event={selectedEvent}
      />

      <NotificationSettingsModal
        isOpen={showNotificationSettings}
        onClose={() => setShowNotificationSettings(false)}
        settings={notificationSettings}
        onSave={setNotificationSettings}
      />
    </div>
  );
}

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useGame } from '../contexts/GameContext';
import { Button, Badge, Modal, Alert, Input } from '../components/UI';
import { Card, ProgressBar } from '../components/ProgressBar';
import { 
  Target, Users, Car, Building2, Shield, Zap, Star,
  ChevronRight, TrendingUp, TrendingDown, DollarSign, Flame,
  Award, Clock, AlertTriangle, MapPin, Briefcase, Factory, Gift,
  Lock, Unlock, Timer, Activity, BarChart2, Eye, Skull, Heart,
  Calendar, Bell, MessageSquare, Settings, RefreshCw, Play,
  Pause, Volume2, VolumeX, Sun, Moon, Sparkles, Trophy,
  Crosshair, Bomb, Swords, Crown, Coins, Wallet, CreditCard,
  PiggyBank, TrendingDown as TrendDownIcon, ArrowUpRight,
  ArrowDownRight, Percent, CircleDollarSign, Banknote, Receipt,
  FileText, HelpCircle, Info, CheckCircle, XCircle, AlertCircle,
  Loader2, MoreHorizontal, ChevronDown, ChevronUp, Filter,
  Search, Grid, List, LayoutGrid, Layers, Box, Package,
  ShoppingCart, Store, Tag, Hash, AtSign, Link, ExternalLink,
  Copy, Share2, Download, Upload, Save, Trash2, Edit, Plus,
  Minus, X, Check, ArrowLeft, ArrowRight, RotateCcw, RotateCw,
  Maximize, Minimize, Move, Grip, Menu, MoreVertical, Dot,
  Circle, Square, Triangle, Hexagon, Pentagon, Octagon,
  Diamond, Star as StarIcon, Bookmark, Flag, Pin, Navigation,
  Compass, Map as MapIcon, Globe, Home, User, UserPlus, UserMinus,
  UserCheck, UserX, Users2, UsersIcon, Group, Fingerprint,
  Key, ShieldCheck, ShieldOff, ShieldAlert, ShieldQuestion,
  Lock as LockIcon, Unlock as UnlockIcon, Eye as EyeIcon, EyeOff,
  Radio, Wifi, WifiOff, Bluetooth, BluetoothOff, Signal,
  SignalHigh, SignalLow, SignalMedium, SignalZero, Battery,
  BatteryCharging, BatteryFull, BatteryLow, BatteryMedium,
  BatteryWarning, Power, PowerOff, Cpu, HardDrive, Server,
  Database, Cloud, CloudOff, CloudRain, CloudSnow, CloudSun,
  Thermometer, Droplet, Wind, Umbrella, Snowflake, Flame as FlameIcon,
  Zap as ZapIcon, Zap as Lightning, Bolt, Sparkle, Wand, Wand as Magic,
  Rocket, Plane, Send, Mail, Inbox, Archive, Trash, FolderOpen,
  Folder, File, Files, FileCode, FileJson, FilePlus, FileMinus,
  FileCheck, FileX, FileSearch, FilePenLine as FileEdit, FileImage, FileVideo,
  FileAudio, FileArchive, Code, Terminal, Command, Hash as HashIcon,
  Binary, Braces, Brackets, Slash, Slash as Backslash, Asterisk, AtSign as At,
  Ampersand, Percent as PercentIcon, DollarSign as Dollar, Euro, Pound, Yen,
  Bitcoin, Coins as Ethereum, Currency, Landmark, Landmark as Bank, Vault, Vault as Safe,
  Gem, Crown as CrownIcon, Medal, Badge as BadgeIcon, Award as AwardIcon,
  Gift as GiftIcon, PartyPopper, PartyPopper as Confetti, Cake, Balloon, Sparkles as Fireworks,
  Music, Music as MusicNote, Headphones, Speaker, Volume, VolumeX as VolumeXIcon,
  Mic, MicOff, Video, VideoOff, Camera, CameraOff, Image,
  ImageOff, ImagePlus, ImageMinus, Palette, Brush, Pen, Pencil,
  Eraser, Highlighter, Type, Bold, Italic, Underline, Strikethrough,
  AlignLeft, AlignCenter, AlignRight, AlignJustify, Indent,
  Outdent, List as ListIcon, ListOrdered, ListChecks, ListTodo,
  CheckSquare, Square as SquareIcon, Circle as CircleIcon
} from 'lucide-react';
import clsx from 'clsx';
import { LevelSystem, HeatSystem } from '../utils/gameLogic';

// ==================== CONSTANTES E CONFIGURAÇÕES ====================

const DASHBOARD_CONFIG = {
  refreshInterval: 30000,
  animationDuration: 300,
  maxNotifications: 5,
  chartDataPoints: 24,
  achievementCheckInterval: 60000,
};

const QUICK_ACTION_CATEGORIES = {
  CRIME: 'crime',
  BUSINESS: 'business',
  SOCIAL: 'social',
  MANAGEMENT: 'management',
};

const STAT_TRENDS = {
  UP: 'up',
  DOWN: 'down',
  STABLE: 'stable',
};

const NOTIFICATION_TYPES = {
  SUCCESS: 'success',
  WARNING: 'warning',
  ERROR: 'error',
  INFO: 'info',
};

const TUTORIAL_STEPS = [
  {
    id: 'welcome',
    title: 'Bem-vindo ao Submundo!',
    description: 'Este é o teu centro de operações. Aqui podes ver todas as tuas estatísticas e aceder rapidamente a qualquer funcionalidade.',
    target: 'dashboard-header',
  },
  {
    id: 'stats',
    title: 'As Tuas Estatísticas',
    description: 'Monitoriza o teu dinheiro, reputação e heat. O heat alto atrai atenção policial!',
    target: 'stats-grid',
  },
  {
    id: 'actions',
    title: 'Acesso Rápido',
    description: 'Usa estes atalhos para navegar rapidamente entre missões, gangue, banco e muito mais.',
    target: 'quick-actions',
  },
  {
    id: 'daily',
    title: 'Recompensas Diárias',
    description: 'Não te esqueças de reclamar a tua recompensa diária todos os dias!',
    target: 'daily-reward',
  },
];

const ACHIEVEMENT_CATEGORIES = {
  WEALTH: { id: 'wealth', label: 'Riqueza', icon: Coins, color: 'gold' },
  CRIME: { id: 'crime', label: 'Crime', icon: Skull, color: 'error' },
  SOCIAL: { id: 'social', label: 'Social', icon: Users, color: 'primary' },
  COMBAT: { id: 'combat', label: 'Combate', icon: Swords, color: 'error' },
  BUSINESS: { id: 'business', label: 'Negócios', icon: Briefcase, color: 'success' },
};

const DASHBOARD_ACHIEVEMENTS = [
  { id: 'first_login', name: 'Primeiro Passo', description: 'Entra no jogo pela primeira vez', xp: 50, category: 'social' },
  { id: 'rich_1k', name: 'Primeiros Milhares', description: 'Acumula €1,000', xp: 100, category: 'wealth' },
  { id: 'rich_10k', name: 'Dinheiro a Sério', description: 'Acumula €10,000', xp: 250, category: 'wealth' },
  { id: 'rich_100k', name: 'Magnata', description: 'Acumula €100,000', xp: 500, category: 'wealth' },
  { id: 'heat_max', name: 'Procurado', description: 'Atinge 100 de heat', xp: 150, category: 'crime' },
  { id: 'level_10', name: 'Veterano', description: 'Atinge o nível 10', xp: 200, category: 'social' },
  { id: 'level_25', name: 'Lenda', description: 'Atinge o nível 25', xp: 500, category: 'social' },
  { id: 'daily_streak_7', name: 'Dedicado', description: '7 dias consecutivos de login', xp: 300, category: 'social' },
  { id: 'daily_streak_30', name: 'Viciado', description: '30 dias consecutivos de login', xp: 1000, category: 'social' },
];

const DASHBOARD_TIPS = [
  'Mantém o teu heat baixo para evitar problemas com a polícia.',
  'Deposita dinheiro no banco para o manter seguro.',
  'Junta-te a uma gangue para ter acesso a mais oportunidades.',
  'Completa missões diárias para ganhar XP extra.',
  'Investe em propriedades para aumentar a tua capacidade.',
  'Verifica o mercado negro para encontrar bons negócios.',
  'Melhora as tuas relações com NPCs para obter descontos.',
  'Participa em guerras de gangues para conquistar territórios.',
  'Fabrica itens nos teus negócios para vender no mercado.',
  'Mantém os teus veículos em boas condições.',
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

function useCountdown(targetDate) {
  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  function calculateTimeLeft() {
    const difference = new Date(targetDate) - new Date();
    if (difference <= 0) return { hours: 0, minutes: 0, seconds: 0, total: 0 };
    
    return {
      hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((difference / 1000 / 60) % 60),
      seconds: Math.floor((difference / 1000) % 60),
      total: difference,
    };
  }

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  return timeLeft;
}

function useAnimatedNumber(value, duration = 1000) {
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

const PulsingDot = ({ color = 'primary', size = 'md' }) => {
  const sizes = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4',
  };
  
  return (
    <span className="relative flex">
      <span className={clsx(
        'animate-ping absolute inline-flex rounded-full opacity-75',
        sizes[size],
        `bg-${color}`
      )} />
      <span className={clsx(
        'relative inline-flex rounded-full',
        sizes[size],
        `bg-${color}`
      )} />
    </span>
  );
};

const StatTrendIndicator = ({ trend, value }) => {
  if (!trend || trend === STAT_TRENDS.STABLE) return null;
  
  const isUp = trend === STAT_TRENDS.UP;
  const Icon = isUp ? TrendingUp : TrendingDown;
  const color = isUp ? 'text-success' : 'text-error';
  
  return (
    <div className={clsx('flex items-center gap-0.5 text-xs', color)}>
      <Icon size={12} />
      <span>{value > 0 ? '+' : ''}{value}%</span>
    </div>
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

const NotificationBadge = ({ count }) => {
  if (!count || count <= 0) return null;
  
  return (
    <span className="absolute -top-1 -right-1 w-5 h-5 bg-error text-white text-xs font-bold rounded-full flex items-center justify-center">
      {count > 9 ? '9+' : count}
    </span>
  );
};

// ==================== COMPONENTES DE SECÇÃO ====================

const DashboardHeader = ({ user, playerLevel, heatStatus, onSettingsClick, onNotificationsClick, notificationCount }) => (
  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2" data-testid="dashboard-header">
    <div>
      <h1 className="font-heading text-xl md:text-2xl text-text-primary mb-1">
        Bem-vindo, <span className="text-primary">{user?.username}</span>
      </h1>
      <div className="flex items-center gap-1.5 md:gap-2 flex-wrap">
        <Badge variant={playerLevel.color} size="lg">
          {playerLevel.title} • Nível {playerLevel.level}
        </Badge>
        <Badge variant={heatStatus.color} size="md">
          <Flame size={14} className="mr-1" />
          {heatStatus.status}
        </Badge>
        <Badge variant="secondary" size="sm">
          <Clock size={12} className="mr-1" />
          {new Date().toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}
        </Badge>
      </div>
    </div>

    <div className="flex items-center gap-2">
      <Tooltip content="Notificações">
        <button
          onClick={onNotificationsClick}
          className="relative p-2 bg-surface border border-border hover:border-primary rounded transition-all"
        >
          <Bell size={18} className="text-text-secondary" />
          <NotificationBadge count={notificationCount} />
        </button>
      </Tooltip>
      <Tooltip content="Definições">
        <button
          onClick={onSettingsClick}
          className="p-2 bg-surface border border-border hover:border-primary rounded transition-all"
        >
          <Settings size={18} className="text-text-secondary" />
        </button>
      </Tooltip>
    </div>
  </div>
);

const StatsGrid = ({ stats, isLoading }) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2" data-testid="stats-grid">
        {[1, 2, 3, 4].map(i => (
          <Card key={i}>
            <Skeleton className="h-20" />
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2" data-testid="stats-grid">
      {stats.map((stat, i) => (
        <Card key={i} className="relative overflow-hidden group hover:border-primary/50 transition-all">
          <div className={`absolute top-0 left-0 w-1 h-full bg-${stat.color}`} />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-text-secondary uppercase mb-0.5">{stat.label}</p>
              <p className="text-base md:text-lg font-heading text-text-primary">
                {stat.animated ? (
                  <AnimatedCounter value={stat.rawValue} prefix={stat.prefix} suffix={stat.suffix} />
                ) : stat.value}
              </p>
              {stat.status && (
                <p className={`text-xs text-${stat.color} mt-0.5`}>{stat.status}</p>
              )}
              {stat.trend && (
                <StatTrendIndicator trend={stat.trend} value={stat.trendValue} />
              )}
            </div>
            <div className="flex flex-col items-end gap-1">
              <stat.icon className={`w-5 h-5 md:w-6 md:h-6 text-${stat.color} opacity-50 group-hover:scale-110 transition-transform`} />
              {stat.chartData && (
                <MiniChart data={stat.chartData} color={stat.color} height={24} />
              )}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};

const LevelProgressCard = ({ playerLevel, experience, onViewDetails }) => {
  const progressPercent = (experience / playerLevel.nextLevelXP) * 100;
  
  return (
    <Card title="Progresso de Nível" icon={Star} className="relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2" />
      
      <div className="flex items-center gap-4 mb-3">
        <div className="relative">
          <CircularProgress value={experience} max={playerLevel.nextLevelXP} size={70} color="primary" />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-lg font-heading text-primary">{playerLevel.level}</span>
          </div>
        </div>
        <div className="flex-1">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-text-secondary">
              Nível {playerLevel.level} → {playerLevel.level + 1}
            </span>
            <span className="text-primary font-mono">
              {Math.round(progressPercent)}%
            </span>
          </div>
          <ProgressBar
            value={experience}
            max={playerLevel.nextLevelXP}
            color="primary"
            showLabel={false}
            height="h-2"
          />
          <p className="text-xs text-text-secondary mt-1">
            {experience.toLocaleString()} / {playerLevel.nextLevelXP.toLocaleString()} XP
          </p>
        </div>
      </div>
      
      <div className="grid grid-cols-3 gap-2 text-center text-xs">
        <div className="p-2 bg-surface-highlight rounded">
          <p className="text-text-secondary">Falta</p>
          <p className="text-primary font-mono">{(playerLevel.nextLevelXP - experience).toLocaleString()} XP</p>
        </div>
        <div className="p-2 bg-surface-highlight rounded">
          <p className="text-text-secondary">Título</p>
          <p className="text-gold font-heading">{playerLevel.title}</p>
        </div>
        <div className="p-2 bg-surface-highlight rounded">
          <p className="text-text-secondary">Próximo</p>
          <p className="text-success font-heading">{playerLevel.nextTitle || 'Max'}</p>
        </div>
      </div>
      
      {onViewDetails && (
        <Button
          variant="ghost"
          size="sm"
          className="w-full mt-3"
          onClick={onViewDetails}
          icon={ChevronRight}
        >
          Ver Detalhes
        </Button>
      )}
    </Card>
  );
};

const QuickActionsGrid = ({ actions, onActionClick, playerLevel }) => {
  const [activeCategory, setActiveCategory] = useState('all');
  
  const categories = [
    { id: 'all', label: 'Todos' },
    { id: QUICK_ACTION_CATEGORIES.CRIME, label: 'Crime' },
    { id: QUICK_ACTION_CATEGORIES.BUSINESS, label: 'Negócios' },
    { id: QUICK_ACTION_CATEGORIES.SOCIAL, label: 'Social' },
    { id: QUICK_ACTION_CATEGORIES.MANAGEMENT, label: 'Gestão' },
  ];
  
  const filteredActions = activeCategory === 'all' 
    ? actions 
    : actions.filter(a => a.category === activeCategory);

  return (
    <div data-testid="quick-actions">
      <div className="flex items-center justify-between mb-2">
        <h2 className="font-heading text-base md:text-lg text-text-primary flex items-center gap-1.5">
          <Zap className="w-4 h-4 text-primary" />
          Acesso Rápido
        </h2>
        <div className="flex gap-1">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={clsx(
                'px-2 py-1 text-xs rounded transition-all',
                activeCategory === cat.id
                  ? 'bg-primary text-background'
                  : 'bg-surface-highlight text-text-secondary hover:text-text-primary'
              )}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-1.5 md:gap-2">
        {filteredActions.map((action, i) => {
          const isLocked = action.minLevel && playerLevel.level < action.minLevel;
          
          return (
            <Tooltip
              key={i}
              content={isLocked ? `Desbloqueia no nível ${action.minLevel}` : action.description}
              position="bottom"
            >
              <button
                onClick={() => !isLocked && onActionClick(action.path)}
                disabled={isLocked}
                className={clsx(
                  'group bg-surface border p-2 md:p-2.5 transition-all relative overflow-hidden',
                  isLocked
                    ? 'border-border opacity-50 cursor-not-allowed'
                    : 'border-border hover:border-primary hover:shadow-neon'
                )}
              >
                {isLocked && (
                  <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                    <Lock size={16} className="text-text-secondary" />
                  </div>
                )}
                <div className={`absolute top-0 right-0 w-8 h-8 bg-${action.color}/10 rounded-bl-full`} />
                <action.icon className={`w-5 h-5 md:w-6 md:h-6 text-${action.color} mb-1 mx-auto group-hover:scale-110 transition-transform`} />
                <p className="font-heading text-text-primary text-xs mb-0.5">{action.label}</p>
                <p className="text-text-secondary text-xs hidden md:block leading-tight">{action.description}</p>
                {action.badge && (
                  <Badge variant={action.badge.variant} size="xs" className="absolute top-1 right-1">
                    {action.badge.text}
                  </Badge>
                )}
              </button>
            </Tooltip>
          );
        })}
      </div>
    </div>
  );
};

const DailyRewardSection = ({ dailyRewardClaimed, onClaimDaily, isLoading, nextRewardTime }) => {
  const timeLeft = useCountdown(nextRewardTime);
  
  if (dailyRewardClaimed && timeLeft.total > 0) {
    return (
      <Card className="border-gold/30 bg-gradient-to-r from-gold/5 to-transparent">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gold/20 border border-gold rounded flex items-center justify-center">
              <Gift size={24} className="text-gold" />
            </div>
            <div>
              <p className="font-heading text-text-primary">Recompensa Reclamada!</p>
              <p className="text-xs text-text-secondary">Próxima recompensa em:</p>
            </div>
          </div>
          <div className="text-right">
            <div className="flex gap-2">
              <div className="text-center">
                <p className="text-lg font-mono text-gold">{String(timeLeft.hours).padStart(2, '0')}</p>
                <p className="text-xs text-text-secondary">horas</p>
              </div>
              <span className="text-gold text-lg">:</span>
              <div className="text-center">
                <p className="text-lg font-mono text-gold">{String(timeLeft.minutes).padStart(2, '0')}</p>
                <p className="text-xs text-text-secondary">min</p>
              </div>
              <span className="text-gold text-lg">:</span>
              <div className="text-center">
                <p className="text-lg font-mono text-gold">{String(timeLeft.seconds).padStart(2, '0')}</p>
                <p className="text-xs text-text-secondary">seg</p>
              </div>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  if (!dailyRewardClaimed) {
    return (
      <Card className="border-primary bg-gradient-to-r from-primary/10 to-transparent animate-pulse-slow" data-testid="daily-reward">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary/20 border border-primary rounded flex items-center justify-center animate-bounce">
              <Gift size={24} className="text-primary" />
            </div>
            <div>
              <p className="font-heading text-text-primary">Recompensa Diária Disponível!</p>
              <p className="text-xs text-text-secondary">Reclama agora para receber bónus</p>
            </div>
          </div>
          <Button
            variant="primary"
            size="lg"
            icon={Gift}
            glow
            onClick={onClaimDaily}
            loading={isLoading}
          >
            Reclamar
          </Button>
        </div>
      </Card>
    );
  }

  return null;
};

const CooldownsCard = ({ cooldowns }) => {
  if (!cooldowns || Object.keys(cooldowns).length === 0) return null;

  return (
    <Card title="Cooldowns Ativos" icon={Timer}>
      <div className="space-y-1.5">
        {Object.entries(cooldowns).map(([action, data]) => {
          const progress = data.remaining_seconds ? (1 - data.remaining_seconds / data.total_seconds) * 100 : 0;
          
          return (
            <div key={action} className="p-2 bg-surface-highlight border border-border rounded">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <Clock size={14} className="text-warning" />
                  <span className="text-xs text-text-primary capitalize">{action.replace(/_/g, ' ')}</span>
                </div>
                <span className="text-xs text-warning font-mono">{data.formatted_time}</span>
              </div>
              <div className="h-1 bg-background rounded-full overflow-hidden">
                <div 
                  className="h-full bg-warning transition-all duration-1000"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};

const HeatWarningCard = ({ heat }) => {
  if (heat <= 70) return null;

  const severity = heat > 90 ? 'critical' : heat > 80 ? 'high' : 'medium';
  const colors = {
    critical: { bg: 'bg-error/20', border: 'border-error', text: 'text-error' },
    high: { bg: 'bg-warning/20', border: 'border-warning', text: 'text-warning' },
    medium: { bg: 'bg-warning/10', border: 'border-warning/50', text: 'text-warning' },
  };
  const config = colors[severity];

  return (
    <Card className={clsx(config.bg, config.border)}>
      <Alert variant="error">
        <div className="flex items-start gap-3">
          <div className="relative">
            <AlertTriangle className={clsx('w-6 h-6 flex-shrink-0', config.text)} />
            {severity === 'critical' && <PulsingDot color="error" size="sm" />}
          </div>
          <div className="flex-1">
            <p className={clsx('font-heading text-sm mb-1', config.text)}>
              {severity === 'critical' ? 'Heat CRÍTICO!' : 'Heat Alto!'}
            </p>
            <p className="text-xs text-text-secondary">
              {severity === 'critical'
                ? 'A polícia está em perseguição ativa! Esconde-te imediatamente!'
                : 'O teu nível de Heat está perigosamente alto. Evita crimes por algum tempo ou lava dinheiro para reduzir.'
              }
            </p>
            <div className="mt-2 flex gap-2">
              <Badge variant="error">Heat: {heat}%</Badge>
              {severity === 'critical' && (
                <Badge variant="warning" className="animate-pulse">
                  PROCURADO
                </Badge>
              )}
            </div>
          </div>
        </div>
      </Alert>
    </Card>
  );
};

const UnlocksCard = ({ unlocks, playerLevel }) => {
  const nextUnlocks = unlocks?.next || playerLevel.nextUnlocks || [];
  
  if (!nextUnlocks || nextUnlocks.length === 0) return null;

  return (
    <Card title="Próximos Desbloqueios" icon={Unlock}>
      <div className="space-y-1.5">
        {nextUnlocks.slice(0, 4).map((unlock, i) => {
          const levelsAway = unlock.level - playerLevel.level;
          const progress = Math.max(0, 100 - (levelsAway / 10) * 100);
          
          return (
            <div key={i} className="flex items-center justify-between p-1.5 bg-surface-highlight border border-border rounded">
              <div className="flex items-center gap-2">
                <Lock size={14} className="text-gold" />
                <span className="text-xs text-text-primary">{unlock.feature}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-16 h-1.5 bg-background rounded-full overflow-hidden">
                  <div className="h-full bg-gold" style={{ width: `${progress}%` }} />
                </div>
                <Badge variant="gold" size="xs">Nível {unlock.level}</Badge>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};

const ActivityFeed = ({ activities }) => {
  if (!activities || activities.length === 0) {
    return (
      <Card title="Atividade Recente" icon={Activity}>
        <EmptyState
          icon={Activity}
          title="Sem Atividade"
          description="As tuas ações recentes aparecerão aqui."
        />
      </Card>
    );
  }

  const getActivityIcon = (type) => {
    const icons = {
      mission_complete: Target,
      money_earned: DollarSign,
      level_up: Star,
      achievement: Trophy,
      gang_action: Users,
      property_bought: Building2,
      vehicle_bought: Car,
      crime_committed: Skull,
    };
    return icons[type] || Activity;
  };

  const getActivityColor = (type) => {
    const colors = {
      mission_complete: 'success',
      money_earned: 'gold',
      level_up: 'primary',
      achievement: 'gold',
      gang_action: 'error',
      property_bought: 'success',
      vehicle_bought: 'primary',
      crime_committed: 'error',
    };
    return colors[type] || 'secondary';
  };

  return (
    <Card title="Atividade Recente" icon={Activity}>
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {activities.map((activity, i) => {
          const Icon = getActivityIcon(activity.type);
          const color = getActivityColor(activity.type);
          
          return (
            <div
              key={i}
              className="flex items-center gap-2 p-2 bg-surface-highlight border border-border rounded hover:border-primary/30 transition-all"
            >
              <div className={`w-8 h-8 bg-${color}/20 border border-${color}/30 rounded flex items-center justify-center flex-shrink-0`}>
                <Icon size={14} className={`text-${color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-text-primary truncate">{activity.message}</p>
                <p className="text-xs text-text-secondary">{activity.time}</p>
              </div>
              {activity.reward && (
                <Badge variant={color} size="xs">{activity.reward}</Badge>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
};

const TipsCard = ({ tips }) => {
  const [currentTip, setCurrentTip] = useState(0);
  
  useInterval(() => {
    setCurrentTip(prev => (prev + 1) % tips.length);
  }, 10000);

  return (
    <Card className="border-primary/30">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 bg-primary/20 border border-primary/30 rounded flex items-center justify-center flex-shrink-0">
          <Info size={18} className="text-primary" />
        </div>
        <div className="flex-1">
          <p className="text-xs text-primary uppercase mb-1">Dica do Dia</p>
          <p className="text-sm text-text-secondary transition-all duration-300">
            {tips[currentTip]}
          </p>
        </div>
        <div className="flex gap-1">
          {tips.slice(0, 5).map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentTip(i)}
              className={clsx(
                'w-2 h-2 rounded-full transition-all',
                currentTip === i ? 'bg-primary' : 'bg-border hover:bg-primary/50'
              )}
            />
          ))}
        </div>
      </div>
    </Card>
  );
};

const MiniAchievementsCard = ({ achievements, playerData, onViewAll }) => {
  const checkAchievement = (achievement) => {
    switch (achievement.id) {
      case 'rich_1k': return (playerData.cleanMoney + playerData.dirtyMoney) >= 1000;
      case 'rich_10k': return (playerData.cleanMoney + playerData.dirtyMoney) >= 10000;
      case 'rich_100k': return (playerData.cleanMoney + playerData.dirtyMoney) >= 100000;
      case 'heat_max': return playerData.heat >= 100;
      case 'level_10': return playerData.level >= 10;
      case 'level_25': return playerData.level >= 25;
      case 'first_login': return true;
      default: return false;
    }
  };

  const unlockedAchievements = achievements.filter(a => checkAchievement(a));
  const lockedAchievements = achievements.filter(a => !checkAchievement(a));

  return (
    <Card title="Conquistas" icon={Trophy}>
      <div className="space-y-2">
        {unlockedAchievements.slice(0, 3).map(achievement => {
          const category = ACHIEVEMENT_CATEGORIES[achievement.category.toUpperCase()];
          const Icon = category?.icon || Trophy;
          
          return (
            <div key={achievement.id} className="flex items-center gap-2 p-2 bg-gold/10 border border-gold/30 rounded">
              <div className="w-8 h-8 bg-gold/20 rounded flex items-center justify-center">
                <Icon size={14} className="text-gold" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-gold font-heading">{achievement.name}</p>
                <p className="text-xs text-text-secondary">{achievement.description}</p>
              </div>
              <Badge variant="gold" size="xs">+{achievement.xp} XP</Badge>
            </div>
          );
        })}
        
        {lockedAchievements.length > 0 && (
          <div className="flex items-center gap-2 p-2 bg-surface-highlight border border-border rounded opacity-50">
            <div className="w-8 h-8 bg-border rounded flex items-center justify-center">
              <Lock size={14} className="text-text-secondary" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-text-secondary">{lockedAchievements[0].name}</p>
              <p className="text-xs text-text-secondary">{lockedAchievements[0].description}</p>
            </div>
          </div>
        )}
      </div>
      
      <Button
        variant="ghost"
        size="sm"
        className="w-full mt-2"
        onClick={onViewAll}
        icon={ChevronRight}
      >
        Ver Todas ({achievements.length})
      </Button>
    </Card>
  );
};

const WeatherWidget = () => {
  const [weather, setWeather] = useState({ condition: 'clear', temp: 22 });
  
  const conditions = {
    clear: { icon: Sun, label: 'Limpo', effect: 'Condições normais' },
    rain: { icon: CloudRain, label: 'Chuva', effect: 'Menos polícia nas ruas' },
    storm: { icon: Zap, label: 'Tempestade', effect: 'Crimes mais fáceis' },
    fog: { icon: Cloud, label: 'Nevoeiro', effect: 'Stealth melhorado' },
  };
  
  const current = conditions[weather.condition] || conditions.clear;
  const Icon = current.icon;

  return (
    <div className="flex items-center gap-2 p-2 bg-surface-highlight border border-border rounded">
      <Icon size={18} className="text-primary" />
      <div className="flex-1">
        <p className="text-xs text-text-primary">{current.label} • {weather.temp}°C</p>
        <p className="text-xs text-text-secondary">{current.effect}</p>
      </div>
    </div>
  );
};

const ServerStatusWidget = () => {
  const [status, setStatus] = useState({ online: true, players: 42, ping: 23 });

  return (
    <div className="flex items-center gap-3 p-2 bg-surface-highlight border border-border rounded">
      <div className="flex items-center gap-1">
        <PulsingDot color={status.online ? 'success' : 'error'} size="sm" />
        <span className="text-xs text-text-secondary">Server</span>
      </div>
      <div className="flex items-center gap-2 text-xs">
        <span className="text-text-secondary">
          <Users size={12} className="inline mr-1" />
          {status.players} online
        </span>
        <span className="text-text-secondary">
          <Signal size={12} className="inline mr-1" />
          {status.ping}ms
        </span>
      </div>
    </div>
  );
};

// ==================== MODAIS ====================

const DailyRewardModal = ({ isOpen, onClose, reward }) => (
  <Modal isOpen={isOpen} onClose={onClose} title="Recompensa Diária!" size="sm">
    <div className="text-center space-y-4">
      <div className="w-24 h-24 bg-primary/20 border-2 border-primary mx-auto flex items-center justify-center rounded-full animate-bounce">
        <Gift className="w-12 h-12 text-primary" />
      </div>
      <div>
        <p className="text-text-primary font-heading text-xl mb-2">Parabéns!</p>
        <p className="text-text-secondary">
          Recebeste a tua recompensa diária:
        </p>
        {reward && (
          <div className="mt-3 space-y-2">
            {reward.money && (
              <Badge variant="success" size="lg">+€{reward.money.toLocaleString()}</Badge>
            )}
            {reward.xp && (
              <Badge variant="primary" size="lg">+{reward.xp} XP</Badge>
            )}
            {reward.items && reward.items.map((item, i) => (
              <Badge key={i} variant="gold" size="lg">{item}</Badge>
            ))}
          </div>
        )}
        <p className="text-text-secondary text-sm mt-4">
          Volta amanhã para mais recompensas!
        </p>
      </div>
      <Button variant="primary" fullWidth onClick={onClose}>
        Continuar
      </Button>
    </div>
  </Modal>
);

const TutorialModal = ({ isOpen, onClose, step, onNext, onPrev, totalSteps }) => {
  const currentStep = TUTORIAL_STEPS[step] || TUTORIAL_STEPS[0];
  
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Tutorial" size="md">
      <div className="space-y-4">
        <div className="bg-primary/10 border border-primary/30 p-4 rounded">
          <h3 className="font-heading text-lg text-primary mb-2">{currentStep.title}</h3>
          <p className="text-text-secondary">{currentStep.description}</p>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex gap-1">
            {TUTORIAL_STEPS.map((_, i) => (
              <div
                key={i}
                className={clsx(
                  'w-2 h-2 rounded-full transition-all',
                  i === step ? 'bg-primary' : 'bg-border'
                )}
              />
            ))}
          </div>
          <p className="text-xs text-text-secondary">{step + 1} / {totalSteps}</p>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="secondary"
            onClick={onPrev}
            disabled={step === 0}
            className="flex-1"
          >
            Anterior
          </Button>
          {step < totalSteps - 1 ? (
            <Button variant="primary" onClick={onNext} className="flex-1">
              Próximo
            </Button>
          ) : (
            <Button variant="primary" onClick={onClose} className="flex-1">
              Concluir
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
};

const SettingsModal = ({ isOpen, onClose, settings, onSave }) => {
  const [localSettings, setLocalSettings] = useState(settings);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Definições" size="md">
      <div className="space-y-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-surface-highlight rounded">
            <div>
              <p className="text-sm text-text-primary">Notificações</p>
              <p className="text-xs text-text-secondary">Receber alertas no jogo</p>
            </div>
            <button
              onClick={() => setLocalSettings(s => ({ ...s, notifications: !s.notifications }))}
              className={clsx(
                'w-12 h-6 rounded-full transition-all relative',
                localSettings.notifications ? 'bg-primary' : 'bg-border'
              )}
            >
              <div className={clsx(
                'w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all',
                localSettings.notifications ? 'left-6' : 'left-0.5'
              )} />
            </button>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-surface-highlight rounded">
            <div>
              <p className="text-sm text-text-primary">Sons</p>
              <p className="text-xs text-text-secondary">Efeitos sonoros</p>
            </div>
            <button
              onClick={() => setLocalSettings(s => ({ ...s, sounds: !s.sounds }))}
              className={clsx(
                'w-12 h-6 rounded-full transition-all relative',
                localSettings.sounds ? 'bg-primary' : 'bg-border'
              )}
            >
              <div className={clsx(
                'w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all',
                localSettings.sounds ? 'left-6' : 'left-0.5'
              )} />
            </button>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-surface-highlight rounded">
            <div>
              <p className="text-sm text-text-primary">Auto-refresh</p>
              <p className="text-xs text-text-secondary">Atualizar dados automaticamente</p>
            </div>
            <button
              onClick={() => setLocalSettings(s => ({ ...s, autoRefresh: !s.autoRefresh }))}
              className={clsx(
                'w-12 h-6 rounded-full transition-all relative',
                localSettings.autoRefresh ? 'bg-primary' : 'bg-border'
              )}
            >
              <div className={clsx(
                'w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all',
                localSettings.autoRefresh ? 'left-6' : 'left-0.5'
              )} />
            </button>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button variant="secondary" onClick={onClose} className="flex-1">
            Cancelar
          </Button>
          <Button variant="primary" onClick={() => { onSave(localSettings); onClose(); }} className="flex-1">
            Guardar
          </Button>
        </div>
      </div>
    </Modal>
  );
};

const NotificationsModal = ({ isOpen, onClose, notifications, onClear }) => (
  <Modal isOpen={isOpen} onClose={onClose} title="Notificações" size="md">
    <div className="space-y-2 max-h-96 overflow-y-auto">
      {notifications.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="Sem Notificações"
          description="Não tens notificações por ler."
        />
      ) : (
        notifications.map((notif, i) => (
          <div key={i} className={clsx(
            'p-3 border rounded',
            notif.read ? 'bg-surface-highlight border-border' : 'bg-primary/5 border-primary/30'
          )}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-text-primary">{notif.title}</p>
                <p className="text-xs text-text-secondary">{notif.message}</p>
              </div>
              <span className="text-xs text-text-secondary">{notif.time}</span>
            </div>
          </div>
        ))
      )}
    </div>
    {notifications.length > 0 && (
      <Button variant="ghost" onClick={onClear} className="w-full mt-3">
        Limpar Todas
      </Button>
    )}
  </Modal>
);

// ==================== COMPONENTE PRINCIPAL ====================

export default function HomePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { gameState, fetchFullGameState, claimDailyReward } = useGame();
  
  // Estados principais
  const [showRewardModal, setShowRewardModal] = useState(false);
  const [rewardClaimed, setRewardClaimed] = useState(false);
  const [lastReward, setLastReward] = useState(null);
  const [isClaimingReward, setIsClaimingReward] = useState(false);
  
  // Estados de UI
  const [showTutorial, setShowTutorial] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Estados de dados
  const [settings, setSettings] = useLocalStorage('dashboard_settings', {
    notifications: true,
    sounds: true,
    autoRefresh: true,
  });
  const [notifications, setNotifications] = useState([]);
  const [activities, setActivities] = useState([]);
  const [hasSeenTutorial, setHasSeenTutorial] = useLocalStorage('has_seen_tutorial', false);

  // Efeitos
  useEffect(() => {
    fetchFullGameState();
    
    if (!hasSeenTutorial) {
      setTimeout(() => setShowTutorial(true), 2000);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (settings.autoRefresh) {
      const interval = setInterval(() => {
        fetchFullGameState();
      }, DASHBOARD_CONFIG.refreshInterval);
      return () => clearInterval(interval);
    }
  }, [settings.autoRefresh, fetchFullGameState]);

  // Handlers
  const handleClaimDaily = async () => {
    setIsClaimingReward(true);
    try {
      const result = await claimDailyReward();
      if (result.success) {
        setRewardClaimed(true);
        setLastReward(result.reward || { money: 1000, xp: 50 });
        setShowRewardModal(true);
        setTimeout(() => fetchFullGameState(), 1000);
      }
    } finally {
      setIsClaimingReward(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchFullGameState();
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const handleTutorialClose = () => {
    setShowTutorial(false);
    setHasSeenTutorial(true);
  };

  // Dados derivados
  const playerLevel = LevelSystem.getLevel(gameState?.player?.experience || 0);
  const heatStatus = HeatSystem.getHeatStatus(gameState?.player?.heat || 0);

  const player = gameState?.player || {};
  const cleanMoney = player.clean_money || 0;
  const dirtyMoney = player.dirty_money || 0;
  const reputation = player.reputation || 0;
  const heat = player.heat || 0;
  const experience = player.experience || 0;
  const dailyRewardClaimed = player.daily_reward_claimed || false;

  const quickActions = useMemo(() => [
    { 
      icon: Target, 
      label: 'Missões', 
      path: '/missoes', 
      color: 'primary',
      description: 'Completa trabalhos',
      category: QUICK_ACTION_CATEGORIES.CRIME,
    },
    { 
      icon: MapPin, 
      label: 'Mapa', 
      path: '/mapa', 
      color: 'warning',
      description: 'Explora a cidade',
      category: QUICK_ACTION_CATEGORIES.CRIME,
    },
    { 
      icon: Users, 
      label: 'Gangue', 
      path: '/gangue', 
      color: 'error',
      description: 'Lidera a tua crew',
      category: QUICK_ACTION_CATEGORIES.SOCIAL,
    },
    { 
      icon: Car, 
      label: 'Veículos', 
      path: '/veiculos', 
      color: 'success',
      description: 'Garagem',
      category: QUICK_ACTION_CATEGORIES.MANAGEMENT,
    },
    { 
      icon: Building2, 
      label: 'Propriedades', 
      path: '/propriedades', 
      color: 'gold',
      description: 'Imóveis',
      category: QUICK_ACTION_CATEGORIES.BUSINESS,
    },
    { 
      icon: Factory, 
      label: 'Negócios', 
      path: '/negocios', 
      color: 'purple',
      description: 'Estabelecimentos',
      category: QUICK_ACTION_CATEGORIES.BUSINESS,
    },
    { 
      icon: Briefcase, 
      label: 'Mercado', 
      path: '/mercado', 
      color: 'secondary',
      description: 'Compra e vende',
      category: QUICK_ACTION_CATEGORIES.BUSINESS,
    },
    { 
      icon: DollarSign, 
      label: 'Banco', 
      path: '/banco', 
      color: 'primary',
      description: 'Gestão financeira',
      category: QUICK_ACTION_CATEGORIES.MANAGEMENT,
    },
    { 
      icon: Radio, 
      label: 'Eventos', 
      path: '/eventos', 
      color: 'warning',
      description: 'Eventos da cidade',
      category: QUICK_ACTION_CATEGORIES.SOCIAL,
      badge: { variant: 'primary', text: 'NOVO' },
    },
    { 
      icon: Trophy, 
      label: 'Rankings', 
      path: '/rankings', 
      color: 'gold',
      description: 'Leaderboards',
      category: QUICK_ACTION_CATEGORIES.SOCIAL,
    },
    { 
      icon: Award, 
      label: 'Conquistas', 
      path: '/conquistas', 
      color: 'gold',
      description: 'Os teus feitos',
      category: QUICK_ACTION_CATEGORIES.SOCIAL,
    },
    { 
      icon: MessageSquare, 
      label: 'Contactos', 
      path: '/contactos', 
      color: 'secondary',
      description: 'NPCs e relações',
      category: QUICK_ACTION_CATEGORIES.SOCIAL,
    },
  ], []);

  const stats = useMemo(() => [
    {
      icon: Wallet,
      label: 'Dinheiro na Mão',
      value: `€${cleanMoney.toLocaleString()}`,
      rawValue: cleanMoney,
      prefix: '€',
      animated: true,
      color: 'success',
      trend: STAT_TRENDS.UP,
      trendValue: 5,
      chartData: [12, 15, 18, 14, 22, 25, 28, cleanMoney / 100],
    },
    {
      icon: Landmark,
      label: 'Dinheiro no Banco',
      value: `€${dirtyMoney.toLocaleString()}`,
      rawValue: dirtyMoney,
      prefix: '€',
      animated: true,
      color: 'primary',
      trend: STAT_TRENDS.UP,
      trendValue: 12,
      chartData: [8, 12, 10, 15, 18, 20, 22, dirtyMoney / 100],
    },
    {
      icon: Award,
      label: 'Reputação',
      value: reputation.toLocaleString(),
      rawValue: reputation,
      animated: true,
      color: 'warning',
      trend: STAT_TRENDS.UP,
      trendValue: 3,
    },
    {
      icon: Flame,
      label: 'Heat',
      value: `${heat}`,
      rawValue: heat,
      animated: true,
      color: heatStatus.color,
      status: heatStatus.status,
      trend: heat > 50 ? STAT_TRENDS.UP : STAT_TRENDS.DOWN,
      trendValue: heat > 50 ? 8 : -5,
    }
  ], [cleanMoney, dirtyMoney, reputation, heat, heatStatus]);

  const playerData = useMemo(() => ({
    cleanMoney,
    dirtyMoney,
    reputation,
    heat,
    level: playerLevel.level,
  }), [cleanMoney, dirtyMoney, reputation, heat, playerLevel.level]);

  // Loading state
  if (!gameState) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-border border-t-primary rounded-full animate-spin mx-auto mb-4" />
          <p className="text-text-secondary">A carregar dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2 md:space-y-3" data-testid="home-page">
      {/* Header Section */}
      <DashboardHeader
        user={user}
        playerLevel={playerLevel}
        heatStatus={heatStatus}
        onSettingsClick={() => setShowSettings(true)}
        onNotificationsClick={() => setShowNotifications(true)}
        notificationCount={notifications.filter(n => !n.read).length}
      />

      {/* Daily Reward */}
      {!dailyRewardClaimed && (
        <DailyRewardSection
          dailyRewardClaimed={dailyRewardClaimed}
          onClaimDaily={handleClaimDaily}
          isLoading={isClaimingReward}
          nextRewardTime={new Date(Date.now() + 24 * 60 * 60 * 1000)}
        />
      )}

      {/* Stats Grid */}
      <StatsGrid stats={stats} isLoading={isRefreshing} />

      {/* Level Progress */}
      {playerLevel.level < 100 && (
        <LevelProgressCard
          playerLevel={playerLevel}
          experience={experience}
          onViewDetails={() => navigate('/perfil')}
        />
      )}

      {/* Quick Actions */}
      <QuickActionsGrid
        actions={quickActions}
        onActionClick={(path) => navigate(path)}
        playerLevel={playerLevel}
      />

      {/* Two Column Layout */}
      <div className="grid lg:grid-cols-2 gap-2 md:gap-3">
        {/* Left Column */}
        <div className="space-y-2 md:space-y-3">
          <CooldownsCard cooldowns={gameState?.cooldowns} />
          <HeatWarningCard heat={heat} />
          <UnlocksCard unlocks={gameState?.unlocks} playerLevel={playerLevel} />
        </div>

        {/* Right Column */}
        <div className="space-y-2 md:space-y-3">
          <MiniAchievementsCard
            achievements={DASHBOARD_ACHIEVEMENTS}
            playerData={playerData}
            onViewAll={() => navigate('/conquistas')}
          />
          <TipsCard tips={DASHBOARD_TIPS} />
        </div>
      </div>

      {/* Footer Widgets */}
      <div className="grid grid-cols-2 gap-2">
        <WeatherWidget />
        <ServerStatusWidget />
      </div>

      {/* Refresh Button */}
      <div className="flex justify-center">
        <Button
          variant="ghost"
          size="sm"
          icon={RefreshCw}
          onClick={handleRefresh}
          loading={isRefreshing}
        >
          Atualizar Dados
        </Button>
      </div>

      {/* Modais */}
      <DailyRewardModal
        isOpen={showRewardModal}
        onClose={() => setShowRewardModal(false)}
        reward={lastReward}
      />

      <TutorialModal
        isOpen={showTutorial}
        onClose={handleTutorialClose}
        step={tutorialStep}
        onNext={() => setTutorialStep(s => Math.min(s + 1, TUTORIAL_STEPS.length - 1))}
        onPrev={() => setTutorialStep(s => Math.max(s - 1, 0))}
        totalSteps={TUTORIAL_STEPS.length}
      />

      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        settings={settings}
        onSave={setSettings}
      />

      <NotificationsModal
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
        notifications={notifications}
        onClear={() => setNotifications([])}
      />
    </div>
  );
}

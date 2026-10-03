import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useGame } from '../contexts/GameContext';
import { Card, ProgressBar } from '../components/ProgressBar';
import { Button, Badge, Modal, Input, Alert } from '../components/UI';
import { 
  DollarSign, ArrowDownCircle, ArrowUpCircle, 
  Send, History, Landmark, Wallet,
  ArrowRight, ArrowLeft, TrendingUp, TrendingDown,
  Clock, Shield, AlertTriangle, CheckCircle, XCircle,
  Eye, EyeOff, Copy, RefreshCw, Filter, Search,
  Calendar, Download, Upload, FileText, BarChart2,
  PieChart, Activity, Target, Award, Lock, Unlock,
  CreditCard, Banknote, Coins, PiggyBank, Percent,
  Calculator, Receipt, Users, Building, Star,
  Sparkles, Zap, Gift, Crown, Trophy, Medal,
  ChevronDown, ChevronUp, ChevronRight, ChevronLeft,
  MoreHorizontal, Settings, Bell, Info, HelpCircle,
  ExternalLink, Link, Share2, Bookmark, Flag,
  Circle, Check, X, Plus, Minus, Hash, AtSign,
  Mail, Phone, MapPin, Globe, Home, User, UserPlus,
  ShieldCheck, ShieldAlert, ShieldOff, Key, Fingerprint,
  Database, Server, Cpu, HardDrive, Cloud, CloudOff,
  Wifi, WifiOff, Signal, Battery, Power, Loader2,
  Timer, Hourglass, AlarmClock, TimerReset, PlayCircle,
  PauseCircle, StopCircle, SkipForward, SkipBack,
  Volume2, VolumeX, Mic, Camera, Image, Video,
  Folder, File, FilePlus, FileCheck, FileX, Files,
  Package, Box, Archive, Trash, Trash2, Edit, Save,
  Undo, Redo, Move, Grip, Menu, Grid, List,
  LayoutGrid, Layers, Maximize, Minimize, ZoomIn,
  ZoomOut, RotateCcw, RotateCw, Shuffle, Repeat,
  Play, Pause, Square, Triangle, Hexagon, Octagon,
  Diamond, Pentagon, Heart, HeartOff, ThumbsUp, ThumbsDown,
  MessageSquare, MessageCircle, MessagesSquare, Quote,
  Newspaper, Rss, Radio, Tv, Monitor, Smartphone,
  Tablet, Watch, Headphones, Speaker, Music, Music2,
  Mic as Mic2, Radio as RadioIcon, Airplay, Cast, Bluetooth
} from 'lucide-react';
import clsx from 'clsx';

// ==================== CONSTANTES E CONFIGURAÇÕES ====================

const BANK_CONFIG = {
  maxDailyDeposits: 10,
  maxDailyWithdrawals: 5,
  maxDailyTransfers: 3,
  depositFee: 0,
  withdrawalFee: 0.01, // 1%
  transferFee: 0.01, // 1%
  minTransactionAmount: 10,
  maxTransactionAmount: 1000000,
  securityLevels: ['basic', 'standard', 'premium', 'elite'],
  refreshInterval: 30000,
};

const TRANSACTION_TYPES = {
  DEPOSIT: 'deposit',
  WITHDRAWAL: 'withdrawal',
  TRANSFER_IN: 'transfer_in',
  TRANSFER_OUT: 'transfer_out',
  INTEREST: 'interest',
  FEE: 'fee',
  REWARD: 'reward',
  PENALTY: 'penalty',
};

const ACCOUNT_TIERS = [
  { id: 'bronze', name: 'Bronze', minBalance: 0, benefits: ['Operações básicas', 'Histórico 7 dias'], color: 'warning', icon: Shield },
  { id: 'silver', name: 'Prata', minBalance: 10000, benefits: ['Taxas reduzidas 10%', 'Histórico 30 dias', 'Notificações'], color: 'secondary', icon: Star },
  { id: 'gold', name: 'Ouro', minBalance: 50000, benefits: ['Taxas reduzidas 25%', 'Histórico ilimitado', 'Transferências prioritárias'], color: 'gold', icon: Crown },
  { id: 'platinum', name: 'Platina', minBalance: 100000, benefits: ['Sem taxas', 'Gestor dedicado', 'Recompensas exclusivas', 'Proteção VIP'], color: 'primary', icon: Trophy },
];

const QUICK_AMOUNTS = [100, 500, 1000, 5000, 10000, 50000];

const BANK_TIPS = [
  'Mantém o teu dinheiro no banco para o proteger de roubos.',
  'Clientes de nível superior têm taxas mais baixas.',
  'As transferências entre jogadores têm uma taxa de 1%.',
  'Verifica o teu histórico regularmente para detetar atividades suspeitas.',
  'Deposita regularmente para subir de nível da conta.',
];

const SECURITY_FEATURES = [
  { id: 'two_factor', name: 'Autenticação 2FA', description: 'Protege a tua conta com verificação extra', enabled: true },
  { id: 'transaction_alerts', name: 'Alertas de Transação', description: 'Notificações para todas as transações', enabled: true },
  { id: 'daily_limit', name: 'Limite Diário', description: 'Protege contra grandes perdas', enabled: false },
  { id: 'trusted_devices', name: 'Dispositivos Confiáveis', description: 'Só permite acessos de dispositivos conhecidos', enabled: false },
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

const MiniChart = ({ data, color = 'primary', height = 40, type = 'bar' }) => {
  if (!data || data.length === 0) return null;
  
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;

  if (type === 'line') {
    const points = data.map((value, i) => {
      const x = (i / (data.length - 1)) * 100;
      const y = 100 - ((value - min) / range) * 100;
      return `${x},${y}`;
    }).join(' ');

    return (
      <svg viewBox="0 0 100 100" style={{ height, width: '100%' }} preserveAspectRatio="none">
        <polyline
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          points={points}
          className={`text-${color}`}
        />
      </svg>
    );
  }
  
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

const StatTrendIndicator = ({ trend, value }) => {
  if (!trend) return null;
  
  const isUp = trend === 'up';
  const Icon = isUp ? TrendingUp : TrendingDown;
  const color = isUp ? 'text-success' : 'text-error';
  
  return (
    <div className={clsx('flex items-center gap-0.5 text-xs', color)}>
      <Icon size={12} />
      <span>{value > 0 ? '+' : ''}{value}%</span>
    </div>
  );
};

// ==================== COMPONENTES DE TRANSAÇÃO ====================

const transactionConfig = {
  deposit: { icon: ArrowDownCircle, label: 'Depósito', color: 'text-success', bgColor: 'bg-success/10' },
  withdrawal: { icon: ArrowUpCircle, label: 'Levantamento', color: 'text-warning', bgColor: 'bg-warning/10' },
  transfer_in: { icon: ArrowLeft, label: 'Transferência Recebida', color: 'text-success', bgColor: 'bg-success/10' },
  transfer_out: { icon: ArrowRight, label: 'Transferência Enviada', color: 'text-error', bgColor: 'bg-error/10' },
  interest: { icon: Percent, label: 'Juros', color: 'text-primary', bgColor: 'bg-primary/10' },
  fee: { icon: Receipt, label: 'Taxa', color: 'text-error', bgColor: 'bg-error/10' },
  reward: { icon: Gift, label: 'Recompensa', color: 'text-gold', bgColor: 'bg-gold/10' },
  penalty: { icon: AlertTriangle, label: 'Penalidade', color: 'text-error', bgColor: 'bg-error/10' },
};

const TransactionItem = ({ transaction, isExpanded, onToggle }) => {
  const config = transactionConfig[transaction.transaction_type] || {
    icon: DollarSign,
    label: transaction.transaction_type,
    color: 'text-text-primary',
    bgColor: 'bg-surface-highlight'
  };
  const Icon = config.icon;
  const isPositive = transaction.amount > 0;

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('pt-PT', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (value) => `€${(value || 0).toLocaleString('pt-PT')}`;

  return (
    <div className="border border-border rounded overflow-hidden">
      <div
        onClick={onToggle}
        className={clsx(
          'flex items-center justify-between p-2 md:p-3 cursor-pointer transition-colors',
          config.bgColor,
          'hover:bg-surface'
        )}
      >
        <div className="flex items-center gap-2 md:gap-3">
          <div className={clsx('w-8 h-8 md:w-10 md:h-10 flex items-center justify-center rounded', config.color, config.bgColor)}>
            <Icon size={16} className="md:w-5 md:h-5" />
          </div>
          <div>
            <p className="text-xs md:text-sm text-text-primary font-body">{config.label}</p>
            <p className="text-xs text-text-secondary">{formatDate(transaction.timestamp)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-right">
            <p className={clsx('font-body text-sm md:text-base', isPositive ? 'text-success' : 'text-error')}>
              {isPositive ? '+' : ''}{formatCurrency(transaction.amount)}
            </p>
            <p className="text-xs text-text-secondary">
              Saldo: {formatCurrency(transaction.balance_after)}
            </p>
          </div>
          {isExpanded ? <ChevronUp size={16} className="text-text-secondary" /> : <ChevronDown size={16} className="text-text-secondary" />}
        </div>
      </div>
      
      {isExpanded && (
        <div className="p-3 bg-surface border-t border-border space-y-2">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-text-secondary">ID da Transação:</span>
              <p className="text-text-primary font-mono">{transaction.id?.slice(-8) || 'N/A'}</p>
            </div>
            <div>
              <span className="text-text-secondary">Estado:</span>
              <p className="text-success flex items-center gap-1">
                <CheckCircle size={12} /> Concluída
              </p>
            </div>
            {transaction.fee && (
              <div>
                <span className="text-text-secondary">Taxa:</span>
                <p className="text-error">{formatCurrency(transaction.fee)}</p>
              </div>
            )}
            {transaction.recipient && (
              <div>
                <span className="text-text-secondary">Destinatário:</span>
                <p className="text-text-primary">{transaction.recipient}</p>
              </div>
            )}
            {transaction.sender && (
              <div>
                <span className="text-text-secondary">Remetente:</span>
                <p className="text-text-primary">{transaction.sender}</p>
              </div>
            )}
          </div>
          {transaction.description && (
            <div className="text-xs">
              <span className="text-text-secondary">Descrição:</span>
              <p className="text-text-primary">{transaction.description}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const TransactionsList = ({ transactions, isLoading, onLoadMore, hasMore }) => {
  const [expandedId, setExpandedId] = useState(null);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 300);

  const filteredTransactions = useMemo(() => {
    return transactions.filter(tx => {
      const matchesFilter = filter === 'all' || tx.transaction_type === filter;
      const matchesSearch = !debouncedSearch || 
        tx.transaction_type.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        (tx.description && tx.description.toLowerCase().includes(debouncedSearch.toLowerCase()));
      return matchesFilter && matchesSearch;
    });
  }, [transactions, filter, debouncedSearch]);

  const filterOptions = [
    { id: 'all', label: 'Todas' },
    { id: 'deposit', label: 'Depósitos' },
    { id: 'withdrawal', label: 'Levantamentos' },
    { id: 'transfer_in', label: 'Recebidas' },
    { id: 'transfer_out', label: 'Enviadas' },
  ];

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map(i => (
          <Skeleton key={i} className="h-16" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
          <input
            type="text"
            placeholder="Pesquisar transações..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-surface border border-border rounded text-sm text-text-primary"
          />
        </div>
        <div className="flex gap-1 overflow-x-auto">
          {filterOptions.map(option => (
            <button
              key={option.id}
              onClick={() => setFilter(option.id)}
              className={clsx(
                'px-3 py-2 text-xs rounded whitespace-nowrap transition-all',
                filter === option.id
                  ? 'bg-primary text-background'
                  : 'bg-surface-highlight text-text-secondary hover:text-text-primary'
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Transaction List */}
      {filteredTransactions.length === 0 ? (
        <EmptyState
          icon={History}
          title="Sem Transações"
          description={searchTerm || filter !== 'all' 
            ? 'Nenhuma transação encontrada com esses filtros.'
            : 'As tuas transações aparecerão aqui.'}
        />
      ) : (
        <div className="space-y-2 max-h-[500px] overflow-y-auto">
          {filteredTransactions.map((tx, index) => (
            <TransactionItem
              key={tx.id || index}
              transaction={tx}
              isExpanded={expandedId === (tx.id || index)}
              onToggle={() => setExpandedId(expandedId === (tx.id || index) ? null : (tx.id || index))}
            />
          ))}
        </div>
      )}

      {/* Load More */}
      {hasMore && (
        <Button
          variant="ghost"
          fullWidth
          onClick={onLoadMore}
          icon={ChevronDown}
        >
          Carregar Mais
        </Button>
      )}

      {/* Stats */}
      <div className="flex justify-between text-xs text-text-secondary pt-2 border-t border-border">
        <span>{filteredTransactions.length} transações</span>
        <span>Total: {transactions.length}</span>
      </div>
    </div>
  );
};

// ==================== COMPONENTES DE CONTA ====================

const AccountTierCard = ({ currentBalance, currentTier, onUpgrade }) => {
  const currentTierData = ACCOUNT_TIERS.find(t => t.id === currentTier) || ACCOUNT_TIERS[0];
  const currentIndex = ACCOUNT_TIERS.findIndex(t => t.id === currentTier);
  const nextTier = ACCOUNT_TIERS[currentIndex + 1];
  
  const TierIcon = currentTierData.icon;

  return (
    <Card className={`border-${currentTierData.color}/50`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-14 h-14 bg-${currentTierData.color}/20 border border-${currentTierData.color} rounded flex items-center justify-center`}>
            <TierIcon size={28} className={`text-${currentTierData.color}`} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-heading text-lg text-text-primary">Conta {currentTierData.name}</h3>
              <Badge variant={currentTierData.color} size="sm">ATIVO</Badge>
            </div>
            <p className="text-xs text-text-secondary">Nível atual da tua conta bancária</p>
          </div>
        </div>
      </div>

      {/* Benefits */}
      <div className="space-y-2 mb-4">
        <p className="text-xs text-text-secondary uppercase">Benefícios:</p>
        <div className="grid grid-cols-2 gap-2">
          {currentTierData.benefits.map((benefit, i) => (
            <div key={i} className="flex items-center gap-2 text-xs">
              <CheckCircle size={12} className={`text-${currentTierData.color}`} />
              <span className="text-text-primary">{benefit}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Next Tier Progress */}
      {nextTier && (
        <div className="bg-surface-highlight border border-border p-3 rounded">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-text-secondary">Próximo nível: {nextTier.name}</span>
            <span className="text-xs text-primary font-mono">€{nextTier.minBalance.toLocaleString()}</span>
          </div>
          <ProgressBar
            value={currentBalance}
            max={nextTier.minBalance}
            color={nextTier.color}
            showLabel={false}
            height="h-2"
          />
          <p className="text-xs text-text-secondary mt-1">
            Faltam €{Math.max(0, nextTier.minBalance - currentBalance).toLocaleString()} para subir de nível
          </p>
        </div>
      )}
    </Card>
  );
};

const BalanceCard = ({ label, value, icon: Icon, color, trend, trendValue, chartData, onClick, isAnimated = true }) => (
  <Card 
    className={`bg-gradient-to-br from-${color}/10 to-transparent border-${color}/30 cursor-pointer hover:border-${color} transition-all group`}
    onClick={onClick}
  >
    <div className="flex items-center justify-between">
      <div className="flex-1">
        <p className="text-xs text-text-secondary uppercase mb-0.5">{label}</p>
        <p className={`text-lg md:text-xl font-heading text-${color}`}>
          {isAnimated ? (
            <AnimatedCounter value={value} prefix="€" />
          ) : (
            `€${value.toLocaleString('pt-PT')}`
          )}
        </p>
        {trend && <StatTrendIndicator trend={trend} value={trendValue} />}
      </div>
      <div className="flex flex-col items-end gap-2">
        <Icon className={`w-7 h-7 md:w-8 md:h-8 text-${color} opacity-50 group-hover:opacity-100 transition-opacity`} />
        {chartData && <MiniChart data={chartData} color={color} height={24} />}
      </div>
    </div>
  </Card>
);

const QuickAmountButtons = ({ amounts, selectedAmount, onSelect, maxAmount }) => (
  <div className="grid grid-cols-3 gap-2">
    {amounts.map(amount => {
      const isDisabled = amount > maxAmount;
      return (
        <button
          key={amount}
          onClick={() => !isDisabled && onSelect(amount)}
          disabled={isDisabled}
          className={clsx(
            'py-2 px-3 text-sm rounded border transition-all',
            selectedAmount === amount
              ? 'bg-primary text-background border-primary'
              : isDisabled
                ? 'bg-surface-highlight text-text-secondary border-border opacity-50 cursor-not-allowed'
                : 'bg-surface border-border text-text-primary hover:border-primary'
          )}
        >
          €{amount.toLocaleString()}
        </button>
      );
    })}
  </div>
);

const SecurityFeatureToggle = ({ feature, isEnabled, onToggle }) => (
  <div className="flex items-center justify-between p-3 bg-surface-highlight rounded border border-border">
    <div className="flex items-center gap-3">
      <div className={clsx(
        'w-10 h-10 rounded flex items-center justify-center',
        isEnabled ? 'bg-success/20' : 'bg-error/20'
      )}>
        {isEnabled ? <ShieldCheck size={20} className="text-success" /> : <ShieldOff size={20} className="text-error" />}
      </div>
      <div>
        <p className="text-sm text-text-primary">{feature.name}</p>
        <p className="text-xs text-text-secondary">{feature.description}</p>
      </div>
    </div>
    <button
      onClick={() => onToggle(feature.id)}
      className={clsx(
        'w-12 h-6 rounded-full transition-all relative',
        isEnabled ? 'bg-success' : 'bg-border'
      )}
    >
      <div className={clsx(
        'w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all',
        isEnabled ? 'left-6' : 'left-0.5'
      )} />
    </button>
  </div>
);

const AnalyticsCard = ({ transactions, bankBalance, playerCash }) => {
  const stats = useMemo(() => {
    const now = new Date();
    const last30Days = new Date(now.setDate(now.getDate() - 30));
    
    const recentTransactions = transactions.filter(tx => new Date(tx.timestamp) >= last30Days);
    
    const totalDeposits = recentTransactions
      .filter(tx => tx.transaction_type === 'deposit')
      .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
    
    const totalWithdrawals = recentTransactions
      .filter(tx => tx.transaction_type === 'withdrawal')
      .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
    
    const totalTransfersIn = recentTransactions
      .filter(tx => tx.transaction_type === 'transfer_in')
      .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
    
    const totalTransfersOut = recentTransactions
      .filter(tx => tx.transaction_type === 'transfer_out')
      .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);

    const netFlow = totalDeposits + totalTransfersIn - totalWithdrawals - totalTransfersOut;
    
    return {
      totalDeposits,
      totalWithdrawals,
      totalTransfersIn,
      totalTransfersOut,
      netFlow,
      transactionCount: recentTransactions.length,
      averageTransaction: recentTransactions.length > 0 
        ? recentTransactions.reduce((sum, tx) => sum + Math.abs(tx.amount), 0) / recentTransactions.length 
        : 0,
    };
  }, [transactions]);

  const chartData = useMemo(() => {
    // Generate mock chart data based on transactions
    return Array.from({ length: 7 }, (_, i) => Math.random() * bankBalance * 0.1 + bankBalance * 0.9);
  }, [bankBalance]);

  return (
    <Card title="Análise Financeira" icon={BarChart2}>
      <div className="space-y-4">
        {/* Mini Chart */}
        <div className="bg-surface-highlight p-3 rounded">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-text-secondary">Evolução do Saldo (7 dias)</span>
            <Badge variant={stats.netFlow >= 0 ? 'success' : 'error'} size="xs">
              {stats.netFlow >= 0 ? '+' : ''}{stats.netFlow.toLocaleString()}€
            </Badge>
          </div>
          <MiniChart data={chartData} color="primary" height={60} type="line" />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-success/10 border border-success/30 p-3 rounded">
            <div className="flex items-center gap-2 mb-1">
              <ArrowDownCircle size={14} className="text-success" />
              <span className="text-xs text-text-secondary">Entradas</span>
            </div>
            <p className="text-lg font-mono text-success">
              €{(stats.totalDeposits + stats.totalTransfersIn).toLocaleString()}
            </p>
          </div>
          <div className="bg-error/10 border border-error/30 p-3 rounded">
            <div className="flex items-center gap-2 mb-1">
              <ArrowUpCircle size={14} className="text-error" />
              <span className="text-xs text-text-secondary">Saídas</span>
            </div>
            <p className="text-lg font-mono text-error">
              €{(stats.totalWithdrawals + stats.totalTransfersOut).toLocaleString()}
            </p>
          </div>
        </div>

        {/* Additional Stats */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="p-2 bg-surface-highlight rounded">
            <p className="text-lg font-mono text-primary">{stats.transactionCount}</p>
            <p className="text-xs text-text-secondary">Transações</p>
          </div>
          <div className="p-2 bg-surface-highlight rounded">
            <p className="text-lg font-mono text-gold">€{Math.round(stats.averageTransaction)}</p>
            <p className="text-xs text-text-secondary">Média</p>
          </div>
          <div className="p-2 bg-surface-highlight rounded">
            <p className={clsx('text-lg font-mono', stats.netFlow >= 0 ? 'text-success' : 'text-error')}>
              {stats.netFlow >= 0 ? '+' : ''}{Math.round((stats.netFlow / (bankBalance || 1)) * 100)}%
            </p>
            <p className="text-xs text-text-secondary">Variação</p>
          </div>
        </div>

        {/* Distribution */}
        <div className="space-y-2">
          <p className="text-xs text-text-secondary uppercase">Distribuição do Património</p>
          <div className="h-4 bg-background rounded-full overflow-hidden flex">
            <div 
              className="h-full bg-success transition-all"
              style={{ width: `${(playerCash / (playerCash + bankBalance || 1)) * 100}%` }}
            />
            <div 
              className="h-full bg-primary transition-all"
              style={{ width: `${(bankBalance / (playerCash + bankBalance || 1)) * 100}%` }}
            />
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-success">Na Mão: {Math.round((playerCash / (playerCash + bankBalance || 1)) * 100)}%</span>
            <span className="text-primary">No Banco: {Math.round((bankBalance / (playerCash + bankBalance || 1)) * 100)}%</span>
          </div>
        </div>
      </div>
    </Card>
  );
};

const SecurityCard = ({ onViewSecurity }) => {
  const [securityScore, setSecurityScore] = useState(75);

  return (
    <Card title="Segurança da Conta" icon={Shield}>
      <div className="flex items-center gap-4 mb-4">
        <div className="relative">
          <CircularProgress value={securityScore} max={100} size={80} color={securityScore >= 80 ? 'success' : securityScore >= 50 ? 'warning' : 'error'} />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-lg font-heading">{securityScore}%</span>
          </div>
        </div>
        <div className="flex-1">
          <p className="text-sm text-text-primary mb-1">
            Nível de Segurança: {securityScore >= 80 ? 'Excelente' : securityScore >= 50 ? 'Bom' : 'Precisa Melhorar'}
          </p>
          <p className="text-xs text-text-secondary">
            Ativa mais funcionalidades de segurança para proteger a tua conta.
          </p>
        </div>
      </div>

      <div className="space-y-2 mb-4">
        {SECURITY_FEATURES.slice(0, 2).map(feature => (
          <div key={feature.id} className="flex items-center justify-between text-xs p-2 bg-surface-highlight rounded">
            <span className="text-text-secondary">{feature.name}</span>
            {feature.enabled ? (
              <Badge variant="success" size="xs">Ativo</Badge>
            ) : (
              <Badge variant="error" size="xs">Inativo</Badge>
            )}
          </div>
        ))}
      </div>

      <Button variant="secondary" fullWidth onClick={onViewSecurity} icon={Settings}>
        Gerir Segurança
      </Button>
    </Card>
  );
};

const TipsCard = () => {
  const [currentTip, setCurrentTip] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTip(prev => (prev + 1) % BANK_TIPS.length);
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-start gap-3 p-3 bg-primary/10 border border-primary/30 rounded">
      <Info size={18} className="text-primary flex-shrink-0 mt-0.5" />
      <div className="flex-1">
        <p className="text-xs text-primary uppercase mb-1">Dica</p>
        <p className="text-sm text-text-secondary">{BANK_TIPS[currentTip]}</p>
      </div>
      <div className="flex gap-1">
        {BANK_TIPS.slice(0, 5).map((_, i) => (
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

const LimitsCard = ({ dailyDeposits, dailyWithdrawals, dailyTransfers }) => (
  <Card title="Limites Diários" icon={Lock}>
    <div className="space-y-3">
      <div>
        <div className="flex justify-between text-xs mb-1">
          <span className="text-text-secondary">Depósitos</span>
          <span className="text-text-primary">{dailyDeposits} / {BANK_CONFIG.maxDailyDeposits}</span>
        </div>
        <ProgressBar
          value={dailyDeposits}
          max={BANK_CONFIG.maxDailyDeposits}
          color="success"
          showLabel={false}
          height="h-2"
        />
      </div>
      <div>
        <div className="flex justify-between text-xs mb-1">
          <span className="text-text-secondary">Levantamentos</span>
          <span className="text-text-primary">{dailyWithdrawals} / {BANK_CONFIG.maxDailyWithdrawals}</span>
        </div>
        <ProgressBar
          value={dailyWithdrawals}
          max={BANK_CONFIG.maxDailyWithdrawals}
          color="warning"
          showLabel={false}
          height="h-2"
        />
      </div>
      <div>
        <div className="flex justify-between text-xs mb-1">
          <span className="text-text-secondary">Transferências</span>
          <span className="text-text-primary">{dailyTransfers} / {BANK_CONFIG.maxDailyTransfers}</span>
        </div>
        <ProgressBar
          value={dailyTransfers}
          max={BANK_CONFIG.maxDailyTransfers}
          color="primary"
          showLabel={false}
          height="h-2"
        />
      </div>
    </div>
    <p className="text-xs text-text-secondary mt-3">
      Os limites são repostos à meia-noite.
    </p>
  </Card>
);

const RecentContactsCard = ({ contacts, onSelectContact }) => {
  if (!contacts || contacts.length === 0) {
    return (
      <Card title="Contactos Recentes" icon={Users}>
        <EmptyState
          icon={Users}
          title="Sem Contactos"
          description="Os teus contactos de transferência aparecerão aqui."
        />
      </Card>
    );
  }

  return (
    <Card title="Contactos Recentes" icon={Users}>
      <div className="space-y-2">
        {contacts.slice(0, 5).map((contact, i) => (
          <button
            key={i}
            onClick={() => onSelectContact(contact)}
            className="w-full flex items-center gap-3 p-2 bg-surface-highlight hover:bg-surface border border-border hover:border-primary rounded transition-all"
          >
            <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
              <User size={16} className="text-primary" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm text-text-primary">{contact.username}</p>
              <p className="text-xs text-text-secondary">Última transferência: {contact.lastTransfer}</p>
            </div>
            <ChevronRight size={16} className="text-text-secondary" />
          </button>
        ))}
      </div>
    </Card>
  );
};

// ==================== MODAIS ====================

const DepositModal = ({ isOpen, onClose, maxAmount, onDeposit, loading }) => {
  const [amount, setAmount] = useState('');
  const [selectedQuickAmount, setSelectedQuickAmount] = useState(null);
  const [description, setDescription] = useState('');

  const handleQuickAmountSelect = (quickAmount) => {
    setSelectedQuickAmount(quickAmount);
    setAmount(quickAmount.toString());
  };

  const handleDeposit = () => {
    const depositAmount = parseFloat(amount);
    if (depositAmount > 0 && depositAmount <= maxAmount) {
      onDeposit(depositAmount, description);
      setAmount('');
      setSelectedQuickAmount(null);
      setDescription('');
    }
  };

  const formatCurrency = (value) => `€${(value || 0).toLocaleString('pt-PT')}`;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Depositar Dinheiro" size="md">
      <div className="space-y-4">
        {/* Available Balance */}
        <div className="bg-success/10 border border-success/30 p-4 rounded">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-text-secondary">Disponível na Mão</p>
              <p className="text-xl text-success font-heading">{formatCurrency(maxAmount)}</p>
            </div>
            <Wallet size={32} className="text-success opacity-50" />
          </div>
        </div>

        {/* Quick Amounts */}
        <div>
          <p className="text-xs text-text-secondary uppercase mb-2">Valores Rápidos</p>
          <QuickAmountButtons
            amounts={QUICK_AMOUNTS}
            selectedAmount={selectedQuickAmount}
            onSelect={handleQuickAmountSelect}
            maxAmount={maxAmount}
          />
        </div>

        {/* Custom Amount */}
        <Input
          label="Valor Personalizado"
          type="number"
          placeholder="0.00"
          value={amount}
          onChange={(e) => {
            setAmount(e.target.value);
            setSelectedQuickAmount(null);
          }}
          prefix="€"
          min={BANK_CONFIG.minTransactionAmount}
          max={Math.min(maxAmount, BANK_CONFIG.maxTransactionAmount)}
        />

        {/* Description */}
        <Input
          label="Descrição (opcional)"
          type="text"
          placeholder="Nota para esta transação..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={100}
        />

        {/* Fee Info */}
        {BANK_CONFIG.depositFee > 0 && (
          <Alert variant="info">
            <p className="text-xs">Taxa de depósito: {BANK_CONFIG.depositFee * 100}%</p>
          </Alert>
        )}

        {/* Summary */}
        {amount && parseFloat(amount) > 0 && (
          <div className="bg-surface-highlight p-3 rounded border border-border">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-text-secondary">Valor a depositar</span>
              <span className="text-text-primary">{formatCurrency(parseFloat(amount))}</span>
            </div>
            {BANK_CONFIG.depositFee > 0 && (
              <div className="flex justify-between text-sm mb-1">
                <span className="text-text-secondary">Taxa</span>
                <span className="text-error">-{formatCurrency(parseFloat(amount) * BANK_CONFIG.depositFee)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm border-t border-border pt-1 mt-1">
              <span className="text-text-secondary">Total creditado</span>
              <span className="text-success font-heading">
                {formatCurrency(parseFloat(amount) * (1 - BANK_CONFIG.depositFee))}
              </span>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <Button variant="secondary" fullWidth onClick={onClose}>
            Cancelar
          </Button>
          <Button
            variant="success"
            fullWidth
            onClick={handleDeposit}
            loading={loading}
            disabled={!amount || parseFloat(amount) <= 0 || parseFloat(amount) > maxAmount}
            icon={ArrowDownCircle}
          >
            Depositar
          </Button>
        </div>
      </div>
    </Modal>
  );
};

const WithdrawModal = ({ isOpen, onClose, maxAmount, onWithdraw, loading }) => {
  const [amount, setAmount] = useState('');
  const [selectedQuickAmount, setSelectedQuickAmount] = useState(null);

  const handleQuickAmountSelect = (quickAmount) => {
    setSelectedQuickAmount(quickAmount);
    setAmount(quickAmount.toString());
  };

  const handleWithdraw = () => {
    const withdrawAmount = parseFloat(amount);
    if (withdrawAmount > 0 && withdrawAmount <= maxAmount) {
      onWithdraw(withdrawAmount);
      setAmount('');
      setSelectedQuickAmount(null);
    }
  };

  const formatCurrency = (value) => `€${(value || 0).toLocaleString('pt-PT')}`;
  const fee = parseFloat(amount || 0) * BANK_CONFIG.withdrawalFee;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Levantar Dinheiro" size="md">
      <div className="space-y-4">
        {/* Available Balance */}
        <div className="bg-primary/10 border border-primary/30 p-4 rounded">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-text-secondary">Disponível no Banco</p>
              <p className="text-xl text-primary font-heading">{formatCurrency(maxAmount)}</p>
            </div>
            <Landmark size={32} className="text-primary opacity-50" />
          </div>
        </div>

        {/* Quick Amounts */}
        <div>
          <p className="text-xs text-text-secondary uppercase mb-2">Valores Rápidos</p>
          <QuickAmountButtons
            amounts={QUICK_AMOUNTS}
            selectedAmount={selectedQuickAmount}
            onSelect={handleQuickAmountSelect}
            maxAmount={maxAmount}
          />
        </div>

        {/* Custom Amount */}
        <Input
          label="Valor Personalizado"
          type="number"
          placeholder="0.00"
          value={amount}
          onChange={(e) => {
            setAmount(e.target.value);
            setSelectedQuickAmount(null);
          }}
          prefix="€"
          min={BANK_CONFIG.minTransactionAmount}
          max={Math.min(maxAmount, BANK_CONFIG.maxTransactionAmount)}
        />

        {/* Fee Warning */}
        <Alert variant="warning">
          <div className="flex items-start gap-2">
            <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-heading">Taxa de Levantamento: {BANK_CONFIG.withdrawalFee * 100}%</p>
              <p className="text-xs opacity-80">O banco cobra uma pequena taxa por cada levantamento.</p>
            </div>
          </div>
        </Alert>

        {/* Summary */}
        {amount && parseFloat(amount) > 0 && (
          <div className="bg-surface-highlight p-3 rounded border border-border">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-text-secondary">Valor a levantar</span>
              <span className="text-text-primary">{formatCurrency(parseFloat(amount))}</span>
            </div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-text-secondary">Taxa ({BANK_CONFIG.withdrawalFee * 100}%)</span>
              <span className="text-error">-{formatCurrency(fee)}</span>
            </div>
            <div className="flex justify-between text-sm border-t border-border pt-1 mt-1">
              <span className="text-text-secondary">Recebes</span>
              <span className="text-success font-heading">
                {formatCurrency(parseFloat(amount) - fee)}
              </span>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <Button variant="secondary" fullWidth onClick={onClose}>
            Cancelar
          </Button>
          <Button
            variant="warning"
            fullWidth
            onClick={handleWithdraw}
            loading={loading}
            disabled={!amount || parseFloat(amount) <= 0 || parseFloat(amount) > maxAmount}
            icon={ArrowUpCircle}
          >
            Levantar
          </Button>
        </div>
      </div>
    </Modal>
  );
};

const TransferModal = ({ isOpen, onClose, maxAmount, onTransfer, loading, recentContacts }) => {
  const [amount, setAmount] = useState('');
  const [recipient, setRecipient] = useState('');
  const [description, setDescription] = useState('');
  const [step, setStep] = useState(1);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleSelectContact = (contact) => {
    setRecipient(contact.id || contact.username);
    setStep(2);
  };

  const handleTransfer = () => {
    if (showConfirm) {
      onTransfer(parseFloat(amount), recipient, description);
      resetForm();
    } else {
      setShowConfirm(true);
    }
  };

  const resetForm = () => {
    setAmount('');
    setRecipient('');
    setDescription('');
    setStep(1);
    setShowConfirm(false);
  };

  const formatCurrency = (value) => `€${(value || 0).toLocaleString('pt-PT')}`;
  const fee = parseFloat(amount || 0) * BANK_CONFIG.transferFee;

  return (
    <Modal isOpen={isOpen} onClose={() => { onClose(); resetForm(); }} title="Transferir Dinheiro" size="md">
      <div className="space-y-4">
        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-4">
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

        {/* Step 1: Select Recipient */}
        {step === 1 && (
          <div className="space-y-4">
            <p className="text-sm text-text-secondary text-center">Seleciona ou introduz o destinatário</p>
            
            <Input
              label="ID ou Username do Destinatário"
              type="text"
              placeholder="Introduzir ID do jogador..."
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              icon={User}
            />

            {recentContacts && recentContacts.length > 0 && (
              <div>
                <p className="text-xs text-text-secondary uppercase mb-2">Contactos Recentes</p>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {recentContacts.map((contact, i) => (
                    <button
                      key={i}
                      onClick={() => handleSelectContact(contact)}
                      className="w-full flex items-center gap-2 p-2 bg-surface-highlight hover:bg-surface border border-border hover:border-primary rounded transition-all"
                    >
                      <User size={16} className="text-primary" />
                      <span className="text-sm text-text-primary">{contact.username}</span>
                      <ChevronRight size={14} className="ml-auto text-text-secondary" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            <Button
              variant="primary"
              fullWidth
              onClick={() => setStep(2)}
              disabled={!recipient}
              icon={ChevronRight}
            >
              Continuar
            </Button>
          </div>
        )}

        {/* Step 2: Enter Amount */}
        {step === 2 && !showConfirm && (
          <div className="space-y-4">
            {/* Available Balance */}
            <div className="bg-primary/10 border border-primary/30 p-3 rounded">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-text-secondary">Disponível</p>
                  <p className="text-lg text-primary font-heading">{formatCurrency(maxAmount)}</p>
                </div>
                <Badge variant="secondary">{recipient}</Badge>
              </div>
            </div>

            {/* Quick Amounts */}
            <QuickAmountButtons
              amounts={QUICK_AMOUNTS.slice(0, 6)}
              selectedAmount={parseFloat(amount)}
              onSelect={(a) => setAmount(a.toString())}
              maxAmount={maxAmount}
            />

            <Input
              label="Valor a Transferir"
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              prefix="€"
            />

            <Input
              label="Mensagem (opcional)"
              type="text"
              placeholder="Adicionar nota..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={100}
            />

            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => setStep(1)}>
                Voltar
              </Button>
              <Button
                variant="primary"
                className="flex-1"
                onClick={() => setShowConfirm(true)}
                disabled={!amount || parseFloat(amount) <= 0 || parseFloat(amount) > maxAmount}
              >
                Rever Transferência
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Confirmation */}
        {showConfirm && (
          <div className="space-y-4">
            <Alert variant="warning">
              <p className="text-xs">Confirma os detalhes da transferência antes de continuar.</p>
            </Alert>

            <div className="bg-surface-highlight p-4 rounded border border-border space-y-3">
              <div className="flex justify-between">
                <span className="text-text-secondary">Destinatário</span>
                <span className="text-text-primary font-heading">{recipient}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Valor</span>
                <span className="text-text-primary">{formatCurrency(parseFloat(amount))}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Taxa ({BANK_CONFIG.transferFee * 100}%)</span>
                <span className="text-error">-{formatCurrency(fee)}</span>
              </div>
              <div className="flex justify-between border-t border-border pt-2">
                <span className="text-text-secondary">Total Debitado</span>
                <span className="text-primary font-heading">{formatCurrency(parseFloat(amount) + fee)}</span>
              </div>
              {description && (
                <div className="border-t border-border pt-2">
                  <span className="text-text-secondary text-xs">Mensagem:</span>
                  <p className="text-text-primary text-sm">{description}</p>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => setShowConfirm(false)}>
                Voltar
              </Button>
              <Button
                variant="primary"
                className="flex-1"
                onClick={handleTransfer}
                loading={loading}
                icon={Send}
              >
                Confirmar Transferência
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

const SecurityModal = ({ isOpen, onClose }) => {
  const [securityFeatures, setSecurityFeatures] = useState(SECURITY_FEATURES);

  const toggleFeature = (featureId) => {
    setSecurityFeatures(prev => 
      prev.map(f => f.id === featureId ? { ...f, enabled: !f.enabled } : f)
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Segurança da Conta" size="md">
      <div className="space-y-4">
        <Alert variant="info">
          <p className="text-xs">Ativa funcionalidades de segurança para proteger a tua conta bancária.</p>
        </Alert>

        <div className="space-y-3">
          {securityFeatures.map(feature => (
            <SecurityFeatureToggle
              key={feature.id}
              feature={feature}
              isEnabled={feature.enabled}
              onToggle={toggleFeature}
            />
          ))}
        </div>

        <div className="bg-surface-highlight p-3 rounded">
          <div className="flex items-center gap-2 mb-2">
            <ShieldCheck size={16} className="text-success" />
            <span className="text-sm text-text-primary">Pontuação de Segurança</span>
          </div>
          <ProgressBar
            value={securityFeatures.filter(f => f.enabled).length}
            max={securityFeatures.length}
            color="success"
            showLabel={true}
          />
        </div>

        <Button variant="primary" fullWidth onClick={onClose}>
          Guardar Alterações
        </Button>
      </div>
    </Modal>
  );
};

const ExportModal = ({ isOpen, onClose, transactions }) => {
  const [format, setFormat] = useState('csv');
  const [dateRange, setDateRange] = useState('all');

  const handleExport = () => {
    // Simulate export
    console.log(`Exporting ${transactions.length} transactions as ${format}`);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Exportar Transações" size="sm">
      <div className="space-y-4">
        <div>
          <p className="text-xs text-text-secondary uppercase mb-2">Formato</p>
          <div className="flex gap-2">
            {['csv', 'pdf', 'xlsx'].map(f => (
              <button
                key={f}
                onClick={() => setFormat(f)}
                className={clsx(
                  'flex-1 py-2 rounded border uppercase text-sm transition-all',
                  format === f
                    ? 'bg-primary text-background border-primary'
                    : 'bg-surface border-border text-text-secondary hover:text-text-primary'
                )}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs text-text-secondary uppercase mb-2">Período</p>
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="w-full bg-surface border border-border rounded px-3 py-2 text-text-primary"
          >
            <option value="all">Todas as transações</option>
            <option value="week">Última semana</option>
            <option value="month">Último mês</option>
            <option value="year">Último ano</option>
          </select>
        </div>

        <div className="bg-surface-highlight p-3 rounded text-center">
          <p className="text-text-secondary text-sm">
            {transactions.length} transações serão exportadas
          </p>
        </div>

        <div className="flex gap-2">
          <Button variant="secondary" fullWidth onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="primary" fullWidth onClick={handleExport} icon={Download}>
            Exportar
          </Button>
        </div>
      </div>
    </Modal>
  );
};

// ==================== COMPONENTE PRINCIPAL ====================

export default function BankPage() {
  const { api, user } = useAuth();
  const { refreshStats } = useGame();
  
  // Estados principais
  const [activeTab, setActiveTab] = useState('overview');
  const [bankStatus, setBankStatus] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [notification, setNotification] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Estados de modais
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showSecurityModal, setShowSecurityModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);

  // Estados adicionais
  const [dailyStats, setDailyStats] = useState({
    deposits: 0,
    withdrawals: 0,
    transfers: 0,
  });
  const [recentContacts, setRecentContacts] = useState([]);
  const [accountTier, setAccountTier] = useState('bronze');
  const [settings, setSettings] = useLocalStorage('bank_settings', {
    hideBalance: false,
    notifications: true,
  });

  // Efeitos
  useEffect(() => {
    fetchBankStatus();
    fetchTransactions();
  }, []);

  useEffect(() => {
    // Calculate account tier based on balance
    if (bankStatus) {
      const tier = ACCOUNT_TIERS.reduce((acc, t) => {
        if (bankStatus.bank_balance >= t.minBalance) return t.id;
        return acc;
      }, 'bronze');
      setAccountTier(tier);
    }
  }, [bankStatus]);

  // API Calls
  const fetchBankStatus = async () => {
    try {
      const response = await api().get('/bank/status');
      setBankStatus(response.data);
    } catch (err) {
      console.error('Erro ao buscar status do banco:', err);
      showNotification('Erro ao carregar dados do banco', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactions = async () => {
    try {
      const response = await api().get('/bank/transactions');
      setTransactions(response.data.transactions || []);
    } catch (err) {
      console.error('Erro ao buscar transações:', err);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([fetchBankStatus(), fetchTransactions()]);
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  // Handlers
  const showNotification = (message, type = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleDeposit = async (amount, description = '') => {
    if (!amount || amount <= 0) {
      showNotification('Valor inválido', 'error');
      return;
    }

    setActionLoading(true);
    try {
      const response = await api().post('/bank/deposit', { amount });
      showNotification(response.data.message || 'Depósito realizado com sucesso!', 'success');
      setShowDepositModal(false);
      await Promise.all([fetchBankStatus(), fetchTransactions()]);
      setDailyStats(prev => ({ ...prev, deposits: prev.deposits + 1 }));
      if (refreshStats) refreshStats();
    } catch (err) {
      showNotification(err.response?.data?.detail || 'Erro ao depositar', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleWithdraw = async (amount) => {
    if (!amount || amount <= 0) {
      showNotification('Valor inválido', 'error');
      return;
    }

    setActionLoading(true);
    try {
      const response = await api().post('/bank/withdraw', { amount });
      showNotification(response.data.message || 'Levantamento realizado com sucesso!', 'success');
      setShowWithdrawModal(false);
      await Promise.all([fetchBankStatus(), fetchTransactions()]);
      setDailyStats(prev => ({ ...prev, withdrawals: prev.withdrawals + 1 }));
      if (refreshStats) refreshStats();
    } catch (err) {
      showNotification(err.response?.data?.detail || 'Erro ao levantar', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleTransfer = async (amount, recipientId, description = '') => {
    if (!amount || amount <= 0) {
      showNotification('Valor inválido', 'error');
      return;
    }
    if (!recipientId) {
      showNotification('Destinatário obrigatório', 'error');
      return;
    }

    setActionLoading(true);
    try {
      const response = await api().post('/bank/transfer', {
        amount,
        recipient_id: recipientId
      });
      showNotification(response.data.message || 'Transferência realizada com sucesso!', 'success');
      setShowTransferModal(false);
      await Promise.all([fetchBankStatus(), fetchTransactions()]);
      setDailyStats(prev => ({ ...prev, transfers: prev.transfers + 1 }));
      if (refreshStats) refreshStats();
    } catch (err) {
      showNotification(err.response?.data?.detail || 'Erro ao transferir', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Helper functions
  const formatCurrency = (value) => `€${(value || 0).toLocaleString('pt-PT')}`;

  const tabs = [
    { id: 'overview', label: 'Visão Geral', icon: Landmark },
    { id: 'transactions', label: 'Transações', icon: History },
    { id: 'analytics', label: 'Análise', icon: BarChart2 },
    { id: 'security', label: 'Segurança', icon: Shield },
  ];

  // Loading state
  if (loading || !bankStatus) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-border border-t-primary rounded-full animate-spin mx-auto mb-4" />
          <p className="text-text-secondary">A carregar banco...</p>
        </div>
      </div>
    );
  }

  const totalBalance = bankStatus.player_cash + bankStatus.bank_balance;

  return (
    <div className="space-y-2 md:space-y-3" data-testid="bank-page">
      {/* Notification */}
      {notification && (
        <Alert variant={notification.type}>
          {notification.message}
        </Alert>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-xl md:text-2xl text-text-primary mb-0.5 flex items-center gap-2">
            <Landmark className="text-primary" />
            Banco SUBMUNDO
          </h1>
          <p className="text-text-secondary text-xs md:text-sm flex items-center gap-2">
            Gestão financeira segura
            <Badge variant={accountTier === 'platinum' ? 'gold' : accountTier === 'gold' ? 'gold' : accountTier === 'silver' ? 'secondary' : 'warning'} size="xs">
              {ACCOUNT_TIERS.find(t => t.id === accountTier)?.name || 'Bronze'}
            </Badge>
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
          <Tooltip content="Exportar">
            <button
              onClick={() => setShowExportModal(true)}
              className="p-2 bg-surface border border-border hover:border-primary rounded transition-all"
            >
              <Download size={18} className="text-text-secondary" />
            </button>
          </Tooltip>
          <Tooltip content={settings.hideBalance ? 'Mostrar Saldos' : 'Ocultar Saldos'}>
            <button
              onClick={() => setSettings(s => ({ ...s, hideBalance: !s.hideBalance }))}
              className="p-2 bg-surface border border-border hover:border-primary rounded transition-all"
            >
              {settings.hideBalance ? <EyeOff size={18} className="text-text-secondary" /> : <Eye size={18} className="text-text-secondary" />}
            </button>
          </Tooltip>
        </div>
      </div>

      {/* Balance Cards */}
      <div className="grid md:grid-cols-3 gap-2">
        <BalanceCard
          label="Dinheiro na Mão"
          value={settings.hideBalance ? 0 : bankStatus.player_cash}
          icon={Wallet}
          color="success"
          trend="up"
          trendValue={5}
          chartData={[12, 15, 18, 14, 22, 25, 28]}
          onClick={() => setShowDepositModal(true)}
          isAnimated={!settings.hideBalance}
        />
        <BalanceCard
          label="Dinheiro no Banco"
          value={settings.hideBalance ? 0 : bankStatus.bank_balance}
          icon={Landmark}
          color="primary"
          trend="up"
          trendValue={12}
          chartData={[8, 12, 10, 15, 18, 20, 22]}
          onClick={() => setShowWithdrawModal(true)}
          isAnimated={!settings.hideBalance}
        />
        <BalanceCard
          label="Património Total"
          value={settings.hideBalance ? 0 : totalBalance}
          icon={Coins}
          color="gold"
          trend="up"
          trendValue={8}
          onClick={() => {}}
          isAnimated={!settings.hideBalance}
        />
      </div>

      {/* Quick Actions */}
      <Card title="Operações Rápidas" icon={Zap}>
        <div className="grid md:grid-cols-3 gap-2">
          <Button
            variant="success"
            fullWidth
            icon={ArrowDownCircle}
            onClick={() => setShowDepositModal(true)}
            disabled={dailyStats.deposits >= BANK_CONFIG.maxDailyDeposits}
            className="h-12"
          >
            <div className="flex flex-col items-center">
              <span>Depositar</span>
              <span className="text-xs opacity-75">{dailyStats.deposits}/{BANK_CONFIG.maxDailyDeposits} hoje</span>
            </div>
          </Button>
          <Button
            variant="warning"
            fullWidth
            icon={ArrowUpCircle}
            onClick={() => setShowWithdrawModal(true)}
            disabled={dailyStats.withdrawals >= BANK_CONFIG.maxDailyWithdrawals}
            className="h-12"
          >
            <div className="flex flex-col items-center">
              <span>Levantar</span>
              <span className="text-xs opacity-75">{dailyStats.withdrawals}/{BANK_CONFIG.maxDailyWithdrawals} hoje</span>
            </div>
          </Button>
          <Button
            variant="primary"
            fullWidth
            icon={Send}
            onClick={() => setShowTransferModal(true)}
            disabled={dailyStats.transfers >= BANK_CONFIG.maxDailyTransfers}
            className="h-12"
          >
            <div className="flex flex-col items-center">
              <span>Transferir</span>
              <span className="text-xs opacity-75">{dailyStats.transfers}/{BANK_CONFIG.maxDailyTransfers} hoje</span>
            </div>
          </Button>
        </div>
      </Card>

      {/* Tips */}
      <TipsCard />

      {/* Tabs */}
      <div className="flex gap-1 md:gap-2 border-b border-border overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={clsx(
              'flex items-center gap-1.5 px-3 py-2 font-ui text-xs md:text-sm transition-all whitespace-nowrap',
              activeTab === tab.id
                ? 'text-primary border-b-2 border-primary'
                : 'text-text-secondary hover:text-text-primary'
            )}
          >
            <tab.icon size={14} />
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid lg:grid-cols-2 gap-2 md:gap-3">
          {/* Left Column */}
          <div className="space-y-2 md:space-y-3">
            <Card title="Informações da Conta" icon={Landmark}>
              <div className="space-y-2">
                <div className="flex justify-between py-1.5 border-b border-border">
                  <span className="text-text-secondary text-xs md:text-sm">Titular</span>
                  <span className="text-text-primary font-body text-xs md:text-sm">{user?.username}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-border">
                  <span className="text-text-secondary text-xs md:text-sm">Nível da Conta</span>
                  <Badge variant={accountTier === 'platinum' ? 'gold' : accountTier === 'gold' ? 'gold' : 'secondary'}>
                    {ACCOUNT_TIERS.find(t => t.id === accountTier)?.name}
                  </Badge>
                </div>
                <div className="flex justify-between py-1.5 border-b border-border">
                  <span className="text-text-secondary text-xs md:text-sm">Saldo Disponível</span>
                  <span className="text-success font-body text-xs md:text-sm">
                    {settings.hideBalance ? '••••••' : formatCurrency(bankStatus.bank_balance)}
                  </span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-border">
                  <span className="text-text-secondary text-xs md:text-sm">Total de Transações</span>
                  <span className="text-text-primary font-body text-xs md:text-sm">{transactions.length}</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-text-secondary text-xs md:text-sm">Taxa de Levantamento</span>
                  <span className="text-warning font-body text-xs md:text-sm">{BANK_CONFIG.withdrawalFee * 100}%</span>
                </div>
              </div>
            </Card>
            
            <AccountTierCard
              currentBalance={bankStatus.bank_balance}
              currentTier={accountTier}
            />
          </div>

          {/* Right Column */}
          <div className="space-y-2 md:space-y-3">
            <LimitsCard
              dailyDeposits={dailyStats.deposits}
              dailyWithdrawals={dailyStats.withdrawals}
              dailyTransfers={dailyStats.transfers}
            />
            
            <SecurityCard onViewSecurity={() => setShowSecurityModal(true)} />
            
            <RecentContactsCard
              contacts={recentContacts}
              onSelectContact={(contact) => {
                setShowTransferModal(true);
              }}
            />
          </div>
        </div>
      )}

      {activeTab === 'transactions' && (
        <Card title="Histórico de Transações" icon={History}>
          <TransactionsList
            transactions={transactions}
            isLoading={isRefreshing}
            onLoadMore={() => {}}
            hasMore={false}
          />
        </Card>
      )}

      {activeTab === 'analytics' && (
        <AnalyticsCard
          transactions={transactions}
          bankBalance={bankStatus.bank_balance}
          playerCash={bankStatus.player_cash}
        />
      )}

      {activeTab === 'security' && (
        <div className="space-y-3">
          <SecurityCard onViewSecurity={() => setShowSecurityModal(true)} />
          
          <Card title="Funcionalidades de Segurança" icon={ShieldCheck}>
            <div className="space-y-3">
              {SECURITY_FEATURES.map(feature => (
                <SecurityFeatureToggle
                  key={feature.id}
                  feature={feature}
                  isEnabled={feature.enabled}
                  onToggle={() => {}}
                />
              ))}
            </div>
          </Card>

          <Alert variant="info">
            <div className="flex items-start gap-2">
              <Info size={16} className="flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-heading">Proteção VIP</p>
                <p className="text-xs opacity-80">
                  Contas Platina têm proteção adicional contra fraudes e acesso prioritário ao suporte.
                </p>
              </div>
            </div>
          </Alert>
        </div>
      )}

      {/* Modais */}
      <DepositModal
        isOpen={showDepositModal}
        onClose={() => setShowDepositModal(false)}
        maxAmount={bankStatus.player_cash}
        onDeposit={handleDeposit}
        loading={actionLoading}
      />

      <WithdrawModal
        isOpen={showWithdrawModal}
        onClose={() => setShowWithdrawModal(false)}
        maxAmount={bankStatus.bank_balance}
        onWithdraw={handleWithdraw}
        loading={actionLoading}
      />

      <TransferModal
        isOpen={showTransferModal}
        onClose={() => setShowTransferModal(false)}
        maxAmount={bankStatus.bank_balance}
        onTransfer={handleTransfer}
        loading={actionLoading}
        recentContacts={recentContacts}
      />

      <SecurityModal
        isOpen={showSecurityModal}
        onClose={() => setShowSecurityModal(false)}
      />

      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        transactions={transactions}
      />
    </div>
  );
}

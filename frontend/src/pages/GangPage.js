import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useGame } from '../contexts/GameContext';
import { useAuth } from '../contexts/AuthContext';
import { Card, ProgressBar } from '../components/ProgressBar';
import { Button, Badge, Modal, Input, Alert } from '../components/UI';
import { useMissionTimer } from '../hooks/useCountdown';
import { GangSystem } from '../utils/gameLogic';
import { GANGS_LORE } from '../data/lore';
import { 
  Users, Crown, Shield, DollarSign, Map, 
  Plus, LogOut, Swords, ChevronRight, Clock,
  Wallet, Target, AlertTriangle, TrendingUp, Eye,
  Info, Zap, Star, Award, Trophy, Medal, Gift,
  Sparkles, Heart, Skull, Flame, Crosshair, Flag,
  MapPin, Navigation, Building, Home, Factory,
  RefreshCw, Search, Filter, Grid, List, SortAsc, SortDesc,
  ChevronDown, ChevronUp, ChevronLeft, MoreHorizontal,
  Settings, Bell, Bookmark, BookmarkCheck, Copy, Share2,
  ExternalLink, Download, Upload, Edit, Save, Trash2,
  Check, X, Lock, Unlock, Key, Fingerprint,
  BarChart2, PieChart, Activity, TrendingDown, Percent,
  Calendar, Timer, Hourglass, Play, Pause, Square,
  MessageSquare, MessageCircle, Mail, Send, UserPlus,
  UserMinus, UserCheck, UserX, User, Users2,
  Coins, Banknote, CreditCard, PiggyBank, CircleDollarSign,
  Hash, AtSign, Link, CheckCircle, XCircle, AlertCircle,
  HelpCircle, Loader2, Volume2, VolumeX, Smile, Frown
} from 'lucide-react';
import clsx from 'clsx';

// ==================== CONSTANTES E CONFIGURAÇÕES ====================

const GANG_CONFIG = {
  maxMembers: 50,
  minMembersForWar: 3,
  warCooldownHours: 24,
  depositFee: 0,
  withdrawalFee: 0.05,
  territoryBonusMultiplier: 1.1,
  rankUpdateInterval: 60000,
};

const GANG_RANKS = [
  { id: 'recruit', label: 'Recruta', minRep: 0, icon: User, color: 'secondary' },
  { id: 'soldier', label: 'Soldado', minRep: 100, icon: Shield, color: 'primary' },
  { id: 'captain', label: 'Capitão', minRep: 500, icon: Star, color: 'warning' },
  { id: 'lieutenant', label: 'Tenente', minRep: 1000, icon: Crown, color: 'gold' },
  { id: 'boss', label: 'Chefe', minRep: 5000, icon: Crown, color: 'error' },
];

const GANG_ACTIVITIES = {
  HEIST: { id: 'heist', label: 'Assalto', icon: Target, color: 'error', requiredRank: 'soldier' },
  TURF_WAR: { id: 'turf_war', label: 'Guerra de Território', icon: Swords, color: 'warning', requiredRank: 'captain' },
  RECRUITMENT: { id: 'recruitment', label: 'Recrutamento', icon: UserPlus, color: 'success', requiredRank: 'recruit' },
  TREASURY: { id: 'treasury', label: 'Tesouraria', icon: Wallet, color: 'gold', requiredRank: 'soldier' },
  MEETINGS: { id: 'meetings', label: 'Reuniões', icon: MessageSquare, color: 'primary', requiredRank: 'recruit' },
};

const WAR_STRATEGIES = [
  { id: 'offensive', name: 'Ofensiva', description: 'Ataque direto com força máxima', bonus: '+20% poder de ataque, -10% defesa', icon: Swords },
  { id: 'defensive', name: 'Defensiva', description: 'Proteger território a todo custo', bonus: '+20% defesa, -10% ataque', icon: Shield },
  { id: 'guerrilla', name: 'Guerrilha', description: 'Táticas de emboscada', bonus: '+15% sucesso de surpresa', icon: Crosshair },
  { id: 'diplomatic', name: 'Diplomática', description: 'Tentar negociação antes do conflito', bonus: 'Chance de resolver sem luta', icon: Handshake },
];

const GANG_TIPS = [
  'Uma gangue forte precisa de membros ativos e dedicados.',
  'Guerras de território são arriscadas mas muito lucrativas.',
  'Contribui para a tesouraria para desbloquear upgrades.',
  'Recruta membros com habilidades complementares.',
  'Defende os teus territórios para manter os bónus.',
  'O líder pode expulsar membros inativos.',
  'Alianças temporárias podem ser úteis contra inimigos comuns.',
];

const TERRITORY_BONUSES = {
  income: { label: 'Bónus de Rendimento', icon: DollarSign, color: 'gold' },
  respect: { label: 'Bónus de Respeito', icon: Star, color: 'warning' },
  protection: { label: 'Proteção', icon: Shield, color: 'primary' },
  recruitment: { label: 'Bónus de Recrutamento', icon: UserPlus, color: 'success' },
};

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
        <div className={clsx('absolute z-50 px-2 py-1 text-xs bg-surface border border-border rounded shadow-lg whitespace-nowrap', positions[position])}>
          {content}
        </div>
      )}
    </div>
  );
};

const Skeleton = ({ className = '' }) => (
  <div className={clsx('animate-pulse bg-surface-highlight rounded', className)} />
);

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

const StatCard = ({ icon: Icon, label, value, color = 'primary', subtext, trend }) => (
  <div className="bg-surface border border-border rounded-lg p-3 hover:border-primary/30 transition-all">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-text-secondary text-xs uppercase mb-1">{label}</p>
        <div className="flex items-baseline gap-2">
          <p className={`text-xl font-mono text-${color}`}>{value}</p>
          {trend && (
            <span className={clsx('flex items-center text-xs', trend > 0 ? 'text-success' : 'text-error')}>
              {trend > 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              {Math.abs(trend)}%
            </span>
          )}
        </div>
        {subtext && <p className="text-xs text-text-secondary mt-1">{subtext}</p>}
      </div>
      <Icon size={24} className={`text-${color} opacity-50`} />
    </div>
  </div>
);

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
    </div>
  );
};

const MemberRankBadge = ({ rank }) => {
  const rankData = GANG_RANKS.find(r => r.id === rank) || GANG_RANKS[0];
  const Icon = rankData.icon;
  
  return (
    <Badge variant={rankData.color} size="sm" className="flex items-center gap-1">
      <Icon size={10} /> {rankData.label}
    </Badge>
  );
};

const GangMemberCard = ({ member, isLeader, canKick, onKick, onPromote }) => (
  <div className="flex items-center justify-between p-3 bg-surface-highlight border border-border rounded hover:border-primary/30 transition-all">
    <div className="flex items-center gap-3">
      <div className={clsx(
        'w-10 h-10 rounded-full flex items-center justify-center',
        isLeader ? 'bg-gold/20 border border-gold' : 'bg-primary/20 border border-primary/30'
      )}>
        {isLeader ? <Crown size={16} className="text-gold" /> : <User size={16} className="text-primary" />}
      </div>
      <div>
        <div className="flex items-center gap-2">
          <p className="font-heading text-text-primary">{member.username}</p>
          {isLeader && <Badge variant="gold" size="xs">Líder</Badge>}
        </div>
        <div className="flex items-center gap-2 text-xs text-text-secondary">
          <MemberRankBadge rank={member.rank} />
          <span>Rep: {member.reputation || 0}</span>
        </div>
      </div>
    </div>
    {canKick && !isLeader && (
      <div className="flex gap-1">
        {onPromote && (
          <Tooltip content="Promover">
            <button onClick={() => onPromote(member.id)} className="p-2 hover:bg-success/20 rounded transition-all">
              <TrendingUp size={14} className="text-success" />
            </button>
          </Tooltip>
        )}
        <Tooltip content="Expulsar">
          <button onClick={() => onKick(member.id)} className="p-2 hover:bg-error/20 rounded transition-all">
            <UserMinus size={14} className="text-error" />
          </button>
        </Tooltip>
      </div>
    )}
  </div>
);

const TerritoryCard = ({ territory, isOwned, canAttack, onAttack, loading }) => {
  const bonusTypes = territory.bonuses || [];
  
  return (
    <div className={clsx(
      'p-4 border rounded-lg transition-all',
      isOwned ? 'bg-primary/10 border-primary' : 'bg-surface border-border hover:border-primary/50'
    )}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2">
            <MapPin size={16} className={isOwned ? 'text-primary' : 'text-text-secondary'} />
            <h4 className="font-heading text-text-primary">{territory.name}</h4>
          </div>
          <p className="text-xs text-text-secondary mt-1">
            {territory.controller_name ? `Controlado por: ${territory.controller_name}` : 'Sem controlo'}
          </p>
        </div>
        {isOwned && <Badge variant="primary">Teu</Badge>}
      </div>
      
      {/* Bonuses */}
      <div className="flex flex-wrap gap-2 mb-3">
        {bonusTypes.map((bonus, idx) => {
          const config = TERRITORY_BONUSES[bonus.type] || TERRITORY_BONUSES.income;
          const Icon = config.icon;
          return (
            <Badge key={idx} variant={config.color} size="xs">
              <Icon size={10} className="mr-1" /> +{bonus.value}% {config.label}
            </Badge>
          );
        })}
      </div>
      
      {/* Stats */}
      <div className="grid grid-cols-2 gap-2 text-xs mb-3">
        <div className="p-2 bg-background rounded">
          <span className="text-text-secondary">Defesa</span>
          <p className="font-mono text-text-primary">{territory.defense || 0}</p>
        </div>
        <div className="p-2 bg-background rounded">
          <span className="text-text-secondary">Valor</span>
          <p className="font-mono text-gold">{territory.value || 0}</p>
        </div>
      </div>
      
      {canAttack && !isOwned && (
        <Button
          variant="error"
          fullWidth
          size="sm"
          onClick={() => onAttack(territory)}
          loading={loading}
          icon={Swords}
        >
          Atacar
        </Button>
      )}
    </div>
  );
};

const WarStrategySelector = ({ strategies, selected, onSelect }) => (
  <div className="space-y-2">
    <p className="text-xs text-text-secondary uppercase mb-2">Estratégia de Guerra</p>
    {strategies.map(strategy => {
      const Icon = strategy.icon;
      const isSelected = selected?.id === strategy.id;
      
      return (
        <button
          key={strategy.id}
          onClick={() => onSelect(strategy)}
          className={clsx(
            'w-full p-3 rounded border text-left transition-all',
            isSelected ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'
          )}
        >
          <div className="flex items-center gap-3">
            <Icon size={20} className={isSelected ? 'text-primary' : 'text-text-secondary'} />
            <div className="flex-1">
              <p className="font-heading text-text-primary text-sm">{strategy.name}</p>
              <p className="text-xs text-text-secondary">{strategy.description}</p>
              <Badge variant="secondary" size="xs" className="mt-1">{strategy.bonus}</Badge>
            </div>
            {isSelected && <Check size={16} className="text-primary" />}
          </div>
        </button>
      );
    })}
  </div>
);

const GangActivityCard = ({ activity, isAvailable, onClick }) => {
  const Icon = activity.icon;
  
  return (
    <button
      onClick={onClick}
      disabled={!isAvailable}
      className={clsx(
        'p-4 border rounded-lg text-left transition-all',
        isAvailable 
          ? `border-${activity.color}/30 hover:border-${activity.color} bg-${activity.color}/5`
          : 'border-border opacity-50 cursor-not-allowed'
      )}
    >
      <div className="flex items-center gap-3">
        <div className={clsx('w-12 h-12 rounded-lg flex items-center justify-center', `bg-${activity.color}/20`)}>
          <Icon size={24} className={`text-${activity.color}`} />
        </div>
        <div>
          <p className="font-heading text-text-primary">{activity.label}</p>
          <p className="text-xs text-text-secondary">
            Requer: {GANG_RANKS.find(r => r.id === activity.requiredRank)?.label || 'Recruta'}
          </p>
        </div>
      </div>
      {!isAvailable && (
        <div className="flex items-center gap-1 mt-2 text-xs text-text-secondary">
          <Lock size={10} /> Rank insuficiente
        </div>
      )}
    </button>
  );
};

const GangLeaderboard = ({ gangs, myGangId }) => (
  <div className="space-y-2">
    {gangs.slice(0, 10).map((gang, idx) => {
      const isMyGang = gang.id === myGangId;
      const position = idx + 1;
      
      return (
        <div key={gang.id} className={clsx(
          'flex items-center justify-between p-3 rounded border',
          isMyGang ? 'bg-primary/10 border-primary' : 'bg-surface border-border'
        )}>
          <div className="flex items-center gap-3">
            <div className={clsx(
              'w-8 h-8 rounded-full flex items-center justify-center font-heading text-sm',
              position === 1 ? 'bg-gold/20 text-gold' :
              position === 2 ? 'bg-secondary/20 text-secondary' :
              position === 3 ? 'bg-warning/20 text-warning' :
              'bg-surface-highlight text-text-secondary'
            )}>
              {position}
            </div>
            <div>
              <p className="font-heading text-text-primary">[{gang.tag}] {gang.name}</p>
              <p className="text-xs text-text-secondary">{gang.member_count || 0} membros</p>
            </div>
          </div>
          <div className="text-right">
            <p className="font-mono text-gold">€{(gang.treasury || 0).toLocaleString()}</p>
            <p className="text-xs text-text-secondary">{gang.territories_count || 0} territórios</p>
          </div>
        </div>
      );
    })}
  </div>
);

const Handshake = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M20.42 4.58a5.4 5.4 0 0 0-7.65 0l-.77.78-.77-.78a5.4 5.4 0 0 0-7.65 0C1.46 6.7 1.33 10.28 4 13l8 8 8-8c2.67-2.72 2.54-6.3.42-8.42z"/>
    <path d="M3 5 1.5 3.5"/>
    <path d="M21 5l1.5-1.5"/>
  </svg>
);

// ==================== COMPONENTE PRINCIPAL ====================

export default function GangPage() {
  const { user, api } = useAuth();
  const { 
    myGang, 
    gangWars, 
    neighborhoods,
    actionLoading, 
    createGang, 
    joinGang, 
    leaveGang, 
    depositToTreasury,
    startWar,
    resolveWar,
    showNotification 
  } = useGame();
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showWarModal, setShowWarModal] = useState(false);
  const [selectedNeighborhood, setSelectedNeighborhood] = useState(null);
  const [gangsList, setGangsList] = useState([]);
  const [newGang, setNewGang] = useState({ name: '', tag: '' });
  const [depositAmount, setDepositAmount] = useState('');
  const [loadingGangs, setLoadingGangs] = useState(false);
  const [activeTab, setActiveTab] = useState('info');
  const [territoryAnalysis, setTerritoryAnalysis] = useState(null);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);

  useEffect(() => {
    fetchGangs();
  }, []);

  useEffect(() => {
    if (myGang && activeTab === 'territories') {
      fetchTerritoryAnalysis();
    }
  }, [myGang, activeTab]);

  const fetchTerritoryAnalysis = async () => {
    setLoadingAnalysis(true);
    try {
      const response = await api().get('/territories/analysis');
      setTerritoryAnalysis(response.data);
    } catch (err) {
      console.error('Erro ao buscar análise de territórios:', err);
    } finally {
      setLoadingAnalysis(false);
    }
  };

  const fetchGangs = async () => {
    setLoadingGangs(true);
    try {
      const response = await api().get('/gangs');
      setGangsList(response.data);
    } catch (err) {
      console.error('Erro ao buscar gangues:', err);
    } finally {
      setLoadingGangs(false);
    }
  };

  const handleCreateGang = async () => {
    if (!newGang.name || !newGang.tag) {
      showNotification('Preenche todos os campos', 'error');
      return;
    }
    if (newGang.tag.length > 4) {
      showNotification('Tag deve ter no máximo 4 caracteres', 'error');
      return;
    }
    await createGang(newGang.name, newGang.tag);
    setShowCreateModal(false);
    setNewGang({ name: '', tag: '' });
    fetchGangs();
  };

  const handleJoinGang = async (gangId) => {
    await joinGang(gangId);
    fetchGangs();
  };

  const handleLeaveGang = async () => {
    await leaveGang();
    setShowLeaveModal(false);
    fetchGangs();
  };

  const handleDeposit = async () => {
    const amount = parseFloat(depositAmount);
    if (isNaN(amount) || amount <= 0) {
      showNotification('Montante inválido', 'error');
      return;
    }
    await depositToTreasury(amount);
    setShowDepositModal(false);
    setDepositAmount('');
  };

  const handleStartWar = async () => {
    if (selectedNeighborhood) {
      await startWar(selectedNeighborhood.id);
      setShowWarModal(false);
      setSelectedNeighborhood(null);
    }
  };

  const isLeader = myGang && myGang.leader_id === user?.id;

  // Get available territories for attack
  const availableTerritories = neighborhoods.filter(n => 
    n.controlling_gang !== myGang?.id && 
    !gangWars.some(w => w.neighborhood_id === n.id && w.status === 'active')
  );

  return (
    <div className="space-y-6 animate-fade-in" data-testid="gang-page">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-heading text-2xl md:text-3xl text-text-primary flex items-center gap-3">
            <Users className="text-primary" size={28} />
            Gangue
          </h1>
          <p className="text-text-secondary text-sm mt-1">
            {myGang ? `Membro de ${myGang.name}` : 'Junta-te ou cria uma gangue'}
          </p>
        </div>
        
        {!myGang && (
          <Button
            variant="primary"
            icon={Plus}
            onClick={() => setShowCreateModal(true)}
            data-testid="create-gang-btn"
          >
            Criar Gangue
          </Button>
        )}
      </div>

      {/* My Gang Section */}
      {myGang && (
        <>
          {/* Gang Header Card */}
          <Card className="border-gold">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-surface-highlight border border-gold flex items-center justify-center">
                  <Shield size={32} className="text-gold" />
                </div>
                <div>
                  <h2 className="font-heading text-2xl text-text-primary flex items-center gap-2">
                    {myGang.name}
                    <Badge variant="gold">[{myGang.tag}]</Badge>
                  </h2>
                  <p className="text-text-secondary text-sm">
                    Fundada por {myGang.leader_name}
                  </p>
                </div>
              </div>
              {isLeader && (
                <Badge variant="gold">
                  <Crown size={12} className="mr-1" />
                  Líder
                </Badge>
              )}
            </div>

            {/* Gang Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-surface-highlight border border-border p-4 text-center">
                <p className="text-2xl font-body text-primary">{myGang.members_count || myGang.members?.length || 1}</p>
                <p className="text-xs text-text-secondary uppercase tracking-wider">Membros</p>
              </div>
              <div className="bg-surface-highlight border border-border p-4 text-center">
                <p className="text-2xl font-body text-gold">{myGang.reputation}</p>
                <p className="text-xs text-text-secondary uppercase tracking-wider">Reputação</p>
              </div>
              <div className="bg-surface-highlight border border-border p-4 text-center">
                <p className="text-2xl font-body text-success">€{myGang.treasury?.toFixed(0) || 0}</p>
                <p className="text-xs text-text-secondary uppercase tracking-wider">Cofre</p>
              </div>
              <div className="bg-surface-highlight border border-border p-4 text-center">
                <p className="text-2xl font-body text-secondary">{myGang.territories?.length || 0}</p>
                <p className="text-xs text-text-secondary uppercase tracking-wider">Territórios</p>
              </div>
            </div>
          </Card>

          {/* Tabs */}
          <div className="flex gap-2 border-b border-border overflow-x-auto">
            {[
              { id: 'info', label: 'Informações' },
              { id: 'wars', label: `Guerras (${gangWars.length})` },
              { id: 'territories', label: 'Territórios' },
            ].map(({ id, label }) => (
              <button
                key={id}
                className={clsx(
                  'px-4 py-3 font-ui text-sm uppercase tracking-wider transition-all whitespace-nowrap',
                  activeTab === id ? 'text-primary border-b-2 border-primary' : 'text-text-secondary hover:text-text-primary'
                )}
                onClick={() => setActiveTab(id)}
                data-testid={`tab-${id}`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Info Tab */}
          {activeTab === 'info' && (
            <div className="space-y-4">
              {/* Members List */}
              {myGang.members && myGang.members.length > 0 && (
                <Card title="Membros" icon={Users}>
                  <div className="space-y-2">
                    {myGang.members.map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center justify-between p-3 bg-surface-highlight border border-border"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-surface border border-border flex items-center justify-center">
                            {member.id === myGang.leader_id ? (
                              <Crown size={18} className="text-gold" />
                            ) : (
                              <Users size={18} className="text-text-secondary" />
                            )}
                          </div>
                          <div>
                            <p className="text-text-primary font-body">{member.username}</p>
                            <p className="text-xs text-text-secondary">Nível {member.level}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-success text-sm">€{member.total_earnings?.toFixed(0) || 0}</p>
                          <p className="text-xs text-text-secondary">total ganho</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* Actions */}
              <div className="flex flex-wrap gap-3">
                <Button
                  variant="primary"
                  onClick={() => setShowDepositModal(true)}
                  icon={Wallet}
                  data-testid="deposit-btn"
                >
                  Depositar no Cofre
                </Button>
                <Button
                  variant="danger"
                  onClick={() => setShowLeaveModal(true)}
                  icon={LogOut}
                  data-testid="leave-gang-btn"
                >
                  Sair da Gangue
                </Button>
              </div>
            </div>
          )}

          {/* Wars Tab */}
          {activeTab === 'wars' && (
            <div className="space-y-4">
              {/* Start War Button (Leader Only) */}
              {isLeader && (
                <Card>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-heading text-lg text-text-primary">Iniciar Guerra</h3>
                      <p className="text-text-secondary text-sm">Ataca um território para o conquistar.</p>
                    </div>
                    <Button
                      variant="primary"
                      icon={Swords}
                      onClick={() => setShowWarModal(true)}
                      disabled={availableTerritories.length === 0}
                      data-testid="start-war-btn"
                    >
                      Atacar Território
                    </Button>
                  </div>
                </Card>
              )}

              {/* Active Wars */}
              {gangWars.length === 0 ? (
                <Card>
                  <div className="text-center py-8">
                    <Swords size={48} className="mx-auto text-text-secondary mb-4" />
                    <p className="text-text-secondary">Nenhuma guerra ativa.</p>
                    {isLeader && (
                      <p className="text-text-secondary text-sm mt-2">Como líder, podes iniciar guerras por territórios.</p>
                    )}
                  </div>
                </Card>
              ) : (
                <div className="space-y-4">
                  {gangWars.map((war) => (
                    <WarCard 
                      key={war.id} 
                      war={war} 
                      myGangId={myGang.id}
                      onResolve={() => resolveWar(war.id)}
                      loading={actionLoading}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Territories Tab */}
          {activeTab === 'territories' && (
            <div className="space-y-4">
              {/* Gang Power Analysis */}
              {territoryAnalysis && (
                <Card title="Poder da Gangue" icon={Zap} className="border-gold">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <p className="text-3xl font-mono text-gold">{territoryAnalysis.our_gang?.power?.toFixed(0) || 0}</p>
                      <p className="text-xs text-text-secondary uppercase">Poder Total</p>
                    </div>
                    <div className="text-center">
                      <p className="text-3xl font-mono text-primary">{territoryAnalysis.our_gang?.members_count || 0}</p>
                      <p className="text-xs text-text-secondary uppercase">Membros</p>
                    </div>
                    <div className="text-center">
                      <p className="text-3xl font-mono text-success">{territoryAnalysis.our_gang?.territories_count || 0}</p>
                      <p className="text-xs text-text-secondary uppercase">Territórios</p>
                    </div>
                    <div className="text-center">
                      <p className="text-3xl font-mono text-secondary">
                        {territoryAnalysis.territories?.filter(t => t.can_attack).length || 0}
                      </p>
                      <p className="text-xs text-text-secondary uppercase">Alvos Possíveis</p>
                    </div>
                  </div>
                </Card>
              )}

              {/* Territory Analysis Grid */}
              {loadingAnalysis ? (
                <Card>
                  <div className="text-center py-8">
                    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-text-secondary">A analisar territórios...</p>
                  </div>
                </Card>
              ) : territoryAnalysis ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {territoryAnalysis.territories?.map((territory) => (
                    <div
                      key={territory.id}
                      className={clsx(
                        'bg-surface border p-4',
                        territory.status === 'controlled' ? 'border-gold' : 
                        territory.status === 'enemy_controlled' ? 'border-error' : 'border-border'
                      )}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className={clsx(
                            'w-10 h-10 flex items-center justify-center border',
                            territory.status === 'controlled' ? 'bg-gold/20 border-gold' :
                            territory.status === 'enemy_controlled' ? 'bg-error/20 border-error' :
                            'bg-surface-highlight border-border'
                          )}>
                            <Map size={20} className={
                              territory.status === 'controlled' ? 'text-gold' :
                              territory.status === 'enemy_controlled' ? 'text-error' :
                              'text-text-secondary'
                            } />
                          </div>
                          <div>
                            <h3 className="font-heading text-lg text-text-primary">{territory.name}</h3>
                            <Badge 
                              variant={
                                territory.status === 'controlled' ? 'gold' :
                                territory.status === 'enemy_controlled' ? 'error' : 'secondary'
                              }
                            >
                              {territory.status === 'controlled' ? 'NOSSO' :
                               territory.status === 'enemy_controlled' ? territory.controller :
                               'NEUTRO'}
                            </Badge>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-success text-lg font-mono">€{territory.potential_income?.toFixed(0) || 0}</p>
                          <p className="text-xs text-text-secondary">rendimento/h</p>
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="flex gap-4 text-sm mb-3">
                        <span className="text-primary">Valor: {territory.economic_value}</span>
                        <span className="text-error">Heat: {territory.heat_level}%</span>
                      </div>

                      {/* War Prediction */}
                      {territory.war_prediction && territory.can_attack && (
                        <div className={clsx(
                          'p-3 rounded-lg mb-3',
                          territory.war_prediction.attacker_chance > 60 ? 'bg-success/10 border border-success/30' :
                          territory.war_prediction.attacker_chance > 40 ? 'bg-warning/10 border border-warning/30' :
                          'bg-error/10 border border-error/30'
                        )}>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs text-text-secondary uppercase">Previsão de Guerra</span>
                            <Badge 
                              variant={
                                territory.war_prediction.attacker_chance > 60 ? 'success' :
                                territory.war_prediction.attacker_chance > 40 ? 'warning' : 'error'
                              }
                            >
                              {territory.war_prediction.recommendation}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                              <span className="text-text-secondary">Nossa chance:</span>
                              <span className={clsx(
                                'ml-2 font-mono',
                                territory.war_prediction.attacker_chance > 50 ? 'text-success' : 'text-error'
                              )}>
                                {territory.war_prediction.attacker_chance?.toFixed(0) || 0}%
                              </span>
                            </div>
                            {territory.war_prediction.our_power && (
                              <div>
                                <span className="text-text-secondary">Nosso poder:</span>
                                <span className="ml-2 font-mono text-primary">
                                  {territory.war_prediction.our_power?.toFixed(0)}
                                </span>
                              </div>
                            )}
                            {territory.war_prediction.enemy_power && (
                              <div>
                                <span className="text-text-secondary">Poder inimigo:</span>
                                <span className="ml-2 font-mono text-error">
                                  {territory.war_prediction.enemy_power?.toFixed(0)}
                                </span>
                              </div>
                            )}
                            {territory.war_prediction.estimated_losses && (
                              <div>
                                <span className="text-text-secondary">Perdas estimadas:</span>
                                <span className="ml-2 font-mono text-warning">
                                  {territory.war_prediction.estimated_losses?.toFixed(0)}%
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Action Button */}
                      {territory.can_attack && isLeader && (
                        <Button
                          variant={territory.war_prediction?.attacker_chance > 50 ? 'primary' : 'secondary'}
                          fullWidth
                          icon={Swords}
                          onClick={() => {
                            setSelectedNeighborhood(territory);
                            setShowWarModal(true);
                          }}
                          disabled={actionLoading}
                        >
                          Atacar Território
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              ) : myGang.territories?.length === 0 ? (
                <Card>
                  <div className="text-center py-8">
                    <Map size={48} className="mx-auto text-text-secondary mb-4" />
                    <p className="text-text-secondary">A tua gangue ainda não controla territórios.</p>
                    <p className="text-text-secondary text-sm mt-2">Inicia guerras para conquistar bairros!</p>
                  </div>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {myGang.territories.map((territoryId) => {
                    const territory = neighborhoods.find(n => n.id === territoryId);
                    if (!territory) return null;
                    
                    return (
                      <div
                        key={territoryId}
                        className="bg-surface border border-gold p-4"
                      >
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-10 h-10 bg-gold/20 border border-gold flex items-center justify-center">
                            <Map size={20} className="text-gold" />
                          </div>
                          <div>
                            <h3 className="font-heading text-lg text-text-primary">{territory.name}</h3>
                            <Badge variant="gold">CONTROLADO</Badge>
                          </div>
                        </div>
                        <p className="text-text-secondary text-sm">{territory.description}</p>
                        <div className="flex gap-4 mt-3 text-sm">
                          <span className="text-success">Valor: {territory.economic_value}</span>
                          <span className="text-error">Heat: {territory.heat_level}%</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Gang Warfare Lore */}
              <Card title="Regras de Guerra" icon={Info}>
                <div className="space-y-3 text-sm text-text-secondary">
                  {GANGS_LORE.systemInfo.warfare.rules.map((rule, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      <span>{rule}</span>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}
        </>
      )}

      {/* Available Gangs (when not in a gang) */}
      {!myGang && (
        <>
          <h2 className="font-heading text-xl text-text-primary">Gangues Disponíveis</h2>
          
          {loadingGangs ? (
            <Card>
              <div className="text-center py-8">
                <p className="text-text-secondary">A carregar gangues...</p>
              </div>
            </Card>
          ) : gangsList.length === 0 ? (
            <Card>
              <div className="text-center py-8">
                <Users size={48} className="mx-auto text-text-secondary mb-4" />
                <p className="text-text-secondary mb-4">Ainda não existem gangues.</p>
                <Button
                  variant="primary"
                  onClick={() => setShowCreateModal(true)}
                >
                  Criar a Primeira Gangue
                </Button>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {gangsList.map((gang) => (
                <div
                  key={gang.id}
                  className="bg-surface border border-border p-4 relative overflow-hidden"
                  data-testid={`gang-${gang.id}`}
                >
                  <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
                  
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-heading text-lg text-text-primary flex items-center gap-2">
                        {gang.name}
                        <Badge variant="primary">[{gang.tag}]</Badge>
                      </h3>
                      <p className="text-text-secondary text-sm">Líder: {gang.leader_name}</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-4 text-sm mb-4">
                    <span className="text-text-secondary">
                      <Users size={14} className="inline mr-1" />
                      {gang.members_count} membros
                    </span>
                    <span className="text-gold">
                      <Shield size={14} className="inline mr-1" />
                      {gang.reputation} rep
                    </span>
                    <span className="text-secondary">
                      <Map size={14} className="inline mr-1" />
                      {gang.territories?.length || 0} territórios
                    </span>
                  </div>
                  
                  <Button
                    variant="primary"
                    fullWidth
                    onClick={() => handleJoinGang(gang.id)}
                    loading={actionLoading}
                    data-testid={`join-gang-${gang.id}`}
                  >
                    Juntar-me
                  </Button>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Create Gang Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Criar Gangue"
      >
        <div className="space-y-4">
          <Input
            label="Nome da Gangue"
            placeholder="Os Invencíveis"
            value={newGang.name}
            onChange={(e) => setNewGang({ ...newGang, name: e.target.value })}
            data-testid="gang-name-input"
          />
          <Input
            label="Tag (máx. 4 caracteres)"
            placeholder="INVS"
            maxLength={4}
            value={newGang.tag}
            onChange={(e) => setNewGang({ ...newGang, tag: e.target.value.toUpperCase() })}
            data-testid="gang-tag-input"
          />
          <div className="flex gap-3">
            <Button variant="secondary" fullWidth onClick={() => setShowCreateModal(false)}>
              Cancelar
            </Button>
            <Button
              variant="primary"
              fullWidth
              onClick={handleCreateGang}
              loading={actionLoading}
              data-testid="confirm-create-gang"
            >
              Criar
            </Button>
          </div>
        </div>
      </Modal>

      {/* Leave Gang Modal */}
      <Modal
        isOpen={showLeaveModal}
        onClose={() => setShowLeaveModal(false)}
        title="Sair da Gangue"
      >
        <div className="space-y-4">
          <p className="text-text-secondary">
            Tens a certeza que queres sair de <strong className="text-text-primary">{myGang?.name}</strong>?
          </p>
          {isLeader && (
            <div className="bg-warning/10 border border-warning/30 p-3 text-warning text-sm">
              Como líder, a liderança será transferida para outro membro. Se fores o único membro, a gangue será eliminada.
            </div>
          )}
          <div className="flex gap-3">
            <Button variant="secondary" fullWidth onClick={() => setShowLeaveModal(false)}>
              Cancelar
            </Button>
            <Button
              variant="danger"
              fullWidth
              onClick={handleLeaveGang}
              loading={actionLoading}
              data-testid="confirm-leave-gang"
            >
              Sair
            </Button>
          </div>
        </div>
      </Modal>

      {/* Deposit Modal */}
      <Modal
        isOpen={showDepositModal}
        onClose={() => setShowDepositModal(false)}
        title="Depositar no Cofre"
      >
        <div className="space-y-4">
          <div className="bg-surface-highlight border border-border p-4">
            <div className="flex justify-between mb-2">
              <span className="text-text-secondary">Cofre atual:</span>
              <span className="text-success">€{myGang?.treasury?.toFixed(2) || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary">Teu dinheiro limpo:</span>
              <span className="text-success">€{user?.clean_money?.toFixed(2) || 0}</span>
            </div>
          </div>
          
          <Input
            label="Montante a depositar"
            type="number"
            placeholder="1000"
            value={depositAmount}
            onChange={(e) => setDepositAmount(e.target.value)}
            data-testid="deposit-amount-input"
          />
          
          <div className="flex gap-3">
            <Button variant="secondary" fullWidth onClick={() => setShowDepositModal(false)}>
              Cancelar
            </Button>
            <Button
              variant="primary"
              fullWidth
              onClick={handleDeposit}
              loading={actionLoading}
              data-testid="confirm-deposit"
            >
              Depositar
            </Button>
          </div>
        </div>
      </Modal>

      {/* Start War Modal */}
      <Modal
        isOpen={showWarModal}
        onClose={() => setShowWarModal(false)}
        title="Atacar Território"
      >
        <div className="space-y-4">
          <p className="text-text-secondary text-sm">
            Seleciona um território para atacar. O custo da guerra é baseado no valor económico do bairro.
          </p>
          
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {availableTerritories.map((territory) => {
              const warCost = territory.economic_value * 100;
              const canAfford = (myGang?.treasury || 0) >= warCost;
              
              return (
                <div
                  key={territory.id}
                  className={clsx(
                    'p-3 border cursor-pointer transition-all',
                    selectedNeighborhood?.id === territory.id 
                      ? 'bg-primary/20 border-primary' 
                      : 'bg-surface-highlight border-border hover:border-primary/50',
                    !canAfford && 'opacity-50'
                  )}
                  onClick={() => canAfford && setSelectedNeighborhood(territory)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-heading text-text-primary">{territory.name}</h4>
                      <p className="text-text-secondary text-xs">
                        {territory.controlling_gang ? 'Controlado por gangue' : 'Território neutro'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={clsx('font-body', canAfford ? 'text-success' : 'text-error')}>
                        €{warCost}
                      </p>
                      <p className="text-text-secondary text-xs">custo</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          
          {selectedNeighborhood && (
            <div className="bg-surface-highlight border border-border p-3">
              <div className="flex justify-between">
                <span className="text-text-secondary">Cofre da gangue:</span>
                <span className="text-success">€{myGang?.treasury?.toFixed(0) || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Custo da guerra:</span>
                <span className="text-error">-€{selectedNeighborhood.economic_value * 100}</span>
              </div>
            </div>
          )}
          
          <div className="flex gap-3">
            <Button variant="secondary" fullWidth onClick={() => setShowWarModal(false)}>
              Cancelar
            </Button>
            <Button
              variant="primary"
              fullWidth
              onClick={handleStartWar}
              loading={actionLoading}
              disabled={!selectedNeighborhood}
              icon={Swords}
              data-testid="confirm-war"
            >
              Iniciar Guerra
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// War Card Component
function WarCard({ war, myGangId, onResolve, loading }) {
  const isAttacker = war.attacker_gang_id === myGangId;
  
  const { progress, isComplete, formatRemaining } = useMissionTimer(
    war.started_at,
    300 // 5 minutes
  );

  return (
    <div className={clsx(
      'bg-surface border p-4',
      isAttacker ? 'border-primary' : 'border-error'
    )}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2">
            <Swords size={20} className={isAttacker ? 'text-primary' : 'text-error'} />
            <h3 className="font-heading text-lg text-text-primary">
              Guerra por {war.neighborhood_name}
            </h3>
          </div>
          <Badge variant={isAttacker ? 'primary' : 'error'} className="mt-1">
            {isAttacker ? 'ATACANTE' : 'DEFENSOR'}
          </Badge>
        </div>
        <div className="text-right">
          <div className="flex items-center gap-2 text-warning">
            <Clock size={14} />
            <span className="font-body">{isComplete ? 'Pronta!' : formatRemaining()}</span>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-surface-highlight border border-border p-3 text-center">
          <p className="text-xs text-text-secondary uppercase">Atacante</p>
          <p className="text-primary font-body">{war.attacker_gang_name}</p>
          <p className="text-xs text-text-secondary">Poder: {war.attacker_power?.toFixed(0)}</p>
        </div>
        <div className="bg-surface-highlight border border-border p-3 text-center">
          <p className="text-xs text-text-secondary uppercase">Defensor</p>
          <p className="text-error font-body">{war.defender_gang_name}</p>
          <p className="text-xs text-text-secondary">Poder: {war.defender_power?.toFixed(0)}</p>
        </div>
      </div>
      
      <ProgressBar
        value={progress}
        max={100}
        color={isComplete ? 'success' : 'warning'}
        showLabel={false}
      />
      
      {isComplete && (
        <Button
          variant="primary"
          fullWidth
          onClick={onResolve}
          loading={loading}
          className="mt-4"
          data-testid={`resolve-war-${war.id}`}
        >
          Resolver Guerra
        </Button>
      )}
    </div>
  );
}

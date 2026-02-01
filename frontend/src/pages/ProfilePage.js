import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useGame } from '../contexts/GameContext';
import { Card, ProgressBar, StatCard } from '../components/ProgressBar';
import { Button, Badge, Modal, Input } from '../components/UI';
import { 
  User, LogOut, Star, Target, DollarSign, 
  Flame, Shield, Clock, TrendingUp, Award,
  History, Settings, Wallet, ArrowRightLeft, Crown,
  Swords, Heart, Zap, Eye, Map, Users, Trophy,
  Activity, BarChart2, PieChart, Calendar, Gift,
  Lock, Unlock, ChevronRight, ChevronDown, Search,
  Plus, Trash2, Edit3, Check, X, RefreshCw,
  TrendingDown, Minus, AlertTriangle, Crosshair,
  Home, Car, Briefcase, Building, Factory, Archive,
  Medal, Flag, Link, Sunrise, Moon
} from 'lucide-react';
import clsx from 'clsx';
import { 
  LevelSystem, HeatSystem, EconomySystem, 
  formatNumber, formatPercent, TimeSystem 
} from '../utils/gameLogic';

// Icon mapping for badges and goals
const iconMap = {
  'sword': Swords, 'shield': Shield, 'swords': Swords, 'crown': Crown,
  'run': Activity, 'eye-off': Eye, 'coins': DollarSign, 'briefcase': Briefcase,
  'gem': Trophy, 'trophy': Trophy, 'refresh': RefreshCw, 'sparkles': Star,
  'home': Home, 'building': Building, 'factory': Factory, 'target': Target,
  'crosshair': Crosshair, 'skull': AlertTriangle, 'alert-triangle': AlertTriangle,
  'lock': Lock, 'flame': Flame, 'fire': Flame, 'users': Users, 'link': Link,
  'star': Star, 'flag': Flag, 'map': Map, 'medal': Medal, 'sunrise': Sunrise,
  'moon': Moon, 'calendar': Calendar, 'heart': Heart, 'award': Award,
  'archive': Archive, 'car': Car, 'tool': Settings, 'zap': Zap,
  'dollar-sign': DollarSign, 'trending-up': TrendingUp, 'refresh-cw': RefreshCw
};

const getIcon = (iconName) => iconMap[iconName] || Star;

// Rarity colors
const rarityColors = {
  common: { bg: 'bg-text-secondary/20', text: 'text-text-secondary', border: 'border-text-secondary' },
  uncommon: { bg: 'bg-success/20', text: 'text-success', border: 'border-success' },
  rare: { bg: 'bg-primary/20', text: 'text-primary', border: 'border-primary' },
  legendary: { bg: 'bg-gold/20', text: 'text-gold', border: 'border-gold' }
};

// Mini chart component
const MiniChart = ({ data, height = 40, color = 'primary' }) => {
  const maxValue = Math.max(...data.map(d => d.value), 1);
  
  return (
    <div className="flex items-end gap-0.5" style={{ height }}>
      {data.slice(-14).map((d, i) => (
        <div
          key={i}
          className={clsx(
            'flex-1 rounded-t transition-all',
            color === 'primary' && 'bg-primary',
            color === 'success' && 'bg-success',
            color === 'warning' && 'bg-warning',
            color === 'error' && 'bg-error'
          )}
          style={{ 
            height: `${Math.max(4, (d.value / maxValue) * 100)}%`,
            opacity: 0.3 + (i / data.length) * 0.7
          }}
          title={`${d.label}: ${formatNumber(d.value)}`}
        />
      ))}
    </div>
  );
};

// Stat comparison component
const StatComparison = ({ label, myValue, otherValue, format = 'number' }) => {
  const diff = myValue - otherValue;
  const isWinning = diff > 0;
  const isTied = diff === 0;
  
  const formatValue = (val) => {
    if (format === 'money') return `€${formatNumber(val)}`;
    if (format === 'percent') return `${val}%`;
    return formatNumber(val);
  };
  
  return (
    <div className="flex items-center justify-between p-3 bg-surface-highlight border border-border">
      <div className="flex-1">
        <p className="text-xs text-text-secondary uppercase tracking-wider">{label}</p>
        <p className={clsx(
          'text-lg font-body',
          isWinning && 'text-success',
          !isWinning && !isTied && 'text-error',
          isTied && 'text-text-primary'
        )}>
          {formatValue(myValue)}
        </p>
      </div>
      <div className={clsx(
        'w-8 h-8 flex items-center justify-center rounded',
        isWinning && 'bg-success/20 text-success',
        !isWinning && !isTied && 'bg-error/20 text-error',
        isTied && 'bg-text-secondary/20 text-text-secondary'
      )}>
        {isWinning ? <TrendingUp size={16} /> : isTied ? <Minus size={16} /> : <TrendingDown size={16} />}
      </div>
      <div className="flex-1 text-right">
        <p className="text-xs text-text-secondary uppercase tracking-wider">vs</p>
        <p className="text-lg font-body text-text-secondary">{formatValue(otherValue)}</p>
      </div>
    </div>
  );
};

// Badge card component
const BadgeCard = ({ badge, onClick }) => {
  const colors = rarityColors[badge.rarity];
  const Icon = getIcon(badge.icon);
  
  return (
    <div 
      className={clsx(
        'p-3 border rounded cursor-pointer transition-all hover:scale-105',
        badge.unlocked ? colors.bg : 'bg-surface opacity-50',
        badge.unlocked ? colors.border : 'border-border'
      )}
      onClick={() => onClick?.(badge)}
    >
      <div className="flex items-start gap-3">
        <div className={clsx(
          'w-10 h-10 flex items-center justify-center rounded',
          badge.unlocked ? colors.bg : 'bg-surface-highlight'
        )}>
          {badge.unlocked ? (
            <Icon size={20} className={colors.text} />
          ) : (
            <Lock size={20} className="text-text-secondary" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className={clsx(
            'font-body text-sm truncate',
            badge.unlocked ? 'text-text-primary' : 'text-text-secondary'
          )}>
            {badge.name}
          </p>
          <p className="text-xs text-text-secondary truncate">{badge.description}</p>
          {!badge.unlocked && (
            <div className="mt-1">
              <div className="h-1 bg-surface-highlight rounded overflow-hidden">
                <div 
                  className={clsx('h-full', colors.bg.replace('/20', ''))}
                  style={{ width: `${badge.progress}%` }}
                />
              </div>
              <p className="text-xs text-text-secondary mt-0.5">{badge.progress}%</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Goal card component
const GoalCard = ({ goal, onDelete, onEdit }) => {
  const Icon = getIcon(goal.icon);
  const isCompleted = goal.completed;
  
  return (
    <div className={clsx(
      'p-4 border rounded',
      isCompleted ? 'bg-success/10 border-success' : 'bg-surface border-border'
    )}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={clsx(
            'w-10 h-10 flex items-center justify-center rounded',
            isCompleted ? 'bg-success/20' : 'bg-primary/20'
          )}>
            <Icon size={20} className={isCompleted ? 'text-success' : 'text-primary'} />
          </div>
          <div>
            <p className="font-body text-text-primary">{goal.name}</p>
            <p className="text-xs text-text-secondary">
              {formatNumber(goal.current_value)} / {formatNumber(goal.target_value)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {!isCompleted && (
            <>
              <button 
                onClick={() => onEdit?.(goal)}
                className="p-1 hover:bg-surface-highlight rounded"
              >
                <Edit3 size={14} className="text-text-secondary" />
              </button>
              <button 
                onClick={() => onDelete?.(goal)}
                className="p-1 hover:bg-error/20 rounded"
              >
                <Trash2 size={14} className="text-error" />
              </button>
            </>
          )}
          {isCompleted && (
            <Badge variant="success">
              <Check size={12} className="mr-1" />
              Concluída
            </Badge>
          )}
        </div>
      </div>
      
      <div className="h-2 bg-surface-highlight rounded overflow-hidden">
        <div 
          className={clsx(
            'h-full transition-all',
            isCompleted ? 'bg-success' : 'bg-primary'
          )}
          style={{ width: `${goal.progress}%` }}
        />
      </div>
      <p className="text-right text-xs text-text-secondary mt-1">{goal.progress}%</p>
    </div>
  );
};

// Activity item component
const ActivityItem = ({ activity }) => {
  const actionLabels = {
    'mission_complete': 'Missão Completa',
    'daily_reward': 'Recompensa Diária',
    'launder_success': 'Lavagem Sucesso',
    'launder_failed': 'Lavagem Falhou',
    'level_up': 'Subiu de Nível',
    'skill_upgraded': 'Skill Melhorada',
    'property_bought': 'Propriedade Comprada',
    'vehicle_bought': 'Veículo Comprado',
    'gang_joined': 'Entrou em Gangue',
    'gang_left': 'Saiu da Gangue',
    'combat_won': 'Combate Vencido',
    'combat_lost': 'Combate Perdido',
    'police_escape': 'Fuga da Polícia',
    'item_used': 'Item Usado',
    'register': 'Conta Criada'
  };
  
  const actionIcons = {
    'mission_complete': Target,
    'daily_reward': Gift,
    'launder_success': RefreshCw,
    'launder_failed': X,
    'level_up': TrendingUp,
    'skill_upgraded': Zap,
    'property_bought': Home,
    'vehicle_bought': Car,
    'gang_joined': Users,
    'combat_won': Swords,
    'police_escape': Shield
  };
  
  const Icon = actionIcons[activity.action] || Activity;
  
  const formatTimestamp = (ts) => {
    if (!ts) return '';
    const date = new Date(ts);
    return TimeSystem.formatDate(date, 'relative');
  };
  
  return (
    <div className="flex items-center gap-3 p-3 bg-surface border border-border hover:border-primary/50 transition-colors">
      <div className="w-8 h-8 bg-surface-highlight flex items-center justify-center rounded">
        <Icon size={16} className="text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-text-primary truncate">
          {actionLabels[activity.action] || activity.action}
        </p>
        <p className="text-xs text-text-secondary">
          {formatTimestamp(activity.timestamp)}
        </p>
      </div>
      {activity.details?.reward && (
        <span className="text-success text-sm">+€{formatNumber(activity.details.reward)}</span>
      )}
      {activity.details?.result && (
        <Badge variant={activity.details.result === 'success' ? 'success' : 'error'} size="sm">
          {activity.details.result === 'success' ? 'Sucesso' : 'Falhou'}
        </Badge>
      )}
    </div>
  );
};

export default function ProfilePage() {
  const { user, logout, api } = useAuth();
  const { gameState, launderMoney, actionLoading, showNotification } = useGame();
  
  // State
  const [activeTab, setActiveTab] = useState('overview');
  const [activeSubTab, setActiveSubTab] = useState('combat');
  const [loading, setLoading] = useState(false);
  
  // Data states
  const [detailedStats, setDetailedStats] = useState(null);
  const [badges, setBadges] = useState(null);
  const [progressHistory, setProgressHistory] = useState(null);
  const [goals, setGoals] = useState(null);
  const [activityLog, setActivityLog] = useState(null);
  const [leaderboardPosition, setLeaderboardPosition] = useState(null);
  const [notoriety, setNotoriety] = useState(null);
  const [policeStatus, setPoliceStatus] = useState(null);
  const [rankings, setRankings] = useState([]);
  const [history, setHistory] = useState([]);
  
  // Comparison state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [comparisonData, setComparisonData] = useState(null);
  
  // Modals
  const [showLaunderModal, setShowLaunderModal] = useState(false);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [showBadgeModal, setShowBadgeModal] = useState(false);
  const [selectedBadge, setSelectedBadge] = useState(null);
  const [launderAmount, setLaunderAmount] = useState('');
  const [newGoal, setNewGoal] = useState({ type: '', target: 0 });
  
  // Activity filter
  const [activityCategory, setActivityCategory] = useState(null);
  
  const player = gameState?.player || user;

  // Fetch all profile data
  const fetchProfileData = useCallback(async () => {
    if (!api) return;
    
    setLoading(true);
    try {
      const [
        statsRes,
        badgesRes,
        historyRes,
        goalsRes,
        activityRes,
        leaderboardRes,
        notorietyRes,
        policeRes
      ] = await Promise.all([
        api().get('/profile/detailed-stats').catch(() => ({ data: null })),
        api().get('/profile/badges').catch(() => ({ data: null })),
        api().get('/profile/progress-history?days=30').catch(() => ({ data: null })),
        api().get('/profile/goals').catch(() => ({ data: null })),
        api().get('/profile/activity-log?limit=50').catch(() => ({ data: null })),
        api().get('/profile/leaderboard-position').catch(() => ({ data: null })),
        api().get('/notoriety').catch(() => ({ data: null })),
        api().get('/police-status').catch(() => ({ data: null }))
      ]);
      
      setDetailedStats(statsRes.data);
      setBadges(badgesRes.data);
      setProgressHistory(historyRes.data);
      setGoals(goalsRes.data);
      setActivityLog(activityRes.data);
      setLeaderboardPosition(leaderboardRes.data);
      setNotoriety(notorietyRes.data);
      setPoliceStatus(policeRes.data);
    } catch (err) {
      console.error('Error fetching profile data:', err);
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    fetchProfileData();
  }, [fetchProfileData]);

  // Fetch rankings
  const fetchRankings = useCallback(async () => {
    if (!api) return;
    try {
      const response = await api().get('/rankings/global?limit=10');
      setRankings(response.data.rankings);
    } catch (err) {
      console.error('Error fetching rankings:', err);
    }
  }, [api]);

  // Fetch history
  const fetchHistory = useCallback(async () => {
    if (!api) return;
    try {
      const response = await api().get('/player/history?limit=20');
      setHistory(response.data.history);
    } catch (err) {
      console.error('Error fetching history:', err);
    }
  }, [api]);

  // Search players
  const handleSearchPlayers = useCallback(async (query) => {
    if (!api || query.length < 2) {
      setSearchResults([]);
      return;
    }
    
    try {
      const response = await api().get(`/profile/search-players?q=${encodeURIComponent(query)}&limit=5`);
      setSearchResults(response.data.results.filter(p => p.id !== player?.id));
    } catch (err) {
      console.error('Error searching players:', err);
    }
  }, [api, player?.id]);

  // Compare with player
  const handleComparePlayer = useCallback(async (playerId) => {
    if (!api) return;
    
    try {
      const response = await api().get(`/profile/compare/${playerId}`);
      setComparisonData(response.data);
      setSelectedPlayer(searchResults.find(p => p.id === playerId));
      setSearchResults([]);
      setSearchQuery('');
    } catch (err) {
      console.error('Error comparing players:', err);
      showNotification?.('Erro ao comparar jogadores', 'error');
    }
  }, [api, searchResults, showNotification]);

  // Create goal
  const handleCreateGoal = useCallback(async () => {
    if (!api || !newGoal.type || !newGoal.target) return;
    
    try {
      await api().post('/profile/goals', {
        goal_type: newGoal.type,
        target_value: newGoal.target
      });
      
      showNotification?.('Meta criada com sucesso!', 'success');
      setShowGoalModal(false);
      setNewGoal({ type: '', target: 0 });
      
      // Refresh goals
      const goalsRes = await api().get('/profile/goals');
      setGoals(goalsRes.data);
    } catch (err) {
      showNotification?.(err.response?.data?.detail || 'Erro ao criar meta', 'error');
    }
  }, [api, newGoal, showNotification]);

  // Delete goal
  const handleDeleteGoal = useCallback(async (goal) => {
    if (!api) return;
    
    try {
      await api().delete(`/profile/goals/${goal.id}`);
      showNotification?.('Meta removida', 'success');
      
      // Refresh goals
      const goalsRes = await api().get('/profile/goals');
      setGoals(goalsRes.data);
    } catch (err) {
      showNotification?.('Erro ao remover meta', 'error');
    }
  }, [api, showNotification]);

  // Handle launder
  const handleLaunder = async () => {
    const amount = parseFloat(launderAmount);
    if (isNaN(amount) || amount <= 0) {
      showNotification?.('Montante inválido', 'error');
      return;
    }
    if (amount > player?.dirty_money) {
      showNotification?.('Dinheiro sujo insuficiente', 'error');
      return;
    }
    await launderMoney?.(amount);
    setShowLaunderModal(false);
    setLaunderAmount('');
    fetchProfileData();
  };

  // Fetch activity with category
  const fetchActivityByCategory = useCallback(async (category) => {
    if (!api) return;
    
    try {
      const url = category 
        ? `/profile/activity-log?category=${category}&limit=50`
        : '/profile/activity-log?limit=50';
      const response = await api().get(url);
      setActivityLog(response.data);
      setActivityCategory(category);
    } catch (err) {
      console.error('Error fetching activity:', err);
    }
  }, [api]);

  // Load tab-specific data
  useEffect(() => {
    if (activeTab === 'rankings') {
      fetchRankings();
    } else if (activeTab === 'activity') {
      fetchActivityByCategory(activityCategory);
    }
  }, [activeTab, fetchRankings, fetchActivityByCategory, activityCategory]);

  // Level info
  const levelInfo = useMemo(() => {
    if (!player) return null;
    return LevelSystem.getLevelTitle(player.level);
  }, [player]);

  // Heat info
  const heatInfo = useMemo(() => {
    if (!player) return null;
    return HeatSystem.getDangerLevel(player.heat_individual || 0);
  }, [player]);

  // Progress chart data
  const chartData = useMemo(() => {
    if (!progressHistory?.history) return [];
    return progressHistory.history.map(h => ({
      value: h.earnings || 0,
      label: h.date
    }));
  }, [progressHistory]);

  if (!player) return null;

  const playerRank = rankings.findIndex(r => r.username === player.username) + 1;

  // Main tabs configuration
  const mainTabs = [
    { id: 'overview', label: 'Visão Geral', icon: User },
    { id: 'stats', label: 'Estatísticas', icon: BarChart2 },
    { id: 'badges', label: 'Emblemas', icon: Award },
    { id: 'goals', label: 'Metas', icon: Target },
    { id: 'activity', label: 'Actividade', icon: Activity },
    { id: 'compare', label: 'Comparar', icon: Users },
    { id: 'rankings', label: 'Rankings', icon: Trophy }
  ];

  // Stats sub-tabs
  const statsTabs = [
    { id: 'combat', label: 'Combate', icon: Swords },
    { id: 'economy', label: 'Economia', icon: DollarSign },
    { id: 'criminal', label: 'Criminal', icon: AlertTriangle },
    { id: 'social', label: 'Social', icon: Users },
    { id: 'progression', label: 'Progressão', icon: TrendingUp },
    { id: 'records', label: 'Recordes', icon: Trophy }
  ];

  return (
    <div className="space-y-6 animate-fade-in" data-testid="profile-page">
      {/* ===== PROFILE HEADER ===== */}
      <Card>
        <div className="flex flex-col md:flex-row md:items-center gap-4 mb-6">
          {/* Avatar Section */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-20 h-20 bg-surface-highlight border-2 border-primary flex items-center justify-center">
                <User size={40} className="text-primary" />
              </div>
              {leaderboardPosition?.summary?.best_ranking <= 10 && (
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-gold rounded-full flex items-center justify-center">
                  <Crown size={14} className="text-surface" />
                </div>
              )}
            </div>
            
            <div>
              <h1 className="font-heading text-2xl md:text-3xl text-text-primary">
                {player.username}
              </h1>
              <div className="flex items-center gap-2 flex-wrap mt-1">
                <Badge variant="gold">
                  <Star size={12} className="mr-1" />
                  Nível {player.level}
                </Badge>
                {levelInfo && (
                  <span className={clsx('text-sm font-body', levelInfo.color)}>
                    {levelInfo.title}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-2">
                {notoriety?.rank && (
                  <Badge variant="primary">
                    <Crown size={12} className="mr-1" />
                    {notoriety.rank.name}
                  </Badge>
                )}
                {player.gang_id && (
                  <Badge variant="secondary">
                    <Shield size={12} className="mr-1" />
                    Em Gangue
                  </Badge>
                )}
                {heatInfo && (
                  <Badge variant={heatInfo.color}>
                    <Flame size={12} className={clsx('mr-1', heatInfo.pulse && 'animate-pulse')} />
                    Heat: {player.heat_individual}%
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-2 mt-4 md:mt-0">
            {leaderboardPosition?.rankings && (
              <>
                <div className="text-center p-2 bg-surface-highlight rounded">
                  <p className="text-xl font-heading text-gold">#{leaderboardPosition.rankings.reputation.rank}</p>
                  <p className="text-xs text-text-secondary">Rank Reputação</p>
                </div>
                <div className="text-center p-2 bg-surface-highlight rounded">
                  <p className="text-xl font-heading text-primary">#{leaderboardPosition.rankings.level.rank}</p>
                  <p className="text-xs text-text-secondary">Rank Nível</p>
                </div>
                <div className="text-center p-2 bg-surface-highlight rounded">
                  <p className="text-xl font-heading text-success">#{leaderboardPosition.rankings.wealth.rank}</p>
                  <p className="text-xs text-text-secondary">Rank Riqueza</p>
                </div>
                <div className="text-center p-2 bg-surface-highlight rounded">
                  <p className="text-xl font-heading text-text-primary">
                    {leaderboardPosition.summary.avg_percentile}%
                  </p>
                  <p className="text-xs text-text-secondary">Percentil Médio</p>
                </div>
              </>
            )}
          </div>

          {/* Logout Button */}
          <Button
            variant="ghost"
            icon={LogOut}
            onClick={logout}
            data-testid="logout-btn"
          >
            Sair
          </Button>
        </div>

        {/* Progress Bars */}
        <div className="space-y-3">
          <ProgressBar
            label="Experiência"
            value={player.experience}
            max={player.experience_max}
            color="primary"
          />
          <ProgressBar
            label="Reputação"
            value={player.reputation}
            max={player.reputation_max}
            color="gold"
          />
          {badges?.summary && (
            <ProgressBar
              label={`Emblemas (${badges.summary.unlocked}/${badges.summary.total})`}
              value={badges.summary.unlocked}
              max={badges.summary.total}
              color="secondary"
            />
          )}
        </div>
      </Card>

      {/* ===== NOTORIETY & POLICE STATUS ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Notoriety */}
        {notoriety && (
          <Card>
            <div className="flex items-center gap-2 mb-4">
              <Crown className="text-gold" size={20} />
              <h2 className="font-heading text-lg text-text-primary">Notoriedade</h2>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-surface-highlight p-4 border border-border rounded">
                <p className="text-xs text-text-secondary uppercase tracking-wider mb-1">Rank</p>
                <p className="text-2xl font-heading text-gold">{notoriety.rank?.name}</p>
                <p className="text-sm text-text-secondary">{notoriety.points} pontos</p>
                
                {notoriety.next_rank && (
                  <div className="mt-3">
                    <div className="flex justify-between text-xs text-text-secondary mb-1">
                      <span>Próximo: {notoriety.next_rank.name}</span>
                      <span>{Math.round(notoriety.next_rank.progress)}%</span>
                    </div>
                    <div className="h-2 bg-surface rounded overflow-hidden">
                      <div 
                        className="h-full bg-gold transition-all"
                        style={{ width: `${notoriety.next_rank.progress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
              
              <div className="bg-surface-highlight p-4 border border-border rounded">
                <p className="text-xs text-text-secondary uppercase tracking-wider mb-2">Benefícios</p>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Desconto</span>
                    <span className="text-success">-{notoriety.benefits?.price_discount}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Recrutamento</span>
                    <span className="text-primary">+{notoriety.benefits?.recruitment_bonus}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Respeito</span>
                    <span className="text-gold">+{notoriety.benefits?.respect_modifier}</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Police Status */}
        {policeStatus && (
          <Card>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Shield className={policeStatus.alert_level?.value > 2 ? 'text-error animate-pulse' : 'text-text-secondary'} size={20} />
                <h2 className="font-heading text-lg text-text-primary">Status Policial</h2>
              </div>
              <Badge variant={policeStatus.alert_level?.value > 2 ? 'error' : policeStatus.alert_level?.value > 0 ? 'warning' : 'success'}>
                {policeStatus.alert_level?.name}
              </Badge>
            </div>
            
            <div className="grid grid-cols-4 gap-2 text-center mb-4">
              <div className="p-2 bg-surface-highlight rounded">
                <p className="text-xl font-body text-error">{player.heat_individual}%</p>
                <p className="text-xs text-text-secondary">Teu Heat</p>
              </div>
              <div className="p-2 bg-surface-highlight rounded">
                <p className="text-xl font-body text-warning">{policeStatus.neighborhood_heat}%</p>
                <p className="text-xs text-text-secondary">Bairro</p>
              </div>
              <div className="p-2 bg-surface-highlight rounded">
                <p className="text-xl font-body text-primary">{policeStatus.response?.units_deployed}</p>
                <p className="text-xs text-text-secondary">Unidades</p>
              </div>
              <div className="p-2 bg-surface-highlight rounded">
                <p className="text-xl font-body text-text-primary">{policeStatus.neighborhood_info?.response_time}min</p>
                <p className="text-xs text-text-secondary">Resposta</p>
              </div>
            </div>
            
            {policeStatus.response?.helicopter && (
              <div className="p-2 bg-error/10 border border-error/30 text-error text-sm text-center rounded">
                ⚠️ Helicóptero policial activo!
              </div>
            )}
            
            <p className="text-xs text-text-secondary mt-3 text-center italic">
              "{policeStatus.advice}"
            </p>
          </Card>
        )}
      </div>

      {/* ===== MONEY SECTION ===== */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          icon={DollarSign}
          label="Dinheiro na Mão"
          value={`€${formatNumber(player.cash ?? (player.clean_money || 0) + (player.dirty_money || 0), 2)}`}
          color="warning"
        />
        <StatCard
          icon={Wallet}
          label="No Banco"
          value={`€${formatNumber(player.bank_balance || 0, 2)}`}
          color="success"
        />
        <StatCard
          icon={Wallet}
          label="Património Total"
          value={`€${formatNumber(detailedStats?.economy?.net_worth || ((player.cash ?? (player.clean_money || 0)) + (player.bank_balance || 0)), 2)}`}
          color="gold"
        />
      </div>

      {/* ===== MAIN TABS ===== */}
      <div className="flex gap-1 md:gap-2 overflow-x-auto pb-2 border-b border-border">
        {mainTabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            className={clsx(
              'flex items-center gap-1 md:gap-2 px-3 md:px-4 py-2 md:py-3 font-ui text-xs md:text-sm uppercase tracking-wider transition-all whitespace-nowrap',
              activeTab === id 
                ? 'text-primary border-b-2 border-primary' 
                : 'text-text-secondary hover:text-text-primary'
            )}
            onClick={() => setActiveTab(id)}
            data-testid={`tab-${id}`}
          >
            <Icon size={16} />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      {/* ===== TAB CONTENT ===== */}
      
      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <div className="bg-surface border border-border p-4 text-center rounded">
              <p className="text-3xl font-body text-primary">{player.total_missions || 0}</p>
              <p className="text-xs text-text-secondary uppercase tracking-wider mt-1">Missões</p>
            </div>
            <div className="bg-surface border border-border p-4 text-center rounded">
              <p className="text-3xl font-body text-success">{player.successful_missions || 0}</p>
              <p className="text-xs text-text-secondary uppercase tracking-wider mt-1">Sucessos</p>
            </div>
            <div className="bg-surface border border-border p-4 text-center rounded">
              <p className="text-3xl font-body text-error">{player.failed_missions || 0}</p>
              <p className="text-xs text-text-secondary uppercase tracking-wider mt-1">Falhas</p>
            </div>
            <div className="bg-surface border border-border p-4 text-center rounded">
              <p className="text-3xl font-body text-warning">{player.times_arrested || 0}</p>
              <p className="text-xs text-text-secondary uppercase tracking-wider mt-1">Prisões</p>
            </div>
            <div className="bg-surface border border-border p-4 text-center rounded">
              <p className="text-3xl font-body text-gold">{player.daily_streak || 0}</p>
              <p className="text-xs text-text-secondary uppercase tracking-wider mt-1">Streak</p>
            </div>
            <div className="bg-surface border border-border p-4 text-center rounded">
              <p className="text-3xl font-body text-secondary">{player.energy}/{player.energy_max}</p>
              <p className="text-xs text-text-secondary uppercase tracking-wider mt-1">Energia</p>
            </div>
          </div>

          {/* Progress Chart */}
          {chartData.length > 0 && (
            <Card>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-heading text-lg text-text-primary">Progresso (30 dias)</h3>
                {progressHistory?.trends && (
                  <div className="flex items-center gap-2">
                    <span className={clsx(
                      'flex items-center text-sm',
                      progressHistory.trends.earnings.direction === 'up' ? 'text-success' : 
                      progressHistory.trends.earnings.direction === 'down' ? 'text-error' : 'text-text-secondary'
                    )}>
                      {progressHistory.trends.earnings.direction === 'up' ? <TrendingUp size={14} /> :
                       progressHistory.trends.earnings.direction === 'down' ? <TrendingDown size={14} /> :
                       <Minus size={14} />}
                      <span className="ml-1">{Math.abs(progressHistory.trends.earnings.change_percent)}%</span>
                    </span>
                  </div>
                )}
              </div>
              <MiniChart data={chartData} height={60} color="primary" />
              <div className="flex justify-between mt-2 text-xs text-text-secondary">
                <span>Há 30 dias</span>
                <span>Hoje</span>
              </div>
              {progressHistory?.totals && (
                <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-border">
                  <div className="text-center">
                    <p className="text-lg font-body text-success">€{formatNumber(progressHistory.totals.total_earnings)}</p>
                    <p className="text-xs text-text-secondary">Total Ganho</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-body text-primary">{progressHistory.totals.total_missions}</p>
                    <p className="text-xs text-text-secondary">Total Missões</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-body text-gold">€{formatNumber(progressHistory.totals.avg_daily_earnings)}</p>
                    <p className="text-xs text-text-secondary">Média Diária</p>
                  </div>
                </div>
              )}
            </Card>
          )}

          {/* Recent Badges */}
          {badges?.badges && (
            <Card>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-heading text-lg text-text-primary">Emblemas Recentes</h3>
                <Button variant="ghost" size="sm" onClick={() => setActiveTab('badges')}>
                  Ver Todos <ChevronRight size={16} />
                </Button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {badges.badges
                  .filter(b => b.unlocked)
                  .slice(0, 4)
                  .map(badge => (
                    <BadgeCard 
                      key={badge.id} 
                      badge={badge} 
                      onClick={(b) => {
                        setSelectedBadge(b);
                        setShowBadgeModal(true);
                      }}
                    />
                  ))}
              </div>
            </Card>
          )}

          {/* Active Goals */}
          {goals?.goals && goals.goals.filter(g => !g.completed).length > 0 && (
            <Card>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-heading text-lg text-text-primary">Metas Activas</h3>
                <Button variant="ghost" size="sm" onClick={() => setActiveTab('goals')}>
                  Ver Todas <ChevronRight size={16} />
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {goals.goals
                  .filter(g => !g.completed)
                  .slice(0, 4)
                  .map(goal => (
                    <GoalCard 
                      key={goal.id} 
                      goal={goal}
                      onDelete={handleDeleteGoal}
                    />
                  ))}
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Statistics Tab */}
      {activeTab === 'stats' && detailedStats && (
        <div className="space-y-6">
          {/* Stats Sub-tabs */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {statsTabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                className={clsx(
                  'flex items-center gap-2 px-3 py-2 rounded font-ui text-sm transition-all whitespace-nowrap',
                  activeSubTab === id 
                    ? 'bg-primary text-surface' 
                    : 'bg-surface border border-border text-text-secondary hover:text-text-primary'
                )}
                onClick={() => setActiveSubTab(id)}
              >
                <Icon size={14} />
                {label}
              </button>
            ))}
          </div>

          {/* Combat Stats */}
          {activeSubTab === 'combat' && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-surface border border-border p-4 text-center rounded">
                <p className="text-3xl font-body text-success">{detailedStats.combat.combats_won}</p>
                <p className="text-xs text-text-secondary uppercase">Combates Vencidos</p>
              </div>
              <div className="bg-surface border border-border p-4 text-center rounded">
                <p className="text-3xl font-body text-error">{detailedStats.combat.combats_lost}</p>
                <p className="text-xs text-text-secondary uppercase">Combates Perdidos</p>
              </div>
              <div className="bg-surface border border-border p-4 text-center rounded">
                <p className="text-3xl font-body text-gold">{detailedStats.combat.kdr}</p>
                <p className="text-xs text-text-secondary uppercase">K/D Ratio</p>
              </div>
              <div className="bg-surface border border-border p-4 text-center rounded">
                <p className="text-3xl font-body text-primary">{detailedStats.combat.police_escapes}</p>
                <p className="text-xs text-text-secondary uppercase">Fugas Polícia</p>
              </div>
              <div className="bg-surface border border-border p-4 text-center rounded">
                <p className="text-3xl font-body text-warning">{detailedStats.combat.times_arrested}</p>
                <p className="text-xs text-text-secondary uppercase">Prisões</p>
              </div>
              <div className="bg-surface border border-border p-4 text-center rounded">
                <p className="text-3xl font-body text-secondary">{detailedStats.combat.stealth_missions}</p>
                <p className="text-xs text-text-secondary uppercase">Missões Stealth</p>
              </div>
              <div className="bg-surface border border-border p-4 text-center rounded">
                <p className="text-3xl font-body text-error">{detailedStats.combat.high_risk_missions}</p>
                <p className="text-xs text-text-secondary uppercase">Missões Alto Risco</p>
              </div>
              <div className="bg-surface border border-border p-4 text-center rounded">
                <p className="text-3xl font-body text-success">{detailedStats.combat.survival_rate}%</p>
                <p className="text-xs text-text-secondary uppercase">Taxa Sobrevivência</p>
              </div>
            </div>
          )}

          {/* Economy Stats */}
          {activeSubTab === 'economy' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-surface border border-border p-4 text-center rounded">
                  <p className="text-2xl font-body text-success">€{formatNumber(detailedStats.economy.total_earnings)}</p>
                  <p className="text-xs text-text-secondary uppercase">Total Ganho</p>
                </div>
                <div className="bg-surface border border-border p-4 text-center rounded">
                  <p className="text-2xl font-body text-error">€{formatNumber(detailedStats.economy.total_spent)}</p>
                  <p className="text-xs text-text-secondary uppercase">Total Gasto</p>
                </div>
                <div className="bg-surface border border-border p-4 text-center rounded">
                  <p className="text-2xl font-body text-gold">€{formatNumber(detailedStats.economy.net_worth)}</p>
                  <p className="text-xs text-text-secondary uppercase">Património</p>
                </div>
                <div className="bg-surface border border-border p-4 text-center rounded">
                  <p className={clsx('text-2xl font-body', detailedStats.economy.roi >= 0 ? 'text-success' : 'text-error')}>
                    {detailedStats.economy.roi}%
                  </p>
                  <p className="text-xs text-text-secondary uppercase">ROI</p>
                </div>
              </div>

              <Card>
                <h4 className="font-heading text-md text-text-primary mb-3">Lavagem de Dinheiro</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className="text-xl font-body text-primary">€{formatNumber(detailedStats.economy.money_laundered)}</p>
                    <p className="text-xs text-text-secondary">Total Lavado</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-body text-success">{detailedStats.economy.launder_success_rate}%</p>
                    <p className="text-xs text-text-secondary">Taxa Sucesso</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-body text-text-primary">{detailedStats.economy.launder_attempts}</p>
                    <p className="text-xs text-text-secondary">Tentativas</p>
                  </div>
                </div>
              </Card>

              <Card>
                <h4 className="font-heading text-md text-text-primary mb-3">Rendimento Passivo</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <p className="text-xl font-body text-success">€{formatNumber(detailedStats.economy.passive_income_hourly)}/h</p>
                    <p className="text-xs text-text-secondary">Por Hora</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-body text-success">€{formatNumber(detailedStats.economy.passive_income_daily)}/dia</p>
                    <p className="text-xs text-text-secondary">Por Dia</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-body text-primary">{detailedStats.economy.properties_owned}</p>
                    <p className="text-xs text-text-secondary">Propriedades</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-body text-primary">{detailedStats.economy.businesses_owned}</p>
                    <p className="text-xs text-text-secondary">Negócios</p>
                  </div>
                </div>
              </Card>

              <Card>
                <h4 className="font-heading text-md text-text-primary mb-3">Mercado Negro</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className="text-xl font-body text-success">€{formatNumber(detailedStats.economy.market_sold)}</p>
                    <p className="text-xs text-text-secondary">Vendas</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-body text-error">€{formatNumber(detailedStats.economy.market_bought)}</p>
                    <p className="text-xs text-text-secondary">Compras</p>
                  </div>
                  <div className="text-center">
                    <p className={clsx('text-xl font-body', detailedStats.economy.market_profit >= 0 ? 'text-success' : 'text-error')}>
                      €{formatNumber(detailedStats.economy.market_profit)}
                    </p>
                    <p className="text-xs text-text-secondary">Lucro</p>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* Criminal Stats */}
          {activeSubTab === 'criminal' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-surface border border-border p-4 text-center rounded">
                  <p className="text-3xl font-body text-primary">{detailedStats.criminal.total_missions}</p>
                  <p className="text-xs text-text-secondary uppercase">Total Missões</p>
                </div>
                <div className="bg-surface border border-border p-4 text-center rounded">
                  <p className="text-3xl font-body text-success">{detailedStats.criminal.successful_missions}</p>
                  <p className="text-xs text-text-secondary uppercase">Sucesso</p>
                </div>
                <div className="bg-surface border border-border p-4 text-center rounded">
                  <p className="text-3xl font-body text-gold">{detailedStats.criminal.success_rate}%</p>
                  <p className="text-xs text-text-secondary uppercase">Taxa Sucesso</p>
                </div>
                <div className="bg-surface border border-border p-4 text-center rounded">
                  <p className="text-3xl font-body text-warning">{detailedStats.criminal.heists_completed}</p>
                  <p className="text-xs text-text-secondary uppercase">Heists</p>
                </div>
              </div>

              <Card>
                <h4 className="font-heading text-md text-text-primary mb-3">Heat & Notoriedade</h4>
                <div className="grid grid-cols-4 gap-4">
                  <div className="text-center">
                    <p className="text-xl font-body text-error">{detailedStats.criminal.current_heat}%</p>
                    <p className="text-xs text-text-secondary">Heat Actual</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-body text-warning">{detailedStats.criminal.max_heat_reached}%</p>
                    <p className="text-xs text-text-secondary">Máximo Heat</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-body text-gold">{detailedStats.criminal.notoriety_points}</p>
                    <p className="text-xs text-text-secondary">Notoriedade</p>
                  </div>
                  <div className="text-center">
                    <Badge variant={
                      detailedStats.criminal.risk_level === 'Alto' ? 'error' :
                      detailedStats.criminal.risk_level === 'Médio' ? 'warning' : 'success'
                    }>
                      {detailedStats.criminal.risk_level}
                    </Badge>
                    <p className="text-xs text-text-secondary mt-1">Nível Risco</p>
                  </div>
                </div>
              </Card>

              {Object.keys(detailedStats.criminal.crimes_by_type).length > 0 && (
                <Card>
                  <h4 className="font-heading text-md text-text-primary mb-3">Crimes por Tipo</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {Object.entries(detailedStats.criminal.crimes_by_type).map(([type, count]) => (
                      <div key={type} className="flex items-center justify-between p-2 bg-surface-highlight rounded">
                        <span className="text-sm text-text-secondary capitalize">{type.replace(/_/g, ' ')}</span>
                        <span className="text-sm font-body text-text-primary">{count}</span>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </div>
          )}

          {/* Social Stats */}
          {activeSubTab === 'social' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-surface border border-border p-4 text-center rounded">
                  <p className="text-3xl font-body text-gold">{detailedStats.social.reputation}</p>
                  <p className="text-xs text-text-secondary uppercase">Reputação</p>
                </div>
                <div className="bg-surface border border-border p-4 text-center rounded">
                  <p className="text-lg font-body text-primary">{detailedStats.social.reputation_rank}</p>
                  <p className="text-xs text-text-secondary uppercase">Rank</p>
                </div>
                <div className="bg-surface border border-border p-4 text-center rounded">
                  <p className="text-3xl font-body text-success">{detailedStats.social.npcs_met}</p>
                  <p className="text-xs text-text-secondary uppercase">NPCs Conhecidos</p>
                </div>
                <div className="bg-surface border border-border p-4 text-center rounded">
                  <p className="text-3xl font-body text-secondary">{detailedStats.social.good_relationships}</p>
                  <p className="text-xs text-text-secondary uppercase">Bons Relacionamentos</p>
                </div>
              </div>

              {detailedStats.social.gang?.name && (
                <Card>
                  <h4 className="font-heading text-md text-text-primary mb-3">Gangue: {detailedStats.social.gang.name}</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <Badge variant={detailedStats.social.gang.role === 'leader' ? 'gold' : 'secondary'}>
                        {detailedStats.social.gang.role === 'leader' ? 'Líder' : 'Membro'}
                      </Badge>
                      <p className="text-xs text-text-secondary mt-1">Posição</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xl font-body text-primary">{detailedStats.social.gang.members}</p>
                      <p className="text-xs text-text-secondary">Membros</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xl font-body text-gold">{detailedStats.social.gang.reputation}</p>
                      <p className="text-xs text-text-secondary">Reputação</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xl font-body text-success">{detailedStats.social.gang.territories}</p>
                      <p className="text-xs text-text-secondary">Territórios</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xl font-body text-success">€{formatNumber(detailedStats.social.gang.treasury)}</p>
                      <p className="text-xs text-text-secondary">Tesouro</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xl font-body text-success">{detailedStats.social.gang.wars_won}</p>
                      <p className="text-xs text-text-secondary">Guerras Vencidas</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xl font-body text-error">{detailedStats.social.gang.wars_lost}</p>
                      <p className="text-xs text-text-secondary">Guerras Perdidas</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xl font-body text-gold">{detailedStats.social.gang.win_rate}%</p>
                      <p className="text-xs text-text-secondary">Win Rate</p>
                    </div>
                  </div>
                </Card>
              )}
            </div>
          )}

          {/* Progression Stats */}
          {activeSubTab === 'progression' && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-surface border border-border p-4 text-center rounded">
                <p className="text-3xl font-body text-primary">{detailedStats.progression.level}</p>
                <p className="text-xs text-text-secondary uppercase">Nível</p>
              </div>
              <div className="bg-surface border border-border p-4 text-center rounded">
                <p className="text-3xl font-body text-gold">{detailedStats.progression.total_skill_levels}</p>
                <p className="text-xs text-text-secondary uppercase">Níveis de Skill</p>
              </div>
              <div className="bg-surface border border-border p-4 text-center rounded">
                <p className="text-3xl font-body text-success">{detailedStats.progression.skills_maxed}</p>
                <p className="text-xs text-text-secondary uppercase">Skills Maximizadas</p>
              </div>
              <div className="bg-surface border border-border p-4 text-center rounded">
                <p className="text-3xl font-body text-warning">{detailedStats.progression.achievements_unlocked}/{detailedStats.progression.achievements_total}</p>
                <p className="text-xs text-text-secondary uppercase">Conquistas</p>
              </div>
              <div className="bg-surface border border-border p-4 text-center rounded">
                <p className="text-3xl font-body text-secondary">{detailedStats.progression.daily_streak}</p>
                <p className="text-xs text-text-secondary uppercase">Streak Actual</p>
              </div>
              <div className="bg-surface border border-border p-4 text-center rounded">
                <p className="text-3xl font-body text-text-primary">{detailedStats.progression.days_playing}</p>
                <p className="text-xs text-text-secondary uppercase">Dias a Jogar</p>
              </div>
              <div className="bg-surface border border-border p-4 text-center rounded">
                <p className="text-3xl font-body text-primary">{detailedStats.progression.actions_per_day}</p>
                <p className="text-xs text-text-secondary uppercase">Acções/Dia</p>
              </div>
              <div className="bg-surface border border-border p-4 text-center rounded">
                <p className="text-3xl font-body text-gold">{detailedStats.progression.items_collected}</p>
                <p className="text-xs text-text-secondary uppercase">Itens</p>
              </div>
            </div>
          )}

          {/* Records */}
          {activeSubTab === 'records' && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="bg-gradient-to-br from-gold/20 to-gold/5 border border-gold p-4 text-center rounded">
                <Trophy className="mx-auto text-gold mb-2" size={24} />
                <p className="text-2xl font-body text-gold">€{formatNumber(detailedStats.records.biggest_heist)}</p>
                <p className="text-xs text-text-secondary uppercase">Maior Heist</p>
              </div>
              <div className="bg-gradient-to-br from-success/20 to-success/5 border border-success p-4 text-center rounded">
                <Target className="mx-auto text-success mb-2" size={24} />
                <p className="text-2xl font-body text-success">€{formatNumber(detailedStats.records.biggest_mission_reward)}</p>
                <p className="text-xs text-text-secondary uppercase">Maior Recompensa</p>
              </div>
              <div className="bg-gradient-to-br from-primary/20 to-primary/5 border border-primary p-4 text-center rounded">
                <Calendar className="mx-auto text-primary mb-2" size={24} />
                <p className="text-2xl font-body text-primary">{detailedStats.records.longest_streak}</p>
                <p className="text-xs text-text-secondary uppercase">Maior Streak</p>
              </div>
              <div className="bg-gradient-to-br from-warning/20 to-warning/5 border border-warning p-4 text-center rounded">
                <TrendingUp className="mx-auto text-warning mb-2" size={24} />
                <p className="text-2xl font-body text-warning">{detailedStats.records.highest_level_reached}</p>
                <p className="text-xs text-text-secondary uppercase">Nível Máximo</p>
              </div>
              <div className="bg-gradient-to-br from-secondary/20 to-secondary/5 border border-secondary p-4 text-center rounded">
                <DollarSign className="mx-auto text-secondary mb-2" size={24} />
                <p className="text-2xl font-body text-secondary">€{formatNumber(detailedStats.records.most_money_at_once)}</p>
                <p className="text-xs text-text-secondary uppercase">Mais € de Uma Vez</p>
              </div>
              <div className="bg-gradient-to-br from-error/20 to-error/5 border border-error p-4 text-center rounded">
                <Clock className="mx-auto text-error mb-2" size={24} />
                <p className="text-2xl font-body text-error">{detailedStats.records.fastest_mission}s</p>
                <p className="text-xs text-text-secondary uppercase">Missão Mais Rápida</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Badges Tab */}
      {activeTab === 'badges' && badges && (
        <div className="space-y-6">
          {/* Summary */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading text-lg text-text-primary">Colecção de Emblemas</h3>
              <Badge variant="gold">{badges.summary.unlocked}/{badges.summary.total}</Badge>
            </div>
            <ProgressBar
              label="Progresso"
              value={badges.summary.unlocked}
              max={badges.summary.total}
              color="gold"
            />
            <div className="grid grid-cols-4 gap-4 mt-4">
              {Object.entries(badges.summary.rarity_counts).map(([rarity, count]) => (
                <div key={rarity} className={clsx('text-center p-2 rounded', rarityColors[rarity].bg)}>
                  <p className={clsx('text-xl font-body', rarityColors[rarity].text)}>{count}</p>
                  <p className="text-xs text-text-secondary capitalize">{rarity}</p>
                </div>
              ))}
            </div>
          </Card>

          {/* Badges by Category */}
          {Object.entries(badges.by_category).map(([category, categoryBadges]) => (
            <Card key={category}>
              <h4 className="font-heading text-md text-text-primary capitalize mb-4">
                {category === 'combat' ? '⚔️ Combate' :
                 category === 'economy' ? '💰 Economia' :
                 category === 'criminal' ? '🎯 Criminal' :
                 category === 'social' ? '👥 Social' :
                 '⭐ Especial'}
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {categoryBadges.map(badge => (
                  <BadgeCard 
                    key={badge.id} 
                    badge={badge}
                    onClick={(b) => {
                      setSelectedBadge(b);
                      setShowBadgeModal(true);
                    }}
                  />
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Goals Tab */}
      {activeTab === 'goals' && goals && (
        <div className="space-y-6">
          {/* Create Goal Button */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-heading text-lg text-text-primary">As Tuas Metas</h3>
              <p className="text-sm text-text-secondary">
                {goals.active_count}/{goals.max_active_goals} metas activas
              </p>
            </div>
            <Button
              variant="primary"
              icon={Plus}
              onClick={() => setShowGoalModal(true)}
              disabled={goals.active_count >= goals.max_active_goals}
            >
              Nova Meta
            </Button>
          </div>

          {/* Active Goals */}
          {goals.goals.filter(g => !g.completed).length > 0 && (
            <Card>
              <h4 className="font-heading text-md text-text-primary mb-4">Metas Activas</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {goals.goals.filter(g => !g.completed).map(goal => (
                  <GoalCard 
                    key={goal.id} 
                    goal={goal}
                    onDelete={handleDeleteGoal}
                  />
                ))}
              </div>
            </Card>
          )}

          {/* Completed Goals */}
          {goals.goals.filter(g => g.completed).length > 0 && (
            <Card>
              <h4 className="font-heading text-md text-text-primary mb-4">Metas Concluídas</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {goals.goals.filter(g => g.completed).map(goal => (
                  <GoalCard 
                    key={goal.id} 
                    goal={goal}
                  />
                ))}
              </div>
            </Card>
          )}

          {goals.goals.length === 0 && (
            <Card>
              <div className="text-center py-8">
                <Target size={48} className="mx-auto text-text-secondary mb-4" />
                <p className="text-text-secondary">Ainda não tens metas definidas.</p>
                <p className="text-sm text-text-secondary mt-1">Cria uma meta para acompanhar o teu progresso!</p>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Activity Tab */}
      {activeTab === 'activity' && activityLog && (
        <div className="space-y-6">
          {/* Filter Buttons */}
          <div className="flex flex-wrap gap-2">
            <button
              className={clsx(
                'px-3 py-1 rounded text-sm',
                !activityCategory ? 'bg-primary text-surface' : 'bg-surface border border-border text-text-secondary'
              )}
              onClick={() => fetchActivityByCategory(null)}
            >
              Todas
            </button>
            {activityLog.categories.map(cat => (
              <button
                key={cat}
                className={clsx(
                  'px-3 py-1 rounded text-sm capitalize',
                  activityCategory === cat ? 'bg-primary text-surface' : 'bg-surface border border-border text-text-secondary'
                )}
                onClick={() => fetchActivityByCategory(cat)}
              >
                {cat === 'missions' ? 'Missões' :
                 cat === 'economy' ? 'Economia' :
                 cat === 'combat' ? 'Combate' :
                 cat === 'social' ? 'Social' :
                 'Progressão'}
              </button>
            ))}
          </div>

          {/* Activity Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-surface border border-border p-4 text-center rounded">
              <p className="text-2xl font-body text-primary">{activityLog.stats.today}</p>
              <p className="text-xs text-text-secondary">Hoje</p>
            </div>
            <div className="bg-surface border border-border p-4 text-center rounded">
              <p className="text-2xl font-body text-success">{activityLog.stats.this_week}</p>
              <p className="text-xs text-text-secondary">Esta Semana</p>
            </div>
            <div className="bg-surface border border-border p-4 text-center rounded">
              <p className="text-2xl font-body text-gold">{activityLog.stats.total}</p>
              <p className="text-xs text-text-secondary">Total</p>
            </div>
          </div>

          {/* Activity List */}
          <Card>
            <div className="space-y-2">
              {activityLog.activities.map((activity, idx) => (
                <ActivityItem key={activity.id || idx} activity={activity} />
              ))}
            </div>
            
            {activityLog.pagination.has_more && (
              <div className="text-center mt-4">
                <Button variant="ghost" size="sm">
                  Carregar Mais
                </Button>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Compare Tab */}
      {activeTab === 'compare' && (
        <div className="space-y-6">
          {/* Search */}
          <Card>
            <h3 className="font-heading text-lg text-text-primary mb-4">Comparar com Outro Jogador</h3>
            <div className="relative">
              <Input
                placeholder="Pesquisar jogador..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  handleSearchPlayers(e.target.value);
                }}
                icon={Search}
              />
              
              {searchResults.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-surface border border-border rounded shadow-lg">
                  {searchResults.map(p => (
                    <button
                      key={p.id}
                      className="w-full flex items-center gap-3 p-3 hover:bg-surface-highlight text-left"
                      onClick={() => handleComparePlayer(p.id)}
                    >
                      <div className="w-8 h-8 bg-surface-highlight rounded flex items-center justify-center">
                        <User size={16} className="text-primary" />
                      </div>
                      <div>
                        <p className="text-text-primary">{p.username}</p>
                        <p className="text-xs text-text-secondary">Nível {p.level} • {p.reputation} rep</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </Card>

          {/* Comparison Results */}
          {comparisonData && selectedPlayer && (
            <Card>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-primary/20 rounded flex items-center justify-center">
                    <User size={24} className="text-primary" />
                  </div>
                  <div>
                    <p className="font-heading text-lg text-text-primary">{comparisonData.comparison.me.username}</p>
                    <p className="text-sm text-text-secondary">Tu</p>
                  </div>
                </div>
                
                <div className="text-center">
                  <p className={clsx(
                    'text-2xl font-heading',
                    comparisonData.overall.winner === 'me' ? 'text-success' :
                    comparisonData.overall.winner === 'other' ? 'text-error' : 'text-warning'
                  )}>
                    {comparisonData.overall.winner === 'me' ? 'VENCES!' :
                     comparisonData.overall.winner === 'other' ? 'PERDES' : 'EMPATE'}
                  </p>
                  <p className="text-xs text-text-secondary">
                    {comparisonData.overall.my_wins} vs {comparisonData.overall.other_wins}
                  </p>
                </div>
                
                <div className="flex items-center gap-3">
                  <div>
                    <p className="font-heading text-lg text-text-primary text-right">{selectedPlayer.username}</p>
                    <p className="text-sm text-text-secondary text-right">Oponente</p>
                  </div>
                  <div className="w-12 h-12 bg-error/20 rounded flex items-center justify-center">
                    <User size={24} className="text-error" />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <StatComparison 
                  label="Nível"
                  myValue={comparisonData.comparison.me.level}
                  otherValue={comparisonData.comparison.other.level}
                />
                <StatComparison 
                  label="Reputação"
                  myValue={comparisonData.comparison.me.reputation}
                  otherValue={comparisonData.comparison.other.reputation}
                />
                <StatComparison 
                  label="Total Ganho"
                  myValue={comparisonData.comparison.me.total_earnings}
                  otherValue={comparisonData.comparison.other.total_earnings}
                  format="money"
                />
                <StatComparison 
                  label="Missões"
                  myValue={comparisonData.comparison.me.missions_completed}
                  otherValue={comparisonData.comparison.other.missions_completed}
                />
                <StatComparison 
                  label="Propriedades"
                  myValue={comparisonData.comparison.me.properties}
                  otherValue={comparisonData.comparison.other.properties}
                />
                <StatComparison 
                  label="Veículos"
                  myValue={comparisonData.comparison.me.vehicles}
                  otherValue={comparisonData.comparison.other.vehicles}
                />
              </div>
            </Card>
          )}

          {!comparisonData && (
            <Card>
              <div className="text-center py-8">
                <Users size={48} className="mx-auto text-text-secondary mb-4" />
                <p className="text-text-secondary">Pesquisa um jogador para comparar estatísticas</p>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Rankings Tab */}
      {activeTab === 'rankings' && (
        <div className="space-y-4">
          {playerRank > 0 && (
            <div className="bg-primary/10 border border-primary p-4 rounded">
              <p className="text-primary text-center">
                Estás na posição <strong>#{playerRank}</strong> do ranking global!
              </p>
            </div>
          )}
          
          <Card>
            <h3 className="font-heading text-lg text-text-primary mb-4">Top 10 Global</h3>
            <div className="space-y-2">
              {rankings.map((rank, index) => (
                <div
                  key={rank.username}
                  className={clsx(
                    'flex items-center gap-3 p-3 bg-surface border border-border rounded',
                    rank.username === player.username && 'border-primary bg-primary/5'
                  )}
                >
                  <div className={clsx(
                    'w-10 h-10 flex items-center justify-center font-heading text-lg rounded',
                    index === 0 && 'bg-gold/20 text-gold',
                    index === 1 && 'bg-text-secondary/20 text-text-secondary',
                    index === 2 && 'bg-warning/20 text-warning',
                    index > 2 && 'bg-surface-highlight text-text-secondary'
                  )}>
                    #{rank.rank}
                  </div>
                  <div className="flex-1">
                    <p className="text-text-primary font-body">{rank.username}</p>
                    <p className="text-text-secondary text-xs">Nível {rank.level}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-gold font-body">{formatNumber(rank.reputation)}</p>
                    <p className="text-text-secondary text-xs">reputação</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* ===== MODALS ===== */}
      
      {/* Launder Money Modal */}
      <Modal
        isOpen={showLaunderModal}
        onClose={() => setShowLaunderModal(false)}
        title="Lavar Dinheiro"
      >
        <div className="space-y-4">
          <p className="text-text-secondary text-sm">
            Lavar dinheiro sujo converte-o em dinheiro limpo, mas cobra uma taxa de 20-40% e há risco de ser apanhado.
          </p>
          
          <div className="bg-surface-highlight border border-border p-4 rounded">
            <p className="text-text-secondary text-sm mb-2">Disponível para lavar:</p>
            <p className="text-warning text-2xl font-body">€{formatNumber(player.dirty_money || 0, 2)}</p>
          </div>
          
          <Input
            label="Montante a lavar"
            type="number"
            placeholder="100.00"
            value={launderAmount}
            onChange={(e) => setLaunderAmount(e.target.value)}
            data-testid="launder-amount-input"
          />
          
          <div className="bg-error/10 border border-error/30 p-3 text-sm rounded">
            <p className="text-error flex items-center gap-2">
              <Flame size={16} />
              Risco: {player.heat_individual}% de ser apanhado
            </p>
          </div>
          
          <div className="flex gap-3">
            <Button
              variant="secondary"
              fullWidth
              onClick={() => setShowLaunderModal(false)}
            >
              Cancelar
            </Button>
            <Button
              variant="primary"
              fullWidth
              onClick={handleLaunder}
              loading={actionLoading}
              data-testid="confirm-launder"
            >
              Lavar Dinheiro
            </Button>
          </div>
        </div>
      </Modal>

      {/* Create Goal Modal */}
      <Modal
        isOpen={showGoalModal}
        onClose={() => setShowGoalModal(false)}
        title="Criar Nova Meta"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-text-secondary mb-2">Tipo de Meta</label>
            <div className="grid grid-cols-2 gap-2">
              {goals?.templates?.map(template => {
                const Icon = getIcon(template.icon);
                return (
                  <button
                    key={template.id}
                    className={clsx(
                      'flex items-center gap-2 p-3 border rounded text-left transition-all',
                      newGoal.type === template.id 
                        ? 'bg-primary/20 border-primary' 
                        : 'bg-surface border-border hover:border-primary/50'
                    )}
                    onClick={() => setNewGoal({ ...newGoal, type: template.id, target: template.suggested_target })}
                  >
                    <Icon size={16} className={newGoal.type === template.id ? 'text-primary' : 'text-text-secondary'} />
                    <span className={clsx('text-sm', newGoal.type === template.id ? 'text-primary' : 'text-text-primary')}>
                      {template.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {newGoal.type && (
            <div>
              <label className="block text-sm text-text-secondary mb-2">Valor Alvo</label>
              <div className="grid grid-cols-5 gap-2">
                {goals?.templates?.find(t => t.id === newGoal.type)?.targets.map(target => (
                  <button
                    key={target}
                    className={clsx(
                      'p-2 border rounded text-center transition-all',
                      newGoal.target === target 
                        ? 'bg-primary text-surface border-primary' 
                        : 'bg-surface border-border text-text-primary hover:border-primary/50'
                    )}
                    onClick={() => setNewGoal({ ...newGoal, target })}
                  >
                    {formatNumber(target)}
                  </button>
                ))}
              </div>
            </div>
          )}
          
          <div className="flex gap-3 pt-2">
            <Button
              variant="secondary"
              fullWidth
              onClick={() => {
                setShowGoalModal(false);
                setNewGoal({ type: '', target: 0 });
              }}
            >
              Cancelar
            </Button>
            <Button
              variant="primary"
              fullWidth
              onClick={handleCreateGoal}
              disabled={!newGoal.type || !newGoal.target}
            >
              Criar Meta
            </Button>
          </div>
        </div>
      </Modal>

      {/* Badge Detail Modal */}
      <Modal
        isOpen={showBadgeModal}
        onClose={() => {
          setShowBadgeModal(false);
          setSelectedBadge(null);
        }}
        title={selectedBadge?.name || 'Emblema'}
      >
        {selectedBadge && (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className={clsx(
                'w-16 h-16 flex items-center justify-center rounded',
                selectedBadge.unlocked ? rarityColors[selectedBadge.rarity].bg : 'bg-surface-highlight'
              )}>
                {(() => {
                  const Icon = getIcon(selectedBadge.icon);
                  return selectedBadge.unlocked ? (
                    <Icon size={32} className={rarityColors[selectedBadge.rarity].text} />
                  ) : (
                    <Lock size={32} className="text-text-secondary" />
                  );
                })()}
              </div>
              <div>
                <Badge variant={selectedBadge.rarity === 'legendary' ? 'gold' : 
                              selectedBadge.rarity === 'rare' ? 'primary' : 
                              selectedBadge.rarity === 'uncommon' ? 'success' : 'secondary'}>
                  {selectedBadge.rarity.charAt(0).toUpperCase() + selectedBadge.rarity.slice(1)}
                </Badge>
                <p className="text-text-secondary mt-2">{selectedBadge.description}</p>
              </div>
            </div>
            
            <div className="bg-surface-highlight p-4 rounded">
              <div className="flex justify-between mb-2">
                <span className="text-text-secondary">Progresso</span>
                <span className="text-text-primary">{selectedBadge.current} / {selectedBadge.required}</span>
              </div>
              <div className="h-2 bg-surface rounded overflow-hidden">
                <div 
                  className={clsx('h-full', rarityColors[selectedBadge.rarity].bg.replace('/20', ''))}
                  style={{ width: `${selectedBadge.progress}%` }}
                />
              </div>
              <p className="text-right text-xs text-text-secondary mt-1">{selectedBadge.progress}%</p>
            </div>
            
            {selectedBadge.unlocked && selectedBadge.unlocked_at && (
              <p className="text-sm text-text-secondary text-center">
                Desbloqueado em {new Date(selectedBadge.unlocked_at).toLocaleDateString('pt-PT')}
              </p>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}

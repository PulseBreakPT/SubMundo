import { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useGame } from '../contexts/GameContext';
import { useCountdown, useMissionTimer } from '../hooks/useCountdown';
import { StatCard, Card, ProgressBar, CircularProgress, LevelProgress, HeatMeter, MiniSparkline, DonutChart, TrendIndicator } from '../components/ProgressBar';
import { Button, Badge, Modal, Tooltip, FadeIn, SlideIn, Tabs, Alert, Skeleton, Avatar, CountdownTimer, Dropdown } from '../components/UI';
import { LevelSystem, HeatSystem, getTipsAndStrategies, EconomySystem, TimeSystem, NotificationSystem } from '../utils/gameLogic';
import { getRandomWisdomQuote, QUOTES } from '../data/lore';
import { 
  DollarSign, Flame, Star, Zap, Gift, Target, 
  Skull, Wallet, Clock, ChevronRight, Shield,
  TrendingUp, Users, Car, Radio, Swords, Lightbulb, AlertTriangle,
  Home, Building2, Factory, ShoppingBag, Banknote, Award,
  Activity, Calendar, Bell, Settings, MessageSquare, MapPin,
  Eye, EyeOff, RefreshCw, Info, Crown, Sparkles,
  ArrowUp, ArrowDown, Minus, Heart, Lock, Unlock,
  BarChart2, PieChart, Layers, MoreVertical, ExternalLink,
  CheckCircle, XCircle, AlertCircle, Timer, Gauge, Compass
} from 'lucide-react';
import clsx from 'clsx';

// ============================================================================
// CONSTANTES E HELPERS
// ============================================================================

const QUICK_ACTIONS = [
  { id: 'roubo_rapido', name: 'Roubo Rápido', energy: 5, icon: Skull, color: 'error', risk: 'médio' },
  { id: 'hustle_rua', name: 'Hustle de Rua', energy: 8, icon: DollarSign, color: 'success', risk: 'baixo' },
  { id: 'evento_aleatorio', name: 'Evento Aleatório', energy: 3, icon: Star, color: 'gold', risk: 'variável' }
];

const DASHBOARD_TABS = [
  { id: 'overview', label: 'Visão Geral', icon: Home },
  { id: 'economy', label: 'Economia', icon: Banknote },
  { id: 'stats', label: 'Estatísticas', icon: BarChart2 },
  { id: 'activity', label: 'Atividade', icon: Activity }
];

const formatMoney = (value) => {
  if (value >= 1000000) return `€${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `€${(value / 1000).toFixed(1)}K`;
  return `€${value?.toFixed(0) || 0}`;
};

const formatTime = (seconds) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
};

// ============================================================================
// WIDGET: Quick Stats Banner
// ============================================================================

const QuickStatsBanner = ({ player, onClick }) => {
  const stats = [
    { label: 'Limpo', value: formatMoney(player.clean_money), icon: DollarSign, color: 'success' },
    { label: 'Sujo', value: formatMoney(player.dirty_money), icon: Wallet, color: 'warning' },
    { label: 'Heat', value: `${player.heat_individual}%`, icon: Flame, color: player.heat_individual > 50 ? 'error' : 'primary' },
    { label: 'Rep', value: player.reputation, icon: Star, color: 'gold' }
  ];

  return (
    <div className="grid grid-cols-4 gap-2">
      {stats.map((stat, i) => (
        <FadeIn key={stat.label} delay={i * 50}>
          <div 
            className="bg-surface border border-border p-3 text-center cursor-pointer hover:border-primary/50 transition-all"
            onClick={() => onClick?.(stat.label.toLowerCase())}
          >
            <stat.icon size={16} className={`text-${stat.color} mx-auto mb-1`} />
            <p className={`text-lg font-body font-bold text-${stat.color}`}>{stat.value}</p>
            <p className="text-[10px] text-text-secondary uppercase">{stat.label}</p>
          </div>
        </FadeIn>
      ))}
    </div>
  );
};

// ============================================================================
// WIDGET: Active Mission Card
// ============================================================================

const ActiveMissionWidget = ({ mission, onComplete, loading }) => {
  const { progress, isComplete, formatRemaining } = useMissionTimer(
    mission?.started_at,
    mission?.duration_seconds
  );

  if (!mission) return null;

  return (
    <FadeIn>
      <Card 
        title="Missão Ativa" 
        icon={Target}
        accentColor={isComplete ? 'success' : 'warning'}
        badge={isComplete ? 'PRONTA' : 'EM PROGRESSO'}
      >
        <div className="space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <h4 className="font-heading text-lg text-text-primary">{mission.name}</h4>
              <p className="text-text-secondary text-sm">{mission.description}</p>
            </div>
            <div className="text-right">
              <p className="text-success font-body">
                €{mission.reward_min} - €{mission.reward_max}
              </p>
              <p className="text-xs text-text-secondary">Recompensa</p>
            </div>
          </div>
          
          <ProgressBar
            value={progress}
            max={100}
            color={isComplete ? 'success' : 'warning'}
            showLabel={false}
            height="h-3"
            glow={isComplete}
          />
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-text-secondary">
              <Clock size={14} />
              <span>{isComplete ? 'Concluída!' : formatRemaining()}</span>
            </div>
            
            {mission.heat_impact > 0 && (
              <div className="flex items-center gap-1 text-sm text-error">
                <Flame size={14} />
                <span>+{mission.heat_impact}% heat</span>
              </div>
            )}
          </div>
          
          {isComplete && (
            <Button
              variant="success"
              fullWidth
              onClick={onComplete}
              loading={loading}
              icon={CheckCircle}
              glow
            >
              Concluir Missão
            </Button>
          )}
        </div>
      </Card>
    </FadeIn>
  );
};

// ============================================================================
// WIDGET: Quick Actions Panel
// ============================================================================

const QuickActionsPanel = ({ player, onAction, loading, disabled }) => {
  const [selectedAction, setSelectedAction] = useState(null);

  return (
    <Card title="Ações Rápidas" icon={Zap}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {QUICK_ACTIONS.map((action, i) => {
          const canPerform = player?.energy >= action.energy && !disabled;
          
          return (
            <FadeIn key={action.id} delay={i * 100}>
              <button
                className={clsx(
                  'w-full p-4 border transition-all',
                  canPerform 
                    ? 'bg-surface border-border hover:border-primary cursor-pointer' 
                    : 'bg-surface-highlight border-border opacity-50 cursor-not-allowed'
                )}
                onClick={() => canPerform && onAction(action.id)}
                disabled={!canPerform || loading}
              >
                <div className="flex flex-col items-center">
                  <div className={`w-12 h-12 flex items-center justify-center border border-${action.color}/30 bg-${action.color}/10 mb-2`}>
                    <action.icon size={24} className={`text-${action.color}`} />
                  </div>
                  <span className="font-heading text-sm text-text-primary">{action.name}</span>
                  <div className="flex items-center gap-2 mt-2 text-xs">
                    <span className="text-secondary">{action.energy} ⚡</span>
                    <span className="text-text-secondary">|</span>
                    <span className={clsx(
                      action.risk === 'baixo' && 'text-success',
                      action.risk === 'médio' && 'text-warning',
                      action.risk === 'alto' && 'text-error',
                      action.risk === 'variável' && 'text-purple-400'
                    )}>
                      Risco {action.risk}
                    </span>
                  </div>
                </div>
              </button>
            </FadeIn>
          );
        })}
      </div>
      
      {player?.energy < 3 && (
        <Alert variant="warning" className="mt-4">
          Energia baixa! Aguarda regeneração ou descansa.
        </Alert>
      )}
    </Card>
  );
};

// ============================================================================
// WIDGET: Daily Reward
// ============================================================================

const DailyRewardWidget = ({ player, onClaim, loading }) => {
  const dailyRewardTarget = useMemo(() => {
    if (!player?.last_daily_reward) return null;
    return new Date(new Date(player.last_daily_reward).getTime() + 86400000);
  }, [player?.last_daily_reward]);

  const { isExpired: canClaim, formatTime: formatDailyTime } = useCountdown(dailyRewardTarget);
  const isAvailable = canClaim || !player.last_daily_reward;

  return (
    <Card 
      title="Recompensa Diária" 
      icon={Gift}
      accentColor={isAvailable ? 'gold' : 'default'}
      headerAction={
        <Badge variant={isAvailable ? 'success' : 'default'}>
          {isAvailable ? 'Disponível' : formatDailyTime()}
        </Badge>
      }
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-text-secondary text-sm mb-1">
            {isAvailable 
              ? 'Reclama a tua recompensa diária!' 
              : 'Volta amanhã para mais recompensas.'}
          </p>
          <div className="flex items-center gap-2">
            <span className="text-gold text-xl font-body">€100 - €500</span>
            {player.daily_streak > 0 && (
              <Badge variant="gold" size="sm">
                <Flame size={12} className="mr-1" />
                {player.daily_streak} dias
              </Badge>
            )}
          </div>
        </div>
        <Button
          variant={isAvailable ? 'gold' : 'secondary'}
          disabled={!isAvailable}
          onClick={onClaim}
          loading={loading}
          icon={Gift}
          glow={isAvailable}
        >
          {isAvailable ? 'Reclamar' : 'Aguardar'}
        </Button>
      </div>
      
      {/* Streak bonus preview */}
      {player.daily_streak >= 3 && (
        <div className="mt-3 pt-3 border-t border-border">
          <div className="flex items-center justify-between text-sm">
            <span className="text-text-secondary">Bónus de streak:</span>
            <span className="text-gold">+{Math.min(player.daily_streak * 5, 50)}%</span>
          </div>
        </div>
      )}
    </Card>
  );
};

// ============================================================================
// WIDGET: Gang Status
// ============================================================================

const GangStatusWidget = ({ gang, wars, onClick }) => {
  if (!gang) {
    return (
      <Card title="Gangue" icon={Users} onClick={onClick} className="cursor-pointer">
        <div className="text-center py-6">
          <Users size={40} className="mx-auto text-text-secondary mb-3" />
          <p className="text-text-secondary mb-4">Ainda não pertences a nenhuma gangue.</p>
          <Button variant="primary" icon={Users}>
            Ver Gangues
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card 
      title={gang.name} 
      icon={Users}
      badge={`[${gang.tag}]`}
      headerAction={<ChevronRight size={18} className="text-text-secondary" />}
      onClick={onClick}
      className="cursor-pointer"
    >
      <div className="space-y-4">
        {/* Gang Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center">
            <p className="text-xl font-body text-primary">{gang.members_count || 1}</p>
            <p className="text-[10px] text-text-secondary uppercase">Membros</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-body text-gold">{gang.territories?.length || 0}</p>
            <p className="text-[10px] text-text-secondary uppercase">Territórios</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-body text-success">{formatMoney(gang.treasury)}</p>
            <p className="text-[10px] text-text-secondary uppercase">Cofre</p>
          </div>
        </div>
        
        {/* Active Wars */}
        {wars.length > 0 && (
          <div className="pt-3 border-t border-border">
            <div className="flex items-center gap-2 mb-2">
              <Swords size={14} className="text-error" />
              <span className="text-xs text-error uppercase">Guerras Ativas</span>
            </div>
            {wars.slice(0, 2).map(war => (
              <div key={war.id} className="flex items-center justify-between text-sm py-1">
                <span className="text-text-primary">{war.neighborhood_name}</span>
                <Badge variant="warning" size="xs">EM GUERRA</Badge>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
};

// ============================================================================
// WIDGET: Active Vehicle
// ============================================================================

const ActiveVehicleWidget = ({ vehicle, onClick }) => {
  if (!vehicle) return null;

  const conditionColor = vehicle.condition > 70 ? 'success' : vehicle.condition > 30 ? 'warning' : 'error';

  return (
    <Card 
      title="Veículo Ativo" 
      icon={Car}
      headerAction={<ChevronRight size={18} className="text-text-secondary" />}
      onClick={onClick}
      className="cursor-pointer"
    >
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 bg-surface-highlight border border-border flex items-center justify-center">
          <Car size={32} className="text-primary" />
        </div>
        <div className="flex-1">
          <p className="text-text-primary font-body text-lg">{vehicle.name}</p>
          <div className="grid grid-cols-3 gap-2 mt-2 text-xs">
            <div>
              <span className="text-text-secondary">Vel:</span>
              <span className="text-primary ml-1">{vehicle.speed}</span>
            </div>
            <div>
              <span className="text-text-secondary">Furt:</span>
              <span className="text-secondary ml-1">{vehicle.stealth}</span>
            </div>
            <div>
              <span className="text-text-secondary">Cond:</span>
              <span className={`text-${conditionColor} ml-1`}>{vehicle.condition}%</span>
            </div>
          </div>
        </div>
      </div>
      
      {vehicle.condition < 30 && (
        <Alert variant="error" className="mt-3">
          <AlertTriangle size={14} className="inline mr-1" />
          Veículo precisa de reparação!
        </Alert>
      )}
    </Card>
  );
};

// ============================================================================
// WIDGET: Events Banner
// ============================================================================

const EventsBanner = ({ events, onClick }) => {
  if (!events || events.length === 0) return null;

  return (
    <FadeIn>
      <div 
        className="bg-primary/10 border border-primary p-4 cursor-pointer hover:bg-primary/20 transition-all"
        onClick={onClick}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Radio size={24} className="text-primary animate-pulse" />
            <div>
              <p className="text-primary font-ui uppercase text-sm">Eventos Ativos</p>
              <p className="text-text-primary">
                {events.map(e => e.name).join(' • ')}
              </p>
            </div>
          </div>
          <ChevronRight size={20} className="text-primary" />
        </div>
      </div>
    </FadeIn>
  );
};

// ============================================================================
// WIDGET: Level Analysis
// ============================================================================

const LevelAnalysisWidget = ({ player }) => {
  const levelInfo = useMemo(() => {
    if (!player?.level) return null;
    const title = LevelSystem.getLevelTitle(player.level);
    const bonuses = LevelSystem.getLevelBonuses(player.level);
    const nextLevelXP = LevelSystem.calculateXPForLevel(player.level + 1);
    return { title, bonuses, nextLevelXP };
  }, [player?.level]);

  if (!levelInfo) return null;

  const bonusList = [
    { label: 'Sucesso Missões', value: `+${levelInfo.bonuses.missionSuccessBonus.toFixed(1)}%`, icon: Target },
    { label: 'Recompensas', value: `x${levelInfo.bonuses.rewardBonus.toFixed(2)}`, icon: DollarSign },
    { label: 'Energia Máx', value: `+${levelInfo.bonuses.maxEnergyBonus}`, icon: Zap },
    { label: 'Reputação', value: `x${levelInfo.bonuses.reputationMultiplier.toFixed(2)}`, icon: Star }
  ];

  return (
    <Card title="Análise de Nível" icon={TrendingUp}>
      <div className="space-y-4">
        {/* Current Level */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gold/10 border border-gold/30 flex items-center justify-center">
              <span className="text-xl font-heading text-gold">{player.level}</span>
            </div>
            <div>
              <p className="text-xs text-text-secondary uppercase">Título</p>
              <p className={clsx('font-heading', levelInfo.title.color)}>{levelInfo.title.title}</p>
            </div>
          </div>
          <CircularProgress
            value={player.experience}
            max={player.experience_max}
            size="sm"
            color="gold"
            showValue
          />
        </div>
        
        {/* Progress to next level */}
        <ProgressBar
          label="Experiência"
          value={player.experience}
          max={player.experience_max}
          color="gold"
          showPercentage
        />
        
        {/* Bonuses */}
        <div className="grid grid-cols-2 gap-2 pt-3 border-t border-border">
          {bonusList.map((bonus, i) => (
            <div key={i} className="flex items-center gap-2 text-xs">
              <bonus.icon size={12} className="text-gold" />
              <span className="text-text-secondary">{bonus.label}:</span>
              <span className="text-gold">{bonus.value}</span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
};

// ============================================================================
// WIDGET: Heat Status
// ============================================================================

const HeatStatusWidget = ({ player }) => {
  const heatStatus = useMemo(() => {
    if (player?.heat_individual === undefined) return null;
    const danger = HeatSystem.getDangerLevel(player.heat_individual);
    const advice = HeatSystem.getHeatAdvice(player.heat_individual);
    const modifiers = HeatSystem.getHeatModifiers(player.heat_individual);
    return { ...danger, advice, modifiers };
  }, [player?.heat_individual]);

  if (!heatStatus) return null;

  return (
    <HeatMeter
      value={player.heat_individual}
      showEffects
      effects={heatStatus.advice.slice(0, 3)}
    />
  );
};

// ============================================================================
// WIDGET: Economy Overview
// ============================================================================

const EconomyOverviewWidget = ({ player }) => {
  const totalWealth = (player?.clean_money || 0) + (player?.dirty_money || 0) + (player?.bank_balance || 0);
  
  const economyData = [
    { label: 'Limpo', value: player?.clean_money || 0, color: 'success' },
    { label: 'Sujo', value: player?.dirty_money || 0, color: 'warning' },
    { label: 'Banco', value: player?.bank_balance || 0, color: 'primary' }
  ];

  return (
    <Card title="Visão Económica" icon={Banknote}>
      <div className="flex items-center gap-6">
        <DonutChart
          data={economyData}
          size={100}
          strokeWidth={15}
          showLegend={false}
          showTotal
          totalLabel="Total"
        />
        
        <div className="flex-1 space-y-2">
          {economyData.map((item, i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 bg-${item.color}`} />
                <span className="text-sm text-text-secondary">{item.label}</span>
              </div>
              <span className={`text-sm font-body text-${item.color}`}>
                {formatMoney(item.value)}
              </span>
            </div>
          ))}
        </div>
      </div>
      
      {/* Quick actions */}
      <div className="flex gap-2 mt-4 pt-4 border-t border-border">
        <Button variant="secondary" size="sm" fullWidth icon={Banknote}>
          Depositar
        </Button>
        <Button variant="secondary" size="sm" fullWidth icon={RefreshCw}>
          Lavar
        </Button>
      </div>
    </Card>
  );
};

// ============================================================================
// WIDGET: Wisdom Quote
// ============================================================================

const WisdomQuoteWidget = () => {
  const [quote, setQuote] = useState(() => getRandomWisdomQuote());
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refreshQuote = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setQuote(getRandomWisdomQuote());
      setIsRefreshing(false);
    }, 300);
  };

  return (
    <div className="bg-primary/10 border border-primary/30 p-4 relative">
      <button 
        onClick={refreshQuote}
        className="absolute top-2 right-2 p-1 hover:bg-primary/20 rounded transition-colors"
      >
        <RefreshCw size={14} className={clsx('text-primary', isRefreshing && 'animate-spin')} />
      </button>
      
      <div className="flex items-start gap-3 pr-8">
        <Lightbulb size={24} className="text-primary flex-shrink-0" />
        <div>
          <p className="text-xs text-primary uppercase tracking-wider mb-1">Sabedoria do Submundo</p>
          <p className={clsx(
            'text-text-primary italic transition-opacity',
            isRefreshing ? 'opacity-0' : 'opacity-100'
          )}>
            "{quote}"
          </p>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// WIDGET: Tips Panel
// ============================================================================

const TipsPanel = ({ player }) => {
  const tips = useMemo(() => {
    const allTips = getTipsAndStrategies();
    const level = player?.level || 1;
    
    if (level < 5) return allTips.beginner || allTips.general?.slice(0, 3);
    if (level < 20) return allTips.general?.slice(0, 4);
    return allTips.advanced || allTips.general?.slice(-3);
  }, [player?.level]);

  if (!tips?.length) return null;

  return (
    <Card title="Dicas" icon={Lightbulb} collapsible defaultCollapsed>
      <div className="space-y-2">
        {tips.map((tip, idx) => (
          <div key={idx} className="flex items-start gap-2 text-sm text-text-secondary">
            <span className="text-primary">•</span>
            <span>{tip}</span>
          </div>
        ))}
      </div>
    </Card>
  );
};

// ============================================================================
// WIDGET: Stats Summary
// ============================================================================

const StatsSummaryWidget = ({ player }) => {
  const stats = [
    { label: 'Missões', value: player.total_missions, color: 'primary' },
    { label: 'Sucessos', value: player.successful_missions, color: 'success' },
    { label: 'Prisões', value: player.times_arrested, color: 'error' }
  ];

  const successRate = player.total_missions > 0 
    ? ((player.successful_missions / player.total_missions) * 100).toFixed(1)
    : 0;

  return (
    <Card title="Resumo" icon={BarChart2}>
      <div className="grid grid-cols-3 gap-4 mb-4">
        {stats.map((stat, i) => (
          <div key={i} className="text-center">
            <p className={`text-2xl font-body text-${stat.color}`}>{stat.value}</p>
            <p className="text-xs text-text-secondary uppercase">{stat.label}</p>
          </div>
        ))}
      </div>
      
      <div className="pt-4 border-t border-border">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-text-secondary">Taxa de Sucesso</span>
          <span className={clsx(
            'text-sm font-body',
            successRate >= 70 ? 'text-success' : successRate >= 40 ? 'text-warning' : 'text-error'
          )}>
            {successRate}%
          </span>
        </div>
        <ProgressBar
          value={parseFloat(successRate)}
          max={100}
          color={successRate >= 70 ? 'success' : successRate >= 40 ? 'warning' : 'error'}
          showLabel={false}
          height="h-2"
        />
      </div>
    </Card>
  );
};

// ============================================================================
// WIDGET: Activity Timeline
// ============================================================================

const ActivityTimelineWidget = ({ activities = [] }) => {
  const recentActivities = activities.slice(0, 5);

  if (recentActivities.length === 0) {
    return (
      <Card title="Atividade Recente" icon={Activity}>
        <div className="text-center py-6 text-text-secondary">
          <Activity size={32} className="mx-auto mb-2 opacity-50" />
          <p>Sem atividade recente</p>
        </div>
      </Card>
    );
  }

  return (
    <Card title="Atividade Recente" icon={Activity}>
      <div className="space-y-3">
        {recentActivities.map((activity, i) => (
          <div key={i} className="flex items-start gap-3">
            <div className={clsx(
              'w-8 h-8 flex items-center justify-center rounded-full',
              activity.type === 'success' && 'bg-success/20',
              activity.type === 'error' && 'bg-error/20',
              activity.type === 'info' && 'bg-primary/20',
              activity.type === 'warning' && 'bg-warning/20'
            )}>
              {activity.icon ? (
                <activity.icon size={14} className={clsx(
                  activity.type === 'success' && 'text-success',
                  activity.type === 'error' && 'text-error',
                  activity.type === 'info' && 'text-primary',
                  activity.type === 'warning' && 'text-warning'
                )} />
              ) : (
                <Activity size={14} className="text-text-secondary" />
              )}
            </div>
            <div className="flex-1">
              <p className="text-sm text-text-primary">{activity.title}</p>
              <p className="text-xs text-text-secondary">{activity.time}</p>
            </div>
            {activity.value && (
              <span className={clsx(
                'text-sm font-body',
                activity.type === 'success' && 'text-success',
                activity.type === 'error' && 'text-error'
              )}>
                {activity.value}
              </span>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
};

// ============================================================================
// WIDGET: Properties Overview
// ============================================================================

const PropertiesOverviewWidget = ({ properties = [], onClick }) => {
  const totalIncome = properties.reduce((sum, p) => sum + (p.income_per_hour || 0), 0);
  const needsMaintenance = properties.filter(p => p.condition < 50).length;

  return (
    <Card 
      title="Propriedades" 
      icon={Building2}
      headerAction={
        <Badge variant="primary">{properties.length}</Badge>
      }
      onClick={onClick}
      className="cursor-pointer"
    >
      {properties.length === 0 ? (
        <div className="text-center py-4">
          <Building2 size={32} className="mx-auto mb-2 text-text-secondary" />
          <p className="text-text-secondary text-sm">Sem propriedades</p>
          <Button variant="primary" size="sm" className="mt-3">
            Comprar Propriedade
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-text-secondary text-sm">Rendimento/hora:</span>
            <span className="text-success font-body">{formatMoney(totalIncome)}</span>
          </div>
          
          {needsMaintenance > 0 && (
            <Alert variant="warning" closable={false}>
              {needsMaintenance} propriedade(s) precisa(m) de manutenção
            </Alert>
          )}
          
          <Button variant="secondary" size="sm" fullWidth icon={ChevronRight}>
            Ver Propriedades
          </Button>
        </div>
      )}
    </Card>
  );
};

// ============================================================================
// WIDGET: Businesses Overview
// ============================================================================

const BusinessesOverviewWidget = ({ businesses = [], onClick }) => {
  const activeProduction = businesses.filter(b => b.production_active).length;

  return (
    <Card 
      title="Negócios" 
      icon={Factory}
      headerAction={
        <Badge variant="gold">{businesses.length}</Badge>
      }
      onClick={onClick}
      className="cursor-pointer"
    >
      {businesses.length === 0 ? (
        <div className="text-center py-4">
          <Factory size={32} className="mx-auto mb-2 text-text-secondary" />
          <p className="text-text-secondary text-sm">Sem negócios</p>
          <Button variant="gold" size="sm" className="mt-3">
            Abrir Negócio
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {activeProduction > 0 && (
            <div className="flex items-center gap-2 p-2 bg-gold/10 border border-gold/30">
              <Activity size={16} className="text-gold animate-pulse" />
              <span className="text-sm text-gold">
                {activeProduction} produção(s) ativa(s)
              </span>
            </div>
          )}
          
          <Button variant="secondary" size="sm" fullWidth icon={ChevronRight}>
            Gerir Negócios
          </Button>
        </div>
      )}
    </Card>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function HomePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { 
    gameState, 
    activeMission, 
    myGang,
    gangWars,
    activeVehicle,
    cityEvents,
    actionLoading,
    performQuickAction, 
    claimDailyReward,
    completeMission 
  } = useGame();

  const [activeTab, setActiveTab] = useState('overview');
  const [showDetailedStats, setShowDetailedStats] = useState(false);

  const player = gameState?.player || user;

  // Handler functions
  const handleQuickAction = useCallback(async (actionType) => {
    await performQuickAction(actionType);
  }, [performQuickAction]);

  const handleClaimDaily = useCallback(async () => {
    await claimDailyReward();
  }, [claimDailyReward]);

  const handleCompleteMission = useCallback(async () => {
    if (activeMission) {
      await completeMission(activeMission.id);
    }
  }, [activeMission, completeMission]);

  // Loading state
  if (!player) {
    return (
      <div className="space-y-6 animate-fade-in">
        <Skeleton variant="title" />
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} variant="card" />)}
        </div>
        <Skeleton variant="card" height={200} />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in" data-testid="home-page">
      {/* Welcome Section */}
      <FadeIn>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Avatar
              name={player.username}
              size="lg"
              status="online"
            />
            <div>
              <h1 className="font-heading text-2xl md:text-3xl text-text-primary">
                Olá, {player.username}
              </h1>
              <p className="text-text-secondary text-sm flex items-center gap-2">
                <Crown size={14} className="text-gold" />
                Nível {player.level} • {player.main_neighborhood?.toUpperCase() || 'CENTRO'}
              </p>
            </div>
          </div>
          
          <div className="hidden md:flex items-center gap-2">
            <Tooltip content="Configurações">
              <button className="p-2 hover:bg-surface-highlight transition-colors">
                <Settings size={20} className="text-text-secondary" />
              </button>
            </Tooltip>
            <Tooltip content="Notificações">
              <button className="p-2 hover:bg-surface-highlight transition-colors relative">
                <Bell size={20} className="text-text-secondary" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-error rounded-full" />
              </button>
            </Tooltip>
          </div>
        </div>
      </FadeIn>

      {/* Quick Stats */}
      <QuickStatsBanner 
        player={player} 
        onClick={(stat) => {
          if (stat === 'heat') navigate('/perfil');
          if (stat === 'limpo' || stat === 'sujo') navigate('/banco');
        }}
      />

      {/* Active Events Banner */}
      <EventsBanner events={cityEvents} onClick={() => navigate('/eventos')} />

      {/* Dashboard Tabs (Mobile) */}
      <div className="md:hidden">
        <Tabs
          tabs={DASHBOARD_TABS}
          activeTab={activeTab}
          onChange={setActiveTab}
          variant="pills"
          fullWidth
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Progress Section */}
          <FadeIn delay={100}>
            <Card title="Progresso" icon={TrendingUp}>
              <div className="space-y-4">
                <ProgressBar
                  label="Experiência"
                  value={player.experience}
                  max={player.experience_max}
                  color="primary"
                  showPercentage
                />
                <ProgressBar
                  label="Energia"
                  value={player.energy}
                  max={player.energy_max}
                  color="secondary"
                  showPercentage
                />
                <ProgressBar
                  label="Reputação"
                  value={player.reputation}
                  max={player.reputation_max}
                  color="gold"
                  showPercentage
                />
              </div>
            </Card>
          </FadeIn>

          {/* Active Mission */}
          <ActiveMissionWidget 
            mission={activeMission}
            onComplete={handleCompleteMission}
            loading={actionLoading}
          />

          {/* Quick Actions */}
          {!activeMission && (
            <FadeIn delay={200}>
              <QuickActionsPanel
                player={player}
                onAction={handleQuickAction}
                loading={actionLoading}
                disabled={activeMission}
              />
            </FadeIn>
          )}

          {/* Level & Heat Analysis */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FadeIn delay={250}>
              <LevelAnalysisWidget player={player} />
            </FadeIn>
            <FadeIn delay={300}>
              <HeatStatusWidget player={player} />
            </FadeIn>
          </div>

          {/* Stats Summary */}
          <FadeIn delay={350}>
            <StatsSummaryWidget player={player} />
          </FadeIn>
        </div>

        {/* Right Column - Sidebar */}
        <div className="space-y-6">
          {/* Daily Reward */}
          <FadeIn delay={100}>
            <DailyRewardWidget
              player={player}
              onClaim={handleClaimDaily}
              loading={actionLoading}
            />
          </FadeIn>

          {/* Active Vehicle */}
          <FadeIn delay={150}>
            <ActiveVehicleWidget 
              vehicle={activeVehicle}
              onClick={() => navigate('/veiculos')}
            />
          </FadeIn>

          {/* Gang Status */}
          <FadeIn delay={200}>
            <GangStatusWidget
              gang={myGang}
              wars={gangWars}
              onClick={() => navigate('/gangue')}
            />
          </FadeIn>

          {/* Economy Overview */}
          <FadeIn delay={250}>
            <EconomyOverviewWidget player={player} />
          </FadeIn>

          {/* Properties Overview */}
          <FadeIn delay={300}>
            <PropertiesOverviewWidget 
              properties={player.properties || []}
              onClick={() => navigate('/propriedades')}
            />
          </FadeIn>

          {/* Businesses Overview */}
          <FadeIn delay={350}>
            <BusinessesOverviewWidget
              businesses={player.businesses || []}
              onClick={() => navigate('/negocios')}
            />
          </FadeIn>

          {/* Wisdom Quote */}
          <FadeIn delay={400}>
            <WisdomQuoteWidget />
          </FadeIn>

          {/* Tips Panel */}
          <FadeIn delay={450}>
            <TipsPanel player={player} />
          </FadeIn>
        </div>
      </div>
    </div>
  );
}

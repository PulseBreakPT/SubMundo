import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useGame } from '../contexts/GameContext';
import { useAuth } from '../contexts/AuthContext';
import { Card, ProgressBar, StatCard, CircularProgress, MiniSparkline } from '../components/ProgressBar';
import { Button, Badge, Modal, Tabs, Select, SearchInput, FilterBar, Pagination, Alert, Tooltip, FadeIn, SlideIn, Skeleton, Toggle, RadioGroup, Dropdown, EmptyState } from '../components/UI';
import { useMissionTimer } from '../hooks/useCountdown';
import { MissionSystem, HeatSystem, VehicleSystem, formatTimeRemaining } from '../utils/gameLogic';
import { 
  Target, Clock, Flame, DollarSign, Zap, 
  AlertTriangle, CheckCircle, XCircle, Star,
  Crosshair, Shield, Lock, Unlock, Users, Sparkles,
  Filter, Search, SortAsc, SortDesc, ChevronRight, ChevronDown,
  Trophy, Skull, Car, MapPin, BarChart2, Eye, EyeOff,
  Play, Pause, RefreshCw, Settings, Info, ArrowUp, ArrowDown,
  Calendar, TrendingUp, TrendingDown, Award, Crown, Layers,
  Timer, Gauge, Activity, Radio, Briefcase, Hammer,
  FileText, List, Grid3X3, MoreVertical, Bookmark, Bell,
  ThumbsUp, ThumbsDown, MessageSquare, Share2
} from 'lucide-react';
import clsx from 'clsx';

// ============================================================================
// CONSTANTES
// ============================================================================

const MISSION_CATEGORIES = [
  { id: 'all', label: 'Todas', icon: Layers },
  { id: 'crime', label: 'Crime', icon: Skull },
  { id: 'legal', label: 'Legal', icon: Briefcase },
  { id: 'procedural', label: 'Especiais', icon: Sparkles },
  { id: 'heists', label: 'Heists', icon: Crosshair }
];

const SORT_OPTIONS = [
  { value: 'recommended', label: 'Recomendadas' },
  { value: 'reward_high', label: 'Maior Recompensa' },
  { value: 'reward_low', label: 'Menor Recompensa' },
  { value: 'risk_low', label: 'Menor Risco' },
  { value: 'risk_high', label: 'Maior Risco' },
  { value: 'duration_short', label: 'Mais Rápidas' },
  { value: 'energy_low', label: 'Menor Energia' }
];

const VIEW_MODES = [
  { id: 'grid', icon: Grid3X3 },
  { id: 'list', icon: List }
];

const formatMoney = (value) => {
  if (value >= 1000000) return `€${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `€${(value / 1000).toFixed(1)}K`;
  return `€${value?.toLocaleString() || 0}`;
};

// ============================================================================
// COMPONENTE: Mission Stats Bar
// ============================================================================

const MissionStatsBar = ({ player, missions, activeMission }) => {
  const stats = useMemo(() => {
    const successRate = player?.total_missions > 0 
      ? ((player.successful_missions / player.total_missions) * 100).toFixed(1)
      : 0;
    
    return [
      { label: 'Concluídas', value: player?.successful_missions || 0, icon: CheckCircle, color: 'success' },
      { label: 'Total', value: player?.total_missions || 0, icon: Target, color: 'primary' },
      { label: 'Taxa Sucesso', value: `${successRate}%`, icon: Trophy, color: successRate >= 70 ? 'success' : successRate >= 40 ? 'warning' : 'error' },
      { label: 'Energia', value: `${player?.energy || 0}/${player?.energy_max || 100}`, icon: Zap, color: 'secondary' }
    ];
  }, [player]);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {stats.map((stat, i) => (
        <FadeIn key={stat.label} delay={i * 50}>
          <div className="bg-surface border border-border p-3 flex items-center gap-3">
            <div className={`w-10 h-10 flex items-center justify-center bg-${stat.color}/10 border border-${stat.color}/30`}>
              <stat.icon size={18} className={`text-${stat.color}`} />
            </div>
            <div>
              <p className={`text-lg font-body font-bold text-${stat.color}`}>{stat.value}</p>
              <p className="text-[10px] text-text-secondary uppercase">{stat.label}</p>
            </div>
          </div>
        </FadeIn>
      ))}
    </div>
  );
};

// ============================================================================
// COMPONENTE: Active Mission Banner
// ============================================================================

const ActiveMissionBanner = ({ mission, onComplete, loading }) => {
  const { progress, isComplete, formatRemaining } = useMissionTimer(
    mission?.started_at,
    mission?.duration_seconds
  );

  if (!mission) return null;

  return (
    <FadeIn>
      <Card 
        className="border-warning"
        accentColor="warning"
      >
        <div className="flex items-center gap-2 mb-3">
          <Clock size={18} className="text-warning animate-pulse" />
          <h3 className="font-heading text-lg text-warning">MISSÃO EM PROGRESSO</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="md:col-span-2">
            <h4 className="font-heading text-text-primary text-lg">{mission.name}</h4>
            <p className="text-text-secondary text-sm mt-1">{mission.description}</p>
            
            <div className="flex flex-wrap gap-3 mt-3">
              <Badge variant={isComplete ? 'success' : 'warning'}>
                <Clock size={12} className="mr-1" />
                {isComplete ? 'Pronta!' : formatRemaining()}
              </Badge>
              <Badge variant="success">
                <DollarSign size={12} className="mr-1" />
                €{mission.reward_min} - €{mission.reward_max}
              </Badge>
              <Badge variant="error">
                <Flame size={12} className="mr-1" />
                +{mission.heat_impact}% heat
              </Badge>
            </div>
          </div>
          
          <div className="flex flex-col items-center justify-center">
            <CircularProgress
              value={progress}
              max={100}
              size="lg"
              color={isComplete ? 'success' : 'warning'}
              showValue
              glow={isComplete}
            />
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
        
        {isComplete && (
          <Button
            variant="success"
            fullWidth
            onClick={onComplete}
            loading={loading}
            className="mt-4"
            icon={CheckCircle}
            glow
          >
            Concluir e Receber Recompensa
          </Button>
        )}
      </Card>
    </FadeIn>
  );
};

// ============================================================================
// COMPONENTE: Active Heist Session
// ============================================================================

const ActiveHeistSession = ({ session, onPhase, loading }) => {
  if (!session) return null;

  const progressPercent = ((session.current_phase + 1) / session.total_phases) * 100;

  return (
    <FadeIn>
      <Card className="border-gold bg-gold/5" accentColor="gold">
        <div className="flex items-center gap-2 mb-3">
          <Crosshair size={18} className="text-gold animate-pulse" />
          <h3 className="font-heading text-lg text-gold">HEIST EM PROGRESSO</h3>
        </div>
        
        <div className="space-y-4">
          <div>
            <h4 className="font-heading text-text-primary">{session.heist}</h4>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="gold">
                Fase {session.current_phase + 1} de {session.total_phases}
              </Badge>
            </div>
          </div>
          
          {/* Progress Steps */}
          <div className="flex items-center gap-1">
            {Array(session.total_phases).fill(0).map((_, i) => (
              <div 
                key={i}
                className={clsx(
                  'flex-1 h-2 transition-all',
                  i < session.current_phase ? 'bg-gold' : 
                  i === session.current_phase ? 'bg-gold/50 animate-pulse' : 
                  'bg-border'
                )}
              />
            ))}
          </div>
          
          {session.next_phase && (
            <div className="bg-surface p-4 border border-border">
              <p className="text-xs text-text-secondary uppercase mb-1">Próxima Fase</p>
              <p className="font-heading text-text-primary">{session.next_phase.name}</p>
              {session.next_phase.skill && (
                <Badge variant="primary" size="sm" className="mt-2">
                  <Zap size={12} className="mr-1" />
                  Skill: {session.next_phase.skill}
                </Badge>
              )}
              <div className="flex items-center gap-2 mt-2 text-xs text-text-secondary">
                <Clock size={12} />
                <span>Duração: {session.next_phase.duration}s</span>
              </div>
            </div>
          )}
          
          <Button
            variant="gold"
            fullWidth
            onClick={onPhase}
            loading={loading}
            icon={Play}
            glow
          >
            Executar Fase
          </Button>
        </div>
      </Card>
    </FadeIn>
  );
};

// ============================================================================
// COMPONENTE: Mission Card (Grid View)
// ============================================================================

const MissionCardGrid = ({ mission, player, vehicle, canStart, onSelect, recommended }) => {
  const [isHovered, setIsHovered] = useState(false);

  const successChance = useMemo(() => {
    if (!player) return 50;
    return MissionSystem.calculateSuccessChance(mission, player, vehicle);
  }, [mission, player, vehicle]);

  const estimatedReward = useMemo(() => {
    if (!player) return { min: mission.reward_min, max: mission.reward_max };
    return MissionSystem.estimateReward(mission, player);
  }, [mission, player]);

  const efficiency = useMemo(() => {
    return MissionSystem.calculateEnergyEfficiency(mission, estimatedReward);
  }, [mission, estimatedReward]);

  const getRiskColor = (risk) => {
    if (risk >= 6) return 'error';
    if (risk >= 3) return 'warning';
    return 'success';
  };

  const getRiskLabel = (risk) => {
    if (risk >= 6) return 'Alto';
    if (risk >= 3) return 'Médio';
    return 'Baixo';
  };

  return (
    <div
      className={clsx(
        'bg-surface border border-border relative overflow-hidden transition-all',
        canStart ? 'cursor-pointer hover:border-primary/50 hover:shadow-lg' : 'opacity-60',
        recommended && 'ring-2 ring-gold/50'
      )}
      onClick={() => canStart && onSelect(mission)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Risk indicator */}
      <div 
        className="absolute top-0 left-0 w-1 h-full"
        style={{
          backgroundColor: mission.risk >= 6 ? '#FF003C' : mission.risk >= 3 ? '#FFD600' : '#00FF9D'
        }} 
      />
      
      {/* Recommended badge */}
      {recommended && (
        <div className="absolute top-2 right-2">
          <Badge variant="gold" size="xs">
            <Star size={10} className="mr-1" /> Recomendada
          </Badge>
        </div>
      )}
      
      <div className="p-4">
        {/* Header */}
        <div className="mb-3">
          <div className="flex items-start justify-between mb-1">
            <h3 className="font-heading text-lg text-text-primary pr-16">
              {mission.name}
            </h3>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant={mission.category === 'legal' ? 'success' : 'error'} size="sm">
              {mission.category === 'legal' ? 'LEGAL' : 'CRIME'}
            </Badge>
            <Badge variant={getRiskColor(mission.risk)} size="sm">
              <AlertTriangle size={10} className="mr-1" />
              Risco {getRiskLabel(mission.risk)}
            </Badge>
          </div>
        </div>
        
        {/* Description */}
        <p className="text-text-secondary text-sm mb-4 line-clamp-2">
          {mission.description}
        </p>
        
        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2">
            <Clock size={14} className="text-text-secondary" />
            <span className="text-text-primary">{mission.duration_seconds}s</span>
          </div>
          <div className="flex items-center gap-2">
            <Zap size={14} className="text-secondary" />
            <span className="text-secondary">{mission.energy_cost} energia</span>
          </div>
          <div className="flex items-center gap-2">
            <DollarSign size={14} className="text-success" />
            <span className="text-success">
              {formatMoney(estimatedReward.min)} - {formatMoney(estimatedReward.max)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Flame size={14} className="text-error" />
            <span className="text-error">+{mission.heat_impact}%</span>
          </div>
        </div>
        
        {/* Success Chance & Efficiency */}
        <div className="mt-4 pt-4 border-t border-border">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Target size={14} className="text-primary" />
              <span className="text-xs text-text-secondary">Chance de Sucesso</span>
            </div>
            <span className={clsx(
              'text-sm font-body',
              successChance >= 70 ? 'text-success' : successChance >= 40 ? 'text-warning' : 'text-error'
            )}>
              {successChance}%
            </span>
          </div>
          <ProgressBar
            value={successChance}
            max={100}
            color={successChance >= 70 ? 'success' : successChance >= 40 ? 'warning' : 'error'}
            showLabel={false}
            height="h-1.5"
          />
          
          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center gap-1">
              {Array(5).fill(0).map((_, i) => (
                <Star 
                  key={i} 
                  size={12} 
                  className={i < efficiency.stars ? 'text-gold fill-gold' : 'text-border'}
                />
              ))}
              <span className="text-xs text-text-secondary ml-1">{efficiency.label}</span>
            </div>
            <span className="text-xs text-gold">
              +{efficiency.rewardPerEnergy.toFixed(0)}€/⚡
            </span>
          </div>
        </div>
        
        {/* Reputation */}
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border">
          <Star size={14} className="text-gold" />
          <span className="text-gold text-sm">+{mission.reputation_impact} reputação</span>
        </div>
      </div>
      
      {/* Hover overlay */}
      {isHovered && canStart && (
        <div className="absolute inset-0 bg-primary/10 flex items-center justify-center animate-fade-in">
          <Button variant="primary" size="lg" icon={Play}>
            Iniciar Missão
          </Button>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// COMPONENTE: Mission Card (List View)
// ============================================================================

const MissionCardList = ({ mission, player, vehicle, canStart, onSelect, recommended }) => {
  const successChance = useMemo(() => {
    if (!player) return 50;
    return MissionSystem.calculateSuccessChance(mission, player, vehicle);
  }, [mission, player, vehicle]);

  const getRiskColor = (risk) => {
    if (risk >= 6) return 'error';
    if (risk >= 3) return 'warning';
    return 'success';
  };

  return (
    <div
      className={clsx(
        'bg-surface border border-border p-4 flex items-center gap-4 transition-all',
        canStart ? 'cursor-pointer hover:border-primary/50' : 'opacity-60',
        recommended && 'border-l-4 border-l-gold'
      )}
      onClick={() => canStart && onSelect(mission)}
    >
      {/* Risk indicator */}
      <div 
        className="w-2 h-16 flex-shrink-0"
        style={{
          backgroundColor: mission.risk >= 6 ? '#FF003C' : mission.risk >= 3 ? '#FFD600' : '#00FF9D'
        }} 
      />
      
      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="font-heading text-text-primary truncate">{mission.name}</h3>
          {recommended && <Star size={14} className="text-gold flex-shrink-0" />}
        </div>
        <p className="text-text-secondary text-sm truncate">{mission.description}</p>
      </div>
      
      {/* Stats */}
      <div className="hidden md:flex items-center gap-6 text-sm">
        <div className="text-center">
          <p className="text-text-primary font-body">{mission.duration_seconds}s</p>
          <p className="text-[10px] text-text-secondary">Duração</p>
        </div>
        <div className="text-center">
          <p className="text-secondary font-body">{mission.energy_cost}</p>
          <p className="text-[10px] text-text-secondary">Energia</p>
        </div>
        <div className="text-center">
          <p className="text-success font-body">€{mission.reward_max}</p>
          <p className="text-[10px] text-text-secondary">Recompensa</p>
        </div>
        <div className="text-center">
          <p className={`font-body text-${getRiskColor(mission.risk)}`}>{successChance}%</p>
          <p className="text-[10px] text-text-secondary">Sucesso</p>
        </div>
      </div>
      
      {/* Action */}
      <Button 
        variant="primary" 
        size="sm" 
        icon={Play}
        disabled={!canStart}
      >
        Iniciar
      </Button>
    </div>
  );
};

// ============================================================================
// COMPONENTE: Heist Card
// ============================================================================

const HeistCard = ({ heist, onStart, loading, disabled }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card 
      className={clsx(
        heist.on_cooldown && 'opacity-60',
        !heist.can_attempt && !heist.on_cooldown && 'opacity-80'
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-heading text-lg text-text-primary">{heist.name}</h3>
          <p className="text-sm text-text-secondary mt-1">{heist.description}</p>
        </div>
        {heist.on_cooldown ? (
          <Badge variant="default"><Lock size={12} className="mr-1" /> Cooldown</Badge>
        ) : heist.can_attempt ? (
          <Badge variant="success"><Unlock size={12} className="mr-1" /> Disponível</Badge>
        ) : (
          <Badge variant="error">Nv.{heist.level_required} req.</Badge>
        )}
      </div>
      
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <div className="flex items-center gap-2 text-sm">
          <AlertTriangle size={14} className="text-warning" />
          <span>Dificuldade: {heist.difficulty}/10</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Target size={14} className="text-primary" />
          <span>{heist.phases} fases</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Users size={14} className="text-text-secondary" />
          <span>Crew: {heist.crew_required}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Flame size={14} className="text-error" />
          <span>+{heist.heat_impact}% heat</span>
        </div>
      </div>
      
      {/* Requirements (Expandable) */}
      {heist.requirements && (
        <div className="mb-4">
          <button 
            className="flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary"
            onClick={() => setExpanded(!expanded)}
          >
            <Info size={14} />
            <span>Ver requisitos</span>
            <ChevronDown size={14} className={clsx('transition-transform', expanded && 'rotate-180')} />
          </button>
          
          {expanded && (
            <div className="mt-3 p-3 bg-surface-highlight border border-border text-sm space-y-2 animate-fade-in">
              {heist.requirements.map((req, i) => (
                <div key={i} className="flex items-center gap-2">
                  {req.met ? (
                    <CheckCircle size={14} className="text-success" />
                  ) : (
                    <XCircle size={14} className="text-error" />
                  )}
                  <span className={req.met ? 'text-text-primary' : 'text-error'}>
                    {req.description}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      
      {/* Reward & Action */}
      <div className="flex items-center justify-between pt-4 border-t border-border">
        <div>
          <span className="text-success font-body text-lg">€{heist.base_reward.toLocaleString()}</span>
          <span className="text-text-secondary mx-1">-</span>
          <span className="text-gold font-body text-lg">€{heist.max_reward.toLocaleString()}</span>
        </div>
        <Button
          variant="gold"
          disabled={!heist.can_attempt || heist.on_cooldown || disabled}
          onClick={() => onStart(heist.id)}
          loading={loading}
          icon={Crosshair}
        >
          {heist.on_cooldown ? 'Em Cooldown' : 'Iniciar Heist'}
        </Button>
      </div>
    </Card>
  );
};

// ============================================================================
// COMPONENTE: Procedural Mission Card
// ============================================================================

const ProceduralMissionCard = ({ mission, player, canStart, onSelect }) => {
  const getRiskColor = (difficulty) => {
    if (difficulty >= 6) return 'error';
    if (difficulty >= 3) return 'warning';
    return 'success';
  };

  return (
    <Card className="border-l-4 border-l-purple-400">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-heading text-lg text-text-primary">{mission.name}</h3>
          <p className="text-sm text-text-secondary">{mission.description}</p>
          {mission.modifiers?.length > 0 && (
            <div className="flex gap-2 mt-2">
              {mission.modifiers.map(mod => (
                <Badge key={mod} variant="purple" size="sm">{mod}</Badge>
              ))}
            </div>
          )}
        </div>
        <Badge variant={getRiskColor(mission.difficulty)}>
          Dificuldade {mission.difficulty}/10
        </Badge>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4 text-sm">
        <div className="flex items-center gap-2">
          <Target size={14} className="text-primary" />
          <span>Sucesso: {mission.success_chance}%</span>
        </div>
        <div className="flex items-center gap-2">
          <Clock size={14} className="text-text-secondary" />
          <span>{Math.round(mission.duration_seconds / 60)}min</span>
        </div>
        <div className="flex items-center gap-2">
          <Zap size={14} className="text-secondary" />
          <span>{mission.energy_cost} energia</span>
        </div>
        <div className="flex items-center gap-2">
          <Flame size={14} className="text-error" />
          <span>+{mission.heat_impact}% heat</span>
        </div>
      </div>
      
      <div className="flex items-center justify-between pt-4 border-t border-border">
        <div>
          <span className="text-success font-body">€{mission.reward_min.toLocaleString()}</span>
          <span className="text-text-secondary mx-1">-</span>
          <span className="text-gold font-body">€{mission.reward_max.toLocaleString()}</span>
        </div>
        <Button
          variant="primary"
          disabled={!canStart || player?.energy < mission.energy_cost}
          onClick={() => onSelect(mission)}
          icon={Play}
        >
          Iniciar Missão
        </Button>
      </div>
    </Card>
  );
};

// ============================================================================
// COMPONENTE: Mission Confirmation Modal
// ============================================================================

const MissionConfirmModal = ({ mission, player, vehicle, isOpen, onClose, onConfirm, loading }) => {
  if (!mission) return null;

  const successChance = MissionSystem.calculateSuccessChance(mission, player, vehicle);
  const estimatedReward = MissionSystem.estimateReward(mission, player);
  const efficiency = MissionSystem.calculateEnergyEfficiency(mission, estimatedReward);
  const heatModifiers = HeatSystem.getHeatModifiers(player?.heat_individual || 0);

  const canStart = player?.energy >= mission.energy_cost;

  const getRiskColor = (risk) => {
    if (risk >= 6) return 'error';
    if (risk >= 3) return 'warning';
    return 'success';
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Iniciar Missão"
      size="lg"
    >
      <div className="space-y-4">
        {/* Mission Info */}
        <div>
          <h3 className="font-heading text-xl text-text-primary mb-2">
            {mission.name}
          </h3>
          <p className="text-text-secondary">{mission.description}</p>
        </div>
        
        {/* Stats */}
        <div className="bg-surface-highlight border border-border p-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex justify-between">
              <span className="text-text-secondary">Duração:</span>
              <span className="text-text-primary">{mission.duration_seconds}s</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary">Energia:</span>
              <span className="text-secondary">{mission.energy_cost}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary">Recompensa:</span>
              <span className="text-success">
                €{estimatedReward.min} - €{estimatedReward.max}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary">Heat:</span>
              <span className="text-error">+{mission.heat_impact}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary">Risco:</span>
              <Badge variant={getRiskColor(mission.risk)} size="sm">
                {mission.risk >= 6 ? 'Alto' : mission.risk >= 3 ? 'Médio' : 'Baixo'}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary">Reputação:</span>
              <span className="text-gold">+{mission.reputation_impact}</span>
            </div>
          </div>
        </div>
        
        {/* Success Prediction */}
        <div className="bg-surface p-4 border border-border">
          <h4 className="text-sm font-heading text-text-primary mb-3">PREVISÃO DE SUCESSO</h4>
          
          <div className="flex items-center gap-4 mb-3">
            <CircularProgress
              value={successChance}
              max={100}
              size="md"
              color={successChance >= 70 ? 'success' : successChance >= 40 ? 'warning' : 'error'}
              showValue
            />
            <div className="flex-1">
              <p className={clsx(
                'text-lg font-body',
                successChance >= 70 ? 'text-success' : successChance >= 40 ? 'text-warning' : 'text-error'
              )}>
                {successChance >= 70 ? 'Boa chance de sucesso' : 
                 successChance >= 40 ? 'Risco moderado' : 
                 'Alto risco de falha'}
              </p>
              <div className="flex items-center gap-1 mt-1">
                {Array(5).fill(0).map((_, i) => (
                  <Star 
                    key={i} 
                    size={14} 
                    className={i < efficiency.stars ? 'text-gold fill-gold' : 'text-border'}
                  />
                ))}
                <span className="text-xs text-text-secondary ml-2">Eficiência: {efficiency.label}</span>
              </div>
            </div>
          </div>
          
          {/* Factors */}
          <div className="space-y-1 text-xs text-text-secondary">
            <p>• Nível do jogador: +{player?.level * 2}%</p>
            <p>• Heat policial: -{Math.floor(player?.heat_individual / 10)}%</p>
            {vehicle && <p>• Bónus de veículo: +{vehicle.speed + vehicle.stealth}%</p>}
          </div>
        </div>
        
        {/* Heat Warning */}
        {player?.heat_individual > 50 && (
          <Alert variant="warning" icon={AlertTriangle}>
            O teu heat policial está alto ({player.heat_individual}%). 
            Missões criminosas têm maior risco de falha.
          </Alert>
        )}
        
        {/* Energy Warning */}
        {!canStart && (
          <Alert variant="error" icon={XCircle}>
            Energia insuficiente! Precisas de {mission.energy_cost} energia.
          </Alert>
        )}
        
        {/* Actions */}
        <div className="flex gap-3 pt-4">
          <Button
            variant="secondary"
            fullWidth
            onClick={onClose}
          >
            Cancelar
          </Button>
          <Button
            variant="primary"
            fullWidth
            onClick={onConfirm}
            loading={loading}
            disabled={!canStart}
            icon={Play}
          >
            Iniciar Missão
          </Button>
        </div>
      </div>
    </Modal>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function MissionsPage() {
  const [searchParams] = useSearchParams();
  const selectedNeighborhood = searchParams.get('bairro') || 'centro';
  
  const { user, api } = useAuth();
  const { 
    missionTemplates, 
    neighborhoods, 
    activeMission, 
    activeVehicle,
    actionLoading,
    startMission,
    completeMission,
    showNotification 
  } = useGame();
  
  // State
  const [selectedMission, setSelectedMission] = useState(null);
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('recommended');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [heists, setHeists] = useState([]);
  const [proceduralMissions, setProceduralMissions] = useState([]);
  const [activeHeistSession, setActiveHeistSession] = useState(null);
  const [heistLoading, setHeistLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9;

  const player = user;

  // Fetch heists and procedural missions
  useEffect(() => {
    const fetchHeists = async () => {
      try {
        const response = await api().get('/heists');
        setHeists(response.data);
      } catch (err) {
        console.log('Heists fetch error:', err);
      }
    };
    
    const fetchProceduralMissions = async () => {
      try {
        const response = await api().get('/procedural-missions');
        setProceduralMissions(response.data);
      } catch (err) {
        console.log('Procedural missions fetch error:', err);
      }
    };
    
    fetchHeists();
    fetchProceduralMissions();
  }, [api]);

  // Filter and sort missions
  const filteredMissions = useMemo(() => {
    let missions = [...missionTemplates];
    
    // Category filter
    if (filter !== 'all' && filter !== 'procedural' && filter !== 'heists') {
      missions = missions.filter(m => m.category === filter);
    }
    
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      missions = missions.filter(m => 
        m.name.toLowerCase().includes(query) ||
        m.description.toLowerCase().includes(query)
      );
    }
    
    // Sort
    switch (sortBy) {
      case 'reward_high':
        missions.sort((a, b) => b.reward_max - a.reward_max);
        break;
      case 'reward_low':
        missions.sort((a, b) => a.reward_max - b.reward_max);
        break;
      case 'risk_low':
        missions.sort((a, b) => a.risk - b.risk);
        break;
      case 'risk_high':
        missions.sort((a, b) => b.risk - a.risk);
        break;
      case 'duration_short':
        missions.sort((a, b) => a.duration_seconds - b.duration_seconds);
        break;
      case 'energy_low':
        missions.sort((a, b) => a.energy_cost - b.energy_cost);
        break;
      case 'recommended':
      default:
        if (player) {
          missions = MissionSystem.getRecommendedMissions(missions, player);
        }
        break;
    }
    
    return missions;
  }, [missionTemplates, filter, searchQuery, sortBy, player]);

  // Pagination
  const paginatedMissions = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredMissions.slice(start, start + itemsPerPage);
  }, [filteredMissions, currentPage]);

  const totalPages = Math.ceil(filteredMissions.length / itemsPerPage);

  // Handlers
  const handleStartMission = async () => {
    if (selectedMission) {
      await startMission(selectedMission.type, selectedNeighborhood);
      setSelectedMission(null);
    }
  };

  const handleCompleteMission = async () => {
    if (activeMission) {
      await completeMission(activeMission.id);
    }
  };

  const handleStartHeist = async (heistId) => {
    setHeistLoading(true);
    try {
      const response = await api().post(`/heists/${heistId}/start`);
      setActiveHeistSession(response.data);
      showNotification(`Heist iniciado: ${response.data.heist}`, 'success');
    } catch (err) {
      showNotification(err.response?.data?.detail || 'Erro ao iniciar heist', 'error');
    } finally {
      setHeistLoading(false);
    }
  };

  const handleHeistPhase = async () => {
    if (!activeHeistSession) return;
    
    setHeistLoading(true);
    try {
      const response = await api().post(`/heists/session/${activeHeistSession.session_id}/phase`);
      
      if (response.data.heist_complete) {
        if (response.data.heist_success) {
          showNotification(`${response.data.message} Recompensa: €${response.data.reward}`, 'success');
        } else {
          showNotification(response.data.message, 'error');
        }
        setActiveHeistSession(null);
        const heistsResponse = await api().get('/heists');
        setHeists(heistsResponse.data);
      } else {
        showNotification(response.data.message, 'success');
        setActiveHeistSession({
          ...activeHeistSession,
          current_phase: activeHeistSession.current_phase + 1,
          next_phase: response.data.next_phase
        });
      }
    } catch (err) {
      showNotification(err.response?.data?.detail || 'Erro na fase do heist', 'error');
    } finally {
      setHeistLoading(false);
    }
  };

  const currentNeighborhood = neighborhoods.find(n => n.id === selectedNeighborhood);

  return (
    <div className="space-y-6 animate-fade-in" data-testid="missions-page">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-heading text-2xl md:text-3xl text-text-primary flex items-center gap-3">
            <Target className="text-primary" size={28} />
            Missões
          </h1>
          <p className="text-text-secondary text-sm mt-1">
            {currentNeighborhood?.name || 'Centro'} • {filteredMissions.length} missões disponíveis
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Neighborhood selector */}
          <Select
            options={neighborhoods.map(n => ({ value: n.id, label: n.name }))}
            value={selectedNeighborhood}
            onChange={(value) => window.history.pushState({}, '', `/missoes?bairro=${value}`)}
            className="w-40"
          />
          
          {/* View mode toggle */}
          <div className="hidden md:flex border border-border">
            {VIEW_MODES.map(mode => (
              <button
                key={mode.id}
                className={clsx(
                  'p-2 transition-colors',
                  viewMode === mode.id ? 'bg-primary text-white' : 'text-text-secondary hover:text-text-primary'
                )}
                onClick={() => setViewMode(mode.id)}
              >
                <mode.icon size={18} />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <MissionStatsBar player={player} missions={missionTemplates} activeMission={activeMission} />

      {/* Active Mission Banner */}
      <ActiveMissionBanner 
        mission={activeMission}
        onComplete={handleCompleteMission}
        loading={actionLoading}
      />

      {/* Active Heist Session */}
      <ActiveHeistSession
        session={activeHeistSession}
        onPhase={handleHeistPhase}
        loading={heistLoading}
      />

      {/* Filter Tabs */}
      <div className="flex flex-col md:flex-row md:items-center gap-4">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {MISSION_CATEGORIES.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              className={clsx(
                'px-4 py-2 font-ui text-sm uppercase tracking-wider transition-all whitespace-nowrap flex items-center gap-2',
                filter === id 
                  ? 'bg-primary text-white' 
                  : 'bg-surface border border-border text-text-secondary hover:text-text-primary'
              )}
              onClick={() => { setFilter(id); setCurrentPage(1); }}
            >
              <Icon size={14} />
              {label}
            </button>
          ))}
        </div>
        
        {/* Search and Sort */}
        <div className="flex-1 flex items-center gap-3">
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Pesquisar missões..."
            className="flex-1 max-w-xs"
          />
          <Select
            options={SORT_OPTIONS}
            value={sortBy}
            onChange={setSortBy}
            placeholder="Ordenar por..."
            className="w-48"
          />
        </div>
      </div>

      {/* Heists Section */}
      {filter === 'heists' && (
        <FadeIn>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Crosshair className="text-gold" size={24} />
              <h2 className="font-heading text-xl text-text-primary">Grandes Golpes</h2>
            </div>
            
            {heists.length === 0 ? (
              <EmptyState
                icon={Crosshair}
                title="A carregar heists..."
                description="Aguarda um momento enquanto carregamos os grandes golpes disponíveis."
              />
            ) : (
              <div className="grid gap-4">
                {heists.map(heist => (
                  <HeistCard
                    key={heist.id}
                    heist={heist}
                    onStart={handleStartHeist}
                    loading={heistLoading}
                    disabled={activeHeistSession}
                  />
                ))}
              </div>
            )}
          </div>
        </FadeIn>
      )}

      {/* Procedural Missions Section */}
      {filter === 'procedural' && (
        <FadeIn>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles className="text-purple-400" size={24} />
              <h2 className="font-heading text-xl text-text-primary">Missões Especiais</h2>
              <Badge variant="purple">Geradas Automaticamente</Badge>
            </div>
            
            {proceduralMissions.length === 0 ? (
              <EmptyState
                icon={Sparkles}
                title="A gerar missões especiais..."
                description="Novas missões especiais são geradas periodicamente."
              />
            ) : (
              <div className="grid gap-4">
                {proceduralMissions.map(mission => (
                  <ProceduralMissionCard
                    key={mission.id}
                    mission={mission}
                    player={player}
                    canStart={!activeMission}
                    onSelect={setSelectedMission}
                  />
                ))}
              </div>
            )}
          </div>
        </FadeIn>
      )}

      {/* Regular Missions Grid/List */}
      {filter !== 'heists' && filter !== 'procedural' && (
        <>
          {paginatedMissions.length === 0 ? (
            <EmptyState
              icon={Target}
              title="Nenhuma missão encontrada"
              description="Tenta ajustar os filtros ou pesquisar por outro termo."
            />
          ) : (
            <>
              <div className={clsx(
                viewMode === 'grid' 
                  ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
                  : 'space-y-3'
              )}>
                {paginatedMissions.map((mission, i) => {
                  const canStart = !activeMission && player?.energy >= mission.energy_cost;
                  const isRecommended = sortBy === 'recommended' && i < 3;
                  
                  return viewMode === 'grid' ? (
                    <FadeIn key={mission.type} delay={i * 50}>
                      <MissionCardGrid
                        mission={mission}
                        player={player}
                        vehicle={activeVehicle}
                        canStart={canStart}
                        onSelect={setSelectedMission}
                        recommended={isRecommended}
                      />
                    </FadeIn>
                  ) : (
                    <FadeIn key={mission.type} delay={i * 30}>
                      <MissionCardList
                        mission={mission}
                        player={player}
                        vehicle={activeVehicle}
                        canStart={canStart}
                        onSelect={setSelectedMission}
                        recommended={isRecommended}
                      />
                    </FadeIn>
                  );
                })}
              </div>
              
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center mt-6">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                  />
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* Mission Confirmation Modal */}
      <MissionConfirmModal
        mission={selectedMission}
        player={player}
        vehicle={activeVehicle}
        isOpen={!!selectedMission}
        onClose={() => setSelectedMission(null)}
        onConfirm={handleStartMission}
        loading={actionLoading}
      />
    </div>
  );
}

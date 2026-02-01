import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useGame } from '../contexts/GameContext';
import { useCountdown, useMissionTimer } from '../hooks/useCountdown';
import { StatCard, Card, ProgressBar } from '../components/ProgressBar';
import { Button, Badge } from '../components/UI';
import { LevelSystem, HeatSystem, getTipsAndStrategies } from '../utils/gameLogic';
import { getRandomWisdomQuote } from '../data/lore';
import { 
  DollarSign, Flame, Star, Zap, Gift, Target, 
  Skull, Wallet, Clock, ChevronRight, Shield,
  TrendingUp, Users, Car, Radio, Swords, Lightbulb, AlertTriangle
} from 'lucide-react';

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

  const player = gameState?.player || user;
  const [wisdomQuote] = useState(getRandomWisdomQuote());
  
  // Calculate level info using LevelSystem
  const levelInfo = useMemo(() => {
    if (!player?.level) return null;
    const title = LevelSystem.getLevelTitle(player.level);
    const bonuses = LevelSystem.getLevelBonuses(player.level);
    return {
      title: title.title,
      color: title.color,
      bonuses
    };
  }, [player?.level]);

  // Calculate heat status using HeatSystem  
  const heatStatus = useMemo(() => {
    if (player?.heat_individual === undefined) return null;
    const danger = HeatSystem.getDangerLevel(player.heat_individual);
    const advice = HeatSystem.getHeatAdvice(player.heat_individual);
    return {
      ...danger,
      effects: advice
    };
  }, [player?.heat_individual]);

  // Get random tips
  const tips = useMemo(() => {
    const allTips = getTipsAndStrategies();
    return allTips.general?.slice(0, 3) || [];
  }, []);
  
  // Memoize target time to prevent infinite loop
  const dailyRewardTarget = useMemo(() => {
    if (!player?.last_daily_reward) return null;
    return new Date(new Date(player.last_daily_reward).getTime() + 86400000);
  }, [player?.last_daily_reward]);

  // Daily reward countdown
  const { isExpired: canClaimDaily, formatTime: formatDailyTime } = useCountdown(dailyRewardTarget);

  // Active mission timer
  const { progress: missionProgress, isComplete: missionComplete, formatRemaining } = useMissionTimer(
    activeMission?.started_at,
    activeMission?.duration_seconds
  );

  const handleQuickAction = async (actionType) => {
    await performQuickAction(actionType);
  };

  const handleClaimDaily = async () => {
    await claimDailyReward();
  };

  const handleCompleteMission = async () => {
    if (activeMission) {
      await completeMission(activeMission.id);
    }
  };

  if (!player) return null;

  return (
    <div className="space-y-6 animate-fade-in" data-testid="home-page">
      {/* Welcome Section */}
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 bg-surface border border-primary flex items-center justify-center">
          <Skull size={32} className="text-primary" />
        </div>
        <div>
          <h1 className="font-heading text-2xl md:text-3xl text-text-primary">
            Olá, {player.username}
          </h1>
          <p className="text-text-secondary text-sm">
            Nível {player.level} • {player.main_neighborhood?.toUpperCase() || 'CENTRO'}
          </p>
        </div>
      </div>

      {/* Active Events Banner */}
      {cityEvents.length > 0 && (
        <div 
          className="bg-primary/10 border border-primary p-4 cursor-pointer hover:bg-primary/20 transition-colors"
          onClick={() => navigate('/eventos')}
          data-testid="events-banner"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Radio size={24} className="text-primary animate-pulse" />
              <div>
                <p className="text-primary font-ui uppercase text-sm">Eventos Ativos</p>
                <p className="text-text-primary">
                  {cityEvents.map(e => e.name).join(' • ')}
                </p>
              </div>
            </div>
            <ChevronRight size={20} className="text-primary" />
          </div>
        </div>
      )}

      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={DollarSign}
          label="Dinheiro Limpo"
          value={`€${player.clean_money?.toFixed(0) || 0}`}
          color="success"
        />
        <StatCard
          icon={Wallet}
          label="Dinheiro Sujo"
          value={`€${player.dirty_money?.toFixed(0) || 0}`}
          color="warning"
        />
        <StatCard
          icon={Flame}
          label="Heat Policial"
          value={`${player.heat_individual}%`}
          subValue={player.heat_individual > 50 ? 'ALTO RISCO' : 'Controlado'}
          color="error"
        />
        <StatCard
          icon={Shield}
          label="Reputação"
          value={player.reputation}
          subValue={`/ ${player.reputation_max}`}
          color="primary"
        />
      </div>

      {/* Progress Bars */}
      <Card title="Progresso" icon={TrendingUp}>
        <div className="space-y-4">
          <ProgressBar
            label="Experiência"
            value={player.experience}
            max={player.experience_max}
            color="primary"
          />
          <ProgressBar
            label="Energia"
            value={player.energy}
            max={player.energy_max}
            color="secondary"
          />
          <ProgressBar
            label="Reputação"
            value={player.reputation}
            max={player.reputation_max}
            color="gold"
          />
        </div>
      </Card>

      {/* Active Vehicle */}
      {activeVehicle && (
        <Card 
          title="Veículo Ativo" 
          icon={Car}
          onClick={() => navigate('/veiculos')}
          className="cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-surface-highlight border border-border flex items-center justify-center">
                <Car size={24} className="text-primary" />
              </div>
              <div>
                <p className="text-text-primary font-body">{activeVehicle.name}</p>
                <div className="flex gap-3 text-xs text-text-secondary mt-1">
                  <span>Vel: {activeVehicle.speed}</span>
                  <span>Furt: {activeVehicle.stealth}</span>
                  <span>Cond: {activeVehicle.condition}%</span>
                </div>
              </div>
            </div>
            <ChevronRight size={20} className="text-text-secondary" />
          </div>
        </Card>
      )}

      {/* Active Gang Wars */}
      {gangWars.length > 0 && (
        <Card 
          title="Guerras Ativas" 
          icon={Swords}
          onClick={() => navigate('/gangue')}
          className="cursor-pointer border-warning"
        >
          <div className="space-y-2">
            {gangWars.slice(0, 2).map(war => (
              <div key={war.id} className="flex items-center justify-between p-2 bg-surface-highlight border border-border">
                <div>
                  <p className="text-text-primary text-sm">{war.neighborhood_name}</p>
                  <p className="text-text-secondary text-xs">{war.attacker_gang_name} vs {war.defender_gang_name}</p>
                </div>
                <Badge variant="warning">EM GUERRA</Badge>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Active Mission */}
      {activeMission && (
        <Card title="Missão Ativa" icon={Target}>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-heading text-lg text-text-primary">{activeMission.name}</h4>
                <p className="text-text-secondary text-sm">{activeMission.description}</p>
              </div>
              <Badge variant={missionComplete ? 'success' : 'warning'}>
                {missionComplete ? 'Pronta' : 'Em Progresso'}
              </Badge>
            </div>
            
            <ProgressBar
              value={missionProgress}
              max={100}
              color={missionComplete ? 'success' : 'warning'}
              showLabel={false}
            />
            
            <div className="flex items-center justify-between text-sm">
              <span className="text-text-secondary flex items-center gap-2">
                <Clock size={14} />
                {missionComplete ? 'Concluída!' : formatRemaining()}
              </span>
              <span className="text-success">
                €{activeMission.reward_min} - €{activeMission.reward_max}
              </span>
            </div>
            
            {missionComplete && (
              <Button
                variant="success"
                fullWidth
                onClick={handleCompleteMission}
                loading={actionLoading}
                data-testid="complete-mission-btn"
              >
                Concluir Missão
              </Button>
            )}
          </div>
        </Card>
      )}

      {/* Daily Reward */}
      <Card 
        title="Recompensa Diária" 
        icon={Gift}
        headerAction={
          <Badge variant={canClaimDaily || !player.last_daily_reward ? 'success' : 'default'}>
            {canClaimDaily || !player.last_daily_reward ? 'Disponível' : formatDailyTime()}
          </Badge>
        }
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-text-secondary text-sm">
              {canClaimDaily || !player.last_daily_reward
                ? 'Reclama a tua recompensa diária!' 
                : 'Volta amanhã para mais recompensas.'}
            </p>
            <p className="text-success text-lg font-body mt-1">€100 - €500</p>
          </div>
          <Button
            variant="primary"
            disabled={!canClaimDaily && player.last_daily_reward}
            onClick={handleClaimDaily}
            loading={actionLoading}
            icon={Gift}
            data-testid="claim-daily-btn"
          >
            Reclamar
          </Button>
        </div>
      </Card>

      {/* Quick Actions */}
      {!activeMission && (
        <Card title="Ações Rápidas" icon={Zap}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Button
              variant="secondary"
              fullWidth
              onClick={() => handleQuickAction('roubo_rapido')}
              loading={actionLoading}
              disabled={player.energy < 5}
              data-testid="quick-theft-btn"
            >
              <div className="flex flex-col items-center py-2">
                <Skull size={24} className="mb-2" />
                <span>Roubo Rápido</span>
                <span className="text-xs text-text-secondary mt-1">5 Energia</span>
              </div>
            </Button>
            
            <Button
              variant="secondary"
              fullWidth
              onClick={() => handleQuickAction('hustle_rua')}
              loading={actionLoading}
              disabled={player.energy < 8}
              data-testid="street-hustle-btn"
            >
              <div className="flex flex-col items-center py-2">
                <DollarSign size={24} className="mb-2" />
                <span>Hustle de Rua</span>
                <span className="text-xs text-text-secondary mt-1">8 Energia</span>
              </div>
            </Button>
            
            <Button
              variant="secondary"
              fullWidth
              onClick={() => handleQuickAction('evento_aleatorio')}
              loading={actionLoading}
              disabled={player.energy < 3}
              data-testid="random-event-btn"
            >
              <div className="flex flex-col items-center py-2">
                <Star size={24} className="mb-2" />
                <span>Evento Aleatório</span>
                <span className="text-xs text-text-secondary mt-1">3 Energia</span>
              </div>
            </Button>
          </div>
        </Card>
      )}

      {/* Gang Status */}
      <Card 
        title={myGang ? myGang.name : 'Gangue'} 
        icon={Users}
        headerAction={
          myGang ? (
            <Badge variant="gold">[{myGang.tag}]</Badge>
          ) : null
        }
        onClick={() => navigate('/gangue')}
        className="cursor-pointer"
      >
        {myGang ? (
          <div className="flex items-center justify-between">
            <div>
              <p className="text-text-secondary text-sm">
                {myGang.members_count || 1} membros • {myGang.territories?.length || 0} territórios
              </p>
              <p className="text-gold text-lg font-body mt-1">
                Cofre: €{myGang.treasury?.toFixed(0) || 0}
              </p>
            </div>
            <ChevronRight size={20} className="text-text-secondary" />
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-text-secondary mb-4">Ainda não pertences a nenhuma gangue.</p>
            <Button variant="primary" data-testid="join-gang-prompt">
              Ver Gangues
            </Button>
          </div>
        )}
      </Card>

      {/* Stats Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-surface border border-border p-4 text-center">
          <p className="text-2xl font-body text-primary">{player.total_missions}</p>
          <p className="text-xs text-text-secondary uppercase tracking-wider">Missões</p>
        </div>
        <div className="bg-surface border border-border p-4 text-center">
          <p className="text-2xl font-body text-success">{player.successful_missions}</p>
          <p className="text-xs text-text-secondary uppercase tracking-wider">Sucessos</p>
        </div>
        <div className="bg-surface border border-border p-4 text-center">
          <p className="text-2xl font-body text-error">{player.times_arrested}</p>
          <p className="text-xs text-text-secondary uppercase tracking-wider">Prisões</p>
        </div>
      </div>

      {/* Level & Heat Analysis */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {levelInfo && (
          <Card title="Análise de Nível" icon={TrendingUp}>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-text-secondary">Título:</span>
                <Badge variant="gold">{levelInfo.title}</Badge>
              </div>
              <div className="text-sm text-text-secondary">
                <p className="text-xs uppercase tracking-wider mb-2">Desbloqueios deste nível:</p>
                <div className="flex flex-wrap gap-1">
                  {levelInfo.unlocks.slice(0, 4).map((unlock, idx) => (
                    <Badge key={idx} variant="secondary" size="sm">{unlock}</Badge>
                  ))}
                </div>
              </div>
              {levelInfo.perks && Object.keys(levelInfo.perks).length > 0 && (
                <div className="text-xs text-text-secondary border-t border-border pt-2 mt-2">
                  <span className="uppercase tracking-wider">Bónus: </span>
                  {Object.entries(levelInfo.perks).map(([key, val], idx) => (
                    <span key={key} className="text-primary ml-1">
                      {key}: +{val}%{idx < Object.keys(levelInfo.perks).length - 1 ? ', ' : ''}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </Card>
        )}

        {heatStatus && (
          <Card title="Status Policial" icon={Flame} className={player.heat_individual > 70 ? 'border-error' : ''}>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Badge variant={heatStatus.color}>{heatStatus.label}</Badge>
                <span className="text-text-secondary text-sm">{player.heat_individual}% heat</span>
              </div>
              <div className="text-sm text-text-secondary">
                {heatStatus.effects.map((effect, idx) => (
                  <div key={idx} className="flex items-start gap-2 mb-1">
                    <AlertTriangle size={14} className={`text-${heatStatus.color} flex-shrink-0 mt-0.5`} />
                    <span>{effect}</span>
                  </div>
                ))}
              </div>
              <div className="text-xs text-text-secondary border-t border-border pt-2">
                Decaimento: {heatStatus.decayRate} pontos/hora
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* Wisdom Quote */}
      <div className="bg-primary/10 border border-primary/30 p-4">
        <div className="flex items-start gap-3">
          <Lightbulb size={24} className="text-primary flex-shrink-0" />
          <div>
            <p className="text-xs text-primary uppercase tracking-wider mb-1">Sabedoria do Submundo</p>
            <p className="text-text-primary italic">"{wisdomQuote}"</p>
          </div>
        </div>
      </div>

      {/* Tips */}
      {tips.length > 0 && (
        <Card title="Dicas" icon={Lightbulb}>
          <div className="space-y-2">
            {tips.map((tip, idx) => (
              <div key={idx} className="flex items-start gap-2 text-sm text-text-secondary">
                <span className="text-primary">•</span>
                <span>{tip}</span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

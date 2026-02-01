import { useAuth } from '../contexts/AuthContext';
import { useGame } from '../contexts/GameContext';
import { useCountdown } from '../hooks/useCountdown';
import { useMissionTimer } from '../hooks/useCountdown';
import { StatCard, Card, ProgressBar } from '../components/ProgressBar';
import { Button, Badge } from '../components/UI';
import { 
  DollarSign, Flame, Star, Zap, Gift, Target, 
  Skull, Wallet, Clock, ChevronRight, Shield,
  TrendingUp, Users
} from 'lucide-react';

export default function HomePage() {
  const { user } = useAuth();
  const { 
    gameState, 
    activeMission, 
    myGang,
    actionLoading,
    performQuickAction, 
    claimDailyReward,
    completeMission 
  } = useGame();

  const player = gameState?.player || user;
  
  // Daily reward countdown
  const { isExpired: canClaimDaily, formatTime: formatDailyTime } = useCountdown(
    player?.last_daily_reward ? new Date(new Date(player.last_daily_reward).getTime() + 86400000) : null
  );

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
      >
        {myGang ? (
          <div className="flex items-center justify-between">
            <div>
              <p className="text-text-secondary text-sm">
                {myGang.members_count} membros • {myGang.territories?.length || 0} territórios
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
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useGame } from '../contexts/GameContext';
import { Button, Badge, Modal, Alert } from '../components/UI';
import { Card, ProgressBar } from '../components/ProgressBar';
import { 
  Target, Users, Car, Building2, Shield, Zap, Star,
  ChevronRight, TrendingUp, TrendingDown, DollarSign, Flame,
  Award, Clock, AlertTriangle, MapPin, Briefcase, Factory, Gift
} from 'lucide-react';
import clsx from 'clsx';
import { LevelSystem, HeatSystem } from '../utils/gameLogic';

export default function HomePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { gameState, fetchFullGameState, claimDailyReward } = useGame();
  const [showRewardModal, setShowRewardModal] = useState(false);
  const [rewardClaimed, setRewardClaimed] = useState(false);

  useEffect(() => {
    fetchFullGameState();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleClaimDaily = async () => {
    const result = await claimDailyReward();
    if (result.success) {
      setRewardClaimed(true);
      setShowRewardModal(true);
      setTimeout(() => fetchFullGameState(), 1000);
    }
  };

  const playerLevel = LevelSystem.getLevel(gameState?.player?.experience || 0);
  const heatStatus = HeatSystem.getHeatStatus(gameState?.player?.heat || 0);

  // Safely get player data
  const player = gameState?.player || {};
  const cleanMoney = player.clean_money || 0;
  const dirtyMoney = player.dirty_money || 0;
  const reputation = player.reputation || 0;
  const heat = player.heat || 0;
  const experience = player.experience || 0;
  const dailyRewardClaimed = player.daily_reward_claimed || false;

  const quickActions = [
    { 
      icon: Target, 
      label: 'Missões', 
      path: '/missoes', 
      color: 'primary',
      description: 'Completa trabalhos'
    },
    { 
      icon: MapPin, 
      label: 'Mapa', 
      path: '/mapa', 
      color: 'warning',
      description: 'Explora a cidade'
    },
    { 
      icon: Users, 
      label: 'Gangue', 
      path: '/gangue', 
      color: 'error',
      description: 'Lidera a tua crew'
    },
    { 
      icon: Car, 
      label: 'Veículos', 
      path: '/veiculos', 
      color: 'success',
      description: 'Garagem'
    },
    { 
      icon: Building2, 
      label: 'Propriedades', 
      path: '/propriedades', 
      color: 'gold',
      description: 'Imóveis'
    },
    { 
      icon: Factory, 
      label: 'Negócios', 
      path: '/negocios', 
      color: 'purple',
      description: 'Estabelecimentos'
    },
    { 
      icon: Briefcase, 
      label: 'Mercado', 
      path: '/mercado', 
      color: 'secondary',
      description: 'Compra e vende'
    },
    { 
      icon: DollarSign, 
      label: 'Banco', 
      path: '/banco', 
      color: 'primary',
      description: 'Gestão financeira'
    }
  ];

  const stats = [
    {
      icon: DollarSign,
      label: 'Dinheiro na Mão',
      value: `€${cleanMoney.toLocaleString()}`,
      color: 'success',
      trend: null
    },
    {
      icon: DollarSign,
      label: 'Dinheiro no Banco',
      value: `€${dirtyMoney.toLocaleString()}`,
      color: 'primary',
      trend: null
    },
    {
      icon: Award,
      label: 'Reputação',
      value: reputation.toLocaleString(),
      color: 'warning',
      trend: 'up'
    },
    {
      icon: Flame,
      label: 'Heat',
      value: `${heat}`,
      color: heatStatus.color,
      status: heatStatus.status
    }
  ];

  // Show loading while fetching initial data
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
    <div className="space-y-2 md:space-y-3">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2">
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
          </div>
        </div>

        {/* Daily Reward */}
        {!dailyRewardClaimed && (
          <Button
            variant="primary"
            size="lg"
            icon={Gift}
            glow
            onClick={handleClaimDaily}
          >
            Recompensa Diária
          </Button>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
        {stats.map((stat, i) => (
          <Card key={i} className="relative overflow-hidden">
            <div className={`absolute top-0 left-0 w-1 h-full bg-${stat.color}`} />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-text-secondary uppercase mb-0.5">{stat.label}</p>
                <p className="text-base md:text-lg font-heading text-text-primary">{stat.value}</p>
                {stat.status && (
                  <p className={`text-xs text-${stat.color} mt-0.5`}>{stat.status}</p>
                )}
              </div>
              <stat.icon className={`w-5 h-5 md:w-6 md:h-6 text-${stat.color} opacity-50`} />
            </div>
          </Card>
        ))}
      </div>

      {/* Level Progress */}
      {playerLevel.level < 100 && (
        <Card title="Progresso de Nível" icon={Star}>
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-text-secondary">
                Nível {playerLevel.level} → {playerLevel.level + 1}
              </span>
              <span className="text-primary font-mono">
                {experience} / {playerLevel.nextLevelXP} XP
              </span>
            </div>
            <ProgressBar
              value={experience}
              max={playerLevel.nextLevelXP}
              color="primary"
              showLabel={false}
              height="h-3"
            />
            <p className="text-xs text-text-secondary">
              {playerLevel.nextLevelXP - experience} XP para o próximo nível
            </p>
          </div>
        </Card>
      )}

      {/* Quick Actions */}
      <div>
        <h2 className="font-heading text-base md:text-lg text-text-primary mb-2 flex items-center gap-1.5">
          <Zap className="w-4 h-4 text-primary" />
          Acesso Rápido
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-1.5 md:gap-2">
          {quickActions.map((action, i) => (
            <button
              key={i}
              onClick={() => navigate(action.path)}
              className="group bg-surface border border-border hover:border-primary p-2 md:p-2.5 transition-all hover:shadow-neon"
            >
              <action.icon className={`w-5 h-5 md:w-6 md:h-6 text-${action.color} mb-1 mx-auto group-hover:scale-110 transition-transform`} />
              <p className="font-heading text-text-primary text-xs mb-0.5">{action.label}</p>
              <p className="text-text-secondary text-xs hidden md:block leading-tight">{action.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Recent Activity & Tips */}
      <div className="grid lg:grid-cols-2 gap-2 md:gap-3">
        {/* Heat Warning */}
        {heat > 70 && (
          <Card>
            <Alert variant="error">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                <div>
                  <p className="font-heading text-sm mb-1">Heat Crítico!</p>
                  <p className="text-xs text-text-secondary">
                    O teu nível de Heat está perigosamente alto. Evita crimes por algum tempo ou lava dinheiro para reduzir.
                  </p>
                </div>
              </div>
            </Alert>
          </Card>
        )}

        {/* Next Unlocks */}
        {playerLevel.nextUnlocks && playerLevel.nextUnlocks.length > 0 && (
          <Card title="Próximos Desbloqueios" icon={Award}>
            <div className="space-y-2">
              {playerLevel.nextUnlocks.slice(0, 3).map((unlock, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span className="text-text-secondary">{unlock.feature}</span>
                  <Badge variant="gold" size="xs">Nível {unlock.level}</Badge>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>

      {/* Daily Reward Modal */}
      <Modal
        isOpen={showRewardModal}
        onClose={() => setShowRewardModal(false)}
        title="Recompensa Diária!"
        size="sm"
      >
        <div className="text-center space-y-4">
          <div className="w-20 h-20 bg-primary/20 border-2 border-primary mx-auto flex items-center justify-center">
            <Gift className="w-10 h-10 text-primary" />
          </div>
          <div>
            <p className="text-text-primary font-heading text-lg mb-2">Parabéns!</p>
            <p className="text-text-secondary">
              Recebeste a tua recompensa diária. Volta amanhã para mais!
            </p>
          </div>
          <Button
            variant="primary"
            fullWidth
            onClick={() => setShowRewardModal(false)}
          >
            Continuar
          </Button>
        </div>
      </Modal>
    </div>
  );
}

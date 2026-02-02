import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useGame } from '../contexts/GameContext';
import { Button, Badge, Modal, Alert } from '../components/UI';
import { Card, ProgressBar } from '../components/ProgressBar';
import { 
  Skull, Target, Users, Car, Building2, Shield, Zap, Star,
  ChevronRight, TrendingUp, TrendingDown, DollarSign, Flame,
  Award, Clock, AlertTriangle, MapPin, Briefcase, Factory, Gift
} from 'lucide-react';
import clsx from 'clsx';
import { LevelSystem, HeatSystem } from '../utils/gameLogic';
import { QUOTES } from '../data/lore';

export default function HomePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { gameState, refreshGameState, claimDailyReward } = useGame();
  const [showRewardModal, setShowRewardModal] = useState(false);
  const [rewardClaimed, setRewardClaimed] = useState(false);

  useEffect(() => {
    refreshGameState();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleClaimDaily = async () => {
    const result = await claimDailyReward();
    if (result.success) {
      setRewardClaimed(true);
      setShowRewardModal(true);
      setTimeout(() => refreshGameState(), 1000);
    }
  };

  const playerLevel = LevelSystem.getLevel(gameState?.player?.experience || 0);
  const heatStatus = HeatSystem.getHeatStatus(gameState?.player?.heat || 0);
  const randomQuote = QUOTES[Math.floor(Math.random() * QUOTES.length)];

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
      label: 'Dinheiro Limpo',
      value: `€${(gameState?.player?.clean_money || 0).toLocaleString()}`,
      color: 'success',
      trend: null
    },
    {
      icon: DollarSign,
      label: 'Dinheiro Sujo',
      value: `€${(gameState?.player?.dirty_money || 0).toLocaleString()}`,
      color: 'warning',
      trend: null
    },
    {
      icon: Award,
      label: 'Reputação',
      value: (gameState?.player?.reputation || 0).toLocaleString(),
      color: 'primary',
      trend: 'up'
    },
    {
      icon: Flame,
      label: 'Heat',
      value: `${gameState?.player?.heat || 0}`,
      color: heatStatus.color,
      status: heatStatus.status
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl text-text-primary mb-2">
            Bem-vindo, <span className="text-primary">{user?.username}</span>
          </h1>
          <div className="flex items-center gap-4 flex-wrap">
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
        {!gameState?.player?.daily_reward_claimed && (
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

      {/* Quote of Wisdom */}
      <Card className="bg-surface/50 border-l-4 border-primary">
        <div className="flex items-start gap-4">
          <Skull className="w-8 h-8 text-primary flex-shrink-0 mt-1" />
          <div>
            <p className="text-text-primary italic mb-2">"{randomQuote.text}"</p>
            <p className="text-text-secondary text-sm">— {randomQuote.author}</p>
          </div>
        </div>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <Card key={i} className="relative overflow-hidden">
            <div className={`absolute top-0 left-0 w-1 h-full bg-${stat.color}`} />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-text-secondary uppercase mb-1">{stat.label}</p>
                <p className="text-xl font-heading text-text-primary">{stat.value}</p>
                {stat.status && (
                  <p className={`text-xs text-${stat.color} mt-1`}>{stat.status}</p>
                )}
              </div>
              <stat.icon className={`w-8 h-8 text-${stat.color} opacity-50`} />
            </div>
          </Card>
        ))}
      </div>

      {/* Level Progress */}
      {playerLevel.level < 100 && (
        <Card title="Progresso de Nível" icon={Star}>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-text-secondary">
                Nível {playerLevel.level} → {playerLevel.level + 1}
              </span>
              <span className="text-primary font-mono">
                {gameState?.player?.experience || 0} / {playerLevel.nextLevelXP} XP
              </span>
            </div>
            <ProgressBar
              value={gameState?.player?.experience || 0}
              max={playerLevel.nextLevelXP}
              color="primary"
              showLabel={false}
              height="h-3"
            />
            <p className="text-xs text-text-secondary">
              {playerLevel.nextLevelXP - (gameState?.player?.experience || 0)} XP para o próximo nível
            </p>
          </div>
        </Card>
      )}

      {/* Quick Actions */}
      <div>
        <h2 className="font-heading text-xl text-text-primary mb-4 flex items-center gap-2">
          <Zap className="w-5 h-5 text-primary" />
          Acesso Rápido
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {quickActions.map((action, i) => (
            <button
              key={i}
              onClick={() => navigate(action.path)}
              className="group bg-surface border border-border hover:border-primary p-4 transition-all hover:shadow-neon"
            >
              <action.icon className={`w-8 h-8 text-${action.color} mb-2 mx-auto group-hover:scale-110 transition-transform`} />
              <p className="font-heading text-text-primary text-sm mb-1">{action.label}</p>
              <p className="text-text-secondary text-xs">{action.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Recent Activity & Tips */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Heat Warning */}
        {(gameState?.player?.heat || 0) > 70 && (
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

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Card } from '../components/ProgressBar';
import { Button, Badge, Modal, Input, Alert } from '../components/UI';
import { 
  Trophy, Medal, Crown, Star, TrendingUp, TrendingDown,
  DollarSign, Target, Award, Users, Zap, RefreshCw,
  ChevronUp, ChevronDown, Minus, Search, Filter,
  Calendar, Clock, Hash, Percent, ArrowUp, ArrowDown
} from 'lucide-react';
import clsx from 'clsx';

// Ranking types with colors and metadata
const RANKING_TYPES = {
  money: {
    id: 'money',
    name: 'Riqueza',
    icon: DollarSign,
    color: 'text-gold',
    bgColor: 'bg-gold/10',
    borderColor: 'border-gold/30',
    description: 'Jogadores mais ricos',
    format: (value) => `€${value?.toLocaleString() || 0}`
  },
  experience: {
    id: 'experience',
    name: 'Experiência',
    icon: Star,
    color: 'text-primary',
    bgColor: 'bg-primary/10',
    borderColor: 'border-primary/30',
    description: 'Jogadores com mais XP',
    format: (value) => `${value?.toLocaleString() || 0} XP`
  },
  reputation: {
    id: 'reputation',
    name: 'Reputação',
    icon: Award,
    color: 'text-warning',
    bgColor: 'bg-warning/10',
    borderColor: 'border-warning/30',
    description: 'Jogadores mais respeitados',
    format: (value) => value?.toLocaleString() || 0
  },
  crimes: {
    id: 'crimes',
    name: 'Crimes',
    icon: Target,
    color: 'text-error',
    bgColor: 'bg-error/10',
    borderColor: 'border-error/30',
    description: 'Criminosos mais ativos',
    format: (value) => `${value?.toLocaleString() || 0} crimes`
  }
};

// Medal/Badge based on position
const getPositionBadge = (position) => {
  if (position === 1) {
    return { icon: Crown, color: 'text-gold', label: '1º', glow: 'shadow-gold' };
  } else if (position === 2) {
    return { icon: Medal, color: 'text-text-secondary', label: '2º', glow: 'shadow-gray' };
  } else if (position === 3) {
    return { icon: Medal, color: 'text-warning', label: '3º', glow: 'shadow-warning' };
  } else if (position <= 10) {
    return { icon: Trophy, color: 'text-primary', label: `${position}º`, glow: '' };
  } else {
    return { icon: Hash, color: 'text-text-secondary', label: `${position}º`, glow: '' };
  }
};

// Player Card in Ranking
const RankingPlayerCard = ({ player, position, rankingType, isCurrentPlayer, onClick }) => {
  const badge = getPositionBadge(position);
  const BadgeIcon = badge.icon;
  const rankType = RANKING_TYPES[rankingType];
  
  // Get value based on ranking type
  const getValue = () => {
    switch(rankingType) {
      case 'money':
        return player.total_money;
      case 'experience':
        return player.experience;
      case 'reputation':
        return player.reputation;
      case 'crimes':
        return player.crimes_committed;
      default:
        return 0;
    }
  };

  return (
    <button
      onClick={() => onClick(player)}
      className={clsx(
        'w-full p-2 md:p-2.5 rounded-lg border transition-all hover:scale-[1.01]',
        isCurrentPlayer 
          ? `${rankType.bgColor} ${rankType.borderColor} ring-1 ring-primary`
          : 'bg-surface border-border hover:border-primary',
        badge.glow && position <= 3 && badge.glow
      )}
    >
      <div className="flex items-center gap-2 md:gap-3">
        {/* Position Badge */}
        <div className={clsx(
          'flex-shrink-0 w-10 h-10 rounded-lg flex flex-col items-center justify-center',
          position <= 3 ? rankType.bgColor : 'bg-surface'
        )}>
          <BadgeIcon size={position <= 3 ? 20 : 16} className={badge.color} />
          <span className={clsx('text-xs font-bold', badge.color)}>
            {position}
          </span>
        </div>

        {/* Player Info */}
        <div className="flex-1 text-left min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <p className={clsx(
              'font-heading text-sm md:text-base truncate',
              isCurrentPlayer ? rankType.color : 'text-text-primary'
            )}>
              {player.username || 'Jogador'}
            </p>
            {isCurrentPlayer && (
              <Badge variant="primary" size="xs">Você</Badge>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <span className={clsx('text-xs md:text-sm font-mono', rankType.color)}>
              {rankType.format(getValue())}
            </span>
          </div>
        </div>

        {/* Trend indicator (for top 10) */}
        {position <= 10 && (
          <div className="flex-shrink-0">
            <TrendingUp size={14} className="text-success" />
          </div>
        )}
      </div>
    </button>
  );
};

// Player position summary card
const PlayerPositionCard = ({ position, percentile, total, rankType }) => {
  const positionColor = 
    percentile >= 90 ? 'text-gold' :
    percentile >= 75 ? 'text-success' :
    percentile >= 50 ? 'text-primary' :
    percentile >= 25 ? 'text-warning' :
    'text-text-secondary';

  const badge = getPositionBadge(position);

  return (
    <Card className={clsx('border-l-4', rankType.borderColor)}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-text-secondary mb-1">Tua Posição</p>
          <div className="flex items-center gap-2">
            <p className={clsx('text-2xl font-heading', positionColor)}>
              {position}º
            </p>
            <span className="text-text-secondary text-sm">
              de {total}
            </span>
          </div>
          <div className="flex items-center gap-1.5 mt-1">
            <Badge variant={percentile >= 75 ? "success" : "secondary"} size="xs">
              Top {Math.round(100 - percentile)}%
            </Badge>
          </div>
        </div>
        <div className="text-center">
          <badge.icon size={32} className={badge.color} />
          <p className="text-xs text-text-secondary mt-1">Percentil</p>
          <p className={clsx('text-lg font-mono', positionColor)}>
            {percentile}%
          </p>
        </div>
      </div>
    </Card>
  );
};

// Statistics comparison
const StatsComparison = ({ playerStats, rankType }) => {
  const getValue = () => {
    switch(rankType.id) {
      case 'money':
        return playerStats.total_money;
      case 'experience':
        return playerStats.experience;
      case 'reputation':
        return playerStats.reputation;
      case 'crimes':
        return playerStats.crimes_committed;
      default:
        return 0;
    }
  };

  return (
    <Card>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-text-secondary mb-0.5">Teu Score</p>
          <p className={clsx('text-xl font-heading', rankType.color)}>
            {rankType.format(getValue())}
          </p>
        </div>
        <rankType.icon size={24} className={rankType.color} />
      </div>
    </Card>
  );
};

// Player detail modal
const PlayerDetailModal = ({ player, onClose }) => {
  if (!player) return null;

  return (
    <Modal isOpen={!!player} onClose={onClose} title="Perfil do Jogador">
      <div className="space-y-3">
        {/* Header */}
        <div className="text-center p-4 bg-surface rounded-lg">
          <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-2">
            <Users size={32} className="text-primary" />
          </div>
          <h2 className="font-heading text-lg text-text-primary">
            {player.username || 'Jogador'}
          </h2>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-2">
          <div className="p-3 bg-surface rounded-lg">
            <p className="text-xs text-text-secondary mb-0.5">Riqueza</p>
            <p className="text-sm font-mono text-gold">
              €{player.total_money?.toLocaleString() || 0}
            </p>
          </div>
          <div className="p-3 bg-surface rounded-lg">
            <p className="text-xs text-text-secondary mb-0.5">XP</p>
            <p className="text-sm font-mono text-primary">
              {player.experience?.toLocaleString() || 0}
            </p>
          </div>
          <div className="p-3 bg-surface rounded-lg">
            <p className="text-xs text-text-secondary mb-0.5">Reputação</p>
            <p className="text-sm font-mono text-warning">
              {player.reputation?.toLocaleString() || 0}
            </p>
          </div>
          <div className="p-3 bg-surface rounded-lg">
            <p className="text-xs text-text-secondary mb-0.5">Crimes</p>
            <p className="text-sm font-mono text-error">
              {player.crimes_committed?.toLocaleString() || 0}
            </p>
          </div>
        </div>

        <Button variant="primary" fullWidth onClick={onClose}>
          Fechar
        </Button>
      </div>
    </Modal>
  );
};

// Main Rankings Page
export default function RankingsPage() {
  const { api, user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [rankings, setRankings] = useState(null);
  const [selectedRanking, setSelectedRanking] = useState('money');
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [notification, setNotification] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchRankings();
  }, []);

  const fetchRankings = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      else setRefreshing(true);

      const response = await api().get('/rankings');
      setRankings(response.data);
    } catch (error) {
      console.error('Erro ao carregar rankings:', error);
      setNotification({
        type: 'error',
        message: 'Erro ao carregar rankings'
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    fetchRankings(false);
    setNotification({
      type: 'info',
      message: 'Rankings atualizados!'
    });
    setTimeout(() => setNotification(null), 3000);
  };

  // Get current ranking data
  const currentRankingData = useMemo(() => {
    if (!rankings?.rankings) return [];
    return rankings.rankings[selectedRanking] || [];
  }, [rankings, selectedRanking]);

  // Filter players by search
  const filteredPlayers = useMemo(() => {
    if (!searchQuery) return currentRankingData;
    
    const query = searchQuery.toLowerCase();
    return currentRankingData.filter(player => 
      player.username?.toLowerCase().includes(query)
    );
  }, [currentRankingData, searchQuery]);

  const rankType = RANKING_TYPES[selectedRanking];
  const RankIcon = rankType?.icon;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-border border-t-primary rounded-full animate-spin mx-auto mb-3" />
          <p className="text-text-secondary text-sm">A carregar rankings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2 md:space-y-3 pb-20 md:pb-6">
      {/* Notification */}
      {notification && (
        <Alert variant={notification.type}>
          {notification.message}
        </Alert>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-xl md:text-2xl text-text-primary mb-0.5">
            Rankings
          </h1>
          <p className="text-text-secondary text-xs md:text-sm">
            Compete com os melhores jogadores
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          icon={RefreshCw}
          onClick={handleRefresh}
          loading={refreshing}
        >
          <span className="hidden md:inline">Atualizar</span>
        </Button>
      </div>

      {/* Ranking Type Selector */}
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {Object.values(RANKING_TYPES).map((type) => {
          const TypeIcon = type.icon;
          return (
            <button
              key={type.id}
              onClick={() => setSelectedRanking(type.id)}
              className={clsx(
                'flex-shrink-0 px-3 py-2 rounded-lg border transition-all',
                selectedRanking === type.id
                  ? `${type.bgColor} ${type.color} ${type.borderColor}`
                  : 'bg-surface text-text-secondary border-border hover:border-primary'
              )}
            >
              <div className="flex items-center gap-1.5">
                <TypeIcon size={16} />
                <span className="text-sm font-heading">{type.name}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Player Position Summary */}
      {rankings?.player_position && rankings?.player_percentile && (
        <div className="grid md:grid-cols-2 gap-2">
          <PlayerPositionCard
            position={rankings.player_position[selectedRanking]}
            percentile={rankings.player_percentile[selectedRanking]}
            total={rankings.total_players}
            rankType={rankType}
          />
          <StatsComparison
            playerStats={rankings.player_stats}
            rankType={rankType}
          />
        </div>
      )}

      {/* Search */}
      <Card>
        <Input
          placeholder="Procurar jogador..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          icon={Search}
          iconPosition="left"
        />
      </Card>

      {/* Rankings List */}
      <Card title={`Top ${filteredPlayers.length} - ${rankType.name}`} icon={RankIcon}>
        <div className="space-y-1.5">
          {filteredPlayers.length === 0 ? (
            <div className="text-center py-6">
              <Users size={40} className="mx-auto text-text-secondary opacity-50 mb-2" />
              <p className="text-text-secondary text-sm">
                Nenhum jogador encontrado
              </p>
            </div>
          ) : (
            filteredPlayers.map((player, index) => (
              <RankingPlayerCard
                key={player.user_id || index}
                player={player}
                position={index + 1}
                rankingType={selectedRanking}
                isCurrentPlayer={player.user_id === user?.id}
                onClick={setSelectedPlayer}
              />
            ))
          )}
        </div>
      </Card>

      {/* Info Footer */}
      <Card>
        <div className="flex items-start gap-2">
          <Trophy size={16} className="text-gold flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs text-text-primary font-heading mb-0.5">
              Como funciona?
            </p>
            <p className="text-xs text-text-secondary leading-relaxed">
              Os rankings são atualizados em tempo real. Compete com outros jogadores 
              para chegar ao topo! Quanto maior a tua posição, mais prestígio terás no submundo.
            </p>
          </div>
        </div>
      </Card>

      {/* Player Detail Modal */}
      {selectedPlayer && (
        <PlayerDetailModal
          player={selectedPlayer}
          onClose={() => setSelectedPlayer(null)}
        />
      )}
    </div>
  );
}

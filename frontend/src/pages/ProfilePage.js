import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useGame } from '../contexts/GameContext';
import { Card, ProgressBar, StatCard } from '../components/ProgressBar';
import { Button, Badge, Modal, Input } from '../components/UI';
import { 
  User, LogOut, Star, Target, DollarSign, 
  Flame, Shield, Clock, TrendingUp, Award,
  History, Settings, Wallet, ArrowRightLeft, Crown
} from 'lucide-react';
import clsx from 'clsx';

export default function ProfilePage() {
  const { user, logout, api } = useAuth();
  const { gameState, launderMoney, actionLoading, showNotification } = useGame();
  
  const [history, setHistory] = useState([]);
  const [rankings, setRankings] = useState([]);
  const [notoriety, setNotoriety] = useState(null);
  const [policeStatus, setPoliceStatus] = useState(null);
  const [showLaunderModal, setShowLaunderModal] = useState(false);
  const [launderAmount, setLaunderAmount] = useState('');
  const [activeTab, setActiveTab] = useState('stats');
  const [loadingData, setLoadingData] = useState(false);

  const player = gameState?.player || user;

  // Buscar notoriedade e status policial
  useEffect(() => {
    const fetchNotoriety = async () => {
      try {
        const response = await api().get('/notoriety');
        setNotoriety(response.data);
      } catch (err) {
        console.log('Notoriety fetch error:', err);
      }
    };
    
    const fetchPoliceStatus = async () => {
      try {
        const response = await api().get('/police-status');
        setPoliceStatus(response.data);
      } catch (err) {
        console.log('Police status fetch error:', err);
      }
    };
    
    fetchNotoriety();
    fetchPoliceStatus();
  }, [api]);

  useEffect(() => {
    if (activeTab === 'history') {
      fetchHistory();
    } else if (activeTab === 'rankings') {
      fetchRankings();
    }
  }, [activeTab]);

  const fetchHistory = async () => {
    setLoadingData(true);
    try {
      const response = await api().get('/player/history?limit=20');
      setHistory(response.data.history);
    } catch (err) {
      console.error('Erro ao buscar histórico:', err);
    } finally {
      setLoadingData(false);
    }
  };

  const fetchRankings = async () => {
    setLoadingData(true);
    try {
      const response = await api().get('/rankings/global?limit=10');
      setRankings(response.data.rankings);
    } catch (err) {
      console.error('Erro ao buscar rankings:', err);
    } finally {
      setLoadingData(false);
    }
  };

  const handleLaunder = async () => {
    const amount = parseFloat(launderAmount);
    if (isNaN(amount) || amount <= 0) {
      showNotification('Montante inválido', 'error');
      return;
    }
    if (amount > player.dirty_money) {
      showNotification('Dinheiro sujo insuficiente', 'error');
      return;
    }
    await launderMoney(amount);
    setShowLaunderModal(false);
    setLaunderAmount('');
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-PT', { 
      day: '2-digit', 
      month: '2-digit', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getActionIcon = (action) => {
    switch (action) {
      case 'mission_complete': return Target;
      case 'daily_reward': return Star;
      case 'quick_action_roubo_rapido':
      case 'quick_action_hustle_rua':
        return DollarSign;
      case 'gang_created':
      case 'gang_joined':
      case 'gang_left':
        return Shield;
      case 'launder_success':
      case 'launder_failed':
        return ArrowRightLeft;
      default: return History;
    }
  };

  const getActionLabel = (action) => {
    const labels = {
      'mission_complete': 'Missão Concluída',
      'daily_reward': 'Recompensa Diária',
      'quick_action_roubo_rapido': 'Roubo Rápido',
      'quick_action_hustle_rua': 'Hustle de Rua',
      'quick_action_evento_aleatorio': 'Evento Aleatório',
      'gang_created': 'Gangue Criada',
      'gang_joined': 'Juntou-se a Gangue',
      'gang_left': 'Saiu da Gangue',
      'launder_success': 'Lavagem de Dinheiro',
      'launder_failed': 'Lavagem Falhou',
      'register': 'Conta Criada',
    };
    return labels[action] || action;
  };

  if (!player) return null;

  const playerRank = rankings.findIndex(r => r.username === player.username) + 1;

  return (
    <div className="space-y-6 animate-fade-in" data-testid="profile-page">
      {/* Profile Header */}
      <Card>
        <div className="flex items-center gap-4 mb-6">
          <div className="w-20 h-20 bg-surface-highlight border border-primary flex items-center justify-center">
            <User size={40} className="text-primary" />
          </div>
          <div className="flex-1">
            <h1 className="font-heading text-2xl md:text-3xl text-text-primary">
              {player.username}
            </h1>
            <div className="flex items-center gap-3 mt-1">
              <Badge variant="gold">
                <Star size={12} className="mr-1" />
                Nível {player.level}
              </Badge>
              {player.gang_id && (
                <Badge variant="primary">
                  <Shield size={12} className="mr-1" />
                  Em Gangue
                </Badge>
              )}
            </div>
          </div>
          <Button
            variant="ghost"
            icon={LogOut}
            onClick={logout}
            data-testid="logout-btn"
          >
            Sair
          </Button>
        </div>

        {/* Progress */}
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
        </div>
      </Card>

      {/* Money Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <StatCard
          icon={DollarSign}
          label="Dinheiro Limpo"
          value={`€${player.clean_money?.toFixed(2) || '0.00'}`}
          color="success"
        />
        <div className="bg-surface border border-border border-l-2 border-l-warning p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-text-secondary uppercase tracking-wider font-ui mb-1">
                Dinheiro Sujo
              </p>
              <p className="text-2xl font-body font-semibold text-warning">
                €{player.dirty_money?.toFixed(2) || '0.00'}
              </p>
            </div>
            <Button
              variant="secondary"
              size="sm"
              icon={ArrowRightLeft}
              onClick={() => setShowLaunderModal(true)}
              disabled={player.dirty_money <= 0}
              data-testid="launder-money-btn"
            >
              Lavar
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border">
        {[
          { id: 'stats', label: 'Estatísticas', icon: TrendingUp },
          { id: 'history', label: 'Histórico', icon: History },
          { id: 'rankings', label: 'Rankings', icon: Award },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            className={clsx(
              'flex items-center gap-2 px-4 py-3 font-ui text-sm uppercase tracking-wider transition-all',
              activeTab === id 
                ? 'text-primary border-b-2 border-primary' 
                : 'text-text-secondary hover:text-text-primary'
            )}
            onClick={() => setActiveTab(id)}
            data-testid={`tab-${id}`}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'stats' && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-surface border border-border p-4 text-center">
            <p className="text-3xl font-body text-primary">{player.total_missions}</p>
            <p className="text-xs text-text-secondary uppercase tracking-wider mt-1">Total Missões</p>
          </div>
          <div className="bg-surface border border-border p-4 text-center">
            <p className="text-3xl font-body text-success">{player.successful_missions}</p>
            <p className="text-xs text-text-secondary uppercase tracking-wider mt-1">Sucessos</p>
          </div>
          <div className="bg-surface border border-border p-4 text-center">
            <p className="text-3xl font-body text-error">{player.failed_missions}</p>
            <p className="text-xs text-text-secondary uppercase tracking-wider mt-1">Falhas</p>
          </div>
          <div className="bg-surface border border-border p-4 text-center">
            <p className="text-3xl font-body text-warning">{player.times_arrested}</p>
            <p className="text-xs text-text-secondary uppercase tracking-wider mt-1">Prisões</p>
          </div>
          <div className="bg-surface border border-border p-4 text-center md:col-span-2">
            <p className="text-3xl font-body text-success">€{player.total_earnings?.toFixed(0) || 0}</p>
            <p className="text-xs text-text-secondary uppercase tracking-wider mt-1">Total Ganho</p>
          </div>
          <div className="bg-surface border border-border p-4 text-center">
            <p className="text-3xl font-body text-error">{player.heat_individual}%</p>
            <p className="text-xs text-text-secondary uppercase tracking-wider mt-1">Heat Atual</p>
          </div>
          <div className="bg-surface border border-border p-4 text-center">
            <p className="text-3xl font-body text-secondary">{player.energy}/{player.energy_max}</p>
            <p className="text-xs text-text-secondary uppercase tracking-wider mt-1">Energia</p>
          </div>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="space-y-2">
          {loadingData ? (
            <p className="text-text-secondary text-center py-8">A carregar...</p>
          ) : history.length === 0 ? (
            <p className="text-text-secondary text-center py-8">Sem histórico ainda.</p>
          ) : (
            history.map((entry) => {
              const Icon = getActionIcon(entry.action);
              return (
                <div
                  key={entry.id}
                  className="bg-surface border border-border p-3 flex items-center gap-3"
                >
                  <div className="w-10 h-10 bg-surface-highlight border border-border flex items-center justify-center">
                    <Icon size={18} className="text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-text-primary text-sm font-body">
                      {getActionLabel(entry.action)}
                    </p>
                    <p className="text-text-secondary text-xs">
                      {formatDate(entry.timestamp)}
                    </p>
                  </div>
                  {entry.details?.reward && (
                    <span className="text-success text-sm">
                      +€{entry.details.reward}
                    </span>
                  )}
                  {entry.details?.result && (
                    <Badge variant={entry.details.result === 'success' ? 'success' : 'error'}>
                      {entry.details.result === 'success' ? 'Sucesso' : 'Falhou'}
                    </Badge>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {activeTab === 'rankings' && (
        <div className="space-y-2">
          {loadingData ? (
            <p className="text-text-secondary text-center py-8">A carregar...</p>
          ) : rankings.length === 0 ? (
            <p className="text-text-secondary text-center py-8">Sem rankings ainda.</p>
          ) : (
            <>
              {playerRank > 0 && (
                <div className="bg-primary/10 border border-primary p-4 mb-4">
                  <p className="text-primary text-center">
                    Estás na posição <strong>#{playerRank}</strong> do ranking global!
                  </p>
                </div>
              )}
              {rankings.map((rank, index) => (
                <div
                  key={rank.username}
                  className={clsx(
                    'bg-surface border border-border p-3 flex items-center gap-3',
                    rank.username === player.username && 'border-primary'
                  )}
                >
                  <div className={clsx(
                    'w-10 h-10 flex items-center justify-center font-heading text-lg',
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
                    <p className="text-gold font-body">{rank.reputation}</p>
                    <p className="text-text-secondary text-xs">reputação</p>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      )}

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
          
          <div className="bg-surface-highlight border border-border p-4">
            <p className="text-text-secondary text-sm mb-2">Disponível para lavar:</p>
            <p className="text-warning text-2xl font-body">€{player.dirty_money?.toFixed(2) || '0.00'}</p>
          </div>
          
          <Input
            label="Montante a lavar"
            type="number"
            placeholder="100.00"
            value={launderAmount}
            onChange={(e) => setLaunderAmount(e.target.value)}
            data-testid="launder-amount-input"
          />
          
          <div className="bg-error/10 border border-error/30 p-3 text-sm">
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
    </div>
  );
}

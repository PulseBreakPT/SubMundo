import { useState, useEffect } from 'react';
import { useGame } from '../contexts/GameContext';
import { useAuth } from '../contexts/AuthContext';
import { Card, ProgressBar } from '../components/ProgressBar';
import { Button, Badge, Modal, Input } from '../components/UI';
import { useMissionTimer } from '../hooks/useCountdown';
import { GangSystem } from '../utils/gameLogic';
import { GANGS_LORE } from '../data/lore';
import { 
  Users, Crown, Shield, DollarSign, Map, 
  Plus, LogOut, Swords, ChevronRight, Clock,
  Wallet, Target, AlertTriangle, TrendingUp, Eye,
  Info, Zap
} from 'lucide-react';
import clsx from 'clsx';

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
              {myGang.territories?.length === 0 ? (
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

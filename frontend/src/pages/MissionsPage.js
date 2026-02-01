import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useGame } from '../contexts/GameContext';
import { useAuth } from '../contexts/AuthContext';
import { Card } from '../components/ProgressBar';
import { Button, Badge, Modal } from '../components/UI';
import { useMissionTimer } from '../hooks/useCountdown';
import { ProgressBar } from '../components/ProgressBar';
import { 
  Target, Clock, Flame, DollarSign, Zap, 
  AlertTriangle, CheckCircle, XCircle, Star,
  Crosshair, Shield, Lock, Unlock, Users, Sparkles
} from 'lucide-react';
import clsx from 'clsx';

export default function MissionsPage() {
  const [searchParams] = useSearchParams();
  const selectedNeighborhood = searchParams.get('bairro') || 'centro';
  
  const { user, api } = useAuth();
  const { 
    missionTemplates, 
    neighborhoods, 
    activeMission, 
    actionLoading,
    startMission,
    completeMission,
    showNotification 
  } = useGame();
  
  const [selectedMission, setSelectedMission] = useState(null);
  const [filter, setFilter] = useState('all');
  const [heists, setHeists] = useState([]);
  const [proceduralMissions, setProceduralMissions] = useState([]);
  const [activeHeistSession, setActiveHeistSession] = useState(null);
  const [heistLoading, setHeistLoading] = useState(false);

  const player = user;

  // Buscar heists e missões procedurais
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

  // Mission timer
  const { progress: missionProgress, isComplete: missionComplete, formatRemaining } = useMissionTimer(
    activeMission?.started_at,
    activeMission?.duration_seconds
  );

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
        // Refresh heists list
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

  const getRiskColor = (risk) => {
    if (risk >= 6) return 'error';
    if (risk >= 3) return 'warning';
    return 'success';
  };

  const getRiskLabel = (risk) => {
    if (risk >= 6) return 'Alto Risco';
    if (risk >= 3) return 'Médio Risco';
    return 'Baixo Risco';
  };

  const filteredMissions = missionTemplates.filter(m => {
    if (filter === 'all') return true;
    return m.category === filter;
  });

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
        
        {/* Neighborhood selector */}
        <select
          className="bg-surface border border-border px-4 py-2 text-text-primary font-body text-sm"
          value={selectedNeighborhood}
          onChange={(e) => window.history.pushState({}, '', `/missoes?bairro=${e.target.value}`)}
          data-testid="neighborhood-select"
        >
          {neighborhoods.map(n => (
            <option key={n.id} value={n.id}>{n.name}</option>
          ))}
        </select>
      </div>

      {/* Active Mission Banner */}
      {activeMission && (
        <Card className="border-warning">
          <div className="flex items-center gap-2 mb-3">
            <Clock size={18} className="text-warning animate-pulse" />
            <h3 className="font-heading text-lg text-warning">MISSÃO EM PROGRESSO</h3>
          </div>
          
          <div className="flex items-center justify-between mb-3">
            <div>
              <h4 className="font-heading text-text-primary">{activeMission.name}</h4>
              <p className="text-text-secondary text-sm">{activeMission.description}</p>
            </div>
            <Badge variant={missionComplete ? 'success' : 'warning'}>
              {missionComplete ? 'Pronta' : formatRemaining()}
            </Badge>
          </div>
          
          <ProgressBar
            value={missionProgress}
            max={100}
            color={missionComplete ? 'success' : 'warning'}
            showLabel={false}
          />
          
          {missionComplete && (
            <Button
              variant="success"
              fullWidth
              onClick={handleCompleteMission}
              loading={actionLoading}
              className="mt-4"
              data-testid="complete-mission-btn"
            >
              Concluir e Receber Recompensa
            </Button>
          )}
        </Card>
      )}

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {[
          { id: 'all', label: 'Todas' },
          { id: 'crime', label: 'Crime' },
          { id: 'legal', label: 'Legal' },
          { id: 'procedural', label: '✨ Especiais' },
          { id: 'heists', label: '🎯 Heists' },
        ].map(({ id, label }) => (
          <button
            key={id}
            className={clsx(
              'px-4 py-2 font-ui text-sm uppercase tracking-wider transition-all whitespace-nowrap',
              filter === id 
                ? 'bg-primary text-white' 
                : 'bg-surface border border-border text-text-secondary hover:text-text-primary'
            )}
            onClick={() => setFilter(id)}
            data-testid={`filter-${id}`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Active Heist Session */}
      {activeHeistSession && (
        <Card className="border-gold bg-gold/5">
          <div className="flex items-center gap-2 mb-3">
            <Crosshair size={18} className="text-gold animate-pulse" />
            <h3 className="font-heading text-lg text-gold">HEIST EM PROGRESSO</h3>
          </div>
          
          <div className="mb-4">
            <h4 className="font-heading text-text-primary">{activeHeistSession.heist}</h4>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="gold">
                Fase {activeHeistSession.current_phase + 1} de {activeHeistSession.total_phases}
              </Badge>
            </div>
          </div>
          
          {activeHeistSession.next_phase && (
            <div className="bg-surface p-3 border border-border mb-4">
              <p className="text-xs text-text-secondary uppercase mb-1">Próxima Fase</p>
              <p className="font-heading text-text-primary">{activeHeistSession.next_phase.name}</p>
              {activeHeistSession.next_phase.skill && (
                <p className="text-sm text-primary mt-1">Skill: {activeHeistSession.next_phase.skill}</p>
              )}
              <p className="text-xs text-text-secondary mt-1">Duração: {activeHeistSession.next_phase.duration}s</p>
            </div>
          )}
          
          <Button
            variant="gold"
            fullWidth
            onClick={handleHeistPhase}
            loading={heistLoading}
          >
            Executar Fase
          </Button>
        </Card>
      )}

      {/* Heists Section */}
      {filter === 'heists' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <Crosshair className="text-gold" size={24} />
            <h2 className="font-heading text-xl text-text-primary">Grandes Golpes</h2>
          </div>
          
          {heists.length === 0 ? (
            <Card>
              <p className="text-text-secondary text-center">A carregar heists...</p>
            </Card>
          ) : (
            <div className="grid gap-4">
              {heists.map(heist => (
                <Card key={heist.id} className={heist.on_cooldown ? 'opacity-60' : ''}>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-heading text-lg text-text-primary">{heist.name}</h3>
                      <p className="text-sm text-text-secondary">{heist.description}</p>
                    </div>
                    {heist.on_cooldown ? (
                      <Badge variant="default"><Lock size={12} className="mr-1" /> Cooldown</Badge>
                    ) : heist.can_attempt ? (
                      <Badge variant="success"><Unlock size={12} className="mr-1" /> Disponível</Badge>
                    ) : (
                      <Badge variant="error">Nv.{heist.level_required} req.</Badge>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4 text-sm">
                    <div className="flex items-center gap-2">
                      <AlertTriangle size={14} className="text-warning" />
                      <span>Dificuldade: {heist.difficulty}/10</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Target size={14} className="text-primary" />
                      <span>{heist.phases} fases</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users size={14} className="text-text-secondary" />
                      <span>Crew: {heist.crew_required}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Flame size={14} className="text-error" />
                      <span>+{heist.heat_impact}% heat</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-success font-body text-lg">€{heist.base_reward.toLocaleString()}</span>
                      <span className="text-text-secondary"> - </span>
                      <span className="text-gold font-body text-lg">€{heist.max_reward.toLocaleString()}</span>
                    </div>
                    <Button
                      variant="gold"
                      disabled={!heist.can_attempt || heist.on_cooldown || activeHeistSession}
                      onClick={() => handleStartHeist(heist.id)}
                      loading={heistLoading}
                    >
                      {heist.on_cooldown ? 'Em Cooldown' : 'Iniciar Heist'}
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Procedural Missions Section */}
      {filter === 'procedural' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="text-purple-400" size={24} />
            <h2 className="font-heading text-xl text-text-primary">Missões Especiais</h2>
            <Badge variant="secondary">Geradas Automaticamente</Badge>
          </div>
          
          {proceduralMissions.length === 0 ? (
            <Card>
              <p className="text-text-secondary text-center">A gerar missões especiais...</p>
            </Card>
          ) : (
            <div className="grid gap-4">
              {proceduralMissions.map(mission => (
                <Card key={mission.id} className="border-l-4 border-l-purple-400">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-heading text-lg text-text-primary">{mission.name}</h3>
                      <p className="text-sm text-text-secondary">{mission.description}</p>
                      {mission.modifiers?.length > 0 && (
                        <div className="flex gap-2 mt-2">
                          {mission.modifiers.map(mod => (
                            <Badge key={mod} variant="secondary" size="sm">{mod}</Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    <Badge variant={getRiskColor(mission.difficulty)}>
                      {getRiskLabel(mission.difficulty)}
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
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-success font-body">€{mission.reward_min.toLocaleString()}</span>
                      <span className="text-text-secondary"> - </span>
                      <span className="text-gold font-body">€{mission.reward_max.toLocaleString()}</span>
                    </div>
                    <Button
                      variant="primary"
                      disabled={activeMission || player.energy < mission.energy_cost}
                    >
                      Iniciar Missão
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Missions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredMissions.map((mission) => {
          const canStart = !activeMission && player?.energy >= mission.energy_cost;
          
          return (
            <div
              key={mission.type}
              className={clsx(
                'bg-surface border border-border relative overflow-hidden',
                canStart ? 'cursor-pointer hover:border-primary/50 transition-all' : 'opacity-60'
              )}
              onClick={() => canStart && setSelectedMission(mission)}
              data-testid={`mission-${mission.type}`}
            >
              {/* Risk indicator */}
              <div className={clsx(
                'absolute top-0 left-0 w-1 h-full',
              )} style={{
                backgroundColor: mission.risk >= 6 ? '#FF003C' 
                  : mission.risk >= 3 ? '#FFD600' 
                  : '#00FF9D'
              }} />
              
              <div className="p-4">
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-heading text-lg text-text-primary">
                      {mission.name}
                    </h3>
                    <Badge variant={mission.category === 'legal' ? 'success' : 'error'} className="mt-1">
                      {mission.category === 'legal' ? 'LEGAL' : 'CRIME'}
                    </Badge>
                  </div>
                  <Badge variant={getRiskColor(mission.risk)}>
                    <AlertTriangle size={12} className="mr-1" />
                    {getRiskLabel(mission.risk)}
                  </Badge>
                </div>
                
                {/* Description */}
                <p className="text-text-secondary text-sm mb-4">
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
                      €{mission.reward_min} - €{mission.reward_max}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Flame size={14} className="text-error" />
                    <span className="text-error">+{mission.heat_impact} heat</span>
                  </div>
                </div>
                
                {/* Reputation */}
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border">
                  <Star size={14} className="text-gold" />
                  <span className="text-gold text-sm">+{mission.reputation_impact} reputação</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredMissions.length === 0 && (
        <Card>
          <div className="text-center py-8">
            <Target size={48} className="mx-auto text-text-secondary mb-4" />
            <p className="text-text-secondary">Nenhuma missão disponível nesta categoria.</p>
          </div>
        </Card>
      )}

      {/* Mission Confirmation Modal */}
      <Modal
        isOpen={!!selectedMission}
        onClose={() => setSelectedMission(null)}
        title="Iniciar Missão"
      >
        {selectedMission && (
          <div className="space-y-4">
            <div>
              <h3 className="font-heading text-xl text-text-primary mb-2">
                {selectedMission.name}
              </h3>
              <p className="text-text-secondary text-sm">
                {selectedMission.description}
              </p>
            </div>
            
            <div className="bg-surface-highlight border border-border p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-text-secondary">Duração:</span>
                <span className="text-text-primary">{selectedMission.duration_seconds} segundos</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Energia:</span>
                <span className="text-secondary">{selectedMission.energy_cost}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Recompensa:</span>
                <span className="text-success">€{selectedMission.reward_min} - €{selectedMission.reward_max}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Heat:</span>
                <span className="text-error">+{selectedMission.heat_impact}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Risco:</span>
                <Badge variant={getRiskColor(selectedMission.risk)}>
                  {getRiskLabel(selectedMission.risk)}
                </Badge>
              </div>
            </div>
            
            {player?.energy < selectedMission.energy_cost && (
              <div className="flex items-center gap-2 text-error text-sm">
                <XCircle size={16} />
                <span>Energia insuficiente!</span>
              </div>
            )}
            
            <div className="flex gap-3">
              <Button
                variant="secondary"
                fullWidth
                onClick={() => setSelectedMission(null)}
              >
                Cancelar
              </Button>
              <Button
                variant="primary"
                fullWidth
                onClick={handleStartMission}
                loading={actionLoading}
                disabled={player?.energy < selectedMission.energy_cost}
                data-testid="confirm-start-mission"
              >
                Iniciar Missão
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

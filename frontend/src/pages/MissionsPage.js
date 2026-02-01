import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useGame } from '../contexts/GameContext';
import { useAuth } from '../contexts/AuthContext';
import { Card } from '../components/ProgressBar';
import { Button, Badge, Modal } from '../components/UI';
import { useMissionTimer } from '../hooks/useCountdown';
import { ProgressBar } from '../components/ProgressBar';
import { 
  Target, Clock, Flame, DollarSign, Zap, 
  AlertTriangle, CheckCircle, XCircle, Star
} from 'lucide-react';
import clsx from 'clsx';

export default function MissionsPage() {
  const [searchParams] = useSearchParams();
  const selectedNeighborhood = searchParams.get('bairro') || 'centro';
  
  const { user } = useAuth();
  const { 
    missionTemplates, 
    neighborhoods, 
    activeMission, 
    actionLoading,
    startMission,
    completeMission 
  } = useGame();
  
  const [selectedMission, setSelectedMission] = useState(null);
  const [filter, setFilter] = useState('all');

  const player = user;

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

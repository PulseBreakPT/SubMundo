import { useState, useEffect } from 'react';
import { useGame } from '../contexts/GameContext';
import { useAuth } from '../contexts/AuthContext';
import { Card } from '../components/ProgressBar';
import { Button, Badge } from '../components/UI';
import { EVENTS_LORE, getRandomWisdomQuote } from '../data/lore';
import { 
  Radio, ShieldAlert, PartyPopper, ZapOff, Handshake,
  TrendingUp, Thermometer, Star, ShoppingBag, Clock, 
  AlertTriangle, Percent, Eye, Lightbulb, Activity, Target
} from 'lucide-react';
import clsx from 'clsx';

const EVENT_ICONS = {
  'shield-alert': ShieldAlert,
  'party-popper': PartyPopper,
  'zap-off': ZapOff,
  'handshake': Handshake,
  'trending-up': TrendingUp,
  'thermometer': Thermometer,
  'star': Star,
  'shopping-bag': ShoppingBag,
};

export default function EventsPage() {
  const { cityEvents, actionLoading, triggerEvent } = useGame();
  const { api } = useAuth();
  const [effects, setEffects] = useState(null);
  const [dynamicEvents, setDynamicEvents] = useState(null);
  const [predictions, setPredictions] = useState(null);
  const [impact, setImpact] = useState(null);
  const [activeTab, setActiveTab] = useState('active');
  const [wisdomQuote] = useState(getRandomWisdomQuote());

  useEffect(() => {
    fetchEffects();
    fetchDynamicEvents();
    fetchPredictions();
    fetchImpact();
    const interval = setInterval(() => {
      fetchEffects();
      fetchDynamicEvents();
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchEffects = async () => {
    try {
      const response = await api().get('/events/effects');
      setEffects(response.data);
    } catch (err) {
      console.error('Erro ao buscar efeitos:', err);
    }
  };

  const fetchDynamicEvents = async () => {
    try {
      const response = await api().get('/events/dynamic');
      setDynamicEvents(response.data);
    } catch (err) {
      console.error('Erro ao buscar eventos dinâmicos:', err);
    }
  };

  const fetchPredictions = async () => {
    try {
      const response = await api().get('/events/predictions');
      setPredictions(response.data);
    } catch (err) {
      console.error('Erro ao buscar previsões:', err);
    }
  };

  const fetchImpact = async () => {
    try {
      const response = await api().get('/events/impact');
      setImpact(response.data);
    } catch (err) {
      console.error('Erro ao buscar impacto:', err);
    }
  };

  const getTimeRemaining = (endsAt) => {
    const end = new Date(endsAt).getTime();
    const now = Date.now();
    const diff = end - now;
    
    if (diff <= 0) return 'Expirado';
    
    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getEffectColor = (value, isMultiplier = true) => {
    if (isMultiplier) {
      if (value > 1) return 'success';
      if (value < 1) return 'error';
      return 'default';
    } else {
      if (value > 0) return 'error';
      if (value < 0) return 'success';
      return 'default';
    }
  };

  const getIcon = (iconName) => {
    return EVENT_ICONS[iconName] || Radio;
  };

  return (
    <div className="space-y-6 animate-fade-in" data-testid="events-page">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-heading text-2xl md:text-3xl text-text-primary flex items-center gap-3">
            <Radio className="text-primary" size={28} />
            Eventos da Cidade
          </h1>
          <p className="text-text-secondary text-sm mt-1">
            {cityEvents.length} evento(s) ativo(s) • Previsões e análise em tempo real
          </p>
        </div>
        
        <Button
          variant="secondary"
          onClick={triggerEvent}
          loading={actionLoading}
          disabled={cityEvents.length >= 2}
          data-testid="trigger-event"
        >
          {cityEvents.length >= 2 ? 'Máximo de eventos' : 'Acionar Evento'}
        </Button>
      </div>

      {/* Wisdom Quote */}
      <div className="bg-surface/50 border border-surface-highlight p-3 rounded-lg">
        <p className="text-text-secondary italic text-sm">"{wisdomQuote}"</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border overflow-x-auto">
        {[
          { id: 'active', label: `Ativos (${cityEvents.length})`, icon: Radio },
          { id: 'predictions', label: 'Previsões', icon: Eye },
          { id: 'impact', label: 'Impacto', icon: Target },
          { id: 'conditions', label: 'Condições', icon: Activity },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            className={clsx(
              'px-4 py-3 font-ui text-sm uppercase tracking-wider transition-all whitespace-nowrap flex items-center gap-2',
              activeTab === id ? 'text-primary border-b-2 border-primary' : 'text-text-secondary hover:text-text-primary'
            )}
            onClick={() => setActiveTab(id)}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </div>

      {/* Current Effects Summary */}
      {effects && activeTab === 'active' && (
        <Card title="Efeitos Ativos" icon={Percent}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-surface-highlight border border-border p-4 text-center">
              <p className="text-xs text-text-secondary uppercase tracking-wider mb-1">Multiplicador Heat</p>
              <p className={clsx(
                'text-2xl font-body',
                effects.heat_multiplier > 1 ? 'text-error' : effects.heat_multiplier < 1 ? 'text-success' : 'text-text-primary'
              )}>
                {effects.heat_multiplier.toFixed(1)}x
              </p>
            </div>
            <div className="bg-surface-highlight border border-border p-4 text-center">
              <p className="text-xs text-text-secondary uppercase tracking-wider mb-1">Multiplicador Recompensa</p>
              <p className={clsx(
                'text-2xl font-body',
                effects.reward_multiplier > 1 ? 'text-success' : effects.reward_multiplier < 1 ? 'text-error' : 'text-text-primary'
              )}>
                {effects.reward_multiplier.toFixed(1)}x
              </p>
            </div>
            <div className="bg-surface-highlight border border-border p-4 text-center">
              <p className="text-xs text-text-secondary uppercase tracking-wider mb-1">Modificador Risco</p>
              <p className={clsx(
                'text-2xl font-body',
                effects.risk_modifier > 0 ? 'text-error' : effects.risk_modifier < 0 ? 'text-success' : 'text-text-primary'
              )}>
                {effects.risk_modifier > 0 ? '+' : ''}{effects.risk_modifier}
              </p>
            </div>
            <div className="bg-surface-highlight border border-border p-4 text-center">
              <p className="text-xs text-text-secondary uppercase tracking-wider mb-1">Guerras</p>
              <p className={clsx(
                'text-2xl font-body',
                effects.wars_disabled ? 'text-error' : 'text-success'
              )}>
                {effects.wars_disabled ? 'Bloqueadas' : 'Ativas'}
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Active Events */}
      {activeTab === 'active' && (
        <>
          {cityEvents.length === 0 ? (
            <Card>
              <div className="text-center py-8">
                <Radio size={48} className="mx-auto text-text-secondary mb-4" />
                <p className="text-text-secondary mb-4">Nenhum evento ativo no momento.</p>
                <p className="text-text-secondary text-sm">Eventos afetam toda a cidade e mudam a dinâmica do jogo.</p>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {cityEvents.map((event) => {
                const Icon = getIcon(event.icon);
                const timeRemaining = getTimeRemaining(event.ends_at);
                const loreInfo = EVENTS_LORE[event.event_id];
                
                return (
                  <div
                    key={event.id}
                    className="bg-surface border border-primary relative overflow-hidden"
                    data-testid={`event-${event.event_id}`}
                  >
                    {/* Animated border */}
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-secondary to-primary animate-pulse" />
                    
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-primary/20 border border-primary flex items-center justify-center animate-pulse">
                            <Icon size={24} className="text-primary" />
                          </div>
                          <div>
                            <h3 className="font-heading text-xl text-text-primary">{event.name}</h3>
                            <div className="flex items-center gap-2 mt-1">
                              <Clock size={14} className="text-warning" />
                              <span className="text-warning font-body">{timeRemaining}</span>
                            </div>
                          </div>
                        </div>
                        <Badge variant="primary">ATIVO</Badge>
                      </div>
                      
                      <p className="text-text-secondary text-sm mb-4">{event.description}</p>
                      
                      {/* Lore Tips */}
                      {loreInfo && loreInfo.tips && (
                        <div className="bg-primary/10 border border-primary/30 p-3 rounded mb-3">
                          <div className="flex items-center gap-2 mb-2">
                            <Lightbulb size={14} className="text-primary" />
                            <span className="text-xs text-primary uppercase">Dicas</span>
                          </div>
                          <ul className="text-xs text-text-secondary space-y-1">
                            {loreInfo.tips.slice(0, 2).map((tip, idx) => (
                              <li key={idx} className="flex items-start gap-1">
                                <span className="text-primary">•</span>
                                <span>{tip}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {/* Effects */}
                      <div className="space-y-2">
                        <h4 className="text-xs text-text-secondary uppercase tracking-wider">Efeitos:</h4>
                        <div className="flex flex-wrap gap-2">
                          {event.effects.heat_multiplier !== 1 && (
                            <Badge variant={getEffectColor(event.effects.heat_multiplier)}>
                              Heat: {event.effects.heat_multiplier}x
                            </Badge>
                          )}
                          {event.effects.reward_multiplier !== 1 && (
                            <Badge variant={getEffectColor(event.effects.reward_multiplier)}>
                              Recompensa: {event.effects.reward_multiplier}x
                            </Badge>
                          )}
                          {event.effects.risk_modifier !== 0 && (
                            <Badge variant={getEffectColor(event.effects.risk_modifier, false)}>
                              Risco: {event.effects.risk_modifier > 0 ? '+' : ''}{event.effects.risk_modifier}
                            </Badge>
                          )}
                          {event.effects.wars_disabled && (
                            <Badge variant="warning">
                              Guerras Bloqueadas
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Predictions Tab */}
      {activeTab === 'predictions' && predictions && (
        <div className="space-y-4">
          <Card title="Previsões de Eventos" icon={Eye}>
            <p className="text-text-secondary text-sm mb-4">
              Baseado nas condições actuais da cidade, estes eventos têm alta probabilidade de ocorrer:
            </p>
            <div className="space-y-3">
              {predictions.predictions?.length > 0 ? (
                predictions.predictions.map((pred, idx) => (
                  <div key={idx} className="bg-surface-highlight border border-border p-4 rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-heading text-text-primary">{pred.name}</h4>
                        <p className="text-xs text-text-secondary">{pred.estimated_time}</p>
                      </div>
                      <Badge variant={pred.probability > 60 ? 'error' : pred.probability > 30 ? 'warning' : 'secondary'}>
                        {pred.probability}% provável
                      </Badge>
                    </div>
                    <div className="mt-3 pt-3 border-t border-border grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-text-secondary">Impacto:</span>
                        <p className="text-text-primary text-xs mt-1">{pred.impact}</p>
                      </div>
                      <div>
                        <span className="text-text-secondary">Preparação:</span>
                        <p className="text-primary text-xs mt-1">{pred.preparation}</p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-text-secondary text-center py-4">Sem previsões disponíveis</p>
              )}
            </div>
          </Card>

          <Card title="Base de Análise" icon={Activity}>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-mono text-primary">{predictions.analysis_based_on?.recent_crimes || 0}</p>
                <p className="text-xs text-text-secondary">Crimes última hora</p>
              </div>
              <div>
                <p className="text-2xl font-mono text-error">{predictions.analysis_based_on?.active_wars || 0}</p>
                <p className="text-xs text-text-secondary">Guerras activas</p>
              </div>
              <div>
                <p className="text-2xl font-mono text-secondary">{predictions.analysis_based_on?.time_of_day || 0}h</p>
                <p className="text-xs text-text-secondary">Hora do dia</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Impact Tab */}
      {activeTab === 'impact' && impact && (
        <div className="space-y-4">
          <Card title="Impacto dos Eventos em Ti" icon={Target}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="bg-surface-highlight p-4 text-center rounded-lg">
                <p className={clsx(
                  'text-2xl font-mono',
                  impact.combined_impact?.heat_modifier > 1 ? 'text-error' : 'text-success'
                )}>
                  {impact.combined_impact?.heat_modifier?.toFixed(2) || '1.00'}x
                </p>
                <p className="text-xs text-text-secondary">Heat</p>
              </div>
              <div className="bg-surface-highlight p-4 text-center rounded-lg">
                <p className={clsx(
                  'text-2xl font-mono',
                  impact.combined_impact?.reward_modifier > 1 ? 'text-success' : 'text-error'
                )}>
                  {impact.combined_impact?.reward_modifier?.toFixed(2) || '1.00'}x
                </p>
                <p className="text-xs text-text-secondary">Recompensa</p>
              </div>
              <div className="bg-surface-highlight p-4 text-center rounded-lg">
                <p className="text-2xl font-mono text-secondary">
                  {impact.combined_impact?.stealth_modifier?.toFixed(2) || '1.00'}x
                </p>
                <p className="text-xs text-text-secondary">Stealth</p>
              </div>
              <div className="bg-surface-highlight p-4 text-center rounded-lg">
                <p className={clsx(
                  'text-2xl font-mono',
                  impact.combined_impact?.danger_modifier > 1 ? 'text-error' : 'text-success'
                )}>
                  {impact.combined_impact?.danger_modifier?.toFixed(2) || '1.00'}x
                </p>
                <p className="text-xs text-text-secondary">Perigo</p>
              </div>
            </div>

            {/* Advice */}
            {impact.advice?.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs text-text-secondary uppercase">Conselhos Personalizados:</h4>
                {impact.advice.map((advice, idx) => (
                  <div key={idx} className="bg-primary/10 border border-primary/30 p-3 rounded flex items-start gap-2">
                    <Lightbulb size={16} className="text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="text-xs text-primary">{advice.event}: </span>
                      <span className="text-sm text-text-primary">{advice.tip}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Conditions Tab */}
      {activeTab === 'conditions' && dynamicEvents && (
        <div className="space-y-4">
          <Card title="Condições Actuais da Cidade" icon={Activity}>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="bg-surface-highlight p-4 text-center rounded-lg">
                <p className="text-2xl font-mono text-primary capitalize">
                  {dynamicEvents.current_conditions?.crime_level || 'médio'}
                </p>
                <p className="text-xs text-text-secondary">Nível de Crime</p>
              </div>
              <div className="bg-surface-highlight p-4 text-center rounded-lg">
                <p className="text-2xl font-mono text-error capitalize">
                  {dynamicEvents.current_conditions?.war_status || 'pacífico'}
                </p>
                <p className="text-xs text-text-secondary">Status de Guerra</p>
              </div>
              <div className="bg-surface-highlight p-4 text-center rounded-lg">
                <p className="text-2xl font-mono text-success capitalize">
                  {dynamicEvents.current_conditions?.economy || 'estável'}
                </p>
                <p className="text-xs text-text-secondary">Economia</p>
              </div>
            </div>
          </Card>

          <Card title="Eventos Potenciais" icon={AlertTriangle}>
            <p className="text-text-secondary text-sm mb-4">
              Eventos que podem ser desencadeados com base nas condições actuais:
            </p>
            <div className="space-y-3">
              {dynamicEvents.potential_events?.map((event, idx) => (
                <div key={idx} className="bg-surface-highlight border border-border p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-heading text-text-primary">{event.name}</h4>
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-2 bg-background rounded-full overflow-hidden">
                        <div 
                          className={clsx(
                            'h-full',
                            event.probability > 60 ? 'bg-error' : 
                            event.probability > 30 ? 'bg-warning' : 'bg-secondary'
                          )}
                          style={{ width: `${event.probability}%` }}
                        />
                      </div>
                      <span className="text-xs text-text-secondary">{event.probability}%</span>
                    </div>
                  </div>
                  <p className="text-sm text-text-secondary">{event.description}</p>
                  {event.effects && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {Object.entries(event.effects).map(([key, value]) => (
                        <Badge key={key} variant="secondary" size="sm">
                          {key}: {typeof value === 'number' ? value.toFixed(1) : value}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Card>

          <Card title="Estatísticas do Jogo" icon={TrendingUp}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-2xl font-mono text-primary">{dynamicEvents.game_stats?.total_crimes_24h || 0}</p>
                <p className="text-xs text-text-secondary">Crimes (24h)</p>
              </div>
              <div>
                <p className="text-2xl font-mono text-error">{dynamicEvents.game_stats?.active_wars || 0}</p>
                <p className="text-xs text-text-secondary">Guerras Activas</p>
              </div>
              <div>
                <p className="text-2xl font-mono text-success">€{Math.round(dynamicEvents.game_stats?.avg_player_money || 0)}</p>
                <p className="text-xs text-text-secondary">€ Média/Jogador</p>
              </div>
              <div>
                <p className="text-2xl font-mono text-secondary">{dynamicEvents.game_stats?.active_players_1h || 0}</p>
                <p className="text-xs text-text-secondary">Jogadores (1h)</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Event Info */}
      <Card title="Sobre Eventos" icon={AlertTriangle}>
        <div className="space-y-3 text-text-secondary text-sm">
          <p>
            <strong className="text-text-primary">Eventos</strong> são acontecimentos que afetam toda a cidade e modificam a jogabilidade temporariamente.
          </p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li><span className="text-success">Multiplicador de Recompensa</span> - Aumenta ou diminui os ganhos</li>
            <li><span className="text-error">Multiplicador de Heat</span> - Afeta o calor policial gerado</li>
            <li><span className="text-warning">Modificador de Risco</span> - Altera a dificuldade das missões</li>
            <li><span className="text-secondary">Bloqueio de Guerras</span> - Impede guerras entre gangues</li>
          </ul>
          <p className="text-xs text-text-secondary mt-4">
            Máximo de 2 eventos ativos simultaneamente. Eventos expiram automaticamente.
          </p>
        </div>
      </Card>
    </div>
  );
}

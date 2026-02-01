import { useGame } from '../contexts/GameContext';
import { Card } from '../components/ProgressBar';
import { Badge } from '../components/UI';
import { 
  Map, Building2, Flame, DollarSign, 
  AlertTriangle, Users, ChevronRight 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import clsx from 'clsx';

export default function MapPage() {
  const { neighborhoods } = useGame();
  const navigate = useNavigate();

  const getHeatColor = (heat) => {
    if (heat >= 60) return 'error';
    if (heat >= 30) return 'warning';
    return 'success';
  };

  const getEconomicIcon = (value) => {
    if (value >= 70) return '💎';
    if (value >= 50) return '💰';
    return '💵';
  };

  return (
    <div className="space-y-6 animate-fade-in" data-testid="map-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl md:text-3xl text-text-primary flex items-center gap-3">
            <Map className="text-primary" size={28} />
            Mapa da Cidade
          </h1>
          <p className="text-text-secondary text-sm mt-1">
            Explora os bairros e encontra oportunidades
          </p>
        </div>
      </div>

      {/* City Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-surface border border-border p-4">
          <p className="text-xs text-text-secondary uppercase tracking-wider mb-1">Bairros</p>
          <p className="text-2xl font-body text-primary">{neighborhoods.length}</p>
        </div>
        <div className="bg-surface border border-border p-4">
          <p className="text-xs text-text-secondary uppercase tracking-wider mb-1">Heat Médio</p>
          <p className="text-2xl font-body text-error">
            {neighborhoods.length > 0 
              ? Math.round(neighborhoods.reduce((acc, n) => acc + n.heat_level, 0) / neighborhoods.length)
              : 0}%
          </p>
        </div>
        <div className="bg-surface border border-border p-4">
          <p className="text-xs text-text-secondary uppercase tracking-wider mb-1">Territórios Livres</p>
          <p className="text-2xl font-body text-success">
            {neighborhoods.filter(n => n.control_status === 'neutro').length}
          </p>
        </div>
        <div className="bg-surface border border-border p-4">
          <p className="text-xs text-text-secondary uppercase tracking-wider mb-1">Missões Disponíveis</p>
          <p className="text-2xl font-body text-secondary">
            {neighborhoods.reduce((acc, n) => acc + (n.available_missions || 0), 0)}
          </p>
        </div>
      </div>

      {/* Neighborhoods Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {neighborhoods.map((neighborhood) => (
          <div
            key={neighborhood.id}
            className={clsx(
              'bg-surface border border-border relative overflow-hidden cursor-pointer',
              'hover:border-primary/50 transition-all hover:translate-x-1'
            )}
            onClick={() => navigate(`/missoes?bairro=${neighborhood.id}`)}
            data-testid={`neighborhood-${neighborhood.id}`}
          >
            {/* Left accent */}
            <div className={clsx(
              'absolute top-0 left-0 w-1 h-full',
              `bg-${getHeatColor(neighborhood.heat_level)}`
            )} style={{
              backgroundColor: neighborhood.heat_level >= 60 ? '#FF003C' 
                : neighborhood.heat_level >= 30 ? '#FFD600' 
                : '#00FF9D'
            }} />
            
            <div className="p-4">
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-surface-highlight border border-border flex items-center justify-center">
                    <Building2 size={20} className="text-primary" />
                  </div>
                  <div>
                    <h3 className="font-heading text-lg text-text-primary">
                      {neighborhood.name}
                    </h3>
                    <p className="text-xs text-text-secondary">
                      {neighborhood.id.toUpperCase()}
                    </p>
                  </div>
                </div>
                <span className="text-xl">{getEconomicIcon(neighborhood.economic_value)}</span>
              </div>
              
              {/* Description */}
              <p className="text-text-secondary text-sm mb-4 line-clamp-2">
                {neighborhood.description}
              </p>
              
              {/* Stats */}
              <div className="flex flex-wrap gap-2 mb-4">
                <Badge variant={getHeatColor(neighborhood.heat_level)}>
                  <Flame size={12} className="mr-1" />
                  Heat {neighborhood.heat_level}%
                </Badge>
                <Badge variant="default">
                  <DollarSign size={12} className="mr-1" />
                  Valor {neighborhood.economic_value}
                </Badge>
                {neighborhood.controlling_gang && (
                  <Badge variant="gold">
                    <Users size={12} className="mr-1" />
                    Controlado
                  </Badge>
                )}
              </div>
              
              {/* Events */}
              {neighborhood.active_events?.length > 0 && (
                <div className="flex items-center gap-2 text-warning text-sm mb-3">
                  <AlertTriangle size={14} />
                  <span>{neighborhood.active_events.length} evento(s) ativo(s)</span>
                </div>
              )}
              
              {/* Footer */}
              <div className="flex items-center justify-between pt-3 border-t border-border">
                <span className="text-xs text-text-secondary">
                  {neighborhood.available_missions} missões disponíveis
                </span>
                <ChevronRight size={18} className="text-primary" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {neighborhoods.length === 0 && (
        <Card>
          <div className="text-center py-8">
            <Map size={48} className="mx-auto text-text-secondary mb-4" />
            <p className="text-text-secondary">A carregar bairros...</p>
          </div>
        </Card>
      )}
    </div>
  );
}

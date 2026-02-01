import { useState, useEffect } from 'react';
import { useGame } from '../contexts/GameContext';
import { useAuth } from '../contexts/AuthContext';
import { Card } from '../components/ProgressBar';
import { Badge, Button, Modal } from '../components/UI';
import { 
  Map, Building2, Flame, DollarSign, 
  AlertTriangle, Users, ChevronRight, Info,
  MapPin, Skull, Sparkles, X
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import clsx from 'clsx';

export default function MapPage() {
  const { neighborhoods } = useGame();
  const { api } = useAuth();
  const navigate = useNavigate();
  const [selectedLore, setSelectedLore] = useState(null);
  const [loreData, setLoreData] = useState(null);
  const [loadingLore, setLoadingLore] = useState(false);

  // Buscar lore quando selecionar bairro
  useEffect(() => {
    if (selectedLore) {
      const fetchLore = async () => {
        setLoadingLore(true);
        try {
          const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/lore/neighborhoods/${selectedLore}`);
          if (response.ok) {
            const data = await response.json();
            setLoreData(data);
          }
        } catch (err) {
          console.log('Lore fetch error:', err);
        } finally {
          setLoadingLore(false);
        }
      };
      fetchLore();
    }
  }, [selectedLore]);

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
              'bg-surface border border-border relative overflow-hidden',
              'hover:border-primary/50 transition-all'
            )}
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
                <div className="flex items-center gap-1">
                  <span className="text-xl">{getEconomicIcon(neighborhood.economic_value)}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedLore(neighborhood.id);
                    }}
                    className="p-1 hover:bg-surface-highlight rounded transition-colors"
                    title="Ver lore do bairro"
                  >
                    <Info size={16} className="text-text-secondary hover:text-primary" />
                  </button>
                </div>
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
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate(`/missoes?bairro=${neighborhood.id}`)}
                >
                  Ver Missões <ChevronRight size={14} />
                </Button>
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

      {/* Lore Modal */}
      <Modal
        isOpen={!!selectedLore}
        onClose={() => {
          setSelectedLore(null);
          setLoreData(null);
        }}
        title={loreData?.fullName || loreData?.name || 'Carregando...'}
      >
        {loadingLore ? (
          <div className="text-center py-8">
            <p className="text-text-secondary">A carregar lore...</p>
          </div>
        ) : loreData ? (
          <div className="space-y-4">
            {/* Nickname */}
            {loreData.nickname && (
              <div className="text-center">
                <Badge variant="gold" size="lg">"{loreData.nickname}"</Badge>
              </div>
            )}
            
            {/* Description */}
            <div>
              <p className="text-text-primary leading-relaxed">{loreData.description}</p>
            </div>
            
            {/* History */}
            {loreData.history && (
              <div className="bg-surface-highlight p-4 border border-border">
                <h4 className="font-heading text-sm text-primary mb-2 flex items-center gap-2">
                  <Map size={14} /> História
                </h4>
                <p className="text-sm text-text-secondary">{loreData.history}</p>
              </div>
            )}
            
            {/* Dangers */}
            {loreData.dangers?.length > 0 && (
              <div>
                <h4 className="font-heading text-sm text-error mb-2 flex items-center gap-2">
                  <Skull size={14} /> Perigos
                </h4>
                <ul className="space-y-1">
                  {loreData.dangers.map((danger, i) => (
                    <li key={i} className="text-sm text-text-secondary flex items-start gap-2">
                      <AlertTriangle size={12} className="text-error mt-1 flex-shrink-0" />
                      {danger}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {/* Opportunities */}
            {loreData.opportunities?.length > 0 && (
              <div>
                <h4 className="font-heading text-sm text-success mb-2 flex items-center gap-2">
                  <Sparkles size={14} /> Oportunidades
                </h4>
                <ul className="space-y-1">
                  {loreData.opportunities.map((opp, i) => (
                    <li key={i} className="text-sm text-text-secondary flex items-start gap-2">
                      <DollarSign size={12} className="text-success mt-1 flex-shrink-0" />
                      {opp}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {/* Landmarks */}
            {loreData.landmarks?.length > 0 && (
              <div>
                <h4 className="font-heading text-sm text-primary mb-2 flex items-center gap-2">
                  <MapPin size={14} /> Pontos de Interesse
                </h4>
                <div className="grid gap-2">
                  {loreData.landmarks.map((landmark, i) => (
                    <div key={i} className="bg-surface p-2 border border-border">
                      <p className="font-body text-sm text-text-primary">{landmark.name}</p>
                      <p className="text-xs text-text-secondary">{landmark.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Controlling Faction */}
            {loreData.controllingFactions && (
              <div className="text-center pt-2 border-t border-border">
                <p className="text-xs text-text-secondary">Controlado por</p>
                <p className="font-heading text-gold">{loreData.controllingFactions}</p>
              </div>
            )}
          </div>
        ) : null}
      </Modal>
    </div>
  );
}

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useGame } from '../contexts/GameContext';
import { useAuth } from '../contexts/AuthContext';
import { Card, ProgressBar, StatCard, CircularProgress, MiniSparkline, DonutChart, HeatMeter } from '../components/ProgressBar';
import { Badge, Button, Modal, Tabs, Select, SearchInput, Tooltip, FadeIn, SlideIn, Alert, Skeleton, Toggle, RadioGroup, Dropdown, EmptyState, FilterBar, Pagination } from '../components/UI';
import { GangSystem, HeatSystem, EconomySystem } from '../utils/gameLogic';
import { NEIGHBORHOODS_LORE } from '../data/lore';
import { 
  Map, Building2, Flame, DollarSign, 
  AlertTriangle, Users, ChevronRight, Info,
  MapPin, Skull, Sparkles, X, Target, Clock,
  Eye, EyeOff, Filter, Search, Shield, Zap,
  TrendingUp, TrendingDown, Activity, Radio, Crown,
  Home, Factory, ShoppingBag, Car, Crosshair, Swords,
  Star, Lock, Unlock, Settings, RefreshCw, Compass,
  Navigation, Layers, Grid3X3, List, BarChart2, PieChart,
  ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Maximize2, Minimize2,
  ZoomIn, ZoomOut, RotateCcw, Bookmark, Heart, Share2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import clsx from 'clsx';

// ============================================================================
// CONSTANTES
// ============================================================================

const MAP_FILTERS = [
  { id: 'all', label: 'Todos', icon: Layers },
  { id: 'missions', label: 'Missões', icon: Target },
  { id: 'properties', label: 'Propriedades', icon: Building2 },
  { id: 'businesses', label: 'Negócios', icon: Factory },
  { id: 'gangs', label: 'Gangues', icon: Users },
  { id: 'events', label: 'Eventos', icon: Radio }
];

const SORT_OPTIONS = [
  { value: 'name', label: 'Nome' },
  { value: 'heat_low', label: 'Menor Heat' },
  { value: 'heat_high', label: 'Maior Heat' },
  { value: 'value_high', label: 'Maior Valor' },
  { value: 'value_low', label: 'Menor Valor' },
  { value: 'missions', label: 'Mais Missões' }
];

const VIEW_MODES = [
  { id: 'grid', label: 'Grelha', icon: Grid3X3 },
  { id: 'list', label: 'Lista', icon: List },
  { id: 'map', label: 'Mapa', icon: Map }
];

// ============================================================================
// COMPONENTE: City Overview Stats
// ============================================================================

const CityOverviewStats = ({ neighborhoods, player }) => {
  const stats = useMemo(() => {
    const avgHeat = neighborhoods.length > 0
      ? Math.round(neighborhoods.reduce((acc, n) => acc + n.heat_level, 0) / neighborhoods.length)
      : 0;
    
    const freeTerrities = neighborhoods.filter(n => n.control_status === 'neutro').length;
    const totalMissions = neighborhoods.reduce((acc, n) => acc + (n.available_missions || 0), 0);
    const activeEvents = neighborhoods.reduce((acc, n) => acc + (n.active_events?.length || 0), 0);

    return [
      { label: 'Bairros', value: neighborhoods.length, icon: Building2, color: 'primary' },
      { label: 'Heat Médio', value: `${avgHeat}%`, icon: Flame, color: avgHeat > 50 ? 'error' : avgHeat > 25 ? 'warning' : 'success' },
      { label: 'Livres', value: freeTerrities, icon: Unlock, color: 'success' },
      { label: 'Missões', value: totalMissions, icon: Target, color: 'secondary' },
      { label: 'Eventos', value: activeEvents, icon: Radio, color: activeEvents > 0 ? 'gold' : 'default' }
    ];
  }, [neighborhoods]);

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
      {stats.map((stat, i) => (
        <FadeIn key={stat.label} delay={i * 50}>
          <div className="bg-surface border border-border p-3 text-center">
            <stat.icon size={18} className={`text-${stat.color} mx-auto mb-1`} />
            <p className={`text-xl font-body font-bold text-${stat.color}`}>{stat.value}</p>
            <p className="text-[10px] text-text-secondary uppercase">{stat.label}</p>
          </div>
        </FadeIn>
      ))}
    </div>
  );
};

// ============================================================================
// COMPONENTE: Heat Distribution Chart
// ============================================================================

const HeatDistributionChart = ({ neighborhoods }) => {
  const distribution = useMemo(() => {
    const low = neighborhoods.filter(n => n.heat_level < 30).length;
    const medium = neighborhoods.filter(n => n.heat_level >= 30 && n.heat_level < 60).length;
    const high = neighborhoods.filter(n => n.heat_level >= 60).length;

    return [
      { label: 'Baixo (<30%)', value: low, color: 'success' },
      { label: 'Médio (30-60%)', value: medium, color: 'warning' },
      { label: 'Alto (>60%)', value: high, color: 'error' }
    ];
  }, [neighborhoods]);

  return (
    <Card title="Distribuição de Heat" icon={Flame} collapsible>
      <DonutChart
        data={distribution}
        size={100}
        strokeWidth={15}
        showLegend
        totalLabel="Total"
      />
    </Card>
  );
};

// ============================================================================
// COMPONENTE: Territory Control Overview
// ============================================================================

const TerritoryControlOverview = ({ neighborhoods }) => {
  const controlData = useMemo(() => {
    const gangControl = {};
    let neutral = 0;
    let contested = 0;

    neighborhoods.forEach(n => {
      if (n.control_status === 'neutro' || !n.controlling_gang) {
        neutral++;
      } else if (n.control_status === 'contested') {
        contested++;
      } else if (n.controlling_gang) {
        gangControl[n.controlling_gang] = (gangControl[n.controlling_gang] || 0) + 1;
      }
    });

    const gangs = Object.entries(gangControl)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return { gangs, neutral, contested };
  }, [neighborhoods]);

  return (
    <Card title="Controlo Territorial" icon={Crown} collapsible>
      <div className="space-y-3">
        {/* Neutral & Contested */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-success/10 border border-success/30 p-3 text-center">
            <p className="text-xl font-body text-success">{controlData.neutral}</p>
            <p className="text-xs text-text-secondary">Neutros</p>
          </div>
          <div className="bg-warning/10 border border-warning/30 p-3 text-center">
            <p className="text-xl font-body text-warning">{controlData.contested}</p>
            <p className="text-xs text-text-secondary">Contestados</p>
          </div>
        </div>

        {/* Top Gangs */}
        {controlData.gangs.length > 0 && (
          <div className="pt-3 border-t border-border">
            <p className="text-xs text-text-secondary uppercase mb-2">Top Gangues</p>
            {controlData.gangs.map((gang, i) => (
              <div key={gang.name} className="flex items-center justify-between py-1">
                <div className="flex items-center gap-2">
                  <span className="text-gold font-body">#{i + 1}</span>
                  <span className="text-text-primary">{gang.name}</span>
                </div>
                <Badge variant="gold" size="sm">{gang.count} territórios</Badge>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
};

// ============================================================================
// COMPONENTE: Neighborhood Card (Grid View)
// ============================================================================

const NeighborhoodCardGrid = ({ neighborhood, onSelect, onViewLore, onViewMissions, isFavorite, onToggleFavorite }) => {
  const [isHovered, setIsHovered] = useState(false);
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

  const heatColor = getHeatColor(neighborhood.heat_level);

  return (
    <div
      className={clsx(
        'bg-surface border border-border relative overflow-hidden transition-all',
        'hover:border-primary/50 hover:shadow-lg',
        isFavorite && 'ring-2 ring-gold/30'
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Left accent */}
      <div 
        className="absolute top-0 left-0 w-1 h-full"
        style={{
          backgroundColor: neighborhood.heat_level >= 60 ? '#FF003C' 
            : neighborhood.heat_level >= 30 ? '#FFD600' 
            : '#00FF9D'
        }} 
      />
      
      {/* Favorite button */}
      <button
        className="absolute top-2 right-2 p-1 hover:bg-surface-highlight transition-colors z-10"
        onClick={(e) => { e.stopPropagation(); onToggleFavorite(neighborhood.id); }}
      >
        <Heart 
          size={16} 
          className={isFavorite ? 'text-error fill-error' : 'text-text-secondary'} 
        />
      </button>
      
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3 pr-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-surface-highlight border border-border flex items-center justify-center">
              <Building2 size={24} className="text-primary" />
            </div>
            <div>
              <h3 className="font-heading text-lg text-text-primary">
                {neighborhood.name}
              </h3>
              <p className="text-xs text-text-secondary uppercase">
                {neighborhood.id}
              </p>
            </div>
          </div>
          <span className="text-2xl">{getEconomicIcon(neighborhood.economic_value)}</span>
        </div>
        
        {/* Description */}
        <p className="text-text-secondary text-sm mb-4 line-clamp-2">
          {neighborhood.description}
        </p>
        
        {/* Stats Badges */}
        <div className="flex flex-wrap gap-2 mb-4">
          <Badge variant={heatColor}>
            <Flame size={12} className="mr-1" />
            Heat {neighborhood.heat_level}%
          </Badge>
          <Badge variant="default">
            <DollarSign size={12} className="mr-1" />
            Valor {neighborhood.economic_value}
          </Badge>
          {neighborhood.controlling_gang && (
            <Badge variant="gold">
              <Crown size={12} className="mr-1" />
              Controlado
            </Badge>
          )}
        </div>
        
        {/* Heat Progress */}
        <ProgressBar
          value={neighborhood.heat_level}
          max={100}
          color={heatColor}
          showLabel={false}
          height="h-1.5"
        />
        
        {/* Events */}
        {neighborhood.active_events?.length > 0 && (
          <div className="flex items-center gap-2 text-warning text-sm mt-3">
            <Radio size={14} className="animate-pulse" />
            <span>{neighborhood.active_events.length} evento(s) ativo(s)</span>
          </div>
        )}
        
        {/* Footer */}
        <div className="flex items-center justify-between pt-4 mt-4 border-t border-border">
          <span className="text-xs text-text-secondary">
            {neighborhood.available_missions || 0} missões
          </span>
          <div className="flex gap-2">
            <Tooltip content="Ver lore">
              <button
                onClick={(e) => { e.stopPropagation(); onViewLore(neighborhood.id); }}
                className="p-1 hover:bg-surface-highlight transition-colors"
              >
                <Info size={16} className="text-text-secondary hover:text-primary" />
              </button>
            </Tooltip>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(`/missoes?bairro=${neighborhood.id}`)}
            >
              Missões <ChevronRight size={14} />
            </Button>
          </div>
        </div>
      </div>
      
      {/* Hover Overlay */}
      {isHovered && (
        <div className="absolute inset-0 bg-background/80 flex flex-col items-center justify-center gap-3 animate-fade-in">
          <Button 
            variant="primary" 
            icon={Target}
            onClick={() => navigate(`/missoes?bairro=${neighborhood.id}`)}
          >
            Ver Missões
          </Button>
          <Button 
            variant="secondary" 
            icon={Info}
            onClick={() => onViewLore(neighborhood.id)}
          >
            Ver Detalhes
          </Button>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// COMPONENTE: Neighborhood Card (List View)
// ============================================================================

const NeighborhoodCardList = ({ neighborhood, onSelect, onViewLore, onViewMissions }) => {
  const navigate = useNavigate();

  const getHeatColor = (heat) => {
    if (heat >= 60) return 'error';
    if (heat >= 30) return 'warning';
    return 'success';
  };

  return (
    <div className="bg-surface border border-border p-4 flex items-center gap-4 hover:border-primary/50 transition-all">
      {/* Heat indicator */}
      <div 
        className="w-2 h-16 flex-shrink-0"
        style={{
          backgroundColor: neighborhood.heat_level >= 60 ? '#FF003C' 
            : neighborhood.heat_level >= 30 ? '#FFD600' 
            : '#00FF9D'
        }} 
      />
      
      {/* Icon */}
      <div className="w-12 h-12 bg-surface-highlight border border-border flex items-center justify-center flex-shrink-0">
        <Building2 size={24} className="text-primary" />
      </div>
      
      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="font-heading text-text-primary">{neighborhood.name}</h3>
          {neighborhood.controlling_gang && (
            <Badge variant="gold" size="xs">
              <Crown size={10} className="mr-1" /> {neighborhood.controlling_gang}
            </Badge>
          )}
        </div>
        <p className="text-text-secondary text-sm truncate">{neighborhood.description}</p>
      </div>
      
      {/* Stats */}
      <div className="hidden md:flex items-center gap-6 text-sm">
        <div className="text-center">
          <p className={`font-body text-${getHeatColor(neighborhood.heat_level)}`}>{neighborhood.heat_level}%</p>
          <p className="text-[10px] text-text-secondary">Heat</p>
        </div>
        <div className="text-center">
          <p className="font-body text-gold">{neighborhood.economic_value}</p>
          <p className="text-[10px] text-text-secondary">Valor</p>
        </div>
        <div className="text-center">
          <p className="font-body text-primary">{neighborhood.available_missions || 0}</p>
          <p className="text-[10px] text-text-secondary">Missões</p>
        </div>
      </div>
      
      {/* Actions */}
      <div className="flex gap-2">
        <Tooltip content="Ver lore">
          <button
            onClick={() => onViewLore(neighborhood.id)}
            className="p-2 hover:bg-surface-highlight transition-colors"
          >
            <Info size={18} className="text-text-secondary" />
          </button>
        </Tooltip>
        <Button 
          variant="primary" 
          size="sm"
          onClick={() => navigate(`/missoes?bairro=${neighborhood.id}`)}
        >
          Missões
        </Button>
      </div>
    </div>
  );
};

// ============================================================================
// COMPONENTE: Visual Map (Simplified)
// ============================================================================

const VisualMapView = ({ neighborhoods, selectedId, onSelect }) => {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });

  const getHeatColor = (heat) => {
    if (heat >= 60) return '#FF003C';
    if (heat >= 30) return '#FFD600';
    return '#00FF9D';
  };

  // Simple grid layout for neighborhoods
  const gridPositions = useMemo(() => {
    const cols = 3;
    return neighborhoods.map((n, i) => ({
      ...n,
      x: (i % cols) * 200 + 100,
      y: Math.floor(i / cols) * 180 + 100
    }));
  }, [neighborhoods]);

  return (
    <Card title="Mapa Visual" icon={Map} noPadding>
      <div className="relative overflow-hidden" style={{ height: '500px' }}>
        {/* Controls */}
        <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
          <button
            className="p-2 bg-surface border border-border hover:bg-surface-highlight transition-colors"
            onClick={() => setZoom(z => Math.min(z + 0.2, 2))}
          >
            <ZoomIn size={18} />
          </button>
          <button
            className="p-2 bg-surface border border-border hover:bg-surface-highlight transition-colors"
            onClick={() => setZoom(z => Math.max(z - 0.2, 0.5))}
          >
            <ZoomOut size={18} />
          </button>
          <button
            className="p-2 bg-surface border border-border hover:bg-surface-highlight transition-colors"
            onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}
          >
            <RotateCcw size={18} />
          </button>
        </div>

        {/* Map Content */}
        <div 
          className="absolute inset-0 transition-transform"
          style={{ 
            transform: `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)`,
            transformOrigin: 'center center'
          }}
        >
          {/* Grid Background */}
          <div className="absolute inset-0 opacity-10">
            <div className="w-full h-full" style={{
              backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px)',
              backgroundSize: '20px 20px'
            }} />
          </div>

          {/* Connections */}
          <svg className="absolute inset-0 pointer-events-none">
            {gridPositions.slice(0, -1).map((n, i) => {
              const next = gridPositions[i + 1];
              if (!next || i % 3 === 2) return null;
              return (
                <line
                  key={`h-${i}`}
                  x1={n.x}
                  y1={n.y}
                  x2={next.x}
                  y2={next.y}
                  stroke="rgba(255,255,255,0.1)"
                  strokeWidth="2"
                />
              );
            })}
            {gridPositions.map((n, i) => {
              const below = gridPositions[i + 3];
              if (!below) return null;
              return (
                <line
                  key={`v-${i}`}
                  x1={n.x}
                  y1={n.y}
                  x2={below.x}
                  y2={below.y}
                  stroke="rgba(255,255,255,0.1)"
                  strokeWidth="2"
                />
              );
            })}
          </svg>

          {/* Neighborhood Nodes */}
          {gridPositions.map((n) => (
            <div
              key={n.id}
              className={clsx(
                'absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all',
                selectedId === n.id && 'scale-110'
              )}
              style={{ left: n.x, top: n.y }}
              onClick={() => onSelect(n.id)}
            >
              <div className={clsx(
                'w-20 h-20 flex flex-col items-center justify-center border-2 transition-all',
                selectedId === n.id ? 'bg-primary/20 border-primary' : 'bg-surface border-border hover:border-primary/50'
              )}>
                <div 
                  className="w-3 h-3 rounded-full mb-1"
                  style={{ backgroundColor: getHeatColor(n.heat_level) }}
                />
                <span className="text-[10px] text-text-primary text-center px-1 truncate w-full">
                  {n.name.split(' ')[0]}
                </span>
                <span className="text-[8px] text-text-secondary">
                  {n.heat_level}% • {n.available_missions || 0}
                </span>
              </div>
              
              {/* Gang flag */}
              {n.controlling_gang && (
                <div className="absolute -top-2 -right-2">
                  <Crown size={12} className="text-gold" />
                </div>
              )}
              
              {/* Event indicator */}
              {n.active_events?.length > 0 && (
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2">
                  <Radio size={10} className="text-warning animate-pulse" />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="absolute bottom-4 left-4 bg-surface/90 border border-border p-3">
          <p className="text-xs text-text-secondary uppercase mb-2">Legenda</p>
          <div className="flex gap-4 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-success" />
              <span>Baixo Heat</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-warning" />
              <span>Médio</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-error" />
              <span>Alto</span>
            </div>
            <div className="flex items-center gap-1">
              <Crown size={10} className="text-gold" />
              <span>Controlado</span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

// ============================================================================
// COMPONENTE: Neighborhood Lore Modal
// ============================================================================

const NeighborhoodLoreModal = ({ neighborhoodId, isOpen, onClose }) => {
  const [loreData, setLoreData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (neighborhoodId && isOpen) {
      const fetchLore = async () => {
        setLoading(true);
        try {
          const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/lore/neighborhoods/${neighborhoodId}`);
          if (response.ok) {
            const data = await response.json();
            setLoreData(data);
          }
        } catch (err) {
          console.log('Lore fetch error:', err);
          // Fallback to local lore
          const localLore = NEIGHBORHOODS_LORE?.[neighborhoodId];
          if (localLore) setLoreData(localLore);
        } finally {
          setLoading(false);
        }
      };
      fetchLore();
    }
  }, [neighborhoodId, isOpen]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={loreData?.fullName || loreData?.name || 'Carregando...'}
      size="lg"
    >
      {loading ? (
        <div className="space-y-4">
          <Skeleton variant="title" />
          <Skeleton variant="text" count={4} />
          <Skeleton variant="card" />
        </div>
      ) : loreData ? (
        <div className="space-y-6">
          {/* Nickname */}
          {loreData.nickname && (
            <div className="text-center">
              <Badge variant="gold" size="lg">"{loreData.nickname}"</Badge>
            </div>
          )}
          
          {/* Main Description */}
          <div>
            <p className="text-text-primary leading-relaxed">{loreData.description}</p>
          </div>
          
          {/* Stats Grid */}
          {(loreData.heat_level !== undefined || loreData.economic_value !== undefined) && (
            <div className="grid grid-cols-3 gap-3">
              {loreData.heat_level !== undefined && (
                <div className="bg-surface-highlight border border-border p-3 text-center">
                  <Flame size={18} className={`mx-auto mb-1 text-${loreData.heat_level >= 60 ? 'error' : loreData.heat_level >= 30 ? 'warning' : 'success'}`} />
                  <p className="text-lg font-body text-text-primary">{loreData.heat_level}%</p>
                  <p className="text-xs text-text-secondary">Heat</p>
                </div>
              )}
              {loreData.economic_value !== undefined && (
                <div className="bg-surface-highlight border border-border p-3 text-center">
                  <DollarSign size={18} className="mx-auto mb-1 text-gold" />
                  <p className="text-lg font-body text-text-primary">{loreData.economic_value}</p>
                  <p className="text-xs text-text-secondary">Valor Económico</p>
                </div>
              )}
              {loreData.available_missions !== undefined && (
                <div className="bg-surface-highlight border border-border p-3 text-center">
                  <Target size={18} className="mx-auto mb-1 text-primary" />
                  <p className="text-lg font-body text-text-primary">{loreData.available_missions}</p>
                  <p className="text-xs text-text-secondary">Missões</p>
                </div>
              )}
            </div>
          )}
          
          {/* History */}
          {loreData.history && (
            <div className="bg-surface-highlight p-4 border border-border">
              <h4 className="font-heading text-sm text-primary mb-2 flex items-center gap-2">
                <Map size={14} /> História
              </h4>
              <p className="text-sm text-text-secondary leading-relaxed">{loreData.history}</p>
            </div>
          )}
          
          {/* Two Column Layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Dangers */}
            {loreData.dangers?.length > 0 && (
              <div className="bg-error/5 border border-error/30 p-4">
                <h4 className="font-heading text-sm text-error mb-3 flex items-center gap-2">
                  <Skull size={14} /> Perigos
                </h4>
                <ul className="space-y-2">
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
              <div className="bg-success/5 border border-success/30 p-4">
                <h4 className="font-heading text-sm text-success mb-3 flex items-center gap-2">
                  <Sparkles size={14} /> Oportunidades
                </h4>
                <ul className="space-y-2">
                  {loreData.opportunities.map((opp, i) => (
                    <li key={i} className="text-sm text-text-secondary flex items-start gap-2">
                      <DollarSign size={12} className="text-success mt-1 flex-shrink-0" />
                      {opp}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          
          {/* Landmarks */}
          {loreData.landmarks?.length > 0 && (
            <div>
              <h4 className="font-heading text-sm text-primary mb-3 flex items-center gap-2">
                <MapPin size={14} /> Pontos de Interesse
              </h4>
              <div className="grid gap-3">
                {loreData.landmarks.map((landmark, i) => (
                  <div key={i} className="bg-surface p-3 border border-border flex items-start gap-3">
                    <MapPin size={16} className="text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-body text-sm text-text-primary">{landmark.name}</p>
                      <p className="text-xs text-text-secondary">{landmark.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Controlling Faction */}
          {loreData.controllingFactions && (
            <div className="text-center pt-4 border-t border-border">
              <p className="text-xs text-text-secondary">Controlado por</p>
              <p className="font-heading text-gold text-lg">{loreData.controllingFactions}</p>
            </div>
          )}
        </div>
      ) : (
        <EmptyState
          icon={Info}
          title="Sem informação"
          description="Não foi possível carregar a lore deste bairro."
        />
      )}
    </Modal>
  );
};

// ============================================================================
// COMPONENTE: Quick Navigation
// ============================================================================

const QuickNavigation = ({ neighborhoods, onNavigate }) => {
  const hotspots = useMemo(() => {
    // Find interesting neighborhoods
    const lowHeat = neighborhoods.filter(n => n.heat_level < 30).slice(0, 2);
    const highMissions = [...neighborhoods].sort((a, b) => (b.available_missions || 0) - (a.available_missions || 0)).slice(0, 2);
    const events = neighborhoods.filter(n => n.active_events?.length > 0).slice(0, 2);

    return { lowHeat, highMissions, events };
  }, [neighborhoods]);

  return (
    <Card title="Navegação Rápida" icon={Compass} collapsible>
      <div className="space-y-4">
        {/* Low Heat */}
        {hotspots.lowHeat.length > 0 && (
          <div>
            <p className="text-xs text-success uppercase mb-2 flex items-center gap-1">
              <Shield size={12} /> Zonas Seguras
            </p>
            <div className="flex flex-wrap gap-2">
              {hotspots.lowHeat.map(n => (
                <Button
                  key={n.id}
                  variant="ghost"
                  size="sm"
                  onClick={() => onNavigate(n.id)}
                >
                  {n.name}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* High Missions */}
        {hotspots.highMissions.length > 0 && (
          <div>
            <p className="text-xs text-primary uppercase mb-2 flex items-center gap-1">
              <Target size={12} /> Mais Missões
            </p>
            <div className="flex flex-wrap gap-2">
              {hotspots.highMissions.map(n => (
                <Button
                  key={n.id}
                  variant="ghost"
                  size="sm"
                  onClick={() => onNavigate(n.id)}
                >
                  {n.name} ({n.available_missions || 0})
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Events */}
        {hotspots.events.length > 0 && (
          <div>
            <p className="text-xs text-warning uppercase mb-2 flex items-center gap-1">
              <Radio size={12} /> Com Eventos
            </p>
            <div className="flex flex-wrap gap-2">
              {hotspots.events.map(n => (
                <Button
                  key={n.id}
                  variant="ghost"
                  size="sm"
                  onClick={() => onNavigate(n.id)}
                >
                  {n.name}
                </Button>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function MapPage() {
  const { neighborhoods } = useGame();
  const { api } = useAuth();
  const navigate = useNavigate();
  
  // State
  const [viewMode, setViewMode] = useState('grid');
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLore, setSelectedLore] = useState(null);
  const [selectedNeighborhood, setSelectedNeighborhood] = useState(null);
  const [favorites, setFavorites] = useState(() => {
    const saved = localStorage.getItem('favoriteNeighborhoods');
    return saved ? JSON.parse(saved) : [];
  });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9;

  // Save favorites to localStorage
  useEffect(() => {
    localStorage.setItem('favoriteNeighborhoods', JSON.stringify(favorites));
  }, [favorites]);

  // Filter and sort neighborhoods
  const filteredNeighborhoods = useMemo(() => {
    let result = [...neighborhoods];
    
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(n => 
        n.name.toLowerCase().includes(query) ||
        n.id.toLowerCase().includes(query) ||
        n.description?.toLowerCase().includes(query)
      );
    }
    
    // Category filter
    switch (filter) {
      case 'missions':
        result = result.filter(n => (n.available_missions || 0) > 0);
        break;
      case 'events':
        result = result.filter(n => n.active_events?.length > 0);
        break;
      case 'gangs':
        result = result.filter(n => n.controlling_gang);
        break;
      default:
        break;
    }
    
    // Sort
    switch (sortBy) {
      case 'heat_low':
        result.sort((a, b) => a.heat_level - b.heat_level);
        break;
      case 'heat_high':
        result.sort((a, b) => b.heat_level - a.heat_level);
        break;
      case 'value_high':
        result.sort((a, b) => b.economic_value - a.economic_value);
        break;
      case 'value_low':
        result.sort((a, b) => a.economic_value - b.economic_value);
        break;
      case 'missions':
        result.sort((a, b) => (b.available_missions || 0) - (a.available_missions || 0));
        break;
      default:
        result.sort((a, b) => a.name.localeCompare(b.name));
    }
    
    // Put favorites first
    result.sort((a, b) => {
      const aFav = favorites.includes(a.id) ? -1 : 0;
      const bFav = favorites.includes(b.id) ? -1 : 0;
      return aFav - bFav;
    });
    
    return result;
  }, [neighborhoods, searchQuery, filter, sortBy, favorites]);

  // Pagination
  const paginatedNeighborhoods = useMemo(() => {
    if (viewMode === 'map') return filteredNeighborhoods;
    const start = (currentPage - 1) * itemsPerPage;
    return filteredNeighborhoods.slice(start, start + itemsPerPage);
  }, [filteredNeighborhoods, currentPage, viewMode]);

  const totalPages = Math.ceil(filteredNeighborhoods.length / itemsPerPage);

  // Handlers
  const toggleFavorite = useCallback((id) => {
    setFavorites(prev => 
      prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
    );
  }, []);

  const handleNavigateToMissions = useCallback((neighborhoodId) => {
    navigate(`/missoes?bairro=${neighborhoodId}`);
  }, [navigate]);

  return (
    <div className="space-y-6 animate-fade-in" data-testid="map-page">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-heading text-2xl md:text-3xl text-text-primary flex items-center gap-3">
            <Map className="text-primary" size={28} />
            Mapa da Cidade
          </h1>
          <p className="text-text-secondary text-sm mt-1">
            {filteredNeighborhoods.length} bairros • Explora e encontra oportunidades
          </p>
        </div>
        
        {/* View Mode Toggle */}
        <div className="flex items-center gap-2">
          {VIEW_MODES.map(mode => (
            <Tooltip key={mode.id} content={mode.label}>
              <button
                className={clsx(
                  'p-2 border transition-colors',
                  viewMode === mode.id 
                    ? 'bg-primary border-primary text-white' 
                    : 'border-border text-text-secondary hover:text-text-primary'
                )}
                onClick={() => setViewMode(mode.id)}
              >
                <mode.icon size={18} />
              </button>
            </Tooltip>
          ))}
        </div>
      </div>

      {/* City Overview Stats */}
      <CityOverviewStats neighborhoods={neighborhoods} />

      {/* Filters Row */}
      <div className="flex flex-col md:flex-row md:items-center gap-4">
        {/* Category Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {MAP_FILTERS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              className={clsx(
                'px-4 py-2 font-ui text-sm uppercase tracking-wider transition-all whitespace-nowrap flex items-center gap-2',
                filter === id 
                  ? 'bg-primary text-white' 
                  : 'bg-surface border border-border text-text-secondary hover:text-text-primary'
              )}
              onClick={() => { setFilter(id); setCurrentPage(1); }}
            >
              <Icon size={14} />
              {label}
            </button>
          ))}
        </div>
        
        {/* Search and Sort */}
        <div className="flex-1 flex items-center gap-3">
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Pesquisar bairros..."
            className="flex-1 max-w-xs"
          />
          <Select
            options={SORT_OPTIONS}
            value={sortBy}
            onChange={setSortBy}
            placeholder="Ordenar por..."
            className="w-48"
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Area */}
        <div className="lg:col-span-3 space-y-6">
          {/* Map View */}
          {viewMode === 'map' && (
            <VisualMapView
              neighborhoods={filteredNeighborhoods}
              selectedId={selectedNeighborhood}
              onSelect={setSelectedNeighborhood}
            />
          )}

          {/* Grid View */}
          {viewMode === 'grid' && (
            <>
              {paginatedNeighborhoods.length === 0 ? (
                <EmptyState
                  icon={Map}
                  title="Nenhum bairro encontrado"
                  description="Tenta ajustar os filtros ou pesquisar por outro termo."
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {paginatedNeighborhoods.map((neighborhood, i) => (
                    <FadeIn key={neighborhood.id} delay={i * 50}>
                      <NeighborhoodCardGrid
                        neighborhood={neighborhood}
                        onSelect={setSelectedNeighborhood}
                        onViewLore={setSelectedLore}
                        onViewMissions={handleNavigateToMissions}
                        isFavorite={favorites.includes(neighborhood.id)}
                        onToggleFavorite={toggleFavorite}
                      />
                    </FadeIn>
                  ))}
                </div>
              )}
              
              {totalPages > 1 && (
                <div className="flex justify-center mt-6">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                  />
                </div>
              )}
            </>
          )}

          {/* List View */}
          {viewMode === 'list' && (
            <>
              {paginatedNeighborhoods.length === 0 ? (
                <EmptyState
                  icon={Map}
                  title="Nenhum bairro encontrado"
                  description="Tenta ajustar os filtros ou pesquisar por outro termo."
                />
              ) : (
                <div className="space-y-3">
                  {paginatedNeighborhoods.map((neighborhood, i) => (
                    <FadeIn key={neighborhood.id} delay={i * 30}>
                      <NeighborhoodCardList
                        neighborhood={neighborhood}
                        onSelect={setSelectedNeighborhood}
                        onViewLore={setSelectedLore}
                        onViewMissions={handleNavigateToMissions}
                      />
                    </FadeIn>
                  ))}
                </div>
              )}
              
              {totalPages > 1 && (
                <div className="flex justify-center mt-6">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                  />
                </div>
              )}
            </>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Navigation */}
          <QuickNavigation
            neighborhoods={neighborhoods}
            onNavigate={handleNavigateToMissions}
          />

          {/* Heat Distribution */}
          <HeatDistributionChart neighborhoods={neighborhoods} />

          {/* Territory Control */}
          <TerritoryControlOverview neighborhoods={neighborhoods} />

          {/* Favorites */}
          {favorites.length > 0 && (
            <Card title="Favoritos" icon={Heart}>
              <div className="space-y-2">
                {neighborhoods
                  .filter(n => favorites.includes(n.id))
                  .map(n => (
                    <button
                      key={n.id}
                      className="w-full p-2 bg-surface-highlight border border-border text-left hover:border-primary/50 transition-colors flex items-center justify-between"
                      onClick={() => handleNavigateToMissions(n.id)}
                    >
                      <span className="text-sm text-text-primary">{n.name}</span>
                      <ChevronRight size={14} className="text-text-secondary" />
                    </button>
                  ))}
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Lore Modal */}
      <NeighborhoodLoreModal
        neighborhoodId={selectedLore}
        isOpen={!!selectedLore}
        onClose={() => setSelectedLore(null)}
      />
    </div>
  );
}

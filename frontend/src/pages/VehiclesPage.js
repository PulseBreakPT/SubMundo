import { useState, useEffect, useMemo, useCallback } from 'react';
import { useGame } from '../contexts/GameContext';
import { useAuth } from '../contexts/AuthContext';
import { Card, ProgressBar, StatCard, CircularProgress, MiniSparkline, ComparisonBar, SkillBar } from '../components/ProgressBar';
import { Button, Badge, Modal, Tabs, Select, SearchInput, Tooltip, FadeIn, SlideIn, Alert, Skeleton, Toggle, RadioGroup, Dropdown, EmptyState, FilterBar, Pagination, Slider, ConfirmDialog } from '../components/UI';
import { VehicleSystem, EconomySystem, formatTimeRemaining } from '../utils/gameLogic';
import { 
  Car, Bike, Truck, Zap, Eye, Package, 
  Wrench, DollarSign, Check, ShoppingCart, Trash2,
  Star, AlertTriangle, Shield, Clock, TrendingUp, TrendingDown,
  Filter, Search, SortAsc, SortDesc, ChevronRight, ChevronDown, ChevronUp,
  Settings, Info, Lock, Unlock, Award, Crown, Sparkles,
  ArrowUp, ArrowDown, Target, Flame, Activity, RefreshCw,
  Heart, Bookmark, Share2, MoreVertical, Play, Pause,
  Gauge, Fuel, Navigation, Compass, BarChart2, PieChart,
  Grid3X3, List, CheckCircle, XCircle, Edit2, Plus, Minus
} from 'lucide-react';
import clsx from 'clsx';

// ============================================================================
// CONSTANTES
// ============================================================================

const VEHICLE_ICONS = {
  'bicicleta': Bike,
  'scooter': Bike,
  'mota_desportiva': Bike,
  'carro_usado': Car,
  'sedan_luxo': Car,
  'desportivo': Car,
  'suv_blindado': Truck,
  'carrinha_carga': Truck,
};

const CATEGORY_COLORS = {
  'basic': { color: 'default', label: 'Básico', icon: Bike },
  'standard': { color: 'primary', label: 'Standard', icon: Car },
  'sport': { color: 'warning', label: 'Desportivo', icon: Zap },
  'luxury': { color: 'gold', label: 'Luxo', icon: Crown },
  'armored': { color: 'error', label: 'Blindado', icon: Shield },
  'utility': { color: 'success', label: 'Utilitário', icon: Truck },
  'exotic': { color: 'purple', label: 'Exótico', icon: Sparkles },
};

const SORT_OPTIONS = [
  { value: 'name', label: 'Nome' },
  { value: 'price_low', label: 'Menor Preço' },
  { value: 'price_high', label: 'Maior Preço' },
  { value: 'speed_high', label: 'Mais Rápido' },
  { value: 'stealth_high', label: 'Mais Furtivo' },
  { value: 'capacity_high', label: 'Maior Capacidade' },
  { value: 'condition', label: 'Melhor Condição' }
];

const FILTER_CATEGORIES = [
  { value: 'all', label: 'Todos' },
  { value: 'basic', label: 'Básico' },
  { value: 'standard', label: 'Standard' },
  { value: 'sport', label: 'Desportivo' },
  { value: 'luxury', label: 'Luxo' },
  { value: 'armored', label: 'Blindado' },
  { value: 'utility', label: 'Utilitário' },
  { value: 'exotic', label: 'Exótico' }
];

const formatMoney = (value) => {
  if (value >= 1000000) return `€${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `€${(value / 1000).toFixed(1)}K`;
  return `€${value?.toLocaleString() || 0}`;
};

// ============================================================================
// COMPONENTE: Vehicle Stats Overview
// ============================================================================

const VehicleStatsOverview = ({ vehicles, activeVehicle }) => {
  const stats = useMemo(() => {
    const totalValue = vehicles.reduce((sum, v) => sum + (v.price || 0), 0);
    const avgCondition = vehicles.length > 0
      ? Math.round(vehicles.reduce((sum, v) => sum + v.condition, 0) / vehicles.length)
      : 0;
    const needsRepair = vehicles.filter(v => v.condition < 50).length;

    return [
      { label: 'Total', value: vehicles.length, icon: Car, color: 'primary' },
      { label: 'Valor Total', value: formatMoney(totalValue), icon: DollarSign, color: 'success' },
      { label: 'Cond. Média', value: `${avgCondition}%`, icon: Gauge, color: avgCondition > 70 ? 'success' : avgCondition > 40 ? 'warning' : 'error' },
      { label: 'Reparar', value: needsRepair, icon: Wrench, color: needsRepair > 0 ? 'error' : 'success' }
    ];
  }, [vehicles]);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {stats.map((stat, i) => (
        <FadeIn key={stat.label} delay={i * 50}>
          <div className="bg-surface border border-border p-3 flex items-center gap-3">
            <div className={`w-10 h-10 flex items-center justify-center bg-${stat.color}/10 border border-${stat.color}/30`}>
              <stat.icon size={18} className={`text-${stat.color}`} />
            </div>
            <div>
              <p className={`text-lg font-body font-bold text-${stat.color}`}>{stat.value}</p>
              <p className="text-[10px] text-text-secondary uppercase">{stat.label}</p>
            </div>
          </div>
        </FadeIn>
      ))}
    </div>
  );
};

// ============================================================================
// COMPONENTE: Active Vehicle Banner
// ============================================================================

const ActiveVehicleBanner = ({ vehicle, onDeactivate }) => {
  if (!vehicle) return null;

  const Icon = VEHICLE_ICONS[vehicle.vehicle_id] || Car;
  const effectiveStats = VehicleSystem.calculateEffectiveStats(vehicle);
  const categoryInfo = CATEGORY_COLORS[vehicle.category] || CATEGORY_COLORS.standard;

  return (
    <FadeIn>
      <Card className="border-primary" accentColor="primary">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2">
            <Badge variant="primary" size="sm">
              <Check size={12} className="mr-1" /> ATIVO
            </Badge>
            <Badge variant={categoryInfo.color} size="sm">
              {categoryInfo.label}
            </Badge>
          </div>
          <Dropdown
            trigger={
              <button className="p-1 hover:bg-surface-highlight transition-colors">
                <MoreVertical size={18} className="text-text-secondary" />
              </button>
            }
            items={[
              { label: 'Ver Detalhes', icon: Info, onClick: () => {} },
              { label: 'Comparar', icon: BarChart2, onClick: () => {} },
              { divider: true },
              { label: 'Desativar', icon: XCircle, onClick: onDeactivate, danger: true }
            ]}
          />
        </div>

        <div className="flex items-center gap-6">
          <div className="w-20 h-20 bg-primary/10 border-2 border-primary flex items-center justify-center">
            <Icon size={40} className="text-primary" />
          </div>
          
          <div className="flex-1">
            <h3 className="font-heading text-2xl text-text-primary">{vehicle.name}</h3>
            <p className="text-text-secondary text-sm mt-1">{vehicle.description}</p>
            
            {/* Stats Grid */}
            <div className="grid grid-cols-4 gap-4 mt-4">
              <div>
                <div className="flex items-center gap-1 text-secondary">
                  <Zap size={14} />
                  <span className="text-lg font-body">{effectiveStats.effectiveSpeed}</span>
                </div>
                <p className="text-[10px] text-text-secondary">Velocidade</p>
              </div>
              <div>
                <div className="flex items-center gap-1 text-success">
                  <Eye size={14} />
                  <span className="text-lg font-body">{effectiveStats.effectiveStealth}</span>
                </div>
                <p className="text-[10px] text-text-secondary">Furtividade</p>
              </div>
              <div>
                <div className="flex items-center gap-1 text-warning">
                  <Package size={14} />
                  <span className="text-lg font-body">{vehicle.capacity}</span>
                </div>
                <p className="text-[10px] text-text-secondary">Capacidade</p>
              </div>
              <div>
                <div className={clsx(
                  'flex items-center gap-1',
                  vehicle.condition >= 70 ? 'text-success' : vehicle.condition >= 40 ? 'text-warning' : 'text-error'
                )}>
                  <Gauge size={14} />
                  <span className="text-lg font-body">{vehicle.condition}%</span>
                </div>
                <p className="text-[10px] text-text-secondary">Condição</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Condition Progress */}
        <div className="mt-4">
          <ProgressBar
            value={vehicle.condition}
            max={100}
            color={vehicle.condition >= 70 ? 'success' : vehicle.condition >= 40 ? 'warning' : 'error'}
            showLabel={false}
            height="h-2"
            glow={vehicle.condition > 90}
          />
        </div>
        
        {/* Condition Warning */}
        {vehicle.condition < 50 && (
          <Alert variant="warning" className="mt-4">
            <Wrench size={14} className="inline mr-1" />
            Veículo precisa de reparação para melhor desempenho!
          </Alert>
        )}
        
        {/* Effective stats warning */}
        {effectiveStats.conditionPenalty > 0 && (
          <div className="mt-3 text-xs text-text-secondary">
            <AlertTriangle size={12} className="inline mr-1 text-warning" />
            Stats reduzidos em {effectiveStats.conditionPenalty}% devido à condição
          </div>
        )}
      </Card>
    </FadeIn>
  );
};

// ============================================================================
// COMPONENTE: Vehicle Card (Garage)
// ============================================================================

const VehicleCardGarage = ({ vehicle, isActive, onActivate, onRepair, onSell, onCompare, loading }) => {
  const [showDetails, setShowDetails] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const Icon = VEHICLE_ICONS[vehicle.vehicle_id] || Car;
  const categoryInfo = CATEGORY_COLORS[vehicle.category] || CATEGORY_COLORS.standard;
  const effectiveStats = VehicleSystem.calculateEffectiveStats(vehicle);
  const repairCost = VehicleSystem.calculateRepairCost(vehicle);
  const resellValue = VehicleSystem.calculateResellValue(vehicle);

  return (
    <div
      className={clsx(
        'bg-surface border p-4 relative overflow-hidden transition-all',
        isActive ? 'border-primary ring-2 ring-primary/30' : 'border-border hover:border-primary/50'
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Status Badges */}
      <div className="absolute top-2 right-2 flex gap-1">
        {isActive && (
          <Badge variant="primary" size="xs">
            <Check size={10} className="mr-1" /> ATIVO
          </Badge>
        )}
        <Badge variant={categoryInfo.color} size="xs">
          {categoryInfo.label}
        </Badge>
      </div>
      
      {/* Main Content */}
      <div className="flex items-start gap-4 pr-20">
        <div className={clsx(
          'w-16 h-16 flex items-center justify-center border transition-all',
          isActive ? 'bg-primary/20 border-primary' : 'bg-surface-highlight border-border'
        )}>
          <Icon size={32} className={isActive ? 'text-primary' : 'text-text-secondary'} />
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="font-heading text-lg text-text-primary truncate">{vehicle.name}</h3>
          
          {/* Quick Stats */}
          <div className="flex gap-3 mt-2 text-sm">
            <Tooltip content="Velocidade">
              <span className="text-secondary flex items-center gap-1">
                <Zap size={12} /> {effectiveStats.effectiveSpeed}
                {effectiveStats.conditionPenalty > 0 && (
                  <span className="text-[10px] text-error line-through ml-1">{vehicle.speed}</span>
                )}
              </span>
            </Tooltip>
            <Tooltip content="Furtividade">
              <span className="text-success flex items-center gap-1">
                <Eye size={12} /> {effectiveStats.effectiveStealth}
              </span>
            </Tooltip>
            <Tooltip content="Capacidade">
              <span className="text-warning flex items-center gap-1">
                <Package size={12} /> {vehicle.capacity}
              </span>
            </Tooltip>
          </div>
        </div>
      </div>
      
      {/* Condition Bar */}
      <div className="mt-4">
        <ProgressBar
          label="Condição"
          value={vehicle.condition}
          max={100}
          color={vehicle.condition >= 70 ? 'success' : vehicle.condition >= 40 ? 'warning' : 'error'}
          height="h-2"
        />
      </div>
      
      {/* Expandable Details */}
      {showDetails && (
        <FadeIn>
          <div className="mt-4 pt-4 border-t border-border space-y-3">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-text-secondary">Manut./uso:</span>
                <span className="text-text-primary ml-1">€{vehicle.maintenance_cost}</span>
              </div>
              <div>
                <span className="text-text-secondary">Valor revenda:</span>
                <span className="text-success ml-1">{formatMoney(resellValue)}</span>
              </div>
              <div>
                <span className="text-text-secondary">Custo reparo:</span>
                <span className="text-warning ml-1">{formatMoney(repairCost)}</span>
              </div>
              <div>
                <span className="text-text-secondary">Adquirido:</span>
                <span className="text-text-primary ml-1">{new Date(vehicle.purchased_at).toLocaleDateString()}</span>
              </div>
            </div>
            
            {vehicle.total_missions && (
              <div className="bg-surface-highlight p-2 text-sm">
                <span className="text-text-secondary">Missões concluídas:</span>
                <span className="text-primary ml-1">{vehicle.total_missions}</span>
              </div>
            )}
          </div>
        </FadeIn>
      )}
      
      {/* Actions */}
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
        <button
          className="text-xs text-text-secondary hover:text-text-primary flex items-center gap-1"
          onClick={() => setShowDetails(!showDetails)}
        >
          {showDetails ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          {showDetails ? 'Menos' : 'Mais'} detalhes
        </button>
        
        <div className="flex gap-2">
          {!isActive && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => onActivate(vehicle.id)}
              loading={loading}
              icon={Check}
            >
              Ativar
            </Button>
          )}
          {vehicle.condition < 100 && (
            <Tooltip content={`Custo: ${formatMoney(repairCost)}`}>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => onRepair(vehicle.id)}
                loading={loading}
                icon={Wrench}
              >
                Reparar
              </Button>
            </Tooltip>
          )}
          <Dropdown
            trigger={
              <button className="p-1.5 hover:bg-surface-highlight transition-colors border border-border">
                <MoreVertical size={16} className="text-text-secondary" />
              </button>
            }
            items={[
              { label: 'Comparar', icon: BarChart2, onClick: () => onCompare(vehicle) },
              { divider: true },
              { label: 'Vender', icon: Trash2, onClick: () => onSell(vehicle), danger: true }
            ]}
          />
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// COMPONENTE: Vehicle Card (Shop)
// ============================================================================

const VehicleCardShop = ({ vehicle, owned, canAfford, onBuy, onCompare }) => {
  const [showDetails, setShowDetails] = useState(false);

  const Icon = VEHICLE_ICONS[vehicle.id] || Car;
  const categoryInfo = CATEGORY_COLORS[vehicle.category] || CATEGORY_COLORS.standard;

  return (
    <div
      className={clsx(
        'bg-surface border border-border p-4 relative transition-all',
        owned && 'opacity-60',
        !owned && canAfford && 'hover:border-primary/50'
      )}
    >
      {/* Category Badge */}
      <div className="absolute top-2 right-2">
        <Badge variant={categoryInfo.color} size="sm">
          <categoryInfo.icon size={10} className="mr-1" />
          {categoryInfo.label}
        </Badge>
      </div>
      
      {/* Main Content */}
      <div className="flex items-center gap-4 mb-4 pr-16">
        <div className="w-14 h-14 bg-surface-highlight border border-border flex items-center justify-center">
          <Icon size={28} className="text-primary" />
        </div>
        <div>
          <h3 className="font-heading text-lg text-text-primary">{vehicle.name}</h3>
          <p className="text-success text-xl font-body">{formatMoney(vehicle.price)}</p>
        </div>
      </div>
      
      <p className="text-text-secondary text-sm mb-4 line-clamp-2">{vehicle.description}</p>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="bg-surface-highlight p-2 text-center">
          <Zap size={14} className="mx-auto text-secondary mb-1" />
          <p className="text-text-primary font-body">{vehicle.speed}</p>
          <p className="text-text-secondary text-[10px]">Velocidade</p>
        </div>
        <div className="bg-surface-highlight p-2 text-center">
          <Eye size={14} className="mx-auto text-success mb-1" />
          <p className="text-text-primary font-body">{vehicle.stealth}</p>
          <p className="text-text-secondary text-[10px]">Furtividade</p>
        </div>
        <div className="bg-surface-highlight p-2 text-center">
          <Package size={14} className="mx-auto text-warning mb-1" />
          <p className="text-text-primary font-body">{vehicle.capacity}</p>
          <p className="text-text-secondary text-[10px]">Capacidade</p>
        </div>
      </div>
      
      {/* Additional Info */}
      {showDetails && (
        <FadeIn>
          <div className="space-y-2 mb-4 text-sm">
            <div className="flex justify-between">
              <span className="text-text-secondary">Manutenção:</span>
              <span className="text-text-primary">€{vehicle.maintenance_cost}/uso</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary">Nível Mínimo:</span>
              <span className="text-text-primary">{vehicle.level_required || 1}</span>
            </div>
            {vehicle.special_ability && (
              <div className="bg-primary/10 border border-primary/30 p-2">
                <p className="text-xs text-primary">
                  <Sparkles size={12} className="inline mr-1" />
                  {vehicle.special_ability}
                </p>
              </div>
            )}
          </div>
        </FadeIn>
      )}
      
      <button
        className="text-xs text-text-secondary hover:text-text-primary mb-3 flex items-center gap-1"
        onClick={() => setShowDetails(!showDetails)}
      >
        {showDetails ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        {showDetails ? 'Menos' : 'Mais'} info
      </button>
      
      {/* Action Buttons */}
      <div className="flex gap-2">
        {owned ? (
          <Button variant="secondary" fullWidth disabled>
            <Check size={14} className="mr-1" /> Possuído
          </Button>
        ) : (
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onCompare(vehicle)}
              icon={BarChart2}
            />
            <Button
              variant={canAfford ? 'primary' : 'secondary'}
              fullWidth
              disabled={!canAfford}
              onClick={() => onBuy(vehicle)}
              icon={ShoppingCart}
            >
              {canAfford ? 'Comprar' : 'Sem fundos'}
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// COMPONENTE: Vehicle Comparison Modal
// ============================================================================

const VehicleComparisonModal = ({ vehicles, isOpen, onClose }) => {
  if (!vehicles || vehicles.length < 2) return null;

  const [v1, v2] = vehicles;

  const stats = [
    { key: 'speed', label: 'Velocidade', icon: Zap },
    { key: 'stealth', label: 'Furtividade', icon: Eye },
    { key: 'capacity', label: 'Capacidade', icon: Package },
    { key: 'condition', label: 'Condição', icon: Gauge }
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Comparar Veículos" size="lg">
      <div className="space-y-6">
        {/* Headers */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto bg-primary/10 border border-primary/30 flex items-center justify-center">
              <Car size={32} className="text-primary" />
            </div>
            <p className="font-heading text-text-primary mt-2">{v1.name}</p>
          </div>
          <div className="flex items-center justify-center">
            <span className="text-text-secondary text-xl">VS</span>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 mx-auto bg-secondary/10 border border-secondary/30 flex items-center justify-center">
              <Car size={32} className="text-secondary" />
            </div>
            <p className="font-heading text-text-primary mt-2">{v2.name}</p>
          </div>
        </div>
        
        {/* Comparison Bars */}
        <div className="space-y-4">
          {stats.map(stat => (
            <ComparisonBar
              key={stat.key}
              label={stat.label}
              leftValue={v1[stat.key] || 0}
              rightValue={v2[stat.key] || 0}
              leftLabel={v1.name.split(' ')[0]}
              rightLabel={v2.name.split(' ')[0]}
              max={stat.key === 'condition' ? 100 : 10}
            />
          ))}
        </div>
        
        {/* Winner Summary */}
        <div className="bg-surface-highlight border border-border p-4 text-center">
          <p className="text-sm text-text-secondary">Vencedor geral:</p>
          <p className="font-heading text-lg text-gold">
            {(v1.speed + v1.stealth + v1.capacity) > (v2.speed + v2.stealth + v2.capacity) 
              ? v1.name 
              : v2.name}
          </p>
        </div>
      </div>
    </Modal>
  );
};

// ============================================================================
// COMPONENTE: Buy Confirmation Modal
// ============================================================================

const BuyConfirmationModal = ({ vehicle, player, isOpen, onClose, onConfirm, loading }) => {
  if (!vehicle) return null;

  const Icon = VEHICLE_ICONS[vehicle.id] || Car;
  const afterPurchase = (player?.clean_money || 0) - vehicle.price;
  const canAfford = afterPurchase >= 0;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Comprar Veículo" size="md">
      <div className="space-y-4">
        {/* Vehicle Preview */}
        <div className="text-center">
          <div className="w-20 h-20 mx-auto bg-primary/10 border border-primary/30 flex items-center justify-center mb-3">
            <Icon size={40} className="text-primary" />
          </div>
          <h3 className="font-heading text-xl text-text-primary">{vehicle.name}</h3>
          <p className="text-success text-2xl font-body mt-1">{formatMoney(vehicle.price)}</p>
        </div>
        
        <p className="text-text-secondary text-sm text-center">{vehicle.description}</p>
        
        {/* Stats Preview */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-surface-highlight p-2 text-center">
            <p className="text-secondary font-body">{vehicle.speed}</p>
            <p className="text-[10px] text-text-secondary">Velocidade</p>
          </div>
          <div className="bg-surface-highlight p-2 text-center">
            <p className="text-success font-body">{vehicle.stealth}</p>
            <p className="text-[10px] text-text-secondary">Furtividade</p>
          </div>
          <div className="bg-surface-highlight p-2 text-center">
            <p className="text-warning font-body">{vehicle.capacity}</p>
            <p className="text-[10px] text-text-secondary">Capacidade</p>
          </div>
        </div>
        
        {/* Balance Info */}
        <div className="bg-surface-highlight border border-border p-4 space-y-2">
          <div className="flex justify-between">
            <span className="text-text-secondary">Saldo atual:</span>
            <span className="text-success">{formatMoney(player?.clean_money)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-secondary">Custo:</span>
            <span className="text-error">-{formatMoney(vehicle.price)}</span>
          </div>
          <div className="flex justify-between pt-2 border-t border-border">
            <span className="text-text-secondary">Saldo após:</span>
            <span className={afterPurchase >= 0 ? 'text-text-primary' : 'text-error'}>
              {formatMoney(afterPurchase)}
            </span>
          </div>
        </div>
        
        {!canAfford && (
          <Alert variant="error">
            Saldo insuficiente para esta compra!
          </Alert>
        )}
        
        {/* Actions */}
        <div className="flex gap-3">
          <Button variant="secondary" fullWidth onClick={onClose}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            fullWidth
            onClick={onConfirm}
            loading={loading}
            disabled={!canAfford}
            icon={ShoppingCart}
          >
            Confirmar
          </Button>
        </div>
      </div>
    </Modal>
  );
};

// ============================================================================
// COMPONENTE: Sell Confirmation Modal
// ============================================================================

const SellConfirmationModal = ({ vehicle, isOpen, onClose, onConfirm, loading }) => {
  if (!vehicle) return null;

  const resellValue = VehicleSystem.calculateResellValue(vehicle);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Vender Veículo" size="sm">
      <div className="space-y-4">
        <div className="text-center">
          <AlertTriangle size={40} className="mx-auto text-warning mb-2" />
          <p className="text-text-primary">
            Tens a certeza que queres vender <strong>{vehicle.name}</strong>?
          </p>
        </div>
        
        <div className="bg-surface-highlight border border-border p-4 space-y-2">
          <div className="flex justify-between">
            <span className="text-text-secondary">Condição atual:</span>
            <span className={clsx(
              vehicle.condition >= 70 ? 'text-success' : vehicle.condition >= 40 ? 'text-warning' : 'text-error'
            )}>
              {vehicle.condition}%
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-secondary">Valor de revenda:</span>
            <span className="text-success font-body text-lg">{formatMoney(resellValue)}</span>
          </div>
        </div>
        
        <Alert variant="warning">
          O valor de revenda é 50% do preço original, ajustado pela condição.
        </Alert>
        
        <div className="flex gap-3">
          <Button variant="secondary" fullWidth onClick={onClose}>
            Cancelar
          </Button>
          <Button
            variant="danger"
            fullWidth
            onClick={onConfirm}
            loading={loading}
            icon={Trash2}
          >
            Vender
          </Button>
        </div>
      </div>
    </Modal>
  );
};

// ============================================================================
// COMPONENTE: Vehicle Recommendations
// ============================================================================

const VehicleRecommendations = ({ catalog, player, vehicles, onBuy }) => {
  const recommendations = useMemo(() => {
    if (!catalog.length || !player) return [];

    const owned = new Set(vehicles.map(v => v.vehicle_id));
    const affordable = catalog.filter(v => 
      !owned.has(v.id) && v.price <= player.clean_money * 1.5
    );

    // Score based on value for money
    return affordable
      .map(v => ({
        ...v,
        score: (v.speed + v.stealth + v.capacity) / (v.price / 10000)
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);
  }, [catalog, player, vehicles]);

  if (recommendations.length === 0) return null;

  return (
    <Card title="Recomendados" icon={Star} collapsible>
      <div className="space-y-3">
        {recommendations.map((vehicle, i) => {
          const Icon = VEHICLE_ICONS[vehicle.id] || Car;
          const canAfford = player?.clean_money >= vehicle.price;

          return (
            <div 
              key={vehicle.id}
              className="flex items-center gap-3 p-2 bg-surface-highlight border border-border hover:border-primary/50 transition-all cursor-pointer"
              onClick={() => canAfford && onBuy(vehicle)}
            >
              <div className="flex items-center justify-center w-10 h-10 bg-gold/10 border border-gold/30">
                {i === 0 ? (
                  <Crown size={18} className="text-gold" />
                ) : (
                  <Icon size={18} className="text-text-secondary" />
                )}
              </div>
              <div className="flex-1">
                <p className="text-sm text-text-primary font-heading">{vehicle.name}</p>
                <p className="text-xs text-text-secondary">
                  Vel: {vehicle.speed} • Furt: {vehicle.stealth} • Cap: {vehicle.capacity}
                </p>
              </div>
              <div className="text-right">
                <p className={clsx('font-body', canAfford ? 'text-success' : 'text-error')}>
                  {formatMoney(vehicle.price)}
                </p>
                {!canAfford && (
                  <p className="text-[10px] text-error">Sem fundos</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function VehiclesPage() {
  const { user, api } = useAuth();
  const { vehicles, activeVehicle, actionLoading, buyVehicle, activateVehicle, repairVehicle, sellVehicle } = useGame();
  
  // State
  const [catalog, setCatalog] = useState([]);
  const [activeTab, setActiveTab] = useState('garage');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [filterCategory, setFilterCategory] = useState('all');
  const [viewMode, setViewMode] = useState('grid');
  
  // Modal states
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [showSellModal, setShowSellModal] = useState(false);
  const [vehicleToSell, setVehicleToSell] = useState(null);
  const [compareVehicles, setCompareVehicles] = useState([]);
  const [showCompareModal, setShowCompareModal] = useState(false);

  const player = user;

  // Fetch catalog
  useEffect(() => {
    fetchCatalog();
  }, []);

  const fetchCatalog = async () => {
    try {
      const response = await api().get('/vehicles/catalog');
      setCatalog(response.data.vehicles || []);
    } catch (err) {
      console.error('Erro ao buscar catálogo:', err);
    }
  };

  // Filter and sort vehicles
  const filteredGarageVehicles = useMemo(() => {
    let result = [...vehicles];
    
    // Search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(v => v.name.toLowerCase().includes(query));
    }
    
    // Category filter
    if (filterCategory !== 'all') {
      result = result.filter(v => v.category === filterCategory);
    }
    
    // Sort
    switch (sortBy) {
      case 'speed_high': result.sort((a, b) => b.speed - a.speed); break;
      case 'stealth_high': result.sort((a, b) => b.stealth - a.stealth); break;
      case 'capacity_high': result.sort((a, b) => b.capacity - a.capacity); break;
      case 'condition': result.sort((a, b) => b.condition - a.condition); break;
      default: result.sort((a, b) => a.name.localeCompare(b.name));
    }
    
    return result;
  }, [vehicles, searchQuery, filterCategory, sortBy]);

  const filteredCatalog = useMemo(() => {
    let result = [...catalog];
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(v => v.name.toLowerCase().includes(query));
    }
    
    if (filterCategory !== 'all') {
      result = result.filter(v => v.category === filterCategory);
    }
    
    switch (sortBy) {
      case 'price_low': result.sort((a, b) => a.price - b.price); break;
      case 'price_high': result.sort((a, b) => b.price - a.price); break;
      case 'speed_high': result.sort((a, b) => b.speed - a.speed); break;
      case 'stealth_high': result.sort((a, b) => b.stealth - a.stealth); break;
      case 'capacity_high': result.sort((a, b) => b.capacity - a.capacity); break;
      default: result.sort((a, b) => a.name.localeCompare(b.name));
    }
    
    return result;
  }, [catalog, searchQuery, filterCategory, sortBy]);

  // Handlers
  const handleBuy = async () => {
    if (selectedVehicle) {
      await buyVehicle(selectedVehicle.id);
      setShowBuyModal(false);
      setSelectedVehicle(null);
    }
  };

  const handleSell = async () => {
    if (vehicleToSell) {
      await sellVehicle(vehicleToSell.id);
      setShowSellModal(false);
      setVehicleToSell(null);
    }
  };

  const handleCompare = (vehicle) => {
    if (compareVehicles.length < 2) {
      setCompareVehicles([...compareVehicles, vehicle]);
      if (compareVehicles.length === 1) {
        setShowCompareModal(true);
      }
    }
  };

  return (
    <div className="space-y-6 animate-fade-in" data-testid="vehicles-page">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-heading text-2xl md:text-3xl text-text-primary flex items-center gap-3">
            <Car className="text-primary" size={28} />
            Veículos
          </h1>
          <p className="text-text-secondary text-sm mt-1">
            {vehicles.length} veículo(s) na garagem
          </p>
        </div>
      </div>

      {/* Stats Overview */}
      <VehicleStatsOverview vehicles={vehicles} activeVehicle={activeVehicle} />

      {/* Active Vehicle Banner */}
      <ActiveVehicleBanner 
        vehicle={activeVehicle}
        onDeactivate={() => {}}
      />

      {/* Tabs */}
      <div className="flex items-center justify-between border-b border-border">
        <div className="flex gap-2">
          <button
            className={clsx(
              'px-4 py-3 font-ui text-sm uppercase tracking-wider transition-all flex items-center gap-2',
              activeTab === 'garage' ? 'text-primary border-b-2 border-primary' : 'text-text-secondary hover:text-text-primary'
            )}
            onClick={() => setActiveTab('garage')}
          >
            <Car size={16} /> Garagem ({vehicles.length})
          </button>
          <button
            className={clsx(
              'px-4 py-3 font-ui text-sm uppercase tracking-wider transition-all flex items-center gap-2',
              activeTab === 'shop' ? 'text-primary border-b-2 border-primary' : 'text-text-secondary hover:text-text-primary'
            )}
            onClick={() => setActiveTab('shop')}
          >
            <ShoppingCart size={16} /> Loja ({catalog.length})
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row md:items-center gap-4">
        <SearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Pesquisar veículos..."
          className="flex-1 max-w-xs"
        />
        <Select
          options={FILTER_CATEGORIES}
          value={filterCategory}
          onChange={setFilterCategory}
          placeholder="Categoria"
          className="w-40"
        />
        <Select
          options={SORT_OPTIONS}
          value={sortBy}
          onChange={setSortBy}
          placeholder="Ordenar"
          className="w-40"
        />
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-3">
          {/* Garage Tab */}
          {activeTab === 'garage' && (
            <div className="space-y-4">
              {filteredGarageVehicles.length === 0 ? (
                <EmptyState
                  icon={Car}
                  title="Garagem vazia"
                  description="Não tens veículos. Visita a loja para comprar!"
                  action={
                    <Button variant="primary" onClick={() => setActiveTab('shop')}>
                      Ir para Loja
                    </Button>
                  }
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredGarageVehicles.map((vehicle, i) => (
                    <FadeIn key={vehicle.id} delay={i * 50}>
                      <VehicleCardGarage
                        vehicle={vehicle}
                        isActive={vehicle.is_active}
                        onActivate={activateVehicle}
                        onRepair={repairVehicle}
                        onSell={(v) => { setVehicleToSell(v); setShowSellModal(true); }}
                        onCompare={handleCompare}
                        loading={actionLoading}
                      />
                    </FadeIn>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Shop Tab */}
          {activeTab === 'shop' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCatalog.map((vehicle, i) => {
                const owned = vehicles.some(v => v.vehicle_id === vehicle.id);
                const canAfford = player?.clean_money >= vehicle.price;
                
                return (
                  <FadeIn key={vehicle.id} delay={i * 50}>
                    <VehicleCardShop
                      vehicle={vehicle}
                      owned={owned}
                      canAfford={canAfford}
                      onBuy={(v) => { setSelectedVehicle(v); setShowBuyModal(true); }}
                      onCompare={handleCompare}
                    />
                  </FadeIn>
                );
              })}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <VehicleRecommendations
            catalog={catalog}
            player={player}
            vehicles={vehicles}
            onBuy={(v) => { setSelectedVehicle(v); setShowBuyModal(true); }}
          />
        </div>
      </div>

      {/* Modals */}
      <BuyConfirmationModal
        vehicle={selectedVehicle}
        player={player}
        isOpen={showBuyModal}
        onClose={() => setShowBuyModal(false)}
        onConfirm={handleBuy}
        loading={actionLoading}
      />

      <SellConfirmationModal
        vehicle={vehicleToSell}
        isOpen={showSellModal}
        onClose={() => setShowSellModal(false)}
        onConfirm={handleSell}
        loading={actionLoading}
      />

      <VehicleComparisonModal
        vehicles={compareVehicles}
        isOpen={showCompareModal}
        onClose={() => { setShowCompareModal(false); setCompareVehicles([]); }}
      />
    </div>
  );
}

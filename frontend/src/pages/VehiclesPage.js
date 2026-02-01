import { useState, useEffect } from 'react';
import { useGame } from '../contexts/GameContext';
import { useAuth } from '../contexts/AuthContext';
import { Card } from '../components/ProgressBar';
import { Button, Badge, Modal } from '../components/UI';
import { ProgressBar } from '../components/ProgressBar';
import { 
  Car, Bike, Truck, Zap, Eye, Package, 
  Wrench, DollarSign, Check, ShoppingCart, Trash2
} from 'lucide-react';
import clsx from 'clsx';

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

export default function VehiclesPage() {
  const { user, api } = useAuth();
  const { vehicles, activeVehicle, actionLoading, buyVehicle, activateVehicle, repairVehicle, sellVehicle } = useGame();
  
  const [catalog, setCatalog] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [showSellModal, setShowSellModal] = useState(false);
  const [vehicleToSell, setVehicleToSell] = useState(null);
  const [activeTab, setActiveTab] = useState('garage');

  useEffect(() => {
    fetchCatalog();
  }, []);

  const fetchCatalog = async () => {
    try {
      const response = await api().get('/vehicles/catalog');
      setCatalog(response.data.vehicles);
    } catch (err) {
      console.error('Erro ao buscar catálogo:', err);
    }
  };

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

  const getVehicleIcon = (vehicleId) => {
    return VEHICLE_ICONS[vehicleId] || Car;
  };

  const getCategoryColor = (category) => {
    const colors = {
      'basic': 'default',
      'standard': 'primary',
      'sport': 'warning',
      'luxury': 'gold',
      'armored': 'error',
      'utility': 'success',
      'exotic': 'gold',
    };
    return colors[category] || 'default';
  };

  const player = user;

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

      {/* Active Vehicle Banner */}
      {activeVehicle && (
        <Card className="border-primary">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-primary/20 border border-primary flex items-center justify-center">
                {(() => {
                  const Icon = getVehicleIcon(activeVehicle.vehicle_id);
                  return <Icon size={28} className="text-primary" />;
                })()}
              </div>
              <div>
                <p className="text-xs text-primary uppercase tracking-wider">Veículo Ativo</p>
                <h3 className="font-heading text-xl text-text-primary">{activeVehicle.name}</h3>
                <div className="flex gap-4 mt-1 text-sm">
                  <span className="text-secondary"><Zap size={14} className="inline mr-1" />{activeVehicle.speed}</span>
                  <span className="text-success"><Eye size={14} className="inline mr-1" />{activeVehicle.stealth}</span>
                  <span className="text-warning"><Package size={14} className="inline mr-1" />{activeVehicle.capacity}</span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-text-secondary">Condição</p>
              <p className={clsx(
                'text-2xl font-body',
                activeVehicle.condition >= 70 ? 'text-success' : activeVehicle.condition >= 40 ? 'text-warning' : 'text-error'
              )}>
                {activeVehicle.condition}%
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border">
        <button
          className={clsx(
            'px-4 py-3 font-ui text-sm uppercase tracking-wider transition-all',
            activeTab === 'garage' ? 'text-primary border-b-2 border-primary' : 'text-text-secondary hover:text-text-primary'
          )}
          onClick={() => setActiveTab('garage')}
          data-testid="tab-garage"
        >
          Garagem ({vehicles.length})
        </button>
        <button
          className={clsx(
            'px-4 py-3 font-ui text-sm uppercase tracking-wider transition-all',
            activeTab === 'shop' ? 'text-primary border-b-2 border-primary' : 'text-text-secondary hover:text-text-primary'
          )}
          onClick={() => setActiveTab('shop')}
          data-testid="tab-shop"
        >
          Loja
        </button>
      </div>

      {/* Garage Tab */}
      {activeTab === 'garage' && (
        <div className="space-y-4">
          {vehicles.length === 0 ? (
            <Card>
              <div className="text-center py-8">
                <Car size={48} className="mx-auto text-text-secondary mb-4" />
                <p className="text-text-secondary mb-4">Não tens veículos. Visita a loja!</p>
                <Button variant="primary" onClick={() => setActiveTab('shop')}>
                  Ir para Loja
                </Button>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {vehicles.map((vehicle) => {
                const Icon = getVehicleIcon(vehicle.vehicle_id);
                return (
                  <div
                    key={vehicle.id}
                    className={clsx(
                      'bg-surface border p-4 relative',
                      vehicle.is_active ? 'border-primary' : 'border-border'
                    )}
                    data-testid={`vehicle-${vehicle.id}`}
                  >
                    {vehicle.is_active && (
                      <div className="absolute top-2 right-2">
                        <Badge variant="primary">ATIVO</Badge>
                      </div>
                    )}
                    
                    <div className="flex items-start gap-4">
                      <div className="w-16 h-16 bg-surface-highlight border border-border flex items-center justify-center">
                        <Icon size={32} className="text-primary" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-heading text-lg text-text-primary">{vehicle.name}</h3>
                        <div className="grid grid-cols-3 gap-2 mt-2 text-sm">
                          <div>
                            <p className="text-text-secondary text-xs">Velocidade</p>
                            <p className="text-secondary">{vehicle.speed}</p>
                          </div>
                          <div>
                            <p className="text-text-secondary text-xs">Furtividade</p>
                            <p className="text-success">{vehicle.stealth}</p>
                          </div>
                          <div>
                            <p className="text-text-secondary text-xs">Capacidade</p>
                            <p className="text-warning">{vehicle.capacity}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-4">
                      <ProgressBar
                        label="Condição"
                        value={vehicle.condition}
                        max={100}
                        color={vehicle.condition >= 70 ? 'success' : vehicle.condition >= 40 ? 'warning' : 'error'}
                      />
                    </div>
                    
                    <div className="flex gap-2 mt-4">
                      {!vehicle.is_active && (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => activateVehicle(vehicle.id)}
                          loading={actionLoading}
                          icon={Check}
                        >
                          Ativar
                        </Button>
                      )}
                      {vehicle.condition < 100 && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => repairVehicle(vehicle.id)}
                          loading={actionLoading}
                          icon={Wrench}
                        >
                          Reparar
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => { setVehicleToSell(vehicle); setShowSellModal(true); }}
                        icon={Trash2}
                      >
                        Vender
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Shop Tab */}
      {activeTab === 'shop' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {catalog.map((vehicle) => {
            const Icon = getVehicleIcon(vehicle.id);
            const owned = vehicles.some(v => v.vehicle_id === vehicle.id);
            const canAfford = player?.clean_money >= vehicle.price;
            
            return (
              <div
                key={vehicle.id}
                className={clsx(
                  'bg-surface border border-border p-4 relative',
                  owned && 'opacity-60'
                )}
                data-testid={`shop-${vehicle.id}`}
              >
                <div className="absolute top-2 right-2">
                  <Badge variant={getCategoryColor(vehicle.category)}>
                    {vehicle.category.toUpperCase()}
                  </Badge>
                </div>
                
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-14 h-14 bg-surface-highlight border border-border flex items-center justify-center">
                    <Icon size={28} className="text-primary" />
                  </div>
                  <div>
                    <h3 className="font-heading text-lg text-text-primary">{vehicle.name}</h3>
                    <p className="text-success text-lg font-body">€{vehicle.price.toLocaleString()}</p>
                  </div>
                </div>
                
                <p className="text-text-secondary text-sm mb-4">{vehicle.description}</p>
                
                <div className="grid grid-cols-3 gap-2 mb-4 text-sm">
                  <div className="bg-surface-highlight p-2 text-center">
                    <Zap size={14} className="mx-auto text-secondary mb-1" />
                    <p className="text-text-primary">{vehicle.speed}</p>
                    <p className="text-text-secondary text-xs">Veloc.</p>
                  </div>
                  <div className="bg-surface-highlight p-2 text-center">
                    <Eye size={14} className="mx-auto text-success mb-1" />
                    <p className="text-text-primary">{vehicle.stealth}</p>
                    <p className="text-text-secondary text-xs">Furtiv.</p>
                  </div>
                  <div className="bg-surface-highlight p-2 text-center">
                    <Package size={14} className="mx-auto text-warning mb-1" />
                    <p className="text-text-primary">{vehicle.capacity}</p>
                    <p className="text-text-secondary text-xs">Capac.</p>
                  </div>
                </div>
                
                <p className="text-text-secondary text-xs mb-4">
                  Manutenção: €{vehicle.maintenance_cost}/uso
                </p>
                
                {owned ? (
                  <Button variant="secondary" fullWidth disabled>
                    Já tens este veículo
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    fullWidth
                    disabled={!canAfford}
                    onClick={() => { setSelectedVehicle(vehicle); setShowBuyModal(true); }}
                    icon={ShoppingCart}
                  >
                    {canAfford ? 'Comprar' : 'Sem fundos'}
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Buy Modal */}
      <Modal
        isOpen={showBuyModal}
        onClose={() => setShowBuyModal(false)}
        title="Comprar Veículo"
      >
        {selectedVehicle && (
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="font-heading text-xl text-text-primary">{selectedVehicle.name}</h3>
              <p className="text-success text-2xl font-body mt-2">€{selectedVehicle.price.toLocaleString()}</p>
            </div>
            
            <p className="text-text-secondary text-sm text-center">{selectedVehicle.description}</p>
            
            <div className="bg-surface-highlight border border-border p-4">
              <div className="flex justify-between mb-2">
                <span className="text-text-secondary">Teu saldo:</span>
                <span className="text-success">€{player?.clean_money?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Após compra:</span>
                <span className={player?.clean_money - selectedVehicle.price >= 0 ? 'text-text-primary' : 'text-error'}>
                  €{(player?.clean_money - selectedVehicle.price).toLocaleString()}
                </span>
              </div>
            </div>
            
            <div className="flex gap-3">
              <Button variant="secondary" fullWidth onClick={() => setShowBuyModal(false)}>
                Cancelar
              </Button>
              <Button
                variant="primary"
                fullWidth
                onClick={handleBuy}
                loading={actionLoading}
                data-testid="confirm-buy"
              >
                Confirmar Compra
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Sell Modal */}
      <Modal
        isOpen={showSellModal}
        onClose={() => setShowSellModal(false)}
        title="Vender Veículo"
      >
        {vehicleToSell && (
          <div className="space-y-4">
            <p className="text-text-secondary">
              Tens a certeza que queres vender <strong className="text-text-primary">{vehicleToSell.name}</strong>?
            </p>
            
            <div className="bg-warning/10 border border-warning/30 p-3 text-warning text-sm">
              Receberás 50% do valor original baseado na condição atual ({vehicleToSell.condition}%).
            </div>
            
            <div className="flex gap-3">
              <Button variant="secondary" fullWidth onClick={() => setShowSellModal(false)}>
                Cancelar
              </Button>
              <Button
                variant="danger"
                fullWidth
                onClick={handleSell}
                loading={actionLoading}
                data-testid="confirm-sell"
              >
                Vender
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

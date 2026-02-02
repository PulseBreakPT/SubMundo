import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useGame } from '../contexts/GameContext';
import { Building, Factory, Home, Warehouse, Castle, Shield, Plus, DollarSign, Wrench, TrendingUp, Clock, MapPin, ChevronDown, ChevronUp, Trash2 } from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const PropertyIcon = ({ type, size = 24 }) => {
  const icons = {
    apartamento: Home,
    casa: Home,
    armazem: Warehouse,
    fabrica: Factory,
    mansao: Castle,
    bunker: Shield,
  };
  const Icon = icons[type] || Building;
  return <Icon size={size} />;
};

const PropertyCard = ({ property, onMaintain, onSell, loading }) => {
  const [expanded, setExpanded] = useState(false);
  
  return (
    <div className="bg-surface border border-border rounded-lg overflow-hidden hover:border-primary/50 transition-all">
      <div 
        className="p-4 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <PropertyIcon type={property.property_type} size={24} />
            </div>
            <div>
              <h3 className="font-heading text-text-primary">{property.custom_name}</h3>
              <p className="text-sm text-text-secondary flex items-center gap-1">
                <MapPin size={12} /> {property.neighborhood_name}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-lg font-mono text-primary">Capacidade: {property.capacity}</p>
            <p className="text-xs text-text-secondary">Condição: {property.condition}%</p>
          </div>
        </div>
        
        <div className="flex items-center justify-center mt-2 text-text-secondary">
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </div>
      
      {expanded && (
        <div className="border-t border-border p-4 space-y-3">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="p-2 bg-background rounded">
              <span className="text-text-secondary">Capacidade</span>
              <p className="font-mono text-text-primary">{property.capacity}</p>
            </div>
            <div className="p-2 bg-background rounded">
              <span className="text-text-secondary">Manutenção</span>
              <p className="font-mono text-text-primary">€{property.maintenance_cost}/mês</p>
            </div>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={(e) => { e.stopPropagation(); onMaintain(property.id); }}
              disabled={loading || property.condition >= 100}
              className="flex-1 py-2 px-3 bg-warning/20 hover:bg-warning/30 border border-warning/50 rounded text-warning text-sm font-ui flex items-center justify-center gap-1 disabled:opacity-50"
            >
              <Wrench size={14} /> Reparar
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onSell(property.id); }}
              disabled={loading}
              className="py-2 px-3 bg-error/20 hover:bg-error/30 border border-error/50 rounded text-error text-sm font-ui flex items-center justify-center gap-1 disabled:opacity-50"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const BuyPropertyModal = ({ isOpen, onClose, neighborhoods, propertyTypes, onBuy, loading }) => {
  const [selectedNeighborhood, setSelectedNeighborhood] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [customName, setCustomName] = useState('');
  const [availableTypes, setAvailableTypes] = useState([]);
  
  useEffect(() => {
    if (selectedNeighborhood) {
      const filtered = propertyTypes.filter(p => 
        p.allowed_neighborhoods.includes(selectedNeighborhood)
      );
      setAvailableTypes(filtered);
      setSelectedType('');
    }
  }, [selectedNeighborhood, propertyTypes]);
  
  if (!isOpen) return null;
  
  const selectedProp = propertyTypes.find(p => p.id === selectedType);
  const neighborhood = neighborhoods.find(n => n.id === selectedNeighborhood);
  const adjustedPrice = selectedProp && neighborhood 
    ? Math.round(selectedProp.base_price * (1 + neighborhood.economic_value / 100))
    : 0;
  
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-surface border border-border rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-4 border-b border-border">
          <h2 className="font-heading text-xl text-primary">Comprar Propriedade</h2>
        </div>
        
        <div className="p-4 space-y-4">
          <div>
            <label className="block text-sm text-text-secondary mb-1">Bairro</label>
            <select
              value={selectedNeighborhood}
              onChange={(e) => setSelectedNeighborhood(e.target.value)}
              className="w-full bg-background border border-border rounded px-3 py-2 text-text-primary"
            >
              <option value="">Selecionar bairro...</option>
              {neighborhoods.map(n => (
                <option key={n.id} value={n.id}>{n.name}</option>
              ))}
            </select>
          </div>
          
          {selectedNeighborhood && (
            <div>
              <label className="block text-sm text-text-secondary mb-1">Tipo de Propriedade</label>
              {availableTypes.length > 0 ? (
                <div className="space-y-2">
                  {availableTypes.map(prop => (
                    <div
                      key={prop.id}
                      onClick={() => setSelectedType(prop.id)}
                      className={`p-3 border rounded cursor-pointer transition-all ${
                        selectedType === prop.id 
                          ? 'border-primary bg-primary/10' 
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <PropertyIcon type={prop.id} size={20} />
                        <div className="flex-1">
                          <p className="font-heading text-text-primary">{prop.name}</p>
                          <p className="text-xs text-text-secondary">{prop.description}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-mono text-primary">
                            €{Math.round(prop.base_price * (1 + neighborhood.economic_value / 100))}
                          </p>
                          <p className="text-xs text-success">€{prop.income_per_hour}/h</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-text-secondary text-sm p-3 bg-background rounded">
                  Nenhum tipo de propriedade disponível neste bairro.
                </p>
              )}
            </div>
          )}
          
          {selectedType && (
            <div>
              <label className="block text-sm text-text-secondary mb-1">Nome (opcional)</label>
              <input
                type="text"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder={`${selectedProp.name} em ${neighborhood.name}`}
                className="w-full bg-background border border-border rounded px-3 py-2 text-text-primary"
              />
            </div>
          )}
        </div>
        
        <div className="p-4 border-t border-border flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-2 bg-surface-highlight border border-border rounded text-text-secondary hover:text-text-primary transition-all"
          >
            Cancelar
          </button>
          <button
            onClick={() => onBuy(selectedType, selectedNeighborhood, customName)}
            disabled={!selectedType || loading}
            className="flex-1 py-2 bg-primary hover:bg-primary-dark text-background font-ui rounded disabled:opacity-50 transition-all"
          >
            {loading ? 'A comprar...' : `Comprar €${adjustedPrice}`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default function PropertiesPage() {
  const { token } = useAuth();
  const { refreshStats } = useGame();
  const [properties, setProperties] = useState([]);
  const [propertyTypes, setPropertyTypes] = useState([]);
  const [neighborhoods, setNeighborhoods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [notification, setNotification] = useState(null);
  const [activeTab, setActiveTab] = useState('properties');
  
  const fetchData = async () => {
    try {
      const [propsRes, typesRes, neighborhoodsRes] = await Promise.all([
        fetch(`${API_URL}/api/properties/my`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`${API_URL}/api/properties/types`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`${API_URL}/api/neighborhoods`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);
      
      if (propsRes.ok) {
        const data = await propsRes.json();
        setProperties(data.properties || []);
      }
      if (typesRes.ok) {
        const data = await typesRes.json();
        setPropertyTypes(data.property_types || []);
      }
      if (neighborhoodsRes.ok) {
        const data = await neighborhoodsRes.json();
        setNeighborhoods(data || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchData();
  }, [token]);
  
  const showNotif = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };
  
  const handleBuyProperty = async (propertyType, neighborhoodId, customName) => {
    setActionLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/properties/buy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          property_type: propertyType,
          neighborhood_id: neighborhoodId,
          custom_name: customName || null
        })
      });
      
      const data = await res.json();
      if (res.ok) {
        showNotif(data.message);
        setShowBuyModal(false);
        fetchData();
        refreshStats();
      } else {
        showNotif(data.detail || 'Erro ao comprar', 'error');
      }
    } catch (error) {
      showNotif('Erro de conexão', 'error');
    } finally {
      setActionLoading(false);
    }
  };
  
  // Removido - Propriedades não geram rendimento
  // const handleCollect = async (propertyId) => { ... }
  
  const handleMaintain = async (propertyId) => {
    setActionLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/properties/${propertyId}/maintain`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const data = await res.json();
      if (res.ok) {
        showNotif(data.message);
        fetchData();
        refreshStats();
      } else {
        showNotif(data.detail || 'Erro ao fazer manutenção', 'error');
      }
    } catch (error) {
      showNotif('Erro de conexão', 'error');
    } finally {
      setActionLoading(false);
    }
  };
  
  const handleSell = async (propertyId) => {
    if (!window.confirm('Tens a certeza que queres vender esta propriedade?')) return;
    
    setActionLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/properties/${propertyId}/sell`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const data = await res.json();
      if (res.ok) {
        showNotif(data.message);
        fetchData();
        refreshStats();
      } else {
        showNotif(data.detail || 'Erro ao vender', 'error');
      }
    } catch (error) {
      showNotif('Erro de conexão', 'error');
    } finally {
      setActionLoading(false);
    }
  };
  
  // Removed - Properties don't generate income anymore
  // const totalIncome = properties.reduce((sum, p) => sum + p.income_per_hour, 0);
  // const totalPending = properties.reduce((sum, p) => sum + (p.pending_income || 0), 0);
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  
  return (
    <div className="space-y-6 pb-20 md:pb-6">
      {notification && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-2 rounded-lg border ${
          notification.type === 'error' 
            ? 'bg-error/20 border-error/50 text-error' 
            : 'bg-success/20 border-success/50 text-success'
        }`}>
          {notification.message}
        </div>
      )}
      
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl text-primary flex items-center gap-2">
            <Building size={28} /> Propriedades
          </h1>
          <p className="text-text-secondary text-sm">Gere o teu império imobiliário</p>
        </div>
        <button
          onClick={() => setShowBuyModal(true)}
          className="px-4 py-2 bg-primary hover:bg-primary-dark text-background font-ui rounded-lg flex items-center gap-2 transition-all"
        >
          <Plus size={18} /> Comprar
        </button>
      </div>
      
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-surface border border-border rounded-lg p-4">
          <p className="text-text-secondary text-xs uppercase">Propriedades</p>
          <p className="text-2xl font-mono text-primary">{properties.length}</p>
        </div>
        <div className="bg-surface border border-border rounded-lg p-4">
          <p className="text-text-secondary text-xs uppercase">Rendimento/h</p>
          <p className="text-2xl font-mono text-success">€{totalIncome}</p>
        </div>
        <div className="bg-surface border border-border rounded-lg p-4">
          <p className="text-text-secondary text-xs uppercase">Pendente</p>
          <p className="text-2xl font-mono text-warning">€{totalPending.toFixed(2)}</p>
        </div>
        <div className="bg-surface border border-border rounded-lg p-4">
          <p className="text-text-secondary text-xs uppercase">Valor Total</p>
          <p className="text-2xl font-mono text-text-primary">
            €{properties.reduce((sum, p) => sum + p.purchase_price, 0)}
          </p>
        </div>
      </div>
      
      {/* Properties List */}
      {properties.length === 0 ? (
        <div className="bg-surface border border-border rounded-lg p-8 text-center">
          <Building size={48} className="mx-auto text-text-secondary mb-4" />
          <h3 className="font-heading text-lg text-text-primary mb-2">Sem Propriedades</h3>
          <p className="text-text-secondary text-sm mb-4">
            Compra a tua primeira propriedade para armazenamento e status.
          </p>
          <button
            onClick={() => setShowBuyModal(true)}
            className="px-6 py-2 bg-primary hover:bg-primary-dark text-background font-ui rounded-lg transition-all"
          >
            Comprar Propriedade
          </button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {properties.map(property => (
            <PropertyCard
              key={property.id}
              property={property}
              onMaintain={handleMaintain}
              onSell={handleSell}
              loading={actionLoading}
            />
          ))}
        </div>
      )}
      
      <BuyPropertyModal
        isOpen={showBuyModal}
        onClose={() => setShowBuyModal(false)}
        neighborhoods={neighborhoods}
        propertyTypes={propertyTypes}
        onBuy={handleBuyProperty}
        loading={actionLoading}
      />
    </div>
  );
}

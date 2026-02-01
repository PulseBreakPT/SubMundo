import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useGame } from '../contexts/GameContext';
import { Factory, Beaker, Wrench, FileText, Car, Wine, Terminal, Plus, Clock, Package, Play, Check, Trash2, ChevronDown, ChevronUp, MapPin } from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const BusinessIcon = ({ type, size = 24 }) => {
  const icons = {
    laboratorio: Beaker,
    oficina: Wrench,
    falsificador: FileText,
    garage: Car,
    destilaria: Wine,
    centro_hacking: Terminal,
  };
  const Icon = icons[type] || Factory;
  return <Icon size={size} />;
};

const BusinessCard = ({ business, onViewRecipes, onCollect, onSell, loading }) => {
  const [expanded, setExpanded] = useState(false);
  const production = business.active_production;
  
  const formatTime = (seconds) => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  return (
    <div className="bg-surface border border-border rounded-lg overflow-hidden hover:border-primary/50 transition-all">
      <div 
        className="p-4 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <BusinessIcon type={business.business_type} size={24} />
            </div>
            <div>
              <h3 className="font-heading text-text-primary">{business.custom_name}</h3>
              <p className="text-sm text-text-secondary flex items-center gap-1">
                <MapPin size={12} /> {business.neighborhood_name}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-text-secondary">Nível {business.level}</p>
            <p className="text-xs text-text-secondary">Produzido: {business.total_produced}</p>
          </div>
        </div>
        
        {production && (
          <div className={`mt-3 p-3 rounded border ${
            production.status === 'ready' 
              ? 'bg-success/10 border-success/30' 
              : 'bg-warning/10 border-warning/30'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {production.status === 'ready' ? (
                  <Check size={16} className="text-success" />
                ) : (
                  <Clock size={16} className="text-warning animate-pulse" />
                )}
                <span className={production.status === 'ready' ? 'text-success' : 'text-warning'}>
                  {production.recipe_name}
                </span>
              </div>
              {production.status === 'ready' ? (
                <span className="text-success text-sm font-mono">Pronto!</span>
              ) : (
                <span className="text-warning text-sm font-mono">
                  {formatTime(production.remaining_seconds)}
                </span>
              )}
            </div>
            {production.status === 'ready' && (
              <button
                onClick={(e) => { e.stopPropagation(); onCollect(business.id); }}
                disabled={loading}
                className="w-full mt-2 py-2 bg-success/20 hover:bg-success/30 border border-success/50 rounded text-success text-sm font-ui flex items-center justify-center gap-1"
              >
                <Package size={14} /> Coletar {production.total_output}x
              </button>
            )}
          </div>
        )}
        
        <div className="flex items-center justify-center mt-2 text-text-secondary">
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </div>
      
      {expanded && (
        <div className="border-t border-border p-4 space-y-3">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="p-2 bg-background rounded">
              <span className="text-text-secondary">Manutenção</span>
              <p className="font-mono text-text-primary">€{business.maintenance_cost}/mês</p>
            </div>
            <div className="p-2 bg-background rounded">
              <span className="text-text-secondary">Produtos</span>
              <p className="font-mono text-text-primary">{business.products.length} tipos</p>
            </div>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={(e) => { e.stopPropagation(); onViewRecipes(business); }}
              disabled={loading || production}
              className="flex-1 py-2 px-3 bg-primary/20 hover:bg-primary/30 border border-primary/50 rounded text-primary text-sm font-ui flex items-center justify-center gap-1 disabled:opacity-50"
            >
              <Play size={14} /> Produzir
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onSell(business.id); }}
              disabled={loading || production}
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

const RecipesModal = ({ isOpen, onClose, business, recipes, onCraft, loading }) => {
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [quantity, setQuantity] = useState(1);
  
  if (!isOpen || !business) return null;
  
  const selectedData = recipes.find(r => r.id === selectedRecipe);
  const totalCost = selectedData ? selectedData.cost * quantity : 0;
  const totalTime = selectedData ? selectedData.adjusted_time * quantity : 0;
  const totalOutput = selectedData ? selectedData.quantity * quantity : 0;
  
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-surface border border-border rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="p-4 border-b border-border">
          <h2 className="font-heading text-xl text-primary flex items-center gap-2">
            <BusinessIcon type={business.business_type} size={20} />
            {business.custom_name} - Produção
          </h2>
        </div>
        
        <div className="p-4 space-y-4">
          <div>
            <label className="block text-sm text-text-secondary mb-2">Selecionar Receita</label>
            <div className="space-y-2">
              {recipes.map(recipe => (
                <div
                  key={recipe.id}
                  onClick={() => { setSelectedRecipe(recipe.id); setQuantity(1); }}
                  className={`p-3 border rounded cursor-pointer transition-all ${
                    selectedRecipe === recipe.id 
                      ? 'border-primary bg-primary/10' 
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-heading text-text-primary">{recipe.name}</p>
                      <p className="text-xs text-text-secondary">{recipe.description}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-mono text-warning">€{recipe.cost}</p>
                      <p className="text-xs text-text-secondary">
                        <Clock size={10} className="inline" /> {recipe.adjusted_time}min
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-2 text-xs text-text-secondary">
                    <span>Produz: {recipe.quantity}x</span>
                    <span>Venda: €{recipe.sell_value}</span>
                    {recipe.time_reduction > 0 && (
                      <span className="text-success">-{recipe.time_reduction}% tempo</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {selectedRecipe && (
            <div>
              <label className="block text-sm text-text-secondary mb-1">Quantidade</label>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-10 h-10 bg-background border border-border rounded hover:border-primary"
                >
                  -
                </button>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  min="1"
                  className="flex-1 h-10 bg-background border border-border rounded text-center text-text-primary"
                />
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-10 h-10 bg-background border border-border rounded hover:border-primary"
                >
                  +
                </button>
              </div>
              
              <div className="mt-3 p-3 bg-background rounded border border-border">
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-xs text-text-secondary">Custo Total</p>
                    <p className="font-mono text-warning">€{totalCost}</p>
                  </div>
                  <div>
                    <p className="text-xs text-text-secondary">Tempo</p>
                    <p className="font-mono text-text-primary">{totalTime}min</p>
                  </div>
                  <div>
                    <p className="text-xs text-text-secondary">Produção</p>
                    <p className="font-mono text-success">{totalOutput}x</p>
                  </div>
                </div>
              </div>
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
            onClick={() => onCraft(business.id, selectedRecipe, quantity)}
            disabled={!selectedRecipe || loading}
            className="flex-1 py-2 bg-primary hover:bg-primary-dark text-background font-ui rounded disabled:opacity-50 transition-all"
          >
            {loading ? 'A produzir...' : `Iniciar Produção`}
          </button>
        </div>
      </div>
    </div>
  );
};

const BuyBusinessModal = ({ isOpen, onClose, businessTypes, onBuy, loading }) => {
  const [selectedType, setSelectedType] = useState('');
  const [customName, setCustomName] = useState('');
  
  if (!isOpen) return null;
  
  const selectedBiz = businessTypes.find(b => b.id === selectedType);
  
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-surface border border-border rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-4 border-b border-border">
          <h2 className="font-heading text-xl text-primary">Comprar Negócio</h2>
          <p className="text-sm text-text-secondary">Cada negócio só está disponível no seu bairro específico</p>
        </div>
        
        <div className="p-4 space-y-4">
          <div className="space-y-2">
            {businessTypes.map(biz => (
              <div
                key={biz.id}
                onClick={() => setSelectedType(biz.id)}
                className={`p-3 border rounded cursor-pointer transition-all ${
                  selectedType === biz.id 
                    ? 'border-primary bg-primary/10' 
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded bg-primary/10 flex items-center justify-center text-primary">
                    <BusinessIcon type={biz.id} size={20} />
                  </div>
                  <div className="flex-1">
                    <p className="font-heading text-text-primary">{biz.name}</p>
                    <p className="text-xs text-text-secondary flex items-center gap-1">
                      <MapPin size={10} /> {biz.neighborhood_name}
                    </p>
                  </div>
                  <p className="font-mono text-primary">€{biz.price}</p>
                </div>
                <p className="text-xs text-text-secondary mt-2">{biz.description}</p>
              </div>
            ))}
          </div>
          
          {selectedType && (
            <div>
              <label className="block text-sm text-text-secondary mb-1">Nome (opcional)</label>
              <input
                type="text"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder={selectedBiz?.name}
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
            onClick={() => onBuy(selectedType, customName)}
            disabled={!selectedType || loading}
            className="flex-1 py-2 bg-primary hover:bg-primary-dark text-background font-ui rounded disabled:opacity-50 transition-all"
          >
            {loading ? 'A comprar...' : `Comprar €${selectedBiz?.price || 0}`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default function BusinessPage() {
  const { token } = useAuth();
  const { refreshStats } = useGame();
  const [businesses, setBusinesses] = useState([]);
  const [businessTypes, setBusinessTypes] = useState([]);
  const [craftedItems, setCraftedItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [recipesModal, setRecipesModal] = useState({ isOpen: false, business: null, recipes: [] });
  const [notification, setNotification] = useState(null);
  
  const fetchData = async () => {
    try {
      const [bizRes, typesRes, itemsRes] = await Promise.all([
        fetch(`${API_URL}/api/businesses/my`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`${API_URL}/api/businesses/types`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`${API_URL}/api/businesses/crafted-items`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);
      
      if (bizRes.ok) {
        const data = await bizRes.json();
        setBusinesses(data.businesses || []);
      }
      if (typesRes.ok) {
        const data = await typesRes.json();
        setBusinessTypes(data.business_types || []);
      }
      if (itemsRes.ok) {
        const data = await itemsRes.json();
        setCraftedItems(data.items || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, [token]);
  
  const showNotif = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };
  
  const handleBuyBusiness = async (businessType, customName) => {
    setActionLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/businesses/buy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          business_type: businessType,
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
  
  const handleViewRecipes = async (business) => {
    try {
      const res = await fetch(`${API_URL}/api/businesses/recipes/${business.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.ok) {
        const data = await res.json();
        setRecipesModal({ isOpen: true, business, recipes: data.recipes || [] });
      }
    } catch (error) {
      showNotif('Erro ao carregar receitas', 'error');
    }
  };
  
  const handleCraft = async (businessId, recipeId, quantity) => {
    setActionLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/businesses/${businessId}/craft`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ recipe_id: recipeId, quantity })
      });
      
      const data = await res.json();
      if (res.ok) {
        showNotif(data.message);
        setRecipesModal({ isOpen: false, business: null, recipes: [] });
        fetchData();
        refreshStats();
      } else {
        showNotif(data.detail || 'Erro ao iniciar produção', 'error');
      }
    } catch (error) {
      showNotif('Erro de conexão', 'error');
    } finally {
      setActionLoading(false);
    }
  };
  
  const handleCollect = async (businessId) => {
    setActionLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/businesses/${businessId}/collect`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const data = await res.json();
      if (res.ok) {
        showNotif(data.message);
        fetchData();
      } else {
        showNotif(data.detail || 'Erro ao coletar', 'error');
      }
    } catch (error) {
      showNotif('Erro de conexão', 'error');
    } finally {
      setActionLoading(false);
    }
  };
  
  const handleSell = async (businessId) => {
    if (!window.confirm('Tens a certeza que queres vender este negócio?')) return;
    
    setActionLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/businesses/${businessId}/sell`, {
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
            <Factory size={28} /> Negócios
          </h1>
          <p className="text-text-secondary text-sm">Fabrica e vende produtos ilegais</p>
        </div>
        <button
          onClick={() => setShowBuyModal(true)}
          className="px-4 py-2 bg-primary hover:bg-primary-dark text-background font-ui rounded-lg flex items-center gap-2 transition-all"
        >
          <Plus size={18} /> Comprar
        </button>
      </div>
      
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <div className="bg-surface border border-border rounded-lg p-4">
          <p className="text-text-secondary text-xs uppercase">Negócios</p>
          <p className="text-2xl font-mono text-primary">{businesses.length}</p>
        </div>
        <div className="bg-surface border border-border rounded-lg p-4">
          <p className="text-text-secondary text-xs uppercase">Em Produção</p>
          <p className="text-2xl font-mono text-warning">
            {businesses.filter(b => b.active_production && b.active_production.status !== 'ready').length}
          </p>
        </div>
        <div className="bg-surface border border-border rounded-lg p-4">
          <p className="text-text-secondary text-xs uppercase">Itens em Stock</p>
          <p className="text-2xl font-mono text-success">
            {craftedItems.reduce((sum, i) => sum + i.quantity, 0)}
          </p>
        </div>
      </div>
      
      {/* Businesses List */}
      {businesses.length === 0 ? (
        <div className="bg-surface border border-border rounded-lg p-8 text-center">
          <Factory size={48} className="mx-auto text-text-secondary mb-4" />
          <h3 className="font-heading text-lg text-text-primary mb-2">Sem Negócios</h3>
          <p className="text-text-secondary text-sm mb-4">
            Compra um estabelecimento para começar a produzir itens ilegais.
          </p>
          <button
            onClick={() => setShowBuyModal(true)}
            className="px-6 py-2 bg-primary hover:bg-primary-dark text-background font-ui rounded-lg transition-all"
          >
            Comprar Negócio
          </button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {businesses.map(business => (
            <BusinessCard
              key={business.id}
              business={business}
              onViewRecipes={handleViewRecipes}
              onCollect={handleCollect}
              onSell={handleSell}
              loading={actionLoading}
            />
          ))}
        </div>
      )}
      
      {/* Crafted Items */}
      {craftedItems.length > 0 && (
        <div>
          <h2 className="font-heading text-lg text-text-primary mb-3 flex items-center gap-2">
            <Package size={20} /> Stock de Produtos
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {craftedItems.map(item => (
              <div key={item.id} className="bg-surface border border-border rounded-lg p-3">
                <p className="font-heading text-text-primary text-sm">{item.name}</p>
                <p className="text-2xl font-mono text-primary">{item.quantity}x</p>
                <p className="text-xs text-text-secondary">€{item.sell_value_each}/un</p>
              </div>
            ))}
          </div>
        </div>
      )}
      
      <BuyBusinessModal
        isOpen={showBuyModal}
        onClose={() => setShowBuyModal(false)}
        businessTypes={businessTypes.filter(bt => !businesses.find(b => b.business_type === bt.id))}
        onBuy={handleBuyBusiness}
        loading={actionLoading}
      />
      
      <RecipesModal
        isOpen={recipesModal.isOpen}
        onClose={() => setRecipesModal({ isOpen: false, business: null, recipes: [] })}
        business={recipesModal.business}
        recipes={recipesModal.recipes}
        onCraft={handleCraft}
        loading={actionLoading}
      />
    </div>
  );
}

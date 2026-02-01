import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useGame } from '../contexts/GameContext';
import { Store, Plus, ShoppingCart, Package, Tag, Clock, X, Search, Filter, TrendingUp, TrendingDown, Minus, DollarSign, User, BarChart2, AlertCircle } from 'lucide-react';
import { EconomySystem } from '../utils/gameLogic';

const API_URL = process.env.REACT_APP_BACKEND_URL;

// Dynamic Price Card Component
const PriceCard = ({ price }) => {
  const getTrendIcon = () => {
    if (price.trend === 'up') return <TrendingUp size={16} className="text-success" />;
    if (price.trend === 'down') return <TrendingDown size={16} className="text-error" />;
    return <Minus size={16} className="text-text-secondary" />;
  };

  const getTrendColor = () => {
    if (price.trend === 'up') return 'text-success';
    if (price.trend === 'down') return 'text-error';
    return 'text-text-secondary';
  };

  return (
    <div className="bg-surface border border-border rounded-lg p-3 hover:border-primary/50 transition-all">
      <div className="flex items-center justify-between mb-2">
        <span className="text-text-primary font-ui text-sm">{price.category_name}</span>
        {getTrendIcon()}
      </div>
      <div className="flex items-end justify-between">
        <div>
          <span className="text-lg font-mono text-primary">€{price.current_price.toFixed(0)}</span>
          <span className={`text-xs ml-2 ${getTrendColor()}`}>
            {price.price_change_percent > 0 ? '+' : ''}{price.price_change_percent.toFixed(1)}%
          </span>
        </div>
      </div>
      <div className="mt-2 flex justify-between text-xs text-text-secondary">
        <span>Oferta: {price.supply}</span>
        <span>Procura: {price.demand}</span>
      </div>
      {/* Mini supply/demand bar */}
      <div className="mt-1 h-1 bg-background rounded-full overflow-hidden flex">
        <div 
          className="h-full bg-primary" 
          style={{ width: `${(price.supply / (price.supply + price.demand)) * 100}%` }}
        />
        <div 
          className="h-full bg-warning" 
          style={{ width: `${(price.demand / (price.supply + price.demand)) * 100}%` }}
        />
      </div>
    </div>
  );
};

const ListingCard = ({ listing, onBuy, onCancel, loading, isOwn }) => {
  const [quantity, setQuantity] = useState(1);
  
  return (
    <div className="bg-surface border border-border rounded-lg p-4 hover:border-primary/50 transition-all">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-heading text-text-primary">{listing.item_name}</h3>
          <p className="text-xs text-text-secondary flex items-center gap-1">
            <Tag size={10} /> {listing.category}
          </p>
        </div>
        <div className="text-right">
          <p className="text-lg font-mono text-primary">€{listing.price_per_unit}</p>
          <p className="text-xs text-text-secondary">por unidade</p>
        </div>
      </div>
      
      <div className="flex items-center justify-between text-sm text-text-secondary mb-3">
        <span className="flex items-center gap-1">
          <Package size={12} /> {listing.quantity} disponíveis
        </span>
        <span className="flex items-center gap-1">
          <User size={12} /> {listing.seller_name}
        </span>
      </div>
      
      {isOwn ? (
        <button
          onClick={() => onCancel(listing.id)}
          disabled={loading}
          className="w-full py-2 bg-error/20 hover:bg-error/30 border border-error/50 rounded text-error text-sm font-ui flex items-center justify-center gap-1 disabled:opacity-50"
        >
          <X size={14} /> Cancelar Listagem
        </button>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="w-8 h-8 bg-background border border-border rounded hover:border-primary text-text-secondary"
            >
              -
            </button>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(Math.min(listing.quantity, Math.max(1, parseInt(e.target.value) || 1)))}
              min="1"
              max={listing.quantity}
              className="flex-1 h-8 bg-background border border-border rounded text-center text-text-primary text-sm"
            />
            <button
              onClick={() => setQuantity(Math.min(listing.quantity, quantity + 1))}
              className="w-8 h-8 bg-background border border-border rounded hover:border-primary text-text-secondary"
            >
              +
            </button>
          </div>
          <button
            onClick={() => onBuy(listing.id, quantity)}
            disabled={loading}
            className="w-full py-2 bg-primary hover:bg-primary-dark text-background font-ui rounded flex items-center justify-center gap-1 disabled:opacity-50 transition-all"
          >
            <ShoppingCart size={14} /> Comprar €{(listing.price_per_unit * quantity).toFixed(2)}
          </button>
        </div>
      )}
    </div>
  );
};

const CreateListingModal = ({ isOpen, onClose, craftedItems, inventoryItems, onCreate, loading }) => {
  const [itemType, setItemType] = useState('crafted');
  const [selectedItem, setSelectedItem] = useState('');
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState(1);
  
  if (!isOpen) return null;
  
  const items = itemType === 'crafted' ? craftedItems : inventoryItems;
  const selectedData = items.find(i => i.id === selectedItem);
  const maxQuantity = selectedData?.quantity || 1;
  
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-surface border border-border rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-4 border-b border-border">
          <h2 className="font-heading text-xl text-primary">Criar Listagem</h2>
          <p className="text-sm text-text-secondary">Taxa de mercado: 5%</p>
        </div>
        
        <div className="p-4 space-y-4">
          {/* Item Type Selection */}
          <div className="flex gap-2">
            <button
              onClick={() => { setItemType('crafted'); setSelectedItem(''); }}
              className={`flex-1 py-2 rounded border transition-all ${
                itemType === 'crafted'
                  ? 'bg-primary/20 border-primary text-primary'
                  : 'bg-background border-border text-text-secondary'
              }`}
            >
              Fabricados
            </button>
            <button
              onClick={() => { setItemType('inventory'); setSelectedItem(''); }}
              className={`flex-1 py-2 rounded border transition-all ${
                itemType === 'inventory'
                  ? 'bg-primary/20 border-primary text-primary'
                  : 'bg-background border-border text-text-secondary'
              }`}
            >
              Inventário
            </button>
          </div>
          
          {/* Item Selection */}
          <div>
            <label className="block text-sm text-text-secondary mb-1">Item</label>
            {items.length > 0 ? (
              <select
                value={selectedItem}
                onChange={(e) => { setSelectedItem(e.target.value); setQuantity(1); }}
                className="w-full bg-background border border-border rounded px-3 py-2 text-text-primary"
              >
                <option value="">Selecionar item...</option>
                {items.map(item => (
                  <option key={item.id} value={item.id}>
                    {item.name || item.item_data?.name} ({item.quantity}x)
                  </option>
                ))}
              </select>
            ) : (
              <p className="text-text-secondary text-sm p-3 bg-background rounded">
                Sem itens disponíveis nesta categoria.
              </p>
            )}
          </div>
          
          {selectedItem && (
            <>
              <div>
                <label className="block text-sm text-text-secondary mb-1">Preço por unidade (€)</label>
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  min="1"
                  step="0.01"
                  placeholder="0.00"
                  className="w-full bg-background border border-border rounded px-3 py-2 text-text-primary"
                />
              </div>
              
              <div>
                <label className="block text-sm text-text-secondary mb-1">Quantidade (máx: {maxQuantity})</label>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.min(maxQuantity, Math.max(1, parseInt(e.target.value) || 1)))}
                  min="1"
                  max={maxQuantity}
                  className="w-full bg-background border border-border rounded px-3 py-2 text-text-primary"
                />
              </div>
              
              {price && quantity && (
                <div className="p-3 bg-background rounded border border-border">
                  <div className="flex justify-between text-sm">
                    <span className="text-text-secondary">Total</span>
                    <span className="font-mono text-text-primary">€{(parseFloat(price) * quantity).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-text-secondary">Taxa (5%)</span>
                    <span className="font-mono text-error">-€{(parseFloat(price) * quantity * 0.05).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm border-t border-border pt-2 mt-2">
                    <span className="text-text-secondary">Recebes</span>
                    <span className="font-mono text-success">€{(parseFloat(price) * quantity * 0.95).toFixed(2)}</span>
                  </div>
                </div>
              )}
            </>
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
            onClick={() => onCreate(itemType, selectedItem, parseFloat(price), quantity)}
            disabled={!selectedItem || !price || loading}
            className="flex-1 py-2 bg-primary hover:bg-primary-dark text-background font-ui rounded disabled:opacity-50 transition-all"
          >
            {loading ? 'A criar...' : 'Criar Listagem'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default function MarketPage() {
  const { token } = useAuth();
  const { refreshStats } = useGame();
  const [listings, setListings] = useState([]);
  const [myListings, setMyListings] = useState([]);
  const [craftedItems, setCraftedItems] = useState([]);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [marketStats, setMarketStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [notification, setNotification] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('browse');
  
  const fetchData = async () => {
    try {
      const [listingsRes, myListingsRes, craftedRes, inventoryRes, statsRes] = await Promise.all([
        fetch(`${API_URL}/api/market/listings`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`${API_URL}/api/market/my-listings`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`${API_URL}/api/businesses/crafted-items`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`${API_URL}/api/player/inventory`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`${API_URL}/api/market/stats`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);
      
      if (listingsRes.ok) {
        const data = await listingsRes.json();
        setListings(data.listings || []);
      }
      if (myListingsRes.ok) {
        const data = await myListingsRes.json();
        setMyListings(data.listings || []);
      }
      if (craftedRes.ok) {
        const data = await craftedRes.json();
        setCraftedItems(data.items || []);
      }
      if (inventoryRes.ok) {
        const data = await inventoryRes.json();
        setInventoryItems(data.inventory || []);
      }
      if (statsRes.ok) {
        const data = await statsRes.json();
        setMarketStats(data);
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
  
  const handleCreateListing = async (itemType, itemId, price, quantity) => {
    setActionLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/market/list`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          item_type: itemType,
          item_id: itemId,
          price,
          quantity
        })
      });
      
      const data = await res.json();
      if (res.ok) {
        showNotif(data.message);
        setShowCreateModal(false);
        fetchData();
      } else {
        showNotif(data.detail || 'Erro ao criar listagem', 'error');
      }
    } catch (error) {
      showNotif('Erro de conexão', 'error');
    } finally {
      setActionLoading(false);
    }
  };
  
  const handleBuy = async (listingId, quantity) => {
    setActionLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/market/buy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          listing_id: listingId,
          quantity
        })
      });
      
      const data = await res.json();
      if (res.ok) {
        showNotif(data.message);
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
  
  const handleCancel = async (listingId) => {
    if (!window.confirm('Tens a certeza que queres cancelar esta listagem?')) return;
    
    setActionLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/market/${listingId}/cancel`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const data = await res.json();
      if (res.ok) {
        showNotif(data.message);
        fetchData();
      } else {
        showNotif(data.detail || 'Erro ao cancelar', 'error');
      }
    } catch (error) {
      showNotif('Erro de conexão', 'error');
    } finally {
      setActionLoading(false);
    }
  };
  
  const filteredListings = listings.filter(l => 
    !l.is_own && l.item_name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
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
            <Store size={28} /> Mercado Negro
          </h1>
          <p className="text-text-secondary text-sm">Compra e vende com outros jogadores</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-primary hover:bg-primary-dark text-background font-ui rounded-lg flex items-center gap-2 transition-all"
        >
          <Plus size={18} /> Vender
        </button>
      </div>
      
      {/* Stats */}
      {marketStats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-surface border border-border rounded-lg p-4">
            <p className="text-text-secondary text-xs uppercase">Listagens Ativas</p>
            <p className="text-2xl font-mono text-primary">{marketStats.total_active_listings}</p>
          </div>
          <div className="bg-surface border border-border rounded-lg p-4">
            <p className="text-text-secondary text-xs uppercase">Vendas 24h</p>
            <p className="text-2xl font-mono text-success">{marketStats.sales_last_24h}</p>
          </div>
          <div className="bg-surface border border-border rounded-lg p-4">
            <p className="text-text-secondary text-xs uppercase">Volume Total</p>
            <p className="text-2xl font-mono text-warning">€{marketStats.total_volume.toFixed(0)}</p>
          </div>
          <div className="bg-surface border border-border rounded-lg p-4">
            <p className="text-text-secondary text-xs uppercase">Taxa</p>
            <p className="text-2xl font-mono text-error">{marketStats.market_fee}</p>
          </div>
        </div>
      )}
      
      {/* Tabs */}
      <div className="flex gap-2 border-b border-border pb-2">
        <button
          onClick={() => setActiveTab('browse')}
          className={`px-4 py-2 rounded-t font-ui text-sm transition-all ${
            activeTab === 'browse'
              ? 'bg-primary/20 text-primary border-b-2 border-primary'
              : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          Procurar ({filteredListings.length})
        </button>
        <button
          onClick={() => setActiveTab('my')}
          className={`px-4 py-2 rounded-t font-ui text-sm transition-all ${
            activeTab === 'my'
              ? 'bg-primary/20 text-primary border-b-2 border-primary'
              : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          Minhas Listagens ({myListings.filter(l => l.status === 'active').length})
        </button>
      </div>
      
      {activeTab === 'browse' && (
        <>
          {/* Search */}
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Procurar itens..."
              className="w-full bg-surface border border-border rounded-lg pl-10 pr-4 py-2 text-text-primary"
            />
          </div>
          
          {/* Listings Grid */}
          {filteredListings.length === 0 ? (
            <div className="bg-surface border border-border rounded-lg p-8 text-center">
              <Store size={48} className="mx-auto text-text-secondary mb-4" />
              <h3 className="font-heading text-lg text-text-primary mb-2">Mercado Vazio</h3>
              <p className="text-text-secondary text-sm">
                {searchTerm ? 'Nenhum item encontrado com esse nome.' : 'Nenhuma listagem disponível de momento.'}
              </p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredListings.map(listing => (
                <ListingCard
                  key={listing.id}
                  listing={listing}
                  onBuy={handleBuy}
                  onCancel={handleCancel}
                  loading={actionLoading}
                  isOwn={false}
                />
              ))}
            </div>
          )}
        </>
      )}
      
      {activeTab === 'my' && (
        <>
          {myListings.filter(l => l.status === 'active').length === 0 ? (
            <div className="bg-surface border border-border rounded-lg p-8 text-center">
              <Package size={48} className="mx-auto text-text-secondary mb-4" />
              <h3 className="font-heading text-lg text-text-primary mb-2">Sem Listagens</h3>
              <p className="text-text-secondary text-sm mb-4">
                Ainda não tens nada à venda no mercado.
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-6 py-2 bg-primary hover:bg-primary-dark text-background font-ui rounded-lg transition-all"
              >
                Criar Listagem
              </button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {myListings.filter(l => l.status === 'active').map(listing => (
                <ListingCard
                  key={listing.id}
                  listing={{...listing, seller_name: 'Tu'}}
                  onBuy={handleBuy}
                  onCancel={handleCancel}
                  loading={actionLoading}
                  isOwn={true}
                />
              ))}
            </div>
          )}
        </>
      )}
      
      <CreateListingModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        craftedItems={craftedItems}
        inventoryItems={inventoryItems}
        onCreate={handleCreateListing}
        loading={actionLoading}
      />
    </div>
  );
}

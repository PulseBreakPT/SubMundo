import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Card, ProgressBar, StatCard, MiniSparkline } from '../components/ProgressBar';
import { Button, Badge, Modal, Tabs, Select, SearchInput, Tooltip, FadeIn, SlideIn, Alert, Skeleton, Toggle, Pagination, EmptyState, Dropdown, Avatar, CountdownTimer } from '../components/UI';
import { 
  Newspaper, Megaphone, Sparkles, ArrowUpCircle, Building, Factory, Store, Car, Radio, Swords, 
  Calendar, ChevronRight, ChevronDown, ChevronUp, ExternalLink, Search, Filter,
  Clock, Eye, Heart, Share2, Bookmark, MessageSquare, ThumbsUp, ThumbsDown,
  Star, Crown, Target, Users, DollarSign, Flame, Shield, Zap, Gift,
  Bell, BellOff, Settings, RefreshCw, ArrowLeft, ArrowRight, Tag,
  TrendingUp, TrendingDown, Activity, AlertTriangle, Check, X, Info,
  Play, Pause, Volume2, VolumeX, Maximize2, Minimize2, Download,
  Code, Bug, Wrench, Rocket, PartyPopper, Award, Trophy, Medal
} from 'lucide-react';
import clsx from 'clsx';

// ============================================================================
// CONSTANTES
// ============================================================================

const API_URL = process.env.REACT_APP_BACKEND_URL;

const CATEGORY_CONFIG = {
  feature: { label: 'Nova Funcionalidade', color: 'success', bg: 'bg-success/20', icon: Sparkles },
  update: { label: 'Atualização', color: 'warning', bg: 'bg-warning/20', icon: ArrowUpCircle },
  announcement: { label: 'Anúncio', color: 'primary', bg: 'bg-primary/20', icon: Megaphone },
  event: { label: 'Evento', color: 'purple', bg: 'bg-purple-400/20', icon: PartyPopper },
  hotfix: { label: 'Hotfix', color: 'error', bg: 'bg-error/20', icon: Bug },
  maintenance: { label: 'Manutenção', color: 'cyan', bg: 'bg-cyan-400/20', icon: Wrench },
  balance: { label: 'Balanceamento', color: 'gold', bg: 'bg-gold/20', icon: TrendingUp },
  community: { label: 'Comunidade', color: 'secondary', bg: 'bg-secondary/20', icon: Users }
};

const ICON_MAP = {
  building: Building,
  factory: Factory,
  store: Store,
  car: Car,
  radio: Radio,
  swords: Swords,
  megaphone: Megaphone,
  sparkles: Sparkles,
  target: Target,
  users: Users,
  dollar: DollarSign,
  flame: Flame,
  shield: Shield,
  zap: Zap,
  gift: Gift,
  trophy: Trophy,
  rocket: Rocket,
  crown: Crown,
  star: Star
};

const SORT_OPTIONS = [
  { value: 'date_desc', label: 'Mais Recentes' },
  { value: 'date_asc', label: 'Mais Antigos' },
  { value: 'views', label: 'Mais Vistos' },
  { value: 'likes', label: 'Mais Populares' }
];

const FILTER_OPTIONS = [
  { value: 'all', label: 'Todas as Categorias' },
  { value: 'feature', label: 'Funcionalidades' },
  { value: 'update', label: 'Atualizações' },
  { value: 'announcement', label: 'Anúncios' },
  { value: 'event', label: 'Eventos' },
  { value: 'hotfix', label: 'Hotfixes' },
  { value: 'maintenance', label: 'Manutenção' },
  { value: 'balance', label: 'Balanceamento' }
];

// ============================================================================
// COMPONENTE: News Stats Banner
// ============================================================================

const NewsStatsBanner = ({ news, totalViews }) => {
  const stats = useMemo(() => {
    const thisMonth = news.filter(n => {
      const date = new Date(n.date);
      const now = new Date();
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    }).length;
    
    const features = news.filter(n => n.category === 'feature').length;
    const updates = news.filter(n => n.category === 'update').length;
    const events = news.filter(n => n.category === 'event').length;

    return [
      { label: 'Total Notícias', value: news.length, icon: Newspaper, color: 'primary' },
      { label: 'Este Mês', value: thisMonth, icon: Calendar, color: 'success' },
      { label: 'Funcionalidades', value: features, icon: Sparkles, color: 'gold' },
      { label: 'Eventos', value: events, icon: PartyPopper, color: 'purple' }
    ];
  }, [news]);

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
// COMPONENTE: Featured News Banner
// ============================================================================

const FeaturedNewsBanner = ({ news, onSelect }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const featured = news.filter(n => n.is_featured || n.is_new).slice(0, 5);

  useEffect(() => {
    if (featured.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % featured.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [featured.length]);

  if (featured.length === 0) return null;

  const current = featured[currentIndex];
  const Icon = ICON_MAP[current?.icon] || Newspaper;
  const category = CATEGORY_CONFIG[current?.category] || CATEGORY_CONFIG.announcement;

  return (
    <FadeIn>
      <div 
        className={clsx(
          'relative p-6 border cursor-pointer transition-all hover:shadow-lg',
          category.bg,
          `border-${category.color}/50`
        )}
        onClick={() => onSelect(current)}
      >
        {/* Navigation arrows */}
        {featured.length > 1 && (
          <>
            <button
              className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-background/50 hover:bg-background transition-colors"
              onClick={(e) => { e.stopPropagation(); setCurrentIndex(prev => prev === 0 ? featured.length - 1 : prev - 1); }}
            >
              <ArrowLeft size={18} />
            </button>
            <button
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-background/50 hover:bg-background transition-colors"
              onClick={(e) => { e.stopPropagation(); setCurrentIndex(prev => (prev + 1) % featured.length); }}
            >
              <ArrowRight size={18} />
            </button>
          </>
        )}
        
        <div className="flex items-start gap-4 max-w-3xl mx-auto">
          <div className={`w-16 h-16 flex items-center justify-center bg-background/50 border border-${category.color}/30`}>
            <Icon size={32} className={`text-${category.color}`} />
          </div>
          
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              {current.is_new && (
                <Badge variant="primary" pulse>NOVO</Badge>
              )}
              <Badge variant={category.color}>
                <category.icon size={12} className="mr-1" />
                {category.label}
              </Badge>
            </div>
            
            <h2 className="font-heading text-2xl text-text-primary mb-2">{current.title}</h2>
            <p className="text-text-secondary line-clamp-2">{current.summary}</p>
            
            <div className="flex items-center gap-4 mt-4">
              <span className="text-xs text-text-secondary flex items-center gap-1">
                <Calendar size={12} />
                {new Date(current.date).toLocaleDateString('pt-PT', { day: 'numeric', month: 'long', year: 'numeric' })}
              </span>
              <span className="text-xs text-text-secondary flex items-center gap-1">
                <Eye size={12} />
                {current.views || 0} visualizações
              </span>
              <span className={`text-xs text-${category.color}`}>v{current.version}</span>
            </div>
          </div>
        </div>
        
        {/* Dots indicator */}
        {featured.length > 1 && (
          <div className="flex justify-center gap-2 mt-4">
            {featured.map((_, i) => (
              <button
                key={i}
                className={clsx(
                  'w-2 h-2 rounded-full transition-all',
                  i === currentIndex ? `bg-${category.color} w-4` : 'bg-border'
                )}
                onClick={(e) => { e.stopPropagation(); setCurrentIndex(i); }}
              />
            ))}
          </div>
        )}
      </div>
    </FadeIn>
  );
};

// ============================================================================
// COMPONENTE: News Card (Grid)
// ============================================================================

const NewsCardGrid = ({ news, onSelect, isSelected, onLike, onBookmark, isBookmarked }) => {
  const [isHovered, setIsHovered] = useState(false);
  const Icon = ICON_MAP[news.icon] || Newspaper;
  const category = CATEGORY_CONFIG[news.category] || CATEGORY_CONFIG.announcement;

  return (
    <div
      onClick={() => onSelect(news)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={clsx(
        'bg-surface border p-4 cursor-pointer transition-all relative overflow-hidden',
        isSelected ? `border-${category.color}` : 'border-border hover:border-primary/50'
      )}
    >
      {/* Category indicator */}
      <div className={clsx('absolute top-0 left-0 w-1 h-full', `bg-${category.color}`)} />
      
      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        <div className={clsx(
          'w-12 h-12 flex items-center justify-center transition-all',
          category.bg,
          `text-${category.color}`
        )}>
          <Icon size={24} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            {news.is_new && (
              <Badge variant="primary" size="xs" pulse>NOVO</Badge>
            )}
            <Badge variant={category.color} size="xs">
              {category.label}
            </Badge>
          </div>
          <h3 className="font-heading text-text-primary truncate pr-8">{news.title}</h3>
        </div>
        
        {/* Bookmark button */}
        <button
          className="absolute top-3 right-3 p-1 hover:bg-surface-highlight transition-colors"
          onClick={(e) => { e.stopPropagation(); onBookmark?.(news.id); }}
        >
          <Bookmark 
            size={16} 
            className={isBookmarked ? 'text-gold fill-gold' : 'text-text-secondary'} 
          />
        </button>
      </div>
      
      {/* Summary */}
      <p className="text-sm text-text-secondary line-clamp-2 mb-4">{news.summary}</p>
      
      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-text-secondary">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <Calendar size={12} />
            {new Date(news.date).toLocaleDateString('pt-PT')}
          </span>
          <span className="flex items-center gap-1">
            <Eye size={12} />
            {news.views || 0}
          </span>
        </div>
        <span className={`text-${category.color}`}>v{news.version}</span>
      </div>
      
      {/* Hover overlay */}
      {isHovered && (
        <div className="absolute inset-0 bg-primary/5 flex items-center justify-center animate-fade-in">
          <Button variant="primary" size="sm" icon={ChevronRight}>
            Ler mais
          </Button>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// COMPONENTE: News Card (List)
// ============================================================================

const NewsCardList = ({ news, onSelect, onBookmark, isBookmarked }) => {
  const Icon = ICON_MAP[news.icon] || Newspaper;
  const category = CATEGORY_CONFIG[news.category] || CATEGORY_CONFIG.announcement;

  return (
    <div
      onClick={() => onSelect(news)}
      className="bg-surface border border-border p-4 cursor-pointer hover:border-primary/50 transition-all flex items-center gap-4"
    >
      {/* Icon */}
      <div className={clsx(
        'w-12 h-12 flex-shrink-0 flex items-center justify-center',
        category.bg,
        `text-${category.color}`
      )}>
        <Icon size={24} />
      </div>
      
      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          {news.is_new && <Badge variant="primary" size="xs">NOVO</Badge>}
          <Badge variant={category.color} size="xs">{category.label}</Badge>
        </div>
        <h3 className="font-heading text-text-primary truncate">{news.title}</h3>
        <p className="text-sm text-text-secondary truncate">{news.summary}</p>
      </div>
      
      {/* Meta */}
      <div className="hidden md:flex flex-col items-end gap-1 text-xs text-text-secondary">
        <span>{new Date(news.date).toLocaleDateString('pt-PT')}</span>
        <span>{news.views || 0} views</span>
        <span className={`text-${category.color}`}>v{news.version}</span>
      </div>
      
      {/* Actions */}
      <div className="flex items-center gap-2">
        <button
          className="p-2 hover:bg-surface-highlight transition-colors"
          onClick={(e) => { e.stopPropagation(); onBookmark?.(news.id); }}
        >
          <Bookmark size={16} className={isBookmarked ? 'text-gold fill-gold' : 'text-text-secondary'} />
        </button>
        <ChevronRight size={18} className="text-text-secondary" />
      </div>
    </div>
  );
};

// ============================================================================
// COMPONENTE: News Detail Panel
// ============================================================================

const NewsDetailPanel = ({ news, onClose, onLike, onShare, isLiked }) => {
  const [showComments, setShowComments] = useState(false);
  
  if (!news) return null;
  
  const Icon = ICON_MAP[news.icon] || Newspaper;
  const category = CATEGORY_CONFIG[news.category] || CATEGORY_CONFIG.announcement;

  return (
    <div className="bg-surface border border-border overflow-hidden animate-fade-in">
      {/* Header */}
      <div className={clsx('p-6', category.bg)}>
        <div className="flex items-center gap-4">
          <div className={clsx(
            'w-16 h-16 flex items-center justify-center bg-background/50',
            `text-${category.color}`
          )}>
            <Icon size={32} />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              {news.is_new && <Badge variant="primary">NOVO</Badge>}
              <Badge variant={category.color}>
                <category.icon size={12} className="mr-1" />
                {category.label}
              </Badge>
            </div>
            <h2 className="font-heading text-2xl text-text-primary">{news.title}</h2>
            <div className="flex items-center gap-4 mt-2 text-sm text-text-secondary">
              <span className="flex items-center gap-1">
                <Calendar size={14} />
                {new Date(news.date).toLocaleDateString('pt-PT', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </span>
              <span className="flex items-center gap-1">
                <Eye size={14} />
                {news.views || 0} visualizações
              </span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Content */}
      <div className="p-6">
        {/* Summary highlight */}
        {news.summary && (
          <div className="bg-surface-highlight border-l-4 border-primary p-4 mb-6">
            <p className="text-text-primary italic">{news.summary}</p>
          </div>
        )}
        
        {/* Main content */}
        <div className="prose-custom text-text-primary leading-relaxed whitespace-pre-line">
          {news.content?.split('**').map((part, i) => 
            i % 2 === 1 ? <strong key={i} className="text-primary">{part}</strong> : part
          )}
        </div>
        
        {/* Tags */}
        {news.tags?.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-6 pt-6 border-t border-border">
            {news.tags.map((tag, i) => (
              <Badge key={i} variant="default" size="sm">
                <Tag size={10} className="mr-1" />
                {tag}
              </Badge>
            ))}
          </div>
        )}
        
        {/* Changes list */}
        {news.changes?.length > 0 && (
          <div className="mt-6 pt-6 border-t border-border">
            <h4 className="font-heading text-sm text-text-primary mb-3 flex items-center gap-2">
              <ArrowUpCircle size={16} className="text-success" />
              Alterações nesta versão
            </h4>
            <ul className="space-y-2">
              {news.changes.map((change, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-text-secondary">
                  <Check size={14} className="text-success mt-0.5 flex-shrink-0" />
                  {change}
                </li>
              ))}
            </ul>
          </div>
        )}
        
        {/* Bug fixes */}
        {news.fixes?.length > 0 && (
          <div className="mt-6 pt-6 border-t border-border">
            <h4 className="font-heading text-sm text-text-primary mb-3 flex items-center gap-2">
              <Bug size={16} className="text-error" />
              Bugs corrigidos
            </h4>
            <ul className="space-y-2">
              {news.fixes.map((fix, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-text-secondary">
                  <Wrench size={14} className="text-warning mt-0.5 flex-shrink-0" />
                  {fix}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      
      {/* Actions */}
      <div className="px-6 py-4 border-t border-border bg-surface-highlight flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            className={clsx(
              'flex items-center gap-2 px-3 py-1.5 border transition-colors',
              isLiked ? 'border-success bg-success/10 text-success' : 'border-border text-text-secondary hover:text-success'
            )}
            onClick={onLike}
          >
            <ThumbsUp size={16} />
            <span>{news.likes || 0}</span>
          </button>
          
          <button
            className="flex items-center gap-2 px-3 py-1.5 border border-border text-text-secondary hover:text-primary transition-colors"
            onClick={onShare}
          >
            <Share2 size={16} />
            <span>Partilhar</span>
          </button>
        </div>
        
        <div className="flex items-center gap-2">
          <span className={`text-sm text-${category.color}`}>Versão {news.version}</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-surface border border-border text-text-secondary hover:text-text-primary transition-all"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// COMPONENTE: Version Timeline
// ============================================================================

const VersionTimeline = ({ news }) => {
  const versions = useMemo(() => {
    const versionMap = {};
    news.forEach(n => {
      if (!versionMap[n.version]) {
        versionMap[n.version] = {
          version: n.version,
          date: n.date,
          items: []
        };
      }
      versionMap[n.version].items.push(n);
    });
    return Object.values(versionMap).sort((a, b) => 
      b.version.localeCompare(a.version, undefined, { numeric: true })
    ).slice(0, 5);
  }, [news]);

  return (
    <Card title="Timeline de Versões" icon={Clock} collapsible>
      <div className="space-y-4">
        {versions.map((v, i) => (
          <div key={v.version} className="relative pl-6">
            {/* Timeline line */}
            {i < versions.length - 1 && (
              <div className="absolute left-2 top-6 w-0.5 h-full bg-border" />
            )}
            
            {/* Version dot */}
            <div className={clsx(
              'absolute left-0 top-1 w-4 h-4 rounded-full border-2',
              i === 0 ? 'bg-primary border-primary' : 'bg-surface border-border'
            )} />
            
            <div>
              <div className="flex items-center gap-2">
                <span className="font-heading text-text-primary">v{v.version}</span>
                {i === 0 && <Badge variant="primary" size="xs">Atual</Badge>}
              </div>
              <p className="text-xs text-text-secondary">
                {new Date(v.date).toLocaleDateString('pt-PT')}
              </p>
              <p className="text-sm text-text-secondary mt-1">
                {v.items.length} atualização(s)
              </p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};

// ============================================================================
// COMPONENTE: Subscription Panel
// ============================================================================

const SubscriptionPanel = () => {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [preferences, setPreferences] = useState({
    features: true,
    updates: true,
    events: true,
    maintenance: false
  });

  const handleSubscribe = () => {
    // Simular subscrição
    setSubscribed(true);
  };

  if (subscribed) {
    return (
      <Card title="Notificações" icon={Bell}>
        <div className="text-center py-4">
          <Check size={32} className="mx-auto text-success mb-2" />
          <p className="text-success font-heading">Subscrito com sucesso!</p>
          <p className="text-text-secondary text-sm">Receberás notícias no teu email.</p>
        </div>
      </Card>
    );
  }

  return (
    <Card title="Receber Notificações" icon={Bell}>
      <div className="space-y-4">
        <p className="text-text-secondary text-sm">
          Subscreve para receber as novidades diretamente no teu email.
        </p>
        
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="teu@email.com"
          className="w-full bg-background border border-border px-4 py-2 text-text-primary outline-none focus:border-primary"
        />
        
        <div className="space-y-2">
          <p className="text-xs text-text-secondary">Preferências:</p>
          {Object.entries(preferences).map(([key, value]) => (
            <label key={key} className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={value}
                onChange={(e) => setPreferences(prev => ({ ...prev, [key]: e.target.checked }))}
                className="sr-only"
              />
              <div className={clsx(
                'w-4 h-4 border flex items-center justify-center',
                value ? 'bg-primary border-primary' : 'bg-background border-border'
              )}>
                {value && <Check size={12} className="text-white" />}
              </div>
              <span className="text-text-primary capitalize">{key}</span>
            </label>
          ))}
        </div>
        
        <Button 
          variant="primary" 
          fullWidth 
          onClick={handleSubscribe}
          disabled={!email}
          icon={Bell}
        >
          Subscrever
        </Button>
      </div>
    </Card>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function NewsPage() {
  // State
  const [news, setNews] = useState([]);
  const [selectedNews, setSelectedNews] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date_desc');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [bookmarks, setBookmarks] = useState(() => {
    const saved = localStorage.getItem('newsBookmarks');
    return saved ? JSON.parse(saved) : [];
  });
  const [likes, setLikes] = useState(() => {
    const saved = localStorage.getItem('newsLikes');
    return saved ? JSON.parse(saved) : [];
  });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9;

  // Fetch news
  useEffect(() => {
    const fetchNews = async () => {
      try {
        const res = await fetch(`${API_URL}/api/news`);
        if (res.ok) {
          const data = await res.json();
          setNews(data.news || []);
        }
      } catch (error) {
        console.error('Error fetching news:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchNews();
  }, []);

  // Save bookmarks and likes
  useEffect(() => {
    localStorage.setItem('newsBookmarks', JSON.stringify(bookmarks));
  }, [bookmarks]);

  useEffect(() => {
    localStorage.setItem('newsLikes', JSON.stringify(likes));
  }, [likes]);

  // Filter and sort news
  const filteredNews = useMemo(() => {
    let result = [...news];
    
    // Filter by category
    if (filter !== 'all') {
      result = result.filter(n => n.category === filter);
    }
    
    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(n => 
        n.title.toLowerCase().includes(query) ||
        n.summary?.toLowerCase().includes(query) ||
        n.content?.toLowerCase().includes(query)
      );
    }
    
    // Sort
    switch (sortBy) {
      case 'date_asc':
        result.sort((a, b) => new Date(a.date) - new Date(b.date));
        break;
      case 'views':
        result.sort((a, b) => (b.views || 0) - (a.views || 0));
        break;
      case 'likes':
        result.sort((a, b) => (b.likes || 0) - (a.likes || 0));
        break;
      default: // date_desc
        result.sort((a, b) => new Date(b.date) - new Date(a.date));
    }
    
    return result;
  }, [news, filter, searchQuery, sortBy]);

  // Pagination
  const paginatedNews = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredNews.slice(start, start + itemsPerPage);
  }, [filteredNews, currentPage]);

  const totalPages = Math.ceil(filteredNews.length / itemsPerPage);

  // Handlers
  const toggleBookmark = useCallback((id) => {
    setBookmarks(prev => 
      prev.includes(id) ? prev.filter(b => b !== id) : [...prev, id]
    );
  }, []);

  const toggleLike = useCallback((id) => {
    setLikes(prev => 
      prev.includes(id) ? prev.filter(l => l !== id) : [...prev, id]
    );
  }, []);

  const handleShare = useCallback(async () => {
    if (navigator.share && selectedNews) {
      try {
        await navigator.share({
          title: selectedNews.title,
          text: selectedNews.summary,
          url: window.location.href
        });
      } catch (err) {
        console.log('Share cancelled');
      }
    }
  }, [selectedNews]);

  if (loading) {
    return (
      <div className="space-y-6 pb-20">
        <Skeleton variant="title" />
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} variant="card" />)}
        </div>
        <Skeleton variant="card" height={200} />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 md:pb-6" data-testid="news-page">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-heading text-2xl text-primary flex items-center gap-2">
            <Newspaper size={28} /> Novidades
          </h1>
          <p className="text-text-secondary text-sm">Atualizações e anúncios do SUBMUNDO</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Tooltip content="Vista em grelha">
            <button
              className={clsx(
                'p-2 border transition-colors',
                viewMode === 'grid' ? 'bg-primary border-primary text-white' : 'border-border text-text-secondary'
              )}
              onClick={() => setViewMode('grid')}
            >
              <Activity size={18} />
            </button>
          </Tooltip>
          <Tooltip content="Vista em lista">
            <button
              className={clsx(
                'p-2 border transition-colors',
                viewMode === 'list' ? 'bg-primary border-primary text-white' : 'border-border text-text-secondary'
              )}
              onClick={() => setViewMode('list')}
            >
              <ChevronRight size={18} />
            </button>
          </Tooltip>
        </div>
      </div>

      {/* Stats */}
      <NewsStatsBanner news={news} />

      {/* Featured */}
      <FeaturedNewsBanner news={news} onSelect={setSelectedNews} />

      {/* Filters */}
      <div className="flex flex-col md:flex-row md:items-center gap-4">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {FILTER_OPTIONS.slice(0, 5).map(opt => (
            <button
              key={opt.value}
              onClick={() => { setFilter(opt.value); setCurrentPage(1); }}
              className={clsx(
                'px-3 py-1.5 text-sm font-ui whitespace-nowrap transition-all',
                filter === opt.value
                  ? 'bg-primary text-background'
                  : 'bg-surface border border-border text-text-secondary hover:text-text-primary'
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
        
        <div className="flex-1 flex items-center gap-3">
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Pesquisar notícias..."
            className="flex-1 max-w-xs"
          />
          <Select
            options={SORT_OPTIONS}
            value={sortBy}
            onChange={setSortBy}
            className="w-40"
          />
        </div>
      </div>

      {/* Content */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* News List */}
        <div className="lg:col-span-2 space-y-4">
          {filteredNews.length === 0 ? (
            <EmptyState
              icon={Newspaper}
              title="Nenhuma notícia encontrada"
              description="Tenta ajustar os filtros ou pesquisar por outro termo."
            />
          ) : viewMode === 'grid' ? (
            <div className="grid md:grid-cols-2 gap-4">
              {paginatedNews.map((item, i) => (
                <FadeIn key={item.id} delay={i * 50}>
                  <NewsCardGrid
                    news={item}
                    onSelect={setSelectedNews}
                    isSelected={selectedNews?.id === item.id}
                    onBookmark={toggleBookmark}
                    isBookmarked={bookmarks.includes(item.id)}
                  />
                </FadeIn>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {paginatedNews.map((item, i) => (
                <FadeIn key={item.id} delay={i * 30}>
                  <NewsCardList
                    news={item}
                    onSelect={setSelectedNews}
                    onBookmark={toggleBookmark}
                    isBookmarked={bookmarks.includes(item.id)}
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
        </div>
        
        {/* Sidebar */}
        <div className="space-y-6">
          {/* Detail Panel (Desktop) */}
          <div className="hidden lg:block sticky top-4">
            {selectedNews ? (
              <NewsDetailPanel
                news={selectedNews}
                onClose={() => setSelectedNews(null)}
                onLike={() => toggleLike(selectedNews.id)}
                onShare={handleShare}
                isLiked={likes.includes(selectedNews.id)}
              />
            ) : (
              <Card>
                <div className="text-center py-8">
                  <ChevronRight size={48} className="mx-auto text-text-secondary mb-4" />
                  <p className="text-text-secondary">Seleciona uma notícia para ver os detalhes.</p>
                </div>
              </Card>
            )}
          </div>
          
          {/* Version Timeline */}
          <div className="hidden lg:block">
            <VersionTimeline news={news} />
          </div>
          
          {/* Subscription */}
          <div className="hidden lg:block">
            <SubscriptionPanel />
          </div>
          
          {/* Bookmarks */}
          {bookmarks.length > 0 && (
            <Card title="Guardados" icon={Bookmark}>
              <div className="space-y-2">
                {news
                  .filter(n => bookmarks.includes(n.id))
                  .slice(0, 5)
                  .map(n => (
                    <button
                      key={n.id}
                      className="w-full p-2 bg-surface-highlight border border-border text-left hover:border-primary/50 transition-colors"
                      onClick={() => setSelectedNews(n)}
                    >
                      <p className="text-sm text-text-primary truncate">{n.title}</p>
                      <p className="text-xs text-text-secondary">{new Date(n.date).toLocaleDateString('pt-PT')}</p>
                    </button>
                  ))}
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Mobile Detail Modal */}
      {selectedNews && (
        <div className="lg:hidden fixed inset-0 bg-black/80 z-50 flex items-end justify-center">
          <div className="bg-surface w-full max-h-[90vh] overflow-y-auto rounded-t-2xl">
            <NewsDetailPanel
              news={selectedNews}
              onClose={() => setSelectedNews(null)}
              onLike={() => toggleLike(selectedNews.id)}
              onShare={handleShare}
              isLiked={likes.includes(selectedNews.id)}
            />
          </div>
        </div>
      )}
    </div>
  );
}

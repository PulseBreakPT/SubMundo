import { useState, useEffect } from 'react';
import { Newspaper, Megaphone, Sparkles, ArrowUpCircle, Building, Factory, Store, Car, Radio, Swords, Calendar, ChevronRight, ExternalLink } from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const categoryLabels = {
  feature: { label: 'Nova Funcionalidade', color: 'text-success', bg: 'bg-success/20' },
  update: { label: 'Atualização', color: 'text-warning', bg: 'bg-warning/20' },
  announcement: { label: 'Anúncio', color: 'text-primary', bg: 'bg-primary/20' },
  event: { label: 'Evento', color: 'text-purple-400', bg: 'bg-purple-400/20' },
};

const iconMap = {
  building: Building,
  factory: Factory,
  store: Store,
  car: Car,
  radio: Radio,
  swords: Swords,
  megaphone: Megaphone,
  sparkles: Sparkles,
};

const NewsCard = ({ news, onSelect, isSelected }) => {
  const Icon = iconMap[news.icon] || Newspaper;
  const category = categoryLabels[news.category] || categoryLabels.announcement;
  
  return (
    <div
      onClick={() => onSelect(news)}
      className={`bg-surface border rounded-lg p-4 cursor-pointer transition-all hover:border-primary/50 ${
        isSelected ? 'border-primary' : 'border-border'
      }`}
    >
      <div className="flex items-start gap-3">
        <div className={`w-12 h-12 rounded-lg ${category.bg} flex items-center justify-center ${category.color}`}>
          <Icon size={24} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {news.is_new && (
              <span className="px-2 py-0.5 bg-primary text-background text-[10px] font-bold rounded uppercase">
                Novo
              </span>
            )}
            <span className={`px-2 py-0.5 ${category.bg} ${category.color} text-[10px] font-ui rounded uppercase`}>
              {category.label}
            </span>
          </div>
          <h3 className="font-heading text-text-primary truncate">{news.title}</h3>
          <p className="text-sm text-text-secondary line-clamp-2">{news.summary}</p>
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-text-secondary flex items-center gap-1">
              <Calendar size={12} />
              {new Date(news.date).toLocaleDateString('pt-PT')}
            </span>
            <span className="text-xs text-primary">v{news.version}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const NewsDetail = ({ news, onClose }) => {
  if (!news) return null;
  
  const Icon = iconMap[news.icon] || Newspaper;
  const category = categoryLabels[news.category] || categoryLabels.announcement;
  
  return (
    <div className="bg-surface border border-border rounded-lg overflow-hidden">
      <div className={`p-6 ${category.bg}`}>
        <div className="flex items-center gap-4">
          <div className={`w-16 h-16 rounded-lg bg-background/50 flex items-center justify-center ${category.color}`}>
            <Icon size={32} />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              {news.is_new && (
                <span className="px-2 py-0.5 bg-primary text-background text-xs font-bold rounded uppercase">
                  Novo
                </span>
              )}
              <span className={`px-2 py-0.5 bg-background/50 ${category.color} text-xs font-ui rounded uppercase`}>
                {category.label}
              </span>
            </div>
            <h2 className="font-heading text-2xl text-text-primary">{news.title}</h2>
            <p className="text-text-secondary">
              {new Date(news.date).toLocaleDateString('pt-PT', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          </div>
        </div>
      </div>
      
      <div className="p-6">
        <p className="text-text-primary leading-relaxed whitespace-pre-line">
          {news.content}
        </p>
        
        <div className="mt-6 pt-4 border-t border-border flex items-center justify-between">
          <span className="text-sm text-text-secondary">Versão {news.version}</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-surface-highlight border border-border rounded text-text-secondary hover:text-text-primary transition-all"
          >
            Voltar
          </button>
        </div>
      </div>
    </div>
  );
};

export default function NewsPage() {
  const [news, setNews] = useState([]);
  const [selectedNews, setSelectedNews] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  
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
  
  const filteredNews = filter === 'all' 
    ? news 
    : news.filter(n => n.category === filter);
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  
  return (
    <div className="space-y-4 sm:space-y-6 pb-20 md:pb-6">
      <div>
        <h1 className="font-heading text-xl sm:text-2xl text-primary flex items-center gap-2">
          <Newspaper size={24} className="sm:w-7 sm:h-7" /> Novidades
        </h1>
        <p className="text-text-secondary text-xs sm:text-sm">Atualizações e anúncios do SUBMUNDO</p>
      </div>
      
      {/* Filters - horizontal scroll on mobile */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-3 px-3 sm:mx-0 sm:px-0 sm:flex-wrap">
        {[
          { value: 'all', label: 'Todas' },
          { value: 'feature', label: 'Funções' },
          { value: 'update', label: 'Updates' },
          { value: 'announcement', label: 'Anúncios' },
        ].map(f => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-ui transition-all whitespace-nowrap flex-shrink-0 ${
              filter === f.value
                ? 'bg-primary text-background'
                : 'bg-surface border border-border text-text-secondary hover:text-text-primary'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>
      
      {/* Mobile: Modal for details, Desktop: Side panel */}
      {selectedNews && (
        <div className="lg:hidden fixed inset-0 bg-black/80 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-surface w-full sm:max-w-lg sm:rounded-lg max-h-[90vh] overflow-y-auto rounded-t-2xl">
            <NewsDetail news={selectedNews} onClose={() => setSelectedNews(null)} />
          </div>
        </div>
      )}
      
      <div className="grid lg:grid-cols-2 gap-4 sm:gap-6">
        {/* News List */}
        <div className="space-y-3 sm:space-y-4">
          {filteredNews.length === 0 ? (
            <div className="bg-surface border border-border rounded-lg p-6 sm:p-8 text-center">
              <Newspaper size={40} className="mx-auto text-text-secondary mb-4 sm:w-12 sm:h-12" />
              <p className="text-text-secondary text-sm">Nenhuma notícia nesta categoria.</p>
            </div>
          ) : (
            filteredNews.map(item => (
              <NewsCard
                key={item.id}
                news={item}
                onSelect={setSelectedNews}
                isSelected={selectedNews?.id === item.id}
              />
            ))
          )}
        </div>
        
        {/* News Detail - Desktop only */}
        <div className="hidden lg:block lg:sticky lg:top-4 lg:self-start">
          {selectedNews ? (
            <NewsDetail news={selectedNews} onClose={() => setSelectedNews(null)} />
          ) : (
            <div className="bg-surface border border-border rounded-lg p-8 text-center">
              <ChevronRight size={48} className="mx-auto text-text-secondary mb-4" />
              <p className="text-text-secondary">Seleciona uma notícia para ver os detalhes.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

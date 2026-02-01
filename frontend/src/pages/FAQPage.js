import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Card, ProgressBar, StatCard } from '../components/ProgressBar';
import { Button, Badge, Modal, Tabs, Select, SearchInput, Tooltip, FadeIn, SlideIn, Alert, Skeleton, Toggle, Accordion, EmptyState, CopyButton, Pagination } from '../components/UI';
import { 
  HelpCircle, ChevronDown, ChevronUp, ChevronRight, Search, 
  DollarSign, Building, Factory, Store, Users, Target, User, Gamepad2,
  MessageSquare, Send, ThumbsUp, ThumbsDown, Star, Clock,
  AlertTriangle, Check, X, Info, Eye, EyeOff, Filter,
  Bookmark, Heart, Share2, ExternalLink, Mail, Phone, Globe,
  Zap, Shield, Lock, Unlock, Award, Crown, Sparkles,
  Home, Settings, Bell, Calendar, Activity, TrendingUp,
  Car, Map, Swords, Flame, Gift, Trophy, Medal,
  Code, Bug, Wrench, Rocket, FileText, Book, Lightbulb
} from 'lucide-react';
import clsx from 'clsx';

// ============================================================================
// CONSTANTES
// ============================================================================

const API_URL = process.env.REACT_APP_BACKEND_URL;

const CATEGORY_CONFIG = {
  geral: { label: 'Geral', icon: Gamepad2, color: 'primary', description: 'Perguntas gerais sobre o jogo' },
  economia: { label: 'Economia', icon: DollarSign, color: 'success', description: 'Dinheiro, lavar dinheiro e finanças' },
  propriedades: { label: 'Propriedades', icon: Building, color: 'warning', description: 'Compra e gestão de propriedades' },
  negocios: { label: 'Negócios', icon: Factory, color: 'purple', description: 'Criar e gerir negócios' },
  mercado: { label: 'Mercado', icon: Store, color: 'secondary', description: 'Mercado negro e transações' },
  gangues: { label: 'Gangues', icon: Users, color: 'error', description: 'Gangues e territórios' },
  missoes: { label: 'Missões', icon: Target, color: 'gold', description: 'Missões e heists' },
  conta: { label: 'Conta', icon: User, color: 'cyan', description: 'Configurações de conta e perfil' },
  veiculos: { label: 'Veículos', icon: Car, color: 'pink', description: 'Veículos e garagem' },
  tecnico: { label: 'Técnico', icon: Settings, color: 'default', description: 'Problemas técnicos e bugs' }
};

const QUICK_LINKS = [
  { label: 'Como começar?', category: 'geral', icon: Rocket },
  { label: 'Como ganhar dinheiro?', category: 'economia', icon: DollarSign },
  { label: 'Como juntar a uma gangue?', category: 'gangues', icon: Users },
  { label: 'Como lavar dinheiro?', category: 'economia', icon: RefreshCw },
  { label: 'O que são heists?', category: 'missoes', icon: Target }
];

const CONTACT_OPTIONS = [
  { icon: Mail, label: 'Email', value: 'suporte@submundo.game', action: 'mailto:suporte@submundo.game' },
  { icon: MessageSquare, label: 'Discord', value: 'discord.gg/submundo', action: 'https://discord.gg/submundo' },
  { icon: Globe, label: 'Fórum', value: 'forum.submundo.game', action: 'https://forum.submundo.game' }
];

import { RefreshCw } from 'lucide-react';

// ============================================================================
// COMPONENTE: FAQ Stats
// ============================================================================

const FAQStats = ({ faqs, categories }) => {
  const stats = useMemo(() => [
    { label: 'Total Perguntas', value: faqs.length, icon: HelpCircle, color: 'primary' },
    { label: 'Categorias', value: Object.keys(categories).length, icon: Filter, color: 'success' },
    { label: 'Mais Popular', value: 'Economia', icon: TrendingUp, color: 'gold' },
    { label: 'Última Atualização', value: 'Hoje', icon: Calendar, color: 'secondary' }
  ], [faqs, categories]);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {stats.map((stat, i) => (
        <FadeIn key={stat.label} delay={i * 50}>
          <div className="bg-surface border border-border p-3 text-center">
            <stat.icon size={18} className={`mx-auto text-${stat.color} mb-1`} />
            <p className={`text-lg font-body font-bold text-${stat.color}`}>{stat.value}</p>
            <p className="text-[10px] text-text-secondary uppercase">{stat.label}</p>
          </div>
        </FadeIn>
      ))}
    </div>
  );
};

// ============================================================================
// COMPONENTE: Quick Links Panel
// ============================================================================

const QuickLinksPanel = ({ onSearch }) => (
  <Card title="Perguntas Populares" icon={Star}>
    <div className="space-y-2">
      {QUICK_LINKS.map((link, i) => (
        <button
          key={i}
          className="w-full p-3 bg-surface-highlight border border-border text-left hover:border-primary/50 transition-all flex items-center gap-3"
          onClick={() => onSearch(link.label)}
        >
          <div className={`w-8 h-8 flex items-center justify-center bg-${CATEGORY_CONFIG[link.category].color}/10`}>
            <link.icon size={16} className={`text-${CATEGORY_CONFIG[link.category].color}`} />
          </div>
          <span className="text-text-primary text-sm">{link.label}</span>
          <ChevronRight size={14} className="ml-auto text-text-secondary" />
        </button>
      ))}
    </div>
  </Card>
);

// ============================================================================
// COMPONENTE: Category Card
// ============================================================================

const CategoryCard = ({ category, config, count, onClick, isSelected }) => {
  const Icon = config.icon;
  
  return (
    <button
      onClick={onClick}
      className={clsx(
        'p-4 border transition-all text-left w-full',
        isSelected 
          ? `bg-${config.color}/10 border-${config.color}` 
          : 'bg-surface border-border hover:border-primary/50'
      )}
    >
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 flex items-center justify-center bg-${config.color}/10 border border-${config.color}/30`}>
          <Icon size={20} className={`text-${config.color}`} />
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h3 className="font-heading text-text-primary">{config.label}</h3>
            <Badge variant={config.color} size="xs">{count}</Badge>
          </div>
          <p className="text-xs text-text-secondary mt-1">{config.description}</p>
        </div>
      </div>
    </button>
  );
};

// ============================================================================
// COMPONENTE: FAQ Item (Expandable)
// ============================================================================

const FAQItem = ({ faq, isOpen, onToggle, onLike, onDislike, isLiked, isDisliked }) => {
  const [showFeedback, setShowFeedback] = useState(false);
  const category = CATEGORY_CONFIG[faq.category] || CATEGORY_CONFIG.geral;
  const Icon = category.icon;

  return (
    <div className={clsx(
      'bg-surface border border-border overflow-hidden transition-all',
      isOpen && 'ring-1 ring-primary/30'
    )}>
      <button
        onClick={onToggle}
        className="w-full p-4 flex items-center justify-between text-left hover:bg-surface-highlight transition-all"
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className={`w-8 h-8 flex-shrink-0 flex items-center justify-center bg-${category.color}/10`}>
            <Icon size={16} className={`text-${category.color}`} />
          </div>
          <div className="flex-1 min-w-0">
            <span className="font-heading text-text-primary block truncate pr-4">{faq.question}</span>
            {!isOpen && (
              <span className="text-xs text-text-secondary">Clica para ver a resposta</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={category.color} size="xs" className="hidden sm:flex">
            {category.label}
          </Badge>
          {isOpen ? (
            <ChevronUp size={20} className="text-primary flex-shrink-0" />
          ) : (
            <ChevronDown size={20} className="text-text-secondary flex-shrink-0" />
          )}
        </div>
      </button>
      
      {isOpen && (
        <FadeIn>
          <div className="px-4 pb-4 border-t border-border">
            {/* Answer */}
            <div className="pt-4 pl-11">
              <div className="text-text-secondary leading-relaxed whitespace-pre-line">
                {faq.answer.split('**').map((part, i) => 
                  i % 2 === 1 ? <strong key={i} className="text-text-primary">{part}</strong> : part
                )}
              </div>
              
              {/* Related links */}
              {faq.related_links?.length > 0 && (
                <div className="mt-4 pt-4 border-t border-border">
                  <p className="text-xs text-text-secondary uppercase mb-2">Links relacionados:</p>
                  <div className="flex flex-wrap gap-2">
                    {faq.related_links.map((link, i) => (
                      <Link
                        key={i}
                        to={link.url}
                        className="text-sm text-primary hover:underline flex items-center gap-1"
                      >
                        <ExternalLink size={12} />
                        {link.label}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Tips */}
              {faq.tips?.length > 0 && (
                <div className="mt-4 p-3 bg-gold/10 border border-gold/30">
                  <p className="text-xs text-gold uppercase mb-2 flex items-center gap-1">
                    <Lightbulb size={12} /> Dicas
                  </p>
                  <ul className="space-y-1">
                    {faq.tips.map((tip, i) => (
                      <li key={i} className="text-sm text-text-secondary flex items-start gap-2">
                        <Star size={12} className="text-gold mt-0.5 flex-shrink-0" />
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {/* Feedback */}
              <div className="mt-4 pt-4 border-t border-border">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-text-secondary">Esta resposta foi útil?</p>
                  <div className="flex items-center gap-2">
                    <button
                      className={clsx(
                        'flex items-center gap-1 px-3 py-1 border transition-colors text-sm',
                        isLiked ? 'border-success bg-success/10 text-success' : 'border-border text-text-secondary hover:text-success'
                      )}
                      onClick={() => onLike(faq.id)}
                    >
                      <ThumbsUp size={14} />
                      <span>{faq.helpful || 0}</span>
                    </button>
                    <button
                      className={clsx(
                        'flex items-center gap-1 px-3 py-1 border transition-colors text-sm',
                        isDisliked ? 'border-error bg-error/10 text-error' : 'border-border text-text-secondary hover:text-error'
                      )}
                      onClick={() => onDislike(faq.id)}
                    >
                      <ThumbsDown size={14} />
                    </button>
                    <Tooltip content="Copiar link">
                      <CopyButton text={`${window.location.origin}/faq#${faq.id}`} />
                    </Tooltip>
                  </div>
                </div>
                
                {showFeedback && (
                  <FadeIn>
                    <div className="mt-3 p-3 bg-surface-highlight border border-border">
                      <p className="text-xs text-text-secondary mb-2">Ajuda-nos a melhorar:</p>
                      <textarea
                        className="w-full bg-background border border-border p-2 text-sm text-text-primary resize-none"
                        rows={2}
                        placeholder="O que podemos melhorar nesta resposta?"
                      />
                      <div className="flex justify-end gap-2 mt-2">
                        <Button variant="ghost" size="sm" onClick={() => setShowFeedback(false)}>
                          Cancelar
                        </Button>
                        <Button variant="primary" size="sm" icon={Send}>
                          Enviar
                        </Button>
                      </div>
                    </div>
                  </FadeIn>
                )}
                
                {!showFeedback && isDisliked && (
                  <button
                    className="mt-2 text-xs text-primary hover:underline"
                    onClick={() => setShowFeedback(true)}
                  >
                    Diz-nos como podemos melhorar
                  </button>
                )}
              </div>
            </div>
          </div>
        </FadeIn>
      )}
    </div>
  );
};

// ============================================================================
// COMPONENTE: Contact Panel
// ============================================================================

const ContactPanel = () => (
  <Card title="Não encontraste resposta?" icon={MessageSquare}>
    <p className="text-text-secondary text-sm mb-4">
      A nossa equipa está pronta para ajudar!
    </p>
    
    <div className="space-y-3">
      {CONTACT_OPTIONS.map((option, i) => (
        <a
          key={i}
          href={option.action}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 p-3 bg-surface-highlight border border-border hover:border-primary/50 transition-all"
        >
          <div className="w-10 h-10 flex items-center justify-center bg-primary/10 border border-primary/30">
            <option.icon size={18} className="text-primary" />
          </div>
          <div>
            <p className="text-sm font-heading text-text-primary">{option.label}</p>
            <p className="text-xs text-text-secondary">{option.value}</p>
          </div>
          <ExternalLink size={14} className="ml-auto text-text-secondary" />
        </a>
      ))}
    </div>
    
    <div className="mt-4 pt-4 border-t border-border">
      <p className="text-xs text-text-secondary text-center">
        Tempo médio de resposta: <span className="text-primary">24 horas</span>
      </p>
    </div>
  </Card>
);

// ============================================================================
// COMPONENTE: Submit Question Form
// ============================================================================

const SubmitQuestionForm = ({ categories }) => {
  const [formData, setFormData] = useState({
    question: '',
    category: 'geral',
    email: ''
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    // Simular envio
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
    setFormData({ question: '', category: 'geral', email: '' });
  };

  return (
    <Card title="Submeter Pergunta" icon={Send}>
      {submitted ? (
        <div className="text-center py-4">
          <Check size={32} className="mx-auto text-success mb-2" />
          <p className="text-success font-heading">Pergunta enviada!</p>
          <p className="text-text-secondary text-sm">Responderemos em breve.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs text-text-secondary uppercase mb-2">A tua pergunta</label>
            <textarea
              value={formData.question}
              onChange={(e) => setFormData(prev => ({ ...prev, question: e.target.value }))}
              className="w-full bg-background border border-border p-3 text-text-primary resize-none"
              rows={3}
              placeholder="Escreve a tua pergunta aqui..."
              required
            />
          </div>
          
          <div>
            <label className="block text-xs text-text-secondary uppercase mb-2">Categoria</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
              className="w-full bg-background border border-border p-3 text-text-primary"
            >
              {Object.entries(CATEGORY_CONFIG).map(([key, config]) => (
                <option key={key} value={key}>{config.label}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-xs text-text-secondary uppercase mb-2">Email (opcional)</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              className="w-full bg-background border border-border p-3 text-text-primary"
              placeholder="Para receber a resposta"
            />
          </div>
          
          <Button type="submit" variant="primary" fullWidth icon={Send}>
            Enviar Pergunta
          </Button>
        </form>
      )}
    </Card>
  );
};

// ============================================================================
// COMPONENTE: Search Results Summary
// ============================================================================

const SearchResultsSummary = ({ query, count, onClear }) => {
  if (!query) return null;

  return (
    <div className="flex items-center justify-between p-3 bg-primary/10 border border-primary/30">
      <div className="flex items-center gap-2">
        <Search size={16} className="text-primary" />
        <span className="text-text-primary">
          {count} resultado(s) para "<span className="text-primary">{query}</span>"
        </span>
      </div>
      <button
        onClick={onClear}
        className="flex items-center gap-1 text-text-secondary hover:text-text-primary text-sm"
      >
        <X size={14} />
        Limpar
      </button>
    </div>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function FAQPage() {
  // State
  const [faqs, setFaqs] = useState([]);
  const [faqsByCategory, setFaqsByCategory] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [openItems, setOpenItems] = useState({});
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'categories'
  const [likes, setLikes] = useState(() => {
    const saved = localStorage.getItem('faqLikes');
    return saved ? JSON.parse(saved) : [];
  });
  const [dislikes, setDislikes] = useState(() => {
    const saved = localStorage.getItem('faqDislikes');
    return saved ? JSON.parse(saved) : [];
  });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Fetch FAQs
  useEffect(() => {
    const fetchFAQ = async () => {
      try {
        const res = await fetch(`${API_URL}/api/faq`);
        if (res.ok) {
          const data = await res.json();
          setFaqs(data.faqs || []);
          setFaqsByCategory(data.by_category || {});
        }
      } catch (error) {
        console.error('Error fetching FAQ:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchFAQ();
  }, []);

  // Save likes/dislikes
  useEffect(() => {
    localStorage.setItem('faqLikes', JSON.stringify(likes));
  }, [likes]);

  useEffect(() => {
    localStorage.setItem('faqDislikes', JSON.stringify(dislikes));
  }, [dislikes]);

  // Filter FAQs
  const filteredFaqs = useMemo(() => {
    let result = [...faqs];
    
    // Filter by search
    if (searchTerm) {
      const query = searchTerm.toLowerCase();
      result = result.filter(faq => 
        faq.question.toLowerCase().includes(query) ||
        faq.answer.toLowerCase().includes(query)
      );
    }
    
    // Filter by category
    if (activeCategory !== 'all') {
      result = result.filter(faq => faq.category === activeCategory);
    }
    
    return result;
  }, [faqs, searchTerm, activeCategory]);

  // Group by category
  const groupedFaqs = useMemo(() => {
    return filteredFaqs.reduce((acc, faq) => {
      if (!acc[faq.category]) acc[faq.category] = [];
      acc[faq.category].push(faq);
      return acc;
    }, {});
  }, [filteredFaqs]);

  // Pagination
  const paginatedFaqs = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredFaqs.slice(start, start + itemsPerPage);
  }, [filteredFaqs, currentPage]);

  const totalPages = Math.ceil(filteredFaqs.length / itemsPerPage);

  // Handlers
  const toggleItem = useCallback((id) => {
    setOpenItems(prev => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const handleLike = useCallback((id) => {
    setLikes(prev => prev.includes(id) ? prev.filter(l => l !== id) : [...prev, id]);
    setDislikes(prev => prev.filter(d => d !== id));
  }, []);

  const handleDislike = useCallback((id) => {
    setDislikes(prev => prev.includes(id) ? prev.filter(d => d !== id) : [...prev, id]);
    setLikes(prev => prev.filter(l => l !== id));
  }, []);

  const handleSearch = useCallback((query) => {
    setSearchTerm(query);
    setActiveCategory('all');
    setCurrentPage(1);
  }, []);

  const handleCategorySelect = useCallback((category) => {
    setActiveCategory(category);
    setSearchTerm('');
    setCurrentPage(1);
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 pb-20">
        <Skeleton variant="title" />
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} variant="card" />)}
        </div>
        <Skeleton variant="card" height={300} />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 md:pb-6" data-testid="faq-page">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-heading text-2xl text-primary flex items-center gap-2">
            <HelpCircle size={28} /> Perguntas Frequentes
          </h1>
          <p className="text-text-secondary text-sm">Encontra respostas às dúvidas mais comuns</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Tooltip content="Vista por lista">
            <button
              className={clsx(
                'p-2 border transition-colors',
                viewMode === 'list' ? 'bg-primary border-primary text-white' : 'border-border text-text-secondary'
              )}
              onClick={() => setViewMode('list')}
            >
              <Activity size={18} />
            </button>
          </Tooltip>
          <Tooltip content="Vista por categorias">
            <button
              className={clsx(
                'p-2 border transition-colors',
                viewMode === 'categories' ? 'bg-primary border-primary text-white' : 'border-border text-text-secondary'
              )}
              onClick={() => setViewMode('categories')}
            >
              <Filter size={18} />
            </button>
          </Tooltip>
        </div>
      </div>

      {/* Stats */}
      <FAQStats faqs={faqs} categories={faqsByCategory} />

      {/* Search */}
      <div className="relative">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Procurar pergunta..."
          className="w-full bg-surface border border-border pl-12 pr-4 py-4 text-text-primary text-lg focus:border-primary outline-none transition-colors"
        />
        {searchTerm && (
          <button
            className="absolute right-4 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary"
            onClick={() => setSearchTerm('')}
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Search Results Summary */}
      <SearchResultsSummary 
        query={searchTerm} 
        count={filteredFaqs.length} 
        onClear={() => setSearchTerm('')} 
      />

      {/* Category Tabs */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => handleCategorySelect('all')}
          className={clsx(
            'px-4 py-2 text-sm font-ui transition-all',
            activeCategory === 'all'
              ? 'bg-primary text-background'
              : 'bg-surface border border-border text-text-secondary hover:text-text-primary'
          )}
        >
          Todas ({faqs.length})
        </button>
        {Object.entries(CATEGORY_CONFIG).map(([key, config]) => {
          const count = faqsByCategory[key]?.length || 0;
          if (count === 0) return null;
          
          const Icon = config.icon;
          return (
            <button
              key={key}
              onClick={() => handleCategorySelect(key)}
              className={clsx(
                'px-4 py-2 text-sm font-ui transition-all flex items-center gap-2',
                activeCategory === key
                  ? `bg-${config.color} text-background`
                  : 'bg-surface border border-border text-text-secondary hover:text-text-primary'
              )}
            >
              <Icon size={14} />
              {config.label} ({count})
            </button>
          );
        })}
      </div>

      {/* Main Content */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* FAQ List */}
        <div className="lg:col-span-2 space-y-4">
          {filteredFaqs.length === 0 ? (
            <EmptyState
              icon={HelpCircle}
              title="Nenhuma pergunta encontrada"
              description="Tenta pesquisar por outros termos ou selecionar outra categoria."
              action={
                <Button variant="primary" onClick={() => { setSearchTerm(''); setActiveCategory('all'); }}>
                  Ver todas as perguntas
                </Button>
              }
            />
          ) : viewMode === 'categories' && searchTerm === '' ? (
            // Show grouped by category
            <div className="space-y-8">
              {Object.entries(groupedFaqs).map(([category, categoryFaqs]) => {
                const config = CATEGORY_CONFIG[category] || CATEGORY_CONFIG.geral;
                const Icon = config.icon;
                
                return (
                  <div key={category}>
                    <div className="flex items-center gap-3 mb-4 pb-2 border-b border-border">
                      <div className={`w-10 h-10 flex items-center justify-center bg-${config.color}/10 border border-${config.color}/30`}>
                        <Icon size={20} className={`text-${config.color}`} />
                      </div>
                      <div>
                        <h2 className={`font-heading text-lg text-${config.color}`}>{config.label}</h2>
                        <p className="text-xs text-text-secondary">{config.description}</p>
                      </div>
                      <Badge variant={config.color} className="ml-auto">{categoryFaqs.length}</Badge>
                    </div>
                    <div className="space-y-3">
                      {categoryFaqs.map(faq => (
                        <FAQItem
                          key={faq.id}
                          faq={faq}
                          isOpen={openItems[faq.id]}
                          onToggle={() => toggleItem(faq.id)}
                          onLike={handleLike}
                          onDislike={handleDislike}
                          isLiked={likes.includes(faq.id)}
                          isDisliked={dislikes.includes(faq.id)}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            // Show flat list with pagination
            <>
              <div className="space-y-3">
                {paginatedFaqs.map((faq, i) => (
                  <FadeIn key={faq.id} delay={i * 30}>
                    <FAQItem
                      faq={faq}
                      isOpen={openItems[faq.id]}
                      onToggle={() => toggleItem(faq.id)}
                      onLike={handleLike}
                      onDislike={handleDislike}
                      isLiked={likes.includes(faq.id)}
                      isDisliked={dislikes.includes(faq.id)}
                    />
                  </FadeIn>
                ))}
              </div>
              
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
          {/* Quick Links */}
          <QuickLinksPanel onSearch={handleSearch} />
          
          {/* Contact */}
          <ContactPanel />
          
          {/* Submit Question */}
          <SubmitQuestionForm categories={CATEGORY_CONFIG} />
          
          {/* Category Cards (Categories view) */}
          {viewMode === 'categories' && (
            <Card title="Categorias" icon={Filter}>
              <div className="space-y-2">
                {Object.entries(CATEGORY_CONFIG).map(([key, config]) => {
                  const count = faqsByCategory[key]?.length || 0;
                  if (count === 0) return null;
                  return (
                    <CategoryCard
                      key={key}
                      category={key}
                      config={config}
                      count={count}
                      onClick={() => handleCategorySelect(key)}
                      isSelected={activeCategory === key}
                    />
                  );
                })}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

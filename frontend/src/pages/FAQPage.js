import { useState, useEffect } from 'react';
import { HelpCircle, ChevronDown, ChevronUp, Search, DollarSign, Building, Factory, Store, Users, Target, User, Gamepad2 } from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const categoryConfig = {
  geral: { label: 'Geral', icon: Gamepad2, color: 'text-primary' },
  economia: { label: 'Economia', icon: DollarSign, color: 'text-success' },
  propriedades: { label: 'Propriedades', icon: Building, color: 'text-warning' },
  negocios: { label: 'Negócios', icon: Factory, color: 'text-purple-400' },
  mercado: { label: 'Mercado', icon: Store, color: 'text-blue-400' },
  gangues: { label: 'Gangues', icon: Users, color: 'text-red-400' },
  missoes: { label: 'Missões', icon: Target, color: 'text-orange-400' },
  conta: { label: 'Conta', icon: User, color: 'text-cyan-400' },
};

const FAQItem = ({ faq, isOpen, onToggle }) => {
  return (
    <div className="bg-surface border border-border rounded-lg overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full p-4 flex items-center justify-between text-left hover:bg-surface-highlight transition-all"
      >
        <span className="font-heading text-text-primary pr-4">{faq.question}</span>
        {isOpen ? (
          <ChevronUp size={20} className="text-primary flex-shrink-0" />
        ) : (
          <ChevronDown size={20} className="text-text-secondary flex-shrink-0" />
        )}
      </button>
      
      {isOpen && (
        <div className="px-4 pb-4 border-t border-border">
          <p className="text-text-secondary pt-4 leading-relaxed">{faq.answer}</p>
        </div>
      )}
    </div>
  );
};

export default function FAQPage() {
  const [faqs, setFaqs] = useState([]);
  const [faqsByCategory, setFaqsByCategory] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [openItems, setOpenItems] = useState({});
  
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
  
  const toggleItem = (id) => {
    setOpenItems(prev => ({ ...prev, [id]: !prev[id] }));
  };
  
  const filteredFaqs = faqs.filter(faq => {
    const matchesSearch = searchTerm === '' || 
      faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = activeCategory === 'all' || faq.category === activeCategory;
    
    return matchesSearch && matchesCategory;
  });
  
  // Group filtered FAQs by category
  const groupedFaqs = filteredFaqs.reduce((acc, faq) => {
    if (!acc[faq.category]) acc[faq.category] = [];
    acc[faq.category].push(faq);
    return acc;
  }, {});
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  
  return (
    <div className="space-y-6 pb-20 md:pb-6">
      <div>
        <h1 className="font-heading text-2xl text-primary flex items-center gap-2">
          <HelpCircle size={28} /> Perguntas Frequentes
        </h1>
        <p className="text-text-secondary text-sm">Encontra respostas às dúvidas mais comuns</p>
      </div>
      
      {/* Search */}
      <div className="relative">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Procurar pergunta..."
          className="w-full bg-surface border border-border rounded-lg pl-10 pr-4 py-3 text-text-primary"
        />
      </div>
      
      {/* Category Tabs */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setActiveCategory('all')}
          className={`px-3 py-1.5 rounded-lg text-sm font-ui transition-all ${
            activeCategory === 'all'
              ? 'bg-primary text-background'
              : 'bg-surface border border-border text-text-secondary hover:text-text-primary'
          }`}
        >
          Todas ({faqs.length})
        </button>
        {Object.entries(categoryConfig).map(([key, config]) => {
          const count = faqsByCategory[key]?.length || 0;
          if (count === 0) return null;
          
          const Icon = config.icon;
          return (
            <button
              key={key}
              onClick={() => setActiveCategory(key)}
              className={`px-3 py-1.5 rounded-lg text-sm font-ui transition-all flex items-center gap-1 ${
                activeCategory === key
                  ? 'bg-primary text-background'
                  : 'bg-surface border border-border text-text-secondary hover:text-text-primary'
              }`}
            >
              <Icon size={14} />
              {config.label} ({count})
            </button>
          );
        })}
      </div>
      
      {/* FAQs */}
      {filteredFaqs.length === 0 ? (
        <div className="bg-surface border border-border rounded-lg p-8 text-center">
          <HelpCircle size={48} className="mx-auto text-text-secondary mb-4" />
          <p className="text-text-secondary">Nenhuma pergunta encontrada.</p>
        </div>
      ) : activeCategory === 'all' && searchTerm === '' ? (
        // Show grouped by category
        <div className="space-y-8">
          {Object.entries(groupedFaqs).map(([category, categoryFaqs]) => {
            const config = categoryConfig[category] || { label: category, icon: HelpCircle, color: 'text-primary' };
            const Icon = config.icon;
            
            return (
              <div key={category}>
                <h2 className={`font-heading text-lg ${config.color} flex items-center gap-2 mb-4`}>
                  <Icon size={20} /> {config.label}
                </h2>
                <div className="space-y-3">
                  {categoryFaqs.map(faq => (
                    <FAQItem
                      key={faq.id}
                      faq={faq}
                      isOpen={openItems[faq.id]}
                      onToggle={() => toggleItem(faq.id)}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        // Show flat list
        <div className="space-y-3">
          {filteredFaqs.map(faq => (
            <FAQItem
              key={faq.id}
              faq={faq}
              isOpen={openItems[faq.id]}
              onToggle={() => toggleItem(faq.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

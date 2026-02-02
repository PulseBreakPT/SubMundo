import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button, FadeIn, Modal } from '../components/UI';
import { 
  Skull, Target, Users, Car, Building2, Shield, Zap, Star,
  ChevronRight, ChevronDown, Play, Mail, Check, X,
  Gamepad2, Trophy, Swords, MapPin, DollarSign, Flame,
  Eye, Lock, Crown, Gift, Clock, ArrowRight, Menu,
  Twitter, Youtube, Instagram, MessageCircle, Send
} from 'lucide-react';
import clsx from 'clsx';

// ============================================================================
// DADOS DA LANDING PAGE
// ============================================================================

const GAME_FEATURES = [
  {
    icon: Skull,
    title: 'Vida do Crime',
    description: 'Constrói o teu império criminoso desde a rua até ao topo. Começa como um pequeno ladrão e torna-te o maior chefe do submundo.',
    color: 'primary'
  },
  {
    icon: Building2,
    title: 'Negócios Ilegais',
    description: 'Gere propriedades, lavandarias de dinheiro, clubes noturnos e muito mais. Cada negócio tem os seus próprios desafios e recompensas.',
    color: 'secondary'
  },
  {
    icon: Users,
    title: 'Gangues & Territórios',
    description: 'Junta-te a gangues poderosas ou cria a tua própria. Conquista territórios e defende-os contra rivais.',
    color: 'warning'
  },
  {
    icon: Car,
    title: 'Veículos & Roubos',
    description: 'Coleciona veículos de luxo, planeia assaltos elaborados e escapa da polícia em perseguições intensas.',
    color: 'success'
  },
  {
    icon: Swords,
    title: 'Combate & PvP',
    description: 'Sistema de combate estratégico contra NPCs e outros jogadores. Escolhe as tuas armas e táticas sabiamente.',
    color: 'error'
  },
  {
    icon: MapPin,
    title: 'Mundo Aberto',
    description: 'Explora bairros distintos, cada um com a sua própria economia, facções e oportunidades criminosas.',
    color: 'gold'
  }
];

const SCREENSHOTS = [
  { id: 1, title: 'Dashboard Principal', desc: 'Controla o teu império' },
  { id: 2, title: 'Mapa de Territórios', desc: 'Conquista a cidade' },
  { id: 3, title: 'Sistema de Missões', desc: 'Completa trabalhos' },
  { id: 4, title: 'Mercado Negro', desc: 'Compra e vende' },
  { id: 5, title: 'Gestão de Gangue', desc: 'Lidera a tua crew' },
  { id: 6, title: 'Garagem de Veículos', desc: 'Coleciona carros' }
];

const TESTIMONIALS = [
  {
    name: 'DarkLord_PT',
    avatar: 'DL',
    rating: 5,
    text: 'O melhor jogo de crime que já joguei! A profundidade estratégica é incrível e a comunidade é muito ativa.',
    level: 47,
    gang: 'Cartel das Sombras'
  },
  {
    name: 'CrimeBoss99',
    avatar: 'CB',
    rating: 5,
    text: 'Viciei completamente. Cada decisão importa e o sistema de heat deixa tudo mais tenso. 10/10!',
    level: 62,
    gang: 'Máfia do Porto'
  },
  {
    name: 'StreetQueen',
    avatar: 'SQ',
    rating: 5,
    text: 'Finalmente um jogo que respeita o nosso tempo. Podes jogar casualmente ou hardcore, funciona dos dois jeitos.',
    level: 38,
    gang: 'As Rainhas'
  },
  {
    name: 'NightHunter',
    avatar: 'NH',
    rating: 4,
    text: 'Gráficos estilo cyberpunk brutal, gameplay viciante. Só queria mais missões de história.',
    level: 55,
    gang: 'Caçadores Noturnos'
  }
];

const FAQ_ITEMS = [
  {
    question: 'O jogo é gratuito?',
    answer: 'Sim! SUBMUNDO é free-to-play. Podes jogar todo o conteúdo principal sem gastar dinheiro. Oferecemos itens cosméticos opcionais para quem quiser apoiar o desenvolvimento.'
  },
  {
    question: 'Em que plataformas posso jogar?',
    answer: 'SUBMUNDO é um jogo web-based que funciona em qualquer browser moderno (Chrome, Firefox, Safari, Edge). Podes jogar no PC, Mac, tablet ou smartphone.'
  },
  {
    question: 'Preciso de um PC potente?',
    answer: 'Não! Como é um jogo baseado em browser, os requisitos são mínimos. Qualquer dispositivo que corra um browser moderno consegue jogar SUBMUNDO sem problemas.'
  },
  {
    question: 'Posso jogar sozinho ou preciso de uma gangue?',
    answer: 'Podes jogar completamente sozinho se preferires. No entanto, juntar-te a uma gangue desbloqueia conteúdo extra, missões cooperativas e territórios exclusivos.'
  },
  {
    question: 'O progresso é guardado automaticamente?',
    answer: 'Sim! Todo o teu progresso é guardado automaticamente nos nossos servidores. Podes continuar de onde paraste em qualquer dispositivo.'
  },
  {
    question: 'Como funciona o sistema de Heat?',
    answer: 'O Heat representa a atenção policial sobre ti. Atividades ilegais aumentam o Heat, enquanto manter-se discreto ou subornar autoridades o diminui. Heat alto significa mais riscos mas também mais recompensas.'
  },
  {
    question: 'Há eventos especiais?',
    answer: 'Sim! Organizamos eventos semanais e sazonais com missões exclusivas, recompensas limitadas e competições entre gangues. Segue-nos nas redes sociais para não perderes nada.'
  },
  {
    question: 'Como reporto bugs ou dou sugestões?',
    answer: 'Podes contactar-nos através do Discord oficial, email de suporte ou nas redes sociais. Valorizamos muito o feedback da comunidade!'
  }
];

const STATS = [
  { value: '50K+', label: 'Jogadores Ativos' },
  { value: '1M+', label: 'Missões Completadas' },
  { value: '500+', label: 'Gangues Criadas' },
  { value: '24/7', label: 'Servidores Online' }
];

// ============================================================================
// COMPONENTE: Navbar
// ============================================================================

const Navbar = ({ onLogin, onRegister }) => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    setMobileMenuOpen(false);
  };

  return (
    <nav className={clsx(
      'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
      scrolled ? 'bg-background/95 backdrop-blur-md border-b border-border' : 'bg-transparent'
    )}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <Skull className="w-8 h-8 text-primary" />
            <span className="font-display text-xl sm:text-2xl font-bold text-primary tracking-wider">
              SUBMUNDO
            </span>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-8">
            <button onClick={() => scrollToSection('features')} className="text-text-secondary hover:text-primary transition-colors">
              Features
            </button>
            <button onClick={() => scrollToSection('screenshots')} className="text-text-secondary hover:text-primary transition-colors">
              Screenshots
            </button>
            <button onClick={() => scrollToSection('reviews')} className="text-text-secondary hover:text-primary transition-colors">
              Reviews
            </button>
            <button onClick={() => scrollToSection('faq')} className="text-text-secondary hover:text-primary transition-colors">
              FAQ
            </button>
          </div>

          {/* Auth Buttons */}
          <div className="hidden md:flex items-center gap-3">
            <Button variant="ghost" onClick={onLogin}>Entrar</Button>
            <Button variant="primary" onClick={onRegister}>Jogar Agora</Button>
          </div>

          {/* Mobile Menu Button */}
          <button 
            className="md:hidden p-2 text-text-secondary"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <Menu size={24} />
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-surface border-t border-border py-4 px-4 space-y-4">
            <button onClick={() => scrollToSection('features')} className="block w-full text-left py-2 text-text-secondary">Features</button>
            <button onClick={() => scrollToSection('screenshots')} className="block w-full text-left py-2 text-text-secondary">Screenshots</button>
            <button onClick={() => scrollToSection('reviews')} className="block w-full text-left py-2 text-text-secondary">Reviews</button>
            <button onClick={() => scrollToSection('faq')} className="block w-full text-left py-2 text-text-secondary">FAQ</button>
            <div className="flex gap-2 pt-4 border-t border-border">
              <Button variant="ghost" onClick={onLogin} className="flex-1">Entrar</Button>
              <Button variant="primary" onClick={onRegister} className="flex-1">Jogar</Button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

// ============================================================================
// COMPONENTE: Hero Section
// ============================================================================

const HeroSection = ({ onPlay }) => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/10 via-background to-background" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent" />
      
      {/* Animated Grid */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: 'linear-gradient(var(--primary) 1px, transparent 1px), linear-gradient(90deg, var(--primary) 1px, transparent 1px)',
          backgroundSize: '50px 50px'
        }} />
      </div>

      {/* Floating Elements - Static */}
      <div className="absolute top-20 left-10 w-20 h-20 border border-primary/30 rotate-45 opacity-50" />
      <div className="absolute bottom-32 right-20 w-16 h-16 border border-secondary/30 rotate-12 opacity-50" />
      <div className="absolute top-40 right-32 w-12 h-12 bg-primary/10 rotate-45" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center pt-20">
        <div>
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-surface/80 border border-primary/50 px-4 py-2 mb-8">
            <Zap className="w-4 h-4 text-primary" />
            <span className="text-sm text-text-secondary">Novo Update v2.0 Disponível</span>
          </div>

          {/* Title */}
          <h1 className="font-display text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold mb-6">
            <span className="text-text-primary">BEM-VINDO AO</span>
            <br />
            <span className="text-primary text-glow">SUBMUNDO</span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg sm:text-xl text-text-secondary max-w-2xl mx-auto mb-8">
            Entra no jogo de crime mais intenso da web. Constrói o teu império, 
            lidera gangues e domina as ruas neste RPG de estratégia criminal.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <Button 
              variant="primary" 
              size="lg" 
              onClick={onPlay}
              className="group min-w-[200px] text-lg py-4"
            >
              <Gamepad2 className="mr-2" />
              Jogar Grátis
              <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button 
              variant="secondary" 
              size="lg"
              onClick={() => document.getElementById('trailer')?.scrollIntoView({ behavior: 'smooth' })}
              className="min-w-[200px] text-lg py-4"
            >
              <Play className="mr-2" />
              Ver Trailer
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
            {STATS.map((stat, i) => (
              <div key={i} className="bg-surface/50 border border-border p-4">
                <p className="font-display text-2xl sm:text-3xl font-bold text-primary">{stat.value}</p>
                <p className="text-xs sm:text-sm text-text-secondary">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
          <ChevronDown className="w-8 h-8 text-text-secondary" />
        </div>
      </div>
    </section>
  );
};

// ============================================================================
// COMPONENTE: Features Section
// ============================================================================

const FeaturesSection = () => {
  return (
    <section id="features" className="py-20 bg-surface/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-text-primary mb-4">
            FEATURES DO <span className="text-primary">JOGO</span>
          </h2>
          <p className="text-text-secondary max-w-2xl mx-auto">
            Descobre tudo o que podes fazer no SUBMUNDO. Cada feature foi desenhada 
            para te proporcionar horas de gameplay estratégico e envolvente.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {GAME_FEATURES.map((feature) => (
            <div key={feature.title} className="group relative bg-surface border border-border p-6 hover:border-primary/50 transition-all duration-300 h-full">
              {/* Accent Line */}
              <div className={`absolute top-0 left-0 w-1 h-full bg-${feature.color}`} />
              
              {/* Icon */}
              <div className={`w-12 h-12 bg-${feature.color}/10 border border-${feature.color}/30 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                <feature.icon className={`w-6 h-6 text-${feature.color}`} />
              </div>

              {/* Content */}
              <h3 className="font-display text-xl font-bold text-text-primary mb-2">
                {feature.title}
              </h3>
              <p className="text-text-secondary text-sm leading-relaxed">
                {feature.description}
              </p>

              {/* Hover Effect */}
              <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <ChevronRight className="w-5 h-5 text-primary" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// ============================================================================
// COMPONENTE: Screenshots Section
// ============================================================================

const ScreenshotsSection = () => {
  const [selectedImage, setSelectedImage] = useState(0);

  return (
    <section id="screenshots" className="py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-text-primary mb-4">
            <span className="text-primary">SCREENSHOTS</span> DO JOGO
          </h2>
          <p className="text-text-secondary max-w-2xl mx-auto">
            Vê como é o SUBMUNDO por dentro. Interface moderna, gráficos estilizados 
            e informação clara para dominares o jogo.
          </p>
        </div>

        {/* Main Screenshot Display */}
        <div className="relative mb-6">
          <div className="aspect-video bg-surface border border-border overflow-hidden">
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-surface to-background">
              <div className="text-center">
                <Eye className="w-16 h-16 text-primary/50 mx-auto mb-4" />
                <p className="text-text-secondary">{SCREENSHOTS[selectedImage].title}</p>
                <p className="text-sm text-text-secondary/60">{SCREENSHOTS[selectedImage].desc}</p>
              </div>
            </div>
          </div>
          
          {/* Navigation Arrows */}
          <button 
            onClick={() => setSelectedImage(prev => prev === 0 ? SCREENSHOTS.length - 1 : prev - 1)}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-background/80 border border-border flex items-center justify-center hover:border-primary transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-text-primary rotate-180" />
          </button>
          <button 
            onClick={() => setSelectedImage(prev => prev === SCREENSHOTS.length - 1 ? 0 : prev + 1)}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-background/80 border border-border flex items-center justify-center hover:border-primary transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-text-primary" />
          </button>
        </div>

        {/* Thumbnail Grid */}
        <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
          {SCREENSHOTS.map((screenshot, i) => (
            <button
              key={screenshot.id}
              onClick={() => setSelectedImage(i)}
              className={clsx(
                'aspect-video bg-surface border transition-all',
                selectedImage === i ? 'border-primary' : 'border-border hover:border-primary/50'
              )}
            >
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-xs text-text-secondary">{i + 1}</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};

// ============================================================================
// COMPONENTE: Trailer Section
// ============================================================================

const TrailerSection = () => {
  return (
    <section id="trailer" className="py-20 bg-surface/30">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-text-primary mb-4">
            TRAILER <span className="text-primary">OFICIAL</span>
          </h2>
          <p className="text-text-secondary max-w-2xl mx-auto">
            Assiste ao trailer e prepara-te para entrar no submundo do crime.
          </p>
        </div>

        {/* Video Container */}
        <div className="relative aspect-video bg-surface border border-border overflow-hidden group cursor-pointer">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent" />
          
          {/* Play Button Overlay */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-20 h-20 bg-primary/90 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Play className="w-10 h-10 text-white ml-1" />
            </div>
          </div>

          {/* Video Info */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-background/90 to-transparent p-6">
            <p className="font-display text-xl text-text-primary">SUBMUNDO - Trailer Oficial</p>
            <p className="text-sm text-text-secondary">2:34 • Gameplay & Cinematics</p>
          </div>
        </div>
      </div>
    </section>
  );
};

// ============================================================================
// COMPONENTE: Testimonials Section
// ============================================================================

const TestimonialsSection = () => {
  return (
    <section id="reviews" className="py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-text-primary mb-4">
            O QUE OS <span className="text-primary">JOGADORES</span> DIZEM
          </h2>
          <p className="text-text-secondary max-w-2xl mx-auto">
            Junta-te a milhares de jogadores que já descobriram o SUBMUNDO.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {TESTIMONIALS.map((review) => (
            <div key={review.name} className="bg-surface border border-border p-6 h-full">
              {/* Header */}
              <div className="flex items-start gap-4 mb-4">
                {/* Avatar */}
                <div className="w-12 h-12 bg-primary/20 border border-primary/30 flex items-center justify-center font-bold text-primary">
                  {review.avatar}
                </div>
                
                {/* Info */}
                <div className="flex-1">
                  <p className="font-display font-bold text-text-primary">{review.name}</p>
                  <div className="flex items-center gap-2 text-xs text-text-secondary">
                    <span>Level {review.level}</span>
                    <span>•</span>
                    <span>{review.gang}</span>
                  </div>
                </div>

                {/* Rating */}
                <div className="flex gap-0.5">
                  {[...Array(5)].map((_, j) => (
                    <Star 
                      key={j} 
                      className={clsx(
                        'w-4 h-4',
                        j < review.rating ? 'text-gold fill-gold' : 'text-border'
                      )} 
                    />
                  ))}
                </div>
              </div>

              {/* Review Text */}
              <p className="text-text-secondary leading-relaxed">"{review.text}"</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// ============================================================================
// COMPONENTE: FAQ Section
// ============================================================================

const FAQSection = () => {
  const [openIndex, setOpenIndex] = useState(null);

  return (
    <section id="faq" className="py-20 bg-surface/30">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-text-primary mb-4">
            PERGUNTAS <span className="text-primary">FREQUENTES</span>
          </h2>
          <p className="text-text-secondary max-w-2xl mx-auto">
            Tens dúvidas? Encontra aqui as respostas às perguntas mais comuns.
          </p>
        </div>

        <div className="space-y-3">
          {FAQ_ITEMS.map((item, i) => (
            <div key={i} className="bg-surface border border-border">
              <button
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-surface-highlight transition-colors"
              >
                <span className="font-display font-bold text-text-primary pr-4">
                  {item.question}
                </span>
                <ChevronDown 
                  className={clsx(
                    'w-5 h-5 text-primary transition-transform flex-shrink-0',
                    openIndex === i && 'rotate-180'
                  )} 
                />
              </button>
              
              {openIndex === i && (
                <div className="px-4 pb-4 border-t border-border">
                  <p className="text-text-secondary pt-4 leading-relaxed">
                    {item.answer}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// ============================================================================
// COMPONENTE: Newsletter Section
// ============================================================================

const NewsletterSection = () => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (email) {
      setSubmitted(true);
      setEmail('');
    }
  };

  return (
    <section className="py-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <FadeIn>
          <div className="bg-surface border border-border p-8 sm:p-12 text-center relative overflow-hidden">
            {/* Background Effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-secondary/5" />
            
            <div className="relative z-10">
              <Gift className="w-12 h-12 text-primary mx-auto mb-4" />
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-text-primary mb-2">
                RECEBE NOVIDADES & BÓNUS
              </h2>
              <p className="text-text-secondary mb-8 max-w-lg mx-auto">
                Subscreve a nossa newsletter e recebe atualizações exclusivas, 
                dicas de jogo e bónus especiais diretamente no teu email.
              </p>

              {submitted ? (
                <div className="flex items-center justify-center gap-2 text-success">
                  <Check className="w-5 h-5" />
                  <span>Obrigado! Confirma o teu email.</span>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="O teu email..."
                    className="flex-1 bg-background border border-border px-4 py-3 text-text-primary placeholder-text-secondary/50 focus:border-primary focus:outline-none"
                    required
                  />
                  <Button type="submit" variant="primary" className="whitespace-nowrap">
                    <Mail className="w-4 h-4 mr-2" />
                    Subscrever
                  </Button>
                </form>
              )}

              <p className="text-xs text-text-secondary/60 mt-4">
                Sem spam. Podes cancelar a qualquer momento.
              </p>
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
};

// ============================================================================
// COMPONENTE: CTA Section
// ============================================================================

const CTASection = ({ onPlay }) => {
  return (
    <section className="py-20 bg-gradient-to-b from-surface/30 to-background relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
        <FadeIn>
          <Skull className="w-16 h-16 text-primary mx-auto mb-6" />
          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold text-text-primary mb-4">
            PRONTO PARA <span className="text-primary text-glow">DOMINAR</span>?
          </h2>
          <p className="text-lg text-text-secondary mb-8 max-w-2xl mx-auto">
            O submundo espera por ti. Cria a tua conta gratuita agora e começa 
            a construir o teu império criminoso hoje mesmo.
          </p>
          
          <Button 
            variant="primary" 
            size="lg" 
            onClick={onPlay}
            className="text-lg px-8 py-4 animate-pulse-red"
          >
            <Gamepad2 className="mr-2" />
            Começar a Jogar - É Grátis!
          </Button>

          <p className="text-sm text-text-secondary/60 mt-6">
            Não é necessário cartão de crédito • Registo em 30 segundos
          </p>
        </FadeIn>
      </div>
    </section>
  );
};

// ============================================================================
// COMPONENTE: Footer
// ============================================================================

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    jogo: [
      { label: 'Jogar Agora', href: '/login' },
      { label: 'Novidades', href: '/news' },
      { label: 'Guia do Jogo', href: '/faq' },
      { label: 'Rankings', href: '/rankings' }
    ],
    legal: [
      { label: 'Termos de Serviço', href: '/terms' },
      { label: 'Política de Privacidade', href: '/privacy' },
      { label: 'Regras do Jogo', href: '/rules' }
    ],
    suporte: [
      { label: 'FAQ', href: '/faq' },
      { label: 'Contacto', href: '/contact' },
      { label: 'Reportar Bug', href: '/contact' }
    ]
  };

  const socialLinks = [
    { icon: Twitter, href: '#', label: 'Twitter' },
    { icon: Youtube, href: '#', label: 'YouTube' },
    { icon: Instagram, href: '#', label: 'Instagram' },
    { icon: MessageCircle, href: '#', label: 'Discord' }
  ];

  return (
    <footer className="bg-surface border-t border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          {/* Brand */}
          <div className="col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <Skull className="w-8 h-8 text-primary" />
              <span className="font-display text-xl font-bold text-primary">SUBMUNDO</span>
            </div>
            <p className="text-sm text-text-secondary mb-4 max-w-xs">
              O jogo de crime mais intenso da web. Constrói o teu império e domina as ruas.
            </p>
            
            {/* Social Links */}
            <div className="flex gap-3">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  className="w-10 h-10 bg-background border border-border flex items-center justify-center hover:border-primary hover:text-primary transition-colors"
                  aria-label={social.label}
                >
                  <social.icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-display font-bold text-text-primary mb-4">JOGO</h4>
            <ul className="space-y-2">
              {footerLinks.jogo.map((link) => (
                <li key={link.label}>
                  <a href={link.href} className="text-sm text-text-secondary hover:text-primary transition-colors">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-display font-bold text-text-primary mb-4">LEGAL</h4>
            <ul className="space-y-2">
              {footerLinks.legal.map((link) => (
                <li key={link.label}>
                  <a href={link.href} className="text-sm text-text-secondary hover:text-primary transition-colors">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-display font-bold text-text-primary mb-4">SUPORTE</h4>
            <ul className="space-y-2">
              {footerLinks.suporte.map((link) => (
                <li key={link.label}>
                  <a href={link.href} className="text-sm text-text-secondary hover:text-primary transition-colors">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-border mt-12 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-text-secondary">
            © {currentYear} SUBMUNDO. Todos os direitos reservados.
          </p>
          <p className="text-xs text-text-secondary/60">
            Este é um jogo de ficção. Todas as atividades são virtuais.
          </p>
        </div>
      </div>
    </footer>
  );
};

// ============================================================================
// PÁGINA PRINCIPAL: HomePage (Landing Page)
// ============================================================================

export default function HomePage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  // Se o utilizador já está logado, redireciona para o dashboard
  useEffect(() => {
    if (user && !loading) {
      navigate('/dashboard');
    }
  }, [user, loading, navigate]);

  const handleLogin = () => navigate('/login');
  const handleRegister = () => navigate('/login?register=true');
  const handlePlay = () => navigate('/login');

  // Mostra loading enquanto verifica autenticação
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-primary text-xl">Carregando...</div>
      </div>
    );
  }

  // Se já está logado, não renderiza nada (vai redirecionar)
  if (user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar onLogin={handleLogin} onRegister={handleRegister} />
      <HeroSection onPlay={handlePlay} />
      <FeaturesSection />
      <ScreenshotsSection />
      <TrailerSection />
      <TestimonialsSection />
      <FAQSection />
      <NewsletterSection />
      <CTASection onPlay={handlePlay} />
      <Footer />
    </div>
  );
}

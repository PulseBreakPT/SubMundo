import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button, Input, Badge, Modal, Tooltip, FadeIn, SlideIn, Alert, Toggle, Checkbox, Slider } from '../components/UI';
import { Card, ProgressBar, CircularProgress } from '../components/ProgressBar';
import { 
  LogIn, UserPlus, Skull, Newspaper, HelpCircle, Shield, ScrollText,
  Mail, Lock, User, Eye, EyeOff, AlertTriangle, Check, X,
  ChevronRight, ChevronDown, ChevronUp, ArrowLeft, ArrowRight,
  Zap, Star, Crown, Sparkles, Gift, Target, DollarSign,
  Clock, Calendar, RefreshCw, Info, Settings, Bell,
  Gamepad2, Trophy, Users, Map, Building2, Factory,
  Heart, Flame, Activity, TrendingUp, Award, Unlock,
  Play, Pause, Volume2, VolumeX, Sun, Moon, Monitor
} from 'lucide-react';
import clsx from 'clsx';

// ============================================================================
// CONSTANTES
// ============================================================================

const GAME_FEATURES = [
  { icon: Target, title: 'Missões', description: 'Mais de 50 missões únicas', color: 'primary' },
  { icon: Building2, title: 'Propriedades', description: 'Compra e gere imóveis', color: 'success' },
  { icon: Factory, title: 'Negócios', description: 'Cria o teu império', color: 'warning' },
  { icon: Users, title: 'Gangues', description: 'Junta-te ou cria a tua', color: 'error' },
  { icon: Map, title: 'Territórios', description: 'Conquista bairros', color: 'gold' },
  { icon: Trophy, title: 'Rankings', description: 'Compete globalmente', color: 'purple' }
];

const TESTIMONIALS = [
  { name: 'CrimeLord99', level: 45, text: 'Melhor jogo de crime que já joguei! A gangue é incrível.', avatar: '💀' },
  { name: 'ShadowQueen', level: 38, text: 'Víciante! Já tenho 3 propriedades e 2 negócios.', avatar: '👑' },
  { name: 'StreetBoss', level: 52, text: 'A economia do jogo é muito bem equilibrada.', avatar: '💰' }
];

const STATS_SHOWCASE = [
  { label: 'Jogadores Ativos', value: '12,847', icon: Users },
  { label: 'Missões Completadas', value: '1.2M', icon: Target },
  { label: 'Dinheiro Lavado', value: '€847M', icon: DollarSign },
  { label: 'Guerras de Gangue', value: '3,429', icon: Flame }
];

const PASSWORD_REQUIREMENTS = [
  { id: 'length', label: 'Pelo menos 6 caracteres', check: (p) => p.length >= 6 },
  { id: 'uppercase', label: 'Uma letra maiúscula', check: (p) => /[A-Z]/.test(p) },
  { id: 'number', label: 'Um número', check: (p) => /[0-9]/.test(p) },
  { id: 'special', label: 'Um caracter especial (opcional)', check: (p) => /[!@#$%^&*]/.test(p) }
];

const FOOTER_LINKS = [
  { to: '/novidades', icon: Newspaper, label: 'Novidades' },
  { to: '/faq', icon: HelpCircle, label: 'FAQ' },
  { to: '/privacidade', icon: Shield, label: 'Privacidade' },
  { to: '/termos', icon: ScrollText, label: 'Termos' }
];

// ============================================================================
// COMPONENTE: Password Strength Indicator
// ============================================================================

const PasswordStrengthIndicator = ({ password }) => {
  const strength = useMemo(() => {
    let score = 0;
    if (password.length >= 6) score++;
    if (password.length >= 10) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[!@#$%^&*]/.test(password)) score++;
    
    if (score <= 1) return { level: 'weak', label: 'Fraca', color: 'error', percent: 20 };
    if (score <= 2) return { level: 'fair', label: 'Razoável', color: 'warning', percent: 40 };
    if (score <= 3) return { level: 'good', label: 'Boa', color: 'primary', percent: 60 };
    if (score <= 4) return { level: 'strong', label: 'Forte', color: 'success', percent: 80 };
    return { level: 'excellent', label: 'Excelente', color: 'gold', percent: 100 };
  }, [password]);

  if (!password) return null;

  return (
    <div className="mt-2 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs text-text-secondary">Força da password:</span>
        <span className={`text-xs text-${strength.color}`}>{strength.label}</span>
      </div>
      <ProgressBar
        value={strength.percent}
        max={100}
        color={strength.color}
        showLabel={false}
        height="h-1"
      />
      
      {/* Requirements checklist */}
      <div className="grid grid-cols-2 gap-1 mt-2">
        {PASSWORD_REQUIREMENTS.map(req => {
          const met = req.check(password);
          return (
            <div key={req.id} className={clsx(
              'flex items-center gap-1 text-[10px]',
              met ? 'text-success' : 'text-text-secondary'
            )}>
              {met ? <Check size={10} /> : <X size={10} />}
              {req.label}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ============================================================================
// COMPONENTE: Feature Carousel
// ============================================================================

const FeatureCarousel = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      setActiveIndex(prev => (prev + 1) % GAME_FEATURES.length);
    }, 3000);
    return () => clearInterval(timer);
  }, [isPaused]);

  return (
    <div 
      className="relative overflow-hidden"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="flex transition-transform duration-500" style={{ transform: `translateX(-${activeIndex * 100}%)` }}>
        {GAME_FEATURES.map((feature, i) => (
          <div key={i} className="w-full flex-shrink-0 p-4">
            <div className="flex items-center gap-4">
              <div className={`w-14 h-14 flex items-center justify-center bg-${feature.color}/10 border border-${feature.color}/30`}>
                <feature.icon size={28} className={`text-${feature.color}`} />
              </div>
              <div>
                <h4 className="font-heading text-text-primary">{feature.title}</h4>
                <p className="text-sm text-text-secondary">{feature.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Dots */}
      <div className="flex justify-center gap-2 mt-2">
        {GAME_FEATURES.map((_, i) => (
          <button
            key={i}
            className={clsx(
              'w-2 h-2 rounded-full transition-all',
              i === activeIndex ? 'bg-primary w-4' : 'bg-border'
            )}
            onClick={() => setActiveIndex(i)}
          />
        ))}
      </div>
    </div>
  );
};

// ============================================================================
// COMPONENTE: Stats Display
// ============================================================================

const StatsDisplay = () => (
  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
    {STATS_SHOWCASE.map((stat, i) => (
      <FadeIn key={stat.label} delay={i * 100}>
        <div className="bg-surface/50 border border-border/50 p-3 text-center">
          <stat.icon size={18} className="mx-auto text-primary mb-1" />
          <p className="text-lg font-body text-text-primary">{stat.value}</p>
          <p className="text-[10px] text-text-secondary uppercase">{stat.label}</p>
        </div>
      </FadeIn>
    ))}
  </div>
);

// ============================================================================
// COMPONENTE: Testimonial Card
// ============================================================================

const TestimonialCard = ({ testimonial }) => (
  <div className="bg-surface/50 border border-border/50 p-4">
    <div className="flex items-start gap-3">
      <div className="w-10 h-10 bg-surface-highlight border border-border flex items-center justify-center text-2xl">
        {testimonial.avatar}
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="font-heading text-text-primary">{testimonial.name}</span>
          <Badge variant="gold" size="xs">Nv.{testimonial.level}</Badge>
        </div>
        <p className="text-text-secondary text-sm mt-1">"{testimonial.text}"</p>
      </div>
    </div>
  </div>
);

// ============================================================================
// COMPONENTE: Login Form
// ============================================================================

const LoginForm = ({ onSubmit, loading, error }) => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [formErrors, setFormErrors] = useState({});
  const [rememberMe, setRememberMe] = useState(false);

  const validateForm = () => {
    const errors = {};
    if (!formData.email) errors.email = 'Email obrigatório';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) errors.email = 'Email inválido';
    if (!formData.password) errors.password = 'Password obrigatória';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData.email, formData.password, rememberMe);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setFormErrors(prev => ({ ...prev, [name]: '' }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Email"
        name="email"
        type="email"
        placeholder="crime@submundo.pt"
        value={formData.email}
        onChange={handleChange}
        error={formErrors.email}
        icon={Mail}
        iconPosition="left"
        data-testid="email-input"
      />
      
      <Input
        label="Password"
        name="password"
        type="password"
        placeholder="••••••••"
        value={formData.password}
        onChange={handleChange}
        error={formErrors.password}
        icon={Lock}
        iconPosition="left"
        data-testid="password-input"
      />
      
      <div className="flex items-center justify-between">
        <Checkbox
          checked={rememberMe}
          onChange={setRememberMe}
          label="Lembrar-me"
        />
        <Link to="/recuperar-password" className="text-xs text-primary hover:underline">
          Esqueceste a password?
        </Link>
      </div>

      {error && (
        <Alert variant="error">
          {error}
        </Alert>
      )}

      <Button
        type="submit"
        variant="primary"
        size="lg"
        fullWidth
        loading={loading}
        icon={LogIn}
        glow
        data-testid="submit-button"
      >
        Entrar no Submundo
      </Button>
      
      {/* Social Login (placeholder) */}
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-surface px-4 text-xs text-text-secondary">ou continua com</span>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        <Button variant="secondary" size="md" disabled>
          <Gamepad2 size={18} className="mr-2" /> Discord
        </Button>
        <Button variant="secondary" size="md" disabled>
          <Mail size={18} className="mr-2" /> Google
        </Button>
      </div>
    </form>
  );
};

// ============================================================================
// COMPONENTE: Register Form
// ============================================================================

const RegisterForm = ({ onSubmit, loading, error }) => {
  const [formData, setFormData] = useState({ 
    email: '', 
    password: '', 
    confirmPassword: '',
    username: '' 
  });
  const [formErrors, setFormErrors] = useState({});
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [acceptNewsletter, setAcceptNewsletter] = useState(false);
  const [step, setStep] = useState(1);

  const validateStep1 = () => {
    const errors = {};
    if (!formData.username) errors.username = 'Nome de utilizador obrigatório';
    else if (formData.username.length < 3) errors.username = 'Mínimo 3 caracteres';
    else if (formData.username.length > 20) errors.username = 'Máximo 20 caracteres';
    else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) errors.username = 'Apenas letras, números e _';
    
    if (!formData.email) errors.email = 'Email obrigatório';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) errors.email = 'Email inválido';
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateStep2 = () => {
    const errors = {};
    if (!formData.password) errors.password = 'Password obrigatória';
    else if (formData.password.length < 6) errors.password = 'Mínimo 6 caracteres';
    
    if (!formData.confirmPassword) errors.confirmPassword = 'Confirma a password';
    else if (formData.password !== formData.confirmPassword) errors.confirmPassword = 'Passwords não coincidem';
    
    if (!acceptTerms) errors.terms = 'Deves aceitar os termos';
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) {
      setStep(2);
    }
  };

  const handleBack = () => {
    setStep(1);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (step === 2 && validateStep2()) {
      onSubmit(formData.email, formData.password, formData.username);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setFormErrors(prev => ({ ...prev, [name]: '' }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Progress indicator */}
      <div className="flex items-center gap-2 mb-6">
        <div className={clsx(
          'flex-1 h-1 transition-all',
          step >= 1 ? 'bg-primary' : 'bg-border'
        )} />
        <div className={clsx(
          'flex-1 h-1 transition-all',
          step >= 2 ? 'bg-primary' : 'bg-border'
        )} />
      </div>
      
      {step === 1 && (
        <FadeIn>
          <div className="space-y-4">
            <Input
              label="Nome de Utilizador"
              name="username"
              type="text"
              placeholder="CrimeBoss123"
              value={formData.username}
              onChange={handleChange}
              error={formErrors.username}
              icon={User}
              iconPosition="left"
              hint="Este será o teu nome no jogo"
              data-testid="username-input"
            />
            
            <Input
              label="Email"
              name="email"
              type="email"
              placeholder="crime@submundo.pt"
              value={formData.email}
              onChange={handleChange}
              error={formErrors.email}
              icon={Mail}
              iconPosition="left"
              data-testid="email-input"
            />
            
            {/* Username preview */}
            {formData.username && (
              <div className="bg-surface-highlight border border-border p-3">
                <p className="text-xs text-text-secondary mb-1">Pré-visualização:</p>
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 bg-primary/20 border border-primary flex items-center justify-center">
                    <Skull size={20} className="text-primary" />
                  </div>
                  <div>
                    <p className="font-heading text-text-primary">{formData.username}</p>
                    <p className="text-xs text-text-secondary">Nível 1 • Novato</p>
                  </div>
                </div>
              </div>
            )}
            
            <Button
              type="button"
              variant="primary"
              size="lg"
              fullWidth
              onClick={handleNext}
              icon={ChevronRight}
              iconPosition="right"
            >
              Continuar
            </Button>
          </div>
        </FadeIn>
      )}
      
      {step === 2 && (
        <FadeIn>
          <div className="space-y-4">
            <button
              type="button"
              onClick={handleBack}
              className="flex items-center gap-1 text-text-secondary hover:text-text-primary text-sm"
            >
              <ArrowLeft size={14} /> Voltar
            </button>
            
            <Input
              label="Password"
              name="password"
              type="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              error={formErrors.password}
              icon={Lock}
              iconPosition="left"
              data-testid="password-input"
            />
            
            <PasswordStrengthIndicator password={formData.password} />
            
            <Input
              label="Confirmar Password"
              name="confirmPassword"
              type="password"
              placeholder="••••••••"
              value={formData.confirmPassword}
              onChange={handleChange}
              error={formErrors.confirmPassword}
              icon={Lock}
              iconPosition="left"
              success={formData.confirmPassword && formData.password === formData.confirmPassword ? 'Passwords coincidem!' : undefined}
            />
            
            <div className="space-y-3 pt-4 border-t border-border">
              <Checkbox
                checked={acceptTerms}
                onChange={setAcceptTerms}
                label={
                  <span>
                    Aceito os <Link to="/termos" className="text-primary hover:underline">Termos e Condições</Link> e a <Link to="/privacidade" className="text-primary hover:underline">Política de Privacidade</Link>
                  </span>
                }
              />
              {formErrors.terms && <p className="text-error text-xs">{formErrors.terms}</p>}
              
              <Checkbox
                checked={acceptNewsletter}
                onChange={setAcceptNewsletter}
                label="Quero receber novidades e eventos por email"
              />
            </div>

            {error && (
              <Alert variant="error">
                {error}
              </Alert>
            )}

            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              loading={loading}
              icon={UserPlus}
              glow
              disabled={!acceptTerms}
              data-testid="submit-button"
            >
              Criar Conta
            </Button>
          </div>
        </FadeIn>
      )}
    </form>
  );
};

// ============================================================================
// COMPONENTE: Animated Background
// ============================================================================

const AnimatedBackground = () => (
  <div className="fixed inset-0 pointer-events-none overflow-hidden">
    {/* Gradient overlay */}
    <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
    
    {/* Animated particles */}
    <div className="absolute inset-0">
      {[...Array(20)].map((_, i) => (
        <div
          key={i}
          className="absolute w-1 h-1 bg-primary/30 rounded-full animate-pulse"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 2}s`,
            animationDuration: `${2 + Math.random() * 3}s`
          }}
        />
      ))}
    </div>
    
    {/* Grid pattern */}
    <div 
      className="absolute inset-0 opacity-5"
      style={{
        backgroundImage: 'linear-gradient(rgba(0,255,157,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,157,0.1) 1px, transparent 1px)',
        backgroundSize: '50px 50px'
      }}
    />
  </div>
);

// ============================================================================
// COMPONENTE: Welcome Modal (First Time)
// ============================================================================

const WelcomeModal = ({ isOpen, onClose }) => (
  <Modal isOpen={isOpen} onClose={onClose} title="Bem-vindo ao SUBMUNDO" size="md">
    <div className="space-y-6 text-center">
      <div className="w-20 h-20 mx-auto bg-primary/20 border-2 border-primary flex items-center justify-center">
        <Skull size={40} className="text-primary" />
      </div>
      
      <div>
        <h3 className="font-heading text-xl text-text-primary mb-2">O teu império começa aqui!</h3>
        <p className="text-text-secondary">
          Prepara-te para construir o teu império criminal. 
          Completa missões, conquista territórios e torna-te o Rei do Submundo!
        </p>
      </div>
      
      <div className="grid grid-cols-3 gap-3">
        <div className="p-3 bg-surface-highlight border border-border">
          <Target size={24} className="mx-auto text-primary mb-1" />
          <p className="text-xs text-text-secondary">Missões</p>
        </div>
        <div className="p-3 bg-surface-highlight border border-border">
          <Users size={24} className="mx-auto text-warning mb-1" />
          <p className="text-xs text-text-secondary">Gangues</p>
        </div>
        <div className="p-3 bg-surface-highlight border border-border">
          <Building2 size={24} className="mx-auto text-success mb-1" />
          <p className="text-xs text-text-secondary">Negócios</p>
        </div>
      </div>
      
      <Button variant="primary" fullWidth onClick={onClose} icon={Play}>
        Começar a Jogar
      </Button>
    </div>
  </Modal>
);

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login, register, error, loading, isAuthenticated } = useAuth();
  
  const [isLogin, setIsLogin] = useState(true);
  const [showWelcome, setShowWelcome] = useState(false);
  const [showThemeSelector, setShowThemeSelector] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      const redirect = searchParams.get('redirect') || '/dashboard';
      navigate(redirect);
    }
  }, [isAuthenticated, navigate, searchParams]);

  const handleLogin = async (email, password, remember) => {
    const success = await login(email, password);
    if (success) {
      navigate('/dashboard');
    }
  };

  const handleRegister = async (email, password, username) => {
    const success = await register(email, password, username);
    if (success) {
      setShowWelcome(true);
    }
  };

  const handleWelcomeClose = () => {
    setShowWelcome(false);
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-background flex flex-col" data-testid="login-page">
      <AnimatedBackground />
      
      {/* Header */}
      <header className="relative z-10 p-4 flex justify-between items-center">
        <Link to="/" className="flex items-center gap-2">
          <Skull size={24} className="text-primary" />
          <span className="font-heading text-xl text-primary hidden sm:inline">SUBMUNDO</span>
        </Link>
        
        <div className="flex items-center gap-2">
          <Tooltip content="Tema">
            <button 
              className="p-2 hover:bg-surface-highlight transition-colors"
              onClick={() => setShowThemeSelector(!showThemeSelector)}
            >
              <Monitor size={18} className="text-text-secondary" />
            </button>
          </Tooltip>
          <Tooltip content="FAQ">
            <Link to="/faq" className="p-2 hover:bg-surface-highlight transition-colors">
              <HelpCircle size={18} className="text-text-secondary" />
            </Link>
          </Tooltip>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4 relative z-10">
        <div className="w-full max-w-5xl grid lg:grid-cols-2 gap-8 items-center">
          
          {/* Left Side - Info (Desktop) */}
          <div className="hidden lg:block space-y-8">
            {/* Logo and tagline */}
            <div>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 bg-surface border-2 border-primary flex items-center justify-center">
                  <Skull size={36} className="text-primary" />
                </div>
                <div>
                  <h1 className="font-heading text-4xl text-primary">SUBMUNDO</h1>
                  <p className="text-text-secondary">Browser-based Crime RPG</p>
                </div>
              </div>
              <p className="text-text-secondary text-lg leading-relaxed">
                Constrói o teu império criminal numa cidade corrupta. 
                Completa missões, gere negócios, conquista territórios e 
                torna-te o <span className="text-gold">Rei do Submundo</span>.
              </p>
            </div>
            
            {/* Stats */}
            <StatsDisplay />
            
            {/* Features Carousel */}
            <Card title="Funcionalidades" icon={Sparkles} noPadding>
              <FeatureCarousel />
            </Card>
            
            {/* Testimonials */}
            <div className="space-y-3">
              <h3 className="font-heading text-sm text-text-secondary uppercase tracking-wider">O que dizem os jogadores</h3>
              {TESTIMONIALS.slice(0, 2).map((t, i) => (
                <FadeIn key={i} delay={i * 100}>
                  <TestimonialCard testimonial={t} />
                </FadeIn>
              ))}
            </div>
          </div>
          
          {/* Right Side - Form */}
          <div className="w-full max-w-md mx-auto lg:mx-0">
            {/* Mobile Logo */}
            <div className="text-center mb-8 lg:hidden">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-surface border border-primary mb-4">
                <Skull size={40} className="text-primary" />
              </div>
              <h1 className="font-heading text-4xl text-primary tracking-wider">SUBMUNDO</h1>
              <p className="text-text-secondary text-sm mt-2">O teu império criminal começa aqui</p>
            </div>

            {/* Form Card */}
            <Card className="relative overflow-visible">
              {/* Accent line */}
              <div className="absolute top-0 left-0 w-full h-1 bg-primary" />
              
              {/* Tabs */}
              <div className="flex mb-6 border-b border-border -mx-4 px-4">
                <button
                  className={clsx(
                    'flex-1 pb-3 font-ui text-sm uppercase tracking-wider transition-colors flex items-center justify-center gap-2',
                    isLogin ? 'text-primary border-b-2 border-primary' : 'text-text-secondary hover:text-text-primary'
                  )}
                  onClick={() => setIsLogin(true)}
                  data-testid="login-tab"
                >
                  <LogIn size={16} /> Entrar
                </button>
                <button
                  className={clsx(
                    'flex-1 pb-3 font-ui text-sm uppercase tracking-wider transition-colors flex items-center justify-center gap-2',
                    !isLogin ? 'text-primary border-b-2 border-primary' : 'text-text-secondary hover:text-text-primary'
                  )}
                  onClick={() => setIsLogin(false)}
                  data-testid="register-tab"
                >
                  <UserPlus size={16} /> Registar
                </button>
              </div>

              {/* Form */}
              {isLogin ? (
                <LoginForm onSubmit={handleLogin} loading={loading} error={error} />
              ) : (
                <RegisterForm onSubmit={handleRegister} loading={loading} error={error} />
              )}
            </Card>

            {/* Footer Links */}
            <div className="mt-6 space-y-4">
              <div className="flex justify-center gap-4 flex-wrap">
                {FOOTER_LINKS.map(({ to, icon: Icon, label }) => (
                  <Link
                    key={to}
                    to={to}
                    className="flex items-center gap-1.5 text-text-secondary hover:text-primary transition-colors text-xs sm:text-sm"
                  >
                    <Icon size={14} />
                    <span>{label}</span>
                  </Link>
                ))}
              </div>
              
              <p className="text-center text-text-secondary text-[10px] sm:text-xs">
                Ao jogar, aceitas os{' '}
                <Link to="/termos" className="text-primary hover:underline">Termos</Link>
                {' '}e a{' '}
                <Link to="/privacidade" className="text-primary hover:underline">Privacidade</Link>.
              </p>
              
              <p className="text-center text-text-secondary/50 text-[10px] uppercase tracking-widest">
                SUBMUNDO v1.3.0 • Made with ❤️ in Portugal
              </p>
            </div>
          </div>
        </div>
      </main>
      
      {/* Welcome Modal */}
      <WelcomeModal isOpen={showWelcome} onClose={handleWelcomeClose} />
    </div>
  );
}

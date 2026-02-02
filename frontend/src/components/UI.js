import React, { useState, useEffect, useRef, useMemo, useCallback, createContext, useContext } from 'react';
import clsx from 'clsx';
import { 
  Loader2, X, ChevronDown, ChevronUp, ChevronLeft, ChevronRight,
  Check, AlertTriangle, Info, Bell, Search, Filter, SortAsc, SortDesc,
  Eye, EyeOff, Copy, ExternalLink, MoreVertical, Settings, HelpCircle,
  Calendar, Clock, Star, Heart, Bookmark, Share2, Download, Upload,
  Maximize2, Minimize2, RefreshCw, Trash2, Edit2, Plus, Minus,
  ArrowUp, ArrowDown, ArrowLeft, ArrowRight, TrendingUp, TrendingDown,
  Zap, Shield, Target, Award, Gift, Crown, Flame, Skull
} from 'lucide-react';

// ============================================================================
// NOTIFICATION CONTEXT - Sistema de Notificações em Tempo Real
// ============================================================================

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const addNotification = useCallback((notification) => {
    const id = Date.now() + Math.random();
    const newNotification = {
      id,
      timestamp: new Date(),
      read: false,
      ...notification
    };
    
    setNotifications(prev => [newNotification, ...prev].slice(0, 50));
    setUnreadCount(prev => prev + 1);

    // Auto-remove após timeout se não for persistente
    if (!notification.persistent) {
      setTimeout(() => {
        removeNotification(id);
      }, notification.duration || 5000);
    }

    return id;
  }, []);

  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const markAsRead = useCallback((id) => {
    setNotifications(prev => prev.map(n => 
      n.id === id ? { ...n, read: true } : n
    ));
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
  }, []);

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      addNotification,
      removeNotification,
      markAsRead,
      markAllAsRead,
      clearAll
    }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    return {
      notifications: [],
      unreadCount: 0,
      addNotification: () => {},
      removeNotification: () => {},
      markAsRead: () => {},
      markAllAsRead: () => {},
      clearAll: () => {}
    };
  }
  return context;
};

// ============================================================================
// ANIMATION COMPONENTS
// ============================================================================

export const FadeIn = ({ children, delay = 0, duration = 300, className = '' }) => {
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div
      className={clsx(
        'transition-all',
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4',
        className
      )}
      style={{ transitionDuration: `${duration}ms` }}
    >
      {children}
    </div>
  );
};

export const SlideIn = ({ children, direction = 'left', delay = 0, className = '' }) => {
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  const directionClasses = {
    left: isVisible ? 'translate-x-0' : '-translate-x-full',
    right: isVisible ? 'translate-x-0' : 'translate-x-full',
    up: isVisible ? 'translate-y-0' : '-translate-y-full',
    down: isVisible ? 'translate-y-0' : 'translate-y-full'
  };

  return (
    <div className={clsx(
      'transition-all duration-500',
      directionClasses[direction],
      isVisible ? 'opacity-100' : 'opacity-0',
      className
    )}>
      {children}
    </div>
  );
};

export const ScaleIn = ({ children, delay = 0, className = '' }) => {
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div className={clsx(
      'transition-all duration-300',
      isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0',
      className
    )}>
      {children}
    </div>
  );
};

export const Pulse = ({ children, active = true, className = '' }) => (
  <div className={clsx(active && 'animate-pulse', className)}>
    {children}
  </div>
);

export const Shake = ({ children, active = false, className = '' }) => (
  <div className={clsx(
    active && 'animate-[shake_0.5s_ease-in-out]',
    className
  )}>
    {children}
  </div>
);

export const Bounce = ({ children, active = true, className = '' }) => (
  <div className={clsx(active && 'animate-bounce', className)}>
    {children}
  </div>
);

export const Glow = ({ children, color = 'primary', active = true, className = '' }) => {
  const glowColors = {
    primary: 'shadow-[0_0_20px_rgba(0,255,157,0.5)]',
    error: 'shadow-[0_0_20px_rgba(255,0,60,0.5)]',
    warning: 'shadow-[0_0_20px_rgba(255,214,0,0.5)]',
    success: 'shadow-[0_0_20px_rgba(0,255,157,0.5)]',
    gold: 'shadow-[0_0_20px_rgba(255,170,0,0.5)]'
  };

  return (
    <div className={clsx(active && glowColors[color], className)}>
      {children}
    </div>
  );
};

// ============================================================================
// BUTTON COMPONENT - Expandido
// ============================================================================

export const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon: Icon,
  iconPosition = 'left',
  fullWidth = false,
  rounded = false,
  outline = false,
  pulse = false,
  glow = false,
  tooltip,
  className = '',
  ...props
}) => {
  const [showTooltip, setShowTooltip] = useState(false);

  const variants = {
    primary: outline 
      ? 'bg-transparent border-2 border-primary text-primary hover:bg-primary hover:text-white'
      : 'bg-primary text-white hover:bg-primary/80 hover:shadow-neon',
    secondary: outline
      ? 'bg-transparent border-2 border-border text-text-primary hover:border-primary hover:text-primary'
      : 'bg-transparent border border-border text-text-primary hover:border-primary hover:text-primary',
    ghost: 'bg-transparent text-text-secondary hover:text-text-primary hover:bg-surface-highlight',
    danger: outline
      ? 'bg-transparent border-2 border-error text-error hover:bg-error hover:text-white'
      : 'bg-error text-white hover:bg-error/80',
    success: outline
      ? 'bg-transparent border-2 border-success text-success hover:bg-success hover:text-background'
      : 'bg-success text-background hover:bg-success/80',
    warning: outline
      ? 'bg-transparent border-2 border-warning text-warning hover:bg-warning hover:text-background'
      : 'bg-warning text-background hover:bg-warning/80',
    gold: outline
      ? 'bg-transparent border-2 border-gold text-gold hover:bg-gold hover:text-background'
      : 'bg-gold text-background hover:bg-gold/80',
    dark: 'bg-surface-highlight text-text-primary hover:bg-border',
    link: 'bg-transparent text-primary hover:underline p-0'
  };

  const sizes = {
    xs: 'px-1.5 py-0.5 text-xs',
    sm: 'px-2.5 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base',
    xl: 'px-5 py-2.5 text-lg'
  };

  const glowColors = {
    primary: 'hover:shadow-[0_0_20px_rgba(0,255,157,0.5)]',
    danger: 'hover:shadow-[0_0_20px_rgba(255,0,60,0.5)]',
    warning: 'hover:shadow-[0_0_20px_rgba(255,214,0,0.5)]',
    success: 'hover:shadow-[0_0_20px_rgba(0,255,157,0.5)]',
    gold: 'hover:shadow-[0_0_20px_rgba(255,170,0,0.5)]'
  };

  return (
    <div className="relative inline-flex">
      <button
        className={clsx(
          'font-ui uppercase tracking-wider transition-all duration-200 flex items-center justify-center gap-2',
          variants[variant],
          sizes[size],
          fullWidth && 'w-full',
          rounded && 'rounded-full',
          (disabled || loading) && 'opacity-50 cursor-not-allowed',
          pulse && !disabled && 'animate-pulse',
          glow && glowColors[variant],
          className
        )}
        disabled={disabled || loading}
        onMouseEnter={() => tooltip && setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        {...props}
      >
        {loading ? (
          <Loader2 size={16} className="animate-spin" />
        ) : (
          <>
            {Icon && iconPosition === 'left' && <Icon size={16} />}
            {children}
            {Icon && iconPosition === 'right' && <Icon size={16} />}
          </>
        )}
      </button>
      
      {/* Tooltip */}
      {tooltip && showTooltip && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1 bg-surface border border-border text-xs text-text-primary whitespace-nowrap z-50 animate-fade-in">
          {tooltip}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-border" />
        </div>
      )}
    </div>
  );
};

// ============================================================================
// BUTTON GROUP
// ============================================================================

export const ButtonGroup = ({ children, className = '' }) => (
  <div className={clsx('flex', className)}>
    {React.Children.map(children, (child, index) => (
      <div className={clsx(
        index === 0 && 'rounded-l',
        index === React.Children.count(children) - 1 && 'rounded-r',
        index > 0 && '-ml-px'
      )}>
        {child}
      </div>
    ))}
  </div>
);

// ============================================================================
// INPUT COMPONENT - Expandido
// ============================================================================

export const Input = ({
  label,
  error,
  success,
  hint,
  icon: Icon,
  iconPosition = 'left',
  clearable = false,
  onClear,
  prefix,
  suffix,
  size = 'md',
  variant = 'default',
  className = '',
  containerClassName = '',
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = props.type === 'password';

  const sizes = {
    sm: 'px-3 py-2 text-xs',
    md: 'px-4 py-3 text-sm',
    lg: 'px-5 py-4 text-base'
  };

  const variants = {
    default: error ? 'border-error' : success ? 'border-success' : 'border-border focus:border-primary',
    filled: 'bg-surface-highlight border-transparent focus:border-primary',
    underline: 'border-0 border-b-2 rounded-none bg-transparent'
  };

  return (
    <div className={clsx('w-full', containerClassName)}>
      {label && (
        <label className="block text-xs text-text-secondary uppercase tracking-wider font-ui mb-2">
          {label}
          {props.required && <span className="text-error ml-1">*</span>}
        </label>
      )}
      
      <div className="relative flex items-center">
        {prefix && (
          <span className="absolute left-4 text-text-secondary text-sm">{prefix}</span>
        )}
        
        {Icon && iconPosition === 'left' && (
          <Icon size={18} className="absolute left-4 text-text-secondary" />
        )}
        
        <input
          className={clsx(
            'w-full bg-background border font-body outline-none transition-all',
            variants[variant],
            sizes[size],
            Icon && iconPosition === 'left' && 'pl-12',
            Icon && iconPosition === 'right' && 'pr-12',
            prefix && 'pl-12',
            suffix && 'pr-12',
            (clearable || isPassword) && 'pr-12',
            error && 'focus:shadow-[0_0_10px_rgba(255,0,60,0.3)]',
            success && 'focus:shadow-[0_0_10px_rgba(0,255,157,0.3)]',
            !error && !success && 'focus:shadow-neon',
            className
          )}
          type={isPassword && showPassword ? 'text' : props.type}
          {...props}
        />
        
        {Icon && iconPosition === 'right' && (
          <Icon size={18} className="absolute right-4 text-text-secondary" />
        )}
        
        {suffix && (
          <span className="absolute right-4 text-text-secondary text-sm">{suffix}</span>
        )}
        
        {isPassword && (
          <button
            type="button"
            className="absolute right-4 text-text-secondary hover:text-text-primary transition-colors"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
        
        {clearable && props.value && (
          <button
            type="button"
            className="absolute right-4 text-text-secondary hover:text-text-primary transition-colors"
            onClick={onClear}
          >
            <X size={18} />
          </button>
        )}
      </div>
      
      {(error || success || hint) && (
        <p className={clsx(
          'text-xs mt-1',
          error && 'text-error',
          success && 'text-success',
          !error && !success && 'text-text-secondary'
        )}>
          {error || success || hint}
        </p>
      )}
    </div>
  );
};

// ============================================================================
// SEARCH INPUT
// ============================================================================

export const SearchInput = ({
  value,
  onChange,
  onSearch,
  placeholder = 'Pesquisar...',
  loading = false,
  className = ''
}) => {
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && onSearch) {
      onSearch(value);
    }
  };

  return (
    <div className={clsx('relative', className)}>
      <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyPress={handleKeyPress}
        placeholder={placeholder}
        className="w-full bg-surface border border-border pl-12 pr-4 py-3 text-text-primary font-body text-sm outline-none focus:border-primary transition-all"
      />
      {loading && (
        <Loader2 size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-primary animate-spin" />
      )}
    </div>
  );
};

// ============================================================================
// TEXTAREA
// ============================================================================

export const Textarea = ({
  label,
  error,
  hint,
  maxLength,
  showCount = false,
  className = '',
  ...props
}) => {
  const charCount = props.value?.length || 0;

  return (
    <div className="w-full">
      {label && (
        <label className="block text-xs text-text-secondary uppercase tracking-wider font-ui mb-2">
          {label}
        </label>
      )}
      <textarea
        className={clsx(
          'w-full bg-background border px-4 py-3 text-text-primary font-body outline-none transition-all resize-none',
          error ? 'border-error' : 'border-border focus:border-primary focus:shadow-neon',
          className
        )}
        maxLength={maxLength}
        {...props}
      />
      <div className="flex justify-between mt-1">
        {(error || hint) && (
          <p className={clsx('text-xs', error ? 'text-error' : 'text-text-secondary')}>
            {error || hint}
          </p>
        )}
        {showCount && maxLength && (
          <p className={clsx(
            'text-xs ml-auto',
            charCount >= maxLength ? 'text-error' : 'text-text-secondary'
          )}>
            {charCount}/{maxLength}
          </p>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// SELECT COMPONENT
// ============================================================================

export const Select = ({
  label,
  options = [],
  value,
  onChange,
  placeholder = 'Selecionar...',
  error,
  disabled = false,
  searchable = false,
  multiple = false,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const ref = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = useMemo(() => {
    if (!searchTerm) return options;
    return options.filter(opt => 
      opt.label.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [options, searchTerm]);

  const selectedOption = options.find(opt => opt.value === value);

  return (
    <div className={clsx('w-full relative', className)} ref={ref}>
      {label && (
        <label className="block text-xs text-text-secondary uppercase tracking-wider font-ui mb-2">
          {label}
        </label>
      )}
      
      <button
        type="button"
        className={clsx(
          'w-full bg-background border px-4 py-3 text-left font-body text-sm outline-none transition-all flex items-center justify-between',
          error ? 'border-error' : 'border-border focus:border-primary',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
      >
        <span className={selectedOption ? 'text-text-primary' : 'text-text-secondary'}>
          {selectedOption?.label || placeholder}
        </span>
        <ChevronDown size={18} className={clsx(
          'text-text-secondary transition-transform',
          isOpen && 'rotate-180'
        )} />
      </button>
      
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-surface border border-border shadow-lg max-h-60 overflow-auto animate-fade-in">
          {searchable && (
            <div className="p-2 border-b border-border">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Pesquisar..."
                className="w-full bg-background border border-border px-3 py-2 text-sm text-text-primary outline-none focus:border-primary"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          )}
          
          {filteredOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              className={clsx(
                'w-full px-4 py-3 text-left text-sm transition-colors flex items-center gap-2',
                option.value === value 
                  ? 'bg-primary/20 text-primary' 
                  : 'text-text-primary hover:bg-surface-highlight',
                option.disabled && 'opacity-50 cursor-not-allowed'
              )}
              onClick={() => {
                if (!option.disabled) {
                  onChange(option.value);
                  setIsOpen(false);
                }
              }}
              disabled={option.disabled}
            >
              {option.icon && <option.icon size={16} />}
              {option.label}
              {option.value === value && <Check size={16} className="ml-auto" />}
            </button>
          ))}
          
          {filteredOptions.length === 0 && (
            <p className="px-4 py-3 text-sm text-text-secondary">Sem resultados</p>
          )}
        </div>
      )}
      
      {error && <p className="text-error text-xs mt-1">{error}</p>}
    </div>
  );
};

// ============================================================================
// BADGE COMPONENT - Expandido
// ============================================================================

export const Badge = ({
  children,
  variant = 'default',
  size = 'md',
  rounded = false,
  dot = false,
  icon: Icon,
  removable = false,
  onRemove,
  pulse = false,
  className = ''
}) => {
  const variants = {
    default: 'bg-border text-text-primary',
    primary: 'bg-primary/20 text-primary border border-primary/30',
    secondary: 'bg-secondary/20 text-secondary border border-secondary/30',
    success: 'bg-success/20 text-success border border-success/30',
    warning: 'bg-warning/20 text-warning border border-warning/30',
    error: 'bg-error/20 text-error border border-error/30',
    gold: 'bg-gold/20 text-gold border border-gold/30',
    purple: 'bg-purple-400/20 text-purple-400 border border-purple-400/30',
    cyan: 'bg-cyan-400/20 text-cyan-400 border border-cyan-400/30',
    outline: 'bg-transparent border border-border text-text-primary',
    solid: 'bg-primary text-white'
  };

  const sizes = {
    xs: 'px-1.5 py-0.5 text-[10px]',
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs',
    lg: 'px-3 py-1.5 text-sm'
  };

  const dotColors = {
    default: 'bg-text-secondary',
    primary: 'bg-primary',
    success: 'bg-success',
    warning: 'bg-warning',
    error: 'bg-error',
    gold: 'bg-gold'
  };

  return (
    <span className={clsx(
      'inline-flex items-center gap-1.5 font-ui uppercase tracking-wider',
      variants[variant],
      sizes[size],
      rounded && 'rounded-full',
      pulse && 'animate-pulse',
      className
    )}>
      {dot && (
        <span className={clsx(
          'w-2 h-2 rounded-full',
          dotColors[variant] || dotColors.default
        )} />
      )}
      {Icon && <Icon size={size === 'xs' ? 10 : size === 'sm' ? 12 : 14} />}
      {children}
      {removable && (
        <button
          onClick={onRemove}
          className="ml-1 hover:text-text-primary transition-colors"
        >
          <X size={12} />
        </button>
      )}
    </span>
  );
};

// ============================================================================
// MODAL COMPONENT - Expandido
// ============================================================================

export const Modal = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  size = 'md',
  closable = true,
  closeOnOverlay = true,
  showHeader = true,
  fullScreen = false,
  className = ''
}) => {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleClose = () => {
    setIsAnimating(false);
    setTimeout(onClose, 200);
  };

  if (!isOpen) return null;

  const sizes = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    full: 'max-w-full mx-4'
  };

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-4" 
      data-testid="modal"
    >
      {/* Backdrop */}
      <div 
        className={clsx(
          'absolute inset-0 bg-background/90 backdrop-blur-sm transition-opacity duration-200',
          isAnimating ? 'opacity-100' : 'opacity-0'
        )}
        onClick={closeOnOverlay ? handleClose : undefined}
      />
      
      {/* Modal */}
      <div className={clsx(
        'relative bg-surface border border-border w-full transition-all duration-200',
        fullScreen ? 'h-full max-h-full' : 'max-h-[90vh]',
        sizes[size],
        isAnimating ? 'opacity-100 scale-100' : 'opacity-0 scale-95',
        className
      )}>
        {/* Accent line */}
        <div className="absolute top-0 left-0 w-full h-1 bg-primary" />
        
        {/* Header */}
        {showHeader && (title || closable) && (
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <div>
              <h3 className="font-heading text-lg uppercase tracking-wider text-text-primary">
                {title}
              </h3>
              {subtitle && (
                <p className="text-xs text-text-secondary mt-0.5">{subtitle}</p>
              )}
            </div>
            {closable && (
              <button 
                onClick={handleClose}
                className="text-text-secondary hover:text-text-primary transition-colors p-1"
                data-testid="modal-close"
              >
                <X size={20} />
              </button>
            )}
          </div>
        )}
        
        {/* Content */}
        <div className={clsx(
          'p-4 overflow-y-auto',
          fullScreen ? 'h-[calc(100%-120px)]' : 'max-h-[calc(90vh-120px)]'
        )}>
          {children}
        </div>
        
        {/* Footer */}
        {footer && (
          <div className="px-4 py-3 border-t border-border bg-surface-highlight">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// TOOLTIP COMPONENT
// ============================================================================

export const Tooltip = ({
  children,
  content,
  position = 'top',
  delay = 200,
  className = ''
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const timeoutRef = useRef(null);

  const handleMouseEnter = () => {
    timeoutRef.current = setTimeout(() => setIsVisible(true), delay);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsVisible(false);
  };

  const positions = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2'
  };

  const arrows = {
    top: 'top-full left-1/2 -translate-x-1/2 border-t-surface',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 border-b-surface',
    left: 'left-full top-1/2 -translate-y-1/2 border-l-surface',
    right: 'right-full top-1/2 -translate-y-1/2 border-r-surface'
  };

  return (
    <div 
      className={clsx('relative inline-flex', className)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      {isVisible && content && (
        <div className={clsx(
          'absolute z-50 px-3 py-2 bg-surface border border-border text-xs text-text-primary whitespace-nowrap animate-fade-in',
          positions[position]
        )}>
          {content}
          <div className={clsx(
            'absolute border-4 border-transparent',
            arrows[position]
          )} />
        </div>
      )}
    </div>
  );
};

// ============================================================================
// DROPDOWN MENU
// ============================================================================

export const Dropdown = ({
  trigger,
  items = [],
  position = 'bottom-right',
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const positions = {
    'bottom-left': 'top-full left-0 mt-1',
    'bottom-right': 'top-full right-0 mt-1',
    'top-left': 'bottom-full left-0 mb-1',
    'top-right': 'bottom-full right-0 mb-1'
  };

  return (
    <div className={clsx('relative inline-flex', className)} ref={ref}>
      <div onClick={() => setIsOpen(!isOpen)}>
        {trigger}
      </div>
      
      {isOpen && (
        <div className={clsx(
          'absolute z-50 bg-surface border border-border shadow-lg min-w-[160px] animate-fade-in',
          positions[position]
        )}>
          {items.map((item, index) => (
            item.divider ? (
              <div key={index} className="border-t border-border my-1" />
            ) : (
              <button
                key={index}
                className={clsx(
                  'w-full px-4 py-2 text-left text-sm transition-colors flex items-center gap-2',
                  item.danger ? 'text-error hover:bg-error/10' : 'text-text-primary hover:bg-surface-highlight',
                  item.disabled && 'opacity-50 cursor-not-allowed'
                )}
                onClick={() => {
                  if (!item.disabled && item.onClick) {
                    item.onClick();
                    setIsOpen(false);
                  }
                }}
                disabled={item.disabled}
              >
                {item.icon && <item.icon size={16} />}
                {item.label}
                {item.shortcut && (
                  <span className="ml-auto text-xs text-text-secondary">{item.shortcut}</span>
                )}
              </button>
            )
          ))}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// TABS COMPONENT
// ============================================================================

export const Tabs = ({
  tabs = [],
  activeTab,
  onChange,
  variant = 'default',
  fullWidth = false,
  className = ''
}) => {
  const variants = {
    default: {
      container: 'border-b border-border',
      tab: 'px-4 py-3 -mb-px border-b-2 border-transparent',
      active: 'border-primary text-primary',
      inactive: 'text-text-secondary hover:text-text-primary'
    },
    pills: {
      container: 'gap-2',
      tab: 'px-4 py-2 rounded-full',
      active: 'bg-primary text-white',
      inactive: 'bg-surface-highlight text-text-secondary hover:text-text-primary'
    },
    boxed: {
      container: 'bg-surface-highlight p-1 gap-1',
      tab: 'px-4 py-2',
      active: 'bg-surface text-primary shadow',
      inactive: 'text-text-secondary hover:text-text-primary'
    }
  };

  const style = variants[variant];

  return (
    <div className={clsx('flex', style.container, fullWidth && 'w-full', className)}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          className={clsx(
            'font-ui text-sm uppercase tracking-wider transition-all flex items-center gap-2',
            style.tab,
            fullWidth && 'flex-1 justify-center',
            activeTab === tab.id ? style.active : style.inactive,
            tab.disabled && 'opacity-50 cursor-not-allowed'
          )}
          onClick={() => !tab.disabled && onChange(tab.id)}
          disabled={tab.disabled}
        >
          {tab.icon && <tab.icon size={16} />}
          {tab.label}
          {tab.badge && (
            <Badge variant="primary" size="xs">{tab.badge}</Badge>
          )}
        </button>
      ))}
    </div>
  );
};

// ============================================================================
// ACCORDION COMPONENT
// ============================================================================

export const Accordion = ({
  items = [],
  allowMultiple = false,
  defaultOpen = [],
  className = ''
}) => {
  const [openItems, setOpenItems] = useState(defaultOpen);

  const toggleItem = (id) => {
    if (allowMultiple) {
      setOpenItems(prev => 
        prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
      );
    } else {
      setOpenItems(prev => prev.includes(id) ? [] : [id]);
    }
  };

  return (
    <div className={clsx('border border-border', className)}>
      {items.map((item, index) => (
        <div key={item.id} className={index > 0 ? 'border-t border-border' : ''}>
          <button
            className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-surface-highlight transition-colors"
            onClick={() => toggleItem(item.id)}
          >
            <span className="font-heading text-sm text-text-primary flex items-center gap-2">
              {item.icon && <item.icon size={18} className="text-primary" />}
              {item.title}
            </span>
            <ChevronDown 
              size={18} 
              className={clsx(
                'text-text-secondary transition-transform',
                openItems.includes(item.id) && 'rotate-180'
              )} 
            />
          </button>
          
          {openItems.includes(item.id) && (
            <div className="px-4 pb-4 text-sm text-text-secondary animate-fade-in">
              {item.content}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

// ============================================================================
// ALERT COMPONENT
// ============================================================================

export const Alert = ({
  children,
  variant = 'info',
  title,
  icon: CustomIcon,
  closable = false,
  onClose,
  action,
  className = ''
}) => {
  const [isVisible, setIsVisible] = useState(true);

  const variants = {
    info: { bg: 'bg-primary/10', border: 'border-primary/30', text: 'text-primary', icon: Info },
    success: { bg: 'bg-success/10', border: 'border-success/30', text: 'text-success', icon: Check },
    warning: { bg: 'bg-warning/10', border: 'border-warning/30', text: 'text-warning', icon: AlertTriangle },
    error: { bg: 'bg-error/10', border: 'border-error/30', text: 'text-error', icon: AlertTriangle }
  };

  const style = variants[variant];
  const Icon = CustomIcon || style.icon;

  if (!isVisible) return null;

  return (
    <div className={clsx(
      'p-4 border flex gap-3',
      style.bg,
      style.border,
      className
    )}>
      <Icon size={20} className={style.text} />
      <div className="flex-1">
        {title && (
          <h4 className={clsx('font-heading text-sm mb-1', style.text)}>{title}</h4>
        )}
        <p className="text-sm text-text-primary">{children}</p>
        {action && <div className="mt-2">{action}</div>}
      </div>
      {closable && (
        <button 
          onClick={() => { setIsVisible(false); onClose?.(); }}
          className="text-text-secondary hover:text-text-primary"
        >
          <X size={18} />
        </button>
      )}
    </div>
  );
};

// ============================================================================
// SKELETON LOADER
// ============================================================================

export const Skeleton = ({
  variant = 'text',
  width,
  height,
  count = 1,
  className = ''
}) => {
  const variants = {
    text: 'h-4 rounded',
    title: 'h-6 rounded',
    avatar: 'w-12 h-12 rounded-full',
    thumbnail: 'w-20 h-20',
    card: 'h-32 rounded',
    button: 'h-10 w-24 rounded'
  };

  return (
    <div className={clsx('space-y-2', className)}>
      {Array(count).fill(0).map((_, i) => (
        <div
          key={i}
          className={clsx(
            'bg-surface-highlight animate-pulse',
            variants[variant]
          )}
          style={{ width, height }}
        />
      ))}
    </div>
  );
};

// ============================================================================
// AVATAR COMPONENT
// ============================================================================

export const Avatar = ({
  src,
  alt,
  name,
  size = 'md',
  status,
  badge,
  className = ''
}) => {
  const sizes = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-lg',
    '2xl': 'w-20 h-20 text-xl'
  };

  const statusColors = {
    online: 'bg-success',
    offline: 'bg-text-secondary',
    busy: 'bg-error',
    away: 'bg-warning'
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div className={clsx('relative inline-flex', className)}>
      {src ? (
        <img
          src={src}
          alt={alt || name}
          className={clsx('rounded-full object-cover border border-border', sizes[size])}
        />
      ) : (
        <div className={clsx(
          'rounded-full bg-primary/20 text-primary flex items-center justify-center font-heading border border-primary/30',
          sizes[size]
        )}>
          {getInitials(name)}
        </div>
      )}
      
      {status && (
        <span className={clsx(
          'absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-surface',
          statusColors[status]
        )} />
      )}
      
      {badge && (
        <span className="absolute -top-1 -right-1 bg-error text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
          {badge}
        </span>
      )}
    </div>
  );
};

// ============================================================================
// AVATAR GROUP
// ============================================================================

export const AvatarGroup = ({
  avatars = [],
  max = 4,
  size = 'md',
  className = ''
}) => {
  const visible = avatars.slice(0, max);
  const remaining = avatars.length - max;

  return (
    <div className={clsx('flex -space-x-2', className)}>
      {visible.map((avatar, i) => (
        <Avatar key={i} {...avatar} size={size} className="ring-2 ring-surface" />
      ))}
      {remaining > 0 && (
        <div className={clsx(
          'rounded-full bg-surface-highlight text-text-secondary flex items-center justify-center font-heading ring-2 ring-surface',
          size === 'sm' ? 'w-8 h-8 text-xs' : 'w-10 h-10 text-sm'
        )}>
          +{remaining}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// TOGGLE / SWITCH
// ============================================================================

export const Toggle = ({
  checked,
  onChange,
  label,
  disabled = false,
  size = 'md',
  className = ''
}) => {
  const sizes = {
    sm: { track: 'w-8 h-4', thumb: 'w-3 h-3', translate: 'translate-x-4' },
    md: { track: 'w-10 h-5', thumb: 'w-4 h-4', translate: 'translate-x-5' },
    lg: { track: 'w-12 h-6', thumb: 'w-5 h-5', translate: 'translate-x-6' }
  };

  const style = sizes[size];

  return (
    <label className={clsx(
      'inline-flex items-center gap-3 cursor-pointer',
      disabled && 'opacity-50 cursor-not-allowed',
      className
    )}>
      <div className="relative">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => !disabled && onChange(e.target.checked)}
          disabled={disabled}
          className="sr-only"
        />
        <div className={clsx(
          'rounded-full transition-colors',
          style.track,
          checked ? 'bg-primary' : 'bg-border'
        )} />
        <div className={clsx(
          'absolute top-0.5 left-0.5 rounded-full bg-white transition-transform',
          style.thumb,
          checked && style.translate
        )} />
      </div>
      {label && <span className="text-sm text-text-primary">{label}</span>}
    </label>
  );
};

// ============================================================================
// CHECKBOX
// ============================================================================

export const Checkbox = ({
  checked,
  onChange,
  label,
  indeterminate = false,
  disabled = false,
  className = ''
}) => (
  <label className={clsx(
    'inline-flex items-center gap-2 cursor-pointer',
    disabled && 'opacity-50 cursor-not-allowed',
    className
  )}>
    <div className={clsx(
      'w-5 h-5 border flex items-center justify-center transition-colors',
      checked || indeterminate 
        ? 'bg-primary border-primary' 
        : 'bg-background border-border hover:border-primary'
    )}>
      {checked && <Check size={14} className="text-white" />}
      {indeterminate && !checked && <Minus size={14} className="text-white" />}
    </div>
    {label && <span className="text-sm text-text-primary">{label}</span>}
    <input
      type="checkbox"
      checked={checked}
      onChange={(e) => !disabled && onChange(e.target.checked)}
      disabled={disabled}
      className="sr-only"
    />
  </label>
);

// ============================================================================
// RADIO GROUP
// ============================================================================

export const RadioGroup = ({
  options = [],
  value,
  onChange,
  name,
  direction = 'vertical',
  disabled = false,
  className = ''
}) => (
  <div className={clsx(
    'flex gap-3',
    direction === 'vertical' ? 'flex-col' : 'flex-row flex-wrap',
    className
  )}>
    {options.map((option) => (
      <label
        key={option.value}
        className={clsx(
          'inline-flex items-center gap-2 cursor-pointer',
          (disabled || option.disabled) && 'opacity-50 cursor-not-allowed'
        )}
      >
        <div className={clsx(
          'w-5 h-5 rounded-full border flex items-center justify-center transition-colors',
          value === option.value 
            ? 'border-primary' 
            : 'border-border hover:border-primary'
        )}>
          {value === option.value && (
            <div className="w-3 h-3 rounded-full bg-primary" />
          )}
        </div>
        <span className="text-sm text-text-primary">{option.label}</span>
        <input
          type="radio"
          name={name}
          value={option.value}
          checked={value === option.value}
          onChange={() => !disabled && !option.disabled && onChange(option.value)}
          disabled={disabled || option.disabled}
          className="sr-only"
        />
      </label>
    ))}
  </div>
);

// ============================================================================
// SLIDER / RANGE
// ============================================================================

export const Slider = ({
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  label,
  showValue = true,
  disabled = false,
  className = ''
}) => {
  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <div className={clsx('w-full', className)}>
      {(label || showValue) && (
        <div className="flex justify-between mb-2">
          {label && <span className="text-xs text-text-secondary uppercase tracking-wider">{label}</span>}
          {showValue && <span className="text-xs text-text-primary font-body">{value}</span>}
        </div>
      )}
      <div className="relative h-2">
        <div className="absolute inset-0 bg-border rounded-full" />
        <div 
          className="absolute left-0 top-0 h-full bg-primary rounded-full"
          style={{ width: `${percentage}%` }}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => !disabled && onChange(Number(e.target.value))}
          disabled={disabled}
          className="absolute inset-0 w-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
        />
        <div 
          className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white border-2 border-primary rounded-full shadow"
          style={{ left: `calc(${percentage}% - 8px)` }}
        />
      </div>
    </div>
  );
};

// ============================================================================
// NOTIFICATION TOAST
// ============================================================================

export const Toast = ({
  id,
  type = 'info',
  title,
  message,
  duration,
  onClose
}) => {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (duration) {
      const timer = setTimeout(() => {
        setIsExiting(true);
        setTimeout(() => onClose?.(id), 300);
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, id, onClose]);

  const types = {
    info: { bg: 'bg-primary/20', border: 'border-primary', icon: Info, color: 'text-primary' },
    success: { bg: 'bg-success/20', border: 'border-success', icon: Check, color: 'text-success' },
    warning: { bg: 'bg-warning/20', border: 'border-warning', icon: AlertTriangle, color: 'text-warning' },
    error: { bg: 'bg-error/20', border: 'border-error', icon: AlertTriangle, color: 'text-error' }
  };

  const style = types[type];
  const Icon = style.icon;

  return (
    <div className={clsx(
      'flex items-start gap-3 p-4 border shadow-lg transition-all duration-300',
      style.bg,
      style.border,
      isExiting ? 'opacity-0 translate-x-full' : 'opacity-100 translate-x-0'
    )}>
      <Icon size={20} className={style.color} />
      <div className="flex-1">
        {title && <p className={clsx('font-heading text-sm', style.color)}>{title}</p>}
        <p className="text-sm text-text-primary">{message}</p>
      </div>
      <button onClick={() => onClose?.(id)} className="text-text-secondary hover:text-text-primary">
        <X size={18} />
      </button>
    </div>
  );
};

// ============================================================================
// TOAST CONTAINER
// ============================================================================

export const ToastContainer = ({ toasts = [], onClose }) => (
  <div className="fixed bottom-4 right-4 z-[200] flex flex-col gap-2 max-w-sm w-full">
    {toasts.map((toast) => (
      <Toast key={toast.id} {...toast} onClose={onClose} />
    ))}
  </div>
);

// ============================================================================
// EMPTY STATE
// ============================================================================

export const EmptyState = ({
  icon: Icon = Target,
  title,
  description,
  action,
  className = ''
}) => (
  <div className={clsx('text-center py-12', className)}>
    <div className="w-16 h-16 mx-auto mb-4 bg-surface-highlight border border-border flex items-center justify-center">
      <Icon size={32} className="text-text-secondary" />
    </div>
    {title && <h3 className="font-heading text-lg text-text-primary mb-2">{title}</h3>}
    {description && <p className="text-text-secondary text-sm mb-4 max-w-md mx-auto">{description}</p>}
    {action}
  </div>
);

// ============================================================================
// LOADING SPINNER
// ============================================================================

export const Spinner = ({ size = 'md', className = '' }) => {
  const sizes = { sm: 16, md: 24, lg: 32, xl: 48 };
  return <Loader2 size={sizes[size]} className={clsx('animate-spin text-primary', className)} />;
};

// ============================================================================
// LOADING OVERLAY
// ============================================================================

export const LoadingOverlay = ({ isLoading, message = 'A carregar...' }) => {
  if (!isLoading) return null;
  return (
    <div className="fixed inset-0 z-[300] bg-background/80 backdrop-blur-sm flex items-center justify-center">
      <div className="text-center">
        <Spinner size="xl" />
        <p className="text-text-secondary mt-4">{message}</p>
      </div>
    </div>
  );
};

// ============================================================================
// DIVIDER
// ============================================================================

export const Divider = ({ label, className = '' }) => (
  <div className={clsx('flex items-center gap-4', className)}>
    <div className="flex-1 border-t border-border" />
    {label && <span className="text-xs text-text-secondary uppercase tracking-wider">{label}</span>}
    <div className="flex-1 border-t border-border" />
  </div>
);

// ============================================================================
// COPY BUTTON
// ============================================================================

export const CopyButton = ({ text, className = '' }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className={clsx(
        'p-2 hover:bg-surface-highlight transition-colors',
        copied ? 'text-success' : 'text-text-secondary',
        className
      )}
    >
      {copied ? <Check size={16} /> : <Copy size={16} />}
    </button>
  );
};

// ============================================================================
// COUNTDOWN TIMER
// ============================================================================

export const CountdownTimer = ({ targetDate, onComplete, className = '' }) => {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const calculateTime = () => {
      const diff = new Date(targetDate) - new Date();
      if (diff <= 0) {
        onComplete?.();
        return { days: 0, hours: 0, minutes: 0, seconds: 0 };
      }
      return {
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / (1000 * 60)) % 60),
        seconds: Math.floor((diff / 1000) % 60)
      };
    };

    setTimeLeft(calculateTime());
    const interval = setInterval(() => setTimeLeft(calculateTime()), 1000);
    return () => clearInterval(interval);
  }, [targetDate, onComplete]);

  return (
    <div className={clsx('flex gap-2', className)}>
      {Object.entries(timeLeft).map(([unit, value]) => (
        <div key={unit} className="bg-surface border border-border px-3 py-2 text-center">
          <p className="text-xl font-body text-primary">{String(value).padStart(2, '0')}</p>
          <p className="text-[10px] text-text-secondary uppercase">{unit}</p>
        </div>
      ))}
    </div>
  );
};

// ============================================================================
// CONFIRM DIALOG
// ============================================================================

export const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirmar',
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  variant = 'danger',
  loading = false
}) => (
  <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
    <div className="space-y-4">
      <p className="text-text-secondary">{message}</p>
      <div className="flex gap-3">
        <Button variant="secondary" fullWidth onClick={onClose} disabled={loading}>
          {cancelText}
        </Button>
        <Button variant={variant} fullWidth onClick={onConfirm} loading={loading}>
          {confirmText}
        </Button>
      </div>
    </div>
  </Modal>
);

// ============================================================================
// FILTER BAR
// ============================================================================

export const FilterBar = ({
  filters = [],
  activeFilters = {},
  onFilterChange,
  onClearAll,
  className = ''
}) => {
  const activeCount = Object.values(activeFilters).filter(v => v !== null && v !== undefined && v !== '').length;

  return (
    <div className={clsx('flex items-center gap-4 flex-wrap', className)}>
      <div className="flex items-center gap-2 text-text-secondary">
        <Filter size={18} />
        <span className="text-sm">Filtros</span>
        {activeCount > 0 && (
          <Badge variant="primary" size="xs">{activeCount}</Badge>
        )}
      </div>
      
      {filters.map((filter) => (
        <Select
          key={filter.id}
          options={filter.options}
          value={activeFilters[filter.id]}
          onChange={(value) => onFilterChange(filter.id, value)}
          placeholder={filter.placeholder}
          className="min-w-[150px]"
        />
      ))}
      
      {activeCount > 0 && (
        <Button variant="ghost" size="sm" onClick={onClearAll}>
          Limpar filtros
        </Button>
      )}
    </div>
  );
};

// ============================================================================
// SORT BUTTON
// ============================================================================

export const SortButton = ({
  label,
  active = false,
  direction = 'asc',
  onClick,
  className = ''
}) => (
  <button
    onClick={onClick}
    className={clsx(
      'flex items-center gap-1 text-sm transition-colors',
      active ? 'text-primary' : 'text-text-secondary hover:text-text-primary',
      className
    )}
  >
    {label}
    {active && (direction === 'asc' ? <SortAsc size={14} /> : <SortDesc size={14} />)}
  </button>
);

// ============================================================================
// PAGINATION
// ============================================================================

export const Pagination = ({
  currentPage,
  totalPages,
  onPageChange,
  showFirstLast = true,
  className = ''
}) => {
  const pages = useMemo(() => {
    const result = [];
    const start = Math.max(1, currentPage - 2);
    const end = Math.min(totalPages, currentPage + 2);
    
    for (let i = start; i <= end; i++) {
      result.push(i);
    }
    return result;
  }, [currentPage, totalPages]);

  return (
    <div className={clsx('flex items-center gap-1', className)}>
      {showFirstLast && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
        >
          <ChevronLeft size={16} /><ChevronLeft size={16} className="-ml-2" />
        </Button>
      )}
      
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
      >
        <ChevronLeft size={16} />
      </Button>
      
      {pages[0] > 1 && <span className="px-2 text-text-secondary">...</span>}
      
      {pages.map((page) => (
        <Button
          key={page}
          variant={page === currentPage ? 'primary' : 'ghost'}
          size="sm"
          onClick={() => onPageChange(page)}
        >
          {page}
        </Button>
      ))}
      
      {pages[pages.length - 1] < totalPages && <span className="px-2 text-text-secondary">...</span>}
      
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        <ChevronRight size={16} />
      </Button>
      
      {showFirstLast && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
        >
          <ChevronRight size={16} /><ChevronRight size={16} className="-ml-2" />
        </Button>
      )}
    </div>
  );
};

// ============================================================================
// NOTIFICATION BELL
// ============================================================================

export const NotificationBell = ({ className = '' }) => {
  const { notifications, unreadCount, markAllAsRead } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dropdown
      trigger={
        <button className={clsx('relative p-2 hover:bg-surface-highlight transition-colors', className)}>
          <Bell size={20} className="text-text-secondary" />
          {unreadCount > 0 && (
            <span className="absolute top-0 right-0 bg-error text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      }
      items={[
        ...notifications.slice(0, 5).map(n => ({
          label: n.message,
          icon: n.read ? Check : Bell,
          onClick: () => {}
        })),
        { divider: true },
        { label: 'Marcar tudo como lido', onClick: markAllAsRead }
      ]}
      position="bottom-right"
    />
  );
};

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  Button,
  ButtonGroup,
  Input,
  SearchInput,
  Textarea,
  Select,
  Badge,
  Modal,
  Tooltip,
  Dropdown,
  Tabs,
  Accordion,
  Alert,
  Skeleton,
  Avatar,
  AvatarGroup,
  Toggle,
  Checkbox,
  RadioGroup,
  Slider,
  Toast,
  ToastContainer,
  EmptyState,
  Spinner,
  LoadingOverlay,
  Divider,
  CopyButton,
  CountdownTimer,
  ConfirmDialog,
  FilterBar,
  SortButton,
  Pagination,
  NotificationBell,
  FadeIn,
  SlideIn,
  ScaleIn,
  Pulse,
  Shake,
  Bounce,
  Glow,
  NotificationProvider,
  useNotifications
};

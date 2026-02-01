import clsx from 'clsx';
import { Loader2 } from 'lucide-react';

export const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon: Icon,
  iconPosition = 'left',
  fullWidth = false,
  className = '',
  ...props
}) => {
  const variants = {
    primary: 'bg-primary text-white hover:bg-primary/80 hover:shadow-neon',
    secondary: 'bg-transparent border border-border text-text-primary hover:border-primary hover:text-primary',
    ghost: 'bg-transparent text-text-secondary hover:text-text-primary hover:bg-surface-highlight',
    danger: 'bg-error text-white hover:bg-error/80',
    success: 'bg-success text-background hover:bg-success/80',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  return (
    <button
      className={clsx(
        'font-ui uppercase tracking-wider transition-all duration-200 flex items-center justify-center gap-2',
        variants[variant],
        sizes[size],
        fullWidth && 'w-full',
        (disabled || loading) && 'opacity-50 cursor-not-allowed',
        className
      )}
      disabled={disabled || loading}
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
  );
};

export const Input = ({
  label,
  error,
  className = '',
  ...props
}) => {
  return (
    <div className={clsx('w-full', className)}>
      {label && (
        <label className="block text-xs text-text-secondary uppercase tracking-wider font-ui mb-2">
          {label}
        </label>
      )}
      <input
        className={clsx(
          'w-full bg-background border px-4 py-3 text-text-primary font-body outline-none transition-all',
          error ? 'border-error' : 'border-border focus:border-primary focus:shadow-neon'
        )}
        {...props}
      />
      {error && (
        <p className="text-error text-xs mt-1">{error}</p>
      )}
    </div>
  );
};

export const Badge = ({
  children,
  variant = 'default',
  className = ''
}) => {
  const variants = {
    default: 'bg-border text-text-primary',
    primary: 'bg-primary/20 text-primary border border-primary/30',
    success: 'bg-success/20 text-success border border-success/30',
    warning: 'bg-warning/20 text-warning border border-warning/30',
    error: 'bg-error/20 text-error border border-error/30',
    gold: 'bg-gold/20 text-gold border border-gold/30',
  };

  return (
    <span className={clsx(
      'inline-flex items-center px-2 py-0.5 text-xs font-ui uppercase tracking-wider',
      variants[variant],
      className
    )}>
      {children}
    </span>
  );
};

export const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  className = ''
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" data-testid="modal">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-background/90 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className={clsx(
        'relative bg-surface border border-border w-full max-w-md animate-fade-in',
        className
      )}>
        {/* Accent line */}
        <div className="absolute top-0 left-0 w-full h-1 bg-primary" />
        
        {/* Header */}
        {title && (
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <h3 className="font-heading text-lg uppercase tracking-wider text-text-primary">
              {title}
            </h3>
            <button 
              onClick={onClose}
              className="text-text-secondary hover:text-text-primary transition-colors"
              data-testid="modal-close"
            >
              ✕
            </button>
          </div>
        )}
        
        {/* Content */}
        <div className="p-4">
          {children}
        </div>
      </div>
    </div>
  );
};

import clsx from 'clsx';

export const ProgressBar = ({ 
  value = 0, 
  max = 100, 
  color = 'primary',
  showLabel = true,
  label = '',
  height = 'h-2',
  className = ''
}) => {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));
  
  const colorClasses = {
    primary: 'bg-primary',
    success: 'bg-success',
    warning: 'bg-warning',
    error: 'bg-error',
    secondary: 'bg-secondary',
    gold: 'bg-gold',
  };

  return (
    <div className={clsx('w-full', className)}>
      {showLabel && (
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs text-text-secondary uppercase tracking-wider font-ui">
            {label}
          </span>
          <span className="text-xs font-body text-text-primary">
            {value}/{max}
          </span>
        </div>
      )}
      <div className={clsx('w-full bg-border overflow-hidden', height)}>
        <div 
          className={clsx('h-full transition-all duration-300', colorClasses[color])}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

export const StatCard = ({ 
  icon: Icon, 
  label, 
  value, 
  subValue,
  color = 'primary',
  onClick,
  className = ''
}) => {
  const colorClasses = {
    primary: 'border-l-primary',
    success: 'border-l-success',
    warning: 'border-l-warning',
    error: 'border-l-error',
    secondary: 'border-l-secondary',
    gold: 'border-l-gold',
  };

  const textColorClasses = {
    primary: 'text-primary',
    success: 'text-success',
    warning: 'text-warning',
    error: 'text-error',
    secondary: 'text-secondary',
    gold: 'text-gold',
  };

  return (
    <div 
      className={clsx(
        'bg-surface border border-border border-l-2 p-4 transition-all',
        colorClasses[color],
        onClick && 'cursor-pointer hover:bg-surface-highlight hover:translate-x-1',
        className
      )}
      onClick={onClick}
      data-testid={`stat-card-${label?.toLowerCase().replace(/\s/g, '-')}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-text-secondary uppercase tracking-wider font-ui mb-1">
            {label}
          </p>
          <p className={clsx('text-2xl font-body font-semibold', textColorClasses[color])}>
            {value}
          </p>
          {subValue && (
            <p className="text-xs text-text-secondary mt-1">{subValue}</p>
          )}
        </div>
        {Icon && (
          <Icon size={24} className={textColorClasses[color]} />
        )}
      </div>
    </div>
  );
};

export const Card = ({ 
  children, 
  title, 
  subtitle,
  icon: Icon,
  className = '',
  headerAction,
  noPadding = false,
  onClick
}) => {
  return (
    <div 
      className={clsx(
        'bg-surface border border-border relative',
        onClick && 'cursor-pointer hover:border-primary/50 transition-colors',
        className
      )}
      onClick={onClick}
    >
      {/* Accent line */}
      <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
      
      {title && (
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="flex items-center gap-3">
            {Icon && <Icon size={18} className="text-primary" />}
            <div>
              <h3 className="font-heading text-sm uppercase tracking-wider text-text-primary">
                {title}
              </h3>
              {subtitle && (
                <p className="text-xs text-text-secondary">{subtitle}</p>
              )}
            </div>
          </div>
          {headerAction}
        </div>
      )}
      
      <div className={clsx(!noPadding && 'p-4')}>
        {children}
      </div>
    </div>
  );
};

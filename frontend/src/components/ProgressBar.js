import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import clsx from 'clsx';
import {
  TrendingUp, TrendingDown, Minus, ChevronRight, ChevronDown, ChevronUp,
  Info, AlertTriangle, Check, X, Zap, Star, Target, Clock,
  ArrowUp, ArrowDown, Activity, BarChart2, PieChart, Layers
} from 'lucide-react';

// ============================================================================
// CONSTANTES E HELPERS
// ============================================================================

const COLOR_CLASSES = {
  primary: { bg: 'bg-primary', text: 'text-primary', border: 'border-primary', glow: 'shadow-[0_0_10px_rgba(0,255,157,0.5)]' },
  success: { bg: 'bg-success', text: 'text-success', border: 'border-success', glow: 'shadow-[0_0_10px_rgba(0,255,157,0.5)]' },
  warning: { bg: 'bg-warning', text: 'text-warning', border: 'border-warning', glow: 'shadow-[0_0_10px_rgba(255,214,0,0.5)]' },
  error: { bg: 'bg-error', text: 'text-error', border: 'border-error', glow: 'shadow-[0_0_10px_rgba(255,0,60,0.5)]' },
  secondary: { bg: 'bg-secondary', text: 'text-secondary', border: 'border-secondary', glow: 'shadow-[0_0_10px_rgba(0,212,255,0.5)]' },
  gold: { bg: 'bg-gold', text: 'text-gold', border: 'border-gold', glow: 'shadow-[0_0_10px_rgba(255,170,0,0.5)]' },
  purple: { bg: 'bg-purple-400', text: 'text-purple-400', border: 'border-purple-400', glow: 'shadow-[0_0_10px_rgba(167,139,250,0.5)]' },
  cyan: { bg: 'bg-cyan-400', text: 'text-cyan-400', border: 'border-cyan-400', glow: 'shadow-[0_0_10px_rgba(34,211,238,0.5)]' }
};

const formatNumber = (num, decimals = 0) => {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toLocaleString('pt-PT', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
};

const calculatePercentage = (value, max) => Math.min(100, Math.max(0, (value / max) * 100));

// ============================================================================
// PROGRESS BAR - Componente Base Expandido
// ============================================================================

export const ProgressBar = ({ 
  value = 0, 
  max = 100, 
  color = 'primary',
  showLabel = true,
  label = '',
  height = 'h-2',
  animated = false,
  striped = false,
  glow = false,
  showPercentage = false,
  gradient = false,
  gradientColors = ['primary', 'secondary'],
  tooltip,
  onChange,
  interactive = false,
  segments,
  markers = [],
  className = ''
}) => {
  const percentage = calculatePercentage(value, max);
  const [hoveredValue, setHoveredValue] = useState(null);
  const barRef = useRef(null);

  const handleClick = useCallback((e) => {
    if (!interactive || !onChange) return;
    const rect = barRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const newPercentage = (x / rect.width) * 100;
    const newValue = (newPercentage / 100) * max;
    onChange(Math.round(newValue));
  }, [interactive, onChange, max]);

  const handleMouseMove = useCallback((e) => {
    if (!interactive) return;
    const rect = barRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const newPercentage = (x / rect.width) * 100;
    setHoveredValue(Math.round((newPercentage / 100) * max));
  }, [interactive, max]);

  const colorStyle = COLOR_CLASSES[color] || COLOR_CLASSES.primary;

  return (
    <div className={clsx('w-full', className)}>
      {showLabel && (
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs text-text-secondary uppercase tracking-wider font-ui">
            {label}
          </span>
          <div className="flex items-center gap-2">
            {showPercentage && (
              <span className={clsx('text-xs font-body', colorStyle.text)}>
                {percentage.toFixed(0)}%
              </span>
            )}
            <span className="text-xs font-body text-text-primary">
              {formatNumber(value)}/{formatNumber(max)}
            </span>
          </div>
        </div>
      )}
      
      <div 
        ref={barRef}
        className={clsx(
          'w-full bg-border overflow-hidden relative',
          height,
          interactive && 'cursor-pointer',
          glow && percentage > 80 && colorStyle.glow
        )}
        onClick={handleClick}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoveredValue(null)}
      >
        {/* Segments Mode */}
        {segments ? (
          <div className="flex h-full gap-0.5">
            {Array(segments).fill(0).map((_, i) => {
              const segmentPercentage = ((i + 1) / segments) * 100;
              const isFilled = percentage >= segmentPercentage;
              return (
                <div 
                  key={i}
                  className={clsx(
                    'flex-1 h-full transition-all duration-300',
                    isFilled ? colorStyle.bg : 'bg-border'
                  )}
                />
              );
            })}
          </div>
        ) : (
          /* Normal Mode */
          <div 
            className={clsx(
              'h-full transition-all duration-500 relative',
              gradient 
                ? `bg-gradient-to-r from-${gradientColors[0]} to-${gradientColors[1]}`
                : colorStyle.bg,
              animated && 'animate-pulse',
              striped && 'bg-stripes'
            )}
            style={{ width: `${percentage}%` }}
          >
            {striped && (
              <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,.15)25%,transparent_25%,transparent_50%,rgba(255,255,255,.15)50%,rgba(255,255,255,.15)75%,transparent_75%,transparent)] bg-[length:1rem_1rem] animate-[stripes_1s_linear_infinite]" />
            )}
          </div>
        )}
        
        {/* Markers */}
        {markers.map((marker, i) => (
          <div
            key={i}
            className="absolute top-0 h-full w-0.5 bg-text-primary/50"
            style={{ left: `${(marker.value / max) * 100}%` }}
            title={marker.label}
          />
        ))}
        
        {/* Hover indicator */}
        {hoveredValue !== null && interactive && (
          <div
            className="absolute top-0 h-full w-0.5 bg-white/50"
            style={{ left: `${(hoveredValue / max) * 100}%` }}
          />
        )}
      </div>
      
      {/* Tooltip */}
      {tooltip && hoveredValue !== null && (
        <div className="text-xs text-text-secondary mt-1">
          {tooltip.replace('{value}', hoveredValue)}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// CIRCULAR PROGRESS
// ============================================================================

export const CircularProgress = ({
  value = 0,
  max = 100,
  size = 'md',
  color = 'primary',
  strokeWidth = 4,
  showValue = true,
  label,
  icon: Icon,
  animated = true,
  glow = false,
  className = ''
}) => {
  const [animatedValue, setAnimatedValue] = useState(0);
  const percentage = calculatePercentage(value, max);

  useEffect(() => {
    if (animated) {
      const timer = setTimeout(() => setAnimatedValue(percentage), 100);
      return () => clearTimeout(timer);
    } else {
      setAnimatedValue(percentage);
    }
  }, [percentage, animated]);

  const sizes = {
    xs: { width: 40, fontSize: 'text-xs' },
    sm: { width: 60, fontSize: 'text-sm' },
    md: { width: 80, fontSize: 'text-base' },
    lg: { width: 100, fontSize: 'text-lg' },
    xl: { width: 120, fontSize: 'text-xl' }
  };

  const { width, fontSize } = sizes[size] || sizes.md;
  const radius = (width - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (animatedValue / 100) * circumference;

  const colorStyle = COLOR_CLASSES[color] || COLOR_CLASSES.primary;

  return (
    <div className={clsx('relative inline-flex items-center justify-center', className)}>
      <svg width={width} height={width} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={width / 2}
          cy={width / 2}
          r={radius}
          fill="transparent"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-border"
        />
        {/* Progress circle */}
        <circle
          cx={width / 2}
          cy={width / 2}
          r={radius}
          fill="transparent"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className={clsx(
            colorStyle.text,
            'transition-all duration-1000 ease-out',
            glow && animatedValue > 80 && colorStyle.glow
          )}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {Icon && <Icon size={width / 4} className={colorStyle.text} />}
        {showValue && !Icon && (
          <span className={clsx('font-body font-semibold', fontSize, colorStyle.text)}>
            {Math.round(animatedValue)}%
          </span>
        )}
        {label && (
          <span className="text-[10px] text-text-secondary uppercase tracking-wider">
            {label}
          </span>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// STAT CARD - Expandido
// ============================================================================

export const StatCard = ({ 
  icon: Icon, 
  label, 
  value, 
  subValue,
  previousValue,
  color = 'primary',
  trend,
  trendValue,
  showTrend = false,
  sparkline = [],
  onClick,
  loading = false,
  tooltip,
  badge,
  progress,
  progressMax,
  size = 'md',
  variant = 'default',
  animated = true,
  className = ''
}) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [animatedValue, setAnimatedValue] = useState(0);

  const colorStyle = COLOR_CLASSES[color] || COLOR_CLASSES.primary;

  // Animate number on mount
  useEffect(() => {
    if (!animated || typeof value !== 'number') {
      setAnimatedValue(value);
      return;
    }
    
    const duration = 1000;
    const steps = 60;
    const increment = value / steps;
    let current = 0;
    
    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setAnimatedValue(value);
        clearInterval(timer);
      } else {
        setAnimatedValue(Math.floor(current));
      }
    }, duration / steps);
    
    return () => clearInterval(timer);
  }, [value, animated]);

  // Calculate trend
  const calculatedTrend = useMemo(() => {
    if (trend) return trend;
    if (previousValue === undefined || previousValue === 0) return null;
    const diff = ((value - previousValue) / previousValue) * 100;
    return diff > 0 ? 'up' : diff < 0 ? 'down' : 'stable';
  }, [value, previousValue, trend]);

  const calculatedTrendValue = useMemo(() => {
    if (trendValue) return trendValue;
    if (previousValue === undefined || previousValue === 0) return null;
    return Math.abs(((value - previousValue) / previousValue) * 100).toFixed(1);
  }, [value, previousValue, trendValue]);

  const sizes = {
    sm: { padding: 'p-3', iconSize: 20, valueSize: 'text-xl', labelSize: 'text-[10px]' },
    md: { padding: 'p-4', iconSize: 24, valueSize: 'text-2xl', labelSize: 'text-xs' },
    lg: { padding: 'p-5', iconSize: 28, valueSize: 'text-3xl', labelSize: 'text-sm' }
  };

  const sizeStyle = sizes[size] || sizes.md;

  const variants = {
    default: 'bg-surface border-l-2',
    outlined: 'bg-transparent border-2',
    filled: `${colorStyle.bg}/10 border-l-2`,
    minimal: 'bg-transparent border-b',
    gradient: 'bg-gradient-to-br from-surface to-surface-highlight border-l-2'
  };

  if (loading) {
    return (
      <div className={clsx(
        'border border-border',
        variants[variant],
        colorStyle.border,
        sizeStyle.padding,
        className
      )}>
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-border rounded w-1/2" />
          <div className="h-8 bg-border rounded w-3/4" />
        </div>
      </div>
    );
  }

  return (
    <div 
      className={clsx(
        'border border-border transition-all relative',
        variants[variant],
        `border-l-${color}`,
        onClick && 'cursor-pointer hover:bg-surface-highlight hover:translate-x-1',
        className
      )}
      style={{ borderLeftColor: colorStyle.bg.replace('bg-', '') }}
      onClick={onClick}
      onMouseEnter={() => tooltip && setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      data-testid={`stat-card-${label?.toLowerCase().replace(/\s/g, '-')}`}
    >
      {/* Badge */}
      {badge && (
        <div className="absolute top-2 right-2">
          <span className={clsx(
            'px-2 py-0.5 text-[10px] font-ui uppercase',
            `${colorStyle.bg}/20 ${colorStyle.text} border ${colorStyle.border}/30`
          )}>
            {badge}
          </span>
        </div>
      )}

      <div className={sizeStyle.padding}>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            {/* Label */}
            <p className={clsx(
              'text-text-secondary uppercase tracking-wider font-ui mb-1',
              sizeStyle.labelSize
            )}>
              {label}
            </p>
            
            {/* Value */}
            <div className="flex items-baseline gap-2">
              <p className={clsx(
                'font-body font-semibold',
                sizeStyle.valueSize,
                colorStyle.text
              )}>
                {typeof animatedValue === 'number' ? formatNumber(animatedValue) : value}
              </p>
              
              {/* Trend Indicator */}
              {showTrend && calculatedTrend && (
                <div className={clsx(
                  'flex items-center gap-0.5 text-sm',
                  calculatedTrend === 'up' && 'text-success',
                  calculatedTrend === 'down' && 'text-error',
                  calculatedTrend === 'stable' && 'text-text-secondary'
                )}>
                  {calculatedTrend === 'up' && <ArrowUp size={14} />}
                  {calculatedTrend === 'down' && <ArrowDown size={14} />}
                  {calculatedTrend === 'stable' && <Minus size={14} />}
                  {calculatedTrendValue && <span>{calculatedTrendValue}%</span>}
                </div>
              )}
            </div>
            
            {/* Sub Value */}
            {subValue && (
              <p className="text-xs text-text-secondary mt-1">{subValue}</p>
            )}
            
            {/* Progress Bar */}
            {progress !== undefined && progressMax && (
              <div className="mt-3">
                <ProgressBar
                  value={progress}
                  max={progressMax}
                  color={color}
                  height="h-1"
                  showLabel={false}
                />
              </div>
            )}
          </div>
          
          {/* Icon */}
          {Icon && (
            <div className={clsx(
              'p-2 rounded',
              `${colorStyle.bg}/10`
            )}>
              <Icon size={sizeStyle.iconSize} className={colorStyle.text} />
            </div>
          )}
        </div>
        
        {/* Sparkline */}
        {sparkline.length > 0 && (
          <div className="mt-3">
            <MiniSparkline data={sparkline} color={color} height={30} />
          </div>
        )}
      </div>
      
      {/* Tooltip */}
      {tooltip && showTooltip && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-surface border border-border text-xs text-text-primary whitespace-nowrap z-50 animate-fade-in">
          {tooltip}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// MINI SPARKLINE
// ============================================================================

export const MiniSparkline = ({
  data = [],
  color = 'primary',
  height = 30,
  showArea = true,
  showDots = false,
  className = ''
}) => {
  const colorStyle = COLOR_CLASSES[color] || COLOR_CLASSES.primary;
  
  if (data.length < 2) return null;

  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const width = 100;
  const stepX = width / (data.length - 1);

  const points = data.map((value, i) => {
    const x = i * stepX;
    const y = height - ((value - min) / range) * height;
    return `${x},${y}`;
  }).join(' ');

  const areaPoints = `0,${height} ${points} ${width},${height}`;

  return (
    <svg 
      viewBox={`0 0 ${width} ${height}`} 
      className={clsx('w-full', className)}
      style={{ height }}
    >
      {/* Area fill */}
      {showArea && (
        <polygon
          points={areaPoints}
          className={`${colorStyle.bg} opacity-20`}
          fill="currentColor"
        />
      )}
      
      {/* Line */}
      <polyline
        points={points}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={colorStyle.text}
      />
      
      {/* Dots */}
      {showDots && data.map((value, i) => {
        const x = i * stepX;
        const y = height - ((value - min) / range) * height;
        return (
          <circle
            key={i}
            cx={x}
            cy={y}
            r="2"
            fill="currentColor"
            className={colorStyle.text}
          />
        );
      })}
    </svg>
  );
};

// ============================================================================
// CARD - Componente Base Expandido
// ============================================================================

export const Card = ({ 
  children, 
  title, 
  subtitle,
  icon: Icon,
  className = '',
  headerAction,
  footer,
  noPadding = false,
  onClick,
  collapsible = false,
  defaultCollapsed = false,
  loading = false,
  variant = 'default',
  accentColor = 'primary',
  hoverable = false,
  selected = false,
  badge,
  tabs,
  activeTab,
  onTabChange
}) => {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
  const colorStyle = COLOR_CLASSES[accentColor] || COLOR_CLASSES.primary;

  const variants = {
    default: 'bg-surface',
    outlined: 'bg-transparent border-2',
    filled: `${colorStyle.bg}/5`,
    elevated: 'bg-surface shadow-lg',
    glass: 'bg-surface/50 backdrop-blur-sm'
  };

  if (loading) {
    return (
      <div className={clsx(
        'border border-border relative animate-pulse',
        variants[variant],
        className
      )}>
        <div className="absolute top-0 left-0 w-1 h-full" style={{ backgroundColor: colorStyle.bg.includes('bg-') ? undefined : colorStyle.bg }} />
        <div className="p-4 space-y-3">
          <div className="h-4 bg-border rounded w-1/3" />
          <div className="h-20 bg-border rounded" />
        </div>
      </div>
    );
  }

  return (
    <div 
      className={clsx(
        'border border-border relative',
        variants[variant],
        onClick && 'cursor-pointer',
        hoverable && 'hover:border-primary/50 hover:shadow-lg transition-all',
        selected && `border-${accentColor} ${colorStyle.glow}`,
        className
      )}
      onClick={onClick}
    >
      {/* Accent line */}
      <div 
        className={clsx('absolute top-0 left-0 w-1 h-full', colorStyle.bg)} 
      />
      
      {/* Header */}
      {(title || tabs) && (
        <div className="border-b border-border">
          {title && (
            <div className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-3">
                {Icon && <Icon size={18} className={colorStyle.text} />}
                <div>
                  <h3 className="font-heading text-sm uppercase tracking-wider text-text-primary flex items-center gap-2">
                    {title}
                    {badge && (
                      <span className={clsx(
                        'px-2 py-0.5 text-[10px] rounded',
                        `${colorStyle.bg}/20 ${colorStyle.text}`
                      )}>
                        {badge}
                      </span>
                    )}
                  </h3>
                  {subtitle && (
                    <p className="text-xs text-text-secondary">{subtitle}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {headerAction}
                {collapsible && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsCollapsed(!isCollapsed);
                    }}
                    className="p-1 hover:bg-surface-highlight rounded transition-colors"
                  >
                    {isCollapsed ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
                  </button>
                )}
              </div>
            </div>
          )}
          
          {/* Tabs */}
          {tabs && (
            <div className="flex px-4 gap-4">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  className={clsx(
                    'py-2 px-1 text-sm font-ui uppercase tracking-wider border-b-2 -mb-px transition-colors',
                    activeTab === tab.id
                      ? `${colorStyle.text} ${colorStyle.border}`
                      : 'text-text-secondary border-transparent hover:text-text-primary'
                  )}
                  onClick={(e) => {
                    e.stopPropagation();
                    onTabChange?.(tab.id);
                  }}
                >
                  {tab.icon && <tab.icon size={14} className="inline mr-1" />}
                  {tab.label}
                  {tab.count !== undefined && (
                    <span className="ml-1 text-xs opacity-60">({tab.count})</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
      
      {/* Content */}
      {(!collapsible || !isCollapsed) && (
        <div className={clsx(!noPadding && 'p-4')}>
          {children}
        </div>
      )}
      
      {/* Footer */}
      {footer && !isCollapsed && (
        <div className="px-4 py-3 border-t border-border bg-surface-highlight/50">
          {footer}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// STAT GRID
// ============================================================================

export const StatGrid = ({
  stats = [],
  columns = 4,
  gap = 4,
  className = ''
}) => (
  <div 
    className={clsx(
      'grid',
      `grid-cols-2 md:grid-cols-${columns}`,
      `gap-${gap}`,
      className
    )}
  >
    {stats.map((stat, i) => (
      <StatCard key={i} {...stat} />
    ))}
  </div>
);

// ============================================================================
// PROGRESS RING (Multiple values)
// ============================================================================

export const ProgressRing = ({
  values = [],
  size = 120,
  strokeWidth = 8,
  gap = 4,
  showLegend = true,
  centerContent,
  className = ''
}) => {
  const center = size / 2;
  
  return (
    <div className={clsx('flex items-center gap-4', className)}>
      <svg width={size} height={size}>
        {values.map((item, index) => {
          const radius = center - (strokeWidth + gap) * (index + 0.5);
          const circumference = radius * 2 * Math.PI;
          const percentage = calculatePercentage(item.value, item.max || 100);
          const offset = circumference - (percentage / 100) * circumference;
          const colorStyle = COLOR_CLASSES[item.color || 'primary'];

          return (
            <g key={index} className="transform -rotate-90 origin-center">
              {/* Background */}
              <circle
                cx={center}
                cy={center}
                r={radius}
                fill="transparent"
                stroke="currentColor"
                strokeWidth={strokeWidth}
                className="text-border"
              />
              {/* Progress */}
              <circle
                cx={center}
                cy={center}
                r={radius}
                fill="transparent"
                stroke="currentColor"
                strokeWidth={strokeWidth}
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                strokeLinecap="round"
                className={clsx(colorStyle.text, 'transition-all duration-1000')}
              />
            </g>
          );
        })}
      </svg>
      
      {/* Center Content */}
      {centerContent && (
        <div className="absolute inset-0 flex items-center justify-center">
          {centerContent}
        </div>
      )}
      
      {/* Legend */}
      {showLegend && (
        <div className="flex flex-col gap-2">
          {values.map((item, i) => {
            const colorStyle = COLOR_CLASSES[item.color || 'primary'];
            return (
              <div key={i} className="flex items-center gap-2">
                <div className={clsx('w-3 h-3 rounded-full', colorStyle.bg)} />
                <span className="text-xs text-text-secondary">{item.label}</span>
                <span className={clsx('text-xs font-body', colorStyle.text)}>
                  {item.value}/{item.max || 100}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// LEVEL PROGRESS
// ============================================================================

export const LevelProgress = ({
  level,
  currentXP,
  requiredXP,
  title,
  nextUnlocks = [],
  color = 'gold',
  className = ''
}) => {
  const percentage = calculatePercentage(currentXP, requiredXP);
  const colorStyle = COLOR_CLASSES[color] || COLOR_CLASSES.gold;

  return (
    <div className={clsx('bg-surface border border-border p-4', className)}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={clsx(
            'w-12 h-12 flex items-center justify-center border-2',
            colorStyle.border,
            `${colorStyle.bg}/10`
          )}>
            <span className={clsx('text-xl font-heading', colorStyle.text)}>{level}</span>
          </div>
          <div>
            <p className="text-xs text-text-secondary uppercase tracking-wider">Nível</p>
            {title && <p className={clsx('font-heading', colorStyle.text)}>{title}</p>}
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-text-secondary">Próximo nível</p>
          <p className="text-sm font-body text-text-primary">
            {formatNumber(currentXP)} / {formatNumber(requiredXP)} XP
          </p>
        </div>
      </div>
      
      <ProgressBar
        value={currentXP}
        max={requiredXP}
        color={color}
        height="h-3"
        showLabel={false}
        glow={percentage > 90}
      />
      
      {/* Next Unlocks */}
      {nextUnlocks.length > 0 && (
        <div className="mt-3 pt-3 border-t border-border">
          <p className="text-xs text-text-secondary uppercase tracking-wider mb-2">
            Próximos desbloqueios:
          </p>
          <div className="flex flex-wrap gap-2">
            {nextUnlocks.map((unlock, i) => (
              <span 
                key={i}
                className="px-2 py-1 bg-surface-highlight border border-border text-xs text-text-primary"
              >
                {unlock.icon && <unlock.icon size={12} className="inline mr-1" />}
                {unlock.label}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// HEAT METER
// ============================================================================

export const HeatMeter = ({
  value,
  max = 100,
  showWarning = true,
  showEffects = true,
  effects = [],
  className = ''
}) => {
  const percentage = calculatePercentage(value, max);
  
  const getHeatLevel = (val) => {
    if (val >= 80) return { label: 'CRÍTICO', color: 'error', pulse: true };
    if (val >= 60) return { label: 'ALTO', color: 'error', pulse: false };
    if (val >= 40) return { label: 'MÉDIO', color: 'warning', pulse: false };
    if (val >= 20) return { label: 'BAIXO', color: 'primary', pulse: false };
    return { label: 'SEGURO', color: 'success', pulse: false };
  };

  const heatLevel = getHeatLevel(value);
  const colorStyle = COLOR_CLASSES[heatLevel.color];

  return (
    <div className={clsx(
      'bg-surface border border-border p-4',
      heatLevel.pulse && 'animate-pulse',
      className
    )}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <AlertTriangle size={20} className={colorStyle.text} />
          <span className="font-heading text-sm">HEAT POLICIAL</span>
        </div>
        <span className={clsx(
          'px-2 py-1 text-xs font-ui uppercase',
          `${colorStyle.bg}/20 ${colorStyle.text} border ${colorStyle.border}/30`
        )}>
          {heatLevel.label}
        </span>
      </div>
      
      <div className="relative">
        <ProgressBar
          value={value}
          max={max}
          color={heatLevel.color}
          height="h-4"
          showLabel={false}
          glow={percentage > 70}
        />
        <span className={clsx(
          'absolute right-2 top-1/2 -translate-y-1/2 text-xs font-body font-bold',
          colorStyle.text
        )}>
          {value}%
        </span>
      </div>
      
      {/* Warning thresholds */}
      <div className="flex justify-between mt-1 text-[10px] text-text-secondary">
        <span>0</span>
        <span className="text-warning">40</span>
        <span className="text-error">60</span>
        <span className="text-error font-bold">80</span>
        <span>100</span>
      </div>
      
      {/* Effects */}
      {showEffects && effects.length > 0 && (
        <div className="mt-3 pt-3 border-t border-border space-y-1">
          {effects.map((effect, i) => (
            <div key={i} className="flex items-start gap-2 text-sm">
              <AlertTriangle size={14} className={clsx(colorStyle.text, 'mt-0.5')} />
              <span className="text-text-secondary">{effect}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// COMPARISON BAR
// ============================================================================

export const ComparisonBar = ({
  label,
  leftValue,
  rightValue,
  leftLabel = 'Você',
  rightLabel = 'Outro',
  leftColor = 'primary',
  rightColor = 'secondary',
  max,
  className = ''
}) => {
  const maxVal = max || Math.max(leftValue, rightValue);
  const leftPercent = calculatePercentage(leftValue, maxVal);
  const rightPercent = calculatePercentage(rightValue, maxVal);

  const leftColorStyle = COLOR_CLASSES[leftColor];
  const rightColorStyle = COLOR_CLASSES[rightColor];

  return (
    <div className={clsx('space-y-2', className)}>
      {label && (
        <p className="text-xs text-text-secondary uppercase tracking-wider">{label}</p>
      )}
      
      <div className="flex items-center gap-2">
        {/* Left bar */}
        <div className="flex-1">
          <div className="h-3 bg-border overflow-hidden flex justify-end">
            <div 
              className={clsx('h-full transition-all', leftColorStyle.bg)}
              style={{ width: `${leftPercent}%` }}
            />
          </div>
        </div>
        
        {/* Values */}
        <div className="w-24 text-center">
          <span className={clsx('text-sm font-body', leftColorStyle.text)}>
            {formatNumber(leftValue)}
          </span>
          <span className="text-text-secondary mx-1">vs</span>
          <span className={clsx('text-sm font-body', rightColorStyle.text)}>
            {formatNumber(rightValue)}
          </span>
        </div>
        
        {/* Right bar */}
        <div className="flex-1">
          <div className="h-3 bg-border overflow-hidden">
            <div 
              className={clsx('h-full transition-all', rightColorStyle.bg)}
              style={{ width: `${rightPercent}%` }}
            />
          </div>
        </div>
      </div>
      
      <div className="flex justify-between text-[10px] text-text-secondary">
        <span>{leftLabel}</span>
        <span>{rightLabel}</span>
      </div>
    </div>
  );
};

// ============================================================================
// SKILL BAR
// ============================================================================

export const SkillBar = ({
  name,
  level,
  maxLevel = 10,
  xp,
  xpRequired,
  icon: Icon,
  color = 'primary',
  locked = false,
  onClick,
  className = ''
}) => {
  const colorStyle = COLOR_CLASSES[color];

  return (
    <div 
      className={clsx(
        'bg-surface border border-border p-3 transition-all',
        locked && 'opacity-50',
        onClick && !locked && 'cursor-pointer hover:border-primary/50',
        className
      )}
      onClick={() => !locked && onClick?.()}
    >
      <div className="flex items-center gap-3">
        {Icon && (
          <div className={clsx(
            'w-10 h-10 flex items-center justify-center border',
            locked ? 'border-border' : colorStyle.border,
            locked ? 'bg-surface-highlight' : `${colorStyle.bg}/10`
          )}>
            <Icon size={20} className={locked ? 'text-text-secondary' : colorStyle.text} />
          </div>
        )}
        
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-heading text-text-primary">{name}</span>
            <span className={clsx('text-xs font-body', colorStyle.text)}>
              Nv. {level}/{maxLevel}
            </span>
          </div>
          
          {xp !== undefined && xpRequired && (
            <ProgressBar
              value={xp}
              max={xpRequired}
              color={locked ? 'default' : color}
              height="h-1.5"
              showLabel={false}
            />
          )}
        </div>
        
        {locked && (
          <span className="text-xs text-text-secondary">Bloqueado</span>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// MINI BAR CHART
// ============================================================================

export const MiniBarChart = ({
  data = [],
  height = 60,
  showLabels = true,
  showValues = true,
  color = 'primary',
  className = ''
}) => {
  const maxValue = Math.max(...data.map(d => d.value));
  const colorStyle = COLOR_CLASSES[color];

  return (
    <div className={clsx('w-full', className)}>
      <div className="flex items-end gap-1" style={{ height }}>
        {data.map((item, i) => {
          const barHeight = (item.value / maxValue) * 100;
          const itemColor = COLOR_CLASSES[item.color || color];
          
          return (
            <div key={i} className="flex-1 flex flex-col items-center">
              <div 
                className={clsx(
                  'w-full transition-all duration-500 hover:opacity-80',
                  itemColor.bg
                )}
                style={{ height: `${barHeight}%` }}
                title={`${item.label}: ${item.value}`}
              />
            </div>
          );
        })}
      </div>
      
      {showLabels && (
        <div className="flex gap-1 mt-1">
          {data.map((item, i) => (
            <div key={i} className="flex-1 text-center">
              <span className="text-[10px] text-text-secondary truncate block">
                {item.label}
              </span>
              {showValues && (
                <span className="text-xs text-text-primary">{formatNumber(item.value)}</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// DONUT CHART
// ============================================================================

export const DonutChart = ({
  data = [],
  size = 120,
  strokeWidth = 20,
  showLegend = true,
  showTotal = true,
  total,
  totalLabel = 'Total',
  className = ''
}) => {
  const center = size / 2;
  const radius = center - strokeWidth / 2;
  const circumference = radius * 2 * Math.PI;
  
  const totalValue = total || data.reduce((sum, item) => sum + item.value, 0);
  
  let currentOffset = 0;
  const segments = data.map((item) => {
    const percentage = (item.value / totalValue) * 100;
    const dashLength = (percentage / 100) * circumference;
    const segment = {
      ...item,
      percentage,
      dashLength,
      dashOffset: currentOffset
    };
    currentOffset += dashLength;
    return segment;
  });

  return (
    <div className={clsx('flex items-center gap-4', className)}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          {/* Background */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="transparent"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-border"
          />
          
          {/* Segments */}
          {segments.map((segment, i) => {
            const colorStyle = COLOR_CLASSES[segment.color || 'primary'];
            return (
              <circle
                key={i}
                cx={center}
                cy={center}
                r={radius}
                fill="transparent"
                stroke="currentColor"
                strokeWidth={strokeWidth}
                strokeDasharray={`${segment.dashLength} ${circumference}`}
                strokeDashoffset={-segment.dashOffset}
                className={clsx(colorStyle.text, 'transition-all duration-500')}
              />
            );
          })}
        </svg>
        
        {/* Center */}
        {showTotal && (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xl font-body font-bold text-text-primary">
              {formatNumber(totalValue)}
            </span>
            <span className="text-[10px] text-text-secondary uppercase">{totalLabel}</span>
          </div>
        )}
      </div>
      
      {/* Legend */}
      {showLegend && (
        <div className="flex flex-col gap-2">
          {segments.map((item, i) => {
            const colorStyle = COLOR_CLASSES[item.color || 'primary'];
            return (
              <div key={i} className="flex items-center gap-2">
                <div className={clsx('w-3 h-3', colorStyle.bg)} />
                <span className="text-xs text-text-secondary">{item.label}</span>
                <span className="text-xs font-body text-text-primary">
                  {formatNumber(item.value)} ({item.percentage.toFixed(1)}%)
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// ACTIVITY INDICATOR
// ============================================================================

export const ActivityIndicator = ({
  activities = [],
  maxItems = 7,
  className = ''
}) => (
  <div className={clsx('flex items-end gap-0.5', className)}>
    {activities.slice(-maxItems).map((activity, i) => {
      const intensity = activity.intensity || 1;
      const colorStyle = COLOR_CLASSES[activity.color || 'primary'];
      
      return (
        <div
          key={i}
          className={clsx(
            'w-3 rounded-sm transition-all',
            colorStyle.bg
          )}
          style={{ 
            height: `${intensity * 25}%`,
            opacity: 0.3 + (intensity * 0.2)
          }}
          title={activity.label}
        />
      );
    })}
  </div>
);

// ============================================================================
// TREND INDICATOR
// ============================================================================

export const TrendIndicator = ({
  value,
  previousValue,
  format = 'percent',
  showIcon = true,
  showValue = true,
  size = 'md',
  className = ''
}) => {
  const diff = value - previousValue;
  const percentChange = previousValue ? ((diff / previousValue) * 100) : 0;
  
  const isPositive = diff > 0;
  const isNegative = diff < 0;
  const isStable = diff === 0;

  const sizes = {
    sm: { icon: 12, text: 'text-xs' },
    md: { icon: 14, text: 'text-sm' },
    lg: { icon: 16, text: 'text-base' }
  };

  const { icon: iconSize, text } = sizes[size];

  const displayValue = format === 'percent' 
    ? `${Math.abs(percentChange).toFixed(1)}%`
    : formatNumber(Math.abs(diff));

  return (
    <div className={clsx(
      'flex items-center gap-1',
      isPositive && 'text-success',
      isNegative && 'text-error',
      isStable && 'text-text-secondary',
      text,
      className
    )}>
      {showIcon && (
        <>
          {isPositive && <TrendingUp size={iconSize} />}
          {isNegative && <TrendingDown size={iconSize} />}
          {isStable && <Minus size={iconSize} />}
        </>
      )}
      {showValue && <span>{isPositive && '+'}{displayValue}</span>}
    </div>
  );
};

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  ProgressBar,
  CircularProgress,
  StatCard,
  Card,
  StatGrid,
  ProgressRing,
  LevelProgress,
  HeatMeter,
  ComparisonBar,
  SkillBar,
  MiniSparkline,
  MiniBarChart,
  DonutChart,
  ActivityIndicator,
  TrendIndicator
};

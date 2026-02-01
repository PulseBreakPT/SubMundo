import { useAuth } from '../contexts/AuthContext';
import { useGame } from '../contexts/GameContext';
import { Zap, DollarSign, Flame, Shield, Star } from 'lucide-react';
import { ProgressBar } from './ProgressBar';

export const Header = () => {
  const { user } = useAuth();
  const { gameState } = useGame();

  if (!user) return null;

  const player = gameState?.player || user;

  return (
    <header 
      className="sticky top-0 bg-surface/95 backdrop-blur-sm border-b border-border z-40 px-4 py-3"
      data-testid="header"
    >
      <div className="flex items-center justify-between gap-4">
        {/* Mobile: Logo */}
        <div className="md:hidden">
          <h1 className="text-primary font-heading text-lg font-bold tracking-wider">SUBMUNDO</h1>
        </div>
        
        {/* Stats Bar */}
        <div className="flex items-center gap-3 md:gap-6 overflow-x-auto scrollbar-hide">
          {/* Energy */}
          <div className="flex items-center gap-2 min-w-fit" data-testid="energy-stat">
            <Zap size={16} className="text-secondary" />
            <span className="font-body text-sm text-text-primary">
              {player.energy}/{player.energy_max}
            </span>
          </div>
          
          {/* Clean Money */}
          <div className="flex items-center gap-2 min-w-fit" data-testid="clean-money-stat">
            <DollarSign size={16} className="text-success" />
            <span className="font-body text-sm text-success">
              €{player.clean_money?.toFixed(2) || '0.00'}
            </span>
          </div>
          
          {/* Dirty Money */}
          <div className="flex items-center gap-2 min-w-fit" data-testid="dirty-money-stat">
            <DollarSign size={16} className="text-warning" />
            <span className="font-body text-sm text-warning">
              €{player.dirty_money?.toFixed(2) || '0.00'}
            </span>
          </div>
          
          {/* Heat */}
          <div className="hidden sm:flex items-center gap-2 min-w-fit" data-testid="heat-stat">
            <Flame size={16} className={player.heat_individual > 50 ? 'text-error animate-pulse' : 'text-error'} />
            <span className="font-body text-sm text-error">
              {player.heat_individual}%
            </span>
          </div>
        </div>
        
        {/* Level Badge */}
        <div className="flex items-center gap-2" data-testid="level-badge">
          <div className="flex items-center gap-1 bg-surface-highlight px-2 py-1 border border-border">
            <Star size={14} className="text-gold" />
            <span className="font-body text-xs text-gold">Nv.{player.level}</span>
          </div>
        </div>
      </div>
      
      {/* Experience Bar */}
      <div className="mt-2 md:hidden">
        <ProgressBar 
          value={player.experience} 
          max={player.experience_max} 
          color="primary"
          showLabel={false}
          height="h-1"
        />
      </div>
    </header>
  );
};

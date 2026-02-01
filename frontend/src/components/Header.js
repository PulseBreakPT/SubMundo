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
      className="sticky top-0 bg-surface/95 backdrop-blur-sm border-b border-border z-40 px-3 sm:px-4 py-2 sm:py-3 safe-area-top"
      data-testid="header"
    >
      <div className="flex items-center justify-between gap-2 sm:gap-4">
        {/* Mobile: Logo */}
        <div className="md:hidden flex-shrink-0">
          <h1 className="text-primary font-heading text-base sm:text-lg font-bold tracking-wider">SUBMUNDO</h1>
        </div>
        
        {/* Stats Bar */}
        <div className="flex items-center gap-2 sm:gap-3 md:gap-6 overflow-x-auto scrollbar-hide flex-1 justify-end md:justify-start">
          {/* Energy */}
          <div className="flex items-center gap-1 sm:gap-2 min-w-fit" data-testid="energy-stat">
            <Zap size={14} className="text-secondary sm:w-4 sm:h-4" />
            <span className="font-body text-xs sm:text-sm text-text-primary">
              {player.energy}/{player.energy_max}
            </span>
          </div>
          
          {/* Clean Money */}
          <div className="flex items-center gap-1 sm:gap-2 min-w-fit" data-testid="clean-money-stat">
            <DollarSign size={14} className="text-success sm:w-4 sm:h-4" />
            <span className="font-body text-xs sm:text-sm text-success">
              €{(player.clean_money || 0) >= 10000 
                ? `${((player.clean_money || 0) / 1000).toFixed(1)}k` 
                : (player.clean_money || 0).toFixed(0)}
            </span>
          </div>
          
          {/* Dirty Money */}
          <div className="flex items-center gap-1 sm:gap-2 min-w-fit" data-testid="dirty-money-stat">
            <DollarSign size={14} className="text-warning sm:w-4 sm:h-4" />
            <span className="font-body text-xs sm:text-sm text-warning">
              €{(player.dirty_money || 0) >= 10000 
                ? `${((player.dirty_money || 0) / 1000).toFixed(1)}k` 
                : (player.dirty_money || 0).toFixed(0)}
            </span>
          </div>
          
          {/* Heat - hide on very small screens */}
          <div className="hidden xs:flex sm:flex items-center gap-1 sm:gap-2 min-w-fit" data-testid="heat-stat">
            <Flame size={14} className={`sm:w-4 sm:h-4 ${player.heat_individual > 50 ? 'text-error animate-pulse' : 'text-error'}`} />
            <span className="font-body text-xs sm:text-sm text-error">
              {player.heat_individual}%
            </span>
          </div>
        </div>
        
        {/* Level Badge */}
        <div className="flex items-center flex-shrink-0" data-testid="level-badge">
          <div className="flex items-center gap-1 bg-surface-highlight px-1.5 sm:px-2 py-0.5 sm:py-1 border border-border rounded">
            <Star size={12} className="text-gold sm:w-3.5 sm:h-3.5" />
            <span className="font-body text-[10px] sm:text-xs text-gold">Nv.{player.level}</span>
          </div>
        </div>
      </div>
      
      {/* Experience Bar - Mobile only */}
      <div className="mt-1.5 md:hidden">
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

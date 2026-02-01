import { useAuth } from '../contexts/AuthContext';
import { useGame } from '../contexts/GameContext';
import { Zap, DollarSign, Flame, Shield, Star, Sun, Moon, Cloud, CloudRain, CloudLightning, CloudFog, Thermometer, Sunrise, Sunset } from 'lucide-react';
import { ProgressBar } from './ProgressBar';
import { useState, useEffect } from 'react';

export const Header = () => {
  const { user } = useAuth();
  const { gameState } = useGame();
  const [weather, setWeather] = useState(null);

  // Buscar clima/tempo
  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/weather`);
        if (response.ok) {
          const data = await response.json();
          setWeather(data);
        }
      } catch (error) {
        console.log('Weather fetch error:', error);
      }
    };
    
    fetchWeather();
    // Atualizar a cada 5 minutos
    const interval = setInterval(fetchWeather, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Ícones de tempo/clima
  const getTimeIcon = (timeId) => {
    const icons = {
      dawn: <Sunrise size={12} className="text-orange-400" />,
      morning: <Sun size={12} className="text-yellow-400" />,
      afternoon: <Sun size={12} className="text-yellow-500" />,
      evening: <Sunset size={12} className="text-orange-500" />,
      night: <Moon size={12} className="text-blue-300" />,
      late_night: <Moon size={12} className="text-indigo-400" />
    };
    return icons[timeId] || <Sun size={12} />;
  };

  const getWeatherIcon = (weatherId) => {
    const icons = {
      clear: <Sun size={12} className="text-yellow-400" />,
      cloudy: <Cloud size={12} className="text-gray-400" />,
      rain: <CloudRain size={12} className="text-blue-400" />,
      storm: <CloudLightning size={12} className="text-purple-400" />,
      fog: <CloudFog size={12} className="text-gray-300" />,
      heat: <Thermometer size={12} className="text-red-400" />
    };
    return icons[weatherId] || <Cloud size={12} />;
  };

  if (!user) return null;

  const player = gameState?.player || user;

  return (
    <header 
      className="sticky top-0 bg-surface/95 backdrop-blur-sm border-b border-border z-40 px-3 sm:px-4 py-2 sm:py-3 safe-area-top"
      data-testid="header"
    >
      <div className="flex items-center justify-between gap-2 sm:gap-4">
        {/* Mobile: Logo + Weather */}
        <div className="md:hidden flex-shrink-0 flex items-center gap-2">
          <h1 className="text-primary font-heading text-base sm:text-lg font-bold tracking-wider">SUBMUNDO</h1>
          {weather && (
            <div className="flex items-center gap-1 bg-surface-highlight/50 px-1.5 py-0.5 rounded text-[10px]">
              {getTimeIcon(weather.time_of_day?.id)}
              {getWeatherIcon(weather.weather?.id)}
            </div>
          )}
        </div>
        
        {/* Desktop: Weather Info */}
        {weather && (
          <div className="hidden md:flex items-center gap-2 bg-surface-highlight/30 px-2 py-1 rounded border border-border/50">
            <div className="flex items-center gap-1">
              {getTimeIcon(weather.time_of_day?.id)}
              <span className="text-xs text-text-secondary">{weather.time_of_day?.label}</span>
            </div>
            <div className="w-px h-3 bg-border"></div>
            <div className="flex items-center gap-1">
              {getWeatherIcon(weather.weather?.id)}
              <span className="text-xs text-text-secondary">{weather.weather?.label}</span>
            </div>
            {weather.effects?.stealth_bonus !== 0 && (
              <>
                <div className="w-px h-3 bg-border"></div>
                <span className={`text-xs ${weather.effects.stealth_bonus > 0 ? 'text-success' : 'text-error'}`}>
                  {weather.effects.stealth_bonus > 0 ? '+' : ''}{weather.effects.stealth_bonus} Furtividade
                </span>
              </>
            )}
          </div>
        )}
        
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

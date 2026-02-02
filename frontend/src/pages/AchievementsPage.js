import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Card } from '../components/ProgressBar';
import { Button, Badge, Modal, Input, Alert } from '../components/UI';
import { 
  Trophy, Star, Lock, Unlock, TrendingUp, Award, 
  Target, DollarSign, Zap, Gift, Medal, Crown,
  Calendar, Clock, Percent, ChevronRight, Filter,
  Search, CheckCircle, Circle, AlertCircle
} from 'lucide-react';
import clsx from 'clsx';

// Achievement categories with colors and icons
const ACHIEVEMENT_CATEGORIES = {
  money: { 
    name: 'Dinheiro', 
    color: 'text-gold', 
    bgColor: 'bg-gold/10',
    borderColor: 'border-gold/30',
    icon: DollarSign 
  },
  crime: { 
    name: 'Crimes', 
    color: 'text-error', 
    bgColor: 'bg-error/10',
    borderColor: 'border-error/30',
    icon: Target 
  },
  level: { 
    name: 'Nível', 
    color: 'text-primary', 
    bgColor: 'bg-primary/10',
    borderColor: 'border-primary/30',
    icon: Star 
  },
  property: { 
    name: 'Propriedades', 
    color: 'text-success', 
    bgColor: 'bg-success/10',
    borderColor: 'border-success/30',
    icon: Award 
  },
  gang: { 
    name: 'Gangue', 
    color: 'text-warning', 
    bgColor: 'bg-warning/10',
    borderColor: 'border-warning/30',
    icon: Crown 
  },
  special: { 
    name: 'Especial', 
    color: 'text-purple-400', 
    bgColor: 'bg-purple-400/10',
    borderColor: 'border-purple-400/30',
    icon: Zap 
  },
};

// Rarity levels for achievements
const RARITY_LEVELS = {
  common: { name: 'Comum', color: 'text-text-secondary', glow: '' },
  uncommon: { name: 'Incomum', color: 'text-success', glow: 'shadow-success' },
  rare: { name: 'Raro', color: 'text-primary', glow: 'shadow-primary' },
  epic: { name: 'Épico', color: 'text-purple-400', glow: 'shadow-purple' },
  legendary: { name: 'Lendário', color: 'text-gold', glow: 'shadow-gold' },
};

// Achievement Card Component
const AchievementCard = ({ achievement, isUnlocked, onClick }) => {
  const category = ACHIEVEMENT_CATEGORIES[achievement.category] || ACHIEVEMENT_CATEGORIES.special;
  const CategoryIcon = category.icon;
  const rarity = RARITY_LEVELS[achievement.rarity] || RARITY_LEVELS.common;

  return (
    <button
      onClick={() => onClick(achievement)}
      className={clsx(
        'relative w-full text-left p-2 md:p-3 rounded-lg border transition-all',
        isUnlocked 
          ? `${category.bgColor} ${category.borderColor} hover:scale-[1.02]`
          : 'bg-surface/50 border-border opacity-60 hover:opacity-80',
        rarity.glow && isUnlocked && rarity.glow
      )}
    >
      {/* Rarity indicator */}
      {isUnlocked && (
        <div className={clsx('absolute top-1 right-1 w-1.5 h-1.5 rounded-full', category.color)} />
      )}

      <div className="flex items-start gap-2 md:gap-3">
        {/* Icon */}
        <div className={clsx(
          'flex-shrink-0 w-10 h-10 md:w-12 md:h-12 rounded-lg flex items-center justify-center text-xl md:text-2xl',
          isUnlocked ? category.bgColor : 'bg-surface'
        )}>
          {isUnlocked ? achievement.icon : <Lock size={20} className="text-text-secondary" />}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <h3 className={clsx(
              'font-heading text-xs md:text-sm truncate',
              isUnlocked ? 'text-text-primary' : 'text-text-secondary'
            )}>
              {achievement.name}
            </h3>
            {isUnlocked && (
              <CheckCircle size={12} className={category.color} />
            )}
          </div>

          <p className="text-xs text-text-secondary line-clamp-2 mb-1">
            {achievement.description}
          </p>

          {/* Progress bar for locked achievements */}
          {!isUnlocked && achievement.progress !== undefined && (
            <div className="mt-1.5">
              <div className="flex items-center justify-between text-xs mb-0.5">
                <span className="text-text-secondary">Progresso</span>
                <span className={category.color}>{achievement.progress}%</span>
              </div>
              <div className="w-full h-1.5 bg-surface rounded-full overflow-hidden">
                <div 
                  className={clsx('h-full transition-all duration-500', `bg-gradient-to-r ${category.color}`)}
                  style={{ width: `${achievement.progress}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-xs mt-0.5">
                <span className="text-text-secondary">
                  {achievement.current_value || 0} / {achievement.target_value || 0}
                </span>
              </div>
            </div>
          )}

          {/* Rewards */}
          <div className="flex flex-wrap items-center gap-1 mt-1.5">
            {achievement.reward && Object.entries(achievement.reward).map(([key, value]) => (
              <Badge key={key} variant={isUnlocked ? "success" : "secondary"} size="xs">
                {key === 'xp' && `+${value} XP`}
                {key === 'reputation' && `+${value} Rep`}
                {key === 'clean_money' && `+€${value}`}
              </Badge>
            ))}
          </div>
        </div>
      </div>
    </button>
  );
};

// Detailed Achievement Modal
const AchievementDetailModal = ({ achievement, isUnlocked, onClose }) => {
  const category = ACHIEVEMENT_CATEGORIES[achievement?.category] || ACHIEVEMENT_CATEGORIES.special;
  const CategoryIcon = category.icon;

  if (!achievement) return null;

  return (
    <Modal isOpen={!!achievement} onClose={onClose} title="Detalhes do Achievement">
      <div className="space-y-3">
        {/* Header with icon */}
        <div className={clsx('p-4 rounded-lg text-center', category.bgColor)}>
          <div className="text-5xl mb-2">
            {isUnlocked ? achievement.icon : '🔒'}
          </div>
          <h2 className="font-heading text-lg text-text-primary mb-1">
            {achievement.name}
          </h2>
          <p className="text-sm text-text-secondary">
            {achievement.description}
          </p>
        </div>

        {/* Status */}
        <div className={clsx('p-3 rounded-lg border', 
          isUnlocked 
            ? `${category.bgColor} ${category.borderColor}`
            : 'bg-surface border-border'
        )}>
          <div className="flex items-center justify-between">
            <span className="text-sm font-body text-text-secondary">Status</span>
            <Badge variant={isUnlocked ? "success" : "secondary"}>
              {isUnlocked ? 'Desbloqueado' : 'Bloqueado'}
            </Badge>
          </div>
        </div>

        {/* Progress (if locked) */}
        {!isUnlocked && achievement.progress !== undefined && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-text-secondary">Progresso</span>
              <span className={category.color}>{achievement.progress}%</span>
            </div>
            <div className="w-full h-3 bg-surface rounded-full overflow-hidden">
              <div 
                className={clsx('h-full transition-all', `bg-gradient-to-r ${category.color}`)}
                style={{ width: `${achievement.progress}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-xs text-text-secondary">
              <span>Atual: {achievement.current_value || 0}</span>
              <span>Meta: {achievement.target_value || 0}</span>
            </div>
          </div>
        )}

        {/* Rewards */}
        {achievement.reward && (
          <div>
            <h3 className="text-sm font-heading text-text-primary mb-2">Recompensas</h3>
            <div className="space-y-1.5">
              {Object.entries(achievement.reward).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between p-2 bg-surface rounded">
                  <span className="text-sm text-text-secondary capitalize">
                    {key === 'xp' && 'Experiência'}
                    {key === 'reputation' && 'Reputação'}
                    {key === 'clean_money' && 'Dinheiro'}
                  </span>
                  <span className={clsx('text-sm font-mono', category.color)}>
                    +{value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Category */}
        <div className="flex items-center justify-between p-3 bg-surface rounded-lg">
          <span className="text-sm text-text-secondary">Categoria</span>
          <div className="flex items-center gap-1.5">
            <CategoryIcon size={14} className={category.color} />
            <span className={clsx('text-sm font-body', category.color)}>
              {category.name}
            </span>
          </div>
        </div>

        <Button variant="primary" fullWidth onClick={onClose}>
          Fechar
        </Button>
      </div>
    </Modal>
  );
};

// Statistics Panel
const StatisticsPanel = ({ summary }) => {
  const completionColor = 
    summary.completion_percent >= 75 ? 'text-gold' :
    summary.completion_percent >= 50 ? 'text-success' :
    summary.completion_percent >= 25 ? 'text-warning' :
    'text-text-secondary';

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
      <Card className="text-center">
        <Trophy size={20} className="mx-auto mb-1 text-gold" />
        <p className="text-xs text-text-secondary mb-0.5">Total</p>
        <p className="text-lg font-heading text-text-primary">
          {summary.total_achievements}
        </p>
      </Card>

      <Card className="text-center">
        <CheckCircle size={20} className="mx-auto mb-1 text-success" />
        <p className="text-xs text-text-secondary mb-0.5">Desbloqueados</p>
        <p className="text-lg font-heading text-success">
          {summary.unlocked_count}
        </p>
      </Card>

      <Card className="text-center">
        <Lock size={20} className="mx-auto mb-1 text-text-secondary" />
        <p className="text-xs text-text-secondary mb-0.5">Bloqueados</p>
        <p className="text-lg font-heading text-text-secondary">
          {summary.locked_count}
        </p>
      </Card>

      <Card className="text-center">
        <Percent size={20} className={clsx('mx-auto mb-1', completionColor)} />
        <p className="text-xs text-text-secondary mb-0.5">Completo</p>
        <p className={clsx('text-lg font-heading', completionColor)}>
          {summary.completion_percent}%
        </p>
      </Card>
    </div>
  );
};

// Main Achievements Page
export default function AchievementsPage() {
  const { api } = useAuth();
  const [loading, setLoading] = useState(true);
  const [achievements, setAchievements] = useState(null);
  const [selectedAchievement, setSelectedAchievement] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showUnlockedOnly, setShowUnlockedOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    fetchAchievements();
  }, []);

  const fetchAchievements = async () => {
    try {
      setLoading(true);
      const response = await api().get('/achievements');
      setAchievements(response.data);

      // Show notification for new achievements
      if (response.data.new_achievements && response.data.new_achievements.length > 0) {
        setNotification({
          type: 'success',
          message: `${response.data.new_achievements.length} novo(s) achievement(s) desbloqueado(s)!`
        });
        setTimeout(() => setNotification(null), 5000);
      }
    } catch (error) {
      console.error('Erro ao carregar achievements:', error);
      setNotification({
        type: 'error',
        message: 'Erro ao carregar achievements'
      });
    } finally {
      setLoading(false);
    }
  };

  // Filter achievements
  const filteredAchievements = useMemo(() => {
    if (!achievements) return { unlocked: [], locked: [] };

    let unlocked = achievements.unlocked || [];
    let locked = achievements.locked || [];

    // Filter by category
    if (selectedCategory !== 'all') {
      unlocked = unlocked.filter(a => a.category === selectedCategory);
      locked = locked.filter(a => a.category === selectedCategory);
    }

    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      unlocked = unlocked.filter(a => 
        a.name.toLowerCase().includes(query) || 
        a.description.toLowerCase().includes(query)
      );
      locked = locked.filter(a => 
        a.name.toLowerCase().includes(query) || 
        a.description.toLowerCase().includes(query)
      );
    }

    // Filter by unlock status
    if (showUnlockedOnly) {
      locked = [];
    }

    return { unlocked, locked };
  }, [achievements, selectedCategory, searchQuery, showUnlockedOnly]);

  const allAchievements = useMemo(() => {
    return [
      ...filteredAchievements.unlocked.map(a => ({ ...a, isUnlocked: true })),
      ...filteredAchievements.locked.map(a => ({ ...a, isUnlocked: false }))
    ];
  }, [filteredAchievements]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-border border-t-primary rounded-full animate-spin mx-auto mb-3" />
          <p className="text-text-secondary text-sm">A carregar achievements...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2 md:space-y-3 pb-20 md:pb-6">
      {/* Notification */}
      {notification && (
        <Alert variant={notification.type}>
          {notification.message}
        </Alert>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-xl md:text-2xl text-text-primary mb-0.5">
            Achievements
          </h1>
          <p className="text-text-secondary text-xs md:text-sm">
            Desbloqueia conquistas e ganha recompensas
          </p>
        </div>
        <Trophy className="w-8 h-8 md:w-10 md:h-10 text-gold" />
      </div>

      {/* Statistics */}
      {achievements?.summary && (
        <StatisticsPanel summary={achievements.summary} />
      )}

      {/* Filters */}
      <Card>
        <div className="space-y-2">
          {/* Search */}
          <Input
            placeholder="Procurar achievements..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            icon={Search}
            iconPosition="left"
          />

          {/* Category filter */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            <button
              onClick={() => setSelectedCategory('all')}
              className={clsx(
                'px-2.5 py-1 text-xs rounded-lg border transition-all whitespace-nowrap',
                selectedCategory === 'all'
                  ? 'bg-primary text-text-primary border-primary'
                  : 'bg-surface text-text-secondary border-border hover:border-primary'
              )}
            >
              Todos
            </button>
            {Object.entries(ACHIEVEMENT_CATEGORIES).map(([key, cat]) => {
              const Icon = cat.icon;
              return (
                <button
                  key={key}
                  onClick={() => setSelectedCategory(key)}
                  className={clsx(
                    'px-2.5 py-1 text-xs rounded-lg border transition-all whitespace-nowrap flex items-center gap-1',
                    selectedCategory === key
                      ? `${cat.bgColor} ${cat.color} ${cat.borderColor}`
                      : 'bg-surface text-text-secondary border-border hover:border-primary'
                  )}
                >
                  <Icon size={12} />
                  {cat.name}
                </button>
              );
            })}
          </div>

          {/* Toggle unlocked only */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showUnlockedOnly}
              onChange={(e) => setShowUnlockedOnly(e.target.checked)}
              className="w-4 h-4 rounded border-border bg-surface"
            />
            <span className="text-xs text-text-secondary">
              Mostrar apenas desbloqueados
            </span>
          </label>
        </div>
      </Card>

      {/* Achievements Grid */}
      {allAchievements.length === 0 ? (
        <Card>
          <div className="text-center py-6">
            <AlertCircle size={40} className="mx-auto text-text-secondary opacity-50 mb-2" />
            <p className="text-text-secondary text-sm">
              Nenhum achievement encontrado
            </p>
          </div>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-2">
          {allAchievements.map((achievement) => (
            <AchievementCard
              key={achievement.id}
              achievement={achievement}
              isUnlocked={achievement.isUnlocked}
              onClick={setSelectedAchievement}
            />
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {selectedAchievement && (
        <AchievementDetailModal
          achievement={selectedAchievement}
          isUnlocked={selectedAchievement.isUnlocked}
          onClose={() => setSelectedAchievement(null)}
        />
      )}
    </div>
  );
}

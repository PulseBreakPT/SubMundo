import { useEffect } from 'react';
import { useGame } from '../contexts/GameContext';
import { CheckCircle, XCircle, AlertCircle, Info } from 'lucide-react';
import clsx from 'clsx';

export const Notification = () => {
  const { notification } = useGame();

  if (!notification) return null;

  const icons = {
    success: CheckCircle,
    error: XCircle,
    warning: AlertCircle,
    info: Info,
  };

  const colors = {
    success: 'border-success bg-success/10 text-success',
    error: 'border-error bg-error/10 text-error',
    warning: 'border-warning bg-warning/10 text-warning',
    info: 'border-secondary bg-secondary/10 text-secondary',
  };

  const Icon = icons[notification.type] || Info;

  return (
    <div 
      className="fixed top-4 right-4 z-[150] animate-slide-in"
      data-testid="notification"
    >
      <div className={clsx(
        'flex items-center gap-3 px-4 py-3 border-l-2 bg-surface',
        colors[notification.type]
      )}>
        <Icon size={20} />
        <p className="font-body text-sm text-text-primary">
          {notification.message}
        </p>
      </div>
    </div>
  );
};

import { useState, useEffect, useCallback, useRef } from 'react';

export const useCountdown = (targetTime) => {
  const [timeLeft, setTimeLeft] = useState(null);
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    if (!targetTime) {
      setTimeLeft(null);
      setIsExpired(true);
      return;
    }

    const target = new Date(targetTime).getTime();

    const updateCountdown = () => {
      const now = Date.now();
      const difference = target - now;

      if (difference <= 0) {
        setTimeLeft(null);
        setIsExpired(true);
        return;
      }

      setIsExpired(false);

      const hours = Math.floor(difference / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeLeft({ hours, minutes, seconds, total: difference });
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [targetTime]);

  const formatTime = useCallback(() => {
    if (!timeLeft) return '00:00:00';
    const { hours, minutes, seconds } = timeLeft;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }, [timeLeft]);

  return { timeLeft, isExpired, formatTime };
};

export const useMissionTimer = (startedAt, durationSeconds) => {
  const [progress, setProgress] = useState(0);
  const [remainingSeconds, setRemainingSeconds] = useState(durationSeconds);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    if (!startedAt || !durationSeconds) {
      setProgress(0);
      setRemainingSeconds(0);
      setIsComplete(false);
      return;
    }

    const startTime = new Date(startedAt).getTime();
    const endTime = startTime + (durationSeconds * 1000);

    const updateTimer = () => {
      const now = Date.now();
      const elapsed = now - startTime;
      const remaining = Math.max(0, endTime - now);

      const progressPercent = Math.min(100, (elapsed / (durationSeconds * 1000)) * 100);
      
      setProgress(progressPercent);
      setRemainingSeconds(Math.ceil(remaining / 1000));
      setIsComplete(remaining <= 0);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [startedAt, durationSeconds]);

  const formatRemaining = useCallback(() => {
    const minutes = Math.floor(remainingSeconds / 60);
    const seconds = remainingSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }, [remainingSeconds]);

  return { progress, remainingSeconds, isComplete, formatRemaining };
};

export default useCountdown;

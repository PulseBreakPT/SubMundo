import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';

const GameContext = createContext(null);

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame deve ser usado dentro de GameProvider');
  }
  return context;
};

export const GameProvider = ({ children }) => {
  const { api, isAuthenticated, user, refreshUser } = useAuth();
  
  const [gameState, setGameState] = useState(null);
  const [neighborhoods, setNeighborhoods] = useState([]);
  const [missionTemplates, setMissionTemplates] = useState([]);
  const [activeMission, setActiveMission] = useState(null);
  const [myGang, setMyGang] = useState(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [notification, setNotification] = useState(null);

  const showNotification = (message, type = 'info') => {
    setNotification({ message, type, id: Date.now() });
    setTimeout(() => setNotification(null), 4000);
  };

  const fetchGameState = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const response = await api().get('/game/state');
      setGameState(response.data);
      setActiveMission(response.data.active_mission);
      setMyGang(response.data.gang);
    } catch (err) {
      console.error('Erro ao buscar estado do jogo:', err);
    }
  }, [api, isAuthenticated]);

  const fetchNeighborhoods = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const response = await api().get('/neighborhoods');
      setNeighborhoods(response.data);
    } catch (err) {
      console.error('Erro ao buscar bairros:', err);
    }
  }, [api, isAuthenticated]);

  const fetchMissionTemplates = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const response = await api().get('/missions/templates');
      setMissionTemplates(response.data.templates);
    } catch (err) {
      console.error('Erro ao buscar templates de missões:', err);
    }
  }, [api, isAuthenticated]);

  const fetchMyGang = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const response = await api().get('/gangs/my');
      setMyGang(response.data.gang);
    } catch (err) {
      console.error('Erro ao buscar gangue:', err);
    }
  }, [api, isAuthenticated]);

  // Polling for game state
  useEffect(() => {
    if (!isAuthenticated) return;
    
    fetchGameState();
    fetchNeighborhoods();
    fetchMissionTemplates();
    fetchMyGang();

    const interval = setInterval(() => {
      fetchGameState();
    }, 10000); // Poll every 10 seconds

    return () => clearInterval(interval);
  }, [isAuthenticated, fetchGameState, fetchNeighborhoods, fetchMissionTemplates, fetchMyGang]);

  // Quick actions
  const performQuickAction = async (actionType, neighborhoodId = null) => {
    setActionLoading(true);
    try {
      const response = await api().post('/actions/quick', {
        action_type: actionType,
        neighborhood_id: neighborhoodId,
      });
      await refreshUser();
      await fetchGameState();
      showNotification(response.data.message, response.data.success ? 'success' : 'error');
      return response.data;
    } catch (err) {
      const message = err.response?.data?.detail || 'Erro ao executar ação';
      showNotification(message, 'error');
      return { success: false, message };
    } finally {
      setActionLoading(false);
    }
  };

  // Missions
  const startMission = async (missionType, neighborhoodId) => {
    setActionLoading(true);
    try {
      const response = await api().post('/missions/start', {
        type: missionType,
        neighborhood_id: neighborhoodId,
      });
      await refreshUser();
      await fetchGameState();
      setActiveMission(response.data);
      showNotification(`Missão iniciada: ${response.data.name}`, 'success');
      return response.data;
    } catch (err) {
      const message = err.response?.data?.detail || 'Erro ao iniciar missão';
      showNotification(message, 'error');
      return { success: false, message };
    } finally {
      setActionLoading(false);
    }
  };

  const completeMission = async (missionId) => {
    setActionLoading(true);
    try {
      const response = await api().post(`/missions/${missionId}/complete`);
      await refreshUser();
      await fetchGameState();
      const msg = response.data.result === 'success' 
        ? `Missão concluída com sucesso!` 
        : `Missão falhou!`;
      showNotification(msg, response.data.result === 'success' ? 'success' : 'error');
      return response.data;
    } catch (err) {
      const message = err.response?.data?.detail || 'Erro ao completar missão';
      showNotification(message, 'error');
      return { success: false, message };
    } finally {
      setActionLoading(false);
    }
  };

  // Daily reward
  const claimDailyReward = async () => {
    setActionLoading(true);
    try {
      const response = await api().post('/player/daily-reward');
      await refreshUser();
      await fetchGameState();
      showNotification(response.data.message, response.data.success ? 'success' : 'warning');
      return response.data;
    } catch (err) {
      const message = err.response?.data?.detail || 'Erro ao reclamar recompensa';
      showNotification(message, 'error');
      return { success: false, message };
    } finally {
      setActionLoading(false);
    }
  };

  // Gangs
  const createGang = async (name, tag) => {
    setActionLoading(true);
    try {
      const response = await api().post('/gangs/create', { name, tag });
      await fetchMyGang();
      await refreshUser();
      showNotification(`Gangue "${name}" criada!`, 'success');
      return response.data;
    } catch (err) {
      const message = err.response?.data?.detail || 'Erro ao criar gangue';
      showNotification(message, 'error');
      return { success: false, message };
    } finally {
      setActionLoading(false);
    }
  };

  const joinGang = async (gangId) => {
    setActionLoading(true);
    try {
      const response = await api().post(`/gangs/${gangId}/join`);
      await fetchMyGang();
      await refreshUser();
      showNotification(response.data.message, 'success');
      return response.data;
    } catch (err) {
      const message = err.response?.data?.detail || 'Erro ao juntar-se à gangue';
      showNotification(message, 'error');
      return { success: false, message };
    } finally {
      setActionLoading(false);
    }
  };

  const leaveGang = async () => {
    setActionLoading(true);
    try {
      const response = await api().post('/gangs/leave');
      await fetchMyGang();
      await refreshUser();
      showNotification(response.data.message, 'success');
      return response.data;
    } catch (err) {
      const message = err.response?.data?.detail || 'Erro ao sair da gangue';
      showNotification(message, 'error');
      return { success: false, message };
    } finally {
      setActionLoading(false);
    }
  };

  // Economy
  const launderMoney = async (amount) => {
    setActionLoading(true);
    try {
      const response = await api().post(`/economy/launder?amount=${amount}`);
      await refreshUser();
      await fetchGameState();
      showNotification(response.data.message, response.data.success ? 'success' : 'error');
      return response.data;
    } catch (err) {
      const message = err.response?.data?.detail || 'Erro ao lavar dinheiro';
      showNotification(message, 'error');
      return { success: false, message };
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <GameContext.Provider value={{
      gameState,
      neighborhoods,
      missionTemplates,
      activeMission,
      myGang,
      loading,
      actionLoading,
      notification,
      showNotification,
      fetchGameState,
      fetchNeighborhoods,
      fetchMissionTemplates,
      fetchMyGang,
      performQuickAction,
      startMission,
      completeMission,
      claimDailyReward,
      createGang,
      joinGang,
      leaveGang,
      launderMoney,
    }}>
      {children}
    </GameContext.Provider>
  );
};

import { createContext, useContext, useState, useEffect, useRef } from 'react';
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
  const { api, isAuthenticated, refreshUser } = useAuth();
  
  const [gameState, setGameState] = useState(null);
  const [neighborhoods, setNeighborhoods] = useState([]);
  const [missionTemplates, setMissionTemplates] = useState([]);
  const [activeMission, setActiveMission] = useState(null);
  const [myGang, setMyGang] = useState(null);
  const [gangWars, setGangWars] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [activeVehicle, setActiveVehicle] = useState(null);
  const [cityEvents, setCityEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [notification, setNotification] = useState(null);
  
  const initializedRef = useRef(false);

  const showNotification = (message, type = 'info') => {
    setNotification({ message, type, id: Date.now() });
    setTimeout(() => setNotification(null), 4000);
  };

  const fetchFullGameState = async () => {
    try {
      const response = await api().get('/game/full-state');
      setGameState(response.data);
      setActiveMission(response.data.active_mission);
      setMyGang(response.data.gang);
      setGangWars(response.data.gang_wars || []);
      setVehicles(response.data.vehicles || []);
      setActiveVehicle(response.data.active_vehicle);
      setCityEvents(response.data.active_events || []);
    } catch (err) {
      console.error('Erro ao buscar estado do jogo:', err);
    }
  };

  const fetchNeighborhoods = async () => {
    try {
      const response = await api().get('/neighborhoods');
      setNeighborhoods(response.data);
    } catch (err) {
      console.error('Erro ao buscar bairros:', err);
    }
  };

  const fetchMissionTemplates = async () => {
    try {
      const response = await api().get('/missions/templates');
      setMissionTemplates(response.data.templates);
    } catch (err) {
      console.error('Erro ao buscar templates de missões:', err);
    }
  };

  const fetchMyGang = async () => {
    try {
      const response = await api().get('/gangs/my');
      setMyGang(response.data.gang);
    } catch (err) {
      console.error('Erro ao buscar gangue:', err);
    }
  };

  // Initial data fetch - only once
  useEffect(() => {
    if (!isAuthenticated || initializedRef.current) return;
    
    initializedRef.current = true;
    
    fetchFullGameState();
    fetchNeighborhoods();
    fetchMissionTemplates();
  }, [isAuthenticated]);

  // Polling for game state
  useEffect(() => {
    if (!isAuthenticated) return;

    const interval = setInterval(() => {
      fetchFullGameState();
    }, 15000);

    return () => clearInterval(interval);
  }, [isAuthenticated]);

  // Quick actions
  const performQuickAction = async (actionType, neighborhoodId = null) => {
    setActionLoading(true);
    try {
      const response = await api().post('/actions/quick', {
        action_type: actionType,
        neighborhood_id: neighborhoodId,
      });
      await refreshUser();
      await fetchFullGameState();
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
      await fetchFullGameState();
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
      await fetchFullGameState();
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
      await fetchFullGameState();
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

  const depositToTreasury = async (amount) => {
    setActionLoading(true);
    try {
      const response = await api().post(`/gangs/treasury/deposit?amount=${amount}`);
      await fetchMyGang();
      await refreshUser();
      await fetchFullGameState();
      showNotification(response.data.message, 'success');
      return response.data;
    } catch (err) {
      const message = err.response?.data?.detail || 'Erro ao depositar';
      showNotification(message, 'error');
      return { success: false, message };
    } finally {
      setActionLoading(false);
    }
  };

  // Gang Wars
  const startWar = async (neighborhoodId) => {
    setActionLoading(true);
    try {
      const response = await api().post(`/wars/attack/${neighborhoodId}`);
      await fetchFullGameState();
      await fetchNeighborhoods();
      showNotification(response.data.message, 'success');
      return response.data;
    } catch (err) {
      const message = err.response?.data?.detail || 'Erro ao iniciar guerra';
      showNotification(message, 'error');
      return { success: false, message };
    } finally {
      setActionLoading(false);
    }
  };

  const resolveWar = async (warId) => {
    setActionLoading(true);
    try {
      const response = await api().post(`/wars/${warId}/resolve`);
      await fetchFullGameState();
      await fetchNeighborhoods();
      showNotification(response.data.message, response.data.result.includes('attacker') ? 'success' : 'warning');
      return response.data;
    } catch (err) {
      const message = err.response?.data?.detail || 'Erro ao resolver guerra';
      showNotification(message, 'error');
      return { success: false, message };
    } finally {
      setActionLoading(false);
    }
  };

  // Vehicles
  const buyVehicle = async (vehicleId) => {
    setActionLoading(true);
    try {
      const response = await api().post(`/vehicles/buy/${vehicleId}`);
      await refreshUser();
      await fetchFullGameState();
      showNotification(response.data.message, 'success');
      return response.data;
    } catch (err) {
      const message = err.response?.data?.detail || 'Erro ao comprar veículo';
      showNotification(message, 'error');
      return { success: false, message };
    } finally {
      setActionLoading(false);
    }
  };

  const activateVehicle = async (vehicleInstanceId) => {
    setActionLoading(true);
    try {
      const response = await api().post(`/vehicles/${vehicleInstanceId}/activate`);
      await fetchFullGameState();
      showNotification(response.data.message, 'success');
      return response.data;
    } catch (err) {
      const message = err.response?.data?.detail || 'Erro ao ativar veículo';
      showNotification(message, 'error');
      return { success: false, message };
    } finally {
      setActionLoading(false);
    }
  };

  const repairVehicle = async (vehicleInstanceId) => {
    setActionLoading(true);
    try {
      const response = await api().post(`/vehicles/${vehicleInstanceId}/repair`);
      await refreshUser();
      await fetchFullGameState();
      showNotification(response.data.message, 'success');
      return response.data;
    } catch (err) {
      const message = err.response?.data?.detail || 'Erro ao reparar veículo';
      showNotification(message, 'error');
      return { success: false, message };
    } finally {
      setActionLoading(false);
    }
  };

  const sellVehicle = async (vehicleInstanceId) => {
    setActionLoading(true);
    try {
      const response = await api().post(`/vehicles/${vehicleInstanceId}/sell`);
      await refreshUser();
      await fetchFullGameState();
      showNotification(response.data.message, 'success');
      return response.data;
    } catch (err) {
      const message = err.response?.data?.detail || 'Erro ao vender veículo';
      showNotification(message, 'error');
      return { success: false, message };
    } finally {
      setActionLoading(false);
    }
  };

  // Events
  const triggerEvent = async () => {
    setActionLoading(true);
    try {
      const response = await api().post('/events/trigger');
      await fetchFullGameState();
      showNotification(response.data.message, 'success');
      return response.data;
    } catch (err) {
      const message = err.response?.data?.detail || 'Erro ao acionar evento';
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
      const response = await api().post('/economy/launder', { amount });
      await refreshUser();
      await fetchFullGameState();
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
      gangWars,
      vehicles,
      activeVehicle,
      cityEvents,
      loading,
      actionLoading,
      notification,
      showNotification,
      fetchFullGameState,
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
      depositToTreasury,
      startWar,
      resolveWar,
      buyVehicle,
      activateVehicle,
      repairVehicle,
      sellVehicle,
      triggerEvent,
      launderMoney,
    }}>
      {children}
    </GameContext.Provider>
  );
};

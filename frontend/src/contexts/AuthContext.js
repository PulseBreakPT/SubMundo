import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('submundo_token'));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const api = useCallback(() => {
    const instance = axios.create({
      baseURL: API,
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    return instance;
  }, [token]);

  const fetchUser = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const response = await api().get('/auth/me');
      setUser(response.data);
      setError(null);
    } catch (err) {
      console.error('Erro ao buscar utilizador:', err);
      localStorage.removeItem('submundo_token');
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [token, api]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const login = async (email, password) => {
    try {
      setError(null);
      const response = await axios.post(`${API}/auth/login`, { email, password });
      const { access_token } = response.data;
      localStorage.setItem('submundo_token', access_token);
      setToken(access_token);
      return { success: true };
    } catch (err) {
      const message = err.response?.data?.detail || 'Erro ao fazer login';
      setError(message);
      return { success: false, error: message };
    }
  };

  const register = async (email, password, username) => {
    try {
      setError(null);
      const response = await axios.post(`${API}/auth/register`, { email, password, username });
      const { access_token } = response.data;
      localStorage.setItem('submundo_token', access_token);
      setToken(access_token);
      return { success: true };
    } catch (err) {
      const message = err.response?.data?.detail || 'Erro ao registar';
      setError(message);
      return { success: false, error: message };
    }
  };

  const logout = () => {
    localStorage.removeItem('submundo_token');
    setToken(null);
    setUser(null);
  };

  const refreshUser = async () => {
    await fetchUser();
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      loading,
      error,
      login,
      register,
      logout,
      refreshUser,
      api,
      isAuthenticated: !!user,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

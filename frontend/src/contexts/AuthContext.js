import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
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
  const [token, setToken] = useState(() => localStorage.getItem('submundo_token'));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const tokenRef = useRef(token);
  const hasInitialized = useRef(false);
  tokenRef.current = token;

  const api = useCallback(() => {
    const currentToken = tokenRef.current;
    return axios.create({
      baseURL: API,
      headers: currentToken ? { Authorization: `Bearer ${currentToken}` } : {},
    });
  }, []);

  useEffect(() => {
    const fetchUser = async () => {
      const storedToken = localStorage.getItem('submundo_token');
      const currentToken = storedToken || tokenRef.current;
      
      if (!currentToken) {
        setLoading(false);
        return;
      }
      
      // Sync token state if needed
      if (storedToken && storedToken !== token) {
        setToken(storedToken);
        tokenRef.current = storedToken;
      }
      
      try {
        const response = await axios.get(`${API}/auth/me`, {
          headers: { Authorization: `Bearer ${currentToken}` }
        });
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
    };

    if (!hasInitialized.current) {
      hasInitialized.current = true;
      fetchUser();
    } else if (token) {
      fetchUser();
    }
  }, [token]);

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
    const currentToken = tokenRef.current;
    if (!currentToken) return;
    try {
      const response = await axios.get(`${API}/auth/me`, {
        headers: { Authorization: `Bearer ${currentToken}` }
      });
      setUser(response.data);
    } catch (err) {
      console.error('Erro ao atualizar utilizador:', err);
    }
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

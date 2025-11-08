/* eslint-disable react-refresh/only-export-components */
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import apiClient from '../api';

const STORAGE_KEY = 'maibot_webui_password';
const AuthContext = createContext();

const containsWhitespace = (value) => /\s/.test(value);

const getStoredPassword = () => {
  if (typeof window === 'undefined') return '';
  return sessionStorage.getItem(STORAGE_KEY) || '';
};

const persistPassword = (password) => {
  if (typeof window === 'undefined') return;
  if (password) {
    if (containsWhitespace(password)) {
      sessionStorage.removeItem(STORAGE_KEY);
    } else {
      sessionStorage.setItem(STORAGE_KEY, password);
    }
  } else {
    sessionStorage.removeItem(STORAGE_KEY);
  }
};

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [passwordRequired, setPasswordRequired] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [authPassword, setAuthPassword] = useState('');

  const applyPasswordHeader = useCallback((password) => {
    if (password) {
      apiClient.defaults.headers.common['X-Webui-Password'] = password;
    } else {
      delete apiClient.defaults.headers.common['X-Webui-Password'];
    }
  }, []);

  useEffect(() => {
    applyPasswordHeader(authPassword);
    persistPassword(authPassword);
  }, [authPassword, applyPasswordHeader]);

  const authenticate = useCallback(async (password) => {
    await apiClient.post('/auth/login', { password });
    setAuthPassword(password);
    setAuthenticated(true);
  }, []);

  const refreshStatus = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/auth/status');
      const required = response.data.password_required;
      setPasswordRequired(required);

      if (!required) {
        setAuthPassword('');
        setAuthenticated(true);
        return;
      }

      const savedPassword = getStoredPassword();
      if (savedPassword) {
        if (containsWhitespace(savedPassword)) {
          persistPassword('');
          setAuthPassword('');
          setAuthenticated(false);
        } else {
          try {
            await authenticate(savedPassword);
            return;
          } catch {
            setAuthPassword('');
            setAuthenticated(false);
          }
        }
      } else {
        setAuthPassword('');
        setAuthenticated(false);
      }
    } catch (error) {
      console.error('Failed to fetch auth status', error);
      setAuthenticated(false);
    } finally {
      setLoading(false);
    }
  }, [authenticate]);

  useEffect(() => {
    refreshStatus();
  }, [refreshStatus]);

  const login = useCallback(
    async (password) => {
      await authenticate(password);
    },
    [authenticate],
  );

  const logout = useCallback(() => {
    setAuthPassword('');
    setAuthenticated(!passwordRequired);
  }, [passwordRequired]);

  return (
    <AuthContext.Provider
      value={{
        passwordRequired,
        authenticated,
        loading,
        login,
        logout,
        refreshStatus,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

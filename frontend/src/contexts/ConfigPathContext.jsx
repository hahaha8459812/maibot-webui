/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import apiClient from '../api';

const INITIAL_PATHS = {
  bot_config_path: '',
  model_config_path: '',
  env_path: '',
  webui_password: '',
  webui_password_set: false,
  adapter_config_path: '',
  project_root_path: '',
  deployment_mode: 'docker',
};

const ConfigPathContext = createContext();

export const useConfigPaths = () => useContext(ConfigPathContext);

export const ConfigPathProvider = ({ children }) => {
  const [paths, setPaths] = useState(INITIAL_PATHS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refreshPaths = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get('/config-paths');
      setPaths({
        bot_config_path: response.data.bot_config_path || '',
        model_config_path: response.data.model_config_path || '',
        env_path: response.data.env_path || '',
        webui_password: response.data.webui_password || '',
        webui_password_set: response.data.webui_password_set || false,
        adapter_config_path: response.data.adapter_config_path || '',
        project_root_path: response.data.project_root_path || '',
        deployment_mode: response.data.deployment_mode || 'docker',
      });
      return response.data;
    } catch (err) {
      console.error('Failed to load config paths', err);
      setPaths({ ...INITIAL_PATHS });
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshPaths().catch(() => {});
  }, [refreshPaths]);

  const updatePaths = (newPaths) => {
    setPaths((prev) => {
      const nextState = {
        ...prev,
        ...newPaths,
      };
      if (typeof nextState.webui_password === 'string') {
        nextState.webui_password_set = nextState.webui_password.length > 0;
      }
      if (!nextState.deployment_mode) {
        nextState.deployment_mode = 'docker';
      }
      return nextState;
    });
  };

  return (
    <ConfigPathContext.Provider value={{ paths, updatePaths, refreshPaths, loading, error }}>
      {children}
    </ConfigPathContext.Provider>
  );
};

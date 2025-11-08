import React, { createContext, useState, useContext } from 'react';

const ConfigPathContext = createContext();

export const useConfigPaths = () => {
  return useContext(ConfigPathContext);
};

export const ConfigPathProvider = ({ children }) => {
  const [paths, setPaths] = useState({
    bot_config_path: '',
    model_config_path: '',
    env_path: '',
  });

  const updatePaths = (newPaths) => {
    setPaths(newPaths);
  };

  return (
    <ConfigPathContext.Provider value={{ paths, updatePaths }}>
      {children}
    </ConfigPathContext.Provider>
  );
};
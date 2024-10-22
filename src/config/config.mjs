// config.mjs
let config = null;

export const setConfig = (newConfig) => {
  const defaults = {
    timezone: 'UTC'
  };

  if (!newConfig.secretKey || !newConfig.developmentToken) {
    throw new Error('Both secretKey and developmentToken must be provided.');
  }

  config = { ...defaults, ...newConfig };
};

export const getConfig = () => {
  if (!config) {
    throw new Error('Configuration has not been set. Please call setConfig() before calling any function.');
  }
  return config;
};

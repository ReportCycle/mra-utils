/**
 * @namespace configNamespace
 * A namespace that holds the configuration settings and provides methods to set and retrieve the configuration.
 */
const configNamespace = {
  /**
   * The configuration object that holds the application's configuration settings.
   * Initially set to `null` and populated when `setConfig()` is called.
   * @type {Object|null}
   */
  config: null,

  /**
   * Sets the configuration for the application. This method can only be called once;
   * subsequent attempts to set the configuration will throw an error.
   *
   * @param {Object} newConfig - The new configuration object.
   * @param {string} newConfig.secretKey - The secret key required for encryption.
   * @param {string} newConfig.developmentToken - The development token used for authentication or rate limits.
   * @param {string} [newConfig.timezone='UTC'] - The timezone setting, defaults to 'UTC' if not provided.
   * @throws {Error} Will throw an error if `secretKey` or `developmentToken` is not provided.
   * @throws {Error} Will throw an error if the configuration has already been set.
   */
  setConfig(newConfig) {
    const defaults = {
      timezone: 'UTC',
    };

    if (!newConfig.secretKey || !newConfig.developmentToken) {
      throw new Error('Both secretKey and developmentToken must be provided.');
    }

    // Reference configNamespace.config directly
    if (!configNamespace.config) {
      configNamespace.config = { ...defaults, ...newConfig };
    } else {
      throw new Error('Config has already been set.');
    }
  },

  /**
   * Retrieves the current configuration object.
   *
   * @returns {Object} The current configuration object.
   * @throws {Error} Will throw an error if the configuration has not been set.
   */
  getConfig() {
    // Reference configNamespace.config directly
    if (!configNamespace.config) {
      throw new Error('Configuration has not been set. Please call setConfig() before calling any function.');
    }
    return configNamespace.config;
  },
};

export const { setConfig, getConfig } = configNamespace;

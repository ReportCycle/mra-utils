import { getConfig, setConfig } from './config/config.mjs';
import { convertRequestData, decrypt, decryptObjectItems, encrypt, encryptObjectItems, toLowerCamelCase, toSnakeCase } from './utils/converters.mjs';
import { getCreptoConfig, isEmptyObject, sleep } from './utils/miscellaneous.mjs';
import { checkJSONBody, checkRequestValidity, isValidEmail, isValidUrl, testUrlAccessibility } from './utils/validations.mjs';

export const utils = {
  /**
   * Config function that acts as both a getter and a setter.
   *
   * @param {Object} [newConfig] - The new configuration object. If provided, it sets the configuration.
   * If not provided, it retrieves the current configuration.
   * @param {string} newConfig.secretKey - The secret key required for encryption (when setting config).
   * @param {string} newConfig.developmentToken - The development token used for authentication or rate limits (when setting config).
   * @param {string} [newConfig.timezone='UTC'] - The timezone setting, defaults to 'UTC' if not provided (when setting config).
   * @returns {Object} The current configuration object (when getting config).
   * @throws {Error} Will throw an error if the configuration is not set (when getting config).
   * @throws {Error} Will throw an error if required properties are missing when setting config.
   */
  config: (newConfig) => {
    if (!newConfig) {
      // Get configuration
      return getConfig();
    } else {
      // Set configuration
      return setConfig(newConfig);
    }
  },
};

export const validations = {
  /**
   * Middleware to handle and respond to invalid JSON format errors.
   * This middleware captures `SyntaxError` thrown by the `express.json()` middleware
   * when the incoming request contains invalid JSON. It extracts useful information
   * about the error, including the error type, message, and position where the error
   * occurred in the JSON string, and sends a detailed response back to the client.
   *
   * @param {object} err - The error object thrown by `express.json()` when it encounters malformed JSON.
   * @param {object} req - The request object from Express.js containing the client's request data.
   * @param {object} res - The response object from Express.js used to send back the desired HTTP response.
   * @param {function} next - The callback function to pass control to the next middleware function.
   *
   * @returns {void|object} - Sends a 400 error response with details if the error is a `SyntaxError`.
   *                          Otherwise, passes control to the next middleware.
   *
   * @example
   * // Usage as part of the Express middleware stack:
   * app.use(express.json());
   * app.use(checkJSONBody);
   */
  checkJSONBody,

  /**
   * Middleware to validate request data using validationResult.
   * It checks if the request meets the validation criteria set by previous validation middlewares.
   * If the validation fails, it sends a 400 status code with the validation errors.
   * Otherwise, it passes control to the next middleware function in the stack.
   *
   * @param {object} req - The request object from Express.js containing the client's request data.
   * @param {object} res - The response object from Express.js used to send back the desired HTTP response.
   * @param {function} next - The callback function to pass control to the next middleware function.
   */
  checkRequestValidity,

  /**
   * Function to validate an email address format.
   * It uses a regular expression to check if the email follows the standard email format.
   *
   * @param {string} email - The email address to validate.
   * @returns {boolean} - Returns true if the email is valid, otherwise false.
   *
   * @example
   * isValidEmail('test@example.com'); // true
   * isValidEmail('invalid-email'); // false
   */
  isValidEmail,

  /**
   * Validates whether the given input is a well-formed URL.
   *
   * @param {string} inputUrl - The URL to validate.
   * @returns {boolean} True if the input is a valid URL, false otherwise.
   */
  isValidUrl,

  /**
   * Tests if a given URL is accessible by making a HEAD request.
   *
   * @async
   * @param {string} url - The URL to test for accessibility.
   * @returns {Promise<boolean>} True if the URL is accessible, false otherwise.
   */
  testUrlAccessibility
};


export const converters = {
  /**
   * Extracts key information from the Express request object and returns it as a JSON string.
   * Handles circular references in the object structure to ensure proper JSON serialization.
   *
   * @param {object} req - The Express request object.
   * @returns {string} A JSON string representing key information from the request object.
   */
  convertRequestData,
  /**
   * Decrypts a base64 encoded string that was encrypted using the encrypt function.
   *
   * @param {string} base64String - A base64 encoded string representing the encrypted text.
   * @returns {string} The decrypted text. Returns the original base64 string if an error occurs during decryption.
   */
  decrypt,
  /**
   * Encrypts a given text using AES-256-CTR encryption algorithm.
   *
   * @param {string} text - The text to be encrypted.
   * @param {Buffer} [iv] - The initialization vector. If not provided, a random 16-byte IV is generated.
   * @returns {string} A base64 encoded string representing the encrypted text. Returns the original text if an error occurs.
   */
  encrypt,

  /**
   * Decrypts all string values within an object that were encrypted using encryptObjectItems.
   *
   * @param {Object} obj - The object with encrypted string values.
   * @param {string[]} [propertiesToDecrypt] - List of property names to decrypt. If not provided, all string properties are decrypted.
   * @returns {Object} A new object with all string values decrypted. Non-string values are copied as is.
   */
  decryptObjectItems,

  /**
   * Encrypts all string values within an object.
   *
   * @param {Object} obj - The object whose string values are to be encrypted.
   * @param {string[]} [propertiesToEncrypt] - List of property names to encrypt. If not provided, all string properties are encrypted.
   * @param {Buffer} [iv] - The initialization vector for encryption. If not provided, a random 16-byte IV is generated.
   * @returns {Object} A new object with all string values encrypted. Non-string values are copied as is.
   */
  encryptObjectItems,

  /**
   * Converts the keys of an object from snake_case to lowerCamelCase.
   *
   * @param {Object} obj - The object whose keys need to be converted.
   * @returns {Object} A new object with all keys in lowerCamelCase.
   */
  toLowerCamelCase,
  /**
 * Converts the keys of an object from lowerCamelCase to snake_case.
 *
 * This function recursively converts all object keys to snake_case, where
 * each word is separated by an underscore and all letters are in lowercase.
 * It handles nested objects and arrays, ensuring that keys at every level
 * are converted. Non-object values, including arrays, are left unchanged
 * except for the recursive conversion of array items or object properties.
 *
 * @param {Object} obj - The object whose keys need to be converted to snake_case.
 * @returns {Object} A new object with all keys in snake_case.
 */
  toSnakeCase,
};

export const miscellaneous = {
  /**
   * Retrieves the cryptographic configuration for encryption.
   *
   * @returns {{ algorithm: string, secretKey: Buffer }} The cryptographic configuration object containing the algorithm and secret key.
   *
   * @throws {Error} If the secret key is not defined in the environment variables.
   */
  getCreptoConfig,
  /**
   * Checks if an object is empty.
   *
   * An object is considered empty if it has no own enumerable properties.
   *
   * @param {Object} obj - The object to check.
   * @returns {boolean} Returns `true` if the object is empty, otherwise `false`.
   *
   * @example
   *
   * const obj1 = {};
   * console.log(isEmptyObject(obj1)); // true
   *
   * const obj2 = { key: 'value' };
   * console.log(isEmptyObject(obj2)); // false
   */
  isEmptyObject,
  /**
   * Pauses the execution for a specified amount of time.
   *
   * @param {number} ms - The number of milliseconds to pause.
   * @returns {Promise<void>} A promise that resolves after the specified time has elapsed.
   *
   * @example
   * // Pauses execution for 1 second
   * await sleep(1000);
   */
  sleep,
};

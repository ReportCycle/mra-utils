import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';
import { getCreptoConfig } from './miscellaneous.mjs';

/**
 * Hides sensitive data within an object by masking specified properties. This function
 * iterates through each property of the provided object. If a property's name matches
 * any of the given forbidden properties (case-insensitive), its value is replaced with
 * a mask ('****'). Properties not listed as forbidden are left unchanged.
 *
 * This function is non-destructive; it returns a new object with the modified values
 * while leaving the original object intact.
 *
 * @param {Object} obj - The object containing potential sensitive data to be masked.
 * @param {Array<string>} forbiddenProperties - An array of property names (strings)
 *                   that, if found in the object, should have their values masked.
 *                   Matching is case-insensitive.
 * @param {WeakSet} visited - (Optional) A WeakSet to keep track of visited objects to handle circular references.
 * @returns {Object} A new object with sensitive data masked. If the input is not an
 *                   object, the input is returned unchanged.
 */
const _hideSensitiveData = (obj, forbiddenProperties, visited = new WeakSet()) => {
    if (!obj || typeof obj !== 'object' || visited.has(obj)) {
        return obj;
    }

    visited.add(obj);

    const newObj = {};
    for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
            const value = obj[key];
            if (forbiddenProperties.some(prop => key.toLowerCase().includes(prop.toLowerCase()))) {
                newObj[key] = '****';
            } else {
                newObj[key] = _hideSensitiveData(value, forbiddenProperties, visited);
            }
        }
    }

    return newObj;
};

/**
 * Encrypts a given text using AES-256-CTR encryption algorithm.
 *
 * @param {string} text - The text to be encrypted.
 * @param {Buffer} [iv] - The initialization vector. If not provided, a random 16-byte IV is generated.
 * @returns {string} A base64 encoded string representing the encrypted text. Returns the original text if an error occurs.
 */
export const encrypt = (text, iv) => {
    try {
        const config = getCreptoConfig();
        iv = iv != null ? iv : randomBytes(16);
        const cipher = createCipheriv(config.algorithm, config.secretKey, iv);
        const encrypted = Buffer.concat([cipher.update(text), cipher.final()]);
        const hashObject = { iv: iv.toString('hex'), content: encrypted.toString('hex') };
        const jsonString = JSON.stringify(hashObject);
        const base64String = Buffer.from(jsonString).toString('base64');
        return base64String;
    } catch {
        return text;
    }
};

/**
 * Decrypts a base64 encoded string that was encrypted using the encrypt function.
 *
 * @param {string} base64String - A base64 encoded string representing the encrypted text.
 * @returns {string} The decrypted text. Returns the original base64 string if an error occurs during decryption.
 */
export const decrypt = (base64String) => {
    try {
        const config = getCreptoConfig();
        const jsonString = Buffer.from(base64String, 'base64').toString('utf-8');
        const hashObject = JSON.parse(jsonString);
        const decipher = createDecipheriv(config.algorithm, config.secretKey, Buffer.from(hashObject.iv, 'hex'));
        const decrpyted = Buffer.concat([decipher.update(Buffer.from(hashObject.content, 'hex')), decipher.final()]);
        return decrpyted.toString();
    } catch {
        return base64String;
    }
};

/**
 * Encrypts all string values within an object.
 *
 * @param {Object} obj - The object whose string values are to be encrypted.
 * @param {string[]} [propertiesToEncrypt] - List of property names to encrypt. If not provided, all string properties are encrypted.
 * @param {Buffer} [iv] - The initialization vector for encryption. If not provided, a random 16-byte IV is generated.
 * @returns {Object} A new object with all string values encrypted. Non-string values are copied as is.
 */
export const encryptObjectItems = (obj, propertiesToEncrypt, iv) => {
    // Check if the input is an array and handle it accordingly
    if (Array.isArray(obj)) {
        return obj.map(item => encryptObjectItems(item, propertiesToEncrypt, iv));
    }
    // Proceed if the input is an object
    else if (obj !== null && typeof obj === 'object') {
        const keys = Object.keys(obj);
        if (keys.length > 0) {
            const convertedObject = {};
            for (let key of keys) {
                if (obj.hasOwnProperty(key)) {
                    // Check if the current item should be encrypted
                    const shouldEncrypt = typeof obj[key] === 'string' && (!propertiesToEncrypt || propertiesToEncrypt.includes(key));
                    if (shouldEncrypt) {
                        convertedObject[key] = encrypt(obj[key], iv); // Encrypt the string value
                    } else {
                        // Recursively apply to nested objects or arrays, or copy other values as is
                        convertedObject[key] = encryptObjectItems(obj[key], propertiesToEncrypt, iv);
                    }
                }
            }
            return convertedObject;
        }
        else {
            return obj;
        }
    }
    // Return non-object and non-array values unchanged
    return obj;
};

/**
 * Decrypts all string values within an object that were encrypted using encryptObjectItems.
 *
 * @param {Object} obj - The object with encrypted string values.
 * @param {string[]} [propertiesToDecrypt] - List of property names to decrypt. If not provided, all string properties are decrypted.
 * @returns {Object} A new object with all string values decrypted. Non-string values are copied as is.
 */
export const decryptObjectItems = (obj, propertiesToDecrypt) => {
    // Check if the input is an array and handle it accordingly
    if (Array.isArray(obj)) {
        return obj.map(item => decryptObjectItems(item, propertiesToDecrypt));
    }
    // Proceed if the input is an object
    else if (obj !== null && typeof obj === 'object') {
        const keys = Object.keys(obj);
        if (keys.length > 0) {
            const convertedObject = {};
            for (let key of keys) {
                if (obj.hasOwnProperty(key)) {
                    // Check if the current item should be decrypted
                    const shouldDecrypt = typeof obj[key] === 'string' && (!propertiesToDecrypt || propertiesToDecrypt.includes(key));
                    if (shouldDecrypt) {
                        convertedObject[key] = decrypt(obj[key]); // Decrypt the string value
                    } else {
                        // Recursively apply to nested objects or arrays, or copy other values as is
                        convertedObject[key] = decryptObjectItems(obj[key], propertiesToDecrypt);
                    }
                }
            }
            return convertedObject;
        }
        else {
            return obj;
        }
    }
    // Return non-object and non-array values unchanged
    return obj;
};

/**
 * Converts the keys of an object from snake_case to lowerCamelCase.
 *
 * @param {Object} obj - The object whose keys need to be converted.
 * @returns {Object} A new object with all keys in lowerCamelCase.
 */
export const toLowerCamelCase = (obj) => {
    const convertKey = (key) => key.replace(/_([a-z])/g, (g) => g[1].toUpperCase());

    const processValue = (value) => {
        // Check if the value is a date object
        if (value instanceof Date) {
            return value;
        }

        // Check if the value is an array and process each item
        if (Array.isArray(value)) {
            return value.map(item => processValue(item));
        }

        // If the value is an object, convert its keys
        if (typeof value === 'object' && value !== null) {
            return toLowerCamelCase(value);
        }

        // For all other values, return them directly
        return value;
    };

    return Object.entries(obj).reduce((acc, [key, value]) => {
        acc[convertKey(key)] = processValue(value);
        return acc;
    }, {});
};

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
export const toSnakeCase = (obj) => {
    const convertKey = (key) => key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);

    const processValue = (value) => {
        // Check if the value is a date object
        if (value instanceof Date) {
            return value;
        }

        // Check if the value is an array and process each item
        if (Array.isArray(value)) {
            return value.map(item => processValue(item));
        }

        // If the value is an object, convert its keys to snake_case
        if (typeof value === 'object' && value !== null) {
            return toSnakeCase(value);
        }

        // For all other values, return them directly
        return value;
    };

    return Object.entries(obj).reduce((acc, [key, value]) => {
        acc[convertKey(key)] = processValue(value);
        return acc;
    }, {});
};

/**
 * Extracts key information from the Express request object and returns it as a JSON string.
 * Handles circular references in the object structure to ensure proper JSON serialization.
 *
 * @param {object} req - The Express request object.
 * @returns {string} A JSON string representing key information from the request object.
 */
export const convertRequestData = (req) => {
    // Array of properties to hide
    const forbiddenProperties = ['password', 'token', 'email', 'firstName', 'middleName', 'lastName', 'dateOfBirth', 'profilePictureUrl', 'profilePictureThumbnailUrl'];

    const requestData = {
        method: req.method,
        originalUrl: req.originalUrl,
        headers: _hideSensitiveData(req.headers, ['Authorization', 'x-development-token']),
        body: _hideSensitiveData(req.body, forbiddenProperties),
        query: _hideSensitiveData(req.query, forbiddenProperties),
        params: _hideSensitiveData(req.params, forbiddenProperties),
        ip: req.ip,
        hostname: req.hostname,
        protocol: req.protocol,
        path: req.path,
        cookies: _hideSensitiveData(req.cookies, forbiddenProperties)
    };

    return requestData;
};

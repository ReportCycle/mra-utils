import { getConfig, setConfig } from './config/config.mjs';
import { convertRequestData, decrypt, encrypt, toLowerCamelCase, toSnakeCase } from './utils/converters.mjs';
import { getCreptoConfig, isEmptyObject, sleep } from './utils/miscellaneous.mjs';

// Grouping exports into categories
export const config = {
  getConfig,
  setConfig,
};

export const converters = {
  convertRequestData,
  decrypt,
  encrypt,
  toLowerCamelCase,
  toSnakeCase,
};

export const miscellaneous = {
  getCreptoConfig,
  isEmptyObject,
  sleep,
};

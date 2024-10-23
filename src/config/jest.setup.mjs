import { getConfig, setConfig } from './config.mjs';

setConfig({
    timezone: 'UTC',
    secretKey: '0a06bb4c1e6d2b8f62ec71166d8997f588b3b3b1c313bbf14fcdfc9ba882827c',
    developmentToken: 'IgnoreRateLimit_2004'
});

test('Config variable should be loaded', () => {
    const config = getConfig();
    expect(config.secretKey).toBeDefined();
    expect(config.developmentToken).toBeDefined();
});

describe('setConfig', () => {
    test('should arise an error "Config has already been set."', () => {
        // Attempt to modify the config after it has already been set
        const modifiedConfig = { ...getConfig(), secretKey: '1234567890abcdef1234567890abcdef' };

        // Expect setConfig to throw an error when called again
        expect(() => {
            setConfig(modifiedConfig);
        }).toThrow('Config has already been set.');
    });
});

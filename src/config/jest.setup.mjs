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

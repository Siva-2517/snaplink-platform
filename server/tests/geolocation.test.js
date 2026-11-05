const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { parseUserAgent } = require('../src/utils/ua');

describe('User-Agent & Real Geolocation Parser', () => {
  it('should identify Desktop Chrome on Windows', () => {
    const req = {
      headers: {
        'user-agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
      },
      ip: '127.0.0.1'
    };

    const parsed = parseUserAgent(req);
    assert.equal(parsed.os, 'Windows');
    assert.equal(parsed.browser, 'Chrome');
    assert.equal(parsed.device, 'Desktop');
    assert.equal(parsed.country, 'Localhost');
  });

  it('should prioritize Edge CDN geolocation headers (e.g. cf-ipcountry: IN)', () => {
    const req = {
      headers: {
        'user-agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)',
        'cf-ipcountry': 'IN'
      },
      ip: '1.2.3.4'
    };

    const parsed = parseUserAgent(req);
    assert.equal(parsed.os, 'iOS');
    assert.equal(parsed.device, 'Mobile');
    assert.equal(parsed.country, 'India');
  });

  it('should resolve public IP via geoip-lite if no CDN header is supplied', () => {
    // 8.8.8.8 is a known Google Public DNS IP located in the United States
    const req = {
      headers: {
        'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)'
      },
      ip: '8.8.8.8'
    };

    const parsed = parseUserAgent(req);
    assert.equal(parsed.os, 'macOS');
    assert.equal(parsed.country, 'United States');
  });
});


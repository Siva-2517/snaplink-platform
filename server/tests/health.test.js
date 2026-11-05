const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key-for-automated-suites';
const app = require('../src/app');

const testRequest = (appInstance, method, url) => {
  return new Promise((resolve) => {
    const req = new http.IncomingMessage();
    req.method = method;
    req.url = url;
    req.headers = { host: 'localhost' };

    let body = '';
    const res = new http.ServerResponse(req);
    res.write = (chunk) => {
      body += chunk;
      return true;
    };
    res.end = (chunk) => {
      if (chunk) body += chunk;
      let json = null;
      try {
        json = JSON.parse(body);
      } catch (e) {
        json = null;
      }
      resolve({ status: res.statusCode, body: json, text: body });
    };

    appInstance(req, res);
  });
};

describe('Health & Global Error Endpoints', () => {
  it('GET /api/health should return 200 OK with healthy status payload', async () => {
    const res = await testRequest(app, 'GET', '/api/health');

    assert.equal(res.status, 200);
    assert.equal(res.body.status, 'OK');
    assert.equal(typeof res.body.uptime, 'number');
    assert.ok(res.body.timestamp);
  });

  it('GET /api/nonexistent-route should trigger standard 404 handler', async () => {
    const res = await testRequest(app, 'GET', '/api/nonexistent-route-999');

    assert.equal(res.status, 404);
    assert.equal(res.body.success, false);
    assert.equal(res.body.message, 'Resource not found.');
  });
});

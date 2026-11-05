const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { validateURLInput } = require('../src/middleware/validate');

const mockReqRes = (body) => {
  const req = { body: { ...body } };
  let statusCode = 200;
  let responseData = null;
  let nextCalled = false;

  const res = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(data) {
      responseData = data;
      return this;
    }
  };

  const next = () => {
    nextCalled = true;
  };

  return { req, res, getStatus: () => statusCode, getData: () => responseData, wasNextCalled: () => nextCalled };
};

describe('URL Input Validation Middleware', () => {
  it('should reject request when longUrl is missing', () => {
    const { req, res, getStatus, getData, wasNextCalled } = mockReqRes({});
    validateURLInput(req, res, () => {});

    assert.equal(wasNextCalled(), false);
    assert.equal(getStatus(), 400);
    assert.equal(getData().success, false);
    assert.match(getData().message, /Long URL is required/i);
  });

  it('should reject non-HTTP/HTTPS protocol (e.g. javascript: or ftp://)', () => {
    const { req, res, getStatus, getData, wasNextCalled } = mockReqRes({
      longUrl: 'javascript:alert(1)'
    });
    validateURLInput(req, res, () => {});

    assert.equal(wasNextCalled(), false);
    assert.equal(getStatus(), 400);
    assert.match(getData().message, /Invalid URL protocol/i);
  });

  it('should reject reserved custom alias keywords (e.g. "api", "dashboard")', () => {
    const { req, res, getStatus, getData, wasNextCalled } = mockReqRes({
      longUrl: 'https://example.com',
      customAlias: 'dashboard'
    });
    validateURLInput(req, res, () => {});

    assert.equal(wasNextCalled(), false);
    assert.equal(getStatus(), 400);
    assert.match(getData().message, /reserved for system use/i);
  });

  it('should reject expiration dates in the past', () => {
    const pastDate = new Date(Date.now() - 100000).toISOString();
    const { req, res, getStatus, getData, wasNextCalled } = mockReqRes({
      longUrl: 'https://example.com',
      expiresAt: pastDate
    });
    validateURLInput(req, res, () => {});

    assert.equal(wasNextCalled(), false);
    assert.equal(getStatus(), 400);
    assert.match(getData().message, /must be in the future/i);
  });

  it('should accept valid URL and valid custom alias', () => {
    let nextCalled = false;
    const req = {
      body: {
        longUrl: 'https://developer.mozilla.org/en-US/docs/Web',
        customAlias: 'my-custom-doc'
      }
    };
    const res = {};
    validateURLInput(req, res, () => {
      nextCalled = true;
    });

    assert.equal(nextCalled, true);
    assert.equal(req.body.customAlias, 'my-custom-doc');
  });
});


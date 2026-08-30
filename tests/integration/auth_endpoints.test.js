/**
 * Integration Test: Authentication & Identity HTTP Pipeline (Prompt 02)
 */

const assert = require('assert');
const http = require('http');
const app = require('../../server/index');

function makeRequest(server, path, options = {}, body = null) {
  return new Promise((resolve, reject) => {
    const port = server.address().port;
    const reqOptions = {
      hostname: '127.0.0.1',
      port,
      path,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      }
    };

    const req = http.request(reqOptions, (res) => {
      let rawData = '';
      res.on('data', chunk => rawData += chunk);
      res.on('end', () => {
        try {
          const parsed = rawData ? JSON.parse(rawData) : {};
          resolve({ status: res.statusCode, headers: res.headers, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, data: rawData });
        }
      });
    });

    req.on('error', reject);
    if (body) {
      req.write(typeof body === 'string' ? body : JSON.stringify(body));
    }
    req.end();
  });
}

async function run() {
  console.log('  Testing Auth & Identity API Endpoints Pipeline...');

  const server = http.createServer(app);
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));

  try {
    // 1. POST /api/v1/auth/signup (Buyer)
    const signupRes = await makeRequest(server, '/api/v1/auth/signup', { method: 'POST' }, {
      email: `api_user_${Date.now()}@example.com`,
      firstName: 'Alain',
      lastName: 'Foka',
      city: 'Douala',
      intent: 'buyer'
    });
    assert.strictEqual(signupRes.status, 201, 'Signup should return 201 Created');
    assert.ok(signupRes.data.data.user, 'Signup should return user profile');

    // 2. POST /api/v1/auth/signin
    const signinRes = await makeRequest(server, '/api/v1/auth/signin', { method: 'POST' }, {
      identifier: 'alain.foka@example.com',
      token: 'mock_token_integration_test'
    });
    assert.strictEqual(signinRes.status, 200, 'Signin should return 200 OK');
    assert.ok(signinRes.data.data.token, 'Signin should return token');

    // 3. POST /api/v1/auth/otp/send
    const phone = `+23769${Math.floor(1000000 + Math.random() * 9000000)}`;
    const otpRes = await makeRequest(server, '/api/v1/auth/otp/send', { method: 'POST' }, {
      phoneNumber: phone
    });
    assert.strictEqual(otpRes.status, 200, 'OTP send should return 200 OK');

    // 4. POST /api/v1/auth/password-reset/request
    const pwRes = await makeRequest(server, '/api/v1/auth/password-reset/request', { method: 'POST' }, {
      email: 'user@example.com'
    });
    assert.strictEqual(pwRes.status, 200, 'Password reset request should return 200');

    // 5. GET /api/v1/users/orca-merchant/public
    const publicCardRes = await makeRequest(server, '/api/v1/users/orca-merchant/public');
    assert.strictEqual(publicCardRes.status, 200, 'Public merchant card should return 200');
    assert.ok(publicCardRes.data.data.user.fullName, 'Public merchant card should have a name');

    console.log('    ✓ All Auth & Identity REST endpoints passed integration tests.');
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
}

module.exports = { run };

if (require.main === module) {
  run().catch(err => {
    console.error(err);
    process.exit(1);
  });
}

import assert from 'assert';
import http from 'http';
import { createApp } from '../app';
import { pdfService } from '../services/pdf.service';

async function testStartupIsolation() {
  console.log('🧪 Starting Module Startup Isolation & Route Verification Test Suite...\n');

  // 1. Verify pdf-parse is not in module cache before createApp()
  const pdfKeysBefore = Object.keys(require.cache).filter(k => k.includes('pdf-parse'));
  assert.strictEqual(
    pdfKeysBefore.length,
    0,
    'pdf-parse must NOT be in require.cache before app initialization'
  );
  console.log('  ✅ PASS: Before createApp() -> 0 pdf-parse modules loaded');

  // 2. Initialize Express application
  const app = createApp();

  // 3. Verify pdf-parse is STILL not in module cache after createApp()
  const pdfKeysAfterApp = Object.keys(require.cache).filter(k => k.includes('pdf-parse'));
  assert.strictEqual(
    pdfKeysAfterApp.length,
    0,
    'pdf-parse must NOT be in require.cache after createApp() is called'
  );
  console.log('  ✅ PASS: After createApp() -> 0 pdf-parse modules loaded');

  // 4. Start ephemeral server to test HTTP routes
  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const address = server.address() as any;
  const port = address.port;
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    // 5. Test /api/health route
    const healthRes = await fetch(`${baseUrl}/api/health`);
    assert.strictEqual(healthRes.status, 200, 'Health check should return 200');
    const healthJson: any = await healthRes.json();
    assert.strictEqual(healthJson.status, 'ok');
    console.log('  ✅ PASS: GET /api/health -> 200 OK (Status: ok)');

    // Verify still no pdf-parse in cache after health check
    const pdfKeysAfterHealth = Object.keys(require.cache).filter(k => k.includes('pdf-parse'));
    assert.strictEqual(pdfKeysAfterHealth.length, 0, 'pdf-parse must NOT be loaded after health check');
    console.log('  ✅ PASS: After /api/health -> 0 pdf-parse modules loaded');

    // 6. Test /api/auth/login with invalid data (should return 400 Bad Request, NOT 500 module crash)
    const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'nonexistent@example.com' }) // missing password
    });
    // Expected 400 (Bad Request from validator) and definitely not 500 (Crash)
    assert.strictEqual(loginRes.status, 400, 'Login should validate input and return 400');
    const loginJson: any = await loginRes.json();
    assert.strictEqual(loginJson.error, 'Validation Error');
    console.log('  ✅ PASS: POST /api/auth/login -> 400 Bad Request (handled cleanly without 500 crash)');

    // Verify still no pdf-parse in cache after auth request
    const pdfKeysAfterAuth = Object.keys(require.cache).filter(k => k.includes('pdf-parse'));
    assert.strictEqual(pdfKeysAfterAuth.length, 0, 'pdf-parse must NOT be loaded after auth request');
    console.log('  ✅ PASS: After /api/auth/login -> 0 pdf-parse modules loaded');

    // 7. Test /api/syllabus/upload without auth (should return 401 Unauthorized)
    const syllabusUnauthRes = await fetch(`${baseUrl}/api/syllabus/upload`, {
      method: 'POST'
    });
    assert.strictEqual(syllabusUnauthRes.status, 401, 'Syllabus upload requires auth');
    console.log('  ✅ PASS: POST /api/syllabus/upload -> 401 Unauthorized (auth middleware works)');

    // 8. Test dynamic loading when PDFService is explicitly called
    console.log('\n  🧪 Now triggering PDFService.extractText() directly to verify lazy load...');
    const pdfPath = require('path').resolve(__dirname, '../../node_modules/pdf-parse/test/data/04-valid.pdf');
    const pdfBuffer = require('fs').readFileSync(pdfPath);
    const extractionResult = await pdfService.extractText(pdfBuffer);
    assert(extractionResult.text.length > 0, 'Extracted text should not be empty');
    assert(extractionResult.pageCount >= 1, 'Page count should be at least 1');

    // Now pdf-parse should be loaded on-demand
    const pdfKeysAfterDynamic = Object.keys(require.cache).filter(k => k.includes('pdf-parse'));
    assert(pdfKeysAfterDynamic.length > 0, 'pdf-parse should be dynamically loaded when extractText is called');
    console.log(`  ✅ PASS: After extractText() -> pdf-parse loaded on-demand (${pdfKeysAfterDynamic.length} submodules)`);

    console.log('\n========================================');
    console.log('Isolation & Route Test Summary: ALL PASSED');
    console.log('========================================\n');
  } finally {
    server.close();
  }
}

testStartupIsolation().catch((err) => {
  console.error('❌ Isolation test failed:', err);
  process.exit(1);
});

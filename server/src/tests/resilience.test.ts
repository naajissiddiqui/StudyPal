import assert from 'assert';
import { AIService } from '../services/ai.service';

async function runResilienceTests() {
  console.log('🧪 Starting Gemini AI Retry & Resilience Test Suite...\n');
  let passedCount = 0;
  let failedCount = 0;

  async function test(name: string, fn: () => Promise<void> | void) {
    try {
      await fn();
      console.log(`  ✅ PASS: ${name}`);
      passedCount++;
    } catch (err: any) {
      console.error(`  ❌ FAIL: ${name}`);
      console.error(`     Error: ${err?.message || err}`);
      failedCount++;
    }
  }

  const aiService = new AIService();

  // 1. Transient Error Detection
  await test('Resilience: Correctly identifies transient 503 / high demand errors', () => {
    assert(aiService.isTransientError({ status: 503, message: 'Service Unavailable' }), 'Status 503 is transient');
    assert(aiService.isTransientError({ message: 'This model is currently experiencing high demand. Spikes in demand are usually temporary.' }), 'High demand message is transient');
    assert(aiService.isTransientError({ message: '503 UNAVAILABLE' }), '503 message is transient');
    assert(aiService.isTransientError({ status: 429, message: 'Resource exhausted' }), '429 is transient');
    assert(aiService.isTransientError({ message: 'Request timed out after 25000ms' }), 'Timeout is transient');
    assert(!aiService.isTransientError({ status: 400, message: 'Invalid argument' }), '400 is not transient');
    assert(!aiService.isTransientError({ status: 404, message: 'Model not found' }), '404 is not transient');
  });

  // 2. Permanent Error Detection
  await test('Resilience: Correctly identifies permanent 400 / 401 / 403 / 404 errors', () => {
    assert(aiService.isPermanentError({ status: 400, message: 'Bad request' }), '400 is permanent');
    assert(aiService.isPermanentError({ status: 401, message: 'API key not valid' }), '401 is permanent');
    assert(aiService.isPermanentError({ status: 403, message: 'Permission denied' }), '403 is permanent');
    assert(aiService.isPermanentError({ status: 404, message: 'models/invalid-model is not found' }), '404 is permanent');
    assert(!aiService.isPermanentError({ status: 503, message: 'UNAVAILABLE' }), '503 is not permanent');
  });

  // 3. User-Facing Error Sanitization
  await test('Resilience: Sanitizes 503 high-demand errors into clean user messages', () => {
    const rawError = {
      status: 503,
      message: '{"error":{"code":503,"message":"This model is currently experiencing high demand. Spikes in demand are usually temporary.","status":"UNAVAILABLE"}}'
    };
    const sanitized: any = aiService.sanitizeUserFacingError(rawError);
    assert.strictEqual(sanitized.statusCode, 503);
    assert.strictEqual(sanitized.code, 'AI_SERVICE_HIGH_DEMAND');
    assert(sanitized.message.includes('experiencing high demand'), 'Must contain user-friendly explanation');
    assert(!sanitized.message.includes('{"error"'), 'Must never leak raw JSON to user');
  });

  await test('Resilience: Sanitizes 429 rate limit errors cleanly', () => {
    const rawError = { status: 429, message: 'RESOURCE_EXHAUSTED' };
    const sanitized: any = aiService.sanitizeUserFacingError(rawError);
    assert.strictEqual(sanitized.statusCode, 429);
    assert.strictEqual(sanitized.code, 'AI_RATE_LIMIT_EXCEEDED');
    assert(sanitized.message.includes('rate limit'), 'Must explain rate limit');
  });

  // 4. Exponential Backoff Retry Simulation
  await test('Resilience: Fast failure on permanent error without retrying', async () => {
    let callCount = 0;
    const permanentErr = { status: 404, message: 'models/xyz is not found for API version v1beta' };

    // Create test instance
    const customService: any = new AIService();
    customService.ai = {
      models: {
        generateContent: async () => {
          callCount++;
          throw permanentErr;
        }
      }
    };

    let threw = false;
    try {
      await customService.callModelWithRetry('test-model', 'test payload', 3, 10, 2, 500);
    } catch (e) {
      threw = true;
    }

    assert(threw, 'Should throw error');
    assert.strictEqual(callCount, 1, 'Permanent error should fail immediately on attempt 1 without retry');
  });

  await test('Resilience: Transient 503 retries and recovers on subsequent attempt', async () => {
    let callCount = 0;
    const transientErr = { status: 503, message: 'This model is currently experiencing high demand.' };

    const customService: any = new AIService();
    customService.ai = {
      models: {
        generateContent: async () => {
          callCount++;
          if (callCount < 3) {
            throw transientErr;
          }
          return { text: '{"success": true, "recovered": true}' };
        }
      }
    };

    const result = await customService.callModelWithRetry('test-model', 'test payload', 3, 20, 2, 500);
    assert.strictEqual(callCount, 3, 'Should have retried twice and succeeded on attempt 3');
    assert(result.includes('recovered'), 'Should receive successful output on recovery');
  });

  await test('Resilience: Switches to fallback model when primary exhausts retries', async () => {
    const invokedModels: string[] = [];
    const transient503 = { status: 503, message: 'High demand' };

    const customService: any = new AIService();
    customService.primaryModel = 'primary-flash';
    customService.fallbackModel = 'fallback-lite';
    customService.ai = {
      models: {
        generateContent: async ({ model }: { model: string }) => {
          invokedModels.push(model);
          if (model === 'primary-flash') {
            throw transient503;
          }
          return { text: '{"success": true, "model": "fallback-lite"}' };
        }
      }
    };

    const output = await customService.generateWithGemini('test prompt');
    assert(output.includes('fallback-lite'), 'Must return output from fallback model');
    assert(invokedModels.includes('primary-flash'), 'Must have tried primary model first');
    assert(invokedModels.includes('fallback-lite'), 'Must have switched to fallback model');
    assert.strictEqual(invokedModels.filter(m => m === 'primary-flash').length, 3, 'Primary model should have attempted 3 times');
    assert.strictEqual(invokedModels.filter(m => m === 'fallback-lite').length, 1, 'Fallback model succeeded on first attempt');
  });

  console.log(`\n========================================`);
  console.log(`Resilience Test Summary: ${passedCount} passed, ${failedCount} failed`);
  console.log(`========================================\n`);

  if (failedCount > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runResilienceTests().catch(err => {
  console.error('Fatal test runner error:', err);
  process.exit(1);
});

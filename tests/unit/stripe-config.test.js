'use strict';

/**
 * Unit tests for server/config/stripe.js — lazy Stripe client factory.
 * No network calls; tests the env-var gating and caching behaviour.
 */

describe('stripe config', () => {
  const ORIGINAL_KEY = process.env.STRIPE_SECRET_KEY;

  afterEach(() => {
    if (ORIGINAL_KEY === undefined) delete process.env.STRIPE_SECRET_KEY;
    else process.env.STRIPE_SECRET_KEY = ORIGINAL_KEY;
  });

  test('isConfigured returns false when STRIPE_SECRET_KEY is unset', () => {
    jest.isolateModules(() => {
      delete process.env.STRIPE_SECRET_KEY;
      const { isConfigured } = require('../../server/config/stripe');
      expect(isConfigured()).toBe(false);
    });
  });

  test('isConfigured returns true when STRIPE_SECRET_KEY is set', () => {
    jest.isolateModules(() => {
      process.env.STRIPE_SECRET_KEY = 'sk_test_dummy';
      const { isConfigured } = require('../../server/config/stripe');
      expect(isConfigured()).toBe(true);
    });
  });

  test('getStripe throws STRIPE_NOT_CONFIGURED when key missing', () => {
    jest.isolateModules(() => {
      delete process.env.STRIPE_SECRET_KEY;
      const { getStripe } = require('../../server/config/stripe');
      expect(() => getStripe()).toThrow(/STRIPE_SECRET_KEY is not set/);
      try {
        getStripe();
      } catch (err) {
        expect(err.code).toBe('STRIPE_NOT_CONFIGURED');
      }
    });
  });

  test('getStripe returns a client when key is set and caches it', () => {
    jest.isolateModules(() => {
      process.env.STRIPE_SECRET_KEY = 'sk_test_dummy';
      const { getStripe } = require('../../server/config/stripe');
      const a = getStripe();
      const b = getStripe();
      expect(a).toBeDefined();
      expect(a).toBe(b); // same cached instance
    });
  });
});

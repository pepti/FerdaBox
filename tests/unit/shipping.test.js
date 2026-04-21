'use strict';

/**
 * Unit tests for server/config/shipping.js — pure functions, no DB or app.
 */

describe('shipping config', () => {
  test('SHIPPING_METHODS contains flat_rate and local_pickup', () => {
    const { SHIPPING_METHODS } = require('../../server/config/shipping');
    expect(SHIPPING_METHODS.flat_rate).toBeDefined();
    expect(SHIPPING_METHODS.local_pickup).toBeDefined();
    expect(SHIPPING_METHODS.flat_rate.requiresAddress).toBe(true);
    expect(SHIPPING_METHODS.local_pickup.requiresAddress).toBe(false);
    expect(SHIPPING_METHODS.local_pickup.priceIsk).toBe(0);
    expect(SHIPPING_METHODS.local_pickup.priceEur).toBe(0);
  });

  test('getShippingPrice returns ISK price for flat_rate', () => {
    const { getShippingPrice } = require('../../server/config/shipping');
    const isk = getShippingPrice('flat_rate', 'ISK');
    expect(typeof isk).toBe('number');
    expect(isk).toBeGreaterThanOrEqual(0);
  });

  test('getShippingPrice returns EUR price for flat_rate', () => {
    const { getShippingPrice } = require('../../server/config/shipping');
    const eur = getShippingPrice('flat_rate', 'EUR');
    expect(typeof eur).toBe('number');
    expect(eur).toBeGreaterThanOrEqual(0);
  });

  test('getShippingPrice returns 0 for local_pickup regardless of currency', () => {
    const { getShippingPrice } = require('../../server/config/shipping');
    expect(getShippingPrice('local_pickup', 'ISK')).toBe(0);
    expect(getShippingPrice('local_pickup', 'EUR')).toBe(0);
  });

  test('getShippingPrice throws for unknown shipping method', () => {
    const { getShippingPrice } = require('../../server/config/shipping');
    expect(() => getShippingPrice('ghost_ship', 'ISK')).toThrow(/Unknown shipping method/);
  });

  test('getShippingPrice throws for unknown currency', () => {
    const { getShippingPrice } = require('../../server/config/shipping');
    expect(() => getShippingPrice('flat_rate', 'BTC')).toThrow(/Unknown currency/);
  });

  test('env var override is honoured at module load', () => {
    // Re-require the module with env vars set — isolateModules resets require cache.
    jest.isolateModules(() => {
      process.env.SHIPPING_FLAT_RATE_ISK = '3500';
      process.env.SHIPPING_FLAT_RATE_EUR = '25.50';
      const { getShippingPrice } = require('../../server/config/shipping');
      expect(getShippingPrice('flat_rate', 'ISK')).toBe(3500);
      expect(getShippingPrice('flat_rate', 'EUR')).toBe(25.5);
      delete process.env.SHIPPING_FLAT_RATE_ISK;
      delete process.env.SHIPPING_FLAT_RATE_EUR;
    });
  });

  test('invalid env var falls back to default', () => {
    jest.isolateModules(() => {
      process.env.SHIPPING_FLAT_RATE_ISK = 'not-a-number';
      const { getShippingPrice } = require('../../server/config/shipping');
      // Falls back to the hard-coded default (2500)
      expect(getShippingPrice('flat_rate', 'ISK')).toBe(2500);
      delete process.env.SHIPPING_FLAT_RATE_ISK;
    });
  });

  test('negative env var falls back to default', () => {
    jest.isolateModules(() => {
      process.env.SHIPPING_FLAT_RATE_ISK = '-100';
      const { getShippingPrice } = require('../../server/config/shipping');
      expect(getShippingPrice('flat_rate', 'ISK')).toBe(2500);
      delete process.env.SHIPPING_FLAT_RATE_ISK;
    });
  });
});

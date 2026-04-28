const test = require('node:test');
const assert = require('node:assert/strict');
const {
  calculatePercentage,
  calculateProgressDelta,
  getTrendStatus,
  getLoadStatus,
} = require('../utils/projectMetrics');

test('calculatePercentage returns 0 when there is no total', () => {
  assert.equal(calculatePercentage(0, 0), 0);
});

test('calculatePercentage returns a rounded percentage', () => {
  assert.equal(calculatePercentage(3, 4), 75);
});

test('calculateProgressDelta returns positive and negative deltas', () => {
  assert.equal(calculateProgressDelta(80, 50), 30);
  assert.equal(calculateProgressDelta(50, 80), -30);
});

test('getTrendStatus returns semantic trend labels', () => {
  assert.equal(getTrendStatus(5), 'positive');
  assert.equal(getTrendStatus(-1), 'negative');
  assert.equal(getTrendStatus(0), 'neutral');
});

test('getLoadStatus maps occupation percentage to capacity states', () => {
  assert.equal(getLoadStatus(35), 'disponível');
  assert.equal(getLoadStatus(70), 'equilibrado');
  assert.equal(getLoadStatus(120), 'sobrecarregado');
});


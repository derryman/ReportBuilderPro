'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { getTextFromReport } = require('../lib/getTextFromReport');

describe('getTextFromReport', () => {
  it('returns empty string when there is nothing to flatten', () => {
    assert.equal(getTextFromReport(null), '');
    assert.equal(getTextFromReport(undefined), '');
    assert.equal(getTextFromReport({}), '');
    assert.equal(getTextFromReport({ capturedData: null }), '');
    assert.equal(getTextFromReport({ capturedData: 'not-an-object' }), '');
  });

  it('joins trimmed title and text from captured fields', () => {
    assert.equal(
      getTextFromReport({
        capturedData: {
          block1: { title: '  Site A  ', text: 'Progress ok' },
        },
      }),
      'Site A\nProgress ok',
    );
  });
});

// Tests for getTextFromReport — checks it handles empty input and correctly joins field text
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

  it('joins text from captured fields, excluding titles', () => {
    assert.equal(
      getTextFromReport({
        capturedData: {
          block1: { title: '  Site A  ', text: 'Progress ok' },
          block2: { title: 'Issues', issues: 'Standing water on site' },
        },
      }),
      'Progress ok\n\nStanding water on site',
    );
  });
});

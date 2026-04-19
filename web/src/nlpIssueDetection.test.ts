// Tests for the client-side keyword scanner — checks empty input and schedule keyword detection
import { describe, it, expect } from 'vitest';
import { analyzeReportText } from './nlpIssueDetection';

describe('analyzeReportText', () => {
  it('returns no issues for empty or whitespace-only input', () => {
    expect(analyzeReportText('')).toEqual([]);
    expect(analyzeReportText('   \n\n  ')).toEqual([]);
  });

  it('flags a line containing a schedule keyword', () => {
    const issues = analyzeReportText('The works were delayed due to rain.');
    expect(issues).toHaveLength(1);
    expect(issues[0].category).toBe('Schedule');
    expect(issues[0].severity).toBe('medium');
  });
});

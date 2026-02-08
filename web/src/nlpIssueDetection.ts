export type DetectedIssue = {
  id: number;
  jobId: string;
  title: string;
  description: string;
  severity: string;
  category: string;
  date: string;
};

// Shared risk keyword configuration (same as HomePage demo)
const riskKeywords: Record<string, string[]> = {
  schedule: ['delayed', 'rescheduled', 'postponed', 'behind schedule', 'overdue'],
  compliance: ['pending', 'non-compliant', 'violation', 'missing', 'expired', 'incomplete'],
  material: ['shortage', 'out of stock', 'unavailable', 'insufficient', 'low supply'],
};

// Analyze free-text report content and return detected issues
export function analyzeReportText(reportText: string): DetectedIssue[] {
  const sentences = reportText
    .split('\n')
    .filter((line) => line.trim() !== '')
    .map((s) => s.trim());

  const issues: DetectedIssue[] = [];
  let issueId = 1;

  sentences.forEach((sentence, index) => {
    const lowerSentence = sentence.toLowerCase();

    for (const [category, keywords] of Object.entries(riskKeywords)) {
      for (const keyword of keywords) {
        if (lowerSentence.includes(keyword)) {
          const categoryName =
            category === 'schedule'
              ? 'Schedule'
              : category === 'compliance'
              ? 'Compliance'
              : 'Material';

          const severity =
            category === 'compliance'
              ? 'high'
              : category === 'schedule'
              ? 'medium'
              : 'low';

          const words = sentence.split(' ');
          const title =
            words.slice(0, 4).join(' ') + (words.length > 4 ? '...' : '');

          issues.push({
            id: issueId++,
            jobId: `2024-${String(index + 1).padStart(3, '0')}`,
            title,
            description: sentence,
            severity,
            category: categoryName,
            date: 'Just now',
          });

          break;
        }
      }
    }
  });

  return issues;
}


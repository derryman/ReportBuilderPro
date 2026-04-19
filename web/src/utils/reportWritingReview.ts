// Types and helpers for the writing review response - grammar/style issues flagged per field
export type CapturedComponent = {
  type: 'image' | 'text' | 'progress' | 'issues';
  title: string;
  image?: string;
  text?: string;
  progress?: string;
  issues?: string;
};

export type WritingReviewIssue = {
  fieldKey: string | null;
  fieldType: 'text' | 'progress' | 'issues' | 'unknown';
  fieldLabel: string;
  message: string;
  shortMessage?: string;
  category: string;
  context: string;
  issueText: string;
  replacements: string[];
  ruleId: string;
};

export type WritingReviewResponse = {
  reviewAvailable: boolean;
  configured: boolean;
  provider: string;
  issues: WritingReviewIssue[];
  summary: {
    issueCount: number;
    textLength: number;
    checkedAt: string | null;
  };
  message?: string;
};

export function getWritingIssueLabel(issue: WritingReviewIssue): string {
  if (issue.fieldLabel) return issue.fieldLabel;
  switch (issue.fieldType) {
    case 'progress':
      return 'Progress';
    case 'issues':
      return 'Issues';
    case 'text':
      return 'Text';
    default:
      return 'Report text';
  }
}

export function getWritingIssuePreview(issue: WritingReviewIssue): string {
  if (issue.issueText) return issue.issueText;
  if (issue.context) return issue.context;
  return issue.message;
}

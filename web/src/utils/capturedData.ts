// Helpers for working with a report's capturedData across multipage reports
import type { CapturedComponent } from './reportWritingReview';

/**
 * Captured data keys are "${pageIndex}_${comp.id}" for multipage reports (from mobile capture
 * or Edit Report), or a bare "${comp.id}" for older single-page reports. Group values back into
 * ordered pages so exports/renders can keep each page visually separate.
 */
export function groupCapturedDataByPage(
  capturedData: Record<string, CapturedComponent>
): CapturedComponent[][] {
  const byPage = new Map<number, CapturedComponent[]>();
  Object.entries(capturedData).forEach(([key, value]) => {
    const match = /^(\d+)_/.exec(key);
    const pageIndex = match ? Number(match[1]) : 0;
    const list = byPage.get(pageIndex) ?? [];
    list.push(value);
    byPage.set(pageIndex, list);
  });

  const maxIndex = byPage.size > 0 ? Math.max(...byPage.keys()) : 0;
  const pages: CapturedComponent[][] = [];
  for (let i = 0; i <= maxIndex; i++) {
    pages.push(byPage.get(i) ?? []);
  }
  return pages;
}

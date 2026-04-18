'use strict';

/** Flatten report field values into one string for the Python classifier. */
function getTextFromReport(report) {
  const capturedData = report && report.capturedData;
  if (!capturedData || typeof capturedData !== 'object') return '';
  const parts = [];
  for (const v of Object.values(capturedData)) {
    if (v && typeof v === 'object') {
      if (typeof v.title === 'string' && v.title.trim()) parts.push(v.title.trim());
      if (typeof v.text === 'string' && v.text.trim()) parts.push(v.text.trim());
      if (typeof v.progress === 'string' && v.progress.trim()) parts.push(v.progress.trim());
      if (typeof v.issues === 'string' && v.issues.trim()) parts.push(v.issues.trim());
    }
  }
  return parts.join('\n');
}

module.exports = { getTextFromReport };

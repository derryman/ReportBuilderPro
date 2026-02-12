// API configuration
// Remove trailing slash to avoid double slashes in URLs
const rawUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';
export const API_BASE_URL = rawUrl.replace(/\/$/, '');


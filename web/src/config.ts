/**
 * Backend origin for `fetch` calls. Set `VITE_API_URL` in production to your App Service URL.
 */
const rawUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';
export const API_BASE_URL = rawUrl.replace(/\/$/, '');


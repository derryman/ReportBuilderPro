// API base URL — points to localhost in dev, set VITE_API_URL in production to the Azure App Service URL
const rawUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';
export const API_BASE_URL = rawUrl.replace(/\/$/, '');


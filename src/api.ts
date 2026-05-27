/**
 * API Base URL and utility functions for Alerta Temprana Brandsen
 */

// Determine the correct backend URL dynamically
export const getApiUrl = (path: string): string => {
  // 1. Check if the user specified an environment variable first
  const envApiUrl = (import.meta as any).env?.VITE_API_URL;
  if (envApiUrl) {
    const base = envApiUrl.endsWith('/') ? envApiUrl.slice(0, -1) : envApiUrl;
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${base}${cleanPath}`;
  }

  // 2. Identify the current host environment
  const hostname = window.location.hostname;
  
  // 3. If running on Vercel or other isolated static hosts, proxy calls to our Cloud Run container backend
  if (
    hostname.includes('vercel.app') || 
    hostname.includes('github.io') || 
    hostname.includes('netlify.app') || 
    (hostname !== 'localhost' && !hostname.includes('127.0.0.1') && !hostname.includes('run.app'))
  ) {
    // Current deployment shared backend URL in AI Studio
    const cloudRunBackend = 'https://ais-pre-vkktzhgjrqovrhkdd2bsx6-342678855823.us-east1.run.app';
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${cloudRunBackend}${cleanPath}`;
  }

  // 4. Fallback relative routing for local development or native Cloud Run container runs
  return path;
};

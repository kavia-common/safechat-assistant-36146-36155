function getApiBaseUrl(): string {
  try {
    const w = (globalThis as any);
    if (w && w.__APP_API_BASE_URL__) return w.__APP_API_BASE_URL__;
  } catch { /* no-op */ }
  return '/api';
}

/**
 * Environment configuration (production).
 */
export const environment = {
  production: true,
  // PUBLIC_INTERFACE
  // Backend base URL for API calls to the safe prompt backend (to be set via deployment).
  apiBaseUrl: getApiBaseUrl()
};

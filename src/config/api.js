// API Configuration
// In production, API calls go to Firebase Functions
// In development, they go to local server

const isProduction = import.meta.env.PROD;

export const API_URL = isProduction 
  ? '/api'  // Firebase Functions rewrite handles this
  : 'http://localhost:3002/api';

export const WS_URL = isProduction
  ? null  // WebSocket not available in Cloud Functions (use polling for voice)
  : 'ws://localhost:3002/api/live';

export default API_URL;


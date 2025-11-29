// API Configuration
// All API calls go to Firebase Functions

// When running locally, use the full production URL
// When deployed, use relative path (Firebase rewrite handles it)
const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

export const API_URL = isLocalhost 
  ? 'https://sourashtra-ai.web.app/api'  // Use production Firebase Hosting URL
  : '/api';  // Firebase Functions rewrite handles this

export const WS_URL = null;  // WebSocket not available in Cloud Functions

export default API_URL;


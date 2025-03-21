// API configuration
// For deployment, handle different environments
// In development, use localhost; in production, use relative path for same-domain API
const isProduction = import.meta.env.PROD || false;
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 
                           (isProduction ? '/api' : 'https://ai-examiner-v3mh.onrender.com/api');

// Log the API URL in non-production environments only
if (!isProduction) {
  console.log(`Using API URL: ${API_BASE_URL} (development mode)`);
}

// API Endpoints
export const API_ENDPOINTS = {
  PROCESS_FILE: `${API_BASE_URL}/process-file`,
  EVALUATE: `${API_BASE_URL}/evaluate`,
  MAP_QUESTIONS: `${API_BASE_URL}/map-questions-answers`,
  EVALUATIONS: `${API_BASE_URL}/evaluations`,
  HEALTH: `${API_BASE_URL}/health`,
  DEMO_LOGIN: `${API_BASE_URL}/demo-login`,
  AUTH: {
    LOGIN: `${API_BASE_URL}/login`,
    REGISTER: `${API_BASE_URL}/register`,
    PROFILE: `${API_BASE_URL}/auth/profile`,
  },
  QUESTION_PAPERS: {
    LIST: `${API_BASE_URL}/question-papers`,
    PROCESS: `${API_BASE_URL}/process-question-paper`,
    GET: (id: string) => `${API_BASE_URL}/question-paper/${id}`,
    DELETE: (id: string) => `${API_BASE_URL}/question-paper/${id}`,
  },
  EXTRACTED_TEXTS: {
    LIST: `${API_BASE_URL}/extracted-texts`,
    GET: (id: string) => `${API_BASE_URL}/extracted-text/${id}`,
    DELETE: (id: string) => `${API_BASE_URL}/extracted-text/${id}`,
  }
};

// Application configuration
export const APP_NAME = 'EvaluRead';
export const APP_VERSION = '1.0.0';

// Authentication configuration
export const AUTH_TOKEN_KEY = 'user';
export const AUTH_HEADER = 'Authorization';

// Default settings
export const DEFAULT_AI_SETTINGS = {
  temperature: 0.7,
  maxTokens: 1000,
  model: 'gemini-pro',  // Keeping Gemini as specified
  professorPersona: 'A strict but fair professor who evaluates answer sheets thoroughly.'
};

// Question paper settings
export const QUESTION_PAPER_ENABLED = true;
export const MAX_QUESTION_PAPERS = 50;

// API configuration
// For deployment, handle different environments
// In development, use localhost; in production, use relative path for same-domain API
const isProduction = import.meta.env.PROD || false;
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 
                           (isProduction ? '/api' : 'http://localhost:3000/api');

// Log the API URL in non-production environments only
if (!isProduction) {
  console.log(`Using API URL: ${API_BASE_URL} (development mode)`);
}

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

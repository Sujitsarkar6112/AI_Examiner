// This file is kept for backward compatibility but no longer has any functionality
// All Gemini API interactions are now handled by the backend through environment variables

// These are placeholders that are no longer used but kept to prevent breaking existing imports
export const setGeminiApiKey = (key: string) => {
  console.log('Gemini API key management is now handled by the server');
};

export const getGeminiApiKey = () => {
  return '';
};

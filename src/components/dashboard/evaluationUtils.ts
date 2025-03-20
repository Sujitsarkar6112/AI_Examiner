import { ParsedScore, DetailedEvaluationScore } from './dashboardTypes';

/**
 * Parse evaluation scores from markdown feedback
 * @param feedback The markdown feedback to parse
 * @returns Parsed score object with total and perspective scores
 */
export const parseEvaluationScores = (feedback: string): ParsedScore => {
  const result = {
    total: 0,
    theoretical: 'N/A',
    practical: 'N/A',
    holistic: 'N/A'
  };
  
  // Extract the total score
  const scoreMatch = feedback.match(/\*\*Score:\*\*\s*(\d+(?:\.\d+)?)/i);
  if (scoreMatch) {
    result.total = parseFloat(scoreMatch[1]);
  }
  
  // Extract individual perspective scores
  const theoreticalMatch = feedback.match(/Theoretical Perspective:\s*(\d+(?:\.\d+)?)/i);
  if (theoreticalMatch) {
    result.theoretical = theoreticalMatch[1];
  }
  
  const practicalMatch = feedback.match(/Practical Perspective:\s*(\d+(?:\.\d+)?)/i);
  if (practicalMatch) {
    result.practical = practicalMatch[1];
  }
  
  const holisticMatch = feedback.match(/Holistic Perspective:\s*(\d+(?:\.\d+)?)/i);
  if (holisticMatch) {
    result.holistic = holisticMatch[1];
  }
  
  return result;
};

/**
 * Extract detailed evaluation scores from the markdown content
 * @param content The evaluation markdown content
 * @returns Array of detailed scores for each question
 */
export const extractDetailedScores = (content: string): DetailedEvaluationScore[] => {
  const scores: DetailedEvaluationScore[] = [];
  
  // Extract question sections
  const questionSections = content.split(/\n## Question \d+/);
  
  // Skip the first section (it's the intro before Question 1)
  for (let i = 1; i < questionSections.length; i++) {
    const section = questionSections[i];
    
    // Extract the score
    const scoreMatch = section.match(/\*\*Score:\*\* (\d+(?:\.\d+)?)/);
    const score = scoreMatch ? parseFloat(scoreMatch[1]) : 0;
    
    // Extract the feedback section
    const feedbackMatch = section.match(/\*\*Feedback:\*\*\s*([\s\S]*?)(?:\n\n|\n\*\*|$)/);
    const feedback = feedbackMatch ? feedbackMatch[1].trim() : '';
    
    // Extract perspective scores if available
    const perspectiveScores: {
      theoretical: number;
      practical: number;
      holistic: number;
    } = {
      theoretical: 0,
      practical: 0,
      holistic: 0
    };
    
    const theoreticalMatch = section.match(/Theoretical Perspective:\s*(\d+(?:\.\d+)?)/i);
    if (theoreticalMatch) {
      perspectiveScores.theoretical = parseFloat(theoreticalMatch[1]);
    }
    
    const practicalMatch = section.match(/Practical Perspective:\s*(\d+(?:\.\d+)?)/i);
    if (practicalMatch) {
      perspectiveScores.practical = parseFloat(practicalMatch[1]);
    }
    
    const holisticMatch = section.match(/Holistic Perspective:\s*(\d+(?:\.\d+)?)/i);
    if (holisticMatch) {
      perspectiveScores.holistic = parseFloat(holisticMatch[1]);
    }
    
    scores.push({
      questionIndex: i - 1,
      score,
      feedback,
      perspectiveScores: Object.values(perspectiveScores).some(val => val > 0) ? perspectiveScores : undefined
    });
  }
  
  return scores;
};

/**
 * Calculate total score from individual question scores
 * @param scores Array of detailed scores
 * @returns Total score sum
 */
export const calculateTotalScore = (scores: DetailedEvaluationScore[]): number => {
  return scores.reduce((sum, item) => sum + item.score, 0);
};

/**
 * Formats the markdown content for better display
 * @param content Raw markdown content
 * @returns Formatted markdown
 */
export const formatMarkdownContent = (content: string): string => {
  // Remove excessive whitespace
  let formatted = content.replace(/\n{3,}/g, '\n\n');
  
  // Format headings
  formatted = formatted.replace(/^# (.*)/gm, '## $1');
  
  return formatted;
};

import { toast } from 'sonner';
import { API_BASE_URL } from '../config';

export interface MappingResult {
  success: boolean;
  qa_mapping?: any[];
  error?: string;
}

export const mapQuestionsWithAnswers = async (
  extractedText: string,
  questionPaperId: string
): Promise<MappingResult> => {
  console.log('Mapping questions with answers...');
  try {
    const requestBody = {
      text: extractedText,
      questionPaperId
    };

    const response = await fetch(`${API_BASE_URL}/map-questions-answers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      let errorMessage = 'Failed to map questions with answers';
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorMessage;
      } catch (parseError) {
        console.error('Error parsing error response:', parseError);
      }
      throw new Error(errorMessage);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error mapping questions with answers:', error);
    toast.error('Failed to map questions with answers. Please try again.');
    throw new Error('Failed to map questions with answers');
  }
};

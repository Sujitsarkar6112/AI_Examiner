import { toast } from 'sonner';
import { fetchData, postData, deleteData } from '../utils/api';

export interface ExtractedText {
  id: string;
  fileName: string;
  timestamp: string;
  text: string;
}

export async function getExtractedTexts(): Promise<ExtractedText[]> {
  try {
    const data = await fetchData<ExtractedText[]>('/extracted-texts');
    return data;
  } catch (error) {
    console.error('Error fetching extracted texts:', error);
    toast.error('Failed to load extracted texts');
    return [];
  }
}

export async function getExtractedText(textId: string): Promise<ExtractedText | null> {
  try {
    const data = await fetchData<ExtractedText>(`/extracted-text/${textId}`);
    return data;
  } catch (error) {
    console.error(`Error fetching extracted text ${textId}:`, error);
    toast.error('Failed to load extracted text');
    return null;
  }
}

export async function deleteExtractedText(textId: string): Promise<boolean> {
  try {
    await deleteData(`/extracted-text/${textId}`);
    toast.success('Extracted text deleted successfully');
    return true;
  } catch (error) {
    console.error(`Error deleting extracted text ${textId}:`, error);
    toast.error('Failed to delete extracted text');
    return false;
  }
}

export async function clearAllExtractedTexts(): Promise<boolean> {
  try {
    await deleteData('/clear-extracted-texts');
    toast.success('All extracted texts deleted successfully');
    return true;
  } catch (error) {
    console.error('Error clearing all extracted texts:', error);
    toast.error('Failed to clear all extracted texts');
    return false;
  }
}

export async function evaluateExtractedText(textId: string, questionPaperId?: string) {
  try {
    const result = await postData('/evaluate-extracted', {
      textId,
      questionPaperId,
    });

    return result;
  } catch (error) {
    console.error('Error evaluating text:', error);
    toast.error(error instanceof Error ? error.message : 'Failed to evaluate text');
    throw error;
  }
}

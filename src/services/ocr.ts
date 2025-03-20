import { toast } from 'sonner';
import api from '../utils/api';
import { fetchData, deleteData } from '../utils/api';

export interface OCRResult {
  text: string;
  confidence: number;
}

export interface OCRHistory {
  id: string;
  fileName: string;
  timestamp: string;
  extractedText: string;
  confidence: number;
}

// Process a file with OCR via backend
export const processFile = async (file: File): Promise<OCRResult> => {
  console.log('Sending file for processing:', file.name);
  
  try {
    const formData = new FormData();
    formData.append('file', file);
    
    // For form data, we need to use the axios instance directly
    const response = await api.post('/process-file', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data;
  } catch (error) {
    console.error('Error in file processing:', error);
    toast.error(error instanceof Error ? error.message : 'Processing failed');
    throw new Error('Unable to process');
  }
};

// Get OCR history from server
export const getOCRHistory = async (): Promise<OCRHistory[]> => {
  try {
    return await fetchData<OCRHistory[]>('/extracted-texts');
  } catch (error) {
    console.error("Failed to get OCR history:", error);
    toast.error("Failed to fetch extraction history. Please try again.");
    return [];
  }
};

// Delete OCR history from server
export const deleteOCRHistory = async (id: string): Promise<boolean> => {
  try {
    await deleteData(`/extracted-text/${id}`);
    toast.success('Extraction deleted successfully');
    return true;
  } catch (error) {
    console.error("Failed to delete OCR history:", error);
    toast.error("Failed to delete from history.");
    return false;
  }
};

// Clear all OCR history
export const clearAllOCRHistory = async (): Promise<boolean> => {
  try {
    await deleteData('/clear-extracted-texts');
    toast.success('All extractions cleared successfully');
    return true;
  } catch (error) {
    console.error("Failed to clear OCR history:", error);
    toast.error("Failed to clear extraction history.");
    return false;
  }
};

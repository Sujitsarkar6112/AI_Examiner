
export const COLLECTIONS = {
  USERS: 'users',
  EVALUATIONS: 'evaluations',
  EXTRACTED_TEXT: 'extractedText',
  QUESTION_PAPERS: 'questionPapers',
  OCR_HISTORY: 'ocrHistory',
};

// Convert MongoDB ObjectId to string ID and vice versa
export const fromObjectId = (doc: any) => {
  if (!doc) return null;
  const { _id, ...rest } = doc;
  return { ...rest, id: _id.toString() };
};

export const toObjectId = (id: string) => {
  // In the frontend, we'll just pass the string ID
  // The actual conversion to ObjectId will happen on the backend
  return id;
};

// Mock getCollection function that will be replaced by API calls
export const getCollection = async (collectionName: string) => {
  console.log(`Mock getCollection called for ${collectionName}`);
  
  // Return a mock collection object with common MongoDB methods
  return {
    find: () => ({
      sort: () => ({
        toArray: async () => [] // Return empty array by default
      })
    }),
    findOne: async () => null,
    insertOne: async (doc: any) => ({ 
      insertedId: { toString: () => Math.random().toString(36).substr(2, 9) }
    }),
    updateOne: async () => ({ modifiedCount: 1 }),
    deleteOne: async () => ({ deletedCount: 1 })
  };
};

'use server';

import { intelligentFileTagging } from '@/ai/flows/intelligent-file-tagging';

export async function getFileTags(fileName: string, fileContent: string) {
  try {
    const result = await intelligentFileTagging({
      fileName,
      fileContent: fileContent.substring(0, 5000), // Use a substring to stay within reasonable limits
      fileMimeType: 'unknown', // MIME type detection would require more complex logic
    });
    return result.suggestedTags;
  } catch (error) {
    console.error('Error in GenAI file tagging flow:', error);
    // Return null or an empty array to handle errors gracefully on the client
    return null;
  }
}

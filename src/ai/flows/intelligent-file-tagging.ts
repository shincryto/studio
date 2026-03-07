'use server';
/**
 * @fileOverview An AI agent that suggests relevant tags or categories for uploaded files.
 *
 * - intelligentFileTagging - A function that handles the file tagging process.
 * - IntelligentFileTaggingInput - The input type for the intelligentFileTagging function.
 * - IntelligentFileTaggingOutput - The return type for the intelligentFileTagging function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const IntelligentFileTaggingInputSchema = z.object({
  fileContent: z
    .string()
    .describe('The content of the file, or a description of its content.'),
  fileName: z.string().optional().describe('The name of the uploaded file.'),
  fileMimeType: z
    .string()
    .optional()
    .describe('The MIME type of the uploaded file.'),
});
export type IntelligentFileTaggingInput = z.infer<
  typeof IntelligentFileTaggingInputSchema
>;

const IntelligentFileTaggingOutputSchema = z.object({
  suggestedTags: z
    .array(z.string())
    .describe('A list of suggested tags or categories for the file.'),
});
export type IntelligentFileTaggingOutput = z.infer<
  typeof IntelligentFileTaggingOutputSchema
>;

export async function intelligentFileTagging(
  input: IntelligentFileTaggingInput
): Promise<IntelligentFileTaggingOutput> {
  return intelligentFileTaggingFlow(input);
}

const intelligentFileTaggingPrompt = ai.definePrompt({
  name: 'intelligentFileTaggingPrompt',
  input: {schema: IntelligentFileTaggingInputSchema},
  output: {schema: IntelligentFileTaggingOutputSchema},
  prompt: `You are an intelligent file tagging assistant. Your goal is to analyze the provided file content and metadata, then suggest a list of relevant tags or categories that would help a user organize and easily find this file later. Provide up to 5 tags.

File Name: {{{fileName}}}
File MIME Type: {{{fileMimeType}}}
File Content/Description: {{{fileContent}}}

Suggested Tags:`,
});

const intelligentFileTaggingFlow = ai.defineFlow(
  {
    name: 'intelligentFileTaggingFlow',
    inputSchema: IntelligentFileTaggingInputSchema,
    outputSchema: IntelligentFileTaggingOutputSchema,
  },
  async input => {
    const {output} = await intelligentFileTaggingPrompt(input);
    return output!;
  }
);

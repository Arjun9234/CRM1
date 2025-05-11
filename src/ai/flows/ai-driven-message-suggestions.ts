// src/ai/flows/ai-driven-message-suggestions.ts
'use server';

/**
 * @fileOverview This file contains the AI-driven message suggestion flow.
 *
 * - generateMessageSuggestions - Generates message suggestions based on a campaign objective.
 * - GenerateMessageSuggestionsInput - The input type for the generateMessageSuggestions function.
 * - GenerateMessageSuggestionsOutput - The output type for the generateMessageSuggestions function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateMessageSuggestionsInputSchema = z.object({
  campaignObjective: z
    .string()
    .describe('The objective of the campaign, e.g., \'bring back inactive users\'.'),
});
export type GenerateMessageSuggestionsInput = z.infer<
  typeof GenerateMessageSuggestionsInputSchema
>;

const GenerateMessageSuggestionsOutputSchema = z.object({
  suggestions: z
    .array(z.string())
    .describe('An array of suggested message variants for the campaign.'),
});
export type GenerateMessageSuggestionsOutput = z.infer<
  typeof GenerateMessageSuggestionsOutputSchema
>;

export async function generateMessageSuggestions(
  input: GenerateMessageSuggestionsInput
): Promise<GenerateMessageSuggestionsOutput> {
  return generateMessageSuggestionsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateMessageSuggestionsPrompt',
  input: {schema: GenerateMessageSuggestionsInputSchema},
  output: {schema: GenerateMessageSuggestionsOutputSchema},
  prompt: `You are a marketing expert. Given a campaign objective, you will generate 2-3 message variants to choose from.

Campaign Objective: {{{campaignObjective}}}

Respond with an array of strings.  Each string must be a message variant.  The strings should be different from each other.

For example:

{
  "suggestions": [
    "Hi! We miss you! Come back and get 10% off your next order.",
    "Long time no see!  Here's a special offer just for you.",
    "We noticed you haven't been around lately.  Here's a coupon to welcome you back."
  ]
}
`,
});

const generateMessageSuggestionsFlow = ai.defineFlow(
  {
    name: 'generateMessageSuggestionsFlow',
    inputSchema: GenerateMessageSuggestionsInputSchema,
    outputSchema: GenerateMessageSuggestionsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

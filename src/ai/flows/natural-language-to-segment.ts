// src/ai/flows/natural-language-to-segment.ts
'use server';
/**
 * @fileOverview Converts natural language descriptions of customer segments into logical rules.
 *
 * - naturalLanguageToSegment - A function that translates natural language to segment rules.
 * - NaturalLanguageToSegmentInput - The input type for the naturalLanguageToSegment function.
 * - NaturalLanguageToSegmentOutput - The return type for the naturalLanguageToSegment function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const NaturalLanguageToSegmentInputSchema = z.object({
  naturalLanguage: z
    .string()
    .describe(
      'A natural language description of a customer segment, e.g., \'customers who haven\'t purchased in 6 months and spent over $50\'.' // escaping single quotes
    ),
});
export type NaturalLanguageToSegmentInput = z.infer<
  typeof NaturalLanguageToSegmentInputSchema
>;

const NaturalLanguageToSegmentOutputSchema = z.object({
  segmentRule: z
    .string()
    .describe(
      'A logical rule representing the customer segment, e.g., \'last_purchase_date < NOW() - INTERVAL 6 MONTH AND total_spent > 50\'.'
    ),
});
export type NaturalLanguageToSegmentOutput = z.infer<
  typeof NaturalLanguageToSegmentOutputSchema
>;

export async function naturalLanguageToSegment(
  input: NaturalLanguageToSegmentInput
): Promise<NaturalLanguageToSegmentOutput> {
  return naturalLanguageToSegmentFlow(input);
}

const prompt = ai.definePrompt({
  name: 'naturalLanguageToSegmentPrompt',
  input: {schema: NaturalLanguageToSegmentInputSchema},
  output: {schema: NaturalLanguageToSegmentOutputSchema},
  prompt: `You are an expert at converting natural language descriptions of customer segments into logical rules.

  Translate the following natural language description into a logical rule that can be used to define a customer segment.

  Natural Language Description: {{{naturalLanguage}}}

  Logical Rule:`,
});

const naturalLanguageToSegmentFlow = ai.defineFlow(
  {
    name: 'naturalLanguageToSegmentFlow',
    inputSchema: NaturalLanguageToSegmentInputSchema,
    outputSchema: NaturalLanguageToSegmentOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

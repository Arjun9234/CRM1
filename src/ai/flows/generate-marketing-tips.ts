
'use server';
/**
 * @fileOverview Generates marketing tips using AI.
 *
 * - generateMarketingTips - A function that generates a specified number of marketing tips.
 * - GenerateMarketingTipsInput - The input type for the generateMarketingTips function.
 * - GenerateMarketingTipsOutput - The output type for the generateMarketingTips function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateMarketingTipsInputSchema = z.object({
  count: z
    .number()
    .optional()
    .default(3)
    .describe('The number of marketing tips to generate.'),
});
export type GenerateMarketingTipsInput = z.infer<typeof GenerateMarketingTipsInputSchema>;

const GenerateMarketingTipsOutputSchema = z.object({
  tips: z
    .array(z.string())
    .describe('An array of actionable marketing tips.'),
});
export type GenerateMarketingTipsOutput = z.infer<typeof GenerateMarketingTipsOutputSchema>;

export async function generateMarketingTips(
  input: GenerateMarketingTipsInput
): Promise<GenerateMarketingTipsOutput> {
  return generateMarketingTipsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateMarketingTipsPrompt',
  input: {schema: GenerateMarketingTipsInputSchema},
  output: {schema: GenerateMarketingTipsOutputSchema},
  prompt: `You are a marketing expert. Generate {{count}} concise and actionable marketing tips suitable for a CRM user looking to improve their customer engagement campaigns.
  Focus on tips related to personalization, segmentation, A/B testing, timing, and calls to action.
  Each tip should be a single sentence or two.

  For example:
  {
    "tips": [
      "Personalize your email subject lines to significantly boost open rates.",
      "Use A/B testing for your call-to-action buttons to see what resonates best with your audience.",
      "Segment your audience based on past purchase behavior for more targeted messaging."
    ]
  }
  `,
});

const generateMarketingTipsFlow = ai.defineFlow(
  {
    name: 'generateMarketingTipsFlow',
    inputSchema: GenerateMarketingTipsInputSchema,
    outputSchema: GenerateMarketingTipsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

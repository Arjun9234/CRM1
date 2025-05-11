'use server';

/**
 * @fileOverview A campaign performance summarization AI agent.
 *
 * - summarizeCampaignPerformance - A function that generates a human-readable summary of campaign performance.
 * - CampaignPerformanceInput - The input type for the summarizeCampaignPerformance function.
 * - CampaignPerformanceOutput - The return type for the summarizeCampaignPerformance function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CampaignPerformanceInputSchema = z.object({
  campaignName: z.string().describe('The name of the campaign.'),
  audienceSize: z.number().describe('The total number of users in the campaign audience.'),
  messagesSent: z.number().describe('The number of messages sent for the campaign.'),
  messagesDelivered: z.number().describe('The number of messages successfully delivered.'),
  highSpendDeliveryRate: z
    .number()
    .describe('The delivery rate for customers with high spending (e.g., > ₹10K).'),
});
export type CampaignPerformanceInput = z.infer<typeof CampaignPerformanceInputSchema>;

const CampaignPerformanceOutputSchema = z.object({
  summary: z.string().describe('A human-readable summary of the campaign performance.'),
});
export type CampaignPerformanceOutput = z.infer<typeof CampaignPerformanceOutputSchema>;

export async function summarizeCampaignPerformance(
  input: CampaignPerformanceInput
): Promise<CampaignPerformanceOutput> {
  return summarizeCampaignPerformanceFlow(input);
}

const prompt = ai.definePrompt({
  name: 'campaignPerformanceSummarizationPrompt',
  input: {schema: CampaignPerformanceInputSchema},
  output: {schema: CampaignPerformanceOutputSchema},
  prompt: `You are an expert marketing analyst. You are great at summarizing campaign performance in a human-readable format.

  Here are the campaign performance statistics for the campaign "{{campaignName}}":
  - Audience Size: {{audienceSize}}
  - Messages Sent: {{messagesSent}}
  - Messages Delivered: {{messagesDelivered}}
  - High Spend Delivery Rate: {{highSpendDeliveryRate}}%

  Generate a concise and insightful summary of the campaign performance, highlighting key metrics and trends. Be sure to include the campaign name in the summary.
  `,
});

const summarizeCampaignPerformanceFlow = ai.defineFlow(
  {
    name: 'summarizeCampaignPerformanceFlow',
    inputSchema: CampaignPerformanceInputSchema,
    outputSchema: CampaignPerformanceOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

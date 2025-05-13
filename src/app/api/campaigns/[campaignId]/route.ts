
import { NextResponse } from 'next/server';
import type { CampaignUpdatePayload } from '@/lib/types';
import { z } from 'zod';

const segmentRuleSchema = z.object({
  id: z.string(),
  field: z.string(),
  operator: z.string(),
  value: z.string(),
});

const campaignUpdateSchema = z.object({
  name: z.string().min(1, "Campaign name is required").optional(),
  segmentName: z.string().optional(),
  rules: z.array(segmentRuleSchema).optional(),
  ruleLogic: z.enum(['AND', 'OR']).optional(),
  message: z.string().min(1, "Message is required").optional(),
  status: z.enum(['Draft', 'Scheduled', 'Sent', 'Failed', 'Archived', 'Cancelled']).optional(),
  audienceSize: z.number().min(0).optional(),
  sentCount: z.number().min(0).optional(),
  failedCount: z.number().min(0).optional(),
}).partial();

const API_BASE_URL = `http://localhost:${process.env.SERVER_PORT || 5000}/api`;

export async function GET(
  request: Request,
  { params }: { params: { campaignId: string } }
) {
  const campaignId = params.campaignId;
  if (!campaignId) {
    return NextResponse.json({ message: 'Campaign ID is required' }, { status: 400 });
  }

  try {
    const response = await fetch(`${API_BASE_URL}/campaigns/${campaignId}`);
    const responseData = await response.json();

    if (!response.ok) {
      console.error(`Error fetching campaign ${campaignId} from backend:`, response.status, responseData);
      throw new Error(responseData.message || `Backend error: ${response.status}`);
    }
    return NextResponse.json(responseData);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`Error in GET /api/campaigns/${campaignId} (Next.js API route):`, errorMessage);
    return NextResponse.json({ message: 'Failed to fetch campaign', error: errorMessage }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { campaignId: string } }
) {
  const campaignId = params.campaignId;
  if (!campaignId) {
    return NextResponse.json({ message: 'Campaign ID is required' }, { status: 400 });
  }

  let parsedBody: any;
  try {
    parsedBody = await request.json();
  } catch (e) {
    return NextResponse.json({ message: 'Invalid JSON body' }, { status: 400 });
  }

  const validationResult = campaignUpdateSchema.safeParse(parsedBody);

  if (!validationResult.success) {
    return NextResponse.json({ message: 'Invalid campaign data', errors: validationResult.error.flatten().fieldErrors }, { status: 400 });
  }
  
  const validatedDataToUpdate: CampaignUpdatePayload = validationResult.data;

  try {
    const backendResponse = await fetch(`${API_BASE_URL}/campaigns/${campaignId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(validatedDataToUpdate),
    });

    const responseData = await backendResponse.json();

    if (!backendResponse.ok) {
      console.error(`Error updating campaign ${campaignId} via backend:`, backendResponse.status, responseData);
      throw new Error(responseData.message || `Backend error: ${backendResponse.status}`);
    }
    return NextResponse.json(responseData);
  } catch (error) { 
    const errorMessage = error instanceof Error ? error.message : 'Unknown error during update';
    console.error(`Error in PUT /api/campaigns/${campaignId} (Next.js API route):`, errorMessage);
    return NextResponse.json({ message: 'Failed to update campaign', error: errorMessage }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { campaignId: string } }
) {
  const campaignId = params.campaignId;
  if (!campaignId) {
    return NextResponse.json({ message: 'Campaign ID is required' }, { status: 400 });
  }

  try {
    const backendResponse = await fetch(`${API_BASE_URL}/campaigns/${campaignId}`, {
      method: 'DELETE',
    });

    if (!backendResponse.ok) {
      // Try to parse error response if not a 204 (No Content)
      let errorData;
      if (backendResponse.status !== 204) {
         errorData = await backendResponse.json();
      }
      console.error(`Error deleting campaign ${campaignId} via backend:`, backendResponse.status, errorData);
      throw new Error(errorData?.message || `Backend error: ${backendResponse.status}`);
    }
    // For DELETE, a 200 or 204 is typical for success. Node server sends JSON message.
    if (backendResponse.status === 204) {
        return NextResponse.json({ message: 'Campaign deleted successfully' });
    }
    const responseData = await backendResponse.json();
    return NextResponse.json(responseData);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`Error in DELETE /api/campaigns/${campaignId} (Next.js API route):`, errorMessage);
    return NextResponse.json({ message: 'Failed to delete campaign', error: errorMessage }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import type { CampaignUpdatePayload, Campaign } from '@/lib/types';
import { z } from 'zod';
import { API_BASE_URL as BACKEND_API_BASE_URL } from '@/lib/config'; // Renamed to avoid conflict if this file also defined API_BASE_URL locally

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

// const API_BASE_URL = `http://localhost:${process.env.SERVER_PORT || 5000}/api`; // Removed

export async function GET(
  request: Request,
  { params }: { params: { campaignId: string } }
) {
  const campaignId = params.campaignId;
  if (!campaignId) {
    return NextResponse.json({ message: 'Campaign ID is required' }, { status: 400 });
  }

  try {
    const response = await fetch(`${BACKEND_API_BASE_URL}/campaigns/${campaignId}`);
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
    const backendResponse = await fetch(`${BACKEND_API_BASE_URL}/campaigns/${campaignId}`, {
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
    const backendResponse = await fetch(`${BACKEND_API_BASE_URL}/campaigns/${campaignId}`, {
      method: 'DELETE',
    });

    if (!backendResponse.ok) {
      let errorData;
      try {
        if (backendResponse.status !== 204) { 
           errorData = await backendResponse.json();
        }
      } catch (e) {
        errorData = { message: `Backend error: ${backendResponse.statusText || backendResponse.status}` };
      }
      console.error(`Error deleting campaign ${campaignId} via backend:`, backendResponse.status, errorData);
      throw new Error(errorData?.message || `Backend error: ${backendResponse.status}`);
    }
    
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

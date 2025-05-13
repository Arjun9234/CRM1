import { NextResponse } from 'next/server';
import type { Campaign, CampaignCreationPayload } from '@/lib/types';
import { z } from 'zod';
import { API_BASE_URL as BACKEND_API_BASE_URL } from '@/lib/config'; // Renamed to avoid conflict

const segmentRuleSchema = z.object({
  id: z.string(),
  field: z.string(),
  operator: z.string(),
  value: z.string(),
});

const campaignCreationSchema = z.object({
  name: z.string().min(1, "Campaign name is required"),
  segmentName: z.string().optional(),
  rules: z.array(segmentRuleSchema).min(1, "At least one segment rule is required"),
  ruleLogic: z.enum(['AND', 'OR']),
  message: z.string().min(1, "Message is required"),
  status: z.enum(['Draft', 'Scheduled', 'Sent', 'Failed', 'Archived', 'Cancelled']),
  audienceSize: z.number().min(0),
});

// const API_BASE_URL = `http://localhost:${process.env.SERVER_PORT || 5000}/api`; // Removed

export async function GET() {
  try {
    const response = await fetch(`${BACKEND_API_BASE_URL}/campaigns`, {
      cache: 'no-store', 
    });
    const responseText = await response.text();

    if (!response.ok) {
      console.error("Error fetching campaigns from backend (Next.js API route GET /api/campaigns):", response.status, responseText.substring(0, 500));
      let errorMessage = `Backend error: ${response.status}`;
      try {
        if (responseText && responseText.trim().toLowerCase().startsWith("<html")) {
          errorMessage = `Backend returned an HTML error page (status: ${response.status}). Check backend server logs.`;
        } else if (responseText) {
          const errorJson = JSON.parse(responseText);
          errorMessage = errorJson.message || errorMessage;
        }
      } catch(e: any) {
        errorMessage = `Failed to fetch campaigns from backend. Status: ${response.status}. Response: ${responseText ? responseText.substring(0,100) : "Empty response"}`;
      }
      throw new Error(errorMessage);
    }
    const campaigns: Campaign[] = JSON.parse(responseText);
    return NextResponse.json(campaigns);
  } catch (error: any) {
    console.error("--- CRITICAL UNHANDLED ERROR IN GET /api/campaigns (Next.js API route) ---");
    console.error("Error Message:", error.message);
    console.error("Error Stack:", error.stack);
     return NextResponse.json(
      { message: 'Failed to fetch campaigns', error: error.message || 'Unknown server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    let body;
    try {
        body = await request.json();
    } catch (jsonError: any) {
        console.error("POST /api/campaigns (Next.js API route): Invalid JSON in request body:", jsonError.message);
        return NextResponse.json({ message: 'Invalid JSON payload provided.', error: jsonError.message }, { status: 400 });
    }
    
    const validationResult = campaignCreationSchema.safeParse(body);
    if (!validationResult.success) {
      console.warn("POST /api/campaigns (Next.js API route): Validation failed for request body:", validationResult.error.flatten().fieldErrors);
      return NextResponse.json({ 
        message: 'Invalid campaign data', 
        errors: validationResult.error.flatten().fieldErrors 
      }, { status: 400 });
    }
    
    const validatedPayload = validationResult.data as CampaignCreationPayload;

    const backendResponse = await fetch(`${BACKEND_API_BASE_URL}/campaigns`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(validatedPayload),
    });

    const responseText = await backendResponse.text();
    let responseData;

    try {
        responseData = JSON.parse(responseText);
    } catch (e) {
        if (!backendResponse.ok) {
            console.error("Error creating campaign via backend (Next.js API route POST /api/campaigns), non-JSON error response:", backendResponse.status, responseText.substring(0, 500));
            if (responseText && responseText.trim().toLowerCase().startsWith("<html")) {
                 throw new Error(`Backend returned an HTML error page (status: ${backendResponse.status}). Check backend server logs for details. Preview: ${responseText.substring(0,200)}`);
            }
            throw new Error(responseText.substring(0, 200) || `Backend error: ${backendResponse.status}`);
        }
        console.warn("Backend response was OK but not valid JSON (POST /api/campaigns):", responseText.substring(0,500));
        throw new Error("Backend response was OK but not valid JSON. Expected JSON campaign data.");
    }


    if (!backendResponse.ok) {
      console.error("Error creating campaign via backend (Next.js API route POST /api/campaigns), after JSON parse attempt:", backendResponse.status, responseData);
      throw new Error(responseData?.message || `Backend error: ${backendResponse.status}`);
    }
    
    return NextResponse.json(responseData, { status: backendResponse.status });

  } catch (error: any) {
    console.error("--- CRITICAL ERROR IN POST /api/campaigns (Next.js API route) ---");
    console.error("Error Message:", error.message);
    console.error("Error Stack:", error.stack); 
     return NextResponse.json({ message: 'Failed to create campaign', error: error.message || 'Unknown server error' }, { status: 500 });
  }
}

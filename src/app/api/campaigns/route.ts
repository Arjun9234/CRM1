
import { NextResponse } from 'next/server';
import type { Campaign, CampaignCreationPayload } from '@/lib/types';
import { z } from 'zod';

// Zod schema for validation
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
  // sentCount and failedCount are typically set by backend or derived
});

const API_BASE_URL = `http://localhost:${process.env.SERVER_PORT || 5000}/api`;

export async function GET() {
  try {
    const response = await fetch(`${API_BASE_URL}/campaigns`, {
      cache: 'no-store', // Ensure fresh data
    });
    if (!response.ok) {
      const errorBody = await response.text(); // Read body once
      console.error("Error fetching campaigns from backend:", response.status, errorBody ? errorBody.substring(0, 500) : "Empty error body");
      let errorMessage = `Backend error: ${response.status}`;
      try {
        if (errorBody && errorBody.trim().toLowerCase().startsWith("<html")) {
          errorMessage = `Backend returned an HTML error page (status: ${response.status}). Check backend server logs.`;
        } else if (errorBody) {
          const errorJson = JSON.parse(errorBody);
          errorMessage = errorJson.message || errorMessage;
        }
      } catch(e: any) {
        // If JSON.parse fails or it was an HTML error initially caught
        errorMessage = `Failed to fetch campaigns from backend. Status: ${response.status}. Response: ${errorBody ? errorBody.substring(0,100) : "Empty response"}`;
      }
      throw new Error(errorMessage);
    }
    const campaigns: Campaign[] = await response.json();
    return NextResponse.json(campaigns);
  } catch (error: any) {
    console.error("--- CRITICAL UNHANDLED ERROR IN GET /api/campaigns (Next.js API route) ---");
    console.error("Error Message:", error.message);
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

    const backendResponse = await fetch(`${API_BASE_URL}/campaigns`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(validationResult.data),
    });

    // Try to parse JSON regardless of status, as backend might send JSON error details
    let responseData;
    const responseText = await backendResponse.text();
    try {
        responseData = JSON.parse(responseText);
    } catch (e) {
        // If JSON parsing fails, and it's an error, use the text as error message
        if (!backendResponse.ok) {
            console.error("Error creating campaign via backend, non-JSON response:", backendResponse.status, responseText);
            throw new Error(responseText.substring(0, 200) || `Backend error: ${backendResponse.status}`);
        }
        // If it was OK but not JSON, this is unexpected
        console.warn("Backend response was OK but not valid JSON:", responseText);
        responseData = { message: "Campaign created, but response format was unexpected." }; // Or handle as error
    }


    if (!backendResponse.ok) {
      console.error("Error creating campaign via backend:", backendResponse.status, responseData);
      throw new Error(responseData?.message || `Backend error: ${backendResponse.status}`);
    }
    
    return NextResponse.json(responseData, { status: backendResponse.status });

  } catch (error: any) {
    console.error("--- CRITICAL ERROR IN POST /api/campaigns (Next.js API route) ---");
    console.error("Error Message:", error.message);
    return NextResponse.json({ message: 'Failed to create campaign', error: error.message || 'Unknown server error' }, { status: 500 });
  }
}

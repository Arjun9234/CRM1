
import { NextResponse } from 'next/server';
import { collection, addDoc, getDocs, Timestamp, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Campaign, CampaignCreationPayload } from '@/lib/types';
import { z } from 'zod';
import { getInMemoryDummyCampaigns, addInMemoryDummyCampaign } from '@/lib/dummy-data-store';

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
});


export async function GET(request: Request) {
  console.log("GET /api/campaigns: Request received at", new Date().toISOString());
  const url = new URL(request.url);
  console.log("GET /api/campaigns: Request URL:", url.pathname + url.search);
  
  try { 
    let firebaseCampaigns: Campaign[] = [];
    let firebaseError = false;

    try { 
      if (!db) { 
        console.warn("GET /api/campaigns: Firestore database is not initialized. Likely Firebase config issue. Returning only dummy data.");
        firebaseError = true;
      } else {
        console.log("GET /api/campaigns: Firestore DB instance available. Querying campaigns collection...");
        const campaignsCol = collection(db, 'campaigns');
        const q = query(campaignsCol, orderBy('createdAt', 'desc'));
        const campaignSnapshot = await getDocs(q);
        console.log(`GET /api/campaigns: Firestore getDocs call completed. Found ${campaignSnapshot.docs.length} documents.`);
        
        if (!campaignSnapshot.empty) {
          firebaseCampaigns = campaignSnapshot.docs.map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              name: data.name,
              segmentName: data.segmentName,
              rules: data.rules,
              ruleLogic: data.ruleLogic,
              message: data.message,
              status: data.status,
              audienceSize: data.audienceSize,
              sentCount: data.sentCount,
              failedCount: data.failedCount,
              createdAt: (data.createdAt as Timestamp)?.toDate().toISOString() || new Date().toISOString(),
              updatedAt: (data.updatedAt as Timestamp)?.toDate().toISOString(),
            } as Campaign;
          });
        }
      }
    } catch (error: any) {
      console.error("--- ERROR IN GET /api/campaigns (Firebase fetch) ---");
      console.error("Timestamp:", new Date().toISOString());
      console.error("Error Message:", error.message);
      console.error("Error Stack Preview:", error.stack?.substring(0, 300));
      console.error("--- End of Firebase fetch Error ---");
      firebaseError = true; 
    }

    const inMemoryCampaigns = getInMemoryDummyCampaigns();
    const combinedCampaignsMap = new Map<string, Campaign>();

    inMemoryCampaigns.forEach(campaign => {
      combinedCampaignsMap.set(campaign.id, JSON.parse(JSON.stringify(campaign)));
    });

    firebaseCampaigns.forEach(campaign => {
      combinedCampaignsMap.set(campaign.id, campaign); 
    });
    
    const finalCampaignList = Array.from(combinedCampaignsMap.values())
                                   .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    if (firebaseError && firebaseCampaigns.length === 0) {
       console.warn("GET /api/campaigns: Firebase error during GET. Merged results will primarily use in-memory data if Firebase fetch failed or DB is uninitialized.");
    }
    console.log(`GET /api/campaigns: Returning ${finalCampaignList.length} campaigns after merging.`);
    return NextResponse.json(finalCampaignList);

  } catch (error: any) {
    console.error("--- CRITICAL UNHANDLED ERROR IN GET /api/campaigns ---");
    console.error("Timestamp:", new Date().toISOString());
    console.error("Error Message:", error.message);
    console.error("Error Stack:", error.stack);
    // Attempt to log the full error object if it's not an Error instance
    if (typeof error === 'object' && error !== null && !(error instanceof Error)) {
        try {
            console.error("Full raw error object (attempting stringify):", JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
        } catch (e) {
            console.error("Full raw error object (unserializable):", error);
        }
    }
    console.error("--- End of Critical Error in GET /api/campaigns ---");
    
    return NextResponse.json(
      { message: 'Failed to fetch campaigns due to an unexpected server error.', error: error.message || 'Unknown server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  console.log("POST /api/campaigns: Received request at", new Date().toISOString());
  try {
    if (!db) { 
      console.error("POST /api/campaigns: Firestore database is not initialized. Check Firebase configuration.");
      return NextResponse.json({ message: 'Database not initialized. Ensure Firebase is correctly configured in .env and project settings.' }, { status: 503 }); // 503 Service Unavailable
    }
    console.log("POST /api/campaigns: Firestore DB instance seems available.");

    let body;
    try {
        const rawBody = await request.text(); // Read as text first for logging
        console.log("POST /api/campaigns: Raw request body:", rawBody.substring(0, 500) + (rawBody.length > 500 ? "..." : ""));
        body = JSON.parse(rawBody); // Then parse
    } catch (jsonError: any) {
        console.error("POST /api/campaigns: Invalid JSON in request body:", jsonError.message);
        return NextResponse.json({ message: 'Invalid JSON payload provided.', error: jsonError.message }, { status: 400 });
    }
    
    console.log("POST /api/campaigns: Parsed request body:", JSON.stringify(body, null, 2).substring(0, 1000) + (JSON.stringify(body, null, 2).length > 1000 ? "..." : ""));
    
    const validationResult = campaignCreationSchema.safeParse(body);
    if (!validationResult.success) {
      console.warn("POST /api/campaigns: Validation failed for request body:", validationResult.error.flatten().fieldErrors);
      return NextResponse.json({ 
        message: 'Invalid campaign data', 
        errors: validationResult.error.flatten().fieldErrors 
      }, { status: 400 });
    }
    console.log("POST /api/campaigns: Request body validated successfully.");

    const { name, segmentName, rules, ruleLogic, message, status, audienceSize } = validationResult.data;

    const dataToSave = {
        name,
        rules,
        ruleLogic,
        message,
        status,
        audienceSize,
        createdAt: Timestamp.now(),
        sentCount: 0, 
        failedCount: 0, 
        ...(segmentName && { segmentName }), 
    };
    
    if (dataToSave.status === 'Sent' && dataToSave.audienceSize > 0) {
        const successRate = Math.random() * 0.20 + 0.75; 
        dataToSave.sentCount = Math.floor(dataToSave.audienceSize * successRate);
        dataToSave.failedCount = dataToSave.audienceSize - dataToSave.sentCount;
    } else if (dataToSave.status === 'Sent' && dataToSave.audienceSize === 0) {
        dataToSave.sentCount = 0;
        dataToSave.failedCount = 0;
    }

    console.log("POST /api/campaigns: Data being sent to Firestore:", JSON.stringify(dataToSave, (key, value) => typeof value === 'bigint' ? value.toString() : value, 2).substring(0, 500) + (JSON.stringify(dataToSave, null, 2).length > 500 ? "..." : ""));


    const campaignsCol = collection(db, 'campaigns');
    let docRef;
    try {
        console.log("POST /api/campaigns: Attempting to add document to Firestore...");
        docRef = await addDoc(campaignsCol, dataToSave);
        console.log("POST /api/campaigns: Document added to Firestore with ID:", docRef.id);
    } catch (firestoreError: any) {
        console.error("--- Firestore addDoc Error in POST /api/campaigns ---");
        console.error("Timestamp:", new Date().toISOString());
        console.error("Error Message:", firestoreError.message);
        console.error("Error Code:", firestoreError.code);
        console.error("Data attempted to save (preview):", JSON.stringify(dataToSave, null, 2).substring(0, 500) + "...");
        // console.error("Stack:", firestoreError.stack); // Stack can be very long
        console.error("--- End of Firestore addDoc Error ---");
        throw firestoreError; // Rethrow to be caught by the outer catch block
    }
    
    const createdCampaignResponse: Campaign = {
        id: docRef.id,
        name: dataToSave.name,
        segmentName: dataToSave.segmentName,
        rules: dataToSave.rules,
        ruleLogic: dataToSave.ruleLogic,
        message: dataToSave.message,
        status: dataToSave.status,
        audienceSize: dataToSave.audienceSize,
        sentCount: dataToSave.sentCount,
        failedCount: dataToSave.failedCount,
        createdAt: dataToSave.createdAt.toDate().toISOString(),
    };

    try {
      addInMemoryDummyCampaign(createdCampaignResponse); 
      console.log("POST /api/campaigns: Campaign added to in-memory store.");
    } catch (inMemoryError: any) {
      console.error("Error adding campaign to in-memory store after Firebase success (POST /api/campaigns):", inMemoryError.message);
    }
    
    console.log("POST /api/campaigns: Successfully created campaign, returning 201 response.");
    return NextResponse.json(createdCampaignResponse, { status: 201 });

  } catch (error: any) {
    console.error("--- CRITICAL ERROR IN POST /api/campaigns ---");
    console.error("Timestamp:", new Date().toISOString());
    
    let errorMessage = 'An unexpected error occurred while creating the campaign.';
    let errorDetails: Record<string, any> = { rawError: String(error) };

    if (error.name === 'FirebaseError' || (error.code && typeof error.code === 'string' && (error.code.startsWith('firebase') || error.code.startsWith('firestore')) )) {
        errorMessage = `Firebase error: ${error.message} (Code: ${error.code || 'N/A'})`;
        errorDetails = { type: 'FirebaseError', code: error.code, firebaseMessage: error.message };
    } else if (error instanceof z.ZodError) {
        errorMessage = 'Invalid data format for campaign creation.';
        errorDetails = error.flatten().fieldErrors;
    } else if (error instanceof SyntaxError && error.message.includes("JSON")) {
        errorMessage = 'Invalid JSON payload provided (caught by main try-catch).';
        errorDetails = { type: 'SyntaxError', syntaxErrorMessage: error.message };
    } else if (error instanceof Error) {
        errorMessage = error.message;
        errorDetails = { type: 'GenericError', genericErrorMessage: error.message, stackPreview: error.stack?.substring(0, 300) };
    } else if (typeof error === 'string') {
        errorMessage = error;
        errorDetails = { type: 'StringError', rawErrorString: error };
    }
    
    // Sanitize errorDetails for response
    let safeDetailsForResponse: any = { message: "Details not available or not serializable." };
    if (errorDetails && typeof errorDetails === 'object') {
        safeDetailsForResponse = {};
        for (const key in errorDetails) {
            if (Object.prototype.hasOwnProperty.call(errorDetails, key)) {
                const value = errorDetails[key];
                if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean' || value === null) {
                    safeDetailsForResponse[key] = value;
                } else if (Array.isArray(value) && value.every(item => typeof item === 'string')) {
                     safeDetailsForResponse[key] = value;
                } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                    safeDetailsForResponse[key] = {};
                    for(const nestedKey in value as Record<string, any>) {
                        if (Object.prototype.hasOwnProperty.call(value, nestedKey)) {
                            const nestedValue = (value as Record<string, any>)[nestedKey];
                             if (typeof nestedValue === 'string' || (Array.isArray(nestedValue) && nestedValue.every(item => typeof item === 'string'))) {
                                safeDetailsForResponse[key][nestedKey] = nestedValue;
                             } else {
                                safeDetailsForResponse[key][nestedKey] = "[Non-Serializable Nested Value]";
                             }
                        }
                    }
                } else {
                    safeDetailsForResponse[key] = "[Non-Serializable Value]";
                }
            }
        }
    } else if (typeof errorDetails === 'string') {
        safeDetailsForResponse = { originalDetails: errorDetails };
    }
    
    console.error("Error Message:", errorMessage);
    console.error("Error Details (Processed for logging):", JSON.stringify(safeDetailsForResponse, null, 2));
    
    if (typeof error === 'object' && error !== null && !(error instanceof Error)) {
        try {
            console.error("Full raw error object (attempting stringify):", JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
        } catch (e) {
            console.error("Full raw error object (unserializable):", error);
        }
    }
    console.error("--- End of Critical Error in POST /api/campaigns ---");
    
    const safeErrorMessageForResponse = typeof errorMessage === 'string' && errorMessage.length < 200 ? errorMessage : 'An unexpected error occurred.';

    console.log("POST /api/campaigns: Returning error response:", { message: 'Failed to create campaign', error: safeErrorMessageForResponse });
    return NextResponse.json({ message: 'Failed to create campaign', error: safeErrorMessageForResponse, details: safeDetailsForResponse }, { status: 500 });
  }
}

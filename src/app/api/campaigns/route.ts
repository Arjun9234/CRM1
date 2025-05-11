
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


export async function GET() {
  let firebaseCampaigns: Campaign[] = [];
  let firebaseError = false;

  try {
    if (!db) { // Check if db is initialized
      throw new Error("Firestore database is not initialized. Check Firebase configuration.");
    }
    const campaignsCol = collection(db, 'campaigns');
    const q = query(campaignsCol, orderBy('createdAt', 'desc'));
    const campaignSnapshot = await getDocs(q);
    
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
  } catch (error) {
    console.error("Error fetching campaigns from Firebase (GET /api/campaigns):", error);
    firebaseError = true; 
  }

  const inMemoryCampaigns = getInMemoryDummyCampaigns();

  const combinedCampaignsMap = new Map<string, Campaign>();

  inMemoryCampaigns.forEach(campaign => {
    combinedCampaignsMap.set(campaign.id, campaign);
  });

  firebaseCampaigns.forEach(campaign => {
    combinedCampaignsMap.set(campaign.id, campaign);
  });
  
  const finalCampaignList = Array.from(combinedCampaignsMap.values())
                                 .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  if (firebaseError && firebaseCampaigns.length === 0) {
     console.warn("Firebase error during GET /api/campaigns. Merged results will primarily use in-memory data.");
  }
  
  return NextResponse.json(finalCampaignList);
}

export async function POST(request: Request) {
  try {
    if (!db) { // Check if db is initialized
      console.error("Firestore database is not initialized in POST /api/campaigns. Check Firebase configuration.");
      return NextResponse.json({ message: 'Failed to create campaign', error: 'Database not initialized.' }, { status: 500 });
    }

    const body = await request.json();
    
    const validationResult = campaignCreationSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json({ 
        message: 'Invalid campaign data', 
        errors: validationResult.error.flatten().fieldErrors 
      }, { status: 400 });
    }

    const { name, segmentName, rules, ruleLogic, message, status, audienceSize } = validationResult.data;

    const dataToSave: Omit<CampaignCreationPayload, 'audienceSize' | 'status'> & { 
        audienceSize: number; 
        status: Campaign['status']; 
        createdAt: Timestamp; 
        sentCount: number; 
        failedCount: number; 
        segmentName?: string;
    } = {
        name,
        rules,
        ruleLogic,
        message,
        status,
        audienceSize,
        createdAt: Timestamp.now(),
        sentCount: 0,
        failedCount: 0,
    };

    if (segmentName) {
        dataToSave.segmentName = segmentName;
    }
    
    if (dataToSave.status === 'Sent' && dataToSave.audienceSize > 0) {
        const successRate = Math.random() * 0.20 + 0.75;
        dataToSave.sentCount = Math.floor(dataToSave.audienceSize * successRate);
        dataToSave.failedCount = dataToSave.audienceSize - dataToSave.sentCount;
    } else if (dataToSave.status === 'Sent' && dataToSave.audienceSize === 0) {
        dataToSave.sentCount = 0;
        dataToSave.failedCount = 0;
    }

    console.log("Data being sent to Firestore (POST /api/campaigns):", JSON.stringify(dataToSave, null, 2));

    const campaignsCol = collection(db, 'campaigns');
    const docRef = await addDoc(campaignsCol, dataToSave);
    
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
    } catch (inMemoryError) {
      console.error("Error adding campaign to in-memory store after Firebase success (POST /api/campaigns):", inMemoryError);
    }
    
    return NextResponse.json(createdCampaignResponse, { status: 201 });

  } catch (error: any) {
    console.error("--- Error Creating Campaign in POST /api/campaigns ---");
    console.error("Timestamp:", new Date().toISOString());
    
    let errorMessage = 'An unexpected error occurred while creating the campaign.';
    let errorDetails = {};

    if (error.name === 'FirebaseError' || (error.code && typeof error.code === 'string' && error.code.startsWith('firebase'))) {
        errorMessage = `Firebase error: ${error.message} (Code: ${error.code || 'N/A'})`;
        errorDetails = { code: error.code, firebaseMessage: error.message };
    } else if (error instanceof z.ZodError) {
        errorMessage = 'Invalid data format for campaign creation.';
        errorDetails = error.flatten().fieldErrors;
    } else if (error instanceof SyntaxError && error.message.includes("JSON")) {
        errorMessage = 'Invalid JSON payload provided.';
        errorDetails = { syntaxErrorMessage: error.message };
    } else if (error instanceof Error) {
        errorMessage = error.message;
        errorDetails = { genericErrorMessage: error.message, stack: error.stack?.substring(0, 300) };
    } else if (typeof error === 'string') {
        errorMessage = error;
        errorDetails = { rawErrorString: error };
    }
    
    console.error("Error Message:", errorMessage);
    console.error("Error Details:", JSON.stringify(errorDetails, null, 2));
    // Log the full error object if it's complex and not already covered
    if (typeof error === 'object' && error !== null && !(error instanceof Error)) {
        try {
            console.error("Full raw error object:", JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
        } catch (e) {
            console.error("Full raw error object (unserializable):", error);
        }
    }
    console.error("--- End of Error Creating Campaign ---");

    return NextResponse.json({ message: 'Failed to create campaign', error: errorMessage, details: errorDetails }, { status: 500 });
  }
}

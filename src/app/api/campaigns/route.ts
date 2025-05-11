
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
    console.error("Error fetching campaigns from Firebase:", error);
    firebaseError = true; 
  }

  const inMemoryCampaigns = getInMemoryDummyCampaigns(); // Already sorted by createdAt desc by default

  const combinedCampaignsMap = new Map<string, Campaign>();

  // Add in-memory campaigns first.
  inMemoryCampaigns.forEach(campaign => {
    combinedCampaignsMap.set(campaign.id, campaign);
  });

  // Add Firebase campaigns, overwriting if IDs match.
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
    const body = await request.json();
    
    const validationResult = campaignCreationSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json({ 
        message: 'Invalid campaign data', 
        errors: validationResult.error.flatten().fieldErrors 
      }, { status: 400 });
    }

    const { name, segmentName, rules, ruleLogic, message, status, audienceSize } = validationResult.data;

    // Explicitly construct the object for Firebase
    const dataToSave: Omit<CampaignCreationPayload, 'audienceSize' | 'status'> & { 
        audienceSize: number; 
        status: Campaign['status']; 
        createdAt: Timestamp; 
        sentCount: number; 
        failedCount: number; 
        segmentName?: string; // Ensure segmentName is explicitly handled
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
        const successRate = Math.random() * 0.20 + 0.75; // 75-95% success
        dataToSave.sentCount = Math.floor(dataToSave.audienceSize * successRate);
        dataToSave.failedCount = dataToSave.audienceSize - dataToSave.sentCount;
    } else if (dataToSave.status === 'Sent' && dataToSave.audienceSize === 0) {
        dataToSave.sentCount = 0;
        dataToSave.failedCount = 0;
    }

    console.log("Data being sent to Firestore:", JSON.stringify(dataToSave, null, 2));

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
      console.error("Error adding campaign to in-memory store after Firebase success:", inMemoryError);
      // Continue to return success to client as Firebase operation succeeded.
    }
    
    return NextResponse.json(createdCampaignResponse, { status: 201 });

  } catch (error: any) {
    console.error("Error creating campaign in POST /api/campaigns:", error);
    let errorMessage = 'An unexpected error occurred while creating the campaign.';
    
    if (error.name === 'FirebaseError') { // Firestore specific error
        errorMessage = `Firebase error: ${error.message} (Code: ${error.code})`;
    } else if (error instanceof Error) {
        errorMessage = error.message;
    } else if (typeof error === 'string') {
        errorMessage = error;
    }
    
    // Log the raw error object for more details if it's complex
    if (typeof error === 'object' && error !== null) {
        console.error("Full error object:", JSON.stringify(error, Object.getOwnPropertyNames(error)));
    }

    return NextResponse.json({ message: 'Failed to create campaign', error: errorMessage }, { status: 500 });
  }
}


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
  rules: z.array(segmentRuleSchema),
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
          ...data,
          createdAt: (data.createdAt as Timestamp)?.toDate().toISOString() || new Date().toISOString(),
          updatedAt: (data.updatedAt as Timestamp)?.toDate().toISOString(),
        } as Campaign;
      });
    }
  } catch (error) {
    console.error("Error fetching campaigns from Firebase:", error);
    firebaseError = true; 
  }

  // Get the current state of in-memory campaigns (initial dummies + any added to in-memory store)
  const inMemoryCampaigns = getInMemoryDummyCampaigns();

  const combinedCampaignsMap = new Map<string, Campaign>();

  // Add in-memory campaigns first. These include the initial 7 dummy campaigns
  // and any campaigns added to the in-memory store during the session (e.g., if Firebase was down).
  inMemoryCampaigns.forEach(campaign => {
    combinedCampaignsMap.set(campaign.id, campaign);
  });

  // Add Firebase campaigns. If a campaign ID from Firebase matches one already in the map
  // (e.g., a dummy campaign that was later saved/updated to Firebase),
  // the Firebase version will overwrite the in-memory one, making Firebase the source of truth.
  firebaseCampaigns.forEach(campaign => {
    combinedCampaignsMap.set(campaign.id, campaign);
  });
  
  // Convert the map values back to an array and sort by creation date
  const finalCampaignList = Array.from(combinedCampaignsMap.values())
                                 .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  if (firebaseError && firebaseCampaigns.length === 0) {
     console.warn("Firebase error during GET /api/campaigns and no campaigns fetched from Firebase. Merged results will primarily use in-memory data.");
  } else if (firebaseCampaigns.length === 0 && !firebaseError) {
    console.warn("Firebase has no campaigns, but is responsive. Merged results will use in-memory data.");
  }
  
  return NextResponse.json(finalCampaignList);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    const validationResult = campaignCreationSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json({ message: 'Invalid campaign data', errors: validationResult.error.flatten().fieldErrors }, { status: 400 });
    }

    const newCampaignData: CampaignCreationPayload & { createdAt: Timestamp, updatedAt?: Timestamp, sentCount: number, failedCount: number } = {
      ...validationResult.data,
      createdAt: Timestamp.now(),
      sentCount: 0, 
      failedCount: 0, 
    };
    
    if (newCampaignData.status === 'Sent' && newCampaignData.audienceSize > 0) {
        const successRate = Math.random() * 0.20 + 0.75; // 75-95% success
        newCampaignData.sentCount = Math.floor(newCampaignData.audienceSize * successRate);
        newCampaignData.failedCount = newCampaignData.audienceSize - newCampaignData.sentCount;
    } else if (newCampaignData.status === 'Sent' && newCampaignData.audienceSize === 0) {
        newCampaignData.sentCount = 0;
        newCampaignData.failedCount = 0;
    }


    const campaignsCol = collection(db, 'campaigns');
    const docRef = await addDoc(campaignsCol, newCampaignData);
    
    const createdCampaignResponse: Campaign = {
        id: docRef.id,
        name: newCampaignData.name,
        segmentName: newCampaignData.segmentName,
        rules: newCampaignData.rules,
        ruleLogic: newCampaignData.ruleLogic,
        message: newCampaignData.message,
        status: newCampaignData.status,
        audienceSize: newCampaignData.audienceSize,
        sentCount: newCampaignData.sentCount,
        failedCount: newCampaignData.failedCount,
        createdAt: newCampaignData.createdAt.toDate().toISOString(),
    };

    // Add to in-memory store to keep it in sync for fallbacks or mixed-mode display
    addInMemoryDummyCampaign(createdCampaignResponse);
    
    return NextResponse.json(createdCampaignResponse, { status: 201 });

  } catch (error) {
    console.error("Error creating campaign:", error);
    let errorMessage = 'An unexpected error occurred while creating the campaign.';
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'string') {
      errorMessage = error;
    }
    return NextResponse.json({ message: 'Failed to create campaign', error: errorMessage }, { status: 500 });
  }
}

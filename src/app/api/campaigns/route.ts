
import { NextResponse } from 'next/server';
import { collection, addDoc, getDocs, Timestamp, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Campaign, CampaignCreationPayload } from '@/lib/types';
import { z } from 'zod';
import { getInMemoryDummyCampaigns, findInMemoryDummyCampaign, updateInMemoryDummyCampaign, deleteInMemoryDummyCampaign } from '@/lib/dummy-data-store';

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
  try {
    const campaignsCol = collection(db, 'campaigns');
    const q = query(campaignsCol, orderBy('createdAt', 'desc'));
    const campaignSnapshot = await getDocs(q);
    
    if (campaignSnapshot.empty) {
      // Return dummy data if Firebase has no campaigns
      console.warn("Firebase has no campaigns, returning in-memory dummy campaign data.");
      return NextResponse.json(getInMemoryDummyCampaigns());
    }

    const campaignList: Campaign[] = campaignSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: (data.createdAt as Timestamp)?.toDate().toISOString() || new Date().toISOString(),
        updatedAt: (data.updatedAt as Timestamp)?.toDate().toISOString(),
      } as Campaign; // Type assertion
    });
    return NextResponse.json(campaignList);
  } catch (error) {
    console.error("Error fetching campaigns from Firebase:", error);
    // If Firebase fails (e.g. network, config), return dummy data as a fallback
    console.warn("Firebase unavailable or error, returning in-memory dummy campaign data.");
    return NextResponse.json(getInMemoryDummyCampaigns());
  }
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
    
    if (newCampaignData.status === 'Sent') {
        const successRate = Math.random() * 0.4 + 0.6; 
        newCampaignData.sentCount = Math.floor(newCampaignData.audienceSize * successRate);
        newCampaignData.failedCount = newCampaignData.audienceSize - newCampaignData.sentCount;
    }

    const campaignsCol = collection(db, 'campaigns');
    const docRef = await addDoc(campaignsCol, newCampaignData);
    
    // Construct the full campaign object to return, including a string date
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
        // No updatedAt on creation initially
    };
    
    return NextResponse.json(createdCampaignResponse, { status: 201 });

  } catch (error) {
    console.error("Error creating campaign in Firebase:", error);
    return NextResponse.json({ message: 'Failed to create campaign', error: (error as Error).message }, { status: 500 });
  }
}

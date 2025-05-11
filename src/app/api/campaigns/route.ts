
import { NextResponse } from 'next/server';
import { collection, addDoc, getDocs, Timestamp, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
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
  rules: z.array(segmentRuleSchema),
  ruleLogic: z.enum(['AND', 'OR']),
  message: z.string().min(1, "Message is required"),
  status: z.enum(['Draft', 'Scheduled', 'Sent', 'Failed', 'Archived']),
  audienceSize: z.number().min(0),
});


export async function GET() {
  try {
    const campaignsCol = collection(db, 'campaigns');
    const q = query(campaignsCol, orderBy('createdAt', 'desc'));
    const campaignSnapshot = await getDocs(q);
    const campaignList: Campaign[] = campaignSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: (data.createdAt as Timestamp)?.toDate().toISOString() || new Date().toISOString(),
        updatedAt: (data.updatedAt as Timestamp)?.toDate().toISOString(),
      } as Campaign;
    });
    return NextResponse.json(campaignList);
  } catch (error) {
    console.error("Error fetching campaigns:", error);
    return NextResponse.json({ message: 'Failed to fetch campaigns', error: (error as Error).message }, { status: 500 });
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
      sentCount: 0, // Initialize sentCount
      failedCount: 0, // Initialize failedCount
    };

    const campaignsCol = collection(db, 'campaigns');
    const docRef = await addDoc(campaignsCol, newCampaignData);
    
    return NextResponse.json({ message: 'Campaign created successfully', id: docRef.id, ...newCampaignData }, { status: 201 });
  } catch (error) {
    console.error("Error creating campaign:", error);
    return NextResponse.json({ message: 'Failed to create campaign', error: (error as Error).message }, { status: 500 });
  }
}

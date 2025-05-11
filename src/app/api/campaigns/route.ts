
import { NextResponse } from 'next/server';
import { collection, addDoc, getDocs, Timestamp, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Campaign, CampaignCreationPayload } from '@/lib/types';
import { z } from 'zod';
import { subDays } from 'date-fns';

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

const dummyCampaigns: Campaign[] = [
  {
    id: "dummy-campaign-1",
    name: "Welcome New Users",
    segmentName: "Recent Signups (Last 7 Days)",
    rules: [{ id: "rule1", field: "signedUpDays", operator: "lte", value: "7" }],
    ruleLogic: "AND",
    message: "👋 Welcome to EngageSphere! Explore our features and get started on your first campaign.",
    createdAt: subDays(new Date(), 5).toISOString(),
    updatedAt: subDays(new Date(), 5).toISOString(),
    status: "Sent",
    audienceSize: 150,
    sentCount: 145,
    failedCount: 5,
  },
  {
    id: "dummy-campaign-2",
    name: "Summer Sale Teaser",
    segmentName: "High Value Customers",
    rules: [{ id: "rule1", field: "totalSpend", operator: "gte", value: "5000" }],
    ruleLogic: "AND",
    message: "☀️ Get ready! Our Summer Sale is just around the corner with exclusive deals for you.",
    createdAt: subDays(new Date(), 2).toISOString(),
    updatedAt: subDays(new Date(), 1).toISOString(),
    status: "Scheduled",
    audienceSize: 75,
    sentCount: 0,
    failedCount: 0,
  },
  {
    id: "dummy-campaign-3",
    name: "Re-engage Inactive Users",
    segmentName: "Inactive Users (90 days)",
    rules: [{ id: "rule1", field: "lastPurchaseDays", operator: "gte", value: "90" }],
    ruleLogic: "AND",
    message: "We miss you! Come back and enjoy a 15% discount on your next purchase. Use code COMEBACK15.",
    createdAt: subDays(new Date(), 10).toISOString(),
    status: "Sent",
    audienceSize: 200,
    sentCount: 180,
    failedCount: 20,
  },
  {
    id: "dummy-campaign-4",
    name: "Feedback Request Q2",
    segmentName: "Active Users - Q2",
    rules: [
      { id: "rule1", field: "purchaseFrequency", operator: "gte", value: "2" },
      {id: "rule2", field: "lastPurchaseDays", operator: "lte", value: "60"}
    ],
    ruleLogic: "AND",
    message: "Your feedback matters! Help us improve by taking this quick survey.",
    createdAt: subDays(new Date(), 20).toISOString(),
    status: "Archived",
    audienceSize: 500,
    sentCount: 480,
    failedCount: 20,
  }
];


export async function GET() {
  try {
    const campaignsCol = collection(db, 'campaigns');
    const q = query(campaignsCol, orderBy('createdAt', 'desc'));
    const campaignSnapshot = await getDocs(q);
    
    if (campaignSnapshot.empty) {
      // Return dummy data if Firebase has no campaigns
      return NextResponse.json(dummyCampaigns.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime() ));
    }

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
    // If Firebase fails, return dummy data as a fallback for demo purposes
    if (error instanceof Error && error.message.includes('firestore/unavailable') || error.message.includes('auth/invalid-api-key')) {
        console.warn("Firebase unavailable, returning dummy campaign data.");
        return NextResponse.json(dummyCampaigns.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime() ));
    }
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
      // Simulate sending mechanism for dummy data for now:
      // In a real app, these would be updated by a sending service/job.
      // For newly created 'Scheduled' campaigns:
      sentCount: 0,
      failedCount: 0,
    };
    
    // If status is 'Sent', we can simulate some sent/failed counts based on audienceSize for demo
    if (newCampaignData.status === 'Sent') {
        const successRate = Math.random() * 0.4 + 0.6; // 60-100% success
        newCampaignData.sentCount = Math.floor(newCampaignData.audienceSize * successRate);
        newCampaignData.failedCount = newCampaignData.audienceSize - newCampaignData.sentCount;
    }


    const campaignsCol = collection(db, 'campaigns');
    const docRef = await addDoc(campaignsCol, newCampaignData);
    
    return NextResponse.json({ 
        message: 'Campaign created successfully', 
        id: docRef.id, 
        ...newCampaignData,
        createdAt: newCampaignData.createdAt.toDate().toISOString() 
    }, { status: 201 });
  } catch (error) {
    console.error("Error creating campaign:", error);
    return NextResponse.json({ message: 'Failed to create campaign', error: (error as Error).message }, { status: 500 });
  }
}


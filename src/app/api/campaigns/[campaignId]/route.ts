
import { NextResponse } from 'next/server';
import { doc, getDoc, updateDoc, deleteDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Campaign, CampaignUpdatePayload, SegmentRule } from '@/lib/types'; // Added SegmentRule for explicit mapping
import { z } from 'zod';
import { subDays } from 'date-fns';

// Zod schema for validation (partial for updates)
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
  status: z.enum(['Draft', 'Scheduled', 'Sent', 'Failed', 'Archived']).optional(),
  audienceSize: z.number().min(0).optional(),
  sentCount: z.number().min(0).optional(),
  failedCount: z.number().min(0).optional(),
});

// Dummy campaigns definition (copied from /api/campaigns/route.ts for standalone fallback)
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


export async function GET(
  request: Request,
  { params }: { params: { campaignId: string } }
) {
  const campaignId = params.campaignId;
  if (!campaignId) {
    return NextResponse.json({ message: 'Campaign ID is required' }, { status: 400 });
  }

  try {
    const campaignDocRef = doc(db, 'campaigns', campaignId);
    const campaignDoc = await getDoc(campaignDocRef);

    if (campaignDoc.exists()) {
      const data = campaignDoc.data();
      const campaign: Campaign = {
        id: campaignDoc.id,
        name: data.name,
        segmentName: data.segmentName,
        rules: data.rules as SegmentRule[],
        ruleLogic: data.ruleLogic,
        message: data.message,
        createdAt: (data.createdAt as Timestamp)?.toDate().toISOString() || new Date().toISOString(),
        updatedAt: data.updatedAt ? (data.updatedAt as Timestamp).toDate().toISOString() : undefined,
        status: data.status,
        audienceSize: data.audienceSize,
        sentCount: data.sentCount,
        failedCount: data.failedCount,
      };
      return NextResponse.json(campaign);
    } else {
      // Not found in Firebase, try dummy data
      const dummyCampaign = dummyCampaigns.find(c => c.id === campaignId);
      if (dummyCampaign) {
        return NextResponse.json(dummyCampaign);
      }
      return NextResponse.json({ message: 'Campaign not found' }, { status: 404 });
    }
  } catch (error) {
    console.error(`Error fetching campaign ${campaignId}:`, error);
    // If Firebase error, try dummy data as a fallback
    const dummyCampaign = dummyCampaigns.find(c => c.id === campaignId);
    if (dummyCampaign) {
      console.warn(`Firebase error for campaign ${campaignId}, returning dummy data.`);
      return NextResponse.json(dummyCampaign);
    }
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ message: 'Failed to fetch campaign', error: errorMessage }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { campaignId: string } }
) {
  try {
    const campaignId = params.campaignId;
    if (!campaignId) {
      return NextResponse.json({ message: 'Campaign ID is required' }, { status: 400 });
    }

    const body = await request.json();
    const validationResult = campaignUpdateSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json({ message: 'Invalid campaign data', errors: validationResult.error.flatten().fieldErrors }, { status: 400 });
    }
    
    const campaignDocRef = doc(db, 'campaigns', campaignId);
    const campaignDoc = await getDoc(campaignDocRef);

    if (!campaignDoc.exists()) {
       // Check if it's a dummy campaign ID - updates to dummy data are not persisted this way
      if (dummyCampaigns.some(c => c.id === campaignId)) {
        return NextResponse.json({ message: 'Cannot update a dummy campaign through API like this.', id: campaignId }, {status: 400});
      }
      return NextResponse.json({ message: 'Campaign not found' }, { status: 404 });
    }

    const updateData: CampaignUpdatePayload & { updatedAt: Timestamp } = {
      ...validationResult.data,
      updatedAt: Timestamp.now(),
    };

    await updateDoc(campaignDocRef, updateData);

    return NextResponse.json({ message: 'Campaign updated successfully', id: campaignId });
  } catch (error) {
    console.error(`Error updating campaign ${params.campaignId}:`, error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ message: 'Failed to update campaign', error: errorMessage }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { campaignId: string } }
) {
  try {
    const campaignId = params.campaignId;
    if (!campaignId) {
      return NextResponse.json({ message: 'Campaign ID is required' }, { status: 400 });
    }

    const campaignDocRef = doc(db, 'campaigns', campaignId);
    const campaignDoc = await getDoc(campaignDocRef);

    if (!campaignDoc.exists()) {
      // Check if it's a dummy campaign ID - deletions of dummy data are not persisted this way
      if (dummyCampaigns.some(c => c.id === campaignId)) {
        return NextResponse.json({ message: 'Cannot delete a dummy campaign through API like this.' }, {status: 400});
      }
      return NextResponse.json({ message: 'Campaign not found' }, { status: 404 });
    }

    await deleteDoc(campaignDocRef);

    return NextResponse.json({ message: 'Campaign deleted successfully' });
  } catch (error) {
    console.error(`Error deleting campaign ${params.campaignId}:`, error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ message: 'Failed to delete campaign', error: errorMessage }, { status: 500 });
  }
}

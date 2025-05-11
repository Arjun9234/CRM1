
import { NextResponse } from 'next/server';
import { doc, getDoc, updateDoc, deleteDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Campaign, CampaignUpdatePayload } from '@/lib/types';
import { z } from 'zod';

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


export async function GET(
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
      return NextResponse.json({ message: 'Campaign not found' }, { status: 404 });
    }

    const data = campaignDoc.data();
    const campaign: Campaign = {
      id: campaignDoc.id,
      ...data,
      createdAt: (data.createdAt as Timestamp)?.toDate().toISOString() || new Date().toISOString(),
      updatedAt: (data.updatedAt as Timestamp)?.toDate().toISOString(),
    } as Campaign;

    return NextResponse.json(campaign);
  } catch (error) {
    console.error(`Error fetching campaign ${params.campaignId}:`, error);
    return NextResponse.json({ message: 'Failed to fetch campaign', error: (error as Error).message }, { status: 500 });
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
    return NextResponse.json({ message: 'Failed to update campaign', error: (error as Error).message }, { status: 500 });
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
      return NextResponse.json({ message: 'Campaign not found' }, { status: 404 });
    }

    await deleteDoc(campaignDocRef);

    return NextResponse.json({ message: 'Campaign deleted successfully' });
  } catch (error) {
    console.error(`Error deleting campaign ${params.campaignId}:`, error);
    return NextResponse.json({ message: 'Failed to delete campaign', error: (error as Error).message }, { status: 500 });
  }
}

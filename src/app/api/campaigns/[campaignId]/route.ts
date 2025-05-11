
import { NextResponse } from 'next/server';
import { doc, getDoc, updateDoc, deleteDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Campaign, CampaignUpdatePayload, SegmentRule } from '@/lib/types';
import { z } from 'zod';
import { findInMemoryDummyCampaign, updateInMemoryDummyCampaign, deleteInMemoryDummyCampaign } from '@/lib/dummy-data-store';

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
  status: z.enum(['Draft', 'Scheduled', 'Sent', 'Failed', 'Archived', 'Cancelled']).optional(),
  audienceSize: z.number().min(0).optional(),
  sentCount: z.number().min(0).optional(),
  failedCount: z.number().min(0).optional(),
}).partial(); // All fields are optional for PUT

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
      const dummyCampaign = findInMemoryDummyCampaign(campaignId);
      if (dummyCampaign) {
        return NextResponse.json(dummyCampaign);
      }
      return NextResponse.json({ message: 'Campaign not found' }, { status: 404 });
    }
  } catch (error) {
    console.error(`Error fetching campaign ${campaignId} from Firebase:`, error);
    const dummyCampaign = findInMemoryDummyCampaign(campaignId);
    if (dummyCampaign) {
      console.warn(`Firebase error for campaign ${campaignId}, returning in-memory dummy data.`);
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
  const campaignId = params.campaignId;
  if (!campaignId) {
    return NextResponse.json({ message: 'Campaign ID is required' }, { status: 400 });
  }

  let parsedBody: any;
  try {
    parsedBody = await request.json();
  } catch (e) {
    return NextResponse.json({ message: 'Invalid JSON body' }, { status: 400 });
  }

  const validationResult = campaignUpdateSchema.safeParse(parsedBody);

  if (!validationResult.success) {
    return NextResponse.json({ message: 'Invalid campaign data', errors: validationResult.error.flatten().fieldErrors }, { status: 400 });
  }
  
  const validatedDataToUpdate: CampaignUpdatePayload = validationResult.data;

  try {
    const campaignDocRef = doc(db, 'campaigns', campaignId);
    const campaignDocSnapshot = await getDoc(campaignDocRef);

    if (campaignDocSnapshot.exists()) {
      const dataForFirebaseUpdate: Record<string, any> = { // Use a more general type for intermediate object
        ...validatedDataToUpdate,
        updatedAt: Timestamp.now(),
      };
      
      // If status changes to 'Sent' and sent/failed counts are not provided in payload, calculate them.
      // Use existing audienceSize from snapshot if not in payload for this calculation.
      if (validatedDataToUpdate.status === 'Sent' && 
          (validatedDataToUpdate.sentCount === undefined || validatedDataToUpdate.failedCount === undefined)) {
        const audienceSize = validatedDataToUpdate.audienceSize ?? campaignDocSnapshot.data()?.audienceSize ?? 0;
        if (audienceSize > 0) { // Only calculate if audience size is known and positive
            const successRate = Math.random() * 0.4 + 0.6; // 60-100% success
            dataForFirebaseUpdate.sentCount = Math.floor(audienceSize * successRate);
            dataForFirebaseUpdate.failedCount = audienceSize - dataForFirebaseUpdate.sentCount;
        } else {
            dataForFirebaseUpdate.sentCount = 0;
            dataForFirebaseUpdate.failedCount = 0;
        }
      }


      const cleanedDataForFirebase = Object.fromEntries(
        Object.entries(dataForFirebaseUpdate).filter(([_, v]) => v !== undefined)
      );

      await updateDoc(campaignDocRef, cleanedDataForFirebase);
      
      // Also update the in-memory store to keep it in sync
      // We pass validatedDataToUpdate because updateInMemoryDummyCampaign handles merging and calculations internally.
      // It will use its existing knowledge of the campaign for audienceSize if not in validatedDataToUpdate for sent/failed calcs.
      const updatedInMemory = updateInMemoryDummyCampaign(campaignId, validatedDataToUpdate);
      if (updatedInMemory) {
          console.log(`In-memory store updated for campaign ${campaignId} after Firebase success.`);
      } else {
          console.warn(`Failed to find/update in-memory store for campaign ${campaignId} after Firebase success, but Firebase was updated.`);
      }
      
      const updatedDocSnapshot = await getDoc(campaignDocRef); // Fetch the truly updated doc from Firebase for response
      const updatedDocData = updatedDocSnapshot.data();
      
      const responseData = { 
        id: updatedDocSnapshot.id,
        ...updatedDocData, 
        createdAt: (updatedDocData?.createdAt as Timestamp)?.toDate().toISOString(), 
        updatedAt: (updatedDocData?.updatedAt as Timestamp)?.toDate().toISOString()
      };
      return NextResponse.json(responseData);

    } else { // Campaign does not exist in Firebase, try updating dummy store
      const cleanedDataForDummyStore = Object.fromEntries(
        Object.entries(validatedDataToUpdate).filter(([_, v]) => v !== undefined)
      ) as CampaignUpdatePayload;
      
      const updatedDummyCampaign = updateInMemoryDummyCampaign(campaignId, cleanedDataForDummyStore);
      if (updatedDummyCampaign) {
        console.warn(`Campaign ${campaignId} not in Firebase, updated in-memory dummy data.`);
        return NextResponse.json(updatedDummyCampaign);
      }
      return NextResponse.json({ message: 'Campaign not found in Firebase or dummy store' }, { status: 404 });
    }
  } catch (error) { 
    console.error(`Error during PUT operation for campaign ${campaignId}:`, error);
    
    // Fallback: Try to update dummy store even on Firebase error, if it's not a 'not found' type error
    let isFirebaseSpecificError = true; 
    if (error instanceof Error && error.message.toLowerCase().includes("not found")) {
        isFirebaseSpecificError = false; 
    }

    if (isFirebaseSpecificError) {
        try {
            const cleanedDataForDummyStoreFallback = Object.fromEntries(
                Object.entries(validatedDataToUpdate).filter(([_, v]) => v !== undefined)
            ) as CampaignUpdatePayload;
            
            const updatedDummyCampaignFallback = updateInMemoryDummyCampaign(campaignId, cleanedDataForDummyStoreFallback);
            if (updatedDummyCampaignFallback) {
                console.warn(`Firebase error for campaign ${campaignId}. Updated in-memory dummy data as fallback.`);
                return NextResponse.json(updatedDummyCampaignFallback);
            }
        } catch (fallbackError) {
            console.error(`Error updating in-memory dummy campaign ${campaignId} during fallback:`, fallbackError);
        }
    }
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error during update';
    return NextResponse.json({ message: 'Failed to update campaign', error: errorMessage }, { status: 500 });
  }
}

export async function DELETE(
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
      await deleteDoc(campaignDocRef);
      deleteInMemoryDummyCampaign(campaignId); 
      return NextResponse.json({ message: 'Campaign deleted successfully from Firebase' });
    } else {
      if (deleteInMemoryDummyCampaign(campaignId)) {
        console.warn(`Campaign ${campaignId} not in Firebase, deleted from in-memory dummy data.`);
        return NextResponse.json({ message: 'Campaign deleted successfully from in-memory store' });
      }
      return NextResponse.json({ message: 'Campaign not found' }, { status: 404 });
    }
  } catch (error) {
    console.error(`Error deleting campaign ${campaignId} from Firebase:`, error);
    if (deleteInMemoryDummyCampaign(campaignId)) {
        console.warn(`Firebase error for campaign ${campaignId}, deleted from in-memory dummy data as fallback.`);
        return NextResponse.json({ message: 'Campaign deleted successfully from in-memory store after Firebase error' });
    }
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ message: 'Failed to delete campaign', error: errorMessage }, { status: 500 });
  }
}



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
  console.log(`GET /api/campaigns/${campaignId}: Request received at`, new Date().toISOString());

  if (!campaignId) {
    console.warn(`GET /api/campaigns/[campaignId]: Campaign ID is missing.`);
    return NextResponse.json({ message: 'Campaign ID is required' }, { status: 400 });
  }

  try {
    if (!db) {
      console.warn(`GET /api/campaigns/${campaignId}: Firestore DB not initialized. Attempting to use dummy data.`);
      const dummyCampaign = findInMemoryDummyCampaign(campaignId);
      if (dummyCampaign) {
        console.log(`GET /api/campaigns/${campaignId}: Found in-memory dummy campaign.`);
        return NextResponse.json(dummyCampaign);
      }
      console.error(`GET /api/campaigns/${campaignId}: Firestore DB not initialized and dummy campaign not found.`);
      return NextResponse.json({ message: 'Database not available and campaign not found in fallback store' }, { status: 503 });
    }
    
    console.log(`GET /api/campaigns/${campaignId}: Firestore DB instance available. Fetching document...`);
    const campaignDocRef = doc(db, 'campaigns', campaignId);
    const campaignDoc = await getDoc(campaignDocRef);
    console.log(`GET /api/campaigns/${campaignId}: Firestore getDoc call completed. Exists: ${campaignDoc.exists()}`);

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
      console.log(`GET /api/campaigns/${campaignId}: Campaign found in Firebase. Returning.`);
      return NextResponse.json(campaign);
    } else {
      console.log(`GET /api/campaigns/${campaignId}: Campaign not found in Firebase. Checking dummy store.`);
      const dummyCampaign = findInMemoryDummyCampaign(campaignId);
      if (dummyCampaign) {
        console.log(`GET /api/campaigns/${campaignId}: Found in-memory dummy campaign.`);
        return NextResponse.json(dummyCampaign);
      }
      console.warn(`GET /api/campaigns/${campaignId}: Campaign not found in Firebase or dummy store.`);
      return NextResponse.json({ message: 'Campaign not found' }, { status: 404 });
    }
  } catch (error: any) {
    console.error(`--- ERROR IN GET /api/campaigns/${campaignId} ---`);
    console.error("Timestamp:", new Date().toISOString());
    console.error("Error Message:", error.message);
    console.error("Error Stack Preview:", error.stack?.substring(0, 300));
    console.error("--- End of GET Error ---");

    console.warn(`GET /api/campaigns/${campaignId}: Error during Firebase fetch. Attempting fallback to dummy data.`);
    const dummyCampaign = findInMemoryDummyCampaign(campaignId);
    if (dummyCampaign) {
      console.log(`GET /api/campaigns/${campaignId}: Found in-memory dummy campaign after Firebase error.`);
      return NextResponse.json(dummyCampaign);
    }
    
    const errorMessage = error.message || 'Unknown error';
    return NextResponse.json({ message: 'Failed to fetch campaign', error: errorMessage }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { campaignId: string } }
) {
  const campaignId = params.campaignId;
  console.log(`PUT /api/campaigns/${campaignId}: Request received at`, new Date().toISOString());

  if (!campaignId) {
    console.warn(`PUT /api/campaigns/[campaignId]: Campaign ID is missing.`);
    return NextResponse.json({ message: 'Campaign ID is required' }, { status: 400 });
  }

  let parsedBody: any;
  try {
    const rawBody = await request.text();
    console.log(`PUT /api/campaigns/${campaignId}: Raw request body:`, rawBody.substring(0, 500) + (rawBody.length > 500 ? "..." : ""));
    parsedBody = JSON.parse(rawBody);
    console.log(`PUT /api/campaigns/${campaignId}: Parsed request body:`, JSON.stringify(parsedBody).substring(0, 500) + "...");
  } catch (e: any) {
    console.error(`PUT /api/campaigns/${campaignId}: Invalid JSON body. Error: ${e.message}`);
    return NextResponse.json({ message: 'Invalid JSON body', error: e.message }, { status: 400 });
  }

  const validationResult = campaignUpdateSchema.safeParse(parsedBody);

  if (!validationResult.success) {
    console.warn(`PUT /api/campaigns/${campaignId}: Validation failed. Errors:`, validationResult.error.flatten().fieldErrors);
    return NextResponse.json({ message: 'Invalid campaign data', errors: validationResult.error.flatten().fieldErrors }, { status: 400 });
  }
  console.log(`PUT /api/campaigns/${campaignId}: Payload validated successfully.`);
  
  const validatedDataToUpdate: CampaignUpdatePayload = validationResult.data;

  try {
    if (!db) {
        console.warn(`PUT /api/campaigns/${campaignId}: Firestore DB not initialized. Attempting to update dummy data only.`);
        const updatedDummyCampaign = updateInMemoryDummyCampaign(campaignId, validatedDataToUpdate);
        if (updatedDummyCampaign) {
            console.log(`PUT /api/campaigns/${campaignId}: Updated in-memory dummy campaign as DB not available.`);
            return NextResponse.json(updatedDummyCampaign);
        }
        console.error(`PUT /api/campaigns/${campaignId}: Firestore DB not initialized and dummy campaign not found for update.`);
        return NextResponse.json({ message: 'Database not available and campaign not found in fallback store for update' }, { status: 503 });
    }
    
    console.log(`PUT /api/campaigns/${campaignId}: Firestore DB instance available. Checking document existence...`);
    const campaignDocRef = doc(db, 'campaigns', campaignId);
    const campaignDocSnapshot = await getDoc(campaignDocRef);
    console.log(`PUT /api/campaigns/${campaignId}: Firestore getDoc call completed. Exists: ${campaignDocSnapshot.exists()}`);

    if (campaignDocSnapshot.exists()) {
      const dataForFirebaseUpdate: Record<string, any> = { 
        ...validatedDataToUpdate,
        updatedAt: Timestamp.now(),
      };
      
      if (validatedDataToUpdate.status === 'Sent' && 
          (validatedDataToUpdate.sentCount === undefined || validatedDataToUpdate.failedCount === undefined)) {
        const audienceSize = validatedDataToUpdate.audienceSize ?? campaignDocSnapshot.data()?.audienceSize ?? 0;
        if (audienceSize > 0) { 
            const successRate = Math.random() * 0.4 + 0.6; 
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

      console.log(`PUT /api/campaigns/${campaignId}: Attempting to update document in Firebase with data:`, JSON.stringify(cleanedDataForFirebase).substring(0, 300) + "...");
      await updateDoc(campaignDocRef, cleanedDataForFirebase);
      console.log(`PUT /api/campaigns/${campaignId}: Document updated in Firebase.`);
      
      updateInMemoryDummyCampaign(campaignId, validatedDataToUpdate);
      console.log(`PUT /api/campaigns/${campaignId}: In-memory store updated for campaign ${campaignId}.`);
      
      const updatedDocSnapshot = await getDoc(campaignDocRef); 
      const updatedDocData = updatedDocSnapshot.data();
      
      const responseData = { 
        id: updatedDocSnapshot.id,
        ...updatedDocData, 
        createdAt: (updatedDocData?.createdAt as Timestamp)?.toDate().toISOString(), 
        updatedAt: (updatedDocData?.updatedAt as Timestamp)?.toDate().toISOString()
      };
      console.log(`PUT /api/campaigns/${campaignId}: Successfully updated campaign. Returning response.`);
      return NextResponse.json(responseData);

    } else { 
      console.log(`PUT /api/campaigns/${campaignId}: Campaign not in Firebase, trying to update dummy store.`);
      const cleanedDataForDummyStore = Object.fromEntries(
        Object.entries(validatedDataToUpdate).filter(([_, v]) => v !== undefined)
      ) as CampaignUpdatePayload;
      
      const updatedDummyCampaign = updateInMemoryDummyCampaign(campaignId, cleanedDataForDummyStore);
      if (updatedDummyCampaign) {
        console.warn(`PUT /api/campaigns/${campaignId}: Campaign ${campaignId} not in Firebase, updated in-memory dummy data.`);
        return NextResponse.json(updatedDummyCampaign);
      }
      console.warn(`PUT /api/campaigns/${campaignId}: Campaign not found in Firebase or dummy store for update.`);
      return NextResponse.json({ message: 'Campaign not found in Firebase or dummy store' }, { status: 404 });
    }
  } catch (error: any) { 
    console.error(`--- ERROR IN PUT /api/campaigns/${campaignId} ---`);
    console.error("Timestamp:", new Date().toISOString());
    console.error("Error Message:", error.message);
    console.error("Error Stack Preview:", error.stack?.substring(0, 300));
    
    let isFirebaseSpecificError = true; 
    if (error.message.toLowerCase().includes("not found")) {
        isFirebaseSpecificError = false; 
    }

    if (isFirebaseSpecificError) {
        try {
            const cleanedDataForDummyStoreFallback = Object.fromEntries(
                Object.entries(validatedDataToUpdate).filter(([_, v]) => v !== undefined)
            ) as CampaignUpdatePayload;
            
            const updatedDummyCampaignFallback = updateInMemoryDummyCampaign(campaignId, cleanedDataForDummyStoreFallback);
            if (updatedDummyCampaignFallback) {
                console.warn(`PUT /api/campaigns/${campaignId}: Firebase error occurred. Updated in-memory dummy data as fallback.`);
                return NextResponse.json(updatedDummyCampaignFallback);
            }
        } catch (fallbackError: any) {
            console.error(`PUT /api/campaigns/${campaignId}: Error updating in-memory dummy campaign during fallback: ${fallbackError.message}`);
        }
    }
    
    const errorMessage = error.message || 'Unknown error during update';
    console.error(`--- End of PUT Error for ${campaignId} ---`);
    return NextResponse.json({ message: 'Failed to update campaign', error: errorMessage }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { campaignId: string } }
) {
  const campaignId = params.campaignId;
  console.log(`DELETE /api/campaigns/${campaignId}: Request received at`, new Date().toISOString());

  if (!campaignId) {
    console.warn(`DELETE /api/campaigns/[campaignId]: Campaign ID is missing.`);
    return NextResponse.json({ message: 'Campaign ID is required' }, { status: 400 });
  }

  try {
    if (!db) {
      console.warn(`DELETE /api/campaigns/${campaignId}: Firestore DB not initialized. Attempting to delete from dummy data only.`);
      if (deleteInMemoryDummyCampaign(campaignId)) {
        console.log(`DELETE /api/campaigns/${campaignId}: Deleted from in-memory store as DB not available.`);
        return NextResponse.json({ message: 'Campaign deleted successfully from in-memory store (DB unavailable)' });
      }
      console.error(`DELETE /api/campaigns/${campaignId}: Firestore DB not initialized and dummy campaign not found for deletion.`);
      return NextResponse.json({ message: 'Database not available and campaign not found in fallback store for deletion' }, { status: 503 });
    }

    console.log(`DELETE /api/campaigns/${campaignId}: Firestore DB instance available. Checking document existence...`);
    const campaignDocRef = doc(db, 'campaigns', campaignId);
    const campaignDoc = await getDoc(campaignDocRef);
    console.log(`DELETE /api/campaigns/${campaignId}: Firestore getDoc call completed. Exists: ${campaignDoc.exists()}`);

    if (campaignDoc.exists()) {
      console.log(`DELETE /api/campaigns/${campaignId}: Attempting to delete document from Firebase...`);
      await deleteDoc(campaignDocRef);
      console.log(`DELETE /api/campaigns/${campaignId}: Document deleted from Firebase.`);
      deleteInMemoryDummyCampaign(campaignId); 
      console.log(`DELETE /api/campaigns/${campaignId}: Also deleted from in-memory store.`);
      return NextResponse.json({ message: 'Campaign deleted successfully from Firebase' });
    } else {
      console.log(`DELETE /api/campaigns/${campaignId}: Campaign not found in Firebase. Checking dummy store.`);
      if (deleteInMemoryDummyCampaign(campaignId)) {
        console.warn(`DELETE /api/campaigns/${campaignId}: Campaign ${campaignId} not in Firebase, deleted from in-memory dummy data.`);
        return NextResponse.json({ message: 'Campaign deleted successfully from in-memory store' });
      }
      console.warn(`DELETE /api/campaigns/${campaignId}: Campaign not found in Firebase or dummy store for deletion.`);
      return NextResponse.json({ message: 'Campaign not found' }, { status: 404 });
    }
  } catch (error: any) {
    console.error(`--- ERROR IN DELETE /api/campaigns/${campaignId} ---`);
    console.error("Timestamp:", new Date().toISOString());
    console.error("Error Message:", error.message);
    console.error("Error Stack Preview:", error.stack?.substring(0, 300));
    
    console.warn(`DELETE /api/campaigns/${campaignId}: Error during Firebase delete. Attempting fallback to delete from dummy data.`);
    if (deleteInMemoryDummyCampaign(campaignId)) {
        console.warn(`DELETE /api/campaigns/${campaignId}: Deleted from in-memory dummy data as fallback after Firebase error.`);
        return NextResponse.json({ message: 'Campaign deleted successfully from in-memory store after Firebase error' });
    }
    
    const errorMessage = error.message || 'Unknown error';
    console.error(`--- End of DELETE Error for ${campaignId} ---`);
    return NextResponse.json({ message: 'Failed to delete campaign', error: errorMessage }, { status: 500 });
  }
}


// src/lib/dummy-data-store.ts
import type { Campaign, CampaignUpdatePayload } from '@/lib/types';
import { subDays, addDays } from 'date-fns';

// Initial state with 7 campaigns. All set to 'Sent' with simulated sent/failed counts.
const initialDummyCampaigns: Campaign[] = [
  {
    id: "dummy-campaign-1",
    name: "Welcome New Users",
    segmentName: "Recent Signups (Last 7 Days)",
    rules: [{ id: "rule1", field: "signedUpDays", operator: "lte", value: "7" }],
    ruleLogic: "AND",
    message: "👋 Welcome to EngageSphere! Explore our features and get started on your first campaign.",
    createdAt: subDays(new Date(), 10).toISOString(),
    updatedAt: subDays(new Date(), 9).toISOString(),
    status: "Sent",
    audienceSize: 150,
    sentCount: 142, 
    failedCount: 8,
  },
  {
    id: "dummy-campaign-2",
    name: "Summer Sale Teaser",
    segmentName: "High Value Customers",
    rules: [{ id: "rule1", field: "TotalSpend", operator: "gte", value: "5000" }],
    ruleLogic: "AND",
    message: "☀️ Get ready! Our Summer Sale is just around the corner with exclusive deals for you.",
    createdAt: subDays(new Date(), 8).toISOString(),
    updatedAt: subDays(new Date(), 7).toISOString(),
    status: "Sent",
    audienceSize: 75,
    sentCount: 70, 
    failedCount: 5,
  },
  {
    id: "dummy-campaign-3",
    name: "Re-engage Inactives",
    segmentName: "Inactive Users (90 days)",
    rules: [{ id: "rule1", field: "lastPurchaseDays", operator: "gte", value: "90" }],
    ruleLogic: "AND",
    message: "We miss you! Come back and enjoy a 15% discount on your next purchase. Use code COMEBACK15.",
    createdAt: subDays(new Date(), 12).toISOString(),
    updatedAt: subDays(new Date(), 11).toISOString(),
    status: "Sent",
    audienceSize: 200,
    sentCount: 188, 
    failedCount: 12,
  },
  {
    id: "dummy-campaign-4",
    name: "Feedback Q2",
    segmentName: "Active Users - Q2",
    rules: [
      { id: "rule1", field: "purchaseFrequency", operator: "gte", value: "2" },
      {id: "rule2", field: "lastPurchaseDays", operator: "lte", value: "60"}
    ],
    ruleLogic: "AND",
    message: "Your feedback matters! Help us improve by taking this quick survey.",
    createdAt: subDays(new Date(), 20).toISOString(),
    updatedAt: subDays(new Date(), 19).toISOString(),
    status: "Sent",
    audienceSize: 500,
    sentCount: 475, 
    failedCount: 25,
  },
  {
    id: "dummy-campaign-5",
    name: "Holiday Early Bird",
    segmentName: "Newsletter Subscribers",
    rules: [{ id: "rule1", field: "tags", operator: "eq", value: "newsletter_subscriber" }], // Example tag-based rule
    ruleLogic: "AND",
    message: "🔔 Early bird access to Holiday Specials! Don't miss out on exclusive offers.",
    createdAt: subDays(new Date(), 30).toISOString(),
    updatedAt: subDays(new Date(), 29).toISOString(),
    status: "Sent",
    audienceSize: 300,
    sentCount: 285, 
    failedCount: 15,
  },
  {
    id: "dummy-campaign-6",
    name: "New Product Launch",
    segmentName: "Tech Enthusiasts",
    rules: [{ id: "rule1", field: "productViewed", operator: "contains", value: "gadget" }, {id: "rule2", field: "TotalSpend", operator: "gte", value: "1000"}],
    ruleLogic: "AND",
    message: "🚀 Discover our latest tech innovation! Pre-order now and get an exclusive discount.",
    createdAt: subDays(new Date(), 2).toISOString(), 
    updatedAt: subDays(new Date(), 1).toISOString(),
    status: "Sent", 
    audienceSize: 250,
    sentCount: 230, 
    failedCount: 20,
  },
  {
    id: "dummy-campaign-7",
    name: "Indo Pak Peace Initiative",
    segmentName: "Global Citizens for Peace",
    rules: [
      { id: "rule1", field: "country", operator: "eq", value: "India" },
      { id: "rule2", field: "country", operator: "eq", value: "Pakistan" },
      { id: "rule3", field: "tags", operator: "contains", value: "peace_activist" }
    ],
    ruleLogic: "OR",
    message: "Join hands for a peaceful future. Let's build bridges, not walls, between India and Pakistan. #PeaceNow",
    createdAt: subDays(new Date(), 1).toISOString(),
    updatedAt: subDays(new Date(), 1).toISOString(),
    status: "Sent",
    audienceSize: 5000,
    sentCount: 4500,
    failedCount: 500,
  }
];

// Utility to process campaigns (e.g., calculate sent/failed counts)
const processCampaignsArray = (campaigns: Campaign[]): Campaign[] => {
  return campaigns.map(c => {
    const campaignCopy = { ...c }; // Work on a copy
    if (!campaignCopy.updatedAt) {
      campaignCopy.updatedAt = campaignCopy.createdAt;
    }
    if (campaignCopy.status === "Sent") {
      const audience = campaignCopy.audienceSize || 0;
      const currentSent = campaignCopy.sentCount === undefined ? -1 : campaignCopy.sentCount; // Use -1 to distinguish from 0
      const currentFailed = campaignCopy.failedCount === undefined ? -1 : campaignCopy.failedCount;

      // Recalculate if counts are missing or don't add up to audience size
      if (audience > 0 && (currentSent === -1 || currentFailed === -1 || (currentSent + currentFailed !== audience))) {
        const successRate = Math.random() * 0.20 + 0.75; // 75-95% success
        campaignCopy.sentCount = Math.floor(audience * successRate);
        campaignCopy.failedCount = audience - campaignCopy.sentCount;
      } else if (audience === 0) {
        campaignCopy.sentCount = 0;
        campaignCopy.failedCount = 0;
      }
    }
    return campaignCopy;
  });
};

let campaignsDB: Campaign[];

const GLOBAL_CAMPAIGNS_KEY = '__ENGAGESPHERE_DUMMY_CAMPAIGNS_STORE_V4__'; // Changed key to ensure reset if needed

if (process.env.NODE_ENV === 'production') {
  campaignsDB = processCampaignsArray(JSON.parse(JSON.stringify(initialDummyCampaigns)));
} else {
  if (!(global as any)[GLOBAL_CAMPAIGNS_KEY]) {
    (global as any)[GLOBAL_CAMPAIGNS_KEY] = processCampaignsArray(JSON.parse(JSON.stringify(initialDummyCampaigns)));
  }
  campaignsDB = (global as any)[GLOBAL_CAMPAIGNS_KEY];
}

export function getInMemoryDummyCampaigns(): Campaign[] {
  const campaignsCopy = JSON.parse(JSON.stringify(campaignsDB));
  return campaignsCopy.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function findInMemoryDummyCampaign(id: string): Campaign | undefined {
  const campaign = campaignsDB.find(c => c.id === id);
  return campaign ? JSON.parse(JSON.stringify(campaign)) : undefined;
}

export function addInMemoryDummyCampaign(campaign: Campaign): Campaign {
  const newCampaignToAdd: Campaign = JSON.parse(JSON.stringify(campaign));

  // Ensure createdAt and updatedAt are set if not already (they should be by the API)
  if (!newCampaignToAdd.createdAt) {
    newCampaignToAdd.createdAt = new Date().toISOString();
  }
  if (!newCampaignToAdd.updatedAt) {
    newCampaignToAdd.updatedAt = newCampaignToAdd.createdAt;
  }
  
  const audience = newCampaignToAdd.audienceSize || 0;
  if (newCampaignToAdd.status === 'Sent') {
      // Ensure sent/failed counts are calculated if not provided or if they don't match audience size
      if (audience > 0 && (newCampaignToAdd.sentCount === undefined || newCampaignToAdd.failedCount === undefined || (newCampaignToAdd.sentCount + newCampaignToAdd.failedCount !== audience))) {
          const successRate = Math.random() * 0.20 + 0.75; 
          newCampaignToAdd.sentCount = Math.floor(audience * successRate);
          newCampaignToAdd.failedCount = audience - newCampaignToAdd.sentCount;
      } else if (audience === 0) { // If audience is 0, counts must be 0
          newCampaignToAdd.sentCount = 0;
          newCampaignToAdd.failedCount = 0;
      }
  } else { // For non-Sent statuses, ensure counts are 0 if not explicitly set otherwise
      if (newCampaignToAdd.sentCount === undefined) newCampaignToAdd.sentCount = 0;
      if (newCampaignToAdd.failedCount === undefined) newCampaignToAdd.failedCount = 0;
  }


  const existingIndex = campaignsDB.findIndex(c => c.id === newCampaignToAdd.id);
  if (existingIndex > -1) {
    // If campaign with same ID exists (e.g., due to quick succession of updates or reprocessing), update it.
    campaignsDB[existingIndex] = newCampaignToAdd;
  } else {
    // Add new campaign to the end of the array.
    campaignsDB.push(newCampaignToAdd);
  }
  return JSON.parse(JSON.stringify(newCampaignToAdd));
}

export function updateInMemoryDummyCampaign(id: string, payload: CampaignUpdatePayload): Campaign | null {
  const index = campaignsDB.findIndex(c => c.id === id);
  if (index > -1) {
    const existingCampaign = campaignsDB[index];
    // Create a new object for the update, ensuring all fields from Campaign are present
    const updatedCampaignData: Campaign = {
        ...existingCampaign, // Spread existing first
        ...payload,         // Then payload changes
        updatedAt: new Date().toISOString(), // Always update timestamp
        // Ensure required fields that might be missing in Partial<CampaignCreationPayload> are present
        id: existingCampaign.id,
        createdAt: existingCampaign.createdAt,
        // Ensure status is part of payload or defaults to existing
        status: payload.status || existingCampaign.status, 
        // Ensure ruleLogic is part of payload or defaults to existing
        ruleLogic: payload.ruleLogic || existingCampaign.ruleLogic,
        // Ensure rules are part of payload or defaults to existing
        rules: payload.rules || existingCampaign.rules,
    };

    const audienceSize = updatedCampaignData.audienceSize; // Use the potentially updated audienceSize
    
    if (updatedCampaignData.status === 'Sent') {
        // Recalculate if counts are not explicitly in payload OR if audienceSize changed
        if ( (payload.sentCount === undefined || payload.failedCount === undefined || payload.audienceSize !== undefined) && audienceSize > 0) {
            const successRate = Math.random() * 0.20 + 0.75;
            updatedCampaignData.sentCount = Math.floor(audienceSize * successRate);
            updatedCampaignData.failedCount = audienceSize - updatedCampaignData.sentCount;
        } else if (audienceSize === 0) {
            updatedCampaignData.sentCount = 0;
            updatedCampaignData.failedCount = 0;
        }
        // If sentCount/failedCount are explicitly in payload, they take precedence (already spread from payload)
    } else if (payload.status && payload.status !== 'Sent') {
        // If status changes to non-Sent, and counts are not in payload, reset them
        if(payload.sentCount === undefined) updatedCampaignData.sentCount = 0;
        if(payload.failedCount === undefined) updatedCampaignData.failedCount = 0;
    }

    campaignsDB[index] = updatedCampaignData;
    return JSON.parse(JSON.stringify(campaignsDB[index]));
  }
  return null;
}

export function deleteInMemoryDummyCampaign(id: string): boolean {
  const index = campaignsDB.findIndex(c => c.id === id);
  if (index > -1) {
    campaignsDB.splice(index, 1); // Mutates the array in place
    return true;
  }
  return false;
}

export function resetInMemoryDummyCampaigns() {
  const processedInitialCampaigns = processCampaignsArray(JSON.parse(JSON.stringify(initialDummyCampaigns)));
  if (process.env.NODE_ENV === 'production') {
    campaignsDB = processedInitialCampaigns;
  } else {
    (global as any)[GLOBAL_CAMPAIGNS_KEY] = processedInitialCampaigns;
    campaignsDB = (global as any)[GLOBAL_CAMPAIGNS_KEY]; 
  }
}
// The campaignsDB is initialized above using the global key logic, so no explicit reset call here is needed on module load.
// This function can be used if an explicit reset is needed during runtime for testing.


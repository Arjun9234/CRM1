
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
    sentCount: 142, // Approx 95%
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
    sentCount: 70, // Approx 93%
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
    sentCount: 188, // Approx 94%
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
    sentCount: 475, // Approx 95%
    failedCount: 25,
  },
  {
    id: "dummy-campaign-5",
    name: "Holiday Early Bird",
    segmentName: "Newsletter Subscribers",
    rules: [{ id: "rule1", field: "tags", operator: "eq", value: "newsletter_subscriber" }],
    ruleLogic: "AND",
    message: "🔔 Early bird access to Holiday Specials! Don't miss out on exclusive offers.",
    createdAt: subDays(new Date(), 30).toISOString(),
    updatedAt: subDays(new Date(), 29).toISOString(),
    status: "Sent",
    audienceSize: 300,
    sentCount: 285, // Approx 95%
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
    sentCount: 230, // Approx 92%
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
    sentCount: 4500, // Approx 90%
    failedCount: 500,
  }
];

// Ensure all initial dummy campaigns have an updatedAt if not explicitly set
initialDummyCampaigns.forEach(c => {
    if (!c.updatedAt) {
        c.updatedAt = c.createdAt;
    }
    // Ensure sent/failed counts are consistent if status is Sent
    if (c.status === "Sent") {
        if (c.audienceSize > 0 && (c.sentCount + c.failedCount !== c.audienceSize)) {
            console.warn(`Recalculating sent/failed for dummy campaign ${c.id} due to inconsistency.`);
            const successRate = Math.random() * 0.15 + 0.80; // 80-95% success
            c.sentCount = Math.floor(c.audienceSize * successRate);
            c.failedCount = c.audienceSize - c.sentCount;
        } else if (c.audienceSize === 0) {
            c.sentCount = 0;
            c.failedCount = 0;
        }
    }
});


// This will be the mutable store. Resets on server restart.
let mutableDummyCampaigns: Campaign[] = JSON.parse(JSON.stringify(initialDummyCampaigns));

export function getInMemoryDummyCampaigns(): Campaign[] {
  // Return a deep copy of the sorted campaigns
  return JSON.parse(JSON.stringify(mutableDummyCampaigns.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())));
}

export function findInMemoryDummyCampaign(id: string): Campaign | undefined {
  const campaign = mutableDummyCampaigns.find(c => c.id === id);
  return campaign ? JSON.parse(JSON.stringify(campaign)) : undefined;
}

export function addInMemoryDummyCampaign(campaign: Campaign): Campaign {
  const newCampaignToAdd: Campaign = JSON.parse(JSON.stringify(campaign)); // Ensure it's a deep copy
  
  // Ensure createdAt and updatedAt are set if not provided
  if (!newCampaignToAdd.createdAt) {
    newCampaignToAdd.createdAt = new Date().toISOString();
  }
  if (!newCampaignToAdd.updatedAt) {
    newCampaignToAdd.updatedAt = newCampaignToAdd.createdAt;
  }

  // If campaign is added directly as 'Sent', calculate sent/failed counts if not provided
  if (newCampaignToAdd.status === 'Sent' && newCampaignToAdd.audienceSize > 0 && (newCampaignToAdd.sentCount === undefined || newCampaignToAdd.failedCount === undefined || newCampaignToAdd.sentCount + newCampaignToAdd.failedCount !== newCampaignToAdd.audienceSize)) {
      const successRate = Math.random() * 0.15 + 0.80; // 80-95% success
      newCampaignToAdd.sentCount = Math.floor(newCampaignToAdd.audienceSize * successRate);
      newCampaignToAdd.failedCount = newCampaignToAdd.audienceSize - newCampaignToAdd.sentCount;
  } else if (newCampaignToAdd.status === 'Sent' && newCampaignToAdd.audienceSize === 0) {
      newCampaignToAdd.sentCount = 0;
      newCampaignToAdd.failedCount = 0;
  }


  const existingIndex = mutableDummyCampaigns.findIndex(c => c.id === newCampaignToAdd.id);
  if (existingIndex > -1) {
    mutableDummyCampaigns[existingIndex] = newCampaignToAdd; // Update if exists
  } else {
    mutableDummyCampaigns.unshift(newCampaignToAdd); // Add to top if new
  }
  return JSON.parse(JSON.stringify(newCampaignToAdd));
}

export function updateInMemoryDummyCampaign(id: string, payload: CampaignUpdatePayload): Campaign | null {
  const index = mutableDummyCampaigns.findIndex(c => c.id === id);
  if (index > -1) {
    const existingCampaign = mutableDummyCampaigns[index];
    const updatedCampaignData = {
        ...existingCampaign,
        ...payload,
        updatedAt: new Date().toISOString()
    };

    // If status changes to 'Sent' or status is 'Sent' and audienceSize is updated
    if (payload.status === 'Sent' || (existingCampaign.status === 'Sent' && payload.audienceSize !== undefined && payload.audienceSize !== existingCampaign.audienceSize) ) {
        const audienceSize = payload.audienceSize !== undefined ? payload.audienceSize : existingCampaign.audienceSize;
        // Only recalculate sent/failed if counts weren't explicitly provided in payload OR if audienceSize changed
        if ( (payload.sentCount === undefined || payload.failedCount === undefined || payload.audienceSize !== undefined) && audienceSize > 0) {
            const successRate = Math.random() * 0.15 + 0.80; // 80-95% success
            updatedCampaignData.sentCount = Math.floor(audienceSize * successRate);
            updatedCampaignData.failedCount = audienceSize - updatedCampaignData.sentCount;
        } else if (audienceSize === 0) { // Handles case where audience becomes 0
            updatedCampaignData.sentCount = 0;
            updatedCampaignData.failedCount = 0;
        }
        // If sentCount/failedCount are explicitly in payload, they take precedence (already spread from payload)
    } else if (payload.status && payload.status !== 'Sent') {
        // If status changes to non-Sent, and counts are not in payload, reset them
        if(payload.sentCount === undefined) updatedCampaignData.sentCount = 0;
        if(payload.failedCount === undefined) updatedCampaignData.failedCount = 0;
    }

    mutableDummyCampaigns[index] = updatedCampaignData as Campaign;
    return JSON.parse(JSON.stringify(mutableDummyCampaigns[index]));
  }
  return null;
}

export function deleteInMemoryDummyCampaign(id: string): boolean {
  const initialLength = mutableDummyCampaigns.length;
  mutableDummyCampaigns = mutableDummyCampaigns.filter(c => c.id !== id);
  return mutableDummyCampaigns.length < initialLength;
}

export function resetInMemoryDummyCampaigns() {
  // Deep copy the initial state to ensure `mutableDummyCampaigns` is a fresh copy
  mutableDummyCampaigns = JSON.parse(JSON.stringify(initialDummyCampaigns));
  // Re-apply the sent/failed count logic after reset, if needed, or ensure initial state is correct
    mutableDummyCampaigns.forEach(c => {
        if (c.status === "Sent") {
            if (c.audienceSize > 0 && (c.sentCount + c.failedCount !== c.audienceSize)) {
                 console.warn(`Recalculating sent/failed for reset dummy campaign ${c.id}.`);
                const successRate = Math.random() * 0.15 + 0.80; // 80-95% success
                c.sentCount = Math.floor(c.audienceSize * successRate);
                c.failedCount = c.audienceSize - c.sentCount;
            } else if (c.audienceSize === 0) {
                c.sentCount = 0;
                c.failedCount = 0;
            }
        }
    });
}

// Initialize the store on load
resetInMemoryDummyCampaigns();

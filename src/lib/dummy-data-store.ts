
// src/lib/dummy-data-store.ts
import type { Campaign, CampaignUpdatePayload } from '@/lib/types';
import { subDays } from 'date-fns';

// Initial state from your API routes
const initialDummyCampaigns: Campaign[] = [
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
    rules: [{ id: "rule1", field: "TotalSpend", operator: "gte", value: "5000" }],
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
    updatedAt: subDays(new Date(), 7).toISOString(), // ensure updatedAt is present
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
    updatedAt: subDays(new Date(), 15).toISOString(), // ensure updatedAt is present
    status: "Archived",
    audienceSize: 500,
    sentCount: 480,
    failedCount: 20,
  }
];

// This will be the mutable store. Resets on server restart.
let mutableDummyCampaigns: Campaign[] = JSON.parse(JSON.stringify(initialDummyCampaigns));

export function getInMemoryDummyCampaigns(): Campaign[] {
  // Return a deep copy to prevent direct mutation of the store from outside
  return JSON.parse(JSON.stringify(mutableDummyCampaigns.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())));
}

export function findInMemoryDummyCampaign(id: string): Campaign | undefined {
  const campaign = mutableDummyCampaigns.find(c => c.id === id);
  return campaign ? JSON.parse(JSON.stringify(campaign)) : undefined;
}

export function updateInMemoryDummyCampaign(id: string, payload: CampaignUpdatePayload): Campaign | null {
  const index = mutableDummyCampaigns.findIndex(c => c.id === id);
  if (index > -1) {
    // Merge existing campaign with payload
    const updatedCampaign = { 
        ...mutableDummyCampaigns[index], 
        ...payload, 
        updatedAt: new Date().toISOString() 
    };
    // Ensure all fields from Campaign type are present, even if partial payload
    mutableDummyCampaigns[index] = updatedCampaign as Campaign;
    return JSON.parse(JSON.stringify(mutableDummyCampaigns[index]));
  }
  return null;
}

export function deleteInMemoryDummyCampaign(id: string): boolean {
  const initialLength = mutableDummyCampaigns.length;
  mutableDummyCampaigns = mutableDummyCampaigns.filter(c => c.id !== id);
  return mutableDummyCampaigns.length < initialLength;
}

// Function to reset to initial state (useful for testing or specific demo scenarios)
export function resetInMemoryDummyCampaigns() {
  mutableDummyCampaigns = JSON.parse(JSON.stringify(initialDummyCampaigns));
}

// Ensure all initial dummy campaigns have updatedAt
initialDummyCampaigns.forEach(c => {
    if (!c.updatedAt) {
        c.updatedAt = c.createdAt;
    }
});
resetInMemoryDummyCampaigns(); // Initialize mutable store with potentially updated initial data

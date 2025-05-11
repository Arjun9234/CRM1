
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
    updatedAt: subDays(new Date(), 4).toISOString(), // Make updatedAt slightly different for realism
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
    status: "Sent", // Changed from Scheduled
    audienceSize: 75,
    sentCount: 70,  // Approx 93%
    failedCount: 5,
  },
  {
    id: "dummy-campaign-3",
    name: "Re-engage Inactives", // Shorter name for graph
    segmentName: "Inactive Users (90 days)",
    rules: [{ id: "rule1", field: "lastPurchaseDays", operator: "gte", value: "90" }],
    ruleLogic: "AND",
    message: "We miss you! Come back and enjoy a 15% discount on your next purchase. Use code COMEBACK15.",
    createdAt: subDays(new Date(), 12).toISOString(),
    updatedAt: subDays(new Date(), 10).toISOString(), 
    status: "Sent",
    audienceSize: 200,
    sentCount: 188, // Approx 94%
    failedCount: 12,
  },
  {
    id: "dummy-campaign-4",
    name: "Feedback Q2", // Shorter name for graph
    segmentName: "Active Users - Q2",
    rules: [
      { id: "rule1", field: "purchaseFrequency", operator: "gte", value: "2" },
      {id: "rule2", field: "lastPurchaseDays", operator: "lte", value: "60"}
    ],
    ruleLogic: "AND",
    message: "Your feedback matters! Help us improve by taking this quick survey.",
    createdAt: subDays(new Date(), 20).toISOString(),
    updatedAt: subDays(new Date(), 18).toISOString(), 
    status: "Sent", // Changed from Archived
    audienceSize: 500,
    sentCount: 475, // Approx 95%
    failedCount: 25,
  },
  {
    id: "dummy-campaign-5",
    name: "Holiday Early Bird", // Shorter name
    segmentName: "Newsletter Subscribers",
    rules: [{ id: "rule1", field: "tag", operator: "eq", value: "newsletter_subscriber" }], // Assuming a 'tag' field
    ruleLogic: "AND",
    message: "🔔 Early bird access to Holiday Specials! Don't miss out on exclusive offers.",
    createdAt: subDays(new Date(), 30).toISOString(),
    updatedAt: subDays(new Date(), 28).toISOString(),
    status: "Sent", // Changed from Cancelled
    audienceSize: 300,
    sentCount: 280, // Approx 93%
    failedCount: 20,
  },
  {
    id: "dummy-campaign-6",
    name: "New Product Launch",
    segmentName: "Tech Enthusiasts",
    rules: [{ id: "rule1", field: "productViewed", operator: "contains", value: "gadget" }, {id: "rule2", field: "TotalSpend", operator: "gte", value: "1000"}],
    ruleLogic: "AND",
    message: "🚀 Discover our latest tech innovation! Pre-order now and get an exclusive discount.",
    createdAt: subDays(new Date(), 15).toISOString(),
    updatedAt: subDays(new Date(), 14).toISOString(),
    status: "Sent",
    audienceSize: 250,
    sentCount: 240, // Approx 96%
    failedCount: 10,
  },
  {
    id: "dummy-campaign-7",
    name: "Weekend Flash Sale",
    segmentName: "All Active Customers",
    rules: [{ id: "rule1", field: "lastPurchaseDays", operator: "lte", value: "30" }],
    ruleLogic: "AND",
    message: "🎉 Weekend Flash Sale! Up to 50% off on selected items. Shop now!",
    createdAt: subDays(new Date(), 3).toISOString(),
    updatedAt: subDays(new Date(), 2).toISOString(),
    status: "Sent",
    audienceSize: 1200,
    sentCount: 1150, // Approx 96%
    failedCount: 50,
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
    const updatedCampaignData = { 
        ...mutableDummyCampaigns[index], 
        ...payload, 
        updatedAt: new Date().toISOString() 
    };

    // Simulate sent/failed counts if status changes to 'Sent' and they aren't provided
    // Also consider if audienceSize changes
    if (payload.status === 'Sent') {
        const audienceSize = payload.audienceSize !== undefined ? payload.audienceSize : mutableDummyCampaigns[index].audienceSize;
        if (payload.sentCount === undefined || payload.failedCount === undefined || payload.audienceSize !== undefined) {
          const successRate = Math.random() * 0.25 + 0.7; // 70-95% success to make it look good
          updatedCampaignData.sentCount = Math.floor(audienceSize * successRate);
          updatedCampaignData.failedCount = audienceSize - updatedCampaignData.sentCount;
        }
    } else if (payload.status && payload.status !== 'Sent') {
        // If status changes to something other than 'Sent', reset counts if not explicitly provided
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


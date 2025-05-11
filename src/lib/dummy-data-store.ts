
// src/lib/dummy-data-store.ts
import type { Campaign, CampaignUpdatePayload } from '@/lib/types';
import { subDays, addDays } from 'date-fns';

// Initial state with 7 campaigns.
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
    rules: [{ id: "rule1", field: "tags", operator: "eq", value: "newsletter_subscriber" }],
    ruleLogic: "AND",
    message: "🔔 Early bird access to Holiday Specials! Don't miss out on exclusive offers.",
    createdAt: subDays(new Date(), 30).toISOString(),
    updatedAt: subDays(new Date(), 29).toISOString(),
    status: "Scheduled", // Changed to Scheduled for variety
    audienceSize: 300,
    sentCount: 0, // Not sent yet
    failedCount: 0,
  },
  {
    id: "dummy-campaign-6",
    name: "New Product Launch",
    segmentName: "Tech Enthusiasts",
    rules: [{ id: "rule1", field: "productViewed", operator: "contains", value: "gadget" }, {id: "rule2", field: "TotalSpend", operator: "gte", value: "1000"}],
    ruleLogic: "AND",
    message: "🚀 Discover our latest tech innovation! Pre-order now and get an exclusive discount.",
    createdAt: subDays(new Date(), 2).toISOString(), // More recent
    updatedAt: subDays(new Date(), 1).toISOString(),
    status: "Draft", // Changed to Draft
    audienceSize: 250,
    sentCount: 0,
    failedCount: 0,
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
    status: "Draft",
    audienceSize: 5000,
    sentCount: 0,
    failedCount: 0,
  }
];

// Ensure all initial dummy campaigns have an updatedAt if not explicitly set
initialDummyCampaigns.forEach(c => {
    if (!c.updatedAt) {
        c.updatedAt = c.createdAt;
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
  // Check if campaign with this ID already exists to prevent duplicates if logic allows
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
    const updatedCampaignData = {
        ...mutableDummyCampaigns[index],
        ...payload,
        updatedAt: new Date().toISOString()
    };

    if (payload.status === 'Sent') {
        const audienceSize = payload.audienceSize !== undefined ? payload.audienceSize : mutableDummyCampaigns[index].audienceSize;
        // Only recalculate sent/failed if audienceSize is positive and counts weren't explicitly provided or audienceSize changed
        if ( (payload.sentCount === undefined || payload.failedCount === undefined || payload.audienceSize !== undefined) && audienceSize > 0) {
            const successRate = Math.random() * 0.25 + 0.7; // 70-95% success
            updatedCampaignData.sentCount = Math.floor(audienceSize * successRate);
            updatedCampaignData.failedCount = audienceSize - updatedCampaignData.sentCount;
        } else if (audienceSize === 0) {
            updatedCampaignData.sentCount = 0;
            updatedCampaignData.failedCount = 0;
        }
        // If sentCount/failedCount are explicitly in payload, they take precedence (already spread)
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
  mutableDummyCampaigns = JSON.parse(JSON.stringify(initialDummyCampaigns));
}

// Initialize the store on load
resetInMemoryDummyCampaigns();

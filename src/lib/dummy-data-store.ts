
// src/lib/dummy-data-store.ts
import type { Campaign, CampaignUpdatePayload } from '@/lib/types';
import { subDays } from 'date-fns';

// Initial state with 6 campaigns, most set to 'Sent' for dashboard visibility.
const initialDummyCampaigns: Campaign[] = [
  {
    id: "dummy-campaign-1",
    name: "Welcome New Users",
    segmentName: "Recent Signups (Last 7 Days)",
    rules: [{ id: "rule1", field: "signedUpDays", operator: "lte", value: "7" }],
    ruleLogic: "AND",
    message: "👋 Welcome to EngageSphere! Explore our features and get started on your first campaign.",
    createdAt: subDays(new Date(), 5).toISOString(),
    updatedAt: subDays(new Date(), 4).toISOString(),
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
    updatedAt: subDays(new Date(), 10).toISOString(), 
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
    updatedAt: subDays(new Date(), 18).toISOString(), 
    status: "Sent", 
    audienceSize: 500,
    sentCount: 475, 
    failedCount: 25,
  },
  {
    id: "dummy-campaign-5",
    name: "Holiday Early Bird", 
    segmentName: "Newsletter Subscribers",
    rules: [{ id: "rule1", field: "tags", operator: "eq", value: "newsletter_subscriber" }], // Changed field to 'tags' for variety
    ruleLogic: "AND",
    message: "🔔 Early bird access to Holiday Specials! Don't miss out on exclusive offers.",
    createdAt: subDays(new Date(), 30).toISOString(),
    updatedAt: subDays(new Date(), 28).toISOString(),
    status: "Sent", 
    audienceSize: 300,
    sentCount: 280, 
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
    sentCount: 240, 
    failedCount: 10,
  }
];

// This will be the mutable store. Resets on server restart.
let mutableDummyCampaigns: Campaign[] = JSON.parse(JSON.stringify(initialDummyCampaigns));

export function getInMemoryDummyCampaigns(): Campaign[] {
  // Filter out any campaign with the specific name "Indo-Pak War Game"
  // This ensures that if it was added dynamically, it won't be shown.
  // The initialDummyCampaigns list itself does not contain it.
  const filteredCampaigns = mutableDummyCampaigns.filter(
    campaign => campaign.name !== "Indo-Pak War Game"
  );
  // Return a deep copy of the filtered and sorted campaigns
  return JSON.parse(JSON.stringify(filteredCampaigns.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())));
}

export function findInMemoryDummyCampaign(id: string): Campaign | undefined {
  const campaign = mutableDummyCampaigns.find(c => c.id === id);
  if (campaign && campaign.name === "Indo-Pak War Game") {
      return undefined; // Do not return the filtered out campaign
  }
  return campaign ? JSON.parse(JSON.stringify(campaign)) : undefined;
}

export function addInMemoryDummyCampaign(campaign: Campaign): Campaign {
  const newCampaignToAdd: Campaign = { ...campaign };
  // Prevent adding the specific campaign name if it's attempted through this function
  if (newCampaignToAdd.name === "Indo-Pak War Game") {
    console.warn("Attempted to add a filtered campaign name. Operation skipped.");
    // Return the original campaign or handle as an error/noop
    return campaign; 
  }
  mutableDummyCampaigns.unshift(newCampaignToAdd); 
  return JSON.parse(JSON.stringify(newCampaignToAdd));
}

export function updateInMemoryDummyCampaign(id: string, payload: CampaignUpdatePayload): Campaign | null {
  const index = mutableDummyCampaigns.findIndex(c => c.id === id);
  if (index > -1) {
    // Prevent updating a campaign to the filtered name
    if (payload.name === "Indo-Pak War Game" && mutableDummyCampaigns[index].name !== "Indo-Pak War Game") {
        console.warn("Attempted to update campaign to a filtered name. Name update skipped.");
        delete payload.name; // Remove the problematic name change from the payload
    }

    const updatedCampaignData = { 
        ...mutableDummyCampaigns[index], 
        ...payload, 
        updatedAt: new Date().toISOString() 
    };

    if (payload.status === 'Sent') {
        const audienceSize = payload.audienceSize !== undefined ? payload.audienceSize : mutableDummyCampaigns[index].audienceSize;
        if (payload.sentCount === undefined || payload.failedCount === undefined || payload.audienceSize !== undefined) {
          if (audienceSize > 0) {
            const successRate = Math.random() * 0.25 + 0.7; 
            updatedCampaignData.sentCount = Math.floor(audienceSize * successRate);
            updatedCampaignData.failedCount = audienceSize - updatedCampaignData.sentCount;
          } else {
            updatedCampaignData.sentCount = 0;
            updatedCampaignData.failedCount = 0;
          }
        }
    } else if (payload.status && payload.status !== 'Sent') {
        if(payload.sentCount === undefined) updatedCampaignData.sentCount = 0;
        if(payload.failedCount === undefined) updatedCampaignData.failedCount = 0;
    }
    
    mutableDummyCampaigns[index] = updatedCampaignData as Campaign;
    // If the updated campaign is the one to be filtered, don't return it from this function either
    if (mutableDummyCampaigns[index].name === "Indo-Pak War Game") {
        return null;
    }
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
  // initialDummyCampaigns is already clean (does not contain "Indo-Pak War Game")
  mutableDummyCampaigns = JSON.parse(JSON.stringify(initialDummyCampaigns));
}

initialDummyCampaigns.forEach(c => {
    if (!c.updatedAt) {
        c.updatedAt = c.createdAt;
    }
});
resetInMemoryDummyCampaigns();

    
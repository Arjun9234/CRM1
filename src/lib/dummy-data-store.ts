// src/lib/dummy-data-store.ts
import type { Campaign, CampaignCreationPayload } from '@/lib/types';

/**
 * @fileOverview Placeholder for in-memory dummy data storage.
 * This file is created to resolve an import error.
 * The functions here are placeholders and do not implement actual data storage.
 */

let campaignsDB: Campaign[] = []; // Placeholder in-memory store

export function getInMemoryDummyCampaigns(): Campaign[] {
  // console.log("dummy-data-store: getInMemoryDummyCampaigns called");
  return JSON.parse(JSON.stringify(campaignsDB)); // Return a copy
}

export function addInMemoryDummyCampaign(campaignData: CampaignCreationPayload): Campaign {
  // console.log("dummy-data-store: addInMemoryDummyCampaign called with:", campaignData);
  const newCampaign: Campaign = {
    id: `campaign_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    ...campaignData,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    // Ensure sentCount and failedCount are initialized if not provided
    sentCount: campaignData.sentCount || 0,
    failedCount: campaignData.failedCount || 0,
  };
  campaignsDB.unshift(newCampaign); // Add to the beginning
  return JSON.parse(JSON.stringify(newCampaign)); // Return a copy
}

export function getCampaignById(id: string): Campaign | undefined {
  // console.log(`dummy-data-store: getCampaignById called for ID: ${id}`);
  const campaign = campaignsDB.find(c => c.id === id);
  return campaign ? JSON.parse(JSON.stringify(campaign)) : undefined;
}

export function updateInMemoryDummyCampaign(id: string, updates: Partial<CampaignCreationPayload>): Campaign | null {
  // console.log(`dummy-data-store: updateInMemoryDummyCampaign called for ID: ${id} with updates:`, updates);
  const index = campaignsDB.findIndex(c => c.id === id);
  if (index !== -1) {
    campaignsDB[index] = {
      ...campaignsDB[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    // Recalculate sent/failed counts if status is 'Sent' and audienceSize is updated
    if (updates.status === 'Sent' && updates.audienceSize !== undefined) {
      const audience = updates.audienceSize;
      if (audience > 0 && (updates.sentCount === undefined || updates.failedCount === undefined)) {
        const successRate = Math.random() * 0.20 + 0.75; // 75-95% success
        campaignsDB[index].sentCount = Math.floor(audience * successRate);
        campaignsDB[index].failedCount = audience - campaignsDB[index].sentCount;
      } else if (audience === 0) {
        campaignsDB[index].sentCount = 0;
        campaignsDB[index].failedCount = 0;
      }
    }
    return JSON.parse(JSON.stringify(campaignsDB[index]));
  }
  return null;
}

export function deleteInMemoryDummyCampaign(id: string): boolean {
  // console.log(`dummy-data-store: deleteInMemoryDummyCampaign called for ID: ${id}`);
  const initialLength = campaignsDB.length;
  campaignsDB = campaignsDB.filter(c => c.id !== id);
  return campaignsDB.length < initialLength;
}

// Initialize with some dummy data if needed for testing other parts,
// but for now, it's an empty store as the primary goal is to fix the import.
// If you had previous dummy data, you could re-add it here.
// For example:
// campaignsDB = [ /* ... your previous dummy campaigns ... */ ];
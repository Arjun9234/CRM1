
// src/lib/dummy-data-store.ts
import type { Campaign, CampaignUpdatePayload } from '@/lib/types';
import { subDays, addDays, subMonths, subYears } from 'date-fns';

// Initial state with 30 campaigns.
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
    status: "Sent", // Already Sent
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
    status: "Sent", // Already Sent
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
    status: "Sent", // Already Sent
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
    status: "Sent", // Already Sent
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
    status: "Sent", // Updated to Sent
    audienceSize: 300,
    sentCount: 285, // Keep existing, processCampaignsArray will verify/adjust if needed
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
    status: "Sent", // Already Sent
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
    status: "Sent", // Already Sent
    audienceSize: 5000,
    sentCount: 4500,
    failedCount: 500,
  },
  {
    id: "dummy-campaign-8",
    name: "Q1 Product Update",
    segmentName: "All Active Users",
    rules: [{ id: "rule1", field: "lastPurchaseDays", operator: "lte", value: "30" }],
    ruleLogic: "AND",
    message: "📢 Check out what's new in our latest product update! Exciting features await.",
    createdAt: subDays(new Date(), 45).toISOString(),
    updatedAt: subDays(new Date(), 44).toISOString(),
    status: "Sent", // Already Sent
    audienceSize: 1200,
    sentCount: 1150,
    failedCount: 50,
  },
  {
    id: "dummy-campaign-9",
    name: "Exclusive Webinar Invite",
    segmentName: "Premium Members",
    rules: [{ id: "rule1", field: "tags", operator: "eq", value: "premium_member" }],
    ruleLogic: "AND",
    message: "Exclusive webinar for our Premium Members on Advanced Strategies. Register now!",
    createdAt: subDays(new Date(), 5).toISOString(),
    updatedAt: subDays(new Date(), 4).toISOString(),
    status: "Sent", // Updated to Sent
    audienceSize: 90,
    sentCount: 80, // Adjusted for "Sent" status
    failedCount: 10,
  },
  {
    id: "dummy-campaign-10",
    name: "Loyalty Program Launch",
    segmentName: "Repeat Customers (3+ purchases)",
    rules: [{ id: "rule1", field: "purchaseFrequency", operator: "gte", value: "3" }],
    ruleLogic: "AND",
    message: "Introducing our new Loyalty Program! Earn points and get exclusive rewards.",
    createdAt: subDays(new Date(), 60).toISOString(),
    updatedAt: subDays(new Date(), 59).toISOString(),
    status: "Sent", // Already Sent
    audienceSize: 450,
    sentCount: 430,
    failedCount: 20,
  },
  {
    id: "dummy-campaign-11",
    name: "Abandoned Cart Recovery",
    segmentName: "Cart Abandoners (Last 24h)",
    rules: [{ id: "rule1", field: "tags", operator: "eq", value: "cart_abandoned_24h" }],
    ruleLogic: "AND",
    message: "Still thinking it over? Complete your purchase now and get free shipping!",
    createdAt: subDays(new Date(), 0).toISOString(), 
    updatedAt: subDays(new Date(), 0).toISOString(),
    status: "Sent", // Updated to Sent
    audienceSize: 30, 
    sentCount: 25, // Adjusted for "Sent" status
    failedCount: 5,
  },
  {
    id: "dummy-campaign-12",
    name: "Birthday Special",
    segmentName: "Birthday This Month",
    rules: [{ id: "rule1", field: "tags", operator: "eq", value: "birthday_current_month" }],
    ruleLogic: "AND",
    message: "🎂 Happy Birthday! Enjoy a special gift from us on your special day.",
    createdAt: subDays(new Date(), 3).toISOString(),
    updatedAt: subDays(new Date(), 2).toISOString(),
    status: "Sent", // Already Sent
    audienceSize: 40,
    sentCount: 38,
    failedCount: 2,
  },
  {
    id: "dummy-campaign-13",
    name: "Refer-a-Friend Bonus",
    segmentName: "All Users",
    rules: [], 
    ruleLogic: "AND",
    message: "Share the love! Refer a friend and both of you get ₹100 off.",
    createdAt: subMonths(new Date(), 2).toISOString(),
    updatedAt: subMonths(new Date(), 2).toISOString(),
    status: "Sent", // Updated to Sent
    audienceSize: 2500,
    sentCount: 2300, // Keep existing
    failedCount: 200,
  },
  {
    id: "dummy-campaign-14",
    name: "Post-Purchase Follow-up",
    segmentName: "Recent Buyers (Last 3 Days)",
    rules: [{ id: "rule1", field: "lastPurchaseDays", operator: "lte", value: "3" }],
    ruleLogic: "AND",
    message: "Thanks for your recent purchase! We hope you're loving it. Share your experience!",
    createdAt: subDays(new Date(), 1).toISOString(),
    updatedAt: subDays(new Date(), 1).toISOString(),
    status: "Sent", // Already Sent
    audienceSize: 60,
    sentCount: 58,
    failedCount: 2,
  },
  {
    id: "dummy-campaign-15",
    name: "Early Access: New Collection",
    segmentName: "VIP Customers",
    rules: [{ id: "rule1", field: "TotalSpend", operator: "gte", value: "10000" }],
    ruleLogic: "AND",
    message: "VIP Access: Be the first to shop our New Collection before anyone else!",
    createdAt: addDays(new Date(), 5).toISOString(), 
    updatedAt: new Date().toISOString(),
    status: "Sent", // Updated to Sent
    audienceSize: 50,
    sentCount: 45, // Adjusted for "Sent" status
    failedCount: 5,
  },
  {
    id: "dummy-campaign-16",
    name: "Black Friday Deals",
    segmentName: "All Newsletter Subscribers",
    rules: [{ id: "rule1", field: "tags", operator: "contains", value: "newsletter" }],
    ruleLogic: "AND",
    message: "Black Friday is here! Unbeatable deals up to 70% off. Shop now!",
    createdAt: subMonths(new Date(), 1).toISOString(), 
    updatedAt: subMonths(new Date(), 1).toISOString(),
    status: "Sent", // Updated to Sent
    audienceSize: 1500,
    sentCount: 1400, // Keep existing
    failedCount: 100,
  },
  {
    id: "dummy-campaign-17",
    name: "App Download Reminder",
    segmentName: "Website Visitors without App",
    rules: [{ id: "rule1", field: "tags", operator: "eq", value: "no_app_installed" }],
    ruleLogic: "AND",
    message: "Enjoy a better experience on the go! Download our app today.",
    createdAt: subDays(new Date(), 25).toISOString(),
    updatedAt: subDays(new Date(), 24).toISOString(),
    status: "Sent", // Already Sent
    audienceSize: 350,
    sentCount: 320,
    failedCount: 30,
  },
  {
    id: "dummy-campaign-18",
    name: "Flash Sale - 24 Hours Only!",
    segmentName: "Engaged Users (Viewed Product Last 7d)",
    rules: [{ id: "rule1", field: "productViewed", operator: "contains", value: "any_product_last_7d" }], 
    ruleLogic: "AND",
    message: "⚡ FLASH SALE! 24 hours only. Don't miss out on amazing discounts!",
    createdAt: subDays(new Date(), 0).toISOString(),
    updatedAt: subDays(new Date(), 0).toISOString(),
    status: "Sent", // Already Sent
    audienceSize: 180,
    sentCount: 170,
    failedCount: 10,
  },
  {
    id: "dummy-campaign-19",
    name: "Service Maintenance Notice",
    segmentName: "All Active Users",
    rules: [{ id: "rule1", field: "lastPurchaseDays", operator: "lte", value: "30" }],
    ruleLogic: "AND",
    message: "Important: Scheduled maintenance on Sunday at 2 AM. Services might be temporarily unavailable.",
    createdAt: subDays(new Date(), 4).toISOString(),
    updatedAt: subDays(new Date(), 4).toISOString(),
    status: "Sent", // Already Sent
    audienceSize: 1100,
    sentCount: 1080,
    failedCount: 20,
  },
  {
    id: "dummy-campaign-20",
    name: "Survey: Customer Satisfaction",
    segmentName: "Users with 1+ Purchase",
    rules: [{ id: "rule1", field: "purchaseFrequency", operator: "gte", value: "1" }],
    ruleLogic: "AND",
    message: "Help us improve! Take our 2-minute Customer Satisfaction Survey.",
    createdAt: subDays(new Date(), 50).toISOString(),
    updatedAt: subDays(new Date(), 49).toISOString(),
    status: "Sent", // Already Sent
    audienceSize: 800,
    sentCount: 750,
    failedCount: 50,
  },
   {
    id: "dummy-campaign-21",
    name: "Year End Review",
    segmentName: "Long-term Customers",
    rules: [{ id: "rule1", field: "signedUpDays", operator: "gte", value: "365" }],
    ruleLogic: "AND",
    message: "Thank you for a great year! Here's a look back at your journey with us.",
    createdAt: subYears(new Date(), 1).toISOString(), 
    updatedAt: subYears(new Date(), 1).toISOString(),
    status: "Sent", // Updated to Sent
    audienceSize: 600,
    sentCount: 580, // Keep existing
    failedCount: 20,
  },
  {
    id: "dummy-campaign-22",
    name: "Limited Stock Alert",
    segmentName: "Wishlist Users - Product X",
    rules: [{ id: "rule1", field: "tags", operator: "eq", value: "wishlist_product_x" }],
    ruleLogic: "AND",
    message: "Hurry! Product X on your wishlist is running low on stock. Grab it now!",
    createdAt: subDays(new Date(), 6).toISOString(),
    updatedAt: subDays(new Date(), 6).toISOString(),
    status: "Sent", // Already Sent
    audienceSize: 25,
    sentCount: 23,
    failedCount: 2,
  },
  {
    id: "dummy-campaign-23",
    name: "Local Event Promotion (Mumbai)",
    segmentName: "Mumbai Users",
    rules: [{ id: "rule1", field: "city", operator: "eq", value: "Mumbai" }],
    ruleLogic: "AND",
    message: "Mumbai! Join us for an exclusive local event this weekend. Details inside.",
    createdAt: subDays(new Date(), 15).toISOString(),
    updatedAt: subDays(new Date(), 14).toISOString(),
    status: "Sent", // Already Sent
    audienceSize: 400,
    sentCount: 380,
    failedCount: 20,
  },
  {
    id: "dummy-campaign-24",
    name: "Back In Stock: Popular Item",
    segmentName: "Notified for Item Y",
    rules: [{ id: "rule1", field: "tags", operator: "eq", value: "notify_item_y" }],
    ruleLogic: "AND",
    message: "Good news! Item Y is back in stock. Order yours before it's gone again!",
    createdAt: subDays(new Date(), 9).toISOString(),
    updatedAt: subDays(new Date(), 9).toISOString(),
    status: "Sent", // Already Sent
    audienceSize: 120,
    sentCount: 115,
    failedCount: 5,
  },
  {
    id: "dummy-campaign-25",
    name: "Monthly Newsletter - July",
    segmentName: "All Newsletter Subscribers",
    rules: [{ id: "rule1", field: "tags", operator: "contains", value: "newsletter" }],
    ruleLogic: "AND",
    message: "Your July newsletter is here! Catch up on the latest news, tips, and offers.",
    createdAt: subDays(new Date(), 28).toISOString(), 
    updatedAt: subDays(new Date(), 28).toISOString(),
    status: "Sent", // Already Sent
    audienceSize: 1600,
    sentCount: 1550,
    failedCount: 50,
  },
  {
    id: "dummy-campaign-26",
    name: "Gamified Challenge Start",
    segmentName: "Users Opted-in for Challenges",
    rules: [{ id: "rule1", field: "tags", operator: "eq", value: "challenge_opt_in" }],
    ruleLogic: "AND",
    message: "The new challenge begins now! Complete tasks and win exciting prizes.",
    createdAt: subDays(new Date(), 1).toISOString(),
    updatedAt: subDays(new Date(), 1).toISOString(),
    status: "Sent", // Already Sent
    audienceSize: 220,
    sentCount: 210,
    failedCount: 10,
  },
  {
    id: "dummy-campaign-27",
    name: "Price Drop Alert",
    segmentName: "Users Watching Product Z",
    rules: [{ id: "rule1", field: "tags", operator: "eq", value: "watching_product_z" }],
    ruleLogic: "AND",
    message: "Great news! The price for Product Z has dropped. Check it out now!",
    createdAt: subDays(new Date(), 3).toISOString(),
    updatedAt: subDays(new Date(), 3).toISOString(),
    status: "Sent", // Already Sent
    audienceSize: 70,
    sentCount: 65,
    failedCount: 5,
  },
  {
    id: "dummy-campaign-28",
    name: "Test Campaign - Internal",
    segmentName: "Internal Testers",
    rules: [{ id: "rule1", field: "email", operator: "endsWith", value: "@engagesphere.dev" }], 
    ruleLogic: "AND",
    message: "This is a test message for internal campaign validation. Please ignore.",
    createdAt: subDays(new Date(), 0).toISOString(),
    updatedAt: subDays(new Date(), 0).toISOString(),
    status: "Sent", // Updated to Sent
    audienceSize: 5,
    sentCount: 4, // Adjusted for "Sent" status
    failedCount: 1,
  },
  {
    id: "dummy-campaign-29",
    name: "Failed Delivery Retry Attempt",
    segmentName: "Previous Delivery Failures",
    rules: [{ id: "rule1", field: "tags", operator: "eq", value: "delivery_failed_previous" }],
    ruleLogic: "AND",
    message: "We're attempting to resend your previous message. Apologies for any inconvenience.",
    createdAt: subDays(new Date(), 18).toISOString(),
    updatedAt: subDays(new Date(), 17).toISOString(),
    status: "Sent", // Updated to Sent, assuming a retry would be 'Sent'
    audienceSize: 15,
    sentCount: 10, // Assume some retries succeed
    failedCount: 5,
  },
  {
    id: "dummy-campaign-30",
    name: "Cancelled Promotion (Stock Issue)",
    segmentName: "All Users",
    rules: [],
    ruleLogic: "AND",
    message: "Apology: Due to unforeseen stock issues, the 'Mega Discount' promotion has been cancelled. We apologize for any inconvenience.",
    createdAt: subDays(new Date(), 13).toISOString(),
    updatedAt: subDays(new Date(), 13).toISOString(),
    status: "Sent", // Updated to Sent, even though it was a cancellation notice
    audienceSize: 2000, // Audience it was intended for or notified
    sentCount: 1950, // Number of cancellation notices sent
    failedCount: 50,
  }
];

// Utility to process campaigns (e.g., calculate sent/failed counts)
const processCampaignsArray = (campaigns: Campaign[]): Campaign[] => {
  return campaigns.map(c => {
    const campaignCopy = { ...c }; // Work on a copy
    if (!campaignCopy.updatedAt) {
      campaignCopy.updatedAt = campaignCopy.createdAt;
    }
    // Ensure sentCount and failedCount are numbers, default to 0 if undefined
    campaignCopy.sentCount = campaignCopy.sentCount ?? 0;
    campaignCopy.failedCount = campaignCopy.failedCount ?? 0;
    
    if (campaignCopy.status === "Sent") {
      const audience = campaignCopy.audienceSize || 0;
      // Recalculate if counts don't add up to audience size or if audienceSize is positive and counts are zero (implying they need init)
      if (audience > 0 && ( (campaignCopy.sentCount + campaignCopy.failedCount !== audience) || (campaignCopy.sentCount === 0 && campaignCopy.failedCount === 0) ) ) {
        const successRate = Math.random() * 0.20 + 0.75; // 75-95% success
        campaignCopy.sentCount = Math.floor(audience * successRate);
        campaignCopy.failedCount = audience - campaignCopy.sentCount;
      } else if (audience === 0) {
        campaignCopy.sentCount = 0;
        campaignCopy.failedCount = 0;
      }
    } else if (campaignCopy.status !== "Sent" && campaignCopy.status !== "Archived" && campaignCopy.status !== "Failed") {
      // For Draft, Scheduled, Cancelled, ensure sent/failed are 0 unless explicitly set otherwise for some reason
       if (campaignCopy.sentCount !== 0) campaignCopy.sentCount = 0;
       if (campaignCopy.failedCount !== 0) campaignCopy.failedCount = 0;
    }
    return campaignCopy;
  });
};

let campaignsDB: Campaign[];

// Changed key to ensure reset if structure changes or major data update
const GLOBAL_CAMPAIGNS_KEY = '__ENGAGESPHERE_DUMMY_CAMPAIGNS_STORE_V6__'; 

if (process.env.NODE_ENV === 'production') {
  campaignsDB = processCampaignsArray(JSON.parse(JSON.stringify(initialDummyCampaigns)));
} else {
  if (!(global as any)[GLOBAL_CAMPAIGNS_KEY]) {
    (global as any)[GLOBAL_CAMPAIGNS_KEY] = processCampaignsArray(JSON.parse(JSON.stringify(initialDummyCampaigns)));
  }
  campaignsDB = (global as any)[GLOBAL_CAMPAIGNS_KEY];
}

export function getInMemoryDummyCampaigns(): Campaign[] {
  // Create a deep copy to avoid modifying the original campaignsDB when sorting or manipulating outside
  const campaignsCopy = JSON.parse(JSON.stringify(campaignsDB));
  return campaignsCopy.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function findInMemoryDummyCampaign(id: string): Campaign | undefined {
  const campaign = campaignsDB.find(c => c.id === id);
  return campaign ? JSON.parse(JSON.stringify(campaign)) : undefined;
}

export function addInMemoryDummyCampaign(campaign: Campaign): Campaign {
  // Ensure the campaign being added is a new object, not a reference
  const newCampaignToAdd: Campaign = JSON.parse(JSON.stringify(campaign));

  // Ensure ID is present, generate if not (though API should handle this)
  if (!newCampaignToAdd.id) {
      newCampaignToAdd.id = `dummy-campaign-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  }

  if (!newCampaignToAdd.createdAt) {
    newCampaignToAdd.createdAt = new Date().toISOString();
  }
  if (!newCampaignToAdd.updatedAt) {
    newCampaignToAdd.updatedAt = newCampaignToAdd.createdAt;
  }
  
  const audience = newCampaignToAdd.audienceSize || 0;
  if (newCampaignToAdd.status === 'Sent') {
      // Only initialize/recalculate if counts are not provided OR if they don't sum up to audienceSize
      if (audience > 0 && 
          (newCampaignToAdd.sentCount === undefined || 
           newCampaignToAdd.failedCount === undefined || 
           (newCampaignToAdd.sentCount + newCampaignToAdd.failedCount !== audience)
          )
      ) {
          const successRate = Math.random() * 0.20 + 0.75; 
          newCampaignToAdd.sentCount = Math.floor(audience * successRate);
          newCampaignToAdd.failedCount = audience - newCampaignToAdd.sentCount;
      } else if (audience === 0) {
          newCampaignToAdd.sentCount = 0;
          newCampaignToAdd.failedCount = 0;
      }
      // If counts are provided and sum to audience, use them.
  } else { 
      // For non-Sent statuses, counts should generally be 0 unless explicitly set otherwise by the payload
      if (newCampaignToAdd.sentCount === undefined) newCampaignToAdd.sentCount = 0;
      if (newCampaignToAdd.failedCount === undefined) newCampaignToAdd.failedCount = 0;
  }


  const existingIndex = campaignsDB.findIndex(c => c.id === newCampaignToAdd.id);
  if (existingIndex > -1) {
    campaignsDB[existingIndex] = newCampaignToAdd; // Update existing if ID matches
  } else {
    campaignsDB.push(newCampaignToAdd); // Add to the end of the array
  }
  return JSON.parse(JSON.stringify(newCampaignToAdd)); // Return a copy
}

export function updateInMemoryDummyCampaign(id: string, payload: CampaignUpdatePayload): Campaign | null {
  const index = campaignsDB.findIndex(c => c.id === id);
  if (index > -1) {
    const existingCampaign = campaignsDB[index];
    // Create the base for the updated campaign using existing data
    const updatedCampaignData: Campaign = {
        ...existingCampaign, 
        ...payload, // Spread payload to overwrite fields
        updatedAt: new Date().toISOString(), // Always update timestamp
        // Explicitly ensure certain fields are preserved or correctly typed from payload
        id: existingCampaign.id, // ID should not change
        createdAt: existingCampaign.createdAt, // createdAt should not change
        status: payload.status !== undefined ? payload.status : existingCampaign.status, 
        audienceSize: payload.audienceSize !== undefined ? payload.audienceSize : existingCampaign.audienceSize,
        // Make sure sentCount and failedCount are numbers
        sentCount: payload.sentCount !== undefined ? payload.sentCount : existingCampaign.sentCount,
        failedCount: payload.failedCount !== undefined ? payload.failedCount : existingCampaign.failedCount,
    };

    const audienceSize = updatedCampaignData.audienceSize; 
    
    // If status is being set to 'Sent' (either from payload or was already 'Sent' and other things changed)
    if (updatedCampaignData.status === 'Sent') {
        const providedSent = payload.sentCount !== undefined;
        const providedFailed = payload.failedCount !== undefined;

        // Recalculate if:
        // 1. Audience size is positive AND
        // 2. Counts were NOT explicitly provided in this update payload OR
        // 3. Audience size changed in this update and current counts are inconsistent
        if (audienceSize > 0 && 
            (!providedSent || !providedFailed || 
             (payload.audienceSize !== undefined && payload.audienceSize !== existingCampaign.audienceSize) ||
             (updatedCampaignData.sentCount + updatedCampaignData.failedCount !== audienceSize) // General check for consistency
            )
        ) {
            const successRate = Math.random() * 0.20 + 0.75; // 75-95%
            updatedCampaignData.sentCount = Math.floor(audienceSize * successRate);
            updatedCampaignData.failedCount = audienceSize - updatedCampaignData.sentCount;
        } else if (audienceSize === 0) {
            updatedCampaignData.sentCount = 0;
            updatedCampaignData.failedCount = 0;
        }
        // If counts were explicitly provided in payload and are consistent, they are already set.
    } else if (payload.status && payload.status !== 'Sent' && payload.status !== 'Archived' && payload.status !== 'Failed') {
        // If status changes to Draft, Scheduled, Cancelled, reset counts unless explicitly provided in *this* payload.
        if(payload.sentCount === undefined) updatedCampaignData.sentCount = 0;
        if(payload.failedCount === undefined) updatedCampaignData.failedCount = 0;
    }
    // For 'Archived' or 'Failed' status, we assume the counts reflect the state when it was 'Sent' or attempted.

    campaignsDB[index] = updatedCampaignData;
    return JSON.parse(JSON.stringify(campaignsDB[index]));
  }
  return null;
}

export function deleteInMemoryDummyCampaign(id: string): boolean {
  const index = campaignsDB.findIndex(c => c.id === id);
  if (index > -1) {
    campaignsDB.splice(index, 1); 
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

    
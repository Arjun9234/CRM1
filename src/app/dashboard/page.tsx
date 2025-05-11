
"use client";

import AppLayout from "@/components/layout/app-layout";
import { CampaignList } from "@/components/campaigns/campaign-list";
import type { Campaign } from "@/lib/types";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { PlusCircle, Loader2 } from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import { KeyMetricsDisplay } from "@/components/dashboard/KeyMetricsDisplay";
import { CampaignPerformanceChart } from "@/components/dashboard/CampaignPerformanceChart";
import { MarketingTipsWidget } from "@/components/dashboard/MarketingTipsWidget";
import { Skeleton } from "@/components/ui/skeleton";
import { subDays, formatISO } from 'date-fns';

const CAMPAIGNS_STORAGE_KEY = 'miniature-genius-campaigns'; // Using existing key for consistency

const generateDummyCampaigns = (): Campaign[] => {
  const now = new Date();
  return [
    {
      id: "dummy-campaign-1",
      name: "Spring Welcome Offer",
      segmentId: "seg-spring-welcome",
      segmentName: "New Subscribers - March",
      message: "Welcome to our community! Enjoy 15% off your first purchase this spring. Use code SPRING15.",
      createdAt: formatISO(subDays(now, 20)),
      status: 'Sent',
      audienceSize: 1250,
      sentCount: 1180,
      failedCount: 70,
    },
    {
      id: "dummy-campaign-2",
      name: "Weekend Flash Sale",
      segmentId: "seg-flash-sale-active",
      segmentName: "Active Users - Last 30 Days",
      message: "Don't miss out! Our Weekend Flash Sale is ON. Get up to 50% off selected items. Shop now!",
      createdAt: formatISO(subDays(now, 10)),
      status: 'Sent',
      audienceSize: 3500,
      sentCount: 3250,
      failedCount: 250,
    },
    {
      id: "dummy-campaign-3",
      name: "Loyalty Rewards Update",
      segmentId: "seg-loyalty-members",
      segmentName: "Loyalty Program Members",
      message: "Hi {customer_name}, exciting news! We've updated our loyalty program with even more benefits. Check them out!",
      createdAt: formatISO(subDays(now, 5)),
      status: 'Sent',
      audienceSize: 850,
      sentCount: 820,
      failedCount: 30,
    },
    {
      id: "dummy-campaign-4",
      name: "Inactive User Re-engagement",
      segmentId: "seg-inactive-90d",
      segmentName: "Inactive Users (90+ days)",
      message: "We miss you! Come back and discover what's new with a special 20% off coupon: COMEBACK20.",
      createdAt: formatISO(subDays(now, 2)),
      status: 'Sent',
      audienceSize: 2100,
      sentCount: 1890,
      failedCount: 210,
    },
  ];
};


export default function DashboardPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const storedCampaigns = localStorage.getItem(CAMPAIGNS_STORAGE_KEY);
      let activeCampaigns: Campaign[];

      if (storedCampaigns) {
        const parsedCampaigns: Campaign[] = JSON.parse(storedCampaigns);
        // Ensure it's an array and not empty, otherwise use dummy data
        if (Array.isArray(parsedCampaigns) && parsedCampaigns.length > 0) {
          activeCampaigns = parsedCampaigns;
        } else {
          activeCampaigns = generateDummyCampaigns();
          localStorage.setItem(CAMPAIGNS_STORAGE_KEY, JSON.stringify(activeCampaigns));
        }
      } else {
        activeCampaigns = generateDummyCampaigns();
        localStorage.setItem(CAMPAIGNS_STORAGE_KEY, JSON.stringify(activeCampaigns));
      }
      
      // Sort campaigns by creation date, most recent first for chart and list
      const sortedCampaigns = [...activeCampaigns].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setCampaigns(sortedCampaigns);

    } catch (error) {
      console.error("Failed to load or initialize campaigns from localStorage", error);
      // Fallback to dummy data if parsing or storage fails catastrophically
      const dummyData = generateDummyCampaigns();
      const sortedDummyData = [...dummyData].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setCampaigns(sortedDummyData);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const { totalCampaigns, totalAudienceTargeted, totalSuccessfullySent, overallSuccessRate } = useMemo(() => {
    const tc = campaigns.length;
    const tat = campaigns.reduce((sum, c) => sum + c.audienceSize, 0);
    const tss = campaigns.reduce((sum, c) => sum + c.sentCount, 0);
    // Ensure denominator is not zero for success rate calculation.
    // Success is (total successfully sent / total attempted which is audience size in this model)
    // For overall, we sum up all sent and all audience sizes.
    const totalAttempted = campaigns.reduce((sum, c) => sum + c.audienceSize, 0);
    const osr = totalAttempted > 0 ? (tss / totalAttempted) * 100 : 0; 
    
    return { 
      totalCampaigns: tc, 
      totalAudienceTargeted: tat, 
      totalSuccessfullySent: tss, 
      overallSuccessRate: osr 
    };
  }, [campaigns]);

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold tracking-tight">Campaign Dashboard</h1>
        </div>
        <div className="space-y-8">
          {/* Skeletons for KeyMetricsDisplay */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32 rounded-lg" />)}
          </div>
          {/* Skeleton for Chart and Tips */}
          <div className="grid gap-6 lg:grid-cols-3">
            <Skeleton className="lg:col-span-2 h-80 rounded-lg" />
            <Skeleton className="h-80 rounded-lg" />
          </div>
          {/* Skeleton for CampaignList title */}
          <Skeleton className="h-8 w-48 rounded-md" />
          {/* Skeletons for CampaignCards */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-72 rounded-lg" />)}
          </div>
        </div>
      </AppLayout>
    );
  }
  
  return (
    <AppLayout>
      <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">Campaign Dashboard</h1>
        <Link href="/campaigns/new" passHref>
          <Button>
            <PlusCircle className="mr-2 h-5 w-5" />
            New Campaign
          </Button>
        </Link>
      </div>

      <KeyMetricsDisplay 
        totalCampaigns={totalCampaigns}
        totalAudienceTargeted={totalAudienceTargeted}
        totalSuccessfullySent={totalSuccessfullySent}
        overallSuccessRate={overallSuccessRate}
      />

      <div className="grid gap-6 lg:grid-cols-3 mb-8">
        <div className="lg:col-span-2">
          {/* Pass the 7 most recent campaigns to the chart */}
          <CampaignPerformanceChart campaigns={campaigns.slice(0,7)} /> 
        </div>
        <div>
          <MarketingTipsWidget />
        </div>
      </div>
      
      <h2 className="text-xl md:text-2xl font-semibold tracking-tight text-foreground mb-6">Your Campaigns</h2>
      {/* CampaignList will display all campaigns, sorted most recent first */}
      <CampaignList campaigns={campaigns} /> 
    </AppLayout>
  );
}


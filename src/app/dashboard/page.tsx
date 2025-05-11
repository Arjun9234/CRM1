
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

const CAMPAIGNS_STORAGE_KEY = 'miniature-genius-campaigns';

export default function DashboardPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const storedCampaigns = localStorage.getItem(CAMPAIGNS_STORAGE_KEY);
      if (storedCampaigns) {
        const parsedCampaigns: Campaign[] = JSON.parse(storedCampaigns);
        // Sort campaigns by creation date, most recent first for chart
        const sortedCampaigns = [...parsedCampaigns].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setCampaigns(sortedCampaigns);
      }
    } catch (error) {
      console.error("Failed to load campaigns from localStorage", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const { totalCampaigns, totalAudienceTargeted, totalSuccessfullySent, overallSuccessRate } = useMemo(() => {
    const tc = campaigns.length;
    const tat = campaigns.reduce((sum, c) => sum + c.audienceSize, 0);
    const tss = campaigns.reduce((sum, c) => sum + c.sentCount, 0);
    const osr = tat > 0 ? (tss / tat) * 100 : 0; // Success rate based on successfully sent / total audience targeted
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
          <CampaignPerformanceChart campaigns={campaigns.slice(0,7)} /> 
        </div>
        <div>
          <MarketingTipsWidget />
        </div>
      </div>
      
      <h2 className="text-xl md:text-2xl font-semibold tracking-tight text-foreground mb-6">Your Campaigns</h2>
      <CampaignList campaigns={campaigns} />
    </AppLayout>
  );
}

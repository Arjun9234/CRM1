
"use client";

import AppLayout from "@/components/layout/app-layout";
import { CampaignList } from "@/components/campaigns/campaign-list";
import type { Campaign } from "@/lib/types";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { PlusCircle } from "lucide-react";
import { useMemo } from "react";
import { KeyMetricsDisplay } from "@/components/dashboard/KeyMetricsDisplay";
import { CampaignPerformanceChart } from "@/components/dashboard/CampaignPerformanceChart";
import { MarketingTipsWidget } from "@/components/dashboard/MarketingTipsWidget";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from '@tanstack/react-query';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal } from "lucide-react";

async function fetchCampaigns(): Promise<Campaign[]> {
  const response = await fetch('/api/campaigns', { cache: 'no-store' });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to fetch campaigns');
  }
  return response.json();
}

export default function DashboardPage() {
  const { data: campaigns = [], isLoading, error, isFetching } = useQuery<Campaign[]>({
    queryKey: ['campaigns'],
    queryFn: fetchCampaigns,
    // The dashboard is a high-level overview, so we can afford a slightly longer stale time
    // to reduce refetches if the user navigates away and back quickly.
    // staleTime: 1000 * 60 * 1, // 1 minute
    // refetchInterval: 1000 * 60 * 5, // Refetch every 5 minutes to keep data relatively fresh
  });

  const sortedCampaigns = useMemo(() => {
    // Campaigns are already sorted by createdAt desc from API
    return campaigns;
  }, [campaigns]);

  const { totalCampaigns, totalAudienceTargeted, totalSuccessfullySent, overallSuccessRate } = useMemo(() => {
    const tc = sortedCampaigns.length;
    const tat = sortedCampaigns.reduce((sum, c) => sum + (c.audienceSize || 0), 0);
    const tss = sortedCampaigns.reduce((sum, c) => sum + (c.sentCount || 0), 0);
    const totalAttemptedForSuccessRate = sortedCampaigns
      .filter(c => c.status === 'Sent' || c.status === 'Archived' || c.status === 'Failed') // Only count relevant statuses for success rate calculation
      .reduce((sum, c) => sum + (c.audienceSize || 0), 0);
    const osr = totalAttemptedForSuccessRate > 0 ? (tss / totalAttemptedForSuccessRate) * 100 : 0; 
    
    return { 
      totalCampaigns: tc, 
      totalAudienceTargeted: tat, 
      totalSuccessfullySent: tss, 
      overallSuccessRate: osr 
    };
  }, [sortedCampaigns]);

  const campaignsForDisplay = useMemo(() => sortedCampaigns.slice(0, 6), [sortedCampaigns]);

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold tracking-tight">Campaign Dashboard</h1>
        </div>
        <div className="space-y-8">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32 rounded-lg" />)}
          </div>
          <div className="grid gap-6 lg:grid-cols-3">
            <Skeleton className="lg:col-span-2 h-80 rounded-lg" />
            <Skeleton className="h-80 rounded-lg" />
          </div>
          <Skeleton className="h-8 w-48 rounded-md" />
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-72 rounded-lg" />)}
          </div>
        </div>
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout>
        <div className="container mx-auto p-4">
          <Alert variant="destructive">
            <Terminal className="h-4 w-4" />
            <AlertTitle>Error Fetching Campaigns</AlertTitle>
            <AlertDescription>
              {(error as Error).message || "An unexpected error occurred."}
            </AlertDescription>
          </Alert>
        </div>
      </AppLayout>
    )
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
          <CampaignPerformanceChart campaigns={campaignsForDisplay} /> 
        </div>
        <div>
          <MarketingTipsWidget />
        </div>
      </div>
      
      <h2 className="text-xl md:text-2xl font-semibold tracking-tight text-foreground mb-6">Your Campaigns ({campaignsForDisplay.length} most recent)</h2>
      <CampaignList campaigns={campaignsForDisplay} /> 
    </AppLayout>
  );
}

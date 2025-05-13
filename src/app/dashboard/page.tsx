
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
  const responseBody = await response.text();

  if (!response.ok) {
    let errorMessage = `Failed to fetch campaigns (Status: ${response.status} ${response.statusText || 'Unknown Status'})`;
    if (response.status === 504) {
        errorMessage = `Failed to fetch campaigns: The server took too long to respond (Gateway Timeout). This might be a temporary issue.`;
    } else {
        try {
            const errorData = JSON.parse(responseBody);
            errorMessage = errorData.message || `Failed to fetch campaigns (Status: ${response.status})`;
        } catch (e) {
            if (responseBody.toLowerCase().includes("firebase") && responseBody.toLowerCase().includes("error")) {
                errorMessage = `Failed to fetch campaigns. Server returned a Firebase-related error (Status: ${response.status}). Please check Firebase configuration and API route logs. Response preview: ${responseBody.substring(0, 200)}...`;
            } else {
                errorMessage = `Failed to fetch campaigns. Server returned non-JSON error (Status: ${response.status}). Response preview: ${responseBody.substring(0, 200)}...`;
            }
        }
    }
    throw new Error(errorMessage);
  }

  try {
    return JSON.parse(responseBody);
  } catch (e) {
    const preview = responseBody.substring(0, 500); 
    throw new Error(`Successfully fetched campaigns (Status: ${response.status}), but failed to parse response as JSON. Response preview: ${preview}...`);
  }
}

export default function DashboardPage() {
  const { data: campaigns = [], isLoading, error, isFetching } = useQuery<Campaign[]>({
    queryKey: ['campaigns'],
    queryFn: fetchCampaigns,
  });

  const sortedCampaigns = useMemo(() => {
    return [...campaigns].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [campaigns]);

  const { totalCampaigns, totalAudienceTargeted, totalSuccessfullySent, overallSuccessRate } = useMemo(() => {
    const tc = sortedCampaigns.length;
    const tat = sortedCampaigns.reduce((sum, c) => sum + (c.audienceSize || 0), 0);
    const tss = sortedCampaigns.reduce((sum, c) => sum + (c.sentCount || 0), 0);
    const totalAttemptedForSuccessRate = sortedCampaigns
      .filter(c => c.status === 'Sent' || c.status === 'Archived' || c.status === 'Failed') 
      .reduce((sum, c) => sum + (c.audienceSize || 0), 0);
    const osr = totalAttemptedForSuccessRate > 0 ? (tss / totalAttemptedForSuccessRate) * 100 : 0; 
    
    return { 
      totalCampaigns: tc, 
      totalAudienceTargeted: tat, 
      totalSuccessfullySent: tss, 
      overallSuccessRate: osr 
    };
  }, [sortedCampaigns]);

  const campaignsForDisplay = sortedCampaigns;
  const campaignsForChart = useMemo(() => sortedCampaigns.slice(0, 30).reverse(), [sortedCampaigns]);


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
              <p className="text-xs mt-2">Please check your internet connection and ensure the backend services (including Firebase) are correctly configured and running. If the problem persists, contact support or check server logs.</p>
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
          <CampaignPerformanceChart campaigns={campaignsForChart} /> 
        </div>
        <div>
          <MarketingTipsWidget />
        </div>
      </div>
      
      <h2 className="text-xl md:text-2xl font-semibold tracking-tight text-foreground mb-6">Your Campaigns ({campaignsForDisplay.length})</h2>
      <CampaignList campaigns={campaignsForDisplay} /> 
    </AppLayout>
  );
}

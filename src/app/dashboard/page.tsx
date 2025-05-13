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
import { useAuth } from "@/hooks/use-auth"; 
import { API_BASE_URL } from '@/lib/config'; // Import centralized API_BASE_URL

// const API_BASE_URL = `http://localhost:${process.env.NEXT_PUBLIC_SERVER_PORT || 5000}/api`; // Removed

async function fetchCampaigns(token: string | null): Promise<Campaign[]> {
  console.log(`fetchCampaigns (client): Fetching campaigns from ${API_BASE_URL}/campaigns`);
  const response = await fetch(`${API_BASE_URL}/campaigns`, { cache: 'no-store' });
  
  if (!response.ok) {
    let errorMessage = `Failed to fetch campaigns (Status: ${response.status} ${response.statusText || 'Unknown Status'})`;
    let errorBodyText = "";
    try {
        errorBodyText = await response.text();
        if (errorBodyText.toLowerCase().includes("<html")) {
             errorMessage = `Server returned an unexpected HTML error page (status: ${response.status}). This usually indicates a server-side problem or misconfiguration. Please check server logs.`;
             console.error("Full HTML error from server (fetchCampaigns):", errorBodyText.substring(0,1000));
        } else if (errorBodyText) {
            const errorData = JSON.parse(errorBodyText);
            errorMessage = errorData.message || `Failed to fetch campaigns (Status: ${response.status})`;
        }
    } catch (e) {
         errorMessage = `Failed to fetch campaigns. Server returned non-JSON error (Status: ${response.status}). Preview: ${errorBodyText.substring(0,100)}`;
    }
    throw new Error(errorMessage);
  }
  const campaigns = await response.json();
  return campaigns.map((c: any) => ({...c, id: c._id})); // Map _id to id
}

export default function DashboardPage() {
  const { token } = useAuth(); 
  const { data: campaigns = [], isLoading, error, isFetching } = useQuery<Campaign[]>({
    queryKey: ['campaigns'],
    queryFn: () => fetchCampaigns(token),
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

  if (error && !isFetching) { // Only show full error if not actively fetching (e.g. on initial load error)
    return (
      <AppLayout>
        <div className="container mx-auto p-4">
          <Alert variant="destructive">
            <Terminal className="h-4 w-4" />
            <AlertTitle>Error Fetching Campaigns</AlertTitle>
            <AlertDescription>
              {(error as Error).message || "An unexpected error occurred."}
              <p className="text-xs mt-2">Please check your internet connection and ensure the backend services are correctly configured and running. If the problem persists, contact support or check server logs.</p>
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

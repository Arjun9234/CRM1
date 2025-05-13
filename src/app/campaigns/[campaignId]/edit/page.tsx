
"use client";

import AppLayout from "@/components/layout/app-layout";
// import { CreateCampaignForm } from "@/components/campaigns/create-campaign-form"; // Not used here
import { Separator } from "@/components/ui/separator";
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import type { Campaign } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EditCampaignForm } from "@/components/campaigns/edit-campaign-form";
import { useAuth } from "@/hooks/use-auth";

const API_BASE_URL = `http://localhost:${process.env.NEXT_PUBLIC_SERVER_PORT || 5000}/api`;

async function fetchCampaignForEdit(campaignId: string, token: string | null): Promise<Campaign> {
  // const headers: HeadersInit = { 'Content-Type': 'application/json' };
  // if (token) {
  //   headers['x-auth-token'] = token;
  // }
  const response = await fetch(`${API_BASE_URL}/campaigns/${campaignId}` /*, { headers } */);
  
  if (!response.ok) {
    let errorMessage = `Failed to fetch campaign ${campaignId} (Status: ${response.status} ${response.statusText || 'Unknown Status'})`;
     try {
        const errorBody = await response.text();
         if (errorBody.toLowerCase().includes("<html")) {
             errorMessage = `Server returned an unexpected HTML error page (status: ${response.status}). This usually indicates a server-side problem or misconfiguration. Please check server logs.`;
        } else {
            const errorData = JSON.parse(errorBody);
            errorMessage = errorData.message || `Failed to fetch campaign ${campaignId}`;
        }
    } catch (e) {
        errorMessage = `Failed to fetch campaign ${campaignId}. Server returned non-JSON error (Status: ${response.status}).`;
    }
    throw new Error(errorMessage);
  }
  const data = await response.json();
  return { ...data, id: data._id }; // Map _id to id
}


export default function EditCampaignPage() {
  const params = useParams();
  const router = useRouter();
  const { token } = useAuth();
  const campaignId = params.campaignId as string;

  const { data: campaign, isLoading, error, isError } = useQuery<Campaign>({
    queryKey: ['campaign', campaignId, 'edit'], 
    queryFn: () => fetchCampaignForEdit(campaignId, token),
    enabled: !!campaignId, // && !!token, // Only fetch if campaignId and token are available
  });


  if (isLoading) {
    return (
      <AppLayout>
        <div className="space-y-6">
            <div>
                <Skeleton className="h-10 w-1/3 mb-2" />
                <Skeleton className="h-6 w-1/2" />
            </div>
            <Separator />
            <div className="max-w-4xl mx-auto space-y-6">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-40 w-full" />
                <Skeleton className="h-60 w-full" />
                <Skeleton className="h-10 w-32 ml-auto" />
            </div>
        </div>
      </AppLayout>
    );
  }

  if (isError || !campaign) {
     return (
      <AppLayout>
        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error Loading Campaign for Editing</AlertTitle>
          <AlertDescription>
            {(error as Error)?.message || "The campaign data could not be loaded. It may have been deleted or an error occurred."}
          </AlertDescription>
        </Alert>
        <Button onClick={() => router.push('/dashboard')}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
        </Button>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Edit Campaign: {campaign.name}</h1>
          <p className="text-muted-foreground">
            Modify your audience segment, update the message, and manage campaign settings.
          </p>
        </div>
        <Separator />
        <div className="max-w-4xl mx-auto">
            <EditCampaignForm existingCampaign={campaign} />
        </div>
      </div>
    </AppLayout>
  );
}

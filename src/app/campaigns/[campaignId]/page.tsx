"use client";

import AppLayout from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle as UiAlertTitle } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription as AlertDialogPrimitiveDescription, 
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle as AlertDialogPrimitiveTitle, 
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ArrowLeft, Users, CheckCircle, XCircle, Target, CalendarDays, MessageSquare, SlidersHorizontal, AlertTriangle, BarChart, Edit3, Trash2, Loader2, Ban } from "lucide-react";
import type { Campaign, SegmentRule } from "@/lib/types";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { API_BASE_URL } from '@/lib/config'; 

async function fetchCampaign(idToFetch: string, token: string | null): Promise<Campaign> {
  // Robust check at the very beginning
  if (typeof idToFetch !== 'string' || idToFetch.trim() === '' || idToFetch.toLowerCase() === 'undefined') {
    const errorMessage = `fetchCampaign (client): Received invalid idToFetch: '${idToFetch}' (type: ${typeof idToFetch}). This should ideally be caught by the caller's 'enabled' logic in useQuery. Aborting API call.`;
    console.error(errorMessage);
    throw new Error(errorMessage); // This error will be caught by React Query
  }

  console.log(`fetchCampaign (client): Fetching campaign ${idToFetch} from ${API_BASE_URL}/campaigns/${idToFetch}`);
  
  const response = await fetch(`${API_BASE_URL}/campaigns/${idToFetch}`);
  const responseText = await response.text(); 

  if (!response.ok) {
    let errorMessage = `Failed to fetch campaign ${idToFetch} (Status: ${response.status} ${response.statusText || 'Unknown Status'})`;
    let errorDetails: any = null;
    console.error(`fetchCampaign (client) for ${idToFetch}: Error response text (first 500 chars):`, responseText.substring(0, 500));
     if (response.status === 504) {
        errorMessage = `Failed to fetch campaign: The server took too long to respond (Gateway Timeout). This might be a temporary issue.`;
    } else {
        try {
             if (responseText && responseText.trim().startsWith('{') && responseText.trim().endsWith('}')) {
                const errorData = JSON.parse(responseText);
                errorMessage = errorData.message || `Failed to fetch campaign ${idToFetch}`;
                errorDetails = errorData.errors || errorData.details || errorData;
            } else if (responseText.toLowerCase().includes("<html")) {
                 errorMessage = `Server returned an unexpected HTML error page (status: ${response.status}). This usually indicates a server-side problem or misconfiguration. Please check server logs.`;
            } else if (responseText) {
                 errorMessage = `Server error: ${responseText.substring(0, 200)}`;
            }
        } catch (e) {
             // If parsing JSON fails, use the original generic message
        }
    }
    console.error(`fetchCampaign (client) for ${idToFetch}: Throwing error:`, errorMessage, "Details:", errorDetails);
    const err = new Error(errorMessage);
    (err as any).details = errorDetails;
    throw err;
  }
  try {
    const data = JSON.parse(responseText);
    if (!data || !data._id) {
        console.error(`fetchCampaign (client): Fetched data for campaign ${idToFetch} is invalid or missing ID. Data:`, data);
        throw new Error(`Fetched campaign data for ${idToFetch} is invalid or missing ID.`);
    }
    console.log(`fetchCampaign (client): Successfully fetched campaign ${idToFetch}`);
    return { ...data, id: data._id }; 
  } catch (e) {
      console.error(`fetchCampaign (client): Error parsing successful JSON response for ${idToFetch}:`, e, "Body:", responseText.substring(0,500));
      throw new Error(`Failed to parse campaign data for ${idToFetch}.`);
  }
}

async function deleteCampaignApi(campaignId: string, token: string | null): Promise<void> {
  if (typeof campaignId !== 'string' || campaignId.trim() === '' || campaignId.toLowerCase() === 'undefined') {
    const errorMsg = `deleteCampaignApi (client): Invalid campaignId received: '${campaignId}'. Aborting delete.`;
    console.error(errorMsg);
    throw new Error(errorMsg);
  }
  console.log(`deleteCampaign (client): Deleting campaign ${campaignId} via ${API_BASE_URL}/campaigns/${campaignId}`);
  
  const response = await fetch(`${API_BASE_URL}/campaigns/${campaignId}`, {
    method: 'DELETE',
  });
  
  const responseText = await response.text(); 

  if (!response.ok) {
    let errorMessage = `Failed to delete campaign ${campaignId} (Status: ${response.status} ${response.statusText || 'Unknown Status'})`;
    let errorDetails: any = null;
    console.error(`deleteCampaign (client) for ${campaignId}: Error response text (first 500 chars):`, responseText.substring(0, 500));
    if (response.status === 504) {
        errorMessage = `Failed to delete campaign: The server took too long to respond (Gateway Timeout). Please try again later.`;
    } else {
        try {
            if (responseText && responseText.trim().startsWith('{') && responseText.trim().endsWith('}')) {
                const errorData = JSON.parse(responseText);
                errorMessage = errorData.message || `Failed to delete campaign ${campaignId}`;
                errorDetails = errorData.errors || errorData.details || errorData;
            } else if (responseText.toLowerCase().includes("<html")){
                 errorMessage = `Server returned an unexpected HTML error page (status: ${response.status}) while deleting campaign ${campaignId}.`;
            } else if (responseText) { 
                errorMessage = `Server error: ${responseText.substring(0, 200)}`; 
            }
        } catch (e) {
             // If parsing JSON fails, use the original generic message
        }
    }
    console.error(`deleteCampaign (client) for ${campaignId}: Throwing error:`, errorMessage, "Details:", errorDetails);
    const err = new Error(errorMessage);
    (err as any).details = errorDetails;
    throw err;
  }
  console.log(`deleteCampaign (client): Successfully deleted campaign ${campaignId}`);
}


const statusBadgeVariant = (status: Campaign['status']) => {
    switch (status) {
        case 'Sent': return 'bg-green-500 hover:bg-green-600 text-white';
        case 'Scheduled': return 'border-blue-500 text-blue-700 dark:text-blue-400';
        case 'Draft': return 'border-gray-500 text-gray-700 dark:text-gray-400';
        case 'Failed': return 'bg-red-500 hover:bg-red-600 text-white';
        case 'Archived': return 'bg-gray-600 hover:bg-gray-700 text-white';
        case 'Cancelled': return 'bg-orange-500 hover:bg-orange-600 text-white';
        default: return 'secondary';
    }
};

const operatorDisplayMap: Record<string, string> = {
  eq: '=',
  neq: '!=',
  gt: '>',
  lt: '<',
  gte: '>=',
  lte: '<=',
  contains: 'contains',
  startswith: 'starts with', 
  endswith: 'ends with', 
};

export default function CampaignDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { token } = useAuth();
  
  const campaignIdFromParams = params.campaignId as string | undefined;

  // Validate campaignIdFromParams before using it for queryKey or as enabled flag
  const getValidCampaignIdForQuery = (id: string | undefined): string | null => {
    if (typeof id === 'string' && id.trim() !== '' && id.toLowerCase() !== 'undefined') {
      return id;
    }
    return null;
  };

  const campaignIdForQuery = getValidCampaignIdForQuery(campaignIdFromParams);

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false); 

  const { data: campaign, isLoading, error, isError, isFetching } = useQuery<Campaign, Error>({
    queryKey: ['campaign', campaignIdForQuery], // Use validated ID or null for the key
    queryFn: async () => {
      if (!campaignIdForQuery) { 
        // This should ideally not be reached if 'enabled' is false, but serves as a safeguard.
        console.error("useQuery queryFn: campaignIdForQuery is null or invalid. Aborting fetch attempt.");
        throw new Error("Campaign ID is not available or invalid for fetching.");
      }
      return fetchCampaign(campaignIdForQuery, token);
    },
    enabled: !!campaignIdForQuery, // Query will only run if campaignIdForQuery is a valid string
    retry: (failureCount, err) => {
        // Don't retry for 404s or our specific invalid ID errors
        if (err.message.includes("404") || err.message.toLowerCase().includes("invalid campaign id")) {
          return false;
        }
        return failureCount < 2; // Retry up to 2 times for other errors
    },
  });

  const deleteMutation = useMutation<void, Error, void>({ // Specify types for mutation
    mutationFn: () => {
        if(!campaignIdForQuery) { // Use the validated ID
            return Promise.reject(new Error("Cannot delete campaign: ID is missing or invalid."));
        }
        return deleteCampaignApi(campaignIdForQuery, token);
    },
    onSuccess: () => {
      toast({
        title: "Campaign Deleted",
        description: `Campaign "${campaign?.name || 'Selected Campaign'}" has been successfully deleted.`,
      });
      queryClient.invalidateQueries({ queryKey: ['campaigns'] }); 
      router.push('/dashboard'); 
      setIsDeleteDialogOpen(false); 
    },
    onError: (error: Error) => {
      toast({
        title: "Error Deleting Campaign",
        description: error.message,
        variant: "destructive",
        duration: 8000,
      });
      setIsDeleteDialogOpen(false); 
    },
  });

  const handleDeleteCampaign = () => {
    if (campaignIdForQuery) { // Ensure campaignId is valid before mutating
      deleteMutation.mutate();
    } else {
        toast({ title: "Error", description: "Campaign ID is missing or invalid, cannot delete.", variant: "destructive"});
    }
  };

  // UI logic for invalid ID from URL, before query even attempts
  if (!isLoading && !isFetching && !campaignIdForQuery) {
    return (
      <AppLayout>
        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <UiAlertTitle>Invalid Campaign ID</UiAlertTitle>
          <AlertDescription>
            The campaign ID provided in the URL is invalid or missing. Please check the URL or go back.
          </AlertDescription>
        </Alert>
        <Button onClick={() => router.push('/dashboard')}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
        </Button>
      </AppLayout>
    );
  }


  if (isLoading) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-8 w-32 mb-4" />
          <div className="grid md:grid-cols-3 gap-6">
            <Skeleton className="h-40 rounded-lg" />
            <Skeleton className="h-40 rounded-lg" />
            <Skeleton className="h-40 rounded-lg" />
          </div>
          <Skeleton className="h-64 rounded-lg" />
          <Skeleton className="h-32 rounded-lg" />
        </div>
      </AppLayout>
    );
  }

  // This condition now correctly handles query errors or if the query ran but found no campaign
  if (isError || (!campaign && !isFetching && campaignIdForQuery)) { 
    return (
      <AppLayout>
        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <UiAlertTitle>Error Loading Campaign</UiAlertTitle>
          <AlertDescription>
            {(error as Error)?.message || "The campaign could not be found or an error occurred."}
          </AlertDescription>
        </Alert>
        <Button onClick={() => router.push('/dashboard')}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
        </Button>
      </AppLayout>
    );
  }
  
  // If campaign is still undefined after loading and no error, it's a strange state, render loading skeleton
  if (!campaign) { 
     return (
      <AppLayout>
        <div className="space-y-6"> 
          <Skeleton className="h-10 w-48" /> <Skeleton className="h-8 w-32 mb-4" />
          <div className="grid md:grid-cols-3 gap-6"> <Skeleton className="h-40 rounded-lg" /> <Skeleton className="h-40 rounded-lg" /> <Skeleton className="h-40 rounded-lg" /> </div>
          <Skeleton className="h-64 rounded-lg" /> <Skeleton className="h-32 rounded-lg" />
        </div>
      </AppLayout>
    );
  }


  const audienceSize = campaign.audienceSize || 0;
  const sentCount = campaign.sentCount || 0;
  const failedCount = campaign.failedCount || 0;
  const deliverySuccessRate = audienceSize > 0 ? (sentCount / audienceSize) * 100 : 0;

  return (
    <AppLayout>
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <Button variant="outline" size="sm" onClick={() => router.back()} className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">{campaign.name}</h1>
            <div className="flex items-center gap-2 mt-1">
                <Badge className={statusBadgeVariant(campaign.status)}>
                  {campaign.status === 'Cancelled' && <Ban className="mr-1.5 h-3.5 w-3.5" />}
                  {campaign.status}
                </Badge>
                <p className="text-sm text-muted-foreground">
                    Created: {format(new Date(campaign.createdAt), "PPpp")}
                </p>
                {campaign.updatedAt && (
                    <p className="text-sm text-muted-foreground">
                        | Last Updated: {format(new Date(campaign.updatedAt), "PPpp")}
                    </p>
                )}
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.push(`/campaigns/${campaignIdForQuery}/edit`)} disabled={deleteMutation.isPending || !campaignIdForQuery}>
                <Edit3 className="mr-2 h-4 w-4"/> Edit
            </Button>
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}> 
              <AlertDialogTrigger asChild>
                 <Button variant="destructive" disabled={deleteMutation.isPending || !campaignIdForQuery}>
                    <Trash2 className="mr-2 h-4 w-4"/> Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogPrimitiveTitle>Are you sure?</AlertDialogPrimitiveTitle> 
                  <AlertDialogPrimitiveDescription> 
                    This action cannot be undone. This will permanently delete the campaign
                    "{campaign.name}".
                  </AlertDialogPrimitiveDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={deleteMutation.isPending}>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeleteCampaign} disabled={deleteMutation.isPending}>
                    {deleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="shadow-md">
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center text-sm text-muted-foreground"><Users className="mr-2 h-4 w-4 text-primary" />Audience Size</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{audienceSize.toLocaleString()}</p>
            </CardContent>
          </Card>
          <Card className="shadow-md">
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center text-sm text-muted-foreground"><Target className="mr-2 h-4 w-4 text-primary" />Total Attempted</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{(sentCount + failedCount).toLocaleString()}</p>
            </CardContent>
          </Card>
          <Card className="shadow-md">
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center text-sm text-muted-foreground"><CheckCircle className="mr-2 h-4 w-4 text-green-500" />Successfully Sent</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{sentCount.toLocaleString()}</p>
            </CardContent>
          </Card>
          <Card className="shadow-md">
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center text-sm text-muted-foreground"><XCircle className="mr-2 h-4 w-4 text-red-500" />Failed Deliveries</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{failedCount.toLocaleString()}</p>
            </CardContent>
          </Card>
        </div>

        { (campaign.status === "Sent" || campaign.status === "Archived" || campaign.status === "Failed") && audienceSize > 0 && (
            <Card className="shadow-lg">
                <CardHeader>
                    <UiAlertTitle className="flex items-center gap-2 text-xl">
                        <BarChart className="h-6 w-6 text-primary" />
                        Delivery Performance
                    </UiAlertTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-muted-foreground">Success Rate</span>
                        <span className="text-sm font-semibold text-primary">{deliverySuccessRate.toFixed(1)}%</span>
                    </div>
                    <Progress value={deliverySuccessRate} className="w-full h-3 [&>div]:bg-primary" aria-label={`${deliverySuccessRate.toFixed(1)}% success rate`} />
                    <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                        <div>
                            <p className="text-xs text-muted-foreground">Targeted</p>
                            <p className="text-lg font-bold">{audienceSize.toLocaleString()}</p>
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">Succeeded</p>
                            <p className="text-lg font-bold text-green-600">{sentCount.toLocaleString()}</p>
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">Failed</p>
                            <p className="text-lg font-bold text-red-600">{failedCount.toLocaleString()}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        )}

        <div className="grid md:grid-cols-2 gap-6">
            <Card className="shadow-lg">
            <CardHeader>
                <UiAlertTitle className="flex items-center gap-2 text-xl">
                <MessageSquare className="h-6 w-6 text-primary" />
                Campaign Message
                </UiAlertTitle>
            </CardHeader>
            <CardContent>
                <p className="text-base whitespace-pre-wrap bg-muted/50 p-4 rounded-md">{campaign.message}</p>
            </CardContent>
            </Card>

            <Card className="shadow-lg">
            <CardHeader>
                <UiAlertTitle className="flex items-center gap-2 text-xl">
                <SlidersHorizontal className="h-6 w-6 text-primary" />
                Audience Segment: {campaign.segmentName || "Custom Rules"}
                </UiAlertTitle>
                <CardDescription>Logic: <span className="font-semibold">{campaign.ruleLogic}</span> between rules</CardDescription>
            </CardHeader>
            <CardContent>
                {campaign.rules.length > 0 ? (
                <ul className="space-y-3">
                    {campaign.rules.map((rule) => (
                    <li key={rule.id} className="p-3 border rounded-md bg-muted/50">
                        <span className="font-medium text-primary">{rule.field}</span>{' '}
                        <span className="text-muted-foreground font-mono">{operatorDisplayMap[rule.operator.toLowerCase()] || rule.operator}</span>{' '}
                        <span className="font-medium text-primary">{rule.value}</span>
                    </li>
                    ))}
                </ul>
                ) : (
                <p className="text-muted-foreground">No specific rules defined for this campaign.</p>
                )}
            </CardContent>
            </Card>
        </div>
      </div>
    </AppLayout>
  );
}

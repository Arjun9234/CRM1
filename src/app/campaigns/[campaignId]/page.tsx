"use client";

import AppLayout from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ArrowLeft, Users, CheckCircle, XCircle, Target, CalendarDays, MessageSquare, SlidersHorizontal, AlertTriangle, BarChart, Edit3, Trash2, Loader2, Ban } from "lucide-react";
import type { Campaign, SegmentRule } from "@/lib/types";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

async function fetchCampaign(campaignId: string): Promise<Campaign> {
  const response = await fetch(`/api/campaigns/${campaignId}`);
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || `Failed to fetch campaign ${campaignId}`);
  }
  return response.json();
}

async function deleteCampaign(campaignId: string): Promise<void> {
  const response = await fetch(`/api/campaigns/${campaignId}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || `Failed to delete campaign ${campaignId}`);
  }
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
  const campaignId = params.campaignId as string;
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const { data: campaign, isLoading, error, isError } = useQuery<Campaign>({
    queryKey: ['campaign', campaignId],
    queryFn: () => fetchCampaign(campaignId),
    enabled: !!campaignId, 
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCampaign,
    onSuccess: () => {
      toast({
        title: "Campaign Deleted",
        description: `Campaign "${campaign?.name}" has been successfully deleted.`,
      });
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      router.push('/dashboard');
    },
    onError: (error: Error) => {
      toast({
        title: "Error Deleting Campaign",
        description: error.message,
        variant: "destructive",
      });
      setIsDeleteDialogOpen(false);
    },
  });

  const handleDeleteCampaign = () => {
    if (campaignId) {
      deleteMutation.mutate(campaignId);
    }
  };

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

  if (isError || !campaign) {
    return (
      <AppLayout>
        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error Loading Campaign</AlertTitle>
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
            <Button variant="outline" onClick={() => router.push(`/campaigns/${campaignId}/edit`)} disabled={campaign.status === 'Sent' || campaign.status === 'Archived'}>
                <Edit3 className="mr-2 h-4 w-4"/> Edit
            </Button>
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
              <AlertDialogTrigger asChild>
                 <Button variant="destructive">
                    <Trash2 className="mr-2 h-4 w-4"/> Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the campaign
                    "{campaign.name}".
                  </AlertDialogDescription>
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
        
        {/* Key Metrics */}
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
                    <CardTitle className="flex items-center gap-2 text-xl">
                        <BarChart className="h-6 w-6 text-primary" />
                        Delivery Performance
                    </CardTitle>
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
            {/* Message Content */}
            <Card className="shadow-lg">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                <MessageSquare className="h-6 w-6 text-primary" />
                Campaign Message
                </CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-base whitespace-pre-wrap bg-muted/50 p-4 rounded-md">{campaign.message}</p>
            </CardContent>
            </Card>

            {/* Segment Details */}
            <Card className="shadow-lg">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                <SlidersHorizontal className="h-6 w-6 text-primary" />
                Audience Segment: {campaign.segmentName || "Custom Rules"}
                </CardTitle>
                <CardDescription>Logic: <span className="font-semibold">{campaign.ruleLogic}</span> between rules</CardDescription>
            </CardHeader>
            <CardContent>
                {campaign.rules.length > 0 ? (
                <ul className="space-y-3">
                    {campaign.rules.map((rule: SegmentRule) => (
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

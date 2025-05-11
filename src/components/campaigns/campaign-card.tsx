
"use client";

import type { Campaign } from "@/lib/types";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, CheckCircle, XCircle, Send, Target, CalendarDays } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

interface CampaignCardProps {
  campaign: Campaign;
}

export function CampaignCard({ campaign }: CampaignCardProps) {
  const audienceSize = campaign.audienceSize || 0;
  const sentCount = campaign.sentCount || 0;
  const failedCount = campaign.failedCount || 0;
  // If status is Scheduled or Draft, attempted should be 0 or audienceSize if pre-calculated
  // For 'Sent' or 'Failed' (terminal states for sending), attempted is usually audienceSize.
  // This logic depends on how `audienceSize` is populated vs actual send attempts.
  // Let's assume audienceSize is the target, and sentCount+failedCount reflect actuals for completed campaigns.
  const attemptedCount = (campaign.status === 'Sent' || campaign.status === 'Failed' || campaign.status === 'Archived') 
    ? audienceSize 
    : (campaign.status === 'Scheduled' ? audienceSize : 0);

  // Delivery success rate based on actuals if available, otherwise 0 or based on audience if scheduled.
  // More precise: success rate should be `sentCount / (sentCount + failedCount)` if those reflect all attempts.
  // Or `sentCount / audienceSize` if audienceSize is the total attempted.
  // Given current structure, `sentCount / audienceSize` for 'Sent' campaigns.
  const deliverySuccessRate = audienceSize > 0 ? (sentCount / audienceSize) * 100 : 0;

  return (
    <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col">
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle className="text-xl text-primary">{campaign.name}</CardTitle>
          <Badge 
            variant={
              campaign.status === 'Sent' ? 'default' : 
              campaign.status === 'Draft' ? 'secondary' : 
              campaign.status === 'Scheduled' ? 'outline' :
              'destructive'
            }
            className={
              campaign.status === 'Sent' ? 'bg-green-500 hover:bg-green-600 text-white' :
              campaign.status === 'Scheduled' ? 'border-blue-500 text-blue-700 dark:text-blue-400' :
              campaign.status === 'Draft' ? 'border-gray-500 text-gray-700 dark:text-gray-400' :
              campaign.status === 'Failed' ? 'bg-red-500 hover:bg-red-600 text-white' :
              campaign.status === 'Archived' ? 'bg-gray-600 hover:bg-gray-700 text-white' : ''
            }
          >
            {campaign.status}
          </Badge>
        </div>
        <CardDescription className="flex items-center text-xs text-muted-foreground">
            <CalendarDays className="mr-1 h-4 w-4" />
            Created: {campaign.createdAt ? format(new Date(campaign.createdAt), "PP") : 'N/A'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 flex-grow">
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-1">Segment</h4>
          <p className="text-sm">{campaign.segmentName || `Rules: ${campaign.rules.length}`}</p>
        </div>
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-1">Message</h4>
          <p className="text-sm italic line-clamp-2">"{campaign.message}"</p>
        </div>
        <div className="grid grid-cols-2 gap-4 pt-2">
          <div className="flex items-center space-x-2">
            <Users className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Audience</p>
              <p className="text-lg font-semibold">{audienceSize.toLocaleString()}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Target className="h-5 w-5 text-muted-foreground" /> 
            <div>
              <p className="text-xs text-muted-foreground">Attempted</p>
              {/* Attempted could be audienceSize or sum of sent+failed for past campaigns */}
              <p className="text-lg font-semibold">{attemptedCount.toLocaleString()}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <div>
              <p className="text-xs text-muted-foreground">Successful</p>
              <p className="text-lg font-semibold">{sentCount.toLocaleString()}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <XCircle className="h-5 w-5 text-red-500" />
            <div>
              <p className="text-xs text-muted-foreground">Failed</p>
              <p className="text-lg font-semibold">{failedCount.toLocaleString()}</p>
            </div>
          </div>
        </div>
        {(campaign.status === 'Sent' || campaign.status === 'Archived' || campaign.status === 'Failed') && audienceSize > 0 && (
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-1">Delivery Success Rate ({deliverySuccessRate.toFixed(1)}%)</h4>
            <Progress value={deliverySuccessRate} className="h-2 [&>div]:bg-primary" />
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button variant="link" className="text-primary p-0" disabled>View Details</Button> 
      </CardFooter>
    </Card>
  );
}


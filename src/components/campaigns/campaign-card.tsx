
"use client";

import type { Campaign } from "@/lib/types";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, CheckCircle, XCircle, Send, Target, CalendarDays, Eye, Ban } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import Link from "next/link";

interface CampaignCardProps {
  campaign: Campaign;
}

export function CampaignCard({ campaign }: CampaignCardProps) {
  const audienceSize = campaign.audienceSize || 0;
  const sentCount = campaign.sentCount || 0;
  const failedCount = campaign.failedCount || 0;

  const attemptedCount = (campaign.status === 'Sent' || campaign.status === 'Failed' || campaign.status === 'Archived' || campaign.status === 'Cancelled')
    ? audienceSize
    : (campaign.status === 'Scheduled' ? audienceSize : 0);

  const deliverySuccessRate = audienceSize > 0 ? (sentCount / audienceSize) * 100 : 0;

  let badgeVariant: "default" | "secondary" | "destructive" | "outline" = "default";
  let badgeClassName = "";

  switch (campaign.status) {
    case 'Sent':
      badgeClassName = 'bg-green-500 hover:bg-green-600 text-white';
      break;
    case 'Scheduled':
      badgeVariant = 'outline';
      badgeClassName = 'border-blue-500 text-blue-700 dark:text-blue-400';
      break;
    case 'Draft':
      badgeVariant = 'secondary';
      badgeClassName = 'border-gray-500 text-gray-700 dark:text-gray-400';
      break;
    case 'Failed':
      badgeVariant = 'destructive';
      badgeClassName = 'bg-red-500 hover:bg-red-600 text-white';
      break;
    case 'Archived':
      badgeClassName = 'bg-gray-600 hover:bg-gray-700 text-white';
      break;
    case 'Cancelled':
      badgeVariant = 'destructive'; // or 'default' with specific orange
      badgeClassName = 'bg-orange-500 hover:bg-orange-600 text-white';
      break;
    default:
      badgeVariant = 'secondary';
  }


  return (
    <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col">
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle className="text-xl text-primary">{campaign.name}</CardTitle>
          <Badge
            variant={badgeVariant}
            className={badgeClassName}
          >
            {campaign.status === 'Cancelled' && <Ban className="mr-1.5 h-3.5 w-3.5" />}
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
        {campaign && campaign.id && typeof campaign.id === 'string' && campaign.id.trim() !== '' ? (
          <Button asChild variant="link" className="text-primary p-0">
            <Link href={`/campaigns/${campaign.id}`}>
              <Eye className="mr-2 h-4 w-4" /> View Details
            </Link>
          </Button>
        ) : (
          <Button variant="link" className="text-muted-foreground p-0" disabled>
            <Eye className="mr-2 h-4 w-4" /> Details Unavailable
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

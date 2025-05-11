
"use client";

import type { Campaign } from "@/lib/types";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart, Users, CheckCircle, XCircle, Send } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface CampaignCardProps {
  campaign: Campaign;
}

export function CampaignCard({ campaign }: CampaignCardProps) {
  const deliveryRate = campaign.audienceSize > 0 ? (campaign.sentCount / campaign.audienceSize) * 100 : 0;
  const successRate = campaign.sentCount > 0 ? ((campaign.sentCount - campaign.failedCount) / campaign.sentCount) * 100 : 0;

  return (
    <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle className="text-xl text-primary">{campaign.name}</CardTitle>
          <Badge variant={campaign.status === 'Sent' ? 'default' : campaign.status === 'Draft' ? 'secondary' : 'destructive'}>
            {campaign.status}
          </Badge>
        </div>
        <CardDescription>Created: {new Date(campaign.createdAt).toLocaleDateString()}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-1">Segment</h4>
          <p className="text-sm">{campaign.segmentName || `Segment ID: ${campaign.segmentId}`}</p>
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
              <p className="text-lg font-semibold">{campaign.audienceSize.toLocaleString()}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Send className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Attempted</p>
              <p className="text-lg font-semibold">{campaign.sentCount.toLocaleString()}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <div>
              <p className="text-xs text-muted-foreground">Successful</p>
              <p className="text-lg font-semibold">{(campaign.sentCount - campaign.failedCount).toLocaleString()}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <XCircle className="h-5 w-5 text-red-500" />
            <div>
              <p className="text-xs text-muted-foreground">Failed</p>
              <p className="text-lg font-semibold">{campaign.failedCount.toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-1">Delivery Rate ({deliveryRate.toFixed(1)}%)</h4>
          <Progress value={deliveryRate} className="h-2" />
        </div>
         <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-1">Success Rate ({successRate.toFixed(1)}%)</h4>
          <Progress value={successRate} className="h-2 [&>div]:bg-green-500" />
        </div>
      </CardContent>
      <CardFooter>
        <Button variant="link" className="text-primary p-0">View Details</Button>
      </CardFooter>
    </Card>
  );
}
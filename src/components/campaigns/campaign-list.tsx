
"use client";

import type { Campaign } from "@/lib/types";
import { CampaignCard } from "./campaign-card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { PlusCircle, Info } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";


interface CampaignListProps {
  campaigns: Campaign[];
}

export function CampaignList({ campaigns }: CampaignListProps) {
  if (campaigns.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] text-center p-8 bg-card rounded-lg shadow-md">
        <Info className="h-16 w-16 text-primary mb-6" />
        <h2 className="text-2xl font-semibold mb-3">No Campaigns Yet</h2>
        <p className="text-muted-foreground mb-6 max-w-md">
          It looks like you haven't created any campaigns. Get started by defining an audience and launching your first targeted message.
        </p>
        <Link href="/campaigns/new" passHref>
          <Button size="lg">
            <PlusCircle className="mr-2 h-5 w-5" />
            Create Your First Campaign
          </Button>
        </Link>
      </div>
    );
  }

  // Sort campaigns by creation date, most recent first
  const sortedCampaigns = [...campaigns].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div className="space-y-6">
       <Alert>
        <BarChart className="h-4 w-4" />
        <AlertTitle>Campaign Performance Tip!</AlertTitle>
        <AlertDescription>
          Review your campaign stats regularly to optimize audience segments and message effectiveness.
          Higher delivery and success rates lead to better engagement!
        </AlertDescription>
      </Alert>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {sortedCampaigns.map((campaign) => (
          <CampaignCard key={campaign.id} campaign={campaign} />
        ))}
      </div>
    </div>
  );
}
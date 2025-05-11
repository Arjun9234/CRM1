
"use client";

import AppLayout from "@/components/layout/app-layout";
import { CampaignList } from "@/components/campaigns/campaign-list";
import type { Campaign } from "@/lib/types";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { PlusCircle } from "lucide-react";
import { useEffect, useState } from "react";

const CAMPAIGNS_STORAGE_KEY = 'miniature-genius-campaigns';

export default function DashboardPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const storedCampaigns = localStorage.getItem(CAMPAIGNS_STORAGE_KEY);
      if (storedCampaigns) {
        setCampaigns(JSON.parse(storedCampaigns));
      }
    } catch (error) {
      console.error("Failed to load campaigns from localStorage", error);
    } finally {
      setIsLoading(false);
    }
  }, []);


  if (isLoading) {
    // Basic loading state, could be replaced with Skeletons
    return (
      <AppLayout>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold tracking-tight">Campaign Dashboard</h1>
        </div>
        <p>Loading campaigns...</p>
      </AppLayout>
    );
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
      <CampaignList campaigns={campaigns} />
    </AppLayout>
  );
}
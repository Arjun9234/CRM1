
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Layers, Users, TrendingUp, MailCheck, BarChartIcon } from "lucide-react"; // Using Layers for campaigns, MailCheck for sent

interface KeyMetricsDisplayProps {
  totalCampaigns: number;
  totalAudienceTargeted: number;
  totalSuccessfullySent: number;
  overallSuccessRate: number; // Percentage
}

const MetricCard: React.FC<{ title: string; value: string; icon: React.ElementType; description: string }> = ({ title, value, icon: Icon, description }) => (
  <Card className="shadow-md hover:shadow-lg transition-shadow">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      <Icon className="h-5 w-5 text-primary" />
    </CardHeader>
    <CardContent>
      <div className="text-3xl font-bold text-foreground">{value}</div>
      <p className="text-xs text-muted-foreground pt-1">{description}</p>
    </CardContent>
  </Card>
);

export function KeyMetricsDisplay({ 
  totalCampaigns, 
  totalAudienceTargeted, 
  totalSuccessfullySent, 
  overallSuccessRate 
}: KeyMetricsDisplayProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
      <MetricCard 
        title="Total Campaigns" 
        value={totalCampaigns.toLocaleString()} 
        icon={Layers}
        description="Number of campaigns launched."
      />
      <MetricCard 
        title="Total Audience Targeted" 
        value={totalAudienceTargeted.toLocaleString()} 
        icon={Users}
        description="Cumulative reach across all campaigns."
      />
      <MetricCard 
        title="Messages Successfully Sent" 
        value={totalSuccessfullySent.toLocaleString()} 
        icon={MailCheck}
        description="Total messages delivered successfully."
      />
      <MetricCard 
        title="Overall Success Rate" 
        value={`${overallSuccessRate.toFixed(1)}%`} 
        icon={TrendingUp}
        description="Average delivery success across campaigns."
      />
    </div>
  );
}

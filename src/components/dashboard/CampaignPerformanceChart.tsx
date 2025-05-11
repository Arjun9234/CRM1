
"use client";

import type { Campaign } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from 'recharts';
import { ChartContainer, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { BarChartIcon, Info } from "lucide-react";

interface CampaignPerformanceChartProps {
  campaigns: Campaign[];
}

const chartConfig = {
  successRate: {
    label: "Success Rate (%)",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig;

export function CampaignPerformanceChart({ campaigns }: CampaignPerformanceChartProps) {
  const chartData = campaigns
    .slice(0, 7) // Take last 7 or fewer
    .map(campaign => ({
      name: campaign.name.length > 15 ? campaign.name.substring(0, 12) + "..." : campaign.name, // Shorten long names
      successRate: campaign.audienceSize > 0 ? (campaign.sentCount / campaign.audienceSize) * 100 : 0,
      campaignName: campaign.name, // Full name for tooltip
    }))
    .reverse(); // Show newest first if campaigns are sorted oldest to newest, or vice-versa

  if (chartData.length < 2) {
    return (
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChartIcon className="h-5 w-5 text-primary" />
            Recent Campaign Performance
          </CardTitle>
          <CardDescription>Success rates of your latest campaigns.</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px] flex flex-col items-center justify-center text-center">
          <Info className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Not enough campaign data to display chart.</p>
          <p className="text-xs text-muted-foreground">Launch at least two campaigns to see performance trends.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
         <BarChartIcon className="h-5 w-5 text-primary" />
         Recent Campaign Performance
        </CardTitle>
        <CardDescription>Success rates (%) of your latest campaigns.</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="min-h-[300px] w-full">
          <ResponsiveContainer width="100%" height={300}>
            <RechartsBarChart data={chartData} margin={{ top: 5, right: 0, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="name"
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${value}%`}
                domain={[0, 100]}
              />
              <Tooltip
                cursor={{ fill: 'hsl(var(--muted))', radius: 4 }}
                content={<ChartTooltipContent indicator="dot" nameKey="campaignName" labelKey="successRate" />}
              />
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
              <Bar dataKey="successRate" fill="var(--color-successRate)" radius={[4, 4, 0, 0]} name="Success Rate" unit="%" />
            </RechartsBarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

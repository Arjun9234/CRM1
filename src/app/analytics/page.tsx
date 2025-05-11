
"use client";
import AppLayout from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BarChart3, Users, LineChart, TrendingUp, Activity, Target, DollarSign, TrendingDown, Smile } from "lucide-react"; // Added DollarSign, TrendingDown, Smile
import { ResponsiveContainer, BarChart as RechartsBarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend, LineChart as RechartsLineChart, Line } from 'recharts';
import { ChartContainer, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { subMonths, format, subDays } from 'date-fns';

// Dummy data for charts
const customerAcquisitionData = Array.from({ length: 6 }, (_, i) => ({
  month: format(subMonths(new Date(), 5 - i), 'MMM'),
  customers: 15 + Math.floor(Math.random() * 50) + i * 5,
}));

const campaignEffectivenessData = [
  { name: 'Spring Sale', reach: 1200, conversion: 8 },
  { name: 'Welcome Email', reach: 500, conversion: 15 },
  { name: 'Re-engagement', reach: 800, conversion: 5 },
  { name: 'Holiday Promo', reach: 2000, conversion: 12 },
  { name: 'Q2 Newsletter', reach: 1500, conversion: 7 },
];

const customerEngagementData = Array.from({ length: 12 }, (_, i) => ({
  month: format(subMonths(new Date(), 11 - i), 'MMM yy'),
  score: 60 + Math.floor(Math.random() * 30) + Math.sin(i / 2) * 5, // Simulate some fluctuation
}));


const customerAcquisitionChartConfig = {
  customers: {
    label: "New Customers",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig;

const campaignEffectivenessChartConfig = {
  reach: { label: "Reach", color: "hsl(var(--chart-1))" },
  conversion: { label: "Conversion %", color: "hsl(var(--chart-2))" },
} satisfies ChartConfig;

const customerEngagementChartConfig = {
  score: {
    label: "Engagement Score",
    color: "hsl(var(--chart-3))",
  },
} satisfies ChartConfig;


export default function AnalyticsPage() {
  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
           <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Analytics Dashboard</h1>
        </div>

        {/* Key Metrics */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <Card className="shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Customers</CardTitle>
              <Users className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">1,234</div>
              <p className="text-xs text-muted-foreground">+10% from last month</p>
            </CardContent>
          </Card>
          <Card className="shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Avg. Order Value</CardTitle>
              <TrendingUp className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹2,850.50</div>
              <p className="text-xs text-muted-foreground">+5.2% from last month</p>
            </CardContent>
          </Card>
          <Card className="shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active Campaigns</CardTitle>
              <Target className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">5</div>
              <p className="text-xs text-muted-foreground">2 scheduled, 3 ongoing</p>
            </CardContent>
          </Card>
           <Card className="shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Customer Activity</CardTitle>
              <Activity className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">78%</div>
              <p className="text-xs text-muted-foreground">Active in last 30 days</p>
            </CardContent>
          </Card>
          <Card className="shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Avg. LTV</CardTitle>
              <DollarSign className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹12,350</div>
              <p className="text-xs text-muted-foreground">Estimated Customer Lifetime Value</p>
            </CardContent>
          </Card>
          <Card className="shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Churn Rate</CardTitle>
              <TrendingDown className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">3.5%</div>
              <p className="text-xs text-muted-foreground">Monthly customer churn</p>
            </CardContent>
          </Card>
        </div>
        
        {/* Charts Section */}
        <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <LineChart className="h-5 w-5 text-primary" />
                Customer Acquisition Trend
              </CardTitle>
              <CardDescription>New customers acquired over the last 6 months.</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={customerAcquisitionChartConfig} className="min-h-[250px] w-full">
                <RechartsLineChart data={customerAcquisitionData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis tickLine={false} axisLine={false} stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip content={<ChartTooltipContent indicator="dot" />} />
                  <Legend />
                  <Line type="monotone" dataKey="customers" stroke="var(--color-customers)" strokeWidth={2} dot={{ r: 4, fill: "var(--color-customers)" }} activeDot={{ r: 6 }} />
                </RechartsLineChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <BarChart3 className="h-5 w-5 text-primary" />
                Campaign Effectiveness (Mock)
              </CardTitle>
              <CardDescription>Reach vs. Conversion Rate for recent campaigns.</CardDescription>
            </CardHeader>
            <CardContent>
             <ChartContainer config={campaignEffectivenessChartConfig} className="min-h-[250px] w-full">
                <RechartsBarChart data={campaignEffectivenessData} margin={{ top: 5, right: 10, left: -20, bottom: 20 /* Increased bottom margin */ }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tickLine={false} axisLine={false} stroke="hsl(var(--muted-foreground))" fontSize={12} angle={-25} textAnchor="end" height={50} interval={0}/>
                  <YAxis yAxisId="left" orientation="left" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis yAxisId="right" orientation="right" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}%`} />
                  <Tooltip content={<ChartTooltipContent />} />
                  <Legend />
                  <Bar yAxisId="left" dataKey="reach" fill="var(--color-reach)" radius={[4, 4, 0, 0]} />
                  <Bar yAxisId="right" dataKey="conversion" fill="var(--color-conversion)" radius={[4, 4, 0, 0]} />
                </RechartsBarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-1">
            <Card className="shadow-lg">
                <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                    <Smile className="h-5 w-5 text-primary" />
                    Customer Engagement Score Trend
                </CardTitle>
                <CardDescription>Monthly average customer engagement score over the last year.</CardDescription>
                </CardHeader>
                <CardContent>
                <ChartContainer config={customerEngagementChartConfig} className="min-h-[250px] w-full">
                    <RechartsLineChart data={customerEngagementData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="month" tickLine={false} axisLine={false} stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis tickLine={false} axisLine={false} stroke="hsl(var(--muted-foreground))" fontSize={12} domain={[0, 100]} />
                    <Tooltip content={<ChartTooltipContent indicator="dot" />} />
                    <Legend />
                    <Line type="monotone" dataKey="score" stroke="var(--color-score)" strokeWidth={2} dot={{ r: 4, fill: "var(--color-score)" }} activeDot={{ r: 6 }} />
                    </RechartsLineChart>
                </ChartContainer>
                </CardContent>
            </Card>
        </div>


        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <BarChart3 className="h-6 w-6 text-primary" />
              Advanced Analytics & Reporting
            </CardTitle>
            <CardDescription>
              More detailed reports and customizable dashboards are on the way.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center text-center p-10 border-2 border-dashed rounded-lg bg-muted/20 min-h-[200px]">
              <BarChart3 className="h-16 w-16 text-muted-foreground mb-4" />
              <h2 className="text-2xl font-semibold text-muted-foreground">Deeper Insights Coming Soon!</h2>
              <p className="text-muted-foreground mt-2 max-w-md">
                We're developing advanced reporting features to help you track segment performance, LTV, churn rates, and much more.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}

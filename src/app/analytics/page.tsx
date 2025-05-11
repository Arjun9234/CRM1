
import AppLayout from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";

export default function AnalyticsPage() {
  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
           <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Analytics</h1>
        </div>
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <BarChart3 className="h-6 w-6 text-primary" />
              Campaign & Customer Analytics
            </CardTitle>
            <CardDescription>
              Dive deep into your data with insightful charts, reports, and performance metrics.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center text-center p-10 border-2 border-dashed rounded-lg bg-muted/20 min-h-[300px]">
              <BarChart3 className="h-16 w-16 text-muted-foreground mb-4" />
              <h2 className="text-2xl font-semibold text-muted-foreground">Advanced Analytics Coming Soon!</h2>
              <p className="text-muted-foreground mt-2 max-w-md">
                Get ready for powerful data visualizations to track your CRM performance, customer trends, and campaign effectiveness.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}

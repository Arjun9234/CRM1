
"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { generateMarketingTips, type GenerateMarketingTipsOutput } from "@/ai/flows/generate-marketing-tips";
import { Lightbulb, Zap } from "lucide-react"; // Zap for AI/Genkit icon
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";


export function MarketingTipsWidget() {
  const [tips, setTips] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTips() {
      setIsLoading(true);
      setError(null);
      try {
        const result: GenerateMarketingTipsOutput = await generateMarketingTips({ count: 3 });
        setTips(result.tips);
      } catch (err) {
        console.error("Failed to generate marketing tips:", err);
        setError("Could not load marketing tips at this time.");
      } finally {
        setIsLoading(false);
      }
    }
    fetchTips();
  }, []);

  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-primary" />
          AI Marketing Tips
        </CardTitle>
        <CardDescription>Boost your campaigns with these AI-powered suggestions.</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading && (
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <Skeleton className="h-5 w-5 rounded-full" />
              <Skeleton className="h-4 w-4/5" />
            </div>
            <div className="flex items-center space-x-3">
              <Skeleton className="h-5 w-5 rounded-full" />
              <Skeleton className="h-4 w-3/5" />
            </div>
            <div className="flex items-center space-x-3">
              <Skeleton className="h-5 w-5 rounded-full" />
              <Skeleton className="h-4 w-4/5" />
            </div>
          </div>
        )}
        {!isLoading && error && (
          <Alert variant="destructive">
             <Zap className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {!isLoading && !error && tips.length > 0 && (
          <ul className="space-y-3">
            {tips.map((tip, index) => (
              <li key={index} className="flex items-start gap-3">
                <Zap className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-1" />
                <p className="text-sm text-foreground">{tip}</p>
              </li>
            ))}
          </ul>
        )}
         {!isLoading && !error && tips.length === 0 && (
           <p className="text-sm text-muted-foreground">No tips available at the moment.</p>
         )}
      </CardContent>
    </Card>
  );
}

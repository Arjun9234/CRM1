
"use client";

import { Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect, useState } from "react";
import type { SegmentRule } from "@/lib/types";

interface AudiencePreviewProps {
  rules: SegmentRule[]; // Audience size could depend on these rules
  logic: 'AND' | 'OR';
  isCalculating: boolean;
}

export function AudiencePreview({ rules, logic, isCalculating }: AudiencePreviewProps) {
  const [audienceSize, setAudienceSize] = useState<number | null>(null);

  useEffect(() => {
    // Simulate audience calculation based on rules
    // This is a mock calculation
    if (rules.length > 0) {
        const mockSize = Math.floor(Math.random() * 5000) + 100; // Random size between 100 and 5100
        // Add a small delay to simulate calculation
        const timeoutId = setTimeout(() => {
             setAudienceSize(mockSize);
        }, 750);
        return () => clearTimeout(timeoutId);
    } else {
        setAudienceSize(0); // No rules, no audience
    }
  }, [rules, logic]); // Recalculate if rules or logic change

  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Users className="h-5 w-5 text-primary" />
          Audience Preview
        </CardTitle>
      </CardHeader>
      <CardContent className="text-center">
        {isCalculating || audienceSize === null ? (
          <div className="space-y-2">
            <Skeleton className="h-8 w-24 mx-auto" />
            <Skeleton className="h-4 w-32 mx-auto" />
          </div>
        ) : (
          <>
            <p className="text-4xl font-bold text-primary">{audienceSize.toLocaleString()}</p>
            <p className="text-sm text-muted-foreground">Estimated users in segment</p>
          </>
        )}
      </CardContent>
    </Card>
  );
}
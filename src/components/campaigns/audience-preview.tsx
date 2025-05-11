
"use client";

import { Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect, useState } from "react";
import type { SegmentRule } from "@/lib/types";

interface AudiencePreviewProps {
  rules: SegmentRule[];
  logic: 'AND' | 'OR';
  isCalculating: boolean; // This prop might be for external loading state control
  onAudienceSizeChange: (size: number) => void; // Callback to parent
}

export function AudiencePreview({ rules, logic, isCalculating, onAudienceSizeChange }: AudiencePreviewProps) {
  const [displayAudienceSize, setDisplayAudienceSize] = useState<number | null>(null);
  const [internalIsCalculating, setInternalIsCalculating] = useState(false);

  useEffect(() => {
    setInternalIsCalculating(true);
    setDisplayAudienceSize(null); // Reset while calculating

    // Simulate audience calculation based on rules
    // This is a mock calculation; in a real app, this might be an API call.
    const timeoutId = setTimeout(() => {
      let mockSize = 0;
      if (rules.length > 0) {
        // Very basic mock: more rules or specific rule content could influence size
        mockSize = 50 + Math.floor(Math.random() * (rules.length * 150 + (logic === 'OR' ? 500 : 100)));
      }
      setDisplayAudienceSize(mockSize);
      onAudienceSizeChange(mockSize); // Notify parent
      setInternalIsCalculating(false);
    }, 750); // Simulate calculation delay

    return () => clearTimeout(timeoutId);
  }, [rules, logic, onAudienceSizeChange]);

  const showSkeleton = isCalculating || internalIsCalculating || displayAudienceSize === null;

  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Users className="h-5 w-5 text-primary" />
          Audience Preview
        </CardTitle>
      </CardHeader>
      <CardContent className="text-center">
        {showSkeleton ? (
          <div className="space-y-2">
            <Skeleton className="h-8 w-24 mx-auto" />
            <Skeleton className="h-4 w-32 mx-auto" />
          </div>
        ) : (
          <>
            <p className="text-4xl font-bold text-primary">{displayAudienceSize.toLocaleString()}</p>
            <p className="text-sm text-muted-foreground">Estimated users in segment</p>
          </>
        )}
      </CardContent>
    </Card>
  );
}

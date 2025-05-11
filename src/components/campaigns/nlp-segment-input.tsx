
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Wand2, Brain } from "lucide-react";
import { naturalLanguageToSegment, type NaturalLanguageToSegmentInput } from '@/ai/flows/natural-language-to-segment';
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";


interface NlpSegmentInputProps {
  onSegmentRuleGenerated: (ruleText: string) => void;
}

export function NlpSegmentInput({ onSegmentRuleGenerated }: NlpSegmentInputProps) {
  const [prompt, setPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [generatedRule, setGeneratedRule] = useState<string | null>(null);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!prompt.trim()) {
      toast({
        title: "Empty Prompt",
        description: "Please enter a description for your segment.",
        variant: "destructive",
      });
      return;
    }
    setIsLoading(true);
    setGeneratedRule(null);
    try {
      const input: NaturalLanguageToSegmentInput = { naturalLanguage: prompt };
      const result = await naturalLanguageToSegment(input);
      if (result.segmentRule) {
        setGeneratedRule(result.segmentRule);
        // Automatically call onSegmentRuleGenerated or let user confirm?
        // For now, display it and let user manually use it or copy it.
        // onSegmentRuleGenerated(result.segmentRule); 
        toast({
          title: "Segment Rule Suggested",
          description: "AI has suggested a rule based on your prompt.",
        });
      } else {
         toast({
          title: "AI Suggestion Failed",
          description: "Could not generate a rule. Please try rephrasing your prompt.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error generating segment rule:", error);
      toast({
        title: "Error",
        description: "An error occurred while generating the segment rule.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Brain className="h-6 w-6 text-primary" /> AI-Powered Segment Creation</CardTitle>
        <CardDescription>
          Describe your target audience in plain language, and let AI suggest the rules.
          For example: "Customers who spent over $100 in the last 30 days but haven't visited in the last week."
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="nlp-prompt">Describe your audience:</Label>
          <Textarea
            id="nlp-prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g., users inactive for 90 days AND made at least 3 purchases"
            rows={3}
            disabled={isLoading}
          />
        </div>
        <Button onClick={handleSubmit} disabled={isLoading} className="w-full sm:w-auto">
          <Wand2 className="mr-2 h-4 w-4" />
          {isLoading ? "Generating..." : "Suggest Rules with AI"}
        </Button>
        {generatedRule && (
          <Alert>
            <Wand2 className="h-4 w-4" />
            <AlertTitle>AI Suggested Rule Logic:</AlertTitle>
            <AlertDescription className="font-mono bg-muted p-2 rounded-md text-sm overflow-x-auto">
              {generatedRule}
            </AlertDescription>
            <Button variant="link" size="sm" className="mt-2 p-0 h-auto" onClick={() => {
              navigator.clipboard.writeText(generatedRule);
              toast({ title: "Copied!", description: "Rule logic copied to clipboard."});
            }}>Copy to clipboard</Button>
             <Button variant="link" size="sm" className="mt-2 p-0 h-auto ml-2" onClick={() => onSegmentRuleGenerated(generatedRule)}>
              Use this rule (experimental)
            </Button>
          </Alert>
        )}
      </CardContent>
       <CardFooter>
        <p className="text-xs text-muted-foreground">
          Note: AI-generated rules are suggestions and may require manual adjustment in the Rule Builder below for precise targeting.
        </p>
      </CardFooter>
    </Card>
  );
}
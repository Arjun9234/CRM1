
"use client";

import type { CampaignCreationPayload, SegmentRule, Campaign } from "@/lib/types";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { RuleBuilder } from "./rule-builder";
import { NlpSegmentInput } from "./nlp-segment-input";
import { AudiencePreview } from "./audience-preview";
import { useToast } from "@/hooks/use-toast";
import { Save, Wand2, Send, RotateCcw, Loader2 } from "lucide-react";
import { generateMessageSuggestions } from "@/ai/flows/ai-driven-message-suggestions";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useMutation, useQueryClient } from '@tanstack/react-query';

async function createCampaign(payload: CampaignCreationPayload): Promise<Campaign> {
  const response = await fetch('/api/campaigns', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    let errorPayload: { message: string } = { message: `Failed to create campaign (status: ${response.status})` };
    try {
      const parsedError = await response.json();
      // API returns { message: "Failed to create campaign", error: "details" } 
      // OR { message: "Invalid campaign data", errors: ZodFieldErrors }
      if (parsedError.message && parsedError.error) { 
        errorPayload.message = `API Error: ${parsedError.message} - ${parsedError.error}`;
      } else if (parsedError.message && parsedError.errors) { 
        // Flatten Zod errors for better readability if possible, or stringify
        const errorDetails = Object.entries(parsedError.errors)
            .map(([field, messages]) => `${field}: ${(messages as string[]).join(', ')}`)
            .join('; ');
        errorPayload.message = `Invalid data: ${parsedError.message}. Details: ${errorDetails}`;
      } else if (parsedError.message) {
        errorPayload.message = parsedError.message;
      }
    } catch (e) {
      // Non-JSON response
      const errorText = await response.text();
      console.error("Server returned non-JSON error response:", response.status, errorText);
      errorPayload.message = `Server error ${response.status}. Response: ${errorText.substring(0,100)}... See console for full details.`;
    }
    throw new Error(errorPayload.message);
  }

  try {
    return await response.json();
  } catch (e) {
    console.error("Server returned OK, but with non-JSON success response:", response.status, await response.text());
    throw new Error("Received an invalid success response from the server.");
  }
}

const symbolToShortCodeMap: Record<string, string> = {
  '=': 'eq',
  '==': 'eq',
  '!=': 'neq',
  '<>' : 'neq',
  '>': 'gt',
  '<': 'lt',
  '>=': 'gte',
  '<=': 'lte',
  'contains': 'contains',
  'startsWith': 'startsWith', 
  'endsWith': 'endsWith',   
};


export function CreateCampaignForm() {
  const [campaignName, setCampaignName] = useState("");
  const [segmentName, setSegmentName] = useState("");
  const [rules, setRules] = useState<SegmentRule[]>([]);
  const [ruleLogic, setRuleLogic] = useState<'AND' | 'OR'>('AND');
  const [message, setMessage] = useState("");
  const [isSuggestingMessage, setIsSuggestingMessage] = useState(false);
  const [messageSuggestions, setMessageSuggestions] = useState<string[]>([]);
  const [audienceSize, setAudienceSize] = useState(0); // Track estimated audience size

  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: createCampaign,
    onSuccess: (data: Campaign) => { 
      toast({
        title: "Campaign Created!",
        description: `${data.name || campaignName} has been successfully scheduled.`,
      });
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      // It's good practice to also invalidate the specific campaign query if you have one for its detail page
      queryClient.invalidateQueries({ queryKey: ['campaign', data.id] }); 
      router.push("/dashboard");
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Create Campaign",
        description: error.message, // This will now have more details from the createCampaign function
        variant: "destructive",
        duration: 7000, // Longer duration for detailed errors
      });
    },
  });

  const handleNlpRuleGenerated = (ruleText: string) => {
    // More robust parsing for operators like >=, <=, !=
    const parts = ruleText.match(/(\w+)\s*([<>=!≤≥≠]+|contains|starts_with|endswith|startsWith|endsWith)\s*(.+)/i);
    if (parts && parts.length === 4) {
        const rawOperator = parts[2].trim().toLowerCase();
        // Normalize common symbols to short codes
        const operatorMapping: Record<string, string> = {
            ...symbolToShortCodeMap,
            '≤': 'lte',
            '≥': 'gte',
            '≠': 'neq',
            // ensure client-side parsing consistency
            'starts_with': 'startsWith', 
            'ends_with': 'endsWith',
        };
        const shortCodeOperator = operatorMapping[rawOperator] || rawOperator;


        const newRule: SegmentRule = {
            id: Date.now().toString(),
            field: parts[1].trim(),
            operator: shortCodeOperator,
            value: parts[3].trim().replace(/^['"]|['"]$/g, ''),
        };
        setRules(prevRules => [...prevRules, newRule]);
        toast({ title: "Rule Added", description: "AI suggested rule has been added to the builder." });
    } else {
        toast({ title: "Could not parse rule", description: `The AI suggested rule format ("${ruleText}") was not recognized. Please add manually.`, variant: "destructive", duration: 7000 });
    }
  };

  const handleGenerateMessageSuggestions = async () => {
    if (!campaignName.trim()) {
      toast({ title: "Campaign Objective Needed", description: "Please enter a campaign name (as objective) to generate message suggestions.", variant: "destructive"});
      return;
    }
    setIsSuggestingMessage(true);
    setMessageSuggestions([]);
    try {
      const result = await generateMessageSuggestions({ campaignObjective: campaignName });
      if (result.suggestions && result.suggestions.length > 0) {
        setMessageSuggestions(result.suggestions);
        toast({ title: "Message Suggestions Generated!" });
      } else {
        toast({ title: "No Suggestions", description: "AI couldn't generate suggestions for this objective.", variant: "default" });
      }
    } catch (error) {
      console.error("Error generating message suggestions:", error);
      toast({ title: "AI Error", description: "Failed to get message suggestions.", variant: "destructive" });
    } finally {
      setIsSuggestingMessage(false);
    }
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!campaignName || !segmentName || rules.length === 0 || !message) {
      toast({
        title: "Missing Information",
        description: "Please fill all campaign details, define at least one segment rule, and write a message.",
        variant: "destructive",
      });
      return;
    }

    const newCampaignPayload: CampaignCreationPayload = {
      name: campaignName,
      segmentName: segmentName,
      rules: rules, 
      ruleLogic: ruleLogic,
      message: message,
      status: "Scheduled", 
      audienceSize: audienceSize, 
    };
    
    mutation.mutate(newCampaignPayload);
  };
  

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Campaign Details</CardTitle>
          <CardDescription>Set up the name and message for your new campaign.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="campaignName">Campaign Name / Objective</Label>
            <Input
              id="campaignName"
              value={campaignName}
              onChange={(e) => setCampaignName(e.target.value)}
              placeholder="e.g., Summer Sale Promotion, Win-back Inactive Users"
              required
              disabled={mutation.isPending}
            />
          </div>
          <div>
            <div className="flex justify-between items-center mb-1">
              <Label htmlFor="message">Message</Label>
              <Button type="button" variant="outline" size="sm" onClick={handleGenerateMessageSuggestions} disabled={isSuggestingMessage || mutation.isPending}>
                {isSuggestingMessage ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Wand2 className="mr-2 h-4 w-4"/>}
                {isSuggestingMessage ? "Suggesting..." : "Suggest with AI"}
              </Button>
            </div>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="e.g., Hi {customer_name}, here’s 10% off on your next order!"
              rows={4}
              required
              disabled={mutation.isPending}
            />
             {messageSuggestions.length > 0 && (
              <div className="mt-2 space-y-2">
                <Label className="text-sm text-muted-foreground">AI Suggestions:</Label>
                 <Select onValueChange={(value) => setMessage(value)} disabled={mutation.isPending}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a suggestion" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Message Variants</SelectLabel>
                      {messageSuggestions.map((suggestion, index) => (
                        <SelectItem key={index} value={suggestion}>
                          {suggestion.length > 100 ? suggestion.substring(0,97) + "..." : suggestion}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <NlpSegmentInput onSegmentRuleGenerated={handleNlpRuleGenerated} />
      
      <RuleBuilder rules={rules} onRulesChange={setRules} logic={ruleLogic} onLogicChange={setRuleLogic} disabled={mutation.isPending} />

      <div>
        <Label htmlFor="segmentName">Segment Name</Label>
        <Input
            id="segmentName"
            value={segmentName}
            onChange={(e) => setSegmentName(e.target.value)}
            placeholder="e.g., High Value Customers, Recent Signups"
            required
            className="mt-1"
            disabled={mutation.isPending}
        />
      </div>

      <AudiencePreview rules={rules} logic={ruleLogic} isCalculating={false} onAudienceSizeChange={setAudienceSize}/>

      <CardFooter className="flex flex-col sm:flex-row justify-end gap-3 p-0 pt-6">
        <Button type="button" variant="outline" onClick={() => router.push("/dashboard")} disabled={mutation.isPending}>
          Cancel
        </Button>
        <Button type="submit" disabled={mutation.isPending || rules.length === 0} className="w-full sm:w-auto">
          {mutation.isPending ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Scheduling...</>
          ) : (
            <><Send className="mr-2 h-4 w-4" /> Schedule Campaign</>
          )}
        </Button>
      </CardFooter>
    </form>
  );
}

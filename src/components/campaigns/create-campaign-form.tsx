
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
    let errorMessage = `Failed to create campaign (status: ${response.status} ${response.statusText || 'Unknown Status Text'})`;
    let errorBodyText = "";

    try {
      errorBodyText = await response.text();
      const contentType = response.headers.get("content-type");

      if (contentType && contentType.includes("application/json")) {
        const errorData = JSON.parse(errorBodyText);
        errorMessage = errorData.message || errorData.error || (typeof errorData === 'string' ? errorData : errorMessage);
        if (errorData.errors) {
          const errorDetails = Object.entries(errorData.errors)
            .map(([field, messages]) => `${field}: ${(messages as string[]).join(', ')}`)
            .join('; ');
          errorMessage = `Invalid data: ${errorMessage}. Details: ${errorDetails}`;
        }
      } else if (errorBodyText.toLowerCase().includes("<html")) {
        errorMessage = `Server returned an unexpected HTML error page (status: ${response.status}). This usually indicates a server-side problem or misconfiguration. Please check server logs.`;
        console.error("Full HTML error response from server (Create Campaign):", errorBodyText.substring(0, 1000)); // Log a snippet
      } else if (errorBodyText) {
        errorMessage = `Server error (status: ${response.status}). Response: ${errorBodyText.substring(0, 200)}`;
      }
    } catch (e) {
      console.warn("Error processing/parsing error response body during campaign creation. Status:", response.status, e);
      if (errorBodyText.toLowerCase().includes("<html")) {
         errorMessage = `Server returned an unparsable HTML error (status: ${response.status}). Check server logs.`;
      } else if (errorBodyText) {
         errorMessage = `Failed to parse error response (status: ${response.status}). Raw response preview: ${errorBodyText.substring(0,100)}`;
      } else {
         errorMessage = `Failed to create campaign (status: ${response.status} ${response.statusText || 'Unknown Status Text'}). Could not retrieve detailed error message.`;
      }
    }
    
    console.error("--- Create Campaign API Error Details (Frontend) ---");
    console.error("Status:", response.status);
    console.error("StatusText:", response.statusText || "Unknown Status Text");
    console.error("Final Error Message to be Thrown:", errorMessage);
    if (!errorBodyText.toLowerCase().includes("<html")) { 
        console.error("Error Body Preview (if not HTML):", errorBodyText.substring(0, 500));
    }
    console.error("--- End of Create Campaign Error Details (Frontend) ---");

    throw new Error(errorMessage);
  }

  try {
    return await response.json();
  } catch (e) {
    const responseBodyForDebug = await response.text().catch(() => "Could not read response body again.");
    console.error("Server returned OK (e.g. 201), but with non-JSON success response during campaign creation:", response.status, "Body:", responseBodyForDebug, e);
    throw new Error("Received an invalid success response format from the server after campaign creation.");
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
  'endswith': 'endsWith',   
};

const campaignStatuses: Campaign['status'][] = ['Draft', 'Scheduled', 'Sent', 'Archived', 'Cancelled', 'Failed'];


export function CreateCampaignForm() {
  const [campaignName, setCampaignName] = useState("");
  const [segmentName, setSegmentName] = useState("");
  const [rules, setRules] = useState<SegmentRule[]>([]);
  const [ruleLogic, setRuleLogic] = useState<'AND' | 'OR'>('AND');
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<Campaign['status']>('Draft');
  const [isSuggestingMessage, setIsSuggestingMessage] = useState(false);
  const [messageSuggestions, setMessageSuggestions] = useState<string[]>([]);
  const [audienceSize, setAudienceSize] = useState(0); 

  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: createCampaign,
    onSuccess: (data: Campaign) => { 
      toast({
        title: "Campaign Created!",
        description: `Campaign "${data.name || campaignName}" successfully added with status: ${data.status}.`,
      });
      queryClient.invalidateQueries({ queryKey: ['campaigns'] }); 
      router.push("/dashboard");
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Create Campaign",
        description: error.message, 
        variant: "destructive",
        duration: 10000, 
      });
    },
  });

  const handleNlpRuleGenerated = (ruleText: string) => {
    const parts = ruleText.match(/(\w+)\s*([<>=!≤≥≠]+|contains|starts_with|endswith|startsWith|endsWith)\s*(.+)/i);
    if (parts && parts.length === 4) {
        const rawOperator = parts[2].trim().toLowerCase();
        const operatorMapping: Record<string, string> = {
            ...symbolToShortCodeMap,
            '≤': 'lte',
            '≥': 'gte',
            '≠': 'neq',
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
    if (!campaignName || !message) { 
      toast({
        title: "Missing Information",
        description: "Campaign Name and Message are required.",
        variant: "destructive",
      });
      return;
    }
     if (rules.length === 0) {
      toast({
        title: "No Audience Defined",
        description: "Please add at least one segment rule or use AI to suggest rules.",
        variant: "destructive",
      });
      return;
    }

    const newCampaignPayload: CampaignCreationPayload = {
      name: campaignName,
      ...(segmentName && { segmentName }), 
      rules: rules, 
      ruleLogic: ruleLogic,
      message: message,
      status: status, 
      audienceSize: audienceSize, 
    };
    
    mutation.mutate(newCampaignPayload);
  };
  

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Campaign Details</CardTitle>
          <CardDescription>Set up the name, message, and status for your new campaign.</CardDescription>
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
          <div>
            <Label htmlFor="status">Campaign Status</Label>
            <Select value={status} onValueChange={(value: Campaign['status']) => setStatus(value)} disabled={mutation.isPending}>
              <SelectTrigger id="status" className="w-full">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {campaignStatuses.map(s => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <NlpSegmentInput onSegmentRuleGenerated={handleNlpRuleGenerated} />
      
      <RuleBuilder rules={rules} onRulesChange={setRules} logic={ruleLogic} onLogicChange={setRuleLogic} disabled={mutation.isPending} />

      <div>
        <Label htmlFor="segmentName">Segment Name (Optional)</Label>
        <Input
            id="segmentName"
            value={segmentName}
            onChange={(e) => setSegmentName(e.target.value)}
            placeholder="e.g., High Value Customers, Recent Signups"
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
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating...</>
          ) : (
            <><Send className="mr-2 h-4 w-4" /> Create Campaign</>
          )}
        </Button>
      </CardFooter>
    </form>
  );
}

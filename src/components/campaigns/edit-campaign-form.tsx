"use client";

import type { Campaign, CampaignUpdatePayload, SegmentRule } from "@/lib/types";
import { useState, useEffect } from "react";
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
import { Save, Wand2, Loader2 } from "lucide-react";
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
import { useAuth } from "@/hooks/use-auth";
import { API_BASE_URL } from '@/lib/config'; // Changed to use centralized API_BASE_URL

async function updateCampaign(campaignId: string, payload: CampaignUpdatePayload, token: string | null): Promise<Campaign> {
  console.log(`updateCampaign (client): Initiating PUT to ${API_BASE_URL}/campaigns/${campaignId} with payload (first 300 chars):`, JSON.stringify(payload).substring(0,300) + "...");
  
  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  // if (token) {
  //   headers['x-auth-token'] = token;
  // }
  
  const response = await fetch(`${API_BASE_URL}/campaigns/${campaignId}`, {
    method: 'PUT',
    headers: headers,
    body: JSON.stringify(payload),
  });

  const responseBodyText = await response.text();

  if (!response.ok) {
    let errorMessage = `Failed to update campaign (status: ${response.status} ${response.statusText || 'Unknown Status Text'})`;
    let errorDetails: any = null;
    let isHtmlError = false;

    try {
      if (responseBodyText.trim().startsWith("<html")) {
         isHtmlError = true;
      } else {
        const errorData = JSON.parse(responseBodyText);
        errorMessage = errorData.message || errorData.error || errorMessage;
        errorDetails = errorData.errors || errorData.details || errorData;
        if (errorDetails && typeof errorDetails !== 'object') errorDetails = { info: errorDetails };
      }
    } catch (e) {
      console.warn(`updateCampaign (client): API error response for campaign ${campaignId} was not JSON and not HTML. Status:`, response.status, "Body preview:", responseBodyText.substring(0,100));
      errorMessage = `Server error (status: ${response.status}): ${responseBodyText.substring(0, 200)}`;
    }

    if (isHtmlError) {
        errorMessage = `Server returned an unexpected HTML error (status: ${response.status}). Please check server logs.`;
        console.error(`Full HTML error response from server (Update Campaign ${campaignId}):`, responseBodyText.substring(0,1000));
    }
    
    console.error(`Update campaign API error (client) for ${campaignId}:`, { 
        status: response.status, 
        statusText: response.statusText, 
        message: errorMessage, 
        details: errorDetails,
        rawErrorBodyPreview: responseBodyText.substring(0, 200)
    });
    const err = new Error(errorMessage);
    (err as any).details = errorDetails;
    throw err;
  }
  
  try {
    const result = JSON.parse(responseBodyText);
    if (!result || !result._id) {
        console.error(`updateCampaign (client): Campaign ${campaignId} update response missing ID or data:`, result);
        throw new Error("Campaign updated, but response data is invalid.");
    }
    console.log(`updateCampaign (client): Successfully updated campaign ${campaignId}.`);
    return { ...result, id: result._id }; // Map _id to id
  } catch (e: any) {
    console.error(`updateCampaign (client): Error parsing successful JSON response for campaign ${campaignId}:`, e.message, "Body:", responseBodyText.substring(0,500));
    throw new Error("Received an invalid success response format from the server after update.");
  }
}

interface EditCampaignFormProps {
  existingCampaign: Campaign;
}

const symbolToShortCodeMap: Record<string, string> = {
  '=': 'eq',
  '==': 'eq',
  '!=': 'neq',
  '<>': 'neq',
  '>': 'gt',
  '<': 'lt',
  '>=': 'gte',
  '<=': 'lte',
  'contains': 'contains',
  'startsWith': 'startsWith', 
  'endswith': 'endsWith',   
};

const campaignStatuses: Campaign['status'][] = ['Draft', 'Scheduled', 'Sent', 'Archived', 'Cancelled', 'Failed'];


export function EditCampaignForm({ existingCampaign }: EditCampaignFormProps) {
  const [campaignName, setCampaignName] = useState(existingCampaign.name);
  const [segmentName, setSegmentName] = useState(existingCampaign.segmentName || "");
  const [rules, setRules] = useState<SegmentRule[]>(existingCampaign.rules);
  const [ruleLogic, setRuleLogic] = useState<'AND' | 'OR'>(existingCampaign.ruleLogic);
  const [message, setMessage] = useState(existingCampaign.message);
  const [status, setStatus] = useState<Campaign['status']>(existingCampaign.status);
  const [isSuggestingMessage, setIsSuggestingMessage] = useState(false);
  const [messageSuggestions, setMessageSuggestions] = useState<string[]>([]);
  const [audienceSize, setAudienceSize] = useState(existingCampaign.audienceSize);

  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { token } = useAuth();

  useEffect(() => {
    setCampaignName(existingCampaign.name);
    setSegmentName(existingCampaign.segmentName || "");
    setRules(existingCampaign.rules);
    setRuleLogic(existingCampaign.ruleLogic);
    setMessage(existingCampaign.message);
    setStatus(existingCampaign.status);
    setAudienceSize(existingCampaign.audienceSize);
  }, [existingCampaign]);


  const mutation = useMutation({
    mutationFn: (payload: CampaignUpdatePayload) => updateCampaign(existingCampaign.id, payload, token),
    onSuccess: (data: Campaign) => { 
      toast({
        title: "Campaign Updated!",
        description: `Campaign "${data.name || campaignName}" has been successfully updated.`,
      });
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['campaign', existingCampaign.id] });
      queryClient.invalidateQueries({ queryKey: ['campaign', existingCampaign.id, 'edit'] });
      
      router.push(`/campaigns/${existingCampaign.id}`); 
    },
    onError: (error: Error) => {
      const errorDetails = (error as any).details;
      let description = error.message;
      if (errorDetails && typeof errorDetails === 'object') {
          const validationErrors = Object.entries(errorDetails.validationErrors || errorDetails.errors || {})
                                      .map(([field, msg]) => `${field}: ${Array.isArray(msg) ? msg.join(', ') : msg}`)
                                      .join('\n');
          if (validationErrors) {
              description += `\nDetails:\n${validationErrors}`;
          }
      }
      toast({
        title: "Failed to Update Campaign",
        description: description,
        variant: "destructive",
        duration: 8000,
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
        toast({ title: "Could not parse rule", description: `The AI suggested rule format ("${ruleText}") was not recognized. Please add manually.`, variant: "destructive", duration: 5000 });
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
        description: "Please add at least one segment rule.",
        variant: "destructive",
      });
      return;
    }

    const updatedCampaignPayload: CampaignUpdatePayload = {
      name: campaignName,
      segmentName: segmentName || undefined, 
      rules: rules, 
      ruleLogic: ruleLogic,
      message: message,
      status: status,
      audienceSize: audienceSize, 
    };
    
    mutation.mutate(updatedCampaignPayload);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Campaign Details</CardTitle>
          <CardDescription>Modify the name, message, and status of your campaign.</CardDescription>
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
                 <Select onValueChange={(value: string) => setMessage(value)} disabled={mutation.isPending}>
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

      <AudiencePreview rules={rules} logic={ruleLogic} isCalculating={mutation.isPending} onAudienceSizeChange={setAudienceSize}/>

      <CardFooter className="flex flex-col sm:flex-row justify-end gap-3 p-0 pt-6">
        <Button type="button" variant="outline" onClick={() => router.back()} disabled={mutation.isPending}>
          Cancel
        </Button>
        <Button type="submit" disabled={mutation.isPending || rules.length === 0} className="w-full sm:w-auto">
          {mutation.isPending ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving Changes...</>
          ) : (
            <><Save className="mr-2 h-4 w-4" /> Save Changes</>
          )}
        </Button>
      </CardFooter>
    </form>
  );
}

"use client";

import type { Campaign, SegmentRule } from "@/lib/types";
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
import { Save, Wand2, Send, RotateCcw } from "lucide-react";
import { generateMessageSuggestions } from "@/ai/flows/ai-driven-message-suggestions";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"


const CAMPAIGNS_STORAGE_KEY = 'miniature-genius-campaigns';

export function CreateCampaignForm() {
  const [campaignName, setCampaignName] = useState("");
  const [segmentName, setSegmentName] = useState("");
  const [rules, setRules] = useState<SegmentRule[]>([]);
  const [ruleLogic, setRuleLogic] = useState<'AND' | 'OR'>('AND');
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [isSuggestingMessage, setIsSuggestingMessage] = useState(false);
  const [messageSuggestions, setMessageSuggestions] = useState<string[]>([]);

  const router = useRouter();
  const { toast } = useToast();

  const handleNlpRuleGenerated = (ruleText: string) => {
    // This is a simplified way to handle NLP rule.
    // A proper implementation would parse ruleText into SegmentRule[]
    // For now, we can just show a toast or set it as a single description.
    // Or, try to parse it. Let's assume ruleText is a simple condition for one rule:
    // e.g. "spend > 1000"
    const parts = ruleText.match(/(\w+)\s*([<>=!]+|contains|starts_with|ends_with)\s*(.+)/i);
    if (parts && parts.length === 4) {
        const newRule: SegmentRule = {
            id: Date.now().toString(),
            field: parts[1].trim(),
            operator: parts[2].trim(),
            value: parts[3].trim().replace(/^['"]|['"]$/g, ''), // Remove quotes if any
        };
        setRules(prevRules => [...prevRules, newRule]);
        toast({ title: "Rule Added", description: "AI suggested rule has been added to the builder." });
    } else {
        toast({ title: "Could not parse rule", description: "The AI suggested rule format was not recognized for automatic addition. Please add manually or refine prompt.", variant: "destructive", duration: 5000 });
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
        toast({ title: "No Suggestions", description: "AI couldn't generate suggestions for this objective.", variant: "destructive" });
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

    setIsLoading(true);
    setIsSimulating(true);

    // Simulate audience size based on rules (mock)
    const audienceSize = Math.floor(Math.random() * (rules.length * 500)) + 50;
    
    // Simulate campaign delivery
    let sentCount = 0;
    let failedCount = 0;
    // Simulate API calls for each user in segment (mock)
    for (let i = 0; i < audienceSize; i++) {
      // Simulate ~90% success, ~10% failure
      if (Math.random() < 0.9) {
        sentCount++;
      } else {
        failedCount++;
      }
    }
    // In this simulation, sentCount is effectively "attempted" and (sentCount - failedCount) is "successful"
    // For clarity, let's adjust:
    const attemptedMessages = audienceSize; // We attempt to send to everyone in the audience
    const successfulDeliveries = Math.round(attemptedMessages * (0.85 + Math.random() * 0.1)); // 85-95% success
    const failedDeliveries = attemptedMessages - successfulDeliveries;


    const newCampaign: Campaign = {
      id: Date.now().toString(),
      name: campaignName,
      segmentId: Date.now().toString() + "-seg", // Mock segment ID
      segmentName: segmentName,
      rules: rules, // Storing rules with campaign for simplicity
      message: message,
      createdAt: new Date().toISOString(),
      status: "Sent", // Assume it's sent upon creation for this simulation
      audienceSize: audienceSize,
      sentCount: successfulDeliveries, // Actually delivered
      failedCount: failedDeliveries,
    };
    
    // Simulate saving to backend/localStorage
    await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate network delay

    try {
      const existingCampaignsRaw = localStorage.getItem(CAMPAIGNS_STORAGE_KEY);
      const existingCampaigns: Campaign[] = existingCampaignsRaw ? JSON.parse(existingCampaignsRaw) : [];
      localStorage.setItem(CAMPAIGNS_STORAGE_KEY, JSON.stringify([...existingCampaigns, newCampaign]));
      
      toast({
        title: "Campaign Created & Sent! (Simulated)",
        description: `${newCampaign.name} has been processed. Audience: ${audienceSize}, Sent: ${successfulDeliveries}, Failed: ${failedDeliveries}.`,
        duration: 7000,
      });
      router.push("/dashboard");

    } catch (error) {
        console.error("Failed to save campaign to localStorage", error);
        toast({
            title: "Storage Error",
            description: "Could not save the campaign locally.",
            variant: "destructive",
        });
    } finally {
        setIsLoading(false);
        setIsSimulating(false);
    }
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
            />
          </div>
          <div>
            <div className="flex justify-between items-center mb-1">
              <Label htmlFor="message">Message</Label>
              <Button type="button" variant="outline" size="sm" onClick={handleGenerateMessageSuggestions} disabled={isSuggestingMessage}>
                <Wand2 className="mr-2 h-4 w-4"/> {isSuggestingMessage ? "Suggesting..." : "Suggest with AI"}
              </Button>
            </div>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="e.g., Hi {customer_name}, here’s 10% off on your next order!"
              rows={4}
              required
            />
             {messageSuggestions.length > 0 && (
              <div className="mt-2 space-y-2">
                <Label className="text-sm text-muted-foreground">AI Suggestions:</Label>
                 <Select onValueChange={(value) => setMessage(value)}>
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
      
      <RuleBuilder rules={rules} onRulesChange={setRules} logic={ruleLogic} onLogicChange={setRuleLogic} />

      <div>
        <Label htmlFor="segmentName">Segment Name</Label>
        <Input
            id="segmentName"
            value={segmentName}
            onChange={(e) => setSegmentName(e.target.value)}
            placeholder="e.g., High Value Customers, Recent Signups"
            required
            className="mt-1"
        />
      </div>

      <AudiencePreview rules={rules} logic={ruleLogic} isCalculating={isLoading} />

      <CardFooter className="flex flex-col sm:flex-row justify-end gap-3 p-0 pt-6">
        <Button type="button" variant="outline" onClick={() => router.push("/dashboard")} disabled={isLoading}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading || rules.length === 0} className="w-full sm:w-auto">
          {isLoading ? (
            isSimulating ? <><RotateCcw className="mr-2 h-4 w-4 animate-spin" /> Simulating Delivery...</> : <><Save className="mr-2 h-4 w-4" /> Saving...</>
          ) : (
            <><Send className="mr-2 h-4 w-4" /> Save & Launch Campaign</>
          )}
        </Button>
      </CardFooter>
    </form>
  );
}
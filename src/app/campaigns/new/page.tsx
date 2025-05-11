
import AppLayout from "@/components/layout/app-layout";
import { CreateCampaignForm } from "@/components/campaigns/create-campaign-form";
import { Separator } from "@/components/ui/separator";

export default function NewCampaignPage() {
  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Create New Campaign</h1>
          <p className="text-muted-foreground">
            Define your audience segment, craft your message, and launch your campaign.
          </p>
        </div>
        <Separator />
        <div className="max-w-4xl mx-auto"> {/* Limit width for better form readability */}
            <CreateCampaignForm />
        </div>
      </div>
    </AppLayout>
  );
}
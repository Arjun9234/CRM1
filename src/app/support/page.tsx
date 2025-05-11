
import AppLayout from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { HelpCircle, BookOpen, MessageSquare, LifeBuoy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const faqItems = [
  {
    id: "faq1",
    question: "How do I create a new campaign?",
    answer: "Navigate to the 'Create Campaign' page from the sidebar. Fill in the campaign details, define your audience segment using the rule builder or AI suggestions, craft your message (you can use AI for suggestions too!), and then click 'Save & Launch Campaign'.",
  },
  {
    id: "faq2",
    question: "Can I use AI to help define my audience segment?",
    answer: "Yes! On the 'Create Campaign' page, there's an 'AI-Powered Segment Creation' section. Describe your target audience in natural language (e.g., 'customers who spent over $100 in the last month'), and the AI will suggest logical rules. You can then add these rules to the rule builder.",
  },
  {
    id: "faq3",
    question: "Where can I see the performance of my campaigns?",
    answer: "The Dashboard provides an overview of key metrics and a chart of recent campaign performance. For more detailed analytics, the 'Analytics' page (coming soon) will offer in-depth reports.",
  },
  {
    id: "faq4",
    question: "Is my data secure?",
    answer: "We take data security seriously. All data is handled with care, and we are continuously working on enhancing security features. You can manage some security settings on the 'Settings' page.",
  },
];

export default function SupportPage() {
  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Support Center</h1>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
            {/* Contact Support Form */}
            <Card className="shadow-lg">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                <LifeBuoy className="h-6 w-6 text-primary" />
                Contact Support
                </CardTitle>
                <CardDescription>
                Need help? Fill out the form below and our team will get back to you.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div>
                <Label htmlFor="support-name">Your Name</Label>
                <Input id="support-name" placeholder="e.g., Jane Doe" />
                </div>
                <div>
                <Label htmlFor="support-email">Your Email</Label>
                <Input id="support-email" type="email" placeholder="e.g., jane.doe@example.com" />
                </div>
                <div>
                <Label htmlFor="support-subject">Subject</Label>
                <Input id="support-subject" placeholder="e.g., Issue with campaign creation" />
                </div>
                <div>
                <Label htmlFor="support-message">Message</Label>
                <Textarea id="support-message" placeholder="Describe your issue or question in detail..." rows={5} />
                </div>
            </CardContent>
            <CardFooter>
                <Button className="w-full">
                    <MessageSquare className="mr-2 h-5 w-5" /> Send Message
                </Button>
            </CardFooter>
            </Card>

            {/* FAQ Section */}
            <Card className="shadow-lg">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                <HelpCircle className="h-6 w-6 text-primary" />
                Frequently Asked Questions (FAQ)
                </CardTitle>
                <CardDescription>
                Find answers to common questions about EngageSphere.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {faqItems.length > 0 ? (
                <Accordion type="single" collapsible className="w-full">
                    {faqItems.map((item) => (
                    <AccordionItem value={item.id} key={item.id}>
                        <AccordionTrigger className="text-left hover:no-underline">{item.question}</AccordionTrigger>
                        <AccordionContent className="text-muted-foreground">
                        {item.answer}
                        </AccordionContent>
                    </AccordionItem>
                    ))}
                </Accordion>
                ) : (
                <p className="text-muted-foreground">No FAQs available at the moment.</p>
                )}
            </CardContent>
            </Card>
        </div>
        

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <BookOpen className="h-6 w-6 text-primary" />
              Knowledge Base & Guides
            </CardTitle>
            <CardDescription>
              Explore our documentation, tutorials, and best practices.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center text-center p-10 border-2 border-dashed rounded-lg bg-muted/20 min-h-[200px]">
              <BookOpen className="h-16 w-16 text-muted-foreground mb-4" />
              <h2 className="text-2xl font-semibold text-muted-foreground">Knowledge Base Coming Soon!</h2>
              <p className="text-muted-foreground mt-2 max-w-md">
                We're building a comprehensive library of articles and guides to help you get the most out of EngageSphere.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}

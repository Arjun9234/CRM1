
import AppLayout from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { MessageSquare, Star, ThumbsUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

const dummyFeedback = [
  {
    id: "1",
    user: "Alice Wonderland",
    avatar: "https://picsum.photos/seed/alice/40/40",
    rating: 5,
    comment: "Absolutely love the new dashboard! It's so much easier to navigate and find what I need. Keep up the great work!",
    date: "2024-07-15",
  },
  {
    id: "2",
    user: "Bob The Builder",
    avatar: "https://picsum.photos/seed/bob/40/40",
    comment: "The campaign creation process could be a bit more intuitive. Maybe add some tooltips for the advanced options?",
    date: "2024-07-14",
    rating: 3,
  },
  {
    id: "3",
    user: "Charlie Brown",
    avatar: "https://picsum.photos/seed/charlie/40/40",
    comment: "Analytics page is looking promising! Eagerly awaiting the full rollout. The current placeholders are intriguing.",
    date: "2024-07-12",
    rating: 4,
  },
];

export default function FeedbackPage() {
  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">User Feedback</h1>
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <MessageSquare className="h-6 w-6 text-primary" />
              Submit Your Feedback
            </CardTitle>
            <CardDescription>
              We value your input! Let us know how we can improve Miniature Genius.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="feedback-subject">Subject</Label>
              <Input id="feedback-subject" placeholder="e.g., Suggestion for Campaign Analytics" />
            </div>
            <div>
              <Label htmlFor="feedback-comments">Your Comments</Label>
              <Textarea id="feedback-comments" placeholder="Tell us what you think..." rows={5} />
            </div>
            <div className="flex items-center space-x-2">
                <Label>Overall Rating:</Label>
                {[1,2,3,4,5].map(star => (
                    <Button key={star} variant="ghost" size="icon" className="text-muted-foreground hover:text-yellow-500">
                        <Star className="h-5 w-5" />
                    </Button>
                ))}
            </div>
            <Button className="w-full sm:w-auto">
              <ThumbsUp className="mr-2 h-5 w-5" /> Submit Feedback
            </Button>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Star className="h-6 w-6 text-primary" />
              Recent Feedback
            </CardTitle>
            <CardDescription>
              See what other users are saying.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {dummyFeedback.length > 0 ? (
              <div className="space-y-6">
                {dummyFeedback.map((item) => (
                  <div key={item.id} className="p-4 border rounded-lg bg-muted/20">
                    <div className="flex items-start space-x-3">
                      <img src={item.avatar} alt={item.user} data-ai-hint="user avatar" className="h-10 w-10 rounded-full" />
                      <div>
                        <div className="flex items-center space-x-2">
                          <p className="font-semibold">{item.user}</p>
                          {item.rating && (
                            <div className="flex items-center">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`h-4 w-4 ${i < item.rating ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground'}`}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">{new Date(item.date).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <p className="mt-2 text-sm">{item.comment}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-center p-10 border-2 border-dashed rounded-lg bg-muted/20 min-h-[200px]">
                <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
                <h2 className="text-xl font-semibold text-muted-foreground">No Feedback Yet</h2>
                <p className="text-muted-foreground mt-1">Be the first to share your thoughts!</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}

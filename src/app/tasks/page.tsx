
import AppLayout from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ListChecks } from "lucide-react";

export default function TasksPage() {
  return (
    <AppLayout>
      <div className="space-y-6">
         <div className="flex items-center justify-between">
           <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Tasks</h1>
         </div>
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <ListChecks className="h-6 w-6 text-primary" />
              Manage Your Tasks
            </CardTitle>
            <CardDescription>
              Stay organized and keep track of your to-dos, follow-ups, appointments, and other activities.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center text-center p-10 border-2 border-dashed rounded-lg bg-muted/20 min-h-[300px]">
              <ListChecks className="h-16 w-16 text-muted-foreground mb-4" />
              <h2 className="text-2xl font-semibold text-muted-foreground">Task Management Coming Soon!</h2>
              <p className="text-muted-foreground mt-2 max-w-md">
                Efficiently manage your activities, set reminders, and collaborate with your team. Never miss a deadline again!
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}


import AppLayout from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users } from "lucide-react";

export default function CustomersPage() {
  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
           <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Customers</h1>
        </div>
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Users className="h-6 w-6 text-primary" />
              Manage Your Customers
            </CardTitle>
            <CardDescription>
              This section will allow you to view, add, and manage customer information, interactions, and history.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center text-center p-10 border-2 border-dashed rounded-lg bg-muted/20 min-h-[300px]">
              <Users className="h-16 w-16 text-muted-foreground mb-4" />
              <h2 className="text-2xl font-semibold text-muted-foreground">Customer Management Coming Soon!</h2>
              <p className="text-muted-foreground mt-2 max-w-md">
                We're currently developing a comprehensive customer relationship management module. Stay tuned for updates!
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}

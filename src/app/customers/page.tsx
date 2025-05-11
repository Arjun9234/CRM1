
"use client";
import AppLayout from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, PlusCircle, Search } from "lucide-react";
import type { Customer, CustomerStatus } from "@/lib/types";
import { format, subDays, subMonths } from "date-fns";
import { Input } from "@/components/ui/input";

const dummyCustomers: Customer[] = [
  {
    id: "cust_001",
    name: "Alice Johnson",
    email: "alice.johnson@example.com",
    avatarUrl: "https://picsum.photos/seed/alice/40/40",
    company: "Innovatech Ltd.",
    totalSpend: 1250.75,
    lastContact: subDays(new Date(), 15).toISOString(),
    status: "Active",
    createdAt: subMonths(new Date(), 6).toISOString(),
    tags: ["VIP", "Tech"],
  },
  {
    id: "cust_002",
    name: "Bob Williams",
    email: "bob.williams@example.com",
    avatarUrl: "https://picsum.photos/seed/bob/40/40",
    company: "Solutions Inc.",
    totalSpend: 850.00,
    lastContact: subDays(new Date(), 5).toISOString(),
    status: "Active",
    createdAt: subMonths(new Date(), 3).toISOString(),
    tags: ["Regular"],
  },
  {
    id: "cust_003",
    name: "Carol Davis",
    email: "carol.davis@example.com",
    avatarUrl: "https://picsum.photos/seed/carol/40/40",
    company: "Market Movers",
    totalSpend: 320.50,
    lastContact: subDays(new Date(), 45).toISOString(),
    status: "Lead",
    createdAt: subMonths(new Date(), 1).toISOString(),
    tags: ["New Lead", "Marketing"],
  },
  {
    id: "cust_004",
    name: "David Brown",
    email: "david.brown@example.com",
    avatarUrl: "https://picsum.photos/seed/david/40/40",
    company: "Enterprise Co.",
    totalSpend: 2500.00,
    lastContact: subDays(new Date(), 90).toISOString(),
    status: "Inactive",
    createdAt: subMonths(new Date(), 12).toISOString(),
    tags: ["High Value"],
  },
  {
    id: "cust_005",
    name: "Eve Wilson",
    email: "eve.wilson@example.com",
    avatarUrl: "https://picsum.photos/seed/eve/40/40",
    company: "Gadget Corp",
    totalSpend: 0,
    lastContact: subDays(new Date(), 2).toISOString(),
    status: "New",
    createdAt: subDays(new Date(), 2).toISOString(),
    tags: ["Follow Up"],
  },
];

const statusVariantMap: Record<CustomerStatus, "default" | "secondary" | "destructive" | "outline"> = {
    Active: "default", // Default often primary or green-ish
    Lead: "secondary", // Neutral or yellow-ish
    Inactive: "destructive", // Red-ish or grayed out
    New: "outline" // Distinct, perhaps blue-ish if not primary
};


export default function CustomersPage() {
  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
           <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Customers</h1>
           <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-initial">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                    type="search"
                    placeholder="Search customers..."
                    className="pl-8 sm:w-[200px] md:w-[300px]"
                />
            </div>
            <Button className="w-full sm:w-auto">
              <PlusCircle className="mr-2 h-5 w-5" />
              Add Customer
            </Button>
           </div>
        </div>
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Users className="h-6 w-6 text-primary" />
              Customer Directory
            </CardTitle>
            <CardDescription>
              View, manage, and engage with your customer base.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {dummyCustomers.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[80px]">Avatar</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead className="hidden md:table-cell">Email</TableHead>
                    <TableHead className="hidden lg:table-cell">Company</TableHead>
                    <TableHead className="text-right">Total Spend</TableHead>
                    <TableHead className="hidden md:table-cell text-center">Status</TableHead>
                    <TableHead className="hidden sm:table-cell">Last Contact</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dummyCustomers.map((customer) => (
                    <TableRow key={customer.id}>
                      <TableCell>
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={customer.avatarUrl} alt={customer.name} data-ai-hint="person photo" />
                          <AvatarFallback>{customer.name.substring(0,2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                      </TableCell>
                      <TableCell className="font-medium">{customer.name}</TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground">{customer.email}</TableCell>
                      <TableCell className="hidden lg:table-cell text-muted-foreground">{customer.company || "N/A"}</TableCell>
                      <TableCell className="text-right">₹{customer.totalSpend.toLocaleString()}</TableCell>
                      <TableCell className="hidden md:table-cell text-center">
                        <Badge variant={statusVariantMap[customer.status]}
                          className={
                            customer.status === "Active" ? "bg-green-500 hover:bg-green-600 text-white" :
                            customer.status === "Inactive" ? "bg-red-500 hover:bg-red-600 text-white" :
                            customer.status === "Lead" ? "bg-yellow-500 hover:bg-yellow-600 text-black" : ""
                          }
                        >
                            {customer.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-muted-foreground">
                        {format(new Date(customer.lastContact), "MMM dd, yyyy")}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="flex flex-col items-center justify-center text-center p-10 border-2 border-dashed rounded-lg bg-muted/20 min-h-[300px]">
                <Users className="h-16 w-16 text-muted-foreground mb-4" />
                <h2 className="text-2xl font-semibold text-muted-foreground">No Customers Yet</h2>
                <p className="text-muted-foreground mt-2 max-w-md">
                  Start building your customer base by adding your first contact.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}

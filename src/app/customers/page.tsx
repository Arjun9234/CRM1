
"use client";
import AppLayout from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, PlusCircle, Search, Loader2, AlertTriangle } from "lucide-react";
import type { Customer, CustomerStatus, CustomerCreationPayload } from "@/lib/types";
import { format, subDays, subMonths, formatISO } from "date-fns";
import { Input } from "@/components/ui/input";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

async function fetchCustomers(): Promise<Customer[]> {
  const response = await fetch('/api/customers');
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to fetch customers');
  }
  return response.json();
}

async function createCustomer(payload: CustomerCreationPayload): Promise<Customer> {
    const response = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create customer');
    }
    const result = await response.json();
    return result.customer;
}

const customerFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  company: z.string().optional(),
  status: z.enum(['Active', 'Lead', 'Inactive', 'New', 'Archived']).default('New'),
});


const statusVariantMap: Record<CustomerStatus, "default" | "secondary" | "destructive" | "outline"> = {
    Active: "default", 
    Lead: "secondary", 
    Inactive: "destructive", 
    New: "outline",
    Archived: "destructive"
};


export default function CustomersPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddCustomerDialogOpen, setIsAddCustomerDialogOpen] = useState(false);

  const { data: customers = [], isLoading, error } = useQuery<Customer[]>({
    queryKey: ['customers'],
    queryFn: fetchCustomers,
  });

  const { control, handleSubmit, reset } = useForm<z.infer<typeof customerFormSchema>>({
    resolver: zodResolver(customerFormSchema),
    defaultValues: {
      name: "",
      email: "",
      company: "",
      status: "New",
    },
  });

  const createCustomerMutation = useMutation({
    mutationFn: createCustomer,
    onSuccess: (newCustomer) => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast({ title: "Customer Added", description: `${newCustomer.name} has been successfully added.` });
      setIsAddCustomerDialogOpen(false);
      reset();
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const onAddCustomerSubmit = (data: z.infer<typeof customerFormSchema>) => {
    const payload: CustomerCreationPayload = {
      ...data,
      avatarUrl: `https://picsum.photos/seed/${encodeURIComponent(data.email)}/40/40`, // Auto-generate avatar
      totalSpend: 0,
      lastContact: formatISO(new Date()), // Set last contact to now
      tags: [data.status],
    };
    createCustomerMutation.mutate(payload);
  };


  if (isLoading) {
    return (
      <AppLayout>
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <Skeleton className="h-10 w-48" />
                <Skeleton className="h-10 w-32" />
            </div>
            <Card className="shadow-lg">
                <CardHeader><Skeleton className="h-8 w-64" /></CardHeader>
                <CardContent>
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="flex items-center space-x-4 p-4 border-b">
                            <Skeleton className="h-10 w-10 rounded-full" />
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-[250px]" />
                                <Skeleton className="h-4 w-[200px]" />
                            </div>
                        </div>
                    ))}
                </CardContent>
            </Card>
        </div>
      </AppLayout>
    )
  }

  if (error) {
     return (
      <AppLayout>
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{(error as Error).message || "Failed to load customer data."}</AlertDescription>
        </Alert>
      </AppLayout>
     )
  }

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
            <Dialog open={isAddCustomerDialogOpen} onOpenChange={setIsAddCustomerDialogOpen}>
              <DialogTrigger asChild>
                <Button className="w-full sm:w-auto">
                  <PlusCircle className="mr-2 h-5 w-5" />
                  Add Customer
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Add New Customer</DialogTitle>
                  <DialogDescription>
                    Fill in the details for the new customer.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit(onAddCustomerSubmit)} className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="name" className="text-right">Name</Label>
                    <Controller
                      name="name"
                      control={control}
                      render={({ field }) => <Input id="name" {...field} className="col-span-3" />}
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="email" className="text-right">Email</Label>
                     <Controller
                      name="email"
                      control={control}
                      render={({ field }) => <Input id="email" type="email" {...field} className="col-span-3" />}
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="company" className="text-right">Company</Label>
                    <Controller
                      name="company"
                      control={control}
                      render={({ field }) => <Input id="company" {...field} className="col-span-3" />}
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="status" className="text-right">Status</Label>
                    <Controller
                        name="status"
                        control={control}
                        render={({ field }) => (
                            <select {...field} className="col-span-3 p-2 border rounded-md bg-background">
                                {(['New', 'Lead', 'Active', 'Inactive', 'Archived'] as CustomerStatus[]).map(s => (
                                    <option key={s} value={s}>{s}</option>
                                ))}
                            </select>
                        )}
                    />
                  </div>
                  <DialogFooter>
                    <Button type="submit" disabled={createCustomerMutation.isPending}>
                      {createCustomerMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Add Customer
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
           </div>
        </div>
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Users className="h-6 w-6 text-primary" />
              Customer Directory
            </CardTitle>
            <CardDescription>
              View, manage, and engage with your customer base. ({customers.length} customers)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {customers.length > 0 ? (
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
                  {customers.map((customer) => (
                    <TableRow key={customer.id}>
                      <TableCell>
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={customer.avatarUrl || `https://picsum.photos/seed/${customer.id}/40/40`} alt={customer.name} data-ai-hint="person photo" />
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
                            customer.status === "Lead" ? "bg-yellow-500 hover:bg-yellow-600 text-black" : 
                            customer.status === "Archived" ? "bg-gray-500 hover:bg-gray-600 text-white" : ""
                          }
                        >
                            {customer.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-muted-foreground">
                        {customer.lastContact ? format(new Date(customer.lastContact), "MMM dd, yyyy") : 'N/A'}
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

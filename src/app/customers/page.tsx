
"use client";
import AppLayout from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PlusCircle, User, Mail, Building, DollarSign, CalendarDays, Tag, AlertTriangle, Users, Briefcase, TrendingUp, Eye } from "lucide-react";
import type { Customer, CustomerStatus, CustomerCreationPayload } from "@/lib/types";
import { format, formatISO, subDays, addDays } from "date-fns";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertTitle, AlertDescription as UiAlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";


async function fetchCustomers(): Promise<Customer[]> {
  const response = await fetch('/api/customers');
  if (!response.ok) {
    let errorMessage = `Failed to fetch customers (Status: ${response.status} ${response.statusText || 'Unknown Status'})`;
    try {
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.error || errorMessage;
      } else {
        const textError = await response.text();
        errorMessage = `Server error: ${textError.substring(0, 100)}${textError.length > 100 ? '...' : ''}`;
        console.error("Full non-JSON error from server (fetchCustomers):", textError);
      }
    } catch (e) {
      console.error("Error processing error response (fetchCustomers):", e);
    }
    throw new Error(errorMessage);
  }
  try {
    return await response.json();
  } catch (e) {
    console.error("Error parsing successful JSON response (fetchCustomers):", e);
    throw new Error("Failed to parse successful customer list from server.");
  }
}

async function createCustomer(payload: CustomerCreationPayload): Promise<Customer> {
  const response = await fetch('/api/customers', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    let errorMessage = `Failed to create customer (Status: ${response.status} ${response.statusText || 'Unknown Status'})`;
    try {
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.error || errorMessage;
        if (errorData.errors) {
          const fieldErrors = Object.entries(errorData.errors)
            .map(([field, messages]) => `${field}: ${(messages as string[]).join(', ')}`)
            .join('; ');
          errorMessage = `Invalid data: ${fieldErrors || errorMessage}`;
        }
      } else {
        const textError = await response.text();
        errorMessage = `Server error: ${textError.substring(0, 200)}${textError.length > 200 ? '...' : ''}`; // Increased preview length
        console.error("Full non-JSON error from server (createCustomer):", textError);
      }
    } catch (e) {
      console.error("Error processing/parsing error response (createCustomer):", e);
    }
    throw new Error(errorMessage);
  }

  try {
    const result = await response.json();
    if (!result.customer) {
        console.error("Successful response, but 'customer' field missing (createCustomer):", result);
        throw new Error("Customer creation response was successful, but data format is incorrect.");
    }
    return result.customer;
  } catch (e) {
    const responseBodyForDebug = await response.text().catch(() => "Could not read response body again.");
    console.error("Error parsing successful JSON response (createCustomer):", e, "Body:", responseBodyForDebug);
    throw new Error("Failed to parse successful customer creation response from server.");
  }
}

const customerStatusOptions: CustomerStatus[] = ['Active', 'Lead', 'Inactive', 'New', 'Archived'];

const customerFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  avatarUrl: z.string().url("Invalid URL for avatar").optional().or(z.literal('')),
  company: z.string().optional(),
  totalSpend: z.coerce.number().min(0, "Total spend cannot be negative").default(0),
  lastContact: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Invalid last contact date"}),
  status: z.enum(customerStatusOptions),
  acquisitionSource: z.string().optional(),
  tags: z.string().optional().transform(val => val ? val.split(',').map(tag => tag.trim()).filter(tag => tag) : []),
  lastSeenOnline: z.string().optional().refine(val => val ? !isNaN(Date.parse(val)) : true, { message: "Invalid last seen online date" }),
});


const CustomerCard = ({ customer }: { customer: Customer }) => {
  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  
  const statusBadgeVariant = (status: CustomerStatus) => {
    switch (status) {
      case 'Active': return 'bg-green-500 hover:bg-green-600 text-white';
      case 'Lead': return 'bg-blue-500 hover:bg-blue-600 text-white';
      case 'Inactive': return 'bg-yellow-500 hover:bg-yellow-600 text-black';
      case 'New': return 'bg-purple-500 hover:bg-purple-600 text-white';
      case 'Archived': return 'bg-gray-500 hover:bg-gray-600 text-white';
      default: return 'secondary';
    }
  };

  return (
    <Card className="shadow-md hover:shadow-lg transition-shadow flex flex-col">
      <CardHeader>
        <div className="flex items-center space-x-3">
          <Avatar className="h-12 w-12">
            <AvatarImage src={customer.avatarUrl || `https://picsum.photos/seed/${customer.email}/48/48`} alt={customer.name} data-ai-hint="people person" />
            <AvatarFallback>{getInitials(customer.name)}</AvatarFallback>
          </Avatar>
          <div>
            <CardTitle className="text-lg">{customer.name}</CardTitle>
            <CardDescription className="text-xs text-muted-foreground flex items-center"><Mail className="h-3 w-3 mr-1" />{customer.email}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2 text-sm flex-grow">
        {customer.company && <p className="flex items-center"><Building className="h-4 w-4 mr-2 text-primary" />{customer.company}</p>}
        <p className="flex items-center"><DollarSign className="h-4 w-4 mr-2 text-green-500" />Total Spend: ₹{customer.totalSpend.toLocaleString()}</p>
        <p className="flex items-center"><CalendarDays className="h-4 w-4 mr-2 text-primary" />Last Contact: {format(new Date(customer.lastContact), "PP")}</p>
        {customer.lastSeenOnline && <p className="flex items-center"><Eye className="h-4 w-4 mr-2 text-primary" />Last Seen: {format(new Date(customer.lastSeenOnline), "PPp")}</p>}
        {customer.acquisitionSource && <p className="flex items-center"><TrendingUp className="h-4 w-4 mr-2 text-primary" />Source: {customer.acquisitionSource}</p>}
        {customer.tags && customer.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 items-center pt-1">
            <Tag className="h-4 w-4 mr-1 text-primary" />
            {customer.tags.map(tag => (
              <Badge key={tag} variant="outline" className="font-normal text-xs">{tag}</Badge>
            ))}
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between items-center">
        <Badge className={`${statusBadgeVariant(customer.status)} text-xs`}>{customer.status}</Badge>
        {/* <Button variant="link" size="sm" className="text-primary p-0 h-auto text-xs">View Details</Button> */}
      </CardFooter>
    </Card>
  );
};

export default function CustomersPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddCustomerDialogOpen, setIsAddCustomerDialogOpen] = useState(false);

  const { data: customers = [], isLoading, error } = useQuery<Customer[]>({
    queryKey: ['customers'],
    queryFn: fetchCustomers,
  });

  const { control, handleSubmit, reset, formState: { errors: formErrors } } = useForm<z.infer<typeof customerFormSchema>>({
    resolver: zodResolver(customerFormSchema),
    defaultValues: {
      name: "",
      email: "",
      avatarUrl: "",
      company: "",
      totalSpend: 0,
      lastContact: formatISO(new Date()).split('T')[0], // Default to today's date
      status: "New",
      acquisitionSource: "",
      tags: "",
      lastSeenOnline: formatISO(new Date()).split('T')[0], // Default to today's date
    },
  });

  const createCustomerMutation = useMutation({
    mutationFn: createCustomer,
    onSuccess: (newCustomer) => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast({ title: "Customer Added", description: `Customer "${newCustomer.name}" has been successfully added.` });
      setIsAddCustomerDialogOpen(false);
      reset();
    },
    onError: (error: Error) => {
      toast({ title: "Error Adding Customer", description: error.message, variant: "destructive", duration: 8000 });
    },
  });

  const onAddCustomerSubmit = (data: z.infer<typeof customerFormSchema>) => {
    const payload: CustomerCreationPayload = {
      ...data,
      tags: data.tags || [],
      lastContact: new Date(data.lastContact).toISOString(),
      lastSeenOnline: data.lastSeenOnline ? new Date(data.lastSeenOnline).toISOString() : undefined,
      avatarUrl: data.avatarUrl || `https://picsum.photos/seed/${encodeURIComponent(data.email)}/100/100`
    };
    createCustomerMutation.mutate(payload);
  };
  
  const sortedCustomers = customers.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());


  if (isLoading) {
    return (
      <AppLayout>
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <Skeleton className="h-10 w-48" />
                <Skeleton className="h-10 w-36" />
            </div>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-72 w-full rounded-lg" />)}
            </div>
        </div>
      </AppLayout>
    )
  }

  if (error) {
     return (
      <AppLayout>
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error Fetching Customers</AlertTitle>
          <UiAlertDescription>{(error as Error).message || "Failed to load customer data."}</UiAlertDescription>
        </Alert>
      </AppLayout>
     )
  }

  return (
    <AppLayout>
      <div className="space-y-6">
         <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
           <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center"><Users className="mr-3 h-8 w-8 text-primary"/>Customer Management</h1>
            <Dialog open={isAddCustomerDialogOpen} onOpenChange={setIsAddCustomerDialogOpen}>
              <DialogTrigger asChild>
                <Button className="w-full sm:w-auto">
                  <PlusCircle className="mr-2 h-5 w-5" />
                  Add New Customer
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>Add New Customer</DialogTitle>
                  <DialogDescription>
                    Fill in the details for the new customer. Click save when done.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit(onAddCustomerSubmit)} className="grid gap-3 py-4 max-h-[70vh] overflow-y-auto pr-2">
                  <div>
                    <Label htmlFor="name">Full Name</Label>
                    <Controller name="name" control={control} render={({ field }) => <Input id="name" {...field} placeholder="e.g. Priya Sharma" />} />
                    {formErrors.name && <p className="text-red-500 text-xs mt-1">{formErrors.name.message}</p>}
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Controller name="email" control={control} render={({ field }) => <Input id="email" type="email" {...field} placeholder="priya.sharma@example.com" />} />
                    {formErrors.email && <p className="text-red-500 text-xs mt-1">{formErrors.email.message}</p>}
                  </div>
                   <div>
                    <Label htmlFor="avatarUrl">Avatar URL (Optional)</Label>
                    <Controller name="avatarUrl" control={control} render={({ field }) => <Input id="avatarUrl" {...field} placeholder="https://example.com/avatar.png"/>} />
                     {formErrors.avatarUrl && <p className="text-red-500 text-xs mt-1">{formErrors.avatarUrl.message}</p>}
                  </div>
                  <div>
                    <Label htmlFor="company">Company (Optional)</Label>
                    <Controller name="company" control={control} render={({ field }) => <Input id="company" {...field} placeholder="Sharma Solutions" />} />
                  </div>
                  <div>
                    <Label htmlFor="totalSpend">Total Spend (INR)</Label>
                    <Controller name="totalSpend" control={control} render={({ field }) => <Input id="totalSpend" type="number" {...field} />} />
                    {formErrors.totalSpend && <p className="text-red-500 text-xs mt-1">{formErrors.totalSpend.message}</p>}
                  </div>
                   <div>
                    <Label htmlFor="lastContact">Last Contact Date</Label>
                    <Controller name="lastContact" control={control} render={({ field }) => <Input id="lastContact" type="date" {...field} />} />
                    {formErrors.lastContact && <p className="text-red-500 text-xs mt-1">{formErrors.lastContact.message}</p>}
                  </div>
                  <div>
                    <Label htmlFor="status">Status</Label>
                     <Controller name="status" control={control} render={({ field }) => (
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <SelectTrigger id="status">
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                          <SelectContent>
                            {customerStatusOptions.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                          </SelectContent>
                        </Select>
                    )} />
                     {formErrors.status && <p className="text-red-500 text-xs mt-1">{formErrors.status.message}</p>}
                  </div>
                   <div>
                    <Label htmlFor="acquisitionSource">Acquisition Source (Optional)</Label>
                    <Controller name="acquisitionSource" control={control} render={({ field }) => <Input id="acquisitionSource" {...field} placeholder="e.g. Referral, Organic Search"/>} />
                  </div>
                  <div>
                    <Label htmlFor="tags">Tags (comma-separated, Optional)</Label>
                    <Controller name="tags" control={control} render={({ field }) => <Input id="tags" {...field} placeholder="e.g. VIP, Tech, Prospect" />} />
                  </div>
                  <div>
                    <Label htmlFor="lastSeenOnline">Last Seen Online (Optional)</Label>
                    <Controller name="lastSeenOnline" control={control} render={({ field }) => <Input id="lastSeenOnline" type="date" {...field} />} />
                    {formErrors.lastSeenOnline && <p className="text-red-500 text-xs mt-1">{formErrors.lastSeenOnline.message}</p>}
                  </div>
                  <DialogFooter className="mt-4">
                    <Button type="button" variant="outline" onClick={() => { setIsAddCustomerDialogOpen(false); reset(); }}>Cancel</Button>
                    <Button type="submit" disabled={createCustomerMutation.isPending}>
                      {createCustomerMutation.isPending && <User className="mr-2 h-4 w-4 animate-spin" />}
                      Save Customer
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
         </div>

        {sortedCustomers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {sortedCustomers.map(customer => <CustomerCard key={customer.id} customer={customer} />)}
          </div>
        ) : (
          <Card className="shadow-lg col-span-full"> {/* Ensures this card spans full width if no customers */}
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Briefcase className="h-6 w-6 text-primary" />
                Your Customers
              </CardTitle>
              <CardDescription>
                Manage and view your customer base here.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center text-center p-10 border-2 border-dashed rounded-lg bg-muted/20 min-h-[300px]">
                <Users className="h-16 w-16 text-muted-foreground mb-4" />
                <h2 className="text-2xl font-semibold text-muted-foreground">No Customers Yet!</h2>
                <p className="text-muted-foreground mt-2 max-w-md">
                  Add your first customer to start building your database and launching targeted campaigns.
                </p>
                 <Button className="mt-6" onClick={() => setIsAddCustomerDialogOpen(true)}>
                    <PlusCircle className="mr-2 h-5 w-5" />
                    Add First Customer
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}

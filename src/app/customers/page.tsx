"use client";
import AppLayout from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PlusCircle, User, Mail, Building, DollarSign, CalendarDays, Tag, AlertTriangle, Users, Briefcase, TrendingUp, Eye, Loader2 as FormLoader } from "lucide-react";
import type { Customer, CustomerStatus, CustomerCreationPayload } from "@/lib/types";
import { format, formatISO, parseISO } from "date-fns";
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
// import { Textarea } from "@/components/ui/textarea"; // Not used in this form currently
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertTitle, AlertDescription as UiAlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/use-auth";
import { API_BASE_URL } from '@/lib/config'; // Import centralized API_BASE_URL

// const API_BASE_URL = `http://localhost:${process.env.NEXT_PUBLIC_SERVER_PORT || 5000}/api`; // Removed

async function fetchCustomers(token: string | null): Promise<Customer[]> {
  console.log(`fetchCustomers (client): Initiating fetch from ${API_BASE_URL}/customers`);
  const response = await fetch(`${API_BASE_URL}/customers`);
  
  const responseText = await response.text();

  if (!response.ok) {
    let errorMessage = `Failed to fetch customers (Status: ${response.status} ${response.statusText || 'Unknown Status'})`;
    let errorDetails: any = null;
    console.error("fetchCustomers (client): Error response text (first 500 chars):", responseText.substring(0, 500));

    if (response.status === 504) {
        errorMessage = `Failed to fetch customers: The server took too long to respond (Gateway Timeout). This might be a temporary issue.`;
    } else {
        try {
            const contentType = response.headers.get("content-type");
            if (contentType && contentType.includes("application/json")) {
                const errorData = JSON.parse(responseText);
                errorMessage = errorData.message || errorData.error || errorMessage;
                errorDetails = errorData.errors || errorData.details || errorData;
            } else if (responseText.toLowerCase().includes("<html")) {
                errorMessage = `Server returned an unexpected HTML error page (status: ${response.status}). This usually indicates a server-side problem or misconfiguration. Please check server logs. Preview: ${responseText.substring(0,200)}`;
                console.error("Full HTML error from server (fetchCustomers):", responseText.substring(0,1000));
            }
             else { 
                 errorMessage = `Server error while fetching customers: ${responseText.substring(0, 100)}${responseText.length > 100 ? '...' : ''}`;
            }
        } catch (e) {
            console.error("Error processing/parsing error response (fetchCustomers):", e);
            errorMessage = `Failed to parse error response. Server returned status ${response.status}. Response preview: ${responseText.substring(0,100)}`;
        }
    }
    console.error("fetchCustomers (client): Throwing error:", errorMessage, "Details:", errorDetails);
    const err = new Error(errorMessage);
    (err as any).details = errorDetails;
    throw err;
  }
  try {
    const data = JSON.parse(responseText);
    console.log(`fetchCustomers (client): Successfully fetched ${data.length} customers.`);
    return data.map((c: any) => ({ ...c, id: c._id })); 
  } catch (e) {
    console.error("Error parsing successful JSON response (fetchCustomers):", e, "Body:", responseText.substring(0,500));
    throw new Error("Failed to parse successful customer list from server.");
  }
}

async function createCustomer(payload: CustomerCreationPayload, token: string | null): Promise<{message?: string; customer: Customer}> {
  console.log(`createCustomer (client): Initiating POST to ${API_BASE_URL}/customers with payload (first 300 chars):`, JSON.stringify(payload).substring(0,300) + "...");
  
  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  
  const response = await fetch(`${API_BASE_URL}/customers`, {
    method: 'POST',
    headers: headers,
    body: JSON.stringify(payload),
  });

  const responseText = await response.text();

  if (!response.ok) {
    let errorMessage = `Failed to create customer (Status: ${response.status} ${response.statusText || 'Unknown Status'})`;
    let errorDetails: any = null;
    console.error("createCustomer (client): Error response text (first 500 chars):", responseText.substring(0, 500));
    
    if (response.status === 504) {
        errorMessage = `Failed to create customer: The server took too long to respond (Gateway Timeout). Please try again later.`;
    } else {
        try {
            const contentType = response.headers.get("content-type");
            if (contentType && contentType.includes("application/json")) {
                const errorData = JSON.parse(responseText);
                errorMessage = errorData.message || errorData.error || errorMessage;
                errorDetails = errorData.errors || errorData.details || errorData;
                if (errorDetails && typeof errorDetails !== 'object') errorDetails = { info: errorDetails };
            } else if (responseText.toLowerCase().includes("<html")) {
                 errorMessage = `Server returned an unexpected HTML error (status: ${response.status}). Please check server logs.`;
                 console.error("Full HTML error from server (createCustomer):", responseText.substring(0,1000));
            }
            else { 
                errorMessage = `Server error while creating customer: ${responseText.substring(0, 200)}${responseText.length > 200 ? '...' : ''}`;
                console.error("Full non-JSON error from server (createCustomer):", responseText);
            }
        } catch (e) {
            console.error("Error processing/parsing error response (createCustomer):", e);
             errorMessage = `Failed to parse error response. Server returned status ${response.status}. Response preview: ${responseText.substring(0,100)}`;
        }
    }
    console.error("createCustomer (client): Throwing error:", errorMessage, "Details:", errorDetails);
    const err = new Error(errorMessage);
    (err as any).details = errorDetails;
    throw err;
  }

  try {
    const result = JSON.parse(responseText);
    if (!result.customer || !result.customer._id) { 
        console.error("Successful response, but 'customer' field or 'customer._id' missing (createCustomer):", result);
        throw new Error("Customer creation response was successful, but data format is incorrect.");
    }
    console.log("createCustomer (client): Successfully created customer:", result.customer._id);
    return { ...result, customer: { ...result.customer, id: result.customer._id }};
  } catch (e: any) {
    console.error("Error parsing successful JSON response (createCustomer):", e.message, "Body:", responseText.substring(0,500));
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
  lastContact: z.string().refine((val) => {
    try { return !!formatISO(parseISO(val)) } catch { return false }
  }, { message: "Invalid last contact date/time"}),
  status: z.enum(customerStatusOptions),
  acquisitionSource: z.string().optional(),
  tags: z.string().optional().transform(val => val ? val.split(',').map(tag => tag.trim()).filter(tag => tag) : []),
  lastSeenOnline: z.string().optional().refine(val => {
    if (!val) return true;
    try { return !!formatISO(parseISO(val)) } catch { return false }
  }, { message: "Invalid last seen online date/time" }),
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
        <p className="flex items-center"><CalendarDays className="h-4 w-4 mr-2 text-primary" />Last Contact: {customer.lastContact ? format(parseISO(customer.lastContact), "PPp") : 'N/A'}</p>
        {customer.lastSeenOnline && <p className="flex items-center"><Eye className="h-4 w-4 mr-2 text-primary" />Last Seen: {format(parseISO(customer.lastSeenOnline), "PPp")}</p>}
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
      </CardFooter>
    </Card>
  );
};

export default function CustomersPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { token } = useAuth();
  const [isAddCustomerDialogOpen, setIsAddCustomerDialogOpen] = useState(false);

  const { data: customers = [], isLoading, error, isFetching } = useQuery<Customer[]>({
    queryKey: ['customers'],
    queryFn: () => fetchCustomers(token),
  });

  const { control, handleSubmit, reset, formState: { errors: formErrors } } = useForm<z.infer<typeof customerFormSchema>>({
    resolver: zodResolver(customerFormSchema),
    defaultValues: {
      name: "",
      email: "",
      avatarUrl: "",
      company: "",
      totalSpend: 0,
      lastContact: formatISO(new Date()).substring(0, 16), 
      status: "New",
      acquisitionSource: "",
      tags: "",
      lastSeenOnline: formatISO(new Date()).substring(0, 16), 
    },
  });

  const createCustomerMutation = useMutation({
    mutationFn: (payload: CustomerCreationPayload) => createCustomer(payload, token),
    onSuccess: (data) => { 
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast({ title: "Customer Added", description: data.message || `Customer "${data.customer.name}" has been successfully added.` });
      setIsAddCustomerDialogOpen(false);
      reset({ 
        name: "", email: "", avatarUrl: "", company: "", totalSpend: 0,
        lastContact: formatISO(new Date()).substring(0, 16),
        status: "New", acquisitionSource: "", tags: "",
        lastSeenOnline: formatISO(new Date()).substring(0, 16),
      });
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
          } else if (errorDetails.info) {
              description += `\nInfo: ${errorDetails.info}`;
          }
      } else if (errorDetails) {
        description += `\nDetails: ${String(errorDetails)}`;
      }
      toast({ title: "Error Adding Customer", description: description, variant: "destructive", duration: 8000 });
    },
  });

  const onAddCustomerSubmit = (data: z.infer<typeof customerFormSchema>) => {
    const payload: CustomerCreationPayload = {
      ...data,
      lastContact: new Date(data.lastContact).toISOString(), 
      lastSeenOnline: data.lastSeenOnline ? new Date(data.lastSeenOnline).toISOString() : undefined,
      tags: data.tags || [], 
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

  if (error && !isFetching) { 
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
            <Dialog open={isAddCustomerDialogOpen} onOpenChange={(isOpen) => {
                setIsAddCustomerDialogOpen(isOpen);
                if (!isOpen) {
                    reset({ 
                        name: "", email: "", avatarUrl: "", company: "", totalSpend: 0,
                        lastContact: formatISO(new Date()).substring(0, 16),
                        status: "New", acquisitionSource: "", tags: "",
                        lastSeenOnline: formatISO(new Date()).substring(0, 16),
                    });
                }
            }}>
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
                    <Label htmlFor="lastContact">Last Contact Date & Time</Label>
                    <Controller 
                      name="lastContact" 
                      control={control} 
                      render={({ field }) => <Input id="lastContact" type="datetime-local" {...field} />} 
                    />
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
                    {formErrors.tags && <p className="text-red-500 text-xs mt-1">{formErrors.tags.message}</p>}
                  </div>
                  <div>
                    <Label htmlFor="lastSeenOnline">Last Seen Online (Optional)</Label>
                    <Controller 
                      name="lastSeenOnline" 
                      control={control} 
                      render={({ field }) => <Input id="lastSeenOnline" type="datetime-local" {...field} />} 
                    />
                    {formErrors.lastSeenOnline && <p className="text-red-500 text-xs mt-1">{formErrors.lastSeenOnline.message}</p>}
                  </div>
                  <DialogFooter className="mt-4">
                    <Button type="button" variant="outline" onClick={() => { setIsAddCustomerDialogOpen(false); reset(); }}>Cancel</Button>
                    <Button type="submit" disabled={createCustomerMutation.isPending}>
                      {createCustomerMutation.isPending && <FormLoader className="mr-2 h-4 w-4 animate-spin" />}
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
          <Card className="shadow-lg col-span-full"> 
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

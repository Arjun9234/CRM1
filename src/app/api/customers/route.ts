
import { NextResponse } from 'next/server';
import { collection, addDoc, getDocs, Timestamp, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Customer, CustomerCreationPayload, CustomerStatus } from '@/lib/types';
import { z } from 'zod';
import { subDays, formatISO } from 'date-fns';

const customerCreationSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  avatarUrl: z.string().url().optional().or(z.literal('')),
  company: z.string().optional(),
  totalSpend: z.number().min(0).default(0),
  lastContact: z.string().datetime(), // ISO String
  status: z.enum(['Active', 'Lead', 'Inactive', 'New', 'Archived']),
  tags: z.array(z.string()).optional(),
});

const dummyCustomers: Customer[] = [
  {
    id: "cust-dummy-1",
    name: "Aarav Patel",
    email: "aarav.patel@example.com",
    avatarUrl: "https://picsum.photos/seed/aarav/40/40",
    company: "Patel Innovations",
    totalSpend: 12500,
    lastContact: subDays(new Date(), 15).toISOString(),
    status: "Active",
    createdAt: subDays(new Date(), 180).toISOString(),
    tags: ["Tech", "VIP"],
  },
  {
    id: "cust-dummy-2",
    name: "Priya Sharma",
    email: "priya.sharma@example.net",
    avatarUrl: "https://picsum.photos/seed/priya/40/40",
    company: "Sharma Solutions",
    totalSpend: 800,
    lastContact: subDays(new Date(), 5).toISOString(),
    status: "Lead",
    createdAt: subDays(new Date(), 30).toISOString(),
    tags: ["Retail", "Prospect"],
  },
  {
    id: "cust-dummy-3",
    name: "Rohan Mehta",
    email: "rohan.mehta@example.org",
    avatarUrl: "https://picsum.photos/seed/rohan/40/40",
    company: "Mehta Consulting",
    totalSpend: 3400,
    lastContact: subDays(new Date(), 95).toISOString(),
    status: "Inactive",
    createdAt: subDays(new Date(), 300).toISOString(),
    tags: ["Services"],
  },
  {
    id: "cust-dummy-4",
    name: "Sanya Singh",
    email: "sanya.singh@example.com",
    avatarUrl: "https://picsum.photos/seed/sanya/40/40",
    company: "Singh Exports",
    totalSpend: 0,
    lastContact: subDays(new Date(), 2).toISOString(),
    status: "New",
    createdAt: subDays(new Date(), 2).toISOString(),
    tags: ["New Signup"],
  },
   {
    id: "cust-dummy-5",
    name: "Vikram Rao",
    email: "vikram.rao@example.co",
    avatarUrl: "https://picsum.photos/seed/vikram/40/40",
    company: "Rao Industries",
    totalSpend: 25000,
    lastContact: subDays(new Date(), 45).toISOString(),
    status: "Active",
    createdAt: subDays(new Date(), 500).toISOString(),
    tags: ["Enterprise", "Loyal"],
  }
];

export async function GET() {
  try {
    const customersCol = collection(db, 'customers');
    const q = query(customersCol, orderBy('createdAt', 'desc'));
    const customerSnapshot = await getDocs(q);

    if (customerSnapshot.empty) {
      return NextResponse.json(dummyCustomers.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime() ));
    }

    const customerList: Customer[] = customerSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: (data.createdAt as Timestamp)?.toDate().toISOString() || new Date().toISOString(),
        lastContact: (data.lastContact instanceof Timestamp ? data.lastContact.toDate().toISOString() : data.lastContact as string) || new Date().toISOString(),
        updatedAt: (data.updatedAt as Timestamp)?.toDate().toISOString(),
      } as Customer;
    });
    return NextResponse.json(customerList);
  } catch (error) {
    console.error("Error fetching customers:", error);
     if (error instanceof Error && error.message.includes('firestore/unavailable') || error.message.includes('auth/invalid-api-key')) {
        console.warn("Firebase unavailable, returning dummy customer data.");
        return NextResponse.json(dummyCustomers.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime() ));
    }
    return NextResponse.json({ message: 'Failed to fetch customers', error: (error as Error).message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validationResult = customerCreationSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json({ message: 'Invalid customer data', errors: validationResult.error.flatten().fieldErrors }, { status: 400 });
    }
    
    const { lastContact, ...restOfData } = validationResult.data;

    const newCustomerData: CustomerCreationPayload & { createdAt: Timestamp, lastContact: Timestamp } = {
      ...restOfData,
      lastContact: Timestamp.fromDate(new Date(lastContact)),
      createdAt: Timestamp.now(),
    };

    const customersCol = collection(db, 'customers');
    const docRef = await addDoc(customersCol, newCustomerData);
    
    const createdCustomer = {
        id: docRef.id,
        ...newCustomerData,
        createdAt: newCustomerData.createdAt.toDate().toISOString(),
        lastContact: newCustomerData.lastContact.toDate().toISOString(),
    }

    return NextResponse.json({ message: 'Customer created successfully', customer: createdCustomer }, { status: 201 });
  } catch (error) {
    console.error("Error creating customer:", error);
    return NextResponse.json({ message: 'Failed to create customer', error: (error as Error).message }, { status: 500 });
  }
}


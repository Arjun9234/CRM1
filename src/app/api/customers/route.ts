
import { NextResponse } from 'next/server';
import { collection, addDoc, getDocs, Timestamp, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Customer, CustomerCreationPayload } from '@/lib/types';
import { z } from 'zod';

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

export async function GET() {
  try {
    const customersCol = collection(db, 'customers');
    const q = query(customersCol, orderBy('createdAt', 'desc'));
    const customerSnapshot = await getDocs(q);
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

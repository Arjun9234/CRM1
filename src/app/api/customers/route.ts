import { NextResponse } from 'next/server';
import type { Customer, CustomerCreationPayload } from '@/lib/types';
import { z } from 'zod';
import { API_BASE_URL as BACKEND_API_BASE_URL } from '@/lib/config'; // Renamed to avoid conflict

const customerStatusOptions: ['Active', 'Lead', 'Inactive', 'New', 'Archived'] = ['Active', 'Lead', 'Inactive', 'New', 'Archived'];

const customerCreationSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  avatarUrl: z.string().url().optional().or(z.literal('')),
  company: z.string().optional(),
  totalSpend: z.number().min(0).default(0),
  lastContact: z.string().datetime({ offset: true }), 
  status: z.enum(customerStatusOptions),
  acquisitionSource: z.string().optional(),
  tags: z.array(z.string()).optional(),
  lastSeenOnline: z.string().datetime({ offset: true }).optional(),
});

// const API_BASE_URL = `http://localhost:${process.env.SERVER_PORT || 5000}/api`; // Removed

export async function GET() {
  try {
    const response = await fetch(`${BACKEND_API_BASE_URL}/customers`, {
      cache: 'no-store',
    });
    if (!response.ok) {
      const errorBody = await response.text();
      console.error("Error fetching customers from backend:", response.status, errorBody);
      try {
        const errorJson = JSON.parse(errorBody);
        throw new Error(errorJson.message || `Backend error: ${response.status}`);
      } catch {
        throw new Error(`Failed to fetch customers from backend. Status: ${response.status}. Response: ${errorBody.substring(0,100)}`);
      }
    }
    const customers: Customer[] = await response.json();
    return NextResponse.json(customers);
  } catch (error: any) {
    console.error("--- CRITICAL UNHANDLED ERROR IN GET /api/customers (Next.js API route) ---");
    console.error("Error Message:", error.message);
    return NextResponse.json(
      { message: 'Failed to fetch customers', error: error.message || 'Unknown server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    let body;
    try {
        body = await request.json();
    } catch (jsonError: any) {
        console.error("POST /api/customers (Next.js API route): Invalid JSON in request body:", jsonError.message);
        return NextResponse.json({ message: 'Invalid JSON payload provided.', error: jsonError.message }, { status: 400 });
    }
    
    const validationResult = customerCreationSchema.safeParse(body);
    if (!validationResult.success) {
      console.warn("POST /api/customers (Next.js API route): Validation failed for request body:", validationResult.error.flatten().fieldErrors);
      return NextResponse.json({
        message: 'Invalid customer data',
        errors: validationResult.error.flatten().fieldErrors
      }, { status: 400 });
    }

    const backendResponse = await fetch(`${BACKEND_API_BASE_URL}/customers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(validationResult.data),
    });
    
    const responseData = await backendResponse.json();

    if (!backendResponse.ok) {
      console.error("Error creating customer via backend:", backendResponse.status, responseData);
      throw new Error(responseData.message || `Backend error: ${backendResponse.status}`);
    }
    
    return NextResponse.json(responseData, { status: backendResponse.status });

  } catch (error: any) {
    console.error("--- CRITICAL ERROR IN POST /api/customers (Next.js API route) ---");
    console.error("Error Message:", error.message);
    return NextResponse.json({ message: 'Failed to create customer', error: error.message || 'Unknown server error' }, { status: 500 });
  }
}

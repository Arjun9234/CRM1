
import { NextResponse } from 'next/server';
import { collection, addDoc, getDocs, Timestamp, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Customer, CustomerCreationPayload, CustomerStatus } from '@/lib/types';
import { z } from 'zod';
import { subDays, formatISO, subHours } from 'date-fns';

const customerCreationSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  avatarUrl: z.string().url().optional().or(z.literal('')),
  company: z.string().optional(),
  totalSpend: z.number().min(0).default(0),
  lastContact: z.string().datetime({ offset: true, precision: 3 }), 
  status: z.enum(['Active', 'Lead', 'Inactive', 'New', 'Archived']),
  acquisitionSource: z.string().optional(),
  tags: z.array(z.string()).optional(),
  lastSeenOnline: z.string().datetime({ offset: true, precision: 3 }).optional(),
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
    acquisitionSource: "Organic Search",
    lastSeenOnline: subHours(new Date(), 2).toISOString(),
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
    acquisitionSource: "Referral",
    lastSeenOnline: subDays(new Date(), 1).toISOString(),
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
    acquisitionSource: "Social Media",
    lastSeenOnline: subDays(new Date(), 80).toISOString(),
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
    acquisitionSource: "Website Signup",
    lastSeenOnline: subHours(new Date(), 24).toISOString(),
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
    acquisitionSource: "Trade Show",
    lastSeenOnline: subDays(new Date(), 3).toISOString(),
    tags: ["Enterprise", "Loyal"],
  }
];

export async function GET() {
  console.log("GET /api/customers: Request received.");
  let firebaseCustomers: Customer[] = [];
  let firebaseErrorOccurred = false;

  try {
    if (!db) {
      console.warn("GET /api/customers: Firestore database is not initialized. Firebase interaction skipped.");
      firebaseErrorOccurred = true;
    } else {
      console.log("GET /api/customers: Firestore db instance available. Querying customers collection...");
      const customersCol = collection(db, 'customers');
      const q = query(customersCol, orderBy('createdAt', 'desc'));
      
      console.log("GET /api/customers: Attempting to fetch documents from Firestore...");
      const customerSnapshot = await getDocs(q);
      console.log(`GET /api/customers: Firestore getDocs call completed. Found ${customerSnapshot.docs.length} documents.`);

      if (!customerSnapshot.empty) {
        firebaseCustomers = customerSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            createdAt: (data.createdAt as Timestamp)?.toDate().toISOString() || new Date().toISOString(),
            lastContact: (data.lastContact instanceof Timestamp ? data.lastContact.toDate().toISOString() : data.lastContact as string) || new Date().toISOString(),
            lastSeenOnline: (data.lastSeenOnline instanceof Timestamp ? data.lastSeenOnline.toDate().toISOString() : data.lastSeenOnline as string),
            updatedAt: (data.updatedAt as Timestamp)?.toDate().toISOString(),
          } as Customer;
        });
      }
    }
  } catch (error) {
    console.error("Error fetching customers from Firebase (GET /api/customers):", error);
    firebaseErrorOccurred = true;
    if (error instanceof Error && (error.message.includes('firestore/unavailable') || error.message.includes('auth/invalid-api-key') || error.message.includes('Failed to fetch') || error.message.includes('deadline-exceeded'))) {
        console.warn("Firebase unavailable, auth error, network issue, or deadline exceeded during GET /api/customers. Error message:", error.message);
    }
  }

  const combinedCustomersMap = new Map<string, Customer>();

  dummyCustomers.forEach(customer => {
    combinedCustomersMap.set(customer.id, JSON.parse(JSON.stringify(customer))); 
  });

  firebaseCustomers.forEach(customer => {
    combinedCustomersMap.set(customer.id, customer);
  });
  
  const finalCustomerList = Array.from(combinedCustomersMap.values())
                               .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  if (firebaseErrorOccurred) {
     console.warn("GET /api/customers: Firebase error occurred. Response will rely on dummy data, potentially merged with any successfully fetched Firebase data if error was partial.");
  }
  
  console.log(`GET /api/customers: Returning ${finalCustomerList.length} customers after merging.`);
  return NextResponse.json(finalCustomerList);
}

export async function POST(request: Request) {
  console.log("POST /api/customers: Received request at", new Date().toISOString());
  try {
    if (!db) {
      console.error("POST /api/customers: Firestore database is not initialized. Check Firebase configuration.");
      return NextResponse.json({ message: 'Database not initialized. Ensure Firebase is correctly configured.' }, { status: 500 });
    }

    let body;
    try {
        body = await request.json();
    } catch (jsonError: any) {
        console.error("POST /api/customers: Invalid JSON in request body:", jsonError.message);
        return NextResponse.json({ message: 'Invalid JSON payload provided.', error: jsonError.message }, { status: 400 });
    }

    const validationResult = customerCreationSchema.safeParse(body);
    if (!validationResult.success) {
      console.warn("POST /api/customers: Validation failed for request body:", validationResult.error.flatten().fieldErrors);
      return NextResponse.json({
        message: 'Invalid customer data',
        errors: validationResult.error.flatten().fieldErrors
      }, { status: 400 });
    }

    const { lastContact, lastSeenOnline, ...restOfData } = validationResult.data;

    const newCustomerData = {
      ...restOfData,
      lastContact: Timestamp.fromDate(new Date(lastContact)),
      lastSeenOnline: lastSeenOnline ? Timestamp.fromDate(new Date(lastSeenOnline)) : Timestamp.now(),
      createdAt: Timestamp.now(),
    };

    const customersCol = collection(db, 'customers');
    let docRef;
    try {
        console.log("POST /api/customers: Attempting to add document to Firestore...");
        docRef = await addDoc(customersCol, newCustomerData);
        console.log("POST /api/customers: Document added successfully to Firestore with ID:", docRef.id);
    } catch (firestoreError: any) {
        console.error("--- Firestore addDoc Error in POST /api/customers ---");
        console.error("Timestamp:", new Date().toISOString());
        console.error("Error Message:", firestoreError.message);
        console.error("Error Code:", firestoreError.code);
        console.error("Data attempted to save (preview):", JSON.stringify(newCustomerData, null, 2).substring(0, 500) + "...");
        // console.error("Stack:", firestoreError.stack); // Stack can be very long
        console.error("--- End of Firestore addDoc Error ---");
        throw firestoreError;
    }

    const createdCustomerResponse: Customer = {
        id: docRef.id,
        name: newCustomerData.name,
        email: newCustomerData.email,
        avatarUrl: newCustomerData.avatarUrl,
        company: newCustomerData.company,
        totalSpend: newCustomerData.totalSpend,
        status: newCustomerData.status,
        acquisitionSource: newCustomerData.acquisitionSource,
        tags: newCustomerData.tags,
        lastContact: newCustomerData.lastContact.toDate().toISOString(),
        lastSeenOnline: newCustomerData.lastSeenOnline.toDate().toISOString(),
        createdAt: newCustomerData.createdAt.toDate().toISOString(),
    };

    console.log("POST /api/customers: Successfully created customer, returning 201 response.");
    return NextResponse.json({ message: 'Customer created successfully', customer: createdCustomerResponse }, { status: 201 });

  } catch (error: any) {
    console.error("--- CRITICAL ERROR IN POST /api/customers ---");
    console.error("Timestamp:", new Date().toISOString());

    let errorMessage = 'An unexpected error occurred while creating the customer.';
    let errorDetails: Record<string, any> = { rawError: String(error) };

    if (error.name === 'FirebaseError' || (error.code && typeof error.code === 'string' && (error.code.startsWith('firebase') || error.code.startsWith('firestore')))) {
        errorMessage = `Firebase error: ${error.message} (Code: ${error.code || 'N/A'})`;
        errorDetails = { type: 'FirebaseError', code: error.code, firebaseMessage: error.message };
    } else if (error instanceof z.ZodError) {
        errorMessage = 'Invalid data format for customer creation.';
        errorDetails = error.flatten().fieldErrors;
    } else if (error instanceof SyntaxError && error.message.includes("JSON")) {
        errorMessage = 'Invalid JSON payload provided (caught by main try-catch).';
        errorDetails = { type: 'SyntaxError', syntaxErrorMessage: error.message };
    } else if (error instanceof Error) {
        errorMessage = error.message;
        errorDetails = { type: 'GenericError', genericErrorMessage: error.message, stackPreview: error.stack?.substring(0, 300) };
    }

    let safeDetailsForResponse: any = { message: "Details not available or not serializable." };
    if (errorDetails && typeof errorDetails === 'object') {
        safeDetailsForResponse = {};
        for (const key in errorDetails) {
            if (Object.prototype.hasOwnProperty.call(errorDetails, key)) {
                const value = errorDetails[key];
                // Allow simple primitive types and arrays of strings
                if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean' || value === null) {
                    safeDetailsForResponse[key] = value;
                } else if (Array.isArray(value) && value.every(item => typeof item === 'string')) {
                     safeDetailsForResponse[key] = value;
                } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) { // Handle nested objects (e.g. Zod fieldErrors)
                    safeDetailsForResponse[key] = {};
                    for(const nestedKey in value as Record<string, any>) {
                        if (Object.prototype.hasOwnProperty.call(value, nestedKey)) {
                            const nestedValue = (value as Record<string, any>)[nestedKey];
                             if (typeof nestedValue === 'string' || (Array.isArray(nestedValue) && nestedValue.every(item => typeof item === 'string'))) {
                                safeDetailsForResponse[key][nestedKey] = nestedValue;
                             } else {
                                safeDetailsForResponse[key][nestedKey] = "[Non-Serializable Nested Value]";
                             }
                        }
                    }
                } else {
                    safeDetailsForResponse[key] = "[Non-Serializable Value]";
                }
            }
        }
    } else if (typeof errorDetails === 'string') { // If errorDetails itself is just a string
        safeDetailsForResponse = { originalDetails: errorDetails };
    }

    console.error("Error Message:", errorMessage);
    console.error("Error Details (Processed for logging):", JSON.stringify(safeDetailsForResponse, null, 2));
    console.error("--- End of Critical Error in POST /api/customers ---");

    const safeErrorMessageForResponse = typeof errorMessage === 'string' && errorMessage.length < 200 ? errorMessage : 'An unexpected error occurred.';
    return NextResponse.json({ 
        message: 'Failed to create customer', 
        error: safeErrorMessageForResponse, 
        details: safeDetailsForResponse // Use the sanitized details
    }, { status: 500 });
  }
}

    
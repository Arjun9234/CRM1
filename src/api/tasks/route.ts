
import { NextResponse } from 'next/server';
import { collection, addDoc, getDocs, Timestamp, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Task, TaskCreationPayload, TaskStatus, TaskPriority } from '@/lib/types';
import { z } from 'zod';
import { subDays, addDays, formatISO } from 'date-fns';

const taskCreationSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  dueDate: z.string().datetime({ message: "Due date must be a valid ISO 8601 datetime string" }), 
  status: z.enum(['To Do', 'In Progress', 'Completed', 'Blocked', 'Archived']),
  priority: z.enum(['High', 'Medium', 'Low']),
  assignedTo: z.string().optional(),
  project: z.string().optional(), 
  tags: z.array(z.string()).optional(), // Expecting an array of strings
});

const dummyTasks: Task[] = [
  {
    id: "task-dummy-1",
    title: "Prepare Q3 Marketing Strategy",
    description: "Draft the overall marketing strategy for the upcoming quarter, including budget allocation and key campaigns.",
    dueDate: addDays(new Date(), 10).toISOString(),
    status: "In Progress",
    priority: "High",
    assignedTo: "Priya Sharma",
    project: "Strategic Planning",
    createdAt: subDays(new Date(), 2).toISOString(),
    tags: ["Strategy", "Q3", "Marketing"],
  },
  {
    id: "task-dummy-2",
    title: "Follow up with new leads",
    description: "Contact all new leads generated from the 'Welcome New Users' campaign.",
    dueDate: addDays(new Date(), 3).toISOString(),
    status: "To Do",
    priority: "Medium",
    assignedTo: "Rohan Mehta",
    project: "Sales Pipeline",
    createdAt: subDays(new Date(), 1).toISOString(),
    tags: ["Sales", "Leads"],
  },
  {
    id: "task-dummy-3",
    title: "Analyze Summer Sale Performance",
    description: "Review metrics from the Summer Sale campaign and prepare a report on effectiveness and ROI.",
    dueDate: subDays(new Date(), 5).toISOString(), 
    status: "Completed",
    priority: "High",
    assignedTo: "Aarav Patel",
    project: "Campaign Analytics",
    createdAt: subDays(new Date(), 15).toISOString(),
    updatedAt: subDays(new Date(), 4).toISOString(),
    tags: ["Analytics", "Report", "Sales"],
  },
  {
    id: "task-dummy-4",
    title: "Update Website FAQ Section",
    description: "Incorporate new questions and answers based on recent customer support tickets.",
    dueDate: addDays(new Date(), 7).toISOString(),
    status: "To Do",
    priority: "Low",
    assignedTo: "Sanya Singh",
    project: "Website Maintenance",
    createdAt: new Date().toISOString(),
    tags: ["Website", "Content"],
  },
  {
    id: "task-dummy-5",
    title: "Onboard New Enterprise Client",
    description: "Kick-off meeting and initial setup for Rao Industries. Waiting for client's security clearance.",
    dueDate: addDays(new Date(), 1).toISOString(),
    status: "Blocked",
    priority: "High",
    assignedTo: "Vikram Rao",
    project: "Client Onboarding",
    createdAt: subDays(new Date(), 3).toISOString(),
    tags: ["Client", "Onboarding", "Enterprise"],
  },
   {
    id: "task-dummy-6",
    title: "Plan Team Building Activity",
    description: "Organize a fun and engaging activity for the team for next month.",
    dueDate: addDays(new Date(), 25).toISOString(),
    status: "To Do",
    priority: "Medium",
    assignedTo: "Priya Sharma",
    project: "HR Initiatives",
    createdAt: new Date().toISOString(),
    tags: ["HR", "Team Event"],
  }
];

export async function GET(request: Request) {
  console.log("GET /api/tasks: Request received at", new Date().toISOString());
  const url = new URL(request.url);
  console.log("GET /api/tasks: Request URL:", url.pathname + url.search);

  try {
    if (!db) {
        console.warn("GET /api/tasks: Firestore database is not initialized. Likely Firebase config issue. Returning dummy data.");
        return NextResponse.json(dummyTasks.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime() ));
    }
    console.log("GET /api/tasks: Firestore DB instance available. Querying tasks collection...");
    const tasksCol = collection(db, 'tasks');
    const q = query(tasksCol, orderBy('createdAt', 'desc')); 
    const taskSnapshot = await getDocs(q);
    console.log(`GET /api/tasks: Firestore getDocs call completed. Found ${taskSnapshot.docs.length} documents.`);

    let taskList: Task[] = [];
    if (!taskSnapshot.empty) {
      taskList = taskSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: (data.createdAt as Timestamp)?.toDate().toISOString() || new Date().toISOString(),
          dueDate: (data.dueDate instanceof Timestamp ? data.dueDate.toDate().toISOString() : data.dueDate as string) || new Date().toISOString(),
          updatedAt: (data.updatedAt as Timestamp)?.toDate().toISOString(),
        } as Task;
      });
    }
    
    const combinedTasksMap = new Map<string, Task>();
    dummyTasks.forEach(task => combinedTasksMap.set(task.id, JSON.parse(JSON.stringify(task)))); 
    taskList.forEach(task => combinedTasksMap.set(task.id, task));
    
    const finalTaskList = Array.from(combinedTasksMap.values())
                               .sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    console.log(`GET /api/tasks: Returning ${finalTaskList.length} tasks after merging.`);
    return NextResponse.json(finalTaskList);

  } catch (error: any) {
    console.error("--- CRITICAL ERROR IN GET /api/tasks ---");
    console.error("Timestamp:", new Date().toISOString());
    console.error("Error Message:", error.message);
    console.error("Error Stack:", error.stack);

    if (error instanceof Error && (error.message.includes('firestore/unavailable') || error.message.includes('auth/invalid-api-key') || error.message.includes('Failed to fetch') || error.message.includes('deadline-exceeded'))) {
        console.warn("GET /api/tasks: Firebase unavailable, auth error, network issue, or deadline exceeded. Returning dummy task data as fallback.");
        return NextResponse.json(dummyTasks.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime() ));
    }
    
    console.error("--- End of Critical Error in GET /api/tasks ---");
    return NextResponse.json({ message: 'Failed to fetch tasks due to an unexpected server error.', error: error.message || 'Unknown server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  console.log("POST /api/tasks: Received request at", new Date().toISOString());
  try {
    if (!db) { 
      console.error("POST /api/tasks: Firestore database is not initialized. Firebase SDK might not have loaded correctly or config is missing/invalid. Check server startup logs for 'Firebase initialization' messages.");
      return NextResponse.json({ message: 'Database not initialized. Server configuration issue.', error: 'DB_INIT_FAILURE' }, { status: 503 }); 
    }
    console.log("POST /api/tasks: Firestore DB instance appears available.");

    let body;
    const rawBody = await request.text(); 
    console.log("POST /api/tasks: Raw request body (first 500 chars):", rawBody.substring(0, 500) + (rawBody.length > 500 ? "..." : ""));
    
    try {
        body = JSON.parse(rawBody); 
    } catch (jsonError: any) {
        console.error("POST /api/tasks: Invalid JSON in request body:", jsonError.message);
        console.error("POST /api/tasks: Raw body that failed parsing:", rawBody);
        return NextResponse.json({ message: 'Invalid JSON payload provided.', error: jsonError.message, details: "Request body could not be parsed as JSON." }, { status: 400 });
    }
    
    console.log("POST /api/tasks: Parsed request body (first 1000 chars):", JSON.stringify(body, null, 2).substring(0, 1000) + (JSON.stringify(body, null, 2).length > 1000 ? "..." : ""));
    
    const validationResult = taskCreationSchema.safeParse(body);
    if (!validationResult.success) {
      console.warn("POST /api/tasks: Validation failed for request body:", validationResult.error.flatten().fieldErrors);
      return NextResponse.json({ 
        message: 'Invalid task data', 
        errors: validationResult.error.flatten().fieldErrors 
      }, { status: 400 });
    }
    console.log("POST /api/tasks: Request body validated successfully.");
    
    const { dueDate, tags, ...restOfData } = validationResult.data;

    const newTaskDataForFirestore = {
      ...restOfData,
      tags: tags || [], // Ensure tags is an array
      dueDate: Timestamp.fromDate(new Date(dueDate)), 
      createdAt: Timestamp.now(),
    };

    console.log("POST /api/tasks: Data being sent to Firestore (first 500 chars of stringified):", JSON.stringify(newTaskDataForFirestore, (key, value) => typeof value === 'bigint' ? value.toString() : value, 2).substring(0, 500) + "...");


    const tasksCol = collection(db, 'tasks');
    let docRef;
    try {
        console.log("POST /api/tasks: Attempting to add document to Firestore...");
        docRef = await addDoc(tasksCol, newTaskDataForFirestore);
        console.log("POST /api/tasks: Document added successfully to Firestore with ID:", docRef.id);
    } catch (firestoreError: any) {
        console.error("--- Firestore addDoc Error in POST /api/tasks ---");
        console.error("Timestamp:", new Date().toISOString());
        console.error("Error Message:", firestoreError.message);
        console.error("Error Code:", firestoreError.code);
        console.error("Data attempted to save (preview):", JSON.stringify(newTaskDataForFirestore, null, 2).substring(0, 500) + "...");
        console.error("Stack:", firestoreError.stack); 
        console.error("--- End of Firestore addDoc Error ---");
        return NextResponse.json({ message: 'Failed to save task to database.', error: firestoreError.message, code: firestoreError.code }, { status: 500 });
    }
    
    const createdTaskResponse = {
        id: docRef.id,
        title: newTaskDataForFirestore.title,
        description: newTaskDataForFirestore.description,
        dueDate: newTaskDataForFirestore.dueDate.toDate().toISOString(),
        status: newTaskDataForFirestore.status,
        priority: newTaskDataForFirestore.priority,
        assignedTo: newTaskDataForFirestore.assignedTo,
        project: newTaskDataForFirestore.project,
        tags: newTaskDataForFirestore.tags,
        createdAt: newTaskDataForFirestore.createdAt.toDate().toISOString(),
    };

    console.log("POST /api/tasks: Successfully created task, returning 201 response.");
    return NextResponse.json({ message: 'Task created successfully', task: createdTaskResponse }, { status: 201 });

  } catch (error: any) {
    console.error("--- CRITICAL UNHANDLED ERROR IN POST /api/tasks ---");
    console.error("Timestamp:", new Date().toISOString());
    
    let errorMessage = 'An unexpected error occurred while creating the task.';
    let errorDetailsForLogging: Record<string, any> = { rawError: String(error) };
    let statusCode = 500;

    if (error.name === 'FirebaseError' || (error.code && typeof error.code === 'string' && (error.code.startsWith('firebase') || error.code.startsWith('firestore')))) {
        errorMessage = `Firebase error: ${error.message} (Code: ${error.code || 'N/A'})`;
        errorDetailsForLogging = { type: 'FirebaseError', code: error.code, firebaseMessage: error.message, stack: error.stack };
    } else if (error instanceof z.ZodError) {
        errorMessage = 'Invalid data format for task creation.';
        errorDetailsForLogging = error.flatten();
        statusCode = 400;
    } else if (error instanceof SyntaxError && error.message.includes("JSON")) {
        errorMessage = 'Invalid JSON payload provided (caught by main try-catch).';
        errorDetailsForLogging = { type: 'SyntaxError', syntaxErrorMessage: error.message, stack: error.stack };
        statusCode = 400;
    } else if (error instanceof Error) {
        errorMessage = error.message;
        errorDetailsForLogging = { type: 'GenericError', genericErrorMessage: error.message, stack: error.stack };
    }
    
    console.error("Error Message:", errorMessage);
    console.error("Error Details (Processed for logging):", JSON.stringify(errorDetailsForLogging, null, 2));
    console.error("--- End of Critical Error in POST /api/tasks ---");
    
    const safeErrorMessageForClientResponse = typeof errorMessage === 'string' && errorMessage.length < 200 ? errorMessage : 'An unexpected server error occurred.';
    
    let safeDetailsForClientResponse: any = { message: "Detailed error information logged on server." };
     if (statusCode === 400 && errorDetailsForLogging.fieldErrors) {
        safeDetailsForClientResponse = { validationErrors: errorDetailsForLogging.fieldErrors };
    } else if (errorDetailsForLogging.code) {
        safeDetailsForClientResponse = { code: errorDetailsForLogging.code };
    }

    return NextResponse.json({ 
        message: 'Failed to create task', 
        error: safeErrorMessageForClientResponse, 
        details: safeDetailsForClientResponse 
    }, { status: statusCode });
  }
}

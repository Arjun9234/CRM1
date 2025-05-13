import { NextResponse } from 'next/server';
import type { Task, TaskCreationPayload } from '@/lib/types';
import { z } from 'zod';
import { API_BASE_URL as BACKEND_API_BASE_URL } from '@/lib/config'; // Renamed to avoid conflict

const taskStatusOptions: ['To Do', 'In Progress', 'Completed', 'Blocked', 'Archived'] = ['To Do', 'In Progress', 'Completed', 'Blocked', 'Archived'];
const taskPriorityOptions: ['High', 'Medium', 'Low'] = ['High', 'Medium', 'Low'];

const taskCreationSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  dueDate: z.string().datetime(), 
  status: z.enum(taskStatusOptions),
  priority: z.enum(taskPriorityOptions),
  assignedTo: z.string().optional(),
  project: z.string().optional(), 
  tags: z.array(z.string()).optional(),
});

// const API_BASE_URL = `http://localhost:${process.env.SERVER_PORT || 5000}/api`; // Removed

export async function GET() {
  try {
    const response = await fetch(`${BACKEND_API_BASE_URL}/tasks`, {
      cache: 'no-store',
    });
    if (!response.ok) {
      const errorBody = await response.text();
      console.error("Error fetching tasks from backend:", response.status, errorBody);
       try {
        const errorJson = JSON.parse(errorBody);
        throw new Error(errorJson.message || `Backend error: ${response.status}`);
      } catch {
        throw new Error(`Failed to fetch tasks from backend. Status: ${response.status}. Response: ${errorBody.substring(0,100)}`);
      }
    }
    const tasks: Task[] = await response.json();
    return NextResponse.json(tasks);
  } catch (error: any) {
    console.error("--- CRITICAL UNHANDLED ERROR IN GET /api/tasks (Next.js API route) ---");
    console.error("Error Message:", error.message);
    return NextResponse.json(
      { message: 'Failed to fetch tasks', error: error.message || 'Unknown server error' },
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
        console.error("POST /api/tasks (Next.js API route): Invalid JSON in request body:", jsonError.message);
        return NextResponse.json({ message: 'Invalid JSON payload provided.', error: jsonError.message }, { status: 400 });
    }
    
    const validationResult = taskCreationSchema.safeParse(body);
    if (!validationResult.success) {
      console.warn("POST /api/tasks (Next.js API route): Validation failed for request body:", validationResult.error.flatten().fieldErrors);
      return NextResponse.json({ 
        message: 'Invalid task data', 
        errors: validationResult.error.flatten().fieldErrors 
      }, { status: 400 });
    }
    
    const backendResponse = await fetch(`${BACKEND_API_BASE_URL}/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(validationResult.data),
    });

    const responseData = await backendResponse.json();

    if (!backendResponse.ok) {
      console.error("Error creating task via backend:", backendResponse.status, responseData);
      throw new Error(responseData.message || `Backend error: ${backendResponse.status}`);
    }
    
    return NextResponse.json(responseData, { status: backendResponse.status });

  } catch (error: any) {
    console.error("--- CRITICAL ERROR IN POST /api/tasks (Next.js API route) ---");
    console.error("Error Message:", error.message);
    return NextResponse.json({ message: 'Failed to create task', error: error.message || 'Unknown server error' }, { status: 500 });
  }
}

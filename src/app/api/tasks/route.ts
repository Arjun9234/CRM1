
import { NextResponse } from 'next/server';
import { collection, addDoc, getDocs, Timestamp, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Task, TaskCreationPayload } from '@/lib/types';
import { z } from 'zod';

const taskCreationSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  dueDate: z.string().datetime(), // ISO String
  status: z.enum(['To Do', 'In Progress', 'Completed', 'Blocked', 'Archived']),
  priority: z.enum(['High', 'Medium', 'Low']),
  assignedTo: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export async function GET() {
  try {
    const tasksCol = collection(db, 'tasks');
    const q = query(tasksCol, orderBy('createdAt', 'desc')); // or orderBy('dueDate')
    const taskSnapshot = await getDocs(q);
    const taskList: Task[] = taskSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: (data.createdAt as Timestamp)?.toDate().toISOString() || new Date().toISOString(),
        dueDate: (data.dueDate instanceof Timestamp ? data.dueDate.toDate().toISOString() : data.dueDate as string) || new Date().toISOString(),
        updatedAt: (data.updatedAt as Timestamp)?.toDate().toISOString(),
      } as Task;
    });
    return NextResponse.json(taskList);
  } catch (error) {
    console.error("Error fetching tasks:", error);
    return NextResponse.json({ message: 'Failed to fetch tasks', error: (error as Error).message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validationResult = taskCreationSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json({ message: 'Invalid task data', errors: validationResult.error.flatten().fieldErrors }, { status: 400 });
    }
    
    const { dueDate, ...restOfData } = validationResult.data;

    const newTaskData: TaskCreationPayload & { createdAt: Timestamp, dueDate: Timestamp } = {
      ...restOfData,
      dueDate: Timestamp.fromDate(new Date(dueDate)),
      createdAt: Timestamp.now(),
    };

    const tasksCol = collection(db, 'tasks');
    const docRef = await addDoc(tasksCol, newTaskData);
    
    const createdTask = {
        id: docRef.id,
        ...newTaskData,
        createdAt: newTaskData.createdAt.toDate().toISOString(),
        dueDate: newTaskData.dueDate.toDate().toISOString(),
    }
    return NextResponse.json({ message: 'Task created successfully', task: createdTask }, { status: 201 });
  } catch (error) {
    console.error("Error creating task:", error);
    return NextResponse.json({ message: 'Failed to create task', error: (error as Error).message }, { status: 500 });
  }
}

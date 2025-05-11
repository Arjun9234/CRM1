
import { NextResponse } from 'next/server';
import { collection, addDoc, getDocs, Timestamp, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Task, TaskCreationPayload, TaskStatus, TaskPriority } from '@/lib/types';
import { z } from 'zod';
import { subDays, addDays, formatISO } from 'date-fns';

const taskCreationSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  dueDate: z.string().datetime(), // ISO String
  status: z.enum(['To Do', 'In Progress', 'Completed', 'Blocked', 'Archived']),
  priority: z.enum(['High', 'Medium', 'Low']),
  assignedTo: z.string().optional(),
  project: z.string().optional(), // Added project field
  tags: z.array(z.string()).optional(),
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
    dueDate: subDays(new Date(), 5).toISOString(), // Past due
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

export async function GET() {
  try {
    const tasksCol = collection(db, 'tasks');
    const q = query(tasksCol, orderBy('createdAt', 'desc')); // or orderBy('dueDate')
    const taskSnapshot = await getDocs(q);

    if (taskSnapshot.empty) {
      return NextResponse.json(dummyTasks.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime() ));
    }

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
    if (error instanceof Error && error.message.includes('firestore/unavailable') || error.message.includes('auth/invalid-api-key')) {
        console.warn("Firebase unavailable, returning dummy task data.");
        return NextResponse.json(dummyTasks.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime() ));
    }
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


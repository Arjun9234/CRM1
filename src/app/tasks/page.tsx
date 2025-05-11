
"use client";
import AppLayout from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ListChecks, PlusCircle, CalendarDays, User, Tag, Flag } from "lucide-react";
import type { Task, TaskStatus, TaskPriority } from "@/lib/types";
import { format, subDays, addDays } from "date-fns";

const dummyTasks: Task[] = [
  {
    id: "task_001",
    title: "Follow up with new leads from last week",
    description: "Review list of new sign-ups and send personalized welcome emails or make calls.",
    dueDate: addDays(new Date(), 2).toISOString(),
    status: "To Do",
    priority: "High",
    assignedTo: "Demo User",
    createdAt: subDays(new Date(), 1).toISOString(),
    tags: ["Sales", "Leads"],
  },
  {
    id: "task_002",
    title: "Prepare Q3 marketing report",
    description: "Compile data on campaign performance, website traffic, and lead generation for Q3.",
    dueDate: addDays(new Date(), 7).toISOString(),
    status: "In Progress",
    priority: "Medium",
    assignedTo: "Demo User",
    createdAt: subDays(new Date(), 5).toISOString(),
    tags: ["Marketing", "Reporting"],
  },
  {
    id: "task_003",
    title: "Onboard client 'Innovatech Ltd.'",
    description: "Complete onboarding checklist, schedule kick-off meeting, and set up their account.",
    dueDate: subDays(new Date(), 1).toISOString(), // Past due
    status: "To Do",
    priority: "High",
    assignedTo: "Alice Johnson",
    createdAt: subDays(new Date(), 3).toISOString(),
    tags: ["Client Success", "Onboarding"],
  },
  {
    id: "task_004",
    title: "Update CRM documentation for new features",
    description: "Add sections for the new AI segment builder and message suggestion tools.",
    dueDate: addDays(new Date(), 14).toISOString(),
    status: "To Do",
    priority: "Low",
    assignedTo: "Tech Team",
    createdAt: subDays(new Date(), 2).toISOString(),
    tags: ["Documentation", "Product"],
  },
  {
    id: "task_005",
    title: "Resolve support ticket #12345",
    description: "User reported issue with login on mobile. Needs investigation.",
    dueDate: new Date().toISOString(),
    status: "Completed",
    priority: "Medium",
    assignedTo: "Bob Williams",
    createdAt: subDays(new Date(), 4).toISOString(),
    tags: ["Support", "Bug Fix"],
  },
   {
    id: "task_006",
    title: "Plan social media content for next month",
    description: "Brainstorm themes, create a content calendar, and schedule posts.",
    dueDate: addDays(new Date(), 10).toISOString(),
    status: "In Progress",
    priority: "Medium",
    assignedTo: "Carol Davis",
    createdAt: subDays(new Date(), 1).toISOString(),
    tags: ["Marketing", "Social Media"],
  },
];

const priorityVariantMap: Record<TaskPriority, "default" | "secondary" | "destructive"> = {
    High: "destructive",
    Medium: "default", // Often yellow or orange in task apps
    Low: "secondary",
};

const statusColorMap: Record<TaskStatus, string> = {
    'To Do': 'bg-blue-500 hover:bg-blue-600',
    'In Progress': 'bg-yellow-500 hover:bg-yellow-600 text-black',
    'Completed': 'bg-green-500 hover:bg-green-600',
    'Blocked': 'bg-red-500 hover:bg-red-600',
};

const TaskCard = ({ task }: { task: Task }) => {
  const isPastDue = new Date(task.dueDate) < new Date() && task.status !== "Completed";
  return (
    <Card className="shadow-md hover:shadow-lg transition-shadow flex flex-col">
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg">{task.title}</CardTitle>
          <Badge variant={priorityVariantMap[task.priority]}
           className={
            task.priority === "High" ? "border-red-500 text-red-700 dark:text-red-400" :
            task.priority === "Medium" ? "border-yellow-500 text-yellow-700 dark:text-yellow-400" :
            "border-gray-500 text-gray-700 dark:text-gray-400"
           }
          >
             <Flag className="mr-1 h-3 w-3" /> {task.priority}
          </Badge>
        </div>
        <CardDescription className="flex items-center text-xs text-muted-foreground gap-1 pt-1">
          <CalendarDays className="h-3 w-3" /> Due: {format(new Date(task.dueDate), "MMM dd, yyyy")}
          {isPastDue && <span className="text-red-500 font-semibold ml-1">(Past Due)</span>}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 flex-grow">
        {task.description && <p className="text-sm text-muted-foreground line-clamp-3">{task.description}</p>}
        <div className="flex items-center text-xs text-muted-foreground">
          <User className="h-3 w-3 mr-1" /> Assigned to: {task.assignedTo || "Unassigned"}
        </div>
        {task.tags && task.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 items-center text-xs">
            <Tag className="h-3 w-3 mr-1 text-muted-foreground" />
            {task.tags.map(tag => (
              <Badge key={tag} variant="outline" className="font-normal">{tag}</Badge>
            ))}
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between items-center">
         <Badge className={`${statusColorMap[task.status]} text-white`}>
            {task.status}
         </Badge>
        <Button variant="link" size="sm" className="text-primary p-0 h-auto text-xs">View Details</Button>
      </CardFooter>
    </Card>
  )
};

export default function TasksPage() {
  const tasksByStatus = dummyTasks.reduce((acc, task) => {
    if (!acc[task.status]) {
      acc[task.status] = [];
    }
    acc[task.status].push(task);
    return acc;
  }, {} as Record<TaskStatus, Task[]>);

  const statusOrder: TaskStatus[] = ["To Do", "In Progress", "Completed", "Blocked"];


  return (
    <AppLayout>
      <div className="space-y-6">
         <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
           <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Task Manager</h1>
           <Button className="w-full sm:w-auto">
             <PlusCircle className="mr-2 h-5 w-5" />
             Add New Task
           </Button>
         </div>

        {dummyTasks.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {statusOrder.map(status => (
              tasksByStatus[status] && tasksByStatus[status].length > 0 && (
                <div key={status} className="space-y-4">
                  <h2 className={`text-xl font-semibold px-1 py-2 rounded-md flex items-center gap-2`}>
                    <Badge className={`${statusColorMap[status]} text-white px-2 py-1 text-sm`}>{status}</Badge> 
                    <span className="text-muted-foreground">({tasksByStatus[status].length})</span>
                  </h2>
                  <div className="space-y-4">
                    {tasksByStatus[status]
                      .sort((a,b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()) // Sort by due date
                      .map(task => <TaskCard key={task.id} task={task} />)
                    }
                  </div>
                </div>
              )
            ))}
          </div>
        ) : (
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <ListChecks className="h-6 w-6 text-primary" />
                Your Tasks
              </CardTitle>
              <CardDescription>
                Stay organized and keep track of your to-dos.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center text-center p-10 border-2 border-dashed rounded-lg bg-muted/20 min-h-[300px]">
                <ListChecks className="h-16 w-16 text-muted-foreground mb-4" />
                <h2 className="text-2xl font-semibold text-muted-foreground">No Tasks Yet!</h2>
                <p className="text-muted-foreground mt-2 max-w-md">
                  Create your first task to get started. Efficiently manage your activities, set reminders, and never miss a deadline.
                </p>
                 <Button className="mt-6">
                    <PlusCircle className="mr-2 h-5 w-5" />
                    Create First Task
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}


"use client";
import AppLayout from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ListChecks, PlusCircle, CalendarDays, User, Tag, Flag, Loader2, AlertTriangle, FolderKanban } from "lucide-react"; // Added FolderKanban for project
import type { Task, TaskStatus, TaskPriority, TaskCreationPayload } from "@/lib/types";
import { format, formatISO, addDays } from "date-fns";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertTitle, AlertDescription as UiAlertDescription } from "@/components/ui/alert"; // Renamed AlertDescription to avoid conflict

async function fetchTasks(): Promise<Task[]> {
  const response = await fetch('/api/tasks');
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to fetch tasks');
  }
  return response.json();
}

async function createTask(payload: TaskCreationPayload): Promise<Task> {
    const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create task');
    }
    const result = await response.json();
    return result.task;
}

const taskFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  dueDate: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Invalid date"}),
  priority: z.enum(['High', 'Medium', 'Low']).default('Medium'),
  status: z.enum(['To Do', 'In Progress', 'Completed', 'Blocked', 'Archived']).default('To Do'),
  assignedTo: z.string().optional(),
  project: z.string().optional(), // Added project
  tags: z.string().optional().transform(val => val ? val.split(',').map(tag => tag.trim()).filter(tag => tag) : []),
});


const priorityVariantMap: Record<TaskPriority, "default" | "secondary" | "destructive"> = {
    High: "destructive",
    Medium: "default", 
    Low: "secondary",
};

const statusColorMap: Record<TaskStatus, string> = {
    'To Do': 'bg-blue-500 hover:bg-blue-600',
    'In Progress': 'bg-yellow-500 hover:bg-yellow-600 text-black',
    'Completed': 'bg-green-500 hover:bg-green-600',
    'Blocked': 'bg-red-500 hover:bg-red-600',
    'Archived': 'bg-gray-500 hover:bg-gray-600',
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
          <CalendarDays className="h-3 w-3" /> Due: {task.dueDate ? format(new Date(task.dueDate), "MMM dd, yyyy") : 'N/A'}
          {isPastDue && <span className="text-red-500 font-semibold ml-1">(Past Due)</span>}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 flex-grow">
        {task.description && <p className="text-sm text-muted-foreground line-clamp-3">{task.description}</p>}
        {task.project && (
            <div className="flex items-center text-xs text-muted-foreground">
                <FolderKanban className="h-3 w-3 mr-1" /> Project: {task.project}
            </div>
        )}
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
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddTaskDialogOpen, setIsAddTaskDialogOpen] = useState(false);

  const { data: tasks = [], isLoading, error } = useQuery<Task[]>({
    queryKey: ['tasks'],
    queryFn: fetchTasks,
  });

  const { control, handleSubmit, reset, formState: { errors: formErrors } } = useForm<z.infer<typeof taskFormSchema>>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      title: "",
      description: "",
      dueDate: formatISO(addDays(new Date(), 7)).split('T')[0], 
      priority: "Medium",
      status: "To Do",
      assignedTo: "",
      project: "", // Added project
      tags: "",
    },
  });

  const createTaskMutation = useMutation({
    mutationFn: createTask,
    onSuccess: (newTask) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast({ title: "Task Added", description: `Task "${newTask.title}" has been successfully added.` });
      setIsAddTaskDialogOpen(false);
      reset();
    },
    onError: (error: Error) => {
      toast({ title: "Error Adding Task", description: error.message, variant: "destructive" });
    },
  });

  const onAddTaskSubmit = (data: z.infer<typeof taskFormSchema>) => {
    const payload: TaskCreationPayload = {
      ...data,
      dueDate: formatISO(new Date(data.dueDate)), 
      tags: data.tags || [],
      project: data.project || undefined, // Ensure project is passed
    };
    createTaskMutation.mutate(payload);
  };

  const tasksByStatus = tasks.reduce((acc, task) => {
    const statusKey = task.status as TaskStatus; 
    if (!acc[statusKey]) {
      acc[statusKey] = [];
    }
    acc[statusKey].push(task);
    return acc;
  }, {} as Record<TaskStatus, Task[]>);

  const statusOrder: TaskStatus[] = ["To Do", "In Progress", "Completed", "Blocked", "Archived"];

  if (isLoading) {
    return (
      <AppLayout>
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <Skeleton className="h-10 w-48" />
                <Skeleton className="h-10 w-32" />
            </div>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="space-y-4">
                        <Skeleton className="h-8 w-32" />
                        <Skeleton className="h-64 w-full rounded-lg" />
                        <Skeleton className="h-64 w-full rounded-lg" />
                    </div>
                ))}
            </div>
        </div>
      </AppLayout>
    )
  }

  if (error) {
     return (
      <AppLayout>
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <UiAlertDescription>{(error as Error).message || "Failed to load task data."}</UiAlertDescription>
        </Alert>
      </AppLayout>
     )
  }

  return (
    <AppLayout>
      <div className="space-y-6">
         <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
           <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Task Manager</h1>
            <Dialog open={isAddTaskDialogOpen} onOpenChange={setIsAddTaskDialogOpen}>
              <DialogTrigger asChild>
                <Button className="w-full sm:w-auto">
                  <PlusCircle className="mr-2 h-5 w-5" />
                  Add New Task
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>Add New Task</DialogTitle>
                  <DialogDescription>
                    Fill in the details for the new task. Click save when you're done.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit(onAddTaskSubmit)} className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto pr-2">
                  <div>
                    <Label htmlFor="title">Title</Label>
                    <Controller name="title" control={control} render={({ field }) => <Input id="title" {...field} />} />
                    {formErrors.title && <p className="text-red-500 text-xs mt-1">{formErrors.title.message}</p>}
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Controller name="description" control={control} render={({ field }) => <Textarea id="description" {...field} />} />
                  </div>
                  <div>
                    <Label htmlFor="dueDate">Due Date</Label>
                    <Controller name="dueDate" control={control} render={({ field }) => <Input id="dueDate" type="date" {...field} />} />
                    {formErrors.dueDate && <p className="text-red-500 text-xs mt-1">{formErrors.dueDate.message}</p>}
                  </div>
                  <div>
                    <Label htmlFor="priority">Priority</Label>
                    <Controller name="priority" control={control} render={({ field }) => (
                      <select {...field} className="w-full p-2 border rounded-md bg-background">
                        {(['Low', 'Medium', 'High'] as TaskPriority[]).map(p => <option key={p} value={p}>{p}</option>)}
                      </select>
                    )} />
                  </div>
                  <div>
                    <Label htmlFor="status">Status</Label>
                     <Controller name="status" control={control} render={({ field }) => (
                      <select {...field} className="w-full p-2 border rounded-md bg-background">
                        {statusOrder.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    )} />
                  </div>
                  <div>
                    <Label htmlFor="assignedTo">Assigned To</Label>
                    <Controller name="assignedTo" control={control} render={({ field }) => <Input id="assignedTo" {...field} placeholder="e.g. John Doe" />} />
                  </div>
                  <div>
                    <Label htmlFor="project">Project / Context</Label>
                    <Controller name="project" control={control} render={({ field }) => <Input id="project" {...field} placeholder="e.g. Q3 Marketing Launch" />} />
                  </div>
                   <div>
                    <Label htmlFor="tags">Tags (comma-separated)</Label>
                    <Controller name="tags" control={control} render={({ field }) => <Input id="tags" {...field} placeholder="e.g. marketing, report" />} />
                  </div>
                  <DialogFooter className="mt-4">
                    <Button type="button" variant="outline" onClick={() => setIsAddTaskDialogOpen(false)}>Cancel</Button>
                    <Button type="submit" disabled={createTaskMutation.isPending}>
                      {createTaskMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Save Task
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
         </div>

        {tasks.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {statusOrder.map(status => (
              (tasksByStatus[status] && tasksByStatus[status].length > 0) && (
                <div key={status} className="space-y-4 p-1 rounded-lg bg-muted/30 min-h-[200px]">
                  <h2 className={`text-lg font-semibold px-2 py-2 rounded-md flex items-center gap-2 sticky top-0 bg-muted/80 z-10 backdrop-blur-sm`}>
                    <Badge className={`${statusColorMap[status]} text-white px-2 py-1`}>{status}</Badge> 
                    <span className="text-muted-foreground text-sm">({tasksByStatus[status].length})</span>
                  </h2>
                  <div className="space-y-4 px-1 pb-1">
                    {tasksByStatus[status]
                      .sort((a,b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
                      .map(task => <TaskCard key={task.id} task={task} />)
                    }
                  </div>
                </div>
              )
            ))}
            {statusOrder.filter(status => !tasksByStatus[status] || tasksByStatus[status].length === 0).map(status => (
                 <div key={status} className="space-y-4 p-1 rounded-lg bg-muted/30 min-h-[200px]">
                    <h2 className={`text-lg font-semibold px-2 py-2 rounded-md flex items-center gap-2 sticky top-0 bg-muted/80 z-10 backdrop-blur-sm`}>
                        <Badge className={`${statusColorMap[status]} text-white px-2 py-1`}>{status}</Badge> 
                        <span className="text-muted-foreground text-sm">(0)</span>
                    </h2>
                    <div className="text-center text-muted-foreground pt-10">No tasks in this state.</div>
                 </div>
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
                 <Button className="mt-6" onClick={() => setIsAddTaskDialogOpen(true)}>
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

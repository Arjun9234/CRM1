
export interface User {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

export interface SegmentRule {
  id: string;
  field: string;
  operator: string;
  value: string;
}

export interface Segment {
  id: string;
  name: string;
  rules: SegmentRule[];
  // 'AND' or 'OR'
  logic: 'AND' | 'OR'; 
}

export interface Campaign {
  id: string;
  name: string;
  segmentId: string;
  segmentName?: string; // For display purposes
  message: string;
  createdAt: string; // ISO date string
  status: 'Draft' | 'Sent' | 'Failed';
  audienceSize: number;
  sentCount: number;
  failedCount: number;
  deliveryRate?: number; // Calculated
}

export interface DeliveryReceipt {
  campaignId: string;
  customerId: string;
  status: 'SENT' | 'FAILED';
  timestamp: string;
}

// Customer related types
export type CustomerStatus = 'Active' | 'Lead' | 'Inactive' | 'New';
export interface Customer {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  company?: string;
  totalSpend: number;
  lastContact: string; // ISO date string
  status: CustomerStatus;
  createdAt: string; // ISO date string
  tags?: string[];
}

// Task related types
export type TaskStatus = 'To Do' | 'In Progress' | 'Completed' | 'Blocked';
export type TaskPriority = 'High' | 'Medium' | 'Low';
export interface Task {
  id: string;
  title: string;
  description?: string;
  dueDate: string; // ISO date string
  status: TaskStatus;
  priority: TaskPriority;
  assignedTo?: string; // User name or ID for simplicity
  createdAt: string; // ISO date string
  tags?: string[];
}

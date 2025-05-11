

export interface User {
  id: string; // uid from Firebase Auth
  name?: string | null;
  email?: string | null;
  image?: string | null;
  bio?: string | null; // Optional: For user profile bio
  company?: string | null; // Optional: For user profile company
  createdAt?: string | null; // Optional: ISO date string when user was created
}

export interface SegmentRule {
  id: string; // Can be a generated ID or part of the rule structure
  field: string;
  operator: string;
  value: string;
}

// Segment interface might be useful if segments are managed independently in the future
export interface Segment {
  id: string; // Firestore document ID
  name: string;
  rules: SegmentRule[];
  logic: 'AND' | 'OR';
  createdAt: string; // ISO date string
  // Add createdBy (userId) if needed
}

export interface Campaign {
  id: string; // Firestore document ID
  name: string;
  // segmentId could reference a document in a 'segments' collection
  // For now, rules are embedded.
  segmentName?: string; // User-defined name for the segment used in this campaign
  rules: SegmentRule[];
  ruleLogic: 'AND' | 'OR';
  message: string;
  createdAt: string; // ISO date string, set on creation
  updatedAt?: string; // ISO date string, set on update
  status: 'Draft' | 'Scheduled' | 'Sent' | 'Failed' | 'Archived' | 'Cancelled';
  audienceSize: number; // Estimated or actual count
  sentCount: number;    // Actual messages successfully sent
  failedCount: number;  // Actual messages that failed to send
  // createdBy?: string; // userId
}

export type CustomerStatus = 'Active' | 'Lead' | 'Inactive' | 'New' | 'Archived';
export interface Customer {
  id: string; // Firestore document ID
  name: string;
  email: string;
  avatarUrl?: string;
  company?: string;
  totalSpend: number;
  lastContact: string; // ISO date string
  status: CustomerStatus;
  createdAt: string; // ISO date string
  updatedAt?: string; // ISO date string
  tags?: string[];
  acquisitionSource?: string; // New field
  lastSeenOnline?: string; // New field: ISO date string
  // createdBy?: string; // userId
}

export type TaskStatus = 'To Do' | 'In Progress' | 'Completed' | 'Blocked' | 'Archived';
export type TaskPriority = 'High' | 'Medium' | 'Low';
export interface Task {
  id: string; // Firestore document ID
  title: string;
  description?: string;
  dueDate: string; // ISO date string
  status: TaskStatus;
  priority: TaskPriority;
  assignedTo?: string; // User name or ID
  project?: string; // New field for project/context
  createdAt: string; // ISO date string
  updatedAt?: string; // ISO date string
  tags?: string[];
  // createdBy?: string; // userId
}

// For API request bodies, we often omit 'id', 'createdAt', 'updatedAt' as they are set by the server/DB
export type CampaignCreationPayload = Omit<Campaign, 'id' | 'createdAt' | 'updatedAt' | 'sentCount' | 'failedCount'> & {
  sentCount?: number;
  failedCount?: number;
};
export type CustomerCreationPayload = Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>;
export type TaskCreationPayload = Omit<Task, 'id' | 'createdAt' | 'updatedAt'>;

export type CampaignUpdatePayload = Partial<CampaignCreationPayload>;
export type CustomerUpdatePayload = Partial<CustomerCreationPayload>;
export type TaskUpdatePayload = Partial<TaskCreationPayload>;

export interface DeliveryReceipt {
  campaignId: string;
  customerId: string;
  status: 'SENT' | 'FAILED';
  timestamp: string;
}


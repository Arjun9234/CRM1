
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
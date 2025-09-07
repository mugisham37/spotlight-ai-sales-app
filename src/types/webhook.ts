// Webhook type definitions
export interface ClerkEmailAddress {
  id: string;
  email_address: string;
  verification?: {
    status: string;
    strategy: string;
  };
}

export interface ClerkUserData {
  id: string;
  email_addresses: ClerkEmailAddress[];
  first_name: string | null;
  last_name: string | null;
  image_url: string | null;
  primary_email_address_id: string;
  created_at: number;
  updated_at: number;
}

export interface ClerkDeletedObjectData {
  id: string;
  deleted: boolean;
  object: string;
}

export interface ClerkWebhookEvent {
  type: "user.created" | "user.updated" | "user.deleted";
  data: ClerkUserData | ClerkDeletedObjectData;
  object: string;
  timestamp: number;
}

export interface WebhookResponse {
  success: boolean;
  message?: string;
  error?: string;
}

export interface WebhookLogContext {
  webhookType: string;
  eventId?: string;
  userId?: string;
  clerkId?: string;
  requestId: string;
  timestamp?: string;
}

export interface WebhookMetadata {
  [key: string]: string | number | boolean | Date | null | undefined;
}

export interface AuthErrorDetails {
  code?: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface HealthMetrics {
  recentEvents: number;
  errorRate: number;
  averageProcessingTime: number;
}

export interface HealthDetails {
  recentMetrics: Array<{
    eventType: string;
    success: boolean;
    processingTime: number;
    timestamp: Date;
    error?: string;
  }>;
  errorThreshold: number;
  timeWindow: string;
}

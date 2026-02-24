// User Types
export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  profilePictureUrl?: string;
  plan_tier?: string;
  is_active?: boolean;
  is_verified?: boolean;
  createdAt?: string;
  updatedAt?: string;
  subscription?: Subscription;
  /** Email preference: product updates and news. Default true. */
  notifyProductUpdates?: boolean;
  /** Email preference: billing and invoices. Default true. */
  notifyBilling?: boolean;
}

// Instagram Account Types
export interface InstagramAccount {
  id: string;
  userId: string;
  username: string;
  accountId: string;
  isActive: boolean;
  isConnected: boolean;
  profilePictureUrl?: string;
  followersCount?: number;
  followingCount?: number;
  postsCount?: number;
  connectedAt: string;
  lastSyncedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// Automation Rule Types
export type AutomationRuleType = 'auto_like' | 'auto_comment' | 'auto_follow' | 'auto_unfollow' | 'scheduled_post';
export type AutomationRuleStatus = 'active' | 'paused' | 'completed' | 'failed';

// Lead Capture Flow Types
export type LeadCaptureStepType = 'ask' | 'wait' | 'save' | 'send';
export type FieldType = 'email' | 'phone' | 'text' | 'custom';
export type ValidationType = 'email' | 'phone' | 'none';

export interface LeadCaptureStep {
  step: number;
  type: LeadCaptureStepType;
  text?: string; // For "ask" and "send" steps
  field_type?: FieldType; // For "ask" step
  validation?: ValidationType; // For "ask" step
  wait_for?: 'user_reply'; // For "wait" step
  field?: string; // For "save" step (e.g., "email", "phone")
  save_to?: 'lead_data'; // For "save" step
  message?: string; // For "send" step
  message_variations?: string[]; // For "send" step
}

export interface LeadCaptureSettings {
  save_to_database?: boolean;
  notification_email?: string | null;
  webhook_url?: string | null;
}

export interface AutomationStats {
  total_triggers: number;
  total_dms_sent: number;
  total_comments_replied: number;
  total_leads_captured: number;
  last_triggered_at: string | null;
  last_lead_captured_at: string | null;
}

export interface AutomationConfig {
  // Existing fields
  keywords?: string[];
  auto_reply_to_comments?: boolean;
  comment_replies?: string[];
  message_variations?: string[];
  message_template?: string; // Legacy field
  dmType?: 'text' | 'text_button' | 'lead_capture';
  buttons?: Array<{ text: string; url: string }>;
  delay_minutes?: number;
  
  // New lead capture fields
  is_lead_capture?: boolean;
  lead_capture_flow?: LeadCaptureStep[];
  lead_capture_settings?: LeadCaptureSettings;
  
  // Stats (runtime, updated by backend)
  stats?: AutomationStats;
}

export interface AutomationRule {
  id: string;
  userId: string;
  instagramAccountId: string;
  name: string;
  type: AutomationRuleType;
  status: AutomationRuleStatus;
  config: AutomationConfig;
  schedule?: {
    frequency: string;
    startTime?: string;
    endTime?: string;
    daysOfWeek?: number[];
  };
  isActive: boolean;
  executionCount: number;
  lastExecutedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// Captured Lead Types
export interface CapturedLead {
  id: number;
  user_id: number;
  instagram_account_id: number;
  automation_rule_id: number;
  email?: string | null;
  phone?: string | null;
  name?: string | null;
  custom_fields?: Record<string, unknown> | null;
  metadata?: Record<string, unknown> | null;
  captured_at: string;
  notified: boolean;
  exported: boolean;
}

// Subscription Types
export type SubscriptionPlan = 'free' | 'basic' | 'pro' | 'enterprise';
export type SubscriptionStatus = 'active' | 'canceled' | 'past_due' | 'trialing' | 'incomplete';

export interface Subscription {
  id: string;
  userId: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  createdAt: string;
  updatedAt: string;
}

// API Response Types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

// Webhook Log Types
export interface WebhookLog {
  id: string;
  eventType: string;
  status: string;
  responseCode: number;
  timestamp: string;
  error?: string;
}

// Auth Token Types
export interface AuthToken {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
}

export interface AuthResponse {
  user: User;
  tokens: AuthToken;
}

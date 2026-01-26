import { User, InstagramAccount, AutomationRule, Subscription, AuthResponse } from '@/types';


// Mock Subscription
export const mockSubscription: Subscription = {
  id: 'sub_123',
  userId: 'user_123',
  plan: 'pro',
  status: 'active',
  stripeCustomerId: 'cus_123',
  stripeSubscriptionId: 'sub_stripe_123',
  currentPeriodStart: '2024-01-01T00:00:00Z',
  currentPeriodEnd: '2024-02-01T00:00:00Z',
  cancelAtPeriodEnd: false,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-15T00:00:00Z',
};
// Mock User
export const mockUser: User = {
  id: 'user_123',
  email: 'test@example.com',
  firstName: 'John',
  lastName: 'Doe',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-15T00:00:00Z',
  subscription: mockSubscription,
};

// Mock Instagram Accounts
export const mockInstagramAccount: InstagramAccount = {
  id: 'account_123',
  userId: 'user_123',
  username: 'johndoe',
  accountId: 'ig_123',
  isActive: true,
  isConnected: true,
  profilePictureUrl: 'https://example.com/profile.jpg',
  followersCount: 1000,
  followingCount: 500,
  postsCount: 50,
  connectedAt: '2024-01-01T00:00:00Z',
  lastSyncedAt: '2024-01-15T10:00:00Z',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-15T00:00:00Z',
};

export const mockInstagramAccounts: InstagramAccount[] = [
  mockInstagramAccount,
  {
    ...mockInstagramAccount,
    id: 'account_124',
    username: 'janedoe',
    accountId: 'ig_124',
    followersCount: 2000,
  },
];

// Mock Automation Rules
export const mockAutomationRule: AutomationRule = {
  id: 'rule_123',
  userId: 'user_123',
  instagramAccountId: 'account_123',
  name: 'Auto Like Posts',
  type: 'auto_like',
  status: 'active',
  config: {
    hashtags: ['travel', 'photography'],
    maxLikesPerDay: 100,
  },
  schedule: {
    frequency: 'daily',
    startTime: '09:00',
    endTime: '21:00',
    daysOfWeek: [1, 2, 3, 4, 5],
  },
  isActive: true,
  executionCount: 42,
  lastExecutedAt: '2024-01-15T15:30:00Z',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-15T00:00:00Z',
};

export const mockAutomationRules: AutomationRule[] = [
  mockAutomationRule,
  {
    ...mockAutomationRule,
    id: 'rule_124',
    name: 'Auto Follow Users',
    type: 'auto_follow',
    status: 'paused',
  },
  {
    ...mockAutomationRule,
    id: 'rule_125',
    name: 'Scheduled Post',
    type: 'scheduled_post',
    status: 'active',
  },
];

// Mock Auth Response
export const mockAuthResponse: AuthResponse = {
  user: mockUser,
  tokens: {
    accessToken: 'access_token_123',
    refreshToken: 'refresh_token_123',
    expiresIn: 3600,
    tokenType: 'Bearer',
  },
};

// API Response Wrapper
export const mockApiResponse = <T,>(data: T, success = true) => ({
  success,
  data,
  error: success ? undefined : { code: 'ERROR', message: 'An error occurred' },
});
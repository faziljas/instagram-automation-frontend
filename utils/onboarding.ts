import {
  clearAutomationsTourRunPending,
  clearTourAfterGettingStartedClose,
} from '@/utils/automationsSpotlightTour';

export const ONBOARDING_PENDING_KEY = 'logicdm_onboarding_pending';
/** @deprecated Legacy global flag — migrated to per-user keys. */
export const ONBOARDING_COMPLETED_KEY = 'logicdm_onboarding_completed';

export const ONBOARDING_VISITED_ACCOUNTS_KEY = 'logicdm_onboarding_visited_accounts';
export const ONBOARDING_VISITED_AUTOMATIONS_KEY = 'logicdm_onboarding_visited_automations';
export const ONBOARDING_VISITED_ANALYTICS_KEY = 'logicdm_onboarding_visited_analytics';

const ONBOARDING_ENGAGEMENT_DISMISSED_KEY = 'logicdm_onboarding_engagement_dismissed';

/** Set before Google OAuth from /login; cleared on dashboard when queuing onboarding. */
export const GOOGLE_OAUTH_FROM_LOGIN_SESSION_KEY = 'logicdm_google_oauth_from_login';

export function userOnboardingCompletedStorageKey(userId: string): string {
  return `logicdm_onboarding_completed_user:${userId}`;
}

function safeGetItem(key: string): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSetItem(key: string, value: string) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // ignore
  }
}

function safeRemoveItem(key: string) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

function clearOnboardingVisitFlags() {
  safeRemoveItem(ONBOARDING_VISITED_ACCOUNTS_KEY);
  safeRemoveItem(ONBOARDING_VISITED_AUTOMATIONS_KEY);
  safeRemoveItem(ONBOARDING_VISITED_ANALYTICS_KEY);
}

/**
 * True if this Supabase user has finished Getting started (per-user, survives same browser /
 * new login). Migrates legacy global `logicdm_onboarding_completed` once for this user id.
 */
export function hasUserCompletedOnboarding(supabaseUserId: string | null | undefined): boolean {
  if (!supabaseUserId) return false;
  if (safeGetItem(userOnboardingCompletedStorageKey(supabaseUserId)) === '1') return true;
  /** Older builds used a single global “completed” flag for this browser. */
  return safeGetItem(ONBOARDING_COMPLETED_KEY) === '1';
}

/**
 * Show Getting started only when a journey is queued and this user has not completed it.
 * `supabaseUserId` may be undefined briefly before auth hydrates — then we still respect pending.
 */
export function isOnboardingPending(supabaseUserId: string | null | undefined): boolean {
  if (safeGetItem(ONBOARDING_PENDING_KEY) !== '1') return false;
  if (!supabaseUserId) return true;
  return !hasUserCompletedOnboarding(supabaseUserId);
}

export function shouldShowOnboardingAuto(supabaseUserId?: string | null): boolean {
  return isOnboardingPending(supabaseUserId ?? undefined);
}

/**
 * Call from **sign-up** flows only (email register, Google register). Clears legacy global
 * completion and visit state, then queues onboarding. Does not clear other users’ per-user keys.
 */
export function markOnboardingPending() {
  safeRemoveItem(ONBOARDING_COMPLETED_KEY);
  safeRemoveItem(ONBOARDING_ENGAGEMENT_DISMISSED_KEY);
  clearOnboardingVisitFlags();
  clearTourAfterGettingStartedClose();
  clearAutomationsTourRunPending();
  safeSetItem(ONBOARDING_PENDING_KEY, '1');
}

/**
 * Call after OAuth / magic-link when a session exists: queue onboarding only if this user
 * has not already completed it (does not wipe per-user completion).
 */
export function markOnboardingPendingIfUserNotCompleted(supabaseUserId: string) {
  if (hasUserCompletedOnboarding(supabaseUserId)) return;
  if (safeGetItem(ONBOARDING_PENDING_KEY) === '1') return;
  safeRemoveItem(ONBOARDING_ENGAGEMENT_DISMISSED_KEY);
  clearOnboardingVisitFlags();
  clearTourAfterGettingStartedClose();
  clearAutomationsTourRunPending();
  safeSetItem(ONBOARDING_PENDING_KEY, '1');
}

export function clearOnboardingPending() {
  safeRemoveItem(ONBOARDING_PENDING_KEY);
  clearOnboardingVisitFlags();
  clearTourAfterGettingStartedClose();
  clearAutomationsTourRunPending();
}

export function markOnboardingCompleted(supabaseUserId: string | null | undefined) {
  if (supabaseUserId) {
    safeSetItem(userOnboardingCompletedStorageKey(supabaseUserId), '1');
  } else {
    safeSetItem(ONBOARDING_COMPLETED_KEY, '1');
  }
  safeRemoveItem(ONBOARDING_PENDING_KEY);
  safeRemoveItem(ONBOARDING_ENGAGEMENT_DISMISSED_KEY);
  clearOnboardingVisitFlags();
  clearTourAfterGettingStartedClose();
  clearAutomationsTourRunPending();
  safeRemoveItem(ONBOARDING_COMPLETED_KEY);
}

export function getOnboardingVisitSnapshot(): {
  accounts: boolean;
  automations: boolean;
  analytics: boolean;
} {
  return {
    accounts: safeGetItem(ONBOARDING_VISITED_ACCOUNTS_KEY) === '1',
    automations: safeGetItem(ONBOARDING_VISITED_AUTOMATIONS_KEY) === '1',
    analytics: safeGetItem(ONBOARDING_VISITED_ANALYTICS_KEY) === '1',
  };
}

/**
 * While onboarding is pending, record that the user opened a destination.
 * @returns true if onboarding was just completed (all three visited).
 */
export function recordOnboardingDestinationVisit(
  pathname: string,
  supabaseUserId: string | null | undefined,
): boolean {
  if (!isOnboardingPending(supabaseUserId)) return false;
  if (!supabaseUserId) return false;

  if (pathname.startsWith('/dashboard/accounts')) {
    safeSetItem(ONBOARDING_VISITED_ACCOUNTS_KEY, '1');
  }
  if (pathname.startsWith('/dashboard/automations')) {
    safeSetItem(ONBOARDING_VISITED_AUTOMATIONS_KEY, '1');
  }
  if (pathname.startsWith('/dashboard/analytics')) {
    safeSetItem(ONBOARDING_VISITED_ANALYTICS_KEY, '1');
  }

  const v = getOnboardingVisitSnapshot();
  if (v.accounts && v.automations && v.analytics) {
    markOnboardingCompleted(supabaseUserId);
    return true;
  }
  return false;
}

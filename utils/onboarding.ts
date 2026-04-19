import {
  clearAutomationsTourRunPending,
  clearTourAfterGettingStartedClose,
} from '@/utils/automationsSpotlightTour';

export const ONBOARDING_PENDING_KEY = 'logicdm_onboarding_pending';
export const ONBOARDING_COMPLETED_KEY = 'logicdm_onboarding_completed';

export const ONBOARDING_VISITED_ACCOUNTS_KEY = 'logicdm_onboarding_visited_accounts';
export const ONBOARDING_VISITED_AUTOMATIONS_KEY = 'logicdm_onboarding_visited_automations';
export const ONBOARDING_VISITED_ANALYTICS_KEY = 'logicdm_onboarding_visited_analytics';

/** Legacy key — still removed in markOnboardingCompleted for older sessions. */
const ONBOARDING_ENGAGEMENT_DISMISSED_KEY = 'logicdm_onboarding_engagement_dismissed';

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

export function isOnboardingPending(): boolean {
  if (safeGetItem(ONBOARDING_COMPLETED_KEY) === '1') return false;
  return safeGetItem(ONBOARDING_PENDING_KEY) === '1';
}

/**
 * Start (or restart) first-time onboarding. Clears a previous session’s “completed” flag in
 * this browser — otherwise a deleted account / new signup on the same device would never
 * see Getting started because `logicdm_onboarding_completed` stayed set.
 */
export function markOnboardingPending() {
  safeRemoveItem(ONBOARDING_COMPLETED_KEY);
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

export function markOnboardingCompleted() {
  safeSetItem(ONBOARDING_COMPLETED_KEY, '1');
  safeRemoveItem(ONBOARDING_PENDING_KEY);
  safeRemoveItem(ONBOARDING_ENGAGEMENT_DISMISSED_KEY);
  clearOnboardingVisitFlags();
  clearTourAfterGettingStartedClose();
  clearAutomationsTourRunPending();
}

/** True while first-time onboarding is active (show Getting started). */
export function shouldShowOnboardingAuto(): boolean {
  return isOnboardingPending();
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
export function recordOnboardingDestinationVisit(pathname: string): boolean {
  if (!isOnboardingPending()) return false;

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
    markOnboardingCompleted();
    return true;
  }
  return false;
}

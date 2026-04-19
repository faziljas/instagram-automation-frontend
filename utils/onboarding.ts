import {
  clearAutomationsTourRunPending,
  clearTourAfterGettingStartedClose,
  markTourAfterGettingStartedClose,
} from '@/utils/automationsSpotlightTour';

export const ONBOARDING_PENDING_KEY = 'logicdm_onboarding_pending';
export const ONBOARDING_COMPLETED_KEY = 'logicdm_onboarding_completed';
/** User opened Automations/Analytics from the tour; stop auto-opening until "Getting started" is used again. */
export const ONBOARDING_ENGAGEMENT_DISMISSED_KEY = 'logicdm_onboarding_engagement_dismissed';

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

export function markOnboardingPending() {
  safeSetItem(ONBOARDING_PENDING_KEY, '1');
  markTourAfterGettingStartedClose();
}

export function clearOnboardingPending() {
  safeRemoveItem(ONBOARDING_PENDING_KEY);
  clearTourAfterGettingStartedClose();
  clearAutomationsTourRunPending();
}

export function markOnboardingCompleted() {
  safeSetItem(ONBOARDING_COMPLETED_KEY, '1');
  safeRemoveItem(ONBOARDING_PENDING_KEY);
  safeRemoveItem(ONBOARDING_ENGAGEMENT_DISMISSED_KEY);
  clearTourAfterGettingStartedClose();
  clearAutomationsTourRunPending();
}

/** After user follows Automations/Analytics from the modal, do not auto-show the tour on later visits. */
export function markOnboardingEngagementDismissed() {
  safeSetItem(ONBOARDING_ENGAGEMENT_DISMISSED_KEY, '1');
  safeRemoveItem(ONBOARDING_PENDING_KEY);
  clearTourAfterGettingStartedClose();
  clearAutomationsTourRunPending();
}

/** Auto-open welcome modal on dashboard load (signup / pending only). */
export function shouldShowOnboardingAuto(): boolean {
  if (safeGetItem(ONBOARDING_COMPLETED_KEY) === '1') return false;
  if (safeGetItem(ONBOARDING_ENGAGEMENT_DISMISSED_KEY) === '1') return false;
  return safeGetItem(ONBOARDING_PENDING_KEY) === '1';
}

export const ONBOARDING_PENDING_KEY = 'logicdm_onboarding_pending';
export const ONBOARDING_COMPLETED_KEY = 'logicdm_onboarding_completed';

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
}

export function clearOnboardingPending() {
  safeRemoveItem(ONBOARDING_PENDING_KEY);
}

export function markOnboardingCompleted() {
  safeSetItem(ONBOARDING_COMPLETED_KEY, '1');
  safeRemoveItem(ONBOARDING_PENDING_KEY);
}

export function shouldShowOnboarding(): boolean {
  const completed = safeGetItem(ONBOARDING_COMPLETED_KEY) === '1';
  if (completed) return false;
  return safeGetItem(ONBOARDING_PENDING_KEY) === '1';
}


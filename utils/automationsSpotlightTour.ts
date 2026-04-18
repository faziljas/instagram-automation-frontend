/** Pending spotlight run (survives Strict Mode remount and client navigations). */
export const AUTOMATIONS_TOUR_RUN_PENDING_KEY = 'logicdm_automations_tour_run_pending';

/** Query: `/dashboard/automations?tour=automations` */
export const AUTOMATIONS_TOUR_QUERY = 'automations';

/** `window` event when the user is already on Automations and should start the spotlight immediately. */
export const AUTOMATIONS_TOUR_DOM_EVENT = 'logicdm:start-automations-tour';

export function markAutomationsTourRunPending() {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.setItem(AUTOMATIONS_TOUR_RUN_PENDING_KEY, '1');
  } catch {
    // ignore
  }
}

export function peekAutomationsTourRunPending(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.sessionStorage.getItem(AUTOMATIONS_TOUR_RUN_PENDING_KEY) === '1';
  } catch {
    return false;
  }
}

export function consumeAutomationsTourRunPending(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    if (window.sessionStorage.getItem(AUTOMATIONS_TOUR_RUN_PENDING_KEY) === '1') {
      window.sessionStorage.removeItem(AUTOMATIONS_TOUR_RUN_PENDING_KEY);
      return true;
    }
  } catch {
    // ignore
  }
  return false;
}

/** If URL contains `?tour=automations`, persist intent and strip the query (call once on Automations mount). */
export function primeAutomationsTourFromUrlIfPresent() {
  if (typeof window === 'undefined') return;
  try {
    const url = new URL(window.location.href);
    if (url.searchParams.get('tour') !== AUTOMATIONS_TOUR_QUERY) return;
    markAutomationsTourRunPending();
    url.searchParams.delete('tour');
    const qs = url.searchParams.toString();
    const next = url.pathname + (qs ? `?${qs}` : '') + url.hash;
    window.history.replaceState({}, '', next);
  } catch {
    // ignore
  }
}

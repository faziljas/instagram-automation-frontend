import { driver, type Config, type DriveStep } from 'driver.js';
import 'driver.js/dist/driver.css';

const SELECTORS = {
  hero: '[data-tour="automations-hero"]',
  account: '[data-tour="automations-account"]',
  accountEmpty: '[data-tour="automations-account-empty"]',
  tabs: '[data-tour="automations-tabs"]',
  viewToggle: '[data-tour="automations-view-toggle"]',
  stats: '[data-tour="automations-stats"]',
  table: '[data-tour="automations-table"]',
  dmsPanel: '[data-tour="automations-dms-panel"]',
} as const;

function $(selector: string): Element | null {
  if (typeof document === 'undefined') return null;
  return document.querySelector(selector);
}

function pushIfPresent(steps: DriveStep[], selector: string, popover: NonNullable<DriveStep['popover']>) {
  if ($(selector)) {
    steps.push({ element: selector, popover });
  }
}

/**
 * Spotlight tour for the Automations page. Only registers steps whose anchors exist in the DOM.
 */
export function startAutomationsSpotlightTour(onDestroyed?: () => void) {
  const steps: DriveStep[] = [];

  pushIfPresent(steps, SELECTORS.hero, {
    title: 'Automations',
    description:
      'This is where you attach DM flows to posts, reels, and (on Pro) stories or inbox DMs. Everything for one Instagram account is organized here.',
    side: 'bottom',
    align: 'start',
  });

  pushIfPresent(steps, SELECTORS.account, {
    title: 'Pick your Instagram account',
    description: 'Choose which connected profile you are configuring. Rules and analytics are scoped to this account.',
    side: 'bottom',
    align: 'start',
  });

  pushIfPresent(steps, SELECTORS.accountEmpty, {
    title: 'Connect Instagram first',
    description: 'Go to Accounts, connect Instagram, then return here to build automations.',
    side: 'bottom',
    align: 'start',
  });

  pushIfPresent(steps, SELECTORS.tabs, {
    title: 'Content type',
    description:
      'Switch between Posts/Reels, Stories, or DMs depending on what you want to automate. Stories and DMs require Pro.',
    side: 'bottom',
    align: 'start',
  });

  pushIfPresent(steps, SELECTORS.viewToggle, {
    title: 'Table or grid',
    description: 'Use table view for a compact list with metrics, or grid for a more visual layout.',
    side: 'bottom',
    align: 'start',
  });

  pushIfPresent(steps, SELECTORS.stats, {
    title: 'Performance snapshot',
    description: 'See DMs sent, leads, and follow actions tied to your automations for this account.',
    side: 'top',
    align: 'start',
  });

  pushIfPresent(steps, SELECTORS.table, {
    title: 'Build and manage rules',
    description:
      'Each row is a post or reel. Click a row to open the setup wizard for a new rule, or edit an existing automation. Use Edit/Delete in the row when a rule already exists.',
    side: 'top',
    align: 'start',
  });

  pushIfPresent(steps, SELECTORS.dmsPanel, {
    title: 'DM automations',
    description:
      'On the DMs tab (Pro), you can work from inbox threads to set up keyword-based or story-reply automations from this workspace.',
    side: 'top',
    align: 'start',
  });

  steps.push({
    popover: {
      title: 'Verify in Analytics',
      description:
        'When your rules are live, open Analytics in the sidebar to see triggers, sends, and clicks over time. On mobile, use the menu button then Analytics.',
      side: 'over',
      align: 'center',
    },
  });

  const config: Config = {
    showProgress: true,
    smoothScroll: true,
    allowClose: true,
    stagePadding: 8,
    nextBtnText: 'Next',
    prevBtnText: 'Back',
    doneBtnText: 'Done',
    progressText: '{{current}} of {{total}}',
    onDestroyed: () => {
      onDestroyed?.();
    },
  };

  const d = driver({ ...config, steps });
  d.drive();
}

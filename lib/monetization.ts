/**
 * When `NEXT_PUBLIC_SHOW_UPGRADE_AND_BILLING=true`, show Upgrade / checkout UI and Settings ? Billing.
 * Default (unset or not `true`): hide those surfaces for promos / product-led onboarding.
 */
export function showUpgradeAndBilling(): boolean {
  return process.env.NEXT_PUBLIC_SHOW_UPGRADE_AND_BILLING === 'true';
}

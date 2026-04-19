/**
 * When `NEXT_PUBLIC_SHOW_UPGRADE_AND_BILLING=true`, show Upgrade / checkout UI, Settings Billing,
 * and Settings Notifications. Default (unset or not `true`): hide those surfaces.
 */
export function showUpgradeAndBilling(): boolean {
  return process.env.NEXT_PUBLIC_SHOW_UPGRADE_AND_BILLING === 'true';
}

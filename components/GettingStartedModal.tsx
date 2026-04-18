'use client';

import { useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { XMarkIcon, CursorArrowRaysIcon } from '@heroicons/react/24/outline';
import { CheckCircleIcon } from '@heroicons/react/24/solid';

export type AutomationGuideStatus = 'loading' | 'empty' | 'has_rules';

export default function GettingStartedModal({
  isOpen,
  onClose,
  onFinish,
  hasConnectedAccount,
  automationGuideStatus,
  automationCount,
  onEngagementNavigate,
  onRequestAutomationsSpotlightTour,
}: {
  isOpen: boolean;
  onClose: () => void;
  onFinish: () => void;
  hasConnectedAccount: boolean;
  /** Backend-driven: empty vs existing automations vs still loading rules. */
  automationGuideStatus: AutomationGuideStatus;
  automationCount: number;
  /** Call when user uses primary nav actions from the guide so auto-open can stop. */
  onEngagementNavigate: () => void;
  /** Opens the Driver.js spotlight tour on Automations (navigates there if needed). */
  onRequestAutomationsSpotlightTour?: () => void;
}) {
  const router = useRouter();

  const hasAutomations = automationGuideStatus === 'has_rules';
  const automationLoading = automationGuideStatus === 'loading';

  /** Core setup is account + automations; Analytics is recommended but not auto-checked. */
  const { completedSteps, totalSteps, progressPercent } = useMemo(() => {
    const total = 2;
    let done = 0;
    if (hasConnectedAccount) done += 1;
    if (hasAutomations) done += 1;
    const pct = Math.round((done / total) * 100);
    return { completedSteps: done, totalSteps: total, progressPercent: pct };
  }, [hasConnectedAccount, hasAutomations]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const subtitle = (() => {
    if (!hasConnectedAccount) {
      return 'Connect Instagram, then add automations and confirm results in Analytics.';
    }
    if (automationLoading) {
      return 'Checking your workspace…';
    }
    if (hasAutomations) {
      return 'You’re up and running. Use the checklist below to refine or verify performance.';
    }
    return 'You’re connected. Add an automation, then confirm it’s working in Analytics.';
  })();

  const headerEyebrow = completedSteps === totalSteps ? 'Core setup complete' : 'Getting started';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-gray-900/60 transition-opacity" onClick={onClose} />

        <div
          className="relative w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl"
          role="dialog"
          aria-modal="true"
          aria-labelledby="getting-started-title"
          aria-describedby="getting-started-desc"
        >
          <div className="flex items-center justify-between border-b px-6 py-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">{headerEyebrow}</p>
              <h2 id="getting-started-title" className="text-lg font-semibold text-gray-900">
                Welcome to LogicDM
              </h2>
              <p id="getting-started-desc" className="mt-0.5 text-sm text-gray-600">
                {subtitle}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-700"
              aria-label="Close"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

            <div className="border-b border-gray-100 bg-gray-50/80 px-6 py-3">
            <div className="flex items-center justify-between gap-3 text-xs font-medium text-gray-600">
              <span>
                Core setup · {completedSteps}/{totalSteps} complete
              </span>
              <span className="tabular-nums text-gray-500">{progressPercent}%</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-gray-200">
              <div
                className="h-full rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 transition-all duration-500 ease-out"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          <div className="px-6 py-6">
            <ol className="space-y-4">
              {!hasConnectedAccount && (
                <li className="rounded-xl border border-gray-200 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex min-w-0 flex-1 gap-3">
                      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-white text-sm font-semibold text-gray-700">
                        1
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900">Connect your Instagram account</p>
                        <p className="mt-1 text-sm text-gray-600">
                          LogicDM needs access to read posts and stories and to send DMs on your behalf.
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        router.push('/dashboard/accounts');
                      }}
                      className="shrink-0 rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800"
                    >
                      Connect account
                    </button>
                  </div>
                </li>
              )}

              {hasConnectedAccount && (
                <li className="rounded-xl border border-emerald-100 bg-emerald-50/80 p-4">
                  <div className="flex items-start gap-3">
                    <CheckCircleIcon className="h-8 w-8 shrink-0 text-emerald-600" aria-hidden />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-emerald-900">Instagram connected</p>
                      <p className="mt-1 text-sm text-emerald-800">
                        Account setup is done. Next, add automations and review results in Analytics.
                      </p>
                    </div>
                  </div>
                </li>
              )}

              <li
                className={`rounded-xl border p-4 ${
                  hasAutomations ? 'border-emerald-100 bg-emerald-50/50' : 'border-gray-200'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex min-w-0 flex-1 gap-3">
                    {hasAutomations ? (
                      <CheckCircleIcon className="h-8 w-8 shrink-0 text-emerald-600" aria-hidden />
                    ) : (
                    <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-white text-sm font-semibold text-gray-700">
                      {hasConnectedAccount ? 1 : 2}
                      </span>
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900">
                        {automationLoading
                          ? 'Automations'
                          : hasAutomations
                            ? `Automations active${automationCount > 0 ? ` (${automationCount})` : ''}`
                            : 'Create your first automation'}
                      </p>
                      <p className="mt-1 text-sm text-gray-600">
                        {automationLoading ? (
                          <span className="inline-flex items-center gap-2">
                            <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />
                            Loading your automations…
                          </span>
                        ) : hasAutomations ? (
                          <>
                            You already have automations. Open Automations to edit, pause, or add another rule, or
                            jump to Analytics to verify sends and engagement.
                          </>
                        ) : (
                          <>
                            Go to Automations, pick a post, story, or DM entry point, then finish the setup wizard
                            to go live.
                          </>
                        )}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onEngagementNavigate();
                      onClose();
                      router.push('/dashboard/automations');
                    }}
                    disabled={automationLoading}
                    className="shrink-0 rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {hasAutomations ? 'Open Automations' : 'Go to Automations'}
                  </button>
                </div>
              </li>

              <li className="rounded-xl border border-gray-200 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex min-w-0 flex-1 gap-3">
                    <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-white text-sm font-semibold text-gray-700">
                      {hasConnectedAccount ? 2 : 3}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900">Verify in Analytics</p>
                      <p className="mt-1 text-sm text-gray-600">
                        Confirm triggers, DMs sent, and clicks or leads so you know the funnel is healthy.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onEngagementNavigate();
                      onClose();
                      router.push('/dashboard/analytics');
                    }}
                    className="shrink-0 rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800"
                  >
                    View Analytics
                  </button>
                </div>
              </li>
            </ol>

            {onRequestAutomationsSpotlightTour && (
              <div className="mt-5 rounded-xl border border-blue-100 bg-blue-50/70 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex gap-3">
                    <CursorArrowRaysIcon className="h-8 w-8 shrink-0 text-blue-600" aria-hidden />
                    <div>
                      <p className="text-sm font-semibold text-gray-900">Interactive spotlight tour</p>
                      <p className="mt-1 text-sm text-gray-600">
                        Walk the Automations page step by step with highlights on each area.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onEngagementNavigate();
                      onRequestAutomationsSpotlightTour();
                      onClose();
                    }}
                    className="shrink-0 rounded-lg border border-blue-600 bg-white px-3 py-2 text-sm font-semibold text-blue-700 shadow-sm hover:bg-blue-50"
                  >
                    Start spotlight tour
                  </button>
                </div>
              </div>
            )}

            <p className="mt-4 text-center text-xs text-gray-500">
              Reopen this guide anytime from your profile menu → Getting started.
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={onFinish}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Got it — don’t show again
              </button>
              <button
                type="button"
                onClick={onClose}
                className="text-sm font-medium text-gray-600 hover:text-gray-900"
              >
                I’ll do this later
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

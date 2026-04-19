'use client';

import { useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { XMarkIcon, CursorArrowRaysIcon } from '@heroicons/react/24/outline';
import { CheckCircleIcon } from '@heroicons/react/24/solid';

export default function GettingStartedModal({
  isOpen,
  onClose,
  onFinish,
  visitedAccounts,
  visitedAutomations,
  visitedAnalytics,
  onRequestAutomationsSpotlightTour,
}: {
  isOpen: boolean;
  onClose: () => void;
  onFinish: () => void;
  visitedAccounts: boolean;
  visitedAutomations: boolean;
  visitedAnalytics: boolean;
  onRequestAutomationsSpotlightTour?: () => void;
}) {
  const router = useRouter();

  const { completedSteps, totalSteps, progressPercent } = useMemo(() => {
    let done = 0;
    if (visitedAccounts) done += 1;
    if (visitedAutomations) done += 1;
    if (visitedAnalytics) done += 1;
    const total = 3;
    const pct = Math.round((done / total) * 100);
    return { completedSteps: done, totalSteps: total, progressPercent: pct };
  }, [visitedAccounts, visitedAutomations, visitedAnalytics]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const headerEyebrow = completedSteps === totalSteps ? 'All steps done' : 'Getting started';

  return (
    <div className="fixed inset-0 z-[1000000001] overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-gray-900/60 transition-opacity" onClick={onClose} />

        <div
          className="relative w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl"
          role="dialog"
          aria-modal="true"
          aria-labelledby="getting-started-title"
        >
          <div className="flex items-center justify-between border-b px-6 py-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">{headerEyebrow}</p>
              <h2 id="getting-started-title" className="text-lg font-semibold text-gray-900">
                Welcome to LogicDM
              </h2>
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
                Steps visited · {completedSteps}/{totalSteps}
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
              <li
                className={`rounded-xl border p-4 ${
                  visitedAccounts ? 'border-emerald-100 bg-emerald-50/50' : 'border-gray-200'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex min-w-0 flex-1 gap-3">
                    {visitedAccounts ? (
                      <CheckCircleIcon className="h-8 w-8 shrink-0 text-emerald-600" aria-hidden />
                    ) : (
                      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-white text-sm font-semibold text-gray-700">
                        1
                      </span>
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900">Connect Instagram</p>
                      <p className="mt-1 text-sm text-gray-600">
                        Open Accounts to connect your Instagram profile so LogicDM can automate DMs.
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
                    Connect Instagram
                  </button>
                </div>
              </li>

              <li
                className={`rounded-xl border p-4 ${
                  visitedAutomations ? 'border-emerald-100 bg-emerald-50/50' : 'border-gray-200'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex min-w-0 flex-1 gap-3">
                    {visitedAutomations ? (
                      <CheckCircleIcon className="h-8 w-8 shrink-0 text-emerald-600" aria-hidden />
                    ) : (
                      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-white text-sm font-semibold text-gray-700">
                        2
                      </span>
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900">Automations</p>
                      <p className="mt-1 text-sm text-gray-600">
                        Open Automations to attach rules to posts, reels, or DMs.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      router.push('/dashboard/automations');
                    }}
                    className="shrink-0 rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800"
                  >
                    Go to Automations
                  </button>
                </div>
              </li>

              <li
                className={`rounded-xl border p-4 ${
                  visitedAnalytics ? 'border-emerald-100 bg-emerald-50/50' : 'border-gray-200'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex min-w-0 flex-1 gap-3">
                    {visitedAnalytics ? (
                      <CheckCircleIcon className="h-8 w-8 shrink-0 text-emerald-600" aria-hidden />
                    ) : (
                      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-white text-sm font-semibold text-gray-700">
                        3
                      </span>
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900">Analytics</p>
                      <p className="mt-1 text-sm text-gray-600">
                        Open Analytics to see triggers, DMs sent, and engagement over time.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      router.push('/dashboard/analytics');
                    }}
                    className="shrink-0 rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800"
                  >
                    Go to Analytics
                  </button>
                </div>
              </li>
            </ol>

            {onRequestAutomationsSpotlightTour && (
              <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-blue-100 bg-blue-50/70 px-4 py-3">
                <div className="flex min-w-0 flex-1 items-center gap-2">
                  <CursorArrowRaysIcon className="h-5 w-5 shrink-0 text-blue-600" aria-hidden />
                  <p className="truncate text-sm font-medium text-gray-800">
                    Spotlight tour — highlights each area on Automations.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onRequestAutomationsSpotlightTour();
                    onClose();
                  }}
                  className="shrink-0 rounded-lg border border-blue-600 bg-white px-3 py-1.5 text-sm font-semibold text-blue-700 shadow-sm hover:bg-blue-50"
                >
                  Start tour
                </button>
              </div>
            )}

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={onFinish}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Don&apos;t show again
              </button>
              <button
                type="button"
                onClick={onClose}
                className="text-sm font-medium text-gray-600 hover:text-gray-900"
              >
                I&apos;ll do this later
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

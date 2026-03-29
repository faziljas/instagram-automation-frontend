'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { XMarkIcon } from '@heroicons/react/24/outline';

export default function GettingStartedModal({
  isOpen,
  onClose,
  onFinish,
  hasConnectedAccount,
  onEngagementNavigate,
}: {
  isOpen: boolean;
  onClose: () => void;
  onFinish: () => void;
  /** When true, hide the connect step (user already has an Instagram account). */
  hasConnectedAccount: boolean;
  /** Call when user uses “Go to Automations” or “View Analytics” so the tour does not auto-open again. */
  onEngagementNavigate: () => void;
}) {
  const router = useRouter();
  const stepCount = hasConnectedAccount ? 2 : 3;

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  let stepIndex = 0;
  const nextStepLabel = () => {
    stepIndex += 1;
    return `${stepIndex})`;
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-gray-900/60 transition-opacity" onClick={onClose} />

        <div className="relative w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl">
          <div className="flex items-center justify-between border-b px-6 py-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Welcome to LogicDM</h2>
              <p className="mt-0.5 text-sm text-gray-600">
                {stepCount} quick {stepCount === 1 ? 'step' : 'steps'} to launch your first automation.
              </p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-700">
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          <div className="px-6 py-6">
            <ol className="space-y-4">
              {!hasConnectedAccount && (
                <li className="rounded-xl border border-gray-200 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        {nextStepLabel()} Connect your Instagram account
                      </p>
                      <p className="mt-1 text-sm text-gray-600">
                        This lets LogicDM read post/stories and send DMs on your behalf.
                      </p>
                    </div>
                    <button
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
                  <p className="text-sm font-semibold text-emerald-900">Instagram connected</p>
                  <p className="mt-1 text-sm text-emerald-800">
                    You’re set on accounts. Continue with automations and analytics below.
                  </p>
                </li>
              )}

              <li className="rounded-xl border border-gray-200 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      {nextStepLabel()} Create your first automation
                    </p>
                    <p className="mt-1 text-sm text-gray-600">
                      Go to Automations → pick a post/story/DM → launch your rule with the setup wizard.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      onEngagementNavigate();
                      onClose();
                      router.push('/dashboard/automations');
                    }}
                    className="shrink-0 rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800"
                  >
                    Go to Automations
                  </button>
                </div>
              </li>

              <li className="rounded-xl border border-gray-200 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      {nextStepLabel()} Verify it’s working
                    </p>
                    <p className="mt-1 text-sm text-gray-600">
                      Use Analytics to confirm triggers, DMs sent, and clicks/leads.
                    </p>
                  </div>
                  <button
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

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <button
                onClick={onFinish}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Got it — don’t show again
              </button>
              <button
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


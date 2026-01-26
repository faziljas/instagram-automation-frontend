'use client';

import { CheckIcon } from '@heroicons/react/24/outline';

interface Plan {
  id: string;
  name: string;
  price: string;
  priceId?: string; // Stripe price ID
  features: {
    maxAccounts: number | string;
    maxDMsPerDay: number | string;
    maxRules: number | string;
    supportLevel: string;
    customFeatures?: string[];
  };
}

interface PlanComparisonProps {
  currentPlan: string;
  onUpgrade: (planId: string, priceId?: string) => void;
  onClose: () => void;
}

const plans: Plan[] = [
  {
    id: 'free',
    name: 'Free',
    price: '$0',
    features: {
      maxAccounts: 1,
      maxDMsPerDay: 50,
      maxRules: 2,
      supportLevel: 'Community Support',
      customFeatures: ['Basic automation', 'Email notifications'],
    },
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '$29',
    priceId: 'price_pro_monthly', // Replace with actual Stripe Price ID
    features: {
      maxAccounts: 5,
      maxDMsPerDay: 500,
      maxRules: 10,
      supportLevel: 'Email Support',
      customFeatures: [
        'Advanced automation',
        'Analytics dashboard',
        'Priority email support',
        'Custom message templates',
      ],
    },
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: '$99',
    priceId: 'price_enterprise_monthly', // Replace with actual Stripe Price ID
    features: {
      maxAccounts: 'Unlimited',
      maxDMsPerDay: 'Unlimited',
      maxRules: 'Unlimited',
      supportLevel: '24/7 Priority Support',
      customFeatures: [
        'All Pro features',
        'Dedicated account manager',
        'Custom integrations',
        'Advanced analytics',
        'API access',
        'White-label options',
      ],
    },
  },
];

export function PlanComparison({ currentPlan, onUpgrade, onClose }: PlanComparisonProps) {
  const handleUpgrade = (planId: string, priceId?: string) => {
    if (planId === currentPlan) {
      return; // Already on this plan
    }
    onUpgrade(planId, priceId);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 py-8">
        {/* Overlay */}
        <div
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="relative bg-white rounded-lg shadow-xl max-w-6xl w-full p-6">
          {/* Header */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Choose Your Plan</h2>
            <p className="mt-2 text-gray-600">
              Select the plan that best fits your needs. Upgrade or downgrade anytime.
            </p>
          </div>

          {/* Plans Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {plans.map((plan) => {
              const isCurrentPlan = plan.id === currentPlan;

              return (
                <div
                  key={plan.id}
                  className={`relative border-2 rounded-lg p-6 ${
                    isCurrentPlan
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                >
                  {/* Current Plan Badge */}
                  {isCurrentPlan && (
                    <div className="absolute top-0 right-0 -mt-3 -mr-3">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-600 text-white">
                        <CheckIcon className="h-4 w-4 mr-1" />
                        Current Plan
                      </span>
                    </div>
                  )}

                  {/* Plan Name */}
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h3>

                  {/* Price */}
                  <div className="mb-4">
                    <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                    {plan.id !== 'free' && <span className="text-gray-600">/month</span>}
                  </div>

                  {/* Features */}
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center text-sm">
                      <CheckIcon className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                      <span className="text-gray-700">
                        <strong>{plan.features.maxAccounts}</strong>{' '}
                        {typeof plan.features.maxAccounts === 'number' ? 'account(s)' : 'accounts'}
                      </span>
                    </div>
                    <div className="flex items-center text-sm">
                      <CheckIcon className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                      <span className="text-gray-700">
                        <strong>{plan.features.maxDMsPerDay}</strong> DMs/day
                      </span>
                    </div>
                    <div className="flex items-center text-sm">
                      <CheckIcon className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                      <span className="text-gray-700">
                        <strong>{plan.features.maxRules}</strong>{' '}
                        {typeof plan.features.maxRules === 'number' ? 'rule(s)' : 'rules'}
                      </span>
                    </div>
                    <div className="flex items-center text-sm">
                      <CheckIcon className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                      <span className="text-gray-700">{plan.features.supportLevel}</span>
                    </div>

                    {/* Custom Features */}
                    {plan.features.customFeatures &&
                      plan.features.customFeatures.map((feature, index) => (
                        <div key={index} className="flex items-center text-sm">
                          <CheckIcon className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                          <span className="text-gray-700">{feature}</span>
                        </div>
                      ))}
                  </div>

                  {/* Upgrade Button */}
                  <button
                    onClick={() => handleUpgrade(plan.id, plan.priceId)}
                    disabled={isCurrentPlan}
                    className={`w-full py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                      isCurrentPlan
                        ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                        : 'bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                    }`}
                  >
                    {isCurrentPlan
                      ? 'Current Plan'
                      : plan.id === 'free'
                      ? 'Downgrade to Free'
                      : 'Upgrade to ' + plan.name}
                  </button>
                </div>
              );
            })}
          </div>

          {/* Close Button */}
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

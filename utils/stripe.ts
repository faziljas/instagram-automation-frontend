import { loadStripe, Stripe } from '@stripe/stripe-js';

let stripePromise: Promise<Stripe | null>;

/**
 * Get Stripe.js instance
 * Initializes Stripe with publishable key from environment variables
 */
export const getStripe = (): Promise<Stripe | null> => {
  if (!stripePromise) {
    const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

    if (!publishableKey) {
      console.error('Stripe publishable key is not configured');
      return Promise.resolve(null);
    }

    stripePromise = loadStripe(publishableKey);
  }

  return stripePromise;
};

/**
 * Redirect to Stripe Checkout
 * Creates a checkout session and redirects user to Stripe's hosted checkout page
 *
 * @param priceId - Stripe Price ID for the subscription
 * @returns Promise that resolves when redirect is initiated
 */
export const redirectToCheckout = async (priceId: string): Promise<void> => {
  try {
    const stripe = await getStripe();

    if (!stripe) {
      throw new Error('Stripe is not initialized');
    }

    // Call backend to create checkout session
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/subscription/checkout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
      },
      body: JSON.stringify({
        priceId,
        successUrl: `${window.location.origin}/dashboard/subscription?success=true`,
        cancelUrl: `${window.location.origin}/dashboard/subscription?canceled=true`,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Failed to create checkout session');
    }

    const { sessionId } = await response.json();

    // Redirect to Stripe Checkout
    await (stripe as any).redirectToCheckout({
      sessionId,
    });
  } catch (err) {
    console.error('Error redirecting to checkout:', err);
    throw err;
  }
};

/**
 * Get success/cancel status from URL parameters
 * Used to show appropriate message after returning from Stripe Checkout
 *
 * @returns Object with success and canceled boolean flags
 */
export const getCheckoutStatus = (): { success: boolean; canceled: boolean } => {
  if (typeof window === 'undefined') {
    return { success: false, canceled: false };
  }

  const searchParams = new URLSearchParams(window.location.search);

  return {
    success: searchParams.get('success') === 'true',
    canceled: searchParams.get('canceled') === 'true',
  };
};

/**
 * Clear checkout status from URL
 * Removes success/canceled query parameters from URL without page reload
 */
export const clearCheckoutStatus = (): void => {
  if (typeof window === 'undefined') {
    return;
  }

  const url = new URL(window.location.href);
  url.searchParams.delete('success');
  url.searchParams.delete('canceled');

  window.history.replaceState({}, '', url.toString());
};

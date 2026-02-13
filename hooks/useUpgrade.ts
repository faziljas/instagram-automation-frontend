import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { usePost } from '@/hooks/useApi';

interface CheckoutSessionResponse {
  checkout_url: string;
}

export function useUpgrade() {
  const router = useRouter();
  const { session } = useAuth();
  const { execute: createCheckoutSession, loading: checkoutLoading } = usePost<CheckoutSessionResponse>();

  const handleUpgrade = async () => {
    try {
      // Ensure we have a valid auth session before calling the backend
      if (!session?.access_token) {
        console.warn('⚠️ No valid session found when trying to upgrade plan');
        router.push('/login?redirect=/dashboard/subscription');
        return;
      }

      console.log('🔄 Creating Stripe checkout session...');
      
      const response = await createCheckoutSession('/api/dodo/create-checkout-session', {});
      
      console.log('✅ Checkout session response:', response);
      
      if (response?.checkout_url) {
        // Redirect to Stripe Checkout
        console.log('🔗 Redirecting to Stripe Checkout:', response.checkout_url);
        window.location.href = response.checkout_url;
      } else {
        console.error('❌ No checkout_url in response:', response);
        throw new Error('Unable to start the upgrade process. Please try again in a moment.');
      }
    } catch (error) {
      console.error('❌ Failed to create checkout session:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to create checkout session';
      
      // Friendlier error handling:
      // - Treat auth/token errors as session expiry
      // - Treat Dodo API errors as payment service issues
      if (errorMessage.includes('Missing authorization header') ||
          errorMessage.includes('Invalid token') ||
          errorMessage.toLowerCase().includes('session expired')) {
        router.push('/login?redirect=/dashboard/subscription');
        throw new Error('Your session has expired. Please log in again to upgrade your plan.');
      } else if (errorMessage.startsWith('Dodo API error')) {
        throw new Error('Our payment provider temporarily rejected the request. Please try again or contact support if this keeps happening.');
      } else {
        throw new Error(errorMessage || 'Failed to create checkout session. Please check your connection and try again.');
      }
    }
  };

  return {
    handleUpgrade,
    checkoutLoading,
  };
}

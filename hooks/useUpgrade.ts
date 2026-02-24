import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

export function useUpgrade() {
  const router = useRouter();
  const { session } = useAuth();

  const handleUpgrade = () => {
    if (!session?.access_token) {
      router.push('/login?redirect=/dashboard/subscription');
      return;
    }
    // Send user to subscription page to choose Monthly or Yearly, then checkout
    router.push('/dashboard/subscription?choosePlan=1');
  };

  return {
    handleUpgrade,
    checkoutLoading: false,
  };
}

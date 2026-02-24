'use client';

import { usePathname } from 'next/navigation';
import Footer from './Footer';
import { useAuth } from '@/hooks/useAuth';

export default function ConditionalFooter() {
  const pathname = usePathname();
  const { isAuthenticated } = useAuth();

  // Hide footer on home page (it has its own comprehensive footer)
  // Also hide footer entirely for authenticated users (dashboard and app views)
  if (pathname === '/' || isAuthenticated) {
    return null;
  }
  
  return <Footer />;
}

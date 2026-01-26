import { Metadata } from 'next';

const defaultTitle = 'LogicDM Automation';
const defaultDescription = 'Automate your Instagram marketing and engagement with powerful automation rules, scheduled posts, and analytics.';
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://instagramauto.com';

/**
 * Generate metadata for pages
 */
export function generateMetadata({
  title,
  description,
  path = '',
  image,
  noIndex = false,
}: {
  title?: string;
  description?: string;
  path?: string;
  image?: string;
  noIndex?: boolean;
}): Metadata {
  const pageTitle = title ? `${title} | ${defaultTitle}` : defaultTitle;
  const pageDescription = description || defaultDescription;
  const pageUrl = `${siteUrl}${path}`;
  const pageImage = image || `${siteUrl}/og-image.png`;

  return {
    title: pageTitle,
    description: pageDescription,
    robots: noIndex ? { index: false, follow: false } : { index: true, follow: true },
    openGraph: {
      type: 'website',
      url: pageUrl,
      title: pageTitle,
      description: pageDescription,
      siteName: defaultTitle,
      images: [
        {
          url: pageImage,
          width: 1200,
          height: 630,
          alt: pageTitle,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: pageTitle,
      description: pageDescription,
      images: [pageImage],
    },
    alternates: {
      canonical: pageUrl,
    },
  };
}

/**
 * Page metadata configurations
 */
export const pageMetadata = {
  home: generateMetadata({
    title: 'Home',
    description: 'Automate your Instagram marketing with AI-powered automation rules, scheduled posts, and engagement tools.',
    path: '/',
  }),

  dashboard: generateMetadata({
    title: 'Dashboard',
    description: 'Manage your Instagram automation campaigns and view analytics.',
    path: '/dashboard',
    noIndex: true,
  }),

  accounts: generateMetadata({
    title: 'Instagram Accounts',
    description: 'Manage your connected Instagram accounts and monitor their performance.',
    path: '/dashboard/accounts',
    noIndex: true,
  }),

  accountsConnect: generateMetadata({
    title: 'Connect Instagram Account',
    description: 'Connect your Instagram account to start automating your marketing.',
    path: '/dashboard/accounts/connect',
    noIndex: true,
  }),

  rules: generateMetadata({
    title: 'Automation Rules',
    description: 'Create and manage your Instagram automation rules for likes, comments, follows, and more.',
    path: '/dashboard/rules',
    noIndex: true,
  }),

  rulesCreate: generateMetadata({
    title: 'Create Automation Rule',
    description: 'Set up a new automation rule for your Instagram account.',
    path: '/dashboard/rules/create',
    noIndex: true,
  }),

  subscription: generateMetadata({
    title: 'Subscription & Billing',
    description: 'Manage your subscription plan and billing information.',
    path: '/dashboard/subscription',
    noIndex: true,
  }),

  settings: generateMetadata({
    title: 'Settings',
    description: 'Manage your account settings and preferences.',
    path: '/dashboard/settings',
    noIndex: true,
  }),

  webhooks: generateMetadata({
    title: 'Webhook Logs',
    description: 'View and monitor your webhook event logs.',
    path: '/dashboard/settings/webhooks',
    noIndex: true,
  }),

  login: generateMetadata({
    title: 'Login',
    description: 'Sign in to your Instagram Automation account.',
    path: '/login',
    noIndex: true,
  }),

  register: generateMetadata({
    title: 'Create Account',
    description: 'Create your Instagram Automation account and start automating today.',
    path: '/register',
    noIndex: true,
  }),
};

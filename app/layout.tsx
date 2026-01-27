import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { AuthProvider } from '@/contexts/AuthContext';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import Footer from '@/components/Footer';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://instagramauto.com';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
  },
  title: {
    default: 'LogicDM',
  },
  description: 'Automate your Instagram marketing and engagement with powerful automation rules, scheduled posts, and analytics. Grow your audience effortlessly.',
  keywords: ['Instagram automation', 'Instagram marketing', 'social media automation', 'Instagram growth', 'auto like', 'auto follow', 'scheduled posts'],
  authors: [{ name: 'Instagram Automation SaaS' }],
  creator: 'Instagram Automation SaaS',
  publisher: 'Instagram Automation SaaS',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: siteUrl,
    siteName: 'LogicDM Automation',
    title: 'LogicDM Automation - Automate Your Instagram Marketing',
    description: 'Automate your Instagram marketing and engagement with powerful automation rules, scheduled posts, and analytics.',
    images: [
      {
        url: `${siteUrl}/og-image.png`,
        width: 1200,
        height: 630,
        alt: 'LogicDM Automation',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'LogicDM Automation',
    description: 'Automate your Instagram marketing and engagement with powerful automation rules.',
    images: [`${siteUrl}/og-image.png`],
    creator: '@instagramauto',
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} flex flex-col min-h-screen`}>
        <ErrorBoundary>
          <AuthProvider>
            <div className="flex-1">
              {children}
            </div>
            <div className="auth-pages-footer">
              <Footer />
            </div>
          </AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}

import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { AuthProvider } from '@/contexts/AuthContext';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import ConditionalFooter from '@/components/ConditionalFooter';
import { CanonicalLink } from '@/components/CanonicalLink';
import { getCanonicalBase } from '@/lib/canonical';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });
const baseUrl = getCanonicalBase();

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: 'LogicDM - Instagram Automation & Marketing',
    template: '%s | LogicDM',
  },
  description: 'Automate your Instagram DMs, replies, and engagement with powerful automation rules. Get 1,000 free DMs per month. Grow your audience effortlessly with Instagram API-compliant automation.',
  keywords: ['Instagram automation', 'Instagram DM automation', 'Instagram marketing', 'social media automation', 'Instagram growth', 'auto reply', 'Instagram engagement', 'lead generation', 'Instagram API'],
  authors: [{ name: 'LogicDM' }],
  creator: 'LogicDM',
  publisher: 'LogicDM',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: baseUrl,
    siteName: 'LogicDM',
    title: 'LogicDM - Instagram Automation & Marketing Made Easy',
    description: 'Automate your Instagram DMs, replies, and engagement with powerful automation rules. Get 1,000 free DMs per month.',
    images: [
      {
        url: `${baseUrl}/og-image.png`,
        width: 1200,
        height: 630,
        alt: 'LogicDM - Instagram Automation Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'LogicDM - Instagram Automation',
    description: 'Automate your Instagram DMs and engagement with powerful automation rules. Start free today.',
    images: [`${baseUrl}/og-image.png`],
    creator: '@logicdm',
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
  verification: {
    google: 'your-google-verification-code',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" style={{ height: '100%', backgroundColor: 'rgb(243 244 246)' }}>
      <body className={`${inter.className} flex flex-col min-h-screen`} style={{ backgroundColor: 'rgb(243 244 246)' }}>
        <CanonicalLink />
        <ErrorBoundary>
          <AuthProvider>
            <div className="flex-1 flex flex-col" style={{ minHeight: '100vh', backgroundColor: 'rgb(243 244 246)' }}>
              {children}
            </div>
            {/* Footer is conditionally rendered - home page has its own footer */}
            <div className="auth-pages-footer">
              <ConditionalFooter />
            </div>
          </AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}

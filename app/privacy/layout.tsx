import { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    absolute: 'Privacy Policy - LogicDM',
  },
  description: 'LogicDM Privacy Policy - Learn how we collect, use, and protect your personal information when using our service.',
  robots: {
    index: true,
    follow: true,
  },
};

export default function PrivacyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

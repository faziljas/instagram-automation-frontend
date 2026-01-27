import { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    absolute: 'Terms of Service - LogicDM',
  },
  description: 'LogicDM Terms of Service - Read our terms and conditions for using our automation platform and services.',
  robots: {
    index: true,
    follow: true,
  },
};

export default function TermsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

import { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    absolute: 'Refund & Cancellation Policy - LogicDM',
  },
  description: 'LogicDM Refund and Cancellation Policy - Learn about subscription cancellation and our money-back guarantee.',
  robots: {
    index: true,
    follow: true,
  },
};

export default function RefundPolicyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

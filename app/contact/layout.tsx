import { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    absolute: 'Contact Us - LogicDM',
  },
  description: 'Contact LogicDM - Support email, registered address, and grievance officer for customer support and queries.',
  robots: {
    index: true,
    follow: true,
  },
};

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

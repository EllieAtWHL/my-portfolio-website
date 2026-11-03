import type { Metadata } from 'next';

// contact-me/page.tsx is a client component, so its metadata lives here
// (WEB-238). The root layout's template adds "| Ellie Matthewman".
export const metadata: Metadata = {
  title: 'Contact Me',
  description: 'Get in touch with Ellie Matthewman about Salesforce, mentoring, speaking or community events.',
  alternates: { canonical: '/contact-me' },
};

export default function ContactMeLayout({ children }: { children: React.ReactNode }) {
  return children;
}

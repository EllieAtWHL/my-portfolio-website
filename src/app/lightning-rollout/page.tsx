import Footer from '@/components/Footer';
import LightningRolloutContent from '@/components/LightningRolloutContent';

export const metadata = {
  title: 'Salesforce Lightning Rollout Series',
  description: 'A comprehensive 3-part guide to successfully migrating from Salesforce Classic to Lightning, from business buy-in to post-migration adoption.',
  openGraph: {
    title: 'EllieAtWHL - Salesforce Lightning Rollout Series',
    description: 'A comprehensive 3-part guide to successfully migrating from Salesforce Classic to Lightning, from business buy-in to post-migration adoption.',
    url: 'https://ellieatwhl.co.uk/lightning-rollout',
    type: 'website',
    images: [
      {
        url: 'https://ellieatwhl.co.uk/favicon.ico',
        width: 1200,
        height: 630,
        alt: 'Salesforce Lightning Rollout Series',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'EllieAtWHL - Salesforce Lightning Rollout Series',
    description: 'A comprehensive 3-part guide to successfully migrating from Salesforce Classic to Lightning, from business buy-in to post-migration adoption.',
    images: ['https://ellieatwhl.co.uk/favicon.ico'],
  },
};

export default function LightningRollout() {
  return (
    <div className="content">
      <div className="scrollable">
        <LightningRolloutContent />
      </div>
      <Footer />
    </div>
  );
}

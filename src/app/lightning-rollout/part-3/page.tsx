import LightningRolloutPart3 from '@/components/LightningRolloutPart3';
import MainSitePage from '@/components/MainSitePage';

export const metadata = {
  title: 'Salesforce Lightning Rollout | Part 3',
  description: "We've Migrated to Lightning, Now What? This guide walks you through the steps you can take after migration to ensure that it is adopted by users successfully.",
  openGraph: {
    title: 'EllieAtWHL - Salesforce Lightning Rollout | Part 3',
    description: "We've Migrated to Lightning, Now What? This guide walks you through the steps you can take after migration to ensure that it is adopted by users successfully.",
    url: 'https://ellieatwhl.co.uk/lightning-rollout/part-3',
    type: 'website',
    images: [
      {
        url: 'https://ellieatwhl.co.uk/favicon.ico',
        width: 1200,
        height: 630,
        alt: 'Salesforce Lightning Rollout Part 3',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'EllieAtWHL - Salesforce Lightning Rollout | Part 3',
    description: "We've Migrated to Lightning, Now What? This guide walks you through the steps you can take after migration to ensure that it is adopted by users successfully.",
    images: ['https://ellieatwhl.co.uk/favicon.ico'],
  },
};

export default function LightningRolloutPart3Page() {
  return (
    <MainSitePage>
      <div className="content-with-footer">
        <div className="scrollable">
          <LightningRolloutPart3 />
        </div>
      </div>
    </MainSitePage>
  );
}

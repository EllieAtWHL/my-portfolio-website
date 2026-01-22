import LightningRolloutPart1 from '@/components/LightningRolloutPart1';
import MainSitePage from '@/components/MainSitePage';

export const metadata = {
  title: 'Salesforce Lightning Rollout | Part 1',
  description: 'How To Persuade Your Business To Let Lightning Strike. Before starting the Salesforce migration from Classic to Lightning, you need buy-in from all levels of the business.',
  openGraph: {
    title: 'EllieAtWHL - Salesforce Lightning Rollout | Part 1',
    description: 'How To Persuade Your Business To Let Lightning Strike. Before starting the Salesforce migration from Classic to Lightning, you need buy-in from all levels of the business.',
    url: 'https://ellieatwhl.co.uk/lightning-rollout/part-1',
    type: 'website',
    images: [
      {
        url: 'https://ellieatwhl.co.uk/favicon.ico',
        width: 1200,
        height: 630,
        alt: 'Salesforce Lightning Rollout Part 1',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'EllieAtWHL - Salesforce Lightning Rollout | Part 1',
    description: 'How To Persuade Your Business To Let Lightning Strike. Before starting the Salesforce migration from Classic to Lightning, you need buy-in from all levels of the business.',
    images: ['https://ellieatwhl.co.uk/favicon.ico'],
  },
};

export default function LightningRolloutPart1Page() {
  return (
    <MainSitePage>
      <div className="content-with-footer">
        <div className="scrollable">
          <LightningRolloutPart1 />
        </div>
      </div>
    </MainSitePage>
  );
}

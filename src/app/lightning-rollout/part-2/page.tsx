import LightningRolloutPart2 from '@/components/LightningRolloutPart2';
import MainSitePage from '@/components/MainSitePage';

export const metadata = {
  title: 'Salesforce Lightning Rollout | Part 2',
  description: 'Running the Migration Project. This guide can provide you with the information you need to successfully complete the steps needed to migrate from Salesforce Classic to Lightning.',
  openGraph: {
    title: 'EllieAtWHL - Salesforce Lightning Rollout | Part 2',
    description: 'Running the Migration Project. This guide can provide you with the information you need to successfully complete the steps needed to migrate from Salesforce Classic to Lightning.',
    url: 'https://ellieatwhl.co.uk/lightning-rollout/part-2',
    type: 'website',
    images: [
      {
        url: 'https://ellieatwhl.co.uk/favicon.ico',
        width: 1200,
        height: 630,
        alt: 'Salesforce Lightning Rollout Part 2',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'EllieAtWHL - Salesforce Lightning Rollout | Part 2',
    description: 'Running the Migration Project. This guide can provide you with the information you need to successfully complete the steps needed to migrate from Salesforce Classic to Lightning.',
    images: ['https://ellieatwhl.co.uk/favicon.ico'],
  },
};

export default function LightningRolloutPart2Page() {
  return (
    <MainSitePage>
      <div className="content">
        <div className="scrollable">
          <LightningRolloutPart2 />
        </div>
      </div>
    </MainSitePage>
  );
}

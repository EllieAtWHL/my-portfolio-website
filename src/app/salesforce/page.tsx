import SalesforceContent from '@/components/SalesforceContent';
import MainSitePage from '@/components/MainSitePage';

export const metadata = {
  title: 'Salesforce',
  description: 'My Salesforce projects, guides and applications, from a Lightning migration series to a Fantasy Football draft app.',
  openGraph: {
    title: 'EllieAtWHL - Salesforce',
    description: 'My Salesforce projects, guides and applications, from a Lightning migration series to a Fantasy Football draft app.',
    url: 'https://ellieatwhl.co.uk/salesforce',
    type: 'website',
    images: [
      {
        url: 'https://ellieatwhl.co.uk/img/salesforce.png',
        alt: 'Salesforce projects',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'EllieAtWHL - Salesforce',
    description: 'My Salesforce projects, guides and applications, from a Lightning migration series to a Fantasy Football draft app.',
    images: ['https://ellieatwhl.co.uk/img/salesforce.png'],
  },
};

export default function Salesforce() {
  return (
    <MainSitePage>
      <div className="content-with-footer">
        <div className="scrollable">
          <SalesforceContent />
        </div>
      </div>
    </MainSitePage>
  );
}

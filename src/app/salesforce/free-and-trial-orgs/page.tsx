import Footer from '@/components/Footer';
import SalesforceOrgsContent from '@/components/SalesforceOrgsContent';

export const metadata = {
  title: 'Salesforce Free and Trial Orgs',
  description: 'A table of the available free and trial orgs for Salesforce products.',
  openGraph: {
    title: 'EllieAtWHL - Salesforce Free and Trial Orgs',
    description: 'A table of the available free and trial orgs for Salesforce products.',
    url: 'https://ellieatwhl.co.uk/salesforce/free-and-trial-orgs',
    type: 'website',
    images: [
      {
        url: 'https://ellieatwhl.co.uk/salesforce/free-and-trial-orgs/orgsPreview.png',
        width: 1221,
        height: 690,
        alt: 'Salesforce Free and Trial Orgs',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'EllieAtWHL - Salesforce Free and Trial Orgs',
    description: 'A table of the available free and trial orgs for Salesforce products.',
    images: ['https://ellieatwhl.co.uk/salesforce/free-and-trial-orgs/orgsPreview.png'],
  },
};

export default function SalesforceOrgs() {
  return (
    <div className="content">
      <div className="scrollable">
        <SalesforceOrgsContent />
      </div>
      <Footer />
    </div>
  );
}

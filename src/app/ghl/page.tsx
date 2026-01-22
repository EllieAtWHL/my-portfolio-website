import Footer from '@/components/Footer';
import FantasyFootballContent from '@/components/FantasyFootballContent';
import MainSitePage from '@/components/MainSitePage';

export const metadata = {
  title: 'Fantasy Football Draft Application',
  description: 'How I used Salesforce to create a draft application for our Fantasy Football league',
  openGraph: {
    title: 'EllieAtWHL - Fantasy Football Draft Application',
    description: 'How I used Salesforce to create a draft application for our Fantasy Football league',
    url: 'https://ellieatwhl.co.uk/ghl',
    type: 'website',
    images: [
      {
        url: 'https://ellieatwhl.co.uk/ghl/images/GHLdataModel.png',
        width: 1200,
        height: 630,
        alt: 'Fantasy Football Draft Application',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'EllieAtWHL - Fantasy Football Draft Application',
    description: 'How I used Salesforce to create a draft application for our Fantasy Football league',
    images: ['https://ellieatwhl.co.uk/ghl/images/GHLdataModel.png'],
  },
};

export default function FantasyFootball() {
  return (
    <MainSitePage>
      <div className="content-with-footer">
        <FantasyFootballContent />
      </div>
    </MainSitePage>
  );
}

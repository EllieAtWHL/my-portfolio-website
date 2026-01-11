import Footer from '@/components/Footer';
import RegicideGame from '@/components/RegicideGame';

export const metadata = {
  title: 'Regicide',
  description: 'Regicide is a challenging, card game based on a standard 52 card deck.',
  openGraph: {
    title: 'EllieAtWHL - Regicide',
    description: 'Regicide is a challenging, card game based on a standard 52 card deck.',
    url: 'https://ellieatwhl.co.uk/regicide',
    type: 'website',
    images: [
      {
        url: 'https://ellieatwhl.co.uk/regicide/imgs/regicide.png',
        width: 1200,
        height: 630,
        alt: 'Regicide Card Game',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'EllieAtWHL - Regicide',
    description: 'Regicide is a challenging, card game based on a standard 52 card deck.',
    images: ['https://ellieatwhl.co.uk/regicide/imgs/regicide.png'],
  },
};

export default function Regicide() {
  return (
    <div className="content">
      <div className="scrollable">
        <RegicideGame />
      </div>
      <Footer />
    </div>
  );
}

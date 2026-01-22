import Footer from '@/components/Footer';
import MainSitePage from '@/components/MainSitePage';
import RegicideGame from '@/components/RegicideGame';
import { Card } from '@/components/Card';

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
    <MainSitePage>
      <div className="content-with-footer">
        <div className="scrollable">
          {/* Maintenance Notice - Temporarily replacing the game while under maintenance */}
          <div className="min-h-[60vh] flex items-center justify-center p-8">
            <Card variant="accent" padding="lg" className="max-w-2xl text-center">
              <div className="mb-6">
                <div className="text-6xl mb-4">🃏</div>
                <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2">Regicide Game</h1>
              </div>
              
              <div className="space-y-4">
                <div className="bg-yellow-50 dark:bg-yellow-900/30 border-l-4 border-yellow-400 dark:border-yellow-600 p-4 rounded">
                  <p className="text-lg font-semibold text-yellow-800 dark:text-yellow-300 mb-2">
                    ⚠️ Under Maintenance
                  </p>
                  <p className="text-gray-700 dark:text-gray-300">
                    The Regicide game is currently down for maintenance while we work on improvements and bug fixes.
                  </p>
                </div>
                
                <p className="text-gray-600 dark:text-gray-400">
                  We hope to get the game back up and running soon! Thank you for your patience and understanding.
                </p>
              </div>
            </Card>
          </div>
        </div>
        
        {/* Original game component - commented out during maintenance
        <RegicideGame />
        */}
      </div>
      <Footer />
    </MainSitePage>
  );
}

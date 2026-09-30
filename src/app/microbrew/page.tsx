import MainSitePage from '@/components/MainSitePage';
import MicrobrewGame from '@/components/MicrobrewGame';
import { isMicrobrewPlayable } from '@/lib/microbrew/availability';

const description =
  'Microbrew is a medium-weight worker placement / puzzle game hybrid for two players. An unofficial digital version of the One Free Elephant board game.';

// No share image yet: Regicide's is a gameplay screenshot, and the game's own
// box art would make link previews read as official. Add
// public/microbrew/microbrew.png and openGraph/twitter `images` once there's
// a play area to screenshot (WEB-189).
export const metadata = {
  title: 'Microbrew',
  description,
  openGraph: {
    title: 'EllieAtWHL - Microbrew',
    description,
    url: 'https://ellieatwhl.co.uk/microbrew',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'EllieAtWHL - Microbrew',
    description,
  },
};

export default function Microbrew() {
  return (
    <MainSitePage>
      <div className="content-with-footer">
        <div className="scrollable">
          <MicrobrewGame playable={isMicrobrewPlayable()} />
        </div>
      </div>
    </MainSitePage>
  );
}

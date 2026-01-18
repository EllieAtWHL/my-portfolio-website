import MainSitePage from '@/components/MainSitePage';
import London2012Sidebar from '@/components/London2012Sidebar';
import Image from 'next/image';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'EllieAtWHL - My First Audition',
  description: 'The journey of a volunteer performer at the Olympic Ceremonies',
  openGraph: {
    title: 'EllieAtWHL - My Olympic Journey',
    description: 'The journey of a volunteer performer at the Olympic Ceremonies',
    url: '/london-2012/my-first-audition',
    type: 'website',
    images: [
      {
        url: '/london-2012/3mills.jpg',
        width: 800,
        height: 600,
        alt: '3 Mills Studio, London',
      },
    ],
  },
};

export default function MyFirstAuditionPage() {
  return (
    <MainSitePage>
      <div className="content min-h-screen bg-pale-green dark:bg-third-colour">
        <div className="flex flex-col lg:flex-row">
          {/* Sidebar */}
          <aside className="w-full lg:w-1/4 lg:fixed lg:left-0 lg:top-0 lg:h-screen lg:border-r lg:border-pale-green dark:lg:border-third-colour lg:pr-4 lg:py-8">
            <London2012Sidebar />
          </aside>

          {/* Main Content */}
          <main className="w-full lg:w-3/4 lg:ml-[25%] lg:pl-8 p-6">
            <article className="max-w-4xl mx-auto">
              {/* Date with image */}
              <div className="flex items-center gap-4 mb-6">
                <time className="date italic text-gray-600 dark:text-gray-400" dateTime="2011-11-04">
                  4th November 2011
                </time>
                <Image
                  src="/london-2012/img/2011-11-04.png"
                  alt="4th November 2011"
                  width={100}
                  height={40}
                  className="h-auto"
                />
              </div>

              <h1 className="text-3xl font-bold mb-6">My First Audition</h1>

              <div className="space-y-6 text-lg">
                <p>
                  The day of my audition had finally arrived, and I was a bundle of nerves. Initially, I had planned to keep it a secret, but I eventually opened up to a few close members of my family. I didn't want to bear the weight of potential disappointment alone, but at the same time, I didn't want to face a crowd in case this was the end of my dream.
                </p>

                <p>
                  As I made my way to 3 Mills Studio, the anticipation grew within me. Located conveniently near the Bromley-By-Bow tube station, the journey was seamless and easy for me to navigate. The stage was set, and I was ready to give it my all.
                </p>

                {/* 3 Mills Studio image */}
                <div className="relative">
                  <Image
                    src="/london-2012/3mills.jpg"
                    alt="3 Mills Studio, London"
                    width={800}
                    height={600}
                    className="w-full rounded-lg shadow-lg"
                  />
                  <figcaption className="text-center text-sm text-gray-600 dark:text-gray-400 mt-2">
                    3 Mills Studio, London
                  </figcaption>
                </div>

                <p>
                  Arriving early, as was my habit, I found myself towards the front of the line, surrounded by eager hopefuls. As I gazed around, I saw that there were around 200 people in each of the three simultaneous auditions. My number, 061, caught my eye - it was the year that my beloved football team, Spurs, had won the double. Could this be a sign of good things to come?
                </p>

                {/* Bib 061 image */}
                <div className="relative">
                  <Image
                    src="/london-2012/bib061.jpg"
                    alt="Bib 061"
                    width={400}
                    height={300}
                    className="w-full max-w-md mx-auto rounded-lg shadow-lg"
                  />
                </div>

                <p>
                  As the audition began, we were introduced to{' '}
                  <a 
                    href="https://www.steveboydportfolio.com/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200 underline"
                  >
                    Steve Boyd
                  </a>
                  , the Director of Mass Movement. With a wealth of experience in Olympic and Commonwealth ceremonies, I couldn't help but feel that I was in good hands. Little did I know, his voice would become a familiar sound over the coming months.
                </p>

                <p>
                  The audition was a thrilling three-part journey, starting with simple movements and gradually escalating in complexity. As a seasoned dancer, I felt confident and in my element, relishing each new challenge. One of the standout moments was when the iconic beats of Beyonce's "Love On Top" filled the room. This song will forever hold a special place in my heart as a reminder of this unforgettable day.
                </p>

                {/* Spotify embed */}
                <div className="rounded-lg overflow-hidden">
                  <iframe
                    style={{ borderRadius: '12px' }}
                    src="https://open.spotify.com/embed/track/1z6WtY7X4HQJvzxC4UgkSf?utm_source=generator&theme=0"
                    width="100%"
                    height="152"
                    frameBorder="0"
                    allowFullScreen
                    allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                    loading="lazy"
                    className="dark:bg-gray-800"
                  />
                </div>

                <p>
                  The atmosphere was electric, and I felt as though I had already become a part of the London 2012 experience, even if this was the end of my journey. As the audition came to a close, we were informed that we would receive a response within 48 hours. The anticipation was almost too much to bear, and I found myself checking my phone every few minutes, waiting for that all-important email. It was a day I will never forget.
                </p>
              </div>
            </article>
          </main>
        </div>
      </div>
    </MainSitePage>
  );
}

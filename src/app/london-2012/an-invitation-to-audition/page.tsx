import MainSitePage from '@/components/MainSitePage';
import London2012Sidebar from '@/components/London2012Sidebar';
import Image from 'next/image';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'EllieAtWHL - An Invitation to Audition',
  description: 'The journey of a volunteer performer at the Olympic Ceremonies',
  openGraph: {
    title: 'EllieAtWHL - My Olympic Journey',
    description: 'The journey of a volunteer performer at the Olympic Ceremonies',
    url: '/london-2012/an-invitation-to-audition',
    type: 'website',
    images: [
      {
        url: '/london-2012/invite-to-audition.jpg',
        width: 800,
        height: 600,
        alt: 'An email inviting me to audition',
      },
    ],
  },
};

export default function AnInvitationToAuditionPage() {
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
                <time className="date italic text-gray-600 dark:text-gray-400" dateTime="2011-09-15">
                  15th September 2011
                </time>
                <Image
                  src="/london-2012/img/2011-09-15.png"
                  alt="15th September 2011"
                  width={100}
                  height={40}
                  className="h-auto"
                />
              </div>

              <h1 className="text-3xl font-bold mb-6">An Invitation to Audition</h1>

              <div className="space-y-6 text-lg">
                <p>
                  I had almost forgotten I had applied when out of nowhere, I received my invitation to audition for Olympic Ceremonies, one month after submitting my application. Anything worth anything, often has roadblocks in the way and it was as I completed the required details to allow me to book my audition, I encountered my first roadblock. I was required to provide a reference number from my birth certificate, passport, or driver's license. Sounds simple enough, except my birth certificate was currently being processed at the home office in order to obtain a passport for my upcoming honeymoon, so no access to my birth certificate or passport, and unusual, I know, but I don't drive, so don't have a driver's licence. I refused to let this minor setback defeat me. I reached out to the organisers, explaining my predicament and was met with a ray of hope. A kind representative assured me that they would find a solution and get back to me in a few days.
                </p>

                {/* Invitation email image */}
                <div className="relative">
                  <Image
                    src="/london-2012/invite-to-audition.jpg"
                    alt="An email inviting me to audition"
                    width={800}
                    height={600}
                    className="w-full rounded-lg shadow-lg"
                  />
                </div>

                <p>
                  The stars aligned in my favour as my birth certificate, the missing puzzle piece, was returned to me in the interim, allowing me to complete my identification process and book my first audition — Friday, November 4th - just eight days after my wedding. As promised, the casting team duly called back, and all details were confirmed. Everything was in place for me to begin my journey, and even if it was to end at the first stage, I was so excited just to be part of it.
                </p>

                {/* Audition confirmation email image */}
                <div className="relative">
                  <Image
                    src="/london-2012/audition-confirmed.jpg"
                    alt="Email confirming audition date"
                    width={800}
                    height={600}
                    className="w-full rounded-lg shadow-lg"
                  />
                </div>
              </div>
            </article>
          </main>
        </div>
      </div>
    </MainSitePage>
  );
}

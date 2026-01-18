import MainSitePage from '@/components/MainSitePage';
import London2012Sidebar from '@/components/London2012Sidebar';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'EllieAtWHL - The Decision Arrives',
  description: 'The journey of a volunteer performer at the Olympic Ceremonies',
  openGraph: {
    title: 'EllieAtWHL - My Olympic Journey',
    description: 'The journey of a volunteer performer at the Olympic Ceremonies',
    url: '/london-2012/the-decision-arrives',
    type: 'website',
  },
};

export default function TheDecisionArrivesPage() {
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
              {/* Date */}
              <div className="mb-6">
                <time className="date italic text-gray-600 dark:text-gray-400" dateTime="2012-01-16">
                  16th January 2012
                </time>
              </div>

              <h1 className="text-3xl font-bold mb-6">The Decision Arrives</h1>

              <div className="space-y-6 text-lg">
                <p>
                  It was a typical Monday morning at work, and things were moving slowly as I headed out for lunch. As I walked out of the office, I saw that the email I had been eagerly awaiting for the past two weeks had finally arrived. It had been a day over 8 weeks since my second audition, and I couldn't help but feel anxious as I opened the email. However, the subject line immediately put me at ease.
                </p>

                <p>
                  The first thing I did was call my husband to share the news, followed immediately by a call to my mum. I remember her asking me questions about the role, and me trying to explain to her that I had told her everything I knew!
                </p>

                <p>
                  After my lunch break, I returned to work and faced the task of telling my boss the news and hoping that the time off I would require wouldn't be a problem. As I work in a different office from my manager, I decided to email her rather than call, where others might overhear. I was incredibly nervous, as I had only been working there for a little over a month and wasn't sure how they would react. However, I needn't have worried, as I immediately received a phone call congratulating me and offering all the support they could provide.
                </p>

                <p>
                  The news didn't take long to spread to the other department managers, and I am truly grateful for their supportive reactions.
                </p>

                <p>
                  When I got home that night, I was buzzing with excitement. I immediately clicked the link to accept my position, signed my performer agreement and confidentiality agreement, scanned and emailed them to the cast coordinators, along with a query asking them to confirm that I would be participating in both the Opening and Closing ceremonies.
                </p>

                <p>
                  Next, it was time to share the news with others. I emailed my sister in the United States, posted the news on both Twitter and Facebook, and began searching online to see if I could find out any more information about the ceremonies.
                </p>

                <p>
                  As I searched online, I stumbled upon a thread in a forum called "The Student Room" about auditions and cast offers. As I began reading it, I had no idea how valuable this source of information would become. Although I rarely posted, I read it every day, following all of the posters' ups and downs, and found it a great way to get to know some of my fellow marshals before rehearsals began.
                </p>

                <p>
                  For the next week, I found it difficult to sleep as I daydreamed about what the future held. This was a dream I hadn't even dared to dream, and although rehearsals weren't set to start for another four months, it would soon become a reality.
                </p>
              </div>
            </article>
          </main>
        </div>
      </div>
    </MainSitePage>
  );
}

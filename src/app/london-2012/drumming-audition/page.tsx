import MainSitePage from '@/components/MainSitePage';
import London2012Sidebar from '@/components/London2012Sidebar';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'EllieAtWHL - Drumming?!?',
  description: 'The journey of a volunteer performer at the Olympic Ceremonies',
  openGraph: {
    title: 'EllieAtWHL - My Olympic Journey',
    description: 'The journey of a volunteer performer at the Olympic Ceremonies',
    url: '/london-2012/drumming-audition',
    type: 'website',
  },
};

export default function DrummingAuditionPage() {
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
                <time className="date italic text-gray-600 dark:text-gray-400" dateTime="2011-11-20">
                  20th November 2011
                </time>
              </div>

              <h1 className="text-3xl font-bold mb-6">Drumming?!?</h1>

              <div className="space-y-6 text-lg">
                <p>
                  As promised, I received my response within 48 hours, and to my surprise, I was invited to a second audition! The email didn't specify what the role was, but the date was non-negotiable and fortunately, it fell on the day before I was scheduled to start my new job.
                </p>

                <p>
                  The day before the audition, we received an email with further details. We were told that the audition would involve drumming, something I had no experience in other than playing on Guitar Hero. They also sent us a form to complete allowing them to use footage taken at the audition as they saw fit. Additionally, we were warned about engineering works on the District line that could have caused issues with my travel plans. With this warning in mind, I decided to walk from West Ham station, which Google Maps estimated would take about half an hour, and take a rail replacement bus from Laindon to Upminster. It wasn't the most convenient day to travel into London, but I had already come this far and wasn't about to let anything stop me from getting to my second audition.
                </p>

                <p>
                  As one of the earlier auditionees to arrive, I had plenty of time to talk to those around me and soon discovered that I wasn't the only one with no drumming experience, which helped put my mind at ease.
                </p>

                <p>
                  Our first part of the audition involved learning some military-style moves, such as "At Ease" and "About Face," which were led by Steve Boyd. We were then led into a second room, where we were asked to vocalize rhythms. At one point, we were divided into four groups based on our drumming experience: absolute beginners, a little experience, some experience, and lots of experience. I placed myself in the absolute beginner group, but the rhythm we were given was very basic, and I immediately wished I had chosen the next group up.
                </p>

                <p>
                  We were then moved into a third room, where we discovered plastic buckets with straps attached. These were to be our "drums" for the audition, little did we know that our drums for the big night, still eight months away, would be very similar.
                </p>

                <p>
                  The rhythms we were asked to play in this room were significantly more complex than in the previous room, and I struggled to keep to the correct rhythm when I could hear many others around me playing it incorrectly. Despite this, when we were asked to divide ourselves into the four experience groups again, I decided to challenge myself and moved up to the second group instead of remaining in the first.
                </p>

                <p>
                  Our last part of the audition was very mysterious. We were taken back into the initial room and introduced to well-known photographer Emma Hardy. Certain bib numbers were called out and asked to stand in the center of the scene, while the rest of us were positioned around them. A number of photos were taken of us in various different positions. We were told nothing about what the photos were for, only that we weren't allowed to tell anyone about them and that all would become clear on July 27th of the following year. (In case you're wondering, I'll save that secret for a later post!)
                </p>

                <p>
                  The audition was over, and although I had had such a fun time, I was extremely nervous, as I wasn't ready for my journey to end yet. We were told that we would hear back within 6-8 weeks. While that seemed like a very long time to wait, at least I had Christmas to keep me occupied in the meantime.
                </p>
              </div>
            </article>
          </main>
        </div>
      </div>
    </MainSitePage>
  );
}

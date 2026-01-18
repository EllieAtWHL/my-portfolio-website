import MainSitePage from '@/components/MainSitePage';
import London2012Sidebar from '@/components/London2012Sidebar';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'EllieAtWHL - 1,000 Drummers',
  description: 'The journey of a volunteer performer at the Olympic Ceremonies',
  openGraph: {
    title: 'EllieAtWHL - My Olympic Journey',
    description: 'The journey of a volunteer performer at the Olympic Ceremonies',
    url: '/london-2012/1000-drummers',
    type: 'website',
  },
};

export default function OneThousandDrummersPage() {
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
                <time className="date italic text-gray-600 dark:text-gray-400" dateTime="2012-05-26">
                  26th May 2012
                </time>
              </div>

              <h1 className="text-3xl font-bold mb-6">1,000 Drummers</h1>

              <div className="space-y-6 text-lg">
                <p>
                  As the curtain rose on today's Olympic rehearsal at the 1:1 venue in Dagenham, excitement and nerves were high. Located in the former Ford plant, this state-of-the-art rehearsal space was designed to replicate the actual Olympic venue in every detail. But getting there was no easy feat. While organizers encouraged the use of public transportation, those of us who made the journey found ourselves disembarking at Dagenham East and embarking on a short walk to catch a specially-run bus service. With circus tents in sight, we couldn't help but wonder what awaited us at this mysterious location.
                </p>

                <p>
                  Excitement was in the air as I checked in and collected my bib. Assigned to group 51B with bib number 020, I joined the ranks of the other 1000 drummers and marshals as we gathered for the first time in the circus tent. As I waited for the rehearsal to begin, I took the opportunity to chat with my fellow volunteers and learn more about the other segments. I discovered that the NHS segment was also rehearsing, and learned about their plans to spell out the letters NHS and GOSH. When the time finally came, we were treated to a big screen presentation introducing us to the venue and providing health and safety instructions.
                </p>

                <p>
                  As we gathered in the circus tent at the Olympic rehearsal venue in Dagenham, Steve Boyd welcomed us with a playful remark about the similarity between drummers and marshals. Today's rehearsal was all about marshalling, and we were split into five groups of 200, each with a warrior name - I was a Samurai. The groups rotated through different stations, starting with military moves, dance routines, flippers, and cannons. We learned four dance routines inspired by London landmarks, including Big Ben, Rocking the Thames, Union Jack, and Buckingham Palace (which ended with the memorable line 'Ooo, Eee, Cup of Tea'). We also mastered nine cannons, including Usain Bolt, John Travolta, Freddie Mercury, Changing the Guard, Lambeth Walk, Union Jack, London Eye, Passing the Clap, and Jack in the Box.
                </p>

                <p>
                  As the Olympic rehearsal drew to a close, we were treated to a game that tested our skills and endurance. All 1000 marshals lined up and were given instructions based on what we had learned at the four stations. If we made a mistake, we were eliminated until only one person remained. The instructions started off simple, but grew increasingly complex as the game went on. Despite my best efforts, I made a mistake and was eliminated about halfway through. It was exciting to watch the game play out, with the number of participants slowly dwindling until only five, then four, then three, two, and finally one were left standing. We had a winner! Overall, it was a very different rehearsal from the drumming, but just as much fun. I was looking forward to the coming months as we prepared for the Olympic Games.
                </p>
              </div>
            </article>
          </main>
        </div>
      </div>
    </MainSitePage>
  );
}

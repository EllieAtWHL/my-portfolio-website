import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'My Olympic Journey - 1000 Drummers',
  description: 'The journey of a volunteer performer at the Olympic Ceremonies',
  openGraph: {
    title: 'EllieAtWHL - My Olympic Journey',
    description: 'The journey of a volunteer performer at the Olympic Ceremonies',
    url: '/london-2012/1000-drummers',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'EllieAtWHL - My Olympic Journey',
    description: 'The journey of a volunteer performer at the Olympic Ceremonies',
  },
}

export default function ThousandDrummersPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <aside className="lg:col-span-1">
            <div className="sticky top-8">
              <h2 className="text-xl font-semibold mb-4">My Olympic Journey</h2>
              <nav className="space-y-2">
                <a href="/london-2012" className="block py-2 px-4 rounded hover:bg-muted">
                  ← Back to Gallery
                </a>
                <a href="/london-2012/it-begins" className="block py-2 px-4 rounded hover:bg-muted">
                  It Begins...
                </a>
                <a href="/london-2012/an-invitation-to-audition" className="block py-2 px-4 rounded hover:bg-muted">
                  An Invitation to Audition
                </a>
                <a href="/london-2012/my-first-audition" className="block py-2 px-4 rounded hover:bg-muted">
                  My First Audition
                </a>
                <a href="/london-2012/drumming-audition" className="block py-2 px-4 rounded hover:bg-muted">
                  Drumming Audition
                </a>
                <a href="/london-2012/costume-fitting" className="block py-2 px-4 rounded hover:bg-muted">
                  Costume Fitting
                </a>
                <a href="/london-2012/my-first-rehearsal" className="block py-2 px-4 rounded hover:bg-muted">
                  My First Rehearsal
                </a>
                <a href="/london-2012/1000-drummers" className="block py-2 px-4 rounded bg-muted font-semibold">
                  1000 Drummers
                </a>
                <a href="/london-2012/the-decision-arrives" className="block py-2 px-4 rounded hover:bg-muted">
                  The Decision Arrives
                </a>
              </nav>
            </div>
          </aside>

          {/* Main Content */}
          <main className="lg:col-span-3">
            <article className="prose prose-lg max-w-none">
              <div className="flex items-center gap-4 mb-6">
                <img 
                  src="/london-2012/2012-05-26.png" 
                  alt="26th May 2012" 
                  className="w-16 h-16 object-cover rounded"
                />
                <div>
                  <time className="text-sm text-muted-foreground">26th May 2012</time>
                </div>
              </div>
              
              <h1 className="text-3xl font-bold mb-6">1000 Drummers</h1>
              
              <p className="mb-4">
                As the curtain rose on today's Olympic rehearsal at the 1:1 venue in Dagenham, excitement and nerves were high. Located in the former Ford plant, this state-of-the-art rehearsal space was designed to replicate the actual Olympic venue in every detail. But getting there was no easy feat. While organizers encouraged the use of public transportation, those of us who made the journey found ourselves disembarking at Dagenham East and embarking on a short walk to catch a specially-run bus service. With circus tents in sight, we couldn't help but wonder what awaited us at this mysterious location.
              </p>
              
              <p className="mb-4">
                Excitement was in the air as I checked in and collected my bib. Assigned to group 51B with bib number 020, I joined the ranks of the other 1000 drummers and marshals as we gathered for the first time in the circus tent. As I waited for the rehearsal to begin, I took the opportunity to chat with my fellow volunteers and learn more about the other segments. I discovered that the NHS segment was also rehearsing, and learned about their plans to spell out the letters NHS and GOSH. When the time finally came, we were treated to a big screen presentation introducing us to the venue and providing health and safety instructions.
              </p>
              
              <p className="mb-4">
                As we gathered in the circus tent at the Olympic rehearsal venue in Dagenham, Steve Boyd welcomed us with a playful remark about the similarity between drummers and marshals. Today's rehearsal was all about marshalling, and we were split into five groups of 200, each with a warrior name - I was a Samurai. The groups rotated through different stations, starting with military moves, dance routines, flippers, and cannons. We learned four dance routines inspired by London landmarks, including Big Ben, Rocking the Thames, Union Jack, and Buckingham Palace (which ended with the memorable line 'Ooo, Eee, Cup of Tea'). We also mastered nine cannons, including Usain Bolt, John Travolta, Freddie Mercury, Changing the Guard, Lambeth Walk, Union Jack, London Eye, Passing the Clap, and Jack in a Box.
              </p>
              
              <p className="mb-6">
                As the Olympic rehearsal drew to a close, we were treated to a game that tested our skills and endurance. All 1000 marshals lined up and were given instructions based on what we had learned at the four stations. If we made a mistake, we were eliminated until only one person remained. The instructions started off simple, but grew increasingly complex as the game went on. Despite my best efforts, I made a mistake and was eliminated about halfway through. It was exciting to watch the game play out, with the number of participants slowly dwindling until only five, then four, then three, two, and finally one were left standing. We had a winner! Overall, it was a very different rehearsal from the drumming, but just as much fun. I was looking forward to the coming months as we prepared for the Olympic Games.
              </p>
            </article>
          </main>
        </div>
      </div>
    </div>
  )
}

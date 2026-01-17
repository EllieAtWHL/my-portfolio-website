import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'My Olympic Journey - My First Rehearsal',
  description: 'The journey of a volunteer performer at the Olympic Ceremonies',
  openGraph: {
    title: 'EllieAtWHL - My Olympic Journey',
    description: 'The journey of a volunteer performer at the Olympic Ceremonies',
    url: '/london-2012/my-first-rehearsal',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'EllieAtWHL - My Olympic Journey',
    description: 'The journey of a volunteer performer at the Olympic Ceremonies',
  },
}

export default function MyFirstRehearsalPage() {
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
                <a href="/london-2012/my-first-rehearsal" className="block py-2 px-4 rounded bg-muted font-semibold">
                  My First Rehearsal
                </a>
                <a href="/london-2012/1000-drummers" className="block py-2 px-4 rounded hover:bg-muted">
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
                <div className="w-16 h-16 bg-muted rounded flex items-center justify-center">
                  <span className="text-xs font-semibold">MAY</span>
                </div>
                <div>
                  <time className="text-sm text-muted-foreground">22nd May 2012</time>
                </div>
              </div>
              
              <h1 className="text-3xl font-bold mb-6">My First Rehearsal</h1>
              
              <p className="mb-4">
                It felt like years had passed since I received my cast offer, but the day of my first rehearsal had finally arrived.
              </p>
              
              <p className="mb-4">
                In the time between receiving the cast offer and the first rehearsal, I received a few group updates by email, though they didn't provide any more information about our role. The updates seemed more focused on making sure we knew we hadn't been forgotten during the long wait between the offer and the first rehearsal.
              </p>
              
              <p className="mb-4">
                However, I had been keeping up to date with the posts in The Student Room, following the ups and downs of complete strangers. It became clear that I was one of the first to receive my cast offer email. I read post after agonizing post from people who waited weeks, or even months, longer than I did for a decision. It made me extremely grateful that I hadn't had to wait that long – I'm not sure I could have coped! I read about both cast offers and places on the reserve list. One poster, Flakeydom, even started a spreadsheet to try and make sense of it all, keeping track of everyone's audition dates and offers/reserves. While the spreadsheet didn't really make sense of it all, it was always nice to see a stat-filled post from it.
              </p>
              
              <p className="mb-4">
                I had promised to wear my #2012Tweeps t-shirt to my first rehearsal, so that's exactly what I did.
              </p>
              
              <p className="mb-4">
                Excited and filled with anticipation, I arrived at 3 Mills predictably early, joining a queue of fellow volunteer performers. It quickly became apparent that for some of those in the queue, this wasn't their first rehearsal, as the queue was split into those who already had passes and those who didn't. Upon entry, we were handed our ceremonies pass and a special pink volunteer Oystercard.
              </p>
              
              <p className="mb-4">
                We were then moved into the first room and handed our bibs. All of the marshals' bibs were lime green, and it seemed that we had been assigned bib numbers in alphabetical order by first name. I was given bib number 063. Once we collected our bibs, we sat down and mingled while we waited for everyone to arrive. After about an hour, Danny Boyle came in and half of the group was called over to a corner of the room, where a scale model of the Olympic Stadium was unveiled to us.
              </p>
              
              <p className="mb-4">
                By the time you read this, it will be well known, but these are the details that were revealed to us:
              </p>
              
              <ul className="list-disc pl-6 mb-4">
                <li>There's a bell on the north side, commissioned from the Whitechapel Bell Foundry, which will be the largest tuned bell in the world.</li>
                <li>On the south side, there's the Glastonbury Tor, with an oak tree on top.</li>
                <li>The Royal Box will be on the west side.</li>
                <li>There will be two mosh pit areas, one near the Tor with Glastonbury-style flags, and the other near the bell, representing the Last Night of the Proms. Danny told us about the trouble they had getting the mosh pits cleared by security.</li>
                <li>There will be live animals and a green countryside scene. It all looked very idyllic.</li>
              </ul>
              
              <p className="mb-4">
                On that first day of rehearsals, we were introduced to the concept and design of "Pandemonium," a section of the Opening Ceremony that we would be a part of. We were shown a preview of what it would look like, which included live animals and a parade featuring suffragettes and The Beatles, all while we drummed along, led by Evelyn Glenny and ended with the Olympic rings suspended above the stadium, with Ironworks style fireworks coming from them. It was an absolutely breathtaking moment, and I couldn't wait to be a part of it all.
              </p>
              
              <p className="mb-4">
                Steve Boyd then explained to us that once we have finished this, we will then go back stage, change into a different costume, and come back to marshall the athletes for their parade. We will stay with them until the very end, which means I will have a prime position to see the torch enter the stadium and the flame be lit. We will then repeat the marshalling role for the Closing Ceremony. There were roughly 250 of us in the room, but there were a total of 1,000 drummers in four groups.
              </p>
              
              <p className="mb-6">
                The chairs were cleared and rehearsals began in earnest. We were lined up in rows in numerical order and started to learn some rhythms, initially by drumming our bellies and then on the "drums" (which were actually plastic buckets, metal buckets, and plastic bins). I was given a metal bucket to use, which I enjoyed playing. It was exhausting, but a whole lot of fun was had by all and left me even more pumped for it.
              </p>
            </article>
          </main>
        </div>
      </div>
    </div>
  )
}

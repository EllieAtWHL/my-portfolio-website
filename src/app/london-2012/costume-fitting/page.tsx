import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'My Olympic Journey - Costume Fitting',
  description: 'The journey of a volunteer performer at the Olympic Ceremonies',
  openGraph: {
    title: 'EllieAtWHL - My Olympic Journey',
    description: 'The journey of a volunteer performer at the Olympic Ceremonies',
    url: '/london-2012/costume-fitting',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'EllieAtWHL - My Olympic Journey',
    description: 'The journey of a volunteer performer at the Olympic Ceremonies',
  },
}

export default function CostumeFittingPage() {
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
                <a href="/london-2012/costume-fitting" className="block py-2 px-4 rounded bg-muted font-semibold">
                  Costume Fitting
                </a>
                <a href="/london-2012/my-first-rehearsal" className="block py-2 px-4 rounded hover:bg-muted">
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
                  <time className="text-sm text-muted-foreground">29th May 2012</time>
                </div>
              </div>
              
              <h1 className="text-3xl font-bold mb-6">Costume Fitting</h1>
              
              <p className="mb-4">
                Today, we were back to drumming rehearsals with a smaller group of 250 in group 51-A. I was assigned bib number 063 again. For the most part, we repeated everything we had learned the previous week, drilling the rhythms and techniques over and over. While some of the more experienced drummers might have been bored by this repetition, I was grateful for the extra practice as a novice drummer. We learned the rhythms using words to help us remember them, and two phrases in particular have stayed with me to this day: 'Play the drum, so your mum, can see you on TV' and 'I am in need of a drink!'.
              </p>
              
              <p className="mb-6">
                Today marked a milestone in my journey to the ceremonies as I had my first costume fitting for both the drumming and the Opening Ceremony marshalling. The drumming costume was designed to evoke the Industrial Revolution, with a rough and dirty look. My outfit included trousers with a skirt layered over the top, a blouse, and a bonnet. An apron was initially included, but it was later removed. My marshalling costume consisted of black skinny jeans (which still had the Primark tag on them!) and a long-sleeved white top with a strange grass pattern on it. As I looked at myself in the mirror, I couldn't help but feel a sense of pride and determination. This was my chance to be a part of something special, to be a part of the Olympics. And as I stood there, ready to take on the challenge, I knew that I was ready for whatever lay ahead.
              </p>
              
              <p className="mb-6">
                I couldn't help but notice that most of the row next to me - the 70's - was missing. It was a strange and unexpected sight, and I found myself wondering what could have caused such a large number of people to be absent. Despite my curiosity, I never did find out the reason for their absence. Nevertheless, the rehearsal went on as planned, and I remained focused on my own role and responsibilities. It was just one of those little mysteries that added an element of surprise to the journey towards the Olympic Games.
              </p>
            </article>
          </main>
        </div>
      </div>
    </div>
  )
}

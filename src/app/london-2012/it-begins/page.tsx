import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'My Olympic Journey - It Begins...',
  description: 'The journey of a volunteer performer at the Olympic Ceremonies',
  openGraph: {
    title: 'EllieAtWHL - My Olympic Journey',
    description: 'The journey of a volunteer performer at the Olympic Ceremonies',
    url: '/london-2012/it-begins',
    type: 'website',
    images: ['/london-2012/Application.jpg'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'EllieAtWHL - My Olympic Journey',
    description: 'The journey of a volunteer performer at the Olympic Ceremonies',
    images: ['/london-2012/Application.jpg'],
  },
}

export default function ItBeginsPage() {
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
                <a href="/london-2012/it-begins" className="block py-2 px-4 rounded bg-muted font-semibold">
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
                <img 
                  src="/london-2012/2011-08-16.png" 
                  alt="16th August 2011" 
                  className="w-16 h-16 object-cover rounded"
                />
                <div>
                  <time className="text-sm text-muted-foreground">16th August 2011</time>
                </div>
              </div>
              
              <h1 className="text-3xl font-bold mb-6">It Begins...</h1>
              
              <p className="mb-4">
                People often ask me how I got involved in the Olympic Ceremonies. In all honesty, I don't remember the exact moment, but this is what I do know...
              </p>
              
              <p className="mb-4">
                Even before applying, I was obsessed with the Olympics. I spent way too much time during my maternity leave taking to the internet for any leads I could on how to get my hands on some tickets. I had already been in communication with a group of Twitter users, that I soon become part of, now known as "the 2012 Tweeps". A year before the ceremony, and before I even applied, I posted how excited I was - a whole year out!
              </p>
              
              <div className="bg-muted p-4 rounded-lg mb-4">
                <p className="italic">
                  "One year to go until the opening ceremony, I know some people are already bored of all the hype, but I don't think I ever will."
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Posted by Eleanor Matthewman on Wednesday, 27 July 2011
                </p>
              </div>
              
              <p className="mb-4">
                As I said, I don't remember exactly how I came across it, but I suspect there was a link on one of the many email newsletters that I'd signed up to, looking for volunteers for the ceremonies, and on seeing the advert, I posted on Facebook how I was "tempted to apply".
              </p>
              
              <div className="bg-muted p-4 rounded-lg mb-4">
                <p className="italic">
                  "So tempted to apply!"
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Posted by Eleanor Matthewman on Tuesday, 16 August 2011
                </p>
              </div>
              
              <p className="mb-6">
                Apply I did, and from what I remember, I didn't really think much of it, but that is where my official journey to become "part of the cultural record of London" began...
              </p>
              
              <div className="relative group mb-6">
                <img 
                  src="/london-2012/Application.jpg" 
                  alt="Confirmation email of application"
                  className="w-full max-w-2xl mx-auto rounded-lg shadow-lg"
                />
                <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white p-2 rounded">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8.333 31.667v-10h2.792v7.208h7.208v2.792Zm20.542-13.334v-7.208h-7.208V8.333h10v10Z"/>
                  </svg>
                </div>
              </div>
            </article>
          </main>
        </div>
      </div>
    </div>
  )
}

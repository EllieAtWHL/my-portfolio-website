import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'My Olympic Journey - An Invitation to Audition',
  description: 'The journey of a volunteer performer at the Olympic Ceremonies',
  openGraph: {
    title: 'EllieAtWHL - My Olympic Journey',
    description: 'The journey of a volunteer performer at the Olympic Ceremonies',
    url: '/london-2012/an-invitation-to-audition',
    type: 'website',
    images: ['/london-2012/invite-to-audition.jpg'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'EllieAtWHL - My Olympic Journey',
    description: 'The journey of a volunteer performer at the Olympic Ceremonies',
    images: ['/london-2012/invite-to-audition.jpg'],
  },
}

export default function AnInvitationToAuditionPage() {
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
                <a href="/london-2012/an-invitation-to-audition" className="block py-2 px-4 rounded bg-muted font-semibold">
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
                  src="/london-2012/2011-09-15.png" 
                  alt="15th September 2011" 
                  className="w-16 h-16 object-cover rounded"
                />
                <div>
                  <time className="text-sm text-muted-foreground">15th September 2011</time>
                </div>
              </div>
              
              <h1 className="text-3xl font-bold mb-6">An Invitation to Audition</h1>
              
              <p className="mb-6">
                I had almost forgotten I had applied when out of nowhere, I received my invitation to audition for the Olympic Ceremonies, one month after submitting my application. Anything worth anything, often has roadblocks in the way and it was as I completed the required details to allow me to book my audition, I encountered my first roadblock. I was required to provide a reference number from my birth certificate, passport, or driver's license. Sounds simple enough, except my birth certificate was currently being processed at the home office in order to obtain a passport for my upcoming honeymoon, so no access to my birth certificate or passport, and unusual, I know, but I don't drive, so don't have a driver's licence. I refused to let this minor setback defeat me. I reached out to the organisers, explaining my predicament and was met with a ray of hope. A kind representative assured me that they would find a solution and get back to me in a few days.
              </p>
              
              <div className="relative group mb-6">
                <img 
                  src="/london-2012/invite-to-audition.jpg" 
                  alt="An email inviting me to audtion"
                  className="w-full max-w-2xl mx-auto rounded-lg shadow-lg"
                />
                <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white p-2 rounded">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8.333 31.667v-10h2.792v7.208h7.208v2.792Zm20.542-13.334v-7.208h-7.208V8.333h10v10Z"/>
                  </svg>
                </div>
              </div>
              
              <p className="mb-6">
                The stars aligned in my favour as my birth certificate, the missing puzzle piece, was returned to me in the interim, allowing me to complete my identification process and book my first audition — Friday, November 4th - just eight days after my wedding. As promised, the casting team duly called back, and all details were confirmed. Everything was in place for me to begin my journey, and even if it was to end at the first stage, I was so excited just to be part of it.
              </p>
              
              <div className="relative group mb-6">
                <img 
                  src="/london-2012/audition-confirmed.jpg" 
                  alt="Email confirming audition date"
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

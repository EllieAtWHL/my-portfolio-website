import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'My Olympic Journey - My First Audition',
  description: 'The journey of a volunteer performer at the Olympic Ceremonies',
  openGraph: {
    title: 'EllieAtWHL - My Olympic Journey',
    description: 'The journey of a volunteer performer at the Olympic Ceremonies',
    url: '/london-2012/my-first-audition',
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

export default function MyFirstAuditionPage() {
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
                <a href="/london-2012/my-first-audition" className="block py-2 px-4 rounded bg-muted font-semibold">
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
                  src="/london-2012/2011-11-04.png" 
                  alt="4th November 2011" 
                  className="w-16 h-16 object-cover rounded"
                />
                <div>
                  <time className="text-sm text-muted-foreground">4th November 2011</time>
                </div>
              </div>
              
              <h1 className="text-3xl font-bold mb-6">My First Audition</h1>
              
              <p className="mb-4">
                The day of my audition had finally arrived, and I was a bundle of nerves. Initially, I had planned to keep it a secret, but I eventually opened up to a few close members of my family. I didn't want to bear the weight of potential disappointment alone, but at the same time, I didn't want to face a crowd in case this was the end of my dream.
              </p>
              
              <p className="mb-6">
                As I made my way to 3 Mills Studio, the anticipation grew within me. Located conveniently near the Bromley-By-Bow tube station, the journey was seamless and easy for me to navigate. The stage was set, and I was ready to give it my all.
              </p>
              
              <div className="relative group mb-6">
                <img 
                  src="/london-2012/3mills.jpg" 
                  alt="3 Mills Studio"
                  className="w-full max-w-2xl mx-auto rounded-lg shadow-lg"
                />
                <figcaption className="text-center text-sm text-muted-foreground mt-2">
                  3 Mills Studio, London
                </figcaption>
              </div>
              
              <p className="mb-6">
                Arriving early, as was my habit, I found myself towards the front of the line, surrounded by eager hopefuls. As I gazed around, I saw that there were around 200 people in each of the three simultaneous auditions. My number, 061, caught my eye - it was the year that my beloved football team, Spurs, had won the double. Could this be a sign of good things to come?
              </p>
              
              <div className="relative group mb-6">
                <img 
                  src="/london-2012/bib061.jpg" 
                  alt="Bib 061"
                  className="w-full max-w-2xl mx-auto rounded-lg shadow-lg"
                />
                <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white p-2 rounded">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8.333 31.667v-10h2.792v7.208h7.208v2.792Zm20.542-13.334v-7.208h-7.208V8.333h10v10Z"/>
                  </svg>
                </div>
              </div>
              
              <p className="mb-6">
                As the audition began, we were introduced to <a href="https://www.steveboydportfolio.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Steve Boyd</a>, the Director of Mass Movement. With a wealth of experience in Olympic and Commonwealth ceremonies, I couldn't help but feel that I was in good hands. Little did I know, his voice would become a familiar sound over the coming months.
              </p>
              
              <p className="mb-6">
                The audition was a thrilling three-part journey, starting with simple movements and gradually escalating in complexity. As a seasoned dancer, I felt confident and in my element, relishing each new challenge. One of the standout moments was when the iconic beats of Beyonce's "Love On Top" filled the room. This song will forever hold a special place in my heart as a reminder of this unforgettable day.
              </p>
              
              <div className="mb-6">
                <iframe 
                  style={{borderRadius: "12px"}} 
                  src="https://open.spotify.com/embed/track/1z6WtY7X4HQJvzxC4UgkSf?utm_source=generator&theme=0" 
                  width="100%" 
                  height="152" 
                  frameBorder="0" 
                  allowFullScreen
                  allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" 
                  loading="lazy"
                  className="rounded-lg"
                />
              </div>
              
              <p className="mb-6">
                The atmosphere was electric, and I felt as though I had already become a part of the London 2012 experience, even if this was the end of my journey. As the audition came to a close, we were informed that we would receive a response within 48 hours. The anticipation was almost too much to bear, and I found myself checking my phone every few minutes, waiting for that all-important email. It was a day I will never forget.
              </p>
            </article>
          </main>
        </div>
      </div>
    </div>
  )
}

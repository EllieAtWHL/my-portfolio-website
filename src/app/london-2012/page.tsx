import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'EllieAtWHL - London 2012',
  description: 'My journey as a volunteer performer at the London 2012 Olympic Games',
  openGraph: {
    title: 'EllieAtWHL - Volunteering at London 2012',
    description: 'My journey as a volunteer performer at the London 2012 Olympic Games',
    url: '/london-2012',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'EllieAtWHL - Volunteering at London 2012',
    description: 'My journey as a volunteer performer at the London 2012 Olympic Games',
  },
}

export default function London2012Page() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8">London 2012</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <aside className="lg:col-span-1">
            <div className="sticky top-8">
              <h2 className="text-xl font-semibold mb-4">My Olympic Journey</h2>
              <nav className="space-y-2">
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
            <section>
              <h2 className="text-3xl font-bold mb-6">Image Gallery</h2>
              
              <div className="relative">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-4">
                    <div className="relative group">
                      <img 
                        src="/london-2012/ocDressingRoom.jpg" 
                        alt="In the dressing room for the Opening Ceremony"
                        className="w-full h-64 object-cover rounded-lg"
                      />
                      <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-75 text-white p-2 rounded-b-lg">
                        In the dressing room for the Opening Ceremony
                      </div>
                    </div>
                    
                    <div className="relative group">
                      <img 
                        src="/london-2012/torDrummer.jpg" 
                        alt="Drumming on the Tor during the 2nd Technical Rehearsal"
                        className="w-full h-64 object-cover rounded-lg"
                      />
                      <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-75 text-white p-2 rounded-b-lg">
                        Drumming on the Tor during the 2nd Technical Rehearsal
                      </div>
                    </div>
                    
                    <div className="relative group">
                      <img 
                        src="/london-2012/torDrummers.jpg" 
                        alt="The Tor Drummers"
                        className="w-full h-64 object-cover rounded-lg"
                      />
                      <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-75 text-white p-2 rounded-b-lg">
                        The Tor Drummers
                      </div>
                    </div>
                    
                    <div className="relative group">
                      <img 
                        src="/london-2012/parade1.jpg" 
                        alt="The 'sheepdog' drummers in their pen"
                        className="w-full h-64 object-cover rounded-lg"
                      />
                      <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-75 text-white p-2 rounded-b-lg">
                        The 'sheepdog' drummers in their pen
                      </div>
                    </div>
                    
                    <div className="relative group">
                      <img 
                        src="/london-2012/ccDressingRoom.jpg" 
                        alt="In the dressing room for the Closing Ceremony"
                        className="w-full h-64 object-cover rounded-lg"
                      />
                      <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-75 text-white p-2 rounded-b-lg">
                        In the dressing room for the Closing Ceremony
                      </div>
                    </div>
                    
                    <div className="relative group">
                      <img 
                        src="/london-2012/DannyKristian.jpg" 
                        alt="With Olympic bronze medalists Danny Purvis and Kristian Thomas"
                        className="w-full h-64 object-cover rounded-lg"
                      />
                      <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-75 text-white p-2 rounded-b-lg">
                        With Olympic bronze medalists Danny Purvis and Kristian Thomas
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="relative group">
                      <img 
                        src="/london-2012/ocPreShow.jpg" 
                        alt="Outside the stadium prior to the Opening Ceremony"
                        className="w-full h-64 object-cover rounded-lg"
                      />
                      <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-75 text-white p-2 rounded-b-lg">
                        Outside the stadium prior to the Opening Ceremony
                      </div>
                    </div>
                    
                    <div className="relative group">
                      <img 
                        src="/london-2012/underRings.jpg" 
                        alt="We 'made' the Olympic Rings!"
                        className="w-full h-64 object-cover rounded-lg"
                      />
                      <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-75 text-white p-2 rounded-b-lg">
                        We 'made' the Olympic Rings!
                      </div>
                    </div>
                    
                    <div className="relative group">
                      <img 
                        src="/london-2012/sideRings.jpg" 
                        alt="The rings forming during the 2nd Technical Rehearsal"
                        className="w-full h-64 object-cover rounded-lg"
                      />
                      <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-75 text-white p-2 rounded-b-lg">
                        The rings forming during the 2nd Technical Rehearsal
                      </div>
                    </div>
                    
                    <div className="relative group">
                      <img 
                        src="/london-2012/parade2.jpg" 
                        alt="Following Team GB"
                        className="w-full h-64 object-cover rounded-lg"
                      />
                      <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-75 text-white p-2 rounded-b-lg">
                        Following Team GB
                      </div>
                    </div>
                    
                    <div className="relative group">
                      <img 
                        src="/london-2012/ccDressSign.jpg" 
                        alt="Waiting backstage at the rehearsal the morning of the Closing Ceremony"
                        className="w-full h-64 object-cover rounded-lg"
                      />
                      <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-75 text-white p-2 rounded-b-lg">
                        Waiting backstage at the rehearsal the morning of the Closing Ceremony
                      </div>
                    </div>
                    
                    <div className="relative group">
                      <img 
                        src="/london-2012/Louis.jpg" 
                        alt="With Olympic bronze medalist Louis Smith"
                        className="w-full h-64 object-cover rounded-lg"
                      />
                      <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-75 text-white p-2 rounded-b-lg">
                        With Olympic bronze medalist Louis Smith
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="relative group mt-4">
                  <img 
                    src="/london-2012/ccShowOver.jpg" 
                    alt="The End of the Closing Ceremony"
                    className="w-full h-64 object-cover rounded-lg"
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-75 text-white p-2 rounded-b-lg">
                    The End of the Closing Ceremony
                  </div>
                </div>
              </div>
            </section>
          </main>
        </div>
      </div>
    </div>
  )
}

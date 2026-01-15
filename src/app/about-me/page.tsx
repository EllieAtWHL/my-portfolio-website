import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import Image from 'next/image';
import MainSitePage from '@/components/MainSitePage';

export const metadata = {
  title: 'About Me',
  description: 'A little bit about me',
  openGraph: {
    title: 'EllieAtWHL - About Me',
    description: 'A little bit about me',
    url: 'https://ellieatwhl.co.uk/about-me',
    images: ['/about-me/img/EllieMatthewman(Square).jpg'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'EllieAtWHL - About Me',
    description: 'A little bit about me',
    images: ['/about-me/img/EllieMatthewman(Square).jpg'],
  },
};

export default function AboutMe() {
  return (
    <MainSitePage>
      <div className="content">
        <div className="scrollable">
            <div className="about-container">
              <div className="about-header">
                <h1 className="about-title">About Me</h1>
                <div className="about-subtitle">Trailblazer. Mentor. Champion.</div>
              </div>
              
              <section className="intro">
                <div className="profile-container">
                  <Image 
                    className="profile"
                    src="/img/EllieProfile.jpg"
                    alt="Brown hair woman with glasses"
                    width={200}
                    height={200}
                    priority
                  />
                  <div className="profile-badge">
                    <span className="badge-text">14+ Years</span>
                    <span className="badge-subtext">Salesforce Experience</span>
                  </div>
                </div>
                
                <article className="intro-text">
                  <Card variant="highlight" padding="md" className="mb-6">
                    <h2>Hi there! I'm Ellie</h2>
                    <p>
                      A highly skilled and experienced Salesforce professional with a passion for technology and helping businesses succeed.
                    </p>
                  </Card>
                  
                  <Card variant="accent" padding="md" className="mb-6">
                    <h3>Professional Excellence</h3>
                    <p>
                      With over 14 years of experience in the Salesforce ecosystem, I have a proven track record of leading development teams and staying up to date with the latest industry developments. I am 11 times Salesforce certified and an All-Star Trailhead ranger.
                    </p>
                    <p>
                      I am also honored to be a member of the inaugural Salesforce Community Advisory Board, helping shape the future of the Salesforce community and ecosystem.
                    </p>
                  </Card>

                  <Card variant="accent" padding="md" className="mb-6">
                    <h3>Community & Volunteering</h3>
                    <p>
                      In my free time, I volunteer both within the Salesforce community - including co-leading the{' '}
                      <a 
                        href="https://trailblazercommunitygroups.com/salesforce-developer-group-london-united-kingdom/" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="highlight-link"
                      >
                        London Salesforce Developer Group
                      </a> - and at major sporting events.
                    </p>
                    <p>
                      I am also passionate about coaching and mentoring through RAD Women, helping empower and support women in their personal and professional development journeys.
                    </p>
                    <p>
                      I also enjoy playing games and spending time with my family. My passion of games led me to combine my passions by developing a digital version of the card game{' '}
                      <a href="/regicide" className="highlight-link">Regicide</a>.
                    </p>
                  </Card>

                  <Card variant="accent" padding="md" className="mb-6">
                    <h3>Olympic Pride</h3>
                    <p>
                      One of my proudest accomplishments is volunteering at the London 2012 Olympic Ceremonies. I am working my way through updating{' '}
                      <a href="/london-2012/" className="highlight-link">my blog</a> with my experiences.
                    </p>
                  </Card>

                  <Card variant="accent" padding="md" className="mb-6">
                    <h3>Always Growing</h3>
                    <p>
                      I am always looking for new challenges and opportunities to grow both personally and professionally. Thank you for stopping by my "About Me" page!
                    </p>
                  </Card>

                  <div className="cta-section">
                    <Button variant="primary" asChild>
                      <a href="/contact-me">
                        Get In Touch
                      </a>
                    </Button>
                    <Button variant="primary" asChild>
                      <a href="/experience">
                        View My Experience
                      </a>
                    </Button>
                  </div>
                </article>
              </section>
          </div>
        </div>
      </div>
    </MainSitePage>
  );
}

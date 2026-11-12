import Link from 'next/link';
import { Card } from '@/components/Card';
import MainSitePage from '@/components/MainSitePage';
import { CookiePreferencesButton } from '@/components/CookiePreferencesButton';
import { SITE_IMAGE } from '@/lib/site';

// Bump this whenever the policy's substance changes (see
// reference/COOKIE_CONSENT.md - "Privacy policy"). Kept as a plain string so
// it reads the same in every locale/timezone.
const LAST_UPDATED = '12 November 2026';

export const metadata = {
  title: 'Privacy Policy',
  description:
    'What personal data ellieatwhl.co.uk collects, why, who it is shared with, and how to exercise your rights.',
  alternates: { canonical: '/privacy-policy' },
  openGraph: {
    title: 'Privacy Policy | Ellie Matthewman',
    description:
      'What personal data ellieatwhl.co.uk collects, why, who it is shared with, and how to exercise your rights.',
    url: 'https://ellieatwhl.co.uk/privacy-policy',
    images: [SITE_IMAGE],
  },
};

function ExternalLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  );
}

const listClass = 'list-disc pl-6 space-y-1 my-3';

export default function PrivacyPolicyPage() {
  return (
    <MainSitePage>
      <div className="content-with-footer">
        <div className="scrollable">
          <div className="blog-article">
            <article className="blog-content">
              <h1 className="blog-main-title">Privacy Policy</h1>
              <div className="blog-meta">
                <p>
                  <em>Last updated {LAST_UPDATED}</em>
                </p>
              </div>

              <section className="blog-section">
                <p>
                  This site, ellieatwhl.co.uk, is a personal, non-commercial website run by me,
                  Ellie Matthewman. It covers both my own portfolio and Spurs Women, an unofficial
                  Tottenham Hotspur Women fan site. This page explains what personal data the site
                  collects, why, who else is involved, and what you can do about it. Under UK data
                  protection law (the UK GDPR), I&apos;m the &quot;controller&quot; of that data.
                </p>

                <Card variant="accent" padding="lg" className="topic-block">
                  <h2 className="topic-title">The short version</h2>
                  <ul className={listClass}>
                    <li>There are no visitor accounts, no adverts, and I don&apos;t sell or share your data for marketing.</li>
                    <li>
                      Optional cookies and third-party services stay off until you allow them, and
                      you choose each type separately.
                    </li>
                    <li>
                      If you use the contact form, your name, email address and message are sent to
                      my own Salesforce account so I can reply.
                    </li>
                    <li>You can ask me to see, correct or delete your data at any time.</li>
                  </ul>
                </Card>
              </section>

              <section className="blog-section" aria-labelledby="optional-cookies">
                <h2 id="optional-cookies" className="section-title">
                  Optional cookies and services (you choose)
                </h2>
                <p>
                  The first time you visit, a banner asks which of these you&apos;re happy with.
                  Nothing in this section loads until you allow its category, and you can change
                  your mind at any time, with the button below or the cookie icon in the footer. Turning a
                  category off stops it from then on; it can&apos;t recall data already sent.
                  The legal basis for all of these is your consent.
                </p>
                <div className="my-4">
                  <CookiePreferencesButton />
                </div>

                <Card variant="accent" padding="lg" className="topic-block">
                  <h3 className="topic-title">Session recording (FullStory)</h3>
                  <p>
                    FullStory records how you use the site, such as the pages you visit, where you
                    click and scroll, and how the mouse moves, along with your browser, device and
                    approximate location (worked out from your IP address). I use it to see where
                    the site is confusing or broken. The contact form&apos;s fields are excluded
                    from recording, so what you type there isn&apos;t captured. Recordings are kept
                    for 12 months.
                  </p>
                  <p>
                    FullStory, Inc. stores this in the United States.{' '}
                    <ExternalLink href="https://www.fullstory.com/legal/privacy-policy/">
                      FullStory&apos;s privacy policy
                    </ExternalLink>
                  </p>
                </Card>

                <Card variant="accent" padding="lg" className="topic-block">
                  <h3 className="topic-title">Analytics (Vercel Web Analytics and Speed Insights)</h3>
                  <p>
                    These count page views and measure how quickly pages load, so I can see which
                    pages are used and which are slow. They don&apos;t use cookies. Vercel records
                    data anonymously, without tying it to you or your IP address, and only keeps
                    the short-lived identifier it uses to count a visit for 24 hours.
                  </p>
                  <p>
                    Vercel Inc. (United States).{' '}
                    <ExternalLink href="https://vercel.com/docs/analytics/privacy-policy">
                      Vercel Analytics privacy
                    </ExternalLink>
                    {' · '}
                    <ExternalLink href="https://vercel.com/docs/speed-insights/privacy-policy">
                      Speed Insights privacy
                    </ExternalLink>
                  </p>
                </Card>

                <Card variant="accent" padding="lg" className="topic-block">
                  <h3 className="topic-title">Spam protection (Google reCAPTCHA)</h3>
                  <p>
                    On the contact form, reCAPTCHA checks that you&apos;re a person rather than a
                    bot. To do that, Google collects information about your browser, device and how
                    you interact with the page, and sets its own cookies. The form still sends if
                    you leave this off.
                  </p>
                  <p>
                    Google LLC (United States).{' '}
                    <ExternalLink href="https://policies.google.com/privacy">
                      Google&apos;s privacy policy
                    </ExternalLink>
                  </p>
                </Card>

                <Card variant="accent" padding="lg" className="topic-block">
                  <h3 className="topic-title">Embedded content (YouTube, Spotify, Instagram)</h3>
                  <p>
                    Some pages show content from other sites in place: YouTube videos in the
                    Lightning Rollout articles, a Spotify track in the London 2012 blog, and
                    Instagram posts on Spurs Women match pages. These services set their own
                    cookies as soon as the content loads, and may link your visit to an account if
                    you&apos;re signed in with them. Until you allow this category, you&apos;ll see
                    a link to the content instead.
                  </p>
                  <p>
                    <ExternalLink href="https://policies.google.com/privacy">YouTube (Google)</ExternalLink>
                    {' · '}
                    <ExternalLink href="https://www.spotify.com/uk/legal/privacy-policy/">Spotify</ExternalLink>
                    {' · '}
                    <ExternalLink href="https://privacycenter.instagram.com/policy">Instagram (Meta)</ExternalLink>
                  </p>
                </Card>
              </section>

              <section className="blog-section" aria-labelledby="contact-form">
                <h2 id="contact-form" className="section-title">
                  The contact form
                </h2>
                <p>
                  If you send me a message through the <Link href="/contact-me">contact form</Link>,
                  your first name, last name, email address and message go straight to my personal
                  Salesforce account (a Developer Edition org that only I use). They aren&apos;t
                  stored anywhere else on this site. Salesforce, Inc. stores them on my behalf and
                  doesn&apos;t use them for its own purposes.
                </p>
                <p>
                  I only use them to read and reply to your message, which is the legal basis for
                  it: my legitimate interest in answering messages people choose to send me. I keep
                  messages until I delete them, and you can ask me to delete yours at any time.{' '}
                  <ExternalLink href="https://www.salesforce.com/company/privacy/">
                    Salesforce&apos;s privacy information
                  </ExternalLink>
                </p>
              </section>

              <section className="blog-section" aria-labelledby="no-consent-needed">
                <h2 id="no-consent-needed" className="section-title">
                  Things that don&apos;t need your consent
                </h2>
                <ul className={listClass}>
                  <li>
                    <strong>Hosting.</strong>{' '}The site is hosted by Vercel. Like any website, the
                    servers have to receive your IP address and basic request details to send you
                    pages and keep the site secure. These logs are short-lived and I don&apos;t use
                    them to identify anyone.
                  </li>
                  <li>
                    <strong>Things saved in your own browser.</strong>{' '}The site saves a few things
                    on your device so it works the way you left it: your cookie choices, light or
                    dark mode, and progress and scores in the games (Groundhopper, Regicide, Bobbin
                    and the football game). These stay in your browser and are never sent to me.
                    Clearing your browser&apos;s site data removes them.
                  </li>
                  <li>
                    <strong>Content that sets no cookies.</strong>{' '}Some third-party content
                    loads without asking, because I checked and it sets no cookies or other storage
                    for visitors: Bluesky posts and OpenStreetMap maps, and the thumbnails and titles
                    of YouTube videos listed on Spurs Women pages (fetched from YouTube and
                    noembed.com). The videos themselves only play on YouTube. As with any embedded
                    content, your browser still contacts these services to load it, so they see
                    your IP address.
                  </li>
                  <li>
                    <strong>Spurs Women data.</strong>{' '}The match, player and stadium information
                    is public football data. The site&apos;s database, hosted by Supabase, holds no
                    information about visitors.
                  </li>
                  <li>
                    <strong>The sign-in page.</strong>{' '}There&apos;s a Google sign-in page used
                    for editing the Spurs Women data. It isn&apos;t linked anywhere and isn&apos;t
                    meant for visitors, and signing in gives no extra access. If someone signs in
                    anyway, Supabase stores the email address, name and profile picture Google
                    shares, plus a sign-in cookie. Ask me and I&apos;ll delete the account.
                  </li>
                </ul>
              </section>

              <section className="blog-section" aria-labelledby="transfers">
                <h2 id="transfers" className="section-title">
                  Data outside the UK
                </h2>
                <p>
                  Most of the services above, including FullStory, Vercel, Google, Salesforce,
                  Spotify, Meta, Bluesky, Supabase and noembed.com, are based in or store data in
                  the United States, so data sent to them may be stored there. The larger providers
                  rely on recognised safeguards for this, such as the UK–US data bridge or standard
                  contractual clauses, set out in their own privacy policies linked above.
                </p>
              </section>

              <section className="blog-section" aria-labelledby="your-rights">
                <h2 id="your-rights" className="section-title">
                  Your rights
                </h2>
                <p>You have the right to:</p>
                <ul className={listClass}>
                  <li>ask for a copy of the personal data I hold about you</li>
                  <li>ask me to correct it, or to delete it</li>
                  <li>object to, or ask me to restrict, how I use it</li>
                  <li>withdraw your consent to optional cookies at any time (see above)</li>
                </ul>
                <p>
                  To do any of these, send me a message through the{' '}
                  <Link href="/contact-me">contact form</Link>{' '}and say it&apos;s a privacy request.
                  I&apos;ll reply within one month. If you&apos;re unhappy with how I&apos;ve
                  handled your data, you can complain to the Information Commissioner&apos;s Office
                  (ICO):{' '}
                  <ExternalLink href="https://ico.org.uk/make-a-complaint/">ico.org.uk/make-a-complaint</ExternalLink>.
                </p>
              </section>

              <section className="blog-section" aria-labelledby="changes">
                <h2 id="changes" className="section-title">
                  Changes to this policy
                </h2>
                <p>
                  If the site starts collecting something new, I&apos;ll update this page and the
                  date at the top. If it&apos;s a new optional service, the cookie banner will ask
                  you again before it&apos;s used.
                </p>
              </section>
            </article>
          </div>
        </div>
      </div>
    </MainSitePage>
  );
}

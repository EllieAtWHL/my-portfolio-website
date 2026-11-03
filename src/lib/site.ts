/**
 * Site-wide identity used for SEO: page titles, canonical URLs, the sitemap
 * and the schema.org Person structured data on the home page (WEB-238).
 * Keep the name here in sync with how it appears on external profiles -
 * consistency between the site and `sameAs` profiles is what lets search
 * engines tie them together.
 */
export const SITE_URL = 'https://ellieatwhl.co.uk';

export const SITE_NAME = 'Ellie Matthewman';

export const SITE_TITLE = 'Ellie Matthewman | Salesforce Developer & Mentor';

export const SITE_DESCRIPTION =
  'Ellie Matthewman (EllieAtWHL) - 11x certified Salesforce developer with 14+ years in the Salesforce ecosystem, co-leader of the London Salesforce Developer Group and RAD Women mentor.';

/** Profile photo: home page share image and the schema.org Person image. */
export const SITE_IMAGE = '/img/EllieMatthewman(Square).jpg';

/** External profiles that belong to Ellie, for schema.org `sameAs`. */
export const PROFILE_URLS = [
  'https://www.linkedin.com/in/elliematthewman',
  'https://github.com/EllieAtWHL',
  'https://www.salesforce.com/trailblazer/elliematthewman',
  'https://bsky.app/profile/ellieatwhl.co.uk',
] as const;

const PERSON_ID = `${SITE_URL}/#person`;

/** schema.org JSON-LD for the home page: who the site is about, and the site itself. */
export function buildHomeStructuredData() {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Person',
        '@id': PERSON_ID,
        name: SITE_NAME,
        alternateName: ['Eleanor Matthewman', 'EllieAtWHL'],
        url: SITE_URL,
        image: `${SITE_URL}${SITE_IMAGE}`,
        jobTitle: 'Salesforce Developer',
        description: SITE_DESCRIPTION,
        knowsAbout: ['Salesforce', 'Salesforce development', 'Mentoring'],
        award: ['Salesforce Golden Hoodie (2026)'],
        sameAs: [...PROFILE_URLS],
      },
      {
        '@type': 'WebSite',
        '@id': `${SITE_URL}/#website`,
        url: SITE_URL,
        name: SITE_NAME,
        alternateName: 'EllieAtWHL',
        publisher: { '@id': PERSON_ID },
      },
    ],
  };
}

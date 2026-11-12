import nextConfig from '../../next.config';

// Guards the CSP entries third-party integrations need but that can't fail
// visibly in dev or in Playwright (both run on localhost, where the contact
// form skips reCAPTCHA and simulates submission). WEB-242: the WEB-70 CSP
// silently blocked reCAPTCHA and the form's POST to Salesforce in production
// for three months, so no contact form message got through.
async function cspDirectives(): Promise<Map<string, string[]>> {
  const rules = await nextConfig.headers!();
  const siteWide = rules.find((rule) => rule.source === '/(.*)');
  const csp = siteWide?.headers.find((h) => h.key === 'Content-Security-Policy')?.value ?? '';

  return new Map(
    csp
      .split(';')
      .map((directive) => directive.trim().split(/\s+/))
      .filter((parts) => parts[0])
      .map(([name, ...sources]) => [name, sources])
  );
}

describe('Content-Security-Policy', () => {
  it('lets Google reCAPTCHA load its script and widget iframe (contact form)', async () => {
    const csp = await cspDirectives();

    expect(csp.get('script-src')).toEqual(
      expect.arrayContaining(['https://www.google.com/recaptcha/', 'https://www.gstatic.com/recaptcha/'])
    );
    expect(csp.get('frame-src')).toEqual(
      expect.arrayContaining(['https://www.google.com/recaptcha/', 'https://recaptcha.google.com/recaptcha/'])
    );
  });

  it('lets the contact form post to Salesforce Web-to-Lead, and nowhere else off-site', async () => {
    const csp = await cspDirectives();

    expect(csp.get('form-action')).toEqual(["'self'", 'https://webto.salesforce.com']);
  });
});

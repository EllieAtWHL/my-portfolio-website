'use client';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { useEffect, useState, useSyncExternalStore } from 'react';
import MainSitePage from '@/components/MainSitePage';
import { trackFormInteraction, trackPageView } from '@/lib/fullstory';
import { SITE_URL } from '@/lib/site';
import { allChoices, useCookieConsent } from '@/components/CookieConsentProvider';

// The page's origin, read in a way that keeps the server render and the first
// client render identical (both use the null server snapshot during
// hydration; React then re-renders with the real value). Reading
// window.location directly during render made the server and client disagree
// about the Send button's `disabled` and the hidden retURL value, and React
// doesn't repair mismatched attributes after hydration (WEB-242).
const subscribeToNothing = () => () => {};
const getOrigin = () => window.location.origin;
const getServerOrigin = () => null;

// WEB-242: the "did you message me while the form was broken?" notice hides
// itself after this date; WEB-243 tracks removing it from the code. Read via
// useSyncExternalStore with the server snapshot "show", so the prerendered
// HTML and hydration always agree and the browser hides it straight after if
// the date has passed (the page is static, so the server can't decide).
const MISSED_MESSAGES_NOTICE_UNTIL = Date.UTC(2027, 1, 12); // 12 Feb 2027
const isMissedMessagesNoticeCurrent = () => Date.now() < MISSED_MESSAGES_NOTICE_UNTIL;
const showMissedMessagesNoticeOnServer = () => true;

// Salesforce's generated Web-to-Lead snippet keeps the captcha_settings
// timestamp fresh until the visitor completes reCAPTCHA.
function refreshCaptchaTimestamp() {
  const response = document.getElementById('g-recaptcha-response') as HTMLTextAreaElement | null;
  if (response && response.value.trim() !== '') return;

  const captchaSettings = document.getElementsByName('captcha_settings')[0] as HTMLInputElement | undefined;
  if (!captchaSettings?.value) return;

  const settings = JSON.parse(captchaSettings.value);
  settings.ts = JSON.stringify(new Date().getTime());
  captchaSettings.value = JSON.stringify(settings);
}

declare global {
  interface Window {
    onContactRecaptchaSuccess?: () => void;
  }
}

export default function ContactMe() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [captchaError, setCaptchaError] = useState(false);
  const { hasConsent, isConsentKnown, choices, saveChoices } = useCookieConsent();
  const allowsRecaptcha = hasConsent('spamProtection');

  const origin = useSyncExternalStore(subscribeToNothing, getOrigin, getServerOrigin);
  const showMissedMessagesNotice = useSyncExternalStore(
    subscribeToNothing,
    isMissedMessagesNoticeCurrent,
    showMissedMessagesNoticeOnServer
  );
  const isLocalhost = origin !== null && new URL(origin).hostname === 'localhost';
  // Salesforce Web-to-Lead has "Require reCAPTCHA Verification" switched on,
  // so it silently discards any submission without a valid reCAPTCHA
  // response - the visitor still lands on the thank-you page, but the message
  // never arrives (WEB-242). Outside localhost (where submission is
  // simulated) the form therefore only sends once reCAPTCHA is allowed, and
  // handleSubmit also checks it was completed.
  const needsRecaptcha = origin !== null && !isLocalhost;
  const canSend = origin !== null && (isLocalhost || (isConsentKnown && allowsRecaptcha));
  const showSpamProtectionNeeded = needsRecaptcha && isConsentKnown && !allowsRecaptcha;

  // Turns on the Spam protection category only, keeping the visitor's other
  // choices as they were (all off if they hadn't answered the banner yet).
  const allowSpamProtection = () => {
    saveChoices({ ...(choices ?? allChoices(false)), spamProtection: true });
  };

  useEffect(() => {
    trackPageView('/contact-me', 'Contact Me');
  }, []);

  // A page restored from the back/forward cache (e.g. Back from the thank-you
  // page) keeps its "Sending..." state, which would leave Send stuck.
  useEffect(() => {
    const resetOnRestore = (event: PageTransitionEvent) => {
      if (event.persisted) setIsSubmitting(false);
    };
    window.addEventListener('pageshow', resetOnRestore);
    return () => window.removeEventListener('pageshow', resetOnRestore);
  }, []);

  useEffect(() => {
    // reCAPTCHA sets a Google cookie, so it stays off until the visitor
    // allows the spam protection category (WEB-102/WEB-104) - see the
    // explanation rendered below where the widget would otherwise appear.
    if (!needsRecaptcha || !allowsRecaptcha) {
      return;
    }

    // Named in the widget's data-callback: clears the "tick the box" error
    // as soon as the visitor completes reCAPTCHA.
    window.onContactRecaptchaSuccess = () => setCaptchaError(false);

    const script = document.createElement('script');
    script.src = 'https://www.google.com/recaptcha/api.js';
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);

    const timestampInterval = window.setInterval(refreshCaptchaTimestamp, 500);

    return () => {
      window.clearInterval(timestampInterval);
      delete window.onContactRecaptchaSuccess;
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, [needsRecaptcha, allowsRecaptcha]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;

    // Send is disabled when it can't send, but guard anyway (e.g. Enter key).
    if (!canSend) return;

    if (needsRecaptcha) {
      const response = form.querySelector<HTMLTextAreaElement>('[name="g-recaptcha-response"]');
      if (!response || response.value.trim() === '') {
        setCaptchaError(true);
        return;
      }
    }

    setCaptchaError(false);
    setIsSubmitting(true);

    // Track form start
    trackFormInteraction('contact', 'start');

    // For localhost, simulate form submission and redirect immediately
    if (isLocalhost) {
      // Simulate a brief delay for UX
      await new Promise(resolve => setTimeout(resolve, 1000));
      trackFormInteraction('contact', 'success');
      window.location.href = '/contact-me/thank-you';
      return;
    }

    // For production, submit to Salesforce normally
    form.submit();
  };

  if (submitStatus === 'success') {
    return (
      <MainSitePage>
        <div className="content-with-footer">
          <div className="scrollable">
            <div className="max-w-2xl mx-auto text-center">
              <div className="mb-8">
                <div className="w-20 h-20 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-10 h-10 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h1 className="heading-1">
                  Thank You!
                </h1>
                <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
                  Your message has been successfully submitted.
                </p>
              </div>
            </div>
          </div>
        </div>
      </MainSitePage>
    );
  }

  return (
    <MainSitePage>
      <div className="content-with-footer">
        <div className="scrollable">
          <div className="max-w-2xl mx-auto">
            <div className="text-center">
              <h1 className="heading-1">
                Get In Touch
              </h1>
              <p className="text-lg form-label">
                I&apos;d love to hear from you! Whether you have a question, want to collaborate, or just want to say hello.
              </p>
            </div>

            <div className="max-w-2xl mx-auto">
              {/* WEB-242: from WEB-70's CSP going live (5 Aug 2026) until the fix
                  deployed, the browser blocked every submission, so no message
                  reached Salesforce. Tells anyone who wrote in then to resend.
                  Hides itself after MISSED_MESSAGES_NOTICE_UNTIL; WEB-243 removes it. */}
              {showMissedMessagesNotice && (
              <div className="outdated-banner" role="note" aria-labelledby="missed-messages-title">
                <div className="banner-content">
                  <h2 id="missed-messages-title" className="banner-title">
                    Did you message me between 5 August and 12 November 2026?
                  </h2>
                  <p className="banner-text">
                    A technical problem stopped this form from delivering messages during that time,
                    so I never received yours. Sorry about that! It&apos;s fixed now, so please send
                    it again.
                  </p>
                </div>
              </div>
              )}

              <form 
                action="https://webto.salesforce.com/servlet/servlet.WebToLead?encoding=UTF-8" 
                method="POST" 
                className="space-y-6"
                onSubmit={handleSubmit}
              >
                <Card variant="accent" padding="md">
                  <input 
                    type="hidden" 
                    name='captcha_settings' 
                    value={isLocalhost ? '' : '{"keyname":"EllieAtWHL","fallback":"true","orgId":"00D58000000YxlM","ts":""}'}
                  />
                  <input 
                    type="hidden" 
                    name="oid" 
                    value="00D58000000YxlM"
                  />
                  <input 
                    type="hidden" 
                    name="retURL" 
                    // Absolute, because Salesforce redirects here from its own domain.
                    value={`${origin ?? SITE_URL}/contact-me/thank-you`}
                  />
                  
                  {/* NOTE: These fields are optional debugging elements. Please uncomment */}
                  {/* these lines if you wish to test in debug mode. */}
                  {/* <input type="hidden" name="debug" value="1" /> */}
                  {/* <input type="hidden" name="debugEmail" */}
                  {/* value="eleanormatthewman+salesforce@gmail.com" /> */}
                  
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label htmlFor="first_name" className="block text-sm font-semibold form-label">
                        First Name
                      </label>
                      <input 
                        id="first_name" 
                        maxLength={40} 
                        name="first_name" 
                        size={20} 
                        type="text"
                        className="w-full border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors duration-200 form-input-tall"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label htmlFor="last_name" className="block text-sm font-semibold form-label">
                        Last Name
                      </label>
                      <input 
                        id="last_name" 
                        maxLength={80} 
                        name="last_name" 
                        size={20} 
                        type="text"
                        className="w-full border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors duration-200 form-input-tall"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="email" className="block text-sm font-semibold form-label">
                      Email
                    </label>
                    <input 
                      id="email" 
                      maxLength={80} 
                      name="email" 
                      size={20} 
                      type="email"
                      className="w-full border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors duration-200 form-input-tall"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="description" className="block text-sm font-semibold form-label">
                      Message
                    </label>
                    <textarea 
                      id="description" 
                      rows={6} 
                      name="description"
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-2xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors duration-200 resize-none form-textarea"
                      required
                    />
                  </div>

                  {needsRecaptcha && isConsentKnown && (
                    allowsRecaptcha ? (
                      <div className="flex flex-col items-center gap-2 p-8">
                        <div
                          className="g-recaptcha"
                          data-sitekey="6LfUBQEfAAAAAOwXkILtp2Amwf_U6Ouoza-xsGZT"
                          data-callback="onContactRecaptchaSuccess"
                        />
                        {captchaError && (
                          <p role="alert" className="text-sm font-semibold text-red-600 dark:text-red-400">
                            Please tick &quot;I&apos;m not a robot&quot; before sending.
                          </p>
                        )}
                      </div>
                    ) : (
                      <div id="spam-protection-needed" className="text-sm text-center form-label p-4 space-y-3">
                        <p>
                          {"This form uses Google reCAPTCHA to keep out spam, and can't send a message without it. reCAPTCHA sets a Google cookie, so it stays off until you allow \"Spam protection\"."}
                        </p>
                        <Button type="button" variant="secondary" size="sm" onClick={allowSpamProtection}>
                          Allow spam protection
                        </Button>
                      </div>
                    )
                  )}

                  <div className="pt-4">
                    <Button
                      type="submit"
                      variant="primary"
                      size="lg"
                      fullWidth
                      // Disabled until the form can actually deliver a message, so
                      // nothing is sent into Salesforce's silent discard (WEB-242).
                      disabled={isSubmitting || !canSend}
                      aria-describedby={showSpamProtectionNeeded ? 'spam-protection-needed' : undefined}
                    >
                      {isSubmitting ? 'Sending...' : 'Send Message'}
                    </Button>
                  </div>
                </Card>
              </form>
            </div>
          </div>
        </div>
      </div>
    </MainSitePage>
  );
}

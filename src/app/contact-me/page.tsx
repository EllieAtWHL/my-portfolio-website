'use client';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { useEffect, useState } from 'react';
import MainSitePage from '@/components/MainSitePage';
import { trackFormInteraction, trackPageView } from '@/lib/fullstory';
import { useCookieConsent } from '@/components/CookieConsentProvider';

export default function ContactMe() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const { consent } = useCookieConsent();

  useEffect(() => {
    trackPageView('/contact-me', 'Contact Me');
  }, []);

  useEffect(() => {
    // Only load reCAPTCHA for non-localhost environments
    if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
      return;
    }

    // reCAPTCHA sets a Google cookie, so it stays off until the visitor
    // accepts cookies (WEB-102) - see the fallback message rendered below
    // where the widget would otherwise appear.
    if (consent !== 'accepted') {
      return;
    }

    // Load Google reCAPTCHA script
    const script = document.createElement('script');
    script.src = 'https://www.google.com/recaptcha/api.js';
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);

    // Timestamp function for reCAPTCHA
    const timestampScript = document.createElement('script');
    timestampScript.text = `
      function timestamp() { 
        var response = document.getElementById("g-recaptcha-response"); 
        if (response == null || response.value.trim() == "") {
          var captchaSettings = document.getElementsByName("captcha_settings")[0];
          if (captchaSettings && captchaSettings.value) {
            var elems = JSON.parse(captchaSettings.value);
            elems["ts"] = JSON.stringify(new Date().getTime());
            captchaSettings.value = JSON.stringify(elems); 
          }
        } 
      } 
      setInterval(timestamp, 500);
    `;
    document.head.appendChild(timestampScript);

    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
      if (document.head.contains(timestampScript)) {
        document.head.removeChild(timestampScript);
      }
    };
  }, [consent]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Track form start
    trackFormInteraction('contact', 'start');

    // For localhost, simulate form submission and redirect immediately
    if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
      // Simulate a brief delay for UX
      await new Promise(resolve => setTimeout(resolve, 1000));
      trackFormInteraction('contact', 'success');
      window.location.href = '/contact-me/thank-you';
      return;
    }

    // For production, submit to Salesforce normally
    const form = e.currentTarget;
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
                    value={typeof window !== 'undefined' && window.location.hostname === 'localhost' ? '' : '{"keyname":"EllieAtWHL","fallback":"true","orgId":"00D58000000YxlM","ts":""}'}
                  />
                  <input 
                    type="hidden" 
                    name="oid" 
                    value="00D58000000YxlM"
                  />
                  <input 
                    type="hidden" 
                    name="retURL" 
                    value={typeof window !== 'undefined' ? `${window.location.origin}/contact-me/thank-you` : '/contact-me/thank-you'}
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

                  {typeof window !== 'undefined' && window.location.hostname !== 'localhost' && (
                    consent === 'accepted' ? (
                      <div className="flex justify-center p-8">
                        <div
                          className="g-recaptcha"
                          data-sitekey="6LfUBQEfAAAAAOwXkILtp2Amwf_U6Ouoza-xsGZT"
                        />
                      </div>
                    ) : (
                      <p className="text-sm text-center form-label p-4">
                        Please accept cookies (see the banner, or &quot;Cookie preferences&quot; in the
                        footer) to enable spam protection for this form.
                      </p>
                    )
                  )}

                  <div className="pt-4">
                    <Button
                      type="submit"
                      variant="primary"
                      size="lg"
                      fullWidth
                      disabled={isSubmitting}
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

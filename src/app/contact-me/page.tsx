'use client';

import Footer from '@/components/Footer';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { useEffect } from 'react';

export default function ContactMe() {
  useEffect(() => {
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
      document.head.removeChild(script);
      document.head.removeChild(timestampScript);
    };
  }, []);

  return (
    <div className="content">
      <div className="scrollable">
          <div className="max-w-2xl mx-auto">
            <div className="text-center">
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-green-600 to-green-400 bg-clip-text text-transparent">
                Get In Touch
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-300">
                I'd love to hear from you! Whether you have a question, want to collaborate, or just want to say hello.
              </p>
            </div>

            <div className="max-w-2xl mx-auto">
              <form 
                action="https://webto.salesforce.com/servlet/servlet.WebToLead?encoding=UTF-8" 
                method="POST" 
                className="space-y-6"
                >
                <Card variant="accent" padding="md">
                  <input 
                    type="hidden" 
                    name='captcha_settings' 
                    value='{"keyname":"EllieAtWHL","fallback":"true","orgId":"00D58000000YxlM","ts":""}'
                  />
                  <input 
                    type="hidden" 
                    name="oid" 
                    value="00D58000000YxlM"
                  />
                  <input 
                    type="hidden" 
                    name="retURL" 
                    value="https://www.ellieatwhl.co.uk/contact-me/thank-you"
                  />
                  
                  {/* NOTE: These fields are optional debugging elements. Please uncomment */}
                  {/* these lines if you wish to test in debug mode. */}
                  {/* <input type="hidden" name="debug" value=1> */}
                  {/* <input type="hidden" name="debugEmail" */}
                  {/* value="eleanormatthewman+salesforce@gmail.com"> */}
                  
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label htmlFor="first_name" className="block text-sm font-semibold text-gray-700 dark:text-gray-200">
                        First Name
                      </label>
                      <input 
                        id="first_name" 
                        maxLength={40} 
                        name="first_name" 
                        size={20} 
                        type="text"
                        className="w-full border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors duration-200 form-input-tall"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label htmlFor="last_name" className="block text-sm font-semibold text-gray-700 dark:text-gray-200">
                        Last Name
                      </label>
                      <input 
                        id="last_name" 
                        maxLength={80} 
                        name="last_name" 
                        size={20} 
                        type="text"
                        className="w-full border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors duration-200 form-input-tall"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="email" className="block text-sm font-semibold text-gray-700 dark:text-gray-200">
                      Email Address
                    </label>
                    <input 
                      id="email" 
                      maxLength={80} 
                      name="email" 
                      size={20} 
                      type="email"
                      className="w-full border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors duration-200 form-input-tall"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="description" className="block text-sm font-semibold text-gray-700 dark:text-gray-200">
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

                  <div className="flex justify-center p-8">
                    <div 
                      className="g-recaptcha" 
                      data-sitekey="6LfUBQEfAAAAAOwXkILtp2Amwf_U6Ouoza-xsGZT"
                    />
                  </div>

                  <div className="pt-4">
                    <Button type="submit" variant="primary" size="lg" fullWidth className="button primary">
                      Send Message
                    </Button>
                  </div>
                </Card>
              </form>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}

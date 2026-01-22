import Footer from '@/components/Footer';
import MainSitePage from '@/components/MainSitePage';
import Link from 'next/link';
import { Button } from '@/components/Button';

export default function ThankYou() {
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
              <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-green-600 to-green-400 bg-clip-text text-transparent">
                Thank You!
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
                Your message has been successfully submitted.
              </p>
              <p className="text-lg text-gray-500 dark:text-gray-400 mb-12">
                I'll get back to you as soon as possible. Looking forward to connecting with you!
              </p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-100 dark:border-gray-700">
              <div className="space-y-4">
                <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-6">
                  What happens next?
                </h2>
                <div className="grid md:grid-cols-3 gap-6 text-left">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-3">
                      <span className="text-blue-600 dark:text-blue-400 font-bold">1</span>
                    </div>
                    <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">Review</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">I'll review your message carefully</p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mx-auto mb-3">
                      <span className="text-purple-600 dark:text-purple-400 font-bold">2</span>
                    </div>
                    <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">Respond</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">I'll craft a thoughtful response</p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-3">
                      <span className="text-green-600 dark:text-green-400 font-bold">3</span>
                    </div>
                    <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">Connect</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">We'll connect via email or call</p>
                  </div>
                </div>
              </div>
              
              <div className="mt-8 space-y-4">
                <Button variant="primary" size="lg" fullWidth asChild className="button primary">
                  <Link href="/">
                    Return to Home
                  </Link>
                </Button>
                <Button variant="secondary" size="lg" fullWidth asChild>
                  <Link href="/experience">
                    View My Experience
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </MainSitePage>
  );
}

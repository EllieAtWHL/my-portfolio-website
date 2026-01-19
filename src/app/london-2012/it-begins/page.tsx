import MainSitePage from '@/components/MainSitePage';
import London2012Layout from '@/components/London2012Layout';
import Image from 'next/image';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'EllieAtWHL - It Begins...',
  description: 'The journey of a volunteer performer at the Olympic Ceremonies',
  openGraph: {
    title: 'EllieAtWHL - My Olympic Journey',
    description: 'The journey of a volunteer performer at the Olympic Ceremonies',
    url: '/london-2012/it-begins',
    type: 'website',
    images: [
      {
        url: '/london-2012/Application.jpg',
        width: 800,
        height: 600,
        alt: 'Confirmation email of application',
      },
    ],
  },
};

export default function ItBeginsPage() {
  return (
    <MainSitePage>
      <London2012Layout
        date="16th August 2011"
        dateTime="2011-08-16"
      >
        <article>
          <h1 className="text-3xl font-bold mb-6">It Begins...</h1>

          <div className="space-y-6 text-lg">
            <p>
              People often ask me how I got involved in the Olympic Ceremonies. In all honesty, I don't remember the exact moment, but this is what I do know...
            </p>

            <p>
              Even before applying, I was obsessed with the Olympics. I spent way too much time during my maternity leave taking to the internet for any leads I could on how to get my hands on some tickets. I had already been in communication with a group of Twitter users, that I soon become part of, now known as "the 2012 Tweeps". A year before the ceremony, and before I even applied, I posted how excited I was - a whole year out!
            </p>

            {/* Facebook post placeholder - in real implementation, you might want to embed this properly */}
            <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg border border-gray-300 dark:border-gray-600">
              <p className="italic mb-2">Facebook post from 27 July 2011:</p>
              <p>"One year to go until the opening ceremony, I know some people are already bored of all the hype, but I don't think I ever will."</p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">Posted by Eleanor Matthewman</p>
            </div>

            <p>
              As I said, I don't remember exactly how I came across it, but I suspect there was a link on one of the many email newsletters that I'd signed up to, looking for volunteers for the ceremonies, and on seeing the advert, I posted on Facebook how I was "tempted to apply".
            </p>

            {/* Another Facebook post placeholder */}
            <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg border border-gray-300 dark:border-gray-600">
              <p className="italic mb-2">Facebook post from 16 August 2011:</p>
              <p>"So tempted to apply!"</p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">Posted by Eleanor Matthewman</p>
            </div>

            <p>
              Apply I did, and from what I remember, I didn't really think much of it, but that is where my official journey to become "part of the cultural record of London" began...
            </p>

            {/* Application confirmation image */}
            <div className="relative">
              <Image
                src="/london-2012/Application.jpg"
                alt="Confirmation email of application"
                width={800}
                height={600}
                className="w-full rounded-lg shadow-lg"
              />
            </div>
          </div>
        </article>
      </London2012Layout>
    </MainSitePage>
  );
}

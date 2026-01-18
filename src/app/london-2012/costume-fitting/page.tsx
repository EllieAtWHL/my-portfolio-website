import MainSitePage from '@/components/MainSitePage';
import London2012Sidebar from '@/components/London2012Sidebar';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'EllieAtWHL - Costume Fittings & Goodbye to 3 Mills',
  description: 'The journey of a volunteer performer at the Olympic Ceremonies',
  openGraph: {
    title: 'EllieAtWHL - My Olympic Journey',
    description: 'The journey of a volunteer performer at the Olympic Ceremonies',
    url: '/london-2012/costume-fitting',
    type: 'website',
  },
};

export default function CostumeFittingPage() {
  return (
    <MainSitePage>
      <div className="content min-h-screen bg-pale-green dark:bg-third-colour">
        <div className="flex flex-col lg:flex-row">
          {/* Sidebar */}
          <aside className="w-full lg:w-1/4 lg:fixed lg:left-0 lg:top-0 lg:h-screen lg:border-r lg:border-pale-green dark:lg:border-third-colour lg:pr-4 lg:py-8">
            <London2012Sidebar />
          </aside>

          {/* Main Content */}
          <main className="w-full lg:w-3/4 lg:ml-[25%] lg:pl-8 p-6">
            <article className="max-w-4xl mx-auto">
              {/* Date */}
              <div className="mb-6">
                <time className="date italic text-gray-600 dark:text-gray-400" dateTime="2012-05-29">
                  29th May 2012
                </time>
              </div>

              <h1 className="text-3xl font-bold mb-6">Costume Fittings & Goodbye to 3 Mills</h1>

              <div className="space-y-6 text-lg">
                <p>
                  Today, we were back to drumming rehearsals with a smaller group of 250 in group 51-A. I was assigned bib number 063 again. For the most part, we repeated everything we had learned the previous week, drilling the rhythms and techniques over and over. While some of the more experienced drummers might have been bored by this repetition, I was grateful for the extra practice as a novice drummer. We learned the rhythms using words to help us remember them, and two phrases in particular have stayed with me to this day: 'Play the drum, so your mum, can see you on TV' and 'I am in need of a drink!'.
                </p>

                <p>
                  Today marked a milestone in my journey to the ceremonies as I had my first costume fitting for both the drumming and the Opening Ceremony marshalling. The drumming costume was designed to evoke the Industrial Revolution, with a rough and dirty look. My outfit included trousers with a skirt layered over the top, a blouse, and a bonnet. An apron was initially included, but it was later removed. My marshalling costume consisted of black skinny jeans (which still had the Primark tag on them!) and a long-sleeved white top with a strange grass pattern on it. As I looked at myself in the mirror, I couldn't help but feel a sense of pride and determination. This was my chance to be a part of something special, to be a part of the Olympics. And as I stood there, ready to take on the challenge, I knew that I was ready for whatever lay ahead.
                </p>

                <p>
                  I couldn't help but notice that most of the row next to me - the 70's - was missing. It was a strange and unexpected sight, and I found myself wondering what could have caused such a large number of people to be absent. Despite my curiosity, I never did find out the reason for their absence. Nevertheless, the rehearsal went on as planned, and I remained focused on my own role and responsibilities. It was just one of those little mysteries that added an element of surprise to the journey towards the Olympic Games.
                </p>
              </div>
            </article>
          </main>
        </div>
      </div>
    </MainSitePage>
  );
}

import { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/Button';
import MatchCard from '@/components/spurs-women/MatchCard';
import NewsCard from '@/components/spurs-women/NewsCard';
import PodcastCard from '@/components/spurs-women/PodcastCard';
import VideoCard from '@/components/spurs-women/VideoCard';
import { getHomePageContent } from '@/lib/data';
import { Match, NewsArticle, YouTubeVideo } from '@/lib/data';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Home - Tottenham Hotspur Women',
    description: 'Latest news, matches, videos, and podcasts for Tottenham Hotspur Women FC',
  };
}

interface PodcastEpisode {
  title: string;
  episodeNumber: string;
  description: string;
  duration: string;
  publishDate: string;
  url: string;
  podcastName: string;
}

export default async function HomePage() {
  // Fetch data on server side using cached functions
  const contentData = await getHomePageContent();
  const { upcoming, previous, news, videos, podcasts } = contentData;

  return (
    <main className="p-8">
      <h1 className="spurs-text text-3xl font-bold mb-8 text-center">Tottenham Hotspur Women</h1>

      <div className="lg:grid lg:grid-cols-2 lg:gap-8 space-y-8 lg:space-y-0">
        {/* Upcoming Matches Section */}
        <section>
            <h2 className="text-2xl font-semibold mb-4">Next 3 Matches</h2>
            <div className="space-y-4">
              {upcoming.length > 0 ? (
                upcoming.map((match: Match) => (
                  <MatchCard key={match.id} match={match} />
                ))
              ) : (
                <p className="text-gray-500 italic">No upcoming matches scheduled</p>
              )}
            </div>
        </section>

        {/* Previous Matches Section */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">Previous 3 Matches</h2>
          <div className="space-y-4">
            {previous.length > 0 ? (
              previous.map((match: Match) => (
                <MatchCard key={match.id} match={match} />
              ))
            ) : (
              <p className="text-gray-500 italic">No previous matches</p>
              )}
          </div>
        </section>
      </div>

      {/* Link to Seasons page */}
      <div className="mt-12 text-center">
        <Button variant="spurs" asChild>
          <Link href="/spurs-women/seasons">
            View All Seasons
          </Link>
        </Button>
      </div>

      {/* News Sections */}
      <div className="mt-12 space-y-12">
        {/* Spurs Women News Section */}
        <section>
          <h2 className="text-2xl font-semibold mb-6 text-center">Latest Spurs Women News</h2>
          <div className="mt-6 mb-8 text-center">
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
              Curated feed from selected sources bringing you the latest Spurs Women news and updates
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {news.length > 0 ? (
              news.map((article: NewsArticle, index: number) => (
                <NewsCard key={`${article.guid}-${index}`} article={article} />
              ))
            ) : (
              <div className="col-span-full text-center text-gray-500 italic">
                No Spurs Women news available at the moment.
              </div>
            )}
          </div>
        </section>

        {/* Spurs Women Podcasts Section */}
        <section>
          <h2 className="text-2xl font-semibold mb-6 text-center">Latest Podcast Episodes</h2>
          <div className="mt-6 mb-8 text-center">
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
              Featuring N17 Women (dedicated Spurs Women podcast) and Hometown Glory (Spurs culture). These are independent podcast and are not affiliated with this website nor Tottenham Hotspur.
            </p>
          </div>
          <div className="grid md:grid-cols-1 lg:grid-cols-2 gap-6">
            {podcasts.length > 0 ? (
              podcasts.map((episode: PodcastEpisode, index: number) => (
                <PodcastCard key={`${episode.episodeNumber}-${index}`} episode={episode} />
              ))
            ) : (
              <div className="col-span-full text-center text-gray-500 italic">
                No podcast episodes available at the moment.
              </div>
            )}
          </div>
        </section>

        {/* Spurs Women Videos Section */}
        <section>
          <h2 className="text-2xl font-semibold mb-6 text-center">Latest Videos</h2>
          <div className="mt-6 mb-8 text-center">
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
              Official videos from the Spurs Women YouTube channel
            </p>
            <a
              href="https://www.youtube.com/@SpursWomen"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center spurs-text text-sm font-medium"
            >
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
              </svg>
              Visit Spurs Women YouTube
            </a>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {videos.length > 0 ? (
              videos.map((video: YouTubeVideo, index: number) => (
                <VideoCard key={`${video.videoId}-${index}`} video={video} />
              ))
            ) : (
              <div className="col-span-full text-center text-gray-500 italic">
                No videos available at the moment.
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

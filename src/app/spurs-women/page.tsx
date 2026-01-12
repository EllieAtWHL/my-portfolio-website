'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import MatchCard from '@/components/spurs-women/MatchCard';
import NewsCard from '@/components/spurs-women/NewsCard';
import PodcastCard from '@/components/spurs-women/PodcastCard';
import VideoCard from '@/components/spurs-women/VideoCard';
import { supabase } from '@/lib/supabase';

interface NewsArticle {
  title: string;
  link: string;
  pubDate: string;
  content: string;
  contentSnippet: string;
  guid: string;
  isoDate: string;
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

interface YouTubeVideo {
  title: string;
  link: string;
  pubDate: string;
  videoId: string;
  thumbnail: string;
  description: string;
}

export default function HomePage() {
  const [upcomingMatches, setUpcomingMatches] = useState<any[]>([]);
  const [previousMatches, setPreviousMatches] = useState<any[]>([]);
  const [spursNews, setSpursNews] = useState<NewsArticle[]>([]);
  const [podcastEpisodes, setPodcastEpisodes] = useState<PodcastEpisode[]>([]);
  const [videos, setVideos] = useState<YouTubeVideo[]>([]);
  const [matchesLoading, setMatchesLoading] = useState(true);
  const [newsLoading, setNewsLoading] = useState(true);

  useEffect(() => {
    // Set page title
    document.title = 'Home - Tottenham Hotspur Women';
    
    async function fetchMatches() {
      const now = new Date().toISOString();
      
      try {
        // Fetch upcoming matches (next 3)
        const { data: upcoming, error: upcomingError } = await supabase
          .from('matches')
          .select(`
            *,
            home_team:home_team_id(id, name, short_name, primary_color, secondary_color, is_tottenham),
            away_team:away_team_id(id, name, short_name, primary_color, secondary_color, is_tottenham),
            competitions(name, icon_svg)
          `)
          .gte('date', now)
          .order('date', { ascending: true })
          .limit(3);
        
        // Fetch previous matches (last 3)
        const { data: previous, error: previousError } = await supabase
          .from('matches')
          .select(`
            *,
            home_team:home_team_id(id, name, short_name, primary_color, secondary_color, is_tottenham),
            away_team:away_team_id(id, name, short_name, primary_color, secondary_color, is_tottenham),
            competitions(name, icon_svg)
          `)
          .lt('date', now)
          .order('date', { ascending: false })
          .limit(3);
        
        if (upcomingError) {
          console.error('Error fetching upcoming matches:', upcomingError);
          setUpcomingMatches([]);
        } else {
          setUpcomingMatches(upcoming || []);
        }
        
        if (previousError) {
          console.error('Error fetching previous matches:', previousError);
          setPreviousMatches([]);
        } else {
          setPreviousMatches(previous || []);
        }
      } catch (error) {
        console.error('Error fetching matches:', error);
        setUpcomingMatches([]);
        setPreviousMatches([]);
      }
      
      setMatchesLoading(false);
    }

    async function fetchNews() {
      try {
        const spursResponse = await fetch('/api/spurs-women-news');
        const spursData = await spursResponse.json();
        
        setSpursNews(spursData.news || []);
      } catch (error) {
        console.error('Error fetching news:', error);
      } finally {
        setNewsLoading(false);
      }
    }

    async function fetchPodcasts() {
      try {
        const response = await fetch('/api/podcasts');
        const data = await response.json();
        
        setPodcastEpisodes(data.episodes || []);
      } catch (error) {
        console.error('Error fetching podcasts:', error);
      }
    }

    async function fetchVideos() {
      try {
        const response = await fetch('/api/spurs-women-videos');
        const data = await response.json();
        
        setVideos(data.videos || []);
      } catch (error) {
        console.error('Error fetching videos:', error);
      }
    }

    // Start all fetches in parallel
    fetchMatches();
    fetchNews();
    fetchPodcasts();
    fetchVideos();
  }, []);

  return (
    <div className="container mx-auto px-4 max-w-7xl">
      <h1 className="text-3xl font-bold mb-8 text-center text-white">Tottenham Hotspur Women</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Upcoming Matches Section */}
        <div className="w-full">
          <h2 className="text-2xl font-semibold mb-4 text-white">Next 3 Matches</h2>
          <div className="space-y-4">
            {matchesLoading ? (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 spurs-spinner"></div>
                <span className="ml-2 text-spurs-gray">Loading matches...</span>
              </div>
            ) : upcomingMatches.length > 0 ? (
              upcomingMatches.map((match) => (
                <MatchCard key={match.id} match={match} />
              ))
            ) : (
              <p className="text-spurs-gray italic">No upcoming matches scheduled</p>
            )}
          </div>
        </div>

        {/* Previous Matches Section */}
        <div className="w-full">
          <h2 className="text-2xl font-semibold mb-4 text-white">Previous 3 Matches</h2>
          <div className="space-y-4">
            {matchesLoading ? (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 spurs-spinner"></div>
                <span className="ml-2 text-spurs-gray">Loading matches...</span>
              </div>
            ) : previousMatches.length > 0 ? (
              previousMatches.map((match) => (
                <MatchCard key={match.id} match={match} />
              ))
            ) : (
              <p className="text-spurs-gray italic">No previous matches</p>
            )}
          </div>
        </div>
      </div>

      {/* Link to Seasons page */}
      <div className="mt-12 text-center">
        <Link
          href="/spurs-women/seasons"
          className="spurs-button"
        >
          View All Seasons
        </Link>
      </div>

      {/* News Sections */}
      <div className="mt-12 space-y-12">
        {/* Spurs Women News Section */}
        <section>
          <h2 className="text-2xl font-semibold mb-6 text-center text-white">Latest Spurs Women News</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {newsLoading ? (
              <div className="col-span-full flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 spurs-spinner"></div>
                <span className="ml-2 text-spurs-gray">Loading news...</span>
              </div>
            ) : spursNews.length > 0 ? (
              spursNews.slice(0, 6).map((article, index) => (
                <NewsCard key={`${article.guid}-${index}`} article={article} />
              ))
            ) : (
              <div className="col-span-full text-center text-spurs-gray italic">
                No Spurs Women news available at the moment.
              </div>
            )}
          </div>
        </section>

        {/* Spurs Women Podcasts Section */}
        <section>
          <h2 className="text-2xl font-semibold mb-6 text-center text-white">Latest Podcast Episodes</h2>
          <div className="grid md:grid-cols-1 lg:grid-cols-2 gap-6">
            {podcastEpisodes.length > 0 ? (
              podcastEpisodes.slice(0, 2).map((episode, index) => (
                <PodcastCard key={`${episode.episodeNumber}-${index}`} episode={episode} />
              ))
            ) : (
              <div className="col-span-full text-center text-spurs-gray italic">
                No podcast episodes available at the moment.
              </div>
            )}
          </div>
          <div className="mt-6 text-center">
            <p className="text-spurs-gray text-sm mb-4">
              Featuring N17 Women (dedicated Spurs Women podcast) and Hometown Glory (Spurs culture)
            </p>
          </div>
        </section>

        {/* Spurs Women Videos Section */}
        <section>
          <h2 className="text-2xl font-semibold mb-6 text-center text-white">Latest Videos</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {videos.length > 0 ? (
              videos.map((video, index) => (
                <VideoCard key={`${video.videoId}-${index}`} video={video} />
              ))
            ) : (
              <div className="col-span-full text-center text-spurs-gray italic">
                No videos available at the moment.
              </div>
            )}
          </div>
          <div className="mt-6 text-center">
            <p className="text-spurs-gray text-sm mb-4">
              Official videos from the Spurs Women YouTube channel
            </p>
            <a
              href="https://www.youtube.com/@SpursWomen"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center spurs-link text-sm font-medium"
            >
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
              </svg>
              Visit Spurs Women YouTube
            </a>
          </div>
        </section>
      </div>
    </div>
  );
}

import Parser from 'rss-parser';

const parser = new Parser({
  timeout: 10000, // 10 second timeout for each RSS request
  customFields: {
    item: ['pubDate', 'content', 'contentSnippet']
  }
});

export interface NewsArticle {
  title: string;
  link: string;
  pubDate: string;
  content: string;
  contentSnippet: string;
  guid: string;
  isoDate: string;
  source?: string;
  isSpursRelated?: boolean;
}

export interface YouTubeVideo {
  title: string;
  link: string;
  pubDate: string;
  videoId: string;
  thumbnail: string;
  description: string;
}

// Sources for Spurs women's (prioritize dedicated sources but include professional coverage)
const spursSources = [
  'https://spurswomen.uk/feed/',
  'https://www.bbc.com/sport/football/womens-super-league/rss.xml',
  'https://equalizersoccer.com/feed/',
  'https://fawslfulltime.co.uk/feed/',
  'https://shekicks.net/feed/',
  'https://www.theguardian.com/football/womensfootball/rss',
];

export async function fetchSpursWomenNews(): Promise<NewsArticle[]> {
  // Fetch all RSS feeds in parallel instead of sequentially
  const feedPromises = spursSources.map(async (sourceUrl) => {
    try {
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('RSS fetch timeout')), 8000)
      );
      
      const feedPromise = parser.parseURL(sourceUrl);
      const feed = await Promise.race([feedPromise, timeoutPromise]) as any;
      
      // Check if the feed is valid RSS
      if (!feed.items || feed.items.length === 0) {
        console.error(`Invalid or empty RSS feed from ${sourceUrl}`);
        return [];
      }
      
      let sourceName = 'Unknown';
      if (sourceUrl.includes('spurswomen')) sourceName = 'Spurs Women Blog';
      else if (sourceUrl.includes('bbc')) sourceName = 'BBC Sport';
      else if (sourceUrl.includes('equalizersoccer')) sourceName = 'Equalizer Soccer';
      else if (sourceUrl.includes('fawslfulltime')) sourceName = 'WSL Full-Time';
      else if (sourceUrl.includes('shekicks')) sourceName = 'She Kicks';
      else if (sourceUrl.includes('theguardian')) sourceName = 'The Guardian';
      else if (sourceUrl.includes('football.london')) sourceName = 'Football London';

      const articles = feed.items.map((item: any) => ({
        title: item.title || '',
        link: item.link || '',
        pubDate: item.pubDate || '',
        content: item.content || '',
        contentSnippet: item.contentSnippet || '',
        guid: item.guid || '',
        isoDate: item.isoDate || '',
        source: sourceName
      }));
      
      return articles;
    } catch (error) {
      console.error(`Error fetching from ${sourceUrl}:`, error);
      return [];
    }
  });

  // Wait for all feeds to complete in parallel
  const allArticlesArrays = await Promise.all(feedPromises);
  const allArticles = allArticlesArrays.flat();
  
  // Filter for Spurs women's content only
  const spursWomenNews = allArticles.filter(article => {
    const title = article.title.toLowerCase();
    const content = article.contentSnippet.toLowerCase();
    const contentText = article.content.toLowerCase();
    
    // Priority 1: Dedicated Spurs Women source - include everything
    if (article.source === 'Spurs Women Blog') {
      return true;
    }
    
    // Priority 2: Other sources - require explicit Tottenham/Spurs mentions
    const spursKeywords = [
      'tottenham', 'spurs', 'hotspur', 'n17', 'lilywhite',
      'bethany england', 'martin ho', 'clare hunt', 'signe gaupset', 
      'hanna wijk', 'matilda nilden', 'maika hamano'
    ];
    
    // Strong men's indicators to exclude
    const strongMensKeywords = [
      'premier league', 'men\'s team',
      'men\'s', 'male', 'premier', 'championship'
    ];
    
    const hasSpursKeywords = spursKeywords.some(keyword => 
      title.includes(keyword) || 
      content.includes(keyword) || 
      contentText.includes(keyword)
    );
    
    const hasStrongMensKeywords = strongMensKeywords.some(keyword => 
      title.includes(keyword) || 
      content.includes(keyword) || 
      contentText.includes(keyword)
    );
    
    // Include if: (dedicated source) OR (has spurs keywords AND no strong men's indicators)
    return article.source === 'Spurs Women Blog' || (hasSpursKeywords && !hasStrongMensKeywords);
  });

  // Sort by date (newest first) and limit to 10
  return spursWomenNews
    .sort((a, b) => new Date(b.isoDate).getTime() - new Date(a.isoDate).getTime())
    .slice(0, 10);
}

export async function fetchSpursWomenVideos(): Promise<YouTubeVideo[]> {
  // Only keep the working YouTube channel
  const channelUrls = [
    'https://www.youtube.com/feeds/videos.xml?channel_id=UCMl-nJrOKm3oRJprlb27Ptw'
  ];

  // Fetch videos from the working channel
  const videoPromises = channelUrls.map(async (channelUrl) => {
    try {
      const feed = await parser.parseURL(channelUrl);
      
      if (!feed.items || feed.items.length === 0) {
        return null;
      }

      const videos = feed.items.slice(0, 6).map(item => {
        // Extract video ID from different YouTube URL formats
        let videoId = '';
        if (item.link) {
          videoId = item.link.match(/v=([^&]+)/)?.[1] || 
                   item.link.match(/\.be\/([^?]+)/)?.[1] ||
                   item.link.match(/\/shorts\/([^?]+)/)?.[1] || '';
        }
        
        return {
          title: item.title || '',
          link: item.link || '',
          pubDate: item.pubDate || '',
          videoId: videoId,
          thumbnail: videoId ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg` : '',
          description: item.content || item.contentSnippet || ''
        };
      });

      console.log(`Successfully fetched ${videos.length} videos from ${channelUrl}`);
      return videos;
    } catch (error) {
      console.log(`Failed to fetch from ${channelUrl}:`, error instanceof Error ? error.message : 'Unknown error');
      return null;
    }
  });

  // Wait for all requests and return the first successful result
  const results = await Promise.all(videoPromises);
  const successfulResult = results.find(result => result !== null);

  if (successfulResult) {
    return successfulResult;
  }

  console.error('All YouTube channel URLs failed');
  return [];
}
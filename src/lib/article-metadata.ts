export interface ArticleMetadata {
  favicon?: string;
  image?: string;
  title?: string;
  siteName?: string;
}

// Function to fetch favicon for a URL
export async function fetchFavicon(url: string): Promise<string | null> {
  try {
    const urlObj = new URL(url);
    const domain = urlObj.origin;
    
    // Try Google's favicon service first (most reliable)
    const googleFavicon = `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
    
    try {
      const response = await fetch(googleFavicon, { method: 'HEAD' });
      if (response.ok) {
        return googleFavicon;
      }
    } catch (error) {
      // Continue to fallback options
    }

    // Fallback to common favicon paths
    const faviconPaths = [
      `${domain}/favicon.ico`,
      `${domain}/favicon.png`,
      `${domain}/apple-touch-icon.png`,
    ];

    for (const faviconUrl of faviconPaths) {
      try {
        const response = await fetch(faviconUrl, { method: 'HEAD' });
        if (response.ok) {
          return faviconUrl;
        }
      } catch (error) {
        // Continue to next favicon URL
        continue;
      }
    }

    return null;
  } catch (error) {
    console.error('Error fetching favicon:', error);
    return null;
  }
}

// Function to fetch article metadata (simplified version)
export async function fetchArticleMetadata(url: string): Promise<ArticleMetadata | null> {
  try {
    // First try to get favicon
    const favicon = await fetchFavicon(url);
    
    // Try to get basic title from a simple approach
    let title = null;
    let siteName = null;
    
    try {
      // Use a simpler approach - just try to get the favicon first
      const urlObj = new URL(url);
      siteName = urlObj.hostname.replace('www.', '');
    } catch (error) {
      console.error('Error parsing URL:', error);
    }

    return {
      favicon: favicon || undefined,
      title: title || undefined,
      siteName: siteName || undefined
    };
  } catch (error) {
    console.error('Error fetching article metadata:', error);
    return null;
  }
}

// Function to batch fetch metadata for multiple articles
export async function fetchMultipleArticleMetadata(urls: string[]): Promise<Map<string, ArticleMetadata>> {
  const metadataMap = new Map<string, ArticleMetadata>();
  
  // Fetch metadata for all URLs in parallel with a delay to avoid rate limiting
  const promises = urls.map(async (url, index) => {
    // Add a small delay between requests
    await new Promise(resolve => setTimeout(resolve, index * 100));
    
    try {
      const metadata = await fetchArticleMetadata(url);
      if (metadata) {
        metadataMap.set(url, metadata);
      }
    } catch (error) {
      console.error(`Failed to fetch metadata for ${url}:`, error);
    }
  });

  await Promise.all(promises);
  
  return metadataMap;
}

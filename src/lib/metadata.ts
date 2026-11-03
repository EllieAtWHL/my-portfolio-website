import { Metadata } from 'next';

// Spurs Women only. Titles are `absolute` so the root layout's
// "%s | Ellie Matthewman" template (WEB-238) never brands fan-site pages -
// spurs-women/layout.tsx's own template can't cover spurs-women/page.tsx,
// because a layout's template only applies to child segments.

/**
 * Helper function to generate consistent metadata for pages
 */
export function generatePageMetadata(title: string, description: string): Metadata {
  return {
    title: { absolute: title },
    description,
  };
}

/**
 * Helper function to generate metadata with default values
 */
export function generateDefaultMetadata(pageName: string): Metadata {
  return {
    title: { absolute: `${pageName} - Tottenham Hotspur Women` },
    description: `Browse ${pageName.toLowerCase()} for Tottenham Hotspur Women FC`,
  };
}

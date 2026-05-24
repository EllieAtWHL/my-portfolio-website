import { Metadata } from 'next';

/**
 * Helper function to generate consistent metadata for pages
 */
export function generatePageMetadata(title: string, description: string): Metadata {
  return {
    title,
    description,
  };
}

/**
 * Helper function to generate metadata with default values
 */
export function generateDefaultMetadata(pageName: string): Metadata {
  return {
    title: `${pageName} - Tottenham Hotspur Women`,
    description: `Browse ${pageName.toLowerCase()} for Tottenham Hotspur Women FC`,
  };
}

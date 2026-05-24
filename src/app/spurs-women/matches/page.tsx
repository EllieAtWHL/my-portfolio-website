import { Metadata } from 'next';
import MatchesClient from './MatchesClient';
import { generatePageMetadata } from '@/lib/metadata';

export async function generateMetadata(): Promise<Metadata> {
  return generatePageMetadata(
    'Matches - Tottenham Hotspur Women',
    'Browse all Tottenham Hotspur Women matches with comprehensive filtering'
  );
}

export default function MatchesPage() {
  return <MatchesClient />;
}

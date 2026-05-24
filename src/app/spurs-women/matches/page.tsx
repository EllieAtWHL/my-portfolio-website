import { Metadata } from 'next';
import MatchesClient from './MatchesClient';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Matches - Tottenham Hotspur Women',
    description: 'Browse all Tottenham Hotspur Women matches with comprehensive filtering',
  };
}

export default function MatchesPage() {
  return <MatchesClient />;
}

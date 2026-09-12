import { Metadata } from 'next';
import PlayersClient from './PlayersClient';
import { generatePageMetadata } from '@/lib/metadata';

export async function generateMetadata(): Promise<Metadata> {
  return generatePageMetadata(
    'Players - Tottenham Hotspur Women',
    'Browse the full Tottenham Hotspur Women squad'
  );
}

export default function PlayersPage() {
  return <PlayersClient />;
}

import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About - Tottenham Hotspur Women',
  description: 'Learn about this Tottenham Hotspur Women fan website and its mission',
};

export default function About() {
  return (
    <main className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">About This Site</h1>
      
      <div className="prose prose-lg dark:prose-invert">
        <p className="text-lg leading-relaxed mb-6">
          Welcome to my personal Tottenham Hotspur Women hub - a digital scrapbook where I capture and relive every match experience.
        </p>
        
        <h2 className="text-2xl font-semibold mt-8 mb-4">What This Is</h2>
        <p className="mb-4">
          This site is my personal archive for following the Spurs Women journey. Here I document:
        </p>
        <ul className="list-disc pl-6 mb-6 space-y-2">
          <li>Match photos and memories from games I've attended</li>
          <li>Detailed match records with scores and competition information</li>
          <li>Personal notes and experiences from each match</li>
          <li>Season-by-season progression of the team</li>
        </ul>
        
        <h2 className="text-2xl font-semibold mt-8 mb-4">Future Plans</h2>
        <p className="mb-4">
          I'm continuously expanding this platform to become the ultimate resource for Spurs Women data and statistics:
        </p>
        <ul className="list-disc pl-6 mb-6 space-y-2">
          <li>Advanced match database with searchable and filterable statistics</li>
          <li>Detailed player performance tracking and analytics</li>
          <li>Season comparisons and historical trends</li>
          <li>Interactive reports and data visualizations</li>
          <li>Head-to-head records and team statistics</li>
        </ul>
        
        <h2 className="text-2xl font-semibold mt-8 mb-4">The Vision</h2>
        <p className="mb-4">
          My goal is to create a comprehensive one-stop shop that combines both personal match experiences with detailed team statistics. Whether you're looking for match results, want to browse through photo galleries, or dive deep into team analytics - this site aims to be the definitive resource for everything Tottenham Hotspur Women.
        </p>
        
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-8 italic">
          Built with passion for Spurs Women and powered by Next.js, Tailwind CSS, and Supabase.
        </p>
        
        <div className="mt-8 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg border-l-4 border-gray-400 dark:border-gray-600">
          <p className="text-sm text-gray-700 dark:text-gray-300 font-medium">
            <strong>Disclaimer:</strong> This is an unofficial fan website and is not affiliated with, endorsed by, or connected to Tottenham Hotspur Football Club or any of its official partners. All match data, statistics, and content are for personal use and entertainment purposes only.
          </p>
        </div>
      </div>
    </main>
  );
}

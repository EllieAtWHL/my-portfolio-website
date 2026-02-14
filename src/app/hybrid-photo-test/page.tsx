import MediaGallery from '@/components/spurs-women/MediaGallery';
import { PhotoMedia } from '@/lib/data/media';

// Test data demonstrating hybrid photo loading system
const hybridTestPhotos: PhotoMedia[] = [
  {
    id: 'github-album-1',
    match_id: 1,
    type: 'photo album',
    url: '2025-26/20260208 WSL Spurs vs Chelsea', // GitHub-based: actual folder key from manifest
    caption: 'GitHub-based Gallery: Chelsea vs Spurs Women',
    title: null,
    thumbnail_url: null,
    description: null,
    source: null,
    date: null,
    sort_order: 1,
    created_at: new Date().toISOString(),
    storage_source: 'github'
  },
  {
    id: 'supabase-album-1',
    match_id: 1,
    type: 'photo album',
    url: 'storage/match-photos/2024-01-28-arsenal', // Supabase-based: storage path format
    caption: 'Supabase-based Gallery: Arsenal vs Spurs Women (Legacy)',
    title: null,
    thumbnail_url: null,
    description: null,
    source: null,
    date: null,
    sort_order: 2,
    created_at: new Date().toISOString(),
    storage_source: 'supabase'
  },
  {
    id: 'individual-photo-1',
    match_id: 1,
    type: 'photo',
    url: 'https://example.com/individual-photo.jpg',
    caption: 'Individual Photo (Unaffected by migration)',
    title: null,
    thumbnail_url: null,
    description: null,
    source: null,
    date: null,
    sort_order: 3,
    created_at: new Date().toISOString(),
    storage_source: null
  }
];

export default function HybridPhotoGalleryTest() {
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Hybrid Photo Gallery Test</h1>
        
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Mixed Storage System</h2>
          <p className="text-gray-600 mb-6">
            This page demonstrates the hybrid photo loading system that supports both 
            GitHub-based static hosting and Supabase Storage simultaneously during migration.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="font-semibold text-green-800 mb-2">✅ GitHub-based</h3>
              <p className="text-sm text-green-700">
                Images stored in repository, served as static assets
              </p>
              <code className="text-xs bg-green-100 px-1 rounded mt-1 block">
                url: "2026-02-08-chelsea"
              </code>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-800 mb-2">🔄 Supabase Storage</h3>
              <p className="text-sm text-blue-700">
                Legacy storage, still supported during migration
              </p>
              <code className="text-xs bg-blue-100 px-1 rounded mt-1 block">
                url: "storage/match-photos/2024-01-28-arsenal"
              </code>
            </div>
          </div>
          
          <MediaGallery photos={hybridTestPhotos} fullWidth={true} />
        </div>
        
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h3 className="font-semibold text-yellow-800 mb-4">Migration Benefits</h3>
          <ul className="text-sm text-yellow-700 space-y-2">
            <li>🔄 <strong>Gradual Migration:</strong> Move images one gallery at a time</li>
            <li>🚀 <strong>Zero Downtime:</strong> Existing galleries continue working</li>
            <li>📊 <strong>Visibility:</strong> Console logs show migration statistics</li>
            <li>🔀 <strong>Automatic Detection:</strong> System detects storage type automatically</li>
            <li>💰 <strong>Cost Savings:</strong> Migrated galleries use free static hosting</li>
          </ul>
          
          <div className="mt-4 p-3 bg-yellow-100 rounded">
            <p className="text-xs text-yellow-800">
              <strong>Developer Note:</strong> Check browser console for "Photo Storage Stats" 
              to see how many galleries use each storage type.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

import MediaGallery from '@/components/spurs-women/MediaGallery';
import { PhotoMedia } from '@/lib/data/media';

// Test data for photo gallery implementation
const testPhotos: PhotoMedia[] = [
  {
    id: 'test-album-1',
    match_id: 1,
    type: 'photo album',
    url: '2025-26/20260208 WSL Spurs vs Chelsea', // This is now the folder key from manifest
    caption: 'Chelsea vs Spurs Women - Test Gallery',
    title: null,
    thumbnail_url: null,
    description: null,
    source: null,
    date: null,
    sort_order: 1,
    created_at: new Date().toISOString(),
    storage_source: 'github'
  }
];

export default function PhotoGalleryTest() {
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Photo Gallery Test</h1>
        
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Testing GitHub-based Image Storage</h2>
          <p className="text-gray-600 mb-6">
            This page tests the new photo gallery implementation that uses GitHub-based static image hosting 
            instead of Supabase Storage. The images should load from the manifest file.
          </p>
          
          <MediaGallery photos={testPhotos} fullWidth={true} />
        </div>
        
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-800 mb-2">Implementation Details:</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>✅ Images stored in <code className="bg-blue-100 px-1 rounded">/public/spurs-women/photo-gallery/</code></li>
            <li>✅ Manifest generated at <code className="bg-blue-100 px-1 rounded">/public/spurs-women/photo-gallery.manifest.json</code></li>
            <li>✅ Build hooks configured in package.json</li>
            <li>✅ MediaGallery component updated to use manifest</li>
            <li>✅ No Supabase Storage dependencies for image loading</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
